import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const denominator = 'Global official foreign-exchange reserves including IMF imputations; excludes monetary gold'
const currencies = 'CI_USD+CI_EUR+CI_CNY+CI_JPY+CI_GBP+CI_AUD+CI_CAD+CI_CHF+CI_OTHC+CI_T'
export const coferSource = Object.freeze({
  id: 'cofer', provider: 'International Monetary Fund', publisher: 'International Monetary Fund, Statistics Department',
  dataset: 'Currency Composition of Official Foreign Exchange Reserves (COFER)',
  sourceUrl: 'https://data.imf.org/en/Datasets/COFER',
  downloadUrl: `https://api.imf.org/external/sdmx/2.1/data/IMF.STA,COFER,7.0.1/G001.AFXRA+TFXRA_IMP.${currencies}.SHRO_PT.Q?startPeriod=2000-Q1`,
  methodologyUrl: 'https://www.imf.org/-/media/files/publications/tnm/2025/english/tnmea2025014.pdf',
  licenseUrl: 'https://www.imf.org/en/about/copyright-and-terms',
  attribution: 'Source: International Monetary Fund, Currency Composition of Official Foreign Exchange Reserves (COFER), https://data.imf.org/en/Datasets/COFER. Quarterly shares are reproduced without recalculation.',
  license: 'IMF statistical-data terms: accurate reproduction with IMF attribution; material transformations must be disclosed. See source terms.',
  file: 'wil-cofer.csv', frequency: 'quarterly', methodology: '2025Q3-imputed', denominator,
})

export const coferSeriesSpecs = Object.freeze([
  ['USD', 'US dollar', 'CI_USD', '2000-Q1'],
  ['EUR', 'Euro', 'CI_EUR', '2000-Q1'],
  ['CNY', 'Chinese renminbi', 'CI_CNY', '2016-Q4'],
  ['JPY', 'Japanese yen', 'CI_JPY', '2000-Q1'],
  ['GBP', 'Pound sterling', 'CI_GBP', '2000-Q1'],
  ['AUD', 'Australian dollar', 'CI_AUD', '2012-Q4'],
  ['CAD', 'Canadian dollar', 'CI_CAD', '2012-Q4'],
  ['CHF', 'Swiss franc', 'CI_CHF', '2000-Q1'],
  ['OTHER', 'Other currencies', 'CI_OTHC', '2000-Q1'],
  ['IMPUTED', 'IMF-imputed share of total reserves', 'CI_T', '2025-Q3'],
].map(([currency, title, sourceCode, startPeriod]) => Object.freeze({
  id: `COFER_${currency}`, currency, title, sourceCode, startPeriod,
  indicator: currency === 'IMPUTED' ? 'TFXRA_IMP' : 'AFXRA',
})))

// SDMX-CSV embeds quoted commas, line breaks and doubled quotation marks in its metadata.
export function readCoferCsv(input) {
  const text = String(input).replace(/^\uFEFF/, '')
  const rows = []; let row = []; let cell = ''; let quoted = false; let closed = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++ } else { quoted = false; closed = true }
      } else cell += char
    } else if (char === '"') {
      assert.equal(cell, '', 'COFER CSV: unexpected quote'); assert.equal(closed, false, 'COFER CSV: invalid quote'); quoted = true
    } else if (char === ',') { row.push(cell); cell = ''; closed = false
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++
      row.push(cell); if (row.some(value => value !== '')) rows.push(row)
      row = []; cell = ''; closed = false
    } else { assert.equal(closed, false, 'COFER CSV: text after closing quote'); cell += char }
  }
  assert.equal(quoted, false, 'COFER CSV: unterminated quoted field')
  if (cell || row.length) { row.push(cell); rows.push(row) }
  assert.ok(rows.length > 1, 'COFER CSV: no observations')
  const headers = rows.shift()
  assert.equal(new Set(headers).size, headers.length, 'COFER CSV: duplicate headers')
  const required = ['DATAFLOW', 'COUNTRY', 'INDICATOR', 'FXR_CURRENCY', 'TYPE_OF_TRANSFORMATION', 'FREQUENCY', 'TIME_PERIOD', 'OBS_VALUE', 'SCALE', 'UNIT', 'PUBLICATION_DATE', 'UPDATE_DATE', 'METHODOLOGY_NOTES', 'SERIES_NAME']
  for (const field of required) assert.ok(headers.includes(field), `COFER CSV: missing column ${field}`)
  return rows.map((values, index) => {
    assert.equal(values.length, headers.length, `COFER CSV: row ${index + 2} schema length`)
    return Object.fromEntries(headers.map((header, i) => [header, values[i]]))
  })
}

