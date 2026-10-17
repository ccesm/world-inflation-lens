# AI Macro Monitor D3.2 — pre-release requalification

2026-10-17, America/Los_Angeles. **Technical qualification PASS. Production recommendation NO-GO pending source-permission resolution and explicit owner approval. PR #18 stays OPEN / DRAFT; auto-merge disabled.** No production release was performed.

## Identities and preserved work

| Identity | Commit |
|---|---|
| Original published D3 head | `4f94726f7166542f42d046499748de00084b3b92` |
| D3.1 audited main (PR description) | `c420281e23bf8454d829561581d3d9194636b79a` |
| Initial D3.2 fetched main | `4e919c135eeba897ea5acc4f07380f5163248d67` |
| Final production baseline | `f9f5ba54a6ec795938cdedd5a7e984aabeec97af` |
| Independent fixture-only repair | `39867318c27caf3f1d4b4af37289056b57f40278` |
| Normal latest-main merge into D3 | `6c3cccbe42ad3bf2a5f922938f876f68b3236f1e` |
| Integrated implementation/test candidate | `216d6af68e51cf7344bcd4040ad33c7b9fd4e46b` |

The containing D3.2 report commit adds only audit/documentation files; resolve its final identity with `git rev-parse HEAD` and the PR head. Integration is 5 ahead / 0 behind final main before that report commit; 6 ahead / 0 behind afterward. There is no rebase, reset or force-push.

Main advanced beyond the supplied `0d58921` through PR #20's weekly-digest changes and refresh `f9f5ba5`. Since D3.1 it also includes five intervening daily refreshes, PR #19's independent international-fixture repair, and snapshot `0d58921`. All are preserved. All 32 production data files and all workflows match final main byte-for-byte. The D3 source-map-js 1.2.2 security patch remains; other dependencies are unchanged. Production Signal code, rules and accounting are identical to final main.

The primary checkout's unrelated changes and handoffs were not edited. The other live managed worktree was clean. Old `/private/tmp` worktrees were prunable; the surviving `.refresh/d31-*` files were preserved despite missing Git metadata. The named uncommitted D3.1 handoff/JSON were absent, so the latest PR description was used. A malformed local ref prevented fetching in the primary repository; it was left untouched. This task uses a fresh clone with durable metadata at `.refresh/d32-repository`, plus separate repair/control/candidate worktrees. No existing branch or worktree was reset or pruned.

## Prior failures and repairs

- **Pipeline:** current-main control reproduced 66 passes / 1 failure, hardcoded `1.1.0` versus actual `1.4.1`. A latent `FEATURE_BASE` equality would also reject authorized refreshes. Checks now bind application/lock versions, refresh implementation and all economic file hashes to explicit checked-out HEAD. Four new mutation cases reject invalid version, lock, refresh and bundle identities.
- **Public:** control reproduced 0 passes / 84 shared-hook failures. The October 4 clock was incompatible with refreshed source metadata; direct evaluator diagnostics reject `METADATA_AFTER_SNAPSHOT_ACCEPTANCE:sourceUpdatedAt`. Semantic expectations now use authenticated October 4 economic inputs and a compatible fixed clock. Separate live-build cases keep actual HEAD snapshot identities, with an explicit synthetic commit-time-plus-two-days test clock. It does not derive time from source metadata or represent a genuine production receipt. New cases prove future source metadata and backdated as-of requests still fail. The SSR-only test server avoids unused browser prebundling during teardown.
- **Earlier OP-12 attempt:** the prior temporary checkout lived inside permitted offline output roots. Both current repair and candidate are outside those roots; the unchanged path guard passes. The two unsupported-methodology core skips remain explicit.

The repair is an independent main-based commit and handoff, not a change to D3 economic logic. No timestamp protection or economic safeguard was relaxed. See [repair rationale](../../SIGNAL_VALIDATION_FIXTURE_REPAIR.md).

## Complete local results

