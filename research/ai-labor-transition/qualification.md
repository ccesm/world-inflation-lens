# Phase 1 qualification — October 5, 2026

Starting production commit: `9147ed4923213f1954fb9424bbffeeae8a562347`.
Feature branch: `codex/observed-ai-labor-market-pipeline`.
Environment: macOS; Python 3.13; Node 24.19.0; application version unchanged at **1.1.0**.

## Official-source live acceptance

Four independent live checks passed. Actual captures were October 5, 2026, approximately 22:38:57–22:39:02 UTC. Official raw bytes and retrieval manifests are retained in `sources/`; acceptance was validated against those exact inputs. These are current-vintage observations, not historic real-time releases.

| Provider | Series | Coverage | Result |
|---|---:|---|---|
| CPS | 12 | January 2015–September 2026 | PARTIAL: published October 2025 nulls preserved; latest month available |
| CES | 6 | January 2015–September 2026 | CURRENT |
| JOLTS | 8 | January 2015–August 2026 | CURRENT |
| BTOS | 4 | Original 202319–202520; broadened 202524–202619 | CURRENT: separate histories; no fabricated intervening cycles |

BTOS has 54 original-question and 22 broadened-question cycles per current/expected series. Broadened latest reference dates are August 24–September 6, 2026, distinct from collection September 7–20 and publication September 24.

## Offline validation and determinism

`python3 -m unittest discover -s research/ai-labor-transition/tests -v`: **71 tests passed; 0 failed; 0 deferred**. Ten raw-input mutation subcases in one test are not counted as ten additional tests.

Coverage includes official response parsing, endpoints/IDs, finite values/units, native frequency, strict dates, order/duplicates/missing periods, SA/NSA, population and age bounds, expected-use separation, question-wording breaks, BTOS response categories/standard errors, source/provenance tampering, manifest/raw hash mutations, immutable vintage protection, view/summary validation, source failures, retained last-valid labeling, exact-window calculations and deterministic output.

Source-isolation tests inject a BLS failure and a BTOS schema failure independently. Other sources accept normally; the failed source retains its validated prior payload and exposes FAILED/last-valid health. Without an accepted prior payload it is UNAVAILABLE. No missing value is converted to zero. Changing raw identity without changing economic values preserves analytical identity while the archive records distinct provenance.

Two clean fresh-process normalizations of identical pinned manifests produced matching canonical bytes/hashes for all four providers:

| Provider | Full accepted payload SHA-256 |
|---|---|
| CPS | `95a367bfc48648c83ea7aa89a9e453cd43ce0a9fa72ad98024865fae16302689` |
| CES | `cb13d9b3cd0c74572448682803d1d083adbb8fd4df102df8ecc9d6de9e207399` |
| JOLTS | `10e804007c38867698b545a191121c35972852e3bc8e07606f8da8d79fdd8e01` |
| BTOS | `9287cb03f0b1a5e51e7d3d589d589afc2c6b42333d09c4c9b4147d243440c92b` |

`cli.py validate` validates all four accepted provider archives and independently recomputes all convenience views and the summary. This checks actual pinned raw provenance, not just self-consistency between output fields. The live check is separate from the 71 offline tests and requires internet.

## Production regression boundary

`npm run build`: PASS. Existing large-chunk warnings remain; research payloads are not imported or published.

`npm run verify`: PASS, including existing source calculations, routes, bilingual research views and restricted-data leakage checks.

Tracked production React, routes, economic snapshots, workflows, Signal Engine, notifications, package files and version are unchanged from the starting commit. The five local research-basis documents retain their original hashes. A direct scan of `dist/` finds no Phase 1 schema marker, dataset IDs or research-path references, and production source/workflows/scripts contain no pipeline import/reference. No production UI/browser change was made.

## Remaining research limits

No known HIGH/MEDIUM implementation blockers after these checks. Missing source release dates, age-cell sample uncertainty, the BTOS wording break, lack of true entry-level hiring and absence of causal attribution remain explicit data/research limitations. These are not repaired through interpolation, synthetic publication dates or proprietary data substitution.

Next phase: separately review and build a versioned, licensed occupational exposure crosswalk. No exposure score, labor scenario, Signal Engine factor or fiscal coupling is included here.

**READY FOR OCCUPATIONAL AI EXPOSURE CROSSWALK**
