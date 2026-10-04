import fs from 'node:fs'
import path from 'node:path'
import { compileOutputSchema, validateArtifact } from '../../research/signal-engine/engine/validation.mjs'
import { contentHash } from '../../research/signal-engine/engine/core.mjs'
import { validateAcceptedInput } from './acceptance.mjs'
import { safeProjection, validateProjection, FACTOR_IDS } from './projection.mjs'
import { ADAPTER_VERSION, ENGINE_REFERENCE, RULE_VERSION, ROOT } from './identity.mjs'

const object = properties => ({ type: 'object', additionalProperties: false, properties, required: Object.keys(properties) })
const hash = { type: 'string', pattern: '^[a-f0-9]{64}$' }
export const shadowArtifactSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  ...object({
    deterministicContentHash: hash,
    content: object({
      artifactSchemaVersion: { const: 'signal-shadow-interpretation/1' },
      engineVersion: { const: 'offline-prototype/0.1.2' }, adapterVersion: { const: ADAPTER_VERSION },
      ruleVersion: { const: RULE_VERSION },
      inputSnapshotCommit: { type: 'string', pattern: '^[a-f0-9]{40}$' }, inputSnapshotHash: hash,
      codeCommit: { const: ENGINE_REFERENCE }, semanticCodeHash: hash,
      evaluationMode: { const: 'CURRENT_SNAPSHOT' }, asOf: { type: 'string', format: 'date-time' },
      enginePayloadHash: hash, projectionHash: hash, contextHash: hash,
      domesticFactors: { type: 'array', minItems: 4, maxItems: 4 },
      internationalFactors: { type: 'array', minItems: 3, maxItems: 3 },
      limitations: { type: 'array', minItems: 4, maxItems: 4, items: { type: 'string' } },
    }),
  }),
}
const validateShape = compileOutputSchema(shadowArtifactSchema)
export function makeInterpretation(output, projection, contextHash, inputSnapshotHash, semanticCodeHash) {
  const content = {
    artifactSchemaVersion: 'signal-shadow-interpretation/1', engineVersion: output.engineVersion,
    adapterVersion: ADAPTER_VERSION, ruleVersion: output.ruleVersion,
    inputSnapshotCommit: output.inputCommit, inputSnapshotHash,
    codeCommit: ENGINE_REFERENCE, semanticCodeHash,
    evaluationMode: output.mode, asOf: output.asOf,
    enginePayloadHash: contentHash(output), projectionHash: contentHash(projection), contextHash,
    domesticFactors: projection.factors.filter(f => projection.domesticFactorIds.includes(f.factorId)),
    internationalFactors: projection.factors.filter(f => projection.internationalFactorIds.includes(f.factorId)),
    limitations: projection.limitations,
  }
  const artifact = { deterministicContentHash: contentHash(content), content }
  if (!validateShape(artifact)) throw Error('SHADOW_ARTIFACT_SCHEMA_FAILED')
  return artifact
}
export function validateInterpretation(artifact, { output, projection, contextHash, inputSnapshotHash, semanticCodeHash }) {
  if (!validateShape(artifact)) throw Error('SHADOW_ARTIFACT_SCHEMA_FAILED')
  if (artifact.deterministicContentHash !== contentHash(artifact.content)) throw Error('DETERMINISTIC_CONTENT_HASH_MISMATCH')
  if (contentHash(artifact) !== contentHash(makeInterpretation(output, projection, contextHash, inputSnapshotHash, semanticCodeHash))) throw Error('SHADOW_ARTIFACT_SEMANTIC_MISMATCH')
  return true
}
export function engineValidator(repo = ROOT) {
  return compileOutputSchema(JSON.parse(fs.readFileSync(path.join(repo, 'research/signal-engine/output.schema.json'))))
}
export function validateStoredInterpretation(store, hash, { repo = ROOT, semanticCodeHash, cache = new Map(), visiting = new Set() } = {}) {
  if (cache.has(hash)) return cache.get(hash)
  if (visiting.has(hash)) throw Error('SHADOW_HISTORY_CYCLE')
  visiting.add(hash)
  try {
    const artifact = store.read('interpretations', hash), c = artifact.content
    if (!validateShape(artifact)) throw Error('SHADOW_ARTIFACT_SCHEMA_FAILED')
    if (semanticCodeHash && c.semanticCodeHash !== semanticCodeHash) throw Error('RETAINED_ENGINE_CONTEXT_NOT_COMPATIBLE')
    const context = store.read('contexts', c.contextHash)
    if (context.schemaVersion !== 'signal-shadow-context/1' || context.semanticCodeHash !== c.semanticCodeHash) throw Error('STORED_CONTEXT_IDENTITY_MISMATCH')
    const accepted = store.read('accepted', context.acceptedHash)
    const { archive, env } = validateAcceptedInput(accepted, { repo })
    env.configCanonicalHash = contentHash(env.config)
    if (context.runtimeHash !== contentHash(env.runtime)) throw Error('RETAINED_RUNTIME_CONTEXT_NOT_COMPATIBLE')
    for (const retainedHash of context.retainedAcceptedHashes) {
      const retained = validateAcceptedInput(store.read('accepted', retainedHash), { repo })
      archive.push(...retained.archive)
    }
    let prior = null
    if (context.priorInterpretationHash) prior = validateStoredInterpretation(store, context.priorInterpretationHash, { repo, cache, visiting })
    const output = store.read('engine', c.enginePayloadHash)
    if (contentHash(context.request) !== contentHash({ mode: output.mode, asOf: output.asOf, periodCutoff: output.periodCutoff, evaluatedAt: output.evaluatedAt })) throw Error('STORED_REQUEST_MISMATCH')
    validateArtifact(output, env.config, engineValidator(repo), { archive, env, priorArtifact: prior?.output || null })
    const projection = store.read('projections', c.projectionHash)
    validateProjection(projection, output, accepted.receipt.inputSnapshotHash)
    validateInterpretation(artifact, { output, projection, contextHash: c.contextHash, inputSnapshotHash: accepted.receipt.inputSnapshotHash, semanticCodeHash: c.semanticCodeHash })
    const ids = [...c.domesticFactors, ...c.internationalFactors].map(f => f.factorId)
    if (contentHash(ids) !== contentHash(FACTOR_IDS)) throw Error('SHADOW_FACTOR_SCOPE_MISMATCH')
    const result = { artifact, context, accepted, output, projection, archive, env }
    cache.set(hash, result)
    return result
  } finally { visiting.delete(hash) }
}
