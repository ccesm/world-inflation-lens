import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { diffObservations, summarizeChanges } from './refresh.mjs'

export const ticDownloadUrl = 'https://ticdata.treasury.gov/resource-center/data-chart-center/tic/Documents/slt_table3.txt'
export const ticSourceUrl = 'https://home.treasury.gov/data/treasury-international-capital-tic-system-home-page/tic-forms-instructions/securities-b-portfolio-holdings-of-us-and-foreign-securities'
export const ticSpecs = [
  { id: 'TIC_TOTAL', holderCode: '99996', holder: 'Grand Total', title: 'Total foreign holdings of U.S. Treasury securities', geography: 'All foreign residents, including international and regional organizations' },
  { id: 'TIC_JAPAN', holderCode: '42609', holder: 'Japan', title: 'U.S. Treasury holdings attributed to Japan', geography: 'Japan; custody-based country attribution' },
  { id: 'TIC_CHINA', holderCode: '41408', holder: 'China, Mainland', title: 'U.S. Treasury holdings attributed to mainland China', geography: 'Mainland China; custody-based country attribution' },
  { id: 'TIC_UK', holderCode: '13005', holder: 'United Kingdom', title: 'U.S. Treasury holdings attributed to the United Kingdom', geography: 'United Kingdom; custody-based country attribution' },
  { id: 'TIC_OFFICIAL', holderCode: '99990', holder: 'Of Which: Foreign Official', title: 'Foreign official holdings of U.S. Treasury securities', geography: 'Foreign official institutions, including international and regional organizations' },
]
const columns = ['country', 'country_code', 'date', 'for_treas_pos', 'for_treas_net', 'for_lt_treas_pos', 'for_lt_treas_net', 'for_lt_treas_valchg', 'for_st_treas_pos', 'for_st_treas_net']
const title = 'Table 3: U.S. Treasury Securities Held by Foreign Residents 1/'
const units = 'USD millions'
const denominator = 'None: a level of Treasury securities holdings, not a share or a flow.'
const definition = 'End-of-month foreign holdings of long- and short-term U.S. Treasury securities; Table 3 for_treas_pos, combining TIC SLT long-term holdings with TIC BL2 short-term holdings. Long-term securities are reported at fair value. Holdings changes are not net purchases.'
const limitations = 'Country attribution is primarily custodial and may differ from ultimate beneficial ownership. Foreign official is not limited to central banks. Changes in holdings reflect transactions, valuation and other adjustments; they do not identify motives or all international dollar use.'
const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/
const monthNumber = date => Number(date.slice(0, 4)) * 12 + Number(date.slice(5, 7))
const sha256 = text => createHash('sha256').update(text).digest('hex')
const numeric = value => {
  if (value === 'n.a.') return null
  assert.match(value, /^-?\d+(?:\.\d+)?$/, `Unrecognized TIC numeric token: ${value}`)
  const number = Number(value)
  assert.ok(Number.isFinite(number), 'Nonfinite TIC value')
  return number
}

function sourceTime(lastModified, checkedAt) {
  if (!lastModified) return { value: null, precision: 'unknown', semantics: 'Source file update timestamp unavailable; retrieval is not a release date' }
  const time = Date.parse(lastModified)
  assert.ok(Number.isFinite(time) && time <= Date.parse(checkedAt), 'Invalid or future TIC Last-Modified timestamp')
  return { value: new Date(time).toISOString(), precision: 'timestamp', semantics: 'Official download HTTP Last-Modified; file update time, not an observation or guaranteed release timestamp', original: lastModified }
}

