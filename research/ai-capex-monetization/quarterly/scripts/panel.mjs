import {bytes,hash,date,fiscalQuarter,companies} from '../../scripts/contract.mjs';
import {validateSource,officialURL} from './retrieve.mjs';
export const version='ai-capex-quarterly-panel-v0.1';
export const metricFamilies={
 financials:['revenue','costRevenue','grossProfit','operatingIncome','netIncome'],
 cashFlow:['cfo','fcfReported','fcfCompanyConvention','cashInvestmentBridge','financeLeasePrincipal','operatingLeaseCash'],
 capex:['cashPpeGross','cashPpeNet','ppeProceedsIncentives','nativeCapex','financeLeaseAdditions','ppeAdditions','constructionCommitments'],
 depreciation:['depreciationPpe','ppeDepreciationAmortization','depreciationAmortizationOther'],
 cloud:['segmentRevenue','segmentOperatingIncome','microsoftCloudRevenue','azureGrowth'],
 backlog:['rpo'],monetization:['aiRevenueRecognized'],guidance:['capexGuidance']
};
const allowed=new Set(Object.values(metricFamilies).flat());
const fail=m=>{throw Error(m)};
export function quarters(){const result=[];for(let y=2019;y<=2026;y++)for(let q=1;q<=4;q++){if(y===2026&&q>2)continue;const end=new Date(Date.UTC(y,q*3,0)).toISOString().slice(0,10);result.push({calendarQuarter:`${y}Q${q}`,periodStart:`${y}-${String(q*3-2).padStart(2,'0')}-01`,periodEnd:end});}return result;}
export function validateInputs(input,definitions){
 if(input.schemaVersion!=='ai-capex-quarterly-input-v0.1'||!Array.isArray(input.sources)||!Array.isArray(input.observations))fail('INPUT_SCHEMA');
 for(const p of input.policies?.policies||[]){if(!companies.includes(p.company)||!p.policy||!p.impact||!p.source?.sourceId||!p.source.locator)fail('POLICY_PROVENANCE');date(p.effectiveDate);officialURL(p.company,p.source.url);}
 const sources=new Map(),defs=new Map();
 for(const d of definitions){if(defs.has(d.definitionVersion)||!d.scopes?.length||!d.metrics?.length||!companies.includes(d.company)||!d.changeReason)fail('DEFINITION_REGISTRY');date(d.effectiveFrom);if(d.effectiveTo)date(d.effectiveTo);defs.set(d.definitionVersion,d);}
 for(const s of input.sources){validateSource(s);if(sources.has(s.sourceId))fail('DUPLICATE_SOURCE');sources.set(s.sourceId,s);}
 const ids=new Set(),contexts=new Set();
 for(const o of input.observations){
  const s=sources.get(o.sourceId),d=defs.get(o.definitionVersion);
  if(!s||s.company!==o.company||!o.observationId||ids.has(o.observationId))fail('OBSERVATION_ID');ids.add(o.observationId);
  if(!allowed.has(o.metric)||!d||d.company!==o.company||!d.metrics.includes(o.metric)||!d.scopes.includes(o.scope))fail('DEFINITION_IDENTITY');
  date(o.periodStart);date(o.periodEnd);if(o.periodEnd>s.publicationDate)fail('FUTURE_OBSERVATION');
  const q=quarters().find(q=>q.periodEnd===o.periodEnd);
  if(o.periodType==='Q'&&(!q||q.periodStart!==o.periodStart))fail('QUARTER_DURATION');
  if(!['Q','YTD','FY','POINT'].includes(o.periodType)||o.periodStart>o.periodEnd)fail('PERIOD_TYPE');
  if(['YTD','FY'].includes(o.periodType)){
   const expectedStart=o.company==='MSFT'?`${Number(o.periodEnd.slice(0,4))-(o.periodEnd.slice(5,7)<='06'?1:0)}-07-01`:`${o.periodEnd.slice(0,4)}-01-01`;
   if(!q||o.periodStart!==expectedStart||o.periodType==='FY'&&o.periodEnd.slice(5)!==(o.company==='MSFT'?'06-30':'12-31'))fail('FISCAL_DURATION');
  }
  if(o.periodType==='POINT'&&o.periodStart!==o.periodEnd)fail('POINT_DURATION');
  if(o.metric==='rpo'&&o.periodType!=='POINT'||o.metric!=='rpo'&&o.periodType==='POINT')fail('STOCK_DURATION');
  if(o.unit!==d.unit||o.unit!==(o.metric==='azureGrowth'?'PERCENT':'USD_MILLIONS')||!Number.isFinite(o.value)||!o.locator||!o.nativeLabel||!o.restatementBasis)fail('SEMANTIC_PROVENANCE');
  if(!['EXACT','ROUNDED'].includes(o.precision)||!['OBSERVED','CALCULATED_FROM_DISCLOSED_VALUES'].includes(o.evidenceClass))fail('EVIDENCE_CLASS');
  if(o.evidenceClass==='CALCULATED_FROM_DISCLOSED_VALUES'&&!o.calculation?.operandIds?.length)fail('OPERAND_PROVENANCE');
  if(o.periodEnd<d.effectiveFrom||d.effectiveTo&&o.periodEnd>d.effectiveTo)fail('DEFINITION_EFFECTIVE_PERIOD');
  if(!['COMPARABLE','LIMITED_COMPARABILITY','NOT_COMPARABLE'].includes(o.comparabilityStatus)||!['ORIGINAL_RELEASE_VINTAGE','COMPARATIVE_VINTAGE','RESTATED','CURRENT_HISTORICAL_WORKBOOK_VINTAGE'].includes(o.revisionStatus))fail('COMPARABILITY');
  const key=[o.company,o.metric,o.scope,o.periodStart,o.periodEnd,o.periodType,o.sourceId].join('|');if(contexts.has(key))fail('DUPLICATE_CONTEXT');contexts.add(key);
 }
 return true;
}
export function subtractDuration(long,short,proof){
 if(!proof?.reviewed||!proof.reason||!proof.sourceIds?.includes(long.sourceId)||!proof.sourceIds?.includes(short.sourceId)||proof.restatementBasis!==long.restatementBasis||long.restatementBasis!==short.restatementBasis)fail('INCOMPATIBLE_VINTAGE');
 for(const key of ['company','metric','scope','definitionVersion','unit','periodStart','precision'])if(long[key]!==short[key])fail('INCOMPATIBLE_DURATION');
 date(long.periodEnd);date(short.periodEnd);date(long.periodStart);
 if(!['FY','YTD'].includes(long.periodType)||!['YTD','Q'].includes(short.periodType)||long.periodEnd<=short.periodEnd||!Number.isFinite(long.value)||!Number.isFinite(short.value)||long.precision!=='EXACT')fail('INCOMPATIBLE_DURATION');
 const start=new Date(`${short.periodEnd}T00:00:00Z`);start.setUTCDate(start.getUTCDate()+1);const q=quarters().find(q=>q.periodEnd===long.periodEnd);if(!q||q.periodStart!==start.toISOString().slice(0,10))fail('INCOMPATIBLE_BOUNDARY');
 const fyStart=long.company==='MSFT'?`${Number(long.periodEnd.slice(0,4))-(long.periodEnd.slice(5,7)<='06'?1:0)}-07-01`:`${long.periodEnd.slice(0,4)}-01-01`;
 if(long.periodStart!==fyStart||long.periodType==='FY'&&long.periodEnd.slice(5)!==(long.company==='MSFT'?'06-30':'12-31'))fail('FISCAL_DURATION');
 return {...long,observationId:`subtract:${long.observationId}:${short.observationId}`,periodStart:q.periodStart,periodType:'Q',value:long.value-short.value,evidenceClass:'CALCULATED_FROM_DISCLOSED_VALUES',calculation:{formula:'longDuration - shortDuration',operandIds:[long.observationId,short.observationId],sourceIds:[long.sourceId,short.sourceId],restatementCompatibility:proof}};
}
export function validateManifest(input,manifest){
 if(manifest.schemaVersion!==version||!manifest.reviewed||manifest.policy!=='LATEST_ACCEPTED_OFFICIAL_VINTAGE_WITH_SCOPE_REVIEW')fail('SELECTION_POLICY');
 if(manifest.review?.sourceSetHash&&manifest.review.sourceSetHash!==hash(input.sources.map(s=>[s.sourceId,s.sha256]).sort((a,b)=>a[0].localeCompare(b[0]))))fail('SELECTION_SOURCE_SET_IDENTITY');
 const byId=new Map(input.observations.map(o=>[o.observationId,o]));const seen=new Set();const periods=new Set(quarters().map(q=>q.periodEnd));
 for(const entry of manifest.selections){
  if(!companies.includes(entry.company)||!allowed.has(entry.metric)||!periods.has(entry.periodEnd))fail('SELECTION_DOMAIN');
  const key=[entry.company,entry.metric,entry.periodEnd].join('|');if(seen.has(key))fail('DUPLICATE_SELECTION');seen.add(key);
  if(entry.observationId===null){if(!entry.reason||entry.definitionVersion!==null||entry.scope!==null)fail('MISSING_SELECTION');continue;}
  const o=byId.get(entry.observationId);if(!o||entry.company!==o.company||entry.metric!==o.metric||entry.scope!==o.scope||entry.periodEnd!==o.periodEnd||!['Q','POINT'].includes(o.periodType)||entry.definitionVersion!==o.definitionVersion)fail('SELECTION_IDENTITY');if(!entry.reviewReason)fail('UNREVIEWED_SELECTION');
 }
 if(seen.size!==companies.length*quarters().length*allowed.size)fail('INCOMPLETE_SELECTION_MATRIX');return true;
}
function sourcePriority(metric,s){if(metric==='nativeCapex'&&s.documentType==='OFFICIAL_FINANCIAL_WORKBOOK')return 0;return ({SEC_10Q:0,SEC_10K:0,OFFICIAL_EARNINGS_RELEASE:1,OFFICIAL_FINANCIAL_WORKBOOK:2,OFFICIAL_EARNINGS_CALL_TRANSCRIPT:3})[s.documentType]??10;}
export function proposeManifest(input){
 const selections=[];const sources=new Map(input.sources.map(s=>[s.sourceId,s]));
 for(const c of companies)for(const q of quarters())for(const metric of [...allowed].sort()){
  const candidates=input.observations.filter(o=>o.company===c&&o.periodEnd===q.periodEnd&&o.metric===metric&&['Q','POINT'].includes(o.periodType)).sort((a,b)=>sources.get(b.sourceId).publicationDate.localeCompare(sources.get(a.sourceId).publicationDate)||sourcePriority(metric,sources.get(a.sourceId))-sourcePriority(metric,sources.get(b.sourceId))||a.observationId.localeCompare(b.observationId));
  const s=candidates[0];selections.push({company:c,metric,periodEnd:q.periodEnd,observationId:s?.observationId||null,definitionVersion:s?.definitionVersion||null,scope:s?.scope||null,...(s?{reviewReason:'Reviewed native quarter columns, statement scope and definition; all original/comparative candidates retained.'}:{reason:'UNAVAILABLE: no qualified native disclosure or compatible reconstruction.'})});
 }
 return {schemaVersion:version,reviewed:false,policy:'LATEST_ACCEPTED_OFFICIAL_VINTAGE_WITH_SCOPE_REVIEW',selections};
}
function derived(metric,values,value,formula,definitionVersion,unit='USD_MILLIONS'){
 const first=values[0];const record={company:first.company,metric,periodEnd:first.periodEnd,periodStart:first.periodStart,value,unit,definitionVersion,sourceId:first.sourceId,restatementBasis:first.restatementBasis,scope:first.scope,precision:values.every(v=>v.precision==='EXACT')?'EXACT':'ROUNDED',evidenceClass:'CALCULATED_FROM_DISCLOSED_VALUES',calculation:{operandIds:values.map(v=>v.observationId),sourceIds:[...new Set(values.map(v=>v.sourceId))],formula},limitations:['Company or native segment arithmetic; not AI-specific return.']};
 if(first.company==='AMZN'&&['grossProfit','grossMargin'].includes(metric))record.limitations.push('Native cost of sales excludes separately classified fulfillment and other operating expenses; not a harmonized cross-company gross-margin definition.');
 return {...record,observationId:'derived:'+hash(record)};
}
export function deriveCash(company,rows){
 const result=[];const get=m=>[...rows,...result].find(r=>r.metric===m&&r.value!==null);
 const calc=(metric,operands,fn,formula,definition=company+'_'+metric+'_CALC_V1',scope='CONSOLIDATED',allowRounded=false)=>{
  const values=operands.map(get);if(values.some(v=>!v))return;
  if(values.some(v=>v.company!==company||v.periodStart!==values[0].periodStart||v.periodEnd!==values[0].periodEnd||v.scope!==scope||v.unit!=='USD_MILLIONS'||!allowRounded&&v.precision!=='EXACT'))return;
  if(new Set(values.map(v=>v.restatementBasis)).size!==1)return;
  const value=fn(...values.map(v=>v.value));if(!Number.isFinite(value))return;
  result.push(derived(metric,values,value,formula,definition,metric.endsWith('Margin')||metric.endsWith('Intensity')?'PERCENT':'USD_MILLIONS'));
 };
 if(company==='AMZN')calc('cashPpeNet',['cashPpeGross','ppeProceedsIncentives'],(a,b)=>a-b,'gross cash PP&E - proceeds/incentives','AMAZON_NET_CASH_PPE_V1');
 const metaNet=get('cashPpeNet'),cfo=get('cfo');
 const nativeCash=company==='AMZN'||company==='META'&&metaNet&&metaNet.restatementBasis===cfo?.restatementBasis?'cashPpeNet':get('cashPpeGross')?'cashPpeGross':'cashPpeNet';
 const operands=['cfo',nativeCash,...(company==='META'?['financeLeasePrincipal']:[])];
 calc('fcfCompanyConvention',operands,(a,b,c=0)=>a-b-c,company==='META'?'CFO - native cash PP&E - finance lease principal':'CFO - native cash PP&E',company==='META'?(nativeCash==='cashPpeNet'?'META_FCF_NET_CASH_V1':'META_FCF_GROSS_CASH_V2'):company+'_FCF_CONVENTION_V1');
 calc('cashInvestmentBridge',['cfo',nativeCash],(a,b)=>a-b,'CFO - native cash PP&E (lease principal excluded)');
 calc('grossProfit',['revenue','costRevenue'],(a,b)=>a-b,'revenue - native cost of revenue');
 calc('operatingMargin',['operatingIncome','revenue'],(a,b)=>b>0?100*a/b:NaN,'100 * operating income / revenue');
 calc('grossMargin',['revenue','costRevenue'],(a,b)=>a>0?100*(a-b)/a:NaN,'100 * (revenue - native cost of revenue) / revenue');
 calc('cashInvestmentIntensity',[nativeCash,'revenue'],(a,b)=>b>0?100*a/b:NaN,'100 * native cash PP&E / revenue');
 calc('cashInvestmentToCfoIntensity',[nativeCash,'cfo'],(a,b)=>b>0?100*a/b:NaN,'100 * native cash PP&E / CFO');
 calc('fcfMargin',['fcfCompanyConvention','revenue'],(a,b)=>b>0?100*a/b:NaN,'100 * company-convention FCF / revenue');
 if(company==='META')calc('nativeCapex',[nativeCash,'financeLeasePrincipal'],(a,b)=>a+b,'native cash PP&E + finance lease principal',nativeCash==='cashPpeNet'?'META_CAPEX_NET_CASH_V1':'META_CAPEX_GROSS_CASH_V2');
 calc('nativeCapexIntensity',['nativeCapex','revenue'],(a,b)=>b>0?100*a/b:NaN,'100 * native company CapEx / revenue');
 const scope={MSFT:'Intelligent Cloud',GOOG:'Google Cloud',AMZN:'AWS'}[company];
 if(scope)calc('segmentOperatingMargin',['segmentOperatingIncome','segmentRevenue'],(a,b)=>b>0?100*a/b:NaN,'100 * native segment operating income / segment revenue',company+'_SEGMENT_MARGIN_CALC_V1',scope);
 // Microsoft native CapEx workbook has a different vintage and rounded USD billions.
 // Do not mix it with release revenue to manufacture a falsely exact ratio.
 return result;
}
export function compatibleGrowth(current,prior){
 if(!current||!prior||current.value===null||prior.value===null||prior.value<=0||current.company!==prior.company||current.metric!==prior.metric||current.scope!==prior.scope||current.unit!==prior.unit||current.definitionVersion!==prior.definitionVersion||current.comparabilityStatus!=='COMPARABLE'||prior.comparabilityStatus!=='COMPARABLE')fail('NOT_COMPARABLE_GROWTH');
 const expected=current.periodEnd.replace(/^\d{4}/,String(Number(current.periodEnd.slice(0,4))-1));if(prior.periodEnd!==expected)fail('EXACT_PRIOR_PERIOD');
 return {value:100*(current.value/prior.value-1),unit:'PERCENT',formula:'100 * (current / exact prior-year quarter - 1)',operandIds:[current.observationId,prior.observationId]};
}
export function build(input,manifest,definitions){
 validateInputs(input,definitions);validateManifest(input,manifest);const byId=new Map(input.observations.map(o=>[o.observationId,o]));let rows=manifest.selections.map(e=>e.observationId?{...byId.get(e.observationId),calendarQuarter:`${e.periodEnd.slice(0,4)}Q${Number(e.periodEnd.slice(5,7))/3}`,fiscalQuarter:fiscalQuarter(e.company,e.periodEnd),frequency:e.metric==='rpo'?'POINT_IN_TIME':'QUARTERLY',availability:'AVAILABLE'}:{...e,value:null,availability:'UNAVAILABLE',evidenceClass:'UNAVAILABLE',calendarQuarter:`${e.periodEnd.slice(0,4)}Q${Number(e.periodEnd.slice(5,7))/3}`,fiscalQuarter:fiscalQuarter(e.company,e.periodEnd)});
 for(const company of companies)for(const q of quarters()){
  for(const d of deriveCash(company,rows.filter(r=>r.company===company&&r.periodEnd===q.periodEnd))){
   const existing=rows.find(r=>r.company===company&&r.periodEnd===q.periodEnd&&r.metric===d.metric);const record={...d,availability:'AVAILABLE',periodType:'Q',frequency:'QUARTERLY',calendarQuarter:q.calendarQuarter,fiscalQuarter:fiscalQuarter(company,q.periodEnd)};
   if(existing?.value===null){delete existing.reason;Object.assign(existing,record);}else if(!existing)rows.push(record);
  }
 }
 for(const r of rows.filter(r=>metricFamilies.depreciation.includes(r.metric)&&r.value!==null)){r.policyEventsInQuarter=(input.policies?.policies||[]).filter(p=>p.company===r.company&&p.effectiveDate>=r.periodStart&&p.effectiveDate<=r.periodEnd).map(p=>({effectiveDate:p.effectiveDate,policy:p.policy,sourceId:p.source.sourceId,evidenceLevel:p.source.sha256?'RAW_HASH_QUALIFIED':'PHASE1_MANUAL_REVIEWED'}));}
 rows=rows.sort((a,b)=>[a.company,a.metric,a.periodEnd].join('|').localeCompare([b.company,b.metric,b.periodEnd].join('|')));
 const completeness=[];for(const company of companies)for(const [family,metrics]of Object.entries(metricFamilies))for(const metric of metrics){const rs=rows.filter(r=>r.company===company&&r.metric===metric);const dvs=[...new Set(rs.filter(r=>r.value!==null).map(r=>r.definitionVersion))].sort();completeness.push({company,family,metric,expectedQuarters:30,availableQuarters:rs.filter(r=>r.value!==null).length,missingQuarters:rs.filter(r=>r.value===null).map(r=>r.calendarQuarter),reconstructedQuarters:rs.filter(r=>r.calculation?.formula==='longDuration - shortDuration').length,derivedQuarters:rs.filter(r=>r.evidenceClass==='CALCULATED_FROM_DISCLOSED_VALUES').length,directQuarters:rs.filter(r=>r.evidenceClass==='OBSERVED').length,comparativeVintageQuarters:rs.filter(r=>r.revisionStatus==='COMPARATIVE_VINTAGE').length,restatedQuarters:rs.filter(r=>r.revisionStatus==='RESTATED').length,definitionVersions:dvs,definitionBreakQuarters:rs.filter((r,i)=>i&&r.value!==null&&rs[i-1].value!==null&&r.definitionVersion!==rs[i-1].definitionVersion).map(r=>r.calendarQuarter),status:rs.every(r=>r.value!==null)?'QUALIFIED':rs.some(r=>r.value!==null)?'PARTIAL':'UNQUALIFIED'});}
 const reconciliation=[];
 for(const company of companies)for(const q of quarters()){
  const rs=rows.filter(r=>r.company===company&&r.periodEnd===q.periodEnd),get=m=>rs.find(r=>r.metric===m&&r.value!==null);
  const nativeCash=get('cashPpeGross')||get('cashPpeNet'),fcf=get('fcfCompanyConvention'),reported=get('fcfReported');
  reconciliation.push({company,calendarQuarter:q.calendarQuarter,capexStatus:company==='MSFT'?'UNRECONCILED_NATIVE_CAPEX_SCOPE':company==='AMZN'&&get('cashPpeNet')?'GROSS_MINUS_PROCEEDS_QUALIFIED':company==='META'&&get('nativeCapex')?'CASH_PLUS_PRINCIPAL_QUALIFIED':nativeCash?'CASH_PPE_ONLY':'UNAVAILABLE',fcfStatus:reported&&fcf?reported.value===fcf.value?'REPORTED_AND_CALCULATED_MATCH':'RECONCILIATION_REVIEW_REQUIRED':fcf?'CALCULATED_COMPANY_CONVENTION':'UNAVAILABLE',operandIds:fcf?.calculation?.operandIds||[],limitations:company==='MSFT'?['Native capital-lease-inclusive CapEx is not cash PP&E plus lease principal; rounded workbook values are not forced to reconcile.']:[]});
 }
 const qualification=companies.map(company=>{const core=['revenue','operatingIncome','cfo','fcfCompanyConvention'].map(metric=>completeness.find(r=>r.company===company&&r.metric===metric));const cash=quarters().filter(q=>rows.some(r=>r.company===company&&r.periodEnd===q.periodEnd&&['cashPpeGross','cashPpeNet'].includes(r.metric)&&r.value!==null)).length;const mismatches=reconciliation.filter(r=>r.company===company&&r.fcfStatus==='RECONCILIATION_REVIEW_REQUIRED');return{company,status:core.every(r=>r.availableQuarters===30)&&cash===30&&!mismatches.length?'CORE_PANEL_QUALIFIED':'PARTIAL',nativeCashPpeQuarters:cash,core,reconciliationMismatchCount:mismatches.length,limitations:['Qualification is for native consolidated arithmetic, not every metric family or AI return.','Native cash PP&E gross/net labels remain distinct; no AI-specific capital denominator.']};});
 const content={schemaVersion:version,inputHash:hash([...input.observations].sort((a,b)=>a.observationId.localeCompare(b.observationId))),sourceManifestHash:hash(input.sources.map(({retrievedAt,status,...s})=>s).sort((a,b)=>a.sourceId.localeCompare(b.sourceId))),policyContextHash:hash(input.policies||{}),selectionHash:hash(manifest),definitionHash:hash(definitions),rows,completeness,reconciliation,qualification,limitations:['CURRENT_ACCEPTED_OFFICIAL_VINTAGES, not a publisher-vintage backtest.','No interpolation, synthetic AI revenue, AI CapEx allocation, or composite score.']};return{content,resultHash:hash(content)};
}
export function validateGenerated(actual,input,manifest,definitions){if(bytes(actual)!==bytes(build(input,manifest,definitions)))fail('GENERATED_PROVENANCE_MISMATCH');return true;}
