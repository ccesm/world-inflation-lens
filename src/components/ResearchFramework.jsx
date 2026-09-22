import React from 'react'
import { frameworkCopy } from '../i18n/framework.js'

export function ResearchFramework({ language }) {
  const t = frameworkCopy[language]
  return <section className="research-framework" aria-labelledby="framework-title">
    <p className="eyebrow">{t.eyebrow}</p>
    <h2 id="framework-title">{t.title}</h2>
    <p className="framework-question">{t.question}</p><p>{t.intro}</p>
    <figure className="framework-diagram" aria-labelledby="framework-outcome" aria-describedby="framework-diagram-note">
      <div className="framework-forces">{t.forces.map((force, index) => <article key={force.name} className="framework-force"><div className="framework-card-heading"><span className="eyebrow">0{index + 1}</span>{index > 0 && <span className="framework-plus" aria-hidden="true">+</span>}</div><h3>{force.name}</h3><p>{force.description}</p>
          <ul>{force.indicators.map(([label, href]) => <li key={label}>{href ? <a href={href}>{label} →</a> : <span>{label}<small className="framework-planned">{t.planned}</small></span>}</li>)}</ul>
        </article>)}</div>
      <div className="framework-result"><span aria-hidden="true">↓</span><h3 id="framework-outcome">{t.outcome}</h3></div>
      <figcaption id="framework-diagram-note">{t.diagramNote}</figcaption>
    </figure>
    <p className="ia-source">{t.coverage}</p>
    <section className="framework-horizons" aria-labelledby="horizons-title"><h3 id="horizons-title">{t.horizonsTitle}</h3><p>{t.horizonsIntro}</p>
      <div className="ia-grid three">{t.horizons.map(horizon => <article key={horizon.name}><h4>{horizon.name}</h4><strong>{horizon.duration}</strong><p>{horizon.question}</p><ul>{horizon.indicators.map(item => <li key={item}>{item}</li>)}</ul></article>)}</div><p className="ia-source">{t.horizonNote}</p>
    </section>
    <section className="framework-scenarios" aria-labelledby="framework-scenarios-title"><h3 id="framework-scenarios-title">{t.scenariosTitle}</h3><p>{t.scenariosIntro}</p>
      <ol className="framework-scenario-list">{t.scenarios.map(([name, description]) => <li key={name}><h4>{name}</h4><p>{description}</p></li>)}</ol><p className="ia-source">{t.scenarioNote}</p><a className="ia-more" href="#/scenarios">{t.calculator} →</a>
    </section>
  </section>
}
