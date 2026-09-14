import React, { useMemo, useState } from 'react'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import geography from '../../data/countries/world.geo.json'
import { countryById, getValue } from '../data/globalInflation.js'
import { bucketIndex } from '../utils/globalInflation.js'
import { globalCopy } from '../i18n/global.js'
import { percent } from './AnnualComparison.jsx'

export default function WorldMap({ year, selected, onSelect, language }) {
  const t = globalCopy[language]
  const [hover, setHover] = useState(null)
  const paths = useMemo(() => {
    const draw = geoPath(geoNaturalEarth1().fitExtent([[15, 15], [985, 475]], geography))
    return geography.features.map(feature => ({ ...feature, path: draw(feature) }))
  }, [])
  const active = hover || { countryId: selected, name: countryById[selected].name }
  return <div className="world-map-wrap">
    <div className="map-readout"><span>{year} · {countryById[active.countryId]?.name[language] || active.name[language]}</span><strong>{percent(getValue(active.countryId, year), language)}</strong></div>
    <svg viewBox="0 0 1000 490" className="world-map" role="group" aria-label={`${t.mapLabel} · ${year}`}>
      {paths.map(feature => {
        const p = feature.properties, value = getValue(p.countryId, year)
        const label = `${countryById[p.countryId]?.name[language] || p.name[language]} · ${year}: ${percent(value, language)}`
        return <path key={feature.id} d={feature.path} className={`map-country bucket-${bucketIndex(value)} ${p.countryId === selected ? 'is-selected' : ''}`} role={p.countryId ? 'button' : 'img'} tabIndex={p.countryId === selected ? 0 : -1} aria-label={label} aria-pressed={p.countryId ? p.countryId === selected : undefined}
          onMouseEnter={() => setHover(p)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(p)} onBlur={() => setHover(null)}
          onClick={() => { if (p.countryId) { onSelect(p.countryId); setHover(null) } }}
          onKeyDown={event => { if (p.countryId && ['Enter', ' '].includes(event.key)) { event.preventDefault(); onSelect(p.countryId) } }}><title>{label}</title></path>
      })}
    </svg>
    <div className="map-legend">{t.bins.map((label, i) => <span key={label}><i className={`bucket-${i}`} />{label}</span>)}</div>
    <p className="global-help">{t.mapHelp}</p><p className="global-help">{t.mapNote} <a href={geography.metadata.url} target="_blank" rel="noreferrer">Natural Earth ↗</a></p>
  </div>
}
