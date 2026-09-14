export function valueAt(values, id, year, startYear) {
  return values[id]?.[year - startYear] ?? null
}

export function rowsAt(countries, values, year, startYear) {
  return countries.map(country => ({ ...country, value: valueAt(values, country.id, year, startYear) }))
}

export function rankRows(rows) {
  return rows.filter(row => row.value != null).sort((a, b) => b.value - a.value || a.id.localeCompare(b.id))
}

// Use the latest year with at least 95% of the best coverage in the last five years.
export function chooseDefaultYear(coverage, endYear) {
  const recent = coverage.filter(row => row.year > endYear - 5)
  const threshold = Math.max(...recent.map(row => row.count)) * .95
  return recent.filter(row => row.count >= threshold).at(-1)?.year ?? endYear
}

export function bucketIndex(value) {
  if (value == null) return 6
  if (value < 0) return 0
  if (value < 2) return 1
  if (value < 4) return 2
  if (value < 8) return 3
  if (value < 20) return 4
  return 5
}

export function linePath(points, x, y) {
  let connected = false
  return points.map(point => {
    if (point.value == null) { connected = false; return '' }
    const command = connected ? 'L' : 'M'
    connected = true
    return `${command}${x(point.year).toFixed(2)},${y(point.value).toFixed(2)}`
  }).join(' ')
}
