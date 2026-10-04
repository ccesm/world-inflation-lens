import { defineConfig } from 'vite'
import { workingSignalInputHash } from './scripts/lib/signalInputIdentity.mjs'
import { verifyPublicIdentity } from './scripts/lib/signalPublicIntegrity.mjs'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const version = JSON.parse(readFileSync(new URL('./package.json', import.meta.url))).version
let commit = null
try { commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() } catch { /* Archive builds have no Git metadata. */ }

let signalInputHash = null
try { signalInputHash = workingSignalInputHash(process.cwd()) } catch { /* Archive builds fail closed to an unavailable interpretation. */ }
let signalPublicIdentity = null
try { signalPublicIdentity = verifyPublicIdentity({ repo: process.cwd() }) } catch (error) {
  if (commit) throw error
  // Git archives cannot prove accepted-snapshot identity. The browser will
  // show UNAVAILABLE, while the rest of the application can still build.
}

export default defineConfig({
  base: '/world-inflation-lens/',
  define: {
    __SIGNAL_INPUT_HASH__: JSON.stringify(signalInputHash),
    __SIGNAL_PUBLIC_ARTIFACT_SHA256__: JSON.stringify(signalPublicIdentity?.artifactSha256 || null),
    __SIGNAL_PUBLIC_EXPECTED_STATUS__: JSON.stringify(signalPublicIdentity?.status || null),
    __SIGNAL_PUBLIC_EXPECTED_SNAPSHOT__: JSON.stringify(signalPublicIdentity?.snapshotCommit || null),
    __APP_VERSION__: JSON.stringify(version),
    __CODE_COMMIT__: JSON.stringify(process.env.WIL_CODE_COMMIT || commit),
    __SNAPSHOT_COMMIT__: JSON.stringify(process.env.WIL_SNAPSHOT_COMMIT || commit),
    __SYSTEM_STATUS_URL__: JSON.stringify('https://raw.githubusercontent.com/ccesm/world-inflation-lens/system-status/system-status.json'),
  },
  build: {
    rollupOptions: { output: { manualChunks: { 'productivity-data': ['./data/productivity/series.json'], 'external-data': ['./data/external/gpr.json', './data/external/gscpi.json', './data/external/fao-food.json', './data/external/sipri-military.json'], 'global-data': ['./src/data/globalInflation.js'], 'driver-data': ['./data/inflation/drivers.json'], 'monitor-data': ['./data/inflation/monitor.json'] } } },
  },
})
