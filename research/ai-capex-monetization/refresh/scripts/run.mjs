import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {load} from '../../quarterly/scripts/io.mjs';
import {bytes,hash,date} from '../../scripts/contract.mjs';
import {evaluate} from '../../monitor/scripts/monitor.mjs';
import {SafeFetcher,cacheObject,writeReceipt} from './fetch.mjs';
import {submissions,archiveLinks,detectSourceChanges} from './discovery.mjs';
import {qualifySource,bindDefinitions,validateRows,selectQuarter,qualifyQuarter,detectRestatements,timestamp} from './qualify.mjs';
import {candidateMonitor,candidatePreview,validateCandidate,promotionGate} from './monitor.mjs';
import {companies,issuers,limits,optionalFamilies,version,baseCommit,acceptedThrough} from './config.mjs';
export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function physical(target){let ancestor=target;while(!fs.existsSync(ancestor))ancestor=path.dirname(ancestor);return path.join(fs.realpathSync(ancestor),path.relative(ancestor,target));}
function read(file){return JSON.parse(fs.readFileSync(file,'utf8'));}
function atomic(file,value){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.tmp',bytes(value));fs.renameSync(file+'.tmp',file);}
export function parseNative(source,cache,{python=process.env.WIL_AI_CAPEX_PYTHON??'python3',out}={}){
 fs.mkdirSync(out,{recursive:true});const manifest=path.join(out,source.sourceId+'.source.json'),output=path.join(out,source.sourceId+'.extraction.json');
 fs.writeFileSync(manifest,bytes(source));const p=spawnSync(python,[path.join(root,'scripts/extract.py'),manifest,cache,output],{encoding:'utf8',timeout:60000,maxBuffer:1000000});
 if(p.status!==0||!fs.existsSync(output))return {source,observations:[],events:[],reviewItems:[{type:'PARSER_UNAVAILABLE_OR_FAILED',status:'REVIEW_REQUIRED',detail:p.error?.code??'PYTHON_DEPENDENCY_OR_LAYOUT'}]};
 return read(output);
}
function economicSource(s){const {retrievedAt,status,retrievalResult,rawArtifactNew,...content}=s;return content;}
export async function refresh({cache=process.env.WIL_AI_CAPEX_CACHE??path.join(os.homedir(),'Public/wil-ai-capex-cache'),out=path.join(root,'outputs'),asOf,clock=()=>Date.now(),fetcher,parser=parseNative,maxDocuments=limits.maxDocuments,checkKnown=false}={}){
 if(!Number.isInteger(maxDocuments)||maxDocuments<1||maxDocuments>40)throw Error('DOCUMENT_BUDGET');
 date(asOf);const startedAt=new Date(clock()).toISOString();timestamp(startedAt);
 if(startedAt.slice(0,10)>asOf)throw Error('EXPLICIT_CLOCK_PRECEDES_RUN');
 cache=physical(path.resolve(cache));out=physical(path.resolve(out));const repository=fs.realpathSync(path.resolve(root,'../../..'));const outputRoot=physical(path.join(root,'outputs'));const tempRoot=fs.realpathSync(os.tmpdir());
 if(cache===repository||cache.startsWith(repository+path.sep))throw Error('RAW_CACHE_MUST_BE_EXTERNAL');
 if(out!==outputRoot&&!out.startsWith(outputRoot+path.sep)&&!out.startsWith(tempRoot+path.sep)&&!out.startsWith('/private/tmp/'))throw Error('RESEARCH_OUTPUT_PATH_ONLY');
 const data=load(),accepted=evaluate(data),inputBefore=hash(data),previousPath=path.join(out,'current.json'),previous=fs.existsSync(previousPath)?read(previousPath):null;
 const runId=randomUUID(),runDir=path.join(out,'runs',runId);fs.mkdirSync(runDir,{recursive:true});
 const fetch=new SafeFetcher({cache,clock,fetcher}),companyResults=[],receiptRows=[],candidateSources=[],candidateQuarters=[],allEvents=[],allChanges=[];
 if(previous&&!/^[a-f0-9]{64}$/.test(previous.resultHash))throw Error('LAST_VALID_POINTER_IDENTITY');
 const previousSources=previous?read(path.join(out,'generations',previous.resultHash,'source-manifest.json')):[];
 if(previous){const artifact=read(path.join(out,'generations',previous.resultHash,'candidate-monitor.json'));if(hash(artifact.content)!==previous.resultHash||artifact.resultHash!==previous.resultHash)throw Error('LAST_VALID_CANDIDATE_CORRUPTION');}
 for(const company of companies){
  const discovery=[],families={},issues=[];
  // Independent source families, independently retained company results.
  for(const family of ['SEC_FILINGS','IR_ARCHIVE']){
   const source={company,sourceId:company.toLowerCase()+'-'+family.toLowerCase(),url:family==='SEC_FILINGS'?`https://data.sec.gov/submissions/CIK${issuers[company].cik}.json`:issuers[company].archive,documentType:'DISCOVERY_INDEX'};
   const response=await fetch.get(source);
   receiptRows.push({company,sourceId:source.sourceId,url:source.url,documentType:'DISCOVERY_INDEX',fetchResult:response.status,attempted:response.attempted??true,newRawArtifact:response.receipt?.rawArtifactNew??false,rawHash:response.receipt?.sha256??null,candidateStatus:response.status==='FETCHED'?'DISCOVERED':response.status});
   if(response.status!=='FETCHED'){families[family]={status:response.status,detail:response.error??response.httpStatus};continue;}
   writeReceipt(cache,runId,response.receipt);
   try{
    const found=family==='SEC_FILINGS'?submissions(company,JSON.parse(response.raw),{asOf,known:data.input.sources}):archiveLinks(company,response.raw.toString('utf8'),source.url);
    discovery.push(...found);families[family]={status:found.length?'DISCOVERED':family==='IR_ARCHIVE'?'REVIEW_REQUIRED':'NO_NEW_DISCLOSURE',count:found.length,rawHash:response.receipt.sha256};
   }catch(e){families[family]={status:'REVIEW_REQUIRED',detail:e.message};}
  }
  const unique=[...new Map(discovery.map(s=>[s.url,s])).values()];
  if(checkKnown)for(const s of data.input.sources.filter(s=>s.company===company&&s.periodEnd==='2026-06-30'))if(!unique.some(u=>u.url===s.url))unique.push({...s,status:'DISCOVERED'});
  const sources=[],rows=[],events=[];
  if(unique.length>maxDocuments)issues.push({type:'DOCUMENT_BUDGET_EXCEEDED',status:'REVIEW_REQUIRED',discovered:unique.length,processed:maxDocuments});
  for(const descriptor of unique.slice(0,maxDocuments)){
   const known=data.input.sources.find(s=>s.url===descriptor.url);
   const previousSource=previousSources.find(s=>s.url===descriptor.url);
   let result;
   if(!checkKnown&&(known||previousSource)){
    const s=known??previousSource;
    try{cacheObject(cache,s.sha256,s.byteSize);receiptRows.push({company,sourceId:s.sourceId,sourceAlreadyKnown:true,newRawArtifact:false,hashChanged:false,fetchResult:'CACHE_VALIDATED',candidateStatus:'NO_NEW_DISCLOSURE'});continue;}catch{ /* missing/corrupt identity never silently reused */ }
   }
   result=await fetch.get(descriptor);
   if(result.status!=='FETCHED'){receiptRows.push({company,sourceId:descriptor.sourceId,fetchResult:result.status,candidateStatus:result.status,error:result.error??null});continue;}
   const receipt=result.receipt;writeReceipt(cache,runId,receipt);
   const changed=detectSourceChanges(descriptor,receipt,data.input.sources,previousSources);
   receiptRows.push({company,sourceId:descriptor.sourceId,url:descriptor.url,sourceAlreadyKnown:!!known,newRawArtifact:receipt.rawArtifactNew,hashChanged:!!known&&known.sha256!==receipt.sha256,fetchResult:'FETCHED',candidateFilingPeriod:descriptor.periodEnd,candidatePublicationDate:descriptor.publicationDate,candidateStatus:'FETCHED',lifecycle:['DISCOVERED','FETCHED']});
   if(known?.sha256===receipt.sha256)continue;
   const source={...descriptor,...receipt,publisher:issuers[company].name,status:'RETRIEVED',locator:'native disclosure',periodEnd:descriptor.periodEnd,publicationDate:descriptor.publicationDate};
   let extraction;try{extraction=await parser(source,cache,{out:path.join(runDir,'extractions')});}catch(e){issues.push({sourceId:source.sourceId,type:'PARSER_REVIEW_REQUIRED',status:'REVIEW_REQUIRED',error:e.message});candidateSources.push(economicSource(source));continue;}
   const parsedSource=extraction.source??source;candidateSources.push(economicSource(source));const item=receiptRows.at(-1);item.lifecycle.push('PARSED');item.candidateStatus='PARSED';
   try{
    for(const k of ['company','sourceId','url','sha256','byteSize','publisher','accession','documentType','retrievedAt'])if(parsedSource[k]!==source[k])throw Error('PARSER_SOURCE_IDENTITY');
    qualifySource(parsedSource,cache,asOf);candidateSources[candidateSources.length-1]=economicSource({...source,publicationDate:parsedSource.publicationDate,periodEnd:parsedSource.periodEnd,economicPeriod:parsedSource.periodEnd,publicationDateEvidence:parsedSource.publicationDateEvidence??null});const bound=bindDefinitions(extraction.observations??[],data.input.observations,data.definitions);
    validateRows(bound.rows,[parsedSource],data.definitions,asOf);item.lifecycle.push('VALIDATED');item.candidateStatus='VALIDATED';item.candidateFilingPeriod=parsedSource.periodEnd;item.candidatePublicationDate=parsedSource.publicationDate;sources.push(parsedSource);rows.push(...bound.rows);events.push(...(extraction.events??[]));issues.push(...changed,...bound.issues,...(extraction.reviewItems??[]));
   }catch(e){item.candidateStatus='REVIEW_REQUIRED';item.lifecycle.push('REVIEW_REQUIRED');issues.push({sourceId:descriptor.sourceId,type:e.message,status:'REVIEW_REQUIRED'});}
  }
  const restatements=detectRestatements(rows,data.input.observations);issues.push(...restatements);
  for(const end of [...new Set(rows.map(r=>r.periodEnd))].sort()){
   if(end<='2026-06-30')continue;
   const selection=selectQuarter(rows,company,end);
   const related=issues.filter(i=>!i.sourceId||sources.some(s=>s.sourceId===i.sourceId&&s.periodEnd===end));
   candidateQuarters.push(qualifyQuarter(company,end,selection.selected,{reviewItems:[...related,...selection.issues]}));
  }
  const relevant=candidateQuarters.filter(c=>c.company===company);
  const status=relevant.some(c=>c.status==='QUALIFIED_CANDIDATE')?'QUALIFIED_CANDIDATE':issues.length||events.length?'REVIEW_REQUIRED':Object.values(families).some(f=>f.status==='ACCESS_BLOCKED')?'ACCESS_BLOCKED':Object.values(families).some(f=>['FAILED_WITH_LAST_VALID','REVIEW_REQUIRED'].includes(f.status))?'FAILED_WITH_LAST_VALID':relevant.length?'REVIEW_REQUIRED':'NO_NEW_DISCLOSURE';
  for(const item of receiptRows.filter(r=>r.company===company&&r.lifecycle?.includes('VALIDATED'))){const q=relevant.find(c=>c.quarter===`${item.candidateFilingPeriod.slice(0,4)}Q${Number(item.candidateFilingPeriod.slice(5,7))/3}`);item.candidateStatus=q?.status??'REVIEW_REQUIRED';item.lifecycle.push(item.candidateStatus);}
  companyResults.push({company,status,lastValidAccepted:{quarter:acceptedThrough,monitorHash:accepted.resultHash},acceptedLatestQuarter:acceptedThrough,candidateLatestQuarter:relevant.map(c=>c.quarter).sort().at(-1)??null,sourceFamilies:families,coreMetricFamily:{status:relevant.at(-1)?.status??'CURRENT_ACCEPTED',missing:relevant.at(-1)?.core.missing??[],currentCandidate:false},metricFamilies:relevant.at(-1)?.optionalFamilies??Object.fromEntries(Object.keys(optionalFamilies).map(f=>[f,{status:'UNAVAILABLE',candidateOnly:true}])),reviewItems:issues});
  allEvents.push(...events);allChanges.push(...issues);
 }
 const extras={events:allEvents,sourceChanges:allChanges,sourceIdentities:candidateSources};let economic=null,preview=null;
 // NO_NEW_DISCLOSURE runs create receipts only, not another economic artifact.
 if(candidateQuarters.length||allChanges.length||allEvents.length){
  economic=candidateMonitor(data,candidateQuarters,extras);validateCandidate(economic,data,candidateQuarters,extras);preview=candidatePreview(data,economic);
  const directory=path.join(out,'generations',economic.resultHash),files={'candidate-monitor.json':economic,'candidate-public-preview.json':preview,'candidate-quarters.json':candidateQuarters,'source-manifest.json':candidateSources,'accepted-vs-candidate.json':{acceptedThrough,candidates:economic.content.qualification,latestByCompany:economic.content.latestByCompany},'source-manifest-diff.json':allChanges.filter(i=>/SOURCE|BYTES|FILING/.test(i.type)),'accounting-definition-diff.json':allChanges.filter(i=>/DEFINITION|POLICY|PRESENTATION|RESTATED/.test(i.type))};
  if(fs.existsSync(directory)){for(const [file,value]of Object.entries(files))if(fs.readFileSync(path.join(directory,file),'utf8')!==bytes(value))throw Error('IMMUTABLE_CANDIDATE_CORRUPTION');}
  else{fs.mkdirSync(path.dirname(directory),{recursive:true});const stage=fs.mkdtempSync(path.join(out,'generations','.stage-'));for(const [file,value]of Object.entries(files))fs.writeFileSync(path.join(stage,file),bytes(value));fs.renameSync(stage,directory);}
  atomic(previousPath,{resultHash:economic.resultHash,previewHash:preview.resultHash,status:'CANDIDATE_ONLY'});
 }
 if(hash(load())!==inputBefore)throw Error('ACCEPTED_INPUT_MODIFIED');
 const receipt={implementationVersion:version,baseCommit,runId,startedAt,endedAt:new Date(clock()).toISOString(),asOf,acceptedMonitorHash:accepted.resultHash,acceptedThrough,companyResults,disclosures:receiptRows,economicChange:!!economic&&economic.resultHash!==previous?.resultHash,resultHash:economic?.resultHash??previous?.resultHash??null,productionWritePerformed:false,emailEnabled:false,promotionPerformed:false};
 atomic(path.join(runDir,'refresh-receipt.json'),receipt);atomic(path.join(out,'latest-receipt.json'),receipt);return {receipt,economic,preview};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),value=k=>args[args.indexOf(k)+1],supported=new Set(['--as-of','--out','--cache','--max-documents','--check-known','--review-file']);
 for(let i=0;i<args.length;i++){if(!supported.has(args[i]))throw Error('UNKNOWN_OPTION');if(args[i]!=='--check-known')i++;}
 const result=await refresh({asOf:value('--as-of'),...(args.includes('--out')?{out:value('--out')}:{}),...(args.includes('--cache')?{cache:value('--cache')}:{}),...(args.includes('--max-documents')?{maxDocuments:Number(value('--max-documents'))}:{}),checkKnown:args.includes('--check-known')});
 if(args.includes('--review-file')){if(!result.economic)throw Error('NO_CANDIDATE_TO_REVIEW');promotionGate(read(value('--review-file')),result.economic);}
 console.log(bytes({companies:result.receipt.companyResults.map(({company,status,candidateLatestQuarter})=>({company,status,candidateLatestQuarter})),economicChange:result.receipt.economicChange,resultHash:result.receipt.resultHash,productionWritePerformed:false}));
}
