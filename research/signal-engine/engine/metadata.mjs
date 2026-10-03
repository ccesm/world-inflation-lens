import { instant,availabilityBound,timeEvidence,period,unknownTime } from './core.mjs'
import { seriesMetadata } from '../../../src/data/seriesContract.js'

// Only supported, timestamped events can affect a replay. Unknown operational
// timing is excluded rather than inferred from an observation or retrieval date.
export function eventEligible(event,cutoff) {
 if(!event||typeof event!=='object')return false
 const times=['availableAt','evidenceAt','completedAt','recordedAt'].filter(k=>event[k]!=null)
 if(!times.length)return false
 return times.every(k=>Date.parse(instant(event[k]))<=Date.parse(cutoff))
}
export function operationalMetadata(snapshot,cutoff) {
 const check=eventEligible(snapshot.check,cutoff)?snapshot.check:null
 let probe=eventEligible(snapshot.probe,cutoff)?snapshot.probe:null
 if(probe?.sourceUpdatedAt&&!metadataTimeEligible(probe.sourceUpdatedAt,cutoff))probe=null
 const refresh=eventEligible(snapshot.refreshResult,cutoff)?snapshot.refreshResult:null
 return {check,probe,refreshResult:refresh?.result||null}
}
export function metadataTimeEligible(value,cutoff) {
 if(!value)return true
 const t=timeEvidence(value)
 if(!t.value)return true
 let end
 if(t.precision==='timestamp')end=instant(t.value)
 // Coarse accepted metadata can overlap the acceptance day/month. It is not
 // exact availability proof, and cannot qualify a HIGH publisher-evidence gate.
 else if(t.precision==='date')end=period(t.value,'daily').start
 else if(t.precision==='month')end=period(t.value,'monthly').start
 else return false
 return Date.parse(end)<=Date.parse(cutoff)
}
export function sourceAtCutoff(source,snapshot,cutoff) {
 // Snapshot fields describe the accepted vintage; a future replacement is a
 // contradiction, not evidence of an earlier release. Time-stamped overlays are
 // separate from the immutable accepted source fields.
 for(const key of ['sourceUpdatedAt','sourceUpdatedTime','retrievedAt','reviewedAt'])if(!metadataTimeEligible(source[key],snapshot.snapshotAcceptedAt))throw Error('METADATA_AFTER_SNAPSHOT_ACCEPTANCE:'+key)
 if(source.sourceUpdatedOriginal){const updated=seriesMetadata(source).sourceUpdatedAt;if(!metadataTimeEligible(updated,snapshot.snapshotAcceptedAt))throw Error('METADATA_AFTER_SNAPSHOT_ACCEPTANCE:sourceUpdatedOriginal')}
 let view=source
 for(const event of [...(source.metadataEvents||[])].sort((a,b)=>String(a.availableAt||a.completedAt).localeCompare(String(b.availableAt||b.completedAt)))) {
  if(!eventEligible(event,cutoff))continue
  if(event.seriesId!==source.id||event.snapshotSha256!==snapshot.snapshotSha256)throw Error('METADATA_EVENT_IDENTITY_MISMATCH')
  const changes={}
  for(const key of ['sourceUpdatedAt','sourceUpdatedTime','retrievedAt','reviewedAt'])if(Object.hasOwn(event,key)){
   if(!metadataTimeEligible(event[key],cutoff)||!metadataTimeEligible(event[key],snapshot.snapshotAcceptedAt))throw Error('FUTURE_OR_WRONG_VINTAGE_METADATA_EVENT_VALUE')
   changes[key]=event[key]
  }
  view={...view,...changes}
 }
 return view
}
export function eligibleRevisionIds(source,point,snapshot,cutoff) {
 const records=[...(source.revisionEvents||[]),...(snapshot.revisionEvents||[])]
 return (point.revisionEventIds||[]).filter(id=>records.some(r=>r.id===id&&r.seriesId===source.id&&r.snapshotSha256===snapshot.snapshotSha256&&eventEligible(r,cutoff)))
}
export function publisherEvidenceProven(source,point,snapshot,cutoff) {
 const t=point.releasePublishedAt||unknownTime()
 if(t.precision!=='timestamp'||!t.value||!t.timeZone||!t.evidenceRef)return false
 let published
 try {published=instant(t.value);new Intl.DateTimeFormat('en',{timeZone:t.timeZone}).format(new Date(published))}catch{return false}
 // This is only a plausibility floor for completed observations, not an
 // invented release lag or publisher calendar. Undated facts cannot prove it.
 const observation=period(point.date,source.frequency,point.sourcePeriod,source.periodBasis)
 if(!observation.end||Date.parse(published)<Date.parse(observation.end))return false
 const record=(snapshot.publisherEvidence||[]).find(r=>r.evidenceRef===t.evidenceRef&&r.seriesId===source.id&&r.sourceUrl===source.sourceUrl&&r.snapshotSha256===snapshot.snapshotSha256&&r.inputCommit===snapshot.inputCommit&&r.observationPeriods?.includes(point.date))
 if(!record||record.publishedAt!==t.value||record.timeZone!==t.timeZone||!eventEligible(record,cutoff))return false
 if(['availableAt','evidenceAt','completedAt','recordedAt'].some(key=>record[key]&&Date.parse(record[key])<Date.parse(published)))return false
 const retrieved=timeEvidence(source.retrievedAt),retrievedBound=availabilityBound(retrieved)
 if(!retrievedBound||Date.parse(published)>Date.parse(retrievedBound)||Date.parse(retrievedBound)>Date.parse(snapshot.snapshotAcceptedAt)||Date.parse(published)>Date.parse(snapshot.snapshotAcceptedAt)||Date.parse(published)>Date.parse(cutoff))return false
 return true
}
export const snapshotFields=['id','datasetId','snapshotPath','snapshotSha256','rawSha256','rawRetentionLimitation','inputVintageId','snapshotAcceptedAt','acceptanceEvidenceRef','firstSeenAt','parserVersion','sourceMethodologyId']
export const snapshotOutput=s=>Object.fromEntries(snapshotFields.map(k=>[k,s[k]??null]))
