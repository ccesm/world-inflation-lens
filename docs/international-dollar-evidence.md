# International Dollar evidence expansion

Feature branch: `codex/international-dollar-evidence`, starting at
`494ae75208ec5b3da249f9ed185ad43f7be62cab` on `codex/v1-dual-dollar-architecture`.
Production baseline: `f6ca94cfdc039e18b856a6a334980102fdc0e1ec`.
This is feature work, not a production release. Package version remains 1.0.0.

## Release blockers carried forward

These findings remain tracked for the final combined release. The new lazy research
route required download-failure recovery, addressing F1 in the same code. F2–F4
remain outstanding and outside this feature’s focus.

- **F1 — addressed in this feature:** failed deferred downloads now show a bilingual fallback while preserving navigation. Six production-browser cases cover InternationalDollar, SectionLanding and ExternalShocks in both languages, including Home navigation and successful reload after the interruption is removed. This directly supports the new lazy routes; it is not a general cleanup pass.
- **F2:** Drivers research context can remain stale after an in-page topic change.
- **F3:** External Shocks still describes the available derived breakeven proxy as unintegrated.
- **F4:** a pre-existing Drivers `replaceState` / router-state edge case can leave the chart inconsistent with its URL.

## Source-selection gate

The following gate was recorded before ingestion implementation on October 2, 2026.
Only official institutional sources were accepted; live machine access was tested.

| Candidate | Decision | Basis and scope |
| --- | --- | --- |
| IMF COFER | INTEGRATE NOW | Official unauthenticated SDMX CSV, IMF.STA:COFER 7.0.1. Quarterly world currency shares and imputed share. Use the revised all-FX-reserves denominator; no legacy/new splice. |
| Treasury TIC | INTEGRATE NOW | Official tab-delimited SLT Table 3, monthly holdings columns in USD millions, 2020 onward. Total, Japan, mainland China, UK and foreign official subset. Table 5 is a rounded recent cross-check only. |
| BIS Global Liquidity Indicators | INTEGRATE NOW | Official SDMX CSV. USD credit to non-bank borrowers outside the US, total, bank loans and international debt securities. Quarterly, USD millions. |
| Existing Federal Reserve / IMF stablecoin publications | MANUAL REVIEW | Retain the reviewed Digital Money facts; no invented continuously automated market time series. |
| Legacy allocated-only COFER vintages | DEFER | Current IMF methodology back-revises history; a separate historical-vintage product is needed before any like-for-like vintage comparison. |
| TIC transaction/valuation flows and extra holder series | DEFER | Holdings are the direct scope. Flow collection has a February 2023 change and must not be inferred from changes in holdings. |
| Separate BIS debt-securities dataset | DEFER | GLI already supplies the required securities component; adding a second product would introduce overlapping scope. |
| Trade/commodity invoicing, gold and alternative reserve assets | DEFER | No direct dataset integrated in this phase; retain explicit planned coverage. |
| Scraped presentation charts / third-party mirrors | REJECT | Official downloadable products exist; fragile HTML charts and unverifiable mirrors are unnecessary. |

The IMF changed COFER methodology beginning with 2025Q3, released in December
2025, with revisions back to 2000Q1. Shares now cover world foreign-exchange
reserves including IMF imputations. They are **not** the legacy shares of reported
allocated reserves, all central-bank assets, or global wealth. Monetary gold is
outside the FX-reserve denominator. The imputed fraction is shown separately.

