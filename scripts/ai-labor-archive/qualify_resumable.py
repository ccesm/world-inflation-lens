#!/usr/bin/env python3
"""Resumable driver that executes the exact qualify.py step sequence in time-boxed chunks.

Used where a single process cannot run longer than a few minutes. Each call runs
pending steps until its time budget is spent, recording every step's exit code and
log SHA-256 in state.json. Steps, arguments, working directories, the socket guard
and environment mirror scripts/ai-labor-archive/qualify.py at 7a95cc9. Regression
suites run per test file (same tests, split only for the time limit).
Final comparison reuses qualify.py's own canonical_payload and archive readers.
"""
import json
import os
from pathlib import Path
import subprocess
import sys
import time

TOOLS, BUNDLE, INDEX, WORK = map(Path, sys.argv[1:5])
BUDGET = float(sys.argv[5]) if len(sys.argv) > 5 else 140
sys.path.insert(0, str(TOOLS))
import archive as a  # noqa: E402
import qualify as Q  # noqa: E402

START = time.time()
state_path = WORK / 'state.json'
if not WORK.exists():
    WORK.mkdir(parents=True)
    (WORK / 'guard').mkdir()
    (WORK / 'guard' / 'sitecustomize.py').write_text(
        "import socket\ndef deny(*a,**k): raise RuntimeError('Offline qualification blocks network')\n"
        "socket.create_connection=deny\nsocket.socket.connect=deny\nsocket.socket.connect_ex=deny\n")
    (WORK / 'logs').mkdir()
    state_path.write_text(json.dumps(dict(done=[], results=[], python=sys.version.split()[0])))
state = json.loads(state_path.read_text())
ENV = dict(os.environ, PYTHONPATH=str((WORK / 'guard').resolve()), PYTHONDONTWRITEBYTECODE='1')
ENV.pop('GITHUB_STEP_SUMMARY', None)
STORE_HASH = '9c65350db439ee246408614201380bef40971f79a4ea2968084b861ab8c4b747'


def labor(n):
    return WORK / f'root-{n}' / 'research/ai-labor-transition'


def steps():
    out = []
    for n in (1, 2):
        root = WORK / f'root-{n}'
        L = labor(n)
        store, mon = L / 'monitor/history/qualification-store', L / 'monitor'
        fresh, outputs = WORK / f'monitor-store-{n}', WORK / f'monitor-output-{n}'
        out.append((f'{n}-hydrate', ('hydrate', root)))
        for p, s in [('phase1', 'scripts/cli.py'), ('phase2', 'occupational/scripts/cli.py'), ('phase3', 'outcomes/scripts/cli.py')]:
            out.append((f'{n}-{p}-accepted-validate', ('run', root, [L / s, 'validate'])))
        out.append((f'{n}-monitor-frozen-replay', ('run', root, [mon / 'cli.py', 'validate', '--store', store, '--output', mon])))
        for p, s in [('phase1', 'scripts/cli.py'), ('phase2', 'occupational/scripts/cli.py'), ('phase3', 'outcomes/scripts/cli.py')]:
            out.append((f'{n}-{p}-normalize', ('normalize', root, p, L / s)))
            out.append((f'{n}-{p}-rebuilt-validate', ('run', root, [L / s, 'validate'])))
        out.append((f'{n}-monitor-dry-run', ('run', root, [mon / 'cli.py', 'dry-run', '--store', fresh, '--output', outputs])))
        out.append((f'{n}-monitor-validate', ('run', root, [mon / 'cli.py', 'validate', '--store', fresh, '--output', outputs])))
        out.append((f'{n}-monitor-repeat', ('run', root, [mon / 'cli.py', 'dry-run', '--store', fresh, '--output', outputs])))
        out.append((f'{n}-monitor-repeat-check', ('check', outputs)))
        out.append((f'{n}-monitor-recovery-package', ('run', root, [mon / 'history/package.py', fresh, WORK / f'recovery-{n}', '--apply'])))
        out.append((f'{n}-monitor-recovered-validate', ('run', root, [mon / 'cli.py', 'validate', '--store', WORK / f'recovery-{n}', '--output', outputs])))
        if n == 1:
            for p, t in [('phase1', 'tests'), ('phase2', 'occupational/tests'), ('phase3', 'outcomes/tests'), ('monitor', 'monitor/tests')]:
                for f in sorted((WORK / 'root-1/research/ai-labor-transition' / t).glob('test*.py')) if (WORK / 'root-1').exists() else []:
                    out.append((f'{p}-regressions::{f.name}', ('run', root, ['-m', 'unittest', 'discover', '-s', L / t, '-p', f.name, '-v'])))
    out.append(('final-compare', ('final',)))
    return out


