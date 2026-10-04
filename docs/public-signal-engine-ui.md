# Public Signal Engine presentation — feature review

Starting production main: `9ff9939bcd464b7ffc8c674c67292d0ec99f7ce1`.
Feature branch: `codex/public-signal-engine-ui`. Production version stays **1.0.0**; recommend **1.1.0** only after feature review and release approval. This task does not merge, deploy, send email, or change repository secrets/activation settings.

## Public contract and lifecycle

`docs/signal-public-summary.schema.json` defines `signal-public-summary/1`. `src/utils/signalPublicContract.js` additionally validates canonical factor ownership/order, state vocabulary, availability, evidence-quality counts, actual sensitivity, consecutive native confirmation periods and the range of latest observation endpoints. Both reject additional fields; strings and response bytes are bounded. The backend independently compares the projection with the verified engine run, including the deterministic conclusions and brief.

The intentionally public fields are schema/status, a short economic snapshot reference and content hash, frozen rule/implementation versions, evidence-period range, factor/valid counts, quality counts, sensitive IDs, bilingual brief/conclusions, and seven narrow factor records. A factor exposes ID, state, quality, sensitivity, observation period, confirmation window and reviewed interpretation. Source links, labels, limits and rule explanations come from a reviewed presentation catalogue.

There is **no full lineage, raw archive, local path, acceptance receipt, credential, email address, workflow/run diagnostic, or private-store pointer** in this file. Internal `signal-public-shadow/1` remains restricted despite its older name. Public and email text share `scripts/lib/signalConclusions.mjs`; browser code imports neither this generator nor the engine. Home brief rules are explicit state composition, not truncation. Every factor state is covered, including missing and low-quality evidence, with narrower clauses for the current configuration.

To generate locally:

```sh
npm ci
npm ci --prefix research/signal-engine
npm run signal:public
npm run build
npm run verify
npm run signal:test:public
```

The public command first atomically writes **UNAVAILABLE**, then identifies the committed economic bundle and uses the unchanged production acceptance adapter. That adapter requires genuine preflight build/verify results; it does not fabricate a receipt to bypass the frozen acceptance safeguards. The bootstrap build therefore contains UNAVAILABLE. After acceptance, the unchanged engine evaluates in a fresh external temporary restricted store, performs semantic/provenance validation, and independently revalidates the stored interpretation. Only then are the allowlisted summary, conclusions and brief written for the **final** website build. Temporary-store cleanup is best effort; a bounded warning does not block deployment or expose restricted diagnostics. GitHub runner teardown discards any remaining temporary storage.

The production build job installs the isolated engine dependencies and runs this command after recording the exact accepted snapshot, before its final build/verify. Build Node uses the same 24.19.0 runtime as the existing shadow job. Interpretation/dependency failures produce a safe UNAVAILABLE file and exit successfully; independent final economic build/verify remain mandatory. An inability to replace stale public content stops publication, because publishing a stale CURRENT interpretation would violate failure isolation. Existing shadow monitoring, activation variable, safe email handoff and Gmail infrastructure remain intact.

The committed file is an **UNAVAILABLE bootstrap**, not a dated generated interpretation. Review a CURRENT state after running the command above. Generated CURRENT output is not a new economic snapshot and should not be committed as release history.

The Vite build embeds the accepted economic-data hash **and** a SHA-256 digest of the exact final UTF-8 bytes in `public/data/signal-engine/current.json`. `signal:public` writes the expected digest, status and full accepted snapshot commit to a separate ignored build record at `.refresh/signal-public-build.json`; the JSON never asserts its own digest. The build and final verify compare that record with the actual public bytes, HEAD and the workflow's expected snapshot. They also reconstruct every bilingual brief, conclusion and factor interpretation through the shared deterministic generator. A clean checkout can build the committed strict UNAVAILABLE bootstrap without a generated record; CURRENT requires the record.

The browser fetches raw bytes using the artifact digest as a query key, enforces the size limit, hashes the bytes with Web Crypto, checks the bundled digest, and only then parses and validates the JSON. It requires the bundled status, snapshot reference and economic hash. Thus an old CURRENT response cannot pass a new UNAVAILABLE build with unchanged economic data. Fetch aborts after eight seconds and fails closed for missing files, HTTP errors, HTML responses, malformed JSON, unsupported schema, restricted fields or identity mismatch. Archive builds without Git metadata show unavailable rather than inventing an input identity.

## UI and interpretation

