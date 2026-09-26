import assert from 'node:assert/strict'
import { cleanIds, workspaceState, workspaceHash, inRange, annualGrowth, allowGrowth, chartPath, csvCell, seriesCsv, filteredRuns, readSaved, writeSaved } from '../src/utils/workspace.js'

const catalog = [{ id: 'CPIAUCNS' }, { id: 'OPHNFB' }, { id: 'ULCNFB' }, { id: 'DFII10' }]
assert.deepEqual(cleanIds(['OPHNFB', 'bad', 'OPHNFB', 'ULCNFB', 'DFII10'], catalog, 2), ['OPHNFB', 'ULCNFB'])
const state = { ids: ['OPHNFB', 'ULCNFB'], range: '20' }
assert.deepEqual(workspaceState(workspaceHash(state), { ids: ['CPIAUCNS'], range: '5' }, catalog), state, 'Shared settings override local preferences')
assert.deepEqual(workspaceState('#/research/data?series=bad&range=bad', {}, catalog), { ids: ['CPIAUCNS'], range: '10' })
assert.deepEqual(workspaceState('#/research/data?series=&range=all', {}, catalog), { ids: [], range: 'all' })
assert.deepEqual(workspaceState('#/research/data', state, catalog), state)
globalThis.localStorage = { getItem: () => { throw Error('blocked') }, setItem: () => { throw Error('blocked') } }
assert.deepEqual(readSaved('test', []), [])
assert.equal(writeSaved('test', state), false)

const series = { id: 'TEST', units: 'Index 2017=100', frequency: 'quarterly', seasonalAdjustment: 'seasonally adjusted', sourceUrl: 'https://www.bls.gov/productivity/', retrievedAt: '2026-09-22', sourceUpdatedAt: '2026-09-03', observations: [
  { date: '2020-01', value: 100 }, { date: '2020-04', value: 0 }, { date: '2021-01', value: 110 }, { date: '2021-04', value: 120 }, { date: '2021-10', value: null }, { date: '2022-01', value: 121 },
] }
const growth = annualGrowth(series)
assert.ok(Math.abs(growth[2].value - 10) < 1e-9)
assert.equal(growth[3].value, null, 'Zero denominator stays unavailable')
assert.equal(growth[4].value, null)
assert.equal(annualGrowth({ observations: [{ date: '2020-02', value: 100 }, { date: '2021-01', value: 110 }] })[1].value, null, 'No nearest-period substitution')
assert.deepEqual(inRange(series.observations, '5', '2026-01').map(p => p.date), ['2021-01', '2021-04', '2021-10', '2022-01'])
assert.equal(allowGrowth(series), true)
assert.equal(allowGrowth({ ...series, units: 'Percent' }), false)
assert.equal(allowGrowth({ ...series, id: 'GSCPI' }), false)
const path = chartPath([{ date: '2020-01', value: 1 }, { date: '2020-04', value: 2 }, { date: '2020-10', value: 3 }, { date: '2021-01', value: null }, { date: '2021-04', value: 4 }], date => Number(date.slice(0, 4)), v => v, 'quarterly')
assert.equal((path.match(/M/g) || []).length, 3, 'Break paths at missing and absent calendar periods')
const csv = seriesCsv(series, growth, 'yoy')
assert.match(csv, /"2021-04","","yoy"/)
assert.match(csv, /https:\/\/www.bls.gov\/productivity\//)
assert.match(csv, /"2026-09-03","2026-09-22"/)
assert.equal(csvCell('=cmd()'), '"\'=cmd()"')
assert.equal(csvCell(-2), '"-2"')
const runs = [{ checkedAt: '2026-09-02', changes: [{ id: 'A', total: 0 }, { id: 'B', total: 2 }] }, { checkedAt: '2026-09-01', changes: [{ id: 'A', total: 1 }] }]
assert.deepEqual(filteredRuns(runs, 'A', true).map(r => r.checkedAt), ['2026-09-01'])
assert.equal(filteredRuns(runs, 'A', false).length, 2)
assert.equal(runs[0].changes.length, 2, 'Filtering must not modify source ledger')
console.log('PASS: workspace share/persistence, exact-period YoY, missing data, gap-aware paths, attributed CSV and revision filtering')
