import React, { useState } from 'react'
import { cpi, latestCpi } from '../data/inflation.js'
import { equivalentCost, formatNumber } from '../utils/inflation.js'
import { Eyebrow } from './Eyebrow.jsx'

const values = new Map(cpi.map(point => [point.date, point.value]))
const years = [...new Set(cpi.map(point => point.date.slice(0, 4)))]

function MonthPicker({ label, value, onChange, language }) {
  const year = value.slice(0, 4), month = value.slice(5)
  const months = cpi.filter(point => point.date.startsWith(year)).map(point => point.date.slice(5))
  return <fieldset className="month-picker"><legend>{label}</legend><div>
    <select aria-label={`${label} · ${language === 'zh' ? '年份' : 'year'}`} value={year} onChange={event => {
      const next = `${event.target.value}-${month}`
      onChange(next > latestCpi.date ? latestCpi.date : next)
    }}>{years.map(item => <option value={item} key={item}>{item}</option>)}</select>
    <select aria-label={`${label} · ${language === 'zh' ? '月份' : 'month'}`} value={month} onChange={event => onChange(`${year}-${event.target.value}`)}>{months.map(item => <option key={item} value={item}>{item}</option>)}</select>
  </div></fieldset>
}
export function PurchasingPower({ labels, language }) {
  const [amount, setAmount] = useState('100'), [start, setStart] = useState(cpi[0].date), [end, setEnd] = useState(latestCpi.date)
  const valid = amount.trim() !== '' && start <= end && start >= cpi[0].date && end <= latestCpi.date
  const cost = valid ? equivalentCost(Number(amount), values.get(start), values.get(end)) : null
  const remaining = valid ? equivalentCost(Number(amount), values.get(end), values.get(start)) : null
  return <section className="purchasing-power" id="purchasing-power">
    <Eyebrow>{labels.calculatorEyebrow}</Eyebrow><h2>{labels.calculatorTitle}</h2>
    <div className="calculator-inputs">
      <label>{labels.amount}<input type="number" min="0" step="any" value={amount} onChange={event => setAmount(event.target.value)} /></label>
      <MonthPicker label={labels.start} value={start} onChange={setStart} language={language} />
      <MonthPicker label={labels.end} value={end} onChange={setEnd} language={language} />
    </div>
    <div className="calculator-results" aria-live="polite">{cost == null ? <p role="status">{labels.invalidDates}</p> : <><div><span>{labels.equivalent} · {end}</span><strong>${formatNumber(cost, language)}</strong></div><div><span>{labels.remaining}</span><strong>${formatNumber(remaining, language)}</strong></div></>}</div>
    <p className="data-note">{labels.calculatorNote}</p>
  </section>
}
