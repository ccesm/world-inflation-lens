import React, { useState } from 'react'
import { PageIntro } from '../components/PageIntro.jsx'
import { history } from '../data/status.js'
import { workspaceCopy } from '../i18n/workspace.js'
import { checkOverdue } from '../utils/dataStatus.js'
import { csvCell, downloadCsv, filteredRuns } from '../utils/workspace.js'
import { releaseCalendars } from '../data/researchLinks.js'

export function UpdateJournal({ language }) {
  const t = workspaceCopy[language], [id, setId] = useState(''), [onlyChanges, setOnlyChanges] = useState(false), [count, setCount] = useState(8)
  const ids = [...new Set(history.runs.flatMap(run => run.changes.map(s => s.id)))].sort()
  const runs = filteredRuns(history.runs, id, onlyChanges)
  const totals = Object.fromEntries(['added', 'filled', 'revised', 'withdrawn'].map(key => [key, runs.reduce((total, run) => total + run.changes.reduce((sum, s) => sum + s[key], 0), 0)]))
  function exportSummary() {
    const rows = [['checked_at_utc', 'series', 'added', 'filled', 'revised', 'withdrawn', 'workflow'], ...runs.flatMap(run => run.changes.map(s => [run.checkedAt, s.id, s.added, s.filled, s.revised, s.withdrawn, run.runUrl]))]
    downloadCsv('world-inflation-lens-update-summary.csv', '\ufeff' + rows.map(row => row.map(csvCell).join(',')).join('\r\n'))
  }
  return <><PageIntro className="workspace-intro" eyebrow="RESEARCH / V0.12" title={t.journal} description={t.journalIntro} /><section className="content-section workspace global-section">
    <div className="workspace-banner"><strong>{t.checked}: {history.lastSuccessfulCheck || '—'}</strong><p>{checkOverdue(history.lastSuccessfulCheck) ? t.overdue : t.current}</p><a href="https://github.com/ccesm/world-inflation-lens/actions/workflows/deploy.yml" target="_blank" rel="noreferrer">{t.run} ↗</a></div>
    <div className="workspace-filters"><label>{t.series}<select value={id} onChange={e => { setId(e.target.value); setCount(8) }}><option value="">{t.all}</option>{ids.map(value => <option key={value}>{value}</option>)}</select></label><label className="workspace-checkbox"><input type="checkbox" checked={onlyChanges} onChange={e => { setOnlyChanges(e.target.checked); setCount(8) }} />{t.changesOnly}</label><button className="global-button" onClick={exportSummary}>{t.exportJournal}</button></div>
    <div className="workspace-totals">{Object.entries(totals).map(([key, value]) => <div key={key}><strong>{value.toLocaleString(language)}</strong><span>{t[key]}</span></div>)}</div><p>{t.sample}</p>
    {runs.slice(0, count).map(run => <article className="workspace-panel" key={run.checkedAt}><div className="workspace-heading"><h2>{run.checkedAt.replace('T', ' ').slice(0, 19)} UTC</h2>{run.runUrl && <a href={run.runUrl} target="_blank" rel="noreferrer">{t.run} ↗</a>}</div>{run.changes.every(s => s.total === 0) && <p>{t.unchanged}</p>}{run.changes.filter(s => s.total).map(s => <details className="data-table" key={s.id}><summary>{s.id} · {['added', 'filled', 'revised', 'withdrawn'].map(key => `${t[key]} ${s[key]}`).join(' / ')}</summary><p>{t.examples}: {s.examples.length} / {s.total}</p><div role="region" aria-label={`${s.id} ${t.examples}`} tabIndex="0"><table><thead><tr><th>{t.period}</th><th>{t.kind}</th><th>{t.before}</th><th>{t.after}</th></tr></thead><tbody>{s.examples.map((change, i) => <tr key={`${change.date}-${i}`}><th scope="row">{change.date}</th><td>{t[change.kind] || change.kind}</td><td>{change.before ?? '—'}</td><td>{change.after ?? '—'}</td></tr>)}</tbody></table></div></details>)}</article>)}
    {!runs.length && <p>{t.noRuns}</p>}{count < runs.length && <button className="global-button secondary" onClick={() => setCount(count + 8)}>{t.more}</button>}
    <div className="workspace-actions"><a href="https://github.com/ccesm/world-inflation-lens/commits/main/data" target="_blank" rel="noreferrer">{t.repo} ↗</a><a href="#/research/data">{t.title} →</a><a href="#/sources?focus=health">{language === 'zh' ? '数据健康' : 'Data Health'} →</a></div>
    <section><h2>{t.calendars}</h2><p>{t.calendarNote}</p><div className="workspace-library">{releaseCalendars.map(item => <a className="workspace-card" href={item.url} target="_blank" rel="noreferrer" key={item.url}>{item[language]} ↗</a>)}</div></section>
  </section></>
}
