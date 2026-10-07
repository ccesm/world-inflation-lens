import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {load,root as quarterlyRoot} from '../../quarterly/scripts/io.mjs';
import {bytes,hash} from '../../scripts/contract.mjs';
import {evaluate,validateMonitor,researchSummaries,implementationHash} from './monitor.mjs';
import {publicArtifact,validatePublic} from './public.mjs';
export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const inputFiles=fs.readdirSync(path.join(quarterlyRoot,'inputs')).filter(f=>f.endsWith('.json')).sort();
export function produce(data=load()){
 const monitor=evaluate(data),pub=publicArtifact(monitor);
 validatePublic(pub,monitor,data);
 const c=monitor.content;
 const identity={schemaVersion:'ai-capex-monitor-manifest-v0.1',baseCommit:c.baseCommit,ruleVersion:c.ruleVersion,
  inputHash:c.inputHash,panelHash:c.panelHash,configHash:c.configHash,implementationHash:implementationHash(),
  schemaHashes:Object.fromEntries(['monitor','public-snapshot'].map(name=>[name,hash(fs.readFileSync(path.join(root,'schemas',name+'.schema.draft.json'),'utf8'))])),
  resultHash:monitor.resultHash,publicProjectionHash:pub.resultHash,dataThrough:c.dataThrough,disclosureThrough:c.disclosureThrough,
  inputs:inputFiles.map(file=>({path:'research/ai-capex-monetization/quarterly/inputs/'+file,sha256:hash(fs.readFileSync(path.join(quarterlyRoot,'inputs',file),'utf8'))})),
  storage:'Full output files ignored; compact manifest, summaries and qualification retained in Git. No raw cache writes.'};
 return {monitor,pub,identity,summary:researchSummaries(monitor)};
}
export function compactSummary(result){
 const latest=result.monitor.content.latest.map(c=>({company:c.company,latestEconomicQuarter:c.latestEconomicQuarter,latestFinancialFiling:c.latestFinancialFiling,
  metrics:Object.fromEntries(Object.entries(c.metrics).map(([id,m])=>[id,{value:m.value,unit:m.unit??null,nativeLabel:m.nativeLabel??null,definitionVersion:m.definitionVersion??null,
   scope:m.scope??null,sourceId:m.sourceId??null,yoy:m.comparisons?.yoy??null,baseline2019:m.comparisons?.baseline2019??null,baseline2022:m.comparisons?.baseline2022??null}]))}));
 return {dataThrough:result.identity.dataThrough,disclosureThrough:result.identity.disclosureThrough,monitorHash:result.monitor.resultHash,latest,
  health:result.monitor.content.health,summaries:result.summary,guardrail:result.monitor.content.guardrail};
}
export function writeReports(result){
 fs.writeFileSync(path.join(root,'reports/current-summary.json'),bytes(compactSummary(result)));
 fs.writeFileSync(path.join(root,'reports/monitor-manifest.json'),bytes(result.identity));
}
// An immutable generation directory plus a replaceable pointer avoids partial output publication.
export function run({out=path.join(root,'outputs'),data=load(),injectFailure=false}={}){
 fs.mkdirSync(out,{recursive:true});
 const currentPath=path.join(out,'current.json');
 const previous=fs.existsSync(currentPath)?JSON.parse(fs.readFileSync(currentPath,'utf8')):null;
 try{
  if(injectFailure)throw Error('TEST_ONLY_EVALUATION_FAILURE');
  const result=produce(data);
  const generationId=hash(result.identity),directory=path.join(out,generationId);
  const state=previous?.resultHash===result.monitor.resultHash?'NO_NEW_DISCLOSURE':'CURRENT';
  if(!fs.existsSync(directory)){
   const staging=fs.mkdtempSync(path.join(out,'.staging-'));
   const c=result.monitor.content;
   const files={
    'monitor-quarterly-metrics.json':{schemaVersion:c.schemaVersion,records:c.records,missing:c.missing},
    'monitor-company-latest.json':c.latest,'monitor-monetization-events.json':c.events.filter(e=>e.monetizationEvidenceLevel!==null),
    'monitor-accounting-events.json':c.accounting,'monitor-capacity-events.json':c.events.filter(e=>['BACKLOG','CAPACITY_CONSTRAINT','CAPEX_COMPOSITION'].includes(e.kind)),
    'monitor-guidance.json':c.events.filter(e=>e.periodType==='GUIDANCE'),'monitor-comparability.json':c.comparability,
    'monitor-health.json':c.health,'monitor-summary.json':result.summary,'monitor-manifest.json':result.identity,
    'monitor-chart-contract.json':c.chartContract,'public-snapshot.draft.json':result.pub,'monitor.json':result.monitor};
   for(const [file,content]of Object.entries(files))fs.writeFileSync(path.join(staging,file),bytes(content));
   fs.renameSync(staging,directory);
  }else{
   // Existing history must not be silently overwritten or accepted after corruption.
   for(const [file,expected]of [['monitor.json',result.monitor],['public-snapshot.draft.json',result.pub],['monitor-manifest.json',result.identity]]){
    if(fs.readFileSync(path.join(directory,file),'utf8')!==bytes(expected))throw Error('IMMUTABLE_GENERATION_CORRUPTION');
   }
  }
  const pointer={generationId,relativeDirectory:generationId,resultHash:result.monitor.resultHash};
  fs.writeFileSync(currentPath+'.tmp',bytes(pointer));fs.renameSync(currentPath+'.tmp',currentPath);
  const status={state,lastValid: pointer,evaluatedAt:new Date().toISOString(),economicObservationThrough:'2026Q2'};
  fs.writeFileSync(path.join(out,'run-status.json'),bytes(status));
  return {state,...result,generationId};
 }catch(error){
  let lastValid=null;
  if(previous&&/^[a-f0-9]{64}$/.test(previous.generationId)&&previous.relativeDirectory===previous.generationId){
   try{const artifact=JSON.parse(fs.readFileSync(path.join(out,previous.generationId,'monitor.json'),'utf8'));validateMonitor(artifact,data);if(artifact.resultHash===previous.resultHash)lastValid=previous;}catch{}
  }
  const status={state:lastValid?'FAILED_WITH_LAST_VALID':'UNAVAILABLE',lastValid,evaluatedAt:new Date().toISOString(),errorCategory:error.message.split(':')[0]};
  fs.writeFileSync(path.join(out,'run-status.json'),bytes(status));throw error;
 }
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const outIndex=process.argv.indexOf('--out');
 const result=run({out:outIndex<0?undefined:process.argv[outIndex+1],injectFailure:process.argv.includes('--test-inject-failure')});
 if(process.argv.includes('--write-reports'))writeReports(result);
 console.log(JSON.stringify({state:result.state,resultHash:result.monitor.resultHash,publicHash:result.pub.resultHash,generationId:result.generationId}));
}
