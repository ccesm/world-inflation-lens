"""Research plots from reconciled B1 outputs only. Never reads production data."""
import json,os
from pathlib import Path
os.environ.setdefault('MPLCONFIGDIR','/private/tmp/wil-b1-mpl-cache')
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
R=Path(__file__).resolve().parent
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':10,'axes.spines.top':False,'axes.spines.right':False,'svg.fonttype':'none','svg.hashsalt':'wil-b1-2026-10-08','figure.facecolor':'#f8fafc','axes.facecolor':'#f8fafc'})
def save(fig,n):
 fig.savefig(R/(n+'.svg'),metadata={'Date':'2026-10-08','Creator':'World Inflation Lens B1 research'})
 svg=R/(n+'.svg')
 svg.write_text('\n'.join(line.rstrip() for line in svg.read_text().splitlines())+'\n')
 fig.savefig(R/(n+'.png'),dpi=160,metadata={'Software':'World Inflation Lens B1 research'})
 plt.close(fig)
def charts():
 bs=json.loads((R/'funding-bridges.json').read_text())
 assert all(b['status']=='RECONCILED' for b in bs)
 fig,axes=plt.subplots(1,2,figsize=(13,7));fig.subplots_adjust(left=.08,right=.97,top=.78,bottom=.29,wspace=.26)
 fig.suptitle('Funding bridges: reported cash flows, not AI financing allocations',x=.08,y=.96,ha='left',fontsize=16,weight='bold')
 fig.text(.08,.89,'Historical 2023–2025 | Separate native-year periods | USD billions | Research only',color='#526576')
 cols=['#176f89','#b27626','#7467a1','#65727c'];keys=['ocf','investing_cf','financing_cf','fx']
 for ax,c in zip(axes,['oracle','amazon']):
  rr=[b for b in bs if b['company']==c and b['cohort']=='HISTORICAL_2023_2025']
  ax.set_title(c.title()+(' · June–May fiscal years' if c=='oracle' else ' · January–December calendar years'),fontsize=11)
  for i,k in enumerate(keys):
   bars=ax.bar([x+(i-1.5)*.18 for x in range(3)],[b['reported_values_usd'][k]/1e9 for b in rr],width=.17,color=cols[i],label=k.replace('_',' ').upper())
   ax.bar_label(bars,fmt='%.1f',fontsize=7,padding=3)
  ax.plot(range(3),[b['computed_cash_change_usd']/1e9 for b in rr],marker='D',color='#102e40',linewidth=1.5,label='Change in cash incl. restricted')
  ax.set_xticks(range(3),[b['label'] for b in rr]);ax.axhline(0,color='#718096',linewidth=.8);ax.grid(axis='y',alpha=.18);ax.set_axisbelow(True);ax.set_ylabel('USD billions');ax.margins(y=.18)
 axes[0].legend(loc='upper left',bbox_to_anchor=(-.05,-.13),ncol=3,fontsize=8,frameon=False)
 fig.text(.08,.105,'OCF + investing CF + financing CF + FX = reported change in cash including restricted cash. All six annual bridges reconcile.\nThe panels use different vertical scales. Oracle FY2023 includes $27.721B of acquisitions net of cash acquired; cash depletion is not AI attribution.',fontsize=9,linespacing=1.6)
 fig.text(.08,.035,'Source: captured SEC companyfacts; original filing accessions in primary-source-register.json. No cash-stock inflow, balancing plug, or allocation to AI.',fontsize=8,color='#526576')
 save(fig,'chart-a-funding-bridges')
 fig,axes=plt.subplots(1,2,figsize=(13,7));fig.subplots_adjust(left=.08,right=.97,top=.78,bottom=.28,wspace=.25)
 fig.suptitle('Cash investment and company-convention free cash flow',x=.08,y=.96,ha='left',fontsize=16,weight='bold')
 fig.text(.08,.89,'2026 disclosures remain separate; no annualization | USD billions | Not AI return',color='#526576')
 for ax,c in zip(axes,['oracle','amazon']):
  rr=[b for b in bs if b['company']==c]
  for i,(k,color,label) in enumerate([('ocf','#176f89','GAAP OCF'),('cash_capex','#b27626','Gross cash PP&E')]):
   bars=ax.bar([x+(i-.5)*.23 for x in range(len(rr))],[b['reported_values_usd'][k]/1e9 for b in rr],width=.22,color=color,label=label)
   for bar,b in zip(bars,rr):
    if b['cohort']!='HISTORICAL_2023_2025':bar.set_hatch('///')
  # Different-length 2026 observations are individual points, never joined to
  # the historical annual line or to each other as a comparable time series.
  ax.plot(range(3),[b['company_convention_fcf_usd']/1e9 for b in rr[:3]],marker='o',color='#7467a1',label='Company-convention FCF')
  ax.scatter(range(3,len(rr)),[b['company_convention_fcf_usd']/1e9 for b in rr[3:]],color='#7467a1',s=38)
  ax.axhline(0,color='#718096',linewidth=.8);ax.set_xticks(range(len(rr)),[b['label'].replace('FY2027Q1','Jun–Aug\n2026').replace('2026H1','Jan–Jun\n2026') for b in rr],fontsize=9)
  ax.axvline(2.5,color='#718096',linestyle=':',linewidth=1);ax.set_title(c.title()+(' · June–May native FY' if c=='oracle' else ' · Calendar-year / half-year'),fontsize=11)
  ax.grid(axis='y',alpha=.18);ax.set_axisbelow(True);ax.set_ylabel('USD billions');ax.margins(y=.12)
 axes[0].legend(loc='upper left',bbox_to_anchor=(0,-.18),ncol=3,fontsize=8,frameon=False)
 fig.text(.08,.105,'FCF: Oracle = OCF − cash PP&E; Amazon = OCF − (gross cash PP&E − proceeds from sales/incentives). Leases remain separate.\nHatched bars are 2026 reported observations, with their actual native periods. Different scales and period lengths; no synchronized forecast.',fontsize=9,linespacing=1.6)
 fig.text(.08,.035,'Oracle OCF includes customer financing prepayments where disclosed. Negative FCF alone is not financial distress. Source: funding-bridges.json.',fontsize=8,color='#526576')
 save(fig,'chart-b-investment-fcf')
if __name__=='__main__':charts()
