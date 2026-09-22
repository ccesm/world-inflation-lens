import { createHash } from 'node:crypto'
import nodemailer from 'nodemailer'

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
  const names = ['GMAIL_ADDRESS', 'GMAIL_APP_PASSWORD']
  if (names.some(k => !env[k]?.trim())) return null
  const address = env.GMAIL_ADDRESS.trim()
  // Phone copy/paste can include invisible formatting characters. Google also groups
  // app passwords with spaces; none of these characters belong to the SMTP password.
  const password = env.GMAIL_APP_PASSWORD.normalize('NFKC').replace(/[\s\u200B-\u200D\u2060\uFEFF]/g, '')
  if (!/^[^\s<>@,;]+@(gmail\.com|googlemail\.com)$/i.test(address)) throw new Error('GMAIL_ADDRESS must be one personal Gmail address')
  if (password.length !== 16) throw new Error(`GMAIL_APP_PASSWORD has ${password.length} characters after removing spaces; expected 16. Use the generated app password, not the app name or normal Gmail password.`)
  if (!/^[a-z0-9]{16}$/i.test(password)) throw new Error('GMAIL_APP_PASSWORD has 16 characters but includes symbols; paste only the generated Google app password.')
  return { address, password }
}

export async function sendDigest({ config, digest, runId, attempt = '1', transporterFactory = options => nodemailer.createTransport(options) }) {
  if (!config) return { status: 'not_configured' }
  if (!runUrl(runId) || !/^\d+$/.test(attempt)) throw new Error('Invalid workflow identity')
  const hash = createHash('sha256').update(digest.subject + digest.text).digest('hex').slice(0, 24)
  const transporter = transporterFactory({ service: 'gmail', auth: { user: config.address, pass: config.password }, connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 15000 })
  try {
    // SMTP cannot prove whether an uncertain send reached Gmail. Do not retry automatically.
    const result = await transporter.sendMail({ from: config.address, to: config.address, subject: digest.subject, text: digest.text, messageId: `<wil-${runId}-${attempt}-${hash}@world-inflation-lens.github.io>` })
    if (result?.rejected?.length || !result?.accepted?.some(address => address.toLowerCase() === config.address.toLowerCase())) throw new Error('Gmail did not confirm recipient acceptance')
    return { status: 'accepted' } // SMTP acceptance is not confirmed inbox delivery.
  } catch {
    throw new Error('Gmail sending failed or acceptance is uncertain; check the workflow and Gmail account')
  } finally {
    transporter.close?.()
  }
}
