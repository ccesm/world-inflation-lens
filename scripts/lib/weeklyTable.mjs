// Read-only email presentation. Values come from the validated snapshot/ledger.
import { seriesMetadata } from '../../src/data/seriesContract.js'
import { runUrl } from './notification.mjs'

const pair = (zh, en) => ({ zh, en })
const names = {
  CPIAUCNS: pair('美国 CPI', 'US CPI'), CPIUFDNS: pair('食品价格', 'Food CPI'),
  CPIENGNS: pair('能源价格', 'Energy CPI'), CUUR0000SAH1: pair('住房价格', 'Shelter CPI'),
  CUUR0000SEHF01: pair('居民电价', 'Electricity CPI'),
  DGS10: pair('10年期美债收益率', '10Y Treasury yield'), DFII10: pair('10年期实际收益率', '10Y real yield'),
  T5YIFR: pair('5年后5年通胀补偿', '5Y5Y inflation compensation'),
  DTWEXBGS: pair('广义美元指数', 'Broad dollar index'), WALCL: pair('美联储总资产', 'Fed assets'),
  TIC_TOTAL: pair('境外美债持有总额', 'Foreign Treasury holdings'), TIC_JAPAN: pair('日本美债持有量', 'Japan Treasury holdings'),
  TIC_CHINA: pair('中国美债持有量', 'China Treasury holdings'), TIC_UK: pair('英国美债持有量', 'UK Treasury holdings'),
  TIC_OFFICIAL: pair('境外官方美债持有量', 'Foreign official Treasury holdings'),
  IPN22112CS: pair('电力生产指数', 'Electric power production'), IPG3344S: pair('半导体生产指数', 'Semiconductor production'),
  DPSACBM027SBOG: pair('商业银行存款', 'Commercial bank deposits'),
}
const kindLabels = { added: pair('新增', 'new'), filled: pair('补齐', 'filled'), revised: pair('修订', 'revised'), withdrawn: pair('撤回', 'withdrawn') }
const both = p => `${p.zh} / ${p.en}`
const number = n => {
  if (n === null) return '未披露 / unavailable'
  const native = String(n)
  if (native.includes('e')) return native
  const [integer, fraction] = native.split('.')
  return integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (fraction === undefined ? '' : `.${fraction}`)
}
const escape = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]))
const safeURL = url => { try { const u = new URL(url); return u.protocol === 'https:' && !u.username && !u.password ? u.href : null } catch { return null } }

export function explainWeeklyRow(row) {
  if (row.basis === 'REVISION') return pair('历史估计修订，不代表本周经济活动变化。', 'Historical revision; not economic activity this week.')
  if (row.basis === 'WITHDRAWN') return pair('来源撤回数据，暂不作经济判断。', 'Source withdrew data; no economic inference.')
  if (row.basis === 'FILLED') return pair('原缺失数据补齐，不代表新一期增长。', 'Missing data filled; not new-period growth.')
  if (row.before === null || row.after === null) return pair('前值或可比信息不足，暂不判断影响。', 'Insufficient comparable values; impact undetermined.')
  const direction = Math.sign(row.after - row.before)
  if (!direction) return pair('所示数值未变，不能据此判断整体趋势。', 'Displayed values unchanged; no overall trend inferred.')
  if (['CPIAUCNS','CPIUFDNS','CPIENGNS','CUUR0000SAH1','CUUR0000SEHF01'].includes(row.id)) return direction > 0
    ? pair('价格水平上升；未季调，不能据此判断通胀加速。', 'Price level rose; unadjusted, not evidence of faster inflation.')
    : pair('价格水平下降；未季调，不能据此判断通胀趋势。', 'Price level fell; unadjusted, no inflation trend inferred.')
  if (row.id === 'T5YIFR') return pair('通胀补偿含风险和流动性溢价，并非纯粹通胀预期。', 'Compensation includes risk/liquidity premia; not pure expectations.')
  if (row.id.startsWith('TIC_')) return pair('持有量变化不等于净买卖，也不能单独判断美元信心。', 'Holdings changes are not net purchases or a measure of dollar confidence.')
  if (['DGS10','DFII10'].includes(row.id)) return pair('反映国债融资条件变化，不代表企业实际借款成本。', 'Treasury financing conditions changed; not actual corporate borrowing costs.')
  if (row.id === 'IPN22112CS') return pair('反映电力产出变化，不能识别 AI 用电量。', 'Power output changed; AI electricity use is not identified.')
  if (row.id === 'IPG3344S') return pair('反映半导体产出变化，不能单独归因于 AI。', 'Semiconductor output changed; no AI attribution established.')
  return pair('仅反映该指标变化，宏观影响尚未判定。', 'Indicator change only; macroeconomic impact undetermined.')
}

