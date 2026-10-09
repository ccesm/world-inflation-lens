# Phase C1 plan — one pilot, not executed

## Selected pilot

**Regional data-center energization → electricity demand → electricity price pressure**, with AI attribution conditional on verified workload evidence. This is one regional energy pilot; infrastructure-input inflation remains a later extension, not a second pilot. The initial estimand is descriptive post-energization demand/rate change relative to pre-specified comparable regions. A causal AI effect is not a promised deliverable.

Question: does verified new energized data-center activity coincide with excess commercial/industrial electricity demand, and are any price changes larger where documented pre-existing supply constraints apply? Reject the shortcut from announced MW to realized demand. The pilot cannot turn the AI share unavailable field into 100%.

## Workstream selection, no composite score

| Candidate | Official data / reproducibility | History / consistency | Relevance / causal feasibility | Misleading risk / maintenance | Decision |
|---|---|---|---|---|---|
| Regional energy | EIA sales/revenue/generation catalogs verified; utility exposure still gated | Long EIA archives, but sector/border changes; weather/fuel joins unqualified | Closest observable physical channel; timing comparisons possible only after source audit | High AI-attribution risk; manageable manual site and geography maintenance | **Selected, gated** |
| Corporate finance/credit | Frozen Oracle/Amazon bridges reproduce; Fed/Treasury metadata available | Native firm periods strong; ICE long-history license constraint | Direct funding facts; sector/macro yield identification weak | Overlap/refinancing and fungible funds; wider firm hydration costly | Defer |
| Adoption/productivity | BTOS and BLS metadata verified; replication material incomplete | November 2025 question break and short new AI-use regime | Valuable supply channel; selection and price pass-through unqualified | Task-to-macro overreach, weights/industry concordance burdens | Defer |
| Aggregate inflation | CPI/PCE/expectations sources available | Long outcome histories, very short identifiable AI exposure | Ultimate objective; no credible exogenous aggregate AI shock | Highest false-attribution risk; many overlapping channels | Defer |

Data availability supports energy first, **not** an assertion of the strongest inflation effect. Financing is best documented at firm level, but that alone cannot identify credit-market or Treasury effects. Aggregate macro regressions are lower priority until channel evidence exists.

## Five designs evaluated

1. **Historical time series:** real infrastructure quantities/input prices with fuel, policy, cycle, fiscal and global controls; proposed monthly/quarterly history only after vintage audit. Distributed lags/local projections may describe dynamics. Investment follows demand and rates, policy is endogenous, definitions shift; serial dependence and sample selection must be tested. Placebo non-AI investment and pre-boom dates, leave-crisis-out windows, alternative deflators. No causal AI claim from predictive significance.
2. **Regional comparisons (selected):** the data and gates below. Exposure geography and spillovers are the critical identification limitation.
3. **Sector productivity:** separate BTOS original and revised regimes linked to BLS output/hour, ULC and multifactor measures; annual industry or biweekly/quarterly adoption only when aggregation is defensible. Nonrandom adoption, reverse causality from productive firms, intangible capital, quality and changing industry composition threaten inference. Use matched nonadopters, pretrend and placebo non-AI task outcomes; missing firm microdata may make causal inference infeasible.
4. **Corporate financing/credit:** native-quarter/year accounting, net issuance, maturity/rating matched issuer borrowing costs and Z.1 sector context. Hypothetical sample starts with frozen B1/B2 periods, not an assertion of a broader current database. Refinancing/acquisitions, risk appetite and rate-driven investment are confounders. Exclude overlapping obligations, compare gross/net issuance and liability/flow definitions, placebo non-infrastructure issuers. Private spread licensing and three-year FRED history prevent a qualified long credit panel now.
5. **Aggregate inflation:** CPI/PCE levels and rates, ULC, real output and expectations with policy/fiscal/import/energy controls. Monthly/quarterly potential long outcome sample but no qualified long AI exposure. National simultaneity, weak counterfactual, structural breaks and overlapping channels make causal inference infeasible now. Test relative-price versus aggregate effects and alternative baskets; do not estimate an AI residual and name it causation.

## Selected pilot data specification

