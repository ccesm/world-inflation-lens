import React, { useEffect, useId, useState } from 'react'
import { getHistory, countryById } from '../data/globalInflation.js'
import { globalCopy } from '../i18n/global.js'
import { linePath } from '../utils/globalInflation.js'

export const seriesColors = ['#c0613c', '#3184a8', '#87902e', '#a668b0', '#3c9a79']
export const percent = (value, language) => value == null ? globalCopy[language].noData : `${new Intl.NumberFormat(language, { maximumFractionDigits: 2 }).format(value)}%`

export function AnnualComparison({ ids, start, end, language, title }) {
  const t = globalCopy[language], uid = useId()
  const [compact, setCompact] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(max-width: 600px)')
    const update = () => setCompact(query.matches)
    update(); query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  const [inspect, setInspect] = useState(end)
  const activeYear = Math.max(start, Math.min(inspect, end))
  const series = ids.map(id => ({ id, name: countryById[id].name[language], points: getHistory(id).filter(p => p.year >= start && p.year <= end) }))
  const values = series.flatMap(s => s.points.filter(p => p.value != null).map(p => p.value))
  const low = Math.min(0, ...values), high = Math.max(0, ...values)
  const padding = Math.max(1, (high - low) * .08)
  const min = low - padding, max = high + padding
  const width = compact ? 440 : 1000, left = compact ? 64 : 82, right = width - 28
  const x = year => left + (year - start) / (end - start || 1) * (right - left)
  const y = value => 24 + (max - value) / (max - min) * 270
  const chartYears = Array.from({ length: end - start + 1 }, (_, i) => start + i)
  return <figure className="annual-figure">
    <div className="annual-readout" aria-live="polite"><b>{activeYear}</b>{series.map((s, i) => <span key={s.id}><i style={{ background: seriesColors[i] }} />{s.name} <strong>{percent(s.points.find(p => p.year === activeYear)?.value, language)}</strong></span>)}</div>
    {values.length ? <svg className="annual-chart" viewBox={`0 0 ${width} 335`} role="img" aria-labelledby={`${uid}-title ${uid}-desc`}>
      <title id={`${uid}-title`}>{title}</title><desc id={`${uid}-desc`}>{start}–{end}. {t.chartHelp}</desc>
      {[0, 1, 2, 3, 4].map(n => { const value = min + (max - min) * n / 4; return <g key={n}><line className="series-grid" x1={left} x2={right} y1={y(value)} y2={y(value)} /><text x={left - 12} y={y(value) + 4} textAnchor="end">{new Intl.NumberFormat(language, { maximumFractionDigits: 1, notation: Math.abs(value) >= 10000 ? 'compact' : 'standard' }).format(value)}</text></g> })}
      <line className="series-zero" x1={left} x2={right} y1={y(0)} y2={y(0)} />
      {series.map((s, i) => <g key={s.id}><path className="annual-line" stroke={seriesColors[i]} strokeDasharray={['', '8 3', '3 3', '10 3 2 3', '1 3'][i]} d={linePath(s.points, x, y)} />{s.points.filter(p => p.value != null).map(p => <circle key={p.year} cx={x(p.year)} cy={y(p.value)} r={p.year === activeYear ? 4 : 1.8} fill={seriesColors[i]} />)}</g>)}
      <line className="series-cursor" x1={x(activeYear)} x2={x(activeYear)} y1="24" y2="294" />
      {[...new Set([start, Math.round((start + end) / 2), end])].map(year => <text key={year} x={x(year)} y="325" textAnchor="middle">{year}</text>)}
    </svg> : <p className="empty-state">{t.noHistory}</p>}
    <label className="chart-scrubber">{t.inspect}: {activeYear}<input type="range" min={start} max={end} value={activeYear} onChange={event => setInspect(Number(event.target.value))} /></label>
    <figcaption>{t.chartHelp}</figcaption>
    <details className="data-table"><summary>{t.table} · {start}–{end}</summary><div tabIndex="0" role="region" aria-label={t.table}><table><caption>{title} · {t.annual}</caption><thead><tr><th scope="col">{t.year}</th>{series.map(s => <th scope="col" key={s.id}>{s.name}</th>)}</tr></thead><tbody>{[...chartYears].reverse().map(year => <tr key={year}><th scope="row">{year}</th>{series.map(s => <td key={s.id}>{percent(s.points[year - start]?.value, language)}</td>)}</tr>)}</tbody></table></div></details>
  </figure>
}
