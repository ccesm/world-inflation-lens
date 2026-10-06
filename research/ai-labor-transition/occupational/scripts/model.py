"""Inspectable mappings, source-specific ranks and conservative occupation attachment."""
from collections import defaultdict, Counter
import math
from common import require, GUARDRAIL, VERSION, canonical, sha256
from adapters import classify_mapping, tabular, unique, ONET

def ranks(values):
    require(values and all(math.isfinite(v) for v in values.values()), 'Invalid rank inputs')
    grouped=defaultdict(list)
    for k,v in values.items():grouped[v].append(k)
    result={};offset=0;n=len(values)
    for value,keys in sorted(grouped.items()):
        rank=offset+(len(keys)+1)/2;percentile=(rank-.5)/n
        for k in sorted(keys):result[k]={'rank':rank,'percentile':percentile,'quintile':min(5,int(percentile*5)+1)}
        offset+=len(keys)
    return result

def quantile_metadata(values):
    rs=ranks(values);cut=[]
    ordered=sorted(values.values());n=len(ordered)
    for q in (.2,.4,.6,.8):cut.append({'percentile':q,'valueAtCeilingOrderStatistic':ordered[max(0,math.ceil(q*n)-1)]})
    return {'populationCount':n,'weighting':'one native source occupation per record; no employment weighting','rankMethod':'ascending midrank for ties','percentileFormula':'(midrank - 0.5) / N','quintileFormula':'min(5, floor(percentile * 5) + 1); tied scores stay together','percentileBinBoundaries':[0,.2,.4,.6,.8,1],'empiricalCutPoints':cut,'tiesMayPreventEqualSizedGroups':True}

def correlation(a,b):
    common=sorted(set(a)&set(b));require(len(common)>=2,'Insufficient comparison overlap')
    ra=ranks({k:a[k] for k in common});rb=ranks({k:b[k] for k in common})
    x=[ra[k]['rank'] for k in common];y=[rb[k]['rank'] for k in common];mx=sum(x)/len(x);my=sum(y)/len(y)
    den=math.sqrt(sum((v-mx)**2 for v in x)*sum((v-my)**2 for v in y))
    return None if den==0 else sum((v-mx)*(w-my) for v,w in zip(x,y))/den

def crosswalk(soc,onet,map_rows,legacy_rows,refs):
    details={r['socCode'] for r in soc if r['hierarchyLevel']=='detailed'};current={r['O*NET-SOC Code'] for r in onet['Occupation Data']}
    require({r['sourceCode'] for r in map_rows}==current,'O*NET map/backbone mismatch')
    soc_titles={r['socCode']:r['title'] for r in soc};onet_titles={r['O*NET-SOC Code']:r['Title'] for r in onet['Occupation Data']}
    same_title=lambda x,y:x.replace('’',"'")==y.replace('’',"'")
    require(all(r['targetCode'] in soc_titles and same_title(soc_titles[r['targetCode']],r['targetTitle']) and onet_titles[r['sourceCode']]==r['sourceTitle'] for r in map_rows),'Mapping title mismatch')
    direct=classify_mapping(map_rows,current,details,'O*NET-SOC 2019','SOC 2018',refs['onet_soc_map'])
    require(set(legacy_rows[0])=={'O*NET-SOC 2010 Code','O*NET-SOC 2010 Title','O*NET-SOC 2019 Code','O*NET-SOC 2019 Title'},'Legacy crosswalk columns/version mismatch')
    edges=[{'sourceCode':r['O*NET-SOC 2010 Code'],'targetCode':r['O*NET-SOC 2019 Code']} for r in legacy_rows]
    legacy=classify_mapping(edges,{r['sourceCode'] for r in edges},current,'O*NET-SOC 2010','O*NET-SOC 2019',refs['onet_legacy'])
    return {'direct':direct,'legacy':legacy,'mappingCounts':{'direct':dict(Counter(r['mappingType'] for r in direct)),'legacy':dict(Counter(r['mappingType'] for r in legacy))},'canonicalDetailsWithoutOnet':sorted(details-{r['targetCode'] for r in direct if r['targetCode']}),'legacyNewTargetsWithoutPredecessor':sorted(current-{r['targetCode'] for r in legacy if r['targetCode']}),'sourceTitleTypographyDifferences':[r for r in map_rows if soc_titles[r['targetCode']]!=r['targetTitle']],'countBasis':'edge counts; an ambiguous component may contain different edge multiplicities; no economic weights'}

