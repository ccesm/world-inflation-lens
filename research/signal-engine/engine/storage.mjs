import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { serialize,sha256,VERSION } from './core.mjs'
export function offlinePath(repo,target) {
 const absolute=path.resolve(target),roots=[path.join(repo,'research/signal-engine/outputs'),'/private/tmp','/tmp',os.tmpdir()]
 if(!roots.some(r=>absolute.startsWith(r+path.sep)))throw Error('OUTPUT_PATH_MUST_BE_OFFLINE')
 // Resolve existing ancestor symlinks before admitting a path; do not follow a link into production data.
 let existing=path.dirname(absolute)
 while(!fs.existsSync(existing))existing=path.dirname(existing)
 const real=fs.realpathSync(existing)
 const realRoots=roots.map(r=>fs.existsSync(r)?fs.realpathSync(r):r)
 if(!realRoots.some(r=>real===r||real.startsWith(r+path.sep)))throw Error('UNSAFE_OUTPUT_SYMLINK')
 return absolute
}
export function atomicImmutable(target,bytes,{beforePromote=null}={}) {
 if(fs.existsSync(target)){if(fs.readFileSync(target,'utf8')===bytes)return 'UNCHANGED';throw Error('IMMUTABLE_ARTIFACT_ALREADY_EXISTS')}
 fs.mkdirSync(path.dirname(target),{recursive:true});const temporary=`${target}.temporary-${process.pid}`
 try{fs.writeFileSync(temporary,bytes,{flag:'wx'});beforePromote?.();fs.linkSync(temporary,target);return 'CREATED'}finally{if(fs.existsSync(temporary))fs.unlinkSync(temporary)}
}
export function persistArtifact(repo,output,target,validate,{beforePromote=null}={}) {
 validate(output);const bytes=serialize(output),hash=sha256(bytes),absolute=offlinePath(repo,target)
 atomicImmutable(absolute,bytes,{beforePromote})
 // Retain addressable predecessors so factor-level last-valid links can be
 // checked after an unavailable assessment or a later recovery.
 atomicImmutable(path.join(path.dirname(absolute),'artifacts',hash+'.json'),bytes)
 const run={schemaVersion:'offline-run/0.1',engineVersion:VERSION,generationTimestamp:new Date().toISOString(),payloadSha256:hash,artifactPath:absolute,status:'SIGNAL_EVALUATION_SUCCESS'}
 const runPath=path.join(path.dirname(absolute),'runs',`${hash}-${Date.now()}-${process.pid}.json`)
 fs.mkdirSync(path.dirname(runPath),{recursive:true});fs.writeFileSync(runPath,JSON.stringify(run,null,2)+'\n',{flag:'wx'})
 return {payloadSha256:hash,artifactPath:absolute,runMetadataPath:runPath}
}
