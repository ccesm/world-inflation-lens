// Local production-browser acceptance; no browser dependency in application code.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
const { chromium } = await import(process.env.WIL_PLAYWRIGHT_MODULE ? pathToFileURL(process.env.WIL_PLAYWRIGHT_MODULE) : 'playwright')
const url = process.env.WIL_BROWSER_URL || 'http://127.0.0.1:5187/world-inflation-lens/'
assert(['127.0.0.1','localhost'].includes(new URL(url).hostname),'Local acceptance only')
const output = path.resolve('.refresh/ai-labor-browser'); fs.mkdirSync(output,{recursive:true})
const browser = await chromium.launch({headless:true,...(process.env.WIL_CHROME_EXECUTABLE ? {executablePath:process.env.WIL_CHROME_EXECUTABLE}: {})})
const report = {surfaces:[],navigation:[],errors:[],homeLazy:true,screenshots:[]}
try {
 for (const width of [320,390,1280]) for (const language of ['en','zh']) for (const theme of ['light','dark']) {
  const context = await browser.newContext({viewport:{width,height:1000},locale:language==='zh'?'zh-CN':'en-US'})
  await context.addInitScript(({language,theme})=>{localStorage.setItem('wil-language',language);localStorage.setItem('wil-theme',theme)},{language,theme})
  const page = await context.newPage(); page.on('pageerror',error=>report.errors.push(error.message))
  const requests=[];page.on('request',request=>requests.push(request.url()))
  await page.goto(url+'#/home'); await page.locator('[data-page="home"]').waitFor()
  assert(!requests.some(u=>/\/AiLabor-/.test(u)),'Labor route/history must not load on Home')
  await page.goto(url+'#/research'); await page.locator('.research-tool-directory').waitFor()
  const link = page.locator('.research-tool-directory a[href="#/research/ai-labor"]'); await link.focus(); await page.keyboard.press('Enter')
  const content = page.locator('[data-page="ai-labor"]'); await content.waitFor()
  assert.equal(await page.locator('main h1').count(),1)
  assert.equal(await page.locator('main h1').textContent(),language==='zh'?'AI 与劳动力转型':'AI & Labor Transition')
  assert.equal(await page.locator('html').getAttribute('lang'),language==='zh'?'zh-CN':'en')
  assert.equal(await page.locator('html').getAttribute('data-theme'),theme)
  assert.equal(await page.locator('[data-evidence-status]').textContent(),language==='zh'?'早期 / 结论未定 / 对样本和方法敏感':'EARLY / INCONCLUSIVE / SAMPLE-SENSITIVE')
  assert.equal(await page.locator('[data-result]').count(),4)
  const text = await content.textContent()
  for (const number of ['37.77%','47.55%','55.02%','55.23%','47.80%','+0.4159','+0.5621','−0.8480','+0.0300']) assert(text.includes(number))
  assert(text.includes(language==='zh'?'因果关系尚未确立':'Causality not established'))
  assert(!/\/Users\/|file:\/\/|undefined|NaN/.test(text))
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No page-wide overflow')
  const table = page.locator('.ai-labor-table-scroll'); await table.focus(); assert(await table.evaluate(el=>el===document.activeElement))
  const scrolling=await table.evaluate(el=>({client:el.clientWidth,scroll:el.scrollWidth})); if(width<680)assert(scrolling.scroll>scrolling.client,'Intentional table scroll')
  await page.keyboard.press('ArrowRight'); if(width<680)await page.waitForFunction(()=>document.querySelector('.ai-labor-table-scroll').scrollLeft>0)
  assert.equal(await page.locator('.desktop-nav a').count(),6)
  if(width===390&&language==='zh'&&theme==='dark'||width===1280&&language==='en'&&theme==='light') {const file=`labor-${width}-${language}-${theme}.png`;await page.screenshot({path:path.join(output,file),fullPage:true});report.screenshots.push(file)}
  report.surfaces.push({width,language,theme,overflow:false,rows:4,keyboardTable:true})
  const productivity = content.locator('a[href="#/research/ai-productivity"]');await productivity.focus();await page.keyboard.press('Enter');await page.locator('#ai-productivity').waitFor()
  const back = page.locator('main a[href="#/research/ai-labor"]'); await back.focus(); await page.keyboard.press('Enter');await content.waitFor()
  await page.goBack();await page.locator('#ai-productivity').waitFor();await page.goForward();await content.waitFor()
  const researchReturn = page.locator('.research-context a');await researchReturn.click(); await page.locator('.research-tool-directory').waitFor()
  await page.goto(url+'#/fiscal');await page.locator('#fiscal-model').waitFor()
  await page.goto(url+'#/research/ai-labor');await content.waitFor()
  if(width===320)assert.equal(await page.locator('.section-navigation select').inputValue(),'#/research/ai-labor')
  report.navigation.push({width,language,theme,research:true,productivityBothWays:true,history:true,legacyFiscal:true})
  await context.close()
 }
 assert.deepEqual(report.errors,[])
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n')
 console.log(`PASS: ${report.surfaces.length} AI-labor production-browser surfaces; EN/ZH × 320/390/1280 × light/dark, keyboard table/navigation, Home lazy isolation, legacy route, no overflow/runtime errors`)
} finally {await browser.close()}
