// Optional real-browser acceptance, with no production dependency added.
// WIL_BROWSER_URL=http://127.0.0.1:4173/world-inflation-lens/
// WIL_PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs
// WIL_CHROME_EXECUTABLE=/absolute/path/to/chrome
// WIL_BROWSER_OUTPUT_DIR=.refresh/browser-acceptance
// --baseline permits measuring the unchanged production V0.13 home for comparison.
import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { routes, primaryRoutes, routeSection } from '../src/utils/routing.js'
import { cboCopy } from '../src/i18n/cbo.js'
import { dollarCopy } from '../src/i18n/dollar.js'
import { driversCopy } from '../src/i18n/drivers.js'
import { digitalCopy } from '../src/i18n/digitalMoney.js'
import { workspaceCopy } from '../src/i18n/workspace.js'
import { aiCopy } from '../src/i18n/productivity.js'
import { statusCopy } from '../src/i18n/systemStatus.js'
import { seriesMetadata } from '../src/data/seriesContract.js'
import { emptySystemStatus } from '../src/utils/systemStatus.js'
import { environmentRules } from '../src/utils/environment.js'

const readJson = async path => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'))
const [cbo, cpi, productivity, stablecoins, treasury, app, monitor] = await Promise.all([
  '../data/fiscal/cbo-2026-02.json', '../data/inflation/fred.json', '../data/productivity/series.json',
  '../data/digital-money/stablecoins.json', '../data/digital-money/treasury-holdings.json', '../package.json',
  '../data/inflation/monitor.json',
].map(readJson))
const digitalFacts = [...stablecoins.records, ...treasury.records]

const baseline = process.argv.includes('--baseline')
const baseUrl = process.env.WIL_BROWSER_URL
assert.ok(baseUrl, 'Supply WIL_BROWSER_URL pointing to the locally served production build')
const url = new URL(baseUrl)
assert.ok(baseline || ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname), 'Acceptance must use the local production build')
const playwright = process.env.WIL_PLAYWRIGHT_MODULE
  ? await import(pathToFileURL(resolve(process.env.WIL_PLAYWRIGHT_MODULE)))
  : await import('playwright')
const output = resolve(process.env.WIL_BROWSER_OUTPUT_DIR || '.refresh/browser-acceptance')
await mkdir(output, { recursive: true })
const browser = await playwright.chromium.launch({
  headless: true,
  ...(process.env.WIL_CHROME_EXECUTABLE ? { executablePath: process.env.WIL_CHROME_EXECUTABLE } : {}),
})
const report = { mode: baseline ? 'production-baseline' : 'local-production-acceptance', url: url.origin + url.pathname, checkedAt: new Date().toISOString(), homes: [], routes: [], keyboard: [], behaviors: [], statusFixtures: [], errors: [], screenshots: [] }
const trackedErrors = []
function track(page) {
  const sameOrigin = resource => {
    try { return new URL(resource).origin === url.origin } catch { return false }
  }
  page.on('pageerror', error => trackedErrors.push({ type: 'runtime', url: page.url(), message: error.message }))
  page.on('console', message => {
    if (message.type() !== 'error') return
    // An unavailable optional public status endpoint has its own visible fallback;
    // an external network failure is not a local runtime exception.
    const location = message.location().url
    if (!location || sameOrigin(location)) trackedErrors.push({ type: 'console', url: page.url(), resource: location || null, message: message.text() })
  })
  page.on('response', response => {
    if (sameOrigin(response.url()) && response.status() >= 400) trackedErrors.push({ type: 'response', url: response.url(), message: `Local asset HTTP ${response.status()}` })
  })
  page.on('requestfailed', request => {
    if (sameOrigin(request.url())) trackedErrors.push({ type: 'request', url: request.url(), message: request.failure()?.errorText || 'Local request failed' })
  })
}
async function viewportBounds(page) {
  return page.evaluate(() => {
    const width = document.documentElement.clientWidth
    return {
      width,
      scrollWidth: document.documentElement.scrollWidth,
      offenders: [...document.querySelectorAll('main *')].filter(element => {
        const box = element.getBoundingClientRect()
        return box.width && (box.right > width + 1 || box.left < -1) && getComputedStyle(element).position !== 'fixed'
      }).slice(0, 12).map(element => `${element.tagName}.${element.className?.baseVal ?? element.className}`),
    }
  })
}
async function assertNoOverflow(page, label) {
  const bounds = await viewportBounds(page)
  assert.ok(bounds.scrollWidth <= bounds.width + 1, `${label}: page overflow ${JSON.stringify(bounds)}`)
}
async function settle(page, hash) {
  await page.goto(`${baseUrl}${hash}`, { waitUntil: 'networkidle' })
  await page.locator('main h1').waitFor()
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
}
async function settleTransitions(page) {
  await page.evaluate(() => Promise.all(document.getAnimations()
    .filter(animation => animation.effect?.getTiming().iterations !== Infinity)
    .map(animation => animation.finished.catch(() => {}))))
}

