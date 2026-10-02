// Inputs are validated daily percentage-yield observations. The derived result is
// a percentage-point spread, not a fitted expectation or a new raw data series.
function observationMap(observations, name) {
  if (!Array.isArray(observations)) throw new TypeError(`${name} observations must be an array`)
  const values = new Map()
  for (const point of observations) {
    const date = point?.date
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(`${date}T00:00:00Z`)) || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) {
      throw new TypeError(`${name} observations require valid daily dates`)
    }
    if (values.has(date)) throw new Error(`Duplicate ${name} observation date: ${date}`)
    values.set(date, Number.isFinite(point.value) ? point.value : null)
  }
  return values
}

export function derive10YBreakeven(nominalObservations, realObservations) {
  const nominal = observationMap(nominalObservations, 'nominal')
  const real = observationMap(realObservations, 'real')
  const dates = [...new Set([...nominal.keys(), ...real.keys()])].sort()
  const points = dates.map(date => {
    const nominalValue = nominal.get(date) ?? null
    const realValue = real.get(date) ?? null
    return { date, nominal: nominalValue, real: realValue, value: nominalValue !== null && realValue !== null ? nominalValue - realValue : null }
  })
  const latest = points.findLast(point => Number.isFinite(point.value)) || null
  const latestNominalDate = points.findLast(point => point.nominal !== null)?.date || null
  const latestRealDate = points.findLast(point => point.real !== null)?.date || null
  const latestCommonDate = latest?.date || null
  return {
    points, latest, latestCommonDate, latestNominalDate, latestRealDate,
    hasMismatchedLatestDates: latestNominalDate !== latestRealDate,
    latestIsOlderThanInputs: latestCommonDate !== null && (latestNominalDate > latestCommonDate || latestRealDate > latestCommonDate),
    missingDates: points.filter(point => point.value === null).map(point => point.date),
  }
}
