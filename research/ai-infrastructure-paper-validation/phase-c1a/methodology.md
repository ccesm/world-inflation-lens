# C1A reproducibility and dictionary

Explicit clock2026-10-09; outcomes2015-01–2025-12; exactC0base recorded in baseline-lock. This source/measurement audit runs no econometric model. E1 grades authenticate narrow primary observations; four inherited energy mechanisms remain E0. Evidence dimensions are separated in evidence-assessment.json. Software validity is not scientific identification.

## Dictionary

- `salesMWh`: EIA retail sector sales, monthly flow; not nameplate MW, utility peak MW or AI consumption.
- `revenueThousandUSD`: native nominal thousands of USD, monthly retail revenue; no deflation.
- `priceCentsPerKWh`: published realized average, rounded; independently reconcile to100×thousandUSD/MWh. Not a contractual tariff, individual customer rate or CPI electricity index.
- `customers`: native counts; no allocation of load by average customer size.
- `dataStatus`: source's Final/Preliminary, retained even for complete years.
- `value` in weather: complete daily weighted HDD/CDD summed by calendar month, Fahrenheit degree-days, no normal subtraction or seasonal adjustment; native daily rounding retained. Missing any day producesnull, never zero-fill.
- Henry Hub `value`: published monthly spot benchmark USD/MMBtu; not utility procurement cost. No repeated national benchmark treated as independent local shocks.
- `energizationDate`: first electrical service requires explicit utility/regulator/issuer commissioning evidence; opening/serving-traffic/publication dates do not fill it.
- `countyFips/stateFips`: string identifiers preserving leading zero; county membership does not imply exclusive parcel/utility footprint. New Albany county remainsnull.
- `sourceHash`: original bytes' SHA-256. `locator`: exact worksheet/cell row or text date/column. Raw content identity is immutable; changed URL bytes require review.

No extra state-adjustment rows are added to published state aggregates. Utility sample extraction excludes adjustment entities and retains utility/state/sectors separately. Utility-specific retail scope and current2024territory membership cannot be backdated. BAs span service areas; no BA/state/utility equivalence asserted. Source and definition histories require future audit, not splicing.

## Commands

```sh
python3 research/ai-infrastructure-paper-validation/phase-c1a/test_phase_c1a.py
python3 research/ai-infrastructure-paper-validation/phase-c1a/build.py --check
python3 research/ai-infrastructure-paper-validation/phase-c1a/reproduce.py --controls
python3 research/ai-infrastructure-paper-validation/phase-c1a/extract.py --cache "$WIL_AI_ELECTRICITY_CACHE" --check
```

The execution's durable external cache is `~/Public/wil-ai-electricity-cache`; set WIL_AI_ELECTRICITY_CACHE to that location locally. No paths enter analytical identity. Full immutable workbooks/PDFs/ZIPs are not committed. Small official weather/gas/geographic text inputs are gzip archives with mtime0, so their original hashes and normalized values reparse offline. Frozen XLSX extracts plus locators are committed; full workbook reproduction additionally requires external raw objects. An independent openpyxl read-only audit checked all13,728selected state numeric cells against the stdlib extractor; no dependencies were added or source workbooks authored.

Operator-only `fetch_sources.py --source-id ID --cache EXTERNAL_DIR` retrieves only frozen official URLs, uses a descriptive User-Agent,1second separation,30second timeout,45MiB bound,3redirects, exact selected redirect hosts, no retries, and per-run403/429host blocking. It records Retry-After but does not automatically retry. New bytes are cached under a new hash with CHANGED_BYTES_REVIEW_REQUIRED, never promoted or used to overwrite frozen evidence. No crawler, workflow or scheduling is added.

## Identity and scope

`build.py --identity` hashes reports, registries, source selections, normalized inputs, raw-control fixtures and implementation. Own identity file, runtime validation receipt and download timestamps are excluded. Identical explicit inputs produce identical comparison bytes and content hash across processes. No clock or temp path enters them. Baseline lock checks all478inherited tracked bytes and rejects any Git change outside phase-c1a. A/B1/B2/C0 regressions run in appropriate clean frozen worktrees where inherited Git guards prohibit descendant files.

Donor states are acquisition candidates, not matched controls. All validated event windows are null. Announcement-relative months are diagnostic availability bounds only. No pretrend test, causal estimate, synthetic AI share, national inflation forecast or production write. Keep independent review of exposure timing, controls, power and economic interpretation separate from test success.
