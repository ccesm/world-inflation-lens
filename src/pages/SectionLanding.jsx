import React from 'react'
import { PageIntro } from '../components/PageIntro.jsx'
import { iaCopy, sectionLinks } from '../i18n/architecture.js'
import { OutlookSummary } from '../components/OutlookSummary.jsx'
export function SectionLanding({ section, language }) {
  const t = iaCopy[language]
  const links = sectionLinks[section].filter(([href]) => href !== `#/${section}`)
  return <><PageIntro eyebrow={section.toUpperCase()} title={t[`${section}Title`]} description={t[`${section}Intro`]} /><section className="content-section global-section ia-page">{section === 'dollar' && <><OutlookSummary language={language} /><p>{t.stance}</p><a className="ia-more" href="#/monitor">{t.evidenceLink} →</a></>}<div className="ia-grid three">{links.map(([href, zh, en], i) => <a className="ia-tool" href={href} key={href}><small>{String(i + 1).padStart(2, '0')}</small><h2>{language === 'zh' ? zh : en}</h2><span>{t.tool} →</span></a>)}</div></section></>
}
