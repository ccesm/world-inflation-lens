# Official quarterly accounting panel — research only

Target: MSFT/GOOG/AMZN/META, calendar 2019Q1–2026Q2. See [methodology and qualification](../../../docs/AI_CAPEX_QUARTERLY_PANEL.md). Phase 2A.1 status: **READY FOR DESCRIPTIVE AI CAPEX MONETIZATION MONITOR** within the qualified native accounting scope. All four core company panels have 30 quarters; optional gaps and definition breaks remain explicit. This is not an AI ROI model or an activated monitor.

## Offline panel and tests

From the repository root, Node >=22.12:

```sh
node research/ai-capex-monetization/quarterly/scripts/run.mjs
node --test research/ai-capex-monetization/quarterly/tests/*.test.mjs
node --test research/ai-capex-monetization/tests/foundation.test.mjs
```

Outputs are ignored in `quarterly/outputs/`: panel, financials, cash flow, CapEx, depreciation, cloud segments, backlog, guidance, derived metrics, events, definitions, selection, completeness, reconciliation, health and qualification. The accepted JSON in `inputs/` is frozen reviewed input, not a directory for unreviewed fetch output. Draft JSON Schemas describe structures; Node/Python semantic validators enforce the substantive period/source/accounting invariants.

Python 3.12 is needed only for raw extraction, not the offline Node panel or the production app. Use an isolated environment:

```sh
python3 -m venv /tmp/wil-capex-python
/tmp/wil-capex-python/bin/python -m pip install -r research/ai-capex-monetization/quarterly/requirements.txt
/tmp/wil-capex-python/bin/python -m unittest discover -s research/ai-capex-monetization/quarterly/tests -p '*_test.py'
```

## Raw cache and pinned hydration

Keep raw documents outside normal Git. The qualified cache is `~/Public/wil-ai-capex-cache`; choose another external directory with the environment variable. This code does not create a GitHub Release or remote archive.

```sh
export WIL_AI_CAPEX_CACHE="$HOME/Public/wil-ai-capex-cache"
node research/ai-capex-monetization/quarterly/scripts/run.mjs --verify-raw
node research/ai-capex-monetization/quarterly/scripts/hydrate.mjs
export WIL_AI_CAPEX_PYTHON=/tmp/wil-capex-python/bin/python
node research/ai-capex-monetization/quarterly/scripts/reextract.mjs
```

Hydration reuses objects only after their hash/size is validated. Missing objects fetch their pinned official URL; a 403/429 suppresses further host attempts during the run. Changed hashes, source/schema/identity failures and unavailable files fail qualification; accepted input is not modified. Results and retrieval time are written only to the external cache's `runs/` and `receipts/`. One company failure cannot overwrite any company's accepted normalized input.

`hydrate.mjs --check-remote` is an explicit network check of the pinned source URLs, not a promise of new-quarter discovery. Candidate changed bytes never become accepted values. `reextract.mjs` verifies every raw identity, generates candidates in the ignored output directory, compares parsed native records and publication datelines against pinned inputs, and leaves the four manual raw-bound observations clearly identified. No accepted file is overwritten.

To add a quarter or revision: discover its official publication identity; retain raw bytes and receipt; extract candidates; review exact duration, native scope, units, definition and original/recast relation; qualify independently; update the reviewed input and source-set receipt in a feature commit; rebuild and review completeness. Never recalculate selection to favor a trend. The fixed 30-quarter target is versioned and must be deliberately extended. Source rejection preserves last-valid input, not a fabricated current observation.

Backup/recovery: retain all manifest-referenced content-addressed objects, receipts and versioned manifests together. Preserve old objects and candidates when new disclosures are accepted. If a source no longer serves the pinned hash and no retained object is recoverable, report UNAVAILABLE; do not substitute newer bytes under the old identity. The accepted raw source set is about 32.5 MiB; full generated exports, Python caches and raw files remain ignored.

The source/table/definition manifests, sparse management events and small qualification report can be inspected without private data. No API tokens, production changes, email or Signal Engine imports are needed.

Phase 2A.1 also retains reviewed original/recast bindings and a separate annual accounting-note archive. Run `$WIL_AI_CAPEX_PYTHON research/ai-capex-monetization/quarterly/scripts/verify-notes.py` with `WIL_AI_CAPEX_CACHE` to reproduce note anchors, annual depreciation cells and the newly qualified Cloud RPO. Original Phase 2A qualification remains in `reports/qualification-summary.json`; current repair is in `reports/source-accounting-repair.json`. This readiness does not activate a monitor or qualify AI returns.