// Parse exports independently of the application CSV serializers, including
// quoted commas/newlines. Assertions below compare the downloaded data to the
// retained source observations, rather than merely checking a filename.
function csvRecords(contents) {
  const rows = [], row = []
  let cell = '', quoted = false
  const text = contents.replace(/^\uFEFF/, '')
  for (let i = 0; i < text.length; i++) {
    const character = text[i]
    if (character === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++ } else quoted = !quoted
    } else if (!quoted && (character === ',' || character === '\n' || character === '\r')) {
      row.push(cell); cell = ''
      if (character !== ',') {
        rows.push([...row]); row.length = 0
        if (character === '\r' && text[i + 1] === '\n') i++
      }
    } else cell += character
  }
  assert.equal(quoted, false, 'CSV quotes must balance')
  if (cell || row.length) { row.push(cell); rows.push(row) }
  const header = rows.shift()
  assert.ok(header?.length > 1, 'CSV has a header')
  return rows.map(values => {
    assert.equal(values.length, header.length, 'CSV row width matches its header')
    return Object.fromEntries(header.map((key, i) => [key, values[i]]))
  })
}
async function downloadCsv(page, button, filename) {
  const pendingDownload = page.waitForEvent('download')
  await button.click()
  const download = await pendingDownload
  assert.equal(await download.failure(), null)
  assert.match(download.suggestedFilename(), filename)
  return csvRecords(await readFile(await download.path(), 'utf8'))
}
async function metadataValue(scope, label) {
  return scope.locator('dt').filter({ hasText: new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }).locator('xpath=following-sibling::dd[1]').textContent()
}
async function assertFocused(page, id) {
  await page.waitForFunction(id => {
    const section = document.getElementById(id)
    return section && (document.activeElement === section || section.contains(document.activeElement))
  }, id)
  const bounds = await page.locator(`#${id}`).boundingBox()
  assert.ok(bounds && bounds.y < 844 && bounds.y + bounds.height > 0, `${id}: focused destination intersects viewport`)
}
async function assertSeriesStatus(page, source, language) {
  const t = statusCopy[language], metadata = seriesMetadata(source)
  const panel = page.locator(`[data-series-status="${source.id}"]`).first()
  await panel.locator('summary').click()
  const state = await panel.getAttribute('data-freshness')
  assert.ok(t.states[state], `${source.id}: recognized freshness state`)
  assert.equal(await panel.locator('.freshness-label').textContent(), t.states[state])
  assert.equal(await metadataValue(panel, t.automation), metadata.automationType)
  assert.equal(await metadataValue(panel, t.observation), metadata.observationDate.value || t.unknown)
  for (const [field, label] of [['sourceUpdatedAt', t.updated], ['retrievedAt', t.retrieved]]) {
    const time = metadata[field]
    const value = time.value ? time.value.replace('T', ' ').replace('Z', ' UTC') : t.unknown
    assert.equal(await metadataValue(panel, label), `${value} · ${time.precision}`, `${source.id}: ${field} preserves date precision`)
  }
  if (metadata.automationType === 'MANUAL_REVIEWED') {
    assert.ok(['MANUAL_REVIEWED', 'MANUAL_REVIEW_REQUIRED'].includes(state), 'Automatic checks do not promote manual evidence to live data')
    assert.equal(await metadataValue(panel, t.reviewed), metadata.reviewedAt.value || t.unknown)
  }
  if (metadata.automationType === 'FIXED_VINTAGE') {
    assert.equal(state, 'FIXED_VINTAGE')
    assert.equal(await metadataValue(panel, t.vintage), metadata.vintage)
    assert.equal(await metadataValue(panel, t.published), metadata.publicationDate.value)
  }
}
async function checkHome(width, language, theme) {
  const context = await browser.newContext({ viewport: { width, height: 844 }, deviceScaleFactor: 1, colorScheme: theme })
  await context.addInitScript(({ language, theme }) => {
    if (!localStorage.getItem('wil-language')) localStorage.setItem('wil-language', language)
    if (!localStorage.getItem('wil-theme')) localStorage.setItem('wil-theme', theme)
  }, { language, theme })
  const page = await context.newPage()
  track(page)
  await settle(page, '#/home')
  await assertNoOverflow(page, `home ${width}/${language}/${theme}`)
  assert.equal(await page.locator('html').getAttribute('lang'), language === 'zh' ? 'zh-CN' : 'en')
  assert.equal(await page.locator('html').getAttribute('data-theme'), theme)
  const selector = baseline ? '.ia-summary article strong' : '#current-evidence [data-observed-value]'
  const firstValue = page.locator(selector).first()
  await firstValue.waitFor({ state: 'attached' })
  const measured = await firstValue.evaluate(element => ({ y: Math.round(element.getBoundingClientRect().top + window.scrollY), value: element.textContent.trim() }))
  const assets = await page.evaluate(() => performance.getEntriesByType('resource')
    .filter(resource => /\.(js|css)(?:\?|$)/.test(new URL(resource.name).pathname))
    .map(resource => ({ file: new URL(resource.name).pathname.split('/').at(-1), transferredBytes: resource.transferSize, encodedBytes: resource.encodedBodySize, decodedBytes: resource.decodedBodySize })))
  const row = { width, language, theme, firstEvidenceY: measured.y, firstValue: measured.value, pageHeight: await page.evaluate(() => document.documentElement.scrollHeight), assets, assetBytes: assets.reduce((sum, resource) => sum + resource.encodedBytes, 0) }
  if (!baseline) {
    assert.ok(measured.value.match(/\d/), 'The measured evidence is an actual value')
    for (const outcome of ['domestic', 'international']) await page.locator(`[data-dollar-outcome="${outcome}"]`).waitFor({ state: 'visible' })
    const sequence = await page.evaluate(() => ['[data-dollar-outcome="international"]', '#research-map', '#current-evidence', '[data-research-theme]'].map(selector => document.querySelector(selector)?.getBoundingClientRect().top + window.scrollY))
    assert.ok(sequence.every(Number.isFinite) && sequence.every((value, index) => !index || value > sequence[index - 1]), 'Home explanatory order')
    if (width === 390) assert.ok(measured.y <= 2000, `First real evidence must be early at 390px: ${measured.y}px`)
    const map = page.locator('#research-map')
    const mapBounds = await map.boundingBox()
    assert.ok(mapBounds.x >= 0 && mapBounds.x + mapBounds.width <= width + 1, 'Map fits viewport')
    for (const stage of ['structural', 'transmission', 'policy', 'market', 'outcomes']) await map.locator(`[data-research-stage="${stage}"]`).waitFor({ state: 'visible' })
    const cards = page.locator('#current-evidence article[data-evidence-series]')
    assert.ok(await cards.count() >= 3 && await cards.count() <= 5)
    for (let i = 0; i < await cards.count(); i++) {
      const card = cards.nth(i)
      assert.ok((await card.locator('[data-observation-date]').textContent()).match(/\d{4}/))
      assert.ok(await card.locator('[data-freshness]').getAttribute('data-freshness'))
      assert.ok(await card.locator('a[href^="https://"]').count())
    }
    if (width === 390 && language === 'en' && theme === 'light') {
      const originalHash = await page.evaluate(() => location.hash)
      const skip = page.locator('.skip-link')
      await skip.focus()
      await page.keyboard.press('Enter')
      await page.waitForFunction(() => document.activeElement?.id === 'main-content')
      assert.equal(await page.evaluate(() => location.hash), originalHash, 'Skip does not change route')
      report.keyboard.push('Skip-to-main preserves route and moves keyboard focus')
      const nav = page.locator('.mobile-nav')
      for (const route of primaryRoutes.filter(route => route !== 'home')) {
        await nav.locator(`a[href="#/${route}"]`).focus()
        await page.keyboard.press('Enter')
        await page.waitForFunction(route => location.hash === `#/${route}` && document.activeElement?.tagName === 'H1', route)
        assert.equal(await nav.locator(`a[href="#/${route}"]`).getAttribute('aria-current'), 'page')
      }
      report.keyboard.push('All primary links activate with Enter and focus the route heading')
      await settle(page, '#/home')
      await page.locator('.language-toggle button').filter({ hasText: '中文' }).click()
      assert.equal(await page.locator('html').getAttribute('lang'), 'zh-CN')
      await page.locator('.theme-toggle').click()
      assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark')
      await page.reload({ waitUntil: 'networkidle' })
      assert.equal(await page.locator('html').getAttribute('lang'), 'zh-CN')
      assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark')
      report.keyboard.push('Language and theme controls persist through reload')
      await page.locator('.language-toggle button').filter({ hasText: 'EN', exact: true }).click()
      await page.locator('.theme-toggle').click()
      await settleTransitions(page)
    }
  }
  if (width === 390 || width === 1280) {
    const screenshot = `${baseline ? 'baseline' : 'v1'}-${width}-${language}-${theme}.png`
    await page.screenshot({ path: resolve(output, screenshot), fullPage: true, animations: 'disabled' })
    report.screenshots.push(screenshot)
    if (!baseline && width === 390 && ((language === 'en' && theme === 'light') || (language === 'zh' && theme === 'dark'))) {
      const viewportScreenshot = `v1-viewport-${width}-${language}-${theme}.png`
      await page.evaluate(() => scrollTo(0, 0))
      await page.screenshot({ path: resolve(output, viewportScreenshot), animations: 'disabled' })
      report.screenshots.push(viewportScreenshot)
    }
  }
  report.homes.push(row)
  console.log(`PASS: ${report.mode} home ${width}px ${language}/${theme}; first dated value y=${measured.y}px`)
  await context.close()
}

