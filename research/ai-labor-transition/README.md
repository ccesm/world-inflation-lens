# Observed AI labor-market research pipeline — Phase 1

This isolated Python pipeline answers **what is changing in the U.S. labor market**, alongside a separate official business AI-use context. It does not estimate AI's causal employment effect. **Age is not job seniority.** Neither an industry nor an age band is classified as AI-exposed here.

No React, Signal Engine, email, workflow, fiscal-model or production-data integration exists. Files remain under `research/`; they are not copied to `public/` or `dist/`. Python 3.10+ standard library is sufficient; qualification used Python 3.13.

## Commands

Run from the repository root:

```sh
# Capture official source bytes; does not accept new normalized data.
python3 research/ai-labor-transition/scripts/cli.py fetch

# Normalize and validate pinned candidates, retaining prior vintages.
python3 research/ai-labor-transition/scripts/cli.py normalize

# Or capture, normalize, validate, accept and export in one operation.
python3 research/ai-labor-transition/scripts/cli.py refresh

# Verify raw hashes, semantic provenance, accepted vintages and exports.
python3 research/ai-labor-transition/scripts/cli.py validate

# Print bounded current research status; full output is current-summary.json.
python3 research/ai-labor-transition/scripts/cli.py inspect

# Offline unit tests: no internet or credentials.
python3 -m unittest discover -s research/ai-labor-transition/tests -v

# Separate live qualification; default uses a temporary directory.
python3 research/ai-labor-transition/tests/live_integration.py
```

To preserve live qualification inputs in this research archive, supply `--root research/ai-labor-transition` to the live check. Source refreshes need internet but no API key. The unregistered BLS request limit is respected through separate ten-year batches, each containing at most twenty series. Avoid repeated unnecessary requests.

CLI options include `--providers cps,ces,jolts,btos`, `--start-year 2015`, `--end-year YYYY`, and `--root PATH`. For a reproducible export, `normalize --run-at ISO_TIMESTAMP` pins **pipeline runtime metadata only**. It is not historical replay and does not backdate source retrieval. Do not interpret its `asOf` field as proof of historical availability. Existing economic observations always retain native dates.

Exit codes: `0` selected operations succeeded; `2` at least one selected source failed or is unavailable, with other sources still processed; `1` an unexpected core/export error. `fetch` success means raw capture, not accepted data. `validate` also checks all generated convenience views and the summary against independently recomputed archive content.

## Storage and inspection

| Location | Purpose |
|---|---|
| `scripts/catalog.py` | Reviewed source IDs, definitions, units, denominators, adjustment and subgroup contract |
| `sources/raw/<sha256>.gz` | Pinned official JSON/XLSX bytes; hash names refer to uncompressed source bytes |
| `sources/manifests/<sha256>.json` | Request identity, raw hashes and genuine retrieval timestamp |
| `sources/candidates/` | Most recently fetched candidates; not proof of acceptance |
| `sources/fetch-status.json` | Per-source attempt/failure status |
| `normalized/vintages/<provider>/<sha256>.json` | Immutable accepted normalized payloads |
| `normalized/revisions/` | Before/after observation audit and raw identity comparison |
| `normalized/providers/` | Atomic pointers to complete accepted provider payloads |
| `normalized/labor-aggregate.json` | CPS aggregate and CES metrics |
| `normalized/labor-flows.json` | JOLTS levels and rates |
| `normalized/young-worker.json` | Published CPS rates for 20–24, 25–34 and 25–54 |
| `normalized/ai-adoption-context.json` | Separate current-use and expected-use BTOS histories, split at wording change |
| `normalized/data-health.json` | Independent provider status and retained-data labeling |
| `normalized/current-summary.json` | Latest values, exact-period descriptive transforms and source health |

Immutable files reject content collisions. Current pointers and convenience views are replaceable; prior accepted vintages remain. This is a local, single-writer research tool, not a distributed production scheduler. Acceptance is provider-independent, not an all-provider transaction.

Read [the methodology and limitations](../../docs/AI_LABOR_MARKET_PIPELINE.md), [raw archive notes](sources/README.md), [fixture notes](tests/fixtures/README.md) and [qualification results](qualification.md). All normalized summaries carry the attribution guardrail and possible confounders.

## Interpretation boundary

Observed changes may reflect the business cycle, interest rates, industry demand, post-pandemic normalization, offshoring, restructuring, demographics, AI adoption or other technology. They are not labeled AI-driven. BTOS expected use is a reported expectation, not observed future adoption. This phase cannot measure true entry-level hiring or occupational AI exposure.
