import { InternationalHealth } from './InternationalHealth.jsx'
import '../international-dollar.css'
import React from 'react'
import { DigitalMoneyHealth } from './DigitalMoneyEvidence.jsx'
import { ProductivityHealth } from './ProductivityHealth.jsx'
import { ExternalDataHealth } from './Transmission.jsx'
import { sourceStatus, history } from '../data/status.js'
import { checkOverdue } from '../utils/dataStatus.js'
import { updatesCopy } from '../i18n/updates.js'
import { appVersion } from '../data/buildInfo.js'
import { SystemStatus, SystemStatusProvider, SeriesStatusNote } from './SystemStatus.jsx'
import cbo from '../../data/fiscal/cbo-2026-02.json'
import { seriesMetadata } from '../data/seriesContract.js'

const checkDate = value => value.replace('T', ' ').slice(0, 16)

export function DataStatus({ language }) {
  const t = updatesCopy[language]
  const now = new Date()
  return <SystemStatusProvider><section className="global-section data-health" id="data-status" aria-labelledby="data-health-title">
    <div className="global-heading"><h2 id="data-health-title">{t.title}</h2><span>V{appVersion}</span></div>
    <p>{t.intro}</p><SystemStatus language={language} />
    <div className="health-check"><strong>{t.last}: {history.lastSuccessfulCheck ? checkDate(history.lastSuccessfulCheck) : t.never}</strong><span>{checkOverdue(history.lastSuccessfulCheck, now) ? t.overdue : t.checked}</span></div>
    <p className="global-help">{t.schedule}</p><a href="https://github.com/ccesm/world-inflation-lens/actions/workflows/deploy.yml" target="_blank" rel="noreferrer">{t.actions} ↗</a>
    <div className="health-grid">{sourceStatus(now).map(source => <article key={source.id} className="health-card"><a href={source.sourceUrl} target="_blank" rel="noreferrer">{source.id} ↗</a><h3>{source.contract.title[language]}</h3><small>{source.frequency === 'monthly' ? t.monthly : source.id === 'FP.CPI.TOTL.ZG' ? t.annual : source.frequency.startsWith('annual') ? (language === 'zh' ? '年度' : 'Annual') : source.frequency === 'daily' ? (language === 'zh' ? '日度' : 'Daily') : (language === 'zh' ? '每周三' : 'Weekly, Wednesday')}</small><SeriesStatusNote source={source} language={language} /><dl><dt>{t.latest}</dt><dd>{source.latest || '—'}</dd><dt>{t.updated}</dt><dd>{source.updated}</dd><dt>{t.retrieved}</dt><dd>{source.retrieved}</dd><dt>{t.missing}</dt><dd>{source.missing.toLocaleString(language)} / {source.total.toLocaleString(language)}</dd></dl></article>)}</div>
    <InternationalHealth language={language} />
    <ExternalDataHealth language={language} history={history} />
    <ProductivityHealth language={language} history={history} />
    <DigitalMoneyHealth language={language} history={history} />
    <h2>CBO · {language==='zh'?'固定预测版本':'Fixed Forecast Vintage'}</h2><div className="health-grid">{['debt','deficit','interest'].map(metric=>{
      const source={...cbo.metadata,id:`CBO_${metric.toUpperCase()}`,sourceUrl:cbo.metadata.projectionSource,frequency:'annual_fy',geography:'US',observations:cbo.observations.filter(p=>p.status==='actual').map(p=>({date:String(p.year),value:p[metric]}))}
      return <article key={source.id} className="health-card"><h3>{seriesMetadata(source).title[language]}</h3><SeriesStatusNote source={source} language={language}/><a href="#/fiscal?focus=outlook">{language==='zh'?'查看财政数据与假设':'Explore fiscal data and assumptions'} →</a></article>
    })}</div><p className="global-help">{t.policy}</p>
    <h2>{t.log}</h2><p className="global-help">{t.logNote}</p>
    <a href="https://github.com/ccesm/world-inflation-lens/commits/main/data/inflation" target="_blank" rel="noreferrer">{t.repository} ↗</a>
    {!history.runs.length && <p>{t.noRuns}</p>}
    {history.runs.map(run => <article className="health-run" key={run.checkedAt}><h3>{checkDate(run.checkCompletedAt || run.checkedAt)} UTC</h3>{run.runUrl && <a href={run.runUrl} target="_blank" rel="noreferrer">{t.run} ↗</a>}
      {run.changes.every(s => s.total === 0) ? <p>{t.unchanged}</p> : run.changes.filter(s => s.total).map(series => <div key={series.id}><h4>{series.id}</h4><p>{['added', 'filled', 'revised', 'withdrawn'].map(key => `${t[key]}: ${series[key]}`).join(' · ')}</p><details className="data-table"><summary>{t.examples} ({series.examples.length} / {series.total})</summary><div role="region" aria-label={`${series.id} ${t.examples}`} tabIndex="0"><table><thead><tr><th>{t.date}</th><th>{t.before}</th><th>{t.after}</th></tr></thead><tbody>{series.examples.map(change => <tr key={change.date}><th scope="row">{change.date}<small> · {t[change.kind]}</small></th><td>{change.before ?? '—'}</td><td>{change.after ?? '—'}</td></tr>)}</tbody></table></div></details></div>)}
    </article>)}
  </section></SystemStatusProvider>
}
