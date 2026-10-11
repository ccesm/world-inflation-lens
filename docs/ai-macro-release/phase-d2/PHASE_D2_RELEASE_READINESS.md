# Phase D2 — Release readiness and handoff

**PARTIAL — RELEASE GAPS.** The current-main-based integration, full local data integrity and tested browser behavior are validated. Required historical-data distribution rights, dependency remediation and actual screen-reader acceptance remain open. This branch must not be merged or deployed as a full AI Macro Monitor release.

## Verified execution and integration

Repository: `ccesm/world-inflation-lens`. Latest remote main was fetched and rechecked as `4a10e16f2d956fc25262c55da16a10c8d36fedab`; it is not assumed from older research. D1 source `1356b9b66e17f6b6e290c11040aaf61e4e1c66ab` exists and its original base is that main. No newer main change or conflict was found. D2 branch `codex/ai-macro-monitor-phase-d2` was created in an isolated worktree from that production SHA. A reviewed D1 file patch was applied selectively, not a merge/cherry-pick of research history. Original shared workspace work was preserved.

The release manifest records the validated implementation commit; its containing audit commit is resolved with `git rev-parse HEAD`. Exact final SHA and push confirmation are supplied at handoff. This avoids a self-referential commit hash in its own contents.

Route `#/research/ai-macro` uses existing lazy React/Vite routing, PageIntro, shell, design tokens, research map/context, bilingual copy and SVG chartPath. The six existing integration anchors are `package.json` (verification only), `src/App.jsx`, `src/utils/routing.js`, `src/i18n/architecture.js`, `src/data/researchArchitecture.js`, `src/data/researchLinks.js`. New files stay in the macro namespace and release documentation. No second framework, charting library, dependency, database, runtime data API or new authentication.

D2's minimal UI changes add clear keyboard outlines, bilingual chart text equivalents outside scaled SVG, readable mobile axis labels, live selected-observation text and a history-ready message. No C2 economic calculation is duplicated or revised. Package version remains 1.4.1; existing economic snapshots, AI CapEx/Infrastructure/Labor/Signal code, source definitions, Pages, notification and scheduled behavior remain unchanged. The main branch and live website are unchanged.

## Complete local snapshot versus distributable candidate

The complete pinned D1 fixture is kept **outside Git**: 12 indicators, 36 series, 12,949 records and 360 explicit null levels. Summary/history bytes reproduce exactly from pinned C2 output using the historical D1 research projection. Original dates, units, adjustment, frequency, period comparison, source institution/hash, retrieval clock and revision flags remain identical. Details are in `data-integrity-results.json`; no withheld numerical history appears there.

- Research snapshot: 2026-10-09; energy captures ending 2025 remain visibly dated, with later source availability separately labeled.
- Projection identity: `f1150945a0f32672c60ff594de2c079c7b8318554dc919bf5061771855bf8256`.
- Exact history hash: `5c8381bb1729570146b7ddcaf371251f9d1fa678daa1751cfd2c86222d371590`.
- Projection identity excludes its own hash field; the exact full summary file hash is separately reported. Do not confuse these hashes.
- Original release dates remain null/unknown; preliminary data are not reclassified final. No historical information-set backtest is implied.
- E1 facts, E2 copied within-series arithmetic and E0 hypotheses remain distinct. No correlation, causal estimate, AI-specific consumption, risk score or forecast is created.

The **pushable candidate contains zero numerical macro observations**: a strict bilingual release-hold stub, with no macro history in public assets or build. It is **BLOCKED_FULL_DATA_PACKAGING**, not a reduced 35-series substitute and not a complete public snapshot. Its UI code was tested separately with a private local full-data overlay. Those local tests do not make the hold candidate a functional public numerical monitor.

## Redistribution assessment

D1's noncommercial local/research assessment is retained as historical evidence, not public-release permission. D2 separately reviews each exact source for public display, downloadable static history and derivative display.

