# Phase D1 — implementation-ready plan, not authorization

## Start and scope

Re-fetch current production main and create a new feature branch from that exact commit. D0 inspected `4a10e16f2d956fc25262c55da16a10c8d36fedab`; recheck listed file interfaces and bot snapshots before implementation. Never merge/cherry-pick full C2/D0 history. Owner authorization is needed to start D1 and separately to merge/deploy. Do not treat this plan as approval.

Build a small **read-only fixed-vintage preview research page**, with exactly the twelve verified IDs and 36 native series. No database, API, scheduler, new dependencies, live economic source retrieval, email change or whole-site redesign.

## Exact proposed file inventory

New production files (D1 only):

- `src/pages/AiMacro.jsx`: lazy four-channel page, selectors, local history state and tables.
- `src/components/AiMacroChart.jsx`: presentational responsive SVG using chartPath; no statistical calculations.
- `src/data/ai-macro/summary.json`: reviewed frozen projection generated from C2, not hand-entered values.
- `src/data/ai-macro/contract.js`: strict public schema/identity/selection validation and display field adapter.
- `src/data/ai-macro/history.js`: one same-origin content-addressed static asset loader, module cache keyed by hash, explicit retry and hash checks.
- `public/data/ai-macro/<history-sha256>/history.json`: single approved history asset, no raw source archive.
- `src/i18n/aiMacro.js`: complete EN/ZH copy, labels and deterministic explanation templates.
- `src/ai-macro.css`: narrow page styles; reuse existing theme/page/table patterns.
- `scripts/ai-macro-projection.mjs`: offline allowlist projection from reviewed C2 artifacts and rights sidecar; copying, not recalculation.
- `scripts/verify-ai-macro.mjs` and `scripts/tests/ai-macro-public.test.mjs`: public contract/scope/hash tests.
- `docs/AI_MACRO_MONITOR_ACCEPTANCE.md`: observed SHA, artifact identity, rights review, acceptance results and handoff.

Minimal production modifications (D1 only):

| File | Exact interface and reason |
|---|---|
| src/utils/routing.js | referenceRoutes includes research/ai-macro; preserve primaryRoutes/routeSection/routeFromHash |
| src/App.jsx | Lazy AiMacro and one route rendering branch within existing Suspense/ResearchLoadBoundary |
| src/i18n/architecture.js | iaCopy EN/ZH nav label for title/navigation and sectionLinks.research entry |
| src/data/researchArchitecture.js | One capacity-theme route and pageResearchContext entry |
| src/data/researchLinks.js | Correct EIA's current not-integrated source note in both languages, only if source admitted |
| package.json | Add new verification command to existing verify chain; **no dependency/version changes** |

No need to edit SectionLanding, vite.config, source catalog/seriesRegistry, live productivity/monitor data, existing charts/calculations, deployment/CapEx workflows or notifications. Exact file names above are proposals; inspected existing integration anchors are in production-compatibility-matrix.json. If refreshed main changes an interface, reassess before edit rather than assuming it still matches.

## Sequence and gates

1. Verify then-current main and preserve user work. Recheck routing/nav/theme, source rights and complete C2 hashes. Review all 11 source records individually; authenticated data are not automatically publication-permitted. Unresolved redistribution review blocks public release of that source. Keep its numeric payload out of candidate public assets; do not silently replace it with a new series. The intended full twelve-indicator release requires all displayed sources to pass. A reduced public release would need an explicitly reviewed coverage contract and separate approval; it is not implicitly accepted by this plan.
2. Build a versioned, offline allowlist projection. Summary contains native metadata, available calculations, all clocks and source/rights attribution. History copies all 12,949 records and 360 null levels. Keep internal trace in research; expose safe locator/source provenance. Stable canonical bytes/hash, fixed as-of and deterministic copy version. No current clock in economic identity.
3. Validate projection/hash/source references and retained exact values against C2. File writes must be restricted to proposed macro asset paths; use staging/temp validation then atomic approved replacement, preserve last-valid on failure. Do not call strict C2 CLI from production.
4. Implement display contract, history hash/shape loader, chart and table in isolation. Only Date/number formatting and view filtering; use precomputed C2 changes.
5. Register one lazy route and bilingual research links/context. Preserve all existing navigation and page behavior.
6. Run new offline public tests, relevant existing verification, build and browser acceptance. Check source/license restrictions and manual release approval before public redistribution.
7. Prepare a small production PR only when separately authorized. Review complete diff; owner controls merge/release. No automatic candidate promotion. D1 first preview does not turn on refresh scheduling.

## Acceptance tests

- Exact 12-ID set and 36 series match; no GDP/breakeven or aggregate AI indicator.
- Every value/change/reason/date/flag matches reviewed C2; sourceHash and locators resolve, original producer/distributor retained.
- Null final records, Oct 2025 CPI gap, early SPF/debt gaps, negative yields, daily unavailable YoY, previous-published-day interval, quarter versus month and preliminary flags have focused fixtures.
- No annualization, browser growth recomputation, resampling, national sample sum, causal effect, risk score or forecast.
- Unknown publication dates remain unknown; 2025 energy/gas dates not labeled current October2026; no inferred source latest.
- Wrong schema/hash/URL/source/vintage fails closed, preserves summary, offers manual retry; no external source fetching/PAT/LLM.
- Projection deterministic fresh-process bytes; history hash validates exact downloaded bytes. Trace remains auditable through fixed research permalink and public source refs.
- Rights sidecar approved and attribution present for each displayed source; no raw cache/local paths/internal research root leakage.
- Route whitelist and titles EN/ZH; unknown route remains safe; existing AI Infrastructure/CapEx/Labor/Signal pages unchanged.
- 390px/1280px, EN/ZH, light/dark: no overflow, visible source dates and gaps, keyboard/semantic table, readable negative-yield chart. Test fetch failure independently from lazy module failure.
- Performance: summary <=150KB raw, history <=5MB raw, max4 mounted charts, paginated initial24 rows; record actual first-page/history timing and bundle deltas on a stated browser/device. Budgets alone do not prove performance.
- npm run build/full verify pass, only approved production integration files changed; bot economic snapshots, lockfile and workflow bytes untouched.

## Complexity and rollback

Moderate, bounded frontend work: one page, one chart renderer, two static data artifacts and a small offline projection/contract/test set. No backend or infra work. A precise duration cannot be supported before D1 UI/projection implementation; biggest review gates are rights and semantics, not algorithm development.

Before owner-approved release, removal of feature branch is sufficient. After an authorized merge, revert only the feature commit(s)/registered macro links and assets, retaining unrelated bot refresh data. Existing routes remain intact; no database migration or source rollback is needed. A new-vintage failure keeps prior validated assets and dates. Never force-push main or restore entire repository snapshots. Stop after D0; do not execute this plan now.
