export function readSaved(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}
export function writeSaved(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true } catch { return false }
}
export function cleanIds(ids, catalog, max = Infinity) {
  return Array.isArray(ids) ? [...new Set(ids.filter(id => typeof id === 'string' && catalog.some(s => s.id === id)))].slice(0, max) : []
}
export function workspaceState(hash, saved, catalog) {
  const query = new URLSearchParams(hash.split('?')[1])
  const ids = cleanIds(query.has('series') ? query.get('series').split(',') : saved?.ids, catalog, 3)
  const range = query.get('range') ?? saved?.range
  const explicitlyEmpty = query.get('series') === '' || (!query.has('series') && Array.isArray(saved?.ids) && !saved.ids.length)
  return { ids: ids.length || explicitlyEmpty ? ids : ['CPIAUCNS'], range: ['5', '10', '20', 'all'].includes(range) ? range : '10' }
}
export function workspaceHash(state) {
  return '#/research/data?' + new URLSearchParams({ series: state.ids.join(','), range: state.range }).toString()
}
export function inRange(points, range, anchor) {
  if (range === 'all') return points
  const end = anchor || points.at(-1)?.date
  if (!end) return []
  const start = String(Number(end.slice(0, 4)) - Number(range)) + end.slice(4)
  return points.filter(p => p.date >= start && p.date <= end)
}
// Exact-calendar YoY for monthly/quarterly observations; no nearest-date matching.
export function annualGrowth(series) {
  const byDate = new Map(series.observations.map(p => [p.date, p.value]))
  return series.observations.map(p => {
    const previous = byDate.get(String(Number(p.date.slice(0, 4)) - 1) + p.date.slice(4))
    return { ...p, value: Number.isFinite(p.value) && previous > 0 ? (p.value / previous - 1) * 100 : null }
  })
}
export function allowGrowth(s) {
  return ['monthly', 'quarterly'].includes(s.frequency) && !/percent|standard_deviation/i.test(s.units) && s.id !== 'GSCPI'
}
export function chartPath(points, x, y, frequency) {
  let active = false, previous = null
  return points.map(p => {
    const valid = Number.isFinite(p.value)
    const interval = previous ? (Number(p.date.slice(0, 4)) - Number(previous.slice(0, 4))) * 12 + Number(p.date.slice(5, 7) || 1) - Number(previous.slice(5, 7) || 1) : null
    const gap = frequency === 'monthly' ? interval > 1 : frequency === 'quarterly' ? interval > 3 : frequency.startsWith('annual') ? interval > 12 : previous && (Date.parse(p.date) - Date.parse(previous)) > 10 * 86400000
    const path = valid ? `${active && !gap ? 'L' : 'M'}${x(p.date).toFixed(2)},${y(p.value).toFixed(2)}` : ''
    active = valid; previous = p.date
    return path
  }).join(' ')
}
export function csvCell(value) {
  const text = String(value ?? '')
  return '"' + (/^[=+@\t\r]|^-[^\d.]/.test(text) ? "'" : '') + text.replaceAll('"', '""') + '"'
}
export function seriesCsv(series, points, measure) {
  return '\ufeff' + [['series', 'period', 'value', 'measure', 'original_units', 'frequency', 'seasonal_adjustment', 'status', 'proxy', 'source', 'source_updated', 'retrieved', 'license', 'source_flag'],
    ...points.map(p => [series.id, p.date, p.value, measure, series.units, series.frequency, series.seasonalAdjustment, series.status || 'published_observations_subject_to_revision', series.proxy ?? false, series.sourceUrl, series.sourceUpdatedAt, series.retrievedAt, series.license, p.sourceFlag])].map(row => row.map(csvCell).join(',')).join('\r\n')
}
export function downloadCsv(filename, csv) {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export function filteredRuns(runs, id, onlyChanges) {
  return runs.map(run => ({ ...run, changes: run.changes.filter(s => (!id || s.id === id) && (!onlyChanges || s.total > 0)) }))
    .filter(run => run.changes.length).sort((a, b) => b.checkedAt.localeCompare(a.checkedAt))
}
