import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { contentHash, sha256, instant } from '../../research/signal-engine/engine/core.mjs'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
export const ENGINE_REFERENCE = '139c36e5efd642aedcfd2a43194f5b8f09c7831e'
export const ADAPTER_VERSION = 'signal-shadow-adapter/0.1.0'
export const RULE_VERSION = 'signal-engine-v0.1-draft.1'
export const HASH = /^[a-f0-9]{64}$/
export const COMMIT = /^[a-f0-9]{40}$/
export const now = () => instant(new Date().toISOString())
export function git(repo, args) {
  return execFileSync('git', args, { cwd: repo, maxBuffer: 25_000_000, encoding: 'utf8' }).trim()
}
export function resolveCommit(repo, ref) {
  if (!COMMIT.test(ref || '')) throw Error('EXPLICIT_COMMIT_REQUIRED')
  if (git(repo, ['rev-parse', `${ref}^{commit}`]) !== ref) throw Error('COMMIT_IDENTITY_MISMATCH')
  return ref
}
const committedBundleCache = new Map()
export function dataIdentity(repo, commit) {
  const key = path.resolve(repo) + ':' + commit
  if (committedBundleCache.has(key)) return structuredClone(committedBundleCache.get(key))
  resolveCommit(repo, commit)
  const files = git(repo, ['ls-tree', '-r', '--name-only', commit, 'data']).split('\n').filter(Boolean).sort()
  if (!files.length) throw Error('MISSING_ECONOMIC_BUNDLE')
  const records = files.map(file => {
    if (!/^data\/[A-Za-z0-9_./-]+$/.test(file) || file.includes('..')) throw Error('UNSAFE_ECONOMIC_PATH')
    const bytes = execFileSync('git', ['show', `${commit}:${file}`], { cwd: repo, maxBuffer: 25_000_000 })
    return { path: file, sha256: sha256(bytes) }
  })
  const identity = { files: records, hash: contentHash(records) }
  committedBundleCache.set(key, identity)
  return structuredClone(identity)
}
export function economicCommit(repo, target) {
  resolveCommit(repo, target)
  const commit = git(repo, ['log', '-1', '--format=%H', target, '--', 'data'])
  if (!COMMIT.test(commit) || dataIdentity(repo, target).hash !== dataIdentity(repo, commit).hash) throw Error('ECONOMIC_COMMIT_NOT_EQUIVALENT')
  return commit
}
function walk(folder, prefix, selected) {
  for (const entry of fs.readdirSync(folder, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const file = path.join(prefix, entry.name)
    if (entry.isSymbolicLink()) throw Error('CODE_SYMLINK_NOT_ALLOWED')
    if (entry.isDirectory()) walk(path.join(folder, entry.name), file, selected)
    else if (/\.(mjs|json)$/.test(entry.name)) selected.push(file)
  }
}
export function semanticCodeIdentity(repo = ROOT) {
  const files = []
  walk(path.join(repo, 'research/signal-engine/engine'), 'research/signal-engine/engine', files)
  walk(path.join(repo, 'scripts/signal-engine'), 'scripts/signal-engine', files)
  // Entry-point/run timestamps and unrelated website commits are operational.
  // Every module that can alter acceptance, interpretation or projection is pinned.
  const lock = JSON.parse(fs.readFileSync(path.join(repo, 'research/signal-engine/fixtures/spec-lock.json')))
  files.push(...Object.keys(lock.hashes), 'research/signal-engine/package-lock.json')
  // Include actual relative-import dependencies (not only the prototype lock's
  // original list), including the international source validators.
  const dependencies = new Set(files)
  for (const file of dependencies) {
    if (!/\.(mjs|js)$/.test(file)) continue
    const code = fs.readFileSync(path.join(repo, file), 'utf8')
    for (const match of code.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
      if (!match[1].startsWith('.')) continue
      const imported = path.normalize(path.join(path.dirname(file), match[1]))
      if (imported.startsWith('..')) throw Error('SEMANTIC_DEPENDENCY_OUTSIDE_REPOSITORY')
      dependencies.add(imported)
    }
  }
  return contentHash([...dependencies].sort().map(file => ({ file, sha256: sha256(fs.readFileSync(path.join(repo, file))) })))
}
export function gateCodeIdentity(repo) {
  const files = []
  walk(path.join(repo, 'scripts'), 'scripts', files)
  // Exclude the adapter: this hash describes the independent economic gates.
  const selected = files.filter(file => !file.startsWith('scripts/signal-engine/') && !/scripts\/signal-/.test(file))
  selected.push('package.json', 'package-lock.json', 'vite.config.js')
  return contentHash(selected.sort().map(file => ({ file, sha256: sha256(fs.readFileSync(path.join(repo, file))) })))
}
