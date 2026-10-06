# Independent Linux recovery and fail-closed review — 2026-10-06

Handoff from Claude Code to Codex. This is a second-machine review of PR #10 (`7a95cc9`), checked against the four qualification gates. Nothing in PR #10 was edited. This branch adds this report, its raw evidence ([JSON](independent-linux-recovery-2026-10-06.json)) and the damage-scenario harness `scripts/ai-labor-archive/fail_closed.py`.

**Environment:** ephemeral cloud Linux container (x86_64, Python 3.13.16, 2 CPUs). This is a separate machine from the one that produced `qualification.json`, and it holds no prior research caches.

## Verdict

| Gate | Result |
| --- | --- |
| 1. Preservation | **PASS** |
| 2. Hydration | **PASS on a second machine, but permanent public placement is still pending** (owner decision) |
| 3. Reproducibility | **PASS** in one `--regressions` run |
| 4. Failure recovery | **PASS at the archive and lock layers. Analysis-layer gaps F1–F2 remain** |

Status: **not yet READY FOR SLIM AI-LABOR DELIVERY BRANCH**. Remaining work: choose permanent placement and verify download from it, then make lock re-verification of a hydrated root a mandatory gate (this closes F1 for the slim branch). F2 must be fixed before any monitor history writer is activated.

## Gate 1 — Preservation

`archive.py pack` was run here from the Git objects of `09fcc21`.

- The resulting archive is byte-identical to the reviewed one: SHA-256 `290a89de…4337`, 112,015,360 bytes, manifest `fc742659…6e1d`.
- The repacked index is byte-identical to `docs/ai-labor-archive/stack.lock.json`.
- I independently recomputed the inventory: 507 paths, 356 distinct objects, 106.43 MiB distinct and 147.44 MiB path bytes. Inventory Git blobs match the stack tree with 0 mismatches. The 416-path untracking list (C 180, D 236) equals the inventory's proposed set exactly.

## Gate 2 — Hydration

- From this machine, the draft release asset `616248295` (`wil-archive-507.tar`) was downloaded with authentication. Its SHA-256 matches the lock.
- That downloaded copy was then hydrated into clean roots, giving 507 files.
- **Still open:** the asset is a draft. It is mutable and requires authentication. Credential-free download from a permanent, immutable location has not been shown.

## Gate 3 — Reproducibility

One run of `qualify.py --regressions` against the downloaded asset:

- 34 checks, all exit 0, with `regressionsRun: true`.
- Regression suites: Phase 1 71, Phase 2 77, Phase 3 94, monitor 82. Total **324, all OK, in the same run that produced the hashes.** This resolves the PR #10 inconsistency where `qualification.json` records 324 passing tests but `regressionsRun: false`.
- Archive SHA-256, Phase 1 provider hashes, Phase 2 map `838a31f5…`, Phase 3 map `2eff8331…`, monitor result `9c65350d…` and hydrated file count all equal `qualification.json`.
- All 30 non-regression check logs are **byte-identical** to the `logSha256` values in `qualification.json`, so results are machine-independent. Regression logs contain timings and are not expected to match.

Suggest regenerating `qualification.json` from a single `--regressions` run, or citing this record, so that test results and hashes come from one execution.

## Gate 4 — Failure recovery

The existing archive-contract tests already cover the archive layer: tampering, missing objects, traversal and links. To test the analysis layer, `fail_closed.py` hydrates a fresh root from the verified archive and damages it in one way per scenario. It then runs the frozen validators with Python sockets blocked and also re-hashes the root against the lock. The suite has 28 checks: **25 fail closed, and lock re-verification detects all 28 damages.**

Failing closed as expected:

- Code present but an entire phase's C/D data absent. Phase 2, Phase 3 and monitor data were each tested. This is the shape a slim branch will have.
- A current immutable vintage, a raw source, or a C alias is missing.
- Values are altered in a CPS vintage, Phase 3 group outcomes, or a Phase 3 monthly alias.
- A monitor evaluation is missing.
- After a failed Phase 1 rebuild, both Phase 3 validation and a new monitor dry-run reject the degraded state. No new conclusion is produced from incomplete data.

