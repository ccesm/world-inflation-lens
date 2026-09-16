import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { monthNumber } from '../../src/utils/inflation.js'
import { diffObservations, summarizeChanges } from './refresh.mjs'

export const externalSources = {
  gpr: { provider: 'Caldara–Iacoviello', authors: 'Dario Caldara and Matteo Iacoviello', frequency: 'monthly', sourceUrl: 'https://www.matteoiacoviello.com/gpr.htm', downloadUrl: 'https://www.matteoiacoviello.com/gpr_files/data_gpr_export.xls', license: 'CC BY; source and authors must be credited', licenseUrl: 'https://www.matteoiacoviello.com/gpr.htm', attribution: 'Caldara, Dario and Matteo Iacoviello (2022), Measuring Geopolitical Risk, American Economic Review 112(4), 1194–1225.', methodologyUrl: 'https://www.matteoiacoviello.com/gpr_files/GPR_PAPER.pdf', file: 'gpr.xls' },
  gscpi: { provider: 'Federal Reserve Bank of New York', authors: 'Gianluca Benigno, Julian di Giovanni, Jan J. J. Groen and Adam I. Noble', frequency: 'monthly', sourceUrl: 'https://www.newyorkfed.org/research/policy/gscpi', downloadUrl: 'https://www.newyorkfed.org/medialibrary/research/interactives/data/gscpi/gscpi_interactive_data.csv', license: 'New York Fed Terms of Use; attribution required; no endorsement', licenseUrl: 'https://www.newyorkfed.org/privacy/termsofuse', attribution: 'Federal Reserve Bank of New York, Global Supply Chain Pressure Index. © Federal Reserve Bank of New York. Subject to its Terms of Use.', methodologyUrl: 'https://www.newyorkfed.org/research/staff_reports/sr1017', file: 'gscpi.csv' },
  'fao-food': { provider: 'FAO', authors: 'Food and Agriculture Organization of the United Nations', frequency: 'monthly', sourceUrl: 'https://www.fao.org/worldfoodsituation/foodpricesindex/en/', downloadUrl: 'https://www.fao.org/media/docs/worldfoodsituationlibraries/default-document-library/food_price_indices_data.csv?sfvrsn=523ebd2a_83&download=true', license: 'CC BY 4.0, complemented by FAO Statistical Database Terms of Use', licenseUrl: 'https://www.fao.org/contact-us/terms/db-terms-of-use/en/', attribution: '© FAO 2026. FAO Food Price Index. Monthly nominal indices; data reformatted by World Inflation Lens, no FAO endorsement.', methodologyUrl: 'https://www.fao.org/worldfoodsituation/foodpricesindex/en/', file: 'fao.csv' },
  'sipri-military': { provider: 'SIPRI', authors: 'Stockholm International Peace Research Institute', frequency: 'annual', sourceUrl: 'https://www.sipri.org/databases/milex', downloadUrl: 'https://www.sipri.org/sites/default/files/SIPRI-Milex-data-1949-2025_v1.2.xlsx', license: 'SIPRI non-commercial fair use: attribution and less than 10% of dataset; commercial use requires permission', licenseUrl: 'https://www.sipri.org/about/terms-and-conditions', attribution: 'Information from the Stockholm International Peace Research Institute (SIPRI) Military Expenditure Database, https://doi.org/10.55163/CQGC9685. © SIPRI 2026.', methodologyUrl: 'https://www.sipri.org/databases/milex/sources-and-methods', file: 'sipri.xlsx' },
}
export const externalIds = {
  gpr: ['GPR', 'GPRT', 'GPRA'], gscpi: ['GSCPI'],
  'fao-food': ['FAO_FOOD', 'FAO_MEAT', 'FAO_DAIRY', 'FAO_CEREALS', 'FAO_OILS', 'FAO_SUGAR'],
  'sipri-military': ['SIPRI_US_GDP', 'SIPRI_US_GOV', 'SIPRI_US_REAL', 'SIPRI_WORLD_REAL'],
}
export function csvRows(text) {
  const rows = []; let row = [], cell = '', quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '"') { if (quoted && text[i + 1] === '"') { cell += '"'; i++ } else quoted = !quoted }
    else if (!quoted && (c === ',' || c === '\n')) { row.push(cell.replace(/\r$/, '')); cell = ''; if (c === '\n') { rows.push(row); row = [] } }
    else cell += c
  }
  assert.ok(!quoted, 'Unclosed CSV quote')
  if (cell || row.length) { row.push(cell.replace(/\r$/, '')); rows.push(row) }
  return rows
}
const number = value => {
  if (value === null || value === undefined || ['', '.', '...', '…', '#N/A', 'xxx'].includes(String(value).trim())) return null
  const n = Number(value); assert.ok(Number.isFinite(n), `Invalid value: ${value}`); return n
}
const item = (id, units, observations, extra = {}) => ({ id, units, observations, ...extra })
const month = text => { const d = new Date(text); assert.ok(Number.isFinite(d.getTime()), `Invalid date: ${text}`); return d.toISOString().slice(0, 7) }

