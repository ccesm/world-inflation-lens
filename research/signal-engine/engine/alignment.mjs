import { freshness } from '../../../src/utils/freshness.js'
import { seriesMetadata } from '../../../src/data/seriesContract.js'
import { releaseWindow } from '../../../src/utils/releaseCalendar.js'
import { period,instant,availabilityBound,timeEvidence,unknownTime } from './core.mjs'
import { validateSource } from './inputs.mjs'
import { validateAcceptance } from './acceptance.mjs'
import { operationalMetadata } from './metadata.mjs'
export const isRetrospective = request => request.mode==='CURRENT_VINTAGE_RECONSTRUCTION'
export function requestOptions(request) {
 if(!['CURRENT_SNAPSHOT','CURRENT_VINTAGE_RECONSTRUCTION','RECORDED_AS_OF','TRUE_RELEASE_VINTAGE'].includes(request.mode))throw Error('UNKNOWN_MODE')
 if(request.mode==='TRUE_RELEASE_VINTAGE')throw Error('UNSUPPORTED_PUBLISHER_VINTAGE_REPLAY')
 instant(request.evaluatedAt)
 if(isRetrospective(request)){if(request.asOf!==null)throw Error('RETROSPECTIVE_ASOF_MUST_BE_NULL');instant(request.periodCutoff);if(Date.parse(request.periodCutoff)>Date.parse(request.evaluatedAt))throw Error('FUTURE_PERIOD_CUTOFF')}
 else {instant(request.asOf);if(request.periodCutoff!==null)throw Error('UNEXPECTED_PERIOD_CUTOFF');if(Date.parse(request.asOf)>Date.parse(request.evaluatedAt))throw Error('FUTURE_ASOF')}
 return request
}
export const cutoffOf = r => isRetrospective(r)?r.periodCutoff:r.asOf
export function selectArchive(archive,request) {
 const cutoff=isRetrospective(request)?request.evaluatedAt:request.asOf,selected=new Map()
 for(const item of archive) {
  validateAcceptance(item.snapshot)
  if(!item.snapshot.snapshotAcceptedAt||Date.parse(item.snapshot.snapshotAcceptedAt)>Date.parse(cutoff))continue
  const previous=selected.get(item.snapshot.datasetId)
  if(previous&&previous.snapshot.snapshotAcceptedAt===item.snapshot.snapshotAcceptedAt&&previous.snapshot.snapshotSha256!==item.snapshot.snapshotSha256)throw Error('AMBIGUOUS_SAME_TIME_VINTAGE')
  if(!previous||Date.parse(previous.snapshot.snapshotAcceptedAt)<Date.parse(item.snapshot.snapshotAcceptedAt))selected.set(item.snapshot.datasetId,item)
 }
 return [...selected.values()].sort((a,b)=>a.snapshot.datasetId.localeCompare(b.snapshot.datasetId))
}
export function pointAvailability(source,p,snapshot) {
 const published=p.releasePublishedAt||unknownTime(),bound=availabilityBound(published)
 const seen=p.availableAt||snapshot.snapshotAcceptedAt
 if(!seen)return null
 return new Date(Math.max(Date.parse(seen),bound?Date.parse(bound):0,Date.parse(snapshot.snapshotAcceptedAt))).toISOString()
}
export function visiblePoints(source,snapshot,request) {
 const cutoff=Date.parse(cutoffOf(request))
 return source.observations.filter(p=>{
  const op=period(p.date,source.frequency,p.sourcePeriod,source.periodBasis)
  if(op.end&&Date.parse(op.end)>cutoff)return false
  if(!isRetrospective(request)){const a=pointAvailability(source,p,snapshot);if(!a||Date.parse(a)>cutoff)return false}
  return true
 })
}
export function lagBoundary(source,last) {
 const m=source.contract||seriesMetadata(source),freq=source.frequency,lag=m.freshnessPolicy.maxLagDays??(freq==='quarterly'?150:freq==='monthly'?75:freq.startsWith('annual')?455:freq.startsWith('weekly')?16:7)
 let end
 if(freq==='monthly'){const [y,m]=last.date.split('-').map(Number);end=Date.UTC(y,m,0,23,59,59)}
 else if(freq==='quarterly'){const [y,m]=last.date.split('-').map(Number);end=Date.UTC(y,m+2,0,23,59,59)}
 else if(freq.startsWith('annual'))end=Date.UTC(Number(last.date.slice(0,4)),12,0,23,59,59)
 else end=Date.parse(last.date)
 return {validUntil:new Date(end+lag*86400000).toISOString(),validUntilInclusive:true}
}
const eligibilityCache=new WeakMap()
export function eligibility(source,snapshot,request,options={}) {
 const key=[request.mode,cutoffOf(request),request.evaluatedAt,snapshot.id,options.primary||false].join('|')
 const cached=eligibilityCache.get(source.observations)
 if(Object.isFrozen(source.observations)&&Object.isFrozen(snapshot)&&cached?.has(key))return cached.get(key)
 const value=calculateEligibility(source,snapshot,request,options)
 if(Object.isFrozen(source.observations)&&Object.isFrozen(snapshot)){const entries=cached||new Map();if(entries.size>=8)entries.delete(entries.keys().next().value);entries.set(key,value);eligibilityCache.set(source.observations,entries)}
 return value
}
function calculateEligibility(source,snapshot,request,{expected=null,primary=false}={}) {
 try {validateSource(source,expected)}catch(e){return {error:e.message,state:'UNKNOWN',reason:e.message,points:[]}}
 const m=source.contract||seriesMetadata(source)
 if(primary&&m.automationType!=='AUTOMATIC')return {error:'NONAUTOMATIC_PRIMARY',state:m.automationType,reason:'Primary must be automatic observed evidence',points:[]}
 if(['STATIC','PLANNED','FIXED_VINTAGE'].includes(m.automationType))return {error:'NONDIRECTIONAL_EVIDENCE_TYPE',state:m.automationType,reason:'Excluded from v0.1 outputs',points:[]}
 const points=visiblePoints(source,snapshot,request),last=points.at(-1)
 if(!last)return {error:'NO_AVAILABLE_OBSERVATION',state:'UNKNOWN',reason:'No eligible period/value vintage',points}
 if(last.value===null)return {error:'MISSING_LATEST_VALUE',state:'UNKNOWN',reason:'Latest reported value is missing',points}
 const cut=cutoffOf(request)
 const cropped={...source,observations:points,observationDate:source.frequency==='publication snapshot'?source.observationDate:null}
 let status,boundary={validUntil:null,validUntilInclusive:null}
 if(isRetrospective(request)) {
  if(m.automationType==='MANUAL_REVIEWED')return {error:'MANUAL_HISTORICAL_AVAILABILITY_UNKNOWN',state:'NOT_RECONSTRUCTED',reason:'Manual facts excluded from historical reconstruction',points}
  const latest=points.at(-1)
  if(m.releaseSchedule){const win=releaseWindow(m.releaseSchedule,new Date(cut));status=win?.mature&&latest.date<win.mature.observation?{state:'STALE',reason:'Retrospective observation lag outside pinned calendar'}:{state:'NOT_RECONSTRUCTED',reason:'Historical operational freshness not reconstructed'};boundary={validUntil:win?.next?.captureDueAt||null,validUntilInclusive:false}}
  else {boundary=lagBoundary(source,latest);status=Date.parse(cut)>Date.parse(boundary.validUntil)?{state:'STALE',reason:'Retrospective observation lag exceeded'}:{state:'NOT_RECONSTRUCTED',reason:'Historical operational freshness not reconstructed'}}
 } else {
  status=freshness(cropped,{now:new Date(cut),...operationalMetadata(snapshot,cut)})
  if(m.releaseSchedule){const win=releaseWindow(m.releaseSchedule,new Date(cut));boundary={validUntil:win?.next?.captureDueAt||null,validUntilInclusive:false}}
  else if(m.automationType==='AUTOMATIC')boundary=lagBoundary(source,last)
 }
 if(!['CURRENT','CHECKED_NO_NEW_RELEASE','WAITING_FOR_EXPECTED_RELEASE','MANUAL_REVIEWED','NOT_RECONSTRUCTED'].includes(status.state))return {error:'INELIGIBLE_FRESHNESS',...boundary,...status,points}
 if(m.automationType==='MANUAL_REVIEWED') {
  // Publication facts need no observation date; use reviewed fact directly, never an interpolated time series.
  return {...boundary,...status,points,last}
 }
 return {...boundary,...status,points,last}
}
export function manualEligibility(source,snapshot,request) {
 if(isRetrospective(request))return {error:'MANUAL_HISTORICAL_AVAILABILITY_UNKNOWN',state:'NOT_RECONSTRUCTED',points:[],reason:'Manual fact has no reconstructed historical availability'}
 if(Date.parse(snapshot.snapshotAcceptedAt)>Date.parse(request.asOf))return {error:'SNAPSHOT_NOT_AVAILABLE',state:'UNKNOWN',points:[],reason:'Project acceptance after as-of'}
 try{validateSource(source)}catch(e){return {error:e.message,state:'UNKNOWN',reason:e.message,points:[]}}
 const status=freshness(source,{now:new Date(request.asOf)})
 if(status.state!=='MANUAL_REVIEWED')return {error:'MANUAL_REVIEW_REQUIRED',...status,points:[]}
 const published=timeEvidence(source.sourceUpdatedAt,'Publication fact source date')
 const bound=availabilityBound(published)
 if(bound&&Date.parse(bound)>Date.parse(request.asOf))return {error:'FACT_NOT_PUBLISHED',state:'UNKNOWN',points:[],reason:'Publication bound after as-of'}
 return {...status,last:source.observations[0],points:source.observations,validUntil:null,validUntilInclusive:null}
}
