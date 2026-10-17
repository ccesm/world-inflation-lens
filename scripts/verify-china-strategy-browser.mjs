// Published article acceptance; reuses optional browser tooling without a new dependency.
import assert from 'node:assert/strict'
import { mkdir, writeFile, readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chinaStrategyCopy as c, chinaStrategyRoute, strategySections, strategySources } from '../src/i18n/chinaMonetaryStrategy.js'
const base = process.env.WIL_BROWSER_URL, production = process.env.WIL_PRODUCTION_URL
for (const url of [base, production]) assert.ok(url && ['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname), 'Loopback URLs required')
const output = resolve(process.env.WIL_BROWSER_OUTPUT_DIR || '.refresh/china-strategy-publication/browser')
await mkdir(output, { recursive: true })
const { chromium } = await import(process.env.WIL_PLAYWRIGHT_MODULE ? pathToFileURL(resolve(process.env.WIL_PLAYWRIGHT_MODULE)) : 'playwright')
const browser = await chromium.launch({ headless: true, executablePath: process.env.WIL_CHROME_EXECUTABLE })
const report = { checkedAt: new Date().toISOString(), displays: [], interactions: [], productionGate: [], errors: [] }
async function open(page, url, hash) { await page.goto(url + hash, { waitUntil: 'networkidle' }); await page.locator('main h1').waitFor() }
try {
  for (const width of [320, 390, 1280]) for (const language of ['en', 'zh']) for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width, height: 900 } })
    await context.addInitScript(({ language, theme }) => { localStorage.setItem('wil-language', language); localStorage.setItem('wil-theme', theme) }, { language, theme })
    const page = await context.newPage()
    page.on('pageerror', error => report.errors.push(error.message))
    page.on('response', response => { if ([new URL(base).origin, new URL(production).origin].includes(new URL(response.url()).origin) && response.status() >= 400) report.errors.push(`${response.status()} ${response.url()}`) })
    await open(page, base, '#/' + chinaStrategyRoute)
    assert.equal(await page.locator('main h1').textContent(), c.title[language])
    assert.ok((await page.title()).startsWith(c.title[language]))
    assert.equal(await page.locator('[data-china-strategy] > section').count(), 7)
    assert.equal(await page.locator('.cms-diagram li').count(), 5)
    assert.equal(await page.locator('.cms-timeline li').count(), 6)
    assert.equal(await page.locator('.cms-table-wrap tbody tr').count(), 7)
    assert.equal(await page.locator('.cms-scenarios > aside').count(), 3)
    assert.equal(await page.locator('.cms-sources > ol > li').count(), 16)
    assert.equal(await page.locator('[data-china-strategy] svg').count(), 0)
    for (const [kind, label] of Object.entries(c.kinds)) assert.ok((await page.locator(`[data-evidence-kind="${kind}"]`).first().textContent()).includes(label[language]))
    const text = await page.locator('[data-china-strategy]').textContent()
    for (const fact of ['27.2%', '28.1%', '8.5%', '89.2%', '200%', '2.11%', '56.70%', '2027-Q1']) assert.ok(text.includes(fact))
    for (const source of strategySources) assert.equal(await page.locator(`#cms-source-${source.id} a`).getAttribute('href'), source.url)
    const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
    assert.ok(dimensions.scroll <= dimensions.width + 1, JSON.stringify({ width, language, theme, dimensions }))
    const minFont = await page.locator('.cms-block p').evaluateAll(nodes => Math.min(...nodes.map(n => parseFloat(getComputedStyle(n).fontSize))))
    assert.ok(minFont >= 14)
    const table = await page.locator('.cms-table-wrap').evaluate(node => ({ width: node.clientWidth, scroll: node.scrollWidth, wrap: getComputedStyle(node.querySelector('td')).whiteSpace }))
    assert.equal(table.wrap, 'normal')
    if (width === 1280) assert.ok(table.scroll <= table.width + 1, 'Desktop prose table must wrap without horizontal scrolling')
    await page.locator('.cms-diagram').screenshot({ path: resolve(output, `diagram-${width}-${language}-${theme}.png`) })
    if (width === 390 || width === 1280) await page.screenshot({ path: resolve(output, `article-${width}-${language}-${theme}.png`), fullPage: true })
    report.displays.push({ width, language, theme, dimensions, minFont })
    if (width === 1280 && theme === 'light') {
      for (const section of strategySections) {
        await page.getByRole('navigation', { name: c.navigation[language] }).getByRole('link', { name: section.title[language], exact: true }).click()
        await page.waitForFunction(id => document.activeElement?.id === id, `cms-${section.id}-title`)
      }
      const citation = page.locator('.cms-citations a').first()
      const target = new URLSearchParams((await citation.getAttribute('href')).split('?')[1]).get('focus')
      await citation.focus(); await page.keyboard.press('Enter')
      await page.waitForFunction(id => document.activeElement?.closest('li')?.id === id, target)
      await page.locator('.cms-back').click()
      await page.locator('[data-monetary-research]').waitFor()
      await page.getByRole('link', { name: c.entry[language] + ' →', exact: true }).click()
      await page.locator('[data-china-strategy]').waitFor()
      const other = language === 'en' ? 'zh' : 'en'
      await page.getByRole('button', { name: other === 'zh' ? '中文' : 'EN', exact: true }).click()
      assert.equal(await page.locator('main h1').textContent(), c.title[other])
      assert.equal(await page.locator('html').getAttribute('lang'), other === 'zh' ? 'zh-CN' : 'en')
      assert.equal(await page.locator('.cms-table-wrap tbody tr').count(), 7)
      report.interactions.push({ language, sectionFocus: 7, keyboardCitation: true, returnAndEntry: true, languageToggle: true })
      await page.getByRole('button', { name: language === 'zh' ? '中文' : 'EN', exact: true }).click()
      await open(page, production, '#/' + chinaStrategyRoute)
      assert.equal(await page.locator('[data-china-strategy]').count(), 1)
      assert.equal(await page.locator('main h1').textContent(), c.title[language])
      await open(page, production, '#/research')
      await page.getByRole('link', { name: language === 'en' ? 'Global Monetary Order' : '全球货币秩序', exact: true }).first().click()
      await page.locator('[data-monetary-research]').waitFor()
      assert.equal(await page.locator('[data-monetary-chart]').count(), 0)
      await page.getByRole('link', { name: c.entry[language] + ' →', exact: true }).click()
      await page.locator('[data-china-strategy]').waitFor()
      report.productionGate.push({ language, articlePublished: true, discoverable: true, localChartsExcluded: true })
    }
    await context.close()
    process.stdout.write(`Article display passed: ${width} ${language} ${theme}\n`)
  }
  const bundles = (await readdir('dist/assets')).filter(name => name.endsWith('.js'))
  const contents = await Promise.all(bundles.map(name => readFile(resolve('dist/assets', name), 'utf8')))
  assert.ok(contents.some(text => text.includes('cms-diagram-title') && text.includes('cms-source-')), 'Article must be included in production assets')
  assert.ok(!contents.some(text => text.includes('data-monetary-chart')), 'Local five-chart preview is not published')
  assert.deepEqual(report.errors, [])
  report.status = 'PASS'
} catch (error) { report.status = 'FAIL'; report.failure = error.stack; throw error }
finally { await writeFile(resolve(output, 'acceptance.json'), JSON.stringify(report, null, 2) + '\n'); await browser.close() }
