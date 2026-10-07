# AI CapEx accounting bridge

Phase 1, 2026-10-06. Read with [model matrix](AI_CAPEX_MONETIZATION_MODEL_MATRIX.md). All current numeric bridges below concern calendar 2026 Q2. USD millions unless stated otherwise. No cross-company AI return is calculated.

## Capital taxonomy

| Item | Accounting timing / analytical meaning | Prohibited substitution |
|---|---|---|
| Cash PP&E purchases | Investing cash outflow, potentially paying prior-period accrued purchases | Not automatically PP&E additions or AI investment |
| Net cash PP&E | Gross purchases less explicitly specified disposal proceeds/incentives | Do not compare with gross under the same label |
| PP&E additions | Recognized capital assets, potentially accrued/noncash acquisitions | Not necessarily current cash paid |
| Finance-lease additions | Asset/lease-liability recognition, normally noncash at inception | Not principal cash repayments |
| Finance-lease principal | Cash settlement of lease obligation from current/prior cohorts | Do not add to already lease-inclusive native CapEx twice |
| Finance-lease interest | Cash/P&L financing cost with company cash-flow classification | Not principal or asset additions |
| Operating lease ROU additions | Right-of-use asset recognition | Not server ownership or current cash CapEx |
| Operating lease cash | Cash may already be in CFO | Do not subtract a second time from CFO-based FCF |
| Uncommenced lease / construction commitment | Future contractual exposure; timing and cancellation terms matter | Not current CapEx, capacity in service or realized cash flow |
| Land/buildings/power | Long-lived infrastructure; land not depreciated | Not short-lived compute |
| Servers/CPU/GPU/network | Asset category, potentially serving AI and conventional demand | No AI-only inference from equipment name |
| Equity stake / acquisition | Investing exposure, sometimes strategic | Not infrastructure PP&E; valuation gains not operating AI return |

Store all native lines before deriving a cash bridge. Do not normalize four native CapEx headlines into one definition without a separate reconciled common view.

## Microsoft

Quarterly statements: cash additions to PP&E **35,802**, CFO **55,441**. Research/company cash FCF convention is `55,441 − 35,802 = 19,639`. A financing-lease addition is not additional cash already spent. Lease principal and operating lease cash require their own lines; no blanket assumption of zero when not qualified.

