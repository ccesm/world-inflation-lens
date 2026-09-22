import { monthNumber } from './inflation.js'

export function observationStatus(points, frequency, now = new Date()) {
  const dates = points.filter(p => p.value !== null).map(p => p.date).sort()
  const latest = dates.at(-1) || null
  const age = latest === null ? Infinity : frequency.startsWith('annual') ? now.getUTCFullYear() - Number(latest.slice(0, 4)) : ['monthly','quarterly'].includes(frequency) ? monthNumber(now.toISOString().slice(0, 7)) - monthNumber(latest) : (now.getTime() - Date.parse(latest)) / 86400000
  const threshold = frequency === 'quarterly' ? 8 : frequency === 'daily' || frequency.startsWith('weekly') ? 14 : 3
  return { latest: frequency.startsWith('annual') ? latest?.slice(0, 4) || null : latest, missing: points.filter(p => p.value === null).length, total: points.length, old: age > threshold }
}

export function checkOverdue(checkedAt, now = new Date()) {
  const time = Date.parse(checkedAt)
  return !Number.isFinite(time) || time > now.getTime() || now.getTime() - time > 2 * 86400000
}
