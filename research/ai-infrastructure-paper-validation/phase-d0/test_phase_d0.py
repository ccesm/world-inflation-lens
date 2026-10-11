"""Offline architecture checks and adversarial contract mutations, not UI implementation."""
import copy
import importlib.util
import json
import os
import subprocess
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import validate as v


class ArchitectureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.mapping = v.load(v.ROOT / 'c2-data-contract-mapping.json')
        cls.model = v.load(v.C2 / 'outputs/analysis.json')
        cls.matrix = v.load(v.ROOT / 'production-compatibility-matrix.json')

    def reject(self, mutate):
        changed = copy.deepcopy(self.mapping)
        mutate(changed)
        with self.assertRaises(ValueError):
            v.validate_mapping(changed, self.model)

    def test_complete_artifact_audit(self):
        self.assertEqual(v.audit()['lockedFiles'], 571)

    def test_extra_indicator_rejected(self):
        self.reject(lambda m: m['indicators'].append(dict(m['indicators'][0], indicatorId='GDPC1')))

    def test_omitted_indicator_rejected(self):
        self.reject(lambda m: m['indicators'].pop())

    def test_duplicate_section_member_rejected(self):
        self.reject(lambda m: m['sections'][0]['indicatorIds'].append('SPF10'))

    def test_frequency_resampling_rejected(self):
        self.reject(lambda m: m['indicators'][5].update(frequency='MONTHLY'))

    def test_unit_change_rejected(self):
        self.reject(lambda m: m['indicators'][5].update(calculationUnit='PERCENT_CHANGE'))

    def test_nsa_cpi_substitution_rejected(self):
        self.reject(lambda m: m['indicators'][9].update(seasonalAdjustment='NOT_SEASONALLY_ADJUSTED'))

    def test_source_hash_change_rejected(self):
        self.reject(lambda m: m['indicators'][0].update(sourceHash='0'*64))

    def test_scope_nationalization_rejected(self):
        self.reject(lambda m: m['indicators'][0].update(geographies=['US']))

    def test_wrong_snapshot_rejected(self):
        self.reject(lambda m: m.update(sourceAsOf='2026-10-10'))

    def test_missing_zero_rejected(self):
        self.reject(lambda m: m['publicContract'].update(missingValue=0))

    def test_missing_history_locator_rejected(self):
        self.reject(lambda m: m['publicContract']['historyFields'].remove('locator'))

    def test_release_clock_omission_rejected(self):
        self.reject(lambda m: m['publicContract']['seriesFields'].remove('clocks'))

    def test_last_record_masking_rejected(self):
        self.reject(lambda m: m['publicContract']['seriesFields'].remove('lastRecord'))

    def test_research_internal_path_exposure_rejected(self):
        self.reject(lambda m: m['publicContract']['excludedRootFields'].remove('inheritedGapRegister'))

    def test_causal_or_new_calculation_rejected(self):
        for flag in self.mapping['boundaries']:
            with self.subTest(flag=flag):
                self.reject(lambda m: m['boundaries'].update({flag:True}))

    def test_unsupported_license_assumption_rejected(self):
        self.reject(lambda m: m['indicators'][0].update(rightsStatus='UNRESTRICTED'))

    def test_native_yield_change_and_survey(self):
        ids={e['indicatorId']:e for e in self.mapping['indicators']}
        self.assertEqual(ids['DFII10']['calculationUnit'],'PERCENTAGE_POINTS')
        self.assertEqual(ids['DFII10']['yearChangePolicy'],'UNAVAILABLE_NOT_DEFINED_FOR_DAILY_YIELD')
        self.assertEqual(ids['SPF10']['frequency'],'QUARTERLY_SURVEY')
        self.assertEqual(ids['NCBDBIQ027S']['frequency'],'QUARTERLY_END_OF_PERIOD')

    def test_actual_code_reference_dispositions(self):
        rows={r['id']:r for r in self.matrix['rows']}
        self.assertEqual(rows['productivity-panel']['disposition'],'UNSUITABLE_DIRECTLY')
        self.assertEqual(rows['c2-cli']['disposition'],'UNSUITABLE_PRODUCTION_CLI')
        self.assertEqual(rows['svg-path']['disposition'],'MINIMAL_ADAPTATION')

    def test_clocks_and_missing_values_preserved(self):
        self.assertTrue(all(s['clocks']['firstPublicationDates'] is None for s in self.model['series']))
        cpi=next(s for s in self.model['series'] if s['indicatorId']=='CPIAUCSL')
        self.assertIsNone(next(r['value'] for r in cpi['observations'] if r['period']=='2025-10-01'))
        energy=[s for s in self.model['series'] if s['indicatorId'] in ('EIA_COMM_SALES','EIA_COMM_PRICE','HENRY_HUB')]
        self.assertTrue(all(s['lastRecord']['period']=='2025-12-01' for s in energy))

    def test_documentation_and_semantic_contract(self):
        text=(v.ROOT/'AI_MACRO_MONITOR_PAGE_SPEC.md').read_text()
        for phrase in ('390px','1280px','Official release date not recorded','未记录官方发布日期',
                       'Within-series descriptive change','单一序列的描述性变化', 'INSUFFICIENT DATA',
                       'semantic table','No thirteen-state total','correlations'):
            self.assertIn(phrase,text)
        strategy=(v.ROOT/'integration-strategy.md').read_text()
        for phrase in ('BASE_URL','lastRecord','lastNonmissing','WebCrypto','No infinite retry','manual'):
            self.assertIn(phrase,strategy)
        plan=(v.ROOT/'PHASE_D1_IMPLEMENTATION_PLAN.md').read_text()
        self.assertIn('No need to edit SectionLanding',plan)
        self.assertIn('Never force-push main',plan)
        self.assertIn('no dependency/version changes',plan)

    def test_fresh_process_d0_audit_determinism(self):
        outputs=[]
        for zone,cwd in [('UTC',v.REPO),('Pacific/Honolulu',Path('/private/tmp'))]:
            env=dict(os.environ,TZ=zone,PYTHONDONTWRITEBYTECODE='1')
            outputs.append(subprocess.check_output([sys.executable,str(v.ROOT/'validate.py')],cwd=cwd,env=env))
        self.assertEqual(outputs[0],outputs[1])

    def test_c2_fresh_process_output_reproduction(self):
        # Library build preserves arithmetic; don't bypass the CLI's scope to write anything.
        code="""import importlib.util,hashlib,json,sys
spec=importlib.util.spec_from_file_location('c2_engine',sys.argv[1]);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
model=m.build('2026-10-09');outputs=m.products(model)
print(json.dumps({k:hashlib.sha256(v).hexdigest() for k,v in outputs.items()},sort_keys=True))"""
        results=[]
        for zone,cwd in [('UTC',v.REPO),('Pacific/Honolulu',Path('/private/tmp'))]:
            results.append(subprocess.check_output([sys.executable,'-c',code,str(v.C2/'engine.py')],cwd=cwd,
                          env=dict(os.environ,TZ=zone,PYTHONDONTWRITEBYTECODE='1')))
        self.assertEqual(results[0],results[1])
        self.assertEqual(json.loads(results[0]),{k:d['sha256'] for k,d in self.mapping['identity']['files'].items()})


if __name__=='__main__':
    unittest.main(verbosity=2)
