export function cboCsv({ metadata, observations }) {
  return ['fiscal_year,status,debt_held_by_public_pct_gdp,deficit_positive_pct_gdp,net_interest_pct_gdp,vintage,projection_published,source', ...observations.map(row => [
    row.year, row.status, row.debt, row.deficit, row.interest, metadata.vintage,
    row.status === 'projected' ? metadata.projectionPublishedAt : '',
    row.status === 'projected' ? metadata.projectionCsv : metadata.historicalCsv,
  ].join(','))].join('\r\n') + '\r\n'
}
