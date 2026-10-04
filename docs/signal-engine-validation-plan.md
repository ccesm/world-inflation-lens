# Signal Engine validation plan — offline V0.1

**Status:** specification for a future isolated prototype; the engine and the tests below are not implemented by this document. No engine test results or production readiness are claimed. Read with [the specification](signal-engine-spec.md) and [the factor matrix](signal-engine-factor-matrix.md). Numeric thresholds, exact transforms, persistence windows, freshness policies and canonical identifiers must come from one immutable rule configuration; this plan does not introduce competing values.

## 1. What acceptance means

There are two separate gates:

1. **Design acceptance:** the documentation and draft configuration define deterministic behavior, complete input/output contracts, explicit limitations and tests with independently checkable expected results. Passing this gate permits offline implementation only.
2. **Implementation acceptance:** a future local engine passes the test suite described here against synthetic fixtures and pinned validated repository snapshots. It produces traceable JSON without altering economic snapshots, production UI, workflows or production status. Passing this gate permits an independent prototype review, not deployment.

The first prototype contains seven descriptive factors: core inflation persistence, measured labor productivity, GSCPI supply-chain pressure, effective policy-rate direction, USD reserve-share trend, foreign Treasury holdings trend and offshore USD credit outstanding trend. The last three describe different international functions. No aggregate score, forecast probability or trading recommendation is an acceptance target.

For each accepted factor, design review must find a single answer for: primary and context series; input units and frequency; calendar lags; minimum contiguous history; level versus direction semantics; equality at thresholds; persistence and initialization; missingness; availability and release precision; freshness; revisions; confidence; dependency groups; output lineage. An unresolved choice is a design defect, not permission for an implementer to invent a default.

## 2. Test environment and evidence records

The future implementation should run from an isolated `research/signal-engine/` or `scripts/signal-engine/` area, read validated snapshots from a pinned repository commit, and write only to an explicit temporary output directory. Tests must disable network access and use a frozen evaluation time, explicit time zones, a pinned rule version and fixed input manifests. Do not fetch current official data during deterministic tests.

Each test report records the case ID, rule version and rule-content hash, input commit and payload hashes, requested evaluation mode, its applicable cutoff and `evaluatedAt`, expected result, actual result, pass/fail, and reason for any intentional exclusion. Retain the generated lineage JSON for failures. Avoid run-time timestamps inside the deterministic result hash; operational logs may carry them separately.

Synthetic fixtures must be small enough to calculate independently. Use distinctive values and explicit periods so accidental row-offset alignment cannot pass. Expected values should be hand-derived or produced by an independent reference calculation, not by calling the same helper under test. Store representative complete repository snapshots by reference/hash rather than duplicating all production data.

A fixture manifest must distinguish observation periods, value vintages, publisher availability evidence, project first-seen evidence, validation/acceptance time, retrieval precision, and input provenance. A synthetic release calendar must be clearly identified as synthetic; it must never supply invented historical publisher dates to real series.

## 3. Availability modes and their acceptance boundaries

The specification defines four distinct modes:

| Mode | What the result may claim | Required restriction |
| --- | --- | --- |
| `CURRENT_SNAPSHOT` | What the pinned, validated snapshot supports at the explicit evaluation time | Enforce the snapshot's availability and freshness contract; record `evaluatedAt`, input identity and observation periods |
| `CURRENT_VINTAGE_RECONSTRUCTION` | How the selected revised snapshot describes earlier observation periods under the selected rules | Use `periodCutoff` separately from `evaluatedAt`; declare hindsight limitations and make no historical `asOf` availability claim or real-time backtest claim |
| `RECORDED_AS_OF` | What this project could have computed from retained, validated inputs it had actually accepted by the cutoff | Require retained project evidence and acceptance times; distinguish this conservative project cutoff from first public release |
| `TRUE_RELEASE_VINTAGE` | What an observer could have computed using retained source vintages demonstrably public by the historical cutoff | Deferred pending publisher-vintage archives; eventually require the applicable value vintage and supported public availability bound for every required input |

