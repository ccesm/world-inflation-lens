# AI Infrastructure public projection — Phase 3D.1

This phase creates a frozen, deterministic review projection from Phase 3C commit `9075c9a5325a63e35770323e2cc3e0e164bbc823`, as of 2026-10-07, panel hash `b54975f22d5fbceceb44216665c37233511a9d088016255bdb09328ef91706ff`. It neither publishes nor modifies production. The input is the immutable panel snapshot, not a live source fetch or hand-entered economic values.

## Two publication gates

The first gate requires PUBLIC_READY, QUALIFIED, PRIMARY_VERIFIED, a non-null value, known archived official source hash/version and no unresolved conflict, conditional legal claim or asset/overlap problem. Claim values, units, definitions, native period, operator, source references and source-vintage identity must agree with the frozen registries. Publication, effective and availability clocks are checked against the explicit as-of date.

The stricter second gate admits only defined public slots: location, dated project status, planned campus capacity, contracted/live IT load and selected utility generation/matching facts. It excludes monetary values and internal legal/entity/relationship details regardless of public transaction publicity. It also excludes redundant status events, ambiguous or unsupported capacity definitions, lease-building component capacities, future opening/cooling targets and site/building area facts not required for the compact card.

A project needs eligible location plus meaningful dated status, capacity or power evidence. Generic asset type and name/location alone do not suffice. Google Midlothian, Google Red Oak and Abilene lack enough eligible context; Canton has a water target but not an eligible public electricity/status/capacity fact. They are excluded without asserting that no infrastructure or financing exists.

The resulting seven cards are Fairwater, Quincy, AWS Warren County, El Paso, Hyperion, Jupiter and comparative Polaris Forge 1. Alphabet has no public card in this vintage. There are 23 unique underlying observations, not 23 unrelated independent claims about economic size. Card identity/company association is traced to the eligible location's reporting-company entity and a reviewed bilingual name mapping; it does not assert legal ownership. Locations are deterministically matched to the native source text and translated, not geocoded.

## Structural facts cannot bypass eligibility

The research project archetype is not itself a PUBLIC_READY observation. Therefore all seven public structure labels remain UNKNOWN/not-yet-qualified, with empty financing features. Ownership percentages, financing presence, leases and guarantees do not enter through inferred badges, project names or sidebar text. Research classifications remain unchanged; no observation is reclassified to improve the page.

Hyperion includes location, a dated safe construction disclosure, 5 GW planned scalability and two separately scoped utility-plan capacity facts. It excludes secondary 2.064 GW, Beignet legal entities, financing amounts, equity percentages, lease/support amounts and maximum exposure. Fairwater includes dated safe construction/location and solar matching context; later milestone conflict, legal title, funding pledge and site PP&E remain excluded. Polaris includes dated construction/partial operation and native total contracted/reported-live capacity, as a comparison project outside the five-company universe. No tenant or legal-entity detail is inferred into it.

Education about corporate funding, JVs, leases, debt and guarantees is explicitly separate from project-specific facts. No guarantee threshold or maximum exposure amount appears. The visible bilingual DO NOT ADD disclosure is part of the payload and UI contract, not merely this developer document.

## Public schema and source policy

`public/schemas/projection.schema.json` rejects unexpected fields at every object level. The root includes schema/copy versions, as-of, research panel hash, projection hash, project cards, counts/categories, boundaries and compact source records. Values retain native definition/status/operator/scope and separate observation/source/availability dates. No conversions, company-quarter financial series or synthetic allocations are generated.

Official public HTTPS URLs must match the frozen source host/path policy. Credential URLs, query/fragment links, local paths and temporary/signed links fail closed. The selected sources require content-addressed archived identities. Publisher proper names are retained, source display titles are bilingual. The public source ID is an opaque hash reference; the research trace maps it back to the original source/claim/observation.

## Audit and trace

`public/eligibility-audit.json` accounts for all 281 observations and all 11 projects. It distinguishes included PUBLIC_READY observations, PUBLIC_READY exclusions and reasons, rejected research/review/not-public evidence, conflict and missingness. These internal audit files are not production imports.

`public/projection-trace.json` records public field path, project ID, observation ID, claim ID, original source ID and opaque public source reference. Multiple display fields can trace to the same observation; fact counts deduplicate observation IDs. Every trace must regenerate exactly from the frozen mapping. Missing/null source facts never become zero. Public UNKNOWN structure is an allowed explicit lack-of-qualification label, not a copied unavailable research value.

Public validation checks schema, source URLs/vintages, internal-ID/path/legal leaks and deterministic equality with the regenerated projection. Updating the hash after altering a plausible value is insufficient: the regenerated source mapping still rejects the alteration. The audit itself is compared with regenerated decisions so it cannot claim excluded observations were displayed.

## Identity and immutability

`projectionHash` is SHA-256 of canonical JSON content excluding only the self-referential projectionHash field. It includes public values, source vintages, publication rule hash, bilingual copy hash and implementation/contract/schema identity. `projectionFileSha256` separately identifies exact compact UTF-8 file bytes, including the final newline. These are distinct, documented identities.

The implementation digest freezes `project.mjs`, public schemas, rules, copy and UI contract. Same input/rules/copy/implementation produces identical projection bytes in fresh processes and different working directories. Runtime clocks, retrieval diagnostics, local directories and machine metadata do not enter the public content. Source-vintage availability remains economic provenance; it is not the current runtime timestamp.

The fixed writer accepts no user-controlled output path. It validates the public data and trace and refuses a changed frozen file before writing. No src/public destination, accepted-data promotion, workflow, network fetch or runtime LLM exists. A changed projection requires a separately reviewed version/qualification; do not silently overwrite this frozen vintage.

## Reproduction and validation

From repository root:

```sh
node research/ai-infrastructure-financing/public/scripts/build-projection.mjs
node research/ai-infrastructure-financing/public/scripts/build-projection.mjs --payload
node research/ai-infrastructure-financing/public/scripts/build-projection.mjs --write
node --test research/ai-infrastructure-financing/tests/*.test.mjs
npm run build
npm run verify
```

Tests cover state rejection, changed frozen inputs, hidden financial/legal leakage, native capacity, historical status, source trace/URL policy, bilingual copy, hash identity, rehashed value tampering, explicit clocks, fresh-process determinism and unchanged production/frozen panel paths. UI schema tests validate the mobile/desktop/keyboard/table contract. There is no implemented public route to browser-test in this phase.

## Intentional limits and next phase

This projection cannot expose meaningful qualified project financing details yet. No dollar comparison, aggregate investment, hidden leverage, AI return or systemic-risk conclusion is produced. New primary legal/financial evidence must first qualify research and then pass a separately reviewed publication rule; it cannot be patched directly into the public JSON.

Future source availability and revised status remain limited by archived vintages, including undated HTML and the Fairwater milestone conflict. The current display states are dated historical disclosures. Local external archive integrity does not substitute for offsite backup. Publication-readiness is not owner approval to deploy.

Recommend Phase 3D.2 as a clean production-main branch importing only the frozen compact public JSON and reviewed bilingual copy, then implementing the four-section UI with explicit not-yet-qualified financing messaging. Keep trace, audits, raw cache, schemas/tests and research history outside production. Recheck hashes, version policy, accessibility and scope before any release; Phase 3D.1 does not perform that integration.
