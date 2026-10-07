"""Phase 3.5 adversarial fixtures; no expected favorable outcome assertions."""
import copy
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
import analysis
import expanded_coverage as e
import intake
from outcome_common import ROOT, SourceError, canonical, read, sha256, spec

S = spec()


def taxonomy():
    return [{'socCode': code, 'parentCode': parent, 'hierarchyLevel': level, 'socVersion': '2018'}
            for code, parent, level in [('11-0000', None, 'major'), ('11-1000', '11-0000', 'minor'),
                                       ('11-1010', '11-1000', 'broad'), ('11-1011', '11-1010', 'detailed'),
                                       ('11-1012', '11-1010', 'detailed')]]


def concordance(pairs, expressions=None, bridge=None):
    expressions = expressions or {new: '11-1011' for _, new in pairs}
    return {'currentCodes': {c: {'socExpression': x, 'targets': [x] if x in ['11-1011', '11-1012'] else []} for c, x in expressions.items()},
            'temporalEdges': [{'sourceCode': a, 'targetCode': b, 'sourceVersion': 'Census 2010',
                               'targetVersion': 'Census 2018', 'mappingType': 'fixture'} for a, b in pairs],
            'stableBridge': bridge or {}}


def assignment(q=1, status='EXACT_SCALAR_ASSIGNMENT'):
    return {'status': status, 'quintile': q, 'evidence': [], 'value': None}


def statistic(weight=10000, hours=40, wage=100000):
    cell = intake.blank_cell()
    intake.add_person(cell, {'PWCMPWGT': weight, 'PRTAGE': 23, 'PEEDUCA': 43, 'PEIO1ICD': 6870,
                            'PEHRUSL1': hours, 'HRMIS': 4, 'PEIO1COW': 4, 'PRERELG': 1,
                            'earnings': wage, 'PWORWGT': weight})
    return cell


def months(year=2024, codes=None, count=12):
    codes = codes or {'0010': analysis.combine([statistic()] * 12)}
    return [{'period': f'{year}-{m:02d}', 'taxonomy': 'Census 2010' if year < 2020 else 'Census 2018',
             'occupations': copy.deepcopy(codes), 'totalEmployed': analysis.combine(codes.values())} for m in range(1, count + 1)]


def source_inputs(quintiles=(1, 1), missing=False):
    small = copy.deepcopy(S)
    small['exposureInputs']['academic']['nativeQuantiles']['ranks'] = {f'n{i}': {'quintile': q, 'percentile': .1} for i, q in enumerate(quintiles)}
    small['exposureInputs']['microsoft']['nativeQuantiles']['ranks'] = {'11-1011': {'quintile': 1, 'percentile': .1}}
    key = small['exposureInputs']['academic']['measure']
    records = [{'O*NET-SOC Code': f'n{i}', key: .1 + i * .01} for i in range(len(quintiles))]
    if missing:
        records.pop()
    crosswalk = {'direct': [{'sourceCode': f'n{i}', 'targetCode': '11-1011', 'sourceVersion': 'O*NET-SOC 2019', 'targetVersion': 'SOC 2018'} for i in range(len(quintiles))]}
    return {'academic': {'records': records}, 'microsoft': {'records': []}}, crosswalk, small