export function weeklyTableRow(item, source, end) {
  const metadata = source ? seriesMetadata(source) : null
  const title = names[item.id] || metadata?.title || pair(item.id, item.id)
  const updates = Object.entries(kindLabels).filter(([k]) => item[k]).map(([k, label]) => `${both(label)} ${item[k]}`).join(' · ')
  const base = { id:item.id, title, updates, period:null, beforePeriod:null, before:null, after:null, basis:'UNAVAILABLE', units:metadata?.units || '', frequency:metadata?.frequency || '', adjustment:metadata?.seasonalAdjustment || '', publisher:metadata?.publisher || '', sourceURL:safeURL(metadata?.sourceUrl), sourceUpdatedAt:source?.sourceUpdatedAt || null, retrievedAt:source?.retrievedAt || null }
  // A country panel has no single comparable national value. Never aggregate it.
  if (!source || source.countryPanel) return { ...base, impact:explainWeeklyRow(base) }
  const events = [...item.examples].sort((a,b) => b.date.localeCompare(a.date) || b.checkedAt.localeCompare(a.checkedAt))
  const event = events[0]
  if (!event || !/^\d{4}(?:-\d{2}(?:-\d{2})?)?$/.test(event.date) || event.date > end.slice(0,10)) return { ...base, impact:explainWeeklyRow(base) }
  const index = source.observations.findIndex(p => p.date === event.date)
  // Bounded ledger examples may omit a later recast. Do not present a stale
  // example as the current snapshot or fill a withdrawn/missing value.
  if (index < 0 || source.observations[index].value !== event.after) return { ...base, period:event.date, impact:explainWeeklyRow(base) }
  const row = { ...base, period:event.date, after:event.after }
  if (event.kind === 'added') {
    row.basis = 'PRIOR_OBSERVATION'
    const previous = source.observations[index - 1]
    // Immediately preceding stored observation, including null. Never last-valid fill.
    row.before = previous?.value ?? null
    row.beforePeriod = previous?.date || null
  } else {
    row.basis = { revised:'REVISION', withdrawn:'WITHDRAWN', filled:'FILLED' }[event.kind]
    row.before = event.before
    row.beforePeriod = event.date
  }
  row.impact = explainWeeklyRow(row)
  return row
}

