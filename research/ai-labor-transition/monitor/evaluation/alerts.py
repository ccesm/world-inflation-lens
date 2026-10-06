"""Research candidates only; no transport or existing email imports."""
from monitor_common import *

def transitions(before,after):
    rows=[]
    for source,current in after['occupational']['sourceResults'].items():
        old=before.get('occupational',{}).get('sourceResults',{}).get(source,{}) if before else {}
        for metric,v in current['metrics'].items():
            prior=old.get('metrics',{}).get(metric)
            if prior is None:continue
            reason=None
            if prior['state']!=v['state']:reason='PERSISTENCE_CROSSED' if v['state']=='PERSISTENT_DESCRIPTIVE_DIVERGENCE' else 'FIRST_DESCRIPTIVE_WATCH' if v['state']=='EARLY_DESCRIPTIVE_WATCH' else 'RECOVERY' if v['state']=='NO_CLEAR_DIVERGENCE' else 'EVIDENCE_STATE_CHANGED'
            elif v['state']!='INSUFFICIENT_EVIDENCE' and prior['state']!='INSUFFICIENT_EVIDENCE' and v['latestDifference'] is not None and prior['latestDifference'] is not None and abs(abs(v['latestDifference'])-abs(prior['latestDifference']))>=(spec()['thresholds']['hoursGap']/2 if metric=='hours' else spec()['thresholds']['strengthChangePp']):reason='DESCRIPTIVE_MAGNITUDE_CHANGED'
            if reason:rows.append({'source':source,'metric':metric,'reason':reason,'beforeState':prior['state'],'afterState':v['state'],'beforeDifference':prior['latestDifference'],'afterDifference':v['latestDifference'],'persistenceBefore':prior['persistence'],'persistenceAfter':v['persistence'],'observationPeriod':v['observationPeriod']})
        if old and abs(current['employmentCoverage']-old['employmentCoverage'])>=0.05:rows.append({'source':source,'reason':'COVERAGE_CHANGED','before':old['employmentCoverage'],'after':current['employmentCoverage']})
    if before:
        for m,v in after['methodologyAgreement'].items():
            if before['methodologyAgreement'][m]['status']!=v['status']:rows.append({'metric':m,'reason':'METHODOLOGY_AGREEMENT_CHANGED','before':before['methodologyAgreement'][m]['status'],'after':v['status']})
    return rows

def candidates(store,changes,health,run_at):
    path=Path(store)/'alert-ledger.json';ledger=read(path) if path.exists() else {'seen':[],'lastHealth':{}}
    events=[{'type':r['reason'],'details':r} for r in changes]
    for p,v in health.items():
        old=ledger['lastHealth'].get(p);state=v['status']
        if old and old!=state and (state in ['FAILED','STALE','UNAVAILABLE'] or old in ['FAILED','STALE','UNAVAILABLE']):
            ledger['healthTransitionNumber']=ledger.get('healthTransitionNumber',0)+1
            events.append({'type':'DATA_HEALTH_TRANSITION','details':{'provider':p,'before':old,'after':state,'incidentSequence':ledger['healthTransitionNumber']}})
    qualified=[]
    for e in events:
        # Semantic transition key, not run time: repeated candidates never notify.
        key=sha256(canonical(e))
        if key not in ledger['seen']:qualified.append({**e,'candidateId':key,'causality':'NOT_ESTABLISHED','delivery':'DISABLED'});ledger['seen'].append(key)
    require(len(ledger['seen'])<=8192,'Alert ledger limit: archival required')
    ledger['lastHealth']={p:v['status'] for p,v in health.items()};put(path,ledger)
    return {'candidates':qualified,'suppressedDuplicates':len(events)-len(qualified),'emailEnabled':False,'monitorRunAt':run_at}

def bilingual(record,health,changed):
    result=record['result'];period=result['observationThrough']['occupational'];sources=result['occupational']['sourceResults'];a=sources['academic']['metrics'];agreement=result['methodologyAgreement']['employment']['status']
    labels={'employment':('Employment divergence','就业差异'),'hours':('Usual hours','通常工时'),'earnings':('Nominal weekly earnings','名义周收入'),'youngWorkers':('Young-worker composition','年轻劳动者构成')}
    zh={'INSUFFICIENT_EVIDENCE':'证据不足','NO_CLEAR_DIVERGENCE':'未见明确差异','EARLY_DESCRIPTIVE_WATCH':'初步描述性观察','PERSISTENT_DESCRIPTIVE_DIVERGENCE':'持续描述性差异','PRE_EXISTING_TREND':'既有趋势','METHODOLOGY_DEPENDENT':'取决于暴露方法'}
    states='\n'.join(f"{labels[k][0]}: {v['state']} (annual endpoint {v['observationPeriod']})" for k,v in a.items())
    chinese='\n'.join(f"{labels[k][1]}：{zh[v['state']]}（完整年度截至 {v['observationPeriod']}）" for k,v in a.items())
    btos=result['officialContext'].get('btos',[]);use=next((r for r in btos if r['seriesId'].startswith('BTOS_AI_CURRENT')),None);expected=next((r for r in btos if r['seriesId'].startswith('BTOS_AI_EXPECTED')),None)
    ai=f"Observed business use: {use['value']}% ({use['referencePeriod']['end']}); expected use: {expected['value']}% (six-month survey expectation)" if use and expected else 'INSUFFICIENT_EVIDENCE'
    ai_zh=f"企业实际使用：{use['value']}%（{use['referencePeriod']['end']}）；预计使用：{expected['value']}%（未来六个月调查预期）" if use and expected else '证据不足'
    source='; '.join(f"{k}: {v['status']}"+(' (last valid)' if v.get('usingLastValid') else '') for k,v in health.items())
    coverage='; '.join(f"{k}: {v['employmentCoverage']:.1%}" for k,v in sources.items())
    pre='; '.join(f"{k}: {v['metrics']['employment']['pretrendGapPpPerYear']:+.2f} pp/year" for k,v in sources.items())
    return {'EN':f'AI Labor Transition Monitor\nOccupational data through: {period}\nAI adoption: {ai}; separate from occupational exposure\n{states}\nMethodology agreement: {agreement}\nChange: {changed}\nSource health: {source}\nMatched coverage: {coverage}. Employment pretrend gaps: {pre}.\nEvidence limitations: partial coverage, pretrends, survey uncertainty, earnings comparability.\nCausality: NOT ESTABLISHED. Not an AI unemployment forecast. Email delivery disabled.',
            'ZH':f'AI 劳动力转型观察\n职业数据截至：{period}\nAI 使用：{ai_zh}；不等同于职业暴露\n{chinese}\n方法一致性：{agreement}\n本次变化：{changed}\n数据健康：{source}\n匹配覆盖：{coverage}。就业既有趋势差：{pre}。\n证据限制：覆盖不完整、既有趋势、调查不确定性及收入可比性。\n因果关系：尚未确立。不是 AI 失业预测。邮件发送关闭。'}
