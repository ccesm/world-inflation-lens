// Decorative previews only; these shapes are not measured inflation data.
export function CpiChartPlaceholder() {
  return <div className="chart-art"><div className="chart-grid" /><svg viewBox="0 0 700 280" preserveAspectRatio="none"><path d="M0 235 L70 226 L130 213 L185 220 L240 195 L290 180 L350 188 L405 156 L470 163 L525 110 L585 125 L640 70 L700 42" /></svg></div>
}

export function InflationMapPlaceholder() {
  return <div className="map-art"><span>◌</span><span>◌</span><span>◌</span><span>◌</span><span>◌</span></div>
}
