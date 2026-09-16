import React, { useId, useState } from 'react'
import { transmissionSeries as series, externalDatasets } from '../data/transmission.js'
import { transmissionCopy } from '../i18n/transmission.js'
import { transmissionCsv, latestPoint, direction, changeAt, periodBefore, assessment, transmissionWindows, windowPoints } from '../utils/transmission.js'
import '../transmission.css'
import { observationStatus } from '../utils/dataStatus.js'

const format = (value, language) => Number.isFinite(value) ? value.toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US', { maximumFractionDigits: 2 }) : '—'

function download(s, points) {
  const url = URL.createObjectURL(new Blob([transmissionCsv(s, points)], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a'); a.href = url; a.download = `${s.id}-${points[0]?.date}-${points.at(-1)?.date}.csv`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export function SourceNote({ s, language, full = false }) {
  const t = transmissionCopy[language], m = s.metadata, last = latestPoint(s)
  return <div className="trans-source"><p><a href={m.sourceUrl} target="_blank" rel="noreferrer">{m.provider} · {s.id} ↗</a> · {t[s.frequency] || s.frequency} · {t.units[s.units] || s.units}<br />{t.latest}: {last?.date || '—'} · {t.snapshot}: {m.retrievedAt}<br />{s.id.startsWith('SIPRI') || s.id.startsWith('FAO') || s.id === 'GSCPI' ? t.sourceEstimate : t.observed}{s.periodBasis?.includes('year') && <> · {s.periodBasis === 'calendar_year' ? t.calendar : t.fiscalYear}</>}</p>
    {full && <details><summary>{t.methodology}</summary><p>{t.coverage}: {s.points[0]?.date} – {s.points.at(-1)?.date}<br />{t.updated}: {m.sourceUpdatedAt}<br />{t.retrieved}: {m.retrievedAt}</p><p>{m.attribution}</p><a href={m.licenseUrl || m.sourceUrl} target="_blank" rel="noreferrer">{m.license || m.provider} ↗</a>{m.methodologyUrl && <p><a href={m.methodologyUrl} target="_blank" rel="noreferrer">{t.methodology} ↗</a></p>}</details>}
  </div>
}
function Chart({ id, language, from, to, selected, band, table = true }) {
  const s = series[id], t = transmissionCopy[language], titleId = useId()
  const points = windowPoints(s, from || s.points[0].date, to || s.points.at(-1).date)
  const valid = points.filter(p => Number.isFinite(p.value)), values = valid.map(p => p.value)
  const low = Math.min(...values), high = Math.max(...values), span = high - low || Math.abs(high) * .1 || 1
  const y = value => 160 - (value - low) / span * 130, x = i => 65 + i / Math.max(1, points.length - 1) * 590
  let path = '', open = false
  points.forEach((p, i) => { if (Number.isFinite(p.value)) { path += `${open ? 'L' : 'M'}${x(i)},${y(p.value)} `; open = true } else open = false })
  const picked = points.find(p => p.date === selected), pickIndex = points.findIndex(p => p.date === selected)
  const context = band ? [{ id: '', dates: band }] : ['GPR','GPRT','GPRA','GSCPI'].includes(id) ? [
    {id:'1990',dates:['1990-08','1991-02']},{id:'2008',dates:['2008-01','2008-12']},{id:'2020',dates:['2020-03','2022-12']},{id:'2022',dates:['2022-02','2022-12']},
  ] : []
  const bands = context.map(b => ({...b, indices:points.map((p,i)=>p.date>=b.dates[0]&&p.date<=b.dates[1]?i:-1).filter(i=>i>=0)})).filter(b=>b.indices.length)
  return <article className="trans-chart" data-series={id}><h3 id={titleId}>{t.names[id]}</h3><p>{t.units[s.units] || s.units}{selected && <> · {selected}: <strong>{format(picked?.value, language)}</strong></>}</p>
    {valid.length ? <svg viewBox="0 0 700 210" role="img" aria-labelledby={titleId}>
      {bands.map((b,i) => <rect key={i} x={x(b.indices[0])} y="20" width={Math.max(2, x(b.indices.at(-1)) - x(b.indices[0]))} height="150" className="trans-band"><title>{t.episodes[b.id] || t.causal}</title></rect>)}
      {[low, low + span / 2, low + span].map((v, i) => <g key={i}><line x1="65" x2="655" y1={y(v)} y2={y(v)} className="trans-gridline" /><text x="58" y={y(v) + 4} textAnchor="end">{v.toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US', { notation: 'compact', maximumFractionDigits: 1 })}</text></g>)}
      <path d={path} fill="none" className="trans-line" />
      {pickIndex >= 0 && <line x1={x(pickIndex)} x2={x(pickIndex)} y1="20" y2="170" className="trans-cursor" />}
      <text x="65" y="195">{points[0]?.date}</text><text x="655" y="195" textAnchor="end">{points.at(-1)?.date}</text>
    </svg> : <p className="trans-empty">{t.unavailable}</p>}
    {selected && !Number.isFinite(picked?.value) && <p>{t.unavailable}: {selected}</p>}
    {!band && bands.length > 0 && <p className="trans-source">{language === 'zh' ? '阴影为历史背景，并非因果归属：' : 'Shaded historical context, not causal attribution: '}{bands.map(b=>`${t.episodes[b.id]} (${b.dates.join(' – ')})`).join(' · ')}</p>}
    <SourceNote s={s} language={language} full />
    {table && <details className="data-table"><summary>{t.table} · {t.csv}</summary><button type="button" onClick={() => download(s, points)}>{t.csv}</button><div role="region" aria-label={t.names[id]} tabIndex="0"><table><thead><tr><th>{t.month}</th><th>{t.units[s.units] || s.units}</th></tr></thead><tbody>{points.map(p => <tr key={p.date}><th scope="row">{p.date}</th><td>{format(p.value, language)}{p.value === null ? ` · ${t.noValue}` : ''}</td></tr>)}</tbody></table></div></details>}
  </article>
}
function RangeCharts({ ids, language, ranges = [1, 5, 10, 25], children }) {
  const t = transmissionCopy[language], [range, setRange] = useState('5')
  const to = ids.map(id => series[id].points.at(-1).date).sort().at(-1)
  const from = range === 'full' ? series[ids[0]].points[0].date : periodBefore(to, Number(range) * 12 - 1)
  const [month, setMonth] = useState(to), selected = month < from || month > to ? to : month
  const dates = windowPoints(series[ids[0]], from, to)
  return <><div className="trans-controls"><label>{t.range}<select value={range} onChange={e => setRange(e.target.value)}>{ranges.map(n => <option key={n} value={n}>{n}{language === 'zh' ? '年' : 'Y'}</option>)}<option value="full">{t.full}</option></select></label><label>{t.month}<input type="month" min={from} max={to} value={selected} onChange={e => setMonth(e.target.value)} /></label></div>
    <input className="trans-slider" aria-label={t.month} type="range" min="0" max={dates.length - 1} value={dates.findIndex(p => p.date === selected)} onChange={e => setMonth(dates[Number(e.target.value)].date)} />
    {children}{ids.map(id => <Chart key={id} id={id} language={language} from={from} to={to} selected={selected} />)}</>
}
export function TransmissionMonitor({ language }) {
  const t = transmissionCopy[language], result = assessment(series)
  const groups = [['GPR'], ['GPRT', 'GPRA'], ['SIPRI_US_GDP'], ['GSCPI'], ['oil', 'energy'], ['FAO_FOOD', 'food']]
  return <><section className="ia-section"><h2>{t.title}</h2><p>{t.question}</p><div className="ia-grid three trans-cards">{groups.map((ids, i) => <article key={i}><h3>{t.cards[i]}</h3>{ids.map(id => { const d = direction(series[id]); return <div key={id}><p>{t.names[id]}<br /><strong>{format(d.latest?.value, language)}</strong> · {t[d.label]}</p><SourceNote s={series[id]} language={language} /></div> })}</article>)}</div><details><summary>{t.rules}</summary><p>{t.direction}</p></details></section>
    <section className="ia-section"><h2>{t.chainTitle}</h2><p>{t.chainNote}</p><ol className="trans-chain">{t.stages.map((stage, i) => <li key={stage}><strong>{stage}</strong><p>{t.chainLabels[i]}</p><a href={['#/external-shocks?topic=geopolitical', '#/external-shocks?topic=supply-chain', '#/drivers', '#/monitor', '#/purchasing-power'][i]}>{t.exists} →</a>{i === 3 && <p>{t.planned}</p>}</li>)}</ol><p>{t.expectation}</p></section>
    <section className="ia-section"><h2>{t.distinction}</h2><div className="ia-grid three">{t.columns.map((title, i) => <article key={title}><h3>{title}</h3><p>{t.columnItems[i]}</p></article>)}</div></section>
    <section className="ia-section trans-assessment"><h2>{t.summary}</h2><p>{result.date} · {t.messages[result.code]}</p><ul>{result.evidence.map(e => <li key={e.id}>{t.names[e.id]}: {format(e.value, language)} · Δ {format(e.change, language)} · {t.units[series[e.id].units]}</li>)}</ul><details><summary>{t.rules}</summary><p>{t.rulesText}</p></details></section></>
}
export function GprPanel({ language }) { const t = transmissionCopy[language]; return <section className="ia-section"><h2>{t.gprTitle}</h2><p>{t.gprNote}</p><RangeCharts ids={['GPR', 'GPRT', 'GPRA']} language={language} /></section> }
export function MilitaryPanel({ language }) {
  const t = transmissionCopy[language], [id, setId] = useState('SIPRI_US_GDP'), [year, setYear] = useState(() => latestPoint(series.SIPRI_US_GDP).date), s = series[id]
  const real = series[id === 'SIPRI_WORLD_REAL' ? id : 'SIPRI_US_REAL']
  return <section className="ia-section"><h2>{t.militaryTitle}</h2><p>{t.militaryNote}</p><p>{t.militaryBasis}</p><div className="trans-controls"><label>{t.metric}<select value={id} onChange={e => {setId(e.target.value); if (year < series[e.target.value].points[0].date) setYear(series[e.target.value].points[0].date)}}>{['SIPRI_US_GDP', 'SIPRI_US_GOV', 'SIPRI_US_REAL', 'SIPRI_WORLD_REAL'].map(key => <option key={key} value={key}>{t.names[key]}</option>)}</select></label><label>{t.month}<select value={year} onChange={e => setYear(e.target.value)}>{s.points.map(p => <option key={p.date}>{p.date}</option>)}</select></label></div><p>{t.fiveYear} · {t.names[real.id]} · {year}: <strong>{format(changeAt(real, year, 5, true), language)}%</strong></p><Chart id={id} language={language} selected={year} /><p>{t.globalMissing}</p><a className="ia-more" href="#/fiscal">{t.fiscal} →</a></section>
}
export function SupplyPanel({ language }) { const t = transmissionCopy[language]; return <section className="ia-section"><h2>{t.supplyTitle}</h2><p>{t.supplyNote}</p><ol className="trans-chain">{t.supplyPath.map(p => <li key={p}>{p}</li>)}</ol><p>{t.causal}</p><RangeCharts ids={['GSCPI']} ranges={[1, 5, 10]} language={language} /><HistoryLab language={language} ids={['GPR', 'GSCPI', 'oil']} /></section> }
export function FoodPanel({ language }) {
  const t = transmissionCopy[language], [id, setId] = useState('FAO_FOOD'), s = series[id], latest = latestPoint(s), high = s.points.reduce((a, b) => b.value !== null && (!a || b.value > a.value) ? b : a, null)
  return <section className="ia-section"><h2>{t.foodTitle}</h2><p>{t.faoNote}</p><label>{t.component}<select value={id} onChange={e => setId(e.target.value)}>{['FAO_FOOD', 'FAO_CEREALS', 'FAO_OILS', 'FAO_DAIRY', 'FAO_MEAT', 'FAO_SUGAR'].map(key => <option key={key} value={key}>{t.names[key]}</option>)}</select></label><div className="trans-stats"><p>{t.latest}: <strong>{format(latest.value, language)}</strong> · {latest.date}</p><p>{t.mom}: {format(changeAt(s, latest.date, 1, true), language)}</p><p>{t.yoy}: {format(changeAt(s, latest.date, 12, true), language)}</p><p>{t.high}: {format(high.value, language)} · {high.date}</p></div><RangeCharts ids={[id, 'food']} language={language} /></section>
}
export function HistoryLab({ language, ids = ['GPR', 'GPRT', 'GPRA', 'GSCPI', 'oil', 'FAO_FOOD', 'energy', 'food', 'headline', 'rates'] }) {
  const t = transmissionCopy[language], [episode, setEpisode] = useState('2022'), [month, setMonth] = useState('2022-02')
  const last = latestPoint(series.GPR).date, w = transmissionWindows.find(w => w.id === episode) || { from: periodBefore(last, 59), to: last }
  const selected = month >= w.from && month <= w.to ? month : w.from, dates = windowPoints(series.GPR, w.from, w.to)
  const bands = { '1973': ['1973-10', '1974-03'], '1990': ['1990-08', '1991-02'], '2008': ['2008-01', '2008-12'], '2020': ['2020-03', '2022-12'], '2022': ['2022-02', '2022-12'] }
  return <section className="trans-lab"><h2>{t.labTitle}</h2><p>{t.labNote}</p><div className="trans-controls"><label>{t.episode}<select value={episode} onChange={e => setEpisode(e.target.value)}>{[...transmissionWindows.map(w => w.id), 'recent'].map(id => <option key={id} value={id}>{t.episodes[id]}</option>)}</select></label><label>{t.month}<input type="month" min={w.from} max={w.to} value={selected} onChange={e => setMonth(e.target.value)} /></label></div><input className="trans-slider" type="range" aria-label={t.month} min="0" max={dates.length - 1} value={dates.findIndex(p => p.date === selected)} onChange={e => setMonth(dates[Number(e.target.value)].date)} /><p>{t.episodes[episode]} · {w.from} – {w.to}{bands[episode] && <> · {language === 'zh' ? '背景区间' : 'Context band'}: {bands[episode].join(' – ')}</>}</p>{ids.map(id => <Chart key={id} id={id} language={language} from={w.from} to={w.to} selected={selected} band={bands[episode]} />)}</section>
}
export function ExternalDataHealth({ language, history }) {
  const t = transmissionCopy[language]
  return <section className="ia-section"><h2>{language === 'zh' ? '外部冲击数据来源与健康状态' : 'External shocks · sources and data health'}</h2><div className="health-grid">{externalDatasets.map(d => { const m = d.metadata, health = observationStatus(d.series[0].observations, m.frequency), revisions = history.runs.flatMap(r => r.changes).filter(c => d.series.some(s => s.id === c.id)).reduce((n, c) => n + c.revised, 0); return <article className="health-card" key={m.id}><h3>{m.provider}</h3><p>{t.snapshot}: {m.retrievedAt}</p><p>{health.old ? (language === 'zh' ? '观测较旧，请检查来源' : 'Older observation; check source') : t.exists}</p><p>{t.updated}: {m.sourceUpdatedAt} · {t[m.frequency]}</p><p>{t.revisions}: {revisions} ({language === 'zh' ? '保留的站点更新记录' : 'retained site update history'})</p>{m.sourceVintageComparison && <p>{language === 'zh' ? '来源版本间修订（区别于站点首次导入）' : 'Source-vintage revisions (distinct from initial site import)'}: {m.sourceVintageComparison.revised} · {m.sourceVintageComparison.from} → {m.sourceVintageComparison.to}</p>}<p>{m.version}</p>{d.series.map(s => <div key={s.id}><h4>{t.names[s.id]}</h4><p>{t.coverage}: {s.coverage.start} – {s.coverage.end}<br />{t.latest}: {s.observations.findLast(p => p.value !== null)?.date}<br />{t.noValue}: {s.observations.filter(p => p.value === null).length} / {s.observations.length}</p><SourceNote s={series[s.id]} language={language} /></div>)}<p>{m.attribution}</p><a href={m.licenseUrl}>{m.license} ↗</a></article> })}</div></section>
}