class Components(unittest.TestCase):
    def cells(self, cw):
        return e.harmonized_cells(cw, taxonomy())

    def test_exact_1_to_1(self):
        cw = concordance([('0010', '0010')], bridge={'0010': {'census2018': '0010', 'socCode': '11-1011'}})
        c = self.cells(cw)[0]
        self.assertEqual((c['cellId'], c['status']), ('11-1011', 'EXACT_MATCH'))

    def test_many_to_one_whole_set(self):
        c = self.cells(concordance([('0010', '0020'), ('0011', '0020')]))[0]
        self.assertEqual(c['mappingType'], 'many-to-1')
        self.assertEqual(c['census2010'], ['0010', '0011'])
        self.assertEqual(c['status'], 'HARMONIZED_CELL')

    def test_one_to_many_aggregate_back(self):
        c = self.cells(concordance([('0010', '0011'), ('0010', '0012')], {'0011': '11-1011', '0012': '11-1012'}))[0]
        self.assertEqual((c['mappingType'], c['status']), ('1-to-many', 'HARMONIZED_CELL'))
        self.assertEqual(len(c['soc2018']), 2)

    def test_many_to_many_default_exclusion(self):
        c = self.cells(concordance([('0010', '0011'), ('0010', '0012'), ('0020', '0012')], {'0011': '11-1011', '0012': '11-1012'}))[0]
        self.assertTrue(c['closed'])
        self.assertEqual(c['status'], 'TEMPORAL_MAPPING_AMBIGUOUS')

    def test_incomplete_current_component(self):
        c = self.cells(concordance([('0010', '0011'), ('0010', '0012')], {'0011': '11-1011'}))[0]
        self.assertFalse(c['closed'])
        self.assertEqual(c['status'], 'TEMPORAL_MAPPING_AMBIGUOUS')

    def test_missing_old_side(self):
        c = self.cells(concordance([], {'0010': '11-1011'}))[0]
        self.assertFalse(c['closed'])

    def test_wildcards_not_prefix_inference(self):
        self.assertEqual(e.resolve_soc('11-10XX', taxonomy()), [])

    def test_unknown_soc_fails_closed(self):
        self.assertEqual(self.cells(concordance([('0010', '0011')], {'0011': '99-9999'}))[0]['status'], 'TEMPORAL_MAPPING_AMBIGUOUS')

    def test_official_broad_remains_aggregate(self):
        c = self.cells(concordance([('0010', '0011')], {'0011': '11-1010'}))[0]
        self.assertEqual(c['soc2018'], ['11-1011', '11-1012'])
        self.assertTrue(c['cellId'].startswith('HC-'))

    def test_shared_soc_closes_codes_without_cloning(self):
        c = self.cells(concordance([('0010', '0011'), ('0020', '0012')]))[0]
        self.assertEqual(c['mappingType'], 'many-to-many')
        self.assertEqual(c['soc2018'], ['11-1011'])

    def test_duplicate_edges_rejected(self):
        with self.assertRaises(SourceError):
            self.cells(concordance([('0010', '0011')] * 2))

    def test_taxonomy_mismatch(self):
        cw = concordance([('0010', '0011')]); cw['temporalEdges'][0]['targetVersion'] = 'Census 2020'
        with self.assertRaises(SourceError): self.cells(cw)

    def test_component_order_deterministic(self):
        cw = concordance([('0010', '0011'), ('0010', '0012')], {'0011': '11-1011', '0012': '11-1012'})
        reversed_cw = copy.deepcopy(cw); reversed_cw['temporalEdges'].reverse()
        self.assertEqual(canonical(self.cells(cw)), canonical(self.cells(reversed_cw)))

    def test_no_duplicate_soc_workers(self):
        cw = concordance([('0010', '0011'), ('0020', '0021')], {'0011': '11-1010', '0021': '11-1011'})
        cells = self.cells(cw)
        self.assertEqual(len(cells), 1)
        self.assertEqual(len(e.native_maps(cells)['Census 2018']), 2)


