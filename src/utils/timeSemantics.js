// Retain upstream precision; never turn a publication/retrieval date into an observation.
export function temporalValue(value, semantics = 'unspecified', precision) {
  if (!value) return { value: null, precision: 'unknown', semantics }
  const inferred = /^\d{4}-Q[1-4]$/.test(value) ? 'quarter'
    : /^\d{4}$/.test(value) ? 'year' : /^\d{4}-\d{2}$/.test(value) ? 'month'
      : /^\d{4}-\d{2}-\d{2}$/.test(value) ? 'date'
        : /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value)) ? 'timestamp' : 'source_text'
  return { value, precision: precision || inferred, semantics }
}

export function fredUpdateTime(raw) {
  // FRED's text field can include a US timezone. Unrecognized text stays text, not a guessed instant.
  const match = raw?.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)\s+(CDT|CST|EDT|EST|UTC)$/i)
  if (!match) return temporalValue(raw, 'FRED distributor Last Updated field')
  const [, date, h, m, s = '00', ampm, zone] = match
  const hour = Number(h) % 12 + (ampm.toUpperCase() === 'PM' ? 12 : 0)
  const offsets = { CDT: '-05:00', CST: '-06:00', EDT: '-04:00', EST: '-05:00', UTC: '+00:00' }
  const iso = new Date(`${date}T${String(hour).padStart(2, '0')}:${m}:${s}${offsets[zone.toUpperCase()]}`).toISOString()
  return { ...temporalValue(iso, 'FRED distributor Last Updated field'), original: raw }
}

export function observationTime(source) {
  const value = source.observationDate ?? source.observations?.findLast(p => Number.isFinite(p.value))?.date ?? null
  const quarterly = source.frequency === 'quarterly' && value
  return temporalValue(quarterly ? `${value.slice(0, 4)}-Q${Math.floor((Number(value.slice(5, 7)) - 1) / 3) + 1}` : value,
    source.periodBasis || (source.frequency?.startsWith('annual') ? 'source year / fiscal-year label' : 'period of the observation'), quarterly ? 'quarter' : undefined)
}
