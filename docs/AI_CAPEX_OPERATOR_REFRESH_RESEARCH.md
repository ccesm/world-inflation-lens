# Operator-triggered quarterly refresh (Phase 2D.2)

Base: 49dbd388a9a1eac84322fcecd37bff97130ee7ef. Frozen accepted panel ends 2026Q2. This branch must never be merged into production.

`refresh/operator/run.mjs` accepts source identity only. `AI_CAPEX_MODE=check` checks SEC submissions and issuer IR independently; `AI_CAPEX_COMPANY` selects ALL or one issuer. A blocked or unsupported index cannot prove absence of a new disclosure. `manual_seed` requires company, `AI_CAPEX_OFFICIAL_URL`, and `AI_CAPEX_EXPECTED_QUARTER` (calendar YYYYQn).

Both modes reuse the Phase 2D safe fetcher, native parser, definition binding, quarter selection, FCF reconciliation, and deterministic candidate monitor. Documents require official host, known CDN delegation, issuer, MIME/signature, publication/period and raw-hash validation. Exact known CDN URLs are pinned; new URLs or tenants generate DELEGATION_REVIEW_REQUIRED with parent evidence. An operator cannot self-delegate or enter numbers. Changed known bytes require review. Conflicting core company-quarter sources are not implicitly selected.

Example local dry run (Node 24, install Python requirements in a virtual environment):

```sh
AI_CAPEX_MODE=check AI_CAPEX_COMPANY=ALL \
WIL_AI_CAPEX_PYTHON=/path/to/venv/bin/python \
WIL_AI_CAPEX_CACHE=/external/cache AI_CAPEX_OUTPUT=/tmp/candidate \
node research/ai-capex-monetization/refresh/operator/run.mjs
```

For manual fallback select manual_seed and provide the official URL and expected quarter. No financial input is supported. Microsoft workbook retrieval is qualified, but unknown workbook extraction layouts remain REVIEW_REQUIRED. PDFs without provable standalone periods also remain review items. A known unchanged historical control does not extend the accepted study window.

Outputs are bounded to 1 MB. Upload only operator-candidate.json, never internal extractions or raw cache. Content identity excludes clock, path, actor and run ID; the separate audit retains run ID, operator, execution SHA, mode and timestamps. Candidate metrics, accounting warnings, definition/restatement records, optional health, monitor comparisons and public-preview identity are included. Preview is NOT_FOR_PRODUCTION and never copied to src/public. Accepted source files are immutable.

The research-only qualification bridge uses an already-registered manual workflow, gated to this exact branch. The separate production PR registers a dedicated workflow with a fixed research SHA, read-only permissions and no scheduled or autonomous effects. Qualification via the bridge does not establish default-branch registration. Owner approval to merge the small control PR is still required. No email, Pages action, accepted-data promotion, API secret or runtime LLM is included.

Human results: NO ACTION NEEDED, OFFICIAL URL REQUIRED, REVIEW REQUIRED, or QUALIFIED CANDIDATE READY FOR REVIEW. All stop at human review. This is not AI ROI measurement.