class Exposures(unittest.TestCase):
    def assigned(self, q=(1, 1), missing=False, consensus=True):
        ex, cw, s = source_inputs(q, missing)
        return e.source_assignments(ex, cw, {'11-1011'}, s, consensus)['academic']['11-1011']

    def test_child_consensus_category_not_scalar(self):
        a = self.assigned()
        self.assertEqual(a['status'], 'CONSENSUS_CHILD_ASSIGNMENT')
        self.assertEqual(a['quintile'], 1)
        self.assertIsNone(a['value'])
        self.assertEqual(len(a['evidence']), 2)

    def test_child_disagreement(self):
        self.assertEqual(self.assigned((1, 5))['status'], 'EXPOSURE_AMBIGUOUS')

    def test_missing_child_cannot_be_ignored(self):
        a = self.assigned(missing=True)
        self.assertIsNone(a['quintile'])
        self.assertEqual(a['missingNativeChildren'], ['n1'])

    def test_sensitivity_B_disallows_consensus(self):
        self.assertIsNone(self.assigned(consensus=False)['quintile'])

    def test_exact_native_one_child(self):
        self.assertEqual(self.assigned((2,))['status'], 'EXACT_SCALAR_ASSIGNMENT')

    def test_same_quintile_cell(self):
        c = {'soc2018': ['a', 'b'], 'status': 'HARMONIZED_CELL'}
        a = e.cell_assignment(c, {'a': assignment(3), 'b': assignment(3)})
        self.assertEqual(a['quintile'], 3)
        self.assertIsNone(a['continuousScore'])

    def test_mixed_quintile_cell(self):
        a = e.cell_assignment({'soc2018': ['a', 'b'], 'status': 'HARMONIZED_CELL'}, {'a': assignment(1), 'b': assignment(5)})
        self.assertEqual(a['status'], 'EXPOSURE_AMBIGUOUS')
        self.assertEqual(a['quintileRange'], [1, 5])

    def test_missing_soc_exposure(self):
        self.assertIsNone(e.cell_assignment({'soc2018': ['a', 'b'], 'status': 'HARMONIZED_CELL'}, {'a': assignment(1)})['quintile'])

    def test_empty_members_never_zero(self):
        a = e.cell_assignment({'soc2018': [], 'status': 'HARMONIZED_CELL'}, {})
        self.assertEqual(a['status'], 'UNAVAILABLE'); self.assertIsNone(a['quintile'])

    def test_source_failure_isolation(self):
        ex, cw, s = source_inputs((1,))
        del ex['microsoft']
        a = e.source_assignments(ex, cw, {'11-1011'}, s)
        self.assertIsNotNone(a['academic']['11-1011']['quintile'])
        self.assertEqual(a['microsoft']['11-1011']['status'], 'UNAVAILABLE')

    def test_duplicate_exposure_rejected(self):
        ex, cw, s = source_inputs((1,)); ex['academic']['records'] *= 2
        with self.assertRaises(SourceError): e.source_assignments(ex, cw, {'11-1011'}, s)

    def test_unknown_mapping_target_rejected(self):
        ex, cw, s = source_inputs((1,)); cw['direct'][0]['targetCode'] = '99-9999'
        with self.assertRaises(SourceError): e.source_assignments(ex, cw, {'11-1011'}, s)

    def test_broad_microsoft_not_cloned(self):
        ex, cw, s = source_inputs((1,)); s['exposureInputs']['microsoft']['nativeQuantiles']['ranks']['11-1010'] = {'quintile': 5, 'percentile': .9}
        ex['microsoft']['records'] = [{'SOC Code': '11-1010', s['exposureInputs']['microsoft']['measure']: .9}]
        self.assertIsNone(e.source_assignments(ex, cw, {'11-1011'}, s)['microsoft']['11-1011']['quintile'])


class Pooling(unittest.TestCase):
    def setUp(self):
        self.cells = e.harmonized_cells(concordance([('0010', '0011'), ('0010', '0012')], {'0011': '11-1011', '0012': '11-1012'}), taxonomy())
        self.cid = self.cells[0]['cellId']

    def test_integer_pooling_no_outcome_average(self):
        c = analysis.combine([statistic(30000, 20, 100000), statistic(10000, 40, 200000)])
        self.assertEqual(c['hoursWeightedInt'] / c['hoursWeightInt'], 25)
        self.assertEqual(analysis.median(c['earningsHistogram']), 1000)

    def test_national_denominator_not_mapped_only(self):
        native = {'0011': analysis.combine([statistic()] * 12), '9999': analysis.combine([statistic(30000)] * 12)}
        ms = months(codes=native); stats, available, den = e.annual_statistics(ms, self.cells, S)
        p = e.panel(ms, self.cells, [self.cid], {self.cid: {'quintile': 1}}, stats, available, den, S)
        self.assertAlmostEqual(p['coverage'][0]['employmentWeightedCoverage'], .25)
        self.assertEqual(p['coverage'][0]['mappedDetailedSocCount'], 2)
        self.assertEqual(p['coverage'][0]['analyticalCellCount'], 1)

    def test_major_denominator_discloses_unallocated_weights(self):
        native = {'0011': analysis.combine([statistic()] * 12), '9999': analysis.combine([statistic(30000)] * 12)}
        ms = months(codes=native); stats, _, den = e.annual_statistics(ms, self.cells, S)
        d = e.major_coverage(self.cells, [self.cid], stats[2024], ms, {'11-1011', '11-1012'}, den[2024])
        self.assertEqual(d['groups']['11-0000']['mappedDetailedSocCountCoverage'], 1)
        self.assertAlmostEqual(d['unallocatedMajorEmploymentShare'], .75)
        self.assertAlmostEqual(d['groups']['11-0000']['includedEmploymentShareOfAllEmployed'], .25)
        self.assertIsNone(d['groups']['11-0000']['employmentCoverageOfEntireMajor'])

    def test_missing_outcome_excluded_not_zero(self):
        stats, av, _ = e.annual_statistics(months(codes={'9999': statistic()}), self.cells, S)
        self.assertEqual(e.balanced_members(self.cells, {self.cid: {'quintile': 1}}, stats, av), [])

    def test_threshold_suppression(self):
        stats, av, _ = e.annual_statistics(months(codes={'0011': statistic()}, count=12), self.cells, S)
        self.assertEqual(e.balanced_members(self.cells, {self.cid: {'quintile': 1}}, stats, av), [])

    def test_missing_months_not_complete(self):
        _, av, _ = e.annual_statistics(months(count=11), self.cells, S)
        self.assertFalse(av[2024]['fullYear'])

    def test_duplicate_month_rejected(self):
        ms = months()
        with self.assertRaises(SourceError): e.annual_statistics(ms + [ms[0]], self.cells, S)

    def test_wrong_census_period_rejected(self):
        ms = months(); ms[0]['taxonomy'] = 'Census 2010'
        with self.assertRaises(SourceError): e.annual_statistics(ms, self.cells, S)

    def test_invalid_calendar_month_rejected(self):
        ms = months(); ms[-1]['period'] = '2024-13'
        with self.assertRaises(SourceError): e.annual_statistics(ms, self.cells, S)

    def test_aggregate_back_preserves_sufficient_stats(self):
        native = {'0011': analysis.combine([statistic()] * 12), '0012': analysis.combine([statistic(30000)] * 12)}
        stats, _, _ = e.annual_statistics(months(codes=native), self.cells, S)
        self.assertEqual(stats[2024][self.cid]['cell']['weightInt'], 5760000)

    def test_no_partial_year_index(self):
        ms = months(year=2022) + months(year=2026, count=8)
        stats, av, den = e.annual_statistics(ms, self.cells, S)
        p = e.panel(ms, self.cells, [self.cid], {self.cid: {'quintile': 1}}, stats, av, den, S)
        rows = [r for r in p['outcomes'] if r['year'] == 2026]
        self.assertTrue(all(r['employmentIndices']['2022'] is None for r in rows))
        self.assertEqual(p['matchedPartialYears'][0]['months'], list(range(1, 9)))
        self.assertEqual(p['matchedPartialYears'][0]['referenceType'], 'IDENTICAL_CALENDAR_MONTHS')

    def test_deterministic_statistics(self):
        ms = months()
        self.assertEqual(e.annual_statistics(ms, self.cells, S), e.annual_statistics(list(reversed(ms)), self.cells, S))


