import fs from 'node:fs'
import { compileOutputSchema } from '../../research/signal-engine/engine/validation.mjs'
import { generateConclusions, generateHomeBrief, normalizeAssessments } from './signalConclusions.mjs'
import { summaryFromRun } from './signalShadowSummary.mjs'
import { signalFactors } from '../../src/data/signalPresentation.js'
import { validatePublicSignal } from '../../src/utils/signalPublicContract.js'
const validateSchema = compileOutputSchema(JSON.parse(fs.readFileSync(new URL('../../docs/signal-public-summary.schema.json', import.meta.url), 'utf8')))
export function validatePublicSchema(projection) {
  validatePublicSignal(projection)
  if (!validateSchema(projection)) throw Error('PUBLIC_SIGNAL_SCHEMA_FAILED')
  return true
}
export function makePublicSignal(result, acceptedSnapshotCommit = result.projection?.inputSnapshotCommit) {
  // summaryFromRun accepts only a successfully validated, persisted interpretation.
  const summary = summaryFromRun(result)
  if (!['CURRENT', 'UNCHANGED'].includes(summary.status) || !result.projection) throw Error('VALIDATED_CURRENT_SIGNAL_REQUIRED')
  const assessments = normalizeAssessments(summary.factorAssessments), conclusions = generateConclusions(assessments)
  const ends = []
  const factors = assessments.map((f, i) => {
    const c = signalFactors[i], primary = result.projection.lineage.find(l => l.seriesId === c.series && l.dependencyRole === 'PRIMARY_SIGNAL')
    const observation = result.projection.factors[i].observationThrough
    let window = null
    if (f.state !== 'INSUFFICIENT_DATA') {
      const transformed = primary?.transformedWindow
      if (!transformed || transformed.length !== c.confirmation || transformed.at(-1).observationPeriod.label !== observation?.label) throw Error('PUBLIC_PRIMARY_WINDOW_REQUIRED')
      window = { from: transformed[0].observationPeriod.label, through: observation.label, periods: c.confirmation, frequency: c.frequency }
      ends.push(observation.end.slice(0,10))
    }
    return { ...f, observationPeriod: f.state === 'INSUFFICIENT_DATA' ? null : observation.label, confirmationWindow: window, interpretation: conclusions.factorInterpretations[f.factorId] }
  })
  ends.sort()
  const projection = {
    schemaVersion: 'signal-public-summary/1', status: 'CURRENT', inputSnapshot: acceptedSnapshotCommit.slice(0,10), inputSnapshotHash: result.projection.inputSnapshotHash,
    ruleVersion: result.projection.ruleVersion, engineVersion: result.projection.engineVersion,
    evidenceThrough: { earliest: ends[0] || null, latest: ends.at(-1) || null }, factorCount: 7, validFactorCount: summary.factorsValid,
    evidenceQuality: summary.evidenceQualitySummary, thresholdSensitiveFactorIds: assessments.filter(f => f.sensitivity === 'THRESHOLD_SENSITIVE').map(f => f.factorId),
    brief: generateHomeBrief(assessments), conclusions: { domestic: conclusions.domesticSummary, international: conclusions.internationalSummary, evidenceQualifier: conclusions.evidenceQualifier }, factors,
  }
  validatePublicSignal(projection, result.projection.inputSnapshotHash)
  validatePublicSchema(projection)
  return projection
}
export function validatePublicAgainstRun(projection, result, acceptedSnapshotCommit = result.projection?.inputSnapshotCommit) {
  validatePublicSchema(projection)
  if (JSON.stringify(projection) !== JSON.stringify(makePublicSignal(result, acceptedSnapshotCommit))) throw Error('PUBLIC_SIGNAL_SEMANTIC_MISMATCH')
  return true
}
