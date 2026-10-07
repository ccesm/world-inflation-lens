import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { root, schemaErrors, validate as foundationValidate, load as foundationLoad } from './validate.mjs';
import { sha256 } from '../hydration/archive.mjs';
export const collections = ['projects','entities','financing','ownership','obligations','power','sources','claims','relationships','accounting-bridges'];
const read = name => JSON.parse(fs.readFileSync(path.join(root,name),'utf8'));
export function load() {
  return { ...Object.fromEntries(['methodology',...collections].map(n=>[n,read(`data/phase3b/${n}.json`)])), scopes:read('data/scope-map.json'), overlaps:read('data/overlaps.json'), overlapGraph:read('data/phase3b/overlap-graph.json'), selection:read('data/phase3b/selection.json'), conflicts:read('data/phase3b/conflicts.json'), cases:['hyperion','fairwater','polaris-forge-1'].map(n=>read(`cases/${n}.json`)), sourcePlan:read('hydration/source-plan.json') };
}
export function compatible(a,b) { return a.scopeId===b.scopeId && a.unit===b.unit && a.definition===b.definition && a.effectiveDate===b.effectiveDate && a.observedOrEstimated===b.observedOrEstimated; }
export function canonical(v) { return Array.isArray(v)?v.map(canonical):v && typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v; }
export function economicIdentity(b) {
  // Operational receipt dates and access diagnostics do not alter economic/source content identity.
  const input=structuredClone(b);
  input.sources=input.sources.map(({retrievedAt,retrievalStatus,accessError,...s})=>s);
  return sha256(JSON.stringify(canonical(input)));
}
export function validate(b) {
  const errors=[], fail=(id,msg)=>errors.push(`${id}: ${msg}`), ids=rows=>new Map(rows.map(x=>[x.id??x.claimId??x.scopeId??x.sourceId,x]));
  for (const n of ['methodology',...collections]) errors.push(...schemaErrors(b[n],read(`phase3b/schemas/${n}.schema.json`),n));
  errors.push(...schemaErrors(b.scopes,read('phase3b/schemas/scope-map.schema.json'),'scopes'),...schemaErrors(b.overlaps,read('phase3b/schemas/overlaps.schema.json'),'overlaps'));
  if(errors.length)return {valid:false,errors};
  for(const n of collections)if(ids(b[n]).size!==b[n].length)fail(n,'duplicate ID');
  const claims=ids(b.claims),entities=ids(b.entities),sources=ids(b.sources),scopes=ids(b.scopes),projects=ids(b.projects),all=ids(collections.filter(n=>!['claims','sources'].includes(n)).flatMap(n=>b[n]));
  const ref=(id,map,owner)=>{if(id!==null&&!map.has(id))fail(owner,`unknown reference ${id}`);};
  for(const s of b.sources){
    const policy=b.sourcePlan.find(p=>p.id===s.sourceId);
    if(!policy||policy.url!==s.url||policy.sourceType!==s.sourceType)fail(s.sourceId,'source policy mismatch');
    if(s.primaryOrSecondary!==(s.sourceType.startsWith('PRIMARY')?'PRIMARY':'SECONDARY'))fail(s.sourceId,'primary/secondary mismatch');
    if(s.SHA256!==null&&!/^[a-f0-9]{64}$/.test(s.SHA256))fail(s.sourceId,'invalid source hash');
    if(s.qualificationStatus==='ARCHIVED_REVIEWED'&&(!s.SHA256||s.byteSize<=0||!s.resolvedURL||!s.MIME))fail(s.sourceId,'archived identity missing');
    if(s.SHA256&&s.sourceVersionId!==`${s.sourceId}@${s.SHA256}`)fail(s.sourceId,'source vintage identity mismatch');
    for(const id of s.entityIds)ref(id,entities,s.sourceId);
    if(s.resolvedURL){const u=new URL(s.resolvedURL);if(u.protocol!=='https:'||!policy.allowedRoutes.some(p=>p.host===u.hostname&&u.pathname.startsWith(p.prefix)))fail(s.sourceId,'unqualified resolved official route');}
    if(s.sourceId.startsWith('brookings')&&s.primaryOrSecondary!=='SECONDARY')fail(s.sourceId,'Brookings primary upgrade');
  }
  for(const c of b.claims){
    ref(c.caseId,projects,c.claimId);ref(c.entityId,entities,c.claimId);ref(c.scopeId,scopes,c.claimId);ref(c.previousClaimId,claims,c.claimId);
    if(!c.sourceIds.length||!c.sourceLocator)fail(c.claimId,'missing field-level provenance');
    for(const id of c.sourceIds)ref(id,sources,c.claimId);
    const primary=c.sourceIds.some(id=>sources.get(id)?.primaryOrSecondary==='PRIMARY');
    if(c.evidenceClass.startsWith('PRIMARY')&&!primary)fail(c.claimId,'secondary upgraded to primary');
    if(c.evidenceClass!==c.confidenceStatus)fail(c.claimId,'confidence basis differs');
    if(!primary&&c.value!==null&&!['SECONDARY_ESTIMATE','SECONDARY_REPORTED'].includes(c.observedOrEstimated))fail(c.claimId,'secondary-only falsely observed');
    if((c.value===null)!==(c.observedOrEstimated==='UNAVAILABLE')||(c.value===null)!==(c.evidenceClass==='UNAVAILABLE'))fail(c.claimId,'UNAVAILABLE fabricated');
    if(c.unit.startsWith('USD_')?(c.currency!=='USD'||typeof c.value!=='number'):c.currency!==null)fail(c.claimId,'currency/unit mismatch');
    if(['MW','GW'].includes(c.unit)!==(c.capacityDefinition!==null))fail(c.claimId,'capacity definition missing');
    if(c.previousClaimId){const old=claims.get(c.previousClaimId);if(old&&(old.scopeId===c.scopeId||old.effectiveDate>=c.effectiveDate||old.caseId!==c.caseId))fail(c.claimId,'version chronology invalid');}
    if(c.unit==='ENTITY')ref(c.value,entities,c.claimId);
    if(c.unit==='PERCENT'&&(typeof c.value!=='number'||c.value<0||c.value>100))fail(c.claimId,'percentage bounds');
    if(c.unit==='RELATIONSHIP'&&!['fromId','type','toId'].every(k=>typeof c.value?.[k]==='string'))fail(c.claimId,'relationship claim structure');
  }
  for(const n of ['projects','financing','ownership','obligations','power','accounting-bridges'])for(const r of b[n]){
    ref(r.caseId,projects,r.id);ref(r.scopeId,scopes,r.id);
    if(!Object.keys(r.fieldClaims).length)fail(r.id,'empty field provenance');
    const expected=read('phase3b/schemas/record-fields.json')[r.id];
    if(!expected||JSON.stringify(Object.keys(r.fieldClaims).sort())!==JSON.stringify(expected))fail(r.id,'required field-level contract changed');
    for(const ci of Object.values(r.fieldClaims)){ref(ci,claims,r.id);if(claims.get(ci)?.caseId!==r.caseId)fail(r.id,'claim from wrong case');}
    for(const k of ['issuerId','ownerId','ownedEntityId','obligorId','beneficiaryId','utilityId','entityId'])if(k in r)ref(r[k],entities,r.id);
    if(r.layer==='FINANCING_EXPOSURE'&&r.fieldClaims.issuer){const c=claims.get(r.fieldClaims.issuer);if(c.value!==r.issuerId||c.evidenceClass!==r.issuerStatus)fail(r.id,'issuer evidence mismatch');}
  }
  for(const e of b.entities)for(const ci of e.claimIds){ref(ci,claims,e.id);if(claims.get(ci)?.entityId!==e.id)fail(e.id,'entity claim mismatch');}
  const group=b.ownership.filter(o=>o.completeSet); const percent=group.map(o=>claims.get(o.fieldClaims.percentage)?.value);
  if(percent.some(v=>typeof v!=='number')||Math.abs(percent.reduce((a,v)=>a+v,0)-100)>1e-9)fail('ownership','complete ownership not 100');
  if(new Set(group.map(o=>o.ownerId)).size!==group.length)fail('ownership','duplicate owner');
  if(group.some(o=>claims.get(o.fieldClaims.percentage)?.entityId!==o.ownerId))fail('ownership','owner swapped');
  if(group.some(o=>entities.get(o.ownerId)?.entityType==='FUND_MANAGER'))fail('ownership','manager not fund owner');
  if(new Set(b.financing.map(f=>f.instrumentIdentity)).size!==b.financing.length)fail('financing','duplicate financing identity');
  if(new Set(b.projects.map(p=>p.assetIdentity)).size!==b.projects.length)fail('projects','duplicate asset as investments');
  const relationshipTypes=['OWNS','PARTIALLY_OWNS','DEVELOPS','OPERATES','LEASES','FINANCES','PURCHASES_POWER_FROM'];
  for(const r of b.relationships){
    ref(r.fromId,entities,r.id);if(!all.has(r.toId))fail(r.id,'unknown relationship target');
    const c=claims.get(r.claimId);if(!c||c.value?.fromId!==r.fromId||c.value?.toId!==r.toId||c.value?.type!==r.relationshipType||!relationshipTypes.includes(r.relationshipType))fail(r.id,'unsupported relationship');
  }
  const pairs=b.overlaps.DO_NOT_ADD_PAIRS,seen=new Set();
  for(const pair of pairs){const a=claims.get(pair.leftClaimId),z=claims.get(pair.rightClaimId);const key=[pair.leftClaimId,pair.rightClaimId].sort().join('|');if(seen.has(key))fail(pair.id,'duplicate DO_NOT_ADD pair');seen.add(key);if(!a||!z||a.caseId!==pair.caseId||z.caseId!==pair.caseId||a.unit!=='USD_BILLION'||z.unit!=='USD_BILLION'||pair.decision!=='DO_NOT_ADD'||!['NOT_COMPARABLE','SAME_ASSET_DIFFERENT_LAYER'].includes(pair.relation))fail(pair.id,'invalid DO_NOT_ADD guard');}
  for(const p of b.projects){const money=b.claims.filter(c=>c.caseId===p.id&&c.unit==='USD_BILLION');for(let i=0;i<money.length;i++)for(let j=i+1;j<money.length;j++)if(!seen.has([money[i].claimId,money[j].claimId].sort().join('|')))fail(p.id,'missing monetary anti-addition edge');}
  for(const s of b.scopes){ref(s.caseId,projects,s.scopeId);ref(s.entityId,entities,s.scopeId);for(const id of [...s.comparableTo,...s.notComparableTo])ref(id,scopes,s.scopeId);if(s.comparableTo.some(id=>s.notComparableTo.includes(id)))fail(s.scopeId,'conflicting scope compatibility');}
  for(const [a,z] of [['cost','regional-plan'],['financed-capacity','planned-capacity']]){const x=claims.get(`hyperion:${a}`),y=claims.get(`hyperion:${z}`);if(!x||!y||compatible(x,y)||x.scopeId===y.scopeId)fail('hyperion','headline scope separation lost');}
  if(claims.get('hyperion:regional-plan').operator!=='GT'||claims.get('hyperion:financed-capacity').capacityDefinition!=='UNKNOWN')fail('hyperion','bound/native definition lost');
  const fixed={ 'hyperion:rvg-threshold':[28,'CONTRACTUAL_COMMITMENT'], 'hyperion:maximum-exposure-2026':[46.03,'OBSERVED_REPORTED'], 'hyperion:lease-recognition':['FUTURE_COMMENCEMENT','OBSERVED_REPORTED'] };
  for(const [id,[value,cl]]of Object.entries(fixed))if(claims.get(id)?.value!==value||claims.get(id)?.observedOrEstimated!==cl)fail(id,'frozen financial interpretation changed');
  for(const conflict of b.conflicts)if(conflict.sourceIds.length<2||conflict.resolutionStatus!=='CONFLICT_REQUIRES_REVIEW'||!conflict.possibleExplanation)fail(conflict.id,'conflict averaged or hidden');
  if(b.selection.candidates.filter(c=>c.selected).length!==2||b.selection.candidates.some(c=>c.scores.length!==8||c.scores.some(v=>![0,1,2].includes(v))))fail('selection','selection gate invalid');
  for(const cs of b.cases){
    ref(cs.projectId,projects,cs.caseId);
    if(cs.primaryArchetype!==projects.get(cs.projectId)?.primaryArchetype)fail(cs.caseId,'archetype mismatch');
    for(const id of cs.claimIds)ref(id,claims,cs.caseId);
    for(const k of ['entityIds','financingIds','obligationIds','powerIds','accountingBridgeIds'])for(const id of cs[k])ref(id,all,cs.caseId);
    for(const id of cs.unavailableClaimIds)if(claims.get(id)?.value!==null)fail(cs.caseId,'unavailable case field fabricated');
    if(JSON.stringify([...cs.doNotAddPairIds].sort())!==JSON.stringify(pairs.filter(p=>p.caseId===cs.caseId).map(p=>p.id).sort()))fail(cs.caseId,'case overlap coverage mismatch');
  }
  const nodes=new Set(b.overlapGraph.nodes.map(n=>n.nodeId));
  if(nodes.size!==b.overlapGraph.nodes.length)fail('graph','duplicate graph node');
  for(const e of b.overlapGraph.edges)if(!nodes.has(e.fromId)||!nodes.has(e.toId)||!['MAY_OVERLAP','SAME_ASSET_DIFFERENT_LAYER','NOT_COMPARABLE'].includes(e.relationship))fail('graph','unsupported overlap graph edge');
  for(const pair of pairs)if(!b.overlapGraph.edges.some(e=>e.evidencePairId===pair.id))fail('graph','missing anti-addition graph edge');
  const forbidden=/^(?:aiRoi|roi|roic|irr|npv|payback|hiddenDebt|hiddenLeverageScore|systemicRiskScore|totalAiInvestment|expectedLoss|aggregateInvestment)$/i;
  const walk=v=>{if(Array.isArray(v))return v.forEach(walk);if(v&&typeof v==='object')for(const[k,x]of Object.entries(v)){if(forbidden.test(k)||(k==='field'&&forbidden.test(x)))fail(k,'prohibited aggregate/return inference');walk(x);}};walk(b);
  return {valid:!errors.length,errors};
}
export function summary(b){const v=validate(b);return {...v,counts:Object.fromEntries(collections.map(n=>[n,b[n].length])),doNotAddPairs:b.overlaps.DO_NOT_ADD_PAIRS.length,archivedSourceCount:b.sources.filter(s=>s.SHA256).length,archivedBytes:b.sources.reduce((n,s)=>n+s.byteSize,0),contentHash:economicIdentity(b),foundationValid:foundationValidate(foundationLoad()).valid};}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){const result=summary(load());console.log(JSON.stringify(result,null,2));if(!result.valid||!result.foundationValid)process.exitCode=1;}
