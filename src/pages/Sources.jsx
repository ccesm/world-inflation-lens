import React from 'react'
import { Eyebrow } from '../components/Eyebrow.jsx'
import { PageIntro } from '../components/PageIntro.jsx'
import { sources } from '../data/sources.js'
import { experience } from '../i18n/experience.js'
import { cpi, cpiMetadata, latestCpi } from '../data/inflation.js'
import { GlobalDataNote } from '../components/GlobalDataNote.jsx'
import { driverMetadata } from '../data/drivers.js'
import { driversCopy } from '../i18n/drivers.js'
import { DataStatus } from '../components/DataStatus.jsx'

export function Sources({ t, language }) {
  const labels = experience[language]
  return <><PageIntro {...t.sources} description={labels.sourcesDescription} /><section className="content-section"><div className="section-heading"><div><Eyebrow>{t.sources.sectionEyebrow}</Eyebrow><h2>{t.sources.sectionTitle}</h2></div><p>{labels.sourcesNote}</p></div>
    <DataStatus language={language} />
    <div className="source-list">{sources.map(source => <article className="source-row" key={source.id}><div className="source-initial">{source.short}</div><div><h3>{source.name}</h3><span className={`source-status ${['cbo', 'fred', 'events', 'world-bank', 'natural-earth'].includes(source.id) ? 'integrated' : ''}`}>{['cbo', 'fred', 'events', 'world-bank', 'natural-earth'].includes(source.id) ? labels.sourceStatus : labels.sourcePlanned}</span><p>{source.description[language]}</p>{source.id === 'fred' && <p>CPIAUCNS · {cpi[0].date} — {latestCpi.date} · {labels.retrieved}: {cpiMetadata.retrievedAt}</p>}{source.id === 'world-bank' && <GlobalDataNote language={language} full />}</div><a href={source.url} target="_blank" rel="noopener noreferrer" aria-label={`${source.name} ${t.sources.visit}`}>↗</a></article>)}</div><p className="data-note">{labels.historicalReferences} <a href="#/timeline">{t.nav.timeline} →</a></p>
    <section className="global-panel"><h2>{driversCopy[language].open} · V0.4</h2><div className="driver-source-list">{driverMetadata.map(source => <p key={source.id}><a href={source.sourceUrl} target="_blank" rel="noreferrer">{source.id} ↗</a><span>{source.title} · {source.publisher}</span><span>{source.units} · {source.frequency} · {source.seasonalAdjustment}</span><span>{driversCopy[language].updated}: {source.sourceUpdatedAt} · {driversCopy[language].retrieved}: {source.retrievedAt}</span></p>)}</div></section>
  </section></>
}
