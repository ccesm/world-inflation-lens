# Occupational AI Exposure Crosswalk — Phase 2

Research-only implementation, stacked on Phase 1 commit `289f93d99c378e0f8e7f2819d4820a82a0b12672`. No public UI, Signal Engine, email, fiscal coupling, labor scenarios or causal analysis is implemented.

**Exposure is not adoption, task automation, job elimination or unemployment. Platform usage is not national adoption. High exposure is not a job-loss probability. Age is not seniority.**

## 1. Source gate and independent constructs

| Framework | Publication / date | Construct and source quality | Decision |
|---|---|---|---|
| BLS/OMB SOC | [SOC 2018](https://www.bls.gov/soc/2018/home.htm), final structure November 2017 for January 2018 reference | Official public occupational hierarchy | INTEGRATE; official Census-hosted structure workbook |
| USDOL/ETA O*NET® | [Database 31.0](https://www.onetcenter.org/database.html), August 2026 | Official public task/descriptor backbone; O*NET-SOC 2019 | INTEGRATE with database and crosswalk licenses |
| Eloundou, Manning, Mishkin, Rock | [GPTs are GPTs](https://arxiv.org/abs/2303.10130), original preprint March 17, 2023 | Academic working-paper capability rubric; human and GPT-4 task assessments | INTEGRATE all six occupation measures plus task path; [publisher repository](https://github.com/openai/GPTs-are-GPTs) commit `0471612fef3cc22b74fb884d27bff9dbd3770582` |
| Tomlinson, Jaffe, Wang, Counts, Suri / Microsoft | [Working with AI](https://arxiv.org/abs/2507.07935), original preprint July 10, 2025 | Platform-observational, model-mediated applicability; not pure capability exposure or national adoption | INTEGRATE v1.1 decomposition and native score; [publisher repository](https://github.com/microsoft/working-with-ai) commit `c94a07c52fb1d88ca5d221388f06d10e1bd6d2fe` |
| Handa et al. / Anthropic | [Economic Index initial release](https://www.anthropic.com/news/the-anthropic-economic-index), February 10, 2025 | Platform-observational task-use shares and global interaction modes | INTEGRATE selected aggregate tables from `release_2025_02_10`; dataset commit `4e5f69fab13a9c3f7d0dcc31a6f893a9818738f6` |
| Gmyrek et al. / ILO–NASK | [Refined GenAI exposure index](https://www.ilo.org/publications/generative-ai-and-jobs-refined-global-index-occupational-exposure), May 20, 2025 | Institutional research; tasks, expert input and model predictions; ISCO-08 exposure gradients | DEFER numerical U.S. mapping: no accepted distributable score artifact plus verified SOC concordance |
| Cazzaniga et al. / IMF | [Gen-AI and the Future of Work](https://www.imf.org/en/Publications/Staff-Discussion-Notes/Issues/2024/01/14/Gen-AI-Artificial-Intelligence-and-the-Future-of-Work-542379), January 14, 2024 | Institutional exposure/complementarity framework | DEFER occupational values: independently licensed pinned table not accepted; country preparedness is not exposure |
| Felten, Raj, Seamans | [AIOE](https://doi.org/10.1002/smj.3286), May 8, 2021 version of record | Peer-reviewed general-AI ability overlap; historical benchmark | DEFER redistribution: [publisher repository](https://github.com/AIOE-Data/AIOE) lacks an explicit data license; article license not extended by assumption |
| Brynjolfsson, Chandar, Chen / Stanford DEL | [Canaries](https://digitaleconomy.stanford.edu/publication/canaries-in-the-coal-mine-six-facts-about-the-recent-employment-effects-of-artificial-intelligence/), revised August 12, 2026; original 2025 | Academic employment comparator using proprietary ADP and exposure frameworks | DEFER underlying panel; no raw ADP redistribution clearance; not an independent new exposure backbone |
| Brynjolfsson, Mitchell, Rock | [What Can Machines Learn?](https://www.aeaweb.org/articles?id=10.1257/pandp.20181019), May 2018 | Peer-reviewed task suitability-for-machine-learning framework | Conceptual benchmark only; no additional licensed pinned numeric table accepted |

Deferral is not a judgment that a framework is invalid. It means a reproducible, licensed mapping is not established in this release. No restricted dataset or invented ILO/IMF values are included.

Full publication metadata lives in `occupational/config/methodologies.json` and `normalized/exposure-methodologies.json`: authors, publication/date, taxonomy, unit, scale, interpretation/direction, task versus occupation level, model generation, human validation, observed behavior versus modeled capability and limitations. These are separate from scores.

## 2. Licenses and redistribution

| Accepted input | Permission / obligations |
|---|---|
| Official SOC structure | U.S. federal public data; cite BLS/OMB and official Census distribution |
| O*NET 31.0 tables | [CC BY 4.0 database license](https://www.onetcenter.org/license_db.html); redistribution, adaptation and commercial use allowed with attribution/version/license/change disclosure |
| O*NET official crosswalks | [Resource Center CC BY 4.0](https://www.onetcenter.org/license.html); retain attribution and source identity |
| GPTs-are-GPTs publisher annotations | Repository MIT license retained in raw archive; keep copyright/license notice. Underlying O*NET text retains its own CC BY attribution |
| Microsoft data/decomposition | Repository CC BY 4.0; cite the paper and license; disclose normalized formatting and derived ranks |
| Anthropic initial aggregate data | Release README explicitly says data CC-BY, code MIT. License version is unspecified and is **not silently changed to 4.0**. Retain attribution and disclosure of normalization; MIT dataset-card label is not treated as the data permission |

No noncommercial-only accepted source, credentialed API, confidential conversations or proprietary payroll panel is redistributed. No restricted derivative is produced. Source-specific license proof bytes and all source hashes are pinned in `config/sources.json`. Current O*NET database licensing also permits earlier releases with correct version attribution. For the Anthropic-provided task snapshot, the database release is explicitly unknown, not mislabeled 31.0.

Attribution: this research includes information from the **O*NET 31.0 Database**, U.S. Department of Labor, Employment and Training Administration, under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Historical GPT task text is from the authors' O*NET 27.1-derived input. O*NET® is a USDOL/ETA trademark. World Inflation Lens has normalized file structure, added mappings/ranks and linked metadata; task statements are unmodified. USDOL/ETA has not approved, endorsed or tested these additions. MIT and CC attribution notices remain in the source archive.

## 3. Canonical taxonomy and mapping rules

Canonical SOC version is **2018**, with 23 major groups, 98 minor groups, 459 broad occupations and **867 detailed occupations**: 1,447 records altogether. Full codes and official titles are retained. Explicit parent relationships come from the published structure, not guessed code suffixes. Publication year/reference year and actual retrieval receipts are separate.

The BLS download returned HTTP 403 during qualification. The pipeline uses the [official Census-hosted copy of the BLS structure](https://www2.census.gov/programs-surveys/demo/guidance/industry-occupation/soc_structure_2018.xlsx), with exact bytes/hash. It does not bypass access controls or substitute an unofficial taxonomy.

O*NET database **31.0, August 2026**, contains **1,016 O*NET-SOC 2019 occupations**. The [official O*NET-SOC 2019 → SOC 2018 workbook](https://www.onetcenter.org/taxonomy/2019/soc/2019_to_SOC_Crosswalk.xlsx?fmt=xlsx) supplies all direct relations. The [official 2010 → 2019 crosswalk](https://www.onetcenter.org/taxonomy/2019/walk/2010_to_2019_Crosswalk.csv?fmt=csv) supplies legacy relations.

Every edge records source/target codes and versions, multiplicity, source URL/hash, confidence basis and a prohibition on automatic cloning/pooling. Multiplicity uses the target's incoming source count and source's outgoing target count. Counts below are **edge counts**, not employment shares:

| Relation | 1-to-1 | 1-to-many | many-to-1 | many-to-many |
|---|---:|---:|---:|---:|
| O*NET-SOC 2019 → SOC 2018 | 791 | 0 | 225 | 0 |
| O*NET-SOC 2010 → 2019 | 857 | 58 | 209 | 40 |

All canonical detailed occupations have a current O*NET relation. Four current O*NET occupations (`15-1299.04`–`.07`) have no predecessor in the legacy crosswalk; no historical exposure is inferred for them. Generic unmapped, split, merge and ambiguous relations are tested even where the current direct relation has none of a given type.

Several O*NET children may map to one SOC occupation. Source measures remain **lists of native records**. No unweighted average, employment-weighted average or cloned scalar is invented. A SOC scalar used for agreement requires exactly one official O*NET child, not merely one scored child among multiple children. Titles preserve original typography; the official crosswalk's straight apostrophe versus SOC's typographic apostrophe is recognized only during comparison, not rewritten.

## 4. Current tasks versus historical classifications

The current task backbone retains **18,838 tasks across 923 O*NET occupations**, with official task IDs, verbatim text, type and source date/domain. Available importance (`IM`) and relevance (`RT`) ratings retain their original scales, uncertainty and suppression fields. Missing ratings remain absent. Importance/relevance are not task hours or time-share weights.

Current work activities, Essential Skills, Transferable Skills, Knowledge and Software Skills are preserved in a deferred compressed descriptor file, with original scales/values and metadata. O*NET 31.0 splits skills into Essential/Transferable files; it is not silently coerced into an older `Skills` table. Full task ratings, including category-frequency rows, remain reproducible in the raw database archive.

Academic historical annotations retain **19,265 tasks across 923 native O*NET occupations**, separate from the current task backbone. By occupation/task ID and exact text:

* 18,677 exact text matches;
* 58 changed-text tasks;
* 530 historical tasks absent from the current backbone.

An old classification is never transferred to changed text or a new task. The historical text remains intact so the published aggregation can be reproduced. New/current task counts do not overwrite the historical denominator.

## 5. Academic capability exposure and exact aggregation

Keep human and GPT-4 measures independently at native O*NET occupation level:

* Alpha: fraction of E1 tasks.
* Beta: E1 + 0.5 × E2.
* Gamma: E1 + E2.

These represent the study's time-saving capability rubric and anticipated software assistance, not labor substitution. Occupation aggregation is:

`sum(task transform × source core weight) / sum(source core weight)`

Core tasks have weight 2; Supplemental and unspecified task types have weight 1. All six published occupation measures reconcile to this arithmetic for all 923 native records. The repository notebook exposes multiple alternatives and includes an equal-weight setting in one cell; the **actual published occupation file reconciles to core weighting**, which is enforced rather than inferred from that cell.

The source's task-level exploratory `T0`–`T4` automation annotations and numeric `T/4` field are retained as auxiliary source data. They are not promoted into an independently validated occupational automation probability or used as a job-loss measure. No occupation receives an invented AUGMENTATION/AUTOMATION category. Canonical automation, augmentation and complementarity dictionaries remain empty where no accepted source-native occupation measure supports them.

## 6. Platform-derived applicability and observed usage

### Microsoft applicability

Keep the source score and all IWA metrics, mappings, full/nonphysical weights and physical-task classifications. Every one of **785 native scores** reconciles to the published decomposition. The source formula combines activity coverage, completion and impact scope using O*NET relevance/importance weights; the v1.1 AI-action side uses nonphysical weights. The activity coverage threshold is source-provided `share > 0.0005`. Both sides normalize by total occupation weights and their applicability contributions are averaged **inside this published source methodology**, never across external studies.

Missing completion/feedback cells remain missing. Activities below the source coverage threshold contribute zero according to that source rule; this does not convert missing observed values into zero.

The sample is U.S. Bing Copilot conversations from January 1–September 30, 2024. Classified activity is not verified worker occupation, use frequency is not national adoption, and applicability is not a measured automation rate.

Despite the publisher's detailed-SOC description, the file contains mixed reporting levels: **773 exact detailed SOC matches, seven exact broad matches and five unmatched reporting hybrids**. Broad records remain broad; hybrids are retained natively and unmapped. No hybrid score is distributed to newer detailed occupations. Native ranks explicitly disclose that their 785-record population mixes reporting levels.

### Anthropic task-use context

Retain **3,514 native task-use shares**, summing to 100% of the source task-classified distribution. The selected release covers Free/Pro Claude.ai interactions using Claude 3.5 Sonnet in December 2024/January 2025; exact observation-day bounds are not supplied in the accepted tables. It is not a geography-restricted U.S. employment sample.

The supplied historical task table uses O*NET-SOC **2010** code membership, all verified against the official legacy relation. Its exact database release is unknown. Match task text only through exact casefold equality to the supplied historical table, retaining the literal original text. Then inspect both taxonomy relations. No fuzzy match or title-based exposure inference is used.

There are **3,277 unambiguous context links, 236 ambiguous links and one unmapped row**. Unambiguous task references reach 574 detailed SOC occupations. Ambiguous text matches and taxonomy splits retain all candidate paths without copying or allocating usage percentages. Even unique links do not produce an occupation usage-share aggregate.

Six global interaction categories are preserved separately: directive, feedback loop, task iteration, learning, validation and none. Their published shares sum to **84.20923280635583%**. The incomplete mode-share total is disclosed; the pipeline does not renormalize it or reproduce headline augmentation/automation percentages. These categories do not supply occupation-specific augmentation rates, task automation rates or adoption probabilities.

## 7. Source-specific ranks and disagreement

Each of the six academic measures and Microsoft applicability has its own native-source rank population. Ascending midranks handle ties; percentile is `(midrank − 0.5) / N`; quintile is `min(5, floor(percentile × 5) + 1)`. Ties stay together, so groups need not be equal-sized. Bin boundaries and empirical ceiling-order-statistic cut points are explicit. No employment weighting, shared exposure scale or canonical “high AI exposure” threshold is introduced.

Descriptive comparison of academic human Beta versus Microsoft applicability uses **701 unambiguous detailed SOC occupations**. Spearman rank correlation on the common sample is **0.7563482656125381**; 289 share a native-source quintile. The predeclared `METHODOLOGY_DISAGREEMENT` flag means native quintiles differ by at least two: **102 cases**. Underlying native values remain inspectable. There are 67 occupations in both native top quintiles and 92 in both native bottom quintiles; these are construct-qualified rank agreements, not a new joint exposure definition.

Within the academic framework, human/GPT-4 Beta rank correlation is **0.9006907776164659** across 923 records. This is agreement between annotators in one study, not evidence from two independent sources. Neither comparison measures predictive success or a causal labor effect. No disagreements are resolved by averaging and no composite score exists.

## 8. Coverage, health and failure isolation

| Accepted measure/context | Detailed SOC linked | Count coverage / 867 | Boundary |
|---|---:|---:|---|
| Academic capability records | 798 | 92.04% | Multiple native children retained separately |
| Microsoft applicability | 773 | 89.16% | Seven broad/five hybrid records excluded from detailed coverage |
| Anthropic unique task context | 574 | 66.21% | References only; not occupation usage values |

Every unscored occupation remains with `exposureStatus=UNAVAILABLE`, not zero. Coverage files list missing codes, scalar ambiguities and taxonomy exceptions. **Employment-weighted coverage is null**: no OEWS employment vintage was accepted. The publisher's reported worker totals are not substituted for independently validated weights. No national exposure share or job-loss count is produced.

Health states are CURRENT, STALE, PARTIAL, FAILED, UNAVAILABLE, LICENSE_RESTRICTED and VERSION_MISMATCH. Current taxonomy/database inputs are CURRENT; accepted methodological inputs are PARTIAL because canonical coverage is incomplete. Fixed-vintage CURRENT means the selected reviewed source is intact, not that a 2023 capability estimate measures today's models. No daily/monthly freshness threshold is applied to research papers. STALE is reserved for an explicit future maintenance policy rather than inferred from publication age.

Each provider has its own fetch/parse/accept boundary and last-valid pointer. Unexpected bytes, version, licensing or schema changes fail safely; other providers continue. Accepted payloads and configuration snapshots are immutable and hash-addressed. Runtime health/receipts are outside deterministic methodological payloads. Failed source refreshes preserve prior accepted data with last-valid labeling. Without prior data, the measure is unavailable while the occupation backbone remains. If the entire canonical backbone has never been accepted, new canonical projection cannot be fabricated; available source intakes and health still persist.

This is a single-writer offline research tool, not scheduled production infrastructure. Global invalid configuration or broken accepted-store identity fails closed as a core error; it is not masked as an ordinary source failure.

## 9. Contracts, files and reproduction

`research/ai-labor-transition/occupational/` contains pinned source/methodology registries, license evidence, raw archives, retrieval receipts, accepted provider/configuration vintages, adapters, schemas and offline fixtures/tests. Source URLs and hashes are embedded in normalized envelopes. Actual retrieval timestamps stay in source receipts; no historical availability is inferred from them.

Added views under `research/ai-labor-transition/normalized/`:

* `occupations.json`, `occupation-crosswalk.json`;
* `occupation-tasks.json.gz`, `occupation-descriptors.json.gz`;
* `exposure-academic.json`, `exposure-academic-tasks.json.gz`;
* `ai-applicability-microsoft.json`, `ai-applicability-microsoft-lineage.json.gz`;
* `ai-usage-context.json`, `ai-usage-historical-tasks.json.gz`;
* `exposure-methodologies.json`, `exposure-agreement.json`, `exposure-data-health.json`;
* `occupation-output-manifest.json`.

No fake `exposure-ilo.json` measurement is generated. Deferred frameworks are represented in methodological metadata/health. Existing Phase 1 raw, accepted, health and monthly summary files are unchanged.

Canonical schemas validate full SOC codes, hierarchy/versions and output envelopes. Source-specific checks validate identities, scales/direction, categories, task text/operands/weighting, counts, code multiplicity, unknown/missing values, coverage, provenance and license evidence. Semantic qualification reparses accepted raw sources independently, reconciles native published scores and compares each generated view to reconstruction; validation does not trust fabricated output metadata or merely its hashes.

Identical pinned inputs/configuration produce identical normalized bytes and content hashes. JSON canonicalization and gzip timestamp zeroing are deterministic in the qualified Python runtime; the manifest hashes **uncompressed canonical content**, so compression packaging is not mistaken for analytical identity. Retrieval timestamps and run time are separate. See [commands](../research/ai-labor-transition/README.md) and [qualification](../research/ai-labor-transition/occupational/qualification.md).

## 10. Future labor join and empirical-analysis contract

No occupation exposure enters Phase 1's monthly summary. Phase 3 must accept a separate occupation-level outcome dataset before comparison.

Stable join keys must include:

`taxonomy system + taxonomy version + full occupation code + hierarchy/reporting level + source vintage + geography + reference period`

For OEWS, retain the exact annual May release, employment/wage units, suppression codes, reporting aggregates and methodological breaks. A detailed SOC code can join only an exact detailed outcome or an explicitly reviewed relation; broad/hybrid reporting rows cannot be treated as individual detailed occupations. OEWS overlapping survey panels and methods changes limit short-run change interpretation. Employment-weighted coverage requires accepted employment weights, matching definitions and explicit missing-weight denominator.

CPS uses Census occupation codes, not an exact SOC equivalent. Accept a versioned official concordance first; retain many-to-many mappings and population/age/weight semantics. CPS/CES/JOLTS Phase 1 totals do not supply occupation-level hiring. NAICS is an **industry** taxonomy (pin 2022 where applicable), separate from SOC. Future industry×occupation keys should use both full codes and their versions, such as an OEWS staffing-pattern row; no industry exposure proxy is assigned here.

Future descriptive comparisons need pre-AI outcome history and separate source-specific exposure groups, with checks for pre-trends, industry, education, age, business cycle, interest-rate sensitivity, remote-work exposure, offshoring, geography and occupation fixed effects. Source publication/model vintages must be explicit; current cross-sectional scores are not historically contemporaneous instruments by inference. Simple correlations or different group trends do not establish causality.

Entry-level research requires occupation×age×employment/hiring evidence and, preferably, actual seniority/job-posting fields. **High exposure plus weak 20–24 rates is not AI entry-level displacement.** Public CPS age aggregates remain an imperfect age monitor.

## 11. Phase 3 acceptance gates and decision

Before producing Observed Labor Outcomes by AI Exposure:

1. Accept a reliably downloadable, licensed OEWS/CPS occupation outcome vintage and historical pre-AI baseline; disclose method/taxonomy breaks.
2. Establish exact detailed-code joins and quarantine hybrids; no cloned split/merge values or hidden pooling.
3. Calculate occupation-count and, where supported, employment-weighted outcome/exposure coverage with matched denominators.
4. Predeclare source-specific groups and robustness across annotator variants; preserve disagreements.
5. Keep exposure, observed usage and actual labor outcomes separate. No causal label, forecast, public UI, Signal Engine or fiscal coupling is authorized by this phase.

**READY FOR OBSERVED LABOR OUTCOMES BY AI EXPOSURE** means the crosswalk is ready for that next controlled data/join phase. It does not mean all prerequisites for a published empirical result are already satisfied.
