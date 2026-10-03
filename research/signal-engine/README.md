# Signal Engine V0.1 offline prototype

This private research package evaluates the seven factors in the frozen `signal-engine-v0.1-draft.1` configuration. The production application does not import it. It reads pinned repository snapshots, makes no live data requests, and writes only beneath `research/signal-engine/outputs/` or a system temporary directory.

Use Node.js 22.12 or later. The recorded review run used Node.js 24.19.0 and timezone database 2026b. Reproducing its full artifact hash requires the recorded runtime as well as identical inputs and time parameters.

From the repository root:

```sh
npm ci --prefix research/signal-engine --ignore-scripts --no-audit --no-fund
npm test --prefix research/signal-engine
```

The committed manifest references validated Git blobs at production commit `b3d2fc295b0378c7d29ae6fe8d36e275a55753a9`. Its local validation completed at `2026-10-03T15:55:16.403Z`. That timestamp proves this prototype's acceptance, not original publication or earlier project availability.

## Current snapshot

```sh
node research/signal-engine/cli.mjs evaluate \
  --manifest research/signal-engine/fixtures/repository-manifest.json \
  --rule-version signal-engine-v0.1-draft.1 \
  --mode current \
  --as-of 2026-10-03T15:55:16.403Z \
  --evaluated-at 2026-10-03T15:55:16.403Z \
  --output research/signal-engine/outputs/current.json
```

## Earlier observation periods

```sh
node research/signal-engine/cli.mjs evaluate \
  --manifest research/signal-engine/fixtures/repository-manifest.json \
  --rule-version signal-engine-v0.1-draft.1 \
  --mode current-vintage \
  --as-of 2022-06-30 \
  --evaluated-at 2026-10-03T15:55:16.403Z \
  --output research/signal-engine/outputs/reconstructed-2022-06-30.json
```

Here `--as-of` is an explicit CLI alias for an observation `periodCutoff`; emitted `asOf` is null and `historicalAvailabilityClaim` is false. `--period-cutoff` is the equivalent, more descriptive option. Do not supply both.

For actual retained project availability, use `--mode recorded-project --as-of YYYY-MM-DD`. The supplied manifest cannot support a replay before its October 2026 acceptance: those factors are unavailable. Synthetic tests demonstrate selection between complete retained vintages. `--mode publisher-vintage` fails explicitly; publisher-release replay is not implemented.

Date-only cutoffs mean the end of that UTC date. For intraday requests supply an exact UTC timestamp. `--evaluated-at` never defaults to the wall clock. Unknown/duplicate options and unsupported rule versions fail.

## Preregistered reports

```sh
node research/signal-engine/reports.mjs sensitivity \
  --manifest research/signal-engine/fixtures/repository-manifest.json \
  --rule-version signal-engine-v0.1-draft.1 \
  --mode current \
  --as-of 2026-10-03T15:55:16.403Z \
  --evaluated-at 2026-10-03T15:55:16.403Z \
  --output research/signal-engine/outputs/current-sensitivity-review

node research/signal-engine/reports.mjs historical \
  --manifest research/signal-engine/fixtures/repository-manifest.json \
  --rule-version signal-engine-v0.1-draft.1 \
  --mode current-vintage \
  --period-cutoff 2024-12-31 \
  --evaluated-at 2026-10-03T15:55:16.403Z \
  --output research/signal-engine/outputs/historical-review
```

The historical suite has the specified fixed January 1970–December 2024 chronology, six overlapping episode windows, and nine sensitivity variants at every monthly endpoint. Its cutoff option explicitly acknowledges that suite's endpoint. It does not select a best parameter set. Optional `--sensitivity false` omits historical variants and must not be represented as a complete sensitivity run.

Every engine payload is checked against the committed JSON Schema and semantic lineage validator before publication. Reports contain references to validated, content-addressed engine payloads. Report wrappers and run metadata have separate offline report schemas; they are not factor-output artifacts. Engine payloads are deterministic; execution timestamps and performance measurements are separate. Existing different artifacts are never overwritten. Use a new report directory when rerunning performance reports, whose measured runtime varies.

## Capturing another retained snapshot

```sh
node research/signal-engine/cli.mjs capture \
  --commit b3d2fc295b0378c7d29ae6fe8d36e275a55753a9 \
  --output research/signal-engine/outputs/new-input-manifest.json
```

Capture validates local Git blobs and records the actual validation completion time. It cannot manufacture older acceptance evidence or publisher vintages. To reproduce the recorded assessment, use the committed manifest, not a newly captured one. No economic snapshot is edited.

The authoritative schema uses factor `direction` for the assessment state; outcome membership is in `domestic.factorIds`/`international.factorIds`; mode/as-of information is at artifact level; factor evidence/context references resolve into the shared `lineage` array. These are deliberate schema mappings, not omitted evidence. V0.1's factor `counterevidence` arrays are empty under the frozen rules; named outcome contrasts represent conflicting channels.

See [the prototype report](../../docs/signal-engine-v0.1-prototype.md), [recorded review results](fixtures/review-results.json), and [the exact 83-case catalogue accounting](tests/validation-results.json). Generated full outputs and local dependencies are ignored. The configuration, specification and production version remain unchanged.


## Corrective iteration (offline-prototype/0.1.1)

R1–R6 safeguards are documented in [the prototype report](../../docs/signal-engine-v0.1-prototype.md#independent-methodology-review-corrections). The frozen rule/config/schema are unchanged. New tests are in `tests/corrective.test.mjs`; single-field provenance attacks and results are retained under `fixtures/corrections/`.

Operational records must provide supported UTC availability/completion evidence. Publisher proof records identify source/URL, snapshot hash, commit, applicable periods and exact publication timing; a precision label alone cannot qualify HIGH. Explicit capture receipts bind first-seen/validation/recorded/acceptance chronology to the selected snapshot. Legacy committed receipts are checked against their exact completion references.

When using `--previous`, retain predecessor artifacts and their original accepted inputs. Corrective CLI writes an immutable content-addressed copy under the destination's `artifacts/` directory. Parent chains are resolved there (or beside a content-addressed previous file), hash-checked and semantically validated. Missing ancestors or input vintages fail closed; unavailable directions are never carried forward.

Corrected generated artifacts use `outputs/corrective-v0.1.1/`; original outputs remain intact. Wall-clock run metadata stays separate. Canonical factor arithmetic may be equivalent while raw-byte/provenance identity differs; raw hashes are preserved.

## Second corrective pass (offline-prototype/0.1.2)

The focused re-review found four remaining gaps in 0.1.1. [The second-pass report](../../docs/signal-engine-v0.1-prototype.md#second-corrective-safeguard-pass) preserves that history and records the corrections. `tests/second-corrective.test.mjs` independently covers retained-vintage future revision annotations, factor-only availability fabrication, coherent full-window publication backdating, and raw artifact identity changes.

Revision comparisons separate canonical native-period/value content from revision evidence eligible at AS-OF. Publisher evidence used for HIGH cannot precede completion of its observation period; no exact release lag is invented. Factor availability is derived from supported mode and eligible evidence and checked semantically. Raw/canonical input identity changes are non-directional audit changes even when arithmetic is identical. Execution timestamps remain separate.

Use the invocation examples above with new destinations under `outputs/corrective-v0.1.2/` to preserve prior artifacts. The rule/config/schema and public version 1.0.0 remain unchanged. [Second-pass results](fixtures/corrections/second-pass-results.json) record final validation; readiness is for independent safeguard re-review only.
