import React from 'react'
import { shockCopy } from '../i18n/externalShocks.js'
import { shockTopics } from '../data/externalShocks.js'

export function ExternalShocksPreview({ language }) {
  const t = shockCopy[language]
  return <section className="ia-section shocks-preview" aria-labelledby="shocks-preview-title">
    <p className="eyebrow">{t.eyebrow}</p><h2 id="shocks-preview-title">{t.homeTitle}</h2><p>{t.intro}</p>
    <div className="shock-topic-links">{shockTopics.filter(topic => topic !== 'history').map(topic => <a key={topic} href={`#/external-shocks?topic=${topic}`}>{t.topics[topic]} <span aria-hidden="true">↗</span></a>)}</div>
    <p>{t.balance}</p><a className="ia-more" href="#/external-shocks">{t.explore} →</a>
  </section>
}
