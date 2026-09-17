import React, {useEffect} from 'react'
import { PageIntro } from '../components/PageIntro.jsx'
import { DigitalFact, BankDepositsChart } from '../components/DigitalMoneyEvidence.jsx'
import { digitalPublications, digitalSources } from '../data/digitalMoney.js'
import { digitalCopy } from '../i18n/digitalMoney.js'
import { viewParameter } from '../utils/routing.js'
const sections=['market','share','treasuries','deposits','demand','dollarization','alternatives','stability']
function Cite({id}){const s=digitalSources[id];return <p className="dm-source"><a href={s.url} target="_blank" rel="noreferrer">{s.name} ↗</a></p>}
export function DigitalMoney({language}) {
 const t=digitalCopy[language],focus=viewParameter('focus',sections,'market')
 useEffect(()=>{if(window.location.hash.includes('focus='))document.getElementById(`dm-${focus}`)?.scrollIntoView({block:'start'})},[focus])
 return <><PageIntro eyebrow={`RESEARCH / ${t.nav}`} title={t.title} description={t.intro}/><div className="content-section global-section ia-page dm-page"><h2>{t.question}</h2><p className="dm-principle">{t.principle}</p><p>{t.central}</p><Cite id="money"/>
 <nav className="dm-jump" aria-label={t.nav}>{sections.map((s,i)=><a key={s} href={`#/research/digital-money?focus=${s}`}>{t.sections[i]}</a>)}</nav>
 <section className="ia-section"><h2>{t.pathways}</h2><div className="ia-grid three">{t.paths.map(([title,steps])=><article key={title}><h3>{title}</h3><ol className="dm-path">{steps.map(step=><li key={step}>{step}</li>)}</ol></article>)}</div><p>{t.pathNote}</p></section>
 <section className="ia-section" id="dm-market"><h2>01 / {t.sections[0]}</h2><p className="eyebrow">{t.snapshot}</p><p>{t.snapshotNote}</p><div className="ia-grid two">{digitalPublications.filter(r=>r.units==='USD billion').map(record=><DigitalFact key={record.id} record={record} language={language}/>)}</div><p>{t.marketNote}</p></section>
 <section className="ia-section" id="dm-share"><h2>02 / {t.sections[1]}</h2><DigitalFact record={digitalPublications.find(r=>r.id==='IMF_USD_SHARE')} language={language}/><p>{t.shareNote}</p></section>
 <section className="ia-section" id="dm-treasuries"><h2>03 / {t.sections[2]}</h2><DigitalFact record={digitalPublications.find(r=>r.id==='IMF_TBILL_SHARE')} language={language}/><p>{t.treasuryNote}</p></section>
 <section className="ia-section" id="dm-deposits"><h2>04 / {t.sections[3]}</h2><p>{t.bankNote}</p><BankDepositsChart language={language}/><div className="ia-grid three">{t.bankCases.map(([title,text])=><article key={title}><h3>{title}</h3><p>{text}</p></article>)}</div><Cite id="banking"/></section>
 <section className="ia-section" id="dm-demand"><h2>05 / {t.sections[4]}</h2><p>{t.demandNote}</p><Cite id="treasury"/><a className="ia-more" href="#/fiscal">{t.fiscal} →</a></section>
 <section className="ia-section" id="dm-dollarization"><h2>06 / {t.sections[5]}</h2><p>{t.dollarizationNote}</p><Cite id="dollarization"/></section>
 <section className="ia-section" id="dm-alternatives"><h2>07 / {t.sections[6]}</h2><p>{t.alternativesNote}</p><div className="ia-grid three">{t.comparisons.map(([name,text])=><article key={name}><h3>{name}</h3><p>{text}</p></article>)}</div><Cite id="money"/></section>
 <section className="ia-section" id="dm-stability"><h2>08 / {t.sections[7]}</h2><p>{t.riskNote}</p><ul>{t.risks.map(r=><li key={r}>{r}</li>)}</ul><Cite id="market"/></section>
 <section className="ia-section"><h2>{t.why}</h2><p>{t.conclusion}</p><a className="ia-more" href="#/purchasing-power">{t.dollar} →</a><h3>{t.gaps}</h3><p>{t.gapsNote}</p><p>{t.method}</p><div className="dollar-links"><a className="ia-more" href="#/sources?focus=health">{t.health} →</a><a className="ia-more" href="#/research/ai-productivity">{t.ai} →</a></div></section>
 </div></>
}
