import { setTimeout as sleep } from 'node:timers/promises'

// Keep the deadline active through body consumption, not just response headers.
export async function downloadData(url, {
  json = false,
  headers = {},
  timeoutMs = new URL(url).hostname === 'api.worldbank.org' ? 60000 : 30000,
  attempts = 3,
  retryDelayMs = 2000,
  fetchImpl = fetch,
  wait = sleep,
  log = console.log,
} = {}) {
  let failure
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const deadline = timeoutMs * attempt
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(new DOMException('Request deadline exceeded', 'TimeoutError')), deadline)
    let retryable = true
    let retryAfterMs = 0
    log(`[data:refresh] GET ${url} (attempt ${attempt}/${attempts}, timeout ${deadline}ms)`)
    try {
      const response = await fetchImpl(url, { headers, signal: controller.signal })
      if (!response.ok) {
        retryable = response.status === 408 || response.status === 429 || response.status >= 500
        const retryAfter = response.headers.get('retry-after')
        if (retryAfter !== null) {
          const seconds = Number(retryAfter)
          const delay = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(retryAfter) - Date.now()
          if (Number.isFinite(delay)) retryAfterMs = Math.max(0, Math.min(delay, 60000))
        }
        await response.body?.cancel()
        throw new Error(`HTTP ${response.status}`)
      }
      const value = json ? await response.json() : await response.text()
      log(`[data:refresh] OK ${url}`)
      return value
    } catch (error) {
      failure = error
      log(`[data:refresh] Failed ${url} (attempt ${attempt}/${attempts}): ${error.name}: ${error.message}`)
      if (!retryable || attempt === attempts) {
        throw new Error(`Data download failed: ${url} after ${attempt} attempt(s): ${error.name}: ${error.message}`, { cause: error })
      }
    } finally {
      clearTimeout(timer)
    }
    const delay = Math.max(retryAfterMs, retryDelayMs * 2 ** (attempt - 1))
    log(`[data:refresh] Retrying ${url} in ${delay}ms`)
    await wait(delay)
  }
  throw failure
}
