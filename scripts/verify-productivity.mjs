import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { validateProductivity, parseProductivityFred, parseConstruction, compareProductivity } from './lib/productivity.mjs'
import { productivitySources } from './lib/productivity-sources.mjs'
import { productivityHtml } from './lib/productivity-fixtures.mjs'
import { growth, movingMean, quarterlyAverage, realGdpPerWorker, aiAssessment, productivityCsv, periodLabel } from '../src/utils/productivity.js'
import { observationStatus } from '../src/utils/dataStatus.js'
const bundle=JSON.parse(await readFile(new URL('../data/productivity/series.json',import.meta.url),'utf8'))
validateProductivity(bundle)
const byId=Object.fromEntries(bundle.series.map(s=>[s.id,s]))
for(const spec of productivitySources){const s=byId[spec.id];const html=productivityHtml(s);const parsed=parseProductivityFred(html,spec,s.retrievedAt);assert.deepEqual(parsed.observations,s.observations);assert.throws(()=>parseProductivityFred(html.replace(`<td>${s.units}</td>`,'<td>Wrong units</td>'),spec,s.retrievedAt));assert.throws(()=>parseProductivityFred(html.replace(`<td>${spec.frequency}</td>`,'<td>Annual</td>'),spec,s.retrievedAt));assert.throws(()=>parseProductivityFred(html.replace(`<td>${spec.adjustment}</td>`,'<td>Wrong adjustment</td>'),spec,s.retrievedAt))}
for(const mutation of [b=>b.series[0].observations.splice(4,1),b=>b.series[0].observations[4].date=b.series[0].observations[3].date,b=>b.series[0].observations[4].date='1948-02',b=>b.series[0].observations[4].value=-1,b=>b.series[3].proxy=false,b=>b.series[0].observations.pop()]){const b=structuredClone(bundle);mutation(b);assert.throws(()=>validateProductivity(b))}
assert.throws(()=>parseConstruction({title:'Wrong',units:'Millions of dollars'},Buffer.from(''), '2026-09-16'))
const q={frequency:'quarterly',observations:[{date:'2020-01',value:100},{date:'2020-04',value:102},{date:'2020-07',value:null},{date:'2020-10',value:105},{date:'2021-01',value:110},{date:'2021-04',value:112}]}
assert.ok(Math.abs(growth(q)[4].value-10)<1e-10)
assert.ok(Math.abs(growth(q,'annualized')[1].value-((1.02**4-1)*100))<1e-10)
assert.equal(growth(q,'annualized')[3].value,null)
assert.equal(growth({...q,observations:q.observations.filter(p=>p.date!=='2020-01')})[3].value,null)
assert.equal(movingMean(Array.from({length:21},(_,i)=>({date:String(i),value:i})))[19].value,9.5)
assert.equal(movingMean(Array.from({length:20},(_,i)=>({date:String(i),value:i===3?null:i})))[19].value,null)
const employment={id:'JOBS',frequency:'monthly',observations:[{date:'2020-01',value:100},{date:'2020-02',value:110},{date:'2020-03',value:120},{date:'2020-04',value:130}]}
assert.equal(quarterlyAverage(employment).observations.length,1)
assert.equal(quarterlyAverage(employment).observations[0].value,110)
assert.equal(quarterlyAverage({...employment,observations:employment.observations.filter(p=>p.date!=='2020-02')}).observations[0].value,null)
const gdp={...q,observations:[{date:'2020-01',value:22},{date:'2020-04',value:25}]}
const worker=realGdpPerWorker(gdp,employment)
assert.equal(worker.observations[0].value,200000)
assert.equal(worker.observations[1].value,null)
assert.equal(worker.inputSources.length,2)
const actualWorker=realGdpPerWorker(byId.GDPC1,byId.CE16OV)
assert.equal(actualWorker.coverage.start,'1948-01')
assert.equal(actualWorker.units,'2017 USD per employed person, annualized')
assert.notDeepEqual(byId.COMPNFB.observations,byId.OPHNFB.observations)
assert.notDeepEqual(byId.ULCNFB.observations,byId.COMPNFB.observations)
assert.ok(byId.CUUR0000SEHF01.observations.some(p=>p.value===null),'Historic missing CPI must remain missing')
const assessment=aiAssessment(byId,new Date('2026-09-16'))
for(const part of Object.values(assessment)){assert.equal(part.evidence.length,3);assert.equal(new Set(part.evidence.map(e=>e.date)).size,1);assert.ok(['easing','expansion','mixed'].includes(part.code))}
assert.equal(aiAssessment(byId,new Date('2030-01-01')).labor.code,'insufficient')
const missing=structuredClone(byId);missing.ULCNFB.observations.forEach(p=>p.value=null)
assert.equal(aiAssessment(missing,new Date('2026-09-16')).labor.code,'insufficient')
const revised=structuredClone(bundle);revised.series[0].observations.at(-1).value+=.01
assert.equal(compareProductivity(bundle,revised)[0].revised,1)
assert.ok(compareProductivity(bundle,bundle).every(s=>s.total===0))
const csv=productivityCsv(actualWorker,actualWorker.observations,'level');assert.ok(csv.startsWith('\ufeff'));assert.ok(csv.includes('GDPC1')&&csv.includes('CE16OV'));assert.match(productivityCsv(byId.CENSUS_DATACENTER,byId.CENSUS_DATACENTER.observations,'level'),/"p"/)
assert.equal(periodLabel('2026-04','quarterly'),'2026 Q2')
assert.equal(observationStatus([{date:'2026-04',value:1}],'quarterly',new Date('2026-09-16')).old,false)
assert.equal(observationStatus([{date:'2025-10',value:1}],'quarterly',new Date('2026-09-16')).old,true)
console.log('PASS: 16 official productivity snapshots; strict units, quarterly anchors and metadata; no gap filling; labor-series separation; growth, moving average, GDP/worker, proxy labels, common-quarter assessment, CSV provenance and revisions')
