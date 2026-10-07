import fs from 'node:fs';
import {evidenceHealth} from './health.mjs';
import {validateContract} from './schema.mjs';
import {fileURLToPath} from 'node:url';
import {hash,bytes,companies,date} from '../../scripts/contract.mjs';
import {build,quarters} from '../../quarterly/scripts/panel.mjs';
import {validateEvents} from '../../quarterly/scripts/events.mjs';
import {lineage,comparisonBasis,compare,ratio,quarterOffset} from './metrics.mjs';

export const baseCommit='ad6ebf96e2bf59145f31120dd02cdcc3fbca24b7';
export const ruleVersion='ai-capex-descriptive-monitor-v0.1';
export const frozenPanelHash='4fa9e344811871c397d81ae74832d1c35d687c7ec194e35154a4891f46b2b304';
export const rules=JSON.parse(fs.readFileSync(new URL('../config/rules.json',import.meta.url),'utf8'));
const names={MSFT:'Microsoft',GOOG:'Alphabet',AMZN:'Amazon',META:'Meta'};
const nativeCash={MSFT:'Gross cash PP&E',GOOG:'Cash PP&E',AMZN:'Net cash PP&E (gross less proceeds/incentives)',META:'Selected native cash PP&E; gross/net basis retained per quarter'};
const warning={MSFT:['UNRECONCILED_NATIVE_CAPEX_SCOPE','Intelligent Cloud is not Azure or AI-only; historical segment recasts limit growth comparisons.'],GOOG:['Historical pure depreciation incomplete (quarterly coverage begins 2022Q4).','ALPHABET_RPO_SHORT_TERM_INCLUDED_V2: definition break from 2026Q1.','Google Cloud historical recasts limit growth comparisons.'],AMZN:['Gross/net PP&E, finance leases and operating leases remain separate.','Native cost of sales is not a harmonized cross-company gross-margin definition.'],META:['RESTATEMENT_REVIEW_REQUIRED: 5.5-year release / six-year annual useful-life wording conflict.','AI monetization embedded in advertising/recommendations; no separate recognized AI revenue.','Native cash PP&E/FCF gross-net basis changes remain visible.']};
export const guardrail={en:'Consolidated and segment accounting observations, management attribution and forward guidance remain separate. No attributable AI capital return or investment ranking can be inferred.',zh:'公司整体及分部会计观察、管理层归因和前瞻指引分别列示。不能据此推断可归因的 AI 资本回报或投资排名。'};
function latestEvent(events,company,kinds){return events.filter(e=>e.company===company&&kinds.includes(e.kind)).sort((a,b)=>b.date.localeCompare(a.date)||a.eventId.localeCompare(b.eventId))[0]??null;}
function projectedEvents(data) {
 validateEvents(data.events,data.input.sources);
 const sourceById=new Map(data.input.sources.map(s=>[s.sourceId,s]));
 return data.events.events.map(e=>{
  if(!quarters().some(q=>q.calendarQuarter===e.quarter)||e.observationPeriod>'2026-06-30')throw Error('EVENT_OUTSIDE_FROZEN_WINDOW');
  const source=sourceById.get(e.source.sourceId);
  const legacy=e.sourceQualificationLevel!==e.evidenceLevel;
  return {...e,sourceQualificationLevel:e.evidenceLevel,sourceUpdatedAt:e.date,retrievedAt:source?.retrievedAt??null,
   qualificationClarification:legacy?'Pinned raw hash, URL and publication date prove current qualification; inherited Phase 1 qualifier retained only in original evidence ledger.':null,
   legacyQualification:legacy?{value:e.sourceQualificationLevel,inputEventId:e.eventId}:null,
   limitations:e.limitations.filter(s=>!legacy||!s.startsWith('Inherited Phase 1 manual review;')),
   sourceHash:e.source.sha256,sourceId:e.source.sourceId,sourceUrl:e.source.url,
   nativeValue:e.value,reportingQuarter:e.quarter,publicationDate:e.date};
 }).sort((a,b)=>a.date.localeCompare(b.date)||a.eventId.localeCompare(b.eventId));
}
function normalize(row,metric,byId,sources,policies){
 if(!row||row.value===null)return null;
 const leaves=lineage(row,byId), ids=[...new Set(leaves.map(r=>r.sourceId))].sort();
 const provenance=ids.map(id=>{const s=sources.get(id);if(!s)throw Error('SOURCE_IDENTITY');return {sourceId:id,sourceUrl:s.url,publisher:s.publisher,sha256:s.sha256,publicationDate:s.publicationDate,retrievedAt:s.retrievedAt};});
 const isDep=rules.metrics.find(m=>m.id===metric)?.family==='accounting';
 const affected=isDep?policies.filter(p=>p.company===row.company&&p.effectiveDate<=row.periodEnd):[];
 return {company:row.company,metric,value:row.value,unit:row.unit,period:row.calendarQuarter,
  periodStart:row.periodStart,periodEnd:row.periodEnd,fiscalQuarter:row.fiscalQuarter,frequency:'QUARTERLY',
  nativeMetric:row.metric,nativeLabel:row.nativeLabel??(metric==='cashPpeNative'?nativeCash[row.company]:row.metric),
  scope:row.scope,definitionVersion:row.definitionVersion,precision:row.precision,evidenceClass:row.evidenceClass,
  observationId:row.observationId,basis:comparisonBasis(row,byId),policyAffected:affected.some(p=>p.reviewStatus==='RESTATEMENT_REVIEW_REQUIRED'),
  policyReferences:affected.map(p=>({effectiveDate:p.effectiveDate,sourceId:p.source.sourceId,policy:p.policy})),
  sourceId:row.sourceId,sourceUrl:sources.get(row.sourceId).url,provenance,
  calculation:row.calculation??null,limitations:[...(row.limitations??[]),...warning[row.company]]};
}
export function evaluate(data,{pin=true}={}) {
 if(pin&&hash(data)!==rules.frozenAcceptedInputHash)throw Error('FROZEN_ACCEPTED_INPUT_IDENTITY');
 const panel=build(data.input,data.manifest,data.definitions);
 if(pin&&panel.resultHash!==frozenPanelHash)throw Error('FROZEN_PANEL_IDENTITY');
 if(panel.content.qualification.some(q=>q.status!=='CORE_PANEL_QUALIFIED')||panel.content.qualification.length!==4)throw Error('CORE_NOT_QUALIFIED');
 const byId=new Map([...data.input.observations,...panel.content.rows.filter(r=>r.observationId)].map(r=>[r.observationId,r]));
 const sources=new Map(data.input.sources.map(s=>[s.sourceId,s]));
 const records=[],missing=[],policies=data.input.policies.policies;
 for(const company of companies)for(const q of quarters()){
  const rows=panel.content.rows.filter(r=>r.company===company&&r.calendarQuarter===q.calendarQuarter);
  const get=metric=>rows.find(r=>r.metric===metric&&r.value!==null);
  const cashOperand=get('cashInvestmentIntensity')?.calculation.operandIds[0];
  const selected={cashPpeNative:byId.get(cashOperand),...Object.fromEntries(rules.metrics.filter(m=>m.native).map(m=>[m.id,get(m.native)]))};
  selected.pureDepreciationToRevenue=ratio(get('depreciationPpe'),get('revenue'),'pureDepreciationToRevenue',byId);
  selected.broadDaToRevenue=ratio(get('depreciationAmortizationOther'),get('revenue'),'broadDaToRevenue',byId);
  // Cash PP&E versus PP&E depreciation has a compatible asset family. Lease-inclusive native CapEx does not.
  selected.cashPpeToPureDepreciation=ratio(selected.cashPpeNative,get('depreciationPpe'),'cashPpeToPureDepreciation',byId,{multiple:true,pure:true});
  for(const spec of rules.metrics){
   const row=selected[spec.id];
   if(!row){missing.push({company,metric:spec.id,period:q.calendarQuarter,value:null,state:'UNAVAILABLE',reason:spec.family==='monetization'?'RECOGNIZED_AI_REVENUE_NOT_DISCLOSED':company==='META'&&spec.family==='cloud'?'NO_META_CLOUD_SEGMENT':'NO_COMPATIBLE_DISCLOSURE_OR_OPERANDS'});continue;}
   const record=normalize({...row,...q,fiscalQuarter:get('revenue').fiscalQuarter},spec.id,byId,sources,policies);
   records.push(record);
  }
 }
 const indexed=new Map(records.map(r=>[[r.company,r.metric,r.period].join('|'),r]));
 for(const r of records){r.comparisons={};for(const [label,period]of Object.entries({priorQuarter:quarterOffset(r.period,-1),yoy:quarterOffset(r.period,-4),baseline2019:'2019Q1',baseline2022:'2022Q4'})){
  r.comparisons[label]=period>=r.period?{state:'UNAVAILABLE',reason:'REFERENCE_NOT_EARLIER',priorPeriod:period,priorValue:null,currentValue:r.value,delta:null,percentChange:null,deltaUnit:null}:compare(r,indexed.get([r.company,r.metric,period].join('|')),period);
 }}
 const events=projectedEvents(data);
 const accounting=policies.map(p=>{
  const s=sources.get(p.source.sourceId);date(p.effectiveDate);if(!s||s.sha256!==p.source.sha256)throw Error('POLICY_PINNED_SOURCE');
  return {eventId:'policy:'+hash(p),company:p.company,eventDate:s.publicationDate,reportingQuarter:quarters().find(q=>q.periodEnd===s.periodEnd)?.calendarQuarter??null,
   eventType:'USEFUL_LIFE_OR_DEFINITION_POLICY',evidenceClass:'ACCOUNTING_POLICY',evidenceLevel:null,nativeValue:null,unit:null,precision:null,
   sourceId:s.sourceId,sourceUrl:s.url,sourceHash:s.sha256,effectiveDate:p.effectiveDate,
   realizedInStudy:p.effectiveDate<='2026-06-30',policy:p.policy,limitations:[p.impact],reviewStatus:p.reviewStatus??null};
 }).sort((a,b)=>a.eventDate.localeCompare(b.eventDate)||a.eventId.localeCompare(b.eventId));
 const latest=companies.map(company=>{
  const metrics=Object.fromEntries(rules.metrics.map(m=>[m.id,indexed.get([company,m.id,'2026Q2'].join('|'))??missing.find(r=>r.company===company&&r.metric===m.id&&r.period==='2026Q2')]));
  const filingIds=metrics.revenue.provenance;
  return {company,name:names[company],latestEconomicQuarter:'2026Q2',latestFinancialFiling:filingIds,
   latestMonetizationDisclosure:latestEvent(events,company,['DIRECT_AI_RUN_RATE','PAID_AI_SEATS','CLOUD_AI_ATTRIBUTION','BUSINESS_AI_ATTRIBUTION']),
   latestDirectAiDisclosure:latestEvent(events,company,['DIRECT_AI_RUN_RATE']),latestGuidance:latestEvent(events,company,['CAPEX_GUIDANCE']),
   latestBacklogObservation:latestEvent(events,company,['BACKLOG']),latestCapacity:latestEvent(events,company,['CAPACITY_CONSTRAINT']),
   metrics,accountingLimitations:warning[company]};
 });
 const health=latest.map(c=>({company:c.company,scope:'FROZEN_QUALIFIED_PANEL_NOT_LIVE_FRESHNESS',
  capexEvidence:evidenceHealth({available:30,expected:30}),cashFlowEvidence:evidenceHealth({available:30,expected:30}),cloudEvidence:evidenceHealth({available:c.company==='META'?0:1,limited:['MSFT','GOOG'].includes(c.company)}),
  directAiMonetizationEvidence:evidenceHealth({available:c.latestDirectAiDisclosure?1:0,expected:30}),
  depreciationEvidence:c.company==='GOOG'?'PARTIAL':'LIMITED_COMPARABILITY',
  backlogEvidence:c.latestBacklogObservation?(c.company==='GOOG'?'DEFINITION_BREAK':'PARTIAL'):'UNAVAILABLE',
  aiReturnIdentifiability:'UNAVAILABLE',limitations:warning[c.company]}));
 const content={schemaVersion:'ai-capex-monitor-v0.1',ruleVersion,baseCommit,
  configHash:hash(rules),inputHash:hash(data),panelHash:panel.resultHash,sourceManifestHash:panel.content.sourceManifestHash,
  dataThrough:'2026Q2',disclosureThrough:events.at(-1).date,asOfMode:'FROZEN_CURRENT_VINTAGE_RECONSTRUCTION',
  timeWindows:rules.timeWindows,metricCatalog:rules.metrics,records,missing,latest,events,accounting,health,
  chartContract:rules.charts,comparability:rules.comparability,guardrail};
 const artifact={content,resultHash:hash(content)};validateContract(artifact,'monitor');return artifact;
}
export function validateMonitor(artifact,data){
 const expected=evaluate(data);if(bytes(artifact)!==bytes(expected))throw Error('MONITOR_SEMANTIC_IDENTITY');return true;
}
export function windowView(monitor,id){
 const window=rules.timeWindows.find(w=>w.id===id);if(!window)throw Error('UNKNOWN_TIME_WINDOW');
 const inside=r=>r.period>=window.start&&r.period<=window.end;
 return {window,records:monitor.content.records.filter(inside),missing:monitor.content.missing.filter(inside),
  events:monitor.content.events.filter(e=>e.reportingQuarter>=window.start&&e.reportingQuarter<=window.end),
  accountingContext:monitor.content.accounting,guardrail};
}
export function researchSummaries(monitor){
 return monitor.content.latest.map(c=>{
  const m=c.metrics,f=v=>v===null?'unavailable':v.toFixed(2);
  const change=(r,lang)=>{
   const yoy=r.comparisons?.yoy;
   if(!yoy||yoy.delta===null)return lang==='en'?`YoY ${yoy?.state??'UNAVAILABLE'}`:`同比 ${yoy?.state??'UNAVAILABLE'}`;
   return `${lang==='en'?'YoY':'同比'} ${yoy.delta>=0?'+':''}${f(yoy.delta)} ${yoy.deltaUnit==='PERCENTAGE_POINTS'?(lang==='en'?'pp':'个百分点'):yoy.deltaUnit}`;
  };
  const direct=c.latestDirectAiDisclosure;
  const evidence=direct?`${direct.nativeValue/1000} billion USD (lower-bound annualized run-rate; ${direct.reportingQuarter})`:'unavailable';
  const layer={
   investment:{en:`Native cash PP&E / revenue ${f(m.cashInvestmentIntensity.value)}%; ${change(m.cashInvestmentIntensity,'en')}.`,zh:`原生现金 PP&E／收入 ${f(m.cashInvestmentIntensity.value)}%；${change(m.cashInvestmentIntensity,'zh')}。`},
   cash:{en:`Company-convention FCF margin ${f(m.fcfMargin.value)}%; ${change(m.fcfMargin,'en')}.`,zh:`公司口径 FCF 利润率 ${f(m.fcfMargin.value)}%；${change(m.fcfMargin,'zh')}。`},
   operating:{en:`Operating margin ${f(m.operatingMargin.value)}%; ${change(m.operatingMargin,'en')}.`,zh:`营业利润率 ${f(m.operatingMargin.value)}%；${change(m.operatingMargin,'zh')}。`},
   accounting:{en:`Pure PP&E depreciation / revenue ${f(m.pureDepreciationToRevenue.value)}${m.pureDepreciationToRevenue.value===null?'':'%'}; ${change(m.pureDepreciationToRevenue,'en')}. Broad D&A is separate.`,zh:`纯 PP&E 折旧／收入 ${m.pureDepreciationToRevenue.value===null?'缺失':f(m.pureDepreciationToRevenue.value)+'%'}；${change(m.pureDepreciationToRevenue,'zh')}。较广口径折旧摊销单独列示。`},
   monetization:{en:`Direct AI financial disclosure: ${evidence}. Native cloud margin ${f(m.segmentOperatingMargin.value)}${m.segmentOperatingMargin.value===null?'':'%'}; ${change(m.segmentOperatingMargin,'en')}. Cloud is not AI revenue.`,zh:`直接 AI 财务披露：${direct?`超过 ${direct.nativeValue/1000} 十亿美元的年化 run-rate（${direct.reportingQuarter}）`:'缺失'}。原生云分部利润率 ${m.segmentOperatingMargin.value===null?'缺失':f(m.segmentOperatingMargin.value)+'%'}；${change(m.segmentOperatingMargin,'zh')}。云收入不等于 AI 收入。`}
  };
  return {company:c.company,period:c.latestEconomicQuarter,layers:layer,
   en:`${c.name} (${c.latestEconomicQuarter}). ${Object.values(layer).map(l=>l.en).join(' ')} AI-specific capital returns remain unidentifiable.`,
   zh:`${c.name}（${c.latestEconomicQuarter}）。${Object.values(layer).map(l=>l.zh).join('')}AI 专属资本回报仍不可识别。`,
   limitations:c.accountingLimitations};
 });
}
export const implementationFiles=['metrics.mjs','monitor.mjs','public.mjs','run.mjs','schema.mjs','health.mjs'];
export function implementationHash(){return hash(implementationFiles.map(f=>[f,fs.readFileSync(new URL(f,import.meta.url),'utf8')]));}
