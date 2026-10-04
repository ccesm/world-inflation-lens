import { randomUUID } from 'node:crypto'
import { evaluate } from '../../research/signal-engine/engine/engine.mjs'
import { validateArtifact } from '../../research/signal-engine/engine/validation.mjs'
import { contentHash, instant } from '../../research/signal-engine/engine/core.mjs'
import { validateAcceptedInput } from './acceptance.mjs'
import { ROOT, ADAPTER_VERSION, RULE_VERSION, now, semanticCodeIdentity, HASH, COMMIT } from './identity.mjs'
import { RestrictedStore } from './store.mjs'
import { engineValidator, makeInterpretation, validateInterpretation, validateStoredInterpretation } from './artifact.mjs'
import { safeProjection, validateProjection } from './projection.mjs'
import { eligibilityFingerprint } from './reuse.mjs'

const STATES = ['CURRENT', 'UNCHANGED', 'FAILED_WITH_LAST_VALID', 'NO_VALID_ARTIFACT']
export function validateRun(run) {
  if (run.schemaVersion !== 'signal-shadow-run/1' || !/^[A-Za-z0-9_-]{1,100}$/.test(run.runId || '') || !Number.isSafeInteger(run.attempt) || run.attempt < 1) throw Error('INVALID_SHADOW_RUN')
  instant(run.attemptedAt); instant(run.completedAt)
  if (Date.parse(run.completedAt) < Date.parse(run.attemptedAt) || !['SUCCESS_NEW', 'SUCCESS_REUSED', 'FAILED', 'DRY_RUN'].includes(run.result)) throw Error('INVALID_SHADOW_RUN')
  if (!COMMIT.test(run.codeCommit || '') || run.artifactHash !== null && !HASH.test(run.artifactHash) || run.fallbackArtifactHash !== null && !HASH.test(run.fallbackArtifactHash)) throw Error('INVALID_SHADOW_RUN')
  if (run.result.startsWith('SUCCESS') && (!run.artifactHash || run.failureStage || run.errorCategory)) throw Error('INVALID_SHADOW_SUCCESS')
  return true
}
export function validateLedger(ledger) {
  if (ledger.schemaVersion !== 'signal-shadow-status/1' || !STATES.includes(ledger.status) || ledger.currentRuleVersion !== RULE_VERSION || ledger.engineVersion !== 'offline-prototype/0.1.2') throw Error('INVALID_SHADOW_LEDGER')
  instant(ledger.lastAttemptAt)
  for (const key of ['lastSuccessfulEvaluationAt', 'lastSuccessfulReuseCheckAt', 'lastValidAsOf']) if (ledger[key]) instant(ledger[key])
  for (const key of ['lastRunHash', 'lastValidArtifactHash', 'previousLedgerHash']) if (ledger[key] !== null && !HASH.test(ledger[key] || '')) throw Error('INVALID_SHADOW_LEDGER')
  if (['CURRENT', 'UNCHANGED', 'FAILED_WITH_LAST_VALID'].includes(ledger.status) && !ledger.lastValidArtifactHash) throw Error('INVALID_SHADOW_LEDGER')
  for (const key of ['latestInputSnapshot', 'lastValidInputSnapshot']) {
    if (ledger[key] !== null && (!COMMIT.test(ledger[key].commit || '') || !HASH.test(ledger[key].hash || ''))) throw Error('INVALID_SHADOW_LEDGER')
  }
  return true
}
function superseded(previous, run) {
  const prior = previous?.ordering
  if (!prior) return false
  if (/^\d+$/.test(prior.runId) && /^\d+$/.test(run.runId)) {
    return BigInt(prior.runId) > BigInt(run.runId) || prior.runId === run.runId && prior.attempt > run.attempt
  }
  return Date.parse(prior.startedAt) > Date.parse(run.startedAt)
}
function findLastValid(store, state, repo, semanticCodeHash) {
  let ledger = state?.ledger, ledgerHash = state?.pointer?.ledgerHash
  const seen = new Set(), cache = new Map()
  while (ledger) {
    if (seen.has(ledgerHash)) throw Error('LEDGER_HISTORY_CYCLE')
    seen.add(ledgerHash)
    validateLedger(ledger)
    if (ledger.lastValidArtifactHash) {
      try {
        const valid = validateStoredInterpretation(store, ledger.lastValidArtifactHash, { repo, cache })
        if (contentHash(ledger.lastValidInputSnapshot) !== contentHash({ commit: valid.artifact.content.inputSnapshotCommit, hash: valid.artifact.content.inputSnapshotHash }) || ledger.lastValidAsOf !== valid.output.asOf) throw Error('LEDGER_ARTIFACT_IDENTITY_MISMATCH')
        return { ...valid, hash: ledger.lastValidArtifactHash, ledger }
      } catch { /* Only validated ancestors may act as a fallback. */ }
    }
    if (!ledger.previousLedgerHash) break
    ledgerHash = ledger.previousLedgerHash
    ledger = store.read('ledgers', ledgerHash)
  }
  return null
}
function failureCategory(stage, error) {
  if (stage === 'ACCEPTANCE') return 'INVALID_OR_UNACCEPTED_INPUT'
  if (stage === 'ENGINE') return 'ENGINE_EVALUATION_FAILED'
  if (['SEMANTIC_VALIDATION', 'PROJECTION', 'ARTIFACT_VALIDATION'].includes(stage)) return 'INVALID_INTERPRETATION'
  if (stage === 'PREVIOUS') return 'INVALID_RETAINED_STATE'
  return 'RESTRICTED_STORAGE_FAILED'
}
function inputReference(accepted) { return { commit: accepted.receipt.inputCommit, hash: accepted.receipt.inputSnapshotHash } }
function relationship(input, previous) {
  if (!previous) return 'UNAVAILABLE'
  if (contentHash(input) === contentHash(inputReference(previous.accepted))) return 'MATCHING_INPUT_OLDER_INTERPRETATION'
  return 'LAST_VALID_INPUT_MISMATCH'
}

