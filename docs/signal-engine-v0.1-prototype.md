# Signal Engine V0.1 offline prototype review

Status: **READY FOR INDEPENDENT METHODOLOGY REVIEW**. This is an isolated implementation of the frozen design, not threshold calibration, a real-time backtest, or permission for production integration.

Starting spec commit: `faaae287f1b144bd8396023a8f134b66ae84404c`. Branch: `codex/signal-engine-prototype`. The spec branch was pushed as a safety checkpoint before branching. Inputs reference production commit `b3d2fc295b0378c7d29ae6fe8d36e275a55753a9`; production remains version 1.0.0. All five authoritative spec/config/schema files remain byte-identical.

## Architecture and invocation

The private package under `research/signal-engine/` has local snapshot/contract loading, pure transforms and factor evaluation, native-period alignment, categorical confidence, shared operand lineage, schema/semantic validation, and immutable artifact storage. CLI and report entry points are separate from the calculation engine. There are no production imports, new routes, refresh hooks or workflows.

`fixtures/spec-lock.json` pins the normative documents, rule/schema and existing contract/freshness utilities. `fixtures/input-contracts.json` pins original source definitions. `fixtures/repository-manifest.json` records hashes and actual local validation acceptance for fourteen canonical dataset files; twelve supply evidence to the current output. Economic files are read from retained Git blobs, not repaired or fetched. Existing freshness, release-calendar and source-contract utilities are reused; the existing international validator also checks capture inputs.

[The package README](../research/signal-engine/README.md) contains complete current, historical, sensitivity and capture commands. Invocations require the supported rule version, explicit mode, manifest, evaluation time, applicable cutoff and offline output path. Unknown/duplicate options fail. The public package and its scripts are unchanged; this private package has its own pinned AJV dependencies.

## Seven independent factors

Entry and quiet values below are absolute magnitudes. Every required transformed confirmation must meet the inclusive positive band, inclusive negative band, or inclusive quiet band. Otherwise the result is `TRANSITION`. Missing/invalid inputs yield `INSUFFICIENT_DATA` and `UNASSESSED`, never a neutral assessment. Persistence counts distinct native periods, not runs. Comparisons use the specified eight-decimal rounding; no interpolation or unit conversion is introduced.

| Factor / sole primary | Transform | Entry / quiet | Confirmations / contiguous raw periods |
| --- | --- | --- | --- |
| Core inflation / `PCEPILFE` | YoY inflation minus YoY three months earlier | 0.3 / 0.1 pp | 3 months / 18 months |
| Productivity / `OPHNFB` | YoY output-per-hour index growth | 0.5 / 0.1% | 2 quarters / 6 quarters |
| Supply chain / `GSCPI` | Latest three-month mean minus preceding mean | 0.5 / 0.1 published index units | 2 months / 7 months |
| Policy rate / `FEDFUNDS` | Effective rate minus three months earlier | 0.25 / 0.05 pp | 2 months / 5 months |
| Reserve share / `COFER_USD` | Share minus eight quarters earlier | 1 / 0.25 pp | 2 quarters / 10 quarters |
| Treasury holdings / `TIC_TOTAL` | YoY nominal holdings growth | 5 / 1% | 3 months / 15 months |
| Offshore credit / `BIS_USD_TOTAL` | YoY outstanding nominal credit growth | 5 / 1% | 2 quarters / 6 quarters |

The complete input ownership and context inventory remains in the frozen factor matrix/config. Core PCE also emits its latest YoY inflation level, without another classifier. COFER uses the repository's revised IMF-imputed global FX-reserve denominator, excluding gold; it is not the old allocated-reserve denominator. TIC measures holdings, not flows or ultimate ownership. BIS measures USD credit to non-bank borrowers outside the US, not M2, a break-adjusted growth series or funding stress.

Only the four configured context derivations execute: matched Treasury nominal-minus-real yield; matched fiscal interest/revenue; deficit sign display; complete-quarter real GDP per worker. All operands have exact periods and shared lineage. BIS loans/securities, TIC holder subsets, CPI components, related productivity measures and Treasury derivations cannot become extra factors or votes. There is no aggregate score, weighting or probability.

Confidence follows ordered, noncompensating rules: invalid primary is `UNASSESSED`; a complete comparable revision changing same-endpoint classification is `LOW`; documented timing/context/imputation/archive/sensitivity limitations cap at `MEDIUM`; `HIGH` requires every specified quality gate. Economic disagreement alone does not reduce evidence quality.

## Timing, replay, revisions and lineage

Native daily/weekly/monthly/quarterly/fiscal-year/publication-fact semantics are retained. Quarterly storage anchors denote complete quarters. Exact calendar lags and full raw windows are required; nulls, gaps, duplicates, incompatible units/denominators, definition breaks and nonfinite transforms fail safely. The original freshness policies gate current source snapshots. Historical lag operands do not expire independently; complete-quarter GDP per worker uses the specified derived 150-day policy.

