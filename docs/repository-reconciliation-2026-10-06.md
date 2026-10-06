# Repository reconciliation — 2026-10-06

Initial main: `d7c59cddfc80c360dd4de8d11fc08903b2b35752`.
Working branch: `codex/repository-reconciliation`, based on main, not the AI-labor stack.

## PR reviews

- [PR #8](https://github.com/ccesm/world-inflation-lens/pull/8), head
  `5b9605be70636bddff6ae778344b1bfcdb03a9b0`: recommend merging first.
  Only AGENTS.md and CLAUDE.md are added; shared data/product/git rules match
  the existing project. Optional wording clarification: AGENTS describes verify
  as required before every push while CLAUDE exempts documentation-only changes.
  This is a documentation consistency improvement, not a code/data blocker.
- [PR #7](https://github.com/ccesm/world-inflation-lens/pull/7), head
  `d68af38e4df431c43d375e8ea91dda8c9ff04176`: recommend merging after #8.
  Three linked JSON evidence files and outputs/.gitkeep are absent on main and
  restored byte-for-byte from `139c36e`. JSON parses; checked secret/local-path
  markers were absent. No evidence of a deliberate omission was found.
  The PR's README and normative test match newer main byte-for-byte, so those
  later improvements are preserved. Only the four restorations and branch audit
  change. Historical result JSONs are evidence records, not a new test execution.

The shared guide requires explicit owner approval to merge. The request asks
for a recommendation on #8; confirmation of the merge order was requested.
No PR was merged during this review, and branch deletion remains gated on
#7's successful merge and a fresh tip check. The AI-labor stack is not a merge
candidate in this task.

## OP-12 and CI

The previous OP-12 literal compared the app with `1.0.0` although package.json
is `1.1.0`. It now captures the expected version and complete package bytes
before exercising blocked offline destinations, then verifies both are intact
and the protected Git diff is unchanged. This tests preservation across future
legitimate releases rather than permanently asserting a retired version.

Added `.github/workflows/signal-engine-tests.yml`: read-only Ubuntu/Node 24.19.0
PR-to-main and manual engine regression qualification. No deploy, email, source
refresh or schedule. It installs the isolated engine dependencies and runs
`npm run signal:test`. Recommend requiring this check in branch protection.
Do not append the full engine test suite to the production `npm run verify`
path: that would couple engine regressions to otherwise valid economic
refresh/deployment, defeating the established interpretation failure isolation.
Existing public-artifact/build verification remains in place.

Validation: 258 engine tests, 256 passed, 0 failed, 2 established deferred cases
(publisher-vintage replay and future adopted-rule execution). Focused OP-12
passed. Build passed with existing chunk-size warning. Full verify passed.
PR workflow YAML/trigger/permission/command checks passed locally. GitHub-hosted
execution is not claimed by these local checks. Version remains 1.1.0.

## Branch recovery and deletion gates

All 12 remote tips below matched the audit at fetch. Seven are ancestors of
main. The spec's five changed files and design's three files match main exactly;
prototype/fixes are ancestors of fixes-2. fixes-2 evidence is restored by #7;
its newer main README/test must not be replaced.

Before actual deletion, refresh remote tips, reject any moved tip, confirm
#7 merged and restored files present on main, and preserve archived commit
reachability for the squashed prototype/spec/design history. An archival tag
or verified durable Git bundle is appropriate; SHA text alone is insufficient
protection from future garbage collection. Do not force push.

| Branch | Verified tip | Action in this pass |
|---|---|---|
| `codex/international-dollar-evidence` | `2ec84f870ee8cb7a20baecc8fa476b788ccc2cc4` | Retained pending merge order |
| `codex/signal-engine-production-pipeline` | `3e45e33dc989bd3469d13e29afab4e3c8ef44b3b` | Retained pending merge order |
| `codex/signal-shadow-email-summary` | `75ba5071d8fbb7f5d07e0488960dfe322e1a2ee3` | Retained pending merge order |
| `codex/signal-shadow-no-private-archive` | `42ee0bf050d4ce27f1790a2d413f717ca5d234d1` | Retained pending merge order |
| `codex/signal-conclusion-generator` | `a4b4c838ad515ca27c322c1f7c39a23a51c3bf3f` | Retained pending merge order |
| `codex/public-signal-engine-ui` | `b90edd4f0d48bd690c4ccab740b77d3f99390839` | Retained pending merge order |
| `codex/v1-dual-dollar-architecture` | `494ae75208ec5b3da249f9ed185ad43f7be62cab` | Retained pending merge order |
| `codex/signal-engine-spec` | `faaae287f1b144bd8396023a8f134b66ae84404c` | Retained pending merge order |
| `codex/signal-engine-production-design` | `ab4bb115dd2553fe182eb9606dc3a3012f1bce7f` | Retained pending merge order |
| `codex/signal-engine-prototype` | `001184482d9a9692edfb064d58fb09837311c196` | Retained pending merge order |
| `codex/signal-engine-prototype-fixes` | `8eccd2512e90ca71f95d1ef4f4bedbded9158827` | Retained pending merge order |
| `codex/signal-engine-prototype-fixes-2` | `139c36e5efd642aedcfd2a43194f5b8f09c7831e` | Retained pending merge order |

Retain the four AI-labor branches, main, system-status and the two open Claude
PR branches. The pre-existing local v0.13 branch was not in the deletion list.
No branch owned by another agent was pushed. Five pre-existing untracked
research design documents remain untouched and are excluded from this change.

## AI-labor storage and activation

See [storage audit](ai-labor-storage-reconciliation-2026-10-06.md),
[507-file inventory](ai-labor-repository-footprint-2026-10-06.json) and
[exact proposed paths](ai-labor-proposed-untracking-2026-10-06.txt). No files
were removed. Archive/hydration qualification and a slim delivery branch are
recommended before any main integration. The remote monitor history branch
is missing; scheduled monitoring and email remain unactivated.

## Approved execution follow-up

The owner subsequently approved #8 → refresh/reconcile → #7 →
refresh/reconcile → #9. This follow-up supersedes the pending-approval and
retention statuses recorded above without erasing the original review.

- PR #8 merged at `22e40ad6e5720db20e5514c12308f21ffa9a0207`.
- PR #7 merged at `d09698f645507684b41ecd36b21e16ff6614472c`.
- Both reconciliations were conflict-free; the four restored files on main
  match `139c36e` byte-for-byte. No newer README/test was replaced.
- All twelve live remote tips matched the audit immediately before an atomic
  remote deletion. Matching local branches were also deleted.
- Two pushed annotated recovery tags preserve squashed commit reachability:
  `archive/signal-engine-prototype-2026-10-06` → `139c36e`, and
  `archive/signal-engine-production-design-2026-10-06` → `ab4bb11`.
  These are recovery refs, not production releases.

| Branch | Deleted remote tip | Remote/local deletion |
|---|---|---|
| `codex/international-dollar-evidence` | `2ec84f870ee8cb7a20baecc8fa476b788ccc2cc4` | YES / YES |
| `codex/signal-engine-production-pipeline` | `3e45e33dc989bd3469d13e29afab4e3c8ef44b3b` | YES / YES |
| `codex/signal-shadow-email-summary` | `75ba5071d8fbb7f5d07e0488960dfe322e1a2ee3` | YES / YES |
| `codex/signal-shadow-no-private-archive` | `42ee0bf050d4ce27f1790a2d413f717ca5d234d1` | YES / YES |
| `codex/signal-conclusion-generator` | `a4b4c838ad515ca27c322c1f7c39a23a51c3bf3f` | YES / YES |
| `codex/public-signal-engine-ui` | `b90edd4f0d48bd690c4ccab740b77d3f99390839` | YES / YES |
| `codex/v1-dual-dollar-architecture` | `494ae75208ec5b3da249f9ed185ad43f7be62cab` | YES / YES |
| `codex/signal-engine-spec` | `faaae287f1b144bd8396023a8f134b66ae84404c` | YES / YES |
| `codex/signal-engine-production-design` | `ab4bb115dd2553fe182eb9606dc3a3012f1bce7f` | YES / YES |
| `codex/signal-engine-prototype` | `001184482d9a9692edfb064d58fb09837311c196` | YES / YES |
| `codex/signal-engine-prototype-fixes` | `8eccd2512e90ca71f95d1ef4f4bedbded9158827` | YES / YES |
| `codex/signal-engine-prototype-fixes-2` | `139c36e5efd642aedcfd2a43194f5b8f09c7831e` | YES / YES |

All four AI-labor branch tips remain unchanged. No AI-labor merge, untracking,
monitor activation, history write or email enablement occurred. PR #9 retains
only the approved isolation test, separate PR CI and reconciliation reports.
After its merge, start archive/hydration qualification separately; do not
create a slim delivery branch before that qualification.

Post-reconciliation qualification against main after #7: build and full verify
passed; Signal suite 256 passed, 0 failed, 2 established deferrals. The #9
feature head is ready for its approved merge.
