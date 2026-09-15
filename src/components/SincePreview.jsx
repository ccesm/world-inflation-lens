import React from 'react'
import { cpi, cpiMetadata } from '../data/inflation.js'
import drivers from '../../data/inflation/drivers.json'
import cbo from '../../data/fiscal/cbo-2026-02.json'
import { formatNumber } from '../utils/inflation.js'

export function SincePreview({ language }) {
  const zh = language === 'zh'
  const money = drivers.series.find(s => s.id === 'M2SL'), shelter = drivers.series.find(s => s.id === 'CUUR0000SAH1')
  const historical = cbo.observations.filter(p => p.status === 'actual').map(p => ({ date: String(p.year), value: p.debt }))
  const rows = [[zh ? '消费物价 CPI' : 'Consumer CPI', cpi, '1971-08', cpiMetadata.sourceUrl], ['M2', money.observations, '1971-08', money.sourceUrl], [zh ? '居住服务' : 'Shelter services', shelter.observations, '1971-08', shelter.sourceUrl], [zh ? '公众持有债务 / GDP' : 'Public debt / GDP', historical, '1971', cbo.metadata.historicalCsv]]
  return <><div className="ia-grid four ia-since">{rows.map(([name, points, baseDate, url]) => {
    const base = points.find(p => p.date === baseDate), last = points.findLast(p => p.value !== null)
    return <article key={name}><h3>{name}</h3><strong>{formatNumber(base?.value > 0 ? last.value / base.value * 100 : null, language, 1)}</strong><p>{baseDate} = 100 → {last.date}</p><p className="ia-source">{zh ? '历史观测 · 指数 · ' : 'Observed · Index · '}{baseDate.length === 4 ? (zh ? '年度' : 'Annual') : (zh ? '月度' : 'Monthly')}</p><a className="ia-source" href={url} target="_blank" rel="noreferrer">{baseDate.length === 4 ? 'CBO' : 'FRED'} ↗</a></article>
  })}</div><p className="ia-source">{zh ? '每个指数独立归一化：当期值 ÷ 起点值 ×100。M2 为已季调广义货币，债务为财政年度 GDP 占比，其余为未季调物价；这些不是同一种购买力尺度或投资回报。工资和原油在 1971 年没有对应观测，详细页面可选择更晚基准。' : 'Each index is normalized independently: current value ÷ base value ×100. M2 is seasonally adjusted broad money; debt is a fiscal-year GDP ratio; the others are unadjusted prices. These are not equivalent purchasing-power measures or investment returns. Wages and oil lack a 1971 observation; later bases are available on the detail page.'}</p></>
}
