"""Research-only source isolation, immutable pins and independent analytical reconstruction."""
import json,gzip,urllib.request,datetime,re,calendar
from pathlib import Path
from collections import Counter
from outcome_common import ROOT,VERSION,GUARDRAIL,SPEC_SHA,spec,read,save,sha256,canonical,require,write_immutable,now,validate_schema
import intake,analysis

MONTHS={calendar.month_abbr[i].lower():i for i in range(1,13)}

def configuration(root):
    root=Path(root);s=spec(root);b=(root/'sources/manifest.json').read_bytes();pin=(root/'sources/manifest.sha256').read_text().strip()
    require(sha256(b)==pin,'Source manifest changed without accepted identity')
    require((root/'accepted/source-manifest.json').read_bytes()==b,'Source manifest archive mismatch')
    manifest=json.loads(b);require(manifest['license']=='PUBLIC_DOMAIN_US_FEDERAL' and manifest['scope']=='RESEARCH_ONLY','Source rights/scope mismatch')
    names=[]
    for r in manifest['files']:
        require(r['name'] not in names,'Duplicate source file');names.append(r['name'])
        require(r['url'].startswith('https://www2.census.gov/programs-surveys/') and re.fullmatch('[0-9a-f]{64}',r['sha256']),'Unapproved source identity')
        require(r['bytes']>0 and r['kind'] in ['cps','layout','concordance'],'Invalid input kind')
    return s,manifest

def raw_file(cache,r):
    b=(Path(cache)/r['name']).read_bytes();require(len(b)==r['bytes'] and sha256(b)==r['sha256'],'Pinned raw input changed: '+r['name']);return b

def normalized_exposures(root,s):
    parent=Path(root).parent;loaded={};health={};identities={}
    for source in ['academic','microsoft']:
        r=s['exposureInputs'][source]
        try:
            b=(parent/'normalized'/r['file']).read_bytes();require(sha256(b)==r['sha256'],'Phase 2 exposure identity changed');d=json.loads(b)['data']
            actual=d['rankGroups']['human_rating_beta'] if source=='academic' else d['rankGroups']
            require(actual==r['nativeQuantiles'],'Exposure cut points/assignments changed');loaded[source]=d;identities[source]=r['sha256'];health[source]={'status':'PARTIAL','usingLastValid':False,'reason':'Fixed historical methodology; not current capability; incomplete canonical coverage'}
            write_immutable(Path(root)/'accepted/exposure'/f'{source}-{r["sha256"]}.json.gz',gzip.compress(b,mtime=0))
        except Exception as e:
            prior=Path(root)/'accepted/exposure'/f'{source}-{r["sha256"]}.json.gz'
            if prior.exists():
                pb=gzip.decompress(prior.read_bytes());require(sha256(pb)==r['sha256'],'Last-valid exposure identity mismatch');pd=json.loads(pb)['data'];require((pd['rankGroups']['human_rating_beta'] if source=='academic' else pd['rankGroups'])==r['nativeQuantiles'],'Last-valid exposure quantiles changed');loaded[source]=pd;identities[source]=r['sha256'];health[source]={'status':'FAILED','usingLastValid':True,'reason':str(e)}
            else:health[source]={'status':'UNAVAILABLE','usingLastValid':False,'reason':str(e)}
    required={}
    for key in ['occupations.json','occupation-crosswalk.json']:
        r=s['exposureInputs'][key];b=(parent/'normalized'/key).read_bytes();require(sha256(b)==r['sha256'],'Required Phase 2 taxonomy identity changed');required[key]=json.loads(b)['data'];identities[key]=r['sha256']
    context=None
    try:
        r=s['exposureInputs']['ai-usage-context.json'];b=(parent/'normalized'/r['file']).read_bytes();require(sha256(b)==r['sha256'],'Usage context identity changed');context=json.loads(b)['data'];identities['anthropic']=r['sha256'];health['anthropic']={'status':'PARTIAL','usingLastValid':False,'reason':'Task-use context only; platform sample, no occupational employment explanation'}
    except Exception as e:health['anthropic']={'status':'UNAVAILABLE','usingLastValid':False,'reason':str(e)}
    return loaded,required,context,health,identities

