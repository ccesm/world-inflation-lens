# Signal Engine factor decisions and indicator inventory

Inspected production base: `b3d2fc295b0378c7d29ae6fe8d36e275a55753a9` (2026-10-03 inspection). This inventory describes stored coverage at that commit, not a claim about today's publisher release state. All rules are offline design proposals. Read [the specification](signal-engine-spec.md) and [validation plan](signal-engine-validation-plan.md); numeric parameters and labels are in [the draft config](../research/signal-engine/signal-engine-v0.1-draft.json).

## 1. All thirteen candidate decisions

`ACCEPT WITH LIMITATIONS` accepts only the narrowed measurement named below. `READY FOR PROTOTYPE` permits implementation/testing, not publication as a validated economic signal. A deferred factor can still supply explicitly labeled context. No candidate earns an unqualified ACCEPT NOW for the broad causal/outcome meaning in its original name.

| # | Candidate | Research decision | Engineering gate | v0.1 treatment and reason |
| --- | --- | --- | --- | --- |
| 1 | Inflation Persistence | ACCEPT WITH LIMITATIONS | READY FOR PROTOTYPE | Core PCE YoY acceleration/deceleration over a persisted window; literal level alongside it. No unavailable breadth or inflation forecast. |
| 2 | Fiscal Pressure | DEFER | NEEDS MORE DATA | Annual observed fiscal state and separately labeled conditional CBO context. Current data do not identify a timely aggregate fiscal inflation impulse. |
| 3 | Productive Capacity | ACCEPT WITH LIMITATIONS | READY FOR PROTOTYPE | Narrow to observed nonfarm-business output-per-hour growth; not potential output, slack, or AI contribution. |
| 4 | External Supply Pressure | ACCEPT WITH LIMITATIONS | READY FOR PROTOTYPE | Narrow directional rule to GSCPI supply-chain pressure trend; commodity costs/risk remain separate context. |
| 5 | Monetary Restraint | ACCEPT WITH LIMITATIONS | READY FOR PROTOTYPE | Replace broad stance assessment with effective policy-rate direction; retain real yield, M2 and assets separately. |
| 6 | Treasury Long-Rate Pressure | DEFER | DEFER | Show nominal yield, real yield and matched-date compensation separately; no common directional score or identified term-premium decomposition. |
| 7 | Dollar Market Validation | DEFER | DEFER | One shared DTWEXBGS market-price context record; useful, but not another independent outcome factor. |
| 8 | Reserve Currency Position | ACCEPT WITH LIMITATIONS | READY FOR PROTOTYPE | USD reserve-share trend under the revised COFER definition, with long horizon and imputation/valuation cautions. |
| 9 | Foreign Treasury Demand | ACCEPT WITH LIMITATIONS | READY FOR PROTOTYPE | Rename foreign Treasury **holdings** trend; stocks cannot isolate investor demand, transactions or motive. |
| 10 | Global Dollar Credit | ACCEPT WITH LIMITATIONS | READY FOR PROTOTYPE | Offshore USD credit **outstanding** trend; nominal stock change, not adjusted official growth or funding stress. |
| 11 | Digital Dollarization | DEFER | NEEDS MORE DATA | Manual publication facts only; continuous comparable history, ownership and exact observation dates inadequate. |
| 12 | International Dollar Market Validation | REJECT | REJECT | Reject a second factor built on the same FX index as candidate 7; retain the research question, reuse one context record. |
| 13 | Global Funding / Carry Conditions | DEFER | NEEDS MORE DATA | No integrated hedging cost, funding-spread, BOJ/JGB, comparable FX/rate-differential and bond-flow panel. TIC/BIS stocks cannot fill this gap. |

Small v0.1 scope: **four domestic + three international factors**, each with exactly one primary series. The number of context series never becomes a factor weight.

## 2. Complete ownership inventory

Classification vocabulary: **PRIMARY FACTOR** = determines one accepted factor; **SECONDARY CONTEXT** = explanatory/decomposition evidence, no directional vote; **DISPLAY ONLY** = literal contextual fact, no engine inference; **NOT SUITABLE FOR ENGINE** = no usable measurement. A display-only classification does not prohibit its existing website display.

