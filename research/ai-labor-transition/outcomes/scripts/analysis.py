"""Predeclared descriptive group estimates; no treatment effect, score or forecast."""
import math
from collections import defaultdict
from outcome_common import require
from intake import blank_cell
MAPS=('ageN','ageWeightInt','educationWeightInt','industryWeightInt','earningsHistogram')

def combine(cells):
    total=blank_cell()
    for c in cells:
        for k,v in c.items():
            if k in MAPS:
                for code,n in v.items():total[k][code]=total[k].get(code,0)+n
            else:total[k]+=v
    return total

def median(hist):
    if not hist:return None
    pairs=sorted((int(v),w) for v,w in hist.items());half=sum(w for _,w in pairs)/2;running=0
    for v,w in pairs:
        running+=w
        if running>=half:return v/100

def estimate(c,months,spec,group=False,full=True):
    limits=spec['minimumSamples'];en=limits['groupPersonMonths'] if group else limits['occupationEmploymentPersonMonths']
    enough=months==12 if full else months>=limits['minimumEligibleMonthsYTD']
    emp=c['weightInt']/10000/months if enough and c['n']>=en else None
    hmin=limits['groupHoursPersonMonths'] if group else limits['occupationHoursPersonMonths']
    emin=limits['groupEarningsPersonMonths'] if group else limits['occupationEarningsPersonMonths']
    hours=c['hoursWeightedInt']/c['hoursWeightInt'] if emp is not None and c['hoursN']>=hmin and c['hoursWeightInt'] else None
    wage=median(c['earningsHistogram']) if emp is not None and c['earningsN']>=emin else None
    ages={b:{'personMonths':c['ageN'].get(b,0),'employment':c['ageWeightInt'].get(b,0)/10000/months if emp is not None and c['ageN'].get(b,0)>=limits['groupAgePersonMonths'] else None,'employmentShare':c['ageWeightInt'].get(b,0)/c['weightInt'] if emp is not None and c['ageN'].get(b,0)>=limits['groupAgePersonMonths'] else None} for b in spec['ageBands']}
    return {'employment':emp,'usualPrimaryJobHours':hours,'nominalWeeklyEarningsMedian':wage,'personMonths':c['n'],'hoursPersonMonths':c['hoursN'],'earningsPersonMonths':c['earningsN'],'monthCount':months,'referenceType':'ANNUAL_12_MONTH' if full else 'PARTIAL_YEAR_AVAILABLE_MONTHS','suppression':{'employment':None if emp is not None else 'INSUFFICIENT_SAMPLE_OR_MONTHS','hours':None if hours is not None else 'INSUFFICIENT_SAMPLE_OR_COVERAGE','earnings':None if wage is not None else 'INSUFFICIENT_ORG_SAMPLE'},'hoursCoverage':c['hoursWeightInt']/c['weightInt'] if c['weightInt'] else None,'ageGroups':ages,'educationShares':{k:v/c['weightInt'] for k,v in c['educationWeightInt'].items()} if c['weightInt'] else {},'nativeIndustryShares':{k:v/c['weightInt'] for k,v in c['industryWeightInt'].items()} if c['weightInt'] else {},'industryComparability':'Native Census industry codes; do not compare different taxonomy versions without another concordance','evidenceQuality':['DESIGN_SE_UNAVAILABLE','ROTATING_PANEL_PERSON_MONTHS']+(['INSUFFICIENT_SAMPLE'] if emp is None else []),'earningsComparability':'LIMITED_COMPARABILITY_2023_2024_PUBLIC_USE_CHANGES'}

def exposure_maps(exposure,crosswalk,details,s):
    direct=defaultdict(set)
    for e in crosswalk['direct']:direct[e['targetCode']].add(e['sourceCode'])
    result={}
    for source,data in exposure.items():
        key=s['exposureInputs'][source]['measure'];groups=s['exposureInputs'][source]['nativeQuantiles']['ranks'];out={}
        for r in data['records']:
            if source=='academic':
                native=r['O*NET-SOC Code'];codes=[c for c,v in direct.items() if v=={native} and c in details]
            else:native=r['SOC Code'];codes=[native] if native in details else []
            require(native in groups,'Missing frozen quantile');rank=groups[native]
            for code in codes:
                require(code not in out,'Duplicate exposure join');out[code]={'nativeCode':native,'value':r[key],'quintile':rank['quintile'],'percentile':rank['percentile']}
        result[source]=out
    return result

def mappings(concordance):
    old={c:r['socCode'] for c,r in concordance['stableBridge'].items()}
    new={r['census2018']:r['socCode'] for r in concordance['stableBridge'].values()}
    require(len(old)==len(new),'Temporal join not bijective')
    return {'Census 2010':old,'Census 2018':new}

