# AI CapEx & Monetization — Phase 2C public integration

This feature branch starts from production `9382a73cdf967aa2e79ea500a09e1cf8aa71ae64`, not the research stack. It adds a fixed-vintage research page at `#/research/ai-capex`. Initial feature qualification used application version **1.2.0**. Owner-approved release preparation now uses **1.3.0**; see [release notes](v1.3-ai-capex-monetization.md). No merge, deployment or operational activation is included.

## Qualified source and reproducibility

Research sources:

- Phase 2B: `afbc5da5b718d86c48d0e48d31a1eba456a26e09`.
- Accounting repair: `ad6ebf96e2bf59145f31120dd02cdcc3fbca24b7`.
- Rebuilt monitor content SHA-256: `51a55bb8b9c585026ab37898746695060b3dbb3a7c6aaa83efb5645cbe91a2d4`.
- Rebuilt qualified public-draft SHA-256: `1e74e04a1f32ae2d60c3429c14b215560ec085234d783bc52d9bbbe2d7079a2e`.
- Rebuilt quarterly panel SHA-256: `4fa9e344811871c397d81ae74832d1c35d687c7ec194e35154a4891f46b2b304`.

The Phase 2B `produce()` runner was executed with its pinned inputs and default identity enforcement; `validatePublic()` independently validated the draft against the rebuilt monitor and accepted inputs. Only a selected extraction packet was used to create the production snapshot. No research code, raw files, external caches, full panel, generations, schemas or research test fixtures were copied into the delivery branch.

For independent reproduction, extract `research/ai-capex-monetization/` from the exact Phase 2B commit into an **isolated temporary directory**, leaving the production checkout unchanged. In that isolated source, run the existing monitor tests and `monitor/scripts/run.mjs`. Then use its existing functions:

```js
import fs from 'node:fs'
import {produce} from './research/ai-capex-monetization/monitor/scripts/run.mjs'
import {bytes} from './research/ai-capex-monetization/scripts/contract.mjs'
const r = produce() // Includes pinned public semantic validation; do not set pin:false.
const packet = {
  public: r.pub,
  history: r.monitor.content.records.filter(r =>
    ['cashInvestmentIntensity', 'fcfMargin', 'operatingMargin'].includes(r.metric)),
  accounting: r.monitor.content.accounting,
  identity: r.identity,
}
fs.writeFileSync('/tmp/wil-capex-qualified-2b.json', bytes(packet))
```

The packet bytes and canonical content must both hash to `699ff1d5ced2f63648ca58dbd7e21ffaa2781b38bddb98c5562375bd6595e95b`. From the production-integration checkout:

```sh
node scripts/ai-capex-snapshot.mjs /tmp/wil-capex-qualified-2b.json
npm run ai-capex:test
npm run build
npm run verify
```

The extractor rejects unqualified packet identity, conflicting source identities and changed boundaries. Repeating extraction produces identical bytes. The packet is **not** required for ordinary installation, build, verification or browser runtime and is not committed. Do not change the fixed public snapshot by hand or bypass the pin to extend the vintage.

## Public data and interpretation boundaries

`src/data/ai-capex/monitor.json` contains **110,484 bytes**, with raw SHA-256 `8891e6b7dca9317e3d2400bdd3749c54425ff1c0385c1f2151e2593c92227c3a`. The contract and verification tests bind this exact file. It contains four companies in neutral fixed order, a compact latest metric whitelist, three selected quarterly chart series, sparse disclosure events, native definition identifiers and deduplicated official source links/hashes.

The economic window is **2019Q1–2026Q2**. `dataThrough=2026Q2` identifies the latest economic quarter; `asOf=2026-07-30` identifies the qualified public disclosure basis. Event/publication dates and quarter-context reference dates are separately visible. Neither date is a processing timestamp. The accounting history is a **current-vintage reconstruction** and can incorporate later comparative disclosures; it is not a true historical real-time availability record.

