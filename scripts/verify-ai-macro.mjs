// D2 public packaging is intentionally withheld. Always run the stricter release
// validator, even if someone restores a D1 numeric snapshot by hand. Original
// D1 numerical/SSR acceptance is separately run in the pinned D1 checkout.
import {spawnSync} from 'node:child_process'
import {resolve} from 'node:path'
const root=resolve(import.meta.dirname,'..')
const result=spawnSync(process.execPath,['docs/ai-macro-release/phase-d2/verify-release.mjs'],{cwd:root,stdio:'inherit'})
process.exit(result.status??1)
