export const notificationResults = ['ACCEPTED_BY_GMAIL','SKIPPED_NOT_CONFIGURED','FAILED_AUTH','FAILED_TRANSPORT','FAILED_CONFIGURATION','UNKNOWN','NOT_REQUESTED']
export const refreshResults = ['SUCCESS_CHANGED','SUCCESS_NO_CHANGE','FAILED','RUNNING','NOT_REQUESTED','UNKNOWN']
const date = value => typeof value==='string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(value) && Number.isFinite(Date.parse(value)) ? value : null
const hash = value => typeof value==='string' && /^[a-f0-9]{40}$/.test(value) ? value : null
const version = value => typeof value==='string' && /^\d+\.\d+\.\d+$/.test(value) ? value : null
const result = value => ['success','failure','cancelled','skipped','unknown'].includes(value) ? value : 'unknown'
const choose = (value, values) => values.includes(value) ? value : 'UNKNOWN'
const identifier = value => /^\d{1,25}$/.test(String(value||'')) ? String(value) : null
const period = value => typeof value==='string' && /^\d{4}(-\d{2})?(-\d{2})?(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z)?$/.test(value) ? value : null
export function emptySystemStatus() {
  return { schemaVersion:1,updatedAt:null,application:{version:null,codeCommit:null,snapshotCommit:null},lastAttempt:null,
    data:{checkStartedAt:null,checkCompletedAt:null,lastSuccessfulCheck:null,lastSuccessfulCheckStartedAt:null,legacySuccessfulCheckRecordedAt:null,lastAttemptAt:null,result:'UNKNOWN'},
    deployment:{lastSuccessfulAt:null,codeCommit:null,snapshotCommit:null,version:null,result:'unknown'},notification:{result:'UNKNOWN',updatedAt:null},freshness:{asOf:null,counts:{}},seriesChecks:{} }
}
export function safeSystemStatus(input) {
  if(!input || input.schemaVersion!==1)throw Error('Unsupported public system status')
  const out=emptySystemStatus(),a=input.application||{},d=input.data||{},p=input.deployment||{},n=input.notification||{}
  out.updatedAt=date(input.updatedAt)
  out.application={version:version(a.version),codeCommit:hash(a.codeCommit),snapshotCommit:hash(a.snapshotCommit)}
  if(input.lastAttempt){const t=input.lastAttempt;out.lastAttempt={runId:identifier(t.runId),attempt:identifier(t.attempt),startedAt:date(t.startedAt),completedAt:date(t.completedAt),refreshResult:choose(t.refreshResult,refreshResults),buildResult:result(t.buildResult),deploymentResult:result(t.deploymentResult),notificationResult:choose(t.notificationResult,notificationResults),codeCommit:hash(t.codeCommit),snapshotCommit:hash(t.snapshotCommit),version:version(t.version)}}
  for(const key of ['checkStartedAt','checkCompletedAt','lastSuccessfulCheck','lastSuccessfulCheckStartedAt','legacySuccessfulCheckRecordedAt','lastAttemptAt'])out.data[key]=date(d[key])
  out.data.result=choose(d.result,refreshResults)
  out.deployment={lastSuccessfulAt:date(p.lastSuccessfulAt),codeCommit:hash(p.codeCommit),snapshotCommit:hash(p.snapshotCommit),version:version(p.version),result:result(p.result)}
  out.notification={result:choose(n.result,notificationResults),updatedAt:date(n.updatedAt)}
  const states=['CURRENT','CHECKED_NO_NEW_RELEASE','WAITING_FOR_EXPECTED_RELEASE','SOURCE_UPDATED_NOT_YET_CAPTURED','STALE','REFRESH_FAILED','MANUAL_REVIEWED','MANUAL_REVIEW_REQUIRED','FIXED_VINTAGE','STATIC','DERIVED','PLANNED','UNKNOWN']
  out.freshness={asOf:date(input.freshness?.asOf),counts:Object.fromEntries(Object.entries(input.freshness?.counts||{}).filter(([key,count])=>states.includes(key)&&Number.isSafeInteger(count)&&count>=0))}
  for(const [id,check] of Object.entries(input.seriesChecks||{}))if(/^[A-Z0-9_.-]{1,50}$/.test(id) && check && typeof check==='object')out.seriesChecks[id]={sourceUpdatedAt:period(check.sourceUpdatedAt),latestAvailableObservationDate:period(check.latestAvailableObservationDate),checkedAt:date(check.checkedAt),changed:typeof check.changed==='boolean'?check.changed:null}
  return out
}
export function checkReport(input) {
  const base=safeSystemStatus({...emptySystemStatus(),seriesChecks:input?.seriesChecks})
  return {schemaVersion:1,checkStartedAt:date(input?.checkStartedAt),checkCompletedAt:date(input?.checkCompletedAt),result:choose(input?.result,refreshResults),seriesChecks:base.seriesChecks,
    changed:input?.changed===true,counts:Object.fromEntries(['added','filled','revised','withdrawn'].map(k=>[k,Number.isSafeInteger(input?.counts?.[k])&&input.counts[k]>=0?input.counts[k]:0]))}
}
export function mergeSystemStatus(previous,attempt,report,now=new Date().toISOString()) {
  const out=safeSystemStatus(previous||emptySystemStatus()),r=report?checkReport(report):null
  const t=safeSystemStatus({...emptySystemStatus(),lastAttempt:attempt}).lastAttempt
  if(!t?.runId || !t.startedAt || !date(now))throw Error('Missing workflow identity / time')
  // Ignore delayed older workflow outcomes, including older rerun attempts.
  if(out.lastAttempt && (Date.parse(out.lastAttempt.startedAt)>Date.parse(t.startedAt) || (out.lastAttempt.runId===t.runId && Number(out.lastAttempt.attempt)>Number(t.attempt))))return out
  out.updatedAt=now;out.lastAttempt={...t,completedAt:now};out.deployment.result=t.deploymentResult
  out.notification={result:t.notificationResult,updatedAt:now}
  if(r){out.data.checkStartedAt=r.checkStartedAt;out.data.checkCompletedAt=r.checkCompletedAt;out.data.lastAttemptAt=r.checkStartedAt;out.data.result=r.result;out.seriesChecks=r.seriesChecks
    if(r.result.startsWith('SUCCESS') && r.checkCompletedAt){out.data.lastSuccessfulCheck=r.checkCompletedAt;out.data.lastSuccessfulCheckStartedAt=r.checkStartedAt}}
  // Deployment is recorded only from a successful deployment job with an after-success timestamp.
  if(t.deploymentResult==='success' && date(attempt.deployedAt) && t.codeCommit && t.snapshotCommit && t.version){
    out.deployment={...out.deployment,lastSuccessfulAt:attempt.deployedAt,codeCommit:t.codeCommit,snapshotCommit:t.snapshotCommit,version:t.version}
    out.application={version:t.version,codeCommit:t.codeCommit,snapshotCommit:t.snapshotCommit}
  }
  return safeSystemStatus(out)
}
