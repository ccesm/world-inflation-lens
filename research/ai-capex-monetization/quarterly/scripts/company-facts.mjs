import {date} from '../../scripts/contract.mjs';
const ciks={MSFT:789019,GOOG:1652044,AMZN:1018724,META:1326801};
// Candidate extraction only. Company Facts lacks custom tags/segment dimensions and management measures.
export function companyFactsCandidates(doc,company,tagMap){
 if(Number(doc.cik)!==ciks[company]||!doc.entityName||!doc.facts?.['us-gaap'])throw Error('SEC_ISSUER_IDENTITY');
 const rows=[],seen=new Set();
 for(const [metric,tag] of Object.entries(tagMap)){
  const concept=doc.facts['us-gaap'][tag];if(!concept)continue;
  if(!concept.label||!concept.description||!concept.units?.USD)throw Error('SEC_CONCEPT_UNIT');
  for(const f of concept.units.USD){
   if(!['10-Q','10-K','10-Q/A','10-K/A'].includes(f.form))continue;
   date(f.end);date(f.filed);if(f.start)date(f.start);
   if(!/^\d{10}-\d{2}-\d{6}$/.test(f.accn)||f.end>f.filed||!Number.isFinite(f.val)||f.start&&f.start>f.end)throw Error('SEC_FILING_CONTEXT');
   const key=[metric,f.accn,f.start||'',f.end,'USD'].join('|');if(seen.has(key))throw Error('DUPLICATE_SEC_CONTEXT');seen.add(key);
   rows.push({metric,tag,value:f.val,unit:'USD',periodStart:f.start||null,periodEnd:f.end,accession:f.accn,filingDate:f.filed,form:f.form,amended:f.form.endsWith('/A'),fiscalYear:f.fy,fiscalPeriod:f.fp,frame:f.frame||null,definition:concept.description,acceptanceStatus:'CANDIDATE_REQUIRES_NATIVE_SCOPE_REVIEW'});
  }
 }
 return rows.sort((a,b)=>[a.metric,a.accession,a.periodEnd].join('|').localeCompare([b.metric,b.accession,b.periodEnd].join('|')));
}
