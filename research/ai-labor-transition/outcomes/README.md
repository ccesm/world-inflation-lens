# Phase 3: observed labor outcomes by AI exposure

Research only. **Observed differences across exposure groups do not establish AI causality.** No production, Signal Engine, fiscal-model or investment-return integration. Start from Phase 2 `e09b7c973fae4b219aea1132206f5f06995d3717`. Python 3.10+ standard library; qualification uses Python 3.13.

## Rebuild and inspect

Run from the repository root:

```sh
# Offline rebuild from checked-in monthly sufficient statistics and dictionaries.
python3 research/ai-labor-transition/outcomes/scripts/cli.py normalize

# Reconstruct all analytical views; validate schema, provenance and hashes.
python3 research/ai-labor-transition/outcomes/scripts/cli.py validate

# Offline independent arithmetic, source anchors, mutation and failure tests.
python3 -m unittest discover -s research/ai-labor-transition/outcomes/tests -v
```

Read `current-research-summary.json` for a bounded summary, `exposure-group-outcomes.json` for full groups and matched-month comparisons, `pretrend-analysis.json` for pandemic/transition/pretrend details, and `outcome-data-health.json` for operational status. JSON.gz files are deterministic gzip containers around canonical JSON. Output hashes in `output-manifest.json` refer to **uncompressed canonical JSON**, not container bytes.

## Official source refresh and raw reconstruction

```sh
# Explicit network operation; pinned official bytes only, no credentials.
# Choose an external cache with about 2 GB free, outside public/ and dist/.
python3 research/ai-labor-transition/outcomes/scripts/cli.py refresh --cache /tmp/wil-cps-cache

# Accept already downloaded, exact pinned official files.
python3 research/ai-labor-transition/outcomes/scripts/cli.py ingest --cache /tmp/wil-cps-cache

# Reparse every accepted CPS month from the original ZIPs.
python3 research/ai-labor-transition/outcomes/scripts/cli.py validate --cache /tmp/wil-cps-cache
```

Normal offline execution never downloads data. `refresh` downloads the 152 pinned files independently and returns `failedFiles`; callers must inspect that field, not infer complete source success from process exit alone. A source-vintage mismatch is reported and cannot replace accepted bytes. `ingest` reports failed month counts, retaining validated last-valid months where available. Core/specification/semantic validation errors exit 1. `--root PATH` permits isolated qualification archives; copy the pinned source/config/accepted files before use.

The checked-in source manifest gives exact URLs, file names, sizes, hashes, reference periods and layout identities. `sources/retrieval-receipts.json` records actual retrieval timestamps. Newly published months or revised bytes require a separate reviewed manifest/vintage update; this frozen release does not auto-repin or invent new observations. October 2025 was never collected.

No individual CPS person records are committed. The external raw ZIP cache is necessary for full reconstruction from official microdata; it is disposable only after qualification evidence is recorded. Sufficient statistics preserve independent weights, sample counts, age/education/native-industry composition and weighted earnings distributions. The same raw files normalize deterministically. Actual operational clocks are separate from analytical identity.

## Storage and validation

| Location | Role |
|---|---|
| `preanalysis-spec.json`, `accepted/preanalysis-spec.json` | Frozen rules and independent immutable copy |
| `sources/manifest.json`, `accepted/source-manifest.json` | Official source identities and reviewed versions |
| `sources/raw/*.gz` | Original official dictionary/concordance bytes |
| `accepted/monthly/*.json.gz` | Selected validated sufficient-statistic month |
| `accepted/vintages/*.json.gz` | Immutable content-addressed month history |
| `accepted/monthly-manifest.json` | Source/hash-bound selection of accepted months |
| `accepted/exposure/*.json.gz` | Exact prior accepted Phase 2 exposure bytes |
| `schemas/artifact.schema.json` | Research envelope and causality contract |
| Eight analytical outputs + `output-manifest.json` | Deterministic research views and bindings |
| `outcome-data-health.json`, source receipts/health | Runtime/source status separate from arithmetic |

Do not edit cut points, eras, weights or suppression to obtain a desired finding. The embedded specification hash rejects such changes. Material source or analysis changes need an explicitly reviewed version. Raw source identity and parsed economic identity are recorded separately; a changed raw artifact is not silently accepted as identical merely because arithmetic looks similar.

CPS failures are isolated by month; exposure/context sources are independent. Required taxonomy or spec corruption fails closed. Missing Microsoft/Anthropic does not create or fabricate a result and does not invalidate academic/CPS evidence. OEWS is currently UNAVAILABLE; synthetic fixtures qualify parsing only, never actual BLS data or longitudinal comparability.

## Interpretation

Age is not job seniority. Employment changes are not hiring. Platform use is not exogenous exposure. Earnings are nominal weekly medians with disclosure comparability limitations. Point estimates lack design-based standard errors; person-months are not independent workers. Current-vintage reconstructed histories are not real-time vintages. Keep all five groups, coverage partitions, pandemic records and pretrends visible.

See [methodology/results](../../../docs/AI_LABOR_OUTCOMES_BY_EXPOSURE.md), [qualification](qualification.md) and [fixtures](tests/fixtures/README.md). Phase 4 requires improved coverage, uncertainty, confounder treatment, more post-period data and a separately reviewed causal/scenario design.
