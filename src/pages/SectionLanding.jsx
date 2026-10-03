import { InternationalSummary } from '../components/InternationalSummary.jsx'
import React from 'react'
import { PageIntro } from '../components/PageIntro.jsx'
import { iaCopy, sectionLinks } from '../i18n/architecture.js'
import { Environment } from '../components/OutlookSummary.jsx'
import { frameworkCopy } from '../i18n/framework.js'
import { researchCopy } from '../data/researchArchitecture.js'
import { DualDollarSummary, ResearchMap } from '../components/ResearchMap.jsx'

function ResearchReadingGuide({ language }) {
  const t = frameworkCopy[language]
  return <section className="research-reading-guide" aria-labelledby="research-reading-title">
    <h2 id="research-reading-title">{language === 'zh' ? '时间尺度与情景' : 'Time horizons and scenarios'}</h2>
    <details id="research-horizons"><summary>{t.horizonsTitle}</summary><p>{t.horizonsIntro}</p>
      <div className="research-horizons-grid">{t.horizons.map(horizon => <article key={horizon.name}><h3>{horizon.name}</h3><p className="research-horizon-duration">{horizon.duration}</p><p>{horizon.question}</p><ul>{horizon.indicators.map(indicator => <li key={indicator}>{indicator}</li>)}</ul></article>)}</div><p>{t.horizonNote}</p>
    </details>
    <details id="research-scenarios"><summary>{t.scenariosTitle}</summary><p>{t.scenariosIntro}</p>
      <ol className="research-scenario-list">{t.scenarios.map(([title, description]) => <li key={title}><h3>{title}</h3><p>{description}</p></li>)}</ol><p>{t.scenarioNote}</p><a className="ia-more" href="#/scenarios">{t.calculator} <span aria-hidden="true">→</span></a>
    </details>
  </section>
}

export function SectionLanding({ section, language }) {
  const t = iaCopy[language]
  const links = sectionLinks[section].filter(([href]) => href !== `#/${section}`)
  return <><PageIntro eyebrow={t.nav[section]} title={t[`${section}Title`]} description={t[`${section}Intro`]} />
    <div className="content-section global-section ia-page research-landing">
      {section === 'dollar' && <>
        <DualDollarSummary language={language} />
        <InternationalSummary language={language} />
        <section className="research-outcome-caveats" aria-labelledby="dollar-distinction-title"><h2 id="dollar-distinction-title">{language === 'zh' ? '两种结果不能互相替代' : 'Keep the two outcomes distinct'}</h2><ul>{researchCopy[language].outcomeCaveats.map(caveat => <li key={caveat}>{caveat}</li>)}</ul></section>
        <a className="ia-more" href="#/research?focus=research-map">{language === 'zh' ? '查看完整研究地图' : 'Explore the full research map'} <span aria-hidden="true">→</span></a>
      </>}
      {section === 'research' && <ResearchMap language={language} />}
      <section id="research-tools" className="research-tool-directory" aria-labelledby="research-tools-title"><h2 id="research-tools-title">{language === 'zh' ? (section === 'dollar' ? '美元证据与历史工具' : '全部研究工具与数据') : (section === 'dollar' ? 'Dollar evidence and historical tools' : 'All research tools and data')}</h2>
        <div className="research-tool-grid">{links.map(([href, zh, en]) => <a className="research-tool-link" href={href} key={href}><h3>{language === 'zh' ? zh : en}</h3><span>{t.tool} <span aria-hidden="true">↗</span></span></a>)}</div>
      </section>
      {section === 'research' && <ResearchReadingGuide language={language} />}
      {section === 'dollar' && <details className="research-reading-guide" id="research-environment"><summary>{language === 'zh' ? '按指标定义的描述区间' : 'Indicator-specific descriptive bands'}</summary><Environment language={language} /></details>}
    </div>
  </>
}
