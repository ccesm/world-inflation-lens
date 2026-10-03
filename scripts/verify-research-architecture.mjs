import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { seriesRegistry } from '../src/data/seriesRegistry.js'
import { routes } from '../src/utils/routing.js'
import {
  dollarOutcomes, structuralThemes, researchStages, seriesResearchRoles,
  plannedResearchCategories, pageResearchContext, viewResearchContext, researchContextForRoute, researchCopy,
} from '../src/data/researchArchitecture.js'
import { derive10YBreakeven } from '../src/utils/treasuryPricing.js'
import { driversCopy } from '../src/i18n/drivers.js'
import { transmissionCopy } from '../src/i18n/transmission.js'

const bilingual = value => {
  assert.equal(typeof value?.en, 'string')
  assert.equal(typeof value?.zh, 'string')
  assert.ok(value.en.trim() && value.zh.trim())
}
const validRoute = link => {
  bilingual(link.label)
  assert.ok(link.href.startsWith('#/'), `Research link must remain a hash route: ${link.href}`)
  assert.ok(routes.includes(link.href.slice(2).split('?')[0]), `Unknown research destination: ${link.href}`)
}
const validEvidence = item => {
  bilingual(item.label)
  bilingual(item.description)
  for (const id of item.existingEvidence) {
    assert.ok(seriesRegistry[id], `Unregistered evidence: ${id}`)
    assert.equal(seriesRegistry[id].researchStatus, 'INTEGRATED', `Planned evidence presented as available: ${id}`)
  }
  assert.equal(new Set(item.existingEvidence).size, item.existingEvidence.length)
  for (const entry of item.plannedEvidence || []) {
    bilingual(entry.label)
    assert.ok(entry.id)
    assert.notEqual(seriesRegistry[entry.id]?.researchStatus, 'INTEGRATED', `Existing evidence presented as planned: ${entry.id}`)
    assert.equal('value' in entry, false, `Planned evidence must not carry a numeric placeholder: ${entry.id}`)
  }
  for (const link of item.routes || []) validRoute(link)
}

assert.deepEqual(new Set(dollarOutcomes.map(item => item.id)), new Set(['domestic', 'international']))
assert.deepEqual(new Set(structuralThemes.map(item => item.id)), new Set(['fiscal', 'capacity', 'external', 'dollar-system']))
assert.deepEqual(researchStages.map(item => item.id), ['structural', 'transmission', 'policy', 'market', 'outcomes'])
for (const item of [...dollarOutcomes, ...structuralThemes, ...plannedResearchCategories]) {
  validEvidence(item)
  assert.ok(['EXISTING', 'PARTIAL', 'PLANNED'].includes(item.evidenceState))
  if (item.evidenceState === 'PLANNED') assert.equal(item.existingEvidence.length, 0)
  if (item.evidenceState === 'PARTIAL') assert.ok(item.existingEvidence.length && item.plannedEvidence.length)
}
researchStages.forEach(validEvidence)

const international = dollarOutcomes.find(item => item.id === 'international')
assert.equal(international.evidenceState, 'PARTIAL')
assert.ok(international.existingEvidence.includes('COFER_USD'))
assert.ok(international.existingEvidence.includes('TIC_TOTAL'))
assert.ok(international.existingEvidence.includes('BIS_USD_TOTAL'))
assert.ok(!international.plannedEvidence.some(item => item.id === 'reserve-shares'))
assert.ok(international.plannedEvidence.some(item => item.id === 'trade-invoicing'))
assert.ok(international.plannedEvidence.some(item => item.id === 'global-dollar-funding'))
assert.ok(international.existingEvidence.every(id => ['DOLLAR_SYSTEM','INTERNATIONAL_RESERVES','TREASURY_DEMAND','GLOBAL_FINANCING'].includes(seriesRegistry[id].primaryResearchRole)))
assert.equal(international.existingEvidence.includes('DTWEXBGS'), false, 'FX context cannot become a direct dollar-dominance measure')

for (const [id, roles] of Object.entries(seriesResearchRoles)) {
  assert.equal(roles.primaryRole, seriesRegistry[id].primaryResearchRole, `Protected canonical role diverged: ${id}`)
  assert.ok(roles.primaryRole)
  assert.equal(new Set(roles.secondaryRoles).size, roles.secondaryRoles.length)
  assert.equal(roles.secondaryRoles.includes(roles.primaryRole), false)
}
assert.equal(seriesResearchRoles.ULCNFB.primaryRole, 'INFLATION_TRANSMISSION')
assert.ok(seriesResearchRoles.ULCNFB.secondaryRoles.includes('STRUCTURAL_CAPACITY'))
assert.equal(seriesResearchRoles.DFII10.primaryRole, 'MARKET_VALIDATION')
assert.ok(seriesResearchRoles.DFII10.secondaryRoles.includes('POLICY_RESPONSE'))
assert.equal(seriesResearchRoles.GPR.primaryRole, 'STRUCTURAL_EXTERNAL')
assert.equal(seriesResearchRoles.OPHNFB.primaryRole, 'STRUCTURAL_CAPACITY')
assert.equal(seriesResearchRoles.IMF_USD_SHARE.primaryRole, 'DOLLAR_SYSTEM')
assert.equal(seriesResearchRoles.DTWEXBGS.primaryRole, 'MARKET_VALIDATION')
assert.equal(seriesResearchRoles.DTWEXBGS.secondaryRoles.includes('DOLLAR_SYSTEM'), false)

