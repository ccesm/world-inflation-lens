import React, { useEffect, useState } from 'react'
import { PageIntro } from '../components/PageIntro.jsx'
import { ChartShare } from '../components/ChartShare.jsx'
import { WorkspaceSeries } from '../components/WorkspaceSeries.jsx'
import { catalog, catalogById, seriesName } from '../data/catalog.js'
import { workspaceCopy } from '../i18n/workspace.js'
import { cleanIds, readSaved, writeSaved, workspaceState, workspaceHash } from '../utils/workspace.js'

export function DataWorkspace({ language }) {
  const t = workspaceCopy[language]
  const [state, setState] = useState(() => workspaceState(window.location.hash, readSaved('wil-workspace', {}), catalog))
  const [saved, setSaved] = useState(() => cleanIds(readSaved('wil-saved-series', []), catalog))
  const [storageOK, setStorageOK] = useState(true)
  const [query, setQuery] = useState(''), [topic, setTopic] = useState(''), [frequency, setFrequency] = useState(''), [savedOnly, setSavedOnly] = useState(false)
  const [count, setCount] = useState(12)
  useEffect(() => { setStorageOK(writeSaved('wil-workspace', state)) }, [state])
  const selection = state.ids.map(id => catalogById[id]).filter(Boolean)
  const anchor = selection.map(s => s.observations.at(-1)?.date).filter(Boolean).sort().at(-1)
  const startDate = state.range === 'all' ? selection.map(s => s.observations[0]?.date).filter(Boolean).sort()[0] : anchor && String(Number(anchor.slice(0, 4)) - Number(state.range)) + anchor.slice(4)
  const filtered = catalog.filter(s => (!topic || s.topic === topic) && (!frequency || s.frequency === frequency) && (!savedOnly || saved.includes(s.id)) && `${s.id} ${s.title} ${seriesName(s, language)} ${s.publisher || ''} ${s.provider}`.toLowerCase().includes(query.trim().toLowerCase()))
  function favorite(id) { const next = saved.includes(id) ? saved.filter(x => x !== id) : [...saved, id]; setSaved(next); setStorageOK(writeSaved('wil-saved-series', next)) }
  return <><PageIntro className="workspace-intro" eyebrow="RESEARCH / V0.12" title={t.title} description={t.intro} /><section className="content-section workspace global-section">
    <nav className="workspace-actions"><a href="#/research/updates">{t.journal} →</a><a href="#/sources">{t.sources} →</a></nav>
    <section aria-labelledby="workspace-title"><h2 id="workspace-title">{t.workspace}</h2><p>{t.note}</p><p>{t.presetTitle}</p><div className="workspace-actions">{[['CPIAUCNS', 'PCEPILFE', 'CUUR0000SAH1'], ['OPHNFB', 'ULCNFB', 'COMPNFB'], ['DGS10', 'DFII10', 'T5YIFR']].map((ids, i) => <button key={i} className="global-button secondary" onClick={() => setState({ ...state, ids })}>{t.presets[i]}</button>)}</div><label>{t.range}<select value={state.range} onChange={e => setState({ ...state, range: e.target.value })}>{['5', '10', '20', 'all'].map(r => <option key={r} value={r}>{r === 'all' ? t.full : `${r} ${t.years}`}</option>)}</select></label>
      <div className="workspace-charts">{selection.map(s => <WorkspaceSeries key={s.id} series={s} language={language} range={state.range} anchor={anchor} startDate={startDate} onRemove={() => setState({ ...state, ids: state.ids.filter(id => id !== s.id) })} />)}</div>
      {!selection.length && <p>{t.select} ↓</p>}<p className="global-help">{t.yoyNote}</p><p className="global-help">{t.periodNote}</p>
      <ChartShare hash={workspaceHash(state)} language={language} note={t.storage} /><p role="status">{!storageOK && t.storageBlocked}</p>
    </section>
    <section aria-labelledby="catalog-title"><h2 id="catalog-title">{t.series} · {catalog.length}</h2>
      <div className="workspace-filters"><label>{t.search}<input type="search" value={query} onChange={e => { setQuery(e.target.value); setCount(12) }} /></label><label>{t.topic}<select value={topic} onChange={e => { setTopic(e.target.value); setCount(12) }}><option value="">{t.all}</option>{Object.entries(t.topics).map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label><label>{t.frequency}<select value={frequency} onChange={e => { setFrequency(e.target.value); setCount(12) }}><option value="">{t.all}</option>{[...new Set(catalog.map(s => s.frequency))].map(f => <option key={f} value={f}>{t.frequencies[f] || f}</option>)}</select></label></div>
      <div className="workspace-actions"><label className="workspace-checkbox"><input type="checkbox" checked={savedOnly} onChange={e => { setSavedOnly(e.target.checked); setCount(12) }} />{t.saved} ({saved.length})</label><button className="global-button secondary" onClick={() => { setQuery(''); setTopic(''); setFrequency(''); setSavedOnly(false); setCount(12) }}>{t.reset}</button></div>
      <p role="status">{filtered.length} {t.results}{state.ids.length === 3 && ` · ${t.limit}`}</p>
      <div className="workspace-library">{filtered.slice(0, count).map(s => <article key={s.id} className="workspace-card"><small>{s.id} · {t.frequencies[s.frequency]}</small><h3>{seriesName(s, language)}</h3><p>{s.publisher || s.provider}</p><p>{t.latest}: {s.observations.findLast(p => Number.isFinite(p.value))?.date || '—'}</p>{s.proxy && <p>{t.proxy}</p>}<div className="workspace-actions"><button className="global-button" disabled={state.ids.includes(s.id) || state.ids.length === 3} onClick={() => setState({ ...state, ids: [...state.ids, s.id] })}>{t.select}</button><button className="global-button secondary" aria-pressed={saved.includes(s.id)} aria-label={`${saved.includes(s.id) ? t.unsave : t.save} ${s.id}`} onClick={() => favorite(s.id)}>{saved.includes(s.id) ? `★ ${t.unsave}` : `☆ ${t.save}`}</button><a href={s.sourceUrl} target="_blank" rel="noreferrer">{t.source} ↗</a></div></article>)}</div>
      {!filtered.length && <p>{t.empty}</p>}{count < filtered.length && <button className="global-button secondary" onClick={() => setCount(count + 12)}>{t.more}</button>}
    </section>
    <section><h2>{t.collections}</h2><p>{t.collectionNote}</p><div className="workspace-actions"><a href="#/map">World Bank →</a><a href="#/fiscal?focus=outlook">CBO · 1962–2056 →</a><a href="#/research/digital-money">{t.topics.money} →</a></div></section>
  </section></>
}
