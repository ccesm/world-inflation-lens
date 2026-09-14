import React from 'react'
import { Eyebrow } from '../components/Eyebrow.jsx'

export function Home({ t }) {
  return <>
    <section className="hero">
      <div className="hero-copy"><Eyebrow>{t.home.eyebrow}</Eyebrow><h1>{t.home.title}<em>{t.home.titleAccent}</em></h1><p className="lead">{t.home.description}</p><div className="hero-actions"><a className="primary-button" href="#/overview">{t.home.explore} <span>↗</span></a><a className="text-link" href="#/timeline">{t.home.timeline} <span>→</span></a></div></div>
      <div className="hero-visual" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit orbit-three" /><div className="globe"><div className="globe-latitude latitude-one" /><div className="globe-latitude latitude-two" /><div className="globe-longitude longitude-one" /><div className="globe-longitude longitude-two" /><span className="globe-dot dot-one" /><span className="globe-dot dot-two" /><span className="globe-dot dot-three" /></div><span className="visual-label label-one">1970 — 2026</span><span className="visual-label label-two">GLOBAL PERSPECTIVE</span></div>
    </section>
    <section className="home-section"><div className="section-heading"><div><Eyebrow>{t.home.sectionEyebrow}</Eyebrow><h2>{t.home.sectionTitle}</h2></div><p>{t.home.sectionDescription}</p></div><div className="feature-grid">{t.home.features.map((feature, index) => <a className="feature-card" href={`#/${['overview', 'timeline', 'us-cpi', 'map'][index]}`} key={index}><span className="feature-number">0{index + 1}</span><span className="feature-icon">{['◉', '⌁', '▥', '◎'][index]}</span><h3>{feature.title}</h3><p>{feature.description}</p><span className="card-arrow">↗</span></a>)}</div></section>
  </>
}
