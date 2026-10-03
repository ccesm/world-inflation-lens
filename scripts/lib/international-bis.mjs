import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const headers = ['FREQ', 'CURR_DENOM', 'BORROWERS_CTY', 'BORROWERS_SECTOR', 'LENDERS_SECTOR', 'L_POS_TYPE', 'L_INSTR', 'UNIT_MEASURE', 'TITLE', 'UNIT_MULT', 'DECIMALS', 'COLLECTION', 'AVAILABILITY', 'TIME_PERIOD', 'OBS_VALUE', 'OBS_STATUS', 'OBS_PRE_BREAK', 'OBS_CONF']
const base = 'https://stats.bis.org/api/v2/data/dataflow/BIS/WS_GLI/1.0/'
const sourceBase = 'https://data.bis.org/topics/GLI/BIS%2CWS_GLI%2C1.0/'
const geography = 'Non-bank borrowers resident outside the United States; residence, not nationality; BIS coverage and estimation conventions apply.'

export const bisSeries = [
  { id: 'BIS_USD_TOTAL', file: 'wil-bis-total.csv', sourceKey: 'Q.USD.3P.N.A.I.B.USD', title: 'USD denominated credit (bank loans & debt securities) to non-bank borrowers located outside the US', name: 'USD credit outside the United States', definition: 'Outstanding USD-denominated bank loans and international debt securities credit to non-bank borrowers resident outside the United States.' },
  { id: 'BIS_USD_LOANS', file: 'wil-bis-loans.csv', sourceKey: 'Q.USD.3P.N.B.I.G.USD', title: 'USD denominated bank loans to non-bank borrowers located outside the US', name: 'USD bank loans outside the United States', definition: 'Outstanding USD-denominated cross-border and locally extended bank loans to non-bank borrowers outside the United States. The BIS instrument classification is loans and deposits; estimates supplement reporting gaps.' },
  { id: 'BIS_USD_SECURITIES', file: 'wil-bis-securities.csv', sourceKey: 'Q.USD.3P.N.A.I.D.USD', title: 'USD denominated international debt securities issued by non-bank borrowers located outside the US', name: 'USD international debt securities outside the United States', definition: 'Outstanding USD-denominated international debt securities issued by non-banks resident outside the United States, including non-bank financial and non-financial issuers; BIS exclusions apply.' },
].map(series => ({ ...series, sourceUrl: sourceBase + series.sourceKey, downloadUrl: base + series.sourceKey + '?format=csv' }))

// Strict CSV parsing prevents unexpected page/error responses from becoming observations.
export function parseBisCsvRows(input) {
  const text = String(input).replace(/^\uFEFF/, '')
  const rows = []; let row = []; let value = ''; let quoted = false; let closed = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') { value += '"'; i++ } else { quoted = false; closed = true }
      } else value += char
    } else if (char === '"') {
      assert.equal(value, '', 'BIS CSV malformed quote'); assert.ok(!closed, 'BIS CSV malformed quote'); quoted = true
    } else if (char === ',') { row.push(value); value = ''; closed = false
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++
      row.push(value); rows.push(row); row = []; value = ''; closed = false
    } else { assert.ok(!closed, 'BIS CSV characters after quote'); value += char }
  }
  assert.ok(!quoted, 'BIS CSV unterminated quote')
  if (value || row.length || closed) { row.push(value); rows.push(row) }
  assert.deepEqual(rows.shift(), headers, 'BIS CSV schema changed')
  return rows.map((values, index) => {
    assert.equal(values.length, headers.length, `BIS CSV field count at row ${index + 2}`)
    return Object.fromEntries(headers.map((key, i) => [key, values[i]]))
  })
}

export function bisQuarter(period) {
  assert.match(period, /^\d{4}-Q[1-4]$/, 'BIS invalid quarter')
  const year = Number(period.slice(0, 4)); const quarter = Number(period.at(-1))
  assert.ok(year >= 2000 && year <= 2200, 'BIS quarter outside supported coverage')
  return { ordinal: year * 4 + quarter - 1, date: `${year}-${String((quarter - 1) * 3 + 1).padStart(2, '0')}` }
}

