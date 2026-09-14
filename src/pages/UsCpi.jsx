import React, { useState } from 'react'
import { PageIntro } from '../components/PageIntro.jsx'
import { PurchasingPower } from '../components/PurchasingPower.jsx'
import { TimeSeriesChart } from '../charts/TimeSeriesChart.jsx'
import { cpi, cpiMetadata, latestCpi } from '../data/inflation.js'
import { experience } from '../i18n/experience.js'
import { formatNumber, rangeStart } from '../utils/inflation.js'

export function UsCpi({ language }) {
  const labels = experience[language]
  const [mode, setMode] = useState('value'), [years, setYears] = useState(0)
  const points = years ? cpi.filter(point => point.date >= rangeStart(latestCpi.date, years)) : cpi
  return <><PageIntro eyebrow={labels.cpiEyebrow} title={labels.cpiTitle} description={labels.cpiDescription} />
    <section className="content-section cpi-content">
      <div className="chart-panel"><h2>{labels.cpiChartTitle}</h2>
        <div className="chart-controls"><div className="segmented-control" role="group" aria-label={labels.cpiChartTitle}>{['value', 'inflation'].map(value => <button key={value} aria-pressed={mode === value} onClick={() => setMode(value)}>{value === 'value' ? labels.indexMode : labels.inflationMode}</button>)}</div><div className="range-control" role="group" aria-label={language === 'zh' ? '时间范围' : 'Time range'}>{[1, 5, 10, 50, 0].map(value => <button key={value} aria-pressed={years === value} onClick={() => setYears(value)}>{value === 0 ? labels.all : `${value}${labels.years}`}</button>)}</div></div>
        <TimeSeriesChart key={`${mode}-${years}`} points={points} field={mode} language={language} labels={labels} title={labels.cpiChartTitle} unit={mode === 'value' ? labels.indexUnit : labels.inflationUnit} />
        <p className="data-note">{labels.chartNote}</p><p className="source-caption">{labels.source}: <a href={cpiMetadata.sourceUrl} target="_blank" rel="noreferrer">BLS / FRED · CPIAUCNS ↗</a> · {labels.retrieved}: {cpiMetadata.retrievedAt}</p>
        <details className="data-table"><summary>{labels.dataTable} ({points.length})</summary><div tabIndex="0" role="region" aria-label={labels.dataTable}><table><thead><tr><th scope="col">{labels.tableDate}</th><th scope="col">{labels.tableIndex}</th><th scope="col">{labels.tableRate}</th></tr></thead><tbody>{points.map(point => <tr key={point.date}><th scope="row">{point.date}</th><td>{formatNumber(point.value, language, 3)}</td><td>{formatNumber(point.inflation, language)}</td></tr>)}</tbody></table></div></details>
      </div><p className="scope-note">{labels.scopeNote} <a href="https://www.bls.gov/cpi/questions-and-answers.htm" target="_blank" rel="noreferrer">BLS ↗</a></p>
      <PurchasingPower labels={labels} language={language} />
    </section></>
}
