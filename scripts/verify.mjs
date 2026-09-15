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
import { routeFromHash, routes, primaryRoutes, routeSection, viewParameter } from '../src/utils/routing.js'
import { alignMonthly, monthsBetween, monthlyPath, monthlyCsv } from '../src/utils/drivers.js'
import { parseFredTable } from './lib/fredTable.mjs'

import { sectionLinks } from '../src/i18n/architecture.js'
import { environmentRules, descriptiveLevel } from '../src/utils/environment.js'

const root = resolve(import.meta.dirname, '..')
const raw = JSON.parse(await readFile(join(root, 'data/inflation/fred.json'), 'utf8'))
const points = raw.observations
assert.equal(points[0].date, '1913-01')
assert.ok(points.at(-1).date >= '2026-08')
for (let i = 0; i < points.length; i++) {
  assert.ok(points[i].value === null || points[i].value > 0)
  if (i) assert.equal(monthNumber(points[i].date) - monthNumber(points[i - 1].date), 1)
}
const calculated = withAnnualChange(points)
assert.ok(calculated.filter(p => p.value === null).every(p => p.inflation === null))
assert.equal(calculated[0].inflation, null)
assert.equal(withAnnualChange([{ date: '1913-01', value: 9.8 }, { date: '1914-01', value: 10 }])[1].inflation, (10 / 9.8 - 1) * 100)
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
  assert.equal(observations.length, world.metadata.endYear - world.metadata.startYear + 1)
  assert.ok(observations.every(v => v === null || Number.isFinite(v)))
}
assert.equal(valueAt({ CHN: [0.218128938439177, null] }, 'CHN', 2024, 2024), 0.218128938439177)
assert.equal(valueAt({ USA: [2.94952520485207, null] }, 'USA', 2025, 2024), null)
assert.equal(valueAt(world.values, 'CHN', 1959, 1960), null)
const ranks = rankRows(rowsAt(countries, world.values, 2024, 1960))
assert.equal(ranks.length, countries.filter(c => valueAt(world.values, c.id, 2024, 1960) !== null).length)
assert.ok(ranks.every((r, i) => i === 0 || ranks[i - 1].value >= r.value))
assert.equal(chooseDefaultYear([{ year: 2023, count: 170 }, { year: 2024, count: 174 }, { year: 2025, count: 165 }], 2025), 2024)
assert.deepEqual([null, -1, 0, 2, 4, 8, 20].map(bucketIndex), [6, 0, 1, 2, 3, 4, 5])
assert.equal(linePath([{ year: 1, value: 2 }, { year: 2, value: null }, { year: 3, value: -1 }], x => x, y => y), 'M1.00,2.00  M3.00,-1.00')
assert.equal(map.features.find(f => f.id === 'KOS').properties.countryId, 'XKX')
for (const feature of map.features) assert.ok(feature.properties.countryId === null || countries.some(c => c.id === feature.properties.countryId))
globalThis.window = { location: { hash: '#/map?country=USA&year=2024' } }
assert.equal(routeFromHash(), 'map')
console.log('PASS: World Bank coverage, source precision, missing values, ranking, colour boundaries, country joins and query routes')