function numeric(value, label) {
  assert.match(value, /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/, `BIS invalid numeric ${label}`)
  const parsed = Number(value); assert.ok(Number.isFinite(parsed), `BIS nonfinite ${label}`); return parsed
}

export function parseBisCsv(text, id, { minimumObservations = 100 } = {}) {
  const spec = bisSeries.find(series => series.id === id); assert.ok(spec, `Unknown BIS series ${id}`)
  const rows = parseBisCsvRows(text)
  assert.ok(rows.length >= minimumObservations, `BIS ${id}: historical coverage shrank`)
  let previous = null
  const observations = rows.map(row => {
    assert.equal(headers.slice(0, 8).map(key => row[key]).join('.'), spec.sourceKey, `BIS ${id}: series identity changed`)
    assert.equal(row.TITLE, spec.title, `BIS ${id}: definition/title changed`)
    assert.equal(row.UNIT_MULT, '6', `BIS ${id}: unit multiplier changed`)
    assert.equal(row.DECIMALS, '0', `BIS ${id}: decimal metadata changed`)
    assert.equal(row.COLLECTION, '', `BIS ${id}: collection semantics changed`)
    assert.equal(row.AVAILABILITY, 'A', `BIS ${id}: availability changed`)
    assert.equal(row.OBS_CONF, 'F', `BIS ${id}: not freely publishable`)
    assert.ok(['A', 'B', 'E', 'P', 'M', 'L'].includes(row.OBS_STATUS), `BIS ${id}: unreviewed observation status`)
    const quarter = bisQuarter(row.TIME_PERIOD)
    if (previous !== null) assert.equal(quarter.ordinal, previous + 1, `BIS ${id}: duplicate, unordered or missing quarter`)
    previous = quarter.ordinal
    const missing = row.OBS_VALUE === ''
    assert.equal(missing, ['M', 'L'].includes(row.OBS_STATUS), `BIS ${id}: value/status mismatch`)
    return { date: quarter.date, sourcePeriod: row.TIME_PERIOD, value: missing ? null : numeric(row.OBS_VALUE, row.TIME_PERIOD), sourceFlag: row.OBS_STATUS,
      ...(row.OBS_PRE_BREAK ? { sourcePreBreak: numeric(row.OBS_PRE_BREAK, 'pre-break value') } : {}) }
  })
  assert.equal(observations[0]?.sourcePeriod, '2000-Q1', `BIS ${id}: history start changed`)
  assert.ok(observations.some(observation => observation.value !== null), `BIS ${id}: no available observations`)
  return { id: spec.id, name: spec.name, sourceKey: spec.sourceKey, sourceUrl: spec.sourceUrl, downloadUrl: spec.downloadUrl, units: 'USD millions', unitMultiplier: 6,
    frequency: 'quarterly', currencyDenomination: 'USD', borrowerSector: 'Non-banks, total', definition: spec.definition, denominator: 'none; credit level', geography,
    observationDateSemantics: 'End-of-quarter outstanding stock. Internal dates are quarter-start anchors only; sourcePeriod retains the published quarter. No monthly conversion or interpolation.',
    seasonalAdjustment: 'Not seasonally adjusted', sourceTitle: spec.title, observations }
}

