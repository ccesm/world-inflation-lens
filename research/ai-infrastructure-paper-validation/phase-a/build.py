"""Offline, deterministic construction from captured SEC facts. No paper inputs."""
import calendar,csv,datetime as dt,gzip,hashlib,json,pathlib
ROOT=pathlib.Path(__file__).resolve().parent
CUTOFF='2026-10-08'
COMPANIES={'microsoft':(789019,7,'Additions to property and equipment'), 'amazon':(1018724,1,'Purchases of property and equipment'), 'alphabet':(1652044,1,'Purchases of property and equipment'), 'meta':(1326801,1,'Purchases of property and equipment'), 'oracle':(1341439,6,'Capital expenditures')}
TAGS={'cash_capex':'PaymentsToAcquirePropertyPlantAndEquipment','ocf':'NetCashProvidedByUsedInOperatingActivities','finance_lease_principal':'FinanceLeasePrincipalPayments'}
def load(company):
 p=ROOT/'sources'/f'{company}-companyfacts.json.gz'
 return json.loads(gzip.decompress(p.read_bytes()))
def write_csv(name,rows,fields=None):
 if fields is None: fields=list(rows[0]) if rows else []
 with (ROOT/name).open('w',newline='') as f:
  w=csv.DictWriter(f,fieldnames=fields);w.writeheader();w.writerows(rows)
def dump(name,data): (ROOT/name).write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')
def end_date(start,q):
 month=start.month+q*3-1; year=start.year+(month-1)//12;month=(month-1)%12+1
 return dt.date(year,month,calendar.monthrange(year,month)[1]).isoformat()
def normalize(value,unit):
 if value is None:return None
 if unit not in {'USD','USD_MILLION','USD_BILLION'}:raise ValueError(unit)
 return value*{'USD':1,'USD_MILLION':10**6,'USD_BILLION':10**9}[unit]
def total(values):return None if not values or any(x is None for x in values) else sum(values)
def ratio(capex,ocf):return None if capex is None or ocf is None or ocf==0 else capex/ocf
def choose(facts,start,end):
 rows=[r for r in facts if r.get('start')==start and r['end']==end and r['filed']<=CUTOFF and r['form'] in ('10-K','10-Q')]
 return min(rows,key=lambda r:(r['filed'],r['accn'],r.get('fy',0))) if rows else None