def save():
    state_path.write_text(json.dumps(state, indent=1))


def record(label, log, code):
    (WORK / 'logs' / (label.replace('::', '__') + '.txt')).write_bytes(log)
    state['results'].append(dict(check=label, exitCode=code, logSha256=a.sha(log)))
    if code != 0:
        state['failed'] = dict(check=label, tail=log.decode(errors='replace')[-1500:])
        save()
        raise SystemExit(f'FAILED {label}')


while True:
    pending = [s for s in steps() if s[0] not in state['done']]
    if not pending:
        print('ALL DONE')
        break
    if time.time() - START > BUDGET:
        print(f'PAUSED with {len(pending)} steps pending; next: {pending[0][0]}')
        break
    label, spec = pending[0]
    kind = spec[0]
    if kind == 'hydrate':
        a.hydrate(BUNDLE, INDEX, spec[1])
    elif kind in ('run', 'normalize'):
        root = spec[1]
        if kind == 'normalize':
            _, root, prefix, script = spec
            extra = ['--run-at', json.loads((root / 'research/ai-labor-transition/normalized/current-summary.json').read_bytes())['pipelineRunAt']] if prefix == 'phase1' else []
            args = [script, 'normalize', *extra]
        else:
            args = spec[2]
        proc = subprocess.run([sys.executable, *map(str, args)], cwd=root, env=ENV, capture_output=True)
        record(label, proc.stdout + proc.stderr, proc.returncode)
    elif kind == 'check':
        cur = json.loads((spec[1] / 'current-monitor.json').read_bytes())
        a.require(cur['economicChange'] == 'NO_ECONOMIC_CHANGE', 'Repeat monitor changed interpretation')
        a.require(cur['evaluationId'] == STORE_HASH, 'Monitor baseline differs')
    elif kind == 'final':
        manifest, objects = a.read_archive(BUNDLE, INDEX)
        frozen = {f['path']: objects[f['sha256']] for f in manifest['files']}
        roots = [WORK / 'root-1', WORK / 'root-2']
        maps = {}
        for phase, name, sub in [('phase2', 'occupation-output-manifest.json', 'normalized'), ('phase3', 'output-manifest.json', 'outcomes')]:
            maps[phase] = json.loads(frozen[f'research/ai-labor-transition/{sub}/{name}'])['artifacts']
            for n2, digest in maps[phase].items():
                for r in roots:
                    a.require(a.sha(Q.canonical_payload(r / 'research/ai-labor-transition' / sub / n2)) == digest, 'Accepted artifact changed')
        p1 = {}
        for prov in ('cps', 'ces', 'jolts', 'btos'):
            p = f'research/ai-labor-transition/normalized/providers/{prov}.json'
            p1[prov] = a.sha(frozen[p])
            for r in roots:
                a.require(a.sha((r / p).read_bytes()) == p1[prov], 'Accepted Phase1 changed')
        summ = 'research/ai-labor-transition/normalized/current-summary.json'
        for r in roots:
            a.require((r / summ).read_bytes() == frozen[summ], 'Frozen macro context changed')
        enc = lambda m: a.sha((json.dumps(m, sort_keys=True, indent=2, ensure_ascii=False) + '\n').encode())
        state['report'] = dict(archiveSha256=a.sha(BUNDLE.read_bytes()), hydratedFiles=len(manifest['files']), roots=2,
                               phase1AcceptedHashes=p1, phase2ArtifactMapHash=enc(maps['phase2']),
                               phase3ArtifactMapHash=enc(maps['phase3']), monitorResultHash=STORE_HASH)
    state['done'].append(label)
    save()
    print('done', label, f'{time.time() - START:.0f}s', flush=True)
