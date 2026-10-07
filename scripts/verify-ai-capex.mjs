import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {spawnSync} from 'node:child_process'
import {mkdtemp,rm} from 'node:fs/promises'
import {join,resolve} from 'node:path'
import {pathToFileURL} from 'node:url'
import {build} from 'vite'
import React from 'react'
import {renderToReadableStream} from 'react-dom/server'
import snapshot from '../src/data/ai-capex/monitor.json' with {type:'json'}
import {aiCapexCopy} from '../src/i18n/aiCapex.js'
const root=resolve(import.meta.dirname,'..')
const tests=spawnSync(process.execPath,['--test','scripts/tests/ai-capex-public.test.mjs'],{cwd:root,encoding:'utf8'})
if(tests.status!==0){process.stdout.write(tests.stdout);process.stderr.write(tests.stderr);process.exit(1)}
const temp=await mkdtemp(join(root,'node_modules','.wil-ai-capex-'))
try {
 await build({configFile:false,root,logLevel:'error',build:{ssr:'src/pages/AiCapex.jsx',outDir:temp,minify:false}})
 const {AiCapex}=await import(pathToFileURL(join(temp,'AiCapex.js')))
 for(const language of ['en','zh']){
  const render=async data=>{const stream=await renderToReadableStream(React.createElement(AiCapex,{language,data}));await stream.allReady;return new Response(stream).text()}
  const html=await render(snapshot),t=aiCapexCopy[language]
  const text=html.replace(/<!--.*?-->/gs,'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&#x27;/g,"'").replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
  assert.equal((html.match(/<h1(?:\s[^>]*)?>/g)||[]).length,1)
  assert.equal((html.match(/data-chart=/g)||[]).length,3)
  assert.equal((html.match(/data-company=/g)||[]).length,4)
  assert.equal((html.match(/data-milestone=/g)||[]).length,3)
  assert.equal((html.match(/data-guidance=/g)||[]).length,2)
  for(const label of [t.title,...t.sections,t.fixed,t.canTitle,t.cannotTitle,t.runRate,t.guidance,t.recognized,t.cloudNote,t.cashNote,...t.boundaries.MSFT,...t.boundaries.META])assert(text.includes(label),label)
  for(const value of ['39.78%','21.82%','45.11%','37.50%','−4.89%','34.03%','26.46%','−3.83%','13.69%','49.53%','1.29%','30.88%','+109.63%','+100.14%','+69.20%','+82.10%','−11.63','−10.38','−4.52','−16.70','40.59%','35.59%','39.36%','+36.79%','+6.45','7.104','+42.14%','5.93%','+0.75','6.32','513.9','678','130–145',...Object.values(snapshot.provenance)])assert(text.includes(value),value)
  assert.match(html,/role="region" aria-label="[^"]+" tabindex="0"/)
  assert.match(html,/scope="row"/);assert.match(html,/<caption>/);assert.match(html,/role="img" aria-labelledby="[^"]+" aria-describedby="[^"]+"/)
  assert.doesNotMatch(html,/undefined|NaN|Infinity|\/Users\/|file:\/\//)
  const invalid=JSON.parse(JSON.stringify(snapshot));invalid.events[0].recognizedRevenue=true
  const fallback=await render(invalid);assert(fallback.includes(t.unavailable));assert(!fallback.includes('data-chart='));assert(!fallback.includes('data-company='));assert(!fallback.includes('678'))
 }
}finally{await rm(temp,{recursive:true,force:true})}
const dist=await fs.readdir(join(root,'dist/assets'))
for(const filename of dist.filter(f=>f.endsWith('.js'))){const text=await fs.readFile(join(root,'dist/assets',filename),'utf8');assert(!/\/Users\/chrischeng|WIL_AI_CAPEX_CACHE|ai-capex-quarterly-panel-v0\.1|QUALIFIED_PACKET_BYTES|699ff1d5ced2f63648ca58dbd7e21ffaa2781b38bddb98c5562375bd6595e95b/.test(text),'No research generator/cache paths in public build')}
console.log('PASS: 32 AI CapEx public tests, bilingual SSR, exact fixed-vintage values, accessibility structure, invalid snapshot fails closed and no research/cache runtime leakage')