export function runShadow({ repo = ROOT, store = new RestrictedStore(), accepted, acceptedFactory, codeCommit,
  runId = randomUUID(), attempt = 1, startedAt, asOf, clock = now, dryRun = false,
  evaluateFn = evaluate, afterEvaluation = output => output, beforeArtifact = artifact => artifact } = {}) {
  let stage = 'STORAGE', release, state, previous, currentInput = null
  const attemptedAt = instant(clock()), ordering = { runId, attempt, startedAt: instant(startedAt || attemptedAt) }
  const run = {
    schemaVersion: 'signal-shadow-run/1', runId, attempt, attemptedAt, completedAt: attemptedAt,
    result: 'FAILED', adapterVersion: ADAPTER_VERSION, codeCommit, inputSnapshotCommit: null,
    inputSnapshotHash: null, acceptanceHash: null, artifactHash: null, deterministicContentHash: null,
    contentChanged: false, failureStage: null, errorCategory: null, fallbackArtifactHash: null,
    fallbackInputSnapshot: null, inputRelationship: 'UNAVAILABLE', originalInterpretationAsOf: null,
    storagePersisted: false, recoveredState: false, recoveryCategory: null, ordering,
  }
  const finishFailure = error => {
    run.completedAt = instant(clock()); run.failureStage = stage; run.errorCategory = failureCategory(stage, error)
    run.fallbackArtifactHash = previous?.hash || null
    run.fallbackInputSnapshot = previous ? inputReference(previous.accepted) : null
    run.inputRelationship = relationship(currentInput, previous)
    run.originalInterpretationAsOf = previous?.output.asOf || null
    if (!dryRun && release) {
      try { persistStatus(previous?.hash || null, previous?.artifact || null, false) } catch { run.storagePersisted = false }
    }
    return { run, artifact: null, fallback: previous?.artifact || null }
  }
  function persistStatus(artifactHash, artifact, evaluated, reused = false) {
    run.storagePersisted = true
    validateRun(run)
    const runHash = store.immutable('runs', run, validateRun)
    const old = state?.ledger || {}
    const ledger = {
      schemaVersion: 'signal-shadow-status/1', status: run.result === 'FAILED' ? artifactHash ? 'FAILED_WITH_LAST_VALID' : 'NO_VALID_ARTIFACT' : reused ? 'UNCHANGED' : 'CURRENT',
      lastAttemptAt: run.attemptedAt,
      lastSuccessfulEvaluationAt: evaluated ? run.completedAt : previous?.ledger.lastSuccessfulEvaluationAt || old.lastSuccessfulEvaluationAt || null,
      lastSuccessfulReuseCheckAt: reused ? run.completedAt : old.lastSuccessfulReuseCheckAt || null,
      latestInputSnapshot: currentInput || old.latestInputSnapshot || null,
      lastValidArtifactHash: artifactHash, lastValidInputSnapshot: artifact ? { commit: artifact.content.inputSnapshotCommit, hash: artifact.content.inputSnapshotHash } : null,
      lastValidAsOf: artifact?.content.asOf || null,
      currentRuleVersion: RULE_VERSION, engineVersion: 'offline-prototype/0.1.2', adapterVersion: ADAPTER_VERSION,
      latestFailureStage: run.failureStage, latestFailureCategory: run.errorCategory,
      lastRunHash: runHash, previousLedgerHash: state?.pointer?.ledgerHash || null,
      inputRelationship: run.inputRelationship, ordering,
    }
    validateLedger(ledger)
    store.promote(ledger)
    return ledger
  }
  try {
    if (!COMMIT.test(codeCommit || '')) throw Error('CODE_COMMIT_REQUIRED')
    if (!dryRun) release = store.lock()
    state = store.readState()
    if (state?.ledger) validateLedger(state.ledger)
    if (superseded(state?.ledger, ordering)) return { run: { ...run, result: 'SUPERSEDED', errorCategory: 'NEWER_RUN_RETAINED' }, artifact: null, fallback: null }
    const semanticCodeHash = semanticCodeIdentity(repo)
    stage = 'PREVIOUS'
    previous = findLastValid(store, state, repo, semanticCodeHash)
    run.recoveredState = state?.recovered || Boolean(state?.ledger?.lastValidArtifactHash && previous?.hash !== state.ledger.lastValidArtifactHash)
    if (state?.ledger?.lastRunHash) {
      try { validateRun(store.read('runs', state.ledger.lastRunHash)) } catch { run.recoveryCategory = 'CORRUPTED_PREVIOUS_RUN'; run.recoveredState = true }
    }
    stage = 'ACCEPTANCE'
    accepted ||= acceptedFactory?.()
    const current = validateAcceptedInput(accepted, { repo })
    current.env.configCanonicalHash = contentHash(current.env.config)
    currentInput = inputReference(accepted)
    run.inputSnapshotCommit = currentInput.commit; run.inputSnapshotHash = currentInput.hash
    run.acceptanceHash = contentHash(accepted)
    const cutoff = instant(asOf || clock())
    if (Date.parse(cutoff) < Date.parse(accepted.receipt.acceptedAt)) throw Error('ASOF_PRECEDES_PRODUCTION_ACCEPTANCE')
    const request = { mode: 'CURRENT_SNAPSHOT', asOf: cutoff, periodCutoff: null, evaluatedAt: cutoff }
    stage = 'ENGINE'
    if (previous && previous.artifact.content.semanticCodeHash === semanticCodeHash && contentHash(currentInput) === contentHash(inputReference(previous.accepted)) && Date.parse(cutoff) >= Date.parse(previous.output.asOf)) {
      const original = eligibilityFingerprint(previous.archive, previous.env, previous.context.request)
      const latest = eligibilityFingerprint(previous.archive, previous.env, request)
      if (original === latest) {
        run.completedAt = instant(clock()); run.result = dryRun ? 'DRY_RUN' : 'SUCCESS_REUSED'
        run.artifactHash = previous.hash; run.deterministicContentHash = previous.artifact.deterministicContentHash
        run.originalInterpretationAsOf = previous.output.asOf
        run.inputRelationship = 'MATCHING_INPUT_ELIGIBILITY_CHECKED'
        if (!dryRun) { store.immutable('accepted', accepted); persistStatus(previous.hash, previous.artifact, false, true) }
        return { run, artifact: previous.artifact, output: previous.output, projection: previous.projection }
      }
    }
    const archive = [...current.archive]
    // The previous evaluation's accepted vintage supports revision comparison;
    // old values are not substituted for unavailable current observations.
    const retained = previous && previous.accepted.manifestHash !== accepted.manifestHash ? [previous.accepted] : []
    for (const prior of retained) archive.push(...validateAcceptedInput(prior, { repo }).archive)
    const output = afterEvaluation(evaluateFn(archive, current.env, request, { priorArtifact: previous?.output || null }))
    stage = 'SEMANTIC_VALIDATION'
    validateArtifact(output, current.env.config, engineValidator(repo), { archive, env: current.env, priorArtifact: previous?.output || null })
    stage = 'PROJECTION'
    const projection = safeProjection(output, currentInput.hash)
    validateProjection(projection, output, currentInput.hash)
    const context = {
      schemaVersion: 'signal-shadow-context/1', acceptedHash: contentHash(accepted),
      retainedAcceptedHashes: retained.map(contentHash), priorInterpretationHash: previous?.hash || null,
      runtimeHash: contentHash(current.env.runtime), semanticCodeHash, request,
    }
    const artifact = beforeArtifact(makeInterpretation(output, projection, contentHash(context), currentInput.hash, semanticCodeHash))
    stage = 'ARTIFACT_VALIDATION'
    validateInterpretation(artifact, { output, projection, contextHash: contentHash(context), inputSnapshotHash: currentInput.hash, semanticCodeHash })
    run.completedAt = instant(clock()); run.result = dryRun ? 'DRY_RUN' : 'SUCCESS_NEW'
    run.artifactHash = contentHash(artifact); run.deterministicContentHash = artifact.deterministicContentHash
    run.contentChanged = previous?.hash !== run.artifactHash
    run.originalInterpretationAsOf = output.asOf; run.inputRelationship = 'MATCHING_INPUT_EVALUATED'
    if (!dryRun) {
      stage = 'STORAGE'
      store.immutable('accepted', accepted)
      for (const prior of retained) store.immutable('accepted', prior)
      store.immutable('engine', output)
      store.immutable('contexts', context)
      store.immutable('projections', projection, x => validateProjection(x, output, currentInput.hash))
      store.immutable('interpretations', artifact, x => validateInterpretation(x, { output, projection, contextHash: contentHash(context), inputSnapshotHash: currentInput.hash, semanticCodeHash }))
      validateStoredInterpretation(store, run.artifactHash, { repo, semanticCodeHash })
      stage = 'INDEX'
      persistStatus(run.artifactHash, artifact, true)
    }
    return { run, artifact, output, projection }
  } catch (error) {
    run.result = 'FAILED'; run.artifactHash = null; run.deterministicContentHash = null; run.contentChanged = false
    return finishFailure(error)
  } finally { release?.() }
}
