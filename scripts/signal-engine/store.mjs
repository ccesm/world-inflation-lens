import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { randomUUID } from 'node:crypto'
import { serialize, sha256 } from '../../research/signal-engine/engine/core.mjs'
import { ROOT, HASH } from './identity.mjs'

export const DEFAULT_STORE = path.join(ROOT, 'research/signal-engine/production-artifacts')
const categories = new Set(['accepted', 'engine', 'contexts', 'interpretations', 'projections', 'runs', 'ledgers'])
function noSymlinks(file) {
  for (let current = path.resolve(file); ; current = path.dirname(current)) {
    if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) throw Error('STORAGE_SYMLINK_REJECTED')
    if (current === path.dirname(current)) break
  }
}
export function restrictedRoot(root) {
  const absolute = path.resolve(root)
  noSymlinks(absolute)
  const inRepo = absolute === ROOT || absolute.startsWith(ROOT + path.sep)
  if (inRepo && absolute !== DEFAULT_STORE) throw Error('STORE_MUST_BE_ISOLATED')
  if (!inRepo && [os.homedir(), '/', '/tmp', '/private/tmp', os.tmpdir()].includes(absolute)) throw Error('DEDICATED_STORAGE_DIRECTORY_REQUIRED')
  if (fs.existsSync(absolute) && !fs.lstatSync(absolute).isDirectory()) throw Error('STORE_NOT_DIRECTORY')
  return absolute
}
function syncDirectory(folder) {
  const fd = fs.openSync(folder, 'r')
  try { fs.fsyncSync(fd) } finally { fs.closeSync(fd) }
}
export class RestrictedStore {
  constructor(root = DEFAULT_STORE, { fault = () => {} } = {}) {
    this.root = restrictedRoot(root)
    this.fault = fault
  }
  initialize() {
    fs.mkdirSync(this.root, { recursive: true, mode: 0o700 })
    fs.chmodSync(this.root, 0o700)
  }
  location(category, hash) {
    if (!categories.has(category) || !HASH.test(hash || '')) throw Error('INVALID_STORE_REFERENCE')
    const folder = path.join(this.root, category)
    noSymlinks(folder)
    return path.join(folder, hash + '.json')
  }
  has(category, hash) { return fs.existsSync(this.location(category, hash)) }
  read(category, hash) {
    const file = this.location(category, hash)
    noSymlinks(file)
    const bytes = fs.readFileSync(file, 'utf8')
    if (sha256(bytes) !== hash) throw Error('STORED_ARTIFACT_HASH_MISMATCH')
    const object = JSON.parse(bytes)
    if (serialize(object) !== bytes) throw Error('NONCANONICAL_STORED_ARTIFACT')
    return object
  }
  immutable(category, object, validate = () => {}) {
    validate(object)
    const bytes = serialize(object), hash = sha256(bytes), file = this.location(category, hash)
    this.initialize()
    const folder = path.dirname(file)
    fs.mkdirSync(folder, { recursive: true, mode: 0o700 })
    fs.chmodSync(folder, 0o700)
    if (fs.existsSync(file)) {
      if (fs.readFileSync(file, 'utf8') !== bytes) throw Error('IMMUTABLE_ARTIFACT_CONFLICT')
      this.read(category, hash)
      return hash
    }
    const temporary = path.join(folder, '.temporary-' + randomUUID())
    let fd
    try {
      fd = fs.openSync(temporary, 'wx', 0o600)
      fs.writeFileSync(fd, bytes)
      fs.fsyncSync(fd)
      fs.closeSync(fd); fd = undefined
      this.fault('immutable:' + category)
      // Hard-link promotion is atomic and cannot overwrite an existing digest.
      try { fs.linkSync(temporary, file) } catch (error) {
        if (error.code !== 'EEXIST' || fs.readFileSync(file, 'utf8') !== bytes) throw error
      }
      syncDirectory(folder)
      this.read(category, hash)
      return hash
    } finally {
      if (fd !== undefined) fs.closeSync(fd)
      fs.rmSync(temporary, { force: true })
    }
  }
  atomicPointer(name, pointer) {
    if (!['status.json', 'status.previous.json'].includes(name)) throw Error('INVALID_POINTER_NAME')
    this.initialize()
    const target = path.join(this.root, name), temporary = path.join(this.root, '.temporary-' + randomUUID())
    noSymlinks(target)
    let fd
    try {
      fd = fs.openSync(temporary, 'wx', 0o600)
      fs.writeFileSync(fd, serialize(pointer)); fs.fsyncSync(fd); fs.closeSync(fd); fd = undefined
      this.fault('pointer:' + name)
      fs.renameSync(temporary, target)
      syncDirectory(this.root)
    } finally {
      if (fd !== undefined) fs.closeSync(fd)
      fs.rmSync(temporary, { force: true })
    }
  }
  readPointer(name = 'status.json') {
    const file = path.join(this.root, name)
    if (!fs.existsSync(file)) return null
    noSymlinks(file)
    const pointer = JSON.parse(fs.readFileSync(file, 'utf8'))
    if (pointer.schemaVersion !== 'signal-shadow-pointer/1' || Object.keys(pointer).sort().join(',') !== 'ledgerHash,schemaVersion' || !HASH.test(pointer.ledgerHash || '')) throw Error('INVALID_STATUS_POINTER')
    const ledger = this.read('ledgers', pointer.ledgerHash)
    if (ledger.schemaVersion !== 'signal-shadow-status/1') throw Error('INVALID_STATUS_LEDGER')
    return { pointer, ledger }
  }
  readState() {
    try {
      const current = this.readPointer()
      if (current) return { ...current, recovered: false }
      const backup = this.readPointer('status.previous.json')
      return backup ? { ...backup, recovered: true } : { recovered: false }
    } catch {
      // Only a previously committed pointer can recover a damaged head. An
      // orphan artifact/ledger is never auto-promoted because its date is newer.
      const backup = this.readPointer('status.previous.json')
      if (!backup) throw Error('UNRECOVERABLE_STATUS_LEDGER')
      return { ...backup, recovered: true }
    }
  }
  promote(ledger) {
    const hash = this.immutable('ledgers', ledger)
    const previous = this.readState()
    if (previous?.pointer) this.atomicPointer('status.previous.json', previous.pointer)
    this.atomicPointer('status.json', { schemaVersion: 'signal-shadow-pointer/1', ledgerHash: hash })
    return hash
  }
  lock() {
    this.initialize()
    const folder = path.join(this.root, '.lock'), ownerFile = path.join(folder, 'owner.json')
    noSymlinks(folder)
    const owner = { pid: process.pid, host: os.hostname(), token: randomUUID() }
    try { fs.mkdirSync(folder, { mode: 0o700 }) } catch (error) {
      if (error.code !== 'EEXIST') throw error
      let prior
      try { prior = JSON.parse(fs.readFileSync(ownerFile, 'utf8')) } catch { throw Error('INCOMPLETE_STORAGE_LOCK') }
      // Never break an unknown/remote/live lock solely because it is old.
      if (prior.host !== owner.host || !Number.isSafeInteger(prior.pid)) throw Error('STORAGE_LOCKED')
      try { process.kill(prior.pid, 0); throw Error('STORAGE_LOCKED') } catch (e) { if (e.code !== 'ESRCH') throw e }
      fs.rmSync(folder, { recursive: true }); fs.mkdirSync(folder, { mode: 0o700 })
    }
    fs.writeFileSync(ownerFile, serialize(owner), { mode: 0o600, flag: 'wx' })
    // Interrupted temporary writes never serve as artifacts or valid pointers.
    for (const dir of [this.root, ...[...categories].map(c => path.join(this.root, c))]) {
      if (!fs.existsSync(dir)) continue
      for (const name of fs.readdirSync(dir)) if (name.startsWith('.temporary-')) fs.rmSync(path.join(dir, name), { force: true })
    }
    return () => {
      const current = JSON.parse(fs.readFileSync(ownerFile, 'utf8'))
      if (current.token !== owner.token) throw Error('STORAGE_LOCK_OWNER_CHANGED')
      fs.rmSync(folder, { recursive: true }); syncDirectory(this.root)
    }
  }
}
