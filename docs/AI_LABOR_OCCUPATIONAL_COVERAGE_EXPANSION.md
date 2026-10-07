# Phase 3.5 — Defensible occupational coverage expansion

Research only; **strict and expanded populations are separate**. Observed differences
across exposure groups do not establish that AI caused those differences. Exposure
is neither adoption nor automation probability. Age is not seniority.

## 1. Base, isolation and frozen specification

Base: `57f9b70352999a9464fb164e17df21075d6d61e9` (accepted Phase 3).
Branch: `codex/ai-labor-coverage-expansion`. Do not merge/deploy this branch.
The separate archive/hydration qualification worktree is untouched. No production
data, public UI, Signal Engine, workflow, monitor or email changes are included.

The initial Phase 3 validation reconstructed all eight analytical artifacts and
passed its 94 tests before expansion. Strict analytical-map SHA-256:
`2eff8331d05baffa4db0eb063f95d1ec74f2c31b605252217d1f8c70dc25b57f`.
Strict specification remains byte-identical with SHA-256:
`f3429802af3354335d5c724fc5497a24dde41ea11ac8178b2ac88c9416148b5e`.

Expanded rules were committed **before expanded outcome analysis**, in checkpoint
`e61e45242fdde0c3fe6a7bf2eb6404044266dc27`.
`outcomes/expanded-preanalysis-spec.json` hash:
`d40e6468ccc27fbc7c0f262acd1954e1eb5e18b28590af184411da71e76f9e8c`.
The loader embeds this identity and rejects even coherently edited spec/hash
markers. No eligibility rule, exposure cutoff, sample threshold, era or decision
threshold was changed after examining expanded outcomes.

## 2. Why strict coverage is limited

A read-only audit of the accepted inputs preceded mapping implementation. Each
of the 867 detailed SOC 2018 occupations has one primary reason, in frozen priority
order A→B→C→D→E→G. The counts are:

| Primary classification | Academic | Microsoft |
| --- | ---: | ---: |
| A: no accepted native exposure | 69 | 94 |
| B: exposure cannot be transferred as a strict scalar | 76 | 0 |
| C: no strict exact Census→detailed SOC mapping | 353 | 368 |
| D: no strict temporal Census bijection | 105 | 114 |
| E: complete balanced-panel sample fails | 97 | 101 |
| G: strict eligible | 167 | 190 |
| Total, no double counting | 867 | 867 |

H is a **recovery annotation**, not a second exclusion bucket: 79 Academic and 43
Microsoft detailed SOC members enter new eligible cells. F is a **metric-only
suppression annotation**, not lost employment coverage: 40/43 strict occupations
have eligible employment but suppressed 2024 hours and/or earnings. Their survey
weight remains in employment coverage. Individual cell and reason records plus
major-SOC count partitions are in `coverage-waterfall.json`.

**Identification boundary:** CPS reports Census occupation cells. It does not
identify each detailed SOC member's employment inside a multi-SOC cell. Therefore
the output does not invent 867 individual employment weights. Exactly identified
one-member weights are reported; multi-member detailed weights are null. A
separate native-Census-weight waterfall partitions every 2024 employed survey
weight once. A cell receives a reason only when all its SOC members share it;
mixed/unresolved reasons remain explicitly unallocated.

| Native Census weight partition (% of all 2024 CPS employed) | Academic | Microsoft |
| --- | ---: | ---: |
| A | 1.26 | 2.90 |
| B | 10.98 | 0.00 |
| C | 12.71 | 13.80 |
| D | 11.34 | 10.87 |
| E | 0.95 | 1.01 |
| G | 37.77 | 47.55 |
| Mixed/unresolved detailed-SOC reason, not allocated | 24.99 | 23.87 |

This table is not a claim that unidentified members have zero employment. It is
not interchangeable with the strict Phase 3 taxonomy/exposure/sample partition,
which remains unchanged. Rounded columns can differ slightly from 100%.

## 3. Official mappings and harmonized cells

No new raw mapping source was introduced. Existing pinned Census temporal workbook,
SOC 2018 structure, O*NET-SOC 2019→SOC 2018 crosswalk, native exposure inputs and
139 CPS monthly sufficient-statistic vintages are reused. Their original URLs,
retrieval receipts, raw SHA-256s and licenses remain in the Phase 2/3 archives.
Every expanded artifact binds these identities and the monthly selection manifest.

