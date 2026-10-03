import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { loadContext,repo } from '../cli.mjs'
import { evaluate } from '../engine/engine.mjs'
import { validateArtifact } from '../engine/validation.mjs'
import { receipt } from '../engine/acceptance.mjs'
import { publisherEvidenceProven } from '../engine/metadata.mjs'
import { persistArtifact } from '../engine/storage.mjs'
import { serialize,contentHash,sha256,period } from '../engine/core.mjs'

// Clone the pinned real observations. These probes do not use the synthetic
// arithmetic generator or the output serializer to construct expected rules.
const ctx=loadContext(path.join(repo,'research/signal-engine/fixtures/repository-manifest.json'))
const ASOF=ctx.manifest.validationCompletedAt,FUTURE='2026-10-04T12:00:00.000Z'
const clone=x=>structuredClone(x)
const item=(f,id)=>f.archive.find(a=>a.series.some(s=>s.id===id))
const source=(f,id)=>item(f,id).series.find(s=>s.id===id)
const factor=(o,id)=>o.factors.find(f=>f.factorId===id)
const primary=(o,id)=>o.lineage.find(l=>l.id===`primary:${id}`)
const run=(f,options={})=>evaluate(f.archive,f.env,f.request,options)
const valid=(f,o,options={})=>validateArtifact(o,f.env.config,ctx.validator,{archive:f.archive,env:f.env,...options})
function fixture() {
 return {archive:clone(ctx.archive),env:{...clone(ctx.env),inputKind:'SYNTHETIC'},request:{mode:'RECORDED_AS_OF',asOf:ASOF,periodCutoff:null,evaluatedAt:ASOF}}
}
function acceptAt(a,t) {
 a.snapshot.firstSeenAt=t;a.snapshot.snapshotAcceptedAt=t;a.snapshot.acceptanceEvidenceRef='SECOND_REVIEW_FIXTURE_VALIDATION'
 a.snapshot.acceptanceRecord=receipt(a.snapshot,t)
}
function retained(f,id) {const old=clone(item(f,id));acceptAt(old,'2026-10-03T15:54:00.000Z');f.archive.push(old)}
function futureRevision(f,id) {
 const a=item(f,id),s=source(f,id)
 s.observations.at(-1).revisionEventIds=['second-pass-future-revision']
 a.snapshot.revisionEvents=[{id:'second-pass-future-revision',seriesId:id,snapshotSha256:a.snapshot.snapshotSha256,availableAt:FUTURE}]
}
for(const [id,fid]of [['TIC_TOTAL','foreign-treasury-holdings'],['GSCPI','supply-chain-pressure']]) {
 test(`SECOND R2/A ${id} retained vintage: future event cannot change earlier bytes/hash/audit`,()=>{
  const f=fixture();retained(f,id);const before=run(f);futureRevision(f,id);const after=run(f)
  assert.deepEqual(factor(after,fid),factor(before,fid));assert.equal(serialize(after),serialize(before));assert.equal(contentHash(after),contentHash(before))
  assert.deepEqual(primary(after,fid).revisionEventIds,[]);assert(valid(f,after))
 })
 test(`SECOND R2/A ${id} revision enters lineage/status only at its availability`,()=>{
  const f=fixture();retained(f,id);futureRevision(f,id);const early=run(f)
  f.request.asOf=FUTURE;f.request.evaluatedAt=FUTURE;const later=run(f,{priorArtifact:early})
  assert.equal(factor(later,fid).direction,factor(early,fid).direction)
  assert(primary(later,fid).revisionEventIds.includes('second-pass-future-revision'))
  assert(factor(later,fid).changeReason.includes('STATUS_CHANGE'));assert(!factor(later,fid).changeReason.includes('REVISION_DRIVEN_CHANGE'))
  assert(valid(f,later,{priorArtifact:early}))
 })
 test(`SECOND R2/A ${id} mixed eligible/ineligible events compare only eligible evidence`,()=>{
  const f=fixture();retained(f,id);const a=item(f,id),s=source(f,id)
  s.observations.at(-1).revisionEventIds=['eligible']
  a.snapshot.revisionEvents=[{id:'eligible',seriesId:id,snapshotSha256:a.snapshot.snapshotSha256,availableAt:ASOF}]
  const before=run(f);s.observations.at(-1).revisionEventIds.push('future')
  a.snapshot.revisionEvents.push({id:'future',seriesId:id,snapshotSha256:a.snapshot.snapshotSha256,availableAt:FUTURE})
  const after=run(f);assert.equal(serialize(after),serialize(before));assert.deepEqual(primary(after,fid).revisionEventIds,['eligible']);assert(valid(f,after))
 })
 test(`SECOND R2/A ${id} operational annotation is not an economic revision`,()=>{
  const f=fixture();retained(f,id);const before=run(f)
  source(f,id).observations.at(-1).futureOperationalAnnotation={availableAt:FUTURE,quality:'FAILED'}
  const after=run(f);assert.equal(serialize(after),serialize(before));assert(valid(f,after))
 })
}

