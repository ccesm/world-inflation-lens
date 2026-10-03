import test from 'node:test'
import assert from 'node:assert/strict'
import { fixture,source,mutate,factor,clone } from './helpers.mjs'
import { evaluate } from '../engine/engine.mjs'
import { eligibility } from '../engine/alignment.mjs'
import { period,serialize,contentHash } from '../engine/core.mjs'
import { args,validateInvocation,requestFrom } from '../cli.mjs'
const run=f=>evaluate(f.archive,f.env,f.request)
test('REVIEW dataset break flags cannot silently enter BIS growth',()=>{const f=fixture();mutate(f,'BIS_USD_TOTAL',s=>s.observations.at(-2).sourceFlag='B');assert.equal(factor(run(f),'offshore-usd-credit').direction,'INSUFFICIENT_DATA')})
test('REVIEW blocked fresh-state diagnostics distinguish refresh/uncaptured/stale',()=>{for(const mode of ['failure','probe','stale']){const f=fixture(),snapshot=f.archive.find(a=>a.series.some(s=>s.id==='PCEPILFE')).snapshot;let want;if(mode==='failure'){snapshot.refreshResult='FAILED';want='REFRESH_FAILED'}if(mode==='probe'){snapshot.probe={latestAvailableObservationDate:'2026-09'};want='SOURCE_UPDATED_NOT_YET_CAPTURED'}if(mode==='stale'){f.request.asOf='2027-10-03T15:55:16.403Z';f.request.evaluatedAt=f.request.asOf;want='STALE'}const o=run(f);assert.equal(factor(o,'inflation-persistence').dataStatus,want);assert.equal(factor(o,'inflation-persistence').confidence,'UNASSESSED')}})
test('REVIEW healthy TRANSITION cannot be confused with absent primary',()=>{const f=fixture();mutate(f,'FEDFUNDS',s=>{s.observations.at(-1).value+=1});assert.equal(factor(run(f),'policy-rate-direction').direction,'TRANSITION');mutate(f,'FEDFUNDS',s=>s.observations.at(-1).value=null);assert.equal(factor(run(f),'policy-rate-direction').direction,'INSUFFICIENT_DATA')})
test('REVIEW derived availability resolves exact employment months',()=>{const o=run(fixture()),l=o.lineage.find(l=>l.seriesId==='REAL_GDP_WORKER'),ops=l.operandEvidenceIds.map(id=>o.lineage.find(l=>l.id===id));assert.equal(ops.length,4);assert.deepEqual(ops.slice(1).map(o=>o.observationPeriod.label),['2026-04','2026-05','2026-06']);assert.equal(l.availableAt,new Date(Math.max(...ops.map(o=>Date.parse(o.availableAt)))).toISOString())})
test('REVIEW retrospective unsupported period never becomes true replay',()=>{const f=fixture();const o=evaluate(f.archive,f.env,{mode:'CURRENT_VINTAGE_RECONSTRUCTION',asOf:null,periodCutoff:'1960-01-31T23:59:59.999Z',evaluatedAt:f.request.evaluatedAt});assert.equal(o.historicalAvailabilityClaim,false);assert.equal(factor(o,'inflation-persistence').direction,'INSUFFICIENT_DATA');assert.equal(factor(o,'inflation-persistence').dataStatus,'INSUFFICIENT_DATA');assert(f.validate(o))})
test('REVIEW CLI refuses unknown flags, ambiguous cutoffs and implicit rule/mode',()=>{
 const f=fixture(),options={manifest:'fixture',output:'offline',mode:'current','as-of':f.request.asOf,'evaluated-at':f.request.evaluatedAt,'rule-version':f.env.config.ruleVersion}
 assert.doesNotThrow(()=>validateInvocation(options,f.env))
 for(const change of [{mode:null},{'rule-version':null},{'rule-version':'signal-engine-v0.2'},{output:null}])assert.throws(()=>validateInvocation({...options,...change},f.env))
 assert.throws(()=>args(['evaluate','--typo','value']),/UNKNOWN_OPTION/)
 assert.throws(()=>args(['evaluate','--mode','current','--mode','recorded-project']),/DUPLICATE_OPTION/)
 assert.throws(()=>requestFrom({...options,'period-cutoff':'2022-06-30'}),/AMBIGUOUS/)
 assert.throws(()=>requestFrom({...options,'as-of':null,'period-cutoff':'2022-06-30'}),/UNEXPECTED/)
 assert.equal(requestFrom(options).mode,'CURRENT_SNAPSHOT')
})
