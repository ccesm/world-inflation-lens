import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parseFredTable } from './lib/fredTable.mjs'

const folder = process.argv[2] || '/tmp'
const ids = ['CPIUFDNS', 'CPIENGNS', 'MCOILWTICO', 'FEDFUNDS', 'CUUR0000SAH1', 'CEU0500000003', 'M2SL']
const expected = {
  CUUR0000SAH1: { units: 'Index 1982-1984=100', positive: true },
  CEU0500000003: { units: 'Dollars per Hour', positive: true },
  M2SL: { units: 'Billions of Dollars', adjustment: 'Seasonally Adjusted', positive: true },
}
const series = await Promise.all(ids.map(async id => parseFredTable(await readFile(resolve(folder, `wil-${id}.html`), 'utf8'), id, expected[id])))
// All tables must validate before the snapshot is replaced.
await writeFile(new URL('../data/inflation/drivers.json', import.meta.url), JSON.stringify({ series }) + '\n')
for (const s of series) console.log(`${s.id}: ${s.observations.length} months, ${s.observations[0].date}–${s.observations.at(-1).date}; ${s.observations.filter(p => p.value === null).length} missing`)
