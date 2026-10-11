// Always validate the actual mixed-publication release; never fall back to D1 full-data acceptance.
import {spawnSync} from 'node:child_process'
import {resolve} from 'node:path'
const root=resolve(import.meta.dirname,'..')
const result=spawnSync(process.execPath,['docs/ai-macro-release/phase-d3/verify-release.mjs'],{cwd:root,stdio:'inherit'})
process.exit(result.status??1)