async function checkCbo(page, language) {
  const t = cboCopy[language]
  await settle(page, '#/fiscal?metric=interest&focus=outlook')
  await assertFocused(page, 'fiscal-outlook')
  const outlook = page.locator('.cbo-outlook')
  assert.equal(await outlook.getByRole('button', { name: t.interest, exact: true }).getAttribute('aria-pressed'), 'true', 'Fiscal metric query selects net interest')
  assert.equal(await outlook.locator('[data-cbo-segment="projected"]').getAttribute('stroke-dasharray'), '8 5')
  assert.equal(await outlook.locator('[data-cbo-segment="actual"]').getAttribute('stroke-dasharray'), null)
  for (const status of ['actual', 'projected']) assert.ok(await outlook.locator(`[data-cbo-segment="${status}"]`).getAttribute('d'), `${status}: plotted values are present`)
  await outlook.locator('details.data-table summary').click()
  for (const year of [1962, 2025, 2026, 2056]) {
    const expected = cbo.observations.find(row => row.year === year)
    const row = outlook.getByRole('row').filter({ has: page.getByRole('rowheader', { name: String(year), exact: true }) })
    assert.equal(await row.getByRole('cell').first().textContent(), t[expected.status])
    const numbers = await row.getByRole('cell').allTextContents()
    assert.deepEqual(numbers.slice(1).map(value => Number(value.replace(/[,%]/g, ''))), ['debt', 'deficit', 'interest'].map(key => Number(expected[key].toFixed(3))))
  }
  const exported = await downloadCsv(page, outlook.getByRole('button', { name: t.download, exact: false }), /^CBO-fiscal-1962-2056-vintage-/)
  assert.deepEqual(exported.map(row => Number(row.fiscal_year)), cbo.observations.map(row => row.year), 'CSV preserves every CBO fiscal year in order')
  for (let i = 0; i < exported.length; i++) {
    const row = exported[i], expected = cbo.observations[i]
    assert.equal(row.status, expected.status)
    assert.deepEqual([row.debt_held_by_public_pct_gdp, row.deficit_positive_pct_gdp, row.net_interest_pct_gdp].map(Number), [expected.debt, expected.deficit, expected.interest])
    assert.equal(row.vintage, cbo.metadata.vintage)
    assert.equal(row.projection_published, expected.status === 'projected' ? cbo.metadata.projectionPublishedAt : '')
    assert.equal(row.source, expected.status === 'projected' ? cbo.metadata.projectionCsv : cbo.metadata.historicalCsv)
  }
  await outlook.getByRole('button', { name: t.future, exact: true }).click()
  assert.equal(await outlook.locator('input[type="range"]').getAttribute('min'), '2026')
  assert.equal(await outlook.locator('tbody th').first().textContent(), '2026')
  await outlook.getByRole('button', { name: t.all, exact: true }).click()
  await outlook.locator('input[type="range"]').focus()
  await page.keyboard.press('Home')
  assert.equal(await outlook.locator('input[type="range"]').inputValue(), '1962', 'CBO inspection works with keyboard')
  await assertNoOverflow(page, `expanded CBO table ${language}`)
  report.behaviors.push({ language, check: 'CBO metric query, solid/dashed segments, full history/projection CSV with values and provenance, keyboard year inspection' })

  await settle(page, '#/fiscal?focus=model')
  await assertFocused(page, 'fiscal-model')
  const model = page.locator('#fiscal-model'), d = dollarCopy[language]
  for (const [key, value] of Object.entries({ debt: '100', rate: '4', growth: '4', primary: '2', years: '10' })) await model.getByLabel(d[key], { exact: true }).fill(value)
  assert.equal(Number((await model.locator('p > strong').textContent()).replace(/[,%]/g, '')), 120, 'Equal financing cost and nominal growth leaves only the primary deficit contribution')
  await model.getByLabel(d.years, { exact: true }).fill('1.5')
  await model.getByRole('alert').waitFor({ state: 'visible' })
  assert.equal(await model.locator('.debt-plot').count(), 0, 'Invalid scenario does not retain a misleading chart')
  report.behaviors.push({ language, check: 'Debt model arithmetic and invalid-input handling' })
}

