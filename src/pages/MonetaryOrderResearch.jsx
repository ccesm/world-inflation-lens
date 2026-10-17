import React from 'react'
import { PageIntro } from '../components/PageIntro.jsx'
import { monetaryResearchCopy } from '../i18n/monetaryResearch.js'
import '../workspace.css'
import '../global-monetary-order.css'

export function MonetaryOrderResearch({ language }) {
  const t = monetaryResearchCopy[language]
  return <><PageIntro eyebrow={t.eyebrow} title={t.title} description={t.intro} />
    <div className="content-section global-section workspace gmo-page" data-monetary-research>
      <aside className="gmo-notice"><h2>{t.article}</h2><p>{t.description}</p><a className="gmo-preview-link" href="#/research/global-monetary-order/china-strategy">{t.read} →</a></aside>
      <p>{t.note}</p>
      {t.sections.map(section => <section id={`gmo-${section.id}`} key={section.id} aria-labelledby={`gmo-${section.id}-title`}><h2 id={`gmo-${section.id}-title`}>{section.title}</h2><p>{section.text}</p><a href={section.href}>{section.link} →</a></section>)}
    </div>
  </>
}
