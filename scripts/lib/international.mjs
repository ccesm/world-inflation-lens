import assert from 'node:assert/strict'
import { prepareCofer, validateCofer, compareCofer } from './international-cofer.mjs'
import { prepareTic, validateTic, compareTic } from './international-tic.mjs'
import { prepareBis, validateBisSnapshot, reviewBisRevisions } from './international-bis.mjs'
import { diffObservations, summarizeChanges } from './refresh.mjs'
export const internationalFiles={cofer:'reserve-composition',tic:'treasury-holdings',bis:'global-dollar-credit'}
export function validateInternational(bundles) {
 validateCofer(bundles.cofer);validateTic(bundles.tic);validateBisSnapshot(bundles.bis)
 return bundles
}
export function compareInternational(before,after) {
 validateInternational(before);validateInternational(after)
 compareCofer(before.cofer,after.cofer);compareTic(before.tic,after.tic)
 assert.equal(reviewBisRevisions(before.bis,after.bis).requiresReview,false,'BIS withdrawal / large historical revision requires manual review')
 return Object.keys(internationalFiles).flatMap(key=>after[key].series.map(s=>{
  const old=before[key].series.find(p=>p.id===s.id),changes=diffObservations(old.observations,s.observations)
  // Source flags/pre-break values are evidence too, even if the numeric level did not change.
  const oldByDate=new Map(old.observations.map(p=>[p.date,p]))
  for(const p of s.observations){const prior=oldByDate.get(p.date);if(prior&&prior.value===p.value&&(prior.sourceFlag!==p.sourceFlag||prior.sourcePreBreak!==p.sourcePreBreak)) changes.push({date:p.date,kind:'revised',before:p.value,after:p.value,beforeFlag:prior.sourceFlag??null,afterFlag:p.sourceFlag??null,beforePreBreak:prior.sourcePreBreak??null,afterPreBreak:p.sourcePreBreak??null})}
  return {...summarizeChanges(s.id,changes),changes}
 }))
}
export async function prepareInternational(options) {
 const [cofer,tic,bis]=await Promise.all([prepareCofer(options),prepareTic(options),prepareBis(options)])
 return validateInternational({cofer,tic,bis})
}
export function internationalSummary(bundles) {
 return {schemaVersion:1,series:['COFER_USD','TIC_TOTAL','BIS_USD_TOTAL'].map(id=>{
  const bundle=Object.values(bundles).find(d=>d.series.some(s=>s.id===id)),s=bundle.series.find(s=>s.id===id),last=s.observations.findLast(p=>Number.isFinite(p.value))
  const m=bundle.metadata
  return {id,units:s.units,frequency:s.frequency,observationDate:last.date,value:last.value,sourcePeriod:last.sourcePeriod||last.date,publisher:m.publisher,provider:m.provider,sourceUrl:s.sourceUrl||m.sourceUrl,sourceUpdatedAt:m.sourceUpdatedAt,sourceUpdatedTime:m.sourceUpdatedTime,retrievedAt:m.retrievedAt,denominator:s.denominator}
 })}
}
