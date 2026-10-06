"""Official structured release calendar and HTTP file identity probes."""
import re,urllib.request,urllib.error,email.utils
from datetime import datetime,timezone,timedelta
from zoneinfo import ZoneInfo
from monitor_common import *
CALENDAR='https://www.bls.gov/schedule/news_release/bls.ics'
CPS_BASE='https://www2.census.gov/programs-surveys/cps/datasets/'

def http(url,method='GET',headers=None):
    require(url==CALENDAR or url.startswith((CPS_BASE,'https://api.bls.gov/publicAPI/','https://www.census.gov/hfp/btos/downloads/')),'Unapproved monitor endpoint')
    request=urllib.request.Request(url,method=method,headers={'User-Agent':'WorldInflationLens research monitor',**(headers or {})})
    try:
        with urllib.request.urlopen(request,timeout=60) as r:
            raw=b'' if method=='HEAD' else r.read(60_000_001)
            require(len(raw)<=60_000_000,'Source oversized')
            return {'status':r.status,'headers':dict(r.headers.items()),'raw':raw}
    except urllib.error.HTTPError as e:
        if e.code in (304,404):return {'status':e.code,'headers':dict(e.headers.items()),'raw':b''}
        raise

def calendar_events(raw,run_at):
    text=raw.decode('utf-8');text=re.sub(r'\r?\n[ \t]','',text)
    require('BEGIN:VCALENDAR' in text and 'END:VCALENDAR' in text,'Calendar schema changed')
    result=[]
    for block in re.findall(r'BEGIN:VEVENT\s*(.*?)END:VEVENT',text,re.S):
        fields={}
        for line in block.splitlines():
            if ':' in line:k,v=line.split(':',1);fields[k.strip()]=v.strip()
        title=fields.get('SUMMARY','')
        provider='jolts' if title.startswith('Job Openings and Labor Turnover') and 'State' not in title else 'employment' if title.startswith('Employment Situation') else None
        if not provider:continue
        starts=[(k,v) for k,v in fields.items() if k.startswith('DTSTART')];require(len(starts)==1,'Calendar start invalid')
        k,v=starts[0];require(re.fullmatch(r'\d{8}T\d{6}Z?',v),'Exact calendar timestamp required')
        dt=datetime.strptime(v.rstrip('Z'),'%Y%m%dT%H%M%S')
        if v.endswith('Z'):dt=dt.replace(tzinfo=timezone.utc)
        else:
            match=re.search(r'TZID=([^;:]+)',k);require(match is not None,'Calendar timezone absent');dt=dt.replace(tzinfo=ZoneInfo(match[1]))
        release=dt.astimezone(timezone.utc).isoformat().replace('+00:00','Z')
        require(fields.get('UID'),'Calendar evidence identity missing')
        if timestamp(release)<=timestamp(run_at):result.append({'provider':provider,'officialReleaseDate':release,'eventId':fields['UID'],'title':title,'calendarHash':sha256(raw),'source':CALENDAR,'basis':'SCHEDULED_RELEASE_NOT_PROOF_OF_DATA_AVAILABILITY'})
    require(result,'No usable official release events')
    return sorted(result,key=lambda x:x['officialReleaseDate'])

def due(events,provider,prior,run_at):
    kind='jolts' if provider=='jolts' else 'employment';candidates=[e for e in events if e['provider']==kind]
    require(candidates,'Source release event missing');e=candidates[-1]
    if not prior or prior.get('lastReleaseEventId')!=e['eventId']:return e
    # API may lag the calendar; bounded retry grace, no synthetic observation.
    if prior.get('releasePending') and timestamp(run_at)-timestamp(e['officialReleaseDate'])<=timedelta(days=7):return e
    return None

def validators(response):
    headers={k.lower():v for k,v in response['headers'].items()}
    return {k:headers.get(k) for k in ['etag','last-modified','content-length']}

def same_probe(a,b):return a and a==b and bool(b.get('etag') or b.get('last-modified'))

def cps_url(period):
    import calendar
    month_index(period);y,m=map(int,period.split('-'));return f'{CPS_BASE}{y}/basic/{calendar.month_abbr[m].lower()}{y%100:02d}pub.zip'

def micro_candidates(periods,run_at,annual_audit=False):
    dates=sorted(periods);require(dates,'No qualified microdata baseline');last=month_index(dates[-1]);end=month_index(run_at[:7])-1
    recent=dates[-spec()['discovery']['cpsRecentHeads']:]
    new=[month_at(i) for i in range(last+1,min(end,last+spec()['discovery']['cpsCatchupMonths'])+1)]
    return sorted(set((dates if annual_audit else recent)+new)-set(spec()['discovery']['knownMissing']))
