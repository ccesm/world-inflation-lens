# Signal Engine Phase 1 shadow pipeline

Implementation scope: isolated evaluation of accepted economic data, restricted immutable storage and operational status. Public app version remains **1.0.0**. There is no Signal Engine route, UI, public asset, notification or aggregate.

## Reference and import

- Design checkpoint: `ab4bb115dd2553fe182eb9606dc3a3012f1bce7f` on `codex/signal-engine-production-design`.
- Implementation branch: `codex/signal-engine-production-pipeline`, from production `21cdb441befc2e3b3a52011093603911a67d9a5f`.
- Validated engine: `139c36e5efd642aedcfd2a43194f5b8f09c7831e`; implementation `offline-prototype/0.1.2`.
- Frozen rule: `signal-engine-v0.1-draft.1`; five authoritative specification files retain their original bytes.

Engine modules, required fixtures, isolated package/lock, CLI/reports and original tests were selectively imported. No prototype merge or economic snapshot replacement occurred. Existing test OP-12 now checks the protected working-tree diff before/after the operation instead of requiring today's production snapshots to equal the old prototype base. Its path rejection and version assertions remain. This is a test portability adjustment, not a safeguard or methodology change.

## Commands and acceptance

Install the isolated engine dependencies with `npm ci --prefix research/signal-engine`; normal website dependencies remain separate.

```sh
npm run signal:evaluate
npm run signal:evaluate -- --dry-run
npm run signal:evaluate -- --snapshot <full-commit-sha> --code-commit <full-code-sha>
npm run signal:evaluate -- --receipt /restricted/accepted-input.json --store /restricted/dedicated-store
npm run signal:test
npm run signal:test:pipeline
```

Only shadow/current-snapshot execution is supported by the production adapter. Historical and publisher-vintage modes are not CLI options. Existing isolated research CLI modes remain unchanged.

Normal evaluation independently runs `npm run build` and `npm run verify` against the exact economic files committed at the requested target. It checks every tracked `data/` file before and after the gates, binds validator code and complete bundle hashes, and also runs the original engine generic/international source validation. A gate failure creates no acceptance receipt and evaluates no candidate.

The receipt binds target/code commit, economic commit, all protected file hashes, genuine first-seen/validation/recording/acceptance times and successful gate evidence. The engine manifest carries source-specific identity and receipt references. Schema, chronology, complete dataset coverage and Git bytes are verified again on load. Supplying an explicit receipt is for retained accepted inputs; a path or branch name cannot substitute for proof. No source retrieval date or Git author date is used as historical acceptance.

The economic commit is the most recent `data/` change reachable from the requested target, after proving equivalent data bytes. Code-only commits therefore do not manufacture a new economic vintage. The requested target and executed code identity remain in the acceptance/run records. Rejected candidates, working bytes that differ from the commit and partial manifests fail closed.

## Deterministic content and run identity

`signal-shadow-interpretation/1` is an envelope with `content` and `deterministicContentHash = SHA-256(canonical content)`. Canonical JSON uses sorted keys and a final newline. The immutable file is addressed by the hash of the entire envelope; this file hash and the inner deterministic-content hash are deliberately distinct.

Content includes frozen engine/rule/adapter versions, economic input commit and complete bundle hash, validated engine reference commit, semantic code hash, explicit evaluation mode/as-of, engine payload/projection/context digests, four domestic and three international factor records, evidence quality, matching sensitivity flags, safe lineage references and limitations. No aggregate is exported.

`codeCommit` in deterministic content is the validated engine reference; `semanticCodeHash` includes the actual engine, adapter, immutable specification/contract files and transitive relative-import dependencies. A change to these semantics requires a new evaluation/identity. An unrelated website or execution commit is recorded in the operational run and does not alone change factor content.

The original engine payload is retained without mutation, including its runtime and explicit `evaluatedAt`. The adapter deliberately supplies `evaluatedAt = asOf`, an explicit interpretation input. Wall-clock attempted/completed timestamps and invocation IDs belong only to `signal-shadow-run/1`; they are not relabelled as economic observations. Native-period availability, receipt timestamps and source vintage remain part of provenance, not removable execution noise.

