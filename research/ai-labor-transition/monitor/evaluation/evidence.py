"""Fixed, independent descriptive states; no aggregate, attribution or forecasts."""
import math
from collections import defaultdict
from monitor_common import *
from refresh.sources import micro_get,provider_get

def persistence(points,threshold,count=2):
    ordered=sorted(points,key=lambda r:r['year']);streak=0;sign=None;last=None
    for r in ordered:
        value=r.get('value');valid=r.get('qualified',True) and value is not None and abs(value)>=threshold
        direction=1 if valid and value>0 else -1 if valid else None
        if not valid:streak=0;sign=None
        elif direction==sign and last is not None and r['year']==last+1:streak+=1
        else:streak=1;sign=direction
        last=r['year']
    return {'consecutiveCompleteAnnualEndpoints':streak,'required':count,'satisfied':streak>=count,'direction':sign,'notStatisticalSignificance':True}

def state_for(points,threshold,coverage,pretrend=None,comparable=True):
    last=points[-1] if points else None;p=persistence(points,threshold)
    crossed=bool(last and last.get('value') is not None and abs(last['value'])>=threshold)
    if not comparable or coverage is None or coverage<spec()['thresholds']['minimumCoverage'] or last is None or last.get('value') is None:state='INSUFFICIENT_EVIDENCE'
    elif pretrend is not None and abs(pretrend)>=spec()['thresholds']['pretrendGapPpYear']:state='PRE_EXISTING_TREND'
    elif p['satisfied']:state='PERSISTENT_DESCRIPTIVE_DIVERGENCE'
    elif crossed:state='EARLY_DESCRIPTIVE_WATCH'
    else:state='NO_CLEAR_DIVERGENCE'
    return {'state':state,'latestDifference':None if last is None else last.get('value'),'observationPeriod':None if last is None else str(last['year']),'withinSampleThresholdCrossed':crossed,'persistence':p,'coverage':coverage,'pretrendGapPpPerYear':pretrend,'comparable':comparable,'uncertainty':spec()['uncertainty'],'threshold':threshold,'scope':'STRICT_MATCHED_SAMPLE_ONLY'}

def compare_methods(a,b,common=None,metric="employment"):
    av,bv=a['latestDifference'],b['latestDifference'];valid=av is not None and bv is not None and a['comparable'] and b['comparable']
    asym=valid and a['withinSampleThresholdCrossed']!=b['withinSampleThresholdCrossed']
    direction=valid and (av>0)!=(bv>0) and (a['withinSampleThresholdCrossed'] or b['withinSampleThresholdCrossed'])
    magnitude=valid and abs(av-bv)>=(spec()['thresholds']['hoursGap'] if metric=='hours' else spec()['thresholds']['methodGapPp'])
    disagree=bool(asym or direction or magnitude)
    return {'status':'METHODOLOGY_DEPENDENT' if disagree else 'DESCRIPTIVELY_CONSISTENT' if valid else 'INSUFFICIENT_EVIDENCE','gapDifference':abs(av-bv) if valid else None,'adequateCoverageBoth':all(x['coverage'] is not None and x['coverage']>=spec()['thresholds']['minimumCoverage'] for x in [a,b]),'commonSample':common,'agreementDoesNotEstablishCausality':True}

