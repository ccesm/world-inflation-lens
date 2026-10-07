import assert from 'node:assert/strict'
import { readFile, mkdtemp, rm } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'vite'
import React from 'react'
import { renderToReadableStream } from 'react-dom/server'
import { routes, primaryRoutes, routeFromHash, routeSection } from '../src/utils/routing.js'
import { sectionLinks, iaCopy } from '../src/i18n/architecture.js'
import { aiLaborCopy } from '../src/i18n/aiLabor.js'
import { pageResearchContext, structuralThemes } from '../src/data/researchArchitecture.js'
const root = resolve(import.meta.dirname, '..')
const read = file => readFile(join(root,file),'utf8')
const raw = await read('src/data/ai-labor/interim-conclusion.json'), data = JSON.parse(raw)
assert(Buffer.byteLength(raw) < 6000, 'Compact snapshot only')
assert.equal(data.researchStatus,'OBSERVATION_MODE')
assert.deepEqual(data.evidenceStatus,['EARLY','INCONCLUSIVE','SAMPLE_SENSITIVE'])
assert.equal(data.interpretation,'DESCRIPTIVE_ONLY'); assert.equal(data.causalityStatus,'NOT_ESTABLISHED'); assert.equal(data.monitorActivated,false)
assert.deepEqual(data.strict, {academic:{coveragePercent:37.77,employmentChangeGapPp:0.4159,pretrendGapPpPerYear:0.2021},microsoft:{coveragePercent:47.55,employmentChangeGapPp:0.5621,pretrendGapPpPerYear:-1.1848}})
assert.deepEqual(data.expanded, {academic:{coveragePercent:55.02,employmentChangeGapPp:-0.8480,pretrendGapPpPerYear:-0.7122},microsoft:{coveragePercent:55.23,employmentChangeGapPp:0.0300,pretrendGapPpPerYear:-1.0058}})
assert.equal(data.common.expandedCoveragePercent,47.80)
assert.deepEqual(data.sourceCommits,{strict:'57f9b70352999a9464fb164e17df21075d6d61e9',expanded:'e7aa773c66a898f10a883a0862462fefc42381ee'})
assert.deepEqual(data.specificationHashes,{strict:'f3429802af3354335d5c724fc5497a24dde41ea11ac8178b2ac88c9416148b5e',expanded:'d40e6468ccc27fbc7c0f262acd1954e1eb5e18b28590af184411da71e76f9e8c'})
assert.equal(data.asOf.latestCompleteOutcomeYear,2024); assert.equal(data.asOf.partialObservationsThrough,'2026-08'); assert.equal(data.asOf.missingMonth,'2025-10')
assert.deepEqual(primaryRoutes,['home','dollar','fiscal','history','scenarios','research'])
assert.equal(routeFromHash('#/research/ai-labor'),'research/ai-labor'); assert.equal(routeSection('research/ai-labor'),'research')
for (const legacy of ['home','dollar','fiscal','history','scenarios','research','purchasing-power','monitor','regimes','since-1971','drivers','us-cpi','timeline','overview','map','sources','external-shocks','research/ai-productivity','research/digital-money','research/data','research/updates','research/international-dollar','research/signal-engine']) assert(routes.includes(legacy))
assert(sectionLinks.research.some(([href])=>href==='#/research/ai-labor'))
assert.equal(pageResearchContext['research/ai-labor'].theme,'capacity')
assert(structuralThemes.find(t=>t.id==='capacity').routes.some(r=>r.href==='#/research/ai-labor'))
assert.deepEqual(Object.keys(aiLaborCopy.en).sort(),Object.keys(aiLaborCopy.zh).sort())
const pageSource = await read('src/pages/AiLabor.jsx')
assert.doesNotMatch(pageSource,/research\/signal-engine|signalPublic|fetch\(|XMLHttpRequest|process\.env|VITE_/)
assert.doesNotMatch(raw+JSON.stringify(aiLaborCopy),/\/Users\/|\/home\/|file:\/\/|NO_AI_EFFECT|AI_JOB_LOSS|AI_REPLACEMENT_SIGNAL|AI_UNEMPLOYMENT_RISK|CONFIRMED_DISPLACEMENT/)
assert.match(await read('src/pages/AiProductivity.jsx'),/href="#\/research\/ai-labor"/)
assert.match(await read('src/App.jsx'),/const AiLabor = lazy/)
const temp = await mkdtemp(join(root,'node_modules','.wil-ai-labor-'))
try {
 await build({configFile:false,root,logLevel:'error',build:{ssr:'src/pages/AiLabor.jsx',outDir:temp,minify:false}})
 const {AiLabor} = await import(pathToFileURL(join(temp,'AiLabor.js')))
 for (const language of ['en','zh']) {
  const stream = await renderToReadableStream(React.createElement(AiLabor,{language})); await stream.allReady
  const html = await new Response(stream).text()
  const text = html.replace(/<!--.*?-->/gs,'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&#x27;/g,"'").replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
  assert.equal((html.match(/<h1(?:\s[^>]*)?>/g)||[]).length,1)
  assert(text.includes(aiLaborCopy[language].title)); assert(text.includes(aiLaborCopy[language].status)); assert(text.includes(aiLaborCopy[language].mode)); assert.equal(iaCopy[language].nav['research/ai-labor'],aiLaborCopy[language].title)
  for (const value of ['37.77%','47.55%','55.02%','55.23%','47.80%','+0.4159','+0.5621','−0.8480','+0.0300','+0.2021','−1.1848','−0.7122','−1.0058',...Object.values(data.sourceCommits),...Object.values(data.specificationHashes)]) assert(text.includes(value),value)
  assert.equal((html.match(/data-result=/g)||[]).length,4)
  assert.match(html,/role="region" aria-label="[^"]+" tabindex="0"/); assert.match(html,/<caption>/); assert.match(html,/scope="row"/)
  assert(text.includes(aiLaborCopy[language].causality)); assert(text.includes(aiLaborCopy[language].limits[0])); assert(text.includes(aiLaborCopy[language].cannotTitle)); assert(text.includes(aiLaborCopy[language].timeNote))
  assert.match(text,language==='zh' ? /这些结果不能证明 AI 已经造成就业替代，也不能证明未来不会出现 AI 对就业的影响/ : /These results do not establish AI-driven displacement.*do not establish the absence of future AI labor effects/s)
  assert.doesNotMatch(text,/\b(?:AI jobs score|AI job-loss score|AI unemployment forecast|replacement probability:|job loss probability:)\s*\d/i)
  assert.match(html,/CAUSALITY_NOT_ESTABLISHED/); assert.doesNotMatch(html,/NaN|undefined|Infinity|\/Users\//)
 }
} finally { await rm(temp,{recursive:true,force:true}) }
console.log('PASS: AI labor accepted fixed values/provenance, EN/ZH real rendering, causal/age/time/uncertainty guardrails, accessible table, lazy secondary routing, no Signal/API coupling')
