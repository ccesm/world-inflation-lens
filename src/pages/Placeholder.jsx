import { PageIntro } from '../components/PageIntro.jsx'
import { CpiChartPlaceholder, InflationMapPlaceholder } from '../charts/Placeholders.jsx'

export function Placeholder({ t, kind }) {
  const content = t.placeholders[kind]
  return <><PageIntro {...content} /><section className="content-section"><div className={`placeholder-panel ${kind === 'map' ? 'map-panel' : ''}`}><div className="placeholder-art" aria-hidden="true">{kind === 'us-cpi' ? <CpiChartPlaceholder /> : <InflationMapPlaceholder />}</div><div className="placeholder-message"><span className="status-dot" />{t.placeholderLabel}<h2>{content.panelTitle}</h2><p>{content.panelDescription}</p></div></div><div className="next-step"><span>01 / V0.1</span><p>{content.nextStep}</p></div></section></>
}
