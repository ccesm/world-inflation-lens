import assert from 'node:assert/strict'
import { createDigest, mailConfig, sendDigest, runUrl } from './lib/notification.mjs'
const record = { checkedAt: '2026-09-22T15:00:00Z', runUrl: runUrl('42'), changes: [{ id: 'CPI', added: 1, filled: 0, revised: 2, withdrawn: 0 }] }
const ledger = { lastSuccessfulCheck: record.checkedAt, runs: [record] }
const args = { ledger, build: 'success', deploy: 'success', runId: '42' }
const digest = createDigest(args)
assert.equal(digest.success, true); assert.match(digest.text, /New: 1/); assert.match(digest.text, /Revised: 2/)
assert.equal(createDigest({ ...args, runId: '43' }).success, false, 'Old ledger cannot establish this run succeeded')
assert.equal(createDigest({ ...args, deploy: 'failure' }).success, false)
assert.equal(createDigest({ ...args, build: 'failure', ledger: null }).success, false)
const unchanged = structuredClone(ledger); unchanged.runs[0].changes[0].added = 0; unchanged.runs[0].changes[0].revised = 0
assert.match(createDigest({ ...args, ledger: unchanged }).text, /No observation changes/)
assert.equal(mailConfig({}), null)
assert.throws(() => mailConfig({ RESEND_API_KEY: 'secret', NOTIFY_FROM: 'from@example.com', NOTIFY_TO: 'a@example.com,b@example.com' }))
const config = mailConfig({ RESEND_API_KEY: 'secret', NOTIFY_FROM: 'from@example.com', NOTIFY_TO: 'to@example.com' })
assert.deepEqual(await sendDigest({ config: null, fetchFn: () => { throw Error('Must not send') } }), { status: 'not_configured' })
const sent = []; let calls = 0
const fetchFn = async (url, options) => { sent.push({url,...options}); calls++; return calls === 1 ? { ok: false, status: 429 } : { ok: true, json: async () => ({ id: 'test' }) } }
assert.deepEqual(await sendDigest({ config, digest, runId: '42', fetchFn, pause: async () => {} }), { status: 'accepted' })
assert.equal(sent[0].headers['Idempotency-Key'], sent[1].headers['Idempotency-Key'])
assert.deepEqual(JSON.parse(sent[0].body).to, ['to@example.com'])
await assert.rejects(sendDigest({ config, digest, runId: '42', fetchFn: async () => ({ ok: false, status: 401, text: () => 'SECRET' }) }), e => !e.message.includes('SECRET') && /401/.test(e.message))
let failures=0
await assert.rejects(sendDigest({ config, digest, runId: '42', fetchFn: async () => { failures++; throw Error('secret'); }, pause: async () => {} }), /acceptance could not be confirmed/)
assert.equal(failures, 3)
console.log('PASS: notification success/failure/stale-run handling, missing secrets, recipient validation, bounded retries and idempotency; no real mail sent')

const { readFile } = await import('node:fs/promises')
const workflow = await readFile(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8')
assert.match(workflow, /cron: '0 8 \* \* \*'/)
assert.match(workflow, /timezone: America\/Los_Angeles/)
assert.match(workflow, /needs: \[build, deploy\]/)
assert.match(workflow, /always\(\)/)
assert.match(workflow, /needs.build.outputs.snapshot_commit \|\| github.sha/)
assert.match(workflow, /secrets.RESEND_API_KEY/)
console.log('PASS: daily timezone schedule, exact snapshot checkout and post-deployment notification wiring')
