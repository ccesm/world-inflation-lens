# Signal Engine production acceptance plan

This is a future implementation/release plan, not evidence that these gates have already run. See [integration](signal-engine-production-integration.md) and [presentation](signal-engine-public-presentation.md). The current task creates documentation only; it does not run a new methodology review, merge, deploy or change version 1.0.0.

## 1. Stage boundaries

**Phase 1:** pipeline shadow generation, acceptance receipts, validation, immutable storage and failure isolation. No public page or deployed public conclusion endpoint. Complete gates P1–P16 before promotion to a production shadow run. A branch implementation may use isolated fixtures until storage and runner credentials are provisioned. Promotion is a separate explicit decision.

Phase 1 artifacts, including draft public projections, remain in restricted storage. Test public-branch publication semantics in an isolated fixture store; do not publish a publicly readable conclusions archive during shadow rollout. Gates describing the browser, public branch or deployment pointer use a harness until their Phase 2 activation.

**Phase 2:** separately reviewed current-factor UI and Data Health integration. Complete Phase 1 regression and U1–U12 before public release. No historical view, Home conclusion, aggregation or new factor.

**Phase 3:** optional historical reconstruction. Complete H1–H4 before offering it. Phase 4 broader placement needs a separate product decision, not an automatic consequence of passing these gates.

## 2. Phase 1 gates

| ID | Test / inspection | Required result and retained evidence |
| --- | --- | --- |
| P1 Target and import | Record current main SHA, adapter SHA, validated engine reference, five spec hashes, eight pinned contract hashes, input SHA and runtime | Selective engine import; no prototype branch merge or unreviewed production source changes. Rule `signal-engine-v0.1-draft.1`, thresholds, transforms, states, factor ownership and no-aggregate policy unchanged. Keep frozen `productionEnabled: false`; shadow policy separate. |
| P2 Accepted input | Candidate fails economic validation; hash/path/commit mismatch; fabricated old acceptance; validation later than acceptance; missing receipt; first-seen after acceptance | Engine never evaluates rejected/unproven input. Genuine acceptance chain succeeds; future replay fails closed. Source update/retrieval/Git time alone cannot stand in for acceptance. |
| P3 Economic independence | Engine exception, timeout, nonzero exit and invalid output after valid refresh | Accepted economic file hashes remain intact. Final ordinary build/verify and deploy may proceed using fallback/unavailable manifest. Signal tests are not made prerequisites inside `replaceBundle`. |
| P4 Semantic validation | Mutate publisher, URL, denominator, raw value, period, units, frequency, source/availability/freshness metadata, hash/path/commit, transform operand, factor availability basis | Reject each material false claim against the pinned archive. Shape validation and self-consistent fabricated output are insufficient. Retain individual expected/actual results. |
| P5 R2 time isolation | Retained prior TIC and GSCPI vintages, unchanged canonical values, future revision ID/event; future quality, context, probes, imputation/retrieval/validation metadata | Before cutoff: same state, confidence, audit, canonical bytes/hash; no ineligible lineage. After legitimate availability: eligible non-directional change may appear. Actual economic revisions remain detectable. |
| P6 R4 evidence quality | Coherently backdated publication proof; one invalid confirmation point; wrong source/snapshot/period; reused proof; null/marker-only proof; future proof; valid daily/monthly/quarterly boundaries | HIGH only with complete validated eligible proof for every required observation and plausible native-period chronology. Current real factors need not become HIGH. |
| P7 R5 identity/history | Raw-hash-only, canonical identity, source-vintage and equivalent raw bytes change; economic revision; execution-only time; valid→unavailable→valid chain | Equivalent economics retain arithmetic with auditable non-directional status change. Economic revisions get appropriate revision reason. Run-only wall-clock noise does not alter identical-request content. Unavailable state stays unavailable; prior valid link is verified, not carried forward. |
| P8 R1/R6 regression | Existing acceptance chronology and strict dates/timestamps tests, leap day valid/invalid, impossible month/day/clock values | Closed safeguards stay closed. No JavaScript normalization of impossible dates and no unsupported historical availability claim. |
| P9 Determinism | Three clean processes with identical manifest, receipts, prior reference, code/runtime, mode, as-of/evaluated-at and rules | Exact canonical bytes plus engine/public/details hashes match. New wall-clock run records may differ. Changing config/schema/input/runtime is rejected if unauthorized or produces a distinct qualified identity; never silently reuses the old identity. |
| P10 Projection/privacy | Scan public artifacts, details, manifests, client errors and eventual static output; inject local paths, user/host names, mail addresses, credentials, provider bodies, unknown fields, unsafe URLs, overlong arrays/text | Strict allowlist rejects leaks; mapping preserves truthful provenance and referential integrity. No recursive spread of offline output into public JSON. No credential-bearing source URL. |
| P11 Immutable store | Same hash/same bytes retry; conflicting bytes; crash between blob and pointer; concurrent writers; delayed old run; failed read-back; store unavailable | Idempotent same-content writes; conflict fails closed; no dangling successful pointer. Newer accepted/deployed success retained; old failure cannot erase it. Storage failures isolate from economics. |
| P12 Retention and restore | Restore private audit and public artifacts plus every predecessor/input receipt; select supported older engine version | Exact hashes verify. Matching validation context retained. No dependence solely on expiring Actions artifacts; no public exposure of private audit records. No silent cross-version predecessor validation. |
| P13 Fallback | First-run failure; current failure with prior success; corrupt newest artifact; missing details; unsupported schema; same input but aged as-of; newer data with old interpretation | Use verified approved prior artifact with truthful relation/as-of, or unavailable. Distinguish input mismatch from elapsed freshness/recheck due. Current factors never populated with prior direction. |
| P14 Publication/deployment split | Artifact generation succeeds but final build or Pages fails; independent latest status newer than browser build; pointer fetch fails | Last deployed pointer remains prior successful deployment. Old browser stays bound to its own economic/input artifact. Status unknown does not rewrite artifact or imply successful update. |
| P15 Production protection | Diff and hashes for all economic snapshots, protected calculations, existing routes, workflows, notifications, app package version; bundle import scan | Only explicitly reviewed future adapter/workflow changes. No accidental economic edits, rule edits, emails or UI imports. Preserve source freshness semantics, rollback and all existing verify checks. Phase 1 Home bundle and route set unchanged. |
| P16 Full validation | Engine test command(s), `npm run build`, `npm run verify`; targeted failure simulation through real workflow boundaries in an isolated test harness | All required tests pass. Report existing, added, failed and deferred separately. Two legitimate engine deferrals (successful publisher-vintage replay and future adopted-rule execution) remain explicit; no fictitious success count. |

