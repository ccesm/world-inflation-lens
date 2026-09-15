import React from 'react'
import { monitorDefinitions } from '../data/monitor.js'
import { formatNumber } from '../utils/inflation.js'
import { iaCopy } from '../i18n/architecture.js'
import { environmentRules, descriptiveLevel } from '../utils/environment.js'

export function Observation({ item, language }) {
  const last = item.points.findLast(p => p.value !== null)
  const frequency = language === 'zh' ? (item.source.frequency.startsWith('annual') ? '年度' : item.source.frequency.startsWith('weekly') ? '每周' : item.source.frequency === 'daily' ? '每日' : '月度') : item.source.frequency
  return <><strong>{formatNumber(last?.value, language)} <small>{item.unit}</small></strong><p className="ia-source">{language === 'zh' ? '历史观测' : 'Observed'} · {last?.date || '—'} · {frequency}<br /><a href={item.source.sourceUrl} target="_blank" rel="noreferrer">FRED · {item.id} ↗</a></p></>
}
export function OutlookSummary({ language }) {
  return <div className="ia-summary" aria-label={language === 'zh' ? '三个摘要指标' : 'Three summary indicators'}>{['CPIAUCNS', 'DFII10', 'FYPUGDA188S'].map(id => { const item = monitorDefinitions.find(p => p.id === id); return <article key={id}><h3>{item[language]}</h3><Observation item={item} language={language} /><p>{item.note[language]}</p></article> })}</div>
}
export function Environment({ language }) {
  const t = iaCopy[language]
  return <section className="ia-section"><h2>{t.environment}</h2><p>{t.environmentNote}</p><div className="ia-grid four">{environmentRules.map((rule, i) => {
    const item = monitorDefinitions.find(p => p.id === rule.id), level = descriptiveLevel(item.points, item.source.frequency, rule.thresholds)
    return <article key={rule.id}><h3>{t.environmentNames[i]}</h3><p>{rule[language]}: <b>{level === null ? t.unavailable : t.levels[level]}</b></p><Observation item={item} language={language} /><p className="ia-source">{language === 'zh' ? rule.ruleZh : rule.ruleEn}</p></article>
  })}</div></section>
}