for(const mode of ['CURRENT_SNAPSHOT','RECORDED_AS_OF','CURRENT_VINTAGE_RECONSTRUCTION']) {
 const f=fixture();f.request.mode=mode
 if(mode==='CURRENT_VINTAGE_RECONSTRUCTION'){f.request.asOf=null;f.request.periodCutoff=ASOF}
 const original=run(f),correct=mode==='CURRENT_VINTAGE_RECONSTRUCTION'?'NOT_RECONSTRUCTED':'PROJECT_ACCEPTED_SNAPSHOT'
 test(`SECOND R3/B ${mode} generates validated basis from supported evidence`,()=>{assert.equal(factor(original,'reserve-share').availabilityBasis,correct);assert(valid(f,original))})
 for(const claim of ['PROJECT_ACCEPTED_SNAPSHOT','CURRENT_SNAPSHOT','CURRENT_VINTAGE_RECONSTRUCTION','PUBLISHER_RELEASE_VINTAGE','UNKNOWN','NOT_RECONSTRUCTED'].filter(x=>x!==correct)) {
  test(`SECOND R3/B ${mode} rejects false factor-only ${claim}`,()=>{
   const bad=clone(original);factor(bad,'reserve-share').availabilityBasis=claim
   assert.throws(()=>valid(f,bad),/OUTPUT_SCHEMA_FAILED|ASSESSMENT_RULE_MISMATCH/)
  })
 }
}
test('SECOND R3/B unavailable current assessment cannot claim accepted primary evidence',()=>{
 const f=fixture();source(f,'COFER_USD').observations.at(-1).value=null;const o=run(f)
 assert.equal(factor(o,'reserve-share').availabilityBasis,'UNKNOWN');assert(valid(f,o))
 factor(o,'reserve-share').availabilityBasis='PROJECT_ACCEPTED_SNAPSHOT';assert.throws(()=>valid(f,o),/ASSESSMENT_RULE_MISMATCH/)
})