export function parseTic(text, { checkedAt = new Date().toISOString(), lastModified = null } = {}) {
  assert.equal(typeof text, 'string')
  assert.ok(Number.isFinite(Date.parse(checkedAt)), 'Invalid TIC retrieval timestamp')
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/)
  assert.equal(lines[0].trim(), title, 'TIC product identity changed')
  assert.equal(lines[1].trim(), 'All Countries and International and Regional Organizations', 'TIC geographic scope changed')
  assert.equal(lines[3].trim(), 'Millions of dollars', 'TIC units changed')
  const header = lines.findIndex(line => line.startsWith('country\tcountry_code\t'))
  assert.ok(header > 0, 'TIC machine-readable column header missing')
  assert.deepEqual(lines[header].split('\t'), columns, 'TIC columns changed; do not substitute transactions for holdings')
  assert.deepEqual(lines[header - 1].split('\t'), ['Country', 'Country Code', 'Date', 'Holdings', 'Net U.S. Sales', 'Holdings', 'Net U.S. Sales', 'Valuation Change', 'Holdings', 'Net U.S. Sales'], 'TIC column meanings changed')
  assert.deepEqual(lines[header - 2].split('\t'), ['', '', '', 'Total U.S. Treasuries', 'Total U.S. Treasuries', 'Long-term U.S. Treasuries', 'Long-term U.S. Treasuries', 'Long-term U.S. Treasuries', 'Short-term U.S. Treasuries', 'Short-term U.S. Treasuries'], 'TIC instrument definitions changed')
  assert.ok(text.includes('Long-term Treasury bonds and notes are reported on the TIC Form SLT.') && text.includes('bill holdings are reported on the TIC form BL-2.'), 'TIC source instrument footnotes changed')
  const observations = new Map(ticSpecs.map(spec => [spec.holderCode, []]))
  const seen = new Set()
  let rows = 0
  for (const line of lines.slice(header + 1)) {
    if (!line.trim()) break
    const values = line.split('\t')
    assert.equal(values.length, columns.length, 'TIC row schema changed')
    const [holder, code, date] = values
    assert.match(code, /^\d{5}$/, 'Invalid TIC holder code')
    assert.match(date, monthPattern, 'Invalid TIC monthly period')
    assert.ok(date < checkedAt.slice(0, 7), 'TIC observation must be a completed month')
    const key = `${code}/${date}`
    assert.ok(!seen.has(key), `Duplicate TIC observation: ${key}`)
    seen.add(key)
    const numbers = values.slice(3).map(numeric)
    const spec = ticSpecs.find(candidate => candidate.holderCode === code || candidate.holder === holder)
    if (spec) {
      assert.equal(holder, spec.holder, `TIC holder definition changed: ${code}`)
      assert.equal(code, spec.holderCode, `TIC holder code changed: ${holder}`)
      const value = numbers[0]
      assert.ok(value === null || value >= 0, 'TIC holdings cannot be negative')
      if (numbers[0] !== null && numbers[2] !== null && numbers[5] !== null) {
        assert.ok(Math.abs(numbers[0] - numbers[2] - numbers[5]) <= 1, 'TIC total holdings do not match long- plus short-term holdings within source rounding')
      }
      const points = observations.get(code)
      if (points.length) assert.equal(monthNumber(points.at(-1).date) - monthNumber(date), 1, `Missing or out-of-order TIC month for ${holder}`)
      points.push({ date, value, ...(value === null ? { sourceFlag: 'n.a.' } : {}) })
    }
    rows++
  }
  assert.ok(rows > 0, 'No TIC data rows')
  const updated = sourceTime(lastModified, checkedAt)
  const series = ticSpecs.map(spec => ({ ...spec, units, frequency: 'monthly', seasonalAdjustment: 'not seasonally adjusted', definition, denominator, sourceColumn: 'for_treas_pos', periodBasis: 'End-of-month position; YYYY-MM is the observation month', observations: observations.get(spec.holderCode).reverse() }))
  return validateTic({ metadata: { id: 'tic', provider: 'U.S. Treasury / TIC', publisher: 'U.S. Department of the Treasury', dataset: 'Treasury International Capital Table 3: U.S. Treasury Securities Held by Foreign Residents', sourceUrl: ticSourceUrl, downloadUrl: ticDownloadUrl, license: 'U.S. Treasury public statistical data; cite Treasury International Capital (TIC), Table 3. No endorsement.', licenseUrl: 'https://home.treasury.gov/utility/privacy-legal-and-disclaimers', attribution: 'Source: U.S. Department of the Treasury, Treasury International Capital (TIC), Table 3.', frequency: 'monthly', maintenance: 'AUTOMATED', sourceUpdatedAt: updated.value, sourceUpdatedTime: updated, retrievedAt: checkedAt, sourceSha256: sha256(text), sourceHashScope: 'Complete official Table 3 tab-delimited response', coverage: { start: series[0].observations[0]?.date, end: series[0].observations.at(-1)?.date }, definitions: { definition, denominator, limitations, units, frequency: 'monthly', observationSemantics: 'End-of-month holdings; no interpolation', revisionPolicy: 'January, April, July and October releases normally revise the prior year; other releases the prior three months. Significant revisions can extend further. Current-vintage history, not original-release vintages.', releaseTiming: 'Monthly, about 1.5 months after the observation month, on Treasury published release dates at 4 p.m. America/New_York.', license: 'U.S. Treasury public statistical data; attribute Treasury International Capital (TIC), Table 3, with download and retrieval date.' } }, series })
}

