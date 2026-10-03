import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { seriesMetadata } from '../../../src/data/seriesContract.js'
import { validateInternational } from '../../../scripts/lib/international.mjs'
import { sha256,contentHash,period,instant,availabilityBound,timeEvidence } from './core.mjs'
import { manifestAcceptance,receipt } from './acceptance.mjs'
export const SPEC_COMMIT='faaae287f1b144bd8396023a8f134b66ae84404c'
export const SOURCE_FILES=['data/inflation/fred.json','data/inflation/drivers.json','data/inflation/monitor.json','data/productivity/series.json','data/digital-money/bank-deposits.json','data/external/gpr.json','data/external/gscpi.json','data/external/fao-food.json','data/external/sipri-military.json','data/digital-money/stablecoins.json','data/digital-money/treasury-holdings.json','data/international-dollar/reserve-composition.json','data/international-dollar/treasury-holdings.json','data/international-dollar/global-dollar-credit.json']
export const CONTRACT_FILES=['src/data/seriesRegistry.js','src/data/seriesContract.js','src/data/internationalDefinitions.js','src/utils/freshness.js','src/utils/releaseCalendar.js','src/utils/timeSemantics.js','src/utils/treasuryPricing.js','src/utils/productivity.js']
export function gitBytes(repo,commit,file) {
 if(!/^[a-f0-9]{40}$/.test(commit)||! /^(data|src|docs|research)\//.test(file)||file.includes('..'))throw Error('UNSAFE_MANIFEST_PATH')
 return execFileSync('git',['show',`${commit}:${file}`],{cwd:repo,maxBuffer:15_000_000})
}
export function normalizeDataset(data) {
 const rows=data.series||data.records||[data]
 return rows.map(s=>({...data.metadata,...s,observations:s.observations||[{date:s.observationDate??null,value:s.value??null}]}))
}
const geometryCache=new WeakMap()
export function validateSource(source,expected=null) {
 if(!source?.id||!source.sourceUrl||!source.units||!source.frequency)throw Error('MISSING_SOURCE_METADATA')
 if(expected)for(const key of ['id','units','frequency','seasonalAdjustment','denominator','sourceKey','definition','geography','currencyDenomination','borrowerSector'])if(expected[key]!==undefined&&source[key]!==expected[key])throw Error(`INCOMPATIBLE_${key.toUpperCase()}`)
 if(!Array.isArray(source.observations))throw Error('INVALID_OBSERVATIONS')
 const geometryKey=source.id+'|'+source.frequency+'|'+(source.periodBasis||'')
 if(Object.isFrozen(source.observations)&&geometryCache.get(source.observations)===geometryKey)return source
 let last=null
 for(const p of source.observations) {
  const op=period(p.date,source.frequency,p.sourcePeriod,source.periodBasis)
  if(p.value!==null&&!Number.isFinite(p.value))throw Error('NONFINITE_OBSERVATION')
  if(last!==null&&p.date<=last)throw Error(p.date===last?'DUPLICATE_PERIOD':'UNSORTED_PERIODS')
  last=p.date
  if(p.availableAt)instant(p.availableAt)
  if(p.releasePublishedAt&&['value','precision','timeZone','evidenceRef'].some(key=>!Object.hasOwn(p.releasePublishedAt,key)))throw Error('INCOMPLETE_PUBLISHER_TIME_METADATA')
  if(p.releasePublishedAt?.value)availabilityBound(p.releasePublishedAt)
  if(p.releasePublishedAt?.value && p.availableAt) {const bound=availabilityBound(p.releasePublishedAt);if(bound&&Date.parse(bound)>Date.parse(p.availableAt))throw Error('AVAILABILITY_PRECEDES_RELEASE')}
  if(source.id.startsWith('COFER_')&&p.value!==null&&(p.value<0||p.value>100))throw Error('INVALID_SHARE_RANGE')
  if(op.kind==='publication_fact'&&source.observations.length!==1)throw Error('PUBLICATION_FACT_NOT_SERIES')
 }
 if(Object.isFrozen(source.observations))geometryCache.set(source.observations,geometryKey)
 return source
}
export function specEnvironment(repo,configPath='research/signal-engine/signal-engine-v0.1-draft.json') {
 const lock=JSON.parse(fs.readFileSync(path.join(repo,'research/signal-engine/fixtures/spec-lock.json')))
 for(const [file,hash] of Object.entries(lock.hashes))if(sha256(fs.readFileSync(path.join(repo,file)))!==hash)throw Error(`IMMUTABLE_SPEC_CHANGED:${file}`)
 const config=JSON.parse(fs.readFileSync(path.join(repo,configPath)))
 if(sha256(fs.readFileSync(path.join(repo,configPath)))!==lock.hashes['research/signal-engine/signal-engine-v0.1-draft.json'])throw Error('UNKNOWN_OR_MUTATED_RULE')
 const contracts=JSON.parse(fs.readFileSync(path.join(repo,'research/signal-engine/fixtures/input-contracts.json')))
 return {config,contracts,ruleSha256:lock.hashes['research/signal-engine/signal-engine-v0.1-draft.json'],outputSchemaSha256:lock.hashes['research/signal-engine/output.schema.json'],normativeDocumentHashes:Object.fromEntries(config.normativeDocuments.map(file=>[file,lock.hashes[file]])),contractCodeHashes:Object.fromEntries(CONTRACT_FILES.map(file=>[file,lock.hashes[file]])),inputCommit:config.baseCommit,inputKind:'VALIDATED_REPOSITORY_SNAPSHOT',runtime:{name:'Node.js',version:process.versions.node,timeZoneDatabaseVersion:process.versions.tz||'unknown'}}
}
export function captureManifest(repo,commit,contracts) {
 const datasets=[];const parsed={}
 for(const file of SOURCE_FILES) {
  const bytes=gitBytes(repo,commit,file),data=JSON.parse(bytes);parsed[file]=data
  const series=normalizeDataset(data)
  for(const source of series)validateSource(source,contracts[source.id])
  const metadata=data.metadata||data
  datasets.push({id:`snapshot:${file}:${sha256(bytes)}`,datasetId:file,snapshotPath:file,snapshotSha256:sha256(bytes),rawSha256:metadata.sourceSha256||null,rawRetentionLimitation:'Source payload not archived by this prototype; retained repository JSON is reproducible by commit/hash.',inputVintageId:`${commit}:${file}`,snapshotAcceptedAt:null,acceptanceEvidenceRef:null,firstSeenAt:null,parserVersion:'repository-json/0.1',sourceMethodologyId:metadata.methodology||metadata.revisionPolicy||'CURRENT_REPOSITORY_DEFINITION',inputCommit:commit,seriesIds:series.map(s=>s.id)})
 }
 validateInternational({cofer:parsed['data/international-dollar/reserve-composition.json'],tic:parsed['data/international-dollar/treasury-holdings.json'],bis:parsed['data/international-dollar/global-dollar-credit.json']})
 // Acceptance is recorded only after all local validation completes. It is not backdated to publication or retrieval.
 const completed=new Date().toISOString()
 for(const d of datasets){d.snapshotAcceptedAt=completed;d.firstSeenAt=completed;d.acceptanceEvidenceRef=`OFFLINE_LOCAL_VALIDATION:${d.snapshotSha256}:${completed}`;d.acceptanceRecord=receipt(d,completed)}
 return {schemaVersion:'project-input-manifest/0.1',inputCommit:commit,validationCompletedAt:completed,validation:'PASS_GENERIC_CONTRACTS_AND_EXISTING_INTERNATIONAL_VALIDATORS',datasets}
}
export function loadArchive(repo,manifest,env) {
 if(manifest.schemaVersion!=='project-input-manifest/0.1')throw Error('UNKNOWN_MANIFEST_VERSION')
 const archive=[]
 for(const dataset of manifest.datasets) {
  const d=manifestAcceptance(dataset,manifest)
  const bytes=gitBytes(repo,d.inputCommit,d.snapshotPath)
  if(sha256(bytes)!==d.snapshotSha256)throw Error('INPUT_HASH_MISMATCH')
  const series=normalizeDataset(JSON.parse(bytes)).map(source=>{validateSource(source,env.contracts[source.id]);return {...source,contract:seriesMetadata(source)}})
  if(contentHash(series.map(s=>s.id))!==contentHash(d.seriesIds))throw Error('MANIFEST_SERIES_IDENTITY_MISMATCH')
  archive.push(deepFreeze({snapshot:d,series}))
 }
 return archive
}
export function makeSpecLock(repo) {
 const files=['docs/signal-engine-spec.md','docs/signal-engine-factor-matrix.md','docs/signal-engine-validation-plan.md','research/signal-engine/signal-engine-v0.1-draft.json','research/signal-engine/output.schema.json',...CONTRACT_FILES]
 return {specCommit:SPEC_COMMIT,hashes:Object.fromEntries(files.map(file=>[file,sha256(gitBytes(repo,SPEC_COMMIT,file))]))}
}

export function deepFreeze(value) {if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(deepFreeze);Object.freeze(value)}return value}
