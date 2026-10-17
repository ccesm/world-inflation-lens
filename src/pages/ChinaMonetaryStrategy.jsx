import React from 'react'
import { PageIntro } from '../components/PageIntro.jsx'
import { chinaStrategyCopy as c, chinaStrategyRoute, strategySources, strategySections, strategyDiagram, strategyMilestones, strategyTable, strategyScenarios } from '../i18n/chinaMonetaryStrategy.js'
import '../workspace.css'
import '../global-monetary-order.css'
import '../china-monetary-strategy.css'

export function ChinaMonetaryStrategy({ language }) {
  const t = pair => pair[language]
  const citations = ids => ids.length > 0 && <span className="cms-citations">{ids.map(id => <a key={id} href={`#/${chinaStrategyRoute}?focus=cms-source-${id}`} aria-label={`${t(c.sources)} ${id}`}>[{id}]</a>)}</span>
  const badge = kind => <span className="gmo-tag cms-kind">{t(c.kinds[kind])}</span>
  return <><PageIntro eyebrow={t(c.eyebrow)} title={t(c.title)} description={t(c.intro)} />
    <article className="content-section global-section workspace cms-article" data-china-strategy>
      <a className="cms-back" href="#/research/global-monetary-order">← {t(c.back)}</a>
      <aside className="gmo-notice"><strong>{t(c.local)}</strong><p>{t(c.boundary)}</p></aside>
      <nav className="cms-toc" aria-label={t(c.navigation)}>{strategySections.map(s => <a href={`#/${chinaStrategyRoute}?focus=cms-${s.id}`} key={s.id}>{t(s.title)}</a>)}</nav>
      <figure className="cms-diagram" aria-labelledby="cms-diagram-title" data-evidence-kind="analysis">
        <h2 id="cms-diagram-title">{t(c.diagram)}</h2>{badge('analysis')}
        <ol>{strategyDiagram.map((node, i) => <li key={i}><span className="cms-node">{t(node)}</span>{i < strategyDiagram.length - 1 && <span className="cms-connection">{t(c.connection)} <span aria-hidden="true">↔</span></span>}</li>)}</ol>
        <figcaption>{t(c.diagramNote)}</figcaption>
      </figure>
      {strategySections.map(s => <section id={`cms-${s.id}`} key={s.id} aria-labelledby={`cms-${s.id}-title`}>
        <h2 id={`cms-${s.id}-title`}>{t(s.title)}</h2>
        {s.blocks.map((b, i) => <div className={`cms-block cms-${b.kind}`} data-evidence-kind={b.kind} key={i}>{badge(b.kind)}<p>{t(b.text)}{citations(b.sources)}</p></div>)}
        {s.id === 'objectives' && <div className="cms-timeline"><h3>{t(c.timeline)}</h3><ol>{strategyMilestones.map(m => <li key={m.date} data-evidence-kind={m.kind}><time dateTime={m.date}>{m.date}</time><div>{badge(m.kind)}<p>{t(m.text)}{citations(m.sources)}</p></div></li>)}</ol></div>}
        {s.id === 'constraints' && <div className="cms-table-wrap" role="region" aria-label={t(c.table)} tabIndex={0}><table><caption>{t(c.table)}</caption><thead><tr>{c.columns.map((label, i) => <th scope="col" key={i}>{t(label)}</th>)}</tr></thead><tbody>{strategyTable.map((row, i) => <tr key={i} data-evidence-kind={row.kind}><th scope="row">{t(row.claim)}</th><td>{badge(row.kind)}<p>{t(row.evidence)}{citations(row.sources)}</p></td><td>{t(row.gap)}</td></tr>)}</tbody></table></div>}
        {s.id === 'scenarios' && <div className="cms-scenarios">{strategyScenarios.map((scenario, i) => <aside className="cms-scenario" data-evidence-kind="scenario" key={i}>{badge('scenario')}<h3>{t(scenario.title)}</h3><p>{t(scenario.text)}</p></aside>)}</div>}
      </section>)}
      <aside className="gmo-gaps"><h2>{t(c.gaps)}</h2><p>{t(c.gapText)}</p><a href="#/research/global-monetary-order?focus=gmo-reserves">{t(c.back)} →</a></aside>
      <footer className="cms-sources"><h2>{t(c.sources)}</h2><p>{t(c.sourceNote)}</p><ol>{strategySources.map(source => <li id={`cms-source-${source.id}`} key={source.id}><h3><a href={source.url} target="_blank" rel="noreferrer">[{source.id}] {t(source.title)} ↗</a></h3><p>{t(c.publication)}: {source.date}</p>{source.note && <p>{t(source.note)}</p>}</li>)}</ol></footer>
    </article>
  </>
}
