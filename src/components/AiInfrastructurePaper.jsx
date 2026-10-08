import React from 'react'
import {infrastructurePaper as paper} from '../data/ai-infrastructure/paper.js'
import {paperCopy as copy} from '../i18n/aiInfrastructurePaper.js'

function PaperLink({language,page,children}) {
 return <a href={`${paper.metadata.pdfURL}${page?`#page=${page}`:''}`} target="_blank" rel="noopener noreferrer">{children}<span className="infra-sr-only"> · {copy.labels.newTab[language]}</span></a>
}
function Citation({language,value,page}) {
 return <p className="paper-citation"><PaperLink language={language} page={page}>{copy.labels.citation[language]} · {copy.locators[value][language]}</PaperLink></p>
}
function PaperChart({chart,language}) {
 const label=value=>value[language],c=copy.charts[chart.id]
 const observations=chart.observationIds.map(id=>paper.observations.find(o=>o.id===id))
 const max=Math.max(...observations.map(o=>o.value))
 return <figure className="paper-chart" data-paper-chart={chart.id} data-provenance="ACADEMIC_PAPER" aria-labelledby={`paper-chart-${chart.id}`}>
  <figcaption><p className="infra-kicker">{label(copy.labels.paper)}</p><h3 id={`paper-chart-${chart.id}`}>{label(c.title)}</h3><p>{label(c.subtitle)}</p></figcaption>
  <p className="paper-unit">{label(c.unit)}</p>
  {chart.id==='campus'&&<div className="paper-total" data-campus-total><strong>{label(copy.polish.campusTotal)}</strong><p>{label(copy.polish.campusBasis)}</p></div>}
  {chart.id==='cash'&&<p className="paper-classification" data-mixed-estimate>{label(copy.polish.mixed)}</p>}
  {chart.id==='booms'&&<p className="paper-classification" data-ai-scenario>{label(copy.polish.scenario)}</p>}
  <div className="paper-bars" role="img" aria-label={`${label(c.title)}. ${label(c.unit)}. ${chart.id==='cash'?label(copy.polish.mixed):chart.id==='booms'?label(copy.polish.scenario):label(copy.polish.campusBasis)}. ${label(copy.labels.dataTable)}.`}>
   {observations.map(o=><div className={`paper-bar-row ${o.classification==='PAPER_MIXED_ESTIMATE'||o.classification==='PAPER_SCENARIO'?'paper-estimated':''}`} key={o.id}>
    <span className="paper-bar-label">{label(copy.metrics[o.metric])}{chart.kind!=='components'&&<small>{o.period}{o.classification==='PAPER_MIXED_ESTIMATE'&&` · ${label(copy.labels.estimate)}`}{o.classification==='PAPER_SCENARIO'&&` · ${label(copy.labels.scenario)}`}</small>}</span>
    <span className="paper-bar-track"><span className={`paper-bar paper-bar-${o.metric}`} style={{width:`${o.value/max*100}%`}}/></span>
    <strong>{o.value}{chart.id==='booms'?'%':''}</strong>
   </div>)}
  </div>
  <p className="paper-note">{label(c.note)}</p>
  <Citation language={language} value={chart.locator} page={chart.pdfPage}/>
  <details className="paper-values"><summary>{label(copy.labels.dataTable)}</summary><table><caption>{label(c.title)} · {label(c.unit)}</caption><thead><tr><th scope="col">{label(copy.labels.item)}</th><th scope="col">{label(copy.labels.value)}</th><th scope="col">{label(copy.labels.basis)}</th></tr></thead><tbody>{observations.map(o=><tr key={o.id}><th scope="row">{label(copy.metrics[o.metric])}<br/>{o.period}</th><td>{o.value}</td><td>{label(copy.classifications[o.classification])}</td></tr>)}</tbody></table></details>
 </figure>
}
export function AiInfrastructurePaper({language}) {
 const label=value=>value[language]
 const section=(id,children)=><section className="ia-section paper-section" data-paper-section={id} aria-labelledby={`paper-section-${id}`}><h3 id={`paper-section-${id}`}>{label(copy.sections[id])}</h3>{children}</section>
 return <div className="content-section global-section ia-page infra-page paper-page" data-infrastructure-paper>
  <section className="paper-bottom-line" data-bottom-line aria-labelledby="paper-bottom-line-title"><h2 id="paper-bottom-line-title">{label(copy.polish.bottomLine)}</h2><div className="paper-bottom-grid">
   <article data-bottom-evidence="paper" data-provenance="ACADEMIC_PAPER"><p className="infra-kicker">{label(copy.labels.paper)}</p><h3>{label(copy.polish.paperLabel)}</h3><p>{label(copy.polish.paper)}</p></article>
   <article data-bottom-evidence="qualified" data-provenance="WORLD_INFLATION_LENS_QUALIFIED"><p className="infra-kicker">{label(copy.polish.evidenceKicker)}</p><h3>{label(copy.polish.evidenceLabel)}</h3><p>{label(copy.polish.evidence)}</p></article>
  </div></section>
  <section className="paper-macro" data-macro-part="1" data-provenance="ACADEMIC_PAPER" aria-labelledby="paper-part-one"><header className="paper-macro-header"><p className="infra-kicker">{label(copy.polish.part)} 1 · {label(copy.labels.paper)}</p><h2 id="paper-part-one">{label(copy.polish.paperPart)}</h2></header>
  {section('paper',<>
   <article className="paper-card"><p className="infra-kicker">{label(copy.labels.paper)}</p><h3>{label(copy.labels.paperTitle)}</h3><p>{label(copy.description)}</p><dl><div><dt>{label(copy.labels.author)}</dt><dd>{paper.metadata.authors.join(', ')}</dd></div><div><dt>{label(copy.labels.affiliation)}</dt><dd>{label(copy.labels.school)}</dd></div></dl><p>{label(copy.labels.version)}</p><div className="paper-links"><PaperLink language={language}>{label(copy.labels.read)}</PaperLink><a href={paper.metadata.canonicalURL} target="_blank" rel="noopener noreferrer">{label(copy.labels.context)}<span className="infra-sr-only"> · {label(copy.labels.newTab)}</span></a></div></article>
   <p className="paper-note">{label(copy.polish.readingBoundary)}</p>
   <div className="paper-summary">{copy.summary.map((text,i)=><div key={i}><p>{label(text)}</p><Citation language={language} value={copy.summaryLocators[i]}/></div>)}</div>
  </>)}
  {section('findings',<div className="paper-findings">{paper.findings.map(f=><article key={f.id} data-paper-finding={f.id}><p className="infra-kicker">{label(copy.labels.finding)}</p><p>{label(copy.findings[f.id])}</p><Citation language={language} value={f.locator}/></article>)}</div>)}
  {section('charts',<div className="paper-chart-grid">{paper.charts.map(c=><PaperChart key={c.id} chart={c} language={language}/>)}</div>)}
  </section>
  <section className="paper-macro" data-macro-part="2" aria-labelledby="paper-part-two"><header className="paper-macro-header"><p className="infra-kicker">{label(copy.polish.part)} 2</p><h2 id="paper-part-two">{label(copy.polish.comparisonPart)}</h2></header>
  {section('comparison',<>
   <aside className="paper-comparison-summary"><h4>{label(copy.labels.summary)}</h4><ul>{['physical','power','funding','aggregate'].map((id,i)=><li data-quick-assessment={id} key={id}><span>{label(copy.polish.quick[id])}</span><strong>{i<3?label(copy.assessments[paper.comparisons[i].assessment]):`${label(copy.assessments.NOT_COMPARABLE)} / ${label(copy.assessments.OUTSIDE_CURRENT_DATASET)}`}</strong></li>)}</ul></aside>
   <div className="paper-comparisons">{paper.comparisons.map(c=><article key={c.id} data-paper-comparison={c.id}>
    <div data-provenance="ACADEMIC_PAPER"><h3>{label(copy.labels.paperArgument)}</h3><p>{label(copy.comparisons[c.id].argument)}</p><Citation language={language} value={c.paperLocator}/></div>
    <div data-provenance="WORLD_INFLATION_LENS_QUALIFIED"><h3>{label(copy.labels.ourEvidence)}</h3><p>{label(copy.comparisons[c.id].evidence)}</p></div>
    <div><h3>{label(copy.labels.assessment)}</h3><p className="paper-assessment">{label(copy.assessments[c.assessment])}</p><h4>{label(copy.labels.boundary)}</h4><p>{label(copy.comparisons[c.id].boundary)}</p></div>
   </article>)}</div>
  </>)}
  </section>
 </div>
}
