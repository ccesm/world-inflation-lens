"""Render owner report from completed independent datasets and isolated comparison."""
import csv,json,pathlib
from build import ROOT

def read(name):
 with (ROOT/name).open() as f:return list(csv.DictReader(f))
def table(headers,rows):return '| '+' | '.join(headers)+' |\n| '+' | '.join(['---']*len(headers))+' |\n'+'\n'.join('| '+' | '.join(map(str,r))+' |' for r in rows)+'\n'
def b(v):return f'{float(v)/1e9:,.3f}' if v else 'Missing'
def pct(v):return f'{float(v)*100:.2f}%'
a=read('five-company-aggregate.csv');c=read('company-calendar-year.csv');pc=read('paper-comparison.csv');ytd=read('2026-observed.csv');rec=read('fiscal-reconciliation.csv');meta=json.loads((ROOT/'run-metadata.json').read_text())
company_rows=[]
for co in ['microsoft','amazon','alphabet','meta','oracle']:
 row=next(x for x in c if x['company']==co and x['calendar_year']=='2025');r0=next(x for x in c if x['company']==co and x['calendar_year']=='2020')
 company_rows.append([co.title()+(' (Dec-Nov proxy)' if co=='oracle' else ''),b(row['cash_capex_usd']),b(row['ocf_usd']),pct(r0['capex_ocf_ratio']),pct(row['capex_ocf_ratio']),b(row['ocf_minus_cash_capex_usd'])])