async function checkQueriesAndCalculators(page, language) {
  const d = dollarCopy[language], w = workspaceCopy[language], a = aiCopy[language]
  await checkCbo(page, language)

  await settle(page, '#/map?country=USA&year=2024&focus=compare')
  await assertFocused(page, 'country-compare')
  assert.equal(await page.locator('.global-year select').inputValue(), '2024')
  assert.equal(await page.locator('.country-select select').first().inputValue(), 'USA')
  assert.match(await page.locator('.country-detail .eyebrow').textContent(), /USA/)

  await settle(page, '#/drivers?topic=energy&episode=oil')
  const driver = driversCopy[language]
  assert.equal(await page.locator('.drivers-tabs').getByRole('button', { name: driver.topics.energy }).getAttribute('aria-pressed'), 'true')
  assert.equal(await page.locator('.episode-buttons').getByRole('button', { name: driver.episodes.oil, exact: true }).getAttribute('aria-pressed'), 'true')
  assert.equal(await page.locator('.driver-date-controls').getByLabel(driver.from).inputValue(), '1972-01')
  assert.equal(await page.locator('.driver-date-controls').getByLabel(driver.to).inputValue(), '1976-12')
  await settle(page, '#/drivers?topic=rates&from=1978-01&to=1984-12&month=1982-12')
  assert.equal(await page.locator('.driver-inspect input[type="month"]').inputValue(), '1982-12')
  assert.equal(await page.locator('.drivers-tabs').getByRole('button', { name: driver.topics.rates }).getAttribute('aria-pressed'), 'true')
  const driversCsv = await downloadCsv(page, page.locator('.driver-download'), /^US-inflation-drivers-rates-1978-01-1984-12\.csv$/)
  assert.ok(driversCsv.some(row => Object.values(row).includes('1982-12')), 'Driver export contains the selected month')

  await settle(page, '#/timeline?year=1979')
  assert.equal(await page.locator('.year-selector input').inputValue(), '1979')
  assert.equal(await page.locator('.year-selector output').textContent(), '1979')
  await page.locator('.year-selector input').focus()
  await page.keyboard.press('ArrowRight')
  assert.equal(await page.locator('.year-selector output').textContent(), '1980')
  report.behaviors.push({ language, check: 'Map country/year, Drivers topic/episode/range/inspection/CSV, Timeline year and keyboard adjustment' })

  const ids = ['OPHNFB', 'ULCNFB', 'COMPNFB']
  await settle(page, '#/research/data?series=OPHNFB,ULCNFB,COMPNFB&range=5')
  assert.deepEqual(await page.locator('[data-workspace-series]').evaluateAll(elements => elements.map(element => element.dataset.workspaceSeries)), ids)
  const range = page.locator('section[aria-labelledby="workspace-title"]').getByRole('combobox', { name: w.range, exact: true })
  assert.equal(await range.inputValue(), '5')
  const panel = page.locator('[data-workspace-series="OPHNFB"]')
  await panel.getByRole('combobox', { name: w.measure, exact: true }).selectOption('yoy')
  const exported = await downloadCsv(page, panel.getByRole('button', { name: w.csv, exact: true }), /^OPHNFB-yoy\.csv$/)
  const raw = productivity.series.find(series => series.id === 'OPHNFB')
  const rawByDate = new Map(raw.observations.map(point => [point.date, point.value]))
  for (const row of exported) {
    assert.equal(row.series, 'OPHNFB')
    assert.equal(row.measure, 'yoy')
    const previous = rawByDate.get(String(Number(row.period.slice(0, 4)) - 1) + row.period.slice(4)), current = rawByDate.get(row.period)
    if (Number.isFinite(current) && previous > 0) assert.ok(Math.abs(Number(row.value) - (current / previous - 1) * 100) < 1e-9, `Exact-calendar YoY ${row.period}`)
    else assert.equal(row.value, '', 'Missing inputs stay blank in CSV')
    assert.equal(row.source, raw.sourceUrl)
  }
  assert.ok(exported.length, 'Selected workspace range exports observations')
  await range.selectOption('10')
  await panel.getByRole('button', { name: `${w.remove} OPHNFB`, exact: true }).click()
  const shared = new URL(await page.locator('.chart-share input').inputValue())
  const parameters = new URLSearchParams(shared.hash.split('?')[1])
  assert.equal(parameters.get('series'), 'ULCNFB,COMPNFB')
  assert.equal(parameters.get('range'), '10')
  await settle(page, '#/research/data')
  assert.deepEqual(await page.locator('[data-workspace-series]').evaluateAll(elements => elements.map(element => element.dataset.workspaceSeries)), ['ULCNFB', 'COMPNFB'], 'Workspace selection persists without a query')
  report.behaviors.push({ language, check: 'Workspace query selection/range, exact-period YoY CSV, share URL and saved selection' })

  for (const group of ['inflation', 'monetary', 'market']) {
    const expected = { inflation: ['CPIAUCNS', 'PCEPILFE', 'T5YIFR'], monetary: ['WALCL', 'M2SL', 'DFII10'], market: ['DTWEXBGS', 'DGS10', 'DFII10', 'T5YIFR'] }[group]
    await settle(page, `#/monitor?group=${group}`)
    const actual = await page.locator('.monitor-grid article > a[href*="/series/"]').evaluateAll(links => links.map(link => new URL(link.href).pathname.split('/').at(-1)))
    assert.deepEqual(actual.sort(), expected.sort(), `Monitor ${group} query filters actual series`)
    if (group === 'monetary') {
      assert.notEqual(await page.locator('[data-series-status="M2SL"]').getAttribute('data-freshness'), 'UNKNOWN', 'M2 preserves its contracted observation date')
    }
  }
  const pricing = page.locator('[data-derived-concept="10y-breakeven"]')
  const nominalSource = monitor.series.find(series => series.id === 'DGS10'), realSource = monitor.series.find(series => series.id === 'DFII10')
  const nominalByDate = new Map(nominalSource.observations.map(point => [point.date, point.value]))
  const realByDate = new Map(realSource.observations.map(point => [point.date, point.value]))
  const dates = [...new Set([...nominalByDate.keys(), ...realByDate.keys()])].sort()
  const matchedDate = dates.findLast(date => Number.isFinite(nominalByDate.get(date)) && Number.isFinite(realByDate.get(date)))
  assert.ok(matchedDate, 'Treasury sources contain an exact-date pair')
  assert.equal(await pricing.locator('.treasury-matched-date strong').textContent(), matchedDate)
  const matched = [nominalByDate.get(matchedDate), realByDate.get(matchedDate)]
  const displayed = await pricing.locator('.treasury-pricing-equation article > strong').allTextContents()
  assert.deepEqual(displayed.map(value => parseFloat(value)), [...matched, matched[0] - matched[1]].map(value => Number(value.toFixed(2))), 'Displayed Treasury equation uses yields from the same date')
  const pricingScreenshot = `v1-treasury-${language}.png`
  await pricing.screenshot({ path: resolve(output, pricingScreenshot), animations: 'disabled' })
  report.screenshots.push(pricingScreenshot)
  await pricing.locator('details.data-table > summary').click()
  const calculationRows = pricing.locator('tbody tr')
  const recentDates = dates.slice(-20)
  assert.deepEqual(await calculationRows.locator('th').allTextContents(), recentDates)
  for (let i = 0; i < recentDates.length; i++) {
    const date = recentDates[i], nominal = nominalByDate.get(date), real = realByDate.get(date)
    const expected = [nominal, real, Number.isFinite(nominal) && Number.isFinite(real) ? nominal - real : null]
    const cells = await calculationRows.nth(i).locator('td').allTextContents()
    assert.deepEqual(cells.map(value => value === '—' ? null : Number(value)), expected.map(value => Number.isFinite(value) ? Number(value.toFixed(2)) : null), `Treasury exact-date calculation ${date}; missing inputs remain missing`)
  }
  for (const source of [nominalSource, realSource]) {
    assert.equal(await pricing.locator(`a[href="${source.sourceUrl}"]`).count(), 1)
    await assertSeriesStatus(page, source, language)
  }
  await assertNoOverflow(page, `expanded Treasury calculation table ${language}`)
  report.behaviors.push({ language, check: 'Treasury matched-date arithmetic, recent calculation rows/nulls, input source provenance and freshness' })
  await settle(page, '#/external-shocks?topic=energy')
  assert.deepEqual((await page.locator('[data-indicator]').evaluateAll(elements => elements.map(element => element.dataset.indicator))).sort(), ['energy-cpi', 'natural-gas', 'oil'])
  assert.equal(await page.locator('.shock-topic-links a[href$="topic=energy"]').getAttribute('aria-current'), 'page')
  await settle(page, '#/external-shocks?topic=shipping')
  assert.equal(await page.locator('[data-indicator="freight"]').getAttribute('data-status'), 'planned')
  assert.equal(await page.locator('[data-indicator="freight"] strong').count(), 0, 'Planned research has no placeholder value')

  await settle(page, '#/research/ai-productivity?focus=labor')
  await assertFocused(page, 'ai-labor')
  for (const id of ids) await page.locator(`#ai-labor [data-series="${id}"]`).waitFor({ state: 'visible' })
  await page.locator('#ai-labor > label select').selectOption('5')
  for (const id of ids) assert.ok((await page.locator(`#ai-labor [data-series="${id}"] svg title`).textContent()).includes(a.yoy), 'Labor charts preserve a common YoY measure')
  await page.locator('.ai-jump a[href$="focus=investment"]').focus()
  await page.keyboard.press('Enter')
  await assertFocused(page, 'ai-investment')
  assert.ok(await page.locator('#ai-investment .ai-status strong').count(), 'Investment charts retain proxy qualifications')

  await settle(page, '#/research/digital-money?focus=deposits')
  await assertFocused(page, 'dm-deposits')
  const bank = page.locator('[data-bank-series]'), dm = digitalCopy[language]
  await bank.getByRole('combobox', { name: dm.measure, exact: true }).selectOption('yoy')
  assert.ok((await bank.locator('svg title').textContent()).includes(dm.yoy))
  for (const record of digitalFacts) {
    const fact = page.locator(`[data-digital-fact="${record.id}"]`)
    const label = record.observationDate || dm.unknown
    assert.equal(await metadataValue(fact, dm.observation), label, 'Publication facts do not invent an observation date')
    assert.ok((await fact.locator('.dm-value').textContent()).includes(dm.qualifiers[record.qualifier]), 'Reported/approximate source qualifier remains visible')
    assert.equal(await fact.locator('a.dm-source').getAttribute('href'), record.sourceUrl)
  }
  const fact = page.locator(`[data-digital-fact="${digitalFacts[0].id}"]`)
  await fact.locator('summary').click()
  const factRows = await downloadCsv(page, fact.getByRole('button', { name: dm.csv, exact: true }), /\.csv$/)
  assert.equal(factRows[0].qualifier, digitalFacts[0].qualifier)
  assert.equal(factRows[0].observationDate, digitalFacts[0].observationDate || '')
  assert.equal(factRows[0].sourceUpdatedAt, digitalFacts[0].sourceUpdatedAt)
  report.behaviors.push({ language, check: 'Monitor filters, External topic/planned evidence, AI focus/proxies, Digital focus/publication dates/qualifiers/CSV' })

  await settle(page, '#/purchasing-power')
  const power = page.locator('section[aria-labelledby="dollar-power-title"]')
  await power.getByRole('button', { name: '1971-08', exact: true }).click()
  const base = cpi.observations.find(point => point.date === '1971-08'), latest = cpi.observations.findLast(point => Number.isFinite(point.value))
  assert.equal(Number((await power.locator('.dollar-power-result strong').textContent()).replace(/[$,]/g, '')), Number((base.value / latest.value).toFixed(3)), 'Historical purchasing power uses CPI ratio')
  await power.locator('input[type="range"]').focus()
  await page.keyboard.press('Home')
  assert.equal(await power.locator('input[type="range"]').inputValue(), '0')
  await power.locator('details summary').click()
  assert.equal(await power.locator('tbody tr').first().locator('th').textContent(), '1971-08')
  assert.equal(Number(await power.locator('tbody tr').first().locator('td').textContent()), 100)
  await settle(page, '#/since-1971')
  assert.equal(await page.locator('section[aria-labelledby="dollar-power-title"]').getByRole('button', { name: '1971-08', exact: true }).getAttribute('aria-pressed'), 'true')
  const nominal = await page.locator('.driver-readout').textContent()
  await page.getByRole('button', { name: d.real, exact: true }).click()
  assert.notEqual(await page.locator('.driver-readout').textContent(), nominal, 'CPI-adjusted prices change the displayed series')

  await settle(page, '#/scenarios')
  const scenario = page.locator('.scenario-calculator')
  for (const [key, value] of Object.entries({ amount: '1000', inflation: '5', years: '10' })) await scenario.getByRole('spinbutton', { name: d[key], exact: true }).fill(value)
  const values = await scenario.locator('.scenario-results strong').allTextContents()
  assert.deepEqual(values.map(value => Number(value.replace(/[$,]/g, ''))), [Math.round(1000 / 1.05 ** 10), Math.round(1000 * 1.05 ** 10)])
  await scenario.getByRole('spinbutton', { name: d.years, exact: true }).fill('0')
  await scenario.getByRole('alert').waitFor({ state: 'visible' })
  assert.equal(await scenario.locator('.scenario-results').count(), 0)
  report.behaviors.push({ language, check: 'Historical purchasing power, Since 1971 real/nominal controls, scenario arithmetic and invalid-input handling' })

  await settle(page, '#/sources?focus=health')
  await assertFocused(page, 'data-status')
  await assertSeriesStatus(page, cpi, language)
  await assertSeriesStatus(page, digitalFacts[0], language)
  await assertSeriesStatus(page, { ...cbo.metadata, id: 'CBO_DEBT', sourceUrl: cbo.metadata.projectionSource, frequency: 'annual_fy', observations: cbo.observations.filter(point => point.status === 'actual').map(point => ({ date: String(point.year), value: point.debt })) }, language)
  const system = page.locator('.system-status')
  for (const key of ['application', 'pipeline', 'deployment', 'notification']) await system.getByRole('heading', { name: statusCopy[language][key], exact: true }).waitFor()
  assert.ok((await system.textContent()).includes(`V${app.version}`))
  await assertNoOverflow(page, `expanded date and freshness details ${language}`)
  await settle(page, '#/research?focus=research-map')
  await assertFocused(page, 'research-map')
  const mapScreenshot = `v1-research-map-${language}.png`
  await page.locator('#research-map').screenshot({ path: resolve(output, mapScreenshot), animations: 'disabled' })
  report.screenshots.push(mapScreenshot)
  report.behaviors.push({ language, check: 'Data Health and System Status, distinct date precision, manual review and fixed-vintage rules, Research Map focus' })

  await settle(page, '#/dollar?focus=research-environment')
  await assertFocused(page, 'research-environment')
  const environment = page.locator('#research-environment')
  assert.equal(await environment.getAttribute('open'), '', 'Deep link opens the retained descriptive-band tool')
  for (const rule of environmentRules) {
    const card = environment.locator('article').filter({ has: page.locator(`a[href$="/series/${rule.id}"]`) })
    assert.equal(await card.count(), 1, `${rule.id}: descriptive-band evidence remains accessible`)
    assert.ok((await card.locator('strong').textContent()).match(/\d/))
    await card.getByText(language === 'zh' ? rule.ruleZh : rule.ruleEn, { exact: true }).waitFor({ state: 'visible' })
  }
  await assertNoOverflow(page, `retained descriptive bands ${language}`)
  report.behaviors.push({ language, check: 'Dollar descriptive-band deep link opens retained observations and per-indicator thresholds' })
}

