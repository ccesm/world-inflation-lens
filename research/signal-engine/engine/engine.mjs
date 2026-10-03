// Pure evaluation: no filesystem, live APIs, implicit clock, email or deployment.
import { period,transformWindow,scenarios,contemporaneous,VERSION,contentHash,instant } from './core.mjs'
import { requestOptions,selectArchive,eligibility,manualEligibility,isRetrospective,cutoffOf,lagBoundary,pointAvailability } from './alignment.mjs'
import { seriesMetadata } from '../../../src/data/seriesContract.js'
import { derive10YBreakeven } from '../../../src/utils/treasuryPricing.js'
import { releaseWindow } from '../../../src/utils/releaseCalendar.js'
import { confidenceFromReasons } from './confidence.mjs'
import { rawRecord,derivedRecord } from './lineage.mjs'
export function validateConfig(config,expectedHash=null) {
 if(config.ruleVersion!=='signal-engine-v0.1-draft.1'||config.schemaVersion!=='signal-rule-config/0.1')throw Error('UNKNOWN_RULE_VERSION')
 if(expectedHash&&contentHash(config)!==expectedHash)throw Error('MUTATED_IMMUTABLE_CONFIG')
 if(config.productionEnabled!==false||config.aggregation!=='NONE'||config.factors.length!==7)throw Error('INVALID_SCOPE')
 const owners=new Set(),ids=new Set()
 for(const f of config.factors){if(owners.has(f.primarySeriesId)||ids.has(f.id))throw Error('DUPLICATE_PRIMARY_OWNER');owners.add(f.primarySeriesId);ids.add(f.id);if(config.ownership[f.primarySeriesId]?.owner!==f.id||config.ownership[f.primarySeriesId]?.classification!=='PRIMARY FACTOR')throw Error('BAD_OWNERSHIP');const t=config.transforms[f.transformId];if(!t||f.frequency!==t.frequency||f.minimumContiguousPeriods!==t.minimumPeriodsSingleResult+f.persistencePeriods-1||!(f.entry>f.quiet&&f.quiet>=0)||!Number.isInteger(f.persistencePeriods)||f.persistencePeriods<1)throw Error('INVALID_RULE_PARAMETERS')}
 return config
}
const diagnostic=(id,st)=>({seriesId:id,freshnessState:st?.state||'UNKNOWN',reason:st?.reason||st?.error||'MISSING_INPUT'})
const snapshotOut=s=>Object.fromEntries(['id','datasetId','snapshotPath','snapshotSha256','rawSha256','rawRetentionLimitation','inputVintageId','snapshotAcceptedAt','acceptanceEvidenceRef','firstSeenAt','parserVersion','sourceMethodologyId'].map(k=>[k,s[k]??null]))
function primaryFailure(status,error) {if(error&&error!=='INELIGIBLE_FRESHNESS')return 'INSUFFICIENT_DATA';return ['SOURCE_UPDATED_NOT_YET_CAPTURED','REFRESH_FAILED','STALE'].includes(status?.state)?status.state:'INSUFFICIENT_DATA'}
function horizon(points,frequency){return {start:period(points[0].date,frequency).start,end:period(points.at(-1).date,frequency).end}}
function blockedFactor(f,r,st,reason) {
 return {factorId:f.id,ruleVersion:r.ruleVersion,direction:'INSUFFICIENT_DATA',observationThrough:null,evidence:[],counterevidence:[],context:[],missingContext:f.contextSeriesIds,confidence:'UNASSESSED',qualityReasons:[reason],dataStatus:primaryFailure(st,reason),sourceStatuses:[diagnostic(f.primarySeriesId,st)],availabilityBasis:r.retrospective?'NOT_RECONSTRUCTED':'UNKNOWN',alignment:'UNASSESSED',changeReason:['INITIAL'],lastValidArtifactRef:null,limitations:[reason,'No current assessment is inferred from unavailable evidence']}
}
export function evaluate(archive,env,request,{scenario={multiplier:1,persistenceOffset:0,id:'BASE'},priorArtifact=null}={}) {
 requestOptions(request);const config=validateConfig(env.config,env.configCanonicalHash),retrospective=isRetrospective(request),selected=selectArchive(archive,request),byId=new Map(),lineage=new Map(),derivedFailures=new Map()
 for(const item of selected)for(const raw of item.series){if(byId.has(raw.id))throw Error('DUPLICATE_CANONICAL_SERIES');const source={...raw,contract:raw.contract||seriesMetadata(raw)};byId.set(source.id,{source,snapshot:item.snapshot})}
 const statuses=new Map()
 function status(id,primary=false) {
  const entry=byId.get(id);if(!entry)return {error:'MISSING_INPUT',state:'UNKNOWN',reason:'No accepted snapshot/series',points:[]}
  if(!statuses.has(id)){const st=(entry.source.contract.automationType==='MANUAL_REVIEWED'?manualEligibility:eligibility)(entry.source,entry.snapshot,request,{expected:env.contracts?.[id],primary});statuses.set(id,st)}
  return statuses.get(id)
 }
 function context(id) {
  const lid=`context:${id}`;if(lineage.has(lid))return lid
  const e=byId.get(id),st=status(id);if(!e||st.error)return null
  const record=rawRecord(lid,e.source,e.snapshot,st,[st.last],request,config)
  lineage.set(lid,record);return lid
 }
 // Only four declared context derivations; no inferred factors or weights.
 for(const [name,spec] of Object.entries(config.contextDerivations)) {
  const entries=spec.inputs.map(id=>byId.get(id)),states=spec.inputs.map(id=>status(id))
  if(entries.some(e=>!e)||states.some(st=>st.error)){derivedFailures.set(spec.outputSeriesId,'MISSING_OR_INELIGIBLE_DERIVED_SOURCE');continue}
  let selectedPoints=[],op,value
  if(name==='real_gdp_worker') {
   const g=states[0].last;const quarter=period(g.date,'quarterly');const y=Number(g.date.slice(0,4)),m=Number(g.date.slice(5,7));const employment=new Map(states[1].points.map(p=>[p.date,p]));const months=[0,1,2].map(i=>employment.get(`${y}-${String(m+i).padStart(2,'0')}`))
   if(months.some(p=>!p||p.value===null||p.value<=0)){derivedFailures.set(spec.outputSeriesId,'INCOMPLETE_EMPLOYMENT_QUARTER');continue}
   selectedPoints=[[g],months];op=quarter;value=g.value/(months.reduce((sum,p)=>sum+p.value,0)/3)*1e6
  } else if(name==='treasury_compensation_10y'||name==='interest_revenue') {
   const b=new Map(states[1].points.map(p=>[p.date,p]));const match=states[0].points.filter(p=>b.has(p.date)).at(-1)
   if(!match||match.value===null||b.get(match.date).value===null){derivedFailures.set(spec.outputSeriesId,'MISSING_LATEST_MATCHED_OPERAND');continue}
   const second=b.get(match.date);selectedPoints=[[match],[second]];op=period(match.date,entries[0].source.frequency,null,entries[0].source.periodBasis)
   if(name==='treasury_compensation_10y')value=derive10YBreakeven([match],[second]).latest.value
   else {if(second.value<=0){derivedFailures.set(spec.outputSeriesId,'NONPOSITIVE_RECEIPTS');continue}if(period(second.date,entries[1].source.frequency,null,entries[1].source.periodBasis).label!==op.label){derivedFailures.set(spec.outputSeriesId,'FISCAL_YEAR_MISMATCH');continue}value=100*match.value/second.value}
  } else {selectedPoints=[[states[0].last]];op=period(states[0].last.date,entries[0].source.frequency);value=-states[0].last.value}
  let boundary
  if(spec.freshnessPolicy.type==='release_calendar') {
   const win=releaseWindow('H15',new Date(cutoffOf(request)))
   if(win?.mature&&selectedPoints[0][0].date<win.mature.observation){derivedFailures.set(spec.outputSeriesId,'STALE_MATCHED_DATE');continue}
   boundary={validUntil:win?.next?.captureDueAt||null,validUntilInclusive:false}
  } else {
   boundary=lagBoundary({frequency:spec.freshnessPolicy.frequency,contract:{freshnessPolicy:{maxLagDays:spec.freshnessPolicy.maxLagDays}}},selectedPoints[0][0])
   if(Date.parse(cutoffOf(request))>Date.parse(boundary.validUntil)){derivedFailures.set(spec.outputSeriesId,'STALE_DERIVED_ENDPOINT');continue}
  }
  for(const st of states)if(st.validUntil&&(!boundary.validUntil||Date.parse(st.validUntil)<Date.parse(boundary.validUntil)||st.validUntil===boundary.validUntil&&!st.validUntilInclusive))boundary={validUntil:st.validUntil,validUntilInclusive:st.validUntilInclusive}
  const operands=[]
  entries.forEach((entry,i)=>selectedPoints[i].forEach(p=>{const id=`operand:${name}:${entry.source.id}:${period(p.date,entry.source.frequency,null,entry.source.periodBasis).label}`;const record=rawRecord(id,entry.source,entry.snapshot,states[i],[p],request,config,{role:spec.role,operand:true});lineage.set(id,record);operands.push(record)}))
  const id=`context:${spec.outputSeriesId}`;lineage.set(id,derivedRecord(name,spec,operands,value,op,boundary,request,config));lineage.get(id).id=id
 }
 const factors=[],factorHorizons=new Map()
 for(const f of config.factors) {
  const entry=byId.get(f.primarySeriesId),st=status(f.primarySeriesId,true)
  if(!entry||st.error){factors.push(blockedFactor(f,{ruleVersion:config.ruleVersion,retrospective},st,st.error||'MISSING_INPUT'));continue}
  if(entry.source.units!==f.expectedInputUnits||entry.source.frequency!==f.frequency){factors.push(blockedFactor(f,{ruleVersion:config.ruleVersion,retrospective},st,'CONFIG_SOURCE_IDENTITY_MISMATCH'));continue}
  let window=transformWindow({...entry.source,observations:st.points},f,config,st.last.date,scenario)
  // Validate component identities only when components exist; never count them as additional primary evidence.
  if(f.primarySeriesId==='BIS_USD_TOTAL')for(const id of ['BIS_USD_LOANS','BIS_USD_SECURITIES']){
   if(byId.has(id)&&status(id).error&&!['INELIGIBLE_FRESHNESS','NO_AVAILABLE_OBSERVATION'].includes(status(id).error))window={error:'BIS_COMPONENT_IDENTITY_FAILURE'}
  }
  if(!window.error&&f.primarySeriesId==='BIS_USD_TOTAL'&&byId.has('BIS_USD_LOANS')&&byId.has('BIS_USD_SECURITIES')){
   const loans=new Map(status('BIS_USD_LOANS').points.map(p=>[p.date,p.value])),sec=new Map(status('BIS_USD_SECURITIES').points.map(p=>[p.date,p.value]))
   if(window.raw.some(p=>Number.isFinite(loans.get(p.date))&&Number.isFinite(sec.get(p.date))&&Math.abs(p.value-loans.get(p.date)-sec.get(p.date))>0.002))window={error:'BIS_TOTAL_COMPONENT_MISMATCH'}
  }
  if(window.error){factors.push(blockedFactor(f,{ruleVersion:config.ruleVersion,retrospective},st,window.error));continue}
  const missing=[],ctx=[],quality=[],contexts=[]
  for(const id of f.contextSeriesIds){const ref=id==='REAL_GDP_WORKER'?(lineage.has(`context:${id}`)?`context:${id}`:null):context(id);if(!ref)missing.push(id);else {ctx.push(ref);contexts.push(lineage.get(ref))}}
  const h=horizon(window.raw,f.frequency);factorHorizons.set(f.id,h)
  const alignment=missing.length?'CONTEXT_INCOMPLETE':contexts.some(c=>!contemporaneous(h,c.observationPeriod))?'NOT_CONTEMPORANEOUS':contexts.some(c=>c.frequency!==f.frequency)?'MIXED_FREQUENCY_DISCLOSED':'ALIGNED'
  if(missing.length)quality.push('MISSING_OPTIONAL_CONTEXT');if(alignment==='NOT_CONTEMPORANEOUS')quality.push('NONCONTEMPORANEOUS_CONTEXT')
  if(retrospective)quality.push('RETROSPECTIVE_AVAILABILITY_UNPROVEN')
  if(!window.raw.every(p=>p.releasePublishedAt?.precision==='timestamp'))quality.push('UNKNOWN_OR_COARSE_PUBLISHER_AVAILABILITY')
  if(f.primarySeriesId==='COFER_USD'){
   const imputed=byId.get('COFER_IMPUTED')?.source.observations||[],map=new Map(imputed.map(p=>[p.date,p.value]))
   if(window.raw.some(p=>!Number.isFinite(map.get(p.date))))quality.push('UNKNOWN_IMPUTATION')
   if(window.raw.some(p=>map.get(p.date)>0))quality.push('IMPUTED_PRIMARY_MEASURE')
  }
  const allVariants=scenarios(config).map(s=>transformWindow({...entry.source,observations:st.points},f,config,st.last.date,s))
  if(allVariants.some(w=>w.error))quality.push('SENSITIVITY_NOT_EVALUATED')
  if(allVariants.some(w=>!w.error&&w.direction!==window.direction))quality.push('PARAMETER_SENSITIVE')
  const previous=archive.filter(a=>a.snapshot.datasetId===entry.snapshot.datasetId&&Date.parse(a.snapshot.snapshotAcceptedAt)<Date.parse(entry.snapshot.snapshotAcceptedAt)).sort((a,b)=>Date.parse(b.snapshot.snapshotAcceptedAt)-Date.parse(a.snapshot.snapshotAcceptedAt))[0]
  let priorWindow=null
  if(previous){const p=previous.series.find(s=>s.id===f.primarySeriesId);if(p&&p.units===entry.source.units&&p.denominator===entry.source.denominator&&previous.snapshot.sourceMethodologyId===entry.snapshot.sourceMethodologyId)priorWindow=transformWindow(p,f,config,st.last.date,scenario)}
  if(!priorWindow||priorWindow.error)quality.push('NO_COMPARABLE_PRIOR_VINTAGE')
  else if(priorWindow.direction!==window.direction)quality.push('REVISION_SENSITIVE')
  const confidence=confidenceFromReasons(quality)
  const lid=`primary:${f.id}`,supplemental=f.supplementalMeasurements.length?[{id:'core_yoy_level',transformId:'yoy_monthly',inputPeriodLabels:window.raw.slice(-13).map(p=>p.date),value:100*(window.raw.at(-1).value/window.raw.at(-13).value-1),units:'percent'}]:[]
  lineage.set(lid,rawRecord(lid,entry.source,entry.snapshot,st,window.raw,request,config,{role:'PRIMARY_SIGNAL',transform:{id:f.transformId,parameters:{entry:f.entry*scenario.multiplier,quiet:f.quiet*scenario.multiplier,persistencePeriods:Math.max(1,f.persistencePeriods+scenario.persistenceOffset)},value:window.transformed.at(-1).value,units:config.transforms[f.transformId].units},transformed:window.transformed,supplemental,state:window.direction}))
  lineage.get(lid).qualityFlags=quality
  const reasons=[]
  if(priorWindow&&!priorWindow.error&&contentHash(priorWindow.raw)!==contentHash(window.raw))reasons.push('REVISION_DRIVEN_CHANGE')
  else if(previous&&previous.series.find(s=>s.id===f.primarySeriesId)?.observations.at(-1)?.date<st.last.date)reasons.push('NEW_OBSERVATION')
  const prior=priorArtifact?.factors.find(p=>p.factorId===f.id)
  if(prior){if(prior.observationThrough?.label!==period(st.last.date,f.frequency).label)reasons.unshift('NEW_OBSERVATION');if(prior.ruleVersion!==config.ruleVersion)reasons.push('RULE_CHANGE');if(prior.dataStatus!==(retrospective?'RETROSPECTIVE':st.state==='WAITING_FOR_EXPECTED_RELEASE'?'WAITING_FOR_RELEASE':missing.length?'PARTIAL_CONTEXT':'READY'))reasons.push('STATUS_CHANGE');if(contentHash(prior.context)!==contentHash(ctx))reasons.push('CONTEXT_CHANGE');if(!reasons.length)reasons.push('UNCHANGED')}
  else if(!reasons.length)reasons.push('INITIAL')
  factors.push({factorId:f.id,ruleVersion:config.ruleVersion,direction:window.direction,observationThrough:period(st.last.date,f.frequency),evidence:[lid],counterevidence:[],context:ctx,missingContext:missing,confidence,qualityReasons:quality,dataStatus:retrospective?'RETROSPECTIVE':st.state==='WAITING_FOR_EXPECTED_RELEASE'?'WAITING_FOR_RELEASE':missing.length?'PARTIAL_CONTEXT':'READY',sourceStatuses:[diagnostic(f.primarySeriesId,st),...f.contextSeriesIds.map(id=>diagnostic(id,statuses.get(id)||{state:lineage.has(`context:${id}`)?'DERIVED':'UNKNOWN',reason:derivedFailures.get(id)||'Derived context'}))],availabilityBasis:retrospective?'NOT_RECONSTRUCTED':'PROJECT_ACCEPTED_SNAPSHOT',alignment,changeReason:[...new Set(reasons)],lastValidArtifactRef:null,limitations:[`Narrow measurement: ${f.title.en}`,'Draft thresholds are not calibrated','WINDOW_CONFIRMED across distinct observation periods; no independent release count',...(retrospective?['Current revised vintage; not a real-time backtest']:[])]})
 }
 function outcome(kind) {
  const fs=config.factors.filter(f=>f.outcome===kind),actual=factors.filter(f=>fs.some(d=>d.id===f.factorId)),usable=actual.filter(f=>f.direction!=='INSUFFICIENT_DATA'),gaps=[],ctx=[]
  for(const id of config.outcomeContextSeriesIds[kind]){const ref=id.startsWith('ENGINE_DERIVED_')?(lineage.has(`context:${id}`)?`context:${id}`:null):context(id);if(ref)ctx.push(ref);else gaps.push(`${id}: ${derivedFailures.get(id)||status(id).error||'Unavailable'}`)}
  const contrasts=[]
  for(const conflict of config.conflicts.filter(c=>c.outcome===kind)) {
   for(const condition of conflict.anyAll||[conflict.all]) {
    const ids=Object.keys(condition),members=ids.map(id=>actual.find(f=>f.factorId===id))
    if(members.every((f,i)=>f&&f.direction===condition[ids[i]])&&contemporaneous(factorHorizons.get(ids[0]),factorHorizons.get(ids[1]))) {contrasts.push({contrastId:conflict.id,factorIds:ids,evidenceIds:members.flatMap(f=>f.evidence),messageKey:conflict.id});break}
   }
  }
  gaps.push(...actual.filter(f=>f.direction==='INSUFFICIENT_DATA').map(f=>`${f.factorId}: ${f.qualityReasons.join(',')}`),...(kind==='DOMESTIC_PURCHASING_POWER'?['Fiscal pressure: deferred','Inflation breadth: unavailable']:['Trade/commodity invoicing: planned','Conventional payments: planned','Alternative reserve assets: planned','Digital/funding/carry factors: deferred']))
  return {factorIds:actual.map(f=>f.factorId),contextEvidenceIds:ctx,coverage:usable.length?'PARTIAL':'INSUFFICIENT_DATA',evidencePattern:!usable.length?'INSUFFICIENT_DATA':contrasts.length?'MIXED':'DESCRIPTIVE',contrasts,gaps}
 }
 const domestic=outcome('DOMESTIC_PURCHASING_POWER'),international=outcome('INTERNATIONAL_DOLLAR_ROLE')
 const usedSnapshotIds=new Set([...lineage.values()].map(l=>l.snapshotId).filter(Boolean))
 return {schemaVersion:'signal-output/0.1',ruleVersion:config.ruleVersion,ruleSha256:env.ruleSha256,outputSchemaSha256:env.outputSchemaSha256,normativeDocumentHashes:env.normativeDocumentHashes,contractCodeHashes:env.contractCodeHashes,engineVersion:VERSION,runtime:env.runtime,inputCommit:env.inputCommit,inputKind:env.inputKind,mode:request.mode,asOf:request.asOf,periodCutoff:request.periodCutoff,evaluatedAt:request.evaluatedAt,historicalAvailabilityClaim:request.mode==='RECORDED_AS_OF',sensitivityScenario:scenario.id||'BASE',inputs:selected.filter(s=>usedSnapshotIds.has(s.snapshot.id)).map(s=>snapshotOut(s.snapshot)),lineage:[...lineage.values()].sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0),factors,domestic,international,limitations:['Offline research artifact; no aggregate score, probabilities or investment recommendation','No complete publisher-vintage archive',...(retrospective?['CURRENT-VINTAGE RECONSTRUCTION — revised data; historical publication availability is not established']:[]),...(!selected.length?['No accepted project snapshots at the requested cutoff']:[])],parentArtifactRef:priorArtifact?`sha256:${contentHash(priorArtifact)}`:null}
}