| 2026Q2 company | Cash PP&E / revenue | Company-convention FCF margin | Operating margin | Cash investment YoY | FCF margin YoY |
|---|---:|---:|---:|---:|---:|
| Microsoft | 39.78% | 21.82% | 45.11% | +109.63% | −11.63 pp |
| Alphabet | 37.50% | −4.89% | 34.03% | +100.14% | −10.38 pp |
| Amazon | 26.46% | −3.83% | 13.69% | +69.20% | −4.52 pp |
| Meta | 49.53% | 1.29% | 30.88% | +82.10% | −16.70 pp |

These are consolidated accounting observations, **not AI returns**. Free-cash-flow compression can also reflect working capital, tax timing, compensation, acquisitions and non-AI investment. No company ranking or layer average is calculated.

Five evidence layers remain distinct: investment intensity, monetization, operating economics, accounting/depreciation and cash conversion. Ten page sections progressively expose current observations, charts, sparse milestones, guidance, boundaries and provenance. Contextual links connect AI & Productivity and AI & Labor Transition without combining their conclusions.

### Native accounting and gaps

- Microsoft cash PP&E is not lease-inclusive native CapEx. `UNRECONCILED_NATIVE_CAPEX_SCOPE` remains visible; no fabricated reconciliation. Intelligent Cloud is broader than Azure; recasts limit automated historical growth comparisons.
- Alphabet cash PP&E uses its native cash investment definition. Pure quarterly PP&E depreciation is incomplete historically; annual values are not quarterized. Cloud recasts and the 2026Q1 short-term-contract RPO definition break remain visible.
- Amazon uses **net** cash PP&E (gross purchases less proceeds/incentives). Leases remain separate. Quarterly reconstructed company-convention FCF is not trailing-year FCF.
- Meta gross/net changes create disconnected chart histories. Ineligible/noncomparable historical points are `null` with their qualification retained, not synthetic zeroes. Its FCF chart has 11 comparable plotted quarters in the 30-quarter full window. The 5.5-year versus six-year useful-life wording conflict remains unresolved.

Charts implement cash PP&E/revenue, FCF margin and consolidated operating margin. Native cloud **latest levels** are separate cards; a historical cloud chart is intentionally omitted because comparison limitations would dominate it. Each chart has a company selector, reading-window selector, zero-inclusive axis, source-linked keyboard-accessible data table and explicit coverage. Missing and noncomparable values remain gaps; different definition bases do not join.

### Sparse evidence, not synthetic quarterly revenues

- Microsoft >$37bn annualized AI revenue run-rate (2026Q1 context).
- Amazon >$25bn annualized AWS AI business run-rate (2026Q2 context).
- Microsoft >30 million paid Microsoft 365 Copilot seats (2026Q2 context).

Financial milestones explicitly retain `RUN_RATE`; seats retain their count. No division by four, interpolation, seats×price or addition to cloud revenue occurs. Intelligent Cloud, Google Cloud and AWS latest operating margins are 40.59%, 35.59% and 39.36% respectively, with distinct scope warnings. AWS YoY revenue and margin changes are +36.79% and +6.45 pp. Meta monetization is embedded in advertising/recommendations and is management attribution, not a measured counterfactual.

Alphabet pure PP&E depreciation is $7.104bn, +42.14% YoY; depreciation/revenue is 5.93%, +0.75 pp, and cash PP&E/pure depreciation is 6.32×. Broad D&A is not substituted for missing pure depreciation at other companies.

Microsoft commercial RPO ≈$678bn and Google Cloud RPO ≈$513.9bn are separate disclosure-date backlog contexts, not revenue or cash return. Microsoft's supply constraint is explicitly dated to its July 29 disclosure. Calendar-2026 guidance is visually separate: Microsoft ≈$175bn with lease-classification caveat; Meta $130–145bn with no midpoint.

All **120** company-quarter recognized AI-only revenue observations remain `UNAVAILABLE`. AI invested capital, attributable cash returns, ROI/ROIC and payback remain `NOT_IDENTIFIED`; unavailable is not zero.

## Acceptance and protected behavior

