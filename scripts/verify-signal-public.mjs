import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { validatePublicSignal } from '../src/utils/signalPublicContract.js'
import { workingSignalInputHash } from './lib/signalInputIdentity.mjs'
// This economic build gate deliberately has no isolated engine dependency.
function disclosureCategories(text) {
 const categories = []
 if (/\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text)) categories.push('CREDENTIAL_PATTERN')
 if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text)) categories.push('EMAIL_ADDRESS')
 if (/\/Users\/|\/home\/runner\/work\/|\/private\/(?:tmp|var)\//.test(text)) categories.push('LOCAL_PATH')
 if (/signal-shadow-interpretation\/1|signal-public-shadow\/1|signal-economic-acceptance\/1|signal-shadow-context\/1|signal-shadow-run\/1|signal-shadow-summary\/[12]|deterministic-signal-conclusions\/1/.test(text)) categories.push('RESTRICTED_SIGNAL_PAYLOAD')
 for (const key of ['GITHUB_TOKEN', 'GH_TOKEN', 'SIGNAL_ARCHIVE_TOKEN', 'GMAIL_APP_PASSWORD']) if (process.env[key]?.length >= 12 && text.includes(process.env[key])) categories.push('SECRET_VALUE')
 return categories
}
const root = process.cwd()
const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)])
for (const directory of ['public', 'dist']) for (const file of walk(path.join(root, directory))) {
 const relative = path.relative(path.join(root, directory), file), text = fs.readFileSync(file, 'utf8')
 if (relative === 'data/signal-engine/current.json') validatePublicSignal(JSON.parse(text), workingSignalInputHash(root))
 else assert(!/signal-engine|production-artifacts/.test(relative), 'UNEXPECTED_SIGNAL_ASSET')
 assert.deepEqual(disclosureCategories(text, { publicOutput: true }), [], 'RESTRICTED_PUBLIC_DISCLOSURE')
}
for (const file of walk(path.join(root, 'src')).filter(file => /\.(js|jsx)$/.test(file))) {
 const text = fs.readFileSync(file, 'utf8')
 assert(!/from\s+['"][^'"]*(?:research\/signal-engine|scripts\/signal-engine|signalConclusions|signalShadowSummary)/.test(text), 'ENGINE_OR_INTERNAL_GENERATOR_IN_BROWSER')
}
console.log('PASS: only strict public summary and reviewed UI assets are published; restricted artifacts, paths, emails and credentials excluded.')
