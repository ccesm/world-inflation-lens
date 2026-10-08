"""Research-only charts from independent data. Requires matplotlib; no paper imports."""
import csv,pathlib,os
os.environ.setdefault('MPLCONFIGDIR','/private/tmp/wil-phase-a-mpl-cache')
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.ticker import PercentFormatter
ROOT=pathlib.Path(__file__).resolve().parent
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':11,'axes.spines.top':False,'axes.spines.right':False,'svg.fonttype':'none','svg.hashsalt':'wil-phase-a-2026-10-08','figure.facecolor':'#f8fafc','axes.facecolor':'#f8fafc'})
def read(name):
 with (ROOT/name).open() as f:return list(csv.DictReader(f))
def number(x):return float(x) if x else float('nan')
def save(fig,name):
 for ext in ['svg','png']:fig.savefig(ROOT/f'{name}.{ext}',dpi=190,facecolor=fig.get_facecolor(),metadata={'Creator':'World Inflation Lens Phase A independent research','Date':'2026-10-08'} if ext=='svg' else {'Software':'World Inflation Lens Phase A independent research'})
 p=ROOT/f"{name}.svg"
 p.write_text("\n".join(line.rstrip() for line in p.read_text().splitlines())+"\n")
 plt.close(fig)
def charts():
 a=read('five-company-aggregate.csv');years=[int(x['calendar_year']) for x in a]
 fig,ax=plt.subplots(figsize=(12,7));fig.subplots_adjust(left=.085,right=.98,top=.79,bottom=.25)
 fig.text(.085,.945,'Cash investment rose faster than operating cash flow',fontsize=18,weight='bold',color='#132a3b')
 fig.text(.085,.894,'Chart A | 2020-2025 historical disclosures | USD billions | Research only',fontsize=11,color='#526576')
 x=list(range(6));c=[number(r['cash_capex_usd'])/1e9 for r in a];o=[number(r['ocf_usd'])/1e9 for r in a]
 b1=ax.bar([k-.19 for k in x],c,width=.36,color='#087f8c',label='Cash CapEx');b2=ax.bar([k+.19 for k in x],o,width=.36,color='#607ea8',label='GAAP operating cash flow')
 ax.bar_label(b1,fmt='%.1f',padding=4,fontsize=10);ax.bar_label(b2,fmt='%.1f',padding=4,fontsize=10);ax.set_xticks(x,years);ax.set_ylim(0,680);ax.set_ylabel('USD billions');ax.yaxis.grid(True,alpha=.18);ax.set_axisbelow(True);ax.legend(loc='upper left',frameon=False)
 fig.text(.085,.18,'Classification: four exact calendar-year series + Oracle quarter-end proxy (Dec-Nov).',fontsize=10,weight='bold',va='top')
 fig.text(.085,.135,'Definitions: cash purchases/additions of PP&E; GAAP net operating cash flow. Finance lease additions and\nprincipal payments are excluded from cash CapEx. Includes non-AI investment. First-reported filing contexts.',fontsize=10,linespacing=1.5,va='top')
 fig.text(.085,.065,'Source: captured SEC companyfacts, filing accessions in source-register.json. Cutoff: October 8, 2026.\nExact five-company Jan-Dec totals are unavailable; this comparison does not identify financing dependence.',fontsize=9,color='#526576',linespacing=1.5,va='top')
 save(fig,'chart-a-cash-capex-ocf')
 rows=read('company-calendar-year.csv');fig,ax=plt.subplots(figsize=(12,7.8));fig.subplots_adjust(left=.085,right=.79,top=.80,bottom=.27)
 fig.text(.085,.947,'Cash-flow coverage differs sharply across companies',fontsize=18,weight='bold',color='#132a3b')
 fig.text(.085,.902,'Chart B | Cash CapEx / GAAP operating cash flow | 2020-2025 | Research only',fontsize=11,color='#526576')
 colors=['#087f8c','#d67519','#7364ac','#317841','#ba5270']
 for co,color in zip(['microsoft','amazon','alphabet','meta','oracle'],colors):
  rr=[r for r in rows if r['company']==co];ax.plot(years,[number(r['capex_ocf_ratio']) for r in rr],marker='o',color=color,linewidth=2,label=co.title()+(' (Dec-Nov)' if co=='oracle' else ''))
 ax.plot(years,[number(r['capex_ocf_ratio']) for r in a],color='#132a3b',marker='s',linewidth=3,linestyle='--',label='Five-company proxy')
 ax.axhline(1,color='#83939e',linestyle=':',linewidth=1);ax.text(2020.04,1.02,'100%: cash CapEx equals OCF',fontsize=9,color='#526576')
 ax.yaxis.set_major_formatter(PercentFormatter(1));ax.set_ylim(0,1.75);ax.set_xticks(years);ax.set_ylabel('Cash CapEx / OCF (%)');ax.grid(axis='y',alpha=.18);ax.legend(loc='center left',bbox_to_anchor=(1.02,.5),frameon=False)
 fig.text(.085,.19,'Classification: observed first-reported cash flows. Oracle is a Dec-Nov quarter-end proxy.',fontsize=10,weight='bold',va='top')
 fig.text(.085,.155,'Cash CapEx excludes finance lease additions and lease principal; it includes non-AI purchases.\nAggregate coverage does not imply that cash can be transferred between companies. Missing values stay missing.',fontsize=10,linespacing=1.5,va='top')
 fig.text(.085,.075,'Source: captured SEC companyfacts; company-quarterly-source.csv and source-register.json. Cutoff: Oct 8, 2026.\nA ratio above 100% is a narrow coverage observation; it does not establish distress or a complete financing need.',fontsize=9,color='#526576',linespacing=1.5,va='top')
 save(fig,'chart-b-capex-ocf-ratio')
if __name__=='__main__':charts()
