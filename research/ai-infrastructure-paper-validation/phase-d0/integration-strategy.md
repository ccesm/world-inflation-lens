# Integration strategy — approved static snapshot

| Approach | Complexity / dependencies | Reliability and isolation | Security / cost | Reproducibility / maintenance | Decision |
|---|---|---|---|---|---|
| A: static artifact | Small adapter, summary, one history asset; no dependency changes | Failed history does not erase summary or other pages | Read-only same-origin files; no credentials/service cost | Reviewed hashes and frozen source vintages; manual promotion | Primary |
| B: controlled build computation | Python, source cache and strict research environment | Source/build failure can block unrelated Pages release | More network/build permissions and latency | Can be deterministic offline, but research CLI scope incompatible with production | Future only if a demonstrated benefit justifies it |
| C: runtime computation | Service/API/hosting, authentication and cache management | Live source outages affect users; mixed vintages possible | Larger attack surface, secrets and recurring cost | Harder reproducibility and maintenance | Reject for first integration |

## Minimum artifact boundary (proposed, not generated)

Use `src/data/ai-macro/summary.json` imported only by the lazy route. It contains all 36 series' metadata and C2-provided lastRecord/lastNonmissing, counts, source identities, clocks, definitions and limitations. A single `public/data/ai-macro/<history-sha256>/history.json` holds native observation arrays and locators, requested only when a user opens history. Both derive through a versioned allowlist projection from verified C2 output bytes, without new arithmetic. Budgets: summary <=150 KB raw, history <=5 MB raw, <=4 mounted charts, 24 table rows initially. These are targets, not measured production performance.

An isolated Node projection script in D1 can copy existing calculated fields; no engine rewrite or Python production dependency. It verifies C2 input/output identity against the reviewed commit, sorts keys/series deterministically, refuses non-finite numbers or wrong schema, and excludes research-internal root fields and filesystem paths. Keep a research-only trace and public source locators; do not ship source cache or inheritedGapRegister paths. Snapshot assets must carry researchCommit (C2 SHA), sourceAsOf, inputIdentityHash, outputSetHash, projection version and source-specific rights/attribution records. C2 root baseSHA names C1-M and must not be mistaken for the execution commit.

Hash canonical projection payload excluding its own projectionHash, then insert the hash. Hash exact UTF-8 history bytes including specified trailing newline for its content-addressed path. Summary describes history digest, schema and expected series/record counts. Node validation verifies both identities at build/test; native WebCrypto verifies fetched history bytes before JSON adoption. The UI does not hash reserialized parsed JSON as a substitute for downloaded bytes. Retain full C2 JSON/CSV/Markdown hashes and immutable GitHub research permalinks for audit; no need to ship the large repeated-metadata CSV on initial page load.

## Browser behavior

Static JSON fetch uses `import.meta.env.BASE_URL` plus the validated relative content-addressed path, never an operator-controlled URL or external economic API. A module-scoped promise/cache is keyed by history hash, with no persistent economic localStorage. Never mix different summary/history hashes. Unknown schema/hash/count failure isolates history and leaves metadata readable. Show a localized error with explicit user retry; reset a rejected promise for that retry. No infinite retry, background update or source refresh. Lazy module failure uses the existing ResearchLoadBoundary.

Charts choose level/nativeChange/yearChange directly from C2 records, including their unavailable statuses and base periods. No annualGrowth, annualization, resampling, interpolation, national summation or derived correlations. Data formatting and viewport filtering are presentational, not new research calculations. A null final record is visibly missing; an older lastNonmissing can be shown separately with its own date, never relabeled latest.

## Manual update lifecycle

1. Operator obtains official source candidates in research, without changing the live site.
2. Authenticate bytes and definitions, assess rights, units, adjustments and revisions; blocked sources preserve last-valid snapshots.
3. Run the unchanged qualified calculation logic in its compatible research environment for an explicitly qualified new vintage. Current C2 CLI cannot simply accept a new date; a new authorized research qualification is required.
4. Run independent controls, raw/source hash checks, null and arithmetic tests and fresh-process rebuild.
5. Generate candidate static projection. Diff values, nulls, definitions, revision flags, periods and hashes against last approved snapshot.
6. Human reviews unresolved definition changes, source terms and bilingual interpretation. Failed/partial candidates are not automatically published.
7. In a separately authorized production branch, import the reviewed snapshot, run build/verify/browser acceptance and obtain explicit owner release approval. Existing Pages deployment can then publish normal main code; this is not unattended candidate publication.

No workflow, schedule, notifications or external service are added. One source failure must not rewrite historical observations or force other valid indicators to null. A stale last-valid indicator remains dated; selection manifest records which approved vintage it uses. Scope changes require a new definition/version and clear comparability note, not a silent splice.