The [Census code-list documentation](https://www.census.gov/topics/employment/industry-occupation/guidance/code-lists.html)
and [Census Technical Paper 78](https://www.census.gov/content/dam/Census/library/publications/2020/demo/acs-tp78.pdf)
explain that a Census occupation may correspond to a detailed, broad, minor or
composite SOC grouping. The existing
[official SOC structure](https://www.bls.gov/soc/2018/home.htm) supplies explicit
parent relationships. An exact official hierarchy node is expanded to its full
set of detailed descendants **only to define one analytical aggregation cell**.
It is never made into separate detailed occupation outcome observations.

The algorithm closes connected components over **all** official old/new Census
edges and additionally joins components sharing any current SOC member. This
prevents a broad Census bucket and a named SOC bucket from counting overlapping
workers/SOC membership twice. Each cell retains its full old/new code sets,
taxonomies, SOC members, source expressions, mapping edges, multiplicity, rationale
and content-addressed ID. Stable strict bijections retain their original SOC IDs.

Wildcards/unknown expressions fail closed; no prefix guessing or fuzzy title
matching. An empty side, unresolved current member or incomplete component fails
closed. Many-to-many components are excluded in v1 even if graph closure exists.
Source splits are aggregated back, never apportioned. Multiple source codes are
pooled whole; workers are never assigned invented detailed-SOC proportions.

There are 454 non-overlapping components: 303 strict structural bijections,
101 additional structurally eligible harmonized cells and 50 ambiguous/incomplete
components. Actual analytical eligibility also requires exposure consensus and
the unchanged balanced-panel thresholds.

| Whole-component multiplicity | Academic included / excluded | Microsoft included / excluded |
| --- | ---: | ---: |
| 1→1 | 207 / 191 | 212 / 186 |
| many→1 | 0 / 1 | 0 / 1 |
| 1→many | 5 / 20 | 2 / 23 |
| many→many | 0 / 30 | 0 / 30 |

Counts are components, **not individual crosswalk edges**. Many-to-many exclusions
can arise after shared-SOC closure even if individual publisher edges had simpler
multiplicities. Academic C adds 45 cells (37 harmonized, eight former strict
structural candidates recovered by child consensus); Microsoft adds 24 harmonized
cells. No many-to-one cell survived all eligibility tests in these inputs.

## 4. Exposure assignments: categories without invented scores

Academic uses accepted human Beta and frozen native O*NET ranks. A single official
child retains its exact scalar. A multi-child SOC is eligible only if **every**
official child has a valid accepted value and all native quintiles agree. The
result is `CONSENSUS_CHILD_ASSIGNMENT`, with scalar null and all child values,
quintiles, missing-child diagnostics and source identities retained.

Twenty of 76 multi-child SOC cases satisfy categorical consensus; 56 remain
ambiguous. Twelve additional analytical cells actually enter through this rule
after temporal and sample restrictions. The other eight consensus SOC cases do
not automatically become valid outcome cells. Overall Academic has 69 unscored
SOC members; no missing value becomes zero.

Microsoft uses only its 773 accepted exact detailed SOC records. Seven broad
records and five reporting hybrids remain unassigned. A harmonized cell receives
a source-specific quintile only if **all** constituent detailed SOC members have
valid assignments and agree on that source's frozen native quintile. Missing
members or disagreement exclude it. The quintile range is diagnostic only.
No average/combined exposure scalar is calculated. There are still 76 Academic
and 91 Microsoft cell-level exposure disagreements in C, including cells with
otherwise ambiguous temporal structure; these are not additive waterfall counts.

## 5. Outcomes, thresholds, denominator and sensitivities

The pipeline sums original integer survey weights, hours sufficient statistics,
earnings-weight histograms and age/education/industry maps **before** estimating
cell/group outcomes. It never averages precomputed occupation medians or means.
Employment uses `PWCMPWGT / 10000`; outgoing-rotation earnings use the original
`PWORWGT` and weighted median histogram. Unit and population definitions are
unchanged. The denominator is **all** 2024 CPS civilian noninstitutional employed
people age 16+, all class-of-worker types, not just mapped occupations.

Cell employment requires 120 person-months and six represented months in each
complete year. The fixed balanced panel spans complete 2015–2024 observations.
Hours/earnings/group/age suppression remains exactly Phase 3. The 2015–2019
log-OLS pretrend, 2020–2021 disruption, 2022 baseline and 2023–2024 complete
observations remain visible. Partial 2025/2026 compare exactly the previously
qualified calendar months with 2022; October 2025 is not invented, and no partial
year enters annual indexes. The new pipeline independently verifies original
strict full-year rows, pretrend gaps and matched-month estimates before expansion.

Sensitivities are fixed in advance:

- A: frozen original strict population.
- B: temporal/hierarchy aggregation, exact scalar exposure only.
- C: B plus categorical O*NET-child consensus.
- Common B/C: intersection of eligible cell IDs, retaining independent
  source-native quintile assignments; never averaging sources.

## 6. Coverage: mapped SOC membership is not analytical cell count

| Population | Detailed SOC members | Analytical cells | Count coverage / 867 | 2024 employment coverage |
| --- | ---: | ---: | ---: | ---: |
| Academic strict A | 167 | 167 | 19.26% | 37.77% |
| Academic B | 231 | 200 | 26.64% | 50.52% |
| Academic C | 246 | 212 | 28.37% | 55.02% |
| Microsoft strict A | 190 | 190 | 21.91% | 47.55% |
| Microsoft B/C | 233 | 214 | 26.87% | 55.23% |
| Common strict A | 165 | 165 | 19.03% | 37.49% |
| Common B | 189 | 180 | 21.80% | 43.75% |
| Common C | 200 | 190 | 23.07% | 47.80% |

Expanded SOC counts mean **members represented by eligible cells**, not 246/233
independently observed detailed occupation outcome series. Missing coverage is
not renormalized away. All 23 majors have count-coverage diagnostics, included
weight, and an explicitly conditional employment-coverage denominator over
identified-major Census codes. Full-major employment coverage is null where
unresolved Census memberships prevent identification; it is not silently
estimated from a smaller denominator. Full major-SOC employed-weight shares
(strict/B/C/common) are also included. Only cells whose members share an official
major can assign weight to that major; a cross-major/unresolved category is explicit.

| Coverage gain category, percentage points | Academic | Microsoft |
| --- | ---: | ---: |
| Complete 1→1 temporal/hierarchy cell, previously non-strict | 10.8675 | 7.3744 |
| Complete 1→many aggregation back | 1.8810 | 0.3070 |
| Categorical O*NET-child consensus | 4.5071 | 0 |
| Total | 17.2556 | 7.6813 |

Attribution is mutually exclusive: child-consensus-dependent cells are assigned
to that category even when temporal harmonization is also necessary. A 1→1 cell
can contain multiple modern detailed SOCs because Census is an aggregation; it
can also have changed old/current SOC expressions. This gain is **not newly
discovered worker employment**. No new source qualification, threshold relaxation,
score cloning or outcome-selected mapping contributed to the gain.

## 7. Strict versus expanded descriptive results

All gaps below are Q5 minus Q1 within each independent methodology. Pretrend is
percentage points/year over 2015–2019; post gap is percentage points of cumulative
2022–2024 employment change. These are point-estimate differences, not p-values.

| Methodology/population | Pretrend gap | Post-period employment gap |
| --- | ---: | ---: |
| Academic strict A | +0.2021 | +0.4159 |
| Academic B | −0.0362 | −1.0062 |
| Academic C | −0.7122 | −0.8480 |
| Microsoft strict A | −1.1848 | +0.5621 |
| Microsoft B/C | −1.0058 | +0.0300 |
| Common strict, Academic | +0.2021 | +0.4159 |
| Common strict, Microsoft | −0.7127 | +0.1972 |
| Common B, Academic | +0.3445 | −0.3359 |
| Common B, Microsoft | −0.7243 | −0.9690 |
| Common C, Academic | −0.3219 | +0.1751 |
| Common C, Microsoft | −1.2651 | −0.5210 |

Labels were frozen before expanded results. Existing presentation thresholds are
5 pp post-gap change, 0.5 pp/year pretrend-gap change/strong-pretrend flag, and
5 pp full/common gap difference. Sign changes also flag sample sensitivity.
These engineering presentation thresholds are not significance tests.

Academic B: `SAMPLE_SENSITIVE`; C: `PRETREND_SENSITIVE`, `SAMPLE_SENSITIVE`.
Microsoft B/C: `DIRECTIONALLY_CONSISTENT` at the full-source level, with its
substantial pre-existing negative pretrend still visible. The common populations
remain below 50% employment coverage, with source-specific signs differing from
their full-source samples. **No gap reaches the existing 5 pp post-gap highlight
threshold. A small sign change is not new evidence of an AI effect.**

All five groups retain employment levels, all-employed shares, 2019/2022 indexes,
usual primary-job hours, nominal weekly earnings, age composition and matched-month
comparisons. Additional summaries of the 2022–2024 Q1/Q5 changes:

| Population | Nominal median weekly earnings change Q1 / Q5 | Hours change Q1 / Q5 | Age 20–24 share change Q1 / Q5, pp |
| --- | ---: | ---: | ---: |
| Academic A | +10.12% / +11.90% | −0.475 / −0.452 | −0.357 / +0.183 |
| Academic C | +8.38% / +14.48% | −0.475 / −0.401 | −0.618 / +0.276 |
| Microsoft A | +7.14% / +7.98% | −0.446 / −0.509 | −1.093 / +0.181 |
| Microsoft C | +8.57% / +5.26% | −0.416 / −0.502 | −0.973 / +0.406 |

Nominal medians cross the 2023–2024 disclosure/rounding/topcoding change and carry
**limited comparability**, not clean wage effects. Age composition is not hiring,
junior-job displacement or career-ladder compression.

## 8. Newly introduced composition

Every added cell lists its SOC members, major, native source quintile, mapping
category, 2024 employment share, suppressed metric estimates, age/education/native
industry composition, its own pretrend and its shares of group employment at the
2015/2019 endpoints. Those endpoint shares make the contribution inspectable;
they are not falsely labeled additive contributions to a log-OLS coefficient.

Academic additions are largest in sales (+3.354 pp of all employed), education
(+3.184 pp), transportation (+2.631 pp) and office/administrative work (+1.468 pp).
Examples include elementary/middle-school teaching, cashier/gaming cashier,
secretarial categories and material-moving workers. Microsoft additions are
largest in education (+2.797 pp), computer occupations (+1.270 pp), sales
(+1.126 pp) and transportation (+1.052 pp).

Added-cell employment is 42.55% bachelor-or-higher under Academic and 61.95% under
Microsoft. These are composition descriptors of the added populations, not
effects. Native industry shares are retained for each new cell in 2024 only;
cross-era industry change is `NOT_COMPARABLE` without a qualified industry bridge.
Suppressed age shares remain null, so no precision is invented by aggregating
suppressed composition descriptors into a false complete profile.

## 9. Reproduction and storage

From the repository root, Python 3.10+ standard library:

```sh
python3 research/ai-labor-transition/outcomes/scripts/expanded_coverage.py build
python3 research/ai-labor-transition/outcomes/scripts/expanded_coverage.py validate
python3 -m unittest discover -s research/ai-labor-transition/tests
python3 -m unittest discover -s research/ai-labor-transition/occupational/tests
python3 -m unittest discover -s research/ai-labor-transition/outcomes/tests
npm ci
npm ci --prefix research/signal-engine --ignore-scripts --no-audit --no-fund
npm run build
npm run verify
```

`--root` selects a hydrated accepted Phase 3 research archive; `--output` permits
an external research directory. In-repository outputs are restricted to ignored
`outcomes/expanded-generated/`. No fetch, refresh, scheduler or mail operation is
performed. Invalid specification/core provenance/strict reconstruction stops
execution before expanded analysis. Source assignments fail closed independently;
a missing source never fabricates a zero assignment.

The ten requested generated outputs total 7,371,138 uncompressed canonical bytes
(about 7.03 MiB). Repeated group industry maps and exposure-member evidence were
removed in favor of references; original sufficient statistics remain unmodified.
These are offline research artifacts, **not** frontend downloads or Git blobs.
The small committed `expanded-output-manifest.json` records hashes/sizes for all
ten outputs; `validate` independently reconstructs and compares all output bodies.
Two fresh-process reconstructions produced identical deterministic manifest hash:
`193ca9480a502e5841c99413cfe6bc556e3bd0808fbadbdc2be07a6df3facfae`.

Local handoff artifacts are also retained outside Git at
`/Users/chrischeng/Documents/Codex/research-artifacts/ai-labor-coverage-expansion/d40e6468ccc27fbc/`.
They can be regenerated from the accepted/hydrated archive, not from code alone.

| Storage class | Files |
| --- | --- |
| A: code/spec/docs/control metadata | This report; `outcomes/scripts/expanded_coverage.py`; expanded spec/hash; `outcomes/expanded-output-manifest.json`; `outcomes/expanded-generated/.gitignore` |
| A/B: tests and small deterministic fixtures | `outcomes/tests/test_expanded_coverage.py`, with in-code synthetic taxonomy/worker fixtures |
| C: reproducible generated, ignored | Ten requested JSON outputs and their generated manifest under `expanded-generated/` |
| D: historical evidence | Existing accepted Phase 1–3 archive reused unchanged; no new duplicated raw archive |

No original tracked file is modified. Candidate future slim delivery is A/B only;
it still needs the independently qualified archive/hydration path. This branch
does not presume the separate slim-delivery effort is already qualified.

## 10. Qualification, remaining limitations and decision

The added deterministic tests cover exact/many→1/1→many/many→many mappings,
incomplete components, official hierarchy nodes versus unresolved wildcards,
shared-SOC closure, taxonomy mismatch, duplicate/unknown mappings, consensus and
missing exposure, failure isolation, integer pooling, national denominators,
sample thresholds, matched-month/index protections, strict immutability,
specification tampering, fixed comparison labels and provenance. Independent
integration tests reconcile all 867 reasons and all survey-weight/gain partitions.

Phase 1: 71 tests pass. Phase 2: 77 tests pass. Phase 3 and the 55 added expansion
tests: 149 pass (297 Python tests total). `npm run build` and
`npm run verify` pass. Strict artifacts remain byte-identical. Build has
the pre-existing large-chunk warning; this research adds no frontend assets.

Optional monitoring tests were run on both this branch and a clean checkout of
the exact Phase 3 base. Both have **the same** 155 passes / 85 failures out of 240
integration/presentation tests. The old isolation test compares to an earlier
feature commit rather than the accepted Phase 3 data vintage. The public fixture
uses an October 4 clock with a subsequently accepted data snapshot, causing its
setup failure and 84 dependent failures. Both checkouts also have **the same**
255 passes / one failure / two skips out of 258 offline Signal tests: `OP-12`
does not reject a production-tree destination when the entire repository lives
under an allowed temporary root. Its old application-version assertion is also
incompatible with the accepted base. No new failure names were introduced. These
are existing compatibility/guard issues, not silently reported as passed; no
Signal implementation, threshold, snapshot, email or monitor was changed.

Remaining HIGH scientific limitations (not newly introduced implementation
defects): survey-design uncertainty is not qualified; rotating-panel person-months
are not independent workers; exposure is not randomly assigned and no confounder
treatment establishes AI causality. No naive IID errors, intervals or p-values.

Existing out-of-scope HIGH operational concern: the offline Signal path guard
admits repository production paths when the repository is itself inside a
temporary directory. Only path validation was tested, not an actual production
write. This reproduces on the accepted base and should be corrected in a separate
Signal isolation task; it is not a Phase 3.5 regression or authorization to change
Signal here. The new expansion CLI independently rejects in-repository outputs
outside its ignored research-generated directory.

Remaining MEDIUM limitations: closed many-to-many/wildcard recovery deferred;
common coverage stays 47.80%; balanced-panel selection favors larger/stabler
occupations; exposure constructs are fixed historical vintages; public earnings
breaks and population controls constrain comparisons; no stable industry bridge;
no real-time-vintage reconstruction or occupational hiring. Some legacy monitor
tests hard-code historical feature commits/dates and need separate review if
incompatible with this accepted base; this task does not modify them.

**Final evidence decision: EXPANDED SAMPLE IS MATERIAL BUT RESULT-SENSITIVE.**
The expanded layer adds traceable descriptive coverage, but Academic sensitivity
and common-sample coverage prevent replacing the strict benchmark. Do not claim
AI caused any employment outcome. No causal/scenario or production phase is
authorized by this result.