class Protection(unittest.TestCase):
    def test_frozen_spec_hash(self):
        self.assertEqual(sha256((ROOT / 'expanded-preanalysis-spec.json').read_bytes()), e.EXPANDED_SHA)
        self.assertEqual(e.frozen_spec()['strictSpecificationSha256'], e.SPEC_SHA)

    def test_coherently_changed_spec_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            p = Path(folder); raw = b'{}'
            (p / 'expanded-preanalysis-spec.json').write_bytes(raw)
            (p / 'expanded-preanalysis-spec.sha256').write_text(sha256(raw))
            with self.assertRaises(SourceError): e.frozen_spec(p)

    def test_original_spec_immutable(self):
        self.assertEqual(sha256((ROOT / 'preanalysis-spec.json').read_bytes()), e.SPEC_SHA)

    def test_strict_counts_and_pretrend_preserved(self):
        groups = read(ROOT / 'exposure-group-outcomes.json')['data']
        self.assertEqual([groups['sample'][k]['primarySize'] for k in ['academic', 'microsoft']], [167, 190])
        self.assertEqual(read(ROOT / 'cross-source-robustness.json')['data']['commonSampleSize'], 165)
        self.assertEqual(S['pretrend']['years'], [2015, 2016, 2017, 2018, 2019])

    def test_labels_frozen_thresholds(self):
        base = {'q5MinusQ1PretrendGapPpPerYear': .1, 'q5MinusQ1Post2022EmploymentChangeGapPp': 1}
        expanded = {'q5MinusQ1PretrendGapPpPerYear': 1, 'q5MinusQ1Post2022EmploymentChangeGapPp': 7}
        self.assertEqual(e.comparison_labels(base, expanded, .6, S), ['MAGNITUDE_SENSITIVE', 'PRETREND_SENSITIVE'])

    def test_consistency_does_not_remove_coverage_limitation(self):
        a = {'q5MinusQ1PretrendGapPpPerYear': .1, 'q5MinusQ1Post2022EmploymentChangeGapPp': 1}
        self.assertEqual(e.comparison_labels(a, a, .4, S), ['INSUFFICIENT_EXPANDED_COVERAGE', 'DIRECTIONALLY_CONSISTENT'])

    def test_sign_change_is_sample_sensitive(self):
        a = {'q5MinusQ1PretrendGapPpPerYear': .1, 'q5MinusQ1Post2022EmploymentChangeGapPp': 1}
        b = dict(a, q5MinusQ1Post2022EmploymentChangeGapPp=-1)
        self.assertIn('SAMPLE_SENSITIVE', e.comparison_labels(a, b, .6, S))

    def test_zero_is_not_negative_direction(self):
        a = {'q5MinusQ1PretrendGapPpPerYear': .1, 'q5MinusQ1Post2022EmploymentChangeGapPp': 0}
        b = dict(a, q5MinusQ1Post2022EmploymentChangeGapPp=-1)
        self.assertIn('SAMPLE_SENSITIVE', e.comparison_labels(a, b, .6, S))

    def test_manifest_deterministic_and_small(self):
        bodies = {'a.json': {'data': [1, 2], 'scope': 'RESEARCH_ONLY'}}
        self.assertEqual(e.output_manifest(bodies), e.output_manifest(copy.deepcopy(bodies)))
        self.assertNotIn('generatedAt', e.output_manifest(bodies))


