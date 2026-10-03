import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { performance } from 'node:perf_hooks'
import { args,loadContext,repo,requestFrom,validateInvocation } from './cli.mjs'
import { evaluate } from './engine/engine.mjs'
import { scenarios,serialize,contentHash,sha256 } from './engine/core.mjs'
import { persistArtifact,offlinePath,atomicImmutable } from './engine/storage.mjs'
export const EPISODES=[
 {id:'inflation-and-disinflation-1970-1984',start:'1970-01',end:'1984-12'},
 {id:'commodity-cycle-2000-2007',start:'2000-01',end:'2007-12'},
 {id:'financial-crisis-2008-2009',start:'2008-01',end:'2009-12'},
 {id:'pandemic-2020',start:'2020-01',end:'2020-12'},
 {id:'inflation-2021-2022',start:'2021-01',end:'2022-12'},
 {id:'tightening-2022-2024',start:'2022-01',end:'2024-12'}
]
export function monthEnds(start,end) {const [sy,sm]=start.split('-').map(Number),[ey,em]=end.split('-').map(Number),out=[];for(let i=sy*12+sm-1;i<=ey*12+em-1;i++)out.push(new Date(Date.UTC(Math.floor(i/12),i%12+1,1)-1).toISOString());return out}
export function reportRow(o,payloadSha256,scenarioHash=null) {return {periodCutoff:o.periodCutoff,asOf:o.asOf,mode:o.mode,ruleVersion:o.ruleVersion,payloadSha256,scenario:o.sensitivityScenario,scenarioHash,factors:o.factors.map(f=>({factorId:f.factorId,state:f.direction,confidence:f.confidence,dataStatus:f.dataStatus,observationThrough:f.observationThrough,limitations:f.limitations,qualityReasons:f.qualityReasons,evidence:f.evidence})),domesticPattern:o.domestic.evidencePattern,internationalPattern:o.international.evidencePattern}}
export function sensitivityReport(ctx,request,{store=null}={}) {
 const start=performance.now(),base=evaluate(ctx.archive,ctx.env,request);ctx.validate(base)
 const rows=[]
 for(const s of scenarios(ctx.env.config)) {
  const o=evaluate(ctx.archive,ctx.env,request,{scenario:s});ctx.validate(o)
  const hash=sha256(serialize(o));if(store)store(o,hash)
  rows.push({...reportRow(o,hash,contentHash(s)),changedFactorIds:o.factors.filter((f,i)=>f.direction!==base.factors[i].direction).map(f=>f.factorId)})
 }
 return {schemaVersion:'offline-sensitivity-report/0.1',mode:request.mode,request,ruleVersion:ctx.env.config.ruleVersion,ruleSha256:ctx.env.ruleSha256,inputCommit:ctx.env.inputCommit,base:reportRow(base,sha256(serialize(base))),variants:rows,selection:'NONE — preregistered grid; no optimization',runtimeMs:performance.now()-start}
}
export function historicalReports(ctx,evaluatedAt,{store=null,onProgress=null,sensitivityAtEveryPeriod=true}={}) {
 const start=performance.now(),ends=monthEnds('1970-01','2024-12'),rows=[],sensitivityRows=[]
 for(let index=0;index<ends.length;index++) {
  const request={mode:'CURRENT_VINTAGE_RECONSTRUCTION',asOf:null,periodCutoff:ends[index],evaluatedAt},o=evaluate(ctx.archive,ctx.env,request);ctx.validate(o)
  const hash=sha256(serialize(o));if(store)store(o,hash);rows.push(reportRow(o,hash))
  if(sensitivityAtEveryPeriod)for(const scenario of scenarios(ctx.env.config)) {
   const variant=evaluate(ctx.archive,ctx.env,request,{scenario});ctx.validate(variant)
   const variantHash=sha256(serialize(variant));if(store)store(variant,variantHash)
   sensitivityRows.push({periodCutoff:ends[index],scenario:scenario.id,scenarioHash:contentHash(scenario),payloadSha256:variantHash,factors:variant.factors.map((f,i)=>({factorId:f.factorId,state:f.direction,changed:f.direction!==o.factors[i].direction,unavailable:f.direction==='INSUFFICIENT_DATA'}))})
  }
  if(index%24===0)onProgress?.({completed:index+1,total:ends.length,elapsedMs:performance.now()-start})
 }
 const episodes=EPISODES.map(episode=>{
  const relevant=rows.filter(r=>r.periodCutoff.slice(0,7)>=episode.start&&r.periodCutoff.slice(0,7)<=episode.end)
  return {...episode,monthlyEvaluations:relevant.length,factors:ctx.env.config.factors.map(rule=>{
   const assessments=relevant.map(r=>r.factors.find(f=>f.factorId===rule.id)),usable=assessments.filter(f=>f.state!=='INSUFFICIENT_DATA'),counts={}
   for(const f of assessments)counts[f.state]=(counts[f.state]||0)+1
   return {factorId:rule.id,usableMonthlyAssessments:usable.length,unavailableMonthlyAssessments:assessments.length-usable.length,firstUsablePeriod:relevant.find(r=>r.factors.some(f=>f.factorId===rule.id&&f.state!=='INSUFFICIENT_DATA'))?.periodCutoff||null,stateCounts:counts,limitations:['Quarterly readings retained at native frequency; monthly evaluations are not independent observations','Coverage/warmup exclusions retained; no target-answer tuning']}
  })}
 })
 return {schemaVersion:'offline-historical-report/0.1',mode:'CURRENT_VINTAGE_RECONSTRUCTION',historicalAvailabilityClaim:false,evaluatedAt,ruleVersion:ctx.env.config.ruleVersion,ruleSha256:ctx.env.ruleSha256,inputCommit:ctx.env.inputCommit,limitations:['Current revised history; not a real-time backtest','No original publisher-vintage availability reconstructed','All 660 chronological monthly endpoints included, including non-episode intervals'],episodes,chronology:rows,sensitivity:{selection:'NONE',periods:ends.length,variantsPerPeriod:9,rows:sensitivityRows},runtimeMs:performance.now()-start}
}
async function main() {
 const opts=args(process.argv.slice(2)),ctx=loadContext(opts.manifest)
 validateInvocation(opts,ctx.env)
 const request=requestFrom(opts),directory=path.resolve(opts.output)
 if(opts.command==='historical'&&(request.mode!=='CURRENT_VINTAGE_RECONSTRUCTION'||request.periodCutoff!=='2024-12-31T23:59:59.999Z'))throw Error('HISTORICAL_SUITE_REQUIRES_DECLARED_1970_2024_RECONSTRUCTION')
 offlinePath(repo,path.join(directory,'guard.json'));fs.mkdirSync(directory,{recursive:true})
 const generationStartedAt=new Date().toISOString(),artifactHashes=[]
 const store=(o,hash)=>{artifactHashes.push(hash);return atomicImmutable(path.join(directory,'artifacts',hash+'.json'),serialize(o))}
 const batchMetadata=()=>atomicImmutable(path.join(directory,'run-metadata.json'),JSON.stringify({schemaVersion:'offline-batch-run/0.1',generationStartedAt,generationTimestamp:new Date().toISOString(),artifactHashes,ruleVersion:ctx.env.config.ruleVersion,ruleSha256:ctx.env.ruleSha256,status:'SIGNAL_REPORT_SUCCESS'},null,2)+'\n')
 if(opts.command==='sensitivity') {
  const r=sensitivityReport(ctx,request,{store});atomicImmutable(path.join(directory,'sensitivity.json'),JSON.stringify(r,null,2)+'\n');batchMetadata();console.log(JSON.stringify({runtimeMs:r.runtimeMs,variants:r.variants.map(r=>({scenario:r.scenario,changed:r.changedFactorIds}))}));return
 }
 if(opts.command!=='historical')throw Error('Use sensitivity or historical')
 const report=historicalReports(ctx,request.evaluatedAt,{store,onProgress:progress=>console.log(JSON.stringify(progress)),sensitivityAtEveryPeriod:opts.sensitivity!=='false'})
 atomicImmutable(path.join(directory,'historical.json'),JSON.stringify(report,null,2)+'\n')
 batchMetadata();console.log(JSON.stringify({runtimeMs:report.runtimeMs,periods:report.chronology.length,sensitivityRuns:report.sensitivity.rows.length,episodes:report.episodes.map(e=>({id:e.id,coverage:e.factors.map(f=>[f.factorId,f.usableMonthlyAssessments])}))}))
}
if(process.argv[1]===fileURLToPath(import.meta.url))main().catch(e=>{console.error(`SIGNAL_REPORT_FAILED:${e.message}`);process.exitCode=1})
