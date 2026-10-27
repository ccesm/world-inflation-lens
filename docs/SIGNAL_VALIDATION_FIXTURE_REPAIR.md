# Signal validation fixtures — D3.2 independent repair

Production baseline: `4e919c135eeba897ea5acc4f07380f5163248d67` (2026-10-17 local date), including PR #19 international fixture repair, refreshed snapshots `0d58921`, and PR #20 weekly digest. This branch changes tests and this handoff only; no economic snapshots, Signal production code, accounting, rules, dependencies, workflows or notification behavior change.

On that exact unmodified main, pipeline/archive reproduced 66 passes / 1 failure (`1.4.1 !== 1.1.0`), and public reproduced 0 passes / 84 shared-hook failures. The hidden second pipeline assertion compared all economic files with the October 4 v1.1 release and would reject authorized daily updates. Direct engine replay with a pre-vintage clock rejects `METADATA_AFTER_SNAPSHOT_ACCEPTANCE`; the guard is correct.

Pipeline preservation now compares working application/lock versions, refresh implementation and every committed economic file against the explicit checked-out HEAD baseline. Four negative cases reject mismatched version, lock, refresh identity and bundle identity. Frozen arithmetic expectations still use the original authenticated `21cdb441befc2e3b3a52011093603911a67d9a5f` economic bytes and explicit October 4 clock. The original vintage sandbox is shared by both suites without changing its behavior.

Public semantic/count/quality expectations now run against that same frozen commit and its compatible clock. Separate current-build tests retain actual HEAD economic inputs, snapshot identities and integrity checks; their explicit synthetic test clock is the checked-out commit timestamp plus two days. It is independent of source values, does not infer historical acceptance, and does not auto-adjust to future source metadata. Mock economic gate receipts are test fixtures only. Positive current-build publication, fallback and cleanup tests remain. New real evaluator cases reject source metadata after acceptance and an as-of before acceptance. Temporal guards and production evaluation are unchanged.

The SSR-only Vite test server disables unused browser dependency discovery to avoid an asynchronous scan racing teardown; SSR component rendering still runs.

Repair validation: clean locked installs, build and full repository verification PASS; pipeline/archive 71/71 PASS; public 86/86 PASS, including new negative cases. Signal core is independently rechecked as part of D3.2; see the candidate D3.2 report for final exact-commit results. Local work is isolated from existing user changes and previous D3/D3.1 checkouts. No merge, refresh, mail or production deployment is authorized by these results.

中文：本修复只调整测试基线、固定历史输入与测试时钟；不修改经济数据、Signal 生产逻辑或时间回退保护。完整构建与仓库验证通过，pipeline/archive 71 项、public 86 项通过，包括无效输入拒绝案例。生产发布仍需所有者明确批准。
