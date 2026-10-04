// Small allowlisted handoff, never an interpretation/lineage transport.
export const SUMMARY_VERSION = 'signal-shadow-summary/1'
const statuses = ['CURRENT', 'UNCHANGED', 'FAILED_WITH_LAST_VALID', 'NO_VALID_ARTIFACT', 'DISABLED', 'UNKNOWN']
const quality = ['HIGH', 'MEDIUM', 'LOW', 'UNASSESSED']
const labels = {
  'inflation-persistence': 'Core PCE', 'observed-productivity': 'Productivity',
  'supply-chain-pressure': 'GSCPI', 'policy-rate-direction': 'FEDFUNDS',
  'reserve-share': 'COFER', 'foreign-treasury-holdings': 'TIC', 'offshore-usd-credit': 'BIS',
}
const stages = ['CONFIGURATION', 'ARCHIVE_RESTORE', 'ARCHIVE_PUBLISH', 'STORAGE', 'PREVIOUS', 'ACCEPTANCE', 'ENGINE', 'SEMANTIC_VALIDATION', 'PROJECTION', 'ARTIFACT_VALIDATION', 'INDEX', 'ECONOMIC_BUILD']
const categories = ['INVALID_SHADOW_COMMAND', 'RESTRICTED_SHADOW_OPERATION_FAILED', 'INVALID_OR_UNACCEPTED_INPUT', 'ENGINE_EVALUATION_FAILED', 'INVALID_INTERPRETATION', 'INVALID_RETAINED_STATE', 'RESTRICTED_STORAGE_FAILED', 'ECONOMIC_BUILD_NOT_SUCCESSFUL']
const short = (value, length) => typeof value === 'string' && new RegExp(`^[a-f0-9]{${length}}$`).test(value) ? value.slice(0, 10) : null
export function emptySummary(status = 'UNKNOWN') {
  return { schemaVersion: SUMMARY_VERSION, status, inputSnapshotShort: null,
    lastValidSnapshotShort: null, lastValidArtifactShort: null,
    ruleVersion: 'signal-engine-v0.1-draft.1', engineVersion: 'offline-prototype/0.1.2',
    factorsValid: null, factorCount: null, evidenceQualitySummary: null,
    thresholdSensitiveFactors: [], failureStage: null, failureCategory: null,
    interpretationReused: false }
}
export function validateSummary(s) {
  const expected = Object.keys(emptySummary()).sort()
  if (!s || typeof s !== 'object' || Array.isArray(s) || JSON.stringify(Object.keys(s).sort()) !== JSON.stringify(expected)) throw Error('UNSAFE_SIGNAL_SUMMARY')
  if (s.schemaVersion !== SUMMARY_VERSION || !statuses.includes(s.status) || s.ruleVersion !== 'signal-engine-v0.1-draft.1' || s.engineVersion !== 'offline-prototype/0.1.2') throw Error('INVALID_SIGNAL_SUMMARY')
  for (const k of ['inputSnapshotShort', 'lastValidSnapshotShort', 'lastValidArtifactShort']) if (s[k] !== null && (typeof s[k] !== 'string' || !/^[a-f0-9]{10}$/.test(s[k]))) throw Error('UNSAFE_SIGNAL_IDENTITY')
  if (s.failureStage !== null && !stages.includes(s.failureStage) || s.failureCategory !== null && !categories.includes(s.failureCategory)) throw Error('UNSAFE_SIGNAL_FAILURE')
  if (!Array.isArray(s.thresholdSensitiveFactors) || s.thresholdSensitiveFactors.length > 7 || new Set(s.thresholdSensitiveFactors).size !== s.thresholdSensitiveFactors.length || s.thresholdSensitiveFactors.some(v => !Object.values(labels).includes(v))) throw Error('UNSAFE_SIGNAL_SENSITIVITY')
  if (s.interpretationReused !== (s.status === 'UNCHANGED')) throw Error('INVALID_SIGNAL_REUSE')
  if (s.factorCount !== null) {
    if (s.factorCount !== 7 || !Number.isInteger(s.factorsValid) || s.factorsValid < 0 || s.factorsValid > 7) throw Error('INVALID_FACTOR_COUNTS')
    const q = s.evidenceQualitySummary
    if (!q || JSON.stringify(Object.keys(q).sort()) !== JSON.stringify([...quality].sort()) || quality.some(k => !Number.isInteger(q[k]) || q[k] < 0 || q[k] > 7) || quality.reduce((n, k) => n + q[k], 0) !== 7 || s.factorsValid > 7 - q.UNASSESSED) throw Error('INVALID_QUALITY_COUNTS')
  } else if (s.factorsValid !== null || s.evidenceQualitySummary !== null || s.thresholdSensitiveFactors.length) throw Error('UNSUPPORTED_FACTOR_CLAIM')
  if (['CURRENT', 'UNCHANGED', 'FAILED_WITH_LAST_VALID'].includes(s.status)) {
    if (!s.lastValidArtifactShort || !s.lastValidSnapshotShort || s.factorCount !== 7) throw Error('MISSING_LAST_VALID_IDENTITY')
  } else if (s.lastValidArtifactShort || s.lastValidSnapshotShort || s.factorCount !== null) throw Error('UNSUPPORTED_LAST_VALID_CLAIM')
  if (['CURRENT', 'UNCHANGED'].includes(s.status) && (!s.inputSnapshotShort || s.inputSnapshotShort !== s.lastValidSnapshotShort || s.failureStage || s.failureCategory)) throw Error('INVALID_CURRENT_CLAIM')
  if (['FAILED_WITH_LAST_VALID', 'NO_VALID_ARTIFACT'].includes(s.status) && (!s.failureStage || !s.failureCategory)) throw Error('MISSING_FAILURE_CATEGORY')
  return s
}
export function readSummary(value) {
  try {
    const json = typeof value === 'string' ? value : JSON.stringify(value)
    if (typeof json !== 'string' || json.length > 4096) throw Error('SUMMARY_TOO_LARGE')
    value = JSON.parse(json)
    return validateSummary(value)
  } catch { return emptySummary() }
}
// Caller supplies only a result already validated by the production adapter.
export function summaryFromRun(result) {
  try {
    const run = result.run
    if (!run.storagePersisted || !['SUCCESS_NEW', 'SUCCESS_REUSED', 'FAILED'].includes(run.result)) return emptySummary()
    const artifact = run.result === 'FAILED' ? result.fallback : result.artifact
    const s = emptySummary(run.result === 'FAILED' ? artifact ? 'FAILED_WITH_LAST_VALID' : 'NO_VALID_ARTIFACT' : run.result === 'SUCCESS_REUSED' ? 'UNCHANGED' : 'CURRENT')
    s.inputSnapshotShort = short(run.inputSnapshotCommit, 40)
    s.interpretationReused = s.status === 'UNCHANGED'
    s.failureStage = run.failureStage; s.failureCategory = run.errorCategory
    if (artifact) {
      if (artifact.content.ruleVersion !== s.ruleVersion || artifact.content.engineVersion !== s.engineVersion) throw Error('UNSUPPORTED_SUMMARY_VERSION')
      s.lastValidSnapshotShort = short(artifact.content.inputSnapshotCommit, 40)
      s.lastValidArtifactShort = short(run.result === 'FAILED' ? run.fallbackArtifactHash : run.artifactHash, 64)
      const factors = [...artifact.content.domesticFactors, ...artifact.content.internationalFactors]
      if (JSON.stringify(factors.map(f => f.factorId)) !== JSON.stringify(Object.keys(labels))) throw Error('INVALID_FACTOR_SET')
      s.factorCount = factors.length
      s.factorsValid = factors.filter(f => f.state !== 'INSUFFICIENT_DATA' && f.evidenceQuality !== 'UNASSESSED').length
      s.evidenceQualitySummary = Object.fromEntries(quality.map(q => [q, factors.filter(f => f.evidenceQuality === q).length]))
      s.thresholdSensitiveFactors = factors.filter(f => f.sensitivity === 'THRESHOLD_SENSITIVE').map(f => labels[f.factorId])
    }
    return validateSummary(s)
  } catch { return emptySummary() }
}
export function resolveSummary({ value, enabled, jobResult, buildResult }) {
  if (enabled === false) return emptySummary('DISABLED')
  if (enabled === true && jobResult === 'skipped' && buildResult !== 'success') {
    return { ...emptySummary(), failureStage: 'ECONOMIC_BUILD', failureCategory: 'ECONOMIC_BUILD_NOT_SUCCESSFUL' }
  }
  return readSummary(value)
}
export function renderSummary(value, { deploy = 'unaffected' } = {}) {
  const s = readSummary(value)
  const lines = ['--------------------------------', 'Signal Engine Shadow', '--------------------------------', `Status: ${s.status}`]
  if (s.inputSnapshotShort) lines.push(`${s.status === 'FAILED_WITH_LAST_VALID' || s.status === 'NO_VALID_ARTIFACT' ? 'Current economic snapshot' : 'Input snapshot'}: ${s.inputSnapshotShort}`)
  if (s.lastValidArtifactShort) {
    lines.push(`Last valid interpretation snapshot: ${s.lastValidSnapshotShort}`, `Last valid artifact: ${s.lastValidArtifactShort}`)
    const prefix = s.status === 'FAILED_WITH_LAST_VALID' ? 'Last-valid ' : ''
    lines.push(`${prefix}Factors valid: ${s.factorsValid}/${s.factorCount}`)
    const q = s.evidenceQualitySummary
    const nonzero = quality.filter(k => q[k])
    lines.push(`${prefix}Evidence quality: ${nonzero.length === 1 ? `${q[nonzero[0]]} ${nonzero[0]}` : quality.map(k => `${k} ${q[k]}`).join(' / ')}`)
    lines.push(`${prefix}Threshold-sensitive: ${s.thresholdSensitiveFactors.join(', ') || 'None'}`)
  }
  if (s.failureStage) lines.push(`Failure stage: ${s.failureStage}`, `Failure category: ${s.failureCategory}`)
  if (s.status === 'UNCHANGED') lines.push('Interpretation reused because semantic inputs and eligibility were unchanged.')
  if (s.status === 'FAILED_WITH_LAST_VALID') lines.push('Previous validated interpretation was preserved.', 'No current Signal Engine interpretation was published.')
  if (s.status === 'NO_VALID_ARTIFACT') lines.push('No validated Signal Engine interpretation is available for this run.', 'Economic deployment remains unaffected.')
  if (s.status === 'DISABLED') lines.push('Automatic Signal Engine shadow execution is currently disabled.')
  if (s.status === 'UNKNOWN') lines.push('Summary unavailable for this run.')
  const deployment = ['success', 'failure', 'cancelled', 'skipped'].includes(deploy) ? deploy.toUpperCase() : 'unaffected'
  lines.push(`Economic deployment: ${deployment}`, 'Deployment affected by Signal Engine: NO')
  return lines.join('\n')
}
