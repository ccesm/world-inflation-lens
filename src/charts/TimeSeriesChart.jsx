import React, { useId, useState } from 'react'
import { formatNumber, monthNumber } from '../utils/inflation.js'

export function TimeSeriesChart({ points, field = 'value', language, labels, title, unit, startDate, highlight }) {
  const id = useId()
  const [selected, setSelected] = useState(points.length - 1)
  const current = points[Math.min(selected, points.length - 1)]
  const width = 1000, height = 335, left = 65, right = 20, top = 25, bottom = 38
  const minX = monthNumber(startDate || points[0].date)
  const maxX = monthNumber(points.at(-1).date)
  const values = points.map(point => point[field]).filter(value => value != null)
  const lo = Math.min(...values, ...(field === 'inflation' ? [0] : [])), hi = Math.max(...values)
  const step = 10 ** Math.floor(Math.log10(Math.max(hi - lo, 1))) / 2
  const minY = Math.floor(lo / step) * step, maxY = Math.ceil(hi / step) * step + step
  const x = date => left + (monthNumber(date) - minX) / (maxX - minX || 1) * (width - left - right)
  const y = value => top + (maxY - value) / (maxY - minY) * (height - top - bottom)
  let connected = false
  const path = points.map(point => {
    if (point[field] == null) { connected = false; return '' }
    const command = connected ? 'L' : 'M'
    connected = true
    return `${command}${x(point.date).toFixed(2)},${y(point[field]).toFixed(2)}`
  }).join(' ')
  const pick = event => {
    if (event.pointerType === 'touch') return
    const bounds = event.currentTarget.getBoundingClientRect()
    const scaled = (event.clientX - bounds.left) / bounds.width * width
    const month = minX + (scaled - left) / (width - left - right) * (maxX - minX)
    setSelected(Math.min(points.length - 1, Math.max(0, Math.round(month - monthNumber(points[0].date)))))
  }
  return <figure className="series-figure">
    <div className="series-heading"><span>{unit}</span><output aria-live="off">{current.date} <strong>{formatNumber(current[field], language)}{field === 'inflation' && current[field] != null ? '%' : ''}</strong></output></div>
    <svg className="series-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby={`${id}-title ${id}-desc`} onPointerMove={pick}>
      <title id={`${id}-title`}>{title}</title><desc id={`${id}-desc`}>{unit}. {points[0].date} — {points.at(-1).date}. {labels.chartHelp}</desc>
      {highlight && <rect className="era-band" x={Math.max(left, x(`${highlight.start}-01`))} y={top} width={Math.max(0, Math.min(width - right, x(`${highlight.end}-12`)) - Math.max(left, x(`${highlight.start}-01`)))} height={height - top - bottom} />}
      {[0, 1, 2, 3, 4].map(tick => {
        const value = minY + (maxY - minY) * tick / 4
        return <g key={tick}><line className="series-grid" x1={left} x2={width - right} y1={y(value)} y2={y(value)} /><text x={left - 12} y={y(value) + 5} textAnchor="end">{formatNumber(value, language, 1)}</text></g>
      })}
      {field === 'inflation' && <line className="series-zero" x1={left} x2={width - right} y1={y(0)} y2={y(0)} />}
      <path className="series-line" d={path} />
      {[0, .25, .5, .75, 1].map(fraction => {
        const month = Math.round(minX + (maxX - minX) * fraction)
        return <text key={fraction} x={left + fraction * (width - left - right)} y={height - 8} textAnchor={fraction === 0 ? 'start' : fraction === 1 ? 'end' : 'middle'}>{maxX - minX <= 24 ? `${Math.floor(month / 12)}-${String(month % 12 + 1).padStart(2, '0')}` : Math.floor(month / 12)}</text>
      })}
      <line className="series-cursor" x1={x(current.date)} x2={x(current.date)} y1={top} y2={height - bottom} />
      {current[field] != null && <circle className="series-point" cx={x(current.date)} cy={y(current[field])} r="5" />}
    </svg>
    <label className="chart-scrubber">{labels.dateSelect}<input type="range" min="0" max={points.length - 1} value={Math.min(selected, points.length - 1)} onChange={event => setSelected(Number(event.target.value))} aria-valuetext={`${current.date}: ${formatNumber(current[field], language)}${field === 'inflation' ? '%' : ''}`} /></label>
    <figcaption>{current[field] == null ? labels.noValue : labels.chartHelp}</figcaption>
  </figure>
}