`TRUE_RELEASE_VINTAGE` is a future contract and must fail explicitly as unsupported in the first prototype. `RECORDED_AS_OF` is usable only within the archive coverage actually proved by the selected inputs; unsupported cutoffs remain unavailable. A request for strict replay must never silently run retrospective calculations instead.

The inspected repository provides current revised histories and some project snapshot/revision evidence, not a complete original-release archive. The international revision ledger begins with project ingestion in October 2026. Earlier observations within that ingestion are not earlier project vintages. Git history alone is not proof of the original publisher release time or of all intervening vintages. FRED distributor `Last Updated`, Treasury HTTP `Last-Modified`, and a current IMF release timestamp cannot be assigned to each old row as that row's original publication date. BIS publisher release time is explicitly unknown in the integrated snapshot.

## 4. Core test catalogue

All cases below are **required future tests**, not statements that tests have run.

### A. Input integrity and transform safety

| ID | Fixture/action | Expected invariant |
| --- | --- | --- |
| IN-01 | Missing required series; empty observations; all values null | Factor is unavailable with specific missing-input reasons; no zero, neutral direction or confidence inferred |
| IN-02 | Wrong units, frequency, series identity, seasonal-adjustment basis or denominator | Reject incompatible input before transforms; no implicit conversion |
| IN-03 | Duplicate periods, invalid month, invalid quarter, inconsistent `date`/`sourcePeriod`, non-finite value | Validation failure identifies the defect; no arbitrary duplicate selection |
| IN-04 | Unsorted valid observations | Reject under the draft config; never silently make order-dependent calculations |
| IN-05 | Missing exact `t−12` monthly or `t−4` quarterly value while adjacent values exist | Required transform is unavailable; never substitute the previous available row |
| IN-06 | A missing interior period in a required rolling or persistence window | Apply the full calendar-window requirement; no shortened window or interpolation |
| IN-07 | Zero or negative denominator for a percentage-change transform | Reject that transform with a clear reason; no infinity or arbitrary replacement |
| IN-08 | Percent level versus percentage-point change versus percentage change | Correct units survive calculation and output; COFER changes in percentage points cannot be mislabeled percent growth |
| IN-09 | Known two-point growth, rolling mean and period-difference fixtures | Independent arithmetic matches; no double annualization or accidental change of frequency |
| IN-10 | Values immediately below, at and above each threshold | Exact documented inclusive/exclusive behavior; display rounding cannot change state |
| IN-11 | Enough observations by count but insufficient calendar coverage | Remains insufficient; minimum history is a period requirement, not merely an array length |
| IN-12 | Alternate equivalent input serialization | Canonical output is unchanged; source-payload identity remains recorded separately |

### B. Frequency, observation periods and release availability

| ID | Fixture/action | Expected invariant |
| --- | --- | --- |
| TM-01 | Quarterly storage anchor `2026-04` / source period `2026-Q2` | Interpretation is a Q2 observation, with the correct quarter-end boundary where applicable; never a released April value |
| TM-02 | Monthly CPI observation plus a later publication timestamp | It cannot enter strict historical state at observation month-end before publication |
| TM-03 | COFER Q2 observation, release later in the year | Exclude before supported availability; include at the documented inclusive boundary; no quarter-end shortcut |
| TM-04 | Daily, weekly, monthly, quarterly and annual inputs at one cutoff | Select latest eligible input separately, preserve each period and age; no same-calendar-date requirement across unrelated evidence |
| TM-05 | Weekend/holiday evaluation after a daily observation | Follow the source-specific business-day freshness rule; no fictitious weekend data or immediate deterioration |
| TM-06 | Month-end, leap day, quarter boundary and year boundary | Calendar lags and period ends are correct; no fixed 30/90-day substitute for calendar arithmetic |
| TM-07 | Date-only release; release-month only; unknown source time | Retain precision and use only a justified conservative bound; no invented midnight timestamp or guessed release day |
| TM-08 | Explicit America/New_York or other source time zone across DST | Convert documented local times correctly; ambiguous/invalid source timestamps remain rejected or unresolved |
| TM-09 | Latest economic observation predates expected next release | Report waiting/within expected cycle as specified; absence of unreleased data is not deterioration |
| TM-10 | Expected release passes, then grace period expires | Freshness/data status changes according to the declared policy, independently of economic direction |
| TM-11 | Source schedule unavailable or publisher time unknown | Disclose heuristic/unknown scheduling; do not claim a missed official release from an estimate |
| TM-12 | Daily successful fetch of identical quarterly snapshot | Retrieval/check changes alone create no new observation, release, persistence count or signal evidence |
| TM-13 | Timestamp exactly equal to `asOf`, then one instant later | Eligibility follows the documented boundary and is consistent across all inputs |
| TM-14 | Source published before cutoff but project accepted after cutoff | Strict public replay requires the archived released vintage; project replay excludes it until acceptance |
| TM-15 | Release/update stamp contradicts period or accepted provenance | Fail safely with a diagnostic; neither silently reorder timestamps nor overwrite original metadata |
| TM-16 | Eligible quarterly GDP and current employment snapshot; required quarter's first employment month is older than 45 days | Complete-quarter GDP per worker remains calculable under the 150-day derived-quarter policy. Historical operands retain exact availability but do not expire individually; stale source snapshots or an overdue derived quarter still block. |