Canonical source files: `data/inflation/{fred,drivers,monitor}.json`, `data/productivity/series.json`, `data/external/{gpr,gscpi,fao-food,sipri-military}.json`, `data/fiscal/cbo-2026-02.json`, `data/digital-money/{bank-deposits,stablecoins,treasury-holdings}.json`, and `data/international-dollar/{reserve-composition,treasury-holdings,global-dollar-credit}.json`. The config explicitly maps every registry ID to one owner/classification; the following table supplies research rationale. Repeated source references in pages are not distinct observations.

| Indicator(s) / series IDs | Frequency, stored coverage, units | Classification / owner | Permitted meaning and restriction |
| --- | --- | --- | --- |
| Core PCE `PCEPILFE` | Monthly 1959-01–2026-08; index 2017=100, SA | PRIMARY FACTOR / inflation-persistence | Core inflation trend; not overall PCE target or breadth. |
| Headline CPI `CPIAUCNS` | Monthly 1913-01–2026-08; index 1982–84=100, NSA | SECONDARY CONTEXT / domestic-prices | Overall consumer price outcome. YoY is distinct from purchasing-power level change over a chosen interval. |
| Food `CPIUFDNS`, energy `CPIENGNS` | Monthly starts 1913-01 / 1957-01, through 2026-08; CPI index, NSA | SECONDARY CONTEXT / domestic-prices | Overlap headline CPI; not independent persistence votes. |
| Shelter `CUUR0000SAH1` | Monthly 1952-12–2026-08; CPI index, NSA | SECONDARY CONTEXT / inflation-persistence | Price transmission context, not a breadth substitute. |
| Productivity `OPHNFB` | Quarterly 1947Q1–2026Q2; index 2017=100, SA | PRIMARY FACTOR / observed-productivity | Nonfarm-business output per hour; sector/hours definition matters. |
| ULC `ULCNFB`, compensation `COMPNFB` | Quarterly 1947Q1–2026Q2; index 2017=100, SA | SECONDARY CONTEXT / inflation-persistence | Labor-cost transmission; linked to productivity, not extra capacity votes. |
| Hourly earnings `CEU0500000003` | Monthly 2006-03–2026-09; dollars/hour, NSA | SECONDARY CONTEXT / inflation-persistence | Different population and compensation concept from COMPNFB; composition effects possible. |
| Real GDP `GDPC1`, employment `CE16OV` | Quarterly 1947Q1–2026Q2 chained 2017 USD billions SAAR; monthly 1948-01–2026-09 thousand persons SA | SECONDARY CONTEXT / observed-productivity | Activity/denominator context; GDP is a flow at annual rate, employment a count. |
| `REAL_GDP_WORKER` | Derived quarterly from complete 3-month CE16OV mean; 2017 USD/person annualized | SECONDARY CONTEXT / observed-productivity | `GDPC1 / mean(CE16OV) * 1,000,000`; broad cross-survey proxy, not OPHNFB and not hours-adjusted. |
| `PNFIC1` | Quarterly 2007Q1–2026Q2; chained 2017 USD billions SAAR | SECONDARY CONTEXT / capacity-investment | Real business investment; no automatic future productivity effect. |
| `A679RC1Q027SBEA`, `B985RC1Q027SBEA`, `B935RC1Q027SBEA` | Quarterly starts 1947Q1 / 1959Q1 / 1959Q1, through 2026Q2; nominal USD billions SAAR | SECONDARY CONTEXT / capacity-investment | Information/software/computing investment; overlap and nominal versus real distinctions preserved. |
| `IPG3344S` | Monthly 1972-01–2026-08; index 2017=100 SA | SECONDARY CONTEXT / capacity-investment | Semiconductor/electronics production proxy; no AI attribution. |
| `CENSUS_DATACENTER`, `CENSUS_NONRES`, `CENSUS_ELECTRONIC` | Monthly starts 2014-01 / 1993-01 / 1993-01, through 2026-08; USD millions SAAR | SECONDARY CONTEXT / capacity-investment | Nominal construction flow rates, overlapping categories; not capital stock or measured AI return. |
| `IPN22112CS`, `CUUR0000SEHF01` | Monthly electricity sales proxy 1972-01–2026-06, index2017 SA; consumer electricity price 1913-12–2026-08 CPI index NSA | SECONDARY CONTEXT / external-costs | Demand/price proxies, no unique data-center identification. |
| Debt/GDP `FYPUGDA188S` | Annual 1939–2025; percent GDP | SECONDARY CONTEXT / observed-fiscal | Publicly held debt, not gross federal debt; no debt-to-inflation trigger. |
| Deficit/GDP `FYFSGDA188S` | Annual 1929–2025; percent GDP | SECONDARY CONTEXT / observed-fiscal | Source surplus/deficit sign retained; positive-deficit display is explicit `-value`, never silent. |
| Interest `FYOINT`, receipts `FYFR` | Annual fiscal year, starts1940 /1901, throughFY2025; USD millions | SECONDARY CONTEXT / observed-fiscal | Exact same fiscal-year/date basis for interest/revenue. Do not combine calendar GDP mechanically. |
| Interest/revenue (derived, no registry ID) | Same-FY ratio `100 * FYOINT / FYFR`; receipts >0 | SECONDARY CONTEXT / observed-fiscal | Burden ratio, not a new independent fiscal observation. |
| `CBO_DEBT`, `CBO_DEFICIT`, `CBO_INTEREST` | Annual FY; fixed 2026-02 vintage, published2026-02-25; percent GDP | DISPLAY ONLY / conditional-fiscal | Separate source historical and conditional projection segments, target years and assumptions. Do not append projections to observed FRED history. |
| `FEDFUNDS` | Monthly 1954-07–2026-09; percent | PRIMARY FACTOR / policy-rate-direction | Effective policy rate change; not exact meeting decision, real stance or neutral-rate gap. |
| `M2SL` | Monthly 1959-01–2026-08; USD billions SA | SECONDARY CONTEXT / monetary-context | Broad domestic monetary aggregate; not Fed asset balance or offshore credit. |
| `WALCL` | Weekly Wednesday 2002-12-18–2026-09-30; USD millions | SECONDARY CONTEXT / monetary-context | Central-bank asset position; display scaling to billions is not another signal. |
| `DGS10`, `DFII10` | Daily, 1962-01-02 /2003-01-02 through2026-10-01; percent | SECONDARY CONTEXT / treasury-market | Nominal and TIPS real yields, separate legs. |
| `DGS10 - DFII10` (derived, no registry ID) | Exact matched daily dates; percentage points | SECONDARY CONTEXT / treasury-market | Inflation compensation includes more than expected inflation; no adjacent-day substitution. |
| `T5YIFR` | Daily 2003-01-02–2026-10-02; percent | SECONDARY CONTEXT / treasury-market | 5y5y forward compensation, separate horizon; preserve FRED citation requirements. |
| `DTWEXBGS` | Daily 2006-01-02–2026-09-25; Jan2006=100 | SECONDARY CONTEXT / fx-market | Trade-weighted broad dollar price. One shared record, no claim about domestic CPI or reserve usage. |
| `GSCPI` | Monthly 1997-09–2026-08; standard deviations | PRIMARY FACTOR / supply-chain-pressure | Source composite of supply-chain conditions; revisions and normalization remain source properties. |
| `MCOILWTICO`, `MHHNGSP` | Monthly WTI1986-01 /gas1997-01 through2026-08; USD/barrel, USD/million BTU | SECONDARY CONTEXT / external-costs | Cost evidence; prices reflect demand and supply. Percentage transforms require positive inputs. |
| `FAO_FOOD` | Monthly 1990-01–2026-09; 2014–16=100 | SECONDARY CONTEXT / external-costs | Global food commodity price index, not U.S. food CPI. |
| `FAO_MEAT`, `FAO_DAIRY`, `FAO_CEREALS`, `FAO_OILS`, `FAO_SUGAR` | Monthly 1990-01–2026-09; 2014–16=100 | SECONDARY CONTEXT / external-costs | FAO decomposition, no extra independent confirmations. |
| `GPR`, `GPRT`, `GPRA` | Monthly 1985-01–2026-09; source index1985–2019=100 | SECONDARY CONTEXT / geopolitical-context | News-based risk/threat/act measures; no inflation sign without separate realized transmission. |
| `SIPRI_US_GDP`, `SIPRI_US_GOV`, `SIPRI_US_REAL`, `SIPRI_WORLD_REAL` | Annual, manual review; latest2025; percentGDP/percentgovernment/million2024USD/billion2024USD | DISPLAY ONLY / military-context | Denominators and U.S./world coverage differ; do not annual-to-monthly fill or infer inflation. Non-null starts vary (1949/2001/1949/1988). |
| `COFER_USD` | Quarterly 2000Q1–2026Q2; percent world FX reserves | PRIMARY FACTOR / reserve-share | Revised2025Q3 methodology; not legacy allocated-only denominator. |
| `COFER_EUR`, `COFER_JPY`, `COFER_GBP`, `COFER_CHF`, `COFER_OTHER` | Quarterly 2000Q1–2026Q2; same share denominator | SECONDARY CONTEXT / reserve-share | Components of one composition; relative shares cannot independently confirm USD share change. |
| `COFER_CNY`, `COFER_AUD`, `COFER_CAD` | Quarterly starts2016Q4 /2012Q4 /2012Q4 through2026Q2 | SECONDARY CONTEXT / reserve-share | Earlier category absence is structural, not zero. |
| `COFER_IMPUTED` | Quarterly 2025Q3–2026Q2; percent world FX reserves | SECONDARY CONTEXT / reserve-quality | Quality/coverage statistic, not a currency; never add to shares summing to100. Missing past imputation is unknown. |
| `TIC_TOTAL` | Monthly 2020-01–2026-07; USD millions | PRIMARY FACTOR / foreign-treasury-holdings | Foreign stock; not transaction flows or share of all Treasury issuance. |
| `TIC_OFFICIAL`, `TIC_JAPAN`, `TIC_CHINA`, `TIC_UK` | Monthly 2020-01–2026-07; USD millions | SECONDARY CONTEXT / foreign-treasury-holdings | Official/country subsets overlap; country is not necessarily ultimate beneficial ownership. |
| `BIS_USD_TOTAL` | Quarterly 2000Q1–2026Q1; USD millions | PRIMARY FACTOR / offshore-usd-credit | USD-denominated credit to non-bank borrowers resident outside the United States. |
| `BIS_USD_LOANS`, `BIS_USD_SECURITIES` | Quarterly 2000Q1–2026Q1; USD millions | SECONDARY CONTEXT / offshore-usd-credit | Loans and international debt securities explain the total; never three votes. |
| `FED_STABLECOIN_SIZE`, `IMF_STABLECOIN_SIZE`, `IMF_USD_SHARE`, `IMF_TBILL_SHARE` | Manual publication snapshots, 2026 sources, reviewed2026-09-17 | DISPLAY ONLY / digital-context | Different publication dates, estimates/qualifiers and sometimes unknown observation dates; no synthetic time series. |
| `DPSACBM027SBOG` | Monthly 1973-01–2026-08; USD billions SA | SECONDARY CONTEXT / digital-context | Bank deposits do not measure migration into stablecoins. |
| `FP.CPI.TOTL.ZG` | World Bank annual country panel | DISPLAY ONLY / global-prices | Country coverage differs; not another U.S. factor or international-dollar usage measure. |
| `HISTORY_EVENTS` | Static source-linked narrative | DISPLAY ONLY / historical-context | Episode interpretation, not a numeric input. |
| `FREIGHT` | Planned, no integrated observations | NOT SUITABLE FOR ENGINE / planned-external | No fabricated measurement; GSCPI does not authorize a separate freight series. |

