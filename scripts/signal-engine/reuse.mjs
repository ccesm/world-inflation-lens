import { selectArchive, eligibility, manualEligibility } from '../../research/signal-engine/engine/alignment.mjs'
import { sourceAtCutoff, operationalMetadata, eligibleRevisionIds, publisherEvidenceProven, eventEligible } from '../../research/signal-engine/engine/metadata.mjs'
import { seriesMetadata } from '../../src/data/seriesContract.js'
import { contentHash } from '../../research/signal-engine/engine/core.mjs'

// An identity check alone is not a freshness check. Reuse keeps the original
// interpretation as-of only when every source's eligible values, quality and
// timing inputs remain equivalent at the new cutoff. No factor arithmetic is
// duplicated here; these are the frozen engine's own eligibility functions.
export function eligibilityFingerprint(archive, env, request) {
  if (request.mode !== 'CURRENT_SNAPSHOT') throw Error('SHADOW_CURRENT_MODE_REQUIRED')
  const result = []
  for (const item of selectArchive(archive, request)) {
    for (const raw of item.series) {
      const view = sourceAtCutoff(raw, item.snapshot, request.asOf)
      const source = { ...view, contract: seriesMetadata(view) }
      const primary = env.config.factors.some(f => f.primarySeriesId === source.id)
      const st = (source.contract.automationType === 'MANUAL_REVIEWED' ? manualEligibility : eligibility)(source, item.snapshot, request, { expected: env.contracts[source.id], primary })
      const { points = [], last, ...status } = st
      result.push({
        seriesId: source.id, snapshotId: item.snapshot.id, status,
        operational: operationalMetadata(item.snapshot, request.asOf),
        points: points.map(p => ({ date: p.date, value: p.value, sourcePeriod: p.sourcePeriod || null, availableAt: p.availableAt || item.snapshot.snapshotAcceptedAt, revisionEventIds: eligibleRevisionIds(source, p, item.snapshot, request.asOf), publisherEvidenceProven: publisherEvidenceProven(source, p, item.snapshot, request.asOf) })),
        revisionEvents: [...(source.revisionEvents || []), ...(item.snapshot.revisionEvents || [])].filter(e => eventEligible(e, request.asOf)),
      })
    }
  }
  return contentHash(result)
}
