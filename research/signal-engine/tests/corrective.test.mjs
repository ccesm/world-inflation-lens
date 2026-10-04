import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fixture,source,factor,clone,rehash,acceptAt,ASOF } from './helpers.mjs'
import { loadContext,repo,requestFrom } from '../cli.mjs'
import { evaluate } from '../engine/engine.mjs'
import { loadArchive } from '../engine/inputs.mjs'
import { serialize,contentHash,instant } from '../engine/core.mjs'
const run=(f,options)=>evaluate(f.archive,f.env,f.request,options)
const item=(f,id)=>f.archive.find(a=>a.series.some(s=>s.id===id))
const ctx=loadContext(path.join(repo,'research/signal-engine/fixtures/repository-manifest.json'))
const actualRequest={mode:'CURRENT_SNAPSHOT',asOf:ASOF,periodCutoff:null,evaluatedAt:ASOF}

const acceptanceAttacks={
 'backdate acceptance only':(d,m)=>d.snapshotAcceptedAt='2022-06-30T12:00:00.000Z',
 'later first seen':d=>d.firstSeenAt='2026-10-04T12:00:00.000Z',
 'later validation':(d,m)=>m.validationCompletedAt='2026-10-04T12:00:00.000Z',
 'wrong snapshot hash':d=>d.snapshotSha256='1'.repeat(64),
 'wrong commit':d=>d.inputCommit='0'.repeat(40),
 'missing validation record':(d,m)=>delete m.validation,
 'missing completion proof':(d,m)=>delete m.validationCompletedAt,
 'wrong path identity':d=>d.snapshotPath='data/inflation/drivers.json'
}
for(const [name,attack]of Object.entries(acceptanceAttacks))test('ADVERSARIAL R1 '+name,()=>{
 const m=clone(ctx.manifest);attack(m.datasets.find(d=>d.seriesIds.includes('PCEPILFE')),m)
 assert.throws(()=>loadArchive(repo,m,ctx.env),/ACCEPTANCE|FIRST_SEEN|CHRONOLOGY/)
})
test('CORRECTIVE R1 valid retained receipt permits project replay at inclusive acceptance',()=>{
 const o=evaluate(ctx.archive,ctx.env,{...actualRequest,mode:'RECORDED_AS_OF'});assert(ctx.validate(o));assert(o.historicalAvailabilityClaim);assert(o.factors.every(f=>f.direction!=='INSUFFICIENT_DATA'))
})
test('ADVERSARIAL R1 receipt itself cannot change hash or commit identity',()=>{for(const key of ['snapshotSha256','inputCommit']){const f=fixture();item(f,'PCEPILFE').snapshot.acceptanceRecord[key]='0'.repeat(key==='inputCommit'?40:64);assert.throws(()=>run(f),/IDENTITY_MISMATCH/)}})