def annualize(monthly,cw,s):
    maps=mappings(cw);years=defaultdict(list)
    for m in monthly:years[int(m['period'][:4])].append(m)
    annual=[];stats={};availability={}
    for year,ms in sorted(years.items()):
        periods=sorted(m['period'] for m in ms);require(len(periods)==len(set(periods)),'Duplicate CPS periods')
        full=len(periods)==12;availability[year]={'months':[int(p[-2:]) for p in periods],'fullYear':full}
        native=defaultdict(list);native_months=defaultdict(set)
        for m in ms:
            require(m['taxonomy'] in maps,'CPS taxonomy changed')
            for code,c in m['occupations'].items():native[code].append(c);native_months[code].add(m['period'])
        stats[year]={}
        for code,cells in sorted(native.items()):
            merged=combine(cells);soc=maps[ms[0]['taxonomy']].get(code)
            eligible=soc is not None and len(native_months[code])>=s['minimumSamples']['occupationMonthsRepresented']
            est=estimate(merged,len(ms),s,full=full)
            if not eligible:est['evidenceQuality'].append('TAXONOMY_UNCERTAINTY' if soc is None else 'INSUFFICIENT_MONTH_REPRESENTATION')
            if eligible:stats[year][soc]={'cell':merged,'estimate':est,'nativeCode':code}
            annual.append({'year':year,'censusCode':code,'censusVersion':ms[0]['taxonomy'],'socCode':soc,'primaryTaxonomyEligible':eligible,**est})
    return annual,stats,availability

def log_trend(points):
    require(len(points)>=2 and all(v>0 for _,v in points),'Insufficient valid pretrend points')
    xm=sum(x for x,_ in points)/len(points);ym=sum(math.log(y) for _,y in points)/len(points)
    denominator=sum((x-xm)**2 for x,_ in points);require(denominator>0,'Trend has no time variation')
    slope=sum((x-xm)*(math.log(y)-ym) for x,y in points)/denominator
    return {'slopeLogPerYear':slope,'annualGrowthPct':100*math.expm1(slope),'years':[x for x,_ in points],'fitMeaning':'Descriptive OLS log employment trend; not causal or a forecast'}

def change(v,base):return 100*(v/base-1) if v is not None and base is not None and base>0 else None

def period_comparison(rows,s):
    byyear={r['year']:r for r in rows};complete=sorted(y for y,r in byyear.items() if r['referenceType']=='ANNUAL_12_MONTH' and r['employment'] is not None)
    pre=s['pretrend']['years']
    trend=log_trend([(y,byyear[y]['employment']) for y in pre]) if all(y in complete for y in pre) else None
    latest=max(complete) if complete else None;base=byyear.get(2022);end=byyear.get(latest)
    out={'latestCompleteYear':latest,'pretrend':trend,'pandemicRetained':{str(y):byyear.get(y) for y in [2020,2021]},'transition2022':base,'post2022':None}
    if base and end and latest>2022:
        delta=change(end['employment'],base['employment']);dev=100*math.expm1(math.log(end['employment']/base['employment'])-trend['slopeLogPerYear']*(latest-2022)) if trend and delta is not None else None
        out['post2022']={'endpointYear':latest,'employmentChangePct':delta,'pretrendDeviationPct':dev,'nominalWeeklyEarningsMedianChangePct':change(end['nominalWeeklyEarningsMedian'],base['nominalWeeklyEarningsMedian']),'wageQuality':'LIMITED_COMPARABILITY_PUBLIC_USE_CHANGES_NOT_A_CLEAN_WAGE_EFFECT','usualHoursChange':end['usualPrimaryJobHours']-base['usualPrimaryJobHours'] if end['usualPrimaryJobHours'] is not None and base['usualPrimaryJobHours'] is not None else None,'ageShareChanges':{b:end['ageGroups'][b]['employmentShare']-base['ageGroups'][b]['employmentShare'] if end['ageGroups'][b]['employmentShare'] is not None and base['ageGroups'][b]['employmentShare'] is not None else None for b in s['ageBands']}}
    return out

