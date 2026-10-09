"""Offline metadata qualification/reproduction only. Not a monitoring/forecast engine."""
import csv,gzip,hashlib,io,json,re,subprocess,sys,math
from datetime import date
from pathlib import Path
R=Path(__file__).resolve().parent
BASE='8e6b3eec6b0584c1567c13d7e3979707225324fc'
sys.path.insert(0,str(R.parent/'phase-c1a'))
from extract import sheet_rows
ASOF='2026-10-09'
def load(n):return json.loads((R/n).read_text())
def encoded(x):return (json.dumps(x,ensure_ascii=False,indent=2,sort_keys=True)+'\n').encode()
def raw(s):
 b=gzip.decompress((R/s['fixture']).read_bytes())
 if len(b)!=s['byteSize'] or hashlib.sha256(b).hexdigest()!=s['sha256']:raise ValueError('Raw hash mismatch')
 return b
def records(s):
 b=raw(s);sid=s['sourceId']
 if s['format']=='CSV':
  reader=csv.DictReader(io.StringIO(b.decode()))
  if reader.fieldnames!=['observation_date',sid]:raise ValueError('CSV identity mismatch')
  return [{'period':x['observation_date'],'value':None if x[sid] in ['','.'] else float(x[sid]),'locator':f'CSV line {i}'} for i,x in enumerate(reader,2)]
 if sid=='CENSUS_DC':
  out=[];months={n:i for i,n in enumerate(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],1)}
  for row,d in sheet_rows(b,'Private SA'):
   if row==4 and d.get('J')!='Data center':raise ValueError('Construction identity mismatch')
   m=re.fullmatch(r'([A-Z][a-z]{2})-(\d{2})([pr]?)',str(d.get('A','')))
   if not m:continue
   year=2000+int(m[2]) if int(m[2])<50 else 1900+int(m[2])
   if year<2014:continue
   val=d.get('J');out.append({'period':f'{year}-{months[m[1]]:02}-01','value':val if isinstance(val,(float,int)) else None,'nativeFlag':m[3] or None,'locator':f'Private SA!J{row}'})
  return sorted(out,key=lambda x:x['period'])
 if sid=='SPF10':
  rows=list(sheet_rows(b,'INFLATION'))
  if rows[0][1].get('E')!='INFCPI10YR':raise ValueError('Survey identity mismatch')
  return [{'period':f"{d['A']}-{1+3*(d['B']-1):02}-01",'value':d.get('E') if isinstance(d.get('E'),(float,int)) else None,'locator':f'INFLATION!E{row}'} for row,d in rows[1:] if isinstance(d.get('A'),int)]
 raise ValueError('Unsupported source')
def history(i,s):
 if s.get('fixture'):
  rs=records(s)
 elif s['sourceId']=='EIA_STATE':
  rs=[{'period':x['period']+'-01','value':x[i['nativeField']],'locator':x['locator'],'state':x['state']} for x in json.loads((R.parent/'phase-c1a/inputs/state-monthly.json').read_text()) if x['sector']=='COMMERCIAL']
 elif s['sourceId']=='EIA_GAS':
  rs=[{'period':x['period']+'-01','value':x['value'],'locator':x['locator']} for x in json.loads((R.parent/'phase-c1a/inputs/henryhub-monthly.json').read_text())]
 else:return {'status':'UNAVAILABLE','start':None,'end':None,'rows':0,'nonmissing':0,'missing':None,'missingPeriods':None,'reason':'Metadata verified; current-regime survey payload not frozen or parsed.'}
 if not rs:raise ValueError('Empty history')
 keys=[(x.get('state'),x['period']) for x in rs]
 if len(keys)!=len(set(keys)):raise ValueError('Duplicate native observation')
 valid=[x for x in rs if x['value'] is not None];missing=[x for x in rs if x['value'] is None]
 if any(x['period']>ASOF for x in rs):raise ValueError('Future observation')
 for x in rs:
  date.fromisoformat(x['period'])
  require(x['value'] is None or math.isfinite(x['value']),'Nonfinite value')
 return {'status':'VERIFIED','start':min(x['period'] for x in valid),'end':max(x['period'] for x in valid),'rows':len(rs),'nonmissing':len(valid),'missing':len(missing),'missingPeriods':sorted({x['period'] for x in missing}),'latestCaptured':[{k:x[k] for k in ['period','value','locator','state','nativeFlag'] if k in x} for x in valid if x['period']==max(v['period'] for v in valid)],'basis':'CURRENT_CAPTURED_VINTAGE_NOT_FIRST_RELEASE'}
