import React, { useEffect, useState } from 'react'
import { signalInputHash, signalPublicArtifactSha256, signalPublicExpectedStatus, signalPublicExpectedSnapshot } from '../data/buildInfo.js'
import { signalFactors } from '../data/signalPresentation.js'
import { verifyPublicSignalBytes } from '../utils/signalPublicContract.js'
import { signalCopy } from '../i18n/signalEngine.js'
let pending
export function usePublicSignal() {
 const [result, setResult] = useState({ loading: true, data: null })
 useEffect(() => {
  let active = true
  pending ||= (async () => {
   const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 8000)
   try {
    if (!signalInputHash || !signalPublicArtifactSha256 || !signalPublicExpectedStatus || !signalPublicExpectedSnapshot) throw Error('BUILD_IDENTITY_REQUIRED')
    const response = await fetch(`${import.meta.env.BASE_URL}data/signal-engine/current.json?artifact=${signalPublicArtifactSha256}`, { signal: controller.signal, cache: 'no-store' })
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw Error('PUBLIC_SIGNAL_UNAVAILABLE')
    const data = await verifyPublicSignalBytes(await response.arrayBuffer(), { artifactSha256: signalPublicArtifactSha256, status: signalPublicExpectedStatus, snapshotCommit: signalPublicExpectedSnapshot, inputHash: signalInputHash })
    return data.status === 'CURRENT' ? data : null
   } catch { return null } finally { clearTimeout(timer) }
  })()
  pending.then(data => { if (active) setResult({ loading: false, data }) })
  return () => { active = false }
 }, [])
 return result
}
export function SignalAvailability({ language, loading }) {
 const t = signalCopy[language]
 return <p role="status" className="signal-availability">{loading ? t.loading : t.unavailable}</p>
}
export function SignalMetadata({ data, language, compact = false }) {
 const t = signalCopy[language]
 const qualities = Object.entries(data.evidenceQuality).filter(([, n]) => n).map(([q, n]) => `${n} ${t.qualities[q]}`).join(' / ')
 const sensitive = data.thresholdSensitiveFactorIds.map(id => {
  const c = signalFactors.find(f => f.id === id)
  return compact ? c.series.replace('BIS_USD_TOTAL', 'BIS') : c.title[language]
 }).join(language === 'zh' ? '、' : ', ')
 return <div className="signal-metadata">
  <span>{data.validFactorCount}/7 {t.valid}</span>
  <span title={t.qualityNote}>{t.quality}: {qualities}</span>
  <span>{sensitive ? `${t.sensitive}: ${sensitive}` : data.factors.some(f => f.sensitivity === 'NOT_EVALUATED') ? t.notEvaluated : t.notSensitive}</span>
  <span>{t.dates}: {data.evidenceThrough.earliest || '—'} – {data.evidenceThrough.latest || '—'}. {t.differentDates}</span>
 </div>
}
export function SignalBriefView({ language, data, loading = false }) {
 const t = signalCopy[language]
  return <section className="signal-brief" aria-label={t.eyebrow} data-signal-brief data-signal-status={loading ? 'LOADING' : data ? 'CURRENT' : 'UNAVAILABLE'}>
  <p className="signal-eyebrow">{t.eyebrow}</p>
  {data ? <><div className="signal-brief-columns"><div><p className="signal-brief-label"><strong>{t.domestic}</strong></p><p>{data.brief.domestic[language]}</p></div><div><p className="signal-brief-label"><strong>{t.international}</strong></p><p>{data.brief.international[language]}</p></div></div><SignalMetadata data={data} language={language} compact /></> : <SignalAvailability loading={loading} language={language} />}
  <a className="signal-link" href="#/research/signal-engine">{t.full} <span aria-hidden="true">→</span></a>
 </section>
}
export function SignalEngineBrief({ language }) {
 const result = usePublicSignal()
 return <SignalBriefView language={language} {...result} />
}
