import React from 'react'
import { productivityDataset } from '../data/productivity.js'
import { aiCopy } from '../i18n/productivity.js'
import { observationStatus } from '../utils/dataStatus.js'
import { periodLabel } from '../utils/productivity.js'
export function ProductivityHealth({language,history}) {
 const t=aiCopy[language]
 return <><h2>{t.nav}</h2><p>{language==='zh'?'季度和月度系列按来源发布更新；每周检查不会生成新观测。修订数仅覆盖站点保留的最近30次检查，不代表来源全部历史修订。首次导入为基线。':'Quarterly and monthly series follow source releases; weekly checks do not generate observations. Revision counts cover the latest 30 retained site checks, not the entire source revision history. Initial import establishes a baseline.'}</p><div className="health-grid">{productivityDataset.series.map(s=>{const health=observationStatus(s.observations,s.frequency);const revisions=history.runs.reduce((sum,run)=>sum+(run.changes.find(c=>c.id===s.id)?.revised||0),0);return <article className="health-card" key={s.id}><a href={s.sourceUrl} target="_blank" rel="noreferrer">{s.id} ↗</a><h3>{t.names[s.id]}</h3><small>{s.publisher} · {t[s.frequency]}</small><p className={health.old?'health-old':''}>{health.old?t.old:t.observed}</p>{s.proxy&&<p>{t.proxy}</p>}<dl><dt>{t.latest}</dt><dd>{periodLabel(health.latest||'—',s.frequency)}</dd><dt>{t.released}</dt><dd>{s.sourceUpdatedAt}</dd><dt>{t.retrieved}</dt><dd>{s.retrievedAt}</dd><dt>{t.coverage}</dt><dd>{s.coverage.start} – {s.coverage.end}</dd><dt>{t.missingObservations}</dt><dd>{health.missing} / {health.total}</dd><dt>{t.revisions}</dt><dd>{revisions}</dd></dl></article>})}</div></>
}
