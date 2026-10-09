"""Offline source, measurement and fail-closed readiness tests; no network/models."""
import copy,gzip,hashlib,json,subprocess,sys,tempfile,unittest
from pathlib import Path
import build as b,extract,reproduce,fetch_sources
class C1A(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.ex=b.load('data-center-exposure-register.json')['projects'];cls.maps=b.load('geographic-mapping-register.json')['mappings'];cls.rows=b.load('inputs/state-monthly.json');cls.inds=b.load('electricity-source-register.json')['indicators']
 def mutate(self,kind,func,pattern):
  data=copy.deepcopy(getattr(self,kind));func(data)
  kwargs={'ex':'projects','maps':'mappings','rows':'rows','inds':'indicators'}
  with self.assertRaisesRegex(ValueError,pattern):b.validate(**{kwargs[kind]:data})
 def test_01_required_artifacts(self):
  for n in ['PHASE_C1A_FEASIBILITY_REPORT.md','data-center-exposure-register.json','electricity-source-register.json','geographic-mapping-register.json','candidate-region-comparison.json','measurement-and-confounder-register.json','source-and-methodology-gaps.json','PHASE_C1B_READINESS_ASSESSMENT.md']:self.assertTrue((b.R/n).is_file())
 def test_02_valid_artifacts(self):b.validate()
 def test_03_all_json_parse(self):
  for p in b.R.rglob('*.json'):json.loads(p.read_text())
 def test_04_duplicate_project(self):self.mutate('ex',lambda d:d.append(copy.deepcopy(d[0])),'Duplicate')
 def test_05_duplicate_mapping(self):self.mutate('maps',lambda d:d.append(copy.deepcopy(d[0])),'Duplicate')
 def test_06_duplicate_indicator(self):self.mutate('inds',lambda d:d.append(copy.deepcopy(d[0])),'Duplicate')
 def test_07_duplicate_month(self):self.mutate('rows',lambda d:d.append(copy.deepcopy(d[0])),'Duplicate')
 def test_08_unknown_project(self):self.mutate('maps',lambda d:d[0].update(projectId='bad'),'Unknown project')
 def test_09_invalid_state_fips(self):self.mutate('maps',lambda d:d[0].update(stateFips='99'),'FIPS')
 def test_10_invalid_county(self):self.mutate('maps',lambda d:d[0].update(countyFips='99999'),'FIPS')
 def test_11_wrong_utility(self):self.mutate('maps',lambda d:d[0].update(utilityId='0'),'territory mismatch')
 def test_12_unknown_claim_source(self):self.mutate('ex',lambda d:d[0].update(locationSourceRefs=['bad']),'Unresolved')
 def test_13_unknown_indicator_source(self):self.mutate('inds',lambda d:d[0].update(sourceRefs=['bad']),'Unresolved')
 def test_14_invalid_source_status(self):self.mutate('inds',lambda d:d[0].update(verificationStatus='VERIFIED'),'status')
 def test_15_manual_not_direct_payload(self):self.mutate('inds',lambda d:d[0].update(verificationStatus='VERIFIED — MANUAL ACCESS'),'Direct history')
 def test_16_no_fixed_lag_guess(self):self.mutate('inds',lambda d:d[0].update(publicationLag=30),'publication lag')
 def test_17_opening_not_first_energization(self):self.mutate('ex',lambda d:d[0].update(energizationDate='2019-06-18'),'energization')
 def test_18_permit_not_energization(self):self.mutate('ex',lambda d:d[0]['milestones'][0].update(isFirstEnergization=True,milestoneType='PERMIT'),'Opening/permit')
 def test_19_planned_not_operational(self):self.mutate('ex',lambda d:d[0].update(operationalCapacityMW=160),'Invented')
 def test_20_no_actual_load_from_procurement(self):self.mutate('ex',lambda d:d[0].update(actualConnectedLoadMW=160),'Invented')
 def test_21_no_ai_share_guess(self):self.mutate('ex',lambda d:d[0].update(aiShare=1),'Invented')
 def test_22_no_ai_kwh(self):self.mutate('ex',lambda d:d[0].update(aiSpecificConsumptionMWh=0),'Invented')
 def test_23_no_evidence_upgrade(self):self.mutate('ex',lambda d:d[0].update(evidenceGrade='E3'),'grade')
 def test_24_no_future_date(self):self.mutate('ex',lambda d:d[0]['milestones'][0].update(date='2099-01-01'),'Future')
 def test_25_invalid_date(self):self.mutate('ex',lambda d:d[0]['milestones'][0].update(date='2019-19-39'),'Invalid milestone')
 def test_26_no_current_county_backdating(self):self.mutate('maps',lambda d:d[0].update(qualifiesForEventDesign=True),'geography promotion')
 def test_27_procurement_definition(self):self.mutate('ex',lambda d:d[0]['capacityHistory'][0].update(definition='SITE_ACTUAL_LOAD'),'capacity mislabeled')
 def test_28_missing_reason(self):self.mutate('ex',lambda d:d[0].update(aiShareMissingReason=''),'Missingness')
 def test_29_outcome_unit_arithmetic(self):self.mutate('rows',lambda d:d[0].update(revenueThousandUSD=d[0]['revenueThousandUSD']*1000),'unit/arithmetic')
 def test_30_no_silent_missing_fill(self):self.mutate('rows',lambda d:d[0].update(salesMWh=None),'Missing/non-native')
 def test_31_period_limit(self):self.mutate('rows',lambda d:d[0].update(period='2026-01'),'Invalid outcome period')
 def test_32_unknown_sector(self):self.mutate('rows',lambda d:d[0].update(sector='AI'),'sector')
 def test_33_source_hash(self):self.mutate('rows',lambda d:d[0].update(sourceHash='0'*64),'provenance')
 def test_34_no_hidden_row_deletion(self):self.mutate('rows',lambda d:d.pop(),'incomplete')
 def test_35_native_rounding(self):
  for x in self.rows:self.assertLessEqual(abs(x['priceCentsPerKWh']-100*x['revenueThousandUSD']/x['salesMWh']),.0051)
 def test_36_announcement_bounds_only(self):
  c=b.comparison();windows={x['projectId']:x['operationalAnnouncementWindow'] for x in c['exposedCandidates']};self.assertEqual((windows['META-SARPY']['preMonths'],windows['META-SARPY']['postMonths']),(53,78))
  self.assertTrue(all(x['verifiedEventWindow']['preMonths'] is None and not x['exposureEligible'] for x in c['exposedCandidates']))
 def test_37_missing_event_is_not_zero(self):self.assertIsNone(b.event_window(self.rows,'NE',None)['preMonths'])
 def test_38_no_fake_comparators(self):
  c=b.comparison();self.assertEqual(len(c['comparisonCandidates']),6);self.assertEqual(c['qualifiedComparisonRegions'],0);self.assertEqual(c['qualifiedExposedRegions'],0)
 def test_39_c0_floors_preserved(self):
  c=b.comparison()['inheritedCriteria'];self.assertEqual([c[k] for k in ['minimumPreMonths','minimumPostMonths','minimumExposedRegions','minimumCandidateComparisonRegions']],[24,12,3,6])
 def test_40_offline_raw_controls(self):self.assertEqual(len(reproduce.controls()),3)
 def test_41_full_weather_calendar(self):
  d=b.load('inputs/weather-monthly.json');self.assertEqual(len(d),3432);self.assertTrue(all(x['missingDays']==0 for x in d));self.assertEqual(next(x['dayCount'] for x in d if x['period']=='2020-02'),29)
 def test_42_gas_not_local_cost(self):self.assertTrue(all(x['geography']=='HENRY_HUB_BENCHMARK_NOT_LOCAL_DELIVERED_FUEL' for x in b.load('inputs/henryhub-monthly.json')))
 def test_43_utility_one_year_insufficient(self):
  d=b.load('inputs/utility-monthly-2024.json');self.assertEqual(len(d),144);self.assertEqual({x['period'][:4] for x in d},{'2024'});self.assertTrue(all(x['utilityId']!='0' for x in d))
 def test_44_2025_preliminary_not_final(self):self.assertEqual(sum(x['dataStatus']=='Preliminary' for x in self.rows),312)
 def test_45_unchanged_inherited_tree(self):b.check_inherited()
 def test_46_external_cache_required(self):
  with self.assertRaisesRegex(ValueError,'outside repository'):fetch_sources.external(b.P/'src/data')
 def test_47_compare_fresh_processes(self):
  cmd=[sys.executable,str(b.R/'reproduce.py')];a=subprocess.check_output(cmd);c=subprocess.check_output(cmd);self.assertEqual(a,c);self.assertEqual(a,(b.R/'candidate-region-comparison.json').read_bytes())
 def test_48_fresh_control_reparse(self):
  cmd=[sys.executable,str(b.R/'reproduce.py'),'--controls'];self.assertEqual(subprocess.check_output(cmd),subprocess.check_output(cmd))
 def test_49_no_c1b_models_or_forecasts(self):
  c=b.comparison();self.assertFalse(c['empiricalEffectsEstimated']);self.assertFalse(c['causalEvidenceUpgrade']);self.assertEqual(c['classification'],'PARTIAL — DATA GAPS')
  docs=(b.R/'PHASE_C1B_READINESS_ASSESSMENT.md').read_text();self.assertIn('C1B is not started',docs);self.assertIn('No national inflation forecast',docs)
 def test_50_identity_matches(self):self.assertEqual(b.identity(),b.load('content-identity.json'))
 def test_51_other_git_checkout_cache_rejected(self):
  with tempfile.TemporaryDirectory() as tmp:
   p=Path(tmp);(p/'.git').write_text('gitdir: elsewhere')
   with self.assertRaisesRegex(ValueError,'outside repository'):fetch_sources.external(p/'src/data')
 def test_52_unsafe_redirect_rejected(self):
  import urllib.request
  req=urllib.request.Request('https://www.eia.gov/test')
  for url in ['http://www.eia.gov/test','https://example.com/test','https://token@www.eia.gov/test']:
   with self.assertRaisesRegex(ValueError,'REDIRECT_REJECTED'):fetch_sources.Redirect({'www.eia.gov'}).redirect_request(req,None,302,'',{},url)
 def test_53_redirect_limit(self):
  import urllib.request
  r=fetch_sources.Redirect({'www.eia.gov'});r.count=3
  with self.assertRaisesRegex(ValueError,'REDIRECT_REJECTED'):r.redirect_request(urllib.request.Request('https://www.eia.gov/test'),None,302,'',{},'https://www.eia.gov/new')
 def test_54_independent_event_schema_positive_control(self):
  p=copy.deepcopy(self.ex[0]);m=copy.deepcopy(self.maps[0]);p.update(energizationStatus='VERIFIED_FIRST_ELECTRICAL_SERVICE',energizationDate='2019-06-01');p['milestones']=[dict(milestoneType='FIRST_ELECTRICAL_SERVICE',date='2019-06-01',isFirstEnergization=True)];m.update(qualifiesForEventDesign=True,historicalBoundaryMatch='QUALIFIED',meterServicePolygonMatch='VERIFIED')
  self.assertTrue(b.exposure_eligible(p,m));m['historicalBoundaryMatch']='UNQUALIFIED';self.assertFalse(b.exposure_eligible(p,m))
 def test_55_retained_source_failure_not_no_data(self):
  s=next(x for x in b.load('source-manifest.json')['sources'] if x['sourceId']=='dominion2024');self.assertEqual(s['httpStatus'],404);self.assertIsNone(s['sha256']);self.assertEqual(s['status'],'HTTP_ERROR')
if __name__=='__main__':unittest.main(verbosity=2)
