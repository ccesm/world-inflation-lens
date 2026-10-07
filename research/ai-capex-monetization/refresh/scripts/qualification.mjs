// Explicit controlled qualification, not live disclosure and not promotion.
import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';
import {load} from '../../quarterly/scripts/io.mjs';import {bytes,hash} from '../../scripts/contract.mjs';
import {fixture} from '../tests/helpers.mjs';import {qualifyQuarter} from './qualify.mjs';import {candidateMonitor,candidatePreview} from './monitor.mjs';import {root} from './run.mjs';import {companies,version,baseCommit,accountingBase} from './config.mjs';
const protectedPaths=['src','public','data','.github','package.json','package-lock.json','research/signal-engine','research/ai-capex-monetization/quarterly','research/ai-capex-monetization/monitor'];const guard=spawnSync('git',['diff','--exit-code',baseCommit,'--',...protectedPaths],{encoding:'utf8'});if(guard.status!==0)throw Error('FROZEN_OR_PRODUCTION_PATH_CHANGED');
const python=process.env.WIL_AI_CAPEX_PYTHON??'python3';const logs=path.join(root,'outputs','qualification-logs');fs.mkdirSync(logs,{recursive:true});
const commands=[
 ['phase1',['node','--test','research/ai-capex-monetization/tests/foundation.test.mjs']],
 ['phase2a',['node','--test','research/ai-capex-monetization/quarterly/tests/panel.test.mjs']],
 ['phase2a1',['node','--test','research/ai-capex-monetization/quarterly/tests/repair.test.mjs']],
 ['phase2b',['node','--test','research/ai-capex-monetization/monitor/tests/monitor.test.mjs']],
 ['phase2d',['node','--test','research/ai-capex-monetization/refresh/tests/refresh.test.mjs']],
 ['phase2aPython',[python,'-m','unittest','discover','-s','research/ai-capex-monetization/quarterly/tests','-p','*_test.py']],
 ['phase2dPython',[python,'-m','unittest','discover','-s','research/ai-capex-monetization/refresh/tests','-p','*_test.py']],
 ['build',['npm','run','build']],['verify',['npm','run','verify']]
];
const results=[];
for(const [name,[command,...args]]of commands){const start=performance.now(),p=spawnSync(command,args,{encoding:'utf8',timeout:180000,maxBuffer:2000000});const text=p.stdout+p.stderr;fs.writeFileSync(path.join(logs,name+'.log'),text);const count=k=>Number(text.match(new RegExp('(?:ℹ |# )'+k+' (\\d+)'))?.[1]??0);results.push({name,passed:p.status===0,exitCode:p.status,tests:count('tests')||Number(text.match(/Ran (\d+) tests/)?.[1]??0),failures:count('fail'),skipped:count('skipped'),runtimeSeconds:Number(((performance.now()-start)/1000).toFixed(2))});console.log(name,p.status===0?'PASS':'FAIL');if(p.status!==0)throw Error('QUALIFICATION_FAILED:'+name);}
const data=load(),quarters=companies.map(c=>qualifyQuarter(c,'2026-09-30',fixture(c).rows)),a=candidateMonitor(data,quarters),b=candidateMonitor(data,quarters),preview=candidatePreview(data,a);
if(bytes(a)!==bytes(b))throw Error('DETERMINISM');
const synthetic=path.join(root,'outputs','controlled-fixture',a.resultHash);fs.mkdirSync(synthetic,{recursive:true});for(const [name,value]of [['candidate-monitor.json',a],['candidate-public-preview.json',preview]]){const file=path.join(synthetic,name);if(fs.existsSync(file)&&fs.readFileSync(file,'utf8')!==bytes(value))throw Error('IMMUTABLE_TEST_ARTIFACT');if(!fs.existsSync(file))fs.writeFileSync(file,bytes(value));}
const liveFile=path.join(root,'outputs/latest-receipt.json'),live=fs.existsSync(liveFile)?JSON.parse(fs.readFileSync(liveFile)):null;
const production=spawnSync('git',['rev-parse','origin/main'],{encoding:'utf8'}).stdout.trim();
const report={implementationVersion:version,baseCommit,accountingBase,productionMainReferenceObserved:production,productionModified:false,sourceAdapters:['SEC issuer submissions / direct filing','official IR static links / delegated CDN','Phase 2A native HTML/PDF helpers; ambiguous layouts review-only'],tests:results,
 liveDiscovery:live?{asOf:live.asOf,startedAt:live.startedAt,endedAt:live.endedAt,companyResults:live.companyResults,disclosures:live.disclosures,economicChange:live.economicChange,resultHash:live.resultHash}:null,
 controlledCandidate:{evidenceClass:'SYNTHETIC_TEST_FIXTURE_NOT_DISCOVERED',companies:quarters.map(({company,status,core,optionalFamilies})=>({company,status,core,optionalFamilies})),proposedQuarter:a.content.proposedHeadlineQuarter,sharedPublicQuarter:a.content.sharedPublicQuarter,monitorHash:a.resultHash,previewHash:preview.resultHash},
 determinism:{sameInputByteStable:true,freshProcess:'phase2d regression',economicIdentityExcludesRuntimeClockAndPaths:true},healthStates:['CURRENT_ACCEPTED','QUALIFIED_CANDIDATE','NO_NEW_DISCLOSURE','PARTIAL','REVIEW_REQUIRED','FAILED_WITH_LAST_VALID','ACCESS_BLOCKED','DEFINITION_BREAK','UNAVAILABLE'],
 acceptedInputHash:hash(data),recognizedAiRevenue:'UNAVAILABLE',aiReturns:'NOT_IDENTIFIED',noWorkflowAdded:true,scheduleEnabled:false,emailEnabled:false,secretsRequired:false,
 knownLimitations:['Current network SEC and three IR hosts denied access; no claim of complete live discovery or live candidate qualification.','Microsoft archive static response has no qualified links; JavaScript/API layout requires separately qualified discovery adapter.','Native quarterly HTML/PDF maps only; unsupported YTD/SEC custom contexts and workbook layouts require native extraction review.','Events/policy snippets are discovery candidates, not automatic financial measurements or approved definition changes.','Explicit same-vintage proof required for YTD subtraction; no inferred cross-filing compatibility.','Source schema supports recognized AI revenue only as a future separately qualified extension; current default remains unavailable.'],
 promotionReadiness:{status:'CONTROLLED_HUMAN_REVIEW_ONLY',researchOnly:true,allFourRequiredForHeadline:true,productionPromotionImplemented:false,decision:'READY FOR CONTROLLED QUARTERLY REFRESH PILOT'}};
fs.writeFileSync(path.join(root,'reports/quarterly-refresh-qualification.json'),bytes(report));
console.log('READY FOR CONTROLLED QUARTERLY REFRESH PILOT');