## 3. Shared transform and state specification

Let `x(t)` be a validated source level, with calendar lags expressed in native months/quarters. Require **every native period** in the declared minimum window, including intermediate points. Missing or incompatible periods block the primary factor. No implicit interpolation, skipped-row lag, rounding before transformation, or imputation.

| Transform ID | Formula / units | Rationale, frequency and minimum window | Missing/revision/direction behavior |
| --- | --- | --- | --- |
| `yoy_monthly` | `100 * (x(t)/x(t−12) − 1)` percent | Monthly annual price/stock change;13 contiguous months for one result | Positive levels required; revisions to either endpoint change result; positive means level exceeds a year ago. |
| `yoy_quarterly` | `100 * (x(t)/x(t−4) − 1)` percent | Quarterly annual productivity/stock change;5 contiguous quarters | Same requirements; no annualization of an already annual comparison. |
| `core_yoy_delta_3m` | `yoy(t) − yoy(t−3)` percentage points | Monthly change in core inflation rate;16 months for one result | More positive means annual core inflation accelerated, not prices necessarily rising faster month-on-month. |
| `gscpi_mean_delta_3m` | `mean(x(t),x(t−1),x(t−2)) − mean(x(t−3),x(t−4),x(t−5))` source SD units | Smooth monthly shipping/manufacturing composite;6 months | Negative index levels valid; revisions throughout both windows matter; direction is change in the source composite. |
| `rate_delta_3m` | `x(t) − x(t−3)` percentage points | Monthly effective funds-rate change;4 months | Negative rates permitted mathematically; direction is instrument movement, not real restraint. |
| `share_delta_8q` | `x(t) − x(t−8)` percentage points | Quarterly 2-year reserve-share movement;9 quarters | Shares0–100; one methodology/denominator; never percent growth or a regime label. |

