// Test-only hosted qualification. No source refresh, archive API or deployment.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { captureAcceptedInput, validateAcceptedInput } from './signal-engine/acceptance.mjs'
import { runShadow } from './signal-engine/pipeline.mjs'
import { RestrictedStore } from './signal-engine/store.mjs'
import { validateStoredInterpretation } from './signal-engine/artifact.mjs'
import { ROOT, dataIdentity, git } from './signal-engine/identity.mjs'
import { readSummary, renderSummary } from './lib/signalShadowSummary.mjs'
import { contentHash, serialize, sha256 } from '../research/signal-engine/engine/core.mjs'

const branches = ['refs/heads/codex/signal-engine-production-pipeline', 'refs/heads/codex/signal-shadow-no-private-archive']
const restrictedMarkers = /signal-shadow-interpretation\/1|signal-public-shadow\/1|signal-economic-acceptance\/1|signal-shadow-context\/1|signal-shadow-run\/1|signal-shadow-summary\/[12]|deterministic-signal-conclusions\/1/
export function disclosureCategories(text, { publicOutput = false, logs = false } = {}) {
  const categories = []
  if (/\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AIza[A-Za-z0-9_-]{30,})\b/.test(text) || /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text)) categories.push('CREDENTIAL_PATTERN')
  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text)) categories.push('EMAIL_ADDRESS')
  if (/\/Users\/|\/home\/(?!runner(?:\/|$))[^/\s]+\//.test(text)) categories.push('PERSONAL_PATH')
  if ((publicOutput || logs) && (text.includes(ROOT) || /\/home\/runner\/work\/|\/private\/var\/|\/private\/tmp\//.test(text))) categories.push('WORKSPACE_PATH')
  if ((publicOutput || logs) && restrictedMarkers.test(text)) categories.push('RESTRICTED_SIGNAL_PAYLOAD')
  if (logs && /\n\s+at (?:file:|.*\.(?:mjs|js):\d)|(?:AssertionError|Error):\s/.test(text)) categories.push('INTERNAL_DIAGNOSTIC')
  // Check known credential variables without printing their names or values.
  for (const key of ['GITHUB_TOKEN', 'GH_TOKEN', 'SIGNAL_ARCHIVE_TOKEN', 'GMAIL_APP_PASSWORD']) {
    const secret = process.env[key]
    if (secret?.length >= 12 && text.includes(secret)) categories.push('SECRET_VALUE')
  }
  return [...new Set(categories)]
}
function ensureNoDisclosure(text, options) {
  assert.deepEqual(disclosureCategories(text, options), [], 'DISCLOSURE_CHECK_FAILED')
}
function workingIdentity(files) {
  return contentHash(files.map(f => ({ path: f.path, sha256: sha256(fs.readFileSync(path.join(ROOT, f.path))) })))
}
function filesUnder(root) {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap(e => e.isDirectory() ? filesUnder(path.join(root, e.name)) : [path.join(root, e.name)])
}
function testCounts(text) {
  const read = field => Number([...text.matchAll(new RegExp(`\\b${field} (\\d+)`, 'g'))].at(-1)?.[1])
  const result = { total: read('tests'), passed: read('pass'), failed: read('fail'), deferred: read('skipped') }
  assert(Object.values(result).every(Number.isSafeInteger), 'TEST_ACCOUNTING_MISSING')
  assert.equal(result.failed, 0)
  assert.equal(result.total, result.passed + result.deferred)
  return result
}
export function qualify({ mode, outputRoot }) {
  assert(['normal', 'failure-injection'].includes(mode), 'INVALID_QUALIFICATION_MODE')
  const root = path.resolve(outputRoot || '')
  assert(path.isAbsolute(outputRoot || '') && !root.startsWith(ROOT + path.sep) && !fs.existsSync(root), 'FRESH_EXTERNAL_QUALIFICATION_ROOT_REQUIRED')
  if (process.env.GITHUB_ACTIONS === 'true') {
    assert.equal(process.platform, 'linux'); assert.equal(process.env.RUNNER_OS, 'Linux')
    assert(branches.includes(process.env.GITHUB_REF))
    assert.equal(process.env.GITHUB_EVENT_NAME, 'workflow_dispatch')
  }
  fs.mkdirSync(root, { recursive: true, mode: 0o700 })
  const commit = git(ROOT, ['rev-parse', 'HEAD'])
  const identity = dataIdentity(ROOT, commit), economicBefore = workingIdentity(identity.files)
  assert.equal(economicBefore, identity.hash, 'UNACCEPTED_WORKING_DATA')
  assert.equal(JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'))).version, '1.0.0')
  const report = {
    schemaVersion: 'signal-shadow-qualification/1', mode, codeCommit: commit,
    runner: process.env.GITHUB_ACTIONS === 'true' ? 'GITHUB_HOSTED_LINUX' : 'LOCAL_PRECHECK',
    operatingSystem: process.platform, nodeVersion: process.versions.node,
    checks: {}, logs: {}, tests: {},
  }
  // Child stdout/stderr remain in memory, not public logs or uploaded raw logs.
  // Failures reveal only the bounded stage; detailed streams are discarded.
  const command = (script, key = script) => {
    const child = spawnSync('npm', ['run', script], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 32_000_000, timeout: 300_000 })
    const output = (child.stdout || '') + (child.stderr || '')
    ensureNoDisclosure(output, { logs: true })
    assert.equal(child.status, 0, 'QUALIFICATION_CHILD_GATE_FAILED')
    report.logs[key] = { sha256: sha256(output), bytes: Buffer.byteLength(output), disclosure: 'PASS' }
    return child.stdout
  }
  const accepted = captureAcceptedInput({ targetCommit: commit, codeCommit: commit,
    gates: () => {
      command('build', 'acceptance-build'); command('verify', 'acceptance-verify')
      return [{ name: 'npm run build', result: 'PASS' }, { name: 'npm run verify', result: 'PASS' }]
    },
  })
  validateAcceptedInput(accepted)
  report.inputSnapshotCommit = accepted.receipt.inputCommit
  report.inputSnapshotHash = accepted.receipt.inputSnapshotHash
  report.checks.acceptedSnapshot = 'PASS'
  const store = new RestrictedStore(path.join(root, 'store'))
  const first = runShadow({ accepted, store, codeCommit: commit, runId: 'qualification-normal' })
  assert.equal(first.run.result, 'SUCCESS_NEW', 'NORMAL_EVALUATION_FAILED')
  validateStoredInterpretation(store, first.run.artifactHash)
  report.normalResult = first.run.result
  report.artifactHash = first.run.artifactHash
  report.deterministicContentHash = first.run.deterministicContentHash
  report.checks.semanticProvenance = 'PASS'
  // Exercise the automatic CLI path with no archive configuration, then read
  // the stored interpretation independently. Only the allowlisted summary and
  // qualification report may leave this runner; restricted objects stay local.
  const localStore = new RestrictedStore(path.join(root, 'automatic-local-store'))
  const summaryFile = path.join(root, 'safe-summary.json')
  const child = spawnSync(process.execPath, ['scripts/signal-evaluate.mjs', '--store', localStore.root,
    '--snapshot', commit, '--code-commit', commit], {
    cwd: ROOT, encoding: 'utf8', maxBuffer: 32_000_000, timeout: 300_000,
    env: { PATH: process.env.PATH, TMPDIR: process.env.TMPDIR, RUNNER_TEMP: root, SIGNAL_SHADOW_SUMMARY_FILE: summaryFile,
      SIGNAL_ARCHIVE_REPOSITORY: '', SIGNAL_ARCHIVE_TOKEN: '' },
  })
  ensureNoDisclosure((child.stdout || '') + (child.stderr || ''), { logs: true })
  assert.equal(child.status, 0, 'LOCAL_ONLY_CLI_FAILED')
  const summary = readSummary(fs.readFileSync(summaryFile, 'utf8'))
  assert.equal(summary.status, 'CURRENT')
  assert.equal(summary.factorCount, 7)
  const localState = localStore.readState()
  validateStoredInterpretation(localStore, localState.ledger.lastValidArtifactHash)
  assert.match(renderSummary(summary), /Factors valid:/)
  report.localOnlySummary = summary
  report.checks.localOnlyWithoutArchive = 'PASS'
  report.checks.localOnlySemanticProvenance = 'PASS'
  // A new automatic job has no prior artifact. An injected failure must not
  // fabricate the persistent fallback tested separately by the optional store.
  const failedLocal = runShadow({ accepted, store: new RestrictedStore(path.join(root, 'failed-local-store')),
    codeCommit: commit, evaluateFn: () => { throw Error('QUALIFICATION_TEST_INJECTION') } })
  assert.equal(failedLocal.run.result, 'FAILED')
  assert.equal(failedLocal.run.fallbackArtifactHash, null)
  assert.equal(failedLocal.fallback, null)
  assert.equal(new RestrictedStore(path.join(root, 'failed-local-store')).readState().ledger.status, 'NO_VALID_ARTIFACT')
  report.checks.localOnlyFailureWithoutFallback = 'PASS'
  if (mode === 'normal') {
    const duplicate = runShadow({ accepted, codeCommit: commit,
      store: new RestrictedStore(path.join(root, 'independent-store')),
      asOf: first.output.asOf, clock: () => first.output.asOf, runId: 'qualification-determinism',
    })
    assert.equal(duplicate.run.result, 'SUCCESS_NEW')
    assert.equal(serialize(first.artifact), serialize(duplicate.artifact))
    assert.equal(first.run.artifactHash, duplicate.run.artifactHash)
    report.checks.determinism = 'PASS'
  } else {
    const before = store.readState().ledger
    const originalBytes = fs.readFileSync(store.location('interpretations', first.run.artifactHash))
    const artifactCount = fs.readdirSync(path.join(store.root, 'interpretations')).length
    let evaluationInvoked = false
    const failed = runShadow({ accepted, store, codeCommit: commit, runId: 'qualification-injected',
      testOnlyForceEvaluation: true,
      evaluateFn: () => { evaluationInvoked = true; throw Error('QUALIFICATION_TEST_INJECTION') },
    })
    assert(evaluationInvoked, 'FAILURE_INJECTION_SKIPPED_BY_CACHE')
    assert.equal(failed.run.result, 'FAILED')
    assert.equal(failed.run.failureStage, 'ENGINE')
    assert.equal(failed.run.errorCategory, 'ENGINE_EVALUATION_FAILED')
    assert.equal(failed.run.storagePersisted, true)
    assert.equal(failed.run.fallbackArtifactHash, first.run.artifactHash)
    const after = store.readState().ledger
    assert.equal(after.status, 'FAILED_WITH_LAST_VALID')
    assert.equal(after.lastValidArtifactHash, before.lastValidArtifactHash)
    assert.equal(after.lastSuccessfulEvaluationAt, before.lastSuccessfulEvaluationAt)
    assert.equal(fs.readdirSync(path.join(store.root, 'interpretations')).length, artifactCount)
    assert(originalBytes.equals(fs.readFileSync(store.location('interpretations', first.run.artifactHash))))
    validateStoredInterpretation(store, first.run.artifactHash)
    assert.equal(workingIdentity(identity.files), economicBefore)
    report.failureResult = failed.run.result
    report.checks.failureInjection = 'PASS'
    report.checks.lastValidPreserved = 'PASS'
  }
  // These gates occur AFTER the injected failure, not only before it.
  command('build', 'final-build'); command('verify', 'final-verify')
  report.checks.build = 'PASS'; report.checks.verify = 'PASS'
  report.tests.engine = testCounts(command('signal:test'))
  report.tests.pipeline = testCounts(command('signal:test:pipeline'))
  assert.equal(report.tests.engine.deferred, 2)
  report.checks.safeguardsR1R6 = 'PASS'
  assert.equal(workingIdentity(identity.files), economicBefore, 'ECONOMIC_DATA_CHANGED')
  report.checks.economicIsolation = 'PASS'
  const distFiles = filesUnder(path.join(ROOT, 'dist'))
  for (const file of distFiles) {
    assert(!/signal-engine|production-artifacts/.test(path.relative(path.join(ROOT, 'dist'), file)))
    ensureNoDisclosure(fs.readFileSync(file).toString('utf8'), { publicOutput: true })
  }
  report.checks.publicBundle = 'PASS'; report.checks.logDisclosure = 'PASS'
  const upload = path.join(root, 'upload')
  fs.mkdirSync(upload, { mode: 0o700 })
  // Upload only bounded qualification results, never restricted engine stores.
  ensureNoDisclosure(serialize(report), { logs: true })
  fs.writeFileSync(path.join(upload, 'qualification-report.json'), serialize(report), { mode: 0o600 })
  return report
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const report = qualify({ mode: process.env.QUALIFICATION_MODE, outputRoot: process.env.QUALIFICATION_ROOT })
    console.log(JSON.stringify({ qualification: report.mode, result: 'PASS', checks: report.checks, tests: report.tests }))
  } catch {
    // Neither child-process diagnostics, personal paths nor injected error text
    // are allowed into hosted logs or a success artifact on qualification failure.
    console.log(JSON.stringify({ qualification: 'FAILED', category: 'QUALIFICATION_ASSERTION_OR_GATE_FAILED' }))
    process.exitCode = 1
  }
}
