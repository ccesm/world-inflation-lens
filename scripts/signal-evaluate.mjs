import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { captureAcceptedInput } from './signal-engine/acceptance.mjs'
import { runShadow } from './signal-engine/pipeline.mjs'
import { ROOT, git } from './signal-engine/identity.mjs'
import { RestrictedStore } from './signal-engine/store.mjs'
import { PrivateArchive } from './signal-engine/private-archive.mjs'
import { emptySummary, summaryFromRun } from './lib/signalShadowSummary.mjs'

function writeSummary(summary) {
  try {
    const file = process.env.SIGNAL_SHADOW_SUMMARY_FILE
    if (!file) return
    const directory = fs.realpathSync(path.dirname(file))
    const allowed = [fs.realpathSync(os.tmpdir()), process.env.RUNNER_TEMP].filter(Boolean).map(p => fs.realpathSync(p))
    if (!allowed.some(root => directory === root || directory.startsWith(root + path.sep)) || fs.existsSync(file) && fs.lstatSync(file).isSymbolicLink()) return
    fs.writeFileSync(file, JSON.stringify(summary) + '\n', { mode: 0o600 })
  } catch { /* Summary failure must not change engine or email outcomes. */ }
}

export function parseArguments(argv) {
  const out = { shadow: true, dryRun: false }
  const names = { '--snapshot': 'snapshot', '--code-commit': 'codeCommit', '--store': 'store', '--receipt': 'receipt', '--as-of': 'asOf', '--run-id': 'runId', '--attempt': 'attempt' }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--shadow' || arg === '--dry-run' || arg === '--private-archive') {
      const key = arg === '--shadow' ? 'shadow' : arg === '--dry-run' ? 'dryRun' : 'privateArchive'
      if (out[key] === true && key !== 'shadow') throw Error('DUPLICATE_OPTION')
      out[key] = true; continue
    }
    if (!names[arg] || !argv[i + 1] || argv[i + 1].startsWith('--')) throw Error('INVALID_SIGNAL_OPTION')
    if (out[names[arg]] !== undefined) throw Error('DUPLICATE_OPTION')
    out[names[arg]] = argv[++i]
  }
  if (out.attempt !== undefined) { out.attempt = Number(out.attempt); if (!Number.isSafeInteger(out.attempt) || out.attempt < 1) throw Error('INVALID_ATTEMPT') }
  if (out.privateArchive && (out.store || out.dryRun)) throw Error('PRIVATE_ARCHIVE_REQUIRES_DEDICATED_SHADOW_RUN')
  return out
}
export async function main(argv = process.argv.slice(2)) {
  let options
  try { options = parseArguments(argv) } catch {
    writeSummary(emptySummary())
    console.log(JSON.stringify({ shadow: true, result: 'FAILED', failureStage: 'CONFIGURATION', errorCategory: 'INVALID_SHADOW_COMMAND', storagePersisted: false, contentChanged: false }))
    process.exitCode = 1
    return
  }
  let remote, temporary, stage = 'CONFIGURATION', summary = emptySummary()
  try {
    const codeCommit = options.codeCommit || git(ROOT, ['rev-parse', 'HEAD'])
    const targetCommit = options.snapshot || git(ROOT, ['rev-parse', 'HEAD'])
    const store = options.privateArchive ? new RestrictedStore(temporary = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'wil-private-shadow-'))) : new RestrictedStore(options.store)
    stage = 'ARCHIVE_RESTORE'
    if (options.privateArchive) {
      remote = new PrivateArchive({ repository: process.env.SIGNAL_ARCHIVE_REPOSITORY, token: process.env.SIGNAL_ARCHIVE_TOKEN })
      await remote.restore(store)
    }
    const result = runShadow({ store, codeCommit, runId: options.runId || process.env.GITHUB_RUN_ID,
      attempt: options.attempt || Number(process.env.GITHUB_RUN_ATTEMPT || 1),
      dryRun: options.dryRun, asOf: options.asOf,
      acceptedFactory: () => options.receipt ? JSON.parse(fs.readFileSync(path.resolve(options.receipt), 'utf8')) : captureAcceptedInput({ targetCommit, codeCommit }),
    })
    stage = 'ARCHIVE_PUBLISH'
    if (remote && result.run.result !== 'SUPERSEDED' && result.run.storagePersisted) await remote.publish(store)
    summary = summaryFromRun(result)
    // Phase 1 console output is operational only; factor results and local paths
    // remain in the restricted archive, never public workflow logs or assets.
    console.log(JSON.stringify({ shadow: true, result: result.run.result, failureStage: result.run.failureStage, errorCategory: result.run.errorCategory, storagePersisted: result.run.storagePersisted, contentChanged: result.run.contentChanged }))
    if (result.run.result === 'FAILED') process.exitCode = 1
    return result
  } catch {
    console.log(JSON.stringify({ shadow: true, result: 'FAILED', failureStage: stage, errorCategory: 'RESTRICTED_SHADOW_OPERATION_FAILED', storagePersisted: false, contentChanged: false }))
    process.exitCode = 1
  } finally {
    writeSummary(summary)
    if (temporary) fs.rmSync(temporary, { recursive: true, force: true })
  }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await main()
