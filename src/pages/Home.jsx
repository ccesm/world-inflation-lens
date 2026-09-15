import React, { useState } from 'react'
import { Eyebrow } from '../components/Eyebrow.jsx'
import { experience } from '../i18n/experience.js'
import { cpi, latestCpi, cpiMetadata } from '../data/inflation.js'
import { formatNumber } from '../utils/inflation.js'
import { globalCopy } from '../i18n/global.js'
import { defaultYear } from '../data/globalInflation.js'
import { driversCopy } from '../i18n/drivers.js'
import { updatesCopy } from '../i18n/updates.js'

export function Home({ language }) {
  const labels = experience[language]
  const [channel, setChannel] = useState(0)
  const [basketRate, setBasketRate] = useState(3)
  const current = labels.channels[channel]
  const recent = cpi.filter(point => point.date >= '2000-01')
  const line = recent.map((point, index) => point.value == null ? '' : `${index === 0 || recent[index - 1].value == null ? 'M' : 'L'}${index / (recent.length - 1) * 440},${150 - (point.value - 160) / 200 * 140}`).join(' ')
  return <>
    <section className="hero educational-hero">
      <div className="hero-copy"><Eyebrow>{labels.homeEyebrow}</Eyebrow><h1>{labels.homeTitle}<em>{labels.homeAccent}</em></h1><p className="lead">{labels.homeDescription}</p><div className="hero-actions"><a className="primary-button" href="#/timeline">{labels.exploreHistory} <span>↗</span></a><a className="text-link" href="#/us-cpi">{labels.exploreCpi} →</a></div></div>
      <aside className="snapshot-card"><p className="eyebrow">{labels.snapshot}</p><p className="snapshot-value">{formatNumber(latestCpi.inflation, language)}<small>%</small></p><p>{labels.annualChange} · {latestCpi.date}</p><svg viewBox="0 0 440 160" aria-hidden="true"><path d={line} /></svg><div className="snapshot-meta"><span>2000 — {latestCpi.date}</span><span>{labels.index}: {formatNumber(latestCpi.value, language, 3)}</span></div><p className="data-note">{labels.snapshotNote}</p><a className="source-caption" href={cpiMetadata.sourceUrl} target="_blank" rel="noreferrer">BLS / FRED · CPIAUCNS ↗</a><p className="data-note">{labels.retrieved}: {cpiMetadata.retrievedAt}</p></aside>
    </section>
    <div className="home-global-link"><span>V0.2 · {globalCopy[language].annual} · {defaultYear}</span><a href="#/overview">{globalCopy[language].explore} ↗</a></div>
    <div className="home-global-link"><span>{driversCopy[language].bridge}</span><a href="#/drivers">{driversCopy[language].open} ↗</a></div>
    <div className="home-global-link"><span>{updatesCopy[language].bridge}</span><a href="#/sources">{updatesCopy[language].open} ↗</a></div>
    <section className="home-section explanation-section"><div className="section-heading"><div><Eyebrow>{labels.whyEyebrow}</Eyebrow><h2>{labels.whyTitle}</h2></div><p>{labels.whyDescription}</p></div>
      <div className="driver-tabs" role="group" aria-label={labels.whyTitle}>{labels.channels.map((item, index) => <button key={index} aria-pressed={channel === index} onClick={() => setChannel(index)}><span>0{index + 1}</span>{item.title}</button>)}</div>
      <div className="driver-body" aria-live="polite"><ol className="transmission-flow">{current.steps.map((step, index) => <li key={index}><span>0{index + 1}</span><p>{step}</p>{index < 2 && <b aria-hidden="true">→</b>}</li>)}</ol><p className="driver-detail">{current.detail}</p><div className="driver-outcome"><strong>{labels.outcome}</strong><p>{labels.outcomeNote}</p></div></div>
      <p className="source-caption">{labels.source}: <a href="https://www.imf.org/external/pubs/ft/fandd/basics/pdf/oner_inflation.pdf" target="_blank" rel="noreferrer">IMF · Inflation: Prices on the Rise ↗</a></p>
    </section>
    <section className="basket-section"><div><Eyebrow>CPI / 101</Eyebrow><h2>{labels.basketTitle}</h2><p>{labels.basketDescription}</p><label>{labels.basketLabel}: <strong>{basketRate}%</strong><input type="range" min="-5" max="15" step="0.5" value={basketRate} onChange={event => setBasketRate(Number(event.target.value))} /></label><p className="data-note">{labels.basketNote} <a href="https://www.bls.gov/cpi/questions-and-answers.htm" target="_blank" rel="noreferrer">BLS ↗</a></p></div><div className="basket-result" aria-live="polite"><span>$100 <span aria-hidden="true">→</span></span><strong>${formatNumber(100 + basketRate, language)}</strong><small>{labels.basketAfter}</small></div></section>
    <section className="home-section layers-section"><Eyebrow>{labels.layersEyebrow}</Eyebrow><h2>{labels.layersTitle}</h2><div className="feature-grid">{labels.layers.map((item, index) => <article className="feature-card layer-card" key={index}><span className="feature-number">0{index + 1}</span><h3>{item.title}</h3><p>{item.body}</p></article>)}</div></section>
  </>
}
