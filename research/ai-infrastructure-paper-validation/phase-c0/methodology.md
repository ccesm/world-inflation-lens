# Phase C0 methodology — frozen 2026-10-09

C0 specifies mechanisms and feasible empirical designs. It does not estimate effects, forecast inflation, start C1, or alter any accepted economic data. Reproduction here means the research registries, inherited extracts, references and content hashes can be validated offline. It does **not** mean a new macroeconomic result has been reproduced.

## Baseline and evidence preservation

Exact base: `596e7e69560ee17be0b5412e852e74032533f49a` (B2). A and B1 are ancestors. `baseline-lock.json` retains SHA-256 of every inherited tracked file, not just production files. No old financial observation, source register, gap or report is edited. The shared repository has a pre-existing malformed ref; a separate clean bare fetch authenticated remote B2/main without deleting that ref. Main is only an operational reference, never a research substitute. An isolated worktree holds C0.

The original A paper reproduction is partial: four exact calendar-year firms plus Oracle's explicitly labeled December–November proxy cannot establish a five-firm exact-calendar total. B1/B2 bridges use native periods and company-specific definitions. Oracle/Amazon do not establish a five-company financial result. Negative FCF is not distress; gross issuance is not net new borrowing; customer financing in OCF is not incremental OCF again; debt, leases, commitments, guarantees and maximum exposure are not additive. All eight B2 gaps are carried by stable references in the new gap register.

## Grades apply to the exact claim

| Grade | Required basis | Forbidden shortcut |
|---|---|---|
| E0 | Explicit conditional mechanism or untested hypothesis | Treating plausible theory as an observed effect |
| E1 | Authenticated primary observation with definition, period, units where relevant, locator and provenance | Treating official metadata, a scenario or an author's abstract as a causal macro finding |
| E2 | Reproducible descriptive relationship, identified sample and arithmetic/code | Treating a financial cash bridge as AI attribution |
| E3 | Replicable association, appropriate controls, uncertainty and robustness | Claiming causal effects because a regression is significant |
| E4 | Credible identification, tested assumptions, robustness and scope limits | Generalizing a task-level treatment to the national price level |

For example, an E1 entry can establish that LBNL **reports modeled estimates**. That does not convert estimated demand to metered demand. An E1 primary-study entry establishes the authors' reported result and its scope; the author-submitted arXiv v2 abstract was also viewed, but full-text methodology/replication are not yet qualified, so the effect itself is not awarded E3/E4. No new C0 hypothesis has E2–E4. B1 cash coverage/financing relationships retain only narrow E2 arithmetic scope. Scientific grade upgrades require separately documented data reproduction, controls, uncertainty, identification and external-validity review; software tests do not perform that review.

Each evidence record separates source reliability, data reproducibility, statistical robustness, causal identification, external validity, uncertainty and grade justification. Counterevidence distinguishes an observed limitation from a theoretical countermechanism. Absence of a replicated contrary estimate is not evidence that a hypothesis is true.

## Official-source authentication

Use the original producing agency/institution and a verified public document URL; FRED is a distributor except for its own derived spreads. DGS10/DFII10 originate in Federal Reserve H.15 with Treasury methodology; CPI originates at BLS, PCE and GDP at BEA, productivity/ULC at BLS. T10YIE is a St. Louis Fed derived spread using Treasury inputs. ICE corporate OAS originates at a private licensed provider, so it is separately marked and not counted as official-origin verified statistics. TIC requires the 2023 Form S/SLT break audit.

`VERIFIED — MANUAL ACCESS` means an authenticated document or inherited source has been reviewed for the metadata actually stated. It is not a complete download or a certified latest historical sample. `VERIFIED — DIRECT ACCESS` would require validated programmatic payload and receipt; none is claimed in C0. Candidate metadata remain null where unverified. Missing latest observations are null with a reason; a few manually checked source-page values are explicit spot observations with units, publication dates and limitations. No source vintage is backdated. Full-history lag/revision/seasonal documentation remains a C1 acquisition gate where unspecified. The notes file documents failed URLs and defensible alternatives; blocked sources never become zero observations or no-new-data claims.

No endpoint, exact industry code, historical coverage or observation is guessed. Official EIA archives verify an archive span but not constant definitions across that span. EIA generator nameplate, planned capacity, retail sales, peak load and IT load cannot be substituted. EIA average revenue per kWh is not a tariff or a fixed-basket CPI price. Census construction excludes racks/servers and land, so it is not total campus investment. BTOS's 2025 collection/question change creates separate time series. Current downloaded vintages must not be used as what was known in earlier periods.

## Empirical design standards for C1 and later

Pre-register sample, units, dates, outcomes, estimands, exclusions, missingness, measurement, uncertainty and robustness before inspecting effects. Separate real quantities from nominal expenditures, stocks from flows, calendar from fiscal periods, planned from realized capacity, and relative prices from inflation rates. Do not divide annual projections into quarterly observations, interpolate gaps, or use a future disclosure to construct an earlier-information snapshot.

Regional comparisons need verified treatment timing, no anticipation assumption or explicit anticipation window, stable borders, consistent customer sectors and credible unaffected controls. Site selection, utility supply planning, regional growth, regulation and spillovers create endogeneity. Weather and fuel may be confounders; generation buildout may be a mediator, so models with/without it answer different questions. Use pretrend/equivalence diagnostics, placebo dates and outcomes, leave-region-out checks, fuel/weather/specification sensitivity, break audits and uncertainty suitable for few clusters. Failure to reject zero is not proof of no effect; do not use statistical significance as the acceptance gate.

Time series need adequate prehistory, stable definitions, autocorrelation treatment and policy/fiscal controls. Aggregate AI exposure is not currently identified; Granger predictability or a VAR does not establish AI causality. Industry adoption requires separate BTOS regimes, matched output/compensation measures, sampling weights and selection audit. Corporate designs require issuer risk/maturity and net issuance, not sum of contractual layers. A credible exogenous shock is currently absent for national AI-to-inflation/real-rate claims.

Do not add energy, financing and productivity estimates: shared investment, energy costs, wages and policy channels can overlap. A one-time relative-price level shift differs from sustained inflation. TIPS breakevens include risk/liquidity compensation; surveys measure subjective expectations. Equilibrium real interest rates are not observed TIPS yields.

## Reproduction and safety

Run `python3 research/ai-infrastructure-paper-validation/phase-c0/validate.py` and `python3 research/ai-infrastructure-paper-validation/phase-c0/test_phase_c0.py`. `reproduce.py --evidence` rebuilds inherited numeric evidence from the frozen B1 bridge and emits exactly the committed evidence bytes; reviewed source metadata and editorial framework remain explicit frozen inputs. Content identity hashes required reports/registries/validation implementation, excludes its own identity file and operational validation receipts, and has no system-clock dependency. Baseline lock checks all inherited bytes. Tests mutate grades, references, dates, source status and prohibited outputs to test fail-closed rules. They establish artifact integrity, not truth of economic hypotheses. Full A/B1/B2 regressions use their appropriate frozen baselines when an inherited Git-scope test requires it.

Only C0 research files may be committed. No changes to dependencies, production, workflows, notifications or accepted datasets. No automatic research schedule, runtime LLM, API key, forecasting engine, aggregate AI investment/hidden leverage/ROI or systemic-risk score. Stop after C0.