### C. Vintages, revisions and no-lookahead

| ID | Fixture/action | Expected invariant |
| --- | --- | --- |
| VT-01 | Original value A available before cutoff; revised value B after cutoff | Strict replay uses A; later cutoff may use B; current-vintage mode remains distinctly labeled |
| VT-02 | Only current revised history exists for a historical cutoff | Strict replay reports unsupported/insufficient vintage coverage; no silent retrospective fallback |
| VT-03 | One file has a current update stamp and decades of history | That stamp describes the retained vintage, not historical first availability of every row |
| VT-04 | Later release revises one lagged value used in current growth | Recompute affected evidence and name the changed source period/vintage in lineage |
| VT-05 | Revision-only release crosses a state threshold with no new observation period | Mark revision-driven interpretation change; preserve prior output and do not count it as another observation-period confirmation |
| VT-06 | Revision ledger has summaries but lacks recoverable prior payload | Do not claim exact reconstruction; a count of revisions is not the missing vintage |
| VT-07 | Add future observations, future revisions or future publication metadata to input archive | Earlier strict replay output is byte-identical after canonicalization |
| VT-08 | Full-sample percentile/reference distribution includes future periods | Reject leakage; any permitted benchmark uses only its declared training/reference window and vintage |
| VT-09 | Retroactive methodology break or changed denominator | Reject incompatible splicing; require explicit methodology identity and version policy |
| VT-10 | A historical value disappears or a source withdraws a period | Preserve old artifacts; expose withdrawal and affected coverage rather than quietly substituting zero |
| VT-11 | Project's first archive includes earlier observations | Project replay begins at supported first-seen/acceptance evidence, not the earliest observation year |
| VT-12 | Snapshot date/retrieval is coarse but an accepted manifest has a supported timestamp | Use the manifest only for the meaning it proves; do not upgrade publisher precision |
| VT-13 | Replay at prior cutoff after downloading a new vintage | Old output remains reproducible from its input/rule manifest; regenerated new-vintage output receives distinct identity |

The GSCPI snapshot already records broad historical revisions between retained update vintages. Include a compact representative fixture for this case; do not assume only the newest period revises. COFER's revised imputed methodology must likewise not be presented as contemporaneously available in earlier decades.

### D. Factor semantics, persistence and dependency control

