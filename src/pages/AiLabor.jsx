import React from 'react'
import { PageIntro } from '../components/PageIntro.jsx'
import { aiLaborCopy } from '../i18n/aiLabor.js'
import snapshot from '../data/ai-labor/interim-conclusion.json'
import '../ai-labor.css'

const repository = 'https://github.com/ccesm/world-inflation-lens'
const reports = { strict: 'AI_LABOR_OUTCOMES_BY_EXPOSURE.md', expanded: 'AI_LABOR_OCCUPATIONAL_COVERAGE_EXPANSION.md' }
const signed = value => `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(4)}`

export function AiLabor({ language }) {
 const t = aiLaborCopy[language]
 return <>
  <PageIntro eyebrow={t.eyebrow} title={t.title} description={t.subtitle} />
  <div className="content-section global-section ia-page ai-labor-page" data-page="ai-labor" data-evidence="DESCRIPTIVE_ONLY" data-causality="CAUSALITY_NOT_ESTABLISHED">
   <section className="ia-section" aria-labelledby="ai-labor-conclusion">
    <h2 id="ai-labor-conclusion">{t.conclusionTitle}</h2>
    <div className="ai-labor-status"><p>{t.evidence}</p><strong data-evidence-status>{t.status}</strong><p>{t.modeLabel}: <strong>{t.mode}</strong></p><p>{t.maturity}</p></div>
    <p className="ai-labor-scope">{t.descriptive} · {t.causality}</p>
    {t.conclusion.map(p => <p key={p}>{p}</p>)}
    <p>{t.vintage}: <time dateTime={snapshot.asOf.researchVintage}>{snapshot.asOf.researchVintage}</time> · {t.complete}: {snapshot.asOf.latestCompleteOutcomeYear} · {t.partial}: {snapshot.asOf.partialObservationsThrough}</p>
    <p>{t.timeNote}</p>
   </section>
   <section className="ia-section"><h2>{t.studyTitle}</h2><p>{t.study}</p><p>{t.layers}</p><a className="ia-more" href="#/research/ai-productivity">{t.productivityLink} →</a></section>
   <section className="ia-section"><h2>{t.capexResearchLink}</h2><p>{t.capexResearchNote}</p><a className="ia-more" href="#/research/ai-capex">{t.capexResearchLink} →</a></section>
   <section className="ia-section"><h2>{t.methodsTitle}</h2><div className="ia-grid two">
    <article><h3>{t.academic}</h3><p>{t.academicText}</p><a href="https://arxiv.org/abs/2303.10130">{t.paper}: GPTs are GPTs</a></article>
    <article><h3>{t.microsoft}</h3><p>{t.microsoftText}</p><a href="https://www.microsoft.com/en-us/research/publication/working-with-ai-measuring-the-occupational-implications-of-generative-ai/">{t.paper}: Microsoft</a></article>
   </div><p>{t.methodsNote}</p></section>
   <section className="ia-section"><h2>{t.samplesTitle}</h2><div className="ia-grid two"><article><h3>{t.strict}</h3><p>{t.strictText}</p></article><article><h3>{t.expanded}</h3><p>{t.expandedText}</p></article></div>
    <div className="ai-labor-table-scroll" role="region" aria-label={t.scroll} tabIndex={0}>
     <table><caption>{t.tableCaption}</caption><thead><tr>{[t.method,t.sample,t.coverage,t.postGap,t.preGap].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
      <tbody>{['academic','microsoft'].flatMap(method => ['strict','expanded'].map(sample => {const row = snapshot[sample][method]; return <tr key={`${method}-${sample}`} data-result={`${method}-${sample}`}><th scope="row">{t[method]} · {t[sample]}</th><td>{t[sample]}</td><td>{row.coveragePercent.toFixed(2)}%</td><td>{signed(row.employmentChangeGapPp)}</td><td>{signed(row.pretrendGapPpPerYear)}</td></tr>}))}</tbody>
     </table>
    </div><p>{t.tableNote}</p><p><strong>{t.common}: {snapshot.common.expandedCoveragePercent.toFixed(2)}%</strong></p><p>{t.commonNote}</p>
   </section>
   <section className="ia-section"><h2>{t.sensitivityTitle}</h2><p>{t.sensitivity}</p></section>
   <section className="ia-section"><h2>{t.pretrendTitle}</h2><p>{t.pretrend}</p><h3>{t.limitsTitle}</h3><ul>{t.limits.map(item => <li key={item}>{item}</li>)}</ul></section>
   <section className="ia-section"><div className="ia-grid two"><article><h2>{t.canTitle}</h2><ul>{t.can.map(item => <li key={item}>{item}</li>)}</ul></article><article><h2>{t.cannotTitle}</h2><ul>{t.cannot.map(item => <li key={item}>{item}</li>)}</ul></article></div></section>
   <section className="ia-section"><h2>{t.waitingTitle}</h2><p>{t.waiting}</p><ol className="ai-labor-path">{t.steps.map(step => <li key={step}>{step}</li>)}</ol></section>
   <section className="ia-section"><h2>{t.observationTitle}</h2><p>{t.observation}</p><h3>{t.reopenTitle}</h3><ul>{t.reopen.map(item => <li key={item}>{item}</li>)}</ul><p>{t.reopenNote}</p></section>
   <section className="ia-section ai-labor-provenance"><h2>{t.provenanceTitle}</h2>
    <div className="ia-grid two">{['strict','expanded'].map(sample => <article key={sample}><h3>{sample === 'strict' ? t.strictCommit : t.expandedCommit}</h3><a href={`${repository}/commit/${snapshot.sourceCommits[sample]}`}><code>{snapshot.sourceCommits[sample]}</code></a><p>{t.spec}</p><code>{snapshot.specificationHashes[sample]}</code><p><a href={`${repository}/blob/${snapshot.sourceCommits[sample]}/docs/${reports[sample]}`}>{t.report} →</a></p></article>)}</div>
    <p><a href={`${repository}/blob/main/docs/AI_LABOR_PHASE_CLOSURE.md`}>{t.closure} →</a></p><p><a href="https://www.census.gov/programs-surveys/cps.html">{t.methodsSources} →</a></p><p>{t.monitor}</p>
   </section>
  </div>
 </>
}
