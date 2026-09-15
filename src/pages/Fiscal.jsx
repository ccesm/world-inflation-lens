import React, { useEffect, useState } from 'react'
import cbo from '../../data/fiscal/cbo-2026-02.json'
import { iaCopy } from '../i18n/architecture.js'
import { CboOutlook } from '../components/CboOutlook.jsx'
import { cboCopy } from '../i18n/cbo.js'
import { PageIntro } from '../components/PageIntro.jsx'
import { dollarCopy } from '../i18n/dollar.js'
import { monitorRaw } from '../data/monitor.js'
import { debtPath } from '../utils/dollar.js'
import { formatNumber } from '../utils/inflation.js'

function DebtPlot({ points, label, dashed = false }) {
  const [compact, setCompact] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(max-width: 600px)')
    const update = () => setCompact(query.matches)
    update(); query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  const width = compact ? 440 : 1000
  const lo = Math.min(0, ...points.map(p => p.value)), hi = Math.max(1, ...points.map(p => p.value)), span = hi - lo
  const x = i => 50 + i / Math.max(1, points.length - 1) * (width - 100), y = v => 250 - (v - lo) / span * 220
  return <svg className="debt-plot" viewBox={`0 0 ${width} 290`} role="img" aria-label={label}><line className="series-zero" x1="50" x2={width - 50} y1={y(0)} y2={y(0)} /><path d={points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.value)}`).join(' ')} fill="none" stroke="var(--global-accent)" strokeWidth="3" strokeDasharray={dashed ? '8 5' : undefined} />{[0, Math.floor((points.length - 1) / 2), points.length - 1].filter((v, i, a) => a.indexOf(v) === i).map(i => <g key={i}><text x={x(i)} y="280" textAnchor="middle" fill="var(--global-muted)">{points[i].year}</text><text x={x(i)} y={Math.max(15, y(points[i].value) - 10)} textAnchor="middle" fill="var(--global-text)">{points[i].value.toFixed(1)}%</text></g>)}</svg>
}
export function Fiscal({ language }) {
  const t = dollarCopy[language], a = iaCopy[language], latest = cbo.observations.findLast(p => p.status === 'actual')
  const [inputs, setInputs] = useState({ debt: '101', rate: '4', growth: '4', primary: '2', years: '30' })
  const bounds = { debt: [0, 300], rate: [0, 20], growth: [-5, 20], primary: [-10, 15], years: [1, 50] }
  const valid = Object.entries(inputs).every(([key, value]) => value.trim() && Number.isFinite(Number(value)) && Number(value) >= bounds[key][0] && Number(value) <= bounds[key][1]) && Number.isInteger(Number(inputs.years))
  const scenario = valid ? debtPath(Object.fromEntries(Object.entries(inputs).map(([key, value]) => [key, Number(value)]))) : []
  const history = monitorRaw.FYPUGDA188S.observations.filter(p => p.value !== null && p.date >= '1940').map(p => ({ year: Number(p.date.slice(0, 4)), value: p.value }))
  const presets = [
    { zh: '财政整顿', en: 'Consolidation', primary: '-1', growth: '4', rate: '4' },
    { zh: '较高名义增长', en: 'Higher nominal growth', primary: '2', growth: '6', rate: '4' },
    { zh: '较高融资成本', en: 'Higher financing cost', primary: '2', growth: '4', rate: '6' },
  ]
  return <><PageIntro eyebrow="DOLLAR / FISCAL" title={a.fiscalTitle} description={a.fiscalIntro} /><section className="content-section global-section dollar-section"><section className="ia-section"><h2>{a.now}</h2><p>{a.fiscalNow}</p><div className="ia-grid three">{['debt', 'deficit', 'interest'].map(id => <article key={id}><h3>{cboCopy[language][id]}</h3><strong>{formatNumber(latest[id], language, 2)}%</strong><p>{latest.year} · {cboCopy[language].actual} · % GDP</p></article>)}</div><a className="ia-source" href={cbo.metadata.historicalCsv} target="_blank" rel="noreferrer">CBO · {cbo.metadata.vintage} ↗</a></section><section id="fiscal-outlook" className="ia-section"><h2>{a.projected}</h2><CboOutlook language={language} /></section><section className="ia-section"><h2>{a.meaning}</h2><p>{a.fiscalMeaning}</p><p>{t.tension}</p><a className="ia-more" href="#/monitor?group=monetary">{a.nav.dollar} →</a></section><details className="dollar-panel"><summary>{cboCopy[language].earlier}</summary><p className="eyebrow">{t.observed}</p><h2>{language === 'zh' ? '公众持有债务 / GDP' : 'Debt held by the public / GDP'}</h2><DebtPlot points={history} label={t.debt} /><p className="global-help">{language === 'zh' ? 'FRED / OMB 序列，使用日历年 GDP 分母。与上方 CBO 财年预测口径可能不同，两者不拼接。' : 'FRED / OMB series with calendar-year GDP. This can differ from the CBO fiscal-year convention above; the series are not spliced.'}</p><a href={monitorRaw.FYPUGDA188S.sourceUrl} target="_blank" rel="noreferrer">FYPUGDA188S ↗</a><details className="data-table"><summary>{t.table}</summary><div><table><tbody>{history.map(p => <tr key={p.year}><th>{p.year}</th><td>{formatNumber(p.value, language)}%</td></tr>)}</tbody></table></div></details></details>
    <section id="fiscal-model" className="dollar-panel"><p className="eyebrow">{t.assumptions}</p><h2>{t.engineTitle}</h2><div className="dollar-presets">{presets.map(p => <button key={p.en} onClick={() => setInputs(current => ({ ...current, primary: p.primary, growth: p.growth, rate: p.rate }))}>{p[language]}</button>)}</div><div className="dollar-inputs">{Object.keys(inputs).map(key => <label key={key}>{t[key]}<input type="number" min={bounds[key][0]} max={bounds[key][1]} step={key === 'years' ? 1 : '.1'} value={inputs[key]} onInput={e => { const value = e.currentTarget.value; setInputs(current => ({ ...current, [key]: value })) }} onChange={e => { const value = e.target.value; setInputs(current => ({ ...current, [key]: value })) }} /></label>)}</div>
    {scenario.length ? <><p>{t.debtResult}: <strong>{formatNumber(scenario.at(-1).value, language)}%</strong></p><DebtPlot points={scenario} label={t.assumptions} dashed /><details className="data-table"><summary>{t.table}</summary><div><table><thead><tr><th>{t.years}</th><th>{t.debt}</th></tr></thead><tbody>{scenario.map(p => <tr key={p.year}><th>{p.year}</th><td>{formatNumber(p.value, language)}%</td></tr>)}</tbody></table></div></details></> : <p role="alert">{t.engineInvalid}</p>}<p className="global-help">{t.engineNote}</p></section></section></>
}
