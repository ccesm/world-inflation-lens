export const snapshotSha256 = '8891e6b7dca9317e3d2400bdd3749c54425ff1c0385c1f2151e2593c92227c3a'
export const sourceCommits = { phase2B:'afbc5da5b718d86c48d0e48d31a1eba456a26e09', phase2A1:'ad6ebf96e2bf59145f31120dd02cdcc3fbca24b7' }
const metricUnits={cashPpeNative:'USD_MILLIONS',cashInvestmentIntensity:'PERCENT',cashInvestmentToCfoIntensity:'PERCENT',cfo:'USD_MILLIONS',fcfCompanyConvention:'USD_MILLIONS',fcfMargin:'PERCENT',revenue:'USD_MILLIONS',operatingIncome:'USD_MILLIONS',operatingMargin:'PERCENT',depreciationPpe:'USD_MILLIONS',pureDepreciationToRevenue:'PERCENT',cashPpeToPureDepreciation:'MULTIPLE',segmentRevenue:'USD_MILLIONS',segmentOperatingIncome:'USD_MILLIONS',segmentOperatingMargin:'PERCENT'}
const pinnedHashes={monitorHash:'51a55bb8b9c585026ab37898746695060b3dbb3a7c6aaa83efb5645cbe91a2d4',publicProjectionHash:'1e74e04a1f32ae2d60c3429c14b215560ec085234d783bc52d9bbbe2d7079a2e',inputSnapshotHash:'3ebf93ae4d434cf41d33c228b7f585a95f7694c3669fe269d93edacfc8707ce7'}
const exactKeys=(value,keys)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).sort().join()===keys.split(',').sort().join()
export function validCapexSnapshot(s) {
 try {
  if(!exactKeys(s,'schemaVersion,status,dataThrough,asOf,asOfBasis,studyWindow,provenance,recognizedAiRevenue,aiReturns,companies,events,sources,definitions'))return false
  if(s.schemaVersion!=='ai-capex-public-v0.1'||s.status!=='FIXED_VINTAGE_RESEARCH'||s.dataThrough!=='2026Q2'||s.asOf!=='2026-07-30')return false
  if(s.companies.map(c=>c.id).join()!=='MSFT,GOOG,AMZN,META'||s.recognizedAiRevenue.status!=='UNAVAILABLE'||s.recognizedAiRevenue.companyQuarterCells!==120||s.aiReturns.status!=='NOT_IDENTIFIED')return false
  if(!exactKeys(s.provenance,'phase2B,phase2A1,monitorHash,publicProjectionHash,inputSnapshotHash')||Object.entries(pinnedHashes).some(([k,v])=>s.provenance[k]!==v))return false
  if(!exactKeys(s.studyWindow,'from,through')||s.studyWindow.from!=='2019Q1'||s.studyWindow.through!==s.dataThrough||s.asOfBasis!=='LATEST_ACCEPTED_DISCLOSURE_DATE_NOT_HISTORICAL_AVAILABILITY')return false
  if(!exactKeys(s.recognizedAiRevenue,'status,companyQuarterCells')||!exactKeys(s.aiReturns,'status'))return false
  if(Object.entries(sourceCommits).some(([k,v])=>s.provenance[k]!==v))return false
  for(const source of Object.values(s.sources))if(new URL(source.url).protocol!=='https:'||!/^[a-f0-9]{64}$/.test(source.sha256)||!/^\d{4}-\d{2}-\d{2}$/.test(source.publicationDate))return false
  for(const c of s.companies){
   if(!exactKeys(c,'id,metrics,history')||Object.keys(c.history).sort().join()!=='cashInvestmentIntensity,fcfMargin,operatingMargin')return false
   if(Object.keys(c.metrics).sort().join()!==Object.keys(metricUnits).sort().join())return false
   for(const [key,m] of Object.entries(c.metrics))if(m.value===null?m.unit!==null:m.unit!==metricUnits[key])return false
   for(const m of Object.values(c.metrics))if(!exactKeys(m,'value,unit,scope,definitionVersion,comparability,sourceIds,yoy'))return false
   for(const m of Object.values(c.metrics))if(m.value!==null&&!Number.isFinite(m.value)||!m.sourceIds.every(id=>s.sources[id]))return false
   for(const points of Object.values(c.history)){
    if(points.length!==30||points[0].period!=='2019Q1'||points.at(-1).period!=='2026Q2')return false
    for(let i=0;i<points.length;i++){const p=points[i];if(p.period!==`${2019+Math.floor(i/4)}Q${i%4+1}`||p.value!==null&&!Number.isFinite(p.value)||typeof p.breakBefore!=='boolean'||!s.definitions[p.basis]||!p.sourceIds.every(id=>s.sources[id]))return false
     if(i>0&&p.breakBefore!==(p.basis!==points[i-1].basis))return false
    }
   }
  }
  for(const e of s.events){if(e.eventDate!==s.sources[e.sourceId]?.publicationDate||e.eventDate>s.asOf||e.recognizedRevenue!==false||!s.sources[e.sourceId]||e.eventDate<e.referencePeriod||e.referencePeriod>'2026-06-30')return false
   if(e.kind==='DIRECT_AI_RUN_RATE'&&(e.periodType!=='RUN_RATE'||e.frequency!=='ANNUALIZED_RATE'||e.precision!=='LOWER_BOUND'))return false
   if(e.kind==='BACKLOG'&&e.periodType!=='POINT')return false
   if(e.kind==='CAPEX_GUIDANCE'&&(e.periodType!=='GUIDANCE'||e.evidenceClass!=='FORWARD_GUIDANCE'))return false
   if(e.rangeLower!==null&&(e.value!==null||e.rangeLower>e.rangeUpper))return false
  }
  return true
 } catch {return false}
}
