import React, { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { defaultYear, countryById, getValue } from '../data/globalInflation.js'
import { formatNumber } from '../utils/inflation.js'
import { iaCopy } from '../i18n/architecture.js'
const WorldMap = lazy(() => import('../charts/WorldMap.jsx'))
export function GlobalPreview({ language }) {
  const t = iaCopy[language], ref = useRef(null), [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!window.IntersectionObserver) { setVisible(true); return }
    const observer = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { setVisible(true); observer.disconnect() } }, { rootMargin: '200px' })
    observer.observe(ref.current); return () => observer.disconnect()
  }, [])
  return <section className="ia-section" ref={ref}><h2>{t.globalTitle}</h2><p>{t.globalNote}</p><div className="ia-global"><div className="ia-map-preview">{visible ? <Suspense fallback={<p>{language === 'zh' ? '正在加载地图…' : 'Loading map…'}</p>}><WorldMap year={defaultYear} selected="USA" language={language} onSelect={id => { window.location.hash = `/map?country=${id}&year=${defaultYear}` }} /></Suspense> : <a href="#/map">{language === 'zh' ? '查看全球地图' : 'Explore the world map'} →</a>}</div><div>{['USA', 'CHN', 'JPN', 'DEU'].map(id => <div className="ia-country" key={id}><span>{countryById[id].name[language]}</span><strong>{formatNumber(getValue(id, defaultYear), language)}%</strong></div>)}<p className="ia-source">{defaultYear} · {language === 'zh' ? '年度实际值 · CPI 年均变化率（%）' : 'Annual observations · Annual-average CPI change (%)'}<br /><a href="https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG" target="_blank" rel="noreferrer">World Bank · FP.CPI.TOTL.ZG ↗</a><br /><a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noreferrer">Natural Earth v5.1.2 ↗</a></p><p className="ia-source">{language === 'zh' ? '按共同覆盖率选择年份，不等同于美国最新月度 CPI 同比。' : 'Year selected for common coverage; not comparable to the latest monthly U.S. CPI YoY reading.'}</p></div></div><a className="ia-more" href="#/research">{t.researchLink} →</a></section>
}
