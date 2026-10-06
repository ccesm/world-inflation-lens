# Observed labor outcomes by AI exposure — Phase 3

This research layer asks whether observed U.S. labor outcomes differ across fixed, source-specific AI exposure groups. It does not estimate an AI treatment effect, displaced jobs, occupational hiring or a forecast. **Observed differences across AI-exposure groups do not establish that AI caused those differences.** Every analytical artifact carries `causalityStatus: DESCRIPTIVE_ONLY`.

Base: Phase 2 commit `e09b7c973fae4b219aea1132206f5f06995d3717`. No production integration, Signal changes, fiscal coupling or investment-return coupling.

## Source feasibility and time semantics

| Source | Decision | Accepted evidence / boundary |
|---|---|---|
| Census/BLS CPS Basic Monthly public-use microdata | INTEGRATED | 139 official ZIPs, January 2015–August 2026; October 2025 does not exist. Native monthly records support annual/matched-month estimates |
| Census 2018 occupation code list and 2010→2018 crosswalk | INTEGRATED | Official September 26, 2019 workbook; all source change/crosswalk rows preserved |
| BLS OEWS | ADAPTER QUALIFIED, REAL DATA UNAVAILABLE | Official national May 2025 ZIP and BLS download endpoints returned HTTP 403. Synthetic parsing tests do not constitute a real accepted vintage. No unofficial substitute or invented OEWS values |
| Academic human Beta capability exposure | INTEGRATED, FIXED | Phase 2 input, task-based capability rubric, native source ranks; not actual use or job-loss risk |
| Microsoft platform-derived applicability | INTEGRATED, FIXED | Phase 2 exact detailed matches; mixed reporting levels in native quantile population disclosed |
| Anthropic | CONTEXT ONLY | Phase 2 task-use links/modes; not an exogenous classifier, adoption rate or explanation of employment |
| Phase 1 aggregate labor pipeline | MACRO CONTEXT ONLY | Read-only reference/hash; aggregate JOLTS is never interpreted as occupational hiring |

