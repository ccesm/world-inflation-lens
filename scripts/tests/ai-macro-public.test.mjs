import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {spawnSync} from 'node:child_process'
import {webcrypto} from 'node:crypto'
import {CORE,STATES,SECTIONS,canonical,validSummary,validHistory,verifySummary,chartPoints,publicURL,identity} from '../../src/data/ai-macro/contract.js'
import {bytes,hash,project} from '../ai-macro-projection.mjs'
import {macroCopy as c,text,valueText,periodText} from '../../src/i18n/aiMacro.js'
import {chartPath} from '../../src/utils/workspace.js'
import {routeFromHash,routes} from '../../src/utils/routing.js'
import {iaCopy,sectionLinks} from '../../src/i18n/architecture.js'
const summary=JSON.parse(await fs.readFile(new URL('../../src/data/ai-macro/summary.json',import.meta.url)))
const historyBytes=await fs.readFile(new URL('../../public/'+summary.historyArtifact.path,import.meta.url))
const history=JSON.parse(historyBytes),rights=JSON.parse(await fs.readFile(new URL('../../docs/ai-macro/source-rights.json',import.meta.url)))
const clone=()=>structuredClone(summary)
for(const [name,run] of Object.entries({
 'pinned snapshot digest and schema':async()=>{assert(await verifySummary(summary,webcrypto));assert.equal(hash(historyBytes),identity.historyHash);assert.equal(historyBytes.length,4500722);assert(validHistory(history,summary))},
 'exact indicator and series coverage':()=>{assert.equal(CORE.length,12);assert.equal(summary.series.length,36);assert.deepEqual([...new Set(summary.series.map(s=>s.indicatorId))],CORE);assert.equal(Object.values(SECTIONS).flat().length,12);for(const id of CORE.slice(0,2))assert.deepEqual(summary.series.filter(s=>s.indicatorId===id).map(s=>s.geography),STATES)},
 'all 12949 records and 360 nulls preserved':()=>{const rows=history.series.flatMap(s=>s.observations);assert.equal(rows.length,12949);assert.equal(rows.filter(r=>r.value===null).length,360);for(const s of summary.series){const h=history.series.find(x=>x.seriesId===s.seriesId);assert.deepEqual(h.observations.at(-1),s.lastRecord);assert.equal(h.observations.length,s.rawRowCount)}},
 'CPI missing October 2025 is not zero':()=>{assert.equal(history.series.find(s=>s.seriesId==='CPIAUCSL:US').observations.find(r=>r.period==='2025-10-01').value,null);assert.equal(valueText(null,'en'),'Unavailable')},
 'native frequency and units distinct':()=>{assert.equal(summary.series.find(s=>s.indicatorId==='DFII10').frequency,'DAILY');assert.equal(summary.series.find(s=>s.indicatorId==='SPF10').frequency,'QUARTERLY_SURVEY');assert.equal(summary.series.find(s=>s.indicatorId==='NCBDBIQ027S').frequency,'QUARTERLY_END_OF_PERIOD')},
 'daily yields and survey changes remain points':()=>{for(const id of ['DFII10','SPF10'])assert.equal(summary.series.find(s=>s.indicatorId===id).calculationUnit,'PERCENTAGE_POINTS');for(const r of history.series.find(s=>s.seriesId==='DFII10:US').observations)assert.equal(r.yearChange,null)},
 'energy end date stays 2025 separate from research clock':()=>{for(const s of summary.series.filter(s=>s.indicatorId.startsWith('EIA_')||s.indicatorId==='HENRY_HUB'))assert.equal(s.lastRecord.period,'2025-12-01');assert.equal(summary.researchAsOf,'2026-10-09')},
 'official source provenance and rights hash':()=>{assert.equal(hash(bytes(rights)),summary.rightsHash);assert.equal(rights.records.length,11);for(const s of summary.sources){const r=rights.records.find(r=>r.sourceId===s.sourceId);assert.equal(r.status,'ALLOWED');assert.equal(r.sourceHash,s.sourceHash);assert(r.basis&&r.policyURLs.length);assert(publicURL(s.officialURL))}},
 'private wrong host and credential URLs rejected':()=>{for(const url of ['file:///tmp/raw','https://example.com','https://eia.gov.evil.com/a','https://secret@eia.gov/a','http://eia.gov','https://eia.gov@evil.com'])assert(!publicURL(url))},
 'bad schema units counts source IDs fail closed':()=>{for(const mutate of [s=>s.schemaVersion='BAD',s=>s.series.pop(),s=>s.series[0].unit='WATTS',s=>s.series[0].sourceId='UNKNOWN',s=>s.sources[0].rightsStatus='UNRESOLVED',s=>s.historyArtifact.path='../secret',s=>s.series[0].evidence.aiSpecificValue=1]){const s=clone();mutate(s);assert(!validSummary(s))}},
 'same pinned hash does not permit changed displayed value':async()=>{const s=clone();s.series[0].lastRecord.value+=1;assert(validSummary(s));await assert.rejects(verifySummary(s,webcrypto),/identity mismatch/)},
 'history revision and null mutations fail identity':()=>{const h=structuredClone(history);h.series[0].observations.at(-1).revisionFlag='ALTERED';assert(!validHistory(h,summary));assert.notEqual(hash(bytes(h)),identity.historyHash)},
 'duplicate or reordered native observations rejected':()=>{const h=structuredClone(history);h.series[0].observations[1].period=h.series[0].observations[0].period;assert(!validHistory(h,summary))},
 'unknown release date not inferred':()=>{for(const s of summary.series){assert.equal(s.clocks.firstPublicationDates,null);assert.equal(s.clocks.firstReleaseVintageAvailable,false)}},
 'calendar null gaps use existing SVG primitive':()=>{const points=[{date:'2025-01-01',value:1},{date:'2025-02-01',value:null},{date:'2025-03-01',value:2}];const p=chartPath(points,()=>1,v=>v,'monthly');assert.equal((p.match(/M/g)||[]).length,2);assert(!p.includes('L'));assert.equal(chartPoints([{period:'2025-01-01',value:null}])[0].value,null)},
 'no observation frequency conversion in view':()=>{const rows=history.series.find(s=>s.seriesId==='PNFIC1:US').observations;assert.deepEqual(chartPoints(rows,'nativeChange',true),rows.map(r=>({date:r.period,value:r.nativeChange})))},
 'all bilingual public metadata resolved':()=>{function visit(x){if(x&&typeof x==='object'){if(Object.hasOwn(x,'en')||Object.hasOwn(x,'zh')){assert(x.en&&x.zh)}else Object.values(x).forEach(visit)}}visit(c);for(const s of summary.series)for(const [group,key]of [['labels',s.indicatorId],['definitions',s.indicatorId],['frequencies',s.frequency],['units',s.unit],['adjustments',s.seasonalAdjustment],['classifications',s.nominalOrReal],['geographies',s.geography],['revisionLabels',s.lastRecord.revisionFlag]])for(const lang of ['en','zh'])assert(text(c[group][key],lang),`${group}:${key}`);for(const s of summary.sources)assert(c.providers[s.originalProvider])},
 'new route and navigation leave legacy route resolution intact':()=>{assert.equal(routeFromHash('#/research/ai-macro'),'research/ai-macro');for(const route of routes)assert.equal(routeFromHash('#/'+route),route);assert.equal(routeFromHash('#/unknown'),'home');for(const lang of ['en','zh'])assert(iaCopy[lang].nav['research/ai-macro']);assert(sectionLinks.research.some(l=>l[0]==='#/research/ai-macro'))},
 'evidence boundary no E3 or E4 and no forecast':()=>{assert.equal(summary.evidence.forecast,false);assert.equal(summary.evidence.association,'NOT_ESTIMATED');assert.equal(summary.evidence.causality,'NONE');for(const s of summary.series)assert.equal(s.evidence.descriptiveChanges,'E2_ARITHMETIC_ONLY')},
 'unqualified engine input rejected before projection':()=>{assert.throws(()=>project(Buffer.from('{}'),rights),/Unqualified/);assert.throws(()=>project(Buffer.from('{}'),{records:[]}),/Unqualified/)},
 'fresh-process canonical bytes reproduce':()=>{const child=spawnSync(process.execPath,['--input-type=module','-e',`import{readFileSync}from'node:fs';import{bytes,hash}from'./scripts/ai-macro-projection.mjs';const s=JSON.parse(readFileSync('src/data/ai-macro/summary.json'));const{projectionHash,...p}=s;console.log(hash(bytes(p)));`],{encoding:'utf8'});assert.equal(child.status,0);assert.equal(child.stdout.trim(),summary.projectionHash)},
 'unit formatting does not convert quarter or annualize':()=>{assert.equal(periodText('2026-04-01','QUARTERLY','en'),'2026 Q2');assert.equal(periodText('2025-12-01','MONTHLY','zh'),'2025-12')},
 'lazy asset budgets':()=>{assert(bytes(summary).length<150000);assert(historyBytes.length<5000000)},
 'history only own namespace and no clock in projection':async()=>{const script=await fs.readFile(new URL('../ai-macro-projection.mjs',import.meta.url),'utf8');assert(!script.includes('Date.now'));assert(!script.includes('fetch('));assert(!script.includes('src/data/ai-capex'));assert.equal(summary.historyArtifact.path,`data/ai-macro/${identity.historyHash}/history.json`)},
}))test(name,run)
test('history requests deduplicate, preserve BASE_URL, validate hash',async()=>{
 const {loadHistory}=await import('../../src/data/ai-macro/history.js?success');let calls=0,seen;
 const fetchImpl=async(url,opts)=>{calls++;seen=[url,opts];return new Response(historyBytes,{headers:{'content-type':'application/json'}})};
 const values=await Promise.all([loadHistory(summary,{fetchImpl,cryptoImpl:webcrypto}),loadHistory(summary,{fetchImpl,cryptoImpl:webcrypto})]);assert.equal(calls,1);assert.equal(values[0],values[1]);assert(seen[0].startsWith('/world-inflation-lens/data/ai-macro/'));assert.equal(seen[1].credentials,'omit');assert.equal(seen[1].redirect,'error')
})
for(const kind of ['http','mime','hash','size'])test('history '+kind+' rejection with manual retry',async()=>{
 const {loadHistory}=await import('../../src/data/ai-macro/history.js?'+kind);let calls=0;
 const fetchImpl=async()=>{calls++;return kind==='http'?new Response('',{status:503}):kind==='mime'?new Response(historyBytes,{headers:{'content-type':'text/html'}}):kind==='size'?new Response('{}',{headers:{'content-type':'application/json'}}):new Response(Buffer.from(historyBytes.toString().replace('C2','ZZ')),{headers:{'content-type':'application/json'}})};
 // Hash case must actually change fixed bytes without changing byte length.
 const altered=Buffer.from(historyBytes);altered[10]^=1;
 const f=kind==='hash'?async()=>{calls++;return new Response(altered,{headers:{'content-type':'application/json'}})}:fetchImpl;
 await assert.rejects(loadHistory(summary,{fetchImpl:f,cryptoImpl:webcrypto}));assert.equal(calls,1);await assert.rejects(loadHistory(summary,{fetchImpl:f,cryptoImpl:webcrypto}));assert.equal(calls,2)
})
test('invalid CLI input leaves both last-valid assets unchanged',async()=>{
 const before=await fs.readFile(new URL('../../src/data/ai-macro/summary.json',import.meta.url));const dir=await fs.mkdtemp('/private/tmp/wil-d1-invalid-');try{const file=dir+'/input.json';await fs.writeFile(file,'{}');const p=spawnSync(process.execPath,['scripts/ai-macro-projection.mjs','--input',file],{encoding:'utf8'});assert.notEqual(p.status,0);assert.deepEqual(await fs.readFile(new URL('../../src/data/ai-macro/summary.json',import.meta.url)),before);assert.deepEqual(await fs.readFile(new URL('../../public/'+summary.historyArtifact.path,import.meta.url)),historyBytes)}finally{await fs.rm(dir,{recursive:true})}
})
