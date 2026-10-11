// Offline projection of pinned, validated C2 output. Copies arithmetic; never fetches or calculates it.
import { readFile, mkdir, writeFile, rename, unlink } from 'node:fs/promises'
import { resolve, dirname, join } from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
export const researchCommit='362929adfae20b31d8044e5c9a10ae020f0c9eaf'
export const c2Hash='ac85a5fe4455112f95f83ae2a650a637578480cf8ec1feba8cd52db15b642ec7'
export const inputIdentityHash='480e10d32d5d8317589aa279edafe4137b4d1bb8e384093ed0a1a896dcb5018d'
export const outputSetHash='34eac463e54188e9da70e10cd7ae6758bec5ec2f365b9289b8f396f5cf96a788'
export const core=['EIA_COMM_SALES','EIA_COMM_PRICE','HENRY_HUB','CENSUS_DC','PNFIC1','DFII10','NCBDBIQ027S','OPHNFB','ULCNFB','CPIAUCSL','PCEPILFE','SPF10']
export function canonical(value){
 if(Array.isArray(value))return value.map(canonical)
 if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])]))
 if(typeof value==='number'&&!Number.isFinite(value))throw Error('Non-finite value')
 return value
}
export const bytes=value=>Buffer.from(JSON.stringify(canonical(value))+'\n')
export const hash=value=>createHash('sha256').update(value).digest('hex')
function require(ok,message){if(!ok)throw Error(message)}
export function project(input,rights){
 require(hash(input)===c2Hash,'Unqualified C2 input bytes')
 const model=JSON.parse(input)
 require(model.schemaVersion==='C2.1'&&model.status==='COMPLETE'&&model.sourceAsOf==='2026-10-09','C2 schema/status/vintage')
 require(model.inputIdentityHash===inputIdentityHash,'C2 identity')
 require(JSON.stringify([...new Set(model.series.map(s=>s.indicatorId))])===JSON.stringify(core),'Exact twelve indicators')
 require(model.series.length===36,'36 native series required')
 const sources=[...new Set(model.series.map(s=>s.sourceId))].sort().map(id=>{
  const s=model.series.find(s=>s.sourceId===id),r=rights.records.filter(r=>r.sourceId===id)
  require(r.length===1&&r[0].status==='ALLOWED'&&r[0].sourceHash===s.sourceHash,'Redistribution gate: '+id)
  require(r[0].policyURLs.length>0&&r[0].basis,'Rights evidence required')
  const url=new URL(s.officialURL)
  require(url.protocol==='https:'&&!url.username&&!url.password,'Official public URL')
  require(['eia.gov','census.gov','philadelphiafed.org','fred.stlouisfed.org'].some(h=>url.hostname===h||url.hostname.endsWith('.'+h)),'Unexpected official source host')
  return {sourceId:id,sourceHash:s.sourceHash,officialURL:s.officialURL,originalProvider:s.originalProvider,attribution:r[0].attribution,rightsStatus:r[0].status,rightsScope: rights.purpose,policyURLs:r[0].policyURLs}
 })
 const fields=['seriesId','indicatorId','channel','geography','frequency','unit','seasonalAdjustment','nominalOrReal','measureType','definition','attribution','sourceId','sourceHash','clocks','revisionPolicy','publicationSchedule','limitations','confounders','evidence','calculationUnit','nativeChangeBasis','sourceStatus','liveAccessStatus','freshnessStatus','latestAvailableAtSourceReview','lastRecord','lastNonmissing','rawRowCount','missingRowCount','commonWindow','revisionFlags']
 const series=model.series.map(s=>Object.fromEntries(fields.map(k=>[k,s[k]])))
 const history={schemaVersion:'AI_MACRO_HISTORY_1',researchCommit,researchAsOf:model.sourceAsOf,inputIdentityHash,series:model.series.map(s=>({seriesId:s.seriesId,sourceHash:s.sourceHash,observations:s.observations}))}
 const records=history.series.flatMap(s=>s.observations)
 require(records.length===12949&&records.filter(r=>r.value===null).length===360,'Native record/missing count')
 const historyBytes=bytes(history),historyHash=hash(historyBytes)
 const summary={schemaVersion:'AI_MACRO_PUBLIC_1',researchCommit,researchAsOf:model.sourceAsOf,copyVersion:'D1_COPY_1',c2SchemaVersion:model.schemaVersion,c2InputHash:c2Hash,inputIdentityHash,outputSetHash,rightsHash:hash(bytes(rights)),sources,series,historyArtifact:{path:`data/ai-macro/${historyHash}/history.json`,sha256:historyHash,byteSize:historyBytes.length,seriesCount:36,recordCount:12949,missingCount:360},evidence:{observations:'E1',calculations:'E2_ARITHMETIC_ONLY',mechanisms:'E0',association:'NOT_ESTIMATED',causality:'NONE',forecast:false}}
 summary.projectionHash=hash(bytes(summary))
 const summaryBytes=bytes(summary)
 require(summaryBytes.length<=150000&&historyBytes.length<=5000000,'Display asset budget')
 return {summary,summaryBytes,history,historyBytes}
}
// Public publishing is a separate, stricter gate from the historical D1 research fixture.
export function assertPublicRights(review, historicalRights){
 require(review?.schemaVersion==='D2_PUBLIC_RIGHTS_1'&&review.fullPublicReleaseAllowed===true&&Array.isArray(review.blockedSources)&&review.blockedSources.length===0,'D2 public rights unresolved: no asset writes permitted')
 const expected=historicalRights.records.map(r=>r.sourceId).sort()
 require(expected.length===11&&new Set(expected).size===11&&Array.isArray(review.records)&&JSON.stringify(review.records.map(r=>r.sourceId).sort())===JSON.stringify(expected),'Complete exact source coverage required')
 for(const old of historicalRights.records){
  const r=review.records.find(r=>r.sourceId===old.sourceId)
  require(['ALLOWED — PUBLIC DISPLAY','ALLOWED — ATTRIBUTION REQUIRED'].includes(r.status)&&r.publicDisplay==='SUPPORTED'&&r.staticDownload==='SUPPORTED'&&r.derivativeDisplay==='SUPPORTED_WITH_CALCULATION_LABELS'&&r.sourceHash===old.sourceHash&&r.unresolvedQuestion===null&&r.policyURLs?.length>0&&r.evidence&&r.reviewedAt,'Source-specific public rights gate: '+old.sourceId)
 }
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),index=process.argv.indexOf('--input')
 require(index>=0&&process.argv[index+1],'Supply --input with exact C2 analysis.json; no live retrieval')
 const publicRights=JSON.parse(await readFile(join(root,'docs/ai-macro-release/phase-d2/data-redistribution-review.json'),'utf8'))
 const rights=JSON.parse(await readFile(join(root,'docs/ai-macro/source-rights.json'),'utf8'))
 assertPublicRights(publicRights,rights)
 const result=project(await readFile(resolve(process.argv[index+1])),rights)
 // Both fully validated in memory before writing; CLI owns only the dedicated snapshot paths.
 const historyPath=join(root,'public',result.summary.historyArtifact.path),summaryPath=join(root,'src/data/ai-macro/summary.json')
 await mkdir(dirname(historyPath),{recursive:true});await mkdir(dirname(summaryPath),{recursive:true})
 // Immutable object first; only the summary is the atomic publication pointer.
 let existing;try{existing=await readFile(historyPath)}catch(error){if(error.code!=='ENOENT')throw error}
 if(existing)require(hash(existing)===result.summary.historyArtifact.sha256,'Existing immutable object changed')
 else {const staged=historyPath+'.tmp-'+process.pid;try{await writeFile(staged,result.historyBytes,{flag:'wx'});await rename(staged,historyPath)}finally{await unlink(staged).catch(()=>{})}}
 const stagedSummary=summaryPath+'.tmp-'+process.pid
 try{await writeFile(stagedSummary,result.summaryBytes,{flag:'wx'});await rename(stagedSummary,summaryPath)}finally{await unlink(stagedSummary).catch(()=>{})}
 console.log(JSON.stringify({projectionHash:result.summary.projectionHash,historyHash:result.summary.historyArtifact.sha256,summaryBytes:result.summaryBytes.length,historyBytes:result.historyBytes.length,records:12949,missing:360}))
}
