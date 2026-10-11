# AI Macro Monitor — proposed page contract

Proposed route: **#/research/ai-macro**. Verified absent from current route whitelist; this is a recommendation, not a registered route. Add a Research-directory link and contextual Productive Capacity link, preserving existing AI Infrastructure, AI CapEx and productivity pages. No home dashboard redesign.

## Section structure and exact scope

| Section | English / 中文 | Actual C2 IDs |
|---|---|---|
| Energy | Energy & Infrastructure / 能源与基础设施 | EIA_COMM_SALES, EIA_COMM_PRICE, HENRY_HUB, CENSUS_DC |
| Capital | Investment & Financial Conditions / 投资与金融条件 | PNFIC1, DFII10, NCBDBIQ027S |
| Productivity | Productivity & Economic Growth / 生产率与经济增长 | OPHNFB, ULCNFB |
| Inflation | Inflation & Long-Term Expectations / 通胀与长期预期 | CPIAUCSL, PCEPILFE, SPF10 |

Real GDP is not part of this snapshot. Growth discussion concerns productive capacity mechanisms; any link to the existing productivity page is labeled separate evidence/vintage. No core CPI, headline PCE, breakeven or additional indicator is silently added. SPF10 is survey expectation, not market inflation compensation.

## Textual wireframe

```text
Research context / back link
AI Macro Monitor — fixed research snapshot
Snapshot 2026-10-09 | observations have different end dates
Aggregate macro context, not measured AI effects
Four channel overview, no aggregate risk gauge
  Energy [indicator selector] [state selector for sales / price only]
    latest record + date + native unit + adjustment + preliminary flag
    native change / YoY when AVAILABLE; exact comparison period and unit
    source / retrieval / release unknown / stale warning
    [Show history] [Level | Native change | YoY if defined]
  Capital [same structure]
  Productivity [same structure]
  Inflation [same structure]
Paired descriptive views: independent axes and native periods
What changed / Why it may matter / Alternative explanations /
Evidence strength / What remains unknown
Sources and methodology, accessible native-record table
```

At most one active indicator per channel chart, four charts total. All twelve remain reachable through labeled selectors. Electricity defaults to VA as an explicitly labeled sample choice, not a ranking; selector offers exactly the thirteen qualified states. A paired energy view uses the same selected state and preserves separate units. No thirteen-state total.

## Indicator panels and history

Each panel retains full source identity, definition, unit, frequency, adjustment, real/nominal/stock/flow/rate meaning, row/null counts, native latest period and its actual value. Display sourceHash and calculation reason in expandable provenance/table details. Source links identify original producer and distributor separately. Revision flags such as Preliminary remain visible beside values. Survey quarter describes survey timing and ten-year horizon separately.

Historical view defaults to proposed 2015+ context; an explicit full-history toggle retains early nulls without claiming all-era definition stability. Use C2's native period and periodEnd to format month/quarter/day; don't display quarter start as a monthly observation. Changes are not annualized. Daily yield native changes use previous nonmissing published quote with explicit interval/base date, not a constant one-day return; YoY is not defined. Negative yields have valid chart axes and percentage-point changes. Missing levels/calculation endpoints break the displayed path; they never become zero. An isolated point remains visible. Every chart has a text/table equivalent and a concise summary.

## Descriptive comparisons

Feasible without new computation: same-state electricity sales versus realized prices; Henry Hub versus electricity prices with regional-delivered-cost caveat; investment versus real yield on separate quarterly/daily timelines; output/hour versus unit labor costs on quarterly panels; CPI/core PCE versus SPF on separate monthly/quarterly panels and distinct measure labels. These are adjacent native-series displays. They do not calculate correlations, align by filling, fit regressions, imply forecast accuracy, or attribute changes to AI. A shared cursor/common-frequency statistic would be future qualified work. No dual-axis chart should visually imply a common unit.

## Evidence and interpretation

Persistently distinguish OBSERVED (E1), DESCRIPTIVE (E2 within-series arithmetic), HYPOTHESIS (E0), INSUFFICIENT DATA. Official data availability cannot promote an AI mechanism to E3/E4. Use deterministic templates only for available C2 values: “From {basePeriod} to {period}, {indicator} changed by {change} {changeUnit}.” Include preconditions/status and native period basis; never infer an unavailable change.

