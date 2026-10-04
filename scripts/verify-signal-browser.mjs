// Actual production browser acceptance. No browser dependency in the app.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { unavailableSignal } from '../src/utils/signalPublicContract.js'
const playwright = await import(process.env.WIL_PLAYWRIGHT_MODULE ? pathToFileURL(process.env.WIL_PLAYWRIGHT_MODULE) : 'playwright')
const browser = await playwright.chromium.launch({ headless: true, ...(process.env.WIL_CHROME_EXECUTABLE ? { executablePath: process.env.WIL_CHROME_EXECUTABLE } : {}) })
const url = process.env.WIL_BROWSER_URL || 'http://127.0.0.1:4173/world-inflation-lens/'
assert(['127.0.0.1', 'localhost'].includes(new URL(url).hostname))
const output = path.resolve(process.env.WIL_BROWSER_OUTPUT_DIR || '.refresh/signal-browser')
fs.mkdirSync(output, { recursive: true })
const report = { surfaces: [], fixtures: [], navigation: [], errors: [], screenshots: [], initialResources: [] }
const projection = JSON.parse(fs.readFileSync('public/data/signal-engine/current.json'))
assert.equal(projection.status, 'CURRENT')
async function newPage(width, language, theme) {
 const context = await browser.newContext({ viewport: { width, height: 1000 }, locale: language === 'zh' ? 'zh-CN' : 'en-US' })
 await context.addInitScript(({ language, theme }) => { localStorage.setItem('wil-language', language); localStorage.setItem('wil-theme', theme) }, { language, theme })
 const page = await context.newPage()
 page.on('pageerror', error => report.errors.push(error.message))
 return { context, page }
}
try {
 for (const width of [320, 390, 1280]) for (const language of ['en', 'zh']) for (const theme of ['light', 'dark']) {
  const { context, page } = await newPage(width, language, theme)
  const responses = []
  page.on('response', response => responses.push(response.url()))
  await page.goto(url + '#/home')
  await page.locator('[data-signal-status="CURRENT"]').waitFor()
  assert.equal(await page.locator('[data-page="home"] > :first-child').getAttribute('data-signal-brief'), 'true')
  assert.equal(await page.locator('[data-page="home"] > :nth-child(2)').getAttribute('class'), 'ia-hero')
  assert.equal(await page.locator('main h1, main h2, main h3').first().evaluate(node => node.tagName), 'H1')
  assert(await page.locator('[data-signal-brief]').textContent().then(t => t.includes(projection.brief.domestic[language])))
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
  assert.equal(await page.locator('html').getAttribute('data-theme'), theme)
  report.surfaces.push({ route: 'home', width, language, theme, overflow: false, briefHeight: Math.round(await page.locator('[data-signal-brief]').evaluate(e => e.getBoundingClientRect().height)) })
  if (width === 1280 && language === 'en' && theme === 'light') {
   report.initialResources = responses.filter(u => u.startsWith(new URL(url).origin)).map(u => new URL(u).pathname)
   assert(!report.initialResources.some(u => /\/SignalEngine-/.test(u)), 'FULL_ROUTE_LOADED_ON_HOME')
  }
  if (width === 1280 && language === 'en' && theme === 'light' || width === 390 && language === 'zh' && theme === 'dark') {
   const file = `home-${width}-${language}-${theme}.png`; await page.screenshot({ path: path.join(output, file) }); report.screenshots.push(file)
  }
  const cta = page.locator('[data-signal-brief] a')
  await cta.focus(); assert(await cta.evaluate(e => e === document.activeElement))
  await page.keyboard.press('Enter')
  await page.locator('[data-page="signal-engine"]').waitFor()
  assert.equal(await page.locator('[data-signal-factor]').count(), 7)
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
  assert(await page.locator('[data-page="signal-engine"]').textContent().then(t => t.includes(language === 'zh' ? '完整确认窗口' : 'complete confirmation window')))
  const summary = page.locator('.signal-factor summary').first(); await summary.focus(); await page.keyboard.press('Enter'); assert.equal(await summary.locator('..').getAttribute('open'), '')
  report.surfaces.push({ route: 'research/signal-engine', width, language, theme, overflow: false, cards: 7, keyboard: true })
  if (width === 390 && language === 'zh' && theme === 'dark') { const file = 'research-390-zh-dark.png'; await page.screenshot({ path: path.join(output, file), fullPage: true }); report.screenshots.push(file) }
  await page.goBack(); await page.locator('[data-page="home"]').waitFor(); await page.goForward(); await page.locator('[data-page="signal-engine"]').waitFor()
  await page.goto(url + '#/research/signal-engine'); await page.locator('[data-signal-factor]').first().waitFor()
  report.navigation.push({ width, language, theme, cta: true, backForward: true, direct: true })
  await context.close()
 }
 const fixtures = [
  ['UNAVAILABLE', JSON.stringify(unavailableSignal())], ['malformed', '{broken'], ['schema mismatch', JSON.stringify({ ...projection, schemaVersion: 'signal-public-shadow/1' })],
  ['restricted field', JSON.stringify({ ...projection, lineage: [] })], ['stale snapshot', JSON.stringify({ ...projection, inputSnapshotHash: '0'.repeat(64) })],
  ['forged snapshot reference', JSON.stringify({ ...projection, inputSnapshot: '0123456789' })],
  ['fabricated conclusion', JSON.stringify({ ...projection, conclusions: { ...projection.conclusions, international: { ...projection.conclusions.international, en: 'The dollar is guaranteed to strengthen.' } } })],
  ['reordered factors', JSON.stringify({ ...projection, factors: [...projection.factors].reverse() })],
 ]
 for (const [name, body] of fixtures) {
  const { context, page } = await newPage(320, 'en', 'light')
  await page.route('**/data/signal-engine/current.json?*', route => route.fulfill({ contentType: 'application/json', body }))
  await page.goto(url + '#/home'); await page.locator('[data-signal-status="UNAVAILABLE"]').waitFor()
  assert(!await page.locator('[data-signal-brief]').textContent().then(t => t.includes(projection.brief.domestic.en)))
  await page.locator('[data-signal-brief] a').click(); await page.locator('[data-page="signal-engine"] [role="status"]').waitFor(); assert.equal(await page.locator('[data-signal-factor]').count(), 0)
  report.fixtures.push({ name, failClosed: true }); await context.close()
 }
 const { context, page } = await newPage(390, 'zh', 'light')
 let release
 const pause = new Promise(resolve => { release = resolve })
 await page.route('**/data/signal-engine/current.json?*', async route => { await pause; await route.fulfill({ contentType: 'application/json', body: fs.readFileSync('public/data/signal-engine/current.json') }) })
 await page.goto(url + '#/home'); await page.locator('[data-signal-status="LOADING"]').waitFor(); release(); await page.locator('[data-signal-status="CURRENT"]').waitFor()
 await page.goto(url + '#/research'); await page.locator('.research-map-caption a[href="#/research/signal-engine"]').click(); await page.locator('[data-signal-factor]').first().waitFor()
 report.fixtures.push({ name: 'loading then current', pass: true }, { name: 'Research Map link', pass: true }); await context.close()
 assert.deepEqual(report.errors, [])
 fs.writeFileSync(path.join(output, 'acceptance.json'), JSON.stringify(report, null, 2) + '\n')
 console.log(`PASS: ${report.surfaces.length} real-browser surfaces; ${report.fixtures.length} fixtures; ${report.navigation.length} navigation/keyboard combinations.`)
} finally { await browser.close() }
