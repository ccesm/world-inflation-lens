"""Deterministic C1A feasibility summaries; no effect estimates, clocks or publication."""
import argparse,hashlib,json,subprocess
from collections import Counter
from pathlib import Path
R=Path(__file__).resolve().parent
P=R.parents[2]
BASE='439ce594d95eea8e8ebd6f47e4333372e2d56d69'
ASOF='2026-10-09'
def load(n):return json.loads((R/n).read_text())
def require(ok,msg):
 if not ok:raise ValueError(msg)
def unique(rows,k):require(len(rows)==len({x[k] for x in rows}),'Duplicate '+k)
def month_index(s):y,m=map(int,s.split('-'));return y*12+m-1
def month(s):return s[:7]
def months_between(start,end):return month_index(end)-month_index(start)+1
def event_window(rows,state,anchor):
 if anchor is None:return dict(preMonths=None,postMonths=None,continuous=False)
 sets=[]
 for sector in ['COMMERCIAL','INDUSTRIAL']:
  sets.append({x['period'] for x in rows if x['state']==state and x['sector']==sector and all(x[k] is not None for k in ['salesMWh','revenueThousandUSD','priceCentsPerKWh'])})
 periods=sorted(sets[0]&sets[1]);idx=month_index(anchor[:7]);pre=sum(month_index(x)<idx for x in periods);post=sum(month_index(x)>idx for x in periods)
 continuous=bool(periods) and len(periods)==months_between(periods[0],periods[-1])
 return dict(preMonths=pre,postMonths=post,continuous=continuous,eventMonthExcluded=True,first=periods[0] if periods else None,last=periods[-1] if periods else None)
def exposure_eligible(project,mapping):
 return project['energizationStatus']=='VERIFIED_FIRST_ELECTRICAL_SERVICE' and project['energizationDate'] is not None and any(x['milestoneType']=='FIRST_ELECTRICAL_SERVICE' and x['isFirstEnergization'] and x['date']==project['energizationDate'] for x in project['milestones']) and mapping['qualifiesForEventDesign'] and mapping['historicalBoundaryMatch']=='QUALIFIED' and mapping['meterServicePolygonMatch']=='VERIFIED'
def comparison():
 ex=load('data-center-exposure-register.json')['projects'];maps={x['projectId']:x for x in load('geographic-mapping-register.json')['mappings']};rows=load('inputs/state-monthly.json');weather=load('inputs/weather-monthly.json');out=[]
 for p in ex:
  anchor=p['milestones'][0]['date'];eligible=exposure_eligible(p,maps[p['projectId']]);out.append(dict(projectId=p['projectId'],state=p['state'],qualificationStatus='INELIGIBLE_FOR_C1B_EVENT_SAMPLE',verifiedEventWindow=event_window(rows,p['state'],p['energizationDate']),operationalAnnouncementWindow=event_window(rows,p['state'],anchor) if p['milestones'][0]['milestoneType'] in ['ONLINE_ANNOUNCEMENT','GRAND_OPENING'] else None,announcementWindowUse='FEASIBILITY_BOUND_ONLY_NOT_VALIDATED_PRE_POST_EXPOSURE',exposureEligible=eligible,capacityIntensityEligible=False,pretrendStatus='NOT_TESTED_EVENT_AND_GEOGRAPHY_UNQUALIFIED',comparisonStatus='NO_QUALIFIED_MATCH',sourceRefs=p['locationSourceRefs']+['eia861m-state']))
 comps=[]
 for state in ['KS','KY','MI','MO','OK','PA']:
  s=[x for x in rows if x['state']==state];w=[x for x in weather if x['state']==state]
  comps.append(dict(regionId='STATE-'+state,state=state,candidateReason='Prospective donor pool for regional industrial/weather/retail-regime matching; not chosen from post-event outcomes.',status='CANDIDATE_NOT_QUALIFIED_COMPARISON',outcomeRows=len(s),weatherRows=len(w),availableFirst=min(x['period'] for x in s),availableLast=max(x['period'] for x in s),exposureContaminationStatus='UNQUALIFIED_NO_UNEXPOSED_ASSERTION',industrialTrendStatus='NOT_TESTED',priceTrendStatus='NOT_TESTED',spilloverStatus='UNQUALIFIED',regulatoryComparability='UNQUALIFIED',sourceRefs=['eia861m-state','census-states','noaa-catalog']))
 qualified=sum(x['exposureEligible'] for x in out);return dict(schemaVersion='C1A.1',asOf=ASOF,inheritedCriteria=dict(minimumPreMonths=24,minimumPostMonths=12,minimumExposedRegions=3,minimumCandidateComparisonRegions=6,source='../phase-c0/PHASE_C1_RESEARCH_PLAN.md#measurable-acceptance-criteria',thresholdsAreNotIdentification=True),exposedCandidates=out,comparisonCandidates=comps,qualifiedExposedRegions=qualified,qualifiedComparisonRegions=0,completeStateSectorOutcomeRows=len(rows),completeStateWeatherRows=len(weather),nominalOutcomeCells=4*len(rows),preliminaryOutcomeRows=sum(x['dataStatus']=='Preliminary' for x in rows),sampleTarget=['2015-01','2025-12'],gates=dict(exposure=False,historicalGeographicMatch=False,outcomeHistories=True,comparisonPoolScreening=False,localEssentialControls=False,preRegisteredProtocol=False,measurementAndPowerAudit=False),classification='PARTIAL — DATA GAPS',empiricalEffectsEstimated=False,causalEvidenceUpgrade=False)