async function checkStatusFixtures(language) {
  // These isolated responses test failure rendering and notification semantics;
  // they are not evidence of an actual workflow run or Gmail delivery.
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  await context.addInitScript(language => localStorage.setItem('wil-language', language), language)
  const page = await context.newPage()
  track(page)
  const fixture = emptySystemStatus()
  fixture.updatedAt = '2026-10-02T07:50:00Z'
  fixture.data.result = 'FAILED'
  fixture.notification.result = 'ACCEPTED_BY_GMAIL'
  let malformed = false, requests = 0
  await page.route('**/system-status/system-status.json*', route => {
    requests++
    return route.fulfill({ contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(malformed ? { schemaVersion: -1 } : fixture) })
  })
  await settle(page, '#/sources')
  const system = page.locator('.system-status'), t = statusCopy[language]
  await system.getByText(t.accepted, { exact: true }).waitFor({ state: 'visible' })
  await system.getByText(t.failed, { exact: true }).waitFor({ state: 'visible' })
  assert.ok(requests, 'Status fixture reached the configured public-status request')
  assert.equal(await page.locator('[data-series-status="CBO_DEBT"]').getAttribute('data-freshness'), 'FIXED_VINTAGE')
  assert.match(await page.locator(`[data-series-status="${digitalFacts[0].id}"]`).getAttribute('data-freshness'), /^MANUAL_/)
  malformed = true
  await page.reload({ waitUntil: 'networkidle' })
  await system.getByText(t.unavailable, { exact: true }).waitFor({ state: 'visible' })
  assert.equal(await system.getByText(t.accepted, { exact: true }).count(), 0, 'Invalid status is not reported as successful notification')
  await page.locator('[data-series-status="CPIAUCNS"]').waitFor({ state: 'visible' })
  report.statusFixtures.push({ language, cases: ['failed refresh retains validated data', 'Gmail acceptance explicitly does not confirm inbox delivery', 'malformed status falls back without inventing success'] })
  await context.close()
}

