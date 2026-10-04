import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup as render } from 'react-dom/server'
import { test, before, after } from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execFileSync } from 'node:child_process'
import { createServer } from 'vite'
import { captureAcceptedInput } from '../signal-engine/acceptance.mjs'
import { runShadow } from '../signal-engine/pipeline.mjs'
import { RestrictedStore } from '../signal-engine/store.mjs'
import { validateStoredInterpretation } from '../signal-engine/artifact.mjs'
import { ROOT, dataIdentity } from '../signal-engine/identity.mjs'
import { summaryFromRun } from '../lib/signalShadowSummary.mjs'
import { generateConclusions, generateHomeBrief, FACTOR_TEMPLATES } from '../lib/signalConclusions.mjs'
import { workingSignalInputHash } from '../lib/signalInputIdentity.mjs'
import { makePublicSignal, validatePublicAgainstRun, validatePublicSchema } from '../lib/signalPublicProjection.mjs'
import { validatePublicSignal, verifyPublicSignalBytes, unavailableSignal } from '../../src/utils/signalPublicContract.js'
import { validatePublicMeaning, publishPublicIdentity, verifyPublicIdentity, publicSignalSha256 } from '../lib/signalPublicIntegrity.mjs'
import { signalFactors } from '../../src/data/signalPresentation.js'
import { generatePublicSignal, parsePublicArguments } from '../signal-public.mjs'
let root, result, projection, acceptedFixture, server, Brief, Page, Card
before(async () => {
 root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'wil-public-test-'))
 const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()
 const clock = () => '2026-10-04T18:00:00.000Z'
 // Explicit test acceptance fixture; real command is separately run with real gates.
 const accepted = captureAcceptedInput({ targetCommit: commit, codeCommit: commit, clock, gates: () => [{ name: 'npm run build', result: 'PASS' }, { name: 'npm run verify', result: 'PASS' }] })
 acceptedFixture = accepted
 const store = new RestrictedStore(path.join(root, 'restricted'))
 result = runShadow({ accepted, codeCommit: commit, store, clock })
 assert(result.artifact, JSON.stringify(result.run))
 validateStoredInterpretation(store, result.run.artifactHash)
 projection = makePublicSignal(result)
 server = await createServer({ server: { middlewareMode: true } })
 Brief = (await server.ssrLoadModule('/src/components/SignalEngineBrief.jsx')).SignalBriefView
 const page = await server.ssrLoadModule('/src/pages/SignalEngine.jsx'); Page = page.SignalEngineView; Card = page.SignalFactorCard
})
after(async () => { await server?.close(); fs.rmSync(root, { recursive: true, force: true }) })
test('CURRENT: public schema + independent semantic validation against validated run', () => {
 assert(validatePublicSchema(projection)); assert(validatePublicAgainstRun(projection, result))
 assert.equal(projection.validFactorCount, 7)
 assert.deepEqual(projection.evidenceQuality, { HIGH: 0, MEDIUM: 7, LOW: 0, UNASSESSED: 0 })
 assert.equal(projection.factors.length, 7)
 assert.deepEqual(projection.thresholdSensitiveFactorIds, ['supply-chain-pressure', 'offshore-usd-credit'])
})
test('UNAVAILABLE has no current assessments or stale conclusions', () => {
 assert(validatePublicSchema(unavailableSignal()))
 assert.equal(unavailableSignal().conclusions, null)
})
test('same semantic input => byte identical public projection; no run timestamp', () => {
 assert.equal(JSON.stringify(projection), JSON.stringify(makePublicSignal(result)))
 assert(!JSON.stringify(projection).includes('generatedAt'))
 assert.equal(workingSignalInputHash(ROOT), dataIdentity(ROOT, result.artifact.content.inputSnapshotCommit).hash)
})
test('email / public conclusions use exactly the same semantic generator', () => {
 const summary = summaryFromRun(result)
 assert.deepEqual(projection.conclusions, { domestic: summary.conclusions.domesticSummary, international: summary.conclusions.internationalSummary, evidenceQualifier: summary.conclusions.evidenceQualifier })
 assert.deepEqual(projection.brief, generateHomeBrief(summary.factorAssessments))
})
for (const field of ['lineage', 'snapshotPath', 'acceptanceRecord', 'environment', 'email', 'stack', 'diagnostics', 'privateArchive', 'token', 'retrievedAt', 'workflowRunId']) {
 test(`allowlist rejects restricted extra field ${field}`, () => {
  const bad = structuredClone(projection); bad[field] = 'restricted'; assert.throws(() => validatePublicSignal(bad))
  const nested = structuredClone(projection); nested.factors[0][field] = 'restricted'; assert.throws(() => validatePublicSignal(nested))
 })
}
for (const [name, mutate] of [
 ['schema mismatch', p => p.schemaVersion = 'signal-public-shadow/1'],
 ['bad state', p => p.factors[0].state = 'BULLISH'],
 ['wrong ownership', p => p.factors[0].factorId = 'reserve-share'],
 ['duplicate factor', p => p.factors[1] = p.factors[0]],
 ['false count', p => p.validFactorCount = 6],
 ['false quality', p => p.evidenceQuality.HIGH = 7],
 ['wrong sensitivity', p => p.thresholdSensitiveFactorIds = []],
 ['invalid month', p => p.factors[0].observationPeriod = '2026-13'],
 ['invalid quarter', p => p.factors[1].observationPeriod = '2026-Q5'],
 ['incomplete window', p => p.factors[0].confirmationWindow.from = p.factors[0].confirmationWindow.through],
 ['missing not neutral', p => p.factors[0].state = 'INSUFFICIENT_DATA'],
 ['safe dates mismatch', p => p.evidenceThrough.latest = '2026-02-30'],
 ['private path in text', p => p.brief.domestic.en = '/Users/private/a'],
 ['email in text', p => p.brief.domestic.en = 'person@example.com'],
 ['HTML injection', p => p.brief.domestic.en = '<script>bad</script>'],
 ['oversized text', p => p.brief.domestic.en = 'x'.repeat(25000)],
]) test(`malformed public projection rejects ${name}`, () => { const bad = structuredClone(projection); mutate(bad); assert.throws(() => validatePublicSignal(bad)) })
test('stale snapshot cannot present CURRENT in a newer economic build', () => {
 assert.throws(() => validatePublicSignal(projection, '0'.repeat(64)))
})
test('tampered allowlisted conclusion rejected against real validated run', () => {
 const bad = structuredClone(projection); bad.brief.domestic.en = 'Fabricated interpretation.'
 assert.throws(() => validatePublicAgainstRun(bad, result), /SEMANTIC/)
})
for (const language of ['en', 'zh']) {
 test(`${language}: Home current brief, full page seven cards, transition and quality copy`, () => {
  const brief = render(React.createElement(Brief, { language, data: projection }))
  assert(brief.includes(projection.brief.domestic[language])); assert(brief.includes('#/research/signal-engine'))
  assert(!brief.includes(projection.conclusions.evidenceQualifier[language]))
  const page = render(React.createElement(Page, { language, data: projection }))
  assert.equal((page.match(/data-signal-factor=/g) || []).length, 7)
  assert(page.includes(language === 'zh' ? '完整确认窗口' : 'complete confirmation window'))
  assert(page.includes(language === 'zh' ? '不代表解释正确的概率' : 'not the probability'))
  assert(page.includes(language === 'zh' ? '阈值敏感' : 'Threshold-sensitive'))
 })
 test(`${language}: loading / unavailable never renders conclusions`, () => {
  for (const Component of [Brief, Page]) for (const loading of [true, false]) {
   const html = render(React.createElement(Component, { language, data: null, loading }))
   assert(!html.includes(projection.brief.domestic[language])); assert(html.includes('role="status"'))
  }
 })
}
test('frozen presentation catalogue matches internal IDs/rules without reimplementation', () => {
 const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'research/signal-engine/signal-engine-v0.1-draft.json')))
 signalFactors.forEach((c, i) => {
  const f = cfg.factors[i]
  for (const [publicKey, ruleKey] of [['id','id'], ['series','primarySeriesId'], ['frequency','frequency'], ['confirmation','persistencePeriods'], ['transform','transformId'], ['entry','entry'], ['quiet','quiet']]) assert.equal(c[publicKey], f[ruleKey])
 })
})
for (const factor of signalFactors) for (const state of factor.states) test(`explicit brief rule ${factor.id}/${state}`, () => {
 const input = projection.factors.map(({ factorId, state, evidenceQuality, sensitivity }) => ({ factorId, state, evidenceQuality, sensitivity }))
 const f = input.find(f => f.factorId === factor.id); f.state = state
 if (state === 'INSUFFICIENT_DATA') { f.evidenceQuality = 'UNASSESSED'; f.sensitivity = 'NOT_EVALUATED' }
 const brief = generateHomeBrief(input)
 assert(brief.domestic.zh && brief.international.en)
 assert(!JSON.stringify(brief).includes('undefined'))
 assert.deepEqual(brief, generateHomeBrief(input))
 assert(generateConclusions(input).factorInterpretations[f.factorId].en)
})
test('LOW quality adds caution; missing factors have no neutral substitution', () => {
 const input = projection.factors.map(({ factorId, state, evidenceQuality, sensitivity }) => ({ factorId, state, evidenceQuality, sensitivity }))
 input[0].evidenceQuality = 'LOW'; assert(generateHomeBrief(input).domestic.en.includes('cautiously'))
 input[0].state = 'INSUFFICIENT_DATA'; input[0].evidenceQuality = 'UNASSESSED'; input[0].sensitivity = 'NOT_EVALUATED'
 assert(generateHomeBrief(input).domestic.en.includes('incomplete'))
})
test('engine failure replaces stale CURRENT with safe UNAVAILABLE, leaves data unchanged', async () => {
 const file = path.join(root, 'current.json'); fs.writeFileSync(file, JSON.stringify(projection))
 const before = workingSignalInputHash(ROOT)
 const fallback = await generatePublicSignal({ file, acceptedFactory: () => { throw Error('test-only acceptance failure') } })
 assert.deepEqual(fallback, unavailableSignal()); assert.deepEqual(JSON.parse(fs.readFileSync(file)), unavailableSignal())
 assert.equal(workingSignalInputHash(ROOT), before)
})
test('workflow generates public projection before final build; shadow/email isolation preserved', () => {
 const yml = fs.readFileSync(path.join(ROOT, '.github/workflows/deploy.yml'), 'utf8')
 const build = yml.split('  build:')[1].split('  signal-shadow:')[0]
 assert(build.indexOf('Record exact snapshot commit') < build.indexOf('npm run signal:public'))
 assert(build.indexOf('npm run signal:public') < build.indexOf('- run: npm run build'))
 assert(!build.includes('continue-on-error'))
 assert(yml.includes("vars.SIGNAL_SHADOW_ENABLED == 'true'"))
})

