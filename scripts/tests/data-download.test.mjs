import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createServer } from 'node:http'
import { downloadData } from '../lib/data-download.mjs'

const url = 'https://api.worldbank.org/v2/country?format=json&per_page=400'
const quiet = { log() {} }

test('transient failures recover with backoff and preserve JSON and headers', async () => {
  const delays = [], logs = []
  let calls = 0
  const value = await downloadData(url, {
    json: true,
    headers: { 'User-Agent': 'WorldInflationLens/test' },
    log: line => logs.push(line),
    wait: async ms => { delays.push(ms) },
    fetchImpl: async (actualUrl, options) => {
      assert.equal(actualUrl, url)
      assert.equal(options.headers['User-Agent'], 'WorldInflationLens/test')
      if (++calls === 1) throw new DOMException('Timed out', 'TimeoutError')
      if (calls === 2) return new Response('Unavailable', { status: 503 })
      return Response.json([{ pages: 1 }, [{ id: 'USA' }]])
    },
  })
  assert.deepEqual(value, [{ pages: 1 }, [{ id: 'USA' }]])
  assert.deepEqual(delays, [2000, 4000])
  assert.ok(logs.some(line => line.includes('timeout 60000ms')))
  assert.ok(logs.some(line => line.includes('timeout 120000ms')))
  assert.ok(logs.some(line => line.includes('timeout 180000ms')))
  assert.ok(logs.some(line => line.includes(url) && line.includes('TimeoutError')))
})

test('persistent timeout reports URL, attempt count and original cause', async () => {
  const failure = new DOMException('The operation was aborted due to timeout', 'TimeoutError')
  let calls = 0
  await assert.rejects(downloadData(url, {
    ...quiet,
    wait: async () => {},
    fetchImpl: async () => { calls++; throw failure },
  }), error => {
    assert.ok(error.message.includes(url))
    assert.match(error.message, /after 3 attempt\(s\).*TimeoutError/)
    assert.equal(error.cause, failure)
    return true
  })
  assert.equal(calls, 3)
})

test('permanent HTTP errors stop immediately and cancel the body', async () => {
  let cancelled = false
  await assert.rejects(downloadData(url, {
    ...quiet,
    wait: async () => assert.fail('must not retry a 404'),
    fetchImpl: async () => new Response(new ReadableStream({ cancel() { cancelled = true } }), { status: 404 }),
  }), /after 1 attempt\(s\).*HTTP 404/)
  assert.equal(cancelled, true)
})

test('rate limits respect Retry-After', async () => {
  let calls = 0
  const delays = []
  assert.equal(await downloadData(url, {
    ...quiet,
    wait: async ms => { delays.push(ms) },
    fetchImpl: async () => ++calls === 1
      ? new Response('Rate limited', { status: 429, headers: { 'Retry-After': '10' } })
      : new Response('ok'),
  }), 'ok')
  assert.deepEqual(delays, [10000])
})

test('interrupted response bodies retry and preserve valid text', async () => {
  let calls = 0
  assert.equal(await downloadData('https://fred.stlouisfed.org/data/CPIAUCNS', {
    ...quiet,
    wait: async () => {},
    fetchImpl: async () => ++calls === 1
      ? new Response(new ReadableStream({ start(controller) { controller.error(new TypeError('terminated')) } }))
      : new Response('<table>official data</table>'),
  }), '<table>official data</table>')
  assert.equal(calls, 2)
})

test('real stalled response body is aborted by the request deadline', async () => {
  let calls = 0
  const server = createServer((_request, response) => {
    calls++
    response.writeHead(200, { 'Content-Type': 'application/json' })
    response.flushHeaders()
    response.write('[{')
    // Deliberately leave the body unfinished until the client aborts.
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  try {
    await assert.rejects(downloadData(`http://127.0.0.1:${server.address().port}/stalled`, {
      ...quiet, json: true, timeoutMs: 250, wait: async () => {},
    }), /after 3 attempt\(s\).*(TimeoutError|AbortError)/)
    assert.equal(calls, 3)
  } finally {
    server.closeAllConnections()
    await new Promise(resolve => server.close(resolve))
  }
})

test('a slow response succeeds on retry with the longer deadline', async () => {
  let calls = 0
  const server = createServer((_request, response) => {
    calls++
    response.writeHead(200, { 'Content-Type': 'application/json' })
    response.flushHeaders()
    if (calls > 1) {
      const timer = setTimeout(() => response.end('{"complete":true}'), 350)
      response.on('close', () => clearTimeout(timer))
    }
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  try {
    const value = await downloadData(`http://127.0.0.1:${server.address().port}/slow`, {
      ...quiet, json: true, timeoutMs: 250, wait: async () => {},
    })
    assert.deepEqual(value, { complete: true })
    assert.equal(calls, 2)
  } finally {
    server.closeAllConnections()
    await new Promise(resolve => server.close(resolve))
  }
})