function highFixture() {
 const f=fixture(),a=item(f,'TIC_TOTAL'),s=source(f,'TIC_TOTAL')
 s.retrievedAt='2026-10-03T12:30:00.000Z'
 const proof={value:'2026-10-03T12:00:00.000Z',precision:'timestamp',timeZone:'UTC',evidenceRef:'second-pass-TIC-publication'}
 s.observations.forEach(p=>p.releasePublishedAt=clone(proof))
 a.snapshot.publisherEvidence=[{evidenceRef:proof.evidenceRef,seriesId:s.id,sourceUrl:s.sourceUrl,snapshotSha256:a.snapshot.snapshotSha256,inputCommit:a.snapshot.inputCommit,observationPeriods:s.observations.map(p=>p.date),publishedAt:proof.value,timeZone:proof.timeZone,availableAt:s.retrievedAt}]
 const old=clone(a);acceptAt(old,'2026-10-03T13:00:00.000Z');f.archive.push(old)
 return f
}
function coherentPublication(f,time) {
 source(f,'TIC_TOTAL').observations.forEach(p=>p.releasePublishedAt.value=time)
 item(f,'TIC_TOTAL').snapshot.publisherEvidence[0].publishedAt=time
}
function confidence(f) {const o=run(f);assert(valid(f,o));return factor(o,'foreign-treasury-holdings').confidence}
test('SECOND R4/C complete plausible full-window proof can qualify HIGH',()=>assert.equal(confidence(highFixture()),'HIGH'))
for(const [name,mutate]of Object.entries({
 'coherent 1990 backdating of full confirmation window':f=>coherentPublication(f,'1990-01-01T00:00:00.000Z'),
 'publication before observation month':f=>coherentPublication(f,'2026-06-30T23:59:59.999Z'),
 'publication one millisecond before month completes':f=>coherentPublication(f,'2026-07-31T23:59:59.998Z'),
 'future publication':f=>coherentPublication(f,FUTURE),
 'wrong period proof':f=>item(f,'TIC_TOTAL').snapshot.publisherEvidence[0].observationPeriods=['1990-01'],
 'single-period proof reused across confirmation window':f=>item(f,'TIC_TOTAL').snapshot.publisherEvidence[0].observationPeriods=[source(f,'TIC_TOTAL').observations.at(-1).date],
 'mixed valid and impossible observation proof':f=>{
  const a=item(f,'TIC_TOTAL'),p=source(f,'TIC_TOTAL').observations.at(-2)
  p.releasePublishedAt={...p.releasePublishedAt,evidenceRef:'backdated-one',value:'1990-01-01T00:00:00.000Z'}
  a.snapshot.publisherEvidence.push({...a.snapshot.publisherEvidence[0],evidenceRef:'backdated-one',publishedAt:p.releasePublishedAt.value,observationPeriods:[p.date]})
 }
}))test(`SECOND R4/C ${name} cannot qualify HIGH`,()=>{const f=highFixture();mutate(f);assert.notEqual(confidence(f),'HIGH')})
for(const time of ['2026-07-31T23:59:59.999Z','2026-08-01T00:00:00.000Z'])test(`SECOND R4/C completed month boundary ${time} permits otherwise valid HIGH`,()=>{const f=highFixture();coherentPublication(f,time);assert.equal(confidence(f),'HIGH')})
for(const [frequency,date,end]of [['quarterly','2026-04','2026-06-30T23:59:59.999Z'],['daily','2026-10-02','2026-10-02T23:59:59.999Z']]) {
 for(const offset of [-1,0,1])test(`SECOND R4/C ${frequency} publication boundary offset ${offset}ms`,()=>{
  const f=highFixture(),snapshot=item(f,'TIC_TOTAL').snapshot,s={id:'REVIEW_SERIES',frequency,sourceUrl:'https://example.invalid/review-fixture',retrievedAt:'2026-10-03T12:30:00.000Z'}
  const publishedAt=new Date(Date.parse(end)+offset).toISOString(),p={date,value:1,releasePublishedAt:{value:publishedAt,precision:'timestamp',timeZone:'UTC',evidenceRef:'boundary-proof'}}
  snapshot.publisherEvidence=[{evidenceRef:'boundary-proof',seriesId:s.id,sourceUrl:s.sourceUrl,snapshotSha256:snapshot.snapshotSha256,inputCommit:snapshot.inputCommit,observationPeriods:[date],publishedAt,timeZone:'UTC',availableAt:s.retrievedAt}]
  assert.equal(publisherEvidenceProven(s,p,snapshot,ASOF),offset>=0)
 })
}

