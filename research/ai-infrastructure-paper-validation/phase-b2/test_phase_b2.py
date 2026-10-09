"""Offline accounting gates and immutable-evidence regression; explicit 2026-10-08 clock."""
import ast,copy,gzip,hashlib,json,subprocess,sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import build
R=build.R
class B2(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.d=build.load(R/'reviewed-evidence.json');cls.o=build.load(R/'observations.json');cls.ix={o['observation_id']:o for o in cls.o}
  cls.ss=sum([build.load(R/(c+'-debt-lease-schedules.json'))['schedules'] for c in ['oracle','amazon']],[])
  cls.rec=build.load(R/'reconciliation.json');cls.c=build.load(R/'customer-financing.json')
 def sc(self,c,l,f):return next(s for s in self.ss if (s['company'],s['label'],s['family'])==(c,l,f))
 def mutation(self,f,pattern):
  d=copy.deepcopy(self.d);f(d)
  with self.assertRaisesRegex(ValueError,pattern):build.validate_reviewed(d)
 def test_01_source_valid(self):build.validate_reviewed(self.d)
 def test_02_wrong_host(self):self.mutation(lambda d:d['sources'][0].update(official_url='https://example.com/test'),'Unofficial')
 def test_03_credentials(self):self.mutation(lambda d:d['observations'][0].update(source_url='https://token@www.sec.gov/test'),'Unsafe')
 def test_04_wrong_issuer(self):self.mutation(lambda d:d['observations'][0].update(company='oracle'),'identity')
 def test_05_wrong_accession(self):self.mutation(lambda d:d['observations'][0].update(accession='wrong'),'identity')
 def test_06_wrong_scale(self):self.mutation(lambda d:d['observations'][0].update(value_usd=1),'Scale')
 def test_07_wrong_currency(self):self.mutation(lambda d:d['observations'][0].update(currency='EUR'),'Unit')
 def test_08_missing_locator(self):self.mutation(lambda d:d['observations'][0].update(source_locator=''),'locator')
 def test_09_duplicate_observation(self):self.mutation(lambda d:d['observations'].append(copy.deepcopy(d['observations'][0])),'Duplicate')
 def test_10_future_source(self):self.mutation(lambda d:d['sources'][0].update(filed='2099-01-01'),'Future')
 def test_11_explicit_clock(self):self.mutation(lambda d:d.update(as_of='2099-01-01'),'as-of')
 def test_12_wrong_period(self):self.mutation(lambda d:d['observations'][0].update(period_end='2000-01-01'),'Period')
 def test_13_unknown_bucket(self):self.mutation(lambda d:d['schedules'][0]['buckets'][0].update(observation_id='bad'),'reference')
 def test_14_unknown_total(self):self.mutation(lambda d:d['schedules'][0].update(reported_total_ref='bad'),'total')
 def test_15_statement_provenance(self):self.mutation(lambda d:d['statements'][0].update(source_url='https://finance.example/test'),'provenance')
 def test_16_exact_context_conflict(self):
  u={'t':{'units':{'USD':[{'accn':'a','end':'2026-05-31','filed':'2026-07-01','val':1},{'accn':'a','end':'2026-05-31','filed':'2026-07-01','val':2}]}}}
  self.assertEqual(build.exact(u,'t','a','2026-05-31')[:2],(None,'CONFLICT_REQUIRES_REVIEW'))
 def test_17_exact_context_vintage(self):
  u={'t':{'units':{'USD':[{'accn':'later','end':'2026-05-31','filed':'2026-07-01','val':99}]}}}
  self.assertEqual(build.exact(u,'t','first','2026-05-31')[:2],(None,'UNAVAILABLE'))
 def test_18_missing_not_zero(self):self.assertIsNone(build.total([1,None]));self.assertIsNone(build.ratio(5,0))
 def test_19_schedule_conflict(self):self.assertEqual(build.reconcile([{'value_usd':2}],3)['status'],'CONFLICT_REQUIRES_REVIEW')
 def test_20_annual_month_bands(self):
  s=self.sc('oracle','FY2026','debt_principal');self.assertEqual(s['coarse_month_bands']['36_60_MONTHS'],17000000000)
  self.assertEqual(s['reconciliation']['reported_total_usd'],130105000000)
 def test_21_old_debt_controls_unavailable(self):
  for l in ['FY2023','FY2024']:self.assertEqual(self.sc('oracle',l,'debt_principal')['reconciliation']['status'],'UNAVAILABLE_CONTROL')
 def test_22_hedged_principal_not_carrying(self):
  self.assertEqual(self.sc('oracle','FY2025','debt_principal')['reconciliation']['reported_total_usd'],92947000000)
  self.assertNotEqual(92947000000,build.load(build.B/'funding-bridges.json')[2]['borrowings_excluding_leases_usd'])
 def test_23_oracle_quarter_native_buckets(self):
  s=self.sc('oracle','FY2027Q1','operating_lease');self.assertIsNone(s['coarse_month_bands'])
  self.assertEqual(s['native_buckets'][0]['value_usd'],3219000000);self.assertEqual(s['native_buckets'][1]['native_bucket'],'FY2028')
  self.assertEqual(s['native_buckets'][1]['value_usd'],4135000000)
 def test_24_amazon_quarter_native_buckets(self):
  s=self.sc('amazon','2026H1','debt_principal_interest');self.assertIsNone(s['coarse_month_bands'])
  self.assertEqual(s['native_buckets'][0]['native_bucket'],'Remainder of 2026');self.assertEqual(s['native_buckets'][0]['value_usd'],2361000000)
 def test_25_no_quarter_rolling_liquidity(self):
  for a in build.load(R/'liquidity-refinancing.json')['period_assessments']:
   if a['label'] in ['FY2027Q1','2026H1']:self.assertIsNone(a['liquidity_to_debt_next12m_principal_only'])
 def test_26_lease_pv(self):
  checks=[x for x in self.rec['checks'] if 'lease' in x['check'] and x['difference_usd'] is not None]
  self.assertEqual(len(checks),16);self.assertTrue(all(x['difference_usd']==0 for x in checks))
 def test_27_no_principal_inference(self):
  for l in ['FY2026','FY2027Q1']:self.assertIsNone(self.ix[f'oracle:{l}:finance_lease_principal:xbrl']['value_usd'])
  self.assertEqual(self.ix['oracle:FY2027Q1:finance_lease_cash_paid_total:reviewed']['value_usd'],186000000)
  self.assertIn('REVIEW_REQUIRED_NATIVE_TABLE_LABEL',self.ix['oracle:FY2025:finance_lease_principal:xbrl']['semantic_review'])
 def test_28_missing_finance_not_fabricated(self):
  for l in ['FY2023','FY2024']:self.assertTrue(all(b['value_usd'] is None for b in self.sc('oracle',l,'finance_lease')['native_buckets']))
  self.assertTrue(any(s['field']=='no_finance_leases_fy2024' and s['label']=='FY2025' for s in self.d['statements']))
 def test_29_financing_subtotals(self):
  checks=[x for x in self.rec['checks'] if x['check']=='financing_subcomponents'];self.assertEqual(len(checks),3)
  self.assertTrue(all(x['difference_usd']==0 for x in checks))
 def test_30_financing_obligation_not_lease(self):
  self.assertEqual(self.ix['amazon:2026H1:financing_obligation_principal_paid:reviewed']['value_usd'],174000000)
  self.assertEqual(self.ix['amazon:2026H1:finance_lease_principal:xbrl']['value_usd'],863000000)
 def test_31_derived_interest_same_vintage(self):
  a=build.load(R/'amazon-debt-lease-schedules.json')['contractual_interest'];self.assertEqual(len(a),3)
  self.assertEqual(a[-1]['value_usd'][0],2449000000);self.assertTrue(all(not x['forecast'] for x in a))
 def test_32_uncommenced_outside_recognized(self):
  self.assertEqual(self.ix['oracle:FY2027Q1:uncommenced_leases_total:reviewed']['value_usd'],288000000000)
  self.assertEqual(self.sc('oracle','FY2027Q1','operating_lease')['reconciliation']['reported_total_usd'],48050000000)
 def test_33_original_prepaid_crosscheck(self):
  self.assertEqual(self.ix['oracle:FY2026:customer_financing_prepaid_cf:reviewed']['value_usd'],4592000000)
  self.assertTrue(any(x['label']=='FY2026' and x['metric']=='customer_financing_prepayments' and x['status']=='B1_UNAVAILABLE_NEW_EVIDENCE' for x in self.rec['b1_comparisons']))
 def test_34_prepaid_already_in_ocf(self):
  self.assertEqual(self.ix['oracle:FY2027Q1:customer_financing_prepaid_cf:reviewed']['kind'],'INDIRECT_CF_ADJUSTMENT_ALREADY_IN_OCF')
  self.assertTrue(any(x['left']=='customer_prepayments' and x['right']=='ocf' for x in build.load(R/'capital-commitments.json')['overlap_rules']))
 def test_35_customer_no_plug(self):
  x=self.c['oracle_incomplete_reconciliation'];self.assertEqual(x['unexplained_difference_usd'],34000000);self.assertIsNone(x['full_rollforward'])
 def test_36_amazon_mixed_precision(self):
  x=next(b for b in self.c['balances'] if b['company']=='amazon' and b['label']=='2026H1')
  self.assertEqual(x['component_sum_usd'],24928000000);self.assertIsNone(x['reported_total_usd']);self.assertTrue(x['total_not_cash_receipts'])
 def test_37_no_cash_from_revenue(self):
  self.assertEqual(self.ix['amazon:2026H1:revenue_from_opening_deferred:xbrl']['kind'],'RECOGNIZED_REVENUE_NOT_CASH_RECEIPTS')
  self.assertIsNone(self.c['unearned_cash_received_total'])
 def test_38_customer_refund_unavailable(self):self.assertTrue(all(x['refund_rights']=='UNAVAILABLE' and x['full_customer_cash_rollforward'] is None for x in self.c['balances']))
 def test_39_no_credit_added_to_cash(self):
  l=build.load(R/'liquidity-refinancing.json');self.assertFalse(l['credit_capacity_added_to_cash']);self.assertFalse(l['automatic_refinancing_assumed'])
  s=next(s for s in l['credit_and_covenant_evidence'] if s['field']=='delayed_draw_term_loan');self.assertEqual(s['value']['available_at_as_of'],'NOT_ASSUMED_AFTER_DEADLINE')
 def test_40_covenant_not_proxy(self):
  s=next(s for s in self.d['statements'] if s['field']=='covenant');self.assertFalse(s['value']['independently_tested']);self.assertEqual(s['value']['minimum'],3)
  self.assertIn('Agreement-defined',s['value']['formula'])
 def test_41_no_guarantee_loss_conversion(self):
  o=self.ix['oracle:FY2026:lessor_borrowing_guarantee_maximum:reviewed'];self.assertEqual(o['kind'],'CONTINGENT_SUPPORT');self.assertIn('not debt or expected loss',o['note'])
 def test_42_no_hidden_aggregation(self):
  self.assertIsNone(build.load(R/'capital-commitments.json')['aggregate_infrastructure_investment'])
  self.assertIsNone(build.load(R/'financial-pressure.json')['composite_score'])
  self.assertIsNone(build.load(R/'liquidity-refinancing.json')['distress_score'])
 def test_43_pressure_framework_separate(self):
  pp=build.load(R/'financial-pressure.json')['assessments'];self.assertEqual(len(pp),9)
  for x in pp:self.assertEqual(len(x['dimensions']),6);self.assertEqual(x['dimensions']['refinancing']['distress_conclusion'],'NOT_ESTABLISHED')
 def test_44_source_identity(self):
  for n,h in build.load(R/'input-lock.json')['files'].items():self.assertEqual(hashlib.sha256((R.parent/n).read_bytes()).hexdigest(),h)
 def test_45_output_identity(self):
  for n,h in build.load(R/'content-identity.json')['files'].items():self.assertEqual(hashlib.sha256((R/n).read_bytes()).hexdigest(),h)
 def test_46_fresh_process_determinism(self):
  before={n:(R/n).read_bytes() for n in build.load(R/'content-identity.json')['files']}
  before['content-identity.json']=(R/'content-identity.json').read_bytes();before['obligations.csv']=(R/'obligations.csv').read_bytes()
  subprocess.run([sys.executable,str(R/'build.py')],check=True,capture_output=True)
  for n,b in before.items():self.assertEqual((R/n).read_bytes(),b,n)
 def test_47_research_scope(self):
  p=R.parents[2];out=subprocess.check_output(['git','diff',build.BASE,'--name-only'],cwd=p,text=True)
  self.assertTrue(all(n.startswith('research/ai-infrastructure-paper-validation/phase-b2/') for n in out.splitlines()),out)
 def test_48_no_online_parser(self):
  text=(R/'build.py').read_text();self.assertNotIn('urlopen',text);self.assertNotIn('datetime.now',text);self.assertNotIn('date.today',text)
 def test_49_report_determinism(self):
  names=['PHASE_B2_OBLIGATIONS_REPORT.md','qualification-report.json','gap-register.json'];old={n:(R/n).read_bytes() for n in names}
  subprocess.run([sys.executable,str(R/'write_report.py')],check=True)
  for n,b in old.items():self.assertEqual((R/n).read_bytes(),b,n)
 def test_50_report_boundaries(self):
  text=(R/'PHASE_B2_OBLIGATIONS_REPORT.md').read_text()
  for phrase in ['PARTIAL — SOURCE GAPS','no rolling-12-month','Phase C is not started','not separately identified principal','not a complete cash roll-forward']:
   self.assertIn(phrase,text)
 def test_51_chart_bucket_order(self):
  s=self.sc('oracle','FY2026','debt_principal');keys=['WITHIN_12_MONTHS','12_24_MONTHS','24_36_MONTHS','36_60_MONTHS','BEYOND_60_MONTHS']
  self.assertEqual([s['coarse_month_bands'][k] for k in keys],[7210000000,10145000000,5500000000,17000000000,90250000000])
  tree=ast.parse((R/'charts.py').read_text())
  expression=next(n.value for n in ast.walk(tree) if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='values' for t in n.targets))
  rendered=eval(compile(ast.Expression(expression),'<chart bucket expression>','eval'),{'s':s})
  self.assertEqual(rendered,[7.21,10.145,5.5,17,90.25])

if __name__=='__main__':unittest.main(verbosity=2)
