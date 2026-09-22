# World Inflation Lens · 全球通胀透视

A bilingual Vite + React research site focused on the long-term purchasing power of the U.S. dollar, monetary history and fiscal constraints. Global inflation remains available as supporting context.

## Run locally

Use Node.js 22.12 or later (Node 22 LTS is configured for GitHub Actions).

```sh
npm install
npm run dev
npm run build
npm run verify
```

`npm run preview` serves the production build locally. If a port is already in use, specify a free port, for example `npm run preview -- --port 5187 --strictPort`.

## V0.11 — Homepage repair and daily email reminders

- Fixed the seven-force homepage grid: the old six-card desktop template squeezed the seventh card into a narrow separator column. Cards now wrap at readable widths across desktop, tablet and phone.
- Daily official/public-data checks at **08:00 America/Los_Angeles** replace the weekly schedule. A real September 22 refresh passed with 24 new observations and 31 source revisions. Source frequency, reviewed forecast vintages, validation and rollback stay intact. Data Health flags checks older than 48 hours.
- A separate server-side email job reports successful updates, unchanged observations or failed updates/deployment. It never treats a previous run's ledger as today's result. Ordinary code pushes do not send mail.
- **Email setup is still required:** repository secrets `RESEND_API_KEY`, `NOTIFY_FROM` and `NOTIFY_TO`. No recipient is assumed; absent settings produce an explicit “not sent” warning. No frontend keys or browser email requests. `npm run notify:preview` is safe and sends nothing.

See [V0.11 fixes, setup and verification](docs/v0.11-daily-updates.md). Email delivery is not verified until the user's sending configuration is available.

## V0.10 — Digital Money & Dollar System

This expansion has **two separate milestones**. Phase 1, V0.9 AI & Productivity, was completed and its build/verification passed again before Phase 2 began. Phase 2 adds **Research → Digital Money** (`#/research/digital-money`). Its question is how the structure of dollar demand and usage is changing; the AI page continues to ask whether productive capacity can grow with less inflation.

- Eight bilingual sections: stablecoin size, USD denomination, Treasury holdings, bank deposits, Treasury demand, digital dollarization, alternative stores of value and financial stability. Three conditional channels connect dollar/Treasury demand, bank funding and monetary competition to purchasing power.
- Four manually reviewed, dated publication estimates from Federal Reserve research and IMF remarks, plus Federal Reserve H.8 commercial-bank deposits (`DPSACBM027SBOG`, monthly, seasonally adjusted, January 1973–August 2026). The bank chart supports level/YoY, time ranges, month selection, table and CSV.
- Publication snapshots are **not a comparable market time series**. Unknown measurement dates remain missing, approximate values retain their qualifiers, and the Treasury estimate uses outstanding **Treasury bills** as its denominator. Aggregate bank deposits are context, not measured stablecoin migration.
- Separate `data/digital-money/` datasets and ingestion adapter reuse the existing validation, revision ledger and whole-bundle rollback. Only the monthly bank series joins weekly automatic checks; publication estimates require manual source review. No frontend data APIs or keys.
- The homepage now has seven research forces and two compact, separate AI/Digital Money previews. Six primary navigation items and all legacy routes remain. Existing productivity, Fiscal/CBO and External Shocks datasets are unchanged.
- Continuous stablecoin market history, reconciled issuer Treasury holdings, actual deposit migration, holder geography and Bitcoin/gold price histories remain planned. Stablecoin issuance is not treated as Federal Reserve money creation; crypto prices are not evidence of dollar collapse. No trading signals or probabilities.

See [V0.10 source, methodology and validation report](docs/v0.10-digital-money.md).

## V0.9 — AI & Productivity Expansion

Research → **AI & Productivity** (`#/research/ai-productivity`) connects AI investment and infrastructure demand to productivity, unit labor costs, real growth and long-term dollar purchasing power. It presents both possible channels: near-term investment/electricity demand may raise costs; longer-term productivity and supply gains may ease inflation and fiscal pressure. Neither channel is assumed to dominate or attributed to AI from correlation alone.

