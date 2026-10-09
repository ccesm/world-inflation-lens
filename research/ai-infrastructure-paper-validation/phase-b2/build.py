"""B2 offline obligations validation. No network, acceptance, production writes or forecasts."""
import csv,datetime as dt,gzip,hashlib,json
from pathlib import Path
from urllib.parse import urlparse
R=Path(__file__).resolve().parent
A=R.parent/'phase-a';B=R.parent/'phase-b1'
BASE='8e7d637a171de15c8f5c30b0896cae4400fdef70'
AS_OF='2026-10-08';VERSION='b2.1'
def sha(b):return hashlib.sha256(b).hexdigest()
def load(p):return json.loads(p.read_text())
def dump(n,v):(R/n).write_text(json.dumps(v,indent=2,ensure_ascii=False,sort_keys=True)+'\n')
def total(v):return None if not v or any(x is None for x in v) else sum(v)
def ratio(a,b):return None if a is None or b is None or b<=0 else a/b
def exact(us,tag,acc,end,start=None):
 rows=[x for x in us.get(tag,{}).get('units',{}).get('USD',[]) if x['accn']==acc and x['end']==end and x.get('start')==start and x['filed']<=AS_OF]
 vals={x['val'] for x in rows}
 return (next(iter(vals)),'PRIMARY_XBRL_VERIFIED',rows) if len(vals)==1 else (None,'CONFLICT_REQUIRES_REVIEW' if vals else 'UNAVAILABLE',rows)
def coarse(buckets):
 """Only annual-end buckets allow exact month bands. Quarter columns stay native."""
 if len(buckets)!=6 or any(b.get('months') is None for b in buckets):return None
 v=[b['value_usd'] for b in buckets]
 return {'WITHIN_12_MONTHS':v[0],'12_24_MONTHS':v[1],'24_36_MONTHS':v[2],'36_60_MONTHS':total(v[3:5]),'BEYOND_60_MONTHS':v[5]}
def reconcile(buckets,control):
 s=total([b['value_usd'] for b in buckets]);delta=None if s is None or control is None else s-control
 return dict(bucket_sum_usd=s,reported_total_usd=control,difference_usd=delta,status='RECONCILED' if delta==0 else 'UNAVAILABLE_CONTROL' if delta is None else 'CONFLICT_REQUIRES_REVIEW')
def validate_reviewed(d):
 ss={s['source_id']:s for s in d['sources']};seen=set()
 if d['as_of']!=AS_OF:raise ValueError('Explicit as-of mismatch')
 if len(ss)!=len(d['sources']):raise ValueError('Duplicate source')
 for s in ss.values():
  u=urlparse(s['official_url'])
  if u.scheme!='https' or u.hostname!='www.sec.gov' or u.username or u.password:raise ValueError('Unofficial source')
  filed=dt.date.fromisoformat(s['filed']);end=dt.date.fromisoformat(s['period_end'])
  if end>filed:raise ValueError('Invalid filing period')
  if filed>dt.date.fromisoformat(AS_OF):raise ValueError('Future disclosure')
 for o in d['observations']:
  s=ss.get(o['source_id'])
  if not s or s['company']!=o['company'] or s['accession']!=o['accession'] or s['filed']!=o['filed']:raise ValueError('Source identity mismatch')
  if o['observation_id'] in seen:raise ValueError('Duplicate observation')
  seen.add(o['observation_id'])
  if o['currency']!='USD' or o['native_unit']!='USD_MILLION':raise ValueError('Unit mismatch')
  if o['native_value'] is not None and o['value_usd']!=o['native_value']*1000000:raise ValueError('Scale mismatch')
  if o['period_end']!=s['period_end']:raise ValueError('Period identity mismatch')
  if not o['source_locator']:raise ValueError('Missing locator')
  u=urlparse(o['source_url'])
  if u.scheme!='https' or u.hostname!='www.sec.gov' or u.username or u.password or u.query:raise ValueError('Unsafe source URL')
  if '/'+o['accession'].replace('-','')+'/' not in o['source_url']:raise ValueError('Wrong filing URL')
 for t in d['schedules']:
  if any(x['observation_id'] not in seen for x in t['buckets']):raise ValueError('Unknown bucket reference')
  if t['reported_total_ref'] not in seen:raise ValueError('Missing total reference')
 for s in d['statements']:
  u=urlparse(s['source_url'])
  if u.scheme!='https' or u.hostname!='www.sec.gov' or not s['source_locator']:raise ValueError('Unsafe statement provenance')
  if s['source_id'] not in ss or s['filed']!=ss[s['source_id']]['filed']:raise ValueError('Unknown statement source')
