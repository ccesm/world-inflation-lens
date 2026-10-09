"""Deterministic B2 findings and gaps from frozen primary evidence; no forecasts."""
import json
from pathlib import Path
R=Path(__file__).resolve().parent
load=lambda n:json.loads((R/n).read_text())
dump=lambda n,d:(R/n).write_text(json.dumps(d,indent=2,sort_keys=True,ensure_ascii=False)+'\n')
def write():
 counts=load('content-identity.json')['counts'];rec=load('reconciliation.json');ss=sum([load(c+'-debt-lease-schedules.json')['schedules'] for c in ['oracle','amazon']],[])
 gaps=[
 ('B2-H01','HIGH','Oracle FY2026 / FY2027Q1 finance-lease principal','Total cash paid and accrued interest are not a qualified cash principal split. Keep principal null; obtain original supplemental cash disclosures or contract-specific reconciliation.'),
 ('B2-H02','HIGH','Customer financing contracts / refunds','Named-customer cash amounts, refund/repayment rights and complete contract-liability rollforwards remain unavailable for both issuers. Oracle has a $34M stock-versus-CF residual; no balancing plug.'),
 ('B2-H03','HIGH','Latest rolling-12-month payment / liquidity coverage','Quarter-end native remainder/year columns are not rolling 12 months. No exhaustive all-obligation denominator, intra-period liquidity forecast or distress classification can be supported.'),
 ('B2-M01','MEDIUM','Original HTML / custom-table independent parsing','Local SEC HTTP403 stopped retrieval. Official rendered tables reviewed through browser tool; selected primary XBRL contexts and numeric extracts archived, not original filing HTML. Manual fields cannot yet be re-read independently offline.'),
 ('B2-M02','MEDIUM','Oracle FY2023 / FY2024 principal total controls','Original tagged buckets exist but rendered schedule-total controls and hedge-adjustment scope are unqualified. No equality forced to net carrying debt.'),
 ('B2-M03','MEDIUM','Facilities / covenants / subsequent-event vintage','Oracle agreement-defined covenant not independently computed; Amazon lender approvals and draw after September30 unknown. Oracle lessor guarantee after September maturity unverified. June30 subsequent note issue remains separate.'),
 ('B2-M04','MEDIUM','Contract overlap / AI allocation','Corporate purchases, power, future leases, guarantees and unpaid PP&E may concern common assets or contracts. No complete overlap map or AI-only allocation; not added.'),
 ('B2-M05','MEDIUM','Amazon purchase-definition changes','Original native purchase schedules broaden from content/WholeFoods to energy/software and PP&E. Changes cannot be interpreted as pure AI-capital growth.')]
 dump('gap-register.json',[dict(gap_id=i,severity=s,field=f,limitation=t,status='OPEN_SOURCE_GAP',blocks='FULL_CONTRACT_OR_DISTRESS_CONCLUSION',implementation_defect=False) for i,s,f,t in gaps])
 report={'outcome':'PARTIAL — SOURCE GAPS','base_commit':'8e7d637a171de15c8f5c30b0896cae4400fdef70','branch':'codex/ai-infra-paper-validation-phase-b2','as_of':'2026-10-08','production_main_observed':'a7899729f36217cf1d4142f1203e11c32984ad9d','counts':counts,'schedule_statuses':rec['schedule_counts'],'financing_subtotal_reconciliations':sum(x['check']=='financing_subcomponents' and x['status']=='RECONCILED' for x in rec['checks']),'manual_original_html_independently_parsed':False,'new_raw_financial_html_archived':0,'primary_evidence_policy':'Primary SEC responses reused, exact contexts reproduced; reviewed native tables retained separately with locators and filing identity','source_gaps':[x[0] for x in gaps],'production_modified':False,'prior_evidence_modified':False,'distress_classification':None,'ai_roi':None,'aggregate_investment':None,'phase_c_started':False,'implementation_commit_policy':'Read final SHA from Git commit containing this report; avoid self-referential report hash','validation_receipt':'validation-results.json'}
 dump('qualification-report.json',report)
 tables=[]
 for c,l in [('oracle','FY2026'),('oracle','FY2027Q1'),('amazon','CY2025'),('amazon','2026H1')]:
  for s in [x for x in ss if x['company']==c and x['label']==l]:
   buckets='; '.join(f"{b['native_bucket']}: {b['value_usd']/1e9:.3f}" if b['value_usd'] is not None else f"{b['native_bucket']}: UNAVAILABLE" for b in s['native_buckets'])
   total=s['reconciliation']['reported_total_usd'];tables.append(f"| {c.title()} {l} | {s['family']} | {buckets} | {total/1e9:.3f} | {s['reconciliation']['status']} |" if total is not None else f"| {c.title()} {l} | {s['family']} | {buckets} | UNAVAILABLE | {s['reconciliation']['status']} |")
 pressure=[]
 for x in load('financial-pressure.json')['assessments']:
  d=x['dimensions'];pressure.append(f"| {x['company'].title()} {x['label']} | {d['capex_intensity']['cash_ppe_to_ocf']:.2%} | {d['internal_cash_coverage']['company_convention_fcf_usd']/1e9:.3f} | {d['liquidity_consumption']['cash_change_including_restricted_usd']/1e9:.3f} | {d['external_financing']['financing_cf_usd']/1e9:.3f} |")
 text=f'''# Phase B2 — Debt, lease and contractual obligation validation

Outcome: **PARTIAL — SOURCE GAPS**. Research-only; explicit as-of **2026-10-08**.

Oracle 与 Amazon 的资本支出、债务、租赁、购买承诺和客户融资已按原始披露分层核对。可确认投资现金流压力及融资结构变化，但不能据此断言资金耗尽、违约或财务困境。期限表采用原生财年/日历年桶，季度剩余期间不冒充滚动十二个月；未来承诺、担保与已确认负债不相加。

## Identity, reproducibility and scope

Base: `codex/ai-infra-paper-validation-phase-b1`, `8e7d637a171de15c8f5c30b0896cae4400fdef70`. B2 branch: `codex/ai-infra-paper-validation-phase-b2`. All tracked Phase A/B1 artifacts are SHA-256 locked by `input-lock.json`. The original main working tree is preserved; production main observed `a7899729f36217cf1d4142f1203e11c32984ad9d`. No production changes, merge, deployment, workflow or notification change. Version remains inherited 1.4.1.

This phase extends the nine B1 funding bridges, not a new AI-only panel. Oracle native years end May31; Amazon years end December31. FY2027Q1 is June–August2026; Amazon H1 is January–June2026. No annualization or synchronized-year inference. Earlier disclosures remain preserved.

There are **{counts['unique_reproducible_tagged_contexts']} unique reproducible tagged primary contexts**, represented by {counts['xbrl_numeric']} numeric XBRL records, and **{counts['reviewed_numeric']} manually reviewed primary numeric records**. These are source-linked records, including corroboration; not all are newly discovered or distinct economic facts. The mechanical company-period-metric count is {counts['unique_numeric']} and must not be described as independent source confirmations. {counts['unavailable']} unavailable records remain null. Nine original filing identities are retained.

The local direct SEC fetch returned HTTP403 and was stopped; official rendered pages supplied manual evidence. `evidence/selected-xbrl-contexts.json`, `reviewed-evidence.json` and source registers preserve reproducible extracts. They **do not constitute original HTML archival or independent offline parsing of custom tables**. Manual cells require re-reading the cited official filing; this is a completion gap, not hidden by arithmetic checks. No unofficial mirror, proxy or browser-cookie access was used.

## Debt and lease maturity schedules

**{counts['reconciled_schedules']} of {counts['schedules']} native schedules reconcile exactly**; four lack qualified total controls: Oracle FY2023/FY2024 principal and finance-lease schedules. Finance leases are explicitly absent in FY2024 only in the later FY2025 disclosure; missing first-vintage tags remain null, not zero. All 16 available discounted lease checks reconcile: gross future payments − imputed interest = recognized liability. Three financing cash-flow subtotals reconcile without residual plugs.

All monetary values below are **USD billions**, using native reported columns. Lease totals include imputed interest; they are not liability carrying values. Annual schedules provide 0–12,12–24,24–36,36–60,>60 month views; the last group stays aggregate. Quarter-end schedules preserve remainder/full-year columns, with **no rolling-12-month all-obligation denominator**. The same XBRL `NextTwelveMonths` name can refer to the next complete fiscal/calendar year in quarter tables. Native table headings take precedence.

| Company / period | Family | Native columns and amounts | Reported total | Arithmetic status |
|---|---|---|---:|---|
'''+ '\n'.join(tables)+'''

Oracle FY2026 principal total $130.105B differs from $129.541B carrying debt because of issuance discounts/costs. FY2025 scheduled $92.947B includes cross-currency adjustment and is distinct from $92.917B native face and $92.568B carrying debt. FY2023/24 missing rendered totals are not forced to match carrying values. Oracle contractual debt interest has no complete future schedule; reported interest expense is not substituted.

Amazon annual long-term principal is separately available. Only matching original-vintage debt principal+interest minus principal yields the annual contractual interest buckets; no coupon extrapolation. H1 principal alone is not disclosed in equivalent native columns, so no subtraction or rolling-year estimate is made. Other financing obligations remain distinct from finance leases.

[Oracle FY2026 debt note](https://www.sec.gov/Archives/edgar/data/1341439/000119312526277521/R17.htm), [Oracle FY2025 debt note](https://www.sec.gov/Archives/edgar/data/1341439/000095017025087926/R17.htm), [Amazon CY2025 filing, Notes6–7](https://www.sec.gov/Archives/edgar/data/1018724/000101872426000004/amzn-20251231.htm).

## Capital commitments and lease principal

`capital-commitments.json` distinguishes paid gross PP&E, future purchase schedules, noncash finance-lease additions, recognized lease payments, uncommenced leases, unpaid PP&E and conditional support. All corporate commitments remain non-AI-specific unless the source supplies narrower scope. Contractual amounts are neither cash forecasts nor current debt by default.

Oracle future uncommenced leases: $22.9B FY2024, $43.4B FY2025, $260B FY2026, $288B FY2027Q1. Scope, commencement windows and terms vary by vintage; no annual-payment allocation is invented. The August2026 commitments generally begin FY2027Q2–FY2029 over15–19years and are outside the recognized lease maturity tables. The May2026 $3.3B maximum lessor borrowing guarantee is conditional support, not expected payment/loss. Its status after September2026 maturity is unqualified. The subsequent $19B purchase commitment is not added to the August purchase schedule without contract identity.

Oracle finance lease cash paid $452M FY2026 and $186M Q1FY2027 is preserved as **cash paid**, not separately identified principal. The FY2025 $27M standard principal tag is retained as a tagged source fact with semantic review required because the rendered table labels the same amount as finance-lease cash paid; it does not independently establish a principal/interest split. Accrued interest expense is not deducted to invent principal. Noncash lease additions $4.946B/$1.539B and unpaid CapEx $5.279B/$6.247B remain distinct events/exposures. Amazon H1 finance-lease principal $863M and other financing-obligation principal $174M are separate financing cash-flow classes; its financing subtotal reconciles to $62.913B.

Amazon purchase disclosure changes over annual vintages: content/WholeFoods, then energy/software, then PP&E also named. Rising totals are not a harmonized AI-only investment series. `DO_NOT_ADD` pairs prohibit adding lease liability to gross payments, debt principal to principal+interest, customer funding to OCF, or contingent guarantees/future leases as independent capital spending.

[Oracle FY2026 lease/commitment note](https://www.sec.gov/Archives/edgar/data/1341439/000119312526277521/R20.htm), [Oracle August2026 Note6](https://www.sec.gov/Archives/edgar/data/1341439/000119312526389274/orcl-20260831.htm), [Amazon H1 cash flow and commitments](https://www.sec.gov/Archives/edgar/data/1018724/000101872426000026/amzn-20260630.htm).

## Customer financing — receipts, liabilities and revenue

Oracle original FY2026 SEC cash-flow statement now verifies exact customer significantly-financed prepayment adjustment **$4.592B**, matching B1's separately preserved earlier-release evidence. Q1FY2027 exact **$11.363B** also matches B1. These cash receipts are already reflected in GAAP OCF; do not add them to OCF or FCF a second time. Future services remain obligations reflected in deferred revenue. Financing effects are accounted over performance; customer-specific cash terms and refund/repayment rights remain unavailable.

Oracle deferred liability rises from $15.395B May31 to $30.789B August31. The $15.394B stock change differs from $11.363B customer-prepayment and $3.997B other deferred CF adjustments by **$34M**. This is an incomplete stock/CF comparison, not a complete cash roll-forward. FX/netting/other differences are not qualified; the residual is not receipts, refunds or a balancing plug.

Amazon H1 current unearned revenue $20.428B plus rounded noncurrent $4.5B gives approximately $24.928B. A separate exact total is unavailable. The policy recognizes amounts **paid or due**; the liability stock cannot establish contemporaneous cash receipts. $15.2B revenue recognized from opening unearned balances is revenue recognition, not H1 customer cash inflow. Full cash rollforwards and contract-specific refunds remain unavailable for both issuers.

[Oracle original FY2026 cash flows](https://www.sec.gov/Archives/edgar/data/1341439/000119312526277521/R8.htm), [Oracle Q1 filing Notes1/5 and cash flow](https://www.sec.gov/Archives/edgar/data/1341439/000119312526389274/orcl-20260831.htm), [Amazon H1 Note1](https://www.sec.gov/Archives/edgar/data/1018724/000101872426000026/amzn-20260630.htm).

## Liquidity, refinancing and restrictions

Liquidity is cash equivalents plus current marketable securities, excluding restricted cash. Debt carrying amounts and facilities are separate. No facility capacity is added to cash; credit-market refinancing is not presumed. Annual liquidity/principal-only ratios exclude interest, leases, purchases, operating cash needs and intra-period timing, and cannot establish comprehensive payment coverage.

Oracle May2026 $10B undrawn revolver has conditional availability and March2031 maturity. The agreement-defined EBITDA/net-interest covenant minimum3.0 is company-reported compliant at May31; B1 operating-income/interest proxy is **not** the covenant formula. No independent covenant-compliance determination is made. The $5.137B term loan has contractual amortization and August2027 maturity unless optional extensions are exercised; extensions are not assumed. Commercial-paper capacity is not committed cash.

Amazon June2026 undrawn revolvers ($15B/$5B) retain their November2028/October2026 maturities; extensions require lender approval. The $17.5B delayed-draw commitment's unused capacity terminates after September30; as of October8 we do not assume it remains available or was drawn. The subsequent $25B note issue is separate from June30 balances. Company-reported absence of financial covenants applies to Notes, not all facilities. These facts identify refinancing exposure without predicting inability to refinance.

## Six independent financial-pressure dimensions

`financial-pressure.json` uses the same six dimensions for both companies: investment intensity, internal cash coverage, observed liquidity movement, financing mix, native near-term payments and conditional refinancing exposure. Numerical confidence is high for exactly reconciled captured cash bridges; contract completeness is limited and AI causal attribution unavailable. No composite/distress score.

| Native period | Gross cash PP&E / OCF | Company FCF ($B) | Cash change incl. restricted ($B) | Financing CF ($B) |
|---|---:|---:|---:|---:|
'''+ '\n'.join(pressure)+'''

**Supported:** native corporate investment can exceed OCF; financing inflows and future obligations are visible. Oracle FY2026/Q1 shows negative FCF alongside increased cash and equity/debt/customer funding. Amazon H1 shows negative FCF, borrowing inflows and lower cash including restricted balances while maintaining a substantial broader liquidity stock. These are financing-structure observations. Period lengths differ; no direct annualized comparison.

**Not established:** guaranteed refinancing, exhaustive contractual liquidity coverage, covenant breach, cash exhaustion, AI-only cost attribution, financial distress or project AI return. Negative FCF alone does not imply financial distress. Future liabilities/guarantees are not added as total infrastructure investment, hidden debt or expected loss.

## Rebuild and validation

From the repository root (Python3 standard library; no network needed):

```sh
python3 research/ai-infrastructure-paper-validation/phase-b2/seed_evidence.py
python3 research/ai-infrastructure-paper-validation/phase-b2/build.py
python3 research/ai-infrastructure-paper-validation/phase-b2/write_report.py
python3 research/ai-infrastructure-paper-validation/phase-b2/test_phase_b2.py
npm ci
npm run build
npm run verify
```

Optional chart: install `requirements-charts.txt` in a disposable Python environment, run `charts.py`. It plots independently labeled annual debt-principal/lease-payment families using distinct panels and scales, never stacked. CSV/JSON remain the table fallback. Original Phase A/B1 tests are run in the clean B1 checkout; B1's original phase-specific scope guard intentionally cannot include new B2 files. B2 independently freezes all prior evidence and permits only its own directory. Results are in `validation-results.json`.

## Gaps and proposed Phase C

`gap-register.json` distinguishes evidence limitations from implementation defects. HIGH gaps block a full contractual/distress conclusion: Oracle lease principal split; customer refund/contract cash rollforward; latest rolling-year exhaustive cash obligations. MEDIUM gaps cover original HTML hydration/custom parsing, historical principal controls, updated facility/guarantee states, contract overlap and changing purchase scope.

Recommend Phase C only after owner authorization: targeted official HTML/contract hydration; independent custom-table parsing; source-dated facility/covenant definitions; customer funding rollforward and refunds; contract-level overlap review. If disclosure remains unavailable, retain it unavailable rather than manufacture a coverage forecast. **Phase C is not started.** Production remains unchanged; no research publication is proposed.
'''
 (R/'PHASE_B2_OBLIGATIONS_REPORT.md').write_text(text)
if __name__=='__main__':write()
