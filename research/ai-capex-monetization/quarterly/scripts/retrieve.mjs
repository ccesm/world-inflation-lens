import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {bytes,date} from '../../scripts/contract.mjs';
export const sha256 = b=>createHash('sha256').update(b).digest('hex');
const hosts={MSFT:['www.microsoft.com','cdn-dynmedia-1.microsoft.com'],GOOG:['abc.xyz','www.abc.xyz','s206.q4cdn.com'],AMZN:['ir.aboutamazon.com','s2.q4cdn.com'],META:['investor.atmeta.com','s21.q4cdn.com']};
export function officialURL(company,url,delegation=null){
 const u=new URL(url);if(!hosts[company]||u.protocol!=='https:'||u.username||u.password||u.port&&u.port!=='443')throw Error('OFFICIAL_HOST');
 if(['data.sec.gov','www.sec.gov'].includes(u.hostname))return u.href;
 if(!hosts[company]?.includes(u.hostname))throw Error('OFFICIAL_HOST');
 if(/q4cdn\.com$/.test(u.hostname)||u.hostname==='cdn-dynmedia-1.microsoft.com'){
  if(!delegation||!hosts[company].includes(new URL(delegation).hostname)||/q4cdn/.test(new URL(delegation).hostname))throw Error('OFFICIAL_DELEGATION');
  const tenant={GOOG:'/479360582/',AMZN:'/299287126/',META:'/399680738/'}[company];if(tenant&&!u.pathname.startsWith(tenant))throw Error('CDN_TENANT');
 }
 return u.href;
}
export function validateSource(s){
 if(!/^[a-z0-9-]+$/.test(s.sourceId)||!s.publisher||!s.documentType||!s.locator)throw Error('SOURCE_IDENTITY');officialURL(s.company,s.url,s.delegatedBy);date(s.publicationDate);date(s.periodEnd);
 if(!['Microsoft','Alphabet','Amazon','Meta'].includes(s.publisher)||({MSFT:'Microsoft',GOOG:'Alphabet',AMZN:'Amazon',META:'Meta'})[s.company]!==s.publisher)throw Error('PUBLISHER_IDENTITY');
 const u=new URL(s.url);if(['data.sec.gov','www.sec.gov'].includes(u.hostname)){
  const cik=({MSFT:789019,GOOG:1652044,AMZN:1018724,META:1326801})[s.company];
  const fact=u.pathname.match(/^\/api\/xbrl\/companyfacts\/CIK(\d{10})\.json$/),filing=u.pathname.match(/^\/Archives\/edgar\/data\/(\d+)\/(\d{18})\//);
  if(!(fact&&Number(fact[1])===cik||filing&&Number(filing[1])===cik))throw Error('SEC_URL_IDENTITY');
  if(filing&&(!s.accession||filing[2]!==s.accession.replaceAll('-','')))throw Error('SEC_ACCESSION_IDENTITY');
 }

 if(s.issuerCik&&s.issuerCik!==({MSFT:'0000789019',GOOG:'0001652044',AMZN:'0001018724',META:'0001326801'})[s.company])throw Error('ISSUER_CIK');
 const timestamp=s.retrievedAt;date(timestamp?.slice(0,10));if(!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,9})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(timestamp)||!Number.isFinite(Date.parse(timestamp))||timestamp.slice(0,10)<s.publicationDate)throw Error('RETRIEVAL_CHRONOLOGY');
 if(s.periodEnd>s.publicationDate)throw Error('SOURCE_CHRONOLOGY');
 if(s.accession!==null&&!/^\d{10}-\d{2}-\d{6}$/.test(s.accession))throw Error('ACCESSION');
 if(!['ORIGINAL','AMENDED','UNKNOWN'].includes(s.amendmentStatus))throw Error('AMENDMENT');
 if(!/^[a-f0-9]{64}$/.test(s.sha256)||!Number.isInteger(s.byteSize)||s.byteSize<=0||!s.mimeType)throw Error('RAW_IDENTITY');
 return true;
}
// One request per second, no retries; blocked hosts are suppressed for the rest of the run.
export class Retriever {
 constructor({cache,userAgent,fetcher=fetch,clock=()=>Date.now(),sleep=ms=>new Promise(r=>setTimeout(r,ms))}){
  if(!cache||!userAgent||!/WorldInflationLens|research/i.test(userAgent)||!/(contact|@)/i.test(userAgent))throw Error('USER_AGENT');
  this.cache=cache;this.userAgent=userAgent;this.fetcher=fetcher;this.clock=clock;this.sleep=sleep;this.last=null;this.blocked=new Set();
 }
 async get(s,{expectedHash=null}={}){
  officialURL(s.company,s.url,s.delegatedBy);const host=new URL(s.url).hostname;
  if(expectedHash&&!/^[a-f0-9]{64}$/.test(expectedHash))throw Error('EXPECTED_HASH');
  if(expectedHash){const file=path.join(this.cache,'objects',expectedHash.slice(0,2),expectedHash);if(fs.existsSync(file)){const raw=fs.readFileSync(file);if(sha256(raw)!==expectedHash)throw Error('CACHE_CORRUPT');return{status:'CACHE_VALIDATED',raw,sha256:expectedHash,byteSize:raw.length};}}
  if(this.blocked.has(host))return{status:'ACCESS_BLOCKED',attempted:false};
  if(this.last!==null)await this.sleep(Math.max(0,1000-(this.clock()-this.last)));this.last=this.clock();
  let response,resolvedUrl=s.url;try{for(let redirects=0;redirects<4;redirects++){response=await this.fetcher(resolvedUrl,{headers:{'User-Agent':this.userAgent,'Accept':'application/json,text/html,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'},redirect:'manual',signal:AbortSignal.timeout(30000)});if(![301,302,303,307,308].includes(response.status))break;if(redirects===3)throw Error('REDIRECT_LIMIT');resolvedUrl=officialURL(s.company,new URL(response.headers.get('location'),resolvedUrl).href,s.delegatedBy);if(this.blocked.has(new URL(resolvedUrl).hostname))throw Error('BLOCKED_REDIRECT');await this.sleep(1000);this.last=this.clock();}}catch(e){return{status:'FAILED_WITH_LAST_VALID',error:e.message};}
  if([403,429].includes(response.status)){this.blocked.add(host);this.blocked.add(new URL(resolvedUrl).hostname);return{status:'ACCESS_BLOCKED',httpStatus:response.status,retryAfter:response.headers.get('retry-after'),attempted:true};}
  if(!response.ok)return{status:'FAILED_WITH_LAST_VALID',httpStatus:response.status};
  const raw=Buffer.from(await response.arrayBuffer());if(!raw.length||raw.length>25000000)throw Error('RAW_SIZE');
  const digest=sha256(raw);if(expectedHash&&digest!==expectedHash)return{status:'SOURCE_CHANGED',sha256:digest,expectedHash};
  const dir=path.join(this.cache,'objects',digest.slice(0,2));fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,digest);
  if(!fs.existsSync(file))fs.writeFileSync(file,raw,{flag:'wx'});
  const receipt={sourceId:s.sourceId,url:s.url,resolvedUrl,retrievedAt:new Date(this.clock()).toISOString(),sha256:digest,byteSize:raw.length,mimeType:response.headers.get('content-type'),status:'RETRIEVED'};
  fs.mkdirSync(path.join(this.cache,'receipts'),{recursive:true});fs.writeFileSync(path.join(this.cache,'receipts',`${s.sourceId}-${digest}.json`),bytes(receipt));return{...receipt,raw};
 }
}
