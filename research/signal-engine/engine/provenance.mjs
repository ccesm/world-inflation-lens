import { seriesMetadata } from '../../../src/data/seriesContract.js'
import { period,timeEvidence,unknownTime,contentHash } from './core.mjs'
import { sourceAtCutoff,snapshotOutput,eligibleRevisionIds } from './metadata.mjs'
import { cutoffOf,isRetrospective,pointAvailability,eligibility,manualEligibility } from './alignment.mjs'

const same=(a,b)=>contentHash(a)===contentHash(b)
const periodMaps=new WeakMap()
function requireField(actual,expected,key) {if(!same(actual,expected))throw Error('PROVENANCE_MISMATCH:'+key)}
export function validatePinnedInputs(output,selected,env) {
 if(env){requireField(output.inputCommit,env.inputCommit,'inputCommit');requireField(output.inputKind,env.inputKind,'inputKind');requireField(output.runtime,env.runtime,'runtime')}
 const snapshots=new Map(selected.map(a=>[a.snapshot.id,a.snapshot]))
 for(const input of output.inputs){const original=snapshots.get(input.id);if(!original)throw Error('UNKNOWN_PINNED_SNAPSHOT');for(const [key,value]of Object.entries(snapshotOutput(original)))requireField(input[key],value,'inputs.'+key)}
}
export function validatePinnedRecord(record,entry,output,config) {
 const retrospective=isRetrospective(output),cutoff=retrospective?output.evaluatedAt:cutoffOf(output),snapshot=entry.snapshot
 const raw=entry.source,view=sourceAtCutoff(raw,snapshot,cutoff),m=view===raw?(raw.contract||seriesMetadata(raw)):seriesMetadata(view),source={...view,contract:m}
 const status=(m.automationType==='MANUAL_REVIEWED'?manualEligibility:eligibility)(source,snapshot,output)
 if(status.error)throw Error('INELIGIBLE_PINNED_LINEAGE:'+status.error)
 let map=periodMaps.get(status.points)
 if(!map){map=new Map(status.points.map(p=>[period(p.date,source.frequency,p.sourcePeriod,source.periodBasis).label,p]));periodMaps.set(status.points,map)}
 const last=map.get(record.inputObservations.at(-1)?.observationPeriod.label)
 if(!last)throw Error('LINEAGE_PERIOD_NOT_ELIGIBLE')
 const expected={seriesId:source.id,sourceSeriesKey:source.sourceKey||source.id,datasetId:snapshot.datasetId,publisher:m.publisher,sourceUrl:m.sourceUrl,snapshotId:snapshot.id,inputVintageId:snapshot.inputVintageId,snapshotSha256:snapshot.snapshotSha256,frequency:source.frequency,units:m.units,denominator:source.denominator||null,maintenanceType:m.automationType,observationPeriod:period(last.date,source.frequency,last.sourcePeriod,source.periodBasis),rawValue:last.value,sourceUpdatedAt:timeEvidence(source.sourceUpdatedTime||source.sourceUpdatedAt,'Source/distributor vintage update; not initial publication of old rows'),retrievedAt:timeEvidence(source.retrievedAt,'Repository retrieval metadata; not completion proof'),firstSeenAt:snapshot.firstSeenAt||null,snapshotAcceptedAt:snapshot.snapshotAcceptedAt,availableAt:retrospective?null:pointAvailability(source,last,snapshot),availabilityBasis:retrospective?'NOT_RECONSTRUCTED':'PROJECT_ACCEPTED_SNAPSHOT',validUntil:status.validUntil||null,validUntilInclusive:status.validUntilInclusive??null,freshnessState:status.state}
 for(const [key,value]of Object.entries(expected))requireField(record[key],value,key)
 const revisions=[]
 for(const p of record.inputObservations){
  const original=map.get(p.observationPeriod.label);if(!original)throw Error('LINEAGE_PERIOD_NOT_ELIGIBLE')
  requireField(p.observationPeriod,period(original.date,source.frequency,original.sourcePeriod,source.periodBasis),'point.observationPeriod')
  requireField(p.value,original.value,'point.value')
  requireField(p.availableAt,retrospective?null:pointAvailability(source,original,snapshot),'point.availableAt')
  requireField(p.availabilityBasis,retrospective?'NOT_RECONSTRUCTED':'PROJECT_ACCEPTED_SNAPSHOT','point.availabilityBasis')
  requireField(p.releasePublishedAt,original.releasePublishedAt||unknownTime(),'point.releasePublishedAt')
  const ids=eligibleRevisionIds(source,original,snapshot,cutoff);requireField(p.revisionEventIds,ids,'point.revisionEventIds');revisions.push(...ids)
 }
 requireField(record.revisionEventIds,[...new Set(revisions)],'revisionEventIds')
 const operand=record.id.startsWith('operand:')?Object.entries(config.contextDerivations).find(([name])=>record.id.startsWith(`operand:${name}:`))?.[1]:null
 const role=record.id.startsWith('primary:')?'PRIMARY_SIGNAL':operand?operand.role:config.ownership[source.id]?.dependencyRole
 requireField(record.dependencyRole,role,'dependencyRole')
}