function quarterIndex(period) {
  const match = /^(\d{4})-Q([1-4])$/.exec(period)
  assert.ok(match, `COFER invalid quarter: ${period}`)
  return Number(match[1]) * 4 + Number(match[2]) - 1
}

function quarterAnchor(period) {
  quarterIndex(period)
  return `${period.slice(0, 4)}-${String((Number(period.at(-1)) - 1) * 3 + 1).padStart(2, '0')}`
}

function validTimestamp(value, label) {
  assert.match(value, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/, `COFER invalid ${label}`)
  assert.ok(Number.isFinite(Date.parse(value)), `COFER invalid ${label}`)
  assert.equal(new Date(value).toISOString().slice(0, 10), value.slice(0, 10), `COFER invalid ${label} calendar date`)
}

export function parseCofer(input, checkedAt) {
  validTimestamp(checkedAt, 'retrieval timestamp')
  const bytes = Buffer.isBuffer(input) ? input : Buffer.from(input)
  const rows = readCoferCsv(bytes)
  const expected = new Map(coferSeriesSpecs.map(spec => [`${spec.indicator}.${spec.sourceCode}`, spec]))
  // AFXRA.CI_T is a denominator guard, not an extra user-facing measurement.
  expected.set('AFXRA.CI_T', { id: '_TOTAL_SHARE', startPeriod: '2000-Q1' })
  const grouped = new Map([...expected.values()].map(spec => [spec.id, []]))
  const dates = { publication: new Set(), update: new Set() }
  for (const row of rows) {
    assert.equal(row.DATAFLOW, 'IMF.STA:COFER(7.0.1)', 'COFER dataflow/version changed; review schema and methodology')
    assert.equal(row.COUNTRY, 'G001', 'COFER geography must be World')
    assert.equal(row.FREQUENCY, 'Q', 'COFER must remain quarterly')
    assert.equal(row.TYPE_OF_TRANSFORMATION, 'SHRO_PT', 'COFER transformation must be shares')
    assert.equal(row.UNIT, 'PT', 'COFER units must be percentage points / shares')
    assert.equal(row.SCALE, '0', 'COFER share scale changed')
    assert.match(row.METHODOLOGY_NOTES, /Starting in 2025Q3, with revisions back to 2000Q1/,
      'COFER methodology/denominator requires manual review')
    assert.match(row.METHODOLOGY_NOTES, /100 percent of the world[’']s foreign exchange reserves/,
      'COFER denominator changed')
    assert.match(row.METHODOLOGY_NOTES, /share of total reserves that have been imputed/,
      'COFER imputation qualification missing')
    const spec = expected.get(`${row.INDICATOR}.${row.FXR_CURRENCY}`)
    assert.ok(spec, `COFER unexpected series ${row.INDICATOR}.${row.FXR_CURRENCY}`)
    assert.ok(quarterIndex(row.TIME_PERIOD) >= quarterIndex(spec.startPeriod), 'COFER observation before supported methodology/category')
    validTimestamp(row.PUBLICATION_DATE, 'publication timestamp'); validTimestamp(row.UPDATE_DATE, 'update timestamp')
    assert.ok(Date.parse(row.PUBLICATION_DATE) <= Date.parse(checkedAt), 'COFER publication after retrieval')
    assert.ok(Date.parse(row.UPDATE_DATE) <= Date.parse(checkedAt), 'COFER update after retrieval')
    dates.publication.add(row.PUBLICATION_DATE); dates.update.add(row.UPDATE_DATE)
    const missing = row.OBS_VALUE.trim() === ''
    const value = missing ? null : Number(row.OBS_VALUE)
    assert.ok(value === null || (Number.isFinite(value) && value >= 0 && value <= 100), 'COFER invalid share value')
    const points = grouped.get(spec.id)
    if (points.length) assert.equal(quarterIndex(row.TIME_PERIOD), quarterIndex(points.at(-1).sourcePeriod) + 1,
      `COFER ${spec.id}: duplicate, unordered or missing quarter`)
    points.push({ date: quarterAnchor(row.TIME_PERIOD), sourcePeriod: row.TIME_PERIOD, value,
      ...(row.STATUS ? { sourceFlag: row.STATUS } : {}) })
  }
  assert.equal(dates.publication.size, 1, 'COFER inconsistent release timestamps')
  assert.equal(dates.update.size, 1, 'COFER inconsistent update timestamps')
  const total = grouped.get('_TOTAL_SHARE')
  assert.ok(total.length, 'COFER total-share denominator guard missing')
  assert.equal(total[0].sourcePeriod, '2000-Q1', 'COFER revised history must begin 2000Q1')
  const latestPeriod = total.at(-1).sourcePeriod
  assert.ok(quarterIndex(latestPeriod) >= quarterIndex('2025-Q3'), 'COFER revised release/imputation history absent')
  for (const spec of expected.values()) {
    const points = grouped.get(spec.id)
    assert.ok(points.length, `COFER missing category ${spec.id}`)
    assert.equal(points[0].sourcePeriod, spec.startPeriod, `COFER ${spec.id}: missing historical coverage`)
    assert.equal(points.at(-1).sourcePeriod, latestPeriod, `COFER ${spec.id}: incomplete latest quarter`)
    assert.notEqual(points.at(-1).value, null, `COFER ${spec.id}: latest observation missing; retain prior snapshot`)
  }
  for (const point of total) {
    assert.equal(point.value, 100, 'COFER total currency share must equal 100 under revised denominator')
    const applicable = coferSeriesSpecs.filter(spec => spec.id !== 'COFER_IMPUTED' && quarterIndex(spec.startPeriod) <= quarterIndex(point.sourcePeriod))
    const values = applicable.map(spec => grouped.get(spec.id).find(p => p.sourcePeriod === point.sourcePeriod).value)
    if (values.every(value => value !== null)) assert.ok(Math.abs(values.reduce((sum, value) => sum + value, 0) - 100) < 0.02,
      `COFER ${point.sourcePeriod}: currency shares do not sum to 100; denominator/category review required`)
  }
  const sourceUpdatedAt = [...dates.update][0]
  const bundle = {
    metadata: {
      ...coferSource, sourceUpdatedAt, sourceReleasedAt: [...dates.publication][0],
      sourceUpdatedTime: { value: sourceUpdatedAt, precision: 'timestamp', semantics: 'IMF UPDATE_DATE attribute; not an observation or retrieval date' },
      sourceUpdateSemantics: 'UPDATE_DATE attribute of the IMF data release, not the SDMX structure modification time or retrieval time.',
      retrievedAt: checkedAt, sourceSha256: createHash('sha256').update(bytes).digest('hex'),
      latestObservation: quarterAnchor(latestPeriod), latestSourcePeriod: latestPeriod,
      coverage: { start: '2000-Q1', end: latestPeriod },
      maintenanceType: 'automated', status: 'published_snapshot_subject_to_revision',
      observationSemantics: 'End-of-quarter reserve positions; date is a quarter-start storage anchor, not a monthly observation. sourcePeriod retains the IMF quarter.',
      revisionPolicy: 'Current revised IMF vintage only. The December 2025 methodology allocates previously unallocated reserves using IMF imputations, revised back to 2000Q1. Do not splice legacy allocated-only shares. Local accepted snapshots and revision ledger preserve future project vintages; no complete historical release archive is claimed.',
      releasePolicy: 'Quarterly, normally at the end of the following quarter. A retrieval/check does not indicate a new observation.',
      limitations: [
        'Currency shares include IMF estimates/imputations and are affected by exchange-rate valuation; changes are not a direct measure of transactions or policy motive.',
        'Excludes monetary gold, SDR holdings and IMF reserve positions; it is not a share of all central-bank assets or global wealth.',
        'World aggregates only; country-level reserve currency compositions are confidential.',
        'CNY is separately identified from 2016Q4 and AUD/CAD from 2012Q4. Before those dates they are included within other currencies, not zero.',
        'The imputed share is a data-coverage qualifier, not an additional reserve currency; its history begins 2025Q3.',
      ],
    },
    series: coferSeriesSpecs.map(spec => ({
      id: spec.id, title: spec.title, units: 'Percent of world FX reserves', currency: spec.currency,
      frequency: 'quarterly', geography: 'World', seasonalAdjustment: 'not seasonally adjusted', denominator,
      sourceKey: `G001.${spec.indicator}.${spec.sourceCode}.SHRO_PT.Q`, sourceUnit: 'PT', sourceScale: 0,
      definition: spec.id === 'COFER_IMPUTED'
        ? 'IMF-published share of total foreign-exchange reserves imputed by IMF staff. Coverage qualifier; not a currency share.'
        : `IMF-published ${spec.title} share of global official foreign-exchange reserves, including IMF imputations under the revised COFER methodology.`,
      coverage: { start: quarterAnchor(spec.startPeriod), end: quarterAnchor(latestPeriod) },
      observations: grouped.get(spec.id),
    })),
  }
  validateCofer(bundle)
  return bundle
}

export function validateCofer(bundle) {
  assert.equal(bundle.metadata.id, 'cofer')
  assert.equal(bundle.metadata.methodology, '2025Q3-imputed', 'COFER methodology changed')
  assert.equal(bundle.metadata.denominator, denominator, 'COFER denominator changed')
  assert.equal(bundle.metadata.frequency, 'quarterly')
  assert.equal(bundle.metadata.sourceUrl, coferSource.sourceUrl)
  assert.equal(bundle.metadata.downloadUrl, coferSource.downloadUrl)
  assert.equal(bundle.metadata.sourceUpdatedTime.precision, 'timestamp')
  assert.equal(bundle.metadata.sourceUpdatedTime.value, bundle.metadata.sourceUpdatedAt)
  assert.ok(Date.parse(bundle.metadata.sourceUpdatedAt) <= Date.parse(bundle.metadata.retrievedAt))
  assert.ok(Date.parse(bundle.metadata.sourceReleasedAt) <= Date.parse(bundle.metadata.retrievedAt))
  validTimestamp(bundle.metadata.sourceUpdatedAt, 'update timestamp')
  validTimestamp(bundle.metadata.sourceReleasedAt, 'release timestamp')
  validTimestamp(bundle.metadata.retrievedAt, 'retrieval timestamp')
  assert.match(bundle.metadata.sourceSha256, /^[a-f0-9]{64}$/)
  assert.equal(bundle.series.length, coferSeriesSpecs.length, 'COFER category count')
  assert.equal(new Set(bundle.series.map(s => s.id)).size, bundle.series.length, 'COFER duplicate series')
  const byId = Object.fromEntries(bundle.series.map(series => [series.id, series]))
  for (const spec of coferSeriesSpecs) {
    const series = byId[spec.id]
    assert.ok(series, `COFER missing series ${spec.id}`)
    assert.equal(series.units, 'Percent of world FX reserves')
    assert.equal(series.frequency, 'quarterly'); assert.equal(series.geography, 'World')
    assert.equal(series.denominator, denominator); assert.equal(series.currency, spec.currency)
    assert.equal(series.sourceKey, `G001.${spec.indicator}.${spec.sourceCode}.SHRO_PT.Q`)
    assert.equal(series.sourceUnit, 'PT'); assert.equal(series.sourceScale, 0)
    assert.ok(series.observations.length > 0)
    assert.equal(series.observations[0].sourcePeriod, spec.startPeriod)
    assert.equal(series.observations.at(-1).sourcePeriod, bundle.metadata.latestSourcePeriod)
    assert.notEqual(series.observations.at(-1).value, null)
    let last
    for (const point of series.observations) {
      const quarter = quarterIndex(point.sourcePeriod)
      assert.ok(Date.UTC(Number(point.date.slice(0,4)), Number(point.date.slice(5,7))+2, 0, 23,59,59) <= Date.parse(bundle.metadata.retrievedAt), 'COFER future quarter')
      assert.equal(point.date, quarterAnchor(point.sourcePeriod), 'COFER quarter anchor mismatch')
      if (last !== undefined) assert.equal(quarter, last + 1, 'COFER duplicate, unordered or missing quarter')
      last = quarter
      assert.ok(point.value === null || (Number.isFinite(point.value) && point.value >= 0 && point.value <= 100), 'COFER invalid share')
    }
    assert.deepEqual(series.coverage, { start: series.observations[0].date, end: series.observations.at(-1).date })
  }
  assert.equal(bundle.metadata.latestObservation, quarterAnchor(bundle.metadata.latestSourcePeriod))
  for (const point of byId.COFER_USD.observations) {
    const values = coferSeriesSpecs.filter(spec => spec.currency !== 'IMPUTED' && quarterIndex(spec.startPeriod) <= quarterIndex(point.sourcePeriod))
      .map(spec => byId[spec.id].observations.find(p => p.date === point.date).value)
    if (values.every(value => value !== null)) assert.ok(Math.abs(values.reduce((sum, value) => sum + value, 0) - 100) < 0.02, 'COFER currency shares do not sum to 100')
  }
  return true
}

export function compareCofer(previous, next) {
  validateCofer(previous); validateCofer(next)
  assert.ok(Date.parse(next.metadata.sourceUpdatedAt) >= Date.parse(previous.metadata.sourceUpdatedAt), 'COFER source vintage regressed')
  const nextById = Object.fromEntries(next.series.map(series => [series.id, series]))
  return previous.series.map(series => {
    const candidate = nextById[series.id]
    const before = new Map(series.observations.map(point => [point.date, point.value]))
    const after = new Map(candidate.observations.map(point => [point.date, point.value]))
    const revisions = []
    for (const [date, value] of before) {
      assert.ok(after.has(date), `COFER ${series.id}: historical observation withdrawn; manual review required`)
      const newValue = after.get(date)
      assert.ok(value === null || newValue !== null, `COFER ${series.id}: historical value withdrawn; manual review required`)
      if (value !== newValue) {
        assert.ok(value === null || Math.abs(value - newValue) <= 5, `COFER ${series.id}: revision exceeds 5 percentage points; manual review required`)
        revisions.push({ date, before: value, after: newValue })
      }
    }
    const added = candidate.observations.filter(point => !before.has(point.date)).length
    return { id: series.id, added, revised: revisions.length, removed: 0, total: added + revisions.length, revisions }
  })
}

export async function prepareCofer({ input, checkedAt, previous } = {}) {
  const retrievedAt = checkedAt || new Date().toISOString()
  let bytes
  if (input) bytes = await readFile(resolve(input, coferSource.file))
  else {
    let failure
    for (let attempt = 0; attempt < 3; attempt++) try {
      const response = await fetch(coferSource.downloadUrl, {
        headers: { Accept: 'text/csv' }, signal: AbortSignal.timeout(30000),
      })
      assert.ok(response.ok, `COFER: HTTP ${response.status}`)
      assert.match(response.headers.get('content-type') || '', /(?:text|application)\/csv/, 'COFER unexpected content type')
      bytes = Buffer.from(await response.arrayBuffer())
      break
    } catch (error) { failure = error }
    if (!bytes) throw failure
  }
  assert.ok(bytes.length > 0 && bytes.length <= 20_000_000, 'COFER unexpected response size')
  const snapshot = parseCofer(bytes, retrievedAt)
  if (previous) compareCofer(previous, snapshot)
  return snapshot
}
