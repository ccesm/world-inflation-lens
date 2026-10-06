"""Immutable compact recorded history, with an explicit acceptance clock."""
from monitor_common import *
from refresh.sources import provider_get,micro_get,validate_receipt
from evaluation.evidence import evaluate

def input_identity(store,inputs):
    sourceIds={p:v['snapshot'] for p,v in sorted(inputs['providers'].items())}
    economic={p:P1.economic_hash(provider_get(store,v)) for p,v in sorted(inputs['providers'].items())}
    months={}
    for p,r in sorted(inputs['microMonths'].items()):
        v=micro_get(store,p,r);months[p]=sha256(canonical({k:v[k] for k in ['period','taxonomy','occupations','totalEmployed','layout']}))
    return {'sourceVintageIds':sourceIds,'microSourceVintageIds':{p:v['snapshot'] for p,v in sorted(inputs['microMonths'].items())},'inputSnapshotId':sha256(canonical({'aggregate':economic,'micro':months,'specificationHash':SPEC_HASH,'implementationIdentity':implementation_identity()}))}

def manifest(store):
    p=Path(store)/'history-manifest.json';return read(p) if p.exists() else {'schemaVersion':'ai-labor-monitor-history-v1','evaluations':[],'lastEvaluationId':None}

def quota(store):
    s=spec()['retention'];require(len(manifest(store)['evaluations'])<s['maxEvaluations'],'History limit: reviewed archival required')
    require(sum(p.stat().st_size for p in Path(store).rglob('*') if p.is_file())<s['maxStoreBytes'],'Storage quota: reviewed archival required')

def load_record(store,identity):
    r=read(Path(store)/'evaluations'/f'{identity}.json');require(r['evaluationId']==identity,'Evaluation identity false')
    require(sha256(canonical(r['result']))==r['resultHash']==identity,'Result hash mismatch')
    require(r['specificationHash']==SPEC_HASH and r['methodologyVersion']==spec()['methodologyVersion'],'Rule binding mismatch');timestamp(r['evaluationDate']);return r

def accept(store,inputs,run_at):
    timestamp(run_at);require(timestamp(run_at)>=timestamp(inputs['firstRecordedAt']),'Acceptance before project first-seen');quota(store);m=manifest(store);ids=input_identity(store,inputs)
    if m['lastEvaluationId']:
        prior=load_record(store,m['lastEvaluationId'])
        require(timestamp(run_at)>=timestamp(prior['evaluationDate']),'Acceptance clock moved backwards')
        if prior['inputSnapshotId']==ids['inputSnapshotId']:return prior,False
    for p,v in inputs['providers'].items():
        dataset=validate_receipt(store,v)
        require(all(timestamp(s['source']['retrievedAt'])<=timestamp(run_at) for s in dataset['series']),'Future provider snapshot')
    for p,r in inputs['microMonths'].items():
        require(month_bounds(p)[1]<=run_at[:10],'Future micro observation');require(not r.get('retrievedAt') or timestamp(r['retrievedAt'])<=timestamp(run_at),'Future micro retrieval')
    result=evaluate(store,inputs);h=sha256(canonical(result));inputRef=object_put(store,inputs)
    record={'evaluationId':h,'inputSnapshotId':ids['inputSnapshotId'],'sourceVintageIds':ids['sourceVintageIds'],'microSourceVintageManifest':sha256(canonical(ids['microSourceVintageIds'])),'methodologyVersion':spec()['methodologyVersion'],'specificationHash':SPEC_HASH,'evaluationDate':run_at,'observationThrough':result['observationThrough'],'resultHash':h,'previousEvaluationId':m['lastEvaluationId'],'acceptedInputObject':inputRef,'mode':'CURRENT_SNAPSHOT','result':result}
    # A rerun with identical economic inputs reuses the earlier immutable record.
    path=Path(store)/'evaluations'/f'{h}.json'
    if path.exists():
        old=load_record(store,h);require(old['inputSnapshotId']==record['inputSnapshotId'],'Identity collision');return old,False
    put(path,record,True);m['evaluations'].append({'evaluationId':h,'evaluationDate':run_at,'inputSnapshotId':ids['inputSnapshotId'],'previousEvaluationId':m['lastEvaluationId']});m['lastEvaluationId']=h;put(Path(store)/'history-manifest.json',m)
    return record,True

def replay(store,as_of):
    cutoff=timestamp(as_of);eligible=[r for r in manifest(store)['evaluations'] if timestamp(r['evaluationDate'])<=cutoff]
    require(eligible,'RECORDED_REPLAY_UNAVAILABLE: no accepted project evaluation by cutoff')
    entry=eligible[-1];r=load_record(store,entry['evaluationId']);require(r['result']['implementationIdentity']==implementation_identity(),'RECORDED_REPLAY_UNSUPPORTED_IMPLEMENTATION: checkout matching qualified code');require(entry['evaluationDate']==r['evaluationDate'] and entry['inputSnapshotId']==r['inputSnapshotId'],'Acceptance receipt mismatch')
    inputs=object_get(store,r['acceptedInputObject']);require(timestamp(inputs['firstRecordedAt'])<=timestamp(r['evaluationDate']),'Replay before first-seen');ids=input_identity(store,inputs);require(ids['inputSnapshotId']==r['inputSnapshotId'] and ids['sourceVintageIds']==r['sourceVintageIds'],'Recorded input identity changed')
    for p,v in inputs['providers'].items():
        data=validate_receipt(store,v);require(all(timestamp(s['source']['retrievedAt'])<=timestamp(r['evaluationDate'])<=cutoff for s in data['series']),'Replay uses future retrieval')
    for p,v in inputs['microMonths'].items():require(month_bounds(p)[1]<=r['evaluationDate'][:10] and (not v.get('retrievedAt') or timestamp(v['retrievedAt'])<=timestamp(r['evaluationDate'])),'Replay micro chronology invalid')
    require(canonical(evaluate(store,inputs,force_reconstruction=True))==canonical(r['result']),'Recorded replay semantic mismatch')
    return {'mode':'RECORDED_HISTORICAL_REPLAY','publisherVintageReplay':False,'asOf':as_of,'record':r}
