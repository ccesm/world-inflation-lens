import assert from 'node:assert/strict'

export function diffObservations(before, after) {
  const previous = new Map(before.map(p => [p.date, p.value]))
  const next = new Map(after.map(p => [p.date, p.value]))
  for (const date of previous.keys()) assert.ok(next.has(date), `Observation removed: ${date}`)
  const changes = []
  for (const [date, value] of next) {
    if (!previous.has(date)) {
      if (value !== null) changes.push({ date, kind: 'added', before: null, after: value })
    } else if (previous.get(date) !== value) {
      changes.push({ date, kind: previous.get(date) === null ? 'filled' : value === null ? 'withdrawn' : 'revised', before: previous.get(date), after: value })
    }
  }
  const priorCount = before.filter(p => p.value !== null).length
  const withdrawn = changes.filter(p => p.kind === 'withdrawn').length
  assert.ok(withdrawn <= Math.max(1, priorCount * .05), 'More than 5% of published observations withdrawn; manual review required')
  return changes
}

export function parseWorldBank(countryResponse, response, indicatorResponse, previous, countries, endYear, checkedAt) {
  for (const data of [countryResponse, response, indicatorResponse]) {
    assert.ok(Array.isArray(data?.[1]), 'Invalid World Bank response')
    assert.equal(Number(data[0].pages), 1, 'Incomplete World Bank pagination')
    assert.equal(Number(data[0].page), 1)
    assert.equal(data[1].length, Number(data[0].total))
  }
  const ids = countries.map(c => c.id).sort()
  assert.deepEqual(countryResponse[1].filter(c => c.region.id !== 'NA').map(c => c.id).sort(), ids, 'Country membership changed; review map joins manually')
  const { startYear, indicator } = previous.metadata
  assert.ok(endYear >= previous.metadata.endYear)
  const values = Object.fromEntries(ids.map(id => [id, Array(endYear - startYear + 1).fill(null)]))
  const seen = new Set()
  for (const row of response[1]) {
    if (!Object.hasOwn(values, row.countryiso3code)) continue
    assert.equal(row.indicator.id, indicator)
    const year = Number(row.date)
    assert.ok(Number.isInteger(year) && year >= startYear && year <= endYear)
    assert.ok(row.value === null || Number.isFinite(row.value))
    const key = `${row.countryiso3code}/${year}`
    assert.ok(!seen.has(key), `Duplicate World Bank observation: ${key}`)
    seen.add(key)
    values[row.countryiso3code][year - startYear] = row.value
  }
  assert.equal(seen.size, ids.length * (endYear - startYear + 1), 'Missing country-year slots')
  const definition = indicatorResponse[1].find(r => r.id === indicator)
  assert.ok(definition?.sourceNote && definition.sourceOrganization)
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(response[0].lastupdated))
  return { metadata: { ...previous.metadata, endYear, title: definition.name, definition: definition.sourceNote, originalSource: definition.sourceOrganization,
    retrievedAt: checkedAt.slice(0, 10), sourceUpdatedAt: response[0].lastupdated,
    apiUrl: `https://api.worldbank.org/v2/country/all/indicator/${indicator}?format=json&per_page=30000&date=${startYear}:${endYear}` }, values }
}

export function worldPoints(world) {
  return Object.entries(world.values).flatMap(([id, values]) => values.map((value, i) => ({ date: `${id}/${world.metadata.startYear + i}`, value })))
}

export function summarizeChanges(id, changes) {
  const counts = Object.fromEntries(['added', 'filled', 'revised', 'withdrawn'].map(kind => [kind, changes.filter(c => c.kind === kind).length]))
  return { id, ...counts, total: changes.length, examples: changes.slice(0, 20) }
}