test('accepted-input engine failure is isolated and temporary restricted storage is removed', async () => {
 const file = path.join(root, 'evaluation-fallback.json'); fs.writeFileSync(file, JSON.stringify(projection))
 const temp = fs.realpathSync(os.tmpdir()), before = fs.readdirSync(temp).filter(n => n.startsWith('wil-public-signal-')).sort()
 const hash = workingSignalInputHash(ROOT)
 const fallback = await generatePublicSignal({ file, acceptedFactory: () => acceptedFixture,
  evaluateOptions: { clock: () => '2026-10-04T18:00:00.000Z', evaluateFn: () => { throw Error('test-only evaluation failure') }, testOnlyForceEvaluation: true } })
 assert.deepEqual(fallback, unavailableSignal()); assert.equal(workingSignalInputHash(ROOT), hash)
 assert.deepEqual(fs.readdirSync(temp).filter(n => n.startsWith('wil-public-signal-')).sort(), before)
})
test('fresh presentation processes produce identical deterministic bytes', () => {
 const input = projection.factors.map(({ factorId, state, evidenceQuality, sensitivity }) => ({ factorId, state, evidenceQuality, sensitivity }))
 const code = `import{generateHomeBrief,generateConclusions}from'./scripts/lib/signalConclusions.mjs';const input=JSON.parse(process.argv[1]);process.stdout.write(JSON.stringify({brief:generateHomeBrief(input),conclusions:generateConclusions(input)}))`
 const evaluate = () => execFileSync(process.execPath, ['--input-type=module', '-e', code, JSON.stringify(input)], { cwd: ROOT, encoding: 'utf8' })
 assert.equal(evaluate(), evaluate())
})