def accept_cps(root,cache):
    root=Path(root);s,m=configuration(root);files={r['name']:r for r in m['files']};status={};selected=[]
    for r in sorted((r for r in m['files'] if r['kind']=='cps'),key=lambda r:r['period']):
        prior=root/'accepted/monthly'/f'{r["period"]}.json.gz'
        try:
            definition=intake.layout(raw_file(cache,files[r['layoutName']]));data=intake.parse_cps(raw_file(cache,r),r['period'],definition)
            require(data['taxonomy']==r['taxonomy'],'Source taxonomy version changed')
            data['sourceUrl']=r['url'];data['sourceLayoutUrl']=files[r['layoutName']]['url'];data['license']='PUBLIC_DOMAIN_US_FEDERAL'
            data['parserVersion']=VERSION;h=sha256(canonical(data));save(root/'accepted/vintages'/f'{h}.json.gz',data,True);save(prior,data);status[r['period']]={'status':'CURRENT','usingLastValid':False,'contentHash':h}
        except Exception as e:
            status[r['period']]={'status':'FAILED' if prior.exists() else 'UNAVAILABLE','usingLastValid':prior.exists(),'reason':str(e)}
        if prior.exists():
            data=read(prior);require(data['rawSha256']==r['sha256'] and data['period']==r['period'],'Last-valid CPS identity mismatch')
            h=sha256(canonical(data));require((root/'accepted/vintages'/f'{h}.json.gz').read_bytes()==prior.read_bytes(),'CPS immutable vintage mismatch');selected.append({'period':r['period'],'contentHash':h,'rawSha256':r['sha256']})
    save(root/'sources/cps-health.json',{'evaluatedAt':now(),'months':status,'sourceFailureIsolated':True})
    save(root/'accepted/monthly-manifest.json',{'files':selected,'parserVersion':VERSION,'sourceManifestHash':sha256(canonical(m))})
    return status

def selected_monthly(root,m):
    manifest=read(Path(root)/'accepted/monthly-manifest.json');require(manifest['parserVersion']==VERSION and manifest['sourceManifestHash']==sha256(canonical(m)),'Monthly selection binding changed')
    source={r['period']:r for r in m['files'] if r['kind']=='cps'};result=[]
    periods=[]
    for r in manifest['files']:
        require(r['period'] not in periods,'Duplicate selected period');periods.append(r['period'])
        data=read(Path(root)/'accepted/monthly'/f'{r["period"]}.json.gz');h=sha256(canonical(data))
        require(h==r['contentHash'] and r['rawSha256']==source[r['period']]['sha256']==data['rawSha256'],'Accepted monthly identity mismatch')
        entry=source[r['period']];layout_entry=next(x for x in m['files'] if x['name']==entry['layoutName']);lb=gzip.decompress((Path(root)/'sources/raw'/f'{layout_entry["sha256"]}.gz').read_bytes());require(sha256(lb)==layout_entry['sha256'],'Dictionary raw identity changed');require(data['layout']==intake.layout(lb),'Accepted layout semantic mismatch');require(data['sourceUrl']==entry['url'] and data['sourceLayoutUrl']==layout_entry['url'] and data['license']=='PUBLIC_DOMAIN_US_FEDERAL' and data['taxonomy']==entry['taxonomy'] and data['period']==r['period'],'Accepted source provenance mismatch')
        require(read(Path(root)/'accepted/vintages'/f'{h}.json.gz')==data,'Missing accepted immutable vintage')
        validate_statistics(data);result.append(data)
    return result

def validate_statistics(m):
    require(m['period'] and m['taxonomy'] in ['Census 2010','Census 2018'],'Monthly identity invalid')
    total=analysis.combine(m['occupations'].values());require(total==m['totalEmployed'],'Monthly total/occupation reconciliation failed')
    require(total['n']==m['employedPersonMonths']>0,'Person-month count mismatch')
    require(m['layout']['weightScale']==10000 and m['layout']['earningsScale']==100,'Weight/unit rule changed')
    for code,c in m['occupations'].items():
        require(re.fullmatch(r'\d{4}',code) is not None,'Invalid native Census occupation code')
        require(c['n']>0 and c['weightInt']>0 and c['weightSquaredInt']>0,'Invalid source sufficient statistics')
        require(sum(c['ageN'].values())==c['n'] and sum(c['ageWeightInt'].values())==c['weightInt'],'Subgroup reconciliation failed')
        require(sum(c['educationWeightInt'].values())==sum(c['industryWeightInt'].values())==c['weightInt'],'Composition reconciliation failed')
        require(sum(c['earningsHistogram'].values())==c['earningsWeightInt'] and 0<=c['hoursN']<=c['n'] and 0<=c['earningsN']<=c['n'],'Metric sample/weight reconciliation failed')

