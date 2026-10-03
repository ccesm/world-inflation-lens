// Focused F2/F3/F4 regression. Run against a local production build using the
// same optional browser environment as verify-v1-browser.mjs. No real email.
import assert from 'node:assert/strict'
import {mkdir, writeFile} from 'node:fs/promises'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'
import {driversCopy} from '../src/i18n/drivers.js'
import {researchContextForRoute, researchStages, structuralThemes} from '../src/data/researchArchitecture.js'
const driverTopics = Object.keys(driversCopy.en.topics)
const topicKeys = {food:['headline','food'],energy:['headline','energy','oil'],rates:['headline','rates'],housing:['headline','housing'],wages:['headline','wages'],money:['headline','money']}
const base = process.env.WIL_BROWSER_URL
assert.ok(base && ['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Use a local production preview')
const pw = await import(process.env.WIL_PLAYWRIGHT_MODULE ? pathToFileURL(resolve(process.env.WIL_PLAYWRIGHT_MODULE)).href : 'playwright')
const browser = await pw.chromium.launch({headless: true, ...(process.env.WIL_CHROME_EXECUTABLE ? {executablePath: process.env.WIL_CHROME_EXECUTABLE} : {})})
const output = resolve(process.env.WIL_BROWSER_OUTPUT_DIR || '.refresh/release-blockers')
await mkdir(output, {recursive: true})
const report = {checkedAt: new Date().toISOString(), url: base, combinations: [], errors: []}
const ratesHash = '#/drivers?topic=rates&from=1978-01&to=1984-12&month=1982-12&episode=volcker'
function track(page) {
  page.on('pageerror', e => report.errors.push(e.message))
  page.on('console', m => {if(m.type() === 'error' && (!m.location().url || m.location().url.startsWith(new URL(base).origin))) report.errors.push(m.text())})
  page.on('requestfailed', r => {if(r.url().startsWith(new URL(base).origin)) report.errors.push(r.failure()?.errorText)})
}
async function state(page, topic, language, expected = {}, sameWorkbench = true) {
  const index = driverTopics.indexOf(topic), t = driversCopy[language]
  await page.waitForFunction(({topic,index,expected}) => {
    const params=new URLSearchParams(location.hash.split('?')[1])
    return params.get('topic')===topic && document.querySelectorAll('.drivers-tabs button')[index]?.getAttribute('aria-pressed')==='true'
      && [...document.querySelectorAll('.driver-date-controls input[type="month"]')].every((el,i)=>el.value===params.get(i===0?'from':'to'))
      && document.querySelector('.driver-inspect input[type="month"]')?.value===params.get('month')
      && Object.entries(expected).every(([key,value])=>params.get(key)===value)
  },{topic,index,expected})
  const hash = new URL(page.url()).hash, params = new URLSearchParams(hash.split('?')[1])
  assert.equal(params.get('topic'), topic)
  assert.equal(await page.locator('.driver-workbench .global-heading h2').textContent(), `${t.topics[topic]} × CPI`)
  assert.equal(await page.locator('.driver-explanation h2').textContent(), t.questions[topic])
  const labels = await page.locator('.driver-readout > div > span').allTextContents()
  assert.deepEqual(labels, topicKeys[topic].map(key => t.series[key]))
  const context = researchContextForRoute(hash)
  const stage = researchStages.find(item => item.id === context.stage), theme = structuralThemes.find(item => item.id === context.theme)
  assert.deepEqual(await page.locator('.research-context li > span:last-child').allTextContents(), [stage.label[language], theme?.label[language], context.label[language]].filter(Boolean))
  assert.equal(await page.locator('.research-context a').getAttribute('href'), context.href)
  for(const [key,value] of Object.entries(expected)) assert.equal(params.get(key), value, key)
  for(const key of ['from','to']) assert.equal(await page.locator('.driver-date-controls').getByLabel(t[key], {exact:true}).inputValue(), params.get(key))
  assert.equal(await page.locator('.driver-inspect input[type="month"]').inputValue(), params.get('month'))
  if(params.has('episode')) assert.equal(await page.locator('.episode-buttons').getByRole('button',{name:t.episodes[params.get('episode')],exact:true}).getAttribute('aria-pressed'),'true')
  else assert.equal(await page.locator('.episode-buttons [aria-pressed="true"]').count(),0)
  assert.equal(new URL(await page.locator('.chart-share input').inputValue()).hash, hash)
  if(sameWorkbench) assert.equal(await page.evaluate(() => window.__wilWorkbench === document.querySelector('.driver-workbench')),true,'Same-route controls must not remount')
  const bounds = await page.evaluate(() => [document.documentElement.clientWidth,document.documentElement.scrollWidth])
  assert.ok(bounds[1] <= bounds[0]+1, `Overflow: ${bounds}`)
}
const historyLength = page => page.evaluate(() => history.length)
async function choose(page, topic, language) {
  await page.locator('.drivers-tabs').getByRole('button',{name:driversCopy[language].topics[topic]}).click()
}
try {
for(const width of [320,390,1280]) for(const language of ['en','zh']) for(const theme of ['light','dark']) {
  const ctx = await browser.newContext({viewport:{width,height:844},colorScheme:theme})
  await ctx.addInitScript(({language,theme}) => {localStorage.setItem('wil-language',language);localStorage.setItem('wil-theme',theme)},{language,theme})
  const page = await ctx.newPage(); track(page)
  await page.goto(base+ratesHash,{waitUntil:'networkidle'})
  await page.locator('.driver-workbench').waitFor()
  await page.locator('.driver-workbench').evaluate(el => {window.__wilWorkbench=el})
  const original = {from:'1978-01',to:'1984-12',month:'1982-12',episode:'volcker'}
  await state(page,'rates',language,original)
  const directEnergy = await ctx.newPage();track(directEnergy)
  await directEnergy.goto(base+'#/drivers?topic=energy',{waitUntil:'networkidle'})
  await state(directEnergy,'energy',language,{from:'2019-01'},false);await directEnergy.close()
  const initialLength = await historyLength(page)
  await choose(page,'energy',language); await state(page,'energy',language,original)
  assert.equal(await historyLength(page),initialLength+1,'Topic selections push a history entry')
  const t=driversCopy[language]
  await page.locator('.episode-buttons').getByRole('button',{name:t.episodes.oil,exact:true}).click()
  await page.locator('.driver-inspect input[type="month"]').fill('1974-01')
  const energy = {from:'1972-01',to:'1976-12',month:'1974-01',episode:'oil'}
  await state(page,'energy',language,energy)
  assert.equal(await historyLength(page),initialLength+1,'Episode/month controls replace the current entry')
  await page.goBack(); await state(page,'rates',language,original)
  await page.goForward(); await state(page,'energy',language,energy)
  await page.evaluate(hash => {location.hash=hash}, ratesHash); await state(page,'rates',language,original)
  // The original F4 failure: revisiting a formerly mounted URL after a local topic change.
  await choose(page,'food',language); await state(page,'food',language,original)
  await page.evaluate(hash => {location.hash=hash}, ratesHash); await state(page,'rates',language,original)
  await choose(page,'energy',language); await state(page,'energy',language,original)
  await choose(page,'food',language); await state(page,'food',language,original)
  await choose(page,'rates',language); await state(page,'rates',language,original)
  for(const topic of ['housing','wages','money']) {await choose(page,topic,language);await state(page,topic,language,original)}
  const beforeControls=await historyLength(page)
  await page.locator('.driver-date-controls').getByLabel(t.from,{exact:true}).fill('1980-01')
  await page.locator('.driver-inspect input[type="month"]').fill('1981-06')
  await state(page,'money',language,{...original,from:'1980-01',month:'1981-06'})
  assert.equal(await historyLength(page),beforeControls)
  assert.equal(await page.locator('.driver-inspect input[type="month"]').evaluate(el=>el===document.activeElement),true,'Inspection keeps focus')
  const copied=await page.locator('.chart-share input').inputValue(), fresh=await ctx.newPage();track(fresh)
  await fresh.goto(copied,{waitUntil:'networkidle'});await state(fresh,'money',language,{...original,from:'1980-01',month:'1981-06'},false);await fresh.close()
  // Range presets replace history and preserve the mounted workbench too.
  await page.getByRole('button',{name:'5Y',exact:true}).click()
  await state(page,'money',language);assert.equal(await historyLength(page),beforeControls)
  // A same-route URL differing only in inspection/range/episode must be adopted.
  await page.evaluate(() => {location.hash='#/drivers?topic=money&from=2000-01&to=2005-12&month=2003-06&episode=crisis'})
  await page.waitForFunction(() => document.querySelector('.driver-inspect input[type="month"]')?.value==='2003-06')
  await state(page,'money',language,{from:'2000-01',to:'2005-12',month:'2003-06',episode:'crisis'})
  // Invalid local input drafts must not block subsequent direct navigation.
  await page.locator('.driver-date-controls').getByLabel(t.from,{exact:true}).fill('2006-01')
  await page.locator('.driver-date-error').waitFor()
  await page.evaluate(() => {location.hash='#/drivers?topic=energy'})
  await state(page,'energy',language,{from:'2019-01'})
  // Legacy episode-only URLs are normalized without adding a history entry.
  const beforeLegacy = await historyLength(page)
  await page.evaluate(() => {location.hash='#/drivers?episode=oil'})
  await state(page,'energy',language,{from:'1972-01',to:'1976-12',month:'1976-12',episode:'oil'})
  assert.equal(await historyLength(page),beforeLegacy+1,'Canonical normalization does not push another entry')
  await page.goto(base+'#/external-shocks',{waitUntil:'networkidle'})
  const chain=page.locator('.trans-chain').first();await chain.waitFor()
  const wording=await chain.locator('li').nth(3).innerText()
  assert.equal(/10Y breakeven: not integrated|10年盈亏平衡通胀率：尚未接入/.test(wording),false)
  for(const id of ['DGS10','DFII10','T5YIFR']) assert.ok(wording.includes(id))
  assert.match(wording,language==='en'?/available.*matching dates/:/可由同日.*计算/)
  assert.match(wording,language==='en'?/dedicated published.*not separately integrated/:/未单独接入直接发布/)
  assert.match(wording,language==='en'?/risk and liquidity/:/风险与流动性/)
  assert.match(wording,language==='en'?/different maturity/:/不同期限/)
  const bounds=await page.evaluate(()=>[document.documentElement.clientWidth,document.documentElement.scrollWidth]);assert.ok(bounds[1]<=bounds[0]+1)
  await chain.locator('li').nth(3).screenshot({path:resolve(output,`compensation-${width}-${language}-${theme}.png`)})
  report.combinations.push({width,language,theme,direct:true,topics:driverTopics,backForward:true,externalHash:true,sharedState:true,replaceControls:true,sameWorkbench:true,bilingualCompensation:true})
  console.log(`PASS: blockers ${width}px ${language}/${theme}; topic/context/history/share/controls and compensation copy`)
  await ctx.close()
}
assert.deepEqual(report.errors,[]);report.result='PASS'
} catch(error){report.result='FAIL';report.failure=error.stack;throw error} finally {await writeFile(resolve(output,'report.json'),JSON.stringify(report,null,2));await browser.close()}
