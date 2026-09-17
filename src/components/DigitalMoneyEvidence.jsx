import React, { useId, useState } from 'react'
import { digitalCopy } from '../i18n/digitalMoney.js'
import { digitalBank, digitalPublications } from '../data/digitalMoney.js'
import { bankGrowth, bankCsv, digitalCsv } from '../utils/digitalMoney.js'
import { monthNumber } from '../utils/inflation.js'
import { observationStatus } from '../utils/dataStatus.js'
const fmt=value=>Number.isFinite(value)?value.toLocaleString('en-US',{maximumFractionDigits:2}):'—'
function download(csv,name){const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
export function DigitalFact({record,language}) {
 const t=digitalCopy[language]
 return <article className="dm-fact" data-digital-fact={record.id}><p className="eyebrow">{t.publicationFrequency}</p><h3>{t.names[record.id]}</h3><strong className="dm-value">{t.qualifiers[record.qualifier]} {fmt(record.value)}</strong><p>{t.units[record.units]}</p><dl><dt>{t.observation}</dt><dd>{record.observationDate||t.unknown}</dd><dt>{t.published}</dt><dd>{record.sourceUpdatedAt}</dd></dl><a className="dm-source" href={record.sourceUrl} target="_blank" rel="noreferrer">{record.provider} ↗</a><details><summary>{t.table}</summary><p>{t.definition}: {record.definition}</p><p>{t.underlying}: {record.underlyingProvider}</p><p>{t.retrieved}: {record.retrievedAt}</p><p>{t.license}: {record.license}</p><button onClick={()=>download(digitalCsv([record]),`${record.id}.csv`)}>{t.csv}</button></details></article>
}
export function BankDepositsChart({language}) {
 const t=digitalCopy[language],s=digitalBank,id=useId()
 const [mode,setMode]=useState('level'),[range,setRange]=useState('10'),[selection,setSelection]=useState(null)
 const full=mode==='level'?s.observations:bankGrowth(s)
 const cutoff=range==='all'?-Infinity:monthNumber(full.at(-1).date)-Number(range)*12
 const points=full.filter(p=>monthNumber(p.date)>=cutoff),finite=points.filter(p=>Number.isFinite(p.value))
 const lo=Math.min(...finite.map(p=>p.value)),hi=Math.max(...finite.map(p=>p.value)),pad=(hi-lo||1)*.1
 const x=date=>90+(monthNumber(date)-monthNumber(points[0].date))/Math.max(1,monthNumber(points.at(-1).date)-monthNumber(points[0].date))*524
 const y=v=>205-(v-lo+pad)/(hi-lo+2*pad)*170
 let pen=false
 const path=points.map(p=>{if(!Number.isFinite(p.value)){pen=false;return ''}const move=pen?'L':'M';pen=true;return `${move}${x(p.date)},${y(p.value)}`}).join(' ')
 const selected=points.find(p=>p.date===selection)||points.at(-1)
 return <article className="dm-bank" data-bank-series={s.id}><h3>{t.bankTitle}</h3><p>{t.context}</p><div className="dm-controls"><label>{t.measure}<select value={mode} onChange={e=>setMode(e.target.value)}><option value="level">{t.level}</option><option value="yoy">{t.yoy}</option></select></label><label>{t.range}<select value={range} onChange={e=>setRange(e.target.value)}>{['5','10','all'].map(v=><option key={v} value={v}>{v==='all'?t.full:`${v} ${t.years}`}</option>)}</select></label></div><p>{t[mode]}</p>
 <svg viewBox="0 0 640 245" role="img" aria-labelledby={id}><title id={id}>{`${t.bankTitle} · ${t[mode]} · ${points[0].date} – ${points.at(-1).date}`}</title>{[lo, (lo+hi)/2, hi].map((v,i)=><g key={i}><line x1="90" x2="614" y1={y(v)} y2={y(v)} className="dm-gridline"/><text x="82" y={y(v)+5} textAnchor="end">{v.toLocaleString('en-US',{notation:'compact',maximumFractionDigits:1})}</text></g>)}<path d={path} className="dm-line"/>{Number.isFinite(selected.value)&&<circle cx={x(selected.date)} cy={y(selected.value)} r="4" className="dm-point"/>}<text x="90" y="235">{points[0].date}</text><text x="614" y="235" textAnchor="end">{points.at(-1).date}</text></svg>
 <label>{t.period}<select value={selected.date} onChange={e=>setSelection(e.target.value)}>{[...points].reverse().map(p=><option key={p.date} value={p.date}>{p.date} · {fmt(p.value)}{mode==='yoy'?'%':''}</option>)}</select></label>
 <p className="dm-source"><a href={s.sourceUrl} target="_blank" rel="noreferrer">{s.publisher} / FRED · {s.id} ↗</a><br/>{t.bankNote}<br/>{t.latest}: {s.observations.findLast(p=>Number.isFinite(p.value))?.date} · {t.published}: {s.sourceUpdatedAt} · {t.retrieved}: {s.retrievedAt}<br/>{language==='zh'?'历史观测，可修订':'Historical observations, subject to revision'}</p>
 <details><summary>{t.table}</summary><p>{s.definition}</p><p>{t.license}: {s.license}</p><button onClick={()=>download(bankCsv(s,points,mode),`${s.id}-${mode}.csv`)}>{t.csv}</button><div className="dm-table" role="region" aria-label={t.bankTitle} tabIndex="0"><table><thead><tr><th>{t.period}</th><th>{t[mode]}</th></tr></thead><tbody>{[...points].reverse().map(p=><tr key={p.date}><th scope="row">{p.date}</th><td>{fmt(p.value)}</td></tr>)}</tbody></table></div></details></article>
}
export function DigitalMoneyHealth({language,history}) {
 const t=digitalCopy[language],s=digitalBank,health=observationStatus(s.observations,s.frequency)
 return <><h2>{t.nav}</h2><p>{t.healthNote}</p><div className="health-grid">{digitalPublications.map(r=><article className="health-card" key={r.id}><h3>{t.names[r.id]}</h3><a href={r.sourceUrl} target="_blank" rel="noreferrer">{r.provider} ↗</a><p>{t.publicationFrequency}</p><dl><dt>{t.observation}</dt><dd>{r.observationDate||t.unknown}</dd><dt>{t.published}</dt><dd>{r.sourceUpdatedAt}</dd><dt>{t.reviewed}</dt><dd>{r.reviewedAt}</dd><dt>{t.retrieved}</dt><dd>{r.retrievedAt}</dd></dl></article>)}<article className="health-card"><h3>{t.bankTitle}</h3><a href={s.sourceUrl}>Federal Reserve / FRED · {s.id}</a><p>{t.context}</p><p>{language==='zh'?'月度 · 季调后':'Monthly · seasonally adjusted'}{health.old&&` · ${language==='zh'?'观测较旧':'Older observation'}`}</p><dl><dt>{t.latest}</dt><dd>{health.latest}</dd><dt>{t.published}</dt><dd>{s.sourceUpdatedAt}</dd><dt>{t.retrieved}</dt><dd>{s.retrievedAt}</dd><dt>{t.coverage}</dt><dd>{s.coverage.start} – {s.coverage.end}</dd><dt>{t.missing}</dt><dd>{health.missing} / {health.total}</dd><dt>{t.revisions}</dt><dd>{history.runs.reduce((n,r)=>n+(r.changes.find(c=>c.id===s.id)?.revised||0),0)}</dd></dl></article></div></>
}