def coverage():
 inds=load('macro-indicator-register.json')['indicators'];src={x['sourceId']:x for x in load('official-source-qualification.json')['sources']}
 return {'schemaVersion':'C1M.1','asOf':ASOF,'indicators':[dict(indicatorId=i['indicatorId'],sourceId=i['sourceId'],history=history(i,src[i['sourceId']])) for i in inds], 'inheritedGapRefs':load('gap-preservation.json'),'newGaps':[
 {'gapId':'M-AI','status':'UNAVAILABLE','severity':'HIGH','gap':'No identified aggregate AI electricity or investment shock; macro indicators cannot identify AI inflation causality.','blocks':'CAUSAL_AI_ATTRIBUTION_ONLY'},
 {'gapId':'M-BTOS','status':'PARTIAL','severity':'MEDIUM','gap':'New business-functions AI regime is short; no frozen numeric payload/weights/uncertainty audit. No old/new splicing.','blocks':'BTOS_AUTOMATED_MONITOR'},
 {'gapId':'M-VINTAGE','status':'PARTIAL','severity':'MEDIUM','gap':'Current histories are not first-release vintages; exact initial release dates/history retention require C2 design.','blocks':'REAL_TIME_BACKTEST'},
 {'gapId':'M-ENERGY','status':'PARTIAL','severity':'MEDIUM','gap':'13-state commercial subset is not US total electricity demand; supply and national aggregate adapter remain deferred.','blocks':'NATIONAL_ENERGY_SUMMARY'},
 {'gapId':'M-REVISION','status':'PARTIAL','severity':'MEDIUM','gap':'Some provider revision/publication policies only qualitatively documented; numeric lags remain null.','blocks':'HARD_FRESHNESS_ALERT'}], 'granularGapsBlockMacroFramework':False}
def require(c,msg):
 if not c:raise ValueError(msg)
