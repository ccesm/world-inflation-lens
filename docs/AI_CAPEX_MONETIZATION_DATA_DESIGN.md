# AI CapEx monetization data design

Phase 1 research-only contract, `ai-capex-foundation-v0.1`, reviewed 2026-10-06. This document designs a future quarterly pipeline and supplies a small offline accounting-contract qualification harness. It does not implement live ingestion or continuous monitoring.

## Boundaries and files

`research/ai-capex-monetization/` contains a compact manually reviewed official-anchor fixture, draft JSON Schema, standalone Node contract/normalizer and offline tests. No production package scripts, React imports, refresh workflows, Signal artifacts, notifications, public files or application version are changed. Normalizer reads a supplied JSON file and emits stdout only. Generated output is not committed.

Three required reports: [model matrix](AI_CAPEX_MONETIZATION_MODEL_MATRIX.md), this contract, [accounting bridge](AI_CAPEX_ACCOUNTING_BRIDGE.md). No coupling to the existing AI productivity/fiscal/labor calculations; any future bridge needs separately reviewed accounting.

## Future source architecture

1. Discover official filing/release identity per company (MSFT CIK 0000789019, GOOG 0001652044, AMZN 0001018724, META 0001326801).
2. Retrieve using permitted official endpoints with a compliant user agent and bounded attempts. Cache by verified accession plus byte hash. A 403 ends that endpoint's attempt; record access failure rather than changing economic values.
3. Preserve complete raw documents outside normal Git history with SHA-256, accession, declared MIME and retrieval receipts. Official SEC iXBRL/filing facts preferred to fragile presentation HTML. Company Facts alone cannot resolve every lease convention, segment perimeter, management run-rate or policy event.
4. Extract company-native observations into a candidate vintage; identify contexts, units, duration versus instant, tags and amendments. Cross-check key figures against the filing's table.
5. Validate schema, identity, arithmetic, chronology, scope and missingness; review definition breaks. Reject ambiguous contexts instead of choosing the first tag match.
6. Accept independent company vintages; source failure never overwrites last-valid data. Export only a research dataset until separate public qualification.

**Current access status:** SEC Company Facts/MSFT direct request and Amazon/Meta IR direct requests returned 403. No repeated blocked-endpoint retries. Official pages were manually reviewed through research browsing. Microsoft Q4 release downloaded locally; raw HTML SHA-256 `4f56102f4693c6aeaf17576fa590aa4c8c03d957f04667dbb76444e84222108f` identifies only the temporary downloaded bytes, not an archived reproducible raw store. The committed manually reviewed fixtures deliberately have `rawSha256: null`. The temporary download is not required by the offline tests and is not claimed to be durable. Official numeric values can be rechecked via source URLs/table locators; automated retrieval/raw-vintage recovery still needs qualification.

## Normalized record contract

The common record preserves native accounting rather than creating a common AI investment estimate.

| Field | Semantics |
|---|---|
| observationId | Unique source-vintage/metric/scope/horizon/period identity |
| company | MSFT / GOOG / AMZN / META; never coalesced |
| metric, domain | Controlled registry; financials, capex, capexComposition, monetization, cloud, backlogCapacity, depreciation, cashFlow, guidance, investmentContext |
| fiscalQuarter, calendarQuarter | Both labels, derived from actual period end; MSFT June year-end retained |
| periodStart, periodEnd | Exact represented period, not retrieval date |
| periodType, frequency | Q / YTD / FY / TTM / POINT / RUN_RATE / GUIDANCE; corresponding native cadence, never monthly interpolation |
| value, unit | Number or null, USD_MILLIONS / PERCENT / MILLION_SEATS; cash outflow magnitude convention documented |
| nativeLabel, definition, scope | Company-original concept and perimeter (e.g. AWS versus consolidated), not a silently renamed tag |
| accountingBasis | GAAP / NON_GAAP / COMPANY_DEFINED; management operating measures need not be GAAP |
| evidenceClass | OBSERVED / CALCULATED_FROM_DISCLOSED_VALUES / MANAGEMENT_ATTRIBUTION / MODEL_DERIVED / UNAVAILABLE |
| precision | EXACT / ROUNDED / LOWER_BOUND / APPROXIMATE / RANGE_LOWER_BOUND; unavailable null has reason |
| sourceId, locator | Joins accepted publisher/title/URL/source date/retrieval and original table passage |
| revisionStatus | Original source status or REVISION_UNKNOWN; availability of a filing is not evidence its value is final |
| calculation | Formula and exact operand observation IDs for a derived record |
| limitations, unavailableReason | Missing values stay missing; no silent zero / estimates |

