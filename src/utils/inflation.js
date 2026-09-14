export function monthNumber(date) {
  const [year, month] = date.split('-').map(Number)
  return year * 12 + month - 1
}

// Look up the same calendar month, rather than skipping missing observations.
export function withAnnualChange(observations) {
  const values = new Map(observations.map(point => [point.date, point.value]))
  return observations.map(point => {
    const priorDate = `${Number(point.date.slice(0, 4)) - 1}${point.date.slice(4)}`
    const prior = values.get(priorDate)
    return { ...point, inflation: point.value != null && prior > 0 ? (point.value / prior - 1) * 100 : null }
  })
}

export function equivalentCost(amount, startIndex, endIndex) {
  if (!Number.isFinite(amount) || amount < 0 || !(startIndex > 0) || !(endIndex > 0)) return null
  return amount * endIndex / startIndex
}

export function rangeStart(lastDate, years) {
  return `${Number(lastDate.slice(0, 4)) - years}${lastDate.slice(4)}`
}

export function formatNumber(value, language, digits = 2) {
  return value == null ? '—' : new Intl.NumberFormat(language === 'zh' ? 'zh-CN' : 'en-US', {
    minimumFractionDigits: digits, maximumFractionDigits: digits,
  }).format(value)
}
