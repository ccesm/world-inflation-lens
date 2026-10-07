import fs from 'node:fs';
import {hash,bytes,companies} from '../../scripts/contract.mjs';
import {evaluate,rules,ruleVersion} from '../../monitor/scripts/monitor.mjs';
import {publicArtifact} from '../../monitor/scripts/public.mjs';
import {comparisonBasis,compare,quarterOffset,ratio} from '../../monitor/scripts/metrics.mjs';
import {timestamp} from './qualify.mjs';
import {version,baseCommit,acceptedThrough} from './config.mjs';
export function candidateMonitor(data,candidates,{events=[],sourceChanges=[],sourceIdentities=[]}={}){
 const accepted=evaluate(data); // Always enforce frozen accepted identity before applying a separate overlay.
 const qualified=candidates.filter(c=>c.status==='QUALIFIED_CANDIDATE');
 const seen=new Set();for(const c of qualified){const key=c.company+'|'+c.quarter;if(seen.has(key))throw Error('DUPLICATE_COMPANY_QUARTER');seen.add(key);}
 const byId=new Map([...data.input.observations,...qualified.flatMap(c=>c.rows)].map(r=>[r.observationId,r]));
 const records=[];
 for(const c of qualified){
  const get=m=>c.rows.find(r=>r.metric===m),cashId=get('cashInvestmentIntensity')?.calculation.operandIds[0];
  const selected={cashPpeNative:byId.get(cashId),...Object.fromEntries(rules.metrics.filter(m=>m.native).map(m=>[m.id,get(m.native)]))};
  selected.pureDepreciationToRevenue=ratio(get('depreciationPpe'),get('revenue'),'pureDepreciationToRevenue',byId);
  selected.broadDaToRevenue=ratio(get('depreciationAmortizationOther'),get('revenue'),'broadDaToRevenue',byId);
  selected.cashPpeToPureDepreciation=ratio(byId.get(cashId),get('depreciationPpe'),'cashPpeToPureDepreciation',byId,{multiple:true,pure:true});
  for(const spec of rules.metrics){
   const row=selected[spec.id];
   if(!row){records.push({company:c.company,metric:spec.id,period:c.quarter,value:null,state:'UNAVAILABLE',reason:'NO_QUALIFIED_DISCLOSURE'});continue;}
   const policySensitive=c.reviewItems.some(i=>['USEFUL_LIFE_POLICY','LEASE_POLICY'].includes(i.type));
   records.push({...row,company:c.company,metric:spec.id,period:c.quarter,frequency:'QUARTERLY',basis:comparisonBasis(row,byId),policyAffected:policySensitive,policyReferences:[],status:'QUALIFIED_CANDIDATE'});
  }
 }
 const indexed=new Map([...accepted.content.records,...records].map(r=>[[r.company,r.metric,r.period].join('|'),r]));
 for(const r of records.filter(r=>r.value!==null)){
  r.comparisons={};for(const [name,period] of Object.entries({priorQuarter:quarterOffset(r.period,-1),yoy:quarterOffset(r.period,-4)}))r.comparisons[name]=compare(r,indexed.get([r.company,r.metric,period].join('|')),period);
 }
 // All four companies must share a qualified NEW quarter before headline advancement is even proposed.
 const common=[...new Set(qualified.map(c=>c.quarter))].filter(q=>q>acceptedThrough&&companies.every(company=>qualified.some(c=>c.company===company&&c.quarter===q))).sort().at(-1)??null;
 const content={schemaVersion:version,status:'CANDIDATE_MONITOR',notice:'NOT FOR PRODUCTION',baseCommit,ruleVersion,acceptedMonitorHash:accepted.resultHash,acceptedInputHash:hash(data),acceptedDataThrough:acceptedThrough,proposedHeadlineQuarter:common,sharedPublicQuarter:acceptedThrough,
  configHash:hash(rules),schemaHash:hash(fs.readFileSync(new URL('../schemas/candidate.schema.draft.json',import.meta.url),'utf8')),implementationHash:hash(['config.mjs','fetch.mjs','discovery.mjs','extract.py','qualify.mjs','monitor.mjs','run.mjs'].map(f=>[f,fs.readFileSync(new URL(f,import.meta.url),'utf8')])),candidateHash:hash(candidates),sourceIdentities,records,events,sourceChanges,
  latestByCompany:companies.map(company=>({company,acceptedLatestQuarter:acceptedThrough,candidateLatestQuarter:qualified.filter(c=>c.company===company).map(c=>c.quarter).sort().at(-1)??null})),
  qualification:candidates.map(({rows,...c})=>c),recognizedAiRevenue:{status:'UNAVAILABLE'},aiReturns:{status:'NOT_IDENTIFIED'},acceptedHistoryModified:false};
 return {content,resultHash:hash(content)};
}
export function candidatePreview(data,monitor){
 const accepted=publicArtifact(evaluate(data));
 const content={status:'NOT_FOR_PRODUCTION',acceptedPublicProjectionHash:accepted.resultHash,candidateMonitorHash:monitor.resultHash,acceptedDataThrough:acceptedThrough,proposedDataThrough:monitor.content.proposedHeadlineQuarter,acceptedProjection:accepted.content??accepted,
  candidateLatest:monitor.content.latestByCompany.map(c=>({...c,metrics:monitor.content.records.filter(r=>r.company===c.company&&r.period===c.candidateLatestQuarter)})),events:monitor.content.events,recognizedAiRevenue:{status:'UNAVAILABLE'},aiReturns:{status:'NOT_IDENTIFIED'}};
 return {content,resultHash:hash(content)};
}
export function validateCandidate(artifact,data,candidates,extras){if(bytes(artifact)!==bytes(candidateMonitor(data,candidates,extras)))throw Error('CANDIDATE_SEMANTIC_IDENTITY');return true;}
export function promotionGate(review,monitor){
 if(!review||review.reviewed!==true||!review.reviewer||!review.approvedAt||review.candidateMonitorHash!==monitor.resultHash||review.target!=='RESEARCH_ONLY')throw Error('EXPLICIT_REVIEW_REQUIRED');
 timestamp(review.approvedAt);if(monitor.content.sourceIdentities.some(s=>s.publicationDate>review.approvedAt.slice(0,10)))throw Error('REVIEW_BEFORE_DISCLOSURE');
 const q=monitor.content.proposedHeadlineQuarter;
 if(!q||!companies.every(c=>review.approvedCompanies?.includes(c)))throw Error('ALL_COMPANIES_REQUIRED');
 if(monitor.content.sourceChanges.length&&review.acknowledgedReviewItemsHash!==hash(monitor.content.sourceChanges))throw Error('REVIEW_ITEMS_NOT_ACKNOWLEDGED');
 if(monitor.content.qualification.some(c=>c.quarter===q&&c.status!=='QUALIFIED_CANDIDATE'))throw Error('UNRESOLVED_QUALIFICATION');
 return {status:'RESEARCH_PROMOTION_REVIEW_PASSED',target:'RESEARCH_ONLY',productionWritePerformed:false,accepted:false};
}
