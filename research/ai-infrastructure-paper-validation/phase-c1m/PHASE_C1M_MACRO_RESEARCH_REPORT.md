# Phase C1-M — macro-first indicator framework

Research cutoff **2026-10-09**; mandatory C1A base **8e6b3eec6b0584c1567c13d7e3979707225324fc**; branch `codex/ai-infra-macro-signals-phase-c1m`. Main observed separately at `12685c1f5bcb49a312caac211d23bd06b17e0ca4`; it is not this branch's base.

## Decision and strategic change

**COMPLETE — MACRO FRAMEWORK QUALIFIED**, subject to the executed validation receipt. This qualifies source selection and research architecture, not AI inflation causality, a fully implemented monitor, or production readiness. Sixteen of seventeen indicators have authenticated captured numeric histories; one AI-adoption indicator remains partial. All four full transmission mechanisms remain E0. Stop after C1-M.

The owner's macro-first directive replaces the proposed C1A-2 acquisition and C1B site-event study. No energization, meter, private-contract or customer-load investigation is continued. Prior C0/C1A reports remain frozen historical decisions, not active acquisition instructions. Their unresolved gaps remain unresolved, with their original claim restrictions retained in `gap-preservation.json`. No missing granular datum blocks this macro framework.

## Inherited evidence

C0 separated four conditional channels and evidence grades. C1A obtained useful state-sector electricity histories and official source controls, but no qualified electrical-service event geography. We reuse its aggregate commercial series and gas benchmark, not its project exposure dates or prospective comparison regions. C1A's 24/12-month and three/six-region event gates are preserved in the old artifacts; they are not imposed on an entirely different macro descriptive framework.

A/B1/B2's reported corporate CapEx is not AI-specific CapEx. Oracle/Amazon cash bridges do not generalize automatically to five firms or establish distress. Gross issuance differs from net new borrowing; customer advances in operating cash flow cannot be added again; fiscal/calendar periods remain distinct. Debt, leases, commitments and guarantees cannot be aggregated as financing needs. No inherited conclusion or gap is revised.

## Compact selection and verified coverage

The registry contains **17 indicators**, with **12 proposed C2 core indicators** and five context/deferred indicators. Counts describe dataset coverage, never relative economic importance. FRED is an official distributor; the original producing agency is identified in every record. Coverage below is the nonmissing span actually captured, not a claim of continuous observations or the producer's full available history. Dates on monthly/quarterly observations are native period labels, not release dates.

| Channel | Indicator / series | Captured nonmissing history | Latest available period verified in this review | Proposed core |
|---|---|---|---|---|
| Energy | EIA state commercial sales | 2015-01–2025-12; 13 states | Catalog 2026-07; captured values stop 2025-12 | Yes |
| Energy | EIA state commercial realized price | Same native state-sector sample | Same | Yes |
| Energy | EIA Henry Hub benchmark | 2015-01–2025-12 | Official table 2026-09; retained extract stops 2025-12 | Yes |
| Energy | Census private data-center construction, Private SA J | 2014-01–2026-08 | 2026-08, preliminary | Yes |
| Financing | BEA investment, PNFIC1 | 2007Q1–2026Q2 | 2026Q2 | Yes |
| Financing | Fed H.15 real yield, DFII10 | 2003-01-02–2026-10-08, missing days retained | 2026-10-08 | Yes |
| Financing | Fed Z.1 debt securities, NCBDBIQ027S | 1945Q4–2026Q2, 18 early quarters missing | 2026Q2 | Yes |
| Productivity | Census revised BTOS core AI use | Numeric history unavailable; new collection from 2025-11-17 | Null; no inference from catalog date | Deferred |
| Productivity | BLS output/hour, OPHNFB | 1947Q1–2026Q2 | 2026Q2 | Yes |
| Productivity | BLS unit labor costs, ULCNFB | 1947Q1–2026Q2 | 2026Q2 | Yes |
| Productivity | BEA real GDP, GDPC1 | 1947Q1–2026Q2 | 2026Q2 | Context |
| Inflation | BLS headline CPI, CPIAUCSL | 1947-01–2026-08; one missing month | 2026-08 | Yes |
| Inflation | BLS core CPI, CPILFESL | 1957-01–2026-08; one missing month | 2026-08 | Context |
| Inflation | BEA headline PCE, PCEPI | 1959-01–2026-08 | 2026-08 | Context |
| Inflation | BEA core PCE, PCEPILFE | 1959-01–2026-08 | 2026-08 | Yes |
| Inflation | St. Louis Fed compensation, T10YIE | 2003-01-02–2026-10-09; missing days | 2026-10-09 | Context |
| Inflation | Philadelphia Fed SPF INFCPI10YR | 1991Q4–2026Q3; earlier missing survey cells retained | 2026Q3 survey, not realized quarterly inflation | Yes |

