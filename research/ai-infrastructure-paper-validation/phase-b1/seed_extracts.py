"""Reviewed primary rendered cells, explicitly separate from raw document captures.
Run only when reconstructing the reviewed input register; economic builder is offline.
"""
import json
from pathlib import Path
R=Path(__file__).resolve().parent
sources=[];obs=[]
def source(company,label,acc,date,end,document):
 cik=1018724 if company=='amazon' else 1341439
 sid=company+':'+acc
 sources.append(dict(source_id=sid,company=company,document_title=label,accession=acc,publication_date=date,
                     public_url=f'https://www.sec.gov/Archives/edgar/data/{cik}/{acc.replace("-","")}/{document}',
                     retrieved_at='2026-10-08',primary=True,raw_capture=None,raw_sha256=None,
                     capture_method='Official source read through web tool; human-checked structured cells only. No claim of archived original HTML.'))
 return sid
am={}
for y,acc,date in [(2023,'0001018724-24-000008','2024-02-02'),(2024,'0001018724-25-000004','2025-02-07'),(2025,'0001018724-26-000004','2026-02-06')]:
 am[y]=source('amazon',f'Amazon CY{y} 10-K',acc,date,f'{y}-12-31',f'amzn-{y}1231.htm')
am[2026]=source('amazon','Amazon H1 2026 10-Q','0001018724-26-000026','2026-07-31','2026-06-30','amzn-20260630.htm')
orq=source('oracle','Oracle FY2027 Q1 10-Q','0001193125-26-389274','2026-09-11','2026-08-31','orcl-20260831.htm')
# Supplemental FY2026 release is not substituted for first annual SEC vintage.
orf='oracle-fy2026-release'
sources.append(dict(source_id=orf,company='oracle',document_title='Oracle FY2026 official earnings release',publication_date='2026-06-10',
 public_url='https://investor.oracle.com/investor-news/news-details/2026/Oracle-Announces-Record-Q4-and-FY-2026-Results-Driven-by-Cloud-Infrastructure--Cloud-Applications/',
 retrieved_at='2026-10-08',primary=True,raw_capture=None,raw_sha256=None,capture_method='Official rendered cells; not archived HTML'))
def cell(company,start,end,metric,value,sid,locator,kind='FLOW',vintage='ORIGINAL',definition=None):
 src=next(x for x in sources if x['source_id']==sid)
 obs.append(dict(company=company,start=start,end=end,metric=metric,value_million=value,
 source_id=sid,source_url=src['public_url'],publication_date=src['publication_date'],accession=src.get('accession'),
 source_locator=locator,original_line_label=definition or metric,definition=definition or metric,kind=kind,
 vintage_policy=vintage,observed_or_estimated='OBSERVED_REPORTED' if kind!='FUTURE_COMMITMENT' else 'CONTRACTUAL_COMMITMENT'))
for y,proceeds,net,fcf in [(2023,4596,48133,36813),(2024,5341,77658,38219),(2025,3499,128320,11194)]:
 s,e=f'{y}-01-01',f'{y}-12-31'
 cell('amazon',s,e,'ppe_sales_incentives',proceeds,am[y],'Consolidated statements of cash flows; current-year investing column',definition='Proceeds from property and equipment sales and incentives')
 cell('amazon',s,e,'reported_net_cash_capex',net,am[y],'MD&A Non-GAAP Financial Measures; Free Cash Flow; current year',definition='Purchases of property and equipment, net of proceeds from sales and incentives')
 cell('amazon',s,e,'reported_company_fcf',fcf,am[y],'MD&A Non-GAAP Financial Measures; Free Cash Flow; current year',definition='Company-reported free cash flow')
 cell('amazon',s,e,'buybacks',0,am[y],'Note Stockholders Equity; Stock Repurchase Activity; explicit no repurchases',definition='No repurchases of common stock during stated year; disclosed zero, not missing-value imputation')