test('public CLI accepts only explicit snapshot/code identity options', () => {
 const id = 'a'.repeat(40)
 assert.deepEqual(parsePublicArguments(['--snapshot', id, '--code-commit', id]), { snapshot: id, codeCommit: id })
 assert.deepEqual(parsePublicArguments([]), {})
})
test('public CLI rejects malformed, duplicate and unsupported options', () => {
 for (const args of [['--private-archive'], ['--snapshot'], ['--snapshot', 'fake'], ['--snapshot', 'a'.repeat(40), '--snapshot', 'b'.repeat(40)]]) assert.throws(() => parsePublicArguments(args))
})

const encoded = value => Buffer.from(JSON.stringify(value) + '\n')
const clientOptions = (bytes, status, snapshot) => ({ artifactSha256: publicSignalSha256(bytes), status, snapshotCommit: snapshot, inputHash: workingSignalInputHash(ROOT) })
test('F1: complete bytes, status and accepted snapshot are independently bound to the build', async () => {
 const snapshot = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()
 const current = makePublicSignal(result, snapshot), currentBytes = encoded(current), fallbackBytes = encoded(unavailableSignal())
 const currentBuild = clientOptions(currentBytes, 'CURRENT', snapshot), unavailableBuild = clientOptions(fallbackBytes, 'UNAVAILABLE', snapshot)
 assert.equal((await verifyPublicSignalBytes(currentBytes, currentBuild)).status, 'CURRENT')
 assert.equal((await verifyPublicSignalBytes(fallbackBytes, unavailableBuild)).status, 'UNAVAILABLE')
 assert.equal(current.inputSnapshotHash, projection.inputSnapshotHash, 'same economic inputs in both builds')
 await assert.rejects(verifyPublicSignalBytes(currentBytes, unavailableBuild), /ARTIFACT_MISMATCH/)
 await assert.rejects(verifyPublicSignalBytes(fallbackBytes, currentBuild), /ARTIFACT_MISMATCH/)
 for (const mutate of [
  p => p.inputSnapshot = '0123456789', p => p.status = 'UNAVAILABLE',
  p => p.conclusions.international.en = 'The dollar is guaranteed to strengthen.',
  p => p.factors[0].interpretation.zh = '任意解读',
  p => p.factors[0].evidenceQuality = 'LOW', p => p.factors[2].sensitivity = 'NOT_SENSITIVE',
 ]) { const changed = structuredClone(current); mutate(changed); await assert.rejects(verifyPublicSignalBytes(encoded(changed), currentBuild), /ARTIFACT_MISMATCH/) }
 await assert.rejects(verifyPublicSignalBytes(Buffer.alloc(24001), currentBuild), /TOO_LARGE/)
})
test('F1/F2: final gate checks exact accepted snapshot, digest and canonical bilingual prose', () => {
 const snapshot = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()
 const file = path.join(root, 'verified-current.json'), identityFile = path.join(root, 'verified-current.identity.json')
 const current = makePublicSignal(result, snapshot)
 fs.writeFileSync(file, encoded(current)); const identity = publishPublicIdentity({ repo: ROOT, file, identityFile, snapshotCommit: snapshot })
 assert.equal(verifyPublicIdentity({ repo: ROOT, file, identityFile, expectedSnapshot: snapshot }).artifactSha256, identity.artifactSha256)
 assert(validatePublicMeaning(current))
 const forgedSnapshot = structuredClone(current); forgedSnapshot.inputSnapshot = '0123456789'
 fs.writeFileSync(file, encoded(forgedSnapshot))
 assert.throws(() => verifyPublicIdentity({ repo: ROOT, file, identityFile, expectedSnapshot: snapshot }))
 assert.throws(() => publishPublicIdentity({ repo: ROOT, file, identityFile, snapshotCommit: snapshot }), /SNAPSHOT_COMMIT_MISMATCH/)
 fs.writeFileSync(file, encoded(current))
 for (const change of [
  p => p.brief.domestic.en = 'Arbitrary home interpretation.',
  p => p.brief.international.zh = '任意解读。',
  p => p.conclusions.domestic.en = 'Arbitrary domestic conclusion.',
  p => p.conclusions.international.en = 'The dollar is guaranteed to strengthen.',
  p => p.conclusions.evidenceQualifier.zh = '任意证据质量说明。',
  p => p.factors[0].interpretation.en = 'Arbitrary factor interpretation.',
  p => p.factors[6].interpretation.zh = '任意因素解读。',
  p => p.brief.domestic.en = 'Workflow run 12345 job restricted-shadow',
 ]) { const changed = structuredClone(current); change(changed); assert.throws(() => validatePublicMeaning(changed), /SEMANTIC_MISMATCH/) }
 const fabricated = structuredClone(current)
 fabricated.conclusions.international.en = 'The dollar is guaranteed to strengthen.'
 fs.writeFileSync(file, encoded(fabricated))
 fs.writeFileSync(identityFile, JSON.stringify({ ...identity, artifactSha256: publicSignalSha256(encoded(fabricated)) }) + '\n')
 assert.throws(() => verifyPublicIdentity({ repo: ROOT, file, identityFile, expectedSnapshot: snapshot }), /SEMANTIC_MISMATCH/, 'even a matching forged digest cannot authenticate unreviewed prose')
 assert.throws(() => validatePublicSignal({ ...current, brief: { ...current.brief, domestic: { ...current.brief.domestic, en: 'C:\\private\\signal.json' } } }), /UNSAFE_TEXT/)
 assert.throws(() => validatePublicSignal({ ...current, brief: { ...current.brief, domestic: { ...current.brief.domestic, en: 'D:\\secret\\run.json' } } }), /UNSAFE_TEXT/)
})
test('F3: cleanup EACCES cannot alter CURRENT or block an UNAVAILABLE fallback', async () => {
 const snapshot = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()
 const leftovers = []
 const cleanupTemporary = directory => { leftovers.push(directory); throw Object.assign(Error('private runner path'), { code: 'EACCES' }) }
 const oldLog = console.log, messages = []
 console.log = message => messages.push(message)
 try {
  const goodFile = path.join(root, 'cleanup-current.json')
  const good = await generatePublicSignal({ file: goodFile, snapshot, acceptedFactory: () => acceptedFixture,
   evaluateOptions: { clock: () => '2026-10-04T18:00:00.000Z' }, cleanupTemporary })
  assert.equal(good.status, 'CURRENT'); assert.equal(JSON.parse(fs.readFileSync(goodFile)).status, 'CURRENT')
  assert.equal(verifyPublicIdentity({ repo: ROOT, file: goodFile, identityFile: `${goodFile}.build-identity.json`, expectedSnapshot: snapshot }).status, 'CURRENT')
  const badFile = path.join(root, 'cleanup-unavailable.json')
  const failed = await generatePublicSignal({ file: badFile, snapshot, acceptedFactory: () => { throw Error('test-only evaluation failure') }, cleanupTemporary })
  assert.deepEqual(failed, unavailableSignal()); assert.deepEqual(JSON.parse(fs.readFileSync(badFile)), unavailableSignal())
  assert.equal(verifyPublicIdentity({ repo: ROOT, file: badFile, identityFile: `${badFile}.build-identity.json`, expectedSnapshot: snapshot }).status, 'UNAVAILABLE')
  assert.equal(messages.filter(m => m.includes('cleanup incomplete')).length, 2)
  assert(!messages.join(' ').includes('private runner path') && !messages.join(' ').includes(root))
 } finally { console.log = oldLog; for (const directory of leftovers) fs.rmSync(directory, { recursive: true, force: true }) }
})
test('F4/F5: Home heading stays after first brief; policy evidence goes to actual FEDFUNDS chart', () => {
 const html = render(React.createElement(Brief, { language: 'en', data: projection }))
 assert(html.startsWith('<section') && html.includes('data-signal-brief'))
 assert(!/<h[1-6]\b/.test(html), 'Home brief must not precede page H1 with subheadings')
 const policy = signalFactors.find(f => f.id === 'policy-rate-direction')
 assert.equal(policy.series, 'FEDFUNDS'); assert.equal(policy.researchLink, '#/drivers?topic=rates')
 assert.equal(policy.sourceUrl, 'https://fred.stlouisfed.org/series/FEDFUNDS')
})
