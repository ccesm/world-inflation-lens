"""Offline Phase C0 integrity gates; no retrieval, models, forecasting or production write."""
import copy, hashlib, json, subprocess
from pathlib import Path
from urllib.parse import urlsplit, parse_qsl
R=Path(__file__).resolve().parent
ROOT=R.parents[2]
BASE='596e7e69560ee17be0b5412e852e74032533f49a'
ASOF='2026-10-09'
REQUIRED=['PHASE_C0_MACRO_TRANSMISSION_REPORT.md','hypothesis-matrix.json','official-data-source-register.json','evidence-register.json','macro-transmission-map.md','methodology.md','gap-register.json','PHASE_C1_RESEARCH_PLAN.md','baseline-lock.json','source-verification-notes.json']
STATUSES={'VERIFIED — DIRECT ACCESS','VERIFIED — MANUAL ACCESS','CANDIDATE — UNVERIFIED','UNAVAILABLE','INSUFFICIENT DOCUMENTATION'}
GRADES={'E0','E1','E2','E3','E4'}
def load(name):return json.loads((R/name).read_text())
def require(ok,message):
 if not ok:raise ValueError(message)
def unique(records,key):
 ids=[r[key] for r in records];require(len(ids)==len(set(ids)),f'Duplicate {key}');return set(ids)
def valid_url(url):
 if url is None:return
 u=urlsplit(url)
 require(u.scheme=='https' and u.hostname and not u.username and not u.password,'Unsafe source URL')
 require(all(k=='tab' for k,val in parse_qsl(u.query)),'Unsafe source URL')
 hosts={'eia.gov','census.gov','bls.gov','ferc.gov','federalreserve.gov','newyorkfed.org','philadelphiafed.org','fred.stlouisfed.org','treasury.gov','bies.lbl.gov','pjm.com','nber.org','sec.gov','arxiv.org'}
 require(any(u.hostname==h or u.hostname.endswith('.'+h) for h in hosts),'Unauthenticated source host')
def validate_bundle(d):
 h,s,e,g=d['hypotheses'],d['indicators'],d['evidence'],d['gaps']
 hi=unique(h,'hypothesisId');si=unique(s,'indicatorId');ei=unique(e,'evidenceId');unique(g,'gapId')
 require(hi=={f'{p}{i}' for p,n in [('E',4),('F',4),('P',4),('I',5)] for i in range(1,n+1)},'Hypothesis coverage')
 require(d['asOf']==ASOF,'Explicit clock')
 for x in h:
  for k in ['workstream','researchQuestion','transmissionMechanism','expectedDirection','expectedTimeHorizon','dependentVariable','explanatoryVariables','mediatingVariables','confoundingFactors','supportingEvidence','contradictoryEvidence','evidenceGrade','officialDataCandidates','proposedValidationMethod','falsificationCriteria','knownLimitations','nextResearchAction']:
   require(bool(x.get(k)),f'Hypothesis missing {k}')
  require(x['evidenceGrade']=='E0','Unsupported transmission grade promotion')
  require(set(x['officialDataCandidates'])<=si,'Unknown indicator reference')
  require(set(x['supportingEvidence'])<=ei,'Unknown evidence reference')
  for c in x['contradictoryEvidence']:
   require(c['type'] in {'COUNTERMECHANISM','OBSERVATION_LIMIT'},'Counterevidence classification')
   require(set(c['evidenceRefs'])<=ei,'Unknown counterevidence')
 for x in s:
  for k in ['indicatorId','workstream','indicatorName','economicInterpretation','primaryInstitution','originalDataset','exactSeriesIdentifier','officialSourceURL','unit','frequency','geographicCoverage','historicalCoverage','latestVerifiedObservation','publicationLag','revisionPolicy','seasonalAdjustment','nominalOrReal','dataVintageLimitations','automatedRetrievalFeasibility','sourceVerificationStatus','unverifiedMetadata']:
   require(k in x,f'Missing source metadata {k}')
  require(x['sourceVerificationStatus'] in STATUSES,'Invalid source status')
  valid_url(x['officialSourceURL'])
  verified=x['sourceVerificationStatus'].startswith('VERIFIED')
  if verified:
   require(bool(x['verificationBasis']) and bool(x['sourceLocator']) and x['verificationDate']<=ASOF,'Unjustified verification')
   require(x['officialSourceURL'] is not None or x['indicatorId']=='FI-CORPORATE','Verified source without URL')
  else:require(x['verificationDate'] is None,'Unverified source dated as verified')
  if x['sourceVerificationStatus']=='VERIFIED — DIRECT ACCESS':require(x.get('validatedPayloadSHA256') and x.get('retrievalReceipt'),'Direct access without payload')
  if x['exactSeriesIdentifier']=='BAMLC0A0CM':require(x['primaryInstitution']=='ICE Data Indices LLC' and x['providerClass']=='PRIVATE_LICENSED' and not verified,'Private provider misclassified')
  for k in x['unverifiedMetadata']:require(x[k] is None,'Unknown metadata fabricated')
  o=x['latestVerifiedObservation']
  if o:
   require(verified and o['verifiedAsOf']==ASOF and o['publicationDate']<=ASOF,'Future or unqualified observation')
   require(o['unit']==x['unit'] and o['sourceURL']==x['officialSourceURL'] and o['sourceLocator'],'Observation unit/provenance')
   require(o['captureType']=='MANUAL_SOURCE_PAGE_SPOT_CHECK' and o['notCompleteHistory'],'Spot-check history overclaim')
  else:require(x['latestObservationMissingReason'],'Unexplained missing observation')
 for x in e:
  require(x['evidenceGrade'] in GRADES,'Invalid evidence grade')
  for k in ['sourceReliability','dataReproducibility','statisticalRobustness','causalIdentification','externalValidity','uncertainty','gradeJustification','sourceLocator']:
   require(bool(x.get(k)),f'Missing evidence dimension {k}')
  require(set(x['indicatorRefs'])<=si,'Evidence indicator reference')
  require(x['indicatorRefs'] or x.get('externalSources'),'Untraceable material claim')
  for src in x.get('externalSources',[]):valid_url(src['url'])
  if x['evidenceGrade'] in {'E3','E4'}:
   require(x['statisticalRobustness']!='NOT_TESTED_IN_C0' and x.get('replicationArtifact'),'Unsubstantiated statistical grade')
  if x['evidenceGrade']=='E4':require(x['causalIdentification']!='NONE' and x.get('validatedIdentificationAssumptions'),'Unsubstantiated causal grade')
  if x['claimType']=='INHERITED_DESCRIPTIVE':
   require(x['evidenceGrade']=='E2' and x['causalIdentification']=='NONE','Corporate macro overclaim')
 require(not d['numericalInflationForecasts'] and not d['newEmpiricalEstimates'],'Forecast/empirical scope violation')
 old=load('../phase-b2/gap-register.json')
 for x in old:
  n=next(z for z in g if z['gapId']=='INHERITED-'+x['gap_id'])
  require(n['description']==x['limitation'] and n['status']==x['status'] and n['severity']==x['severity'],'Inherited gap erased')
