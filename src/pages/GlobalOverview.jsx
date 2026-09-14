import React, { useState } from 'react'
import { PageIntro } from '../components/PageIntro.jsx'
import { YearControl } from '../components/GlobalControls.jsx'
import { GlobalDataNote } from '../components/GlobalDataNote.jsx'
import { percent } from '../charts/AnnualComparison.jsx'
import { countries, defaultYear, getRows, getValue, countryById } from '../data/globalInflation.js'
import { rankRows } from '../utils/globalInflation.js'
import { globalCopy } from '../i18n/global.js'

export function GlobalOverview({ language }) {
  const t = globalCopy[language]
  const [year, setYear] = useState(defaultYear)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('desc')
  const ranked = rankRows(getRows(year))
  const ordered = sort === 'desc' ? ranked : [...ranked].reverse()
  const rows = ordered.map((row, index) => ({ ...row, rank: index + 1 })).filter(row => `${row.id} ${row.iso2} ${row.name.zh} ${row.name.en}`.toLowerCase().includes(search.trim().toLowerCase()))
  const link = id => `#/map?country=${id}&year=${year}`
  const change = id => {
    const value = getValue(id, year), previous = getValue(id, year - 1)
    if (value == null || previous == null) return t.noData
    const delta = value - previous
    return `${delta > 0 ? '+' : ''}${new Intl.NumberFormat(language, { maximumFractionDigits: 2 }).format(delta)} ${t.pp}`
  }
  return <><PageIntro eyebrow={t.eyebrow} title={t.title} description={t.intro} /><section className="content-section global-section">
    <YearControl year={year} onChange={setYear} language={language} />
    <div className="overview-metrics"><div><span>{t.available} · {year}</span><strong>{ranked.length}<small> / {countries.length}</small></strong><p>{t.economies}</p></div><div><span>{t.missing} · {year}</span><strong>{countries.length - ranked.length}</strong><p>{t.economies}</p></div><a href={link('CHN')}><span>{t.snapshot}</span><strong>{year} <small>↗</small></strong><p>{t.explore}</p></a></div>
    <GlobalDataNote language={language} full />
    <div className="global-heading"><h2>{t.major}</h2><span className="global-help">{t.annual} · {year}</span></div>
    <div className="major-grid">{['USA', 'CHN', 'JPN', 'DEU', 'IND', 'BRA'].map(id => <a key={id} href={link(id)} className="major-card"><span>{countryById[id].name[language]} <small>{id} ↗</small></span><strong>{percent(getValue(id, year), language)}</strong><p>{t.change}<br /><b>{change(id)}</b></p></a>)}</div>
    <section className="global-panel"><div className="global-heading"><h2>{t.ranking}</h2><span>{year} · {ranked.length} {t.economies}</span></div>
      <div className="ranking-controls"><label>{t.search}<input type="search" value={search} onChange={event => setSearch(event.target.value)} /></label><label>{t.ranking}<select value={sort} onChange={event => setSort(event.target.value)}><option value="desc">{t.highest}</option><option value="asc">{t.lowest}</option></select></label></div>
      <p className="global-help">{t.rankingNote}</p>
      <div className="ranking-table" tabIndex="0" role="region" aria-label={t.ranking}><table><caption>{t.annual} · {year}</caption><thead><tr><th scope="col">{t.rank}</th><th scope="col">{t.country}</th><th scope="col">{t.rate}</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td>{row.rank}</td><th scope="row"><a href={link(row.id)}>{row.name[language]} <small>{row.id} ↗</small></a></th><td>{percent(row.value, language)}</td></tr>)}</tbody></table>{!rows.length && <p className="empty-state">{t.noResults}</p>}</div>
      <GlobalDataNote language={language} />
    </section>
  </section></>
}
