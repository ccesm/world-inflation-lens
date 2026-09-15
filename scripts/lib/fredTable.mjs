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
  assert.equal(field('Frequency'), 'Monthly')
  assert.equal(field('Seasonal Adjustment'), expected.adjustment || 'Not Seasonally Adjusted')
  const normalizeUnits = value => value.replace(/[–—]/g, '-').replace(/\s*=\s*/g, '=').trim()
  if (expected.units) assert.equal(normalizeUnits(field('Units')), normalizeUnits(expected.units))
  const table = html.match(/<table id="data-table-observations"[\s\S]*?<\/table>/)?.[0]
  assert.ok(table, 'Missing observation table')
  const extra = html.match(/<div id="extra-rows">([\s\S]*?)<\/div>/)?.[1] || ''
  const raw = [...table.matchAll(/<th[^>]*>(\d{4}-\d{2}-01)<\/th>\s*<td[^>]*>\s*([^<]+)<\/td>/g)].map(m => [m[1], m[2]])
  raw.push(...[...extra.matchAll(/#(\d{4}-\d{2}-01)\|\s*([^\r\n]+)/g)].map(m => [m[1], m[2]]))
  const observations = raw.map(([date, text]) => {
    const value = text.trim() === '.' ? null : Number(text.trim())
    assert.ok(text.trim() && (value === null || Number.isFinite(value)), `Invalid value: ${date}`)
    return { date: date.slice(0, 7), value }
  }).sort((a, b) => a.date.localeCompare(b.date))
  const bounds = field('Date Range').match(/^(\d{4}-\d{2})-01 to (\d{4}-\d{2})-01$/)
  assert.ok(bounds && observations.length)
  assert.equal(observations[0].date, bounds[1])
  assert.equal(observations.at(-1).date, bounds[2])
  assert.equal(observations.length, monthNumber(bounds[2]) - monthNumber(bounds[1]) + 1)
  observations.forEach((point, index) => {
    if (index) assert.equal(monthNumber(point.date) - monthNumber(observations[index - 1].date), 1, 'Duplicate or missing month')
    if ((expectedId.startsWith('CPI') || expected.positive) && point.value !== null) assert.ok(point.value > 0)
  })
  return {
    id: expectedId, provider: 'FRED', publisher: field('Source'), title: field('Title'),
    geography: 'US', units: field('Units'), frequency: 'monthly', seasonalAdjustment: field('Seasonal Adjustment').toLowerCase(),
    sourceUrl: `https://fred.stlouisfed.org/series/${expectedId}`, downloadUrl: `https://fred.stlouisfed.org/data/${expectedId}`,
    retrievedAt: new Date().toISOString().slice(0, 10), sourceUpdatedAt: field('Last Updated').slice(0, 10),
    license: 'Public domain; source citation requested', observations,
  }
}
