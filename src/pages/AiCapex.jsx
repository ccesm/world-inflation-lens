import React, {useEffect,useId,useRef,useState} from 'react'
import {PageIntro} from '../components/PageIntro.jsx'
import {aiCapexCopy} from '../i18n/aiCapex.js'
import snapshot from '../data/ai-capex/monitor.json'
import {snapshotSha256,validCapexSnapshot} from '../data/ai-capex/contract.js'
import {companies,chartSegments,formatCapex} from '../utils/aiCapex.js'
import '../ai-capex.css'
const repository='https://github.com/ccesm/world-inflation-lens'
function SourceLinks({ids,data,t}) {
 return <span className="ac-source-links">{[...new Set(ids)].map(id=>{const s=data.sources[id];return <a href={s.url} key={id} target="_blank" rel="noreferrer" title={`${t.sourceDate}: ${s.publicationDate}`}>{s.publisher||t.source} · {s.publicationDate}<span className="sr-only"> · {id}</span></a>})}</span>
}
function Section({index,t,children}){return <section className="ia-section" aria-labelledby={`ac-section-${index}`}><h2 id={`ac-section-${index}`}>{String(index+1).padStart(2,'0')} / {t.sections[index]}</h2>{children}</section>}
function ScrollTable({caption,t,children}){return <div className="ac-table-scroll" role="region" aria-label={`${caption} · ${t.tableScroll}`} tabIndex={0}><table><caption>{caption}</caption>{children}</table></div>}
function CompanyChart({metric,company,window,data,t}){
 const id=useId(),svg=useRef(null),[width,setWidth]=useState(640)
 useEffect(()=>{const observer=new ResizeObserver(entries=>setWidth(Math.max(210,Math.min(640,entries[0].contentRect.width))));observer.observe(svg.current);return()=>observer.disconnect()},[])
 const right=width-24,range={full:['2019Q1','2026Q2'],pre:['2019Q1','2022Q4'],recent:['2023Q1','2026Q2']}[window]
 const points=company.history[metric].filter(p=>p.period>=range[0]&&p.period<=range[1]),available=points.filter(p=>Number.isFinite(p.value))
 const min=Math.min(0,...available.map(p=>p.value)),max=Math.max(1,...available.map(p=>p.value)),span=max-min||1
 const y=v=>218-(v-min)/span*188,x=period=>58+points.findIndex(p=>p.period===period)/(points.length-1||1)*(right-58)
 const path=segment=>segment.map((p,i)=>`${i?'L':'M'}${x(p.period).toFixed(2)},${y(p.value).toFixed(2)}`).join(' ')
 const title=`${t.names[company.id]} · ${t.metrics[metric]}`
 const accountingNote={cashInvestmentIntensity:t.nativeCash[company.id],operatingMargin:t.chartAccountingNotes.operatingMargin,fcfMargin:t.chartAccountingNotes.fcfMargin[company.id]}[metric]
 return <article className="ac-chart" data-chart={metric}>
  <h3 id={id}>{title}</h3>
  <svg ref={svg} viewBox={`0 0 ${width} 260`} role="img" aria-labelledby={id} aria-describedby={`${id}-note`}>
   <title>{`${title} · % · ${range.join('–')}`}</title>
   {[min,(min+max)/2,max].map((v,i)=><g key={i}><line x1="58" x2={right} y1={y(v)} y2={y(v)} stroke="var(--global-border)"/><text x="50" y={y(v)+4} textAnchor="end">{v.toFixed(1)}%</text></g>)}
   {min<0&&<line x1="58" x2={right} y1={y(0)} y2={y(0)} stroke="currentColor" strokeDasharray="3 4"/>}
   {chartSegments(points).map((segment,i)=><path key={i} d={path(segment)} fill="none" stroke="var(--global-accent)" strokeWidth="2.5" data-segment={i}/>)}
   {points.filter(p=>Number.isFinite(p.value)&&(p.breakBefore||chartSegments(points).some(s=>s.length===1&&s[0]===p))).map(p=><circle key={p.period} cx={x(p.period)} cy={y(p.value)} r="3.5" fill="var(--global-accent)"/>)}
   <text x="58" y="248">{range[0]}</text><text x={right} y="248" textAnchor="end">{range[1]}</text>
  </svg>
  <p id={`${id}-note`}>{t.chartNote}</p><p>{t.chartCoverage}: {available.length} / {points.length}</p><p data-chart-accounting-note={metric}>{accountingNote}</p>
  <details><summary>{t.table}</summary><ScrollTable caption={`${title} · % · ${range.join('–')}`} t={t}>
   <thead><tr>{[t.period,`${t.value} · %`,t.basis,t.sources].map(h=><th scope="col" key={h}>{h}</th>)}</tr></thead>
   <tbody>{points.map(p=><tr key={p.period}><th scope="row">{p.period}</th><td>{formatCapex(p.value)}%</td><td>{p.gapReason?t.limited:p.breakBefore?t.break:t.noBreak}<br/><code>{data.definitions[p.basis].definitionVersion}</code></td><td><SourceLinks ids={p.sourceIds} data={data} t={t}/></td></tr>)}</tbody>
  </ScrollTable></details>
 </article>
}
function EventDates({event,t}){return <dl className="ac-dates"><div><dt>{t.quarterContext}</dt><dd>{event.reportingQuarter}</dd></div><div><dt>{t.eventDate}</dt><dd><time dateTime={event.eventDate}>{event.eventDate}</time></dd></div><div><dt>{t.referenceDate}</dt><dd><time dateTime={event.referencePeriod}>{event.referencePeriod}</time></dd></div></dl>}
export function AiCapex({language,data=snapshot}){
 const t=aiCapexCopy[language], [companyId,setCompany]=useState('MSFT'),[window,setWindow]=useState('full')
 if(!validCapexSnapshot(data))return <><PageIntro eyebrow={t.eyebrow} title={t.title} description={t.subtitle}/><p role="status" className="content-section">{t.unavailable}</p></>
 const company=data.companies.find(c=>c.id===companyId),get=(id,metric)=>data.companies.find(c=>c.id===id).metrics[metric]
 const event=(id,kind)=>data.events.find(e=>e.company===id&&e.kind===kind)
 const row=(label,value,unit='%',signed=false,decimals=2)=> <div className="ac-readout"><dt>{label}</dt><dd>{Number.isFinite(value)?`${formatCapex(value,{signed,decimals})}${unit}`:t.unavailable}</dd></div>
 const selectors=<div className="ac-controls"><label>{t.chartCompany}<select aria-label={t.chartCompany} value={companyId} onChange={e=>setCompany(e.target.value)}>{companies.map(id=><option value={id} key={id}>{t.names[id]}</option>)}</select></label><label>{t.chartWindow}<select aria-label={t.chartWindow} value={window} onChange={e=>setWindow(e.target.value)}>{Object.entries(t.windows).map(([id,label])=><option value={id} key={id}>{label}</option>)}</select></label></div>
 return <><PageIntro eyebrow={t.eyebrow} title={t.title} description={t.subtitle}/><div className="content-section global-section ia-page ac-page" data-page="ai-capex" data-vintage="FIXED_VINTAGE_RESEARCH">
  <Section index={0} t={t}><p className="ac-badge">{t.fixed}</p>{t.conclusion.map(p=><p key={p}>{p}</p>)}
   <dl className="ac-dates"><div><dt>{t.through}</dt><dd>{data.dataThrough}</dd></div><div><dt>{t.asOf}</dt><dd><time dateTime={data.asOf}>{data.asOf}</time></dd></div><div><dt>{t.window}</dt><dd>2019Q1–2026Q2</dd></div></dl><p>{t.vintageNote}</p>
   <h3>{t.five}</h3><ul className="ac-layers">{t.layers.map(l=><li key={l}>{l}</li>)}</ul>
   <ScrollTable caption={t.latestCaption} t={t}><thead><tr><th scope="col">{t.company}</th>{['cashInvestmentIntensity','fcfMargin','operatingMargin'].map(id=><th scope="col" key={id}>{t.metrics[id]} · %</th>)}</tr></thead><tbody>{data.companies.map(c=><tr data-company={c.id} key={c.id}><th scope="row">{t.names[c.id]}</th>{['cashInvestmentIntensity','fcfMargin','operatingMargin'].map(id=><td key={id}>{formatCapex(c.metrics[id].value)}%</td>)}</tr>)}</tbody></ScrollTable>
  </Section>
  <Section index={1} t={t}><p>{t.investmentNote}</p><div className="ac-grid">{data.companies.map(c=><article key={c.id}><h3>{t.names[c.id]}</h3><dl>{row(t.cashGrowth,c.metrics.cashPpeNative.yoy.percentChange,'%',true)}{row(t.metrics.cashInvestmentToCfoIntensity,c.metrics.cashInvestmentToCfoIntensity.value)}</dl><p>{t.nativeCash[c.id]}</p><SourceLinks ids={c.metrics.cashPpeNative.sourceIds} data={data} t={t}/></article>)}</div>
   {selectors}<CompanyChart metric="cashInvestmentIntensity" company={company} window={window} data={data} t={t}/>
  </Section>
  <Section index={2} t={t}><p className="ac-note">{t.cashNote}</p><div className="ac-grid">{data.companies.map(c=><article key={c.id}><h3>{t.names[c.id]}</h3><dl>{row(t.fcfChange,c.metrics.fcfMargin.yoy.delta,` ${t.pp}`,true)}{row(`${t.metrics.fcfCompanyConvention} · ${t.usdBillion}`,c.metrics.fcfCompanyConvention.value/1000,'',false,3)}</dl><SourceLinks ids={c.metrics.fcfCompanyConvention.sourceIds} data={data} t={t}/></article>)}</div>
   <p>{t.chartCompany}: {t.names[companyId]} · {t.chartWindow}: {t.windows[window]}</p><CompanyChart metric="fcfMargin" company={company} window={window} data={data} t={t}/>
  </Section>
  <Section index={3} t={t}><p>{t.cloudNote}</p><div className="ac-grid">{data.companies.map(c=><article key={c.id}><h3>{t.cloudNames[c.id]}</h3><dl>{row(t.latestCloud,c.metrics.segmentOperatingMargin.value)}</dl><p>{t.indirect[c.id]}</p>{['MSFT','GOOG'].includes(c.id)&&<p>{t.limited}</p>}{c.id==='AMZN'&&<dl>{row(t.awsGrowth,c.metrics.segmentRevenue.yoy.percentChange,'%',true)}{row(t.awsMargin,c.metrics.segmentOperatingMargin.yoy.delta,` ${t.pp}`,true)}</dl>}<SourceLinks ids={c.metrics.segmentOperatingMargin.sourceIds} data={data} t={t}/></article>)}</div>
   <CompanyChart metric="operatingMargin" company={company} window={window} data={data} t={t}/>
  </Section>
  <Section index={4} t={t}><p>{t.milestonesNote}</p><ol className="ac-timeline">{data.events.filter(e=>['DIRECT_AI_RUN_RATE','PAID_AI_SEATS'].includes(e.kind)).map(e=><li key={e.id} data-milestone={e.kind}><h3>{t.names[e.company]} · {t.eventNames[e.kind]}</h3><p className="ac-badge">{e.kind==='DIRECT_AI_RUN_RATE'?t.runRate:t.paidDisclosure}</p><strong>{t.lowerBound} {e.kind==='DIRECT_AI_RUN_RATE'?e.value/1000:e.value} {e.kind==='DIRECT_AI_RUN_RATE'?t.usdBillion:t.paidSeats}</strong><EventDates event={e} t={t}/><SourceLinks ids={[e.sourceId]} data={data} t={t}/></li>)}</ol><p>{t.referenceNote}</p>
  </Section>
  <Section index={5} t={t}><p>{t.depreciationNote}</p><div className="ac-note"><h3>{t.depreciation} · 2026Q2</h3><dl className="ac-metric-grid">{row(t.depreciation,get('GOOG','depreciationPpe').value/1000,` ${t.usdBillion}`,false,3)}{row(t.depGrowth,get('GOOG','depreciationPpe').yoy.percentChange,'%',true)}{row(t.depRatio,get('GOOG','pureDepreciationToRevenue').value)}{row(t.depChange,get('GOOG','pureDepreciationToRevenue').yoy.delta,` ${t.pp}`,true)}{row(t.ppeDep,get('GOOG','cashPpeToPureDepreciation').value,t.multiple)}</dl><p>{t.depPolicy}</p><SourceLinks ids={get('GOOG','depreciationPpe').sourceIds} data={data} t={t}/></div>
  </Section>
  <Section index={6} t={t}><p>{t.backlogNote}</p><div className="ac-grid">{['MSFT','GOOG'].map(id=>{const e=event(id,'BACKLOG');return <article key={id}><h3>{t.names[id]} · {t.backlogScopes[id]}</h3><strong>≈ {e.value/1000} {t.usdBillion}</strong><EventDates event={e} t={t}/><SourceLinks ids={[e.sourceId]} data={data} t={t}/><p>{id==='GOOG'?t.rpoBreak:t.capacity}</p>{id==='MSFT'&&<SourceLinks ids={[event(id,'CAPACITY_CONSTRAINT').sourceId]} data={data} t={t}/>}</article>})}</div>
   <h3>{t.guidance}</h3><p>{t.guidanceNote}</p><div className="ac-grid">{['MSFT','META'].map(id=>{const e=event(id,'CAPEX_GUIDANCE');return <article className="ac-guidance" key={id} data-guidance={id}><h4>{t.names[id]} · 2026</h4><p className="ac-badge">{t.guidance}</p><strong>{id==='META'?`${e.rangeLower/1000}–${e.rangeUpper/1000}`:`≈ ${e.value/1000}`} {t.usdBillion}</strong><EventDates event={e} t={t}/><SourceLinks ids={[e.sourceId]} data={data} t={t}/>{id==='MSFT'&&<p>{t.leaseGuidance}</p>}</article>})}</div>
  </Section>
  <Section index={7} t={t}><div className="ac-grid">{companies.map(id=><article key={id} data-boundary={id}><h3>{t.names[id]}</h3><ul>{t.boundaries[id].map(s=><li key={s}>{s}</li>)}</ul></article>)}</div></Section>
  <Section index={8} t={t}><div className="ac-grid"><article><h3>{t.canTitle}</h3><ul>{t.can.map(s=><li key={s}>{s}</li>)}</ul></article><article><h3>{t.cannotTitle}</h3><ul>{t.cannot.map(s=><li key={s}>{s}</li>)}</ul></article></div><p className="ac-note" data-recognized-ai="UNAVAILABLE">{t.recognized}</p><p>{t.roi}</p></Section>
  <Section index={9} t={t}><p>{t.methodology}</p><div className="ac-grid">{Object.entries({phase2B:t.methodReport,phase2A1:t.accountingReport}).map(([key,label])=><article key={key}><h3>{label}</h3><p>{t.sourceCommit}</p><a href={`${repository}/commit/${data.provenance[key]}`}><code>{data.provenance[key]}</code></a><p><a href={`${repository}/blob/${data.provenance[key]}/docs/${key==='phase2B'?'AI_CAPEX_MONETIZATION_MONITOR.md':'AI_CAPEX_QUARTERLY_PANEL.md'}`}>{label} →</a></p></article>)}</div>
   <details><summary>{t.inspectSource}</summary><dl>{[[t.monitorHash,data.provenance.monitorHash],[t.projectionHash,data.provenance.publicProjectionHash],[t.snapshotHash,snapshotSha256],[t.inputHash,data.provenance.inputSnapshotHash]].map(([label,value])=><div key={label}><dt>{label}</dt><dd><code>{value}</code></dd></div>)}</dl><ul className="ac-source-list">{Object.entries(data.sources).map(([id,s])=><li key={id}><a href={s.url}>{s.publisher||t.source}</a> · {t.sourceDate}: {s.publicationDate}<br/><code>{id}</code> · <code>{s.sha256}</code></li>)}</ul></details>
   <h3>{t.related}</h3><p>{t.relatedNote}</p><p className="ac-related"><a href="#/research/ai-productivity">{t.productivityLink} →</a><a href="#/research/ai-labor">{t.laborLink} →</a></p>
  </Section>
  <aside className="ac-maintenance" aria-labelledby="ac-maintenance-title" data-capex-maintenance>
   <h3 id="ac-maintenance-title">{t.maintenance.title}</h3>
   <dl className="ac-dates">{[[t.maintenance.through,data.dataThrough.replace('Q',' Q')],[t.maintenance.mode,t.maintenance.modeValue],[t.maintenance.publication,t.maintenance.disabled],[t.maintenance.accepted,t.maintenance.acceptedValue]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
   <p>{t.maintenance.help}</p><p>{t.maintenance.boundary}</p>
   <p className="ac-maintenance-links"><a href={`${repository}/actions/workflows/ai-capex-quarterly-refresh.yml`} target="_blank" rel="noopener noreferrer">{t.maintenance.button} ↗</a><a href={`${repository}/blob/main/docs/AI_CAPEX_OPERATOR_REFRESH.md`} target="_blank" rel="noopener noreferrer">{t.maintenance.instructions} ↗</a></p>
  </aside>
 </div></>
}
