import React, { useEffect, useState } from 'react'
import { ChartShare } from '../components/ChartShare.jsx'
import { driverHash, readDriverLink } from '../utils/driverLinks.js'
import { PageIntro } from '../components/PageIntro.jsx'
import { DriverChart } from '../charts/DriverChart.jsx'
import { driverSeries, driverTopics, topicKeys, driverStart, driverEnd } from '../data/drivers.js'
import { driverEpisodes } from '../data/driverEpisodes.js'
import { driversCopy } from '../i18n/drivers.js'
import { alignMonthly, monthsBetween, monthlyCsv } from '../utils/drivers.js'
import { formatNumber } from '../utils/inflation.js'

const colors = { headline: '#c46b46', food: '#409989', energy: '#8f87cf', rates: '#4499b5', oil: '#be993e', housing: '#409989', wages: '#8f87cf', money: '#4499b5' }
function initialSettings() {
  return readDriverLink(window.location.hash, { topics: driverTopics, episodes: driverEpisodes, earliest: driverSeries.headline.points[0].date, latest: driverEnd })
}

export function Drivers({ language }) {
  const t = driversCopy[language]
  const [initial] = useState(initialSettings)
  const [topic, setTopic] = useState(initial.topic)
  const [episode, setEpisode] = useState(initial.episode || null)
  const [from, setFrom] = useState(initial.from), [to, setTo] = useState(initial.to)
  const [month, setMonth] = useState(initial.month)
  const topicStart = driverSeries[topic].points.find(p => p.value !== null)?.date || driverStart
  const earliest = driverSeries.headline.points[0].date
  const valid = /^\d{4}-(0[1-9]|1[0-2])$/.test(from) && /^\d{4}-(0[1-9]|1[0-2])$/.test(to) && from >= earliest && to <= driverEnd && from < to
  const dates = valid ? monthsBetween(from, to) : []
  const selected = valid ? (month < from ? from : month > to ? to : month) : ''
  const selectedIndex = dates.indexOf(selected)
  const shareHash = driverHash({ topic, from, to, month: selected, episode })
  useEffect(() => {
    if (valid) window.history.replaceState(null, '', shareHash)
  }, [shareHash, valid])
  const series = alignMonthly(topicKeys[topic].map(key => ({ ...driverSeries[key], key, name: t.series[key], color: colors[key] })), dates)
  const rateSeries = series.filter(s => s.key !== 'oil')
  const oilSeries = series.filter(s => s.key === 'oil')
  const valueLabel = (s, value) => value == null ? t.noData : `${formatNumber(value, language)} ${s.key === 'oil' ? t.units.oil : '%'}`
  const changeTopic = next => {
    setTopic(next)
  }
  const chooseEpisode = item => { setEpisode(item); setFrom(item.from); setTo(item.to); setMonth(item.end) }
  const chooseRange = count => {
    const start = count ? `${Number(driverEnd.slice(0, 4)) - count}${driverEnd.slice(4)}` : topicStart
    setFrom(start < topicStart ? topicStart : start); setTo(driverEnd); setMonth(driverEnd); setEpisode(null)
  }
  const download = () => {
    const url = URL.createObjectURL(new Blob([monthlyCsv(series, dates)], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `US-inflation-drivers-${topic}-${from}-${to}.csv`; anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return <><PageIntro eyebrow={t.eyebrow} title={t.title} description={t.description} /><section className="content-section global-section drivers-section">
    <p className="drivers-scope">{t.scope}</p>
    <div className="drivers-tabs" role="group" aria-label={t.read}>{driverTopics.map((key, index) => <button key={key} onClick={() => changeTopic(key)} aria-pressed={topic === key}><small>0{index + 1}</small>{t.topics[key]}</button>)}</div>
    <section className="driver-explanation"><h2>{t.questions[topic]}</h2><p>{t.explanations[topic]}</p><strong>{t.lessons[topic]}</strong><div className="driver-citations">{t.topicSources[topic].map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.name} ↗</a>)}</div></section>
    <section className="driver-history" aria-label={t.history}><div className="global-heading"><h2>{t.history}</h2></div><p className="global-help">{t.historyNote}</p><div className="episode-buttons">{driverEpisodes.map(item => <button key={item.id} onClick={() => chooseEpisode(item)} aria-pressed={episode?.id === item.id}>{t.episodes[item.id]}</button>)}</div>
      {episode && <article className="driver-episode" aria-live="polite"><div><p className="eyebrow">{t.shaded} · {episode.start}–{episode.end}</p><h3>{episode.chapter[language].title}</h3><p>{episode.chapter[language].description}</p><p>{episode.chapter[language].lesson}</p><div className="driver-citations"><a href={(episode.source || episode.chapter.source).url} target="_blank" rel="noreferrer">{(episode.source || episode.chapter.source).name} ↗</a><a href={`#/timeline?year=${episode.chapter.start}`}>{t.backHistory} →</a></div></div><button className="global-button secondary" onClick={() => setEpisode(null)}>{t.clearEpisode}</button></article>}
    </section>
    <section className="global-panel driver-workbench" aria-label={t.dates}>
      <div className="global-heading"><h2>{t.topics[topic]} × CPI</h2><span>{t.monthly}</span></div>
      <div className="driver-date-controls"><label>{t.from}<input aria-label={t.from} type="month" min={earliest} max={driverEnd} value={from} onInput={event => setFrom(event.currentTarget.value)} onChange={event => setFrom(event.target.value)} /></label><label>{t.to}<input aria-label={t.to} type="month" min={earliest} max={driverEnd} value={to} onInput={event => setTo(event.currentTarget.value)} onChange={event => setTo(event.target.value)} /></label><div className="range-control">{[5, 10, 50, null].map(count => <button key={count || 'all'} onClick={() => chooseRange(count)}>{count ? `${count}Y` : t.all}</button>)}</div></div>
      {!valid ? <p role="alert" className="driver-date-error">{t.dateError}</p> : <>
        {episode && (episode.end < from || episode.start > to) && <p className="global-help">{t.outside}</p>}
        <div className="driver-inspect"><label>{t.inspect}<input aria-label={t.inspect} type="month" min={from} max={to} value={selected} onInput={event => { if (dates.includes(event.currentTarget.value)) setMonth(event.currentTarget.value) }} onChange={event => { if (dates.includes(event.target.value)) setMonth(event.target.value) }} /></label><div><button className="global-button secondary" disabled={selectedIndex === 0} onClick={() => setMonth(dates[selectedIndex - 1])} aria-label={t.previous}>←</button><button className="global-button secondary" disabled={selectedIndex === dates.length - 1} onClick={() => setMonth(dates[selectedIndex + 1])} aria-label={t.next}>→</button></div><input type="range" min="0" max={dates.length - 1} value={selectedIndex} onChange={event => setMonth(dates[Number(event.target.value)])} aria-label={t.inspect} aria-valuetext={selected} /></div>
        <div className="driver-readout" aria-live="polite">{series.map(s => <div key={s.id}><span><i style={{ background: s.color }} />{s.name}</span><strong>{valueLabel(s, s.points[selectedIndex]?.value)}</strong><small>{selected}</small></div>)}</div>
        {series.filter(s => s.points.every(p => p.value === null)).map(s => <p className="driver-unavailable global-help" key={s.id}>{s.name}: {t.noWindow}</p>)}
        <DriverChart series={rateSeries} dates={dates} selected={selected} onSelect={setMonth} title={topic === 'rates' ? t.rateAxis : ['wages', 'money'].includes(topic) ? t.growthAxis : t.yoy} unit="%" language={language} labels={t} episode={episode} />
        {oilSeries.length > 0 && <><DriverChart series={oilSeries} dates={dates} selected={selected} onSelect={setMonth} title={t.oilTitle} unit={t.units.oil} language={language} labels={t} episode={episode} /><p className="global-help">{t.oilNote}</p></>}
        <details className="data-table driver-data"><summary>{t.chartData} · {from}–{to}</summary><div tabIndex="0" role="region" aria-label={t.chartData}><table><caption>{t.monthly} · {t.topics[topic]}</caption><thead><tr><th scope="col">{t.inspect}</th>{series.map(s => <th scope="col" key={s.id}>{s.name}<br />{s.key === 'oil' ? t.units.oil : '%'}</th>)}</tr></thead><tbody>{dates.map((date, index) => <tr key={date}><th scope="row">{date}</th>{series.map(s => <td key={s.id}>{valueLabel(s, s.points[index].value)}</td>)}</tr>)}</tbody></table></div></details>
        <button className="global-button secondary driver-download" onClick={download}>{t.download} ↓</button>
        <ChartShare hash={shareHash} language={language} />
      </>}
      <div className="global-data-note"><p>{t.formula}</p><p>{t.caution}</p></div>
      <div className="driver-source-list">{series.map(s => <p key={s.id}><a href={s.metadata.sourceUrl} target="_blank" rel="noreferrer">{s.name} · {s.id} ↗</a><span>{s.metadata.publisher}</span><span>{t.adjustment}: {s.metadata.seasonalAdjustment === 'seasonally adjusted' ? t.sa : t.nsa}</span><span>{t.covered}: {driverSeries[s.key].points[0].date}–{driverSeries[s.key].points.at(-1).date} · {t.updated}: {s.metadata.sourceUpdatedAt} · {t.retrieved}: {s.metadata.retrievedAt}</span></p>)}</div>
    </section>
    <section className="driver-channels" aria-labelledby="driver-channels-title"><h2 id="driver-channels-title">{t.otherTitle}</h2><p className="global-help">{t.otherNote}</p><div className="driver-channel-grid">{t.channels.map((channel, index) => <article key={channel.id}><small>0{index + 1}</small><h3>{channel.title}</h3><p>{channel.body}</p><a href={channel.source.url} target="_blank" rel="noreferrer">{channel.source.name} ↗</a></article>)}</div></section>
  </section></>
}
