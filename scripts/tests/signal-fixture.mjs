// Test-only repository view: current validators/code, exact committed economic inputs.
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execFileSync } from 'node:child_process'
import { RestrictedStore } from '../signal-engine/store.mjs'
import { ROOT, dataIdentity } from '../signal-engine/identity.mjs'
const temp = prefix => fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), prefix))
export function vintageSandbox() {
  const root = temp('wil-shadow-vintage-'), repo = path.join(root, 'repo'), store = new RestrictedStore(path.join(root, 'store'))
  fs.mkdirSync(repo)
  // Read-only history reference; all economic working files are independent.
  fs.symlinkSync(path.join(ROOT, '.git'), path.join(repo, '.git'))
  for (const folder of ['src', 'scripts', 'docs']) fs.cpSync(path.join(ROOT, folder), path.join(repo, folder), { recursive: true })
  for (const name of ['package.json', 'package-lock.json', 'vite.config.js']) fs.copyFileSync(path.join(ROOT, name), path.join(repo, name))
  for (const folder of ['engine', 'fixtures']) fs.cpSync(path.join(ROOT, 'research/signal-engine', folder), path.join(repo, 'research/signal-engine', folder), { recursive: true })
  for (const name of ['signal-engine-v0.1-draft.json', 'output.schema.json', 'package-lock.json']) fs.copyFileSync(path.join(ROOT, 'research/signal-engine', name), path.join(repo, 'research/signal-engine', name))
  const install = commit => {
    for (const f of dataIdentity(ROOT, commit).files) {
      const target = path.join(repo, f.path); fs.mkdirSync(path.dirname(target), { recursive: true })
      fs.writeFileSync(target, execFileSync('git', ['show', `${commit}:${f.path}`], { cwd: ROOT, maxBuffer: 25_000_000 }))
    }
  }
  return { root, repo, store, install, close: () => fs.rmSync(root, { recursive: true, force: true }) }
}
