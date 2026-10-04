import { compileOutputSchema } from '../../research/signal-engine/engine/validation.mjs'
import { contentHash } from '../../research/signal-engine/engine/core.mjs'

const hash = { type: 'string', pattern: '^[a-f0-9]{64}$' }
const text = { type: 'string', maxLength: 500 }
const ids = { type: 'array', maxItems: 200, items: { type: 'string', pattern: '^sha256:[a-f0-9]{64}$' } }
const object = properties => ({ type: 'object', additionalProperties: false, properties, required: Object.keys(properties) })
const period = object({ kind: text, label: { type: ['string', 'null'], maxLength: 50 }, start: { type: ['string', 'null'], maxLength: 30 }, end: { type: ['string', 'null'], maxLength: 30 } })
const stateValues = ['CORE_INFLATION_ACCELERATING', 'CORE_INFLATION_DECELERATING', 'OUTPUT_PER_HOUR_GROWING', 'OUTPUT_PER_HOUR_CONTRACTING', 'SUPPLY_CHAIN_PRESSURE_RISING', 'SUPPLY_CHAIN_PRESSURE_FALLING', 'POLICY_RATE_RISING', 'POLICY_RATE_FALLING', 'USD_RESERVE_SHARE_RISING', 'USD_RESERVE_SHARE_FALLING', 'FOREIGN_TREASURY_HOLDINGS_EXPANDING', 'FOREIGN_TREASURY_HOLDINGS_CONTRACTING', 'OFFSHORE_USD_CREDIT_EXPANDING', 'OFFSHORE_USD_CREDIT_CONTRACTING', 'LITTLE_CHANGE', 'TRANSITION', 'INSUFFICIENT_DATA']
export const FACTOR_IDS = ['inflation-persistence', 'observed-productivity', 'supply-chain-pressure', 'policy-rate-direction', 'reserve-share', 'foreign-treasury-holdings', 'offshore-usd-credit']
export const publicSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  ...object({
    artifactSchemaVersion: { const: 'signal-public-shadow/1' },
    engineVersion: { const: 'offline-prototype/0.1.2' },
    ruleVersion: { const: 'signal-engine-v0.1-draft.1' },
    inputSnapshotCommit: { type: 'string', pattern: '^[a-f0-9]{40}$' }, inputSnapshotHash: hash,
    evaluationMode: { const: 'CURRENT_SNAPSHOT' }, asOf: { type: 'string', format: 'date-time' },
    factors: { type: 'array', minItems: 7, maxItems: 7, items: object({
      factorId: { enum: FACTOR_IDS }, state: { enum: stateValues },
      evidenceQuality: { enum: ['HIGH', 'MEDIUM', 'LOW', 'UNASSESSED'] },
      observationThrough: { anyOf: [period, { type: 'null' }] },
      dataStatus: text, availabilityBasis: { enum: ['PROJECT_ACCEPTED_SNAPSHOT', 'UNKNOWN'] },
      alignment: text, sensitivity: { enum: ['THRESHOLD_SENSITIVE', 'NOT_SENSITIVE', 'NOT_EVALUATED'] },
      qualityReasons: { type: 'array', maxItems: 30, items: { type: 'string', pattern: '^[A-Z0-9_]+$' } },
      evidence: ids, counterevidence: ids, context: ids,
      changeReason: { type: 'array', maxItems: 7, items: { enum: ['NEW_OBSERVATION', 'REVISION_DRIVEN_CHANGE', 'RULE_CHANGE', 'STATUS_CHANGE', 'CONTEXT_CHANGE', 'INITIAL', 'UNCHANGED'] } },
      lastValidReference: { type: ['string', 'null'], pattern: '^sha256:[a-f0-9]{64}#factor:[a-z-]+$' },
      limitations: { type: 'array', items: { enum: ['NARROW_MEASUREMENT', 'PROVISIONAL_RULE', 'EVIDENCE_MAY_REVISE', 'CONTEXT_NOT_A_VOTE'] }, minItems: 4, maxItems: 4 },
    }) },
    lineage: { type: 'array', maxItems: 200, items: object({
      reference: { type: 'string', pattern: '^sha256:[a-f0-9]{64}$' }, seriesId: { type: 'string', pattern: '^[A-Z0-9_.]+$' },
      publisher: text, sourceUrl: { type: ['string', 'null'], format: 'uri', maxLength: 1000 },
      units: text, frequency: text, denominator: { type: ['string', 'null'], maxLength: 500 },
      maintenanceType: text, dependencyRole: text, observationPeriod: period,
      rawValue: { type: ['number', 'null'] }, snapshotReference: { type: ['string', 'null'], pattern: '^sha256:[a-f0-9]{64}$' },
      freshnessState: text, availabilityBasis: text,
      transformedWindow: { type: 'array', maxItems: 10, items: object({ observationPeriod: period, value: { type: 'number' }, units: text }) },
    }) },
    domesticFactorIds: { type: 'array', items: { enum: FACTOR_IDS }, minItems: 4, maxItems: 4 },
    internationalFactorIds: { type: 'array', items: { enum: FACTOR_IDS }, minItems: 3, maxItems: 3 },
    limitations: { const: ['DESCRIPTIVE_NOT_FORECAST', 'NO_AGGREGATE', 'PROVISIONAL_RULES', 'EVIDENCE_MAY_REVISE'] },
  }),
}
const validateShape = compileOutputSchema(publicSchema)
const safeHosts = new Set(['fred.stlouisfed.org', 'www.census.gov', 'www.matteoiacoviello.com', 'www.newyorkfed.org', 'www.fao.org', 'www.sipri.org', 'www.federalreserve.gov', 'www.imf.org', 'data.imf.org', 'home.treasury.gov', 'data.bis.org'])
function sourceUrl(value) {
  if (value === null) return null
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.username || url.password || !safeHosts.has(url.hostname) || url.search || url.hash) throw Error('UNSAFE_PUBLIC_SOURCE_URL')
  return value
}
export function safeProjection(output, inputSnapshotHash) {
  if (output.mode !== 'CURRENT_SNAPSHOT' || output.historicalAvailabilityClaim) throw Error('SHADOW_CURRENT_MODE_REQUIRED')
  const refs = new Map(output.lineage.map(l => [l.id, 'sha256:' + contentHash({ engineLineageId: l.id })]))
  const reference = id => {
    if (!refs.has(id)) throw Error('BROKEN_PUBLIC_LINEAGE_REFERENCE')
    return refs.get(id)
  }
  const result = {
    artifactSchemaVersion: 'signal-public-shadow/1', engineVersion: output.engineVersion,
    ruleVersion: output.ruleVersion, inputSnapshotCommit: output.inputCommit, inputSnapshotHash,
    evaluationMode: output.mode, asOf: output.asOf,
    factors: output.factors.map(f => ({
      factorId: f.factorId, state: f.direction, evidenceQuality: f.confidence,
      observationThrough: f.observationThrough, dataStatus: f.dataStatus, availabilityBasis: f.availabilityBasis,
      alignment: f.alignment,
      sensitivity: f.qualityReasons.includes('SENSITIVITY_NOT_EVALUATED') || f.direction === 'INSUFFICIENT_DATA' ? 'NOT_EVALUATED' : f.qualityReasons.includes('PARAMETER_SENSITIVE') ? 'THRESHOLD_SENSITIVE' : 'NOT_SENSITIVE',
      qualityReasons: f.qualityReasons.filter(v => /^[A-Z0-9_]+$/.test(v)),
      evidence: f.evidence.map(reference), counterevidence: f.counterevidence.map(reference), context: f.context.map(reference),
      changeReason: f.changeReason, lastValidReference: f.lastValidArtifactRef,
      limitations: ['NARROW_MEASUREMENT', 'PROVISIONAL_RULE', 'EVIDENCE_MAY_REVISE', 'CONTEXT_NOT_A_VOTE'],
    })),
    lineage: output.lineage.map(l => ({
      reference: reference(l.id), seriesId: l.seriesId, publisher: l.publisher, sourceUrl: sourceUrl(l.sourceUrl),
      units: l.units, frequency: l.frequency, denominator: l.denominator,
      maintenanceType: l.maintenanceType, dependencyRole: l.dependencyRole,
      observationPeriod: l.observationPeriod, rawValue: l.rawValue,
      snapshotReference: l.snapshotSha256 ? 'sha256:' + l.snapshotSha256 : null,
      freshnessState: l.freshnessState, availabilityBasis: l.availabilityBasis,
      transformedWindow: l.transformedWindow.map(p => ({ observationPeriod: p.observationPeriod, value: p.value, units: p.units })),
    })),
    domesticFactorIds: output.domestic.factorIds, internationalFactorIds: output.international.factorIds,
    limitations: ['DESCRIPTIVE_NOT_FORECAST', 'NO_AGGREGATE', 'PROVISIONAL_RULES', 'EVIDENCE_MAY_REVISE'],
  }
  if (!validateShape(result)) throw Error('PUBLIC_PROJECTION_SCHEMA_FAILED:' + JSON.stringify(validateShape.errors))
  return result
}
export function validateProjection(projection, output, inputSnapshotHash) {
  if (!validateShape(projection)) throw Error('PUBLIC_PROJECTION_SCHEMA_FAILED')
  if (contentHash(projection) !== contentHash(safeProjection(output, inputSnapshotHash))) throw Error('PUBLIC_PROJECTION_SEMANTIC_MISMATCH')
  return true
}
