// Production-browser regression for a newer UNAVAILABLE build served an older
// CURRENT response over identical accepted economic data.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'
import { workingSignalInputHash } from './lib/signalInputIdentity.mjs'
const oldFile = process.env.WIL_BROWSER_OLD_CURRENT_FILE
if (!oldFile) throw Error('OLD_PUBLIC_SIGNAL_FIXTURE_REQUIRED')
const oldBytes = fs.readFileSync(oldFile), old = JSON.parse(oldBytes)
const deployed = JSON.parse(fs.readFileSync('dist/data/signal-engine/current.json'))
assert.equal(old.status, 'CURRENT')
assert.equal(deployed.status, 'UNAVAILABLE')
assert.equal(old.inputSnapshotHash, workingSignalInputHash(process.cwd()))
const playwright = await import(process.env.WIL_PLAYWRIGHT_MODULE ? pathToFileURL(process.env.WIL_PLAYWRIGHT_MODULE) : 'playwright')
const browser = await playwright.chromium.launch({ headless: true, ...(process.env.WIL_CHROME_EXECUTABLE ? { executablePath: process.env.WIL_CHROME_EXECUTABLE } : {}) })
try {
  const url = process.env.WIL_BROWSER_URL || 'http://127.0.0.1:4173/world-inflation-lens/'
  assert(['127.0.0.1', 'localhost'].includes(new URL(url).hostname))
  const context = await browser.newContext({ viewport: { width: 390, height: 900 } })
  const page = await context.newPage()
  await page.route('**/data/signal-engine/current.json?*', route => route.fulfill({ contentType: 'application/json', body: oldBytes }))
  for (const route of ['#/home', '#/research/signal-engine']) {
    await page.goto(url + route)
    await page.locator('[role="status"]').filter({ hasText: /Signal Engine interpretation is unavailable/ }).first().waitFor()
    assert.equal(await page.locator('[data-signal-factor]').count(), 0)
    assert(!(await page.locator('main').textContent()).includes(old.brief.domestic.en))
  }
  await page.goto(url + '#/monitor?group=inflation')
  await page.locator('main h1').waitFor()
  console.log('PASS: new UNAVAILABLE build rejects old CURRENT bytes with identical economic inputs; economic page remains available.')
  await context.close()
} finally { await browser.close() }
