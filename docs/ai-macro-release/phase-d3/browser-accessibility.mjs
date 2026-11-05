// Browser AX and keyboard checks, explicitly separate from spoken screen-reader acceptance.
import assert from 'node:assert/strict'
import {mkdir,writeFile} from 'node:fs/promises'
import {resolve,join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {macroCopy as c} from '../../../src/i18n/aiMacro.js'
const {chromium}=await import(pathToFileURL(process.env.WIL_PLAYWRIGHT_MODULE)),url=process.env.WIL_BROWSER_URL,out=resolve(process.env.WIL_BROWSER_OUTPUT_DIR)
assert(new URL(url).hostname==='127.0.0.1');await mkdir(out,{recursive:true})
const browser=await chromium.launch({headless:true,executablePath:process.env.WIL_CHROME_EXECUTABLE}),results=[]
try{
 for(const language of ['en','zh']){
  const context=await browser.newContext({viewport:{width:390,height:900}});await context.addInitScript(lang=>localStorage.setItem('wil-language',lang),language)
  const page=await context.newPage();let histories=0;page.on('request',r=>{if(r.url().includes('/data/ai-macro/'))histories++})
  await page.goto(url+'#/research/ai-macro');const panel=page.locator('[data-macro-section="INFLATION"]');await panel.waitFor();await panel.getByLabel(c.indicator[language],{exact:true}).selectOption('SPF10')
  const indicator=panel.getByLabel(c.indicator[language],{exact:true});await indicator.focus();await page.keyboard.press('Tab');const link=panel.getByRole('link',{name:c.spfLink[language],exact:true});assert(await link.evaluate(e=>e===document.activeElement));assert.notEqual(await link.evaluate(e=>getComputedStyle(e).outlineStyle),'none');assert.equal(histories,0)
  const cdp=await context.newCDPSession(page),ax=await cdp.send('Accessibility.getFullAXTree'),nodes=ax.nodes.filter(n=>!n.ignored)
  assert(nodes.some(n=>n.role?.value==='heading'&&n.name?.value===c.spfTitle[language]));assert(nodes.some(n=>n.role?.value==='link'&&n.name?.value===c.spfLink[language]));assert(nodes.some(n=>n.name?.value===c.spfHosted[language]));assert(nodes.some(n=>n.role?.value==='main'))
  await writeFile(join(out,`spf-ax-${language}.json`),JSON.stringify(ax,null,2)+'\n')
  await page.keyboard.press('Shift+Tab');assert(await indicator.evaluate(e=>e===document.activeElement));await indicator.selectOption('PCEPILFE');await panel.getByRole('button',{name:c.showHistory[language],exact:true}).focus();await page.keyboard.press('Space');await panel.locator('table').waitFor();assert.equal(histories,1);await indicator.selectOption('SPF10');assert.equal(await panel.locator('table,svg').count(),0);await indicator.selectOption('CPIAUCSL');assert.equal(await panel.locator('table').count(),1)
  results.push({language,result:'PASS',freshSPFHistoryRequests:0,switchBackHistoryRequests:histories,keyboard:'Tab/Shift+Tab/Space',AX:'Named H3, explanatory text, link, main landmark; table restored after numerical selection',screenReader:'DEFERRED_BY_OWNER'});await context.close()
 }
 const context=await browser.newContext(),page=await context.newPage();await context.addInitScript(()=>localStorage.setItem('wil-language','en'));await page.goto(url+'#/research/ai-macro');const panel=page.locator('[data-macro-section="FINANCING"]');await panel.getByLabel(c.indicator.en,{exact:true}).selectOption('DFII10');const start=performance.now();await panel.getByRole('button',{name:c.showHistory.en,exact:true}).click();await panel.locator('svg').waitFor();results.push({kind:'LOCAL_PERFORMANCE',largestSeriesRenderMs:Math.round(performance.now()-start),method:'Cold local context, installed Chrome, includes history fetch/validation/render; not production benchmark'});await context.close()
 await writeFile(join(out,'accessibility-results.json'),JSON.stringify({browser:await browser.version(),results,actualScreenReader:'DEFERRED_BY_OWNER'},null,2)+'\n');console.log(JSON.stringify(results))
}finally{await browser.close()}