- **16 official series**: BLS productivity, compensation, unit labor costs, electricity CPI and employment; BEA real business investment, technology/software/computer investment and real GDP; Federal Reserve commercial electricity sales and semiconductor output; EIA natural gas; Census data-center, nonresidential and electronics-factory construction.
- **One derived ratio**: real GDP per employed person, using complete three-month employment averages. It is distinct from BLS output per hour.
- Bilingual eight-card monitor, five evidence groups, quarterly annualized/YoY productivity, a 20-quarter moving average, historical mean, labor-cost small multiples, source-aware tables and CSV, six historical comparison windows and transparent common-quarter interpretation.
- AI investment and infrastructure **proxies** are labeled, including data-center construction (which includes non-AI centers). No synthetic AI-spending total, AI causality estimate, probability, composite score or stock coverage.
- Existing snapshot refresh and rollback now include these monthly/quarterly series; weekly checks retain original observation frequency. Initial import establishes a baseline, not a claim of zero source revisions. Source IDs, adjustment, definitions, release/retrieval dates, licensing and coverage are retained. No browser API calls or API keys.
- The six top-level sections, legacy routes, CBO history/projections and V0.8 External Shocks functionality are preserved. Homepage productivity links and a concise preview lead to the new research page; detailed evidence stays off the homepage.

See [V0.9 implementation and source report](docs/v0.9-ai-productivity.md) for exact datasets, coverage, source updates, methods, limitations, validation and remaining research gaps.

## V0.8 — Geopolitical Risk Data Expansion

Research → External Shocks now asks whether geopolitical stress is transmitting through military spending, supply chains, energy and food into U.S. inflation and long-term dollar purchasing power. It does not predict wars or assign probabilities.

- Six dated summary cards; explicit data-availability chain; risk/perception versus economic transmission versus inflation outcomes.
- GPR Total / Threats / Acts monthly charts (1/5/10/25 years or full history), with historical context bands.
- SIPRI U.S. military/GDP, military/government spending, real military spending and official real world aggregate. Annual metric/year selection and exact five-year real changes. **All U.S. figures use SIPRI's fiscal-year footnote 44; world totals use calendar years.**
- NY Fed GSCPI in standard deviations, including negative observations; separate aligned GPR/GSCPI/WTI charts.
- FAO nominal food index and all five components; exact-lag MoM/YoY, full-sample high/date and separately scaled U.S. Food CPI comparison. Recent meat/total indices can include FAO projected prices.
- Historical Transmission Lab: 1973, 1990, 2008, 2020, 2022 and a rolling recent window. Ten small multiples share a month selector and X-axis window; unavailable observations stay blank.
- Documented deterministic common-month summary, without an opaque score, probabilities or geopolitical causal attribution. Tables/CSV retain source, original units and fiscal/calendar basis.
- Four additional Data Health entries, source release/retrieval/coverage, missing counts, revision accounting and licensing. Existing fiscal/CBO datasets, routes, scenarios and calculations are unchanged.

See [V0.8 sources, methodology and release report](docs/v0.8-geopolitical-data.md) for exact endpoints, coverage, values, limitations and validation. The homepage remains a framework-first preview rather than duplicating these charts.

## V0.7: two complementary parts

**Part A — Long-term U.S. fiscal history and CBO 2026–2056 projections.** The completed fiscal dataset, ingestion validation, historical/forecast labels, source vintage, policy caveat, year inspection, tables and CSV remain intact.

**Part B — Information architecture around long-term dollar purchasing power.** The primary question is whether the U.S. dollar can preserve purchasing power over the next 20–30 years. High inflation is a research possibility, not a predetermined outcome.

Primary navigation is now exactly **Home / Dollar / Fiscal / History / Scenarios / Research**, with Chinese labels 首页 / 美元 / 财政 / 历史 / 情景 / 研究. Desktop pages have scoped secondary links; mobile pages use a native section selector. Theme and language controls stay in the upper right. The homepage has no secondary tool navigation bar.

The homepage now explains the research framework before any observed values. The original V0.7 six-force visual includes inflation pressure, fiscal pressure, monetary conditions, market confidence, real economic capacity/productivity and external shocks, each with 2–4 indicators. It is a conceptual channel map, not an additive equation or measured causal model. Three time horizons (6–24 months, 2–10 years, 10–30 years) lead to four unweighted scenarios: stable low inflation, financial repression/gradual erosion, persistent high inflation and severe monetary stress. Unintegrated series are explicitly marked.

The evidence sequence is:

