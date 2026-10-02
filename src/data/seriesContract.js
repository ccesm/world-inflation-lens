import { seriesRegistry, fredUseMetadata } from './seriesRegistry.js'
import { temporalValue, observationTime, fredUpdateTime } from '../utils/timeSemantics.js'

// Incremental compatibility adapter: raw, validated source definitions remain authoritative
// for measured units/adjustment. Evidence policies and UI naming have one registry.
export function seriesMetadata(source) {
  const policy = seriesRegistry[source.id]
  const frequency = source.frequency || 'unknown'
  const automated = policy?.automationType === 'AUTOMATIC'
  const fred = source.provider === 'FRED'
  const reviewed = source.reviewedAt || (!automated ? source.retrievedAt : null)
  return {
    schemaVersion: 1, id: source.id, title: policy?.title || { en: source.title || source.id, zh: source.title || source.id },
    publisher: source.publisher || source.provider || 'unknown', distributor: source.provider || 'unknown', sourceUrl: source.sourceUrl || source.url || null,
    units: source.units || source.unit || 'unknown', frequency, seasonalAdjustment: source.seasonalAdjustment || 'not specified by source',
    geography: source.geography || (source.id?.startsWith('SIPRI_US_') || /^(CENSUS_|CBO_)/.test(source.id) ? 'US' : /^(GPR|GSCPI|FAO_|SIPRI_WORLD|FED_STABLECOIN|IMF_)/.test(source.id) ? 'global' : source.id === 'FP.CPI.TOTL.ZG' ? 'countries/economies' : 'unknown'),
    dataType: policy?.dataType || (['DERIVED','STATIC','PLANNED'].includes(policy?.automationType) ? policy.automationType : frequency === 'publication snapshot' ? 'PUBLICATION_FACT' : source.proxy ? 'OBSERVED_PROXY' : 'OBSERVATION'),
    automationType: policy?.automationType || 'UNKNOWN', researchStatus: policy?.researchStatus || 'UNKNOWN',
    primaryResearchRole: policy?.primaryResearchRole || 'UNASSIGNED', secondaryRoles: policy?.secondaryRoles || [],
    observationDate: observationTime(source),
    sourceUpdatedAt: source.sourceUpdatedTime || (source.sourceUpdatedOriginal ? fredUpdateTime(source.sourceUpdatedOriginal) : temporalValue(source.sourceUpdatedAt, fred ? 'FRED distributor update; original publisher release may differ' : 'source update / publication vintage')),
    retrievedAt: temporalValue(source.retrievedAt, 'snapshot downloaded or imported; not an observation date'),
    reviewedAt: temporalValue(reviewed, 'manual review/import; not updated by automatic checks'),
    releaseSchedule: policy?.releaseSchedule || null,
    freshnessPolicy: { type: policy?.releaseSchedule ? 'RELEASE_WINDOW' : automated ? 'CONSERVATIVE_PERIOD_LAG' : 'EVIDENCE_TYPE', ...policy?.freshnessPolicy },
    use: fred ? fredUseMetadata(source.id, { ...source, license: source.license === 'Public domain; source citation requested' ? undefined : source.license }) : { license: source.license || 'Consult original source use terms; cite publisher.', citation: source.attribution || source.license || 'Cite original publisher.', rightsStatus: 'SOURCE_NOTE', licenseUrl: source.licenseUrl || source.sourceUrl || null },
    vintage: source.vintage || source.version || null, publicationDate: temporalValue(source.projectionPublishedAt, 'forecast publication'),
    inputIds: policy?.inputIds || [], definition: source.definition || null,
  }
}

export function withSeriesContract(source) {
  const metadata = seriesMetadata(source)
  return { ...source, contract: metadata, ...(source.provider === 'FRED' ? { license: metadata.use.license, citation: metadata.use.citation } : {}) }
}