The partial-phase hydration scenarios (`--phase phase1` and others) also fail. That failure is trivial, because the later phases' code is not hydrated either. The code-present scenarios above are the meaningful ones.

### Findings

**F1 — MEDIUM: superseded immutable vintages are invisible to analysis validation.** Deleting `occupational/accepted/vintages/onet/c5bfcfe7….json.gz`, one of three O*NET vintages and not the current one, still lets Phase 2 `validate` exit 0. No file in the stack references it. The validator checks only that the *current* pointer has an immutable identity. Deleting the other superseded vintage, `0db81cc5…`, was also tested; Phase 2 `validate` again exits 0. These are the source-revision evidence that `ai-labor-storage-reconciliation-2026-10-06.md` says must be kept. Only the lock detects their loss.
*Fix:* add a `verify-root` command that re-hashes every lock path in a hydrated root. Make it a mandatory precondition for analysis commands and CI in the slim branch.

**F2 — LOW–MEDIUM, required before monitor activation: the monitor store's top-level `inputs.json` is not integrity-bound.** Recorded-store `validate` replays from the content-addressed `acceptedInputObject`, so recorded results are safe by design. A tampered provider snapshot hash in `inputs.json` fails closed at the next dry-run. For `firstRecordedAt`, a malformed value (`…04:35:380`) passes `validate` but correctly fails `dry-run` ("Timestamp needs explicit timezone"). A well-formed backdated value (`2025-01-01T00:00:00Z`) passes both `validate` and `dry-run`. That run reused the existing record because the economic inputs were unchanged. With new data, `accept()` would store the edited first-seen time in a new accepted input object. That is the fabricated or backdated acceptance time the project rules forbid.
*Fix:* bind `inputs.json` (or at least `firstRecordedAt`) to the history manifest, and validate the timestamp format and its equality with the accepted input object.

**F3 — LOW: failed rebuilds mutate the hydrated tree.** When a raw source is missing, Phase 1 and Phase 2 `normalize` follow the live-refresh fallback: they write `FAILED` / `usingLastValid` outputs into the tree, then exit 2. This is explicit and correctly rejected downstream, but it leaves the root no longer lock-identical.
*Fix:* in offline/hydrated mode, disable the last-valid fallback or write to scratch. Never reuse a root without re-verifying it against the lock (see F1).

**F4 — LOW: `validate` has write side effects.** With Phase 3 data absent, Phase 3 `validate` re-materialised two accepted exposure files (`outcomes/accepted/exposure/{academic,microsoft}-….json.gz`) before failing. The bytes match the lock.

**F5 — LOW, classification consistency.**
- `outcomes/outcome-data-health.json` is class D but is rewritten (`evaluatedAt`) by every Phase 3 `normalize`, including the standard qualification procedure.
- `outcomes/cps-occupation-annual.json.gz` is class D but is regenerated byte-identically by `normalize`. Its deletion followed by rebuild therefore exits 0, which is correct behaviour.

Consider reclassifying both, or stop rewriting the first.

## Permanent placement (owner decision, not made here)

Per `storage.md`, the choice is between an immutable research release in this repository (if release settings allow it) and an approved durable object store. Whichever is chosen, repeat: credential-free download, `archive.py verify` against the reviewed lock, and `qualify.py --regressions` on a machine other than the uploader's. An independent backup copy is also still required.

## Reproduce

```sh
python3 scripts/ai-labor-archive/archive.py verify --archive "$ARCHIVE" --index docs/ai-labor-archive/stack.lock.json
python3 scripts/ai-labor-archive/qualify.py --archive "$ARCHIVE" --index docs/ai-labor-archive/stack.lock.json --work "$NEW1" --regressions
python3 scripts/ai-labor-archive/fail_closed.py scripts/ai-labor-archive "$ARCHIVE" docs/ai-labor-archive/stack.lock.json "$NEW2"
```

`fail_closed.py` writes `failtests.json` and per-check logs under `$NEW2`. Exit 0 rows are reported, not asserted, so the harness records gaps instead of hiding them.
