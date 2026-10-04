# Deterministic Signal Engine conclusions

This is a presentation layer for the validated seven-factor shadow result. It is not an LLM interpretation. It calls no external service, performs no economic calculation or aggregate vote, and does not modify the frozen `signal-engine-v0.1-draft.1` methodology. Public version stays 1.0.0; no React page or public artifact is added.

## Architecture and semantic inputs

`scripts/lib/signalConclusions.mjs` contains reviewed EN/ZH templates and the pure `generateConclusions()` function. Its only inputs are exactly seven canonical `factorId`, `state`, `evidenceQuality` and `sensitivity` records. Availability is derived from INSUFFICIENT_DATA/UNASSESSED, never supplied as arbitrary prose. Missing/duplicate IDs, wrong-factor states, unknown enums, extra fields and contradictory availability are rejected. Input order is normalized to frozen factor order. No clock, environment, run ID, source diagnostics or free-form artifact text enters the generator.

The output is `deterministic-signal-conclusions/1`: seven bilingual factor interpretations, domestic and international paragraphs, and an evidence qualifier. English and Chinese share the same semantic branches; there is no runtime translation.

## State mappings

Every factor has five intentional bilingual states. Positive/negative here name the frozen numeric bands, not economic desirability or outcome votes.

| Canonical factor ID | Confirmed numeric positive band | Confirmed numeric negative band |
| --- | --- | --- |
| inflation-persistence | CORE_INFLATION_ACCELERATING: 核心 PCE 同比通胀加速动能 / accelerating year-over-year core PCE momentum | CORE_INFLATION_DECELERATING: 核心 PCE 同比通胀减速动能 / decelerating year-over-year core PCE momentum |
| observed-productivity | OUTPUT_PER_HOUR_GROWING: 非农商业部门每小时产出同比增长 / year-over-year growth in nonfarm business output per hour | OUTPUT_PER_HOUR_CONTRACTING: 每小时产出同比下降 / year-over-year contraction in output per hour |
| supply-chain-pressure | SUPPLY_CHAIN_PRESSURE_RISING: GSCPI 三个月均值变化确认压力上升趋势 / rising GSCPI trend based on changes in its three-month average | SUPPLY_CHAIN_PRESSURE_FALLING: 相同指标确认压力下降趋势 / falling trend on the same measure |
| policy-rate-direction | POLICY_RATE_RISING: 月均有效联邦基金利率三个月变化上升 / rising three-month change in the monthly average effective federal funds rate | POLICY_RATE_FALLING: 相同指标下降 / falling direction on the same measure |
| reserve-share | USD_RESERVE_SHARE_RISING: 美元官方外汇储备份额八季度比较上升 / rising reserve share over eight quarters | USD_RESERVE_SHARE_FALLING: 份额下降，与储备多元化压力相符 / falling share, consistent with reserve-diversification pressure |
| foreign-treasury-holdings | FOREIGN_TREASURY_HOLDINGS_EXPANDING: 外国国债持有名义美元余额同比扩张 / year-over-year expansion in nominal dollar foreign Treasury holdings | FOREIGN_TREASURY_HOLDINGS_CONTRACTING: 名义持有余额同比收缩 / year-over-year contraction in nominal holdings |
| offshore-usd-credit | OFFSHORE_USD_CREDIT_EXPANDING: 美国境外非银行借款人美元信贷余额同比扩张 / year-over-year expansion in dollar credit outside the U.S. to non-bank borrowers | OFFSHORE_USD_CREDIT_CONTRACTING: 同一信贷余额同比收缩 / year-over-year contraction in the same outstanding credit |

All seven also map LITTLE_CHANGE to the complete window being within the rule-defined quiet band; TRANSITION to the complete window satisfying neither a directional band nor the quiet band; and INSUFFICIENT_DATA to an unavailable assessment. TRANSITION is not relabeled a turning point, reversal or mixed signal. LOW/UNASSESSED add cautious wording without replacing the state. A missing factor remains explicit and makes its group paragraph incomplete.

## Narrative composition and limits

Domestic text composes four state descriptions. Repeated TRANSITION descriptions share one concise clause naming exactly the affected factors and one confirmation-window explanation. Other factors retain their own sentences. The paragraph does not count directions or declare a net purchasing-power verdict. Productivity can supply support without attribution to AI; core PCE momentum alone does not confirm broad reflation or rapid disinflation.

