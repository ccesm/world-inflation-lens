# Weekly data email / 每周数据邮件

The owner selected **Friday 17:20 America/Los_Angeles**, one weekly success digest to the existing Gmail account, and daily failure alerts. GitHub runner queues can delay execution and delivery. The workflow uses the named timezone so local scheduled time follows daylight saving changes.

所有者选择每周五洛杉矶时间 **17:20** 发送至现有 Gmail；成功更新只发周报，每日失败提醒继续保留。GitHub 排队可能导致延迟，计划时间随洛杉矶夏令时调整。

## Operation / 运行

- The daily 17:40 official-data check, accepted snapshots, revision ledger, build and Pages deployment remain in place. Successful daily checks do not send an email; notification status is `NOT_REQUESTED`.
- Friday's 17:20 event performs the existing official refresh, validation, build and deployment before preparing its weekly success email. This adds one controlled refresh run on Friday. A failed build/deployment remains an update-incomplete alert and makes no new-data success claim.
- The existing main-only notification gate, self-addressed Gmail configuration, sanitized errors and bounded SMTP transport remain. No new recipient, secret, browser capability or external service is added. SMTP acceptance does not prove inbox delivery; there is no automatic SMTP retry.
- Manual dispatch supports `weekly_summary=true` **with** `refresh=true`. The combination with `refresh=false` is rejected. Ordinary manual refreshes default to failure-only email. Feature-branch dispatch cannot deploy or send production emails.
- Merging this change to main activates the new schedule and changes the daily email cadence. Owner approval is required before merging. This branch and its local previews send no email.

每日 17:40 数据更新、历史记录、验证和部署照常运行；成功时不再发每日邮件。周五 17:20 增加一次完整检查，成功部署后发周报；失败则发更新未完成提醒。手动周报需同时选择 `weekly_summary=true` 和 `refresh=true`。更改须经所有者批准合并后才生效。

## Contents and clocks / 内容与时间

The digest uses the exact snapshot commit selected by the existing notify job. Its current successful check must match the workflow run ID and include a recorded completion time. The window is `(completedAt − 7×24 hours, completedAt]`. It is a rolling elapsed-time window, not a guarantee of disjoint calendar weeks: queue delays and DST transitions can cause adjacent emails' windows to overlap or leave a gap. Native observation periods never change.

The report contains:

1. Recorded added, filled, revised and withdrawn **event counts**, per series and for the window. Repeated revisions of one historical observation are separate events, not unique-observation or net-change counts.
2. Latest available native readings for changed series, with up to three retained revision examples per series. The existing ledger already bounds examples; these are samples, not a complete revision archive.
3. Twenty existing key indicator readings covering inflation, interest rates, monetary conditions, productivity, investment, energy and international-dollar data. These are source observations, not a new score or weekly-frequency economic dataset.
4. Source URL, publisher, unit, original frequency/adjustment, source update date and retrieval date. A missing latest endpoint is unavailable; a last-valid value is separately dated. A World Bank country panel is described as a country panel, with no synthetic global average.
5. Coverage and interpretation notes. No changes is a valid weekly result. A truncated ledger or any retained legacy entry without a completed-check timestamp makes coverage conservatively partial. Future checks are excluded, identical duplicate runs deduplicated, contradictory records rejected.

“本周捕获”不等于“经济活动发生于本周”。近七天统计为变化事件次数，并非独立观测数或净变动；保留的修订样本不是全部明细。缺失值不填零，不合成全球平均值，不计算周度经济增速，不提供预测、AI 因果结论或投资建议。CBO、SIPRI 等固定/人工审核版本仍按原规则维护。

## Preview and verification / 预览与验证

```sh
npm run notify:weekly-preview
node scripts/verify-notification.mjs
npm run build
npm run verify
```

Preview uses the most recent completed ledger record when no workflow run ID is supplied. It explicitly simulates deployment success to render sample content, sends nothing, and does not certify a new update or deployment. Successful daily suppression is tested end-to-end with network calls forbidden and deliberately invalid mail credentials, proving no SMTP/configuration dependency in that path. Tests use explicit synthetic clocks, including DST, and do not refresh production data.

The notification regression suite automatically runs the weekly tests. It checks revision kinds, repeated events, incomplete windows, missing endpoints, future data rejection, workflow wiring, deterministic read-only output and actual CLI preview/suppression. Existing mail transport/failure tests remain.

## Handoff and rollback / 交接与回退

The feature changes notification scripts, a package command, the existing workflow and this document. It adds no dependencies and changes no economic snapshot or frontend file. Local validation and dry-run do not activate a schedule. Review and owner-approved merge remain open until explicitly completed.

To disable weekly delivery, remove the Friday schedule entry and restore the desired notification cadence in a reviewed change; daily refresh and historical data need not be altered. Do not retry an uncertain SMTP send automatically. Manual reruns can deliver duplicate emails; inspect workflow/Gmail before rerunning. `GMAIL_ADDRESS` and `GMAIL_APP_PASSWORD` remain the existing repository secrets and are never included in previews or reports.
