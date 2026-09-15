import React, { useState } from 'react'
import { PageIntro } from '../components/PageIntro.jsx'
import { DollarPower } from '../components/DollarPower.jsx'
import { dollarCopy } from '../i18n/dollar.js'
import { cpi } from '../data/inflation.js'
import snapshot from '../../data/inflation/drivers.json'
import { relativePrice } from '../utils/dollar.js'
import { DriverChart } from '../charts/DriverChart.jsx'
import { driversCopy } from '../i18n/drivers.js'
import { alignMonthly, monthsBetween } from '../utils/drivers.js'
import { formatNumber } from '../utils/inflation.js'
export function Since1971({ language }) {
  const t = dollarCopy[language], [base, setBase] = useState('1971-08'), [real, setReal] = useState(false)
  const end = cpi.at(-1).date, [month, setMonth] = useState(end)
  const dates = monthsBetween(base, end), selected = month < base ? base : month
  const specs = [['CPIUFDNS', '食品', 'Food', '#409989'], ['CUUR0000SAH1', '居住服务', 'Shelter services', '#8f87cf'], ['MCOILWTICO', '原油', 'Oil', '#be993e'], ['CEU0500000003', '平均时薪', 'Average hourly earnings', '#4499b5']]
  const series = alignMonthly(specs.map(([id, zh, en, color]) => ({ id, name: language === 'zh' ? zh : en, color, points: relativePrice(snapshot.series.find(s => s.id === id).observations, cpi, base, real) })), dates)
  return <><PageIntro eyebrow="DOLLAR / 1971" title={t.sinceTitle} description={t.sinceDesc} /><section className="content-section global-section dollar-section"><DollarPower language={language} initialBase="1971-08" /><section className="dollar-panel"><h2>{real ? t.real : t.nominal}</h2><div className="dollar-presets" role="group" aria-label={t.base}>{['1971-08', '1986-01', '2006-03', '2020-01'].map(date => <button key={date} aria-pressed={base === date} onClick={() => setBase(date)}>{date}</button>)}</div><div className="dollar-presets">{[false, true].map(value => <button key={String(value)} aria-pressed={real === value} onClick={() => setReal(value)}>{value ? t.real : t.nominal}</button>)}</div>
    <DriverChart series={series} dates={dates} selected={selected} onSelect={setMonth} title={`${base} = 100`} unit="Index" language={language} labels={driversCopy[language]} /><label>{t.inspect}: {selected}<input type="range" min="0" max={dates.length - 1} value={dates.indexOf(selected)} onChange={e => setMonth(dates[Number(e.target.value)])} /></label><div className="driver-readout">{series.map(s => <div key={s.id}><span>{s.name}</span><strong>{formatNumber(s.points.find(p => p.date === selected)?.value, language)}</strong></div>)}</div><p>{t.priceNote}</p><p>{t.coverageNote}</p><details className="data-table"><summary>{t.table}</summary><div tabIndex="0" role="region" aria-label={t.table}><table><thead><tr><th>{t.month}</th>{series.map(s => <th key={s.id}>{s.name}</th>)}</tr></thead><tbody>{dates.map((date, i) => <tr key={date}><th scope="row">{date}</th>{series.map(s => <td key={s.id}>{formatNumber(s.points[i].value, language)}</td>)}</tr>)}</tbody></table></div></details><div className="dollar-links">{specs.map(([id]) => <a key={id} href={`https://fred.stlouisfed.org/series/${id}`} target="_blank" rel="noreferrer">{id} ↗</a>)}</div></section></section></>
}
