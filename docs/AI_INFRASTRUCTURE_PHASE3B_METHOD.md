# AI infrastructure financing — Phase 3B method

Research only; reviewed 2026-10-07. Base `81b546b847e39b0314a61cbad357a62a9495a18c`, branch `codex/ai-infrastructure-financing-phase3b`. Production reference `be9dde341cfb32a53b7a3fca76e04d631a926bcd` is unchanged. This branch must never be merged wholesale into main.

## Versioned research views

Phase 3A's `data/*.json`, schemas, validator, tests and qualification report remain frozen. Phase 3B is a separately qualified registry view in `research/ai-infrastructure-financing/data/phase3b/`, with its own strict field contracts in `phase3b/schemas/`. It reuses stable entity/project identities without overwriting the older assertions. Consumers must select a namespace explicitly; concatenating the two registries would duplicate projects and financing. Root `data/scope-map.json` and `data/overlaps.json` are Phase 3B additions. `cases/` indexes the reviewed view; the validator checks references and required field coverage.

This deliberate namespace boundary preserves both the old accepted conclusions and the improved evidence. There is no automatically selected “latest” accepted history, public exporter, refresh workflow or promotion command.

## Five separate questions

1. Physical assets: what is built, planned, live and within which site boundary?
2. Accounting: which entity reports assets, investments, lease liabilities or exposure disclosures?
3. Financing: who issues a security or provides capital, for which buildings and refinancing purposes?
4. Obligations: who owes rent, completes construction or supplies conditional credit support?
5. Monetization: is project-attributable revenue, utilization or cash flow disclosed?

A debt amount, a construction estimate, a lease commitment and a conditional guarantee do not become an investment total. Corporate PP&E is not allocated to a branded campus without evidence. Issuer maximum exposure is retained as an issuer disclosure, never reconstructed as debt or expected loss.

## Source archive and replay

`hydration/source-plan.json` records curated official routes, publication dates, issuer markers and classifications. Run:

```sh
node research/ai-infrastructure-financing/hydration/archive.mjs research/ai-infrastructure-financing/hydration/source-plan.json
node research/ai-infrastructure-financing/hydration/verify-archive.mjs
node research/ai-infrastructure-financing/scripts/validate-phase3b.mjs
node --test research/ai-infrastructure-financing/tests/*.test.mjs
```

Set `WIL_AI_INFRA_CACHE` to an external directory; default `~/Public/wil-ai-infrastructure-cache`. Objects are exact downloaded bytes at `objects/<first-two-hex>/<sha256>`. Receipts are append-only external JSON files; Git stores compact reviewed source identities and per-case manifests, not PDFs, HTML bodies or extracted full texts. Back up both objects and receipts to a versioned external store. Recovery verifies every committed hash/size with `verify-archive.mjs`; missing files remain missing. Refetching a changed URL cannot recover an old publisher vintage. Never replace an accepted digest with a current response merely to make hydration pass.

Fetcher: descriptive project User-Agent, HTTPS, manually checked redirects (maximum three), allowlisted host/path at every hop, 30-second request timeout, 15 MB maximum body, at least 1.1 seconds between CLI requests, no cookies/proxies/authentication. A 403/429 stops further requests to that host in the run; Retry-After is recorded and no automatic retry occurs. Failures are isolated from other hosts. A challenge page, wrong issuer, wrong MIME or wrong signature cannot count as financial evidence. PDF signature/MIME validation is followed by agent-assisted issuer/period/section review; the fetcher never claims to validate financial content from a PDF signature alone.

Same URL/same digest is `UNCHANGED_HASH`; changed bytes create a second immutable object and `CHANGED_BYTES` review; explicit amendment metadata gives `AMENDED_DOCUMENT`. A reviewer may subsequently classify regeneration as `SERVER_REGENERATION_REVIEW_REQUIRED` or content failure as `CONTENT_MISMATCH`; neither is an automatic acceptance. The implementation does not decide whether different bytes constitute a legal amendment. Archival receipts may differ in time; normalized reviewed economic identity excludes retrieval timestamps and access diagnostics and includes claim values, raw hashes, selection, definitions and overlap rules.

SEC direct access was blocked. The 2025/2026 Meta filings were independently read through public document research, but their publisher bytes were **not** archived. Their records say `WEB_REVIEWED_NOT_ARCHIVED`; raw digests remain null. The public Meta issuer PDF uses the already qualified `s21.q4cdn.com/399680738/` tenant with official parent provenance. No unrelated tenant is authorized. A too-large regulatory packet also remains unarchived rather than being truncated into a fake document.

## Claims, clocks and conflicts

Every material registry field references a claim ID. Claims retain value, unit, currency, native capacity definition, bound/operator, scope, entity, source IDs, precise locator, effective date and review/evidence status. Dated sources and retrieval times remain separate. Missing values are null with `UNAVAILABLE`, including debt recourse/coupon when primary terms have not been obtained. Secondary text assertions use `SECONDARY_REPORTED`; secondary quantitative approximations use `SECONDARY_ESTIMATE`. Brookings remains secondary research.

Meta year-end 2025 and June 2026 accounting claims are separate linked versions. The original Applied preferred-capital announcement is retained as dated historical terms; the subsequent UPA/entity changes are noted without pretending the original facility ceiling is current funded campus equity. A government or company projection is not upgraded into a realized cash cost. Project status is source-dated; no calendar-driven operational assumption is allowed.

Conflicts record both sources, dates, definitions/scopes, possible explanation and `CONFLICT_REQUIRES_REVIEW`; values are never averaged. The Fairwater early/mid-2026 completion expectations illustrate this rule. Later equipment-online evidence does not prove the precise date the entire campus met all operational criteria.

## Scope and double-count gates

The Hyperion matrix separates original JV development, original financing, expanded regional/campus plans, original grid approval, expanded grid plans and Meta reporting periods. The $27bn development estimate and >$50bn regional plan are not a growth series. The 2.064GW rating-related description has an unresolved native capacity definition; it cannot be converted into the same denominator as the 5GW expansion plan. Original utility approval does not approve the later seven-plant plan.

`DO_NOT_ADD_PAIRS` blocks all within-case monetary additions, including successive-period stocks, original facility ceilings and platform financing ceilings. `overlap-graph.json` links monetary disclosures to a physical-asset umbrella using `MAY_OVERLAP`, and to one another with noncomparability/anti-addition edges. An umbrella identity is not proof of identical footprint. Exact typed transaction edges live separately in `relationships.json` and require exact source claims. This is a conservative accounting guard, not a financial-risk model or a claim that every pair represents precisely the same asset.

No capital stack must sum to project cost. Refinancing amounts must not be counted again as fresh construction money. No AI ROI, hidden leverage, expected loss, systemic-risk score, cross-company rank or synthetic total is produced. Source-readiness scores are internal case-screening aids only.

## Qualification limits and next phase

All three archetypes can be compared structurally, with primary-supported fields and explicit gaps. Hyperion title/issuer/security/recourse documents, Fairwater deed/site ledger and PF1 utility/service details remain priorities. Phase 3C should use a long-form cross-company panel keyed by entity, asset, scope, layer, source vintage and period, with no headline investment sum. Raw archival completeness and exact legal contracts should remain independent qualification gates. No Phase 3C implementation or production activation is authorized by this report.
