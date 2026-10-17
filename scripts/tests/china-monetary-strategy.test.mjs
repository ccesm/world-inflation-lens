import assert from 'node:assert/strict'
import { test, after } from 'node:test'
import { createServer } from 'vite'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFile } from 'node:fs/promises'
import * as c from '../../src/i18n/chinaMonetaryStrategy.js'
import { monetaryResearchNavigation, monetaryResearchCopy } from '../../src/i18n/monetaryResearch.js'
import { routes, routeFromHash } from '../../src/utils/routing.js'
const server = await createServer({ server: { middlewareMode: true, hmr: false }, optimizeDeps: { noDiscovery: true, entries: [] }, appType: 'custom' })
after(() => server.close())
const [{ ChinaMonetaryStrategy }, routing] = await Promise.all(['/src/pages/ChinaMonetaryStrategy.jsx', '/src/utils/routing.js'].map(p => server.ssrLoadModule(p)))
const chinaStrategyRoute = c.chinaStrategyRoute
const chinaStrategyNavigation = Object.fromEntries(['en', 'zh'].map(lang => [lang, monetaryResearchNavigation[lang][chinaStrategyRoute]]))
const sources = new Map(c.strategySources.map(s => [s.id, s]))
function pairs(value) {
  if (!value || typeof value !== 'object') return
  if ('en' in value || 'zh' in value) {
    for (const lang of ['en', 'zh']) assert.ok(typeof value[lang] === 'string' && value[lang].trim(), JSON.stringify(value))
    const nums = s => {
      let normalized = s.replaceAll('—', '–').replaceAll('十五', '15')
      ;['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].forEach((month, i) => { normalized = normalized.replaceAll(month, String(i + 1)) })
      return (normalized.match(/\d+(?:\.\d+)?/g) || []).sort()
    }
    assert.deepEqual(nums(value.en), nums(value.zh), 'Factual numbers and dates must agree in both languages')
  } else Object.values(value).forEach(pairs)
}
test('all prose has complete bilingual counterparts with matching dates and numerical facts', () => {
  Object.values(c).forEach(pairs)
  assert.deepEqual(c.chinaStrategyCopy.title, chinaStrategyNavigation)
  assert.equal(c.chinaStrategyRoute, chinaStrategyRoute)
  assert.equal(c.strategySections.length, 7)
  assert.equal(c.strategyTable.length, 7)
  assert.equal(c.strategyScenarios.length, 3)
})
test('every citation resolves and every source is an institutional link with a document date', () => {
  assert.equal(sources.size, 16)
  assert.deepEqual(c.strategySources.slice(0, 11).map(s => s.id), Array.from({ length: 11 }, (_, i) => `R${i+1}`))
  for (const source of sources.values()) {
    assert.match(source.url, /^https:\/\//)
    assert.ok(source.date)
    assert.match(new URL(source.url).hostname, /(?:gov\.cn|pbc\.gov\.cn|cips\.com\.cn|gov\.hk|imf\.org|bis\.org|hkex\.com\.hk)$/)
  }
  for (const item of [...c.strategySections.flatMap(s => s.blocks), ...c.strategyMilestones, ...c.strategyTable]) {
    assert.ok(c.chinaStrategyCopy.kinds[item.kind])
    for (const id of item.sources) assert.ok(sources.has(id), id)
  }
  for (const m of c.strategyMilestones) assert.ok(m.date <= '2026-10-17')
})
test('both rendered articles expose all seven sections, evidence labels, table, timeline and accessible diagram', () => {
  for (const language of ['en', 'zh']) {
    const html = renderToStaticMarkup(React.createElement(ChinaMonetaryStrategy, { language }))
    for (const section of c.strategySections) assert.ok(html.includes(`id="cms-${section.id}"`))
    for (const source of sources.values()) assert.ok(html.includes(`id="cms-source-${source.id}"`))
    for (const kind of Object.keys(c.chinaStrategyCopy.kinds)) assert.ok(html.includes(`data-evidence-kind="${kind}"`))
    assert.ok(html.includes('aria-labelledby="cms-diagram-title"'))
    assert.ok(html.includes('<caption>') && html.includes('scope="row"') && html.includes('scope="col"'))
    assert.equal((html.match(/<time /g) || []).length, 6)
    assert.equal(html.includes('undefined'), false)
    assert.equal(html.includes('<svg'), false)
    assert.equal(html.includes('download='), false)
  }
})
test('published research routes work in every build and preserve all existing destinations', () => {
  for (const route of ['research/global-monetary-order', chinaStrategyRoute]) {
    assert.ok(routes.includes(route))
    assert.equal(routeFromHash('#/' + route), route)
    assert.equal(routing.routeFromHash('#/' + route), route)
    assert.equal(routing.routeSection(route), 'research')
  }
  assert.deepEqual(routing.routes, routes)
  for (const route of ['research/ai-infrastructure', 'research/ai-capex', 'research/signal-engine', 'research/international-dollar', 'research/data']) assert.ok(routes.includes(route))
  Object.values(monetaryResearchCopy).forEach(pairs)
})

test('source audit covers every report reference and records access limits and editorial corrections', async () => {
  const audit = JSON.parse(await readFile(new URL('../../docs/china-monetary-strategy-source-audit.json', import.meta.url)))
  assert.equal(audit.originalReferences.length, 11)
  assert.equal(audit.originalReferences.find(s => s.id === 'R2').access, 'PARTIAL_INDEX_ONLY')
  assert.ok(audit.corrections.length >= 8)
})