| ID | Fixture/action | Expected invariant |
| --- | --- | --- |
| FC-01 | Core inflation level elevated while its direction is declining | Preserve both dimensions; do not describe slower price growth as restored purchasing power or falling prices |
| FC-02 | Headline energy shock without persistent core change | Core persistence cannot be manufactured by headline context; no invented inflation breadth |
| FC-03 | Productivity rises while ULC/compensation move differently | Explain mechanically related evidence without independent extra votes or attribution to AI |
| FC-04 | GPR rises while direct supply/price evidence is unchanged or missing | GPR alone creates no directional GSCPI factor signal; WTI, natural gas and FAO also remain context and cannot replace the primary |
| FC-05 | Monthly FEDFUNDS rises/falls/remains unchanged | Describe effective policy-rate movement, not an estimated neutral rate or proven monetary restraint |
| FC-06 | Small COFER fluctuation inside declared band, then sustained change | Noise band and persistence operate exactly; no claim of a structural regime or reserve-policy motive |
| FC-07 | COFER currencies plus imputation share | Currency composition retains correct denominator; imputation is quality context, not an extra currency vote |
| FC-08 | TIC total and official/country holdings change together | Total owns the main state; overlapping holder data are context/decomposition; holdings are never labeled flows |
| FC-09 | BIS total and both components loaded | Components explain the total without tripling evidence; preserve non-bank borrower residence and USD denomination |
| FC-10 | BIS stock rises | Label stock change precisely; do not call it break-adjusted growth, global funding stress or domestic M2 |
| FC-11 | DGS10 and DFII10 on different dates or one leg missing | No synthetic subtraction across dates; matched evidence availability is no earlier than both components |
| FC-12 | DGS10, DFII10, their difference and T5YIFR present | No three independent votes from related yields; T5YIFR retains its distinct horizon |
| FC-13 | Same factor referenced from domestic and international displays | One evidence identity, multiple references; no duplication in counts or quality assessment |
| FC-14 | Reevaluate unchanged input on successive days | Observation-period persistence is unchanged; elapsed execution count is irrelevant |
| FC-15 | Cold start, then incomplete persistence window, then complete confirmation | Explicit initializing/pending behavior; no unexplained default prior state |
| FC-16 | Direction alternates just around entry/exit bands | The documented stateless persistence window returns the specified direction, quiet state or `TRANSITION`; no hidden prior state determines the answer |
| FC-17 | Missing required period interrupts persistence | Documented interruption policy is applied; never compress time by skipping the gap |
| FC-18 | Opposing strong domestic factors or COFER decline plus BIS expansion | Preserve evidence and counterevidence; structured mixed evidence has no forced net score |

Where a transform uses consecutive observation periods, compute the declared retrospective window from one valid snapshot and label that fact. Where a rule instead requires consecutive release events, archived releases are necessary. These are not interchangeable. V0.1 uses stateless window confirmation; mixed directional/quiet confirmations produce the documented `TRANSITION` state. An undocumented prior process run cannot be an input. Stateful hysteresis is outside this rule version.

### E. Quality, manual evidence and fixed vintages

| ID | Fixture/action | Expected invariant |
| --- | --- | --- |
| QL-01 | Authoritative source but required value missing or stale | Source reputation cannot override missingness/freshness gates |
| QL-02 | Multiple independent quality dimensions degrade | Exact categorical rule produces reproducible quality/reasons; no probability or spurious numeric precision |
| QL-03 | High-quality inputs disagree economically | Quality can remain high while evidence is mixed; disagreement is not evidence corruption |
| QL-04 | Duplicate correlated context added | Quality and effective evidence count cannot improve merely because the same information appears again |
| QL-05 | Manual Digital Money publication fact with a review date | Fact stays contextual and date-specific; review/retrieval is not a new economic observation |
| QL-06 | CBO conditional projection for a future year | Keep fixed-vintage conditional status; exclude from observed-current factor arithmetic |
| QL-07 | Annual/fiscal-year observation with a non-calendar boundary | Preserve period basis; no accidental calendar-year/month conversion |
| QL-08 | BIS verified stock with unknown publisher release timestamp | Current evidence remains usable under the specified mode with an availability-quality limitation; no fabricated public timestamp |
| QL-09 | All factor inputs null or out of scope | Outcome lists absent coverage and unavailable factors; it does not invent neutral/healthy evidence |
| QL-10 | Display precision or translated language changes | Numeric state and quality remain identical; English/Chinese descriptions preserve denominator, direction and uncertainty |

### F. Reproducibility, output and failure isolation

