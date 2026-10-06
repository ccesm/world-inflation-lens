"""Phase 2 independent intake, pinned semantic reconstruction and offline outputs."""
import gzip
import json
import urllib.request
from pathlib import Path
from collections import Counter, defaultdict
from common import ROOT, VERSION, GUARDRAIL, require, sha256, canonical, now, timestamp, write_atomic, write_immutable, validate_schema
import adapters as a
import model

EXPECTED_VERSIONS={'soc':'SOC 2018 final November 2017','onet':'31.0 / August 2026 / O*NET-SOC 2019','academic':'0471612fef3cc22b74fb884d27bff9dbd3770582','microsoft':'c94a07c52fb1d88ca5d221388f06d10e1bd6d2fe','anthropic':'4e5f69fab13a9c3f7d0dcc31a6f893a9818738f6/release_2025_02_10'}
LICENSES={'soc':'PUBLIC_DOMAIN_US_FEDERAL','onet':'CC-BY-4.0','academic':'MIT','microsoft':'CC-BY-4.0','anthropic':'CC-BY_VERSION_UNSPECIFIED'}

def registry(root):
    r=json.loads((Path(root)/'config/sources.json').read_bytes())
    r['methodologyMetadata']=json.loads((Path(root)/'config/methodologies.json').read_bytes())
    require(r['contractVersion']==VERSION and r['socVersion']=='2018' and r['onetVersion']=='31.0' and r['onetTaxonomy']=='O*NET-SOC 2019','Taxonomy/config version mismatch')
    require({k:v['version'] for k,v in r['providers'].items()}==EXPECTED_VERSIONS,'Unsupported source version')
    for k,v in r['files'].items():
        require(v['provider'] in LICENSES and v['license']==LICENSES[v['provider']],'License not cleared')
        require(v['redistribution'] is True and v['modification'] is True and v['commercialUse'] is True and v['attributionRequired'] is True,'License permissions changed')
        require(len(v['sha256'])==64 and all(c in '0123456789abcdef' for c in v['sha256']),'Invalid pinned SHA')
        require(v['url'].startswith(('https://www.onetcenter.org/','https://www2.census.gov/','https://raw.githubusercontent.com/','https://huggingface.co/')),'Unapproved endpoint')
    return r

def read_raw(root,reg,provider):
    result={}
    for k,v in reg['files'].items():
        if v['provider']!=provider:continue
        b=gzip.decompress((Path(root)/'sources/raw'/f"{v['sha256']}.gz").read_bytes())
        require(sha256(b)==v['sha256'],'Raw identity mismatch: '+k);result[k]=b
    if provider=='academic':require(b'MIT License' in result['gpt_license'],'MIT evidence missing')
    if provider=='microsoft':require(b'CC BY 4.0' in result['ms_license'],'CC attribution evidence missing')
    if provider=='onet':require(b'O*NET' in result['onet_license'] and b'31.0' in result['onet_license'] and b'creativecommons.org/licenses/by/4.0' in result['onet_license'],'O*NET license/version proof missing')
    if provider=='anthropic':require(b'Data released under CC-BY' in result['anthro_readme'] and b'Data released under CC-BY' in result['anthro_root'],'Release-specific data permission missing')
    return result

def parse(root,reg,provider):
    raw=read_raw(root,reg,provider)
    if provider=='soc':return {'hierarchy':a.soc_structure(raw['soc_census'])}
    if provider=='onet':return {'tables':a.onet_bundle(raw['onet_zip']),'mappingRows':a.mapping_rows(raw['onet_soc_map']),'legacyRows':a.tabular(raw['onet_legacy'])}
    if provider=='academic':
        occ,tasks=a.academic(raw['gpt_occ'],raw['gpt_task'],raw['gpt_full']);return {'occupations':occ,'tasks':tasks}
    if provider=='microsoft':
        scores,tables=a.microsoft(raw);return {'occupations':scores,'tables':tables}
    tasks,historical,modes=a.anthropic(raw);return {'tasks':tasks,'historicalTasks':historical,'modes':modes}

