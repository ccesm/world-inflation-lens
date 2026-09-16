import React from 'react'
import { ExternalShocksPreview } from '../components/ExternalShocksPreview.jsx'
import { ResearchFramework } from '../components/ResearchFramework.jsx'
import { frameworkCopy } from '../i18n/framework.js'
import { iaCopy } from '../i18n/architecture.js'
import { DollarPower } from '../components/DollarPower.jsx'
import { CboOutlook } from '../components/CboOutlook.jsx'
import { ScenarioCalculator } from './Scenarios.jsx'
import { OutlookSummary, Environment } from '../components/OutlookSummary.jsx'
import { GlobalPreview } from '../components/GlobalPreview.jsx'
import { SincePreview } from '../components/SincePreview.jsx'

export function Home({ language }) {
  const t = iaCopy[language], f = frameworkCopy[language]
  return <div className="ia-home global-section">
    <section className="ia-hero"><p className="eyebrow">{t.eyebrow}</p><h1>{t.title}</h1><p className="ia-subtitle">{t.subtitle}</p><p className="ia-stance">{t.stance}</p><div className="hero-actions"><a href="#/dollar" className="primary-button">{t.outlookLink} →</a><a href="#/scenarios" className="text-link">{t.scenarioLink} →</a></div></section>
    <div className="content-section ia-home-body dollar-section">
      <ResearchFramework language={language} />
      <ExternalShocksPreview language={language} />
      <section className="ia-section evidence-start"><h2>{f.evidenceTitle}</h2><p>{f.evidenceIntro}</p><OutlookSummary language={language} /></section>
      <section className="ia-section"><DollarPower language={language} initialBase="1971-08" preview /><a className="ia-more" href="#/purchasing-power">{t.powerLink} →</a></section>
      <section className="ia-section"><h2>{t.scenarioTitle}</h2><ScenarioCalculator language={language} compact /><a className="ia-more" href="#/scenarios">{t.calculatorLink} →</a></section>
      <section className="ia-section"><CboOutlook language={language} preview /></section>
      <Environment language={language} />
      <section className="ia-section"><h2>{t.pathwayTitle}</h2><div className="ia-grid two ia-pathways">{[[t.riskPath, t.riskSteps], [t.growthPath, t.growthSteps]].map(([title, steps]) => <article key={title}><h3>{title}</h3><ol>{steps.map(step => <li key={step}>{step}</li>)}</ol></article>)}</div><p>{t.pathwayNote}</p><a className="ia-source" href="https://www.federalreserve.gov/econres/ifdp/simple-monetary-rules-under-fiscal-dominance.htm" target="_blank" rel="noreferrer">Federal Reserve · Fiscal dominance research ↗</a></section>
      <section className="ia-section"><h2>{t.sinceTitle}</h2><p>{t.sinceNote}</p><SincePreview language={language} /><p className="ia-source">{t.planned}</p><a className="ia-more" href="#/since-1971">{t.sinceLink} →</a></section>
      <section className="ia-section"><h2>{t.regimesTitle}</h2><ol className="ia-regimes">{['1913–1933', '1933–1944', '1944–1971', '1971–1980', '1980–2008', '2008–2020', '2020–'].map((date, i) => <li key={date}><span>{date}</span><a href="#/history">{t.regimeNames[i]} →</a></li>)}</ol><p className="ia-source">{t.regimeNote}</p><a className="ia-more" href="#/history">{t.historyLink} →</a></section>
      <section className="ia-section"><h2>{t.debateTitle}</h2><div className="ia-grid two">{[[t.debateLeft, t.riskEvidence], [t.debateRight, t.restraintEvidence]].map(([title, items]) => <article key={title}><h3>{title}</h3><ul>{items.map(item => <li key={item}>{item}</li>)}</ul></article>)}</div><p>{t.debateNote}</p><div className="dollar-links"><a href="#/fiscal">CBO →</a><a href="#/monitor?group=inflation">5y5y →</a><a href="https://www.federalreserve.gov/aboutthefed/fedexplained/monetary-policy.htm" target="_blank" rel="noreferrer">Federal Reserve · {language === 'zh' ? '使命与政策' : 'Mandate & policy'} ↗</a></div></section>
      <GlobalPreview language={language} />
    </div>
  </div>
}
