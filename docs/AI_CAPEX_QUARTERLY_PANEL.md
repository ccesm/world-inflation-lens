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

## Phase 2A.1 Source & Accounting Repair

Qualification date: 2026-10-07. Base: `aaa8aa7a3c056ce790c2ea76c28bc3c750ec5cb9`; branch: `codex/ai-capex-source-accounting-repair`. The preceding Phase 2A results and its `reports/qualification-summary.json` remain an unchanged historical benchmark. Current repair evidence is in `quarterly/reports/source-accounting-repair.json`.

**READY FOR DESCRIPTIVE AI CAPEX MONETIZATION MONITOR**, restricted to the qualified native descriptive accounting panel. This is data-layer readiness for the next separately reviewed research phase, not monitor activation, public publication, homogeneous cross-company accounting, or AI-return readiness. No production code, Signal Engine, economic snapshot, AI-labor observation mode, workflow, email, application version or Phase 1 conclusion is changed. The frozen research base retains app version 1.1.0; newer production main is recorded separately and is not rebased into this task.

### Alphabet recovery and exact periods

SEC and legacy `abc.xyz` raw retrieval returned 403; remaining requests to each blocked host were suppressed. No proxy, unofficial mirror or cached-web-text economic value was accepted. A further official-source discovery found the company-controlled [legacy IR 2019Q4 news page](https://alphabet2025ir.q4web.com/investor/news/news-details/2020/Alphabet-Announces-Fourth-Quarter-and-Fiscal-Year-2019-Results-02-03-2020/default.aspx) and its public `PressRelease.svc/GetPressReleaseList` widget feed. Those dated news records link to exact PDFs on the **same Alphabet 479360582 tenant** already delegated by its official IR website. The news archive supplied eight live [official CDN release PDFs](https://s206.q4cdn.com/479360582/files/doc_financials/2019q4-alphabet-earnings-release.pdf); document issuer, native dateline, exact quarter columns, raw hashes and retrieval receipts were independently checked. The initial failed URLs and successful alternative paths remain recorded, rather than rewriting the access failures as success.

All eight missing core quarters were recovered. Units below are USD millions. These are native disclosed consolidated quarterly values; they are not estimates or AI-attributed amounts.

| Calendar quarter | Revenue | Operating income | CFO | Cash PP&E | Reported FCF = calculated FCF |
|---|---:|---:|---:|---:|---:|
| 2019Q1 | 36,339 | 6,608 | 12,000 | 4,638 | 7,362 |
| 2019Q2 | 38,944 | 9,180 | 12,627 | 6,126 | 6,501 |
| 2019Q3 | 40,499 | 9,177 | 15,466 | 6,732 | 8,734 |
| 2019Q4 | 46,075 | 9,266 | 14,427 | 6,052 | 8,375 |
| 2020Q1 | 41,159 | 7,977 | 11,451 | 6,005 | 5,446 |
| 2020Q2 | 38,297 | 6,383 | 13,993 | 5,391 | 8,602 |
| 2020Q3 | 46,173 | 11,213 | 17,003 | 5,406 | 11,597 |
| 2020Q4 | 56,898 | 15,651 | 22,677 | 5,479 | 17,198 |

Original 2019 releases and 2020 comparative releases both remain accepted. Deterministic latest-official-vintage selection uses 2020 comparative statements for the selected 2019 revenue/income/CFO/PP&E cells. Later disclosure never becomes contemporaneous economic availability. Every source has its native publication date, economic period, source vintage and retrieval time. The new single-quarter FCF parser requires the exact native month/end/year and one FCF column; the multiquarter segment parser maps five expressly labeled quarters and excludes the three annual columns. Changed or ambiguous layouts do not qualify. Eight directly reported FCF values match CFO minus cash PP&E exactly. Calculated company-convention FCF retains formula and operand IDs rather than being relabeled observed.

**Reconstructed quarters: 0; accepted YTD subtractions: 0.** The tested YTD subtraction contract still requires same fiscal start, definition, scope, unit, exact precision, contiguous endpoints and reviewed restatement/vintage proof. Annual division, unrelated investing purchases and invented finance leases are excluded.

### Coverage and native accounting definitions

| Company | Core revenue / operating income / CFO / native cash PP&E / company-convention FCF | Native segment revenue / operating income | Core status |
|---|---|---|---|
| Microsoft | 30 / 30 / 30 / 30 / 30 | IC 30 / 30 | CORE_PANEL_QUALIFIED |
| Alphabet | 30 / 30 / 30 / 30 / 30 | Cloud 30 / 27 | CORE_PANEL_QUALIFIED |
| Amazon | 30 / 30 / 30 / 30 / 30 | AWS 30 / 30 | CORE_PANEL_QUALIFIED |
| Meta | 30 / 30 / 30 / 30 / 30 | No invented cloud segment | CORE_PANEL_QUALIFIED |

Meta's cash gross/net labels remain distinct; “30 native cash PP&E” does not mean 30 gross-only observations. There are no core arithmetic conflicts. All 120 quarterly recognized-AI-revenue cells remain null.

The native [2019Q4 release](https://s206.q4cdn.com/479360582/files/doc_financials/2019q4-alphabet-earnings-release.pdf) introduces granular Cloud revenue disclosure (including earlier annual comparisons). The [2020Q4 release](https://s206.q4cdn.com/479360582/files/doc_financials/2020q4-alphabet-earnings-release.pdf), published February 2, 2021, introduces separate Cloud segment operating history, including 2019Q4 and 2020 quarters. Later exact revenue comparisons support the full 2019–2026 panel; **2019Q1–Q3 Cloud operating income remains unavailable**. No annual operating loss is divided into missing quarters.

Alphabet pure PP&E depreciation increases from 14 to **15 quarterly observations**, adding directly disclosed 2022Q4 = 3,602m from the 2023Q4 comparative release. The [2023 annual report](https://s206.q4cdn.com/479360582/files/doc_financials/2023/q4/goog-10-k-2023-final.pdf), PDF page 56, separately supplies annual 2021/2022/2023 pure depreciation of 10,273 / 13,475 / 11,946m. Those three annual records live in `accounting-note-evidence.json`, outside quarterly selection and arithmetic. Mixed D&A, stock compensation and other noncash charges never substitute for pure depreciation.

### Original/recast qualification

`recast-review.json` binds reporting annotations to observation ID, native value, scope, period, original/raw source hash and a raw-qualified methodology note. It records `reportingVersion`, `reportingBasisVersion`, `originalSourceId`, `recastSourceId`, exact effective economic period, recast publication date and comparability. Reporting adoption date is distinct from the earlier periods retrospectively presented on the new basis. An original source can be null when no contemporaneous observation of that metric was disclosed; a later comparative is never falsely labeled original.

There are **16 original/recast metric-quarter pairs**: eight Microsoft IC FY2024 comparisons (four quarters × revenue/operating income) from the FY2025 releases, and eight Google Cloud 2022 comparisons from the 2023 releases. Original histories survive, while reviewed later recast vintages are selected. Pairs across reporting bases are NOT_COMPARABLE; selected segment observations remain LIMITED_COMPARABILITY and the existing growth gate rejects them. This deliberately does not fabricate a homogeneous long-run growth series.

Microsoft IC quarterly revenue changes from 24,259 / 25,880 / 26,708 / 28,515m to 20,013 / 21,525 / 22,141 / 23,785m on the FY2025 basis. The [FY2025 annual report](https://www.microsoft.com/investor/reports/ar25/index.html), Notes 1/18, explicitly describes segment realignment and prior-period recasting. Its reporting adoption is July 1, 2024; qualified comparative coverage includes FY2024, not just post-adoption observations.

Google Cloud 2022 revenue is unchanged in the paired disclosures; quarterly operating losses change from −931 / −858 / −699 / −480m to −706 / −590 / −440 / −186m. The [2023Q1 release](https://s206.q4cdn.com/479360582/files/doc_financials/2023/q1/goog-exhibit-99-1-q1-2023-19.pdf), pages 2–3, explains cost allocation and corporate reporting changes. These are presentation changes, not newly measured economic growth or AI profit.

Targeted Amazon/Meta review: **NO_MATERIAL_RECAST_FOUND for the reviewed consolidated core/AWS scope**, not “never restated.” Meta's annual report identifies an ARPP presentation change outside accepted core metrics; no new ARPP series is introduced. Meta asset-life wording requires the separate review below.

### Raw accounting notes, RPO and unresolved CapEx

New annual raw archives cover Microsoft FY2024/FY2025, Amazon FY2025, Meta FY2024 and Alphabet FY2023; a new Alphabet Q2 2026 10-Q replaces the manual RPO anchor. Twelve reviewed note/page anchors plus three annual depreciation cells and the Cloud RPO cell can be reproduced with `verify-notes.py`. Native publication/signature/filing dates remain separate. Microsoft annual report dates are explicitly the auditor-report dates: exact IR posting time is **not established**. SEC index dates for the company-hosted PDFs are separately reviewed provenance; they are not raw SEC download qualification.

Amazon's [FY2025 annual report](https://s2.q4cdn.com/299287126/files/doc_financials/2026/ar/Amazon-2025-Annual-Report.pdf), page 58, qualifies server life 5→6 years effective 2024 and subset server/network 6→5 effective 2025; finance-lease assets and cash principal remain distinct. Earlier manual policy references are preserved as audit references.

Meta's [2024Q4 release](https://s21.q4cdn.com/399680738/files/doc_financials/2024/q4/Meta-12-31-2024-Exhibit-99-1-Final.pdf) states 5.5 years; the accepted [FY2024 annual report](https://s21.q4cdn.com/399680738/files/doc_financials/2024/ar/Meta-12-31-2024-10K-ARS.pdf), page 98, states six years for certain assets, both effective FY2025. Both raw-qualified native statements are retained with **RESTATEMENT_REVIEW_REQUIRED**. No whole-fleet lifetime is inferred, no expense is overwritten, and Phase 1 conclusions remain unchanged.

Microsoft's [FY2024 annual report](https://www.microsoft.com/investor/reports/ar24/index.html), Note 1, qualifies server/network 4→6 years beginning FY2023. FY2025 Note 13 distinguishes lease assets and cash-flow classifications. The existing FY2026Q4 call describes rounded native CapEx 41bn and total finance leases 5.6bn; it does not identify the latter as principal or establish 41 = 35.802 + 5.6. The rounded sum is 41.402bn and these are different accounting concepts. **UNRECONCILED_NATIVE_CAPEX_SCOPE remains for all Microsoft quarters**; no new synthetic bridge or falsely exact native-CapEx/revenue ratio is generated. The FY2027 building-policy change stays prospective and outside this June-ending panel.

Alphabet's [2026Q2 10-Q](https://s206.q4cdn.com/479360582/files/doc_financials/2026/q2/GOOG-10-Q-Q2-2026.pdf), Note 2/page 15, qualifies Cloud backlog 513,900m. The prior manual reference survives. From Q1 2026 the definition includes contracts with original expected terms of one year or less. The 519.5bn total and just-over-50%-over-24-months recognition horizon refer to **Alphabet total backlog**, not a Cloud-only conversion schedule. This is POINT_IN_TIME, not recognized revenue, cash flow or AI revenue; cross-break growth remains unavailable. Alphabet lease context is archived separately in Notes 4/5.

### Reproduction, regression and next gate

84 accepted source identities reference **34,082,716 raw bytes**; **22 new accepted artifacts** add 12,657,052 bytes. Four additional Microsoft FY2024 reretrieval artifacts have different raw HTML bytes but analytically identical native values and remain external, unselected receipts. The physical object cache therefore has 88 objects / 36,651,432 bytes. Large raw bytes and complete generated panel bodies remain outside Git/ignored; only reviewed inputs, compact bindings, code, schemas, small controlled fixtures and the focused report are tracked.

The 1,203 pre-repair observations remain present with identical economic values. There are 236 additional accepted observations, for 1,439 total. Raw re-extraction matches **1,405 table observations**, **30 workbook observations** and separately identifies **four manual raw-bound points**. New manual RPO is independently reproduced from the native PDF; three older manual points retain their original Phase 2A status. A raw artifact's changed hash is not treated as an economic value change or silently substituted under its old identity.

Commands from repository root:

```sh
node --test research/ai-capex-monetization/tests/foundation.test.mjs research/ai-capex-monetization/quarterly/tests/*.test.mjs
$WIL_AI_CAPEX_PYTHON -m unittest discover -s research/ai-capex-monetization/quarterly/tests -p '*_test.py'
WIL_AI_CAPEX_CACHE="$HOME/Public/wil-ai-capex-cache" node research/ai-capex-monetization/quarterly/scripts/run.mjs --verify-raw
WIL_AI_CAPEX_CACHE="$HOME/Public/wil-ai-capex-cache" node research/ai-capex-monetization/quarterly/scripts/reextract.mjs
WIL_AI_CAPEX_CACHE="$HOME/Public/wil-ai-capex-cache" $WIL_AI_CAPEX_PYTHON research/ai-capex-monetization/quarterly/scripts/verify-notes.py
npm run build
npm run verify
```

**181 tests passed, 0 failed:** 48 Phase 1; 65 Phase 2A Node tests (missing-core negative case retained with an explicit controlled missing selection, rather than expecting a now-repaired gap); 19 original Python extraction tests; 40 new repair Node tests; nine new legacy-layout Python tests. Recast selection, forged metadata/raw identity, exact comparative labeling, single-quarter preference, compatible/invalid YTD subtraction, native scope breaks, missing Cloud history, annual isolation, 403/429 suppression, official-host enforcement and run-rate/no-ROI boundaries are covered. No live internet is needed for unit tests.

Three fresh processes produce byte-identical panel output; economic content and serialized output hashes are recorded in the repair report. Build and full verify pass; the existing large-chunk warning is unchanged. Production paths and the frozen Phase 1 inputs are byte-for-byte unchanged relative to the requested base. Restricted/new research markers are absent from `dist/`. No public UI, email, workflow or schedule is activated.

Remaining HIGH: **none identified within this source/accounting repair scope**. Remaining MEDIUM: Microsoft native CapEx scope; Meta conflicting asset-life wording; incomplete pure-depreciation/lease/additions/commitment and historical RPO disclosure; unrecovered early Cloud operating income; non-exhaustive original/recast history; fragile IR presentation/blocked SEC access. These do not become qualified values merely because core coverage is complete. Next: independent review of repaired descriptive evidence and controlled monitor design; any activation or public publication requires separate approval. AI ROI/ROIC/payback remains out of scope and unsupported.
