import assert from 'node:assert/strict'
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises'
import {resolve,join} from 'node:path'
import {tmpdir} from 'node:os'
import {spawnSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import {parseFredTable} from './fredTable.mjs'
import {productivitySources,censusSpecs,censusUrl,censusSource} from './productivity-sources.mjs'
import {monthNumber} from '../../src/utils/inflation.js'
import {diffObservations,summarizeChanges} from './refresh.mjs'
const sha=bytes=>createHash('sha256').update(bytes).digest('hex')
export function parseProductivityFred(html,spec,retrievedAt) {
 const raw=parseFredTable(html,spec.id,spec)
 assert.equal(raw.publisher,spec.publisher)
 return {...raw,definition:spec.definition,proxy:spec.proxy,group:spec.group,sourceSha256:sha(html),retrievedAt,status:'published_observation_subject_to_revision',officialSource:spec.publisher.includes('Labor')?'https://www.bls.gov/':spec.publisher.includes('Economic Analysis')?'https://www.bea.gov/':spec.publisher.includes('Energy')?'https://www.eia.gov/':'https://www.federalreserve.gov/',observations:raw.observations.map(p=>({...p,date:p.date.slice(0,7)}))}
}
export function parseConstruction(raw,bytes,retrievedAt) {
 assert.equal(raw.title,'Value of Private Construction Put in Place - Seasonally Adjusted Annual Rate');assert.match(raw.units,/Millions of dollars/);assert.match(raw.sourceNote,/Source: U.S. Census Bureau/)
 return censusSpecs.map(spec=>({id:spec.id,provider:'U.S. Census Bureau',publisher:'U.S. Census Bureau',title:spec.column,definition:spec.definition,proxy:spec.proxy,group:'construction',units:'Millions of Dollars',frequency:'monthly',seasonalAdjustment:'seasonally adjusted annual rate',sourceUrl:censusSource,officialSource:censusSource,downloadUrl:censusUrl,sourceUpdatedAt:raw.release,retrievedAt,license:'Public domain; credit U.S. Census Bureau, Construction Spending',status:'published_estimate_subject_to_revision',sourceSha256:sha(bytes),sourceColumn:spec.column,sourceNote:raw.sourceNote,observations:raw.series[spec.column].filter(p=>p.date>=spec.start)}))
}
export function validateProductivity(bundle,now=new Date()) {
 assert.deepEqual(bundle.series.map(s=>s.id),[...productivitySources,...censusSpecs].map(s=>s.id))
 for(const s of bundle.series){
  const spec=productivitySources.find(x=>x.id===s.id),census=censusSpecs.find(x=>x.id===s.id)
  assert.equal(s.units,spec?.units||'Millions of Dollars');assert.equal(s.frequency,spec?.frequency.toLowerCase()||'monthly');assert.equal(s.seasonalAdjustment,(spec?.adjustment||'Seasonally Adjusted Annual Rate').toLowerCase())
  assert.equal(s.publisher,spec?.publisher||'U.S. Census Bureau');assert.equal(s.proxy,(spec||census).proxy)
  assert.equal(s.sourceUrl,spec?`https://fred.stlouisfed.org/series/${s.id}`:censusSource)
  assert.equal(s.downloadUrl,spec?`https://fred.stlouisfed.org/data/${s.id}`:censusUrl)
  assert.equal(s.observations[0].date,(spec||census).start)
  assert.ok(s.observations.at(-1).date >= (s.frequency==='quarterly'?'2026-04':s.id==='IPN22112CS'?'2026-05':s.id.startsWith('CENSUS')||s.id==='IPG3344S'?'2026-07':'2026-08'),'Truncated latest coverage')
  assert.ok(s.sourceSha256?.length===64&&s.license&&s.definition)
  assert.match(s.retrievedAt,/^\d{4}-\d{2}-\d{2}$/);assert.ok(s.sourceUpdatedAt<=s.retrievedAt,'Release later than retrieval');assert.equal(s.latestObservation,s.observations.findLast(p=>p.value!==null)?.date||null)
  assert.match(s.sourceUpdatedAt,/^\d{4}-\d{2}-\d{2}$/);assert.ok(s.sourceUpdatedAt<=now.toISOString().slice(0,10)&&s.retrievedAt<=now.toISOString().slice(0,10))
  s.observations.forEach((p,i)=>{assert.match(p.date,/^\d{4}-(0[1-9]|1[0-2])$/);assert.ok(p.date<=now.toISOString().slice(0,7));assert.ok(p.value===null||Number.isFinite(p.value)&&p.value>0);if(s.frequency==='quarterly')assert.match(p.date,/-(01|04|07|10)$/);if(i)assert.equal(monthNumber(p.date)-monthNumber(s.observations[i-1].date),s.frequency==='quarterly'?3:1,'Missing or duplicate period')})
  if(s.coverage)assert.deepEqual(s.coverage,{start:s.observations[0].date,end:s.observations.at(-1).date})
 }
 return bundle
}
export function compareProductivity(prior,next){validateProductivity(next);return next.series.map(s=>{const old=prior.series.find(x=>x.id===s.id);assert.ok(old&&s.sourceUpdatedAt>=old.sourceUpdatedAt,'Source date regressed');const changes=diffObservations(old.observations,s.observations);return {...summarizeChanges(s.id,changes),changes}})}
export async function prepareProductivity({input,checkedAt=new Date().toISOString()}) {
 const date=checkedAt.slice(0,10),temp=await mkdtemp(join(tmpdir(),'wil-productivity-'))
 async function get(url,file){if(input)return readFile(resolve(input,file));let error;for(let n=0;n<3;n++)try{const r=await fetch(url,{signal:AbortSignal.timeout(45000)});assert.ok(r.ok,`HTTP ${r.status}: ${url}`);return Buffer.from(await r.arrayBuffer())}catch(e){error=e}throw error}
 try{
  const series=[]
  for(const spec of productivitySources){const bytes=await get(`https://fred.stlouisfed.org/data/${spec.id}`,`wil-${spec.id}.html`);series.push(parseProductivityFred(bytes.toString(),spec,date))}
  const bytes=await get(censusUrl,'privsatime.xlsx');let raw
  if(input)try{raw=JSON.parse(await readFile(resolve(input,'construction-extracted.json'),'utf8'))}catch(e){if(e.code!=='ENOENT')throw e}
  if(!raw){const path=join(temp,'construction.xlsx');await writeFile(path,bytes);const result=spawnSync(process.env.WIL_PYTHON||'python3',[resolve(import.meta.dirname,'extract-construction.py'),path],{encoding:'utf8',maxBuffer:10_000_000,timeout:60000});assert.equal(result.status,0,result.stderr);raw=JSON.parse(result.stdout)}
  series.push(...parseConstruction(raw,bytes,date))
  return validateProductivity({version:1,series:series.map(s=>({...s,coverage:{start:s.observations[0].date,end:s.observations.at(-1).date},latestObservation:s.observations.findLast(p=>p.value!==null)?.date||null}))})
 }finally{await rm(temp,{recursive:true,force:true})}
}
