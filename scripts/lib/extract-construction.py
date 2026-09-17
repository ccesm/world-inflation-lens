"""Read official Census construction workbook cells; never execute macros/formulas."""
import json, sys, re, datetime
import openpyxl
sheet=openpyxl.load_workbook(sys.argv[1],data_only=True)['Private SA']
rows=list(sheet.values)
assert rows[0][0]=='Value of Private Construction Put in Place - Seasonally Adjusted Annual Rate'
assert rows[1][0].startswith('(Millions of dollars.')
header=next(r for r in rows if r[0]=='Date')
columns=['Data center','Nonresidential','Computer/ electronic/ electrical']
source=next(r[0] for r in rows if str(r[0]).startswith('Source: U.S. Census Bureau'))
release=re.search(r'Construction Spending, ([A-Za-z]+ \d+, \d{4})',source)[1]
result={'title':rows[0][0],'units':rows[1][0],'release':datetime.datetime.strptime(release,'%B %d, %Y').strftime('%Y-%m-%d'),'sourceNote':source,'series':{k:[] for k in columns}}
for row in rows:
    if not isinstance(row[0],str): continue
    match=re.fullmatch(r'([A-Za-z]{3})-(\d{2})([pr]?)',row[0])
    if not match: continue
    year=int(match[2]); year=1900+year if year>=90 else 2000+year
    month=datetime.datetime.strptime(match[1],'%b').month
    for col in columns:
        value=row[header.index(col)]
        assert value is None or isinstance(value,(float,int)) or str(value).strip() in ['','NA','(NA)','(S)','(X)','-','--']
        result['series'][col].append({'date':f'{year}-{month:02d}','value':value if isinstance(value,(float,int)) else None,'sourceFlag':match[3] or None})
for k in columns: result['series'][k].sort(key=lambda p:p['date'])
print(json.dumps(result,allow_nan=False))
