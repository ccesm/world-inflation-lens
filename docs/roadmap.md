# Product direction

World Inflation Lens explains inflation through **data → history → causes → everyday effects**, with English and Chinese content written for understanding.

## Delivered V0.1

Educational homepage; a 1900–2026 historical timeline; official U.S. CPI since 1913; purchasing-power calculator; bilingual UI and cited sources. Static snapshots are bundled for GitHub Pages. Light/dark themes persist across visits.

## Delivered V0.2

Annual World Bank country/economy data for 1960–2025; a Natural Earth map; country detail/history; 2–5-country comparison with tables and CSV export; same-year overview, coverage, and searchable rankings. Missing values remain visible. 2024 is the default year based on coverage. No global aggregate is constructed.

## Suggested next releases

- V0.6: wage purchasing power and a personal consumption basket, with explicit assumptions and source coverage.

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