def check_inherited():
 lock=load('baseline-lock.json');require(lock['baseSHA']==BASE,'Wrong baseline')
 for f,h in lock['files'].items():require((P/f).exists() and hashlib.sha256((P/f).read_bytes()).hexdigest()==h,'Inherited mutation '+f)
 changed=subprocess.check_output(['git','diff',BASE,'--name-only'],cwd=P,text=True).splitlines();untracked=subprocess.check_output(['git','ls-files','--others','--exclude-standard'],cwd=P,text=True).splitlines()
 prefix='research/ai-infrastructure-paper-validation/phase-c1a/'
 require(all(f.startswith(prefix) for f in changed+untracked),'Out-of-scope Git change')
def validate(projects=None,mappings=None,indicators=None,rows=None):
 from urllib.parse import urlsplit
 ex=projects if projects is not None else load('data-center-exposure-register.json')['projects'];maps=mappings if mappings is not None else load('geographic-mapping-register.json')['mappings'];inds=indicators if indicators is not None else load('electricity-source-register.json')['indicators'];data=rows if rows is not None else load('inputs/state-monthly.json');sources=load('source-manifest.json')['sources'];ix={x['sourceId']:x for x in sources}
 unique(ex,'projectId');unique(maps,'mappingId');unique(inds,'indicatorId');unique(sources,'sourceId')
 from extract import STATES
 for s in sources:
  u=urlsplit(s['url']);require(u.scheme=='https' and u.hostname and not u.username and not u.password and not u.fragment,'Unsafe source URL')
  allowed=['eia.gov','noaa.gov','census.gov','atmeta.com','engineering.fb.com','oppd.com','oppdthewire.com','pnm.com','prc.nm.gov','rockymountainpower.net','datacenters.google','microsoft.com','aep.com','newalbanyohio.org','cityofdekalb.com','dominionenergy.com']
  require(any(u.hostname==h or u.hostname.endswith('.'+h) for h in allowed),'Unofficial host')
  if s['status']=='FETCHED':require(len(s['sha256'])==64 and s['byteSize']>0,'Unidentified raw source')
  else:require(s['sha256'] is None,'Failed source cannot have verified hash')
 geography=load('inputs/geography.json');gis={x['state']:x['stateFips'] for x in geography['states']};counties={x['countyFips'] for x in geography['counties']};mix={x['projectId']:x for x in maps}
 for m in maps:
  require(m['projectId'] in {p['projectId'] for p in ex},'Unknown project reference');require(m['stateFips']==gis.get(m['state']),'Invalid state FIPS');require(m['countyFips'] is None or m['countyFips'] in counties and m['countyFips'].startswith(m['stateFips']),'Invalid county FIPS')
  require(not m['qualifiesForEventDesign'],'Unqualified geography promotion')
 for m in maps:
  ep=next(p for p in ex if p['projectId']==m['projectId']);require(m['state']==ep['state'],'Project mapping state mismatch')
  for t in m['territoryEvidence']:require(t['utilityId']==m['utilityId'] and t['state']==m['state'] and t['county']==m['county'],'Utility territory mismatch')
 for p in ex:
  require(p['state'] in gis and p['projectId'] in mix,'Missing geographic reference');require(p['evidenceGrade']=='E1','Unsupported evidence grade upgrade')
  require(p['energizationDate'] is None and p['energizationMonth'] is None and p['energizationStatus']=='UNAVAILABLE','Unsupported energization date promotion')
  require(all(p[k] is None for k in ['actualConnectedLoadMW','actualConsumptionMWh','operationalCapacityMW','aiSpecificConsumptionMWh','aiShare']),'Invented operational/AI load')
  require(p['energizationMissingReason'] and p['aiShareMissingReason'],'Missingness needs reason')
  for e in p['milestones']:
   if e['date'] is not None:
    import datetime
    try:datetime.date.fromisoformat(e['date'])
    except ValueError:raise ValueError('Invalid milestone date')
   require(not e['isFirstEnergization'],'Opening/permit is not energization');require(e['date'] is None or e['date']<=ASOF,'Future exposure leakage')
  for c in p['capacityHistory']:require(c['unit']=='MW' and ('NOT_CAMPUS_LOAD' in c['definition']) and c['sourceRefs'],'Procurement capacity mislabeled as load')
 for i in inds:
  require(i['verificationStatus'] in ['VERIFIED — DIRECT ACCESS','VERIFIED — MANUAL ACCESS','INSUFFICIENT DOCUMENTATION'],'Invalid source status')
  if i['payloadHistoryQualified']:require(i['verificationStatus']=='VERIFIED — DIRECT ACCESS' and i['historicalCoverage'],'Direct history requires payload coverage')
  require(i['publicationLag'] is None,'Unverified fixed publication lag')
  for ref in i['sourceRefs']:require(ref in ix and ix[ref]['status']=='FETCHED','Unresolved source reference')
 for obj in [ex,maps,load('measurement-and-confounder-register.json')]:
  def walk(v):
   if isinstance(v,dict):
    for k,val in v.items():
     if k in ['sourceRefs','locationSourceRefs','utilitySourceRefs','identifierSourceRefs']:
      require(all(s in ix and ix[s]['status']=='FETCHED' for s in val),'Unresolved claim source')
     else:walk(val)
   elif isinstance(v,list):
    for val in v:walk(val)
  walk(obj)
 seen=set();counts=Counter()
 for d in data:
  key=(d['state'],d['sector'],d['period']);require(key not in seen,'Duplicate monthly observation');seen.add(key);counts[(d['state'],d['sector'])]+=1
  require(d['state'] in STATES and d['sector'] in ['COMMERCIAL','INDUSTRIAL'],'Invalid outcome geography/sector');require('2015-01'<=d['period']<='2025-12','Invalid outcome period')
  require(d['sourceId']=='eia861m-state' and d['sourceHash']==ix[d['sourceId']]['sha256'] and d['locator'],'Missing outcome provenance')
  require(all(isinstance(d[k],(int,float)) and not isinstance(d[k],bool) for k in ['salesMWh','revenueThousandUSD','priceCentsPerKWh','customers']),'Missing/non-native value; no fill permitted')
  require(d['salesMWh']>0 and d['priceCentsPerKWh']>=0,'Invalid sales/price')
  require(abs(d['priceCentsPerKWh']-100*d['revenueThousandUSD']/d['salesMWh'])<=.0051,'Price unit/arithmetic mismatch')
  require(d['dataStatus'] in ['Final','Preliminary'],'Revision flag lost')
 require(len(data)==3432 and len(counts)==26 and set(counts.values())=={132},'Historical sample incomplete')
 for c in load('measurement-and-confounder-register.json')['controls']:
  require(all(i in {x['indicatorId'] for x in inds} for i in c['indicatorRefs']),'Unresolved control indicator')
 evidence=load('evidence-assessment.json');unique(evidence['evidence'],'evidenceId')
 for e in evidence['evidence']:require(e['evidenceGrade']=='E1' and e['sourceRefs'] and all(i in ix for i in e['sourceRefs']) and e['causalIdentification']=='NONE','Unsupported evidence assessment')
 oldhyp={x['hypothesisId']:x for x in load('../phase-c0/hypothesis-matrix.json')['hypotheses']}
 for h in evidence['hypotheses']:require(h['hypothesisId'] in oldhyp and h['evidenceGrade']==oldhyp[h['hypothesisId']]['evidenceGrade']=='E0','Inherited hypothesis grade changed')
 old=load('../phase-c0/gap-register.json')['gaps'];new=load('source-and-methodology-gaps.json')['inheritedGaps'];require(len(old)==len(new),'Inherited gaps lost')
 for a,b in zip(old,new):require(all(a[k]==b[k] for k in ['gapId','origin','severity','description','blocks']),'Inherited gap changed')
 require(comparison()['classification']=='PARTIAL — DATA GAPS','Readiness overstated')
 return {'projects':len(ex),'stateOutcomeRows':len(data),'verifiedFirstEnergization':0,'qualifiedEventGeographies':0,'classification':'PARTIAL — DATA GAPS'}