def build(root=ROOT):
    root=Path(root);s,m=configuration(root);ex,required,usage,health,phase2identities=normalized_exposures(root,s)
    rows=selected_monthly(root,m);details={r['socCode'] for r in required['occupations.json']['records'] if r['hierarchyLevel']=='detailed'}
    cr=next(r for r in m['files'] if r['kind']=='concordance');raw=gzip.decompress((root/'sources/raw'/f'{cr["sha256"]}.gz').read_bytes());require(sha256(raw)==cr['sha256'],'Concordance raw identity changed')
    cw=intake.concordance(raw,details);exp=analysis.exposure_maps(ex,required['occupation-crosswalk.json'],details,s);result=analysis.evaluate(rows,cw,exp,s);summ=analysis.summary(result,s)
    macro=root.parent/'normalized/current-summary.json';summ['macroContextReference']={'researchFile':'../normalized/current-summary.json','sha256':sha256(macro.read_bytes()) if macro.exists() else None,'role':'MACRO_CONTEXT_ONLY','noOccupationHiringInference':True,'notMergedIntoExposureOutcomes':True}
    common=sorted(set.intersection(*(set(result['samples'][k]['balancedPrimarySocCodes']) for k in exp))) if len(exp)==2 else []
    commonResult=analysis.summary(analysis.evaluate(rows,cw,{k:{c:v for c,v in e.items() if c in common} for k,e in exp.items()},s),s) if common else None
    context={'status':'AVAILABLE_CONTEXT' if usage else 'UNAVAILABLE','classificationRole':'CONTEXT_ONLY','notEmploymentExplanation':True,'taskLinkCounts':usage['linkCounts'] if usage else None,'sample':usage['sample'] if usage else None,'sourceNativeModeShares':usage['interactionModes'] if usage else None}
    oews_input=root/'accepted/oews.json.gz';require(not oews_input.exists(),'OEWS input not qualified/pinned for this release');oews= {'status':'UNAVAILABLE','vintages':[],'reason':'Official BLS national ZIP/time-series endpoints returned HTTP 403 during source qualification','longitudinalStatus':'NOT_COMPARABLE','use':'Cross-sectional context only; no OEWS employment/wage growth series'}
    if oews_input.exists():require(oews.get('longitudinalStatus')=='NOT_COMPARABLE','OEWS longitudinal safeguard removed')
    binding={'preanalysisSpecHash':SPEC_SHA,'sourceManifestHash':sha256(canonical(m)),'monthlySnapshotHash':sha256(canonical(read(root/'accepted/monthly-manifest.json'))),'phase2Inputs':phase2identities,'concordanceSha256':cr['sha256']}
    def envelope(kind,data):return {'contractVersion':VERSION,'scope':'RESEARCH_ONLY','kind':kind,'causalityStatus':'DESCRIPTIVE_ONLY','interpretationGuardrail':GUARDRAIL,'binding':binding,'data':data}
    bodies={
      'cps-occupation-annual.json.gz':envelope('cps-annual',{'records':result['annual'],'sampleRules':s['minimumSamples'],'universe':s['universes'],'availableYears':result['availability'],'surveyAdjustment':'NOT_SEASONALLY_ADJUSTED_ANNUAL_OR_MATCHED_MONTH_AVERAGE','countsArePersonMonthsNotUniqueWorkers':True,'uncertainty':s['uncertainty']}),
      'cps-soc-concordance.json':envelope('concordance',cw),
      'oews-occupation-vintages.json':envelope('oews',oews),
      'exposure-group-outcomes.json':envelope('groups',{'sourceSpecificResults':result['outcomes'],'sample':result['samples'],'coverage':result['coverage'],'matchedPartialYears':result['matchedPartialYears'],'employmentIndicesAreNotGrowthRates':True}),
      'pretrend-analysis.json':envelope('pretrends',{'sourceSpecificResults':result['pretrends'],'method':s['pretrend'],'pretrendRequired':True}),
      'young-worker-by-exposure.json':envelope('young-workers',{'sourceSpecificResults':result['young'],'ageIsNotSeniority':True,'careerLadderCompression':'NOT_ESTABLISHED','trueOccupationalHiring':'UNAVAILABLE'}),
      'cross-source-robustness.json':envelope('robustness',{'fullSourceSamples':summ['crossSourceRobustness'],'commonSampleSize':len(common),'commonSocCodes':common,'commonSampleResults':commonResult,'sourceMeasuresNotAveraged':True,'anthropicContext':context}),
      'current-research-summary.json':envelope('summary',summ)}
    for k,v in bodies.items():validate_guardrail(v)
    health.update(cps={'status':'PARTIAL' if any(not a['fullYear'] for a in result['availability'].values()) else 'CURRENT','reason':'2025 lacks October; 2026 incomplete; population-control breaks; no design SE','observationThrough':summ['analysisThrough']},cpsConcordance={'status':'PARTIAL','reason':'Only conservative exact detailed stable bijections enter primary sample; other expressions retained'},oews={'status':'UNAVAILABLE' if not oews_input.exists() else 'NOT_COMPARABLE','reason':oews.get('reason','Cross sections only')})
    return bodies,health

