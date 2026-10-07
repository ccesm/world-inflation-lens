# AI CapEx → Monetization: Phase 2A quarterly panel

Research-only qualification, 2026-10-06. **QUARTERLY PANEL STILL REQUIRES SOURCE / ACCOUNTING REPAIR.** This delivers a substantial native accounting panel, not a public monitor or an AI return model. Alphabet's early raw-source gap and incomplete original/restated segment archival pairing prevent the next readiness claim.

The exact starting point is `codex/ai-capex-monetization-foundation`, `b91dfceb9c893a0e2865c85503fedff588dcf7c6`; work belongs to `codex/ai-capex-quarterly-panel`. Main inspected during qualification is `a80aa5cf66e5e4e3424696758b71d6e945b7958c`. Main's v1.2.0 release was not merged into the explicitly requested research base. The research branch keeps its inherited application version, 1.1.0; this does not downgrade production. No application, economic snapshot, workflow, Signal Engine, email or public asset is changed.

Phase 1 remains authoritative: [research matrix](AI_CAPEX_MONETIZATION_MODEL_MATRIX.md), [data contract](AI_CAPEX_MONETIZATION_DATA_DESIGN.md), [accounting bridge](AI_CAPEX_ACCOUNTING_BRIDGE.md). Its 73 sparse observations, 13 source references and tests remain unchanged. The new namespace and draft schemas are additive.

## Source qualification and retrieval

| Source path | Result | Use and limitation |
|---|---|---|
| SEC Company Facts | ACCESS_BLOCKED, initial Microsoft request HTTP 403 | A tested candidate adapter exists; **no live SEC structured observation is accepted** |
| SEC filing archive | Alphabet current exhibit request HTTP 403 | No retry loop or mirror; manual Phase 1 references remain separately labeled |
| Microsoft official releases | 16 historical HTML releases retained | Native standalone quarterly statements and comparative columns |
| Microsoft official workbook | One FY2026 Q4 financial workbook retained | 30 native capital-lease-inclusive CapEx quarters, rounded billions scaled to millions |
| Microsoft official earnings call | One FY2026 Q4 transcript retained | Manually qualified raw-bound RPO and sparse management events |
| Amazon official release PDFs | 16 retained, 30-quarter accounting coverage | Company-delegated `s2.q4cdn.com/299287126/`; current HTML path was blocked |
| Meta official release PDFs / legacy HTML | 11 PDFs and five distinct legacy HTML releases retained | Company-delegated `s21.q4cdn.com/399680738/`; current constructed HTML path was blocked |
| Alphabet official release PDFs | 12 retained, 22-quarter accounting coverage | Company-delegated `s206.q4cdn.com/479360582/`; 2019–2020 archival links remain unqualified |

There are **62 accepted raw artifacts, 21,425,664 bytes**. URLs, delegated official parent pages, SHA-256, MIME, byte size, publication date, native legal issuer, canonical company, CIK, period end and retrieval time are in the [source manifest](../research/ai-capex-monetization/quarterly/inputs/source-vintage-manifest.json). Historical Facebook releases retain Facebook as the native issuer, with META as the stable company key. IR artifacts have `accession: null` and amendment status UNKNOWN; an IR release is not silently assigned a SEC accession or presumed final.

Source priority is a native SEC filing when accessible and qualified, then official releases, metric-specific workbooks, and official transcripts. Active selection prefers the latest **accepted** official vintage; source class resolves same-date ties, with the native CapEx workbook preferred for Microsoft's native measure. No value is selected for an attractive trend. All original/current/comparative candidates are retained.

