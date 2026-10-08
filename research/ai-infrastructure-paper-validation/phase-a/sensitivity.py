"""Direct annual-vintage sensitivity. Never substitutes into primary quarters."""
import csv
from build import ROOT,write_csv
with (ROOT/'five-company-aggregate.csv').open() as f:a=list(csv.DictReader(f))
with (ROOT/'reporting-revisions.csv').open() as f:r=list(csv.DictReader(f))
out=[]
for x in a:
 year=x['calendar_year'];delta=sum(int(v['revision_usd']) for v in r if v['metric']=='cash_capex' and v['start']==year+'-01-01' and v['end']==year+'-12-31')
 out.append({'year':year,'classification':'LATEST_REPORTED_ANNUAL_VINTAGE_SENSITIVITY_WITH_ORACLE_PROXY','first_vintage_cash_capex_usd':int(x['cash_capex_usd']),'annual_revision_usd':delta,'latest_annual_vintage_cash_capex_usd':int(x['cash_capex_usd'])+delta,'ocf_usd':int(x['ocf_usd']),'note':'Direct reported annual revisions only, not reallocated to standalone quarters. Exact Oracle calendar totals remain unavailable.'})
write_csv('vintage-sensitivity.csv',out)
