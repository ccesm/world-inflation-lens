# AI Infrastructure & Financing — Phase 3D.2 integration acceptance

This feature is prepared for owner review. It is not merged, deployed or a live refresh system. Application version stays **1.3.0**. A separately approved minor release would fit **v1.4.0 — AI Infrastructure**.

The clean production branch is `codex/ai-infrastructure-public-integration`, based on verified main `be9dde341cfb32a53b7a3fca76e04d631a926bcd`. The research lineage was not merged or cherry-picked. The only research data imported is the exact frozen public JSON from `c51ed275e353fd6fd8c152a712f17eeaca28f685`; the minimum paired copy follows its approved UI contract. No graph, trace, raw source, research script/test or excluded value enters production.

## Frozen identity

| Item | Identity |
| --- | --- |
| Production file | `src/data/ai-infrastructure/monitor.json` |
| Source and imported file SHA-256 | `3fc59a0c52f097cbbd4f4f187ace5813d02cd2de03cfd274ac9e12700199b6f5` |
| File bytes | 31,650 |
| Projection content hash | `cc57c96477fc42cf074a9dcf2c78c4f0cb46cbf4223fdfd73db9d8fa57412695` |
| Research panel hash | `b54975f22d5fbceceb44216665c37233511a9d088016255bdb09328ef91706ff` |
| Knowledge boundary | 2026-10-07 |
| AI CapEx snapshot SHA-256, unchanged | `8891e6b7dca9317e3d2400bdd3749c54425ff1c0385c1f2151e2593c92227c3a` |

Content identity hashes canonical JSON excluding `projectionHash`, without a trailing newline. File identity hashes the exact frozen bytes, including their trailing newline. Production build verification checks both; the browser validates allowed structure and exact equality to the bundled frozen artifact. Changed values or unexpected fields fail closed. A future vintage requires separately approved identities and contracts.

## Public behavior

The lazy route is `#/research/ai-infrastructure`, titled **AI Infrastructure & Financing / AI 基础设施与融资**. Research secondary navigation, the tool directory, structural-capacity Research Map and page context link to it. AI CapEx has a reciprocal contextual link; the explanation distinguishes company accounting/monetization from project status, native capacity and power. It does not promise reconciliation to corporate CapEx.

The exact four sections are:

1. Project landscape / 项目概览.
2. How the buildout is financed / 建设如何融资.
3. Power & grid / 电力与电网.
4. What this data can and cannot show / 数据能与不能说明什么.

Seven neutral-order cards show Microsoft Fairwater 1 and Quincy; Amazon Warren County; Meta El Paso and Hyperion; Oracle Jupiter; and Polaris Forge 1 as an independent comparison. Alphabet has an explicit zero-project evidence-boundary message. Midlothian, Red Oak, Abilene and Canton have no cards. The underlying qualification considered 11 projects and 46 public-ready observations; its stricter projection includes 7 projects, 23 independent facts and 14 official sources. Nine selected historical status records, four campus-capacity facts and three power facts remain distinct; the page does not count duplicated presentation as additional evidence.

All seven financing structures are explicitly not yet publicly qualified. There are zero qualified public structure or holding-percentage facts. Unknown does not mean no financing, self-funding or no leverage. Archetypes appear only as general educational vocabulary, never project-specific badges. No dollar amount, ownership percentage, aggregate investment/debt, ranking, score or attributable-return calculation is added.

Hyperion shows only its frozen location, dated construction disclosure, 5 GW planned scalability and separately scoped utility-generation plans. No legal entities, original financing-related capacity, ownership ratios, financing/lease/guarantee amounts or maximum-exposure values appear. Fairwater retains its 2025-09-18 construction disclosure and timeline-change caveat. Polaris keeps 400 MW contracted critical load separate from 175 MW reported live load; it is not assigned to one of the five companies.

Observation/effective date, source publication date, source-vintage availability and the knowledge boundary are labeled separately. Null dates are labeled not disclosed. Historical status is not a synchronized assertion about today's complete operations. Native units, operators, scope, planning/contracted/reported-live status and source refs are preserved. Utility plans remain separate from campus load and cost. No MW/GW conversion, summation, cross-project ranking or macro-inflation inference occurs.

The bilingual DO NOT ADD warning is visible before the cards and repeated in the final section. Guarantee/maximum-exposure education states these are not debt, expected loss or expected payment, without exposing excluded amounts. Official source links remain keyboard reachable and announce new tabs; opaque source IDs and hashes are not displayed to normal readers.

