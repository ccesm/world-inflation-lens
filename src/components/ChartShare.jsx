import React, { useState } from 'react'
import { updatesCopy } from '../i18n/updates.js'

export function ChartShare({ hash, language, note }) {
  const t = updatesCopy[language]
  const [result, setResult] = useState(null)
  const link = (window.location.href?.split('#')[0] || '') + hash
  async function copyLink() {
    try { await navigator.clipboard.writeText(link); setResult({ link, ok: true }) }
    catch { setResult({ link, ok: false }) }
  }
  return <section className="chart-share" aria-label={t.share}><div><strong>{t.share}</strong><button className="global-button secondary" onClick={copyLink}>{t.copy}</button><span role="status">{result?.link === link ? result.ok ? t.copied : t.manual : ''}</span></div><label>{t.link}<input readOnly value={link} onFocus={event => event.target.select()} /></label><p>{note || t.shareNote}</p></section>
}
