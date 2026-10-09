# Phase C2 recommendation — one minimal descriptive engine

**Recommendation only; C2 has not begun.** Build a research-only, operator-triggered twelve-indicator native-frequency descriptive snapshot engine. The purpose is to track aggregate context and competing long-run mechanisms, not to estimate an AI causal coefficient or forecast inflation.

## Fixed initial scope

- Energy: EIA commercial state sales and realized price, Henry Hub benchmark, Census private data-center construction.
- Capital: BEA real nonresidential fixed investment, Fed10-year real Treasury yield, Fed corporate debt-securities stock.
- Productivity: BLS output/hour and unit labor costs.
- Inflation/expectations: BLS headline CPI, BEA core PCE, Philadelphia Fed10-year CPI survey expectation.

These are exactly the twelve `c2Core=true` IDs. Existing thirteen-state energy sample remains explicitly a subset. C2 may qualify an official national aggregate as a versioned alternative, without summing the subset into US demand or creating an AI demand proxy. Keep real GDP, core CPI, headline PCE and market compensation as optional context, and revised BTOS as gated context until payload/weights/uncertainty are qualified. Do not replace missing AI measurement with unmarked aggregate proxies.

## Acceptance criteria

1. All twelve selected inputs have authenticated original-producer metadata, numeric payloads, immutable hashes, units, native dates, revision flags and deterministic locator-backed reproduction. Existing frozen coverage is a starting source check; each adapter must pass independent parser/control checks.
2. Explicit as-of, observation/release/retrieval clocks, current-vintage versus first-release distinction, stale/blocked and definition-change outcomes are enforced. Missing publication dates prohibit real-time backtests.
3. Preserve October2025 CPI null, early securities-stock and survey gaps, and daily missing dates. No splicing BTOS, interpolation, forward-fill, hidden zeros, or invented latest values. Missing comparison endpoints yield unavailable changes.
4. Exact-period level/YoY or native change definitions are tested; negative-yield comparisons use percentage-point changes. Stock/flow, SA/NSA, real/nominal, SAAR and survey/historical outcomes remain separate.
5. At least ten years of stable native monthly/quarterly context should be available for the **proposed descriptive common window2015–latest available**; gaps remain visible, not a demand for balanced filled data. The available longest-history files do not certify all-era definition consistency. BTOS's short regime is not part of this minimum.
6. Human summaries distinguish E1 observations, any explicitly scoped E2 descriptives and E0 mechanisms. E3/E4 need separately authorized controls/identification/robustness review. No automatic grade upgrade, composite score, investment signal or forecast.
7. Fresh-process rebuild matches bytes/hash. Full allowed-scope check, regressions/build/verify pass with production/inherited artifacts untouched. No schedule, email, deploy, public route or accepted-data promotion.

## Stop or narrow criteria

Stop an individual adapter on changed units/definitions, uncertain original provider, challenge/blocked response, missing required source identity or irreproducible history. Preserve other last-valid indicators; do not fail the macro framework because private site data are absent. Narrow a comparison if seasonality/frequency/vintage cannot be aligned without filling or if the proposed story relies on AI attribution not observed in the data. Do not calculate correlations simply to make a channel appear verified.

Do not start event studies, contact private utilities for meter contracts, or chase customer energization dates. No causal macro identification is currently qualified. The scientific success gate is useful independent source-backed context with visible uncertainty, not a significant regression or a desired inflation sign.

## Handoff

C1-M source fixtures/registers and preserved gap references are review inputs. Production remains unchanged. The owner must authorize C2 separately; this recommendation is not permission to implement or publish it.
