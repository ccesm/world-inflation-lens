# AI Infrastructure & Financing — Phase 3A foundation

Research qualification date: 2026-10-07. This is an offline research registry, not a public product, a forecast, or a credit-risk assessment.

## Lineage and isolation

Verified latest qualified AI CapEx research lineage: `codex/ai-capex-operator-refresh`, `d7666b129eb834cfd70fdcc204b930f5bd67ba7e`. Its operator qualification report records readiness and the completed manual registration pilot. New branch: `codex/ai-infrastructure-financing-foundation`. Production observed separately: `be9dde341cfb32a53b7a3fca76e04d631a926bcd`, v1.3.0. The research lineage retains its older application version; it is deliberately not synchronized with production application history.

Only this document, the two companion documents and `research/ai-infrastructure-financing/` are added. No import into `src/` or `public/`; no changes to existing research, economic snapshots, operator workflow, Pages, email, Signal Engine, AI Labor or application version. Never merge this full research lineage into main.

## Objective and five separated layers

| Layer | Question | Record location | Examples |
|---|---|---|---|
| A Physical | What exists or is planned? | projects, power | Campus, data center, GPU cluster, servers, network, land/building, substation, transmission, generation, batteries, backup power |
| B Accounting | What is recognized or disclosed, by which reporting entity? | accounting-bridges | Cash PP&E, capitalized assets, equity-method investment, finance/operating lease ROU assets, liabilities, commitments, guarantees |
| C Financing | Who supplies capital and what claim do they hold? | financing, ownership | Sponsor/hyperscaler/developer/fund equity, corporate/project/bank debt, private credit, ABS, vendor/lease financing |
| D Obligation | Who owes what under which conditions? | obligations | Minimum rent, capacity payment, take-or-pay, construction funding, purchase obligation, RVG, PPA, credit support |
| E Economic support | What attributable demand or cash flow is observable? | project monetization observation references | Revenue, run-rate, seats, utilization, backlog/RPO, operating income/CFO |

A physical asset is not an accounting expense or a financing instrument. Legal asset ownership differs from equity ownership, developer role, tenancy and economic use. A financing amount is not necessarily a cost. A commitment is not necessarily a current liability or a future certain cash payment. Economic support is not a project return.

## Machine-readable contract

The canonical small input files live under `research/ai-infrastructure-financing/data/`. `schemas/records.schema.json` defines strict records; each collection has a draft-2020-12 wrapper. Separate lease, guarantee and commitment schemas validate filtered views of the single obligations registry, avoiding duplicate instrument records.

| Contract | Required structure |
|---|---|
| Project | Stable project/asset identity, location, status, native physical types, owner/user/developer references, separate capacity/cost observations, financing/obligation/power/accounting/monetization references, missing fields and boundary notes |
| Entity | Stable ID, entity type, display name, nullable legal name, identity qualification; fund-group placeholders are not legal persons |
| Observation | Nullable value, native unit/currency, classification, native scope, period, capacity definition, precision/comparison operator, source-claim evidence and missingness reason |
| Financing | Instrument identity, type, issuer/funder/recipient references, amount observation, commitment/funding/maturity dates, interest rate, collateral/security, recourse status and evidence |
| Ownership | Owner and investee, percentage observation, ownership basis, dated ownership group, complete/partial coverage and excess explanation |
| Obligation | Obligation identity, obligor/beneficiary, type, amount observation, recognition, commencement, lease term/options, guarantee duration/trigger and conditional-payment flag |
| Power | Utility, grid qualification, interconnection, resource type, native capacity, contract value/duration, energization and project status |
| Source | Publisher, title, official URL, publication date, locator, retrieval date/method, evidence class and explicit raw-archive status |
| Claim | Source assertion with stable ID, subject, predicate, object; quantities retain value/unit/classification/definition |
| Relationship | Typed directed endpoints with an exact supporting source assertion; co-mention never creates an edge |
| Accounting bridge | Reporting entity, observation period, recognition/location, source observation, version link, overlap warning; issuer-reported aggregates explicitly identified |