def evaluate(monthly,cw,exposure,s):
    annual,stats,availability=annualize(monthly,cw,s)
    complete=[y for y,a in availability.items() if a['fullYear'] and y<=2025];maps=mappings(cw);byyear=defaultdict(list)
    for m in monthly:byyear[int(m['period'][:4])].append(m)
    outcomes={};pretrends={};coverage={};samples={};young={};matched={};detail_count=867
    for source,exp in exposure.items():
        structural=sorted(set(exp)&set(maps['Census 2018'].values()))
        balanced=[c for c in structural if all(c in stats[y] and stats[y][c]['estimate']['employment'] is not None for y in complete)]
        require(complete and balanced,'No complete primary occupation panel for '+source)
        samples[source]={'structuralCandidates':structural,'balancedPrimarySocCodes':balanced,'primarySize':len(balanced),'expandedSize':None,'expandedStatus':'DEFERRED_NO_SILENT_ALLOCATION','excludedStructural':{c:'EMPLOYMENT_SAMPLE_OR_MONTHS' for c in structural if c not in balanced},'fixedExposureAssignments':{c:exp[c] for c in balanced}}
        rows=[];cov=[]
        for y in sorted(stats):
            full=availability[y]['fullYear'];months=len(byyear[y]);total=combine(m['totalEmployed'] for m in byyear[y]);denom=total['weightInt'];eligible=[c for c in balanced if c in stats[y]]
            taxonomyweight=sum(c['weightInt'] for m in byyear[y] for code,c in m['occupations'].items() if code in maps[m['taxonomy']])
            exposedweight=sum(c['weightInt'] for m in byyear[y] for code,c in m['occupations'].items() if maps[m['taxonomy']].get(code) in structural)
            includedweight=sum(stats[y][c]['cell']['weightInt'] for c in eligible)
            cov.append({'year':y,'referenceType':'ANNUAL_12_MONTH' if full else 'PARTIAL_YEAR','occupationCountCoverage':len(balanced)/detail_count,'primaryOccupationCount':len(balanced),'employmentWeightedCoverage':includedweight/denom if denom else None,'taxonomyExcludedEmploymentShare':1-taxonomyweight/denom if denom else None,'unmappedExposureEmploymentShare':(taxonomyweight-exposedweight)/denom if denom else None,'suppressedOutcomeEmploymentShare':(exposedweight-includedweight)/denom if denom else None,'missingEmploymentShare':1-includedweight/denom if denom else None,'excludedMissingEmploymentShareMeaning':'Known survey employed weight outside the primary sample, not missing employed persons in the survey population','populationEmployment':denom/10000/months,'denominator':'All CPS civilian noninstitutional employed age 16+; all class-of-worker types','sourcePopulationNotOEWS':True,'evidenceQuality':'LIMITED_COVERAGE' if includedweight/denom<s['materialityPresentationOnly']['minimumEmploymentCoverageForBroadDescription'] else 'STRONG_COVERAGE'})
            for q in range(1,6):
                members=[c for c in eligible if exp[c]['quintile']==q];combined=combine(stats[y][c]['cell'] for c in members)
                row={'year':y,'quintile':q,'referenceMonths':availability[y]['months'],'memberSocCodes':members,**estimate(combined,months,s,group=True,full=full)}
                row['employmentShareOfAllEmployed']=row['employment']/(denom/10000/months) if row['employment'] is not None else None
                rows.append(row)
        for q in range(1,6):
            qrows=[r for r in rows if r['quintile']==q];base={r['year']:r['employment'] for r in qrows}
            for r in qrows:
                r['employmentIndices']={str(b):100*r['employment']/base[b] if r['referenceType']=='ANNUAL_12_MONTH' and r['employment'] is not None and base.get(b) else None for b in s['comparisons']['employmentIndexBases']}
        outcomes[source]=rows;coverage[source]=cov;pretrends[source]={str(q):period_comparison([r for r in rows if r['quintile']==q],s) for q in range(1,6)}
        young[source]=[{'year':r['year'],'quintile':r['quintile'],'referenceType':r['referenceType'],'ageGroups':r['ageGroups'],'ageIsNotSeniority':True} for r in rows]
        # Incomplete years use identical calendar months in 2022, without calling them full annual estimates.
        matched[source]=[]
        for y,a in sorted(availability.items()):
            if a['fullYear'] or y<2023:continue
            selected=a['months'];pairs=[]
            for target in (2022,y):
                ms=[m for m in byyear[target] if int(m['period'][-2:]) in selected]
                if len(ms)!=len(selected):continue
                bysoc=defaultdict(list)
                for m in ms:
                    for code,c in m['occupations'].items():
                        soc=maps[m['taxonomy']].get(code)
                        if soc in balanced:bysoc[soc].append(c)
                pairs.append({'year':target,'months':selected,'groups':{str(q):estimate(combine(c for soc,cells in bysoc.items() if exp[soc]['quintile']==q for c in cells),len(ms),s,group=True,full=False) for q in range(1,6)}})
            if len(pairs)==2:
                matched[source].append({'targetYear':y,'comparisonYear':2022,'months':selected,'referenceType':'IDENTICAL_CALENDAR_MONTHS','estimates':pairs,'employmentChangesPct':{str(q):change(pairs[1]['groups'][str(q)]['employment'],pairs[0]['groups'][str(q)]['employment']) for q in range(1,6)},'limitation':'No extrapolated annual result; 2025 missing October and weighting changes; 2026 revised population controls'})
    return {'annual':annual,'outcomes':outcomes,'pretrends':pretrends,'coverage':coverage,'samples':samples,'young':young,'matchedPartialYears':matched,'completeYears':complete,'availability':availability}

