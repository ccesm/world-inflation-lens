import React from 'react'
import { usePublicSignal, SignalAvailability, SignalMetadata } from '../components/SignalEngineBrief.jsx'
import { signalFactors } from '../data/signalPresentation.js'
import { signalCopy } from '../i18n/signalEngine.js'
const methodology = 'https://github.com/ccesm/world-inflation-lens/blob/faaae287f1b144bd8396023a8f134b66ae84404c/docs/signal-engine-spec.md'
export function SignalFactorCard({ factor, language }) {
 const t = signalCopy[language], c = signalFactors.find(item => item.id === factor.factorId), w = factor.confirmationWindow
 return <article className="signal-factor" data-signal-factor={c.id} aria-labelledby={`signal-factor-${c.id}`}>
  <h3 id={`signal-factor-${c.id}`}>{c.title[language]}</h3>
  <p className="signal-state"><strong>{t.stateNames[factor.state]}</strong></p>
  <p>{factor.interpretation[language]}</p>
  <div className="signal-badges"><span>{t.quality}: {t.qualities[factor.evidenceQuality]}</span>{factor.sensitivity === 'THRESHOLD_SENSITIVE' && <span title={t.sensitivityNote}>{t.sensitive}</span>}{factor.sensitivity === 'NOT_EVALUATED' && <span>{t.notEvaluated}</span>}</div>
  <dl><div><dt>{t.observation}</dt><dd>{factor.observationPeriod || t.unavailablePeriod}</dd></div><div><dt>{t.window}</dt><dd>{w ? `${w.from} – ${w.through} · ${w.periods} ${t[c.frequency]}` : t.unavailablePeriod}</dd></div><div><dt>{t.series}</dt><dd>{c.series}</dd></div></dl>
  <p className="signal-limitation">{c.limitation[language]}</p>
  <a href={c.researchLink}>{t.evidence} <span aria-hidden="true">→</span></a>
  <details><summary>{t.details}</summary><p>{c.publisher} · <a href={c.sourceUrl} target="_blank" rel="noreferrer">{t.source}</a></p><p>{c.transform} · {t.rule}: ±{c.entry}; {language === 'zh' ? '稳定区间' : 'quiet band'} ±{c.quiet}.</p><p>{t.ruleHelp}</p><a href={methodology} target="_blank" rel="noreferrer">{t.ruleLink}</a></details>
 </article>
}
export function SignalEngineView({ language, data, loading = false }) {
 const t = signalCopy[language]
 return <div className="signal-page content-section" data-page="signal-engine">
  <header><p className="eyebrow">RESEARCH · SIGNAL ENGINE</p><h1>{t.title}</h1><p>{t.scope}</p><p>{t.provisional}</p></header>
  {data ? <>
   <SignalMetadata data={data} language={language} />
   {[['domestic', data.factors.slice(0,4)], ['international', data.factors.slice(4)]].map(([group, factors]) => <section key={group} aria-labelledby={`signal-${group}`}><h2 id={`signal-${group}`}>{t[group]}</h2><p className="signal-conclusion">{data.conclusions[group][language]}</p><div className="signal-factor-grid">{factors.map(f => <SignalFactorCard factor={f} language={language} key={f.factorId} />)}</div></section>)}
   <section><h2>{t.quality}</h2><p>{t.qualityNote}</p></section>
   <section><h2>{t.sensitive}</h2><p>{data.thresholdSensitiveFactorIds.length ? data.thresholdSensitiveFactorIds.map(id => signalFactors.find(f => f.id === id).title[language]).join(language === 'zh' ? '、' : ', ') : t.notSensitive}</p><p>{t.sensitivityNote}</p></section>
   <section><h2>{t.limits}</h2><p>{data.conclusions.evidenceQualifier[language]}</p><p>{t.native}</p></section>
   <section><h2>{t.methodology}</h2><p>{t.rule}: <code>{data.ruleVersion}</code> · {data.engineVersion}</p><p>{t.snapshot}: <code>{data.inputSnapshot}</code></p><p><a href={methodology} target="_blank" rel="noreferrer">{t.ruleLink}</a> · <a href="#/sources?focus=health">{t.health}</a></p></section>
  </> : <SignalAvailability language={language} loading={loading} />}
 </div>
}
export function SignalEngine({ language }) { const result = usePublicSignal(); return <SignalEngineView language={language} {...result} /> }
