"""Generate tables from B1 economic outputs. Editorial assessments remain explicit."""
import json
from pathlib import Path
R=Path(__file__).resolve().parent
bs=json.loads((R/'funding-bridges.json').read_text());identity=json.loads((R/'content-identity.json').read_text())
def n(x):return 'UNAVAILABLE' if x is None else f'{x/1e9:,.3f}'
def ratio(x):return 'UNAVAILABLE' if x is None else f'{x:.2f}×'
def tables(rows):
 text='| Company / native period | Start → end | OCF | Gross cash PP&E | Company FCF | Investing CF | Financing CF | FX | Cash change incl. restricted | Bridge |\n|---|---|---:|---:|---:|---:|---:|---:|---:|---|\n'
 for b in rows:
  v=b['reported_values_usd'];text+=f'| {b["company"].title()} {b["label"]} | {b["start"]} → {b["end"]} | '+ ' | '.join(n(v[k]) for k in ['ocf','cash_capex'])+' | '+n(b['company_convention_fcf_usd'])+' | '+' | '.join(n(v[k]) for k in ['investing_cf','financing_cf','fx'])+' | '+n(b['computed_cash_change_usd'])+' | '+b['status']+' |\n'
 return text
lines=['''# Phase B1 — Infrastructure funding and financial pressure

Outcome: **PARTIAL — SOURCE GAPS**. Research-only; as of 2026-10-08.

执行摘要：Oracle 的原生财年现金投资已超过经营现金流，后续披露显示借款、股权融资和客户预付款共同支持资金需求。Amazon 的 2023–2025 年公司口径自由现金流仍为正，但 2026 上半年转负、借款显著增加。这说明资金结构发生变化，不能据此断言财务困境、全部支出属于 AI，或系统性金融风险。

Six historical annual funding bridges and three separately reported 2026-period bridges reconcile exactly, without a balancing plug. Oracle's native FY2025 cash PP&E modestly exceeded OCF; FY2026 shows a much larger deficit alongside borrowing and increased cash holdings. Amazon's historical company-convention FCF remained positive through CY2025; H1 2026 shows a negative investment residual and substantial financing flows. These observations support separate assessments of investment intensity and funding mix, not distress, ratings, or an AI financing crisis thesis.

## Period and vintage boundary

- Base: `codex/ai-infra-paper-validation-phase-a`, `b90080dd9f94cee2afa6d94f17467bab0d46649f`.
- Branch: `codex/ai-infra-paper-validation-phase-b1`.
- Production main observed at start: `a7899729f36217cf1d4142f1203e11c32984ad9d`; its advance from the accepted release was a bot data refresh. Production remains untouched.
- Oracle historical tables use **native June–May FY2023–FY2025**, not calendar years. FY2023 begins June 2022. The inherited Phase A **December–November proxy** remains unchanged and must not be equated with these funding bridges. In particular, Phase A's 2025 proxy FCF −$13.181B differs from native FY2025 −$0.394B because the periods differ.
- Oracle FY2026 (June 2025–May 2026), Oracle FY2027Q1 (June–August 2026), and Amazon H1 2026 (January–June) remain separate observations. None is annualized or combined into a synchronized 2026 year.
- Each period selects the earliest eligible 10-K/10-Q OCF accession, then all standard metrics must match that exact accession and period. Later comparative changes remain in `vintage-differences.json`. An earlier official earnings-release supplemental extract stays separate from the annual SEC anchor.

## Reconciled historical funding bridges

All monetary tables use **USD billions**. Cash flows carry their reported sign; PP&E purchases and debt repayments elsewhere are positive cash-use magnitudes.

''',tables([b for b in bs if b['cohort']=='HISTORICAL_2023_2025']),'''
## Separately reported 2026 observations

''',tables([b for b in bs if b['cohort']!='HISTORICAL_2023_2025']),'''
## Indicator definitions and limitations

- Gross CapEx/OCF = reported cash PP&E / GAAP OCF. It is narrow arithmetic investment coverage, not a measured external financing requirement. OCF funds other uses and may itself include customer financing.
- Gross residual = OCF − gross PP&E. Company-convention FCF: **Oracle OCF − cash PP&E; Amazon OCF − (gross PP&E − PP&E sale proceeds/incentives)**. Do not compare Amazon's gross residual as if it were reported FCF. Lease principal, acquisitions and debt service remain separate. FCF is not discretionary cash available after all obligations.
- Borrowings: Oracle reported combined current/noncurrent carrying amount (or separately proven carrying components); Amazon current + noncurrent long-term carrying amounts + separately reported short-term borrowings. **Face values, finance leases, operating leases, financing obligations and future commitments are retained separately**. This is not an adjusted leverage metric.
- Net debt excluding leases = defined borrowings − (cash equivalents + current marketable securities). Negative amounts mean net cash on this narrow basis; they exclude leases/financing obligations and do not value all liquid assets or haircut securities. Restricted cash is excluded from the liquidity numerator but included in cash-flow reconciliation.
- Debt/OCF = end-year defined borrowings / full native-year OCF. It is omitted for incomplete periods; no annualization.
- Interest proxy = GAAP operating income / reported interest expense. Not covenant coverage, not cash debt-service coverage, and not AI profitability. Capitalization and finance-lease interest affect scope.
- Liquidity/near-term obligations: **cash + current marketable securities / separately disclosed next-12-month long-term debt principal only**, available for annual filings. Not coverage of all commitments: interest, leases, purchase obligations, operating costs, taxation and intra-year cash timing are excluded. No invented all-obligation denominator.

| Company / native period | Gross CapEx / OCF | Liquidity | Borrowings excl. leases | Net debt excl. leases | Debt / annual OCF | Operating income / interest proxy | Liquidity / next-12m debt principal only |
|---|---:|---:|---:|---:|---:|---:|---:|
''']
for b in bs:
 lines.append(f'| {b["company"].title()} {b["label"]} | {100*b["gross_capex_ocf_ratio"]:.2f}% | {n(b["cash_and_short_term_investments_usd"])} | {n(b["borrowings_excluding_leases_usd"])} | {n(b["net_debt_excluding_leases_usd"])} | {ratio(b["debt_ocf_ratio"])} | {ratio(b["operating_income_interest_expense_proxy"])} | {ratio(b["liquidity_to_next12m_debt_principal_only"])} |\n')