def summary(result,s):
    # The bounded summary references full group tables rather than copying
    # occupation/industry compositions into every period comparison.
    def period_brief(row):
        return None if row is None else {k:row[k] for k in ('year','employment','personMonths','nominalWeeklyEarningsMedian','usualPrimaryJobHours','referenceType','evidenceQuality')}
    sources={};gaps={};labels=[]
    for source,comparisons in result['pretrends'].items():
        low,high=comparisons['1'],comparisons['5'];postl,posth=low['post2022'],high['post2022'];prel,preh=low['pretrend'],high['pretrend']
        pregap=preh['annualGrowthPct']-prel['annualGrowthPct'] if prel and preh else None
        postgap=posth['employmentChangePct']-postl['employmentChangePct'] if posth and postl and posth['employmentChangePct'] is not None and postl['employmentChangePct'] is not None else None
        gaps[source]=postgap
        quality='STRONG_PRETREND_DIFFERENCE' if pregap is not None and abs(pregap)>=s['pretrend']['strongGapPpPerYear'] else 'NO_MATERIAL_PRETREND_GAP' if pregap is not None else 'UNAVAILABLE'
        sourceLabels=[]
        if postgap is None:sourceLabels.append('DATA COVERAGE INSUFFICIENT')
        elif abs(postgap)>=s['materialityPresentationOnly']['employmentCumulativeGapPp']:sourceLabels.append('POST-2022 DIVERGENCE OBSERVED, CAUSALITY NOT ESTABLISHED')
        else:sourceLabels.append('NO CLEAR EXPOSURE-GROUP DIVERGENCE')
        if quality=='STRONG_PRETREND_DIFFERENCE':sourceLabels.append('DIVERGENCE EXISTS BUT PREDATES GENAI')
        latestcov=next((x for x in reversed(result['coverage'][source]) if x['referenceType']=='ANNUAL_12_MONTH'),None)
        if latestcov and latestcov['employmentWeightedCoverage']<s['materialityPresentationOnly']['minimumEmploymentCoverageForBroadDescription']:sourceLabels.append('DATA COVERAGE INSUFFICIENT')
        compact={q:{**c,'pandemicRetained':{y:period_brief(r) for y,r in c['pandemicRetained'].items()},'transition2022':period_brief(c['transition2022'])} for q,c in comparisons.items()}
        partial=[{k:v for k,v in p.items() if k!='estimates'} for p in result['matchedPartialYears'][source]]
        sources[source]={'primarySampleSize':result['samples'][source]['primarySize'],'latestCompleteYear':low['latestCompleteYear'],'q5MinusQ1PretrendGapPpPerYear':pregap,'pretrendStatus':quality,'q5MinusQ1Post2022EmploymentChangeGapPp':postgap,'quintileComparisons':compact,'latestCompleteCoverage':latestcov,'interpretationLabels':sourceLabels,'matchedPartialYears':partial,'detailsArtifact':'exposure-group-outcomes.json'}
        labels+=sourceLabels
    diff=abs(gaps['academic']-gaps['microsoft']) if all(gaps.get(k) is not None for k in ['academic','microsoft']) else None
    dependent=diff is not None and diff>=s['materialityPresentationOnly']['robustnessGapDifferencePp']
    if dependent:labels.append('RESULTS DEPEND STRONGLY ON EXPOSURE METHODOLOGY')
    return {'analysisThrough':max(p for y in result['availability'] for p in [f"{y}-{max(result['availability'][y]['months']):02d}"]),'latestCompleteYear':max(result['completeYears']),'primaryExposureSource':'academic_human_beta','sourceResults':sources,'crossSourceRobustness':{'q5Q1GapDifferencePp':diff,'methodologyDependentPresentationFlag':dependent,'agreementIsNotCausality':True,'noCompositeExposure':True,'sampleAndConstructDifferencesMatter':True},'decisionTreeLabels':sorted(set(labels)),'causality':'NOT_ESTABLISHED','uncertainty':s['uncertainty'],'occupationalHiring':'UNAVAILABLE','occupationalUnemployment':'DEFERRED','phase4Readiness':'CONTINUED_OBSERVATION_AND_SEPARATELY_REVIEWED_CAUSAL_DESIGN_REQUIRED'}
