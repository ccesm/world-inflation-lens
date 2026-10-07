import unittest,tempfile,hashlib,importlib.util
from pathlib import Path
spec=importlib.util.spec_from_file_location('refresh_extract',Path(__file__).parents[1]/'scripts/extract.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
fixture=Path(__file__).parents[1]/'fixtures/candidate-quarter.html'
class CandidateParsing(unittest.TestCase):
 def setUp(self):self.tmp=tempfile.TemporaryDirectory();self.cache=Path(self.tmp.name)
 def tearDown(self):self.tmp.cleanup()
 def source(self,raw):
  h=hashlib.sha256(raw).hexdigest();p=self.cache/'objects'/h[:2]/h;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(raw)
  return {'company':'MSFT','sourceId':'synthetic-msft-2026q3','parser':'html','sha256':h,'periodEnd':'2026-09-30','publicationDate':'2026-10-28'}
 def run_raw(self,raw):return module.extract(self.source(raw),self.cache)
 def test_new_quarter_native_extraction(self):
  r=self.run_raw(fixture.read_bytes());values={o['metric']:o['value'] for o in r['observations'] if o['periodEnd']=='2026-09-30'};self.assertEqual(values['revenue'],100);self.assertEqual(values['cfo'],60);self.assertEqual(values['cashPpeGross'],30);self.assertEqual(set(o['calendarQuarter'] for o in r['observations']),{'2026Q3','2025Q3'})
 def test_ambiguous_context_not_first_matching_value(self):
  raw=fixture.read_bytes().replace(b'<tr><td>Total revenue</td><td>100</td><td>90</td></tr>',b'<tr><td>Total revenue</td><td>100</td><td>90</td></tr><tr><td>Total revenue</td><td>999</td><td>90</td></tr>');self.assertFalse(any(o['metric']=='revenue' for o in self.run_raw(raw)['observations']))
 def test_wrong_native_header_rejected(self):self.assertEqual(self.run_raw(fixture.read_bytes().replace(b'September 30',b'June 30'))['observations'],[])
 def test_ytd_not_divided_into_quarters(self):self.assertEqual(self.run_raw(fixture.read_bytes().replace(b'Three Months Ended',b'Nine Months Ended'))['observations'],[])
 def test_unit_thousands_not_millions(self):self.assertEqual(self.run_raw(fixture.read_bytes().replace(b'In millions',b'In thousands'))['observations'],[])
 def test_publication_before_quarter_rejected(self):
  source=self.source(fixture.read_bytes());source['publicationDate']='2026-01-01';self.assertRaisesRegex(ValueError,'PUBLICATION',module.extract,source,self.cache)
 def test_run_rate_guidance_and_policy_are_review_text_not_recognized_values(self):
  raw=fixture.read_bytes().replace(b'</body>',b'<p>AI annualized revenue run-rate exceeds $37 billion. Capital expenditures are expected to be $175 billion. Useful life of equipment is six years. Remaining performance obligations include short-term contracts.</p></body>');r=self.run_raw(raw);e=next(e for e in r['events'] if e['kind']=='DIRECT_AI_RUN_RATE');self.assertEqual(e['periodType'],'RUN_RATE');self.assertIsNone(e['value']);self.assertFalse(e['recognizedRevenue']);self.assertEqual(e['status'],'REVIEW_REQUIRED');self.assertTrue(any(i['type']=='USEFUL_LIFE_POLICY' for i in r['reviewItems']))
