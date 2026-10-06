# AI Labor Transition Continuous Monitor

Research implementation, **not activated**. Base `57f9b70352999a9464fb164e17df21075d6d61e9`; branch `codex/ai-labor-continuous-monitor`. The monitor asks what official labor observations and separately measured business AI use are doing. It does not estimate AI-caused unemployment, job loss or a forecast. Exposure, observed platform use, labor outcomes and causal attribution stay separate.

## Research basis and architecture

Reviewed: [labor transition matrix](AI_LABOR_TRANSITION_MODEL_MATRIX.md), [data design](AI_LABOR_TRANSITION_DATA_DESIGN.md), [Phase 1](AI_LABOR_MARKET_PIPELINE.md), [Phase 2](AI_OCCUPATIONAL_EXPOSURE_CROSSWALK.md), and [Phase 3](AI_LABOR_OUTCOMES_BY_EXPOSURE.md). No accepted Phase 3.5 artifacts were found. Five pre-existing design documents remain untracked user work; this change does not alter them or claim they have been merged.

The new `research/ai-labor-transition/monitor/` imports validated Phase 1 source adapters and Phase 3 parsing/weighting/aggregation primitives **read-only**. All refreshes go into an independent store. Frozen Phase 1–3 contracts, source quintiles, preanalysis specifications and prior conclusions remain unchanged.

Three operations are separate:

1. **Discovery:** official release calendar or official native data/file identity checks.
2. **Refresh/accept:** only changed/new official data are normalized and validated into the monitor overlay; failed sources retain explicitly identified prior inputs.
3. **Economic evaluation:** only a changed qualified economic input identity or separately qualified implementation identity creates an interpretation. Repeated retrievals and clock changes produce `NO_ECONOMIC_CHANGE`.

Operational discovery/failure/health clocks live in status exports. They cannot change factor evidence merely because a fetch failed. There is no score, pooled exposure measure, API/LLM inference or email transport.

## Frozen monitor specification

`monitor-spec.json` was frozen before new-source comparisons. Methodology `ai-labor-monitor-v1.0-draft.1`, implementation `0.1.0`; specification SHA-256:

`95379563882affdb1dbec2754d83f6b6d2400e5bd36be9eaba715ff8844e2476`

The Phase 3 benchmark manifest, Phase 3 specification hash, fixed samples and source-specific assignments bind the monitor. The loader rejects changed specification bytes/hash markers. Implementation code has a separate per-process identity; run times do not affect it. New exposure literature, SOC/O*NET updates, sample expansions or thresholds require separate qualification, not automatic adoption.

## Cadence and source discovery

| Operation | Cadence / condition |
|---|---|
| Official discovery | Tuesday and Friday, 10:37 AM America/Los_Angeles |
| Aggregate refresh | Official BLS release event; bounded post-release API retry; native API content discovery if calendar unavailable |
| BTOS | Conditional current workbook request; only changed content is considered for acceptance; closed original question archive reused by validated hash |
| CPS microdata | Latest two accepted months plus at most three new completed months; HEAD validators, exact source hash, qualified official layout |
| Occupational evaluation | New accepted/revised sufficient statistics; annual grain retained |
| Monthly summary | New economic observations/material revisions only; no forced monthly interpretation when nothing changes |
| Annual review | Human review of taxonomy, exposure literature, sample coverage and release definitions; no automatic adoption |