def bundle():
 return dict(asOf=load('hypothesis-matrix.json')['asOf'],hypotheses=load('hypothesis-matrix.json')['hypotheses'],indicators=load('official-data-source-register.json')['indicators'],evidence=load('evidence-register.json')['evidence'],gaps=load('gap-register.json')['gaps'],numericalInflationForecasts=load('evidence-register.json')['numericalInflationForecasts'],newEmpiricalEstimates=load('evidence-register.json')['newEmpiricalEstimates'])
def check_inherited():
 lock=load('baseline-lock.json');require(lock['baseCommit']==BASE,'Baseline substitution')
 for p,h in lock['sha256ByPath'].items():require((ROOT/p).is_file() and hashlib.sha256((ROOT/p).read_bytes()).hexdigest()==h,'Inherited mutation: '+p)
 allowed='research/ai-infrastructure-paper-validation/phase-c0/'
 changed=subprocess.check_output(['git','diff',BASE,'--name-only'],cwd=ROOT,text=True).splitlines()
 untracked=subprocess.check_output(['git','ls-files','--others','--exclude-standard'],cwd=ROOT,text=True).splitlines()
 require(all(p.startswith(allowed) for p in changed+untracked),'Out-of-scope new file')
def check_extracts():
 bridges=load('../phase-b1/funding-bridges.json')
 observations=load('../phase-b1/financial-observations.json')
 obsids={x['observation_id'] for x in observations}
 # Source IDs are preserved in B1; numerical extracts must equal their frozen bridge exactly.
 for e in bundle()['evidence']:
  if e['claimType']!='INHERITED_DESCRIPTIVE':continue
  p=e['observation'];b=next(b for b in bridges if b['company']==p['company'] and b['label']==p['label'])
  for k in ['basis','start','end','filed','accession','company_convention_fcf_usd','fcf_definition']:require(p[k]==b[k],'Inherited extraction mismatch')
  require(all(ref in obsids for ref in p['source_refs'].values()),'Unknown inherited observation ID')
  for k,v in p['reported_values_usd'].items():require(v==b['reported_values_usd'][k] and p['source_refs'].get(k)==b['source_refs'].get(k),'Inherited value/ref mismatch')
def identity():
 paths=sorted(REQUIRED+['validate.py','test_phase_c0.py','reproduce.py'])
 hashes={p:hashlib.sha256((R/p).read_bytes()).hexdigest() for p in paths}
 payload={'implementationVersion':'C0.1','baseSHA':BASE,'asOf':ASOF,'sha256ByPath':hashes}
 digest=hashlib.sha256(json.dumps(payload,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()).hexdigest()
 return dict(payload,contentHash=digest)
def main():
 for f in REQUIRED:require((R/f).is_file(),'Missing '+f)
 validate_bundle(bundle());check_inherited();check_extracts()
 plan=(R/'PHASE_C1_RESEARCH_PLAN.md').read_text()
 require(plan.count('**Selected, gated**')==1 and 'C1 remains **not started**' in plan,'Pilot count/start')
 return identity()
if __name__=='__main__':print(json.dumps(main(),sort_keys=True,ensure_ascii=False))
