// D3.2 synchronization audit; historical D3/D2.1 reports retain their original baselines.
import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {readFile,writeFile} from 'node:fs/promises'
import {resolve} from 'node:path'
import {createHash} from 'node:crypto'
const root=resolve(import.meta.dirname,'../../..')
const base='f9f5ba54a6ec795938cdedd5a7e984aabeec97af', original='4f94726f7166542f42d046499748de00084b3b92', repair='39867318c27caf3f1d4b4af37289056b57f40278'
const git=(...args)=>execFileSync('git',args,{cwd:root,maxBuffer:30_000_000})
const lines=b=>b.toString().trim().split('\n').filter(Boolean)
const sha=b=>createHash('sha256').update(b).digest('hex')
const full=ref=>git('rev-parse',ref).toString().trim()
const baseSHA=full(base)
assert.equal(git('merge-base',baseSHA,'HEAD').toString().trim(),baseSHA)
assert.equal(git('merge-base',original,'HEAD').toString().trim(),original)
assert.equal(git('merge-base',repair,'HEAD').toString().trim(),repair)
const baseline=lines(git('ls-tree','-r','--name-only',baseSHA))
const anchors=['package.json','package-lock.json','src/App.jsx','src/utils/routing.js','src/data/researchArchitecture.js','src/data/researchLinks.js','src/i18n/architecture.js','scripts/tests/signal-pipeline.test.mjs','scripts/tests/signal-public.test.mjs']
const protectedFiles=baseline.filter(f=>!anchors.includes(f)), identities=[]
for(const file of protectedFiles)assert.deepEqual(await readFile(resolve(root,file)),git('show',baseSHA+':'+file),'production preservation: '+file)
const pkg=JSON.parse(git('show',baseSHA+':package.json'));pkg.scripts.verify+=' && node scripts/verify-ai-macro.mjs'
assert.deepEqual(JSON.parse(await readFile(resolve(root,'package.json'))),pkg)
const oldLock=JSON.parse(git('show',baseSHA+':package-lock.json')),lock=JSON.parse(await readFile(resolve(root,'package-lock.json')))
oldLock.packages['node_modules/source-map-js']=lock.packages['node_modules/source-map-js'];assert.deepEqual(lock,oldLock);assert.equal(lock.packages['node_modules/source-map-js'].version,'1.2.2')
for(const file of anchors.filter(f=>f.startsWith('src/')))assert.deepEqual(await readFile(resolve(root,file)),git('show',original+':'+file),'original integration anchor: '+file)
// Explicit original macro namespaces, independent of merge parent availability.
const macro=lines(git('ls-tree','-r','--name-only',original)).filter(f=>f.startsWith('src/data/ai-macro/')||f.startsWith('public/data/ai-macro/')||f.startsWith('docs/ai-macro/')||f.startsWith('docs/ai-macro-release/phase-d2-1/')||['src/ai-macro.css','src/pages/AiMacro.jsx','src/components/AiMacroChart.jsx','src/i18n/aiMacro.js','scripts/ai-macro-projection.mjs','scripts/verify-ai-macro.mjs','scripts/verify-ai-macro-browser.mjs'].includes(f))
for(const file of macro){const raw=await readFile(resolve(root,file));assert.deepEqual(raw,git('show',original+':'+file),'frozen D3 asset: '+file);identities.push({path:file,sha256:sha(raw),bytes:raw.length})}
for(const file of ['scripts/tests/signal-fixture.mjs','scripts/tests/signal-pipeline.test.mjs','scripts/tests/signal-public.test.mjs','docs/SIGNAL_VALIDATION_FIXTURE_REPAIR.md'])assert.deepEqual(await readFile(resolve(root,file)),git('show',repair+':'+file),'independent repair: '+file)
const known=new Set([...baseline,...lines(git('ls-tree','-r','--name-only',original)),'scripts/tests/signal-fixture.mjs','docs/SIGNAL_VALIDATION_FIXTURE_REPAIR.md'])
for(const file of [...lines(git('diff','--name-only',baseSHA)),...lines(git('ls-files','--others','--exclude-standard'))])assert(known.has(file)||file.startsWith('docs/ai-macro-release/phase-d3/'),'unreviewed addition: '+file)
const dataFiles=protectedFiles.filter(f=>f.startsWith('data/'))
const result={schemaVersion:'D32_SCOPE_AUDIT_1',baseSHA,originalD3:original,repairSHA:repair,auditedHead:full('HEAD'),result:'PASS',protectedProductionFiles:protectedFiles.length,productionDataFiles:dataFiles.length,productionDataIdentities:await Promise.all(dataFiles.map(async file=>({path:file,sha256:sha(await readFile(resolve(root,file)))}))),frozenMacroIdentities:identities,workflowsIdentical:true,signalProductionIdentical:true,permissionsIdentical:true}
if(process.env.WIL_D32_WRITE_EVIDENCE==='1')await writeFile(resolve(root,'docs/ai-macro-release/phase-d3/d32-scope-evidence.json'),JSON.stringify(result,null,2)+'\n')
console.log(JSON.stringify({result:'PASS',baseSHA,auditedHead:result.auditedHead,productionDataFiles:dataFiles.length,protectedProductionFiles:protectedFiles.length,frozenMacroFiles:identities.length}))