def identity():
 excluded={'content-identity.json','validation-results.json','retrieval-receipts.json'}
 fs=sorted(p for p in R.rglob('*') if p.is_file() and p.name not in excluded and '__pycache__' not in p.parts)
 hashes={str(p.relative_to(R)):hashlib.sha256(p.read_bytes()).hexdigest() for p in fs}
 return dict(schemaVersion='C1A.1',asOf=ASOF,baseSHA=BASE,files=hashes,contentHash=hashlib.sha256(json.dumps(hashes,sort_keys=True,separators=(',',':')).encode()).hexdigest(),exclusions=sorted(excluded),meaning='Artifact/source-selection identity; no causal or truth certification. Operational receipt timestamps excluded.')
def bytes_for(v):return (json.dumps(v,ensure_ascii=False,indent=2)+'\n').encode()
def main():
 a=argparse.ArgumentParser();a.add_argument('--write',action='store_true');a.add_argument('--check',action='store_true');a.add_argument('--identity',action='store_true');args=a.parse_args()
 validate();check_inherited();b=bytes_for(comparison())
 if args.write:(R/'candidate-region-comparison.json').write_bytes(b)
 if args.check:require((R/'candidate-region-comparison.json').read_bytes()==b,'Comparison rebuild differs');require(load('content-identity.json')==identity(),'Identity differs')
 print(json.dumps(identity() if args.identity else validate(),ensure_ascii=False,sort_keys=True))
if __name__=='__main__':main()