def occupational(store,inputs,common=False):
    base=baseline();s=phase3_spec();cw=read(LABOR/'outcomes/cps-soc-concordance.json')['data'];maps=A.mappings(cw)
    fixed={k:v['fixedExposureAssignments'] for k,v in base['sample'].items()};shared=set(fixed['academic'])&set(fixed['microsoft'])
    if common:fixed={k:{c:v for c,v in m.items() if c in shared} for k,m in fixed.items()}
    rows=[micro_get(store,p,record) for p,record in sorted(inputs['microMonths'].items())]
    _,stats,availability=A.annualize(rows,cw,s);byyear=defaultdict(list)
    for r in rows:byyear[int(r['period'][:4])].append(r)
    output={};t=spec()['thresholds']
    for source,assignments in fixed.items():
        groupRows=[];coverage={}
        for year in sorted(stats):
            months=len(byyear[year]);full=availability[year]['fullYear'];eligible={soc:c for soc,c in stats[year].items() if soc in assignments and c['estimate']['employment'] is not None}
            denom=sum(r['totalEmployed']['weightInt'] for r in byyear[year]);coverage[year]=sum(c['cell']['weightInt'] for c in eligible.values())/denom
            for q in range(1,6):
                est=A.estimate(A.combine(c['cell'] for soc,c in eligible.items() if assignments[soc]['quintile']==q),months,s,group=True,full=full)
                groupRows.append({'year':year,'quintile':q,**{k:est[k] for k in ['employment','usualPrimaryJobHours','nominalWeeklyEarningsMedian','personMonths','ageGroups','referenceType','earningsComparability']},'referenceMonths':availability[year]['months'],'employmentShare':est['employment']/(denom/10000/months) if est['employment'] is not None else None})
        byq={q:{r['year']:r for r in groupRows if r['quintile']==q and r['referenceType']=='ANNUAL_12_MONTH'} for q in range(1,6)}
        complete=sorted(set(byq[1])&set(byq[5]));pre=[]
        for q in [1,5]:
            points=[(y,byq[q][y]['employment']) for y in range(2015,2020) if y in byq[q] and byq[q][y]['employment'] is not None]
            pre.append(A.log_trend(points) if len(points)==5 else None)
        pregap=pre[1]['annualGrowthPct']-pre[0]['annualGrowthPct'] if all(pre) else None
        metrics={k:[] for k in ['employment','hours','earnings','youngWorkers']}
        for year in complete:
            if year<=2022:continue
            lo,hi=byq[1][year],byq[5][year];b1,b5=byq[1].get(2022),byq[5].get(2022)
            def diff(metric,percent=False,age=False):
                vals=[r['ageGroups']['20–24']['employmentShare'] if age else r[metric] for r in [lo,hi,b1,b5]] if b1 and b5 else []
                if len(vals)!=4 or any(v is None for v in vals):return None
                l,h,bl,bh=vals
                return A.change(h,bh)-A.change(l,bl) if percent else (h-bh)-(l-bl)
            metrics['employment'].append({'year':year,'value':diff('employment',True)})
            metrics['hours'].append({'year':year,'value':diff('usualPrimaryJobHours')})
            metrics['earnings'].append({'year':year,'value':diff('nominalWeeklyEarningsMedian',True),'qualified':False})
            y=diff(None,age=True);metrics['youngWorkers'].append({'year':year,'value':100*y if y is not None else None})
        latest=max(complete);cover=coverage[latest];result={}
        for metric,threshold in [('employment',t['employmentGapPp']),('hours',t['hoursGap']),('earnings',t['earningsGapPp']),('youngWorkers',t['youngShareGapPp'])]:
            result[metric]=state_for(metrics[metric],threshold,cover,pregap if metric=='employment' else None,comparable=metric!='earnings')
            result[metric]['historicalEmploymentPretrendContext']={'years':[2015,2019],'gapPpPerYear':pregap,'strongPreExistingDifference':pregap is not None and abs(pregap)>=t['pretrendGapPpYear'],'notMetricSpecificCausalAdjustment':True}
        # Fixed pretrend deviation is kept separate from observed change.
        if metrics['employment'] and all(pre):
            y=metrics['employment'][-1]['year'];dev=[]
            for q,index in [(1,0),(5,1)]:
                v,b=byq[q][y]['employment'],byq[q][2022]['employment'];dev.append(100*math.expm1(math.log(v/b)-pre[index]['slopeLogPerYear']*(y-2022)) if v and b else None)
            result['employment']['postPeriodTrendDeviationGapPp']=dev[1]-dev[0] if all(v is not None for v in dev) else None
        for r in groupRows:
            r['employmentIndexes']={str(b):100*r['employment']/byq[r['quintile']][b]['employment'] if r['referenceType']=='ANNUAL_12_MONTH' and r['employment'] is not None and byq[r['quintile']].get(b,{}).get('employment') else None for b in [2019,2022]}
        output[source]={'metrics':result,'primarySampleSize':len(assignments),'employmentCoverage':cover,'coverageByYear':coverage,'occupationCountCoverage':len(assignments)/867,'observationThrough':max(inputs['microMonths']),'latestCompleteYear':latest,'partialYearStatus':'CONTEXT_ONLY_NOT_PERSISTENCE','annualGroupPaths':groupRows,'pretrends':pre,'metricEndpointPaths':metrics,'sampleIdentity':sha256(canonical(assignments))}
    return {'sourceResults':output,'commonSampleSize':len(shared),'groupMembershipFixed':True,'benchmarkManifestHash':spec()['phase3OutputManifestHash']}

