# World Inflation Lens — agent guide

Shared instructions for every coding agent working in this repo (Codex, Claude Code, others). `CLAUDE.md` imports this file, so edit **this file** and keep both agents on the same page.

## What this project is

A bilingual (English / 中文) Vite + React research site on two related questions over the next 20–30 years: the U.S. dollar's **domestic purchasing power**, and its **international role** (reserves, finance, trade, payments). Global inflation is supporting context. Published at https://ccesm.github.io/world-inflation-lens/ via GitHub Pages.

Current application version: see `package.json` (the version source of truth; release preparation 1.4.0, "AI Infrastructure"). Product history and next steps: `docs/roadmap.md`. Per-release detail: `docs/v*.md`. Start with `README.md` for the full feature and methodology record.

## Commands

Node.js >= 22.12 locally (`.nvmrc` = 22). CI build uses Node 24.19.0.

```sh
npm ci                  # install (use ci, not install, to respect the lockfile)
npm run dev             # Vite dev server
npm run build           # production build to dist/
npm run verify          # full verification suite — must pass before any push
npm run preview -- --port 5187 --strictPort   # serve the build locally
npm run data:refresh    # official-data refresh (network; CI normally does this)
npm run notify:preview  # dry-run of the daily email; sends nothing
npm run verify:browser  # real-browser acceptance (needs WIL_BROWSER_URL, WIL_PLAYWRIGHT_MODULE, WIL_CHROME_EXECUTABLE)
```

Signal Engine (isolated package in `research/signal-engine/`, own `package.json`):

```sh
npm ci --prefix research/signal-engine --ignore-scripts --no-audit --no-fund
npm run signal:test            # engine tests
npm run signal:test:pipeline   # shadow pipeline + archive tests
npm run signal:test:public     # public-summary tests
npm run signal:public          # generate the public Signal summary
```

Workbook ingestion (GPR/FAO etc.) also needs Python 3.12 and `pip install -r scripts/requirements-external.txt`. Ordinary install/dev/build/verify need only Node and the committed snapshots.

## Layout

- `src/` — app. `App.jsx` shell, `pages/`, `components/`, `charts/` (SVG), `data/` (registries + adapters over bundled snapshots), `i18n/` (EN/ZH copy), `utils/` (hash routing, numeric helpers).
- `data/` — committed, source-tagged JSON/CSV snapshots (`inflation/`, `fiscal/`, `external/`, `productivity/`, `digital-money/`, `international-dollar/`, `countries/`, `history/`, `updates/`).
- `scripts/` — importers, refresh pipeline (`refresh-data.mjs`, `lib/`), notification, status publishing, and the many `verify-*.mjs` checks wired into `npm run verify`.
- `research/signal-engine/` — private offline Signal Engine prototype. **The production app never imports it.**
- `docs/` — specs, methodology, acceptance reports, roadmap.
- `.github/workflows/deploy.yml` — daily refresh (17:40 America/Los_Angeles), build, verify, deploy, email, status publication.

## Non-negotiable project rules

- **No composite score, no probabilities, no investment signals or recommendations.** The Signal Engine shows seven independent factor assessments only.
- **Keep observations, official conditional projections (e.g. CBO) and hypothetical scenarios visibly distinct.** Correlation is never presented as measured causation.
- **Never fabricate, interpolate, forward-fill or splice data.** Missing values stay missing (`null`). Keep source ID, units, frequency, adjustment, retrieval date and attribution with every series.
- **Everything user-facing is bilingual.** Any new UI string needs both English and Chinese in `src/i18n/`.
- **No API keys or runtime data APIs in the browser.** Economic data is bundled at build time. `VITE_` variables are public; secrets live only in GitHub Actions secrets.
- **Routes are hash routes** (`#/research/signal-engine`, etc.); legacy routes must keep working. The Pages base path is `/world-inflation-lens/` — use `import.meta.env.BASE_URL` for public assets, never unprefixed `/assets/...`.
- **Do not hand-edit refreshed snapshots.** The bot commits `data/inflation/{fred,drivers,monitor,worldbank}.json`, `data/external/{gpr,gscpi,fao-food}.json`, `data/productivity/series.json`, `data/digital-money/bank-deposits.json`, `data/international-dollar/`, and `data/updates/history.json`. Change them only through the importers/`npm run data:refresh`, which validate whole bundles and roll back on any failure. Fixed-vintage data (CBO, SIPRI, publication estimates) is reviewed manually.
- **Restricted Signal Engine shadow artifacts are never committed or deployed** (`research/signal-engine/production-artifacts/` is gitignored).
- Passing local acceptance does **not** authorize merging to `main` or deploying to production; wait for the owner's explicit go-ahead.

## Git workflow (two agents + a bot share this repo)

- `main` deploys to GitHub Pages on every push. **Never force-push.** Do not push feature work directly to `main` unless the owner asks.
- A GitHub Actions bot pushes data-refresh commits to `main` daily, so `main` moves under you: `git fetch origin main` and rebase/merge before pushing, and push only from an up-to-date base.
- Branch prefixes identify the author: Codex uses `codex/*` (existing feature branches include `codex/international-dollar-evidence`, `codex/signal-engine-*`, `codex/public-signal-engine-ui`, `codex/v1-dual-dollar-architecture`, and several AI-labor-market branches); Claude Code uses `claude/*`. Do not push to the other agent's branches without being asked.
- `system-status` is a bot-written, status-only branch. Do not touch it.
- Before handing work off, leave a short note in the PR description or `docs/` saying what changed, what was verified, and what is still open, so the other agent can pick up without re-deriving it.
