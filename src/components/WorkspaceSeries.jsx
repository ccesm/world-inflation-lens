import React, { useId, useState } from 'react'
import { seriesName } from '../data/catalog.js'
import { workspaceCopy } from '../i18n/workspace.js'
import { annualGrowth, allowGrowth, inRange, chartPath, seriesCsv, downloadCsv } from '../utils/workspace.js'

export function WorkspaceSeries({ series: s, language, range, anchor, startDate, onRemove }) {
  const t = workspaceCopy[language], titleId = useId()
  const [measure, setMeasure] = useState('level'), [period, setPeriod] = useState(''), [rows, setRows] = useState(24)
  const points = inRange(measure === 'yoy' ? annualGrowth(s) : s.observations, range, anchor)
  const available = points.filter(p => Number.isFinite(p.value))
  const latest = s.observations.findLast(p => Number.isFinite(p.value))
  const chosen = points.find(p => p.date === period) || available.at(-1) || points.at(-1)
  const units = measure === 'yoy' ? t.yoy : s.units
  const dateNumber = date => Date.parse(date.length === 4 ? date + '-01-01' : date.length === 7 ? date + '-01' : date)
  const start = dateNumber(startDate || '2000'), end = dateNumber(anchor || '2001')
  const values = available.map(p => p.value), min = values.length ? Math.min(...values) : 0, max = values.length ? Math.max(...values) : 1
  const pad = Math.max((max - min) * 0.08, Math.abs(max) * 0.01, 0.01)
  const x = date => 95 + (dateNumber(date) - start) / (end - start || 1) * 440
  const y = value => 200 - (value - min + pad) / (max - min + 2 * pad) * 170
  const format = value => Number.isFinite(value) ? value.toLocaleString(language, { maximumFractionDigits: 3 }) : '—'
  return <article className="workspace-panel" aria-labelledby={titleId} data-workspace-series={s.id}>
    <div className="workspace-heading"><div><small>{s.id} · {t.frequencies[s.frequency] || s.frequency}</small><h3 id={titleId}>{seriesName(s, language)}</h3></div><button className="global-button secondary" onClick={onRemove} aria-label={`${t.remove} ${s.id}`}>{t.remove}</button></div>
    <p className="workspace-status">{t.observed}{s.proxy ? ` · ${t.proxy}` : ''}</p>
    <label>{t.measure}<select value={measure} onChange={e => { setMeasure(e.target.value); setPeriod('') }}><option value="level">{t.level}</option>{allowGrowth(s) && <option value="yoy">{t.yoy}</option>}</select></label>
    <p className="workspace-units">{t.units}: {units}</p>
    {available.length ? <svg className="workspace-chart" viewBox="0 0 570 240" role="img" aria-label={`${seriesName(s, language)} · ${units}`}>
      {[min, (min + max) / 2, max].map((value, i) => <g key={i}><line x1="95" x2="535" y1={y(value)} y2={y(value)} className="workspace-gridline" /><text x="89" y={y(value) + 4} textAnchor="end">{value.toLocaleString(language, { notation: 'compact', maximumFractionDigits: 1 })}</text></g>)}
      <path d={chartPath(points, x, y, s.frequency)} className="workspace-line" />
      {chosen && Number.isFinite(chosen.value) && <circle cx={x(chosen.date)} cy={y(chosen.value)} r="4" className="workspace-dot" />}
      <text x="95" y="229">{startDate}</text><text x="535" y="229" textAnchor="end">{anchor}</text>
    </svg> : <p role="status">{t.noPoints}</p>}
    <label>{t.inspect}<select value={chosen?.date || ''} disabled={!points.length} onChange={e => setPeriod(e.target.value)}>{[...points].reverse().map(p => <option key={p.date} value={p.date}>{p.date} · {format(p.value)}</option>)}</select></label>
    <dl className="workspace-meta"><dt>{t.latest}</dt><dd>{latest?.date || '—'} · {format(latest?.value)} ({s.units})</dd><dt>{t.coverage}</dt><dd>{s.observations[0]?.date} — {s.observations.at(-1)?.date}</dd><dt>{t.adjustment}</dt><dd>{s.seasonalAdjustment}</dd><dt>{t.updated}</dt><dd>{s.sourceUpdatedAt || t.unavailable}</dd><dt>{t.retrieved}</dt><dd>{s.retrievedAt || t.unavailable}</dd><dt>{t.missing}</dt><dd>{s.observations.filter(p => !Number.isFinite(p.value)).length} / {s.observations.length}</dd></dl>
    <p>{s.id.startsWith('SIPRI') ? t.manual : t.automatic}</p>
    <div className="workspace-actions"><a href={s.sourceUrl} target="_blank" rel="noreferrer">{s.publisher || s.provider} ↗</a>{s.downloadUrl && <a href={s.downloadUrl} target="_blank" rel="noreferrer">{t.downloadSource} ↗</a>}<a href={s.tool}>{t.tool} →</a><button className="global-button" onClick={() => downloadCsv(`${s.id}-${measure}.csv`, seriesCsv(s, points, measure))}>{t.csv}</button></div>
    <details><summary>{t.definition}</summary><p>{s.definition || s.title}</p><p>{s.attribution}</p><p>{s.license}</p>{s.methodologyUrl && <a href={s.methodologyUrl} target="_blank" rel="noreferrer">{t.definition} ↗</a>}</details>
    <details className="data-table"><summary>{t.table} ({points.length})</summary><div role="region" aria-label={`${s.id} ${t.table}`} tabIndex="0"><table><thead><tr><th>{t.period}</th><th>{t.value} · {units}</th><th>{t.flag}</th></tr></thead><tbody>{[...points].reverse().slice(0, rows).map(p => <tr key={p.date}><th scope="row">{p.date}</th><td>{format(p.value)}</td><td>{p.sourceFlag || '—'}</td></tr>)}</tbody></table></div>{rows < points.length && <button className="global-button secondary" onClick={() => setRows(rows + 100)}>{t.more}</button>}</details>
  </article>
}
