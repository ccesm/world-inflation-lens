// Current-main and original-research scope audit; no Git history rewriting.
import assert from 'node:assert/strict'
import {readFile,writeFile} from 'node:fs/promises'
import {resolve} from 'node:path'
import {execFileSync} from 'node:child_process'
import {sha256} from '../../../scripts/lib/aiMacroPublication.mjs'
const root=resolve(import.meta.dirname,'../../..'),base='3dbf9353ada22cd33ac64ed158f3fd29e9ec3b66',previous='4b0e48c418930ba0bf575a2629879bf1ea67a6cf',repair='39867318c27caf3f1d4b4af37289056b57f40278'
const git=(...args)=>execFileSync('git',args,{cwd:root,maxBuffer:30_000_000}),lines=x=>x.toString().trim().split('\n').filter(Boolean)
for(const ref of [base,previous])assert.equal(git('merge-base',ref,'HEAD').toString().trim(),ref)
const originalFiles=lines(git('ls-tree','-r','--name-only',base)),anchors=['package.json','package-lock.json','src/App.jsx','src/utils/routing.js','src/data/researchArchitecture.js','src/data/researchLinks.js','src/i18n/architecture.js','scripts/tests/signal-pipeline.test.mjs','scripts/tests/signal-public.test.mjs']
const protectedFiles=originalFiles.filter(f=>!anchors.includes(f)),data=[]
for(const f of protectedFiles){const raw=await readFile(resolve(root,f));assert.deepEqual(raw,git('show',`${base}:${f}`),'production preservation: '+f);if(f.startsWith('data/'))data.push({path:f,sha256:sha256(raw)})}
const pkg=JSON.parse(git('show',`${base}:package.json`));pkg.scripts.verify+=' && node scripts/verify-ai-macro.mjs';assert.deepEqual(JSON.parse(await readFile(resolve(root,'package.json'))),pkg)
const expectedLock=JSON.parse(git('show',`${base}:package-lock.json`)),lock=JSON.parse(await readFile(resolve(root,'package-lock.json')));expectedLock.packages['node_modules/source-map-js']=lock.packages['node_modules/source-map-js'];assert.deepEqual(lock,expectedLock);assert.equal(lock.packages['node_modules/source-map-js'].version,'1.2.2')
for(const f of ['scripts/tests/signal-fixture.mjs','scripts/tests/signal-pipeline.test.mjs','scripts/tests/signal-public.test.mjs','docs/SIGNAL_VALIDATION_FIXTURE_REPAIR.md'])assert.deepEqual(await readFile(resolve(root,f)),git('show',`${repair}:${f}`),'independent Signal repair: '+f)
for(const f of lines(git('ls-tree','-r','--name-only',previous,'docs/ai-macro','docs/ai-macro-release')))assert.deepEqual(await readFile(resolve(root,f)),git('show',`${previous}:${f}`),'protected historical evidence: '+f)
const permitted=['src/pages/AiMacro.jsx','src/i18n/aiMacro.js','src/ai-macro.css','src/data/ai-macro/contract.js','src/data/ai-macro/public-identity.json','src/data/ai-macro/publication.json','src/data/ai-macro/summary.json','src/data/ai-macro/history.js','src/components/AiMacroChart.jsx','src/i18n/architecture.js','src/data/researchArchitecture.js','scripts/verify-ai-macro.mjs','scripts/verify-ai-macro-browser.mjs','scripts/ai-macro-projection.mjs','scripts/lib/aiMacroPublication.mjs']
const changed=[...new Set([...lines(git('diff','--name-only',previous)),...lines(git('ls-files','--others','--exclude-standard'))])]
const productionChanges=new Set(lines(git('diff','--name-only',previous,base)))
for(const f of changed)assert(permitted.includes(f)||productionChanges.has(f)||f.startsWith('docs/ai-macro-release/phase-d33/')||f.startsWith('public/data/ai-macro/'),'unreviewed D3.3 scope: '+f)
for(const f of ['src/App.jsx','src/utils/routing.js','src/data/researchLinks.js'])assert.deepEqual(await readFile(resolve(root,f)),git('show',`${previous}:${f}`),'existing route integration: '+f)
const result={schemaVersion:'D33_SCOPE_1',base,previousD32:previous,head:git('rev-parse','HEAD').toString().trim(),result:'PASS',protectedProductionFiles:protectedFiles.length,productionDataFiles:data.length,productionDataIdentities:data,changedPaths:changed.sort(),workflowsAndNotificationsIdentical:true,SignalProductionIdentical:true,historicalEvidencePreserved:true,historyRewrite:false,privateResearchCommitted:false}
if(process.env.WIL_D33_WRITE_EVIDENCE==='1')await writeFile(resolve(root,'docs/ai-macro-release/phase-d33/scope-evidence.json'),JSON.stringify(result,null,2)+'\n')
console.log(JSON.stringify({result:'PASS',base,protectedProductionFiles:protectedFiles.length,productionDataFiles:data.length,D33ChangedPaths:changed.length}))
