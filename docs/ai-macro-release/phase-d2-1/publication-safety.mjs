import assert from 'node:assert/strict'
import {readFile,readdir} from 'node:fs/promises'
import {join,relative} from 'node:path'
import {hash,bytes,assertPublicRights} from '../../../scripts/ai-macro-projection.mjs'
import {verifySummary,validHistory} from '../../../src/data/ai-macro/contract.js'
export async function files(root){const result=[];for(const e of await readdir(root,{withFileTypes:true})){const p=join(root,e.name);if(e.isDirectory())result.push(...await files(p));else result.push(p)}return result}
// A qualitative SPF entry has a deliberately exact key set. Numeric payloads,
// including all-null placeholders, cannot be placed inside that entry.
export function assertNoSPF(text){
 assert(!text.includes('SPF10:US')&&!text.includes('2bef852b0b4c4365ce9d38796c408ecb2648f024b2cc1d40a8c1426afe62e2e5'),'Withheld SPF series/hash leaked')
 assert(!/SPF10.{0,100}(?:observations[\"']?\s*:\s*\[|(?:lastRecord|lastNonmissing)[\"']?\s*:\s*\{|(?:nativeChange|yearChange|value)[\"']?\s*[:=]\s*(?:null|-?\d))/s.test(text),'SPF numerical payload leaked')
 assert(!text.includes('Inflation.xlsx'),'SPF workbook embedded or linked')
}
export async function validatePublicTree(root,tree){
 const summary=JSON.parse(await readFile(join(root,'src/data/ai-macro/summary.json')))
 await verifySummary(summary)
 const review=JSON.parse(await readFile(join(root,'docs/ai-macro-release/phase-d2-1/publication-policy.json')))
 const historical=JSON.parse(await readFile(join(root,'docs/ai-macro/source-rights.json')))
 assertPublicRights(review,historical);assert.equal(summary.rightsHash,hash(bytes(review)))
 for(const source of summary.sources){const r=review.records.find(r=>r.sourceId===source.sourceId);assert.equal(source.sourceHash,r.sourceHash);assert.equal(source.attribution,r.attribution);assert.equal(source.rightsScope,review.intendedUse)}
 const raw=await readFile(join(tree,summary.historyArtifact.path))
 assert.equal(hash(raw),summary.historyArtifact.sha256);assert.equal(raw.length,summary.historyArtifact.byteSize);assert(validHistory(JSON.parse(raw),summary))
 const macroFiles=(await files(join(tree,'data/ai-macro'))).map(p=>relative(tree,p));assert.deepEqual(macroFiles,[summary.historyArtifact.path],'Only approved immutable history may be published')
 for(const file of await files(tree))if(/\.(?:json|js|html|csv|xlsx|xls|xml|txt|map)$/i.test(file)){assert(!/\.(xlsx|xls|map)$/i.test(file),'Unexpected workbook/map distributable');assertNoSPF(await readFile(file,'utf8'))}
 return summary
}
