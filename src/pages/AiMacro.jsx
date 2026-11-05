import React,{useEffect,useState} from 'react'
import {PageIntro} from '../components/PageIntro.jsx'
import publication from '../data/ai-macro/publication.json'
import {validPublication,verifyPublication,publicationIdentity} from '../data/ai-macro/contract.js'
import {macroCopy as c,text} from '../i18n/aiMacro.js'
import '../ai-macro.css'
function Evidence({ids,data,language}){
 const t=x=>text(x,language)
 return <ul className="am-evidence-list">{ids.map(id=>{const claim=data.claims.find(x=>x.id===id);return <li key={id} data-evidence-id={id}><span className="am-evidence-kind">{t(c.kinds[claim.kind])}</span><p>{t(c.claims[id])}</p><small>{claim.sourceIds.join(' · ')}</small></li>})}</ul>
}
function Sources({channel,data,language}){
 const t=x=>text(x,language)
 return <details className="am-sources"><summary>{t(c.sources)}</summary><p>{t(c.catalogNote)}</p><div className="am-source-grid">{channel.sourceIds.map(id=>{const s=data.sources.find(x=>x.id===id),copy=c.sourceCopy[id];return <section key={id} data-source-id={id} aria-labelledby={`source-${id}`}><h4 id={`source-${id}`}>{t(copy.title)}</h4><dl><div><dt>{t(c.provider)}</dt><dd>{t(c.providers[s.providerId])}</dd></div><div><dt>{t(c.dataset)}</dt><dd>{t(copy.dataset)}<br/><code>{s.datasetIdentifier}</code></dd></div><div><dt>{t(c.scope)}</dt><dd>{t(copy.scope)}</dd></div></dl><h5>{t(c.access)}</h5><p>{t(copy.access)}</p><div className="am-source-links"><a href={s.officialURL} rel="external noreferrer">{t(c.official)} · {id}</a>{s.catalogURL&&<a href={s.catalogURL} rel="external noreferrer">{t(c.catalog)} · {id}</a>}</div></section>})}</div></details>
}
export function AiMacroContent({language,data}){
 const t=x=>text(x,language)
 // Authentication resolves after the shell's route-focus effect. Restore only
 // this article's explicit deep-link destination once verified content mounts.
 useEffect(()=>{
  if(!validPublication(data))return
  const focus=new URLSearchParams(window.location.hash.split('?')[1]).get('focus')
  if(!data.channels.some(channel=>focus===`macro-${channel.id}`))return
  const section=document.getElementById(focus),heading=section?.querySelector('h2')
  if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});section.scrollIntoView({block:'start'})}
 },[data,language])
 if(!validPublication(data))return <p role="alert">{t(c.invalid)}</p>
 return <article className="am-page" data-page="ai-macro"><PageIntro eyebrow={t(c.eyebrow)} title={t(c.title)} description={t(c.subtitle)}/><div className="content-section am-content">
 <section className="am-position" aria-labelledby="am-position"><p className="am-kicker">{t(c.researchVintage)} · <time dateTime={data.researchAsOf}>{data.researchAsOf}</time></p><h2 id="am-position">{t(c.positionTitle)}</h2><p>{t(c.position)}</p><p className="am-vintage">{t(c.vintageNote)}</p><p className="am-vintage">{t(c.edition)} · <time dateTime={data.publicationDate}>{data.publicationDate}</time></p></section>
 <nav className="am-contents" aria-label={t(c.contents)}>{data.channels.map(channel=><a key={channel.id} href={`#/research/ai-macro?focus=macro-${channel.id}`}>{t(c.channels[channel.id].title)}</a>)}</nav>
 {data.channels.map(channel=>{const copy=c.channels[channel.id];return <section className="am-panel" key={channel.id} id={`macro-${channel.id}`} data-macro-section={channel.id} aria-labelledby={`macro-heading-${channel.id}`}>
 <header><p className="am-kicker">{t(copy.title)}</p><p className="am-label">{t(c.question)}</p><h2 id={`macro-heading-${channel.id}`}>{t(copy.question)}</h2></header>
 <div className="am-finding"><h3>{t(c.finding)}</h3><p>{t(copy.finding)}</p></div>
 <div className="am-evidence-grid"><section><h3>{t(c.observations)}</h3><Evidence ids={channel.observationRefs} data={data} language={language}/></section><section className="am-counter"><h3>{t(c.counterEvidence)}</h3><Evidence ids={channel.counterEvidenceRefs} data={data} language={language}/></section></div>
 <div className="am-interpretation"><section><h3>{t(c.alternatives)}</h3><p>{t(copy.alternatives)}</p></section><section><h3>{t(c.unresolved)}</h3><p>{t(copy.unresolved)}</p></section></div>
 <section className="am-section-method"><h3>{t(c.sectionMethod)}</h3><p>{t(copy.method)}</p></section><Sources channel={channel} data={data} language={language}/>
 </section>})}
 <section className="am-method" aria-labelledby="am-method"><h2 id="am-method">{t(c.methodTitle)}</h2><p>{t(c.method)}</p><p>{t(c.integrity)}</p><p>{t(c.accessBoundary)}</p><p>{t(c.rights)}</p><details><summary>{t(c.identity)}</summary><dl><div><dt>{t(c.publicationHash)}</dt><dd><code>{publicationIdentity.publicationSha256}</code></dd></div><div><dt>{t(c.researchHash)}</dt><dd><code>{data.research.c2Sha256}</code></dd></div></dl></details></section>
 </div></article>
}
export function AiMacro({language,data=publication}){
 const [state,setState]=useState({data:null,failed:false})
 useEffect(()=>{let active=true;setState({data:null,failed:false});verifyPublication(data).then(value=>{if(active)setState({data:value,failed:false})}).catch(()=>{if(active)setState({data:null,failed:true})});return()=>{active=false}},[data])
 if(!state.data)return <div className="am-page"><PageIntro eyebrow={text(c.eyebrow,language)} title={text(c.title,language)} description={text(c.subtitle,language)}/><section className="content-section" role={state.failed?'alert':'status'}>{text(state.failed?c.invalid:c.loading,language)}</section></div>
 return <AiMacroContent language={language} data={state.data}/>
}
