import React from 'react'
import { workspaceCopy } from '../i18n/workspace.js'
export function ResearchShortcuts({ language }) {
  const t = workspaceCopy[language]
  return <section className="workspace-gateway"><small>V0.12</small><h2>{t.gateway}</h2><p>{t.gatewayIntro}</p><a href="#/research/data">{t.title} →</a><a href="#/research/updates">{t.journal} →</a><a href="#/sources">{t.sources} →</a></section>
}
