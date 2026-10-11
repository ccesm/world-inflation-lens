import publicIdentity from './public-identity.json' with {type:'json'}
// Fixed-vintage presentation contract; no economic calculations or source retrieval.
export const CORE=['EIA_COMM_SALES','EIA_COMM_PRICE','HENRY_HUB','CENSUS_DC','PNFIC1','DFII10','NCBDBIQ027S','OPHNFB','ULCNFB','CPIAUCSL','PCEPILFE','SPF10']
export const STATES=['IL','KS','KY','MI','MO','NE','NM','OH','OK','PA','UT','VA','WI']
export const SECTIONS={ENERGY:CORE.slice(0,4),FINANCING:CORE.slice(4,7),PRODUCTIVITY:CORE.slice(7,9),INFLATION:CORE.slice(9)}
export const identity={projectionHash:'f1150945a0f32672c60ff594de2c079c7b8318554dc919bf5061771855bf8256',historyHash:'5c8381bb1729570146b7ddcaf371251f9d1fa678daa1751cfd2c86222d371590',researchCommit:'362929adfae20b31d8044e5c9a10ae020f0c9eaf',inputHash:'480e10d32d5d8317589aa279edafe4137b4d1bb8e384093ed0a1a896dcb5018d'}
export const FREQUENCIES=['MONTHLY','QUARTERLY','DAILY','QUARTERLY_END_OF_PERIOD','QUARTERLY_SURVEY']
export const UNITS=['MWh','CENTS_PER_KWH','USD_PER_MMBTU','MILLION_USD_SAAR','BILLION_CHAINED_2017_USD_SAAR','PERCENT_PER_ANNUM','MILLION_USD','INDEX_2017_100','INDEX_1982_1984_100','PERCENT_ANNUAL_AVERAGE']
export const CHANGE_STATUS=['AVAILABLE','COMPARISON_PERIOD_ABSENT','MISSING_ENDPOINT','NOT_DEFINED_FOR_DAILY_YIELD']
const date=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value
const hash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value)
const numeric=value=>value===null||(typeof value==='number'&&Number.isFinite(value))
const exact=(object,fields)=>object&&Object.keys(object).sort().join('|')===[...fields].sort().join('|')
export const NUMERICAL_CORE=CORE.filter(id=>id!=='SPF10')
export const EXTERNAL={indicatorId:'SPF10',publicationMode:'EXTERNAL_SOURCE_ONLY',rightsStatus:'UNRESOLVED',officialURL:'https://www.philadelphiafed.org/surveys-and-data/real-time-data-research/inflation-forecasts'}
const rootFields=['schemaVersion','researchCommit','researchAsOf','copyVersion','c2SchemaVersion','c2InputHash','inputIdentityHash','outputSetHash','rightsHash','sources','series','historyArtifact','evidence','projectionHash','externalIndicators']
const rowFields=['geography','locator','nativeBasePeriod','nativeChange','nativeChangeStatus','nativeIntervalDays','period','periodEnd','revisionFlag','value','yearBasePeriod','yearChange','yearChangeStatus']
export function publicURL(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&['eia.gov','census.gov','philadelphiafed.org','fred.stlouisfed.org'].some(h=>u.hostname===h||u.hostname.endsWith('.'+h))}catch{return false}}
export function validRecord(r){
 return exact(r,rowFields)&&date(r.period)&&date(r.periodEnd)&&r.period<=r.periodEnd&&r.periodEnd<='2026-10-09'&&numeric(r.value)&&numeric(r.nativeChange)&&numeric(r.yearChange)&&CHANGE_STATUS.includes(r.nativeChangeStatus)&&CHANGE_STATUS.includes(r.yearChangeStatus)&&typeof r.locator==='string'&&r.locator.length>0&&[r.nativeBasePeriod,r.yearBasePeriod].every(v=>v===null||date(v))&&(r.nativeIntervalDays===null||Number.isInteger(r.nativeIntervalDays))&&((r.nativeChangeStatus==='AVAILABLE')===(r.nativeChange!==null))&&((r.yearChangeStatus==='AVAILABLE')===(r.yearChange!==null))
}
export function validSummary(s){try{
 if(!exact(s,rootFields)||s.schemaVersion!=='AI_MACRO_PUBLIC_2'||s.researchCommit!==identity.researchCommit||s.researchAsOf!=='2026-10-09'||s.c2SchemaVersion!=='C2.1'||s.copyVersion!=='D21_COPY_1'||s.projectionHash!==publicIdentity.projectionHash||s.inputIdentityHash!==identity.inputHash||s.rightsHash!==publicIdentity.rightsHash||JSON.stringify(canonical(s.externalIndicators))!==JSON.stringify(canonical([EXTERNAL])))return false
 if(s.series.length!==35||new Set(s.series.map(x=>x.seriesId)).size!==35||s.sources.length!==10||new Set(s.sources.map(x=>x.sourceId)).size!==10)return false
 if(NUMERICAL_CORE.some(id=>s.series.filter(x=>x.indicatorId===id).length!==(['EIA_COMM_SALES','EIA_COMM_PRICE'].includes(id)?13:1)))return false
 if(s.sources.some(x=>!['ALLOWED — PUBLIC DISPLAY','ALLOWED — ATTRIBUTION REQUIRED'].includes(x.rightsStatus)||x.publicationMode!=='PUBLIC_NUMERICAL_DATA'||x.sourceId==='SPF10'||!hash(x.sourceHash)||!publicURL(x.officialURL)))return false
 if(s.series.some(x=>!NUMERICAL_CORE.includes(x.indicatorId)||!FREQUENCIES.includes(x.frequency)||!UNITS.includes(x.unit)||!SECTIONS[x.channel]?.includes(x.indicatorId)||!validRecord(x.lastRecord)||!validRecord(x.lastNonmissing)||x.lastNonmissing.value===null||x.sourceHash!==s.sources.find(y=>y.sourceId===x.sourceId)?.sourceHash||x.clocks.firstPublicationDates!==null||x.clocks.firstReleaseVintageAvailable!==false||x.evidence.causalIdentification!=='NONE'||x.evidence.statisticalAssociation!=='NOT_ESTIMATED'||x.evidence.aiSpecificValue!==null))return false
 if(['EIA_COMM_SALES','EIA_COMM_PRICE'].some(id=>s.series.filter(x=>x.indicatorId===id).map(x=>x.geography).sort().join('|')!==STATES.join('|')))return false
 if(s.series.reduce((n,x)=>n+x.rawRowCount,0)!==publicIdentity.recordCount||s.series.reduce((n,x)=>n+x.missingRowCount,0)!==publicIdentity.missingCount)return false
 const a=s.historyArtifact
 return exact(a,['path','sha256','byteSize','seriesCount','recordCount','missingCount'])&&a.sha256===publicIdentity.historyHash&&a.path===`data/ai-macro/${a.sha256}/history.json`&&a.byteSize===publicIdentity.byteSize&&a.seriesCount===35&&a.recordCount===publicIdentity.recordCount&&a.missingCount===publicIdentity.missingCount&&s.evidence.forecast===false
}catch{return false}}
export function canonical(value){if(Array.isArray(value))return value.map(canonical);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])]));return value}
export async function digest(bytes,cryptoImpl=globalThis.crypto){return [...new Uint8Array(await cryptoImpl.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join('')}
export async function verifySummary(s,cryptoImpl=globalThis.crypto){
 if(!validSummary(s))throw Error('Invalid macro snapshot')
 const {projectionHash,...payload}=s
 if(await digest(new TextEncoder().encode(JSON.stringify(canonical(payload))+'\n'),cryptoImpl)!==projectionHash)throw Error('Macro snapshot identity mismatch')
 return s
}
export function validHistory(h,s){try{
 if(!exact(h,['schemaVersion','researchCommit','researchAsOf','inputIdentityHash','series'])||h.schemaVersion!=='AI_MACRO_HISTORY_2'||h.researchCommit!==s.researchCommit||h.researchAsOf!==s.researchAsOf||h.inputIdentityHash!==s.inputIdentityHash||h.series.length!==35||new Set(h.series.map(x=>x.seriesId)).size!==35)return false
 for(const x of h.series){
  const meta=s.series.find(y=>y.seriesId===x.seriesId)
  if(!meta||!exact(x,['seriesId','sourceHash','observations'])||x.sourceHash!==meta.sourceHash||x.observations.length!==meta.rawRowCount)return false
  if(x.observations.some((r,i)=>!validRecord(r)||r.geography!==meta.geography||(i>0&&x.observations[i-1].period>=r.period)))return false
  if(x.observations.filter(r=>r.value===null).length!==meta.missingRowCount)return false
  if(JSON.stringify(canonical(x.observations.at(-1)))!==JSON.stringify(canonical(meta.lastRecord)))return false
 }
 return true
}catch{return false}}
// View-only selection; neither fields nor statistical frequencies are transformed.
export function chartPoints(records,measure='value',full=false){return records.filter(r=>full||r.period>='2015-01-01').map(r=>({date:r.period,value:r[measure]}))}
export function drawingFrequency(frequency){return frequency==='MONTHLY'?'monthly':frequency==='DAILY'?'daily':'quarterly'}

export function isReleaseHold(s){return exact(s,['schemaVersion','reason','sourceIds','researchAsOf','fullProjectionHash','fullHistoryHash'])&&s.schemaVersion==='AI_MACRO_RELEASE_HOLD_1'&&s.reason==='PUBLIC_REDISTRIBUTION_UNRESOLVED'&&JSON.stringify(s.sourceIds)==='["SPF10"]'&&s.researchAsOf==='2026-10-09'&&s.fullProjectionHash===identity.projectionHash&&s.fullHistoryHash===identity.historyHash}
