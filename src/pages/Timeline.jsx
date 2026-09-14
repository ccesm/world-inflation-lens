import React, { useState } from 'react'
import { PageIntro } from '../components/PageIntro.jsx'
import { TimeSeriesChart } from '../charts/TimeSeriesChart.jsx'
import { cpi } from '../data/inflation.js'
import events from '../../data/history/events.json'
import { experience } from '../i18n/experience.js'

export function Timeline({ language }) {
  const labels = experience[language]
  const [year, setYear] = useState(1973)
  const event = events.find(item => year >= item.start && year <= item.end)
  const content = event[language]
  return <><PageIntro eyebrow={labels.historyEyebrow} title={labels.historyTitle} description={labels.historyDescription} />
    <section className="content-section history-content">
      <div className="chart-panel"><h2>{labels.historyChartTitle}</h2><TimeSeriesChart points={cpi} field="inflation" language={language} labels={labels} title={labels.historyChartTitle} unit={labels.inflationUnit} startDate="1900-01" highlight={event} /><p className="scope-note">{labels.historyScope} <a href="https://fred.stlouisfed.org/series/CPIAUCNS" target="_blank" rel="noreferrer">BLS / FRED ↗</a></p></div>
      <div className="history-explorer"><label className="year-selector">{labels.historySelect}<output>{year}</output><input aria-label={labels.historySelect} type="range" min="1900" max="2026" value={year} onChange={event => setYear(Number(event.target.value))} aria-valuetext={`${year} · ${content.title}`} /><span>1900 <span>2026</span></span></label>
        <div className="history-layout"><nav className="era-list" aria-label={labels.currentEvent}>{events.map(item => <button key={item.id} onClick={() => setYear(item.start)} aria-pressed={item.id === event.id}><span>{item.start}–{item.end}</span>{item[language].title}</button>)}</nav>
          <article className="era-story" aria-live="polite"><p className="eyebrow">{event.start} — {event.end}</p><h2>{content.title}</h2><p>{content.description}</p><h3>{labels.mechanism}</h3><p className="mechanism">{content.mechanism}</p><h3>{labels.lesson}</h3><p>{content.lesson}</p><a className="text-link" href={event.source.url} target="_blank" rel="noreferrer">{event.source.name} · {labels.sourceLink}</a></article>
        </div>
      </div>
    </section></>
}
