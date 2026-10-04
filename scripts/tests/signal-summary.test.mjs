import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execFileSync } from 'node:child_process'
import { emptySummary, validateSummary, readSummary, resolveSummary, renderSummary, summaryFromRun } from '../lib/signalShadowSummary.mjs'
import { createDigest, runUrl } from '../lib/notification.mjs'

const current = { ...emptySummary('CURRENT'), inputSnapshotShort: '261f2955ff', lastValidSnapshotShort: '261f2955ff', lastValidArtifactShort: '0123456789', factorsValid: 7, factorCount: 7,
  evidenceQualitySummary: { HIGH: 0, MEDIUM: 7, LOW: 0, UNASSESSED: 0 }, thresholdSensitiveFactors: ['GSCPI', 'BIS'] }
const samples = {
  CURRENT: current, UNCHANGED: { ...current, status: 'UNCHANGED', interpretationReused: true },
  FAILED_WITH_LAST_VALID: { ...current, status: 'FAILED_WITH_LAST_VALID', inputSnapshotShort: 'abcdef0123', failureStage: 'ENGINE', failureCategory: 'ENGINE_EVALUATION_FAILED' },
  NO_VALID_ARTIFACT: { ...emptySummary('NO_VALID_ARTIFACT'), inputSnapshotShort: '261f2955ff', failureStage: 'ENGINE', failureCategory: 'ENGINE_EVALUATION_FAILED' },
  DISABLED: emptySummary('DISABLED'), UNKNOWN: emptySummary(),
}
const ledger = { lastSuccessfulCheck: '2026-10-04T01:00:00Z', runs: [{ runUrl: runUrl('42'), checkedAt: '2026-10-04T01:00:00Z', changes: [{ id: 'CPI', added: 1, filled: 0, revised: 2, withdrawn: 0 }] }] }
const args = { ledger, build: 'success', deploy: 'success', runId: '42', observations: [{ id: 'CPI', date: '2026-08', value: 123, units: 'Index', frequency: 'monthly', sourceUrl: 'https://fred.stlouisfed.org/series/CPIAUCSL' }] }
for (const [status, summary] of Object.entries(samples)) test(`EMAIL ${status} preserves existing economic content and renders one safe section`, () => {
  validateSummary(summary)
  const old = createDigest(args), digest = createDigest({ ...args, signalSummary: summary })
  assert(digest.text.startsWith(old.text)); assert.equal(digest.subject, old.subject); assert.equal(digest.success, old.success)
  assert.equal(digest.text.match(/Signal Engine Shadow/g)?.length, 1)
  assert(digest.text.includes(`Status: ${status}`)); assert(digest.text.includes('Economic deployment: SUCCESS'))
  assert(!/\/Users\/|file:\/\/|SECRET|stack|@|[a-f0-9]{40,64}/.test(digest.text.split('Signal Engine Shadow')[1]))
})
test('EMAIL reused and failed wording never promotes an old direction to current', () => {
  assert.match(renderSummary(samples.UNCHANGED), /Interpretation reused/)
  const failed = renderSummary(samples.FAILED_WITH_LAST_VALID)
  assert.match(failed, /Previous validated interpretation was preserved/)
  assert.match(failed, /No current Signal Engine interpretation was published/)
  assert.match(failed, /Last-valid Evidence quality: 7 MEDIUM/)
  assert.match(renderSummary(samples.NO_VALID_ARTIFACT), /No validated Signal Engine interpretation/)
  assert.match(renderSummary(samples.DISABLED), /currently disabled/)
  assert.match(renderSummary(samples.UNKNOWN), /Summary unavailable/)
})
test('EMAIL mixed evidence quality and actual empty sensitivity', () => {
  const mixed = { ...current, evidenceQualitySummary: { HIGH: 2, MEDIUM: 4, LOW: 1, UNASSESSED: 0 }, thresholdSensitiveFactors: [] }
  assert.match(renderSummary(mixed), /HIGH 2 \/ MEDIUM 4 \/ LOW 1/)
  assert.match(renderSummary(mixed), /Threshold-sensitive: None/)
  assert.match(renderSummary(current), /Threshold-sensitive: GSCPI, BIS/)
  assert.match(renderSummary({ ...mixed, factorsValid: 6, evidenceQualitySummary: { HIGH: 2, MEDIUM: 3, LOW: 1, UNASSESSED: 1 } }), /Factors valid: 6\/7/)
})
for (const [name, mutation] of Object.entries({
  fullArtifact: s => { s.lineage = [{ localPath: '/Users/private/file' }] },
  path: s => { s.inputSnapshotShort = '/Users/private' },
  secret: s => { s.failureCategory = 'SECRET_CREDENTIAL' },
  stack: s => { s.failureStage = 'Error: stack trace' },
  email: s => { s.thresholdSensitiveFactors = ['private@example.org'] },
  fullHash: s => { s.lastValidArtifactShort = 'a'.repeat(64) },
  numericIdentity: s => { s.inputSnapshotShort = 1234567890 },
  quality: s => { s.evidenceQualitySummary.MEDIUM = 8 },
  unknownQuality: s => { s.evidenceQualitySummary.token = 'SECRET' },
  reuse: s => { s.interpretationReused = true },
  noArtifactCurrent: s => { s.lastValidArtifactShort = null },
})) test(`SUMMARY rejects unsafe/inconsistent ${name} and email still generates`, () => {
  const s = structuredClone(current); mutation(s)
  assert.throws(() => validateSummary(s)); assert.equal(readSummary(s).status, 'UNKNOWN')
  const digest = createDigest({ ...args, signalSummary: s })
  assert(digest.success); assert.match(digest.text, /Status: UNKNOWN/)
  assert(!digest.text.includes('SECRET') && !digest.text.includes('/Users/') && !digest.text.includes('private@example.org'))
})
test('SUMMARY malformed JSON, oversized payload and absent input fail safely', () => {
  for (const value of [undefined, '{', 'x'.repeat(5000), null]) assert.equal(readSummary(value).status, 'UNKNOWN')
  assert.equal(resolveSummary({ enabled: false, jobResult: 'skipped', value: current }).status, 'DISABLED')
  for (const jobResult of ['failure', 'cancelled', 'skipped', 'success']) assert.equal(resolveSummary({ enabled: true, jobResult }).status, 'UNKNOWN')
  assert.equal(resolveSummary({ enabled: true, jobResult: 'success', value: JSON.stringify(current) }).status, 'CURRENT')
  const blocked = resolveSummary({ enabled: true, jobResult: 'skipped', buildResult: 'failure' })
  assert.equal(blocked.status, 'UNKNOWN'); assert.equal(blocked.failureStage, 'ECONOMIC_BUILD')
})
test('SUMMARY generated counts and sensitivity come from actual factor metadata', () => {
  const ids = ['inflation-persistence', 'observed-productivity', 'supply-chain-pressure', 'policy-rate-direction', 'reserve-share', 'foreign-treasury-holdings', 'offshore-usd-credit']
  const factors = ids.map((factorId, i) => ({ factorId, state: i === 0 ? 'INSUFFICIENT_DATA' : 'TRANSITION', evidenceQuality: i === 0 ? 'UNASSESSED' : 'HIGH', sensitivity: i === 4 ? 'THRESHOLD_SENSITIVE' : 'NOT_SENSITIVE' }))
  const artifact = { content: { ruleVersion: current.ruleVersion, engineVersion: current.engineVersion, inputSnapshotCommit: 'a'.repeat(40), domesticFactors: factors.slice(0, 4), internationalFactors: factors.slice(4) } }
  const run = { storagePersisted: true, result: 'SUCCESS_NEW', inputSnapshotCommit: 'a'.repeat(40), artifactHash: 'b'.repeat(64), failureStage: null, errorCategory: null }
  const s = summaryFromRun({ run, artifact })
  assert.equal(s.status, 'CURRENT'); assert.equal(s.factorsValid, 6); assert.equal(s.evidenceQualitySummary.HIGH, 6)
  assert.deepEqual(s.thresholdSensitiveFactors, ['COFER'])
  const failed = summaryFromRun({ run: { ...run, result: 'FAILED', failureStage: 'ENGINE', errorCategory: 'ENGINE_EVALUATION_FAILED', fallbackArtifactHash: 'b'.repeat(64) }, fallback: artifact })
  assert.equal(failed.status, 'FAILED_WITH_LAST_VALID')
  assert.equal(summaryFromRun({ run: { ...run, storagePersisted: false }, artifact }).status, 'UNKNOWN')
})
test('WORKFLOW notification always runs despite skipped/failed shadow; deployment dependencies unchanged', () => {
  const yml = fs.readFileSync('.github/workflows/deploy.yml', 'utf8')
  const notify = yml.split('  notify:')[1].split('  status:')[0], deploy = yml.split('  deploy:')[1].split('  notify:')[0], shadow = yml.split('  signal-shadow:')[1].split('  deploy:')[0]
  assert.match(notify, /always\(\)/); assert.match(notify, /needs: \[build, deploy, signal-shadow\]/)
  assert.match(shadow, /vars.SIGNAL_SHADOW_ENABLED == 'true'/); assert.match(shadow, /needs: build/)
  assert.match(shadow, /id: summary\n\s+if: always\(\)/); assert.match(shadow, /steps.summary.outputs.summary/)
  assert.match(deploy, /needs: build/); assert(!deploy.includes('signal-shadow'))
  assert(!/SIGNAL_SMTP_USER|SIGNAL_SMTP_APP_PASSWORD|SIGNAL_EMAIL_TO/.test(yml))
  assert.equal((notify.match(/run: node scripts\/notify.mjs/g) || []).length, 1)
})
test('ACTIONS summary and job output use the same safe contract, with UNKNOWN for broken input', () => {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'wil-summary-test-'))
  try {
    const input = path.join(root, 'input.json'), output = path.join(root, 'output'), markdown = path.join(root, 'summary')
    fs.writeFileSync(input, JSON.stringify(current))
    const env = { PATH: process.env.PATH, SIGNAL_SHADOW_SUMMARY_FILE: input, GITHUB_OUTPUT: output, GITHUB_STEP_SUMMARY: markdown }
    execFileSync(process.execPath, ['scripts/signal-shadow-summary.mjs'], { env })
    assert.deepEqual(JSON.parse(fs.readFileSync(output, 'utf8').trim().slice('summary='.length)), current)
    assert(fs.readFileSync(markdown, 'utf8').includes(renderSummary(current)))
    fs.writeFileSync(input, '{bad PRIVATE_EXCEPTION')
    execFileSync(process.execPath, ['scripts/signal-shadow-summary.mjs'], { env })
    assert.match(fs.readFileSync(markdown, 'utf8'), /Status: UNKNOWN/)
    assert(!fs.readFileSync(markdown, 'utf8').includes('PRIVATE_EXCEPTION'))
  } finally { fs.rmSync(root, { recursive: true, force: true }) }
})
test('CLI configuration failure exports UNKNOWN without internal diagnostics', () => {
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'wil-summary-cli-'))
  try {
    const file = path.join(root, 'safe.json')
    assert.throws(() => execFileSync(process.execPath, ['scripts/signal-evaluate.mjs', '--invalid'], { env: { PATH: process.env.PATH, RUNNER_TEMP: root, SIGNAL_SHADOW_SUMMARY_FILE: file }, stdio: 'pipe' }))
    assert.equal(JSON.parse(fs.readFileSync(file)).status, 'UNKNOWN')
  } finally { fs.rmSync(root, { recursive: true, force: true }) }
})
test('DRY RUN existing notify script renders safe examples without mail credentials or SMTP', () => {
  for (const status of ['CURRENT', 'UNCHANGED', 'FAILED_WITH_LAST_VALID']) {
    const text = execFileSync(process.execPath, ['scripts/notify.mjs', '--dry-run'], { encoding: 'utf8', env: { PATH: process.env.PATH, BUILD_RESULT: 'success', DEPLOY_RESULT: 'success', GITHUB_RUN_ID: '42', SIGNAL_SHADOW_ENABLED: 'true', SIGNAL_SHADOW_RESULT: 'success', SIGNAL_SHADOW_SUMMARY: JSON.stringify(samples[status]) } })
    assert.match(text, /PREVIEW ONLY — no email sent/); assert(text.includes(`Status: ${status}`))
    fs.writeFileSync(`/private/tmp/wil-shadow-email-${status.toLowerCase()}.txt`, text)
  }
})