Do not re-run the 660-endpoint historical suite and 5,940 sensitivity variants inside every refresh. Preserve the declared grid, run the full suite once for a material evaluator integration/runtime change when required to establish equivalence, and retain its labelled results. Routine generation evaluates only the current endpoint. Production data drift is tested independently of frozen-input arithmetic.

### Frozen arithmetic reference

Use the validated reference manifest, fixed invocation and qualified runtime when testing equivalence. The known hash `da3f364259bc43083d0ab1621706172283716d735493fd4d97278573bb5fe883` applies only to its original exact inputs/request/runtime; do not apply it to a newly captured receipt or today's production data.

| Factor | Frozen expected state | Quality |
| --- | --- | --- |
| `inflation-persistence` | `TRANSITION` | MEDIUM |
| `observed-productivity` | `OUTPUT_PER_HOUR_GROWING` | MEDIUM |
| `supply-chain-pressure` | `TRANSITION` | MEDIUM |
| `policy-rate-direction` | `TRANSITION` | MEDIUM |
| `reserve-share` | `USD_RESERVE_SHARE_FALLING` | MEDIUM |
| `foreign-treasury-holdings` | `TRANSITION` | MEDIUM |
| `offshore-usd-credit` | `OFFSHORE_USD_CREDIT_EXPANDING` | MEDIUM |

GSCPI and BIS remain threshold-sensitive on that frozen reference. No variant is selected as best. A legitimately different eligibility cutoff or current input can change output; explain it rather than tuning rules to recover the reference state.

## 3. Explicit fault-injection release matrix

Retain per-case economic commit/hash, selected interpretation hash, engine result, manifest relation, build result and deployment-selection result. Tests must inspect output bytes, not merely assert a caught exception.

| Injected fault | Economic result | Interpretation result |
| --- | --- | --- |
| Invalid candidate economic observation | Existing refresh rejection/rollback | Candidate never interpreted |
| Kill evaluator after valid acceptance | Accepted data retained | FAILED + prior verified artifact or unavailable |
| Forge factor availability basis | Accepted data retained | Projection not published; prior retained |
| Fail private archive or public-branch write | Accepted data retained | No success pointer; storage failure recorded |
| Interrupt between artifact and manifest publication | Accepted data retained | No manifest referencing incomplete storage |
| Return corrupt or mismatched cached artifact | Accepted data retained | Reject artifact, try verified earlier approved version, otherwise unavailable |
| Deploy fails after interpretation generation | Last website remains live | New result generated but not marked deployed |
| Older writer finishes after a newer success | Newest valid data/deployment unchanged | Newer success and last-valid reference preserved |
| Same data, freshness boundary passes | Data unchanged | New evaluation or recheck-due labeling; old as-of not advanced |
| Status endpoint unreachable | Bundled website remains usable | Status unknown; pinned artifact retains truthful timestamps |

