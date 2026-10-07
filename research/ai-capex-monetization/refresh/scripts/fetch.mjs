import fs from 'node:fs';
import path from 'node:path';
import {officialURL,sha256} from '../../quarterly/scripts/retrieve.mjs';
import {bytes} from '../../scripts/contract.mjs';
import {issuers,limits,userAgent} from './config.mjs';
export function permitted(company,url,delegation=null){
 if(delegation){const parent=new URL(delegation);if(parent.protocol!=='https:'||parent.username||parent.password||parent.port&&parent.port!=='443')throw Error('OFFICIAL_DELEGATION');officialURL(company,delegation);}
 const checked=officialURL(company,url,delegation),u=new URL(checked);
 if(u.hostname==='data.sec.gov'){
  const cik=issuers[company].cik;
  if(![new RegExp(`^/submissions/CIK${cik}(?:-submissions-\\d{3})?\\.json$`),new RegExp(`^/api/xbrl/companyfacts/CIK${cik}\\.json$`)].some(r=>r.test(u.pathname)))throw Error('SEC_ISSUER_PATH');
 }
 if(u.hostname==='www.sec.gov'&&!u.pathname.startsWith(`/Archives/edgar/data/${Number(issuers[company].cik)}/`))throw Error('SEC_ISSUER_PATH');
 return checked;
}
export function cacheObject(cache,digest,expectedSize=null){
 const file=path.join(cache,'objects',digest.slice(0,2),digest);
 if(!/^[a-f0-9]{64}$/.test(digest)||!fs.existsSync(file))throw Error('CACHE_MISSING');
 const raw=fs.readFileSync(file);if(sha256(raw)!==digest||expectedSize!==null&&raw.length!==expectedSize)throw Error('CACHE_CORRUPT');return raw;
}
export function putObject(cache,raw){
 const digest=sha256(raw),dir=path.join(cache,'objects',digest.slice(0,2)),file=path.join(dir,digest);fs.mkdirSync(dir,{recursive:true});
 if(fs.existsSync(file)){if(!fs.readFileSync(file).equals(raw))throw Error('IMMUTABLE_CACHE_CORRUPTION');}else fs.writeFileSync(file,raw,{flag:'wx'});
 return digest;
}
// No retry/proxy bypass. Size bounded during streaming, not after arrayBuffer allocation.
export class SafeFetcher{
 constructor({cache,fetcher=fetch,clock=()=>Date.now(),sleep=ms=>new Promise(r=>setTimeout(r,ms)),policy=limits}={}){this.cache=cache;this.fetcher=fetcher;this.clock=clock;this.sleep=sleep;this.policy=policy;this.last=null;this.blocked=new Map();}
 async get(source){
  let url;try{url=permitted(source.company,source.url,source.delegatedBy);}catch(e){return {status:'REJECTED',error:e.message};}
  for(let n=0;n<=this.policy.redirects;n++){
   const host=new URL(url).hostname;
   if(this.blocked.has(host))return {status:'ACCESS_BLOCKED',attempted:false,...this.blocked.get(host)};
   if(this.last!==null)await this.sleep(Math.max(0,this.policy.minIntervalMs-(this.clock()-this.last)));
   this.last=this.clock();const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),this.policy.timeoutMs);
   try{
    const res=await this.fetcher(url,{headers:{'User-Agent':userAgent,Accept:'application/json,text/html,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'},redirect:'manual',signal:controller.signal});
    if([403,429].includes(res.status)){
     const info={httpStatus:res.status,retryAfter:res.headers.get('retry-after')};this.blocked.set(host,info);await res.body?.cancel();return {status:'ACCESS_BLOCKED',attempted:true,...info};
    }
    if([301,302,303,307,308].includes(res.status)){
     await res.body?.cancel();if(n===this.policy.redirects)throw Error('REDIRECT_LIMIT');
     url=permitted(source.company,new URL(res.headers.get('location'),url).href,source.delegatedBy);continue;
    }
    if(!res.ok){await res.body?.cancel();return {status:'FAILED_WITH_LAST_VALID',httpStatus:res.status};}
    const length=Number(res.headers.get('content-length'));if(length>this.policy.maxBytes)throw Error('MAX_RESPONSE_SIZE');
    const chunks=[];let size=0;
    for await(const chunk of res.body??[]){size+=chunk.length;if(size>this.policy.maxBytes){controller.abort();throw Error('MAX_RESPONSE_SIZE');}chunks.push(chunk);}
    const raw=Buffer.concat(chunks);if(!raw.length)throw Error('EMPTY_RESPONSE');
    const rawDigest=sha256(raw),rawArtifactNew=!fs.existsSync(path.join(this.cache,'objects',rawDigest.slice(0,2),rawDigest));const digest=putObject(this.cache,raw);
    const receipt={company:source.company,sourceId:source.sourceId,url:source.url,resolvedUrl:url,canonicalOfficialHost:new URL(url).hostname,publicationDate:source.publicationDate??null,economicPeriod:source.periodEnd??null,retrievedAt:new Date(this.clock()).toISOString(),documentType:source.documentType,mimeType:res.headers.get('content-type')??'application/octet-stream',byteSize:size,sha256:digest,accession:source.accession??null,amendmentStatus:source.amendmentStatus??'UNKNOWN',retrievalResult:'FETCHED',rawArtifactNew};
    return {status:'FETCHED',receipt,raw};
   }catch(e){controller.abort();return {status:'FAILED_WITH_LAST_VALID',error:e.message};}finally{clearTimeout(timer);}
  }
 }
}
export function writeReceipt(cache,runId,receipt){
 const dir=path.join(cache,'receipts','phase2d',runId);fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,receipt.sourceId+'.json'),bytes(receipt));
}
