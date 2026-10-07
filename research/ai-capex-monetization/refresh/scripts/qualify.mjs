import {date,hash,fiscalQuarter} from '../../scripts/contract.mjs';
import {deriveCash} from '../../quarterly/scripts/panel.mjs';
import {validateSource} from '../../quarterly/scripts/retrieve.mjs';
import {permitted,cacheObject} from './fetch.mjs';
import {optionalFamilies,issuers} from './config.mjs';
const fail=m=>{throw Error(m)};
export function quarter(end){fiscalQuarter('GOOG',end);return {periodStart:`${end.slice(0,4)}-${String(Number(end.slice(5,7))-2).padStart(2,'0')}-01`,periodEnd:end,calendarQuarter:`${end.slice(0,4)}Q${Number(end.slice(5,7))/3}`};}
export function timestamp(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?Z$/.test(value))fail('TIMESTAMP');date(value.slice(0,10));if(!Number.isFinite(Date.parse(value)))fail('TIMESTAMP');return value;}
export function qualifySource(source,cache,asOf){
 date(asOf);permitted(source.company,source.url,source.delegatedBy);validateSource(source);
 if(source.publicationDate>asOf||source.retrievedAt.slice(0,10)>asOf)fail('SOURCE_AFTER_EXPLICIT_CLOCK');
 timestamp(source.retrievedAt);cacheObject(cache,source.sha256,source.byteSize);return true;
}
export function bindDefinitions(observations,accepted,definitions){
 const rows=[],issues=[];
 for(const r of observations){
  const prior=accepted.filter(o=>o.company===r.company&&o.metric===r.metric&&o.nativeLabel===r.nativeLabel&&o.scope===r.scope&&o.unit===r.unit).sort((a,b)=>b.periodEnd.localeCompare(a.periodEnd));
  const d=definitions.find(d=>d.definitionVersion===prior[0]?.definitionVersion&&r.periodEnd>=d.effectiveFrom&&(!d.effectiveTo||r.periodEnd<=d.effectiveTo));
  if(!d){issues.push({type:'METRIC_LABEL_OR_DEFINITION_CHANGE',metric:r.metric,nativeLabel:r.nativeLabel,previousVersion:prior[0]?.definitionVersion??null,effectiveFrom:r.periodEnd,changeType:'UNQUALIFIED_NATIVE_LABEL',changeReason:'No exact active native label/scope/unit binding in accepted registry',comparabilityStatus:'REVIEW_REQUIRED',status:'REVIEW_REQUIRED'});continue;}
  rows.push({...r,definitionVersion:d.definitionVersion,comparabilityStatus:d.comparabilityStatus});
 }
 return {rows,issues};
}
export function reconstruct(long,short,proof){
 if(!proof?.reviewed||!proof.reason||!proof.sourceIds?.includes(long.sourceId)||!proof.sourceIds?.includes(short.sourceId)||proof.restatementBasis!==long.restatementBasis)fail('INCOMPATIBLE_VINTAGE');
 for(const k of ['company','metric','scope','definitionVersion','unit','periodStart','precision','restatementBasis'])if(long[k]!==short[k])fail('INCOMPATIBLE_DURATION');
 date(long.periodStart);date(short.periodEnd);date(long.periodEnd);const q=quarter(long.periodEnd);
 const after=new Date(`${short.periodEnd}T00:00:00Z`);after.setUTCDate(after.getUTCDate()+1);
 const start=long.company==='MSFT'?`${Number(long.periodEnd.slice(0,4))-(long.periodEnd.slice(5,7)<='06'?1:0)}-07-01`:`${long.periodEnd.slice(0,4)}-01-01`;
 if(!['YTD','FY'].includes(long.periodType)||!['YTD','Q'].includes(short.periodType)||long.precision!=='EXACT'||!Number.isFinite(long.value)||!Number.isFinite(short.value)||after.toISOString().slice(0,10)!==q.periodStart||start!==long.periodStart||long.periodType==='FY'&&long.periodEnd.slice(5)!==(long.company==='MSFT'?'06-30':'12-31'))fail('EXACT_DURATION_BOUNDARY');
 return {...long,periodStart:q.periodStart,periodType:'Q',observationId:'candidate-subtract:'+hash([long,short,proof]),value:long.value-short.value,evidenceClass:'CALCULATED_FROM_DISCLOSED_VALUES',calculation:{formula:'longDuration - shortDuration',operandIds:[long.observationId,short.observationId],restatementCompatibility:proof}};
}
export function selectQuarter(rows,company,end,proofs=[]){
 const selected=[],issues=[];
 for(const metric of [...new Set(rows.filter(r=>r.company===company&&r.periodEnd===end).map(r=>r.metric))].sort()){
  const standalone=rows.filter(r=>r.company===company&&r.metric===metric&&r.periodEnd===end&&r.periodType==='Q');
  if(standalone.length===1){selected.push(standalone[0]);continue;}
  if(standalone.length>1){issues.push({metric,type:'AMBIGUOUS_STANDALONE_CONTEXT',status:'REVIEW_REQUIRED'});continue;}
  const long=rows.filter(r=>r.company===company&&r.metric===metric&&r.periodEnd===end&&['YTD','FY'].includes(r.periodType));
  if(long.length!==1){issues.push({metric,type:'UNAVAILABLE_EXACT_DURATION',status:'REVIEW_REQUIRED'});continue;}
  const q=quarter(end),previousEnd=new Date(Date.parse(q.periodStart+'T00:00:00Z')-86400000).toISOString().slice(0,10);
  const short=rows.filter(r=>r.company===company&&r.metric===metric&&r.periodEnd===previousEnd);
  if(short.length!==1){issues.push({metric,type:'UNAVAILABLE_PRIOR_DURATION',status:'REVIEW_REQUIRED'});continue;}
  try{selected.push(reconstruct(long[0],short[0],proofs.find(p=>p.operandIds?.includes(long[0].observationId)&&p.operandIds.includes(short[0].observationId))));}catch(e){issues.push({metric,type:e.message,status:'REVIEW_REQUIRED'});}
 }
 return {selected,issues};
}
export function validateRows(rows,sources,definitions,asOf){
 date(asOf);const ids=new Set();
 for(const r of rows){
  const s=sources.find(s=>s.sourceId===r.sourceId),d=definitions.find(d=>d.definitionVersion===r.definitionVersion);date(r.periodStart);date(r.periodEnd);
  if(!s||s.company!==r.company||r.periodEnd>s.publicationDate||s.publicationDate>asOf||!r.observationId||ids.has(r.observationId))fail('OBSERVATION_PROVENANCE');ids.add(r.observationId);
  if(!d||d.company!==r.company||!d.metrics.includes(r.metric)||!d.scopes.includes(r.scope)||r.unit!==d.unit||!r.nativeLabel||!r.locator||!r.restatementBasis||!Number.isFinite(r.value)||r.precision!=='EXACT'||!['OBSERVED','CALCULATED_FROM_DISCLOSED_VALUES'].includes(r.evidenceClass))fail('DEFINITION_UNIT_SCOPE');
  if(r.periodEnd<d.effectiveFrom||d.effectiveTo&&r.periodEnd>d.effectiveTo)fail('DEFINITION_EFFECTIVE_PERIOD');
  if(!['COMPARABLE','LIMITED_COMPARABILITY','NOT_COMPARABLE'].includes(r.comparabilityStatus))fail('COMPARABILITY');
  if(r.periodType==='Q'&&quarter(r.periodEnd).periodStart!==r.periodStart)fail('QUARTER_DURATION');
  if(['YTD','FY'].includes(r.periodType)){
   const start=r.company==='MSFT'?`${Number(r.periodEnd.slice(0,4))-(r.periodEnd.slice(5,7)<='06'?1:0)}-07-01`:`${r.periodEnd.slice(0,4)}-01-01`;
   if(r.periodStart!==start)fail('FISCAL_DURATION');
  }else if(!['Q','POINT'].includes(r.periodType)||r.periodType==='POINT'&&r.periodStart!==r.periodEnd)fail('PERIOD_TYPE');
 }
 return true;
}
export function detectRestatements(rows,accepted){
 return rows.flatMap(r=>accepted.filter(a=>a.company===r.company&&a.metric===r.metric&&a.scope===r.scope&&a.periodStart===r.periodStart&&a.periodEnd===r.periodEnd&&a.periodType===r.periodType&&(a.value!==r.value||a.definitionVersion!==r.definitionVersion)).map(a=>({type:a.definitionVersion!==r.definitionVersion?'DEFINITION_VERSION_CHANGE':'RESTATED_COMPARATIVE_CANDIDATE',definitionChange:a.definitionVersion!==r.definitionVersion?{definitionVersion:r.definitionVersion,previousVersion:a.definitionVersion,effectiveFrom:r.periodStart,changeType:r.metric.startsWith('segment')?'SEGMENT_RECAST':'METRIC_DEFINITION_CHANGE',changeReason:'Candidate definition differs from retained accepted definition',comparabilityStatus:'REVIEW_REQUIRED'}:null,status:'REVIEW_REQUIRED',oldAccepted:a,newCandidate:r,acceptedHistoryModified:false})));
}
export function qualifyQuarter(company,end,rows,{reviewItems=[]}={}){
 const derived=deriveCash(company,rows),all=[...rows,...derived],get=m=>all.find(r=>r.metric===m),cash=company==='AMZN'?get('cashPpeNet'):get('cashPpeGross')??get('cashPpeNet');
 const missing=['revenue','operatingIncome','cfo','fcfCompanyConvention'].filter(m=>!get(m));if(!cash)missing.push('nativeCashPpe');
 const reported=get('fcfReported'),calculated=get('fcfCompanyConvention');
 const net=get('cashPpeNet'),gross=get('cashPpeGross'),proceeds=get('ppeProceedsIncentives');
 const netConflict=company==='AMZN'&&!!rows.find(r=>r.metric==='cashPpeNet')&&!!gross&&!!proceeds&&net.value!==gross.value-proceeds.value;
 const conflict=!!reported&&!!calculated&&reported.value!==calculated.value||netConflict||get('revenue')?.value<=0;
 // Definitions and context failures only block their affected family; unresolved core scope blocks core.
 const core=new Set(['revenue','operatingIncome','cfo','cashPpeGross','cashPpeNet','ppeProceedsIncentives','financeLeasePrincipal','fcfReported']);
 const blockers=reviewItems.filter(i=>!(i.type==='MISSING_OR_AMBIGUOUS_NATIVE_QUARTER'&&i.matches===0)).filter(i=>!i.metric&&['SAME_URL_CHANGED_BYTES','AMENDED_FILING','NEW_URL_SAME_FILING'].includes(i.type)||core.has(i.metric));
 const status=missing.length||conflict||blockers.length?'REVIEW_REQUIRED':'QUALIFIED_CANDIDATE';
 return {company,quarter:quarter(end).calendarQuarter,status,core:{missing,reconciliation:conflict?'REVIEW_REQUIRED':reported?'REPORTED_AND_CALCULATED_MATCH':calculated?'CALCULATED_COMPANY_CONVENTION':'UNAVAILABLE'},selection:rows.map(r=>({metric:r.metric,observationId:r.observationId,definitionVersion:r.definitionVersion,sourceId:r.sourceId})),rows:all,reviewItems,optionalFamilies:Object.fromEntries(Object.entries(optionalFamilies).map(([f,ms])=>[f,{status:reviewItems.some(i=>i.metric&&ms.includes(i.metric))?'REVIEW_REQUIRED':ms.length&&ms.every(m=>get(m))?'QUALIFIED_CANDIDATE':ms.some(m=>get(m))?'PARTIAL':'UNAVAILABLE'}])),recognizedAiRevenue:{status:'UNAVAILABLE',value:null},aiReturns:{status:'NOT_IDENTIFIED'},accepted:false};
}
