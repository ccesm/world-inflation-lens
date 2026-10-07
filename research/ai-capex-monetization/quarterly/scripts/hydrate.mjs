// Hydrate only pinned official inputs. New bytes are candidates, never automatic acceptance.
import fs from 'node:fs';import path from 'node:path';
import {read} from './io.mjs';import {Retriever} from './retrieve.mjs';
import {bytes} from '../../scripts/contract.mjs';
const args=process.argv.slice(2);if(args.some(a=>a!=='--check-remote'))throw Error('Unknown option');
const cache=process.env.WIL_AI_CAPEX_CACHE;if(!cache)throw Error('WIL_AI_CAPEX_CACHE required outside Git');
const retriever=new Retriever({cache,userAgent:'WorldInflationLens/Phase2A research (contact: https://github.com/ccesm/world-inflation-lens/issues)'});const results=[];
for(const s of read('source-vintage-manifest').sources){
 try{const {raw,...r}=await retriever.get(s,{expectedHash:args.includes('--check-remote')?null:s.sha256});results.push({sourceId:s.sourceId,...r,acceptedIdentityMatches:r.sha256===s.sha256&&r.byteSize===s.byteSize,requiresReview:r.sha256!==s.sha256||r.byteSize!==s.byteSize});}
 catch(e){results.push({sourceId:s.sourceId,status:'FAILED_WITH_LAST_VALID',error:e.message,acceptedNormalizedInputPreserved:true});}
}
fs.mkdirSync(path.join(cache,'runs'),{recursive:true});const run={monitorRunAt:new Date().toISOString(),purpose:'HYDRATION_OR_CANDIDATE_DISCOVERY_NOT_ECONOMIC_ACCEPTANCE',results};
fs.writeFileSync(path.join(cache,'runs','latest-hydration.json'),bytes(run));
console.log(JSON.stringify({sources:results.length,validated:results.filter(r=>r.acceptedIdentityMatches).length,blocked:results.filter(r=>r.status==='ACCESS_BLOCKED').length,changedOrUnavailable:results.filter(r=>!r.acceptedIdentityMatches).length}));
if(results.some(r=>!r.acceptedIdentityMatches))process.exitCode=1;
