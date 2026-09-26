# Product direction

World Inflation Lens now centers on **how much purchasing power the dollar can preserve over the next 20–30 years**. Historical observations, official conditional projections and hypothetical scenarios remain visibly distinct. Global inflation provides supporting context. Both Chinese and English are supported.

## Delivered V0.1

Educational homepage; a 1900–2026 historical timeline; official U.S. CPI since 1913; purchasing-power calculator; bilingual UI and cited sources. Static snapshots are bundled for GitHub Pages. Light/dark themes persist across visits.

## Delivered V0.2

Annual World Bank country/economy data for 1960–2025; a Natural Earth map; country detail/history; 2–5-country comparison with tables and CSV export; same-year overview, coverage, and searchable rankings. Missing values remain visible. 2024 is the default year based on coverage. No global aggregate is constructed.

## Suggested next releases

- V1.0: consolidate the research workspace before adding more datasets: route-level loading, shared/persistent comparison windows, and explicit source-vintage comparisons. Then review official firm-level AI adoption, sector productivity, electricity-grid investment, transformer/equipment constraints, AI capital intensity and TFP decomposition individually.
- Later: selectable fiscal-policy and productivity assumptions with explicit feedback and sensitivity analysis; additional BIS/IMF comparisons and equity total returns. Do not assign scenario probabilities without a documented model.

## V0.12 — Research workspace and provenance

A unified searchable library exposes 49 existing published series, with local favorites, three research presets, independent-scale panels sharing a date window, exact-calendar YoY, tables, CSV and shareable selections. The new revision journal filters recorded checks and before/after examples without implying complete vintage reconstruction or email success. Official research and release-calendar links clarify integrated versus candidate datasets. Both new tools remain secondary Research pages; the homepage adds only compact shortcuts.

Next: route-level loading, review a single firm-level AI adoption source (Census BTOS) with survey definitions and revision policy, then evaluate a real vintage comparison from retained snapshots. EIA electricity detail, TFP and IMF/BIS integrations remain unintegrated. Gmail authentication is operational as of workflow run #31; SMTP success does not guarantee inbox placement.

## V0.11 — Homepage repair and daily operations

Fixed the seven-card desktop grid overflow/misalignment, retaining the research framework and all source data. Daily official-source checks replace weekly scheduling; data-health check freshness uses 48 hours and rejects invalid timestamps. The server-side bilingual email digest distinguishes current-run success, unchanged data and failed updates/deployment. Gmail sends from and to the same address through GitHub Actions secrets; the configured workflow completed successfully in run #31. See [setup and verification](v0.11-daily-updates.md).

## Delivered V0.10 — Digital Money & Dollar System

Phase 2 follows the separately verified V0.9 AI milestone. A dedicated Research page explains stablecoin demand, Treasury financing, bank-deposit redistribution, digital dollarization, alternative stores of value and financial-stability mechanisms. Four reviewed Fed/IMF publication estimates and one observed monthly Federal Reserve H.8 deposit series have independent provenance, explicit date/denominator limitations, tables/CSV and Data Health coverage. Publication estimates remain manually reviewed; bank data joins weekly validation and rollback without changing its monthly frequency. Neither AI nor digital money is assumed to improve or impair dollar purchasing power automatically.

The homepage now connects seven research forces to long-term purchasing power, with separate compact AI and Digital Money previews. No large new charts are added there. Existing AI, Fiscal/CBO and External Shocks datasets remain intact. See [the source and validation report](v0.10-digital-money.md).

Future Digital Money candidates require source and licensing review: continuous stablecoin market coverage, reconciled direct/indirect issuer Treasury exposure, measured deposit migration and holder geography. Bitcoin and gold histories require a justified benchmark and clear usage rights before integration. No token recommendations, forecasts or collapse probabilities.

## Delivered V0.9 — AI & Productivity Expansion

Five evidence groups connect investment and electricity demand to labor productivity, unit labor costs and long-term real growth. Sixteen official monthly/quarterly series plus a derived GDP-per-worker ratio; eight monitor cards; transparent common-quarter rules; historical comparisons; bilingual tables/CSV; source-health integration; strict validation and whole-bundle rollback. Data-center construction is directly observed but remains an AI-context proxy. No AI-specific spending total or causal productivity contribution is fabricated. Potential growth, annual TFP, adoption and grid-capacity datasets remain explicitly planned. Fiscal/CBO and External Shocks snapshots are unchanged. See [the source and methodology report](v0.9-ai-productivity.md).

## Delivered V0.8 — geopolitical inflation transmission

Four official snapshot families: GPR/GPRT/GPRA; SIPRI U.S. military burden and real expenditure plus official global real spending; NY Fed GSCPI; FAO total and five components. Bilingual six-card monitor, conditional transmission map, exact-calendar-lag changes, separate-scale historical comparisons, source-aware tables/CSV and transparent common-month summary. Monthly source revisions join the weekly whole-bundle rollback pipeline; SIPRI is manually reviewed annually. Explicit limitations include no pre-1985 GPR splicing, no global military/GDP series, world military spending missing in 1991, FAO meat source estimates, and no synthetic backfills. CBO history/projections remain untouched. No war probabilities, news feed, composite risk score or investment signals.

## Delivered V0.7 — Part B: information architecture

