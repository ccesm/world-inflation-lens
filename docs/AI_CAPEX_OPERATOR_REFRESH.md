# AI CapEx data maintenance / AI 资本支出数据维护

The public page remains fixed-vintage through 2026Q2, with disclosure basis 2026-07-30. This control changes no financial values, accounting definitions or research conclusions. AI ROI is not identified.

## Run a check / 检查最新财报

1. Open **Check for New Reports / 检查最新财报** at the end of `#/research/ai-capex`.
2. GitHub opens [AI CapEx Quarterly Refresh](https://github.com/ccesm/world-inflation-lens/actions/workflows/ai-capex-quarterly-refresh.yml). An authenticated repository operator selects **Run workflow** on main.
3. Select `mode=check` and ALL or one company. Leave manual source fields empty.
4. Read the step summary and download the compact candidate artifact. A blocked discovery endpoint means an official URL is required; it does not mean no report exists.

打开研究页末尾的“检查最新财报”，在 GitHub 登录后手动运行工作流。选择 check 和公司范围，查看运行摘要及候选报告。访问被阻止不等于没有新财报。

## Official URL fallback / 官方链接备用路径

1. Open the company's official investor relations site.
2. Find the official quarterly earnings release, financial workbook or PDF.
3. Copy the document URL; do not enter financial values.
4. Rerun with `mode=manual_seed`, company MSFT/GOOG/AMZN/META, `expected_quarter=YYYYQn` (calendar quarter), and `official_url`.
5. Review the candidate artifact. Stop at human review.

自动发现不可用时，从公司官方投资者关系网站复制财报文件 URL，选择 manual_seed、公司和日历季度，再运行资格检查。不得手工输入收入、资本支出或现金流。

New CDN URLs or tenants produce DELEGATION_REVIEW_REQUIRED with issuer-parent evidence. Known URLs with changed bytes require review. Qualified fetch does not imply qualified accounting extraction: Microsoft workbook layouts and PDFs without exact standalone quarterly context may remain REVIEW_REQUIRED. Period, issuer, MIME, units, scope, definitions and company-specific FCF reconciliation must pass before QUALIFIED_CANDIDATE. Missing optional families remain unavailable. Recognized quarterly AI-only revenue remains UNAVAILABLE; RUN_RATE is never converted to quarterly revenue.

新的 CDN 链接或租户须先审查发行人授权关系。成功下载不代表会计提取合格；季度、发行人、文件类型及会计口径无法证明时，候选项会保留为“需要审查”，系统不会估值、补值或自动接受。

## Results / 结果

- NO ACTION NEEDED / 无需操作: a qualified source scope shows no new disclosure, or the known historical source is unchanged.
- OFFICIAL URL REQUIRED / 需要官方链接: discovery is blocked or has no supported static link.
- REVIEW REQUIRED / 需要审查: identity, delegation, accounting or source ambiguity remains.
- QUALIFIED CANDIDATE READY FOR REVIEW / 合格候选项待人工审查: candidate core data qualified; publication is still prohibited.

The artifact records run ID, actor, mode, source URLs/hashes, expected quarter, candidate core metrics, FCF reconciliation, optional status, definition/restatement warnings, monitor comparisons and preview hash. No raw archive is uploaded. Compact Actions artifacts expire after 30 days; export a reviewed package if longer retention is required. Do not treat Actions artifacts as accepted permanent economic history.

## Control boundary / 控制边界

Manual dispatch only; contents: read; no repository writes, email, schedule, Pages deploy, automatic acceptance or public snapshot mutation. The browser link requires no PAT, OAuth, API credential or financial API. Inputs are passed as environment data, never shell expressions. Execution checks out one immutable research SHA, documented below; operators cannot choose arbitrary code refs.

The complete research history stays outside main. The four-company shared public quarter can advance only after all four have qualified core data for the same calendar quarter and explicit owner review approves a separate snapshot publication change. Partial company releases remain separate candidates. The workflow does not promote anything.

## Registration gate / 注册门槛

This small control-plane PR requires owner approval and merge before the new workflow appears on the default branch and the public link becomes operational. Pre-merge research-bridge pilot results qualify the code, not default-branch registration. After approved merge, verify the pinned SHA and perform one default-branch manual check. No scheduled activation is planned.

Research execution SHA: 6b45185cd25f65ca5df4e77bb6702dae08ddc936

Research base: 49dbd388a9a1eac84322fcecd37bff97130ee7ef.

## Pre-merge qualification / 合并前资格检查

Read-only research pilots at the pinned SHA completed successfully:

- [CHECK run 37683755970](https://github.com/ccesm/world-inflation-lens/actions/runs/37683755970): OFFICIAL URL REQUIRED. SEC and three IR indexes were blocked; Microsoft IR had NO_STATIC_LINK. No new quarter was claimed.
- [Manual historical control 37683995554](https://github.com/ccesm/world-inflation-lens/actions/runs/37683995554): the Alphabet Q2 PDF matched its qualified hash. KNOWN_ACCEPTED_SOURCE_UNCHANGED; no economic promotion. Core extraction was not automatically qualified, so this is an access/no-new-data control, not proof of new-quarter accounting extraction.

Qualification passed 405 research tests, 39 production contract tests, 12 browser surfaces, both build/verify runs and byte-stable fresh-process native fixtures. No snapshot, economic data, Signal Engine, AI Labor, version or existing deployment/email workflow changed.

合并前的研究试运行已通过。自动发现的访问问题如实保留；已知 Alphabet 文件字节身份一致，但原生季度核心表仍需审查。没有新季度被接受。专用工作流尚未注册到 main，公开维护入口须待仓库所有者批准合并后，再做一次默认分支手动资格检查。
