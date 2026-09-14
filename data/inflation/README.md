# Inflation data

`fred.json` is the CPIAUCNS snapshot: BLS CPI-U via FRED, monthly, not seasonally adjusted, 1982–1984 = 100. It covers 1913-01 through 2026-08 and was retrieved 2026-09-13.

Public source table: https://fred.stlouisfed.org/data/CPIAUCNS

Source metadata is in the JSON. The source's missing 2025-10 observation is retained as `null`. Derived growth rates and purchasing power are computed by `src/utils/inflation.js`, not stored as independent observations. Future providers should follow the same explicit metadata convention.