`npm run verify` includes the new deterministic public-contract suite and bilingual server-rendered acceptance. It checks exact numerical values, publication/quarter semantics, run-rate separation, RPO/guidance separation, accounting limitations, chart breaks, invalid-snapshot fail-closed behavior, source identity, bilingual parity and restricted-data exclusion. Existing full verification continues to check economic calculations, public Signal binding, routes, AI Labor observation mode, notification behavior and provenance.

Browser acceptance command (same local tooling/environment convention as existing acceptance):

```sh
npm run preview -- --host 127.0.0.1 --port 5187 --strictPort
# In another terminal, supply WIL_PLAYWRIGHT_MODULE and WIL_CHROME_EXECUTABLE:
node scripts/verify-ai-capex-browser.mjs
```

The browser matrix covers 320/390/1280px × EN/ZH × light/dark, single H1, neutral order, chart descriptions/table fallback, keyboard navigation and table scrolling, definition gaps, related links, legacy Fiscal and Signal routes, Home lazy-loading and no new economic runtime API requests (existing font assets and status-only service preserved). Local screenshots/reports remain in ignored `.refresh/ai-capex-browser/`.

Production economic snapshots, public Signal artifact/engine/conclusions, workflows, email behavior and monitor activation are unchanged. Release preparation changes only application version metadata and release documentation. AI Labor remains **OBSERVATION MODE**. Existing AI Labor and productivity pages receive only contextual links. No public file or route depends on the research stack being present.

## Release handoff

See the PR for final commit and acceptance results. This is fixed-vintage public evidence, not an operational refresh. Phase 2D needs separate source/refresh qualification before any filing automation, schedule, email or live API is considered. The owner approved 1.3.0 version preparation; merge and deployment remain pending. Known inherited dependency audit: the unchanged lockfile includes the development dependency `source-map-js` below 1.2.2 with GHSA-68fv-2mgg-jv7q; no dependency upgrade is included in this feature.

### Completed local qualification

- `npm ci`: passed using the unchanged committed lockfile.
- Production build and full `npm run verify`: passed.
- New public contract: **32 passed, 0 failed, 0 skipped**, plus EN/ZH rendered page assertions and invalid-snapshot fail-closed checks.
- Production-browser matrix: **12 surfaces** (320/390/1280 × EN/ZH × light/dark); keyboard controls/table access, chart descriptions, disconnected Meta history, related/legacy/Signal navigation and Home lazy isolation passed. Viewport screenshots were visually inspected at 320px EN/light, 390px ZH/dark and 1280px EN/light. This is targeted accessibility acceptance, not a full WCAG certification.
- Snapshot extraction repeated with byte-identical **110,484-byte** output and the same SHA-256.
- Protected-path comparison against the recorded production base: no changes to `data/`, `public/`, `research/signal-engine/`, `.github/` or `package-lock.json`. AI Labor's public snapshot remains observation-only with monitor disabled.
- Vite retains its existing large-chunk warning for other bundles. The AI CapEx page/data is a separate lazy route chunk; browser requests confirm it is absent from Home loading.

No feature-specific HIGH or MEDIUM issue is known after these checks. The inherited development-dependency advisory above remains outside this feature's scope. Merge/deployment approval and any separate Phase 2D operational qualification remain required.

Additional protected regressions: the existing AI Labor browser suite passed all 12 surfaces. An optional `npm run signal:test:public` run exposed an **inherited clock fixture** issue: all 84 tests failed in the shared initialization hook because it sets acceptance to `2026-10-04T18:00:00Z`, before the latest main snapshot's retrieval metadata. The independent engine reports `METADATA_AFTER_SNAPSHOT_ACCEPTANCE:retrievedAt`. Both controls targeted unchanged main `9382a73...`: the old clock failed closed; a chronologically valid October 7 acceptance produced `SUCCESS_NEW` and a validated artifact. No Signal source/test was changed. Maintaining that fixture in a separate task is recommended; the ordinary public-binding verification and full `npm run verify` pass.

Latest measured lazy chunk: **146,532 bytes JS / 29,605 bytes gzip**, plus **2,955 bytes CSS / 986 bytes gzip**. Initial main JS is 867,859 bytes / 228,432 bytes gzip; CapEx history is absent from Home requests. These are build measurements, not a claim of full page transfer size.
