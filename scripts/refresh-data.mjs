import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { prepareDigitalMoney, compareBank, validatePublications } from './lib/digital-money.mjs'
import { prepareProductivity, compareProductivity } from './lib/productivity.mjs'
import { prepareExternal } from './lib/external-ingestion.mjs'
import { compareExternal, replaceBundle, validateExternal } from './lib/external.mjs'
import { parseFredTable } from './lib/fredTable.mjs'
import { monitorSources } from './lib/monitorSources.mjs'
import { diffObservations, parseWorldBank, worldPoints, summarizeChanges } from './lib/refresh.mjs'
import { writeCheckReport } from './lib/statusFiles.mjs'
import { readFileSync } from 'node:fs'

const root = resolve(import.meta.dirname, '..')
const checkedAt = new Date().toISOString()
const version=JSON.parse(readFileSync(resolve(root,'package.json'),'utf8')).version
const report={schemaVersion:1,checkStartedAt:checkedAt,checkCompletedAt:null,result:'RUNNING',seriesChecks:{},changed:false,counts:{}}
await writeCheckReport(report)
const capture=source=>{report.seriesChecks[source.id]={sourceUpdatedAt:['timestamp','date','month'].includes(source.sourceUpdatedTime?.precision)?source.sourceUpdatedTime.value:source.sourceUpdatedAt,latestAvailableObservationDate:source.observations.findLast(p=>Number.isFinite(p.value))?.date||null,checkedAt:new Date().toISOString()}}
try {
const read = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'))
const [headline, drivers, world, countries, ledger, monitor] = await Promise.all([
  read('data/inflation/fred.json'), read('data/inflation/drivers.json'), read('data/inflation/worldbank.json'), read('data/countries/metadata.json'), read('data/updates/history.json'),
  read('data/inflation/monitor.json'),
])
const inputIndex = process.argv.indexOf('--input-dir')
const input = inputIndex >= 0 ? process.argv[inputIndex + 1] : null
if (inputIndex >= 0) assert.ok(input, '--input-dir requires a directory')
async function download(url, filename, json = false) {
  if (input) {
    const text = await readFile(resolve(input, filename), 'utf8')
    return json ? JSON.parse(text) : text
  }
  let failure
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { 'User-Agent': `WorldInflationLens/${version} public-data-refresh` } })
      assert.ok(response.ok, `HTTP ${response.status}: ${url}`)
      return json ? await response.json() : await response.text()
    } catch (error) { failure = error }
  }
  throw failure
}

