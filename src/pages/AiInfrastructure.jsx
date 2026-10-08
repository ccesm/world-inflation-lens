import React, {useState} from 'react'
import {PageIntro} from '../components/PageIntro.jsx'
import {infrastructureCopy as copy} from '../i18n/aiInfrastructure.js'
import snapshot from '../data/ai-infrastructure/monitor.json'
import {companyOrder,validInfrastructureSnapshot} from '../data/ai-infrastructure/contract.js'
import '../ai-infrastructure.css'
import {AiInfrastructurePaper} from '../components/AiInfrastructurePaper.jsx'
import {paperCopy} from '../i18n/aiInfrastructurePaper.js'

function Dates({fact,language}) {
 const label = value => value[language]
 const entries = [[copy.labels.effectiveDate,fact.effectiveDate],[copy.labels.sourceDate,fact.sourceDate],[copy.labels.availableFrom,fact.availableFrom]]
 return <dl className="infra-dates">{entries.map(([name,date])=><div key={name.en}><dt>{label(name)}</dt><dd>{date ? <time dateTime={date}>{date}</time> : label(copy.labels.notDisclosed)}</dd></div>)}</dl>
}
function Sources({ids,data,language}) {
 return <ul className="infra-sources">{ids.map(id=>{const s=data.sources.find(item=>item.sourceId===id);return <li key={id}><a href={s.publicURL} target="_blank" rel="noopener noreferrer">{s.publisher[language]} · {s.documentTitle[language]}<span className="infra-sr-only"> · {copy.labels.newTab[language]}</span></a><span>{copy.labels.sourceDate[language]}: {s.documentDate || copy.labels.notDisclosed[language]}</span></li>})}</ul>
}
function Capacity({fact,data,language,power=false}) {
 const label = value => value[language]
 return <div className="infra-fact" data-native-fact={fact.capacityDefinition} data-fact-kind={power?'power':'campus'}>
  <h4>{label(power?fact.label:fact.shortDefinition)}</h4>
  <p className="infra-value">{fact.operator!=='EQ'&&`${label(copy.operators[fact.operator])} `}{fact.value} {fact.unit}</p>
  <p>{label(copy.capacityStatus[fact.status])} · {label(copy.classifications[fact.classification])}</p>
  {power&&<p>{label(fact.shortDefinition)}</p>}<p>{label(fact.scope)}</p>
  <p>{label(fact.comparabilityNote)}</p>{power&&<p>{label(fact.scopeNote)}</p>}
  <Dates fact={fact} language={language}/><Sources ids={fact.sourceRefs} data={data} language={language}/>
 </div>
}
function ProjectCard({project:p,data,language}) {
 const label = value => value[language]
 const latest=p.statusHistory.at(-1)
 return <article className="infra-card" data-project={p.projectId} data-company={p.companyId || 'COMPARATIVE'} aria-labelledby={`infra-${p.projectId}`}>
  <p className="infra-kicker">{p.companyId ? label(p.companyName) : label(copy.labels.comparative)}</p>
  <h3 id={`infra-${p.projectId}`}>{label(p.projectName)}</h3>
  <p>{Object.values(p.location).map(label).join(' · ')}</p>
  <h4>{label(copy.labels.status)}</h4><p className="infra-status">{label(copy.statuses[p.projectStatus])}</p>
  <p>{label(latest.scope)}</p><Dates fact={{effectiveDate:p.statusEffectiveDate,sourceDate:p.statusSourceDate,availableFrom:p.statusAvailableFrom}} language={language}/><Sources ids={latest.sourceRefs} data={data} language={language}/>
  {p.statusHistory.length>1&&<details><summary>{label(copy.labels.history)}</summary><p>{label(copy.ui.historyHelp)}</p><ol>{p.statusHistory.map(h=><li key={`${h.effectiveDate}-${h.status}`}><strong>{label(copy.statuses[h.value])}</strong><p>{label(h.scope)}</p><Dates fact={h} language={language}/><Sources ids={h.sourceRefs} data={data} language={language}/></li>)}</ol></details>}
  <h4>{label(copy.labels.capacity)}</h4>
  {p.capacityDisplay.length ? p.capacityDisplay.map((f,i)=><Capacity key={i} fact={f} data={data} language={language}/>) : <p>{label(copy.ui.capacityMissing)}</p>}
  <h4>{label(copy.labels.archetype)}</h4><p data-financing="UNKNOWN">{label(copy.archetypes[p.primaryArchetype])}</p>
  {p.publicNotes.map((n,i)=><p className="infra-note" key={i}>{label(n)}</p>)}
  {p.scopeNotes.map((n,i)=><p key={i}>{label(n)}</p>)}
  <details><summary>{label(copy.labels.sources)}</summary><Sources ids={p.publicSourceRefs} data={data} language={language}/></details>
 </article>
}
export function AiInfrastructure({language,data=snapshot}) {
 const label = value => value[language], [company,setCompany]=useState('ALL'),[status,setStatus]=useState('ALL')
 if(!validInfrastructureSnapshot(data)) return <><PageIntro eyebrow={label(copy.ui.fixed)} title={label(copy.page.title)} description={label(copy.page.subtitle)}/><p role="status" className="content-section">{label(copy.ui.unavailablePage)}</p></>
 const filtered=data.projects.filter(p=>(company==='ALL'||(company==='COMPARATIVE'?p.companyId===null:p.companyId===company))&&(status==='ALL'||p.projectStatus===status))
 const section=(id,children)=><section className="ia-section" aria-labelledby={`infra-section-${id}`}><h2 id={`infra-section-${id}`}>{label(copy.sections[id])}</h2>{children}</section>
 return <><PageIntro eyebrow={label(paperCopy.hero)} title={label(copy.page.title)} description={label(paperCopy.intro)}/>
 <AiInfrastructurePaper language={language}/>
 <header className="content-section global-section infra-page infra-independent" data-independent-divider data-provenance="WORLD_INFLATION_LENS_QUALIFIED"><p className="infra-kicker">{label(paperCopy.labels.qualified)}</p><h2>{label(paperCopy.sections.independent)}</h2><p>{label(paperCopy.labels.detail)}</p></header>
 <div className="content-section global-section ia-page infra-page" data-page="ai-infrastructure" data-provenance="WORLD_INFLATION_LENS_QUALIFIED">
  <p className="infra-vintage">{label(copy.labels.asOf)}: <time dateTime={data.asOf}>{data.asOf}</time></p><p>{label(copy.disclosures.clock)}</p><p>{label(copy.ui.counts)}</p><p>{label(copy.disclosures.counts)}</p>
  <aside className="infra-warning" data-do-not-add><p>{label(copy.disclosures.doubleCount)}</p></aside>
  {section('landscape',<>
   <p>{label(copy.ui.association)}</p>
   <div className="infra-coverage" aria-label={label(copy.labels.company)}>{companyOrder.map(id=><p key={id}>{label(copy.companies[id])}: {data.projects.filter(p=>p.companyId===id).length}</p>)}<p>{label(copy.labels.comparative)}: 1</p></div>
   <p data-alphabet-empty>{label(copy.ui.emptyAlphabet)}</p>
   <div className="infra-filters">
    <label>{label(copy.labels.filterCompany)}<select aria-label={label(copy.labels.filterCompany)} value={company} onChange={e=>setCompany(e.target.value)}><option value="ALL">{label(copy.labels.all)}</option>{companyOrder.map(id=><option key={id} value={id}>{label(copy.companies[id])}</option>)}<option value="COMPARATIVE">{label(copy.labels.comparative)}</option></select></label>
    <label>{label(copy.labels.filterStatus)}<select aria-label={label(copy.labels.filterStatus)} value={status} onChange={e=>setStatus(e.target.value)}><option value="ALL">{label(copy.labels.all)}</option>{Object.keys(data.summary.statusCounts).map(id=><option key={id} value={id}>{label(copy.statuses[id])}</option>)}</select></label>
    <label>{label(copy.labels.filterArchetype)}<select aria-label={label(copy.labels.filterArchetype)} disabled aria-describedby="infra-unknown-filter"><option>{label(copy.archetypes.UNKNOWN)}</option></select></label>
   </div><p id="infra-unknown-filter">{label(copy.ui.unknownFilter)}</p>
   <p role="status" aria-live="polite">{filtered.length ? `${label(copy.labels.project)}: ${filtered.length}` : label(copy.labels.noResults)}</p>
   <div className="infra-grid">{filtered.map(p=><ProjectCard key={p.projectId} project={p} data={data} language={language}/>)}</div>
   <details className="infra-table"><summary>{label(copy.labels.table)}</summary><p>{label(copy.ui.tableHelp)}</p>
    <div className="infra-table-scroll" role="region" aria-label={label(copy.labels.table)} tabIndex={0}><table><caption>{label(copy.labels.table)} · {data.asOf}</caption><thead><tr>{['company','project','location','status','capacity','definition','archetype','power','asOf'].map(k=><th key={k} scope="col">{label(copy.labels[k])}</th>)}</tr></thead><tbody>{filtered.map(p=><tr key={p.projectId}><td>{p.companyId?label(p.companyName):label(copy.labels.comparative)}</td><th scope="row"><a href={`#infra-${p.projectId}`} onClick={e=>{e.preventDefault();const h=document.getElementById(`infra-${p.projectId}`);h.tabIndex=-1;h.focus();h.scrollIntoView()}}>{label(p.projectName)}</a></th><td>{Object.values(p.location).map(label).join(' · ')}</td><td>{label(copy.statuses[p.projectStatus])}<br/>{p.statusEffectiveDate}</td><td>{p.capacityDisplay.length?p.capacityDisplay.map((f,i)=><p key={i}>{f.operator!=='EQ'&&label(copy.operators[f.operator])} {f.value} {f.unit} · {label(copy.capacityStatus[f.status])}</p>):label(copy.labels.notQualified)}</td><td>{p.capacityDisplay.map((f,i)=><p key={i}>{label(f.shortDefinition)}</p>)}</td><td>{label(copy.archetypes.UNKNOWN)}</td><td>{p.powerSummary.length?p.powerSummary.map((f,i)=><p key={i}>{label(f.label)} · {label(f.scope)}</p>):label(copy.ui.powerMissing)}</td><td>{p.lastQualifiedAsOf}<Sources ids={p.publicSourceRefs} data={data} language={language}/></td></tr>)}</tbody></table></div>
   </details>
  </>)}
  {section('financing',<><p>{label(copy.page.summary)}</p><p className="infra-warning">{label(copy.ui.structureCount)}</p><p>{label(copy.disclosures.financing)}</p><p>{label(copy.disclosures.missingness)}</p><ul>{Object.entries(copy.archetypes).filter(([id])=>id!=='UNKNOWN').map(([id,name])=><li key={id}>{label(name)}</li>)}</ul><p>{label(copy.ui.unknownFilter)}</p></>)}
  {section('power',<><p>{label(copy.disclosures.utility)}</p><div className="infra-grid">{data.projects.filter(p=>p.powerSummary.length).map(p=><article className="infra-card" key={p.projectId}><h3>{label(p.projectName)}</h3>{p.powerSummary.map((f,i)=><Capacity key={i} fact={f} data={data} language={language} power/>)}</article>)}</div></>)}
  {section('boundaries',<><p className="infra-warning" data-do-not-add>{label(copy.disclosures.doubleCount)}</p>{['guarantee','maximumExposure','returns','comparability','missingness','clock'].map(k=><p key={k}>{label(copy.disclosures[k])}</p>)}<h3>{label(copy.ui.relatedTitle)}</h3><p>{label(copy.ui.relatedNote)}</p><a href="#/research/ai-capex">{label(copy.ui.capex)} →</a></>)}
 </div></>
}
