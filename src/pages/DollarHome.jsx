import React from 'react'
import { dollarCopy } from '../i18n/dollar.js'
import { DollarPower } from '../components/DollarPower.jsx'
import { futurePower } from '../utils/dollar.js'
import { formatNumber } from '../utils/inflation.js'

export function Home({ language }) {
  const t = dollarCopy[language]
  return <>
    <section className="hero educational-hero dollar-hero"><div className="hero-copy"><p className="eyebrow">{t.eyebrow}</p><h1>{t.title}</h1><p className="lead">{t.description}</p><div className="hero-actions"><a href="#/monitor" className="primary-button">{t.explore} ↗</a><a href="#/scenarios" className="text-link">{t.scenarioLink} →</a></div></div><aside className="snapshot-card"><p className="eyebrow">{t.assumptions}</p><h2>$100 →</h2>{[2, 3, 4, 7].map(rate => <div className="dollar-scenario-row" key={rate}><span>{rate}% · 30 {t.after}</span><strong>${formatNumber(futurePower(100, rate, 30), language, 0)}</strong></div>)}<p className="data-note">{t.scenarioDesc}</p></aside></section>
    <section className="content-section global-section dollar-section"><DollarPower language={language} /><section className="dollar-panel"><h2>{t.tensionTitle}</h2><p>{t.tension}</p><a href="https://www.federalreserve.gov/aboutthefed/fedexplained/monetary-policy.htm" target="_blank" rel="noreferrer">Federal Reserve · Monetary policy ↗</a></section>
    <section className="dollar-paths"><h2>{t.pathsTitle}</h2><p>{t.pathsNote}</p><div className="dollar-grid">{t.paths.map((item, i) => <article key={item.title}><small>0{i + 1}</small><h3>{item.title}</h3><p>{item.body}</p></article>)}</div><p className="global-help"><a href="https://www.federalreserve.gov/econres/ifdp/simple-monetary-rules-under-fiscal-dominance.htm" target="_blank" rel="noreferrer">Federal Reserve research · Fiscal dominance ↗</a></p></section>
    <section className="dollar-panel"><h2>{t.resources}</h2><div className="dollar-links">{['regimes', 'fiscal', 'since-1971', 'overview', 'us-cpi', 'sources'].map((route, i) => <a key={route} href={`#/${route}`}>{t.links[i]} →</a>)}</div></section></section>
  </>
}
