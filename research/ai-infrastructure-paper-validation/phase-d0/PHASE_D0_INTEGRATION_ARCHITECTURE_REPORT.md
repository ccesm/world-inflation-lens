# Phase D0 — integration architecture review

## Decision

Recommend **approved static artifacts**, a dedicated small display adapter and one lazy research page. Preserve the C2 engine outside the production application. No production integration has been implemented. Architecture readiness is distinct from permission to release source data or a public page.

Research baseline: `362929adfae20b31d8044e5c9a10ae020f0c9eaf`, `codex/ai-infra-macro-descriptive-phase-c2`. Current remote main independently fetched and inspected on 2026-10-10: `4a10e16f2d956fc25262c55da16a10c8d36fedab`. Production is **v1.4.1**, not the older v1.3.0 references in prior instructions. D0 branch: `codex/ai-infra-macro-integration-phase-d0`.

## Verified architecture

Production is React 19, Vite 7, native ESM/JSX and custom whitelisted hash routing. There is no React Router, database or application server. Economic data come from committed build snapshots. Separate SystemStatus polling fetches operational status; it is not an economic data API. Local storage holds preferences. Charts use custom SVG; d3-geo serves maps. A second chart framework is unnecessary.

`App.jsx` already lazy-loads research modules under Suspense and ResearchLoadBoundary, preserves route focus and obtains document titles through bilingual nav copy. `src/utils/routing.js` registers routes; `src/i18n/architecture.js` provides sectionLinks and navigation text. The Research section landing directory consumes these links. `src/data/researchArchitecture.js` provides contextual research relationships. `PageIntro` and existing page/theme CSS can be reused.

The global series catalog and contract contain automated maintenance and timestamp assumptions. They should not absorb a fixed C2 snapshot: shared IDs such as PNFIC1/DFII10/ULCNFB may have different source vintages. Current monitor CPIAUCNS is not C2's seasonally adjusted CPIAUCSL. Census's production CENSUS_DATACENTER identifier is not an automatic alias for C2 CENSUS_DC.

## Chart compatibility

TimeSeriesChart uses month-based positioning/pointer indexing and needs empty/all-missing safeguards. ProductivityChart and WorkspaceSeries calculate growth in the browser, and ProductivityChart has annualized quarter transformations. InternationalChart couples monthly date formatting and constrained percent domains to its own dataset. None is a safe universal direct C2 panel.

Reuse the pure `chartPath` drawing helper from `src/utils/workspace.js`, responsive/table patterns and visual styles. A small presentational AiMacroChart should use native calendar positions, finite domains including negative yields, visible gaps and isolated-point markers. The display adapter maps `period` to drawing `date`, never calculates growth. Statistical frequency remains unchanged even when a drawing helper receives a documented monthly/quarterly/daily gap category.

## Engine and data review

C2 engine.py uses only Python standard-library parsing, Decimal arithmetic and hashing. It reads frozen, hashed official inputs through source adapters; produces JSON, CSV and Markdown; and has 51 phase-specific tests plus inherited regressions. It has no runtime API secret or LLM. Native observations are E1; reproducible within-series arithmetic is E2_ARITHMETIC_ONLY; causal mechanisms remain E0. Correlations and E3/E4 evidence are not estimated.

Input formats are seven frozen FRED-distributed CSVs, Census and SPF XLSX workbooks, and inherited EIA JSON extracts for state sales/prices and Henry Hub. Independent controls re-read the external EIA workbook and raw gas HTML; those raw controls are not website dependencies. XLSX parsing uses ZIP/XML from stdlib. CSV dates are native labels, missing cells stay null, and source-version hashes/locators identify the captured content. C2 records revision flags and qualitative revision policy, not a comprehensive first-release revision archive. Decimal calculations round to six places; the display must copy those outputs instead of replacing them with JS floating-point growth.

The C2 CLI restricts as-of to 2026-10-09 and enforces a C1-M baseline lock plus C2-only writes. It will reject execution in a changed production or D0 checkout. This is a valid isolation guard, not a defect to disable. Generate new research snapshots in the controlled research lineage, then review and transfer only public display artifacts. Do not rerun or transplant the raw engine into the website build.

Exactly 12 indicators produce 36 series and 12,949 records, including 360 null levels. Full JSON is 4,594,216 bytes (hypothetical gzip 363,731 bytes). This is manageable as one optional history asset; dozens of history shards, a database and a service API are unjustified. No actual browser/network benchmark has been performed in this documentation phase. Acceptance budgets and D1 measurements are explicit in artifact-measurements.json.

## Production comparison and safety

production-inspection.json records SHA-256 for all 372 inspected production files; baseline-lock.json records all 571 C2 files. Byte comparison finds 199 research-only paths, no production-only paths and 15 changed shared paths, all refreshed economic snapshots. Application code, package/lock, existing workflows and frozen AI pages match. The production reference was initially shallow, then its history was fetched to satisfy existing historical verification fixtures. Full-history comparison found merge base `a7899729f36217cf1d4142f1203e11c32984ad9d`, with two production-only and eight research-only commits. No merge attempt was made or recommended.

Do not merge the research lineage. D1 must start from then-current production main and import only reviewed display assets. Do not roll back newer production snapshots, register C2 as an automated existing series feed, or mix calculation vintages. Current production references must be fetched again before D1.

The existing deploy workflow already refreshes approved datasets, builds, verifies, publishes Pages and conditionally sends notifications. AI CapEx's separate workflow is a pinned, manual company-accounting candidate runner. Neither should change for this initial macro page. No D0 workflow, route, UI, dependency, schedule, notification or data changes are permitted.

## Integration decision and limitations

Option A wins on isolation, cost and reproducibility. Option B introduces Python/raw-cache/scope-lock build dependencies without display benefit. Option C introduces APIs, operational failures and nondeterministic live vintages without a justified use case. See integration-strategy.md for the controlled update and failure design.

Unknown release dates, stale 2025 energy captures, a thirteen-state commercial subset and unidentified AI attribution remain visible. They do not block a correctly labeled descriptive page. Source-specific redistribution review is a **D1 public-release gate**, particularly for distributor terms and SPF. No architecture assumption treats all official sources as unrestricted.

Future country/region/currency and stock/flow/rate semantics need a small series contract, not a generalized multi-country engine. Japan examples are design checks only; no data are collected. D0 validation tests verify contracts and references, not macroeconomic causality. Qualification and handoff details are in validation-results.json and PHASE_D1_IMPLEMENTATION_PLAN.md.

## Public-source terms review

EIA permits redistribution of its data with dated acknowledgment and distinguishes contributed protected material. WIL-authored translations should be attributed to WIL and link back to EIA. [EIA reuse policy](https://www.eia.gov/about/copyrights_reuse.php).

FRED requires original-provider/distributor attribution and observes series-specific restrictions. General terms do not certify each series for this publication. No logos, downloaded FRED charts or broad data mirror are proposed. [FRED terms](https://fred.stlouisfed.org/legal/).

Philadelphia Fed online terms were reviewed, but no dataset-specific unrestricted redistribution conclusion is drawn for SPF. D1 must retain a source-specific review record before release. [Philadelphia Fed terms and privacy](https://www.philadelphiafed.org/about-us/privacy-notice).