export function validateBisSnapshot(snapshot, { minimumObservations = 100 } = {}) {
  assert.equal(snapshot.metadata.publisher, 'Bank for International Settlements')
  assert.equal(snapshot.metadata.sourceUrl, 'https://data.bis.org/topics/GLI')
  assert.equal(snapshot.metadata.sourceUpdatedAt, null)
  assert.equal(snapshot.metadata.sourceUpdatedTime.precision, 'unknown')
  assert.ok(Number.isFinite(Date.parse(snapshot.metadata.retrievedAt)))
  for(const spec of bisSeries)assert.match(snapshot.metadata.rawSha256[spec.id],/^[a-f0-9]{64}$/)
  assert.equal(snapshot.metadata.id, 'bis'); assert.equal(snapshot.metadata.frequency, 'quarterly')
  assert.deepEqual(snapshot.series.map(series => series.id), bisSeries.map(series => series.id), 'BIS required component missing')
  const [total, loans, securities] = snapshot.series
  for (const series of snapshot.series) {
    const spec = bisSeries.find(item => item.id === series.id)
    for (const [key, value] of Object.entries({ sourceKey: spec.sourceKey, units: 'USD millions', unitMultiplier: 6, frequency: 'quarterly', currencyDenomination: 'USD', borrowerSector: 'Non-banks, total', denominator: 'none; credit level', geography })) assert.equal(series[key], value, `BIS ${series.id}: ${key} changed`)
    assert.ok(series.observations.length >= minimumObservations, 'BIS insufficient historical coverage')
    assert.equal(series.observations[0]?.sourcePeriod, '2000-Q1', 'BIS start coverage changed')
    assert.deepEqual(series.observations.map(row => row.sourcePeriod), total.observations.map(row => row.sourcePeriod), 'BIS components have different quarters')
    let previous = null
    for (const row of series.observations) {
      const quarter = bisQuarter(row.sourcePeriod)
      assert.equal(row.date, quarter.date, 'BIS quarter anchor mismatch')
      if (previous !== null) assert.equal(quarter.ordinal, previous + 1, 'BIS duplicate, unordered or missing quarter')
      previous = quarter.ordinal
      assert.ok(row.value === null || (Number.isFinite(row.value) && row.value >= 0), 'BIS invalid credit level')
      assert.ok(['A', 'B', 'E', 'P', 'M', 'L'].includes(row.sourceFlag), 'BIS unknown observation status')
      assert.equal(row.value === null, ['M', 'L'].includes(row.sourceFlag), 'BIS missing value/status mismatch')
      // Observations are end-of-quarter stocks even though the chart anchor is the quarter start.
      const end = new Date(Date.UTC(Number(row.date.slice(0, 4)), Number(row.date.slice(5, 7)) + 2, 0))
      assert.ok(end.getTime() <= Date.parse(snapshot.metadata.retrievedAt), 'BIS future quarter')
    }
  }
  total.observations.forEach((row, i) => {
    const values = [row.value, loans.observations[i].value, securities.observations[i].value]
    if (values.every(value => value !== null)) assert.ok(Math.abs(values[0] - values[1] - values[2]) <= 0.002, `BIS total/component mismatch at ${row.sourcePeriod}`)
  })
  return snapshot
}

// A guard for the caller's atomic promotion: revisions are retained, never mistaken for new observations.
export function reviewBisRevisions(previous, candidate) {
  if (!previous) return { changes: [], requiresReview: false }
  const changes = []
  for (const oldSeries of previous.series) {
    const nextSeries = candidate.series.find(series => series.id === oldSeries.id)
    assert.ok(nextSeries, `BIS withdrew series ${oldSeries.id}`)
    for (const key of ['sourceKey', 'units', 'unitMultiplier', 'frequency', 'currencyDenomination', 'borrowerSector', 'denominator', 'geography']) assert.equal(nextSeries[key], oldSeries[key], `BIS revision changed ${key}`)
    const current = new Map(nextSeries.observations.map(row => [row.sourcePeriod, row]))
    for (const old of oldSeries.observations) {
      const next = current.get(old.sourcePeriod)
      if (!next || next.value !== old.value || next.sourceFlag !== old.sourceFlag || next.sourcePreBreak !== old.sourcePreBreak) {
        const withdrawal = !next || (old.value !== null && next.value === null)
        const relativeChange = old.value === null || old.value === 0 || next?.value == null ? null : Math.abs(next.value - old.value) / Math.abs(old.value)
        changes.push({ seriesId: oldSeries.id, sourcePeriod: old.sourcePeriod, previousValue: old.value, value: next?.value ?? null,
          previousFlag: old.sourceFlag, sourceFlag: next?.sourceFlag ?? null, previousPreBreak: old.sourcePreBreak ?? null, sourcePreBreak: next?.sourcePreBreak ?? null,
          withdrawal, relativeChange, requiresReview: withdrawal || relativeChange > 0.05 || (old.value === 0 && next?.value !== 0) })
      }
    }
  }
  return { changes, requiresReview: changes.some(change => change.requiresReview) }
}

