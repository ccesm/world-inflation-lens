import fs from 'node:fs'
import path from 'node:path'
import { loadContext,repo } from '../cli.mjs'
import { compileOutputSchema,validateArtifact } from '../engine/validation.mjs'
import { contentHash,dateAt,ordinal,period } from '../engine/core.mjs'
import { receipt } from '../engine/acceptance.mjs'
import { metadataTimeEligible } from '../engine/metadata.mjs'
export const ASOF='2026-10-03T15:55:16.403Z'
export const request={mode:'CURRENT_SNAPSHOT',asOf:ASOF,periodCutoff:null,evaluatedAt:ASOF}
export const clone=value=>structuredClone(value)
const ctx=loadContext(path.join(repo,'research/signal-engine/fixtures/repository-manifest.json'))
export function fixture() {
 const archive=clone(ctx.archive),env=clone(ctx.env);env.inputKind='SYNTHETIC'
 for(const item of archive){acceptAt(item,'2026-10-03T12:00:00.000Z');for(const s of item.series){
  for(const key of ['sourceUpdatedAt','sourceUpdatedTime','retrievedAt','reviewedAt'])if(!metadataTimeEligible(s[key],'2026-10-02T12:00:00.000Z'))s[key]=typeof s[key]==='object'?{...s[key],value:'2026-10-02T11:00:00Z',precision:'timestamp'}:'2026-10-02T11:00:00Z'
  const factor=env.config.factors.find(f=>f.primarySeriesId===s.id)
  if(factor){const freq=factor.frequency,end=s.observations.at(-1).date,last=ordinal(end,freq),n=freq==='quarterly'?14:26;
   s.observations=Array.from({length:n},(_,i)=>({date:dateAt(last-n+1+i,freq),value:s.id==='COFER_USD'?60:s.id==='GSCPI'?2:s.id==='FEDFUNDS'?5:s.id==='BIS_USD_TOTAL'?100:100}))
  }
  if(['BIS_USD_LOANS','BIS_USD_SECURITIES'].includes(s.id)){const total=item.series.find(s=>s.id==='BIS_USD_TOTAL');s.observations=total.observations.map(p=>({...p,value:s.id==='BIS_USD_LOANS'?60:40}))}
 }}
 rehash(archive)
 return {archive,env,request:clone(request),validate:(o,options={})=>validateArtifact(o,env.config,ctx.validator,{archive,env,...options}),validator:ctx.validator}
}
export function acceptAt(item,time){item.snapshot.snapshotAcceptedAt=time;item.snapshot.firstSeenAt=time;item.snapshot.acceptanceEvidenceRef='SYNTHETIC_VALIDATION';item.snapshot.acceptanceRecord=receipt(item.snapshot,time);return item}
export function rehash(archive) {
 for(const item of archive){item.snapshot.snapshotSha256=contentHash(item.series);item.snapshot.id=`synthetic:${item.snapshot.datasetId}:${item.snapshot.snapshotSha256}`;item.snapshot.inputVintageId=item.snapshot.id;item.snapshot.acceptanceRecord=receipt(item.snapshot,item.snapshot.snapshotAcceptedAt);for(const record of [...(item.snapshot.publisherEvidence||[]),...(item.snapshot.revisionEvents||[]),...item.series.flatMap(s=>s.revisionEvents||[])])record.snapshotSha256=item.snapshot.snapshotSha256}
 return archive
}
export const source=(f,id)=>f.archive.flatMap(a=>a.series).find(s=>s.id===id)
export const factor=(o,id)=>o.factors.find(f=>f.factorId===id)
export function mutate(f,id,fn){fn(source(f,id));rehash(f.archive);return f}
export function independentDirectionValues(rule,n,sign) {
 const length=rule.minimumContiguousPeriods+n,frequency=rule.frequency,last=ordinal(frequency==='quarterly'?'2026-04':'2026-08',frequency)
 const points=Array.from({length},(_,i)=>({date:dateAt(last-length+1+i,frequency),value:100}))
 if(rule.transformId==='core_yoy_delta_3m')for(let i=0;i<length;i++)points[i].value=100*Math.exp(sign*.0008*i*i)
 else if(rule.transformId==='gscpi_mean_delta_3m')points.forEach((p,i)=>p.value=sign*i)
 else if(rule.transformId==='rate_delta_3m')points.forEach((p,i)=>p.value=5+sign*.3*i)
 else if(rule.transformId==='share_delta_8q')points.forEach((p,i)=>p.value=60+sign*.5*i)
 else points.forEach((p,i)=>p.value=100*Math.exp(sign*.05*i))
 return points
}
