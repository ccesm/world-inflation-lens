# Offline test fixtures

Small pinned **current-vintage excerpts** of official BLS/Census source responses, captured during Phase 1 source research. They are test inputs, not contemporaneous historical publisher vintages and not substitutes for the full accepted archive.

* `cps.json`, `ces.json`, `jolts.json`: official API response excerpts, three months (January–March 2025), preserving all requested source identifiers and official record structure.
* `current.xlsx`: Census current-question national response estimates, standard errors and date-table excerpts for cycles 202524–202525.
* `original.xlsx`: Census original-question national estimates, standard errors and date-table excerpts for cycles 202319–202320.

Workbooks were repackaged deterministically into minimal XLSX containers with original selected values, question wording and dates; the complete source workbook bytes are separately retained under `sources/raw/`. Repackaging identity is not original publisher artifact identity.

Tests construct isolated in-memory mutations of these fixtures to check schema changes, IDs, units, frequencies, calendars, period order/duplicates/gaps, missing values, age bounds, SA/NSA, denominators, provenance, source failures, vintage retention and exact-window arithmetic. Offline discovery does not run `live_integration.py`.
