import React, { createContext, useContext, useEffect, useState } from 'react'
import { appVersion, codeCommit, snapshotCommit, systemStatusUrl } from '../data/buildInfo.js'
import { history } from '../data/status.js'
import { emptySystemStatus, safeSystemStatus } from '../utils/systemStatus.js'
import { freshness } from '../utils/freshness.js'
import { releaseSchedules } from '../utils/releaseCalendar.js'
import { statusCopy } from '../i18n/systemStatus.js'
const StatusContext=createContext(null)
export function SystemStatusProvider({children}) {
  const [state,setState]=useState({status:null,availability:'built'})
  useEffect(()=>{
    if(!systemStatusUrl)return
    const controller=new AbortController();let active=true
    const timer=setTimeout(()=>controller.abort(),8000)
    fetch(`${systemStatusUrl}?check=${Math.floor(Date.now()/300000)}`,{signal:controller.signal,cache:'no-store'})
      .then(r=>{if(!r.ok)throw Error('Status unavailable');return r.json()})
      .then(value=>{if(active)setState({status:safeSystemStatus(value),availability:'live'})})
      .catch(()=>{if(active)setState({status:null,availability:'unavailable'})})
      .finally(()=>clearTimeout(timer))
    return ()=>{active=false;clearTimeout(timer);controller.abort()}
  },[])
  return <StatusContext.Provider value={state}>{children}</StatusContext.Provider>
}
const short=value=>value?value.slice(0,8):'—'
export function SystemStatus({language}) {
  const t=statusCopy[language],context=useContext(StatusContext),status=context?.status||emptySystemStatus()
  const time=value=>value?value.replace('T',' ').replace('Z',' UTC'):t.unknown
  const recorded=context?.status?.data
  const successful=recorded?recorded.lastSuccessfulCheck:history.lastSuccessfulCheckCompletedAt
  return <section className="system-status" aria-labelledby="system-status-title">
    <h2 id="system-status-title">{t.title}</h2><p>{t.intro}</p>
    <div className="system-status-grid">
      <article><h3>{t.application}</h3><p>{t.built}</p><dl><dt>{t.version}</dt><dd>V{appVersion}</dd><dt>{t.code}</dt><dd>{short(codeCommit)}</dd><dt>{t.snapshot}</dt><dd>{short(snapshotCommit)}</dd></dl></article>
      <article><h3>{t.pipeline}</h3><dl><dt>{t.started}</dt><dd>{time(recorded?recorded.checkStartedAt:history.runs[0]?.checkStartedAt)}</dd><dt>{t.completed}</dt><dd>{time(recorded?recorded.checkCompletedAt:history.runs[0]?.checkCompletedAt)}</dd><dt>{t.successful}</dt><dd>{time(successful)}</dd><dt>{t.attempt}</dt><dd>{time(status.lastAttempt?.startedAt)}</dd><dt>{t.refresh}</dt><dd>{t.results[status.data.result]}</dd></dl>{!successful&&(recorded?.legacySuccessfulCheckRecordedAt||(!recorded&&history.lastSuccessfulCheck))&&<p>{t.legacy}: {time(recorded?.legacySuccessfulCheckRecordedAt||history.lastSuccessfulCheck)}</p>}</article>
      <article><h3>{t.deployment}</h3><dl><dt>{t.deployed}</dt><dd>{time(status.deployment.lastSuccessfulAt)}</dd><dt>{t.snapshot}</dt><dd>{short(status.deployment.snapshotCommit)}</dd><dt>{t.deployment}</dt><dd>{t.results[status.deployment.result]}</dd></dl></article>
      <article><h3>{t.notification}</h3><p>{t.results[status.notification.result]}</p>{status.notification.result==='ACCEPTED_BY_GMAIL'&&<p>{t.accepted}</p>}</article>
    </div>
    {status.data.result==='FAILED'&&<p className="status-notice">{t.failed}</p>}
    {status.deployment.snapshotCommit&&snapshotCommit&&status.deployment.snapshotCommit!==snapshotCommit&&<p className="status-notice">{t.mismatch}</p>}
    {status.freshness.asOf&&<details><summary>{t.aggregate}</summary><p>{time(status.freshness.asOf)}</p><dl>{Object.entries(status.freshness.counts).map(([state,count])=><React.Fragment key={state}><dt>{t.states[state]}</dt><dd>{count}</dd></React.Fragment>)}</dl></details>}
    <p className="global-help">{context?.availability==='live'?`${t.live}: ${time(status.updatedAt)}`:t.unavailable}</p>
    <a href="https://github.com/ccesm/world-inflation-lens/actions/workflows/deploy.yml" target="_blank" rel="noreferrer">{t.actions} ↗</a>
  </section>
}
export function SeriesStatusNote({source,language}) {
  const context=useContext(StatusContext),t=statusCopy[language],status=context?.status
  const latestRun=history.runs[0],change=latestRun?.changes.find(c=>c.id===source.id)
  const sameSnapshot=status?.application.snapshotCommit===snapshotCommit && snapshotCommit
  const assessment=freshness(source,{refreshResult:status?.data.result,probe:status?.seriesChecks[source.id],check:{completedAt:sameSnapshot?status.data.lastSuccessfulCheck:latestRun?.checkCompletedAt,changed:sameSnapshot?status.seriesChecks[source.id]?.changed:change?change.total>0:undefined}})
  const m=assessment.metadata,format=value=>value?value.replace('T',' ').replace('Z',' UTC'):t.unknown
  return <div className="series-status" data-series-status={source.id} data-freshness={assessment.state}>
    <p className={`freshness-label freshness-${assessment.state.toLowerCase()}`}>{t.states[assessment.state]}</p>
    <small>{t.reasons[assessment.reason]}</small>
    <details><summary>{t.rule}</summary><dl><dt>{t.automation}</dt><dd>{m.automationType}</dd><dt>{t.observation}</dt><dd>{m.observationDate.value||t.unknown}</dd><dt>{t.updated}</dt><dd>{format(m.sourceUpdatedAt.value)} · {m.sourceUpdatedAt.precision}</dd><dt>{t.retrieved}</dt><dd>{format(m.retrievedAt.value)} · {m.retrievedAt.precision}</dd>
      {m.automationType==='MANUAL_REVIEWED'&&<><dt>{t.reviewed}</dt><dd>{m.reviewedAt.value||t.unknown}</dd></>}
      {m.automationType==='FIXED_VINTAGE'&&<><dt>{t.vintage}</dt><dd>{m.vintage}</dd><dt>{t.published}</dt><dd>{m.publicationDate.value}</dd><dt>{t.reviewed}</dt><dd>{m.reviewedAt.value}</dd></>}
      {assessment.expectedReleaseAt&&<><dt>{t.expected}</dt><dd>{format(assessment.expectedReleaseAt)}</dd><dt>{t.due}</dt><dd>{format(assessment.captureDueAt)}</dd></>}
    </dl>{m.releaseSchedule&&<a href={releaseSchedules[m.releaseSchedule].url} target="_blank" rel="noreferrer">{t.source} ↗</a>}</details>
  </div>
}
