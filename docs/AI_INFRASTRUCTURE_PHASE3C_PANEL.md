# AI Infrastructure & Financing — Phase 3C research panel

The panel records what primary disclosures establish about specific assets and their users, entities, financing, accounting and obligations. It does not estimate total AI investment, returns, hidden debt or credit risk. This is a research delivery on the Phase 3B lineage; it is not a production release or approval to publish.

Base: `codex/ai-infrastructure-financing-phase3b` at `940be50f61a1516482da936a38f10a62cf262b5a`. The Phase 3A and 3B registries, documents, source identities and case conclusions remain unchanged. Phase 3C uses an additive migration in `panel/scripts/panel.mjs`; `panel/migration-map.json` resolves original claim IDs to panel observations. The app version, public CapEx snapshot, refresh control plane, AI Labor, Signal Engine, Pages and email are untouched.

## Grain and layers

The observation key is `projectId × entityId × layer × metricId × definitionId × scopeId × sourceVintage × period`. It is deliberately not company × quarter. Multiple entities, scopes, definitions and vintages can coexist for one site. One claim produces one observation; a source-vintage identity can represent several supporting documents. Duplicate IDs and duplicate fundamental keys are rejected.

The six layers are `PHYSICAL_ASSET`, `ACCOUNTING_EXPOSURE`, `FINANCING_EXPOSURE`, `ECONOMIC_OBLIGATION`, `POWER_INFRASTRUCTURE` and `MONETIZATION_EVIDENCE`. Native values live in observations; instrument, obligation and power registries link their field claims rather than duplicating amounts. Instrument records include identities, issuer/provider links and explicit unavailable maturity, coupon, security and recourse. A corporate funding pledge record is not proof of a bond or funded project loan.

Schema files constrain projects, entities, relationships, claims, sources, scopes, financing, obligations, power and observations. Semantic validation additionally checks references, percentages, units/currency, sources, classification, temporal consistency, physical/instrument duplication and prohibited derived metrics. Named umbrella entities and unknown reporting-entity placeholders are distinct from verified legal owners. A fund manager is not substituted for the funds it manages.

## Universe and project admission

The core company universe is fixed: MSFT, GOOG, AMZN, META, ORCL. Admission requires a distinct site, a company relationship, at least one qualified primary source, location, a status record (including explicit UNKNOWN), a material infrastructure attribute, scope and field-level provenance. Admission qualifies the project identity for research; it does not qualify every financial or legal field.

| Company | Admitted projects | Candidate projects | Main evidence boundary |
|---|---|---|---|
| Microsoft | Fairwater 1; Quincy | None in this bounded screen | Corporate development is documented; exact legal title and project PP&E remain unavailable/partial. |
| Alphabet | Midlothian; Red Oak | Haskell | Officially named, separate sites; precise operating stage, capacity, power and financing not qualified. |
| Amazon | Canton; Warren County | Ridgeland | Native site evidence; statewide multi-campus investment is not allocated to either campus. |
| Meta | Hyperion; El Paso | None in this bounded screen | Hyperion original JV, campus expansion, utility and corporate accounting scopes remain separate. El Paso JV terms were proposed at disclosure, not confirmed closed. |
| Oracle | Abilene; Jupiter / Doña Ana County | Shackelford County | Developer and planned power evidence; detailed title, lease, accounting and debt terms remain gaps. |

Polaris Forge 1 / CoreWeave is the eleventh project and a comparative reference case, not a sixth core company or an Oracle project. The Texas-wide Google investment program is rejected as a single-asset observation. This is curated, non-exhaustive coverage, not a census or a nationally representative sample.

