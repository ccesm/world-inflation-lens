"""Offline tests: independent literal operands, source anchors and adversarial mutations."""
import sys,unittest,tempfile,pathlib,json,gzip,zipfile,io,copy,math,shutil
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'scripts'))
from outcome_common import ROOT,spec,SPEC_SHA,canonical,sha256,SourceError,read,save,GUARDRAIL
import intake,analysis,pipeline
S=spec();FIX=pathlib.Path(__file__).parent/'fixtures'

def small_spec():
    s=copy.deepcopy(S);s['minimumSamples'].update(occupationEmploymentPersonMonths=2,occupationMonthsRepresented=1,occupationHoursPersonMonths=2,occupationEarningsPersonMonths=2,groupPersonMonths=2,groupHoursPersonMonths=2,groupEarningsPersonMonths=2,groupAgePersonMonths=1,minimumEligibleMonthsYTD=2);return s

def vals(**kw):
    d={'PWCMPWGT':10000,'PRTAGE':23,'PEEDUCA':43,'PEIO1ICD':6870,'PEHRUSL1':40,'HRMIS':4,'PEIO1COW':4,'PRERELG':1,'earnings':100000,'PWORWGT':10000};d.update(kw);return d

def cell(**kw):
    c=intake.blank_cell();intake.add_person(c,vals(**kw));return c

def record(**kw):
    # Handwritten offsets from official dictionary; separate from production encoder (none exists).
    parts={0:(15,1),15:(2,1),17:(4,2015),62:(2,4),70:(5,1),121:(2,23),136:(2,43),146:(2,1),160:(2,2),179:(2,1),217:(2,40),242:(2,38),431:(2,4),497:(2,1),526:(8,100000),602:(10,10000),845:(10,10000),855:(4,6870),859:(4,1007)}
    rename={'line':146,'month':15,'year':17,'age':121,'personType':160,'laborStatus':179,'weight':845,'orgWeight':602,'hours':217,'earnings':526,'occupation':859,'education':136,'mis':62,'cow':431}
    for k,v in kw.items():i=rename[k];parts[i]=(parts[i][0],v)
    b=bytearray(b' '*950)
    for start,(width,value) in parts.items():b[start:start+width]=str(value).rjust(width).encode()
    return bytes(b)+b'\n'

def archive(lines):
    f=io.BytesIO()
    with zipfile.ZipFile(f,'w') as z:z.writestr('jan15pub.dat',b''.join(lines))
    return f.getvalue()

def official_layout():
    m=read(ROOT/'sources/manifest.json');r=next(x for x in m['files'] if x['name']=='2015_January_2015_Record_Layout.txt');return intake.layout(gzip.decompress((ROOT/'sources/raw'/f'{r["sha256"]}.gz').read_bytes()))

def clone():
    t=tempfile.TemporaryDirectory();base=pathlib.Path(t.name);r=base/'outcomes';r.mkdir();(base/'normalized').symlink_to(ROOT.parent/'normalized',target_is_directory=True)
    for p in ROOT.iterdir():
        dest=r/p.name
        if p.name in ('scripts','tests','schemas'):dest.symlink_to(p,target_is_directory=p.is_dir())
        elif p.name=='accepted':
            dest.mkdir()
            for x in p.iterdir():
                if x.is_dir(): (dest/x.name).symlink_to(x,target_is_directory=True)
                else:shutil.copy2(x,dest/x.name)
        elif p.name=='sources':
            dest.mkdir()
            for x in p.iterdir():
                if x.is_dir():(dest/x.name).symlink_to(x,target_is_directory=True)
                else:shutil.copy2(x,dest/x.name)
        elif p.is_file():shutil.copy2(p,dest)
    return t,r