Relationship types are `OWNS`, `PARTIALLY_OWNS`, `LEASES`, `OPERATES`, `DEVELOPS`, `FINANCES`, `LENDS_TO`, `GUARANTEES`, `SUPPLIES_POWER_TO`, `PURCHASES_CAPACITY_FROM`, `BUYS_EQUIPMENT_FROM`. An evidenced umbrella JV ownership edge does not identify the property-title subsidiary. `OPERATES` can describe property management, explicitly limited in its scope; it does not certify an operating compute cluster.

All monetary/capacity facts are referenced observations, not anonymous numbers. USD amounts retain native billion/trillion/million-per-MW units; there is no FX conversion in Phase 3A. A future non-USD observation requires a separately qualified currency/unit extension; conversion must retain native amount/currency plus FX source/date and converted amount. No automatic currency or capacity harmonization is implemented.

Project statuses: `ANNOUNCED`, `PLANNED`, `PERMITTED`, `UNDER_CONSTRUCTION`, `PARTIALLY_OPERATIONAL`, `OPERATIONAL`, `DELAYED`, `CANCELLED`, `UNKNOWN`. Operational status requires an operational date. Unknown capacity basis remains `UNKNOWN`, even when a number is disclosed. Planned campus compute GW and planned utility generation MW are distinct.

## Leases, guarantees, commitments and power

Recognized operating/finance lease liabilities and ROU assets must be separated from not-yet-commenced leases. Initial lease terms and optional maximum terms are different; renewal options are not treated as irrevocable payments. The schema can represent future leases, but no generic “off-balance-sheet debt” conversion exists.

Guarantees distinguish parent, residual-value, minimum-revenue, debt, completion and other credit support. Store guarantor, beneficiary, cap/threshold, duration, trigger and recognition; a cap or threshold is not expected loss. Hyperion's RVG is conditional, so the validator rejects a fixed-payment interpretation.

Commitments distinguish GPU/server/equipment purchase, cloud/data-center/power capacity, take-or-pay, construction funding and PPA/power service. Keep aggregate project development commitments separate from each sponsor's funding schedule. Never infer a missing remaining funding amount by subtracting other disclosures from a maximum-exposure figure.

The power model covers interconnection, substation/transmission, generation mix, battery/backup assets, PPA/service obligations and expected energization. Utility-system assets need their own asset boundary before any project allocation. Region, prices, contract values and firm energization remain unqualified where documents do not establish them. No electricity-price, natural-gas or inflation model is added.

## Evidence and source discipline

Evidence classes: `PRIMARY_ACCOUNTING`, `PRIMARY_TRANSACTION`, `PRIMARY_PROJECT`, `PRIMARY_REGULATORY`, `SECONDARY_RESEARCH`, `SECONDARY_MEDIA`, `MODEL_ESTIMATE`.

Observation classes: `OBSERVED_REPORTED`, `MANAGEMENT_GUIDANCE`, `CONTRACTUAL_COMMITMENT`, `TRANSACTION_VALUE`, `PROJECT_ESTIMATE`, `SECONDARY_ESTIMATE`, `MODEL_DERIVED`, `UNAVAILABLE`.

These axes are independent. A company can publish a project estimate: the source is primary, the value is still estimated. Brookings is secondary research; its scenarios do not populate company accounting facts. A utility announcement about a regulator's decision is primary project evidence, not the regulatory order itself. A rating agency's discussion is secondary for borrower legal terms, even though its rating is its own institutional analysis.

Source assertions were manually reviewed against accessible documents. The validator checks citation identity, classification and graph consistency; it does not independently establish legal truth or interpret a contract. The source registry records public-web review, not direct pipeline fetch qualification. Raw hashes are null and `NOT_ARCHIVED`; no raw identity is invented. URLs, locators, dates, pinned assertions and the content hash make the normalized study reproducible; immutable raw-source hydration is a Phase 3B task.

## Temporal changes and native precision

Keep `announcedAt`, `effectiveAt`, `reportedAt`, `retrievedAt`, `periodStart`, `periodEnd`, `maturityDate`, `expectedOperationalDate` separately. A year-only opening expectation stays a year, not an invented January 1 date. Retrieval is a date-only web-review timestamp, with no false time precision.

Each longitudinal record has revision, previousVersion and changeType. Original terms and later period updates are separate records. Supported future changes include amendment, refinancing, ownership change, lease commencement, capacity expansion, cancellation and restatement. The initial data preserve year-end 2025 and June 2026 equity/exposure bridges. Do not sum stocks from successive periods. No actual amendment/refinancing is asserted in this phase.

