import React from 'react'
import { Eyebrow } from '../components/Eyebrow.jsx'
import { PageIntro } from '../components/PageIntro.jsx'

export function Timeline({ t }) { return <><PageIntro {...t.timeline} /><section className="content-section timeline-section"><div className="section-heading"><div><Eyebrow>{t.timeline.sectionEyebrow}</Eyebrow><h2>{t.timeline.sectionTitle}</h2></div><p>{t.timeline.sectionDescription}</p></div><div className="timeline-list">{t.timeline.events.map((event, index) => <article className="timeline-item" key={index}><div className="timeline-year">{event.year}</div><div className="timeline-marker" /><div><span className="timeline-category">{event.category}</span><h3>{event.title}</h3><p>{event.description}</p></div></article>)}</div><p className="data-note">{t.timeline.note}</p></section></> }