class CPS(unittest.TestCase):
    def test_official_layout_positions(self):self.assertEqual(official_layout()['fieldLocations']['PWCMPWGT'],[846,855])
    def test_real_dictionary_aliases(self):self.assertEqual(official_layout()['aliases'],{'occupation':'PEIO1OCD','earnings':'PRERNWA'})
    def test_integer_implied_weight(self):
        m=intake.parse_cps(archive([record(weight=25000)]),'2015-01',official_layout());self.assertEqual(m['totalEmployed']['weightInt']/10000,2.5)
    def test_raw_count_not_population(self):
        m=intake.parse_cps(archive([record(weight=25000),record(line=2,weight=10000)]),'2015-01',official_layout());self.assertEqual(m['employedPersonMonths'],2);self.assertEqual(m['totalEmployed']['weightInt'],35000)
    def test_duplicate_person_period_rejected(self):
        with self.assertRaises(SourceError):intake.parse_cps(archive([record(),record()]),'2015-01',official_layout())
    def test_wrong_month_rejected(self):
        with self.assertRaises(SourceError):intake.parse_cps(archive([record(month=2)]),'2015-01',official_layout())
    def test_wrong_year_rejected(self):
        with self.assertRaises(SourceError):intake.parse_cps(archive([record(year=2020)]),'2015-01',official_layout())
    def test_invalid_month_rejected(self):
        with self.assertRaises(SourceError):intake.parse_cps(archive([record()]),'2015-13',official_layout())
    def test_negative_weight_rejected(self):
        with self.assertRaises(SourceError):intake.parse_cps(archive([record(weight=-1)]),'2015-01',official_layout())
    def test_zero_weight_rejected(self):
        with self.assertRaises(SourceError):intake.parse_cps(archive([record(weight=0)]),'2015-01',official_layout())
    def test_weight_scale_mutation(self):
        d=official_layout();d['weightScale']=100
        with self.assertRaises(SourceError):intake.parse_cps(archive([record()]),'2015-01',d)
    def test_children_and_unemployed_not_current_job_population(self):
        m=intake.parse_cps(archive([record(),record(line=2,age=15),record(line=3,laborStatus=3)]),'2015-01',official_layout());self.assertEqual(m['employedPersonMonths'],1)
    def test_truncated_record(self):
        with self.assertRaises(SourceError):intake.parse_cps(archive([b'123\n']),'2015-01',official_layout())
    def test_empty_source(self):
        with self.assertRaises(SourceError):intake.parse_cps(archive([]),'2015-01',official_layout())
    def test_native_zero_padded_code(self):
        m=intake.parse_cps(archive([record(occupation=10)]),'2015-01',official_layout());self.assertIn('0010',m['occupations'])
    def test_source_metadata_complete(self):
        d=read(ROOT/'accepted/monthly/2015-01.json.gz');self.assertTrue(d['sourceUrl'].startswith('https://www2.census.gov/'));self.assertEqual(d['license'],'PUBLIC_DOMAIN_US_FEDERAL');self.assertEqual(d['period'],'2015-01');self.assertEqual(d['taxonomy'],'Census 2010')
    def test_deterministic_normalization(self):
        b=archive([record()]);self.assertEqual(canonical(intake.parse_cps(b,'2015-01',official_layout())),canonical(intake.parse_cps(b,'2015-01',official_layout())))

