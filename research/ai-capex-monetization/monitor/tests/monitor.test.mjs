import test from 'node:test';
import {evidenceHealth} from '../scripts/health.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {load} from '../../quarterly/scripts/io.mjs';
import {build} from '../../quarterly/scripts/panel.mjs';
import {hash,bytes} from '../../scripts/contract.mjs';
import {evaluate,validateMonitor,researchSummaries,windowView,rules,baseCommit} from '../scripts/monitor.mjs';
import {publicArtifact,validatePublic} from '../scripts/public.mjs';
import {compare,ratio,lineage,comparisonBasis,quarterOffset} from '../scripts/metrics.mjs';
import {validateShape,validateContract} from '../scripts/schema.mjs';
import {run,produce,compactSummary,root} from '../scripts/run.mjs';
const data=load(),monitor=evaluate(data),pub=publicArtifact(monitor),c=monitor.content;
const metric=(company,id,period='2026Q2')=>c.records.find(r=>r.company===company&&r.metric===id&&r.period===period);
const missing=(company,id,period='2026Q2')=>c.missing.find(r=>r.company===company&&r.metric===id&&r.period===period);
const clone=v=>JSON.parse(JSON.stringify(v));
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-10,`${actual} != ${expected}`);

test('frozen four-company 30-quarter boundary, exact base and five independent layers',()=>{
 assert.equal(c.baseCommit,baseCommit);assert.equal(c.dataThrough,'2026Q2');assert.equal(c.timeWindows.length,3);
 assert.deepEqual(c.latest.map(r=>r.company),['MSFT','GOOG','AMZN','META']);
 assert.deepEqual([...new Set(c.metricCatalog.map(m=>m.family).filter(f=>!['cloud','monetization'].includes(f)))].sort(),['accounting','cash','investment','operating']);
 assert.ok(c.metricCatalog.some(m=>m.family==='monetization'));
 assert.equal(c.records.length+c.missing.length,4*30*rules.metrics.length);
 assert.ok(c.records.every(r=>r.period<='2026Q2'&&r.period>='2019Q1'));
});
const arithmetic={MSFT:{ppe:35802,cfo:55441,revenue:90007,fcf:19639,op:40603},GOOG:{ppe:44924,cfo:39069,revenue:119796,fcf:-5855,op:40770},AMZN:{ppe:53076,cfo:45387,revenue:200606,fcf:-7689,op:27461},META:{ppe:30116,cfo:31862,revenue:60801,fcf:784,op:18775}};
for(const [company,a]of Object.entries(arithmetic)){
 test(company+' independent investment and CFO intensity',()=>{assert.equal(metric(company,'cashPpeNative').value,a.ppe);near(metric(company,'cashInvestmentIntensity').value,100*a.ppe/a.revenue);near(metric(company,'cashInvestmentToCfoIntensity').value,100*a.ppe/a.cfo);});
 test(company+' independent FCF and margin',()=>{assert.equal(metric(company,'fcfCompanyConvention').value,a.fcf);near(metric(company,'fcfMargin').value,100*a.fcf/a.revenue);});
 test(company+' independent operating margin',()=>{near(metric(company,'operatingMargin').value,100*a.op/a.revenue);});
}
test('gross margin uses native cost of revenue, not a harmonized gross-profit promise',()=>{
 for(const company of ['MSFT','GOOG','AMZN','META']){const p=build(data.input,data.manifest,data.definitions).content.rows;const row=m=>p.find(r=>r.company===company&&r.calendarQuarter==='2026Q2'&&r.metric===m);near(metric(company,'grossMargin').value,100*(row('revenue').value-row('costRevenue').value)/row('revenue').value);}
 assert.ok(metric('AMZN','grossMargin').limitations.some(s=>s.includes('not a harmonized')));
});
test('Alphabet pure depreciation ratio uses 7104, never broader D&A',()=>{near(metric('GOOG','pureDepreciationToRevenue').value,100*7104/119796);near(metric('GOOG','cashPpeToPureDepreciation').value,44924/7104);});
for(const company of ['MSFT','AMZN','META'])test(company+' pure-depreciation ratios unavailable; broader D&A separate',()=>{
 assert.equal(missing(company,'pureDepreciationToRevenue').value,null);assert.equal(missing(company,'cashPpeToPureDepreciation').value,null);
 assert.ok(metric(company,'broadDaToRevenue'));assert.ok(metric(company,'depreciationAmortizationOther'));});
