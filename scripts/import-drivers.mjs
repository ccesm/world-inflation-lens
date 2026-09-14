import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parseFredTable } from './lib/fredTable.mjs'

const folder = process.argv[2] || '/tmp'
const ids = ['CPIUFDNS', 'CPIENGNS', 'MCOILWTICO', 'FEDFUNDS']
const series = await Promise.all(ids.map(async id => parseFredTable(await readFile(resolve(folder, `wil-${id}.html`), 'utf8'), id)))
// All four tables must validate before the snapshot is replaced.
await writeFile(new URL('../data/inflation/drivers.json', import.meta.url), JSON.stringify({ series }) + '\n')
for (const s of series) console.log(`${s.id}: ${s.observations.length} months, ${s.observations[0].date}–${s.observations.at(-1).date}; ${s.observations.filter(p => p.value === null).length} missing`)
