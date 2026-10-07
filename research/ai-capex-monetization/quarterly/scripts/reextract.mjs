// Repeat the pinned raw extraction into an ignored candidate file; never overwrite reviewed inputs.
import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';
import {read,root} from './io.mjs';import {bytes} from '../../scripts/contract.mjs';import {sha256} from './retrieve.mjs';
const cache=process.env.WIL_AI_CAPEX_CACHE,python=process.env.WIL_AI_CAPEX_PYTHON||'python3';if(!cache)throw Error('WIL_AI_CAPEX_CACHE required');
const sources=read('source-vintage-manifest').sources;for(const s of sources){const b=fs.readFileSync(path.join(cache,'objects',s.sha256.slice(0,2),s.sha256));if(sha256(b)!==s.sha256||b.length!==s.byteSize)throw Error('RAW_IDENTITY');}
const out=path.join(root,'outputs');fs.mkdirSync(out,{recursive:true});const tablePlan=path.join(out,'extraction-plan.json');fs.writeFileSync(tablePlan,bytes(sources.filter(s=>['html','pdf'].includes(s.parser)).map(s=>({...s,status:'RETRIEVED'}))));
const run=(script,args)=>{const r=spawnSync(python,[path.join(root,'scripts',script),...args],{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr||'PYTHON_EXTRACTION_FAILED');return r.stdout;};
console.log(run('extract.py',[tablePlan,cache,path.join(out,'candidate-observations.json')]));
const source=sources.find(s=>s.parser==='xlsx');if(source){const file=path.join(out,'workbook-plan.json');fs.writeFileSync(file,bytes(source));run('workbook.py',[file,cache,path.join(out,'candidate-workbook.json')]);}
const candidate=JSON.parse(fs.readFileSync(path.join(out,'candidate-observations.json')));for(const s of candidate.sources){const expected=sources.find(p=>p.sourceId===s.sourceId);if(s.publicationDate!==expected.publicationDate||s.sha256!==expected.sha256)throw Error('SOURCE_DATELINE_IDENTITY');}const pinned=read('accepted-observations').observations;let matched=0;
for(const row of candidate.observations){const o=pinned.find(o=>o.observationId===row.observationId);if(!o||bytes(o)!==bytes(row))throw Error('CANDIDATE_MISMATCH: '+row.observationId);matched++;}
if(candidate.extractionReport.some(r=>r.error))throw Error('SOURCE_PARSE_FAILED');
const workbookRows=JSON.parse(fs.readFileSync(path.join(out,'candidate-workbook.json')));for(const row of workbookRows){const o=pinned.find(o=>o.observationId===row.observationId);if(!o||bytes(o)!==bytes(row))throw Error('WORKBOOK_CANDIDATE_MISMATCH');}
console.log(JSON.stringify({rawTableObservationsMatched:matched,workbookObservationsMatched:workbookRows.length,manualRawBoundObservations:pinned.length-matched-workbookRows.length,acceptedInputsModified:false}));
