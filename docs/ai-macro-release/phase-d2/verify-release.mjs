import assert from 'node:assert/strict'
import {readFile,readdir,mkdtemp,rm} from 'node:fs/promises'
import {resolve,join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {spawnSync} from 'node:child_process'
import {build} from 'vite'
import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {macroCopy} from '../../../src/i18n/aiMacro.js'
const root=resolve(import.meta.dirname,'../../..')
const test=spawnSync(process.execPath,['--test','docs/ai-macro-release/phase-d2/test-release.mjs'],{cwd:root,encoding:'utf8'});process.stdout.write(test.stdout);process.stderr.write(test.stderr);assert.equal(test.status,0)
const temp=await mkdtemp(join(root,'node_modules','.wil-d2-'))
try{
 await build({configFile:false,root,logLevel:'error',build:{ssr:'src/pages/AiMacro.jsx',outDir:temp,minify:false}})
 const {AiMacro}=await import(pathToFileURL(join(temp,'AiMacro.js')))
 for(const language of ['en','zh']){const html=renderToStaticMarkup(React.createElement(AiMacro,{language}));assert(html.includes(macroCopy.releaseHold[language]));assert(!html.includes('data-series='))}
 const assets=await readdir(join(root,'dist/assets'));assert(assets.some(f=>/^AiMacro-.*\.js$/.test(f)))
 await assert.rejects(readFile(join(root,'dist/data/ai-macro/5c8381bb1729570146b7ddcaf371251f9d1fa678daa1751cfd2c86222d371590/history.json')))
 const bundle=await readFile(join(root,'dist/assets',assets.find(f=>/^AiMacro-.*\.js$/.test(f))),'utf8');const rights=JSON.parse(await readFile(join(root,'docs/ai-macro-release/phase-d2/data-redistribution-review.json')));for(const source of rights.records)assert(!bundle.includes(source.sourceHash),'No numeric-source payload in public bundle')
}finally{await rm(temp,{recursive:true,force:true})}
console.log('PASS D2 safe hold; full economic asset publication BLOCKED. Original D1 numeric suite is run in its independent pinned checkout, not silently treated as passed here.')