export function validateTic(bundle) {
  const { metadata, series } = bundle
  assert.equal(metadata.id, 'tic')
  assert.equal(metadata.publisher, 'U.S. Department of the Treasury')
  assert.equal(metadata.sourceUrl, ticSourceUrl)
  assert.equal(metadata.downloadUrl, ticDownloadUrl)
  assert.equal(metadata.frequency, 'monthly')
  assert.equal(metadata.maintenance, 'AUTOMATED')
  assert.equal(metadata.definitions.denominator, denominator)
  assert.equal(metadata.definitions.units, units)
  assert.equal(metadata.definitions.frequency, 'monthly')
  assert.match(metadata.sourceSha256, /^[a-f0-9]{64}$/)
  assert.ok(Number.isFinite(Date.parse(metadata.retrievedAt)), 'Invalid TIC retrievedAt')
  assert.equal(metadata.sourceUpdatedTime.value, metadata.sourceUpdatedAt)
  if (metadata.sourceUpdatedAt !== null) assert.ok(Number.isFinite(Date.parse(metadata.sourceUpdatedAt)) && Date.parse(metadata.sourceUpdatedAt) <= Date.parse(metadata.retrievedAt), 'Invalid TIC source update time')
  else assert.equal(metadata.sourceUpdatedTime.precision, 'unknown')
  assert.deepEqual(series.map(item => item.id), ticSpecs.map(item => item.id), 'Missing or unexpected TIC series')
  for (const [index, source] of series.entries()) {
    const spec = ticSpecs[index]
    for (const key of ['holderCode', 'holder', 'title', 'geography']) assert.equal(source[key], spec[key], `TIC ${key} changed`)
    assert.equal(source.units, units)
    assert.equal(source.frequency, 'monthly')
    assert.equal(source.denominator, denominator)
    assert.equal(source.definition, definition)
    assert.equal(source.sourceColumn, 'for_treas_pos', 'TIC must remain a holdings series')
    assert.equal(source.seasonalAdjustment, 'not seasonally adjusted')
    assert.equal(source.observations[0]?.date, '2020-01', 'TIC historical coverage removed or changed')
    assert.ok(source.observations.length >= 24, 'Insufficient TIC coverage')
    assert.ok(source.observations.some(point => point.value !== null), 'Entire TIC series is missing')
    for (const [i, point] of source.observations.entries()) {
      assert.match(point.date, monthPattern, 'Invalid TIC month')
      assert.ok(point.date < metadata.retrievedAt.slice(0, 7), 'TIC observation must be a completed month')
      assert.ok(point.value === null || Number.isFinite(point.value) && point.value >= 0, 'Invalid TIC holding value')
      if (point.value === null) assert.equal(point.sourceFlag, 'n.a.', 'Missing TIC value must retain upstream missing marker')
      else assert.equal(point.sourceFlag, undefined, 'Unexpected TIC observation flag')
      if (i) assert.equal(monthNumber(point.date) - monthNumber(source.observations[i - 1].date), 1, 'Missing, duplicate or unordered TIC month')
    }
    assert.deepEqual({ start: source.observations[0].date, end: source.observations.at(-1).date }, metadata.coverage, 'TIC coverage mismatch')
  }
  const total = series[0].observations
  for (const source of series.slice(1)) source.observations.forEach((point, i) => {
    if (point.value !== null && total[i].value !== null) assert.ok(point.value <= total[i].value, 'TIC holder exceeds foreign total')
  })
  return bundle
}

export function compareTic(prior, next) {
  validateTic(prior)
  validateTic(next)
  if (prior.metadata.sourceUpdatedAt && next.metadata.sourceUpdatedAt) assert.ok(next.metadata.sourceUpdatedAt >= prior.metadata.sourceUpdatedAt, 'TIC source file timestamp regressed')
  return next.series.map((source, index) => {
    assert.ok(source.observations.at(-1).date >= prior.series[index].observations.at(-1).date, 'TIC latest observation regressed')
    const changes = diffObservations(prior.series[index].observations, source.observations)
    for (const change of changes) if (change.kind === 'revised') {
      assert.ok(!(Math.abs(change.after - change.before) > 1000 && (change.before === 0 || Math.abs((change.after - change.before) / change.before) > .1)), `Large TIC historical revision requires manual review: ${source.id}/${change.date}`)
    }
    return { ...summarizeChanges(source.id, changes), changes }
  })
}

export async function prepareTic({ input, checkedAt = new Date().toISOString() } = {}) {
  if (input) {
    const text = await readFile(resolve(input, 'wil-tic.txt'), 'utf8')
    let headers = {}
    try { headers = JSON.parse(await readFile(resolve(input, 'wil-tic-headers.json'), 'utf8')) } catch (error) { if (error.code !== 'ENOENT') throw error }
    return parseTic(text, { checkedAt, lastModified: headers.lastModified })
  }
  let failure
  for (let attempt = 0; attempt < 3; attempt++) try {
    const response = await fetch(ticDownloadUrl, { signal: AbortSignal.timeout(30000) })
    assert.ok(response.ok, `TIC HTTP ${response.status}`)
    assert.ok((response.headers.get('content-type') || '').includes('text/plain'), 'TIC download is not text/plain')
    return parseTic(await response.text(), { checkedAt, lastModified: response.headers.get('last-modified') })
  } catch (error) { failure = error }
  throw failure
}
