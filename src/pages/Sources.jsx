import { Eyebrow } from '../components/Eyebrow.jsx'
import { PageIntro } from '../components/PageIntro.jsx'
import { sources } from '../data/sources.js'

export function Sources({ t, language }) { return <><PageIntro {...t.sources} /><section className="content-section"><div className="section-heading"><div><Eyebrow>{t.sources.sectionEyebrow}</Eyebrow><h2>{t.sources.sectionTitle}</h2></div><p>{t.sources.sectionDescription}</p></div><div className="source-list">{sources.map(source => <article className="source-row" key={source.id}><div className="source-initial">{source.short}</div><div><h3>{source.name}</h3><p>{source.description[language]}</p></div><a href={source.url} target="_blank" rel="noopener noreferrer" aria-label={`${source.name} ${t.sources.visit}`}>↗</a></article>)}</div><p className="data-note">{t.sources.note}</p></section></> }
