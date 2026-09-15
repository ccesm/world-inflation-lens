import React, { useEffect, useState } from 'react'
import snapshot from '../../data/fiscal/cbo-2026-02.json'
import { cboCopy } from '../i18n/cbo.js'
import { formatNumber } from '../utils/inflation.js'
import { cboCsv } from '../utils/cbo.js'

function CboChart({ rows, metric, selected, onSelect, t, language }) {
  const [compact, setCompact] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(max-width: 600px)')
    const update = () => setCompact(query.matches)
    update(); query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  const width = compact ? 440 : 1000, left = 60, right = width - 25, top = 42, bottom = 260
  const min = Math.min(0, ...rows.map(p => p[metric])), max = Math.max(1, ...rows.map(p => p[metric])) * 1.08
  const first = rows[0].year, last = rows.at(-1).year
  const x = year => left + (year - first) / (last - first) * (right - left)
  const y = value => bottom - (value - min) / (max - min) * (bottom - top)
  const path = status => rows.filter(p => p.status === status).map((p, i) => `${i ? 'L' : 'M'}${x(p.year)},${y(p[metric])}`).join(' ')
  const ticks = [...new Set([first, ...(first < 2026 ? [2026] : []), ...(compact ? [] : [2036, 2046]), last])]
  const row = rows.find(p => p.year === selected)
  return <svg className="cbo-chart" viewBox={`0 0 ${width} 305`} role="img" aria-label={`${t[metric]} · ${first}–${last} · ${t.reading}`} onPointerMove={event => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const year = Math.round(first + ((event.clientX - bounds.left) / bounds.width * width - left) / (right - left) * (last - first))
    onSelect(Math.max(first, Math.min(last, year)))
  }}>
    <rect x={x(Math.max(first, 2025.5))} y={top} width={right - x(Math.max(first, 2025.5))} height={bottom - top} fill="var(--global-accent)" opacity=".08" />
    {[0, 1, 2, 3, 4].map(i => { const value = min + (max - min) * i / 4; return <g key={i}><line x1={left} x2={right} y1={y(value)} y2={y(value)} stroke="var(--global-border)" /><text x={left - 10} y={y(value) + 5} textAnchor="end">{formatNumber(value, language, 1)}%</text></g> })}
    <path data-cbo-segment="actual" d={path('actual')} fill="none" stroke="var(--global-text)" strokeWidth="3" />
    <path data-cbo-segment="projected" d={path('projected')} fill="none" stroke="var(--global-accent)" strokeWidth="3" strokeDasharray="8 5" />
    {ticks.map(year => <text key={year} x={x(year)} y="287" textAnchor={year === first ? 'start' : year === last ? 'end' : 'middle'}>{year}</text>)}
    {row && <g><line x1={x(selected)} x2={x(selected)} y1={top} y2={bottom} stroke="var(--global-muted)" strokeDasharray="3 4" /><circle cx={x(selected)} cy={y(row[metric])} r="5" fill={row.status === 'actual' ? 'var(--global-text)' : 'var(--global-accent)'} /></g>}
  </svg>
}

export function CboOutlook({ language }) {
  const t = cboCopy[language], { metadata, observations } = snapshot
  const [metric, setMetric] = useState('debt'), [range, setRange] = useState('all'), [year, setYear] = useState(2056)
  const rows = observations.filter(p => p.year >= (range === 'recent' ? 2000 : range === 'future' ? 2026 : 1962))
  const selected = Math.max(rows[0].year, year), inspected = rows.find(p => p.year === selected)
  const download = () => {
    const url = URL.createObjectURL(new Blob([cboCsv(snapshot)], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a'); a.href = url; a.download = `CBO-fiscal-1962-2056-vintage-${metadata.vintage}.csv`; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return <section className="dollar-panel cbo-outlook" aria-labelledby="cbo-title">
    <p className="eyebrow">CBO / {metadata.vintage}</p><h2 id="cbo-title">{t.title}</h2><p>{t.intro}</p>
    <p className="global-help">{t.vintage}: {metadata.projectionPublishedAt} · {t.retrieved}: {metadata.retrievedAt}</p>
    <div className="dollar-presets" role="group" aria-label={t.metric}>{['debt', 'deficit', 'interest'].map(id => <button key={id} aria-pressed={metric === id} onClick={() => setMetric(id)}>{t[id]}</button>)}</div>
    <div className="dollar-grid cbo-milestones">{[2025, 2026, 2036, 2056].map(year => { const row = observations.find(p => p.year === year); return <article key={year}><p>{year} · {t[row.status]}</p><strong>{formatNumber(row[metric], language, 1)}%</strong><p>{t[metric]}</p></article> })}</div>
    <div className="dollar-presets" role="group" aria-label={t.range}>{['all', 'recent', 'future'].map(id => <button key={id} aria-pressed={range === id} onClick={() => setRange(id)}>{t[id]}</button>)}</div>
    <div className="cbo-legend"><span><i />{t.actual}</span><span><i />{t.projected}</span></div>
    <CboChart rows={rows} metric={metric} selected={selected} onSelect={setYear} t={t} language={language} />
    <label>{t.inspect}: {selected} · {t[inspected.status]} · <strong>{formatNumber(inspected[metric], language, 2)}% GDP</strong><input type="range" min={rows[0].year} max="2056" step="1" value={selected} onChange={event => setYear(Number(event.target.value))} /></label>
    <p className="global-help">{t.reading}</p>
    <details className="data-table"><summary>{t.table}</summary><div tabIndex="0" role="region" aria-label={t.table}><table><thead><tr>{[t.year, t.status, t.debt, t.deficit, t.interest].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.year}><th scope="row">{row.year}</th><td>{t[row.status]}</td>{['debt', 'deficit', 'interest'].map(id => <td key={id}>{formatNumber(row[id], language, 3)}%</td>)}</tr>)}</tbody></table></div></details>
    <button className="global-button secondary" onClick={download}>{t.download} ↓</button>
    <div className="cbo-assumptions"><h3>{t.assumptions}</h3><p>{t.policy}</p><p>{t.cutoff}</p><p>{t.definitions}</p><p>{t.note}</p></div>
    <details><summary>{t.sources}</summary><p>{t.pinned}</p><div className="dollar-links">{[[t.report, metadata.projectionSource], [t.workbook, metadata.originalWorkbook], [t.historicalFile, metadata.historicalCsv], [t.projectedFile, metadata.projectionCsv]].map(([label, url]) => <a key={label} href={url} target="_blank" rel="noreferrer">{label} ↗</a>)}</div></details>
  </section>
}