`SignalEngineBrief` is the first child of Home, immediately before the existing `ia-hero`. Its labels are semantic text within a named section, so the hero remains the first document heading (H1). It shows two short paragraphs, valid count, secondary neutral quality/sensitivity information, distinct latest observation endpoints, and the full-page CTA. It has no gauge, composite verdict, red/green classification or probability. Full qualifiers are deferred to the research page.

`#/research/signal-engine` is lazy-loaded. Research secondary navigation and Research Map link to it; the six primary sections remain unchanged. The page contains scope, domestic conclusion and four cards, international conclusion and three cards, quality, sensitivity, limitations, methodology and sources. Cards link back to Monitor, AI & Productivity, External Shocks or International Dollar evidence. This remains downstream interpretation, not a replacement evidence source.

Public EN/ZH labels retain canonical internal IDs:

| ID | English | Chinese |
|---|---|---|
| inflation-persistence | Core PCE Inflation Momentum | 核心 PCE 通胀动能 |
| observed-productivity | Observed Productivity | 已观测生产率 |
| supply-chain-pressure | Global Supply-Chain Pressure Trend | 全球供应链压力趋势 |
| policy-rate-direction | Effective Policy-Rate Direction | 有效政策利率变动方向 |
| reserve-share | USD Reserve-Share Trend | 美元外汇储备份额趋势 |
| foreign-treasury-holdings | Foreign Treasury Holdings Trend | 外国持有美国国债规模趋势 |
| offshore-usd-credit | Offshore USD Credit Outstanding Trend | 美国境外美元信贷余额趋势 |

TRANSITION displays “Direction unconfirmed / 方向尚未确认” and the complete confirmation-window explanation: neither the directional band nor the quiet band is satisfied. It does not imply a reversal or turning point. Quality reflects completeness, timing, revisions and source quality, not correctness probability. Sensitivity badges are generated from actual metadata and explain that reasonable alternative thresholds can change classification. Missing inputs are insufficient/unassessed, never neutral. Monthly/quarterly periods are retained separately.

## Current reviewed rendering

Observation endpoints span **2026-03-31–2026-09-30**, with each card showing its own actual period/window. All seven are valid with Medium evidence quality. GSCPI and BIS are currently threshold-sensitive; these names are derived dynamically.

Chinese Home:

> 国内通胀动能、供应链压力与政策利率尚未确认持续方向，生产率增长提供一定供给侧缓冲；现有证据尚未确认明显再通胀或快速通胀降温。
>
> 美元官方外汇储备份额下降，但境外美元融资仍在扩张，国债持有量方向尚未确认。储备多元化与全球美元融资使用可并存，并不证实美元国际角色快速、系统性弱化。

English Home:

> Persistent directions in inflation momentum, supply-chain pressure and policy rates remain unconfirmed. Productivity growth offers some supply-side support; these factors alone do not confirm reflation or rapid disinflation.
>
> The dollar’s reserve share is falling while offshore dollar credit expands. Treasury holdings have no confirmed direction. Reserve diversification and dollar financing coexist; this does not establish rapid, systemic weakening.

Current states remain TRANSITION, OUTPUT_PER_HOUR_GROWING, TRANSITION, TRANSITION, USD_RESERVE_SHARE_FALLING, TRANSITION, OFFSHORE_USD_CREDIT_EXPANDING. No threshold, transform, persistence, state rule or rule version changed.

## Validation and performance

- Frozen engine: **258 tests, 256 passed, two existing deferrals**, no failures. R1–R6 safeguard regressions included.
- Pipeline/archive: **67 passed**, no failures. The isolation assertion now permits the explicit public UI/projection while protecting economic snapshots and refresh behavior against this task's starting main; older validated snapshot drift is not a feature mutation.
- Existing conclusion + notification-summary: **89 passed**, unchanged email semantics. Existing notification verification passes within `npm run verify`.
- Public projection/UI: **84 focused tests** cover strict schema/allowlists, semantic mutation rejection, deterministic presentation in fresh processes, CURRENT/UNAVAILABLE, partial/missing/low quality, all 35 factor-state brief rules, EN/ZH rendering, seven cards, transition, quality, sensitivity, exact artifact identity, forged snapshot, workflow ordering, and actual accepted-input evaluation and cleanup failures.
- `npm run build` and `npm run verify`: **PASS**, including calculations, domestic/fiscal/CBO/international contracts, routes and public leakage checks.
- Actual headless Chrome against the local CURRENT production build: **24 surfaces** (two pages × 320/390/1280 × EN/ZH × light/dark), **12 CTA/direct/Back/Forward/keyboard combinations**, ten loading/failure/map fixtures; no horizontal overflow or runtime errors. A separate UNAVAILABLE build browser test serves the previous CURRENT bytes over unchanged economic inputs and confirms that both Signal pages show UNAVAILABLE while the economic monitor remains usable. Screenshots visually inspected. This is local production-build acceptance, not a production deployment or hosted Actions qualification.