test('ratio rejects wrong asset, lease scope, period, vintage, rounded operand and nonpositive denominator',()=>{
 const a={observationId:'a',metric:'cashPpeGross',company:'GOOG',periodStart:'2026-04-01',periodEnd:'2026-06-30',scope:'CONSOLIDATED',unit:'USD_MILLIONS',restatementBasis:'same',precision:'EXACT',value:10};
 const b={...a,observationId:'b',metric:'depreciationPpe',value:2};
 for(const patch of [{metric:'depreciationAmortizationOther'},{scope:'LEASE_INCLUSIVE'},{periodEnd:'2026-03-31'},{restatementBasis:'other'},{precision:'ROUNDED'},{value:0},{value:-1}])assert.equal(ratio(a,{...b,...patch},'ratio',new Map(),{pure:true,multiple:true}),null);
});
test('exact prior-year growth and percentage-point margin change',()=>{
 near(metric('MSFT','cashPpeNative').comparisons.yoy.percentChange,100*(35802-17079)/17079);
 near(metric('AMZN','segmentRevenue').comparisons.yoy.percentChange,100*(42232-30873)/30873);
 assert.equal(metric('META','fcfMargin').comparisons.yoy.deltaUnit,'PERCENTAGE_POINTS');
 assert.equal(metric('META','fcfMargin').comparisons.yoy.percentChange,null);
});
test('2019 and 2022 references exact; no reference chosen from closest available date',()=>{
 const m=metric('GOOG','pureDepreciationToRevenue');assert.equal(m.comparisons.baseline2019.state,'UNAVAILABLE');assert.equal(m.comparisons.baseline2019.priorPeriod,'2019Q1');
 assert.equal(metric('MSFT','cashInvestmentIntensity').comparisons.baseline2022.priorPeriod,'2022Q4');
 assert.equal(quarterOffset('2020Q1',-1),'2019Q4');assert.equal(quarterOffset('2026Q2',-4),'2025Q2');
});
test('Meta native gross/net operand break blocks even stable derived IDs',()=>{
 assert.equal(metric('META','cashInvestmentIntensity').comparisons.baseline2022.state,'DEFINITION_BREAK');
 assert.equal(metric('META','fcfMargin').comparisons.baseline2022.state,'DEFINITION_BREAK');
});
test('MSFT native rounded workbook ratio unavailable; warning retained',()=>{
 assert.equal(missing('MSFT','nativeCapexIntensity').value,null);assert.equal(metric('MSFT','nativeCapex').value,41000);
 assert.equal(metric('MSFT','nativeCapex').comparisons.yoy.state,'LIMITED_COMPARABILITY');
 assert.ok(c.latest[0].accountingLimitations.includes('UNRECONCILED_NATIVE_CAPEX_SCOPE'));
});
for(const company of ['MSFT','GOOG'])test(company+' recast segment growth blocked; same-quarter native margin remains visible',()=>{
 assert.equal(metric(company,'segmentRevenue').comparisons.yoy.state,'LIMITED_COMPARABILITY');
 assert.equal(metric(company,'segmentOperatingMargin').comparisons.yoy.state,'LIMITED_COMPARABILITY');
 assert.ok(Number.isFinite(metric(company,'segmentOperatingMargin').value));
});
test('Meta excluded from cloud; first Alphabet segment income gaps not zero',()=>{
 for(const m of ['segmentRevenue','segmentOperatingIncome','segmentOperatingMargin'])assert.equal(missing('META',m).reason,'NO_META_CLOUD_SEGMENT');
 assert.equal(missing('GOOG','segmentOperatingIncome','2019Q1').value,null);
});
test('recognized AI revenue remains unavailable in all 120 cells',()=>{assert.equal(c.missing.filter(r=>r.metric==='aiRevenueRecognized').length,120);assert.ok(!c.records.some(r=>r.metric==='aiRevenueRecognized'));});
test('direct run-rates remain sparse lower bounds, not divided by four or added to cloud',()=>{
 const e=c.events.filter(e=>e.kind==='DIRECT_AI_RUN_RATE');assert.deepEqual(e.map(e=>e.value),[37000,25000]);
 for(const r of e){assert.equal(r.periodType,'RUN_RATE');assert.equal(r.frequency,'ANNUALIZED_RATE');assert.equal(r.precision,'LOWER_BOUND');assert.equal(r.recognizedRevenue,false);}
 assert.equal(metric('AMZN','segmentRevenue').value,42232);assert.equal(e[0].reportingQuarter,'2026Q1');
});
test('Copilot paid seats not priced into revenue; qualitative claims not scored',()=>{
 assert.equal(c.events.find(e=>e.kind==='PAID_AI_SEATS').nativeValue,30);
 for(const e of c.events.filter(e=>e.periodType==='QUALITATIVE')){assert.equal(e.nativeValue,null);assert.ok(!('numericScore'in e));}
});
test('guidance kept outside realized series; range not midpoint',()=>{
 const guidance=c.events.filter(e=>e.periodType==='GUIDANCE');assert.equal(guidance.length,2);
 const meta=guidance.find(e=>e.company==='META');assert.equal(meta.nativeValue,null);assert.equal(meta.rangeLower,130000);assert.equal(meta.rangeUpper,145000);
 assert.ok(guidance.every(e=>e.evidenceClass==='FORWARD_GUIDANCE'));assert.equal(metric('META','nativeCapex').value,31078);
});
test('backlog not revenue; Alphabet break and correct Cloud-only scope preserved',()=>{
 const e=c.events.find(e=>e.company==='GOOG'&&e.kind==='BACKLOG');assert.equal(e.nativeValue,513900);assert.equal(e.definitionVersion,'ALPHABET_RPO_SHORT_TERM_INCLUDED_V2');
 assert.equal(e.recognizedRevenue,false);assert.ok(e.limitations.some(s=>s.includes('not a Google Cloud-only')));
 assert.equal(e.sourceQualificationLevel,'RAW_HASH_QUALIFIED');assert.equal(e.legacyQualification.value,'PHASE1_MANUAL_REVIEWED');assert.ok(e.qualificationClarification);
});
test('policy timeline retains Meta conflict and excludes future MSFT life change from realized quarters',()=>{
 const future=c.accounting.find(e=>e.company==='MSFT'&&e.effectiveDate==='2026-07-01');assert.equal(future.realizedInStudy,false);
 const meta=c.accounting.filter(e=>e.company==='META');assert.ok(meta.some(e=>e.policy.includes('5.5')));assert.ok(meta.some(e=>e.policy.includes('six')));
 assert.ok(metric('GOOG','depreciationPpe').comparisons.baseline2022.state==='LIMITED_COMPARABILITY');
 assert.equal(metric('GOOG','depreciationPpe').comparisons.yoy.state,'RISING');
});
test('event dates, quarter context and separate latest semantics',()=>{
 assert.ok(c.events.every(e=>e.date>=e.observationPeriod&&e.observationPeriod<='2026-06-30'));
 const ms=c.latest[0];assert.equal(ms.latestEconomicQuarter,'2026Q2');assert.equal(ms.latestDirectAiDisclosure.date,'2026-04-29');assert.equal(ms.latestGuidance.date,'2026-07-29');assert.equal(ms.latestBacklogObservation.date,'2026-07-29');
 assert.ok(ms.latestFinancialFiling.every(s=>s.publicationDate>='2026-06-30'));
});
test('health independent, CURRENT scoped to frozen panel; AI returns unavailable',()=>{
 for(const h of c.health){assert.equal(h.capexEvidence,'CURRENT');assert.equal(h.cashFlowEvidence,'CURRENT');assert.equal(h.aiReturnIdentifiability,'UNAVAILABLE');assert.equal(h.scope,'FROZEN_QUALIFIED_PANEL_NOT_LIVE_FRESHNESS');}
 assert.equal(c.health[0].directAiMonetizationEvidence,'PARTIAL');assert.equal(c.health[1].backlogEvidence,'DEFINITION_BREAK');assert.equal(c.health[3].cloudEvidence,'UNAVAILABLE');
});
test('deterministic bilingual summaries retain exact value and narrow scope',()=>{const summaries=researchSummaries(monitor);for(const s of summaries){assert.ok(s.en.includes('AI-specific capital returns remain unidentifiable'));assert.ok(s.zh.includes('AI 专属资本回报仍不可识别'));}assert.ok(summaries[0].en.includes('37 billion'));assert.ok(summaries[0].zh.includes('37 十亿美元'));});
test('public contract validates and is a compact unadvertised research draft',()=>{
 assert.equal(validatePublic(pub,monitor,data),true);assert.equal(validateContract(pub,'public-snapshot'),true);
 assert.equal(pub.content.publicationStatus,'RESEARCH_ONLY_NOT_PUBLISHED');assert.ok(bytes(pub).length<220000);
 assert.ok(!bytes(pub).includes('/Users/'));assert.equal(pub.content.companies.length,4);
});
for(const [label,mutate]of [
 ['value',p=>p.content.companies[0].metrics[0].value=0],['source',p=>p.content.companies[0].metrics[0].sourceUrl='https://example.com'],
 ['period',p=>p.content.companies[0].metrics[0].period='2026Q3'],['definition',p=>p.content.companies[0].metrics[0].definitionVersion='FAKE'],
 ['run-rate',p=>p.content.events.find(e=>e.eventType==='DIRECT_AI_RUN_RATE').nativeValue/=4],
 ['guidance',p=>p.content.events.find(e=>e.company==='META'&&e.periodType==='GUIDANCE').nativeValue=137500],
 ['backlog',p=>p.content.events.find(e=>e.eventType==='BACKLOG').recognizedRevenue=true],
 ['health',p=>p.content.health[0].aiReturnIdentifiability='CURRENT'],['summary',p=>p.content.summaries[0].en='AI ROI confirmed'],
 ['extra-field',p=>p.content.overallScore=10],['input-hash',p=>p.content.inputSnapshotHash='a'.repeat(64)]
 ])test('independent public mutation rejected: '+label,()=>{const altered=clone(pub);mutate(altered);altered.resultHash=hash(altered.content);assert.throws(()=>validatePublic(altered,monitor,data));});