Official starting points: [IMF COFER](https://data.imf.org/en/Datasets/COFER),
[IMF methodology](https://www.imf.org/-/media/files/publications/tnm/2025/english/tnmea2025014.pdf),
[Treasury TIC securities holdings](https://home.treasury.gov/data/treasury-international-capital-tic-system-home-page/tic-forms-instructions/securities-b-portfolio-holdings-of-us-and-foreign-securities),
[BIS GLI](https://data.bis.org/topics/GLI).

## Accepted products and reproducibility

All three adapters use official machine-readable downloads, with no API key or presentation-HTML scraping. A successful endpoint test establishes present technical feasibility, not a service guarantee. Network failures, changed schemas, definitions or units stop promotion and preserve the prior complete snapshot bundle.

### IMF COFER

Publisher: IMF Statistics Department. Product: **Currency Composition of Official Foreign Exchange Reserves**, `IMF.STA,COFER,7.0.1`. The adapter requests world (`G001`) quarterly (`Q`) percentage shares (`SHRO_PT`, `UNIT=PT`, scale zero), with currency-composition indicator `AFXRA` and separate imputation indicator `TFXRA_IMP`.

The exact download URL, source dataflow, currency category, units, definition, denominator, methodology URL, copyright/attribution, release/update timestamps, retrieval timestamp and raw SHA-256 are preserved in `reserve-composition.json`. The query is defined in `scripts/lib/international-cofer.mjs`; it asks for history from 2000Q1. `AFXRA.CI_T` is checked against 100 as a denominator guard and is not exposed as a new economic series.

Integrated currencies: USD, EUR, CNY, JPY, GBP, AUD, CAD, CHF and other currencies. USD/EUR/JPY/GBP/CHF/other start in 2000Q1; CNY starts in 2016Q4 and AUD/CAD in 2012Q4. The separate imputed-share series begins in 2025Q3. Earlier unavailable categories are not filled with zeros. “Other” changes composition when a currency becomes separately reported. The imputed fraction is a coverage qualification within reserves, not a currency category to add to currency shares.

The accepted snapshot ends at **2026Q2**, with USD share **56.704761505127%**. Both IMF `PUBLICATION_DATE` and `UPDATE_DATE` are **2026-09-30T13:00:00Z**. These are preserved independently from retrieval. Quarterly observations retain their source quarter. The internal `YYYY-01/04/07/10` storage anchor does not assert a monthly observation or a publication on the quarter's first day.

The current IMF method includes imputations in world FX reserves; the legacy allocated-only ratio requested as an initial candidate would have the wrong denominator for this product. The site explains this change prominently, excludes monetary gold, SDRs and the IMF reserve position, and does not compare current shares with a spliced legacy vintage. Exchange rates and valuation can change shares without proving purchases or motives. The current endpoint supplies revised history; complete original-release vintage reconstruction was not verified. Source use follows the [IMF copyright and terms](https://www.imf.org/en/about/copyright-and-terms), with IMF attribution and retrieval/source links in exports.

### U.S. Treasury TIC

Publisher: U.S. Department of the Treasury. Product: **Treasury International Capital, SLT Table 3 — U.S. Treasury Securities Held by Foreign Residents**. Stable official download: [slt_table3.txt](https://ticdata.treasury.gov/resource-center/data-chart-center/tic/Documents/slt_table3.txt). The accepted field is `for_treas_pos`, in **USD millions**, monthly end-period holdings. It is not purchases, sales, net flows, or a percentage.

The five selected holder codes are Grand Total `99996`, Japan `42609`, China Mainland `41408`, United Kingdom `13005`, and Foreign Official `99990`. Holdings are reported by holder/custody geography; they do not consistently identify ultimate beneficial owners. The official subtotal is already within the foreign total. No inferred private series, country ranking narrative or country-motive estimate is created.

Coverage: **January 2020–July 2026**, 79 observations per series. Total foreign holdings in July are **9,248,126 million USD**. The source's HTTP Last-Modified is **2026-09-16T20:02:03Z**. This is explicitly a file-update time, not a guaranteed statistical release timestamp; a missing header remains unknown. [Treasury's release schedule and revision notes](https://home.treasury.gov/data/treasury-international-capital-tic-system/release-dates-of-tic-data) describe monthly releases about six weeks after observation, at 4pm Eastern. January/April/July/October releases generally revise the preceding year; other releases generally revise three preceding months, with larger revisions possible.

The source table checks long-term plus short-term positions against total Treasury holdings with tolerance of one source unit. Selected subsets may not exceed the total. Publication HTML, recent rounded Table 5 values, legacy tables and transaction columns are not ingestion inputs. A historical position change is not a flow: valuation and reclassification also matter. The [Federal Reserve account of expanded SLT reporting](https://www.federalreserve.gov/econres/notes/feds-notes/measuring-u-s-cross-border-securities-flows-out-with-the-old-in-with-the-new-20251015.html) explains the different transaction collection; flows remain a separate research task. Older holdings tables are not silently spliced. Attribution names Treasury TIC Table 3; the Treasury legal link is included in snapshot metadata.

### BIS Global Liquidity Indicators

Publisher: Bank for International Settlements. Product: **Global liquidity indicators**, dataflow `BIS,WS_GLI,1.0`. All three CSVs use `https://stats.bis.org/api/v2/data/dataflow/BIS/WS_GLI/1.0/{key}?format=csv`:

| Project ID | Official key | Measure |
| --- | --- | --- |
| BIS_USD_TOTAL | Q.USD.3P.N.A.I.B.USD | USD credit, bank loans plus international debt securities |
| BIS_USD_LOANS | Q.USD.3P.N.B.I.G.USD | USD bank loans |
| BIS_USD_SECURITIES | Q.USD.3P.N.A.I.D.USD | USD international debt securities |

The borrower sector is non-banks, including non-bank financial institutions. Geography is **borrowers resident outside the United States**, not borrower nationality. USD is currency denomination, not a conversion that makes all borrowing dollar borrowing. These quarterly, non-seasonally-adjusted outstanding stocks use `UNIT_MEASURE=USD` and `UNIT_MULT=6`: **USD millions**. They are not domestic M2, an all-dollar-assets total, or a complete measure of Eurodollars.

Coverage: **2000Q1–2026Q1**, 105 quarters. Latest total is **14,747,653.746 million USD**; loans **6,683,005.559**, securities **8,064,648.187**. The components reconcile to total with a 0.002-million tolerance for published rounding. Raw source flags and any pre-break observations are retained. Bank estimates address reporting gaps; securities apply BIS coverage conventions, including the specified Cayman Islands exclusion for US-based issuers. See [BIS methodology](https://www.bis.org/statistics/gli/gli_methodology.pdf).

The selected CSV does not supply a publisher release/update timestamp. Both are visibly unknown; HTTP response Date and retrieval are not substituted. The portal's broader release calendar is linked for research but is not scraped into each series as if it were exact provenance. Current history can be revised; no complete vintage API was established. The [BIS statistical terms](https://data.bis.org/help/legal) are linked, BIS is credited in the UI/exports, and Chinese labels are explicitly identified as unofficial translations. Arithmetic changes in published levels are not BIS exchange-rate- and break-adjusted growth rates.

## Snapshot and ingestion boundaries

`data/international-dollar/` contains three independent economic snapshots, a mechanically generated three-observation `summary.json`, and a separate `revisions.json`. Source metadata live beside each dataset's observations rather than in a disconnected duplicate metadata file. The source fixtures under `scripts/fixtures/international-dollar/` preserve compressed original responses and TIC headers for deterministic tests. Hashes cover the exact downloaded bytes.

`prepareInternational` downloads/parses candidate datasets before any promotion. The existing refresh transaction adds all three, summary and revision ledger to the same validated bundle as existing automatic datasets. Failure before replacement writes no economic files; write/build failure restores all old files. The existing safe status outcome can still report the failure. The workflow's only change is adding this directory to the future validated-snapshot commit list. Its schedule, main trigger, deployment and notification sequence are unchanged; no workflow, production email or deployment was invoked for this feature.

V0.13 receives 18 additive registry entries. Existing metadata entries retain identical values and meanings. The only freshness extension permits an explicitly registered source to have an unknown publisher timestamp while still assessing observation age. Unregistered and existing series keep the former missing-metadata behavior. Sources, Workspace and Updates load on demand so international history/revision ledgers do not become initial Home dependencies.

## Validation and revision policy

Common checks cover schema/required fields, series identity, source product/version, units/scale, frequency, geography, definition/denominator, chronological order, duplicates, expected historical starts, complete period sequences, nonfinite values, missing markers, future periods and required categories. Missing observations remain null; missing periods are not interpolated. Additions, filled values, revised values and withdrawals remain distinguishable.

- COFER additionally checks world scope, nine category definitions, category start dates, total-share denominator 100, category sum within 0.02 percentage points, current release consistency, timestamps and methodology marker. All historical value withdrawals and revisions exceeding five percentage points require manual review.
- TIC validates exact position fields, holder identities, unit header, contiguous months, component accounting, nonnegative holdings and subset bounds. Latest coverage may not regress. Revisions larger than both USD 1 billion and 10% of the prior value require review; a move from zero exceeding USD 1 billion also requires review. Shared withdrawal limits protect against broad removals.
- BIS checks every SDMX dimension, source title, multiplier, permitted flags, value/status agreement, equal component periods and total identity. Withdrawals and historical changes exceeding 5% require review, as does a nonzero revision from zero. Changes to flags or pre-break metadata count as revisions even when the level is unchanged.

These thresholds are ingestion safeguards, not economic signals. A blocked candidate must be compared with official definitions/releases, fixtures/tests updated where warranted, and accepted in a reviewed feature change. They are not bypassed automatically. Do not “fix” a rejected source by changing its units, filling its gaps or deleting prior valid snapshots.

Each accepted refresh records international changes with before/after values and metadata in a bounded 120-run ledger, and adds summaries to the established global ledger. The detailed UI shows recent international checks and links the existing update workflow. Initial import establishes the project's baseline; it is not evidence that earlier source values were never revised. Git preserves accepted project vintages from this import onward, not complete past publisher vintages. Rolling back the complete accepted snapshot bundle, including summary and ledgers, restores a consistent state.

## Freshness and date semantics

| Source | Observation | Source update/release | Maintenance | Conservative freshness limit |
| --- | --- | --- | --- | --- |
| COFER | Quarter-end currency composition; quarter anchor retained separately | IMF CSV update/publication attributes | Automatic official-source check | 190 days after quarter end |
| TIC | End-month Treasury holdings | Official file Last-Modified; release unknown | Automatic official-source check | 95 days after month end |
| BIS GLI | End-quarter credit outstanding | Unknown in selected CSV | Automatic official-source check | 210 days after quarter end |

These limits allow the source's reporting lag plus a conservative distribution buffer. They are disclosed project heuristics, not promised official deadlines or evidence that the publisher has released newer data. No daily H.15 model is applied. A recent successful unchanged check may display `CHECKED_NO_NEW_RELEASE`; a failed check displays retained-snapshot failure context. Source update, observation and retrieval remain distinct. Data Health exposes all 18 series, coverage, frequency, publisher, maintenance, limitations and status. No fabricated release day or interpolated monthly observation is introduced.

## Research experience and coverage

The lazy route `#/research/international-dollar` fits the existing Research hierarchy and is reachable from Home's compact summary, Dollar, Research, Research Map and International Dollar Role. The six primary navigation items remain unchanged. Focus links resolve reserve, Treasury, financing and health sections.

The page follows research question → function definitions → evidence matrix → reserves → Treasury/safe assets → global credit → payments/digital money → trade/commodity invoicing → alternatives → domestic/international bridges → gaps → source health/revisions. It remains **partial evidence** overall. Three independent charts offer series/range/period selection, tables, exact-source CSV and source/status disclosures. Percent charts use 0–100; level charts start at zero. Responsive SVG coordinates preserve readable labels at 320px; long tables scroll inside explicit regions. Workspace retains its disclosed adaptive axes.

| Function | Evidence | Frequency / maintenance | Limitation |
| --- | --- | --- | --- |
| Reserve currency | Direct: IMF COFER | Quarterly / automatic | Revised denominator, imputations, valuation; excludes gold |
| Treasury / safe assets | Direct: Treasury TIC | Monthly / automatic | Custody geography and positions do not establish motive/flows |
| Global credit | Direct: BIS GLI | Quarterly / automatic | USD non-bank borrower residence and BIS coverage conventions |
| Trade invoicing | Planned | No observation | No direct contract-currency evidence |
| Commodity invoicing | Planned | No observation | Quotation does not establish settlement currency |
| Payments | Partial: existing institutional publications | Publication / manual review | Does not measure actual cross-border use |
| Stablecoins | Partial: existing Digital Money | Publication / manual review | Not a market time series, net Treasury demand or deposit migration |
| Alternative reserve assets | Planned | No observation | No direct gold/alternative reserve composition integrated |

Digital Money is linked and its qualifiers preserved: stablecoin size is not M2; growth is not Federal Reserve money creation; issuer Treasury holdings are not all foreign Treasury demand; deposits are not measured migration. Publication facts are not inserted into Workspace as time-series points.

All 18 actual series join Workspace search, favorites, range selection, inspection, table and CSV. CSV distinguishes source quarter from storage anchor and carries denominator, original units, displayed measure, source key, update/release/retrieval, flags and attribution. Existing eligible level-series YoY uses exact prior-year periods; reserve shares offer levels only. New derived displays are simple last-minus-first interval changes (percentage points for shares) and existing Workspace YoY of levels. No new composite, causal estimate, country-share proxy or imputed source value is produced.

Bridge variables are individually labeled: Treasury holdings, broad dollar exchange rate, financing yields and global credit have direct observations; stablecoin Treasury-demand estimates have partial publication evidence. The bridge explains possible financing channels without asserting that international use mechanically determines CPI. Research Architecture links COFER to reserves, TIC to Treasury demand and BIS to global financing; dedicated funding-cost/swap evidence remains planned.

## Signal Engine implications

Future separately specified research could use COFER currency shares and imputation coverage for **International Dollar Role**, BIS total/loans/securities for **Global Funding**, and TIC total/official/selected-holder positions for **Treasury Demand**. Source frequency, release lag, revisions and custody/valuation caveats must travel with those inputs. No live signals, probabilities, score or trading recommendation is implemented here.

## Acceptance and release scope

Validation passed against the local production build. See the [machine-readable acceptance record](international-dollar-acceptance.json) and results below. The package/public version remains 1.0.0 from the starting branch; this feature does not promote or deploy a version. Recommend **V1.1.0** for the additive international research experience if V1.0 ships separately. If both are first shipped together, V1.0.0 can describe the combined initial release only after the outstanding release blockers are resolved and release acceptance is rerun. Version numbering never authorizes a merge.

### Final validation results

- `npm run build`: PASS. Main JavaScript **747,623 bytes / 215,752 gzip**, compared with **799,994 / 228,988** at the starting V1.0 checkpoint. The existing large domestic-data chunk warning remains; it is not a new runtime failure.
- `npm run verify`: PASS, including official source fixtures and adversarial schema/unit/quarter/category/denominator/missing-value/revision cases, metadata compatibility, source-aware freshness, CSV, bilingual research roles, full refresh rollback, protected calculations, CBO and notification tests. No real email is sent.
- Chrome on the local GitHub Pages production base path: **264 route/display checks** (22 routes × 320/390/1280px × English/Chinese × light/dark), **12 Home checks**, **18 bilingual behavior checks**, and separate mocked status/failure/notification fixtures. No console/runtime errors or failed local assets on normal paths.
- International-specific acceptance: **12 display combinations**, **34 full CSV value/provenance checks** (17 chart series × two languages), range exports/tables, imputed-series Workspace search/favorite retention, three Workspace level exports in each language, exact-period BIS YoY, source health and deep-link/navigation checks. The 18th series is the separately presented imputation coverage measure.
- Mobile: no horizontal page overflow at 320 or 390px. Coverage/data tables use bounded scrolling. SVG labels retain at least 11px effective size in measured tests. English/Chinese and light/dark screenshots were captured; representative mobile charts were visually inspected. Chinese units are localized; original source definitions and CSV units remain attributed to their publishers.
- Failure recovery: six English/Chinese interrupted-download cases passed, including visible fallback, working Home navigation and successful reload once downloads are available. This addresses inherited F1 through the new feature’s shared lazy-route boundary.
- Fresh live read-only recheck of IMF/Treasury/BIS passed on **2026-10-03 00:46:36 UTC (October 2 Pacific)**: zero observation changes across all 18 series. It did not replace snapshots, invoke the production workflow or send notifications.
- Protected snapshots and original calculations/status/date/notification utilities are byte-identical to the starting commit. Existing registry entries are deep-equal in the tests. The documented additive integration changes are intentional.

### Performance and Home size

A cold Chrome comparison of separately served starting/feature builds measured **635,566 → 581,886 initial encoded JS+CSS bytes**, a reduction of **53,680 bytes (8.45%)**. Measurement uses the same local server/toolchain; it is a payload-size comparison, not a latency guarantee. The new route component is **10,134 bytes / 3,304 gzip**; its deferred data/contract chunk is **116,022 / 23,196**; bilingual copy is **13,774 / 6,481**. The international history is absent from initial Home requests. Detailed Sources, Workspace and Updates are also deferred. The three latest observations and their provenance are the only international snapshot content needed by Home.

At 390px, first domestic evidence remains **y=1,301px English / 1,254px Chinese**, exactly matching the starting branch. Total Home height is **7,263 / 6,755px**, compared with **6,549 / 6,066px**; the added compact summary does not push first evidence below the framework. Full international charts and history remain on the research route.

**READY FOR FEATURE REVIEW.** F2, F3 and F4 still block a final combined release; F1's repair requires review with this feature. Neither feature readiness nor the unchanged package version authorizes merging or deploying. The existing V1.0 release history remains intact, with an appended feature note.