Browser command uses the existing optional Playwright runtime, without adding an application dependency:

```sh
WIL_PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs \
WIL_CHROME_EXECUTABLE=/absolute/path/to/chrome \
node scripts/verify-signal-browser.mjs
```

Evidence is saved locally under `.refresh/signal-browser/`: `acceptance.json`, desktop English/light Home, mobile Chinese/dark Home, and full mobile research-page screenshots. Loading is announced by a status region; headings, text states, focusable links, native keyboard-operated disclosure and neutral non-color-dependent badges are present. Automated acceptance includes overflow and keyboard behavior; it does not claim a complete assistive-technology audit.

Measured current public JSON: **9,920 bytes**, **3,457 gzip bytes**. New lazy route: **4,164 bytes**, **1,480 gzip bytes**. Initial Home does not request this route, replay histories or sensitivity grids. Main JS: **810.17 kB / 224.28 kB gzip**, versus the prior production build **786.36 kB / 217.41 kB gzip**: +6.87 kB gzip (~3.2%). Existing large-bundle warning remains; the task does not attempt an unrelated bundle redesign. JSON sizes are generated-current measurements, not the small bootstrap's size.

`verify-signal-public.mjs` runs inside normal verify and scans public/dist for restricted schemas, personal paths, credentials, email addresses, unexpected Signal files and production imports of internal runtime/generators. Exactly `data/signal-engine/current.json` is allowed and validated. Qualification's older blanket exclusion is updated to allow that same narrow file, while its restricted disclosure checks remain.

Economic snapshots, frozen engine/specification, refresh logic, notifications and version remain unchanged. Hosted production pipeline execution and release remain future merge-stage acceptance; no production run was dispatched here.

## Independent review corrections

The first independent public-release review found five issues. F1: the prior browser check bound only economic-data bytes, so a false snapshot label and an old CURRENT response against a new UNAVAILABLE build could pass. The complete public-byte digest, expected status and accepted snapshot now travel through the separate build record and are verified by the build, final gate and browser. F2: the former final gate checked only structure and disclosure patterns; it now calls the same deterministic presentation generator as shadow/email and checks all EN/ZH text exactly. F3: temporary cleanup exceptions now emit a fixed warning without changing an already validated CURRENT or UNAVAILABLE result. F4: the Home brief no longer places H2/H3 before the hero H1. F5: the policy-rate card links to the existing FEDFUNDS chart in Drivers, while its official FEDFUNDS source remains directly accessible in card details.

The correction test set covers mutated text, bytes, snapshot references, status, quality, sensitivity, Windows paths and cleanup failures. The browser acceptance also checks the unchanged-economic-data CURRENT-to-UNAVAILABLE cache case. The committed public JSON remains the strict UNAVAILABLE bootstrap; generated CURRENT and the ignored build record are per-run outputs.

**Decision: READY FOR PUBLIC SIGNAL ENGINE REVIEW.**

## Changed files

- `.github/workflows/deploy.yml`
- `README.md`
- `docs/public-signal-engine-ui.md`
- `docs/signal-public-summary.schema.json`
- `package.json`
- `public/data/signal-engine/current.json`
- `scripts/lib/signalConclusions.mjs`
- `scripts/lib/signalInputIdentity.mjs`
- `scripts/lib/signalPublicProjection.mjs`
- `scripts/signal-public.mjs`
- `scripts/signal-shadow-qualification.mjs`
- `scripts/tests/signal-pipeline.test.mjs`
- `scripts/tests/signal-public.test.mjs`
- `scripts/verify-international.mjs`
- `scripts/verify-signal-browser.mjs`
- `scripts/verify-signal-public.mjs`
- `src/App.jsx`
- `src/components/ResearchMap.jsx`
- `src/components/SignalEngineBrief.jsx`
- `src/data/buildInfo.js`
- `src/data/researchArchitecture.js`
- `src/data/signalPresentation.js`
- `src/i18n/architecture.js`
- `src/i18n/signalEngine.js`
- `src/pages/DollarHome.jsx`
- `src/pages/SignalEngine.jsx`
- `src/signal-engine.css`
- `src/utils/routing.js`
- `src/utils/signalPublicContract.js`
- `vite.config.js`