test('monitor mutation cannot self-authenticate by recomputing hash',()=>{const altered=clone(monitor);altered.content.records[0].value+=1;altered.resultHash=hash(altered.content);assert.throws(()=>validateMonitor(altered,data));});
test('all frozen inputs, including event values, pinned',()=>{
 const altered=clone(data);altered.events.events[0].value=1;assert.throws(()=>evaluate(altered),/FROZEN_ACCEPTED_INPUT_IDENTITY/);
 const future=clone(data);future.input.observations[0].periodEnd='2026-09-30';assert.throws(()=>evaluate(future));
});
test('no hidden aggregate, ranking or return field in generated contracts',()=>{
 const bad=/^(score|rank|roi|roic|irr|npv|payback|estimatedAiRevenue|aggregate|winner|weightedTotal)$/i;
 const walk=v=>{if(v&&typeof v==='object')for(const[k,x]of Object.entries(v)){assert.ok(!bad.test(k),k);walk(x);}};walk(monitor);walk(pub);
});
test('lineage fails on missing and cyclic operands',()=>{
 const r={observationId:'a',value:1,calculation:{operandIds:['b']}};assert.throws(()=>lineage(r,new Map()),/MISSING_OPERAND/);
 assert.throws(()=>lineage(r,new Map([['b',{observationId:'b',value:1,calculation:{operandIds:['a']}}],['a',r]])),/CYCLIC/);
});
test('derived lineage limitations propagate even when record has no own comparability flag',()=>{
 const leaf={observationId:'l',value:1,metric:'revenue',definitionVersion:'d',unit:'USD_MILLIONS',scope:'CONSOLIDATED',comparabilityStatus:'LIMITED_COMPARABILITY'};
 const r={...leaf,observationId:'r',comparabilityStatus:undefined,calculation:{operandIds:['l']}};assert.equal(comparisonBasis(r,new Map([['l',leaf]])).status,'LIMITED_COMPARABILITY');
});
test('exact comparator rejects wrong company, frequency and nonexact date',()=>{
 const r=metric('MSFT','cashPpeNative'),p=metric('MSFT','cashPpeNative','2025Q2');
 for(const patch of[{company:'GOOG'},{frequency:'ANNUAL'},{period:'2025Q1'}])assert.throws(()=>compare(r,{...p,...patch},'2025Q2'),/EXACT_COMPARISON_IDENTITY/);
});
test('negative FCF prior gives absolute change, never spurious percentage growth',()=>{
 const r=metric('AMZN','fcfCompanyConvention');const p={...r,value:-10,period:'2025Q2'};const out=compare(r,p,'2025Q2');assert.equal(out.percentChange,null);assert.equal(out.delta,-7679);
});
test('STABLE means exact equal; tiny movements are not hidden by economic thresholds',()=>{
 const r=metric('MSFT','revenue'),p={...r,period:'2025Q2'};assert.equal(compare(r,p,'2025Q2').state,'STABLE');assert.equal(compare({...r,value:r.value+0.000001},p,'2025Q2').state,'RISING');
});
test('schema rejects wrong types, extras, hash syntax and null-to-zero recognized AI mutation',()=>{
 assert.throws(()=>validateShape({x:'one'},{type:'object',required:['x'],properties:{x:{type:'number'}}}));
 const p=clone(pub);p.extra=1;assert.throws(()=>validateContract(p,'public-snapshot'));delete p.extra;p.resultHash='bad';assert.throws(()=>validateContract(p,'public-snapshot'));
 const fake=clone(pub);fake.content.companies[0].metrics.find(r=>r.metric==='aiRevenueRecognized').value=0;assert.throws(()=>validatePublic(fake,monitor,data));
});
test('repeat rebuild deterministic; timestamps stay out of economic payload',()=>{
 assert.equal(bytes(evaluate(load())),bytes(monitor));assert.equal(bytes(publicArtifact(evaluate(load()))),bytes(pub));assert.ok(!bytes(monitor).includes('evaluatedAt'));
});
test('three fresh processes produce identical content bytes and hashes',()=>{
 const script="import{produce}from'./research/ai-capex-monetization/monitor/scripts/run.mjs';import{bytes}from'./research/ai-capex-monetization/scripts/contract.mjs';process.stdout.write(bytes(produce().monitor));";
 const outputs=Array.from({length:3},()=>spawnSync(process.execPath,['--input-type=module','-e',script],{maxBuffer:8e6}));
 for(const o of outputs){assert.equal(o.status,0,o.stderr.toString());assert.equal(o.stdout.toString(),bytes(monitor));}
});
test('atomic outputs, no-new-disclosure run and last-valid failure isolation',()=>{
 const out=fs.mkdtempSync(path.join(os.tmpdir(),'wil-capex-monitor-'));
 try{const a=run({out});const before=fs.readFileSync(path.join(out,'current.json'),'utf8');assert.equal(a.state,'CURRENT');assert.equal(run({out}).state,'NO_NEW_DISCLOSURE');
 assert.throws(()=>run({out,injectFailure:true}),/TEST_ONLY/);assert.equal(fs.readFileSync(path.join(out,'current.json'),'utf8'),before);
 const status=JSON.parse(fs.readFileSync(path.join(out,'run-status.json')));assert.equal(status.state,'FAILED_WITH_LAST_VALID');assert.equal(status.lastValid.resultHash,monitor.resultHash);
 }finally{fs.rmSync(out,{recursive:true,force:true});}
});
test('no last valid on first failure; corrupt prior is not relabeled last-valid',()=>{
 const out=fs.mkdtempSync(path.join(os.tmpdir(),'wil-capex-monitor-'));
 try{assert.throws(()=>run({out,injectFailure:true}));assert.equal(JSON.parse(fs.readFileSync(path.join(out,'run-status.json'))).state,'UNAVAILABLE');
 const a=run({out});fs.writeFileSync(path.join(out,a.generationId,'monitor.json'),'{}');assert.throws(()=>run({out}),/CORRUPTION/);assert.equal(JSON.parse(fs.readFileSync(path.join(out,'run-status.json'))).lastValid,null);
 }finally{fs.rmSync(out,{recursive:true,force:true});}
});
test('chart contract contains nine separate descriptive views, no Meta cloud padding',()=>{assert.equal(c.chartContract.length,9);assert.ok(c.chartContract.every(r=>r.missing.includes('never zero')));});