export function parseGpr(raw) {
  assert.deepEqual(raw.header, ['month', 'GPR', 'GPRT', 'GPRA'])
  return externalIds.gpr.map((id, i) => {
    assert.match(raw.labels[id], /1985:2019=100/)
    return item(id, 'index_1985_2019_100', raw.rows.map(r => ({ date: r[0], value: number(r[i + 1]) })), { definition: raw.labels[id], periodBasis: 'month' })
  })
}
export function parseGscpi(text) {
  const rows = csvRows(text).filter(r => r[0]); const header = rows.shift()
  assert.equal(header[0], 'Date'); assert.ok(header.length > 2)
  const vintage = month(`01-${header.at(-1)}`), previousVintage = month(`01-${header.at(-2)}`)
  const points = index => rows.map(r => { assert.equal(r.length, header.length, 'GSCPI column mismatch'); return { date: month(r[0]), value: number(r.at(index)) } })
  const observations = points(-1)
  const prior = points(-2).filter(p => p.date < previousVintage)
  const revised = diffObservations(prior, observations.filter(p => p.date < previousVintage))
  return { series: [item('GSCPI', 'standard_deviations', observations, { periodBasis: 'month', definition: 'Standard deviations from historical average; source-model estimates, not percent.' })], vintage, sourceVintageComparison: { from: previousVintage, to: vintage, ...summarizeChanges('GSCPI', revised), changes: revised } }
}
export function parseFao(text) {
  const rows = csvRows(text); assert.equal(rows[0][0], 'FAO Food Price Index'); assert.equal(rows[1][0], '2014-2016=100')
  assert.deepEqual(rows[2].slice(0, 7), ['Date', 'Food Price Index', 'Meat', 'Dairy', 'Cereals', 'Oils', 'Sugar'])
  const data = rows.slice(3).filter(r => r[0]?.trim())
  return externalIds['fao-food'].map((id, i) => item(id, 'index_2014_2016_100', data.map(r => ({ date: r[0], value: number(r[i + 1]) })), { periodBasis: 'month', definition: `Nominal ${rows[2][i + 1]}; international commodity prices, 2014–2016=100. Recent meat/total values include source projections and can be revised.` }))
}
export function parseSipri(raw) {
  assert.match(raw.usFootnote, /All figures for the USA are for financial year/)
  const specs = [['Share of GDP', 'SIPRI_US_GDP', 'percent_gdp', 100], ['Share of Govt. spending', 'SIPRI_US_GOV', 'percent_government', 100], ['Constant (2024) US$', 'SIPRI_US_REAL', 'million_2024_usd', 1], ['Regional totals', 'SIPRI_WORLD_REAL', 'billion_2024_usd', 1]]
  return specs.map(([sheet, id, units, factor]) => {
    const s = raw.sheets[sheet], world = id.includes('WORLD')
    assert.equal(s.row, world ? 'World' : 'United States of America'); assert.match(s.title, /SIPRI 2026/)
    if (units.includes('2024')) assert.match(s.notes.join(' '), /constant 2024/)
    if (factor === 100) assert.ok(s.cells.filter(c => typeof c.value === 'number').every(c => c.sourceFormat.includes('%')), 'Expected Excel fractions formatted as percentages')
    return item(id, units, s.cells.map(p => ({ date: p.date, value: number(p.value) === null ? null : number(p.value) * factor, sourceColor: p.sourceColor })), { sourceSheet: sheet, sourceRow: s.row, periodBasis: world ? 'calendar_year' : 'us_fiscal_year_ending_september', definition: world ? 'Official world aggregate in constant 2024 USD billions; includes source estimates; 1991 unavailable.' : raw.usFootnote, conversion: factor === 100 ? 'Excel fraction × 100 to percentage points' : 'No conversion', sourceNotes: s.notes })
  })
}
export function validateExternal(dataset, now = new Date()) {
  const { metadata: m, series } = dataset
  assert.ok(externalSources[m.id]); assert.equal(m.sourceUrl, externalSources[m.id].sourceUrl); assert.equal(m.downloadUrl, externalSources[m.id].downloadUrl)
  assert.deepEqual(series.map(s => s.id), externalIds[m.id])
  assert.equal(m.frequency, externalSources[m.id].frequency)
  assert.ok(m.license && m.attribution && m.sourceSha256?.length === 64 && m.sourceUpdatedAt && m.retrievedAt)
  assert.ok(m.sourceUpdatedAt <= now.toISOString().slice(0, 10) && m.retrievedAt <= now.toISOString().slice(0, 10), 'Future source/retrieval date')
  for (const s of series) {
    const expected = m.id === 'gpr' ? 'index_1985_2019_100' : m.id === 'gscpi' ? 'standard_deviations' : m.id === 'fao-food' ? 'index_2014_2016_100' : { SIPRI_US_GDP: 'percent_gdp', SIPRI_US_GOV: 'percent_government', SIPRI_US_REAL: 'million_2024_usd', SIPRI_WORLD_REAL: 'billion_2024_usd' }[s.id]
    assert.equal(s.units, expected); assert.ok(s.observations.length > 20)
    let prior
    for (const p of s.observations) {
      assert.match(p.date, m.frequency === 'monthly' ? /^\d{4}-(0[1-9]|1[0-2])$/ : /^\d{4}$/)
      const n = m.frequency === 'monthly' ? monthNumber(p.date) : Number(p.date)
      if (prior !== undefined) assert.equal(n - prior, 1, `${s.id}: missing or duplicate date`)
      prior = n
      assert.ok(p.date <= now.toISOString().slice(0, m.frequency === 'monthly' ? 7 : 4), 'Future date')
      assert.ok(p.value === null || Number.isFinite(p.value)); if (m.id !== 'gscpi' && p.value !== null) assert.ok(p.value >= 0)
      if (s.units.startsWith('percent') && p.value !== null) assert.ok(p.value <= 100)
    }
    const start = m.id === 'gpr' ? '1985-01' : m.id === 'gscpi' ? '1997-09' : m.id === 'fao-food' ? '1990-01' : s.id === 'SIPRI_US_GDP' || s.id === 'SIPRI_US_REAL' ? '1949' : '1988'
    assert.equal(s.observations[0].date, start, 'Unexpected start / possible truncated download')
    assert.ok(s.observations.at(-1).date >= (m.frequency === 'monthly' ? '2026-08' : '2025'), 'Truncated coverage')
    if (m.id === 'sipri-military') assert.equal(s.periodBasis, s.id.includes('WORLD') ? 'calendar_year' : 'us_fiscal_year_ending_september')
  }
  return dataset
}
export function makeSnapshot(id, series, bytes, sourceUpdatedAt, retrievedAt, extra = {}) {
  return validateExternal({ metadata: { id, ...externalSources[id], sourceUpdatedAt, retrievedAt, sourceSha256: createHash('sha256').update(bytes).digest('hex'), status: 'published_snapshot_subject_to_revision', ...extra }, series: series.map(s => ({ ...s, coverage: { start: s.observations[0].date, end: s.observations.at(-1).date } })) })
}
export function compareExternal(previous, next) {
  validateExternal(next)
  assert.equal(next.metadata.id, previous.metadata.id)
  assert.ok(next.metadata.sourceUpdatedAt >= previous.metadata.sourceUpdatedAt, 'Source version regressed')
  return next.series.map(s => {
    const before = previous.series.find(p => p.id === s.id)
    assert.equal(s.units, before.units); assert.equal(s.periodBasis, before.periodBasis)
    return { ...summarizeChanges(s.id, diffObservations(before.observations, s.observations)), changes: diffObservations(before.observations, s.observations) }
  })
}
export async function replaceBundle(output, { read, write, check = async () => {} }) {
  // Validated candidates are staged by the caller. Restore EVERY file on write/check failure.
  const originals = new Map(await Promise.all(Object.keys(output).map(async path => [path, await read(path)])))
  try { for (const [path, value] of Object.entries(output)) await write(path, value); await check() }
  catch (error) { for (const [path, value] of originals) await write(path, value); throw error }
}
