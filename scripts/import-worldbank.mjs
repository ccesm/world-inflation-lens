// Reproducible offline import: download the documented inputs, then validate before writing.
import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const input = process.argv[2] || '/tmp'
const read = async file => JSON.parse(await readFile(resolve(input, file), 'utf8'))
const [countryResponse, response, indicatorResponse, geo] = await Promise.all([
  read('wil-countries.json'), read('wil-inflation.json'), read('wil-indicator.json'), read('wil-world.geojson'),
])
for (const data of [countryResponse, response, indicatorResponse]) {
  assert.ok(Array.isArray(data[1]), 'Expected World Bank response')
  assert.equal(Number(data[0].pages), 1, 'Incomplete download: fetch all pages first')
  assert.equal(data[1].length, Number(data[0].total))
}
const names = new Intl.DisplayNames(['zh-CN'], { type: 'region' })
const countries = countryResponse[1].filter(c => c.region.id !== 'NA').map(c => ({
  id: c.id, iso2: c.iso2Code, name: { en: c.name, zh: names.of(c.iso2Code) || c.name },
  region: c.region.value,
})).sort((a, b) => a.id.localeCompare(b.id))
const ids = new Set(countries.map(c => c.id))
const startYear = 1960, endYear = 2025
const values = Object.fromEntries(countries.map(c => [c.id, Array(endYear - startYear + 1).fill(null)]))
const seen = new Set()
for (const r of response[1]) {
  if (!ids.has(r.countryiso3code)) continue // Exclude income groups and regional aggregates.
  assert.equal(r.indicator.id, 'FP.CPI.TOTL.ZG')
  const year = Number(r.date)
  assert.ok(Number.isInteger(year) && year >= startYear && year <= endYear)
  assert.ok(r.value === null || Number.isFinite(r.value))
  const key = `${r.countryiso3code}/${year}`
  assert.ok(!seen.has(key), `Duplicate observation ${key}`)
  seen.add(key)
  values[r.countryiso3code][year - startYear] = r.value
}
assert.equal(seen.size, countries.length * (endYear - startYear + 1))
const indicator = indicatorResponse[1].find(r => r.id === 'FP.CPI.TOTL.ZG')
assert.ok(indicator)
const metadata = {
  provider: 'World Bank · World Development Indicators', indicator: indicator.id,
  title: indicator.name, definition: indicator.sourceNote, originalSource: indicator.sourceOrganization,
  unit: '%', frequency: 'annual', retrievedAt: new Date().toISOString().slice(0, 10),
  sourceUpdatedAt: response[0].lastupdated, license: 'CC BY 4.0',
  url: 'https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG',
  apiUrl: 'https://api.worldbank.org/v2/country/all/indicator/FP.CPI.TOTL.ZG?format=json&per_page=20000&date=1960:2025',
  countriesUrl: 'https://api.worldbank.org/v2/country?format=json&per_page=400',
  startYear, endYear, status: 'published historical data; no forecasts',
}
// Keep the provider's geometry and names, joining only explicit WB / ISO identifiers.
const features = geo.features.filter(f => f.properties.ADM0_A3 !== 'ATA').map(f => {
  const p = f.properties
  // Natural Earth uses KSV for Kosovo; the current World Bank API uses XKX.
  const aliases = { KSV: 'XKX' }
  const id = [aliases[p.WB_A3], p.WB_A3, p.ISO_A3_EH, p.ADM0_A3].find(id => ids.has(id)) || null
  return { type: 'Feature', id: p.ADM0_A3, properties: { countryId: id, name: { en: p.NAME_EN, zh: p.NAME_ZH } }, geometry: f.geometry }
})
const map = { type: 'FeatureCollection', metadata: {
  provider: 'Natural Earth', version: '5.1.2', scale: '1:110m', license: 'Public domain',
  url: 'https://www.naturalearthdata.com/about/terms-of-use/',
  downloadUrl: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_110m_admin_0_countries.geojson',
}, features }
await writeFile(new URL('../data/inflation/worldbank.json', import.meta.url), JSON.stringify({ metadata, values }) + '\n')
await writeFile(new URL('../data/countries/metadata.json', import.meta.url), JSON.stringify(countries, null, 2) + '\n')
await writeFile(new URL('../data/countries/world.geo.json', import.meta.url), JSON.stringify(map) + '\n')
console.log(`Imported ${countries.length} countries/economies, ${seen.size} yearly slots, ${features.length} map features.`)
