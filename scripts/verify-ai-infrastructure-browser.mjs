// Local production-build acceptance. Browser tooling stays outside application dependencies.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import {pathToFileURL} from 'node:url'
import {infrastructureCopy as copy} from '../src/i18n/aiInfrastructure.js'
import {paperCopy} from '../src/i18n/aiInfrastructurePaper.js'
import {routes} from '../src/utils/routing.js'
import packageMetadata from '../package.json' with {type:'json'}
const {chromium}=await import(process.env.WIL_PLAYWRIGHT_MODULE?pathToFileURL(process.env.WIL_PLAYWRIGHT_MODULE):'playwright')
const url=process.env.WIL_BROWSER_URL||'http://127.0.0.1:5187/world-inflation-lens/'
assert(['localhost','127.0.0.1'].includes(new URL(url).hostname),'Local acceptance only')
const output=path.resolve('.refresh/ai-infrastructure-browser');fs.mkdirSync(output,{recursive:true})
const browser=await chromium.launch({headless:true,...(process.env.WIL_CHROME_EXECUTABLE?{executablePath:process.env.WIL_CHROME_EXECUTABLE}:{})})
const report={surfaces:[],runtimeErrors:[],consoleErrors:[],requests:[],screenshots:[],routeResults:[],homeLazy:true}
try{
 for(const width of [390,1280])for(const language of ['en','zh'])for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width,height:1000},locale:language==='zh'?'zh-CN':'en-US'})
  await context.addInitScript(({language,theme})=>{localStorage.setItem('wil-language',language);localStorage.setItem('wil-theme',theme)},{language,theme})
  const page=await context.newPage(),requests=[]
  page.on('pageerror',e=>report.runtimeErrors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.consoleErrors.push(m.text())});page.on('request',r=>requests.push(r.url()))
  await page.goto(url+'#/home');await page.locator('[data-page="home"]').waitFor()
  assert(!requests.some(u=>/\/AiInfrastructure-/.test(u)),'Home does not fetch Infrastructure snapshot/page')
  await page.goto(url+'#/research');await page.locator('.research-tool-directory').waitFor()
  assert.equal(await page.locator('.research-map a[href="#/research/ai-infrastructure"]').count(),1)
  const navigation=page.locator('.research-tool-directory a[href="#/research/ai-infrastructure"]');await navigation.focus();await page.keyboard.press('Enter')
  const content=page.locator('[data-page="ai-infrastructure"]');await content.waitFor()
  const paper=page.locator('[data-infrastructure-paper]');await paper.waitFor()
  assert.equal(await paper.locator('[data-paper-chart]').count(),3)
  assert.equal(await paper.locator('[data-paper-comparison]').count(),5)
  assert.equal(await paper.locator('[data-paper-finding]').count(),4)
  assert.deepEqual(await paper.locator('[data-paper-section]').evaluateAll(els=>els.map(e=>e.dataset.paperSection)),['paper','findings','charts','comparison'])
  assert.equal(await paper.locator('[data-bottom-evidence]').count(),2)
  assert.deepEqual(await page.locator('[data-macro-part]').evaluateAll(els=>els.map(e=>e.dataset.macroPart)),['1','2','3'])
  assert.equal(await paper.locator('[data-quick-assessment]').count(),4)
  assert.deepEqual(await paper.locator('[data-paper-chart]').evaluateAll(els=>els.map(e=>e.dataset.paperChart)),['campus','cash','booms'])
  assert(await page.evaluate(()=>Boolean(document.querySelector('[data-bottom-line]').compareDocumentPosition(document.querySelector('[data-macro-part="1"]'))&Node.DOCUMENT_POSITION_FOLLOWING)))
  for(const value of [paperCopy.polish.paper,paperCopy.polish.evidence,paperCopy.polish.campusTotal,paperCopy.polish.mixed,paperCopy.polish.scenario])assert((await paper.textContent()).includes(value[language]))
  assert((await paper.locator('[data-paper-chart="cash"] [role="img"]').getAttribute('aria-label')).includes(paperCopy.polish.mixed[language]))
  assert((await paper.locator('[data-paper-chart="booms"] [role="img"]').getAttribute('aria-label')).includes(paperCopy.polish.scenario[language]))
  assert(await page.evaluate(()=>Boolean(document.querySelector('[data-infrastructure-paper]').compareDocumentPosition(document.querySelector('[data-independent-divider]'))&Node.DOCUMENT_POSITION_FOLLOWING)))
  assert(await page.evaluate(()=>Boolean(document.querySelector('[data-independent-divider]').compareDocumentPosition(document.querySelector('[data-page="ai-infrastructure"]'))&Node.DOCUMENT_POSITION_FOLLOWING)))
  for(const value of [paperCopy.labels.version,paperCopy.comparisons.funding.evidence,paperCopy.comparisons.scale.boundary,paperCopy.charts.cash.note,paperCopy.charts.booms.note])assert((await paper.textContent()).includes(value[language]))
  for(const chart of await paper.locator('[data-paper-chart]').all()){
   assert.equal(await chart.getAttribute('data-provenance'),'ACADEMIC_PAPER');assert(await chart.locator('[role="img"]').getAttribute('aria-label'))
   const toggle=chart.locator('summary');await toggle.focus();await page.keyboard.press('Enter');assert(await toggle.evaluate(el=>el.parentElement.open));assert(await chart.locator('th[scope="row"]').count()>0);await page.keyboard.press('Enter')
  }
  const paperLink=paper.getByRole('link',{name:paperCopy.labels.read[language],exact:false});await paperLink.focus();assert(await paperLink.evaluate(el=>el===document.activeElement));assert.equal(await paperLink.getAttribute('href'),'https://www.brookings.edu/wp-content/uploads/2026/09/4c_Van-Nieuwerburgh.pdf')
  if(theme===(language==='en'?'light':'dark')){await page.locator('main h1').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,`paper-${width}-${language}-${theme}-top.png`)});await paper.locator('[data-paper-chart="campus"]').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,`paper-${width}-${language}-${theme}-charts.png`)});await paper.locator('[data-paper-comparison="funding"]').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,`paper-${width}-${language}-${theme}-comparison.png`)})}
  assert.equal(await page.locator('main h1').textContent(),copy.page.title[language]);assert.equal(await content.locator('h2').count(),4)
  assert.deepEqual(await content.locator('h2').allTextContents(),Object.values(copy.sections).map(v=>v[language]))
  assert.equal(await page.locator('html').getAttribute('lang'),language==='zh'?'zh-CN':'en');assert.equal(await page.locator('html').getAttribute('data-theme'),theme)
  assert.equal(await content.locator('[data-project]').count(),7);assert.equal(await content.locator('[data-financing="UNKNOWN"]').count(),7)
  assert.deepEqual(await content.locator('[data-project]').evaluateAll(els=>els.map(e=>e.dataset.company)),['MSFT','MSFT','AMZN','META','META','ORCL','COMPARATIVE'])
  const text=await content.textContent()
  for(const key of ['doubleCount','fairwater','polaris','guarantee','maximumExposure','financing','utility'])assert(text.includes(copy.disclosures[key][language]))
  assert(text.includes(copy.ui.emptyAlphabet[language]));assert(text.includes(copy.ui.structureCount[language]))
  for(const value of ['5 GW','1 GW','400 MW','175 MW','5200 MW','2500 MW','250 MW','2025-09-18','2026-10-07'])assert(text.includes(value),value)
  assert(!/RESEARCH_ONLY|REVIEW_REQUIRED|NOT_PUBLIC|CONFLICTING|\/Users\/|file:\/\/|wil-ai-|Beignet|2\.064|20%|80%|27\.3|12\.31|46\.03|\$|undefined|NaN|Midlothian|Red Oak|Abilene|Canton/.test(text),'No excluded facts or missing-value leakage')
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No page-wide horizontal overflow')
  const company=content.getByLabel(copy.labels.filterCompany[language],{exact:true});await company.focus();assert(await company.evaluate(el=>el===document.activeElement));await company.selectOption('GOOG');assert.equal(await content.locator('[data-project]').count(),0);assert((await content.locator('[role="status"]').textContent()).includes(copy.labels.noResults[language]));await company.selectOption('COMPARATIVE');assert.equal(await content.locator('[data-project]').count(),1);await company.selectOption('ALL')
  const history=content.locator('[data-project="polaris-forge-1"] details').first().locator('summary');await history.focus();await page.keyboard.press('Enter');assert(await history.evaluate(el=>el.parentElement.open))
  const tableToggle=content.locator('.infra-table > summary');await tableToggle.focus();await page.keyboard.press('Enter');assert(await tableToggle.evaluate(el=>el.parentElement.open))
  const table=content.locator('.infra-table-scroll');await table.focus();assert(await table.evaluate(el=>el===document.activeElement));assert.equal(await table.locator('tbody tr').count(),7);if(width===390){await page.keyboard.press('ArrowRight');await page.waitForFunction(()=>document.querySelector('.infra-table-scroll').scrollLeft>0)}
  await tableToggle.click()
  const source=content.locator('[data-project="hyperion"] .infra-sources a').first();assert((await source.getAttribute('href')).startsWith('https://s21.q4cdn.com/399680738/'));await source.focus();assert(await source.evaluate(el=>el===document.activeElement));assert.equal(await source.getAttribute('target'),'_blank');assert((await source.textContent()).includes(copy.labels.newTab[language]))
  if(theme===(language==='en'?'light':'dark')){const file=`infra-${width}-${language}-${theme}.png`;await page.screenshot({path:path.join(output,file),fullPage:true});report.screenshots.push(file);await content.locator('[data-project="hyperion"]').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,file.replace('.png','-hyperion.png'))})}
  await content.locator('a[href="#/research/ai-capex"]').click();await page.locator('[data-page="ai-capex"]').waitFor();assert((await page.locator('main').textContent()).includes('RUN_RATE'));assert((await page.locator('[data-capex-maintenance]').textContent()).includes(language==='zh'?'不会自动发布':'No data is published automatically'))
  await page.locator('main a[href="#/research/ai-infrastructure"]').click();await content.waitFor();await page.goBack();await page.locator('[data-page="ai-capex"]').waitFor();await page.goForward();await content.waitFor()
  await page.goto(url+'#/research/ai-labor');await page.locator('[data-page="ai-labor"]').waitFor();assert((await page.locator('main').textContent()).includes(language==='zh'?'观察模式':'OBSERVATION MODE'))
  await page.goto(url+'#/research/signal-engine');await page.locator('main h1').filter({hasText:language==='zh'?'信号引擎':'Signal Engine'}).waitFor()
  await page.goto(url+'#/sources');await page.locator('.system-status').waitFor();assert.equal(await page.locator('.system-status article').first().locator('dd').first().textContent(),`V${packageMetadata.version}`)
  report.surfaces.push({width,language,theme,paperFirst:true,paperCharts:3,comparisonRows:5,projectCards:7,unknownStructures:7,overflow:false,keyboard:true,tableFallback:true,relatedNavigation:true,labor:true,signal:true})
  report.requests.push(...requests.filter(u=>!u.startsWith(new URL(url).origin)))
  await context.close()
 }
 // Existing route registration is also checked by SSR verification; smoke each route in the real browser.
 const context=await browser.newContext(),page=await context.newPage();page.on('pageerror',e=>report.runtimeErrors.push(e.message))
 for(const route of routes){await page.goto(url+'#/'+route);await page.locator('main h1').waitFor();assert(!(await page.locator('main').textContent()).includes('This research view could not be loaded'));report.routeResults.push({route,loaded:true})}
 await context.close()
 assert.deepEqual(report.runtimeErrors,[]);assert.deepEqual(report.consoleErrors,[])
 assert(report.requests.every(u=>{const t=new URL(u);return ['https://fonts.googleapis.com','https://fonts.gstatic.com'].includes(t.origin)||t.origin==='https://raw.githubusercontent.com'&&t.pathname==='/ccesm/world-inflation-lens/system-status/system-status.json'}),'Only inherited font/status external requests')
 report.requests=[...new Set(report.requests)];fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n')
 console.log(`PASS: ${report.surfaces.length} Infrastructure browser surfaces, ${report.routeResults.length} routes, EN/ZH, 390/1280, light/dark, cards/filter/table/keyboard/source/date boundaries, no overflow or console/runtime errors; Home lazy isolation`)
}finally{await browser.close()}