| Check | Result |
|---|---|
| Locked root + isolated-engine installs; production build | PASS |
| Complete `npm run verify`, all 18 entrypoints | PASS |
| Included weekly-digest / CapEx / Infrastructure tests | 19 / 39 / 50 PASS |
| Signal core | 256 PASS, 2 existing unsupported-methodology skips, 0 FAIL |
| Signal pipeline + archive | 71/71 PASS |
| Signal public | 86/86 PASS |
| Default macro qualification | 46 PASS, 1 optional private-input skip |
| Authenticated C2 regeneration, all native values/metadata, fresh-process determinism, SPF leak mutations | 51/51 PASS, no skips |
| Latest-main/D3 scope audit | 367 protected production files, 32 data files, 16 frozen macro files PASS |
| Macro browser: 390/1280 × EN/ZH × light/dark | 8/8 PASS |
| Missing CPI, native calculations, tampered/blocked history, all conceptual selectors, same-origin base path | PASS |
| Legacy route smoke within macro suite | 26/26 PASS |
| Full existing browser acceptance | 12 homepage combinations, 324 route checks, 18 behaviors, 3 keyboard records, 2 status-fixture records PASS |
| Dedicated macro keyboard/AX | EN/ZH PASS; fresh SPF numerical-history requests = 0 |
| Root dependency audit | 0 vulnerabilities |
| Isolated engine audit | 1 inherited MODERATE Ajv `$data` ReDoS; `$data` not enabled; 0 HIGH/CRITICAL |

Both macro and full existing browser suites recorded zero page errors. Macro recorded zero runtime economic-source requests and no horizontal overflow. Chrome 155.0.8059.82. Screenshots were inspected. Full verification retains PR #19 rollback/timestamp-regression cases and PR #20 network-blocked notification tests; no actual notification was sent.

## Exact economic identity and loading

12 conceptual / **11 numerical indicators / 35 series / 12,722 records / 273 missing values / 10 numerical source identities**. All frozen D3 display, source-policy and economic bytes are unchanged.

- Projection: `1a0a3e41fdb6b5ab3bfcfa4bfae1f6891dd4ce82b0d82e00142542932b02f13b`
- History: `6bfbc2c89362cc39d3ddc7bd50044866d3251059998bcea76196878aa1dcfeb3`, 4,422,270 bytes
- Summary: `09247e08d0a45ee96c74cf6ce0646d21bc2ef3e32ff78feb271ff1db07a27688`

Macro route stays lazy; initial route/SPF selection fetches no numerical history. The four numerical sections share one validated same-origin history request after explicit expansion. Measured local initial render 533–1,009 ms, history 114–127 ms; largest-series dedicated check 119 ms. These are local concurrent-test measurements, not production benchmarks. The deferred 4.42 MB payload, 130,802-byte macro JS chunk and existing large shared bundles remain performance limitations. Missing values remain missing; there is no interpolation, data refresh or changed accounting.

## Release blockers and next steps

**NO-GO for production.** The [live permission reassessment](D32_SOURCE_PERMISSION_REVIEW.md) found an unresolved FRED static-history use question. Stored policy/October 10 review dates remain unchanged; passing its hash/allowlist tests does not establish renewed clearance. No terms-change date is claimed. SPF10 remains UNRESOLVED / EXTERNAL_SOURCE_ONLY, with no hosted numerical data, workbook, chart or download.

Formal spoken screen-reader acceptance remains **DEFERRED_BY_OWNER**, with no formal PASS/WCAG claim. Spoken reading order, announcements and external-tab behavior remain unaccepted. Snapshot freshness differs across sources by design. The isolated Ajv advisory remains an inherited maintenance item, without a dependency change in this scope.

1. Review the independent fixture repair and D3.2 changes; keep PR #18 Draft. Inspect CI for the exact pushed head; old-head CI cannot qualify this candidate.
2. Resolve FRED static-history scope with documented permission or qualified interpretation. If an acquisition/source change is needed, scope it separately and requalify; do not silently replace or refresh the frozen data.
3. Review the continuing screen-reader deferral, fixed vintages and loading limitations. Complete manual acceptance if required by the owner.
4. Only after permission resolution, obtain explicit owner approval for the exact release candidate. Fetch main again, preserve subsequent refresh/security/workflow changes, and rerun affected checks if the candidate changes. No merge or deployment is authorized by this report.
5. A later separately approved release can use the existing normal Pages path, followed by bounded public smoke checks. Rollback would require an approved new revert commit preserving later production updates. No reset or force-push.

中文：技术复核通过；生产建议为 **NO-GO**，需先解决 FRED 静态历史发布权限问题并取得所有者明确批准。11 个数值指标、35 条序列及全部冻结哈希不变，SPF10 仍仅外链。完整仓库验证、Signal 三套测试、中英文浏览器和键盘/辅助功能树检查通过；正式屏幕阅读器验收仍由所有者延期。本次未合并 main、部署、刷新经济数据、发通知或启用自动化。

Evidence: [structured results](d32-validation-results.json), [scope identities](d32-scope-evidence.json), [repeatable scope check](verify-d32-scope.mjs). Historical D3/D3.1 records retain their original baselines and are superseded for release readiness by this report. Raw local logs/screenshots remain under the candidate's ignored `.refresh/` directory and are not deployable artifacts.
