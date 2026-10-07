# AI CapEx & Monetization Monitor — Phase 2B

Research only. No publication, deployment, scheduled refresh, email or investment recommendation is authorized by this qualification.

## Frozen inputs and interpretation boundary

Base: `ad6ebf96e2bf59145f31120dd02cdcc3fbca24b7`, branch `codex/ai-capex-source-accounting-repair`. Delivery branch: `codex/ai-capex-descriptive-monitor`.

The accepted Phase 1 / 2A / 2A.1 inputs cover **2019Q1–2026Q2**, four companies and 30 calendar quarters each. All four retain `CORE_PANEL_QUALIFIED`. The monitor does not change those inputs, selection manifests, accounting definitions, source qualifications or accepted conclusions. It reuses the existing panel builder, duration reconstruction and cash-flow calculations.

This is a **frozen current-vintage reconstruction**. Later-published comparative values and reviewed accounting notes can inform earlier quarters. It is not a real-time historical backtest, live disclosure service or publisher-vintage replay. Public-draft `asOf` is the latest accepted disclosure date, **2026-07-30**, not historical availability or the processing date. The draft explicitly records this basis. Source publication and retrieval dates, economic periods and separate runtime evaluation timestamps remain distinct.

The requested base contains application version 1.1.0; current production main has 1.2.0. Neither version nor production implementation is edited. Starting from the requested research base does not rebase or replace production.

## Architecture

`research/ai-capex-monetization/monitor/` contains frozen rules, pure metric/comparison functions, lineage resolution, independent evidence health, deterministic bilingual summaries, public-draft projection, draft schemas, tests and a local research runner.

Five analytical layers remain independent:

1. Investment intensity.
2. Monetization evidence.
3. Operating economics.
4. Accounting / depreciation pressure.
5. Cash conversion.

Cloud observations and sparse AI events inform the monetization layer but remain separate data kinds. No layer average, overall state, company grade, ranking, composite score, return estimate or probability exists.

The default runner requires the full accepted input identity and exact panel hash. It rejects changed event values, amended input identities and silent study-window extensions. The `pin:false` library option exists only for controlled fixture work; the CLI and public semantic validator always enforce the pin. Future refreshes require separately qualified inputs and explicit boundary/version review, rather than bypassing this gate.

## Metrics and exact comparisons

Each metric has company, calendar/fiscal quarter, native label/scope, definition version, unit, precision, evidence class, sources, raw source hashes, publication/retrieval dates, operand references/formula and limitations. The 23-metric grid has 2,760 cells; 1,780 are available and 980 remain missing.

| Family | Implemented observations / derived metrics |
|---|---|
| Investment | Selected native cash PP&E, native CapEx, cash PP&E/revenue, cash PP&E/CFO, compatible native CapEx/revenue, exact YoY cash investment/native CapEx changes |
| Cash | CFO, reconstructed quarterly company-convention FCF, FCF margin, exact FCF amount change; percentage growth only with a positive prior denominator |
| Operating | Revenue and growth, operating income, operating margin, native gross margin |
| Accounting | Pure PP&E depreciation, broader D&A/other separately, their separate revenue ratios, compatible cash PP&E/pure depreciation, policy timeline |
| Cloud | Native segment revenue, operating income/margin, compatible growth; separately disclosed Microsoft Cloud and Azure fields where available |
| AI recognition | All 120 recognized AI revenue cells remain unavailable |

Latest quarter is **2026Q2**. Prior-quarter and YoY comparisons use exact calendar-quarter matches, never nearest available observations. Baselines are **2019Q1** and **2022Q4**. Reference dates at/after the evaluated quarter yield unavailable comparisons. Missing or ineligible operands remain null.

`RISING`, `FALLING` and `STABLE` mean only the exact sign of a valid numerical difference. There is no invented materiality threshold. Percentage ratios change in **percentage points**; money levels change in USD millions, with percentage growth separately available only when the prior value is positive. Negative prior FCF does not generate misleading percentage growth.

A derived metric's stable ID is insufficient proof of comparability. Comparison signatures recursively include operand definitions, scopes and units. Definition changes produce `DEFINITION_BREAK`; limited/noncomparable leaves or policy-regime changes produce `LIMITED_COMPARABILITY`, with null changes. A same-policy-regime depreciation comparison can be calculated; the policy context remains attached. Unresolved Meta life-wording conflict prevents unqualified depreciation comparisons.

Reading windows are full history, 2019Q1–2022Q4 context, and 2023Q1–2026Q2 infrastructure context. The `windowView` API preserves missing cells and accounting context. These are reading periods, not treatment assignment or causal identification.

## Company-native accounting boundaries

