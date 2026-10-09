"""Offline fail-closed research contracts. No economic relationship estimated."""
import copy,gzip,hashlib,json,subprocess,sys,unittest
import artifacts as a
class C1M(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.inds=a.load('macro-indicator-register.json')['indicators'];cls.sources=a.load('official-source-qualification.json')['sources'];cls.ev=a.load('macro-transmission-evidence.json')['evidence'];cls.cover=a.load('historical-coverage-and-gaps.json')
 def reject(self,key,fn,pattern):
  d=copy.deepcopy(getattr(self,key));fn(d)
  with self.assertRaisesRegex(ValueError,pattern):a.validate(**{{'inds':'inds','sources':'sources','ev':'evidence'}[key]:d})
 def item(self,id):return next(x for x in self.inds if x['indicatorId']==id)
 def test_01_required_deliverables(self):
  for f in ['PHASE_C1M_MACRO_RESEARCH_REPORT.md','macro-indicator-register.json','macro-transmission-evidence.json','official-source-qualification.json','historical-coverage-and-gaps.json','macro-monitoring-architecture.md','PHASE_C2_RECOMMENDATION.md']:self.assertTrue((a.R/f).is_file())
 def test_02_valid_artifacts(self):self.assertTrue(a.validate())
 def test_03_all_json(self):
  for p in a.R.rglob('*.json'):json.loads(p.read_text())
 def test_04_duplicate_indicator(self):self.reject('inds',lambda d:d.append(d[0]),'Duplicate')
 def test_05_duplicate_source(self):self.reject('sources',lambda d:d.append(d[0]),'Duplicate')
 def test_06_duplicate_evidence(self):self.reject('ev',lambda d:d.append(d[0]),'Duplicate')
 def test_07_unresolved_source(self):self.reject('inds',lambda d:d[0].update(sourceId='BAD'),'Unknown source')
 def test_08_unresolved_indicator(self):self.reject('ev',lambda d:d[0].update(indicatorRefs=['BAD']),'Unknown indicator')
 def test_09_unresolved_hypothesis(self):self.reject('inds',lambda d:d[0].update(hypothesisRefs=['BAD']),'Unknown hypothesis')
 def test_10_official_not_automatically_causal(self):self.reject('ev',lambda d:d[0].update(evidenceGrade='E4'),'grade upgrade')
 def test_11_no_e3_correlation_upgrade(self):self.reject('ev',lambda d:d[0].update(evidenceGrade='E3'),'grade upgrade')
 def test_12_grade_invalid(self):self.reject('ev',lambda d:d[0].update(evidenceGrade='E7'),'Invalid')
 def test_13_no_causal_claim(self):self.reject('ev',lambda d:d[0].update(causalIdentification='AI_EFFECT'),'causality')
 def test_14_evidence_dimensions(self):self.reject('ev',lambda d:d[0].update(externalValidity=''),'Missing evidence')
 def test_15_status_validity(self):self.reject('inds',lambda d:d[0].update(status='COMPLETE_CAUSAL'),'status')
 def test_16_fixed_lag_not_guessed(self):self.reject('inds',lambda d:d[0].update(publicationLagDays=30),'numeric lag')
 def test_17_no_ai_electricity_proxy(self):self.reject('inds',lambda d:d[0].update(attribution='AI_ELECTRICITY'),'attribution')
 def test_18_missing_ai_is_null(self):self.reject('inds',lambda d:d[0].update(aiSpecificValue=0),'Invented')
 def test_19_no_future_source_date(self):self.reject('inds',lambda d:d[0].update(latestAvailableObservationDate='2099-01-01'),'Future')
 def test_20_provider_not_distributor(self):self.reject('sources',lambda d:d[0].update(originalProvider='FRED'),'origin')
 def test_21_unofficial_host_rejected(self):self.reject('sources',lambda d:d[0].update(officialURL='https://example.org/estimate'),'host')
 def test_22_bad_raw_hash(self):self.reject('sources',lambda d:d[0].update(sha256='0'*64),'hash')
 def test_23_btos_splice_rejected(self):self.reject('inds',lambda d:next(x for x in d if x['indicatorId']=='BTOS_AI').update(splicePreviousRegime=True),'BTOS')
 def test_24_btos_not_fully_verified(self):self.reject('inds',lambda d:next(x for x in d if x['indicatorId']=='BTOS_AI').update(status='VERIFIED'),'payload')
 def test_25_compensation_not_expectation(self):self.reject('inds',lambda d:next(x for x in d if x['indicatorId']=='T10YIE').update(measureType='EXPECTED_INFLATION'),'Breakeven')
 def test_26_debt_stock_not_issuance(self):self.reject('inds',lambda d:next(x for x in d if x['indicatorId']=='NCBDBIQ027S').update(measureType='GROSS_ISSUANCE'),'Debt stock')
 def test_27_construction_not_all_ai_capex(self):self.reject('inds',lambda d:next(x for x in d if x['indicatorId']=='CENSUS_DC').update(measureType='AI_TOTAL_CAPEX'),'Construction')
 def test_28_latest_not_handtyped(self):self.reject('inds',lambda d:d[0].update(latestVerifiedObservationDate='2026-07-01'),'Latest payload')
 def test_29_required_metadata(self):self.reject('inds',lambda d:d[0].update(unit=None),'Missing metadata')
 def test_30_four_channels_and_compact_core(self):
  self.assertEqual(len(self.inds),17);self.assertEqual(sum(x['c2Core'] for x in self.inds),12);self.assertEqual({x['channel'] for x in self.inds},{'ENERGY','FINANCING','PRODUCTIVITY','INFLATION'})
 def test_31_no_new_relationship_evidence(self):self.assertEqual([sum(x['evidenceGrade']==g for x in self.ev) for g in ['E0','E1','E2','E3','E4']],[4,17,0,0,0])
 def test_32_history_reproduction(self):self.assertEqual(a.encoded(a.coverage()),(a.R/'historical-coverage-and-gaps.json').read_bytes())
 def test_33_cpi_missing_month_preserved(self):
  for sid in ['CPIAUCSL','CPILFESL']:
   s=next(s for s in self.sources if s['sourceId']==sid);row=next(x for x in a.records(s) if x['period']=='2025-10-01');self.assertIsNone(row['value'])
 def test_34_daily_missing_not_zero(self):
  for sid in ['DFII10','T10YIE']:
   s=next(s for s in self.sources if s['sourceId']==sid);self.assertEqual(sum(x['value'] is None for x in a.records(s)),254)
 def test_35_construction_native_unit_flags(self):
  x=next(x for x in self.cover['indicators'] if x['indicatorId']=='CENSUS_DC')['history'];self.assertEqual(x['rows'],152);self.assertEqual(x['latestCaptured'][0]['nativeFlag'],'p');self.assertEqual(x['latestCaptured'][0]['value'],84950);self.assertEqual(self.item('CENSUS_DC')['unit'],'MILLION_USD_SAAR')
 def test_36_survey_not_observed_inflation(self):
  x=next(x for x in self.cover['indicators'] if x['indicatorId']=='SPF10')['history'];self.assertEqual(x['start'],'1991-10-01');self.assertEqual(x['missing'],87);self.assertEqual(self.item('SPF10')['nominalOrReal'],'SURVEY_EXPECTATION')
 def test_37_state_sample_not_national(self):
  for sid in ['EIA_COMM_SALES','EIA_COMM_PRICE']:self.assertIn('not US total',self.item(sid)['geography'])
 def test_38_capture_not_latest_available(self):
  self.assertEqual(self.item('EIA_COMM_SALES')['latestAvailableObservationDate'],'2026-07-01');self.assertEqual(self.item('EIA_COMM_SALES')['latestVerifiedObservationDate'],'2025-12-01')
 def test_39_inherited_gap_bytes_and_meaning(self):
  for g in a.load('gap-preservation.json'):
   p,key=g['sourceRef'].split('#');d=json.loads((a.R/p).read_text());orig=next(x for x in d['gaps'] if x['gapId']==key);self.assertEqual(g['originalRecordSHA256'],hashlib.sha256(a.encoded(orig)).hexdigest());self.assertFalse(g['macroFrameworkBlocking']);self.assertEqual(g['description'],orig['description'])
 def test_40_all_inherited_files_and_scope(self):self.assertEqual(a.scope()['lockedInheritedFiles'],530)
 def test_41_hash_and_fresh_process(self):
  self.assertEqual(a.identity(),a.load('content-identity.json'));cmd=[sys.executable,str(a.R/'artifacts.py'),'--identity'];env=dict(__import__('os').environ,PYTHONDONTWRITEBYTECODE='1');x=subprocess.check_output(cmd,env=env);y=subprocess.check_output(cmd,env=env);self.assertEqual(x,y);self.assertEqual(json.loads(x),a.identity())
 def test_42_frozen_c0_hypotheses(self):
  d=json.loads((a.R.parent/'phase-c0/hypothesis-matrix.json').read_text());self.assertEqual(len(d['hypotheses']),17);self.assertTrue(all(x['evidenceGrade']=='E0' for x in d['hypotheses']))
 def test_43_architecture_preserves_boundaries(self):
  text=(a.R/'macro-monitoring-architecture.md').read_text();self.assertIn('No network/production writes',text)
  self.assertIn('No API secret',text);self.assertIn('No averages of CPI/PCE',text);self.assertIn('no summed energy/capital/productivity',text)
 def test_44_recommendation_not_execution(self):
  text=(a.R/'PHASE_C2_RECOMMENDATION.md').read_text();self.assertIn('C2 has not begun',text);self.assertIn('Stop an individual adapter',text);self.assertIn('No causal macro identification',text)
 def test_45_invalid_calendar_date(self):self.reject('inds',lambda d:d[0].update(latestAvailableObservationDate='2026-09-39'),'Invalid observation date')
 def test_46_source_credentials_rejected(self):self.reject('sources',lambda d:d[0].update(officialURL='https://secret@fred.stlouisfed.org/series/PNFIC1'),'credentials')
 def test_47_external_fixture_path_rejected(self):self.reject('sources',lambda d:d[0].update(fixture='../../secret'),'Fixture path')
 def test_48_evidence_source_resolves(self):self.reject('ev',lambda d:d[0].update(sourceRefs=['BAD']),'Unknown evidence source')
 def test_49_evidence_hypothesis_resolves(self):self.reject('ev',lambda d:d[-1].update(inheritedHypothesisRefs=['BAD']),'Unknown evidence hypothesis')
 def test_50_latest_chronology(self):self.reject('inds',lambda d:d[0].update(latestAvailableObservationDate='2020-01-01'),'Latest chronology')
 def test_51_inherited_source_identity(self):self.reject('sources',lambda d:next(x for x in d if x['sourceId']=='EIA_STATE').update(sha256='0'*64),'Inherited source identity')
if __name__=='__main__':unittest.main()