class Statistics(unittest.TestCase):
    def test_annual_weight_average(self):
        c=analysis.combine([cell(PWCMPWGT=20000)]*12);self.assertEqual(analysis.estimate(c,12,small_spec())['employment'],2)
    def test_weighted_hours_independent_operands(self):
        c=analysis.combine([cell(PWCMPWGT=30000,PEHRUSL1=20),cell(PWCMPWGT=10000,PEHRUSL1=40)]);self.assertEqual(analysis.estimate(c,12,small_spec())['usualPrimaryJobHours'],25)
    def test_hours_vary_excluded_not_zero(self):
        c=analysis.combine([cell(PEHRUSL1=-4),cell(PEHRUSL1=40)]);d=analysis.estimate(c,12,small_spec());self.assertEqual(d['hoursPersonMonths'],1);self.assertIsNone(d['usualPrimaryJobHours']);self.assertEqual(d['hoursCoverage'],0.5)
    def test_weighted_median(self):self.assertEqual(analysis.median({'100000':30000,'200000':10000}),1000)
    def test_median_empty_missing(self):self.assertIsNone(analysis.median({}))
    def test_earnings_separate_org_weights(self):
        c=analysis.combine([cell(earnings=100000,PWORWGT=40000),cell(earnings=200000,PWORWGT=10000)]);self.assertEqual(analysis.estimate(c,12,small_spec())['nominalWeeklyEarningsMedian'],1000)
    def test_no_earnings_self_employed(self):self.assertEqual(cell(PEIO1COW=6)['earningsN'],0)
    def test_no_earnings_wrong_rotation(self):self.assertEqual(cell(HRMIS=1)['earningsN'],0)
    def test_age_band_boundaries(self):
        for a,b in [(19,'16–19'),(20,'20–24'),(24,'20–24'),(25,'25–34'),(34,'25–34'),(35,'35–54'),(54,'35–54'),(55,'55+')]:self.assertEqual(intake.age_band(a),b)
    def test_age_is_not_seniority(self):self.assertTrue(read(ROOT/'young-worker-by-exposure.json')['data']['ageIsNotSeniority'])
    def test_suppression_not_zero(self):self.assertIsNone(analysis.estimate(cell(),12,S)['employment'])
    def test_missing_months_annual_suppressed(self):self.assertIsNone(analysis.estimate(analysis.combine([cell()]*1000),11,S)['employment'])
    def test_ytd_not_annual(self):
        d=analysis.estimate(analysis.combine([cell()]*8),8,small_spec(),full=False);self.assertEqual(d['employment'],1);self.assertEqual(d['referenceType'],'PARTIAL_YEAR_AVAILABLE_MONTHS')
    def test_pretrend_independent_log_path(self):
        d=analysis.log_trend([(2015,100),(2016,110),(2017,121)]);self.assertAlmostEqual(d['annualGrowthPct'],10,12)
    def test_pretrend_missing_rejected(self):
        with self.assertRaises(SourceError):analysis.log_trend([(2015,100)])
    def test_pretrend_zero_not_valid(self):
        with self.assertRaises(SourceError):analysis.log_trend([(2015,0),(2016,1)])
    def test_change_pct_not_index(self):self.assertAlmostEqual(analysis.change(120,100),20,12)
    def test_missing_change_not_zero(self):self.assertIsNone(analysis.change(None,100))
    def test_group_threshold_distinct(self):
        c=analysis.combine([cell()]*150);self.assertIsNotNone(analysis.estimate(c,12,S)['employment']);self.assertIsNone(analysis.estimate(c,12,S,group=True)['employment'])
    def test_subgroup_weight_reconciliation(self):
        c=analysis.combine([cell(PRTAGE=24,PWCMPWGT=30000),cell(PRTAGE=25,PWCMPWGT=10000)]);self.assertEqual(c['ageWeightInt'],{'20–24':30000,'25–34':10000})
    def test_duplicate_annual_period(self):
        m=intake.parse_cps(archive([record()]),'2015-01',official_layout());cw={'stableBridge':{'1007':{'census2018':'1007','socCode':'15-1212'}}}
        with self.assertRaises(SourceError):analysis.annualize([m,m],cw,small_spec())