Factor minimums add `N−1` native periods to the single-transform window. Exact generic persistence algorithm, numerical rounding, bands and release gates are defined in specification sections6–7. No annual or daily factor is accepted in v0.1.

For **optional context**, v0.1 emits literal levels, own periods and metadata. The config mandates only four extra context derivations: same-FY interest/revenue, explicit deficit sign reversal, complete-quarter GDP/employment ratio, and exact-date Treasury subtraction. No context YoY or other discretionary transforms are emitted in v0.1; a future version could reuse the positive-level YoY transforms after explicitly selecting series. Context has no band/state classifier. No percentile, historical median, regression slope, annualized short-run rate or FX return threshold is admitted. Units for nominal investments cannot become real growth by labeling alone.

## 4. Seven accepted rules

All factor thresholds below are coarse **draft conventions** for falsifiable offline testing, not estimates of economically optimal thresholds. `entry/quiet/N` refer to the shared confirmed-band rule. Each has no dependencies on another factor output. Each uses source-appropriate freshness and the selected as-of mode. Each recomputes under a revised compatible input vintage and records revision-driven changes separately. Quality rules are the same ordered gates in specification section9, with factor-specific caps described here.

### F01 — Inflation persistence (`inflation-persistence`)

- Primary: `PCEPILFE`; optional named context: `CPIAUCNS`, `CUUR0000SAH1`, `ULCNFB`, `COMPNFB`, `CEU0500000003`. Headline food/energy decomposition is available in the inventory but is not extra confirming evidence.
- Transform: `core_yoy_delta_3m`. Entry **0.3pp**, quiet **0.1pp**, **3 months**; **18 contiguous months** needed. Output `CORE_INFLATION_ACCELERATING`, `CORE_INFLATION_DECELERATING`, `LITTLE_CHANGE`, `TRANSITION`, or `INSUFFICIENT_DATA`.
- Show latest core YoY level as a literal percent alongside direction; no ELEVATED tag or 2% trigger. No breadth indicator is available. Persistence is across reported periods in one vintage, not three independent release confirmations.
- Missing any required window point blocks; missing optional labor/shelter context is disclosed and caps MEDIUM. Monthly freshness65days; availability proof cannot be inferred from the observation month. Revised core history can change both annual rates and their difference; retain old output.
- Dependency: one primary core series; CPI components overlap; ULC/compensation share productivity-related information. Do not add them. The factor addresses core inflation persistence, not the whole consumer basket or future purchasing power.