The local manifest was accepted at **2026-10-03T15:55:16.403Z**, after validation. It is not backdated to source publication, retrieval, earlier observation coverage or a Git commit time.

- `CURRENT_SNAPSHOT` uses supported snapshot/point availability and original freshness at explicit `asOf`.
- `CURRENT_VINTAGE_RECONSTRUCTION` uses `periodCutoff`, emits null `asOf` and a false historical availability claim, retains hindsight limitations and caps confidence at MEDIUM. Operational historical freshness is not claimed.
- `RECORDED_AS_OF` selects the latest complete accepted retained dataset no later than the cutoff. It never falls back to today's revised values.
- `TRUE_RELEASE_VINTAGE` fails explicitly. Publisher vintage archives are unavailable.

Raw evidence identifies source/key/URL, units, denominator, raw values, exact observation periods, snapshot hash/vintage, availability bounds, update/retrieval precision, maintenance type, freshness and rule. Primary records retain their full raw/transformed persistence windows. Derived records reference exact operands, use maximum operand availability and a deterministic derived-vintage hash; they do not invent a publisher or source payload. Schema validation is supplemented by source-value matching, transform/band recomputation, timing, ownership, dependency and complete assessment consistency checks.

Compatible retained revisions are compared at the same endpoint/window. Revised classification is identified separately from new observations and changes in context/status. Missing prior payloads cap confidence instead of pretending revision stability. Immutable writes preserve old artifacts; interrupted promotion, retries, corruption and rollback have explicit tests.

## Recorded current assessment

At the manifest's explicit acceptance/evaluation time, all seven factors are `READY`, with `MEDIUM` evidence confidence. No HIGH classification is claimed from official-source reputation alone.

| Factor | Latest period | Latest transform | Confirmed state |
| --- | --- | --- | --- |
| Core inflation | 2026-08 | −0.154114 pp | `TRANSITION` |
| Productivity | 2026-Q2 | +2.242194% YoY | `OUTPUT_PER_HOUR_GROWING` |
| Supply chain | 2026-08 | −0.386667 index units | `TRANSITION` |
| Effective policy rate | 2026-09 | +0.12 pp | `TRANSITION` |
| USD reserve share | 2026-Q2 | −2.159203 pp over eight quarters | `USD_RESERVE_SHARE_FALLING` |
| Foreign Treasury holdings | 2026-07 | +1.521261% YoY | `TRANSITION` |
| Offshore USD credit | 2026-Q1 | +7.365638% YoY | `OFFSHORE_USD_CREDIT_EXPANDING` |

The displayed latest transform alone cannot replace the full persistence-window result. Core PCE's supplementary YoY level is +3.007596%; slower inflation acceleration is not restored purchasing power. International evidence is `MIXED` through the specified reserve/credit divergence contrast. These measure different functions and denominators; they do not yield a net dollar conclusion. Coverage remains partial for both outcomes.

The full local artifact is `research/signal-engine/outputs/current.json`. Canonical SHA-256: `8e4732df4bc13d4dfaed5c92018daa8b53038155979e6c58af1aabf051e435aa`. Fresh-process reruns reproduce those bytes/hash. Execution timestamps live separately under `outputs/runs/`; report timing is outside engine payloads.

## Historical coverage and sensitivity

All **660 month-end evaluations from January 1970 through December 2024**, including intervening quiet periods, are retained. Each endpoint has the nine declared sensitivity variants: **5,940 variant evaluations**. Quarterly readings remain quarterly; repeated monthly evaluations are not independent observations. No target answer, predictive hit rate or parameter optimization is used.

| Episode | Coverage after warm-up |
| --- | --- |
| 1970–1984 | Core inflation, productivity, policy rate: 180/180; GSCPI/international unavailable |
| 2000–2007 | Domestic four: 96/96; reserves 67/96; BIS 79/96; TIC unavailable |
| 2008–2009 | Six factors: 24/24; TIC unavailable |
| 2020 | Six factors: 12/12; TIC lacks required prior history |
| 2021–2022 | Six factors: 24/24; TIC 22/24 after March 2021 warm-up |
| 2022–2024 | All seven: 36/36 |

Exact raw-history warm-ups are Core PCE 1960-06, OPHNFB 1948-Q2, FEDFUNDS 1954-11, GSCPI 1998-03, COFER 2002-Q2, BIS 2001-Q2 and TIC 2021-03. Full episode state counts, exclusions and first usable endpoints are retained in [the committed review summary](../research/signal-engine/fixtures/review-results.json); individual full payloads and chronological rows are generated beneath `outputs/historical-final/`.

