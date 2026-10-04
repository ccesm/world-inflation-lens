import React from 'react'
import { dollarOutcomes, structuralThemes, researchStages, plannedResearchCategories, researchCopy } from '../data/researchArchitecture.js'
import { seriesRegistry } from '../data/seriesRegistry.js'

const copy = {
  en: {
    dual: 'Two questions about the dollar', domestic: 'Buying goods and services inside the U.S.', international: 'Use in global reserves, finance, trade and payments.',
    distinction: 'Domestic purchasing power and international use interact, but neither proves the other.',
    map: 'How the research fits together', compactNote: 'A reading order, with feedbacks—not a one-way causal model.', fullMap: 'Open the full research map',
    available: 'Explore existing evidence', evidence: 'Series used in this research', planned: 'Planned research — no observations integrated',
    feedbacks: 'Feedbacks also matter', categories: 'The international evidence gap', categoryNote: 'These categories organize the research agenda. Integrated reserves, Treasury, credit and publication evidence cover only part of the dollar system; a dollar index or a stablecoin total cannot measure international dominance.',
    context: 'Existing evidence and its limits', open: 'Explore',
  },
  zh: {
    dual: '关于美元的两个问题', domestic: '在美国境内购买商品和服务的能力。', international: '在全球储备、融资、贸易和支付中的使用。',
    distinction: '国内购买力与国际使用相互影响，但不能用其中一个证明另一个。',
    map: '研究如何相互衔接', compactNote: '这是带有反馈的阅读顺序，并非单向的机械因果模型。', fullMap: '打开完整研究地图',
    available: '查看现有证据', evidence: '本研究使用的序列', planned: '规划中的研究——尚未接入观测数据',
    feedbacks: '还需要考虑反馈', categories: '国际美元证据的缺口', categoryNote: '这些分类用于组织研究计划。已接入的储备、国债、信贷与研究资料只覆盖美元体系的一部分；美元指数或稳定币总量都不能衡量美元的国际主导地位。',
    context: '现有证据及其局限', open: '查看',
  },
}

const label = (value, language) => typeof value === 'string' ? value : value?.[language] || value?.en || ''

export function EvidenceState({ state, language }) {
  return <span className="research-state" data-evidence-state={state}>{researchCopy[language].evidenceStates[state]}</span>
}

function RouteLinks({ routes = [], language }) {
  return <div className="research-route-links">{routes.map(route => <a href={route.href} key={route.href}>{label(route.label, language)} <span aria-hidden="true">↗</span></a>)}</div>
}

function EvidenceDetails({ existingEvidence = [], plannedEvidence = [], language }) {
  const t = copy[language]
  return <details className="research-evidence-details"><summary>{t.context}</summary>
    {existingEvidence.length > 0 && <><p className="research-list-label">{t.evidence}</p><ul>{existingEvidence.map(id => <li key={id}>{label(seriesRegistry[id]?.title, language) || id} <code>{id}</code></li>)}</ul></>}
    {plannedEvidence.length > 0 && <><p className="research-list-label">{t.planned}</p><ul>{plannedEvidence.map(item => <li key={item.id}>{label(item.label, language)}</li>)}</ul></>}
  </details>
}

export function DualDollarSummary({ language, compact = false }) {
  const t = copy[language]
  return <section className={`dual-dollar-summary${compact ? ' is-compact' : ''}`} aria-labelledby="dual-dollar-title">
    <h2 id="dual-dollar-title">{t.dual}</h2>
    <div className="dual-dollar-grid">{dollarOutcomes.map(outcome => <article className="dual-dollar-card" key={outcome.id} data-dollar-outcome={outcome.id}>
      <div className="dual-dollar-heading"><h3>{label(outcome.label, language)}</h3><EvidenceState state={outcome.evidenceState} language={language} /></div>
      <p>{compact ? t[outcome.id] : label(outcome.description, language)}</p>
      {!compact && <><RouteLinks routes={outcome.routes} language={language} /><EvidenceDetails {...outcome} language={language} /></>}
    </article>)}</div>
    <p className="dual-dollar-distinction">{t.distinction}</p>
  </section>
}

function StructuralThemes({ language }) {
  return <div className="research-theme-grid">{structuralThemes.map(theme => <article className="research-theme" id={theme.id} key={theme.id} data-research-theme={theme.id}>
    <div className="research-theme-heading"><h4>{label(theme.label, language)}</h4><EvidenceState state={theme.evidenceState} language={language} /></div>
    <p>{label(theme.description, language)}</p>
    <RouteLinks routes={theme.routes} language={language} />
    <EvidenceDetails {...theme} language={language} />
  </article>)}</div>
}

export function ResearchMap({ language, compact = false }) {
  const t = copy[language], framework = researchCopy[language]
  return <section className={`research-map${compact ? ' is-compact' : ''}`} id="research-map" aria-labelledby="research-map-title">
    <h2 id="research-map-title">{t.map}</h2>
    {compact ? <>
      <ol className="research-map-flow" aria-label={t.map}>{researchStages.map((stage, index) => <li key={stage.id} data-research-stage={stage.id}>
        <a href={`#/research?focus=${stage.id}`}><span className="research-stage-number" aria-hidden="true">{index + 1}</span><span>{label(stage.label, language)}</span><span className="research-stage-arrow" aria-hidden="true">↗</span></a>
      </li>)}</ol>
      <p className="research-map-caption">{t.compactNote} <a href="#/research?focus=research-map">{t.fullMap} <span aria-hidden="true">→</span></a></p>
    </> : <>
      <p className="research-map-methodology">{framework.methodology}</p>
      <ol className="research-map-stages">{researchStages.map((stage, index) => <li key={stage.id} id={stage.id} data-research-stage={stage.id}>
        <div className="research-stage-heading"><span className="research-stage-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><h3>{label(stage.label, language)}</h3></div>
        <p>{label(stage.description, language)}</p>
        {stage.id === 'structural' ? <StructuralThemes language={language} /> : stage.id === 'outcomes' ? <div className="research-outcome-links">{dollarOutcomes.map(outcome => <article key={outcome.id} data-dollar-outcome={outcome.id}><h4>{label(outcome.label, language)}</h4><EvidenceState state={outcome.evidenceState} language={language} /><p>{label(outcome.description, language)}</p><RouteLinks routes={outcome.routes} language={language} /></article>)}</div> : <><RouteLinks routes={stage.routes} language={language} /><EvidenceDetails {...stage} language={language} /></>}
      </li>)}</ol>
      <p className="research-map-caption"><a href="#/research/signal-engine">{language === 'zh' ? 'Signal Engine：已验证证据的下游规则解读' : 'Signal Engine: downstream rule-based interpretation of validated evidence'}</a></p>
      <aside className="research-feedbacks"><h3>{t.feedbacks}</h3><ul>{framework.feedbacks.map(feedback => <li key={feedback}>{feedback}</li>)}</ul></aside>
      <section className="research-planned" id="international-evidence" aria-labelledby="research-planned-title"><h3 id="research-planned-title">{t.categories}</h3><p>{t.categoryNote}</p>
        <div className="research-category-grid">{plannedResearchCategories.map(category => <article key={category.id} data-research-category={category.id}>
          <h4>{label(category.label, language)}</h4><EvidenceState state={category.evidenceState} language={language} /><p>{label(category.description, language)}</p><EvidenceDetails {...category} language={language} />
        </article>)}</div>
      </section>
    </>}
  </section>
}
