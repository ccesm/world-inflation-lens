"""Incremental accepted overlay; never edit Phase 1–3 or reparse old raw ZIPs."""
import copy,calendar
from monitor_common import *
from refresh.discovery import *

def initialize(store):
    store=Path(store);baseline();pointer=store/'inputs.json'
    if pointer.exists():return read(pointer)
    state={'providers':{},'microMonths':{},'probes':{},'annualAudits':{},'qualificationBase':spec()['baseCommit'],'firstRecordedAt':now()}
    for p in PROVIDERS:
        data=P1.load_provider(LABOR,p);require(data is not None,'Baseline provider unavailable')
        require(canonical(P1.normalize(LABOR,data['inputManifestHash']))==canonical(data),'Baseline semantic source validation failed')
        state['providers'][p]={'snapshot':object_put(store,data),'baseline':True,'manifest':data['inputManifestHash']}
    # Historical sufficient-statistic bodies are already in the frozen base;
    # store pointers only, never duplicate/reparse 139 original raw archives.
    for row in read(LABOR/'outcomes/accepted/monthly-manifest.json')['files']:state['microMonths'][row['period']]={'snapshot':row['contentHash'],'baseline':True,'rawSha256':row['rawSha256']}
    put(pointer,state);return state

def provider_get(store,pointer):
    value=object_get(store,pointer['snapshot']);validate_dataset(value);return value

def micro_get(store,period,pointer):
    if pointer['baseline']:
        value=read(LABOR/'outcomes/accepted/monthly'/f'{period}.json.gz');require(sha256(canonical(value))==pointer['snapshot'],'Baseline monthly identity changed')
    else:value=object_get(store,pointer['snapshot'])
    require(value['rawSha256']==pointer['rawSha256'] and value['period']==period,'Monthly source binding changed')
    require(value['sourceUrl']==cps_url(period) and value['taxonomy']==('Census 2010' if int(period[:4])<2020 else 'Census 2018') and value['parserVersion']==P3.VERSION and value['license']=='PUBLIC_DOMAIN_US_FEDERAL','Monthly semantic provenance changed')
    P3.validate_statistics(value);return value

def observation_changes(old,new):
    rows=[];before={s['id']:s for s in old['series']}
    for s in new['series']:
        a={o['period']:o for o in before[s['id']]['observations']};b={o['period']:o for o in s['observations']}
        for period in sorted(a.keys()|b.keys()):
            if a.get(period)==b.get(period):continue
            reason='NEW_OBSERVATION' if period not in a else 'WITHDRAWN' if period not in b or b[period]['value'] is None and a[period]['value'] is not None else 'REVISION'
            rows.append({'seriesId':s['id'],'period':period,'reason':reason,'before':a.get(period),'after':b.get(period)})
    return rows

def merge(old,tail,start,manifest):
    new=copy.deepcopy(old);byid={s['id']:s for s in tail['series']}
    for s in new['series']:
        t=byid[s['id']];s['observations']=[o for o in s['observations'] if o['period']<start]+t['observations']
        s['source']=t['source'];periods=[o['period'] for o in s['observations']];s['missingPeriods']=[month_at(i) for i in range(month_index(periods[0]),month_index(periods[-1])+1) if month_at(i) not in periods]
    new['inputManifestHash']=manifest;validate_dataset(new);return new