const FUTURE='2026-10-04T12:00:00.000Z'
const futureOverlays={
 'source probe':(f,a)=>a.snapshot.probe={completedAt:FUTURE,latestAvailableObservationDate:'2026-09'},
 'freshness check':(f,a)=>a.snapshot.check={completedAt:FUTURE,changed:false},
 'source updated event':(f,a)=>source(f,'PCEPILFE').metadataEvents=[{seriesId:'PCEPILFE',snapshotSha256:a.snapshot.snapshotSha256,availableAt:FUTURE,sourceUpdatedAt:FUTURE}],
 'revision event':(f,a)=>{const s=source(f,'PCEPILFE');s.observations.at(-1).revisionEventIds=['future-revision'];a.snapshot.revisionEvents=[{id:'future-revision',seriesId:s.id,snapshotSha256:a.snapshot.snapshotSha256,availableAt:FUTURE}]},
 'operational failure':(f,a)=>a.snapshot.refreshResult={completedAt:FUTURE,result:'FAILED'},
 'context metadata':(f,a)=>{const s=source(f,'GPR'),b=item(f,'GPR');s.metadataEvents=[{seriesId:s.id,snapshotSha256:b.snapshot.snapshotSha256,availableAt:FUTURE,sourceUpdatedAt:FUTURE}]}
}
for(const [name,attack]of Object.entries(futureOverlays))test('ADVERSARIAL R2 future '+name+' leaves earlier content/hash unchanged',()=>{
 const f=fixture();f.request.mode='RECORDED_AS_OF';const before=run(f);attack(f,item(f,'PCEPILFE'));const after=run(f);assert.equal(serialize(after),serialize(before));assert.equal(contentHash(after),contentHash(before));assert(f.validate(after))
})
test('ADVERSARIAL R2 future imputation values cannot alter quality or lineage',()=>{
 const f=fixture();f.request.mode='RECORDED_AS_OF';const s=source(f,'COFER_IMPUTED');s.observations.forEach(p=>{p.availableAt=FUTURE;p.value=0});const before=run(f);s.observations.forEach(p=>p.value=90);const after=run(f);assert.equal(serialize(after),serialize(before));assert(factor(after,'reserve-share').qualityReasons.includes('UNKNOWN_IMPUTATION'));assert(!factor(after,'reserve-share').qualityReasons.includes('IMPUTED_PRIMARY_MEASURE'));assert(!after.lineage.some(l=>l.seriesId==='COFER_IMPUTED'));assert(f.validate(after))
})
test('CORRECTIVE R2 legitimate probe becomes effective after evidence cutoff',()=>{
 const f=fixture(),a=item(f,'PCEPILFE');a.snapshot.probe={completedAt:FUTURE,latestAvailableObservationDate:'2026-09'};assert.notEqual(factor(run(f),'inflation-persistence').dataStatus,'SOURCE_UPDATED_NOT_YET_CAPTURED');f.request.asOf=FUTURE;f.request.evaluatedAt=FUTURE;const o=run(f);assert.equal(factor(o,'inflation-persistence').dataStatus,'SOURCE_UPDATED_NOT_YET_CAPTURED');assert(f.validate(o))
})
test('CORRECTIVE R2 eligible imputation quality has complete available lineage',()=>{
 const f=fixture(),s=source(f,'COFER_IMPUTED'),dates=source(f,'COFER_USD').observations.map(p=>p.date);s.observations=dates.map(date=>({date,value:5,availableAt:f.request.asOf}));rehash(f.archive);const o=run(f),r=o.lineage.find(l=>l.seriesId==='COFER_IMPUTED');assert(r);assert.equal(r.inputObservations.length,10);assert(r.inputObservations.every(p=>Date.parse(p.availableAt)<=Date.parse(o.asOf)));assert(factor(o,'reserve-share').qualityReasons.includes('IMPUTED_PRIMARY_MEASURE'));assert(f.validate(o))
})
test('ADVERSARIAL R2 unrecorded operational status is not as-of evidence',()=>{const f=fixture(),before=run(f);item(f,'PCEPILFE').snapshot.probe={latestAvailableObservationDate:'2026-09'};item(f,'PCEPILFE').snapshot.refreshResult='FAILED';assert.equal(serialize(run(f)),serialize(before))})

const mutations=JSON.parse(fs.readFileSync(path.join(repo,'research/signal-engine/fixtures/corrections/provenance-mutations.json')))
const current=evaluate(ctx.archive,ctx.env,actualRequest);assert(ctx.validate(current))
for(const mutation of mutations)test(`ADVERSARIAL R3 ${mutation.target}.${mutation.field} => ${mutation.rejection}`,()=>{
 const broken=clone(current),record=broken.lineage.find(l=>l.seriesId==='COFER_USD'),input=broken.inputs.find(s=>s.id===record.snapshotId);let target=mutation.target==='lineage'?record:mutation.target==='input'?input:broken
 const keys=mutation.field.split('.');for(const key of keys.slice(0,-1))target=target[key];target[keys.at(-1)]=mutation.value
 assert.throws(()=>ctx.validate(broken),new RegExp(mutation.rejection))
})