1. Research question and two CTAs, then the research framework and a compact External Shocks preview. Only after the framework come three dated observations: CPI, 10-year real yield and public debt/GDP.
2. CPI purchasing power: selectable 1913/1945/1971/1980/2000/2020 bases. The example is the remaining purchasing power of an unchanged $100, explicitly expressed at starting-month prices.
3. Illustrative future scenarios using $100,000 by default, 10/20/30-year controls and editable amount/rate/horizon.
4. The former four-force card block is consolidated into the six-force framework above the evidence. The four observed environment proxies below remain distinct from this broader research coverage; V0.9 subsequently integrates productivity and V0.10 adds digital money as a seventh research force.
5. A compact preview of the existing CBO chart, retaining metric selection, solid/dashed separation, source links, vintage and assumptions.
6. Four transparent descriptive proxy labels, never summed into a score.
7. Opposing fiscal-pressure and productivity pathways, labeled as conditional mechanisms.
8. Since 1971: existing CPI, M2, shelter and CBO historical debt ratios normalized independently. Wage and oil coverage limitations remain explicit.
9. A concise monetary-history reading timeline linking to detailed regimes.
10. Evidence for rising inflation risk and evidence that may constrain it.
11. Supporting global context, common-year major economies and a map preview loaded as it approaches the viewport.

Full country rankings, country comparison, the full map, all monitor/driver charts, source registry, health panel, long methodology and large tables remain in detailed tools. The fiscal page now reads **Where we are now → What CBO projects → What this could mean**, followed by the preserved historical reference and independent debt scenario model.

### V0.7/V0.8 External Shocks framework

The sixth research force covers geopolitical risk, energy, food, supply chains and shipping. A compact homepage preview follows the Research Framework and precedes observed data. Research → External Shocks explains three conditional transmission paths: supply costs, fiscal responses and market confidence. All views reconnect to long-term dollar purchasing power. This framework is **explanatory and descriptive, not predictive**; there are no war probabilities, alerts or composite scores. Survey respondent shares, if integrated later, must be labeled **Survey-based risk perception / 基于调查的风险认知**, never event probabilities.

- `#/external-shocks` opens the complete framework; `?topic=geopolitical|energy|food|supply-chain|shipping|history` opens a focused subsection. Unknown topics fall back to the overview. Existing routes and the six primary navigation items remain unchanged.
- Available evidence reuses validated FRED snapshots: EIA WTI monthly USD/barrel (`MCOILWTICO`), BLS energy CPI (`CPIENGNS`) and food CPI (`CPIUFDNS`). CPI cards show calculated year-over-year changes, not index levels. Observation dates, frequency, adjustment, publisher, retrieval date and source links remain visible. Links open the existing charts, tables and CSV exports. No ingestion or CBO calculation was replaced.
- In V0.8, GPR, FAO, GSCPI and SIPRI military burden are integrated. Natural gas and freight/shipping remain planned. The registry in `src/data/externalShocks.js` contains no synthetic values; future ingestion must validate definitions, sources, licensing and coverage. U.S. food CPI is not the FAO index; oil is not a shipping index.
- Eight bilingual, expandable historical cases: WWI, WWII, 1973 embargo, 1979 oil shock, 1990 Gulf War, 2008 commodities, 2020 pandemic and 2022 energy/food. Each covers shock, energy, food, supply chains, inflation, fiscal and monetary responses. Field-level citations identify BLS, Federal Reserve, IMF and GAO sources; unquantified channels and policy recommendations are distinguished from observed responses.
- Verification covers both languages, all topic links/fallbacks, exact snapshot-derived values, planned cards without numeric data, source attribution, homepage order, legacy routes and the existing fiscal/calculation/export checks. Responsive cards wrap; history uses native keyboard/touch disclosures and theme tokens.

### Routes and backward compatibility

New section routes: `#/dollar`, `#/history`, `#/research`; new detailed route: `#/purchasing-power`. `#/history` renders the same detailed regime content as the preserved `#/regimes` route. All former hash routes remain valid, including `#/monitor`, `#/since-1971`, `#/us-cpi`, `#/timeline`, `#/overview`, `#/map`, `#/drivers` and `#/sources`. Existing driver share parameters and map country/year parameters are unchanged.

Additional focused links only select an existing tool view:

- `#/monitor?group=inflation|monetary|market` filters existing cards; `#/monitor` still shows all eleven.
- `#/fiscal?metric=debt|deficit|interest&focus=outlook` opens the corresponding CBO metric; `focus=model` scrolls to the existing debt experiment.
- `#/map?focus=compare` and `#/sources?focus=health` target the preserved comparison and data-health sections.

Unknown metric/group choices fall back safely. Parameterized navigation remounts the selected view so back/forward and same-route links update consistently. No data APIs, chatbot, trading recommendations, investment forecasts or opaque score were added.

### Descriptive environment labels