Reuse requires matching accepted economic identity, matching semantic code and runtime compatibility, and equal **eligibility fingerprints at the original and requested cutoffs**. Fingerprinting calls the frozen engine's source selection, timing, freshness, quality, publisher-proof and eligible revision functions over all series. It duplicates no factor arithmetic. Crossing a freshness/release/availability boundary forces evaluation even when economic values are unchanged. Reuse keeps the original artifact/as-of and records a new successful eligibility check; it does not claim a new evaluation or new evidence.

This implements the new task's explicit unchanged-input requirement more broadly than the design's initial exact-request-only cache: the additional eligibility-equivalence guard is mandatory. Future-ineligible records do not enter that guard. Raw/canonical/source identity changes still invalidate reuse through complete input hashes and remain auditable without changing factor arithmetic automatically.

## Restricted storage and lifecycle

Local development defaults to `research/signal-engine/production-artifacts/`. It is ignored by Git, outside `public/` and `src/`, and never imported or copied into Vite's output. Directories are mode 0700 and files 0600. Local files are not durable runner storage.

```text
<restricted-root>/
  accepted/<sha256>.json
  engine/<sha256>.json
  contexts/<sha256>.json
  interpretations/<sha256>.json
  projections/<sha256>.json
  runs/<sha256>.json
  ledgers/<sha256>.json
  status.json
  status.previous.json
```

Every immutable object is validated, written to a unique temporary file, fsynced/closed, atomically hard-linked without overwrite, and read back with exact canonical-byte/hash verification. Directories are synced. A same-content retry reuses the path; different bytes cannot overwrite it. `status.json` points to a content-addressed ledger. Pointer writes use fsync plus atomic rename, retaining a previously committed backup. Orphans are not promoted by scanning for the newest date.

Schema and independent semantic validation run before last-valid promotion: original engine schema, pinned-archive provenance, R1–R6, factors/transforms, public projection equivalence, wrapper semantics and hashes. The restricted context retains receipts, required prior accepted vintage and predecessor interpretation. History links are traceable; unavailable factors never acquire a previous direction as their current state.

The allowlisted `signal-public-shadow/1` projection and schema are implemented and tested, but remain restricted. They expose descriptive factors, exact periods/metrics and opaque lineage/snapshot references. Local paths, diagnostic strings, workflow identity, source credentials and arbitrary exception text are excluded. Source URLs require approved public hosts and HTTPS. Full raw windows/availability proof remain in the restricted validated engine payload; a complete public research-details contract/UI is Phase 2 work.

## Ledger, failure and recovery

Ledger states are `CURRENT`, `UNCHANGED`, `FAILED_WITH_LAST_VALID`, `NO_VALID_ARTIFACT`. It records last attempt, actual last successful evaluation, separate successful reuse check, latest accepted input, last-valid input/artifact/as-of, rule/engine/adapter versions, bounded failure stage/category, immutable run reference and predecessor ledger. Current input versus original interpretation is explicit. Independent economic source health and public `system-status` remain unchanged.

Evaluation, schema/provenance, projection, artifact, storage or index errors preserve accepted economic bytes. A validated retained artifact stays last-valid. If the previous artifact is corrupt/missing, only a verifiable earlier committed ancestor may supply fallback; otherwise interpretation is unavailable. Failed status writes preserve the prior committed pointer and return an isolated operational failure. Unreachable private storage cannot block economic deployment.

Recovery cases are covered by tests: artifact written before pointer failure, missing/corrupt pointer, ledger referencing missing content, interrupted temporary writes, duplicate content/run, corrupt latest run record, live/unknown locks and a provably dead local lock. Corrupted run metadata does not change an otherwise validated interpretation; a fresh run records recovery while reusing valid content. Orphan files do not become last-valid automatically. Lock recovery requires same-host PID liveness proof; an old timestamp alone cannot break a lock.

Numeric workflow run ID and attempt ordering reject delayed older writers locally. Remote persistence uses optimistic non-force ref advancement; a concurrent update fails rather than overwrite a newer archive. Artifact/run/ledger histories are retained without automatic garbage collection. Exact runtime compatibility is required for recomputation; multi-engine/runtime dispatch remains a future separately qualified change.

## Workflow shadow integration and durable archive

The new `signal-shadow` job depends only on a successful existing `build`, after economic refresh, commit and final production build/verification. It runs alongside deployment; `deploy`, notification and public status jobs have **no dependency** on it. `continue-on-error` applies only to this dedicated shadow job. The existing refresh rollback transaction and production build/verify remain untouched.

