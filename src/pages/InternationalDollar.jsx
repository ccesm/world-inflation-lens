import React from 'react'
import { PageIntro } from '../components/PageIntro.jsx'
import { InternationalChart } from '../components/InternationalChart.jsx'
import { InternationalHealth } from '../components/InternationalHealth.jsx'
import { internationalById } from '../data/internationalDollar.js'
import { internationalCopy } from '../i18n/internationalDollar.js'
import { internationalSources } from '../data/internationalDefinitions.js'
import { internationalPeriod } from '../utils/internationalDollar.js'
import { SeriesStatusNote, SystemStatusProvider } from '../components/SystemStatus.jsx'
import { InternationalRevisions } from '../components/InternationalRevisions.jsx'
import '../international-dollar.css'
export function InternationalDollar({language}) {
 const t=internationalCopy[language],imputed=internationalById.COFER_IMPUTED,last=imputed.observations.findLast(p=>Number.isFinite(p.value))
 const matrix=[['COFER_USD','cofer'],['TIC_TOTAL','tic'],['BIS_USD_TOTAL','bis'],[null,null],[null,null],[null,'digital'],[null,'digital'],[null,null]]
 return <SystemStatusProvider><PageIntro eyebrow="RESEARCH / INTERNATIONAL DOLLAR" title={t.title} description={t.question}/><div className="content-section global-section intl-page"><p className="intl-principle">{t.intro}</p><span className="research-state" data-evidence-state="PARTIAL">{t.partial}</span><p>{t.cadence}</p>
 <nav className="intl-actions" aria-label={t.coverage}>{[['cofer',t.reserves],['tic',t.treasury],['bis',t.credit],['payments',t.payments],['trade',t.trade],['alternatives',t.alternatives]].map(([id,name])=><a href={`#/research/international-dollar?focus=${id}`} key={id}>{name}</a>)}</nav>
 <section aria-labelledby="intl-coverage"><h2 id="intl-coverage">{t.coverage}</h2><div className="intl-table-scroll" role="region" aria-label={t.coverage} tabIndex="0"><table><thead><tr>{[t.function,t.status,t.source,t.frequency,t.latest,t.maintenance,t.limitation].map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{matrix.map(([id,key],i)=>{const s=internationalById[id],p=s?.observations.findLast(p=>Number.isFinite(p.value));return <tr key={i} data-coverage-row={i}><th scope="row">{t.functions[i]}</th><td>{s?t.direct:key?t.partial:t.planned}</td><td>{s?internationalSources[key].name:key?'Federal Reserve / IMF':'—'}</td><td>{s?(s.frequency==='quarterly'?(language==='zh'?'季度':'Quarterly'):(language==='zh'?'月度':'Monthly')):key?(language==='zh'?'研究发布':'Publication'):'—'}</td><td>{p?internationalPeriod(p.date,s.frequency):'—'}</td><td>{s?t.automatic:key?t.manual:'—'}</td><td>{t.limitations[i]}</td></tr>})}</tbody></table></div></section>
 <section id="cofer"><h2>{t.reserves}</h2><p>{t.reserveNote}</p><p>{t.reserveCaution}</p><InternationalChart ids={internationalSources.cofer.ids.filter(id=>id!=='COFER_IMPUTED')} language={language}/><aside className="intl-principle"><h3>{t.imputed}</h3><p><strong>{last?.value.toLocaleString(language,{maximumFractionDigits:2})}%</strong> · {last&&internationalPeriod(last.date,'quarterly')}</p><p>{t.imputedNote}</p><SeriesStatusNote source={imputed} language={language}/><a href={imputed.sourceUrl} target="_blank" rel="noreferrer">IMF COFER ↗</a><a href="#/research/data?series=COFER_IMPUTED&range=all"> · {t.workspace} →</a></aside></section>
 <section id="tic"><h2>{t.treasury}</h2><p>{t.treasuryNote}</p><p>{t.treasuryCaution}</p><InternationalChart ids={internationalSources.tic.ids} language={language}/></section>
 <section id="bis"><h2>{t.credit}</h2><p>{t.creditNote}</p><p>{t.creditCaution}</p><InternationalChart ids={internationalSources.bis.ids} language={language}/></section>
 <section id="payments"><h2>{t.payments}</h2><span className="research-state" data-evidence-state="PARTIAL">{t.partial}</span><p>{t.paymentsNote}</p><a href="#/research/digital-money">{t.digital} →</a></section>
 <section id="trade"><h2>{t.trade}</h2><span className="research-state" data-evidence-state="PLANNED">{t.planned}</span><p>{t.tradeNote}</p></section>
 <section id="alternatives"><h2>{t.alternatives}</h2><span className="research-state" data-evidence-state="PLANNED">{t.planned}</span><p>{t.alternativesNote}</p></section>
 <section id="bridges"><h2>{t.bridge}</h2><p>{t.bridgeNote}</p><h3>{t.bridgeTitle}</h3><ul>{t.bridges.map((item,i)=><li key={item}><strong>{i===4?t.partial:t.direct}</strong> · {item}</li>)}</ul><div className="intl-actions"><a href="#/purchasing-power">{language==='zh'?'国内购买力':'Domestic purchasing power'} →</a><a href="#/monitor?group=market">{language==='zh'?'汇率与国债定价':'FX and Treasury pricing'} →</a></div></section>
 <section><h2>{t.missing}</h2><p>{t.missingNote}</p></section><section><h2>{t.sources}</h2><div className="intl-actions">{Object.values(internationalSources).map(s=><a href={s.url} key={s.name} target="_blank" rel="noreferrer">{s.name} ↗</a>)}<a href="#/sources?focus=international-health">{t.health} →</a><a href="#/research?focus=international-evidence">{language==='zh'?'研究地图':'Research Map'} →</a></div></section>
 <InternationalHealth language={language}/><InternationalRevisions language={language}/></div></SystemStatusProvider>
}
