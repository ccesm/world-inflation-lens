import React from 'react'
import { PageIntro } from '../components/PageIntro.jsx'
import { monitorDefinitions } from '../data/monitor.js'
import { dollarCopy } from '../i18n/dollar.js'
import { updatesCopy } from '../i18n/updates.js'
import { formatNumber } from '../utils/inflation.js'

export function Monitor({ language }) {
  const t = dollarCopy[language], u = updatesCopy[language]
  return <><PageIntro eyebrow={t.observed} title={t.monitorTitle} description={t.monitorDesc} /><section className="content-section global-section dollar-section"><p>{t.cadence}</p><div className="dollar-grid monitor-grid">{monitorDefinitions.map(item => {
    const last = item.points.findLast(p => p.value !== null)
    const points = item.points.slice(-60), values = points.filter(p => p.value !== null).map(p => p.value), lo = Math.min(...values), hi = Math.max(...values)
    let connected = false
    const d = points.map((p, i) => { if (p.value === null) { connected = false; return '' } const cmd = connected ? 'L' : 'M'; connected = true; return `${cmd}${i / Math.max(1, points.length - 1) * 280},${58 - (p.value - lo) / (hi - lo || 1) * 50}` }).join(' ')
    return <article key={item.id}><small>{item.source.frequency}</small><h3>{item[language]}</h3><strong>{formatNumber(last?.value, language)} <small>{item.unit}</small></strong><p>{t.latest}: {item.source.frequency.startsWith('annual') ? last?.date.slice(0, 4) : last?.date}</p><svg viewBox="0 0 280 65" aria-hidden="true"><path d={d} fill="none" stroke="var(--global-accent)" strokeWidth="2" /></svg><p>{points[0].date} — {points.at(-1).date}</p><p>{item.note[language]}</p><a href={item.source.sourceUrl} target="_blank" rel="noreferrer">{item.id} ↗</a>{item.id === 'interest-revenue' && <> · <a href="https://fred.stlouisfed.org/series/FYFR" target="_blank" rel="noreferrer">FYFR ↗</a></>}<p>{u.updated}: {item.source.sourceUpdatedAt}<br />{u.retrieved}: {item.source.retrievedAt}</p><details className="data-table"><summary>{t.table}</summary><div tabIndex="0" role="region" aria-label={`${item[language]} ${t.table}`}><table><thead><tr><th>{t.month}</th><th>{item.unit}</th></tr></thead><tbody>{points.map(p => <tr key={p.date}><th scope="row">{p.date}</th><td>{formatNumber(p.value, language)}</td></tr>)}</tbody></table></div></details></article>
  })}</div><p className="global-help">{t.pending}</p><a href="#/sources">{t.links[5]} →</a></section></>
}
