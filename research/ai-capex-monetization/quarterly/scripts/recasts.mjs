// Reviewed reporting-basis metadata is bound to native observations and raw sources.
// It cannot change a native value or turn a comparative vintage into an original release.
import {bytes,date} from '../../scripts/contract.mjs';
const same=(a,b)=>bytes(a)===bytes(b);
export function annotateReporting(observations,sources,registry){
 const refs=new Map(sources.map(s=>[s.sourceId,s]));
 const annotations=new Map((registry?.annotations||[]).map(a=>[a.observationId,a]));
 return observations.map(o=>{
  const a=annotations.get(o.observationId);if(!a)return o;
  const s=refs.get(o.sourceId);
  if(!s||a.sourceId!==o.sourceId||a.sourceHash!==s.sha256||a.periodEnd!==o.periodEnd||a.metric!==o.metric||a.value!==o.value||o.scope!==a.scope)throw Error('RECAST_NATIVE_IDENTITY');
  return {...o,...a.metadata};
 });
}
export function validateRecasts(input){
 const registry=input.recasts;if(!registry)return true;
 if(registry.schemaVersion!=='ai-capex-recast-review-v0.1'||!registry.reviewed)throw Error('RECAST_REVIEW_REQUIRED');
 const sources=new Map(input.sources.map(s=>[s.sourceId,s])),obs=new Map(input.observations.map(o=>[o.observationId,o]));const seen=new Set();
 for(const a of registry.annotations){
  if(seen.has(a.observationId))throw Error('DUPLICATE_RECAST');seen.add(a.observationId);
  const o=obs.get(a.observationId),s=sources.get(a.sourceId),proof=sources.get(a.methodologySourceId);
  if(!o||!s||!proof||proof.company!==o.company||a.methodologySourceHash!==proof.sha256||!a.methodologyLocator||!['segmentRevenue','segmentOperatingIncome'].includes(o.metric))throw Error('RECAST_PROOF_IDENTITY');
  if(!['ORIGINAL_REPORTED','RECAST_REPORTED','COMPARATIVE_REPORTED'].includes(a.metadata.reportingVersion)||!a.metadata.reportingBasisVersion||!['COMPARABLE','LIMITED_COMPARABILITY','NOT_COMPARABLE'].includes(a.metadata.comparabilityStatus))throw Error('RECAST_REPORTING_VERSION');
  date(a.metadata.effectivePeriod.start);date(a.metadata.effectivePeriod.end);
  if(a.metadata.effectivePeriod.start!==o.periodStart||a.metadata.effectivePeriod.end!==o.periodEnd)throw Error('RECAST_PERIOD');
  if(a.metadata.reportingVersion==='RECAST_REPORTED'&&(a.metadata.recastSourceId!==s.sourceId||a.metadata.recastPublicationDate!==s.publicationDate||a.metadata.revisionStatus!=='RESTATED'))throw Error('RECAST_PUBLICATION');
  if(a.metadata.reportingVersion==='ORIGINAL_REPORTED'&&s.periodEnd!==o.periodEnd)throw Error('COMPARATIVE_NOT_ORIGINAL');
  const original=sources.get(a.metadata.originalSourceId);
  if(original&&(original.company!==o.company||original.periodEnd!==o.periodEnd)||a.metadata.originalSourceId&&!original)throw Error('RECAST_ORIGINAL_SOURCE');
  if(a.metadata.reportingVersion==='RECAST_REPORTED'&&s.periodEnd<=o.periodEnd)throw Error('RECAST_VINTAGE_CHRONOLOGY');
  const expected=annotateReporting([o],input.sources,registry)[0];if(!same(o,expected))throw Error('RECAST_METADATA_MISMATCH');
 }
 for(const p of registry.pairs){
  const a=obs.get(p.originalObservationId),b=obs.get(p.recastObservationId);
  if(!a||!b||a.company!==p.company||a.metric!==p.metric||a.periodEnd!==p.periodEnd||a.company!==b.company||a.metric!==b.metric||a.scope!==b.scope||a.unit!==b.unit||a.periodStart!==b.periodStart||a.periodEnd!==b.periodEnd||a.value!==p.originalValue||b.value!==p.recastValue||a.reportingVersion!=='ORIGINAL_REPORTED'||b.reportingVersion!=='RECAST_REPORTED'||b.originalSourceId!==a.sourceId||b.recastSourceId!==b.sourceId||sources.get(a.sourceId).publicationDate>=sources.get(b.sourceId).publicationDate)throw Error('RECAST_PAIR_IDENTITY');
 }
 return true;
}
