# Signal Engine public presentation design

Design only. Depends on the [integration contract](signal-engine-production-integration.md) and [acceptance gates](signal-engine-production-acceptance.md). No React, routes, translations or metadata are changed by this document.

## 1. Information architecture and discovery

Recommend **Research → Signal Engine / 研究 → 信号引擎**, route `#/research/signal-engine`. Keep Home, Dollar, Fiscal, History, Scenarios and Research as the six primary items. The first public release has no Signal Engine conclusion or artifact fetch on Home.

Page order:

1. Title, short scope statement, methodology link, interpretation status/as-of and any fallback warning.
2. Two organizational groups: Domestic Purchasing Power / 国内购买力 (four factors), International Dollar Role / 美元的国际作用 (three factors).
3. Each group contains independently interpreted factor cards. Include “These factors are not combined into an overall verdict / 这些因素不会合成为总体判断。”
4. Expandable methodology and sensitivity details; links to primary research pages and Sources/Data Health.

Use existing `sectionLinks.research` discovery and the `researchArchitecture.js` `{en, zh}` label and `{href, label}` route conventions. Add a separate downstream interpretation-tool descriptor alongside the Research Map in the UI implementation; do not insert a new economic causal stage or treat engine output as a raw series in `existingEvidence`. Reference the seven existing primary series IDs and `domestic`/`international` outcome IDs. Link back to the evidence views. Existing map stages, structural themes, partial international coverage and source-of-truth pages remain intact.

Initially add links from Research's tool directory and the full Research Map. Contextual Dollar, External Shocks and International Dollar links are optional Phase 2 additions, not mandatory site-wide repetition. Do not add the tool to the compact Home map in the first release.

## 2. Final recommended public labels and evidence links

Internal IDs stay byte-identical. Labels are presentation dictionary entries keyed by ID; no rename of frozen configuration or methodology.

| Internal ID | English public title | 简体中文标题 | Primary evidence and existing destination |
| --- | --- | --- | --- |
| `inflation-persistence` | Core PCE Inflation Momentum | 核心 PCE 通胀动能 | `PCEPILFE`; `#/monitor?group=inflation` |
| `observed-productivity` | Observed Productivity | 已观测生产率 | `OPHNFB`; `#/research/ai-productivity` |
| `supply-chain-pressure` | Global Supply-Chain Pressure Trend | 全球供应链压力趋势 | `GSCPI`; `#/external-shocks` |
| `policy-rate-direction` | Effective Policy-Rate Direction | 有效政策利率变动方向 | `FEDFUNDS`; `#/drivers?topic=rates` |
| `reserve-share` | USD Reserve-Share Trend | 美元外汇储备份额趋势 | `COFER_USD`; `#/research/international-dollar` |
| `foreign-treasury-holdings` | Foreign Treasury Holdings Trend | 外国持有美国国债规模趋势 | `TIC_TOTAL`; `#/research/international-dollar` |
| `offshore-usd-credit` | Offshore USD Credit Outstanding Trend | 美国境外美元信贷余额趋势 | `BIS_USD_TOTAL`; `#/research/international-dollar` |

Subtitles must narrow each proxy: US nonfarm business output per hour for productivity; monthly average effective federal funds rate for policy; USD-denominated credit to non-bank borrowers outside the United States for BIS. “Foreign Treasury Demand” and “Offshore Dollar Role Strength” are prohibited labels.

## 3. Factor-card contract and disclosure

| Default view | Expanded evidence | Full research details |
| --- | --- | --- |
| Public title and short proxy subtitle | Confirmation-window values and periods | Complete raw inputs/operands and native-period boundaries |
| Localized state plus one-sentence explanation | Exact transformation and threshold comparison | Rule/config/schema/code/input identities |
| Observation through, evaluation as-of, source | Supporting evidence, actual counterevidence, separate context | Availability/retrieval/acceptance summaries with precision |
| Primary transformed metric with units | Source freshness at evaluation, quality reasons | Revisions, denominator/methodology, dependency roles |
| Secondary evidence-quality text | Source/research links and specific limitations | Lineage table and immutable artifact link |
| Visible sensitivity badge when applicable | Nine-grid summary behind an additional disclosure | Reproducibility/methodology reference |
| One essential limitation | Optional prior-valid history link, visibly historical | Previous immutable artifact/factor reference |

