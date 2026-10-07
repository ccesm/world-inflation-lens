"""Qualified table extraction, not an automatic economic acceptance decision.
Dependencies: lxml and pypdf. Raw identities checked before parsing.
Source-specific required table titles, labels, units and native quarter headers fail closed.
"""
import sys,json,re,hashlib,calendar,datetime
from pathlib import Path
from lxml import html
from pypdf import PdfReader
NUM=r'\(?-?\d[\d,]*(?:\.\d+)?\)?|[—–]'
def numbers(text):
 tokens=re.findall(NUM,text.replace('$',''))
 return [0 if t in ['—','–'] else float(t.replace(',','').strip('()'))*(-1 if t.startswith('(') else 1) for t in tokens]
def clean(s):return ' '.join(s.split())
def publication(text,end):
 # Dateline only: acquisition dates elsewhere cannot become the publication date.
 months={name:i for i,name in enumerate(calendar.month_name) if name}
 months.update({name:i for i,name in enumerate(calendar.month_abbr) if name});months['Sept']=9
 pattern=r'([A-Z][a-z]{2,8})\.?\s+(\d{1,2}),?\s+(20\d{2})'
 lead=re.search(r'(?:REDMOND|MOUNTAIN VIEW|MENLO PARK|SEATTLE).{0,100}?'+pattern,clean(text))
 if not lead:raise ValueError('PUBLICATION_DATELINE_UNQUALIFIED')
 name,day,year=lead.groups()
 if name not in months:raise ValueError('PUBLICATION_DATE_UNQUALIFIED')
 d=datetime.date(int(year),months[name],int(day))
 if not end<d.isoformat() or (d-datetime.date.fromisoformat(end)).days>=100:raise ValueError('PUBLICATION_DATE_UNQUALIFIED')
 return d.isoformat(),lead.group(0)
def parse_tables(raw):
 root=html.fromstring(raw); tables=[]
 for i,t in enumerate(root.xpath('//table')):
  rows=[]
  for r in t.xpath('./tbody/tr|./thead/tr|./tr'):
   cells=[clean(' '.join(c.itertext())) for c in r.xpath('./td|./th')]
   cells=[x for x in cells if x not in ['', '$','%',')']]
   if cells:
    # Closing parentheses may occupy their own cell; retain their sign on the opening token.
    label=cells[0]; vals=[]
    for c in cells[1:]:
     if re.fullmatch(r'\$?\s*\(?[\d,]+(?:\.\d+)?\)?|[—–]',c):vals+=numbers(c+(')' if c.startswith('(') and not c.endswith(')') else ''))
    rows.append((label,vals,clean(' '.join(cells))))
  # Word-exported Microsoft statements place the title and units in <caption>.
  # Preserve that context without changing native row/column locator numbering.
  caption=clean(' '.join(t.xpath('./caption//text()')))
  if not caption and 'c-table' in t.getparent().get('class','').split():
   context=[]
   for sibling in list(t.getparent().itersiblings(preceding=True))[:3]:
    if sibling.tag not in ['p','br']:break
    context.append(clean(' '.join(sibling.itertext())))
   caption=' '.join(reversed(context))
  if rows and caption:rows[0]=(rows[0][0],rows[0][1],caption+' '+rows[0][2])
  tables.append((f'table[{i+1}]',rows))
 return clean(root.text_content()),tables

def pdf_tables(path):
 pages=[p.extract_text(extraction_mode='layout') for p in PdfReader(path).pages];tables=[]
 for pi,page in enumerate(pages):
  # Split a page into statement sections, preserving exact page and line locator.
  rows=[]
  for li,line in enumerate(page.splitlines()):
   line=line.strip();parts=re.split(r'\s{2,}',line)
   if not line:continue
   vals=[]
   if len(parts)>1:
    for p in parts[1:]:
     if re.fullmatch(r'\$?\s*\(?[\d,]+(?:\.\d+)?\)?|[—–]',p.strip()):vals+=numbers(p)
   rows.append((parts[0],vals,clean(line),li+1))
  merged=[]
  for row in rows:
   if any(row[0].startswith(x) for x in ['and other','assets, and other','operating lease assets, and other','lease assets, and other','content costs, operating lease assets, and other','capitalized content costs, operating lease assets, and other']) and row[1] and merged and not merged[-1][1] and 'Depreciation and amortization of property and equipment' in merged[-1][0]:
    prev=merged[-1];merged[-1]=(prev[0]+' '+row[0],row[1],prev[2]+' '+row[2],prev[3])
    # Keep the continuation slot so later native row locators cannot shift.
    merged.append(('',[], '',row[3]))
   else:merged.append(row)
  tables.append((f'page[{pi+1}]',merged))
 return clean('\n'.join(pages)),tables

