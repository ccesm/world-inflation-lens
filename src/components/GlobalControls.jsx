import React from 'react'
import { countries, years, defaultYear } from '../data/globalInflation.js'
import { globalCopy } from '../i18n/global.js'

export function YearControl({ year, onChange, language }) {
  const t = globalCopy[language]
  return <div className="global-year"><label>{t.year}<select aria-label={t.year} value={year} onChange={event => onChange(Number(event.target.value))}>{[...years].reverse().map(y => <option key={y} value={y}>{y}</option>)}</select></label><p>{t.defaultYear}: {defaultYear}. {t.defaultNote}</p></div>
}

export function CountrySelect({ value, onChange, language, label }) {
  return <label className="country-select">{label || globalCopy[language].selectCountry}<select aria-label={label || globalCopy[language].selectCountry} value={value} onChange={event => onChange(event.target.value)}>{[...countries].sort((a, b) => a.name[language].localeCompare(b.name[language], language)).map(country => <option key={country.id} value={country.id}>{country.name[language]} · {country.id}</option>)}</select></label>
}
