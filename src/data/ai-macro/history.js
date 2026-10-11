import { digest, validHistory, validSummary, verifySummary } from './contract.js'
const cache=new Map()
export async function loadHistory(summary,{baseURL=import.meta.env?.BASE_URL||'/world-inflation-lens/',fetchImpl=globalThis.fetch,cryptoImpl=globalThis.crypto}={}){
 if(!validSummary(summary))return Promise.reject(Error('Invalid macro summary'))
 await verifySummary(summary,cryptoImpl)
 const key=summary.historyArtifact.sha256
 if(cache.has(key))return cache.get(key)
 const pending=(async()=>{
  const response=await fetchImpl(`${baseURL}${summary.historyArtifact.path}`,{signal:AbortSignal.timeout(15000),credentials:'omit',redirect:'error'})
  if(!response.ok||!response.headers.get('content-type')?.includes('application/json'))throw Error('History response rejected')
  const declared=response.headers.get('content-length')
  if(declared&&Number(declared)>5000000)throw Error('History too large')
  const bytes=await response.arrayBuffer()
  if(bytes.byteLength!==summary.historyArtifact.byteSize||await digest(bytes,cryptoImpl)!==key)throw Error('History identity mismatch')
  const data=JSON.parse(new TextDecoder().decode(bytes))
  if(!validHistory(data,summary))throw Error('History schema mismatch')
  return data
 })()
 cache.set(key,pending)
 pending.catch(()=>{if(cache.get(key)===pending)cache.delete(key)})
 return pending
}