| Company | Cash / investment convention | Preserved limitation |
|---|---|---|
| Microsoft | Gross cash PP&E; quarterly FCF = CFO − cash PP&E. Rounded native CapEx from the separate official workbook remains separate. | `UNRECONCILED_NATIVE_CAPEX_SCOPE`. Native CapEx/revenue is unavailable; no false exact ratio across rounded/different-vintage sources. Intelligent Cloud is not Azure or AI-only. |
| Alphabet | Cash PP&E; quarterly FCF = CFO − cash PP&E. | Pure quarterly depreciation begins 2022Q4; earlier annual disclosures are not quarterized. Cloud recasts retain limited comparison status. Cloud RPO includes short-term contracts from 2026Q1. |
| Amazon | Net cash PP&E = gross purchases − proceeds/incentives; quarterly FCF = CFO − net PP&E. | Gross/net, finance leases and operating leases are distinct. Native cost of sales excludes separately classified expenses and does not create a harmonized gross margin. |
| Meta | Selected native gross/net cash PP&E; FCF subtracts cash PP&E and finance-lease principal. Native CapEx adds that principal. | Gross/net definition transitions remain visible. 5.5-year release versus six-year annual useful-life wording remains unresolved. No artificial cloud/AI segment. |

FCF is a quarterly reconstruction using the accepted company convention, not a claim that an issuer's trailing-year reported FCF is a quarterly disclosure. Cash PP&E/CFO is an investment burden ratio, not attributable AI cash return. Broad D&A is never a substitute for pure PP&E depreciation. Cash PP&E/pure depreciation is permitted only with compatible quarter, units, consolidated scope, precise operands and accepted vintage basis; it is a flow/expense ratio, not a capital stock return. Lease-inclusive CapEx is not forced onto that ratio.

## Qualified 2026Q2 observations

Amounts are USD **billions** here for readability; output amounts remain USD millions. Ratios are percent. Companies remain in fixed source order, not sorted by investment quality.

| Company | Native cash PP&E | CFO | Convention FCF | Cash PP&E/revenue | Cash PP&E/CFO | FCF margin | Operating margin |
|---|---:|---:|---:|---:|---:|---:|---:|
| Microsoft | 35.802 | 55.441 | 19.639 | 39.78 | 64.58 | 21.82 | 45.11 |
| Alphabet | 44.924 | 39.069 | −5.855 | 37.50 | 114.99 | −4.89 | 34.03 |
| Amazon | 53.076 net | 45.387 | −7.689 | 26.46 | 116.94 | −3.83 | 13.69 |
| Meta | 30.116 | 31.862 | 0.784 | 49.53 | 94.52 | 1.29 | 30.88 |

Source IDs: `msft-fy2026q4-ir`, `goog-2026q2-pdf`, `amzn-2026q2-pdf`, `meta-2026q2-pdf`; qualified URLs/hashes and the actual operand lineages are exported with every metric. These are company-wide cash/accounting results, not AI allocations.

## Descriptive research conclusions

**Investment relative to own history.** Against compatible 2019Q1 references, cash PP&E/revenue changes are Microsoft +31.39 pp, Alphabet +24.74 pp, Amazon +21.90 pp. Microsoft has the largest numerical rise among those eligible three comparisons. Meta's 2019/2022 comparison is blocked by its native gross/net definition change; no four-company league table is justified. Against 2022Q4, eligible changes are Microsoft +27.88 pp, Alphabet +27.51 pp and Amazon +16.11 pp. Current YoY cash investment rises 109.63%, 100.14%, 69.20% and 82.10%, respectively; this is not a ranking of AI investment quality.

**Cash conversion.** All four current FCF margins fall versus 2025Q2: −11.63 pp, −10.38 pp, −4.52 pp and −16.70 pp respectively. Meta has the largest numerical YoY compression in that compatible window. Against 2022Q4, Alphabet has the largest eligible endpoint compression (−25.95 pp), Amazon falls −13.04 pp, and Microsoft increases +12.53 pp. Meta's cross-definition endpoint difference is unavailable. These are explicitly selected endpoint comparisons, not a claim about the largest intra-period drawdown. Working capital, tax timing, acquisitions, compensation and non-AI spending can contribute; negative FCF is not failed AI investment.

**Operating economics.** Current consolidated operating-margin YoY changes are Microsoft +0.21 pp, Alphabet +1.60 pp, Amazon +2.26 pp, Meta −12.14 pp. No company-level movement is attributed to AI. Qualified same-quarter cloud margins are Intelligent Cloud 40.59%, Google Cloud 35.59% and AWS 39.36%. AWS revenue rises 36.79% YoY and its margin rises 6.45 pp. Microsoft/Alphabet automated segment growth and margin-direction comparisons are blocked by the accepted limited/recast flags; their levels remain visible. Meta has no cloud comparison.