def task_links(onet, academic_tasks):
    current={(r['O*NET-SOC Code'],r['Task ID']):r for r in onet['Task Statements']}
    result=[]
    for r in academic_tasks:
        key=(r['O*NET-SOC Code'],str(int(float(r['Task ID']))));new=current.get(key)
        status='ABSENT_FROM_CURRENT_BACKBONE' if new is None else 'EXACT_TEXT_MATCH' if r['Task']==new['Task'] else 'TEXT_CHANGED'
        result.append({'sourceOccupation':key[0],'sourceTaskId':r['Task ID'],'currentTaskId':key[1] if new else None,'status':status,'classificationVintage':'published O*NET 27.1-derived task text; ratings 27.2','noClassificationTransferredToNewText':True})
    return result

def usage_links(native,historical,cw):
    bytext=defaultdict(list)
    for r in historical:bytext[r['Task'].casefold()].append(r)
    legacy=defaultdict(set);direct=defaultdict(set)
    for r in cw['legacy']:
        if r['targetCode']:legacy[r['sourceCode']].add(r['targetCode'])
    for r in cw['direct']:
        if r['targetCode']:direct[r['sourceCode']].add(r['targetCode'])
    result=[]
    for i,r in enumerate(native):
        candidates=bytext[r['task_name'].casefold()];paths=[]
        for c in candidates:
            require(c['O*NET-SOC Code'] in legacy,'Historical task has no verified legacy mapping')
            for onet in sorted(legacy[c['O*NET-SOC Code']]):
                for soc in sorted(direct[onet]):paths.append({'sourceOnetCode':c['O*NET-SOC Code'],'sourceTaskId':c['Task ID'],'targetOnetCode':onet,'targetSocCode':soc})
        # Multiple source tasks or taxonomy splits remain unresolved even if targets converge.
        eligible=len(candidates)==1 and len(paths)==1
        result.append({'usageId':f'anthropic-v1-task-{i:04d}','taskName':r['task_name'],'percentageOfClassifiedConversations':r['pct'],'matchMethod':'exact casefold of published task text; no fuzzy match','status':'UNMAPPED' if not paths else 'UNAMBIGUOUS_CONTEXT_LINK' if eligible else 'AMBIGUOUS_CONTEXT_LINK','paths':paths,'occupationValueAssigned':False,'aggregation':'NONE; no summing/cloning of percentages across occupation candidates'})
    return result

def agreement(academic,microsoft,cw):
    direct=defaultdict(list)
    for r in cw['direct']:
        if r['targetCode']:direct[r['targetCode']].append(r['sourceCode'])
    by={r['O*NET-SOC Code']:r for r in academic}
    # A SOC scalar requires exactly one *official* current O*NET relation, not
    # merely one scored child among several unscored children.
    valid={s:by[codes[0]] for s,codes in direct.items() if len(codes)==1 and codes[0] in by}
    acad_values={s:r['human_rating_beta'] for s,r in valid.items()};ms_values={r['SOC Code']:r['ai_applicability_score'] for r in microsoft}
    overlap=sorted(set(acad_values)&set(ms_values));ar=ranks({r['O*NET-SOC Code']:r['human_rating_beta'] for r in academic});mr=ranks(ms_values)
    rows=[]
    for soc in overlap:
        a=valid[soc];qa=ar[a['O*NET-SOC Code']]['quintile'];qb=mr[soc]['quintile']
        rows.append({'socCode':soc,'humanBeta':acad_values[soc],'microsoftApplicability':ms_values[soc],'academicNativeQuintile':qa,'microsoftNativeQuintile':qb,'comparisonFlag':'METHODOLOGY_DISAGREEMENT' if abs(qa-qb)>=2 else 'NO_LARGE_RANK_BIN_DIFFERENCE','notACausalFinding':True})
    return {'comparison':'GPTs-are-GPTs human beta vs Microsoft platform-derived applicability; different constructs, not interchangeable exposure estimates','occupationCountOverlap':len(overlap),'spearmanOnOverlap':correlation(acad_values,ms_values) if len(overlap)>=2 else None,'withinAcademicHumanVsGPT4':{'nativeOccupationCount':len(academic),'spearmanBeta':correlation({r['O*NET-SOC Code']:r['human_rating_beta'] for r in academic},{r['O*NET-SOC Code']:r['dv_rating_beta'] for r in academic}) if len(academic)>=2 else None,'notIndependentSources':True},'equalNativeQuintileCount':sum(r['academicNativeQuintile']==r['microsoftNativeQuintile'] for r in rows),'bothTopNativeQuintile':[r['socCode'] for r in rows if r['academicNativeQuintile']==r['microsoftNativeQuintile']==5],'bothBottomNativeQuintile':[r['socCode'] for r in rows if r['academicNativeQuintile']==r['microsoftNativeQuintile']==1],'disagreementRule':'native-source quintiles differ by at least 2; descriptive predeclared rule, not source category','disagreementCount':sum(r['comparisonFlag']=='METHODOLOGY_DISAGREEMENT' for r in rows),'exclusions':{'multipleOfficialOnetChildren':sorted(s for s,codes in direct.items() if len(codes)>1)},'rows':rows,'noAggregateScore':True}

