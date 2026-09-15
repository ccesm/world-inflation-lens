// Import the official CBO long-format CSV contract; never infer a missing year.
export const cboFields = {
  debt: 'debt_held_by_public_gdp_share',
  deficit: 'deficit_total_gdp_share',
  interest: 'outlays_net_interest_gdp_share',
}

export function parseCbo(csv, schema, projected) {
  if (schema.dataset !== (projected ? 'long_term_budget' : 'historical_budget') || schema.frequency !== 'annual_fy') throw Error('Wrong CBO dataset or fiscal-year frequency')
  const prefix = projected ? 'lt_' : ''
  const fields = [...Object.values(cboFields), 'rev_total_gdp_share', 'outlays_total_gdp_share']
  for (const field of fields) if (schema.fields[prefix + field]?.unit !== '% of GDP') throw Error(`Wrong CBO units: ${field}`)
  const lines = csv.trim().split(/\r?\n/)
  if (lines.shift() !== 'date,variable,value') throw Error('Unexpected CBO CSV header')
  const values = new Map()
  for (const line of lines) {
    const cells = line.split(',')
    if (cells.length !== 3 || !/^FY\d{4}$/.test(cells[0]) || !/^-?\d+(\.\d+)?$/.test(cells[2])) throw Error('Invalid CBO observation')
    const [date, field, value] = cells, key = `${date}:${field}`
    if (values.has(key)) throw Error(`Duplicate CBO observation: ${key}`)
    values.set(key, Number(value))
  }
  const start = projected ? 2026 : 1962, end = projected ? 2056 : 2025
  const read = (year, field) => {
    const value = values.get(`FY${year}:${prefix}${field}`)
    if (!Number.isFinite(value)) throw Error(`Missing CBO observation: FY${year} ${field}`)
    return value
  }
  for (const key of values.keys()) {
    const [date, field] = key.split(':')
    if (fields.includes(field.replace(/^lt_/, '')) && (Number(date.slice(2)) < start || Number(date.slice(2)) > end)) throw Error('Unexpected CBO coverage; review the vintage')
  }
  return Array.from({ length: end - start + 1 }, (_, index) => {
    const year = start + index
    const balance = read(year, cboFields.deficit)
    // Source values are rounded to three decimals; allow their rounding error.
    if (Math.abs(read(year, 'rev_total_gdp_share') - read(year, 'outlays_total_gdp_share') - balance) > .003) throw Error(`CBO budget identity failed: ${year}`)
    const debt = read(year, cboFields.debt), interest = read(year, cboFields.interest)
    if (debt < 0 || interest < 0) throw Error('Unexpected negative debt or net interest')
    return { year, status: projected ? 'projected' : 'actual', debt, deficit: -balance || 0, interest }
  })
}