coverage=[]
for year in range(2020,2026):coverage.append([year]+[pct(next(r for r in c if r['company']==co and r['calendar_year']==str(year))['capex_ocf_ratio']) for co in ['microsoft','amazon','alphabet','meta','oracle']])
body=f'''# AI Infrastructure independent paper validation: Phase A

**Decision: PHASE A PARTIAL — SOURCE GAPS.** The historical scale and direction are closely replicated, but Figure 1's precise calendar-year values and its 2026 crossing cannot be independently reproduced from the evidence captured in this run. The research branch is suitable for inspecting the partial evidence; it is not a production release.

**Figure 1 numerical assessment: PARTIALLY REPRODUCED.** Six historical proxy totals are close to the paper, but differences remain unresolved and Oracle's exact January-December bridge is not observable. **Financing-pressure argument: PARTIALLY SUPPORTED.** Relative internal cash-flow coverage tightens over 2020-2025, especially in 2025; actual external financing dependence is **NOT IDENTIFIED BY THIS EVIDENCE** when using CapEx and OCF alone. These are separate assessments, not a score.

## Research question and exact source

Can the paper's five-company cash CapEx and GAAP operating cash flow history be reproduced independently from primary disclosures? What do those financial flows establish about financing pressure?

The validation object is Stijn Van Nieuwerburgh, *Financing the AI Buildout*, internal version September 4, 2026, BPEA conference draft. [Exact PDF](https://www.brookings.edu/wp-content/uploads/2026/09/4c_Van-Nieuwerburgh.pdf); [canonical Brookings page](https://www.brookings.edu/articles/financing-the-ai-buildout/). Figure 1 is printed page 6, PDF page 7. The retrieved PDF hash is `bf96f1e528b10dcd8cb1ab52bfad45f100efa1d7462b2af75f9bb4bda668bbc4`, matching the repository's frozen reference. The canonical summary's publication date is September 23, 2026; it is not the internal version date. The PDF is the object of validation and supplies no independent company observations.

Exactly five companies are included: Microsoft, Amazon, Alphabet, Meta and Oracle. Research cutoff: October 8, 2026. Historical observations cover 2020-2025. 2026 is incomplete and is reported separately.

## Execution and repository boundary

- Scheduled start: October 8, 2026 03:40:00 PDT / 10:40:00 UTC.
- Actual start: October 8, 2026 03:40:25 PDT / 10:40:25 UTC.
- Expected main: `{meta['expected_main_sha']}`.
- Verified remote base: `{meta['repo_base_sha']}`. One bot snapshot-refresh commit beyond expected; no material research-scope conflict.
- Research branch: `{meta['branch']}` in isolated linked worktree `/private/tmp/wil-phase-a`, backed by independent bare clone `/private/tmp/wil-phase-a-origin.git`.
- Shared checkout had unrelated untracked research and a malformed local ref. Those files, other agents' branches and shared Git refs were not repaired or changed. The network-disabled fetch initially failed; an authorized network fetch exposed the bad ref. A fresh isolated clone verified remote main.
- Only this report and `research/ai-infrastructure-paper-validation/phase-a/` are added. Production files, application version, workflows, notifications and email are unchanged. No PR, merge or deployment. Final commit identity is the branch HEAD reported in the handoff; a document cannot embed its own commit hash.
- One run only. No new schedule, retry automation or automatic continuation was created.

## Definitions and construction

Cash CapEx is reported cash purchases/additions of property and equipment, expressed as a positive cash use. OCF is the GAAP net cash flow from operating activities, retaining its sign. Amazon's purchases use its productive-assets XBRL tag; the others use the PP&E-purchases tag. The primary observations are the SEC's extracted XBRL facts, not financial websites or paper-derived estimates.

We retain fiscal and reporting dates, original values, machine-native USD units, currency, accession numbers, filing publication dates, item tags and source URLs. Source versions are compressed losslessly and hash-checked. Representative native labels are documented; original rendered labels for every historical filing are unavailable and therefore remain null rather than invented.

Cumulative cash flows are differenced: second quarter = six-month total minus first quarter; third = nine months minus six months; fourth = full fiscal year minus nine months. Primary contexts use the first-reported vintage. Later annual revisions are isolated in a sensitivity dataset. No overlapping YTD values are summed. There are {len(rec)} complete fiscal-total reconciliation rows, including supplemental Meta lease principal and adjacent fiscal years; all reconcile to zero difference. This algebraic check is not proof of original-label verification or exact calendar dates.

Microsoft's July-June fiscal year can be reconstructed into exact calendar quarters. Amazon, Alphabet and Meta already report December year ends. Oracle's June-May year has February/May/August/November quarter ends. Its available quarter-end buckets cover **December of the previous year through November of the named year**. All tables containing Oracle below are visibly **proxies**. Exact Oracle and exact five-company January-December fields stay missing. No monthly interpolation or invented December cash flow is used. No selected company requires a 52/53-week adjustment; leap-year and original month-end boundaries are retained.

Cash CapEx is distinct from accrued PP&E investment, noncash finance lease asset additions, operating leases, lease principal payments, company-defined net capital spending and AI-specific investment. No statement here assumes that all corporate CapEx is AI. The full method, schema and offline commands are in `research/ai-infrastructure-paper-validation/phase-a/methodology.md`.

## Primary-source coverage and completeness

All five SEC companyfacts captures contain both required metrics, with all 120 company-quarter pairs available for 2020-2025. Each company has six complete four-quarter cash-flow sums. Four companies have exact calendar-year totals (24 company-year pairs); Oracle's six company-years are December-November proxies, leaving **zero exact five-company calendar-year totals**. The source register includes {len(json.loads((ROOT/'source-register.json').read_text())['filings'])} filing accessions referenced by the retained observation ledger, including comparative vintages and adjacent years.

| Company | Primary SEC capture | Cash-purchase item | Calendar treatment |
| --- | --- | --- | --- |
| Microsoft | [CIK 789019](https://data.sec.gov/api/xbrl/companyfacts/CIK0000789019.json) | PP&E additions | Exact quarterly bridge |
| Amazon | [CIK 1018724](https://data.sec.gov/api/xbrl/companyfacts/CIK0001018724.json) | Purchases of property/equipment, productive-assets tag | Exact January-December |
| Alphabet | [CIK 1652044](https://data.sec.gov/api/xbrl/companyfacts/CIK0001652044.json) | Purchases of property/equipment | Exact January-December |
| Meta | [CIK 1326801](https://data.sec.gov/api/xbrl/companyfacts/CIK0001326801.json) | Purchases of property/equipment | Exact January-December; revisions separate |
| Oracle | [CIK 1341439](https://data.sec.gov/api/xbrl/companyfacts/CIK0001341439.json) | Capital expenditures | December-November proxy; exact calendar missing |

## Independently constructed annual results

USD billions. Classification: **four exact calendar-year series plus Oracle December-November quarter-end proxy**, first-reported vintage. Coverage is OCF minus cash CapEx and is a simplified measure, not the complete financing need or uniformly company-defined free cash flow.

{table(['Year','Cash CapEx','GAAP OCF','CapEx / OCF','OCF minus cash CapEx','CapEx YoY','OCF YoY'],[[r['calendar_year'],b(r['cash_capex_usd']),b(r['ocf_usd']),pct(r['capex_ocf_ratio']),b(r['ocf_minus_cash_capex_usd']),f"{float(r['cash_capex_yoy_pct']):.2f}%" if r['cash_capex_yoy_pct'] else '—',f"{float(r['ocf_yoy_pct']):.2f}%" if r['ocf_yoy_pct'] else '—'] for r in a])}
Cash CapEx grew approximately {float(a[-1]['cash_capex_usd'])/float(a[0]['cash_capex_usd']):.2f} times (+{(float(a[-1]['cash_capex_usd'])/float(a[0]['cash_capex_usd'])-1)*100:.1f}%) from 2020 to 2025; OCF grew {float(a[-1]['ocf_usd'])/float(a[0]['ocf_usd']):.2f} times (+{(float(a[-1]['ocf_usd'])/float(a[0]['ocf_usd'])-1)*100:.1f}%). The coverage ratio rose from 38.49% to 68.27%, approximately 29.78 percentage points. It did not rise every year: coverage improved in 2023. CapEx grew faster than OCF in four of the five annual changes.

The absolute residual was $154.969B in 2020 and $191.301B in 2025. It increased across those endpoints even though the ratio tightened. It declined by $47.986B from 2024 to 2025. Relative coverage pressure and the absolute dollars left after this simplified calculation are different observations.

## Company-level results

2025 USD billions; company cash remains inside the respective firm.

{table(['Company','Cash CapEx','GAAP OCF','2020 CapEx/OCF','2025 CapEx/OCF','2025 simple coverage'],company_rows)}
Microsoft's cash CapEx/OCF rose, while OCF still exceeded cash purchases in every historical calendar year. Its broader capital-expenditure guidance includes finance leases and is not the cash-purchase measure used here.

Amazon had cash-purchase coverage ratios above 100% in 2021 and 2022, followed by improvement in 2023. It approached 100% again in 2025. Its own FCF nets PP&E proceeds/incentives; our gross cash purchases do not. This is a definition difference, not a distress conclusion.

Alphabet's ratio increased overall, with improvement in 2023; historical annual OCF remained above cash purchases. Its 2026 first-half observations have a much tighter relationship, but half-year seasonality and incomplete annual data prevent a full-year conclusion.

Meta's ratio fluctuated and rose overall. First-reported cash purchases differ from later annual comparative presentations by +$48M (2020), +$123M (2021), -$245M (2022) and -$221M (2023). Their causes and quarter-by-quarter allocation are not fully established here. Finance lease principal is excluded from our purchases but included in Meta's own FCF definition.

Oracle's December-November ratio reaches 159.12% in the 2025 proxy period. That company's negative simple coverage cannot be offset economically by calling the other companies' cash a pooled funding source. Exact January-December Oracle coverage is still missing.

{table(['Year','Microsoft','Amazon','Alphabet','Meta','Oracle proxy'],coverage)}
The full 30 company-year CapEx/OCF pairs and source-derived quarters remain visible in their CSV files. There is no company ranking, composite score, probability or investment recommendation.

## Figure 1 reconciliation

The independent datasets were generated before this comparison. USD billions; percentage differences use the paper value as denominator. Signed delta = independent minus paper. Absolute magnitudes are separately retained in `paper-comparison.csv`. Oracle prevents interpreting these as exact-period reproduction errors.

{table(['Year','Independent CapEx','Paper CapEx','CapEx Δ','CapEx Δ %','Independent OCF','Paper OCF','OCF Δ','OCF Δ %'],[[r['year'],f"{float(r['independent_cash_capex']):.3f}",r['paper_cash_capex'],f"{float(r['cash_capex_signed_difference']):+.3f}",f"{float(r['cash_capex_percentage_difference']):+.3f}%",f"{float(r['independent_ocf']):.3f}",r['paper_ocf'],f"{float(r['ocf_signed_difference']):+.3f}",f"{float(r['ocf_percentage_difference']):+.3f}%"] for r in pc if r['year']!='2026'])}
2026 paper references: CapEx $800.5B; OCF $707.1B. Classification: **mixed reported results/guidance/estimate**, not completed historical observations. No delta or ratio comparison to YTD actuals is calculated. The paper's company worksheet, guidance dates, definition bridge and estimate sources are unavailable in the retrieved Figure 1 note.

### Largest differences and investigations

The largest cash-purchase difference is 2025: independent proxy $411.528B versus paper $415.8B, a $4.272B shortfall relative to the paper (-1.027%). The largest OCF absolute difference is 2023: $0.409B lower (-0.108%). These exceed aggregate one-decimal rounding alone. None is forced to match.

- **Company inclusion:** exactly the same five firms; no NVIDIA, CoreWeave or developer substitution.
- **Metric definitions:** the paper describes cash CapEx and excludes leased data-center CapEx. Our cash purchases exclude noncash finance lease additions and separate lease principal; company headline metrics may include them. Microsoft Q4 FY2026 cash PP&E was $35.802B versus approximately $41B headline capital expenditures, with approximately $5.6B finance leases and timing differences. These cannot be substituted silently.
- **Meta lease sensitivity:** 2025 finance lease principal was $2.524B. Adding it would move the proxy from $411.528B to $414.052B, leaving $1.748B below the paper. This quantifies a definition sensitivity, but does not prove that the author added those payments. The primary observations remain unchanged.
- **Amazon gross versus net:** 2025 purchases were $131.819B; the official Q2 2026 release's Q4 2025 TTM net-purchase column was $128.320B. The $3.499B netting difference would lower our aggregate further, so this change alone cannot explain why the paper's total is higher. 2026 H1 netting similarly reduces cash purchases by $2.101B. Other financing-obligation and lease-principal payments are separate.
- **Meta held-for-sale spending:** the 2025 statement shows $2.432B of payments for held-for-sale assets, separate from PP&E purchases. Adding that different cash investment would yield $413.960B and still not reconcile. It is not silently included in the native purchases series.
- **Revision sensitivity:** using directly reported later Meta annual values changes aggregate CapEx to $97.009B, $130.717B, $157.762B and $154.162B for 2020-2023; 2024-2025 are unchanged. We do not mix those annual revisions into first-reported quarters. Even this sensitivity does not reproduce all paper totals.
- **Fiscal/calendar alignment:** Oracle is shifted by a month. Its exact December-versus-December bridge is unknown. A monthly fraction cannot be inferred from quarterly totals without an assumption. The paper does not disclose its exact bridge. This is a leading unresolved timing issue, not a quantified explanation.
- **YTD accumulation:** no overlapping cumulative addition was found in our construction. Fiscal annual sums reconcile. Two direct Amazon standalone OCF cells differ by $1M from cumulative subtraction (2019/2020 Q2, same filing dates); retain as disclosure-precision discrepancies, not proof of a paper error.
- **Rounding:** displayed reference totals have 0.1B precision; our input disclosures mostly have 1M precision. Rounding can contribute, but it does not explain gaps of $1.313B in 2024 and $4.272B in 2025.
- **Author assumptions and original labels:** company-level author inputs and every historical rendered label are not captured; attribution of the remaining differences is unresolved.

## 2026 observed / guidance / estimate separation

Actuals are cash-flow observations from the captured SEC contexts, with source filing dates in the quarterly ledger. Microsoft latest filing July 29, 2026; Amazon July 31; Alphabet July 23; Meta July 30; Oracle September 11. These publication dates differ from the underlying periods and sometimes from earnings-release dates.

{table(['Company','Observed reporting period','Cash CapEx ($B)','GAAP OCF ($B)'],[[co.title(),next(r['reporting_start']+' to '+r['reporting_end'] for r in ytd if r['company']==co and r['metric']=='cash_capex'),b(next(r['value_usd'] for r in ytd if r['company']==co and r['metric']=='cash_capex')),b(next(r['value_usd'] for r in ytd if r['company']==co and r['metric']=='ocf'))] for co in ['microsoft','amazon','alphabet','meta','oracle']])}
Oracle's displayed period starts December 2025, not January 2026. We do not add it to the four January-June company totals or compare such a mixture to the paper's full year.

Verified guidance is separate: Microsoft approximately $175B for calendar 2026 under a lease-inclusive company capital-expenditure measure (July 29 call), and Meta $130-145B including finance lease principal (July 29 release). Microsoft attributes the reduction from about $190B to a shift in future leases from finance to operating classification, with investment expectations unchanged. That is a measurement distinction, not necessarily lower planned physical investment. Numerical annual CapEx guidance for Amazon, Alphabet and Oracle was not independently captured from a retrievable official transcript in this run; those cells remain null. We construct **no independent full-year estimates** and no five-company 2026 total.

A supplemental Oracle disclosure shows $11.363B of customer prepayments with a significant financing component inside its $23.103B Q1 FY2027 GAAP OCF. Its separately defined net cash outlay for capital expenditure is $17.966B versus $28.499B GAAP purchases. It also reports $19.909B net ATM stock issuance proceeds. These establish that external/customer financing transactions occurred; they do not establish counterfactual dependence from CapEx/OCF alone. In particular, a GAAP OCF denominator need not consist solely of internally earned cash. Those observations are retained separately and are not used to alter GAAP OCF.

## What the evidence establishes, and what it does not

A. Cash CapEx increased substantially: supported by the historical proxy and all company-level records.

B. Cash CapEx grew faster than OCF over the endpoints and in four of five annual changes: supported. It was not monotonic.

C. Aggregate CapEx/OCF increased overall, from 38.49% to 68.27%: supported for the clearly labeled proxy, not an exact five-company calendar aggregate.

D. Coverage differs across firms: supported, including Amazon's 2021-2022 cash-purchase excess and Oracle's 2025 shifted-period excess. Aggregate cash is not transferable evidence.

E. The narrow relative-coverage claim is **SUPPORTED BY THIS EVIDENCE**, within the proxy/vintage limits. Absolute residual dollars are still above 2020, and positive aggregate coverage persists through 2025. The broader financing-pressure argument is **PARTIALLY SUPPORTED**.

F. Actual external financing dependence, its necessity or causality is **NOT IDENTIFIED BY THIS EVIDENCE** from these two flows. Establishing it requires company cash/securities, debt and equity issuance/repayment, distributions, acquisitions and other investments, lease obligations, customer prepayments, commitments, transaction entities/guarantees, uses of funds and a credible cash-allocation/counterfactual bridge. A negative simple residual alone is not a distress finding.

These observations do not establish financial distress, a complete financing shortfall, credit risk, systemic risk, AI returns or bubble formation. There is no measured causal attribution to AI.

## Research charts and source register

Chart A: `research/ai-infrastructure-paper-validation/phase-a/chart-a-cash-capex-ocf.png` and `.svg`. Independent 2020-2025 cash CapEx versus OCF, USD billions, proxy scope visible.

Chart B: `research/ai-infrastructure-paper-validation/phase-a/chart-b-capex-ocf-ratio.png` and `.svg`. Company ratios and aggregate proxy, percent units, with Oracle's dates identified. Both charts were visually inspected; an initial footer overlap was corrected. The charts have no 2026 estimate series.

Primary source register: `research/ai-infrastructure-paper-validation/phase-a/source-register.json`. Supplemental official statements/guidance: `supplemental-source-register.json` and `supplemental-evidence.json` in the same directory. Paper-object version/hash: `paper-object-register.json`. Offline reproducibility uses the captured files, not changing live SEC endpoints.

## Missing observations and evidence limitations

Exact Oracle January-December totals, exact five-company calendar totals, the author's company inputs/calendar bridge, all original historical rendered line labels and three companies' numerical annual guidance remain unavailable. No source gaps are filled from the paper or unofficial financial estimates.

SEC companyfacts downloads succeeded for all five companies. Direct SEC archival HTML returned HTTP 403; several company-host release downloads produced access-denied pages even when the web tool could view the official page. The blocked HTML was not accepted as source data. Successful official Microsoft pages and Alphabet release PDF are archived; other web-viewed primary cells are retained in structured extracts. Full HTML provenance for those manual cells is weaker than an archived original document and remains a limitation. An Alphabet call endpoint was inaccessible; official release/slides did not establish numerical annual guidance. This run did not repeatedly retry blocked endpoints or use unofficial substitutes.

## Validation and handoff

The offline deterministic suite covers YTD differencing and an overlapping-period negative case, calendar dates, unit conversion, company completeness, aggregation, traceability and capture hashes, fiscal reconciliation, missing-data propagation, paper-input mutation isolation, 2026 separation, vintage selection/revisions, rebuild determinism and supplemental guidance isolation. Final test receipt is in `validation-results.json`. The production build and full `npm run verify` passed in the isolated worktree. Application acceptance adds no research conclusions to the production site.

Remaining research work: establish the exact Oracle/calendar bridge; obtain author company-level worksheets; verify per-vintage native filing labels and accounting revision causes; capture complete official 2026 guidance under consistent definitions. These gaps prevent an unqualified reproduction classification.

## Suggested Phase B questions

1. Which company-level definitions, vintages and Oracle month bridge reproduce the author's historical totals without unobservable monthly assumptions?
2. How much cash purchase spending is specifically attributable to AI, and how much is non-AI corporate investment?
3. How do cash, marketable securities, distributions, acquisitions, leases, customer prepayments and financing transactions change each firm's complete funding bridge?
4. Which entities own and finance the assets, and which guarantees, leases, purchase commitments or joint-venture obligations remain with the operating companies?
5. Can 2026 guidance and the paper's OCF estimates be traced to dated official inputs, under comparable periods and definitions, before assessing a projected crossing?
6. What realized cash flows, asset utilization, useful lives and contractual exposures would be required to investigate returns or risk separately?

## 中文研究摘要

本次独立研究仅纳入微软、亚马逊、Alphabet、Meta 和 Oracle。2020-2025 年所需的 120 个公司季度现金流组合均有 SEC 原始数据支持；但 Oracle 的季度截止日不能直接还原自然年，故采用明确标注的上一年 12 月至当年 11 月代理区间，精确自然年数值保持缺失。

首次披露口径下，五公司代理合计现金资本支出从 2020 年的 969.61 亿美元增至 2025 年的 4,115.28 亿美元；经营现金流从 2,519.30 亿美元增至 6,028.29 亿美元。资本支出与经营现金流之比从 38.49% 升至 68.27%，但并非逐年上升。2025 年资本支出比论文少 42.72 亿美元（1.027%）；租赁口径、历史修订及 Oracle 的时间对齐问题尚未完全解释差异。

图 1 的判定为“部分复现”。相对内部现金流覆盖趋紧这一狭义判断得到支持；更广泛的融资压力论点仅得到部分支持。仅凭这两项现金流，不能识别实际外部融资依赖、财务困境、系统性风险、AI 投资回报或泡沫。2026 年实际值、公司指引和估计严格分开，未把全年预测当作已发生事实。最终状态：PHASE A PARTIAL — SOURCE GAPS。未修改生产文件、合并、部署或新建自动运行。
'''
(ROOT.parents[2]/'docs/AI_INFRASTRUCTURE_PAPER_VALIDATION_PHASE_A.md').write_text(body)
if __name__=='__main__':print('Report written')