const stageIds = new Set(researchStages.map(item => item.id))
const themeIds = new Set(structuralThemes.map(item => item.id))
for (const [route, item] of Object.entries(pageResearchContext)) {
  assert.ok(routes.includes(route), `Context for an unknown route: ${route}`)
  assert.ok(stageIds.has(item.stage))
  if (item.theme) assert.ok(themeIds.has(item.theme))
  validRoute(item)
}
assert.equal(pageResearchContext['research/ai-productivity'].theme, 'capacity')
assert.equal(pageResearchContext['research/digital-money'].theme, 'dollar-system')
assert.equal(pageResearchContext['external-shocks'].theme, 'external')
assert.equal(pageResearchContext.fiscal.theme, 'fiscal')
assert.equal(pageResearchContext.monitor.stage, 'market')
for (const [route, view] of Object.entries(viewResearchContext)) {
  assert.ok(routes.includes(route), `Context for an unknown filtered route: ${route}`)
  assert.ok(view.parameter)
  for (const item of Object.values(view.values)) {
    assert.ok(stageIds.has(item.stage))
    validRoute(item)
  }
}
assert.equal(researchContextForRoute('#/monitor?group=inflation').stage, 'transmission')
assert.equal(researchContextForRoute('#/monitor?group=monetary').stage, 'policy')
assert.equal(researchContextForRoute('#/monitor?group=market').stage, 'market')
assert.equal(researchContextForRoute('#/drivers?topic=rates').stage, 'policy')
const driverContexts = {
  rates: ['policy', undefined, 'policy', /Policy Rate/, /政策利率/],
  energy: ['transmission', 'external', 'external', /Energy.*Price/, /能源.*价格/],
  food: ['transmission', 'external', 'external', /Food.*Transmission/, /食品.*传导/],
  housing: ['transmission', undefined, 'transmission', /Housing.*Shelter/, /住房.*居住/],
  wages: ['transmission', undefined, 'transmission', /Wages.*Labor Costs/, /工资.*劳动成本/],
  money: ['policy', undefined, 'policy', /Monetary.*Financing/, /货币.*融资/],
}
assert.deepEqual(new Set(Object.keys(viewResearchContext.drivers.values)), new Set(Object.keys(driversCopy.en.topics)), 'Every Drivers topic needs canonical context')
for (const [topic, [stage, theme, destination, en, zh]] of Object.entries(driverContexts)) {
  const actual = researchContextForRoute(`#/drivers?topic=${topic}&month=1982-12`)
  assert.equal(actual.stage, stage); assert.equal(actual.theme, theme)
  assert.equal(actual.href, `#/research?focus=${destination}`)
  assert.match(actual.label.en, en); assert.match(actual.label.zh, zh)
}
for (const language of ['en', 'zh']) {
  const copy = transmissionCopy[language].planned
  assert.equal(/10Y breakeven: not integrated|10年盈亏平衡通胀率：尚未接入/.test(copy), false)
  for (const id of ['DGS10', 'DFII10', 'T5YIFR']) assert.ok(copy.includes(id))
  assert.match(copy, language === 'en' ? /available.*matching dates/ : /可由同日.*计算/)
  assert.match(copy, language === 'en' ? /dedicated published.*not separately integrated/ : /未单独接入直接发布/)
  assert.match(copy, language === 'en' ? /not pure expected inflation.*risk and liquidity/ : /不是纯粹的预期通胀.*风险与流动性/)
  assert.match(copy, language === 'en' ? /different maturity/ : /不同期限/)
}
assert.equal(researchContextForRoute('monitor?group=unknown'), pageResearchContext.monitor)
assert.equal(researchContextForRoute('#/monitor?group=toString'), pageResearchContext.monitor)
assert.equal(researchContextForRoute('#/research/ai-productivity'), pageResearchContext['research/ai-productivity'])
assert.equal(researchContextForRoute('#/nonexistent'), null)
assert.equal(researchContextForRoute('#/constructor'), null)
for (const language of ['en', 'zh']) {
  assert.ok(researchCopy[language].methodology)
  assert.ok(researchCopy[language].outcomeCaveats.every(value => typeof value === 'string'))
  assert.ok(researchCopy[language].feedbacks.every(value => typeof value === 'string'))
  for (const state of ['EXISTING', 'PARTIAL', 'PLANNED']) assert.ok(researchCopy[language].evidenceStates[state])
}

