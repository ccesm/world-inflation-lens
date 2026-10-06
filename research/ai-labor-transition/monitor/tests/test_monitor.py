"""Literal adversarial states, incremental source mocks and archive replay."""
import sys,tempfile,shutil,copy,unittest,json,gzip,io,zipfile
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from monitor_common import *
from refresh import discovery as D,sources as S
from evaluation import evidence as E,alerts as AL
from history import store as H
run=module('monitor_cli_test',ROOT/'cli.py').run
FIX=Path(__file__).parent/'fixtures'
RUN='2026-10-07T03:00:00Z'

class Rules(unittest.TestCase):
    def test_protocol_hash(self):self.assertEqual(sha256((ROOT/'monitor-spec.json').read_bytes()),SPEC_HASH)
    def test_fixed_thresholds(self):self.assertEqual(spec()['thresholds']['employmentGapPp'],5);self.assertEqual(spec()['thresholds']['youngShareGapPp'],2)
    def test_phase3_fixed_sample(self):self.assertEqual(baseline()['sample']['academic']['primarySize'],167);self.assertEqual(baseline()['sample']['microsoft']['primarySize'],190)
    def test_no_exposure_average(self):self.assertEqual(spec()['exposureMethods'],['academic','microsoft']);self.assertEqual(spec()['anthropicRole'],'CONTEXT_ONLY')
    def test_eras_fixed(self):self.assertEqual(spec()['eras']['pretrend'],[2015,2019]);self.assertEqual(spec()['eras']['reference'],2022)
    def test_calendar_timezone(self):self.assertEqual(D.calendar_events((FIX/'releases.ics').read_bytes(),RUN)[-1]['officialReleaseDate'],'2026-10-02T12:30:00Z')
    def test_future_calendar_excluded(self):self.assertEqual(len(D.calendar_events((FIX/'releases.ics').read_bytes(),RUN)),2)
    def test_bad_calendar_rejected(self):self.assertRaises(SourceError,D.calendar_events,b'bad',RUN)
    def test_missing_calendar_timezone(self):self.assertRaises(SourceError,D.calendar_events,(FIX/'releases.ics').read_bytes().replace(b';TZID=America/New_York',b''),RUN)
    def test_release_due(self):self.assertTrue(D.due(D.calendar_events((FIX/'releases.ics').read_bytes(),RUN),'cps',None,RUN))
    def test_no_new_release(self):e=D.calendar_events((FIX/'releases.ics').read_bytes(),RUN);self.assertIsNone(D.due(e,'ces',{'lastReleaseEventId':e[-1]['eventId']},RUN))
    def test_pending_release_retry(self):e=D.calendar_events((FIX/'releases.ics').read_bytes(),RUN);self.assertTrue(D.due(e,'cps',{'lastReleaseEventId':e[-1]['eventId'],'releasePending':True},RUN))
    def test_retry_expiry(self):e=D.calendar_events((FIX/'releases.ics').read_bytes(),RUN);self.assertIsNone(D.due(e,'cps',{'lastReleaseEventId':e[-1]['eventId'],'releasePending':True},'2026-10-20T00:00:00Z'))
    def test_incremental_candidates(self):self.assertEqual(D.micro_candidates(['2026-07','2026-08'],RUN),['2026-07','2026-08','2026-09'])
    def test_no_october_2025(self):self.assertNotIn('2025-10',D.micro_candidates(['2025-09'],'2025-11-20T00:00:00Z'))
    def test_probe_without_validator_not_identity(self):self.assertFalse(D.same_probe({'etag':None},{'etag':None}))
    def test_probe_reuse(self):self.assertTrue(D.same_probe({'etag':'abc'},{'etag':'abc'}))
    def test_endpoint_guard(self):self.assertRaises(SourceError,D.http,'https://example.com/private')