export async function prepareBis({ input, checkedAt }) {
  assert.ok(typeof checkedAt === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(checkedAt) && Number.isFinite(Date.parse(checkedAt)), 'BIS retrieval timestamp required')
  const raw = await Promise.all(bisSeries.map(async spec => {
    if (input) return readFile(resolve(input, spec.file))
    let failure
    for (let attempt = 0; attempt < 3; attempt++) try {
      const response = await fetch(spec.downloadUrl, { signal: AbortSignal.timeout(45000) })
      assert.ok(response.ok, `BIS HTTP ${response.status}`)
      assert.ok(response.headers.get('content-type')?.includes('text/csv'), 'BIS response is not CSV')
      const bytes = Buffer.from(await response.arrayBuffer()); assert.ok(bytes.length < 2_000_000, 'BIS unexpected source size'); return bytes
    } catch (error) { failure = error }
    throw failure
  }))
  const series = raw.map((bytes, index) => parseBisCsv(bytes.toString('utf8'), bisSeries[index].id))
  return validateBisSnapshot({ metadata: {
    id: 'bis', provider: 'Bank for International Settlements', publisher: 'Bank for International Settlements', dataset: 'Global liquidity indicators (WS_GLI, version 1.0)',
    sourceUrl: 'https://data.bis.org/topics/GLI', downloadUrl: bisSeries[0].downloadUrl, downloadUrls: bisSeries.map(spec => spec.downloadUrl),
    methodologyUrl: 'https://www.bis.org/statistics/gli/gli_methodology.pdf', termsUrl: 'https://data.bis.org/help/legal', licenseUrl: 'https://data.bis.org/help/legal', license: 'BIS statistics terms: cite BIS; translations are unofficial; no BIS endorsement. See terms.',
    frequency: 'quarterly', maintenanceType: 'automated', sourceUpdatedAt: null,
    sourceUpdatedTime: { value: null, precision: 'unknown', semantics: 'The selected SDMX CSV response contains no publisher update or release timestamp. HTTP response time and retrieval time are not a release date.' },
    retrievedAt: checkedAt, observationStart: series[0].observations[0].date, observationEnd: series[0].observations.at(-1).date,
    firstPeriod: series[0].observations[0].sourcePeriod, latestPeriod: series[0].observations.at(-1).sourcePeriod,
    rawSha256: Object.fromEntries(bisSeries.map((spec, index) => [spec.id, createHash('sha256').update(raw[index]).digest('hex')])),
    releasePolicy: 'Quarterly observations with a substantial reporting lag; consult the BIS release calendar. A successful retrieval is not a new quarter or publisher update.',
    revisionPolicy: 'Historical values may change as input data or compilation methods change. Compare all retained quarters, record revisions, and require review for withdrawals or revisions over 5%.',
    vintagePolicy: 'Current revised history; no complete historical vintage API was verified. Versioned project snapshots preserve vintages only from first ingestion onward.',
    limitations: ['Residence is not borrower nationality.', 'Includes non-bank financial institutions, not only corporations.', 'Bank-loan estimates supplement reporting gaps.', 'USD international debt securities issued in the Cayman Islands by US-based entities are excluded under BIS methodology.', 'Levels and their arithmetic differences are not BIS exchange-rate- and break-adjusted growth or transactions.', 'This is credit outstanding, not US M2, dollar deposits, or a complete measure of Eurodollars.'],
    attribution: 'Source: Bank for International Settlements, Global liquidity indicators, WS_GLI 1.0. Chinese translations are not official BIS translations.',
  }, series })
}