| ID | Fixture/action | Expected invariant |
| --- | --- | --- |
| OP-01 | Same inputs, rule version, mode, applicable cutoff and evaluation time in fresh processes | Canonical JSON and deterministic result hash are identical |
| OP-02 | Threshold/transform change under an already published rule ID | Refuse reuse of the immutable version; require a new rule identity/hash |
| OP-03 | Rule upgrade recomputes earlier periods | Both old and new artifacts remain addressable with full lineage; never silently overwrite interpretation history |
| OP-04 | Unknown rule or output schema version | Fail explicitly; no closest-version fallback |
| OP-05 | Any factor output inspected | Every used value resolves to series, period, vintage, source, units, transform, rule, freshness and availability evidence |
| OP-06 | Malformed optional context versus malformed required primary input | Follow documented scope of failure; report degraded context or unavailable factor without fabricated evidence |
| OP-07 | Engine throws after validated economic snapshot is accepted | Economic snapshot remains valid; report data-refresh success and signal-evaluation failure separately |
| OP-08 | Partial output write or interrupted process | Atomic publication leaves prior complete artifact available; no partial JSON exposed as successful |
| OP-09 | Failed engine after successful snapshot, prior signal retained | Prior signal remains labeled with its original input snapshot/time and failure status; never relabel it as current |
| OP-10 | Retry of identical successful job | Idempotent artifact identity; no duplicate revision or confirmation event |
| OP-11 | Roll back rule or input snapshot | Recreate the corresponding pinned artifact; economic rollback and interpretation rollback remain separate |
| OP-12 | Successful offline run | Only explicit offline output paths change; economic snapshots, UI, workflows, version and production status remain byte-identical |
| OP-13 | Network, email or deployment call attempted | Test harness rejects the side effect; offline evaluation requires none |
| OP-14 | Corrupt input manifest/payload hash | Reject before evaluation; do not trust source labels over integrity failure |

## 5. Exact V0.1 window and threshold fixtures

The draft configuration uses the following provisional conventions. These are reproducibility/noise-control choices, not calibrated causal boundaries. Validate them against the canonical configuration; changes require the documentation and immutable rule identity to move together.

| Factor primary | Transform | Entry / quiet band | Consecutive period confirmations | Required contiguous raw window |
| --- | --- | --- | --- | --- |
| Core PCE | Change in YoY growth versus three months earlier | 0.3 / 0.1 percentage points | 3 months | 18 months |
| OPHNFB | YoY percentage change | 0.5% / 0.1% | 2 quarters | 6 quarters |
| GSCPI | Latest three-month mean minus preceding three-month mean | 0.5 / 0.1 index units (standard-deviation scale) | 2 months | 7 months |
| FEDFUNDS | Change versus three months earlier | 0.25 / 0.05 percentage points | 2 months | 5 months |
| COFER USD | Change versus eight quarters earlier | 1 / 0.25 percentage points | 2 quarters | 10 quarters |
| TIC total | YoY percentage change | 5% / 1% | 3 months | 15 months |
| BIS total | YoY percentage change | 5% / 1% | 2 quarters | 6 quarters |

Entry and quiet bands in the table are absolute magnitudes; the canonical rules define the signed comparisons and exact equality behavior. For each row test both signs, exact positive and negative boundaries, one raw period too few, one interior gap, all confirmations qualifying, only the newest confirmation qualifying, conflicting confirmations, and repeated identical evaluations. The sign-specific final direction, quiet label and `TRANSITION` handling must follow the canonical rule contract. For GSCPI the delta is in its published index units, not a newly computed rolling z-score. For Core PCE, a decline in YoY growth can coexist with a rising price index; this fixture must retain both facts.

## 6. Property and invariant tests

Generate bounded synthetic inputs to verify invariants in addition to named examples:

- Adding future-ineligible observations or revisions cannot alter a strict historical result.
- Changing context/decomposition duplication cannot change primary state or create extra evidence weight.
- All reported finite results are supported by the exact required calendar periods; no interpolation occurs.
- Every selected input satisfies the evaluation mode's availability gate. A derived value cannot become available before any required component.
- An unchanged snapshot cannot advance observation-period persistence, latest observation, publisher release or revision count.
- No artifact contains a domestic/international combined scalar, unsupported probability, investment instruction or implied causal attribution.
- All output lineage references resolve; every excluded required input has a machine-readable reason.
- Reordering valid inputs is either explicitly rejected or produces the same result according to the contract.
- Unit-preserving conversion fixtures retain economics only where conversion is explicitly supported; unrecognized conversions fail.
- Identical immutable manifests yield identical outputs across process restarts and locales.

