"""Offline research acceptance. Software checks do not establish AI causality."""
import copy
import csv
import io
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import engine as e
import control_audit


def row(period, value):
    return dict(period=period, value=value, geography='US', revisionFlag='TEST', locator='fixture')


class C2(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest = e.load(e.ROOT / 'input-manifest.json')
        cls.model = e.build()
        cls.outputs = e.products(cls.model)

    def series(self, sid, geography='US'):
        return next(s for s in self.model['series'] if s['seriesId'] == f'{sid}:{geography}')

    def calc(self, rows, sid='CPIAUCSL', frequency='MONTHLY'):
        return e.calculate(rows, dict(indicatorId=sid, frequency=frequency))

    def test_01_exact_twelve(self):
        self.assertEqual([i['indicatorId'] for i in self.manifest['indicators']], list(e.CORE))
        self.assertEqual(self.model['status'], 'COMPLETE')
        self.assertEqual(len(self.model['series']), 36)

    def test_02_source_identity(self):
        e.verify_inputs(self.manifest)
        self.assertEqual(len(self.manifest['sources']), 11)

    def test_03_scope_expansion_rejected(self):
        m = copy.deepcopy(self.manifest)
        m['indicators'].append(m['indicators'][0])
        with self.assertRaisesRegex(ValueError, 'scope'): e.verify_inputs(m)

    def test_04_unit_definition_change_rejected(self):
        for key in ('unit', 'frequency', 'definition', 'seasonalAdjustment', 'originalProvider'):
            with self.subTest(key=key):
                m = copy.deepcopy(self.manifest);m['indicators'][0][key] = 'CHANGED'
                with self.assertRaisesRegex(ValueError, 'metadata'): e.verify_inputs(m)

    def test_05_source_change_rejected(self):
        m = copy.deepcopy(self.manifest);m['sources'][0]['sha256'] = '0'*64
        with self.assertRaisesRegex(ValueError, 'Source metadata'): e.verify_inputs(m)

    def test_06_input_bytes_change_rejected(self):
        m = copy.deepcopy(self.manifest);m['files'][next(iter(m['files']))] = '0'*64
        with self.assertRaisesRegex(ValueError, 'Input version'): e.verify_inputs(m)

    def test_07_path_escape_rejected(self):
        m = copy.deepcopy(self.manifest);m['files']['../secret'] = '0'*64
        with self.assertRaisesRegex(ValueError, 'input path'): e.verify_inputs(m)

    def test_08_exact_month_yoy_hand_control(self):
        r = self.calc([row('2025-01-01', 100), row('2026-01-01', 112.5)])[-1]
        self.assertEqual(r['yearChange'], 12.5)
        self.assertIsNone(r['nativeChange'])
        self.assertEqual(r['yearBasePeriod'], '2025-01-01')

    def test_09_no_index_offset_across_gap(self):
        r = self.calc([row('2025-01-01', 100), row('2025-03-01', 110)])[-1]
        self.assertIsNone(r['nativeChange'])
        self.assertEqual(r['nativeChangeStatus'], 'COMPARISON_PERIOD_ABSENT')

    def test_10_null_endpoint(self):
        r = self.calc([row('2025-01-01', None), row('2026-01-01', 110)])[-1]
        self.assertIsNone(r['yearChange']);self.assertEqual(r['yearChangeStatus'], 'MISSING_ENDPOINT')

    def test_11_null_current(self):
        r = self.calc([row('2025-01-01', 100), row('2026-01-01', None)])[-1]
        self.assertIsNone(r['value']);self.assertIsNone(r['yearChange'])

    def test_12_zero_base_not_infinite(self):
        self.assertEqual(e.percent_change(100, 0), (None, 'NONPOSITIVE_BASE'))
        self.assertEqual(e.percent_change(100, -10), (None, 'NONPOSITIVE_BASE'))

    def test_13_negative_yield_uses_points(self):
        r = self.calc([row('2025-01-02', -.5), row('2025-01-03', -.25)], 'DFII10', 'DAILY')[-1]
        self.assertEqual(r['nativeChange'], .25)
        self.assertIsNone(r['yearChange'])

    def test_14_daily_holiday_gap_explicit(self):
        r = self.calc([row('2025-01-03', 1), row('2025-01-06', None), row('2025-01-07', 1.2)], 'DFII10', 'DAILY')
        self.assertIsNone(r[1]['value']);self.assertEqual(r[-1]['nativeChange'], .2)
        self.assertEqual(r[-1]['nativeIntervalDays'], 4)
        self.assertEqual(r[-1]['nativeBasePeriod'], '2025-01-03')

    def test_15_survey_points_not_realized_inflation(self):
        r = self.calc([row('2025-01-01', 2.4), row('2025-04-01', 2.5), row('2026-01-01', 2.3)], 'SPF10', 'QUARTERLY_SURVEY')[-1]
        self.assertEqual(r['yearChange'], -.1)
        self.assertEqual(self.series('SPF10')['measureType'], 'SURVEY_EXPECTATION')

    def test_16_exact_quarter_yoy(self):
        r = self.calc([row('2025-04-01', 200), row('2026-04-01', 220)], 'PNFIC1', 'QUARTERLY')[-1]
        self.assertEqual(r['yearChange'], 10)
        self.assertEqual(r['periodEnd'], '2026-06-30')

    def test_17_no_quarter_annualization(self):
        r = self.calc([row('2026-01-01', 100), row('2026-04-01', 102)], 'OPHNFB', 'QUARTERLY')[-1]
        self.assertEqual(r['nativeChange'], 2)

    def test_18_period_ends_and_native_labels(self):
        self.assertEqual(e.period_end('2024-02-01', 'MONTHLY'), '2024-02-29')
        self.assertEqual(e.period_end('2026-10-01', 'QUARTERLY'), '2026-12-31')
        with self.assertRaisesRegex(ValueError, 'quarter'): e.period_end('2026-02-01', 'QUARTERLY')

    def test_19_duplicate_period_rejected(self):
        with self.assertRaisesRegex(ValueError, 'Duplicate'): self.calc([row('2025-01-01', 1)]*2)

    def test_20_nonfinite_and_boolean_rejected(self):
        for value in (float('nan'), float('inf'), True, '2.0'):
            with self.subTest(value=value):
                with self.assertRaises(ValueError):e.number(value)

    def test_21_six_place_decimal_control(self):
        self.assertEqual(e.percent_change(4, 3)[0], 33.333333)
        self.assertEqual(e.point_change(2.87, 2.8)[0], .07)

    def test_22_cpi_missing_october_preserved(self):
        r = next(r for r in self.series('CPIAUCSL')['observations'] if r['period']=='2025-10-01')
        self.assertIsNone(r['value']);self.assertIsNone(r['nativeChange']);self.assertIsNone(r['yearChange'])
        november = next(r for r in self.series('CPIAUCSL')['observations'] if r['period']=='2025-11-01')
        self.assertIsNone(november['nativeChange'])

    def test_23_early_nulls_preserved(self):
        self.assertEqual(self.series('NCBDBIQ027S')['missingRowCount'], 18)
        self.assertEqual(self.series('SPF10')['missingRowCount'], 87)
        self.assertEqual(self.series('DFII10')['missingRowCount'], 254)

    def test_24_all_missing_cells_explicit(self):
        self.assertEqual(sum(s['missingRowCount'] for s in self.model['series']), 360)
        self.assertEqual(sum(s['rawRowCount'] for s in self.model['series']), 12949)

    def test_25_geography_no_national_pool(self):
        for sid in ('EIA_COMM_SALES', 'EIA_COMM_PRICE'):
            self.assertEqual({s['geography'] for s in self.model['series'] if s['indicatorId']==sid},set(e.STATES))
        self.assertNotIn('US_TOTAL',self.outputs['analysis.json'].decode())

    def test_26_final_preliminary_not_overwritten(self):
        for sid in ('EIA_COMM_SALES', 'EIA_COMM_PRICE'):
            s = self.series(sid,'VA');self.assertEqual(s['revisionFlags'],{'Final':120,'Preliminary':12})
            self.assertEqual(s['lastRecord']['revisionFlag'],'Preliminary')

    def test_27_construction_saar_scope(self):
        s = self.series('CENSUS_DC');self.assertEqual(s['unit'],'MILLION_USD_SAAR')
        self.assertEqual(s['lastRecord']['value'],84950)
        self.assertEqual(s['lastRecord']['revisionFlag'],'p')

    def test_28_stock_not_issuance(self):
        self.assertEqual(self.series('NCBDBIQ027S')['measureType'],'DEBT_SECURITIES_STOCK_NOT_ISSUANCE_OR_TOTAL_DEBT')
        self.assertFalse(self.model['inputIdentity']['rules']['stockChangeIsIssuance'])

    def test_29_baskets_not_averaged(self):
        self.assertEqual(self.series('CPIAUCSL')['unit'],'INDEX_1982_1984_100')
        self.assertEqual(self.series('PCEPILFE')['unit'],'INDEX_2017_100')
        self.assertFalse(self.model['inputIdentity']['rules']['crossSeriesAggregation'])

    def test_30_explicit_asof_rejects_backtest(self):
        for d in ('2020-01-01','2026-10-10'):
            with self.assertRaisesRegex(ValueError,'as-of'):e.build(d)

    def test_31_future_injected_source_fails_adapter(self):
        original=e.native_records
        def fake(i,s):
            records=original(i,s)
            if i['indicatorId']=='PNFIC1':records.append(row('2099-01-01',1))
            return records
        with patch.object(e,'native_records',side_effect=fake):m=e.build()
        self.assertEqual(m['status'],'PARTIAL');self.assertEqual(len(m['series']),35)
        self.assertEqual(m['adapterFailures'][0]['indicatorId'],'PNFIC1')

    def test_32_failure_isolation(self):
        original=e.native_records
        def fake(i,s):
            if i['indicatorId']=='SPF10':raise ValueError('ACCESS_BLOCKED historical control')
            return original(i,s)
        with patch.object(e,'native_records',side_effect=fake):m=e.build()
        self.assertEqual(len(m['series']),35)
        self.assertEqual({s['indicatorId'] for s in m['series']},set(e.CORE)-{'SPF10'})
        with self.assertRaisesRegex(ValueError,'Partial'):e.write_products(e.products(m),m,e.ROOT/'outputs')

    def test_33_latest_missing_not_silently_current(self):
        original=e.native_records
        def fake(i,s):
            records=original(i,s)
            if i['indicatorId']=='CPIAUCSL':records[-1]['value']=None
            return records
        with patch.object(e,'native_records',side_effect=fake):m=e.build()
        s=next(s for s in m['series'] if s['indicatorId']=='CPIAUCSL')
        self.assertIsNone(s['lastRecord']['value'])
        self.assertNotEqual(s['lastRecord']['period'],s['lastNonmissing']['period'])

    def test_34_unknown_publication_dates_null(self):
        for s in self.model['series']:
            self.assertIsNone(s['clocks']['firstPublicationDates'])
            self.assertFalse(s['clocks']['firstReleaseVintageAvailable'])
            self.assertTrue(s['clocks']['retrievedAt'])

    def test_35_stale_sample_flag(self):
        self.assertEqual(self.series('EIA_COMM_SALES','VA')['freshnessStatus'],'CAPTURE_BEHIND_KNOWN_AVAILABLE')
        self.assertEqual(self.series('HENRY_HUB','HENRY_HUB')['lastRecord']['period'],'2025-12-01')

    def test_36_common_window_context(self):
        for s in self.model['series']:
            w=s['commonWindow'];self.assertEqual(w['start'],'2015-01-01')
            self.assertGreaterEqual(w['end'],'2025-12-01')
            self.assertGreaterEqual(w['rows'],44 if 'QUARTERLY' in s['frequency'] else 132)

    def test_37_no_e3_e4_or_ai_estimation(self):
        for s in self.model['series']:
            self.assertEqual(s['evidence']['nativeObservations'],'E1')
            self.assertEqual(s['evidence']['descriptiveChanges'],'E2_ARITHMETIC_ONLY')
            self.assertIsNone(s['evidence']['aiSpecificValue'])
            self.assertEqual(s['evidence']['causalIdentification'],'NONE')
        self.assertEqual(self.model['statisticalCorrelations'],'NOT_ESTIMATED')

    def test_38_every_native_value_has_locator(self):
        for s in self.model['series']:
            self.assertEqual(len(s['sourceHash']),64)
            self.assertTrue(all(r['locator'] for r in s['observations']))

    def test_39_json_csv_consistency_every_row(self):
        js=json.loads(self.outputs['analysis.json']);cs=list(csv.DictReader(io.StringIO(self.outputs['observations.csv'].decode())))
        expected=[(s,r) for s in js['series'] for r in s['observations']]
        self.assertEqual(len(cs),len(expected))
        for csvrow,(s,r) in zip(cs,expected):
            self.assertEqual(csvrow['seriesId'],s['seriesId']);self.assertEqual(csvrow['locator'],r['locator'])
            for key in ('value','nativeChange','yearChange'):
                self.assertEqual(csvrow[key],'null' if r[key] is None else str(r[key]))

    def test_40_markdown_consistency(self):
        text=self.outputs['analysis.md'].decode()
        for s in self.model['series']:
            self.assertIn(f"| {s['seriesId']} | {s['lastRecord']['period']} | {e.fmt(s['lastRecord']['value'])} |",text)
        for header in ('Observed facts (E1)','Statistical correlations','Economic hypotheses (E0)'):
            self.assertIn(header,text)

    def test_41_product_hash_reproduction(self):
        for name, data in self.outputs.items():self.assertEqual(data,(e.ROOT/'outputs'/name).read_bytes())
        self.assertEqual(e.identity(self.outputs,self.model),e.load(e.ROOT/'outputs/identity.json'))

    def test_42_fresh_process_path_timezone_determinism(self):
        cmd=[sys.executable,str(e.ROOT/'engine.py'),'--as-of','2026-10-09','--identity']
        first=subprocess.check_output(cmd,cwd=e.REPO,env=dict(os.environ,PYTHONDONTWRITEBYTECODE='1',TZ='UTC'))
        with tempfile.TemporaryDirectory() as d:
            second=subprocess.check_output(cmd,cwd=d,env=dict(os.environ,PYTHONDONTWRITEBYTECODE='1',TZ='Pacific/Honolulu'))
        self.assertEqual(first,second)
        self.assertEqual(json.loads(first),e.identity(self.outputs,self.model))

    def test_43_research_only_write_guard(self):
        with self.assertRaisesRegex(ValueError,'Research-only'):
            e.write_products(self.outputs,self.model,e.REPO/'src/data')

    def test_44_inherited_and_production_scope(self):
        self.assertEqual(e.scope(),dict(lockedFiles=557,productionModified=False,inheritedModified=False))

    def test_45_independent_parser_controls(self):
        report=control_audit.audit()
        self.assertEqual(report['fixtureParserComparison'],'PASS_INDEPENDENT_C2_VS_INHERITED_C1M')
        self.assertEqual(report['comparedNumericCellsBySource']['EIA_GAS'],132)

    def test_46_raw_control_receipt(self):
        r=e.load(e.ROOT/'raw-control-validation.json')
        self.assertEqual(r['electricityControl']['cellsChecked'],3432)
        self.assertEqual(sum(r['comparedNumericCellsBySource'].values()),12949)
        self.assertTrue(r['noNetwork']);self.assertTrue(r['noNewSources'])

    def test_47_gap_register_untouched(self):
        self.assertEqual(len(e.load(e.RESEARCH/'phase-c1m/gap-preservation.json')),28)
        self.assertEqual(self.model['inheritedGapRegister'],'../phase-c1m/gap-preservation.json')

    def test_48_no_runtime_network_schedule_or_clock(self):
        text=(e.ROOT/'engine.py').read_text()
        for token in ('urlopen(', 'requests.', 'datetime.now(', 'date.today(', 'smtplib', 'openai', 'anthropic'):
            self.assertNotIn(token,text)
        for k in ('forecasts','aiAttribution','associationEstimation','annualization','interpolation'):
            self.assertFalse(self.model['inputIdentity']['rules'][k])

    def test_49_required_reports(self):
        for name in ('PHASE_C2_DESCRIPTIVE_REPORT.md','methodology.md','README.md','qualification-report.json'):
            self.assertTrue((e.ROOT/name).is_file())

    def test_50_all_real_comparisons_independent_fraction_control(self):
        from fractions import Fraction
        checked=0
        for s in self.model['series']:
            index={r['period']:r for r in s['observations']}
            for r in s['observations']:
                for value_key,base_key in (('nativeChange','nativeBasePeriod'),('yearChange','yearBasePeriod')):
                    if r[value_key] is None:continue
                    current=Fraction(str(r['value']));base=Fraction(str(index[r[base_key]]['value']))
                    expected=current-base if s['calculationUnit']=='PERCENTAGE_POINTS' else 100*(current/base-1)
                    self.assertLessEqual(abs(float(expected)-r[value_key]),.0000005001)
                    checked+=1
        self.assertGreater(checked,15000)

    def test_51_no_machine_path_in_products(self):
        for data in self.outputs.values():
            for private in (b'/private/tmp/',b'/Users/',b'objects/f5/',b'__pycache__'):
                self.assertNotIn(private,data)


if __name__=='__main__':unittest.main(verbosity=2)
