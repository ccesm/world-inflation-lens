export const primaryRoutes = ['home', 'dollar', 'fiscal', 'history', 'scenarios', 'research']
export const referenceRoutes = ['purchasing-power', 'monitor', 'regimes', 'since-1971', 'drivers', 'us-cpi', 'timeline', 'overview', 'map', 'sources', 'external-shocks', 'research/ai-productivity', 'research/digital-money', 'research/data', 'research/updates']
export const routes = [...primaryRoutes, ...referenceRoutes]
export const routeSection = route => route.startsWith('research/') ? 'research' : ({ monitor: 'dollar', 'purchasing-power': 'dollar', 'us-cpi': 'dollar', 'since-1971': 'dollar', regimes: 'history', timeline: 'history', drivers: 'research', overview: 'research', map: 'research', sources: 'research', 'external-shocks': 'research' })[route] || route
export function routeFromHash() {
  const route = window.location.hash.slice(2).split('?')[0]
  return routes.includes(route) ? route : 'home'
}
export function viewParameter(key, allowed, fallback) {
  const value = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.hash.split('?')[1]).get(key)
  return allowed.includes(value) ? value : fallback
}
