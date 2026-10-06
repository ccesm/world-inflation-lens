# Branch audit — 2026-10-06

Handoff from Claude Code to Codex. Audited every remote branch against `main` at `d7c59cd` (2026-10-06 data refresh). Method: GitHub compare (`ahead_by`/`behind_by`), PR history, ancestry checks, and a per-file blob comparison between each branch tip and `main` for branches whose commits were squashed rather than merged.

Nothing was deleted. This session can push only `claude/*` branches; deleting `codex/*` branches was refused (HTTP 403), so the deletions below are yours to run.

## Summary

| Group | Count | Action |
| --- | --- | --- |
| Fully contained in `main` | 11 | Delete |
| Superseded, but holds files `main` still links to | 1 | Delete after PR `claude/restore-signal-review-results` merges |
| Active AI-labor stack | 4 | Keep; open one PR from the top branch |
| Keep | 3 | `main`, `system-status`, `claude/add-agent-guides` |

## 1. Safe to delete (11)

Every branch below has `ahead_by = 0` against `main`, or every changed file is byte-identical to `main`, or it is a strict ancestor of a branch that stays. Tip SHAs are recorded so any branch can be recreated with `git push origin <sha>:refs/heads/<name>`.

| Branch | Tip SHA | Evidence |
| --- | --- | --- |
| `codex/international-dollar-evidence` | `2ec84f870ee8cb7a20baecc8fa476b788ccc2cc4` | PR #1 merged (1.0.0); ahead 0 |
| `codex/signal-engine-production-pipeline` | `3e45e33dc989bd3469d13e29afab4e3c8ef44b3b` | PR #2 merged; ahead 0 |
| `codex/signal-shadow-email-summary` | `75ba5071d8fbb7f5d07e0488960dfe322e1a2ee3` | PR #3 merged; ahead 0 |
| `codex/signal-shadow-no-private-archive` | `42ee0bf050d4ce27f1790a2d413f717ca5d234d1` | PR #4 merged; ahead 0 |
| `codex/signal-conclusion-generator` | `a4b4c838ad515ca27c322c1f7c39a23a51c3bf3f` | PR #5 merged; ahead 0 |
| `codex/public-signal-engine-ui` | `b90edd4f0d48bd690c4ccab740b77d3f99390839` | PR #6 merged (1.1.0); ahead 0 |
| `codex/v1-dual-dollar-architecture` | `494ae75208ec5b3da249f9ed185ad43f7be62cab` | No PR; ahead 0 |
| `codex/signal-engine-spec` | `faaae287f1b144bd8396023a8f134b66ae84404c` | All 5 changed files identical to `main` |
| `codex/signal-engine-production-design` | `ab4bb115dd2553fe182eb9606dc3a3012f1bce7f` | All 3 changed files identical to `main` |
| `codex/signal-engine-prototype` | `001184482d9a9692edfb064d58fb09837311c196` | Ancestor of `prototype-fixes-2` |
| `codex/signal-engine-prototype-fixes` | `8eccd2512e90ca71f95d1ef4f4bedbded9158827` | Ancestor of `prototype-fixes-2` |

```sh
git push origin --delete \
  codex/international-dollar-evidence \
  codex/signal-engine-production-pipeline \
  codex/signal-shadow-email-summary \
  codex/signal-shadow-no-private-archive \
  codex/signal-conclusion-generator \
  codex/public-signal-engine-ui \
  codex/v1-dual-dollar-architecture \
  codex/signal-engine-spec \
  codex/signal-engine-production-design \
  codex/signal-engine-prototype \
  codex/signal-engine-prototype-fixes
```

## 2. Missing review evidence on `main` (fixed in a Claude PR)

The prototype chain reached `main` as the single squashed commit `62b3275` ("Add isolated Signal Engine shadow pipeline"). Four files from `codex/signal-engine-prototype-fixes-2` (`139c36e`) did not come with it, although `main` links to three of them:

| File | Size | Linked from |
| --- | --- | --- |
| `research/signal-engine/fixtures/review-results.json` | 63,885 B | `docs/signal-engine-v0.1-prototype.md:81`, `research/signal-engine/README.md:84` |
| `research/signal-engine/fixtures/corrections/corrective-results.json` | 44,633 B | `docs/signal-engine-v0.1-prototype.md:139` |
| `research/signal-engine/fixtures/corrections/second-pass-results.json` | 35,434 B | `docs/signal-engine-v0.1-prototype.md:171`, `research/signal-engine/README.md:103` |
| `research/signal-engine/outputs/.gitkeep` | 0 B | Whitelisted by `research/signal-engine/.gitignore` (`!outputs/.gitkeep`) |

Branch `claude/restore-signal-review-results` restores them byte-for-byte from `139c36e`; nothing else changes. All three JSON files parse, and every link above resolves. `npm run build` and `npm run verify` pass.

The other two files that differ between `prototype-fixes-2` and `main` (`research/signal-engine/README.md`, `tests/normative.test.mjs`) were left alone: `main` has later versions of both.

**Please check:** if leaving these files out of `62b3275` was deliberate, close the PR and fix the links instead. Otherwise merge it, then delete `codex/signal-engine-prototype-fixes-2`.

## 3. Pre-existing failing test on `main` (not fixed)

`npm run signal:test`: 258 tests, 255 pass, **1 fails**, with or without the restored files.

- Test: `OP-12 offline path cannot write production` (`research/signal-engine/tests/normative.test.mjs:100`)
- Failure: `'1.1.0' !== '1.0.0'`. The test hard-codes the application version as `1.0.0`, but the 1.1.0 release (PR #6) bumped `package.json`.
- `deploy.yml` runs `npm run verify`, not `signal:test`, so CI never caught this.

Left for you to decide: update the expected value, or have the test read it from `package.json`. Consider adding `signal:test` to CI.

## 4. Active AI-labor stack (keep)

Four strictly stacked branches. Each contains the one before it, and all sit on `9147ed4`, one data-refresh commit behind current `main`:

`observed-ai-labor-market-pipeline` (`289f93d`) → `occupational-ai-exposure-crosswalk` (`e09b7c9`) → `observed-labor-outcomes-by-ai-exposure` (`57f9b70`) → `ai-labor-continuous-monitor` (`09fcc21`)

No PR is open yet. Suggest opening a single PR from `codex/ai-labor-continuous-monitor` and deleting the three lower branches after it merges. Before merging, note:

- **Size:** 507 files and about 614,000 added lines, mostly data under `research/ai-labor-transition/`. This would noticeably grow the repository. Consider compressing it, storing it elsewhere, or checking it in only partially.
- **New scheduled workflow:** `.github/workflows/ai-labor-monitor.yml` runs Tue/Fri 10:37 America/Los_Angeles. Scheduled runs are gated on `vars.AI_LABOR_MONITOR_ENABLED` and `vars.AI_LABOR_HISTORY_WRITE_ENABLED`; manual dispatch is not gated.
- **Missing branch:** the scheduled path checks out `codex/ai-labor-monitor-history`, which does not exist yet.
- Nothing outside `research/`, `docs/` and that one workflow changes. No `src/` or `package.json` changes.

## 5. Keep

- `main`
- `system-status`: bot-written status branch with no common ancestor with `main`, as designed.
- `claude/add-agent-guides` (`5b9605b`): adds the shared `AGENTS.md` and `CLAUDE.md`, pending merge. Branch conventions from that file apply: Codex uses `codex/*`, Claude Code uses `claude/*`, and neither pushes to the other's branches.