Numeric source files: **13 new bounded official downloads** (11 CSV, two small XLSX), plus two inherited EIA sources; BTOS definition metadata is separately qualified. The sixteen source entries comprise fifteen numeric-source qualifications and one partial survey source. Full source metadata/latest values are in the JSONs; no API endpoint or native producer code is guessed where only a verified FRED/workbook identifier is available. Publication lags remain null rather than assumed fixed days.

## Four channels: mechanisms, offsets and limits

**1. Infrastructure and energy.** Construction is a directly reported data-center-related investment measure, while commercial electricity sales and prices are general-sector outcomes. Scarcity may raise input costs in 0–3 years; generation/grid expansion, efficiency and deferred commissioning may offset pressure in 3–7 and 7–20 years. Weather, gas, industrial/electrification growth, tariffs and customer mix are competing explanations. Retail sales omit nonretail/self-supplied consumption; they are not total energy use. The inherited 13-state sample is not national demand or a statistically representative selection. Census's annualized construction pace excludes racks/servers and land, and is not all-in campus spending. Native final/preliminary flags matter. Official definitions: [EIA-861M](https://www.eia.gov/electricity/data/eia861m/), [Census construction](https://www.census.gov/construction/c30/definitions.html).

**2. Capital and financial conditions.** Broad real investment, real Treasury yield and corporate debt-securities stock describe demand for capital and market conditions without measuring AI borrowing. Internal cash, global saving and financial intermediation may accommodate capital demand. Policy, fiscal deficits/Treasury supply, refinancing and risk appetite can dominate yields. Stock changes are not gross issuance or net new cash borrowing; securities are not all corporate debt. Chained-dollar investment is not additive by component. The captured PNFIC1 file begins in 2007; earlier history is not invented. Official series: [BEA investment via FRED](https://fred.stlouisfed.org/series/PNFIC1), [Fed real yield](https://fred.stlouisfed.org/series/DFII10), [Z.1 securities](https://fred.stlouisfed.org/series/NCBDBIQ027S). Private ICE credit spreads and unaudited TIC breaks remain outside the compact core.

**3. Adoption, productivity and growth.** Self-reported AI use, output/hour and unit labor costs measure different stages. They support monitoring adoption and supply-side conditions, not an attributed AI productivity effect. Adoption selection, complementary intangible capital, wages, utilization, output revisions and firm composition matter. Lower unit labor costs need not pass through to consumer prices; margins, demand and rebound may offset gains. No annual AI GDP contribution is assumed. The new Census core question cannot be spliced to the old question or pooled AI supplement. Official anchors: [Census AI update](https://www.census.gov/hfp/btos/downloads/AI%20Question%20Wording%20Updates.pdf), [BLS productivity](https://www.bls.gov/news.release/archives/prod2_09032026.htm), [BLS output/hour distributor](https://fred.stlouisfed.org/series/OPHNFB), [BLS unit costs](https://fred.stlouisfed.org/series/ULCNFB). Sector extension is deferred until a separately scoped industry/definition concordance is reviewed.

**4. Inflation and monetary conditions.** CPI/PCE measure consumer-price baskets, SPF measures professional expectations, and breakeven measures market compensation with risk/liquidity components. They cannot be combined into an inflation score. Policy responses, shelter, trade, fuel and wage shocks may outweigh investment effects. A localized relative-price increase or one-time price-level step does not establish persistent inflation. TIPS yields are not equilibrium real rates. Cross-frequency leading/lagging order remains a prespecified research question, never measured causal direction. Official anchors: [BLS CPI](https://fred.stlouisfed.org/series/CPIAUCSL), [BEA core PCE](https://fred.stlouisfed.org/series/PCEPILFE), [SPF](https://www.philadelphiafed.org/surveys-and-data/real-time-data-research/inflation-forecasts), [compensation](https://fred.stlouisfed.org/series/T10YIE).

## Deliberate exclusions and institutional research context

The compact core does not equate coverage with a complete macro control set. Detailed PPI/equipment indexes, construction wages, generation mix/capacity, multifactor productivity, sector adoption concordances, foreign capital flows and policy-shock measures remain deferred or existing C0 candidates. Their exact adapters and comparability must be qualified before use; no invented IDs are added merely for coverage. Private ICE spreads are excluded because official distribution does not change their private/licensed origin. TIC remains deferred because its reporting break is unresolved. Existing corporate financial bridges remain contextual evidence, not a new company data collection project.

C0's LBNL modeled historical data-center electricity estimates and prospective scenarios remain institutional research context (`../phase-c0/evidence-register.json#EV-LBNL`). E1 verifies that the institution reports those estimates; it does not make them metered AI-only consumption. PJM large-load forecast vetting/revisions remain forecast evidence, not realized demand. These frozen C0 references need no repeated project investigation and are not numeric monitored indicators in this phase. Competing institutional interpretations may guide later questions without becoming measured macro effects.

## Missingness, revisions and scientific quality

The captured CPI and core CPI files contain null for **October 2025**. No cause is inferred from the payload and no index is filled. A future YoY comparison requiring that month must remain unavailable. Each daily yield/spread has 254 missing rows; holidays/unreported values are not zero. Z.1 has 18 missing early quarterly cells. SPF has 87 missing pre-1991Q4 cells in the wider workbook. Exact lists, native locators and latest captured values are regenerated offline in `historical-coverage-and-gaps.json`. Do not treat late-series missingness, pre-series absence and calendar closures as interchangeable.

BTOS current numeric adoption/uncertainty/weight histories remain unavailable. First-release macro vintages, some exact revision/lag policies, national energy/supply series and causal AI measurement remain gaps. EIA monthly 2025 values retain Preliminary flags even where a final annual publication exists. Current histories describe what the captured vintage reports, not what was known in an earlier historical month. [BLS SA revision policy](https://www.bls.gov/cpi/seasonal-adjustment/) and [BEA release calendar](https://www.bea.gov/news/schedule/full) guide future versioning.

New evidence: **17 E1 narrow source/definition observations and four E0 mechanisms; zero new E2/E3/E4 relationships**. E0–E4 criteria and the six separate quality dimensions remain explicit. Authentication, a software pass or an official publisher cannot establish causality. All 17 C0 hypotheses are preserved; the new four-channel grouping is a monitoring organization, not a revision of their evidence grades.

## Feasible next step and handoff

Exactly one recommendation: a **research-only twelve-indicator native-frequency descriptive engine**, detailed in `PHASE_C2_RECOMMENDATION.md`. Operator-triggered acquisition, raw-byte identity, explicit as-of, revision manifests and independent indicator outputs would be sufficient. No crawler, meter hunt, scenario laboratory, public dashboard, composite score or forecasting system is needed. No C2 engine is implemented here: `artifacts.py` only validates/rebuilds this phase's source coverage and content identity.

The new directory is the complete permitted diff. All 530 baseline tracked files remain byte-identical, including prior studies, application/version, snapshots and workflows. Regression guards are run in their clean frozen worktrees without editing them. Build/full repository verify and independent source-reader checks are in `validation-results.json`. No main merge, PR, deploy, schedule, notification, runtime browser API or dependency change.

## 中文摘要

本阶段改为宏观优先：保留但停止追补项目通电、客户合同和电表数据缺口。建立17项指标、16个官方来源条目，建议未来先做12项研究用核心指标；16项有已核验数值历史，BTOS新口径采用率仍为部分合格。电力和投资总体指标不代表AI专属活动。四条传导机制仍为E0，方向、幅度和持续性未识别。

缺失值、原始单位、频率、修订状态和数据版本均保留。电价均值不等于合同电价，债务存量不等于发行现金流，生产率提升不保证消费者降价，市场通胀补偿不等于纯通胀预期。C2仅建议人工触发、原始频率、独立指标的描述引擎；未开始实施。生产及既有研究均不改动。
