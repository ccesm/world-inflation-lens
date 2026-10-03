import React, { useEffect, useId, useRef, useState } from 'react'
import { internationalById } from '../data/internationalDollar.js'
import { internationalCopy } from '../i18n/internationalDollar.js'
import { internationalPeriod, internationalCsv, internationalUnits } from '../utils/internationalDollar.js'
import { chartPath, downloadCsv } from '../utils/workspace.js'
import { SeriesStatusNote } from './SystemStatus.jsx'
export function InternationalChart({ids,language}) {
 const t=internationalCopy[language], uid=useId(),[id,setId]=useState(ids[0]),[range,setRange]=useState('all'),[period,setPeriod]=useState(''),[rows,setRows]=useState(24)
 const chartRef=useRef(null),[width,setWidth]=useState(570)
 useEffect(()=>{const observer=new ResizeObserver(entries=>setWidth(Math.max(180,Math.min(570,entries[0].contentRect.width))));observer.observe(chartRef.current);return()=>observer.disconnect()},[])
 const right=width-16,left=60
 const s=internationalById[id],name=s.contract.title[language],label=date=>internationalPeriod(date,s.frequency)
 const end=s.observations.at(-1).date,start=range==='all'?s.observations[0].date:String(Number(end.slice(0,4))-Number(range))+end.slice(4)
 const points=s.observations.filter(p=>p.date>=start),available=points.filter(p=>Number.isFinite(p.value)),selected=points.find(p=>p.date===period)||available.at(-1)||points.at(-1)
 const units=internationalUnits(s,language)
 const percent=id.startsWith('COFER_'),max=percent?100:Math.max(1,...available.map(p=>p.value))*1.08
 const numeric=date=>Date.parse(date+'-01'),x=date=>left+(numeric(date)-numeric(start))/(numeric(end)-numeric(start)||1)*(right-left),y=value=>208-value/max*180
 const format=v=>Number.isFinite(v)?v.toLocaleString(language,{maximumFractionDigits:percent?2:3}):'—'
 const delta=available.length>1?available.at(-1).value-available[0].value:null
 return <article className="intl-chart" data-international-series={id}>
  <div className="intl-controls"><label>{t.series}<select value={id} onChange={e=>{setId(e.target.value);setPeriod('')}}>{ids.map(key=><option value={key} key={key}>{internationalById[key].contract.title[language]}</option>)}</select></label><label>{t.range}<select value={range} onChange={e=>{setRange(e.target.value);setPeriod('')}}>{['all','5','10','20'].map(v=><option key={v} value={v}>{v==='all'?t.all:`${v} ${t.years}`}</option>)}</select></label></div>
  <h3 id={uid}>{name}</h3><p className="intl-readout"><strong>{format(selected?.value)}</strong> {units} <span>{selected&&label(selected.date)}</span></p>
  <svg ref={chartRef} viewBox={`0 0 ${width} 245`} role="img" aria-labelledby={uid}><title>{`${name} · ${units} · ${label(start)}—${label(end)}`}</title>{[0,max/2,max].map(v=><g key={v}><line x1={left} x2={right} y1={y(v)} y2={y(v)} stroke="var(--global-border)"/><text x={left-6} y={y(v)+4} textAnchor="end">{v.toLocaleString(language,{notation:'compact',maximumFractionDigits:1})}</text></g>)}<path d={chartPath(points,x,y,s.frequency)} fill="none" stroke="var(--global-accent)" strokeWidth="2.5"/>{Number.isFinite(selected?.value)&&<circle cx={x(selected.date)} cy={y(selected.value)} r="4" fill="var(--global-accent)"/>}<text x={left} y="238">{label(start)}</text><text x={right} y="238" textAnchor="end">{label(end)}</text></svg>
  <p className="global-help">{t.zero}</p><label>{t.inspect}<select value={selected?.date||''} onChange={e=>setPeriod(e.target.value)}>{[...points].reverse().map(p=><option value={p.date} key={p.date}>{label(p.date)} · {format(p.value)}</option>)}</select></label>
  <p>{t.change}: <strong>{format(delta)}</strong> {percent?(language==='zh'?'百分点':'percentage points'):units}{available.length>1&&` · ${label(available[0].date)} → ${label(available.at(-1).date)}`}</p><p className="global-help">{t.changeNote}</p>
  <SeriesStatusNote source={s} language={language}/><details><summary>{t.definition}</summary><p>{s.definition}</p><p>{t.denominator}: {s.denominator}</p><p>{s.attribution}</p><p>{s.license}</p><p>{t.updated}: {s.sourceUpdatedAt||t.unknown}<br/>{t.released}: {s.sourceReleasedAt||t.unknown}<br/>{t.retrieved}: {s.retrievedAt}</p></details>
  <div className="intl-actions"><a href={s.sourceUrl} target="_blank" rel="noreferrer">{s.publisher||s.provider} ↗</a><a href={`#/research/data?series=${id}&range=${range}`}>{t.workspace} →</a><button className="global-button" onClick={()=>downloadCsv(`${id}.csv`,internationalCsv(s,points))}>{t.csv}</button></div>
  <details className="data-table"><summary>{t.table} · {points.length}</summary><div role="region" aria-label={`${name} ${t.table}`} tabIndex="0"><table><thead><tr><th>{t.period}</th><th>{t.value} · {units}</th><th>{t.flag}</th></tr></thead><tbody>{[...points].reverse().slice(0,rows).map(p=><tr key={p.date}><th scope="row">{label(p.date)}</th><td>{format(p.value)}</td><td>{p.sourceFlag||'—'}</td></tr>)}</tbody></table></div>{rows<points.length&&<button className="global-button secondary" onClick={()=>setRows(points.length)}>{t.all}</button>}</details>
 </article>
}
