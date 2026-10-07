# AI CapEx Phase 2D.1 — live runner access qualification

Research base: `05623ffa6cbe0d4ba9f5c2fc0a5d3986c5ac5c13`. This branch is deliberately separate from production. The frozen accepted panel ends at 2026Q2. No new economic data is accepted by this tool.

## Purpose and boundaries

Phase 2D encountered SEC/issuer archive access failures. This phase distinguishes access to discovery pages from retrieval of real financial documents. A 403 is an access failure, not proof that no release exists. A 200 index page is not proof that a financial document can be fetched.

The runner uses Phase 2D's descriptive project User-Agent, official issuer/delegated-tenant policy, at least one second between requests, 30-second timeout, 25 MB streaming limit and at most three redirects. Every redirect is revalidated. 403/429 suppress subsequent requests to the same host in the run; Retry-After is recorded, with no automatic retry. No browser cookies, proxies, logged-in sessions, search-engine feeds or API secrets are used.

## Positive controls

Six control identities are loaded directly from the pinned Phase 2A source manifest: Microsoft FY26Q4 release, workbook and call; Alphabet, Amazon and Meta 2026Q2 release PDFs. The explicit SEC document probe uses the existing Alphabet Q2 10-Q reference; that HTML URL has a qualified filing reference but no pinned raw hash, so a successful response still requires review. The separate Meta annual-report SEC index proves index access only.

Controls run before current discovery. Validation checks MIME and HTML/PDF/XLSX structure, issuer name, native financial content and observation-period markers. Workbook ZIP expansion and PDF page counts are bounded. A known-document hash match yields `PASS_EXISTING_HASH`; valid structure with changed bytes yields `CHANGED_BYTES_REVIEW_REQUIRED`. Existing accepted objects are never replaced. Unhashed manual documents cannot qualify a runner automatically.

## Reproduction

Use Node 24.19.0 and Python with `pypdf==6.10.0` and `openpyxl==3.1.5`.

```sh
WIL_AI_CAPEX_PYTHON=python3 node research/ai-capex-monetization/refresh/access/qualification.mjs \
  --runner LOCAL_MAC --as-of 2026-10-07 \
  --out research/ai-capex-monetization/refresh/outputs/access-local
node --test research/ai-capex-monetization/refresh/tests/access.test.mjs
```

`--as-of` must be the explicit UTC date of the live run. Fixture tests use fixed clocks. Set `WIL_AI_CAPEX_CACHE` or `--cache` to an external content-addressed cache; the default remains `~/Public/wil-ai-capex-cache`. Raw objects never go into Git or Actions uploads. CLI report outputs must be under ignored refresh outputs or the system temporary directory.

## Runner assessment

The committed compact qualification report is the authoritative result. Discovery and document-fetch states remain separate for each company. Primary-runner qualification requires all four companies to have both workable official discovery and a validated core financial-document route. Workbook access can qualify Microsoft's financial-document route; it does not qualify discovery or management events. Cross-runner coverage is allowed only when actual independently qualified routes cover all four companies.

Operational timestamps, OS, Node version and latency belong to access telemetry only. `accessIdentity` hashes deterministic source outcomes without timing/new-cache-object noise. It is not an economic artifact hash. This phase generates no new economic identity, recognized AI-only revenue or AI return estimate.

## Manual official-source seed

An operator may provide a JSON array through `--seed-file`:

```json
[{"company":"GOOG","url":"https://s206.q4cdn.com/479360582/files/doc_financials/2026/q2/2026q2-alphabet-earnings-release.pdf","expectedQuarter":"2026Q2"}]
```

Seed use is explicit in the receipt. An issuer-host URL must pass normal official-host checks. A CDN seed requires delegation already present in the qualified manifest; operators cannot invent a new delegation. Known hashes are checked. New/unhashed documents remain review-required and subsequently need Phase 2D native extraction, accounting qualification and explicit human promotion. A seed is an operator-assisted fetch, not automated discovery qualification.

## GitHub qualification

The added `AI CapEx Refresh Access Qualification` workflow is dispatch-only, exact-research-branch gated, `contents: read`, credential persistence disabled. It uploads only `access-report.json` with 30-day retention. It cannot commit, deploy, email, schedule, update production or promote data.

GitHub requires a dispatch workflow to be registered on the default branch before dispatching a different ref. See [GitHub's manual workflow documentation](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow). Direct dispatch of the new filename returned HTTP 404 on 2026-10-07. Actual GitHub-hosted qualification therefore uses the already-registered `signal-engine-shadow-qualification.yml` dispatch endpoint with this research ref. Only the research copy gains an independent `ai-capex-access` job gated to this exact branch. The original Signal job is byte-for-byte unchanged and its branch condition excludes this branch, so it does not run. Production main and its workflow files remain untouched. The standalone access workflow remains dispatch-only and prepared for a future separately approved registration. This bootstrap does not authorize a production merge.

```sh
gh workflow run signal-engine-shadow-qualification.yml \
  --repo ccesm/world-inflation-lens --ref codex/ai-capex-live-runner-access -f mode=normal
```


## Access results and recommended routes

Final local/Actions observations, repeatability, company routes and unresolved discovery gates are recorded below after live qualification. Official issuer releases may be operational primaries when SEC is blocked, but accounting and provenance standards are unchanged. No source-order recommendation is inferred from institution reputation alone.

## Remaining boundaries

No schedule, email, production write or unattended promotion is implemented. Current discovery links are candidates only; blocked or unsupported discovery never means `NO_NEW_DISCLOSURE_CONFIRMED`. Unknown publication dates remain unknown. Manual seeding is a fallback requiring human review, not a repaired automatic discovery adapter. Access qualification does not qualify a new quarter or AI ROI.
