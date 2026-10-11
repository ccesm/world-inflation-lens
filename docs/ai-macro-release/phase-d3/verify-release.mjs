import assert from 'node:assert/strict'
import {readFile,mkdtemp,rm} from 'node:fs/promises'
import {resolve,join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {spawnSync} from 'node:child_process'
import {build} from 'vite'
import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {validatePublicTree} from '../phase-d2-1/publication-safety.mjs'
const root=resolve(import.meta.dirname,'../../..')
const test=spawnSync(process.execPath,['--test','docs/ai-macro-release/phase-d3/test-release.mjs'],{cwd:root,encoding:'utf8'});process.stdout.write(test.stdout);process.stderr.write(test.stderr);assert.equal(test.status,0)
const summary=await validatePublicTree(root,join(root,'dist'));const temp=await mkdtemp(join(root,'node_modules','.wil-d3-'))
try{
 await build({configFile:false,root,logLevel:'error',build:{ssr:'src/pages/AiMacro.jsx',outDir:temp,minify:false}})
 const {AiMacroContent}=await import(pathToFileURL(join(temp,'AiMacro.js')))
 for(const language of ['en','zh']){const html=renderToStaticMarkup(React.createElement(AiMacroContent,{language,data:summary}));assert.equal((html.match(/data-macro-section=/g)||[]).length,4);assert(html.includes('SPF10'));assert(!html.includes('SPF10:US'))}
}finally{await rm(temp,{recursive:true,force:true})}
console.log('PASS D3 actual permitted public subset, strict mixed rights, no SPF history, bilingual SSR. Manual screen-reader acceptance DEFERRED_BY_OWNER; no formal PASS.')