The isolated workflow uses `cron: '37 10 * * 2,5'` and `timezone: America/Los_Angeles`. [GitHub supports IANA timezone schedules](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#onschedule); schedules use the default branch. They are not guaranteed to run at the exact minute.

BLS's [official ICS endpoint](https://www.bls.gov/schedule/news_release/bls.ics) provides scheduled release events, **not proof that data actually became available**. A calendar event permits probing; acceptance still requires qualified API observations. The calendar returned 403 locally. A seven-day calendar backoff avoids repeating the blocked request. Fallback polls the official recent two-year BLS API response through the existing adapters; unchanged economics create no evaluation. No fragile presentation HTML is scraped. Actual release dates remain null where the API cannot prove them.

The normal aggregate window is the current and preceding year, preserving all older accepted history. January's annual audit checks the recent ten years; revisions outside that window require an explicit broader human review. This is a disclosed discovery boundary, not a claim that every old revision is automatically detected.

For CPS, a previously validated normalized vintage is reused only after its canonical/source identities and immutable record are checked. Initial recent-file probes may download the two recent ZIPs once to establish identity; subsequent unchanged HTTP validators avoid downloads. A changed/new ZIP is parsed once with the accepted dictionary, whose current official bytes must still match the pin. Old dictionaries support old-period revisions; a new unqualified year/layout fails `VERSION_MISMATCH`. **2027 layout qualification remains a future annual-review task.** The annual January microdata audit uses HEAD checks of prior periods once; it does not reparse 139 unchanged files. Unknown/changed layouts fail closed. HTTP 404 for a previously accepted file retains last valid and records failure; it does not infer an economic withdrawal. October 2025 remains absent.

OEWS remains disabled/optional, with no repeated requests to blocked endpoints. Anthropic remains pinned task-use context and is not refreshed into a nationally representative adoption measure.

## Observations, dates and metrics

Every context point retains native observation/reference period, collection period if supplied, official release date if proven, retrieval time, source-vintage identity, frequency and units. Monitor start and evaluation acceptance are separate clocks. A test caught acceptance being incorrectly compared with the earlier run-start clock; acceptance now occurs after initialization/refresh, with strict timezone comparisons. Missing release metadata is null, never replaced by processing time.

Separate context views include:

- CPS overall/20–24/25–34/25–54 unemployment, employment/population and participation rates;
- CES payroll jobs, private usual weekly hours, nominal hourly earnings and reviewed industry context;
- JOLTS openings, hires, quits and layoffs/discharges, levels and rates;
- BTOS current AI use and expected six-month use, with native biweekly reference/collection windows and wording histories separated.

The existing official CPS aggregate registry provides age-specific employment/population **rates**, not a new fabricated employed-person count. Occupational age composition/weighted employed estimates come from qualified CPS microdata. Jobs are not unique workers. JOLTS is not detailed occupational hiring. Ages 20–24 are young workers, not job seniority or verified entry-level hires.

The occupational sample remains exactly **167 academic / 190 Microsoft SOC occupations**, with 165 common occupations. Groups never rerank. Outcomes include all Q1–Q5 employment levels, 2019/2022 indexes, shares, hours, nominal weekly earnings and age composition. Annual complete years and partial years are separated; partial-year observations never enter full-year indexes or persistence counters. The available partial years remain context, not interpolated monthly occupational signals.

## States, persistence and materiality

Evidence states and data health are separate. Each source/metric retains its measured difference, threshold, eligible annual period, within-sample crossing flag, coverage, persistence and historical employment pretrend context.

| Evidence state | Fixed interpretation |
|---|---|
| INSUFFICIENT_EVIDENCE | Missing/insufficient/comparability-restricted evidence or employed-weight coverage below 50% |
| NO_CLEAR_DIVERGENCE | Qualified point estimate below the predeclared presentation threshold; does not prove equality |
| EARLY_DESCRIPTIVE_WATCH | Qualified crossing without the complete persistence criterion |
| PERSISTENT_DESCRIPTIVE_DIVERGENCE | At least two consecutive complete annual endpoints cross the same band with the same sign |
| PRE_EXISTING_TREND | Employment Q5–Q1 2015–2019 pretrend gap reaches 0.5 pp/year; no AI attribution |
| METHODOLOGY_DEPENDENT | Methods disagree on a crossing/direction or by the predeclared magnitude threshold |

Occupational thresholds: employment Q5–Q1 cumulative change gap **5 pp**, hours change gap **1 hour**, nominal earnings change gap **5 pp**, young-worker share change gap **2 pp**. The earnings gate stays unavailable across the 2023–2024 disclosure break. All differences use the fixed 2022 reference, not a treatment assignment. Pandemic 2020–2021 records remain in history. Pretrend and post-period trend deviation appear separately; neither is an AI effect.

Persistence uses native **annual** observations. Missing years, unavailable values, partial years, failed qualification or sign reversals reset the streak. No rolling monthly CPS occupational estimates are introduced. Monthly aggregate context uses exact 3/6/12-month windows and three consecutive exact 12-month differences of the same sign; it is a descriptive context direction, **not exposure divergence or an AI alert**. Four-quarter persistence is unavailable because this qualified layer does not create quarterly occupational outcomes.

Academic and Microsoft are evaluated separately; their current and common-sample metrics are compared. One-method crossings/opposing qualifying directions or percentage-point gaps differing by at least 5 pp (or hours gaps by 1 hour) are methodology-dependent. Agreement improves descriptive robustness only. Coverage in both methods is disclosed even when their signs agree.

Currently, 2024 employed-weight coverage is **37.77% / 47.55%**, below the guard. Complete-year occupational evidence remains **INSUFFICIENT_EVIDENCE**. Microsoft’s pretrend gap is about −1.18 pp/year; academic is +0.20. The baseline conclusions are preserved, not rewritten by the monitor. Within-sample differences can remain inspectable while the evidence state is inconclusive.

No design-based survey uncertainty is available. Repeated person-months are not independent workers; no naive IID interval, p-value or statistical-significance assertion is used. Thresholds control description, not causal or statistical confidence. Earnings retain nominal/disclosure qualifications.

## Economic identity, revisions and failure isolation

Aggregate tail observations are normalized with the unchanged Phase 1 adapters. Merge receipts preserve the prior snapshot, new raw manifest and native start period; validation reconstructs the merge recursively against pinned original data. New observations, revisions and withdrawn values are explicit. Old history is not silently overwritten.

CPS microdata overlays store validated sufficient statistics/source hashes and preserve the prior immutable normalized object. Large raw ZIPs are downloaded transiently, not retained in Git. Reprocessing a newer source vintage does not rewrite the Phase 3 benchmark. Packaging-only microdata differences do not automatically become an economic assessment: analytical identity derives from canonical statistics/definitions, separate from source artifact identity.

Source states include CURRENT, STALE, PARTIAL, FAILED, UNAVAILABLE and NO_NEW_OBSERVATION; sample/comparability qualifications include INSUFFICIENT_SAMPLE and NOT_COMPARABLE. Freshness reuses source-specific Phase 1 allowances, not daily expectations for monthly data. `usingLastValid`, observation-through and acceptance date remain visible. A failure can create an operational degradation candidate but cannot invent a changed labor state. Each source refresh is independently caught; core corruption/storage failures fail closed rather than being broadly ignored.

## Durable history and replay

Accepted records preserve `evaluationId`, `inputSnapshotId`, `sourceVintageIds`, micro-vintage manifest, `methodologyVersion`, `specificationHash`, `evaluationDate`, `observationThrough`, `resultHash` and `previousEvaluationId`. The result hash excludes acceptance/run clocks; acceptance records retain genuine project chronology and first-seen evidence. Identical inputs/rules/code reuse prior interpretation and emit a run-status record, not a new economic snapshot.

A future approved scheduler restores and appends a separate **`codex/ai-labor-monitor-history`** branch. Recurring snapshots never go to main. The writer is a separately permissioned/gated job; manual dispatch cannot write history. Store contains compact normalized objects, aggregate raw/manifests, merge receipts, alert ledger and immutable evaluations. It never contains large CPS individual-record ZIPs. Existing immutable paths cannot be overwritten or dropped by recovery packaging.

Retention: 2,048 evaluations and 256 MiB store ceiling; no silent deletion. Before reaching either bound, archive a verified history-branch bundle/tag outside the active store and separately approve a versioned migration. A hard limit stops writes and preserves last valid history. Fourteen-day Actions artifacts are qualification aids, not the durable source of truth. Recovery copies a verified bounded package and revalidates hashes, receipts and recorded results before replacing pointers.

`CURRENT_SNAPSHOT` is the current accepted view. `RECORDED_HISTORICAL_REPLAY` selects only an evaluation actually accepted by the requested timestamp, checks first-seen/retrieval/acceptance chronology and reconstructs semantics. Before the first record it is unavailable. Replaying an older implementation requires checking out its matching qualified code identity; the current implementation fails closed rather than silently substituting a newer engine. There is no publisher-vintage replay. The separate historical inspection is labeled **CURRENT-VINTAGE RECONSTRUCTION**, uses revised current data and is not a real-time backtest.

## Alerts and bilingual email preparation

Research candidates only: first qualified watch, persistence newly crossed, recovery, qualified material strengthening/weakening, methodology agreement changes, critical coverage or health transitions. Magnitude change uses 2 pp for percentage-point comparisons and 0.5 hour for hours. Inconclusive numeric movements do not become qualified watch alerts. A semantic candidate hash/ledger suppresses repeated identical events; workflow execution by itself cannot generate an alert. No transport exists.

Fixed EN/ZH summaries show data period and complete annual endpoint, BTOS actual/expected use separately, employment/young-worker/hours/earnings states, agreement, changes, health/last-valid, coverage/pretrends and the causality disclaimer. **Email stays disabled**. Future delivery may reuse existing Gmail infrastructure only after separate approval; no SMTP secrets or daily inflation/Signal email changes.

## Workflow qualification, activation and cost

Workflow syntax, dispatch defaults, timezone, read permissions and activation gates are checked locally. Manual dispatch supports offline or live research dry runs. Scheduled jobs require both `AI_LABOR_MONITOR_ENABLED=true` and `AI_LABOR_HISTORY_WRITE_ENABLED=true` on main, plus an initialized durable history branch. All absent variables default to disabled. No variables, schedules, remote history branch or email activation were changed in this task.

[Activation checklist](../research/ai-labor-transition/monitor/ACTIVATION.md) is a separate release gate. The existing site deployment workflow targets main, so history-only branch pushes do not deploy the site. Workflow does not modify production data, invoke deploy, call Signal Engine or send email. Core failures remain monitor-job failures; existing economic workflows are independent.

Planning cost, not a measured GitHub bill: approximately 2–5 minutes per no-new-data runner including checkout/tests; 3–8 minutes for a new CPS month, network dependent. Two checks/week imply roughly 200–500 runner-minutes/month. There is no LLM cost. Bounded aggregate API requests, current-only BTOS requests and hash/HTTP reuse limit data transfer. Initially two recent ZIPs may be fetched once; normal later runs fetch zero old ZIPs. Full raw archives are not in Git history.

Compact sufficient statistics may add roughly 0.2–0.5 MiB per new month; evaluations/aggregate vintages add release-dependent smaller objects. A planning allowance is **5–20 MiB/year**, subject to actual BTOS revision/file size and retained aggregate raw content; quota and annual review control growth. Annual microdata HEAD audits and aggregate historical revision audits cost more than ordinary checks. Tests and local runtime are reported in the qualification record; no GitHub-hosted run or schedule-triggered run is claimed.

## Recovery, gaps and future UI

[Qualification results](../research/ai-labor-transition/monitor/qualification.md) record 324 passing tests, identical fresh-process results, live source-failure isolation, build/verify results and the pending GitHub/storage activation gates.

On source failure, inspect `source-refresh-status.json`, repair the endpoint/schema separately and rerun only after qualification; old accepted inputs/evaluations remain. A candidate with changed exposure/taxonomy requires review, not automatic repinning. On history corruption, restore the last verified branch/package and validate recorded replay. Never force-push away history or carry a prior directional state as current evidence.

Remaining limitations: sample coverage; design uncertainty; earnings comparability; incomplete 2025/2026 years and population controls; aggregate revision-window boundaries; yearly layout qualification; no occupational hiring; causal confounders; platform-use selection. Broader causal/scenario analysis remains separately gated. A later public page would expose dated evidence, coverage and source health after its own approval; this task adds no UI, routes, public data, forecasts, fiscal coupling or Signal changes.
