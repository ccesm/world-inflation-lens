import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { captureManifest, specEnvironment, loadArchive, SOURCE_FILES } from '../../research/signal-engine/engine/inputs.mjs'
import { receipt as engineReceipt } from '../../research/signal-engine/engine/acceptance.mjs'
import { contentHash, instant, sha256 } from '../../research/signal-engine/engine/core.mjs'
import { ROOT, ENGINE_REFERENCE, COMMIT, git, dataIdentity, economicCommit, gateCodeIdentity, now } from './identity.mjs'

export function runEconomicGates(repo) {
  for (const script of ['build', 'verify']) {
    execFileSync('npm', ['run', script], { cwd: repo, stdio: 'inherit', timeout: 240_000 })
  }
  return [{ name: 'npm run build', result: 'PASS' }, { name: 'npm run verify', result: 'PASS' }]
}
export function captureAcceptedInput({ repo = ROOT, targetCommit, codeCommit, clock = now, gates = runEconomicGates }) {
  const targetIdentity = dataIdentity(repo, targetCommit)
  const inputCommit = economicCommit(repo, targetCommit)
  if (!COMMIT.test(codeCommit || '')) throw Error('CODE_COMMIT_REQUIRED')
  // A successful gate against other working bytes cannot validate this commit.
  const verifyWorkingBytes = () => {
    for (const file of targetIdentity.files) if (sha256(fs.readFileSync(path.join(repo, file.path))) !== file.sha256) throw Error('WORKING_ECONOMIC_BUNDLE_MISMATCH')
  }
  const firstSeenAt = instant(clock())
  verifyWorkingBytes()
  const validatorCodeHash = gateCodeIdentity(repo)
  const results = gates(repo)
  if (contentHash(results) !== contentHash([{ name: 'npm run build', result: 'PASS' }, { name: 'npm run verify', result: 'PASS' }])) throw Error('ECONOMIC_GATES_NOT_PASSED')
  verifyWorkingBytes()
  if (gateCodeIdentity(repo) !== validatorCodeHash) throw Error('VALIDATOR_CODE_CHANGED_DURING_GATES')
  const env = specEnvironment(repo)
  // Keep the frozen loader's generic and international validation as well.
  const manifest = captureManifest(repo, inputCommit, env.contracts)
  const completedAt = instant(clock())
  const acceptedAt = instant(clock())
  const productionReceipt = {
    schemaVersion: 'signal-economic-acceptance/1', engineReference: ENGINE_REFERENCE,
    targetCommit, inputCommit, codeCommit, inputSnapshotHash: targetIdentity.hash,
    protectedFiles: targetIdentity.files, firstSeenAt, validationCompletedAt: completedAt,
    recordedAt: acceptedAt, acceptedAt, validatorCodeHash, gates: results,
  }
  const receiptHash = contentHash(productionReceipt)
  manifest.validationCompletedAt = completedAt
  manifest.validation = 'PASS_PRODUCTION_ECONOMIC_GATES_AND_ENGINE_CONTRACTS'
  for (const dataset of manifest.datasets) {
    dataset.firstSeenAt = firstSeenAt
    dataset.snapshotAcceptedAt = acceptedAt
    dataset.acceptanceEvidenceRef = `PRODUCTION_ECONOMIC_ACCEPTANCE:${receiptHash}`
    dataset.acceptanceRecord = engineReceipt(dataset, completedAt, acceptedAt)
  }
  const accepted = { receipt: productionReceipt, receiptHash, manifest, manifestHash: contentHash(manifest) }
  validateAcceptedInput(accepted, { repo })
  return accepted
}
export function validateAcceptedInput(accepted, { repo = ROOT } = {}) {
  const r = accepted?.receipt
  if (!r || r.schemaVersion !== 'signal-economic-acceptance/1' || r.engineReference !== ENGINE_REFERENCE) throw Error('UNSUPPORTED_PRODUCTION_ACCEPTANCE')
  if (contentHash(r) !== accepted.receiptHash || contentHash(accepted.manifest) !== accepted.manifestHash) throw Error('ACCEPTANCE_HASH_MISMATCH')
  const identity = dataIdentity(repo, r.inputCommit)
  if (identity.hash !== r.inputSnapshotHash || contentHash(identity.files) !== contentHash(r.protectedFiles) || dataIdentity(repo, r.targetCommit).hash !== identity.hash) throw Error('ACCEPTED_BUNDLE_IDENTITY_MISMATCH')
  if (!COMMIT.test(r.codeCommit || '') || !/^[a-f0-9]{64}$/.test(r.validatorCodeHash || '')) throw Error('INVALID_GATE_CODE_IDENTITY')
  if (contentHash(r.gates) !== contentHash([{ name: 'npm run build', result: 'PASS' }, { name: 'npm run verify', result: 'PASS' }])) throw Error('ECONOMIC_GATES_NOT_PASSED')
  const times = [r.firstSeenAt, r.validationCompletedAt, r.recordedAt, r.acceptedAt].map(t => Date.parse(instant(t)))
  if (times.some((t, i) => i && t < times[i - 1])) throw Error('CONTRADICTORY_PRODUCTION_ACCEPTANCE')
  const manifest = accepted.manifest
  if (manifest.schemaVersion !== 'project-input-manifest/0.1' || manifest.inputCommit !== r.inputCommit || manifest.validationCompletedAt !== r.validationCompletedAt || manifest.validation !== 'PASS_PRODUCTION_ECONOMIC_GATES_AND_ENGINE_CONTRACTS') throw Error('PRODUCTION_MANIFEST_MISMATCH')
  if (contentHash(manifest.datasets.map(d => d.snapshotPath).sort()) !== contentHash([...SOURCE_FILES].sort())) throw Error('INCOMPLETE_PRODUCTION_MANIFEST')
  for (const d of manifest.datasets) {
    const file = identity.files.find(f => f.path === d.snapshotPath)
    if (!file || d.snapshotSha256 !== file.sha256 || d.inputCommit !== r.inputCommit || d.id !== `snapshot:${d.snapshotPath}:${file.sha256}` || d.inputVintageId !== `${r.inputCommit}:${d.snapshotPath}`) throw Error('PRODUCTION_DATASET_IDENTITY_MISMATCH')
    if (d.firstSeenAt !== r.firstSeenAt || d.snapshotAcceptedAt !== r.acceptedAt || d.acceptanceRecord?.validationCompletedAt !== r.validationCompletedAt || d.acceptanceRecord?.recordedAt !== r.recordedAt || d.acceptanceEvidenceRef !== `PRODUCTION_ECONOMIC_ACCEPTANCE:${accepted.receiptHash}`) throw Error('PRODUCTION_DATASET_ACCEPTANCE_MISMATCH')
  }
  const env = specEnvironment(repo)
  const archive = loadArchive(repo, manifest, env)
  env.inputCommit = manifest.inputCommit
  return { archive, env }
}