Each label applies only to a named proxy, with the value, observation date, frequency, source and thresholds visible. The four ordered labels are Low / Moderate / Elevated / High. The lower bounds for the latter three bands are:

| Category | Proxy | Boundaries |
| --- | --- | --- |
| Inflation pressure | CPI year-over-year inflation | 2%, 4%, 6% |
| Fiscal pressure | FRED public debt / GDP | 60%, 90%, 120% |
| Monetary conditions | 10-year TIPS real yield level | 0%, 1%, 2% |
| Market confidence | 5y5y inflation compensation level | 2%, 3%, 4% |

These are disclosed editorial reading bands, not official targets, empirically validated danger thresholds, an overall confidence rating or a prediction. A high real-yield label means high real yields, not high inflation risk. 5y5y includes risk/liquidity premia and is not a literal 30-year forecast. Missing or stale observations receive no level label, using the existing data-age heuristics. The labels do not summarize every indicator within a category.

## V0.7 Part A: CBO long-term fiscal evidence

The Fiscal Pressure page now includes all three requested measures: public debt/GDP, deficit/GDP and net interest/GDP. Select a metric, inspect individual years, switch between full history / since 2000 / projections only, open the annual table or download all 95 years as CSV.

- **Historical actuals:** FY1962–FY2025 from CBO's February 2026 historical budget release.
- **Conditional projections:** FY2026–FY2056 from CBO's February 25, 2026 extended baseline.
- Historical values use a solid line. Projections use a dashed line and shaded region, with separate paths at the boundary. All use fiscal-year GDP; the older FRED/OMB calendar-year-ratio chart is retained as a separate expandable reference.
- The forecast assumes current laws generally remain unchanged and excludes effects of the Supreme Court's February 20, 2026 tariff ruling. It is not a current-policy update or a probability forecast. The editable debt experiment remains separate.
- Chinese/English labels, source links, version dates, accessible tables and keyboard year selection are included.

### CBO provenance and reproduction

