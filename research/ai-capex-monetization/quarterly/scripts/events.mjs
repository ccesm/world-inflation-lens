import {date,hash} from '../../scripts/contract.mjs';
import {officialURL} from './retrieve.mjs';
const classes=['MANAGEMENT_ATTRIBUTION','OBSERVED','FORWARD_GUIDANCE'];
export function validateEvents(input,pinnedSources=null){
 if(input.schemaVersion!=='ai-capex-events-v0.1'||!Array.isArray(input.events))throw Error('EVENT_SCHEMA');
 const seen=new Set();
 for(const e of input.events){
  if(seen.has(e.eventId)||!e.eventId)throw Error('EVENT_ID');seen.add(e.eventId);
  date(e.date);date(e.observationPeriod);if(e.date<e.observationPeriod)throw Error('EVENT_CHRONOLOGY');
  if(!e.nativeWordingSummary||!e.scope||!e.source?.sourceId||!e.source.locator||!e.limitations?.length||!classes.includes(e.evidenceClass)||!['RAW_HASH_QUALIFIED','PHASE1_MANUAL_REVIEWED'].includes(e.evidenceLevel))throw Error('EVENT_PROVENANCE');
  officialURL(e.company,e.source.url,e.source.delegatedBy);
  if(e.evidenceLevel==='RAW_HASH_QUALIFIED'&&pinnedSources){const s=pinnedSources.find(s=>s.sourceId===e.source.sourceId);if(!s||s.company!==e.company||s.url!==e.source.url||s.sha256!==e.source.sha256||s.publicationDate!==e.date)throw Error('EVENT_PINNED_SOURCE');}
  if(e.evidenceLevel==='RAW_HASH_QUALIFIED'&&!/^[a-f0-9]{64}$/.test(e.source.sha256))throw Error('EVENT_RAW_IDENTITY');
  if(e.kind==='DIRECT_AI_RUN_RATE'&&(e.periodType!=='RUN_RATE'||e.frequency!=='ANNUALIZED_RATE'||e.recognizedRevenue!==false))throw Error('RUN_RATE_NOT_REVENUE');
  if(e.kind==='BACKLOG'&&(e.periodType!=='POINT'||e.recognizedRevenue!==false||!e.definitionVersion))throw Error('BACKLOG_NOT_REVENUE');
  if(e.kind==='CAPACITY_CONSTRAINT'&&(e.value!==null||e.numericScore!==undefined))throw Error('CAPACITY_NOT_SCORE');
  if(e.rangeLower!==undefined||e.rangeUpper!==undefined){if(e.value!==null||e.periodType!=='GUIDANCE'||!Number.isFinite(e.rangeLower)||!Number.isFinite(e.rangeUpper)||e.rangeLower>e.rangeUpper)throw Error('GUIDANCE_RANGE_NOT_POINT_ESTIMATE');}
  if(e.value!==null&&!Number.isFinite(e.value))throw Error('EVENT_VALUE');
 }
 return true;
}
export function eventTimeline(input,quarters,companies,pinnedSources=null){
 validateEvents(input,pinnedSources);const events=[...input.events].sort((a,b)=>a.eventId.localeCompare(b.eventId));
 return {schemaVersion:input.schemaVersion,events,disclosureCoverage:companies.flatMap(company=>quarters.map(q=>({company,calendarQuarter:q.calendarQuarter,status:events.some(e=>e.company===company&&e.quarter===q.calendarQuarter)?'DISCLOSURE_RECORDED':'NO_DISCLOSURE'}))),inputHash:hash(input),limitations:['Events are not recognized quarterly AI revenue; no-disclosure does not mean zero.','Management attribution and forward guidance remain separate from financial observations.']};
}
