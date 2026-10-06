# Separate monitor activation checklist

**Not activated by this feature. No approval is inferred from this document.**

1. Independently review/reconcile and merge Phase 1, Phase 2 and Phase 3 dependencies, preserving their accepted contracts and protected production behavior. Current base is the stacked Phase 3 branch, not main.
2. Review monitor methodology, source qualifications and current evidence limitations. Approve this research-only implementation separately.
3. Merge the isolated workflow onto main only after review; build/verify and source/monitor regressions must pass. Verify no `public/` or `dist/` research leakage.
4. Manually qualify offline and live dry runs on the merged code. Missing release dates and last-valid source failures must remain honest. An actual new-month intake and revision fixture must pass.
5. Initialize `codex/ai-labor-monitor-history` as a **separate history-only branch**, from an approved recovery package. Never base a site deployment on this branch; no recurring commit to main. Verify append-only package checks, quota, restore and semantic replay locally, then test the actual branch writer with manual approval before activation. This task does not create the remote branch or exercise remote writes.
6. Verify GitHub runner network behavior, branch write permissions, concurrency and history restoration. The local BLS calendar 403 requires the official API fallback to work on that runner; never bypass using unofficial sources. Revalidate new annual CPS layouts (2027 currently unqualified).
7. Explicitly set **both** `AI_LABOR_MONITOR_ENABLED=true` and `AI_LABOR_HISTORY_WRITE_ENABLED=true`. Absent/false variables keep scheduled jobs disabled. Do not enable delivery as a side effect.
8. After enabling, observe at least one **genuine GitHub scheduler-triggered** Tuesday/Friday run. Check Los Angeles wall-clock cadence, source results, economic-change identity, persisted history, repeated-run suppression and no deployment/email. A manual dispatch is not evidence of scheduler execution.
9. Keep email disabled until stability across several real releases is demonstrated. Separate explicit approval is required for Gmail delivery; reuse existing infrastructure without new secrets or duplicate daily notifications.

## Recovery and retention

- Disable the two variables if qualification/storage fails; do not delete prior records.
- Recover the last verified store from the history branch or an independently retained package/bundle.
- Validate immutable paths, source objects, receipts, current view and recorded replay before using recovered data.
- At 2,048 evaluations or before 256 MiB, archive verified history and separately approve migration. No automatic deletion/force push.
- Alerts are candidates only. Clearing an alert ledger requires a reviewed migration, not a routine retry.

## Honest status

Feature branch prepared: YES. Local qualification: see `qualification.md`. Main reconciliation: NOT DONE. Remote history writer qualification: NOT DONE. Repository variable activation: NOT DONE. Genuine scheduled execution: NOT DONE. Email activation: NOT DONE. Public release: NOT AUTHORIZED.
