import { SignalEngineBrief } from '../components/SignalEngineBrief.jsx'
import { InternationalSummary } from '../components/InternationalSummary.jsx'
import React from 'react'
import { DualDollarSummary, EvidenceState, ResearchMap } from '../components/ResearchMap.jsx'
import { SeriesStatusNote } from '../components/SystemStatus.jsx'
import { DollarPower } from '../components/DollarPower.jsx'
import { structuralThemes } from '../data/researchArchitecture.js'
import { monitorDefinitions } from '../data/monitor.js'
import { cpi } from '../data/inflation.js'
import { seriesMetadata } from '../data/seriesContract.js'
import { formatNumber } from '../utils/inflation.js'

const copy = {
  en: {
    eyebrow: 'THE U.S. DOLLAR · A 20–30 YEAR VIEW', title: 'What will the dollar look like in 20–30 years?',
    intro: 'Explore its purchasing power at home and its role abroad through observed evidence, history and conditional scenarios.',
    evidence: 'Current evidence', evidenceNote: 'Latest available observations—not live readings or a combined score. Dates and update schedules differ.',
    observed: 'Observed', explore: 'Explore the evidence', forces: 'What is driving the outlook?',
    deeper: 'Go deeper', research: 'Research map & evidence gaps', monitor: 'All monitor series', workspace: 'Compare data & export CSV', sources: 'Sources, Data Health & System Status',
    history: 'Purchasing power & history', historyNote: 'Consumer prices measure domestic purchasing power. They do not measure the dollar’s international role.',
    power: 'Open Purchasing Power', since: 'Since 1971', regimes: 'Historical Regimes', scenarios: 'Explore conditional scenarios',
  },
  zh: {
    eyebrow: '美元 · 未来20–30年', title: '20–30 年后的美元会是什么样？',
    intro: '从观测数据、历史与条件情景，理解美元的国内购买力和国际作用。',
    evidence: '当前证据', evidenceNote: '最新可用观测，不是实时读数或综合评分。各序列的日期和更新节奏不同。',
    observed: '观测期', explore: '查看证据', forces: '哪些力量正在塑造前景？',
    deeper: '深入研究', research: '研究地图与证据缺口', monitor: '全部监测指标', workspace: '比较数据与导出 CSV', sources: '来源、数据健康与系统状态',
    history: '购买力与历史', historyNote: '消费物价衡量国内购买力，不衡量美元的国际作用。',
    power: '打开购买力工具', since: '1971 年以来', regimes: '历史货币制度', scenarios: '查看条件情景',
  },
}

// These are existing monitor transformations, not a parallel data/metadata registry.
const evidenceIds = ['CPIAUCNS', 'DFII10', 'FYPUGDA188S', 'DTWEXBGS']

function CurrentEvidence({ language }) {
  const t = copy[language]
  return <section id="current-evidence" className="home-evidence" aria-labelledby="current-evidence-title">
    <h2 id="current-evidence-title">{t.evidence}</h2><p>{t.evidenceNote}</p>
    <div className="home-evidence-grid">{evidenceIds.map(id => {
      const item = monitorDefinitions.find(series => series.id === id)
      const latest = item.points.findLast(point => Number.isFinite(point.value))
      const source = id === 'CPIAUCNS' ? { ...item.source, observations: cpi } : item.source
      const metadata = seriesMetadata(source)
      return <article key={id} data-evidence-series={id}>
        <h3>{item[language]}</h3>
        <strong data-observed-value>{formatNumber(latest?.value ?? null, language)} <small>{item.unit}</small></strong>
        <p data-observation-date>{t.observed} · {latest ? (source.frequency.startsWith('annual') ? latest.date.slice(0, 4) : latest.date) : '—'}</p>
        <a className="home-evidence-source" href={metadata.sourceUrl} target="_blank" rel="noreferrer">{metadata.publisher} / {metadata.distributor} · {id} <span aria-hidden="true">↗</span></a>
        <SeriesStatusNote source={source} language={language} />
        <p>{item.note[language]}</p>
      </article>
    })}</div>
    <a className="ia-more" href="#/monitor">{t.explore} <span aria-hidden="true">→</span></a>
  </section>
}

export function Home({ language }) {
  const t = copy[language]
  return <div className="ia-home global-section v1-home" data-page="home">
    <SignalEngineBrief language={language} />
    <section className="ia-hero"><p className="eyebrow">{t.eyebrow}</p><h1>{t.title}</h1><p className="ia-subtitle">{t.intro}</p></section>
    <div className="content-section ia-home-body dollar-section">
      <DualDollarSummary language={language} compact />
      <ResearchMap language={language} compact />
      <CurrentEvidence language={language} />
      <InternationalSummary language={language} />
      <section className="home-structural" aria-labelledby="home-forces-title"><h2 id="home-forces-title">{t.forces}</h2>
        <div className="home-theme-grid">{structuralThemes.map(theme => <article key={theme.id} data-research-theme={theme.id}>
          <h3>{theme.label[language]}</h3><EvidenceState state={theme.evidenceState} language={language} /><p>{theme.description[language]}</p>
          <a className="ia-more" href={theme.routes[0].href}>{theme.routes[0].label[language]} <span aria-hidden="true">→</span></a>
        </article>)}</div>
      </section>
      <section className="home-deeper" aria-labelledby="home-deeper-title"><h2 id="home-deeper-title">{t.deeper}</h2>
        <div className="home-research-links">{[['#/research', t.research], ['#/monitor', t.monitor], ['#/research/data', t.workspace], ['#/sources', t.sources]].map(([href, title]) => <a key={href} href={href}>{title} <span aria-hidden="true">↗</span></a>)}</div>
      </section>
      <section className="home-history" aria-labelledby="home-history-title"><h2 id="home-history-title">{t.history}</h2><p>{t.historyNote}</p>
        <DollarPower language={language} initialBase="1971-08" preview />
        <div className="home-research-links">{[['#/purchasing-power', t.power], ['#/since-1971', t.since], ['#/history', t.regimes], ['#/scenarios', t.scenarios]].map(([href, title]) => <a key={href} href={href}>{title} <span aria-hidden="true">→</span></a>)}</div>
      </section>
    </div>
  </div>
}
