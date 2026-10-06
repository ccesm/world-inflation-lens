# Phase 3 qualification record

Research-only qualification on October 5, 2026 America/Los_Angeles (UTC run records extend into October 6). Base `e09b7c973fae4b219aea1132206f5f06995d3717`; branch `codex/observed-labor-outcomes-by-ai-exposure`. No merge or production integration.

## Frozen protocol and live intake

The preanalysis specification was frozen before comparisons. SHA-256: `f3429802af3354335d5c724fc5497a24dde41ea11ac8178b2ac88c9416148b5e`. Eras, weights, fixed Phase 2 quantiles, primary stable sample, suppression, exact-month comparisons, pretrend formula and presentation thresholds were not retuned after results.

- Official intake: 139 CPS Basic Monthly ZIPs (2015-01 through 2026-08, excluding nonexistent 2025-10), 12 official layouts and one official Census concordance: **152 pinned files**. All passed byte identity and parsing. Raw public-use ZIPs remain in external cache, not Git.
- Independent raw qualification reparsed **all 139 months** and reproduced accepted sufficient statistics. Dictionary, source URL, native taxonomy, units and weights were included in comparison.
- Source/source-manifest checksums and genuine retrieval receipts are retained. No synthetic raw CPS values enter accepted outputs.
- OEWS official national ZIP and official download/time-series endpoints returned **HTTP 403**. No accepted OEWS vintage. Six synthetic adapter tests demonstrate parsing/suppression/comparability guards only.
- Official concordance: 540 old / 570 new Census codes, 657 temporal edges; explicit publisher merge notes resolve blank-target merges. Strict sample never allocates ambiguous edges.

## Final offline qualification

- Phase 3 tests: **94 passed, 0 failed, 0 skipped/deferred** (63.902 seconds). Literal test operands, official anchors, negative weight/date/period/schema cases, duplicate records, exact exposure assignments, weighted earnings, suppression, pretrend arithmetic, partial-year controls, provenance/spec mutations and independent source failures. No live internet required.
- Existing Phase 1 tests: **71 passed**; Phase 2: **77 passed**. No failures or deferrals in those runs.
- Two fresh-process builds: identical canonical bytes/hashes for all eight analytical views. Final artifact-map hash: `2eff8331d05baffa4db0eb063f95d1ec74f2c31b605252217d1f8c70dc25b57f`.
- Final semantic/schema reconstruction: **8/8 validated** against accepted inputs. Operational clocks excluded.
- Current summary reduced to about **34 KB**; full period/industry detail remains in separate research tables. This does not alter economic arithmetic.
- `npm run build`: **PASS**, existing large-chunk warning remains. `npm run verify`: **PASS**, including strict public Signal validation.
- Existing 140 Phase 1/2 research files match their starting hashes. Production React, routes, workflows, economic snapshots, Signal modules, notifications and package version remain unchanged. Version **1.1.0**.
- Compiled `dist/` has no Phase 3 contract, file-name or specification-hash markers; research outputs are not published.

One regression test caught incomplete-year values being compared with full-year index bases. Full-year indexes now exclude partial years; separately labeled matched-month comparisons remain. The frozen rules/thresholds did not change.

## Descriptive results and quality

Strict balanced samples: academic **167** SOC occupations, Microsoft **190**, common **165**. Count coverage **19.26% / 21.91%**; 2024 employed-weight coverage **37.77% / 47.55%**. Expanded allocation deferred.

Complete-year 2022–2024 Q5–Q1 employment gaps: **+0.42 / +0.56 pp**. Academic pretrend gap **+0.20 pp/year**; Microsoft **-1.18 pp/year**, flagged as pre-existing. Cross-source post-period gap difference **0.15 pp**, common-sample **0.22 pp**. All five group tables, 2019/2022 indexes, pandemic periods, 2022 levels, hours, nominal earnings and supported age cells retained.

Current aggregate classifications: **NO CLEAR EXPOSURE-GROUP DIVERGENCE**, **DIVERGENCE EXISTS BUT PREDATES GENAI**, **DATA COVERAGE INSUFFICIENT**. Interpretation: **DESCRIPTIVE_ONLY / NOT_ESTABLISHED**. Presentation thresholds are not statistical significance.

**No appropriate design SE/p-values**: repeated CPS person-months and complex survey design preclude naive IID intervals. Nominal earnings span 2023–2024 disclosure changes. Young-worker composition does not identify seniority, occupational hiring or career-ladder compression. Missing October 2025 and changed population controls remain explicit.

Current provider status: CPS PARTIAL with 139 successful month intakes; concordance/exposure/context PARTIAL; OEWS UNAVAILABLE. Independent fetch failure tests preserve all last-valid accepted month and analytical hashes. Exposure/context loss neither fabricates new groups nor invalidates other accepted sources.

## Decision and remaining work

No known HIGH implementation defect remains after qualification. Meaningful MEDIUM evidence limitations: narrow matched coverage; no accepted OEWS context; design uncertainty absent; earnings comparability; industry-taxonomy/control gaps; insufficient complete post-period coverage and Microsoft pretrends. These limit inference, not build execution.

Phase 4 requires defensible broader mapping, uncertainty, explicit confounder treatment, more observations and an independently reviewed causal/scenario design. No Phase 4 work, Signal/fiscal coupling or UI is included.

**MORE OBSERVED DATA REQUIRED** for broader labor-transition conclusions. The research implementation and its limited descriptive results are ready for inspection.
