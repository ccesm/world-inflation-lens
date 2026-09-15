export function futurePower(amount, inflation, years) {
  if (![amount, inflation, years].every(Number.isFinite) || amount < 0 || inflation <= -100 || years < 0) return null
  const value = amount / (1 + inflation / 100) ** years
  return Number.isFinite(value) ? value : null
}

export function purchasingPower(points, baseDate) {
  const base = points.find(p => p.date === baseDate)?.value
  return points.filter(p => p.date >= baseDate).map(p => ({ date: p.date, value: base > 0 && p.value > 0 ? 100 * base / p.value : null }))
}

// Debt ratio accounting identity; primary deficit is positive. No stock-flow adjustments.
export function debtPath({ debt, rate, growth, primary, years }) {
  if (![debt, rate, growth, primary, years].every(Number.isFinite) || debt < 0 || rate <= -100 || growth <= -100 || years < 0 || years > 50 || !Number.isInteger(years)) return []
  const points = [{ year: 0, value: debt }]
  for (let year = 1; year <= years; year++) {
    const value = points.at(-1).value * (1 + rate / 100) / (1 + growth / 100) + primary
    if (!Number.isFinite(value)) return []
    points.push({ year, value })
  }
  return points
}

export function relativePrice(points, cpi, baseDate, real = false) {
  const lookup = new Map(cpi.map(p => [p.date, p.value]))
  const base = points.find(p => p.date === baseDate)?.value
  const baseCpi = lookup.get(baseDate)
  return points.filter(p => p.date >= baseDate).map(p => ({ date: p.date, value: p.value > 0 && base > 0 && (!real || (lookup.get(p.date) > 0 && baseCpi > 0)) ? p.value / base * 100 * (real ? baseCpi / lookup.get(p.date) : 1) : null }))
}
