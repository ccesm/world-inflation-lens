import snapshot from '../../data/inflation/worldbank.json'
import countries from '../../data/countries/metadata.json'
import { chooseDefaultYear, rowsAt, valueAt } from '../utils/globalInflation.js'

export { countries }
export const globalMetadata = snapshot.metadata
export const years = Array.from({ length: globalMetadata.endYear - globalMetadata.startYear + 1 }, (_, i) => globalMetadata.startYear + i)
export const getValue = (id, year) => valueAt(snapshot.values, id, year, globalMetadata.startYear)
export const getRows = year => rowsAt(countries, snapshot.values, year, globalMetadata.startYear)
export const getHistory = id => years.map(year => ({ year, value: getValue(id, year) }))
export const coverage = years.map(year => ({ year, count: getRows(year).filter(row => row.value != null).length }))
export const defaultYear = chooseDefaultYear(coverage, globalMetadata.endYear)
export const countryById = Object.fromEntries(countries.map(country => [country.id, country]))
