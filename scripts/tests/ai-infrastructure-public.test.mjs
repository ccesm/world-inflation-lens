import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createHash} from 'node:crypto'
import snapshot from '../../src/data/ai-infrastructure/monitor.json' with {type:'json'}
import {snapshotSha256,projectionHash,panelHash,validInfrastructureSnapshot,publicSourceURL,projectCompanies} from '../../src/data/ai-infrastructure/contract.js'
import {infrastructureCopy as copy} from '../../src/i18n/aiInfrastructure.js'
import {routes,primaryRoutes,routeFromHash} from '../../src/utils/routing.js'
import {iaCopy,sectionLinks} from '../../src/i18n/architecture.js'
import {pageResearchContext,structuralThemes} from '../../src/data/researchArchitecture.js'
const read=f=>fs.readFileSync(new URL('../../'+f,import.meta.url),'utf8')
const hash=s=>createHash('sha256').update(s).digest('hex')
const mutate=fn=>{const d=structuredClone(snapshot);fn(d);return d}
test('approved bytes, size, provenance and content identity',()=>{
 const bytes=read('src/data/ai-infrastructure/monitor.json');assert.equal(Buffer.byteLength(bytes),31650);assert.equal(hash(bytes),snapshotSha256)
 assert.equal(snapshot.projectionHash,projectionHash);assert.equal(snapshot.researchPanelHash,panelHash)
 const content={...snapshot};delete content.projectionHash
 function canonical(v){return Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v}
 assert.equal(hash(JSON.stringify(canonical(content))),projectionHash)
 assert(validInfrastructureSnapshot(snapshot))
})
test('seven projects, asymmetric company coverage and comparative case',()=>{
 assert.deepEqual(Object.fromEntries(snapshot.projects.map(p=>[p.projectId,p.companyId])),projectCompanies)
 assert.equal(snapshot.projects.filter(p=>p.companyId==='MSFT').length,2);assert.equal(snapshot.projects.filter(p=>p.companyId==='GOOG').length,0)
 assert.equal(snapshot.projects.find(p=>p.projectId==='polaris-forge-1').role,'COMPARATIVE_REFERENCE')
 assert.equal(snapshot.summary.factCount,23);assert.equal(snapshot.sources.length,14)
 assert.deepEqual(snapshot.summary.statusCounts,{OPERATIONAL:1,PARTIALLY_OPERATIONAL:1,PLANNED:1,UNDER_CONSTRUCTION:4})
})
test('route uniqueness, required existing routes and lazy wiring',()=>{
 assert.equal(new Set(routes).size,routes.length)
 for(const r of ['home','dollar','fiscal','history','scenarios','research','research/ai-productivity','research/ai-labor','research/ai-capex','research/signal-engine','research/ai-infrastructure'])assert.equal(routeFromHash('#/'+r),r)
 assert.deepEqual(primaryRoutes,['home','dollar','fiscal','history','scenarios','research'])
 assert.match(read('src/App.jsx'),/const AiInfrastructure = lazy\(\(\) => import/)
 assert(sectionLinks.research.some(([href])=>href==='#/research/ai-infrastructure'))
 for(const lang of ['en','zh'])assert.equal(iaCopy[lang].nav['research/ai-infrastructure'],copy.page.title[lang])
 assert.equal(pageResearchContext['research/ai-infrastructure'].theme,'capacity')
 assert(structuralThemes.find(t=>t.id==='capacity').routes.some(r=>r.href==='#/research/ai-infrastructure'))
})
test('bilingual copy recursively complete and exact four sections',()=>{
 function visit(v){if(v&&typeof v==='object'){if(Object.hasOwn(v,'en')){assert.deepEqual(Object.keys(v).sort(),['en','zh']);assert(v.en.length&&v.zh.length)}else Object.values(v).forEach(visit)}}visit(copy);visit(snapshot.projects);visit(snapshot.sources)
 assert.deepEqual(Object.keys(copy.sections),['landscape','financing','power','boundaries'])
 assert.equal(copy.sections.financing.zh,'建设如何融资')
 assert.match(copy.disclosures.doubleCount.en,/should not be added together/);assert.match(copy.disclosures.doubleCount.zh,/不应直接相加/)
 assert.match(copy.disclosures.guarantee.en,/not debt, expected loss or expected payment/)
 assert.match(copy.disclosures.maximumExposure.zh,/不等于债务、预期损失或预期付款/)
})
test('native capacities, power separation and Fairwater caveat',()=>{
 const p=id=>snapshot.projects.find(p=>p.projectId===id)
 assert.deepEqual(p('polaris-forge-1').capacityDisplay.map(f=>[f.value,f.unit,f.status]),[[400,'MW','CONTRACTED'],[175,'MW','LIVE_REPORTED']])
 assert.equal(p('hyperion').capacityDisplay[0].value,5);assert.equal(p('hyperion').capacityDisplay[0].status,'PLANNED')
 assert.deepEqual(p('hyperion').powerSummary.map(f=>[f.value,f.unit,f.operator]),[[5200,'MW','GT'],[2500,'MW','LTE']])
 assert(p('fairwater').publicNotes.some(n=>n.en.includes('completion timelines have changed')))
 assert.equal(p('fairwater').statusEffectiveDate,'2025-09-18');assert.equal(p('jupiter').statusSourceDate,null)
 for(const p of snapshot.projects)for(const f of [...p.capacityDisplay,...p.powerSummary]){assert.equal(f.comparabilityStatus,'UNKNOWN');assert(f.scope.en);assert(f.shortDefinition.zh);assert(f.sourceRefs.length)}
})
test('all financing and ownership stay unknown without amounts',()=>{
 assert(snapshot.projects.every(p=>p.primaryArchetype==='UNKNOWN'&&p.ownershipStatus==='NOT_YET_QUALIFIED'&&!p.financingFeatures.length&&!p.secondaryFeatures.length))
 assert.deepEqual(snapshot.archetypeSummary,{UNKNOWN:7})
 assert.doesNotMatch(JSON.stringify(snapshot.projects),/Beignet|2\.064|20%|80%|\$|27\.3|46\.03|12\.31|debtAmount|ownershipPercent/)
 for(const id of ['midlothian','red-oak','abilene','canton'])assert(!snapshot.projects.some(p=>p.projectId===id))
})
for(const [name,fn] of Object.entries({
 'research-only':d=>d.projects[0].publicationStatus='RESEARCH_ONLY',
 'review-required':d=>d.projects[0].projectStatus='REVIEW_REQUIRED',
 'not-public':d=>d.projects[0].publicationStatus='NOT_PUBLIC',
 'conflicting':d=>d.projects[0].statusHistory[0].value='CONFLICTING',
 'local path':d=>d.projects[0].publicNotes[0].en='/Users/operator/cache',
 'cache path':d=>d.projects[0].publicNotes[0].en='wil-ai-infrastructure-cache',
 'file URL':d=>d.sources[0].publicURL='file:///tmp/cache',
 'private URL':d=>d.sources[0].publicURL='https://name:secret@www.oracle.com/file',
 'wrong host':d=>d.sources[0].publicURL='https://example.com/file',
 'wrong CDN tenant':d=>d.sources[0].publicURL='https://s21.q4cdn.com/000000000/file.pdf',
 'signed URL':d=>d.sources[0].publicURL+='?token=secret',
 'duplicate project':d=>d.projects[1].projectId=d.projects[0].projectId,
 'unknown company':d=>d.projects[0].companyId='OTHER',
 'Polaris misassignment':d=>d.projects.at(-1).companyId='ORCL',
 'missing scope':d=>delete d.projects[3].capacityDisplay[0].scope,
 'future source':d=>d.sources[0].availableFrom='2026-10-08',
 'invalid date':d=>d.projects[0].statusEffectiveDate='2026-02-30',
 'financing amount':d=>d.projects[0].debtAmount=27.3,
 'ownership percentage':d=>d.projects[0].ownershipPercent=20,
 'nested dollar amount':d=>d.projects[0].publicNotes[0].en='$27 billion financing',
 'aggregate amount':d=>d.summary.totalInvestment=100,
 'maximum exposure':d=>d.projects[0].maximumExposure=46.03,
 'ROI':d=>d.projects[0].aiROI=0.5,
 'score':d=>d.projects[0].riskScore=9,
 'legal graph':d=>d.projects[0].entities=['Beignet'],
 'missing source':d=>d.projects[0].publicSourceRefs=['missing'],
 'duplicate source':d=>d.sources[1].sourceId=d.sources[0].sourceId,
 'null capacity':d=>d.projects[3].capacityDisplay[0].value=null,
 'unknown definition':d=>d.projects[3].capacityDisplay[0].capacityDefinition='COMMON_TOTAL_GW',
 'unknown field':d=>d.projects[0].internalNotes='notes',
 'unexpected root':d=>d.reviewQueue=[],
 'mutated identity':d=>d.projectionHash='0'.repeat(64)
}))test(`fail closed: ${name}`,()=>assert.equal(validInfrastructureSnapshot(mutate(fn)),false))
test('official sources and all material fact references resolve',()=>{
 const ids=new Set(snapshot.sources.map(s=>s.sourceId));assert(snapshot.sources.every(s=>publicSourceURL(s.publicURL)))
 for(const p of snapshot.projects)for(const f of [...p.statusHistory,...p.capacityDisplay,...p.powerSummary])for(const id of f.sourceRefs)assert(ids.has(id))
})
test('runtime component has no API, automation, scores or economic calculations',()=>{
 const page=read('src/pages/AiInfrastructure.jsx');assert.doesNotMatch(page,/fetch\(|XMLHttpRequest|api.github|VITE_|token|setInterval|reduce\(|\.sort\(/)
 assert.match(page,/data-do-not-add/);assert.match(page,/scope="col"/);assert.match(page,/scope="row"/);assert.match(page,/role="region"/);assert.match(page,/aria-live="polite"/)
 assert.match(page,/target="_blank" rel="noopener noreferrer"/);assert.match(page,/href="#\/research\/ai-capex"/)
})
test('AI CapEx identity, version and workflows preserved',()=>{
 assert.equal(hash(read('src/data/ai-capex/monitor.json')),'8891e6b7dca9317e3d2400bdd3749c54425ff1c0385c1f2151e2593c92227c3a')
 assert.equal(JSON.parse(read('package.json')).version,'1.4.0');assert.match(read('src/pages/AiCapex.jsx'),/href="#\/research\/ai-infrastructure"/)
})
