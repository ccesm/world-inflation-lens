import test from 'node:test'
import assert from 'node:assert/strict'
import { fixture,source,clone,independentDirectionValues,mutate,factor } from './helpers.mjs'
import { transformWindow,confirmedBand,scenarios,contentHash,serialize,dateAt,ordinal } from '../engine/core.mjs'
import { evaluate } from '../engine/engine.mjs'
import { validateArtifact } from '../engine/validation.mjs'
const seed=fixture()
for(const rule of seed.env.config.factors) {
 test(`FACTOR ${rule.id}: exact transform/direction/warmup/persistence in both signs`,()=>{
  for(const sign of [-1,1]){
   const points=independentDirectionValues(rule,3,sign),s={observations:points}
   const w=transformWindow(s,rule,seed.env.config,points.at(-1).date)
   assert.equal(w.direction,sign>0?rule.states.positive:rule.states.negative)
   assert.equal(w.transformed.length,rule.persistencePeriods)
   assert.equal(w.raw.length,rule.minimumContiguousPeriods)
   assert.equal(transformWindow({observations:points.slice(-(rule.minimumContiguousPeriods-1))},rule,seed.env.config,points.at(-1).date).error,'INCOMPLETE_CONTIGUOUS_WINDOW')
   const shortened=points.slice(-rule.minimumContiguousPeriods);shortened.splice(1,1)
   assert(transformWindow({observations:shortened},rule,seed.env.config,points.at(-1).date).error)
  }
  assert.equal(confirmedBand(Array(rule.persistencePeriods).fill(rule.entry),rule),rule.states.positive)
  assert.equal(confirmedBand(Array(rule.persistencePeriods).fill(-rule.entry),rule),rule.states.negative)
  assert.equal(confirmedBand(Array(rule.persistencePeriods).fill(rule.quiet),rule),'LITTLE_CHANGE')
  assert.equal(confirmedBand(Array(rule.persistencePeriods).fill(rule.entry-.000001),rule),'TRANSITION')
 })
 test(`FACTOR ${rule.id}: provenance/frequency/confidence/as-of and lineages`,()=>{
  const f=fixture(),o=evaluate(f.archive,f.env,f.request),assessment=factor(o,rule.id),record=o.lineage.find(l=>l.id===`primary:${rule.id}`)
  assert.equal(record.seriesId,rule.primarySeriesId);assert.equal(record.transform.id,rule.transformId);assert.equal(record.units,rule.expectedInputUnits);assert.equal(record.frequency,rule.frequency);assert.equal(assessment.evidence.length,1);assert.equal(assessment.confidence,'MEDIUM');assert.equal(assessment.ruleVersion,'signal-engine-v0.1-draft.1')
  assert(record.inputObservations.every(p=>Date.parse(p.availableAt)<=Date.parse(o.asOf)))
  assert(f.validate(o))
  const r=evaluate(f.archive,f.env,{...f.request,mode:'RECORDED_AS_OF',asOf:'2022-06-30T23:59:59.999Z'})
  assert.equal(factor(r,rule.id).direction,'INSUFFICIENT_DATA')
 })
}
test('PROPERTY seeded contiguous inputs always obey independently signed windows',()=>{
 let seed=73;const rnd=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/2**32}
 for(const r of seedRules())for(let i=0;i<25;i++){
  const entry=r.entry+(rnd()+.1)*10,quiet=r.quiet*(rnd()*.99),n=r.persistencePeriods
  assert.equal(confirmedBand(Array(n).fill(entry),r),r.states.positive)
  assert.equal(confirmedBand(Array(n).fill(-entry),r),r.states.negative)
  assert.equal(confirmedBand(Array(n).fill(quiet),r),'LITTLE_CHANGE')
 }
 function seedRules(){return seedContext.config.factors}
})
const seedContext=seed.env
test('PROPERTY every variant has declared parameters, independent hash and no optimization',()=>{
 const list=scenarios(seed.env.config);assert.equal(list.length,9);assert.equal(new Set(list.map(contentHash)).size,9)
 assert.equal(seed.env.config.sensitivity.chooseWinningVariant,false)
 for(const s of list){const o=evaluate(seed.archive,seed.env,seed.request,{scenario:s});assert.equal(o.ruleVersion,seed.env.config.ruleVersion);assert.equal(o.sensitivityScenario,s.id);assert(seed.validate(o))}
})
test('PROPERTY broken operands, dates, cycle, primary owner and pseudo-score rejected',()=>{
 const o=evaluate(seed.archive,seed.env,seed.request)
 for(const alter of [p=>p.lineage.find(l=>l.maintenanceType==='DERIVED').operandEvidenceIds=['absent'],p=>p.lineage.find(l=>l.maintenanceType==='DERIVED').operandEvidenceIds=[p.lineage.find(l=>l.maintenanceType==='DERIVED').id],p=>p.factors[0].evidence=p.factors[1].evidence,p=>p.domestic.score=73,p=>p.lineage.find(l=>l.id==='primary:inflation-persistence').inputObservations.at(-1).availableAt='2026-10-04T00:00:00Z']){
  const broken=clone(o);alter(broken);assert.throws(()=>seed.validate(broken))
 }
})
test('PROPERTY retrospective first observation endpoints are exact warmups',()=>{
 const starts={'inflation-persistence':['1959-01','1960-06'],'observed-productivity':['1947-01','1948-04'],'supply-chain-pressure':['1997-09','1998-03'],'policy-rate-direction':['1954-07','1954-11'],'reserve-share':['2000-01','2002-04'],'foreign-treasury-holdings':['2020-01','2021-03'],'offshore-usd-credit':['2000-01','2001-04']}
 for(const r of seed.env.config.factors){const [start,want]=starts[r.id];assert.equal(dateAt(ordinal(start,r.frequency)+r.minimumContiguousPeriods-1,r.frequency),want)}
})
