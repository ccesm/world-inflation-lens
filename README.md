# World Inflation Lens

V0.1 is a bilingual, responsive Vite + React site. The CPI chart and world map are visual placeholders; the site does not fetch live data.

## Local development

```sh
npm install
npm run dev
npm run build
```

## GitHub Pages

Vite uses `/world-inflation-lens/` as its production base path. Navigation uses URL hashes, so direct links to individual views work on GitHub Pages without rewrite rules. The workflow in `.github/workflows/deploy.yml` runs on every push to `main`, builds with `npm ci` and `npm run build`, and deploys `dist/`.

Set the repository's Pages source to **GitHub Actions** under **Settings → Pages**. Once this project is pushed to the `world-inflation-lens` repository, the site will be served at `https://ccesm.github.io/world-inflation-lens/`. No API keys are needed for V0.1; never put secrets in `VITE_` environment variables because Vite includes them in the browser bundle.

## Structure

- `src/App.jsx`: application shell and page selection
- `src/pages/`: the six V0.1 views
- `src/components/`: shared page elements
- `src/charts/`: decorative chart and map placeholders
- `src/i18n/translations.js`: English and Chinese interface text
- `src/utils/routing.js`: GitHub Pages-compatible hash navigation
- `src/data/sources.js`: planned provider registry
- `data/inflation/`, `data/history/`, `data/countries/`: reserved for future datasets and metadata
- `public/`: static assets
- `src/styles.css`: responsive visual system

Future data adapters can live under `src/data/` with series metadata (provider, identifier, units, frequency, and attribution) kept separate from presentation components.
