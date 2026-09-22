import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createDigest, mailConfig, sendDigest, runUrl } from './lib/notification.mjs'

const record = { checkedAt: '2026-09-22T15:00:00Z', runUrl: runUrl('42'), changes: [{ id: 'CPI', added: 1, filled: 0, revised: 2, withdrawn: 0 }] }
const ledger = { lastSuccessfulCheck: record.checkedAt, runs: [record] }
const args = { ledger, build: 'success', deploy: 'success', runId: '42' }
const digest = createDigest(args)
assert.equal(digest.success, true)
assert.match(digest.text, /New: 1/)
assert.match(digest.text, /Revised: 2/)
assert.equal(createDigest({ ...args, runId: '43' }).success, false, 'Old ledger cannot establish this run succeeded')
assert.equal(createDigest({ ...args, deploy: 'failure' }).success, false)
assert.equal(createDigest({ ...args, build: 'failure', ledger: null }).success, false)
const unchanged = structuredClone(ledger)
unchanged.runs[0].changes[0].added = 0
unchanged.runs[0].changes[0].revised = 0
assert.match(createDigest({ ...args, ledger: unchanged }).text, /No observation changes/)

assert.equal(mailConfig({}), null)
assert.equal(mailConfig({ GMAIL_ADDRESS: 'owner@gmail.com' }), null)
assert.throws(() => mailConfig({ GMAIL_ADDRESS: 'owner@gmail.com,other@gmail.com', GMAIL_APP_PASSWORD: 'abcdefghijklmnop' }), /one personal Gmail address/)
assert.throws(() => mailConfig({ GMAIL_ADDRESS: 'owner@example.com', GMAIL_APP_PASSWORD: 'abcdefghijklmnop' }), /one personal Gmail address/)
assert.throws(() => mailConfig({ GMAIL_ADDRESS: 'owner@gmail.com', GMAIL_APP_PASSWORD: 'short' }), /16-character/)
const config = mailConfig({ GMAIL_ADDRESS: ' owner@gmail.com ', GMAIL_APP_PASSWORD: 'abcd efgh ijkl mnop' })
assert.deepEqual(config, { address: 'owner@gmail.com', password: 'abcdefghijklmnop' })
assert.deepEqual(await sendDigest({ config: null, transporterFactory: () => { throw Error('Must not connect') } }), { status: 'not_configured' })

const messages = []
const options = []
let closed = 0
const transporterFactory = settings => {
  options.push(settings)
  return {
    sendMail: async message => { messages.push(message); return { accepted: ['owner@gmail.com'], rejected: [] } },
    close: () => { closed++ }
  }
}
assert.deepEqual(await sendDigest({ config, digest, runId: '42', transporterFactory }), { status: 'accepted' })
assert.deepEqual(options[0].auth, { user: 'owner@gmail.com', pass: 'abcdefghijklmnop' })
assert.equal(options[0].service, 'gmail')
assert.equal(messages[0].from, 'owner@gmail.com')
assert.equal(messages[0].to, 'owner@gmail.com')
assert.equal(messages[0].text, digest.text)
assert.match(messages[0].messageId, /<wil-42-1-/)
assert.equal(closed, 1)
await sendDigest({ config, digest, runId: '42', transporterFactory })
assert.equal(messages[1].messageId, messages[0].messageId, 'Same run and attempt should use a stable Message-ID')

let attempts = 0
await assert.rejects(sendDigest({ config, digest, runId: '42', transporterFactory: () => ({
  sendMail: async () => { attempts++; throw Error('secret server response') },
  close: () => {}
}) }), error => /acceptance is uncertain/.test(error.message) && !error.message.includes('secret'))
assert.equal(attempts, 1, 'Uncertain SMTP sends must not retry automatically')
await assert.rejects(sendDigest({ config, digest, runId: '42', transporterFactory: () => ({
  sendMail: async () => ({ accepted: [], rejected: ['owner@gmail.com'] }),
  close: () => {}
}) }), /acceptance is uncertain/)
console.log('PASS: notification success/failure/stale-run handling, Gmail configuration, same-address delivery, SMTP uncertainty and sanitized errors; no real mail sent')

const workflow = await readFile(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8')
assert.match(workflow, /cron: '0 8 \* \* \*'/)
assert.match(workflow, /timezone: America\/Los_Angeles/)
assert.match(workflow, /needs: \[build, deploy\]/)
assert.match(workflow, /always\(\)/)
assert.match(workflow, /needs.build.outputs.snapshot_commit \|\| github.sha/)
assert.match(workflow, /secrets.GMAIL_ADDRESS/)
assert.match(workflow, /secrets.GMAIL_APP_PASSWORD/)
assert.doesNotMatch(workflow, /RESEND_API_KEY|NOTIFY_FROM|NOTIFY_TO/)
console.log('PASS: daily timezone schedule, exact snapshot checkout and Gmail post-deployment notification wiring')
