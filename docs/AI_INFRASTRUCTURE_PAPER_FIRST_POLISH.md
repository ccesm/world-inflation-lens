# Paper-first content and hierarchy polish

Base: `13e88f7d412ab0ca75361d07a106e7224c5b22f6` (`codex/ai-infrastructure-paper-first-redesign`). Delivery branch: `codex/ai-infrastructure-paper-first-polish`. Version stays 1.4.0. No PR, merge or deployment is part of this task.

## Presentation changes

The shorter page intro leads directly to **BOTTOM LINE / 核心结论**, with exactly two source-labeled evidence blocks. The paper thesis remains conditional; the independent-evidence paragraph explicitly excludes verification of financing, ownership, industry financing and systemic financial risk.

English paper block:

> The paper argues that AI needs a historically large physical buildout. Capital needs may increasingly exceed internal cash flow, making external financing structures more important.

English evidence block:

> Our qualified projects support the direction of physical buildout and show power-planning needs. They do not independently verify financing structures, ownership shares, industry-wide financing or systemic financial risk.

Chinese paper block:

> 论文认为，AI 需要历史尺度的大规模实物建设。资金需求可能越来越难仅靠内部现金流满足，外部融资结构因而更为重要。

Chinese evidence block:

> 我们的合格项目证据支持实物建设的方向，并显示电力规划需求，但尚未独立核验融资结构、持有比例、全行业融资或系统性金融风险。

Three macro parts use semantic headings, source kickers, spacing and restrained borders: **What the paper says / 论文怎么说 → Paper vs. our evidence / 论文与我们的证据 → Our independent evidence / 我们的独立证据**. No color grading is used. The selective-reading / non-endorsement disclaimer remains visible.

Charts stay in source order: illustrative campus cost, five-company cash CapEx/operating cash flow, historical investment cycles. The first adds a clearly labeled approximately $8.2B (82 亿美元) paper estimate, not a market-average cost. The second labels 2026's mixed results/guidance/Wall Street estimates. The third labels the 2025–2032 AI scenario separately from approximate historical comparisons. The last two distinctions are also in chart accessibility labels; original table fallbacks remain.

The comparison overview has four concise items: physical buildout supported in direction; power partially supported; financing not independently verified; aggregate investment / risk not comparable / outside the current dataset. All five detailed comparison rows are unchanged.

## Frozen identities and scope

- `monitor.json`: 31,650 bytes; before/after SHA-256 `3fc59a0c52f097cbbd4f4f187ace5813d02cd2de03cfd274ac9e12700199b6f5`.
- Entire `paper.js`, including all 31 numeric records and source metadata: before/after SHA-256 `b8d8db448d0a6843fcbc6e5b3d05791099f8cc9b4248b6133c65a30e0c7a10f9`.
- Detailed comparison-copy identity: `c45e8c89d61b79982fe9d12c53f2d5b16a893608212258932375053f9914b960`.
- AI CapEx snapshot: unchanged SHA-256 `8891e6b7dca9317e3d2400bdd3749c54425ff1c0385c1f2151e2593c92227c3a`.
- Seven original cards, all financing UNKNOWN, Hyperion exclusions, Polaris 400/175 distinction, Fairwater caveat, native definitions, dated statuses, sparse power and no-return/no-score/no-aggregation boundaries are preserved.
- No production data, workflows, email, routes, dependencies, Signal implementation, AI Labor conclusions or research archive changes. The paper-to-qualified-snapshot laundering rejection remains active.

## Validation and cost

- Build, full verify and diff whitespace check passed. Full verify uses an isolated checkout so the user's unrelated untracked research files remain untouched.
- Infrastructure: 50 contracts (41 existing public contracts + 9 paper/polish), zero failures; eight browser combinations (EN/ZH, light/dark, 390/1280) and 26 route checks.
- AI CapEx: 39 contract/control checks and 12 browser combinations passed. AI Labor: 12 browser combinations passed; OBSERVATION MODE remains unchanged.
- Signal core: 256 passed, zero failures, two inherited skips. The known pipeline assertion still hard-codes version 1.1.0; it was not modified or rerun as part of this core-only regression request.
- Screenshots visually reviewed at 390px ZH/dark and 1280px EN/light, plus 390px EN/light. Filters, keyboard operation, source links, semantic fallback tables, chart labels, no page-wide overflow and no runtime/console errors checked.
- Lazy Infrastructure JS: 96,178 bytes versus 92,638 (+3,540); gzip 25,100 versus 24,430 (+670). CSS: 9,187 versus 6,360 (+2,827); gzip 2,127 versus 1,643 (+484). No dependency; Home lazy isolation preserved. JS growth is below 10 KB.

HIGH implementation issues: none. HIGH evidence limitations are unchanged: financing/ownership remain unqualified, and the public sample cannot test industry totals or systemic financial risk. MEDIUM limitations: fixed-vintage/asymmetric coverage, sparse power, native comparability differences and inherited maintenance fixtures. No unrelated fixes were made.

Recommendation: v1.4.1 only after separate owner release approval; implementation remains 1.4.0.

Decision: **READY FOR OWNER VISUAL REVIEW**.