Ten of eleven sources are assessed **ALLOWED — ATTRIBUTION REQUIRED** within this scoped numeric-data use: EIA sales/prices and gas; Census data-center construction; seven individual FRED series whose pages identify Public Domain: Citation Requested. Government data permissions, source-specific status and required original-provider/FRED/date citations are retained. Graphics, logos, third-party protected expression and endorsement are outside this assessment. The basis is documented source policy, not merely API accessibility. See [EIA reuse policy](https://www.eia.gov/about/copyrights_reuse.php), [Census citation/public-use policy](https://www.census.gov/about/policies/citation.html), [FRED terms](https://fred.stlouisfed.org/legal/) and the exact-series policy links in `data-redistribution-review.json`.

**LIC-01 — SPF10 remains UNRESOLVED.** Philadelphia Fed's [online terms](https://www.philadelphiafed.org/about-us/privacy-notice) allow informational/research use but do not establish a dataset-specific grant for the intended static full-history redistribution. The official [inflation-forecast catalog](https://www.philadelphiafed.org/surveys-and-data/real-time-data-research/inflation-forecasts) authenticates the source, not the permission. No illegality finding is asserted; documented permission is insufficient for this stricter release gate. Obtain authoritative dataset-specific evidence or provider permission. No email was sent, no replacement provider invented and no rights waiver presumed.

The public-generation CLI now checks all eleven D2 reviews and exact source hashes before input reads/asset writes. Tests prove that changing the top-level boolean, supplying empty/duplicate coverage or approving only display cannot enable publishing. Default candidate verification always invokes the stricter D2 validator and rejects a restored numerical payload; that bypass attempt was actually tested in the private full-data overlay and failed as expected. Full local integrity remains available with explicit external fixture paths.

## Accessibility, browser and performance

Eight full local data combinations and eight pushable hold combinations passed at 390px/1280px, EN/ZH, light/dark. All 26 preexisting routes passed route/render checks. Numerical source/date/unit tests, missing CPI presentation, controls, overflow, blocked/tampered-history behavior and network isolation passed. Actual native in-app browser keys confirmed Space/Down/Return selection, Tab/Shift+Tab, Escape, Space history loading, Enter table pagination and Return Chinese switching. Browser AX exposed named controls, headings, main/navigation landmarks, chart descriptions and semantic table cells.

**A11Y-01 — actual screen reader: MANUAL ACCEPTANCE PENDING.** Native Chrome computer control was not approved; the in-app browser provided actual keyboard testing, but no VoiceOver/NVDA session was used. Automated AX checks do not replace spoken assistive-technology acceptance or establish complete WCAG conformance. Manual contrast/zoom/assistive-technology checks remain specified in `accessibility-review.md`.

`browser-qa-results.md`, `browser-qa-summary.json` and `performance-results.md` record exact environments and results. Timings are local loopback observations, not universal production targets. One shared history request serves all four charts; unrelated routes load no macro chunk/history. The existing shared-chunk build warning remains documented rather than triggering broad refactoring.

## Security and release gates

**SEC-01 — source-map-js high advisory remains open.** Installed and locked 1.2.1 is affected; patched 1.2.2 is semver compatible with its PostCSS parent. No browser/server ingestion route for untrusted indexed maps was found, but the vulnerable build-tool consumer remains present. This is not dismissed because it is inherited/dev-only. A separate minimal remediation, clean install, audit and regressions is required before full release. No dependency/lockfile upgrade was made in D2. See `release-security-review.md` for the primary advisory and input-boundary analysis.

The only external requests on the hold route were inherited Google Fonts CSS/fonts, not economic data. No secret, unsafe dynamic HTML, new external script, research-only graph/raw archive or unauthorized numerical asset is introduced. Workflow files are identical to main. Existing Pages push trigger only matches main; branch push does not deploy or send email. No workflow, public preview, PR, merge, automation or deployment was initiated.

## Validation and handoff

A 13; B1 43; B2 51; C0 38; C1A 55; C1-M 51; C2 51: **302 passing inherited tests**, in their pinned clean checkouts. D0 **23** and original D1 **30** passed in independent exact-source checkouts. D2 tests validate the public hold and optionally the complete external fixtures; their final count and commands are recorded in the manifest. The full `npm run build` and `npm run verify` passed on this candidate. Full data reproduction is separate from safe-hold/default verification; no suite is silently treated as validating an absent full public payload. Technical validation does not establish AI's causal macroeconomic effect.

The full diff is confined to the six integration anchors, new macro files and release documents/scripts. No research lineage was imported, no inherited A/B/C artifact altered, no dependency or workflow change, and no raw full-history asset is tracked. The complete validated patch is committed/pushed only on the isolated development branch after final scope review.

The smallest next step is to close LIC-01 and SEC-01 and complete A11Y-01, then repackage/retest the actual permitted full snapshot against newly fetched main. D3 remains a plan only in `PHASE_D3_DEPLOYMENT_PLAN.md`. Owner authorization is still required for any future production PR, merge or deployment. This D2 completion is a safe preparation/handoff, **not release clearance**.