Six primary sections (Home, Dollar, Fiscal, History, Scenarios, Research) organize the long-term dollar purchasing-power question. A framework-first homepage connects historical CPI, illustrative scenarios, six interacting research forces (including productivity and external shocks), three time horizons, four scenarios without probabilities, preserved CBO previews, explicit descriptive proxy bands, opposing pathways, Since 1971, regimes, the central debate and global context. Detailed tables, source health, global rankings and all charts remain in secondary tools. Original hash links and query parameters remain supported; History aliases existing regimes. No data ingestion or forecast logic from Part A is replaced.

V0.8 connects the shock framework to GPR, SIPRI, GSCPI and FAO evidence. These should remain independently attributed before further expansion. Gold and house-price history still require explicit starting dates, licensing and nominal/real comparability. Separately, split large observation bundles by route to reduce first-load cost. Do not add gold, equity or house-price forecasts.

## Delivered V0.7 — Part A: fiscal evidence

CBO public debt, deficits and net interest as shares of fiscal-year GDP: 1962–2025 historical actuals and complete 2026–2056 conditional projections. Official CSVs and schemas are pinned and retained with source hashes. Metric/range controls, year inspection, distinct historical/projected paths, bilingual assumptions, annual table and CSV export. The February 25, 2026 forecast is reviewed separately from weekly observations and explicitly excludes the February 20 tariff ruling's effects. Gold and house-price integration remain future work.

## Delivered V0.6

Dollar purchasing-power homepage; eleven dated risk indicators; monetary regime history; future purchasing-power calculator; observed debt, verified CBO 2026/2036 endpoints and an editable debt accounting scenario; nominal/real comparisons with exact base-month matching. Daily, weekly and fiscal-year sources join the validated automatic update pipeline. Gold remains pending; V0.7 subsequently completes the CBO annual fiscal projections.

## Delivered V0.5

Weekly and manually triggered FRED/World Bank ingestion, including headline CPI. Whole-batch validation, failed-update preservation, revision summaries, and deployment from the same Actions run. Bilingual source health panel and shareable Drivers chart settings. Observational age hints are distinct from last successful checks and official release schedules; complete revisions remain in Git history.

## Delivered V0.4

Shelter CPI, average hourly earnings and M2 growth versus headline inflation; six bilingual driver topics; cited context on fiscal policy, exchange rates, supply chains and inflation expectations. Mixed seasonal-adjustment conventions and unavailable historical periods are visible. Static public data remains compatible with GitHub Pages and requires no frontend API keys.

## Delivered V0.3

U.S. food/energy CPI versus headline inflation; WTI monthly oil prices on a separate scale; effective federal funds rates versus inflation. Synchronized month inspection, range controls, missing-data handling, monthly table/CSV, and four historical windows with two-way history links. All seven pages remain bilingual, responsive, and theme-aware. No causal contributions or inflation-regime scores are inferred.

## Future V1.0 scope from the product brief

1. A country inflation map and country comparisons, with visible coverage and missing data.
2. Long-run international CPI from BIS and World Bank, with explicit aggregate construction and country membership.
3. Food versus headline CPI, oil versus CPI, and rates versus CPI.
4. Nominal and inflation-adjusted gold prices.
5. IMF forecasts with the forecast vintage, actual / estimate / forecast status, and distinct line styles.
6. Additional explanations of wages, money, credit, services, housing, and purchasing power.
7. Review pre-1913 U.S. reconstructed CPI separately before integrating it. Do not silently splice a reconstruction into the official BLS series.

A future inflation-regime or driver model must disclose its methodology and be labeled as an educational analytical model. Correlation must not be presented as a measured causal contribution. No unverified current global statistics or unexplained forecast values should be displayed.

A World Food Lens link can be added once its exact project URL is supplied. Future ingestion providers must follow the same validation and revision policy.

V0.9 integrates unit labor cost, productivity, real GDP and employment; V0.8 integrates GSCPI supply-chain evidence. Labor supply, credit and firm-level adoption remain research priorities. Framework arrows do not imply measured causal effects.

## V0.7/V0.8 — External Shocks framework

Delivered: six-force logic map; a compact homepage preview before evidence; Research → External Shocks with geopolitical, energy, food, supply-chain, shipping and historical subsections. Three conditional paths connect disruptions to supply costs, fiscal choices and market confidence, then to dollar purchasing power. Eight historical cases include all seven requested channels, field-level sources and explicit gaps. The framework is explanatory and descriptive, not predictive. Survey-based perceptions must never become war-event probabilities.

Existing evidence: WTI (EIA/FRED), energy CPI and food CPI (BLS/FRED), with current snapshots, monthly dates and existing charts/tables/CSV. Fiscal history, CBO projections, source/version labels and refresh/deployment workflows are preserved.

Planned datasets (no observations or numeric placeholders added):

- Geopolitical Risk Index: review author methodology and coverage; index intensity is not event probability.
- Natural gas: select a benchmark and disclose geography and units.
- FAO Food Price Index: validate global commodity coverage; keep distinct from U.S. consumer food CPI.
- Freight/shipping index: select licensed, reproducible coverage and distinguish container, bulk and route indices.
- Global Supply Chain Pressure Index: verify New York Fed methodology, units, revisions and monthly coverage.
- Defense spending/GDP: choose a consistent national-defense/military definition, GDP denominator and fiscal/calendar-year basis.

Each future source must pass the existing missing-data, revision, source-date and refresh-rollback discipline. No extra API, geopolitical prediction, gold forecast or synthetic series is introduced in this pass.
