# Weekly data email / 每周数据邮件

The owner selected **Friday 17:20 America/Los_Angeles**, one weekly success digest to the existing Gmail account, and daily failure alerts. GitHub runner queues can delay execution and delivery. The workflow uses the named timezone so local scheduled time follows daylight saving changes.

所有者选择每周五洛杉矶时间 **17:20** 发送至现有 Gmail；成功更新只发周报，每日失败提醒继续保留。GitHub 排队可能导致延迟，计划时间随洛杉矶夏令时调整。

## Operation / 运行

- The daily 17:40 official-data check, accepted snapshots, revision ledger, build and Pages deployment remain in place. Successful daily checks do not send an email; notification status is `NOT_REQUESTED`.
- Friday's 17:20 event performs the existing official refresh, validation, build and deployment before preparing its weekly success email. This adds one controlled refresh run on Friday. A failed build/deployment remains an update-incomplete alert and makes no new-data success claim.
- The existing main-only notification gate, self-addressed Gmail configuration, sanitized errors and bounded SMTP transport remain. No new recipient, secret, browser capability or external service is added. SMTP acceptance does not prove inbox delivery; there is no automatic SMTP retry.
- Manual dispatch supports `weekly_summary=true` **with** `refresh=true`. The combination with `refresh=false` is rejected. Ordinary manual refreshes default to failure-only email. Feature-branch dispatch cannot deploy or send production emails.
- PR #20 activated the Friday schedule and failure-only daily email cadence. This table-format revision leaves that timing unchanged and requires its own owner-approved merge. Local previews send no email. The table-format revision remains subject to its own owner-approved merge before it changes live messages.

每日 17:40 数据更新、历史记录、验证和部署照常运行；成功时不再发每日邮件。周五 17:20 增加一次完整检查，成功部署后发周报；失败则发更新未完成提醒。手动周报需同时选择 `weekly_summary=true` 和 `refresh=true`。更改须经所有者批准合并后才生效。

## Contents and clocks / 内容与时间

The digest uses the exact snapshot commit selected by the existing notify job. Its current successful check must match the workflow run ID and include a recorded completion time. The window is `(completedAt − 7×24 hours, completedAt]`. It is a rolling elapsed-time window, not a guarantee of disjoint calendar weeks: queue delays and DST transitions can cause adjacent emails' windows to overlap or leave a gap. Native observation periods never change.

The email is a compact **HTML table**, with a plain-text alternative. It contains only indicators with recorded changes in the window, not a second list of twenty unchanged key readings. Each changed indicator gets one row:

| Indicator | This week's update | Prior | Latest reported | Possible implication |
| --- | --- | --- | --- | --- |
| Bilingual short name and native unit | New / filled / revised / withdrawn event counts | Value and date | Value and date, with direction arrow | One deterministic interpretation sentence |

For newly added observations, “prior” is the immediately preceding **stored** observation in the same current snapshot, including null; it is not an inferred missing calendar period or the prior release vintage. Exact dates are visible. For historical revisions, prior and latest refer to the **same observation period before/after that revision**. Filled and withdrawn values retain their distinct meaning. No difference-in-growth calculation is added. Native numbers receive thousands separators, without changing units.

The display selects the most recent period among all retained change examples, then the latest check for that period. Older or conflicting sample bytes cannot silently substitute for the current source snapshot; the row becomes unavailable. Counts still describe recorded events, not unique observations. Bounded examples are not a full revision archive; missing examples remain unavailable. Country panels have no invented aggregate scalar.

The source footer retains publisher, URL, frequency, adjustment, source-update date and retrieval date. A truncated ledger or retained legacy entry without a completed-check timestamp makes coverage partial. A no-change week produces an explicit empty-table notice. Longer data/history remain on the existing site. Data-update failures keep the existing plain-text failure notice.