def monthly_context(series):
    observations=series['observations'];last=observations[-1];out={'seriesId':series['id'],'title':series['title'],'observationPeriod':last['period'],'referencePeriod':{'start':last['periodStart'],'end':last['periodEnd']},'collectionPeriod':{'start':last['collectionStart'],'end':last['collectionEnd']},'officialReleaseDate':last['releaseDate'],'retrievedAt':series['source']['retrievedAt'],'value':last['value'],'unit':series['unit'],'frequency':series['frequency'],'ageBand':series['ageBand'],'interpretation':'CONTEXT_ONLY_NO_AI_ATTRIBUTION','derived':[]}
    if series['frequency']=='monthly':
        derived=[P1.derive(series,last['period'],'moving_average',w) for w in [3,6,12]]+[P1.derive(series,last['period'],'change',12)]
        out['derived']=[{**{k:v for k,v in d.items() if k!='inputs'},'operandPeriods':[r['period'] for r in d['inputs']],'operandSource':'ACCEPTED_SOURCE_VINTAGE_SERIES'} for d in derived]
        by={o['period']:o for o in observations};changes=[];i=month_index(last['period'])
        for n in [2,1,0]:
            p=month_at(i-n);a=by.get(p,{}).get('value');b=by.get(month_at(i-n-12),{}).get('value');changes.append(a-b if a is not None and b is not None else None)
        valid=all(v is not None for v in changes);positive=valid and all(v>0 for v in changes);negative=valid and all(v<0 for v in changes)
        out['exactMonthlyDirection']={'state':'INCREASING_OVER_THREE_EXACT_YOY_COMPARISONS' if positive else 'DECREASING_OVER_THREE_EXACT_YOY_COMPARISONS' if negative else 'NO_PERSISTENT_DIRECTION' if valid else 'INSUFFICIENT_EVIDENCE','changes':changes,'notExposureDivergence':True}
    return out

def summarize_occ(detail):
    sources={}
    for k,v in detail['sourceResults'].items():sources[k]={a:b for a,b in v.items() if a not in ['annualGroupPaths','metricEndpointPaths']}
    return {**detail,'sourceResults':sources}

def evaluate(store,inputs,previous=None,force_reconstruction=False):
    microIdentity=sha256(canonical({p:v['snapshot'] for p,v in sorted(inputs['microMonths'].items())}))
    cache=Path(store)/'occupation-cache.json'
    if not force_reconstruction and cache.exists() and read(cache)['microIdentity']==microIdentity and read(cache).get('implementationIdentity')==implementation_identity():
        c=read(cache);detail=object_get(store,c['detail']);common=object_get(store,c['common'])
    else:
        detail=occupational(store,inputs);common=occupational(store,inputs,True);put(cache,{'microIdentity':microIdentity,'implementationIdentity':implementation_identity(),'detail':object_put(store,detail),'common':object_put(store,common)})
    agreements={m:compare_methods(detail['sourceResults']['academic']['metrics'][m],detail['sourceResults']['microsoft']['metrics'][m],compare_methods(common['sourceResults']['academic']['metrics'][m],common['sourceResults']['microsoft']['metrics'][m],metric=m),metric=m) for m in ['employment','hours','earnings','youngWorkers']}
    sources=summarize_occ(detail)
    for m,a in agreements.items():
        if a['status']=='METHODOLOGY_DEPENDENT':
            for v in sources['sourceResults'].values():
                if v['metrics'][m]['state']!='INSUFFICIENT_EVIDENCE':v['metrics'][m]['state']='METHODOLOGY_DEPENDENT'
    context={p:[monthly_context(s) for s in provider_get(store,pointer)['series'] if p!='btos' or s['question']['wordingVersion']=='business_functions'] for p,pointer in inputs['providers'].items()}
    for p,rows in context.items():
        for r in rows:r['sourceVintageId']=inputs['providers'][p]['snapshot']
    return {'scope':'RESEARCH_ONLY','causalityStatus':'DESCRIPTIVE_ONLY','causality':'NOT_ESTABLISHED','interpretationGuardrail':GUARD,'methodologyVersion':spec()['methodologyVersion'],'specificationHash':SPEC_HASH,'implementationVersion':'0.1.0','implementationIdentity':implementation_identity(),'observationThrough':{'occupational':max(inputs['microMonths']),**{p:max(r['referencePeriod']['end'] for r in rows) for p,rows in context.items()}},'occupational':sources,'methodologyAgreement':agreements,'officialContext':context,'limitations':['PARTIAL_OCCUPATIONAL_COVERAGE','DESIGN_SE_UNAVAILABLE','AGE_NOT_SENIORITY','OCCUPATIONAL_HIRING_UNAVAILABLE','EXPOSURE_NOT_CAUSAL_TREATMENT','EARNINGS_DISCLOSURE_BREAK','PANDEMIC_AND_POPULATION_CONTROL_BREAKS','CURRENT_VINTAGE_RECONSTRUCTION_NOT_REALTIME_BACKTEST'],'emailDelivery':'DISABLED','publicPublication':False}
