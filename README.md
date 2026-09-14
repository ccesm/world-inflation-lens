# World Inflation Lens · 全球通胀透视

A bilingual Vite + React site that connects inflation data, historical context, and everyday purchasing power.

## Run locally

Use Node.js 22.12 or later (Node 22 LTS is configured for GitHub Actions).

```sh
npm install
npm run dev
npm run build
npm run verify
```

`npm run preview` serves the production build locally. If a port is already in use, specify a free port, for example `npm run preview -- --port 5187 --strictPort`.

## V0.2 features

- Real annual country inflation map, 1960–2025, with seven colour classes including deflation and missing data.
- Country details: selected-year value, separately dated latest value, historical high/low, and annual chart.
- Compare 2–5 countries/economies with adjustable dates, an observation slider, accessible table, and CSV download.
- Global overview with same-year coverage, six major economies, percentage-point changes, searchable and sortable rankings.
- World Bank WDI snapshot covering 217 countries/economies; 174 have observations in the default year, 2024.
- Natural Earth map geometry loads only when visiting the map. Small areas omitted from the simplified map remain available in the selector.

Retained from V0.1:

- Chinese / English UI with language persistence; blocked browser storage does not stop rendering.
- Light / dark appearance toggle in the top-right header, with system preference fallback and saved selection.
- Homepage with three interactive inflation-transmission explanations and a shopping-basket example.
- Twelve cited historical chapters covering 1900–2026, with a year selector and highlighted eras on a U.S. inflation chart.
- U.S. CPI from January 1913 through August 2026, with index / year-over-year modes, 1 / 5 / 10 / 50-year and full-history views, a keyboard-accessible observation slider, and a data table.
- Purchasing-power calculator for arbitrary available months and nonnegative dollar amounts.
- Source registry distinguishing integrated data from planned providers.

The historical-event timeline still uses **U.S. CPI**, not a global aggregate. Country comparisons use annual World Bank data. Forecasts, global aggregates, and additional drivers remain planned; see `docs/roadmap.md`.

## Global data methodology

`data/inflation/worldbank.json` stores WDI `FP.CPI.TOTL.ZG`, consumer price inflation (annual %), with source definition, original IMF IFS attribution, license, source update date, and UTC retrieval date. `data/countries/metadata.json` excludes regional and income aggregates. Every country has one slot per year from 1960 to 2025; missing values are `null`. Values preserve source precision and are rounded only for display.

The default is the latest year reaching 95% of the maximum coverage in the final five snapshot years: **2024 (174 / 217)**. 2025 remains selectable with 165 values; the U.S. 2025 value is missing in this snapshot. Map, rankings, and major-economy cards use the selected year without substituting another year's value. Country details label the latest available observation separately. No global average is inferred from country rates. Annual rates must not be confused with monthly year-on-year U.S. CPI readings.

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

The importer rejects incomplete pagination, duplicate records, invalid values, or missing country-year slots before writing. Review data revisions and update snapshot-specific test expectations against the source before committing. Extending beyond 2025 requires updating import bounds and the query together. Scheduled ingestion is deferred.

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
- `src/pages/`: homepage, global overview, history, U.S. CPI, global map/comparison, sources
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
