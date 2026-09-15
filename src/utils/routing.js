export const primaryRoutes = ['home', 'monitor', 'scenarios', 'fiscal', 'regimes', 'since-1971']
export const referenceRoutes = ['drivers', 'us-cpi', 'timeline', 'overview', 'map', 'sources']
export const routes = [...primaryRoutes, ...referenceRoutes]

export function routeFromHash() {
  const route = window.location.hash.slice(2).split('?')[0]
  return routes.includes(route) ? route : 'home'
}