class AcceptedIntegration(unittest.TestCase):
    """Independent reconstruction from accepted archive; no outcome-direction target."""
    @classmethod
    def setUpClass(cls):
        cls.before = {p.relative_to(ROOT): p.read_bytes() for p in ROOT.rglob('*')
                      if p.is_file() and p.suffix not in ['.pyc'] and
                      'expanded-generated' not in p.parts and '__pycache__' not in p.parts}
        cls.bodies = e.build()

    def test_original_files_byte_unchanged(self):
        self.assertTrue(all((ROOT / path).read_bytes() == raw for path, raw in self.before.items()))

    def test_exclusive_867_counts_and_weight_partitions(self):
        for data in self.bodies['coverage-waterfall.json']['data'].values():
            self.assertEqual(sum(data['exclusiveCounts'].values()), 867)
            self.assertEqual(len({r['socCode'] for r in data['records']}), 867)
            self.assertEqual(sum(v['weightInt'] for v in data['nativeCensusWeightPartition'].values()), data['denominatorWeightInt'])

    def test_gain_categories_reconcile_integer_weights(self):
        coverage = self.bodies['strict-vs-expanded-coverage.json']['data']
        gain = self.bodies['coverage-gain-attribution.json']['data']
        for source in ['academic', 'microsoft']:
            expected = sum(v['coverageGainPercentagePoints'] for v in gain[source].values())
            self.assertAlmostEqual(expected, 100 * (coverage[source]['C']['employmentWeightedCoverage'] - coverage[source]['A_strict']['employmentWeightedCoverage']), 10)

    def test_no_double_count_native_cells(self):
        cells = self.bodies['harmonized-occupation-cells.json']['data']['cells']
        for key in ['census2010', 'census2018', 'soc2018']:
            all_codes = [code for cell in cells for code in cell[key]]
            self.assertEqual(len(all_codes), len(set(all_codes)))

    def test_full_provenance_guardrails(self):
        for body in self.bodies.values():
            self.assertEqual(body['causalityStatus'], 'DESCRIPTIVE_ONLY')
            self.assertEqual(body['causality'], 'NOT_ESTABLISHED')
            self.assertEqual(body['binding']['expandedSpecificationSha256'], e.EXPANDED_SHA)
            self.assertEqual(body['binding']['strictSpecificationSha256'], e.SPEC_SHA)
            self.assertEqual(len(body['binding']['monthlySnapshotSha256']), 64)

    def test_consensus_values_not_averaged(self):
        sources = self.bodies['expanded-exposure-assignments.json']['data']['sourceSocAssignments']
        for assignment in sources['academic'].values():
            if assignment['status'] == 'CONSENSUS_CHILD_ASSIGNMENT':
                self.assertIsNone(assignment['value'])
                self.assertEqual(len({r['quintile'] for r in assignment['evidence']}), 1)
                self.assertFalse(assignment['missingNativeChildren'])

    def test_cell_failure_statuses_never_report_false_eligibility(self):
        health = self.bodies['expanded-sample-health.json']['data']['sourceCellEligibility']
        for source in health.values():
            for cell in source.values():
                if cell['status'] in ['INSUFFICIENT_SAMPLE', 'UNAVAILABLE', 'EXPOSURE_AMBIGUOUS', 'TEMPORAL_MAPPING_AMBIGUOUS']:
                    self.assertFalse(cell['eligible'])


if __name__ == '__main__':
    unittest.main()