Model the card as presentation fields: `titleKey`, `subtitleKey`, `stateCode`, `stateLabelKey`, `stateExplanationKey` with evidence-bound parameters, `observationThrough`, `evaluationAsOf`, `qualityCode`, `qualityReasonCodes`, `sensitivityStatus`, `primarySeriesId`, `primaryMetric`, `latestTransform`, `source`, `limitationKeys`, `researchHref`, `methodologyHref`, `evidenceRefs`, `counterevidenceRefs`, `contextRefs`, `detailsRef`. Bind every numeric/date parameter to the validated artifact. This is a view contract, not a modification of the frozen engine output schema.

An empty counterevidence array means no separate counterevidence is encoded by this rule version. Do not manufacture it from a context series, a disagreement between factors, or a price level. Expanded copy can say “No separate counterevidence recorded by this rule / 本规则未记录单独的反向证据。” Context never becomes another vote.

Default display uses the exact transformed metric, not a misleading latest raw level alone. Preserve the raw level in details. Each factor has a separate observation endpoint; the page as-of does not imply all observations share that date. If no valid endpoint exists, show unavailable, not zero.

## 4. State copy dictionary

The original enum remains visible in research details. Public labels below are localized descriptions, not new states or altered rules.

| Internal state | English | 中文 |
| --- | --- | --- |
| `CORE_INFLATION_ACCELERATING` | Core PCE inflation momentum accelerating | 核心 PCE 通胀动能加快 |
| `CORE_INFLATION_DECELERATING` | Core PCE inflation momentum slowing | 核心 PCE 通胀动能放缓 |
| `OUTPUT_PER_HOUR_GROWING` | Output per hour growing | 每小时产出增长 |
| `OUTPUT_PER_HOUR_CONTRACTING` | Output per hour contracting | 每小时产出下降 |
| `SUPPLY_CHAIN_PRESSURE_RISING` | Global supply-chain pressure rising | 全球供应链压力上升 |
| `SUPPLY_CHAIN_PRESSURE_FALLING` | Global supply-chain pressure falling | 全球供应链压力下降 |
| `POLICY_RATE_RISING` | Effective policy rate rising | 有效政策利率上升 |
| `POLICY_RATE_FALLING` | Effective policy rate falling | 有效政策利率下降 |
| `USD_RESERVE_SHARE_RISING` | USD reserve share rising | 美元外汇储备份额上升 |
| `USD_RESERVE_SHARE_FALLING` | USD reserve share falling | 美元外汇储备份额下降 |
| `FOREIGN_TREASURY_HOLDINGS_EXPANDING` | Foreign Treasury holdings expanding | 外国持有美国国债规模扩大 |
| `FOREIGN_TREASURY_HOLDINGS_CONTRACTING` | Foreign Treasury holdings contracting | 外国持有美国国债规模收缩 |
| `OFFSHORE_USD_CREDIT_EXPANDING` | Offshore USD credit outstanding expanding | 美国境外美元信贷余额扩大 |
| `OFFSHORE_USD_CREDIT_CONTRACTING` | Offshore USD credit outstanding contracting | 美国境外美元信贷余额收缩 |
| `LITTLE_CHANGE` | Little change under this rule | 按本规则判断变化较小 |
| `TRANSITION` | No confirmed band (Transition) | 未确认区间（TRANSITION） |
| `INSUFFICIENT_DATA` | Insufficient eligible data | 符合条件的数据不足 |

`LITTLE_CHANGE` means the complete transformed window lies within the quiet band, not no inflation, no pressure, no risk or unchanged raw levels. Missing/unavailable evidence does not become this quiet state. Evidence quality `UNASSESSED` is not a directional neutral state.

### TRANSITION must always be explained

Default EN: “The complete confirmation window does not satisfy either directional band or the quiet band under this rule. This does not by itself identify a turning point.”

Default ZH: “完整确认窗口未满足本规则的任一方向区间或平静区间。这本身不代表拐点。”

Expanded EN: “Transition can reflect values between bands or a window that does not consistently meet one band. It does not necessarily mean reversal, mixed signs, improvement or deterioration.”

Expanded ZH: “TRANSITION 可能来自区间之间的数值，也可能来自未持续满足同一区间的确认窗口；它并不必然表示反转、正负混合、改善或恶化。”

