import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {load,validate,summary,economicIdentity,compatible} from '../scripts/validate-phase3b.mjs';
import {root} from '../scripts/validate.mjs';
import {retrieve,sha256,versionState,allowed} from '../hydration/archive.mjs';
const fresh=()=>structuredClone(load());
const c=(b,id)=>b.claims.find(c=>c.claimId===id);
const bad=(mutate,pattern)=>{const b=fresh();mutate(b);const v=validate(b);assert.equal(v.valid,false);assert.match(v.errors.join('\n'),pattern);};
test('three bounded case registries and hydrated sources qualify without financial aggregation',()=>{const s=summary(fresh());assert.equal(s.valid,true,s.errors.join('\n'));assert.equal(s.foundationValid,true);assert.equal(s.counts.projects,3);assert.equal(s.counts.claims,159);assert.equal(s.archivedSourceCount,21);assert.equal(s.archivedBytes,10917294);assert.equal(s.doNotAddPairs,62);});
const mutations=[
 ['duplicate project',b=>b.projects.push(b.projects[0]),/duplicate ID/],
 ['duplicate claim',b=>b.claims.push(b.claims[0]),/duplicate ID/],
 ['field provenance missing',b=>delete b.projects[0].fieldClaims.cost,/field-level contract/],
 ['unknown source',b=>c(b,'hyperion:cost').sourceIds=['none'],/unknown reference/],
 ['missing locator',b=>c(b,'hyperion:cost').sourceLocator='',/empty|missing field/],
 ['wrong claim case',b=>b.projects[0].fieldClaims.cost='fairwater:pledge',/wrong case/],
 ['source hash invalid',b=>b.sources[1].SHA256='fake',/source hash/],
 ['raw identity not hydrated',b=>b.sources[1].byteSize=0,/archived identity/],
 ['secondary falsely primary',b=>c(b,'hyperion:financed-capacity').evidenceClass='PRIMARY_VERIFIED',/secondary upgraded/],
 ['secondary observed accounting',b=>c(b,'hyperion:financed-capacity').observedOrEstimated='OBSERVED_REPORTED',/secondary-only/],
 ['Brookings cannot be primary',b=>b.sources[1].primaryOrSecondary='PRIMARY',/primary\/secondary|Brookings/],
 ['unknown entity',b=>b.financing[0].issuerId='missing',/unknown reference|issuer evidence/],
 ['wrong issuer grade',b=>b.financing[0].issuerStatus='PRIMARY_VERIFIED',/issuer evidence/],
 ['manager not fund owner',b=>b.ownership[1].ownerId='blue-owl-manager',/owner swapped|manager/],
 ['ownership above100',b=>c(b,'hyperion:ownership-meta').value=120,/percentage bounds|ownership/],
 ['owner percentage swapped',b=>{[b.ownership[0].ownerId,b.ownership[1].ownerId]=[b.ownership[1].ownerId,b.ownership[0].ownerId];},/owner swapped/],
 ['duplicate instrument',b=>b.financing[1].instrumentIdentity=b.financing[0].instrumentIdentity,/duplicate financing/],
 ['same physicalasset second investment',b=>b.projects[1].assetIdentity=b.projects[0].assetIdentity,/duplicate asset/],
 ['27vs50 scope separation',b=>c(b,'hyperion:regional-plan').scopeId=c(b,'hyperion:cost').scopeId,/headline scope/],
 ['2.064vs5 scope separation',b=>c(b,'hyperion:financed-capacity').scopeId=c(b,'hyperion:planned-capacity').scopeId,/headline scope/],
 ['capacity definition cannot disappear',b=>c(b,'hyperion:planned-capacity').capacityDefinition=null,/capacity definition/],
 ['regional lowerbound retained',b=>c(b,'hyperion:regional-plan').operator='EQ',/bound\/native/],
 ['USD native currency',b=>c(b,'hyperion:cost').currency='EUR',/currency\/unit/],
 ['lease is not current debt',b=>c(b,'hyperion:lease-recognition').value='CURRENT_DEBT',/frozen financial/],
 ['maximum exposure is not debt',b=>c(b,'hyperion:maximum-exposure-2026').observedOrEstimated='TRANSACTION_VALUE',/frozen financial/],
 ['guarantee expectedloss field rejected',b=>b.obligations[1].expectedLoss=28,/unexpected|prohibited/],
 ['unsupported transaction relation',b=>b.relationships[0].relationshipType='LENDS_TO',/unsupported relationship/],
 ['relationship co-mention insufficient',b=>b.relationships[0].fromId='pimco-funds',/unsupported relationship/],
 ['anti-addition cannot disappear',b=>b.overlaps.DO_NOT_ADD_PAIRS.pop(),/missing monetary|coverage/],
 ['no cross-case anti-addition lie',b=>b.overlaps.DO_NOT_ADD_PAIRS[0].rightClaimId='fairwater:pledge',/invalid DO_NOT_ADD/],
 ['no capital stacksum',b=>b.overlaps.aggregationAllowed=true,/frozen contract/],
 ['conflict maynot be averaged',b=>b.conflicts[0].resolutionStatus='AVERAGED',/conflict averaged/],
 ['unavailable not zero',b=>c(b,'hyperion:debt-coupon').value=0,/UNAVAILABLE fabricated/],
 ['archetype audit consistency',b=>b.cases[0].primaryArchetype='CORPORATE_OWNED',/archetype mismatch/],
 ['case registry references',b=>b.cases[0].financingIds=['not-a-financing'],/unknown reference/],
 ['no investment-quality screening',b=>b.selection.candidates[0].scores[0]=10,/selection gate/],
 ['no ROI field',b=>b.projects[0].aiRoi=1,/unexpected|prohibited/],
 ['no return claim',b=>c(b,'hyperion:debt-coupon').field='aiRoi',/prohibited/],
 ['no hidden leverage',b=>b.projects[0].hiddenLeverageScore=1,/unexpected|prohibited/],
 ['no systemicrisk score',b=>b.projects[0].systemicRiskScore=1,/unexpected|prohibited/],
 ['graph edges validated',b=>b.overlapGraph.edges[0].toId='absent',/graph edge/],
];
for(const [name,m,rx]of mutations)test(name,()=>bad(m,rx));
test('compatible requires exact native scopes and definitions; no conversion by unit alone',()=>{const b=fresh();assert.equal(compatible(c(b,'hyperion:cost'),c(b,'hyperion:regional-plan')),false);assert.equal(compatible(c(b,'hyperion:planned-capacity'),c(b,'hyperion:financed-capacity')),false);assert.equal(compatible(c(b,'polaris-forge-1:live-capacity'),c(b,'polaris-forge-1:contracted-capacity')),false);});
test('original and later accounting versions retained; no residual funding inference',()=>{const b=fresh();assert.equal(c(b,'hyperion:equity-2025').value,1.83);assert.equal(c(b,'hyperion:equity-2026').value,2.92);assert.equal(c(b,'hyperion:maximum-exposure-2025').value,45.95);assert.equal(c(b,'hyperion:maximum-exposure-2026').previousClaimId,'hyperion:maximum-exposure-2025');assert.equal(c(b,'hyperion:debt-recourse').value,null);});
test('economicidentity excludes retrieval clock but includes bytes/claims/rules',()=>{const a=fresh(),b=fresh();for(const s of b.sources)s.retrievedAt='2099-01-01T00:00:00Z';assert.equal(economicIdentity(a),economicIdentity(b));c(b,'hyperion:cost').value=99;assert.notEqual(economicIdentity(a),economicIdentity(b));});
test('fresh-process byte stable output and cwd independence',()=>{const command=path.join(root,'scripts/validate-phase3b.mjs');assert.deepEqual(execFileSync(process.execPath,[command],{cwd:'/tmp'}),execFileSync(process.execPath,[command],{cwd:root}));});
test('immutable source states distinguish changedbytes and amendments',()=>{assert.equal(versionState(null,'a'),'FIRST_ARCHIVE');assert.equal(versionState({sha256:'a'},'a'),'UNCHANGED_HASH');assert.equal(versionState({sha256:'a'},'b'),'CHANGED_BYTES');assert.equal(versionState({sha256:'a'},'b',true),'AMENDED_DOCUMENT');});
test('hash is SHA256 of bytes not machine path',()=>assert.equal(sha256(Buffer.from('abc')),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'));
const src={id:'control',url:'https://issuer.example/report',documentType:'HTML',identityMarkers:['Issuer financial'],allowedRoutes:[{host:'issuer.example',prefix:'/'}]};
const html=text=>new Response('<!doctype html><html>'+text+'</html>',{status:200,headers:{'content-type':'text/html'}});
async function fixture(fn){const cache=fs.mkdtempSync(path.join(os.tmpdir(),'wil-infra-test-'));try{await fn(cache);}finally{fs.rmSync(cache,{recursive:true,force:true});}}
test('archive retains changedrawbytes alongside original and requires review',()=>fixture(async cache=>{const a=await retrieve(src,{cache,clock:'2026-01-01',fetcher:async()=>html('Issuer financial original')});const b=await retrieve(src,{cache,clock:'2026-02-01',prior:[a],fetcher:async()=>html('Issuer financial revised')});assert.notEqual(a.sha256,b.sha256);assert.equal(b.identityState,'CHANGED_BYTES');assert.equal(b.qualificationStatus,'REVIEW_REQUIRED');for(const r of [a,b])assert.equal(sha256(fs.readFileSync(path.join(cache,'objects',r.sha256.slice(0,2),r.sha256))),r.sha256);}));
test('repeat same raw source is idempotent with same vintageidentity',()=>fixture(async cache=>{const opts={cache,clock:'2026-01-01',fetcher:async()=>html('Issuer financial')};const a=await retrieve(src,opts),b=await retrieve(src,{...opts,prior:[a]});assert.equal(b.identityState,'UNCHANGED_HASH');assert.equal(a.sourceVersionId,b.sourceVersionId);}));
test('403 stops samehost; distinct issuer remains independent',()=>fixture(async cache=>{const blocked=new Set();let count=0;const f=async()=>{count++;return new Response('',{status:403});};const a=await retrieve(src,{cache,blocked,clock:'2026-01-01',fetcher:f});const b=await retrieve(src,{cache,blocked,clock:'2026-01-01',fetcher:f});assert.equal(a.qualificationStatus,'ACCESS_BLOCKED');assert.equal(b.error,'ACCESS_BLOCKED_HOST_STOP');assert.equal(count,1);const other={...src,url:'https://other.example/report',allowedRoutes:[{host:'other.example',prefix:'/'}]};assert.equal((await retrieve(other,{cache,blocked,clock:'2026-01-01',fetcher:async()=>html('Issuer financial')})).qualificationStatus,'CONTENT_VALIDATED');}));
test('429 records RetryAfter and no unbounded automatic retry',()=>fixture(async cache=>{let n=0;const r=await retrieve(src,{cache,clock:'2026-01-01',fetcher:async()=>{n++;return new Response('',{status:429,headers:{'Retry-After':'60'}});}});assert.equal(n,1);assert.equal(r.retryAfter,'60');assert.equal(r.qualificationStatus,'ACCESS_BLOCKED');}));
test('redirect to unqualified host rejected before fetch',()=>fixture(async cache=>{let n=0;const r=await retrieve(src,{cache,clock:'2026-01-01',fetcher:async()=>{n++;return new Response('',{status:302,headers:{location:'https://bad.example/a'}});}});assert.equal(r.error,'REDIRECT_REJECTED');assert.equal(n,1);}));
test('delegated Meta tenant stays issuer bound',()=>{const b=fresh(),s=b.sourcePlan.find(s=>s.id==='meta-jv-pdf');assert.equal(allowed(s.url,s.allowedRoutes),true);assert.equal(allowed('https://s21.q4cdn.com/wrong-tenant/file.pdf',s.allowedRoutes),false);assert.equal(allowed('https://user:password@s21.q4cdn.com/399680738/a.pdf',s.allowedRoutes),false);});
test('HTTP200 challenge rejected',()=>fixture(async cache=>{const r=await retrieve(src,{cache,clock:'2026-01-01',fetcher:async()=>html('Issuer financial verify you are human')});assert.equal(r.error,'CONTENT_MISMATCH');assert.equal(r.sha256,null);}));
test('wrong issuer rejected',()=>fixture(async cache=>assert.equal((await retrieve(src,{cache,clock:'2026-01-01',fetcher:async()=>html('Different issuer')})).error,'ISSUER_MISMATCH')));
test('MIME and PDF signature rejected',()=>fixture(async cache=>assert.equal((await retrieve({...src,documentType:'PDF'},{cache,clock:'2026-01-01',fetcher:async()=>html('Issuer financial')})).error,'CONTENT_MISMATCH')));
test('bounded response rejects oversized source without caching',()=>fixture(async cache=>{const r=await retrieve(src,{cache,clock:'2026-01-01',fetcher:async()=>new Response('x',{headers:{'content-length':'20000000'}})});assert.equal(r.error,'SIZE_REJECTED');assert.equal(r.sha256,null);}));
test('Phase3A frozen records, schemas and tests remain byte unchanged',()=>{const names=execFileSync('git',['diff','--name-only','81b546b847e39b0314a61cbad357a62a9495a18c','--','research/ai-infrastructure-financing/data/projects.json','research/ai-infrastructure-financing/data/entities.json','research/ai-infrastructure-financing/data/financing.json','research/ai-infrastructure-financing/data/obligations.json','research/ai-infrastructure-financing/data/sources.json','research/ai-infrastructure-financing/schemas','research/ai-infrastructure-financing/scripts/validate.mjs','research/ai-infrastructure-financing/tests/foundation.test.mjs'],{encoding:'utf8'});assert.equal(names.trim(),'');});
test('production and prior research preserved',()=>{const names=execFileSync('git',['diff','--name-only','81b546b847e39b0314a61cbad357a62a9495a18c','--','src','public','data','scripts','.github','package.json','package-lock.json','research/signal-engine','research/ai-capex-monetization'],{encoding:'utf8'});assert.equal(names.trim(),'');});