def quarter_header(rows,company,end):
 """Native first two columns must be the stated quarter and ordered years.
 A month/year appearing somewhere in a document is not a column identity.
 """
 header=' '.join(r[2] for r in rows[:14])
 d=datetime.date.fromisoformat(end);month=d.strftime('%B')
 if not re.search(r'(Three Months Ended|Quarter Ended)',header,re.I):return False
 if not re.search(month+r'\s+'+str(d.day)+r'\b',header):return False
 expected=[d.year-1,d.year] if company in ['AMZN','GOOG'] else [d.year,d.year-1]
 for r in rows[:14]:
  years=[int(x) for x in re.findall(r'\b20\d{2}\b',r[2])]
  if len(years)>=2:return years[:2]==expected
 return False

patterns={
 'MSFT':{'revenue':r'^Total revenue$','costRevenue':r'^Total cost of revenue$','operatingIncome':r'^Operating income$','netIncome':r'^Net income$','cfo':r'^Net cash from operations$','cashPpeGross':r'^Additions to property and equipment$','depreciationAmortizationOther':r'^Depreciation, amortization, and other$'},
 'AMZN':{'revenue':r'^Total net sales$','costRevenue':r'^Cost of sales$','operatingIncome':r'^Operating income$','netIncome':r'^Net income$','cfo':r'^Net cash provided by \(used in\) operating activities$','cashPpeGross':r'^Purchases of property and equipment$','ppeProceedsIncentives':r'^Proceeds from property and equipment sales and incentives$','financeLeasePrincipal':r'^Principal repayments of (finance|capital) leases$','financeLeaseAdditions':r'^Property and equipment acquired under (finance|capital) leases(?:, net of remeasurements and modifications)?$','operatingLeaseCash':r'^Cash paid for operating leases$','depreciationAmortizationOther':r'^Depreciation and amortization of property and equipment and capitalized content costs, operating lease assets, and other$'},
 'META':{'revenue':r'^Revenue$','costRevenue':r'^Cost of revenue$','operatingIncome':r'^Income from operations$','netIncome':r'^Net income$','cfo':r'^Net cash provided by operating activities$','cashPpeGross':r'^Purchases of property and equipment$', 'cashPpeNet':r'^Purchases of property and equipment, net$','financeLeasePrincipal':r'^Principal payments on (finance|capital) leases$','depreciationAmortizationOther':r'^Depreciation and amortization$','fcfReported':r'^Free cash flow(?:\s*\(\d+\))?$'},
 'GOOG':{'revenue':r'^Revenues$','costRevenue':r'^Cost of revenues$','operatingIncome':r'^Income from operations$','netIncome':r'^Net income$','cfo':r'^Net cash provided by operating activities$','cashPpeGross':r'^Purchases of property and equipment$','depreciationPpe':r'^Depreciation(?: of property and equipment)?$','depreciationAmortizationOther':r'^Depreciation and amortization$','fcfReported':r'^Free cash flow(?:\s*\(\d+\))?$'}
}

