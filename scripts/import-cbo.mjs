import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { parseCbo } from './lib/cbo.mjs'

// Deliberately pinned: a new forecast vintage requires review, not a weekly overwrite.
const root = new URL('../data/fiscal/', import.meta.url)
const commit = '284a95665f9f2f74ed1f482feb629b43fce323da'
const files = ['historical-2026-02.csv', 'long-term-2026-02.csv', 'historical-schema.json', 'long-term-schema.json']
const content = await Promise.all(files.map(file => readFile(new URL(`sources/${file}`, root), 'utf8')))
const historical = parseCbo(content[0], JSON.parse(content[2]), false)
const projected = parseCbo(content[1], JSON.parse(content[3]), true)
const snapshot = {
  metadata: {
    provider: 'Congressional Budget Office', vintage: '2026-02', projectionPublishedAt: '2026-02-25',
    retrievedAt: '2026-09-15', frequency: 'annual_fy', units: '% of GDP',
    projectionSource: 'https://www.cbo.gov/publication/62044', historicalSource: 'https://www.cbo.gov/publication/51134',
    originalWorkbook: 'https://www.cbo.gov/system/files/2026-02/51119-2026-02-25-LTBO-Budget.xlsx',
    repository: 'https://github.com/US-CBO/cbo-data', commit,
    projectionCsv: `https://github.com/US-CBO/cbo-data/blob/${commit}/data/budget/long_term_budget/annual_fy_2026-02.csv`,
    historicalCsv: `https://github.com/US-CBO/cbo-data/blob/${commit}/data/budget/historical_budget/annual_fy_2026-02.csv`,
    sourceHashes: Object.fromEntries(files.map((file, i) => [file, createHash('sha256').update(content[i]).digest('hex')])),
    policy: 'Current laws generally remain unchanged. Excludes effects of the Supreme Court tariff ruling of February 20, 2026.',
    transformation: 'Source deficit/surplus sign reversed: positive means deficit. All three indicators are percent of fiscal-year GDP. Publicly held debt is not gross federal debt.',
  },
  observations: [...historical, ...projected],
}
await writeFile(new URL('cbo-2026-02.json', root), JSON.stringify(snapshot, null, 2) + '\n')
console.log(`Imported ${historical.length} historical and ${projected.length} projected fiscal years from pinned CBO sources`)
