import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parseFredTable } from './fredTable.mjs'
import { diffObservations, summarizeChanges } from './refresh.mjs'
export const bankSpec = { id: 'DPSACBM027SBOG', frequency: 'Monthly', units: 'Billions of U.S. Dollars', adjustment: 'Seasonally Adjusted', positive: true }
const fed = 'https://www.federalreserve.gov/econres/notes/feds-notes/stablecoins-in-2025-developments-and-financial-stability-implications-20260408.html'
const imf = 'https://www.imf.org/en/news/articles/2026/08/07/sp080726-stablecoins-emerging-markets-dan-katz'
const treasury = 'https://www.imf.org/en/news/articles/2026/05/11/sp051126-tokenized-finance-and-money'
export const publicationSpecs = [
 {id:'FED_STABLECOIN_SIZE',file:'stablecoins',provider:'Federal Reserve / FEDS Notes',sourceUrl:fed,sourceUpdatedAt:'2026-04-08',observationDate:'2026-04-06',units:'USD billion',qualifier:'reported',pattern:/market capitalization reaching \$(\d+) billion as of April 6, 2026/,definition:'Global stablecoin market capitalization cited by Fed staff; underlying provider DeFiLlama. Not an official monetary aggregate.',underlyingProvider:'DeFiLlama, cited by Federal Reserve staff'},
 {id:'IMF_STABLECOIN_SIZE',file:'stablecoins',provider:'IMF / public remarks',sourceUrl:imf,sourceUpdatedAt:'2026-08-07',observationDate:null,units:'USD billion',qualifier:'approximately',pattern:/around \$(\d+) billion/,definition:'Rounded global stablecoin market-size estimate in IMF remarks; exact observation date and underlying dataset not specified.',underlyingProvider:'Not specified in the cited statement'},
 {id:'IMF_USD_SHARE',file:'stablecoins',provider:'IMF / public remarks',sourceUrl:imf,sourceUpdatedAt:'2026-08-07',observationDate:null,units:'percent of stablecoin denomination',qualifier:'nearly',pattern:/Nearly (\d+) percent of stablecoins are denominated in U.S. dollars/,definition:'Approximate USD-denominated share cited in IMF remarks; exact measurement date and denominator construction not specified. Not the share of global payments.',underlyingProvider:'Not specified in the cited statement'},
 {id:'IMF_TBILL_SHARE',file:'treasury-holdings',provider:'IMF / public remarks',sourceUrl:treasury,sourceUpdatedAt:'2026-05-11',observationDate:null,units:'percent of outstanding US Treasury bills',qualifier:'approximately',pattern:/hold approximately (\d+) percent of outstanding US Treasury bills/,definition:'Approximate stablecoin holdings as a share of outstanding U.S. Treasury bills cited in IMF remarks. Not percent of all Treasury debt, nor percent of issuer reserves; no dollar holding inferred.',underlyingProvider:'Not specified for this estimate in the cited statement'},
]
const digest = text => createHash('sha256').update(text).digest('hex')
export function publicationSnapshots(excerpts) {
 assert.deepEqual(excerpts.map(x=>x.id),publicationSpecs.map(x=>x.id))
 const result = {'stablecoins':{version:1,records:[]},'treasury-holdings':{version:1,records:[]}}
 for (const spec of publicationSpecs) {
  const excerpt = excerpts.find(x=>x.id===spec.id)
  assert.equal(excerpt.sourceUrl,spec.sourceUrl);assert.equal(excerpt.sourceUpdatedAt,spec.sourceUpdatedAt)
  assert.ok(excerpt.checkedVia==='official publication manually reviewed')
  const match = excerpt.text.match(spec.pattern); assert.ok(match,`Source excerpt changed: ${spec.id}`)
  const {pattern,file,...metadata}=spec
  result[file].records.push({...metadata,value:Number(match[1]),frequency:'publication snapshot',seasonalAdjustment:'not applicable',proxy:true,status:'published_research_estimate',retrievedAt:excerpt.retrievedAt,reviewedAt:excerpt.retrievedAt,evidenceSha256:digest(excerpt.text),evidenceHashScope:'Retained short source excerpt, not full source document',license:spec.provider.startsWith('IMF')?'IMF attribution; factual statistic and short excerpt only, no underlying proprietary dataset redistributed':'US government research attribution; factual citation only, no underlying DeFiLlama dataset redistributed'})
 }
 return result
}
export function validatePublications(bundle,excerpts,now=new Date()) {
 const expected=publicationSnapshots(excerpts)
 assert.deepEqual(bundle,expected,'Publication snapshots must match retained reviewed excerpts')
 for (const x of Object.values(bundle).flatMap(b=>b.records)) {
  assert.ok(Number.isFinite(x.value)&&x.value>0)
  if(x.units.startsWith('percent'))assert.ok(x.value<=100)
  assert.match(x.retrievedAt,/^\d{4}-\d{2}-\d{2}$/)
  assert.ok(x.sourceUpdatedAt<=x.retrievedAt&&x.retrievedAt<=now.toISOString().slice(0,10))
  if(x.observationDate)assert.ok(x.observationDate<=x.sourceUpdatedAt)
 }
 return bundle
}
export function parseBankDeposits(html,retrievedAt=new Date().toISOString().slice(0,10)) {
 const s=parseFredTable(html,bankSpec.id,bankSpec)
 return validateBank({...s,retrievedAt,sourceSha256:digest(html),definition:'Total deposits at all U.S. commercial banks, H.8 monthly seasonally adjusted stock. Aggregate bank funding context, not a measure of deposits migrating to stablecoins.',proxy:true,status:'observed_bank_funding_context',coverage:{start:s.observations[0].date,end:s.observations.at(-1).date}})
}
export function validateBank(s,now=new Date()) {
 assert.equal(s.id,bankSpec.id);assert.equal(s.units,bankSpec.units);assert.equal(s.frequency,'monthly');assert.equal(s.seasonalAdjustment,'seasonally adjusted')
 assert.equal(s.publisher,'Board of Governors of the Federal Reserve System (US)')
 assert.equal(s.sourceUrl,`https://fred.stlouisfed.org/series/${s.id}`);assert.equal(s.downloadUrl,`https://fred.stlouisfed.org/data/${s.id}`)
 assert.equal(s.proxy,true);assert.equal(s.status,'observed_bank_funding_context');assert.ok(s.definition&&s.license);assert.match(s.sourceSha256,/^[a-f0-9]{64}$/)
 const today=now.toISOString().slice(0,10)
 assert.match(s.sourceUpdatedAt,/^\d{4}-\d{2}-\d{2}$/);assert.match(s.retrievedAt,/^\d{4}-\d{2}-\d{2}$/)
 assert.ok(s.sourceUpdatedAt<=s.retrievedAt&&s.retrievedAt<=today)
 assert.equal(s.observations[0].date,'1973-01');assert.ok(s.observations.at(-1).date>='2026-08')
 s.observations.forEach((p,i)=>{assert.match(p.date,/^\d{4}-(0[1-9]|1[0-2])$/);assert.ok(p.date<=today.slice(0,7));assert.ok(p.value===null||Number.isFinite(p.value)&&p.value>0);if(i){const [y,m]=p.date.split('-').map(Number),[py,pm]=s.observations[i-1].date.split('-').map(Number);assert.equal((y-py)*12+m-pm,1,'Missing or duplicate bank month')}})
 assert.deepEqual(s.coverage,{start:s.observations[0].date,end:s.observations.at(-1).date});return s
}
export function compareBank(prior,next){validateBank(next);assert.ok(next.sourceUpdatedAt>=prior.sourceUpdatedAt,'Bank source date regressed');const changes=diffObservations(prior.observations,next.observations);return {...summarizeChanges(next.id,changes),changes}}
export async function prepareDigitalMoney({input,checkedAt=new Date().toISOString()}) {
 if(input)return parseBankDeposits(await readFile(resolve(input,`wil-${bankSpec.id}.html`),'utf8'),checkedAt.slice(0,10))
 let failure
 for(let n=0;n<3;n++)try{const r=await fetch(`https://fred.stlouisfed.org/data/${bankSpec.id}`,{signal:AbortSignal.timeout(30000)});assert.ok(r.ok,`Bank data HTTP ${r.status}`);return parseBankDeposits(await r.text(),checkedAt.slice(0,10))}catch(e){failure=e}
 throw failure
}
