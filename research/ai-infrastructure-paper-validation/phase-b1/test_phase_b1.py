"""Deterministic offline tests; input/source and accounting protections, not credit ratings."""
import copy,gzip,hashlib,json,subprocess,sys,unittest
from pathlib import Path
import build
R=Path(__file__).resolve().parent
P=R.parents[2]
def load(n):return json.loads((R/n).read_text())
class B1(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.bs=load('funding-bridges.json');cls.rows=load('financial-observations.json');cls.ex=load('primary-extracts.json')
 def b(self,c,l):return next(b for b in self.bs if b['company']==c and b['label']==l)
 def test_01_all_nine_funding_bridges(self):
  self.assertEqual(len(self.bs),9)
  for b in self.bs:
   v=b['reported_values_usd']
   self.assertEqual(v['ocf']+v['investing_cf']+v['financing_cf']+v['fx'],v['reported_cash_change'])
   self.assertEqual(v['combined_cash']-v['combined_cash_begin'],v['reported_cash_change'])
   self.assertEqual(b['status'],'RECONCILED')
 def test_02_missing_not_zero(self):
  self.assertIsNone(build.total(1,None));self.assertIsNone(build.divide(1,None));self.assertIsNone(build.divide(1,0))
  absent=[r for r in self.rows if r['status']=='UNAVAILABLE'];self.assertGreater(len(absent),0)
  self.assertTrue(all(r['value_usd'] is None for r in absent))
 def test_03_alias_conflict_fails_closed(self):
  us={t:{'units':{'USD':[dict(start='2025-01-01',end='2025-12-31',accn='a',filed='2026-01-01',val=v)]}} for t,v in [('a',10),('b',11)]}
  self.assertEqual(build.extract(us,['a','b'],'2025-01-01','2025-12-31','a')[:2],(None,'CONFLICT_REQUIRES_REVIEW'))
 def test_04_exact_context_not_first_tag(self):
  us={'a':{'units':{'USD':[dict(start='2025-01-01',end='2025-06-30',accn='a',filed='2025-07-01',val=999)]}}}
  self.assertIsNone(build.extract(us,['a'],'2025-01-01','2025-12-31','a')[0])
 def test_05_future_source_rejected(self):
  d=copy.deepcopy(self.ex);d['sources'][0]['publication_date']='2099-01-01'
  with self.assertRaisesRegex(ValueError,'Future'):build.validate_extracts(d)
 def test_06_wrong_issuer_rejected(self):
  d=copy.deepcopy(self.ex);d['observations'][0]['company']='oracle'
  with self.assertRaisesRegex(ValueError,'issuer'):build.validate_extracts(d)
 def test_07_unofficial_host_rejected(self):
  d=copy.deepcopy(self.ex);d['sources'][0]['public_url']='https://finance.example.com/a'
  with self.assertRaisesRegex(ValueError,'Unofficial'):build.validate_extracts(d)
 def test_08_duplicate_extract_rejected(self):
  d=copy.deepcopy(self.ex);d['observations'].append(d['observations'][0])
  with self.assertRaisesRegex(ValueError,'Duplicate'):build.validate_extracts(d)
 def test_09_no_future_context(self):
  for r in self.rows:self.assertLessEqual(r['filed'],build.AS_OF)
 def test_10_original_vintage(self):
  for b in self.bs:
   c=b['company'];us=json.load(gzip.open(build.A/'sources'/f'{c}-companyfacts.json.gz'))['facts']['us-gaap']
   ctx=[r for r in us['NetCashProvidedByUsedInOperatingActivities']['units']['USD'] if r.get('start')==b['start'] and r['end']==b['end'] and r['form']==b['form'] and r['filed']<=build.AS_OF]
   first=min(ctx,key=lambda r:(r['filed'],r['accn']))
   self.assertEqual(b['accession'],first['accn'])
 def test_11_revision_ledger(self):
  rr=load('vintage-differences.json');self.assertGreater(len(rr),0)
  for r in rr:
   self.assertNotEqual(r['original_value'],r['later_value'])
   row=next(x for x in self.rows if x['observation_id']==r['observation_id'])
   self.assertEqual(row['value_usd'],r['original_value'])
 def test_12_native_oracle_periods(self):
  for b in self.bs:
   if b['company']=='oracle' and b['form']=='10-K':
    self.assertTrue(b['start'].endswith('06-01'));self.assertTrue(b['end'].endswith('05-31'));self.assertEqual(b['basis'],'NATIVE_FISCAL_YEAR')
 def test_13_phase_a_proxy_preserved(self):
  import csv
  with (build.A/'company-calendar-year.csv').open() as f:
   for r in csv.DictReader(f):
    if r['company']=='oracle':self.assertEqual(r['calendar_alignment'],'ONE_MONTH_EARLY_PROXY')
 def test_14_2026_not_annualized(self):
  for b in self.bs:
   self.assertFalse(b['annualized'])
   if b['form']=='10-Q':self.assertIsNone(b['debt_ocf_ratio']);self.assertIsNone(b['liquidity_to_next12m_debt_principal_only'])
 def test_15_2026_period_boundaries(self):
  self.assertEqual(self.b('amazon','2026H1')['start'],'2026-01-01')
  self.assertEqual(self.b('oracle','FY2027Q1')['start'],'2026-06-01')
 def test_16_amazon_net_fcf_native(self):
  for year,expected in [(2023,36813000000),(2024,38219000000),(2025,11194000000)]:
   b=self.b('amazon',f'CY{year}');v=b['reported_values_usd']
   self.assertEqual(b['company_convention_fcf_usd'],expected)
   self.assertEqual(b['company_convention_fcf_usd'],v['reported_company_fcf'])
   self.assertEqual(b['company_convention_net_cash_capex_usd'],v['reported_net_cash_capex'])
 def test_17_gross_net_not_confused(self):
  b=self.b('amazon','CY2025');self.assertEqual(b['gross_ocf_minus_capex_usd'],7695000000)
  self.assertEqual(b['company_convention_fcf_usd'],11194000000)
 def test_18_oracle_fcf(self):
  self.assertEqual(self.b('oracle','FY2025')['company_convention_fcf_usd'],-394000000)
  self.assertEqual(self.b('oracle','FY2026')['company_convention_fcf_usd'],-23686000000)
 def test_19_customer_cash_not_deferred_stock(self):
  b=self.b('oracle','FY2027Q1');v=b['reported_values_usd']
  self.assertEqual(v['customer_financing_prepayments'],11363000000)
  self.assertEqual(v['ocf'],23103000000)
  self.assertNotEqual(v['deferred_revenue'],v['customer_financing_prepayments'])
 def test_20_rounded_note_not_cashflow_substitution(self):
  v=self.b('oracle','FY2027Q1')['reported_values_usd'];self.assertEqual(v['customer_prepayments_rounded_note'],11400000000)
  self.assertNotEqual(v['customer_financing_prepayments'],v['customer_prepayments_rounded_note'])
 def test_21_stockholder_dividend_label(self):
  v=self.b('oracle','FY2027Q1')['reported_values_usd']
  self.assertIsNone(v['cash_common_dividends']);self.assertEqual(v['cash_stockholder_dividends'],1565000000)
 def test_22_restricted_cash_bridge_not_liquidity(self):
  b=self.b('oracle','FY2027Q1');v=b['reported_values_usd']
  self.assertEqual(v['combined_cash'],38934000000);self.assertEqual(v['cash'],36369000000)
  self.assertEqual(b['cash_and_short_term_investments_usd'],37077000000)
 def test_23_debt_carrying_not_face(self):
  b=self.b('amazon','CY2025');v=b['reported_values_usd']
  self.assertEqual(v['long_term_debt_face'],68836000000)
  self.assertEqual(b['borrowings_excluding_leases_usd'],68851000000)
  self.assertEqual(b['borrowings_excluding_leases_usd'],65648000000+2748000000+455000000)
 def test_24_no_lease_double_count(self):
  b=self.b('amazon','CY2025');self.assertEqual(b['reported_values_usd']['finance_lease_liability'],12286000000)
  self.assertEqual(b['borrowings_excluding_leases_usd'],68851000000)
  self.assertEqual(b['company_convention_net_cash_capex_usd'],128320000000)
 def test_25_no_stock_to_flow_conversion(self):
  for b in self.bs:
   v=b['reported_values_usd'];self.assertEqual(b['computed_cash_change_usd'],sum(v[k] for k in ['ocf','investing_cf','financing_cf','fx']))
 def test_26_narrow_coverage_label(self):
  for b in self.bs:self.assertIn('excluding interest, leases, purchases',b['liquidity_coverage_limitation'])
 def test_27_positive_zero_disclosure(self):
  rr=[r for r in self.ex['observations'] if r['metric']=='buybacks']
  self.assertEqual(len(rr),3);self.assertTrue(all('explicit no repurchases' in r['source_locator'] for r in rr))
 def test_28_future_commitments_not_current_cf(self):
  for r in self.rows:
   if r['metric'].startswith('uncommenced_leases'):self.assertEqual(r['kind'],'FUTURE_COMMITMENT')
 def test_29_provenance_every_number(self):
  for r in self.rows:
   if r['value_usd'] is not None:
    self.assertTrue(r['source_id']);self.assertTrue(r['source_locator']);self.assertEqual(r['currency'],'USD')
    if r.get('accession') is None:
     source=next(s for s in self.ex['sources'] if s['source_id']==r['source_id'])
     self.assertEqual(source['source_id'],'oracle-fy2026-release');self.assertTrue(source['document_title'])
 def test_30_source_capture_transparency(self):
  for s in self.ex['sources']:self.assertIsNone(s['raw_capture']);self.assertIsNone(s['raw_sha256'])
 def test_31_content_hashes(self):
  for n,h in load('content-identity.json')['files'].items():self.assertEqual(build.sha((R/n).read_bytes()),h)
 def test_32_fresh_process_determinism(self):
  names=list(load('content-identity.json')['files'])+['content-identity.json'];before={n:(R/n).read_bytes() for n in names}
  subprocess.run([sys.executable,str(R/'build.py')],check=True,capture_output=True)
  for n,b in before.items():self.assertEqual((R/n).read_bytes(),b,n)
 def test_33_input_hashes(self):
  for n,h in load('phase-a-input-lock.json')['files'].items():self.assertEqual(build.sha((build.A/n).read_bytes()),h)
 def test_34_production_and_phase_a_untouched(self):
  result=subprocess.run(['git','diff',build.BASE,'--exit-code','--','.',':(exclude)research/ai-infrastructure-paper-validation/phase-b1'],cwd=P,capture_output=True,text=True)
  self.assertEqual(result.returncode,0,result.stdout+result.stderr)
 def test_35_no_return_score_or_aggregate(self):
  data=load('indicators.json')
  forbidden=['ai_roi','roi','irr','npv','payback','hidden_leverage','risk_score','total_ai_investment','composite_score']
  for b in data:
   for k in forbidden:self.assertNotIn(k,b)
 def test_36_measurement_family(self):
  self.assertEqual(build.measurement_kind('finance_lease_noncash_additions',True),'NONCASH_ADDITION')
  self.assertEqual(build.measurement_kind('deferred_revenue_cf_adjustment',True),'INDIRECT_CASH_FLOW_ADJUSTMENT_NOT_CASH_RECEIPTS')
  self.assertEqual(build.measurement_kind('debt_next_12m_principal',False),'FUTURE_COMMITMENT')
 def test_37_no_wrong_provenance(self):
  d=copy.deepcopy(self.ex);d['observations'][0]['publication_date']='2000-01-01'
  with self.assertRaisesRegex(ValueError,'Provenance'):build.validate_extracts(d)
 def test_38_invalid_period(self):
  d=copy.deepcopy(self.ex);d['observations'][0]['start']='2099-01-01'
  with self.assertRaisesRegex(ValueError,'period'):build.validate_extracts(d)
 def test_39_no_first_vintage_overwrite_by_earlier_release(self):
  for b in self.bs:
   if b['company']=='oracle' and b['label']=='FY2026':self.assertNotIn('customer_financing_prepayments',b['reported_values_usd'])
 def test_40_oracle_q1_accounting_identity(self):
  b=self.b('oracle','FY2027Q1');self.assertEqual(b['borrowings_excluding_leases_usd'],125337000000)
  self.assertEqual(b['reported_values_usd']['common_equity_proceeds'],19909000000)
 def test_41_report_fresh_process_determinism(self):
  p=R/'PHASE_B1_FINANCING_REPORT.md';before=p.read_bytes()
  subprocess.run([sys.executable,str(R/'write_report.py')],check=True)
  self.assertEqual(p.read_bytes(),before)
 def test_42_report_conclusion_boundary(self):
  text=(R/'PHASE_B1_FINANCING_REPORT.md').read_text()
  self.assertIn('PARTIAL — SOURCE GAPS',text);self.assertIn('December–November proxy',text)
  self.assertIn('not a distress classification',text);self.assertIn('not an AI-specific allocation',text)
 def test_43_earlier_fcf_crosscheck_without_substitution(self):
  r=next(x for x in self.ex['observations'] if x['company']=='oracle' and x['metric']=='reported_company_fcf' and x['end']=='2026-05-31')
  self.assertEqual(r['vintage_policy'],'EARLIER_OFFICIAL_RELEASE_SEPARATE')
  self.assertEqual(r['value_million']*1000000,self.b('oracle','FY2026')['company_convention_fcf_usd'])
if __name__=='__main__':unittest.main(verbosity=2)