def early_alphabet(s,tables):
 """Explicit legacy native layouts: single-quarter FCF and eight-column segment history.
 No annual/YTD column can be selected as a quarter. Unknown layouts fail closed.
 """
 if s['company']!='GOOG' or not '2019-03-31'<=s['periodEnd']<='2020-12-31':return []
 end=s['periodEnd'];year=int(end[:4]);month=int(end[5:7]);out=[]
 def append(metric,value,pe,locator,label):
  y=int(pe[:4]);m=int(pe[5:7]);out.append({'observationId':f"{s['sourceId']}:{metric}:{pe}",'sourceId':s['sourceId'],'company':'GOOG','metric':metric,'scope':'Google Cloud' if metric.startswith('segment') else 'CONSOLIDATED','periodStart':f'{y}-{m-2:02d}-01','periodEnd':pe,'periodType':'Q','unit':'USD_MILLIONS','value':value,'precision':'EXACT','evidenceClass':'OBSERVED','definitionVersion':'GOOG_CLOUD_SEGMENT_V1' if metric.startswith('segment') else 'GOOG_fcfReported_V1','restatementBasis':s['sourceId'],'revisionStatus':'COMPARATIVE_VINTAGE' if pe!=end else 'ORIGINAL_RELEASE_VINTAGE','nativeLabel':label,'locator':locator,'comparabilityStatus':'LIMITED_COMPARABILITY' if metric.startswith('segment') else 'COMPARABLE'})
 for loc,rows in tables:
  joined=' '.join(r[2] for r in rows)
  title=' '.join(r[2] for r in rows[:4])
  fcf_start=next((i for i,r in enumerate(rows) if 'Reconciliation from net cash provided by operating activities to free cash flow' in r[2]),None)
  if fcf_start is not None:
   fcf_rows=rows[fcf_start:]
   header=' '.join(r[2] for r in fcf_rows[:9])
   fcf_title=fcf_rows[0][2]
   native_date=re.search(r'(?:Quarter|Three Months)\s+Ended\s+'+calendar.month_name[month]+r'\s+'+str(int(end[8:]))+r',?\s+'+str(year),header)
   cells=[(i+fcf_start,r) for i,r in enumerate(fcf_rows) if r[0]=='Free cash flow' and len(r[1])==1]
   if native_date and 'in millions' in fcf_title.lower() and len(cells)==1:
    ri,r=cells[0];append('fcfReported',r[1][0],end,f'{loc}/row[{ri+1}]/numericColumn[1]',r[0])
  # Early revenue detail has no Cloud operating income: qualify revenue independently.
  clouds=[(i,r) for i,r in enumerate(rows) if r[0]=='Google Cloud' and len(r[1])==2]
  if len(clouds)==1 and quarter_header(rows,'GOOG',end) and re.search(r'(in millions|revenues)',joined,re.I):
   ri,r=clouds[0]
   for i,y in enumerate([year-1,year]):
    pe=f'{y}-{month:02d}-{calendar.monthrange(y,month)[1]}'
    if pe>='2019-03-31':append('segmentRevenue',r[1][i],pe,f'{loc}/row[{ri+1}]/numericColumn[{i+1}]','Google Cloud revenue')
  # First separately reported segment operating history: five exact quarters, then three FYs.
  if end=='2020-12-31' and 'Segment results' in joined and 'revenues and operating income' in joined.lower() and any(r[0]=='Google Cloud' and len(r[1])==8 for r in rows):
   header='Q4 2019 Q1 2020 Q2 2020 Q3 2020 Q4 2020 2018 2019 2020'
   clouds=[(i,r) for i,r in enumerate(rows) if r[0]=='Google Cloud' and len(r[1])==8]
   if joined.count(header)!=2 or len(clouds)!=2 or 'in millions' not in joined.lower():raise ValueError('EARLY_CLOUD_COLUMN_IDENTITY')
   for metric,(ri,r) in zip(['segmentRevenue','segmentOperatingIncome'],clouds):
    prior=' '.join(x[2] for x in rows[:ri])
    required='Revenues' if metric=='segmentRevenue' else 'Operating income (loss)'
    if required not in prior:raise ValueError('EARLY_CLOUD_METRIC_IDENTITY')
    for i,pe in enumerate(['2019-12-31','2020-03-31','2020-06-30','2020-09-30','2020-12-31']):append(metric,r[1][i],pe,f'{loc}/row[{ri+1}]/numericColumn[{i+1}]','Google Cloud '+metric)
 return out

