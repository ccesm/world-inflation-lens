import fs from 'node:fs'
import path from 'node:path'
import { contentHash } from '../../research/signal-engine/engine/core.mjs'

const allowed = /^(?:(accepted|engine|contexts|interpretations|projections|runs|ledgers)\/[a-f0-9]{64}\.json|status(?:\.previous)?\.json)$/
export class PrivateArchive {
  constructor({ repository, token, branch = 'signal-shadow', request = fetch }) {
    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository || '') || repository.toLowerCase() === 'ccesm/world-inflation-lens' || !token || branch !== 'signal-shadow') throw Error('RESTRICTED_ARCHIVE_CONFIGURATION_REQUIRED')
    this.repository = repository; this.token = token; this.branch = branch; this.request = request
  }
  async api(suffix, method = 'GET', body, missing = false) {
    const response = await this.request(`https://api.github.com/repos/${this.repository}${suffix}`, {
      method, headers: { Authorization: `Bearer ${this.token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(30000),
    })
    if (missing && response.status === 404) return null
    if (!response.ok) throw Error('PRIVATE_ARCHIVE_REQUEST_FAILED')
    return response.json()
  }
  async verifyPrivate() {
    const metadata = await this.api('')
    if (metadata.private !== true || metadata.full_name?.toLowerCase() !== this.repository.toLowerCase()) throw Error('ARCHIVE_MUST_BE_PRIVATE')
    return metadata
  }
  async restore(store) {
    await this.verifyPrivate()
    this.ref = await this.api(`/git/ref/heads/${this.branch}`, 'GET', null, true)
    this.entries = new Map()
    if (!this.ref) return
    const tree = await this.api(`/git/trees/${this.ref.object.sha}?recursive=1`)
    if (tree.truncated) throw Error('PRIVATE_ARCHIVE_TREE_TRUNCATED')
    const files = tree.tree.filter(entry => entry.type === 'blob')
    if (files.some(entry => !allowed.test(entry.path) || entry.mode !== '100644') || files.length > 30000) throw Error('UNEXPECTED_PRIVATE_ARCHIVE_CONTENT')
    store.initialize()
    let bytesTotal = 0
    for (const entry of files) {
      const blob = await this.api(`/git/blobs/${entry.sha}`)
      if (blob.encoding !== 'base64') throw Error('INVALID_PRIVATE_ARCHIVE_BLOB')
      const bytes = Buffer.from(blob.content, 'base64')
      bytesTotal += bytes.length
      if (bytes.length > 25_000_000 || bytesTotal > 250_000_000) throw Error('PRIVATE_ARCHIVE_SIZE_LIMIT')
      const parsed = JSON.parse(bytes)
      if (entry.path.startsWith('status')) store.atomicPointer(entry.path, parsed)
      else {
        const [category, file] = entry.path.split('/')
        if (store.immutable(category, parsed) !== file.slice(0, -5)) throw Error('PRIVATE_ARCHIVE_HASH_MISMATCH')
      }
      this.entries.set(entry.path, entry.sha)
    }
    this.restoredPointer = store.readState()?.pointer || null
  }
  async publish(store) {
    await this.verifyPrivate()
    // Publication is append-only for artifacts and optimistic for the pointer.
    // A concurrent ref advance fails; no forced update or stale overwrite.
    const current = await this.api(`/git/ref/heads/${this.branch}`, 'GET', null, true)
    if ((current?.object.sha || null) !== (this.ref?.object.sha || null)) throw Error('PRIVATE_ARCHIVE_CONCURRENT_ADVANCE')
    const state = store.readState()
    if (!state?.pointer) throw Error('NO_VALID_LOCAL_SHADOW_LEDGER')
    const treeEntries = []
    for (const folder of ['accepted', 'engine', 'contexts', 'interpretations', 'projections', 'runs', 'ledgers']) {
      const directory = path.join(store.root, folder)
      if (!fs.existsSync(directory)) continue
      for (const file of fs.readdirSync(directory)) {
        const relative = folder + '/' + file
        if (file.startsWith('.temporary-')) continue
        if (!allowed.test(relative)) throw Error('UNEXPECTED_LOCAL_ARCHIVE_CONTENT')
        const hash = file.slice(0, -5), object = store.read(folder, hash)
        if (!this.entries?.has(relative)) treeEntries.push({ path: relative, mode: '100644', type: 'blob', content: JSON.stringify(object) + '\n' })
      }
    }
    // Preserve canonical bytes: the immutable digest is over canonical JSON,
    // not Git's blob-object hash or insertion-order serialization.
    for (const entry of treeEntries) entry.content = fs.readFileSync(path.join(store.root, entry.path), 'utf8')
    for (const name of ['status.previous.json', 'status.json']) if (fs.existsSync(path.join(store.root, name))) treeEntries.push({ path: name, mode: '100644', type: 'blob', content: fs.readFileSync(path.join(store.root, name), 'utf8') })
    let parent = current?.object.sha
    if (!parent) {
      const metadata = await this.verifyPrivate()
      parent = (await this.api(`/git/ref/heads/${metadata.default_branch}`)).object.sha
    }
    const prior = await this.api(`/git/commits/${parent}`)
    const tree = await this.api('/git/trees', 'POST', { ...(current ? { base_tree: prior.tree.sha } : {}), tree: treeEntries })
    const commit = await this.api('/git/commits', 'POST', { message: 'Record restricted Signal Engine shadow outcome', tree: tree.sha, parents: [parent] })
    if (current) await this.api(`/git/refs/heads/${this.branch}`, 'PATCH', { sha: commit.sha, force: false })
    else await this.api('/git/refs', 'POST', { ref: `refs/heads/${this.branch}`, sha: commit.sha })
    this.ref = { object: { sha: commit.sha } }
    return { result: 'RESTRICTED_ARCHIVE_PUBLISHED', ledgerHash: state.pointer.ledgerHash }
  }
}
