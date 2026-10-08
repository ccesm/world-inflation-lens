# Phase A: independent cash-flow reconstruction methodology

This directory is research only. It is never imported by the app. Research cutoff is October 8, 2026; observations are selected only if their SEC filing date is on or before that date. Data refer to exactly Microsoft, Amazon, Alphabet, Meta and Oracle.

## Financial definitions

Cash CapEx is the positive amount of cash purchases/additions of property and equipment from the consolidated GAAP statement of cash flows. Amazon uses `us-gaap:PaymentsToAcquireProductiveAssets`; the other four use `us-gaap:PaymentsToAcquirePropertyPlantAndEquipment`. OCF is `us-gaap:NetCashProvidedByUsedInOperatingActivities`, with its reported sign. These are consolidated-company financial flows, including non-AI spending. No AI allocation is attempted.

Finance lease asset additions (noncash), accrued PP&E, operating lease arrangements, finance lease principal payments, asset-sale proceeds/incentives and company-defined total/net capital investment are separate measures. None is silently added to or deducted from cash purchases. Lease cash costs classified in OCF remain inside GAAP OCF. Meta lease principal is retained as a separate supplemental metric.

OCF minus cash CapEx is a simplified coverage measure, not a full financing requirement or necessarily company-reported free cash flow. Amazon's FCF subtracts purchases net of sales/incentives; Meta's FCF also subtracts finance lease principal. Cash, securities, acquisitions, other investments, debt maturities, distributions, leases, customer financing and contractual commitments are needed for a full funding assessment.

## Captured primary-source selection

`sources/*-companyfacts.json.gz` are unmodified SEC companyfacts responses in lossless deterministic gzip. Raw and compressed SHA-256 hashes, source URLs and retrieval date are in `source-register.json`. No custom/secondary financial dataset is accepted. The SEC machine-native unit is USD; rendered statements commonly use USD millions. No scale inference from a figure is used.

The source-observation ledger retains exact start/end dates, value, USD unit, taxonomy item/label, accession, filing publication date and source URL. SEC `fy`, `fp` and `frame` can describe the filing or a coarse calendar convention, so they are not used as period identifiers. Only explicit reporting start/end dates identify a fact.

**Primary vintage:** first-reported 10-K/10-Q fact for the exact fiscal-YTD context, breaking ties deterministically by filing date and accession. This avoids combining later annual comparative revisions with unrevised early quarterly contexts. Later changes are retained in `reporting-revisions.csv`, with a direct annual sensitivity in `vintage-sensitivity.csv`; they never overwrite original historical contexts. First reporting does not prove there was no within-year accounting reclassification; Q4 is identified as a fiscal annual residual.

Native line-item labels were checked in representative official statements/releases. Per-vintage original filing HTML was not captured for all historical observations. Therefore `original_line_item_label` is null in the SEC-derived ledgers and the independently checked representative label has its own field. A taxonomy label is not passed off as a verified original rendered label. This is an explicit source-traceability limitation.

## Standalone quarters and calendar alignment

For each fiscal year, select cumulative Q1, six-month, nine-month and full-year facts sharing the fiscal start date. Then Q1=Q1 YTD; Q2=H1-Q1; Q3=9M-H1; Q4=FY-9M. A missing endpoint or prerequisite produces a missing quarter, never a zero. The previous value/accession/date is retained for every difference. Summing overlapping cumulative cash-flow values is forbidden.

Microsoft's fiscal year starts July 1. Its March/June/September/December standalone quarters align exactly to calendar quarters, and summing four exact quarters reconstructs January-December. Amazon, Alphabet and Meta start January 1; four quarters sum to their reported fiscal/calendar annual total.

Oracle starts June 1, with quarters ending February, May, August and November. Assigning a fiscal quarter to the calendar quarter containing its end yields December of the previous year through November of the named year. This is explicitly a **quarter-end proxy**, not an exact January-December observation. The exact calendar fields remain null. No monthly proration, interpolation, forward filling, assumed uniform spending or manufactured December flow is used. The five-company aggregate is correspondingly a four-exact-plus-Oracle-proxy diagnostic. No alternative alignment is selected to match the paper.

All five selected companies have monthly/quarterly boundaries at month ends in these captured contexts. There is no 52/53-week adjustment in this sample. Leap-year February is handled with the actual date. The code would leave an unexpected boundary unmatched, rather than treating it as the expected quarter.

Every complete fiscal total is checked against the sum of its derived quarters. This reconciliation is a useful accounting check, but algebraic telescoping alone does not prove original labels, a common revision vintage, or exact calendar alignment. Independent standalone contexts provide an additional check where the company reports them. Two Amazon OCF discrepancies of USD 1 million (2019 and 2020 Q2) are retained at disclosure precision, not silently corrected.

## Aggregation and missingness

The five-company aggregate requires five complete company pairs. CapEx/OCF is undefined when the denominator is missing or zero. Missing CSV numeric cells are blank (JSON equivalents are null), never zero or the string `null`. Exact Oracle and exact five-company calendar-year fields stay missing even when the proxy is complete. The six annual historical rows exclude 2026.

All source and derived dollar values are USD; charts and comparison tables divide by 1e9 to display USD billions. The annual ratios are ratios of totals, not averages of company ratios. YoY changes use only consecutive complete proxy years. Cash is not assumed transferable between companies.

## Paper isolation and reconciliation

`build.py` finishes the independent source/quarter/annual/aggregate datasets before `compare.py` reads the separate paper references. The latter writes only `paper-comparison.csv`. A mutation test multiplies the paper inputs and verifies that independent outputs do not change.

Signed difference = independent minus paper; absolute difference = its magnitude; percentage difference = signed difference / paper x 100. Historical comparisons are diagnostic because Oracle's true calendar bridge is unavailable. Differences larger than a paper's USD 0.05 billion one-decimal rounding band cannot be explained by rounding alone. A 1% relative gap is an investigation cue, not a scoring rule or acceptance threshold. We do not calibrate data to reduce gaps.

2026 observed periods, company guidance and estimates are separated. Four companies have January-June facts; Oracle's available quarter-end bucket covers December 2025-August 2026. Verified Microsoft and Meta guidance use different lease definitions. Other numerical guidance remains missing when no retrievable primary transcript establishes it. No independent full-year estimate or common-period five-company 2026 chart is produced. Paper 2026 references stay in the comparison file with all independent difference fields null.

## Reproduce offline

Use Python 3.12+ (the recorded run also passed the standard-library data tests on system Python 3.9.6):

```sh
python3 research/ai-infrastructure-paper-validation/phase-a/build.py
python3 research/ai-infrastructure-paper-validation/phase-a/compare.py
python3 research/ai-infrastructure-paper-validation/phase-a/sensitivity.py
python3 research/ai-infrastructure-paper-validation/phase-a/register_supplemental.py
python3 research/ai-infrastructure-paper-validation/phase-a/test_phase_a.py
```

Charts use Matplotlib 3.11.2 with Python 3.13.1 in this run; install `requirements-charts.txt` into a research environment and run `charts.py`. The repository app dependencies are unchanged. Outputs are PNG and SVG, not website assets. SVG metadata/date and hash salt are fixed. Source, unit, cutoff and proxy labels are visible on both charts.

Full application acceptance: `npm ci`, `npm run build`, then `npm run verify`. The initial verify attempt lacked `dist/index.html`; after building, the entire suite passed. No production code or tests were altered to achieve the pass.
