# Observed AI Labor Market Pipeline — Phase 1

Research-only implementation; no public UI, Signal Engine changes, forecasts, scenario model, fiscal coupling or causal AI attribution.

## Scope and research basis

The pipeline keeps **labor-market observations** separate from **AI adoption context**. It can describe national labor conditions and age-group divergence. It cannot identify AI-caused job loss, job seniority, occupational exposure or enterprise automation intensity.

Design builds on the local research documents `AI_LABOR_TRANSITION_MODEL_MATRIX.md`, `AI_LABOR_TRANSITION_DATA_DESIGN.md`, `AI_PRODUCTIVITY_MODEL_MATRIX.md` and `AI_FISCAL_CAPACITY_MODEL_DESIGN.md`; those documents are unchanged. Their scenario and causal questions do not enter this data contract.

## Source-selection gate

| Source | Decision | Machine-readable input / reason |
|---|---|---|
| BLS CPS | INTEGRATE | Official API v2; published national SA age-band rates |
| BLS CES | INTEGRATE | Same official API; employment, private hours/earnings and three broad industries |
| BLS JOLTS | INTEGRATE | Same official API; national total nonfarm flow/stock levels and rates |
| Census BTOS | INTEGRATE | Official historical XLSX downloads with explicit reference, collection and publication tables |
| DOL claims | DEFER | Optional; narrower initial source set is adequate; not an ingestion failure |
| LinkedIn / Indeed / Lightcast / ADP | EXCLUDE FROM CORE | Proprietary access and redistribution rights not established |
| Occupational exposure scores | PHASE 2 | Separate taxonomy/license/version review; no exposure assignments here |