def build():
 candidates=[];quarterly=[];revisions=[];reconciliations=[];documents={};checks=[]
 for company,(cik,first_month,native_label) in COMPANIES.items():
  d=load(company);us=d['facts']['us-gaap']
  for metric,default_tag in TAGS.items():
   tag='PaymentsToAcquireProductiveAssets' if company=='amazon' and metric=='cash_capex' else default_tag
   if metric=='finance_lease_principal' and company!='meta':continue
   if tag not in us:continue
   facts=us[tag]['units'].get('USD',[])
   for r in facts:
    if not ('start' in r and r['start']>='2019-01-01' and r['end']>='2019-01-01' and r['filed']<=CUTOFF and r['form'] in ('10-K','10-Q')):continue
    doc_id=company+':'+r['accn'];url=f'https://www.sec.gov/Archives/edgar/data/{cik}/{r["accn"].replace("-","")}/{r["accn"]}-index.html'
    documents[doc_id]={'id':doc_id,'company':company,'accession':r['accn'],'filing_date':r['filed'],'form':r['form'],'url':url,'captured_in':f'sources/{company}-companyfacts.json.gz','capture_type':'SEC extracted XBRL facts; filing HTML not archived','reporting_periods': sorted(set(documents.get(doc_id,{}).get('reporting_periods',[])+[r['start']+'/'+r['end']]))}
    candidates.append({'company':company,'metric':metric,'tag':'us-gaap:'+tag,'taxonomy_label':us[tag]['label'],'original_line_item_label':None,'representative_line_item_label':native_label if metric=='cash_capex' else ('Principal payments on finance leases' if metric=='finance_lease_principal' else ('Net cash from operations' if company=='microsoft' else ('Net cash provided by (used in) operating activities' if company=='amazon' else 'Net cash provided by operating activities'))),'native_label_verification':'Representative official statement; per-vintage HTML label not independently verified','start':r['start'],'end':r['end'],'original_value':r['val'],'native_unit':'USD','currency':'USD','filing_date':r['filed'],'accession':r['accn'],'source_document':doc_id,'source_url':url,'extraction_method':'SEC companyfacts us-gaap units.USD; retain exact context dates; never use frame to calendarize','classification':'OBSERVED_GAAP_CASH_FLOW'})
   # Fiscal context, not SEC fy/fp (comparative observations inherit filing fy).
   for y in range(2019,2027):
    start=dt.date(y,first_month,1);ss=start.isoformat();chosen=[choose(facts,ss,end_date(start,q)) for q in range(1,5)]
    if not any(chosen):continue
    fy=y+(1 if first_month!=1 else 0);values=[]
    for q,r in enumerate(chosen,1):
     prev=chosen[q-2] if q>1 else None
     value=(r['val']-(prev['val'] if q>1 and prev else 0)) if r and (q==1 or prev) else None
     qs=(dt.date.fromisoformat(end_date(start,q-1))+dt.timedelta(days=1)).isoformat() if q>1 else ss
     qe=end_date(start,q);cy=int(qe[:4]);cq=(int(qe[5:7])-1)//3+1
     # Cross-check direct standalone contexts separately; revisions must be visible.
     direct=choose(facts,qs,qe)
     if direct and value is not None and direct['val']!=value:
      checks.append({'company':company,'metric':metric,'start':qs,'end':qe,'derived_usd':value,'direct_usd':direct['val'],'difference_usd':value-direct['val'],'derived_filing_date':r['filed'],'direct_filing_date':direct['filed'],'note':'Disclosure-precision or revision difference; dates and values retained; not forced to match'})
     quarterly.append({'company':company,'metric':metric,'fiscal_year':fy,'fiscal_quarter':q,'fiscal_ytd_start':ss,'reporting_start':qs,'reporting_end':qe,'calendar_year_bucket':cy,'calendar_quarter_bucket':cq,'calendar_alignment':'ONE_MONTH_EARLY_PROXY' if company=='oracle' else 'EXACT','value_usd':value,'ytd_original_value':r['val'] if r else None,'prior_ytd_original_value':prev['val'] if prev else (0 if q==1 else None),'native_unit':'USD','currency':'USD','source_document':company+':'+r['accn'] if r else None,'accession':r['accn'] if r else None,'filing_date':r['filed'] if r else None,'prior_accession':prev['accn'] if prev else None,'prior_filing_date':prev['filed'] if prev else None,'source_url':f'https://www.sec.gov/Archives/edgar/data/{cik}/{r["accn"].replace("-","")}/{r["accn"]}-index.html' if r else None,'cash_flow_statement_item':'us-gaap:'+tag,'original_line_item_label':None,'representative_line_item_label':native_label if metric=='cash_capex' else ('Principal payments on finance leases' if metric=='finance_lease_principal' else ('Net cash from operations' if company=='microsoft' else ('Net cash provided by (used in) operating activities' if company=='amazon' else 'Net cash provided by operating activities'))),'native_label_verification':'Representative official statement only; per-vintage original labels unavailable','extraction_method':'Q1 YTD; Q2=H1-Q1; Q3=9M-H1; Q4=FY-9M','adjustment_notes':'First reported context by filed date, same fiscal cohort; later revisions isolated separately; Q4 is annual residual, positive CapEx denotes cash use. Oracle boundaries retained, no monthly proration.','classification':'OBSERVED_GAAP_CASH_FLOW' if value is not None else 'MISSING_OBSERVATION'})
     values.append(value)
     same=[x for x in facts if x.get('start')==ss and x['end']==qe and x['filed']<=CUTOFF and x['form'] in ('10-K','10-Q')]
     if len({x['val'] for x in same})>1:
      earliest=min(same,key=lambda x:(x['filed'],x['accn']))
      revisions.append({'company':company,'metric':metric,'start':ss,'end':qe,'first_value_usd':earliest['val'],'first_filed':earliest['filed'],'latest_value_usd':max(same,key=lambda x:(x['filed'],x['accn']))['val'],'latest_filed':max(same,key=lambda x:(x['filed'],x['accn']))['filed'],'revision_usd':max(same,key=lambda x:(x['filed'],x['accn']))['val']-earliest['val']})
    if chosen[-1]:reconciliations.append({'company':company,'metric':metric,'fiscal_year':fy,'reporting_start':ss,'reporting_end':end_date(start,4),'reported_fiscal_total_usd':chosen[-1]['val'],'sum_standalone_quarters_usd':total(values),'difference_usd':total(values)-chosen[-1]['val'] if total(values) is not None else None,'classification':'PASS' if total(values)==chosen[-1]['val'] else 'MISSING_QUARTERS'})
 annual=[]
 for y in range(2020,2026):
  for company in COMPANIES:
   row={'company':company,'calendar_year':y,'classification':'OBSERVED_QUARTER_END_YEAR_PROXY' if company=='oracle' else 'OBSERVED_CALENDAR_YEAR','reporting_start':f'{y-1}-12-01' if company=='oracle' else f'{y}-01-01','reporting_end':f'{y}-11-30' if company=='oracle' else f'{y}-12-31','calendar_alignment':'ONE_MONTH_EARLY_PROXY' if company=='oracle' else 'EXACT','unit':'USD'}
   for metric in ('cash_capex','ocf'):
    rows=[x for x in quarterly if x['company']==company and x['metric']==metric and x['calendar_year_bucket']==y]
    row[metric+'_quarters_available']=sum(x['value_usd'] is not None for x in rows)
    row[metric+'_usd']=total([x['value_usd'] for x in rows]) if len(rows)==4 else None
    row['exact_calendar_'+metric+'_usd']=row[metric+'_usd'] if company!='oracle' else None
   row['capex_ocf_ratio']=ratio(row['cash_capex_usd'],row['ocf_usd']);row['ocf_minus_cash_capex_usd']=row['ocf_usd']-row['cash_capex_usd'] if row['ocf_usd'] is not None and row['cash_capex_usd'] is not None else None
   annual.append(row)
 aggregate=[]
 for y in range(2020,2026):
  rows=[x for x in annual if x['calendar_year']==y];row={'calendar_year':y,'classification':'FOUR_EXACT_COMPANIES_PLUS_ORACLE_QUARTER_END_PROXY','companies_complete':sum(x['cash_capex_usd'] is not None and x['ocf_usd'] is not None for x in rows),'cash_capex_usd':total([x['cash_capex_usd'] for x in rows]),'ocf_usd':total([x['ocf_usd'] for x in rows]),'exact_calendar_cash_capex_usd':total([x['exact_calendar_cash_capex_usd'] for x in rows]),'exact_calendar_ocf_usd':total([x['exact_calendar_ocf_usd'] for x in rows]),'unit':'USD'}
  row['capex_ocf_ratio']=ratio(row['cash_capex_usd'],row['ocf_usd']);row['ocf_minus_cash_capex_usd']=row['ocf_usd']-row['cash_capex_usd'] if row['ocf_usd'] is not None and row['cash_capex_usd'] is not None else None
  for metric in ('cash_capex','ocf'):
   prior=aggregate[-1][metric+'_usd'] if aggregate else None;row[metric+'_yoy_usd']=row[metric+'_usd']-prior if prior is not None and row[metric+'_usd'] is not None else None;row[metric+'_yoy_pct']=100*(row[metric+'_usd']/prior-1) if prior and row[metric+'_usd'] is not None else None
  aggregate.append(row)
 supplemental=[]
 for company in COMPANIES:
  for metric in ('cash_capex','ocf'):
   rows=[x for x in quarterly if x['company']==company and x['metric']==metric and x['calendar_year_bucket']==2026 and x['value_usd'] is not None]
   supplemental.append({'company':company,'metric':metric,'classification':'OBSERVED_ORACLE_SHIFTED_QUARTERS' if company=='oracle' else 'OBSERVED_YTD','reporting_start':min((x['reporting_start'] for x in rows),default=None),'reporting_end':max((x['reporting_end'] for x in rows),default=None),'value_usd':total([x['value_usd'] for x in rows]),'quarters_available':len(rows),'annualized':False,'source_documents':'|'.join(x['source_document'] for x in rows),'note':'Not a common five-company period; not comparable to paper full-year mixed estimate'})
 write_csv('company-source-observations.csv',candidates)
 write_csv('company-quarterly-source.csv',[r for r in quarterly if r['calendar_year_bucket']>=2020])
 write_csv('company-calendar-year.csv',annual);write_csv('five-company-aggregate.csv',aggregate);write_csv('fiscal-reconciliation.csv',reconciliations);write_csv('reporting-revisions.csv',revisions)
 dump('standalone-crosschecks.json',checks);write_csv('2026-observed.csv',supplemental)
 sources=[]
 for company,(cik,_,_) in COMPANIES.items():
  p=ROOT/'sources'/f'{company}-companyfacts.json.gz';raw=gzip.decompress(p.read_bytes())
  sources.append({'id':company+'-companyfacts','company':company,'type':'SEC_COMPANYFACTS_PRIMARY','url':f'https://data.sec.gov/api/xbrl/companyfacts/CIK{cik:010d}.json','retrieved_date':CUTOFF,'cutoff_filed_date':CUTOFF,'path':str(p.relative_to(ROOT)),'raw_sha256':hashlib.sha256(raw).hexdigest(),'captured_sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'native_unit':'USD','extraction':'Unmodified SEC response, lossless deterministic gzip; contexts filed after cutoff are excluded'})
 dump('source-register.json',{'schema_version':'1.0','research_cutoff':CUTOFF,'sources':sources,'filings':sorted(documents.values(),key=lambda x:x['id']),'supplemental_register':'supplemental-source-register.json','limitations':['Companyfacts captures standard XBRL consolidated contexts, not every custom tag or original filing HTML.','Native labels checked against representative official financial statements; historical per-vintage rendered labels unverified.','Oracle exact January-December observations unavailable; quarter-end buckets cover December-November.']})
 print(json.dumps(aggregate,indent=2));print('direct crosscheck mismatches',len(checks))
if __name__=='__main__':build()
