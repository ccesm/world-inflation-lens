// Stage only. Reviewed publication vintages never silently join the weekly ingestion.
import {readFile,writeFile,mkdir} from 'node:fs/promises'
import {resolve} from 'node:path'
import assert from 'node:assert/strict'
import {publicationSnapshots,validatePublications,parseBankDeposits} from './lib/digital-money.mjs'
const arg=name=>{const i=process.argv.indexOf(name);assert.ok(i>=0&&process.argv[i+1],`${name} required`);return resolve(process.argv[i+1])}
const input=arg('--input-dir'),output=arg('--output-dir')
assert.notEqual(output,resolve('data/digital-money'),'Stage a candidate outside production')
const excerpts=JSON.parse(await readFile(resolve('data/digital-money/source-excerpts.json'),'utf8'))
const publications=validatePublications(publicationSnapshots(excerpts),excerpts)
const bank=parseBankDeposits(await readFile(resolve(input,'wil-DPSACBM027SBOG.html'),'utf8'))
await mkdir(output,{recursive:true})
for(const [file,value] of Object.entries({...publications,'bank-deposits':bank}))await writeFile(resolve(output,`${file}.json`),JSON.stringify(value,null,2)+'\n')
console.log('Validated independent digital-money candidate; production not modified')
