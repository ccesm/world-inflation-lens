"""Reconstruct reviewed official cells; not a document downloader or independent re-read."""
import json
from pathlib import Path
R=Path(__file__).resolve().parent
B=R.parent/'phase-b1'
filings=json.loads((B/'primary-source-register.json').read_text())['filings']
sources=[]
for f in filings:
 doc=f'amzn-{f["end"].replace("-","")}.htm' if f['company']=='amazon' else f'orcl-{f["end"].replace("-","")}.htm'
 base=f['url'].rsplit('/',1)[0]+'/'
 sources.append(dict(source_id=f['source_id'],company=f['company'],accession=f['accession'],filed=f['filed'],period_end=f['end'],label=f['label'],period_start=f['start'],form=f['form'],publisher='SEC / '+f['company'].title(),document_identifier=doc,official_url=base+doc,raw_html_archived=False,
  evidence_method='Immutable Phase A SEC response plus reviewed official rendered cells; structured extracts are not original HTML',retrieved_at='2026-10-08'))
S={(s['company'],s['label']):s for s in sources}
obs=[];schedules=[];statements=[]
def cell(c,l,m,v,kind,loc,url=None,precision=1000000,note=''):
 s=S[c,l];oid=f'{c}:{l}:{m}:reviewed'
 obs.append(dict(observation_id=oid,company=c,label=l,metric=m,value_usd=v*1000000 if v is not None else None,native_value=v,native_unit='USD_MILLION',currency='USD',precision_usd=precision,kind=kind,source_id=s['source_id'],source_url=url or s['official_url'],accession=s['accession'],filed=s['filed'],period_start=s['period_start'] if 'CF' in kind or kind in ['LEASE_CASH_PAYMENT','NONCASH_UNPAID_CAPEX'] else None,period_end=s['period_end'],source_locator=loc,verification='PRIMARY_MANUALLY_VERIFIED_EXTRACT',note=note))
 return oid
def table(c,l,fam,values,loc,first_year,quarter=False,total=None,url=None):
 # Original calendar/fiscal year columns, not inferred rolling periods.
 end_year=first_year+len(values)-2
 labels=([f'Remainder of {first_year}'] if quarter else [str(first_year)])+[str(y) for y in range(first_year+1,end_year+1)]+['Thereafter']
 rows=[]
 for i,(label,v) in enumerate(zip(labels,values)):
  oid=cell(c,l,f'{fam}:bucket:{i}',v,'CONTRACTUAL_PAYMENT',loc+'; '+label,url)
  rows.append(dict(native_bucket=label,observation_id=oid))
 control=cell(c,l,f'{fam}:total',total,'CONTRACTUAL_PAYMENT',loc+'; reported total',url) if total is not None else None
 schedules.append(dict(company=c,label=l,family=fam,buckets=rows,reported_total_ref=control,period_basis='NATIVE_CALENDAR_COLUMNS_NOT_ROLLING_12M' if quarter else 'NATIVE_FISCAL_YEAR' if c=='oracle' else 'CALENDAR_YEAR',scope='Company-disclosed contractual schedule; not AI allocation',verification='PRIMARY_MANUALLY_VERIFIED_EXTRACT'))
# Amazon original Note 7 / H1 Note 4 contractual tables: no issuer headline total imported.
sets={
 'CY2023':(2024,False,{'debt_principal_interest':[10616,7175,4858,10404,3643,60176,96872],'financing_obligations':[469,462,468,476,484,6282,8641],'uncommenced_leases':[2034,2620,2836,2852,2979,24860,38181],'purchase_obligations':[9432,7823,5901,4463,1912,5953,35484],'other_commitments':[3273,1390,1125,759,680,9121,16348]}),
 'CY2024':(2025,False,{'debt_principal_interest':[6858,4458,10404,3644,4344,55831,85539],'financing_obligations':[511,515,523,531,540,6397,9017],'uncommenced_leases':[2695,3691,5011,4253,4286,41691,61627],'purchase_obligations':[8536,7941,5413,4321,3868,20296,50375],'other_commitments':[2739,1470,1016,923,1025,11456,18629]}),
 'CY2025':(2026,False,{'debt_principal_interest':[5201,11250,6891,4993,6381,73486,108202],'financing_obligations':[577,582,592,601,612,6651,9615],'uncommenced_leases':[5808,9103,6420,6571,6738,61733,96373],'purchase_obligations':[19906,8934,7195,6658,6602,35477,84772],'other_commitments':[2956,1578,1120,1000,988,11226,18868]}),
 '2026H1':(2026,True,{'debt_principal_interest':[2361,14060,17087,13528,11112,162161,220309],'financing_obligations':[352,682,694,706,720,7916,11070],'uncommenced_leases':[4018,11732,9278,9483,9227,93476,137214],'purchase_obligations':[23452,33026,9326,7961,7659,48641,130065],'other_commitments':[2145,2044,1212,1008,963,10994,18366],'operating_lease':[9336,14765,13924,12599,11269,54457,116350],'finance_lease':[1088,1775,1885,1482,1269,9161,16660]})}