def fetch(root,reg,provider,fetcher=None):
    fetcher=fetcher or (lambda url:urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'WorldInflationLens research'}),timeout=60).read(35_000_001))
    receipts={}
    for k,v in reg['files'].items():
        if v['provider']!=provider:continue
        b=fetcher(v['url']);require(len(b)<=35_000_000 and sha256(b)==v['sha256'],'Source version/hash changed: '+k)
        write_immutable(Path(root)/'sources/raw'/f"{v['sha256']}.gz",gzip.compress(b,mtime=0))
        receipts[k]={'url':v['url'],'sha256':v['sha256'],'retrievedAt':now()}
    data=canonical({'provider':provider,'files':receipts,'note':'Retrieval metadata is outside deterministic methodology payload'})
    write_immutable(Path(root)/'sources/receipts'/f'{sha256(data)}.json',data)

def envelope(kind,data,reg,providers):
    return {'contractVersion':VERSION,'scope':'RESEARCH_ONLY','kind':kind,'interpretationGuardrail':GUARDRAIL,'configurationHash':sha256(canonical(reg)),
            'sourceVersions':{p:reg['providers'][p]['version'] for p in providers},'pinnedInputs':{k:{'sha256':v['sha256'],'url':v['url'],'license':v['license']} for k,v in reg['files'].items() if v['provider'] in providers},'data':data}

