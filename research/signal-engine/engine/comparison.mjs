import { period } from './core.mjs'
import { eligibleRevisionIds } from './metadata.mjs'

// Economic revisions compare exact native periods and canonical values. Raw
// record properties can contain later operational annotations and are not votes.
export function analyticalObservationContent(source,points) {
 return points.map(p=>({observationPeriod:period(p.date,source.frequency,p.sourcePeriod,source.periodBasis),value:p.value}))
}

// Keep operational revision evidence separate. Only identity-bound evidence
// available at the replay cutoff can change a retained-vintage status audit.
export function eligibleRevisionContent(source,points,snapshot,cutoff) {
 return points.map(p=>({observationPeriod:period(p.date,source.frequency,p.sourcePeriod,source.periodBasis),revisionEventIds:[...new Set(eligibleRevisionIds(source,p,snapshot,cutoff))].sort()}))
}