## Accessibility and responsive acceptance

Cards are complete text alternatives; no map or inferred coordinates are added. Labeled company/status filters announce empty results; the archetype filter is disabled with an explanation because all structures are unqualified. A semantic, focusable, internally scrolling table provides an optional overview, with equivalent facts in stacked mobile cards. All source/date/scope facts remain available without hover. Dark and light themes, EN/ZH language attributes, visible focus, heading structure, keyboard filters, disclosure toggles and table scrolling were checked.

The new browser script tests 390/1280 × EN/ZH × light/dark: **8 passed, 0 failed**, plus all **26 routes**. It confirms seven cards, exact asymmetric coverage, Alphabet empty state, Polaris identity, exclusions, capacity qualifiers, Fairwater caveat, financing unknown semantics, prominent warnings, official source URLs, related navigation, Home lazy isolation and zero page-wide overflow/console/runtime errors. Two representative screenshots were visually inspected, including mobile Chinese dark and desktop English light cards.

Existing AI CapEx acceptance: **12 passed, 0 failed** (320/390/1280 × EN/ZH × light/dark). Its accounting notes, fixed values, chart gaps, RUN_RATE semantics, manual maintenance link and related routes remain intact. Existing AI Labor acceptance: **12 passed, 0 failed**; Observation Mode, conclusions, tables, related/legacy routes and lazy isolation remain intact.

## Validation and production protection

- `npm ci`: passed, lockfile unchanged.
- `npm run build`: passed.
- `npm run verify`: passed in a clean production checkout containing these exact feature files.
- New public contract: **41 passed, 0 failed**, plus bilingual SSR, frozen file/content identities, invalid-input fallback and scoped build-artifact leakage checks.
- Existing AI CapEx public/control contract: **39 passed, 0 failed**, plus bilingual SSR.
- Signal Engine suite in the normal repository path: **256 passed, 0 failed, 2 inherited skips** (258 cases). No Signal Engine files or expectations were changed.
- Existing routing, AI Labor public, research architecture and other repository verify checks: passed.
- `git diff --check`: passed.
- No changes to economic snapshots, AI Labor, Signal Engine, production workflows, email, Pages configuration, version or runtime APIs.

The shared workspace retains user research evidence. An initial verify attempt encountered the pre-existing assertion that the AI CapEx research directory must not exist in a production checkout; local research outputs left after switching histories triggered it. Those outputs were preserved, and the complete verification ran in an isolated clean checkout. Signal OP-12 also cannot exercise its production-path denial inside `/tmp`, which the existing offline path policy allows; the full Signal regression passed at the normal project path. Neither fixture nor storage policy was altered.

Leakage checks target the imported data, rendered page and its lazy build artifact. All forbidden record states, local/cache paths and excluded Hyperion/financing markers have zero occurrences there. A separate exact-main build confirmed that existing unrelated chunks already contain `REVIEW_REQUIRED`, `20%`, `80%` and incidental `2.064` values. Counts by existing chunk family are unchanged; these are not infrastructure evidence leaks. Tests/docs intentionally describe forbidden inputs.

## Performance and limits

Exact-main baseline JS: 3,810,722 bytes. Integration JS: 3,869,737 bytes; growth **59,015 bytes** across all JS chunks. New lazy page: **57,611 bytes JS** (~14.8 KB gzip) plus **2,802 bytes CSS**. Entry JS grows **783 bytes**; entry CSS is unchanged. Home does not request the new page. No dependency was added. Existing large-chunk warnings remain inherited.

HIGH implementation issues: none found. HIGH evidence boundaries: project-specific financing, legal ownership and holding ratios remain unqualified for public use. This is intentional; this release cannot answer those questions. MEDIUM limits: curated asymmetric coverage, fixed historical statuses rather than live operations, changed Fairwater milestones, incompatible capacity definitions, sparse power evidence and Jupiter's undisclosed page publication date. No new source qualification was attempted. The inherited source-map-js advisory and unrelated maintenance remain outside scope.

Owner handoff: review this compact integration, then separately approve version/release preparation. Do not import research history, widen the facts, enable refresh/email or deploy on the strength of local acceptance.

**READY FOR AI INFRASTRUCTURE RELEASE PREPARATION**
