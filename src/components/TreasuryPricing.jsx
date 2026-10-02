import React, { useMemo } from 'react'
import { monitorRaw } from '../data/monitor.js'
import { researchCopy } from '../data/researchArchitecture.js'
import { derive10YBreakeven } from '../utils/treasuryPricing.js'
import { formatNumber } from '../utils/inflation.js'
import { SeriesStatusNote } from './SystemStatus.jsx'

const labels = {
  en: {
    nominal: 'Nominal Treasury yield', real: 'TIPS real yield', compensation: 'Inflation compensation',
    date: 'Matched observation date', unavailable: 'No matching date is available. The proxy remains missing.',
    latestInputs: 'Latest available source observations', missing: 'Dates with a missing input remain missing; no interpolation or adjacent-date matching.',
    older: 'The latest matched date is older than one or both latest input observations. These yields use the matched date shown, not each source’s latest date.',
    mismatched: 'The latest source dates differ. The proxy only subtracts observations with exactly the same date.',
    status: 'Input freshness uses the existing data-health rules. This arithmetic proxy has no independent release or freshness state.',
    realNote: 'Real yields also reflect market financing conditions; they are not a pure Fed-policy indicator.',
    table: 'Inspect recent exact-date calculations', health: 'Data Health & System Status', pp: 'percentage points',
  },
  zh: {
    nominal: '名义国债收益率', real: 'TIPS 实际收益率', compensation: '通胀补偿',
    date: '精确匹配的观测日期', unavailable: '没有可匹配的日期，代理指标保持缺失。',
    latestInputs: '来源的最新可用观测', missing: '任一输入缺失的日期保持缺失；不插值，也不使用相邻日期匹配。',
    older: '最新匹配日期早于一个或两个来源的最新观测。这里的收益率使用注明的匹配日期，不是各来源各自的最新日期。',
    mismatched: '两个来源的最新日期不同。代理指标只对完全相同日期的观测值相减。',
    status: '输入数据的新鲜度沿用现有数据健康规则。这一算术代理指标没有单独的发布日期或新鲜度状态。',
    realNote: '实际收益率也反映市场融资条件，并非纯粹的美联储政策指标。',
    table: '查看近期精确日期计算', health: '数据健康与系统状态', pp: '百分点',
  },
}

export function TreasuryPricing({ language, nominalSource = monitorRaw.DGS10, realSource = monitorRaw.DFII10 }) {
  const t = labels[language], research = researchCopy[language]
  const derived = useMemo(() => derive10YBreakeven(nominalSource.observations, realSource.observations), [nominalSource, realSource])
  const latest = derived.latest
  return <section className="treasury-pricing" aria-labelledby="treasury-pricing-title" data-derived-concept="10y-breakeven">
    <h2 id="treasury-pricing-title">{research.breakevenTitle}</h2>
    <p>{research.breakevenMethod}</p>
    <p className="treasury-matched-date">{t.date}: <strong>{latest?.date || '—'}</strong></p>
    <div className="treasury-pricing-equation">
      <article><h3>{t.nominal}</h3><strong>{formatNumber(latest?.nominal ?? null, language)}<small> %</small></strong><span>DGS10 · 10Y</span></article>
      <span className="treasury-equation-symbol" aria-label={language === 'zh' ? '减去' : 'minus'}>−</span>
      <article><h3>{t.real}</h3><strong>{formatNumber(latest?.real ?? null, language)}<small> %</small></strong><span>DFII10 · 10Y</span></article>
      <span className="treasury-equation-symbol" aria-label={language === 'zh' ? '等于' : 'equals'}>=</span>
      <article><h3>{t.compensation}</h3><strong>{formatNumber(latest?.value ?? null, language)}<small> {t.pp}</small></strong><span>DGS10 − DFII10</span></article>
    </div>
    {!latest && <p className="treasury-date-note">{t.unavailable}</p>}
    {derived.hasMismatchedLatestDates && <p className="treasury-date-note">{t.mismatched}</p>}
    {derived.latestIsOlderThanInputs && <p className="treasury-date-note">{t.older}</p>}
    <p>{t.latestInputs}: DGS10 {derived.latestNominalDate || '—'} · DFII10 {derived.latestRealDate || '—'}</p>
    <p>{t.missing}</p>
    <p>{research.breakevenCaution}</p>
    <p>{t.realNote}</p>
    <p className="global-help">{t.status}</p>
    <div className="treasury-source-status">{[nominalSource, realSource].map(source => <div key={source.id}><a href={source.sourceUrl} target="_blank" rel="noreferrer">{source.id} ↗</a><SeriesStatusNote source={source} language={language} /></div>)}</div>
    <details className="data-table"><summary>{t.table}</summary><div tabIndex="0" role="region" aria-label={t.table}><table><thead><tr><th scope="col">{t.date}</th><th scope="col">DGS10 (%)</th><th scope="col">DFII10 (%)</th><th scope="col">{t.compensation} ({t.pp})</th></tr></thead><tbody>{derived.points.slice(-20).map(point => <tr key={point.date}><th scope="row">{point.date}</th><td>{formatNumber(point.nominal, language)}</td><td>{formatNumber(point.real, language)}</td><td>{formatNumber(point.value, language)}</td></tr>)}</tbody></table></div></details>
    <a className="ia-more" href="#/sources?focus=health">{t.health} →</a>
  </section>
}
