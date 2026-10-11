// Optional real Chromium acceptance. No browser dependency is added to the application.
import assert from 'node:assert/strict'
import {readFile,mkdir,writeFile} from 'node:fs/promises'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'
import {CORE,SECTIONS} from '../src/data/ai-macro/contract.js'
import {macroCopy as c,text,valueText,periodText} from '../src/i18n/aiMacro.js'
const {chromium}=await import(pathToFileURL(process.env.WIL_PLAYWRIGHT_MODULE))
const url=process.env.WIL_BROWSER_URL||'http://127.0.0.1:5194/world-inflation-lens/',out=resolve(process.env.WIL_BROWSER_OUTPUT_DIR||'.refresh/ai-macro-browser')
await mkdir(out,{recursive:true})
const data=JSON.parse(await readFile(new URL('../src/data/ai-macro/summary.json',import.meta.url)))
const browser=await chromium.launch({headless:true,executablePath:process.env.WIL_CHROME_EXECUTABLE}),results=[],requests=[],errors=[]
try{
 for(const width of [390,1280])for(const language of ['en','zh'])for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width,height:900}});await context.addInitScript(({language,theme})=>{localStorage.setItem('wil-language',language);localStorage.setItem('wil-theme',theme)},{language,theme});const page=await context.newPage()
  page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>requests.push({url:r.url(),resourceType:r.resourceType()}));let fetches=0;page.on('request',r=>{if(r.url().includes('/data/ai-macro/'))fetches++})
  const start=performance.now();await page.goto(url+'#/research/ai-macro');await page.locator('[data-page="ai-macro"]').waitFor();const initialMs=performance.now()-start
  assert.equal(await page.locator('[data-macro-section]').count(),4);assert.equal(fetches,0,'No history fetch on initial route');assert.equal(await page.title(),`${text(c.title,language)} | World Inflation Lens`)
  await page.screenshot({path:resolve(out,`${width}-${language}-${theme}-overview.png`)})
  const historyStart=performance.now();await page.locator('[data-macro-section="ENERGY"]').getByRole('button',{name:text(c.showHistory,language),exact:true}).click();await page.locator('.am-chart svg').waitFor();const historyMs=performance.now()-historyStart
  for(const [channel,ids]of Object.entries(SECTIONS)){
   const panel=page.locator(`[data-macro-section="${channel}"]`),indicator=panel.getByLabel(text(c.indicator,language),{exact:true})
   if(channel!=='ENERGY'){await panel.getByRole('button',{name:text(c.showHistory,language),exact:true}).click();await panel.locator('.am-chart svg').waitFor()}
   for(const id of ids){
    const began=performance.now();await indicator.selectOption(id);
    if(id==='SPF10'){
     const external=panel.locator('[data-external-indicator="SPF10"]');assert.equal(await external.count(),1);assert.equal(await panel.locator('.am-chart,table,[data-series]').count(),0);assert.equal(await panel.getByRole('button').count(),0)
     const link=external.getByRole('link',{name:text(c.spfLink,language),exact:true});assert.equal(await link.getAttribute('href'),data.externalIndicators[0].officialURL);assert.equal(await link.getAttribute('target'),'_blank');assert.equal(await link.getAttribute('rel'),'noopener noreferrer');assert((await external.innerText()).includes(text(c.spfHosted,language)));assert((await external.innerText()).includes(text(c.spfLimits,language)))
     await link.focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');assert(await link.evaluate(e=>e===document.activeElement));assert.notEqual(await link.evaluate(e=>getComputedStyle(e).outlineStyle),'none');await page.screenshot({path:resolve(out,`${width}-${language}-${theme}-spf.png`)});await panel.screenshot({path:resolve(out,`${width}-${language}-${theme}-spf-card.png`)});continue
    }
    const s=data.series.find(s=>s.indicatorId===id&&(!id.startsWith('EIA_COMM_')||s.geography==='VA'))
    assert.equal(await panel.locator('[data-series]').getAttribute('data-series'),s.seriesId);assert((await panel.locator('.am-reading').innerText()).includes(valueText(s.lastRecord.value,language)));assert((await panel.locator('.am-reading').innerText()).includes(periodText(s.lastRecord.period,s.frequency,language)));assert.equal(await panel.locator('.am-chart svg').count(),1);assert((await panel.innerText()).includes(text(c.releaseUnknown,language)));assert((await panel.innerText()).includes(text(c.definitions[id],language)))
    await panel.getByText(text(c.provenance,language),{exact:true}).click();assert((await panel.innerText()).includes(s.sourceHash));await panel.getByText(text(c.provenance,language),{exact:true}).click()
    const anchor=panel.locator('a').first();assert.equal(await anchor.getAttribute('href'),data.sources.find(x=>x.sourceId===s.sourceId).officialURL)
    await panel.getByLabel(text(c.measure,language),{exact:true}).selectOption('nativeChange');assert((await panel.locator('caption').innerText()).includes(s.calculationUnit==='PERCENTAGE_POINTS'?text(c.pp,language):'%'));await panel.getByLabel(text(c.measure,language),{exact:true}).selectOption('value')
    if(id==='CPIAUCSL'){const missing=panel.locator('tr[data-missing="true"]');assert.equal(await missing.count(),1);assert((await missing.innerText()).includes('2025-10'));assert((await missing.innerText()).includes(text(c.missing,language)))}
    if(id==='DFII10'){assert.equal(await panel.getByLabel(text(c.measure,language),{exact:true}).locator('option').count(),2);await panel.getByLabel(text(c.historyRange,language),{exact:true}).selectOption('full');assert((await panel.locator('.am-line').getAttribute('d')).includes('M'));assert((await panel.locator('svg').innerHTML()).includes('2003'));await panel.getByLabel(text(c.historyRange,language),{exact:true}).selectOption('recent')}
    assert(performance.now()-began<5000,'Local indicator switch budget')
   }
   await indicator.selectOption(ids[0]);assert.equal(await panel.locator('tbody tr').count(),24)
  }
  assert.equal(fetches,1,'All four charts share one frozen history fetch')
  // Real keyboard operation of a native selector and paginated table controls.
  const energy=page.locator('[data-macro-section="ENERGY"]'),select=energy.getByLabel(text(c.indicator,language),{exact:true});await select.focus();assert(await select.evaluate(e=>e===document.activeElement));await page.keyboard.press('Tab');assert(await energy.getByLabel(text(c.state,language),{exact:true}).evaluate(e=>e===document.activeElement));await select.selectOption('EIA_COMM_SALES')
  await energy.getByRole('button',{name:text(c.older,language),exact:true}).focus();await page.keyboard.press('Enter');assert.equal(await energy.locator('tbody tr').count(),24);await energy.getByRole('button',{name:text(c.newer,language),exact:true}).click()
  assert.equal(await page.locator('.am-chart svg').count(),4);assert.equal(await page.locator('.am-page table caption').count(),4)
  const overflow=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,offenders:[...document.querySelectorAll('.am-page *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).map(e=>e.tagName+'.'+e.className).slice(0,8)}));assert(overflow.scroll<=width+1,JSON.stringify(overflow));assert.equal(overflow.offenders.length,0,JSON.stringify(overflow))
  await energy.locator('.am-chart').scrollIntoViewIfNeeded();await page.screenshot({path:resolve(out,`${width}-${language}-${theme}-history.png`)})
  // Local navigation is resolved by the existing router, not a new navigation framework.
  await page.goto(url+'#/research');await page.locator('main .research-tool-link[href="#/research/ai-macro"]').click();await page.locator('[data-page="ai-macro"]').waitFor()
  results.push({width,language,theme,result:'PASS',initialMs:Math.round(initialMs),historyMs:Math.round(historyMs),historyRequests:fetches,indicators:12,charts:4,overflow,keyboard:'PASS: Tab focus and Enter table pagination; semantic native selects; OS popup arrow selection not automated',missingCPI:'PASS'});await context.close()
 }
 for(const mode of ['blocked','changed_bytes']){
  const context=await browser.newContext();await context.addInitScript(()=>localStorage.setItem('wil-language','en'));const page=await context.newPage();let attempts=0
  const bytes=await readFile(new URL('../public/'+data.historyArtifact.path,import.meta.url));bytes[10]^=1
  await page.route('**/data/ai-macro/**',r=>{attempts++;return mode==='blocked'?r.fulfill({status:503,body:'blocked'}):r.fulfill({status:200,contentType:'application/json',body:bytes})})
  await page.goto(url+'#/research/ai-macro');const panel=page.locator('[data-macro-section="ENERGY"]');await panel.getByRole('button',{name:c.showHistory.en,exact:true}).click();await panel.getByRole('alert').waitFor();assert.equal(await page.locator('[data-series]').count(),4);assert.equal(await page.locator('.am-chart').count(),0);assert.equal(attempts,1);await panel.getByRole('button',{name:c.retry.en,exact:true}).click();await panel.getByRole('alert').waitFor();assert.equal(attempts,2);results.push({mode,result:'PASS',summaryRetained:true,automaticRetry:false});await context.close()
 }
 const context=await browser.newContext(),page=await context.newPage();for(const route of (await import('../src/utils/routing.js')).routes.filter(r=>r!=='research/ai-macro')){await page.goto(url+'#/'+route);await page.locator('main h1').waitFor();assert.equal(await page.locator('h1').count(),1);assert(!/NaN|Infinity|undefined/.test(await page.locator('main').innerText()));results.push({legacyRoute:route,result:'PASS'})}await context.close()
 assert.equal(errors.length,0,errors.join('\n'));const sourceRequests=requests.filter(r=>/eia\.gov|census\.gov|fred\.stlouisfed\.org|philadelphiafed\.org/.test(r.url));assert.equal(sourceRequests.length,0,'No live economic source requests')
 const report={schemaVersion:'D21_BROWSER_1',browser:await browser.version(),execution:'Headless installed Chrome; local loopback preview, cold context per combination; not a remote network benchmark',url,results,pageErrors:errors,economicRuntimeRequests:sourceRequests,classification:'PASS'};await writeFile(resolve(out,'results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2))
}finally{await browser.close()}
