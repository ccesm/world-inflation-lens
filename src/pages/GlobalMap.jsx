import React, { lazy, Suspense, useState } from 'react'
import { PageIntro } from '../components/PageIntro.jsx'
import { CountrySelect, YearControl } from '../components/GlobalControls.jsx'
import { GlobalDataNote } from '../components/GlobalDataNote.jsx'
import { AnnualComparison, percent, seriesColors } from '../charts/AnnualComparison.jsx'
import { countries, countryById, defaultYear, getHistory, getRows, getValue, years } from '../data/globalInflation.js'
import { globalCopy } from '../i18n/global.js'

const WorldMap = lazy(() => import('../charts/WorldMap.jsx'))
function initialSelection() {
  const params = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.hash.split('?')[1])
  return { country: Object.hasOwn(countryById, params.get('country')) ? params.get('country') : 'CHN', year: years.includes(Number(params.get('year'))) ? Number(params.get('year')) : defaultYear }
}

export function GlobalMap({ language }) {
  const t = globalCopy[language]
  const [initial] = useState(initialSelection)
  const [year, setYear] = useState(initial.year)
  const [selected, setSelected] = useState(initial.country)
  const [comparison, setComparison] = useState(['CHN', 'USA', 'JPN'])
  const [candidate, setCandidate] = useState('DEU')
  const [start, setStart] = useState(2000)
  const [end, setEnd] = useState(defaultYear)
  const country = countryById[selected]
  const history = getHistory(selected).filter(point => point.value != null)
  const latest = history.at(-1)
  const high = history.reduce((best, point) => !best || point.value > best.value ? point : best, null)
  const low = history.reduce((best, point) => !best || point.value < best.value ? point : best, null)
  const count = getRows(year).filter(row => row.value != null).length
  const add = id => { if (comparison.length < 5 && !comparison.includes(id)) setComparison([...comparison, id]) }
  const download = () => {
    const rows = [['year', ...comparison], ...years.filter(y => y >= start && y <= end).map(y => [y, ...comparison.map(id => getValue(id, y) ?? '')])]
    const url = URL.createObjectURL(new Blob([rows.map(row => row.join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `worldbank-FP.CPI.TOTL.ZG-${start}-${end}.csv`; anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return <><PageIntro eyebrow={t.mapEyebrow} title={t.mapTitle} description={t.mapIntro} /><section className="content-section global-section">
    <div className="global-toolbar"><YearControl year={year} onChange={setYear} language={language} /><span className="coverage-pill">{t.coverage} <b>{count} / {countries.length}</b></span></div>
    <CountrySelect value={selected} onChange={setSelected} language={language} />
    <Suspense fallback={<div className="map-loading">{t.mapLoading}</div>}><WorldMap year={year} selected={selected} onSelect={setSelected} language={language} /></Suspense>
    <GlobalDataNote language={language} full />
    <section className="global-panel country-detail" aria-label={t.detail}>
      <div className="global-heading"><div><p className="eyebrow">{t.detail} · {selected}</p><h2>{country.name[language]}</h2></div><button className="global-button" disabled={comparison.includes(selected) || comparison.length >= 5} onClick={() => add(selected)}>{comparison.includes(selected) ? t.already : t.add} +</button></div>
      <div className="country-stat-grid">{[
        { label: `${t.selectedYear} · ${year}`, point: { value: getValue(selected, year) } },
        { label: t.latest, point: latest }, { label: t.high, point: high }, { label: t.low, point: low },
      ].map(stat => <div key={stat.label}><span>{stat.label}</span><strong>{percent(stat.point?.value, language)}</strong>{stat.point?.year && <small>{stat.point.year}</small>}</div>)}</div>
      <h3>{t.history} · {years[0]}–{years.at(-1)}</h3>
      <AnnualComparison key={selected} ids={[selected]} start={years[0]} end={years.at(-1)} language={language} title={`${country.name[language]} · ${t.history}`} />
      <GlobalDataNote language={language} />
    </section>
    <section id="country-compare" className="global-panel comparison-panel" aria-label={t.compare}>
      <div className="global-heading"><div><p className="eyebrow">02 / {t.annual}</p><h2>{t.compare}</h2><p className="global-help">{t.compareIntro}</p></div></div>
      <div className="comparison-chips">{comparison.map((id, index) => <span key={id}><i style={{ background: seriesColors[index] }} />{countryById[id].name[language]}<button disabled={comparison.length <= 2} aria-label={`${t.remove} ${countryById[id].name[language]}`} onClick={() => setComparison(comparison.filter(item => item !== id))}>×</button></span>)}</div>
      <div className="comparison-add"><CountrySelect value={candidate} onChange={setCandidate} language={language} /><button className="global-button" onClick={() => add(candidate)} disabled={comparison.length >= 5 || comparison.includes(candidate)}>{comparison.includes(candidate) ? t.already : t.add} +</button></div>
      <p className="global-help" role="status">{comparison.length >= 5 ? t.max : comparison.length <= 2 ? t.min : `${comparison.length} / 5`}</p>
      <div className="comparison-range"><label>{t.start}<select value={start} onChange={event => setStart(Number(event.target.value))}>{years.filter(y => y < end).map(y => <option key={y}>{y}</option>)}</select></label><label>{t.end}<select value={end} onChange={event => setEnd(Number(event.target.value))}>{years.filter(y => y > start).map(y => <option key={y}>{y}</option>)}</select></label><button className="global-button secondary" onClick={download}>{t.download} ↓</button></div>
      <AnnualComparison ids={comparison} start={start} end={end} language={language} title={t.compare} />
      <GlobalDataNote language={language} full />
    </section>
  </section></>
}