### F03 — Observed productivity (`observed-productivity`)

- Primary `OPHNFB`; context `GDPC1`, `CE16OV`, `REAL_GDP_WORKER`, `PNFIC1`. Other investment/AI proxies remain exploratory context, with no directional rule.
- Transform `yoy_quarterly`; entry **0.5%**, quiet **0.1%**, **2 quarters**, **6 contiguous quarters**. Labels `OUTPUT_PER_HOUR_GROWING` / `OUTPUT_PER_HOUR_CONTRACTING` / quiet/transition/insufficient.
- Quarterly freshness150days; wait for published/retrieved/validated quarter, never use quarter-start anchor as availability. Revisions to output/hours/seasonal patterns affect annual comparisons. Missing context caps MEDIUM; schema/required-window failure blocks.
- Positive measured productivity growth is a capacity-relevant observation, not proof of lower CPI, larger potential output, or AI causality. Changes in workforce composition can affect the aggregate. GDP per worker is not an independent replacement. ULC belongs primarily to inflation transmission context: BLS relates unit labor cost to compensation per hour relative to output per hour. [BLS productivity technical notes](https://www.bls.gov/news.release/prod2.tn.htm).

### F04 — Supply-chain pressure (`supply-chain-pressure`)

- Primary `GSCPI`; context `MCOILWTICO`, `MHHNGSP`, `FAO_FOOD`, `GPR`. FAO subcategories and GPR threats/acts remain decomposition, not primary evidence.
- Transform `gscpi_mean_delta_3m`; entry **0.5 source SD units**, quiet **0.1**, **2 months**, **7 contiguous months**. Labels `SUPPLY_CHAIN_PRESSURE_RISING` / `SUPPLY_CHAIN_PRESSURE_FALLING` / quiet/transition/insufficient.
- Report literal GSCPI level too. A falling index can remain historically elevated; a rising negative index is not automatically a crisis. Commodity prices can disagree and remain named cost countercontext; they never override the primary direction or establish a supply-specific cause.
- Monthly freshness75days. Source update may have only month precision; use accepted-project timing where appropriate and cap MEDIUM. Source history/model revisions can change the six-month means. No prior vintage means revision stability unknown. Missing optional commodity/risk context caps MEDIUM; missing GSCPI window blocks.
- GPR alone cannot create directional pressure. The NY Fed composite is research evidence, not a project-created causal shock identifier. [NY Fed methodology and release information](https://www.newyorkfed.org/research/policy/gscpi).

### F05 — Effective policy-rate direction (`policy-rate-direction`)

- Primary `FEDFUNDS`; context `M2SL`, `WALCL`, `DFII10`. Real yield is shared Treasury market context; no second primary owner.
- Transform `rate_delta_3m`; entry **0.25pp**, quiet **0.05pp**, **2 months**, **5 contiguous months**. Labels `POLICY_RATE_RISING` / `POLICY_RATE_FALLING` / quiet/transition/insufficient.
- Monthly freshness75days. FEDFUNDS monthly effective average is not the policy target or an intramonth FOMC decision. No incomplete month substitution. Revisions follow general rules; missing context caps MEDIUM.
- Split the original “restraint” concept: instrument direction here; market real rate under Treasury context; broad money and central-bank assets under monetary context. Without a reviewed real policy-rate/neutral-rate framework, no `TIGHT`/`LOOSE` stance label is defensible. Rate increases may be a response to inflation, not independent evidence of its cause.

### F08 — USD reserve-share trend (`reserve-share`)

- Primary `COFER_USD`; context `COFER_EUR`, `COFER_CNY`, `COFER_JPY`, `COFER_GBP`, `COFER_IMPUTED`; all other reported currencies remain decomposition. `COFER_IMPUTED` is never added as a currency.
- Transform `share_delta_8q`; entry **1.0pp**, quiet **0.25pp**, **2 quarters**, **10 contiguous quarters**. Labels `USD_RESERVE_SHARE_RISING` / `USD_RESERVE_SHARE_FALLING` / quiet/transition/insufficient. A single small quarterly move cannot qualify.
- Quarterly freshness190days. Store observation quarter, methodology/denominator, source update, acceptance and all uncertainty. Release timing must come from retained evidence, not an assumed last day of the quarter. Revisions/backcasts recompute current-vintage results; historical public replay requires earlier vintages.
- The integrated methodology beginning with2025Q3 reports world FX composition including IMF imputation and revises history back to2000Q1. Monetary gold, SDR holdings and IMF reserve positions are outside FX composition. Shares also move with exchange-rate valuation. It does not measure all central-bank assets, all wealth or identified allocation decisions. [IMF COFER](https://data.imf.org/en/datasets/IMF.STA:COFER).
- Imputed coverage or unknown historical imputation caps quality MEDIUM. Missing pre-introduction CNY/AUD/CAD categories is structural absence, not zero or a defect in the USD primary window. Missing primary share or incompatible denominator blocks. No motive or collapse language.

### F09 — Foreign Treasury holdings trend (`foreign-treasury-holdings`)

- Primary `TIC_TOTAL`; context `TIC_OFFICIAL`, `TIC_JAPAN`, `TIC_CHINA`, `TIC_UK` as overlapping subsets.
- Transform `yoy_monthly`; entry **5%**, quiet **1%**, **3 months**, **15 contiguous months**. Labels `FOREIGN_TREASURY_HOLDINGS_EXPANDING` / `FOREIGN_TREASURY_HOLDINGS_CONTRACTING` / quiet/transition/insufficient.
- Monthly freshness95days. Treasury file modification is retained as a source update, not a precise economic release timestamp; use accepted project availability for current/replay evidence and cap quality if publisher timing is unknown. Missing primary months block; optional holders absent cap MEDIUM.
- The variable is a nominal stock. Price changes, transactions, reporting and issuance may affect it; its change is not a capital-flow series or an identified demand shift. Country attribution has custody/intermediary limitations and does not necessarily identify the ultimate beneficial owner. [Treasury TIC FAQ](https://home.treasury.gov/data/treasury-international-capital-tic-system/frequently-asked-questions-regarding-the-tic-system-and-tic-data).
- Official holdings are a subset; country rows overlap official/private ownership. No country voting, geopolitical motive, net-flow computation or “world abandoning the dollar.” The integrated history starts2020; earlier crises cannot be evaluated for this factor without new ingestion/review.

### F10 — Offshore USD credit outstanding trend (`offshore-usd-credit`)

- Primary `BIS_USD_TOTAL`; context/decomposition `BIS_USD_LOANS`, `BIS_USD_SECURITIES`. Preserve the source validation tolerance for total/component reconciliation; a failed identity blocks, not a silent residual.
- Transform `yoy_quarterly`; entry **5%**, quiet **1%**, **2 quarters**, **6 contiguous quarters**. Labels `OFFSHORE_USD_CREDIT_EXPANDING` / `OFFSHORE_USD_CREDIT_CONTRACTING` / quiet/transition/insufficient.
- Quarterly freshness210days. Publisher update/release time is unknown in current metadata; validated project acceptance admits today's measure with a MEDIUM quality cap. Unknown public timing blocks true public replay, not all current use. Do not invent release dates from calendars.
- Coverage is USD-denominated credit to non-bank borrowers resident outside the U.S.; components are bank loans and international debt securities. The proposed transform is **unadjusted nominal stock YoY change**. BIS's published growth methodology adjusts for exchange-rate changes and breaks; this project transform is not that official growth series. [BIS Global Liquidity Indicators](https://data.bis.org/topics/GLI).
- No inference of funding stress, dollar shortage, currency share, domestic M2, or generic “Eurodollars.” Revisions and statistical breaks require lineage; incompatible definition windows block. Missing component context caps quality, whereas a present component identity validation failure blocks the dataset. Total and components never make three votes.

## 5. Deferred designs and reopening criteria

**Fiscal:** show observed debt/GDP, signed deficit/GDP, interest outlays and exact-FY interest/revenue separately. CBO2026-02 is a conditional fiscal projection under its stated legal assumptions, not a present observation or unconditional forecast. Its published assumptions and observed/projection split remain attached. Reopen a directional fiscal-pressure factor only after defining the measured impulse/burden, compatible sector/time denominators, release history, persistence and how interpretation avoids debt→inflation determinism. A larger debt stock alone is insufficient.

**Treasury:** nominal yield, real yield and inflation compensation are three views, with `DGS10−DFII10` only on identical dates and latest common date explicitly disclosed. Availability is max of both operands. No mismatched-day fallback. T5YIFR is separate. Reopen formal classifications after specifying horizons and whether each measures price change, financing condition, expected inflation, liquidity or risk-premium context; do not pretend the simple spread uniquely separates these effects.

**FX:** DTWEXBGS belongs once to a shared market-validation context. Its trade-weighted index level says neither how much U.S. consumer purchasing power remains nor how much invoicing/reserve/payment usage exists. Do not create a duplicate “international validation” vote to fill coverage. Any later trend rule needs an explicit time horizon, distribution/units, freshness and ownership review.

**Digital:** existing four facts have different observation semantics; one Fed-cited estimate has an observation date, while several IMF statements do not. Do not compare them as a growth series. Bank deposits are not measured migration; stablecoin market capitalization is not M2 or Federal Reserve creation; estimated stablecoin T-bill holdings are not all foreign Treasury demand. Reopen with continuous comparable observations, primary issuer/reserve coverage, definitions, vintage and release archives, and denominator review. Keep the detailed Digital Money page as context.

**Funding/carry:** require directly useful funding prices/spreads, FX/hedging conventions, compatible policy/market-rate maturities and flows with known release dates. USD/JPY or Japanese Treasury holdings alone cannot identify a carry trade, hedging cost or forced unwind. BOJ policy, JGB yields, rate differential, forward/hedging costs and Japanese bond flows are research candidates, not approved ingestion in this task.

## 6. Source timing and vintage feasibility

| Source family | What existing metadata establish | What is not established / future work |
| --- | --- | --- |
| FRED-distributed BLS/BEA/Fed/EIA and others | Source identity, observation series, latest distributor update and retrieval | Original release instant/value per historical observation. Evaluate ALFRED coverage per series; date precision needs conservative treatment. |
| COFER | Current revised definition, quarterly observations, current source update, raw/snapshot hashes | Full pre-2025 methodology/vintage history or per-row initial publication; do not reverse-engineer original shares from current backcast. |
| TIC | Current holdings workbook/endpoint snapshot, HTTP modification and coverage | Transaction flows, ultimate owner, or verified first release time for every month. Retain successive releases prospectively. |
| BIS | Series identity, borrower/currency/sector, quarterly stocks, retrieval/hash | Publisher update currently unknown and historical released values not fully archived. Archive validated responses and release evidence. |
| CBO | Fixed vintage, publication date, original source files/hashes and assumptions | Intraday publication time and a full archive of different forecast vintages. Review independently of daily freshness. |
| SIPRI | Annual manual evidence with source publication/review | Complete historical release-vintage panel or monthly observations. |
| Digital facts | Source citation, excerpt hash, publication/review, qualifiers; one exact observation date | Continuous comparable history and several observation dates. Publication is not observation; approximate facts stay approximate. |

Current-vintage reconstruction can explore all retained historical observation ranges after warmup, with its hindsight label. Project-as-of replay starts only where retained accepted snapshots are proved. No source here warrants an unqualified true real-time-vintage backtest claim. Expanding archives is a separate evidence project, not an excuse to fabricate past availability.
