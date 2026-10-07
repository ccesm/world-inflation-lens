# AI labor research — phase closure and public interim conclusion

Research vintage: **2026-10-06**. Latest complete occupational outcome year: **2024**.
Public route: `#/research/ai-labor`. Evidence: **EARLY / INCONCLUSIVE / SAMPLE-SENSITIVE**.
Research mode: **OBSERVATION MODE**. Interpretation: **DESCRIPTIVE_ONLY**.
Causality: **NOT_ESTABLISHED**. This closes active expansion of the present research
phase; it does not abandon the research, activate the monitor or authorize deployment.

## Research question and what was built

Does observed U.S. occupational employment differ across AI-exposure characteristics,
and is that descriptive difference robust to sample composition, exposure definitions
and historical pretrends? This is not a test that identifies AI-caused unemployment.

- Phase 1: independently refreshed public CPS/CES/JOLTS observations and Census BTOS
  AI-adoption context; observations and adoption remain separate.
- Phase 2: versioned occupational crosswalks and independent exposure measures.
  Academic human Beta capability exposure is primary; Microsoft applicability is
  secondary; Anthropic observed platform task usage is context only.
- Phase 3: strict qualified CPS occupational employment, hours, earnings, age
  composition and independent source-native quintiles. Fixed preanalysis, reference
  eras, coverage guards and matched-month handling preserve missing observations.
- Phase 3.5: defensible harmonized occupational cells and conservative categorical
  consensus improve coverage without inventing detailed-SOC employment or averaging
  exposure scores. Strict accepted results remain the benchmark.
- Continuous Monitor: prepared, **not activated**. Scheduling, durable history
  writes, email delivery and any public monitoring require separate qualification
  and explicit approval. No automatic update is wired to this fixed-vintage page.

The research branches are not merged here. This delivery contains only a compact
public result snapshot, translated presentation, documentation and tests; no raw
CPS records, sufficient-statistic archives or expanded generated output is imported.

## Authoritative interim conclusion

Current U.S. occupation-level labor-market evidence does not yet show an AI-related
employment divergence robust to occupational sample definition, AI-exposure methodology
and historical pretrends. Expanded coverage changes the estimated high-minus-low gaps:
Academic becomes negative; Microsoft approaches zero; historical pretrends change too.

These results establish neither AI-driven displacement nor the absence of future AI
labor effects. The post-GenAI window is short relative to possible hiring, workforce
and capital-adjustment lags. The interpretation is descriptive, early and sample-sensitive.
Longer observation and stronger identification are needed for structural or causal claims.

中文：目前美国职业层面的劳动力市场数据，尚未显示出一个能够同时经受职业样本定义、
AI 暴露度方法及历史预趋势检验的稳定 AI 相关就业分化。扩大覆盖明显改变估计：Academic
转为负向，Microsoft 接近零，历史预趋势也改变。这不能证明 AI 已造成就业替代，也不能
证明未来没有影响。证据仍然早期、描述性、对样本和方法敏感；需要更长观察和更强识别。
公开证据状态为 **早期 / 结论未定 / 对样本和方法敏感**，研究状态为 **长期观察模式**。

## Strict and expanded findings

| Method / sample | 2024 employment coverage | 2022–2024 Q5−Q1 cumulative employment-change gap | 2015–2019 Q5−Q1 pretrend gap |
| --- | ---: | ---: | ---: |
| Academic strict A | 37.77% | +0.4159 pp | +0.2021 pp/year |
| Academic expanded C | 55.02% | −0.8480 pp | −0.7122 pp/year |
| Microsoft strict A | 47.55% | +0.5621 pp | −1.1848 pp/year |
| Microsoft expanded B/C | 55.23% | +0.0300 pp | −1.0058 pp/year |

Expanded common-sample coverage: **47.80%**. These are rounded descriptive point
estimates, not confidence intervals, p-values, counts of lost jobs or national AI
replacement rates. Coverage denominator: all 2024 CPS civilian noninstitutional
employed persons age 16+, across all class-of-worker types. Q5/Q1 are each source's
fixed native exposure quintiles, not a jointly ranked or averaged AI measure.
The cumulative gap is the difference between groups' employment percentage changes,
not a difference in employment shares. Pretrend is the difference of annualized
log-OLS 2015–2019 group growth (`100 × (exp(slope) − 1)`), a different horizon/unit.

