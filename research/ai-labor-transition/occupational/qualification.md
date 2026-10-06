# Phase 2 occupational crosswalk qualification

Qualified on October 5, 2026, from Phase 1 commit `289f93d99c378e0f8e7f2819d4820a82a0b12672`, on `codex/occupational-ai-exposure-crosswalk`. Research-only; no production publication or causal labor attribution.

## Inputs and coverage

All 25 pinned input files were retrieved successfully in an isolated live integration run. Exact bytes, source versions and license evidence were checked. All 12 deterministic views passed independent reconstruction from the pinned raw archive; no production paths were written.

The canonical SOC 2018 backbone contains 1,447 hierarchy records, including 867 detailed occupations. O*NET 31.0 / O*NET-SOC 2019 supplies 1,016 occupations and 18,838 task statements across 923 occupations. Direct current crosswalk: 791 one-to-one and 225 many-to-one edges. Legacy 2010→2019 crosswalk: 857 one-to-one, 58 one-to-many, 209 many-to-one and 40 many-to-many edges.

Academic capability records reach 798/867 detailed SOC occupations (92.04%). Microsoft platform-derived applicability matches 773/867 (89.16%); seven broad records and five unmatched reporting hybrids are retained separately. Anthropic's unambiguous task context reaches 574/867 (66.21%), without constructing occupational usage shares. Employment-weighted coverage is unavailable because no employment-weight vintage is accepted.

The 701 unambiguous detailed occupations in the academic-human-Beta / Microsoft comparison have Spearman correlation 0.7563482656125381. There are 289 same-quintile cases and 102 differences of at least two native quintiles. Source measures are never averaged. These constructs differ and the comparison does not validate a labor-market prediction.

## Tests and reproducibility

* Phase 2: **77 tests passed**, zero failures, zero skipped; 73.270 seconds in the final run.
* Phase 1 regression: **71 tests passed**, zero failures, zero skipped; 8.686 seconds. Four existing accepted providers validated.
* Total offline tests: **148 passed**. Ten separate material-output mutation subprobes were rejected; these are included within the Phase 2 test methods and are not counted as ten extra tests. A false manifest also failed validation.
* Fixtures assert literal publisher anchors and original task text, independently reconcile all six academic measures and all 785 Microsoft scores, and exercise missing values, categories/scales, all mapping multiplicities, licenses, version mismatch, coverage, deterministic normalization and failure isolation.
* Two fresh processes reconstructed all 12 views identically. SHA-256 of the canonical artifact-hash map: `838a31f539e4cf44f952146197da343114a3ccac6f57df28a0b24ba5d57ed4b7`.
* Output hashes describe uncompressed canonical content. Raw hashes remain separate; receipt and execution timestamps do not enter deterministic content.
* Live source checks are opt-in and excluded from offline test discovery.

Commands and input attribution are documented in [the research README](../README.md), [source attribution](sources/ATTRIBUTION.md) and [the methodology report](../../../docs/AI_OCCUPATIONAL_EXPOSURE_CROSSWALK.md).

## Build and isolation

`npm run build` and `npm run verify` passed. The build retained the existing large-chunk advisory. Phase 2 does not enter the Home bundle or production assets. Phase 2 filenames and schema markers were absent from `dist`.

Tracked changes are confined to this research area and documentation. Application version remains 1.1.0. React, routes, public data, accepted production economic snapshots, workflows, Signal factors/conclusions/projections/email and fiscal methodology remain unchanged. All 22 pre-existing Phase 1 normalized files and all five pre-existing untracked research basis documents retained their original SHA-256 hashes. The latter documents are not part of this feature commit.

## Boundaries and remaining prerequisites

SOC/O*NET health is CURRENT for the selected fixed vintage. Academic, Microsoft and Anthropic coverage is PARTIAL. CURRENT does not mean historical capability measurements describe current AI systems. Deferred ILO/IMF data and uncleared datasets remain unintegrated, with explicit health/methodology metadata.

No implementation HIGH or MEDIUM issue was identified by these checks. Research limitations remain: partial occupation coverage, Microsoft mixed reporting levels, historical task changes, unknown exact Anthropic database release/date bounds, platform selection bias, no occupation-specific automation/augmentation rate, and absent employment weights. Future source-body changes require review instead of silent repinning.

Phase 3 must first accept a licensed, versioned occupational employment/wage dataset with a historical pre-AI baseline; verify reporting-level joins and CPS/SOC concordance where used; disclose taxonomy/method breaks and weighted coverage; and predeclare source-specific exposure groups and confounder controls. It must preserve ambiguous relations and separate correlation from causality.

**READY FOR OBSERVED LABOR OUTCOMES BY AI EXPOSURE** means ready for that controlled outcome-data and join phase, not ready to publish causal results.
