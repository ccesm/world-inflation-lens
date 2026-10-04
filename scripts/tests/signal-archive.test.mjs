import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { PrivateArchive } from '../signal-engine/private-archive.mjs'
import { RestrictedStore } from '../signal-engine/store.mjs'
import { serialize } from '../../research/signal-engine/engine/core.mjs'

const response = (object, status = 200) => new Response(JSON.stringify(object), { status })
function mocked({ isPrivate = true, advance = false, writeFail = false, forged = false } = {}) {
  const calls = [], objects = new Map(), head = 'a'.repeat(40)
  const request = async (url, options) => {
    const suffix = url.split('/repos/private-owner/private-archive')[1]; calls.push({ suffix, method: options.method, body: options.body ? JSON.parse(options.body) : null })
    if (suffix === '') return response({ private: isPrivate, full_name: 'private-owner/private-archive', default_branch: 'main' })
    if (suffix === '/git/ref/heads/signal-shadow') return response({ object: { sha: advance && calls.filter(c => c.suffix === suffix).length > 1 ? 'b'.repeat(40) : head } })
    if (suffix?.startsWith('/git/trees/') && options.method === 'GET') return response({ truncated: false, tree: forged ? [{ path: 'public/secrets.json', type: 'blob', mode: '100644', sha: head }] : [] })
    if (suffix === '/git/commits/' + head) return response({ tree: { sha: 'c'.repeat(40) } })
    if (suffix === '/git/trees' && options.method === 'POST') return response({ sha: 'd'.repeat(40) })
    if (suffix === '/git/commits' && options.method === 'POST') return response({ sha: 'e'.repeat(40) })
    if (suffix === '/git/refs/heads/signal-shadow') return response({}, writeFail ? 422 : 200)
    throw Error('UNEXPECTED_MOCK_ARCHIVE_REQUEST:' + suffix)
  }
  return { archive: new PrivateArchive({ repository: 'private-owner/private-archive', token: 'MOCK_SECRET_NEVER_LOGGED', request }), calls }
}
function tempStore() { return new RestrictedStore(fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'wil-private-archive-test-'))) }
test('ARCHIVE public or production repository is forbidden', async () => {
  assert.throws(() => new PrivateArchive({ repository: 'ccesm/world-inflation-lens', token: 'mock' }), /CONFIGURATION/)
  const m = mocked({ isPrivate: false }), store = tempStore()
  try { await assert.rejects(m.archive.restore(store), /MUST_BE_PRIVATE/); assert.equal(m.calls.length, 1) } finally { fs.rmSync(store.root, { recursive: true, force: true }) }
})
test('ARCHIVE unexpected private tree paths rejected before restoration', async () => {
  const m = mocked({ forged: true }), store = tempStore()
  try { await assert.rejects(m.archive.restore(store), /UNEXPECTED/); assert.equal(fs.readdirSync(store.root).length, 0) } finally { fs.rmSync(store.root, { recursive: true, force: true }) }
})
test('ARCHIVE concurrent ref advance cannot overwrite a newer outcome', async () => {
  const m = mocked({ advance: true }), store = tempStore()
  try { await m.archive.restore(store); await assert.rejects(m.archive.publish(store), /CONCURRENT/); assert(!m.calls.some(c => c.method !== 'GET')) } finally { fs.rmSync(store.root, { recursive: true, force: true }) }
})
for (const writeFail of [false, true]) test(`ARCHIVE immutable canonical publication and non-force pointer ${writeFail ? 'failure' : 'success'}`, async () => {
  const m = mocked({ writeFail }), store = tempStore()
  try {
    await m.archive.restore(store)
    store.immutable('runs', { z: 1, a: 'private fixture' })
    store.promote({ schemaVersion: 'signal-shadow-status/1', fixture: true })
    if (writeFail) await assert.rejects(m.archive.publish(store), /REQUEST_FAILED/)
    else assert.equal((await m.archive.publish(store)).result, 'RESTRICTED_ARCHIVE_PUBLISHED')
    const tree = m.calls.find(c => c.method === 'POST' && c.suffix === '/git/trees').body.tree
    assert.equal(tree.find(e => e.path.startsWith('runs/')).content, serialize({ z: 1, a: 'private fixture' }))
    assert.equal(m.calls.find(c => c.method === 'PATCH').body.force, false)
    assert(!JSON.stringify(tree).includes('MOCK_SECRET_NEVER_LOGGED'))
  } finally { fs.rmSync(store.root, { recursive: true, force: true }) }
})
test('ARCHIVE private publish/restore round trip preserves exact canonical bytes and committed pointer', async () => {
  const origin = tempStore(), destination = tempStore(), blobs = new Map(), commits = new Map(), trees = new Map()
  let head = 'a'.repeat(40)
  commits.set(head, { tree: { sha: 'b'.repeat(40) } }); trees.set('b'.repeat(40), [])
  const oid = bytes => createHash('sha1').update(bytes).digest('hex')
  const request = async (url, options) => {
    const endpoint = url.split('/repos/private-owner/private-archive')[1]
    const body = options.body ? JSON.parse(options.body) : null
    if (endpoint === '') return response({ private: true, full_name: 'private-owner/private-archive', default_branch: 'main' })
    if (endpoint === '/git/ref/heads/signal-shadow') return response({ object: { sha: head } })
    if (endpoint.startsWith('/git/commits/') && options.method === 'GET') return response(commits.get(endpoint.split('/').at(-1)))
    if (endpoint.startsWith('/git/trees/') && options.method === 'GET') return response({ truncated: false, tree: trees.get(commits.get(head).tree.sha) })
    if (endpoint.startsWith('/git/blobs/')) return response({ encoding: 'base64', content: Buffer.from(blobs.get(endpoint.split('/').at(-1))).toString('base64') })
    if (endpoint === '/git/trees' && options.method === 'POST') {
      const entries = body.tree.map(entry => { const sha = oid(entry.content); blobs.set(sha, entry.content); return { path: entry.path, mode: entry.mode, type: entry.type, sha } })
      const sha = oid(JSON.stringify(entries)); trees.set(sha, entries); return response({ sha })
    }
    if (endpoint === '/git/commits' && options.method === 'POST') { const sha = oid(JSON.stringify(body)); commits.set(sha, { tree: { sha: body.tree } }); return response({ sha }) }
    if (endpoint === '/git/refs/heads/signal-shadow' && options.method === 'PATCH') { assert.equal(body.force, false); head = body.sha; return response({}) }
    throw Error('UNEXPECTED_ROUNDTRIP_REQUEST')
  }
  try {
    const archive = new PrivateArchive({ repository: 'private-owner/private-archive', token: 'MOCK_TOKEN', request })
    await archive.restore(origin)
    const payload = { exact: 'private research fixture', null: null }
    const hash = origin.immutable('engine', payload)
    origin.promote({ schemaVersion: 'signal-shadow-status/1', lastValidArtifactHash: hash })
    await archive.publish(origin)
    const fresh = new PrivateArchive({ repository: 'private-owner/private-archive', token: 'MOCK_TOKEN', request })
    await fresh.restore(destination)
    assert.equal(fs.readFileSync(destination.location('engine', hash), 'utf8'), serialize(payload))
    assert.deepEqual(destination.readState().pointer, origin.readState().pointer)
  } finally { fs.rmSync(origin.root, { recursive: true, force: true }); fs.rmSync(destination.root, { recursive: true, force: true }) }
})
test('ARCHIVE temporary diagnostic/local files cannot enter the restricted persistent tree', async () => {
  const m = mocked(), store = tempStore()
  try {
    await m.archive.restore(store); store.promote({ schemaVersion: 'signal-shadow-status/1' })
    fs.mkdirSync(path.join(store.root, 'runs'), { recursive: true })
    fs.writeFileSync(path.join(store.root, 'runs', 'private-diagnostic.txt'), 'DO_NOT_UPLOAD')
    await assert.rejects(m.archive.publish(store), /UNEXPECTED_LOCAL_ARCHIVE_CONTENT/)
    assert(!m.calls.some(c => c.method === 'POST'))
  } finally { fs.rmSync(store.root, { recursive: true, force: true }) }
})