[BLS API documentation](https://www.bls.gov/developers/api_signature_v2.htm) describes the official endpoint `https://api.bls.gov/publicAPI/v2/timeseries/data/`. Unregistered calls use batches of at most twenty IDs and ten calendar years. History is requested as 2015–2024 plus 2025 through the retrieval year. No key or secret is required. Expected IDs, response shape and warnings are validated; only the known expected-ID “Unable to get Catalog Data” message is allowed. Units and definitions come from a reviewed pinned catalog, since registration-free responses do not reliably supply catalog metadata.

BTOS uses [National.xlsx](https://www.census.gov/hfp/btos/downloads/National.xlsx) and [AI Core Questions.xlsx](https://www.census.gov/hfp/btos/downloads/AI%20Core%20Questions.xlsx), linked from [Census downloads](https://www.census.gov/hfp/btos/data_downloads). Historical workbooks supply richer period semantics than chart endpoints. The adapter parses XLSX XML, not presentation HTML. It does not invent automation for unavailable occupation-level or entry-level sources.

## Exact series contract

All following BLS series are **monthly, seasonally adjusted, United States 50 states plus DC, all sexes**.

### CPS: people, not payroll jobs

| Population age band | Unemployment rate | Employment/population | Participation |
|---|---|---|---|
| Overall 16+ | `LNS14000000` | `LNS12300000` | `LNS11300000` |
| 20–24 | `LNS14000036` | `LNS12300036` | `LNS11300036` |
| 25–34 | `LNS14000089` | `LNS12300089` | `LNS11300089` |
| 25–54 | `LNS14000060` | `LNS12300060` | `LNS11300060` |

Units are percent. Unemployment uses the stated age group's civilian labor force; the other two rates use its civilian noninstitutional population. Age bounds are inclusive and stored explicitly. Review references include [CPS definitions](https://www.bls.gov/cps/definitions.htm), [published unemployment by age](https://www.bls.gov/web/empsit/cpseea10.htm) and [employment/population by age](https://www.bls.gov/web/empsit/cpseea08a.htm). The seasonally adjusted participation IDs are requested directly and retain their own denominator.

The [CPS survey description](https://www.bls.gov/cps/cps_htgm.htm) describes an approximately 60,000-household national sample. **That is not a sample-size estimate for an individual age-band cell.** The series API does not supply cell counts or standard errors. Small age groups can be volatile; differences are descriptive, not significance tests. The missing October 2025 CPS observations are retained as null with official footnotes, not interpolated.

**Age ≠ job seniority.** A 23-year-old may be experienced; a 35-year-old may be entering a new occupation. Published age rates cannot establish true entry-level hiring or a compressed career ladder. That requires job/occupation-level hiring evidence and properly licensed data.

### CES: establishment payrolls

| ID | Metric | Unit / coverage |
|---|---|---|
| `CES0000000001` | Nonfarm payroll employment | Thousand jobs; total nonfarm |
| `CES0500000002` | Average weekly hours | Hours/week; all employees, total private |
| `CES0500000003` | Average hourly earnings | Nominal USD/hour; all employees, total private |
| `CES5000000001` | Information payroll employment | Thousand jobs; supersector 50, NAICS 51 |
| `CES5500000001` | Financial activities payroll employment | Thousand jobs; supersector 55, NAICS 52/53 |
| `CES6000000001` | Professional/business services payroll employment | Thousand jobs; supersector 60, NAICS 54/55/56 |

Payroll employment counts jobs, not unique workers. Hours and earnings are not economy-wide household measures. Industry mappings pin NAICS 2022; CES supersector IDs remain distinct from NAICS IDs. These industries are **not equivalent to AI exposure**. [CES technical guidance](https://www.bls.gov/web/empsit/cestips.htm) describes coverage and revisions.

### JOLTS: stocks, flows and denominators

| Metric | Level ID | Rate ID |
|---|---|---|
| Hires | `JTS000000000000000HIL` | `JTS000000000000000HIR` |
| Job openings | `JTS000000000000000JOL` | `JTS000000000000000JOR` |
| Layoffs and discharges | `JTS000000000000000LDL` | `JTS000000000000000LDR` |
| Quits | `JTS000000000000000QUL` | `JTS000000000000000QUR` |

Levels are thousand jobs; rates are percent, total nonfarm establishments. Openings are a stock at the last business day; hires/separations are monthly flows. Openings rate denominator is employment plus openings; other rates use employment. Do not infer hiring, layoffs, unemployment and net employment from each other. See [JOLTS definitions](https://www.bls.gov/jlt/jltdef.htm) and [FAQ](https://www.bls.gov/jlt/jltfaq.htm). Releases lag the reference month by several weeks; monthly and annual revisions occur. National industry aggregates do not identify age, occupation, seniority or causal AI exposure.

### BTOS: separate AI-use context

| Local stable ID | Official question / response | Wording / available periods |
|---|---|---|
| `BTOS_AI_CURRENT_ORIGINAL` | 7 / 1 (Yes) | Producing goods or services; 202319–202520 |
| `BTOS_AI_EXPECTED_ORIGINAL` | 24 / 1 (Yes) | Same narrow wording; 202319–202520 |
| `BTOS_AI_CURRENT_BUSINESS_FUNCTIONS` | 7 / 1 (Yes) | Any business functions; 202524 onward |
| `BTOS_AI_EXPECTED_BUSINESS_FUNCTIONS` | 24 / 1 (Yes) | Same broadened wording; 202524 onward |

The official questions, verified in full against the workbook, are:

* Current: “In the last two weeks, did this business use Artificial Intelligence (AI) …?”
* Expected: “During the next six months, do you think this business will be using Artificial Intelligence (AI) …?”

The omitted phrase is either “in producing goods or services” or “in any of its business functions”; exact full wording and examples are retained in each normalized series. [Census's wording-change notice](https://www.census.gov/hfp/btos/downloads/AI%20Question%20Wording%20Updates.pdf) documents the November 17, 2025 change and December 4 first release. **Do not splice the two histories, calculate a synthetic adoption index or interpret the level break as economic growth in adoption.** Expected use is a survey expectation, not realized future adoption.

Each record preserves Yes, No and Do not know shares plus the Yes standard error (percentage-point units). Values are weighted shares of in-scope employer businesses, not shares of workers or task hours; they are NSA and biweekly. The denominator excludes nonemployer businesses and the industries outside the BTOS frame. The method includes design and nonresponse weighting. [Current methodology download](https://www.census.gov/hfp/btos/downloads/methodology/Business_Trends_and_Outlook_Survey_Methodology_V6.pdf) covers scope and exclusions. At research time its filename says V6, while its internal version/date says Version 5, August 13, 2026; record the actual document rather than infer version from the filename.

The workbook's `Smpdt` ID identifies a survey cycle. Store **reference dates**, **collection dates** and **publication date** separately. For example, current period 202619 has reference August 24–September 6, collection September 7–20 and publication September 24, 2026. It is not a September monthly observation. The original archive lacks publication dates, which remain null. No periods are fabricated for the 202521–202523 collection interruption.

Industry BTOS breakdowns are deferred; Phase 1 uses national tables. API documentation exists, but historical workbooks with explicit date tables are the selected official input. Revision/finality is unknown unless a retained retrieval shows a change.

## Architecture, schema and provenance

`research/ai-labor-transition/` contains adapters, schema, raw archive, immutable vintages, revisions, views and tests. No production module imports it. Data are observed research inputs, not an AI causal model.

1. Capture a source independently; retain hash-addressed compressed raw bytes and a request manifest.
2. Parse into the reviewed series contract; validate schema plus source-specific semantics.
3. Independently normalize again against the pinned raw archive to prove acceptance content/provenance.
4. Write an immutable provider vintage and before/after audit; atomically replace its accepted pointer.
5. Generate independently validated views, per-provider health and bounded summary.

Each series records publisher, official page, endpoint/file URL, native series/table ID, raw SHA-256 hashes, retrieval time, source-release date/basis, frequency, units, seasonal adjustment, population, denominator, age, sex, geography, industry taxonomy, evidence type and license notes. Native monthly and biweekly observation boundaries remain explicit. Source API IDs and locally assigned BTOS IDs are distinguished.

The JSON Schema defines the payload shape. Deterministic semantic validators also check exact IDs/definitions, finite bounded values, date/calendar validity, ordered unique periods, missing periods, official category completeness, subgroup bounds, native frequency, source identity and publication chronology. Unexpected workbook questions/columns/categories, schema changes or API warnings fail that source safely. NaN/Infinity, unknown IDs, duplicate months, unsupported periods, silently altered denominators or SA/NSA metadata are rejected.

Raw archives contain public federal aggregate statistics only. They carry attribution notes; no confidential microdata or third-party licensed datasets are redistributed. Raw hash names identify **uncompressed bytes**; gzip uses deterministic timestamps. Requests contain no credentials.

## Time and revision semantics

| Clock | Meaning |
|---|---|
| `period`, `periodStart`, `periodEnd` | Economic observation/reference period |
| `collectionStart`, `collectionEnd` | BTOS collection cycle, distinct from its reference period |
| `releaseDate` | Official supplied publication date, or null when unavailable |
| `source.retrievedAt` | Actual source capture timestamp with explicit timezone |
| `pipelineRunAt` / summary `asOf` | Export/evaluation runtime; **not historical availability proof** |

BLS API does not supply reliable release dates for these records; null is truthful. Generic release-lag descriptions are not assigned as synthetic historical publication dates. This pipeline is **current-vintage descriptive**, not real-time replay or publisher-vintage reconstruction.

Observation statuses preserve official missing values. Revision classifications are `preliminary`, `revised`, `final` or `revision_unknown`; this first intake never guesses finality. Explicit P flags are preliminary; explicit revision notes are revised; unmarked observations remain revision unknown. CPS seasonal/population adjustments, CES monthly/benchmark revisions and JOLTS monthly/annual revisions are documented in the catalog.

Every newly retrieved manifest and accepted payload has a distinct immutable identity. The audit stores previous/current manifest, raw identity change and before/after records for new observations, economic revisions, metadata revisions and withdrawals. Re-normalizing the same candidate is safe; it never replaces an immutable prior vintage. The first intake is not an archive of historical publisher releases. Future retrievals can establish subsequent vintage comparisons, but not backdate history.

## Derived statistics and young-worker monitor

Only transparent descriptive arithmetic is generated:

| Statistic | Formula / minimum |
|---|---|
| 3-/6-month moving average | Sum divided by 3/6; complete contiguous native monthly window required |
| 12-month change | Value(t) − value(t−12); exact two endpoints; rates use percentage points |
| Hiring-to-openings ratio | Same-month hires level / openings level; two official SA level inputs; positive denominator |
| Young-worker divergence | 20–24 published rate − same-month overall, 25–34 or 25–54 rate; nine separate comparisons |

Each carries input series, periods, values, units, formula, window and minimum observation requirement. Missing operands return unavailable, not zero or a nearest-period substitute. No quarterly/biweekly interpolation or SA/NSA mixing occurs. BTOS is excluded from monthly smoothing. The hires/openings measure is a descriptive **flow/stock ratio**, not a hire probability or causal adoption metric. Twelve-month level differences are not percent growth rates. No index, composite score, forecast or speculative prose is generated.

## Data health and source failure isolation

| State | Meaning |
|---|---|
| CURRENT | Valid accepted data within monitoring allowance, no detected missing periods/cells |
| PARTIAL | Valid accepted data but missing periods or official missing values |
| STALE | Latest observation exceeds the source-specific allowance |
| FAILED | New refresh failed; prior validated payload retained and `usingLastValid=true` |
| UNAVAILABLE | No accepted payload exists |

Health records publisher, last successful accepted fetch, observation-through, source-release date, lag description, missing periods, revision flag, suspected source change, schema validity, failure detail and snapshot/economic/manifest hashes. Freshness uses **research monitoring allowances** (CPS/CES 75 days, JOLTS 110, BTOS 60) rather than a false exact release calendar. Historical gaps make CPS PARTIAL even when its latest month is timely. Closed original BTOS histories do not make the current question stale.

Every source is refreshed in its own error boundary. A CPS fetch failure cannot stop CES/JOLTS/BTOS; a BTOS schema failure cannot discard accepted labor data. Failed candidates never overwrite last valid pointers. Summary values, ratios and divergences carry provider health and last-valid labeling. Without prior data the source is unavailable and absent from metrics. Unexpected export/storage/core errors are not broadly suppressed. CLI nonzero status still exposes source failures; success of the economic production workflow is irrelevant because this tool is not connected to it.

## Reproducibility and qualification

Normalization against identical raw inputs **and the same pinned retrieval manifest** is byte-stable across fresh processes. Full payload hashes preserve provenance; a distinct retrieval may legitimately change that identity even when economic data are identical. `economicContentHash` separately excludes runtime/retrieval/raw-packaging noise while retaining definitions, periods, values and status. Runtime metadata stays in status/summary exports; tests can pin it. No old artifact is rewritten to appear reproducible.

[Qualification record](../research/ai-labor-transition/qualification.md) documents 71 offline tests, four separate live source checks, fresh-process normalization and production isolation. Fixtures are small current-vintage excerpts of official responses, not synthetic historical vintages. Live checks are explicit and excluded from offline discovery.

## Known gaps and Phase 2 prerequisites

No true entry-level hiring, age-cell sample uncertainty, occupation-specific monthly wage flow, causal AI attribution, claims ingestion or industry BTOS slicing is included. BLS publication dates and original BTOS release dates are unavailable in the chosen machine-readable inputs. These gaps are labeled rather than fabricated.

Prepare Phase 2 as a separate **Occupational AI Exposure Crosswalk**:

| Input | Prerequisite / mapping boundary |
|---|---|
| [SOC 2018](https://www.bls.gov/soc/2018/major_groups.htm) | Pin taxonomy version, full code including aggregation level, titles and official concordances; no occupation assignments in Phase 1 |
| [O*NET](https://www.onetcenter.org/database.html) | Pin a release and O*NET-SOC task IDs; review [license/exceptions](https://www.onetcenter.org/license_agreements.html), attribution and task coverage; importance is not time spent |
| Stanford measures | Identify exact paper, release, exposure definition and distributable files; public dashboard access does not grant rights to underlying proprietary ADP microdata |
| [Anthropic Economic Index](https://huggingface.co/datasets/Anthropic/EconomicIndex) | Pin dataset/release-specific license and O*NET mapping; observed platform usage is not national adoption or theoretical capability; resolve data/code/card license distinctions |
| [ILO refined exposure framework](https://www.ilo.org/publications/generative-ai-and-jobs-refined-global-index-occupational-exposure) | Pin framework/version/license; ISCO-to-SOC mapping can be many-to-many; theoretical exposure is not adoption |
| NAICS / occupation joins | Keep industry and occupation IDs separate, pin NAICS 2022 and crosswalk versions; disclose weights/uncertainty and unmapped cells |

Refresh cadence differs: official labor data are monthly, BTOS biweekly, task/exposure releases episodic. A versioned many-to-many mapping with provenance, coverage and licensing review must precede exposure monitoring. Do not create an AI unemployment signal or couple these observations to fiscal scenarios in Phase 2.

**Phase 1 decision: READY FOR OCCUPATIONAL AI EXPOSURE CROSSWALK.** This means the observed research data layer is ready; it does not authorize a causal conclusion, public release or scenario forecast.
