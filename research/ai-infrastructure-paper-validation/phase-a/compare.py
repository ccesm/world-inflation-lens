"""Post-construction comparison only. Independent build never imports this file."""
import csv,json,pathlib
from build import ROOT,write_csv
REFERENCE=[(2020,96.8,252.2),(2021,130.9,289.9),(2022,158.3,288.3),(2023,153.8,377.9),(2024,240.4,478.5),(2025,415.8,603.2),(2026,800.5,707.1)]
def compare():
 with (ROOT/'five-company-aggregate.csv').open() as f:independent={int(r['calendar_year']):r for r in csv.DictReader(f)}
 out=[]
 for year,capex,ocf in REFERENCE:
  row={'year':year,'paper_classification':'PAPER_MIXED_ACTUAL_GUIDANCE_ESTIMATE' if year==2026 else 'PAPER_REPORTED_HISTORICAL','independent_classification':'NOT_COMPARABLE_YTD' if year==2026 else 'FOUR_EXACT_COMPANIES_PLUS_ORACLE_QUARTER_END_PROXY','unit':'USD_BILLION','comparison_status':'NOT_COMPARABLE_PERIODS' if year==2026 else 'DIAGNOSTIC_PROXY_COMPARISON'}
  for metric,paper in [('cash_capex',capex),('ocf',ocf)]:
   value=float(independent[year][metric+'_usd'])/1e9 if year in independent and independent[year][metric+'_usd'] else None
   delta=round(value-paper,9) if value is not None else None
   row['independent_'+metric]=value;row['paper_'+metric]=paper;row[metric+'_signed_difference']=delta;row[metric+'_absolute_difference']=abs(delta) if delta is not None else None;row[metric+'_percentage_difference']=delta/paper*100 if delta is not None else None
  out.append(row)
 write_csv('paper-comparison.csv',out)
if __name__=='__main__':compare()
