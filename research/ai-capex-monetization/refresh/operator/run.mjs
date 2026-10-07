// Operator control supplies source identity only. Frozen Phase 2D economic functions are reused.
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {load} from '../../quarterly/scripts/io.mjs';import {bytes,hash,date} from '../../scripts/contract.mjs';
import {companies,issuers} from '../scripts/config.mjs';import {SafeFetcher,permitted} from '../scripts/fetch.mjs';
import {submissions,archiveLinks,detectSourceChanges} from '../scripts/discovery.mjs';
import {parseNative} from '../scripts/run.mjs';import {qualifySource,bindDefinitions,validateRows,selectQuarter,qualifyQuarter,detectRestatements} from '../scripts/qualify.mjs';
import {candidateMonitor,candidatePreview,validateCandidate} from '../scripts/monitor.mjs';
import {validateDocument,outputDirectory} from '../access/qualification.mjs';
export const implementationVersion='ai-capex-operator-refresh-v0.1.0';
export const researchBase='49dbd388a9a1eac84322fcecd37bff97130ee7ef';
export function inputs(value){
 const allowed=['mode','company','officialUrl','expectedQuarter'];if(Object.keys(value).some(k=>!allowed.includes(k)))throw Error('SOURCE_IDENTITY_ONLY');
 const v={mode:'check',company:'ALL',...value};
 if(!['check','manual_seed'].includes(v.mode)||!['ALL',...companies].includes(v.company))throw Error('INPUT_MODE_OR_COMPANY');
 if(v.mode==='manual_seed'&&(v.company==='ALL'||typeof v.officialUrl!=='string'||!/^20\d{2}Q[1-4]$/.test(v.expectedQuarter??'')))throw Error('MANUAL_SOURCE_IDENTITY_REQUIRED');
 if(v.mode==='check'&&(v.officialUrl||v.expectedQuarter))throw Error('CHECK_MODE_HAS_NO_SEED');
 return v;
}
export function seed(v,data){
 const end=v.expectedQuarter?`${v.expectedQuarter.slice(0,4)}-${['03-31','06-30','09-30','12-31'][Number(v.expectedQuarter.at(-1))-1]}`:null;
 let u;try{u=new URL(v.officialUrl);if(u.href.length>2048||[...u.searchParams.keys()].some(k=>/token|secret|password|credential|signature|^key$|^auth$|x-amz/i.test(k))||u.protocol!=='https:'||u.username||u.password||u.hash||u.port&&u.port!=='443')throw Error();}catch{return {status:'REJECTED',reason:'INVALID_OFFICIAL_URL'};}
 const known=data.input.sources.find(s=>s.company===v.company&&s.url===u.href);
 const cdn=u.hostname.endsWith('.q4cdn.com')||u.hostname==='cdn-dynmedia-1.microsoft.com';
 if(cdn&&!known)return {status:'DELEGATION_REVIEW_REQUIRED',review:{company:v.company,officialParentEvidence:{issuerPage:issuers[v.company].archive,binding:'NEW_URL_NOT_QUALIFIED',existingQualifiedParents:[...new Set(data.input.sources.filter(s=>s.company===v.company&&s.delegatedBy).map(s=>s.delegatedBy))]},cdnHost:u.hostname,tenant:u.hostname.endsWith('.q4cdn.com')?u.pathname.split('/')[1]:null,url:u.href,expectedQuarter:v.expectedQuarter}};
 try{permitted(v.company,u.href,known?.delegatedBy);}catch{return {status:'REJECTED',reason:'OFFICIAL_HOST_OR_DELEGATION'};}
 if(end&&known?.periodEnd&&known.periodEnd!==end)return {status:'REJECTED',reason:'EXPECTED_QUARTER_MISMATCH'};
 return {status:'DISCOVERED',source:{...known,company:v.company,sourceId:known?.sourceId??'operator-'+hash({company:v.company,url:u.href,expectedQuarter:v.expectedQuarter??null}).slice(0,20),url:u.href,periodEnd:end??known?.periodEnd??null,publicationDate:known?.publicationDate??null,documentType:known?.documentType??'OFFICIAL_EARNINGS_RELEASE',accession:known?.accession??null,parser:known?.parser==='manual'?(/\.pdf$/i.test(u.pathname)?'pdf':'html'):known?.parser??(/\.pdf$/i.test(u.pathname)?'pdf':/\.xlsx$/i.test(u.pathname)?'xlsx':'html')}};
}
export function decision(rows){
 if(rows.some(r=>r.status==='QUALIFIED_CANDIDATE'))return 'QUALIFIED CANDIDATE READY FOR REVIEW';
 if(rows.some(r=>['REVIEW_REQUIRED','DELEGATION_REVIEW_REQUIRED','REJECTED'].includes(r.status)))return 'REVIEW REQUIRED';
 if(rows.some(r=>['ACCESS_BLOCKED','NO_STATIC_LINK'].includes(r.status)))return 'OFFICIAL URL REQUIRED';
 return rows.every(r=>['NO_NEW_DISCLOSURE_CONFIRMED','KNOWN_ACCEPTED_SOURCE_UNCHANGED'].includes(r.status))?'NO ACTION NEEDED':'REVIEW REQUIRED';
}
function withoutClock(s){const {retrievedAt,retrievalResult,rawArtifactNew,status,...rest}=s;return rest;}
function sourcePath(target){let p=path.resolve(target),suffix=[];while(!fs.existsSync(p)){suffix.unshift(path.basename(p));p=path.dirname(p);}return path.join(fs.realpathSync(p),...suffix);}
export async function run({request={},asOf,clock=()=>Date.now(),cache,out,fetcher,sleep,parser=parseNative,validator=validateDocument,data=load(),audit={}}={}){
 const v=inputs(request);date(asOf);const startedAt=new Date(clock()).toISOString();if(startedAt.slice(0,10)!==asOf)throw Error('EXPLICIT_CURRENT_CLOCK_REQUIRED');
 out=outputDirectory(out);cache=sourcePath(cache);const repository=fs.realpathSync(execFileSync('git',['rev-parse','--show-toplevel'],{encoding:'utf8'}).trim());
 if(cache===repository||cache.startsWith(repository+path.sep))throw Error('EXTERNAL_RAW_CACHE_REQUIRED');
 fs.mkdirSync(out,{recursive:true});const acceptedBefore=hash(data),safe=new SafeFetcher({cache,fetcher,clock,sleep});
 const rows=[],sources=[],quarters=[],events=[],changes=[];let documentBudget=8;
 const scope=v.company==='ALL'?companies:[v.company];
 async function processDocument(descriptor,companyRow){
  if(documentBudget--<=0){companyRow.status='REVIEW_REQUIRED';companyRow.warnings.push('DOCUMENT_BUDGET_REACHED');return;}
  const requested=seed({mode:'manual_seed',company:descriptor.company,officialUrl:descriptor.url,expectedQuarter:descriptor.periodEnd?`${descriptor.periodEnd.slice(0,4)}Q${Math.ceil(Number(descriptor.periodEnd.slice(5,7))/3)}`:null},data);
  // Discovered CDN links do not bypass manual delegation gates. Unknown native periods stay unknown.
  if(requested.status!=='DISCOVERED'){companyRow.status=requested.status;companyRow.review=requested.review??{reason:requested.reason};return;}
  const fetched=await safe.get({...requested.source,...descriptor,delegatedBy:requested.source.delegatedBy});
  const item={url:descriptor.url,status:fetched.status==='FETCHED'?'FETCHED':fetched.status==='ACCESS_BLOCKED'?'ACCESS_BLOCKED':'REVIEW_REQUIRED',lifecycle:['DISCOVERED'],rawHash:fetched.receipt?.sha256??null,httpStatus:fetched.httpStatus??null};companyRow.documents.push(item);
  if(fetched.status!=='FETCHED'){companyRow.status=item.status;return;}item.lifecycle.push('FETCHED');
  const known=data.input.sources.find(s=>s.company===descriptor.company&&s.url===descriptor.url);
  const kind=/\.xlsx(?:\?|$)/i.test(descriptor.url)?'xlsx':/\.pdf(?:\?|$)/i.test(descriptor.url)?'pdf':'html';
  const check=validator({...descriptor,kind,sha256:known?.sha256??fetched.receipt.sha256},fetched.raw,fetched.receipt.mimeType);
  item.documentValidation=check.result==='PASS'&&!known?'VALID_DOCUMENT_NEW_CANDIDATE_HASH':check.detail;
  if(check.result!=='PASS'){item.status=companyRow.status='REVIEW_REQUIRED';item.lifecycle.push('REVIEW_REQUIRED');return;}
  const source={...descriptor,...fetched.receipt,parser:kind,publisher:issuers[descriptor.company].name,status:'RETRIEVED',locator:'native financial document',periodEnd:descriptor.periodEnd??null,publicationDate:descriptor.publicationDate??null};
  let parsed;try{parsed=await parser({...source},cache,{out:path.join(out,'internal-extractions')});}catch{item.status=companyRow.status='REVIEW_REQUIRED';item.warning='NATIVE_PARSER_FAILED';return;}
  item.lifecycle.push('PARSED');
  try{
   const ps=parsed.source;if(!ps)throw Error('NATIVE_SOURCE_UNAVAILABLE');
   for(const k of ['company','sourceId','url','sha256','byteSize','publisher','retrievedAt','documentType','accession'])if(ps[k]!==source[k])throw Error('PARSER_SOURCE_IDENTITY');
   if(v.mode==='manual_seed'&&ps.periodEnd!==requested.source.periodEnd)throw Error('NATIVE_PERIOD_MISMATCH');
   qualifySource(ps,cache,asOf);const bound=bindDefinitions(parsed.observations??[],data.input.observations,data.definitions);
   validateRows(bound.rows,[ps],data.definitions,asOf);item.lifecycle.push('VALIDATED');
   const review=[...detectSourceChanges(descriptor,fetched.receipt,data.input.sources),...bound.issues,...(parsed.reviewItems??[]),...detectRestatements(bound.rows,data.input.observations)];
   const knownUnchanged=known?.sha256===fetched.receipt.sha256&&ps.periodEnd<='2026-06-30';
   if(!knownUnchanged){changes.push(...review);events.push(...(parsed.events??[]));sources.push(withoutClock(ps));}
   const sel=selectQuarter(bound.rows,ps.company,ps.periodEnd);const q=qualifyQuarter(ps.company,ps.periodEnd,sel.selected,{reviewItems:[...review,...sel.issues]});
   companyRow.quarter=q.quarter;companyRow.coreMetrics=q.rows.filter(r=>['revenue','operatingIncome','cfo','cashPpeGross','cashPpeNet','financeLeasePrincipal','fcfCompanyConvention'].includes(r.metric)).map(({metric,value,unit,nativeLabel,definitionVersion,locator,sourceId})=>({metric,value,unit,nativeLabel,definitionVersion,locator,sourceId}));companyRow.fcfReconciliation=q.core.reconciliation;companyRow.optionalFamilies=q.optionalFamilies;companyRow.warnings.push(...q.core.missing.map(m=>'MISSING:'+m),...review.map(r=>r.type));
   if(knownUnchanged){item.status=companyRow.status='KNOWN_ACCEPTED_SOURCE_UNCHANGED';}
   else{item.status=companyRow.status=q.status;quarters.push(q);}
   item.lifecycle.push(item.status==='KNOWN_ACCEPTED_SOURCE_UNCHANGED'?'VALIDATED':item.status);item.accepted=false;
  }catch(e){item.status=companyRow.status='REVIEW_REQUIRED';item.warning=/^[A-Z_]+$/.test(e.message)?e.message:'ACCOUNTING_OR_SOURCE_REVIEW_REQUIRED';item.lifecycle.push('REVIEW_REQUIRED');}
 }
 for(const company of scope){
  const row={company,mode:v.mode,status:'REVIEW_REQUIRED',discoveryFamilies:[],documents:[],warnings:[],accepted:false};rows.push(row);
  if(v.mode==='manual_seed'){
   const seeded=seed(v,data);row.status=seeded.status;if(seeded.status!=='DISCOVERED'){row.review=seeded.review??{reason:seeded.reason};continue;}
   await processDocument(seeded.source,row);continue;
  }
  const found=[];
  for(const family of ['SEC_SUBMISSIONS','ISSUER_IR']){
   const url=family==='SEC_SUBMISSIONS'?`https://data.sec.gov/submissions/CIK${issuers[company].cik}.json`:issuers[company].archive;
   const fetched=await safe.get({company,url,sourceId:company+'-'+family,documentType:'DISCOVERY_INDEX'});let result={family,url,status:fetched.status==='ACCESS_BLOCKED'?'ACCESS_BLOCKED':'REVIEW_REQUIRED',httpStatus:fetched.httpStatus??null};
   if(fetched.status==='FETCHED')try{
    let links;
    if(family==='SEC_SUBMISSIONS'){
     if(!/^application\/json(?:;|$)/i.test(fetched.receipt.mimeType))throw Error('MIME');links=submissions(company,JSON.parse(fetched.raw),{asOf,known:data.input.sources});
     result.status=links.length?'NEW_DISCLOSURE_FOUND':'NO_NEW_DISCLOSURE_CONFIRMED';
    }else{
     const html=fetched.raw.toString('utf8');if(!/^text\/html(?:;|$)/i.test(fetched.receipt.mimeType)||!new RegExp(issuers[company].name,'i').test(html)||/captcha|access denied|verify you are human/i.test(html))throw Error('IR_CONTENT');
     links=archiveLinks(company,html,url);result.status=links.length?'NEW_DISCLOSURE_FOUND':'NO_STATIC_LINK';
    }
    result.discoveryQualified=links.length>0||family==='SEC_SUBMISSIONS';result.officialLinks=links.map(s=>s.url);found.push(...links);
   }catch{result.status='REVIEW_REQUIRED';}
   row.discoveryFamilies.push(result);
  }
  row.status=found.length?'NEW_DISCLOSURE_FOUND':row.discoveryFamilies.every(s=>s.status==='NO_NEW_DISCLOSURE_CONFIRMED')?'NO_NEW_DISCLOSURE_CONFIRMED':row.discoveryFamilies.some(s=>s.status==='ACCESS_BLOCKED')?'ACCESS_BLOCKED':row.discoveryFamilies.some(s=>s.status==='REVIEW_REQUIRED')?'REVIEW_REQUIRED':'NO_STATIC_LINK';
  for(const d of [...new Map(found.map(d=>[d.url,d])).values()])await processDocument(d,row);
 }
 // Never choose between conflicting candidate disclosures implicitly.
 for(const q of quarters)if(quarters.filter(other=>other.company===q.company&&other.quarter===q.quarter).length>1){
  q.status='REVIEW_REQUIRED';const row=rows.find(r=>r.company===q.company);row.status='REVIEW_REQUIRED';row.warnings.push('AMBIGUOUS_CORE_COMPANY_QUARTER');
 }
 let monitor=null,preview=null;
 if(quarters.length||changes.length||events.length){const extras={sourceIdentities:sources,sourceChanges:changes,events};monitor=candidateMonitor(data,quarters,extras);validateCandidate(monitor,data,quarters,extras);preview=candidatePreview(data,monitor);}
 if(hash(load())!==acceptedBefore)throw Error('ACCEPTED_INPUT_CHANGED');
 const content={implementationVersion,researchBase,sourceMode:v.mode,companyScope:scope,expectedQuarter:v.expectedQuarter??null,acceptedDataThrough:'2026Q2',acceptedInputHash:acceptedBefore,companies:rows,sourceIdentities:sources,definitionChanges:changes.filter(i=>/DEFINITION|POLICY|SEGMENT|RECAST|LEASE|RPO/.test(i.type)),restatements:changes.filter(i=>/RESTATED/.test(i.type)),candidateMonitor:monitor?{status:'CANDIDATE_MONITOR',hash:monitor.resultHash,acceptedMonitorHash:monitor.content.acceptedMonitorHash,proposedHeadlineQuarter:monitor.content.proposedHeadlineQuarter,latestByCompany:monitor.content.latestByCompany,records:monitor.content.records}:null,candidatePublicPreview:{status:preview?'NOT_FOR_PRODUCTION':'NOT_GENERATED',hash:preview?.resultHash??null},qualificationResult:decision(rows),accepted:false,productionWritePerformed:false,emailEnabled:false,scheduleEnabled:false,recognizedAiRevenue:'UNAVAILABLE',aiReturns:'NOT_IDENTIFIED'};
 // Compact deterministic candidate content excludes operational identity and timestamps.
 const report={content,contentHash:hash(content),audit:{githubRunId:audit.githubRunId??null,actor:audit.actor??'LOCAL_OPERATOR',mode:v.mode,companyScope:scope,expectedQuarter:v.expectedQuarter??null,sourceMode:v.mode,researchExecutionSha:audit.researchExecutionSha??null,qualificationAsOf:asOf,startedAt,endedAt:new Date(clock()).toISOString()}};
 if(bytes(report).length>1_000_000)throw Error('COMPACT_REPORT_BUDGET');
 fs.writeFileSync(path.join(out,'operator-candidate.json'),bytes(report));
 return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const value=k=>process.env[k]||undefined;
 run({request:{mode:value('AI_CAPEX_MODE')??'check',company:value('AI_CAPEX_COMPANY')??'ALL',...(value('AI_CAPEX_OFFICIAL_URL')?{officialUrl:value('AI_CAPEX_OFFICIAL_URL')}:{}),...(value('AI_CAPEX_EXPECTED_QUARTER')?{expectedQuarter:value('AI_CAPEX_EXPECTED_QUARTER')}: {})},asOf:value('AI_CAPEX_AS_OF')??new Date().toISOString().slice(0,10),cache:value('WIL_AI_CAPEX_CACHE')??path.join(os.tmpdir(),'wil-operator-cache'),out:value('AI_CAPEX_OUTPUT')??path.join(os.tmpdir(),'wil-operator-output'),audit:{githubRunId:value('GITHUB_RUN_ID'),actor:value('GITHUB_ACTOR'),researchExecutionSha:value('AI_CAPEX_RESEARCH_SHA')??value('GITHUB_SHA')}}).then(r=>{
  console.log(JSON.stringify({result:r.content.qualificationResult,companies:r.content.companies.map(({company,status,quarter})=>({company,status,quarter})),contentHash:r.contentHash},null,2));
  if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,`## AI CapEx Quarterly Refresh\n\n${r.content.qualificationResult}\n\nMode: ${r.audit.mode}\n\n${r.content.companies.map(c=>`${c.company}: ${c.status}`).join('\n\n')}\n\nCandidate only. Human review required. No publication or acceptance.\n`);
 }).catch(()=>{console.error('OPERATOR_REFRESH_FAILED: configuration or isolation check; no data accepted');process.exitCode=1;});
}