Primary additions include [Microsoft's Quincy infrastructure discussion](https://blogs.microsoft.com/on-the-issues/2026/01/13/community-first-ai-infrastructure/), [Google's Texas location registry](https://www.datacenters.google/locations/texas/), [Amazon's Warren County announcement](https://www.aboutamazon.com/news/company-news/amazon-3-billion-mississippi-data-center-investment), [Amazon's Mississippi update naming Canton](https://www.aboutamazon.com/news/company-news/amazon-25-billion-mississippi-data-centers), [Meta's proposed El Paso venture](https://about.fb.com/news/2026/07/meta-announces-new-venture-with-blackrock-to-develop-data-center-in-el-paso/), [Crusoe's Abilene JV announcement](https://www.crusoe.ai/resources/newsroom/crusoe-blue-owl-capital-and-primary-digital-infrastructure-enter-joint-venture), and [Oracle's project tracker](https://www.oracle.com/data-centers/). Exact locators, retrieval receipts, hashes and native definitions are retained in the research files. An HTTP challenge response from Madison County and a blocked Newmark transaction page are not accepted evidence; no loan amount from a search snippet enters the panel.

## Native capacity, cost and financial definitions

Capacity stores the reported unit and native definition: planned campus scalability, compute capacity, contracted critical IT load, utility generation or UNKNOWN. There is no automatic MW/GW conversion or normalization. Hyperion's secondary 2.064 GW financing description and primary 5 GW scalability plan are not comparable. El Paso's future 1 GW compute plan is not an operational IT-load observation. Utility generation is not data-center demand. Oracle's delivered percentage is not multiplied by nominal campus capacity.

Cost retains development estimates, regional investment plans, corporate funding pledges, equity contributions and transaction values as separate metrics. Hyperion's approximately $27 billion original development estimate and later >$50 billion Louisiana plan are not a growth series. Google's $40 billion Texas program and Amazon's statewide programs are not assigned to individual sites. Accounting depreciation, PP&E, equity-method investments and maximum exposure are not harmonized with project financing or lease cash payments.

Recognized project AI-only revenue, attributable operating cash flow and returns remain unavailable. Cloud or company revenue is not allocated to projects. There is no ROI, leverage, systemic-risk or investment-quality calculation.

## Source vintage and knowledge clock

Builds require an explicit `--as-of YYYY-MM-DD`; tests never use system today. Sources retain document date, immutable source version/hash, effective period and retrieval receipt separately. Claim periods retain exact source dates, month intervals, native year precision or null when undisclosed. No processing date manufactures an observation, announcement or opening date. Undated status sources have null `reportedAt` and a separate `availableFrom`.

Existing dated Phase 3B disclosures support **reconstructed disclosure snapshots**, not publisher-vintage real-time replay. Newly fetched HTML may have changed since original publication, so its availability begins at the first reviewed byte vintage, 2026-10-07. Modified and undated pages are not projected backward. The Oracle tracker has a January footer despite later construction/delivery updates; its delivery assertion remains partial/review-required. This conservative boundary sacrifices retrospective coverage rather than asserting unavailable historical page bytes.

Sources or claims unavailable as of a snapshot are excluded, including their project, relationship, scope and candidate coverage when admission cannot yet pass. Future planned openings are allowed only as labeled guidance/commitments; future observed operating or accounting values are rejected.

## History and change handling

Status history retains ANNOUNCED, PLANNED, PERMITTED, UNDER_CONSTRUCTION, PARTIALLY_OPERATIONAL, OPERATIONAL, DELAYED, CANCELLED and UNKNOWN. Dates and scopes remain explicit; source-dated stages are not synchronized current full-campus assessments. New same-scope status records supersede older status entries without removing their values. A later partial or unarchived observation does not become a qualified operational milestone.

Hyperion retains original construction and later source status. Fairwater retains construction plus the inherited partial-operation record and open completion-milestone conflict. Polaris retains construction, the June 2026 partial-operation disclosure and the later partially qualified October milestone. None becomes fully operational by calendar inference.

Linked restatements retain original and revised claims with distinct source vintages; same-period predecessors are marked SUPERSEDED. Independent dated stock balances coexist. Original Jupiter gas-generation design and the subsequently reported fuel-cell design remain separate records; the original design is superseded, not removed. Neither planned design establishes regulatory approval or operational generation. Same-URL changed bytes require a new source version, qualification and linked revision; they never replace frozen Phase 3B raw identities.

## Comparability and DO NOT ADD

`compare()` requires compatible metric, definition, scope, native unit/currency, period basis, reporting entity/layer and observed/estimated status. Explicit incompatible scope declarations override allow-lists. Comparisons involving unqualified/conflicting/missing fields fail closed. Status vocabulary can be compared categorically with source-date limitations, not as performance ranking. Numeric cross-company examples intentionally fail where reporting entities/scopes are incompatible.

| Requested comparison | Result |
|---|---|
| Hyperion financing vs Fairwater corporate funding pledge | NOT_COMPARABLE |
| Hyperion 5 GW vs secondary 2.064 GW or another native IT-load measure | NOT_COMPARABLE |
| Lease commitment or maximum exposure vs project debt | NOT_COMPARABLE |
| Utility generation/investment vs campus capacity/cost | NOT_COMPARABLE / DO_NOT_ADD |
| Compatible predeclared project-status categories at different dates | LIMITED_COMPARABILITY |

All disclosed within-project monetary pairs receive machine-readable `DO_NOT_ADD_PAIRS`. Overlap nodes are observation IDs linked to physical asset, instrument or obligation identities; edges preserve SAME_ASSET_DIFFERENT_LAYER or UNRESOLVED. They supplement frozen Phase 3B overlap records. Cross-project addition is also forbidden: `assertAddable()` has no positive aggregation path. No automatic currency conversion, cross-layer total, lease-plus-debt sum or ranking is supported. Absence of a pair is not permission to sum; non-overlap would require a separate methodology.

## Derived views, missingness and publication

Derived views are built only from admitted panel records: company-project coverage, status/archetype categories, capital-structure identifiers, power identifiers, source-family coverage and missingness. They contain no financial totals. Coverage percentages mean projects with at least one qualified non-null field in a family, not fully qualified legal title, financing terms or power contracts. Company coverage retains candidate/rejected lists separately.

Observation evidence and qualification are independent: PRIMARY_VERIFIED can coexist with review-required raw-vintage availability. Missing fields are null/UNAVAILABLE, not zero or evidence of no obligation. Conflicts remain CONFLICT_REQUIRES_REVIEW; sources are not averaged.

`PUBLIC_READY` requires archived primary evidence, a qualified field, clear scope/native definition, no unresolved conflict/conditional assertion and low known overlap. Only conservative physical/status/capacity families may qualify; legal ownership, relationships and monetary fields remain outside this preliminary whitelist. Guidance retains its classification even if field-eligible. Other flags are RESEARCH_ONLY, REVIEW_REQUIRED and NOT_PUBLIC. Eligibility is not owner approval or publication; there is no exporter or public route.

## Storage, determinism and operating boundary

Raw objects remain outside Git under `WIL_AI_INFRA_CACHE` (default `~/Public/wil-ai-infrastructure-cache`), addressed as `objects/<sha-prefix>/<sha256>`. Source plans and compact manifests stay in research Git. The new read-only archive verifier covers both Phase 3B and new objects. Local hashes prove integrity, not offsite durability; externally back up objects and receipts before relying on long-term recovery.

The panel hash covers selected source hashes/versions, projects, entities, claims, definitions, scopes, status histories, instrument/obligation/power links, overlap/comparability/publication rules and implementation/schema identity. Retrieval times, network diagnostics, machine paths and derived display views are excluded; receipt files preserve operational metadata separately. Views are recomputed and validated against economic inputs. Repeated fresh-process builds and current-view writes must be byte-identical.

Accepted research snapshots are immutable at `panel/snapshots/<asOf>/<panelHash>/panel.json`; a conflicting write fails before current artifacts are replaced. The committed snapshot is the qualified Phase 3C vintage only. There is no recurring history writer, autonomous crawler, API dependency, schedule, workflow modification or production write.

## Validation and next phase

Run the commands in `panel/README.md`. Qualification records exact counts, archive checks, test results, hashes and open fields. Offline fixtures cover schema, admission, future-information rejection, ownership, source revisions/restatements, native capacity, comparability, missingness, public eligibility, anti-addition, fresh-process determinism and immutable writes. The Phase 3A/3B regressions and root build/verify remain required.

Remaining HIGH evidence limitations include exact site title/PP&E allocation, Hyperion full securities/legal debt terms and unarchived accounting responses, Google/Amazon financing/capacity/power gaps, Oracle lease/owner/financing terms and confidential power commitments. MEDIUM limitations include incompatible native capacities, Fairwater milestones, Oracle tracker dates, evolving proposed contracts and external backup. These block broad financial conclusions, not a descriptive research panel with visible gaps.

Recommended Phase 3D: design a small public view of eligible dated asset/location/status/native-capacity fields with source, as-of date, scope, guidance and missingness warnings. Keep unresolved legal and financing assertions out of production. Requalify the chosen public projection, bilingual copy and accessibility separately. Do not import this research history, publish financial totals or enable automation as part of Phase 3C.
