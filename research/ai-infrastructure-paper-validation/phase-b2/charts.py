"""Non-additive contractual schedules from B2 outputs; optional matplotlib only."""
import json,os
from pathlib import Path
os.environ.setdefault('MPLCONFIGDIR','/private/tmp/wil-b2-mpl-cache')
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
R=Path(__file__).resolve().parent
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':9,'svg.fonttype':'none','svg.hashsalt':'wil-b2-2026-10-08','axes.spines.top':False,'axes.spines.right':False})
def charts():
 fig,axes=plt.subplots(2,3,figsize=(13,8));fig.subplots_adjust(left=.07,right=.97,top=.79,bottom=.22,hspace=.60,wspace=.30)
 fig.suptitle('Contractual payment maturities — separate obligation families',x=.07,y=.96,ha='left',fontsize=16,weight='bold')
 fig.text(.07,.90,'Annual reporting dates only | USD billions | No stacking, no AI attribution, no distress forecast',fontsize=10,color='#526576')
 for row,(c,l,date) in enumerate([('oracle','FY2026','May 31, 2026'),('amazon','CY2025','December 31, 2025')]):
  data=json.loads((R/(c+'-debt-lease-schedules.json')).read_text())['schedules']
  for col,(f,label) in enumerate([('debt_principal','Debt principal'),('operating_lease','Operating lease gross payments'),('finance_lease','Finance lease gross payments')]):
   s=next(x for x in data if x['label']==l and x['family']==f)
   assert s['reconciliation']['status']=='RECONCILED'
   values=[s['coarse_month_bands'][k]/1e9 for k in ['WITHIN_12_MONTHS','12_24_MONTHS','24_36_MONTHS','36_60_MONTHS','BEYOND_60_MONTHS']];ax=axes[row,col]
   bars=ax.bar(range(5),values,color=['#176f89','#7467a1','#b27626'][col],width=.65)
   ax.bar_label(bars,fmt='%.2f',padding=3,fontsize=8)
   ax.set_title(c.title()+' · '+label+'\n'+date,fontsize=10,pad=9)
   ax.set_xticks(range(5),['0–12','12–24','24–36','36–60','>60'],fontsize=8)
   ax.set_xlabel('Months after annual reporting date');ax.set_ylabel('USD billions');ax.margins(y=.23);ax.grid(axis='y',alpha=.18);ax.set_axisbelow(True)
 fig.text(.07,.09,'Different reporting dates and panel scales. Lease gross payments include imputed interest; lease liabilities are discounted stocks.\nUncommenced leases, purchase commitments and conditional guarantees remain separate. Do not add these charts into total investment.',fontsize=9,linespacing=1.6)
 fig.text(.07,.025,'Sources: original-period SEC companyfacts; native debt totals and table locators in source-register.json. Quarter tables are not rolling 12-month schedules.',fontsize=8,color='#526576')
 fig.savefig(R/'chart-contractual-maturities.svg',metadata={'Date':'2026-10-08','Creator':'World Inflation Lens Phase B2'})
 p=R/'chart-contractual-maturities.svg';p.write_text('\n'.join(x.rstrip() for x in p.read_text().splitlines())+'\n')
 fig.savefig(R/'chart-contractual-maturities.png',dpi=150,metadata={'Software':'World Inflation Lens Phase B2'});plt.close(fig)
if __name__=='__main__':charts()