## Double-count controls

Keep `assetIdentity`, `financingIdentity`, `obligationIdentity`, `possibleOverlapWith` and `overlapStatus`. States: `NO_KNOWN_OVERLAP`, `POSSIBLE_OVERLAP`, `KNOWN_OVERLAP`, `SAME_ASSET_DIFFERENT_LAYER`, `UNRESOLVED`.

The validator rejects duplicate IDs/instruments, duplicate physical-project identities, unsupported source/graph references, invalid ownership, mismatched units, undocumented capacity bases, estimate promotion and unacknowledged same-asset financing/obligation overlaps. It emits a **DO_NOT_ADD** warning group, not an investment aggregate.

All initial Hyperion layer records use a campus overlap umbrella. That is a conservative warning, not proof that every amount covers the exact same asset set. Later expansion versus original financing is unresolved. An issuer's own maximum VIE exposure can be recorded verbatim as a disclosure; it cannot become our aggregate investment or leverage measure, and its included components cannot be added again.

## Corporate accounting bridge and future candidate/source plan

No numeric company-wide financing reconciliation is attempted. Existing CapEx research remains the canonical source for company-convention measures; this study links conceptually without copying or changing that panel.

| Company | Corporate CapEx/leases/commitments | Project/JV/debt/guarantees | Monetization boundary | First candidate research plan |
|---|---|---|---|---|
| Microsoft | Existing cash PP&E versus native lease-inclusive CapEx scope retained; financing inventories not extracted here | UNAVAILABLE until project/lease/debt matching | Run-rate is not recognized revenue or project cash flow | Owned versus leased campus; official IR workbook and 10-K lease/purchase notes, then developer/title and utility records |
| Alphabet | Existing cash PP&E retained; lease and purchase schedules require separate extraction | UNAVAILABLE | Cloud is not AI-only revenue | Owned campus and power procurement; issuer filings, official project releases and utility/regulatory documents |
| Amazon | Gross/net cash PP&E and leases remain separate | UNAVAILABLE | AWS/run-rate remains distinct from recognized AI revenue | Developer-owned/leased campus; official filings, lessor financing and power records |
| Meta | Existing FCF/CapEx convention unchanged | Hyperion case only; other projects UNAVAILABLE | Ads/recommendation attribution is not project revenue | Hyperion subsidiary/title and financing package first; separate El Paso JV source plan, not mixed into Louisiana |
| Oracle | No harmonized bridge or numeric data imported | UNAVAILABLE | Not in the accepted four-company CapEx panel | Leased/developer-financed campus and compute commitments; Oracle filings plus counterparty documents |

Candidate categories are owned, leased, JV, developer-financed, GPU/compute financing and power-generation projects. They are research plans, not five fully verified projects. For each require official project identity, title/owner evidence, terms, source hash, date, scope and overlap review before registry admission. No candidate automatically enters the accepted case study.

## Connection to monetization and boundary of conclusions

Corporate CapEx, externally supplied capacity and contractual commitments are related inputs, **not an additive formula**. They may support compute capacity, services/products, revenue and operating cash flow. The final cash-flow-to-return link requires project-attributable invested capital, asset scope, utilization, timing, operating costs and risk allocation. Those inputs are unavailable here.

No AI ROI/ROIC/IRR/NPV/payback, project AI FCF, adjusted leverage, aggregate investment, ranking or systemic-risk score exists. This foundation cannot conclude “bubble,” “safe financing” or a measured AI return. Brookings motivates questions about exposure visibility; it does not settle these conclusions.

## Qualification and Phase 3B

Run the offline commands in the research README. Tests use the small pinned registry and adversarial mutations, not live internet. Fresh-process summaries are byte-identical. Build/verify apply to this inherited research tree; production protection is independently checked by a zero diff of protected paths and the unchanged production ref/snapshot.

Recommended Phase 3B: **primary transaction-document and power-contract hydration**, followed by two additional independently scoped cases. Obtain Hyperion offering/security terms, exact subsidiary/title chain, regulatory orders and power agreements; archive reviewed bytes externally with content hashes, add field-level locators and qualification. Reconcile expanded versus original asset scope before any broader financing comparison. No public release or automatic update is authorized.
