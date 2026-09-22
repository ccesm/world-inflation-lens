import { readFile, appendFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createDigest, mailConfig, sendDigest } from './lib/notification.mjs'

const root = resolve(import.meta.dirname, '..')
const read = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'))
try {
  const env = process.env
  const dry = process.argv.includes('--dry-run')
  const ledger = await read('data/updates/history.json').catch(() => null)
  const headline = await read('data/inflation/fred.json').catch(() => null)
  const monitor = await read('data/inflation/monitor.json').catch(() => null)
  const observations = [headline, ...(monitor?.series || []).filter(s => ['DFII10', 'T5YIFR', 'FYPUGDA188S'].includes(s.id))].filter(Boolean).map(s => {
    const latest = s.observations.findLast(p => Number.isFinite(p.value))
    return { id: s.id, date: latest?.date || 'unavailable', value: latest?.value ?? '—', units: s.units, frequency: s.frequency, sourceUrl: s.sourceUrl }
  })
  const runId = env.GITHUB_RUN_ID || (dry ? '0' : '')
  const digest = createDigest({ ledger, observations, build: env.BUILD_RESULT || 'unknown', deploy: env.DEPLOY_RESULT || 'unknown', runId })
  if (dry) {
    console.log('PREVIEW ONLY — no email sent.\n' + digest.text)
  } else {
    const config = mailConfig(env)
    const result = await sendDigest({ config, digest, runId, attempt: env.GITHUB_RUN_ATTEMPT || '1' })
    const message = result.status === 'accepted' ? 'Gmail accepted the message; inbox delivery is not verified.' : 'Email NOT SENT: configure GMAIL_ADDRESS and GMAIL_APP_PASSWORD in repository secrets.'
    console.log(message)
    if (env.GITHUB_STEP_SUMMARY) await appendFile(env.GITHUB_STEP_SUMMARY, `\n${message}\n`)
    if (result.status === 'not_configured') console.log('::warning::Email reminders are not configured; no email was sent.')
  }
} catch (error) {
  // Only controlled validation/transport errors above; never dump provider bodies or environment values.
  console.error(error.code ? 'Notification failed: local input unavailable.' : error.message)
  process.exitCode = 1
}
