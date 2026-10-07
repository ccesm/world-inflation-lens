# AI CapEx quarterly refresh qualification — Phase 2D

Research-only controlled pilot. **No production publication, schedule, email, merge, or deployment.** The accepted research panel remains 2019Q1–2026Q2; the v1.3.0 public snapshot is untouched. The research branch starts at Phase 2B `afbc5da5b718d86c48d0e48d31a1eba456a26e09`, with accounting base `ad6ebf96e2bf59145f31120dd02cdcc3fbca24b7`. Production reference observed: `4b28c278d99c39d022f5336d634aff4a9b5a4a41`.

The inherited research tree predates the public feature and has application version 1.1.0. It is deliberately not reconciled with production 1.3.0. Build/verify qualify this research base; they do not change the live application. No research stack main PR is appropriate.

## Architecture and source discovery

`research/ai-capex-monetization/refresh/` contains independent discovery, safe retrieval, native candidate extraction, accounting qualification, monitor overlay, and explicit review gate modules. Existing Phase 1/2A/2A.1/2B contracts and inputs are unchanged. Every monitor evaluation first rebuilds the pinned Phase 2B accepted artifact, including its frozen input hash and panel identity. New candidate records are a separate overlay, not an extension or mutation of that accepted artifact.

Official discovery uses issuer-bound SEC submissions and direct EDGAR filing URLs, followed by official IR static links. Issuer CIKs: Microsoft `0000789019`, Alphabet `0001652044`, Amazon `0001018724`, Meta `0001326801`. It considers 10-Q, 10-K, amendments and 8-K event candidates, retains period/publication/accession identity, excludes future filing dates and deduplicates accession/URL. Old known filings are not downloaded wholesale. Recent SEC history is discovery coverage, not a publisher-vintage archive or a complete historical submission reconstruction.

IR boundaries reuse the Phase 2A official-host policy. Allowed delegation includes the existing issuer-specific q4cdn tenants and Microsoft's CDN. A CDN URL must be linked from an eligible official parent, with HTTPS, no credentials, and correct tenant. Unrecognized archive layouts or no qualified static links are **REVIEW_REQUIRED**, never proof that nothing was released. Dynamic IR API/workbook adapters need their own source-layout qualification; no anti-bot bypass is attempted.

### Live qualification result

The explicit `2026-10-07` run completed in about five seconds. SEC returned HTTP 403; subsequent attempts to that host were suppressed in the same run. Alphabet, Amazon and Meta IR also returned 403. Microsoft returned a static response with no qualified links, marked REVIEW_REQUIRED. All companies' top-level refresh state was ACCESS_BLOCKED. This is **not NO_NEW_DISCLOSURE and not proof of an absent 2026Q3 release**. No live company-quarter, restatement, policy change or management event was qualified. One official index response was cached; no financial document was added. Details are in the compact qualification report.

## Safe fetch and external cache

Defaults: `WIL_AI_CAPEX_CACHE`, otherwise `~/Public/wil-ai-capex-cache`. Raw bytes never enter Git. Storage remains `objects/<first-two-hash-characters>/<sha256>`. Existing objects must match hash and size before reuse, and cannot be overwritten under another identity.

Fetcher boundaries: descriptive public research User-Agent/contact URL, at least one second between requests, 30-second complete request/body timeout, 25,000,000-byte streaming limit, at most three redirects, official-host validation at every redirect, and a bounded per-company document budget (default 12; CLI maximum 40). HTTP 403/429 blocks the relevant host for the rest of the run. Retry-After is recorded; no retry is issued before it, and there is no automatic retry loop. Timeout/network/parse errors preserve prior accepted data. Shared SEC host blocking is a source-level outage; the four distinct IR families still run independently.

Raw receipts include company, source ID, URL/resolved URL, canonical host, known publication/period, retrieval timestamp, document type, MIME, size, SHA-256, accession, amendment status and retrieval result. Unknown dates remain null until native evidence establishes them. Receipts and run IDs/timestamps live separately from economic content. No API key, email secret or runtime LLM is required.

## Candidate lifecycle and accounting

Lifecycle: DISCOVERED → FETCHED → PARSED → VALIDATED → QUALIFIED_CANDIDATE, or REVIEW_REQUIRED / REJECTED / ACCESS_BLOCKED / NO_NEW_DISCLOSURE. **There is no automatic transition to ACCEPTED.** Unsupported parsing is REVIEW_REQUIRED even when the bytes were fetched successfully.

