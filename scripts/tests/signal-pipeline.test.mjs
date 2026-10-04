import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execFileSync, spawnSync } from 'node:child_process'
import { captureAcceptedInput, validateAcceptedInput } from '../signal-engine/acceptance.mjs'
import { runShadow, validateLedger, validateRun } from '../signal-engine/pipeline.mjs'
import { RestrictedStore, DEFAULT_STORE } from '../signal-engine/store.mjs'
import { validateStoredInterpretation, validateInterpretation } from '../signal-engine/artifact.mjs'
import { safeProjection, validateProjection } from '../signal-engine/projection.mjs'
import { ROOT, semanticCodeIdentity, dataIdentity } from '../signal-engine/identity.mjs'
import { contentHash, serialize, sha256 } from '../../research/signal-engine/engine/core.mjs'
import { evaluate } from '../../research/signal-engine/engine/engine.mjs'
import { parseArguments } from '../signal-evaluate.mjs'
import { disclosureCategories } from '../signal-shadow-qualification.mjs'

const COMMIT = '21cdb441befc2e3b3a52011093603911a67d9a5f'
const ACCEPTED = '2026-10-04T00:20:00.000Z', ASOF = '2026-10-04T00:21:00.000Z'
const passed = () => [{ name: 'npm run build', result: 'PASS' }, { name: 'npm run verify', result: 'PASS' }]
// This explicit mock proves adapter behavior, never live production acceptance.
const accepted = captureAcceptedInput({ targetCommit: COMMIT, codeCommit: COMMIT, gates: passed, clock: () => ACCEPTED })
const temp = prefix => fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), prefix))
const baselineRoot = temp('wil-shadow-baseline-'), baselineStore = new RestrictedStore(baselineRoot)
const invocation = { accepted, codeCommit: COMMIT, clock: () => ASOF, asOf: ASOF, runId: '100', attempt: 1 }
const first = runShadow({ ...invocation, store: baselineStore })
assert.equal(first.run.result, 'SUCCESS_NEW', JSON.stringify(first.run))
const economicBefore = dataIdentity(ROOT, COMMIT)
const workingEconomicHash = () => contentHash(economicBefore.files.map(f => ({ path: f.path, sha256: sha256(fs.readFileSync(path.join(ROOT, f.path))) })))
const workingBefore = workingEconomicHash()
function sandbox(seeded = true) {
  const root = temp('wil-shadow-test-')
  if (seeded) fs.cpSync(baselineRoot, root, { recursive: true })
  return { root, store: new RestrictedStore(root), close: () => fs.rmSync(root, { recursive: true, force: true }) }
}
const invoke = (store, options = {}) => runShadow({ ...invocation, store, runId: '101', ...options })
const count = (root, dir) => fs.existsSync(path.join(root, dir)) ? fs.readdirSync(path.join(root, dir)).filter(f => f.endsWith('.json')).length : 0
function vintageSandbox() {
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
test.after(() => fs.rmSync(baselineRoot, { recursive: true, force: true }))

test('PIPELINE validated accepted snapshot produces seven isolated factors and no aggregate', () => {
  assert.equal(first.artifact.content.ruleVersion, 'signal-engine-v0.1-draft.1')
  assert.equal(first.output.factors.length, 7)
  assert.equal(first.artifact.deterministicContentHash, contentHash(first.artifact.content))
  assert.equal(first.artifact.content.codeCommit, '139c36e5efd642aedcfd2a43194f5b8f09c7831e')
  assert(!/score|probability|overallVerdict/.test(serialize(first.artifact)))
  assert.equal(validateLedger(baselineStore.readState().ledger), true)
  assert.equal(validateRun(first.run), true)
})
test('PIPELINE same immutable request is byte-identical in independent fresh processes', () => {
  const folder = temp('wil-shadow-process-'), receipt = path.join(folder, 'receipt.json')
  fs.writeFileSync(receipt, JSON.stringify(accepted))
  const code = `import fs from 'node:fs';import path from 'node:path';import {runShadow} from './scripts/signal-engine/pipeline.mjs';import {RestrictedStore} from './scripts/signal-engine/store.mjs';import {serialize} from './research/signal-engine/engine/core.mjs';const a=JSON.parse(fs.readFileSync(process.argv[1]));const store=new RestrictedStore(path.join(path.dirname(process.argv[1]),'empty-store'));const r=runShadow({accepted:a,store,codeCommit:'${COMMIT}',asOf:'${ASOF}',clock:()=> '${ASOF}',dryRun:true});if(!r.artifact)throw Error(JSON.stringify(r.run));process.stdout.write(serialize(r.artifact));`
  try {
    const runs = Array.from({ length: 3 }, () => execFileSync(process.execPath, ['--input-type=module', '-e', code, receipt], { cwd: ROOT, maxBuffer: 3_000_000 }).toString())
    assert.equal(runs[0], runs[1]); assert.equal(runs[0], runs[2])
    assert.equal(runs[0], serialize(first.artifact))
  } finally { fs.rmSync(folder, { recursive: true, force: true }) }
})
test('PIPELINE no-op check reuses digest and keeps original as-of/evaluation time', () => {
  const s = sandbox()
  try {
    const r = invoke(s.store, { clock: () => '2026-10-04T00:22:00.000Z', asOf: '2026-10-04T00:22:00.000Z', evaluateFn: () => { throw Error('UNNECESSARY_EVALUATION') } })
    assert.equal(r.run.result, 'SUCCESS_REUSED'); assert.equal(r.run.artifactHash, first.run.artifactHash)
    assert.equal(r.artifact.content.asOf, ASOF); assert.equal(count(s.root, 'interpretations'), 1)
    assert.equal(count(s.root, 'runs'), 2)
    const ledger = s.store.readState().ledger
    assert.equal(ledger.status, 'UNCHANGED'); assert.equal(ledger.lastSuccessfulEvaluationAt, ASOF)
    assert.equal(ledger.lastSuccessfulReuseCheckAt, '2026-10-04T00:22:00.000Z')
  } finally { s.close() }
})
test('QUALIFICATION forced test evaluator fails despite an eligible cache hit and preserves last valid', () => {
  const s = sandbox()
  try {
    let called = false
    const r = invoke(s.store, { testOnlyForceEvaluation: true, evaluateFn: () => { called = true; throw Error('TEST_ONLY_INJECTION') } })
    assert(called); assert.equal(r.run.result, 'FAILED'); assert.equal(r.run.failureStage, 'ENGINE')
    assert.equal(r.run.fallbackArtifactHash, first.run.artifactHash)
    const ledger = s.store.readState().ledger
    assert.equal(ledger.status, 'FAILED_WITH_LAST_VALID'); assert.equal(ledger.lastValidArtifactHash, first.run.artifactHash)
    assert.equal(count(s.root, 'interpretations'), 1)
    validateStoredInterpretation(s.store, first.run.artifactHash)
    assert.equal(workingEconomicHash(), workingBefore)
  } finally { s.close() }
})
test('QUALIFICATION force hook requires an explicit test evaluator and is absent from production CLI', () => {
  const s = sandbox()
  try {
    const r = invoke(s.store, { testOnlyForceEvaluation: true })
    assert.equal(r.run.result, 'FAILED'); assert.equal(r.run.failureStage, 'ENGINE')
    assert.throws(() => parseArguments(['--test-only-force-evaluation']))
  } finally { s.close() }
})
test('QUALIFICATION disclosure checks reject email, personal paths, credentials and restricted public payloads', () => {
  for (const [text, category] of [
    ['researcher@example.org', 'EMAIL_ADDRESS'], ['/Users/example/private.json', 'PERSONAL_PATH'],
    ['ghp_' + 'x'.repeat(36), 'CREDENTIAL_PATTERN'],
    ['signal-shadow-interpretation/1', 'RESTRICTED_SIGNAL_PAYLOAD'],
    ['/home/runner/work/repository/file.json', 'WORKSPACE_PATH'],
  ]) assert(disclosureCategories(text, { publicOutput: true }).includes(category))
  assert.deepEqual(disclosureCategories('{"result":"PASS"}', { logs: true }), [])
})
test('PIPELINE execution timestamp/unrelated code commit changes only operational run identity', () => {
  const s = sandbox()
  try {
    const r = invoke(s.store, { codeCommit: 'b3d2fc295b0378c7d29ae6fe8d36e275a55753a9', clock: () => '2026-10-04T00:22:00.000Z' })
    assert.equal(r.run.result, 'SUCCESS_REUSED'); assert.equal(r.run.artifactHash, first.run.artifactHash)
    assert.notEqual(r.run.codeCommit, first.run.codeCommit); assert.equal(r.artifact.content.codeCommit, first.artifact.content.codeCommit)
  } finally { s.close() }
})
test('PIPELINE changed adapter semantics requires evaluation and retains validated old content on failure', () => {
  const s = sandbox()
  try {
    const context = s.store.read('contexts', first.artifact.content.contextHash)
    context.semanticCodeHash = 'd'.repeat(64)
    const contextHash = s.store.immutable('contexts', context)
    const artifact = structuredClone(first.artifact)
    artifact.content.semanticCodeHash = context.semanticCodeHash; artifact.content.contextHash = contextHash
    artifact.deterministicContentHash = contentHash(artifact.content)
    const hash = s.store.immutable('interpretations', artifact)
    const state = s.store.readState(); state.ledger.lastValidArtifactHash = hash
    s.store.promote(state.ledger)
    const failed = invoke(s.store, { evaluateFn: () => { throw Error('NEW_CODE_FAILED') } })
    assert.equal(failed.run.result, 'FAILED'); assert.equal(failed.run.fallbackArtifactHash, hash)
    const recovered = invoke(s.store, { runId: '102' })
    assert.equal(recovered.run.result, 'SUCCESS_NEW', JSON.stringify(recovered.run))
    assert.notEqual(recovered.run.artifactHash, hash)
  } finally { s.close() }
})
test('PIPELINE freshness boundary forces evaluation without carrying old direction forward', () => {
  const s = sandbox()
  try {
    const r = invoke(s.store, { asOf: '2027-01-01T00:00:00.000Z', clock: () => '2027-01-01T00:00:00.000Z' })
    assert.equal(r.run.result, 'SUCCESS_NEW', JSON.stringify(r.run))
    assert(r.output.factors.some(f => f.direction === 'INSUFFICIENT_DATA'))
    assert(r.output.factors.filter(f => f.direction === 'INSUFFICIENT_DATA').every(f => f.confidence === 'UNASSESSED'))
    assert.notEqual(r.run.artifactHash, first.run.artifactHash)
    assert(r.output.factors.some(f => f.lastValidArtifactRef?.includes(first.artifact.content.enginePayloadHash)))
  } finally { s.close() }
})
test('PIPELINE two genuine snapshot vintages preserve arithmetic while auditing changed raw/provenance identity', () => {
  const s = vintageSandbox(), older = 'b3d2fc295b0378c7d29ae6fe8d36e275a55753a9'
  try {
    s.install(older)
    const old = captureAcceptedInput({ repo: s.repo, targetCommit: older, codeCommit: COMMIT, gates: passed, clock: () => ACCEPTED })
    const a = runShadow({ ...invocation, repo: s.repo, store: s.store, accepted: old })
    assert.equal(a.run.result, 'SUCCESS_NEW', JSON.stringify(a.run))
    s.install(COMMIT)
    const latest = captureAcceptedInput({ repo: s.repo, targetCommit: COMMIT, codeCommit: COMMIT, gates: passed, clock: () => '2026-10-04T00:22:00.000Z' })
    const b = runShadow({ ...invocation, repo: s.repo, store: s.store, accepted: latest, runId: '101', asOf: '2026-10-04T00:23:00.000Z', clock: () => '2026-10-04T00:23:00.000Z' })
    assert.equal(b.run.result, 'SUCCESS_NEW', JSON.stringify(b.run))
    assert.deepEqual(a.output.factors.map(f => f.direction), b.output.factors.map(f => f.direction))
    assert.notEqual(a.run.artifactHash, b.run.artifactHash)
    for (const id of ['reserve-share', 'foreign-treasury-holdings', 'offshore-usd-credit']) {
      const f = b.output.factors.find(f => f.factorId === id)
      assert(f.changeReason.includes('STATUS_CHANGE')); assert(!f.changeReason.includes('REVISION_DRIVEN_CHANGE'))
    }
    assert.equal(workingEconomicHash(), workingBefore)
  } finally { s.close() }
})
test('PIPELINE new accepted snapshot plus engine failure keeps earlier interpretation explicitly mismatched', () => {
  const s = vintageSandbox(), older = 'b3d2fc295b0378c7d29ae6fe8d36e275a55753a9'
  try {
    s.install(older)
    const old = captureAcceptedInput({ repo: s.repo, targetCommit: older, codeCommit: COMMIT, gates: passed, clock: () => ACCEPTED })
    const a = runShadow({ ...invocation, repo: s.repo, store: s.store, accepted: old })
    s.install(COMMIT)
    const latest = captureAcceptedInput({ repo: s.repo, targetCommit: COMMIT, codeCommit: COMMIT, gates: passed, clock: () => '2026-10-04T00:22:00.000Z' })
    const b = runShadow({ ...invocation, repo: s.repo, store: s.store, accepted: latest, runId: '101', asOf: '2026-10-04T00:23:00.000Z', clock: () => '2026-10-04T00:23:00.000Z', evaluateFn: () => { throw Error('ENGINE_FAILED') } })
    assert.equal(b.run.result, 'FAILED'); assert.equal(b.run.fallbackArtifactHash, a.run.artifactHash)
    const ledger = s.store.readState().ledger
    assert.equal(ledger.latestInputSnapshot.commit, COMMIT); assert.equal(ledger.lastValidInputSnapshot.commit, older)
    assert.equal(ledger.inputRelationship, 'LAST_VALID_INPUT_MISMATCH'); assert.equal(ledger.lastValidAsOf, ASOF)
    assert.equal(workingEconomicHash(), workingBefore)
  } finally { s.close() }
})

for (const [name, mutation] of Object.entries({
  'backdated acceptance': a => { a.receipt.acceptedAt = '2022-01-01T00:00:00.000Z' },
  'wrong protected snapshot hash': a => { a.receipt.inputSnapshotHash = 'a'.repeat(64) },
  'wrong dataset path': a => { a.manifest.datasets[0].snapshotPath = 'data/private.json' },
  'missing validation proof': a => { a.manifest.datasets[0].acceptanceRecord = null },
  'missing source dataset': a => { a.manifest.datasets.pop() },
  'failed economic gate': a => { a.receipt.gates[1].result = 'FAIL' },
})) test(`PIPELINE acceptance rejects ${name} even after self-consistent envelope rehash`, () => {
  const a = structuredClone(accepted); mutation(a)
  a.receiptHash = contentHash(a.receipt); a.manifestHash = contentHash(a.manifest)
  assert.throws(() => validateAcceptedInput(a))
})
test('PIPELINE gate failure never creates a production receipt', () => {
  assert.throws(() => captureAcceptedInput({ targetCommit: COMMIT, codeCommit: COMMIT, gates: () => { throw Error('ECONOMIC_VERIFICATION_FAILED') } }))
})
test('PIPELINE as-of preceding genuine receipt is not accepted as historical replay', () => {
  const s = sandbox()
  try {
    const r = invoke(s.store, { asOf: '2022-06-30T23:59:59.999Z' })
    assert.equal(r.run.result, 'FAILED'); assert.equal(r.run.failureStage, 'ACCEPTANCE')
    assert.equal(s.store.readState().ledger.lastValidArtifactHash, first.run.artifactHash)
  } finally { s.close() }
})

for (const [name, options] of Object.entries({
  'A engine exception': { evaluateFn: () => { throw Error('private secret must not leak') } },
  'B semantic validation failure': { afterEvaluation: o => { o.factors[0].availabilityBasis = 'PUBLISHER_RELEASE_VINTAGE'; return o } },
  'C malformed artifact': { beforeArtifact: a => { delete a.content.ruleVersion; return a } },
  'D invalid provenance': { afterEvaluation: o => { o.lineage.find(l => l.seriesId === 'COFER_USD').denominator = 'invented'; return o } },
})) test(`FAILURE-INJECTION ${name} preserves economic bytes and last-valid`, () => {
  const s = sandbox()
  try {
    // Different eligibility forces actual evaluation rather than an early no-op.
    const r = invoke(s.store, { asOf: '2026-10-06T12:00:00.000Z', clock: () => '2026-10-06T12:00:00.000Z', ...options })
    assert.equal(r.run.result, 'FAILED', JSON.stringify(r.run))
    assert.equal(r.run.fallbackArtifactHash, first.run.artifactHash)
    assert.equal(s.store.readState().ledger.status, 'FAILED_WITH_LAST_VALID')
    assert.equal(s.store.readState().ledger.lastValidArtifactHash, first.run.artifactHash)
    assert.equal(workingEconomicHash(), workingBefore)
    assert(!serialize(r.run).includes('private secret'))
  } finally { s.close() }
})
for (const point of ['immutable:engine', 'immutable:interpretations', 'immutable:ledgers', 'pointer:status.json']) test(`FAILURE-INJECTION storage/index failure at ${point} leaves prior pointer valid`, () => {
  const s = sandbox(), before = fs.readFileSync(path.join(s.root, 'status.json'), 'utf8')
  try {
    const store = new RestrictedStore(s.root, { fault: stage => { if (stage === point) throw Error('WRITE_FAILED') } })
    const r = invoke(store, { asOf: '2026-10-06T12:00:00.000Z', clock: () => '2026-10-06T12:00:00.000Z' })
    assert.equal(r.run.result, 'FAILED'); assert.equal(r.run.fallbackArtifactHash, first.run.artifactHash)
    assert.equal(store.readState().ledger.lastValidArtifactHash, first.run.artifactHash)
    if (point.includes('ledgers') || point.includes('pointer')) assert.equal(fs.readFileSync(path.join(s.root, 'status.json'), 'utf8'), before)
    assert.equal(workingEconomicHash(), workingBefore)
  } finally { s.close() }
})
for (const [name, category, hash] of [
  ['G incomplete previous artifact', 'engine', first.artifact.content.enginePayloadHash],
  ['H missing previous artifact', 'interpretations', first.run.artifactHash],
]) test(`FAILURE-INJECTION ${name} cannot supply an invalid last-valid assessment`, () => {
  const s = sandbox()
  try {
    fs.unlinkSync(s.store.location(category, hash))
    const r = invoke(s.store, { evaluateFn: () => { throw Error('ENGINE_FAILED') } })
    assert.equal(r.run.result, 'FAILED'); assert.equal(r.run.fallbackArtifactHash, null)
    assert.equal(s.store.readState().ledger.status, 'NO_VALID_ARTIFACT')
  } finally { s.close() }
})
test('FAILURE-INJECTION J corrupted latest run is detected and safely superseded', () => {
  const s = sandbox()
  try {
    const hash = s.store.readState().ledger.lastRunHash
    fs.writeFileSync(s.store.location('runs', hash), '{}')
    const r = invoke(s.store)
    assert.equal(r.run.recoveredState, true)
    assert.equal(r.run.result, 'SUCCESS_REUSED', JSON.stringify(r.run))
    assert.equal(r.run.artifactHash, first.run.artifactHash)
    assert.equal(r.run.recoveryCategory, 'CORRUPTED_PREVIOUS_RUN')
    validateRun(s.store.read('runs', s.store.readState().ledger.lastRunHash))
  } finally { s.close() }
})
test('CRASH artifact written but pointer failed leaves an orphan, not a promoted assessment', () => {
  const s = sandbox()
  try {
    const before = s.store.readState().pointer.ledgerHash
    const broken = new RestrictedStore(s.root, { fault: name => { if (name === 'pointer:status.json') throw Error('CRASH') } })
    invoke(broken, { asOf: '2026-10-06T12:00:00.000Z', clock: () => '2026-10-06T12:00:00.000Z' })
    assert(count(s.root, 'interpretations') > 1)
    assert.equal(s.store.readState().pointer.ledgerHash, before)
    assert.equal(s.store.readState().ledger.lastValidArtifactHash, first.run.artifactHash)
  } finally { s.close() }
})
test('CRASH corrupt status pointer recovers only the committed backup', () => {
  const s = sandbox()
  try {
    invoke(s.store)
    fs.writeFileSync(path.join(s.root, 'status.json'), '{bad')
    const state = s.store.readState()
    assert.equal(state.recovered, true); assert.equal(state.ledger.lastValidArtifactHash, first.run.artifactHash)
  } finally { s.close() }
})
test('CRASH missing status pointer recovers the committed backup without adopting orphan content', () => {
  const s = sandbox()
  try {
    invoke(s.store)
    fs.unlinkSync(path.join(s.root, 'status.json'))
    const state = s.store.readState()
    assert.equal(state.recovered, true); assert.equal(state.ledger.lastValidArtifactHash, first.run.artifactHash)
  } finally { s.close() }
})
test('CRASH ledger references missing artifact, earlier committed ledger still supplies fallback', () => {
  const s = sandbox()
  try {
    const later = invoke(s.store, { asOf: '2026-10-06T12:00:00.000Z', clock: () => '2026-10-06T12:00:00.000Z' })
    assert.equal(later.run.result, 'SUCCESS_NEW')
    fs.unlinkSync(s.store.location('interpretations', later.run.artifactHash))
    const r = invoke(s.store, { runId: '102', asOf: '2026-10-07T12:00:00.000Z', clock: () => '2026-10-07T12:00:00.000Z', evaluateFn: () => { throw Error('ENGINE_FAILED') } })
    assert.equal(r.run.fallbackArtifactHash, first.run.artifactHash)
  } finally { s.close() }
})
test('CRASH interrupted temp files are ignored and cleaned under the storage lock', () => {
  const s = sandbox()
  try {
    fs.writeFileSync(path.join(s.root, 'interpretations', '.temporary-interrupted'), 'incomplete')
    invoke(s.store)
    assert(!fs.existsSync(path.join(s.root, 'interpretations', '.temporary-interrupted')))
  } finally { s.close() }
})
test('CRASH duplicate identical run creates no duplicate immutable run or interpretation', () => {
  const s = sandbox()
  try {
    const a = invoke(s.store), beforeRuns = count(s.root, 'runs'), beforeArtifacts = count(s.root, 'interpretations')
    const b = invoke(s.store)
    assert.equal(a.run.artifactHash, b.run.artifactHash); assert.equal(count(s.root, 'runs'), beforeRuns); assert.equal(count(s.root, 'interpretations'), beforeArtifacts)
  } finally { s.close() }
})
test('CRASH live/unknown locks are not broken because of age', () => {
  const s = sandbox()
  try {
    const release = s.store.lock()
    assert.throws(() => s.store.lock(), /LOCKED/)
    release()
    fs.mkdirSync(path.join(s.root, '.lock'))
    assert.throws(() => s.store.lock(), /INCOMPLETE_STORAGE_LOCK/)
  } finally { s.close() }
})
test('CRASH provably dead local lock can recover without promoting incomplete artifacts', () => {
  const s = sandbox()
  try {
    fs.mkdirSync(path.join(s.root, '.lock'))
    fs.writeFileSync(path.join(s.root, '.lock/owner.json'), JSON.stringify({ pid: 2147483647, host: os.hostname(), token: 'dead' }))
    const release = s.store.lock(); assert(s.store.readState().ledger.lastValidArtifactHash); release()
  } finally { s.close() }
})
test('STORAGE permissions, immutable digest readback and conflicting content rejection', () => {
  const s = sandbox(false)
  try {
    const hash = s.store.immutable('runs', { test: 'one' })
    assert.equal(fs.statSync(s.root).mode & 0o777, 0o700)
    assert.equal(fs.statSync(s.store.location('runs', hash)).mode & 0o777, 0o600)
    fs.writeFileSync(s.store.location('runs', hash), 'different')
    assert.throws(() => s.store.read('runs', hash), /HASH_MISMATCH/)
    assert.throws(() => s.store.immutable('runs', { test: 'one' }), /CONFLICT/)
  } finally { s.close() }
})
test('STORAGE symlink/public/data destinations and traversal references rejected', () => {
  for (const destination of ['public/signals', 'src/signals', 'data/signal-engine']) assert.throws(() => new RestrictedStore(path.join(ROOT, destination)), /ISOLATED/)
  const s = sandbox(false)
  try {
    fs.symlinkSync(path.join(ROOT, 'data'), path.join(s.root, 'interpretations'))
    assert.throws(() => s.store.location('interpretations', first.run.artifactHash), /SYMLINK/)
    assert.throws(() => s.store.read('interpretations', '../private'), /REFERENCE/)
  } finally { s.close() }
})
test('ORDERING delayed older workflow or lower retry cannot supersede newer success', () => {
  const s = sandbox()
  try {
    const before = fs.readFileSync(path.join(s.root, 'status.json'), 'utf8')
    assert.equal(invoke(s.store, { runId: '99' }).run.result, 'SUPERSEDED')
    invoke(s.store, { runId: '100', attempt: 2 })
    const latest = fs.readFileSync(path.join(s.root, 'status.json'), 'utf8')
    assert.equal(invoke(s.store, { runId: '100', attempt: 1 }).run.result, 'SUPERSEDED')
    assert.equal(fs.readFileSync(path.join(s.root, 'status.json'), 'utf8'), latest)
    assert.notEqual(latest, before)
  } finally { s.close() }
})

for (const [name, mutate] of Object.entries({
  'unknown field/local path': p => { p.localPath = '/Users/private' },
  'wrong state': p => { p.factors[0].state = 'BUY' },
  'false availability basis': p => { p.factors[0].availabilityBasis = 'PUBLISHER_RELEASE_VINTAGE' },
  'fake denominator': p => { p.lineage.find(l => l.seriesId === 'COFER_USD').denominator = 'all wealth' },
  'wrong source URL': p => { p.lineage[0].sourceUrl = 'https://evil.invalid/token' },
  'wrong input hash': p => { p.inputSnapshotHash = 'a'.repeat(64) },
})) test(`PROJECTION independent mutation rejects ${name}`, () => {
  const p = structuredClone(first.projection); mutate(p)
  assert.throws(() => validateProjection(p, first.output, accepted.receipt.inputSnapshotHash))
})
test('PROJECTION strips injected private free text/IDs without leaking paths, credentials or workflow data', () => {
  const output = structuredClone(first.output)
  output.lineage.forEach(l => { l.datasetId = '/Users/private'; l.inputVintageId = 'secret@example.com'; l.limitations = ['SECRET_TOKEN']; l.id = '/private/machine/' + l.id })
  const mapping = new Map(first.output.lineage.map((l, i) => [l.id, output.lineage[i].id]))
  output.factors.forEach(f => { for (const key of ['evidence', 'counterevidence', 'context']) f[key] = f[key].map(id => mapping.get(id)) })
  const p = safeProjection(output, accepted.receipt.inputSnapshotHash)
  assert(!/\/Users\/|\/private\/|secret@example|SECRET_TOKEN/.test(serialize(p)))
})
test('PROJECTION source URL credentials rejected rather than silently copied', () => {
  const o = structuredClone(first.output); o.lineage.find(l => l.sourceUrl).sourceUrl = 'https://user:SECRET@fred.stlouisfed.org/series/PCEPILFE'
  assert.throws(() => safeProjection(o, accepted.receipt.inputSnapshotHash), /UNSAFE/)
})
test('ARTIFACT hash and semantic factor mutation fail independently', () => {
  const args = { output: first.output, projection: first.projection, contextHash: first.artifact.content.contextHash, inputSnapshotHash: accepted.receipt.inputSnapshotHash, semanticCodeHash: semanticCodeIdentity() }
  const a = structuredClone(first.artifact); a.content.domesticFactors[0].state = 'LITTLE_CHANGE'; a.deterministicContentHash = contentHash(a.content)
  assert.throws(() => validateInterpretation(a, args), /SEMANTIC_MISMATCH/)
})
test('DRY RUN evaluates and validates with no storage mutations', () => {
  const s = sandbox(false)
  try {
    const result = invoke(s.store, { dryRun: true })
    assert.equal(result.run.result, 'DRY_RUN'); assert.equal(fs.readdirSync(s.root).length, 0)
  } finally { s.close() }
})
test('CLI accepts explicit shadow/dry-run input and rejects dangerous or ambiguous options', () => {
  assert.equal(parseArguments(['--shadow', '--dry-run', '--snapshot', COMMIT]).snapshot, COMMIT)
  for (const argv of [['--mode', 'public'], ['--publish'], ['--attempt', '0'], ['--private-archive', '--dry-run'], ['--snapshot', COMMIT, '--snapshot', COMMIT]]) assert.throws(() => parseArguments(argv))
})
for (const argv of [['--publish'], ['--private-archive'], ['--store', path.join(ROOT, 'public')]]) test(`CLI ${argv[0]} failure is bounded operational JSON without private paths or diagnostics`, () => {
  const r = spawnSync(process.execPath, ['scripts/signal-evaluate.mjs', ...argv], { cwd: ROOT, encoding: 'utf8', env: { ...process.env, SIGNAL_ARCHIVE_REPOSITORY: '', SIGNAL_ARCHIVE_TOKEN: '' } })
  assert.equal(r.status, 1); assert.equal(r.stderr, '')
  const report = JSON.parse(r.stdout.trim())
  assert.equal(report.result, 'FAILED'); assert.equal(report.storagePersisted, false)
  assert(!r.stdout.includes(ROOT)); assert(!r.stdout.includes('TOKEN'))
})
test('ISOLATION workflow shadow job cannot gate deployment/notifications; no public artifacts or UI changes', () => {
  const yml = fs.readFileSync(path.join(ROOT, '.github/workflows/deploy.yml'), 'utf8')
  const shadow = yml.split('  signal-shadow:')[1].split('  deploy:')[0]
  assert(shadow.includes('needs: build')); assert(shadow.includes('continue-on-error: true')); assert(shadow.includes('--private-archive'))
  assert(!shadow.includes('upload-artifact')); assert(!yml.split('  deploy:')[1].split('  notify:')[0].includes('signal-shadow'))
  assert.equal(JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'))).version, '1.0.0')
  assert(fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8').includes('research/signal-engine/production-artifacts/'))
  assert.equal(execFileSync('git', ['diff', COMMIT, '--name-only', '--', 'src', 'data', 'public', 'scripts/notify.mjs', 'scripts/refresh-data.mjs'], { cwd: ROOT }).toString(), '')
})
