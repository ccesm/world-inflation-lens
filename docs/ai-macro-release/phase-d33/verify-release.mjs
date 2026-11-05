import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
import {join,resolve} from 'node:path'
import {readFile} from 'node:fs/promises'
import {assertPublicationTree} from '../../../scripts/lib/aiMacroPublication.mjs'
import {verifyPublication} from '../../../src/data/ai-macro/contract.js'
const root=resolve(import.meta.dirname,'../../..')
await verifyPublication(JSON.parse(await readFile(join(root,'src/data/ai-macro/publication.json'))))
const result=spawnSync(process.execPath,['--test','docs/ai-macro-release/phase-d33/test-publication.mjs'],{cwd:root,stdio:'inherit'})
assert.equal(result.status,0,'Narrative publication acceptance failed')
for(const [folder,build]of [['public',false],['dist',true]]){const result=await assertPublicationTree(join(root,folder),{build});console.log(`PASS D3.3 ${folder}: ${result.files.length} reviewed files; no excluded macro numerical histories.`)}
console.log('PASS D3.3 bilingual research publication, authenticated narrative/provenance, external provider access, no public macro history. Formal screen-reader acceptance remains DEFERRED_BY_OWNER.')