class Evidence(unittest.TestCase):
    def result(self,values,coverage=.8,pre=None,comparable=True):return E.state_for([{'year':2023+i,'value':v} for i,v in enumerate(values)],5,coverage,pre,comparable)
    def test_quiet(self):self.assertEqual(self.result([1,2])['state'],'NO_CLEAR_DIVERGENCE')
    def test_watch(self):self.assertEqual(self.result([1,6])['state'],'EARLY_DESCRIPTIVE_WATCH')
    def test_persistence(self):self.assertEqual(self.result([6,7])['state'],'PERSISTENT_DESCRIPTIVE_DIVERGENCE')
    def test_single_point_not_persistent(self):self.assertFalse(self.result([9])['persistence']['satisfied'])
    def test_ordinary_fluctuation(self):self.assertEqual(self.result([6,-6,1])['state'],'NO_CLEAR_DIVERGENCE')
    def test_sign_change_resets(self):self.assertEqual(self.result([6,-6])['persistence']['consecutiveCompleteAnnualEndpoints'],1)
    def test_missing_resets(self):self.assertEqual(self.result([6,None,6])['persistence']['consecutiveCompleteAnnualEndpoints'],1)
    def test_missing_year_resets(self):self.assertFalse(E.persistence([{'year':2023,'value':6},{'year':2025,'value':6}],5)['satisfied'])
    def test_insufficient_coverage(self):self.assertEqual(self.result([6,7],.38)['state'],'INSUFFICIENT_EVIDENCE')
    def test_preexisting(self):self.assertEqual(self.result([6,7],pre=-1.18)['state'],'PRE_EXISTING_TREND')
    def test_incomparable_wage(self):self.assertEqual(self.result([10,12],comparable=False)['state'],'INSUFFICIENT_EVIDENCE')
    def test_unavailable_not_quiet(self):self.assertEqual(self.result([None])['state'],'INSUFFICIENT_EVIDENCE')
    def test_method_disagreement(self):self.assertEqual(E.compare_methods(self.result([6]),self.result([1]))['status'],'METHODOLOGY_DEPENDENT')
    def test_opposite_direction(self):self.assertEqual(E.compare_methods(self.result([6]),self.result([-6]))['status'],'METHODOLOGY_DEPENDENT')
    def test_incomparable_earnings_not_agreement(self):self.assertEqual(E.compare_methods(self.result([6],comparable=False),self.result([6],comparable=False),metric='earnings')['status'],'INSUFFICIENT_EVIDENCE')
    def test_hours_method_difference_uses_hours(self):self.assertEqual(E.compare_methods(self.result([6]),self.result([8]),metric='hours')['status'],'METHODOLOGY_DEPENDENT')
    def test_agreement_not_causal(self):self.assertTrue(E.compare_methods(self.result([6]),self.result([6.5]))['agreementDoesNotEstablishCausality'])
    def test_recovery(self):self.assertEqual(self.result([6,7,0])['state'],'NO_CLEAR_DIVERGENCE')
    def test_uncertainty_visible(self):self.assertIn('DESIGN_SE_UNAVAILABLE',self.result([6])['uncertainty'])
    def test_monthly_missing_no_interpolation(self):
        d=P1.load_provider(LABOR,'ces')['series'][0];d=copy.deepcopy(d);d['observations']=[o for o in d['observations'] if o['period']!='2025-08'];r=E.monthly_context(d);self.assertEqual(r['exactMonthlyDirection']['state'],'INSUFFICIENT_EVIDENCE')
    def test_monthly_exact_window(self):
        d=copy.deepcopy(P1.load_provider(LABOR,'ces')['series'][0]);d['observations']=d['observations'][-15:]
        for i,o in enumerate(d['observations']):o['value']=100+i
        r=E.monthly_context(d);self.assertEqual(r['exactMonthlyDirection']['changes'],[12,12,12])