lines.append(f'\nSource coverage: **{identity["counts"]["unique_company_period_metric_numeric_observations"]} unique company-period-metric numerical observations**; {identity["counts"]["source_verified_numeric_observations"]} source-linked numeric records comprising {identity["counts"]["xbrl_verified_numeric_observations"]} reproducible SEC XBRL contexts and {identity["counts"]["rendered_numeric_observations"]} reviewed rendered-source records. Duplicate corroborations are not counted as distinct economic observations. This is not a claim that every custom field or every component of financing has been independently hydrated.\n\n')
lines.append('''
## Oracle funding assessment

**Investment intensity — supported, period-specific.** Native FY2023 and FY2024 cash PP&E were below OCF; native FY2025 rose to 101.89% of OCF. FY2026 rises to 174.07%, with company FCF −$23.686B. These are corporate expenditures, not an AI-specific allocation.

**Liquidity pressure — investment cash deficits supported; generalized cash exhaustion is not.** FY2023 cash fell $11.618B even with positive FCF, but reported acquisitions net of acquired cash were $27.721B: that decline cannot be attributed to AI investment. Cash increased in FY2024 and FY2025. FY2026 and FY2027Q1 show negative FCF yet higher reported cash because of other funding. Liquidity depends on funding mix; negative FCF and cash depletion are distinct facts.

**External financing reliance — documented.** FY2025 debt proceeds $19.548B and repayments $15.841B coexist with positive $1.098B aggregate financing CF. FY2026 debt proceeds net of issuance costs $46.093B and repayments $6.942B accompany $40.284B financing CF and a higher end-year borrowing balance. No dollars are specifically allocated to AI or individual assets. Native debt/OCF can fall even while debt stock grows because the OCF denominator rises; it is not a verdict about financing safety.

FY2027Q1: GAAP OCF $23.103B, cash PP&E $28.499B, FCF −$5.396B, financing CF $13.111B, **ATM common equity proceeds $19.909B**. The cash-flow statement identifies **$11.363B customer prepayments with significant financing component within OCF**. Its note reports a rounded $11.4B; both are retained, not silently substituted. These receipts precede service performance, carry future obligations and are not recognized AI revenue. They are already inside OCF and must not be added again as a separate bridge inflow. The FY2026 earlier earnings release separately discloses $4.592B; the SEC note context rounds this to $4.6B. Do not subtract both from spending or inflate available funding by counting them twice.

Oracle's `PaymentsOfDividendsCommonStock` tag in recent filings covers **payments to stockholders**, including preferred dividends. B1 uses `cash_stockholder_dividends`, leaves a pure-common cash series unavailable where not separated, and never substitutes declared dividends for paid cash.

**Financial vulnerability — unresolved, not a distress classification.** Annual maturity schedules and interest expense are available. The latest disclosure shows large additional uncommenced data-center leases, but B1 has not reconstructed every contractual payment schedule, financing covenant, or liquidity restriction. Oracle management states that existing liquidity and financing arrangements cover at least twelve months; that is a management statement, not an independent stress-test finding. No breach, inability to service debt, or weakened credit capacity is established here. [Oracle FY2027Q1 filing, cash flows pp. 5–6; commitments p. 13; liquidity pp. 33–35](https://www.sec.gov/Archives/edgar/data/1341439/000119312526389274/orcl-20260831.htm)

## Amazon funding assessment

**Investment intensity — supported.** Gross cash PP&E/OCF increases from 62.07% in CY2023 to 71.63% in CY2024 and 94.48% in CY2025. Net investment uses the native proceeds/incentives definition. Company FCF is $36.813B, $38.219B and $11.194B respectively; CY2025's gross residual is only $7.695B. Neither is AI cash return. Cash investment supports technology infrastructure, AWS and fulfillment capacity, not solely AI.

**Liquidity pressure — historical depletion not demonstrated; 2026 cash demands increased.** CY2023–2025 OCF covered net cash PP&E; cash and current marketable securities grew from $86.780B to $123.029B. H1 2026 OCF $71.419B versus gross PP&E $98.411B produces company-convention period FCF −$24.891B after $2.101B sales/incentives. Combined cash including restricted cash falls $9.179B; liquidity including current securities is $122.988B, close to the year-end balance. The cash-only decline does not equal an equivalent fall in the broader liquidity stock.

**External financing reliance — incremental funding use demonstrated in 2026, not an AI-only funding attribution.** H1 2026 long-term debt proceeds are $66.998B, repayments $2.752B; aggregate financing CF is $62.913B. Reported investing CF is −$143.457B and also includes **$39.767B acquisitions/non-marketable investments/other, net**, so cash requirements extend well beyond PP&E. Use the cash-flow bridge, not an assumed funding shortfall attributed entirely to AI. These flows coexist with remaining liquid assets; B1 does not show that every investment dollar required new borrowing. [Amazon H1 2026 filing, cash flows p. 3 and liquidity pp. 27–28](https://www.sec.gov/Archives/edgar/data/1018724/000101872426000026/amzn-20260630.htm)

**Financial vulnerability — not established.** Debt increases and maturities require follow-up, but the narrow operating-income/interest proxy stays positive and material liquidity remains. Annual note disclosures show no borrowings on the two unsecured revolvers or commercial paper at CY2025 end; this does not mean no other debt exists. No financial covenant breach or distress conclusion follows from negative FCF.

## Debt, leases and future commitments: keep the layers separate

`company-financials.csv` / `financial-observations.json` contain revenue, operating income, cash/current securities, debt flows, repurchases, dividends where separately disclosed, borrowing carrying/face amounts, maturity buckets, recognized finance/operating lease liabilities, noncash additions, principal paid, future payments and customer/deferred-revenue fields. Missing cells remain null (blank in CSV), not zero.

- Amazon CY2025 long-term face amount $68.836B differs from carrying components $65.648B noncurrent + $2.748B current. Adding $0.455B other short-term borrowings yields the **$68.851B defined borrowing stock**. Do not add the face amount again. The CY2023 $0.682B secured revolver is already inside long-term debt; only the separate $0.147B other short-term facilities are added.
- Amazon CY2025 finance-lease liability $12.286B is a recognized stock; $14.917B is undiscounted future lease payments including interest. Principal paid $1.557B is a period flow. Noncash finance-lease asset additions are not cash PP&E. These must not be added as independent investment totals.
- Amazon CY2025 additional uncommenced leases $96.373B and unconditional purchase obligations $84.772B are future commitments with distinct schedules. CY2026H1 snapshots show $137.214B and $130.065B respectively. The purchase-obligation disclosure broadens its described scope over the historical filings (content/Whole Foods in 2023; energy/software in 2024; PP&E also named in 2025). **Do not infer that the dollar change is entirely new AI infrastructure spending.** Commitments can overlap future PP&E and are not current debt or cash flows. [Amazon CY2025 10-K, Notes 6–7](https://www.sec.gov/Archives/edgar/data/1018724/000101872426000004/amzn-20251231.htm)
- Oracle August 2026 discloses **$288B additional lease commitments**, substantially related to data centers, generally starting FY2027Q2–FY2029 over fifteen to nineteen years. These are outside recognized lease liabilities and the existing lease maturity table. Purchase/other obligations of $34.150B have a different scope. Do not label the $288B automatically debt or add it to corporate CapEx or borrowing balances. [Oracle FY2027Q1 Note 6](https://www.sec.gov/Archives/edgar/data/1341439/000119312526389274/orcl-20260831.htm)
- Deferred/unearned revenue is a balance or indirect working-capital adjustment; **it is not contemporaneous cash received**. Amazon explicitly records unearned amounts when paid **or due** before performance. Oracle's specifically identified financing-component prepayments provide verifiable cash context; that does not justify converting all deferred revenues or RPO into cash receipts. [Amazon CY2023 Note 1](https://www.sec.gov/Archives/edgar/data/1018724/000101872424000008/amzn-20231231.htm)

## Reconciliation checklist and source gaps

- PASS: all six historical annual cash-flow totals independently equal reported cash change; beginning/end combined cash independently reproduce it. All three 2026-period bridges likewise reconcile.
- PASS: first annual/quarterly SEC accession retained; native fiscal boundaries explicit; ten changed-context vintages retained without overwriting accepted observations.
- PASS: Amazon original annual net PP&E and FCF reconcile to rendered statements. Oracle reported FY2026 and FY2027Q1 FCF cross-checks agree with derived values.
- PASS: debt face/carrying, leases/interest/principal, cash stocks/flows, original/revised values and 2026 periods remain separate.
- PARTIAL: Oracle FY2023–FY2024 finance-lease details and FY2026/FY2027Q1 exact finance-lease principal are absent in captured standard contexts; not assumed zero. Total finance-lease cash paid is not principal; interest expense is not necessarily interest cash paid.
- PARTIAL: Oracle historical uncommenced lease commitments and all current-period debt maturity schedules are not comprehensively hydrated. No all-commitment liquidity coverage denominator is claimed.
- PARTIAL: Amazon H1 2026 total deferred revenue and dividends are not independently reproduced in this register; no zero or customer-cash inference.
- PARTIAL: native per-vintage statement labels/custom tags and complete financing subcomponent reconciliation remain incompletely captured. Standard XBRL taxonomy labels are identified as such. Aggregate CF totals reconcile; this does not certify every subcomponent.
- PARTIAL: SEC companyfacts source responses are immutable, losslessly archived by Phase A. Human-checked supplemental cells are retained with URL, accession/document ID, vintage and table locator, **but not raw filing HTML**. Oracle annual rendered filings could not be fully opened; annual numerical rows remain reproducible from captured SEC responses. Do not describe structured transcription as archived original source bytes.
- UNAVAILABLE: AI-specific capex allocation, recognized AI-only revenue and attributable project cash returns. No financial-distress inference, rating, systemic-risk conclusion, hidden leverage, or AI ROI is calculated.

## Reproduce and validate

From repository root, with Python 3.13:

```sh
python3 research/ai-infrastructure-paper-validation/phase-b1/build.py
python3 research/ai-infrastructure-paper-validation/phase-a/test_phase_a.py
python3 research/ai-infrastructure-paper-validation/phase-b1/test_phase_b1.py
python3 research/ai-infrastructure-paper-validation/phase-b1/write_report.py
# Optional pinned chart environment (economic tests do not require matplotlib):
python3 -m venv /tmp/wil-b1-plots
/tmp/wil-b1-plots/bin/pip install -r research/ai-infrastructure-paper-validation/phase-b1/requirements-charts.txt
/tmp/wil-b1-plots/bin/python research/ai-infrastructure-paper-validation/phase-b1/charts.py
npm ci
npm run build
npm run verify
```

`primary-extracts.json` is the reviewed supplemental input; `seed_extracts.py` records the exact reviewed cells and provenance so the input can be inspected/reconstructed, without online discovery. Do not treat regenerating that file as an independent source re-download. Economic build uses the frozen file. `phase-a-input-lock.json` pins the inherited register and two raw snapshots. Economic identities exclude runtime clocks and machine paths. Reports and plots derive from the reconciled dataset and do not fetch new financial data.

![Annual funding bridges](chart-a-funding-bridges.png)

![Investment and FCF](chart-b-investment-fcf.png)

## Phase B2 recommendation (not executed)

Prioritize primary filing hydration for Oracle's historical/future lease schedules and current debt maturity/covenant details; distinguish paid lease principal from interest. Add a native customer-financing roll-forward linking receipts, contract liabilities, recognition and performance obligations. For Amazon, reconcile borrowing issuance, capital investment, acquisitions/non-marketable investment and maturities without attributing a fungible dollar to AI. Audit definition changes in purchase obligations. Then construct explicitly scoped contractual liquidity scenarios only after schedules, cash restrictions and overlap are qualified. Do not extend to macro scenarios or production integration in B1.

## Handoff

Only the `phase-b1/` directory is added. Phase A and all production files, version, workflows, email, routes, Signal Engine and AI Labor remain unchanged. No production PR, merge, deployment or additional automation. See `validation-results.json` for executed tests and `content-identity.json` for economic hashes. Final Git commit is recorded in the delivery report rather than inside its own hashed content.
''')
(R/'PHASE_B1_FINANCING_REPORT.md').write_text(''.join(lines))