Recommend a presentation-only factor-specific explanation computed from the existing validated transformed window. Show the N native periods, each unrounded comparison result, and the rule's entry/quiet bands. For example: “The last {N} monthly comparisons do not all meet the same band / 最近 {N} 个月的比较结果未全部满足同一区间。” Do not invent a new cause enum or change the schema. If the window is incomplete, the state is insufficient data; do not explain it as TRANSITION. Any optional counts within a single confirmation window describe rule mechanics, not factor votes.

Directional explanation template: “Each of the last {N} {native periods} satisfies the {named metric} {directional band} under rule {version}.” Quiet template: “Each comparison lies within ±{quiet} {units}.” Parameters come from the matching immutable rule and evidence. Round for display only; provide full comparison precision in details.

## 5. Metric explanations and essential limits

The following values describe the frozen reference for presentation testing. Production copy must read the matching rule, not maintain a second implementation of its arithmetic.

| Factor | Metric and confirmation | Required limitation EN / ZH |
| --- | --- | --- |
| Core PCE | Year-over-year core PCE inflation minus its rate three months earlier; percentage points; entry ±0.3, quiet ±0.1; 3 monthly comparisons | Measures core PCE momentum, not the price level or all inflation. / 衡量核心 PCE 通胀动能，不等于物价水平或全部通胀。 |
| Productivity | Output-per-hour year-over-year change; percent; entry ±0.5, quiet ±0.1; 2 quarterly comparisons | Observed productivity can revise; it does not identify AI's contribution. / 已观测生产率可能修订，不能据此识别 AI 的贡献。 |
| GSCPI | Latest three-month mean minus preceding three-month mean; index units; entry ±0.5, quiet ±0.1; 2 monthly comparisons | Change in global supply-chain pressure, not a complete inflation explanation. / 衡量全球供应链压力变化，不能完整解释通胀。 |
| Policy | Monthly average effective federal funds rate minus three months earlier; percentage points; entry ±0.25, quiet ±0.05; 2 monthly comparisons | Not the FOMC target range or a complete measure of monetary restraint. / 不是 FOMC 目标区间，也不是货币紧缩程度的完整衡量。 |
| Reserves | USD share minus eight quarters earlier; percentage points; entry ±1, quiet ±0.25; 2 quarterly comparisons | IMF's revised world official FX-reserve denominator includes imputations and excludes gold. A share decline does not prove loss of reserve-currency status. / IMF 修订后的全球官方外汇储备口径包含插补、不含黄金；份额下降不等于失去储备货币地位。 |
| Treasury holdings | Nominal foreign Treasury holdings year-over-year change; percent; entry ±5, quiet ±1; 3 monthly comparisons | Holdings are not transaction flows or demand strength; supply, valuation and custody geography matter. / 持有量不是交易流量或需求强度；需考虑供给、估值与托管地理口径。 |
| Offshore credit | Outstanding USD credit year-over-year change; percent; entry ±5, quiet ±1; 2 quarterly comparisons | Nominal credit can reflect growth and leverage; expansion is not a verdict that the dollar's international role is strengthening. / 名义信贷可能反映增长与杠杆；余额扩大并不等于美元国际作用增强。 |

Do not relabel the revised COFER denominator as allocated-only reserves. BIS total is the factor; loans and securities are decomposition. TIC total is the factor; selected holders are context, not independent signals. Domestic and international groups do not determine one another.

## 6. Evidence quality and sensitivity

Use secondary neutral text: **Evidence quality: Medium / 证据质量：中等**. Map HIGH → High / 高; MEDIUM → Medium / 中等; LOW → Low / 低; UNASSESSED → Not assessed / 未评估. All seven can legitimately have Medium quality. Do not force visual variety or use green/amber/red investment-style ranking.

Help EN: “Reflects source completeness, timing, revision and alignment quality. It is not a probability that the factor direction is correct.”

Help ZH: “反映来源完整性、时点、修订与对齐质量，不代表因素方向正确的概率。”

Expose actual quality reasons in details. A healthy source or complete timestamp string does not itself justify High; only the validated engine assigns it. Do not display percentages, stars or confidence bars.

Choose a **visible card badge plus expandable methodology section**, not a separate default sensitivity page. Badge EN/ZH: “Threshold-sensitive / 对阈值敏感”. Help: “This endpoint's state changes under the declared alternative threshold or confirmation settings. No variant is selected as best. / 在预先规定的替代阈值或确认设置下，本期状态会改变；不选择所谓最优方案。”

