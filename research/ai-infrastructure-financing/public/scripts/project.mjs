import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {canonical} from '../../scripts/validate-phase3b.mjs';
import {schemaErrors} from '../../scripts/validate.mjs';
export const root=fileURLToPath(new URL('../',import.meta.url));
export const BASE='9075c9a5325a63e35770323e2cc3e0e164bbc823';
export const PANEL_HASH='b54975f22d5fbceceb44216665c37233511a9d088016255bdb09328ef91706ff';
export const AS_OF='2026-10-07';
export const VERSION='ai-infrastructure-public-projection-v1';
const read=name=>JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
export const digest=v=>createHash('sha256').update(typeof v==='string'?v:JSON.stringify(canonical(v))).digest('hex');
export const bytes=v=>JSON.stringify(canonical(v))+'\n';
export const copy=()=>read('copy.json');
export const rules=()=>read('rules.json');
const sourceRef=s=>'source-'+digest(s.sourceVersion).slice(0,12);
const sorted=xs=>[...xs].sort();
const equal=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
export function loadPanel(){
  const p=JSON.parse(fs.readFileSync(path.join(root,'../panel/snapshots',AS_OF,PANEL_HASH,'panel.json'),'utf8'));
  assertPanel(p);return p;
}
export function assertPanel(p){
  const {panelHash,views,...economic}=p;
  if(panelHash!==PANEL_HASH||digest(economic)!==PANEL_HASH||p.methodology.asOfDate!==AS_OF)throw Error('Frozen Phase3C panel identity mismatch');
  for(const name of ['projects','observations','claims','sources','definitions','scopes']){
    const ids=p[name].map(x=>x.id??x.observationId??x.claimId??x.sourceId??x.definitionId??x.scopeId);
    if(new Set(ids).size!==ids.length)throw Error('Duplicate frozen registry identity');
  }
}
export function publicURL(url,s){
  try{
    const u=new URL(url);
    return u.protocol==='https:'&&!u.username&&!u.password&&!u.search&&!u.hash&&u.href===url&&s.allowedRoutes.some(r=>r.host===u.hostname&&u.pathname.startsWith(r.prefix));
  }catch{return false;}
}
export function publicationGate(o,p,r=rules()){
  const reasons=[];
  if(o.publicationEligibility!=='PUBLIC_READY')reasons.push('PUBLICATION_'+o.publicationEligibility);
  if(o.qualificationStatus!=='QUALIFIED')reasons.push('QUALIFICATION_'+o.qualificationStatus);
  if(o.evidenceClass!=='PRIMARY_VERIFIED')reasons.push('EVIDENCE_'+o.evidenceClass);
  if(o.value===null)reasons.push('UNAVAILABLE');
  if(o.recordState==='CONFLICT_REQUIRES_REVIEW'||p.conflicts.some(c=>c.claimIds.includes(o.claimId)))reasons.push('CONFLICT');
  if(o.recordState==='SUPERSEDED')reasons.push('SUPERSEDED');
  if(o.overlapStatus!=='NO_KNOWN_OVERLAP')reasons.push('UNRESOLVED_OVERLAP');
  if(p.projects.filter(pr=>pr.assetIdentity===p.projects.find(pr=>pr.id===o.projectId)?.assetIdentity).length!==1)reasons.push('ASSET_IDENTITY');
  if(o.condition)reasons.push('CONDITIONAL_LEGAL_ASSERTION');
  if(!r.allowedMetrics.includes(o.metricId))reasons.push('NO_PUBLIC_SLOT_OR_LEGAL_COMPLEXITY');
  if(!r.allowedLayers.includes(o.layer)||o.currency!==null||!['TEXT','MW','GW'].includes(o.unit))reasons.push('FINANCIAL_OR_UNSUPPORTED_LAYER_UNIT');
  if(!o.sourceLocator||!o.nativeDefinition||!p.scopes.some(s=>s.scopeId===o.scopeId&&s.caseId===o.projectId&&s.definition)||!p.definitions.some(d=>d.definitionId===o.definitionId&&d.metricId===o.metricId&&d.layer===o.layer&&d.unit===o.unit&&d.nativeDefinition===o.nativeDefinition&&d.capacityDefinition===o.capacityDefinition&&d.classification===o.observedOrEstimated))reasons.push('DEFINITION_SCOPE');
  const c=p.claims.find(c=>c.claimId===o.claimId);
  if(!c||!equal(c.value,o.value)||c.unit!==o.unit||c.caseId!==o.projectId||c.scopeId!==o.scopeId||c.definition!==o.nativeDefinition||!equal(c.sourceIds,o.sourceIds)||c.evidenceClass!==o.evidenceClass||c.observedOrEstimated!==o.observedOrEstimated||c.capacityDefinition!==o.capacityDefinition||c.operator!==o.operator||c.sourceLocator!==o.sourceLocator||!equal(o.period,c.periodOverride??{basis:c.effectiveDate?'SOURCE_REPORTED_EFFECTIVE_DATE':'NOT_DISCLOSED',start:c.effectiveDate,end:c.effectiveDate}))reasons.push('CLAIM_PROVENANCE');
  if(!o.sourceIds.length||[o.sourceHashes,o.sourceVersions,o.documentDates].some(a=>a.length!==o.sourceIds.length)||o.sourceVintage!=='sv:'+digest(o.sourceVersions.slice().sort()))reasons.push('SOURCE_VINTAGE');
  for(let i=0;i<o.sourceIds.length;i++){
    const s=p.sources.find(s=>s.sourceId===o.sourceIds[i]);
    if(!s||s.primaryOrSecondary!=='PRIMARY'||s.qualificationStatus!=='ARCHIVED_REVIEWED'||!/^[a-f0-9]{64}$/.test(s.sourceHash??'')||s.sourceVersion!==s.sourceId+'@'+s.sourceHash||o.sourceHashes[i]!==s.sourceHash||o.sourceVersions[i]!==s.sourceVersion||o.documentDates[i]!==s.documentDate)reasons.push('SOURCE_UNQUALIFIED');
    if(s&&(!publicURL(s.url,s)||s.availableFrom>AS_OF||s.documentDate!==null&&s.documentDate>AS_OF))reasons.push('SOURCE_URL_OR_CLOCK');
  }
  if(o.availableFrom>AS_OF||o.period.start!==null&&o.period.start>AS_OF)reasons.push('FUTURE_INFORMATION');
  if(o.metricId==='PROJECT_STATUS'&&(!o.period.start||o.unit!=='TEXT'))reasons.push('UNDATED_STATUS');
  if(['MW','GW'].includes(o.unit)&&(!r.capacityStatus[o.capacityDefinition]||typeof o.value!=='number'||o.value<0))reasons.push('CAPACITY_DEFINITION');
  return {eligible:reasons.length===0,reasons:[...new Set(reasons)]};
}
export function languageErrors(value,location='$'){
  const errors=[];
  function walk(v,k){
    if(!v||typeof v!=='object'){if(k!=='$.version')errors.push(k+': unpaired public copy');return;}
    if(Object.hasOwn(v,'en')||Object.hasOwn(v,'zh')){if(Object.keys(v).sort().join(',')!=='en,zh'||!v.en?.trim()||!v.zh?.trim())errors.push(k+': EN/ZH parity');return;}
    for(const [name,child]of Object.entries(v))walk(child,k+'.'+name);
  }
  walk(value,location);return errors;
}
export function buildProjection(p=loadPanel()){
  assertPanel(p);const r=rules(),c=copy();
  if(r.expectedPanelHash!==PANEL_HASH||r.expectedBaseSha!==BASE||r.asOf!==AS_OF)throw Error('Frozen publication rules identity mismatch');
  const contractErrors=schemaErrors(read('ui-contract.json'),read('schemas/ui-contract.schema.json'),'uiContract');if(contractErrors.length)throw Error(contractErrors.join('\n'));
  const copyErrors=languageErrors(c);if(copyErrors.length)throw Error(copyErrors.join('\n'));
  const implementationHash=digest(['scripts/project.mjs','schemas/projection.schema.json','schemas/ui-contract.schema.json','rules.json','ui-contract.json','copy.json'].map(f=>[f,fs.readFileSync(path.join(root,f),'utf8')]));
  const audit=p.observations.map(o=>({observationId:o.observationId,claimId:o.claimId,projectId:o.projectId,publicationEligibility:o.publicationEligibility,qualificationStatus:o.qualificationStatus,evidenceClass:o.evidenceClass,included:false,reasons:publicationGate(o,p,r).reasons}));
  const auditById=new Map(audit.map(x=>[x.observationId,x])),trace=[],usedSources=new Set(),usedObservations=new Set();
  const pair=(group,key)=>{if(!c[group]?.[key])throw Error('Missing bilingual editorial mapping: '+group+'/'+key);return c[group][key];};
  const record=(o,publicField)=>{if(!publicationGate(o,p,r).eligible)throw Error('Attempted non-eligible public field');usedObservations.add(o.observationId);for(const id of o.sourceIds){usedSources.add(id);trace.push({publicField,projectId:o.projectId,observationId:o.observationId,claimId:o.claimId,sourceId:id,sourceRef:sourceRef(p.sources.find(s=>s.sourceId===id))});}auditById.get(o.observationId).included=true;};
  const refs=o=>o.sourceIds.map(id=>sourceRef(p.sources.find(s=>s.sourceId===id)));
  const dated=(o,publicField)=>{record(o,publicField);return {value:o.value,effectiveDate:o.period.start,sourceDate:o.documentDates.filter(Boolean).sort().at(-1)??null,availableFrom:o.availableFrom,scope:pair('scopes',o.scopeId),sourceRefs:refs(o)};};
  const capacity=(o,publicField)=>{record(o,publicField);return {value:o.value,unit:o.unit,operator:o.operator,capacityDefinition:o.capacityDefinition,shortDefinition:pair('capacityLabels',o.capacityDefinition),status:r.capacityStatus[o.capacityDefinition],classification:o.observedOrEstimated,scope:pair('scopes',o.scopeId),effectiveDate:o.period.start,sourceDate:o.documentDates.filter(Boolean).sort().at(-1)??null,availableFrom:o.availableFrom,sourceRefs:refs(o),comparabilityStatus:o.comparabilityStatus,comparabilityNote:c.disclosures.comparability};};
  const projectAudit=[],projects=[];
  const order=pr=>{const i=r.companyOrder.indexOf(pr.companyIds[0]);return i===-1?99:i;};
  const candidates=p.projects.slice().sort((a,b)=>order(a)-order(b)||a.id.localeCompare(b.id));
  for(const pr of candidates){
    const os=p.observations.filter(o=>o.projectId===pr.id&&publicationGate(o,p,r).eligible);
    const location=os.find(o=>o.metricId==='LOCATION'&&o.claimId===pr.locationClaimId);
    const statusCandidates=os.filter(o=>o.metricId==='PROJECT_STATUS').sort((a,b)=>a.period.start.localeCompare(b.period.start)||a.observationId.localeCompare(b.observationId));
    const statuses=statusCandidates.filter((o,i)=>!statusCandidates.slice(i+1).some(z=>z.value===o.value&&z.scopeId===o.scopeId));
    const campus=os.filter(o=>o.layer==='PHYSICAL_ASSET'&&['PLANNED_CAPACITY','CONTRACTED_CAPACITY','LIVE_CAPACITY'].includes(o.metricId));
    const power=os.filter(o=>o.layer==='POWER_INFRASTRUCTURE'&&['SOLAR','POWER_GAS','POWER_SOLAR'].includes(o.metricId));
    if(!location||!statuses.length&&!campus.length&&!power.length){projectAudit.push({projectId:pr.id,included:false,reason:'INSUFFICIENT_MEANINGFUL_PUBLIC_CONTEXT'});for(const a of audit.filter(a=>a.projectId===pr.id&&a.reasons.length===0))a.reasons=['PROJECT_EXCLUDED_INSUFFICIENT_CONTEXT'];continue;}
    const role=pr.coverageRole==='COMPARATIVE_REFERENCE_CASE'?'COMPARATIVE_REFERENCE':'CORE_COMPANY_PROJECT';
    const companyId=role==='COMPARATIVE_REFERENCE'?null:r.entityCompanyMap[location.entityId];
    if(role==='CORE_COMPANY_PROJECT'&&(!companyId||!pr.companyIds.includes(companyId)))throw Error('Public company association requires the eligible location claim reporting company');
    const region=Object.keys(c.regions).find(s=>location.value.endsWith(', '+s));const place=pair('places',pr.id);
    if(!region||location.value.slice(0,-region.length-2)!==place.en)throw Error('Public geography mapping does not match native location');
    const index=projects.length,base=`projects[${index}]`;
    record(location,base+'.location');record(location,base+'.projectName');if(companyId)record(location,base+'.companyId');
    const history=statuses.map((o,i)=>({...dated(o,base+`.statusHistory[${i}]`),status:o.value}));
    const latest=history.at(-1)??null;if(latest)record(statuses.at(-1),base+'.projectStatus');
    const capacityDisplay=campus.map((o,i)=>capacity(o,base+`.capacityDisplay[${i}]`));
    const powerSummary=power.map((o,i)=>({...capacity(o,base+`.powerSummary[${i}]`),powerType:o.metricId,label:pair('powerLabels',o.metricId),scopeNote:c.disclosures.utility}));
    const notes=[c.disclosures.statusVintage,c.disclosures.financing];if(pr.id==='fairwater')notes.push(c.disclosures.fairwater);if(role==='COMPARATIVE_REFERENCE')notes.push(c.disclosures.polaris);
    projects.push({projectId:pr.id,companyId,companyName:companyId?pair('companies',companyId):c.labels.comparative,companyRelationship:'REPORTED_ASSOCIATION_NOT_LEGAL_OWNERSHIP',projectName:pair('projects',pr.id),role,location:{country:c.labels.countryUS,stateRegion:pair('regions',region),cityArea:place},projectStatus:latest?.status??'UNKNOWN',statusEffectiveDate:latest?.effectiveDate??null,statusSourceDate:latest?.sourceDate??null,statusAvailableFrom:latest?.availableFrom??null,statusHistory:history,capacityDisplay,primaryArchetype:'UNKNOWN',secondaryFeatures:[],financingFeatures:[],ownershipStatus:'NOT_YET_QUALIFIED',powerSummary,publicSourceRefs:sorted([...new Set([...history.flatMap(h=>h.sourceRefs),...capacityDisplay.flatMap(h=>h.sourceRefs),...powerSummary.flatMap(h=>h.sourceRefs),...refs(location)])]),scopeNotes:[c.disclosures.comparability],publicNotes:notes,lastQualifiedAsOf:AS_OF,publicationStatus:'QUALIFIED_FOR_REVIEW_NOT_DEPLOYED'});
    projectAudit.push({projectId:pr.id,included:true,reason:'QUALIFIED_LOCATION_AND_MEANINGFUL_DATED_STATUS_OR_NATIVE_CAPACITY_OR_POWER'});
  }
  for(const a of audit){if(a.included)a.reasons=[];else if(!a.reasons.length)a.reasons=['REDUNDANT_STATUS_EVENT'];}
  const sources=sorted(usedSources).map(id=>{const s=p.sources.find(s=>s.sourceId===id);return {sourceId:sourceRef(s),publisher:{en:s.publisher,zh:s.publisher},documentTitle:pair('sourceTitles',id),documentDate:s.documentDate,sourceType:s.sourceType,publicURL:s.url,sourceVintage:s.sourceHash,availableFrom:s.availableFrom};});
  const represented=r.companyOrder.filter(id=>projects.some(pr=>pr.companyId===id));
  const counts=key=>Object.fromEntries(sorted([...new Set(projects.map(pr=>pr[key]))]).map(k=>[k,projects.filter(pr=>pr[key]===k).length]));
  const projection={schemaVersion:VERSION,asOf:AS_OF,researchPanelHash:PANEL_HASH,projectionHash:null,copyVersion:c.version,copyHash:digest(c),projects,archetypeSummary:counts('primaryArchetype'),powerSummary:{projectsWithQualifiedPowerEvidence:projects.filter(pr=>pr.powerSummary.length).length,disclosedFactCount:projects.reduce((n,pr)=>n+pr.powerSummary.length,0)},summary:{representedCompanies:represented,companyCount:represented.length,projectCount:projects.length,coreCompanyProjectCount:projects.filter(pr=>pr.role==='CORE_COMPANY_PROJECT').length,comparativeProjectCount:projects.filter(pr=>pr.role==='COMPARATIVE_REFERENCE').length,statusCounts:counts('projectStatus'),factCount:usedObservations.size},methodology:{implementationVersion:VERSION,implementationHash,publicationRulesHash:digest(r),uiContractVersion:read('ui-contract.json').version,publicationMode:'FROZEN_REVIEW_PROJECTION_NO_PRODUCTION_WRITE',moneyPolicy:'NO_AMOUNTS_OR_AGGREGATION',financingPolicy:'UNKNOWN_UNTIL_PUBLIC_READY_STRUCTURE_CLAIMS_EXIST',capacityPolicy:'NATIVE_UNITS_SCOPES_NO_RANKING_OR_CONVERSION',sourceClockPolicy:'DATED_DISCLOSURES_AND_KNOWN_BYTE_VINTAGES_NOT_REAL_TIME_REPLAY',disclosures:c.disclosures},sources};
  const {projectionHash,...content}=projection;projection.projectionHash=digest(content);
  const errors=validateShape(projection,p);if(errors.length)throw Error(errors.join('\n'));
  return {projection,trace,audit,projectAudit,identity:{researchPanelHash:PANEL_HASH,projectionHash:projection.projectionHash,projectionFileSha256:digest(bytes(projection)),projectionByteSize:Buffer.byteLength(bytes(projection)),copyHash:projection.copyHash,implementationHash}};
}
function validateShape(v,p){
  const errors=schemaErrors(v,read('schemas/projection.schema.json'),'projection');
  const text=JSON.stringify(v);
  if(/(?:\/Users\/|\/private\/|\/tmp\/|file:\/\/|wil-ai-infrastructure-cache|WIL_AI_INFRA_CACHE|Beignet Investor|Project Beignet|\b2\.064\b|\b27\.3\b|\b46\.03\b|obs:|def:|unknown:|claimId|observationId|entityId|sourceLocator|retrievedAt|runner|workflow_dispatch|github_token)/i.test(text))errors.push('Forbidden research/path/legal metadata in public projection');
  if(v.asOf!==AS_OF||v.researchPanelHash!==PANEL_HASH)errors.push('Public source identity mismatch');
  const {projectionHash,...content}=v;if(projectionHash!==digest(content))errors.push('Projection content hash mismatch');
  const sourceIds=new Set(v.sources.map(s=>s.sourceId));
  for(const s of v.sources){const original=p.sources.find(x=>sourceRef(x)===s.sourceId);if(!original||!publicURL(s.publicURL,original)||s.publicURL!==original.url||s.sourceVintage!==original.sourceHash)errors.push('Public source URL/vintage mismatch');}
  for(const pr of v.projects){if(pr.primaryArchetype!=='UNKNOWN'||pr.financingFeatures.length||pr.secondaryFeatures.length||pr.ownershipStatus!=='NOT_YET_QUALIFIED')errors.push('Unqualified financing/ownership structure');for(const id of pr.publicSourceRefs)if(!sourceIds.has(id))errors.push('Unknown public source reference');for(const f of [...pr.statusHistory,...pr.capacityDisplay,...pr.powerSummary])for(const id of f.sourceRefs)if(!pr.publicSourceRefs.includes(id))errors.push('Unlinked fact source');}
  return errors;
}
export function validatePublic(v,p=loadPanel()){
  const errors=validateShape(v,p);
  if(!equal(v,buildProjection(p).projection))errors.push('Public projection differs from deterministic eligible field mapping');
  return errors;
}
export function validateTrace(result,p=loadPanel()){
  const expected=buildProjection(p),errors=[];
  if(!equal(result.trace,expected.trace))errors.push('Research-to-public trace mismatch');
  if(!equal(result.audit,expected.audit)||!equal(result.projectAudit,expected.projectAudit))errors.push('Eligibility/project audit mismatch');
  const included=new Set(result.trace.map(t=>t.observationId));
  for(const id of included){const o=p.observations.find(o=>o.observationId===id);if(!o||!publicationGate(o,p).eligible)errors.push('Non-eligible trace observation');}
  if(included.size!==result.projection.summary.factCount)errors.push('Displayed fact count/trace mismatch');
  return errors;
}
export function writeProjection(result){
  // Research-only fixed paths. There is no arbitrary destination or production exporter.
  const name=path.join(root,'ai-infrastructure-public-monitor.json'),serialized=bytes(result.projection);
  if(validatePublic(result.projection).length||validateTrace(result).length)throw Error('Invalid public projection or trace');
  if(fs.existsSync(name)&&fs.readFileSync(name,'utf8')!==serialized)throw Error('Frozen public projection would change; separately reviewed version required');
  for(const [file,value]of [['projection-trace.json',result.trace],['eligibility-audit.json',{projectAudit:result.projectAudit,observations:result.audit}]]){const target=path.join(root,file),data=JSON.stringify(canonical(value),null,2)+'\n';if(fs.existsSync(target)&&fs.readFileSync(target,'utf8')!==data)throw Error('Frozen trace/audit would change');}
  if(!fs.existsSync(name))fs.writeFileSync(name,serialized,{flag:'wx'});
  for(const [file,value]of [['projection-trace.json',result.trace],['eligibility-audit.json',{projectAudit:result.projectAudit,observations:result.audit}]]){
    const target=path.join(root,file),data=JSON.stringify(canonical(value),null,2)+'\n';
    if(fs.existsSync(target)&&fs.readFileSync(target,'utf8')!==data)throw Error('Frozen trace/audit would change');
    if(!fs.existsSync(target))fs.writeFileSync(target,data,{flag:'wx'});
  }
}