Official sources: [CPS downloads](https://www.census.gov/data/datasets/time-series/demo/cps/cps-basic.html), [Census code lists](https://www.census.gov/topics/employment/industry-occupation/guidance/code-lists.html), [OEWS comparability guidance](https://www.bls.gov/oes/oes_ques.htm), [CPS 2025 shutdown guidance](https://www.bls.gov/cps/methods/2025-federal-government-shutdown-impact-cps.htm), [Census earnings disclosure changes](https://www.census.gov/programs-surveys/cps/technical-documentation/user-notes/2023-cps-puf-changes.html).

All accepted inputs are U.S. federal public data, with official URLs, byte lengths, SHA-256, taxonomy, layouts and periods pinned in `outcomes/sources/manifest.json`. Actual retrieval timestamps live separately in `sources/retrieval-receipts.json`. Exact publisher release times are unavailable from these files; retrieval is not relabeled release or observation time. This is a current public-use snapshot reconstruction, not real-time vintage history. Source revisions require explicit review/repinning, not silent replacement.

Large public-use ZIPs remain in an external temporary/cache directory, outside Git. The repository retains sufficient-statistic aggregates, immutable monthly vintages, raw dictionary/concordance bytes and exact file identities/retrieval commands. It does not redistribute individual records or identifier panels. Full raw reconstruction requires retrieval of the pinned files. No IPUMS, proprietary payroll panel or credentialed source is required.

## Preanalysis specification

Before outcome comparisons, `outcomes/preanalysis-spec.json` froze the sample definition, source-native assignments/cut points, eras, outcomes, weights, age bands, suppression, pretrend and limited robustness rules. Its immutable copy is under `accepted/`; the hard-coded SHA-256 is:

`f3429802af3354335d5c724fc5497a24dde41ea11ac8178b2ac88c9416148b5e`

The loader rejects changed bytes, including coherently changed hash markers. Every analytical artifact records this hash. No breakpoints, quantiles or thresholds were moved after examining outcome differences.

Eras: 2015–2019 pre-pandemic; 2020–2021 pandemic disruption; 2022 recovery/transition; 2023–2026 GenAI diffusion context. “GenAI diffusion period” is a calendar label, not a treatment assignment.

The complete-year primary comparison uses the latest available 12-month year, **2024**, versus 2022. October 2025 was not collected; BLS's published 11-month average has comparability limitations. This implementation does not insert an October value or put 2025/2026 partial-year values into full-year indexes. Separate comparisons use the same observed months in 2022 and the selected incomplete year: all months except October for 2025, January–August for 2026. No annual extrapolation. November 2025 weighting/collection changes and revised 2026 population controls remain limitations.

## Conservative occupation sample and concordance

CPS occupation fields are Census codes, not SOC. Before 2020 they use Census 2010; from 2020 Census 2018. The official workbook contains 540 old codes and 570 new codes. Temporal relations retain all four multiplicities and original expressions/notes. Publisher code-change notes resolve explicit merges; blank cells are not blindly forward-filled. There are 657 unique temporal edges: 398 one-to-one, 124 one-to-many, 64 many-to-one and 71 many-to-many. Counts describe edges, not workers.

Primary eligibility requires an official Census temporal bijection, identical exact detailed SOC identity across both taxonomies, an exact current Census→SOC relation and valid source-native exposure. Composite/wildcard/broad expressions remain unmapped for the primary analysis; source rows remain inspectable. This produces 303 structurally stable detailed SOC candidates before exposure and sample restrictions.

Academic analysis additionally requires exactly one official current O*NET child and that child's native human Beta value. It never averages O*NET children. Microsoft analysis uses only exact detailed SOC values. Splits, merges, hybrids and changed SOC identities are excluded from the primary panel. An expanded sample is **deferred**, with no invented allocations.

The employment panel is balanced over complete 2015–2024 years using the predeclared minimum sample rules. Occupations failing these criteria remain in the annual source output/exclusion table. Balanced-panel selection can bias coverage toward larger/stabler occupations; these samples are not nationally representative samples of occupations. Group membership is fixed over time. Native Phase 2 quantiles are not recomputed from outcomes, employment weights or the selected sample.

## Weights, units and outcomes

* Civilian noninstitutional employed age 16+, `PRPERTYP=2`, `PEMLR=1/2`; composited person weight `PWCMPWGT / 10,000`. Employment is the average of monthly weighted counts, not the sum of person-months. All class-of-worker types are retained in this population.
* Unweighted counts are **person-month observations**, not independent unique workers. The CPS rotating panel produces repeated workers; household/person/month keys detect duplicates within a month, without misclassifying legitimate repeated participation as duplicates across months.
* Usual weekly hours at the primary job use `PEHRUSL1`, with varies/NIU excluded and eligible-weight coverage shown. Actual hours and usual total-job hours are not substituted.
* Nominal usual weekly earnings use outgoing rotations 4/8, wage/salary classes 1–5, earnings eligibility, positive earnings and `PWORWGT / 10,000`. Native `PRERNWA`/`PTERNWA` has two implied decimals. Weighted median is the lowest observed earnings value reaching 50% of valid earnings weight. It is neither an OEWS hourly wage nor real earnings. No inflation deflator or fabricated real-wage path.
* Public-use earnings rounding/topcoding changed in 2023–2024. Medians remain inspectable, but across-break changes carry **LIMITED COMPARABILITY** and are not presented as clean wage effects. Hours and earnings populations differ from all-employed employment.
* Age groups are 20–24, 25–34, 35–54 and 55+. The employment denominator also includes ages 16–19, so the four displayed shares need not sum to one. Age is not seniority. These are group composition/young-worker observations, not verified entry-level hiring or career-ladder compression.
* Education and native industry shares are descriptors. Different industry taxonomy vintages are not compared as if identical; no remote-work/offshoring controls are invented. There is no regression-adjusted or causal claim.

Minimum person-month counts: occupation employment 120, represented in at least six months; occupation hours 100; occupation earnings 60. Group employment 500, hours/earnings 200, age cell 60. Full annual estimates require 12 observed months; incomplete-year estimates require at least six eligible months and separate labeling. Suppression is null with a reason, never zero filling.

Design-based standard errors were not estimated: public Basic Monthly files used here do not supply the necessary design/replicate implementation, and repeated person-months invalidate naive IID intervals. Point estimates are not exact; no p-values, probability scores or statistical-significance claims. Sample thresholds are conservative engineering safeguards, not precision guarantees.

## Comparisons and coverage

All five source-specific groups are reported. Full-year employment indexes use 2019=100 and 2022=100; an index is not a growth rate. Pandemic observations remain visible. Pretrend is OLS of log group employment on 2015–2019 year, reported as `100 × (exp(slope) − 1)`. Post-period deviation subtracts that fitted log trend's continuation; it is descriptive, not a counterfactual causal effect.

Presentation thresholds, fixed in advance: 5 percentage points cumulative Q5–Q1 employment or wage divergence; one hour for hours divergence; 0.5 pp/year for a pretrend gap; 5 pp difference between source-specific employment gaps for the methodology-dependence flag. These do not define significance. Coverage below 50% of all CPS employed weight limits broad descriptions, even if the matched sample itself is internally valid.

Coverage partitions all-employed weight into the included primary sample, taxonomy exclusions, missing/nontransferable exposure and sample exclusions. The exclusion categories are disjoint by construction. Missing employment share means known employed survey weight outside the sample, not unobserved workers set to zero. OEWS and CPS populations differ; their denominators are not interchanged.

## OEWS limitations

BLS describes OEWS as a detailed cross-sectional system with overlapping three-year panels. The 2019–2020 SOC transition, 2021 MB3 change, 2022 wage-processing change and pandemic response distortion constrain annual comparisons. The qualified adapter therefore marks every future OEWS vintage `NOT_COMPARABLE` for naive longitudinal use and retains employment, nominal wage percentiles, source suppression symbols and aggregates. No real OEWS vintage passed network intake in this qualification. That source's failure does not invalidate CPS estimates or create fictional employment weights.

## Results and qualification

The following tables summarize the frozen implementation output. They are descriptive point estimates for conservative subsets, not national AI effects. The qualification document records testing/reconstruction evidence.

### Coverage and all-group results

The strict balanced sample has **167 academic** and **190 Microsoft** detailed SOC occupations; the common intersection has 165. Relative to all 867 canonical detailed SOC occupations, count coverage is **19.26% / 21.91%**. Relative to 2024 all-employed CPS weight, coverage is **37.77% / 47.55%**. These denominators answer different questions. Both fail the predeclared 50% employment coverage condition for broad descriptions.

| 2024 employed-weight partition | Academic | Microsoft |
|---|---:|---:|
| Included primary sample | 37.77% | 47.55% |
| Taxonomy excluded | 49.99% | 49.99% |
| Missing/nontransferable exposure | 11.29% | 1.45% |
| Sample/suppression excluded | 0.95% | 1.01% |

All five groups are retained below. Earnings changes are nominal median **weekly earnings**, subject to the disclosure break; they are not inflation-adjusted wages or clean wage effects. Hours are usual primary-job hours. No difference is a significance test.

| Exposure source | Group | 2015–2019 employment trend, %/year | 2022–2024 employment change, % | Nominal median earnings change, % | Usual hours change |
|---|---|---:|---:|---:|---:|
| Academic | Q1 | 0.73 | -0.77 | 10.12 | -0.48 |
| Academic | Q2 | 1.51 | 0.39 | 6.08 | -0.20 |
| Academic | Q3 | -0.72 | 3.12 | 8.75 | -0.57 |
| Academic | Q4 | 1.58 | 1.96 | 8.41 | -0.36 |
| Academic | Q5 | 0.93 | -0.36 | 11.90 | -0.45 |
| Microsoft | Q1 | 1.65 | 0.30 | 7.14 | -0.45 |
| Microsoft | Q2 | 1.11 | 5.41 | 11.40 | -0.39 |
| Microsoft | Q3 | 1.76 | 1.71 | 10.82 | -0.36 |
| Microsoft | Q4 | 0.62 | 2.47 | 12.20 | -0.47 |
| Microsoft | Q5 | 0.47 | 0.87 | 7.98 | -0.51 |

Academic Q5–Q1 pretrend gap is **+0.20 pp/year**, below the predeclared highlight threshold. Microsoft is **-1.18 pp/year**, so a strong pre-existing difference is flagged. Complete-year post-2022 employment gaps are **+0.42 pp / +0.56 pp**, below the 5 pp presentation threshold. “No clear divergence” means no highlighted point-estimate gap under that rule; it does not prove equality or absence of an AI effect.

| January–August 2026 vs January–August 2022 employment change, % | Q1 | Q2 | Q3 | Q4 | Q5 |
|---|---:|---:|---:|---:|---:|
| Academic | 1.46 | 3.15 | 6.29 | 3.63 | 2.54 |
| Microsoft | 0.02 | 4.47 | 4.76 | 7.83 | -0.24 |

These partial-year estimates are separate from full annual paths. The 2025 matched eleven-month comparison is retained in the outputs, with October absent in both years. Population controls and missing-month limitations prevent a clean causal interpretation.

Between 2022 and 2024, ages 20–24's employment share within Q1/Q5 changed by **-0.36/+0.18 pp** under academic exposure and **-1.09/+0.18 pp** under Microsoft applicability. These are composition changes, not direct young-worker hiring, junior-job elimination or a measured career-ladder effect. Other age cells and their sample counts remain in `young-worker-by-exposure.json`.


### Levels, disruption and sample sizes

Employment levels below are average monthly **weighted persons**, in millions. Sample sizes are unweighted employed **person-months**, with repeat respondents possible. Pandemic changes are descriptive disruptions, not AI evidence. All group estimates carry DESIGN_SE_UNAVAILABLE and ROTATING_PANEL_PERSON_MONTHS.

| Source | Group | 2019–2020 employment change, % | 2020–2021 change, % | 2022 employment, millions | 2024 employed person-months | 2024 earnings person-months |
|---|---|---:|---:|---:|---:|---:|
| Academic | Q1 | -16.01 | 8.29 | 7.73 | 26,314 | 5,709 |
| Academic | Q2 | -8.85 | 8.50 | 12.58 | 43,025 | 9,599 |
| Academic | Q3 | -8.14 | -1.48 | 10.74 | 40,762 | 8,200 |
| Academic | Q4 | -4.38 | 0.84 | 17.94 | 66,155 | 13,620 |
| Academic | Q5 | -6.34 | -0.06 | 11.32 | 38,618 | 9,115 |
| Microsoft | Q1 | -11.46 | 7.32 | 11.94 | 40,569 | 9,021 |
| Microsoft | Q2 | -4.32 | 0.84 | 9.48 | 36,701 | 6,983 |
| Microsoft | Q3 | -3.77 | 2.17 | 24.57 | 88,610 | 18,957 |
| Microsoft | Q4 | -4.82 | 0.45 | 14.67 | 53,774 | 12,201 |
| Microsoft | Q5 | -9.79 | 2.04 | 14.61 | 50,521 | 11,584 |

### Robustness and interpretation

The complete-year source-specific Q5–Q1 employment gaps differ by **0.15 pp**; on the 165-occupation common intersection, by **0.22 pp**. This is below the frozen 5 pp methodology-dependence highlight threshold. No exposure scores or outcomes are averaged across sources. Similar gaps do not establish causality; native groups, constructs and included samples still differ. Microsoft’s pretrend qualification is materially different from the academic result.

Both 2019 and 2022 normalized employment paths are retained; full group histories include 2020–2021 and the 2022 levels. Pandemic records are not deleted or treated as AI evidence. The strict-sample/common-intersection comparison is supported; expanded mapping and employment-weighted reclassification are not introduced. There is no uncontrolled specification search or selection of outcome extremes.

Anthropic’s accepted Phase 2 task-link counts, platform sample and interaction-mode context appear separately in `cross-source-robustness.json`. They never determine group membership or explain labor outcomes. Phase 1’s aggregate summary is referenced by content hash only; JOLTS does not become occupational hiring.

Descriptive classifications are **NO CLEAR EXPOSURE-GROUP DIVERGENCE**, **DIVERGENCE EXISTS BUT PREDATES GENAI** (Microsoft pretrends), and **DATA COVERAGE INSUFFICIENT**. Causality remains **NOT ESTABLISHED**. No AI-caused job-loss category exists.

## Reproducibility, failure isolation and remaining gaps

Read [the execution guide](../research/ai-labor-transition/outcomes/README.md) and [qualification record](../research/ai-labor-transition/outcomes/qualification.md). Eight deterministic analytical views bind the immutable specification, source manifest, monthly snapshot identities and Phase 2 input hashes. Full validation rebuilds the analytical views; optional raw validation independently reparses all accepted CPS ZIPs. Operational fetch/evaluation clocks are separated from economic payload identity.

Each CPS month retains a last-valid accepted sufficient-statistic vintage. A changed source checksum requires review; it cannot silently replace a pinned month. Academic, Microsoft, Anthropic and OEWS status are independent. A failed context source does not relabel another source's outcomes. Invalid specification or required concordance fails closed. This is a single-writer offline research tool, not a scheduler or production refresh.

Data health supports CURRENT, STALE, PARTIAL, FAILED, UNAVAILABLE, VERSION_MISMATCH, INSUFFICIENT_SAMPLE, NOT_COMPARABLE and LICENSE_RESTRICTED. Current CPS/concordance/exposure context is PARTIAL, OEWS UNAVAILABLE. Each of the 139 accepted CPS month intakes succeeded; aggregate PARTIAL reflects analytical coverage/period limitations rather than a failed download. Fresh retrieval does not make fixed exposure constructs current capabilities.

Remaining research limitations: real OEWS access; official-design uncertainty; conservative sample coverage and balanced-panel selection; taxonomy exclusions; earnings disclosure comparability; absence of occupational hiring/credible last-job unemployment; incomplete 2025/2026 years and population-control changes; native industry descriptors without a stable industry bridge; remote-work/offshoring/cyclicality confounders; exposure not being random assignment; endogenous platform usage.

**Phase 4 is not ready.** Continue observation, improve occupation mapping with separately justified nonduplicative aggregation, qualify OEWS cross-sections, add official-design uncertainty, and develop explicit confounder treatment before a separately reviewed causal/scenario design. Do not couple these descriptive outcomes to Signal Engine, fiscal projections, investment returns or public UI.

**Final decision: MORE OBSERVED DATA REQUIRED.** The implemented research layer is available for review of its limited descriptive evidence; broader labor-transition conclusions require the additional work above.