export function renderWeeklyTable({ subject, window, totals, rows, runId, localWindow }) {
  const summary = `本周 ${rows.length} 项指标有更新 / ${rows.length} updated indicators`
  const coverage = window.complete ? '' : '记录覆盖不足完整七天；本表可能遗漏更新。Partial history: updates may be omitted.'
  const notes = [
    '前值＝前一条已存观测（同一快照），日期单列；修订行则比较同一期修订前后。Prior = preceding stored observation in the same snapshot; revision rows compare the same period across vintages.',
    '每项仅列最新保留的更新样本；数量为变化事件，不是完整明细。One latest retained example per indicator; event counts are not complete revision details.',
    '可能影响属于解释，不是因果结论、影响评分或预测。Possible implications are interpretation, not causality, impact scores or forecasts.',
    '本周捕获不等于本周经济活动；缺失值不填零。Capture this week is not activity this week; missing values are not zero.',
  ]
  const basis = row => row.basis === 'REVISION' ? '同一期修订 / same-period revision' : row.basis === 'FILLED' ? '补齐缺失 / missing value filled' : row.basis === 'WITHDRAWN' ? '数据撤回 / withdrawn' : row.basis === 'PRIOR_OBSERVATION' ? '前一已存观测 / prior stored observation' : '比较信息不足 / comparison unavailable'
  const value = (row, before) => `${!before && row.before !== null && row.after !== null ? row.after > row.before ? '↑ ' : row.after < row.before ? '↓ ' : '→ ' : ''}${number(before ? row.before : row.after)} (${(before ? row.beforePeriod : row.period) || '日期未披露 / date unavailable'})`
  const header = ['指标 / Indicator','本周更新 / Update','前值 / Prior','最新披露值 / Latest reported','可能影响 / Possible implication']
  const text = [subject, summary, localWindow, coverage, '', header.join(' | '), ...rows.map(r => [`${both(r.title)} [${r.units}]`,`${r.updates}; ${basis(r)}`,value(r,true),value(r,false),both(r.impact)].join(' | '))]
  if (!rows.length) text.push('可用记录中没有观测值变化 / No observation changes in available records.')
  const sources = rows.map(r => `${both(r.title)}: ${r.publisher}; ${r.sourceURL || '来源未提供 / source unavailable'}; ${r.frequency}; ${r.adjustment}; 来源更新 / updated: ${r.sourceUpdatedAt || '未披露 / not disclosed'}; 抓取 / retrieved: ${r.retrievedAt || '未披露 / not disclosed'}`)
  text.push('', ...notes, '', '来源与数据口径 / Sources and definitions', ...sources, '', `核对记录 / Workflow: ${runUrl(runId)}`, '详细数据 / Details: https://ccesm.github.io/world-inflation-lens/#/research/updates')
  const cell = (s,label) => `<td data-label="${escape(label)}" style="padding:10px 8px;border-bottom:1px solid #ddd;vertical-align:top;overflow-wrap:anywhere">${s}</td>`
  const bilingual = p => `${escape(p.zh)}<br><small lang="en" style="color:#555">${escape(p.en)}</small>`
  const tableRows = rows.map(r => `<tr>${cell(`${bilingual(r.title)}<br><small>${escape(r.units)}</small>`,header[0])}${cell(`${escape(r.updates)}${r.basis === 'PRIOR_OBSERVATION' ? '' : `<br><small>${escape(basis(r))}</small>`}`,header[1])}${cell(escape(value(r,true)),header[2])}${cell(escape(value(r,false)),header[3])}${cell(bilingual(r.impact),header[4])}</tr>`).join('')
  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>@media(max-width:600px){table,tbody,tr,td{display:block!important;width:auto!important}caption{display:block!important;width:100%!important;box-sizing:border-box}thead{display:none!important}tr{margin:12px 0;border:1px solid #ddd}td::before{content:attr(data-label);display:block;font-weight:bold;font-size:12px;color:#555}td{border-bottom:0!important;padding:6px 10px!important}}</style></head><body style="margin:0;padding:16px;background:#fff;color:#222;font:14px/1.5 Arial,sans-serif"><main style="max-width:1040px;margin:auto"><h1 style="font-size:20px">每周数据简报 / Weekly data brief</h1><p>${escape(subject.slice(-10))} · ${escape(summary)}<br><small>${escape(localWindow)}</small></p>${coverage ? `<p>${escape(coverage)}</p>` : ''}<table style="width:100%;border-collapse:collapse;table-layout:fixed"><caption style="text-align:left;padding:6px">本周更新及可能影响 / Updates and possible implications</caption><thead><tr>${header.map(h=>`<th scope="col" style="text-align:left;background:#edf2f7;padding:10px 8px;overflow-wrap:anywhere">${escape(h)}</th>`).join('')}</tr></thead><tbody>${tableRows || `<tr><td colspan="5">可用记录中没有观测值变化 / No observation changes in available records.</td></tr>`}</tbody></table><p><a href="https://ccesm.github.io/world-inflation-lens/#/research/updates">详细数据与更新记录 / Full data and update history</a></p><div style="font-size:12px;color:#555">${notes.map(n=>`<p>${escape(n)}</p>`).join('')}<h2 style="font-size:14px">来源与数据口径 / Sources and definitions</h2>${rows.map(r=>`<p>${r.sourceURL ? `<a href="${escape(r.sourceURL)}">${escape(both(r.title))}</a>` : escape(both(r.title))} · ${escape(r.publisher)} · ${escape(r.frequency)} · ${escape(r.adjustment)} · 来源更新 / updated: ${escape(r.sourceUpdatedAt || '未披露 / not disclosed')} · 抓取 / retrieved: ${escape(r.retrievedAt || '未披露 / not disclosed')}</p>`).join('')}<p><a href="${runUrl(runId)}">本次核对记录 / Workflow</a></p></div></main></body></html>`
  return { text:text.filter(s=>s !== '').join('\n'), html, rows, totals }
}
