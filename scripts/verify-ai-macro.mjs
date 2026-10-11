import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {spawnSync} from 'node:child_process'
import {join,resolve} from 'node:path'
import {pathToFileURL} from 'node:url'
import {build} from 'vite'
import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import snapshot from '../src/data/ai-macro/summary.json' with {type:'json'}
import {macroCopy as c} from '../src/i18n/aiMacro.js'
const root=resolve(import.meta.dirname,'..'),tests=spawnSync(process.execPath,['--test','scripts/tests/ai-macro-public.test.mjs'],{cwd:root,encoding:'utf8'})
process.stdout.write(tests.stdout);process.stderr.write(tests.stderr);assert.equal(tests.status,0)
const temp=await fs.mkdtemp(join(root,'node_modules','.wil-macro-'))
try{
 await build({configFile:false,root,logLevel:'error',build:{ssr:'src/pages/AiMacro.jsx',outDir:temp,minify:false}})
 const {AiMacro,AiMacroContent}=await import(pathToFileURL(join(temp,'AiMacro.js')))
 for(const language of ['en','zh']){
  const html=renderToStaticMarkup(React.createElement(AiMacroContent,{language,data:snapshot}));assert.equal((html.match(/data-macro-section=/g)||[]).length,4);assert.equal((html.match(/data-series=/g)||[]).length,4);assert.equal((html.match(/<option/g)||[]).length,25)
  for(const item of [c.title,c.snapshotNote,c.boundary,c.noAI,c.rights,c.releaseUnknown,...Object.values(c.sections)])assert(html.replaceAll('&amp;','&').includes(item[language]),item[language]);assert(!/undefined|NaN|Infinity|\/Users\/|\/private\/tmp\//.test(html))
  const invalid=structuredClone(snapshot);invalid.series.pop();assert(renderToStaticMarkup(React.createElement(AiMacroContent,{language,data:invalid})).includes(c.invalid[language]));assert(!renderToStaticMarkup(React.createElement(AiMacro,{language})).includes('data-series='),'No numbers before actual digest validation')
 }
 await build({configFile:false,root,logLevel:'error',build:{ssr:'src/components/AiMacroChart.jsx',outDir:join(temp,'chart'),minify:false}})
 const {AiMacroChart}=await import(pathToFileURL(join(temp,'chart/AiMacroChart.js')))
 for(const language of ['en','zh']){
  const empty=renderToStaticMarkup(React.createElement(AiMacroChart,{points:[{date:'2025-01-01',value:null}],frequency:'MONTHLY',unit:'MWh',title:'E1',language}));assert(empty.includes(c.empty[language]));assert(!empty.includes('<svg'))
  const graph=renderToStaticMarkup(React.createElement(AiMacroChart,{points:[{date:'2025-01-01',value:-1},{date:'2025-02-01',value:null},{date:'2025-03-01',value:1}],frequency:'MONTHLY',unit:c.pp[language],title:c.labels.DFII10[language],language}));assert(graph.includes('role="img"'));assert(graph.includes('<title'));assert(graph.includes('<desc'));assert(!/NaN|Infinity|undefined/.test(graph))
 }
 const assets=await fs.readdir(join(root,'dist/assets'));assert(assets.some(f=>/^AiMacro-.*\.js$/.test(f)),'Lazy route bundle exists');const app=await fs.readFile(join(root,'src/App.jsx'),'utf8');assert(app.includes("lazy(() => import('./pages/AiMacro.jsx')"))
}finally{await fs.rm(temp,{recursive:true,force:true})}
console.log('PASS: macro snapshot, 30 offline tests, bilingual four-channel SSR, fail-closed initial state and lazy bundle')
