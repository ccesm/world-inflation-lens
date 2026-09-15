# Inflation data

`drivers.json` contains seven monthly public-domain FRED snapshots: BLS food CPI (CPIUFDNS), energy CPI (CPIENGNS), shelter CPI (CUUR0000SAH1), average hourly earnings (CEU0500000003), EIA WTI oil price (MCOILWTICO), Federal Reserve effective federal funds rate (FEDFUNDS), and M2 (M2SL). Source metadata and original values are stored together. CPI, earnings and M2 year-on-year growth is computed on the frontend; interest rates and oil prices retain their original units. M2 is seasonally adjusted; the other series are unadjusted. Missing values and different release dates remain visible. Refresh with `scripts/import-drivers.mjs`; see the root README for instructions.

`worldbank.json` contains WDI FP.CPI.TOTL.ZG (annual consumer price inflation, %), 1960–2025. Each country has 66 year slots, with missing observations stored as null. Source metadata, attribution, UTC retrieval date, license and source update date are embedded. This annual series is separate from the monthly FRED CPI series below. Regenerate via `scripts/import-worldbank.mjs` using the documented inputs in the root README.

`fred.json` is the CPIAUCNS snapshot: BLS CPI-U via FRED, monthly, not seasonally adjusted, 1982–1984 = 100. It covers 1913-01 through 2026-08 and was retrieved 2026-09-13.

Public source table: https://fred.stlouisfed.org/data/CPIAUCNS

Source metadata is in the JSON. The source's missing 2025-10 observation is retained as `null`. Derived growth rates and purchasing power are computed by `src/utils/inflation.js`, not stored as independent observations. Future providers should follow the same explicit metadata convention.