class Archives(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp=tempfile.TemporaryDirectory();cls.store=Path(cls.temp.name)/'store';cls.out=Path(cls.temp.name)/'out';cls.inputs=S.initialize(cls.store);cls.initial=run(cls.store,cls.out,RUN)
    @classmethod
    def tearDownClass(cls):cls.temp.cleanup()
    def clone(self):
        t=tempfile.TemporaryDirectory();p=Path(t.name)/'store';shutil.copytree(self.store,p);self.addCleanup(t.cleanup);return p
    def test_no_data_repeat(self):
        p=self.clone();r=run(p,p.parent/'out','2026-10-08T03:00:00Z');self.assertEqual(r['economicChange'],'NO_ECONOMIC_CHANGE');self.assertEqual(r['evaluationId'],self.initial['evaluationId']);self.assertEqual(len(H.manifest(p)['evaluations']),1)
    def test_clock_does_not_change_result_hash(self):
        p=self.clone();a=H.accept(p,read(p/'inputs.json'),'2026-10-08T00:00:00Z')[0];b=H.accept(p,read(p/'inputs.json'),'2026-10-09T00:00:00Z')[0];self.assertEqual(a['resultHash'],b['resultHash'])
    def test_recorded_replay(self):self.assertEqual(H.replay(self.store,RUN)['record']['evaluationId'],self.initial['evaluationId'])
    def test_unrecorded_replay_rejected(self):self.assertRaises(SourceError,H.replay,self.store,'2022-12-31T00:00:00Z')
    def test_future_acceptance(self):p=self.clone();self.assertRaises(SourceError,H.accept,p,read(p/'inputs.json'),'2022-12-31T00:00:00Z')
    def test_snapshot_tamper(self):
        p=self.clone();r=H.manifest(p)['lastEvaluationId'];v=read(p/'evaluations'/f'{r}.json');v['result']['causality']='ESTABLISHED';put(p/'evaluations'/f'{r}.json',v);self.assertRaises(SourceError,H.load_record,p,r)
    def test_input_tamper(self):
        p=self.clone();i=read(p/'inputs.json');h=i['providers']['ces']['snapshot'];v=object_get(p,h);v['series'][0]['observations'][-1]['value']=1;put(p/'objects'/f'{h}.json.gz',v);self.assertRaises(SourceError,H.input_identity,p,i)
    def test_partial_year_no_persistence(self):
        for v in self.initial['evidence']['occupational']['sourceResults'].values():self.assertEqual(v['latestCompleteYear'],2024);self.assertEqual(v['metrics']['employment']['observationPeriod'],'2024')
    def test_current_coverage_fails_broad_claims(self):self.assertTrue(all(v['metrics']['employment']['state']=='INSUFFICIENT_EVIDENCE' for v in self.initial['evidence']['occupational']['sourceResults'].values()))
    def test_current_pretrend(self):v=self.initial['evidence']['occupational']['sourceResults']['microsoft']['metrics']['employment'];self.assertAlmostEqual(v['pretrendGapPpPerYear'],-1.18475186189016)
    def test_partial_paths_not_monthly(self):
        p=self.clone();cache=read(p/'occupation-cache.json');d=object_get(p,cache['detail'])
        for v in d['sourceResults'].values():
            for r in v['annualGroupPaths']:
                if r['year'] in [2025,2026]:self.assertTrue(all(x is None for x in r['employmentIndexes'].values()))
    def test_duplicate_alert_suppression(self):
        p=self.clone();e=[{'reason':'FIRST_DESCRIPTIVE_WATCH','source':'academic'}];health={'cps':{'status':'CURRENT'}};a=AL.candidates(p,e,health,RUN);b=AL.candidates(p,e,health,RUN);self.assertEqual(len(a['candidates']),1);self.assertEqual(len(b['candidates']),0)
    def test_health_only_not_economic_change(self):
        p=self.clone();health={'cps':{'status':'FAILED'}};AL.candidates(p,[],{'cps':{'status':'CURRENT'}},RUN);a=AL.candidates(p,[],health,RUN);self.assertEqual(a['candidates'][0]['type'],'DATA_HEALTH_TRANSITION');self.assertEqual(H.manifest(p)['lastEvaluationId'],self.initial['evaluationId'])
    def test_email_disabled(self):self.assertEqual(self.initial['emailDelivery'],'DISABLED');self.assertIn('不是 AI 失业预测',self.initial['bilingualSummary']['ZH'])
    def test_artifact_bound(self):self.assertLess(len(canonical(self.initial)),125000)
    def test_immutable_collision(self):p=self.clone();self.assertRaises(SourceError,put,p/'evaluations'/f"{self.initial['evaluationId']}.json",{},True)
    def test_history_quota(self):
        p=self.clone();m=H.manifest(p);m['evaluations']*=2048;put(p/'history-manifest.json',m);self.assertRaises(SourceError,H.quota,p)
    def test_source_failure_isolation(self):
        p=self.clone();calls=[]
        def fail(url,**kwargs):calls.append(url);raise OSError('independent fetch failure')
        _,status=S.refresh(p,RUN,fail);self.assertTrue(all(x['status']=='FAILED' for x in status['providers'].values()));self.assertTrue(any('National.xlsx' in u for u in calls));self.assertEqual(H.accept(p,read(p/'inputs.json'),RUN)[1],False)
    def test_micro_unchanged_skips_parse(self):
        p=self.clone();i=read(p/'inputs.json');headers={'ETag':'pinned'};i['probes'].update({'micro:2026-07':D.validators({'headers':headers}),'micro:2026-08':D.validators({'headers':headers})})
        def fetch(url,**kwargs):return {'status':404 if 'sep26' in url else 200,'headers':headers,'raw':b''}
        with patch.object(I,'parse_cps',side_effect=AssertionError('Must not reparse')):result=S.micro_refresh(p,i,RUN,fetch)
        self.assertEqual(result['status'],'NO_NEW_OBSERVATION');self.assertFalse(result['changes'])
    def test_layout_newyear_fails_independently(self):
        p=self.clone();i=read(p/'inputs.json');i['microMonths']['2026-12']=i['microMonths']['2026-08'];r=S.micro_refresh(p,i,'2027-02-20T00:00:00Z',lambda *a,**k:{'status':200,'headers':{'ETag':'new'},'raw':b'PK'});self.assertEqual(r['status'],'FAILED');self.assertTrue(any('VERSION_MISMATCH' in x for x in r['failures'].values()))
    def test_no_oews_retries(self):
        p=self.clone();calls=[]
        def fail(url,**kwargs):calls.append(url);raise OSError('failure')
        S.refresh(p,RUN,fail);self.assertFalse(any('oes' in u or 'oews' in u for u in calls))
    def test_source_semantic_hash_reproducible(self):
        changed=copy.deepcopy(self.inputs);changed['probes']={'laterCheck':'changed'};changed['firstRecordedAt']='2026-10-08T00:00:00Z';self.assertEqual(H.input_identity(self.store,self.inputs),H.input_identity(self.store,changed))
    def test_reference_dates_preserved(self):
        r=self.initial['evidence']['officialContext']['ces'][0];self.assertNotEqual(r['observationPeriod'],RUN[:7]);self.assertIsNone(r['officialReleaseDate']);self.assertEqual(r['collectionPeriod'],{'start':None,'end':None})

    def synthetic_new_month(self,period='2026-09'):
        fields={0:(15,1),15:(2,int(period[-2:])),17:(4,int(period[:4])),62:(2,4),70:(5,1),121:(2,23),136:(2,43),146:(2,1),160:(2,2),179:(2,1),217:(2,40),242:(2,38),431:(2,4),497:(2,1),526:(8,100000),602:(10,10000),845:(10,10000),855:(4,6870),859:(4,1007)}
        b=bytearray(b' '*950)
        for start,(width,value) in fields.items():b[start:start+width]=str(value).rjust(width).encode()
        f=io.BytesIO()
        with zipfile.ZipFile(f,'w') as z:z.writestr('synthetic.dat',bytes(b)+b'\n')
        return f.getvalue()
    def micro_fetcher(self,i,raw):
        headers={'ETag':'old'}
        for period in ['2026-07','2026-08']:i['probes']['micro:'+period]=D.validators({'headers':headers})
        def fetch(url,method='GET',**kwargs):
            if url.endswith('.txt'):
                m=read(LABOR/'outcomes/sources/manifest.json');r=next(x for x in m['files'] if x['url']==url);return {'status':200,'headers':{},'raw':gzip.decompress((LABOR/'outcomes/sources/raw'/f"{r['sha256']}.gz").read_bytes())}
            if 'sep26' in url:return {'status':200,'headers':{'ETag':'new'},'raw':b'' if method=='HEAD' else raw}
            return {'status':200,'headers':headers,'raw':b''}
        return fetch
    def test_incremental_one_new_month(self):
        p=self.clone();i=read(p/'inputs.json');fetch=self.micro_fetcher(i,self.synthetic_new_month())
        original=I.parse_cps
        with patch.object(I,'parse_cps',wraps=original) as parser:r=S.micro_refresh(p,i,RUN,fetch)
        self.assertEqual(parser.call_count,1);self.assertEqual(len(i['microMonths']),140);self.assertEqual(r['changes'][0]['reason'],'NEW_OBSERVATION');self.assertNotIn('2025-10',i['microMonths'])
    def test_repeat_month_reuses_valid_identity(self):
        p=self.clone();i=read(p/'inputs.json');fetch=self.micro_fetcher(i,self.synthetic_new_month());S.micro_refresh(p,i,RUN,fetch)
        with patch.object(I,'parse_cps',side_effect=AssertionError('No duplicate ingest')):r=S.micro_refresh(p,i,RUN,fetch)
        self.assertFalse(r['changes'])
    def test_revision_keeps_prior_object(self):
        p=self.clone();i=read(p/'inputs.json');old=i['microMonths']['2026-08'];raw=self.synthetic_new_month('2026-08')
        def fetch(url,method='GET',**kwargs):
            if url.endswith('.txt'):
                m=read(LABOR/'outcomes/sources/manifest.json');r=next(x for x in m['files'] if x['url']==url);return {'status':200,'headers':{},'raw':gzip.decompress((LABOR/'outcomes/sources/raw'/f"{r['sha256']}.gz").read_bytes())}
            return {'status':404 if 'sep26' in url else 200,'headers':{'ETag':'new'},'raw':b'' if method=='HEAD' else raw}
        r=S.micro_refresh(p,i,RUN,fetch);self.assertTrue(any(x['reason']=='REVISION' and x['period']=='2026-08' for x in r['changes']));self.assertNotEqual(old['snapshot'],i['microMonths']['2026-08']['snapshot']);self.assertEqual(S.micro_get(p,'2026-08',old)['period'],'2026-08')
    def bls_response(self,provider,delta=0):
        previous=P1.load_provider(LABOR,provider);series=[]
        for s in previous['series']:
            rows=[]
            for o in s['observations']:
                if o['period']<'2025-01':continue
                value=o['value'];value=None if value is None else value+(delta if s['id']==previous['series'][0]['id'] and o['period']==s['observations'][-1]['period'] else 0)
                rows.append({'year':o['period'][:4],'period':'M'+o['period'][-2:],'periodName':'source month','value':'-' if value is None else str(value),'footnotes':o['footnotes']})
            series.append({'seriesID':s['id'],'data':rows})
        return canonical({'status':'REQUEST_SUCCEEDED','message':[],'Results':{'series':series}})
    def test_recent_aggregate_revision_preserves_history(self):
        p=self.clone();i=read(p/'inputs.json');old=S.provider_get(p,i['providers']['ces']);response=self.bls_response('ces',100)
        r=S.aggregate_refresh(p,i,'ces',RUN,{'officialReleaseDate':None,'eventId':'API_DISCOVERY'},lambda *a,**k:{'raw':response})
        new=S.provider_get(p,i['providers']['ces']);self.assertEqual(new['series'][0]['observations'][0],old['series'][0]['observations'][0]);self.assertEqual(new['series'][0]['observations'][-1]['value'],old['series'][0]['observations'][-1]['value']+100);self.assertEqual(r['changes'][0]['reason'],'REVISION');self.assertEqual(S.validate_receipt(p,i['providers']['ces']),new)
    def test_recent_aggregate_no_new(self):
        p=self.clone();i=read(p/'inputs.json');old=copy.deepcopy(i['providers']['ces']);response=self.bls_response('ces')
        r=S.aggregate_refresh(p,i,'ces',RUN,{'officialReleaseDate':None,'eventId':'API_DISCOVERY'},lambda *a,**k:{'raw':response});self.assertEqual(r['status'],'NO_NEW_OBSERVATION');self.assertEqual(i['providers']['ces'],old)
    def test_withdrawn_history_is_reported(self):
        old=P1.load_provider(LABOR,'ces');new=copy.deepcopy(old);new['series'][0]['observations']=new['series'][0]['observations'][:-1];self.assertEqual(S.observation_changes(old,new)[0]['reason'],'WITHDRAWN')
    def test_recovery_transition_is_candidate(self):
        before=copy.deepcopy(self.initial['evidence']);after=copy.deepcopy(before);a=before['occupational']['sourceResults']['academic']['metrics']['employment'];b=after['occupational']['sourceResults']['academic']['metrics']['employment'];a['state']='PERSISTENT_DESCRIPTIVE_DIVERGENCE';b['state']='NO_CLEAR_DIVERGENCE';r=AL.transitions(before,after);self.assertEqual(r[0]['reason'],'RECOVERY')
    def test_persistence_transition_is_candidate(self):
        before=copy.deepcopy(self.initial['evidence']);after=copy.deepcopy(before);a=before['occupational']['sourceResults']['academic']['metrics']['employment'];b=after['occupational']['sourceResults']['academic']['metrics']['employment'];a['state']='EARLY_DESCRIPTIVE_WATCH';b['state']='PERSISTENT_DESCRIPTIVE_DIVERGENCE';self.assertEqual(AL.transitions(before,after)[0]['reason'],'PERSISTENCE_CROSSED')
    def test_health_stale_last_valid(self):
        v=P1.health('ces',P1.load_provider(LABOR,'ces'),'2027-12-01T00:00:00Z','failure');self.assertEqual(v['status'],'FAILED');self.assertTrue(v['usingLastValid'])
    def test_btos_conditional_not_download_original(self):
        p=self.clone();i=read(p/'inputs.json');i['probes']['btos']={'etag':'abc'};calls=[]
        def fetch(url,**k):calls.append((url,k));return {'status':304,'headers':{},'raw':b''}
        r=S.aggregate_refresh(p,i,'btos',RUN,None,fetch);self.assertEqual(r['status'],'NO_NEW_OBSERVATION');self.assertEqual(len(calls),1);self.assertEqual(calls[0][1]['headers']['If-None-Match'],'abc')
    def test_recorded_receipt_forged_first_seen_rejected(self):
        p=self.clone();m=H.manifest(p);r=H.load_record(p,m['lastEvaluationId']);i=object_get(p,r['acceptedInputObject']);i['firstRecordedAt']='2027-01-01T00:00:00Z';r['acceptedInputObject']=object_put(p,i);put(p/'evaluations'/f"{r['evaluationId']}.json",r);self.assertRaises(SourceError,H.replay,p,RUN)

    def test_recovery_package(self):
        pack=module('monitor_package_test',ROOT/'history/package.py');p=self.clone();dest=p.parent/'recovered';r=pack.prepare(p,dest,True);self.assertTrue(r['applied']);self.assertEqual(H.replay(dest,RUN)['record']['evaluationId'],self.initial['evaluationId'])
    def test_package_cannot_overwrite_immutable(self):
        pack=module('monitor_package_test2',ROOT/'history/package.py');p=self.clone();dest=p.parent/'recovered';pack.prepare(p,dest,True);h=H.manifest(dest)['lastEvaluationId'];(dest/'evaluations'/f'{h}.json').write_text('{}');self.assertRaises(SourceError,pack.prepare,p,dest,True)
    def test_package_rejects_unexpected_raw_zip(self):
        pack=module('monitor_package_test3',ROOT/'history/package.py');p=self.clone();(p/'raw.zip').write_bytes(b'PK');self.assertRaises(SourceError,pack.prepare,p,p.parent/'recovered')
    def test_actual_historical_label(self):
        historical=module('monitor_historical_test',ROOT/'evaluation/historical.py');cache=read(self.store/'occupation-cache.json');r=historical.reconstruction(object_get(self.store,cache['detail']));self.assertEqual(r['mode'],'CURRENT_VINTAGE_RECONSTRUCTION');self.assertFalse(r['realTimeBacktest']);self.assertEqual(len(r['rows']),4)
    def test_frozen_sample_after_new_data(self):
        for k,v in self.initial['evidence']['occupational']['sourceResults'].items():self.assertEqual(v['primarySampleSize'],167 if k=='academic' else 190)
    def test_disabled_workflow_shape(self):
        s=(ROOT.parents[2]/'.github/workflows/ai-labor-monitor.yml').read_text();self.assertIn('AI_LABOR_MONITOR_ENABLED',s);self.assertIn('AI_LABOR_HISTORY_WRITE_ENABLED',s);self.assertNotIn('continue-on-error',s);self.assertNotIn('send-email',s);self.assertIn('timezone: America/Los_Angeles',s)
    def test_production_has_no_monitor_import(self):
        for p in (ROOT.parents[2]/'src').rglob('*'):
            if p.is_file():self.assertNotIn('ai-labor-transition/monitor',p.read_text(errors='replace'))

    def test_actual_run_clock_accepts_after_initialization(self):
        t=tempfile.TemporaryDirectory();self.addCleanup(t.cleanup);p=Path(t.name);v=run(p/'store',p/'out',now());self.assertGreaterEqual(timestamp(v['evaluationDate']),timestamp(v['monitorRunAt']))

    def test_separate_health_incident_can_alert_after_recovery(self):
        p=self.clone();AL.candidates(p,[],{'cps':{'status':'CURRENT'}},RUN);a=AL.candidates(p,[],{'cps':{'status':'FAILED'}},RUN);AL.candidates(p,[],{'cps':{'status':'CURRENT'}},RUN);b=AL.candidates(p,[],{'cps':{'status':'FAILED'}},RUN);self.assertEqual(len(b['candidates']),1);self.assertNotEqual(a['candidates'][0]['candidateId'],b['candidates'][0]['candidateId'])

if __name__=='__main__':unittest.main()
