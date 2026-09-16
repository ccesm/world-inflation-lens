// Initial or explicitly reviewed annual import. Stage the output; never overwrite production here.
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { prepareExternal } from './lib/external-ingestion.mjs'
import { compareExternal } from './lib/external.mjs'
const args = process.argv.slice(2), value = flag => args[args.indexOf(flag) + 1]
if (!args.includes('--input-dir') || !args.includes('--output-dir')) throw new Error('Supply --input-dir and --output-dir for reviewed import')
const output = resolve(value('--output-dir')), checkedAt = new Date().toISOString()
const bundle = await prepareExternal({ input: value('--input-dir'), checkedAt, includeSipri: true })
await mkdir(output, { recursive: true })
const changes = []
for (const [id, snapshot] of Object.entries(bundle)) {
  let before
  try { before = JSON.parse(await readFile(`data/external/${id}.json`, 'utf8')) } catch(e) { if(e.code !== 'ENOENT') throw e }
  changes.push({ id, baseline: !before, changes: before ? compareExternal(before, snapshot) : [], sourceVintageComparison: snapshot.metadata.sourceVintageComparison || null })
  await writeFile(resolve(output, `${id}.json`), JSON.stringify(snapshot) + '\n')
}
await writeFile(resolve(output, 'import-report.json'), JSON.stringify({ checkedAt, changes }, null, 2) + '\n')
console.log(JSON.stringify(Object.fromEntries(Object.entries(bundle).map(([id,d]) => [id, d.series.map(s => ({ id:s.id, coverage:s.coverage, latest:s.observations.findLast(p=>p.value!==null) }))])), null, 2))