Property tests supplement, rather than replace, threshold-boundary examples and hand-checked arithmetic.

## 7. Historical evaluation coverage

The following starts were inspected in the current repository. They describe **observation coverage**, not recoverable historical publication vintages. Transform warm-up and persistence delay the first computable factor beyond each raw start.

| Primary series | Integrated observation start | Implication |
| --- | --- | --- |
| Core PCE `PCEPILFE` | 1959-01 | Monthly inflation-history checks can cover the listed post-1959 episodes after warm-up |
| Productivity `OPHNFB` | 1947-Q1 | Quarterly capacity-history checks can cover the listed episodes |
| Effective federal funds `FEDFUNDS` | 1954-07 | Monthly policy-rate history supports the listed episodes |
| GSCPI | 1997-09 | No direct GSCPI factor for the 1970s or early 1980s |
| COFER USD share | 2000-Q1 | Current revised/imputed reserve-share history only from 2000, subject to warm-up |
| BIS total offshore USD credit | 2000-Q1 | Credit-history checks from 2000, subject to warm-up |
| TIC total foreign Treasury holdings | 2020-01 | No TIC factor before 2020; annual-change rules cannot classify early 2020 without the absent prior-year denominator |

With the stated contiguous-window conventions and no gaps, the earliest retrospective factor endpoints are Core PCE 1960-06, OPHNFB 1948-Q2, FEDFUNDS 1954-11, GSCPI 1998-03, COFER 2002-Q2, BIS 2001-Q2 and TIC 2021-03. These are arithmetic warm-up endpoints, not historical availability dates.

Use all declared episode windows and intervening periods supported by the retained snapshots. Freeze episode windows and rule configuration before inspecting outputs. Do not select only visually convincing dates, tune thresholds to a desired historical story, or report predictive hit rates from revised data. Synthetic tests are the source of precise expected labels; historical checks are interpretability and coverage reviews.

| Review window | Supported factor families | Qualitative question, without a target label |
| --- | --- | --- |
| 1970-01–1984-12, including 1970s inflation and early-1980s disinflation | Core inflation, productivity, policy-rate direction | Are level and direction distinct, transformations explainable, and missing international/GSCPI coverage explicit? |
| 2000-01–2007-12 commodity-cycle context | Domestic trio, GSCPI, COFER and BIS after warm-up | Do supply, core inflation and policy remain distinct, and are nominal stock/composition changes described without inferred motives? |
| 2008-01–2009-12 crisis | Same six available families; TIC absent | Are rapid reversals preserved without invented interpolation or a single coherent directional narrative? |
| 2020-01–2020-12 pandemic onset | Six families plus TIC levels; TIC transforms only when history permits | Can conflicting supply/demand channels, base effects and TIC warm-up remain explicit? |
| 2021-01–2022-12 inflation period | All seven after their exact warm-up/persistence gates | Are price-level change, persistent core growth, supply pressure and policy response distinguished? |
| 2022-01–2024-12 tightening/disinflation review | All seven where contiguous inputs exist | Do declines in inflation rates avoid being described as restored purchasing power, and do stock trends avoid becoming demand/motive claims? |

Overlap between review windows is intentional context, not extra independent validation evidence. Include quiet intervals and all in-between periods in an accompanying chronological output, including unavailable states. If an inspected series has an internal gap, the raw coverage table does not waive that gap.

A historical report must state: mode; rule/input identity; available-factor count by period; exclusions; vintage limitations; actual transitions with supporting values; revision sensitivity; and any ambiguous interpretation. Historical plausibility is not evidence of causality or forecasting performance. A future true real-time study requires separately acquired and validated publisher vintages or retained prospective project artifacts with adequate time evidence.

