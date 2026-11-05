// Build-time D3.3 minimization gate. It never reads or fetches source observations.
import {readFile,readdir,lstat} from 'node:fs/promises'
import {join,relative} from 'node:path'
import {createHash} from 'node:crypto'
import {gunzipSync} from 'node:zlib'
export const excludedHashes=new Set([
 '6bfbc2c89362cc39d3ddc7bd50044866d3251059998bcea76196878aa1dcfeb3',
 '09247e08d0a45ee96c74cf6ce0646d21bc2ef3e32ff78feb271ff1db07a27688',
 '5c8381bb1729570146b7ddcaf371251f9d1fa678daa1751cfd2c86222d371590',
 'ac85a5fe4455112f95f83ae2a650a637578480cf8ec1feba8cd52db15b642ec7',
 '115e07f822d1af2edb71d8ac20f081d3926bae8dcdf242e37ba786cd07e8449c',
])
export const sha256=x=>createHash('sha256').update(x).digest('hex')
const staticFiles=new Set(['favicon.svg','README.md','data/signal-engine/current.json'])
const forbiddenText=text=>/AI_MACRO_(?:HISTORY_[12]|PUBLIC_[12]|RELEASE_HOLD_1)/.test(text)||/\b(?:nativeBasePeriod|nativeIntervalDays|rawRowCount|yearChangeStatus|lastNonmissing)["']?\s*:/.test(text)||(/\b(?:seriesId)["']?\s*:\s*["'](?:EIA_COMM_[A-Z]+|CENSUS_DC|HENRY_HUB|PNFIC1|DFII10|NCBDBIQ027S|OPHNFB|ULCNFB|CPIAUCSL|PCEPILFE|SPF10):/.test(text)&&/["']?observations["']?\s*:\s*\[/.test(text))||/["']schemaVersion["']\s*:\s*["']C2\.1["']/.test(text)
export function assertNoExcludedHistory(bytes,label='asset',depth=0){
 if(excludedHashes.has(sha256(bytes)))throw Error('EXCLUDED_MACRO_BYTES:'+label)
 if(depth>2)throw Error('UNREVIEWED_NESTED_ENCODING:'+label)
 const text=Buffer.from(bytes).toString('utf8')
 if(forbiddenText(text)||forbiddenText(text.replaceAll('\\"','"')))throw Error('EXCLUDED_MACRO_HISTORY:'+label)
 if(bytes[0]===0x1f&&bytes[1]===0x8b)assertNoExcludedHistory(gunzipSync(bytes,{maxOutputLength:12_000_000}),label,depth+1)
 for(const match of text.matchAll(/[A-Za-z0-9+/]{160,}={0,2}/g)){
  const decoded=Buffer.from(match[0],'base64')
  if(excludedHashes.has(sha256(decoded))||forbiddenText(decoded.toString('utf8')))throw Error('ENCODED_MACRO_HISTORY:'+label)
 }
 return true
}
export async function assertPublicationTree(folder,{build=false}={}){
 const files=[]
 async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){
  const file=join(dir,entry.name),rel=relative(folder,file).split('\\').join('/'),stat=await lstat(file)
  if(stat.isSymbolicLink())throw Error('PUBLIC_SYMLINK:'+rel)
  if(entry.isDirectory()){if(/(?:^|\/)ai-macro(?:\/|$)/i.test(rel))throw Error('UNEXPECTED_MACRO_DATA_DIRECTORY:'+rel);await walk(file);continue}
  const permitted=staticFiles.has(rel)||(build&&(rel==='index.html'||/^assets\/[A-Za-z0-9_-]+\.(?:js|css)$/.test(rel)))
  if(!permitted)throw Error('UNREVIEWED_PUBLIC_ASSET:'+rel)
  const raw=await readFile(file);assertNoExcludedHistory(raw,rel)
  files.push({path:rel,bytes:raw.length,sha256:sha256(raw)})
 }}
 await walk(folder)
 return {result:'PASS',files:files.sort((a,b)=>a.path.localeCompare(b.path)),scope:'Excluded macro publication histories only; inherited economic modules remain'}
}
