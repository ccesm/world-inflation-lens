import assert from 'node:assert/strict'
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { externalSources, parseGpr, parseGscpi, parseFao, parseSipri, makeSnapshot } from './external.mjs'

export async function prepareExternal({ input, checkedAt, includeSipri = false }) {
  const temp = await mkdtemp(join(tmpdir(), 'wil-external-'))
  const retrieved = checkedAt.slice(0, 10)
  async function download(url, file) {
    if (input) return readFile(resolve(input, file))
    let error
    for (let i = 0; i < 3; i++) try {
      const response = await fetch(url, { signal: AbortSignal.timeout(45000) })
      assert.ok(response.ok, `${url}: HTTP ${response.status}`)
      const data = Buffer.from(await response.arrayBuffer()); assert.ok(data.length < 20_000_000, 'Unexpected oversized source'); return data
    } catch (e) { error = e }
    throw error
  }
  async function workbook(kind, bytes) {
    // Test/import fixtures may supply an extracted workbook. The real pipeline always reads the official binary.
    if (input) try { return JSON.parse(await readFile(resolve(input, `${kind}-extracted.json`), 'utf8')) } catch (e) { if (e.code !== 'ENOENT') throw e }
    const path = join(temp, kind); await writeFile(path, bytes)
    const result = spawnSync(process.env.WIL_PYTHON || 'python3', [resolve(import.meta.dirname, 'extract-external.py'), kind, path], { encoding: 'utf8', maxBuffer: 10_000_000, timeout: 60000 })
    assert.equal(result.status, 0, `Workbook extraction failed: ${result.stderr}`); return JSON.parse(result.stdout)
  }
  try {
    const ids = ['gpr', 'gscpi', 'fao-food', ...(includeSipri ? ['sipri-military'] : [])]
    const bytes = Object.fromEntries(await Promise.all(ids.map(async id => [id, await download(externalSources[id].downloadUrl, externalSources[id].file)])))
    const [gprPage, faoPage] = await Promise.all([download(externalSources.gpr.sourceUrl, 'gpr.html'), download(externalSources['fao-food'].sourceUrl, 'fao.html')])
    const gprText = gprPage.toString().replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')
    const gprDate = gprText.match(/Last update:\s*([A-Za-z]+ \d{1,2},\s*\d{4})/)
    assert.ok(gprDate, 'Missing official monthly GPR update date')
    const faoDate = faoPage.toString().match(/Release date:\s*(\d{2})\/(\d{2})\/(\d{4})/)
    assert.ok(faoDate, 'Missing official FAO release date')
    const gscpi = parseGscpi(bytes.gscpi.toString())
    const output = {
      gpr: makeSnapshot('gpr', parseGpr(await workbook('gpr', bytes.gpr)), bytes.gpr, new Date(gprDate[1]).toISOString().slice(0, 10), retrieved),
      gscpi: makeSnapshot('gscpi', gscpi.series, bytes.gscpi, gscpi.vintage, retrieved, { sourceUpdatePrecision: 'release_month', sourceVintageComparison: gscpi.sourceVintageComparison }),
      'fao-food': makeSnapshot('fao-food', parseFao(bytes['fao-food'].toString()), bytes['fao-food'], `${faoDate[3]}-${faoDate[2]}-${faoDate[1]}`, retrieved),
    }
    if (includeSipri) output['sipri-military'] = makeSnapshot('sipri-military', parseSipri(await workbook('sipri', bytes['sipri-military'])), bytes['sipri-military'], '2026-04-27', retrieved, { version: '1949–2025 v1.2; manually reviewed annual release', reviewPolicy: 'Manual annual review. Do not download in weekly jobs. Update constant-dollar base and notes together.', globalBurden: null, globalBurdenNote: 'Not supplied as a time series in the imported workbook. No average of country ratios is constructed.' })
    return output
  } finally { await rm(temp, { recursive: true, force: true }) }
}
