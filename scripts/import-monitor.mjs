import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parseFredTable } from './lib/fredTable.mjs'
import { monitorSources } from './lib/monitorSources.mjs'
const series = []
for (const spec of monitorSources) {
  const source = parseFredTable(await readFile(resolve(process.argv[2] || '/tmp', `wil-${spec.id}.html`), 'utf8'), spec.id, spec)
  series.push(source)
  console.log(source.id, source.observations.length, source.observations.at(-1))
}
await writeFile(new URL('../data/inflation/monitor.json', import.meta.url), JSON.stringify({ series }) + '\n')