def build():
 lock=load(R/'input-lock.json')
 if lock['base_commit']!=BASE:raise ValueError('Wrong base')
 for name,h in lock['files'].items():
  if sha((R.parent/name).read_bytes())!=h:raise ValueError('Inherited evidence changed: '+name)
 d=load(R/'reviewed-evidence.json');validate_reviewed(d)
 bs=load(B/'funding-bridges.json');observations=list(d['observations']);index={o['observation_id']:o for o in observations}
 snapshots={c:json.load(gzip.open(A/'sources'/f'{c}-companyfacts.json.gz'))['facts']['us-gaap'] for c in ['oracle','amazon']}
 receipts=[];selected_contexts=[]
 def field(b,m,tag,start=None,kind='BALANCE_SHEET_STOCK',precision=1000000):
  val,status,rr=exact(snapshots[b['company']],tag,b['accession'],b['end'],start)
  oid=f'{b["company"]}:{b["label"]}:{m}:xbrl'
  o=dict(observation_id=oid,company=b['company'],label=b['label'],metric=m,value_usd=val,currency='USD',native_unit='USD',native_value=val,precision_usd=precision,kind=kind,source_id=b['source_id'],source_url=f'https://www.sec.gov/Archives/edgar/data/{1341439 if b["company"]=="oracle" else 1018724}/{b["accession"].replace("-","")}/'+f'{"orcl" if b["company"]=="oracle" else "amzn"}-{b["end"].replace("-","")}.htm',filed=b['filed'],accession=b['accession'],period_start=start,period_end=b['end'],source_locator='us-gaap:'+tag+'; exact accession/start/end/USD',verification=status,taxonomy_label=snapshots[b['company']].get(tag,{}).get('label'),original_line_label=None,source_snapshot_sha=sha(gzip.decompress((A/'sources'/f'{b["company"]}-companyfacts.json.gz').read_bytes())))
  if b['company']=='oracle' and m=='finance_lease_principal' and val is not None:
   o['semantic_review']='REVIEW_REQUIRED_NATIVE_TABLE_LABEL_IS_TOTAL_FINANCE_LEASE_CASH_PAID; tagged principal retained as source fact, not independently confirmed split'
  observations.append(o);index[oid]=o
  selected_contexts.append(dict(observation_id=oid,tag=tag,contexts=rr))
  return o
 def reviewed(c,l,m):return index.get(f'{c}:{l}:{m}:reviewed')
 schedules=[]
 suffix=['NextTwelveMonths','YearTwo','YearThree','YearFour','YearFive','AfterYearFive']
 debt_tags=['LongTermDebtMaturitiesRepaymentsOfPrincipalInNextTwelveMonths']+[f'LongTermDebtMaturitiesRepaymentsOfPrincipalInYear{x}' for x in ['Two','Three','Four','Five']]+['LongTermDebtMaturitiesRepaymentsOfPrincipalAfterYearFive']
 for b in bs:
  c,l=b['company'],b['label'];annual=b['form']=='10-K';year=int(b['end'][:4])+1
  def x_schedule(fam,tags,control_tag,kind='CONTRACTUAL_PAYMENT'):
   buck=[]
   for i,tag in enumerate(tags):
    o=field(b,f'{fam}:bucket:{i}',tag,kind=kind)
    buck.append(dict(native_bucket=str(year+i) if i<5 else 'Thereafter',months=[i*12,(i+1)*12] if i<5 else [60,None],value_usd=o['value_usd'],observation_id=o['observation_id']))
   control=field(b,f'{fam}:total',control_tag,kind=kind) if control_tag else None
   if fam=='debt_principal' and c=='oracle':
    control=reviewed(c,l,'debt_maturity_total')
   rec=reconcile(buck,control['value_usd'] if control else None)
   sch=dict(company=c,label=l,family=fam,as_of_period_end=b['end'],filed=b['filed'],source_id=b['source_id'],period_basis=b['basis'],native_buckets=buck,coarse_month_bands=coarse(buck),reported_total_ref=control['observation_id'] if control else None,reconciliation=rec,scope='FY2025 borrowing principal adjusted for cross-currency swaps; FY2023/24 rendered control and adjustment basis not independently qualified' if c=='oracle' and fam=='debt_principal' and l!='FY2026' else 'Reported long-term debt principal' if fam=='debt_principal' else 'Recognized lease undiscounted payments' if 'lease' in fam else 'Purchase and other obligations; scope changes by vintage',not_ai_specific=True)
   schedules.append(sch);return sch
  if annual:
   x_schedule('debt_principal',debt_tags,'LongTermDebt' if c=='amazon' else None,'CONTRACTUAL_PRINCIPAL')
   for fam,prefix in [('operating_lease','LesseeOperatingLeaseLiabilityPaymentsDue'),('finance_lease','FinanceLeaseLiabilityPaymentsDue')]:
    # Oracle FY2023/24 absent finance lease contexts remain absent, never fabricated zero.
    x_schedule(fam,[prefix+x for x in suffix],prefix)
   x_schedule('purchase_obligations',['UnrecordedUnconditionalPurchaseObligationBalanceOn'+x+'Anniversary' for x in ['First','Second','Third','Fourth','Fifth']]+['UnrecordedUnconditionalPurchaseObligationDueAfterFiveYears'],'UnrecordedUnconditionalPurchaseObligationBalanceSheetAmount')
  elif c=='oracle':
   for fam,prefix in [('operating_lease','LesseeOperatingLeaseLiabilityPaymentsDue'),('finance_lease','FinanceLeaseLiabilityPaymentsDue')]:
    tags=[prefix.replace('PaymentsDue','PaymentsRemainderOfFiscalYear')]+[prefix+x for x in suffix]
    buck=[]
    for i,tag in enumerate(tags):
     o=field(b,f'{fam}:bucket:{i}',tag,kind='CONTRACTUAL_PAYMENT')
     buck.append(dict(native_bucket=f'Remainder of FY{year}' if i==0 else f'FY{year+i}' if i<6 else 'Thereafter',months=None,value_usd=o['value_usd'],observation_id=o['observation_id']))
    ctrl=field(b,f'{fam}:total',prefix,kind='CONTRACTUAL_PAYMENT')
    schedules.append(dict(company=c,label=l,family=fam,as_of_period_end=b['end'],filed=b['filed'],source_id=b['source_id'],period_basis='NATIVE_FISCAL_COLUMNS_NOT_ROLLING_12M',native_buckets=buck,coarse_month_bands=None,reported_total_ref=ctrl['observation_id'],reconciliation=reconcile(buck,ctrl['value_usd']),scope='Recognized lease undiscounted payments; excludes uncommenced leases',not_ai_specific=True))
   tags=['UnrecordedUnconditionalPurchaseObligationDueInRemainderOfFiscalYear']+['UnrecordedUnconditionalPurchaseObligationBalanceOn'+x+'Anniversary' for x in ['First','Second','Third','Fourth','Fifth']]+['UnrecordedUnconditionalPurchaseObligationDueAfterFiveYears']
   buck=[]
   for i,tag in enumerate(tags):
    o=field(b,f'purchase_obligations:bucket:{i}',tag,kind='CONTRACTUAL_PAYMENT')
    buck.append(dict(native_bucket=f'Remainder of FY{year}' if i==0 else f'FY{year+i}' if i<6 else 'Thereafter',months=None,value_usd=o['value_usd'],observation_id=o['observation_id']))
   ctrl=field(b,'purchase_obligations:total','UnrecordedUnconditionalPurchaseObligationBalanceSheetAmount',kind='CONTRACTUAL_PAYMENT')
   schedules.append(dict(company=c,label=l,family='purchase_obligations',as_of_period_end=b['end'],filed=b['filed'],source_id=b['source_id'],period_basis='NATIVE_FISCAL_COLUMNS_NOT_ROLLING_12M',native_buckets=buck,coarse_month_bands=None,reported_total_ref=ctrl['observation_id'],reconciliation=reconcile(buck,ctrl['value_usd']),scope='Cloud infrastructure components and data-center power; not all AI',not_ai_specific=True))
  # Lease liability bridge: undiscounted payments - imputed interest = reported PV.
  for fam,prefix,pv in [('operating_lease','LesseeOperatingLeaseLiability','OperatingLeaseLiability'),('finance_lease','FinanceLeaseLiability','FinanceLeaseLiability')]:
   if (c=='amazon' and not annual):continue # totals/stock still extracted below
   pay=field(b,f'{fam}:gross_control',prefix+'PaymentsDue',kind='CONTRACTUAL_PAYMENT')
   interest=field(b,f'{fam}:imputed_interest',prefix+'UndiscountedExcessAmount',kind='DISCOUNT_RECONCILIATION_NOT_INTEREST_CASH_SCHEDULE')
   liability=field(b,f'{fam}:liability_control',pv)
   delta=total([pay['value_usd'],-interest['value_usd'] if interest['value_usd'] is not None else None,-liability['value_usd'] if liability['value_usd'] is not None else None])
   receipts.append(dict(company=c,label=l,check=fam+':discounted_liability',difference_usd=delta,status='RECONCILED' if delta==0 else 'UNAVAILABLE' if delta is None else 'CONFLICT_REQUIRES_REVIEW',source_refs=[x['observation_id'] for x in [pay,interest,liability]]))
  for m,t,kind,start,precision in [
   ('finance_lease_principal','FinanceLeasePrincipalPayments','FINANCING_CASH_FLOW',b['start'],1000000),('operating_lease_cash_paid','OperatingLeasePayments','OPERATING_CASH_FLOW_ALREADY_IN_OCF',b['start'],1000000),('finance_lease_noncash_additions','RightOfUseAssetObtainedInExchangeForFinanceLeaseLiability','NONCASH_ADDITION',b['start'],1000000),('finance_lease_interest_expense','FinanceLeaseInterestExpense','ACCRUED_INTEREST_EXPENSE',b['start'],1000000),
   ('deferred_revenue_current','ContractWithCustomerLiabilityCurrent','BALANCE_SHEET_STOCK',None,1000000),('deferred_revenue_noncurrent','ContractWithCustomerLiabilityNoncurrent','BALANCE_SHEET_STOCK',None,100000000 if c=='amazon' else 1000000),('deferred_revenue_total','ContractWithCustomerLiability','BALANCE_SHEET_STOCK',None,100000000 if c=='amazon' else 1000000),('revenue_from_opening_deferred','ContractWithCustomerLiabilityRevenueRecognized','RECOGNIZED_REVENUE_NOT_CASH_RECEIPTS',b['start'],100000000),('debt_principal_native_amount','DebtInstrumentCarryingAmount' if c=='oracle' else 'LongTermDebt','DEBT_NATIVE_GROSS_NOT_B1_CARRYING',None,1000000)]:field(b,m,t,start,kind,precision)
 for t in d['schedules']:
  if any(s['company']==t['company'] and s['label']==t['label'] and s['family']==t['family'] for s in schedules):
   # Missing standard tags are not contradictory values. Retain absent observations,
   # and use the reviewed native table only when every available tag agrees.
   existing=next(s for s in schedules if s['company']==t['company'] and s['label']==t['label'] and s['family']==t['family'])
   native=[index[x['observation_id']]['value_usd'] for x in t['buckets']]
   tagged=[x['value_usd'] for x in existing['native_buckets']]
   if len(tagged)!=len(native) or any(a is not None and a!=b for a,b in zip(tagged,native)):
    raise ValueError(f'Rendered/XBRL schedule conflict: {t["company"]} {t["label"]} {t["family"]}')
   if all(x is not None for x in tagged):continue
   schedules.remove(existing)
  annual=t['label']!='2026H1';b=next(x for x in bs if x['company']==t['company'] and x['label']==t['label'])
  buck=[dict(x,value_usd=index[x['observation_id']]['value_usd'],months=[i*12,(i+1)*12] if i<5 else [60,None]) for i,x in enumerate(t['buckets'])]
  if not annual:
   for x in buck:x['months']=None
  ctrl=index[t['reported_total_ref']]
  schedules.append(dict(**t,as_of_period_end=b['end'],filed=b['filed'],source_id=b['source_id'],native_buckets=buck,coarse_month_bands=coarse(buck),reconciliation=reconcile(buck,ctrl['value_usd']),not_ai_specific=True))
 # Add latest Amazon lease PV checks after its manually qualified native buckets.
 b=next(b for b in bs if b['company']=='amazon' and b['label']=='2026H1')
 for fam,prefix,pv in [('operating_lease','LesseeOperatingLeaseLiability','OperatingLeaseLiability'),('finance_lease','FinanceLeaseLiability','FinanceLeaseLiability')]:
  xs=[field(b,f'{fam}:gross_control',prefix+'PaymentsDue',kind='CONTRACTUAL_PAYMENT'),field(b,f'{fam}:imputed_interest',prefix+'UndiscountedExcessAmount',kind='DISCOUNT_RECONCILIATION_NOT_INTEREST_CASH_SCHEDULE'),field(b,f'{fam}:liability_control',pv)]
  delta=total([xs[0]['value_usd'],-xs[1]['value_usd'] if xs[1]['value_usd'] is not None else None,-xs[2]['value_usd'] if xs[2]['value_usd'] is not None else None])
  receipts.append(dict(company='amazon',label='2026H1',check=fam+':discounted_liability',difference_usd=delta,status='RECONCILED' if delta==0 else 'UNAVAILABLE' if delta is None else 'CONFLICT_REQUIRES_REVIEW',source_refs=[x['observation_id'] for x in xs]))
 # Only identical original-period scope permits principal+interest minus principal.
 derived=[]
 for b in bs:
  if b['company']!='amazon' or b['form']!='10-K':continue
  p=next(s for s in schedules if s['company']=='amazon' and s['label']==b['label'] and s['family']=='debt_principal')
  both=next(s for s in schedules if s['company']=='amazon' and s['label']==b['label'] and s['family']=='debt_principal_interest')
  vals=[x['value_usd']-y['value_usd'] for x,y in zip(both['native_buckets'],p['native_buckets'])]
  if any(v<0 for v in vals):raise ValueError('Interest scope mismatch')
  derived.append(dict(company='amazon',label=b['label'],family='contractual_debt_interest',value_usd=vals,formula='Native same-vintage long-term debt principal+interest minus principal; no coupon estimation',native_buckets=[x['native_bucket'] for x in p['native_buckets']],source_refs=[both['reported_total_ref'],p['reported_total_ref']],forecast=False))
 # Oracle financing subtotals, with native signs, no invented missing category.
 for l,ms in [('FY2026',['employee_or_common_stock_net','buybacks_cf','withholding_share_repurchases_cf','preferred_stock_net','dividends_cf','commercial_paper_net_cf','capex_short_term_financing_net','senior_term_other_proceeds_cf','senior_term_other_repayments_cf','other_financing_cf']),('FY2027Q1',['atm_equity_net_cf','employee_stock_net_cf','dividends_cf','commercial_paper_net_cf','capex_short_term_financing_net','senior_term_other_repayments_cf','other_financing_cf'])]:
  oo=[reviewed('oracle',l,m) for m in ms];b=next(x for x in bs if x['company']=='oracle' and x['label']==l)
  v=total([x['value_usd'] for x in oo]);delta=v-b['reported_values_usd']['financing_cf']
  receipts.append(dict(company='oracle',label=l,check='financing_subcomponents',difference_usd=delta,status='RECONCILED' if delta==0 else 'CONFLICT_REQUIRES_REVIEW',source_refs=[x['observation_id'] for x in oo]+[b['source_refs']['financing_cf']]))
 # Amazon finance leases and financing obligations are separate payment classes.
 b=next(x for x in bs if x['company']=='amazon' and x['label']=='2026H1');v=b['reported_values_usd']
 keys=['debt_proceeds','debt_repayments','short_term_proceeds_and_other','short_term_repayments_and_other','finance_lease_principal']
 extra=reviewed('amazon','2026H1','financing_obligation_principal_paid')
 net=v[keys[0]]-v[keys[1]]+v[keys[2]]-v[keys[3]]-v[keys[4]]-extra['value_usd']
 receipts.append(dict(company='amazon',label='2026H1',check='financing_subcomponents',difference_usd=net-v['financing_cf'],status='RECONCILED' if net==v['financing_cf'] else 'CONFLICT_REQUIRES_REVIEW',source_refs=[b['source_refs'][k] for k in keys]+[extra['observation_id'],b['source_refs']['financing_cf']]))
 # Supplemental B2-vs-B1 evidence checks, no overwrites.
 cross=[]
 for o in d['observations']:
  b=next(x for x in bs if x['company']==o['company'] and x['label']==o['label'])
  aliases={'customer_financing_prepaid_cf':'customer_financing_prepayments','uncommenced_leases_total':'uncommenced_leases_total','capex_short_term_financing_net':'capex_short_term_financing_net'}
  m=aliases.get(o['metric']);old=b['reported_values_usd'].get(m) if m else None
  if m:cross.append(dict(company=o['company'],label=o['label'],metric=m,b1_value_usd=old,b2_value_usd=o['value_usd'],status='MATCH' if old==o['value_usd'] else 'B1_UNAVAILABLE_NEW_EVIDENCE' if old is None else 'CONFLICT_REQUIRES_REVIEW',b2_ref=o['observation_id']))
 customer=[]
 for b in bs:
  c,l=b['company'],b['label'];cur=index[f'{c}:{l}:deferred_revenue_current:xbrl'];non=index[f'{c}:{l}:deferred_revenue_noncurrent:xbrl'];reported=index[f'{c}:{l}:deferred_revenue_total:xbrl']
  approx=total([cur['value_usd'],non['value_usd']]);delta=None if approx is None or reported['value_usd'] is None else approx-reported['value_usd']
  customer.append(dict(company=c,label=l,period_end=b['end'],current_usd=cur['value_usd'],noncurrent_usd=non['value_usd'],reported_total_usd=reported['value_usd'],component_sum_usd=approx,component_sum_status='MIXED_PRECISION_APPROXIMATION_NOT_REPORTED_TOTAL' if c=='amazon' else 'EXACT_AT_DISCLOSED_PRECISION',component_vs_total_difference_usd=delta,total_not_cash_receipts=True,source_refs=[cur['observation_id'],non['observation_id'],reported['observation_id']],full_customer_cash_rollforward=None,refund_rights='UNAVAILABLE',contract_specific_receipts='UNAVAILABLE'))
 # Explicit incomplete stock/CF reconciliation, never a customer-receipts balancing plug.
 q=next(x for x in customer if x['company']=='oracle' and x['label']=='FY2027Q1');prev=next(x for x in customer if x['company']=='oracle' and x['label']=='FY2026')
 pre=reviewed('oracle','FY2027Q1','customer_financing_prepaid_cf');other=reviewed('oracle','FY2027Q1','other_deferred_revenue_cf_adjustment')
 customer_check=dict(company='oracle',label='FY2027Q1',opening_deferred_usd=prev['reported_total_usd'],closing_deferred_usd=q['reported_total_usd'],observed_stock_change_usd=q['reported_total_usd']-prev['reported_total_usd'],prepayment_cf_adjustment_usd=pre['value_usd'],other_deferred_cf_adjustment_usd=other['value_usd'],unexplained_difference_usd=(q['reported_total_usd']-prev['reported_total_usd'])-pre['value_usd']-other['value_usd'],status='PARTIAL_UNEXPLAINED_STOCK_CF_DIFFERENCE',full_rollforward=None,explanation='Cash-flow adjustments are not a full contract-liability roll-forward; FX/netting/other components unqualified. Do not infer receipts or refunds from the residual.',source_refs=q['source_refs']+prev['source_refs']+[pre['observation_id'],other['observation_id']])
 liquidity=[]
 for b in bs:
  c,l=b['company'],b['label'];s=next((s for s in schedules if s['company']==c and s['label']==l and s['family']=='debt_principal'),None)
  need=s['native_buckets'][0]['value_usd'] if s and b['form']=='10-K' else None
  liquidity.append(dict(company=c,label=l,liquidity_period_end=b['end'],cash_and_current_securities_usd=b['cash_and_short_term_investments_usd'],borrowings_carrying_excluding_leases_usd=b['borrowings_excluding_leases_usd'],current_borrowings_carrying_usd=b['reported_values_usd'].get('borrowings_current') if c=='oracle' else b['reported_values_usd'].get('long_term_debt_current_carrying'),ocf_period_start=b['start'],ocf_period_end=b['end'],ocf_usd=b['reported_values_usd']['ocf'],fcf_usd=b['company_convention_fcf_usd'],debt_next12m_principal_usd=need,liquidity_to_debt_next12m_principal_only=ratio(b['cash_and_short_term_investments_usd'],need),full_contract_liquidity_coverage=None,limitation='Restricted cash excluded from liquidity; marketable securities not haircut; not freely transferable guaranteed cash. Principal-only annual ratio excludes interest, leases, commitments and all operating uses; partial-period columns cannot produce rolling 12-month denominator. Facilities remain separate, conditional, and vintage-dated.',source_refs=list(b['source_refs'].values())+( [s['native_buckets'][0]['observation_id']] if need is not None else [])))
 pressure=[]
 for b in bs:
  v=b['reported_values_usd'];c=b['company'];fcf=b['company_convention_fcf_usd']
  investment=v['cash_capex'] if c=='oracle' else v.get('reported_net_cash_capex',v['cash_capex']-v['ppe_sales_incentives'])
  pressure.append(dict(company=c,label=b['label'],period_start=b['start'],period_end=b['end'],confidence=dict(numerical_bridge='HIGH_EXACT_RECONCILIATION_AT_REPORTED_PRECISION',contract_completeness='LIMITED_INCOMPLETE_PRIMARY_DOCUMENT_COVERAGE',causal_attribution='UNAVAILABLE'),dimensions=dict(capex_intensity=dict(cash_ppe_to_ocf=ratio(v['cash_capex'],v['ocf']),company_investment_to_ocf=ratio(investment,v['ocf']),definition='Oracle gross cash PP&E; Amazon native net cash investment; not AI allocation'),internal_cash_coverage=dict(ocf_usd=v['ocf'],company_convention_fcf_usd=fcf,state='INVESTMENT_EXCEEDS_OCF' if fcf<0 else 'OCF_EXCEEDS_COMPANY_INVESTMENT',limitation='OCF may contain customer funding; FCF excludes many cash obligations'),liquidity_consumption=dict(cash_change_including_restricted_usd=b['computed_cash_change_usd'],state='REPORTED_CASH_INCREASE' if b['computed_cash_change_usd']>0 else 'REPORTED_CASH_DECREASE',limitation='Whole cash-flow bridge; cannot attribute movement to AI spending or infer cash exhaustion'),external_financing=dict(financing_cf_usd=v['financing_cf'],debt_proceeds_usd=v.get('debt_proceeds'),state='POSITIVE_NET_FINANCING_FLOW' if v['financing_cf']>0 else 'NEGATIVE_NET_FINANCING_FLOW',limitation='Observed funding mix, not dollars traced to particular AI assets'),near_term_payments=dict(state='NATIVE_SCHEDULE_AVAILABLE',rolling_12m_all_obligations=None,limitation='No universal all-obligation rolling denominator; quarter tables keep remainder/full-year columns'),refinancing=dict(state='MATURITIES_AND_CONDITIONAL_FACILITIES_IDENTIFIED',guaranteed_refinancing=False,covenant_breach_conclusion='NOT_ESTABLISHED',distress_conclusion='NOT_ESTABLISHED')),source_refs=list(b['source_refs'].values())))
 dump('financial-pressure.json',dict(as_of=AS_OF,assessments=pressure,composite_score=None,automatic_refinancing_assumed=False))
 overlaps=[]
 for c in ['oracle','amazon']:
  for a,z,why in [('cash_capex','remaining_purchase_commitments','Paid historical spending versus future goods/power scope; no common AI allocation'),('lease_liability','undiscounted_lease_payments','Same lease principal represented by PV and gross contractual payments'),('debt_carrying','debt_principal_interest','Same borrowings represented by carrying balance and future payments'),('debt_principal','debt_principal_interest','Principal already inside combined payments'),('uncommenced_leases','lessor_guarantee','May refer to same leased assets; maximum support not expected loss'),('finance_lease_noncash_additions','cash_capex','Asset recognition and cash purchase are different events'),('customer_prepayments','ocf','Customer financing already included in OCF'),('future_purchase_commitments','unpaid_capex','Accrued spending vs unperformed purchases require contract-level overlap audit')]:
   overlaps.append(dict(company=c,left=a,right=z,rule='DO_NOT_ADD',reason=why))
 for c in ['oracle','amazon']:
  dump(c+'-debt-lease-schedules.json',dict(as_of=AS_OF,company=c,schedules=[s for s in schedules if s['company']==c],contractual_interest=[x for x in derived if x['company']==c],liability_reconciliation=[x for x in receipts if x['company']==c and 'lease' in x['check']]))
 dump('observations.json',observations)
 dump('evidence/selected-xbrl-contexts.json',selected_contexts)
 dump('source-register.json',dict(base=BASE,as_of=AS_OF,filings=d['sources'],raw_captures_reused=load(B/'primary-source-register.json')['snapshots'],selected_evidence_sha=sha((R/'evidence/selected-xbrl-contexts.json').read_bytes()),reviewed_evidence_sha=sha((R/'reviewed-evidence.json').read_bytes()),raw_html_status='LOCAL_SEC_403_STOPPED; WEB_RENDERED_TABLES_REVIEWED; NO_FULL_HTML_CAPTURE',access_attempts=load(R/'access-receipt.json'),limitations=['Selected XBRL contexts are exactly reproduced from inherited immutable raw SEC responses','Reviewed cells reproducible as structured evidence but not independently parsed from archived original HTML','A numeric reconciliation is not proof of covenant compliance or contractual non-overlap']))
 dump('reconciliation.json',dict(checks=receipts,b1_comparisons=cross,schedule_counts={k:sum(s['reconciliation']['status']==k for s in schedules) for k in ['RECONCILED','UNAVAILABLE_CONTROL','CONFLICT_REQUIRES_REVIEW']}))
 dump('capital-commitments.json',dict(as_of=AS_OF,schedules=[s for s in schedules if s['family'] in ['purchase_obligations','uncommenced_leases','other_commitments','financing_obligations']],other_observations=[o for o in observations if o['metric'] in ['uncommenced_leases_total','subsequent_purchase_commitment','lessor_borrowing_guarantee_maximum','unpaid_capex','finance_lease_noncash_additions']],paid_cash_capex=[dict(company=b['company'],label=b['label'],value_usd=b['reported_values_usd']['cash_capex'],source_ref=b['source_refs']['cash_capex']) for b in bs],overlap_rules=overlaps,aggregate_infrastructure_investment=None))
 dump('customer-financing.json',dict(as_of=AS_OF,balances=customer,oracle_incomplete_reconciliation=customer_check,prepayment_observations=[o for o in observations if 'prepaid_cf' in o['metric']],statements=[s for s in d['statements'] if 'customer' in s['field'] or 'unearned' in s['field']],unearned_cash_received_total=None))
 dump('liquidity-refinancing.json',dict(as_of=AS_OF,period_assessments=liquidity,credit_and_covenant_evidence=[s for s in d['statements'] if s['field'] in ['revolver','revolvers','covenant','term_loan','delayed_draw_term_loan','notes_covenants','subsequent_notes']],automatic_refinancing_assumed=False,credit_capacity_added_to_cash=False,distress_score=None))
 names=['observations.json','oracle-debt-lease-schedules.json','amazon-debt-lease-schedules.json','capital-commitments.json','customer-financing.json','liquidity-refinancing.json','reconciliation.json','source-register.json','financial-pressure.json','evidence/selected-xbrl-contexts.json']
 dump('content-identity.json',dict(implementation=VERSION,base=BASE,as_of=AS_OF,files={n:sha((R/n).read_bytes()) for n in names},input_hash=sha((R/'reviewed-evidence.json').read_bytes()),counts=dict(unique_reproducible_tagged_contexts=len({(index[x['observation_id']]['company'],index[x['observation_id']]['label'],x['tag'],index[x['observation_id']]['period_start'],index[x['observation_id']]['period_end']) for x in selected_contexts if index[x['observation_id']]['value_usd'] is not None}),xbrl_numeric=sum(o['verification']=='PRIMARY_XBRL_VERIFIED' for o in observations),reviewed_numeric=sum(o['verification']=='PRIMARY_MANUALLY_VERIFIED_EXTRACT' and o['value_usd'] is not None for o in observations),unique_numeric=len({(o['company'],o['label'],o['metric']) for o in observations if o['value_usd'] is not None}),unavailable=sum(o['value_usd'] is None for o in observations),schedules=len(schedules),reconciled_schedules=sum(s['reconciliation']['status']=='RECONCILED' for s in schedules),liability_checks_reconciled=sum('lease' in x['check'] and x['status']=='RECONCILED' for x in receipts),source_filings=len(d['sources']))))
 with (R/'obligations.csv').open('w',newline='') as f:
  fields=['company','label','metric','value_usd','kind','verification','accession','filed','period_end','source_locator','source_url'];w=csv.DictWriter(f,fieldnames=fields,lineterminator='\n');w.writeheader();w.writerows({k:o.get(k) for k in fields} for o in observations)
 print(json.dumps(load(R/'content-identity.json')['counts'],indent=2))
if __name__=='__main__':build()
