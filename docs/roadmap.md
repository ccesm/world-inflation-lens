# Product direction

World Inflation Lens now centers on **how much purchasing power the dollar can preserve over the next 20–30 years**. Historical observations, official conditional projections and hypothetical scenarios remain visibly distinct. Global inflation provides supporting context. Both Chinese and English are supported.

## Delivered V0.1

Educational homepage; a 1900–2026 historical timeline; official U.S. CPI since 1913; purchasing-power calculator; bilingual UI and cited sources. Static snapshots are bundled for GitHub Pages. Light/dark themes persist across visits.

## Delivered V0.2

Annual World Bank country/economy data for 1960–2025; a Natural Earth map; country detail/history; 2–5-country comparison with tables and CSV export; same-year overview, coverage, and searchable rankings. Missing values remain visible. 2024 is the default year based on coverage. No global aggregate is constructed.

## Suggested next releases

- V0.8: add gold and a true house-price series after checking licensing, coverage and comparability. Improve initial loading with on-demand data chunks.
- Later: selectable fiscal-policy and productivity assumptions with explicit feedback and sensitivity analysis; additional BIS/IMF comparisons and equity total returns. Do not assign scenario probabilities without a documented model.

## Delivered V0.7

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