**Depreciation.** Alphabet pure PP&E depreciation is $7.104bn, +42.14% YoY; its revenue ratio is 5.93%, up 0.75 pp. Its cash PP&E/pure depreciation is 6.32x. The 2023 life-policy change qualifies comparisons to 2022Q4. Microsoft/Amazon/Meta pure PP&E quarterly ratios are unavailable; broader D&A/other revenue ratios are separately 12.25%, 9.96% and 10.45%. Microsoft broad ratio rises 0.06 pp YoY; Amazon rises 0.88 pp. Meta's comparative depreciation interpretation remains limited by conflicting useful-life wording. No arbitrary threshold is used to call a change “material.”

**Direct AI evidence.** Microsoft and Amazon have the two qualified direct AI financial milestones: **>$37bn** annualized run-rate in 2026Q1 and **>$25bn** in 2026Q2. Different scope, disclosure date and management-defined rate make an economic ranking inappropriate. Microsoft also discloses >30 million paid Copilot seats. No seats×price calculation or run-rate÷4 conversion is made. These are not recognized quarterly AI revenue or AI capital returns.

**Indirect evidence.** Cloud segment accounting is Level 3 context, not an AI revenue decomposition. Alphabet attributes part of Cloud growth to AI; Meta attributes core-business/product benefits to AI. The accepted generic attribution events remain Level 5. The conceptual Level 4 core-business layer is described, but no newly invented quantified advertising/recommendation metric or automatic promotion of the frozen Meta event is introduced.

**Capacity and backlog.** Microsoft's July 29 management disclosure says demand exceeds available infrastructure supply. This is consistent with its stated constraint at that disclosure, not an independently measured shortage or a claim about conditions in October. Microsoft commercial RPO is about $678bn; Google Cloud RPO is about $513.9bn. Backlog is not revenue, cash flow, AI revenue or guaranteed demand. Alphabet's just-over-50%-within-24-months horizon applies to total Alphabet backlog, not exclusively Google Cloud. No cross-break RPO growth is manufactured.

**What remains unidentifiable.** Recognized AI revenue (120 cells), AI-specific invested capital, attributable AI cash flow, capital returns, ROI/ROIC/IRR/NPV/payback and AI revenue share remain unavailable. Robust findings concern exact consolidated/native accounting arithmetic. Run-rates, product usage, causal business benefits and supply constraints retain management-attribution status.

## Evidence ladder, event timeline and dates

1. Direct disclosed AI financial metric (annualized run-rate remains `RUN_RATE`).
2. Product-specific monetization (paid seats remain counts).
3. Native cloud segment context with AI contribution; never assumed all AI.
4. Core-business AI benefit attribution where specifically qualified.
5. Qualitative statements, never converted into dollars.

Eleven sparse accepted business events are exported with company, event/publication date, quarter-context reference date, reference-date basis, event type, evidence class/level, value/unit/precision, scope, source ID/URL/hash and limitations. Seven accounting-policy events have separate effective and publication dates. Microsoft's July 1, 2026 building-life policy is future to the study boundary and never applied to earlier depreciation.

The Alphabet RPO base event retains an inherited Phase 1 `sourceQualificationLevel` and obsolete raw-unqualified limitation alongside repaired raw-qualified proof. The monitor independently verifies its current raw hash, URL and publication date and exposes the effective raw qualification **with an explicit legacy-field clarification**. Original frozen evidence remains unchanged and traceable; this is not a silent rewrite of the ledger.

Latest financial filing, latest economic quarter, latest monetization disclosure, latest direct AI financial disclosure, latest guidance, backlog and capacity dates are stored independently. For Microsoft, the latest financial quarter is 2026Q2 while the direct AI rate refers to 2026Q1. Sparse milestones are not filled into other quarters.

Guidance remains separate: Microsoft's approximately $175bn calendar-2026 expectation and Meta's $130–145bn range. No midpoint becomes an observation. Microsoft's lease-classification warning accompanies the guidance.

## Comparison and chart contract

Conceptually comparable consolidated ratios may be shown in fixed company order with native gross/net and lease notes: revenue growth, operating margin, FCF margin, cash PP&E/revenue and cash PP&E/CFO. These remain descriptive and not perfectly harmonized economic-return measures.

Absolute native CapEx, lease-inclusive measures, depreciation definitions, cloud margins, RPO, run-rates and native gross margins are not forced into an unqualified comparison or ranking. No hyperscaler total is calculated.

Nine deferred chart contracts cover investment/revenue, investment/CFO, FCF margin, operating margin, compatible cloud growth, cloud margin, pure depreciation/revenue, AI milestones and RPO/capacity. Charts consume native quarterly records or sparse events; absent/noncomparable series are omitted or visibly gapped. Broader D&A must be a separately labeled optional view. Guidance uses a distinct semantic layer and never connects to realized lines. No React/chart implementation is added.