const drivers = JSON.parse(await readFile(join(root, 'data/inflation/drivers.json'), 'utf8')).series
assert.deepEqual(drivers.map(s => s.id), ['CPIUFDNS', 'CPIENGNS', 'MCOILWTICO', 'FEDFUNDS', 'CUUR0000SAH1', 'CEU0500000003', 'M2SL'])
for (const source of drivers) {
  assert.equal(source.frequency, 'monthly')
  assert.equal(source.seasonalAdjustment, source.id === 'M2SL' ? 'seasonally adjusted' : 'not seasonally adjusted')
  assert.ok(source.observations.at(-1).date >= (source.id === 'M2SL' ? '2026-07' : '2026-08'))
  source.observations.forEach((point, i) => {
    assert.ok(point.value === null || Number.isFinite(point.value))
    if (i) assert.equal(monthNumber(point.date) - monthNumber(source.observations[i - 1].date), 1)
  })
}
const food = drivers[0], energy = drivers[1], oil = drivers[2], rates = drivers[3]
const [shelter, wages, money] = drivers.slice(4)
assert.equal(wages.observations[0].date, '2006-03')
for (const source of [food, energy, shelter]) {
  const yoy = withAnnualChange(source.observations)
  assert.ok(yoy.slice(0, 12).every(p => p.inflation === null))
  for (let i = 12; i < yoy.length; i++) {
    const current = source.observations[i].value, prior = source.observations[i - 12].value
    assert.equal(yoy[i].inflation, current === null || prior === null ? null : (current / prior - 1) * 100)
  }
}
for (const source of [wages, money]) {
  const growth = withAnnualChange(source.observations)
  assert.ok(growth.slice(0, 12).every(p => p.inflation === null))
  assert.equal(growth[12].inflation, (source.observations[12].value / source.observations[0].value - 1) * 100)
}
const moneyAligned = alignMonthly([{ id: money.id, measure: 'yoy_percent', points: [{ date: '2026-07', value: 5.41 }] }], ['2026-07', '2026-08'])
assert.ok(Number.isFinite(moneyAligned[0].points[0].value))
assert.equal(moneyAligned[0].points[1].value, null)
assert.match(monthlyCsv(moneyAligned, ['2026-07', '2026-08']), /M2SL_yoy_percent/)
assert.match(monthlyCsv(moneyAligned, ['2026-07', '2026-08']), /2026-08,(?:\r?\n)?$/)
assert.deepEqual(monthsBetween('2020-12', '2021-02'), ['2020-12', '2021-01', '2021-02'])
const aligned = alignMonthly([{ id: 'TEST', measure: 'rate_percent', points: [{ date: '2020-12', value: 0 }, { date: '2021-02', value: -1 }] }], monthsBetween('2020-12', '2021-02'))
assert.deepEqual(aligned[0].points.map(p => p.value), [0, null, -1])
assert.equal(monthlyPath(aligned[0].points, monthNumber, v => v).split('M').length, 3)
assert.match(monthlyCsv(aligned, monthsBetween('2020-12', '2021-02')), /2020-12,0\r\n2021-01,\r\n2021-02,-1/)
const earlyOil = alignMonthly([{ points: oil.observations }], monthsBetween('1972-01', '1976-12'))
assert.ok(earlyOil[0].points.every(p => p.value === null))
const fixture = `<table><th>Series ID</th><td>TEST</td><th>Title</th><td>Test</td><th>Source</th><td>Test source</td><th>Units</th><td>Percent</td><th>Frequency</th><td>Monthly</td><th>Seasonal Adjustment</th><td>Not Seasonally Adjusted</td><th>Date Range</th><td>2020-01-01 to 2020-03-01</td><th>Last Updated</th><td>2020-04-01</td></table><table id="data-table-observations"><th>2020-01-01</th><td>0</td></table><div id="extra-rows">#2020-02-01| .\n#2020-03-01| -2\n</div>`
assert.deepEqual(parseFredTable(fixture, 'TEST').observations.map(p => p.value), [0, null, -2])
assert.throws(() => parseFredTable(fixture.replace('#2020-02-01| .', ''), 'TEST'))
assert.throws(() => parseFredTable(fixture.replace('#2020-02-01', '#2020-01-01'), 'TEST'))
const adjustedFixture = fixture.replace('Not Seasonally Adjusted', 'Seasonally Adjusted')
assert.throws(() => parseFredTable(adjustedFixture, 'TEST'))
assert.equal(parseFredTable(adjustedFixture, 'TEST', { adjustment: 'Seasonally Adjusted', units: 'Percent' }).seasonalAdjustment, 'seasonally adjusted')
assert.throws(() => parseFredTable(fixture, 'TEST', { units: 'Dollars per Hour' }))
console.log('PASS: driver source values, monthly alignment, CPI transformations, unfilled early oil, CSV and complete table import')

