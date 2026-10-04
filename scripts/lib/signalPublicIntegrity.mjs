import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { generateConclusions, generateHomeBrief, normalizeAssessments } from './signalConclusions.mjs'
import { workingSignalInputHash } from './signalInputIdentity.mjs'
import { validatePublicSignal } from '../../src/utils/signalPublicContract.js'

export const publicSignalPath = repo => path.join(repo, 'public/data/signal-engine/current.json')
export const publicSignalIdentityPath = repo => path.join(repo, '.refresh/signal-public-build.json')
export const publicSignalSha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const commitAt = repo => execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim()
const equal = (actual, expected) => JSON.stringify(actual) === JSON.stringify(expected)

// This is the same reviewed presentation generator used by shadow/email and
// initial public generation. No Signal Engine runtime is needed in build gates.
export function validatePublicMeaning(value) {
  validatePublicSignal(value)
  if (value.status === 'UNAVAILABLE') return true
  const assessments = normalizeAssessments(value.factors.map(({ factorId, state, evidenceQuality, sensitivity }) => ({ factorId, state, evidenceQuality, sensitivity })))
  const generated = generateConclusions(assessments)
  if (!equal(value.brief, generateHomeBrief(assessments)) ||
      !equal(value.conclusions, { domestic: generated.domesticSummary, international: generated.internationalSummary, evidenceQualifier: generated.evidenceQualifier }) ||
      value.factors.some(f => !equal(f.interpretation, generated.factorInterpretations[f.factorId]))) throw Error('PUBLIC_SIGNAL_SEMANTIC_MISMATCH')
  return true
}

// Identity is outside public/ and dist/. Vite embeds only this checked digest,
// status and snapshot reference; current.json never authenticates itself.
export function publishPublicIdentity({ repo, file = publicSignalPath(repo), identityFile = publicSignalIdentityPath(repo), snapshotCommit = commitAt(repo) }) {
  const bytes = fs.readFileSync(file), value = JSON.parse(bytes.toString('utf8'))
  validatePublicMeaning(value)
  if (!/^[a-f0-9]{40}$/.test(snapshotCommit) || value.status === 'CURRENT' && value.inputSnapshot !== snapshotCommit.slice(0, 10)) throw Error('PUBLIC_SIGNAL_SNAPSHOT_COMMIT_MISMATCH')
  const identity = { schemaVersion: 'signal-public-build/1', artifactSha256: publicSignalSha256(bytes), status: value.status, snapshotCommit }
  fs.mkdirSync(path.dirname(identityFile), { recursive: true })
  const temporary = `${identityFile}.tmp-${process.pid}`
  try {
    const fd = fs.openSync(temporary, 'wx', 0o600)
    try { fs.writeFileSync(fd, JSON.stringify(identity) + '\n'); fs.fsyncSync(fd) } finally { fs.closeSync(fd) }
    fs.renameSync(temporary, identityFile)
  } finally { fs.rmSync(temporary, { force: true }) }
  return identity
}

export function verifyPublicIdentity({ repo, file = publicSignalPath(repo), identityFile = publicSignalIdentityPath(repo), expectedSnapshot = process.env.WIL_SIGNAL_EXPECTED_SNAPSHOT || commitAt(repo) }) {
  const bytes = fs.readFileSync(file), value = JSON.parse(bytes.toString('utf8'))
  validatePublicMeaning(value)
  validatePublicSignal(value, workingSignalInputHash(repo))
  if (!/^[a-f0-9]{40}$/.test(expectedSnapshot) || expectedSnapshot !== commitAt(repo)) throw Error('PUBLIC_SIGNAL_BUILD_SNAPSHOT_MISMATCH')
  // A clean checkout has a committed UNAVAILABLE bootstrap and no generated
  // identity. A CURRENT artifact must always have the separate trusted record.
  if (!fs.existsSync(identityFile)) {
    if (value.status !== 'UNAVAILABLE') throw Error('PUBLIC_SIGNAL_IDENTITY_REQUIRED')
    return { artifactSha256: publicSignalSha256(bytes), status: 'UNAVAILABLE', snapshotCommit: expectedSnapshot }
  }
  const identity = JSON.parse(fs.readFileSync(identityFile, 'utf8'))
  if (!equal(Object.keys(identity).sort(), ['schemaVersion', 'artifactSha256', 'status', 'snapshotCommit'].sort()) ||
      identity.schemaVersion !== 'signal-public-build/1' || identity.snapshotCommit !== expectedSnapshot ||
      identity.artifactSha256 !== publicSignalSha256(bytes) || identity.status !== value.status ||
      value.status === 'CURRENT' && value.inputSnapshot !== expectedSnapshot.slice(0, 10)) throw Error('PUBLIC_SIGNAL_BUILD_IDENTITY_MISMATCH')
  return identity
}