def aggregate_refresh(store,state,provider,run_at,event,fetcher=http):
    prior=provider_get(store,state['providers'][provider]);overlay=Path(store)/'intake';attempt=now()
    if provider=='btos':
        # Probe current workbook only. Closed wording archive is verified/reused.
        prev=state['probes'].get('btos');headers={'If-None-Match':prev['etag']} if prev and prev.get('etag') else {'If-Modified-Since':prev['last-modified']} if prev and prev.get('last-modified') else {}
        response=fetcher(BTOS_FILES['current'],headers=headers)
        if response['status']==304:return {'status':'NO_NEW_OBSERVATION','changes':[],'usingLastValid':False}
        require(response['status']==200,'BTOS source unavailable');probe=validators(response)
        baseline_manifest=read(LABOR/'sources/manifests'/f"{P1.load_provider(LABOR,'btos')['inputManifestHash']}.json")
        orig=next(e for e in baseline_manifest['files'] if e['role']=='original');raw=gzip.decompress((LABOR/'sources/raw'/f"{orig['rawSha256']}.gz").read_bytes());require(sha256(raw)==orig['rawSha256'],'Original BTOS archive identity changed')
        data={BTOS_FILES['original']:raw,BTOS_FILES['current']:response['raw']}
        h=P1.capture(overlay,provider,fetcher=lambda u,b:data[u],retrieved_at=None if fetcher is official_fetch else run_at);tail=P1.normalize(overlay,h);new=tail
        state['probes']['btos']=probe
    else:
        if event is None:return {'status':'NO_NEW_OBSERVATION','changes':[],'usingLastValid':False}
        year=int(run_at[:4]);audit=bool(event.get('officialReleaseDate')) and timestamp(event['officialReleaseDate']).month==1 and state['annualAudits'].get(provider)!=year
        start=max(2015,year-9 if audit else year-1)
        h=P1.capture(overlay,provider,start,year,fetcher=lambda u,b:fetcher(u,headers={'Content-Type':'application/json','X-Monitor-Body':json.dumps(b)})['raw'],retrieved_at=None if fetcher is official_fetch else run_at)
        tail=P1.normalize(overlay,h);new=merge(prior,tail,f'{start}-01',h)
        if audit:state['annualAudits'][provider]=year
    changes=observation_changes(prior,new);contentChanged=P1.economic_hash(new)!=P1.economic_hash(prior)
    # Retain manifest/source bytes for independent reproduction of accepted overlays.
    if changes or contentChanged:
        receipt={'provider':provider,'priorPointer':copy.deepcopy(state['providers'][provider]),'priorSnapshot':state['providers'][provider]['snapshot'],'snapshot':object_put(store,new),'tailManifest':h,'start':None if provider=='btos' else f'{start}-01','acceptedAt':max(timestamp(now()),timestamp(run_at)).isoformat(),'event':event}
        rid=object_put(store,receipt);state['providers'][provider]={'snapshot':receipt['snapshot'],'baseline':False,'receipt':rid,'manifest':h}
    # Calendar identity is operational. It is never relabeled publication of every observation.
    if event and event.get('officialReleaseDate'):
        state['probes'][provider]={'lastReleaseEventId':event['eventId'],'releasePending':not any(c['reason']=='NEW_OBSERVATION' for c in changes)}
    return {'status':'CURRENT' if contentChanged else 'NO_NEW_OBSERVATION','changes':changes,'economicChanged':contentChanged,'usingLastValid':False,'retrievedAt':run_at,'officialReleaseDate':None,'scheduledReleaseEvent':event,'newSnapshot':state['providers'][provider]['snapshot']}

def official_fetch(url,method='GET',headers=None):
    # Only transport changes; all normalization uses existing validated adapters.
    headers=dict(headers or {});body=headers.pop('X-Monitor-Body',None)
    if body is None:return http(url,method,headers)
    raw=P1.fetch_bytes(url,json.loads(body));return {'status':200,'headers':{},'raw':raw}

