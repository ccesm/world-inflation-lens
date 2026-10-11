import React, {useId} from 'react'
import {chartPath} from '../utils/workspace.js'
import {drawingFrequency} from '../data/ai-macro/contract.js'
import {macroCopy as c,text} from '../i18n/aiMacro.js'
// Calendar positioning and SVG scales only; values are copied from validated C2 fields.
export function AiMacroChart({points,frequency,unit,title,language}){
 const id=useId(), finite=points.filter(p=>Number.isFinite(p.value))
 if(!finite.length)return <p role="status">{text(c.empty,language)}</p>
 const start=Date.parse(points[0].date),end=Date.parse(points.at(-1).date)
 const values=finite.map(p=>p.value),lo=Math.min(...values),hi=Math.max(...values),span=hi-lo||1
 const x=date=>64+(Date.parse(date)-start)/(end-start||1)*616
 const y=value=>220-(value-lo)/span*178
 const path=chartPath(points,x,y,drawingFrequency(frequency))
 return <figure className="am-chart"><svg viewBox="0 0 720 270" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
 <title id={`${id}-title`}>{title}</title><desc id={`${id}-desc`}>{unit}. {points[0].date} — {points.at(-1).date}. {text(c.methodText,language)}</desc>
 {[lo,lo+span/2,hi].map((v,i)=><g key={i}><line x1="64" x2="680" y1={y(v)} y2={y(v)} className="am-grid"/><text x="58" y={y(v)+4} textAnchor="end">{new Intl.NumberFormat(language==='zh'?'zh-CN':'en-US',{maximumFractionDigits:2}).format(v)}</text></g>)}
 <path d={path} className="am-line"/>{finite.length===1&&<circle cx={x(finite[0].date)} cy={y(finite[0].value)} r="4" className="am-dot"/>}
 <text x="64" y="249">{points[0].date}</text><text x="680" y="249" textAnchor="end">{points.at(-1).date}</text>
 </svg><figcaption>{unit} · {text(c.frequencies[frequency],language)} · {text(c.table,language)}</figcaption></figure>
}
