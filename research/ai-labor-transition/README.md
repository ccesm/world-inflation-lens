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

## Phase 2 — separate occupational AI exposure crosswalk

Phase 2 is under `occupational/`, with its own pinned sources, accepted configurations/vintages, schemas, scripts and tests. It adds occupational research files to `normalized/` but **does not alter or join into Phase 1's monthly summary**. No production source imports either pipeline.

```sh
# Offline normalization from the checked-in licensed raw archive.
python3 research/ai-labor-transition/occupational/scripts/cli.py normalize

# Independently reparse raw inputs and validate all 12 deterministic views,
# their schema/provenance, native task aggregation and output manifest.
python3 research/ai-labor-transition/occupational/scripts/cli.py validate

# Explicit live refresh of the selected pinned versions; no credentials.
python3 research/ai-labor-transition/occupational/scripts/cli.py refresh

# One provider can be refreshed independently.
python3 research/ai-labor-transition/occupational/scripts/cli.py refresh --providers academic

# Offline Phase 2 tests (separate from Phase 1 discovery).
python3 -m unittest discover -s research/ai-labor-transition/occupational/tests -v

# Isolated live qualification in a temporary directory.
python3 research/ai-labor-transition/occupational/tests/live_integration.py
```

CLI `--root` selects an independent source/accepted archive; `--output` selects a separate research output directory. Network is required only for `refresh`/live qualification. Exit `2` exposes source failures/unavailability/license/version mismatch while other accepted sources remain usable; unexpected core errors exit `1`. Repeated offline normalization produces the same canonical methodology payload; health runtime metadata may differ.

Versions are deliberately pinned: SOC 2018, O*NET 31.0 with O*NET-SOC 2019, explicit legacy O*NET-SOC 2010 mappings, and immutable publisher repository commits for the academic/Microsoft/Anthropic releases. `occupational/config/sources.json` is the retrieval inventory with exact URLs, hashes and permissions. A changed upstream body fails the expected hash; it is not silently adopted. Updating a source requires a reviewed registry/version/methodology change and new validation, not editing archived bytes.

The archived academic annotations are separate from the current O*NET task text. Native academic measures remain separate records when several O*NET occupations map to one SOC occupation. Microsoft applicability is a platform-derived construct. Anthropic conversation/task use is context, not exposure or national adoption. No split or merge clones/averages scores. Broad/hybrid reporting rows and ambiguous text links remain inspectable.

Redistribution is limited to accepted public federal/CC-BY/MIT inputs with attribution. See [license notices](occupational/sources/ATTRIBUTION.md). ILO/IMF numerical SOC mapping, Felten repository data and proprietary ADP are deferred; do not copy them into this repository without the recorded prerequisites. No confidential conversations are included.

Read [Phase 2 methodology](../../docs/AI_OCCUPATIONAL_EXPOSURE_CROSSWALK.md), [qualification](occupational/qualification.md) and [fixture notes](occupational/tests/fixtures/README.md). Next-phase occupational outcomes must have their own accepted data vintage and join contract; aggregate age-band weakness does not demonstrate AI-caused entry-level displacement.
