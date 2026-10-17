# China monetary strategy article — publication record

The owner authorized website publication on 2026-10-17 after local Phase B1.2 validation. This release publishes **China's Long-Term Monetary Strategy / 中国的长期国际货币战略** at `#/research/global-monetary-order/china-strategy`, with a public Global Monetary Order research index at `#/research/global-monetary-order`. Research navigation and its tool directory expose the index.

用户于 2026-10-17 授权上传网站。公开页面保留完整双语文章、机制图、历史节点、政策／结果对照表、来源链接与不确定性标注。未完成授权审核的五图本地预览不随本文上线；原目录的 Phase A、B1、B1.2、AI CapEx 与其他研究材料全部保留。

## Changes and boundaries

- Publish the reviewed bilingual article, five-part mechanism diagram, six dated milestones, seven-row table, three conditional scenarios and sixteen institutional references.
- Replace local-preview labels with public research labels. The research cutoff remains 2026-10-17; publication does not extend statistical observation periods.
- Add a four-topic research index linking the article and existing International Dollar and Monitor evidence. No local-only five-chart module is imported into production.
- Preserve the source audit, including all eleven original references, institutional replacement links, fourteen editorial corrections and remaining research/licensing questions. See `china-monetary-strategy-source-audit.json`.
- Add production-route, bilingual, source, accessibility and responsive browser checks. Include article unit/SSR checks in `npm run verify`.
- No numerical dataset, refresh importer, source contract, dependency, PILOT/HOLD classification, Signal Engine behavior or other research module changes. Application version remains 1.4.1; this is an additional research article.

## Release preparation

Prepared from current remote main (`3dbf9353ada22cd33ac64ed158f3fd29e9ec3b66`) in a clean independent checkout, on `codex/china-monetary-strategy-publication`. The original working directory and its untracked files are preserved byte-for-byte. This also permits the existing AI CapEx test to validate the actual release file set without deleting the owner's research directory.

The first clean clone was shallow; an existing international-data preservation test required historical commit `494ae75`. Fetching full history resolved that environment limitation. The full verification suite subsequently passed, including all 39 AI CapEx checks. No tests were weakened or skipped.

## Validation

- `npm run build`: passed; existing JSON-import attribute and chunk-size warnings remain.
- `npm run verify`: passed, including all 28 routed views, protected data/source contracts, Signal isolation, AI Labor, AI CapEx, AI Infrastructure and five new bilingual/source/article checks.
- `node scripts/verify-china-strategy-browser.mjs`: passed twelve language/theme/size combinations (320/390/1280px), source links, evidence classifications, section/citation keyboard focus, language switches, public discovery and the absence of the local-only five-chart preview.
- `npm run verify:browser`: passed 336 route visits, 12 home displays, 18 behavior checks, 3 keyboard checks and 2 status fixtures; zero recorded browser errors. Both new research routes and all old routes were checked in both languages, both themes and all three viewport sizes.
- `git diff --check`: passed.

Browser reports and screenshots are retained locally in `.refresh/china-strategy-publication/`. Deployment completion and the public-page smoke check are recorded in the task handoff after GitHub Pages finishes.

## Changed files

`README.md`, `package.json`, `src/App.jsx`, `src/utils/routing.js`, `src/i18n/architecture.js`, `src/i18n/monetaryResearch.js`, `src/i18n/chinaMonetaryStrategy.js`, `src/pages/MonetaryOrderResearch.jsx`, `src/pages/ChinaMonetaryStrategy.jsx`, `src/global-monetary-order.css`, `src/china-monetary-strategy.css`, `scripts/tests/china-monetary-strategy.test.mjs`, `scripts/verify-china-strategy-browser.mjs`, this record and `docs/china-monetary-strategy-source-audit.json`.
