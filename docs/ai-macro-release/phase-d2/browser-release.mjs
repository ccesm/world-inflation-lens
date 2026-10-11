// Actual Chromium integration checks; separate public hold from local-only full fixtures.
import assert from 'node:assert/strict'
import {readFile,mkdir,writeFile} from 'node:fs/promises'
import {resolve,join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {routes} from '../../../src/utils/routing.js'
import {macroCopy as c} from '../../../src/i18n/aiMacro.js'
const {chromium}=await import(pathToFileURL(process.env.WIL_PLAYWRIGHT_MODULE)),out=resolve(process.env.WIL_BROWSER_OUTPUT_DIR||'.refresh/d2-release-browser')
const candidate=process.env.WIL_D2_CANDIDATE_URL,full=process.env.WIL_D2_FULL_URL
assert(candidate&&full&&new URL(candidate).hostname==='127.0.0.1'&&new URL(full).hostname==='127.0.0.1','Local QA URLs only')
await mkdir(out,{recursive:true});const browser=await chromium.launch({headless:true,executablePath:process.env.WIL_CHROME_EXECUTABLE}),results=[],errors=[]
try{
 for(const width of [390,1280])for(const language of ['en','zh'])for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width,height:900}});await context.addInitScript(({language,theme})=>{localStorage.setItem('wil-language',language);localStorage.setItem('wil-theme',theme)},{language,theme});const page=await context.newPage();let historyRequests=0;const external=[]
  page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>{if(r.url().includes('/data/ai-macro/'))historyRequests++;if(new URL(r.url()).origin!==new URL(candidate).origin)external.push(r.url())})
  await page.goto(candidate+'#/research/ai-macro');await page.getByText(c.releaseHold[language],{exact:true}).waitFor();await page.reload();await page.getByText(c.releaseHold[language],{exact:true}).waitFor()
  assert.equal(await page.locator('[data-series]').count(),0);assert.equal(await page.locator('.am-chart').count(),0);assert.equal(historyRequests,0);assert.equal(await page.locator('html').getAttribute('lang'),language==='zh'?'zh-CN':'en');assert.equal(await page.locator('html').getAttribute('data-theme'),theme)
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:join(out,`${width}-${language}-${theme}-hold.png`)})
  await page.goto(candidate+'#/research');await page.locator('main .research-tool-link[href="#/research/ai-macro"]').click();await page.getByText(c.releaseHold[language],{exact:true}).waitFor()
  assert(external.every(u=>['fonts.googleapis.com','fonts.gstatic.com','raw.githubusercontent.com'].includes(new URL(u).hostname)),'Unexpected external request');
  results.push({kind:'PUBLIC_HOLD',width,language,theme,result:'PASS',records:0,historyRequests,externalRequests:external.length,externalURLs:[...new Set(external)]});await context.close()
 }
 const context=await browser.newContext();await context.addInitScript(()=>localStorage.setItem('wil-language','en'));const page=await context.newPage(),network=[];page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>network.push(r.url()))
 for(const route of routes.filter(r=>r!=='research/ai-macro')){await page.goto(candidate+'#/'+route);await page.locator('main h1').waitFor();assert.equal(await page.locator('main h1').count(),1,route);assert(!/NaN|Infinity|undefined/.test(await page.locator('main').innerText()),route);results.push({kind:'LEGACY_ROUTE',route,result:'PASS'})}
 assert.equal(network.filter(u=>u.includes('/data/ai-macro/')).length,0);assert.equal(network.filter(u=>/\/AiMacro-[^/]+\.js/.test(u)).length,0,'Unrelated routes do not load macro bundle')
 await context.close()
 // AX tree checks supplement, and never claim to replace, VoiceOver/NVDA.
 for(const language of ['en','zh']){
  const context=await browser.newContext({viewport:{width:390,height:900}});await context.addInitScript(lang=>localStorage.setItem('wil-language',lang),language);const page=await context.newPage();await page.goto(full+'#/research/ai-macro');const energy=page.locator('[data-macro-section="ENERGY"]');await energy.waitFor();const indicator=energy.getByLabel(c.indicator[language],{exact:true})
  await indicator.focus();await page.keyboard.press('Tab');assert(await energy.getByLabel(c.state[language],{exact:true}).evaluate(e=>e===document.activeElement));await page.keyboard.press('Shift+Tab');assert(await indicator.evaluate(e=>e===document.activeElement));const outline=await indicator.evaluate(e=>getComputedStyle(e).outlineStyle);assert.notEqual(outline,'none')
  const button=energy.getByRole('button',{name:c.showHistory[language],exact:true});await button.focus();await page.keyboard.press('Space');await energy.locator('.am-chart').waitFor();await energy.getByRole('button',{name:c.older[language],exact:true}).focus();await page.keyboard.press('Enter');assert((await energy.locator('tbody th').first().innerText()).includes('2023'))
  const chartText=await energy.locator('.am-chart-text').innerText();assert(chartText.includes(c.chartLatest[language]));assert(chartText.includes('2025-12-01'));assert(chartText.includes(c.methodText[language]));assert.equal(await energy.locator('.am-chart-axis').evaluate(e=>getComputedStyle(e).fontSize),'13px')
  const cdp=await context.newCDPSession(page),ax=await cdp.send('Accessibility.getFullAXTree');const exposed=ax.nodes.filter(x=>!x.ignored);assert(exposed.some(x=>x.role?.value==='table'));assert(exposed.some(x=>x.role?.value==='combobox'));assert(exposed.some(x=>x.role?.value==='main'));await writeFile(join(out,`ax-${language}.json`),JSON.stringify(ax,null,2)+'\n')
  results.push({kind:'FULL_LOCAL_AX_KEYBOARD',language,result:'PASS',actualScreenReader:'MANUAL ACCEPTANCE PENDING',visibleFocus:outline});await context.close()
 }
 // A bounded local render measurement, including the largest daily series, not a universal benchmark.
 const perfContext=await browser.newContext(),perfPage=await perfContext.newPage();await perfPage.goto(full+'#/research/ai-macro');const panel=perfPage.locator('[data-macro-section="FINANCING"]');await panel.getByLabel(c.indicator.en,{exact:true}).selectOption('DFII10');const cdp=await perfContext.newCDPSession(perfPage);await cdp.send('Performance.enable');const before=(await cdp.send('Performance.getMetrics')).metrics
 const started=performance.now();await panel.getByRole('button',{name:c.showHistory.en,exact:true}).click();await panel.locator('.am-chart svg').waitFor();const largestSeriesRenderMs=Math.round(performance.now()-started);const after=(await cdp.send('Performance.getMetrics')).metrics,key=(m,k)=>m.find(x=>x.name===k)?.value
 results.push({kind:'PERFORMANCE',largestSeriesRenderMs,jsHeapUsedBefore:key(before,'JSHeapUsedSize'),jsHeapUsedAfter:key(after,'JSHeapUsedSize'),taskDurationDeltaSeconds:key(after,'TaskDuration')-key(before,'TaskDuration'),method:'Chrome CDP; whole-page heap and task deltas; not a leak proof or isolated component CPU measure'});await perfContext.close()
 assert.equal(errors.length,0,errors.join('\n'));const report={schemaVersion:'D2_BROWSER_1',browser:await browser.version(),environment:'Local macOS Chrome, headless contexts; no public preview',results,pageErrors:errors,screenReader:'MANUAL ACCEPTANCE PENDING'};await writeFile(join(out,'results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2))
}finally{await browser.close()}