def extract(s,cache):
 path=Path(cache)/'objects'/s['sha256'][:2]/s['sha256'];raw=path.read_bytes()
 if hashlib.sha256(raw).hexdigest()!=s['sha256']:raise ValueError('RAW_HASH')
 text,tables=pdf_tables(path) if s['parser']=='pdf' else parse_tables(raw)
 identities={'MSFT':'Microsoft','AMZN':'AMAZON.COM','META':r'(META PLATFORMS|FACEBOOK)','GOOG':'Alphabet'}
 if not re.search(identities[s['company']],text,re.I):raise ValueError('ISSUER')
 s['publicationDate'],s['publicationDateEvidence']=publication(text,s['periodEnd'])
 end=s['periodEnd'];year=int(end[:4]);month=int(end[5:7]);out=[];issues=[]
 for metric,pattern in patterns[s['company']].items():
  family='income' if metric in ['revenue','costRevenue','operatingIncome','netIncome'] else 'fcf' if metric=='fcfReported' else 'cash'
  found=[]
  for locator,rows in tables:
   joined=' '.join(r[2] for r in rows)
   title={'income':r'(INCOME STATEMENTS|STATEMENTS OF (?:INCOME|OPERATIONS)|CONDENSED CONSOLIDATED STATEMENTS OF INCOME)','cash':r'(CASH FLOWS? STATEMENTS|STATEMENTS OF CASH FLOWS)','fcf':r'(Reconciliation.*(?:GAAP|Free Cash Flow))'}[family]
   title_text=' '.join(r[2] for r in rows[:4])
   if not re.search(title,title_text,re.I):
    meta_net_recon=s['company']=='META' and metric=='cashPpeNet' and re.search('Reconciliation.*GAAP',title_text,re.I) and 'Free cash flow' in joined
    ms_native=s['company']=='MSFT' and (family=='income' and 'Total cost of revenue' in joined and 'Total revenue' in joined or family=='cash' and 'Net cash from operations' in joined and 'Additions to property and equipment' in joined)
    if not (meta_net_recon or ms_native):continue
   if s['company']=='MSFT' and family=='income' and ('Total cost of revenue' not in joined or 'Total revenue' not in joined):continue
   # Quarterly amounts require a native three-month header, never an annual/YTD alias.
   if not quarter_header(rows,s['company'],end):continue
   if not re.search(r'(in millions|\(In millions)',joined,re.I):continue
   # Confirm the actual observation year and comparison year appear in the native header.
   header=' '.join(r[2] for r in rows[:10])
   if str(year) not in header or str(year-1) not in header:continue
   # Native income statement ends at net income; appended expense-allocation
   # notes can repeat "Cost of revenue" inside the same HTML table.
   income_end=next((i for i,r in enumerate(rows) if r[0]=='Net income'),len(rows)-1)
   selected_rows=rows[:income_end+1] if family=='income' else rows
   for ri,r in enumerate(selected_rows):
    if re.fullmatch(pattern,r[0],re.I) and len(r[1])>=2:
     found.append((locator,ri,r))
  repeated=[]
  if len(found)>1 and all(item[2][0]==found[0][2][0] and item[2][1][:2]==found[0][2][1][:2] for item in found):
   repeated=[f'{loc}/row[{idx+1}]' for loc,idx,r in found[1:]]
   found=found[:1]
  if len(found)!=1:
   issues.append({'metric':metric,'reason':'MISSING_OR_AMBIGUOUS_NATIVE_QUARTER','matches':len(found)});continue
  locator,ri,row=found[0];values=row[1];order=[year-1,year] if s['company'] in ['AMZN','GOOG'] else [year,year-1]
  # Alphabet FCF reconciliation frequently lists sequential quarters instead of a two-year pair.
  if s['company']=='GOOG' and family=='fcf':issues.append({'metric':metric,'reason':'FCF_RECONCILIATION_REQUIRES_SEPARATE_COLUMN_MAP'});continue
  for i,y in enumerate(order):
   pe=f'{y}-{month:02d}-{calendar.monthrange(y,month)[1]}';ps=f'{y}-{month-2:02d}-01'
   if pe<'2019-03-31' or pe>'2026-06-30':continue
   scope='CONSOLIDATED';definition=s['company']+'_'+metric+'_V1'
   if s['company']=='META' and metric=='cashPpeNet':definition='META_CASH_PPE_NET_LABEL_V1'
   if metric in ['cashPpeGross','cashPpeNet','financeLeasePrincipal']:value=abs(values[i])
   else:value=values[i]
   out.append({'observationId':f"{s['sourceId']}:{metric}:{pe}",'sourceId':s['sourceId'],'company':s['company'],'metric':metric,'scope':scope,'periodStart':ps,'periodEnd':pe,'periodType':'Q','unit':'USD_MILLIONS','value':value,'precision':'EXACT','evidenceClass':'OBSERVED','definitionVersion':definition,'restatementBasis':s['sourceId'],'revisionStatus':'COMPARATIVE_VINTAGE' if y!=year else 'ORIGINAL_RELEASE_VINTAGE','nativeLabel':row[0],'locator':f'{locator}/row[{ri+1}]/numericColumn[{i+1}]','comparabilityStatus':'LIMITED_COMPARABILITY' if definition=='META_CASH_PPE_NET_LABEL_V1' else 'COMPARABLE',**({'repeatedNativeLocators':repeated} if repeated else {})})
 # Segments have repeated revenue/operating labels; choose only a named block.
 if s['company'] in ['MSFT','AMZN','GOOG']:
  segment={'MSFT':'Intelligent Cloud','AMZN':'AWS','GOOG':'Google Cloud'}[s['company']]
  for locator,rows in tables:
   joined=' '.join(r[2] for r in rows)
   if not (re.search(r'(SEGMENT (?:RESULTS|INFORMATION)|Google Cloud)',joined,re.I) or s['company']=='MSFT' and 'Intelligent Cloud' in joined and 'Operating expenses' in joined) or not quarter_header(rows,s['company'],end):continue
   if s['company']=='GOOG':
    segment_rows=[(i,r) for i,r in enumerate(rows) if r[0]=='Google Cloud' and len(r[1])==2]
    if len(segment_rows)!=2:continue
    if not any('revenues' in r[0].lower() for r in rows[:segment_rows[0][0]]) or not any('operating income' in r[0].lower() for r in rows[segment_rows[0][0]:segment_rows[1][0]]):continue
    for metric,(ri,r) in zip(['segmentRevenue','segmentOperatingIncome'],segment_rows):
     for i,y in enumerate([year-1,year]):
      pe=f'{y}-{month:02d}-{calendar.monthrange(y,month)[1]}'
      if pe<'2019-03-31' or pe>'2026-06-30':continue
      out.append({'observationId':f"{s['sourceId']}:{metric}:{pe}",'sourceId':s['sourceId'],'company':'GOOG','metric':metric,'scope':'Google Cloud','periodStart':f'{y}-{month-2:02d}-01','periodEnd':pe,'periodType':'Q','unit':'USD_MILLIONS','value':r[1][i],'precision':'EXACT','evidenceClass':'OBSERVED','definitionVersion':'GOOG_CLOUD_SEGMENT_V1','restatementBasis':s['sourceId'],'revisionStatus':'COMPARATIVE_VINTAGE' if y!=year else 'ORIGINAL_RELEASE_VINTAGE','nativeLabel':'Google Cloud '+metric,'locator':f'{locator}/row[{ri+1}]/numericColumn[{i+1}]','comparabilityStatus':'LIMITED_COMPARABILITY'})
    continue
   start=next((i for i,r in enumerate(rows) if r[0]==segment),None)
   if start is None:continue
   for metric,label in [('segmentRevenue',r'^(Revenue|Net sales)(?:\(\d+\))?$'),('segmentOperatingIncome',r'^Operating income$')]:
    block=rows[start+1:start+6]
    next_scope=next((i for i,r in enumerate(block) if r[0] in ['Consolidated','More Personal Computing','Productivity and Business Processes','North America','International']),len(block))
    matches=[(i,r) for i,r in enumerate(block[:next_scope],start+1) if re.fullmatch(label,r[0],re.I) and len(r[1])>=2]
    if len(matches)!=1:continue
    ri,r=matches[0];order=[year-1,year] if s['company']=='AMZN' else [year,year-1]
    for i,y in enumerate(order):
     pe=f'{y}-{month:02d}-{calendar.monthrange(y,month)[1]}'
     if pe<'2019-03-31' or pe>'2026-06-30':continue
     dv='MSFT_INTELLIGENT_CLOUD_FY2025_V2' if s['company']=='MSFT' and pe>='2024-09-30' else s['company']+'_'+metric+'_V1'
     out.append({'observationId':f"{s['sourceId']}:{metric}:{pe}",'sourceId':s['sourceId'],'company':s['company'],'metric':metric,'scope':segment,'periodStart':f'{y}-{month-2:02d}-01','periodEnd':pe,'periodType':'Q','unit':'USD_MILLIONS','value':r[1][i],'precision':'EXACT','evidenceClass':'OBSERVED','definitionVersion':dv,'restatementBasis':s['sourceId'],'revisionStatus':'COMPARATIVE_VINTAGE' if y!=year else 'ORIGINAL_RELEASE_VINTAGE','nativeLabel':segment+' '+r[0],'locator':f'{locator}/row[{ri+1}]/numericColumn[{i+1}]','comparabilityStatus':'LIMITED_COMPARABILITY' if s['company']=='MSFT' else 'COMPARABLE'})
 if s['company']=='MSFT':
  for locator,rows in tables:
   joined=' '.join(r[2] for r in rows)
   if not quarter_header(rows,'MSFT',end) or 'Intelligent Cloud' not in joined:continue
   exact=[(i,r) for i,r in enumerate(rows) if r[0]=='Intelligent Cloud' and len(r[1])>=2]
   if len(exact)!=2:continue
   # Older native segment table has a Revenue block followed by Operating Income.
   if not any(r[0]=='Revenue' for r in rows[:exact[0][0]]) or not any(r[0]=='Operating Income' for r in rows[exact[0][0]:exact[1][0]]):continue
   for metric,(ri,r) in zip(['segmentRevenue','segmentOperatingIncome'],exact):
    for i,y in enumerate([year,year-1]):
     pe=f'{y}-{month:02d}-{calendar.monthrange(y,month)[1]}'
     if not '2019-03-31'<=pe<='2026-06-30' or any(o['metric']==metric and o['periodEnd']==pe for o in out):continue
     dv='MSFT_INTELLIGENT_CLOUD_FY2025_V2' if pe>='2024-09-30' else 'MSFT_'+metric+'_V1'
     out.append({'observationId':f"{s['sourceId']}:{metric}:{pe}",'sourceId':s['sourceId'],'company':'MSFT','metric':metric,'scope':'Intelligent Cloud','periodStart':f'{y}-{month-2:02d}-01','periodEnd':pe,'periodType':'Q','unit':'USD_MILLIONS','value':r[1][i],'precision':'EXACT','evidenceClass':'OBSERVED','definitionVersion':dv,'restatementBasis':s['sourceId'],'revisionStatus':'COMPARATIVE_VINTAGE' if y!=year else 'ORIGINAL_RELEASE_VINTAGE','nativeLabel':'Intelligent Cloud '+metric,'locator':f'{locator}/row[{ri+1}]/numericColumn[{i+1}]','comparabilityStatus':'LIMITED_COMPARABILITY'})
 out.extend(early_alphabet(s,tables))
 # A release may repeat the identical segment table in its highlights and notes.
 # Verify equality before consolidating these citations; conflicting duplicates
 # remain unqualified, never selected by first-match preference.
 grouped={}
 for o in out:grouped.setdefault(o['observationId'],[]).append(o)
 qualified=[]
 for oid,records in grouped.items():
  first=records[0]
  if any(any(r[k]!=first[k] for k in ['value','unit','scope','definitionVersion','periodStart','periodEnd']) for r in records):
   issues.append({'metric':first['metric'],'periodEnd':first['periodEnd'],'reason':'CONFLICTING_DUPLICATE_NATIVE_CONTEXT'});continue
  if len(records)>1:first['repeatedNativeLocators']=[r['locator'] for r in records[1:]]
  qualified.append(first)
 return s,qualified,issues
if __name__=='__main__':
 sources=json.load(open(sys.argv[1]));accepted=[];obs=[];failures=[]
 for s in sources:
  if s.get('status')!='RETRIEVED':continue
  try:
   source,rows,issues=extract(s,sys.argv[2]);accepted.append(source);obs+=rows;failures.append({'sourceId':s['sourceId'],'metricIssues':issues})
  except Exception as e:failures.append({'sourceId':s['sourceId'],'error':str(e)})
 json.dump({'schemaVersion':'ai-capex-quarterly-input-v0.1','sources':accepted,'observations':obs,'extractionReport':failures},open(sys.argv[3],'w'),indent=2,sort_keys=True)
 print('sources',len(accepted),'observations',len(obs),'source failures',sum('error' in r for r in failures))
