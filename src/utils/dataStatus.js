import { monthNumber } from './inflation.js'

export function observationStatus(points, frequency, now = new Date()) {
  const dates = points.filter(p => p.value !== null).map(p => p.date).sort()
  const latest = dates.at(-1) || null
  const age = latest === null ? Infinity : frequency === 'annual' ? now.getUTCFullYear() - Number(latest) : monthNumber(now.toISOString().slice(0, 7)) - monthNumber(latest)
  return { latest, missing: points.filter(p => p.value === null).length, total: points.length, old: age > 3 }
}

export function checkOverdue(checkedAt, now = new Date()) {
  return !checkedAt || now.getTime() - Date.parse(checkedAt) > 10 * 86400000
}
