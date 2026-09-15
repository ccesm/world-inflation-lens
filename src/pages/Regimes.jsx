import React from 'react'
import { PageIntro } from '../components/PageIntro.jsx'
import { dollarCopy } from '../i18n/dollar.js'
import { dollarRegimes, policyEpisodes } from '../data/dollarRegimes.js'
export function Regimes({ language }) {
  const t = dollarCopy[language]
  return <><PageIntro eyebrow="DOLLAR / HISTORY" title={t.regimesTitle} description={t.regimesDesc} /><section className="content-section global-section dollar-section">{[[t.regimes, dollarRegimes], [t.episodes, policyEpisodes]].map(([title, items]) => <section className="dollar-panel" key={title}><h2>{title}</h2>{items.map(item => <article className="regime-row" key={item.years}><strong>{item.years}</strong><div><h3>{item[language][0]}</h3><p>{item[language][1]}</p><a href={item.url} target="_blank" rel="noreferrer">{t.source} ↗</a></div></article>)}</section>)}<a href="#/timeline">{language === 'zh' ? '阅读完整通胀时间线' : 'Read the full inflation timeline'} →</a></section></>
}
