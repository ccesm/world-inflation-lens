import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile,readdir,access} from 'node:fs/promises'
import {resolve,join} from 'node:path'
import {spawnSync} from 'node:child_process'
import {webcrypto} from 'node:crypto'
import {assertPublicRights,project,hash,bytes} from '../../../scripts/ai-macro-projection.mjs'
import {CORE,isReleaseHold,verifySummary,validHistory,identity} from '../../../src/data/ai-macro/contract.js'
import {macroCopy} from '../../../src/i18n/aiMacro.js'
const root=resolve(import.meta.dirname,'../../..'),read=p=>readFile(join(root,p),'utf8'),json=async p=>JSON.parse(await read(p))
const review=await json('docs/ai-macro-release/phase-d2/data-redistribution-review.json'),historical=await json('docs/ai-macro/source-rights.json'),hold=await json('src/data/ai-macro/summary.json')
const tests={
 'release hold exact schema and frozen hashes':()=>assert(isReleaseHold(hold)),
 'hold never accepted as numeric summary':()=>assert.rejects(verifySummary(hold,webcrypto)),
 'hold has no numeric observations':()=>{assert.equal(Object.keys(hold).length,6);assert.equal(hold.series,undefined)},
 'all eleven exact source identities reviewed':()=>assert.deepEqual(review.records.map(x=>x.sourceId).sort(),historical.records.map(x=>x.sourceId).sort()),
 'rights review pins eleven original source hashes':()=>{for(const x of review.records)assert.equal(x.sourceHash,historical.records.find(r=>r.sourceId===x.sourceId).sourceHash)},
 'SPF10 distinct unresolved public download scope':()=>{const r=review.records.find(x=>x.sourceId==='SPF10');assert.equal(r.status,'UNRESOLVED');assert.equal(r.staticDownload,'UNRESOLVED');assert(r.unresolvedQuestion)},
 'ten source permissions have evidence and exact datasets':()=>{for(const x of review.records.filter(x=>x.sourceId!=='SPF10')){assert.equal(x.status,'ALLOWED — ATTRIBUTION REQUIRED');assert(x.dataset.length>20);assert(x.evidence&&x.attribution&&x.policyURLs.length)}},
 'public rights gate fails closed':()=>assert.throws(()=>assertPublicRights(review,historical)),
 'boolean flip cannot clear unresolved rights':()=>assert.throws(()=>assertPublicRights({...review,fullPublicReleaseAllowed:true,blockedSources:[]},historical)),
 'empty source review cannot publish':()=>assert.throws(()=>assertPublicRights({...review,fullPublicReleaseAllowed:true,blockedSources:[],records:[]},historical)),
 'duplicate reviewed identity rejected':()=>assert.throws(()=>assertPublicRights({...review,fullPublicReleaseAllowed:true,blockedSources:[],records:review.records.map(()=>review.records[0])},historical)),
 'unsupported download remains blocked with allowed display':()=>{const d=structuredClone(review);d.fullPublicReleaseAllowed=true;d.blockedSources=[];const r=d.records.find(x=>x.sourceId==='SPF10');r.status='ALLOWED — PUBLIC DISPLAY';r.publicDisplay='SUPPORTED';assert.throws(()=>assertPublicRights(d,historical))},
 'no public macro history directory':async()=>assert.rejects(access(join(root,'public/data/ai-macro'))),
 'projection CLI fails before any source read or write':async()=>{const before=await read('src/data/ai-macro/summary.json');const p=spawnSync(process.execPath,['scripts/ai-macro-projection.mjs','--input','/nonexistent/d2-input.json'],{cwd:root,encoding:'utf8'});assert.notEqual(p.status,0);assert(p.stderr.includes('D2 public rights unresolved'));assert.equal(await read('src/data/ai-macro/summary.json'),before);await assert.rejects(access(join(root,'public/data/ai-macro')))},
 'release hold copy is EN and ZH':()=>{assert(macroCopy.releaseHold.en.includes('No economic observations'));assert(macroCopy.releaseHold.zh.includes('不包含经济观测'))},
 'new chart equivalent copy is bilingual':()=>{for(const key of ['chartRange','chartLatest','chartScale','historyState'])for(const lang of ['en','zh'])assert(macroCopy[key][lang])},
 'all twelve unchanged indicator definitions':()=>assert.deepEqual(Object.keys(macroCopy.labels),CORE),
 'lazy route and production base path retained':async()=>{assert((await read('src/App.jsx')).includes("lazy(() => import('./pages/AiMacro.jsx')"));assert((await read('vite.config.js')).includes('/world-inflation-lens/'))},
 'chart text equivalent outside SVG and table intact':async()=>{assert((await read('src/components/AiMacroChart.jsx')).includes('am-chart-text'));assert((await read('src/pages/AiMacro.jsx')).includes('<caption>'))},
 'selection updates have live text':async()=>assert((await read('src/pages/AiMacro.jsx')).includes('aria-live="polite" aria-atomic="true"')),
 'visible focus and readable mobile axis equivalent':async()=>{const css=await read('src/ai-macro.css');assert(css.includes(':is(button,a):focus-visible'));assert(css.includes('.am-chart-axis{font-size:13px'))},
 'no new unsafe DOM or runtime economic API':async()=>{for(const p of ['src/pages/AiMacro.jsx','src/components/AiMacroChart.jsx','src/i18n/aiMacro.js'])assert(!/dangerouslySetInnerHTML|https:\/\/.*token=|VITE_.*TOKEN|fetch\(/.test(await read(p)))},
 'no dependency or workflow change':()=>{const p=spawnSync('git',['diff','--name-only','4a10e16f2d956fc25262c55da16a10c8d36fedab','--','package-lock.json','.github/workflows','vite.config.js'],{cwd:root,encoding:'utf8'});assert.equal(p.status,0);assert.equal(p.stdout,'')},
 'existing data namespaces unchanged':()=>{const p=spawnSync('git',['diff','--name-only','4a10e16f2d956fc25262c55da16a10c8d36fedab','--','data','src/data/ai-capex','src/data/ai-infrastructure','public/data/ai-infrastructure'],{cwd:root,encoding:'utf8'});assert.equal(p.stdout,'')},
}
Object.assign(tests,{
 'all nine required release artifacts exist':async()=>{for(const p of ['PHASE_D2_RELEASE_READINESS.md','data-redistribution-review.json','data-integrity-results.json','accessibility-review.md','browser-qa-results.md','performance-results.md','release-security-review.md','release-candidate-manifest.json','PHASE_D3_DEPLOYMENT_PLAN.md'])assert((await read('docs/ai-macro-release/phase-d2/'+p)).length>100)},
 'full local integrity report distinguished from public zero records':async()=>{const d=await json('docs/ai-macro-release/phase-d2/data-integrity-results.json');assert.equal(d.fullSnapshotCheck.records,12949);assert.equal(d.fullSnapshotCheck.missing,360);assert.equal(d.publicCandidate.records,0);assert.equal(d.publicCandidate.historyAssetIncluded,false);assert.equal(d.fullSnapshotCheck.projectionHash,identity.projectionHash)},
 'metadata coverage retains native clocks and frequencies':async()=>{const d=await json('docs/ai-macro-release/phase-d2/data-integrity-results.json');assert.equal(d.seriesMetadata.length,36);assert.equal(d.seriesMetadata.reduce((n,r)=>n+r.records,0),12949);for(const r of d.seriesMetadata){assert(r.unit&&r.frequency&&r.sourceHash&&r.clocks.retrievedAt);assert.equal(r.clocks.firstPublicationDates,null)}},
 'manifest records material gates, not READY':async()=>{const m=await json('docs/ai-macro-release/phase-d2/release-candidate-manifest.json');assert.equal(m.classification,'PARTIAL — RELEASE GAPS');assert.deepEqual(m.releaseGates.map(g=>g.id),['LIC-01','SEC-01','A11Y-01']);assert.equal(m.includedDatasetVersions.length,0)},
 'screen reader is never claimed passed':async()=>{assert((await read('docs/ai-macro-release/phase-d2/accessibility-review.md')).includes('MANUAL ACCEPTANCE PENDING'));const qa=await json('docs/ai-macro-release/phase-d2/browser-qa-summary.json');assert.equal(qa.screenReader,'MANUAL ACCEPTANCE PENDING')},
 'eight full and eight hold browser combinations reported':async()=>{const qa=await json('docs/ai-macro-release/phase-d2/browser-qa-summary.json');assert.equal(qa.fullLocalCombinations.length,8);assert.equal(qa.publicHoldCombinations.length,8);assert(qa.fullLocalCombinations.every(r=>r.result==='PASS'));assert(qa.publicHoldCombinations.every(r=>r.records===0&&r.historyRequests===0));assert.equal(qa.legacyRoutes.length,26);assert.equal(qa.pageErrors.length,0);assert.equal(qa.economicRuntimeRequests.length,0)},
 'same-size tampering and source failure are isolated in browser':async()=>{const qa=await json('docs/ai-macro-release/phase-d2/browser-qa-summary.json');assert.deepEqual(qa.fullDataFailureModes.map(r=>r.mode),['blocked','changed_bytes']);assert(qa.fullDataFailureModes.every(r=>r.summaryRetained&&r.automaticRetry===false))},
 'source hash change cannot inherit rights approval':()=>{const d=structuredClone(review);d.fullPublicReleaseAllowed=true;d.blockedSources=[];for(const r of d.records){r.status='ALLOWED — ATTRIBUTION REQUIRED';r.publicDisplay='SUPPORTED';r.staticDownload='SUPPORTED';r.derivativeDisplay='SUPPORTED_WITH_CALCULATION_LABELS';r.unresolvedQuestion=null}d.records[0].sourceHash='0'.repeat(64);assert.throws(()=>assertPublicRights(d,historical))},
 'security review preserves high gate and compatible patch':async()=>{const d=await read('docs/ai-macro-release/phase-d2/release-security-review.md');assert(d.includes('SEC-01')&&d.includes('1.2.1')&&d.includes('1.2.2'));const lock=await json('package-lock.json');assert.equal(lock.packages['node_modules/source-map-js'].version,'1.2.1');assert.equal(lock.packages['node_modules/source-map-js'].dev,true)},
 'direct dependency versions used by tests match locked modules':async()=>{const lock=await json('package-lock.json');for(const name of ['react','react-dom','vite','postcss','source-map-js']){const installed=await json('node_modules/'+name+'/package.json');assert.equal(installed.version,lock.packages['node_modules/'+name].version,name)}},
 'D3 plan is gated and rollback uses a new revert commit':async()=>{const d=await read('docs/ai-macro-release/phase-d2/PHASE_D3_DEPLOYMENT_PLAN.md');assert(d.includes('LIC-01')&&d.includes('SEC-01')&&d.includes('A11Y-01'));assert(d.includes('Owner approval'));assert(d.includes('Revert the specific integration commit with a new commit'))},
})
for(const [name,run]of Object.entries(tests))test(name,run)
if(process.env.WIL_D2_FULL_FIXTURE){
 const path=resolve(process.env.WIL_D2_FULL_FIXTURE),summaryBytes=await readFile(join(path,'summary.json')),historyBytes=await readFile(join(path,'history.json')),summary=JSON.parse(summaryBytes),history=JSON.parse(historyBytes)
 test('external local full snapshot retains 12/36/12949/360',async()=>{await verifySummary(summary,webcrypto);assert(validHistory(history,summary));assert.equal(new Set(summary.series.map(s=>s.indicatorId)).size,12);assert.equal(history.series.length,36);const rows=history.series.flatMap(s=>s.observations);assert.equal(rows.length,12949);assert.equal(rows.filter(r=>r.value===null).length,360)})
 test('external full history exact D1 byte hash',()=>assert.equal(hash(historyBytes),identity.historyHash))
 test('fresh-process external full byte identity',()=>{const expression="import{readFileSync}from'node:fs';import{createHash}from'node:crypto';process.stdout.write(createHash('sha256').update(readFileSync(process.argv[1])).digest('hex'))";const p=spawnSync(process.execPath,['--input-type=module','-e',expression,join(path,'history.json')],{encoding:'utf8'});assert.equal(p.status,0);assert.equal(p.stdout,identity.historyHash)})
 if(process.env.WIL_D2_C2_INPUT)test('full local projection reproduces C2 without economic recalculation',async()=>{const output=project(await readFile(process.env.WIL_D2_C2_INPUT),historical);assert.deepEqual(output.summaryBytes,summaryBytes);assert.deepEqual(output.historyBytes,historyBytes);assert.equal(hash(bytes({...hold})),hash(bytes(JSON.parse(await read('src/data/ai-macro/summary.json')))))})
}
