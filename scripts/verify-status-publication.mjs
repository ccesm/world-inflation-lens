import assert from 'node:assert/strict'
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { emptySystemStatus } from '../src/utils/systemStatus.js'

// Execute the actual publisher against an isolated GitHub API fake: no network/mail/git mutations.
const folder=await mkdtemp(join(tmpdir(),'wil-status-'))
const script=fileURLToPath(new URL('./publish-system-status.mjs',import.meta.url))
const commit='a'.repeat(40),snapshot='b'.repeat(40),now=new Date().toISOString()
const sourceFiles=['inflation/fred.json','inflation/drivers.json','inflation/monitor.json','inflation/worldbank.json','productivity/series.json','fiscal/cbo-2026-02.json','updates/history.json']
const before=await Promise.all(sourceFiles.map(p=>readFile(new URL(`../data/${p}`,import.meta.url),'utf8')))
try {
  const mock=join(folder,'mock.mjs')
  await writeFile(mock,`
    import {readFile,writeFile} from 'node:fs/promises';
    const fixture=JSON.parse(await readFile('fixture.json','utf8')),calls=[];
    globalThis.fetch=async (url,options={})=>{
      const path=url.replace('https://api.github.com/repos/ccesm/world-inflation-lens/',''),method=options.method||'GET';
      const body=options.body?JSON.parse(options.body):null;calls.push({path,method,body});await writeFile('calls.json',JSON.stringify(calls));
      let status=200,value;
      if(fixture.denied){status=403;value={message:'PRIVATE PROVIDER BODY'};}
      else if(path==='actions/runs/42')value={run_started_at:fixture.now,head_sha:fixture.commit};
      else if(path==='git/ref/heads/system-status'){if(fixture.previous)value={object:{sha:fixture.commit}};else status=404;}
      else if(path==='contents/system-status.json?ref=system-status')value={content:Buffer.from(JSON.stringify(fixture.previous)).toString('base64')};
      else if(path==='git/commits/'+fixture.commit)value={tree:{sha:fixture.commit}};
      else if(path==='git/trees'&&method==='POST')value={sha:fixture.commit};
      else if(path==='git/commits'&&method==='POST')value={sha:fixture.commit};
      else if((path==='git/refs'&&method==='POST')||(path==='git/refs/heads/system-status'&&method==='PATCH'))value={};
      else throw Error('Unexpected API call '+method+' '+path);
      return {ok:status===200,status,json:async()=>value};
    };
  `)
  async function run(previous,extra={},report=null) {
    await writeFile(join(folder,'fixture.json'),JSON.stringify({previous,commit,now,...extra}))
    await rm(join(folder,'.refresh'),{recursive:true,force:true})
    if(report){const {mkdir}=await import('node:fs/promises');await mkdir(join(folder,'.refresh'));await writeFile(join(folder,'.refresh/check.json'),JSON.stringify(report))}
    const result=spawnSync(process.execPath,['--import',mock,script],{cwd:folder,encoding:'utf8',env:{...process.env,GITHUB_TOKEN:'MOCK_TOKEN_NEVER_PUBLIC',GITHUB_REPOSITORY:'ccesm/world-inflation-lens',GITHUB_RUN_ID:'42',GITHUB_RUN_ATTEMPT:'1',APP_VERSION:'0.13.0',CODE_COMMIT:commit,SNAPSHOT_COMMIT:snapshot,BUILD_RESULT:'success',DEPLOY_RESULT:'success',DEPLOYED_AT:now,NOTIFICATION_RESULT:'FAILED_AUTH',REFRESH_REQUESTED:'false',...extra.env}})
    return {result,calls:JSON.parse(await readFile(join(folder,'calls.json'),'utf8'))}
  }
  const initial=await run(null)
  assert.equal(initial.result.status,0,initial.result.stderr)
  const tree=initial.calls.find(c=>c.path==='git/trees'&&c.method==='POST').body
  assert.equal(tree.tree.length,1);assert.equal(tree.tree[0].path,'system-status.json','Publisher may write only the safe status artifact')
  const published=JSON.parse(tree.tree[0].content)
  assert.equal(published.deployment.lastSuccessfulAt,now)
  assert.equal(published.notification.result,'FAILED_AUTH','Mail failure cannot erase successful deployment')
  assert.ok(published.freshness.counts.FIXED_VINTAGE>=3)
  assert.ok(published.freshness.counts.MANUAL_REVIEWED>=4)
  assert.doesNotMatch(tree.tree[0].content,/MOCK_TOKEN|PRIVATE|email|password/i)
  assert.deepEqual(initial.calls.find(c=>c.path==='git/commits'&&c.method==='POST').body.parents,[],'First status commit is independent of application history')
  assert.equal(initial.calls.at(-1).body.ref,'refs/heads/system-status')
  const failed=await run(published,{env:{BUILD_RESULT:'failure',DEPLOY_RESULT:'skipped',DEPLOYED_AT:'',REFRESH_REQUESTED:'true'}})
  assert.equal(failed.result.status,0,failed.result.stderr)
  const outcome=JSON.parse(failed.calls.find(c=>c.path==='git/trees'&&c.method==='POST').body.tree[0].content)
  assert.equal(outcome.data.result,'FAILED');assert.equal(outcome.data.checkCompletedAt,null,'Setup failure has no invented check completion')
  assert.deepEqual(outcome.application,published.application)
  assert.equal(outcome.deployment.lastSuccessfulAt,now)
  assert.deepEqual(outcome.freshness,published.freshness,'Failed candidate must not replace deployed freshness summary')
  assert.equal(failed.calls.at(-1).path,'git/refs/heads/system-status');assert.equal(failed.calls.at(-1).body.force,false)
  const denied=await run(emptySystemStatus(),{denied:true})
  assert.equal(denied.result.status,1)
  assert.doesNotMatch(denied.result.stderr,/PRIVATE|MOCK_TOKEN/,'API error bodies and authentication token never enter logs')
  assert.deepEqual(await Promise.all(sourceFiles.map(p=>readFile(new URL(`../data/${p}`,import.meta.url),'utf8'))),before,'Status publication must never mutate economic snapshots')
  console.log('PASS: actual status publisher against mock GitHub; independent branch, safe JSON, setup failure, retained production outcomes and permission errors; no network or real mail')
} finally {await rm(folder,{recursive:true,force:true})}
