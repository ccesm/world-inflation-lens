# Canonical release verification — 2026-10-06

Owner decision: the **GitHub immutable release is the canonical primary archive**, and **Zenodo holds an independent long-term backup** of the identical bytes. The archive is never repacked. Raw evidence: [JSON](canonical-release-verification-2026-10-06.json).

## Release

[`ai-labor-archive-09fcc21-qualification-20261006`](https://github.com/ccesm/world-inflation-lens/releases/tag/ai-labor-archive-09fcc21-qualification-20261006), release id `405002199`.

- Published 2026-10-06T22:04:52Z with `draft: false`, `prerelease: true`, `immutable: true`. Repository release immutability was enabled before publishing.
- The tag points to `09fcc21aad29c36697f4775048ad87694a1a8b61`.
- The 7 assets are unchanged from the draft. The archive is `wil-archive-507.tar`, `sha256:290a89de982b1249a5209130345eb55c2043639fd0b1c744da1969375c4b4337`.

## Credential-free recovery: PASS

This check ran in the Linux sandbox VM on the owner's Mac (aarch64). That is a third machine, separate from the archive author's machine and from the cloud container used in [the independent review](independent-linux-recovery-2026-10-06.md).

The VM was confirmed to have no GitHub credentials: anonymous rate limit 60, `/user` returned 401, the draft release returned 404 before publishing, and there is no `.netrc`. The cloud container cannot provide this proof because its proxy attaches credentials.

| Step | Result |
| --- | --- |
| Anonymous download of all 7 assets (via `release-assets.githubusercontent.com`) | PASS. Every SHA-256 equals the GitHub-reported digest |
| Release `stack.lock.json` vs the Git-reviewed lock | Byte-identical |
| `archive.py verify` | PASS: 356 objects, 154,599,037 path bytes, 111,595,685 object bytes |
| `archive.py hydrate --phase monitor` | PASS: 507 files |
| Lock verification of the hydrated root | 507/507 present, 0 changed, 0 extra |
| Full qualification with regressions (Python 3.13.15) | 34/34 steps exit 0. Regressions: Phase 1 71, Phase 2 77, Phase 3 94, monitor 82 = **324 OK** |
| Pinned results | Archive SHA-256, Phase 1 provider hashes, Phase 2 map `838a31f5…`, Phase 3 map `2eff8331…`, monitor `9c65350d…` and file count all equal `qualification.json` |
| Log identity | All 30 non-regression logs are byte-identical to the published `qualification.json` |

This sandbox ends any process after 3 minutes. The qualification therefore ran through `scripts/ai-labor-archive/qualify_resumable.py`, which executes the exact `qualify.py` step sequence in time-boxed chunks and runs regression suites per test file. The 30/30 identical log hashes show that the steps executed the same way.

## New finding F6 — HIGH: reproduction requires Python ≥ 3.12

The first attempt used the VM's system Python 3.10.12. Phase 1 `accepted-validate` failed with `Derived/view semantic mismatch: current-summary.json`. The cause is five last-digit float differences, for example a stored `61.65` recomputed as `61.650000000000006`.

| Python | Phase 1 derived-value mismatches |
| --- | --- |
| 3.10.12 | 5 |
| 3.11.16 | 5 |
| 3.12.14 | 0 |
| 3.13.15 | 0 |

Python 3.12 changed `sum()` over floats to compensated summation: `sum([0.1]*10)` gives `0.9999999999999999` on 3.10 and 3.11, and `1.0` on 3.12 and later. The accepted artifacts were produced on 3.12 or later, so they reproduce only there. `README.md` and `qualify.py` currently state and enforce "3.10+".

*Fix:* require Python ≥ 3.12 in `qualify.py`, the README and the slim branch tooling. The validators already fail closed on older versions; this change makes the requirement explicit instead of surfacing as a semantic mismatch. No accepted artifact or methodology changes.

## Zenodo backup: PENDING owner upload

The sandbox network policy blocks `zenodo.org`, and the deposit must be made under the owner's Zenodo account. Upload these exact files from the owner's `~/Public/wil-release/`. They are copies of the anonymous GitHub download, verified byte-identical:

| File | SHA-256 | MD5 (Zenodo reports MD5) |
| --- | --- | --- |
| `wil-archive-507.tar` | `290a89de…4337` | `a7cdd24d2555eaf71bffda022c8760f5` |
| `stack.lock.json` | `858b09bc…afdabc` | `c7cd9b618f4277d163104fda2c2090a3` |
| `redistribution.md` | `be24d496…13498` | `a7757b3de333a5f11e7fc20609cc0d86` |

After publishing, record the DOI here. Confirm that the record's file checksums equal the MD5 values above, and that a download from Zenodo has SHA-256 `290a89de…4337`.

## Gates

| Gate | Status |
| --- | --- |
| Canonical primary archive: immutable public release, credential-free recovery | **PASS** |
| Independent backup (Zenodo DOI) | Pending owner upload |
| **F1:** mandatory lock re-verification of hydrated roots | **Blocking before the slim AI-labor delivery branch** |
| **F2:** integrity-bind `firstRecordedAt` / `inputs.json` | **Blocking before monitor history write activation** |
| **F6:** Python ≥ 3.12 requirement | Fix before the slim branch, together with F1 |