The public JSON deliberately contains just these accepted values and identities.
It does not recompute occupational estimates in the browser. Compare the pinned
reports below before updating any future public vintage; the processing date must
not become an economic observation date.

## Why the result is inconclusive

### Sample sensitivity

Strict occupations have stable exact historical/exposure mappings: higher mapping
confidence, lower coverage. Expanded cells pool defensible historical mappings and
require conservative categorical consensus: greater coverage, different composition.
Neither population is intrinsically better. The central finding is that estimates
change when the occupational population changes, not that a negative gap proves
employment destruction. Expanded C supplements, rather than replaces, strict A.

### Historical pretrend sensitivity

Academic's pretrend moves from +0.2021 to −0.7122 pp/year. Microsoft has substantial
negative pretrends in both populations. A post-2022 difference may continue an earlier
path or reflect composition rather than AI. Preserve 2015–2019 reference, 2020–2021
pandemic disruption, 2022 reference and 2023+ diffusion context. The reference year
is not randomized treatment. The pandemic, demand, rates, offshoring, demographics
and restructuring are alternative explanations, not controlled away by this analysis.

### Methodology sensitivity and common sample

[Academic GPTs are GPTs](https://arxiv.org/abs/2303.10130) measures potential task
capability exposure, using the accepted human Beta vintage; it does not measure
adoption, automated jobs or replacement probability.
[Microsoft applicability](https://www.microsoft.com/en-us/research/publication/working-with-ai-measuring-the-occupational-implications-of-generative-ai/)
maps observed AI-related platform work activities to occupational tasks. It is not
a nationally representative occupational adoption rate or replacement probability.
The constructs differ, must not be averaged, and disagreement is informative.
Common expanded coverage remains under half of employment. Full-source estimates
above are not common-sample estimates; source quintiles remain independent even
within the intersection. Anthropic use remains context, not a national adoption proxy.

### Short observation window and uncertainty

The headline comparison uses complete 2022–2024 outcomes. Retained inputs include
partial 2025/2026 observations through August 2026; October 2025 is missing. They
are not annualized or substituted for complete years. A possible sequence is adoption
→ workflow redesign → less incremental hiring → changed hours/tasks → occupational
restructuring → possible employment effects. This is conceptual, not an observed
sequence; no lag dates or probabilities are assigned.

There is no validated design-based uncertainty. Rotating CPS person-months are not
independent workers. No naive IID intervals, p-values or significance claims are
introduced. Balanced-panel selection limits generalization. Employment is not hiring;
age 20–24 is not seniority or true entry-level employment. Hours and nominal earnings
have separate sample/comparability restrictions, including earnings disclosure changes.

## What can and cannot be concluded

We can describe alternative exposure definitions, sample-dependent employment gaps,
material coverage sensitivity, substantial prior trends and the need for longer
observation. We cannot establish AI-caused employment losses, no AI effect, a known
replacement probability, an unemployment forecast, age-based job seniority or exposure
as actual adoption. No job-risk score, forecast, investment signal or Signal Engine
factor is created. Productivity, investment returns and labor-income distribution
are related but separate research questions; existing productivity/fiscal calculations
are not changed or fed by these results.

## Observation Mode and reopening policy

Active model expansion is paused, not abandoned. Preserve strict/expanded benchmarks,
source-specific exposure vintages and methods; accumulate qualified official
observations; do not chase effects with new thresholds or automatically add causal
claims. The prepared Continuous Monitor remains independently gated and disabled.
This fixed-vintage public page is not a live dashboard or automatic observation pipeline.

Human review may reopen research when there is a materially longer post-GenAI series,
better occupational hiring/entry measures, qualified design uncertainty, a stable
occupation × industry bridge, stronger common coverage, persistent agreement across
methods, or divergence unexplained by prior trends. These are review conditions,
not automatic triggers or an exact calendar date.

## Provenance and reproducibility boundary

| Layer | Branch / accepted commit | Report |
| --- | --- | --- |
| Strict Phase 3 | `codex/observed-labor-outcomes-by-ai-exposure` / `57f9b70352999a9464fb164e17df21075d6d61e9` | [Accepted outcomes report](https://github.com/ccesm/world-inflation-lens/blob/57f9b70352999a9464fb164e17df21075d6d61e9/docs/AI_LABOR_OUTCOMES_BY_EXPOSURE.md) |
| Expanded Phase 3.5 | `codex/ai-labor-coverage-expansion` / `e7aa773c66a898f10a883a0862462fefc42381ee` | [Accepted coverage report](https://github.com/ccesm/world-inflation-lens/blob/e7aa773c66a898f10a883a0862462fefc42381ee/docs/AI_LABOR_OCCUPATIONAL_COVERAGE_EXPANSION.md) |

Strict specification SHA-256:
`f3429802af3354335d5c724fc5497a24dde41ea11ac8178b2ac88c9416148b5e`.
Expanded specification SHA-256:
`d40e6468ccc27fbc7c0f262acd1954e1eb5e18b28590af184411da71e76f9e8c`.
Expanded rules checkpoint precedes outcome analysis: `e61e45242fdde0c3fe6a7bf2eb6404044266dc27`.
The accepted expanded output manifest binds ten generated artifacts; reconstruction
hash `193ca9480a502e5841c99413cfe6bc556e3bd0808fbadbdc2be07a6df3facfae`.

The [immutable research archive](https://github.com/ccesm/world-inflation-lens/releases/tag/ai-labor-archive-09fcc21-qualification-20261006)
preserves the earlier research stack at `09fcc21`; it is not a substitute for the
separately pinned Phase 3.5 report/specification/output manifest. Archive restoration
and durable monitor-history qualification remain separate work. No archive packaging,
Zenodo operation or history write is performed for this page.

Public snapshot: `src/data/ai-labor/interim-conclusion.json`. It is a manual fixed
research vintage, not a new refreshed economic data contract. Application remains
1.1.0 during preparation; recommend **1.2.0** for an owner-approved public minor
feature release. Do not change Signal rule/engine versions. No merge/deployment is
authorized by this document.

## Delivery acceptance and handoff

Prepared from main `e790bd03fe8549fc5008ae2fa43237daf826438c` on
`codex/ai-labor-phase-closure`. `npm ci`, `npm run build`, and the complete
`npm run verify` pass. A route-count assertion in international verification was
changed from a hard-coded total to uniqueness; the new verification also explicitly
checks every prior route, accepted numbers/hashes and both rendered languages.
All 24 views and the existing 48 Drivers topic/episode/language combinations render.

`node scripts/verify-ai-labor.mjs` verifies the fixed-vintage contract, explanatory
boundaries, EN/ZH rendering, table semantics, secondary routing and source isolation.
`node scripts/verify-ai-labor-browser.mjs` (with `WIL_PLAYWRIGHT_MODULE` and
`WIL_CHROME_EXECUTABLE` configured) passes twelve local production-browser surfaces:
320/390/1280 px × EN/ZH × light/dark. Keyboard navigation, independently scrollable
comparison tables, Research/productivity links in both directions, browser history,
legacy Fiscal navigation and no page-wide overflow/runtime errors are checked.
Chinese mobile dark and English desktop light screenshots were visually inspected.
Generated browser reports/screenshots stay in ignored `.refresh/ai-labor-browser/`.

The fixed JSON is 1,987 bytes. The lazy route is 24.35 kB JS (10.07 kB gzip), with
1.49 kB CSS (0.61 kB gzip). Browser resource checks confirm this route is not loaded
on Home. The existing large-chunk build warning remains; this is not a new historical
bundle. Protected economic data, public Signal artifact, Signal runtime, workflows,
notifications and productivity/fiscal calculation modules have no diff from the base.
No research stack ancestry is merged. Pre-existing untracked research files are left
untouched and excluded from this delivery.

No newly confirmed HIGH/MEDIUM implementation finding remains for this page.
The scientific limitations above remain material and visible; they constrain claims,
not the publication of this explicitly inconclusive descriptive summary. Monitor
activation and release version approval remain separate. Final recommendation:
**READY FOR PUBLIC AI LABOR INTERIM CONCLUSION**. Do not merge automatically.
