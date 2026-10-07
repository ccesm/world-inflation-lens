"""Candidate-only extension using Phase 2A native-table helpers, never frozen inputs.
Unknown layouts remain REVIEW_REQUIRED. No first-tag/company-facts selection.
"""
import sys, json, hashlib, re, calendar, datetime, importlib.util
from pathlib import Path
spec=importlib.util.spec_from_file_location('phase2a_extract',Path(__file__).parents[2]/'quarterly/scripts/extract.py')
legacy=importlib.util.module_from_spec(spec);spec.loader.exec_module(legacy)

def extract(source,cache):
 raw_path=Path(cache)/'objects'/source['sha256'][:2]/source['sha256']
 raw=raw_path.read_bytes()
 if hashlib.sha256(raw).hexdigest()!=source['sha256']:raise ValueError('RAW_HASH')
 if source['parser']=='xlsx':return {'source':source,'observations':[],'events':[],'reviewItems':[{'type':'WORKBOOK_LAYOUT_REVIEW_REQUIRED'}]}
 text,tables=legacy.pdf_tables(raw_path) if source['parser']=='pdf' else legacy.parse_tables(raw)
 if not re.search({'MSFT':'Microsoft','GOOG':'Alphabet','AMZN':r'(AMAZON.COM|Amazon)','META':r'(META PLATFORMS|Meta)'}[source['company']],text,re.I):raise ValueError('ISSUER')
 end=source.get('periodEnd')
 if not end:
  ends=re.findall(r'(?:Three Months|Quarter)\s+Ended\s+(March|June|September|December)\s+(\d{1,2}),?\s+(20\d{2})',text,re.I)
  inferred=sorted(set(f'{year}-{legacy.months[month.title()]:02d}-{int(day):02d}' for month,day,year in ends))
  if len(inferred)!=1:raise ValueError('AMBIGUOUS_ECONOMIC_PERIOD')
  end=inferred[0];source['periodEnd']=end
 dt=datetime.date.fromisoformat(end)
 if dt.month not in [3,6,9,12] or dt.day!=calendar.monthrange(dt.year,dt.month)[1]:raise ValueError('QUARTER_END')
 if not source.get('publicationDate'):
  source['publicationDate'],source['publicationDateEvidence']=legacy.publication(text,end)
 if source['publicationDate']<end:raise ValueError('PUBLICATION_BEFORE_PERIOD')
 company=source['company'];rows=[];issues=[]
 for metric,pattern in legacy.patterns[company].items():
  family='income' if metric in ['revenue','costRevenue','operatingIncome','netIncome'] else 'fcf' if metric=='fcfReported' else 'cash'
  matches=[]
  for loc,table in tables:
   title=' '.join(r[2] for r in table[:5]);joined=' '.join(r[2] for r in table)
   titles={'income':r'(INCOME STATEMENTS|STATEMENTS OF (INCOME|OPERATIONS)|CONSOLIDATED STATEMENTS|Total revenue)', 'cash':r'(CASH FLOWS? STATEMENTS|STATEMENTS OF CASH FLOWS|Net cash from operations)', 'fcf':r'(Reconciliation.*(GAAP|Free Cash Flow))'}
   if not re.search(titles[family],title,re.I):continue
   if not re.search(r'in millions',joined,re.I):continue
   # No unknown column-map fallback. The native quarter header must prove the column.
   if not legacy.quarter_header(table,company,end):continue
   for i,r in enumerate(table):
    if re.fullmatch(pattern,r[0],re.I) and len(r[1])==2:
     index=1 if company in ['GOOG','AMZN'] else 0
     matches.append((loc,i,r,index))
  if len(matches)!=1:
   issues.append({'metric':metric,'type':'MISSING_OR_AMBIGUOUS_NATIVE_QUARTER','matches':len(matches)});continue
  loc,i,row,col=matches[0];value=row[1][col]
  if metric in ['cashPpeGross','cashPpeNet','ppeProceedsIncentives','financeLeasePrincipal']:value=abs(value)
  rows.append({'observationId':source['sourceId']+':'+metric+':'+end,'company':company,'sourceId':source['sourceId'],'metric':metric,'nativeLabel':row[0],'unit':'USD_MILLIONS','value':value,'scope':'CONSOLIDATED','periodStart':f'{dt.year}-{dt.month-2:02d}-01','periodEnd':end,'periodType':'Q','fiscalQuarter':f'FY{dt.year+(dt.month>6)}Q{ {3:3,6:4,9:1,12:2}[dt.month]}' if company=='MSFT' else f'FY{dt.year}Q{dt.month//3}','calendarQuarter':f'{dt.year}Q{dt.month//3}','precision':'EXACT','evidenceClass':'OBSERVED','restatementBasis':source['sourceId'],'revisionStatus':'ORIGINAL_RELEASE_VINTAGE','locator':f'{loc}/row[{i+1}]/numericColumn[{col+1}]'})
 # Keep the native prior-year column for explicit restatement comparison.
 current_rows=list(rows)
 for record in current_rows:
  locator=record['locator'];table_locator=locator.split('/row[')[0];ri=int(re.search(r'/row\[(\d+)\]',locator).group(1))-1
  table=next(table for loc,table in tables if loc==table_locator);native=table[ri]
  col=0 if company in ['GOOG','AMZN'] else 1
  value=native[1][col]
  if record['metric'] in ['cashPpeGross','cashPpeNet','ppeProceedsIncentives','financeLeasePrincipal']:value=abs(value)
  pe=f'{dt.year-1}-{dt.month:02d}-{dt.day:02d}'
  rows.append({**record,'observationId':record['observationId']+':comparative','value':value,'periodStart':f'{dt.year-1}-{dt.month-2:02d}-01','periodEnd':pe,'calendarQuarter':f'{dt.year-1}Q{dt.month//3}','fiscalQuarter':f'FY{dt.year-1+(dt.month>6)}Q{ {3:3,6:4,9:1,12:2}[dt.month]}' if company=='MSFT' else f'FY{dt.year-1}Q{dt.month//3}','revisionStatus':'COMPARATIVE_VINTAGE','locator':re.sub(r'numericColumn\[\d+\]',f'numericColumn[{col+1}]',locator)})
 # Optional named-segment extraction stays independent of consolidated core.
 segment={'MSFT':'Intelligent Cloud','GOOG':'Google Cloud','AMZN':'AWS'}.get(company)
 if segment:
  for metric in ['segmentRevenue','segmentOperatingIncome']:
   candidates=[]
   for loc,table in tables:
    if not legacy.quarter_header(table,company,end) or not re.search(r'in millions',' '.join(r[2] for r in table),re.I):continue
    if company=='GOOG':
     cloud=[(i,r) for i,r in enumerate(table) if r[0]=='Google Cloud' and len(r[1])==2]
     if len(cloud)==2:
      ri,r=cloud[0 if metric=='segmentRevenue' else 1]
      required='revenue' if metric=='segmentRevenue' else 'operating income'
      if required in ' '.join(row[2] for row in table[:ri]).lower():candidates.append((loc,ri,r))
    else:
     starts=[i for i,r in enumerate(table) if r[0]==segment and not r[1]]
     for start in starts:
      block=table[start+1:start+6]
      next_scope=next((i for i,r in enumerate(block) if r[0] in ['Consolidated','More Personal Computing','Productivity and Business Processes','North America','International']),len(block))
      pattern=r'^(Revenue|Net sales)(?:\(\d+\))?$' if metric=='segmentRevenue' else r'^Operating income$'
      candidates.extend((loc,ri,r) for ri,r in enumerate(block[:next_scope],start+1) if re.fullmatch(pattern,r[0],re.I) and len(r[1])==2)
   if len(candidates)!=1:
    issues.append({'metric':metric,'type':'MISSING_OR_AMBIGUOUS_NATIVE_SEGMENT','matches':len(candidates)});continue
   loc,ri,r=candidates[0]
   for col,year in enumerate([dt.year-1,dt.year] if company in ['GOOG','AMZN'] else [dt.year,dt.year-1]):
    pe=f'{year}-{dt.month:02d}-{dt.day:02d}'
    rows.append({'observationId':source['sourceId']+':'+metric+':'+pe,'company':company,'sourceId':source['sourceId'],'metric':metric,'nativeLabel':segment+' '+r[0] if company!='GOOG' else segment+' '+metric,'unit':'USD_MILLIONS','value':r[1][col],'scope':segment,'periodStart':f'{year}-{dt.month-2:02d}-01','periodEnd':pe,'periodType':'Q','calendarQuarter':f'{year}Q{dt.month//3}','fiscalQuarter':f'FY{year+(dt.month>6)}Q{ {3:3,6:4,9:1,12:2}[dt.month]}' if company=='MSFT' else f'FY{year}Q{dt.month//3}','precision':'EXACT','evidenceClass':'OBSERVED','restatementBasis':source['sourceId'],'revisionStatus':'ORIGINAL_RELEASE_VINTAGE' if year==dt.year else 'COMPARATIVE_VINTAGE','locator':f'{loc}/row[{ri+1}]/numericColumn[{col+1}]'})
 # Text discovery supplies review candidates, never invented financial measurements.
 events=[]
 for kind,pattern in [('DIRECT_AI_RUN_RATE',r'[^.]{0,180}(?:AI[^.]{0,100}(?:run.rate|annualized)|(?:run.rate|annualized)[^.]{0,100}AI)[^.]{0,180}'),('CAPEX_GUIDANCE',r'[^.]{0,180}(?:capital expenditures|capex)[^.]{0,180}(?:expect|guidance|anticipat)[^.]{0,180}'),('BACKLOG',r'[^.]{0,120}(?:remaining performance obligations|RPO|backlog)[^.]{0,180}'),('CAPACITY_CONSTRAINT',r'[^.]{0,120}(?:capacity constrain|demand exceed|supply constrain)[^.]{0,180}'),('PAID_AI_SEATS',r'[^.]{0,120}(?:Copilot|AI)[^.]{0,100}(?:paid seats|subscribers)[^.]{0,120}'),('AI_ATTRIBUTION',r'[^.]{0,100}AI[^.]{0,100}(?:advertis|recommendation|growth)[^.]{0,100}')]:
  for match in list(re.finditer(pattern,text,re.I))[:8]:events.append({'company':company,'kind':kind,'nativeWordingSummary':match.group(0),'sourceId':source['sourceId'],'locator':f'normalizedText/character[{match.start()}:{match.end()}]','periodType':'RUN_RATE' if kind=='DIRECT_AI_RUN_RATE' else 'GUIDANCE' if kind=='CAPEX_GUIDANCE' else 'POINT' if kind=='BACKLOG' else 'TEXT','recognizedRevenue':False,'value':None,'status':'REVIEW_REQUIRED'})
 for kind,pattern in [('USEFUL_LIFE_POLICY',r'[^.]{0,120}useful li(?:fe|ves)[^.]{0,180}'),('LEASE_POLICY',r'[^.]{0,120}(?:finance|operating|capital) leases?[^.]{0,180}'),('SEGMENT_PRESENTATION',r'[^.]{0,120}(?:recast|restat|reclassif|segment presentation)[^.]{0,180}'),('RPO_DEFINITION',r'[^.]{0,120}(?:short.term contracts|remaining performance obligations)[^.]{0,180}')]:
  for match in list(re.finditer(pattern,text,re.I))[:8]:issues.append({'type':kind,'status':'REVIEW_REQUIRED','sourceId':source['sourceId'],'locator':f'normalizedText/character[{match.start()}:{match.end()}]','nativeWording':match.group(0)})
 return {'source':source,'observations':rows,'events':events,'reviewItems':issues}

if __name__=='__main__':
 try:
  result=extract(json.load(open(sys.argv[1])),sys.argv[2]);json.dump(result,open(sys.argv[3],'w'),sort_keys=True,indent=2)
 except Exception as e:
  json.dump({'observations':[],'events':[],'reviewItems':[{'type':'PARSER_REVIEW_REQUIRED','error':str(e)}]},open(sys.argv[3],'w'),sort_keys=True,indent=2)
