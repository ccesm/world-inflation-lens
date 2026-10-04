import { signalFactors } from '../data/signalPresentation.js'
export const PUBLIC_SIGNAL_SCHEMA = 'signal-public-summary/1'
export const PUBLIC_SIGNAL_MAX_BYTES = 24000
export const signalQuality = ['HIGH', 'MEDIUM', 'LOW', 'UNASSESSED']
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
function keys(value, names) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || !same(Object.keys(value).sort(), [...names].sort())) throw Error('PUBLIC_SIGNAL_ALLOWLIST')
}
const safeText = value => {
  if (typeof value !== 'string' || !value.length || value.length > 5000 || /[<>\u0000-\u001f]|\/Users\/|\/home\/|\/tmp\/|(?:token|secret|password)\s*[=:]|[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(value)) throw Error('PUBLIC_SIGNAL_UNSAFE_TEXT')
}
function pair(value) { keys(value, ['zh', 'en']); safeText(value.zh); safeText(value.en) }
function periodLabel(value, frequency) {
  if (typeof value !== 'string' || !(frequency === 'monthly' ? /^\d{4}-(0[1-9]|1[0-2])$/ : /^\d{4}-Q[1-4]$/).test(value)) throw Error('PUBLIC_SIGNAL_PERIOD')
}
const topKeys = ['schemaVersion', 'status', 'inputSnapshot', 'inputSnapshotHash', 'ruleVersion', 'engineVersion', 'evidenceThrough', 'factorCount', 'validFactorCount', 'evidenceQuality', 'thresholdSensitiveFactorIds', 'brief', 'conclusions', 'factors']
export function unavailableSignal() {
  return { schemaVersion: PUBLIC_SIGNAL_SCHEMA, status: 'UNAVAILABLE', inputSnapshot: null, inputSnapshotHash: null,
    ruleVersion: 'signal-engine-v0.1-draft.1', engineVersion: 'offline-prototype/0.1.2', evidenceThrough: null,
    factorCount: 7, validFactorCount: null, evidenceQuality: null, thresholdSensitiveFactorIds: [], brief: null, conclusions: null, factors: [] }
}
export function validatePublicSignal(value, expectedInputHash = null) {
  keys(value, topKeys)
  if (new TextEncoder().encode(JSON.stringify(value)).length > PUBLIC_SIGNAL_MAX_BYTES || value.schemaVersion !== PUBLIC_SIGNAL_SCHEMA || value.ruleVersion !== 'signal-engine-v0.1-draft.1' || value.engineVersion !== 'offline-prototype/0.1.2' || value.factorCount !== 7) throw Error('PUBLIC_SIGNAL_VERSION')
  if (value.status === 'UNAVAILABLE') {
    if (!same(value, unavailableSignal())) throw Error('PUBLIC_SIGNAL_FALLBACK')
    return value
  }
  if (value.status !== 'CURRENT' || !/^[a-f0-9]{10}$/.test(value.inputSnapshot || '') || !/^[a-f0-9]{64}$/.test(value.inputSnapshotHash || '') || expectedInputHash && value.inputSnapshotHash !== expectedInputHash) throw Error('PUBLIC_SIGNAL_SNAPSHOT')
  if (!Array.isArray(value.factors) || value.factors.length !== 7) throw Error('PUBLIC_SIGNAL_COVERAGE')
  const counts = Object.fromEntries(signalQuality.map(q => [q, 0]))
  const sensitive = [], ends = []
  for (let i = 0; i < 7; i++) {
    const f = value.factors[i], c = signalFactors[i]
    keys(f, ['factorId', 'state', 'evidenceQuality', 'sensitivity', 'observationPeriod', 'confirmationWindow', 'interpretation'])
    if (f.factorId !== c.id || !c.states.includes(f.state) || !signalQuality.includes(f.evidenceQuality) || !['THRESHOLD_SENSITIVE', 'NOT_SENSITIVE', 'NOT_EVALUATED'].includes(f.sensitivity)) throw Error('PUBLIC_SIGNAL_FACTOR')
    const missing = f.state === 'INSUFFICIENT_DATA'
    if (missing !== (f.evidenceQuality === 'UNASSESSED') || missing && (f.observationPeriod !== null || f.confirmationWindow !== null || f.sensitivity !== 'NOT_EVALUATED')) throw Error('PUBLIC_SIGNAL_AVAILABILITY')
    if (!missing) {
      periodLabel(f.observationPeriod, c.frequency)
      keys(f.confirmationWindow, ['from', 'through', 'periods', 'frequency'])
      const w = f.confirmationWindow
      periodLabel(w.from, c.frequency); periodLabel(w.through, c.frequency)
      if (w.periods !== c.confirmation || w.frequency !== c.frequency || w.through !== f.observationPeriod) throw Error('PUBLIC_SIGNAL_WINDOW')
      const ordinal = p => c.frequency === 'monthly' ? +p.slice(0,4) * 12 + +p.slice(5) - 1 : +p.slice(0,4) * 4 + +p.slice(-1) - 1
      if (ordinal(w.through) - ordinal(w.from) !== w.periods - 1) throw Error('PUBLIC_SIGNAL_WINDOW')
      const y = +f.observationPeriod.slice(0,4), month = c.frequency === 'monthly' ? +f.observationPeriod.slice(5) : +f.observationPeriod.slice(-1)*3
      ends.push(new Date(Date.UTC(y, month, 0)).toISOString().slice(0,10))
    }
    pair(f.interpretation); counts[f.evidenceQuality]++
    if (f.sensitivity === 'THRESHOLD_SENSITIVE') sensitive.push(c.id)
  }
  keys(value.evidenceQuality, signalQuality)
  if (!same(value.evidenceQuality, counts) || value.validFactorCount !== 7 - counts.UNASSESSED || !same(value.thresholdSensitiveFactorIds, sensitive)) throw Error('PUBLIC_SIGNAL_SUMMARY')
  keys(value.evidenceThrough, ['earliest', 'latest'])
  ends.sort()
  if (value.evidenceThrough.earliest !== (ends[0] || null) || value.evidenceThrough.latest !== (ends.at(-1) || null)) throw Error('PUBLIC_SIGNAL_DATE_RANGE')
  keys(value.brief, ['domestic', 'international']); pair(value.brief.domestic); pair(value.brief.international)
  keys(value.conclusions, ['domestic', 'international', 'evidenceQualifier']); Object.values(value.conclusions).forEach(pair)
  return value
}