Mechanism and competing-explanation paragraphs are reviewed bilingual editorial copy, versioned independently from data. Energy alternatives include weather, natural gas, regulation, electrification and generation supply; financing includes monetary/fiscal policy, global savings and risk appetite; productivity includes wages, adoption delays and margins; inflation includes monetary policy and other supply/demand shocks. No LLM API, weighted score, AI ROI, causal coefficient or inflation forecast.

## Required bilingual copy (D1 central i18n file)

| Key | EN | ZH |
|---|---|---|
| title | AI Macro Monitor | AI 宏观监测 |
| subtitle | Macro conditions relevant to AI infrastructure; observed changes do not establish AI causation. | 与 AI 基础设施相关的宏观条件；观测变化不能证明 AI 因果关系。 |
| snapshot | Fixed research snapshot | 固定研究快照 |
| observation | Observation period | 观测期间 |
| release | Official release date | 官方发布日期 |
| releaseUnknown | Official release date not recorded | 未记录官方发布日期 |
| retrieved | Source retrieval date | 来源获取日期 |
| revised | Revision status | 修订状态 |
| preliminary | Preliminary | 初步数据 |
| freshness | Observation end dates differ; this is not a live feed. | 各指标观测截止日期不同；这不是实时数据源。 |
| stale | Captured data end before later source availability recorded in the research review. | 已采集数据早于研究审核所记录的后续来源可用期间。 |
| observed | Observed | 观测事实 |
| descriptive | Within-series descriptive change | 单一序列的描述性变化 |
| hypothesis | Unverified economic hypothesis | 尚未验证的经济假设 |
| insufficient | Insufficient data | 数据不足 |
| missing | Unavailable | 暂无数据 |
| history | Show history | 查看历史 |
| source | Source and vintage | 来源与版本 |
| unit | Native unit | 原始单位 |
| yoy | Year-over-year change (not annualized) | 同比变化（未经年化） |
| pp | Percentage points | 百分点 |
| state | Qualified state sample | 已验证的州样本 |
| energyWarning | Commercial sales include other demand; they do not measure AI electricity consumption. | 商业售电量包含其他需求，并非 AI 用电量。 |
| attribution | No measured AI causal effect or inflation forecast. | 不提供测得的 AI 因果效应或通胀预测。 |
| whatChanged | What changed? | 发生了什么变化？ |
| whyMatter | Why it might matter | 可能为何重要 |
| alternatives | Alternative explanations | 其他解释 |
| strength | Evidence strength | 证据强度 |
| unknown | What remains unknown? | 哪些仍然未知？ |
| historyError | History could not be validated. Snapshot summary remains available. | 历史数据未能通过验证。快照摘要仍可查看。 |
| retry | Retry history loading | 重试加载历史 |

D1 must also localize all twelve labels from c2-data-contract-mapping.json, native units, adjustments, change-status codes, frequency/geography names, revision-unknown labels, tooltips, selectors and table headers. Unknown codes fail contract checks rather than leaking English-only raw strings.

## Four clocks

Observation period/end is economic time. Official release date is null when unknown. retrievedAt is source retrieval, possibly precise or date-only. sourceAsOf is the fixed research review date (2026-10-09), not “updated now”. first-release vintages are unavailable; don't claim real-time historical backtests. Display energy/gas's 2025 endpoint prominently despite later snapshot date. lastNonmissing is separately dated if lastRecord is null. Known source latest-at-review is not a successful current fetch.

## Accessibility / viewport acceptance

390px: panels stack, labels/selectors wrap, sources and hashes wrap in details, no horizontal page overflow or table-only critical facts. Table rows may have a narrow stacked list alternative; charts adapt to container width without pixel-per-record DOM. 1280px: concise four-channel overview and two-column panels with readable axes; all data available by keyboard and semantic table. Both EN/ZH and light/dark must pass.

Use labels for selects/buttons, native focus order, visible focus, descriptive SVG title/description, no color-only flags, keyboard-accessible record details, captioned table with header scope and explicit missing cells. Existing RouteFocus, global navigation and error boundary are retained. Source details remain usable without history. No browser QA claim is made in D0: these are D1 acceptance requirements.
