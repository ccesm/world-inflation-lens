import { monthNumber } from './inflation.js'

export function monthDate(index) {
  return `${Math.floor(index / 12)}-${String(index % 12 + 1).padStart(2, '0')}`
}

export function monthsBetween(start, end) {
  if (start > end) return []
  return Array.from({ length: monthNumber(end) - monthNumber(start) + 1 }, (_, index) => monthDate(monthNumber(start) + index))
}

export function alignMonthly(series, dates) {
  return series.map(item => {
    const lookup = new Map(item.points.map(p => [p.date, p.value]))
    return { ...item, points: dates.map(date => ({ date, value: lookup.get(date) ?? null })) }
  })
}

export function monthlyPath(points, x, y) {
  let connected = false
  return points.map(point => {
    if (point.value == null) { connected = false; return '' }
    const command = connected ? 'L' : 'M'
    connected = true
    return `${command}${x(point.date).toFixed(2)},${y(point.value).toFixed(2)}`
  }).join(' ')
}

export function monthlyCsv(series, dates) {
  const aligned = alignMonthly(series, dates)
  return [['month', ...aligned.map(s => `${s.id}_${s.measure}`)], ...dates.map((date, i) => [date, ...aligned.map(s => s.points[i].value ?? '')])].map(row => row.join(',')).join('\r\n')
}
