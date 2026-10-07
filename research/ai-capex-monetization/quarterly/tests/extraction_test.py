"""Independent, small synthetic native tables. No live network or large raw fixtures."""
import unittest, tempfile, json, hashlib, sys
from pathlib import Path
from unittest.mock import patch
from types import SimpleNamespace
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from extract import extract,publication,parse_tables,quarter_header,pdf_tables
from workbook import extract_workbook
from openpyxl import Workbook
FIXTURE=Path(__file__).resolve().parents[1]/'fixtures/native-quarter.html'
class NativeTables(unittest.TestCase):
 def setUp(self):self.temp=tempfile.TemporaryDirectory();self.cache=Path(self.temp.name)
 def tearDown(self):self.temp.cleanup()
 def source(self,raw):
  h=hashlib.sha256(raw).hexdigest();p=self.cache/'objects'/h[:2]/h;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(raw)
  return {'sourceId':'fixture-msft','company':'MSFT','periodEnd':'2026-06-30','sha256':h,'parser':'html'}
 def test_native_values_signs_and_comparative_year(self):
  source,rows,issues=extract(self.source(FIXTURE.read_bytes()),self.cache)
  r={(o['metric'],o['periodEnd']):o['value'] for o in rows}
  self.assertEqual(r['revenue','2026-06-30'],100);self.assertEqual(r['revenue','2025-06-30'],90);self.assertEqual(r['cashPpeGross','2026-06-30'],30);self.assertEqual(source['publicationDate'],'2026-07-29')
 def test_incompatible_column_order_rejected(self):
  raw=FIXTURE.read_bytes().replace(b'<td>2026</td><td>2025</td>',b'<td>2025</td><td>2026</td>');_,rows,_=extract(self.source(raw),self.cache);self.assertEqual(rows,[])
 def test_annual_and_ytd_are_not_quarters(self):
  raw=FIXTURE.read_bytes().replace(b'Three Months Ended',b'Six Months Ended');_,rows,_=extract(self.source(raw),self.cache);self.assertEqual(rows,[])
 def test_wrong_native_month_rejected(self):
  raw=FIXTURE.read_bytes().replace(b'Three Months Ended June 30',b'Three Months Ended March 31');_,rows,_=extract(self.source(raw),self.cache);self.assertEqual(rows,[])
 def test_thousands_cannot_silently_be_millions(self):
  raw=FIXTURE.read_bytes().replace(b'In millions',b'In thousands');_,rows,_=extract(self.source(raw),self.cache);self.assertEqual(rows,[])
 def test_conflicting_duplicate_row_is_unqualified(self):
  raw=FIXTURE.read_bytes().replace(b'<tr><td>Total revenue</td><td>100</td><td>90</td></tr>',b'<tr><td>Total revenue</td><td>100</td><td>90</td></tr><tr><td>Total revenue</td><td>999</td><td>90</td></tr>');_,rows,issues=extract(self.source(raw),self.cache);self.assertFalse(any(o['metric']=='revenue' for o in rows));self.assertTrue(any(i['metric']=='revenue' and i['matches']==2 for i in issues))
 def test_equal_repeated_disclosures_retain_two_locators(self):
  raw=FIXTURE.read_bytes().replace(b'<tr><td>Total revenue</td><td>100</td><td>90</td></tr>',b'<tr><td>Total revenue</td><td>100</td><td>90</td></tr>'*2);_,rows,_=extract(self.source(raw),self.cache);r=next(o for o in rows if o['metric']=='revenue');self.assertEqual(r['value'],100);self.assertEqual(len(r['repeatedNativeLocators']),1)
 def test_hash_corruption_rejected(self):
  s=self.source(FIXTURE.read_bytes());(self.cache/'objects'/s['sha256'][:2]/s['sha256']).write_text('wrong bytes');self.assertRaisesRegex(ValueError,'RAW_HASH',extract,s,self.cache)
 def test_missing_issuer_rejected(self):
  self.assertRaisesRegex(ValueError,'ISSUER',extract,self.source(FIXTURE.read_bytes().replace(b'Microsoft',b'Other')),self.cache)
 def test_publication_dateline_not_later_acquisition_date(self):
  self.assertEqual(publication('Alphabet MOUNTAIN VIEW, Calif. – July 26, 2022 – results. Stock record date July 1, 2022.','2022-06-30')[0],'2022-07-26')
 def test_abbreviated_publication_date(self):
  self.assertEqual(publication('MENLO PARK, Calif., Jan. 27, 2021 /PRNewswire/','2020-12-31')[0],'2021-01-27')
 def test_impossible_publication_date_rejected(self):
  self.assertRaises(ValueError,publication,'SEATTLE February 30, 2026','2025-12-31')
 def test_publication_before_observation_rejected(self):self.assertRaises(ValueError,publication,'SEATTLE June 29, 2026','2026-06-30')
 def test_fcf_footnote_is_native_label_not_missing_disclosure(self):
  import re
  from extract import patterns
  self.assertTrue(re.fullmatch(patterns['META']['fcfReported'],'Free cash flow (1)'))
  self.assertFalse(re.fullmatch(patterns['META']['fcfReported'],'Free cash flow per share'))
 def test_amazon_pdf_wrapped_label_and_parentheses(self):
  page='AMAZON.COM, INC.\nConsolidated Statements of Cash Flows\n(in millions)\nThree Months EndedSeptember 30,\n2019     2020\nDepreciation and amortization of property and equipment and\ncapitalized content costs, operating lease assets, and other     5,563     6,523\nPurchases of property and equipment     (3,000)     (4,000)'
  fake=SimpleNamespace(pages=[SimpleNamespace(extract_text=lambda **kwargs:page)])
  with patch('extract.PdfReader',return_value=fake):text,tables=pdf_tables('unused')
  rows=tables[0][1];self.assertTrue(quarter_header(rows,'AMZN','2020-09-30'));self.assertEqual(rows[-1][1],[-3000,-4000]);self.assertIn('capitalized content costs',rows[-3][0]);self.assertEqual(rows[-3][1],[5563,6523])
  self.assertEqual(rows[-2][:3],('',[],''));self.assertEqual(len(rows),8)
 def test_deterministic_raw_extraction(self):
  s=self.source(FIXTURE.read_bytes());self.assertEqual(json.dumps(extract(s.copy(),self.cache),sort_keys=True),json.dumps(extract(s.copy(),self.cache),sort_keys=True))
 def workbook(self,unit='(In billions)',value=41):
  w=Workbook();s=w.active;s.title='CapEx';s['A2']='Capital Expenditures Including Assets Acquired Under Capital Leases';s['A3']=unit;s['B5']='Q4-26';s['A6']='Capital expenditures including assets acquired under capital leases';s['B6']=value;p=self.cache/'fixture.xlsx';w.save(p);raw=p.read_bytes();source=self.source(raw);source['sourceId']='fixture-workbook';return source
 def test_microsoft_workbook_native_capex_and_precision(self):
  rows=extract_workbook(self.workbook(),self.cache);self.assertEqual(rows[0]['value'],41000);self.assertEqual(rows[0]['periodEnd'],'2026-06-30');self.assertEqual(rows[0]['precision'],'ROUNDED');self.assertEqual(rows[0]['metric'],'nativeCapex');self.assertNotIn('AI',rows[0]['scope'])
 def test_workbook_changed_unit_rejected(self):self.assertRaisesRegex(ValueError,'WORKBOOK_DEFINITION',extract_workbook,self.workbook('(In millions)'),self.cache)
 def test_workbook_missing_value_rejected(self):self.assertRaisesRegex(ValueError,'WORKBOOK_VALUE',extract_workbook,self.workbook(value=None),self.cache)
if __name__=='__main__':unittest.main()
