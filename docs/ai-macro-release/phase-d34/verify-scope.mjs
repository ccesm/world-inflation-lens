// D3.4 integration audit: protect latest production, original research and the D3.3 edition.
import assert from 'node:assert/strict'
import {readFile,writeFile} from 'node:fs/promises'
import {execFileSync} from 'node:child_process'
import {resolve} from 'node:path'
import {sha256,assertPublicationTree} from '../../../scripts/lib/aiMacroPublication.mjs'
const root=resolve(import.meta.dirname,'../../..')
const main='03413caa9868f4608e828ad94d3f57b490e03380',previous='abcedb2c049b01769fb0c5423370661e466b4ee5',merge='93dc3d5'
const git=(...a)=>execFileSync('git',a,{cwd:root,maxBuffer:30_000_000}),lines=x=>x.toString().trim().split('\n').filter(Boolean),file=p=>readFile(resolve(root,p)),original=(r,p)=>git('show',`${r}:${p}`)
for(const ref of [main,previous,merge])assert.equal(git('merge-base',ref,'HEAD').toString().trim(),git('rev-parse',ref).toString().trim())
const anchors=['package.json','package-lock.json','src/App.jsx','src/utils/routing.js','src/data/researchArchitecture.js','src/data/researchLinks.js','src/i18n/architecture.js','scripts/tests/signal-pipeline.test.mjs','scripts/tests/signal-public.test.mjs']
const protectedFiles=lines(git('ls-tree','-r','--name-only',main)).filter(p=>!anchors.includes(p)),data=[]
for(const p of protectedFiles){const b=await file(p);assert.deepEqual(b,original(main,p),'production preservation: '+p);if(p.startsWith('data/'))data.push({path:p,sha256:sha256(b)})}
for(const p of ['package-lock.json','src/data/researchArchitecture.js','src/data/researchLinks.js','scripts/tests/signal-pipeline.test.mjs','scripts/tests/signal-public.test.mjs'])assert.deepEqual(await file(p),original(previous,p),'D3.3 retained integration: '+p)
const pkg=JSON.parse(original(main,'package.json'));pkg.scripts.verify+=' && node scripts/verify-ai-macro.mjs';assert.deepEqual(JSON.parse(await file('package.json')),pkg)
assert.equal((await file('src/App.jsx')).toString().split('\n').filter(x=>!x.includes('AiMacro')).join('\n'),original(main,'src/App.jsx').toString())
assert.equal((await file('src/utils/routing.js')).toString().replace(", 'research/ai-macro'",''),original(main,'src/utils/routing.js').toString())
let architecture=(await file('src/i18n/architecture.js')).toString();for(const text of ["'research/ai-macro': 'AI Macro Research', ","'research/ai-macro': 'AI 宏观研究', ","['#/research/ai-macro', 'AI 宏观研究', 'AI Macro Research'], "])architecture=architecture.replace(text,'');assert.equal(architecture,original(main,'src/i18n/architecture.js').toString())
const newerMainPaths=new Set(lines(git('diff','--name-only',previous,main)))
const changed=[...new Set([...lines(git('diff','--name-only',previous)),...lines(git('ls-files','--others','--exclude-standard'))])]
for(const p of changed)assert(newerMainPaths.has(p)||p.startsWith('docs/ai-macro-release/phase-d34/'),'unexpected D3.4 scope: '+p)
for(const p of lines(git('ls-tree','-r','--name-only',previous,'docs/ai-macro','docs/ai-macro-release','src/data/ai-macro','src/pages/AiMacro.jsx','src/i18n/aiMacro.js','src/ai-macro.css','scripts/lib/aiMacroPublication.mjs','scripts/verify-ai-macro.mjs','scripts/verify-ai-macro-browser.mjs','scripts/ai-macro-projection.mjs')))assert.deepEqual(await file(p),original(previous,p),'unchanged D3.3 research, contract or evidence: '+p)
const publicTree=await assertPublicationTree(resolve(root,'public')),buildTree=await assertPublicationTree(resolve(root,'dist'),{build:true})
const result={schemaVersion:'D34_SCOPE_1',main,previous,merge:git('rev-parse',merge).toString().trim(),result:'PASS',protectedProductionFiles:protectedFiles.length,productionDataFiles:data.length,productionDataIdentities:data,SignalProductionIdentical:true,workflowsNotificationsWeeklyDigestIdentical:true,originalD33PublicationAndEvidenceIdentical:true,manualScreenReaderAcceptance:'DEFERRED_BY_OWNER',changedPaths:changed.sort(),publicTree,buildTree}
if(process.env.WIL_D34_WRITE_EVIDENCE==='1')await writeFile(resolve(root,'docs/ai-macro-release/phase-d34/scope-evidence.json'),JSON.stringify(result,null,2)+'\n')
console.log(JSON.stringify({result:result.result,main,merge:result.merge,protectedProductionFiles:protectedFiles.length,productionDataFiles:data.length,publicFiles:publicTree.files.length,buildFiles:buildTree.files.length,publicationUnchanged:true}))