function updateReceipt(s) {s.acceptanceEvidenceRef='SECOND_REVIEW_FIXTURE_VALIDATION';s.acceptanceRecord=receipt(s,s.snapshotAcceptedAt)}
const identityChanges={
 'A rawSha256 only':f=>item(f,'GSCPI').snapshot.rawSha256='a'.repeat(64),
 'B canonical hash only':f=>{const s=item(f,'GSCPI').snapshot;s.snapshotSha256='b'.repeat(64);updateReceipt(s)},
 'C raw bytes differ with equal parsed observations':f=>{
  const s=item(f,'GSCPI').snapshot,values=source(f,'GSCPI').observations
  const compact=JSON.stringify(values),pretty=JSON.stringify(values,null,2)
  assert.deepEqual(JSON.parse(compact),JSON.parse(pretty));assert.notEqual(sha256(compact),sha256(pretty));s.rawSha256=sha256(pretty)
 },
 'E source/vintage identity only':f=>{const s=item(f,'GSCPI').snapshot;s.inputVintageId+=':new-source-vintage';updateReceipt(s)}
}
for(const [name,mutate]of Object.entries(identityChanges))test(`SECOND R5/D ${name} is non-directional STATUS_CHANGE`,()=>{
 const f=fixture(),before=run(f);mutate(f);const after=run(f,{priorArtifact:before}),a=factor(after,'supply-chain-pressure'),b=factor(before,'supply-chain-pressure')
 assert.equal(a.direction,b.direction);assert.equal(a.confidence,b.confidence);assert.deepEqual(primary(after,'supply-chain-pressure').transformedWindow,primary(before,'supply-chain-pressure').transformedWindow)
 assert(a.changeReason.includes('STATUS_CHANGE'));assert(!a.changeReason.includes('REVISION_DRIVEN_CHANGE'));assert.notEqual(contentHash(after),contentHash(before));assert(valid(f,after,{priorArtifact:before}))
})
test('SECOND R5/D D economic value change is REVISION_DRIVEN_CHANGE',()=>{
 const f=fixture(),before=run(f);source(f,'GSCPI').observations.at(-1).value+=.001
 const after=run(f,{priorArtifact:before});assert.equal(factor(after,'supply-chain-pressure').changeReason[0],'REVISION_DRIVEN_CHANGE');assert(valid(f,after,{priorArtifact:before}))
})
test('SECOND R5/D F execution timestamp only changes separate run metadata',async()=>{
 const f=fixture(),o=run(f),dir=fs.mkdtempSync(path.join(os.tmpdir(),'wil-second-clock-'))
 try{
  const a=persistArtifact(repo,o,path.join(dir,'first','current.json'),x=>valid(f,x))
  await new Promise(resolve=>setTimeout(resolve,5))
  const b=persistArtifact(repo,o,path.join(dir,'second','current.json'),x=>valid(f,x))
  assert.notEqual(JSON.parse(fs.readFileSync(a.runMetadataPath)).generationTimestamp,JSON.parse(fs.readFileSync(b.runMetadataPath)).generationTimestamp)
  assert.equal(a.payloadSha256,b.payloadSha256);assert.equal(fs.readFileSync(a.artifactPath,'utf8'),fs.readFileSync(b.artifactPath,'utf8'))
  const next=run(f,{priorArtifact:o});assert.deepEqual(factor(next,'supply-chain-pressure').changeReason,['UNCHANGED']);assert(valid(f,next,{priorArtifact:o}))
 }finally{fs.rmSync(dir,{recursive:true})}
})
test('SECOND R5/D context raw identity changes are audited without a factor vote',()=>{
 const f=fixture(),before=run(f);item(f,'GPR').snapshot.rawSha256='c'.repeat(64)
 const after=run(f,{priorArtifact:before});assert(factor(after,'supply-chain-pressure').changeReason.includes('STATUS_CHANGE'));assert.equal(factor(after,'supply-chain-pressure').evidence.length,1);assert.equal(factor(after,'supply-chain-pressure').direction,factor(before,'supply-chain-pressure').direction);assert(valid(f,after,{priorArtifact:before}))
})
test('SECOND R5/D unrelated dataset identity does not change a factor audit',()=>{
 const f=fixture(),before=run(f);item(f,'TIC_TOTAL').snapshot.rawSha256='d'.repeat(64)
 const after=run(f,{priorArtifact:before});assert.deepEqual(factor(after,'supply-chain-pressure').changeReason,['UNCHANGED']);assert(factor(after,'foreign-treasury-holdings').changeReason.includes('STATUS_CHANGE'));assert(valid(f,after,{priorArtifact:before}))
})

test('SECOND deterministic current output is identical in three fresh processes',()=>{
 const script="import {loadContext} from './research/signal-engine/cli.mjs';import {evaluate} from './research/signal-engine/engine/engine.mjs';import {serialize} from './research/signal-engine/engine/core.mjs';const c=loadContext('research/signal-engine/fixtures/repository-manifest.json'),t=c.manifest.validationCompletedAt,o=evaluate(c.archive,c.env,{mode:'CURRENT_SNAPSHOT',asOf:t,periodCutoff:null,evaluatedAt:t});c.validate(o);process.stdout.write(serialize(o));"
 const outputs=['UTC','America/Los_Angeles','Asia/Shanghai'].map(TZ=>execFileSync(process.execPath,['--input-type=module','-e',script],{cwd:repo,env:{...process.env,TZ},maxBuffer:4000000}))
 assert(outputs[0].equals(outputs[1]));assert(outputs[0].equals(outputs[2]));assert(!outputs[0].includes('generationTimestamp'))
 const o=JSON.parse(outputs[0]);assert.equal(o.ruleVersion,'signal-engine-v0.1-draft.1')
 assert.deepEqual(o.factors.map(f=>f.direction),['TRANSITION','OUTPUT_PER_HOUR_GROWING','TRANSITION','TRANSITION','USD_RESERVE_SHARE_FALLING','TRANSITION','OFFSHORE_USD_CREDIT_EXPANDING']);assert(o.factors.every(f=>f.confidence==='MEDIUM'))
})
