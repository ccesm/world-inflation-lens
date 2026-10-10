# Phase C2 — research-only macro descriptive engine

Baseline: `eb2da0e23ab9840e385a09b3889baa4454fddd74` on `codex/ai-infra-macro-signals-phase-c1m`.
Branch: `codex/ai-infra-macro-descriptive-phase-c2`.

This implements exactly the twelve C1-M core indicators. It reads frozen C1-M/C1A inputs, makes native-frequency descriptive calculations and generates a single canonical model as JSON, long-form CSV and Markdown. It has no network, production import, forecast, automated refresh or publication function. No extra context indicators are processed.

From the repository root, using Python 3 stdlib:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 research/ai-infrastructure-paper-validation/phase-c2/engine.py --as-of 2026-10-09
PYTHONDONTWRITEBYTECODE=1 python3 research/ai-infrastructure-paper-validation/phase-c2/test_phase_c2.py
```

The first command checks frozen outputs without writing. `--write` regenerates only this phase's `outputs/`; `--identity` emits hashes without writing. The explicit as-of is the qualified source-review cutoff, not an implicit clock. Other as-of dates fail until a new source vintage is independently qualified. There is no real-time historical backtest.

Independent parser controls:

```sh
PYTHONDONTWRITEBYTECODE=1 python3 research/ai-infrastructure-paper-validation/phase-c2/control_audit.py
```

For the optional full original EIA workbook check, add `--existing-eia-cache "$WIL_AI_ELECTRICITY_CACHE"`, pointing to the existing content-addressed cache (default historical convention `~/Public/wil-ai-electricity-cache`). It reads only the already-qualified object. Nothing is downloaded. The committed `raw-control-validation.json` records the qualification execution that checked that object; absence of a local external cache is never misreported as a successful new raw check.

`outputs/analysis.json` contains all native histories and series-level provenance; `observations.csv` contains all 12,949 native rows and arithmetic; `analysis.md` provides independent indicator summaries, scope limitations and evidence distinctions. Literal `null` is used in CSV. `outputs/identity.json` records byte sizes and SHA-256 hashes for all three products and their output-set identity.

See `PHASE_C2_DESCRIPTIVE_REPORT.md` for interpretation and remaining gaps, `methodology.md` for formulas and clocks, and `qualification-report.json` for executed validation. Earlier phases have scope-sensitive tests: run B1/B2/C0/C1A/C1-M in their clean exact baseline worktrees; C2's 557-file lock verifies that their artifacts and the application have not changed here.

Stop after C2. Any future acquisition, empirical association study, public integration, merge or deployment needs separate authorization.
