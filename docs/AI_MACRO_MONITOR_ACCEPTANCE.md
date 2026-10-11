# AI Macro Monitor — Phase D1 acceptance and handoff

Result: **COMPLETE — PREVIEW VALIDATED**. This is an isolated feature preview, not a production release or merge authorization. Stop after D1.

## Baselines and scope

- Verified production base and remote main: `4a10e16f2d956fc25262c55da16a10c8d36fedab` (rechecked before submission).
- Feature branch: `codex/ai-macro-monitor-phase-d1`, created from that main commit in an isolated worktree. No C2/D0 branch merge or research history import.
- C2 reference: `362929adfae20b31d8044e5c9a10ae020f0c9eaf`.
- D0 reference: `6edc2357b56bfaf1f8af0f597cfcdd8a5ae1b2a3`.
- Route: `#/research/ai-macro`, lazy React page with existing ResearchLoadBoundary, hash router, research context/navigation, PageIntro and chartPath primitive.
- Existing version remains 1.4.1. Lockfile, dependencies, old production snapshots, AI Infrastructure/CapEx/Labor/Signal logic, deployment, quarterly refresh and notifications unchanged. The six modified integration anchors are package.json, App.jsx, routing.js, architecture.js, researchArchitecture.js and researchLinks.js. New assets/scripts/copy/styles/docs are confined to the macro namespace.

## Fixed snapshot and scientific boundaries

Exactly twelve indicators, thirty-six native series, 12,949 records, 360 null levels; no substitution with existing production series. All observation dates, locators, source hashes, native calculated changes, comparison periods, revision flags and units match the pinned C2 output. No frontend economic arithmetic, resampling, annualization, interpolation, aggregation, correlation, causal estimate, AI attribution, score or forecast.

- Research as-of: 2026-10-09. EIA commercial and gas captured history ends in December 2025; later source availability recorded at review is separately labeled. No live-source check is implied.
- CPI is seasonally adjusted headline CPI, not the existing NSA series. October 2025 stays missing.
- DFII10 changes use percentage points and prior nonmissing published quote/calendar interval; no YoY option. SPF10 is a survey median ten-year expectation, not market inflation compensation or realized inflation.
- Corporate securities are an end-period stock, not gross issuance/net borrowing. Nominal construction SAAR excludes servers/racks/land. No GDP indicator is added.
- Monthly/quarterly comparisons are copied, not annualized in UI. Current-vintage history is unsuitable as a real-time information-set backtest. Original release dates are unknown, explicitly displayed as not recorded.
- E1 observations, E2 within-series arithmetic and E0 mechanisms are visibly separated. Passing software tests does not validate AI macroeconomic causality.

Projection SHA-256: `f1150945a0f32672c60ff594de2c079c7b8318554dc919bf5061771855bf8256` (canonical payload without its own projectionHash field, newline-terminated).

History SHA-256: `5c8381bb1729570146b7ddcaf371251f9d1fa678daa1751cfd2c86222d371590` (exact downloaded bytes).

C2 input file SHA-256: `ac85a5fe4455112f95f83ae2a650a637578480cf8ec1feba8cd52db15b642ec7`.

Input identity: `480e10d32d5d8317589aa279edafe4137b4d1bb8e384093ed0a1a896dcb5018d`.

## Reproduction and validation

Run ordinary validation:

```sh
npm run build
npm run verify
```

Projection regeneration requires the independently verified C2 checkout; the production checkout does not include the research engine or raw cache:

```sh
node scripts/ai-macro-projection.mjs --input /absolute/path/to/verified-c2/outputs/analysis.json
```

The input hash/schema/IDs/vintage/source-rights gate runs before writes. The immutable history object is checked if it already exists; validated new bytes are staged and the summary pointer is atomically replaced. Invalid input leaves both existing assets intact. The script accepts no arbitrary output path, fetches nothing, and copies C2 arithmetic. Generation in fresh processes reproduced identical summary/history bytes. All copied fields/records were independently compared with the original C2 input. Restricted and unresolved rights mutations both rejected the real input.