class Joins(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.cw=read(ROOT/'cps-soc-concordance.json')['data'];cls.groups=read(ROOT/'exposure-group-outcomes.json')['data']
    def test_exact_census_version(self):self.assertEqual(self.cw['temporalEdges'][0]['sourceVersion'],'Census 2010')
    def test_publisher_counts(self):self.assertEqual(len(self.cw['currentCodes']),570);self.assertEqual(len({e['sourceCode'] for e in self.cw['temporalEdges']}),540)
    def test_all_multiplicities_real(self):self.assertEqual(set(self.cw['mappingCounts']),{'1-to-1','1-to-many','many-to-1','many-to-many'})
    def test_explicit_publisher_merge(self):
        edges={(e['sourceCode'],e['targetCode']) for e in self.cw['temporalEdges']};self.assertTrue({('3850','3870'),('3860','3870')}<=edges)
    def test_explicit_publisher_split(self):
        edges={(e['sourceCode'],e['targetCode']) for e in self.cw['temporalEdges']};self.assertTrue({('0050','0051'),('0050','0052')}<=edges)
    def test_no_duplicate_relations(self):
        k=[(e['sourceCode'],e['targetCode']) for e in self.cw['temporalEdges']];self.assertEqual(len(k),len(set(k)))
    def test_broad_composites_not_allocated(self):self.assertEqual(self.cw['currentCodes']['0060']['targets'],[])
    def test_unmapped_retained(self):self.assertIn('0060',self.cw['currentUnmapped'])
    def test_strict_no_changed_soc_numbers(self):
        stable=self.cw['stableBridge'];self.assertNotIn('1010',stable);self.assertNotIn('0050',stable)
    def test_primary_assignments_fixed(self):
        for source,d in self.groups['sample'].items():
            pinned=S['exposureInputs'][source]['nativeQuantiles']['ranks']
            for c,v in d['fixedExposureAssignments'].items():self.assertEqual(v['quintile'],pinned[v['nativeCode']]['quintile'])
    def test_exposure_not_usage(self):self.assertEqual(S['usageRole'],'CONTEXT_ONLY_NOT_A_CLASSIFIER')
    def test_no_expanded_allocation(self):
        for d in self.groups['sample'].values():self.assertIsNone(d['expandedSize'])
    def test_all_quintiles_reported(self):
        for rows in self.groups['sourceSpecificResults'].values():self.assertEqual({r['quintile'] for r in rows},{1,2,3,4,5})
    def test_coverage_partition(self):
        for rows in self.groups['coverage'].values():
            for r in rows:self.assertAlmostEqual(r['employmentWeightedCoverage']+r['taxonomyExcludedEmploymentShare']+r['unmappedExposureEmploymentShare']+r['suppressedOutcomeEmploymentShare'],1,12)
    def test_coverage_denominator_all_employed(self):
        for rows in self.groups['coverage'].values():self.assertIn('All CPS',rows[0]['denominator'])
    def test_pandemic_preserved(self):
        for rows in self.groups['sourceSpecificResults'].values():self.assertTrue({2020,2021}<=set(r['year'] for r in rows))
    def test_2022_transition_not_preperiod(self):self.assertEqual(S['eras']['transition'],[2022,2022]);self.assertEqual(S['pretrend']['years'],[2015,2016,2017,2018,2019])
    def test_2025_not_full_annual(self):
        for rows in self.groups['sourceSpecificResults'].values():
            for r in rows:
                if r['year']==2025:self.assertEqual(r['referenceType'],'PARTIAL_YEAR_AVAILABLE_MONTHS');self.assertEqual(r['monthCount'],11);self.assertIsNone(r['employmentIndices']['2019']);self.assertNotIn(10,r['referenceMonths'])
    def test_2026_matched_months(self):
        for rows in self.groups['matchedPartialYears'].values():
            r=next(x for x in rows if x['targetYear']==2026);self.assertEqual(r['months'],list(range(1,9)));self.assertEqual(r['estimates'][0]['months'],r['estimates'][1]['months'])
    def test_wages_warned_not_real(self):
        for rows in self.groups['sourceSpecificResults'].values():self.assertIn('PUBLIC_USE',rows[0]['earningsComparability'])

class Integrity(unittest.TestCase):
    def mutate_spec(self,field,value):
        t,r=clone()
        with t:
            d=read(r/'preanalysis-spec.json');d[field]=value;(r/'preanalysis-spec.json').write_bytes(canonical(d))
            with self.assertRaises(SourceError):spec(r)
    def test_tampered_era_rejected(self):self.mutate_spec('eras',{'prePandemic':[2016,2019]})
    def test_tampered_weight_rule_rejected(self):self.mutate_spec('weighting',{'employment':'raw counts'})
    def test_tampered_quantiles_rejected(self):self.mutate_spec('exposureInputs',{})
    def test_tampered_taxonomy_rejected(self):self.mutate_spec('primarySample',{'taxonomy':'SOC 2010'})
    def test_tampered_threshold_rejected(self):self.mutate_spec('minimumSamples',{})
    def test_missing_guardrail_rejected(self):
        d=read(ROOT/'current-research-summary.json');del d['causalityStatus']
        with self.assertRaises(SourceError):pipeline.validate_guardrail(d)
    def test_false_causal_label_rejected(self):
        d=read(ROOT/'current-research-summary.json');d['causalityStatus']='AI_CAUSED'
        with self.assertRaises(SourceError):pipeline.validate_guardrail(d)
    def test_false_binding_rejected(self):
        d=read(ROOT/'current-research-summary.json');d['binding']['preanalysisSpecHash']='0'*64
        with self.assertRaises(SourceError):pipeline.validate_guardrail(d)
    def test_semantic_result_mutation_rejected_even_rehashed(self):
        t,r=clone()
        with t:
            name='current-research-summary.json';d=read(r/name);d['data']['causality']='ESTABLISHED';save(r/name,d);m=read(r/'output-manifest.json');m['artifacts'][name]=sha256(canonical(d));save(r/'output-manifest.json',m)
            with self.assertRaises(SourceError):pipeline.validate(r)
    def test_missing_provenance_rejected(self):
        d=read(ROOT/'current-research-summary.json');del d['binding']['concordanceSha256']
        with self.assertRaises(SourceError):pipeline.validate_guardrail(d)
    def test_statistics_sum_mutation_rejected(self):
        m=read(ROOT/'accepted/monthly/2015-01.json.gz');m['totalEmployed']['weightInt']+=1
        with self.assertRaises(SourceError):pipeline.validate_statistics(m)
    def test_deterministic_rebuild(self):
        a,_=pipeline.build(ROOT);b,_=pipeline.build(ROOT);self.assertEqual(canonical(a),canonical(b))
    def test_each_artifact_guardrail(self):
        for name in read(ROOT/'output-manifest.json')['artifacts']:pipeline.validate_guardrail(read(ROOT/name))
    def test_source_failure_isolation(self):
        t,r=clone()
        with t:
            (r.parent/'normalized').unlink();(r.parent/'normalized').mkdir()
            for p in (ROOT.parent/'normalized').iterdir():
                if p.name!='ai-applicability-microsoft.json':(r.parent/'normalized'/p.name).symlink_to(p)
            bodies,h=pipeline.build(r);self.assertEqual(h['microsoft']['status'],'FAILED');self.assertTrue(h['microsoft']['usingLastValid']);self.assertIn('academic',bodies['exposure-group-outcomes.json']['data']['sourceSpecificResults'])
    def test_anthropic_failure_isolation(self):
        t,r=clone()
        with t:
            (r.parent/'normalized').unlink();(r.parent/'normalized').mkdir()
            for p in (ROOT.parent/'normalized').iterdir():
                if p.name!='ai-usage-context.json':(r.parent/'normalized'/p.name).symlink_to(p)
            bodies,h=pipeline.build(r);self.assertEqual(h['anthropic']['status'],'UNAVAILABLE');self.assertIn('academic',bodies['exposure-group-outcomes.json']['data']['sourceSpecificResults'])
    def test_oews_unavailable_does_not_block_cps(self):
        self.assertEqual(read(ROOT/'oews-occupation-vintages.json')['data']['status'],'UNAVAILABLE');self.assertTrue(read(ROOT/'current-research-summary.json')['data']['sourceResults']['academic'])
    def test_no_occ_hiring_inference(self):self.assertEqual(read(ROOT/'current-research-summary.json')['data']['occupationalHiring'],'UNAVAILABLE')
    def test_statistical_uncertainty_not_iid(self):self.assertIn('DESIGN_SE_UNAVAILABLE',S['uncertainty'])
    def test_no_causal_decision_label(self):self.assertFalse(any('AI CAUSED' in v for v in read(ROOT/'current-research-summary.json')['data']['decisionTreeLabels']))
    def test_health_states_separate(self):
        h=read(ROOT/'outcome-data-health.json')['providers'];self.assertEqual(h['oews']['status'],'UNAVAILABLE');self.assertEqual(h['cps']['status'],'PARTIAL')


class OEWS(unittest.TestCase):
    def test_oews_literal_employment_and_wages(self):
        d=intake.oews((FIX/'synthetic-oews.zip').read_bytes(),'2025-05',{'11-1011'});self.assertEqual(d['records'][0]['employment'],1000);self.assertEqual(d['records'][0]['annualMeanWage'],200000);self.assertEqual(d['records'][0]['annualMedianWage'],180000)
    def test_oews_suppression_not_zero(self):
        d=intake.oews((FIX/'synthetic-oews.zip').read_bytes(),'2025-05',{'11-1011'});self.assertIsNone(d['records'][0]['annualWagePercentiles']['10']);self.assertEqual(d['records'][0]['sourceValues']['A_PCT10'],'*')
    def test_oews_aggregate_not_detailed(self):
        d=intake.oews((FIX/'synthetic-oews.zip').read_bytes(),'2025-05',{'11-1011'});self.assertEqual(d['records'][1]['hierarchy'],'REPORTING_AGGREGATE_OR_TOTAL')
    def test_oews_not_longitudinal(self):
        d=intake.oews((FIX/'synthetic-oews.zip').read_bytes(),'2025-05',{'11-1011'});self.assertEqual(d['longitudinalStatus'],'NOT_COMPARABLE');self.assertEqual(len(d['comparabilityReasons']),5)
    def test_oews_wrong_frequency(self):
        with self.assertRaises(SourceError):intake.oews((FIX/'synthetic-oews.zip').read_bytes(),'2025-06',{'11-1011'})
    def test_oews_invalid_archive(self):
        with self.assertRaises(zipfile.BadZipFile):intake.oews(b'notzip','2025-05',{'11-1011'})

class FailureIsolation(unittest.TestCase):
    def test_fetch_failure_preserves_every_valid_month_and_other_sources(self):
        t,r=clone()
        with t:
            cache=pathlib.Path(t.name)/'empty-cache';before=pipeline.normalize(r)['artifacts']
            def fail(url):raise OSError('Synthetic network failure')
            failures=pipeline.refresh(r,cache,fail);after=read(r/'output-manifest.json')['artifacts']
            self.assertEqual(len(failures),152);self.assertEqual(before,after)
            h=read(r/'outcome-data-health.json')['providers'];self.assertEqual(h['cps']['status'],'FAILED');self.assertEqual(len(h['cps']['usingLastValidMonths']),139);self.assertEqual(h['academic']['status'],'PARTIAL')
    def test_remote_changed_bytes_not_adopted(self):
        t,r=clone()
        with t:
            cache=pathlib.Path(t.name)/'empty-cache';before=pipeline.normalize(r)['artifacts'];failures=pipeline.refresh(r,cache,lambda url:b'unreviewed changed source');self.assertEqual(before,read(r/'output-manifest.json')['artifacts']);self.assertTrue(all('Source vintage changed' in x for x in failures.values()))


class AdditionalIntegrity(unittest.TestCase):
    def test_duplicate_join_output_rejected(self):
        t,r=clone()
        with t:
            p=r/'cps-soc-concordance.json';d=read(p);d['data']['temporalEdges'].append(d['data']['temporalEdges'][0]);save(p,d)
            with self.assertRaises(SourceError):pipeline.validate(r)
    def test_output_taxonomy_claim_rejected(self):
        t,r=clone()
        with t:
            p=r/'cps-soc-concordance.json';d=read(p);d['data']['temporalEdges'][0]['targetVersion']='SOC 2010';save(p,d)
            with self.assertRaises(SourceError):pipeline.validate(r)
    def test_unavailable_microsoft_without_prior_has_no_fabricated_groups(self):
        t,r=clone()
        with t:
            (r.parent/'normalized').unlink();(r.parent/'normalized').mkdir()
            for p in (ROOT.parent/'normalized').iterdir():
                if p.name!='ai-applicability-microsoft.json':(r.parent/'normalized'/p.name).symlink_to(p)
            (r/'accepted/exposure').unlink();(r/'accepted/exposure').mkdir()
            bodies,h=pipeline.build(r);self.assertEqual(h['microsoft']['status'],'UNAVAILABLE');self.assertNotIn('microsoft',bodies['exposure-group-outcomes.json']['data']['sourceSpecificResults'])
    def test_exposure_era_hash_never_changes_by_execution_time(self):self.assertEqual(spec()['eras'],S['eras']);self.assertEqual(sha256((ROOT/'preanalysis-spec.json').read_bytes()),SPEC_SHA)
    def test_partial_year_has_no_full_year_indices(self):
        for rows in read(ROOT/'exposure-group-outcomes.json')['data']['sourceSpecificResults'].values():
            for r in rows:
                if r['monthCount']<12:self.assertTrue(all(v is None for v in r['employmentIndices'].values()))
    def test_primary_minimum_sample_frozen(self):self.assertEqual(S['minimumSamples']['occupationEmploymentPersonMonths'],120);self.assertEqual(S['minimumSamples']['groupPersonMonths'],500)
    def test_no_interpolation_or_october_2025(self):
        m=read(ROOT/'accepted/monthly-manifest.json');self.assertNotIn('2025-10',[r['period'] for r in m['files']]);self.assertEqual(len(m['files']),139)
    def test_summary_is_bounded_and_preserves_all_groups(self):
        v=read(ROOT/'current-research-summary.json');self.assertLess(len(canonical(v)),50000)
        for source in v['data']['sourceResults'].values():
            self.assertEqual(set(source['quintileComparisons']),{'1','2','3','4','5'})
            self.assertTrue(all('estimates' not in p for p in source['matchedPartialYears']))
            self.assertEqual(source['detailsArtifact'],'exposure-group-outcomes.json')

if __name__=='__main__':unittest.main()
