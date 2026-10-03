// Post-outcome, status-only branch. Never writes main, economic snapshots or Pages dist.
import { readFile, writeFile } from 'node:fs/promises'
import { emptySystemStatus, mergeSystemStatus, safeSystemStatus } from '../src/utils/systemStatus.js'
import { freshness } from '../src/utils/freshness.js'
const repository='ccesm/world-inflation-lens',branch='system-status',file='system-status.json'
async function api(path,method='GET',body,missing=false) {
  const response=await fetch(`https://api.github.com/repos/${repository}/${path}`,{method,headers:{Authorization:`Bearer ${process.env.GITHUB_TOKEN}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)})
  if(missing&&response.status===404)return null
  if(!response.ok)throw Error(`Status publication request failed (${response.status}); no private response retained`)
  return response.json()
}
try {
  if(!process.env.GITHUB_TOKEN || process.env.GITHUB_REPOSITORY!==repository)throw Error('Status publisher requires the configured repository workflow')
  const run=await api(`actions/runs/${process.env.GITHUB_RUN_ID}`)
  const ref=await api(`git/ref/heads/${branch}`,'GET',null,true)
  const content=ref?await api(`contents/${file}?ref=${branch}`,'GET',null,true):null
  let previous=emptySystemStatus()
  if(content)previous=safeSystemStatus(JSON.parse(Buffer.from(content.content,'base64').toString('utf8')))
  const ledger=JSON.parse(await readFile(new URL('../data/updates/history.json',import.meta.url),'utf8'))
  if(!previous.data.lastSuccessfulCheck){previous.data.lastSuccessfulCheck=ledger.lastSuccessfulCheckCompletedAt||null;previous.data.legacySuccessfulCheckRecordedAt=ledger.lastSuccessfulCheck||null}
  let report=null
  try {report=JSON.parse(await readFile('.refresh/check.json','utf8'))} catch { /* A setup failure has no completed data-check report. */ }
  const env=process.env,now=new Date().toISOString()
  if(!report && env.REFRESH_REQUESTED==='true' && env.BUILD_RESULT==='failure')report={schemaVersion:1,result:'FAILED',checkStartedAt:null,checkCompletedAt:null,seriesChecks:{}}
  const attempt={runId:env.GITHUB_RUN_ID,attempt:env.GITHUB_RUN_ATTEMPT,startedAt:run.run_started_at,codeCommit:env.CODE_COMMIT||run.head_sha,snapshotCommit:env.SNAPSHOT_COMMIT,version:env.APP_VERSION,
    refreshResult:report?.result||(env.REFRESH_REQUESTED==='true'?'UNKNOWN':'NOT_REQUESTED'),buildResult:env.BUILD_RESULT,deploymentResult:env.DEPLOY_RESULT,notificationResult:env.NOTIFICATION_RESULT||(env.REFRESH_REQUESTED==='true'?'UNKNOWN':'NOT_REQUESTED'),deployedAt:env.DEPLOYED_AT}
  const status=mergeSystemStatus(previous,attempt,report,now)
  // A rejected older outcome must not replace the newer status document.
  if(status.lastAttempt?.runId!==String(env.GITHUB_RUN_ID) || status.lastAttempt?.attempt!==String(env.GITHUB_RUN_ATTEMPT)){console.log('Newer public workflow status retained.');process.exit(0)}
  const read=async path=>JSON.parse(await readFile(new URL(`../data/${path}`,import.meta.url),'utf8'))
  const sources=[await read('inflation/fred.json'),...(await read('inflation/drivers.json')).series,...(await read('inflation/monitor.json')).series,...(await read('productivity/series.json')).series,await read('digital-money/bank-deposits.json')]
  for(const id of ['gpr','gscpi','fao-food','sipri-military']){const d=await read(`external/${id}.json`);sources.push(...d.series.map(s=>({...d.metadata,...s})))}
  sources.push(...(await read('digital-money/stablecoins.json')).records,...(await read('digital-money/treasury-holdings.json')).records)
  for(const file of ['reserve-composition','treasury-holdings','global-dollar-credit']){const d=await read(`international-dollar/${file}.json`);sources.push(...d.series.map(s=>({...d.metadata,...s})))}
  const world=await read('inflation/worldbank.json')
  const years=Object.values(world.values).flatMap(values=>values.flatMap((value,i)=>Number.isFinite(value)?[world.metadata.startYear+i]:[]))
  sources.push({...world.metadata,id:world.metadata.indicator,observationDate:years.length?String(Math.max(...new Set(years))):null})
  const cbo=await read('fiscal/cbo-2026-02.json')
  for(const metric of ['DEBT','DEFICIT','INTEREST'])sources.push({...cbo.metadata,id:`CBO_${metric}`,sourceUrl:cbo.metadata.projectionSource})
  // Compute freshness only for the economic bundle known to have been deployed in this run.
  // Failure outcomes preserve the last production summary, rather than score un-deployed candidates.
  if(env.DEPLOY_RESULT==='success'){
    const counts={};for(const s of sources){const state=freshness(s,{now:new Date(now),refreshResult:status.data.result,probe:status.seriesChecks[s.id]}).state;counts[state]=(counts[state]||0)+1}
    status.freshness={asOf:now,counts}
  }
  const safe=safeSystemStatus(status),serialized=JSON.stringify(safe,null,2)+'\n'
  // The setup may have failed before any data-check artifact was created.
  const {mkdir}=await import('node:fs/promises');await mkdir('.refresh',{recursive:true})
  await writeFile('.refresh/system-status.json',serialized)
  const oldCommit=ref?await api(`git/commits/${ref.object.sha}`):null
  const tree=await api('git/trees','POST',{...(oldCommit?{base_tree:oldCommit.tree.sha}:{}),tree:[{path:file,mode:'100644',type:'blob',content:serialized}]})
  const commit=await api('git/commits','POST',{message:`Record safe system outcomes for run ${env.GITHUB_RUN_ID} attempt ${env.GITHUB_RUN_ATTEMPT}`,tree:tree.sha,parents:ref?[ref.object.sha]:[]})
  if(ref)await api(`git/refs/heads/${branch}`,'PATCH',{sha:commit.sha,force:false})
  else await api('git/refs','POST',{ref:`refs/heads/${branch}`,sha:commit.sha})
  console.log('Safe system status published; economic snapshots and deployment left intact.')
} catch {
  console.error('System status publication failed; existing website/data remain intact. Inspect workflow permissions and status branch. No credentials or provider bodies logged.')
  process.exitCode=1
}
