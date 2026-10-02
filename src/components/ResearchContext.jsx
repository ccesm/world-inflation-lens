import React from 'react'
import { researchContextForRoute, researchStages, structuralThemes } from '../data/researchArchitecture.js'

export function ResearchContext({ route, navigationKey, language }) {
  const context = researchContextForRoute(navigationKey || route)
  if (!context) return null
  const stage = researchStages.find(item => item.id === context.stage)
  const theme = structuralThemes.find(item => item.id === context.theme)
  const labels = [stage?.label?.[language], theme?.label?.[language], context.label?.[language]].filter(Boolean)
  return <nav className="research-context" aria-label={language === 'zh' ? '研究位置' : 'Research context'}>
    <ol>{labels.map((text, index) => <li key={`${index}-${text}`}>{index > 0 && <span aria-hidden="true"> / </span>}<span>{text}</span></li>)}</ol>
    <a href={context.href || '#/research?focus=research-map'}>{language === 'zh' ? '返回研究地图' : 'Back to Research Map'} <span aria-hidden="true">↗</span></a>
  </nav>
}
