export const routes = ['home', 'overview', 'timeline', 'us-cpi', 'map', 'sources']

export function routeFromHash() {
  const route = window.location.hash.slice(2).split('?')[0]
  return routes.includes(route) ? route : 'home'
}
