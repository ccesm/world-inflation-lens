# Countries

`metadata.json` contains 217 World Bank countries/economies, excluding regional and income aggregates. English source names, Chinese display names, ISO2 and World Bank identifiers are retained.

`world.geo.json` contains Natural Earth v5.1.2 1:110m geometry (public domain), excluding Antarctica. Features join to metadata through WB/ISO codes; Natural Earth's Kosovo code KSV is explicitly mapped to World Bank XKX. Unmatched geometries remain unmapped. All statistical entities can be selected even when omitted from this simplified map.

Regenerate with `scripts/import-worldbank.mjs`; see the root README for public input URLs and coverage methodology.
