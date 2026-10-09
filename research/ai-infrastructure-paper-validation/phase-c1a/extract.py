"""Read immutable official source bytes. Stdlib only; no network or production writes.
--cache PATH emits normalized frozen inputs in this phase's inputs/ directory.
The external object cache is required for full source-to-extract reproduction.
"""
import argparse,csv,hashlib,io,json,zipfile,xml.etree.ElementTree as ET
from pathlib import Path
R=Path(__file__).resolve().parent
NS={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
STATES=['IL','KS','KY','MI','MO','NE','NM','OH','OK','PA','UT','VA','WI']
UTILITIES={4110,14127,14354,15473,19876,14006}
def input_bytes(v):
 if isinstance(v,list):return ('[\n'+',\n'.join(json.dumps(x,ensure_ascii=False,separators=(',',':')) for x in v)+'\n]\n').encode()
 return (json.dumps(v,ensure_ascii=False,indent=2)+'\n').encode()
def object_bytes(cache,id):
 rec=json.loads((cache/(id+'.json')).read_text());assert rec['status']=='FETCHED',id
 b=(cache/'objects'/rec['sha256'][:2]/rec['sha256']).read_bytes()
 assert hashlib.sha256(b).hexdigest()==rec['sha256'],id
 return b,rec

def sheet_rows(b,sheet):
 with zipfile.ZipFile(io.BytesIO(b)) as z:
  strings=[]
  if 'xl/sharedStrings.xml' in z.namelist():
   strings=[''.join(si.itertext()) for si in ET.fromstring(z.read('xl/sharedStrings.xml'))]
  rel={x.attrib['Id']:x.attrib['Target'] for x in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
  ws=ET.fromstring(z.read('xl/workbook.xml')).find('m:sheets',NS)
  item=next(s for s in ws if s.attrib['name']==sheet)
  path=rel[item.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']]
  path=path.lstrip('/') if path.startswith('/') else 'xl/'+path
  for row in ET.fromstring(z.read(path)).find('m:sheetData',NS):
   d={}
   for c in row:
    ref=c.attrib['r'];t=c.attrib.get('t');v=c.find('m:v',NS)
    if t=='s':val=strings[int(v.text)]
    elif t=='inlineStr':val=''.join(c.find('m:is',NS).itertext())
    elif v is None:val=None
    elif t in ['str','e']:val=v.text
    else:
     val=float(v.text);val=int(val) if val.is_integer() else val
    d[''.join(x for x in ref if x.isalpha())]=val
   yield int(row.attrib['r']),d

def state_data(cache):
 b,r=object_bytes(cache,'eia861m-state');out=[]
 for row,d in sheet_rows(b,'Monthly-States'):
  if row==3:assert d['I']=='Thousand Dollars' and d['J']=='Megawatthours' and d['L']=='Cents/kWh'
  if row<=3 or d.get('C') not in STATES or not isinstance(d.get('A'),int) or not 2015<=d['A']<=2025:continue
  for sector,cols in [('COMMERCIAL',['I','J','K','L']),('INDUSTRIAL',['M','N','O','P'])]:
   out.append({'state':d['C'],'period':f"{d['A']:04}-{d['B']:02}",'sector':sector,'dataStatus':d['D'],'revenueThousandUSD':d[cols[0]],'salesMWh':d[cols[1]],'customers':d[cols[2]],'priceCentsPerKWh':d[cols[3]],'sourceId':r['sourceId'],'sourceHash':r['sha256'],'locator':f"Monthly-States!{cols[0]}{row}:{cols[3]}{row}"})
 return sorted(out,key=lambda x:(x['state'],x['sector'],x['period']))

def utility_data(cache):
 b,r=object_bytes(cache,'eia861m-utility2024');out=[]
 for row,d in sheet_rows(b,'Sales Ultimate Cust. -States'):
  if row==3:assert d['K']=='Thousands Dollars' and d['L']=='Megawatthours'
  if row<=3 or d.get('C') not in UTILITIES or d.get('E') not in STATES:continue
  for sector,cols in [('COMMERCIAL',['K','L','M']),('INDUSTRIAL',['N','O','P'])]:
   out.append({'utilityId':str(d['C']),'utilityName':d['D'],'state':d['E'],'period':f"{d['A']:04}-{d['B']:02}",'sector':sector,'dataStatus':d['G'],'revenueThousandUSD':d[cols[0]],'salesMWh':d[cols[1]],'customers':d[cols[2]],'sourceId':r['sourceId'],'sourceHash':r['sha256'],'locator':f"Sales Ultimate Cust. -States!{cols[0]}{row}:{cols[2]}{row}"})
 return sorted(out,key=lambda x:(x['utilityId'],x['state'],x['sector'],x['period']))

def territory(cache):
 b,r=object_bytes(cache,'eia861-2024');out=[]
 with zipfile.ZipFile(io.BytesIO(b)) as z:
  for row,d in sheet_rows(z.read('Service_Territory_2024.xlsx'),'Counties_States'):
   if row>1 and d.get('B') in UTILITIES and d.get('E') in STATES:
    out.append({'utilityId':str(d['B']),'utilityName':d['C'],'state':d['E'],'county':d['F'],'dataYear':d['A'],'sourceId':r['sourceId'],'sourceHash':r['sha256'],'locator':f'Service_Territory_2024.xlsx/Counties_States!A{row}:F{row}'})
 return sorted(out,key=lambda x:(x['utilityId'],x['state'],x['county']))

def geography(cache):
 b,r=object_bytes(cache,'census-states');states=[]
 for i,d in enumerate(csv.DictReader(io.StringIO(b.decode()),delimiter='|'),2):
  if d['STATE'] in STATES:states.append({'state':d['STATE'],'stateFips':d['STATEFP'],'stateName':d['STATE_NAME'],'sourceId':r['sourceId'],'locator':f'line {i}'})
 b,r=object_bytes(cache,'census-counties');wanted={('NE','Sarpy County'),('IL','DeKalb County'),('NM','Valencia County'),('UT','Utah County'),('OH','Licking County'),('OH','Franklin County'),('WI','Racine County'),('VA','Loudoun County')};counties=[]
 for i,d in enumerate(csv.DictReader(io.StringIO(b.decode()),delimiter='|'),2):
  if (d['STATE'],d['COUNTYNAME']) in wanted:counties.append({'state':d['STATE'],'county':d['COUNTYNAME'],'countyFips':d['STATEFP']+d['COUNTYFP'],'sourceId':r['sourceId'],'locator':f'line {i}'})
 return {'states':states,'counties':counties}

def weather(cache):
 out=[]
 for year in range(2015,2026):
  for family in ['cooling','heating']:
   b,r=object_bytes(cache,f'noaa{year}-{family}');lines=b.decode().splitlines();assert lines[0]==f'Product: Daily {family.title()} Degree Days' and lines[2]=='Weights: Population'
   rows=list(csv.reader(lines[3:],delimiter='|'));dates=rows[0][1:];assert len(dates) in [365,366] and all(x.startswith(str(year)) for x in dates)
   for line,cols in enumerate(rows[1:],5):
    if cols[0] not in STATES:continue
    for month in range(1,13):
     ix=[i for i,d in enumerate(dates) if d[4:6]==f'{month:02}'];values=[cols[i+1] for i in ix];bad=[v for v in values if v in ['','NA','-999','-9999']]
     total=None if bad else sum(float(v) for v in values)
     out.append({'state':cols[0],'period':f'{year}-{month:02}','metric':family.upper()+'_DEGREE_DAYS','value':total,'unit':'F_DEGREE_DAYS','aggregation':'SUM_DAILY_NO_FILL','dayCount':len(ix),'missingDays':len(bad),'sourceId':r['sourceId'],'sourceHash':r['sha256'],'locator':f'line {line}; date columns {dates[ix[0]]}–{dates[ix[-1]]}'})
 return sorted(out,key=lambda x:(x['state'],x['metric'],x['period']))

from html.parser import HTMLParser
class Tables(HTMLParser):
 def __init__(self):super().__init__();self.rows=[];self.row=None;self.cell=None
 def handle_starttag(self,t,a):
  if t=='tr':self.row=[]
  if t in ['td','th']:self.cell=''
 def handle_data(self,s):
  if self.cell is not None:self.cell+=s
 def handle_endtag(self,t):
  if t in ['td','th'] and self.row is not None and self.cell is not None:self.row.append(self.cell.strip());self.cell=None
  if t=='tr' and self.row is not None:self.rows.append(self.row);self.row=None

def gas(cache):
 b,r=object_bytes(cache,'henryhub');p=Tables();p.feed(b.decode());out=[]
 for row in p.rows:
  if len(row)!=13 or row[0] not in [str(y) for y in range(2015,2026)]:continue
  for m,s in enumerate(row[1:],1):
   out.append({'period':f'{row[0]}-{m:02}','value':None if s in ['','NA','-','--','W'] else float(s),'unit':'USD_PER_MMBTU','geography':'HENRY_HUB_BENCHMARK_NOT_LOCAL_DELIVERED_FUEL','sourceId':r['sourceId'],'sourceHash':r['sha256'],'locator':f'History table / {row[0]} / month {m}'})
 assert len(out)==132
 return sorted(out,key=lambda x:x['period'])

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--cache',type=Path,required=True);ap.add_argument('--check',action='store_true');a=ap.parse_args()
 for name,v in [('state-monthly.json',state_data(a.cache)),('utility-monthly-2024.json',utility_data(a.cache)),('service-territory-2024.json',territory(a.cache)),('geography.json',geography(a.cache)),('weather-monthly.json',weather(a.cache)),('henryhub-monthly.json',gas(a.cache))]:
  b=input_bytes(v)
  if a.check:assert (R/'inputs'/name).read_bytes()==b,name
  else:(R/'inputs'/name).write_bytes(b)
  print(name,len(v),hashlib.sha256(b).hexdigest())
if __name__=='__main__':main()
