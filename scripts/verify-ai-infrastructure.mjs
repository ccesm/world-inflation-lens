import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {spawnSync} from 'node:child_process'
import {join,resolve} from 'node:path'
import {pathToFileURL} from 'node:url'
import {build} from 'vite'
import React from 'react'
import {renderToReadableStream} from 'react-dom/server'
import snapshot from '../src/data/ai-infrastructure/monitor.json' with {type:'json'}
import {infrastructureCopy as copy} from '../src/i18n/aiInfrastructure.js'
import {paperCopy} from '../src/i18n/aiInfrastructurePaper.js'
const root=resolve(import.meta.dirname,'..')
const tests=spawnSync(process.execPath,['--test','scripts/tests/ai-infrastructure-public.test.mjs','scripts/tests/ai-infrastructure-paper.test.mjs'],{cwd:root,encoding:'utf8'})
process.stdout.write(tests.stdout);process.stderr.write(tests.stderr);assert.equal(tests.status,0)
const temp=await fs.mkdtemp(join(root,'node_modules','.wil-infrastructure-'))
const forbidden=/RESEARCH_ONLY|REVIEW_REQUIRED|NOT_PUBLIC|CONFLICTING|~\/Users\/|\/Users\/|wil-ai-|research\/ai-infrastructure-financing|Beignet|2\.064|20%|80%|46\.03|12\.31|27\.3/;
try {
 await build({configFile:false,root,logLevel:'error',build:{ssr:'src/pages/AiInfrastructure.jsx',outDir:temp,minify:false}})
 const {AiInfrastructure}=await import(pathToFileURL(join(temp,'AiInfrastructure.js')))
 for(const language of ['en','zh']){
  const render=async data=>{const stream=await renderToReadableStream(React.createElement(AiInfrastructure,{language,data}));await stream.allReady;return new Response(stream).text()}
  const html=await render(snapshot)
  const text=html.replace(/<!--.*?-->/gs,'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&')
  assert.equal((html.match(/data-project=/g)||[]).length,7);assert.equal((html.match(/data-financing="UNKNOWN"/g)||[]).length,7)
  assert.equal((html.match(/data-do-not-add/g)||[]).length,2)
  assert.equal((html.match(/data-paper-section=/g)||[]).length,4)
  assert.equal((html.match(/<h2(?:\s[^>]*)?>/g)||[]).length,8)
  assert.equal((html.match(/data-bottom-evidence=/g)||[]).length,2)
  assert.equal((html.match(/data-macro-part=/g)||[]).length,3)
  assert(html.indexOf('data-bottom-line')<html.indexOf('data-paper-section="paper"'))
  for(const value of [paperCopy.polish.paper,paperCopy.polish.evidence,paperCopy.polish.campusTotal,paperCopy.polish.mixed,paperCopy.polish.scenario])assert(text.includes(value[language]))
  assert.equal((html.match(/data-paper-chart=/g)||[]).length,3)
  assert.equal((html.match(/data-paper-comparison=/g)||[]).length,5)
  assert(html.indexOf('data-infrastructure-paper')<html.indexOf('data-independent-divider'))
  assert(html.indexOf('data-independent-divider')<html.indexOf('data-page="ai-infrastructure"'))
  assert(text.includes(paperCopy.labels.version[language]));assert(text.includes(paperCopy.comparisons.funding.evidence[language]))
  for(const item of [...Object.values(copy.sections),copy.ui.emptyAlphabet,copy.disclosures.fairwater,copy.disclosures.polaris,copy.disclosures.doubleCount,copy.disclosures.guarantee,copy.disclosures.maximumExposure])assert(text.includes(item[language]),item[language])
  for(const p of snapshot.projects){assert(html.includes(`data-project="${p.projectId}"`));for(const f of [...p.capacityDisplay,...p.powerSummary]){assert(text.includes(f.shortDefinition[language]));assert(text.includes(f.scope[language]));assert(text.includes(`${f.value} ${f.unit}`))}}
  assert.doesNotMatch(text,forbidden);assert.doesNotMatch(text,/undefined|NaN|Infinity/)
  assert.match(html,/scope="row"/);assert.match(html,/scope="col"/);assert.match(html,/role="region"/);assert.match(html,/aria-live="polite"/)
  const bad=structuredClone(snapshot);bad.projects[0].debtAmount=1;const fallback=await render(bad);assert(!fallback.includes('data-project='));assert(fallback.includes(copy.ui.unavailablePage[language]))
 }
}finally{await fs.rm(temp,{recursive:true,force:true})}
const assets=await fs.readdir(join(root,'dist/assets'))
const relevant=assets.filter(f=>/^AiInfrastructure-.*\.(js|css)$/.test(f))
assert(relevant.some(f=>f.endsWith('.js')),'Lazy page artifact exists')
for(const f of relevant)assert.doesNotMatch(await fs.readFile(join(root,'dist/assets',f),'utf8'),forbidden,`No excluded records/values in ${f}`)
const json=await fs.readFile(join(root,'src/data/ai-infrastructure/monitor.json'),'utf8');assert.doesNotMatch(json,forbidden)
const inherited=[]
for(const f of assets.filter(f=>f.endsWith('.js')&&!relevant.includes(f))){if(forbidden.test(await fs.readFile(join(root,'dist/assets',f),'utf8')))inherited.push(f)}
console.log(`PASS: AI Infrastructure frozen bytes, bilingual paper-first SSR, three sourced charts, five comparison rows, seven unchanged cards/four detailed sections, fail-closed fallback, no excluded project leakage. Existing unrelated chunks with matching audit strings: ${inherited.join(', ') || 'none'}`)
