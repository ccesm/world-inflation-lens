"""Offline adversarial artifact tests; economic truth and causality remain separately reviewed."""
import copy, hashlib, json, subprocess, sys, unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent))
import validate as v
class C0(unittest.TestCase):
 def mutation(self,fn,msg):
  d=copy.deepcopy(v.bundle());fn(d)
  with self.assertRaisesRegex(ValueError,msg):v.validate_bundle(d)
 def test_01_files_and_complete_schema(self):v.main()
 def test_02_duplicate_hypothesis(self):self.mutation(lambda d:d['hypotheses'].append(d['hypotheses'][0]),'Duplicate')
 def test_03_duplicate_indicator(self):self.mutation(lambda d:d['indicators'].append(d['indicators'][0]),'Duplicate')
 def test_04_duplicate_evidence(self):self.mutation(lambda d:d['evidence'].append(d['evidence'][0]),'Duplicate')
 def test_05_missing_hypothesis(self):self.mutation(lambda d:d['hypotheses'].pop(),'coverage')
 def test_06_no_hypothesis_grade_promotion(self):self.mutation(lambda d:d['hypotheses'][0].update(evidenceGrade='E4'),'promotion')
 def test_07_unknown_indicator(self):self.mutation(lambda d:d['hypotheses'][0]['officialDataCandidates'].append('fake'),'indicator')
 def test_08_unknown_evidence(self):self.mutation(lambda d:d['hypotheses'][0]['supportingEvidence'].append('fake'),'evidence')
 def test_09_invalid_grade(self):self.mutation(lambda d:d['evidence'][0].update(evidenceGrade='A+'),'grade')
 def test_10_official_not_causal(self):self.mutation(lambda d:d['evidence'][0].update(evidenceGrade='E4'),'statistical grade')
 def test_11_missing_robustness(self):self.mutation(lambda d:d['evidence'][0].update(statisticalRobustness=''),'dimension')
 def test_12_untraceable_claim(self):self.mutation(lambda d:d['evidence'][0].update(indicatorRefs=[]),'Untraceable')
 def test_13_unverified_not_verified(self):self.mutation(lambda d:next(x for x in d['indicators'] if x['indicatorId']=='EN-WEATHER').update(verificationDate='2026-10-09'),'Unverified')
 def test_14_direct_needs_payload(self):self.mutation(lambda d:d['indicators'][0].update(sourceVerificationStatus='VERIFIED — DIRECT ACCESS'),'payload')
 def test_15_unsafe_url(self):self.mutation(lambda d:d['indicators'][0].update(officialSourceURL='https://token@www.eia.gov/'),'Unsafe')
 def test_16_private_fred_not_official(self):self.mutation(lambda d:next(x for x in d['indicators'] if x['indicatorId']=='FI-OAS').update(providerClass='OFFICIAL'),'Private')
 def test_17_future_clock(self):self.mutation(lambda d:d.update(asOf='2099-01-01'),'clock')
 def test_18_future_latest_observation(self):self.mutation(lambda d:next(x for x in d['indicators'] if x['indicatorId']=='IN-PCE')['latestVerifiedObservation'].update(publicationDate='2099-01-01'),'Future')
 def test_19_unit_mismatch(self):self.mutation(lambda d:next(x for x in d['indicators'] if x['indicatorId']=='IN-PCE')['latestVerifiedObservation'].update(unit='USD'),'unit')
 def test_20_missing_not_zero(self):
  d=v.bundle();self.assertTrue(any(x['latestVerifiedObservation'] is None for x in d['indicators']))
  self.assertTrue(all(x['latestObservationMissingReason'] for x in d['indicators'] if x['latestVerifiedObservation'] is None))
 def test_21_no_fake_history(self):self.mutation(lambda d:d['indicators'][0].update(publicationLag='guessed'),'fabricated')
 def test_22_inherited_gap_preserved(self):self.mutation(lambda d:d['gaps'][0].update(description='resolved'),'gap erased')
 def test_23_no_inflation_forecast(self):self.mutation(lambda d:d['numericalInflationForecasts'].append({'AI_inflation':1}),'scope violation')
 def test_24_no_C1_execution(self):self.mutation(lambda d:d['newEmpiricalEstimates'].append({'regression':1}),'scope violation')
 def test_25_actual_inherited_bytes(self):v.check_inherited()
 def test_26_cash_bridge_values_not_retyped(self):v.check_extracts()
 def test_27_countermechanism_not_observed(self):self.mutation(lambda d:d['hypotheses'][0]['contradictoryEvidence'][0].update(type='CAUSAL_PROOF'),'classification')
 def test_28_Btos_regimes(self):
  s={x['indicatorId']:x for x in v.bundle()['indicators']}
  self.assertEqual(s['PR-BTOS-NEW']['historicalCoverage']['firstRelease'],'2025-12-04')
  self.assertEqual(s['PR-BTOS-OLD']['historicalCoverage']['definitionBreakCollection'],'2025-11-17')
 def test_29_aggregate_boundary(self):
  d=v.bundle();self.assertTrue(all(x['evidenceGrade']=='E0' for x in d['hypotheses']))
  self.assertTrue(all(x['causalIdentification']=='NONE' for x in d['evidence']))
 def test_30_one_pilot(self):
  p=(v.R/'PHASE_C1_RESEARCH_PLAN.md').read_text();self.assertEqual(p.count('**Selected, gated**'),1)
  for text in ['24 pre-event months','12 post-event months','3 exposed regions','6 candidate comparison regions','Stop estimation','Stop causal interpretation','not started']:self.assertIn(text,p)
 def test_31_scientific_boundaries_visible(self):
  m=(v.R/'methodology.md').read_text()
  for text in ['not distress','not net new borrowing','not incremental OCF again','not additive','relative-price level','risk/liquidity','None']:
   if text!='None':self.assertIn(text,m)
 def test_32_fresh_process_determinism(self):
  cmd=[sys.executable,str(v.R/'validate.py')]
  a=subprocess.check_output(cmd,cwd=v.ROOT);b=subprocess.check_output(cmd,cwd=v.ROOT)
  self.assertEqual(a,b);self.assertEqual(json.loads(a),v.identity())
 def test_33_identity_file_matches(self):
  p=v.R/'content-identity.json'
  if p.exists():self.assertEqual(json.loads(p.read_text()),v.identity())
 def test_34_reproduction_not_truth(self):self.assertIn('not truth of economic hypotheses',(v.R/'methodology.md').read_text())
 def test_35_wrong_official_host(self):self.mutation(lambda d:d['indicators'][0].update(officialSourceURL='https://example.com/data'),'Unauthenticated')
 def test_36_missing_value_needs_reason(self):self.mutation(lambda d:d['indicators'][0].update(latestObservationMissingReason=None),'Unexplained')
 def test_37_rebuilt_evidence_bytes(self):
  a=subprocess.check_output([sys.executable,str(v.R/'reproduce.py'),'--evidence'],cwd=v.ROOT)
  self.assertEqual(a,(v.R/'evidence-register.json').read_bytes())
 def test_38_fresh_rebuild_identity(self):
  cmd=[sys.executable,str(v.R/'reproduce.py')];a=subprocess.check_output(cmd,cwd=v.ROOT);b=subprocess.check_output(cmd,cwd=v.ROOT)
  self.assertEqual(a,b);self.assertEqual(json.loads(a),v.identity())
if __name__=='__main__':unittest.main(verbosity=2)
