import {hash,date} from '../../scripts/contract.mjs';
import {issuers,limits} from './config.mjs';
import {permitted} from './fetch.mjs';
export function submissions(company,doc,{asOf,known=[]}={}){
 date(asOf);if(Number(doc.cik)!==Number(issuers[company].cik))throw Error('SUBMISSIONS_ISSUER');
 const r=doc.filings?.recent??doc;if(!Array.isArray(r.accessionNumber))throw Error('SUBMISSIONS_SCHEMA');
 const keys=['form','filingDate','reportDate','primaryDocument'];for(const k of keys)if(r[k]?.length!==r.accessionNumber.length)throw Error('SUBMISSIONS_COLUMNS');
 const out=[];const seen=new Set();
 for(let i=0;i<r.accessionNumber.length;i++){
  const form=r.form[i];if(!['10-Q','10-K','10-Q/A','10-K/A','8-K','8-K/A'].includes(form))continue;
  const accession=r.accessionNumber[i],published=r.filingDate[i],end=r.reportDate[i];date(published);if(end)date(end);
  if(!/^\d{10}-\d{2}-\d{6}$/.test(accession)||!r.primaryDocument[i]||!/^[A-Za-z0-9_.-]+$/.test(r.primaryDocument[i]))throw Error('FILING_IDENTITY');
  if(published>asOf)continue;if(seen.has(accession))continue;seen.add(accession);
  const url=`https://www.sec.gov/Archives/edgar/data/${Number(issuers[company].cik)}/${accession.replaceAll('-','')}/${r.primaryDocument[i]}`;
  const isKnown=known.some(s=>s.company===company&&(s.accession===accession||s.url===url));
  // Old known filings are not downloaded wholesale; unknown post-boundary and amendments remain candidates.
  if(!end||end<'2026-06-30'&&!form.endsWith('/A')||isKnown)continue;
  out.push({company,sourceId:company.toLowerCase()+'-'+accession,url,accession,publicationDate:published,periodEnd:end,documentType:form.startsWith('10-Q')?'SEC_10Q':form.startsWith('10-K')?'SEC_10K':'SEC_8K',amendmentStatus:form.endsWith('/A')?'AMENDED':'ORIGINAL',parser:'html',status:'DISCOVERED',known:isKnown});
 }
 return out.sort((a,b)=>b.publicationDate.localeCompare(a.publicationDate)||a.sourceId.localeCompare(b.sourceId));
}
export function archiveLinks(company,html,pageURL){
 if(!/earnings|quarter|financial|investor/i.test(html))throw Error('IR_ARCHIVE_IDENTITY');
 const links=[],seen=new Set();
 for(const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)){
  let url;try{url=new URL(match[1].replaceAll('&amp;','&'),pageURL).href;permitted(company,url,pageURL);}catch{continue;}
  const text=match[2].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  if(!/earnings|release|10-q|10-k|financialstatement|transcript|workbook/i.test(text+' '+url)||seen.has(url)||url===pageURL)continue;
  if(!/202[6-9]|fy.?2[6-9]/i.test(url+' '+text))continue;seen.add(url);
  const type=/\.xlsx?(?:\?|$)/i.test(url)?'OFFICIAL_FINANCIAL_WORKBOOK':/transcript|earnings.*events/i.test(url)?'OFFICIAL_EARNINGS_CALL_TRANSCRIPT':/10-q|10-k/i.test(url)?'SEC_10Q':'OFFICIAL_EARNINGS_RELEASE';
  links.push({company,sourceId:company.toLowerCase()+'-ir-'+hash(url).slice(0,20),url,delegatedBy:pageURL,documentType:type,parser:/\.pdf(?:\?|$)/i.test(url)?'pdf':type==='OFFICIAL_FINANCIAL_WORKBOOK'?'xlsx':'html',publicationDate:null,periodEnd:null,accession:null,amendmentStatus:'UNKNOWN',linkText:text,status:'DISCOVERED'});
 }
 return links.slice(0,limits.maxDiscoveryLinks);
}
export function detectSourceChanges(source,receipt,accepted,previous=[]){
 const old=[...accepted,...previous].filter(s=>s.company===source.company&&(s.url===source.url||source.accession&&s.accession===source.accession));
 const changes=[];if(source.amendmentStatus==='AMENDED')changes.push({type:'AMENDED_FILING',status:'REVIEW_REQUIRED'});
 for(const s of old){if(s.url===source.url&&s.sha256!==receipt.sha256)changes.push({type:'SAME_URL_CHANGED_BYTES',oldHash:s.sha256,newHash:receipt.sha256,status:'REVIEW_REQUIRED'});if(source.accession&&s.accession===source.accession&&s.url!==source.url)changes.push({type:'NEW_URL_SAME_FILING',oldSourceId:s.sourceId,status:'REVIEW_REQUIRED'});}
 return changes;
}