cell('amazon','2023-01-01','2023-12-31','short_term_borrowings',147,am[2023],'Note 6 Debt; other short-term working-capital credit facilities, 2023',kind='BALANCE_SHEET_STOCK',definition='Other short-term facilities; secured revolving credit facility 682 already inside long-term debt, do not add again')
cell('amazon','2026-01-01','2026-06-30','ppe_sales_incentives',2101,am[2026],'Cash flows page 3; six months ended June 30 2026 column',definition='Proceeds from property and equipment sales and incentives')
# Contractual tables: each component remains separate; near-term is not a new debt total.
for y,e,sid,schedule in [
 (2023,'2023-12-31',am[2023],{'debt_principal_interest':(10616,96872),'uncommenced_leases':(2034,38181),'purchase_obligations':(9432,35484),'other_commitments':(3273,16348),'financing_obligations_payments':(469,8641)}),
 (2024,'2024-12-31',am[2024],{'debt_principal_interest':(6858,85539),'uncommenced_leases':(2695,61627),'purchase_obligations':(8536,50375),'other_commitments':(2739,18629),'financing_obligations_payments':(511,9017)}),
 (2025,'2025-12-31',am[2025],{'debt_principal_interest':(5201,108202),'uncommenced_leases':(5808,96373),'purchase_obligations':(19906,84772),'other_commitments':(2956,18868),'financing_obligations_payments':(577,9615)}),
 (2026,'2026-06-30',am[2026],{'debt_principal_interest':(2361,220309),'uncommenced_leases':(4018,137214),'purchase_obligations':(23452,130065),'other_commitments':(2145,18366),'financing_obligations_payments':(352,11070)})]:
 for metric,(near,all_) in schedule.items():
  for horizon,val in [('near_term',near),('total',all_)]:
   cell('amazon',f'{y}-01-01',e,metric+'_'+horizon,val,sid,'Commitments note; '+(f'{y+1} calendar year' if y<2026 else 'remaining six months of 2026')+' and total columns',kind='FUTURE_COMMITMENT',definition=metric+'; '+horizon+'; includes only disclosed contractual scope, not AI-only and not additive to CapEx/debt stocks')
for metric,value in [('borrowings_current',7625),('borrowings_noncurrent',117712)]:
 cell('oracle','2026-06-01','2026-08-31',metric,value,orq,'Condensed balance sheets page 1, Notes payable and other borrowings; Aug 31 2026 column',kind='BALANCE_SHEET_STOCK',definition='Current or noncurrent notes payable and other borrowings; sum only these two non-overlapping carrying components')
# Individual current-period financing subcomponents remain in their own CF family.
for metric,value,label in [('common_equity_proceeds',19909,'Net proceeds from issuances of common stock via ATM'),('customer_financing_prepayments',11363,'Increase in deferred revenues from customer prepayments with significant financing component'),('capex_short_term_financing_net',-830,'Repayments of short-term financing related to capital expenditures, net'),('reported_company_fcf',-5396,'Company free cash flow'),('uncommenced_leases_total',288000,'Additional lease commitments not reflected on balance sheet, generally commence FY2027 Q2–FY2029; terms fifteen to nineteen years')]:
 cell('oracle','2026-06-01','2026-08-31',metric,value,orq,'Cash flows page 5 / Note 1 Customer Prepayments / Note 6 Leases and Other Commitments / MD&A Free cash flow',kind='FUTURE_COMMITMENT' if 'leases' in metric else 'FLOW',definition=label)
for metric,value,label in [('customer_financing_prepayments',4592,'Customer prepayments with significant financing component included in GAAP OCF'),('reported_company_fcf',-23686,'Reported FY2026 free cash flow'),('capex_short_term_financing_net',3345,'Short-term financing related to CapEx, net')]:
 cell('oracle','2025-06-01','2026-05-31',metric,value,orf,'FY2026 earnings release: cash flows / trailing four-quarter FCF / net cash outlay reconciliation',vintage='EARLIER_OFFICIAL_RELEASE_SEPARATE',definition=label)
(R/'primary-extracts.json').write_text(json.dumps(dict(schema_version='1.0',as_of='2026-10-08',sources=sources,observations=obs),indent=2,ensure_ascii=False)+'\n')
