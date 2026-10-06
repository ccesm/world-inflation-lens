# AI-labor repository footprint and storage reconciliation

Audit only. No AI-labor branch was merged, rewritten, deleted or activated.
No research evidence was removed. Reviewed stack head:
`09fcc21aad29c36697f4775048ad87694a1a8b61`; current main at initial fetch:
`d7c59cddfc80c360dd4de8d11fc08903b2b35752`.

## Measured footprint

The three-dot comparison against main includes 507 added files, 614,452 added
text lines and 362 binary files. File-path content totals 154,599,037 bytes
(147.44 MiB); distinct Git blobs total 111,595,685 bytes (106.43 MiB).
These are content measurements, not packfile or download sizes. Git already
deduplicates identical blobs: 151 alias groups account for 43,003,352 bytes
(41.01 MiB) of repeated paths. Removing duplicate paths alone does not save
that amount in Git's object database.

| Class | Files | Path bytes | Meaning and proposed disposition |
|---|---:|---:|---|
| A | 78 | 1,220,946 | Code, workflows, schemas, methodology, frozen specifications, hash markers, compact accepted manifests/receipts: retain in Git |
| B | 13 | 50,017 | Small pinned deterministic fixture data and accompanying fixture notes: retain in Git |
| C | 180 | 61,767,836 | Current aliases and reproducible normalized/convenience/operational exports: hydrate or regenerate locally, then cease normal tracking |
| D | 236 | 91,560,238 | Immutable source inputs, vintages, revision evidence and frozen accepted research outputs: preserve intact in a durable content-addressed archive before ceasing normal tracking |

The exact classification of every path, byte count, Git blob identity and
disposition is in [the inventory](ai-labor-repository-footprint-2026-10-06.json).
The [416-path proposed untracking list](ai-labor-proposed-untracking-2026-10-06.txt)
contains literal paths, separated into C and D. This is a conditional migration
proposal, **not a deletion instruction or a completed migration**. Categories
describe lifecycle, not evidentiary importance. D is essential evidence.

Major contributors:

- Occupational immutable accepted vintages: approximately 30.01 MiB across
  15 files; the current O*NET alias adds another 7.47 MiB.
- CPS outcomes: 139 accepted monthly files and 139 immutable vintage files,
  approximately 29.10 MiB in each tree. Their alias identities are recorded
  in the inventory; retain one immutable copy and rehydrate the aliases.
- Occupational original source archive: approximately 15.11 MiB, including
  a 12.30 MiB O*NET source object.
- Large generated occupation/task/descriptor/usage views and frozen Phase 3
  outcome tables supply much of the text-line footprint. Compression alone
  does not settle their lifecycle or preserve vintage proof.

## Recommended archive model

Use a small Git-tracked lock/index plus **immutable versioned research bundles**
outside ordinary main history. A GitHub Release asset in the existing
repository is a practical first option, subject to redistribution review;
an approved durable object store is an alternative. Do not create a new private
repository or make credentials part of core reproduction. No archive was
uploaded or published in this task.

Each bundle must identify the original stack commit, frozen specification,
source URLs and publisher pins, licenses/attribution, raw-source hashes,
canonical payload hashes, original retrieval/acceptance receipts, benchmark
manifests and a complete per-file path/size/SHA-256 map. Hash both the bundle
and every extracted object. Preserve original bytes; do not regenerate a
source receipt or backdate acceptance during migration. Keep source revisions
and historical conclusions even when they appear obsolete.

Split bundles by Phase 1 sources/vintages, Phase 2 occupational sources/vintages,
Phase 3 sufficient statistics/accepted benchmarks, and monitor qualification
history. A manifest should allow only the required phase to be restored.
Transient individual-record CPS ZIPs remain outside Git; accepted sufficient
statistics, source identities and qualified layouts remain recoverable.

Current provider/monthly aliases should be reconstructed from the immutable
objects using the existing accepted identity manifests. Convenience outputs
can be regenerated from the hydrated archive and compared with their pinned
accepted hashes. Frozen Phase 3 outputs also remain in the bundle so their
accepted conclusions can be inspected without rerunning the analysis.

## Migration qualification required before removing tracking

1. Verify redistribution permissions for each source; include the existing
   attribution and license notices in the bundle.
2. Create and independently verify an immutable archive from the exact reviewed
   stack; test durable download, checksums and recovery on a clean machine.
3. Add a hash-pinned archive index and explicit offline hydration command.
   Reject path traversal, missing files, wrong hashes and unavailable archives.
   A network refresh must not substitute for a missing historical vintage.
4. Refactor loaders/tests to accept an external hydrated research root rather
   than require tracked paths. The monitor currently directly depends on the
   Phase 1–3 files, including the frozen Phase 3 output manifest and inputs.
5. Restore aliases and reproduce Phase 1–3 validation and monitor results.
   Existing specifications, quintiles, accepted values and conclusions must
   not change. Test recovery without live macroeconomic APIs.
6. Remove only the listed C/D paths from the **new normal-main delivery** after
   those gates pass; update links to verified archive locations.

Important: committing `git rm` at the top of the existing stack and merging
the stack would still bring its old large objects into main ancestry. Prepare
a separately reviewed slim delivery branch from latest main containing A/B
and the archive/hydration contract, without importing the original stack's
large-object ancestry. Preserve the original stack as recovery evidence until
the durable archive is verified. No force push or history rewrite is proposed.
Retaining original stack refs in this repository will still affect a full
all-ref clone; decide their long-term archival/ref retention separately.

## Monitor history readiness

`codex/ai-labor-monitor-history` was absent at the fetched remote state. The
monitor workflow is absent on main, and no repository variable was changed.
The feature workflow's scheduled path requires both enable variables, then
checks out that branch. Manual dry-run does not publish history. If someone
enabled scheduling without initializing storage, checkout would fail.

The future compact recurring history branch is separate from the bulky frozen
baseline bundles. It should contain only validated compact monitor objects,
manifests, receipts, evaluations and the alert ledger. It needs an explicit
initialized root, single-writer qualification, immutable append/recovery tests,
quota/retention handling and verified absence of site deployment triggers.
Do not bootstrap from a fabricated historical acceptance timestamp.

Complete the monitor's existing activation checklist: reconcile dependencies
on main, research review, manual GitHub-hosted Linux dry-run, durable history
write/read/recovery tests, leakage checks, explicit variable approval and a
genuine scheduled-run verification. Email requires additional approval after
monitoring stability. Local qualification is not remote storage qualification.

## Remaining issues

- **HIGH before AI-labor merge:** external preservation/hydration has not yet
  been implemented or qualified. Applying the proposed removals now would
  break reproduction. The current stack must remain intact meanwhile.
- **HIGH before monitor activation:** durable history branch, remote writer
  and GitHub-hosted recovery qualification are absent.
- **MEDIUM:** 106.43 MiB of distinct content would enter ordinary repository
  history through a conventional stack merge; aliases alone are not the cure.
- **MEDIUM evidence limits:** partial occupational coverage, no validated
  design-based uncertainty, earnings comparability, partial years, bounded
  historical revision discovery and future annual layout qualification.

Recommended next task: archive/hydration qualification and slim delivery
preparation. Do not activate the monitor or change the accepted methodology.
