# Descriptive AI CapEx & Monetization Monitor

Research only; frozen accepted panel 2019Q1–2026Q2. No network calls, production imports, UI, email or scheduling.

From repository root, Node >=22.12:

```sh
node research/ai-capex-monetization/monitor/scripts/run.mjs
# Explicitly regenerate the small committed numerical summary and identity manifest:
node research/ai-capex-monetization/monitor/scripts/run.mjs --write-reports
node --test research/ai-capex-monetization/monitor/tests/*.test.mjs
node --test research/ai-capex-monetization/tests/*.test.mjs research/ai-capex-monetization/quarterly/tests/*.test.mjs research/ai-capex-monetization/monitor/tests/*.test.mjs
```

Existing Python regressions require the Phase 2A lxml/pypdf/openpyxl environment:

```sh
python3 -m unittest discover -s research/ai-capex-monetization/quarterly/tests -p '*_test.py'
```

The runner reuses qualified normalized inputs and source hashes; no raw download/cache write is necessary. External source requalification remains in `quarterly/` and uses `WIL_AI_CAPEX_CACHE`; this monitor does not claim to rehydrate/revalidate source bytes on every run.

Full outputs are gitignored under `outputs/<generationId>/`. Inspect `outputs/current.json` for the selected relative generation. `monitor.json` is the validated full artifact; `public-snapshot.draft.json` is an unadvertised whitelist projection, not a published endpoint. Every generation also has independently separated metrics, company-latest, events, accounting policies, guidance, capacity/backlog, health, summaries, chart contract and manifest.

Use `--out /tmp/wil-capex-monitor` for isolated qualification. `--test-inject-failure` explicitly forces a research-only failure; no economic input file changes. Inspect `run-status.json` to distinguish current, no-new-disclosure, failed-with-last-valid and unavailable outcomes. It contains a separate runtime timestamp. Existing valid generation content is immutable and checked on reuse.

`windowView(monitor, 'FULL_HISTORY' | 'PRE_GENAI_CONTEXT' | 'INFRASTRUCTURE_CONTEXT')` filters native observations/gaps and retains policy context. No synthetic months/quarters or chronological historical-vintage claims are created.

Accepted input bytes, parsed input identity, source hashes, config, implementation and schemas are separately recorded. Normal CLI runs fail on altered frozen inputs; later extensions require a new accepted research qualification. Library `pin:false` is fixture-only and is never used by CLI/public validation.

The committed compact reports provide numerical current summaries and identity without adding multi-megabyte generated history to Git. Methodology, exact current results, accounting limitations and next-task boundaries: [`../../../docs/AI_CAPEX_MONETIZATION_MONITOR.md`](../../../docs/AI_CAPEX_MONETIZATION_MONITOR.md).
