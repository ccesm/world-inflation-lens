"""Offline source, mapping and provenance regressions; never calls live internet."""
import copy,csv,gzip,io,json,shutil,sys,tempfile,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
import adapters as a
import model
import pipeline as p
from common import ROOT,canonical,sha256,SourceError,VERSION
OUTPUT=ROOT.parent/'normalized'

class OfficialSources(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.reg=p.registry(ROOT);cls.raw={}
  for provider in cls.reg['providers']:cls.raw.update(p.read_raw(ROOT,cls.reg,provider))
  cls.soc=a.soc_structure(cls.raw['soc_census']);cls.onet=a.onet_bundle(cls.raw['onet_zip'])
  cls.gpt=a.academic(cls.raw['gpt_occ'],cls.raw['gpt_task'],cls.raw['gpt_full']);cls.ms=a.microsoft(cls.raw);cls.ant=a.anthropic(cls.raw)
  cls.anchors=json.loads((ROOT/'tests/fixtures/publisher-anchors.json').read_text())
 def test_soc_counts_independent(self):
  counts={level:sum(r['hierarchyLevel']==level for r in self.soc) for level in ['major','minor','broad','detailed']}
  self.assertEqual(counts,dict(major=23,minor=98,broad=459,detailed=867))
 def test_soc_parent_exists(self):
  codes={r['socCode'] for r in self.soc};self.assertTrue(all(r['parentCode'] is None or r['parentCode'] in codes for r in self.soc))
 def test_soc_full_codes_titles(self):
  r=next(r for r in self.soc if r['socCode']=='11-1011');self.assertEqual(r['title'],'Chief Executives');self.assertEqual(r['taxonomy'],dict(major='11-0000',minor='11-1000',broad='11-1010'))
 def test_onet_version_and_counts(self):self.assertEqual(len(self.onet['Occupation Data']),1016);self.assertEqual(len(self.onet['Task Statements']),18838)
 def test_onet_task_text_literal(self):
  r=next(r for r in self.onet['Task Statements'] if r['O*NET-SOC Code']=='11-1011.00' and r['Task ID']=='8823')
  self.assertEqual(r['Task'],"Direct or coordinate an organization's financial or budget activities to fund operations, maximize investments, or increase efficiency.")
 def test_onet_importance_not_inferred(self):
  self.assertTrue(any(r['Scale ID']=='IM' for r in self.onet['Task Ratings']));self.assertNotIn('timeShare',self.onet['Task Ratings'][0])
 def test_onet_scales_bounds(self):self.assertEqual(next(r for r in self.onet['Scales Reference'] if r['Scale ID']=='IM')['Maximum'],'5')
 def test_onet_descriptor_coverage(self):
  self.assertEqual(len(self.onet['Work Activities']),74702);self.assertEqual(len(self.onet['Knowledge']),60060);self.assertEqual(len(self.onet['Software Skills']),31821)
 def test_academic_native_count(self):self.assertEqual(len(self.gpt[0]),923);self.assertEqual(len(self.gpt[1]),19265)
 def test_academic_publisher_anchors(self):
  for raw in self.anchors['academic']:
   actual=next(r for r in self.gpt[0] if r['O*NET-SOC Code']==raw['O*NET-SOC Code'])
   for key in ('human_rating_beta','dv_rating_beta','human_rating_alpha','dv_rating_gamma'):self.assertAlmostEqual(actual[key],float(raw[key]))
 def test_academic_independent_core_arithmetic(self):
  rows=json.loads((ROOT/'tests/fixtures/chief-executive-tasks.json').read_text())['records'];den=sum(2 if r['Task Type']=='Core' else 1 for r in rows)
  human=sum((1 if r['human_exposure_agg']=='E1' else .5 if r['human_exposure_agg']=='E2' else 0)*(2 if r['Task Type']=='Core' else 1) for r in rows)/den
  self.assertEqual(den,50);self.assertAlmostEqual(human,.35)
 def mutate_gpt(self,table,key,value):
  rows=a.tabular(self.raw[table], '\t' if table!='gpt_occ' else ',');rows[0][key]=value;s=io.StringIO();w=csv.DictWriter(s,fieldnames=list(rows[0]),delimiter='\t' if table!='gpt_occ' else ',');w.writeheader();w.writerows(rows)
  raw=dict(self.raw);raw[table]=s.getvalue().encode()
  with self.assertRaises(SourceError):a.academic(raw['gpt_occ'],raw['gpt_task'],raw['gpt_full'])
 def test_academic_reject_score_range(self):self.mutate_gpt('gpt_occ','human_rating_beta','1.2')
 def test_academic_reject_category(self):self.mutate_gpt('gpt_task','gpt4_exposure','HIGH')
 def test_academic_reject_changed_weight(self):self.mutate_gpt('gpt_full','coreweight','1')
 def test_academic_reject_wrong_aggregate(self):self.mutate_gpt('gpt_occ','human_rating_beta','.36')
 def test_academic_reject_task_text_mismatch(self):self.mutate_gpt('gpt_task','Task','Edited text')
 def test_academic_reject_nonfinite(self):self.mutate_gpt('gpt_occ','human_rating_alpha','NaN')
 def test_microsoft_native_anchors(self):
  self.assertEqual(len(self.ms[0]),785)
  for raw in self.anchors['microsoft']:self.assertAlmostEqual(next(r for r in self.ms[0] if r['SOC Code']==raw['SOC Code'])['ai_applicability_score'],float(raw['ai_applicability_score']))
 def test_microsoft_decomposition_reconciled(self):
  r=self.ms[1]['ms_socmetrics'][0];self.assertAlmostEqual((float(r['ai_applicability_score_user'])+float(r['ai_applicability_score_ai_nonphysical']))/2,self.ms[0][0]['ai_applicability_score'])
 def test_microsoft_missing_feedback_retained(self):self.assertTrue(any(r['feedback_positive_fraction_ai']=='' for r in self.ms[1]['ms_iwa']))
 def test_microsoft_reject_false_native_score(self):
  raw=dict(self.raw);raw['ms_scores']=raw['ms_scores'].replace(b'0.155502898114603',b'0.455502898114603',1)
  with self.assertRaises(SourceError):a.microsoft(raw)
 def test_microsoft_reject_nonphysical_weight(self):
  rows=a.tabular(self.raw['ms_nonphysical']);rows[0]['4.A.1.a.1.I10']='999';s=io.StringIO();w=csv.DictWriter(s,list(rows[0]));w.writeheader();w.writerows(rows);raw=dict(self.raw);raw['ms_nonphysical']=s.getvalue().encode()
  with self.assertRaises(SourceError):a.microsoft(raw)
 def test_anthropic_native_task_counts(self):self.assertEqual(len(self.ant[0]),3514);self.assertEqual(len(self.ant[1]),19530)
 def test_anthropic_usage_denominator(self):self.assertAlmostEqual(sum(r['pct'] for r in self.ant[0]),100)
 def test_anthropic_modes_not_renormalized(self):self.assertAlmostEqual(sum(r['pct'] for r in self.ant[2]),84.20923280635583)
 def test_anthropic_source_mode_anchor(self):self.assertAlmostEqual(next(r for r in self.ant[2] if r['interaction_type']=='directive')['pct'],22.563272409918948)
 def test_anthropic_reject_category_change(self):
  raw=dict(self.raw);raw['anthro_modes']=raw['anthro_modes'].replace(b'directive',b'job displacement')
  with self.assertRaises(SourceError):a.anthropic(raw)
 def test_anthropic_reject_usage_scale(self):
  raw=dict(self.raw);raw['anthro_tasks']=raw['anthro_tasks'].replace(b'0.006775156024025746',b'106.006775156024025746',1)
  with self.assertRaises(SourceError):a.anthropic(raw)
 def test_invalid_soc_code_pattern(self):self.assertIsNone(a.SOC.fullmatch('11-1011.00'));self.assertIsNone(a.ONET.fullmatch('11-1011'))
 def test_missing_value_is_not_zero(self):
  with self.assertRaises(SourceError):a.number('')
 def test_duplicate_source_keys(self):
  with self.assertRaises(SourceError):a.unique([{'id':'a'},{'id':'a'}],['id'])
 def test_malformed_csv(self):
  with self.assertRaises(SourceError):a.tabular(b'a,b\n1,2,3\n')
 def test_unknown_headers(self):
  with self.assertRaises(SourceError):a.tabular(b'a,b\n1,2\n',required=['a','c'])

class CrosswalkMechanics(unittest.TestCase):
 def graph(self,edges,sources=None):
  rows=[dict(sourceCode=s,targetCode=t) for s,t in edges];return a.classify_mapping(rows,set(sources or [s for s,t in edges]),{t for s,t in edges},'O*NET-SOC 2010','O*NET-SOC 2019','official fixture')
 def test_one_to_one(self):self.assertEqual(self.graph([('a','x')])[0]['mappingType'],'1-to-1')
 def test_one_to_many_split(self):self.assertEqual({r['mappingType'] for r in self.graph([('a','x'),('a','y')])},{'1-to-many'})
 def test_many_to_one_merge(self):self.assertEqual({r['mappingType'] for r in self.graph([('a','x'),('b','x')])},{'many-to-1'})
 def test_many_to_many(self):self.assertEqual({r['mappingType'] for r in self.graph([('a','x'),('a','y'),('b','x'),('b','y')])},{'many-to-many'})
 def test_unmapped_retained(self):self.assertEqual(self.graph([('a','x')],['a','b'])[-1]['mappingType'],'unmapped')
 def test_mapping_no_cloning(self):self.assertTrue(all(r['valueTransfer']=='NO_AUTOMATIC_CLONING_OR_POOLING' for r in self.graph([('a','x'),('a','y')])))
 def test_duplicate_mapping_rejected(self):
  with self.assertRaises(SourceError):self.graph([('a','x'),('a','x')])
 def test_unknown_target_rejected(self):
  with self.assertRaises(SourceError):a.classify_mapping([{'sourceCode':'a','targetCode':'y'}],{'a'},{'x'},'2010','2019','fixture')
 def test_missing_taxonomy_version(self):
  with self.assertRaises(SourceError):a.classify_mapping([],{'a'},set(),'','2019','fixture')
 def test_tied_ranks_stay_together(self):
  ranks=model.ranks({'a':0,'b':0,'c':1});self.assertEqual(ranks['a'],ranks['b']);self.assertEqual(ranks['a']['rank'],1.5)
 def test_source_rank_direction(self):r=model.ranks({'a':.1,'b':.9});self.assertLess(r['a']['percentile'],r['b']['percentile'])
 def test_quintile_cutpoints_explicit(self):self.assertEqual(model.quantile_metadata({'a':0,'b':1})['percentileBinBoundaries'],[0,.2,.4,.6,.8,1])
 def test_rank_correlation_known(self):self.assertAlmostEqual(model.correlation({'a':0,'b':1,'c':2},{'a':3,'b':2,'c':1}),-1)
 def test_constant_rank_correlation_unavailable(self):self.assertIsNone(model.correlation({'a':0,'b':0},{'a':0,'b':1}))
 def test_shared_usage_ambiguous_not_cloned(self):
  c={'legacy':[dict(sourceCode='old',targetCode='new')],'direct':[dict(sourceCode='new',targetCode='soc')]}
  h=[{'O*NET-SOC Code':'old','Task ID':'1','Task':'A'},{'O*NET-SOC Code':'old','Task ID':'2','Task':'A'}]
  r=model.usage_links([{'task_name':'a','pct':1}],h,c)[0];self.assertEqual(r['status'],'AMBIGUOUS_CONTEXT_LINK');self.assertFalse(r['occupationValueAssigned'])
 def test_split_usage_ambiguous(self):
  c={'legacy':[dict(sourceCode='old',targetCode='new1'),dict(sourceCode='old',targetCode='new2')],'direct':[dict(sourceCode='new1',targetCode='s1'),dict(sourceCode='new2',targetCode='s2')]}
  r=model.usage_links([{'task_name':'a','pct':1}],[{'O*NET-SOC Code':'old','Task ID':'1','Task':'A'}],c)[0];self.assertEqual(r['status'],'AMBIGUOUS_CONTEXT_LINK')
 def test_unmapped_usage_not_dropped(self):
  r=model.usage_links([{'task_name':'missing','pct':.1}],[],{'legacy':[],'direct':[]})[0];self.assertEqual(r['status'],'UNMAPPED');self.assertEqual(r['percentageOfClassifiedConversations'],.1)
 def test_changed_current_task_not_relabelled(self):
  r=model.task_links({'Task Statements':[{'O*NET-SOC Code':'11-1011.00','Task ID':'1','Task':'new'}]},[{'O*NET-SOC Code':'11-1011.00','Task ID':'1.0','Task':'old'}])[0];self.assertEqual(r['status'],'TEXT_CHANGED');self.assertTrue(r['noClassificationTransferredToNewText'])
 def test_absent_current_task_retained(self):self.assertEqual(model.task_links({'Task Statements':[]},[{'O*NET-SOC Code':'11-1011.00','Task ID':'1.0','Task':'old'}])[0]['status'],'ABSENT_FROM_CURRENT_BACKBONE')

class AcceptedArtifactChecks(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.reg=p.registry(ROOT);cls.accepted={q:p.load_payload(ROOT/'accepted'/f'{q}.json.gz')['data'] for q in cls.reg['providers']};cls.outputs=p.build(cls.reg,cls.accepted)
 def test_all_canonical_occupations_retained(self):self.assertEqual(len(self.outputs['occupations.json']['data']['records']),1447)
 def test_unavailable_exposure_not_zero(self):
  rows=self.outputs['occupations.json']['data']['records'];self.assertTrue(any(r['hierarchyLevel']=='detailed' and r['exposureStatus']=='UNAVAILABLE' and r['exposureMeasures']=={} for r in rows))
 def test_coverage_independent_expected_counts(self):
  c=self.outputs['occupations.json']['data']['coverage'];self.assertEqual(c['academic']['detailedOccupationCount'],798);self.assertEqual(c['microsoft']['detailedOccupationCount'],773)
 def test_employment_weighting_not_fabricated(self):self.assertTrue(all(r['employmentWeightedCoverage'] is None for r in self.outputs['occupations.json']['data']['coverage'].values()))
 def test_hybrid_codes_not_assigned(self):self.assertEqual(self.outputs['occupations.json']['data']['coverage']['microsoft']['unmappedNativeCodes'],['21-1018','25-2052','25-9045','51-2028','53-1047'])
 def test_broad_values_not_cloned(self):
  rows=self.outputs['occupations.json']['data']['records'];r=next(r for r in rows if r['socCode']=='13-1021');self.assertNotIn('microsoftApplicability',r['observedUsageMeasures'])
 def test_no_occupational_automation_invented(self):self.assertTrue(all(r['automationMeasures']=={} and r['augmentationMeasures']=={} and r['complementarityMeasures']=={} for r in self.outputs['occupations.json']['data']['records']))
 def test_no_aggregate(self):self.assertTrue(self.outputs['exposure-agreement.json']['data']['noAggregateScore'])
 def test_coverage_agreement_overlap(self):self.assertEqual(self.outputs['exposure-agreement.json']['data']['occupationCountOverlap'],701)
 def test_independent_method_disagreement_retained(self):
  d=self.outputs['exposure-agreement.json']['data'];self.assertEqual(d['disagreementCount'],102);self.assertTrue(all('humanBeta' in r and 'microsoftApplicability' in r for r in d['rows']))
 def test_native_annotation_text_retained(self):self.assertEqual(self.outputs['exposure-academic-tasks.json.gz']['data']['records'][0]['Task'],self.accepted['academic']['tasks'][0]['Task'])
 def test_reproducible_build(self):self.assertEqual(canonical(self.outputs),canonical(p.build(self.reg,self.accepted)))
 def test_license_metadata_present(self):self.assertTrue(all(v['license'] for v in self.outputs['occupations.json']['pinnedInputs'].values()))
 def test_publisher_metadata_present(self):self.assertTrue(all(m['authorsInstitution'] and m['sourceUrl'] for m in self.reg['methodologyMetadata'].values()))
 def test_schema_on_all_outputs(self):
  from common import validate_schema
  schema=json.loads((ROOT/'schemas/output.schema.json').read_text())
  for d in self.outputs.values():validate_schema(d,schema)
 def test_version_mismatch(self):
  with tempfile.TemporaryDirectory() as tmp:
   t=Path(tmp);shutil.copytree(ROOT/'config',t/'config');j=json.loads((t/'config/sources.json').read_text());j['onetTaxonomy']='O*NET-SOC 2010';(t/'config/sources.json').write_bytes(canonical(j))
   with self.assertRaises(SourceError):p.registry(t)
 def test_license_restriction_gate(self):
  with tempfile.TemporaryDirectory() as tmp:
   t=Path(tmp);shutil.copytree(ROOT/'config',t/'config');j=json.loads((t/'config/sources.json').read_text());j['files']['gpt_task']['redistribution']=False;(t/'config/sources.json').write_bytes(canonical(j))
   with self.assertRaises(SourceError):p.registry(t)
 def test_pinned_raw_tamper_rejected(self):
  with tempfile.TemporaryDirectory() as tmp:
   t=Path(tmp);(t/'sources/raw').mkdir(parents=True);h=self.reg['files']['gpt_task']['sha256'];(t/'sources/raw'/(h+'.gz')).write_bytes(gzip.compress(b'fabricated'))
   with self.assertRaises((SourceError,FileNotFoundError)):p.read_raw(t,self.reg,'academic')
 def test_source_failure_isolation_retains_prior(self):
  with tempfile.TemporaryDirectory() as tmp:
   t=Path(tmp)/'occupational';shutil.copytree(ROOT,t);out=Path(tmp)/'outputs';before=(t/'accepted/academic.json.gz').read_bytes()
   def failing(url):
    if 'GPTs-are-GPTs' in url:raise OSError('fixture academic unavailable')
    return next(p.read_raw(ROOT,self.reg,v['provider'])[k] for k,v in self.reg['files'].items() if v['url']==url)
   h=p.run(t,out,'refresh',fetcher=failing);self.assertEqual(h['providers']['academic']['status'],'FAILED');self.assertTrue(h['providers']['academic']['usingLastValid']);self.assertEqual(before,(t/'accepted/academic.json.gz').read_bytes());self.assertEqual(h['providers']['soc']['status'],'CURRENT');self.assertEqual(h['providers']['microsoft']['status'],'PARTIAL')
 def test_failure_without_prior_unavailable(self):
  with tempfile.TemporaryDirectory() as tmp:
   t=Path(tmp)/'occupational';shutil.copytree(ROOT,t);(t/'accepted/anthropic.json.gz').unlink()
   h=p.run(t,Path(tmp)/'outputs','refresh',providers=['anthropic'],fetcher=lambda u:(_ for _ in ()).throw(OSError('offline')));self.assertEqual(h['providers']['anthropic']['status'],'UNAVAILABLE');self.assertFalse(h['providers']['anthropic']['usingLastValid']);self.assertTrue((Path(tmp)/'outputs/occupations.json').exists())
 def test_output_manifest_hashes(self):
  m=json.loads((OUTPUT/'occupation-output-manifest.json').read_text());self.assertEqual(m['artifacts'],{n:sha256(canonical(v)) for n,v in sorted(self.outputs.items())})
 def test_pinned_output_semantic_validation(self):self.assertEqual(p.validate_outputs(ROOT,OUTPUT),12)
 def test_independent_output_mutation_probes(self):
  probes=[('source-url',lambda d:d['pinnedInputs']['gpt_task'].__setitem__('url','https://example.invalid/data')),('raw-hash',lambda d:d['pinnedInputs']['gpt_task'].__setitem__('sha256','0'*64)),('config-hash',lambda d:d.__setitem__('configurationHash','0'*64)),('soc-version',lambda d:d['data']['records'][0].__setitem__('socVersion','2010')),('title',lambda d:d['data']['records'][0].__setitem__('title','Invented title')),('parent',lambda d:d['data']['records'][1].__setitem__('parentCode','99-9999')),('invented-automation',lambda d:d['data']['records'][0].__setitem__('automationMeasures',{'invented':1})),('dropped-occupation',lambda d:d['data']['records'].pop()),('false-coverage',lambda d:d['data']['coverage']['academic'].__setitem__('detailedOccupationCount',867)),('license',lambda d:d['pinnedInputs']['gpt_task'].__setitem__('license','NO_LICENSE'))]
  with tempfile.TemporaryDirectory() as tmp:
   out=Path(tmp)
   for name in self.outputs:(out/name).symlink_to(OUTPUT/name)
   (out/'occupation-output-manifest.json').symlink_to(OUTPUT/'occupation-output-manifest.json')
   (out/'occupations.json').unlink()
   for name,mutate in probes:
    with self.subTest(field=name):
     d=copy.deepcopy(self.outputs['occupations.json']);mutate(d);p.save_payload(out/'occupations.json',d)
     with self.assertRaises(SourceError):p.validate_outputs(ROOT,out)
 def test_false_manifest_rejected(self):
  with tempfile.TemporaryDirectory() as tmp:
   out=Path(tmp)
   for name in self.outputs:(out/name).symlink_to(OUTPUT/name)
   d=json.loads((OUTPUT/'occupation-output-manifest.json').read_text());d['artifacts']['occupations.json']='0'*64;p.save_payload(out/'occupation-output-manifest.json',d)
   with self.assertRaises(SourceError):p.validate_outputs(ROOT,out)
 def test_canonical_schema_rejects_incompatible_version(self):
  from common import validate_schema
  schema=json.loads((ROOT/'schemas/occupation.schema.json').read_text());d=copy.deepcopy(self.outputs['occupations.json']['data']['records'][0]);d['socVersion']='2028'
  with self.assertRaises(SourceError):validate_schema(d,schema)

if __name__=='__main__':unittest.main()
