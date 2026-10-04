import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
const hash = value => createHash('sha256').update(value).digest('hex')
// Same canonical {path,sha256} ordering as the accepted economic bundle.
export function workingSignalInputHash(repo) {
  const files = execFileSync('git', ['ls-tree', '-r', '--name-only', 'HEAD', 'data'], { cwd: repo, encoding: 'utf8' }).trim().split('\n').filter(Boolean).sort()
  const records = files.map(file => ({ path: file, sha256: hash(readFileSync(path.join(repo, file))) }))
  return hash(JSON.stringify(records) + '\n')
}
