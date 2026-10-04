import { contentHash } from './core.mjs'
const ORDER=['NEW_OBSERVATION','REVISION_DRIVEN_CHANGE','RULE_CHANGE','STATUS_CHANGE','CONTEXT_CHANGE','INITIAL','UNCHANGED']
const rawValues=l=>(l?.inputObservations||[]).map(p=>({period:p.observationPeriod,value:p.value}))
function records(artifact,ids) {
 const map=new Map(artifact.lineage.map(l=>[l.id,l])),seen=new Set()
 function add(id){if(seen.has(id))return;seen.add(id);for(const op of map.get(id)?.operandEvidenceIds||[])add(op)}
 ids.forEach(add)
 return [...seen].sort().map(id=>map.get(id)).filter(Boolean)
}
const equal=(a,b)=>contentHash(a)===contentHash(b)
const identityFields=['id','datasetId','snapshotPath','snapshotSha256','rawSha256','inputVintageId','parserVersion','sourceMethodologyId']
function inputIdentities(artifact,lineage) {
 const inputs=new Map(artifact.inputs.map(s=>[s.id,s]))
 const ids=[...new Set(lineage.map(l=>l.snapshotId).filter(Boolean))].sort()
 return ids.map(id=>Object.fromEntries(identityFields.map(k=>[k,inputs.get(id)?.[k]??null])))
}
export function applyChangeAudit(output,priorArtifact=null) {
 for(const f of output.factors) {
  const prior=priorArtifact?.factors.find(p=>p.factorId===f.factorId)
  if(!prior)continue
  const reasons=[],currentPrimary=records(output,f.evidence),oldPrimary=records(priorArtifact,prior.evidence)
  if(f.observationThrough&&prior.observationThrough&&f.observationThrough.label!==prior.observationThrough.label)reasons.push('NEW_OBSERVATION')
  else if(f.evidence.length&&prior.evidence.length&&!equal(currentPrimary.map(rawValues),oldPrimary.map(rawValues)))reasons.push('REVISION_DRIVEN_CHANGE')
  if(f.ruleVersion!==prior.ruleVersion)reasons.push('RULE_CHANGE')
  // Existing STATUS_CHANGE covers quality/availability/input-vintage changes;
  // frozen schema vocabulary is preserved. Diagnostics retain their specifics.
  const statusFields=['direction','dataStatus','confidence','qualityReasons','sourceStatuses','availabilityBasis','alignment','missingContext']
  const timingFields=['snapshotId','snapshotSha256','inputVintageId','sourceUpdatedAt','retrievedAt','firstSeenAt','snapshotAcceptedAt','availableAt','validUntil','validUntilInclusive','freshnessState','revisionEventIds']
  const timing=l=>({...Object.fromEntries(timingFields.map(k=>[k,l[k]])),operands:l.inputObservations.map(p=>({availableAt:p.availableAt,availabilityBasis:p.availabilityBasis,releasePublishedAt:p.releasePublishedAt,revisionEventIds:p.revisionEventIds}))})
  const currentInputs=inputIdentities(output,records(output,[...f.evidence,...f.context])),oldInputs=inputIdentities(priorArtifact,records(priorArtifact,[...prior.evidence,...prior.context]))
  if(statusFields.some(k=>!equal(f[k],prior[k]))||!equal(currentPrimary.map(timing),oldPrimary.map(timing))||!equal(currentInputs,oldInputs))reasons.push('STATUS_CHANGE')
  if(!equal(records(output,f.context),records(priorArtifact,prior.context)))reasons.push('CONTEXT_CHANGE')
  f.changeReason=ORDER.filter(r=>reasons.includes(r))
  if(!f.changeReason.length)f.changeReason=['UNCHANGED']
  f.lastValidArtifactRef=prior.direction!=='INSUFFICIENT_DATA'?`sha256:${contentHash(priorArtifact)}#factor:${f.factorId}`:prior.lastValidArtifactRef
 }
 return output
}
