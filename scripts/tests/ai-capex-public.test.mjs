import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createHash} from 'node:crypto'
import snapshot from '../../src/data/ai-capex/monitor.json' with {type:'json'}
import {validCapexSnapshot,snapshotSha256,sourceCommits} from '../../src/data/ai-capex/contract.js'
import {chartSegments,formatCapex} from '../../src/utils/aiCapex.js'
import {aiCapexCopy} from '../../src/i18n/aiCapex.js'
import {routes,primaryRoutes,routeFromHash,routeSection} from '../../src/utils/routing.js'
import {sectionLinks,iaCopy} from '../../src/i18n/architecture.js'
import {pageResearchContext,structuralThemes} from '../../src/data/researchArchitecture.js'
const raw=fs.readFileSync('src/data/ai-capex/monitor.json','utf8'),clone=v=>JSON.parse(JSON.stringify(v))
const c=id=>snapshot.companies.find(c=>c.id===id),m=(id,key)=>c(id).metrics[key]
const near=(v,w)=>assert.ok(Math.abs(v-w)<1e-9)

test('new research route preserves primary and existing routes',()=>{
 assert.deepEqual(primaryRoutes,['home','dollar','fiscal','history','scenarios','research'])
 assert.equal(routeFromHash('#/research/ai-capex'),'research/ai-capex');assert.equal(routeSection('research/ai-capex'),'research')
 for(const r of ['research/ai-labor','research/ai-productivity','research/signal-engine','fiscal','purchasing-power','research/international-dollar'])assert(routes.includes(r))
 assert(sectionLinks.research.some(([href])=>href==='#/research/ai-capex'))
 assert.equal(pageResearchContext['research/ai-capex'].theme,'capacity')
 assert(structuralThemes.find(t=>t.id==='capacity').routes.some(r=>r.href==='#/research/ai-capex'))
})
test('bounded snapshot schema, bytes and frozen provenance identity',()=>{
 assert(validCapexSnapshot(snapshot));assert(Buffer.byteLength(raw)<120000)
 assert.equal(createHash('sha256').update(raw).digest('hex'),snapshotSha256)
 assert.equal(snapshot.provenance.phase2B,sourceCommits.phase2B);assert.equal(snapshot.provenance.phase2A1,sourceCommits.phase2A1)
 assert.equal(snapshot.provenance.monitorHash,'51a55bb8b9c585026ab37898746695060b3dbb3a7c6aaa83efb5645cbe91a2d4')
 assert.equal(snapshot.provenance.publicProjectionHash,'1e74e04a1f32ae2d60c3429c14b215560ec085234d783bc52d9bbbe2d7079a2e')
 assert.equal(snapshot.dataThrough,'2026Q2');assert.equal(snapshot.asOf,'2026-07-30')
 assert.deepEqual(snapshot.companies.map(c=>c.id),['MSFT','GOOG','AMZN','META'])
})
const expected={MSFT:[39.77690624062573,21.819414045574234,45.11093581610319,109.62585631477253,-11.628604687827995],GOOG:[37.500417376206215,-4.8874753748038335,34.03285585495342,100.14256437672637,-10.38484128512034],AMZN:[26.457832766716848,-3.8328863543463307,13.68902226254449,69.20428462127009,-4.516837648904535],META:[49.53208006447262,1.2894524761105903,30.879426325224912,82.10182609747248,-16.702381853378423]}
for(const [id,v]of Object.entries(expected))test(id+' exact qualified public observations and YoY semantics',()=>{
 near(m(id,'cashInvestmentIntensity').value,v[0]);near(m(id,'fcfMargin').value,v[1]);near(m(id,'operatingMargin').value,v[2]);near(m(id,'cashPpeNative').yoy.percentChange,v[3]);near(m(id,'fcfMargin').yoy.delta,v[4]);assert.equal(m(id,'fcfMargin').yoy.deltaUnit,'PERCENTAGE_POINTS')
})
test('both locales cover identical nested copy keys and navigation title',()=>{
 const keys=v=>v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,keys(v[k])])):'leaf'
 assert.deepEqual(keys(aiCapexCopy.en),keys(aiCapexCopy.zh))
 for(const lang of ['en','zh']){const t=aiCapexCopy[lang];assert.equal(t.sections.length,10);assert.equal(t.layers.length,5);assert.equal(iaCopy[lang].nav['research/ai-capex'],t.title);assert(t.can.length>=6&&t.cannot.length>=6);for(const id of ['MSFT','GOOG','AMZN','META'])assert(t.boundaries[id].length>=2)}
})
test('management run-rates stay annualized sparse lower bounds, never recognized revenue',()=>{
 const rates=snapshot.events.filter(e=>e.kind==='DIRECT_AI_RUN_RATE');assert.deepEqual(rates.map(e=>e.value),[37000,25000])
 assert.deepEqual(rates.map(e=>e.reportingQuarter),['2026Q1','2026Q2'])
 for(const e of rates){assert.equal(e.periodType,'RUN_RATE');assert.equal(e.frequency,'ANNUALIZED_RATE');assert.equal(e.recognizedRevenue,false);assert.equal(e.precision,'LOWER_BOUND');assert.equal(e.monetizationLevel,1)}
 assert.equal(m('AMZN','segmentRevenue').value,42232)
})
test('paid seats remain counts and not priced into recognized AI revenue',()=>{const e=snapshot.events.find(e=>e.kind==='PAID_AI_SEATS');assert.equal(e.value,30);assert.equal(e.unit,'MILLION_SEATS');assert.equal(e.monetizationLevel,2);assert.equal(e.recognizedRevenue,false)})
test('RPO stays a point observation, with Alphabet definition break',()=>{
 for(const e of snapshot.events.filter(e=>e.kind==='BACKLOG')){assert.equal(e.periodType,'POINT');assert.equal(e.recognizedRevenue,false)}
 const e=snapshot.events.find(e=>e.company==='GOOG'&&e.kind==='BACKLOG');assert.equal(e.value,513900);assert.equal(e.definitionVersion,'ALPHABET_RPO_SHORT_TERM_INCLUDED_V2')
 assert(aiCapexCopy.en.rpoBreak.includes('2026Q1'));assert(aiCapexCopy.zh.rpoBreak.includes('2026Q1'))
})
test('guidance remains forward, ranges never become midpoint',()=>{
 const e=snapshot.events.find(e=>e.company==='META'&&e.kind==='CAPEX_GUIDANCE');assert.equal(e.value,null);assert.equal(e.rangeLower,130000);assert.equal(e.rangeUpper,145000);assert.equal(e.periodType,'GUIDANCE');assert.equal(e.evidenceClass,'FORWARD_GUIDANCE')
 const ms=snapshot.events.find(e=>e.company==='MSFT'&&e.kind==='CAPEX_GUIDANCE');assert.equal(ms.value,175000)
 assert(!Object.values(c('META').history).flat().some(p=>p.value===137500))
})
test('native cloud margins are not AI margins and recasts block growth comparisons',()=>{
 near(m('MSFT','segmentOperatingMargin').value,40.59176716022999);near(m('GOOG','segmentOperatingMargin').value,35.58624031007752);near(m('AMZN','segmentOperatingMargin').value,39.356412199280165)
 for(const id of ['MSFT','GOOG'])assert.equal(m(id,'segmentOperatingMargin').yoy.state,'LIMITED_COMPARABILITY')
 near(m('AMZN','segmentRevenue').yoy.percentChange,36.79266673144819);near(m('AMZN','segmentOperatingMargin').yoy.delta,6.447397850172528)
 assert.equal(m('META','segmentOperatingMargin').value,null)
})
test('pure depreciation is never replaced by broad D&A',()=>{
 assert.equal(m('GOOG','depreciationPpe').value,7104);near(m('GOOG','pureDepreciationToRevenue').value,5.930081137934488);near(m('GOOG','depreciationPpe').yoy.percentChange,42.136854741896755)
 for(const id of ['MSFT','AMZN','META']){assert.equal(m(id,'depreciationPpe').value,null);assert.equal(m(id,'pureDepreciationToRevenue').value,null)}
})
test('native boundaries visible in both languages',()=>{
 for(const lang of ['en','zh']){const t=aiCapexCopy[lang];assert(t.boundaries.MSFT.join().includes('UNRECONCILED_NATIVE_CAPEX_SCOPE'));assert(t.boundaries.META.join().includes('5.5'));assert(t.nativeCash.AMZN.includes(lang==='en'?'Net':'净'));assert(t.boundaries.META.length===3);assert(t.chartAccountingNotes.operatingMargin.includes(lang==='en'?'operating income':'营业利润'));for(const id of ['MSFT','GOOG','AMZN','META']){assert(t.chartAccountingNotes.fcfMargin[id].includes(lang==='en'?'quarterly FCF':'季度自由现金流'));assert.notEqual(t.chartAccountingNotes.fcfMargin[id],t.nativeCash[id])};assert(t.chartAccountingNotes.fcfMargin.META.includes(lang==='en'?'finance-lease principal':'融资租赁本金'))}
 assert.equal(m('AMZN','cashPpeNative').value,53076)
})
test('all histories exact quarterly; Meta definition changes create disconnected paths',()=>{
 for(const c of snapshot.companies)for(const points of Object.values(c.history)){assert.equal(points.length,30);assert.equal(points.at(-1).period,'2026Q2');assert.equal(points[0].period,'2019Q1')}
 assert(c('META').history.fcfMargin.some(p=>p.breakBefore))
 for(const metric of ['cashInvestmentIntensity','fcfMargin','operatingMargin']){
  const points=c('META').history[metric],segments=chartSegments(points);assert.equal(segments.flat().length,points.filter(p=>Number.isFinite(p.value)).length)
  for(const segment of segments)assert.equal(new Set(segment.map(p=>p.basis)).size,1)
 }
})
test('synthetic missing values remain gaps and single points remain available',()=>{
 const points=[{value:1},{value:null},{value:0},{value:2,breakBefore:true},{value:3}];assert.deepEqual(chartSegments(points).map(s=>s.map(p=>p.value)),[[1],[0],[2,3]])
})
for(const [label,mutate]of [['wrong unit',s=>s.companies[0].metrics.cfo.unit='PERCENT'],['false disclosure basis',s=>s.asOfBasis='RETRIEVAL_DATE'],['false projection hash',s=>s.provenance.publicProjectionHash='f'.repeat(64)],['unknown ROI field',s=>s.aiRoi=20],['boundary',s=>s.dataThrough='2026Q3'],['nonfinite',s=>s.companies[0].metrics.cfo.value=NaN],['future event',s=>s.events[0].eventDate='2026-12-01'],['quarter order',s=>s.companies[0].history.fcfMargin.reverse()],['hidden definition break',s=>s.companies[3].history.fcfMargin.find(p=>p.breakBefore).breakBefore=false],['run-rate recognition',s=>s.events.find(e=>e.kind==='DIRECT_AI_RUN_RATE').recognizedRevenue=true],['guidance midpoint',s=>s.events.find(e=>e.company==='META'&&e.kind==='CAPEX_GUIDANCE').value=137500],['unknown source',s=>s.events[0].sourceId='FAKE'],['research commit',s=>s.provenance.phase2B='f'.repeat(40)]])test('snapshot contract fails closed: '+label,()=>{const s=clone(snapshot);mutate(s);assert.equal(validCapexSnapshot(s),false)})
test('no return, aggregate or company-ranking fields; no local paths',()=>{
 const walk=x=>{if(x&&typeof x==='object')for(const [k,v]of Object.entries(x)){assert(!/^(roi|roic|irr|npv|payback|score|rank|winner|aggregate|weightedTotal|estimatedAiRevenue)$/i.test(k),k);walk(v)}};walk(snapshot)
 assert.equal(snapshot.aiReturns.status,'NOT_IDENTIFIED');assert.deepEqual(snapshot.recognizedAiRevenue,{status:'UNAVAILABLE',companyQuarterCells:120});assert(!/\/Users\/|\/private\/|file:\/\/|cachePath|accessToken/.test(raw))
})
test('production feature never calls runtime APIs or imports research engine/history',()=>{
 for(const file of ['src/pages/AiCapex.jsx','src/utils/aiCapex.js','src/data/ai-capex/contract.js']){const text=fs.readFileSync(file,'utf8');assert(!/fetch\(|XMLHttpRequest|process\.env|VITE_|from ['"].*research\//.test(text))}
 assert(fs.readFileSync('src/App.jsx','utf8').includes('const AiCapex = lazy'))
 const labor=JSON.parse(fs.readFileSync('src/data/ai-labor/interim-conclusion.json'));assert.equal(labor.researchStatus,'OBSERVATION_MODE');assert.equal(labor.monitorActivated,false)
 assert(fs.readFileSync('src/pages/AiProductivity.jsx','utf8').includes('href="#/research/ai-capex"'));assert(fs.readFileSync('src/pages/AiLabor.jsx','utf8').includes('href="#/research/ai-capex"'))
})
test('numeric formatting never converts missing data to zero',()=>{assert.equal(formatCapex(null),'—');assert.equal(formatCapex(-4.887475),'−4.89');assert.equal(formatCapex(109.625856,{signed:true}),'+109.63')})