Financial series are quarterly natively; YTD/FY/TTM are retained as separate reported durations. Point-in-time capacity/backlog and run-rate have separate period semantics. Event cadence is not artificially monthly. `sourceDatePrecision: DATE` does not establish an exact publisher timestamp. Fixture `retrievedOn` records the local research review day; no invented intra-day retrieval instant. Runtime `evaluatedAt/runAt` belongs in a separate receipt, not economic observation fields.

## Domain schemas and source-specific availability

| Domain | Required native dimensions | Unavailable / incompatible cases |
|---|---|---|
| Company financials | Revenue, cost of revenue, operating income, GAAP and consolidated scope | Company totals are not AI incremental results |
| CapEx | Reported native label; gross/net cash PP&E; proceeds/incentives; additions; finance leases | Do not alias cash, accrued asset additions and principal |
| CapEx composition | Category, share basis, approximation, AI/non-AI perimeter | Microsoft rough two-thirds is not exact AI dollars; no inferred split for others |
| AI monetization | Direct financial measure or product/context measure, evidence ladder 1–5, run-rate/recognized distinction | Missing AI revenue not calculated from cloud, seats or ads |
| Cloud | Segment versus broader cloud scope; revenue/operating or gross margin; reported versus constant-currency growth | Microsoft Cloud ≠ Intelligent Cloud ≠ Azure; AWS ≠ Amazon; Cloud ≠ AI |
| Backlog/capacity | Balance date, product scope, original contract duration inclusion, recognition horizon, constraint narrative | Alphabet Q1 2026 definition break; no gigawatt-to-revenue conversion |
| Depreciation | Pure depreciation versus PP&E D&A versus broad D&A/other; asset class; policy effective date | MS current quarter and Amazon pure depreciation unqualified; rounded Meta amount retained |
| Cash flow | CFO; native company FCF formula; lease cash/principal; annual/TTM versus quarterly | Meta formula differs from Amazon; no second subtraction of operating lease cash |
| Management guidance | Announcement date, target start/end, range, native convention, superseded version | Never entered as observed CapEx; no analyst substitute |
| Provenance | Publisher, official URL, accession if filing, locator, date precision, retrieval, verification type, raw identity when retained | Manual page review has no invented raw hash or real-time vintage claim |

Future rich records should add `attributionStatus`, `monetizationEvidenceLevel`, `policyEventId`, `definitionVersion`, `restatedFrom`, `supersedes`, `rawArtifactId` and `sourceAvailabilityProof`. These are **design extensions**, not fields silently inferred in the current fixture. Definitions must remain immutable/versioned. A qualitative claim can use its own text/context record; do not force it into a numeric observation. Ranges require separate low/high fields and linked source, never a midpoint called observed.

## Revision, selection and failure policy

Exact duplicate filing contexts fail validation. Different filing source IDs can retain values for the same economic period; they are not automatically reconciled into one “latest” series. An explicit reviewed selection manifest is required for a future accepted panel. Retain original and revised hashes with changed values/definitions, comparison reason and acceptance date. A current filing's comparative historical column is a later vintage, not historical publication proof.

Future refresh per company: CURRENT / NO_NEW_FILING / FAILED_WITH_LAST_VALID / UNAVAILABLE. Fetch success alone does not imply new financial observation. Semantic ambiguity or unreconciled cash bridge can reject only the affected metric/company. A previous accepted vintage remains identifiable as last-valid and cannot appear fresh because another company updated.

No interpolation, filling or calendar-quarter invention. Annual/YTD subtraction only with exact compatible periods and vintages. Missing current pure depreciation cannot be replaced by D&A/other. Missing exact AI revenue cannot become zero. Publication date, fiscal observation date, retrieval and evaluation have distinct meanings; future recorded replay requires actual retained availability receipts.

## Determinism and validation scope

Canonical JSON sorts object keys and sources/observations by stable IDs. Identical reviewed input produces identical bytes/hash in fresh processes. No runtime timestamps are generated into normalized content. Full content identity includes provenance; a later retrieval/vintage is a distinct artifact even if economic values are identical. Future economic-content equivalence and raw-artifact identity should have separate hashes. Never erase raw hashes to manufacture identity equivalence.

