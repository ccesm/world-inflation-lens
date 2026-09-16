import assert from 'node:assert/strict'
import { externalFixtures } from './lib/external-fixtures.mjs'
import { readFile, writeFile, mkdir, mkdtemp, cp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { diffObservations, parseWorldBank } from './lib/refresh.mjs'
import { observationStatus, checkOverdue } from '../src/utils/dataStatus.js'
import { driverHash, readDriverLink } from '../src/utils/driverLinks.js'

const before = [{ date: '1', value: 0 }, { date: '2', value: null }, { date: '3', value: -1 }]
const after = [{ date: '1', value: 2 }, { date: '2', value: 3 }, { date: '3', value: null }, { date: '4', value: 4 }]
assert.deepEqual(diffObservations(before, after).map(p => p.kind), ['revised', 'filled', 'withdrawn', 'added'])
assert.throws(() => diffObservations(before, after.slice(1)), /removed/)
assert.throws(() => diffObservations(Array.from({ length: 40 }, (_, i) => ({ date: String(i), value: 10 })), Array.from({ length: 40 }, (_, i) => ({ date: String(i), value: i < 3 ? null : 10 }))), /5%/)
assert.equal(observationStatus([{ date: '2026-03', value: 0 }, { date: '2026-04', value: null }], 'monthly', new Date('2026-07-01')).latest, '2026-03')
assert.equal(observationStatus([{ date: '2026-03', value: 0 }], 'monthly', new Date('2026-07-01')).old, true)
assert.equal(observationStatus([{ date: '2024', value: 1 }], 'annual', new Date('2026-07-01')).old, false)
assert.equal(checkOverdue('2026-01-01T00:00:00Z', new Date('2026-01-12')), true)
assert.equal(checkOverdue('2026-01-01T00:00:00Z', new Date('2026-01-02')), false)

const episode = { id: 'oil', topic: 'energy', from: '1972-01', to: '1976-12' }
const config = { topics: ['food', 'energy', 'wages'], episodes: [episode], earliest: '1913-01', latest: '2026-08' }
const settings = { topic: 'wages', from: '2020-01', to: '2024-12', month: '2022-06', episode }
assert.deepEqual(readDriverLink(driverHash(settings), config), settings)
assert.equal(readDriverLink('#/drivers?topic=bad&from=2024-99&to=2000-01&month=1900-00', config).from, '2019-01')
assert.equal(readDriverLink('#/drivers?topic=food&from=2020-01&to=2024-12&month=2000-01', config).month, '2024-12')
assert.equal(readDriverLink('#/drivers?episode=oil', config).topic, 'energy')

// Exercise the real CLI in an isolated checkout with deterministic public-data fixtures.
const root = resolve(import.meta.dirname, '..')
const temp = await mkdtemp(join(tmpdir(), 'wil-refresh-test-'))
const read = async path => JSON.parse(await readFile(join(root, path), 'utf8'))
const files = ['data/inflation/fred.json', 'data/inflation/drivers.json', 'data/inflation/worldbank.json', 'data/updates/history.json', 'data/inflation/monitor.json', ...['gpr','gscpi','fao-food','sipri-military'].map(id => `data/external/${id}.json`)]
try {
  for (const path of [...files, 'data/countries/metadata.json', 'scripts/refresh-data.mjs', 'scripts/lib/refresh.mjs', 'scripts/lib/monitorSources.mjs', 'scripts/lib/fredTable.mjs', 'src/utils/inflation.js', 'src/utils/transmission.js', 'scripts/verify-external.mjs', 'scripts/lib/external.mjs', 'scripts/lib/external-ingestion.mjs']) {
    await mkdir(join(temp, path, '..'), { recursive: true }); await cp(join(root, path), join(temp, path))
  }
  await writeFile(join(temp, 'package.json'), JSON.stringify({type:'module',scripts:{build:'node -e "process.exit(0)"',verify:'node -e "process.exit(0)"'}}))
  const input = join(temp, 'inputs'); await mkdir(input); await externalFixtures(root, input)
  const headline = await read(files[0]), drivers = await read(files[1]), world = await read(files[2]), countries = await read('data/countries/metadata.json')
  const originalFiles = await Promise.all(files.map(path => readFile(join(temp, path), 'utf8')))
  const allSeries = [structuredClone(headline), ...drivers.series, ...(await read('data/inflation/monitor.json')).series]
  allSeries[0].observations.at(-1).value += .125
  for (const source of allSeries) {
    const fields = { 'Series ID': source.id, Title: source.title, Source: source.publisher, Units: source.units, Frequency: source.frequency.split(', ').map(s => s[0].toUpperCase()+s.slice(1)).join(', ').replace('As of wednesday', 'As of Wednesday').replace('Fiscal year', 'Fiscal Year'), 'Seasonal Adjustment': source.seasonalAdjustment === 'seasonally adjusted' ? 'Seasonally Adjusted' : 'Not Seasonally Adjusted', 'Date Range': `${source.observations[0].date.length === 7 ? source.observations[0].date + '-01' : source.observations[0].date} to ${source.observations.at(-1).date.length === 7 ? source.observations.at(-1).date + '-01' : source.observations.at(-1).date}`, 'Last Updated': source.sourceUpdatedAt }
    const html = `<table>${Object.entries(fields).map(([key, value]) => `<th>${key}</th><td>${value}</td>`).join('')}</table><table id="data-table-observations">${source.observations.map(p => `<th>${p.date.length === 7 ? p.date + '-01' : p.date}</th><td>${p.value ?? '.'}</td>`).join('')}</table>`
    await writeFile(join(input, `wil-${source.id}.html`), html)
  }
  const wrap = records => [{ pages: 1, page: 1, total: records.length, lastupdated: world.metadata.sourceUpdatedAt }, records]
  const endYear = Math.max(world.metadata.endYear, new Date().getUTCFullYear() - 1)
  const countryResponse = wrap(countries.map(c => ({ id: c.id, region: { id: 'TEST' } })))
  const response = wrap(countries.flatMap(c => Array.from({ length: endYear - world.metadata.startYear + 1 }, (_, i) => ({ indicator: { id: world.metadata.indicator }, countryiso3code: c.id, date: String(world.metadata.startYear + i), value: world.values[c.id][i] ?? null }))))
  const definition = wrap([{ id: world.metadata.indicator, name: world.metadata.title, sourceNote: world.metadata.definition, sourceOrganization: world.metadata.originalSource }])
  const parse = r => parseWorldBank(countryResponse, r, definition, world, countries, endYear, new Date().toISOString())
  assert.throws(() => parse([{ ...response[0], pages: 2 }, response[1]]), /pagination/)
  assert.throws(() => parse(wrap([...response[1].slice(1), response[1][1]])), /Duplicate/)
  await writeFile(join(input, 'wil-countries.json'), JSON.stringify(countryResponse))
  await writeFile(join(input, 'wil-indicator.json'), JSON.stringify(definition))
  await writeFile(join(input, 'wil-inflation.json'), JSON.stringify(wrap(response[1].slice(1))))
  const run = () => spawnSync(process.execPath, [join(temp, 'scripts/refresh-data.mjs'), '--input-dir', input], { encoding: 'utf8', timeout: 30000 })
  const failed = run()
  assert.notEqual(failed.status, 0)
  assert.match(failed.stderr, /Missing country-year slots/)
  assert.deepEqual(await Promise.all(files.map(path => readFile(join(temp, path), 'utf8'))), originalFiles, 'Failure must preserve every original snapshot and ledger')
  await writeFile(join(input, 'wil-inflation.json'), JSON.stringify(response))
  // A failing build must restore the complete new+old data bundle and ledger.
  await writeFile(join(temp, 'package.json'), JSON.stringify({type:'module',scripts:{build:'node -e "process.exit(1)"',verify:'node -e "process.exit(0)"'}}))
  const buildFailure = run(); assert.notEqual(buildFailure.status, 0); assert.match(buildFailure.stderr, /restoring bundle/)
  assert.deepEqual(await Promise.all(files.map(path => readFile(join(temp, path), 'utf8'))), originalFiles)
  await writeFile(join(temp, 'package.json'), JSON.stringify({type:'module',scripts:{build:'node -e "process.exit(0)"',verify:'node -e "process.exit(0)"'}}))
  const success = run(); assert.equal(success.status, 0, success.stderr)
  const ledger = JSON.parse(await readFile(join(temp, files[3]), 'utf8'))
  assert.equal(ledger.runs[0].changes[0].revised, 1)
  assert.equal(ledger.runs[0].changes.find(c=>c.id==='GPR').revised,1)
  assert.equal(await readFile(join(temp, 'data/external/sipri-military.json'),'utf8'), originalFiles.at(-1))
  assert.equal(ledger.runs[0].changes[0].examples[0].before, headline.observations.at(-1).value)
  const repeat = run(); assert.equal(repeat.status, 0, repeat.stderr)
  const repeated = JSON.parse(await readFile(join(temp, files[3]), 'utf8'))
  assert.ok(repeated.runs[0].changes.every(s => s.total === 0))
} finally { await rm(temp, { recursive: true, force: true }) }
console.log('PASS: refresh rollback, revision accounting, pagination, duplicate and missing records, repeat checks, age labels and share-link round trips')
