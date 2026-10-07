import fs from 'node:fs';
import {createHash} from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {SafeFetcher,permitted} from '../scripts/fetch.mjs';
import {issuers,companies} from '../scripts/config.mjs';
import {archiveLinks,submissions} from '../scripts/discovery.mjs';
import {load} from '../../quarterly/scripts/io.mjs';
import {bytes,hash,date} from '../../scripts/contract.mjs';

export const baseSHA='05623ffa6cbe0d4ba9f5c2fc0a5d3986c5ac5c13';
export const version='ai-capex-live-access-v0.1.0';
export const families=['SEC_SUBMISSIONS','SEC_FILING_ARCHIVE','MSFT_IR','MSFT_RELEASE','MSFT_WORKBOOK','MSFT_CALL','GOOG_IR','GOOG_CDN','AMZN_IR','AMZN_CDN','META_IR','META_CDN'];
const controlIds={MSFT_RELEASE:'msft-fy2026q4-ir',MSFT_WORKBOOK:'msft-workbook-fy2026q4',MSFT_CALL:'msft-call-fy2026q4',GOOG_CDN:'goog-2026q2-pdf',AMZN_CDN:'amzn-2026q2-pdf',META_CDN:'meta-2026q2-pdf'};
const here=path.dirname(fileURLToPath(import.meta.url));
export function plan(data=load()){
 const controls=Object.entries(controlIds).map(([family,id])=>{
  const source=data.input.sources.find(s=>s.sourceId===id);if(!source?.sha256)throw Error('PINNED_CONTROL_MISSING');
  return {...source,family,role:'CONTROL',kind:family==='MSFT_WORKBOOK'?'xlsx':source.url.endsWith('.pdf')?'pdf':'html',fiscalLabel:source.company==='MSFT'?'FY26Q4':null};
 });
 // The qualified 2024 Meta report binds this known accession to an official SEC index.
 // An index is a discovery control, never a financial-document PASS.
 const annual=data.input.sources.find(s=>s.sourceId==='meta-annual-2024-repair');
 const secControl=data.events.events.find(e=>e.priorManualReference?.url?.includes('goog-20260630.htm'));
 return [...controls,{company:'GOOG',sourceId:'sec-known-goog-2026q2',url:secControl.priorManualReference.url,periodEnd:secControl.observationPeriod,family:'SEC_FILING_ARCHIVE',role:'CONTROL',kind:'html',historicalIdentityBasis:'PINNED_MANUAL_FILING_REFERENCE_NO_RAW_HASH'}, {company:'META',sourceId:'sec-meta-known-2024-index',url:annual.publicationDateEvidenceURL,accession:annual.accession,family:'SEC_FILING_ARCHIVE',role:'SEC_INDEX',kind:'html'},
  ...companies.map(company=>({company,sourceId:company+'-submissions',url:`https://data.sec.gov/submissions/CIK${issuers[company].cik}.json`,family:'SEC_SUBMISSIONS',role:'SUBMISSIONS',kind:'json'})),
  ...companies.map(company=>({company,sourceId:company+'-archive',url:issuers[company].archive,family:company+'_IR',role:'DISCOVERY',kind:'html'}))];
}
export function validateDocument(source,raw,mime,python=process.env.WIL_AI_CAPEX_PYTHON??'python3'){
 const result=JSON.parse(execFileSync(python,[path.join(here,'content.py')],{input:JSON.stringify({...source,mime,raw:raw.toString('base64')}),timeout:30000,maxBuffer:10000})).result;
 if(result!=='VALID_DOCUMENT')return {result:result==='CONTENT_TYPE_REJECTED'?result:result==='LAYOUT_UNSUPPORTED'?result:'REVIEW_REQUIRED',detail:result};
 if(source.sha256&&hashRaw(raw)!==source.sha256)return {result:'REVIEW_REQUIRED',detail:'CHANGED_BYTES_REVIEW_REQUIRED'};
 return {result:source.sha256?'PASS':'REVIEW_REQUIRED',detail:source.sha256?'PASS_EXISTING_HASH':'VALID_UNPINNED_DOCUMENT_REVIEW_REQUIRED',documentQualified:!!source.sha256};
}
function hashRaw(raw){return createHash('sha256').update(raw).digest('hex');}
export function manualSeed({company,url,expectedQuarter},data=load()){
 if(!companies.includes(company)||!/^20\d{2}Q[1-4]$/.test(expectedQuarter))throw Error('SEED_IDENTITY');
 const known=data.input.sources.find(s=>s.company===company&&s.url===url);
 // Delegation must already be in the qualified manifest; operator cannot self-delegate a CDN.
 permitted(company,url,known?.delegatedBy);
 return {...known,company,url,sourceId:known?.sourceId??'manual-'+hash({company,url,expectedQuarter}).slice(0,16),role:'CONTROL',family:company+'_MANUAL',kind:/\.pdf(?:\?|$)/i.test(url)?'pdf':/\.xlsx(?:\?|$)/i.test(url)?'xlsx':'html',manualSeed:true,expectedQuarter,periodEnd:known?.periodEnd??`${expectedQuarter.slice(0,4)}-${['03-31','06-30','09-30','12-31'][Number(expectedQuarter.at(-1))-1]}`};
}
export function companyStates(probes){
 const rows={};
 for(const company of companies){
  const p=probes.filter(r=>r.company===company);
  const discovery=p.some(r=>r.discoveryQualified);
  const controls=p.filter(r=>r.role==='CONTROL'&&r.documentQualified);
  const releases=controls.filter(r=>r.family.endsWith('_RELEASE')||r.family.endsWith('_CDN')||r.family.endsWith('_MANUAL')||r.family==='MSFT_WORKBOOK');
  const status=family=>p.find(r=>r.family===family)?.result??'NOT_TESTED';
  rows[company]={discoveryStatus:discovery?'DISCOVERY_QUALIFIED':p.filter(r=>['DISCOVERY','SUBMISSIONS'].includes(r.role)).some(r=>r.result==='ACCESS_BLOCKED')?'DISCOVERY_ACCESS_BLOCKED':'DISCOVERY_UNQUALIFIED',documentFetchStatus:controls.length?'DOCUMENT_FETCH_QUALIFIED':'UNQUALIFIED',coreFinancialDocumentStatus:releases.length?'QUALIFIED':'UNQUALIFIED',managementEventStatus:controls.some(r=>r.family==='MSFT_CALL')?'QUALIFIED':'UNQUALIFIED',workbookStatus:controls.some(r=>r.kind==='xlsx')?'QUALIFIED':'NOT_QUALIFIED',secStatus:status('SEC_SUBMISSIONS'),qualifiedDocumentRoutes:controls.map(r=>r.url),qualifiedDiscoveryRoutes:p.filter(r=>r.discoveryQualified).map(r=>r.url)};
 }
 return rows;
}
export function classify(rows){
 const all=companies.every(c=>rows[c].discoveryStatus==='DISCOVERY_QUALIFIED'&&rows[c].coreFinancialDocumentStatus==='QUALIFIED');
 return all?'QUALIFIED_PRIMARY_RUNNER':companies.some(c=>rows[c].discoveryStatus==='DISCOVERY_QUALIFIED'||rows[c].documentFetchStatus==='DOCUMENT_FETCH_QUALIFIED')?'PARTIALLY_QUALIFIED':'UNQUALIFIED';
}
export function compare(reports){
 const strategy=companies.map(company=>({company,runners:reports.filter(r=>r.companies[company].discoveryStatus==='DISCOVERY_QUALIFIED'&&r.companies[company].coreFinancialDocumentStatus==='QUALIFIED').map(r=>r.runner.type)}));
 const ready=strategy.every(c=>c.runners.length);
 return {strategy,primary:reports.find(r=>r.classification==='QUALIFIED_PRIMARY_RUNNER')?.runner.type??null,secondary:null,splitRunnerQualified:ready&&!reports.some(r=>r.classification==='QUALIFIED_PRIMARY_RUNNER'),decision:ready?'READY FOR LIVE CONTROLLED QUARTERLY REFRESH PILOT':'LIVE RUNNER ACCESS STILL REQUIRES REPAIR'};
}
export async function qualify({runner,asOf,cache,fetcher=fetch,clock=()=>Date.now(),sleep,validator=validateDocument,seeds=[],data=load(),sources=plan(data)}={}){
 if(!['LOCAL_MAC','GITHUB_ACTIONS'].includes(runner))throw Error('RUNNER'); date(asOf);
 const start=new Date(clock()).toISOString();if(start.slice(0,10)!==asOf)throw Error('EXPLICIT_CURRENT_RUN_CLOCK');
 // Never allow raw caches in any checkout. This function only writes content-addressed cache objects.
 const gitRoot=execFileSync('git',['rev-parse','--show-toplevel'],{encoding:'utf8'}).trim();
 fs.mkdirSync(cache,{recursive:true});cache=fs.realpathSync(cache);
 if(cache===gitRoot||cache.startsWith(gitRoot+path.sep))throw Error('EXTERNAL_CACHE_REQUIRED');
 let exchanges=[];
 const instrumented=async(url,options)=>{
  const begin=performance.now();
  const res=await fetcher(url,options);
  exchanges.push({url,httpStatus:res.status,contentType:res.headers.get('content-type'),location:res.headers.get('location'),retryAfter:res.headers.get('retry-after'),headerLatencyMs:Math.round(performance.now()-begin)});
  return res;
 };
 const safe=new SafeFetcher({cache,fetcher:instrumented,clock,sleep});const probes=[];
 for(const source of [...sources,...seeds.map(s=>manualSeed(s,data))]){
  exchanges=[];const begin=performance.now();const fetched=await safe.get(source);
  let assessment={result:'REVIEW_REQUIRED',detail:fetched.status,documentQualified:false,discoveryQualified:false};
  let candidates=[];
  if(fetched.status==='FETCHED'){
   try{
    if(source.role==='CONTROL')assessment={...assessment,...validator(source,fetched.raw,fetched.receipt.mimeType)};
    else if(source.role==='SUBMISSIONS'){
     if(!/^application\/json(?:;|$)/i.test(fetched.receipt.mimeType))assessment={...assessment,result:'CONTENT_TYPE_REJECTED'};
     else{
      const doc=JSON.parse(fetched.raw);candidates=submissions(source.company,doc,{asOf,known:data.input.sources});
      assessment={...assessment,result:'PASS',detail:'VALID_ISSUER_SUBMISSIONS',discoveryQualified:true,currentDiscovery:candidates.length?'OFFICIAL_DISCLOSURE_CANDIDATES':'NO_NEW_DISCLOSURE_CONFIRMED'};
     }
    }else if(source.role==='DISCOVERY'){
     if(!/^text\/html(?:;|$)/i.test(fetched.receipt.mimeType))assessment={...assessment,result:'CONTENT_TYPE_REJECTED'};
     else{
      const html=fetched.raw.toString('utf8');
      if(/access denied|just a moment|verify you are human|captcha|cookie wall/i.test(html))throw Error('CHALLENGE_PAGE');
      // Bind the archive to its issuer rather than accepting a generic investor landing page.
      if(!new RegExp(issuers[source.company].name,'i').test(html))throw Error('ISSUER_MISMATCH');
      candidates=archiveLinks(source.company,html,source.url);
      assessment={...assessment,result:candidates.length?'PASS':'NO_STATIC_LINK',detail:candidates.length?'OFFICIAL_STATIC_LINKS':'NO_QUALIFIED_STATIC_FINANCIAL_LINK',discoveryQualified:candidates.length>0,currentDiscovery:candidates.length?'OFFICIAL_LINK_CANDIDATES':'DISCOVERY_UNQUALIFIED'};
     }
    }else if(source.role==='SEC_INDEX'){
     // Index access is recorded separately; never count it as a retrieved financial document.
     assessment={...assessment,detail:'INDEX_ONLY_NOT_FINANCIAL_DOCUMENT'};
    }
   }catch{assessment={...assessment,result:'LAYOUT_UNSUPPORTED',detail:'CONTENT_OR_SCHEMA_UNSUPPORTED'};}
  }else if(fetched.status==='ACCESS_BLOCKED')assessment={...assessment,result:'ACCESS_BLOCKED',detail:fetched.attempted===false?'HOST_ALREADY_BLOCKED_NO_REPEAT':'HTTP_ACCESS_BLOCKED'};
  else if(fetched.status==='REJECTED'||/OFFICIAL|DELEGATION|REDIRECT|SEC_ISSUER/.test(fetched.error??''))assessment={...assessment,result:'REDIRECT_REJECTED',detail:'OFFICIAL_HOST_POLICY_REJECTED'};
  else if(/abort|timeout/i.test(fetched.error??''))assessment={...assessment,result:'TIMEOUT',detail:'BOUNDED_TIMEOUT'};
  probes.push({company:source.company,family:source.family,role:source.role,kind:source.kind,url:source.url,expectedHash:source.sha256??null,actualHash:fetched.receipt?.sha256??null,byteCount:fetched.receipt?.byteSize??null,expectedPeriod:source.periodEnd??null,...assessment,manualSeed:source.manualSeed??false,candidates:candidates.map(({company,url,sourceId,publicationDate,periodEnd,status})=>({company,url,sourceId,publicationDate,periodEnd,status})),http:{attempted:exchanges.length>0,exchanges,latencyMs:Math.round(performance.now()-begin),retryAfter:fetched.retryAfter??null},newRawObject:fetched.receipt?.rawArtifactNew??false});
 }
 const states=companyStates(probes);
 const identity=probes.map(({http,newRawObject,...p})=>p);
 return {schemaVersion:version,baseSHA,asOf,runner:{type:runner,os:os.platform(),osVersion:os.release(),runtime:process.version,startedAt:start,endedAt:new Date(clock()).toISOString()},accessIdentity:hash(identity),economicIdentityGenerated:false,probes,companies:states,classification:classify(states),matrix:families.map(family=>({family,results:probes.filter(r=>r.family===family).map(({company,result,detail})=>({company,result,detail}))})),acceptedDataPromotion:false,productionModified:false,recognizedAiRevenue:'UNAVAILABLE',aiReturns:'NOT_IDENTIFIED'};
}
// CLI output can only go into the ignored refresh output directory or a system temporary directory.
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);const get=k=>args[args.indexOf(k)+1];
 for(const required of ['--runner','--as-of','--out'])if(!args.includes(required))throw Error('REQUIRED:'+required);
 const out=path.resolve(get('--out'));fs.mkdirSync(out,{recursive:true});const resolved=fs.realpathSync(out);
 const allowed=fs.realpathSync(os.tmpdir()),research=path.resolve(here,'../outputs');
 if(!(resolved.startsWith(allowed+path.sep)||resolved===research||resolved.startsWith(research+path.sep)))throw Error('OUTPUT_MUST_BE_IGNORED_OR_TEMPORARY');
 const seeds=args.includes('--seed-file')?JSON.parse(fs.readFileSync(get('--seed-file'))):[];
 const report=await qualify({runner:get('--runner'),asOf:get('--as-of'),cache:args.includes('--cache')?get('--cache'):process.env.WIL_AI_CAPEX_CACHE??path.join(os.homedir(),'Public/wil-ai-capex-cache'),seeds});
 fs.writeFileSync(path.join(resolved,'access-report.json'),bytes(report));
 console.log(JSON.stringify({runner:report.runner.type,classification:report.classification,companies:report.companies},null,2));
}
