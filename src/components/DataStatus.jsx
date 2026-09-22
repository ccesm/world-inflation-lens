import React from 'react'
import { DigitalMoneyHealth } from './DigitalMoneyEvidence.jsx'
import { ProductivityHealth } from './ProductivityHealth.jsx'
import { ExternalDataHealth } from './Transmission.jsx'
import { sourceStatus, history } from '../data/status.js'
import { checkOverdue } from '../utils/dataStatus.js'
import { updatesCopy } from '../i18n/updates.js'

const checkDate = value => value.replace('T', ' ').slice(0, 16)

export function DataStatus({ language }) {
  const t = updatesCopy[language]
  const now = new Date()
  return <section className="global-section data-health" id="data-status" aria-labelledby="data-health-title">
    <div className="global-heading"><h2 id="data-health-title">{t.title}</h2><span>V0.11</span></div>
    <p>{t.intro}</p>
    <div className="health-check"><strong>{t.last}: {history.lastSuccessfulCheck ? checkDate(history.lastSuccessfulCheck) : t.never}</strong><span>{checkOverdue(history.lastSuccessfulCheck, now) ? t.overdue : t.checked}</span></div>
    <p className="global-help">{t.schedule}</p><a href="https://github.com/ccesm/world-inflation-lens/actions/workflows/deploy.yml" target="_blank" rel="noreferrer">{t.actions} ↗</a>
    <div className="health-grid">{sourceStatus(now).map(source => <article key={source.id} className="health-card"><a href={source.sourceUrl} target="_blank" rel="noreferrer">{source.id} ↗</a><h3>{t.sourceTitles?.[source.id] || source.title}</h3><small>{source.frequency === 'monthly' ? t.monthly : source.id === 'FP.CPI.TOTL.ZG' ? t.annual : source.frequency.startsWith('annual') ? (language === 'zh' ? '年度' : 'Annual') : source.frequency === 'daily' ? (language === 'zh' ? '日度' : 'Daily') : (language === 'zh' ? '每周三' : 'Weekly, Wednesday')}</small><p className={source.old ? 'health-old' : ''}>{source.old ? t.old : t.available}</p><dl><dt>{t.latest}</dt><dd>{source.latest || '—'}</dd><dt>{t.updated}</dt><dd>{source.updated}</dd><dt>{t.retrieved}</dt><dd>{source.retrieved}</dd><dt>{t.missing}</dt><dd>{source.missing.toLocaleString(language)} / {source.total.toLocaleString(language)}</dd></dl></article>)}</div>
    <ExternalDataHealth language={language} history={history} />
    <ProductivityHealth language={language} history={history} />
    <DigitalMoneyHealth language={language} history={history} />
    <p className="global-help">{t.policy}</p>
    <h2>{t.log}</h2><p className="global-help">{t.logNote}</p>
    <a href="https://github.com/ccesm/world-inflation-lens/commits/main/data/inflation" target="_blank" rel="noreferrer">{t.repository} ↗</a>
    {!history.runs.length && <p>{t.noRuns}</p>}
    {history.runs.map(run => <article className="health-run" key={run.checkedAt}><h3>{checkDate(run.checkedAt)} UTC</h3>{run.runUrl && <a href={run.runUrl} target="_blank" rel="noreferrer">{t.run} ↗</a>}
      {run.changes.every(s => s.total === 0) ? <p>{t.unchanged}</p> : run.changes.filter(s => s.total).map(series => <div key={series.id}><h4>{series.id}</h4><p>{['added', 'filled', 'revised', 'withdrawn'].map(key => `${t[key]}: ${series[key]}`).join(' · ')}</p><details className="data-table"><summary>{t.examples} ({series.examples.length} / {series.total})</summary><div role="region" aria-label={`${series.id} ${t.examples}`} tabIndex="0"><table><thead><tr><th>{t.date}</th><th>{t.before}</th><th>{t.after}</th></tr></thead><tbody>{series.examples.map(change => <tr key={change.date}><th scope="row">{change.date}<small> · {t[change.kind]}</small></th><td>{change.before ?? '—'}</td><td>{change.after ?? '—'}</td></tr>)}</tbody></table></div></details></div>)}
    </article>)}
  </section>
}
