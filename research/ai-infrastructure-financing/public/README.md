# Phase 3D.1 frozen public projection — research only

Production import candidate: `ai-infrastructure-public-monitor.json` (compact UTF-8 canonical JSON plus newline). User-facing dictionary: `copy.json`. UI design contract: `ui-contract.json`. No frontend page or production export is implemented here.

From repository root:

```sh
node research/ai-infrastructure-financing/public/scripts/build-projection.mjs
node research/ai-infrastructure-financing/public/scripts/build-projection.mjs --payload
node research/ai-infrastructure-financing/public/scripts/build-projection.mjs --write
node --test research/ai-infrastructure-financing/tests/*.test.mjs
npm run build
npm run verify
```

Inputs are pinned to Phase 3C commit and panel hash in `rules.json` and the implementation. There is no runtime clock, CLI as-of override, network source fetch, arbitrary output path or production destination. `--write` is idempotent for the frozen vintage and rejects changed bytes. Do not delete the frozen files simply to bypass that guard.

The projection hash excludes its own field; the qualification report also records the SHA-256 of the exact file bytes. The copy hash identifies the complete EN/ZH dictionary. A later clean production integration must verify all imported identities and copy versions.

`projection-trace.json` and `eligibility-audit.json` are research-only proof of source mapping and exclusion decisions; never import these files into the app. Source registries, internal graphs, raw documents, external-cache paths and the full research lineage must also stay outside production.

Read `docs/AI_INFRASTRUCTURE_PUBLIC_PROJECTION.md` for filtering/identity and `docs/AI_INFRASTRUCTURE_PUBLIC_MONITOR_CONTRACT.md` for future display, responsive and accessibility requirements. All structure labels are UNKNOWN in this vintage because eligible structural claims are absent; educational archetype descriptions must not become project-specific badges.