function highFixture(){
 const f=fixture(),a=item(f,'TIC_TOTAL'),s=source(f,'TIC_TOTAL');s.retrievedAt='2026-10-03T11:01:00Z'
 const t={value:'2026-10-03T11:00:00Z',precision:'timestamp',timeZone:'UTC',evidenceRef:'TIC-official-release'};s.observations.forEach(p=>p.releasePublishedAt=clone(t))
 a.snapshot.publisherEvidence=[{evidenceRef:t.evidenceRef,seriesId:s.id,sourceUrl:s.sourceUrl,inputCommit:a.snapshot.inputCommit,publishedAt:t.value,timeZone:t.timeZone,availableAt:'2026-10-03T11:01:00Z',observationPeriods:s.observations.map(p=>p.date)}]
 rehash(f.archive);const prior=clone(a);acceptAt(prior,'2026-10-03T11:30:00Z');f.archive.push(prior);return f
}
test('CORRECTIVE R4 valid complete publisher evidence and all other gates yields HIGH',()=>{const f=highFixture(),o=run(f);assert.equal(factor(o,'foreign-treasury-holdings').confidence,'HIGH');assert(f.validate(o))})
const confidenceAttacks={
 'missing timestamp':(t,r)=>delete t.value,
 'null timestamp':t=>t.value=null,
 'invalid timestamp':t=>t.value='2026-02-30T11:00:00Z',
 'missing timezone':t=>t.timeZone=null,
 'invalid timezone':t=>t.timeZone='Not/AZone',
 'future publisher release':(t,r)=>{t.value=FUTURE;r.publishedAt=FUTURE},
 'wrong source':(t,r)=>r.seriesId='COFER_USD',
 'wrong snapshot':(t,r)=>r.snapshotSha256='0'.repeat(64),
 'missing evidence source':t=>t.evidenceRef=null,
 'missing proof record':(t,r,a)=>a.snapshot.publisherEvidence=[],
 'contradictory retrieval chronology':(t,r,a,s)=>s.retrievedAt='2026-10-03T10:00:00Z',
 'uncertain publication date':t=>{t.value='2026-10-03';t.precision='date'},
 'future recorded proof':(t,r)=>r.availableAt=FUTURE
}
for(const [name,attack]of Object.entries(confidenceAttacks))test('ADVERSARIAL R4 '+name+' never yields HIGH',()=>{
 const f=highFixture(),a=item(f,'TIC_TOTAL'),s=source(f,'TIC_TOTAL');attack(s.observations.at(-1).releasePublishedAt,a.snapshot.publisherEvidence[0],a,s)
 const o=run(f);assert.notEqual(factor(o,'foreign-treasury-holdings').confidence,'HIGH');assert(f.validate(o))
})

