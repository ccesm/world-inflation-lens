import React, { useId, useState } from 'react'
import { aiCopy } from '../i18n/productivity.js'
import { growth, movingMean, periodLabel, lastValue, productivityCsv } from '../utils/productivity.js'
import { monthNumber } from '../utils/inflation.js'

export const number = value => Number.isFinite(value) ? value.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '—'
export function ProductivitySource({ s, language, compact = false }) {
 const t = aiCopy[language]
 return <div className="ai-source"><p className="ai-status">{s.status === 'derived_from_observations' ? t.derived : t.observed}{s.proxy && <> · <strong>{t.proxy}</strong></>}</p>
 <p>{t.source}: {(s.inputSources || [s]).map(source => <React.Fragment key={source.id}><a href={source.sourceUrl} target="_blank" rel="noreferrer">{source.publisher} · {source.id} ↗</a>{' '}</React.Fragment>)}</p>
 {compact ? <p>{t[s.frequency]}</p> : <p>{t[s.frequency]} · {t.units[s.units] || s.units} · {t[s.seasonalAdjustment === 'seasonally adjusted annual rate' ? 'saar' : s.seasonalAdjustment === 'seasonally adjusted' ? 'sa' : 'nsa']}<br />{t.latest}: {periodLabel(lastValue(s.observations)?.date || '—', s.frequency)} · {t.released}: {(s.inputSources || [s]).map(x => `${x.id}: ${x.sourceUpdatedAt}`).join(' / ')}<br />{t.retrieved}: {s.retrievedAt} · {t.coverage}: {periodLabel(s.observations[0].date,s.frequency)} – {periodLabel(s.observations.at(-1).date,s.frequency)}</p>}
 </div>
}
export function ProductivityChart({ s, language, primary = false, compact = false, fixedRange, fixedMode }) {
 const t = aiCopy[language], id = useId()
 const [mode, setMode] = useState('yoy'), [range, setRange] = useState('10'), [selected, setSelected] = useState(null)
 const displayMode = fixedMode || mode, displayRange = fixedRange || range
 const yoy = growth(s), full = displayMode === 'level' ? s.observations : displayMode === 'mean' ? movingMean(yoy) : growth(s, displayMode)
 const cutoff = displayRange === 'all' ? -Infinity : monthNumber(full.at(-1).date) - Number(displayRange)*12
 const points = full.filter(p => monthNumber(p.date) >= cutoff)
 const finite = points.filter(p => Number.isFinite(p.value)), allYoY = yoy.filter(p => Number.isFinite(p.value))
 const average = allYoY.reduce((n,p)=>n+p.value,0)/allYoY.length
 const showMean = primary && displayMode === 'yoy'
 const values = [...finite.map(p=>p.value), ...(showMean && Number.isFinite(average) ? [average] : [])]
 const low = Math.min(...values), high = Math.max(...values), padding = (high-low || 1)*.12
 const min = low-padding, max = high+padding
 const x = date => 90 + (monthNumber(date)-monthNumber(points[0].date))/Math.max(1,monthNumber(points.at(-1).date)-monthNumber(points[0].date))*524
 const y = value => 205-(value-min)/(max-min)*170
 let pen = false
 const path = points.map(p=>{if(!Number.isFinite(p.value)){pen=false;return ''}const command=pen?'L':'M';pen=true;return `${command}${x(p.date)},${y(p.value)}`}).join(' ')
 const inspected = points.find(p=>p.date===selected) || points.at(-1)
 function download(){const url=URL.createObjectURL(new Blob([productivityCsv(s,points,displayMode)],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`${s.id}-${displayMode}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 return <article className={`ai-chart${compact?' ai-chart-compact':''}`} data-series={s.id}>
 <h3>{t.names[s.id]}</h3><div className="ai-controls">
 {!fixedMode && <label>{t.metric}<select value={mode} onChange={e=>setMode(e.target.value)}><option value="yoy">{t.yoy}</option>{s.frequency==='quarterly'&&<option value="annualized">{t.annualized}</option>}<option value="level">{t.level}</option>{primary&&<option value="mean">{t.mean}</option>}</select></label>}
 {!fixedRange && <label>{t.range}<select value={range} onChange={e=>setRange(e.target.value)}>{['5','10','25','all'].map(v=><option key={v} value={v}>{v==='all'?t.full:`${v} ${language==='zh'?'年':'years'}`}</option>)}</select></label>}
 </div><p className="ai-measure">{t[displayMode]}{displayMode==='level'&&` · ${t.units[s.units]||s.units}`}</p>
 {finite.length ? <svg viewBox="0 0 640 245" role="img" aria-labelledby={id}><title id={id}>{`${t.names[s.id]} · ${t[displayMode]} · ${points[0].date} – ${points.at(-1).date}`}</title>{[0,.5,1].map(r=>{const value=min+(max-min)*r;return <g key={r}><line x1="90" x2="614" y1={y(value)} y2={y(value)} className="ai-gridline"/><text x="82" y={y(value)+4} textAnchor="end">{value.toLocaleString('en-US',{notation:'compact',maximumFractionDigits:1})}</text></g>})}{showMean&&<line x1="90" x2="614" y1={y(average)} y2={y(average)} className="ai-average"/>}<path d={path} className="ai-line"/>{Number.isFinite(inspected.value)&&<circle cx={x(inspected.date)} cy={y(inspected.value)} r="4" className="ai-point"/>}<text x="90" y="231">{periodLabel(points[0].date,s.frequency)}</text><text x="614" y="231" textAnchor="end">{periodLabel(points.at(-1).date,s.frequency)}</text></svg> : <p>{t.missing}</p>}
 {primary&&<p>{t.longMean}: <strong>{number(average)}%</strong>{showMean&&` · ${language==='zh'?'虚线':'dashed line'}`}<br />{t.averageNote}</p>}
 <label className="ai-inspect">{t.inspect}<select value={inspected.date} onChange={e=>setSelected(e.target.value)}>{[...points].reverse().map(p=><option key={p.date} value={p.date}>{periodLabel(p.date,s.frequency)} · {number(p.value)}{displayMode==='level'?'':'%'}</option>)}</select></label>
 <ProductivitySource s={s} language={language}/>
 <details><summary>{t.table} / {t.definition}</summary><p>{s.definition}</p><p>{t.license}: {s.license}</p><button type="button" onClick={download}>{t.csv}</button><div className="ai-table" role="region" aria-label={`${t.names[s.id]} ${t.table}`} tabIndex="0"><table><thead><tr><th>{t.inspect}</th><th>{t[displayMode]}</th><th>{t.raw}</th><th>{t.flag}</th></tr></thead><tbody>{[...points].reverse().map(p=>{const raw=s.observations.find(o=>o.date===p.date);return <tr key={p.date}><th scope="row">{periodLabel(p.date,s.frequency)}</th><td>{number(p.value)}</td><td>{number(raw?.value)}</td><td>{raw?.sourceFlag||'—'}</td></tr>})}</tbody></table></div></details>
 </article>
}
