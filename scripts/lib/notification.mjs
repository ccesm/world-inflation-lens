import { createHash } from 'node:crypto'

const site = 'https://ccesm.github.io/world-inflation-lens/'
export const runUrl = id => /^\d+$/.test(id || '') ? `https://github.com/ccesm/world-inflation-lens/actions/runs/${id}` : null
const categories = ['added', 'filled', 'revised', 'withdrawn']

export function createDigest({ ledger, build, deploy, runId, observations = [] }) {
  const url = runUrl(runId)
  if (!url) throw new Error('A valid workflow run ID is required')
  const current = ledger?.runs?.find(r => r.runUrl === url)
  const success = build === 'success' && deploy === 'success' && Boolean(current)
  const subject = `World Inflation Lens · ${success ? '每日数据更新 / Daily update' : '更新未完成 / Update incomplete'}`
  const lines = [subject, '', `构建 / Build: ${build}`, `部署 / Deployment: ${deploy}`]
  if (success) {
    lines.push(`本次成功检查 / This successful check (UTC): ${current.checkedAt}`)
    const totals = Object.fromEntries(categories.map(k => [k, 0]))
    for (const s of current.changes) for (const k of categories) {
      if (!Number.isSafeInteger(s[k]) || s[k] < 0) throw new Error('Invalid revision counts')
      totals[k] += s[k]
    }
    lines.push(`新增 / New: ${totals.added}; 补齐 / Filled: ${totals.filled}; 修订 / Revised: ${totals.revised}; 撤回 / Withdrawn: ${totals.withdrawn}`)
    if (Object.values(totals).every(n => n === 0)) lines.push('本次检查没有发现观测值变化。No observation changes in this check.')
    for (const s of current.changes.filter(s => categories.some(k => s[k]))) {
      lines.push(`${s.id}: ${categories.map(k => `${k}=${s[k]}`).join(', ')}`)
    }
    lines.push('', '部分序列最新可用观测 / Latest available observations (not all are today):')
    for (const s of observations) lines.push(`${s.id}: ${s.date} · ${s.value} ${s.units} · ${s.frequency}\n${s.sourceUrl}`)
  } else {
    lines.push('本次更新或部署没有完成，不能把上次的记录视为今天的数据。',
      'This run did not complete a verified update and deployment. Prior records are not today’s results.',
      `可读取的最近成功检查 / Last recorded successful check: ${ledger?.lastSuccessfulCheck || 'unavailable'}`,
      '请查看运行记录。Please review the workflow run. No new-data claim is made.')
  }
  lines.push('', '月度、季度和年度数据保留来源频率；每日检查不代表每日产生新观测。',
    'Daily checks preserve original frequencies. Reviewed CBO, SIPRI and stablecoin publication vintages remain manual.',
    '这是数据更新提醒，不是预测或投资信号。This is a data-update notice, not a forecast or investment signal.', '', site, url)
  return { subject, text: lines.join('\n'), success }
}

export function mailConfig(env) {
  const names = ['RESEND_API_KEY', 'NOTIFY_FROM', 'NOTIFY_TO']
  if (names.some(k => !env[k]?.trim())) return null
  // Single mailbox only: no implicit mailing lists or recipient expansion.
  if (![env.NOTIFY_FROM, env.NOTIFY_TO].every(s => /^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/.test(s))) throw new Error('Notification addresses must be single plain email addresses')
  return { key: env.RESEND_API_KEY, from: env.NOTIFY_FROM, to: env.NOTIFY_TO }
}

export async function sendDigest({ config, digest, runId, attempt = '1', fetchFn = fetch, pause = ms => new Promise(r => setTimeout(r, ms)) }) {
  if (!config) return { status: 'not_configured' }
  if (!runUrl(runId) || !/^\d+$/.test(attempt)) throw new Error('Invalid workflow identity')
  const payload = JSON.stringify({ from: config.from, to: [config.to], subject: digest.subject, text: digest.text })
  const hash = createHash('sha256').update(payload).digest('hex')
  const idempotency = `wil-${runId}-${attempt}-${hash}`
  for (let i = 0; i < 3; i++) {
    let response
    try {
      response = await fetchFn('https://api.resend.com/emails', {
        method: 'POST', signal: AbortSignal.timeout(15000),
        headers: { Authorization: `Bearer ${config.key}`, 'Content-Type': 'application/json', 'Idempotency-Key': idempotency }, body: payload,
      })
    } catch {
      if (i === 2) throw new Error('Email service unavailable; acceptance could not be confirmed')
      await pause(1000 * (i + 1)); continue
    }
    if (response.ok) {
      const body = await response.json().catch(() => null)
      if (!body?.id) throw new Error('Email service response missing acceptance ID')
      return { status: 'accepted' } // Provider acceptance does not establish inbox delivery.
    }
    if (!(response.status === 429 || response.status >= 500) || i === 2) throw new Error(`Email service rejected the request (HTTP ${response.status})`)
    await pause(1000 * (i + 1))
  }
}
