import { Eyebrow } from '../components/Eyebrow.jsx'
import { PageIntro } from '../components/PageIntro.jsx'

export function Overview({ t }) { return <><PageIntro {...t.overview} /><section className="content-section"><div className="section-heading"><div><Eyebrow>{t.overview.frameworkEyebrow}</Eyebrow><h2>{t.overview.frameworkTitle}</h2></div><p>{t.overview.frameworkDescription}</p></div><div className="insight-grid">{t.overview.cards.map((card, index) => <article className="insight-card" key={index}><span className="feature-number">0{index + 1}</span><h3>{card.title}</h3><p>{card.description}</p></article>)}</div><div className="notice"><span>↗</span><p>{t.overview.notice}</p></div></section></> }