try {
  for (const width of [320, 390, 1280]) for (const language of ['en', 'zh']) for (const theme of ['light', 'dark']) await checkHome(width, language, theme)
  if (!baseline) {
    for (const width of [320, 390, 1280]) for (const language of ['en', 'zh']) for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({ viewport: { width, height: 844 }, acceptDownloads: true })
      await context.addInitScript(({ language, theme }) => { localStorage.setItem('wil-language', language); localStorage.setItem('wil-theme', theme) }, { language, theme })
      const page = await context.newPage()
      track(page)
      for (const route of routes) {
        await settle(page, `#/${route}`)
        assert.equal(await page.locator('main h1').count(), 1, `${route}: one primary heading`)
        await assertNoOverflow(page, `${route} ${width}/${language}/${theme}`)
        assert.equal(await page.locator('html').getAttribute('lang'), language === 'zh' ? 'zh-CN' : 'en')
        assert.equal(await page.locator('html').getAttribute('data-theme'), theme)
        const navigation = page.locator(width === 1280 ? '.desktop-nav' : '.mobile-nav')
        assert.ok((await navigation.locator(`a[href="#/${routeSection(route)}"]`).getAttribute('class'))?.includes('active'), `${route}: correct primary navigation section`)
        if (primaryRoutes.includes(route)) assert.equal(await navigation.locator(`a[href="#/${route}"]`).getAttribute('aria-current'), 'page')
        report.routes.push({ route, language, theme, width })
        if (route === 'sources') {
          for (const selector of ['#data-status', '#system-status-title', '[data-freshness="FIXED_VINTAGE"]', '[data-freshness^="MANUAL_"]']) await page.locator(selector).first().waitFor({ state: 'attached' })
        }
        if (route === 'research/ai-productivity') for (const id of ['OPHNFB', 'ULCNFB', 'COMPNFB']) assert.ok((await page.locator('main').textContent()).includes(id))
        if (route === 'research/digital-money') assert.ok(await page.locator('[data-digital-fact]').count())
      }
      // Exercise interactive calculations and deep-link state in both languages;
      // the complete route layout matrix above covers all twelve combinations.
      if ((language === 'en' && theme === 'light' && width === 390) || (language === 'zh' && theme === 'dark' && width === 320)) await checkQueriesAndCalculators(page, language)
      console.log(`PASS: all legal routes ${width}px ${language}/${theme}`)
      await context.close()
    }
    for (const language of ['en', 'zh']) await checkStatusFixtures(language)
  }
  report.errors = trackedErrors
  assert.deepEqual(trackedErrors, [], 'No console or runtime errors from the production build')
  report.result = 'PASS'
} catch (error) {
  report.result = 'FAIL'
  report.failure = error.message
  report.errors = trackedErrors
  throw error
} finally {
  await writeFile(resolve(output, baseline ? 'baseline.json' : 'acceptance.json'), JSON.stringify(report, null, 2) + '\n')
  await browser.close()
}