The isolated job pins Node **24.19.0** and installs the isolated frozen dependencies. Website jobs retain Node 22. The shadow adapter rechecks accepted production bytes/gates and executes without macroeconomic network access. Logs contain only bounded operational outcome/stage/category, not factors or private paths.

The job is activated only with `SIGNAL_SHADOW_ENABLED=true`. It also requires `SIGNAL_ARCHIVE_REPOSITORY` and a narrowly scoped `SIGNAL_ARCHIVE_TOKEN` for an **initialized private companion repository**. No archive repository or credentials are created by this branch, and no workflow was dispatched during implementation.

The archive adapter verifies private visibility before both restore and publication, refuses the public production repository, validates paths/modes/content hashes, and publishes only the restricted storage layout to its `signal-shadow` branch. Immutable blobs and pointers are committed together using Git data APIs. It never uploads shadow results as publicly downloadable production workflow artifacts. Secret/provider response bodies are not logged. Public artifact branch publication remains disabled in Phase 1.

If storage is not provisioned, local fixtures can exercise implementation and tests; production shadow rollout remains disabled. Private provisioning is a deployment prerequisite, not proof supplied by a test mock. The adapter has bounded archive-size limits; approaching them requires retention/storage review, not silent truncation. Restore verifies exact bytes; reachable engine contexts are semantically revalidated before use.

Push-only/no-refresh runs resolve the same economic commit and reuse a retained result when semantics and cutoff eligibility match. They create only operational/check records rather than unnecessary factor content. A new economic vintage or changed eligibility gets a new validated interpretation. No Signal Engine email is sent.

## Validation and remaining work

Pipeline tests cover acceptance, independent provenance mutations, public projection privacy, fresh-process determinism, unchanged input/code behavior, immutable/atomic storage, ordering, recovery, last-valid preservation and deliberate failures A–J. Original offline tests remain, with the two legitimate deferrals for future publisher-vintage success and adopted-rule execution.

The engineering report must distinguish frozen prototype regression from evaluation of latest accepted production data, and report real build/verify outcomes separately from mocked fault tests. Shadow integration is ready for review only; production merge/deployment and private archive provisioning have not occurred.

Phase 2 remains separate: full public details/sensitivity contracts, Data Health display, dedicated lazy research route, bilingual cards, failure/age labels and mobile/accessibility/browser gates. No public endpoint, UI or navigation is implemented in Phase 1.

### Recorded local acceptance, 2026-10-03 America/Los_Angeles

- Original engine suite: **258 cases, 256 passed, 0 failed, 2 deferred**. R1–R6 adversarial and regression tests pass. The two deferrals remain successful publisher-vintage replay and future adopted-rule execution.
- Added pipeline/archive suite: **60 tests, 60 passed, 0 failed**. Includes failure categories A–J, additional storage/crash cases, three independent fresh processes, private-store round-trip mocks and two authentic retained snapshot vintages tested in isolated working files. Economic gates are explicitly mocked in these adapter fixtures, not presented as live production acceptance.
- Combined unique test catalogue: **318 tests, 316 passed, 0 failed, 2 deferred**. Focused reruns are verification, not additional catalogue cases.
- Actual `npm run build` and `npm run verify` passed. The normal shadow command separately executed its real economic gates and stored a validated interpretation of production snapshot `21cdb44` locally; no private remote or production deployment was invoked.
- The frozen real input/explicit request/runtime reproduces `da3f364259bc43083d0ab1621706172283716d735493fd4d97278573bb5fe883` exactly (Node 24.19.0, timezone database 2026b).
- Frozen and latest production evaluations both return: TRANSITION; OUTPUT_PER_HOUR_GROWING; TRANSITION; TRANSITION; USD_RESERVE_SHARE_FALLING; TRANSITION; OFFSHORE_USD_CREDIT_EXPANDING, in configured order. All seven have MEDIUM evidence quality. GSCPI and BIS are threshold-sensitive. These observations do not impose required outputs on future snapshots.
- Engine modules and the five frozen specifications match the validated reference byte for byte. Production `src`, economic snapshots, routes, refresh transaction and notification script are unchanged. Bundle scanning finds no shadow engine/projection payload; public version stays 1.0.0.

These are local engineering results, not claims that the private companion archive is provisioned, the Linux runner has executed shadow mode, or production is deployed. The bounded archive configuration and runner qualification must be reviewed before activation. Current decision: **READY FOR SHADOW PIPELINE REVIEW**.