The Python extension reuses Phase 2A HTML/PDF table, publication and native quarterly-header helpers without changing the frozen extractor. It requires company identity, millions units, native quarter/month/year columns, one unambiguous metric context and exact dates. Both current and prior-year columns are retained. It never chooses the first numeric tag, substitutes company-facts tags for native scope, divides YTD values by quarters, or silently converts unknown layouts. Named Cloud/AWS/Intelligent Cloud tables are optional; unrecognized or recast scopes remain review items. Workbook/custom XBRL contexts currently fail closed for manual extraction review.

Each row retains native label, source locator, source ID, unit, exact duration, calendar/fiscal quarter, scope, precision, evidence class, revision basis and active definition version. Exact native label/scope/unit bindings use the accepted registry. Unmapped labels create an explicit pending definition item; they are not automatically registered. Proposed changes retain previous version, effective period, change type/reason and comparability status. Segment/policy/lease/useful-life/RPO snippets are review evidence, not approved definition changes.

Quarter reconstruction supports H1 − Q1, 9M − H1, and FY − 9M only with explicit reviewed same-definition/scope/unit/precision/restatement-vintage proof, exact fiscal start and consecutive quarter boundaries. A single standalone quarter takes precedence. Missing or ambiguous operands remain unavailable. The automatic native parser does not synthesize that compatibility proof; YTD-only sources require a separately reviewed extraction/compatibility mapping.

Core qualification requires revenue, operating income, CFO, native cash PP&E and company-convention FCF, official raw provenance, valid units/scope/periods, and no unresolved core conflict. The shared Phase 2A `deriveCash` implements:

- Microsoft/Alphabet: CFO − cash PP&E.
- Amazon: CFO − net cash PP&E; disclosed net also reconciles to gross less proceeds/incentives.
- Meta: CFO − native cash PP&E − finance-lease principal.

Comparable reported FCF must match calculated FCF exactly in the disclosed million-dollar units. No discrepancy is auto-resolved. Optional depreciation, cloud, leases, backlog, guidance, monetization, capacity and useful-life families have independent status; optional missingness does not block complete core accounting. Unknown/missing units never become zeros.

## Revisions, events and candidate monitor

Same URL/changed bytes, new URL/same filing and amendments generate review items. Native prior-year values are compared with accepted observations. The diff retains old accepted and new candidate rows, original/recast source IDs and dates, definitions and status. History is not rewritten. Multiple native contexts are not resolved by favorable source selection.

Text extraction discovers run-rate, seats, attribution, capacity, backlog and guidance passages with exact normalized-text locators. These are **REVIEW_REQUIRED snippets with null numeric value**, not automatically accepted disclosures. RUN_RATE remains annualized context; no division by four, interpolation, cloud summation or conversion to recognized revenue. Guidance ranges require native human qualification; no midpoint is invented. Recognized quarterly AI-only revenue defaults to UNAVAILABLE; no inference fills it. AI capital returns remain NOT_IDENTIFIED. A future genuinely explicit AI-revenue disclosure requires a separately qualified extraction/definition before this default can change.

Candidate monitor calculations reuse Phase 2B ratios, leaf-definition signatures, exact prior-quarter/year comparisons and numerical direction rules. Accepted observations are immutable; qualified candidate rows are appended only to a **CANDIDATE_MONITOR / NOT FOR PRODUCTION** envelope. Missing and noncomparable evidence remains unavailable. Candidate dates can differ by company. The shared public quarter stays **2026Q2**; a later headline quarter is proposed only when all four companies have qualified core accounting for that same calendar quarter. Later sparse events cannot independently advance it.

A candidate public preview is generated only in ignored research output storage. It includes the accepted projection plus clearly labeled candidate records; it is not copied to `src/` or `public/`. No ROI, ROIC, IRR, NPV, payback, AI-specific cash flow allocation, score or ranking is calculated.

## Outputs, isolation and deterministic identity

Ignored `refresh/outputs/` contains:

- `runs/<runtime-run-id>/`: runtime receipts and extraction candidates.
- `generations/<economic-result-hash>/`: immutable candidate monitor, public preview, source manifest, accepted-versus-candidate summary, source/definition diffs and quarter qualification.
- `current.json`: last successfully written **candidate-only** generation pointer.
- `latest-receipt.json`: current operational health, separate from economic identity.
- `controlled-fixture/`: clearly synthetic qualification output, not discovered financial evidence.

