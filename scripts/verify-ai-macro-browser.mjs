// D3.3 research-publication acceptance; no source downloads or hosted history.
import assert from 'node:assert/strict'
import {readFile,mkdir,writeFile} from 'node:fs/promises'
import {resolve,join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {macroCopy as c,text} from '../src/i18n/aiMacro.js'
import {CHANNELS} from '../src/data/ai-macro/contract.js'
const {chromium}=await import(pathToFileURL(process.env.WIL_PLAYWRIGHT_MODULE))
const url=process.env.WIL_BROWSER_URL||'http://127.0.0.1:5198/world-inflation-lens/',out=resolve(process.env.WIL_BROWSER_OUTPUT_DIR||'.refresh/d33-browser')
assert.equal(new URL(url).hostname,'127.0.0.1');await mkdir(out,{recursive:true})
const p=JSON.parse(await readFile(new URL('../src/data/ai-macro/publication.json',import.meta.url)))
const browser=await chromium.launch({headless:true,executablePath:process.env.WIL_CHROME_EXECUTABLE}),results=[],requests=[],errors=[],axe=[]
try{
 for(const width of [320,390,1280])for(const language of ['en','zh'])for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width,height:900}});await context.addInitScript(({language,theme})=>{localStorage.setItem('wil-language',language);localStorage.setItem('wil-theme',theme)},{language,theme})
  const page=await context.newPage(),t=x=>text(x,language);let historyRequests=0
  page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>requests.push({url:r.url(),type:r.resourceType()}))
  await page.route('**/data/ai-macro/**',r=>{historyRequests++;return r.abort()})
  const start=performance.now();await page.goto(url+'#/research/ai-macro');await page.locator('[data-page="ai-macro"]').waitFor();const renderMs=Math.round(performance.now()-start)
  assert.equal(await page.title(),t(c.title)+' | World Inflation Lens');assert.equal(await page.locator('h1').count(),1)
  const article=page.locator('[data-page="ai-macro"]');assert.equal(await article.locator('[data-macro-section]').count(),4);assert.equal(await article.locator('[data-evidence-id]').count(),12)
  assert.equal(await article.locator('table,svg,canvas,select,iframe,a[download]').count(),0)
  assert((await article.innerText()).includes(t(c.accessBoundary)));assert((await article.innerText()).includes('2026-10-09'));assert((await article.innerText()).includes('2026-10-17'))
  for(const channel of p.channels){
   const section=page.locator(`[data-macro-section="${channel.id}"]`),copy=c.channels[channel.id]
   for(const key of ['question','finding','alternatives','unresolved','method'])assert((await section.innerText()).includes(t(copy[key])))
   for(const key of ['finding','observations','counterEvidence','alternatives','unresolved','sectionMethod'])assert.equal(await section.getByRole('heading',{name:t(c[key]),exact:true}).count(),1)
   const details=section.locator('.am-sources');await details.locator('summary').click();assert(await details.evaluate(e=>e.open))
   for(const id of channel.sourceIds){const source=section.locator(`[data-source-id="${id}"]`),spec=p.sources.find(x=>x.id===id);assert((await source.innerText()).includes(spec.datasetIdentifier));assert((await source.innerText()).includes(t(c.providers[spec.providerId])));assert((await source.innerText()).includes(t(c.sourceCopy[id].access)));const link=source.locator('a').first();assert.equal(await link.getAttribute('href'),spec.officialURL);assert.equal(await link.getAttribute('target'),null);assert.equal(await link.getAttribute('download'),null)}
  }
  assert.equal(await article.locator('[data-source-id]').count(),12)
  // Native disclosure operation and ordinary same-context provider navigation.
  const first=article.locator('.am-sources').first();await first.evaluate(e=>e.open=false);await first.locator('summary').focus();await page.keyboard.press('Space');assert(await first.evaluate(e=>e.open));await page.keyboard.press('Tab');const link=first.locator('a').first();assert(await link.evaluate(e=>e===document.activeElement));assert.notEqual(await link.evaluate(e=>getComputedStyle(e).outlineStyle),'none');await page.keyboard.press('Shift+Tab');assert(await first.locator('summary').evaluate(e=>e===document.activeElement))
  // Existing hash-router focus semantics remain valid for each research channel.
  for(const id of CHANNELS){await article.locator(`.am-contents a[href$="macro-${id}"]`).click();await page.waitForFunction(id=>document.activeElement?.id===`macro-heading-${id}`,id)}
  const overflow=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,offenders:[...document.querySelectorAll('.am-page *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).map(e=>e.tagName).slice(0,10)}));assert(overflow.scroll<=width+1,JSON.stringify(overflow));assert.equal(overflow.offenders.length,0,JSON.stringify(overflow))
  if(width===390){await page.goto(url+'#/research/ai-macro');await article.waitFor();await page.screenshot({path:join(out,`${width}-${language}-${theme}-overview.png`)});await page.locator('[data-macro-section="ENERGY"]').screenshot({path:join(out,`${width}-${language}-${theme}-energy.png`)})}
  if(width===1280&&theme==='light')await article.screenshot({path:join(out,`${width}-${language}-article.png`)})
  if(width===390&&theme==='light'){
   const cdp=await context.newCDPSession(page),ax=await cdp.send('Accessibility.getFullAXTree'),nodes=ax.nodes.filter(n=>!n.ignored)
   for(const channel of p.channels)assert(nodes.some(n=>n.role?.value==='heading'&&n.name?.value===t(c.channels[channel.id].question)))
   assert(nodes.some(n=>n.role?.value==='main'));assert(nodes.some(n=>n.role?.value==='article'))
   await writeFile(join(out,`ax-${language}.json`),JSON.stringify(ax,null,2)+'\n');axe.push({language,result:'PASS',scope:'Named article/main landmarks, four research questions, native disclosure and provider-link keyboard focus',formalScreenReader:'DEFERRED_BY_OWNER'})
  }
  assert.equal(historyRequests,0,'No numerical history request even when every source is opened')
  results.push({width,language,theme,result:'PASS',renderMs,historyRequests,sourceConcepts:12,keyboard:'Native details Space/Tab/Shift+Tab; provider visible focus; channel hash focus',overflow});await context.close()
 }
 const context=await browser.newContext(),page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)))
 for(const route of (await import('../src/utils/routing.js')).routes.filter(r=>r!=='research/ai-macro')){await page.goto(url+'#/'+route);await page.locator('main h1').waitFor();assert.equal(await page.locator('h1').count(),1);assert(!/NaN|Infinity|undefined/.test(await page.locator('main').innerText()));results.push({legacyRoute:route,result:'PASS'})}
 const old=await context.request.get(url+'data/ai-macro/6bfbc2c89362cc39d3ddc7bd50044866d3251059998bcea76196878aa1dcfeb3/history.json');assert(!old.headers()['content-type']?.includes('application/json'));assert(!/AI_MACRO_HISTORY_2/.test(await old.text()));results.push({oldHistoryAsset:'ABSENT',response:old.status(),note:'Preview may return HTML SPA fallback; no numerical data'})
 await context.close();assert.equal(errors.length,0,errors.join('\n'))
 const economicRuntimeRequests=requests.filter(r=>/eia\.gov|census\.gov|fred\.stlouisfed\.org|federalreserve\.gov|bls\.gov|bea\.gov|philadelphiafed\.org/.test(r.url));assert.equal(economicRuntimeRequests.length,0)
 const report={schemaVersion:'D33_NARRATIVE_BROWSER_1',browser:await browser.version(),url,classification:'PASS',results,accessibility:axe,pageErrors:errors,economicRuntimeRequests,formalScreenReader:'DEFERRED_BY_OWNER',execution:'Installed headless Chrome; local production build; no production performance or formal WCAG claim'}
 await writeFile(join(out,'results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2))
}finally{await browser.close()}
