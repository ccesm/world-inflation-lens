import assert from 'node:assert/strict'
import { futurePower, purchasingPower, debtPath, relativePrice } from '../src/utils/dollar.js'
import { parseFredTable } from './lib/fredTable.mjs'
import { monitorSources } from './lib/monitorSources.mjs'
import { readFile } from 'node:fs/promises'
import { observationStatus } from '../src/utils/dataStatus.js'

assert.ok(Math.abs(futurePower(1000000, 3, 30) - 411986.7595) < .01)
assert.equal(futurePower(0, 5, 30), 0)
assert.equal(futurePower(100, 0, 30), 100)
assert.equal(futurePower(100, -100, 30), null)
assert.ok(futurePower(100, -2, 10) > 100)
assert.deepEqual(purchasingPower([{date:'2000-01',value:100},{date:'2000-02',value:null},{date:'2000-03',value:200}], '2000-01').map(p => p.value), [100,null,50])
assert.equal(purchasingPower([{ date:'2000-01',value:100 }], '2000-01')[0].value, 100)
const stable = debtPath({ debt:100, rate:4, growth:4, primary:0, years:30 })
assert.ok(stable.every(p => p.value === 100))
assert.ok(Math.abs(debtPath({ debt:100, rate:4, growth:4, primary:2, years:30 }).at(-1).value - 160) < 1e-9)
assert.ok(debtPath({ debt:100, rate:6, growth:4, primary:2, years:30 }).at(-1).value > 160)
assert.deepEqual(debtPath({ debt:100, rate:4, growth:-100, primary:2, years:30 }), [])
const prices = [{date:'2000-01',value:100},{date:'2000-02',value:200}]
assert.deepEqual(relativePrice(prices, prices, '2000-01', true).map(p => p.value), [100,100])
assert.ok(relativePrice(prices, prices, '1999-01').every(p => p.value === null))
assert.equal(observationStatus([{date:'2026-09-01',value:0}], 'daily', new Date('2026-09-15')).old, false)
assert.equal(observationStatus([{date:'2026-09-01',value:0}], 'daily', new Date('2026-09-16')).old, true)
const monitor = JSON.parse(await readFile(new URL('../data/inflation/monitor.json', import.meta.url), 'utf8'))
assert.deepEqual(monitor.series.map(s=>s.id), monitorSources.map(s=>s.id))
for (const s of monitor.series) {
  assert.ok(s.observations.length > 60)
  assert.ok(s.observations.every(p => p.value === null || Number.isFinite(p.value)))
  assert.ok(s.observations.every((p,i,a) => i === 0 || p.date > a[i-1].date))
}
const fixture = `<table><th>Series ID</th><td>TEST</td><th>Title</th><td>Test</td><th>Source</th><td>Test</td><th>Units</th><td>Percent</td><th>Frequency</th><td>Daily</td><th>Seasonal Adjustment</th><td>Not Seasonally Adjusted</td><th>Date Range</th><td>2026-09-04 to 2026-09-08</td><th>Last Updated</th><td>2026-09-09</td></table><table id="data-table-observations"><th>2026-09-04</th><td>0</td><th>2026-09-07</th><td>.</td><th>2026-09-08</th><td>-1</td></table>`
assert.deepEqual(parseFredTable(fixture,'TEST',{frequency:'Daily'}).observations.map(p=>p.value), [0,null,-1])
assert.throws(()=>parseFredTable(fixture.replace('<th>2026-09-07</th><td>.</td>',''),'TEST',{frequency:'Daily'}), /Missing weekday/)
console.log('PASS: dollar purchasing power, inflation scenarios, debt identity, relative prices, daily gaps and monitor metadata')