For example, the 2022-06-30 current-vintage reconstruction reports core/supply/TIC/BIS `TRANSITION`, productivity contracting, policy rate rising and reserve share falling. Every eligible factor is retrospectively labeled MEDIUM. Recorded-project replay for that same historical cutoff instead returns all seven factors unavailable: the manifest has no accepted vintage then. This is not a real-time backtest.

The preregistered grid jointly multiplies entry/quiet bands by 0.5, 1 or 1.5 and changes persistence by −1, 0 or +1, minimum one. Current GSCPI changes to falling only with 0.5 bands and one fewer confirmation; BIS changes from expanding to TRANSITION for all three 1.5-band variants. Other current states remain unchanged. Across the entire historical grid, different-state counts versus base are core 992, productivity 689, GSCPI 620, policy 966, reserves 543, TIC 75 and BIS 513. These are sensitivity comparisons, not independent historical events or a ranking of better rules.

## Validation and production isolation

The normative catalogue has **83 cases: 81 implemented and passing, two deferred**, with case-by-case expected invariants, test references and recorded outcomes in [validation-results.json](../research/signal-engine/tests/validation-results.json). Deferred cases:

- **TM-14**, successful publisher-vintage replay: deliberately unsupported without archived released vintages. Project exclusion and exact acceptance boundaries are implemented and tested.
- **OP-03**, execution of a new adopted rule version: only immutable draft.1 is authorized. Mutation rejection, immutable retention and old-input rollback are implemented and tested; a future methodology requires separate approval/versioning.

Supplementary per-factor, property and review tests cover all seven arithmetic/band/window contracts, confidence/as-of/lineage, sensitivity, forged derivations, failure isolation and strict CLI options. The final suite reports **107 tests: 105 passing, zero failing, two skipped** (81 normative plus 24 supplementary passes), in 23.90 seconds. Runtime, case definitions, baseline input hashes and exact outcomes are recorded in the machine-readable validation report. Its baseline hashes are not presented as the hashes of every mutated synthetic fixture. AJV Draft 2020-12 validates every generated engine artifact; semantic checks fail the run on broken lineage or assessments. English/Chinese factor terminology and locale-independent numeric output are tested; there is no UI or browser acceptance in this offline task.

Two specification/interface clarifications are explicitly retained for independent review:

1. The committed schema names factor state `direction`, keeps mode/as-of and shared lineage at artifact level, and represents outcome membership through factor-ID collections. Adding duplicate `state`/`outcome`/`asOf`/`lineage` fields would violate its closed schema. This implementation follows the authoritative schema and resolves evidence references; it does not edit the schema.
2. IN-12's unchanged canonical result and raw source-byte identity cannot both mean an unchanged *entire provenance payload* when equivalent source JSON is serialized into different bytes. Logical canonical serialization is unchanged; raw payload hashes remain distinct and would correctly change the full provenance artifact. This test makes that distinction explicit rather than discarding source identity. The frozen specification is preserved; no numerical rule is reinterpreted.

The frozen factor configuration uses some explanatory denominator strings, while repository metadata uses the original exact contract text. Compatibility validates the pinned original source contract and emits its genuine denominator, including COFER's revised imputed basis. It does not overwrite metadata with a paraphrase.

Measured on Node.js 24.19.0 / timezone database 2026b: current cold evaluation approximately **0.55 seconds**, warmed current nine-variant suite **0.46 seconds**, complete chronology plus historical sensitivity/schema/semantic validation and artifact writes **98.03 seconds**. This is offline performance, not production bundle work. Immutable-source caches avoid repeatedly checking long daily histories without changing mutable test behavior.

`npm run build` and `npm run verify` pass. Existing build chunk-size warnings remain. Production source, routes, economic snapshots, workflows, notification behavior and root package/version are unchanged; neither `src` nor built `dist` contains prototype imports/config/output markers. No production email, merge or deployment was performed. Large generated histories/dependencies are ignored; pinned inputs, review summaries, implementation, tests and documentation are committed.

## Remaining limits and next task

Thresholds are provisional noise guards, not calibrated economic boundaries. Publisher vintages and historical imputation detail are incomplete; full prior-value revision stability cannot be inferred from ledger counts. The real manifest has one accepted local vintage, so historical project replay is intentionally unavailable. Source payloads not archived by the repository are explicitly identified as retention limitations. Current-vintage reconstructed values include revised histories and COFER's revised backcast. Fiscal, aggregate Treasury/FX, Digital Dollarization and Global Funding/Carry remain deferred.

The next task should independently review all seven rules, evidence ownership, timing boundaries, source-contract mapping, confidence/revision sensitivity and precise interpretation language using the frozen artifacts and catalogue. Resolve that methodology review before proposing prospective archive collection or production integration. No UI or live signals are recommended for automatic release by this prototype report.
