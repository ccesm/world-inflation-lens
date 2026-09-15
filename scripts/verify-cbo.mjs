import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { parseCbo } from './lib/cbo.mjs'
import { cboCsv } from '../src/utils/cbo.js'

const root = new URL('../data/fiscal/', import.meta.url)
const snapshot = JSON.parse(await readFile(new URL('cbo-2026-02.json', root), 'utf8'))
const files = await Promise.all(['historical-2026-02.csv', 'long-term-2026-02.csv', 'historical-schema.json', 'long-term-schema.json'].map(file => readFile(new URL(`sources/${file}`, root), 'utf8')))
assert.deepEqual(snapshot.observations, [...parseCbo(files[0], JSON.parse(files[2]), false), ...parseCbo(files[1], JSON.parse(files[3]), true)])
for (const [file, hash] of Object.entries(snapshot.metadata.sourceHashes)) {
  assert.equal(createHash('sha256').update(await readFile(new URL(`sources/${file}`, root))).digest('hex'), hash)
}
assert.equal(snapshot.observations.length, 95)
assert.equal(snapshot.observations.filter(p => p.status === 'actual').length, 64)
assert.equal(snapshot.observations.filter(p => p.status === 'projected').length, 31)
assert.deepEqual(snapshot.observations.find(p => p.year === 2025), { year: 2025, status: 'actual', debt: 99.375, deficit: 5.847, interest: 3.195 })
assert.deepEqual(snapshot.observations.at(-1), { year: 2056, status: 'projected', debt: 175.076, deficit: 9.134, interest: 6.93 })
assert.ok(snapshot.observations.find(p => p.year === 2000).deficit < 0, 'Historical surpluses retain their meaning')
const schema = JSON.parse(files[3])
assert.throws(() => parseCbo(files[1] + files[1].split('\n')[1] + '\n', schema, true), /Duplicate/)
assert.throws(() => parseCbo(files[1].replace('FY2026,lt_debt_held_by_public_gdp_share,100.605\n', ''), schema, true), /Missing/)
assert.throws(() => parseCbo(files[1].replace('100.605', ''), schema, true), /Invalid/)
assert.throws(() => parseCbo(files[1].replace('FY2026,lt_deficit_total_gdp_share,-5.807', 'FY2026,lt_deficit_total_gdp_share,5.807'), schema, true), /identity/)
const wrongSchema = structuredClone(schema)
wrongSchema.fields.lt_debt_held_by_public_gdp_share.unit = 'billions'
assert.throws(() => parseCbo(files[1], wrongSchema, true), /units/)
assert.throws(() => parseCbo(files[1], { ...schema, frequency: 'annual_cy' }, true), /frequency/)
const csv = cboCsv(snapshot)
assert.equal(csv.trim().split('\r\n').length, 96)
assert.ok(csv.includes('2025,actual,99.375,5.847,3.195,2026-02,,'))
assert.ok(csv.includes('2056,projected,175.076,9.134,6.93,2026-02,2026-02-25,'))
console.log('PASS: CBO source hashes, fiscal units, complete years, history/projection boundary, deficit sign, budget identity and CSV provenance')
