import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import { generateConclusions, normalizeAssessments, FACTOR_TEMPLATES, FACTOR_IDS } from '../lib/signalConclusions.mjs'
import { summaryFromRun, readSummary, MAX_SUMMARY_BYTES } from '../lib/signalShadowSummary.mjs'
const frozen = JSON.parse(fs.readFileSync('research/signal-engine/signal-engine-v0.1-draft.json'))
const currentStates = ['TRANSITION', 'OUTPUT_PER_HOUR_GROWING', 'TRANSITION', 'TRANSITION', 'USD_RESERVE_SHARE_FALLING', 'TRANSITION', 'OFFSHORE_USD_CREDIT_EXPANDING']
const current = () => FACTOR_IDS.map((factorId, i) => ({ factorId, state: currentStates[i], evidenceQuality: 'MEDIUM', sensitivity: [2, 6].includes(i) ? 'THRESHOLD_SENSITIVE' : 'NOT_SENSITIVE' }))
function setState(factors, index, state, quality = 'MEDIUM') {
  factors[index] = { ...factors[index], state, evidenceQuality: state === 'INSUFFICIENT_DATA' ? 'UNASSESSED' : quality,
    sensitivity: state === 'INSUFFICIENT_DATA' ? 'NOT_EVALUATED' : 'NOT_SENSITIVE' }
  return factors
}
function asSummary(factors) {
  const artifact = { content: { ruleVersion: frozen.ruleVersion, engineVersion: 'offline-prototype/0.1.2', inputSnapshotCommit: 'a'.repeat(40), domesticFactors: factors.slice(0, 4), internationalFactors: factors.slice(4) } }
  return summaryFromRun({ artifact, run: { storagePersisted: true, result: 'SUCCESS_NEW', inputSnapshotCommit: 'a'.repeat(40), artifactHash: 'b'.repeat(64), failureStage: null, errorCategory: null } })
}
// Assert the presentation vocabulary directly against the frozen specification.
test('all seven canonical IDs and exactly all 35 frozen factor states have EN/ZH mappings', () => {
  assert.deepEqual(FACTOR_IDS, frozen.factors.map(f => f.id))
  for (const f of frozen.factors) assert.deepEqual(Object.keys(FACTOR_TEMPLATES[f.id].sentences).sort(), Object.values(f.states).sort())
})
for (const [i, f] of frozen.factors.entries()) for (const state of Object.values(f.states)) test(`${f.id}/${state} produces intentional equivalent bilingual state text`, () => {
  const o = generateConclusions(setState(current(), i, state)), sentence = o.factorInterpretations[f.id]
  const expected = FACTOR_TEMPLATES[f.id].sentences[state]
  assert(sentence.zh.startsWith(expected.zh)); assert(sentence.en.startsWith(expected.en))
  assert(/[\u4e00-\u9fff]/.test(sentence.zh)); assert(/[A-Za-z]/.test(sentence.en))
  if (state === 'TRANSITION') {
    assert.match(sentence.en, /neither a directional band nor the quiet band/)
    assert.match(sentence.zh, /既未满足方向区间，也未完全处于稳定区间/)
    assert(!/turning point|reversal|mixed signal|improving|worsening/i.test(sentence.en))
  }
  if (state === 'INSUFFICIENT_DATA') {
    const summary = i < 4 ? o.domesticSummary : o.internationalSummary
    assert.match(sentence.en, /insufficient/); assert.match(summary.en, /required factors are unavailable.*incomplete/)
    assert.match(summary.zh, /必需因素不可用.*不完整/)
  }
})
test('current production combination retains separate domestic conditions and international functions', () => {
  const o = generateConclusions(current())
  assert.match(o.domesticSummary.zh, /核心 PCE.*全球供应链.*政策利率.*尚未确认持续方向/)
  assert.match(o.domesticSummary.zh, /每小时产出同比增长.*生产能力/)
  assert.match(o.domesticSummary.en, /do not establish a net purchasing-power direction/)
  assert.match(o.internationalSummary.zh, /储备多元化压力与美元全球融资使用韧性可并存/)
  assert.match(o.internationalSummary.en, /distinct functions/)
  assert.match(o.evidenceQualifier.en, /all seven factors are Medium/)
  assert.match(o.evidenceQualifier.en, /Global Supply-Chain Pressure Trend, Offshore USD Credit Outstanding Trend/)
})
const combinations = {
  'domestic pressure increasing': ['CORE_INFLATION_ACCELERATING', 'OUTPUT_PER_HOUR_CONTRACTING', 'SUPPLY_CHAIN_PRESSURE_RISING', 'POLICY_RATE_RISING'],
  'domestic easing': ['CORE_INFLATION_DECELERATING', 'OUTPUT_PER_HOUR_GROWING', 'SUPPLY_CHAIN_PRESSURE_FALLING', 'POLICY_RATE_FALLING'],
  'mixed domestic': ['CORE_INFLATION_ACCELERATING', 'OUTPUT_PER_HOUR_GROWING', 'SUPPLY_CHAIN_PRESSURE_FALLING', 'POLICY_RATE_RISING'],
  'quiet domestic': ['LITTLE_CHANGE', 'LITTLE_CHANGE', 'LITTLE_CHANGE', 'LITTLE_CHANGE'],
  'reserve rising credit contracting': [null, null, null, null, 'USD_RESERVE_SHARE_RISING', 'TRANSITION', 'OFFSHORE_USD_CREDIT_CONTRACTING'],
  'Treasury expanding with differing other functions': [null, null, null, null, 'USD_RESERVE_SHARE_FALLING', 'FOREIGN_TREASURY_HOLDINGS_EXPANDING', 'OFFSHORE_USD_CREDIT_CONTRACTING'],
  'Treasury contracting with differing other functions': [null, null, null, null, 'USD_RESERVE_SHARE_RISING', 'FOREIGN_TREASURY_HOLDINGS_CONTRACTING', 'OFFSHORE_USD_CREDIT_EXPANDING'],
  'unavailable international': [null, null, null, null, 'INSUFFICIENT_DATA'],
}
for (const [name, states] of Object.entries(combinations)) test(`composition ${name} describes the actual states without a net verdict`, () => {
  const input = current(); states.forEach((s, i) => { if (s) setState(input, i, s) })
  const o = generateConclusions(input)
  assert.notDeepEqual(o, generateConclusions(current()))
  for (const f of input.filter(f => f.state !== 'TRANSITION')) assert(o.domesticSummary.en.includes(o.factorInterpretations[f.factorId].en) || o.internationalSummary.en.includes(o.factorInterpretations[f.factorId].en))
  assert(!/net positive|net negative|overall supportive|overall weakening|positive vs|negative vs|dollar score/i.test(JSON.stringify(o)))
  if (input[4].state !== 'USD_RESERVE_SHARE_FALLING' || input[6].state !== 'OFFSHORE_USD_CREDIT_EXPANDING') assert(!o.internationalSummary.en.includes('can coexist'))
})
test('independent source-semantic assertions preserve narrow units, periods and economic guardrails', () => {
  const f = current()
  frozen.factors.forEach((rule, i) => setState(f, i, rule.states.positive))
  const o = generateConclusions(f)
  assert.match(o.factorInterpretations['inflation-persistence'].en, /year-over-year core PCE inflation/)
  assert.match(o.factorInterpretations['observed-productivity'].en, /nonfarm business output per hour.*year over year/)
  assert.match(o.factorInterpretations['supply-chain-pressure'].en, /three-month average/)
  assert.match(o.factorInterpretations['policy-rate-direction'].en, /monthly average effective federal funds rate/)
  assert.match(o.factorInterpretations['reserve-share'].en, /official foreign-exchange reserves.*eight-quarter/)
  assert.match(o.factorInterpretations['foreign-treasury-holdings'].en, /nominal dollar.*holdings/)
  assert.match(o.factorInterpretations['offshore-usd-credit'].en, /non-bank borrowers outside the United States.*year over year/)
  const limits = o.evidenceQualifier.en
  for (const phrase of ['not attributed to AI', 'does not cover all external inflation pressure', 'does not measure overall monetary restraint', 'includes IMF imputations and excludes monetary gold', 'not flows', 'custody, valuation and Treasury supply', 'nominal growth, credit cycles and leverage', 'distinct observation periods']) assert(limits.includes(phrase))
  setState(f, 4, 'USD_RESERVE_SHARE_FALLING'); setState(f, 5, 'FOREIGN_TREASURY_HOLDINGS_CONTRACTING'); setState(f, 6, 'OFFSHORE_USD_CREDIT_CONTRACTING')
  const changed = generateConclusions(f)
  assert.match(changed.factorInterpretations['reserve-share'].en, /falling.*reserve-diversification pressure/)
  assert.match(changed.factorInterpretations['foreign-treasury-holdings'].en, /contraction in nominal/)
  assert.match(changed.factorInterpretations['offshore-usd-credit'].en, /contracting.*reduction in this financing volume/)
  assert(!/abandoning|confidence in America|dominance is strengthening|de-dollarization/.test(JSON.stringify(changed)))
})
test('LOW quality qualifies each state and its group without suppressing state text', () => {
  const f = current(); f[1].evidenceQuality = 'LOW'; f[0].evidenceQuality = 'LOW'
  const o = generateConclusions(f)
  assert.match(o.factorInterpretations['observed-productivity'].en, /is growing.*treated cautiously/)
  assert.match(o.factorInterpretations['inflation-persistence'].en, /neither.*treated cautiously/)
  assert.match(o.domesticSummary.en, /Current evidence is limited/)
  assert.match(o.evidenceQualifier.en, /Medium 5 \/ Low 2/)
})
test('mixed quality counts reflect actual factors including UNASSESSED', () => {
  const f = current(); f.forEach((x, i) => { x.evidenceQuality = i < 2 ? 'HIGH' : i === 6 ? 'LOW' : 'MEDIUM' })
  let o = generateConclusions(f); assert.match(o.evidenceQualifier.en, /High 2 \/ Medium 4 \/ Low 1/)
  setState(f, 0, 'INSUFFICIENT_DATA'); o = generateConclusions(f)
  assert.match(o.evidenceQualifier.en, /High 1 \/ Medium 4 \/ Low 1 \/ Unassessed 1/)
  assert.match(o.domesticSummary.en, /incomplete/)
})
for (const count of [0, 1, 3, 7]) test(`sensitivity labels dynamically follow ${count} sensitive factors`, () => {
  const f = current(); f.forEach((x, i) => { x.sensitivity = i < count ? 'THRESHOLD_SENSITIVE' : 'NOT_SENSITIVE' })
  const o = generateConclusions(f)
  assert.equal(o.evidenceQualifier.en.includes('Threshold-sensitive:'), count > 0)
  for (const [i, id] of FACTOR_IDS.entries()) assert.equal(o.evidenceQualifier.en.includes(FACTOR_TEMPLATES[id].title.en), i < count)
})
test('NOT_EVALUATED never masquerades as no sensitivity', () => {
  const f = current(); f.forEach(x => { x.sensitivity = 'NOT_EVALUATED' })
  assert.match(generateConclusions(f).evidenceQualifier.en, /has not been evaluated/)
})
test('all unavailable factors remain explicit and both summaries are incomplete', () => {
  const f = current(); f.forEach((x, i) => setState(f, i, 'INSUFFICIENT_DATA'))
  const o = generateConclusions(f)
  assert.match(o.evidenceQualifier.en, /all seven factors are Unassessed/)
  assert.match(o.domesticSummary.en, /incomplete/); assert.match(o.internationalSummary.en, /incomplete/)
  assert.equal(asSummary(f).factorsValid, 0)
})
test('invalid factor/state/quality/sensitivity and extra private fields are rejected', () => {
  for (const mutate of [f => f.pop(), f => f[0] = f[1], f => f[0].state = 'BUY', f => f[0].state = 'POLICY_RATE_RISING',
    f => f[0].evidenceQuality = '90%', f => f[0].sensitivity = 'MAYBE', f => f[0].localPath = '/Users/private',
    f => f[0].state = 'INSUFFICIENT_DATA', f => f[0].evidenceQuality = 'UNASSESSED']) {
    const f = current(); mutate(f); assert.throws(() => generateConclusions(f))
  }
})
test('deterministic content is input-order independent and identical in three fresh processes', () => {
  const f = current(); assert.equal(JSON.stringify(generateConclusions(f)), JSON.stringify(generateConclusions(f.toReversed())))
  assert.deepEqual(normalizeAssessments(f.toReversed()), normalizeAssessments(f))
  const code = `import {generateConclusions} from './scripts/lib/signalConclusions.mjs';process.stdout.write(JSON.stringify(generateConclusions(JSON.parse(process.argv[1]))))`
  const results = [1,2,3].map(i => execFileSync(process.execPath, ['--input-type=module', '-e', code, JSON.stringify(f)], { encoding: 'utf8', env: { PATH: process.env.PATH, GITHUB_RUN_ID: String(i), TZ: i === 1 ? 'UTC' : 'Asia/Shanghai' } }))
  assert.equal(results[0], results[1]); assert.equal(results[1], results[2]); assert.equal(results[0], JSON.stringify(generateConclusions(f)))
})
test('safe handoff rejects fabricated text, non-allowlisted metadata, wrong counts and over-size payloads', () => {
  const s = asSummary(current()); assert.equal(s.status, 'CURRENT')
  for (const mutate of [s => s.conclusions.domesticSummary.zh = 'SECRET', s => s.conclusions.factorInterpretations['reserve-share'].en = 'forged',
    s => s.factorAssessments[0].runtimeError = 'SECRET', s => s.evidenceQualitySummary.HIGH = 1,
    s => s.conclusions.evidenceQualifier.zh = 'x'.repeat(MAX_SUMMARY_BYTES), s => s.factorAssessments[6].sensitivity = 'NOT_SENSITIVE']) {
    const mutated = structuredClone(s); mutate(mutated); assert.equal(readSummary(mutated).status, 'UNKNOWN')
  }
  assert.equal(readSummary({ ...s, schemaVersion: 'signal-shadow-summary/1' }).status, 'UNKNOWN')
})
// Exhaust all 625 domestic and 125 international state combinations. These are
// presentation checks, not economic classification tests or threshold tuning.
test('all 750 native-group combinations fit the explicit bound and avoid prohibited positive claims', () => {
  let checked = 0
  const visit = (indices, depth, f) => {
    if (depth === indices.length) {
      const o = generateConclusions(f), s = asSummary(f)
      assert.equal(s.status, 'CURRENT'); assert(Buffer.byteLength(JSON.stringify(s)) <= MAX_SUMMARY_BYTES)
      const text = JSON.stringify(o)
      assert(!/\b(buy|sell|bullish|bearish|collapse)\b|dollar score|de-dollarization completed|AI caused productivity growth|net positive|net negative|\d positive.*\d negative/i.test(text))
      for (const sentence of Object.values(o.factorInterpretations)) assert(!/probability|概率/.test(JSON.stringify(sentence)))
      assert.match(o.evidenceQualifier.en, /not a probability/)
      checked++; return
    }
    const i = indices[depth]
    for (const state of Object.values(frozen.factors[i].states)) visit(indices, depth + 1, setState(structuredClone(f), i, state))
  }
  visit([0,1,2,3], 0, current()); visit([4,5,6], 0, current()); assert.equal(checked, 750)
})
test('presentation source contains no API client, random choice, clock, environment or aggregate calculation', () => {
  const source = fs.readFileSync('scripts/lib/signalConclusions.mjs', 'utf8')
  assert(!/fetch\(|https?:\/\/|OpenAI|Anthropic|Math\.random|Date\(|Date\.now|process\.env|reduce\(/.test(source))
})
