import { monthNumber } from './inflation.js'

export const latestPoint = s => s?.points.findLast(p => Number.isFinite(p.value)) || null
export function periodBefore(date, n, frequency = 'monthly') {
  if (frequency.startsWith('annual')) return String(Number(date) - n)
  const m = monthNumber(date) - n
  return `${Math.floor(m / 12)}-${String(m % 12 + 1).padStart(2, '0')}`
}
export function changeAt(series, date, periods = 1, percent = false) {
  const now = series.points.find(p => p.date === date)?.value
  const beforeDate = periodBefore(date, periods, series.frequency)
  const before = series.points.find(p => p.date === beforeDate)?.value
  if (!Number.isFinite(now) || !Number.isFinite(before) || (percent && before <= 0)) return null
  return percent ? (now / before - 1) * 100 : now - before
}
export function direction(series) {
  const latest = latestPoint(series), delta = latest && changeAt(series, latest.date)
  return { latest, delta, label: delta === null ? 'unavailable' : Math.abs(delta) < 1e-9 ? 'stable' : delta > 0 ? 'rising' : 'falling' }
}
export function assessment(series, now = new Date()) {
  const required = ['GPR', 'GSCPI', 'oil', 'FAO_FOOD']
  // Latest common month only, never forward-fill a stale component.
  const dates = series.GPR.points.filter(p => p.value !== null).map(p => p.date).reverse()
  const date = dates.find(d => required.every(id => series[id].points.some(p => p.date === d && Number.isFinite(p.value))))
  if (!date || monthNumber(now.toISOString().slice(0, 7)) - monthNumber(date) > 3) return { code: 'insufficient', date: date || null, evidence: [] }
  const evidence = required.map(id => ({ id, date, value: series[id].points.find(p => p.date === date).value, change: changeAt(series[id], date) }))
  if (evidence.some(e => e.change === null)) return { code: 'insufficient', date, evidence }
  const changes = Object.fromEntries(evidence.map(e => [e.id, e.change]))
  return { date, evidence, code: changes.GSCPI > 0 && changes.oil > 0 && changes.FAO_FOOD > 0 ? 'broad' : changes.oil > 0 && changes.FAO_FOOD > 0 ? 'prices' : 'mixed' }
}
export const transmissionWindows = [
  { id: '1973', from: '1972-01', to: '1976-12' }, { id: '1990', from: '1989-01', to: '1992-12' },
  { id: '2008', from: '2006-01', to: '2010-12' }, { id: '2020', from: '2019-01', to: '2022-12' },
  { id: '2022', from: '2021-01', to: '2024-12' },
]
export function windowPoints(series, from, to) {
  // Explicit common grid; null outside coverage. No interpolation or artificial annual/monthly conversion.
  const annual = series.frequency.startsWith('annual'), points = new Map(series.points.map(p => [p.date, p.value]))
  const a = annual ? Number(from) : monthNumber(from), b = annual ? Number(to) : monthNumber(to)
  return Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => {
    const n = a + i, date = annual ? String(n) : `${Math.floor(n / 12)}-${String(n % 12 + 1).padStart(2, '0')}`
    return { date, value: points.get(date) ?? null }
  })
}

export function transmissionCsv(s, points = s.points) {
  const cell = value => `"${String(value ?? '').replaceAll('"', '""')}"`
  return '\ufeff' + [['series', 'date', 'value', 'units', 'frequency', 'period_basis', 'status', 'source', 'source_update', 'retrieved', 'attribution'], ...points.map(p => [s.id, p.date, p.value, s.units, s.frequency, s.periodBasis || 'month', s.metadata.status, s.metadata.sourceUrl, s.metadata.sourceUpdatedAt, s.metadata.retrievedAt, s.metadata.attribution])].map(r => r.map(cell).join(',')).join('\r\n')
}
