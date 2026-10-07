# Phase 3C panel — research only

This additive panel consumes the frozen Phase 3B registries and the curated records under `input/`. It does not update accepted Phase 3B evidence or production. See `docs/AI_INFRASTRUCTURE_PHASE3C_PANEL.md` and `reports/phase3c-panel-qualification.json` for the boundary and remaining evidence gaps.

From repository root:

```sh
# Validate/rebuild in memory; requires an explicit economic knowledge clock.
node research/ai-infrastructure-financing/panel/scripts/build-panel.mjs --as-of 2026-10-07
# Write current research artifacts and an immutable, content-addressed snapshot.
node research/ai-infrastructure-financing/panel/scripts/build-panel.mjs --as-of 2026-10-07 --write
# Reconstruct what dated archived/reviewed disclosures permit; not real-time backtesting.
node research/ai-infrastructure-financing/panel/scripts/build-panel.mjs --as-of 2025-10-31
# Check existing external raw objects without downloading them.
node research/ai-infrastructure-financing/panel/scripts/verify-archive.mjs
# Offline deterministic tests, including all prior infrastructure regressions.
node --test research/ai-infrastructure-financing/tests/*.test.mjs
npm run build
npm run verify
```

The local external archive is selected through `WIL_AI_INFRA_CACHE` or defaults to `~/Public/wil-ai-infrastructure-cache`. `input/source-plan.json` records the bounded official-host source plan used during qualification. For a separately reviewed future fetch, reuse `hydration/archive.mjs` with that plan; it writes new immutable objects/receipts outside Git and stops blocked hosts. Do not repeatedly re-fetch merely to build the panel. A new response is not automatically qualified: inspect the document, source dates, issuer, native labels, scopes and precise claim locators before adding a source version or claim.

New project records need explicit admission references. Known financial values must come from a qualified source claim, never operator estimates. Undisclosed terms stay null. Changed bytes get a new immutable source identity; append linked restatements/status changes rather than overwriting old values. New definitions/scopes require explicit review. There is no accepted-data promotion or production exporter.

`observations.json` is the long-form economic payload. `sources.json` retains economic source identities; `provenance-receipts.json` retains retrieval timestamps separately. `derived-views.json` contains non-financial counts/categories and explicit coverage denominators. `migration-map.json` resolves frozen Phase 3B claims. `status-history.json` stores source-scoped stages, not a synchronized latest national state. `overlaps.json` contains DO_NOT_ADD pairs; the addition API always rejects. Snapshots do not overwrite earlier identities.

Builds are deterministic for the same selected source identities, claims, definitions and rules. A raw archive verification requires the external objects; offline unit tests do not require live internet or that cache. Only compact research records, schemas, methodology and the qualified snapshot belong in this branch. Raw documents, unrelated local research and production data do not.