def build(reg,accepted):
    require('soc' in accepted and 'onet' in accepted,'Canonical backbone unavailable; previous projections preserved')
    soc=accepted['soc']['hierarchy'];onet=accepted['onet']['tables'];refs={k:v['sha256'] for k,v in reg['files'].items()}
    mapping_refs={k:{'sourceId':k,'rawSha256':v['sha256'],'sourceUrl':v['url']} for k,v in reg['files'].items()}
    cw=model.crosswalk(soc,onet,accepted['onet']['mappingRows'],accepted['onet']['legacyRows'],mapping_refs)
    gpt=accepted.get('academic',{'occupations':[],'tasks':[]});ms=accepted.get('microsoft',{'occupations':[],'tables':{}});ant=accepted.get('anthropic',{'tasks':[],'historicalTasks':[],'modes':[]})
    current={r['O*NET-SOC Code'] for r in onet['Occupation Data']}
    require(all(o['O*NET-SOC Code'] in current for o in gpt['occupations']),'Academic taxonomy mismatch; do not migrate implicitly')
    links=model.task_links(onet,gpt['tasks']);usage=model.usage_links(ant['tasks'],ant['historicalTasks'],cw)
    occupations,coverage=model.compose(soc,onet,gpt['occupations'],ms['occupations'],usage,cw,refs)
    percentiles={}
    for field in ['dv_rating_alpha','dv_rating_beta','dv_rating_gamma','human_rating_alpha','human_rating_beta','human_rating_gamma']:
        vals={r['O*NET-SOC Code']:r[field] for r in gpt['occupations']}
        if vals:percentiles[field]={'definition':model.quantile_metadata(vals),'ranks':model.ranks(vals)}
    msvalues={r['SOC Code']:r['ai_applicability_score'] for r in ms['occupations']}
    msp={'definition':model.quantile_metadata(msvalues),'ranks':model.ranks(msvalues)} if msvalues else None
    compare=model.agreement(gpt['occupations'],ms['occupations'],cw) if gpt['occupations'] and ms['occupations'] else {'status':'UNAVAILABLE','reason':'Two accepted methodological inputs required','noAggregateScore':True}
    ratings=defaultdict(list)
    for r in onet['Task Ratings']:
        if r['Scale ID'] in ('IM','RT'):ratings[(r['O*NET-SOC Code'],r['Task ID'])].append(r)
    tasks=[{**r,'ratings':ratings[(r['O*NET-SOC Code'],r['Task ID'])]} for r in onet['Task Statements']]
    artifacts={
      'exposure-methodologies.json':envelope('methodology-metadata',{'frameworks':reg['methodologyMetadata'],'measureFieldsKeptIndependent':True,'noSharedHighExposureDefinition':True},reg,list(reg['providers'])),
      'occupations.json':envelope('occupations',{'records':occupations,'coverage':coverage,'canonicalCounts':dict(Counter(r['hierarchyLevel'] for r in soc)),'allUnscoredOccupationsRetained':True},reg,['soc','onet','academic','microsoft','anthropic']),
      'occupation-crosswalk.json':envelope('crosswalk',cw,reg,['soc','onet']),
      'occupation-tasks.json.gz':envelope('current-tasks',{'databaseVersion':'31.0','taxonomy':'O*NET-SOC 2019','records':tasks,'taskTextUnmodified':True,'taskImportanceNotTimeShare':True,'taskCount':len(tasks),'occupationCountWithTasks':len({r['O*NET-SOC Code'] for r in tasks})},reg,['onet']),
      'occupation-descriptors.json.gz':envelope('current-descriptors',{'tables':{k:v for k,v in onet.items() if k not in ('Task Statements','Task Ratings')},'scaleDefinitions':onet['Scales Reference'],'descriptorTextUnmodified':True},reg,['onet']),
      'exposure-academic.json':envelope('academic-exposure',{'nativeTaxonomy':'O*NET-SOC 2019','taskDatabaseVintage':'27.1 task statements; 27.2 rating references in authors source notebook','records':gpt['occupations'],'aggregation':'sum(task categorical transform * coreweight) / sum(coreweight); Core=2, Supplemental/unspecified=1','transforms':{'alpha':'E1','beta':'E1 + 0.5*E2','gamma':'E1 + E2'},'allSixPublishedMeasuresReconciled':True,'rankGroups':percentiles,'canonicalScalarPooling':'PROHIBITED','auxiliaryAutomationRubric':'T0–T4 preserved in task archive; exploratory numeric mapping T/4, not validated job-substitution probabilities'},reg,['academic']),
      'exposure-academic-tasks.json.gz':envelope('academic-tasks',{'records':gpt['tasks'],'currentBackboneLinks':links,'linkCounts':dict(Counter(r['status'] for r in links)),'historicalTaskTextUnmodified':True,'newTaskLabelsInferred':False},reg,['academic','onet']),
      'ai-applicability-microsoft.json':envelope('platform-applicability',{'nativeTaxonomy':'Publisher describes SOC 2018; actual file also contains OEWS reporting aggregates. Exact broad matches retained; five unmatched hybrids quarantined.','nativeTaxonomyExceptions':coverage['microsoft'],'records':ms['occupations'],'rankGroups':msp,'rankPopulationLimitation':'Native 785-record sample contains mixed reporting levels; canonical overlap comparison excludes non-detailed/hybrid codes','aggregation':'source O*NET relevance/importance IWA weights; normalized by total weight; mean(user completion*scope*coverage, nonphysical AI-side completion*scope*coverage)','coverageGate':'IWA conversation share > 0.0005','nativePeriod':'2024-01-01 through 2024-09-30','geography':'US Bing Copilot sample','notNationalAdoptionOrAutomation':True,'sourceDecompositionReconciled':True},reg,['microsoft']),
      'ai-applicability-microsoft-lineage.json.gz':envelope('platform-applicability-lineage',{'tables':ms['tables'],'noRawConversations':True},reg,['microsoft']),
      'ai-usage-context.json':envelope('observed-usage-context',{'release':'2025-02-10','taxonomy':'source O*NET-SOC 2010 codes verified against official legacy mapping; exact database release unspecified','sample':'privacy-preserving Clio classification of Claude.ai Free/Pro conversations, Claude 3.5 Sonnet; no verified occupation of user','observationWindow':'December 2024 / January 2025; exact dates not supplied in selected release tables','geography':'not geography-restricted in this release; not a US worker sample','weighting':'source conversation shares; not employment/task-time weights','records':usage,'linkCounts':dict(Counter(r['status'] for r in usage)),'interactionModes':ant['modes'],'modeShareSum':sum(r['pct'] for r in ant['modes']),'modeSharesRenormalized':False,'modeLimitation':'Published interaction rows sum below 100%; preserve native values, do not recreate headline percentages or occupation-specific modes','occupationAutomationOrAugmentationRates':None},reg,['anthropic','onet']),
      'ai-usage-historical-tasks.json.gz':envelope('historical-usage-tasks',{'records':ant['historicalTasks'],'taskTextUnmodified':True,'exactDatabaseVersion':None},reg,['anthropic']),
      'exposure-agreement.json':envelope('methodology-comparison',compare,reg,['academic','microsoft','onet'])}
    return artifacts