def validate_guardrail(value):
    validate_schema(value,read(ROOT/'schemas/artifact.schema.json'))
    require(value.get('contractVersion')==VERSION and value.get('scope')=='RESEARCH_ONLY','Invalid research envelope')
    require(value.get('causalityStatus')=='DESCRIPTIVE_ONLY' and value.get('interpretationGuardrail')==GUARDRAIL,'Causality guardrail missing/changed')
    require(value.get('binding',{}).get('preanalysisSpecHash')==SPEC_SHA,'Artifact specification binding changed')

def normalize(root=ROOT):
    bodies,health=build(root)
    for name,v in bodies.items():save(Path(root)/name,v)
    manifest={'artifacts':{name:sha256(canonical(v)) for name,v in sorted(bodies.items())},'preanalysisSpecHash':SPEC_SHA,'runtimeExcluded':True}
    save(Path(root)/'output-manifest.json',manifest)
    cp=Path(root)/'sources/cps-health.json'
    if cp.exists():
        mh=read(cp)['months'];health['cps']['monthIntakeStates']=dict(Counter(x['status'] for x in mh.values()));health['cps']['usingLastValidMonths']=[k for k,v in mh.items() if v['usingLastValid']]
        if any(v['status']=='FAILED' for v in mh.values()):health['cps']['status']='FAILED'
    rp=Path(root)/'sources/last-refresh.json'
    if rp.exists():health['cps']['lastRefreshFailedFiles']=read(rp)['failures']
    save(Path(root)/'outcome-data-health.json',{'preanalysisSpecHash':SPEC_SHA,'evaluatedAt':now(),'scope':'RESEARCH_ONLY','causalityStatus':'DESCRIPTIVE_ONLY','interpretationGuardrail':GUARDRAIL,'providers':health,'supportedStates':['CURRENT','STALE','PARTIAL','FAILED','UNAVAILABLE','VERSION_MISMATCH','INSUFFICIENT_SAMPLE','NOT_COMPARABLE','LICENSE_RESTRICTED'],'economicSourceFailureIsolated':True})
    return manifest

def validate(root=ROOT,raw_cache=None):
    bodies,_=build(root)
    for name,v in bodies.items():
        actual=read(Path(root)/name);validate_guardrail(actual);require(canonical(actual)==canonical(v),'Independent analytical reconstruction mismatch: '+name)
    expected={'artifacts':{name:sha256(canonical(v)) for name,v in sorted(bodies.items())},'preanalysisSpecHash':SPEC_SHA,'runtimeExcluded':True}
    require(read(Path(root)/'output-manifest.json')==expected,'Analytical output hash mismatch')
    if raw_cache:
        s,m=configuration(root);files={r['name']:r for r in m['files']}
        for r in m['files']:
            if r['kind']!='cps':continue
            if not (Path(root)/'accepted/monthly'/f'{r["period"]}.json.gz').exists():continue
            d=intake.parse_cps(raw_file(raw_cache,r),r['period'],intake.layout(raw_file(raw_cache,files[r['layoutName']])))
            d.update(sourceUrl=r['url'],sourceLayoutUrl=files[r['layoutName']]['url'],license='PUBLIC_DOMAIN_US_FEDERAL',parserVersion=VERSION)
            require(canonical(d)==canonical(read(Path(root)/'accepted/monthly'/f'{r["period"]}.json.gz')),'Independent raw CPS reconstruction failed')
    return {'validatedArtifacts':len(bodies),'rawReconstructionPerformed':raw_cache is not None,'artifactMapSha256':sha256(canonical(expected['artifacts']))}

def refresh(root,cache,fetcher=None):
    root=Path(root);s,m=configuration(root);cache=Path(cache);cache.mkdir(parents=True,exist_ok=True);failures={};receipts={}
    fetcher=fetcher or (lambda url:urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'WorldInflationLens research'}),timeout=90).read())
    for r in m['files']:
        try:
            b=fetcher(r['url']);require(sha256(b)==r['sha256'] and len(b)==r['bytes'],'Source vintage changed; review required');write_immutable(cache/r['name'],b);receipts[r['name']]={'sha256':r['sha256'],'url':r['url'],'retrievedAt':now()}
        except Exception as exc:failures[r['name']]=str(exc)
    # A changed remote vintage cannot overwrite pinned local or last-valid normalized inputs.
    save(root/'sources/last-refresh.json',{'evaluatedAt':now(),'failures':failures,'receipts':receipts,'usingPinnedLastValidWhereAvailable':True})
    accept_cps(root,cache);normalize(root)
    return failures
