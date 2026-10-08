# AI Infrastructure: paper-first content review

Branch: `codex/ai-infrastructure-paper-first-redesign`. Production base: `abf51f8ec33d5ef500a6c3defd330ca840fab12f`. Implementation remains v1.4.0; no release bump, merge or deployment is authorized by this task.

## Exact source and version

The original Phase 3A source note at `81b546b847e39b0314a61cbad357a62a9495a18c:docs/AI_INFRASTRUCTURE_BROOKINGS_SOURCE_NOTE.md` identifies Stijn Van Nieuwerburgh (Columbia Business School), **Financing the AI Buildout**, internal draft September 4, 2026, BPEA conference September 24–25, 2026. This redesign uses that same draft, not David Skidmore's September 23 summary as a substitute.

- [Exact conference PDF](https://www.brookings.edu/wp-content/uploads/2026/09/4c_Van-Nieuwerburgh.pdf).
- [Canonical Brookings publication page](https://www.brookings.edu/articles/financing-the-ai-buildout/).
- Retrieved PDF SHA-256: `bf96f1e528b10dcd8cb1ab52bfad45f100efa1d7462b2af75f9bb4bda668bbc4`.
- PDF was read and relevant pages rendered outside production. No PDF bytes, extracted text, figure screenshots or research history enter the app.
- Printed page numbers exclude the conference cover: printed p. 4 = PDF page 5. Public citation links preserve this distinction.

## Presentation and source boundary

The same hash route now presents research origin, exact paper metadata, four summary paragraphs, four paper findings, three numeric charts, five comparison rows, an independent-evidence divider, then the original four detailed evidence areas.

`src/data/ai-infrastructure/paper.js` holds only the frozen paper presentation records. The layer stores 23 plotted values plus eight explicit cost/load/scenario assumptions. Each numeric observation carries `ACADEMIC_PAPER`, paper version, native metric/unit, period, scope, classification and locator. Editorial EN/ZH content lives in `src/i18n/aiInfrastructurePaper.js`.

The existing `monitor.json` remains byte-identical: 31,650 bytes, file SHA-256 `3fc59a0c52f097cbbd4f4f187ace5813d02cd2de03cfd274ac9e12700199b6f5`, projection content hash `cc57c96477fc42cf074a9dcf2c78c4f0cb46cbf4223fdfd73db9d8fa57412695`. Existing project cards use `WORLD_INFLATION_LENS_QUALIFIED`; they never consume the paper observations. Tests demonstrate that injecting a paper observation/classification into the qualified snapshot fails its existing strict contract.

Paper citations support what the paper says. The existing 14 official sources support our narrower project evidence. The paper's financing examples are summarized without importing excluded legal entities or transaction numbers into the cards. All seven public structures remain UNKNOWN and ownership-percentage qualification remains zero.

## Recreated charts

These are original lightweight bars and semantic table fallbacks using explicitly printed values. They do not copy or digitize figures. Bars start at zero; common scales exist only within each chart. No company ranking or additional financial calculation is introduced.

1. **Illustrative campus cost** — Section II, printed p. 4, Appendix A. A 200 MW *total electrical load* training campus, 2025 initial benchmark: facility 2.2, incremental power 0.4, installed IT 5.6, in USD billions. Paper estimates; not a project budget. The paper's approximate 8.2 total stays inside this illustrative layer.
2. **Five-company CapEx / operating cash flow** — Figure 1, printed p. 6 and notes. USD billions, calendar years:

| Year | Cash CapEx | Operating cash flow |
|---|---:|---:|
| 2020 | 96.8 | 252.2 |
| 2021 | 130.9 | 289.9 |
| 2022 | 158.3 | 288.3 |
| 2023 | 153.8 | 377.9 |
| 2024 | 240.4 | 478.5 |
| 2025 | 415.8 | 603.2 |
| 2026 | 800.5 | 707.1 |

Oracle, Microsoft, Amazon, Meta and Alphabet combined. 2020–2025 are paper-reported historical filing-based values; 2026 mixes reported results, guidance and Wall Street estimates. CapEx includes non-AI spending, excludes leased data-center CapEx, and uses calendarization for Microsoft/Oracle. This is not the existing four-company quarterly AI CapEx snapshot or an AI-only series.

3. **Historical investment cycles** — Table 1, printed p. 5; Appendix C, pp. 23–25. Average annual capital expenditure/GDP: canals 1836–1841 0.66%; railroads 1870–1890 2.24%; electrification 1905–1925 0.50%; highways 1956–1973 1.13%; telecom/fiber 1996–2003 1.10%; AI 2025–2032 3.63%. Original chronological order, approximate historical calculations beside a scenario, not harmonized accounting or a ranking. Historical sources, scopes and asset lives differ. AI assumes realization/timing outcomes, 4% annual cost and nominal GDP growth, four-year spending weights 10/25/40/25%, includes pre-completion spending for later projects and excludes subsequent hardware replacements.

The central scenario's industry investment cannot be compared with the curated project sample. No paper revenue-required/return calculation, contingent-exposure amount, synthetic leverage or systemic-risk score is implemented.

## Comparison decisions

| Paper argument | Our independent boundary | Assessment |
|---|---|---|
| Substantial physical infrastructure | Native planned/contracted/live capacity facts, not an industry census | Supported in direction only |
| Power can constrain construction | Selected Fairwater/Hyperion planning facts; no sample-wide causal constraint or delivered supply measure | Partially supported |
| External structures expand financing capacity | Seven UNKNOWN structures; zero qualified ownership-percentage facts | Not independently verified |
| Large scenario investment/GDP | Selected, incompatible native definitions; no aggregate dollar total | Not comparable |
| Layered financing may amplify risk | Attributable project cash flows and risk measures unidentified | Outside current dataset |

The first two assessments are editorial comparisons, not causal tests. The financing paragraph is the author's argument, not our verification of a funding shortfall. No claim of a bubble or safe financing is made. Fixed-vintage statuses, sparse power evidence, Fairwater milestone changes and asymmetric company coverage remain visible.

## Acceptance and handoff

Contract verification includes frozen bytes, exact printed paper inputs, metadata/version, semantic provenance separation, laundering rejection, EN/ZH, three chart fallbacks and five comparison rows. Infrastructure browser acceptance checks paper-first order plus original filters/cards/sources/table and all existing routes across eight language/theme/width combinations. AI CapEx and AI Labor acceptance are unchanged.

Validation results and final branch SHA are recorded in the owner handoff. Review the content before any release action. Recommend v1.4.1 for this presentation/content change; the implementation keeps v1.4.0 pending separate approval. No production PR is opened in this task.

### Recorded validation

- `npm ci`, `npm run build`, `npm run verify`: PASS, verified in an isolated checkout to preserve the user's untracked research materials in the shared worktree.
- Infrastructure contracts: 48 passed, 0 failed (41 existing + 7 paper-first).
- Infrastructure browser: eight EN/ZH × light/dark × 390/1280 combinations; 26 registered routes. Paper-first order, three chart table fallbacks, five comparison rows, source/keyboard access, original seven cards/UNKNOWN/filter/power boundaries and Home lazy loading checked.
- AI CapEx: 39 production/control contracts through full verify, 12 browser combinations passed. AI Labor: 12 browser combinations passed and OBSERVATION MODE preserved.
- Signal Engine core: 256 passed, 0 failed, 2 inherited skips. Additional pipeline/archive regression: 66 passed, 1 inherited failure. `scripts/tests/signal-pipeline.test.mjs:483` still hard-codes application version `1.1.0`; exact main and this branch both use `1.4.0`. The unchanged failing isolation test was also reproduced separately. No Signal implementation, test or expected value was changed. The known optional public acceptance-clock fixture is not repaired in this task.
- No new runtime/console errors or page-wide horizontal overflow. No new runtime economic API, dependency, workflow, email, project evidence or production write.
- Lazy Infrastructure JS: 92,638 bytes / 24,430 gzip (previous 57,611 / approximately 14,750 gzip). Infrastructure CSS: 6,360 / 1,643 gzip (previous 2,802 / approximately 950 gzip). Approximately +35,027 JS and +3,558 CSS bytes; main entry size unchanged. The paper presentation module is 19,285 source bytes.

Remaining HIGH implementation issues: none. HIGH evidence limitations remain the unqualified financing/ownership and inability to independently test the paper's industry totals or financial-risk arguments. MEDIUM limitations: scenario assumptions, approximate historical comparisons, fixed-vintage/asymmetric project coverage and the inherited Signal pipeline version fixture. These are explicitly disclosed rather than filled or repaired outside scope.

Decision: **READY FOR OWNER CONTENT REVIEW**. This is branch-only readiness, not release approval.