for l,(year,q,fs) in sets.items():
 for fam,vs in fs.items():table('amazon',l,fam,vs[:-1],'Note 4 Commitments p.15' if q else 'Note 7 Commitments',year,q,vs[-1])
# Oracle independent rendered schedule controls; cash-flow and balance-sheet values remain distinct.
for l,total,doc in [('FY2025',92947,'R17.htm'),('FY2026',130105,'R17.htm')]:
 s=S['oracle',l];cell('oracle',l,'debt_maturity_total',total,'CONTRACTUAL_PRINCIPAL','Note 6 future principal; total',s['official_url'].rsplit('/',1)[0]+'/'+doc,note='FY2025 adjusted for cross-currency swaps; not the unadjusted face or carrying amount')
for l,v in [('FY2024',22900),('FY2025',43400),('FY2026',260000),('FY2027Q1',288000)]:
 s=S['oracle',l];url=s['official_url'] if l=='FY2027Q1' else s['official_url'].rsplit('/',1)[0]+'/R20.htm'
 cell('oracle',l,'uncommenced_leases_total',v,'FUTURE_COMMITMENT','Leases note; excluded from recognized liability maturity table',url,precision=100000000,note='Different commencement windows/terms by vintage; not current debt; potential overlap with guarantees and future capital investment')
for l,v in [('FY2025',27),('FY2026',452),('FY2027Q1',186)]:
 s=S['oracle',l];url=s['official_url'] if l=='FY2027Q1' else s['official_url'].rsplit('/',1)[0]+'/R20.htm'
 cell('oracle',l,'finance_lease_cash_paid_total',v,'LEASE_CASH_PAYMENT','Lease note supplemental cash flow; cash paid for measured lease liabilities',url,note='Not separately disclosed principal; do not subtract accrued interest expense')
cell('oracle','FY2026','lessor_borrowing_guarantee_maximum',3300,'CONTINGENT_SUPPORT','Note 9; lease included in additional commitments; lessor borrowing matures September 2026',S['oracle','FY2026']['official_url'].rsplit('/',1)[0]+'/R20.htm',precision=100000000,note='Maximum conditional support, not debt or expected loss; status after maturity unverified')
cell('oracle','FY2026','subsequent_purchase_commitment',19000,'SUBSEQUENT_EVENT','Note 9; after May 31; cloud infrastructure assets FY2027 start, five-year term',S['oracle','FY2026']['official_url'].rsplit('/',1)[0]+'/R20.htm',precision=1000000000,note='Not included in May 31 13.309B schedule; do not add to August 31 schedule without contract overlap evidence')
# Correctly anchor the exact customer cash-flow line to the ORIGINAL annual SEC statement.
for l,metrics in {'FY2026':{'customer_financing_prepaid_cf':4592,'other_deferred_revenue_cf_adjustment':50,'capex_short_term_financing_net':3345,'employee_or_common_stock_net':1449,'buybacks_cf':-95,'withholding_share_repurchases_cf':-111,'preferred_stock_net':4954,'dividends_cf':-5787,'commercial_paper_net_cf':-2285,'senior_term_other_proceeds_cf':46093,'senior_term_other_repayments_cf':-6942,'other_financing_cf':-337,'unpaid_capex':5279},'FY2027Q1':{'customer_financing_prepaid_cf':11363,'other_deferred_revenue_cf_adjustment':3997,'atm_equity_net_cf':19909,'employee_stock_net_cf':41,'dividends_cf':-1565,'commercial_paper_net_cf':0,'capex_short_term_financing_net':-830,'senior_term_other_repayments_cf':-4202,'other_financing_cf':-242,'unpaid_capex':6247}}.items():
 for m,v in metrics.items():
  s=S['oracle',l];url=s['official_url'] if l=='FY2027Q1' else s['official_url'].rsplit('/',1)[0]+'/R8.htm'
  cell('oracle',l,m,v,'INDIRECT_CF_ADJUSTMENT_ALREADY_IN_OCF' if 'deferred' in m or 'prepaid' in m else 'NONCASH_UNPAID_CAPEX' if m=='unpaid_capex' else 'FINANCING_CASH_FLOW','Original consolidated cash flow statement; current-period column',url)
