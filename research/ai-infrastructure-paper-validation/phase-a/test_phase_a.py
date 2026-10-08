"""Captured-source checks and negative cases; no live network."""
import csv,datetime as dt,gzip,hashlib,importlib,json,pathlib,subprocess,sys,unittest
from build import ROOT,COMPANIES,TAGS,choose,total,ratio,normalize,end_date

def read(name):
 with (ROOT/name).open() as f:return list(csv.DictReader(f))
def aggregate(rows,metric):
 if len(rows)!=5 or {r['company'] for r in rows}!=set(COMPANIES):return None
 return total([r.get(metric) for r in rows])
def calendar_value(rows):
 if len(rows)!=4 or any(r['value_usd'] in ('',None) for r in rows):return None
 rows=sorted(rows,key=lambda r:r['reporting_start'])
 for prev,cur in zip(rows,rows[1:]):
  if dt.date.fromisoformat(prev['reporting_end'])+dt.timedelta(days=1)!=dt.date.fromisoformat(cur['reporting_start']):raise ValueError('overlap or gap')
 return sum(int(r['value_usd']) for r in rows)
class PhaseATests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.quarters=read('company-quarterly-source.csv');cls.annual=read('company-calendar-year.csv');cls.aggregate=read('five-company-aggregate.csv');cls.raw=read('company-source-observations.csv');cls.register=json.loads((ROOT/'source-register.json').read_text())
 def test_01_no_overlapping_ytd_addition(self):
  for r in self.quarters:
   if not r['value_usd']:continue
   q=int(r['fiscal_quarter']);self.assertEqual(int(r['value_usd']),int(r['ytd_original_value'])-int(r['prior_ytd_original_value']))
   if q>1:self.assertNotEqual(int(r['value_usd']),int(r['ytd_original_value']))
  rows=[dict(r) for r in self.quarters if r['company']=='alphabet' and r['metric']=='ocf' and r['calendar_year_bucket']=='2024']
  rows[1]['reporting_start']=rows[0]['reporting_start']
  with self.assertRaises(ValueError):calendar_value(rows)
 def test_02_calendarization_and_boundaries(self):
  for r in self.annual:
   qq=[q for q in self.quarters if q['company']==r['company'] and q['metric']=='cash_capex' and q['calendar_year_bucket']==r['calendar_year']]
   self.assertEqual(calendar_value(qq),int(r['cash_capex_usd']))
   self.assertEqual(min(q['reporting_start'] for q in qq),r['reporting_start']);self.assertEqual(max(q['reporting_end'] for q in qq),r['reporting_end'])
   if r['company']=='oracle':self.assertEqual(r['exact_calendar_cash_capex_usd'],'');self.assertEqual(r['reporting_end'][-5:],'11-30')
   else:self.assertEqual(r['calendar_alignment'],'EXACT')
 def test_03_unit_normalization(self):
  self.assertEqual(normalize(1234,'USD_MILLION'),1234000000);self.assertEqual(normalize(1.234,'USD_BILLION'),1234000000);self.assertIsNone(normalize(None,'USD'))
  with self.assertRaises(ValueError):normalize(3,'EUR')
  for r in self.raw:self.assertEqual(r['native_unit'],'USD');self.assertEqual(int(r['original_value'])%1000000,0)
 def test_04_company_completeness(self):
  for y in range(2020,2026):
   rows=[r for r in self.annual if int(r['calendar_year'])==y];self.assertEqual(len(rows),5);self.assertEqual({r['company'] for r in rows},set(COMPANIES))
   for r in rows:self.assertEqual(r['cash_capex_quarters_available'],'4');self.assertEqual(r['ocf_quarters_available'],'4')
  self.assertIsNone(aggregate([{'company':c,'v':1} for c in list(COMPANIES)[:4]],'v'))
 def test_05_five_company_aggregation(self):
  for r in self.aggregate:
   rows=[x for x in self.annual if x['calendar_year']==r['calendar_year']]
   for m in ('cash_capex','ocf'):self.assertEqual(int(r[m+'_usd']),aggregate([{'company':x['company'],'v':int(x[m+'_usd'])} for x in rows],'v'))
   self.assertAlmostEqual(float(r['capex_ocf_ratio']),int(r['cash_capex_usd'])/int(r['ocf_usd']))
  bad=[{'company':'meta','v':1} for _ in range(5)];self.assertIsNone(aggregate(bad,'v'))
 def test_06_source_traceability_and_capture_integrity(self):
  docs={r['id']:r for r in self.register['filings']}
  for r in self.raw:self.assertIn(r['source_document'],docs);self.assertIn(r['accession'].replace('-',''),r['source_url']);self.assertLessEqual(r['filing_date'],'2026-10-08')
  for s in self.register['sources']:
   p=ROOT/s['path'];self.assertEqual(hashlib.sha256(p.read_bytes()).hexdigest(),s['captured_sha256']);self.assertEqual(hashlib.sha256(gzip.decompress(p.read_bytes())).hexdigest(),s['raw_sha256'])
  for r in self.quarters:
   if r['value_usd']:
    self.assertIn(r['source_document'],docs)
    for value,date,accn,end in [(r['ytd_original_value'],r['filing_date'],r['accession'],r['reporting_end'])]+([(r['prior_ytd_original_value'],r['prior_filing_date'],r['prior_accession'],(dt.date.fromisoformat(r['reporting_start'])-dt.timedelta(days=1)).isoformat())] if int(r['fiscal_quarter'])>1 else []):
     self.assertTrue(any(x['company']==r['company'] and x['metric']==r['metric'] and x['start']==r['fiscal_ytd_start'] and x['end']==end and x['original_value']==value and x['filing_date']==date and x['accession']==accn for x in self.raw))
 def test_07_fiscal_year_reconciliation(self):
  rec=read('fiscal-reconciliation.csv');self.assertGreater(len(rec),60)
  for r in rec:self.assertEqual(r['classification'],'PASS');self.assertEqual(int(r['difference_usd']),0)
 def test_08_missing_data_behavior(self):
  self.assertIsNone(total([1,None,3]));self.assertIsNone(total([]));self.assertIsNone(ratio(3,0));self.assertIsNone(ratio(None,5))
  rows=[dict(q) for q in self.quarters if q['company']=='meta' and q['metric']=='ocf' and q['calendar_year_bucket']=='2025'];rows[0]['value_usd']=None;self.assertIsNone(calendar_value(rows));self.assertIsNone(calendar_value(rows[1:]))
  self.assertIsNone(aggregate([{'company':c,'v':None if c=='meta' else 1} for c in COMPANIES],'v'))
 def test_09_paper_isolation(self):
  text=(ROOT/'build.py').read_text();self.assertNotIn('paper-comparison',text);self.assertNotIn('REFERENCE',text);self.assertNotIn('800.5',text)
  names=['company-quarterly-source.csv','company-calendar-year.csv','five-company-aggregate.csv'];before={n:hashlib.sha256((ROOT/n).read_bytes()).hexdigest() for n in names}
  import compare
  original=compare.REFERENCE[:]
  try:compare.REFERENCE=[(y,c*2,o*3) for y,c,o in original];compare.compare();self.assertEqual(before,{n:hashlib.sha256((ROOT/n).read_bytes()).hexdigest() for n in names})
  finally:compare.REFERENCE=original;compare.compare()
 def test_10_2026_separation(self):
  self.assertEqual({r['calendar_year'] for r in self.aggregate},{str(y) for y in range(2020,2026)})
  for r in read('2026-observed.csv'):self.assertEqual(r['annualized'],'False');self.assertIn('OBSERVED',r['classification']);self.assertLess(r['reporting_end'],'2026-12-31')
  r=read('paper-comparison.csv')[-1];self.assertEqual(r['year'],'2026');self.assertEqual(r['independent_cash_capex'],'');self.assertEqual(r['ocf_percentage_difference'],'')
 def test_11_first_vintage_and_revisions(self):
  for r in self.quarters:
   if not r['value_usd']:continue
   choices=[x for x in self.raw if x['company']==r['company'] and x['metric']==r['metric'] and x['start']==r['fiscal_ytd_start'] and x['end']==r['reporting_end']]
   self.assertEqual(r['filing_date'],min(x['filing_date'] for x in choices))
  revisions=read('reporting-revisions.csv');self.assertEqual(len(revisions),10)
  for r in revisions:self.assertEqual(int(r['latest_value_usd'])-int(r['first_value_usd']),int(r['revision_usd']))
 def test_13_guidance_and_supplemental_traceability(self):
  evidence=json.loads((ROOT/'supplemental-evidence.json').read_text());register=json.loads((ROOT/'supplemental-source-register.json').read_text());ids={x['id'] for x in register}
  for x in evidence['excerpts']+evidence['guidance']:self.assertIn(x['source_id'],ids)
  for x in evidence['guidance']:
   if x['classification']=='GUIDANCE_UNVERIFIED':self.assertIsNone(x['value_low']);self.assertIsNone(x['value_high'])
   else:self.assertEqual(x['classification'],'COMPANY_GUIDANCE');self.assertLessEqual(x['publication_date'],'2026-10-08')
  self.assertEqual(evidence['independent_estimates'],[])
  for x in register:
   if x['captured_path']:self.assertEqual(hashlib.sha256((ROOT/x['captured_path']).read_bytes()).hexdigest(),x['sha256'])
 def test_12_reproducible_offline(self):
  names=['company-quarterly-source.csv','company-calendar-year.csv','five-company-aggregate.csv','source-register.json'];before={n:hashlib.sha256((ROOT/n).read_bytes()).hexdigest() for n in names}
  subprocess.run([sys.executable,str(ROOT/'build.py')],check=True,stdout=subprocess.DEVNULL)
  self.assertEqual(before,{n:hashlib.sha256((ROOT/n).read_bytes()).hexdigest() for n in names})
if __name__=='__main__':unittest.main(verbosity=2)
