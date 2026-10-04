export const appVersion = typeof __APP_VERSION__ === 'undefined' ? 'unknown' : __APP_VERSION__
export const codeCommit = typeof __CODE_COMMIT__ === 'undefined' ? null : __CODE_COMMIT__
export const snapshotCommit = typeof __SNAPSHOT_COMMIT__ === 'undefined' ? null : __SNAPSHOT_COMMIT__
export const systemStatusUrl = typeof __SYSTEM_STATUS_URL__ === 'undefined' ? null : __SYSTEM_STATUS_URL__

export const signalInputHash = typeof __SIGNAL_INPUT_HASH__ === 'undefined' ? null : __SIGNAL_INPUT_HASH__
export const signalPublicArtifactSha256 = typeof __SIGNAL_PUBLIC_ARTIFACT_SHA256__ === 'undefined' ? null : __SIGNAL_PUBLIC_ARTIFACT_SHA256__
export const signalPublicExpectedStatus = typeof __SIGNAL_PUBLIC_EXPECTED_STATUS__ === 'undefined' ? null : __SIGNAL_PUBLIC_EXPECTED_STATUS__
export const signalPublicExpectedSnapshot = typeof __SIGNAL_PUBLIC_EXPECTED_SNAPSHOT__ === 'undefined' ? null : __SIGNAL_PUBLIC_EXPECTED_SNAPSHOT__
