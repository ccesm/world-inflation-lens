# AI Infrastructure & Financing — offline research foundation

Phase 3A keeps physical assets, accounting recognition, financing, contractual support and monetization separate. No runtime fetch, workflow, production import, email, score, return calculation or aggregate investment output exists.

```sh
node research/ai-infrastructure-financing/scripts/validate.mjs
node --test research/ai-infrastructure-financing/tests/*.test.mjs
npm run build
npm run verify
```

Node >=22.12; no additional dependencies or API secrets. All test inputs are the small committed registry; adversarial cases mutate copies. The validator only reads files and writes JSON to stdout. Identical inputs produce identical content hashes and qualification summaries in fresh processes and different working directories. It never writes accepted data or production paths.

`data/` contains manually source-reviewed assertions and referenced observations, with explicit missingness. `schemas/` defines strict typed records, including separate filtered lease/guarantee/commitment views. `scripts/validate.mjs` checks the schema subset plus graph, evidence, version, units, ownership and overlap semantics. Unsupported schema keywords fail closed. This is not a generic complete JSON Schema implementation or an automated legal/accounting source verifier.

`reports/phase3a-foundation-qualification.json` records implementation commit, test/build/verify evidence and limitations. The final report commit follows the implementation commit to avoid a self-referential SHA. Source URLs, publication dates and locators are in `data/sources.json`; no raw financial PDFs or fake raw hashes are committed. Underlying documents need external immutable archival/hydration before a wider source update pipeline is qualified.

Read [model](../../docs/AI_INFRASTRUCTURE_FINANCING_MODEL.md), [Brookings note](../../docs/AI_INFRASTRUCTURE_BROOKINGS_SOURCE_NOTE.md) and [Hyperion case](../../docs/AI_INFRASTRUCTURE_HYPERION_CASE_STUDY.md). Research plans for other companies remain unqualified candidates. Production v1.3.0 and the inherited research app version are separate; do not bump or synchronize either here. Never merge this full research branch into main.

## Phase 3B qualified research view

The frozen Phase3A view above remains unchanged. The current comparative view uses `data/phase3b/` and `phase3b/schemas/`, with root `data/scope-map.json`, `data/overlaps.json`, per-case files and hydration manifests. Do not concatenate the two registry namespaces. Run:

```sh
node research/ai-infrastructure-financing/scripts/validate-phase3b.mjs
node research/ai-infrastructure-financing/hydration/verify-archive.mjs
node --test research/ai-infrastructure-financing/tests/*.test.mjs
```

Raw archive verification requires `WIL_AI_INFRA_CACHE` (default `~/Public/wil-ai-infrastructure-cache`). Unit tests use only tiny inline synthetic responses and temporary directories; no internet or historical cache is required. The read-only validator works without external raw sources and reports their recorded identities; that does not imply the cache is physically present. Live hydration is an explicit operator command, never a workflow or production update. See [Phase3B method](../../docs/AI_INFRASTRUCTURE_PHASE3B_METHOD.md), [selection](../../docs/AI_INFRASTRUCTURE_CASE_SELECTION.md) and [comparative cases](../../docs/AI_INFRASTRUCTURE_COMPARATIVE_CASES.md).
