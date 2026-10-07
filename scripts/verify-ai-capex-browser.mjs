// Local production-browser acceptance; browser tooling never enters the app.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {pathToFileURL} from 'node:url'
import {aiCapexCopy} from '../src/i18n/aiCapex.js'
const {chromium}=await import(process.env.WIL_PLAYWRIGHT_MODULE?pathToFileURL(process.env.WIL_PLAYWRIGHT_MODULE):'playwright')
const url=process.env.WIL_BROWSER_URL||'http://127.0.0.1:5187/world-inflation-lens/'
assert(['localhost','127.0.0.1'].includes(new URL(url).hostname),'Local acceptance only')
const output=path.resolve('.refresh/ai-capex-browser');fs.mkdirSync(output,{recursive:true})
const browser=await chromium.launch({headless:true,...(process.env.WIL_CHROME_EXECUTABLE?{executablePath:process.env.WIL_CHROME_EXECUTABLE}:{})})
const report={surfaces:[],errors:[],navigation:[],screenshots:[],homeLazy:true}
try{
 for(const width of [320,390,1280])for(const language of ['en','zh'])for(const theme of ['light','dark']){
  const t=aiCapexCopy[language],context=await browser.newContext({viewport:{width,height:1000},locale:language==='zh'?'zh-CN':'en-US'})
  await context.addInitScript(({language,theme})=>{localStorage.setItem('wil-language',language);localStorage.setItem('wil-theme',theme)},{language,theme})
  const page=await context.newPage(),requests=[]
  page.on('pageerror',e=>report.errors.push(e.message));page.on('request',r=>requests.push(r.url()))
  await page.goto(url+'#/home');await page.locator('[data-page="home"]').waitFor()
  assert(!requests.some(u=>/\/AiCapex-/.test(u)),'Home must not load CapEx history or page')
  await page.goto(url+'#/research');await page.locator('.research-tool-directory').waitFor()
  const link=page.locator('.research-tool-directory a[href="#/research/ai-capex"]');await link.focus();await page.keyboard.press('Enter')
  const content=page.locator('[data-page="ai-capex"]');await content.waitFor()
  assert.equal(await page.locator('main h1').count(),1);assert.equal(await page.locator('main h1').textContent(),t.title)
  assert.equal(await page.locator('html').getAttribute('lang'),language==='zh'?'zh-CN':'en');assert.equal(await page.locator('html').getAttribute('data-theme'),theme)
  assert.equal(await content.locator('h2').count(),10);assert.equal(await content.locator('svg[role="img"]').count(),3)
  assert.deepEqual(await content.locator('[data-company]').evaluateAll(els=>els.map(e=>e.dataset.company)),['MSFT','GOOG','AMZN','META'])
  assert.equal(await content.locator('[data-milestone]').count(),3);assert.equal(await content.locator('[data-guidance]').count(),2)
  const text=await content.textContent()
  for(const value of ['2026Q2','2026-07-30','39.78%','21.82%','−4.89%','−3.83%','49.53%','+109.63%','−11.63','7.104','513.9','130–145',t.runRate,t.cloudNote,t.cashNote,t.recognized,...t.boundaries.MSFT,...t.boundaries.META])assert(text.includes(value),value)
  assert(!/undefined|NaN|\/Users\/|file:\/\//.test(text))
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No page-wide overflow')
  const table=content.locator('.ac-table-scroll').first();await table.focus();assert(await table.evaluate(el=>el===document.activeElement))
  if(width<680){assert(await table.evaluate(el=>el.scrollWidth>el.clientWidth));await page.keyboard.press('ArrowRight');await page.waitForFunction(()=>document.querySelector('.ac-table-scroll').scrollLeft>0)}
  for(const svg of await content.locator('svg').all()){assert(await svg.getAttribute('aria-labelledby'));assert(await svg.getAttribute('aria-describedby'));assert.equal(await svg.locator('title').count(),1)}
  const company=content.getByLabel(t.chartCompany,{exact:true});await company.focus();await company.selectOption('META');assert.equal(await company.inputValue(),'META')
  for(const id of ['MSFT','GOOG','AMZN','META']){
   await company.selectOption(id)
   for(const [metric,note] of Object.entries({cashInvestmentIntensity:t.nativeCash[id],operatingMargin:t.chartAccountingNotes.operatingMargin,fcfMargin:t.chartAccountingNotes.fcfMargin[id]})){
    const chartNote=content.locator(`[data-chart="${metric}"] [data-chart-accounting-note]`)
    assert.equal(await chartNote.textContent(),note,`${language} ${id} ${metric} accounting note`)
   }
  }
  await company.selectOption('META')
  const chart=content.locator('[data-chart="fcfMargin"]');await chart.locator('summary').focus();await page.keyboard.press('Enter')
  assert.equal(await chart.locator('tbody tr').count(),30);assert((await chart.textContent()).includes('11 / 30'))
  assert.equal(await chart.locator('[data-segment]').count(),4,'Meta gaps and definition changes retain four disconnected segments')
  assert.equal(await chart.locator('[data-segment]').evaluateAll(paths=>paths.reduce((n,p)=>n+(p.getAttribute('d').match(/[ML]/g)||[]).length,0)),11)
  await company.selectOption('MSFT');await chart.locator('summary').click()
  if(width===390&&language==='zh'&&theme==='dark'||width===1280&&language==='en'&&theme==='light'||width===320&&language==='en'&&theme==='light'){
   const file=`capex-${width}-${language}-${theme}.png`;await page.screenshot({path:path.join(output,file),fullPage:true});report.screenshots.push(file)
   await content.locator('h2').first().scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,file.replace('.png','-current.png'))})
   await content.locator('[data-chart]').first().scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,file.replace('.png','-chart.png'))})
  }
  const maintenance=content.locator('[data-capex-maintenance]');assert((await maintenance.textContent()).includes(t.maintenance.boundary))
  const control=maintenance.getByRole('link',{name:t.maintenance.button,exact:false});assert.equal(await control.getAttribute('href'),'https://github.com/ccesm/world-inflation-lens/actions/workflows/ai-capex-quarterly-refresh.yml');assert.equal(await control.getAttribute('target'),'_blank');await control.focus();assert(await control.evaluate(el=>el===document.activeElement));assert(await control.evaluate(el=>el.getBoundingClientRect().width<=innerWidth));
  assert.equal(await page.locator('.desktop-nav a').count(),6)
  assert(requests.every(u=>{const target=new URL(u);return target.origin===new URL(url).origin||['https://fonts.googleapis.com','https://fonts.gstatic.com'].includes(target.origin)||target.origin==='https://raw.githubusercontent.com'&&target.pathname==='/ccesm/world-inflation-lens/system-status/system-status.json'}),'No new runtime external API requests; existing font assets and status-only fetch preserved')
  report.surfaces.push({width,language,theme,overflow:false,keyboardTables:true,accessibleChartFallback:true,metaGap:true})
  await content.locator('a[href="#/research/ai-productivity"]').click();await page.locator('#ai-productivity').waitFor()
  await page.locator('main a[href="#/research/ai-capex"]').click();await content.waitFor()
  await content.locator('a[href="#/research/ai-labor"]').click();await page.locator('[data-page="ai-labor"]').waitFor()
  assert((await page.locator('main').textContent()).includes(language==='zh'?'观察模式':'OBSERVATION MODE'))
  await page.locator('main a[href="#/research/ai-capex"]').click();await content.waitFor()
  await page.goBack();await page.locator('[data-page="ai-labor"]').waitFor();await page.goForward();await content.waitFor()
  await page.goto(url+'#/fiscal');await page.locator('#fiscal-model').waitFor()
  await page.goto(url+'#/research/signal-engine');await page.locator('main h1').filter({hasText:language==='zh'?'信号引擎':'Signal Engine'}).waitFor()
  report.navigation.push({width,language,theme,research:true,relatedBothWays:true,history:true,legacyFiscal:true,signal:true})
  await context.close()
 }
 assert.deepEqual(report.errors,[])
 fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n')
 console.log(`PASS: ${report.surfaces.length} AI CapEx browser surfaces; EN/ZH × 320/390/1280 × light/dark, keyboard navigation/tables, chart fallback, native accounting gaps, Home lazy isolation, related/legacy/Signal routes, no overflow/new external API/runtime errors`)
}finally{await browser.close()}
