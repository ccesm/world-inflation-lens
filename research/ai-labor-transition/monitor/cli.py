#!/usr/bin/env python3
"""Explicit research-only dry runs. Never edits accepted Phase 1–3 files."""
import argparse,time,os
from monitor_common import *
from refresh.sources import initialize,refresh,provider_get
from history.store import accept,manifest,load_record,replay,input_identity
from evaluation.alerts import transitions,candidates,bilingual

def run(store,out,run_at,live=False,fetcher=None):
    start=time.perf_counter();store=Path(store);out=Path(out);timestamp(run_at);previous_manifest=manifest(store);before=load_record(store,previous_manifest['lastEvaluationId']) if previous_manifest['lastEvaluationId'] else None
    if live:
        kwargs={} if fetcher is None else {'fetcher':fetcher};inputs,status=refresh(store,run_at,**kwargs)
    else:
        inputs=initialize(store);status={'monitorRunAt':run_at,'mode':'OFFLINE_NO_NETWORK','providers':{p:{'status':'NO_NEW_OBSERVATION','usingLastValid':False,'changes':[]} for p in PROVIDERS},'emailDelivery':'DISABLED'}
    health={p:P1.health(p,provider_get(store,v),run_at,status['providers'][p].get('failure')) for p,v in inputs['providers'].items()}
    if 'cpsMicrodata' in status['providers']:health['cpsMicrodata']={'status':status['providers']['cpsMicrodata']['status'],'usingLastValid':status['providers']['cpsMicrodata']['usingLastValid']}
    # Operational source failures/clock-only health changes cannot change evidence.
    accepted_at=max(timestamp(now()),timestamp(run_at)).isoformat().replace('+00:00','Z')
    record,new=accept(store,inputs,accepted_at);changes=transitions(before['result'] if before else None,record['result']) if new else []
    label='NEW_QUALIFIED_EVALUATION' if new else 'NO_ECONOMIC_CHANGE'
    alerts=candidates(store,changes,health,run_at)
    current={'schemaVersion':'ai-labor-monitor-current-v1','scope':'RESEARCH_ONLY','evaluationId':record['evaluationId'],'inputSnapshotId':record['inputSnapshotId'],'specificationHash':SPEC_HASH,'evaluationDate':record['evaluationDate'],'monitorRunAt':run_at,'economicChange':label,'isNewEconomicEvaluation':new,'evidence':record['result'],'dataHealth':health,'emailDelivery':'DISABLED','historyWrites':'LOCAL_QUALIFICATION_ONLY','bilingualSummary':bilingual(record,health,label)}
    validate_schema(current,read(ROOT/'schemas/current.schema.json'))
    require(current['evidence']['causalityStatus']=='DESCRIPTIVE_ONLY','Causality guard missing')
    put(out/'current-monitor.json',current);put(out/'monitor-history-manifest.json',manifest(store));put(out/'source-refresh-status.json',status);put(out/'evidence-transitions.json',{'evaluationId':record['evaluationId'],'economicChange':label,'transitions':changes,'newOrRevisedObservations':{p:v.get('changes',[]) for p,v in status['providers'].items()},'causalityStatus':'DESCRIPTIVE_ONLY'});put(out/'alert-candidates.json',alerts)
    qualification={'specificationHash':SPEC_HASH,'resultHash':record['resultHash'],'runtimeSeconds':round(time.perf_counter()-start,3),'genuineScheduledExecution':os.environ.get('GITHUB_EVENT_NAME')=='schedule','emailDelivery':'DISABLED','remoteHistoryWrite':'DISABLED_DURING_FEATURE_QUALIFICATION','newEconomicEvaluation':new,'sourceFailures':[p for p,v in status['providers'].items() if v['status']=='FAILED'],'noEconomicChangeOnRetrievalOnly':True}
    put(out/'monitor-qualification.json',qualification)
    return current

def main():
    p=argparse.ArgumentParser(description='Research monitor; no email, deployment or remote writes')
    p.add_argument('action',choices=['dry-run','refresh','replay','validate']);p.add_argument('--store',type=Path,default=ROOT/'work/store');p.add_argument('--output',type=Path,default=ROOT/'work/output');p.add_argument('--run-at',default=None);p.add_argument('--as-of');args=p.parse_args()
    if args.action=='replay':require(args.as_of,'--as-of required');result=replay(args.store,args.as_of);print(json.dumps({'mode':result['mode'],'evaluationId':result['record']['evaluationId']}));return
    if args.action=='validate':
        m=manifest(args.store);require(m['lastEvaluationId'],'No accepted evaluation');r=load_record(args.store,m['lastEvaluationId']);replay(args.store,r['evaluationDate']);current=read(args.output/'current-monitor.json');require(current['evidence']==r['result'] and current['evaluationId']==r['evaluationId'] and current['inputSnapshotId']==r['inputSnapshotId'] and current['evaluationDate']==r['evaluationDate'],'Current view differs from accepted interpretation');validate_schema(current,read(ROOT/'schemas/current.schema.json'));print('PASS: recorded identity, semantic reconstruction and current view');return
    v=run(args.store,args.output,args.run_at or now(),args.action=='refresh');print(json.dumps({'economicChange':v['economicChange'],'evaluationId':v['evaluationId'],'emailDelivery':'DISABLED'}))
    summary=os.environ.get('GITHUB_STEP_SUMMARY')
    if summary:Path(summary).open('a').write(v['bilingualSummary']['EN']+'\n\n'+v['bilingualSummary']['ZH']+'\n')
if __name__=='__main__':
    try:main()
    except Exception as e:
        print(f'Monitor failed closed: {type(e).__name__}: {e}',file=sys.stderr)
        summary=os.environ.get('GITHUB_STEP_SUMMARY')
        if summary:Path(summary).open('a').write('AI labor monitor: FAILED; last valid interpretation retained. Economic workflows unaffected. Email disabled.\n')
        sys.exit(1)