CBO's [official data page](https://www.cbo.gov/data/budget-economic-data) links to its [open-data repository](https://github.com/US-CBO/cbo-data). We use the official CSV transformation, pinned to commit `284a95665f9f2f74ed1f482feb629b43fce323da`. The repository's `etl/config.py` maps its `2026-02` long-term vintage to `51119-2026-02-25-LTBO-Budget.xlsx`. The canonical [release notes](https://www.cbo.gov/publication/62044) supply the publication date and policy caveat. Direct Excel download was unavailable during ingestion; no third-party estimates or interpolated endpoints are used.

`data/fiscal/sources/` preserves both original CSVs and their field schemas. `data/fiscal/cbo-2026-02.json` holds the compact frontend snapshot, source URLs, retrieval date, pinned commit and SHA-256 source hashes. Downloaded files were verified against that commit's Git blob hashes. Run:

```sh
node scripts/import-cbo.mjs
npm run build
npm run verify
```

The importer validates dataset identity, fiscal-year frequency, percent-of-GDP units, unique keys, complete annual coverage, finite values and the revenue/outlays/balance identity. It negates the original CBO deficit/surplus balance: positive means deficit, negative means surplus. Underlying three-decimal precision is retained. Tests cover malformed inputs, sign errors, missing years, fiscal boundaries and exported provenance.

This is a reviewed **fixed forecast vintage**, not part of the weekly FRED/World Bank refresher. Importing a new CBO release requires reviewing source mappings, policy assumptions, expected coverage, hashes and numerical assertions. A 2056 observation is a projection horizon, never a freshness timestamp.

## V0.6: Dollar purchasing power

- Dollar-focused homepage with monthly CPI purchasing power since 1913 and seven selectable base dates.
- Eleven indicator cards: CPI, core PCE, 5y5y inflation compensation, public debt/GDP, deficit/GDP, net interest/receipts, Fed assets, M2 growth, nominal and real 10-year yields, and the broad trade-weighted dollar. Each shows dated observations, source links, recent history and data tables. No composite risk score or scenario probabilities are inferred.
- Dollar regime history separates monetary arrangements from overlapping policy and inflation episodes, including the 1971 gold-window closure and the 1973 transition to floating rates.
- Fiscal page separates historical public debt from verified CBO 2026/2036 endpoints and an editable, explicitly hypothetical debt model. V0.7 expands those endpoints into the complete official annual projections.
- Purchasing-power scenarios compare 2%, 3%, 4%, 5% and 7% inflation over 10/20/30 years, with customizable amounts, rates and horizons.
- Since 1971: exact-base-month nominal and CPI-adjusted food, shelter-service, oil and wage indexes. Missing baselines remain unavailable. Shelter CPI is not a house-price index; gold, property transaction prices and equity total returns are pending.
- Existing global map, comparison, drivers, CPI and sources remain under research navigation. Chinese/English and top-right light/dark controls are retained.

### Dollar methodology and ingestion

The purchasing-power formula is `amount × CPI[base] / CPI[end]`. The future scenario uses `amount / (1 + inflation)^years`, excluding investment returns, taxes and flows. The debt experiment uses `d[t] = d[t−1] × (1+i)/(1+g) + p`, where `i` is average nominal financing cost, `g` nominal GDP growth and `p` the primary deficit as a share of GDP. It does not model repricing, maturities or policy feedback and is not a CBO forecast.

`data/inflation/monitor.json` adds ten FRED series to the existing eight:

| Series | Frequency | Stored measure |
| --- | --- | --- |
| PCEPILFE | Monthly | Core PCE index, 2017=100, seasonally adjusted |
| T5YIFR | Daily | 5y5y forward inflation compensation, % |
| DGS10 / DFII10 | Daily | Nominal / inflation-indexed 10-year Treasury yield, % |
| DTWEXBGS | Daily | Broad nominal dollar index, January 2006=100 |
| WALCL | Weekly, Wednesday | Federal Reserve assets, millions USD |
| FYPUGDA188S | Annual | Publicly held federal debt / GDP, % |
| FYFSGDA188S | Annual | Federal surplus or deficit / GDP, % |
| FYOINT / FYFR | Fiscal annual | Net interest outlays / federal receipts, millions USD |

The display negates the fiscal balance so positive values mean deficits, divides Fed assets by 1,000 to show billions, and matches fiscal dates exactly for interest/receipts. Core PCE and M2 growth use the same month one year earlier. Daily holiday gaps remain null. Daily/weekly records are not relabeled as monthly readings. FRED fiscal ratios use calendar-year GDP and are not spliced into CBO fiscal-year projections. The Fed's 2% goal applies to headline PCE, while 5y5y compensation includes risk/liquidity premia and is not a 30-year forecast. All metadata and complete observations are retained in the committed snapshots.

## V0.5 features retained

- Weekly validated FRED and World Bank refreshes, including headline CPI, with manual dispatch and deployment in the same GitHub Actions run.
- Bilingual data health panel on Data Sources: last successful check, latest non-missing observation, source update date, snapshot retrieval date and missing-record counts.
- Revision summaries distinguish new observations, filled gaps, revised values and withdrawals. The panel retains 30 successful checks and up to 20 examples per series; full diffs remain in Git history.
- Share links on the Drivers page preserve topic, date range, inspected month and historical episode. Refresh and same-page navigation restore the settings. Invalid parameters fall back to safe defaults. Links do not freeze a data vintage.

### Automatic updates

`.github/workflows/deploy.yml` checks data daily at **08:00 America/Los_Angeles** (daylight-saving aware). Use **Run workflow → refresh: true** for an immediate check; use false to redeploy the committed snapshot. Ordinary pushes build and deploy without refreshing data.

```sh
npm run data:refresh
npm run build
npm run verify
```

The refresher downloads the original eighteen FRED series, the sixteen V0.9 productivity-family series, the V0.10 bank-deposit series, World Bank observations and definitions, and the three monthly external datasets (GPR, GSCPI, FAO). SIPRI remains a manually reviewed annual snapshot. Workbook ingestion additionally needs Python 3.12 and `python -m pip install -r scripts/requirements-external.txt`; set `WIL_PYTHON` to use a specific interpreter. Ordinary npm install/dev/build/verify require only Node and the committed snapshots. World Bank coverage extends through the previous calendar year, preserving the existing 217-country universe and map joins. Changed country membership requires manual review. Static country names and map geometry are maintained separately.

All downloads and validations finish in memory before any snapshot is replaced. Checks reject wrong series/units/adjustment, incomplete pagination, duplicate or missing date slots, regressed source dates, removed historical slots and withdrawals exceeding 5% of a series or country's available observations (one withdrawal is allowed for very sparse series). Parser tests run before replacing the bundle. Any write, build or verification error restores every original snapshot and the ledger. The refresh command runs build and verification itself; CI repeats those gates before deployment. GitHub commits and publishes only after build and tests pass; any download, validation, test or push failure prevents deployment and leaves the previous website available. CI logs identify failed attempts; the deployed panel only reports the last successful check, never a live success claim.

The bot commits the ten routinely refreshed snapshot/history files using the repository's `GITHUB_TOKEN`. That token's pushes do not trigger another push workflow, so the current run uploads `dist` and deploys it directly. Runs share the Pages concurrency group and do not cancel in-progress deployments. A conflicting main-branch update causes a normal push rejection; no force push is used. See [GitHub trigger behavior](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow).

GitHub scheduling can be delayed; repository policies may also block bot writes. The panel flags checks older than 48 hours and links to Actions for diagnosis. Observation-age hints use separate thresholds: over 3 months for monthly data or over 3 years for annual data, or over 14 days for daily/weekly data. These are site heuristics, not promises about provider release dates. No API keys are required; any future authenticated ingestion must keep secrets in GitHub Secrets and out of `VITE_` variables.

`scripts/refresh-data.mjs --input-dir <directory>` runs the same pipeline against downloaded inputs for offline reproduction. Input filenames are `wil-<FRED-ID>.html`, `wil-countries.json`, `wil-inflation.json` and `wil-indicator.json`, plus `gpr.xls`, `gpr.html`, `gscpi.csv`, `fao.csv` and `fao.html`. Test fixtures may provide `gpr-extracted.json`; production always reads the workbook. `npm run verify` exercises the real CLI in a temporary checkout, verifies failed-update preservation and revision accounting, and checks all views and share-link parsing.

## V0.4 features retained

- Three additional comparisons: shelter CPI, average hourly earnings and M2 growth versus headline CPI.
- Six bilingual topic tabs and four cited explanations of fiscal policy, exchange rates, supply chains and expectations.
- Explicit seasonal-adjustment labels and per-series empty-period notices. Historical windows remain selectable even when a newer series has no data.
- Housing services are distinguished from house prices, average wages from individual pay, and broad money from credit or money printing.

## V0.3 features retained

- A bilingual **Drivers** page with food CPI versus headline CPI, energy CPI versus headline CPI plus a separate WTI oil panel, and effective federal funds rate versus headline inflation.
- Monthly date controls, 5 / 10 / 50-year and full-history ranges, synchronized month inspection, accessible data tables, and CSV download with units in column names.
- Four historical windows (1973 oil shock, Volcker tightening, financial crisis, pandemic), episode shading, and links in both directions with the history timeline. Direct links such as `#/drivers?topic=rates&episode=volcker` work after refresh.
- Explicit U.S. scope, source coverage, update/retrieval dates, missing-data gaps, and explanations distinguishing co-movement from causal contributions.

## V0.2 features retained

- Real annual country inflation map, 1960–2025, with seven colour classes including deflation and missing data.
- Country details: selected-year value, separately dated latest value, historical high/low, and annual chart.
- Compare 2–5 countries/economies with adjustable dates, an observation slider, accessible table, and CSV download.
- Global overview with same-year coverage, six major economies, percentage-point changes, searchable and sortable rankings.
- World Bank WDI snapshot covering 217 countries/economies; 174 have observations in the default year, 2024.
- Natural Earth map geometry loads only when visiting the map. Small areas omitted from the simplified map remain available in the selector.

Retained from V0.1:

- Chinese / English UI with language persistence; blocked browser storage does not stop rendering.
- Light / dark appearance toggle in the top-right header, with system preference fallback and saved selection.
- Twelve cited historical chapters covering 1900–2026, with a year selector and highlighted eras on a U.S. inflation chart.
- U.S. CPI from January 1913 through August 2026, with index / year-over-year modes, 1 / 5 / 10 / 50-year and full-history views, a keyboard-accessible observation slider, and a data table.
- Purchasing-power calculator for arbitrary available months and nonnegative dollar amounts.
- Source registry distinguishing integrated data from planned providers.

The historical-event timeline and Drivers page use **U.S. data**, not a global aggregate. Country comparisons use annual World Bank data. Forecasts, global aggregates, and further drivers remain planned; see `docs/roadmap.md`.

## Driver data methodology

`data/inflation/drivers.json` contains seven public-domain monthly FRED source snapshots. The existing `fred.json` supplies headline CPI. Retrieval dates use UTC.

V0.4 baseline coverage is listed below; current coverage and retrieval dates are shown on Data Sources and stored in each snapshot.

| Series | Source | Stored measure | Baseline coverage |
| --- | --- | --- | --- |
| CPIUFDNS | BLS via FRED | Food CPI, 1982–1984=100, unadjusted | 1913-01–2026-08 |
| CPIENGNS | BLS via FRED | Energy CPI, 1982–1984=100, unadjusted | 1957-01–2026-08 |
| MCOILWTICO | EIA via FRED | Monthly WTI spot price, USD/barrel | 1986-01–2026-08 |
| FEDFUNDS | Federal Reserve Board via FRED | Effective federal funds rate, monthly average, percent | 1954-07–2026-08 |
| CUUR0000SAH1 | BLS via FRED | Shelter CPI, 1982–1984=100, unadjusted | 1952-12–2026-08 |
| CEU0500000003 | BLS via FRED | Average hourly earnings, USD/hour, unadjusted | 2006-03–2026-08 |
| M2SL | Federal Reserve Board via FRED | M2, billions USD, seasonally adjusted | 1959-01–2026-07 |

Food/energy indexes are converted to year-on-year rates by matching the same calendar month one year earlier. October 2025 is missing in both CPI component sources and stays null. FEDFUNDS is kept as a rate level; it is not transformed into a growth rate. Oil stays in USD/barrel in a separate panel with its own vertical scale and the same date axis. Before 1986 the WTI panel remains empty. Monthly averages cannot show daily futures-price extremes. Dates are aligned without interpolation, forward filling, or fabricated data. Food and energy are subsets of headline CPI; the charts do not estimate weighted contributions or causal effects.

Shelter, earnings and M2 levels are also converted to year-on-year growth with exact calendar matching. Shelter is missing October 2025. M2 uses seasonally adjusted levels while CPI and wages are unadjusted; August 2026 M2 remains empty. Wage growth begins March 2007 because it needs a prior-year observation. Shelter is part of CPI, while earnings and M2 are separate economic indicators. No causal effects are inferred.

Custom dates may span 1913 onward. Full-history and year-range presets are bounded by the selected topic's first calculable observation. Historical windows retain empty observations from newer sources and show an explicit notice if an entire series is unavailable. Episode shading is an editorial reading window, not an estimate of causal duration.

Manual refresh (all seven downloads must succeed):

```sh
curl -fL 'https://fred.stlouisfed.org/data/CPIUFDNS' -o /tmp/wil-CPIUFDNS.html
curl -fL 'https://fred.stlouisfed.org/data/CPIENGNS' -o /tmp/wil-CPIENGNS.html
curl -fL 'https://fred.stlouisfed.org/data/MCOILWTICO' -o /tmp/wil-MCOILWTICO.html
curl -fL 'https://fred.stlouisfed.org/data/FEDFUNDS' -o /tmp/wil-FEDFUNDS.html
curl -fL 'https://fred.stlouisfed.org/data/CUUR0000SAH1' -o /tmp/wil-CUUR0000SAH1.html
curl -fL 'https://fred.stlouisfed.org/data/CEU0500000003' -o /tmp/wil-CEU0500000003.html
curl -fL 'https://fred.stlouisfed.org/data/M2SL' -o /tmp/wil-M2SL.html
node scripts/import-drivers.mjs /tmp
npm run build
npm run verify
```

The importer parses only FRED metadata, observation table cells, and text overflow rows. It never executes downloaded scripts. It validates series identity, monthly frequency, adjustment, date bounds, numeric values, and complete consecutive months before replacing the snapshot. Review source revisions and update fixed snapshot assertions when refreshing. No API keys or runtime API calls are required.

## Global data methodology

`data/inflation/worldbank.json` stores WDI `FP.CPI.TOTL.ZG`, consumer price inflation (annual %), with source definition, original IMF IFS attribution, license, source update date, and UTC retrieval date. `data/countries/metadata.json` excludes regional and income aggregates. Every country has one slot per year from 1960 to 2025; missing values are `null`. Values preserve source precision and are rounded only for display.

The default is the latest year reaching 95% of the maximum coverage in the final five snapshot years. At the V0.4 baseline this was **2024 (174 / 217)**, with 165 values for 2025. Coverage and the default year are recomputed from each snapshot. Map, rankings, and major-economy cards use the selected year without substituting another year's value. Country details label the latest available observation separately. No global average is inferred from country rates. Annual rates must not be confused with monthly year-on-year U.S. CPI readings.

The map uses Natural Earth v5.1.2 1:110m country boundaries (public domain), excluding Antarctica, projected with D3's Natural Earth projection. World Bank codes are joined through Natural Earth's WB/ISO identifiers, with the explicit Kosovo `KSV → XKX` alias. Unmatched geometries are gray. Simplification omits some small countries/territories; all 217 statistical entities remain accessible through the selector. Boundaries are inherited from the source, not reconstructed for each historical year.

Charts use a linear scale, include extremes, and break lines at missing years. Rankings exclude missing values; changes are percentage points. CSV exports contain the selected countries and dates, source precision, and blank cells for missing values; the filename records the indicator. No runtime API requests or keys are needed.

To refresh manually, download the four public inputs (filenames matter):

```sh
curl -fL 'https://api.worldbank.org/v2/country?format=json&per_page=400' -o /tmp/wil-countries.json
curl -fL 'https://api.worldbank.org/v2/country/all/indicator/FP.CPI.TOTL.ZG?format=json&per_page=20000&date=1960:2025' -o /tmp/wil-inflation.json
curl -fL 'https://api.worldbank.org/v2/indicator/FP.CPI.TOTL.ZG?format=json' -o /tmp/wil-indicator.json
curl -fL 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_110m_admin_0_countries.geojson' -o /tmp/wil-world.geojson
node scripts/import-worldbank.mjs /tmp
npm run build
npm run verify
```

The original offline importer uses fixed 1960–2025 bounds and also maintains the country/map files. For routine updates use `npm run data:refresh`, which extends annual coverage automatically and validates before publishing. Numerical tests use deterministic fixtures so legitimate provider revisions and new observations can pass without changing tests.

## Data and calculations

`data/inflation/fred.json` contains a static snapshot of BLS CPI-U, all items, U.S. city average, published through FRED as `CPIAUCNS`. It is monthly, not seasonally adjusted, with base 1982–1984 = 100. Retrieved September 13, 2026, from https://fred.stlouisfed.org/data/CPIAUCNS; the source was updated September 11, 2026.

- Source metadata and 1,364 monthly records are stored together. October 2025 is missing in the source and is stored as `null`. No interpolation or invented values are used.
- Annual inflation compares the same calendar month: `(CPI[t] / CPI[t−12] − 1) × 100`. Both observations must be available. It is not an annual-average rate.
- Equivalent basket cost: `amount × CPI[end] / CPI[start]`.
- Purchasing power of the same nominal amount at the end, in starting-month prices: `amount × CPI[start] / CPI[end]`.
- The 2026 data is a partial year. No forecast values or pre-1913 reconstructions are included.
- Historical chapters in `data/history/events.json` contain bilingual summaries and source links. Era boundaries are explanatory choices, not estimates of causality.

The frontend bundles these JSON files at build time. Visitors do not need an API connection or key. Changes to a snapshot require a new build and deployment. Future authenticated ingestion belongs in a server-side or GitHub Actions process; `VITE_` variables are public browser configuration and must never contain secrets.

## Architecture

- `src/App.jsx`: app shell, language state, and page selection
- `src/main.jsx`: React entry point and global styles
- `src/components/`: shared page elements and purchasing-power calculator
- `src/pages/`: homepage, global overview, history, U.S. CPI, global map/comparison, drivers, sources
- `src/charts/`: reusable SVG time-series chart and visual placeholders
- `src/data/`: source registry and adapters for bundled snapshots
- `src/i18n/`: English / Chinese interface and educational copy
- `src/utils/`: hash navigation and pure numerical helpers
- `data/inflation/`: source-tagged observations
- `data/history/`: cited historical event records
- `data/countries/`: bilingual country metadata and attributed map geometry
- `public/`: untransformed static assets
- `scripts/verify.mjs`: data, calculations, JSX rendering, and built-path checks

CPI data, historical content, and rendering are independent so BIS, World Bank, IMF, and additional FRED series can be added without changing the navigation shell. New sources should retain identifiers, geography, units, frequency, adjustment, retrieval date, and attribution. Source records must distinguish observations from forecasts and reconstructions.

## GitHub Pages

The workflow in `.github/workflows/deploy.yml` runs on each push to `main`. It installs dependencies with `npm ci`, builds, executes `npm run verify`, and publishes `dist/`. Repository Pages source must be **GitHub Actions**.

Production base: `/world-inflation-lens/`

Website: https://ccesm.github.io/world-inflation-lens/

Views use hash routes such as `#/timeline` and `#/us-cpi`, so direct links and refreshes require no server rewrite rules. Import local assets from source or use `import.meta.env.BASE_URL` for future public assets; do not use unprefixed `/assets/...` URLs.

Verification runs every page in both languages and checks emitted asset paths. Browser QA should also cover chart modes, date and amount inputs, the year slider, language switching, and phone-sized layouts before release.
