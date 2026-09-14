import assert from 'node:assert/strict'
import { readFile, mkdtemp, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'vite'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { equivalentCost, monthNumber, withAnnualChange } from '../src/utils/inflation.js'
import { valueAt, rowsAt, rankRows, chooseDefaultYear, bucketIndex, linePath } from '../src/utils/globalInflation.js'
import { routeFromHash } from '../src/utils/routing.js'

const root = resolve(import.meta.dirname, '..')
const raw = JSON.parse(await readFile(join(root, 'data/inflation/fred.json'), 'utf8'))
const points = raw.observations
assert.equal(points[0].date, '1913-01')
assert.equal(points.at(-1).date, '2026-08')
for (let i = 0; i < points.length; i++) {
  assert.ok(points[i].value === null || points[i].value > 0)
  if (i) assert.equal(monthNumber(points[i].date) - monthNumber(points[i - 1].date), 1)
}
const calculated = withAnnualChange(points)
assert.equal(calculated.find(p => p.date === '2025-10').inflation, null)
assert.equal(calculated[0].inflation, null)
assert.equal(calculated.find(p => p.date === '1914-01').inflation, (10 / 9.8 - 1) * 100)
assert.equal(equivalentCost(100, 100, 125), 125)
assert.equal(equivalentCost(100, 125, 100), 80)
assert.equal(equivalentCost(100, null, 125), null)
assert.equal(equivalentCost(-1, 100, 125), null)
assert.equal(equivalentCost(0, 100, 125), 0)
const gap = withAnnualChange([{date:'2020-01',value:100},{date:'2021-02',value:110}])
assert.equal(gap[1].inflation, null)
const events = JSON.parse(await readFile(join(root, 'data/history/events.json'), 'utf8'))
for (let year = 1900; year <= 2026; year++) assert.equal(events.filter(event => event.start <= year && event.end >= year).length, 1)
console.log('PASS: CPI dates, missing values, annual changes, purchasing power, historical coverage')

const world = JSON.parse(await readFile(join(root, 'data/inflation/worldbank.json'), 'utf8'))
const countries = JSON.parse(await readFile(join(root, 'data/countries/metadata.json'), 'utf8'))
const map = JSON.parse(await readFile(join(root, 'data/countries/world.geo.json'), 'utf8'))
assert.equal(world.metadata.indicator, 'FP.CPI.TOTL.ZG')
assert.equal(world.metadata.frequency, 'annual')
assert.equal(countries.length, 217)
assert.equal(new Set(countries.map(c => c.id)).size, countries.length)
assert.ok(!countries.some(c => ['WLD', 'HIC', 'EUU'].includes(c.id)))
for (const country of countries) {
  assert.ok(country.name.en && country.name.zh)
  const observations = world.values[country.id]
  assert.equal(observations.length, 66)
  assert.ok(observations.every(v => v === null || Number.isFinite(v)))
}
assert.equal(valueAt(world.values, 'CHN', 2024, 1960), 0.218128938439177)
assert.equal(valueAt(world.values, 'USA', 2024, 1960), 2.94952520485207)
assert.equal(valueAt(world.values, 'USA', 2025, 1960), null)
assert.equal(valueAt(world.values, 'AND', 2024, 1960), null)
assert.equal(valueAt(world.values, 'CHN', 1959, 1960), null)
const ranks = rankRows(rowsAt(countries, world.values, 2024, 1960))
assert.equal(ranks.length, 174)
assert.ok(ranks.every((r, i) => i === 0 || ranks[i - 1].value >= r.value))
const coverage = Array.from({ length: 66 }, (_, i) => ({ year: 1960 + i, count: rankRows(rowsAt(countries, world.values, 1960 + i, 1960)).length }))
assert.equal(chooseDefaultYear(coverage, 2025), 2024)
assert.deepEqual([null, -1, 0, 2, 4, 8, 20].map(bucketIndex), [6, 0, 1, 2, 3, 4, 5])
assert.equal(linePath([{ year: 1, value: 2 }, { year: 2, value: null }, { year: 3, value: -1 }], x => x, y => y), 'M1.00,2.00  M3.00,-1.00')
assert.equal(map.features.find(f => f.id === 'KOS').properties.countryId, 'XKX')
for (const feature of map.features) assert.ok(feature.properties.countryId === null || countries.some(c => c.id === feature.properties.countryId))
globalThis.window = { location: { hash: '#/map?country=USA&year=2024' } }
assert.equal(routeFromHash(), 'map')
console.log('PASS: World Bank coverage, source precision, missing values, ranking, colour boundaries, country joins and query routes')

// Execute the JSX components, not just the bundler. Missing runtime imports fail here.
const temp = await mkdtemp(join(root, 'node_modules', '.wil-verify-'))
try {
  await build({ configFile: false, root, logLevel: 'error', build: { ssr: 'src/App.jsx', outDir: temp, minify: false } })
  const { default: App } = await import(pathToFileURL(join(temp, 'App.js')))
  for (const language of ['en', 'zh']) {
    globalThis.localStorage = { getItem: () => language }
    for (const route of ['home', 'overview', 'timeline', 'us-cpi', 'map', 'sources']) {
      globalThis.window = { location: { hash: `#/${route}` } }
      const html = renderToString(React.createElement(App))
      assert.match(html, /<h1>/)
      assert.match(html, /site-shell/)
      assert.match(html, /class="theme-toggle"/)
      assert.match(html, /aria-pressed="false"/)
      if (route === 'us-cpi' || route === 'timeline') assert.match(html, /class="series-line"/)
      if (route === 'overview') { assert.match(html, /174/); assert.match(html, /ranking-table/); assert.match(html, /FP.CPI.TOTL.ZG/) }
      if (route === 'map') { assert.match(html, /comparison-panel/); assert.match(html, /annual-line/); assert.doesNotMatch(html, /NaN|undefined%/) }
    }
  }
  globalThis.localStorage = { getItem: () => { throw new Error('Storage blocked') } }
  globalThis.window = { location: { hash: '#/home' } }
  assert.match(renderToString(React.createElement(App)), /site-shell/)
  console.log('PASS: all six views render in both languages; blocked storage does not break the app')
  await build({ configFile: false, root, logLevel: 'error', build: { ssr: 'src/charts/WorldMap.jsx', outDir: join(temp, 'map'), minify: false } })
  const { default: WorldMap } = await import(pathToFileURL(join(temp, 'map/WorldMap.js')))
  for (const language of ['en', 'zh']) {
    const html = renderToString(React.createElement(WorldMap, { year: 2024, selected: 'CHN', language, onSelect: () => {} }))
    assert.equal((html.match(/class="map-country /g) || []).length, 176)
    assert.doesNotMatch(html, /NaN|Infinity/)
    assert.match(html, /is-selected/)
  }
  console.log('PASS: actual map component projects all 176 features in both languages')
} finally {
  await rm(temp, { recursive: true, force: true })
}

const html = await readFile(join(root, 'dist/index.html'), 'utf8')
const assets = [...html.matchAll(/(?:src|href)="([^\"]+)"/g)].map(match => match[1])
assert.ok(assets.length >= 2)
for (const asset of assets) {
  assert.ok(asset.startsWith('/world-inflation-lens/assets/'), asset)
  assert.ok(existsSync(join(root, 'dist', asset.replace('/world-inflation-lens/', ''))), asset)
}
console.log('PASS: production asset URLs use the GitHub Pages subpath and resolve in dist')

assert.match(html, /localStorage\.getItem\('wil-theme'\)/)
assert.match(html, /document\.documentElement\.dataset\.theme/)
console.log('PASS: theme is initialized before React and the theme toggle renders on every view')
