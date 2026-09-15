import React, { useState } from 'react'
import { PageIntro } from '../components/PageIntro.jsx'
import { dollarCopy } from '../i18n/dollar.js'
import { futurePower } from '../utils/dollar.js'
import { formatNumber } from '../utils/inflation.js'

export function ScenarioCalculator({ language, compact = false }) {
  const t = dollarCopy[language]
  const [amount, setAmount] = useState(compact ? '100000' : '1000000'), [rate, setRate] = useState('3'), [years, setYears] = useState('30')
  const valid = [amount, rate, years].every(v => v.trim() && Number.isFinite(Number(v))) && Number(amount) >= 0 && Number(amount) <= 1e12 && Number(rate) >= -5 && Number(rate) <= 20 && Number.isInteger(Number(years)) && Number(years) >= 1 && Number(years) <= 50
  const remaining = valid ? futurePower(Number(amount), Number(rate), Number(years)) : null
  const needed = valid ? Number(amount) * (1 + Number(rate) / 100) ** Number(years) : null
  return <div className="dollar-panel scenario-calculator"><p className="eyebrow">{t.assumptions}</p><div className="dollar-inputs">{[[t.amount, amount, setAmount, 0, 1e12, 'any'], [t.inflation, rate, setRate, -5, 20, '.1'], [t.years, years, setYears, 1, 50, '1']].map(([label, value, set, min, max, step]) => <label key={label}>{label}<input type="number" value={value} min={min} max={max} step={step} onChange={e => set(e.target.value)} onInput={e => set(e.currentTarget.value)} /></label>)}</div><div className="dollar-presets" role="group" aria-label={t.years}>{[10, 20, 30].map(n => <button key={n} aria-pressed={Number(years) === n} onClick={() => setYears(String(n))}>{n} {t.years}</button>)}</div>
    {!valid ? <p role="alert">{t.invalid}</p> : <><div className="dollar-grid scenario-results" aria-live="polite"><article><p>{t.result}</p><strong>${formatNumber(remaining, language, 0)}</strong></article><article><p>{t.equivalent}</p><strong>${formatNumber(needed, language, 0)}</strong></article></div><h3>{t.presets}</h3><div className="scenario-bars">{[2, 3, 4, 5, 7].map(r => { const share = futurePower(100, r, Number(years)); return <div key={r}><button onClick={() => setRate(String(r))} aria-pressed={Number(rate) === r}>{r}%</button><div><span style={{ width: `${share}%` }} /></div><strong>${formatNumber(futurePower(Number(amount), r, Number(years)), language, 0)}</strong></div> })}</div>{!compact && <div className="data-table"><table><thead><tr><th>{t.inflation}</th>{[10, 20, 30].map(y => <th key={y}>{y} {t.after}</th>)}</tr></thead><tbody>{[2, 3, 4, 5, 7].map(r => <tr key={r}><th scope="row">{r}%</th>{[10, 20, 30].map(y => <td key={y}>${formatNumber(futurePower(Number(amount), r, y), language, 0)}</td>)}</tr>)}</tbody></table></div>}</>}
    <p className="global-help">{t.scenarioNote}</p></div>
}

export function Scenarios({ language }) {
  const t = dollarCopy[language]
  return <><PageIntro eyebrow={t.assumptions} title={t.scenarioTitle} description={t.scenarioDesc} /><section className="content-section global-section dollar-section"><ScenarioCalculator language={language} /><a href="#/fiscal?focus=model">{language === 'zh' ? '查看债务情景模型' : 'Explore the debt scenario model'} →</a></section></>
}