The standalone semantic contract tests **manually reviewed input shape and accounting relationships**, not truth of future scraped text. It validates fiscal/calendar mapping, real dates, horizons, company/source joins, official source hosts, GAAP labels, metric scopes/units, duplicate identities, null reasons, run-rate/backlog separation and exact derived operands. It does not claim adversarial publisher authenticity verification, general XBRL parsing or automated source qualification. The draft JSON Schema is a design aid; the executed `contract.mjs` adds semantic checks. Future pipeline must validate both structural schema and raw-source-bound truth, including file hash/accession/context.

Safe calculated fixture records: Amazon gross-minus-proceeds net PP&E; Meta cash-plus-principal native CapEx. Derived examples have traceable operands. FCF, ratios and margins are emitted on request only for exact matching quarter/source operands. Rounded data produce unavailable in the exact arithmetic harness; researchers may later add an explicitly rounded descriptive calculation without inventing precision.

## Commands and acceptance

```sh
node --test research/ai-capex-monetization/tests/*.test.mjs
node research/ai-capex-monetization/scripts/normalize.mjs > /tmp/wil-ai-capex-anchors.json
npm run build
npm run verify
```

Offline tests require no network. No live fetch job is installed. Fixture cases use official numerical anchors plus independent mutations of valid records, not live endpoints. Production smoke/browser acceptance is not needed for a research-only change with zero UI imports/routes.

The validation catalogue includes fiscal/calendar quarters, strict dates, native CapEx versus cash, additions versus principal, missing values, duplicate filings, retained revisions, GAAP/non-GAAP, backlog not revenue, run-rate not recognized revenue, investment gains excluded, provenance, unavailable company metrics, exact-period cash bridges and fresh-process byte determinism.

## Next quarterly-pipeline gates

1. Qualify permitted stable access and retained raw documents for all four companies, including recovery.
2. Backfill **2019 onward** with explicit completeness table; do not claim a sparse fixture is that panel.
3. Reconcile MS native CapEx versus cash/lease/accrual convention; do not force the current residual into invented data.
4. Retrieve full annual useful-life and depreciation/lease notes; establish definition/policy-change ledger.
5. Validate company-specific tags, contexts, source perimeters and restated segments across history.
6. Independently check selected quarters, all revisions and missing metrics; freeze accepted selection manifests.
7. Only then qualify incremental quarterly fetch/normalize/validate. Remain research-only; public exposure requires separate approval.

No ROI, payback, cohort simulation, scheduled workflow, UI, email or Signal Engine modification is part of these gates' implementation here.

## Phase 1 qualification result

- 13 pinned official disclosure identities, 73 sparse records (including unavailable records): MSFT 20, GOOG 15, AMZN 18, META 20. This count is not continuous historical coverage.
- Offline suite: **48 passed, 0 failed, 0 skipped**. Native-frequency and Microsoft fiscal-year boundary cases are included. Assertions use independently fixed expected cash-bridge values and mutate otherwise valid records.
- Draft structural schema: strict AJV 8.17.1 / ajv-formats 3.0.1 compilation and fixture validation passed using temporary dependencies outside the repository. No project dependency changed.
- Fresh-process deterministic output: identical bytes. Normalized content hash `efe8963b1ecdabea8617830c1040455c62db05bf04c71d867e3dbdd6052fd3e2`; serialized envelope SHA-256 `604505ac491c433079df75c46739d4f92c68322429564275e9710fcbc0bdd639`.
- Node 24.19.0: `npm run build` passed; existing large-bundle advisory remains. `npm run verify` passed, including production public-summary leakage checks.
- No AI-CapEx research marker found in `dist/`, `src/`, `public/`, production `scripts/` or workflows. Only this research directory and the three new reports are changed. Economic snapshots, public version 1.1.0, Signal Engine and email remain untouched.
- Latest fetched `origin/main` remains the starting base `e790bd03fe8549fc5008ae2fa43237daf826438c`; no reconciliation was required.

Final qualification decision: **MORE ACCOUNTING / SOURCE QUALIFICATION REQUIRED**. This does not negate the verified descriptive anchors or completed accounting foundation; it prevents premature claims of automated quarterly ingestion or attributable AI returns.

## Additive Phase 2A implementation

The research-only [official quarterly panel](AI_CAPEX_QUARTERLY_PANEL.md) implements a separate accepted-input/source-vintage/selection contract with externally retained raw identities. It does not change this Phase 1 fixture, evidence ladder or sparse qualification conclusions. Source/accounting gaps remain explicit and public monitoring is not activated.
