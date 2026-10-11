// Audit metadata only; no source retrieval, economic calculation or publication.
import assert from 'node:assert/strict'
import {readFile,writeFile} from 'node:fs/promises'
import {resolve,join,relative} from 'node:path'
import {spawnSync} from 'node:child_process'
import {hash} from '../../../scripts/ai-macro-projection.mjs'
import {validatePublicTree,files} from './publication-safety.mjs'
const root=resolve(import.meta.dirname,'../../..'),dir=import.meta.dirname,base='3d7fd3f0a0497f40bec04c8ab968eecf70033d53'
function git(...args){const r=spawnSync('git',args,{cwd:root,encoding:'utf8'});assert.equal(r.status,0,r.stderr);return r.stdout.trim()}
const read=async p=>JSON.parse(await readFile(join(dir,p))),summary=await validatePublicTree(root,join(root,'dist'))
const changed=[...new Set((git('diff','--name-only',base)+'\n'+git('ls-files','--others','--exclude-standard')).split('\n').filter(Boolean))].filter(p=>p!=='docs/ai-macro-release/phase-d2-1/release-candidate-manifest.json').sort()
const fileIdentities=[];for(const p of changed){const bytes=await readFile(join(root,p));fileIdentities.push({path:p,bytes:bytes.length,sha256:hash(bytes)})}
const buildFiles=[];for(const p of (await files(join(root,'dist'))).filter(p=>/AiMacro-[^/]+\.(js|css)$/.test(p)||relative(join(root,'dist'),p)===summary.historyArtifact.path)){const bytes=await readFile(p);buildFiles.push({path:relative(join(root,'dist'),p),bytes:bytes.length,sha256:hash(bytes)})}
const report={schemaVersion:'D21_RELEASE_MANIFEST_1',startingSHA:base,branch:git('branch','--show-current'),implementationSHA:git('rev-parse','HEAD'),finalCommitMeaning:'Validated implementation SHA above; final manifest-only audit commit resolves with git rev-parse HEAD. Self hash intentionally excluded.',productionMainObserved:'4a10e16f2d956fc25262c55da16a10c8d36fedab',reviewedAt:'2026-10-10',dataIntegrity:await read('data-integrity-results.json'),tests:await read('test-results.json'),browser:await read('browser-qa-summary.json'),security:await read('security-results.json'),changedFileIdentities:fileIdentities,buildFileIdentities:buildFiles,publicPublicationMode:'11_NUMERICAL_INDICATORS_AND_EXTERNAL_SOURCE_ONLY_SPF10',SPF10Rights:'UNRESOLVED',privateFullSnapshotPublished:false,dataDownloadFeature:false,liveEconomicAPIs:false,productionModified:false,PRCreated:false,merged:false,deployed:false,newRefreshWorkflow:false,newSchedule:false,newEmail:false,remainingReleaseBlockers:[{id:'A11Y-01',state:'MANUAL ACCEPTANCE PENDING',requirement:'Actual VoiceOver/NVDA spoken acceptance'}],classification:'CONDITIONAL — MANUAL ACCEPTANCE PENDING'}
await writeFile(join(dir,'release-candidate-manifest.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({implementationSHA:report.implementationSHA,projectionHash:summary.projectionHash,records:summary.historyArtifact.recordCount,missing:summary.historyArtifact.missingCount,classification:report.classification}))