On desktop the email is a semantic five-column table. At 600px and below, media queries stack each row as a labeled card; a 390px browser preview has no horizontal overflow. Clients stripping CSS still receive a real table plus a plain-text alternative. Gmail inbox rendering may differ from the local browser preview; it has not been live-send tested for this format. There are no scripts, external images, tracking pixels or new services.

**Interpretation boundary:** “Possible implication” is an educational explanation, not a measured effect magnitude, causal result, forecast, investment recommendation or strong/weak impact score. Historical revisions are never interpreted as current economic activity. CPI index levels are not inflation rates, and unadjusted changes do not establish inflation acceleration. Treasury yields are not firms' realized borrowing costs. Inflation compensation is not pure expected inflation. TIC holdings changes are not net purchases. Power/semiconductor output does not identify AI demand.

Interpretive definitions were checked against primary institutional explanations:

- [BLS CPI FAQ](https://www.bls.gov/cpi/questions-and-answers.htm) and [seasonal adjustment FAQ](https://www.bls.gov/cpi/seasonal-adjustment/questions-and-answers.htm).
- [Federal Reserve: Tips from TIPS](https://www.federalreserve.gov/econres/notes/feds-notes/tips-from-tips-update-and-discussions-20190521.html), on expectations, risk and liquidity components.
- [Treasury TIC portfolio holdings](https://home.treasury.gov/data/treasury-international-capital-tic-system-home-page/tic-forms-instructions/securities-b-portfolio-holdings-of-us-and-foreign-securities), distinguishing holdings, transactions and valuation changes.

表格只列本周更新的指标，每项一行：指标、本周更新、前值、最新披露值、可能影响。新增行对比同一快照中前一条已存观测；修订行对比同一期修订前后，均标明日期。解释不构成因果结论、预测或影响评分。手机端按行纵向排列，完整来源集中在表后。

“本周捕获”不等于“经济活动发生于本周”。近七天统计为变化事件次数，并非独立观测数或净变动；保留的修订样本不是全部明细。缺失值不填零，不合成全球平均值，不计算周度经济增速，不提供预测、AI 因果结论或投资建议。CBO、SIPRI 等固定/人工审核版本仍按原规则维护。

## Preview and verification / 预览与验证

```sh
npm run notify:weekly-preview
# Optional local HTML file (.refresh/weekly-email-preview.html); sends nothing:
node scripts/notify.mjs --weekly --dry-run --html-preview
node scripts/verify-notification.mjs
npm run build
npm run verify
```

Preview uses the most recent completed ledger record when no workflow run ID is supplied. It explicitly simulates deployment success to render sample content, sends nothing, and does not certify a new update or deployment. Successful daily suppression is tested end-to-end with network calls forbidden and deliberately invalid mail credentials, proving no SMTP/configuration dependency in that path. Tests use explicit synthetic clocks, including DST, and do not refresh production data.

The notification regression suite automatically runs the weekly tests. It checks revision kinds, repeated events, incomplete windows, missing endpoints, future data rejection, workflow wiring, deterministic read-only output and actual CLI preview/suppression. Existing mail transport/failure tests remain.

## Handoff and rollback / 交接与回退

The initial feature changed notification scripts, a package command, the existing workflow and this document. The table-format revision changes only email rendering, previews, tests and this document; the Friday schedule and recipient configuration are unchanged. It adds no dependencies and changes no economic snapshot or frontend file. Local validation and dry-run do not activate a schedule. The table-format change has passed local tests, full build/verify and 1280px/390px browser layout checks; actual Gmail HTML rendering remains untested. Review and owner-approved merge of that revision remain open until explicitly completed.

To disable weekly delivery, remove the Friday schedule entry and restore the desired notification cadence in a reviewed change; daily refresh and historical data need not be altered. Do not retry an uncertain SMTP send automatically. Manual reruns can deliver duplicate emails; inspect workflow/Gmail before rerunning. `GMAIL_ADDRESS` and `GMAIL_APP_PASSWORD` remain the existing repository secrets and are never included in previews or reports.
