import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { unavailableSignal, validatePublicSignal } from '../src/utils/signalPublicContract.js'
import { publishPublicIdentity, publicSignalIdentityPath } from './lib/signalPublicIntegrity.mjs'
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const PUBLIC_FILE = path.join(ROOT, 'public/data/signal-engine/current.json')
export function writePublicSignal(value, file = PUBLIC_FILE) {
  validatePublicSignal(value)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  if (fs.existsSync(file) && fs.lstatSync(file).isSymbolicLink()) throw Error('PUBLIC_DESTINATION_SYMLINK')
  const temporary = `${file}.tmp-${process.pid}`
  try {
    const fd = fs.openSync(temporary, 'wx', 0o644)
    try { fs.writeFileSync(fd, JSON.stringify(value) + '\n'); fs.fsyncSync(fd) } finally { fs.closeSync(fd) }
    fs.renameSync(temporary, file)
  } finally { fs.rmSync(temporary, { force: true }) }
}
export async function generatePublicSignal({ snapshot, codeCommit, file = PUBLIC_FILE, identityFile = file === PUBLIC_FILE ? publicSignalIdentityPath(ROOT) : `${file}.build-identity.json`, acceptedFactory, evaluateOptions = {}, cleanupTemporary = fs.rmSync } = {}) {
  const head = () => execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()
  snapshot ||= head(); codeCommit ||= head()
  // Invalidate yesterday's interpretation BEFORE anything fallible. This write
  // is mandatory: failure to erase stale content must stop publication.
  writePublicSignal(unavailableSignal(), file)
  publishPublicIdentity({ repo: ROOT, file, identityFile, snapshotCommit: snapshot })
  let temporary
  try {
    // Missing isolated dependencies are an interpretation failure, not an
    // excuse to reuse a stale current artifact or reject valid economic data.
    const [{ captureAcceptedInput }, { runShadow }, { RestrictedStore }, { validateStoredInterpretation }, { makePublicSignal, validatePublicAgainstRun }] = await Promise.all([
      import('./signal-engine/acceptance.mjs'), import('./signal-engine/pipeline.mjs'), import('./signal-engine/store.mjs'), import('./signal-engine/artifact.mjs'), import('./lib/signalPublicProjection.mjs'),
    ])
    temporary = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'wil-public-signal-'))
    const store = new RestrictedStore(temporary)
    const result = runShadow({ ...evaluateOptions, store, codeCommit,
      acceptedFactory: acceptedFactory || (() => captureAcceptedInput({ targetCommit: snapshot, codeCommit })),
    })
    if (!result.run.result.startsWith('SUCCESS')) throw Error('PUBLIC_EVALUATION_UNAVAILABLE')
    const verified = validateStoredInterpretation(store, result.run.artifactHash)
    const validatedResult = { ...result, ...verified }
    if (validatedResult.accepted.receipt.targetCommit !== snapshot) throw Error('PUBLIC_ACCEPTED_SNAPSHOT_MISMATCH')
    const projection = makePublicSignal(validatedResult, snapshot)
    validatePublicAgainstRun(projection, validatedResult, snapshot)
    writePublicSignal(projection, file)
    publishPublicIdentity({ repo: ROOT, file, identityFile, snapshotCommit: snapshot })
    console.log('Public Signal interpretation: CURRENT (validated public summary only).')
    return projection
  } catch {
    // Never print internal diagnostics, full artifacts or local machine paths.
    writePublicSignal(unavailableSignal(), file)
    publishPublicIdentity({ repo: ROOT, file, identityFile, snapshotCommit: snapshot })
    console.log('Public Signal interpretation: UNAVAILABLE. Economic build gates remain independent.')
    return unavailableSignal()
  } finally {
    if (temporary) try { cleanupTemporary(temporary, { recursive: true, force: true }) } catch {
      console.log('Public Signal temporary cleanup incomplete; runner teardown will discard restricted files.')
    }
  }
}
export function parsePublicArguments(argv) {
  const options = {}
  for (let i = 0; i < argv.length; i += 2) {
    const name = { '--snapshot': 'snapshot', '--code-commit': 'codeCommit' }[argv[i]]
    if (!name || !/^[a-f0-9]{40}$/.test(argv[i + 1] || '') || options[name]) throw Error('INVALID_PUBLIC_SIGNAL_OPTION')
    options[name] = argv[i + 1]
  }
  return options
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  let options
  try { options = parsePublicArguments(process.argv.slice(2)) } catch {
    writePublicSignal(unavailableSignal())
    publishPublicIdentity({ repo: ROOT, file: PUBLIC_FILE })
    console.log('Public Signal interpretation: UNAVAILABLE. Economic build gates remain independent.')
  }
  if (options) await generatePublicSignal(options)
}
