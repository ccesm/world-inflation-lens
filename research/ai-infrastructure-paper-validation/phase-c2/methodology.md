# Phase C2 methodology

## Selection and data versions

The sole baseline is C1-M commit `eb2da0e23ab9840e385a09b3889baa4454fddd74`. `input-manifest.json` fixes the twelve `c2Core=true` records, their original producers and exact metadata, eleven distinct sources, compressed raw fixtures, inherited EIA extracts, source manifests, retrieval receipts and source-review identity. No GDP, core CPI, headline PCE, breakeven or BTOS series is executed. No new national electricity source or project source is acquired.

Each fixture is decompressed and checked against its qualified original SHA-256 and size. EIA normalized extracts are independently hash-bound, retain original workbook/HTML identity and native cell locators, and are compared with original source bytes in `control_audit.py`. The full electricity workbook remains in the external archive; it is not copied into Git. Source metadata qualification from C1-M is retained; parsing agreement does not independently prove all historical definitions or economic truth.

The engine uses a separate XLSX reader and CSV parsing path from C1-M. Audit controls compare every frozen numeric/absent cell and locator for the nine fixture-backed indicators; Henry Hub is separately re-read from raw HTML; the two state electricity metrics are checked against 3,432 original native cells, including state, date and final/preliminary flags. Manual original-provider metadata verification remains explicitly inherited. No official status becomes a causal grade.

## Units, geography and frequency

The two EIA indicators remain separate state × commercial-sector sequences for IL, KS, KY, MI, MO, NE, NM, OH, OK, PA, UT, VA and WI. They are not a US total, representative regional sample or identified AI shock. No unweighted average, pooled sum or AI allocation is produced. Revenue/kWh realized prices are not customer tariffs, marginal electricity cost or CPI electricity.

Henry Hub is a monthly gas benchmark, not delivered local utility fuel cost. Census construction is nominal million USD at a seasonally adjusted annual rate; do not interpret the pace as annual spending, total campus investment or AI-only CapEx. PNFIC1 is real chained-dollar investment at SAAR; components cannot be summed into an AI total. Corporate securities are a nominal quarter-end stock, not all debt or an issuance flow. Productivity and unit labor costs retain native index definitions. CPI and core PCE have different baskets and index bases. SPF10 is a median ten-year annual-average CPI survey expectation, not a realized quarterly inflation rate or market inflation compensation.

All native periods are retained. Monthly/quarterly labels use source period-start dates; `periodEnd` makes associated period boundaries explicit (the end-of-quarter stock relates to that quarter end). SPF `periodEnd` labels the survey reference quarter, not the end of its ten-year forecast horizon. Daily dates are actual quoted observation dates. No resampling or seasonal adjustment is calculated. Source adjustment labels remain unchanged.

## Descriptive calculations

For positive-base non-rate levels:

`nativeChange = 100 × (value_t / value_exact_previous_native_period − 1)`

`yearChange = 100 × (value_t / value_same_period_previous_year − 1)`

Monthly prior periods are exactly one/twelve calendar months back. Quarterly prior periods are exactly three/twelve months back. Lookup uses dates, never the previous row offset across a gap. Index growth is calculated from indices; indices themselves are not inflation rates. Stock percentage changes remain stock growth, not net borrowing. Quarterly changes are not annualized. SAAR levels are not divided, summed, deflated or converted to actual annual expenditure.

For DFII10 and SPF10, changes are differences in **percentage points**, never percentage growth of a yield or expectation. SPF uses exact previous survey quarter and same quarter of the preceding year. DFII10 uses the previous nonmissing published day, discloses its `nativeBasePeriod` and `nativeIntervalDays`, and leaves daily YoY undefined. This is a variable-interval quoted yield change, not a constant one-day return. A missing daily record stays null; selecting a prior observed quote as a comparison does not fill it. Missing calendar days such as weekends are not synthesized.

Arithmetic uses decimal values reconstructed from native numeric strings and half-even rounding to six decimal places. Native values are not rounded by this phase. Null endpoints yield `MISSING_ENDPOINT`; absent exact comparison dates yield `COMPARISON_PERIOD_ABSENT`; nonpositive percentage bases yield `NONPOSITIVE_BASE`. These statuses are carried into JSON/CSV, not replaced with zero. Daily YoY carries `NOT_DEFINED_FOR_DAILY_YIELD`.

## Historical context, missingness and freshness

Each series retains its complete captured history, including early nulls. The common-window metadata selects 2015 onward without dropping missing cells; it is not a balanced panel. Earlier records remain available for exact YoY lookup and audit. The oldest captured dates do not certify stable definitions across every historical era. No long-run causal inference uses the entire archive.

October 2025 CPI is null; the next month's native change is consequently unavailable. Early securities and survey quarters remain null. Daily yield missing rows remain null. Final versus preliminary EIA flags and Census p/r flags remain native; absent per-observation revision flags are explicitly `NOT_DISCLOSED_PER_OBSERVATION`, not assumed final. All 2025 captured EIA monthly rows retain `Preliminary`.

`lastRecord` includes the actual final source row even when missing. `lastNonmissing` is separately identified and must not be used to imply a fresh observation. EIA/Henry Hub captures stop in December 2025 even though C1-M verified later source catalog/table periods: `CAPTURE_BEHIND_KNOWN_AVAILABLE`. Other series match only the latest known **C1-M review**, not a new live freshness check. C2 does not pretend to have tested current endpoint access.

## Clocks and identity

Source review as-of is explicitly **2026-10-09**. Historical economic periods, immutable source retrieval dates and metadata qualification dates are separate. Unknown first-publication dates remain null; there is no fixed-lag guess or first-release vintage archive. Thus earlier as-of reconstruction is prohibited; later dates require a separately qualified input set. Operational validation execution on 2026-10-10 is recorded only in the validation report, not inferred from system time or used in economic calculations.

Input identity binds selected immutable input bytes, exact definitions, selection rules and implementation hash. Source retrieval metadata is the frozen input's documented vintage, not the rebuild's runtime clock. Outputs exclude runtime clock, working directory, temporary path and machine metadata. Three canonical products are hashed; `outputSetHash` hashes the ordered file-hash/size map and avoids a self-referential hash. Output identity does not include its own bytes. Validation receipts, audit execution and editorial handoff documents do not alter economic output identity.

## Evidence and safeguards

E1: authenticated producer observations, units and definitions. E2: scoped reproducible within-series arithmetic only. This E2 label is not evidence of an empirical cross-variable relationship. Statistical correlations are **NOT ESTIMATED**: no lag mining, regression or coefficient is fitted. The four conditional transmission channels remain E0. No automatic E3/E4 upgrade, AI causality, numerical inflation forecast, ROI, composite score, leverage score or systemic-risk conclusion is generated.

Unchanged Phase A/B1/B2 corporate conclusions and the 28 preserved C0/C1A gaps continue to constrain their corresponding claims. Current-vintage histories do not cure those gaps. Tests validate computations and safety, not economic hypotheses.

Immutable manifest, baseline or input-byte mismatch is a run-level stop: an altered qualified baseline must not be used silently. Within a verified input set, an individual parser/definition/numeric failure produces `REVIEW_REQUIRED` for that indicator while the other indicators can be inspected in memory. Indicator assembly is atomic across geographies. A partial run is prohibited from replacing frozen last-valid output files. The write command is restricted to this phase's research `outputs/` directory. No network fetching, accepted-data write, browser API, production change, scheduled task, email, merge or deployment exists.
