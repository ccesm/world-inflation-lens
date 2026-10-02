import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {seriesMetadata,withSeriesContract} from '../src/data/seriesContract.js'
import {seriesRegistry,assertResearchConsistency,fredUseMetadata} from '../src/data/seriesRegistry.js'
import {shockIndicators} from '../src/data/externalShocks.js'
import {freshness} from '../src/utils/freshness.js'
import {releaseWindow,zonedInstant,businessDay,refreshSchedule} from '../src/utils/releaseCalendar.js'
import {temporalValue,fredUpdateTime} from '../src/utils/timeSemantics.js'
import {emptySystemStatus,safeSystemStatus,mergeSystemStatus,checkReport} from '../src/utils/systemStatus.js'
import {aiCopy} from '../src/i18n/productivity.js'
import {transmissionCopy} from '../src/i18n/transmission.js'
const root=new URL('../',import.meta.url),read=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'))
const raw=await read('data/inflation/monitor.json'),get=id=>structuredClone(raw.series.find(s=>s.id===id))
const rate=get('DGS10');rate.observations=[{date:'2026-09-30',value:5.29}]
const assess=(source,time,extra={})=>freshness(source,{now:new Date(time),...extra})
assert.equal(assess(rate,'2026-10-01T19:00:00Z').state,'CURRENT','Before the source window matures, prior observation remains current')
assert.equal(assess(rate,'2026-10-01T21:00:00Z').state,'CURRENT','Four-hour distributor grace must not mark early lag stale')
rate.observations=[{date:'2026-09-29',value:5.26}]
assert.equal(assess(rate,'2026-10-01T21:00:00Z').state,'WAITING_FOR_EXPECTED_RELEASE')
assert.equal(assess(rate,'2026-10-02T00:16:00Z').state,'STALE')
assert.equal(assess(rate,'2026-10-01T21:00:00Z',{probe:{sourceUpdatedAt:'2026-10-01',latestAvailableObservationDate:'2026-09-30'}}).state,'SOURCE_UPDATED_NOT_YET_CAPTURED')
assert.equal(assess(rate,'2026-10-01T21:00:00Z',{refreshResult:'FAILED'}).state,'REFRESH_FAILED')
rate.observations=[{date:'2026-10-01',value:5.3}]
assert.equal(assess(rate,'2026-10-03T15:00:00Z',{check:{completedAt:'2026-10-02T23:00:00Z',changed:false}}).state,'CHECKED_NO_NEW_RELEASE','Normal weekend is not missing daily data')
assert.equal(releaseWindow('H15',new Date('2026-10-03T15:00:00Z')).mature.observation,'2026-10-01')
assert.equal(businessDay('2026-09-07'),false,'Labor Day excluded')
assert.equal(businessDay('2026-04-03',true),false,'Good Friday is a Treasury market closure')
assert.equal(releaseWindow('H15',new Date('2026-09-07T23:00:00Z')).mature.observation,'2026-09-03')
const dollar=get('DTWEXBGS');dollar.observations=[{date:'2026-09-25',value:120}]
assert.equal(assess(dollar,'2026-10-01T23:00:00Z').state,'CURRENT','Daily observations with weekly H.10 publication')
assert.equal(releaseWindow('H10',new Date('2026-09-08T19:00:00Z')).mature.observation,'2026-08-28','Monday holiday shifts publication to Tuesday')
assert.equal(releaseWindow('H10',new Date('2026-09-09T01:00:00Z')).mature.observation,'2026-09-04')
const fed=get('WALCL');fed.observations=[{date:'2026-09-23',value:1}]
assert.equal(assess(fed,'2026-10-01T21:00:00Z').state,'WAITING_FOR_EXPECTED_RELEASE')
assert.equal(assess(fed,'2026-10-02T01:00:00Z').state,'STALE')
assert.equal(releaseWindow('H41',new Date('2026-11-27T21:00:00Z')).mature.observation,'2026-11-18','Thanksgiving shifts H.4.1 release')
assert.equal(releaseWindow('H41',new Date('2026-11-28T02:00:00Z')).mature.observation,'2026-11-25')
assert.equal(zonedInstant('2026-03-06',16,15,'America/New_York'),'2026-03-06T21:15:00.000Z')
assert.equal(zonedInstant('2026-03-09',16,15,'America/New_York'),'2026-03-09T20:15:00.000Z')
assert.equal(zonedInstant('2026-11-02',16,15,'America/New_York'),'2026-11-02T21:15:00.000Z')
assert.equal(zonedInstant('2026-10-01',17,40,'America/Los_Angeles'),'2026-10-02T00:40:00.000Z')
assert.equal(zonedInstant('2026-12-01',17,40,'America/Los_Angeles'),'2026-12-02T01:40:00.000Z')
const monthly=await read('data/inflation/fred.json');monthly.observations=[{date:'2026-08',value:100}]
assert.equal(assess(monthly,'2026-10-01T23:00:00Z').state,'CURRENT')
assert.equal(assess(monthly,'2026-12-01T23:00:00Z').state,'STALE')
const productivity=await read('data/productivity/series.json'),q=structuredClone(productivity.series[0]);q.observations=[{date:'2026-04',value:100}]
assert.equal(assess(q,'2026-10-01T23:00:00Z').state,'CURRENT')
assert.equal(seriesMetadata(q).observationDate.precision,'quarter')
assert.equal(seriesMetadata(q).observationDate.value,'2026-Q2')
assert.equal(assess({id:'DGS10'},'2026-10-01T23:00:00Z').state,'UNKNOWN')
assert.equal(assess({...rate,sourceUpdatedAt:null},'2026-10-01T23:00:00Z').state,'UNKNOWN')
const publication=(await read('data/digital-money/stablecoins.json')).records[0]
assert.equal(assess(publication,'2026-10-01T23:00:00Z',{refreshResult:'FAILED'}).state,'MANUAL_REVIEWED')
assert.equal(assess(publication,'2028-10-01T23:00:00Z').state,'MANUAL_REVIEW_REQUIRED')
assert.equal(seriesMetadata(publication).reviewedAt.value,publication.reviewedAt)
const cbo={...(await read('data/fiscal/cbo-2026-02.json')).metadata,id:'CBO_DEBT'}
assert.equal(assess(cbo,'2030-10-01T23:00:00Z').state,'FIXED_VINTAGE')
assert.equal(assess({id:'HISTORY_EVENTS'},'2030-10-01T23:00:00Z').state,'STATIC')
assert.equal(assess({id:'FREIGHT'},'2026-10-01T23:00:00Z').state,'PLANNED')
assert.equal(temporalValue('2026-09').precision,'month')
assert.equal(temporalValue('2026-09-30').precision,'date')
assert.equal(fredUpdateTime('2026-10-01 4:03 PM CDT').value,'2026-10-01T21:03:00.000Z')
assert.equal(fredUpdateTime('unknown source text').precision,'source_text')
const integrated=[await read('data/inflation/fred.json'),...(await read('data/inflation/drivers.json')).series,...raw.series,...productivity.series,await read('data/digital-money/bank-deposits.json')]
for(const id of ['gpr','gscpi','fao-food','sipri-military']){const d=await read(`data/external/${id}.json`);integrated.push(...d.series.map(s=>({...d.metadata,...s})))}
assertResearchConsistency(shockIndicators,integrated.map(s=>s.id))
assert.throws(()=>assertResearchConsistency([{id:'natural-gas',status:'planned'}],integrated.map(s=>s.id)),/contradiction/)
for(const s of integrated){const m=seriesMetadata(s);assert.ok(seriesRegistry[s.id]);assert.notEqual(m.automationType,'UNKNOWN');assert.ok(m.title.en&&m.title.zh&&m.sourceUrl&&m.units&&m.publisher&&m.distributor&&m.primaryResearchRole);assert.deepEqual(withSeriesContract(s).observations,s.observations,'Contract cannot alter measurements')}
assert.doesNotMatch(fredUseMetadata('CPIAUCNS').license,/public domain/i)
for(const language of ['en','zh']){
  assert.equal(aiCopy[language].names.OPHNFB,seriesRegistry.OPHNFB.title[language])
  assert.equal(transmissionCopy[language].names.GPR,seriesRegistry.GPR.title[language])
}
assert.equal(fredUseMetadata('CUSTOM',{license:'Reviewed specific rights note'}).license,'Reviewed specific rights note')
assert.match(fredUseMetadata('T5YIFR',{license:'Public domain'}).license,/Copyrighted: Citation Required/)
assert.equal(seriesMetadata({...rate,license:'Reviewed publisher-specific usage'}).use.license,'Reviewed publisher-specific usage')
const h='a'.repeat(40),s='b'.repeat(40),start='2026-10-01T20:00:00Z',end='2026-10-01T20:03:00Z'
const report={schemaVersion:1,checkStartedAt:start,checkCompletedAt:end,result:'SUCCESS_NO_CHANGE',changed:false,seriesChecks:{DGS10:{sourceUpdatedAt:'2026-10-01',latestAvailableObservationDate:'2026-09-30',checkedAt:end}}}
const attempt={runId:'42',attempt:'1',startedAt:start,version:'0.13.0',codeCommit:h,snapshotCommit:s,refreshResult:'SUCCESS_NO_CHANGE',buildResult:'success',deploymentResult:'success',notificationResult:'ACCEPTED_BY_GMAIL',deployedAt:'2026-10-01T20:04:00Z'}
const success=mergeSystemStatus(null,attempt,report,'2026-10-01T20:05:00Z')
assert.equal(success.data.lastSuccessfulCheck,end)
assert.equal(success.deployment.lastSuccessfulAt,attempt.deployedAt)
assert.equal(success.notification.result,'ACCEPTED_BY_GMAIL')
const failure=mergeSystemStatus(success,{...attempt,runId:'43',startedAt:'2026-10-02T20:00:00Z',buildResult:'failure',deploymentResult:'skipped',notificationResult:'FAILED_AUTH',deployedAt:null},{...report,result:'FAILED',checkStartedAt:'2026-10-02T20:01:00Z',checkCompletedAt:'2026-10-02T20:02:00Z'},'2026-10-02T20:05:00Z')
assert.equal(failure.data.result,'FAILED');assert.equal(failure.data.lastSuccessfulCheck,end);assert.equal(failure.deployment.lastSuccessfulAt,attempt.deployedAt);assert.equal(failure.application.snapshotCommit,s)
const failedMail=mergeSystemStatus(success,{...attempt,runId:'44',startedAt:'2026-10-02T20:00:00Z',notificationResult:'FAILED_AUTH',deployedAt:'2026-10-02T20:04:00Z'},report,'2026-10-02T20:05:00Z')
assert.equal(failedMail.deployment.result,'success');assert.equal(failedMail.notification.result,'FAILED_AUTH')
assert.equal(mergeSystemStatus(null,{...attempt,deployedAt:null},report,end).deployment.lastSuccessfulAt,null,'Do not invent deployment completion')
assert.deepEqual(mergeSystemStatus(failure,attempt,report,end),failure,'Delayed older result cannot overwrite new status')
const sanitized=safeSystemStatus({...success,email:'PRIVATE',secret:'PRIVATE',notification:{...success.notification,address:'PRIVATE',response:'PRIVATE'},seriesChecks:{DGS10:{...success.seriesChecks.DGS10,response:'PRIVATE'}}})
assert.doesNotMatch(JSON.stringify(sanitized),/PRIVATE|address|secret|response/i)
assert.equal(checkReport({...report,privateResponse:'PRIVATE'}).privateResponse,undefined)
const workflow=await readFile(new URL('.github/workflows/deploy.yml',root),'utf8')
assert.ok(workflow.includes(`cron: '${refreshSchedule.cron}'`));assert.ok(workflow.includes(`timezone: ${refreshSchedule.timezone}`))
assert.ok(workflow.indexOf('Record completed successful deployment')>workflow.indexOf('uses: actions/deploy-pages@v4'))
assert.match(workflow,/needs: \[build, deploy, notify\]/);assert.match(workflow,/Preserve safe data-check report even after failure/)
assert.match(workflow,/path: \.refresh\/check\.json\s+include-hidden-files: true/,'The failure report lives in a hidden folder and must be explicitly uploaded')
const config=await readFile(new URL('vite.config.js',root),'utf8');assert.match(config,/package\.json/);assert.match(config,/__APP_VERSION__/)
for(const path of ['src/components/DataStatus.jsx','src/components/ResearchShortcuts.jsx','src/pages/DataWorkspace.jsx','src/pages/UpdateJournal.jsx'])assert.doesNotMatch(await readFile(new URL(path,root),'utf8'),/V0\.12|0\.13\.0/,'UI version must come from package build definition')
assert.equal((await read('package.json')).version,(await read('package-lock.json')).version)
console.log('PASS: release calendars, weekends/holidays/DST/grace, mixed frequencies, manual/fixed evidence, metadata/time precision, cross-module consistency, rights preservation, independent safe outcomes and version source')