function assertChange(f,mutate,reason){const prior=run(f);mutate();const o=run(f,{priorArtifact:prior});assert(factor(o,'supply-chain-pressure').changeReason.includes(reason));assert(f.validate(o,{priorArtifact:prior}));return {prior,o}}
test('CORRECTIVE R5 context raw value changes despite stable ID',()=>{const f=fixture();assertChange(f,()=>{source(f,'GPR').observations.at(-1).value+=100;rehash(f.archive)},'CONTEXT_CHANGE')})
test('CORRECTIVE R5 context vintage changes with unchanged value',()=>{const f=fixture();assertChange(f,()=>{item(f,'GPR').snapshot.rawSha256='2'.repeat(64);item(f,'GPR').snapshot.inputVintageId+=':new';item(f,'GPR').snapshot.acceptanceRecord.inputVintageId=item(f,'GPR').snapshot.inputVintageId},'CONTEXT_CHANGE')})
test('CORRECTIVE R5 primary same-period revision has priority',()=>{const f=fixture();const {o}=assertChange(f,()=>{source(f,'GSCPI').observations.at(-1).value+=.1;rehash(f.archive)},'REVISION_DRIVEN_CHANGE');assert.equal(factor(o,'supply-chain-pressure').changeReason[0],'REVISION_DRIVEN_CHANGE')})
test('CORRECTIVE R5 quality changes are STATUS_CHANGE under frozen vocabulary',()=>{const f=fixture();assertChange(f,()=>{f.archive.forEach(a=>a.series=a.series.filter(s=>s.id!=='GPR'));rehash(f.archive)},'STATUS_CHANGE')})
test('CORRECTIVE R5 availability metadata changes are audited',()=>{const f=fixture();assertChange(f,()=>{source(f,'GSCPI').observations.at(-1).availableAt='2026-10-03T13:00:00Z';rehash(f.archive)},'STATUS_CHANGE')})
test('CORRECTIVE R5 decomposition content/vintage changes are context changes without extra vote',()=>{const f=fixture(),prior=run(f);source(f,'BIS_USD_LOANS').observations.at(-4).value+=1;source(f,'BIS_USD_SECURITIES').observations.at(-4).value-=1;rehash(f.archive);const o=run(f,{priorArtifact:prior});assert(factor(o,'offshore-usd-credit').changeReason.includes('CONTEXT_CHANGE'));assert.equal(factor(o,'offshore-usd-credit').direction,factor(prior,'offshore-usd-credit').direction);assert.equal(factor(o,'offshore-usd-credit').evidence.length,1);assert(f.validate(o,{priorArtifact:prior}))})
test('CORRECTIVE R5 unavailable assessment retains last valid and recovery keeps chain',()=>{
 const f=fixture(),prior=run(f),s=source(f,'GSCPI'),value=s.observations.at(-1).value;s.observations.at(-1).value=null;rehash(f.archive);const unavailable=run(f,{priorArtifact:prior}),u=factor(unavailable,'supply-chain-pressure');assert.equal(u.direction,'INSUFFICIENT_DATA');assert.equal(u.confidence,'UNASSESSED');assert(u.changeReason.includes('STATUS_CHANGE'));assert(!u.changeReason.includes('INITIAL'));assert.equal(u.lastValidArtifactRef,`sha256:${contentHash(prior)}#factor:supply-chain-pressure`);assert(f.validate(unavailable,{priorArtifact:prior}));s.observations.at(-1).value=value;rehash(f.archive);const recovered=run(f,{priorArtifact:unavailable});assert.equal(factor(recovered,'supply-chain-pressure').lastValidArtifactRef,u.lastValidArtifactRef);assert.equal(factor(recovered,'supply-chain-pressure').direction,factor(prior,'supply-chain-pressure').direction);assert(f.validate(recovered,{priorArtifact:unavailable}))
})
test('CORRECTIVE R5 identical evidence has only UNCHANGED and traceable previous valid',()=>{const f=fixture(),prior=run(f),o=run(f,{priorArtifact:prior});assert.deepEqual(factor(o,'supply-chain-pressure').changeReason,['UNCHANGED']);assert(f.validate(o,{priorArtifact:prior}))})
test('ADVERSARIAL R5 fabricated last-valid link or change reason rejected',()=>{const f=fixture(),prior=run(f),o=run(f,{priorArtifact:prior});for(const change of [p=>factor(p,'supply-chain-pressure').lastValidArtifactRef='fake',p=>factor(p,'supply-chain-pressure').changeReason=['INITIAL']]){const bad=clone(o);change(bad);assert.throws(()=>f.validate(bad,{priorArtifact:prior}),/HISTORY_RULE_MISMATCH/)}})

for(const [date,valid]of [['2020-02-29',true],['2021-02-29',false],['2022-02-30',false],['2022-13-01',false],['2022-00-10',false],['2022-2-01',false]])test('CORRECTIVE R6 calendar '+date,()=>{const options={mode:'recorded-project','as-of':date,'evaluated-at':ASOF};if(valid)assert.equal(requestFrom(options).asOf,date+'T23:59:59.999Z');else assert.throws(()=>requestFrom(options))})
test('CORRECTIVE R6 invalid timestamp day/clock does not normalize',()=>{for(const value of ['2022-02-30T12:00:00Z','2022-01-01T24:00:00Z','2022-01-01T12:60:00Z'])assert.throws(()=>instant(value))})

