// D3.3 owner-requested narrative contract supersedes the archived numerical-publication gate.
// Original research hashes are retained; excluded histories must never enter public/dist.
import {spawnSync} from 'node:child_process'
import {resolve} from 'node:path'
const root=resolve(import.meta.dirname,'..')
const result=spawnSync(process.execPath,['docs/ai-macro-release/phase-d33/verify-release.mjs'],{cwd:root,stdio:'inherit'})
process.exit(result.status??1)
