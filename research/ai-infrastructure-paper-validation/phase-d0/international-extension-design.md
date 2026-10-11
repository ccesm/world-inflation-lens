# Minimal international compatibility

Do not implement a global registry, plug-in framework, new API or country-specific model now. The separate AI Macro display contract can preserve native definitions while accepting a few optional fields: countryCode, regionCode, geographicScope, native currency or currencyPair, quoteConvention, frequency, seasonalAdjustment, measureType, period/periodEnd, source institution, release/retrieval/review clocks, revision status and evidence class. IDs are namespaced by module/series/geography; source version and hash distinguish vintages. Existing C2 seriesId remains a trace reference, never silently renamed in research.

For the initial US snapshot, use US country identity where supported; state abbreviations identify state sample; Henry Hub is a benchmark location, not a state retail market. Percent/index/physical quantities need no invented currency. Currency follows monetary-unit definition (including chained 2017 USD), not geography alone. Preserve native currency; no automatic FX conversion or aggregation.

| Future Japan field | Compatibility requirement |
|---|---|
| USD/JPY | Currency pair and quote direction, observation date; no automatic inversion or rate/percent confusion |
| BOJ policy rate | Rate regime/definition and percentage-point changes; not a pure real yield |
| JGB yields | Maturity and rate basis, negative values, missing trading dates |
| Exports/imports | Native nominal currency, adjustment, flow period and gross/net definition |
| Industrial production | Index base, original adjustment and revision policy |
| Current account | Flow versus annualized rate, balance sign, reporting period |
| NIIP | End-period stock and valuation changes; stock change is not capital flow |
| Japan holdings of US Treasuries | TIC custodial geography, nominal stock, no inferred beneficial ownership or motive |

These are semantic design checks, not verified Japan sources or collected observations. Future Gold, Capital Flows, Global Inflation or Commodity modules can reuse the small visual/source contract only after independent source/definition qualification. Do not force a common frequency, normalized scale, country ranking, inferred AI measure or composite score. A different methodology belongs to a separately reviewed module. Add only fields actually needed when that research is authorized.
