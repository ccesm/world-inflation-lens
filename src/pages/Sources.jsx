import React from 'react'
import { Eyebrow } from '../components/Eyebrow.jsx'
import { PageIntro } from '../components/PageIntro.jsx'
import { sources } from '../data/sources.js'
import { experience } from '../i18n/experience.js'
import { cpi, cpiMetadata, latestCpi } from '../data/inflation.js'

export function Sources({ t, language }) {
  const labels = experience[language]
  return <><PageIntro {...t.sources} description={labels.sourcesDescription} /><section className="content-section"><div className="section-heading"><div><Eyebrow>{t.sources.sectionEyebrow}</Eyebrow><h2>{t.sources.sectionTitle}</h2></div><p>{labels.sourcesNote}</p></div>
    <div className="source-list">{sources.map(source => <article className="source-row" key={source.id}><div className="source-initial">{source.short}</div><div><h3>{source.name}</h3><span className={`source-status ${source.id === 'fred' || source.id === 'events' ? 'integrated' : ''}`}>{source.id === 'fred' || source.id === 'events' ? labels.sourceStatus : labels.sourcePlanned}</span><p>{source.description[language]}</p>{source.id === 'fred' && <p>CPIAUCNS · {cpi[0].date} — {latestCpi.date} · {labels.retrieved}: {cpiMetadata.retrievedAt}</p>}</div><a href={source.url} target="_blank" rel="noopener noreferrer" aria-label={`${source.name} ${t.sources.visit}`}>↗</a></article>)}</div><p className="data-note">{labels.historicalReferences} <a href="#/timeline">{t.nav.timeline} →</a></p>
  </section></>
}