The frozen reference identifies GSCPI and BIS as sensitive. Recompute the declared nine variants for the **same current endpoint, input, rule and eligibility cutoff** before a public page ships; do not hardcode those two IDs forever or rerun the full historical grid on every refresh. Store report/grid/input hashes. Show all variants only on expansion, equally weighted visually, with the frozen default identified and no winning variant or performance ranking.

If sensitivity generation fails or does not match the current artifact, show “Sensitivity not evaluated / 尚未评估敏感性”; do not show “not sensitive.” Missing disclosure is a Phase 2 promotion failure: retain the prior complete interpretation or show unavailable. It must not block deployment of valid economic data.

## 7. Fallback, historical and scope language

Fallback banner EN: “Current economic data: {snapshot/date}. Last valid interpretation: {as-of}, using {interpretation snapshot}. The latest interpretation update failed. These assessments have not been updated to the current data.”

Fallback banner ZH: “当前经济数据：{快照/日期}。最近有效解读：{截至时间}，使用{解读快照}。最新解读更新失败；以下判断尚未更新至当前数据。”

When input matches but re-evaluation failed, replace the last sentence with “The input snapshot matches, but freshness has not been re-evaluated / 输入快照一致，但尚未重新评估时效性。” Choose copy from the validated relation/age status, not one universal “older data” warning. If status cannot be fetched, state that uncertainty separately from the interpretation's known age. First-run failure says “Interpretation unavailable / 解读暂不可用” and offers primary evidence links.

Historical heading: **Current-vintage reconstruction / 当前修订版本回溯计算**. Explanation: “Today's retained historical data are evaluated under these fixed rules. Later revisions may be included; this does not show what was knowable in real time. / 使用当前保留的历史数据按固定规则回溯计算，其中可能包含后续修订；这不代表当时实时可知的结果。” No “real-time backtest,” publisher-vintage claim or replay fallback. Recorded-project replay remains a separate research mode supported only where retained acceptance evidence proves availability; it is not part of the initial public page.

Scope EN: “A descriptive evidence system using explicit provisional rules. It does not forecast, give investment advice or combine factors into a score. Evidence can revise. Historical views, where offered, may use current-vintage reconstruction.”

Scope ZH: “这是按明确、暂定规则组织的描述性证据系统，不作预测、不提供投资建议，也不把因素合成为分数。证据可能修订；如提供历史视图，可能采用当前修订版本回溯计算。”

## 8. Mobile, accessibility and performance

At 320px and 390px, stack cards in document order; wrap labels/units and long source names. Desktop may use two columns within each group but must retain the same reading order. No wide scoreboard, giant gauge or score animation. Do not truncate observation dates or hide sensitivity/fallback labels on mobile.

Use one h1, group h2, card h3 and labelled details sections. Native `details/summary` or tested buttons with `aria-expanded` and `aria-controls` support keyboard toggling; return focus sensibly on close/navigation. Help text must be accessible by keyboard and touch, not hover-only. Status changes use a polite live region without repeated announcements. Icons are supplementary; text always names state and quality. Meet WCAG AA contrast in light/dark and support 200% text zoom/reflow.

Lineage tables have captions, header associations and a labelled locally scrollable container; the page itself must not overflow. Include textual units and period ranges for screen readers. Hashes can wrap and have a labelled copy control. Expandable long tables need explicit row-window controls without silently omitting inputs required to reproduce the state. Downloads, if later offered, contain only public allowlisted data; protect CSV cells from spreadsheet formula execution.

Follow existing lazy page loading and route error containment. Load compact current artifact only when the route is opened; defer details and sensitivity until requested. Never import the Node engine, archive, full historical outputs or raw snapshot histories into React or the Home entry graph. If a chunk or artifact fails, retain site navigation, show a retry action and primary evidence links, and preserve the original interpretation timestamps.

Initial proposed performance gates: Phase 1 changes zero Home runtime payload; Phase 2 adds no signal artifact request on Home, at most 5 KiB gzip to initial Home JS/CSS combined, at most 35 KiB gzip for the new route's exclusive JS/CSS, and at most 25 KiB gzip for its current summary JSON. Details/history are excluded only because they must not be fetched initially. Measure raw/gzip chunk sizes and browser transferred bytes against the exact pre-integration build under identical settings. If a budget cannot be met, revise the design explicitly rather than silently loading more on Home.
