import React, { useState } from 'react'
import { cpi, cpiMetadata, latestCpi } from '../data/inflation.js'
import { purchasingPower } from '../utils/dollar.js'
import { dollarCopy } from '../i18n/dollar.js'
import { driversCopy } from '../i18n/drivers.js'
import { DriverChart } from '../charts/DriverChart.jsx'
import { formatNumber } from '../utils/inflation.js'

export function DollarPower({ language, initialBase = '1913-01' }) {
  const t = dollarCopy[language], [base, setBase] = useState(initialBase), [month, setMonth] = useState(latestCpi.date)
  const points = purchasingPower(cpi, base), dates = points.map(p => p.date)
  const selected = month < base ? base : month
  const current = points.find(p => p.date === selected), latest = points.find(p => p.date === latestCpi.date)
  return <section className="dollar-panel" aria-labelledby="dollar-power-title"><p className="eyebrow">{t.observed} · CPIAUCNS</p><h2 id="dollar-power-title">{t.powerTitle}</h2><p>{t.powerNote}</p>
    <div className="dollar-presets" role="group" aria-label={t.base}>{['1913-01', '1945-01', '1971-08', '1980-01', '2000-01', '2020-01', latestCpi.date].map(date => <button key={date} aria-pressed={base === date} onClick={() => { setBase(date); setMonth(latestCpi.date) }}>{date === latestCpi.date ? `${t.latest} · ${date}` : date}</button>)}</div>
    <div className="dollar-power-result"><span>$1.00 <small>({base})</small> → <strong>${formatNumber(latest.value / 100, language, 3)}</strong><small>({latestCpi.date} · {t.basePrices})</small></span><p>{t.remaining}: {formatNumber(latest.value, language)}%</p></div>
    <DriverChart series={[{ id: 'power', name: t.remaining, color: '#c46b46', points }]} dates={dates} selected={selected} onSelect={setMonth} title={`${base} – ${latestCpi.date}`} unit="%" language={language} labels={driversCopy[language]} />
    <label>{t.inspect}: {selected} · {formatNumber(current?.value, language)}%<input type="range" min="0" max={points.length - 1} value={Math.max(0, dates.indexOf(selected))} onChange={event => setMonth(dates[Number(event.target.value)])} /></label>
    <details className="data-table"><summary>{t.table}</summary><div tabIndex="0" role="region" aria-label={t.table}><table><thead><tr><th>{t.month}</th><th>{t.remaining} (%)</th></tr></thead><tbody>{points.map(p => <tr key={p.date}><th scope="row">{p.date}</th><td>{formatNumber(p.value, language)}</td></tr>)}</tbody></table></div></details>
    <p className="global-help">{t.formula}</p><a href={cpiMetadata.sourceUrl} target="_blank" rel="noreferrer">BLS / FRED · {cpiMetadata.id} ↗</a>
  </section>
}
