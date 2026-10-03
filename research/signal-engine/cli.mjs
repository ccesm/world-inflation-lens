import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { performance } from 'node:perf_hooks'
import { specEnvironment,captureManifest,loadArchive } from './engine/inputs.mjs'
import { evaluate } from './engine/engine.mjs'
import { contentHash,instant } from './engine/core.mjs'
import { compileOutputSchema,validateArtifact } from './engine/validation.mjs'
import { offlinePath,atomicImmutable,persistArtifact } from './engine/storage.mjs'
export const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..')
export function args(argv) {
 const options={command:argv[0]},common=['manifest','mode','as-of','period-cutoff','evaluated-at','output','rule-version']
 const allowed={capture:['commit','output'],evaluate:[...common,'previous'],sensitivity:common,historical:[...common,'sensitivity']}[options.command]
 if(!allowed)throw Error('UNKNOWN_COMMAND')
 for(let i=1;i<argv.length;i++){
  if(!argv[i].startsWith('--')||!argv[i+1]||argv[i+1].startsWith('--'))throw Error('OPTIONS_REQUIRE_VALUES')
  const key=argv[i].slice(2)
  if(!allowed.includes(key))throw Error(`UNKNOWN_OPTION:${key}`)
  if(Object.hasOwn(options,key))throw Error(`DUPLICATE_OPTION:${key}`)
  options[key]=argv[++i]
 }
 if(options.sensitivity&&!['true','false'].includes(options.sensitivity))throw Error('INVALID_SENSITIVITY_OPTION')
 return options
}
export function validateInvocation(options,env) {
 if(options['rule-version']!==env.config.ruleVersion)throw Error('EXPLICIT_SUPPORTED_RULE_VERSION_REQUIRED')
 if(!options.mode)throw Error('EXPLICIT_MODE_REQUIRED')
 if(!options.manifest||!options.output)throw Error('EXPLICIT_MANIFEST_AND_OUTPUT_REQUIRED')
}
export function loadContext(manifestPath) {
 const env=specEnvironment(repo);env.configCanonicalHash=contentHash(env.config)
 const manifest=JSON.parse(fs.readFileSync(manifestPath));const archive=loadArchive(repo,manifest,env)
 env.inputCommit=manifest.inputCommit
 const schema=JSON.parse(fs.readFileSync(path.join(repo,'research/signal-engine/output.schema.json'))),validator=compileOutputSchema(schema)
 return {env,manifest,archive,validator,validate:(output,options={})=>validateArtifact(output,env.config,validator,{archive,env,...options})}
}
export function requestFrom(options) {
 const aliases={'current':'CURRENT_SNAPSHOT','current-vintage':'CURRENT_VINTAGE_RECONSTRUCTION','recorded-project':'RECORDED_AS_OF','publisher-vintage':'TRUE_RELEASE_VINTAGE'}
 const mode=aliases[options.mode]||options.mode||'CURRENT_SNAPSHOT',evaluatedAt=instant(options['evaluated-at'])
 if(options['as-of']&&options['period-cutoff'])throw Error('AMBIGUOUS_CUTOFF_OPTIONS')
 if(mode!=='CURRENT_VINTAGE_RECONSTRUCTION'&&options['period-cutoff'])throw Error('UNEXPECTED_PERIOD_CUTOFF')
 const dateEnd=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')?`${value}T23:59:59.999Z`:value
 if(mode==='CURRENT_VINTAGE_RECONSTRUCTION')return {mode,asOf:null,periodCutoff:instant(dateEnd(options['period-cutoff']||options['as-of'])),evaluatedAt}
 return {mode,asOf:instant(dateEnd(options['as-of'])),periodCutoff:null,evaluatedAt}
}
export function loadPriorArtifact(file,context,seen=new Set()) {
 const output=JSON.parse(fs.readFileSync(file)),hash=contentHash(output)
 if(seen.has(hash))throw Error('ARTIFACT_HISTORY_CYCLE');seen.add(hash)
 let priorArtifact=null
 if(output.parentArtifactRef){
  if(!/^sha256:[a-f0-9]{64}$/.test(output.parentArtifactRef))throw Error('INVALID_PARENT_ARTIFACT_REFERENCE')
  const parentHash=output.parentArtifactRef.slice(7),directory=path.dirname(file)
  const candidate=[path.join(directory,parentHash+'.json'),path.join(directory,'artifacts',parentHash+'.json')].find(p=>fs.existsSync(p))
  if(!candidate)throw Error('MISSING_RETAINED_PARENT_ARTIFACT')
  priorArtifact=loadPriorArtifact(candidate,context,seen)
  if(contentHash(priorArtifact)!==parentHash)throw Error('PARENT_ARTIFACT_HASH_MISMATCH')
 }
 context.validate(output,{priorArtifact})
 return output
}
async function main() {
 const options=args(process.argv.slice(2))
 if(options.command==='capture') {
  const env=specEnvironment(repo),manifest=captureManifest(repo,options.commit||env.config.baseCommit,env.contracts),destination=offlinePath(repo,options.output)
  atomicImmutable(destination,JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify({manifestPath:destination,acceptedAt:manifest.validationCompletedAt,datasets:manifest.datasets.length}));return
 }
 if(options.command!=='evaluate')throw Error('Use capture or evaluate; mode/time/manifest/output must be explicit')
 const started=performance.now(),context=loadContext(options.manifest)
 validateInvocation(options,context.env)
 const request=requestFrom(options),priorArtifact=options.previous?loadPriorArtifact(options.previous,context):null
 const validate=output=>context.validate(output,{priorArtifact})
 const output=evaluate(context.archive,context.env,request,{priorArtifact});validate(output)
 const saved=persistArtifact(repo,output,options.output,validate)
 console.log(JSON.stringify({...saved,runtimeMs:performance.now()-started,mode:output.mode,states:output.factors.map(f=>({id:f.factorId,state:f.direction,confidence:f.confidence,dataStatus:f.dataStatus}))},null,2))
}
if(process.argv[1]===fileURLToPath(import.meta.url))main().catch(error=>{console.error(`SIGNAL_EVALUATION_FAILED: ${error.message}`);process.exitCode=1})
