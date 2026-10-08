import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {createHash} from 'node:crypto'
import {infrastructurePaper as paper} from '../../src/data/ai-infrastructure/paper.js'
import {paperCopy as copy} from '../../src/i18n/aiInfrastructurePaper.js'
import snapshot from '../../src/data/ai-infrastructure/monitor.json' with {type:'json'}
import {validInfrastructureSnapshot,snapshotSha256} from '../../src/data/ai-infrastructure/contract.js'
const read=path=>fs.readFileSync(new URL('../../'+path,import.meta.url),'utf8')
test('exact original paper, affiliation, draft, conference, PDF and prior research source',()=>{
 assert.equal(paper.metadata.title,'Financing the AI Buildout')
 assert.deepEqual(paper.metadata.authors,['Stijn Van Nieuwerburgh'])
 assert.equal(paper.metadata.affiliation,'Columbia Business School')
 assert.equal(paper.metadata.draftDate,'2026-09-04')
 assert.deepEqual(paper.metadata.conferenceDates,['2026-09-24','2026-09-25'])
 assert.equal(paper.metadata.canonicalURL,'https://www.brookings.edu/articles/financing-the-ai-buildout/')
 assert.equal(paper.metadata.pdfURL,'https://www.brookings.edu/wp-content/uploads/2026/09/4c_Van-Nieuwerburgh.pdf')
 assert.equal(paper.metadata.pdfSha256,'bf96f1e528b10dcd8cb1ab52bfad45f100efa1d7462b2af75f9bb4bda668bbc4')
 assert.equal(paper.metadata.priorSourceCommit,'81b546b847e39b0314a61cbad357a62a9495a18c')
})
test('explicitly printed numeric chart inputs; no digitization or invented series',()=>{
 const values=id=>paper.charts.find(c=>c.id===id).observationIds.map(id=>paper.observations.find(o=>o.id===id).value)
 assert.deepEqual(values('campus'),[2.2,.4,5.6])
 assert.deepEqual(values('cash'),[96.8,252.2,130.9,289.9,158.3,288.3,153.8,377.9,240.4,478.5,415.8,603.2,800.5,707.1])
 assert.deepEqual(values('booms'),[.66,2.24,.5,1.13,1.1,3.63])
 assert.equal(paper.observations.length,31);assert.equal(paper.charts.length,3)
 assert.equal(paper.observations.find(o=>o.id==='campus-total').value,8.2)
 assert.equal(paper.observations.find(o=>o.id==='campus-load').value,200)
 assert.deepEqual(paper.observations.filter(o=>o.metric==='spendingWeight').map(o=>o.value),[10,25,40,25])
 assert(paper.observations.filter(o=>['costGrowth','nominalGDPGrowth'].includes(o.metric)).every(o=>o.value===4))
 assert.deepEqual(paper.charts.map(c=>[c.pdfPage,c.locator]),[[5,'Section II, printed p. 4; Appendix A'],[7,'Figure 1, printed p. 6 and notes'],[6,'Table 1, printed p. 5; Appendix C, pp. 23–25']])
})
test('every numeric observation carries native scope, unit, period, classification and paper version',()=>{
 const ids=new Set()
 for(const o of paper.observations){assert(!ids.has(o.id));ids.add(o.id);assert.equal(o.provenance,'ACADEMIC_PAPER');assert.equal(o.paperVersion,'2026-09-04');assert(o.scope&&o.period&&o.locator);assert(['USD_BILLION','PERCENT_GDP','MW','PERCENT_PER_YEAR','PERCENT'].includes(o.unit));assert(Number.isFinite(o.value));assert(copy.classifications[o.classification]);assert(copy.metrics[o.metric])}
 for(const c of paper.charts)assert(c.observationIds.every(id=>ids.has(id)))
 assert(paper.observations.filter(o=>o.period==='2026').every(o=>o.classification==='PAPER_MIXED_ESTIMATE'))
 assert.equal(paper.observations.find(o=>o.id==='boom-ai').classification,'PAPER_SCENARIO')
 assert.match(copy.charts.cash.note.en,/non-AI.*leased.*four-company/s)
 assert.match(copy.charts.booms.note.en,/not harmonized.*4%.*10\/25\/40\/25%.*replacement/s)
 assert.match(copy.charts.campus.subtitle.en,/total electrical load/)
})
test('all editorial copy is paired; summary, findings, source notes and assessment coverage complete',()=>{
 const visit=v=>{if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v==='object'){if(Object.hasOwn(v,'en')){assert.deepEqual(Object.keys(v).sort(),['en','zh']);assert(v.en.trim()&&v.zh.trim())}else Object.values(v).forEach(visit)}}
 visit(copy);assert.equal(copy.summary.length,4);assert.equal(paper.findings.length,4)
 for(const locator of [...copy.summaryLocators,...paper.findings.map(f=>f.locator),...paper.charts.map(c=>c.locator),...paper.comparisons.map(c=>c.paperLocator)])assert(copy.locators[locator]?.zh)
 for(const f of paper.findings){assert(copy.findings[f.id]);assert.equal(f.provenance,'ACADEMIC_PAPER');assert(f.locator)}
 for(const c of paper.comparisons){assert(copy.comparisons[c.id]);assert(copy.assessments[c.assessment]);assert(c.paperLocator);assert.equal(c.paperProvenance,'ACADEMIC_PAPER');assert.equal(c.evidenceProvenance,'WORLD_INFLATION_LENS_QUALIFIED');assert(c.evidenceProjectIds.every(id=>snapshot.projects.some(p=>p.projectId===id)))}
 assert.deepEqual(paper.comparisons.map(c=>c.assessment),['SUPPORTED_IN_DIRECTION','PARTIALLY_SUPPORTED','NOT_INDEPENDENTLY_VERIFIED','NOT_COMPARABLE','OUTSIDE_CURRENT_DATASET'])
 assert.match(copy.comparisons.funding.evidence.en,/seven.*UNKNOWN.*zero/)
})
test('citation laundering fails: paper observations and classifications cannot enter project data',()=>{
 const d=structuredClone(snapshot);d.projects[0].capacityDisplay.push(paper.observations[0]);assert(!validInfrastructureSnapshot(d))
 const claim=structuredClone(snapshot);claim.projects[0].publicationStatus='ACADEMIC_PAPER';assert(!validInfrastructureSnapshot(claim))
 assert(!read('src/data/ai-infrastructure/contract.js').includes('paper.js'))
 assert(!read('src/data/ai-infrastructure/paper.js').includes('monitor.json'))
 assert(!read('src/components/AiInfrastructurePaper.jsx').includes('ProjectCard'))
})
test('frozen qualified bytes, project count, UNKNOWN structures, exclusions and Polaris are unchanged',()=>{
 assert.equal(createHash('sha256').update(read('src/data/ai-infrastructure/monitor.json')).digest('hex'),snapshotSha256)
 assert.equal(snapshot.projects.length,7);assert(snapshot.projects.every(p=>p.primaryArchetype==='UNKNOWN'))
 assert.doesNotMatch(JSON.stringify(snapshot),/Beignet|2\.064|20%|80%|27\.3|12\.31|46\.03/)
 assert.deepEqual(snapshot.projects.find(p=>p.projectId==='polaris-forge-1').capacityDisplay.map(f=>f.value),[400,175])
})
test('layout and provenance boundary, semantic fallback, source accessibility and no runtime calls',()=>{
 const page=read('src/pages/AiInfrastructure.jsx'),component=read('src/components/AiInfrastructurePaper.jsx')
 assert(page.indexOf('<AiInfrastructurePaper')<page.indexOf('data-independent-divider'))
 assert(page.indexOf('data-independent-divider')<page.indexOf('data-page="ai-infrastructure"'))
 assert.match(page,/data-provenance="WORLD_INFLATION_LENS_QUALIFIED"/)
 assert.match(component,/data-provenance="ACADEMIC_PAPER"/);assert.match(component,/data-paper-comparison/)
 assert.match(component,/scope="col"/);assert.match(component,/scope="row"/);assert.match(component,/role="img" aria-label/);assert.match(component,/target="_blank" rel="noopener noreferrer"/)
 assert.doesNotMatch(component,/fetch\(|XMLHttpRequest|api.github|VITE_|setInterval|monitor.json/)
 assert.doesNotMatch(read('src/data/ai-infrastructure/paper.js'),/\/Users\/|file:\/\/|cache\/objects|totalAIInvestment|aiROI|riskScore|leverageScore/)
 assert.equal(JSON.parse(read('package.json')).version,'1.4.0')
})
test('polish preserves numeric file identity and detailed comparison copy',()=>{
 assert.equal(createHash('sha256').update(read('src/data/ai-infrastructure/paper.js')).digest('hex'),'b8d8db448d0a6843fcbc6e5b3d05791099f8cc9b4248b6133c65a30e0c7a10f9')
 assert.equal(createHash('sha256').update(JSON.stringify(copy.comparisons)).digest('hex'),'c45e8c89d61b79982fe9d12c53f2d5b16a893608212258932375053f9914b960')
})
test('two-block summary and macro hierarchy use cautious bilingual copy and explicit chart distinctions',()=>{
 const component=read('src/components/AiInfrastructurePaper.jsx')
 assert(component.indexOf('data-bottom-line')<component.indexOf('data-macro-part="1"'))
 assert(component.indexOf('data-macro-part="1"')<component.indexOf('data-macro-part="2"'))
 assert.match(component,/data-bottom-evidence="paper" data-provenance="ACADEMIC_PAPER"/)
 assert.match(component,/data-bottom-evidence="qualified" data-provenance="WORLD_INFLATION_LENS_QUALIFIED"/)
 for(const lang of ['en','zh'])assert(copy.polish.paper[lang]!==copy.summary[0][lang])
 assert.match(copy.polish.paper.en,/argues.*may/s);assert.match(copy.polish.evidence.en,/support the direction.*do not independently verify/s)
 assert.match(copy.polish.mixed.en,/2026.*reported.*guidance.*Wall Street/)
 assert.match(copy.polish.scenario.en,/AI 2025–2032.*scenario.*historical/s)
 assert.match(component,/data-campus-total/);assert.match(component,/data-mixed-estimate/);assert.match(component,/data-ai-scenario/)
 assert.equal(copy.polish.bottomLine.zh,'核心结论')
})
