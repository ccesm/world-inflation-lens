import React from 'react'
import { globalMetadata } from '../data/globalInflation.js'
import { globalCopy } from '../i18n/global.js'

export function GlobalDataNote({ language, full = false }) {
  const t = globalCopy[language]
  return <div className="global-data-note"><p>{t.source}: <a href={globalMetadata.url} target="_blank" rel="noreferrer">World Bank WDI · {globalMetadata.indicator} ↗</a> · {t.retrieved}: {globalMetadata.retrievedAt} · {t.updated}: {globalMetadata.sourceUpdatedAt} · CC BY 4.0</p>{full && <><p>{t.method}</p><p>{t.globalNote}</p></>}</div>
}