cell('amazon','2026H1','financing_obligation_principal_paid',174,'FINANCING_CASH_FLOW','Consolidated cash flows p.3; six months ended June 30, 2026; principal repayments of financing obligations',note='Positive payment magnitude; subtract in financing reconciliation, not finance lease payments')
# Financial credit terms / customer accounting: paraphrased source-derived facts, no inferred compliance.
def fact(c,l,field,value,loc,url=None):
 s=S[c,l]
 native={'revolver':[('commitment',10,'USD_BILLION')], 'term_loan':[('outstanding',5137,'USD_MILLION')], 'revolvers':[('long_commitment',15,'USD_BILLION'),('short_commitment',5,'USD_BILLION')], 'delayed_draw_term_loan':[('commitment',17.5,'USD_BILLION')], 'subsequent_notes':[('amount',25,'USD_BILLION')]}.get(field,[])
 classification='CONTRACT_TERMS' if native or field in ['covenant','notes_covenants'] else 'CUSTOMER_ACCOUNTING_POLICY' if 'customer' in field or 'unearned' in field else 'DISCLOSURE_DEFINITION'
 statements.append(dict(native_amounts=[dict(field=k,original_amount=v,original_unit=u,currency='USD') for k,v,u in native],accounting_classification=classification,calculation_method='Official disclosed terms; no inferred amount',statement_id=f'{c}:{l}:{field}',company=c,label=l,field=field,value=value,source_id=s['source_id'],source_url=url or s['official_url'],source_locator=loc,filed=s['filed'],effective_at=s['period_end'],verification='PRIMARY_MANUALLY_VERIFIED_EXTRACT'))
orf=S['oracle','FY2026']['official_url'].rsplit('/',1)[0]+'/R17.htm'
fact('oracle','FY2026','revolver',dict(commitment_usd=10000000000,outstanding_usd=0,maturity='2031-03-06',conditions='Subject to representations, covenants, events of default; not unconditional liquidity'), 'Note 6 Revolving Credit Agreement',orf)
fact('oracle','FY2026','covenant',dict(formula='Agreement-defined Consolidated EBITDA / Consolidated Net Interest Expense',minimum=3.0,reported_compliance='COMPANY_REPORTED_COMPLIANCE_AT_2026_05_31',independently_tested=False),'Note 6 debt covenants',orf)
fact('oracle','FY2026','term_loan',dict(outstanding_usd=5137000000,maturity='2027-08-16',extension='Company option up to two years, then lender option up to two years; not assumed exercised',repayments='1.25% quarterly through June 2026; 2.50% quarterly September 2026–June 2027; remaining balance at maturity'),'Note 6 Term Loan 2',orf)
fact('oracle','FY2027Q1','customer_funding',dict(cash_received=True,liability='Effects reflected in deferred revenue over performance period',ocf_included=True,service_obligation=True,refund_or_repayment_rights='UNAVAILABLE',customer_specific_amounts='UNAVAILABLE',full_rollforward='UNAVAILABLE'),'Note 1 Customer Prepayments / Note 5 Deferred Revenue')
fact('oracle','FY2025','no_finance_leases_fy2024',True,'Note 9 explicit no finance leases in FY2024',S['oracle','FY2025']['official_url'].rsplit('/',1)[0]+'/R20.htm')
fact('amazon','2026H1','unearned_revenue_policy',dict(paid_or_due=True,contemporaneous_cash_received='NOT_IDENTIFIED_FROM_STOCK',total_at_june30='NOT_SEPARATELY_REPORTED',refund_or_repayment_rights='UNAVAILABLE',contract_specific_receipts='UNAVAILABLE'),'Note 1 Unearned Revenue')
fact('amazon','2026H1','revolvers',dict(long_commitment_usd=15000000000,short_commitment_usd=5000000000,outstanding_usd=0,long_maturity='2028-11',short_maturity='2026-10',extension='Lender approval required; not assumed',conditions='Availability subject to agreement terms; full covenant conditions not independently hydrated'),'Note 5 Debt pp.17–18')
fact('amazon','2026H1','delayed_draw_term_loan',dict(commitment_usd=17500000000,outstanding_usd=0,draw_deadline='2026-09-30',maturity='Three years from borrowing',subsequent_draw='UNAVAILABLE',available_at_as_of='NOT_ASSUMED_AFTER_DEADLINE'),'Note 5 Debt p.18')
fact('amazon','2026H1','notes_covenants',dict(financial_covenants='Company reports none under Notes',scope='Notes only, not all credit facilities or obligations',independently_audited=False),'Note 5 Debt p.17')
fact('amazon','2026H1','subsequent_notes',dict(amount_usd=25000000000,maturities='2029–2066',purpose='General corporate purposes',included_in_june30_debt=False),'Note 5 subsequent event p.18')
fact('oracle','FY2027Q1','quarter_maturity_xbrl_warning','NextTwelveMonths tags correspond to next complete fiscal-year columns, not rolling 12 months','Note 6 lease maturities p.13')
fact('amazon','2026H1','quarter_maturity_xbrl_warning','NextTwelveMonths tags correspond to CY2027 columns, not rolling 12 months','Note 4 commitments p.15')
(R/'reviewed-evidence.json').write_text(json.dumps(dict(schema_version='b2-input-1',as_of='2026-10-08',sources=sources,observations=obs,schedules=schedules,statements=statements),indent=2,ensure_ascii=False)+'\n')
