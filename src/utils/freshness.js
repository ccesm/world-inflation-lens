import { seriesMetadata } from '../data/seriesContract.js'
import { releaseWindow, zonedParts } from './releaseCalendar.js'

export const freshnessStates = ['CURRENT','CHECKED_NO_NEW_RELEASE','WAITING_FOR_EXPECTED_RELEASE','SOURCE_UPDATED_NOT_YET_CAPTURED','STALE','REFRESH_FAILED','MANUAL_REVIEWED','MANUAL_REVIEW_REQUIRED','FIXED_VINTAGE','STATIC','DERIVED','PLANNED','UNKNOWN']
const finish=(state,reason,extra={})=>({state,reason,...extra})
export function freshness(source,{now=new Date(),check=null,probe=null,refreshResult=null}={}) {
  const m=source.contract||seriesMetadata(source),latest=source.observationDate||source.observations?.findLast(p=>Number.isFinite(p.value))?.date||null
  const base={latestObservation:latest,metadata:m,expectedReleaseAt:null,captureDueAt:null}
  if(m.automationType==='PLANNED')return finish('PLANNED','not_integrated',base)
  if(m.automationType==='FIXED_VINTAGE')return finish('FIXED_VINTAGE','reviewed_forecast_vintage',base)
  if(m.automationType==='STATIC')return finish('STATIC','not_freshness_scored',base)
  if(m.automationType==='MANUAL_REVIEWED') {
    const reviewed=m.reviewedAt.value,age=reviewed?(now.getTime()-Date.parse(reviewed))/86400000:Infinity
    return finish(age>(m.freshnessPolicy.reviewAfterDays||400)?'MANUAL_REVIEW_REQUIRED':'MANUAL_REVIEWED','manual_evidence_not_automatically_refreshed',base)
  }
  if(m.automationType==='DERIVED')return finish('DERIVED','assess_input_series_separately',base)
  if(!latest || (!source.sourceUpdatedAt && !m.freshnessPolicy.allowUnknownSourceUpdate) || !source.retrievedAt || m.frequency==='unknown' || m.units==='unknown' || !m.sourceUrl || m.automationType==='UNKNOWN' || !Number.isFinite(now.getTime()))return finish('UNKNOWN','missing_metadata_or_observation',base)
  // Only a validated probe can prove newer upstream metadata/coverage is available.
  const oldUpdate=m.sourceUpdatedAt.value
  const newerUpdate=probe?.sourceUpdatedAt && oldUpdate && (probe.sourceUpdatedAt.slice(0,10)>oldUpdate.slice(0,10) || (m.sourceUpdatedAt.precision==='timestamp' && probe.sourceUpdatedAt.includes('T') && Date.parse(probe.sourceUpdatedAt)>Date.parse(oldUpdate)))
  if(probe && ((probe.latestAvailableObservationDate && probe.latestAvailableObservationDate>latest) ||
    newerUpdate))
    return finish('SOURCE_UPDATED_NOT_YET_CAPTURED','validated_source_probe_is_newer',base)
  if(refreshResult==='FAILED')return finish('REFRESH_FAILED','prior_validated_snapshot_retained',base)
  const recent=check?.completedAt && now.getTime()>=Date.parse(check.completedAt) && now.getTime()-Date.parse(check.completedAt)<=48*3600000
  const unchanged=recent && check.changed===false
  const window=releaseWindow(m.releaseSchedule,now)
  if(window) {
    const info={...base,expectedReleaseAt:window.next?.publishedAt||null,captureDueAt:window.next?.captureDueAt||null,expectedObservation:window.mature?.observation||null,calendarLimit:window.calendarLimit}
    if(window.mature && latest<window.mature.observation)return finish('STALE','expected_release_window_elapsed_not_proof_of_publication',info)
    if(window.next && latest<window.next.observation && zonedParts(new Date(window.next.publishedAt),window.zone).date<=zonedParts(now,window.zone).date)return finish('WAITING_FOR_EXPECTED_RELEASE','normal_release_or_distribution_window',info)
    return finish(unchanged?'CHECKED_NO_NEW_RELEASE':'CURRENT',unchanged?'successful_check_no_observation_change':'matches_normal_release_window',info)
  }
  let end
  if(m.frequency==='monthly') { const [y,month]=latest.slice(0,7).split('-').map(Number);end=Date.UTC(y,month,0,23,59,59) }
  else if(m.frequency==='quarterly') { const [y,month]=latest.slice(0,7).split('-').map(Number);end=Date.UTC(y,Math.floor((month-1)/3)*3+3,0,23,59,59) }
  else if(m.frequency.startsWith('annual')) end=Date.UTC(Number(latest.slice(0,4)),12,0,23,59,59)
  else end=Date.parse(latest)
  const lag=m.freshnessPolicy.maxLagDays ?? (m.frequency==='quarterly'?150:m.frequency==='monthly'?75:m.frequency.startsWith('annual')?455:m.frequency.startsWith('weekly')?16:7)
  if(!Number.isFinite(end))return finish('UNKNOWN','unrecognized_period',base)
  if(now.getTime()-end>lag*86400000)return finish('STALE','conservative_period_lag_exceeded_not_official_deadline',base)
  return finish(unchanged?'CHECKED_NO_NEW_RELEASE':'CURRENT',unchanged?'successful_check_no_observation_change':'within_conservative_lag_calendar_not_known',base)
}
