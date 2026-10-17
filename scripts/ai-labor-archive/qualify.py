#!/usr/bin/env python3
"""Offline reconstruction in two new roots; genuine clocks stay outside result identity."""
import argparse
import gzip
import json
import os
from pathlib import Path
import subprocess
import sys
import archive as a


def canonical_payload(path):
    data=path.read_bytes()
    if path.suffix=='.gz':data=gzip.decompress(data)
    return (json.dumps(json.loads(data),sort_keys=True,indent=2,ensure_ascii=False,allow_nan=False)+'\n').encode()


def qualify(bundle,index,work,regressions=False):
    a.require(sys.version_info >= (3,10),'Python 3.10+ required (qualification: 3.13)')
    a.require(not work.exists(),'Work directory must be new')
    work.mkdir(parents=True)
    guard=work/'guard';guard.mkdir()
    (guard/'sitecustomize.py').write_text("import socket\ndef deny(*a,**k): raise RuntimeError('Offline qualification blocks network')\nsocket.create_connection=deny\nsocket.socket.connect=deny\nsocket.socket.connect_ex=deny\n")
    env=dict(os.environ,PYTHONPATH=str(guard.resolve()),PYTHONDONTWRITEBYTECODE='1')
    # Prevent app/session-specific side effects from ambient CI environment.
    env.pop('GITHUB_STEP_SUMMARY',None)
    logs=work/'logs';logs.mkdir();results=[]
    def run(root,label,*args):
        proc=subprocess.run([sys.executable,*map(str,args)],cwd=root,env=env,capture_output=True)
        log=proc.stdout+proc.stderr;(logs/(label+'.txt')).write_bytes(log)
        a.require(proc.returncode==0,label+' failed: '+log.decode()[-1500:])
        results.append(dict(check=label,exitCode=0,logSha256=a.sha(log)))
        return proc.stdout
    roots=[]
    for n in (1,2):
        root=work/f'root-{n}';a.hydrate(bundle,index,root);roots.append(root)
        labor=root/'research/ai-labor-transition'
        for prefix,script in [('phase1','scripts/cli.py'),('phase2','occupational/scripts/cli.py'),('phase3','outcomes/scripts/cli.py')]:
            run(root,f'{n}-{prefix}-accepted-validate',labor/script,'validate')
        # Frozen store replay preserves its original acceptance timestamps.
        store=labor/'monitor/history/qualification-store'
        out=labor/'monitor'
        run(root,f'{n}-monitor-frozen-replay',out/'cli.py','validate','--store',store,'--output',out)
        # Rebuild using exact accepted inputs in an independent hydrated copy.
        for prefix,script in [('phase1','scripts/cli.py'),('phase2','occupational/scripts/cli.py'),('phase3','outcomes/scripts/cli.py')]:
            extra=['--run-at',json.loads((labor/'normalized/current-summary.json').read_bytes())['pipelineRunAt']] if prefix=='phase1' else []
            run(root,f'{n}-{prefix}-normalize',labor/script,'normalize',*extra)
            run(root,f'{n}-{prefix}-rebuilt-validate',labor/script,'validate')
        fresh=work/f'monitor-store-{n}';outputs=work/f'monitor-output-{n}'
        run(root,f'{n}-monitor-dry-run',out/'cli.py','dry-run','--store',fresh,'--output',outputs)
        run(root,f'{n}-monitor-validate',out/'cli.py','validate','--store',fresh,'--output',outputs)
        run(root,f'{n}-monitor-repeat',out/'cli.py','dry-run','--store',fresh,'--output',outputs)
        current=json.loads((outputs/'current-monitor.json').read_bytes())
        a.require(current['economicChange']=='NO_ECONOMIC_CHANGE','Repeat monitor changed interpretation')
        a.require(current['evaluationId']=='9c65350db439ee246408614201380bef40971f79a4ea2968084b861ab8c4b747','Monitor baseline differs')
        run(root,f'{n}-monitor-recovery-package',out/'history/package.py',fresh,work/f'recovery-{n}','--apply')
        run(root,f'{n}-monitor-recovered-validate',out/'cli.py','validate','--store',work/f'recovery-{n}','--output',outputs)
        if n==1 and regressions:
            for prefix,tests in [('phase1','tests'),('phase2','occupational/tests'),('phase3','outcomes/tests'),('monitor','monitor/tests')]:
                run(root,f'{prefix}-regressions','-m','unittest','discover','-s',labor/tests,'-v')
    # Compare regenerated canonical artifacts to the frozen archive, not just each other.
    manifest,objects=a.read_archive(bundle,index)
    frozen={f['path']:objects[f['sha256']] for f in manifest['files']}
    maps={}
    for phase,name,subdir in [('phase2','occupation-output-manifest.json','normalized'),('phase3','output-manifest.json','outcomes')]:
        p='research/ai-labor-transition/'+subdir+'/'+name
        maps[phase]=json.loads(frozen[p])['artifacts']
        for name,digest in maps[phase].items():
            for root in roots:
                a.require(a.sha(canonical_payload(root/'research/ai-labor-transition'/subdir/name))==digest,'Accepted artifact changed')
    p1={}
    for provider in ('cps','ces','jolts','btos'):
        p=f'research/ai-labor-transition/normalized/providers/{provider}.json'
        p1[provider]=a.sha(frozen[p])
        for root in roots:a.require(a.sha((root/p).read_bytes())==p1[provider],'Accepted Phase1 changed')
    summary='research/ai-labor-transition/normalized/current-summary.json'
    for root in roots:a.require((root/summary).read_bytes()==frozen[summary],'Frozen macro context changed')
    report=dict(schema='ai-labor-archive-qualification-v1',stackCommit=a.STACK,
                archiveSha256=a.sha(bundle.read_bytes()),hydratedFiles=len(manifest['files']),
                network='socket connections denied in all Python subprocesses',
                roots=2,phase1AcceptedHashes=p1,phase2ArtifactMapHash=a.sha((json.dumps(maps['phase2'],sort_keys=True,indent=2,ensure_ascii=False)+'\n').encode()),
                phase3ArtifactMapHash=a.sha((json.dumps(maps['phase3'],sort_keys=True,indent=2,ensure_ascii=False)+'\n').encode()),
                monitorResultHash='9c65350db439ee246408614201380bef40971f79a4ea2968084b861ab8c4b747',checks=results,
                regressionsRun=regressions,rawCpsZipReconstruction=False,remoteDurableQualified=False)
    (work/'report.json').write_bytes(a.canonical(report))
    return report

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--archive',type=Path,required=True);p.add_argument('--index',type=Path,required=True);p.add_argument('--work',type=Path,required=True);p.add_argument('--regressions',action='store_true');x=p.parse_args()
    print(json.dumps(qualify(x.archive.resolve(),x.index.resolve(),x.work.resolve(),x.regressions),indent=2))