// Execute the JSX components, not just the bundler. Missing runtime imports fail here.
const temp = await mkdtemp(join(root, 'node_modules', '.wil-verify-'))
try {
  await build({ configFile: false, root, logLevel: 'error', build: { ssr: 'src/App.jsx', outDir: temp, minify: false } })
  const { default: App } = await import(pathToFileURL(join(temp, 'App.js')))
  for (const language of ['en', 'zh']) {
    globalThis.localStorage = { getItem: () => language }
    for (const route of routes) {
      globalThis.window = { location: { hash: `#/${route}` } }
      const html = renderToString(React.createElement(App))
      assert.match(html, /<h1>/)
      assert.equal((html.match(/<h1>/g) || []).length, 1)
      assert.doesNotMatch(html, /NaN|Infinity|undefined/)
      assert.match(html, /site-shell/)
      assert.match(html, /class="theme-toggle"/)
      assert.match(html, /aria-pressed="false"/)
      if (route === 'us-cpi' || route === 'timeline') assert.match(html, /class="series-line"/)
      if (route === 'overview') { assert.match(html, /ranking-table/); assert.match(html, /FP.CPI.TOTL.ZG/) }
      if (route === 'sources') { assert.match(html, /data-health/); assert.equal((html.match(/class="health-card"/g) || []).length, 19) }
      if (route === 'map') { assert.match(html, /comparison-panel/); assert.match(html, /annual-line/); assert.doesNotMatch(html, /NaN|undefined%/) }
      if (route === 'drivers') { assert.match(html, /driver-line/); assert.match(html, /CPIUFDNS/); assert.match(html, /chart-share/); assert.doesNotMatch(html, /NaN|undefined%/) }
      if (['home', 'monitor', 'scenarios', 'fiscal', 'regimes', 'since-1971'].includes(route)) assert.doesNotMatch(html, /NaN|Infinity|undefined/)
      if (route === 'monitor') assert.equal((html.match(/<article>/g) || []).length, 11)
      if (route === 'home') {
        assert.match(html, /dollar-power-result/)
        assert.match(html, /value="100000"/)
        assert.match(html, /41,199/)
        assert.doesNotMatch(html, /<table|class="health-card"|class="ranking-table"/)
        assert.match(html, /2026-02-25/)
        assert.match(html, /data-cbo-segment="projected"/)
        assert.match(html, language === 'zh' ? /未来20–30年/ : /A 20–30 YEAR VIEW/)
        assert.match(html, language === 'zh' ? /不预设美元一定会崩溃/ : /does not assume that the dollar will collapse/)
        const primaryNav = html.match(/<nav class="desktop-nav"[^>]*>(.*?)<\/nav>/)[1]
        assert.equal((primaryNav.match(/<a /g) || []).length, 6)
        assert.doesNotMatch(primaryNav, /#\/monitor|#\/map|#\/sources|#\/drivers/)
        assert.equal((html.match(/<section class="ia-section"/g) || []).length, 10)
      }
      if (route === 'scenarios') assert.match(html, /411,987/)
      if (route === 'fiscal') {
        assert.match(html, /161.00/)
        assert.match(html.replace(/<!--.*?-->/g, ''), /175\.076%/)
        assert.match(html.replace(/<!--.*?-->/g, ''), /9\.134%/)
        assert.match(html.replace(/<!--.*?-->/g, ''), /6\.930%/)
        assert.match(html, /2026-02-25/)
        assert.match(html, /data-cbo-segment="actual" d="M[^"]+"/)
        assert.match(html, /data-cbo-segment="projected" d="M[^"]+"[^>]+stroke-dasharray="8 5"/)
        assert.match(html, language === 'zh' ? /关税裁决/ : /tariff ruling/)
        assert.doesNotMatch(html, /not yet been imported|尚未完成导入/)
      }
    }
    for (const hash of ['#/fiscal?metric=interest&focus=outlook', '#/fiscal?metric=deficit', '#/monitor?group=inflation', '#/monitor?group=monetary', '#/monitor?group=market', '#/map?country=USA&year=2024&focus=compare', '#/sources?focus=health']) {
      globalThis.window = { location: { hash } }
      const html = renderToString(React.createElement(App))
      assert.doesNotMatch(html, /NaN|undefined|Infinity/)
      if (hash.includes('metric=interest')) assert.match(html.replace(/<!--.*?-->/g, ''), /6\.93% GDP/)
      if (hash.includes('metric=deficit')) assert.match(html.replace(/<!--.*?-->/g, ''), /9\.13% GDP/)
      if (hash.includes('group=inflation') || hash.includes('group=monetary')) assert.equal((html.match(/<article>/g) || []).length, 3)
      if (hash.includes('group=market')) assert.equal((html.match(/<article>/g) || []).length, 4)
      if (hash.includes('focus=compare')) assert.match(html, /id="country-compare"/)
      if (hash.includes('focus=health')) assert.match(html, /id="data-status"/)
    }
    for (const topic of ['food', 'energy', 'rates', 'housing', 'wages', 'money']) {
      for (const episode of ['oil', 'volcker', 'crisis', 'pandemic']) {
        globalThis.window = { location: { hash: `#/drivers?topic=${topic}&episode=${episode}` } }
        const html = renderToString(React.createElement(App))
        assert.match(html, /driver-episode/)
        assert.match(html, /era-band/)
        assert.doesNotMatch(html, /NaN|Infinity/)
        if (topic === 'energy' && ['oil', 'volcker'].includes(episode)) assert.match(html, /driver-empty/)
        if (topic === 'wages' && ['oil', 'volcker'].includes(episode)) assert.match(html, /driver-unavailable/)
        assert.match(html, /driver-channel-grid/)
        assert.match(html, new RegExp({ housing: 'CUUR0000SAH1', wages: 'CEU0500000003', money: 'M2SL' }[topic] || 'CPIAUCNS'))
      }
    }
    globalThis.window = { location: { hash: '#/timeline?year=1979' } }
    assert.match(renderToString(React.createElement(App)), /drivers\?topic=rates&amp;episode=volcker/)
  }
  globalThis.localStorage = { getItem: () => { throw new Error('Storage blocked') } }
  globalThis.window = { location: { hash: '#/home' } }
  assert.match(renderToString(React.createElement(App)), /site-shell/)
  console.log('PASS: all sixteen views and 48 driver-topic/episode/language combinations render; history links and blocked storage work')
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

assert.deepEqual(primaryRoutes, ['home', 'dollar', 'fiscal', 'history', 'scenarios', 'research'])
for (const links of Object.values(sectionLinks)) for (const [hash] of links) {
  globalThis.window = { location: { hash } }
  assert.ok(routes.includes(routeFromHash()))
  assert.notEqual(routeFromHash(), 'home')
}
for (const route of ['monitor','regimes','since-1971','drivers','us-cpi','timeline','overview','map','sources']) {
  globalThis.window = { location: { hash: `#/${route}?example=kept` } }
  assert.equal(routeFromHash(), route)
}
assert.equal(routeSection('us-cpi'), 'dollar')
assert.equal(routeSection('regimes'), 'history')
assert.equal(routeSection('sources'), 'research')
globalThis.window = { location: { hash: '#/fiscal?metric=bogus' } }
assert.equal(viewParameter('metric', ['debt','deficit','interest'], 'debt'), 'debt')
for (const rule of environmentRules) {
  const now = new Date('2026-09-15T00:00:00Z')
  for (const [i, cutoff] of rule.thresholds.entries()) {
    assert.equal(descriptiveLevel([{date:'2026-09-14',value:cutoff}], 'daily', rule.thresholds, now), i + 1)
  }
  assert.equal(descriptiveLevel([{date:'2025-01-01',value:10}], 'daily', rule.thresholds, now), null)
  assert.equal(descriptiveLevel([{date:'2026-09-14',value:null}], 'daily', rule.thresholds, now), null)
}
console.log('PASS: six-section architecture, focused tool links, legacy hashes, compact homepage and transparent environment thresholds')