const replayAttacks={
 'A prior period, future publication':f=>{const s=source(f,'PCEPILFE');s.observations.at(-1).releasePublishedAt={value:FUTURE,precision:'timestamp',timeZone:'UTC',evidenceRef:'future'}},
 'B accepted after cutoff':f=>acceptAt(item(f,'PCEPILFE'),FUTURE),
 'C future source probe':f=>item(f,'PCEPILFE').snapshot.probe={completedAt:FUTURE,latestAvailableObservationDate:'2026-09'},
 'D future revision event':f=>futureOverlays['revision event'](f,item(f,'PCEPILFE')),
 'E future imputation metadata':f=>source(f,'COFER_IMPUTED').observations.forEach(p=>p.availableAt=FUTURE),
 'F future first seen':f=>item(f,'PCEPILFE').snapshot.firstSeenAt=FUTURE,
 'G future validation':f=>item(f,'PCEPILFE').snapshot.acceptanceRecord.validationCompletedAt=FUTURE,
 'H fabricated earlier acceptance':f=>item(f,'PCEPILFE').snapshot.snapshotAcceptedAt='2022-06-30T12:00:00Z',
 'I future context metadata':f=>futureOverlays['context metadata'](f,item(f,'PCEPILFE')),
 'J mixed eligible/ineligible lineage':f=>{const o=run(f),bad=clone(o);bad.lineage.find(l=>l.seriesId==='PCEPILFE').inputObservations[0].availableAt=FUTURE;assert.throws(()=>f.validate(bad));return 'tested'}
}
for(const [name,attack]of Object.entries(replayAttacks))test('ADVERSARIAL REPLAY '+name,()=>{
 const f=fixture();f.request.mode='RECORDED_AS_OF';const before=run(f);let result
 try {if(attack(f)==='tested')return;result=run(f)}catch(e){assert.match(e.message,/CHRONOLOGY|FIRST_SEEN|EVIDENCE|IDENTITY|METADATA|VALIDATION/);return}
 assert(f.validate(result));for(const l of result.lineage)for(const p of l.inputObservations)assert(Date.parse(p.availableAt)<=Date.parse(result.asOf));if(['C','D','I'].includes(name[0]))assert.equal(serialize(result),serialize(before));if(name[0]==='A')assert(!result.lineage.some(l=>l.seriesId==='PCEPILFE'&&l.inputObservations.some(p=>p.releasePublishedAt.value===FUTURE)))
})
test('CORRECTIVE frozen current arithmetic and nine-variant sensitivity remain',()=>{assert.deepEqual(current.factors.map(f=>f.direction),['TRANSITION','OUTPUT_PER_HOUR_GROWING','TRANSITION','TRANSITION','USD_RESERVE_SHARE_FALLING','TRANSITION','OFFSHORE_USD_CREDIT_EXPANDING']);assert(current.factors.every(f=>f.confidence==='MEDIUM'));assert(factor(current,'supply-chain-pressure').qualityReasons.includes('PARAMETER_SENSITIVE'));assert(factor(current,'offshore-usd-credit').qualityReasons.includes('PARAMETER_SENSITIVE'))})
test('CORRECTIVE real-input fresh processes reproduce byte-identical deterministic payload',()=>{
 const script="import {loadContext} from './research/signal-engine/cli.mjs';import {evaluate} from './research/signal-engine/engine/engine.mjs';import {serialize} from './research/signal-engine/engine/core.mjs';const c=loadContext('research/signal-engine/fixtures/repository-manifest.json');const t=c.manifest.validationCompletedAt;process.stdout.write(serialize(evaluate(c.archive,c.env,{mode:'CURRENT_SNAPSHOT',asOf:t,evaluatedAt:t,periodCutoff:null})));"
 const a=execFileSync(process.execPath,['--input-type=module','-e',script],{cwd:repo}),b=execFileSync(process.execPath,['--input-type=module','-e',script],{cwd:repo,env:{...process.env,LANG:'zh_CN.UTF-8'}});assert.equal(a.toString(),b.toString());assert.equal(a.toString(),serialize(current))
})
test('ADVERSARIAL hash axes: snapshot identity changes; config/schema mutations rejected',()=>{
 const f=fixture(),a=run(f);source(f,'GSCPI').observations.at(-1).value+=.001;rehash(f.archive);assert.notEqual(contentHash(run(f)),contentHash(a));f.env.config.factors[0].entry=.31;assert.throws(()=>run(f),/MUTATED/);for(const key of ['ruleSha256','outputSchemaSha256']){const bad=clone(current);bad[key]='0'.repeat(64);assert.throws(()=>ctx.validate(bad),/MANIFEST_HASH_MISMATCH/)}
})
test('ADVERSARIAL R2 future parent artifact cannot change earlier recorded audit',()=>{const f=fixture(),prior=run(f);f.request.mode='RECORDED_AS_OF';f.request.asOf='2026-10-03T13:00:00Z';assert.throws(()=>run(f,{priorArtifact:prior}),/FUTURE_OR_UNPROVEN_PARENT/)})
test('CORRECTIVE R5 lag-operand availability is audited even when endpoint is unchanged',()=>{const f=fixture(),prior=run(f);source(f,'GSCPI').observations.at(-5).availableAt='2026-10-03T13:00:00Z';const o=run(f,{priorArtifact:prior});assert(factor(o,'supply-chain-pressure').changeReason.includes('STATUS_CHANGE'));assert(f.validate(o,{priorArtifact:prior}))})
test('ADVERSARIAL R3 semantic validation requires a pinned archive',async()=>{const {validateArtifact}=await import('../engine/validation.mjs');assert.throws(()=>validateArtifact(current,ctx.env.config,ctx.validator),/PINNED_ARCHIVE/)})
for(const key of ['sourceUpdatedAt','retrievedAt','reviewedAt'])test('ADVERSARIAL R2 contradictory future accepted-source '+key+' fails closed',()=>{const f=fixture();source(f,'PCEPILFE')[key]=FUTURE;assert.throws(()=>run(f),/METADATA_AFTER_SNAPSHOT_ACCEPTANCE/)})
test('ADVERSARIAL R4 evidence recorded before purported publication is not HIGH',()=>{const f=highFixture();item(f,'TIC_TOTAL').snapshot.publisherEvidence[0].availableAt='2026-10-03T10:00:00Z';const o=run(f);assert.notEqual(factor(o,'foreign-treasury-holdings').confidence,'HIGH');assert(f.validate(o))})
test('CORRECTIVE R5 retained CLI parent chain validates recursively and missing/forged history fails',async()=>{
 const {loadPriorArtifact}=await import('../cli.mjs'),{persistArtifact}=await import('../engine/storage.mjs'),os=await import('node:os');const f=fixture(),dir=fs.mkdtempSync(path.join(os.tmpdir(),'wil-signal-history-'));try{
 const a=run(f),b=run(f,{priorArtifact:a}),c=run(f,{priorArtifact:b});persistArtifact(repo,a,path.join(dir,'a.json'),f.validate);persistArtifact(repo,b,path.join(dir,'b.json'),o=>f.validate(o,{priorArtifact:a}));persistArtifact(repo,c,path.join(dir,'c.json'),o=>f.validate(o,{priorArtifact:b}));assert.equal(contentHash(loadPriorArtifact(path.join(dir,'c.json'),f)),contentHash(c));fs.unlinkSync(path.join(dir,'artifacts',contentHash(b)+'.json'));assert.throws(()=>loadPriorArtifact(path.join(dir,'c.json'),f),/MISSING_RETAINED_PARENT/);fs.writeFileSync(path.join(dir,'artifacts',contentHash(b)+'.json'),serialize({...b,parentArtifactRef:null}));assert.throws(()=>loadPriorArtifact(path.join(dir,'c.json'),f),/HISTORY_RULE_MISMATCH|PARENT_ARTIFACT_HASH/)
 }finally{fs.rmSync(dir,{recursive:true})}
})
test('CORRECTIVE R2 imputation becomes effective only after legitimate availability',()=>{const f=fixture(),s=source(f,'COFER_IMPUTED');s.observations=source(f,'COFER_USD').observations.map(p=>({date:p.date,value:5,availableAt:FUTURE}));rehash(f.archive);const earlier=run(f);assert(!factor(earlier,'reserve-share').qualityReasons.includes('IMPUTED_PRIMARY_MEASURE'));f.request.asOf=FUTURE;f.request.evaluatedAt=FUTURE;const later=run(f);assert(factor(later,'reserve-share').qualityReasons.includes('IMPUTED_PRIMARY_MEASURE'));assert(later.lineage.some(l=>l.seriesId==='COFER_IMPUTED'));assert(f.validate(later))})
test('CORRECTIVE R2 revision event enters lineage only after its availability',()=>{const f=fixture(),a=item(f,'PCEPILFE');futureOverlays['revision event'](f,a);const early=run(f);assert(!early.lineage.find(l=>l.seriesId==='PCEPILFE').revisionEventIds.includes('future-revision'));f.request.asOf=FUTURE;f.request.evaluatedAt=FUTURE;const late=run(f);assert(late.lineage.find(l=>l.seriesId==='PCEPILFE').revisionEventIds.includes('future-revision'));assert(f.validate(late))})
test('ADVERSARIAL R2 newly available metadata cannot describe a future vintage as the old snapshot',()=>{const f=fixture(),a=item(f,'PCEPILFE');futureOverlays['source updated event'](f,a);f.request.asOf=FUTURE;f.request.evaluatedAt=FUTURE;assert.throws(()=>run(f),/WRONG_VINTAGE_METADATA/)})