def save_payload(path,payload):
    b=canonical(payload)
    write_atomic(path,gzip.compress(b,mtime=0) if str(path).endswith('.gz') else b)

def load_payload(path):
    b=Path(path).read_bytes();return json.loads(gzip.decompress(b) if str(path).endswith('.gz') else b)

def validate_outputs(root,output):
    reg=registry(root);accepted={}
    config_bytes=canonical(reg)
    require((Path(root)/'accepted/configurations'/f'{sha256(config_bytes)}.json').read_bytes()==config_bytes,'Pinned configuration archive mismatch')
    for p in reg['providers']:
        pointer=Path(root)/'accepted'/f'{p}.json.gz'
        if not pointer.exists():continue
        d=load_payload(pointer);require(d['version']==reg['providers'][p]['version'] and d['configurationHash']==sha256(canonical(reg)),'Accepted version/config mismatch')
        computed=parse(root,reg,p);require(canonical(d['data'])==canonical(computed),'Accepted semantic/provenance mismatch')
        immutable=Path(root)/'accepted/vintages'/p/(sha256(canonical(d))+'.json.gz')
        require(immutable.exists() and immutable.read_bytes()==pointer.read_bytes(),'Accepted pointer identity mismatch')
        accepted[p]=computed
    schema=json.loads((Path(root)/'schemas/output.schema.json').read_text())
    occupation_schema=json.loads((Path(root)/'schemas/occupation.schema.json').read_text())
    artifacts=build(reg,accepted)
    for name,value in artifacts.items():
        actual=load_payload(Path(output)/name);validate_schema(actual,schema)
        require(canonical(actual)==canonical(value),'Pinned semantic output validation failed: '+name)
        if name=='occupations.json':
            for record in actual['data']['records']:validate_schema(record,occupation_schema)
    manifest={'contractVersion':VERSION,'interpretationGuardrail':GUARDRAIL,'artifacts':{name:sha256(canonical(value)) for name,value in sorted(artifacts.items())},'runtimeExcluded':True}
    require(load_payload(Path(output)/'occupation-output-manifest.json')==manifest,'Output manifest identity mismatch')
    return len(artifacts)