| Role | Required source / variable | Current C0 qualification | Frequency / geography |
|---|---|---|---|
| Exposure | Official utility/regulator or issuer site energization date, location, realized load where available; workload AI share | **Unqualified**, C0-H01 | Event / site, crosswalk to utility and state |
| Demand outcome | EIA-861M sales, commercial and industrial separately | Metadata verified, history extraction pending | Monthly state; utility-level detail only if qualified |
| Price outcome | EIA-861M average revenue/kWh | Metadata verified; not tariff or CPI | Monthly state/customer sector |
| Constraint modifier | Historical utility/RTO interconnection/congestion, regulatory and transmission evidence | Incomplete; forecasts are not actual constraint outcomes | Utility/RTO zone, pre-treatment vintage |
| Supply controls/mediators | EIA-923 generation/fuel; EIA-860 actual in-service capacity | Metadata verified | Monthly plant/annual generator; aggregate only via qualified geography |
| Fuel/weather controls | Qualified regional fuel price/receipts and NOAA weighted degree days | Exact weather/fuel selections pending | Monthly matched region |
| Other demand controls | Population, non-data-center industrial activity, broader electrification and utility rate cases | Series/geography pending | Native frequencies; no invented monthly interpolation |

Target acquisition window **2015–2025**, monthly, is a research design target, not a certified common sample. A later complete year may be added only with explicit reviewed cutoff. Do not include incomplete 2026 as a full year or future releases in earlier vintages. Do not merge annual and monthly controls by invented forward-filled observations. Use annual stratification or explicitly lagged known information where necessary.

Before seeing estimates, choose outcomes, treatment cohort, comparison geography, exclusions and missingness policy. Demand is primary; retail price is secondary. Wholesale LMP remains optional and cannot block a valid descriptive demand pilot; it requires a separately authenticated feed and settlement basis. Infrastructure PPI analysis is outside this initial pilot.

## Identification and robustness

Start with unit-consistent plots and a regional descriptive panel. If later causal analysis is proposed, use cohort-specific event estimators rather than assuming staggered two-way fixed effects identify a common effect. Conditional parallel trends, no unmodeled anticipation, stable treatment definition, comparable outcomes and limited spillovers must each be independently defended. Site location depends on cheap power, expected growth and supply plans; demand and prices can determine location (reverse causality). Generation and tariffs may react to new load. Report specifications treating supply as a mediator separately from those conditioning on it.

Use month/region effects with fuel/weather and other demand covariates only after qualification. Controls are not a substitute for identification. Pre-specify pretrend **equivalence bounds** tied to a power/measurement assessment, not simply p>0.05. Report placebo commissioning dates, placebo sectors only where not affected, regional exclusions, fuel/weather alternatives, tariff/border break sensitivity, missingness sensitivity, no-AI-share versions and electricity price composition diagnostics. Few regional clusters require appropriate small-sample/randomization or conservative uncertainty; no narrow conventional confidence interval by default. Spillovers can contaminate controls.

## Measurable acceptance criteria

1. Every included exposure has primary source URL, hash/capture status, locator, definition, effective date and region crosswalk. Planned/announced capacity is not treated as energized. AI share missing is explicit; results are labeled data-center-associated, not AI-attributable.
2. Complete official outcome files with immutable hashes, native units, date/sector definitions, lag/revision notes and reproducible joins. No duplicate adjustment/marketer rows or hidden missing-value filling. Exact years/coverage are frozen after audit.
3. Minimum design target: at least **24 pre-event months and 12 post-event months** per retained event, covering two seasonal cycles before and one after; at least **3 exposed regions and 6 candidate comparison regions** before attempting a multi-region comparison. These are design floors, not a statistical power guarantee or a claim those observations exist. If fewer qualify, stop the comparative estimate; descriptive source audit alone can be delivered as partial.
4. A pre-registered geography/treatment/exclusion plan, missingness report and data dictionary pass independent review. Effective sample size, clustering, expected measurement error and detectable-effect calculations determine whether estimation is informative; no causal upgrade for merely meeting sample floors.
5. Rebuild from frozen inputs yields identical analytical bytes; independent arithmetic checks pass. Report all prespecified robustness and placebo results, including contradictions; retain null results and inconclusive estimates.
6. Success is a qualified descriptive demand/price relationship or a transparent documented inability to estimate it. It is **not** a significant positive coefficient, an inflation forecast, proof of zero effect, or E4.

## Stop / downgrade criteria

Stop estimation if exposure dates/realized definitions, essential controls, geography or source identities fail; sample floors cannot be met; structural breaks cannot be reconciled; missingness makes comparison uninformative; data access requires bypass or unqualified third-party substitution; or outcome/control joins require fabrication. Stop causal interpretation if pretrends/anticipation/spillovers/selection assumptions fail, or independent measurement/power assessment cannot distinguish relevant effects. Missing AI share prohibits AI-specific conclusions but can allow a clearly scoped data-center descriptive analysis only after explicit protocol review. Never rescue a failed design by relabeling all load as AI or moving the acceptance threshold after results.

C1 remains **not started**. No files in this phase download analytical histories or estimate models. No national inflation conversion, no sum of channel effects, no forecast and no production integration.
