import React from 'react'
import { internationalSeries } from '../data/internationalDollar.js'
import { internationalCopy } from '../i18n/internationalDollar.js'
import { internationalPeriod } from '../utils/internationalDollar.js'
import { SeriesStatusNote } from './SystemStatus.jsx'
export function InternationalHealth({language}) {
 const t=internationalCopy[language]
 return <section id="international-health" className="intl-health"><h2>{t.health}</h2><p>{t.releaseNote}</p><p>{language==='zh'?'状态基于观测期末的保守滞后阈值：COFER 190 天、TIC 95 天、BIS 210 天。来源更新时间未知时明确显示未知，不以获取时间代替。':'Conservative limits from observation-period end: COFER 190 days, TIC 95 days, BIS 210 days. Unknown publisher update times remain unknown; retrieval never substitutes for publication.'}</p>
 <div className="intl-health-grid">{internationalSeries.map(s=>{const latest=s.observations.findLast(p=>Number.isFinite(p.value));return <article key={s.id}><h3>{s.contract.title[language]}</h3><p><a href={s.sourceUrl} target="_blank" rel="noreferrer">{s.publisher} ↗</a></p><dl><dt>{t.frequency}</dt><dd>{s.frequency==='quarterly'?(language==='zh'?'季度':'Quarterly'):(language==='zh'?'月度':'Monthly')}</dd><dt>{t.latest}</dt><dd>{latest&&internationalPeriod(latest.date,s.frequency)}</dd><dt>{t.updated}</dt><dd>{s.sourceUpdatedAt||t.unknown}</dd><dt>{t.retrieved}</dt><dd>{s.retrievedAt}</dd><dt>{t.coverageDates}</dt><dd>{internationalPeriod(s.observations[0].date,s.frequency)} — {internationalPeriod(s.observations.at(-1).date,s.frequency)}</dd></dl><SeriesStatusNote source={s} language={language}/><details><summary>{t.limitation}</summary><p>{s.definition}</p><p>{s.denominator}</p><p>{t.limitations[s.id.startsWith('COFER')?0:s.id.startsWith('TIC')?1:2]}</p></details></article>})}</div></section>
}