def run(root=ROOT,output=None,action='normalize',providers=None,fetcher=None):
    root=Path(root);output=Path(output) if output else root.parent/'normalized';reg=registry(root);selected=providers or list(reg['providers']);require(set(selected)<=set(reg['providers']) and len(selected)==len(set(selected)),'Unknown/duplicate provider')
    config_bytes=canonical(reg);write_immutable(root/'accepted/configurations'/f'{sha256(config_bytes)}.json',config_bytes)
    status_path=root/'sources/status.json';statuses=json.loads(status_path.read_text())['providers'] if status_path.exists() else {};accepted={}
    for p in selected:
        try:
            if action=='refresh':fetch(root,reg,p,fetcher)
            data=parse(root,reg,p);d={'provider':p,'version':reg['providers'][p]['version'],'configurationHash':sha256(canonical(reg)),'data':data}
            b=canonical(d);raw=gzip.compress(b,mtime=0)
            write_immutable(root/'accepted/vintages'/p/(sha256(b)+'.json.gz'),raw);write_atomic(root/'accepted'/f'{p}.json.gz',raw)
            statuses[p]={'status':'CURRENT','schemaValid':True,'usingLastValid':False,'snapshotHash':sha256(b),'maintenanceType':'FIXED_RESEARCH_VINTAGE','failure':None}
        except Exception as exc:
            pointer=root/'accepted'/f'{p}.json.gz';message=str(exc)
            state='LICENSE_RESTRICTED' if 'license' in message.lower() or 'permission' in message.lower() else 'VERSION_MISMATCH' if 'version' in message.lower() or 'taxonomy' in message.lower() else 'FAILED' if pointer.exists() else 'UNAVAILABLE'
            statuses[p]={'status':state,'schemaValid':pointer.exists(),'usingLastValid':pointer.exists(),'failure':f'{type(exc).__name__}: {exc}','maintenanceType':'FIXED_RESEARCH_VINTAGE'}
    for p in reg['providers']:
        ptr=root/'accepted'/f'{p}.json.gz'
        if ptr.exists():
            d=load_payload(ptr)
            require(d['version']==reg['providers'][p]['version'] and d['configurationHash']==sha256(canonical(reg)),'Last valid version mismatch')
            immutable=root/'accepted/vintages'/p/(sha256(canonical(d))+'.json.gz');require(immutable.exists() and immutable.read_bytes()==ptr.read_bytes(),'Last valid pointer has no immutable identity')
            accepted[p]=d['data']
        elif p not in statuses:statuses[p]={'status':'UNAVAILABLE','usingLastValid':False,'schemaValid':False,'maintenanceType':'FIXED_RESEARCH_VINTAGE','failure':'No accepted input'}
    # Runtime health is separate from deterministic methodology artifacts.
    receipt_files=list((root/'sources/receipts').glob('*.json'))
    for provider,h in statuses.items():
        timestamps=[]
        for receipt in receipt_files:
            for key,entry in json.loads(receipt.read_text()).get('files',{}).items():
                if key in reg['files'] and reg['files'][key]['provider']==provider and entry['sha256']==reg['files'][key]['sha256']:
                    timestamp(entry['retrievedAt']);timestamps.append(entry['retrievedAt'])
        h.update(publisher=reg['providers'][provider]['publisher'],version=reg['providers'][provider]['version'],sourceQuality=reg['providers'][provider]['sourceQuality'],retrievalTimestampRange={'first':min(timestamps) if timestamps else None,'last':max(timestamps) if timestamps else None},sourceReceiptDirectory='occupational/sources/receipts',publicationFrequency='episodic research/database release; not monthly labor data')
    health={'pipelineRunAt':now(),'interpretationGuardrail':GUARDRAIL,'providers':statuses,'supportedStates':['CURRENT','STALE','PARTIAL','FAILED','UNAVAILABLE','LICENSE_RESTRICTED','VERSION_MISMATCH'],'fixedVintageSemantics':'CURRENT means selected reviewed vintage is intact; not current AI capability or monthly freshness; STALE is reserved for an explicit future maintenance policy, not age of research publication','deferredSources':{'ilo':{'status':'VERSION_MISMATCH','reason':'ISCO-08 gradients; verified distributable score file plus SOC mapping not accepted'},'imf':{'status':'UNAVAILABLE','reason':'Complementarity methodology researched; no separately licensed pinned occupational table accepted'},'felten':{'status':'LICENSE_RESTRICTED','reason':'Publisher repository lacks explicit data license; article license alone not applied to repository data'},'stanford':{'status':'LICENSE_RESTRICTED','reason':'Underlying proprietary ADP employment data not cleared; study reuses academic exposure, not independent backbone'},'nber':{'status':'UNAVAILABLE','reason':'Task-based framework reviewed; no additional licensed pinned numeric exposure source accepted'}}}
    write_atomic(status_path,canonical({'providers':statuses,'pipelineRunAt':health['pipelineRunAt']}));write_atomic(output/'exposure-data-health.json',canonical(health))
    if 'soc' in accepted and 'onet' in accepted:
        artifacts=build(reg,accepted)
        coverage=artifacts['occupations.json']['data']['coverage']
        for provider,key in [('academic','academic'),('microsoft','microsoft'),('anthropic','anthropicUniqueContext')]:
            if statuses[provider]['status']=='CURRENT' and coverage[key]['occupationCountCoverage']<1:
                statuses[provider]['status']='PARTIAL'
            statuses[provider]['canonicalCoverage']=coverage[key]
        health['providers']=statuses
        # Health is operational metadata, deliberately excluded from payload identity.
        write_atomic(status_path,canonical({'providers':statuses,'pipelineRunAt':health['pipelineRunAt']}))
        write_atomic(output/'exposure-data-health.json',canonical(health))
        for name,value in artifacts.items():save_payload(output/name,value)
        manifest={'contractVersion':VERSION,'interpretationGuardrail':GUARDRAIL,'artifacts':{name:sha256(canonical(value)) for name,value in sorted(artifacts.items())},'runtimeExcluded':True}
        write_atomic(output/'occupation-output-manifest.json',canonical(manifest))
    return health