Economic identity binds frozen accepted input, raw source hashes, selections, definition versions, candidate values, monitor rules and implementation bytes. It excludes runtime timestamps, run ID, paths and the new-versus-existing cache flag. Candidate artifacts are independently rebuilt for semantic validation. Immutable generation content is checked on reuse; corruption fails closed. No-new-data runs write operational receipts only and preserve the existing economic bytes/hash/pointer. Failed companies retain explicit last-valid accepted quarter/hash, never fabricated current data.

Per-company, source-family and optional metric-family health is separate: CURRENT_ACCEPTED, QUALIFIED_CANDIDATE, NO_NEW_DISCLOSURE, PARTIAL, REVIEW_REQUIRED, FAILED_WITH_LAST_VALID, ACCESS_BLOCKED, DEFINITION_BREAK, UNAVAILABLE. No global fake PASS. Access failure is not an economic change or a statement about current accounting.

Raw cache should be backed up with source manifests and receipts. Keep immutable generations until their candidate review disposition is recorded; these compact reviewed manifests/results can later be archived outside normal main Git history. Never remove the only copy of a source object referenced by an accepted or reviewed candidate manifest. Recovery validates every hash/size, restores the referenced generation and pointer, and reruns semantic validation before reuse. There is no remote storage, branch-write, deployment or email infrastructure in this phase.

## Human promotion gate

`--review-file <file>` validates an explicit reviewed file containing `reviewed`, reviewer, approvedAt, exact candidateMonitorHash, target `RESEARCH_ONLY` and approvedCompanies. It requires all four companies in a common proposed quarter and rejects unresolved core source/definition changes through core qualification. When optional review items exist, the reviewed file must additionally bind `acknowledgedReviewItemsHash` to the exact review-item list; approval is never inferred from a generic flag. An explicit partial-publication policy is **not implemented**; the gate fails closed instead. Approval cannot be before eligible publication evidence.

This command only reports that a research review gate passed. It does **not** write ACCEPTED data, extend the frozen panel or publish production. Accepted-panel promotion needs a separately reviewed versioned input/selection/definition update. Production delivery must later use a clean main-based compact projection branch; this full research stack must never merge into main.

## Qualification and operating procedure

From repository root, Node >=22.12 and the pinned Phase 2A Python dependencies:

```sh
python3 -m venv /tmp/wil-phase2d-python
/tmp/wil-phase2d-python/bin/python -m pip install -r research/ai-capex-monetization/quarterly/requirements.txt
export WIL_AI_CAPEX_PYTHON=/tmp/wil-phase2d-python/bin/python
export WIL_AI_CAPEX_CACHE="$HOME/Public/wil-ai-capex-cache"
# Explicit current UTC cutoff; network, research candidates only:
node research/ai-capex-monetization/refresh/scripts/run.mjs --as-of YYYY-MM-DD
# Explicit recent accepted-URL byte/revision check, still no acceptance:
node research/ai-capex-monetization/refresh/scripts/run.mjs --as-of YYYY-MM-DD --check-known
# No network: all Phase 1/2A/2A.1/2B/2D tests, controlled fixture, build/verify, compact report:
node research/ai-capex-monetization/refresh/scripts/qualification.mjs
```

No implicit historical availability is inferred. A historical cutoff earlier than the actual run is rejected; this refresh CLI is current candidate qualification, not a historical replay simulator. Deterministic tests use explicit clocks and small synthetic sources. Fresh-process tests compare identical bytes; no-new-data, changed source, incompatible YTD, amendments, access blocks, corrupted cache, wrong host/issuer, optional gaps, restatements and last-valid fallback are covered.

No GitHub Action was added. Controlled operator runs suffice to qualify this phase; scheduled refresh, email and Phase 2D production integration remain unactivated. A later optional qualification-only Action must use workflow_dispatch, contents:read, compact artifacts, no raw cache upload, branch writes, Pages job or notification.

### Pilot gates and known limitations

The controlled pilot is ready for **human-reviewed** operation, including honest blocked-access outcomes. It does not assert that live discovery is complete or that any 2026Q3 company quarter has been qualified. Before live quarterly adoption, qualify access from the intended runner, native layouts/workbooks/custom contexts, dynamic archives, event numeric extraction and any required cross-filing compatibility proof. Discovery coverage, unsupported layouts and reviewed optional accounting boundaries are the remaining meaningful limitations. No production write or economic threshold/methodology change is needed for this qualification.