## 4. Phase 2 public acceptance

| ID | Gate | Required result |
| --- | --- | --- |
| U1 Navigation | Direct hash load, reload, back/forward, Research directory and full Research Map | `#/research/signal-engine` resolves under Research. Existing routes unchanged, six primary items remain, no Home conclusion. Source-page return links work. |
| U2 Coverage and grouping | Seven factor IDs, two groups; missing factor/output cases | No totals, directional counts, overall verdict, score, probability or investment action. International coverage remains partial. |
| U3 State copy | Every state in EN/ZH; TRANSITION, LITTLE_CHANGE, insufficient data | Exact approved semantics; transition always explained. Incomplete window not called transition; missing evidence not neutral. No demand-strength or dollar-role-strength overclaim. |
| U4 Card lineage | Reproduce representative cards from raw window through transform and bands | All displayed numbers/dates/source metadata trace to matching public/details/internal input. Source precision and uncertainty survive projection. Context/decomposition are not votes. |
| U5 Quality and sensitivity | All evidence-quality levels; frozen sensitive fixtures; changed current classification; missing/mismatched sensitivity report | Quality explicitly evidence quality, not probability. Badge visible when sensitive; no winning grid variant. Missing sensitivity blocks public promotion of that new interpretation, not economic deployment. |
| U6 Fallback and age | All P13 cases rendered, including currently unassessable factor and previous-valid history | Current data vs last-valid interpretation unambiguous in both languages. Last attempt failure, actual successful evaluation and per-factor observation endpoints distinguished. |
| U7 Data Health | Independent engine and underlying-source success/failure combinations | Separate health sections; engine success does not imply fresh sources. Artifact/input/hash/rule/last-failure/age visible or discoverable; no fake economic series. |
| U8 Responsive matrix | 320, 390, 1280 pixels × English/Chinese × light/dark = 12 baseline combinations | No page overflow, clipped controls or hidden critical notices. Intentional table scroll only. Screenshots and real browser results retained. |
| U9 Accessibility | Keyboard-only, screen reader spot-check, focus after navigation/disclosure/error, 200% text zoom and contrast | Logical headings/order; controls named; quality/state not color-only; help reachable without hover; live updates not repetitive. |
| U10 Loading and errors | Slow/offline route chunk; JSON 404; wrong hash/schema; details mismatch; unsupported future contract | Navigation survives, retry works, safe unavailable/fallback view. Never render partially trusted factor data or blank the app. |
| U11 Performance/privacy | Compare exact pre/post builds and cold browser network; inspect dist | No engine or history bundled. Home fetches no signal artifact. Proposed budgets: ≤5 KiB added initial gzip JS/CSS; ≤35 KiB route-exclusive gzip JS/CSS; ≤25 KiB current JSON gzip. Details/sensitivity deferred. No private paths or secrets in bundle/data. |
| U12 Complete release validation | Build, verify, engine/projection/route tests and production-style browser under Pages base | All pass; no production email. Review exact code/input/artifact/deployment manifest identities before any separately authorized release. |

A sensitivity report can be a separately hashed attachment, but it must share the engine evaluation's input, cutoff and rule. Do not attach an older report based on coincidentally identical factor states. The public page's methodology disclosure is part of acceptance, not optional polish.

## 5. Optional historical gates

- **H1 Labels:** every historical view and export identifies CURRENT-VINTAGE RECONSTRUCTION and explains revised current data. No real-time backtest claim.
- **H2 Coverage:** native periods, exact lags, warm-up and unavailable early series remain visible. No interpolation, carry-forward or false neutral state before source coverage.
- **H3 Replay:** publisher-vintage mode explicitly unsupported. Recorded-project replay requires retained accepted evidence at cutoff, with the closed safeguards rerun against the retained archive. Never substitute reconstruction silently.
- **H4 Isolation:** historical/sensitivity histories load on demand, keep immutable lineage and do not grow initial Home/current-page payloads. Budget and archive-size review precede shipping.

## 6. Evidence required in the next engineering report

Report starting/current main, selectively imported engine and spec hashes, wrapper/runtime versions, accepted-input receipt example, immutable storage/restore result, all fault cases, exact test accounting, deterministic hashes, frozen/current arithmetic separately, build/verify results, production diff, bundle isolation and unresolved issues. Mark unprovisioned storage or unavailable validation explicitly; do not claim deployed acceptance from mocks.

Phase 1 completion means **ready for review of production shadow pipeline**, not ready for a public Signal Engine page. Phase 2 completion needs its own public release approval. None of these gates authorize a merge or deployment in the present design task.
