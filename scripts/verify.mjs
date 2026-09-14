import assert from 'node:assert/strict'
import { readFile, mkdtemp, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'vite'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { equivalentCost, monthNumber, withAnnualChange } from '../src/utils/inflation.js'

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
    }
  }
  globalThis.localStorage = { getItem: () => { throw new Error('Storage blocked') } }
  globalThis.window = { location: { hash: '#/home' } }
  assert.match(renderToString(React.createElement(App)), /site-shell/)
  console.log('PASS: all six views render in both languages; blocked storage does not break the app')
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