// Build the complete candidate in memory. A failed download or validation writes nothing.
const oldSeries = [headline, ...drivers.series, ...monitor.series]
const series = []
for (const prior of oldSeries) {
  const html = await download(`https://fred.stlouisfed.org/data/${prior.id}`, `wil-${prior.id}.html`)
  const next = parseFredTable(html, prior.id, {
    units: prior.units,
    adjustment: prior.seasonalAdjustment === 'seasonally adjusted' ? 'Seasonally Adjusted' : 'Not Seasonally Adjusted',
    positive: !['MCOILWTICO', 'FEDFUNDS', 'T5YIFR', 'DGS10', 'DFII10', 'FYFSGDA188S'].includes(prior.id),
    ...monitorSources.find(s => s.id === prior.id),
  })
  assert.ok(next.sourceUpdatedAt >= prior.sourceUpdatedAt, `${prior.id}: source date regressed`)
  assert.ok(next.observations.at(-1).date <= checkedAt.slice(0, next.frequency === 'monthly' ? 7 : 10), 'Future observation')
  next.retrievedAt = checkedAt.slice(0, 10)
  series.push(next)
  capture(next)
}
const endYear = Math.max(world.metadata.endYear, Number(checkedAt.slice(0, 4)) - 1)
const [countryResponse, response, definition] = await Promise.all([
  download(world.metadata.countriesUrl, 'wil-countries.json', true),
  download(`https://api.worldbank.org/v2/country/all/indicator/${world.metadata.indicator}?format=json&per_page=30000&date=${world.metadata.startYear}:${endYear}`, 'wil-inflation.json', true),
  download(`https://api.worldbank.org/v2/indicator/${world.metadata.indicator}?format=json`, 'wil-indicator.json', true),
])
const nextWorld = parseWorldBank(countryResponse, response, definition, world, countries, endYear, checkedAt)
assert.ok(nextWorld.metadata.sourceUpdatedAt >= world.metadata.sourceUpdatedAt, 'World Bank source date regressed')
const availableWorldYears=Object.values(nextWorld.values).flatMap(values=>values.flatMap((value,i)=>Number.isFinite(value)?[nextWorld.metadata.startYear+i]:[]))
report.seriesChecks[nextWorld.metadata.indicator]={sourceUpdatedAt:nextWorld.metadata.sourceUpdatedAt,latestAvailableObservationDate:availableWorldYears.length?String(Math.max(...new Set(availableWorldYears))):null,checkedAt:new Date().toISOString()}
const changes = series.map((next, i) => summarizeChanges(next.id, diffObservations(oldSeries[i].observations, next.observations)))
// Validate withdrawals per country as well as across the complete dataset.
for (const country of countries) {
  const points = data => data.values[country.id].map((value, i) => ({ date: String(data.metadata.startYear + i), value }))
  diffObservations(points(world), points(nextWorld))
}
changes.push(summarizeChanges(world.metadata.indicator, diffObservations(worldPoints(world), worldPoints(nextWorld))))
const external = await prepareExternal({ input, checkedAt })
validateExternal(await read('data/external/sipri-military.json')) // Annual source is intentionally not downloaded.
for (const [id, next] of Object.entries(external)) { changes.push(...compareExternal(await read(`data/external/${id}.json`), next));next.series.forEach(s=>capture({...next.metadata,...s})) }
const productivity = await prepareProductivity({ input, checkedAt })
changes.push(...compareProductivity(await read('data/productivity/series.json'), productivity))
productivity.series.forEach(capture)
const digitalBank = await prepareDigitalMoney({ input, checkedAt })
validatePublications({'stablecoins':await read('data/digital-money/stablecoins.json'),'treasury-holdings':await read('data/digital-money/treasury-holdings.json')},await read('data/digital-money/source-excerpts.json'))
capture(digitalBank)
changes.push(compareBank(await read('data/digital-money/bank-deposits.json'), digitalBank))
const runId = process.env.GITHUB_RUN_ID
const runUrl = /^\d+$/.test(runId || '') ? `https://github.com/ccesm/world-inflation-lens/actions/runs/${runId}` : null
const entry = { checkedAt, checkStartedAt:checkedAt, checkCompletedAt:null, runUrl, changes }
const nextLedger = { ...ledger, lastSuccessfulCheck: checkedAt, runs: [entry, ...ledger.runs].slice(0, 30) }
const output = {
  'data/digital-money/bank-deposits.json': digitalBank,
  'data/productivity/series.json': productivity,
  'data/inflation/fred.json': series[0],
  'data/inflation/drivers.json': { series: series.slice(1, 1 + drivers.series.length) },
  'data/inflation/monitor.json': { series: series.slice(1 + drivers.series.length) },
  'data/inflation/worldbank.json': nextWorld,
  'data/updates/history.json': nextLedger,
  ...Object.fromEntries(Object.entries(external).map(([id, data]) => [`data/external/${id}.json`, data])),
}
// Unit checks precede replacement; build and full verification gate the transaction.
const checked = spawnSync(process.execPath, [resolve(root, 'scripts/verify-external.mjs')], { cwd: root, encoding: 'utf8' })
assert.equal(checked.status, 0, checked.stderr)
await replaceBundle(Object.fromEntries(Object.entries(output).map(([path, value]) => [path, JSON.stringify(value, null, path === 'data/updates/history.json' ? 2 : undefined) + '\n'])), {
  read: path => readFile(resolve(root, path), 'utf8'),
  write: (path, value) => writeFile(resolve(root, path), value),
  check: async () => {
    for (const script of ['build', 'verify']) {
      const result = spawnSync('npm', ['run', script], { cwd: root, encoding: 'utf8', timeout: 180000, maxBuffer: 10_000_000 })
      assert.equal(result.status, 0, `${script} failed; restoring bundle: ${result.stderr} ${result.stdout}`)
    }
    // Completion is recorded only AFTER candidate build/verification pass.
    entry.checkCompletedAt=new Date().toISOString()
    nextLedger.lastSuccessfulCheckCompletedAt=entry.checkCompletedAt
    await writeFile(resolve(root,'data/updates/history.json'),JSON.stringify(nextLedger,null,2)+'\n')
  },
})
report.checkCompletedAt=entry.checkCompletedAt
report.changed=changes.some(s=>s.total>0)
report.result=report.changed?'SUCCESS_CHANGED':'SUCCESS_NO_CHANGE'
report.counts=Object.fromEntries(['added','filled','revised','withdrawn'].map(k=>[k,changes.reduce((n,s)=>n+(s[k]||0),0)]))
for(const change of changes)if(report.seriesChecks[change.id])report.seriesChecks[change.id].changed=change.total>0
await writeCheckReport(report)
console.log(JSON.stringify(entry, null, 2))
} catch(error) {
  report.result='FAILED';report.checkCompletedAt=new Date().toISOString()
  await writeCheckReport(report)
  throw error
}
