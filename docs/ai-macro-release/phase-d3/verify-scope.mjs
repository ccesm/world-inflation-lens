// Release preparation audit, deliberately not part of ordinary shallow-clone verification.
import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {readFile} from 'node:fs/promises'
import {resolve} from 'node:path'
import {createHash} from 'node:crypto'
const root=resolve(import.meta.dirname,'../../..')
const base='4a10e16f2d956fc25262c55da16a10c8d36fedab',source='9c65c0cfdf1dc5ac02906a508a5bd9b3d61b29b3'
const git=(...args)=>execFileSync('git',args,{cwd:root,maxBuffer:20*1024*1024})
const lines=b=>b.toString().trim().split('\n').filter(Boolean),hash=b=>createHash('sha256').update(b).digest('hex')
assert.equal(git('merge-base',base,'HEAD').toString().trim(),base,'D3 must descend from current production base')
const anchors=['package.json','package-lock.json','src/App.jsx','src/utils/routing.js','src/data/researchArchitecture.js','src/data/researchLinks.js','src/i18n/architecture.js']
const existing=new Set(lines(git('ls-tree','-r','--name-only',base)))
const changed=[...new Set([...lines(git('diff','--name-only',base)),...lines(git('ls-files','--others','--exclude-standard'))])].sort()
const prefixes=['src/data/ai-macro/','docs/ai-macro/','docs/ai-macro-release/phase-d3/','public/data/ai-macro/']
const additions=['src/ai-macro.css','src/components/AiMacroChart.jsx','src/pages/AiMacro.jsx','src/i18n/aiMacro.js','scripts/ai-macro-projection.mjs','scripts/verify-ai-macro.mjs','scripts/verify-ai-macro-browser.mjs','docs/ai-macro-release/phase-d2-1/publication-policy.json','docs/ai-macro-release/phase-d2-1/publication-safety.mjs','docs/ai-macro-release/phase-d2/PHASE_D3_DEPLOYMENT_PLAN.md']
for(const file of changed)assert(existing.has(file)?anchors.includes(file):additions.includes(file)||prefixes.some(p=>file.startsWith(p)),`Out-of-scope change: ${file}`)
const pkg=JSON.parse(git('show',base+':package.json')),actualPkg=JSON.parse(await readFile(resolve(root,'package.json')))
pkg.scripts.verify+=' && node scripts/verify-ai-macro.mjs';assert.deepEqual(actualPkg,pkg,'Only append macro verification, preserve version/dependencies')
const lock=JSON.parse(git('show',base+':package-lock.json')),actualLock=JSON.parse(await readFile(resolve(root,'package-lock.json')))
lock.packages['node_modules/source-map-js']=actualLock.packages['node_modules/source-map-js'];assert.deepEqual(actualLock,lock,'Only source-map-js lock entry may change');assert.equal(actualLock.packages['node_modules/source-map-js'].version,'1.2.2')
const selected=changed.filter(f=>f.startsWith('src/data/ai-macro/')||['src/ai-macro.css','src/components/AiMacroChart.jsx','src/pages/AiMacro.jsx','src/i18n/aiMacro.js','scripts/ai-macro-projection.mjs','scripts/verify-ai-macro-browser.mjs',...anchors.filter(f=>f.startsWith('src/'))].includes(f)||f.startsWith('public/data/ai-macro/')||f.startsWith('docs/ai-macro-release/phase-d2-1/')||f.startsWith('docs/ai-macro/'))
const identities=[]
for(const file of selected){const raw=await readFile(resolve(root,file));assert.deepEqual(raw,git('show',source+':'+file),`D2.1 byte identity: ${file}`);identities.push({path:file,sha256:hash(raw),bytes:raw.length})}
console.log(JSON.stringify({schemaVersion:'D3_SCOPE_AUDIT_1',baseSHA:base,sourceSHA:source,changedFiles:changed,existingAnchors:changed.filter(f=>existing.has(f)),addedFiles:changed.filter(f=>!existing.has(f)),D21ByteIdentities:identities,protectedTrackedFiles:existing.size-anchors.length,protectedMainNamespaces:['data/','.github/','research/','existing production modules outside seven reviewed anchors'],result:'PASS'},null,2))
