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

## V0.1 features

- Chinese / English UI with language persistence; blocked browser storage does not stop rendering.
- Light / dark appearance toggle in the top-right header, with system preference fallback and saved selection.
- Homepage with three interactive inflation-transmission explanations and a shopping-basket example.
- Twelve cited historical chapters covering 1900–2026, with a year selector and highlighted eras on a U.S. inflation chart.
- U.S. CPI from January 1913 through August 2026, with index / year-over-year modes, 1 / 5 / 10 / 50-year and full-history views, a keyboard-accessible observation slider, and a data table.
- Purchasing-power calculator for arbitrary available months and nonnegative dollar amounts.
- Source registry distinguishing integrated data from planned providers.

The global overview and map remain V0.1 scaffolding. The plotted historical series is **U.S. CPI**, not a global aggregate. Global comparisons, map values, forecasts, and additional drivers belong to later releases; see `docs/roadmap.md`.

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
- `src/pages/`: homepage, overview, history, U.S. CPI, map placeholder, sources
- `src/charts/`: reusable SVG time-series chart and visual placeholders
- `src/data/`: source registry and adapters for bundled snapshots
- `src/i18n/`: English / Chinese interface and educational copy
- `src/utils/`: hash navigation and pure numerical helpers
- `data/inflation/`: source-tagged observations
- `data/history/`: cited historical event records
- `data/countries/`: reserved country metadata
- `public/`: untransformed static assets
- `scripts/verify.mjs`: data, calculations, JSX rendering, and built-path checks

CPI data, historical content, and rendering are independent so BIS, World Bank, IMF, and additional FRED series can be added without changing the navigation shell. New sources should retain identifiers, geography, units, frequency, adjustment, retrieval date, and attribution. Source records must distinguish observations from forecasts and reconstructions.

## GitHub Pages

The workflow in `.github/workflows/deploy.yml` runs on each push to `main`. It installs dependencies with `npm ci`, builds, executes `npm run verify`, and publishes `dist/`. Repository Pages source must be **GitHub Actions**.

Production base: `/world-inflation-lens/`

Website: https://ccesm.github.io/world-inflation-lens/

Views use hash routes such as `#/timeline` and `#/us-cpi`, so direct links and refreshes require no server rewrite rules. Import local assets from source or use `import.meta.env.BASE_URL` for future public assets; do not use unprefixed `/assets/...` URLs.

Verification runs every page in both languages and checks emitted asset paths. Browser QA should also cover chart modes, date and amount inputs, the year slider, language switching, and phone-sized layouts before release.
