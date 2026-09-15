import assert from 'node:assert/strict'
import { monthNumber } from '../../src/utils/inflation.js'

// Parse only published table cells and FRED's text-only overflow rows, never scripts.
export function parseFredTable(html, expectedId, expected = {}) {
  const field = label => {
    const match = html.match(new RegExp(`<th[^>]*>${label}</th>\\s*<td[^>]*>([^<]*)</td>`))
    assert.ok(match, `Missing metadata field: ${label}`)
    return match[1].trim()
  }
  assert.equal(field('Series ID'), expectedId)
  const frequency = expected.frequency || 'Monthly'
  assert.equal(field('Frequency'), frequency)
  assert.equal(field('Seasonal Adjustment'), expected.adjustment || 'Not Seasonally Adjusted')
  const normalizeUnits = value => value.replace(/[–—]/g, '-').replace(/\s*=\s*/g, '=').trim()
  if (expected.units) assert.equal(normalizeUnits(field('Units')), normalizeUnits(expected.units))
  const table = html.match(/<table id="data-table-observations"[\s\S]*?<\/table>/)?.[0]
  assert.ok(table, 'Missing observation table')
  const extra = html.match(/<div id="extra-rows">([\s\S]*?)<\/div>/)?.[1] || ''
  const raw = [...table.matchAll(/<th[^>]*>(\d{4}-\d{2}-\d{2})<\/th>\s*<td[^>]*>\s*([^<]+)<\/td>/g)].map(m => [m[1], m[2]])
  raw.push(...[...extra.matchAll(/#(\d{4}-\d{2}-\d{2})\|\s*([^\r\n]+)/g)].map(m => [m[1], m[2]]))
  const observations = raw.map(([date, text]) => {
    const value = text.trim() === '.' ? null : Number(text.trim())
    assert.ok(text.trim() && (value === null || Number.isFinite(value)), `Invalid value: ${date}`)
    assert.equal(new Date(date).toISOString().slice(0, 10), date)
    return { date: frequency === 'Monthly' ? date.slice(0, 7) : date, value }
  }).sort((a, b) => a.date.localeCompare(b.date))
  const bounds = field('Date Range').match(/^(\d{4}-\d{2}-\d{2}) to (\d{4}-\d{2}-\d{2})$/)
  assert.ok(bounds && observations.length)
  assert.equal(observations[0].date, frequency === 'Monthly' ? bounds[1].slice(0, 7) : bounds[1])
  assert.equal(observations.at(-1).date, frequency === 'Monthly' ? bounds[2].slice(0, 7) : bounds[2])
  if (frequency === 'Monthly') assert.equal(observations.length, monthNumber(bounds[2]) - monthNumber(bounds[1]) + 1)
  observations.forEach((point, index) => {
    if (index) {
      const prior = observations[index - 1].date
      assert.ok(point.date > prior, 'Duplicate date')
      if (frequency === 'Monthly') assert.equal(monthNumber(point.date) - monthNumber(prior), 1, 'Missing month')
      else if (frequency.startsWith('Weekly')) assert.equal((Date.parse(point.date) - Date.parse(prior)) / 86400000, 7, 'Missing week')
      else if (frequency.startsWith('Annual')) assert.ok(Number(point.date.slice(0, 4)) - Number(prior.slice(0, 4)) <= 1, 'Missing year')
      else if (frequency === 'Daily') {
        const cursor = new Date(prior); cursor.setUTCDate(cursor.getUTCDate() + 1)
        while ([0, 6].includes(cursor.getUTCDay())) cursor.setUTCDate(cursor.getUTCDate() + 1)
        assert.equal(point.date, cursor.toISOString().slice(0, 10), 'Missing weekday')
      }
    }
    if ((expectedId.startsWith('CPI') || expected.positive) && point.value !== null) assert.ok(point.value > 0)
  })
  return {
    id: expectedId, provider: 'FRED', publisher: field('Source'), title: field('Title'),
    geography: 'US', units: field('Units'), frequency: frequency.toLowerCase(), seasonalAdjustment: field('Seasonal Adjustment').toLowerCase(),
    sourceUrl: `https://fred.stlouisfed.org/series/${expectedId}`, downloadUrl: `https://fred.stlouisfed.org/data/${expectedId}`,
    retrievedAt: new Date().toISOString().slice(0, 10), sourceUpdatedAt: field('Last Updated').slice(0, 10),
    license: 'Public domain; source citation requested', observations,
  }
}
