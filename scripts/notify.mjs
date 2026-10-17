import { readFile, appendFile, mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createDigest, mailConfig, sendDigest, shouldSendNotification } from './lib/notification.mjs'
import { createWeeklyDigest, loadWeeklySources } from './lib/weeklyDigest.mjs'
import { notificationOutput } from './lib/statusFiles.mjs'
import { resolveSummary } from './lib/signalShadowSummary.mjs'

const root = resolve(import.meta.dirname, '..')
const read = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'))
try {
  const env = process.env
  const dry = process.argv.includes('--dry-run')
  if (process.argv.includes('--html-preview') && !dry) throw new Error('HTML preview requires --dry-run')
  const ledger = await read('data/updates/history.json').catch(() => null)
  const headline = await read('data/inflation/fred.json').catch(() => null)
  const monitor = await read('data/inflation/monitor.json').catch(() => null)
  const observations = [headline, ...(monitor?.series || []).filter(s => ['DFII10', 'T5YIFR', 'FYPUGDA188S'].includes(s.id))].filter(Boolean).map(s => {
    const latest = s.observations.findLast(p => Number.isFinite(p.value))
    return { id: s.id, date: latest?.date || 'unavailable', value: latest?.value ?? '—', units: s.units, frequency: s.frequency, sourceUrl: s.sourceUrl }
  })
  const mode = process.argv.includes('--weekly') ? 'weekly' : env.NOTIFICATION_MODE || 'failure_only'
  const previewLatest = dry && mode === 'weekly' && !env.GITHUB_RUN_ID
  const previewRun = previewLatest ? ledger?.runs?.find(r => r.checkCompletedAt && /\/runs\/\d+$/.test(r.runUrl)) : null
  const runId = env.GITHUB_RUN_ID || (previewRun ? previewRun.runUrl.split('/').at(-1) : dry ? '0' : '')
  const signalSummary = resolveSummary({ value: env.SIGNAL_SHADOW_SUMMARY,
    enabled: env.SIGNAL_SHADOW_ENABLED === 'true', jobResult: env.SIGNAL_SHADOW_RESULT, buildResult: env.BUILD_RESULT })
  const args = { ledger, observations, build: env.BUILD_RESULT || (previewLatest ? 'success' : 'unknown'), deploy: env.DEPLOY_RESULT || (previewLatest ? 'success' : 'unknown'), runId, signalSummary }
  const digest = mode === 'weekly' ? createWeeklyDigest({ ...args, sources: args.build === 'success' && args.deploy === 'success' ? await loadWeeklySources(root) : [] }) : createDigest(args)
  const send = shouldSendNotification({ success: digest.success, mode })
  if (dry) {
    if (process.argv.includes('--html-preview') && digest.html) {
      await mkdir(resolve(root,'.refresh'),{recursive:true})
      await writeFile(resolve(root,'.refresh/weekly-email-preview.html'),digest.html)
    }
    console.log('PREVIEW ONLY — no email sent.' + (previewLatest ? '\n使用最近记录及模拟成功部署生成样稿，不代表新的执行或部署验收。Last recorded check with simulated deployment success; not a new run or deployment acceptance.' : '') + '\n' + digest.text)
  } else if (!send) {
    await notificationOutput('NOT_REQUESTED')
    console.log('日常更新成功，按周报设置不发送每日邮件。Successful daily check: email suppressed by weekly cadence.')
  } else {
    let config
    try { config=mailConfig(env) } catch { throw Object.assign(new Error('Gmail configuration is invalid; review the account and app-password settings.'),{notificationResult:'FAILED_CONFIGURATION'}) }
    const result = await sendDigest({ config, digest, runId, attempt: env.GITHUB_RUN_ATTEMPT || '1' })
    const message = result.status === 'accepted' ? 'Gmail accepted the message; inbox delivery is not verified.' : 'Email NOT SENT: configure GMAIL_ADDRESS and GMAIL_APP_PASSWORD in repository secrets.'
    await notificationOutput(result.status==='accepted'?'ACCEPTED_BY_GMAIL':'SKIPPED_NOT_CONFIGURED')
    console.log(message)
    if (env.GITHUB_STEP_SUMMARY) await appendFile(env.GITHUB_STEP_SUMMARY, `\n${message}\n`)
    if (result.status === 'not_configured') console.log('::warning::Email reminders are not configured; no email was sent.')
  }
} catch (error) {
  if (!process.argv.includes('--dry-run')) await notificationOutput(error.notificationResult || 'UNKNOWN')
  // Only controlled validation/transport errors above; never dump provider bodies or environment values.
  console.error(error.code ? 'Notification failed: local input unavailable.' : error.message)
  process.exitCode = 1
}
