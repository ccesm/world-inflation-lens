import fs from 'node:fs'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { contentHash,transformWindow,confirmedBand,period,scenarios } from './core.mjs'
import { evaluate } from './engine.mjs'
import { selectArchive,pointAvailability,isRetrospective,cutoffOf } from './alignment.mjs'
import { validatePinnedInputs,validatePinnedRecord } from './provenance.mjs'
export function compileOutputSchema(schema) {const ajv=new Ajv2020({strict:false,allErrors:true});addFormats(ajv);return ajv.compile(schema)}
const sourcePeriodCache=new WeakMap()
export function validateArtifact(output,config,schemaValidator,{archive=null,env=null,priorArtifact=null}={}) {
 if(!archive||!env)throw Error('PINNED_ARCHIVE_AND_ENVIRONMENT_REQUIRED')
 if(!schemaValidator(output))throw Error(`OUTPUT_SCHEMA_FAILED:${JSON.stringify(schemaValidator.errors)}`)
 const ids=new Map(),snapshots=new Map(output.inputs.map(s=>[s.id,s])),factorIds=output.factors.map(f=>f.factorId)
 if(new Set(snapshots.keys()).size!==output.inputs.length)throw Error('DUPLICATE_SNAPSHOT')
 if(contentHash(factorIds)!==contentHash(config.factors.map(f=>f.id)))throw Error('FACTOR_SCOPE_MISMATCH')
 if(env)for(const key of ['ruleSha256','outputSchemaSha256','normativeDocumentHashes','contractCodeHashes'])if(contentHash(output[key])!==contentHash(env[key]))throw Error(`MANIFEST_HASH_MISMATCH:${key}`)
 const selected=archive?selectArchive(archive,output):[],sources=new Map()
 if(archive)validatePinnedInputs(output,selected,env)
 for(const item of selected)for(const source of item.series)sources.set(source.id,{source,snapshot:item.snapshot})
 for(const l of output.lineage) {
  if(ids.has(l.id))throw Error('DUPLICATE_LINEAGE_ID');ids.set(l.id,l)
  if(l.ruleId!==config.ruleVersion)throw Error('LINEAGE_RULE_MISMATCH')
  if(l.maintenanceType!=='DERIVED'){
   const s=snapshots.get(l.snapshotId);if(!s||s.snapshotSha256!==l.snapshotSha256||s.inputVintageId!==l.inputVintageId||s.snapshotAcceptedAt!==l.snapshotAcceptedAt)throw Error('BROKEN_SNAPSHOT_LINEAGE')
   if(!l.inputObservations.length)throw Error('MISSING_RAW_OBSERVATIONS')
   if(l.rawValue!==l.inputObservations.at(-1).value)throw Error('RAW_VALUE_MISMATCH')
   if(archive) {
    const src=sources.get(l.seriesId);if(!src||src.snapshot.id!==l.snapshotId)throw Error('WRONG_SELECTED_VINTAGE')
    validatePinnedRecord(l,src,output,config)
    let available=Object.isFrozen(src.source.observations)?sourcePeriodCache.get(src.source.observations):null
    if(!available){available=new Map(src.source.observations.map(p=>[period(p.date,src.source.frequency,p.sourcePeriod,src.source.periodBasis).label,p]));if(Object.isFrozen(src.source.observations))sourcePeriodCache.set(src.source.observations,available)}
    for(const p of l.inputObservations){const original=available.get(p.observationPeriod.label);if(!original||original.value!==p.value)throw Error('LINEAGE_VALUE_NOT_IN_SNAPSHOT');if(contentHash(p.observationPeriod)!==contentHash(period(original.date,src.source.frequency,original.sourcePeriod,src.source.periodBasis)))throw Error('PERIOD_SEMANTICS_MISMATCH');if(!isRetrospective(output)&&p.availableAt!==pointAvailability(src.source,original,src.snapshot))throw Error('AVAILABILITY_PROOF_MISMATCH')}
   }
   for(const p of l.inputObservations){if(p.observationPeriod.end&&Date.parse(p.observationPeriod.end)>Date.parse(cutoffOf(output)))throw Error('FUTURE_OBSERVATION');if(!isRetrospective(output)&&(!p.availableAt||Date.parse(p.availableAt)>Date.parse(output.asOf)||Date.parse(l.snapshotAcceptedAt)>Date.parse(output.asOf)))throw Error('FUTURE_OR_UNKNOWN_VALUE_VINTAGE')}
   if(l.dependencyRole==='PRIMARY_SIGNAL'&&!config.factors.some(f=>f.primarySeriesId===l.seriesId))throw Error('UNDECLARED_PRIMARY')
  }
 }
 const allowedVariants=scenarios(config);const scenario=output.sensitivityScenario==='BASE'?{multiplier:1,persistenceOffset:0}:allowedVariants.find(s=>s.id===output.sensitivityScenario)
 if(!scenario)throw Error('UNKNOWN_SENSITIVITY_SCENARIO')
 for(const f of output.factors) {
  const rule=config.factors.find(r=>r.id===f.factorId)
  if(f.counterevidence.length)throw Error('UNCONFIGURED_COUNTEREVIDENCE_CLASSIFIER')
  for(const id of [...f.evidence,...f.context,...f.counterevidence])if(!ids.has(id))throw Error('BROKEN_FACTOR_REFERENCE')
  if(f.direction==='INSUFFICIENT_DATA'){if(f.evidence.length||f.confidence!=='UNASSESSED')throw Error('MISSING_FACTOR_HAS_PRIMARY');continue}
  if(f.evidence.length!==1)throw Error('PRIMARY_VOTE_COUNT')
  const l=ids.get(f.evidence[0]);if(l.seriesId!==rule.primarySeriesId||l.dependencyRole!=='PRIMARY_SIGNAL')throw Error('FACTOR_OWNER_MISMATCH')
  const points=l.inputObservations.map(p=>({date:p.observationPeriod.start.slice(0,7),value:p.value})),endpoint=points.at(-1).date
  const w=transformWindow({observations:points},rule,config,endpoint,scenario)
  if(w.error||w.direction!==f.direction||l.state!==f.direction||contentHash(w.transformed)!==contentHash(l.transformedWindow)||l.transform.value!==w.transformed.at(-1).value)throw Error('PRIMARY_CALCULATION_MISMATCH')
  if(l.units!==rule.expectedInputUnits||l.transform.units!==config.transforms[rule.transformId].units||l.transform.id!==rule.transformId)throw Error('TRANSFORM_UNITS_OR_ID_MISMATCH')
  if(l.transform.parameters.entry!==rule.entry*scenario.multiplier||l.transform.parameters.quiet!==rule.quiet*scenario.multiplier||l.transform.parameters.persistencePeriods!==Math.max(1,rule.persistencePeriods+scenario.persistenceOffset))throw Error('RULE_PARAMETER_MISMATCH')
  if(rule.supplementalMeasurements.length){const actual=l.supplementalMeasurements[0],want=100*(points.at(-1).value/points.at(-13).value-1);if(l.supplementalMeasurements.length!==1||actual?.value!==want||contentHash(actual.inputPeriodLabels)!==contentHash(points.slice(-13).map(p=>p.date)))throw Error('SUPPLEMENTAL_CORE_LEVEL_MISMATCH')}
  else if(l.supplementalMeasurements.length)throw Error('UNCONFIGURED_SUPPLEMENTAL_OUTPUT')
 }
 function walk(id,visiting=new Set()) {
  const l=ids.get(id);if(!l)throw Error('BROKEN_OPERAND_REFERENCE');if(visiting.has(id))throw Error('LINEAGE_CYCLE')
  if(l.maintenanceType==='DERIVED') {const next=new Set(visiting);next.add(id);for(const op of l.operandEvidenceIds)walk(op,next)}
 }
 for(const l of ids.values()) {
  walk(l.id)
  if(l.maintenanceType==='DERIVED'){
   const spec=config.contextDerivations[l.methodologyRef];if(!spec||spec.outputSeriesId!==l.seriesId)throw Error('UNCONFIGURED_DERIVATION')
   const ops=l.operandEvidenceIds.map(id=>ids.get(id));if(contentHash(ops.map(o=>o.seriesId).filter((v,i,a)=>i===0||v!==a[i-1]))!==contentHash(spec.inputs))throw Error('DERIVED_OPERAND_IDENTITY')
   if(!isRetrospective(output)&&l.availableAt!==new Date(Math.max(...ops.map(o=>Date.parse(o.availableAt)))).toISOString())throw Error('DERIVED_AVAILABILITY_MISMATCH')
   let want
   switch(l.methodologyRef){case 'treasury_compensation_10y':if(ops.length!==2||ops[0].observationPeriod.label!==ops[1].observationPeriod.label)throw Error('MISMATCHED_TREASURY_DATES');want=ops[0].rawValue-ops[1].rawValue;break
    case 'interest_revenue':if(ops.length!==2||ops[0].observationPeriod.label!==ops[1].observationPeriod.label||ops[1].rawValue<=0)throw Error('FISCAL_OPERAND_MISMATCH');want=100*ops[0].rawValue/ops[1].rawValue;break
    case 'positive_deficit_display':want=-ops[0].rawValue;break
    case 'real_gdp_worker':if(ops.length!==4)throw Error('INCOMPLETE_EMPLOYMENT_QUARTER');
    {const q=ops[0].observationPeriod;const months=ops.slice(1);if(months.some(o=>Date.parse(o.observationPeriod.start)<Date.parse(q.start)||Date.parse(o.observationPeriod.end)>Date.parse(q.end))||new Set(months.map(o=>o.observationPeriod.label)).size!==3)throw Error('EMPLOYMENT_QUARTER_MISMATCH');want=ops[0].rawValue/(months.reduce((sum,o)=>sum+o.rawValue,0)/3)*1e6}break
   }
   if(l.transform.value!==want||l.transform.units!==spec.units)throw Error('DERIVED_CALCULATION_MISMATCH')
   if(l.inputVintageId!==`derived:${contentHash({id:l.methodologyRef,ruleVersion:config.ruleVersion,operands:ops})}`)throw Error('DERIVED_VINTAGE_HASH_MISMATCH')
  }
 }
 for(const [key,outcome] of [['domestic','DOMESTIC_PURCHASING_POWER'],['international','INTERNATIONAL_DOLLAR_ROLE']]) {
  const o=output[key];if(contentHash(o.factorIds)!==contentHash(config.factors.filter(f=>f.outcome===outcome).map(f=>f.id)))throw Error('OUTCOME_SCOPE')
  for(const id of o.contextEvidenceIds)if(!ids.has(id))throw Error('BROKEN_OUTCOME_CONTEXT')
  for(const c of o.contrasts){if(!config.conflicts.some(r=>r.id===c.contrastId&&r.outcome===outcome))throw Error('UNKNOWN_CONTRAST');for(const id of c.evidenceIds)if(!ids.has(id))throw Error('BROKEN_CONTRAST_REFERENCE')}
 }
 if(archive&&env){
  if(output.parentArtifactRef&&!priorArtifact)throw Error('PRIOR_ARTIFACT_REQUIRED_FOR_HISTORY_VALIDATION')
  if(priorArtifact&&output.parentArtifactRef!==`sha256:${contentHash(priorArtifact)}`)throw Error('PARENT_ARTIFACT_MISMATCH')
  const expected=evaluate(archive,env,output,{scenario,priorArtifact})
  for(let i=0;i<output.factors.length;i++)for(const key of ['direction','confidence','qualityReasons','dataStatus','alignment','evidence','context','missingContext','sourceStatuses','observationThrough'])if(contentHash(output.factors[i][key])!==contentHash(expected.factors[i][key]))throw Error('ASSESSMENT_RULE_MISMATCH:'+key)
  for(const key of ['domestic','international'])if(contentHash(output[key])!==contentHash(expected[key]))throw Error('OUTCOME_RULE_MISMATCH')
  for(const key of ['inputs','lineage','engineVersion','limitations'])if(contentHash(output[key])!==contentHash(expected[key]))throw Error('PINNED_ARTIFACT_MISMATCH:'+key)
  for(let i=0;i<output.factors.length;i++)for(const key of ['changeReason','lastValidArtifactRef','ruleVersion','limitations'])if(contentHash(output.factors[i][key])!==contentHash(expected.factors[i][key]))throw Error('HISTORY_RULE_MISMATCH:'+key)
 }
 return true
}
