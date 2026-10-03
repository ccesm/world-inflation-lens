import { useSyncExternalStore } from 'react'

const navigationEvent = 'wil:navigation'
const currentHash = () => typeof window === 'undefined' ? '#/home' : window.location.hash
function subscribe(listener) {
  // pushState/replaceState emit neither hashchange nor popstate. Notify our
  // subscribers explicitly; native links and Back/Forward use native events.
  const events = ['hashchange', 'popstate', navigationEvent]
  events.forEach(event => window.addEventListener(event, listener))
  return () => events.forEach(event => window.removeEventListener(event, listener))
}
export function useNavigationHash() {
  return useSyncExternalStore(subscribe, currentHash, currentHash)
}
export function navigateHash(hash, { replace = false } = {}) {
  if (hash === currentHash()) return
  window.history[replace ? 'replaceState' : 'pushState'](window.history.state, '', hash)
  window.dispatchEvent(new Event(navigationEvent))
}