def micro_refresh(store,state,run_at,fetcher=http):
    failures={};changes=[];year=int(run_at[:4]);audit=int(run_at[5:7])==1 and state['annualAudits'].get('micro')!=year
    for period in micro_candidates(state['microMonths'],run_at,audit):
        try:
            old=state['microMonths'].get(period);url=cps_url(period);response=fetcher(url,method='HEAD')
            if response['status']==404:
                if old:failures[period]='Previously accepted official file now unavailable; last valid retained, withdrawal not inferred'
                continue
            require(response['status']==200,'Microdata availability probe failed')
            probe=validators(response);key='micro:'+period
            if same_probe(state['probes'].get(key),probe):continue
            # New years/layouts require reviewed qualification; never guess offsets.
            require(old is not None or int(period[:4]) in spec()['discovery']['qualifiedLayoutYears'],'VERSION_MISMATCH: annual record-layout qualification required')
            raw=fetcher(url)['raw'];require(raw[:2]==b'PK','Expected official CPS ZIP')
            rawhash=sha256(raw)
            if old and rawhash==old['rawSha256']:state['probes'][key]=probe;continue
            _,manifest=P3.configuration(LABOR/'outcomes');entry=next(r for r in manifest['files'] if r['kind']=='cps' and r['period'].startswith(period[:4]))
            layout_entry=next(r for r in manifest['files'] if r['name']==entry['layoutName']);lb=gzip.decompress((LABOR/'outcomes/sources/raw'/f"{layout_entry['sha256']}.gz").read_bytes());require(sha256(lb)==layout_entry['sha256'],'Layout pin changed')
            official_layout=fetcher(layout_entry['url']);require(official_layout['status']==200 and sha256(official_layout['raw'])==layout_entry['sha256'],'VERSION_MISMATCH: official layout identity changed/unavailable')
            data=I.parse_cps(raw,period,I.layout(lb));require(data['taxonomy']==entry['taxonomy'],'Taxonomy changed')
            data.update(sourceUrl=url,sourceLayoutUrl=layout_entry['url'],license='PUBLIC_DOMAIN_US_FEDERAL',parserVersion=P3.VERSION);P3.validate_statistics(data)
            pointer={'snapshot':object_put(store,data),'baseline':False,'rawSha256':rawhash,'retrievedAt':now() if fetcher is official_fetch else run_at,'officialReleaseDate':None,'httpFileModified':probe.get('last-modified'),'layoutSha256':layout_entry['sha256']}
            state['microMonths'][period]=pointer;state['probes'][key]=probe
            changes.append({'period':period,'reason':'NEW_OBSERVATION' if old is None else 'REVISION','before':old,'after':pointer})
        except Exception as e:failures[period]=str(e)
    if audit and not failures:state['annualAudits']['micro']=year
    return {'status':'FAILED' if failures else 'CURRENT' if changes else 'NO_NEW_OBSERVATION','changes':changes,'failures':failures,'usingLastValid':bool(failures)}

def refresh(store,run_at,fetcher=official_fetch):
    timestamp(run_at);state=initialize(store);status={};events=[];calendar_error=None
    try:
        backoff=state['probes'].get('calendarBackoffUntil')
        require(not backoff or timestamp(run_at)>=timestamp(backoff),'Calendar discovery in seven-day backoff')
        response=fetcher(CALENDAR);require(response['status']==200,'Official calendar unavailable');events=calendar_events(response['raw'],run_at);state['probes'].pop('calendarBackoffUntil',None)
    except Exception as e:
        calendar_error=str(e)
        if 'backoff' not in str(e):state['probes']['calendarBackoffUntil']=(timestamp(run_at)+timedelta(days=7)).isoformat()
    for provider in PROVIDERS:
        try:
            event=None if provider=='btos' else ({'eventId':'API_DISCOVERY','basis':'OFFICIAL_RECENT_API_CONTENT_DISCOVERY','officialReleaseDate':None,'source':BLS_API} if calendar_error else due(events,provider,state['probes'].get(provider),run_at))
            status[provider]=aggregate_refresh(store,state,provider,run_at,event,fetcher)
        except Exception as e:status[provider]={'status':'FAILED','usingLastValid':True,'changes':[],'failure':str(e)}
    status['cpsMicrodata']=micro_refresh(store,state,run_at,fetcher)
    put(Path(store)/'inputs.json',state)
    return state,{'monitorRunAt':run_at,'providers':status,'calendarDiscoveryFailure':calendar_error,'oews':'DISABLED_BLOCKED_SOURCE_NO_RETRY','emailDelivery':'DISABLED','historyRemoteWrite':'DISABLED_DURING_QUALIFICATION'}

def validate_receipt(store,pointer,seen=None):
    seen=set() if seen is None else seen
    require(pointer['snapshot'] not in seen,'Provider history cycle');seen.add(pointer['snapshot'])
    current=provider_get(store,pointer)
    if pointer['baseline']:
        require(current==P1.load_provider(LABOR,current['provider']),'Baseline provider differs');return current
    r=object_get(store,pointer['receipt']);require(r['snapshot']==pointer['snapshot'] and r['provider']==current['provider'],'Receipt identity mismatch')
    require(r['priorPointer']['snapshot']==r['priorSnapshot'],'Prior receipt identity mismatch');previous=validate_receipt(store,r['priorPointer'],seen);tail=P1.normalize(Path(store)/'intake',r['tailManifest'])
    reconstructed=tail if r['start'] is None else merge(previous,tail,r['start'],r['tailManifest'])
    require(current==reconstructed,'Incremental semantic reconstruction failed');require(max(timestamp(s['source']['retrievedAt']) for s in current['series'])<=timestamp(r['acceptedAt']),'Acceptance predates retrieval')
    return current