test('three reading windows preserve native gaps and policy context; no treatment assignment',()=>{
 for(const id of ['FULL_HISTORY','PRE_GENAI_CONTEXT','INFRASTRUCTURE_CONTEXT']){const v=windowView(monitor,id);assert.ok(v.records.every(r=>r.period>=v.window.start&&r.period<=v.window.end));assert.equal(v.accountingContext.length,7);}
 assert.throws(()=>windowView(monitor,'POST_AI_CAUSED'),/UNKNOWN_TIME_WINDOW/);
});
test('summary has five separate bilingual layers with comparison limitations',()=>{
 for(const s of researchSummaries(monitor)){assert.equal(Object.keys(s.layers).length,5);assert.ok(Object.values(s.layers).every(l=>l.en&&l.zh));}
 assert.ok(researchSummaries(monitor)[0].layers.monetization.en.includes('LIMITED_COMPARABILITY'));
});

for(const [expected,input]of [
 ['CURRENT',{available:1}],['PARTIAL',{available:1,expected:2}],['NO_NEW_DISCLOSURE',{available:1,noNewDisclosure:true}],
 ['DEFINITION_BREAK',{available:1,definitionBreak:true}],['LIMITED_COMPARABILITY',{available:1,limited:true}],
 ['FAILED_WITH_LAST_VALID',{error:true,qualifiedLastValid:true}],['ACCESS_BLOCKED',{error:true,blocked:true}],['UNAVAILABLE',{available:0}]
])test('independent evidence-health support: '+expected,()=>assert.equal(evidenceHealth(input),expected));
test('health rejects invalid coverage and does not label unqualified prior evidence last-valid',()=>{
 assert.throws(()=>evidenceHealth({available:2,expected:1}));assert.equal(evidenceHealth({error:true,qualifiedLastValid:false}),'UNAVAILABLE');
});

test('committed compact numerical report and manifest reproduce exactly',()=>{
 const r=produce();assert.equal(fs.readFileSync(path.join(root,'reports/current-summary.json'),'utf8'),bytes(compactSummary(r)));
 assert.equal(fs.readFileSync(path.join(root,'reports/monitor-manifest.json'),'utf8'),bytes(r.identity));
});