def validate(inds=None,sources=None,evidence=None):
 inds=load('macro-indicator-register.json')['indicators'] if inds is None else inds
 sources=load('official-source-qualification.json')['sources'] if sources is None else sources
 ev=load('macro-transmission-evidence.json')['evidence'] if evidence is None else evidence
 for arr,key in [(inds,'indicatorId'),(sources,'sourceId'),(ev,'evidenceId')]:require(len({x[key] for x in arr})==len(arr),'Duplicate '+key)
 sd={s['sourceId']:s for s in sources};hs={h['hypothesisId'] for h in json.loads((R.parent/'phase-c0/hypothesis-matrix.json').read_text())['hypotheses']}
 for s in sources:
  require(s['status'] in ['VERIFIED','PARTIAL','UNVERIFIED','UNAVAILABLE'],'Source status')
  require(s['officialURL'].startswith('https://') and s['originalProvider']!='FRED','Official origin')
  from urllib.parse import urlparse
  parsed=urlparse(s['officialURL']);host=parsed.hostname
  require(parsed.username is None and parsed.password is None and not parsed.fragment,'Source credentials or fragment')
  if s.get('fixture'):require(s['fixture'].startswith('fixtures/') and '..' not in Path(s['fixture']).parts,'Fixture path')
  require(host in {'fred.stlouisfed.org','www.census.gov','www.eia.gov','www.philadelphiafed.org'},'Official host')
  if s.get('fixture'):raw(s)
  if s.get('inheritedSourceRef'):
   path,sid=s['inheritedSourceRef'].split('#')
   orig=next(x for x in json.loads((R/path).read_text())['sources'] if x['sourceId']==sid)
   require(s['sha256']==orig['sha256'] and s['byteSize']==orig['byteSize'] and s['officialURL']==orig['url'],'Inherited source identity')
 for i in inds:
  require(i['sourceId'] in sd,'Unknown source')
  require(i['status'] in ['VERIFIED','PARTIAL','UNVERIFIED','UNAVAILABLE'],'Indicator status')
  for k in ['economicSignificance','unit','frequency','geography','definition','revisionPolicy','publicationSchedule','quality','limitations','inflationConnection','automatedRetrievalFeasibility','analyticalDefinition','confounders','falsification']:
   require(i.get(k) is not None and i[k]!='','Missing metadata '+k)
  require(i['attribution'] in ['MACRO_CONTEXT','DATA_CENTER_RELATED_NOT_AI_SPECIFIC','SURVEY_AI_USE_NOT_PRODUCTIVITY'],'Unsupported AI attribution')
  require(i['evidenceGrade']=='E1','Indicator grade')
  require(i['publicationLagDays'] is None,'Unsupported numeric lag')
  require(i['aiSpecificValue'] is None,'Invented AI value')
  require(set(i['hypothesisRefs'])<=hs,'Unknown hypothesis')
  require(i['latestAvailableObservationDate'] is None or i['latestAvailableObservationDate']<=ASOF,'Future latest')
  for field in ['latestAvailableObservationDate','latestVerifiedObservationDate']:
   if i[field] is not None:
    try:date.fromisoformat(i[field])
    except ValueError:raise ValueError('Invalid observation date')
  require(i['latestAvailableObservationDate'] is None or i['latestVerifiedObservationDate'] is None or i['latestAvailableObservationDate']>=i['latestVerifiedObservationDate'],'Latest chronology')
  if i['indicatorId']=='BTOS_AI':require(i['definitionVersion']=='BUSINESS_FUNCTIONS_2025_11_17' and i['splicePreviousRegime'] is False,'BTOS break')
  if i['indicatorId']=='T10YIE':require(i['measureType']=='INFLATION_COMPENSATION_NOT_PURE_EXPECTATIONS','Breakeven semantics')
  if i['indicatorId']=='NCBDBIQ027S':require(i['measureType']=='DEBT_SECURITIES_STOCK_NOT_ISSUANCE_OR_TOTAL_DEBT','Debt stock semantics')
  if i['indicatorId']=='CENSUS_DC':require(i['measureType']=='CONSTRUCTION_SAAR_NOT_TOTAL_AI_CAPEX','Construction scope')
  h=history(i,sd[i['sourceId']]);require(i['status']!='VERIFIED' or h['status']=='VERIFIED','Verified needs payload')
  require(i['latestVerifiedObservationDate']==(h['end'] if h['status']=='VERIFIED' else None),'Latest payload mismatch')
 for e in ev:
  require(e['evidenceGrade'] in ['E0','E1','E2','E3','E4'],'Invalid evidence grade')
  require(e['evidenceGrade'] in ['E0','E1'],'Unqualified grade upgrade')
  require(set(e['indicatorRefs'])<={i['indicatorId'] for i in inds},'Unknown indicator')
  require(set(e.get('sourceRefs',[]))<=set(sd),'Unknown evidence source')
  require(set(e.get('inheritedHypothesisRefs',[]))<=hs,'Unknown evidence hypothesis')
  for k in ['sourceReliability','dataReproducibility','statisticalRobustness','causalIdentification','externalValidity','uncertainty','gradeJustification']:require(bool(e.get(k)),'Missing evidence dimension')
  require(e['causalIdentification']=='NONE','Unsupported causality')
 require({i['channel'] for i in inds}=={'ENERGY','FINANCING','PRODUCTIVITY','INFLATION'},'Channel coverage')
 return True
def scope():
 repo=R.parents[2];lock=load('baseline-lock.json')
 for p,h in lock['files'].items():require((repo/p).is_file() and hashlib.sha256((repo/p).read_bytes()).hexdigest()==h,'Inherited mutation '+p)
 changed=subprocess.check_output(['git','diff','--name-only',BASE],cwd=repo,text=True).splitlines()
 changed+=subprocess.check_output(['git','ls-files','--others','--exclude-standard'],cwd=repo,text=True).splitlines()
 require(all(p.startswith('research/ai-infrastructure-paper-validation/phase-c1m/') for p in changed),'Out of scope mutation')
 return {'lockedInheritedFiles':len(lock['files']),'changedFiles':len(changed),'productionModified':False}
def identity():
 files={str(p.relative_to(R)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(R.rglob('*')) if p.is_file() and '__pycache__' not in p.parts and p.name not in ['content-identity.json','validation-results.json','retrieval-receipts.json']}
 return {'schemaVersion':'C1M.1','asOf':ASOF,'files':files,'sha256':hashlib.sha256(encoded(files)).hexdigest()}
if __name__=='__main__':
 validate();scope();c=encoded(coverage())
 if '--write' in sys.argv:(R/'historical-coverage-and-gaps.json').write_bytes(c)
 else:require(c==(R/'historical-coverage-and-gaps.json').read_bytes(),'Coverage reproduction mismatch')
 if '--freeze' in sys.argv:(R/'content-identity.json').write_bytes(encoded(identity()))
 elif '--identity' not in sys.argv:require(identity()==load('content-identity.json'),'Content identity mismatch')
 print(json.dumps(identity() if '--identity' in sys.argv else {'validated':True,'scope':scope()},sort_keys=True))