def compose(soc,onet,academic,ms,usage,cw,refs):
    detail={r['socCode'] for r in soc if r['hierarchyLevel']=='detailed'};out=[]
    targets=defaultdict(list)
    for r in cw['direct']:
        if r['targetCode']:targets[r['targetCode']].append(r)
    at=defaultdict(list)
    for r in academic:
        rel=[e for e in cw['direct'] if e['sourceCode']==r['O*NET-SOC Code']]
        require(len(rel)==1,'No unique current taxonomy target for academic source code')
        at[rel[0]['targetCode']].append({'source':'gpts_are_gpts','sourceOnetCode':r['O*NET-SOC Code'],'nativeRecordRef':r['O*NET-SOC Code'],'mappingType':rel[0]['mappingType'],'noPooling':True})
    mt={r['SOC Code']:r for r in ms}
    # OEWS reporting aggregates are not all detailed SOC occupations. Preserve
    # native records; exact broad matches stay broad, unmatched hybrids stay unmapped.
    canonical_codes={s['socCode'] for s in soc}
    usages=defaultdict(list)
    for r in usage:
        # References to ambiguous usage remain inspectable in ai-usage-context;
        # no occupation-level value is assigned, even for unique context links.
        if r['status']=='UNAMBIGUOUS_CONTEXT_LINK':usages[r['paths'][0]['targetSocCode']].append(r['usageId'])
    for s in soc:
        code=s['socCode'];d=s['hierarchyLevel']=='detailed';has=bool(at[code]) if d else False
        out.append({**s,'onet':{'version':'31.0','taxonomyVersion':'O*NET-SOC 2019','relations':targets[code] if d else []},'exposureStatus':'AVAILABLE_SOURCE_RECORDS' if has else 'UNAVAILABLE','exposureMeasures':{'gpts_are_gpts':at[code]} if has else {},'augmentationMeasures':{},'automationMeasures':{},'complementarityMeasures':{},'observedUsageMeasures':({'microsoftApplicability':{'sourceNativeRecordRef':code,'construct':'PLATFORM_DERIVED_APPLICABILITY_NOT_USAGE_SHARE'},'anthropicTaskContextRefs':usages[code]} if code in mt else {'anthropicTaskContextRefs':usages[code]} if usages[code] else {}),'missingMeasureMeaning':'Not supplied or not transferable; never zero','provenance':{'taxonomySource':'soc_census','taxonomyRawSha256':refs['soc_census'],'exposureRecordRefsOnly':True}})
    coverage={}
    for name,codes in [('academic',{s for s,rs in at.items() if rs}),('microsoft',set(mt)&detail),('anthropicUniqueContext',{s for s,rs in usages.items() if rs})]:
        coverage[name]={'detailedOccupationCount':len(codes),'canonicalDetailedCount':len(detail),'occupationCountCoverage':len(codes)/len(detail),'missingCodes':sorted(detail-codes),'employmentWeightedCoverage':None,'employmentWeightingReason':'No OEWS vintage accepted in Phase 2; no national worker exposure statistic','ambiguousScalarCodes':sorted(c for c in codes if name=='academic' and len(targets[c])!=1),'sourceValueAggregation':'NONE'}
    coverage['microsoft']['nonDetailedNativeCodes']=sorted(set(mt)&canonical_codes-detail)
    coverage['microsoft']['unmappedNativeCodes']=sorted(set(mt)-canonical_codes)
    coverage['microsoft']['unmappedNativeRecordsRetained']=True
    return out,coverage
