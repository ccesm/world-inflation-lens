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

## Qualification result

405 research tests passed (370 Node, 35 Python); 36 new operator tests are included in the Node total. Fresh native fixture processes reproduce identical deterministic bytes. Both research and clean production builds/verification pass. Production contracts: 39; browser: 12 EN/ZH/mobile/desktop/theme surfaces.

CHECK bridge run 37683755970 succeeded: OFFICIAL URL REQUIRED, all four aggregate company discovery statuses ACCESS_BLOCKED (Microsoft IR independently NO_STATIC_LINK). MANUAL_SEED bridge run 37683995554 succeeded: Alphabet known official Q2 PDF PASS_EXISTING_HASH, KNOWN_ACCEPTED_SOURCE_UNCHANGED / NO ACTION NEEDED. The latter proves bounded source retrieval and no-new-data behavior; its native core extraction did not qualify. It does not prove a new quarter is parsable. The compact reports were 4,024 and 3,716 bytes. No new quarter, public preview or accepted economic output was created by live pilots. Controlled synthetic native-table candidates cover successful accounting qualification and candidate-monitor generation separately.

The production workflow pins tested runtime 6b45185cd25f65ca5df4e77bb6702dae08ddc936. This later report-only commit does not change executable code. A small production control PR still requires explicit owner merge approval and default-branch manual qualification. Therefore end-to-end activation readiness remains OPERATOR REFRESH NEEDS REPAIR.

## Owner-approved registration and final qualification

The owner explicitly approved PR #15 merge and exactly one main CHECK. Normal merge commit be9dde341cfb32a53b7a3fca76e04d631a926bcd was created at 2026-10-07T20:52:31Z. The reviewed feature tree remained identical. The dedicated default-branch workflow is now registered; run 37685381960 succeeded with OFFICIAL URL REQUIRED and deterministic content hash 76a8d3d2b91b99f7e3137b0bcfdcdc3c8a1516d4bbddb8b1f8f82f3aeb88b270, identical to the pre-merge CHECK. Checkout mutation guards and artifact upload passed. Accepted economic data remain untouched.

Normal Pages run 37685323110 succeeded; production economic refresh and daily email were skipped. Live Chinese 390px/dark and English 1280px/light checks confirmed the operator link, v1.3.0 via existing Sources display, no overflow/runtime errors, AI Labor observation mode and Signal route. Four already-cached official controls independently retain PASS_EXISTING_HASH through the operator document validator. No additional live-source qualification request was needed.

The pre-merge decision above is retained as audit history. Its registration gate is now closed. Final decision: READY FOR OPERATOR-TRIGGERED QUARTERLY REFRESH. This qualifies a manual candidate-and-review workflow, not automatic discovery, universal native document extraction or production publication. Existing parser/delegation limitations remain explicit; no genuine new quarter was accepted.
