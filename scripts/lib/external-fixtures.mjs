// Deterministic official-format fixtures derived from the committed snapshots; no network in tests.
import { writeFile, readFile } from 'node:fs/promises'
import { join } from 'node:path'
export async function externalFixtures(root, input) {
  const read = async id => JSON.parse(await readFile(join(root, `data/external/${id}.json`), 'utf8'))
  const gpr = await read('gpr'), fao = await read('fao-food'), gscpi = await read('gscpi')
  const raw = { header: ['month', 'GPR', 'GPRT', 'GPRA'], labels: Object.fromEntries(gpr.series.map(s => [s.id, s.definition])), rows: gpr.series[0].observations.map((p, i) => [p.date, ...gpr.series.map(s => s.observations[i].value)]) }
  raw.rows.at(-1)[1] += .5
  await writeFile(join(input, 'gpr-extracted.json'), JSON.stringify(raw)); await writeFile(join(input, 'gpr.xls'), 'isolated workbook fixture')
  await writeFile(join(input, 'gpr.html'), `Last update: ${new Date(`${gpr.metadata.sourceUpdatedAt}T00:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}`)
  const [y,m,d] = fao.metadata.sourceUpdatedAt.split('-'); await writeFile(join(input, 'fao.html'), `Release date: ${d}/${m}/${y}`)
  await writeFile(join(input, 'fao.csv'), ['FAO Food Price Index','2014-2016=100','Date,Food Price Index,Meat,Dairy,Cereals,Oils,Sugar', ...fao.series[0].observations.map((p,i) => [p.date, ...fao.series.map(s => s.observations[i].value ?? '')].join(','))].join('\n'))
  const vintage = gscpi.metadata.sourceVintageComparison
  const short = date => new Date(`${date}-01T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' }).replace(' ', '-')
  await writeFile(join(input, 'gscpi.csv'), [`Date,${short(vintage.from)},${short(vintage.to)}`, ...gscpi.series[0].observations.map(p => `${p.date}-01,${p.value ?? '#N/A'},${p.value ?? '#N/A'}`)].join('\n'))
}