## 8. Threshold and revision sensitivity review

Before freezing an offline implementation version, document why each threshold is economically interpretable or an explicitly provisional noise guard. Do not optimize it to split states evenly or fit selected episodes. Independently vary each threshold/window within a predeclared, reasonable range and report changed classifications and unchanged conclusions; do not choose the variant with the most attractive narrative.

Sensitivity experiments use the config's preregistered Cartesian grid (joint entry/quiet multipliers and persistence offsets). Record each scenario's parameters/hash separately from the unchanged base rule hash; an adopted behavior change needs a new rule version. An unavailable variant is disclosed as unevaluated and caps confidence; do not remove estimated required points and mistake the resulting missing window for measured sensitivity. Inspect revisions affecting the latest period, a lag denominator, a persistence window, a full historical series and a methodology identity. Report whether interpretation changes arise from new observations, revisions, threshold changes or availability/freshness changes. None of those mechanisms may silently overwrite earlier outputs.

## 9. Next offline implementation acceptance checklist

A future engineering task is complete only when it provides:

1. Isolated, documented local invocation accepting explicit snapshot manifest, rule version, mode, `evaluatedAt`, the mode-specific cutoff and output path; unsupported modes return a clear error.
2. Machine-readable schema and fixture suite covering all applicable catalogue cases, with a reasoned exclusion for any deliberately unsupported optional feature.
3. Independent arithmetic and boundary expectations for all seven factors, including initialization, persistence and mixed evidence.
4. Deterministic lineage-rich JSON for a pinned current snapshot and synthetic historical replay fixtures. Actual retrospective historical reports carry the current-vintage limitation prominently.
5. A chronological coverage report for the supported historical windows, with no fabricated pre-coverage states and no threshold tuning against episode outcomes.
6. Failure-injection evidence demonstrating that engine errors, stale artifacts and retries cannot invalidate validated economic snapshots or misrepresent old signals as current.
7. A manifest comparison proving unchanged production UI, economic data, workflows, notification behavior and public version; no network/email/deployment side effects.
8. A test execution report listing commands, tool/runtime versions, input hashes, case totals, failures and exclusions. Documentation/config validation is identified separately from engine runtime tests.
9. Independent review of methodology, input ownership, no-lookahead boundaries and interpretation language before any production-integration proposal.

The result should be designated **READY FOR OFFLINE PROTOTYPE REVIEW** only after these future implementation checks pass. Production integration, browser acceptance and automation changes require a separate authorized task; this document neither performs them nor claims their acceptance.

## 10. Specification checks performed — 2026-10-03

These are checks of this documentation/configuration change, distinct from the future engine tests above:

- All 78 registry IDs have exactly one classification/owner; seven distinct primary owners match the four-domestic/three-international scope. Their source snapshot identities, exact units, frequencies, configured freshness lags, minimum transform/persistence windows and context references were checked against the inspected base.
- Local document/config links resolve. The output schema passes the JSON Schema Draft 2020-12 metaschema using a temporary `jsonschema 4.23.0` validator outside the repository.
- Twelve temporary structural fixtures pass: accepted unavailable/retrospective/raw/derived/supplemental output shapes and rejection of wrong as-of shape, retrospective historical claims, aggregate fields, numeric confidence, high-confidence missing evidence and false single-snapshot derived lineage. These do not validate engine arithmetic or semantic lineage resolution; no engine exists yet.
- Independent design review found and resolved ambiguity in derived operand lineage and endpoint freshness, measurement horizons, estimate sensitivity, scalar status precedence, deterministic context selection and the supplemental core inflation level.
- `npm run build` passes. Existing large-chunk warnings remain; this change adds no production imports or bundle content.
- `npm run verify` passes all existing repository suites, including economic calculations, source contracts, freshness, rollback and notification fixtures. Verification reports no real mail sent.
- No production browser acceptance was required or claimed for this documentation/config-only change. Future UI acceptance is a separate task.

Decision: **READY FOR OFFLINE PROTOTYPE**. Threshold calibration, true publisher-vintage replay, engine runtime validation and production integration are not completed by these checks.
