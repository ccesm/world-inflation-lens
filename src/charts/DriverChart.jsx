import React, { useEffect, useId, useState } from 'react'
import { monthNumber, formatNumber } from '../utils/inflation.js'
import { monthlyPath } from '../utils/drivers.js'

export function DriverChart({ series, dates, selected, onSelect, title, unit, language, labels, episode }) {
  const uid = useId()
  const [compact, setCompact] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(max-width: 600px)')
    const update = () => setCompact(query.matches)
    update(); query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  const width = compact ? 440 : 1000, left = compact ? 64 : 76, right = width - 24
  const values = series.flatMap(s => s.points.filter(p => p.value != null).map(p => p.value))
  const lo = Math.min(0, ...values), hi = Math.max(0, ...values), padding = Math.max(1, (hi - lo) * .08)
  const min = lo - padding, max = hi + padding
  const first = monthNumber(dates[0]), last = monthNumber(dates.at(-1))
  const x = date => left + (monthNumber(date) - first) / (last - first || 1) * (right - left)
  const y = value => 24 + (max - value) / (max - min) * 245
  const bandStart = episode ? Math.max(first, monthNumber(episode.start)) : 0
  const bandEnd = episode ? Math.min(last, monthNumber(episode.end) + 1) : 0
  const pick = event => {
    if (event.pointerType === 'touch') return
    const bounds = event.currentTarget.getBoundingClientRect()
    const position = (event.clientX - bounds.left) / bounds.width * width
    onSelect(dates[Math.max(0, Math.min(dates.length - 1, Math.round((position - left) / (right - left) * (dates.length - 1))))])
  }
  return <figure className="driver-figure"><div className="driver-chart-title"><h3>{title}</h3><span>{unit}</span></div>
    <div className="driver-chart-legend">{series.map(s => <span key={s.id}><i style={{ background: s.color }} />{s.name}</span>)}</div>
    {values.length ? <svg className="driver-chart" viewBox={`0 0 ${width} 310`} role="img" aria-labelledby={`${uid}-title ${uid}-desc`} onPointerMove={pick}>
      <title id={`${uid}-title`}>{title}</title><desc id={`${uid}-desc`}>{unit}. {dates[0]}–{dates.at(-1)}. {labels.chartHelp}</desc>
      {episode && bandEnd > bandStart && <rect className="era-band" x={left + (bandStart - first) / (last - first) * (right - left)} y="24" width={(bandEnd - bandStart) / (last - first) * (right - left)} height="245" />}
      {[0, 1, 2, 3, 4].map(i => { const value = min + (max - min) * i / 4; return <g key={i}><line className="series-grid" x1={left} x2={right} y1={y(value)} y2={y(value)} /><text x={left - 12} y={y(value) + 4} textAnchor="end">{formatNumber(value, language, 1)}</text></g> })}
      <line className="series-zero" x1={left} x2={right} y1={y(0)} y2={y(0)} />
      {series.map((s, i) => { const point = s.points.find(p => p.date === selected); return <g key={s.id}><path className="driver-line" stroke={s.color} strokeDasharray={i ? '7 3' : undefined} d={monthlyPath(s.points, x, y)} />{point?.value != null && <circle cx={x(selected)} cy={y(point.value)} r="4" fill={s.color} />}</g> })}
      <line className="series-cursor" x1={x(selected)} x2={x(selected)} y1="24" y2="269" />
      {[...new Set([0, Math.floor((dates.length - 1) / 2), dates.length - 1])].map(i => <text key={i} x={x(dates[i])} y="299" textAnchor={i === 0 ? 'start' : i === dates.length - 1 ? 'end' : 'middle'}>{dates.length > 60 ? dates[i].slice(0, 4) : dates[i]}</text>)}
    </svg> : <div className="driver-empty" role="status">{labels.noWindow}</div>}
    <figcaption>{labels.chartHelp}</figcaption>
  </figure>
}
