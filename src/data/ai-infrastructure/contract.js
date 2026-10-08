import approved from './monitor.json' with {type:'json'}
// Frozen publication contract. Build verification pins exact bytes; this browser
// guard rejects malformed records without importing the research machinery.
export const snapshotSha256 = '3fc59a0c52f097cbbd4f4f187ace5813d02cd2de03cfd274ac9e12700199b6f5'
export const projectionHash = 'cc57c96477fc42cf074a9dcf2c78c4f0cb46cbf4223fdfd73db9d8fa57412695'
export const panelHash = 'b54975f22d5fbceceb44216665c37233511a9d088016255bdb09328ef91706ff'
export const companyOrder = ['MSFT', 'GOOG', 'AMZN', 'META', 'ORCL']
export const projectCompanies = {fairwater:'MSFT',quincy:'MSFT','aws-warren':'AMZN','el-paso':'META',hyperion:'META',jupiter:'ORCL','polaris-forge-1':null}
const keys = (object, allowed) => object && !Array.isArray(object) && typeof object === 'object' && Object.keys(object).every(k => allowed.includes(k)) && allowed.every(k => Object.hasOwn(object,k))
const text = value => typeof value === 'string' && value.length > 0 && !/(?:file:|\/Users\/|\/home\/|\/tmp\/|~\/|[A-Z]+_[A-Z]+|[$€£%])/.test(value)
const pair = value => keys(value,['en','zh']) && text(value.en) && text(value.zh)
const date = (value, nullable = false) => nullable && value === null || typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value && value <= '2026-10-07'
const status = value => ['UNDER_CONSTRUCTION','OPERATIONAL','PLANNED','PARTIALLY_OPERATIONAL'].includes(value)
const sourceKeys = ['sourceId','publisher','documentTitle','documentDate','sourceType','publicURL','sourceVintage','availableFrom']
const projectKeys = ['capacityDisplay','companyId','companyName','companyRelationship','financingFeatures','lastQualifiedAsOf','location','ownershipStatus','powerSummary','primaryArchetype','projectId','projectName','projectStatus','publicNotes','publicSourceRefs','publicationStatus','role','scopeNotes','secondaryFeatures','statusAvailableFrom','statusEffectiveDate','statusHistory','statusSourceDate']
const factKeys = ['availableFrom','capacityDefinition','classification','comparabilityNote','comparabilityStatus','effectiveDate','operator','scope','shortDefinition','sourceDate','sourceRefs','status','unit','value']
const hosts = ['www.aboutamazon.com','about.fb.com','www.entergy.com','blogs.microsoft.com','www.oracle.com','ir.applieddigital.com']
export function publicSourceURL(value) {
 try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password && !u.search && !u.hash && (hosts.includes(u.hostname) || u.hostname === 's21.q4cdn.com' && u.pathname.startsWith('/399680738/files/')) } catch { return false }
}
export function validInfrastructureSnapshot(data) {
 try {
  if (!keys(data,['archetypeSummary','asOf','copyHash','copyVersion','methodology','powerSummary','projectionHash','projects','researchPanelHash','schemaVersion','sources','summary'])) return false
  if (data.asOf !== '2026-10-07' || data.projectionHash !== projectionHash || data.researchPanelHash !== panelHash || data.projects.length !== 7 || data.sources.length !== 14) return false
  if (!/^[a-f0-9]{64}$/.test(data.copyHash) || typeof data.schemaVersion !== 'string') return false
  const ids = data.sources.map(s => s.sourceId)
  if (new Set(ids).size !== 14) return false
  const refs = r => Array.isArray(r) && r.length > 0 && new Set(r).size === r.length && r.every(id => ids.includes(id))
  if (!data.sources.every(s => keys(s,sourceKeys) && /^source-[a-f0-9]{12}$/.test(s.sourceId) && pair(s.publisher) && pair(s.documentTitle) && date(s.documentDate,true) && date(s.availableFrom) && /^[a-f0-9]{64}$/.test(s.sourceVintage) && ['PRIMARY_PROJECT','PRIMARY_TRANSACTION','PRIMARY_ACCOUNTING'].includes(s.sourceType) && publicSourceURL(s.publicURL))) return false
  const fact = (f,power=false) => keys(f,power ? [...factKeys,'label','powerType','scopeNote'] : factKeys) && Number.isFinite(f.value) && f.value > 0 && ['MW','GW'].includes(f.unit) && ['EQ','GT','LTE'].includes(f.operator) && ['CAMPUS_PLANNED_COMPUTE','CAMPUS_COMPUTE_CAPACITY_PLANNED','CRITICAL_IT_LOAD_CONTRACTED','CRITICAL_IT_LOAD_LIVE_REPORTED','GENERATION_NAMEPLATE'].includes(f.capacityDefinition) && ['PLANNED','CONTRACTED','LIVE_REPORTED'].includes(f.status) && ['MANAGEMENT_GUIDANCE','CONTRACTUAL_COMMITMENT','OBSERVED_REPORTED'].includes(f.classification) && f.comparabilityStatus === 'UNKNOWN' && [f.scope,f.shortDefinition,f.comparabilityNote].every(pair) && date(f.effectiveDate,true) && date(f.sourceDate,true) && date(f.availableFrom) && refs(f.sourceRefs) && (!power || pair(f.label) && pair(f.scopeNote) && ['SOLAR','POWER_GAS','POWER_SOLAR'].includes(f.powerType))
  if (new Set(data.projects.map(p => p.projectId)).size !== 7) return false
  if (!data.projects.every(p => keys(p,projectKeys) && Object.hasOwn(projectCompanies,p.projectId) && p.companyId === projectCompanies[p.projectId] && pair(p.projectName) && pair(p.companyName) && keys(p.location,['country','stateRegion','cityArea']) && Object.values(p.location).every(pair) && p.primaryArchetype === 'UNKNOWN' && p.ownershipStatus === 'NOT_YET_QUALIFIED' && p.companyRelationship === 'REPORTED_ASSOCIATION_NOT_LEGAL_OWNERSHIP' && p.publicationStatus === 'QUALIFIED_FOR_REVIEW_NOT_DEPLOYED' && p.role === (p.companyId === null ? 'COMPARATIVE_REFERENCE' : 'CORE_COMPANY_PROJECT') && p.financingFeatures.length === 0 && p.secondaryFeatures.length === 0 && status(p.projectStatus) && date(p.statusEffectiveDate) && date(p.statusSourceDate,true) && date(p.statusAvailableFrom) && p.lastQualifiedAsOf === data.asOf && refs(p.publicSourceRefs) && p.scopeNotes.every(pair) && p.publicNotes.every(pair) && p.capacityDisplay.every(f=>fact(f)) && p.powerSummary.every(f=>fact(f,true)) && p.statusHistory.length > 0 && p.statusHistory.every(h => keys(h,['availableFrom','effectiveDate','scope','sourceDate','sourceRefs','status','value']) && status(h.value) && h.value === h.status && date(h.effectiveDate) && date(h.sourceDate,true) && date(h.availableFrom) && pair(h.scope) && refs(h.sourceRefs)))) return false
  const m = data.methodology
  if (!keys(m,['capacityPolicy','disclosures','financingPolicy','implementationHash','implementationVersion','moneyPolicy','publicationMode','publicationRulesHash','sourceClockPolicy','uiContractVersion'])) return false
  if (!keys(m.disclosures,['doubleCount','comparability','missingness','statusVintage','fairwater','polaris','utility','financing','guarantee','maximumExposure','returns','counts','clock'])) return false
  if (m.moneyPolicy !== 'NO_AMOUNTS_OR_AGGREGATION' || m.financingPolicy !== 'UNKNOWN_UNTIL_PUBLIC_READY_STRUCTURE_CLAIMS_EXIST' || !Object.values(m.disclosures).every(pair)) return false
  if (!keys(data.summary,['companyCount','comparativeProjectCount','coreCompanyProjectCount','factCount','projectCount','representedCompanies','statusCounts']) || !keys(data.powerSummary,['disclosedFactCount','projectsWithQualifiedPowerEvidence'])) return false
  if (JSON.stringify(data.summary.statusCounts) !== JSON.stringify({OPERATIONAL:1,PARTIALLY_OPERATIONAL:1,PLANNED:1,UNDER_CONSTRUCTION:4}) || data.summary.companyCount !== 4 || data.summary.coreCompanyProjectCount !== 6 || data.summary.comparativeProjectCount !== 1 || data.summary.representedCompanies.join(',') !== 'MSFT,AMZN,META,ORCL' || data.powerSummary.projectsWithQualifiedPowerEvidence !== 2) return false
  return JSON.stringify(data) === JSON.stringify(approved) && keys(data.archetypeSummary,['UNKNOWN']) && data.archetypeSummary.UNKNOWN === 7 && data.summary.factCount === 23 && data.summary.projectCount === 7 && data.powerSummary.disclosedFactCount === 3
 } catch { return false }
}