International text keeps reserve allocation, Treasury holdings and dollar financing separate. Falling reserve share plus expanding offshore credit adds a descriptive coexistence clause, never an overall strengthening/weakening verdict. Other combinations simply compose their actual states. A lower reserve share is consistent with diversification pressure, not proof of motive or reserve-status loss. TIC holdings are nominal stocks, not flows or confidence; BIS financing volume is not overall dollar dominance.

The qualifier counts actual HIGH/MEDIUM/LOW/UNASSESSED qualities, explains evidence quality rather than probability, lists exactly the actual THRESHOLD_SENSITIVE factors, and distinguishes NOT_EVALUATED from no detected sensitivity. It includes COFER's revised denominator (world official FX reserves including IMF imputations, excluding monetary gold), TIC custody/valuation/supply limits, BIS nominal-growth/credit-cycle/leverage limits, source-frequency alignment, productivity, GSCPI and policy-rate scope. No numerical quality probability is created.

## Safe handoff and email

`signal-shadow-summary/2` extends the existing allowlist with sanitized factor assessments and generated conclusions. The consumer independently regenerates conclusions from those enum records and checks exact text, factor counts, quality counts and sensitivity labels before rendering. Arbitrary prose, extra fields, fabricated states or inconsistent counts fail to UNKNOWN. JSON is limited to **24,576 UTF-8 bytes** at generation, read and Actions-file boundaries. Legacy v1 input fails safely to UNKNOWN; the co-deployed evaluator/exporter/notifier use v2.

The existing single daily email keeps its original economic body, subject and Gmail transport, then appends the technical health section and Chinese “Signal Engine Interpretation” section. Actions uses the same renderer and conclusion object. Only CURRENT/UNCHANGED carry conclusions. FAILED_WITH_LAST_VALID retains explicitly old technical health but no macro paragraph. NO_VALID_ARTIFACT, UNKNOWN, DISABLED, and malformed/unsupported failure input say “本次没有可验证的当前 Signal Engine 结论。 / No validated current Signal Engine interpretation is available for this run.” No stale result is promoted to current.

Full artifacts, lineage, local paths, diagnostics, credentials and runtime errors remain excluded from the handoff. Remote storage, workflow dependencies, activation and SMTP configuration do not change.

## Validation and development preview

Run:

```sh
node --test scripts/tests/signal-conclusions.test.mjs
node --test scripts/tests/signal-summary.test.mjs
npm run signal:test:pipeline
npm run signal:test
npm run build
npm run verify
```

The conclusion suite checks 35 mappings against the frozen config, representative pressure/easing/mixed/quiet and divergent international combinations, missing/LOW/UNASSESSED evidence, dynamic sensitivity, invalid metadata, forged prose, size bounds, and fresh-process determinism. It exhausts 625 domestic plus 125 international state combinations for presentation safety; these are not economic backtests or threshold optimization. Prohibited-language tests permit “probability” only in the explicit evidence-quality limitation. Existing R1–R6 and economic validation remain regression gates.

A real current-snapshot local evaluation produces the safe summary used by `scripts/notify.mjs --dry-run`, without Gmail credentials or SMTP. Development must never dispatch a production refresh or send a real email for this feature. Restricted evaluation objects stay temporary, are independently validated and are removed after producing the preview. Only this presentation code, safe-summary plumbing, tests and documentation are changed.

## Feature qualification result

Starting production main: `2e6be076ce2af09abf782b7a265566e8550aa3c4`. The local current evaluation against that validated snapshot returned CURRENT with the expected frozen states: TRANSITION, OUTPUT_PER_HOUR_GROWING, TRANSITION, TRANSITION, USD_RESERVE_SHARE_FALLING, TRANSITION, OFFSHORE_USD_CREDIT_EXPANDING. All seven qualities were MEDIUM; GSCPI and BIS were dynamically threshold-sensitive. The resulting safe summary was 8,232 UTF-8 bytes, within the 24,576-byte limit.

Build/verify passed. Engine regression: 256 passed, zero failed, two existing deferrals. Pipeline/archive regression: 67 passed. Conclusion tests: 59 passed (including all 35 mappings and 750 grouped combinations). Notification-summary tests: 30 passed. Fresh-process conclusion content was byte-identical across different run IDs/time zones. All 26 website build files were free of Signal artifacts and conclusion runtime markers. The frozen specification, engine modules, accepted economic snapshots, React UI, workflows and package version were unchanged.

The actual validated result supplied the existing email dry-run with one technical health section and one Chinese interpretation section. No Gmail credentials were supplied and no email was sent. Restricted local evaluation storage was removed after validation and preview creation. No merge, deployment or production dispatch is part of this feature task.
