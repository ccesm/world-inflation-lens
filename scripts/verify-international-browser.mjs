// Local production-build acceptance. Uses the same optional browser environment as verify-v1-browser.mjs.
import assert from 'node:assert/strict'
import {readFile,writeFile,mkdir} from 'node:fs/promises'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'
import {internationalCopy} from '../src/i18n/internationalDollar.js'
import {workspaceCopy} from '../src/i18n/workspace.js'
import {statusCopy} from '../src/i18n/systemStatus.js'
const base=process.env.WIL_BROWSER_URL
assert.ok(base&&['127.0.0.1','localhost'].includes(new URL(base).hostname),'Use a local production preview')
const pw=await import(process.env.WIL_PLAYWRIGHT_MODULE?pathToFileURL(resolve(process.env.WIL_PLAYWRIGHT_MODULE)).href:'playwright')
const browser=await pw.chromium.launch({headless:true,...(process.env.WIL_CHROME_EXECUTABLE?{executablePath:process.env.WIL_CHROME_EXECUTABLE}:{})})
const output=resolve(process.env.WIL_BROWSER_OUTPUT_DIR||'.refresh/international-browser')
await mkdir(output,{recursive:true})
const datasets=await Promise.all(['reserve-composition','treasury-holdings','global-dollar-credit'].map(async f=>JSON.parse(await readFile(`data/international-dollar/${f}.json`,'utf8'))))
const series=Object.fromEntries(datasets.flatMap(d=>d.series.map(s=>[s.id,{...d.metadata,...s}])))
const report={checkedAt:new Date().toISOString(),url:base,display:[],exports:[],workspace:[],navigation:[],failureRecovery:[],errors:[]}
const csv=text=>{const rows=[],row=[];let cell='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++}else quoted=!quoted}else if(!quoted&&[',','\n','\r'].includes(c)){row.push(cell.replace(/^\ufeff/,''));cell='';if(c!==','){rows.push([...row]);row.length=0;if(c==='\r'&&text[i+1]==='\n')i++}}else cell+=c}if(cell||row.length){row.push(cell);rows.push(row)}assert.ok(!quoted);const header=rows.shift();return rows.map(row=>{assert.equal(row.length,header.length);return Object.fromEntries(header.map((h,i)=>[h,row[i]]))})}
async function download(page,button){const event=page.waitForEvent('download');await button.click();const file=await event;assert.equal(await file.failure(),null);return csv(await readFile(await file.path(),'utf8'))}
async function open(page,hash){await page.goto(base+hash,{waitUntil:'networkidle'});await page.locator('main h1').waitFor();await page.evaluate(()=>document.fonts.ready)}
async function bounds(page){const size=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));assert.ok(size.scroll<=size.width+1,JSON.stringify(size));return size}
async function context(language,theme='light',width=390){const ctx=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:1,colorScheme:theme});await ctx.addInitScript(({language,theme})=>{localStorage.setItem('wil-language',language);localStorage.setItem('wil-theme',theme)},{language,theme});return ctx}
function track(page){page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&m.location().url.startsWith(new URL(base).origin))report.errors.push(m.text())});page.on('response',r=>{if(r.url().startsWith(new URL(base).origin)&&r.status()>=400)report.errors.push(r.url())})}
try{
 for(const width of [320,390,1280])for(const language of ['en','zh'])for(const theme of ['light','dark']){
  const ctx=await context(language,theme,width),page=await ctx.newPage(),t=internationalCopy[language];track(page)
  await open(page,'#/research/international-dollar');await bounds(page)
  assert.equal(await page.locator('main h1').textContent(),t.title)
  assert.equal(await page.locator('[data-coverage-row]').count(),8)
  assert.equal(await page.locator('[data-coverage-row]').filter({hasText:t.direct}).count(),3)
  for(const i of [3,4,7])assert.ok((await page.locator(`[data-coverage-row="${i}"]`).textContent()).includes(t.planned))
  assert.equal(await page.locator('[data-international-series]').count(),3)
  assert.equal(await page.locator('#international-health .intl-health-grid > article').count(),18)
  const table=await page.locator('.intl-table-scroll').evaluate(el=>({width:el.clientWidth,scroll:el.scrollWidth,overflow:getComputedStyle(el).overflowX}))
  if(width<1000){assert.ok(table.scroll>table.width);assert.equal(table.overflow,'auto')}
  const charts=await page.locator('.intl-chart svg').evaluateAll(els=>els.map(el=>({width:el.getBoundingClientRect().width,viewWidth:el.viewBox.baseVal.width,font:Number.parseFloat(getComputedStyle(el.querySelector('text')).fontSize),path:el.querySelector('path').getAttribute('d')})))
  for(const chart of charts){assert.ok(chart.path&&!/NaN|Infinity/.test(chart.path));assert.ok(chart.font*chart.width/chart.viewWidth>=11,'Chart labels remain readable at mobile size')}
  for(const id of ['COFER_USD','TIC_TOTAL','BIS_USD_TOTAL']){const note=page.locator(`.intl-chart [data-series-status="${id}"]`);assert.ok(await note.getAttribute('data-freshness'));await note.locator('summary').click();assert.ok((await note.textContent()).includes(statusCopy[language].retrieved))}
  const file=`international-${width}-${language}-${theme}.png`;await page.screenshot({path:resolve(output,file),fullPage:true})
  await page.locator('#cofer').scrollIntoViewIfNeeded();await page.screenshot({path:resolve(output,`reserve-${width}-${language}-${theme}.png`)})
  report.display.push({width,language,theme,table,charts:charts.map(({path,...rest})=>rest),screenshot:file})
  await ctx.close()
 }
 for(const language of ['en','zh']){
  const ctx=await context(language),page=await ctx.newPage(),t=internationalCopy[language],w=workspaceCopy[language];track(page)
  await open(page,'#/research/international-dollar')
  for(const dataset of datasets){await page.reload({waitUntil:'networkidle'});const chart=page.locator(`#${dataset.metadata.id} .intl-chart`)
   for(const s of dataset.series.filter(s=>s.id!=='COFER_IMPUTED')){
    await chart.getByRole('combobox',{name:t.series,exact:true}).selectOption(s.id)
    const records=await download(page,chart.getByRole('button',{name:t.csv,exact:true}));assert.equal(records.length,s.observations.length)
    for(const [i,row]of records.entries()){const p=s.observations[i];assert.equal(row.series,s.id);assert.equal(row.value,p.value===null?'':String(p.value));assert.equal(row.source_period,p.sourcePeriod||p.date);assert.equal(row.frequency,s.frequency);assert.equal(row.units,s.units);assert.equal(row.denominator,s.denominator);assert.equal(row.measure,'level');assert.equal(row.retrieved,dataset.metadata.retrievedAt)}
    await chart.getByRole('combobox',{name:t.inspect,exact:true}).selectOption(s.observations[0].date)
    assert.ok((await chart.locator('.intl-readout').textContent()).includes(s.observations[0].sourcePeriod||s.observations[0].date))
    report.exports.push({language,id:s.id,rows:records.length})
   }
   await chart.getByRole('combobox',{name:t.range,exact:true}).selectOption('5')
   const subset=await download(page,chart.getByRole('button',{name:t.csv,exact:true}));assert.ok(subset.length<=61)
   await chart.locator('.data-table > summary').click();await bounds(page)
   await chart.getByRole('combobox',{name:t.range,exact:true}).selectOption('all')
   await chart.locator('.data-table button').click();assert.equal(await chart.locator('tbody tr').count(),dataset.series.filter(s=>s.id!=='COFER_IMPUTED').at(-1).observations.length)
  }
  await open(page,'#/research/data?series=COFER_USD,TIC_TOTAL,BIS_USD_TOTAL&range=all')
  assert.equal(await page.locator('[data-workspace-series]').count(),3)
  for(const id of ['COFER_USD','TIC_TOTAL','BIS_USD_TOTAL']){const panel=page.locator(`[data-workspace-series="${id}"]`);const raw=series[id];const records=await download(page,panel.getByRole('button',{name:w.csv,exact:true}));assert.equal(records.length,raw.observations.length);assert.equal(records.at(-1).source_period,raw.observations.at(-1).sourcePeriod||raw.observations.at(-1).date);await panel.locator('.data-table > summary').click()}
  const panel=page.locator('[data-workspace-series="BIS_USD_TOTAL"]');await panel.getByRole('combobox',{name:w.measure,exact:true}).selectOption('yoy')
  const growth=await download(page,panel.getByRole('button',{name:w.csv,exact:true})),raw=series.BIS_USD_TOTAL,lookup=new Map(raw.observations.map(p=>[p.date,p.value]))
  for(const row of growth){const prior=lookup.get(String(Number(row.internal_period_anchor.slice(0,4))-1)+row.internal_period_anchor.slice(4));assert.equal(row.measure,'yoy');assert.equal(row.original_units,'USD millions');if(prior>0)assert.ok(Math.abs(Number(row.value)-(lookup.get(row.internal_period_anchor)/prior-1)*100)<1e-9);else assert.equal(row.value,'')}
  await page.getByRole('searchbox').fill('COFER_IMPUTED');assert.equal(await page.locator('.workspace-card').count(),1)
  await page.getByRole('button',{name:`${w.save} COFER_IMPUTED`,exact:true}).click();await page.reload({waitUntil:'networkidle'});await page.getByRole('searchbox').fill('COFER_IMPUTED');assert.equal(await page.getByRole('button',{name:`${w.unsave} COFER_IMPUTED`,exact:true}).getAttribute('aria-pressed'),'true')
  await bounds(page);report.workspace.push({language,exportedLevels:3,exactYearGrowth:true,favorites:true,search:true})
  for(const route of ['home','dollar','research']){await open(page,`#/${route}`);await page.locator('main a[href="#/research/international-dollar"]').first().click();await page.locator('.intl-page').waitFor();report.navigation.push({language,from:route})}
  for(const id of ['cofer','tic','bis','international-health']){await open(page,`#/research/international-dollar?focus=${id}`);assert.ok(await page.locator(`#${id}`).evaluate(el=>el.contains(document.activeElement)))}
  await page.locator('#payments a[href="#/research/digital-money"]').click();await page.locator('#dm-market').waitFor();await page.goBack({waitUntil:'networkidle'});await page.locator('.intl-page').waitFor()
  await open(page,'#/sources?focus=international-health');assert.equal(await page.locator('#international-health .intl-health-grid > article').count(),18)
  const unknown=page.locator('#international-health article').filter({has:page.locator('[data-series-status="BIS_USD_TOTAL"]')});assert.ok((await unknown.textContent()).includes(t.unknown))
  await ctx.close()
 }
 for(const [chunk,route]of [['InternationalDollar','research/international-dollar'],['SectionLanding','dollar'],['ExternalShocks','external-shocks']])for(const language of ['en','zh']){
  const ctx=await context(language),page=await ctx.newPage();await page.route(`**/assets/${chunk}-*.js`,r=>r.abort());await open(page,'#/'+route)
  await page.locator('main [role="alert"]').waitFor();assert.equal(await page.locator('.mobile-nav a').count(),6)
  await page.locator('.mobile-nav a[href="#/home"]').click();await page.locator('#current-evidence').waitFor();await bounds(page)
  await open(page,'#/'+route);await page.locator('main [role="alert"]').waitFor();await page.unroute(`**/assets/${chunk}-*.js`);await Promise.all([page.waitForNavigation({waitUntil:'networkidle'}),page.locator('main [role="alert"] button').click()]);assert.equal(await page.locator('main [role="alert"]').count(),0);await page.locator('main h1').waitFor();report.failureRecovery.push({chunk,language,visibleFallback:true,homeNavigation:true,reloadRecovery:true});await ctx.close()
 }
 assert.deepEqual(report.errors,[]);report.result='PASS'
} catch(e){report.result='FAIL';report.failure=e.stack;throw e}finally{await writeFile(resolve(output,'report.json'),JSON.stringify(report,null,2));await browser.close()}
console.log(`PASS: ${report.display.length} international display combinations, ${report.exports.length} exact CSV exports, bilingual Workspace/navigation and ${report.failureRecovery.length} deferred-download recovery cases`)
