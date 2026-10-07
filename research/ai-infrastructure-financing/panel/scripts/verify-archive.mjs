import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {loadInput,hash} from './panel.mjs';
import {createHash} from 'node:crypto';
const cache=process.env.WIL_AI_INFRA_CACHE||path.join(os.homedir(),'Public/wil-ai-infrastructure-cache');
const sources=loadInput().sources.filter(s=>s.sourceHash);
const results=sources.map(s=>{
  const file=path.join(cache,'objects',s.sourceHash.slice(0,2),s.sourceHash);
  if(!fs.existsSync(file))return {sourceId:s.sourceId,sourceVersion:s.sourceVersion,status:'MISSING_OBJECT'};
  const bytes=fs.readFileSync(file),digest=createHash('sha256').update(bytes).digest('hex');
  return {sourceId:s.sourceId,sourceVersion:s.sourceVersion,sourceHash:s.sourceHash,status:digest===s.sourceHash&&bytes.length===s.byteSize?'HASH_MATCH':'CONTENT_MISMATCH',byteSize:bytes.length};
});
console.log(JSON.stringify({valid:results.every(r=>r.status==='HASH_MATCH'),objectCount:results.length,rawBytes:results.reduce((n,r)=>n+(r.byteSize??0),0),manifestHash:hash(results),results},null,2));
if(results.some(r=>r.status!=='HASH_MATCH'))process.exitCode=1;