// The architecture links to series metadata; it must not fork protected source,
// observation or maintenance definitions into a competing registry.
const forbiddenMetadata = new Set(['observations', 'sourceUrl', 'provider', 'publisher', 'distributor', 'units', 'frequency', 'retrievedAt', 'sourceUpdatedAt', 'automationType', 'freshnessPolicy', 'releaseSchedule'])
function noDuplicatedMetadata(value) {
  if (!value || typeof value !== 'object') return
  for (const [key, child] of Object.entries(value)) {
    assert.equal(forbiddenMetadata.has(key), false, `Duplicated series metadata: ${key}`)
    noDuplicatedMetadata(child)
  }
}
noDuplicatedMetadata({ dollarOutcomes, structuralThemes, researchStages, seriesResearchRoles, pageResearchContext, viewResearchContext, plannedResearchCategories })

// Exact-date behavior, rather than point counts, governs the new spread.
const nominal = Object.freeze([
  Object.freeze({ date: '2026-09-30', value: 4.2 }),
  Object.freeze({ date: '2026-10-01', value: null }),
  Object.freeze({ date: '2026-10-02', value: 4.3 }),
])
const real = Object.freeze([
  Object.freeze({ date: '2026-09-30', value: 1.8 }),
  Object.freeze({ date: '2026-10-01', value: 1.9 }),
  Object.freeze({ date: '2026-10-05', value: 2 }),
])
const spread = derive10YBreakeven(nominal, real)
assert.deepEqual(spread.points.map(point => point.date), ['2026-09-30', '2026-10-01', '2026-10-02', '2026-10-05'])
assert.ok(Math.abs(spread.latest.value - 2.4) < 1e-12)
assert.equal(spread.latestCommonDate, '2026-09-30')
assert.equal(spread.latestNominalDate, '2026-10-02')
assert.equal(spread.latestRealDate, '2026-10-05')
assert.equal(spread.latestIsOlderThanInputs, true)
assert.equal(spread.hasMismatchedLatestDates, true)
assert.deepEqual(spread.missingDates, ['2026-10-01', '2026-10-02', '2026-10-05'])
assert.ok(spread.points.slice(1).every(point => point.value === null))
assert.equal(spread.points.find(point => point.date === '2026-10-02').real, null)

const sameDay = derive10YBreakeven([{ date: '2026-10-01', value: 0 }], [{ date: '2026-10-01', value: -1 }])
assert.equal(sameDay.latest.value, 1)
assert.equal(sameDay.latestIsOlderThanInputs, false)
assert.equal(sameDay.hasMismatchedLatestDates, false)
assert.deepEqual(sameDay.missingDates, [])
const adjacentDays = derive10YBreakeven([{ date: '2026-10-01', value: 4 }], [{ date: '2026-10-02', value: 2 }])
assert.equal(adjacentDays.latest, null)
assert.equal(adjacentDays.latestCommonDate, null)
assert.ok(adjacentDays.points.every(point => point.value === null), 'Never subtract adjacent dates')
const invalidNumbers = derive10YBreakeven([{ date: '2026-10-01', value: NaN }, { date: '2026-10-02', value: 4 }], [{ date: '2026-10-01', value: 2 }, { date: '2026-10-02', value: '2' }])
assert.equal(invalidNumbers.latest, null, 'Nonfinite or nonnumeric inputs cannot become observations')
assert.equal(derive10YBreakeven([], []).latest, null)
assert.equal(derive10YBreakeven([], []).hasMismatchedLatestDates, false)
assert.throws(() => derive10YBreakeven([{ date: '2026-10-01', value: 4 }, { date: '2026-10-01', value: 5 }], []), /Duplicate/)
assert.throws(() => derive10YBreakeven([{ date: '2026-02-30', value: 4 }], []), /valid daily dates/)
assert.throws(() => derive10YBreakeven([{ date: '2026-10', value: 4 }], []), /daily dates/)
assert.deepEqual(derive10YBreakeven([...nominal].reverse(), [...real].reverse()), spread, 'Input order does not change exact-date alignment')

const snapshot = JSON.parse(await readFile(new URL('../data/inflation/monitor.json', import.meta.url), 'utf8'))
const actualNominal = snapshot.series.find(item => item.id === 'DGS10')
const actualReal = snapshot.series.find(item => item.id === 'DFII10')
const actualSpread = derive10YBreakeven(actualNominal.observations, actualReal.observations)
assert.ok(actualSpread.latest)
const exactNominal = actualNominal.observations.find(item => item.date === actualSpread.latestCommonDate)
const exactReal = actualReal.observations.find(item => item.date === actualSpread.latestCommonDate)
assert.equal(actualSpread.latest.value, exactNominal.value - exactReal.value)
assert.equal(actualSpread.points.some(point => Number.isFinite(point.value) && (point.nominal === null || point.real === null)), false)

console.log('PASS: dual dollar outcomes, linked canonical roles, explicit international gaps, legal research links and exact-date Treasury spread with missing/older-date disclosure')