[SEC developer guidance](https://www.sec.gov/about/developer-resources) and [EDGAR API documentation](https://www.sec.gov/search-filings/edgar-application-programming-interfaces) define the structured-source boundary. Company Facts contains standardized whole-entity concepts, not a replacement for segment dimensions, custom CapEx, leases or management disclosures. The adapter preserves raw USD, accession, form/amendment, filing date and exact context; it does not auto-accept or divide YTD. Filing URLs must bind CIK and accession.

Requests use `WorldInflationLens/Phase2A research (contact: https://github.com/ccesm/world-inflation-lens/issues)`, at most one per second, a 30-second timeout, a 25 MB response bound and no automatic retries. HTTP 403/429 blocks subsequent requests to that host within the run; Retry-After is recorded. Redirects are capped at three and checked against official hosts at every hop. CDN tenants require an official company-parent delegation. A changed byte hash requires review and never replaces accepted economic input. There is no proxy, third-party mirror or credential requirement.

Alphabet's old `/investor/static/pdf/` path returned 404. Relocated official 2020 links were discovered; the redirect-capable qualification encountered 403, so the remaining requests were suppressed. This is an access gap, not an economic zero. Published public IR archive feeds helped discover release URLs; no public widget query keys or complete feed dumps are committed.

Official archive anchors: [Microsoft](https://www.microsoft.com/en-us/investor/earnings/fy-2026-q4/press-release-webcast), [Alphabet](https://abc.xyz/investor/earnings/), [Amazon](https://ir.aboutamazon.com/quarterly-results/default.aspx), [Meta](https://investor.atmeta.com/financials/).

## Data and selection architecture

`research/ai-capex-monetization/quarterly/` contains code, four draft schemas, a small synthetic HTML fixture, tests, a reviewed selection manifest, compact normalized accepted inputs and small qualification reports. Raw bytes and full generated outputs are excluded from Git.

The current input contains **1,203 observations**, including retained competing disclosure vintages: 1,170 extracted native-table records, 30 native workbook records, and three manually reviewed raw-bound records (Microsoft Cloud revenue, Azure growth and commercial RPO). The manual records are not falsely described as automatic table extraction. All source-table duplicates must agree in value, unit, scope, period and definition before consolidation; repeated native locators are retained. Conflicting duplicate contexts are unqualified.

The selection matrix explicitly covers every company, metric and target quarter. Each cell has one pinned observation or null with an UNAVAILABLE reason. Schema/semantic checks enforce native definition, scope, units, date ordering, exact quarter boundaries, source identity, uniqueness and full selection coverage. The reviewed source-set receipt binds source IDs to raw hashes. Empty/ambiguous contexts fail closed. Null never becomes zero; an explicit dash in a qualified financial amount cell is a reported nil amount, distinct from absent disclosure.

The parser requires a native standalone-quarter header, correct month/day, correct first two year columns, native statement title and USD-million units. It handles reviewed HTML captions, old Microsoft table wrappers, PDF wrapped labels and footnote suffixes. Native GAAP income rows end before supplemental expense-allocation notes. Fiscal/annual columns to the right cannot become quarterly observations. A release date comes from the issuer's release dateline, not an acquisition/stock-record date elsewhere in the document.

Microsoft fiscal identity is retained alongside calendar identity: FY2026 Q4 = calendar 2026 Q2; FY2026 Q1 = calendar 2025 Q3. The panel comparison grain is calendar quarter, with no monthly conversion.

## Coverage and accounting boundaries

Every count below is out of 30 calendar quarters, 2019Q1–2026Q2. “Native cash PP&E” is the disclosed gross or net label, not an invented common gross measure.

| Metric | Microsoft | Alphabet | Amazon | Meta |
|---|---:|---:|---:|---:|
| Revenue / operating income / CFO | 30 / 30 / 30 | 22 / 22 / 22 | 30 / 30 / 30 | 30 / 30 / 30 |
| Cost of revenue / native cost of sales | 30 | 22 | 30 | 30 |
| Net income | 30 | 22 | 22 | 30 |
| Native cash PP&E, union of disclosed labels | 30 | 22 | 30 | 30 |
| Gross cash PP&E | 30 | 22 | 30 | 19 |
| Net cash PP&E | Unavailable | Unavailable | 30, calculated | 20, disclosed; overlaps some gross vintages |
| Company-convention quarterly FCF, calculated | 30 | 22 | 30 | 30 |
| Directly reported standalone FCF | Unqualified | Unqualified | Unqualified | 30 |
| Native CapEx | 30, rounded workbook | Unqualified separate label | Unqualified separate measure | 30, calculated native convention |
| Pure quarterly PP&E depreciation | Unqualified | 14 | Unqualified | Unqualified raw archive |
| Broader D&A / other | 30 | Not substituted | 30 | 30 |
| Named cloud revenue / operating income | 30 / 30 | 22 / 22 | 30 / 30 | No artificial AI/cloud segment |
| Finance-lease principal | Unqualified quarterly series | Unqualified | 30 | 30 |
| Finance-lease additions | Unqualified quarterly series | Unqualified | 19 | Unqualified |
| Raw-qualified RPO balance | 1 | 0; one manual event reference | Unqualified | Not this business model |

**CORE_PANEL_QUALIFIED:** Microsoft, Amazon, Meta. **PARTIAL:** Alphabet, whose eight missing core quarters are all 2019Q1–2020Q4. A core gate requires 30 native revenue, operating-income, CFO, cash-PP&E and company-convention FCF quarters, and no unresolved same-quarter FCF mismatch. Depreciation and each optional family remain separately QUALIFIED/PARTIAL/UNQUALIFIED; core qualification does not imply complete AI attribution or every field.

The generated completeness matrix reports every metric's available/missing, direct/derived, reconstructed, comparative-vintage and positively linked restated counts, and definition-break quarters. There are **zero accepted YTD-subtracted quarters**: retrieved releases already supply native standalone-quarter columns. Subtraction support is tested for Q2, Q3 and Q4 and requires a reviewed same-definition/scope/unit/fiscal/vintage compatibility receipt, formula, operand IDs and source IDs. No proof means UNAVAILABLE. No division by year count or interpolation occurs.

There are **zero positively linked RESTATED observations** in the accepted matrix; that does not mean companies never restated. Comparative columns are explicitly labeled COMPARATIVE_VINTAGE. Microsoft's FY2025 Intelligent Cloud realignment is a separate definition version from the earlier segment scope, all native segment history is marked limited comparability, and automatic cross-version growth is rejected. An original-versus-recast archival pair has not been fully qualified. This is a remaining review gate; old values are not silently overwritten or relabeled as a fully reconciled uniform segment.

### Microsoft

Cash PP&E and native CapEx are distinct. Latest cash PP&E is 35,802m; native workbook CapEx is rounded 41,000m. The call's rounded finance-lease disclosure is not lease-principal cash and does not force the two measures to reconcile. Every quarter retains `UNRECONCILED_NATIVE_CAPEX_SCOPE`. The workbook is a 2026 disclosure vintage for historical quarters, not evidence of 2019 real-time availability. CFO-minus-cash-PP&E produces a named company-convention calculation, not a falsely direct reported quarterly FCF.

Microsoft Cloud is broader than Intelligent Cloud; the latest 59,300m cloud-revenue point remains rounded and separate. Azure's latest 43% is as-reported year-over-year quarterly revenue growth, not constant-currency growth or recognized AI revenue. Their longer standalone histories are not backfilled.

### Alphabet

Google Cloud combines infrastructure/platform, Workspace and other enterprise offerings. Segment margin is not AI margin or full corporate AI profitability. Cash PP&E and 14 pure-depreciation quarters are separately qualified; broad D&A is not substituted where pure depreciation is missing. Sequential-quarter FCF reconciliation tables require a separate column map and are not read as a current/prior-year pair; CFO-minus-cash-PP&E remains explicitly calculated.

The Phase 1 Q2 2026 RPO value of 513,900m is retained only in the manual event timeline because its filing raw identity is still blocked. `ALPHABET_RPO_V1` excludes short-term contracts; the short-term-inclusive V2 starts in Q1 2026. Its definition break is retained in policy/history metadata and cannot support unqualified cross-break growth. Backlog is a stock, not revenue, cash flow or AI-only revenue.

### Amazon

Gross cash purchases, proceeds/incentives, net cash PP&E, finance-lease additions, principal and operating-lease cash remain different concepts. Latest net cash PP&E = 54,208 − 1,132 = 53,076m; company-convention FCF = 45,387 − 53,076 = −7,689m. Lease principal is not deducted again; operating-lease cash already enters CFO. Accrued/addition measures never replace cash purchases. AWS revenue and operating income each have 30 quarters; neither represents a separate AI business.

### Meta

Earlier native tables/reconciliations use cash PP&E net of proceeds; more recent comparative disclosures use the purchases label. Both histories survive. FCF and native CapEx choose the cash label from the **same accepted statement basis** as CFO/principal. An older net observation cannot displace a newer compatible gross observation merely because its metric ID exists. Net-cash and gross-cash FCF/CapEx definition versions remain distinct.

All **30 directly reported FCF quarters** now match the corresponding calculation. Latest native CapEx = 30,116 + 962 = 31,078m; FCF = 31,862 − 30,116 − 962 = 784m. CFO-minus-cash-PP&E alone is a separate bridge, not Meta FCF. Missing proceeds are never guessed or set to zero. There is no invented Meta AI revenue segment.

## Depreciation and policy events

PURE_PP&E_DEPRECIATION, PP&E depreciation-plus-amortization, and broader D&A/other have separate metric IDs. Missing pure depreciation does not become mixed D&A. Native life estimates are accounting policies, not observed useful computing life or investment payback.

Policy references preserve announcement/source and effective-date distinctions. Microsoft: prospective 15→25-year datacenter/office-building life change from July 1 2026; no backward effect on this June-ending panel. Amazon: server life 5→6 years from January 1 2024 and a server/network subset 6→5 from January 1 2025. Meta: most server/network assets move to 5.5 years from January 1 2025. Applicable depreciation quarters carry policy flags; underlying expense remains observed and no AI effect is inferred. Amazon/Meta note references inherited from Phase 1 remain MANUAL_REVIEWED with unqualified raw note/publication identity. Current precise Alphabet policy remains unqualified.

## Monetization, capacity and guidance

The separate timeline has **11 sparse events**: two direct annualized AI run-rates, one paid-seat milestone, two backlog/RPO references, one approximate CPU/GPU composition statement, one current capacity-constraint statement, two qualitative AI-business attribution statements, and two forward annual CapEx guidance records. Source qualification (raw-bound versus Phase 1 manual) is separate from the Phase 1 monetization ladder. Direct run-rates are Level 1 financial disclosures **of a run-rate**, not quarterly recognized revenue; paid seats are Level 2; unquantified AI-benefit claims remain Level 5. Non-monetization events have no invented monetization rung.

Microsoft's >37,000m and Amazon's >25,000m annualized disclosures remain RUN_RATE with lower-bound precision. They are never divided by four, interpolated, added to cloud revenue or linked to an invented AI-capital denominator. Microsoft's CPU/GPU share explicitly includes AI and non-AI. No disclosure in a company-quarter is NO_DISCLOSURE, not zero. All 120 quarterly recognized-AI-revenue cells remain UNAVAILABLE.

Microsoft's call describes continuing supply constraints, retained qualitatively without a score. Boilerplate risk factors about possible constraints are not coded as current capacity events. Calendar-2026 native CapEx guidance is a future assumption: Microsoft approximately 175,000m after lease-classification effects; Meta 130,000–145,000m including finance-lease principal. The Meta range is not converted into a midpoint observation.

Events associate disclosures with their stated reporting quarter. Run-rate/seat wording may not disclose an exact measurement day; `observationPeriodBasis` makes that limitation explicit. Publication date, reporting-quarter association and precise measurement date must not be conflated.

## Safe derivations and health

Derived records carry formulas and operand/source IDs. Same-period, same-scope, exact-unit, same-vintage arithmetic provides native cost-based gross profit/margin, operating margin, cash-investment/revenue and cash-investment/CFO intensities, company-convention FCF margin, native Meta CapEx intensity and named cloud segment operating margins. Amazon's cost-of-sales scope is not relabeled as a harmonized software gross-cost definition. Positive denominators are required. Microsoft rounded historical workbook CapEx is not combined with a different release vintage to manufacture an exact ratio.

Exact-prior-year growth is available only through the compatibility helper and is rejected across missing/zero operands, definition breaks or limited comparability. None of these ratios is AI ROI, ROIC, payback, profitability or an investment ranking.

Health is per company/source/metric, never one blanket PASS. The contract vocabulary includes CURRENT, NO_NEW_FILING, PARTIAL, FAILED_WITH_LAST_VALID, ACCESS_BLOCKED, DEFINITION_BREAK, RESTATEMENT_REVIEW_REQUIRED and UNAVAILABLE. Current outputs use CURRENT/PARTIAL/UNAVAILABLE coverage plus independent source ACCESS_BLOCKED records. A validated cache reuse means the pinned artifact is reusable; it is **not** proof that a new-quarter filing has not appeared. No automatic discovery, deployment or monitor activation is claimed. Retrieval and extraction failures are isolated per source, cannot write accepted inputs, and cannot change other companies' observations. Candidate review/acceptance remains a separate step.

## Storage, recovery and determinism

The qualified local raw cache is `~/Public/wil-ai-capex-cache`, outside the repository. Use `WIL_AI_CAPEX_CACHE` to select a different external location. Objects are addressed as `objects/<first-two-hex>/<sha256>`; original retrieval receipts and later hydration run receipts are separate. Existing objects are hash-checked and never overwritten. Only accepted raw objects need retention; do not commit full HTML/PDF/XLSX or ephemeral public feed responses into Git.

Back up the object set, receipts and versioned source manifest together before cleaning this external cache. A clean machine can hydrate pinned official URLs, but any block or hash change must stop acceptance; current raw bytes cannot be silently replaced by a newer URL response. There is no claim that raw recovery will always succeed over today's public network. This task does not create or publish a raw archive Release.

Normalized accepted values, source manifests, definitions and reviewed selection are Git inputs. Full panel/family exports under `quarterly/outputs/`, parser candidates and Python caches are ignored. The small frozen qualification report is permitted in Git; it does not replace regeneration. Unrelated pre-existing labor/fiscal research files were preserved and excluded from this commit.

Economic content includes input, source, selection, definition and policy-context hashes. Retrieval timestamps/status are outside analytical identity. The fixed event timeline has its own hash. A changed raw artifact changes source identity even if canonical arithmetic is equivalent. Identical accepted inputs reproduce identical deterministic bytes in fresh Node processes; semantic output validation independently rebuilds against pinned inputs and rejects a rehashed fabricated value. Historical reconstruction is **current accepted disclosure vintage**, not a publisher-vintage real-time backtest.

## Qualification and remaining gates

Final checks: **65 Node panel tests + 19 Python extraction tests + 48 unchanged Phase 1 tests = 132 passed, 0 failed, 0 skipped**. Tests cover issuer/accession/host binding, exact fiscal/calendar periods, native units/headers, Q2/Q3/Q4 subtraction and incompatible vintages, missingness, duplicates, selection identity, native lease/proceeds conventions, depreciation separation, RPO breaks, event safeguards, effective policy periods, failure isolation, raw hashing, output mutations and fresh-process determinism. Small fixtures are synthetic and do not require live internet.

External-cache qualification: 62/62 raw identities/byte sizes verified and reused; 1,170 table observations plus 30 workbook observations re-extracted byte-equivalently, with three manual raw-bound records explicitly distinguished. Build and full existing verify pass on the specified research base. Production source/routes, refreshed data, workflows, root dependencies/version, Signal Engine and notification code are unchanged; new research markers are absent from dist. The pre-existing Vite large-chunk warning remains unrelated.

Final provenance review corrected 168 Amazon row locators after preserving wrapped-label continuation slots in PDF extraction. No economic value, period, definition or source hash changed. Re-extraction now reproduces every pinned table/workbook record. Three fresh Node processes reproduce identical output bytes; the frozen hashes and coverage checks are recorded in `quarterly/reports/qualification-summary.json`.

Remaining HIGH: Alphabet's eight missing early core quarters prevent the target continuous four-company monitor qualification. Resolve through a reproducibly accessible official source and raw archival identity; do not substitute third-party estimates or sparse manual anchors as if automatically qualified.

Remaining MEDIUM: SEC live access is blocked; original/recast segment pairs and allocation changes need further review before homogeneous trend use; pure/narrow depreciation, leases/additions, construction commitments and historical RPO/guidance are incomplete; several policy/manual event references lack archived raw notes; Amazon net-income extraction still has eight unqualified quarters; IR presentation changes still require controlled qualification. Native Microsoft CapEx reconciliation remains unresolved. These limitations are explicit rather than patched with synthetic numbers.

Next work should repair the official early Alphabet archive and qualify original/recast and native-note vintages, then independently review this accounting panel. Public descriptive monitoring requires a separate approval. No return model, score, forecast, buy/sell recommendation, public UI, workflow, email or deployment belongs to this phase.
