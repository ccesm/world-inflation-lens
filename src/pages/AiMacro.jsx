import React, {useEffect,useId,useState} from 'react'
import {PageIntro} from '../components/PageIntro.jsx'
import {AiMacroChart} from '../components/AiMacroChart.jsx'
import snapshot from '../data/ai-macro/summary.json'
import {SECTIONS,STATES,chartPoints,validSummary,verifySummary,isReleaseHold} from '../data/ai-macro/contract.js'
import {loadHistory} from '../data/ai-macro/history.js'
import {macroCopy as c,text,valueText,periodText} from '../i18n/aiMacro.js'
import '../ai-macro.css'
function Pair({label,children}){return <div><dt>{label}</dt><dd>{children}</dd></div>}
function MacroPanel({channel,data,language}){
 const id=useId(),t=x=>text(x,language)
 const [indicator,setIndicator]=useState(SECTIONS[channel][0]),[state,setState]=useState('VA'),[history,setHistory]=useState(null),[loading,setLoading]=useState(false),[error,setError]=useState(false),[full,setFull]=useState(false),[measure,setMeasure]=useState('value'),[page,setPage]=useState(0)
 function changeIndicator(value){setIndicator(value);setMeasure('value');setPage(0)}
 const controls=<div className="am-controls"><label>{t(c.indicator)}<select aria-label={t(c.indicator)} value={indicator} onChange={e=>changeIndicator(e.target.value)}>{SECTIONS[channel].map(k=><option key={k} value={k}>{t(c.labels[k])}</option>)}</select></label>
 {indicator.startsWith('EIA_COMM_')&&<label>{t(c.state)}<select aria-label={t(c.state)} value={state} onChange={e=>{setState(e.target.value);setPage(0)}}>{STATES.map(k=><option key={k} value={k}>{t(c.geographies[k])}</option>)}</select></label>}</div>
 if(indicator==='SPF10')return <section className="am-panel" data-macro-section={channel} aria-labelledby={`${id}-heading`}>
 <header><span className="am-kicker">{t(c.sections[channel])}</span><h2 id={`${id}-heading`}>{t(c.questions[channel])}</h2></header>{controls}
 <div data-external-indicator="SPF10" aria-live="polite"><h3>{t(c.spfTitle)}</h3><p className="am-kicker">{t(c.externalOnly)}</p><p>{t(c.definitions.SPF10)}</p><p>{t(c.spfSignificance)}</p><p>{t(c.spfLimits)}</p><p>{t(c.spfHosted)}</p>
 <a href={data.externalIndicators[0].officialURL} target="_blank" rel="noopener noreferrer">{t(c.spfLink)}</a><p>{t(c.spfNoEndorsement)}</p></div></section>
 const s=data.series.find(s=>s.indicatorId===indicator&&(!indicator.startsWith('EIA_COMM_')||s.geography===state)),source=data.sources.find(x=>x.sourceId===s.sourceId),r=s.lastRecord
 const measureLabel=measure==='value'?c.level:measure==='nativeChange'?c.nativeChange:c.yoy
 const unit=measure==='value'?t(c.units[s.unit]):s.calculationUnit==='PERCENTAGE_POINTS'?t(c.pp):t(c.percent)
 const rows=history?.series.find(x=>x.seriesId===s.seriesId)?.observations||[],visible=rows.filter(r=>full||r.period>='2015-01-01'),tableRows=[...visible].reverse().slice(page*24,(page+1)*24)
 async function show(){setLoading(true);setError(false);try{setHistory(await loadHistory(data))}catch{setError(true)}finally{setLoading(false)}}
 const change=(key,status,base)=><><strong>{valueText(r[key],language)}{r[key]!==null&&` ${s.calculationUnit==='PERCENTAGE_POINTS'?t(c.pp):t(c.percent)}`}</strong><small>{t(c.statuses[r[status]])} · {t(c.base)}: {periodText(r[base],s.frequency,language)}</small></>
 return <section className="am-panel" data-macro-section={channel} aria-labelledby={`${id}-heading`}>
 <header><span className="am-kicker">{t(c.sections[channel])}</span><h2 id={`${id}-heading`}>{t(c.questions[channel])}</h2></header>
 {controls}
 <h3>{t(c.labels[indicator])}</h3><p className="am-definition">{t(c.definitions[indicator])}</p>
 <div className="am-reading" aria-live="polite" aria-atomic="true" data-series={s.seriesId}><span>{t(c.observed)}</span><strong>{valueText(r.value,language)}</strong><span>{t(c.units[s.unit])} · {periodText(r.period,s.frequency,language)} · {t(c.geographies[s.geography])}</span></div>
 <dl className="am-facts"><Pair label={t(c.latest)}>{periodText(r.period,s.frequency,language)}</Pair><Pair label={t(c.frequency)}>{t(c.frequencies[s.frequency])}</Pair><Pair label={t(c.adjustment)}>{t(c.adjustments[s.seasonalAdjustment])}</Pair><Pair label={t(c.classification)}>{t(c.classifications[s.nominalOrReal])}</Pair><Pair label={t(c.revision)}>{t(c.revisionLabels[r.revisionFlag])}</Pair><Pair label={t(c.count)}>{s.rawRowCount} / {s.missingRowCount}</Pair></dl>
 {r.value===null&&<p>{t(c.lastValid)}: {valueText(s.lastNonmissing.value,language)} · {periodText(s.lastNonmissing.period,s.frequency,language)}</p>}
 <div className="am-changes"><span>{t(c.descriptive)}</span><dl className="am-facts"><Pair label={t(c.nativeChange)}>{change('nativeChange','nativeChangeStatus','nativeBasePeriod')}{indicator==='DFII10'&&<small>{t(c.interval)}: {r.nativeIntervalDays??t(c.missing)}</small>}</Pair><Pair label={t(c.yoy)}>{change('yearChange','yearChangeStatus','yearBasePeriod')}</Pair></dl></div>
 <dl className="am-facts"><Pair label={t(c.source)}><a href={source.officialURL} target="_blank" rel="noopener noreferrer">{t(c.providers[source.originalProvider])}{source.officialURL.includes('fred.')?' · FRED':''}</a></Pair><Pair label={t(c.retrieved)}>{s.clocks.retrievedAt.slice(0,10)}</Pair><Pair label={t(c.release)}>{t(c.releaseUnknown)}</Pair><Pair label={t(c.asOf)}>{data.researchAsOf}</Pair></dl>
 <p className="am-warning">{t(s.freshnessStatus==='CAPTURE_BEHIND_KNOWN_AVAILABLE'?c.freshnessWarning:c.freshnessReviewed)} {t(c.sourceLatest)}: {periodText(s.latestAvailableAtSourceReview,s.frequency,language)}</p>
 <details><summary>{t(c.provenance)}</summary><dl className="am-facts"><Pair label={t(c.hash)}><code>{s.sourceHash}</code></Pair><Pair label={t(c.locator)}>{r.locator}</Pair><Pair label={t(c.research)}><code>{data.inputIdentityHash}</code></Pair></dl></details>
 {!history&&<button type="button" disabled={loading} onClick={show}>{t(loading?c.historyLoading:error?c.retry:c.showHistory)}</button>}{error&&<p role="alert">{t(c.historyError)}</p>}
 {history&&<div className="am-history"><p role="status">{t(c.historyState)}</p><div className="am-controls"><label>{t(c.historyRange)}<select aria-label={t(c.historyRange)} value={full?'full':'recent'} onChange={e=>{setFull(e.target.value==='full');setPage(0)}}><option value="recent">{t(c.recent)}</option><option value="full">{t(c.full)}</option></select></label><label>{t(c.measure)}<select aria-label={t(c.measure)} value={measure} onChange={e=>setMeasure(e.target.value)}><option value="value">{t(c.level)}</option><option value="nativeChange">{t(c.nativeChange)}</option>{indicator!=='DFII10'&&<option value="yearChange">{t(c.yoy)}</option>}</select></label></div>
 <AiMacroChart points={chartPoints(rows,measure,full)} frequency={s.frequency} unit={unit} title={`${t(c.labels[indicator])} · ${t(measureLabel)}`} language={language}/>
 <table><caption>{t(c.table)} · {unit}</caption><thead><tr><th scope="col">{t(c.period)}</th><th scope="col">{t(measureLabel)}</th><th scope="col">{t(c.revision)}</th></tr></thead><tbody>{tableRows.map(row=><tr key={row.period} data-missing={row.value===null}><th scope="row">{periodText(row.period,s.frequency,language)}</th><td>{valueText(row[measure],language)}</td><td>{t(c.revisionLabels[row.revisionFlag])}</td></tr>)}</tbody></table>
 <div className="am-controls"><button type="button" disabled={page===0} onClick={()=>setPage(p=>p-1)}>{t(c.newer)}</button><button type="button" disabled={(page+1)*24>=visible.length} onClick={()=>setPage(p=>p+1)}>{t(c.older)}</button><span aria-live="polite">{Math.min(page*24+1,visible.length)}–{Math.min((page+1)*24,visible.length)} / {visible.length}</span></div></div>}
 <aside className="am-interpretation"><h4>{t(c.why)}</h4><p>{t(c.mechanisms[channel])}</p><h4>{t(c.alternativeTitle)}</h4><p>{t(c.alternatives[channel])}</p><h4>{t(c.unknown)}</h4><p>{t(c.noAI)}</p></aside>
 </section>
}
export function AiMacroContent({language,data}){
 const t=x=>text(x,language)
 if(!validSummary(data))return <p role="alert">{t(c.invalid)}</p>
 return <div className="am-page" data-page="ai-macro"><PageIntro eyebrow={t(c.preview)} title={t(c.title)} description={t(c.subtitle)}/><div className="content-section am-content"><section className="am-overview"><h2>{t(c.overview)}</h2><p>{t(c.snapshotNote)}</p><p>{t(c.boundary)}</p><nav aria-label={t(c.overview)}>{Object.keys(SECTIONS).map(k=><a key={k} href={`#/research/ai-macro?focus=macro-${k}`}>{t(c.sections[k])}</a>)}</nav></section><div className="am-panels">{Object.keys(SECTIONS).map(k=><div id={`macro-${k}`} key={k}><MacroPanel channel={k} data={data} language={language}/></div>)}</div><section className="am-method"><h2>{t(c.method)}</h2><p>{t(c.methodText)}</p><p>{t(c.rights)}</p><details><summary>{t(c.research)}</summary><p><a href={`https://github.com/ccesm/world-inflation-lens/blob/${data.researchCommit}/research/ai-infrastructure-paper-validation/phase-c2/methodology.md`} target="_blank" rel="noopener noreferrer">C2 · {t(c.research)}</a></p><code>{data.projectionHash}</code></details></section></div></div>
}
export function AiMacro({language,data=snapshot}){
 const [verified,setVerified]=useState(null),[failed,setFailed]=useState(false)
 useEffect(()=>{let active=true;setVerified(null);setFailed(false);verifySummary(data).then(v=>{if(active)setVerified(v)}).catch(()=>{if(active)setFailed(true)});return()=>{active=false}},[data])
 if(!verified)return <div className="am-page"><PageIntro eyebrow={text(c.preview,language)} title={text(c.title,language)} description={text(c.subtitle,language)}/><section className="content-section" role={failed?'alert':'status'}>{text(isReleaseHold(data)?c.releaseHold:failed?c.invalid:c.loading,language)}</section></div>
 return <AiMacroContent data={verified} language={language}/>
}