Automated outcomes:

- Phase A 13, B1 43, B2 51, C0 38, C1A 55, C1-M 51, C2 51: **302 passed / 0 failed**, in their verified clean research checkouts. These tests do not require importing research history into D1.
- D0: **23 passed / 0 failed**.
- D1: **30 passed / 0 failed**, plus real EN/ZH server rendering, empty/invalid snapshot/chart checks and lazy bundle verification.
- Full production verification passed, including all routes in EN/ZH and existing research contracts. Build passed. Known inherited large-chunk warnings and dependency advisories remain outside scope.
- Complete diff/snapshot/dependency scope checks passed. No prior research artifact edits, runtime economic API, browser secret, dependency addition, schedule or email change.

## Actual browser acceptance

See `docs/ai-macro/browser-acceptance.json` and `d1-validation.json` for measured outcomes. Installed Chrome, headless, local loopback production build; cold context per combination. These are local measurements, not internet performance guarantees.

All eight combinations (390px/1280px × EN/ZH × light/dark) exercised every indicator, all four charts, native units, state selection, precomputed-change views, revision/source/date text, provenance expansion, missing October 2025 CPI and daily full-history rendering. No horizontal overflow, page errors or economic-source requests. Initial history requests: zero; after four panels use history: one shared static fetch.

Keyboard focus/Tab progression and Enter table pagination worked. Native selectors have bilingual accessible names; their OS popup arrow behavior was not automated reliably in headless macOS Chrome and is not claimed as manually verified. SVG title/description, table captions/headers and pagination provide alternatives. This is preview acceptance, not a WCAG certification or assistive-technology audit. D2 should include owner/native-popup and screen-reader review.

Two real intercepted failures (503 and changed bytes) preserved all four summaries, rejected history and retried only after operator action. Seven existing routes (home, Infrastructure, CapEx, Labor, Signal, workspace, drivers) remained functional. Actual mobile Chinese/dark and desktop English/light history screenshots were visually inspected, in addition to overview inspection. Screenshot artifacts remain outside Git.

## Performance and failure isolation

- Summary: 94,416 bytes, within 150KB budget; lazy route JS approximately 127KB raw / 21KB gzip.
- History: 4,500,722 bytes raw / 318,565 bytes locally gzip-compressed, within 5MB budget. CDN transfer compression is not assumed.
- Existing main JS delta: +593 raw bytes / +153 locally gzip-compressed bytes, relative to the same main baseline build. No history in the initial bundle.
- At most four SVG charts, twenty-four initial table rows per panel, one cached history object per content hash. No 12,949-node interactive chart.
- Cryptographic summary validation precedes numerical rendering. Wrong snapshot produces a labeled fallback, leaving other routes usable. History hash/size/schema/MIME errors cannot replace valid summary values. Rejected cache promises are evicted; successful history is reused.

## Source rights

All eleven source bundles are classified ALLOWED **for attributed, noncommercial, informational research display of selected numeric facts and WIL arithmetic**. This is a scoped assessment, not unrestricted permission to reproduce source workbooks/publications or use trademarks. See `docs/ai-macro/source-rights.json` and `redistribution-assessment.md`. Source and FRED attribution are displayed. No raw spreadsheets, reports, provider charts, logos, private records or third-party narrative are bundled. Different use, source terms or future vintage requires renewed review. No public release has occurred in D1.

## D2 preparation and rollback

D2 should re-fetch main, review this feature's limited diff and frozen hashes, recheck rights for intended public use, inspect native selector/screen-reader behavior, run release regressions and obtain explicit owner merge/deployment approval. Do not add live data, scheduling, causal analysis or a generalized international framework as release preparation.

Before release, abandoning the feature branch leaves production unchanged. After a separately approved release, revert only this feature's commit/route/assets; preserve intervening bot data updates. No database migration, destructive reset, force push or source replacement is required. Keep last-valid assets and labels on any future refresh failure.
