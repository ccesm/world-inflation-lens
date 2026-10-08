# AI Infrastructure & Financing — public monitor UI contract

Phase 3D.1 defines a future public page for readers seeking clear, source-backed project facts. It does not build a page, register a route or approve deployment. The machine-readable contract is `research/ai-infrastructure-financing/public/ui-contract.json`; bilingual copy lives in `public/copy.json`. Both are frozen with the reviewed projection.

The title is **AI Infrastructure & Financing / AI 基础设施与融资**. The subtitle describes qualified construction and power evidence and explicitly limits unqualified ownership/financing details. The dataset is a curated selection as of 2026-10-07, not a comprehensive infrastructure census, a synchronized current operational assessment or a financial-risk ranking.

## Section order and prominent disclosure

1. Project landscape / 项目概览.
2. How the buildout is financed / 建设如何融资.
3. Power & grid / 电力与电网.
4. What this data can and cannot show / 数据能与不能说明什么.

Before project cards, show this disclosure without requiring expansion; repeat it in the final section:

> Project cost, corporate CapEx, project debt, lease commitments, guarantees, and maximum exposure may describe different layers of the same infrastructure. They should not be added together unless their scopes and asset identities are proven to be non-overlapping.

> 项目成本、公司资本支出、项目债务、租赁承诺、担保以及最大风险敞口，可能描述同一基础设施的不同层次。除非能够确认其范围和资产身份互不重叠，否则不应直接相加。

The summary explains corporate investment, JVs, project financing and leases as possible structures. It must not imply those structures have been qualified for every displayed project. All project-specific structure labels are UNKNOWN in this vintage because the frozen panel has no eligible structure observations. UNKNOWN means not yet qualified for public use, not absence of financing.

## Project landscape and card

The production-facing JSON schema is `public/schemas/projection.schema.json`. A card contains only project and associated-company identity, translated location, dated eligible status/history, native capacity facts, safely qualified power facts, public source references, concise scope/comparability notes and the knowledge boundary. Company association does not establish legal ownership. There are no legal-entity graphs, dollar amounts, ownership percentages, coordinates or hidden research notes.

Use neutral company order Microsoft, Alphabet, Amazon, Meta, Oracle; use stable project IDs within each company. Place Polaris Forge 1 in a separately labeled comparative group. Do not sort by spending, risk, capacity, return or financing quality. The current core-company coverage is Microsoft two projects, Amazon one, Meta two, Oracle one and Alphabet none. Do not lower eligibility for visual symmetry.

Status must be accompanied by observation/effective date, source publication date and source-vintage availability. Null publication dates stay unavailable; the as-of date is not the economic observation date. A safe earlier disclosure is not presented as a new assertion about today's complete campus. Fairwater shows the September 2025 construction disclosure plus the explicit warning that official completion timelines have changed; no disputed completion date or unsafe later milestone is resolved. Polaris uses its eligible June 2026 partial-operation disclosure, not the later unqualified observation. Jupiter separates its August construction-photo date from unknown page publication date.

Native capacity items retain value, unit, operator, definition, classification, planning/contracted/reported-live status, scope and source dates. Hyperion's 5 GW is planned scalability. El Paso's 1 GW is planned compute capacity. Polaris' 400 MW contracted load and 175 MW reported live load are distinct facts, not additive components. Component lease capacities are omitted. No cross-project capacity bar chart, unit harmonization or ranking is permitted.

## Financing and ownership

Provide bilingual educational labels for corporate-owned/developed, JV/project-financed, developer/lease-financed, mixed and unknown. Future presence-only badges may describe corporate funding, JV, project financing, long-term lease, developer financing or conditional support only if independently eligible. No such project badge is populated in this vintage. Hide or disable an archetype filter when every project is unknown.

Do not copy research archetypes into public cards. Hyperion's legal entities, Meta/fund percentages, borrower/issuer, coupon, recourse, lease payments, guarantees and maximum exposure remain excluded. Fairwater's legal title and PP&E allocation remain excluded. Polaris is an unassigned comparative project, not a core-company asset; its research developer/tenant classification and tenant attribution are not promoted as public facts.

Guarantee education must say conditional contractual support is not debt, expected loss or expected payment. Maximum exposure is not a headline number and remains outside the dataset. No financial amount exception is enabled in version 1, even for a publicly announced transaction. Future monetary publication requires separate scope/entity and explanatory-copy qualification.

## Power & grid

Show the qualified facts as separately scoped statements. Fairwater's solar matching support is not campus IT capacity. Hyperion's gas-generation plan and renewable option describe a utility-system plan, not operational campus supply or campus investment. Preserve greater-than and up-to qualifiers. No customer-rate, electricity-inflation or natural-gas-inflation inference is allowed.

The power view uses only `powerSummary` facts, their native definitions and sources. A cooling-water statement is not silently relabeled electricity generation. Unknown utility, contract or energization details do not become fabricated rows.

## Sources and provenance

Source links use official public HTTPS URLs, source titles in EN/ZH, publisher, document date, availability date and content-vintage hash. No machine/cache paths, credentials, signed expiring links or private artifact links appear. The source caption distinguishes publication from availability and research as-of dates. Internal observation IDs and claims remain in the research trace, not the public snapshot.

Proper company/publisher names may remain the same in both languages. Translate all labels, definitions, disclosures, location display text, project display labels and source titles through the structured copy contract. Enum codes must always render through that contract; never show untranslated implementation constants as explanatory prose.

## Filters, map/list and accessible table

Filters are categorical: associated company, dated status and descriptive archetype. There is no quantitative risk or investment filter. Use labeled native controls, keyboard operation, visible focus and bilingual zero-result messaging. Filtering never recomputes economic values.

A map is optional. No coordinates are supplied or inferred in this projection; city/region cards provide the complete useful view. Every map fact and navigation action must also be available in a project list. Do not require geography for access.

Use a semantic table with caption, column headers and `scope="col"`. Columns: company, project, location, status, capacity, capacity definition, financing structure, power, as of. Omit an Investment $ column. Include source links and dated context. All critical facts remain available as text in cards/table; there is no chart-only evidence or status conveyed solely by color. Announce official links opening in a new tab using the EN/ZH copy key.

## Responsive and accessibility acceptance contract

At 390 px, stack project cards vertically. Filters wrap with visible labels. Long source/definition text wraps safely. A table may scroll inside its own labeled container, but equivalent card content means horizontal table scrolling is never required to understand the page. Page-wide horizontal overflow is forbidden.

At 1280 px, use a restrained two/three-column card layout and the four-section order. Do not make the page excessively dense. The optional map must retain text parity. Both languages need keyboard navigation, semantic table access, readable dates/units, visible disclosures and no clipped headings. These are future implementation acceptance requirements, not browser tests claimed in Phase 3D.1.

## Production boundary and Phase 3D.2

Only the frozen public JSON plus reviewed bilingual copy/contract may cross a later clean production integration boundary. Phase 3D.2 must start from latest production main, revalidate file identities, add a small UI/navigation/test change and separately qualify accessibility. Do not merge this research lineage or import trace/audit/registries/raw sources. No schedule, runtime data API, email, financial total, AI ROI, leverage or systemic-risk score is authorized by this contract.