CFO call: reported CapEx **about 41,000**, finance leases **about 5,600**, cash PP&E **about 35,800**. These reported components sum to about 41,400, not 41,000. Preserve the disclosures and an **unresolved reconciliation residual**, not a fabricated adjustment. Exact cash statement and rounded call values must not be forced into an accounting identity; investigate accrued PP&E, timing, classifications and complete supplements in the next source gate. [Release](https://www.microsoft.com/en-us/investor/earnings/fy-2026-q4/press-release-webcast), [call](https://www.microsoft.com/en-us/investor/events/fy-2026/earnings-fy-2026-q4).

Roughly two-thirds short-lived CPU/GPU versus remainder long-lived is a composition description of native CapEx, not exact dollars and not an AI-only allocation. Do not multiply that share by cash PP&E and call the result AI spend.

FY2025 **pure depreciation 22.0bn** differs from FY2025 D&A-and-other 34,153m. Keep annual versus quarterly frequency. FY2025 computer equipment has a 2–6-year disclosed life range; buildings/improvements 5–15; land is not depreciated. Finance-lease assets are in PP&E, operating ROU assets separate. [Annual report Notes 1, 6 and 13](https://www.microsoft.com/investor/reports/ar25/).

The FY2026 Q4 call announces a **prospective FY2027 change**, effective July 1 2026: datacenter/office-building lives from 15 to 25 years. It also affects lease classification and reported CapEx guidance. Do not apply that policy backwards or interpret a convention-driven guidance reduction as equivalent reduction in compute capacity. Preserve both announcement date and effective date. Tax depreciation is a separate regime from book depreciation. [Q4 outlook](https://www.microsoft.com/en-us/investor/events/fy-2026/earnings-fy-2026-q4).

Fiscal/calendar map: FY2026 Q1 = July–September 2025 (calendar 2025 Q3); Q2 = October–December 2025; Q3 = January–March 2026; Q4 = April–June 2026. Fiscal annual periods are July–June. Label both explicitly.

## Alphabet

Cash PP&E **44,924** is the accepted investment-cash anchor. `CFO 39,069 − PP&E 44,924 = FCF −5,855`, matching the company non-GAAP reconciliation. Pure quarterly PP&E depreciation **7,104** permits a same-quarter descriptive cash-investment/depreciation ratio, not a useful-life or payback estimate. [SEC Exhibit 99.1](https://www.sec.gov/Archives/edgar/data/1652044/000165204426000066/googexhibit991q22026.htm).

Finance/operating lease additions, cash payments and future leases remain separate from cash PP&E. The Q2 10-Q discusses leases not yet commenced and depreciation beginning when PP&E is ready for intended use. Uncommenced payments are future exposure, not current expenditure. Assets not in service are not depreciated as active capacity. [Q2 10-Q, liquidity/CapEx/leases](https://www.sec.gov/Archives/edgar/data/1652044/000165204426000071/goog-20260630.htm).

Current precise server-life policy has not been accepted from a current annual filing in this foundation; leave the policy field unqualified instead of copying a secondary article's “six years.” Full annual-note retrieval is a next-phase gate. Actual depreciation remains observable without this policy field.

Q1–Q4 align to calendar quarters. Earlier cash-flow statements may publish only YTD: Q2 cash = H1 minus Q1 **only when periods, native definition and disclosure vintages are compatible**. The accepted 2019 H1 cash anchor 10,764 must not be divided by two or mislabeled Q2. Cloud revenue exists in older disclosures but historical segment operating scope changed; retain original/restated versions, never splice silently.

## Amazon

`Net cash PP&E = 54,208 gross − 1,132 proceeds/incentives = 53,076`.

`Quarterly cash FCF = 45,387 CFO − 53,076 = −7,689`.

This research quarterly calculation follows the company's published CFO-minus-net-PP&E formula. Company headline TTM FCF is −7,604. Quarterly principal repayments **395**, financing-obligation principal **59** and operating lease cash **3,489** are different fields; a separate after-financing-principal cash bridge would have a different name. Never relabel it company FCF. Operating lease cash already affects CFO. [Release](https://ir.aboutamazon.com/news-release/news-release-details/2026/Amazon-com-Announces-Second-Quarter-Results/default.aspx), [10-Q supplemental cash/segment notes](https://www.sec.gov/Archives/edgar/data/1018724/000101872426000026/amzn-20260630.htm).

Segment PP&E additions **63,891** include finance-lease assets (North America 235 and AWS 328 in the current quarter), accrual and timing effects; they do not equal gross cash purchases. Do not treat additions plus cash purchases as two independent capital inputs. A complete bridge also needs accrued purchases, noncash sources and capitalized costs.

Mixed cash-flow D&A **19,988** includes content and operating lease assets. Segment PP&E depreciation/amortization **13,869**, AWS 8,076, is a narrower but still mixed denominator. Pure depreciation-only ratio remains unavailable under that label.

FY2025 annual policy: servers moved from five to six years effective January 1 2024; a subset of servers/networking moved from six to five years effective January 1 2025. Keep subset scope, announcement/effective date and prospective expense effect. Useful life is an accounting estimate, not a measured chip lifetime. [Official FY2025 annual report](https://www.sec.gov/Archives/edgar/data/1018724/000110465926041036/tm263815d4_ars.pdf).

Fiscal quarters align to calendar. Inventory/logistics/media/retail capital and tax/working-capital cash changes prevent all-company investment from being interpreted as AWS AI economics. AWS AI and chips run-rates cannot be added to AWS segment revenue. Investment gains excluded from operating monetization even if the investment issuer is an AI company.

## Meta

`Native CapEx including finance-lease principal = cash PP&E 30,116 + principal 962 = 31,078`.

`Company FCF = CFO 31,862 − 30,116 − 962 = 784`.

This differs from a simple CFO-minus-cash-PP&E bridge of 1,746. Both calculations may be shown only with their distinct definitions; 1,746 is not Meta's reported FCF. Noncash finance-lease additions are separate, not another deduction in the same cash formula. [Q2 release and reconciliation](https://investor.atmeta.com/investor-news/press-release-details/2026/Meta-Reports-Second-Quarter-2026-Results/).

Pure PP&E depreciation about **6.00bn**, server/network depreciation about **4.62bn**, and mixed D&A **6,356m** are separate scopes and source precision. Rounded Note 6 amounts do not become exact million-dollar numbers. Construction in progress, land and held-for-sale/JV assets are separately tracked for later cohort work. [10-Q Note 6](https://www.sec.gov/Archives/edgar/data/1326801/000162828026050705/meta-20260630.htm).

Most server/network asset lives extended to **5.5 years effective January 1 2025**. Preserve the affected scope; do not infer that every GPU has a 5.5-year economic life. [Official September 2025 PP&E note](https://www.sec.gov/Archives/edgar/data/1326801/000162828025047240/R14.htm).

Fiscal/calendar quarters align. Historical 2019 source labels **net purchases of PP&E**; current source labels **purchases of PP&E**. Review the convention before longitudinal comparisons. Ads and recommendation improvements do not disclose an attributable AI earnings numerator. Family of Apps and Reality Labs operating expenses include different purposes; do not create an AI segment by subtraction.

## Safe derived statistics

Use exact same-company, same-period, same-source-vintage operands. Cash intensity = cash PP&E / revenue or CFO; gross margin = (revenue − cost of revenue) / revenue; operating margin = operating income / revenue. Denominator must be positive. Company-defined FCF is not GAAP. Keep formula, operand IDs and source precision.

Quarterly/annual growth requires an exact prior quarter/year with unchanged definitions. A TTM sum requires four distinct, contiguous accepted quarters. Q4 extraction from annual minus 9M requires comparable vintages and scope. Missing operands produce **null**, not zero, interpolation or an average. A same-quarter CapEx/depreciation ratio describes expansion and recognition lags; it does not estimate a return or useful life.

Not currently safe: AI revenue / estimated AI capital; AI ROIC, NPV, IRR, payback; AI gross margin from total cloud; total earnings divided by AI CapEx; monetized RPO/gigawatts/seats; investment gains added to operating AI revenue. No numeric AI allocation or matched counterfactual cash flow has been established.

## Future quarterly cohort design — not implemented

Each company/cohort must preserve investment quarter, native cash/recognized capital boundary, asset class, source/vintage, AI attribution, construction-in-progress, placed-in-service date, lease additions/principal and policy effective date. Unknown operational dates stay unknown. Separate investment cash timing, asset recognition, depreciation start, monetization and customer collections.

Candidate **deployment lags 0/2/4/8/12 quarters** are predeclared sensitivity windows, not fitted winners. They do not imply zero depreciation while cash investment occurs: some capital replaces already operating equipment, some is construction, some is prepaid/accrued. Depreciation follows the applicable asset's readiness and accounting policy, not a selected revenue lag.

A future model may use `capacity(t) = sum of qualified placed-in-service cohorts`, and cohort book depreciation consistent with depreciable cost, salvage value, remaining useful life and effective policy. It must not use total corporate PP&E to fabricate GPUs in service. Monetization requires utilization, price/mix, attributable product perimeter and cannibalization; cash return also requires serving cost, power, labor, maintenance/replacement, working capital and taxes. Revenue cohorts cannot be matched by calendar coincidence.

Qualification gates: reproducible accepted filings; complete investment/lease bridge; attributable operating numerator/denominator; operational capacity evidence; cost allocation and no-AI counterfactual/explicit scenario. Without these, cohort paths remain **MODEL_DERIVED** assumptions with no definitive return. No lag optimization or return simulation occurs in Phase 1.
