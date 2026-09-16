import React from 'react'
import { PageIntro } from '../components/PageIntro.jsx'
import { shockCopy } from '../i18n/externalShocks.js'
import { shockTopics, shockIndicators, shockFields, shockEpisodes, shockSources } from '../data/externalShocks.js'
import { driverSeries } from '../data/drivers.js'
import { viewParameter } from '../utils/routing.js'

function EvidenceCard({ indicator, language }) {
  const t = shockCopy[language]
  const series = indicator.status === 'available' ? driverSeries[indicator.driverKey] : null
  const latest = series?.points.findLast(point => Number.isFinite(point.value))
  return <article className="shock-indicator" data-indicator={indicator.id} data-status={indicator.status}>
    <p className="eyebrow">{series ? t.available : t.planned}</p><h3>{t.indicators[indicator.id]}</h3>
    {series ? <>
      <strong>{latest ? latest.value.toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}</strong>
      <p>{series.measure === 'usd_per_barrel' ? t.oilUnit : t.yoy}</p>
      <p>{t.latest}: {latest?.date ?? t.missing}<br />{t.monthly}<br />{t.checked}: {series.metadata.retrievedAt}</p>
      <p className="ia-source">{t.source}: <a href={series.metadata.sourceUrl} target="_blank" rel="noreferrer">{series.id} · {series.metadata.publisher} / FRED ↗</a></p>
      <a className="ia-more" href={indicator.href}>{t.chart} →</a>
    </> : <p>{t.plannedNote}</p>}
  </article>
}

function Episodes({ language }) {
  const t = shockCopy[language]
  return <section className="ia-section shock-history"><h2>{t.historyTitle}</h2><p>{t.historyNote}</p>
    {shockEpisodes.map(episode => <details key={episode.id} className="shock-episode"><summary><span>{episode.years}</span>{' '}{episode.name[language]}</summary>
      <dl>{shockFields.map(key => <div key={key}><dt>{t.fields[key]}</dt><dd>{episode.fields[key][language]}
        {episode.fields[key].sources.length > 0 && <div className="ia-source">{t.source}: {episode.fields[key].sources.map(id => <a key={id} href={shockSources[id].url} target="_blank" rel="noreferrer">{shockSources[id].name} ↗</a>)}</div>}
      </dd></div>)}</dl>
    </details>)}
  </section>
}

export function ExternalShocks({ language }) {
  const t = shockCopy[language]
  const topic = viewParameter('topic', shockTopics, 'overview')
  const indicators = shockIndicators.filter(item => topic === 'overview' || item.topic === topic)
  return <><PageIntro eyebrow={t.eyebrow} title={t.title} description={t.intro} />
    <div className="content-section global-section ia-page shocks-page">
      <nav className="shock-topic-links" aria-label={t.topicNav}>{['overview', ...shockTopics].map(key => <a key={key} href={key === 'overview' ? '#/external-shocks' : `#/external-shocks?topic=${key}`} aria-current={topic === key ? 'page' : undefined}>{key === 'overview' ? t.overview : t.topics[key]}</a>)}</nav>
      {topic === 'overview' && <section className="ia-section"><h2>{t.pathsTitle}</h2><p>{t.pathsNote}</p><div className="ia-grid three ia-pathways">{t.paths.map(path => <article key={path.name}><h3>{path.name}</h3><ol>{path.steps.map(step => <li key={step}>{step}</li>)}</ol></article>)}</div><p>{t.balance}</p></section>}
      {topic !== 'history' && <section className="ia-section"><h2>{topic === 'overview' ? t.evidenceTitle : t.topics[topic]}</h2>{t.topicNotes[topic] && <p>{t.topicNotes[topic]}</p>}<p>{t.dataNote}</p><div className="ia-grid three">{indicators.map(indicator => <EvidenceCard key={indicator.id} indicator={indicator} language={language} />)}</div><a className="ia-more" href="#/sources?focus=health">{t.health} →</a></section>}
      {['overview', 'history'].includes(topic) && <Episodes language={language} />}
      <section className="ia-section shock-dollar"><h2>{t.dollarTitle}</h2><div className="ia-pathways"><ol>{t.dollarSteps.map(step => <li key={step}>{step}</li>)}</ol></div><p>{t.dollarNote}</p><div className="dollar-links"><a className="ia-more" href="#/purchasing-power">{t.power} →</a><a className="ia-more" href="#/fiscal">{t.fiscal} →</a></div></section>
      <section className="ia-section shock-method"><h2>{t.surveyTitle}</h2><h3>{t.surveyLabel}</h3><p>{t.surveyNote}</p><p>{t.method}</p></section>
    </div>
  </>
}
