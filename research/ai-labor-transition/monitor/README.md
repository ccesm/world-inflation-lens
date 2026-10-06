# AI labor research monitor (not activated)

Read [methodology](../../../docs/AI_LABOR_CONTINUOUS_MONITOR.md), [activation checklist](ACTIVATION.md), [qualification](qualification.md) and [fixtures](tests/fixtures/README.md).

Python 3.13 standard library; no credentials or LLM dependency. All operations use an independent store and leave Phase 1–3 files read-only. Files are research-only; no production integration or delivery.

From repository root:

```sh
# Offline dry run; initializes from exact accepted research snapshots.
python3 research/ai-labor-transition/monitor/cli.py dry-run --store /tmp/ai-labor/store --output /tmp/ai-labor/output

# Explicit official-source discovery/refresh; not scheduled or activated.
python3 research/ai-labor-transition/monitor/cli.py refresh --store /tmp/ai-labor/store --output /tmp/ai-labor/output

# Validate current view and reconstruct its recorded source/economic evidence.
python3 research/ai-labor-transition/monitor/cli.py validate --store /tmp/ai-labor/store --output /tmp/ai-labor/output

# Replay only an actually recorded/accepted evaluation at or before a cutoff.
python3 research/ai-labor-transition/monitor/cli.py replay --store /tmp/ai-labor/store --as-of 2026-10-07T00:00:00Z

# Offline tests with small controlled source fixtures and accepted historical inputs.
python3 -m unittest discover -s research/ai-labor-transition/monitor/tests -v

# Validate a bounded recovery package, without applying it.
python3 research/ai-labor-transition/monitor/history/package.py /tmp/ai-labor/store /tmp/ai-labor/recovered
```

Use an actual accepted timestamp for replay; dates before the first project record are unavailable. `--run-at` is explicit qualification/runtime context, not an instruction to fabricate historical availability. Acceptance uses a separate clock after initialization/refresh. The historical reconstruction file is clearly current-vintage, not a real-time backtest.

The checked-in current files record a bounded **offline baseline qualification**. They are not a live subscription or proof that a scheduler ran. Re-running writes to the chosen output/store, not these files. Large CPS raw ZIPs are transient; accepted sufficient statistics and exact identities remain. The GitHub workflow has independent variable gates, and feature-branch manual dry runs cannot publish history.

Outputs:

- `current-monitor.json`: evidence plus separately dated operational source health, bilingual prepared summary;
- `monitor-history-manifest.json`: actual recorded evaluations and predecessor identities;
- `source-refresh-status.json`: discovery, independent failures, no-new-data status;
- `evidence-transitions.json`: observations/revisions/withdrawals and descriptive transitions;
- `alert-candidates.json`: deduplicated candidates, **delivery disabled**;
- `monitor-qualification.json`: runtime/context and no public/remote/email activation;
- `historical-reconstruction.json`: separate current-vintage endpoint inspection.

Process exit 1 means core validation/history failure. A source failure is isolated and reported in `source-refresh-status.json`; a process exit 0 does not mean all sources succeeded. `NO_NEW_OBSERVATION` describes a source check; `NO_ECONOMIC_CHANGE` describes the interpretation decision. Current source health never makes an old annual interpretation appear newly observed.

The durable store contains immutable `objects/`, `evaluations/`, aggregate `intake/sources/` raw/manifests, and mutable pointers/cache/alert ledger. Recovery packaging rejects unexpected files, symlinks, large raw archives, immutable overwrites or deletion of retained evidence. Remote history writes are disabled for manual qualification; the later approved workflow writer targets only the separate history branch.
