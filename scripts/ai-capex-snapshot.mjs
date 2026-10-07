// One-time fixed-vintage extraction. No research modules, live APIs or cache access.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
export const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])])):value;
export const digest=value=>createHash('sha256').update(typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(canonical(value),null,2)+'\n').digest('hex');
export const sourceIdentity={
 phase2B:'afbc5da5b718d86c48d0e48d31a1eba456a26e09',phase2A1:'ad6ebf96e2bf59145f31120dd02cdcc3fbca24b7',
 monitorHash:'51a55bb8b9c585026ab37898746695060b3dbb3a7c6aaa83efb5645cbe91a2d4',
 publicProjectionHash:'1e74e04a1f32ae2d60c3429c14b215560ec085234d783bc52d9bbbe2d7079a2e'
};
export const QUALIFIED_PACKET_HASH='699ff1d5ced2f63648ca58dbd7e21ffaa2781b38bddb98c5562375bd6595e95b';

export function project(packet){
 if(digest(packet)!==QUALIFIED_PACKET_HASH)throw Error('QUALIFIED_PACKET_CONTENT');
 if(packet.public.resultHash!==sourceIdentity.publicProjectionHash||digest(packet.public.content)!==sourceIdentity.publicProjectionHash||packet.identity.resultHash!==sourceIdentity.monitorHash||packet.identity.publicProjectionHash!==sourceIdentity.publicProjectionHash)throw Error('QUALIFIED_SOURCE_IDENTITY');
 const p=packet.public.content,registry={},definitions={};
 const add=(id,url,sha,published,publisher=null)=>{
  if(!id||!/^https:\/\//.test(url)||!/^[a-f0-9]{64}$/.test(sha))throw Error('SOURCE_PROVENANCE');
  const item={url,sha256:sha,publicationDate:published,publisher};
  if(registry[id]&&[registry[id].url,registry[id].sha256,registry[id].publicationDate].join('|')!==[url,sha,published].join('|'))throw Error('CONFLICTING_SOURCE');
  registry[id]={...item,publisher:registry[id]?.publisher??publisher};return id;
 };
 const keep=['cashPpeNative','cashInvestmentIntensity','cashInvestmentToCfoIntensity','cfo','fcfCompanyConvention','fcfMargin','revenue','operatingIncome','operatingMargin','depreciationPpe','pureDepreciationToRevenue','cashPpeToPureDepreciation','segmentRevenue','segmentOperatingIncome','segmentOperatingMargin'];
 const companies=p.companies.map(c=>({id:c.company,metrics:Object.fromEntries(c.metrics.filter(m=>keep.includes(m.metric)).map(m=>[m.metric,{
  value:m.value,unit:m.unit,scope:m.scope,definitionVersion:m.definitionVersion,comparability:m.comparability,
  sourceIds:m.sources.map(s=>add(s.sourceId,s.sourceUrl,s.sourceHash,s.publicationDate,s.publisher)),
  yoy:m.yoy?{state:m.yoy.state,priorPeriod:m.yoy.priorPeriod,delta:m.yoy.delta,deltaUnit:m.yoy.deltaUnit,percentChange:m.yoy.percentChange}:null
 }])),history:Object.fromEntries(['cashInvestmentIntensity','fcfMargin','operatingMargin'].map(metric=>{
  let previous=null;const rows=packet.history.filter(r=>r.company===c.company&&r.metric===metric).sort((a,b)=>a.period.localeCompare(b.period));
  if(rows.length!==30)throw Error('CHART_COVERAGE');
  return [metric,rows.map(r=>{
   const signature=r.basis.signature;definitions[signature]={definitionVersion:r.definitionVersion,nativeMetric:r.nativeMetric,scope:r.scope,unit:r.unit};
   const point={period:r.period,value:r.basis.status==='COMPARABLE'?r.value:null,basis:signature,
    breakBefore:previous!==null&&previous!==signature,...(r.basis.status!=='COMPARABLE'?{gapReason:r.basis.status}:{}),sourceIds:r.provenance.map(s=>add(s.sourceId,s.sourceUrl,s.sha256,s.publicationDate,s.publisher))};
   previous=signature;return point;
  })];
 }))}));
 const events=p.events.map(e=>({id:e.eventId,company:e.company,kind:e.eventType,eventDate:e.eventDate,referencePeriod:e.referencePeriod,
  referencePeriodBasis:e.referencePeriodBasis,reportingQuarter:e.reportingQuarter,value:e.nativeValue,unit:e.unit,precision:e.precision,
  periodType:e.periodType,frequency:e.frequency,evidenceClass:e.evidenceClass,monetizationLevel:e.evidenceLevel,
  sourceId:add(e.sourceId,e.sourceUrl,e.sourceHash,e.eventDate),recognizedRevenue:false,
  scope:e.scope,definitionVersion:e.definitionVersion,rangeLower:e.rangeLower,rangeUpper:e.rangeUpper,guidanceHorizon:e.guidanceHorizon}));
 if(p.dataThrough!=='2026Q2'||p.asOf!=='2026-07-30'||companies.map(c=>c.id).join()!=='MSFT,GOOG,AMZN,META')throw Error('PUBLIC_BOUNDARY');
 if(!p.companies.every(c=>c.metrics.find(m=>m.metric==='aiRevenueRecognized').value===null))throw Error('AI_REVENUE_UNAVAILABLE');
 return {schemaVersion:'ai-capex-public-v0.1',status:'FIXED_VINTAGE_RESEARCH',dataThrough:p.dataThrough,asOf:p.asOf,asOfBasis:p.asOfBasis,
  studyWindow:{from:'2019Q1',through:'2026Q2'},provenance:{...sourceIdentity,inputSnapshotHash:p.inputSnapshotHash},
  recognizedAiRevenue:{status:'UNAVAILABLE',companyQuarterCells:120},aiReturns:{status:'NOT_IDENTIFIED'},companies,events,sources:registry,definitions};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const input=process.argv[2];if(!input)throw Error('USAGE: node scripts/ai-capex-snapshot.mjs qualified-packet.json');
 const raw=fs.readFileSync(input);if(digest(raw)!==QUALIFIED_PACKET_HASH)throw Error('QUALIFIED_PACKET_BYTES');
 const output=project(JSON.parse(raw));const text=JSON.stringify(output)+'\n';
 fs.writeFileSync(new URL('../src/data/ai-capex/monitor.json',import.meta.url),text);
 console.log(JSON.stringify({bytes:Buffer.byteLength(text),sha256:digest(text),researchHistoryImported:false}));
}
