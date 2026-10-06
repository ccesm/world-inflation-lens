# Storage qualification and handoff

Local archive/hydration qualification passes. Permanent public durable placement
is still pending; no files may be untracked on this basis yet.

- Frozen stack: `09fcc21aad29c36697f4775048ad87694a1a8b61`.
- Archive: 112,015,360-byte deterministic USTAR, SHA-256
  `290a89de982b1249a5209130345eb55c2043639fd0b1c744da1969375c4b4337`.
- Embedded manifest SHA-256:
  `fc74265994b09f873ce5c945f57c3e672fc356d5514eefec74d5195769246e1d`.
- Complete path map: [reviewed lock](stack.lock.json), 507 paths / 356 objects.
- Payload: 154,599,037 original path bytes / 111,595,685 distinct object bytes.
- Evidence: [qualification record](qualification.json), 324 regression tests,
  14 archive-contract tests, two clean reconstructions, repeat byte-identical
  packaging, independent 507-file Git/tar/hydration comparison, partial-phase
  selection checks, application build/verify and preservation checks.

Local read-only copies are outside tracked files at:
`<original checkout>/.cache/ai-labor-archive-qualification-20261006/`.
This new directory does not replace or touch existing research caches. It
contains `wil-archive-507.tar`, `stack.lock.json` and a separate bounded
`qualification-evidence.tar` (raw logs and the exact qualification tools).
The evidence archive's exact size/hash is recorded in `qualification.json`.
Read-only local permissions and refusal to overwrite protect routine operations;
identity is enforced by hashes, not a claim of filesystem WORM storage.

A research-only draft release was prepared under
`ai-labor-archive-09fcc21-qualification-20261006`, targeting the original stack.
It is not a production/application release, and no version was changed.
See [draft release](https://github.com/ccesm/world-inflation-lens/releases/tag/untagged-f341417ccdbb57cf5029).
Draft status is explicit; assets remain mutable and authenticated. Authenticated download matched the Git-reviewed lock byte-for-byte and the
archive SHA-256. A new root restored all 507 files and passed offline Phase 1
(4 providers), Phase 2 (12 artifacts), Phase 3 (8 artifacts) and recorded-monitor
semantic validation. This was a same-machine draft round trip, not independent
permanent public recovery. Asset ID: `616248295`; exact evidence metadata is in
`qualification.json`. The separate `remote-recovery-evidence.tar` retains logs
and draft asset metadata alongside the local archive.

The lock deliberately has no durable download location and retains
`NOT_REMOTE_QUALIFIED`. Do not mistake upload/draft access for permanent public,
immutable, credential-free access. No short-lived Actions artifact is used.

Owner decision after review: publish this exact research archive with all
attribution and notices as an immutable research release (if the repository's
release settings support it), or name an approved durable immutable object
store. Before marking durable placement ready, independently download from
that permanent location, verify the Git-reviewed lock and all object identities,
repeat clean recovery on a separate machine/Linux runner, and record retention,
replacement/deletion controls and an independent backup. Published asset
changes require a new lock/release; never silently replace a historical bundle.

This qualification branch contains only small tooling/indexes/docs and has
none of the frozen stack's ancestry. All four AI-labor branches and 507 files
remain unchanged. A/B remains in the original normal-Git stack; C/D remains
fully preserved. No slim delivery branch, untracking, merge, production change,
monitor activation, remote monitor history write or email occurred.

The 139 original CPS microdata ZIPs remain outside this archive, as in the
original stack. Recovery of accepted sufficient statistics/benchmarks passes;
full independent person-record reparsing and loss recovery requires the pinned
external ZIP cache. Historical source identities cannot be replaced by current
downloads. Monitor activation also retains its separate research review,
GitHub-hosted manual/scheduled execution and history writer/storage gates.

Handoff: review the contract, rights and evidence; settle permanent storage;
qualify its independent recovery; only then separately authorize slim delivery
planning. No original branch cleanup is part of this handoff.
