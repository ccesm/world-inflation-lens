import {load} from '../../quarterly/scripts/io.mjs';
import {hash} from '../../scripts/contract.mjs';
export const data=load(),clone=v=>structuredClone(v),clock=()=>Date.parse('2026-11-02T12:00:00Z');
export function fixture(company='MSFT'){
 const source={company,sourceId:company.toLowerCase()+'-fixture-2026q3',publisher:{MSFT:'Microsoft',GOOG:'Alphabet',AMZN:'Amazon',META:'Meta'}[company],url:`https://${company==='MSFT'?'www.microsoft.com':company==='GOOG'?'abc.xyz':company==='AMZN'?'ir.aboutamazon.com':'investor.atmeta.com'}/fixture-2026q3`,publicationDate:'2026-10-28',periodEnd:'2026-09-30',retrievedAt:'2026-11-02T12:00:00Z',accession:null,amendmentStatus:'ORIGINAL',documentType:'OFFICIAL_EARNINGS_RELEASE',mimeType:'text/html',sha256:hash('fixture'),byteSize:7,locator:'native table',parser:'html'};
 const numbers={revenue:1000,operatingIncome:100,cfo:500,cashPpeGross:200,...(company==='AMZN'?{ppeProceedsIncentives:10}:{}),...(company==='META'?{financeLeasePrincipal:50}:{})};
 const rows=Object.entries(numbers).map(([metric,value])=>{
  const previous=data.input.observations.filter(r=>r.company===company&&r.metric===metric&&r.scope==='CONSOLIDATED').sort((a,b)=>b.periodEnd.localeCompare(a.periodEnd))[0];
  return {...clone(previous),observationId:source.sourceId+':'+metric,sourceId:source.sourceId,value,periodStart:'2026-07-01',periodEnd:'2026-09-30',periodType:'Q',restatementBasis:source.sourceId,precision:'EXACT',evidenceClass:'OBSERVED',locator:'table[1]/row['+metric+']/numericColumn[1]',comparabilityStatus:'COMPARABLE'};
 });return {source,rows};
}
export function index(company){const cik={MSFT:789019,GOOG:1652044,AMZN:1018724,META:1326801}[company];return {cik,filings:{recent:{accessionNumber:[String(cik).padStart(10,'0')+'-26-000099'],form:['10-Q'],filingDate:['2026-10-28'],reportDate:['2026-09-30'],primaryDocument:['filing.htm']}}};}