## Health, generation and storage

Independent family fields cover investment, cash, cloud, direct AI monetization, depreciation, backlog and return identifiability. Core investment/cash evidence is `CURRENT` **within the frozen qualified panel**, not a live freshness claim. AI run-rate evidence is `PARTIAL`; Alphabet backlog has a definition break; Meta cloud and every AI-return field are unavailable. Pure-depreciation historical coverage is partial for Alphabet and unavailable for the other three; broad D&A has its own native limitations.

The health helper supports `CURRENT`, `PARTIAL`, `NO_NEW_DISCLOSURE`, `DEFINITION_BREAK`, `LIMITED_COMPARABILITY`, `FAILED_WITH_LAST_VALID`, `ACCESS_BLOCKED` and `UNAVAILABLE`. There are no new source fetches in this phase. Access failures cannot produce fabricated observations. A validated old output is explicitly last-valid, not current.

The local runner builds and semantically validates both artifacts before publication. Full normalized metrics, latest-company details, separate monetization/accounting/capacity/guidance outputs, health, comparability, chart contract, summary, public draft and manifest live in ignored `monitor/outputs/<generationId>/`. A temporary generation directory is atomically renamed, then a small current pointer is updated. Existing generation content is checked before reuse and never silently overwritten. Corrupt previous content cannot qualify as last-valid. A failure leaves the current pointer untouched and writes a separate runtime failure status. Repeated identical economic input hashes produce `NO_NEW_DISCLOSURE`; an execution timestamp does not create new economic evidence.

Manifest identity includes accepted input hash, each of ten raw JSON input-file hashes, panel hash, config hash, implementation hash, draft-schema hashes, result hash and public-projection hash. Parsed analytical identity and original source-byte identity remain distinct. Changed raw JSON serialization can change manifest/generation identity even if the parsed economic calculation remains equivalent.

No raw objects are added or modified. Existing `WIL_AI_CAPEX_CACHE` remains the external source store. Full generated exports are ignored; Git retains code/contracts/tests/docs, compact latest numerical summaries, a manifest and qualification report. Generated history in this local ignored directory is not claimed to be a separately qualified durable remote store. Future public integration/storage and refresh scheduling require separate approval.

## Future public snapshot (not published)

The whitelist projection contains versions and content hashes, disclosure-as-of basis, quarter boundary, native metric catalog with EN/ZH labels, company metrics/sources/comparability, sparse events, family health and five separate bilingual summary layers. It excludes local cache paths, filesystem identity, private diagnostics and credentials. It is not copied into `src`, `public` or `dist`.

Draft structural schemas are checked by a dependency-free, deliberately bounded JSON Schema subset (types, required/properties, additionalProperties, const/enum, patterns, array bounds/items). Full provenance/semantic validation independently rebuilds the monitor and public projection from the pinned accepted archive; a self-consistent forged result hash is insufficient. This draft validator is not represented as a general-purpose implementation of every JSON Schema keyword. A future UI must visibly carry limitations and date semantics; qualifying this draft does not authorize publication.

## Qualification and remaining limits

- Existing regression: 153 Node and 28 Python cases pass.
- Phase 2B: 73 Node cases pass; total **254 passed, zero failed/deferred**.
- Independent arithmetic tests pin native source values; wrong units/scope/vintage, incomplete lineage, definition breaks and missing denominators are rejected.
- Eleven individual public-field mutation probes plus null-to-zero and monitor mutations fail semantic validation.
- Three fresh processes generate byte-identical deterministic monitor content; bilingual/public projection rebuild is deterministic.
- Failure injection, duplicate evaluation, corrupt generation and last-valid fallback are exercised without live network.
- `npm run build` and `npm run verify` pass. Existing Vite large-chunk warning remains unchanged; this research layer adds no production bundle.
- Production source/routes/workflows/email/snapshots/Signal Engine and all accepted CapEx Phase 1–2A.1 files remain unchanged. No research marker/hash appears in the production build.

Remaining HIGH implementation issues: none found in these checks. Existing research constraints remain: Microsoft native CapEx scope reconciliation; Meta useful-life conflict and gross/net transitions; incomplete pure depreciation; limited recast cloud comparisons; unrecognized/management-defined AI monetization and no attributable AI capital denominator. These block individual claims, not the conservative research monitor.

Next task: separately review the compact public presentation and accepted research-input reconciliation with current main. Do not broaden the study window, hide missing metrics or publish return interpretations as part of that step.

**READY FOR PUBLIC AI CAPEX MONETIZATION INTEGRATION**
