"""Official public-source parsing, fixed-width identities and sufficient statistics."""
import io,re,zipfile,math,xml.etree.ElementTree as E
from collections import defaultdict,Counter
from outcome_common import require,SourceError,canonical,sha256
NS={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
FIELDS={'HRHHID':(1,15),'HRMONTH':(16,17),'HRYEAR4':(18,21),'HRMIS':(63,64),'HRHHID2':(71,75),'PRTAGE':(122,123),'PEEDUCA':(137,138),'PULINENO':(147,148),'PRPERTYP':(161,162),'PEMLR':(180,181),'PEHRUSL1':(218,219),'PEHRACT1':(243,244),'PEIO1COW':(432,433),'PRERELG':(498,499),'PWORWGT':(603,612),'PWCMPWGT':(846,855),'PEIO1ICD':(856,859)}
ALIASES={'occupation':('PEIO1OCD','PTIO1OCD'),'earnings':('PRERNWA','PTERNWA')}

def workbook(raw):
    """Read source cells, including multi-sheet concordances, without executing formulas."""
    require(raw[:2]==b'PK','Expected XLSX')
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        require(sum(x.file_size for x in z.infolist())<100_000_000,'Oversized workbook')
        ss=[''.join(n.itertext()) for n in E.fromstring(z.read('xl/sharedStrings.xml'))] if 'xl/sharedStrings.xml' in z.namelist() else []
        rel={r.get('Id'):r.get('Target') for r in E.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
        result={}
        for sheet in E.fromstring(z.read('xl/workbook.xml')).findall('s:sheets/s:sheet',NS):
            target=rel[sheet.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')]
            name=target.lstrip('/') if target.startswith('/') else 'xl/'+target
            rows=[]
            for row in E.fromstring(z.read(name)).findall('s:sheetData/s:row',NS):
                d={}
                for c in row:
                    require(c.find('s:f',NS) is None,'Formula requires reviewed source values')
                    col=re.sub(r'\d','',c.get('r',''));v=c.find('s:v',NS);inline=c.find('s:is',NS)
                    val=''.join(inline.itertext()) if inline is not None else (v.text or '' if v is not None else '')
                    if c.get('t')=='s':val=ss[int(val)]
                    require(col and col not in d,'Duplicate source cell');d[col]=val
                rows.append(d)
            result[sheet.get('name').strip()]=rows
        return result

def concordance(raw,details):
    sheets=workbook(raw)
    require({'2018 Census Occ Code List','2010 to 2018 Crosswalk'}<=set(sheets),'Concordance sheets changed')
    current={}
    for r in sheets['2018 Census Occ Code List']:
        code=r.get('C','').strip();soc=r.get('D','').strip()
        if re.fullmatch(r'\d{4}',code):
            require(code not in current,'Duplicate Census code');current[code]={'title':r.get('B',''),'socExpression':soc,'targets':[soc] if soc in details else []}
    require(len(current)==570,'Census 2018 version/count changed')
    edges=set();old=None
    for r in sheets['2010 to 2018 Crosswalk']:
        if re.fullmatch(r'\d{4}',r.get('B','').strip()):old=(r['B'].strip(),r.get('A','').strip(),r.get('C',''))
        if old and re.fullmatch(r'\d{4}',r.get('E','').strip()):edges.add((old[0],r['E'].strip(),old[1],r.get('D','').strip()))
    # The crosswalk lays out merged occupations with blank target-code cells.
    # Resolve these only from the publisher's explicit code-change notes, not blind forward filling.
    changes=sheets['Occ Code Changes'];old_soc={r['B'].strip():r.get('A','').strip() for r in sheets['2010 to 2018 Crosswalk'] if re.fullmatch(r'\d{4}',r.get('B','').strip())}
    change_old=None
    for r in changes:
        if re.fullmatch(r'\d{4}',r.get('A','').strip()):change_old=r['A'].strip()
        target=r.get('C','').strip();note=r.get('E','')
        if re.fullmatch(r'\d{4}',target):
            require(target in current,'Changed Census target missing from official list')
            if change_old:edges.add((change_old,target,old_soc.get(change_old,''),current[target]['socExpression']))
            if 'combined' in note.lower():
                explicit_old=re.findall(r'\b\d{4}\b',note.lower().split('combined')[0])
                require(explicit_old and all(c in old_soc for c in explicit_old),'Unresolved publisher merge note')
                for o in explicit_old:edges.add((o,target,old_soc[o],current[target]['socExpression']))
    edges={(o,n,old_soc.get(o,oldexpr),current[n]['socExpression']) for o,n,oldexpr,newexpr in edges}
    require(edges,'No Census temporal bridge')
    incoming=defaultdict(set);outgoing=defaultdict(set)
    for old,new,_,_ in edges:outgoing[old].add(new);incoming[new].add(old)
    def kind(a,b):return ('1' if a==1 else 'many')+'-to-'+('1' if b==1 else 'many')
    temporal=[{'sourceCode':o,'sourceVersion':'Census 2010','targetCode':n,'targetVersion':'Census 2018','sourceSocExpression':s,'targetSocExpression':t,'mappingType':kind(len(incoming[n]),len(outgoing[o]))} for o,n,s,t in sorted(edges)]
    # Map only exact detailed expressions. Composite/wildcard expressions remain inspectable, not expanded into fake weights.
    reverse=defaultdict(set)
    for code,r in current.items():
        for soc in r['targets']:reverse[soc].add(code)
    relations=[{'sourceCode':code,'targetCode':soc,'sourceVersion':'Census 2018','targetVersion':'SOC 2018','mappingType':kind(len(reverse[soc]),len(r['targets']))} for code,r in sorted(current.items()) for soc in r['targets']]
    stable={}
    for o,n,s,t in sorted(edges):
        if len(outgoing[o])==len(incoming[n])==1 and s==t and t in details and current.get(n,{}).get('targets')==[t] and len(reverse[t])==1:
            stable[o]={'census2018':n,'socCode':t}
    return {'publisherChangeRows':changes,'publisherCrosswalkRows':sheets['2010 to 2018 Crosswalk'],'currentCodes':current,'temporalEdges':temporal,'socEdges':relations,'stableBridge':stable,'currentUnmapped':[c for c,r in current.items() if not r['targets']],'mappingSourceSha256':sha256(raw),'unmappedMeaning':'Composite/broad/hybrid SOC expressions are retained without allocation; no inferred equivalence','mappingCounts':dict(Counter(r['mappingType'] for r in temporal))}

def layout(raw):
    t=raw.decode('utf-8',errors='replace').replace('\ufffd','-').replace('\u2013','-').replace('\u2014','-');found={}
    for line in t.splitlines():
        m=re.match(r'^([A-Z][A-Z0-9]+)\s*(?:\|\s*Size:\s*)?(\d+)\s+(?:\|\s*Loc:\s*)?.*?(\d+)\s*-\s*(\d+)\s*$',line)
        if m:found[m[1]]=(int(m[3]),int(m[4]))
    for k,v in FIELDS.items():
        # 2017+ dictionary splits the PULINENO description across lines; inspect its full block independently.
        if k=='PULINENO' and k not in found:
            m=re.search(r'^PULINENO\s+2\s+[\s\S]{0,200}?147\s*(?:-\s*)?148',t,re.M)
            require(m is not None,'Person line position not proven');found[k]=(147,148)
        require(found.get(k)==v,'CPS field position/version changed: '+k)
    names={}
    for k,aliases in ALIASES.items():
        valid=[n for n in aliases if n in found]
        require(len(valid)==1,'CPS field alias missing/ambiguous: '+k);names[k]=valid[0]
    require(found[names['occupation']]==(860,863) and found[names['earnings']]==(527,534),'CPS native observation layout changed')
    return {'fieldLocations':{k:list(v) for k,v in FIELDS.items()},'aliases':names,'dictionarySha256':sha256(raw),'weightScale':10000,'earningsScale':100,'minimumRecordLength':863}

def age_band(age):
    if 20<=age<=24:return '20–24'
    if 25<=age<=34:return '25–34'
    if 35<=age<=54:return '35–54'
    if age>=55:return '55+'
    return '16–19'

def blank_cell():
    return {'n':0,'weightInt':0,'weightSquaredInt':0,'hoursN':0,'hoursWeightInt':0,'hoursWeightedInt':0,'ageN':{},'ageWeightInt':{},'educationWeightInt':{},'industryWeightInt':{},'earningsN':0,'earningsWeightInt':0,'earningsHistogram':{}}

def add_person(cell,vals):
    w=vals['PWCMPWGT'];cell['n']+=1;cell['weightInt']+=w;cell['weightSquaredInt']+=w*w
    h=vals['PEHRUSL1']
    if 0<=h<=99:cell['hoursN']+=1;cell['hoursWeightInt']+=w;cell['hoursWeightedInt']+=w*h
    band=age_band(vals['PRTAGE']);cell['ageN'][band]=cell['ageN'].get(band,0)+1;cell['ageWeightInt'][band]=cell['ageWeightInt'].get(band,0)+w
    edu='BACHELOR_OR_HIGHER' if vals['PEEDUCA']>=43 else 'BELOW_BACHELOR' if 31<=vals['PEEDUCA']<=42 else 'UNKNOWN'
    cell['educationWeightInt'][edu]=cell['educationWeightInt'].get(edu,0)+w
    ind=str(vals['PEIO1ICD']).zfill(4);cell['industryWeightInt'][ind]=cell['industryWeightInt'].get(ind,0)+w
    if vals['HRMIS'] in (4,8) and 1<=vals['PEIO1COW']<=5 and vals['PRERELG']==1 and vals['earnings']>0 and vals['PWORWGT']>0:
        ew=vals['PWORWGT'];value=str(vals['earnings']);cell['earningsN']+=1;cell['earningsWeightInt']+=ew;cell['earningsHistogram'][value]=cell['earningsHistogram'].get(value,0)+ew

def parse_cps(raw,period,definition):
    require(re.fullmatch(r'20\d{2}-(0[1-9]|1[012])',period),'Invalid CPS month')
    year,month=map(int,period.split('-'));aliases=definition['aliases'];positions={**FIELDS,'occupation':(860,863),'earnings':(527,534)}
    require(definition['fieldLocations']=={k:list(v) for k,v in FIELDS.items()} and definition['weightScale']==10000 and definition['earningsScale']==100,'Unapproved weight/layout rule')
    occupations={};total=blank_cell();seen=set();records=0;employed=0
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        files=[i for i in z.infolist() if i.filename.lower().endswith('.dat')]
        require(len(files)==1 and files[0].file_size<300_000_000,'CPS archive layout/size changed')
        with z.open(files[0]) as f:
            for line in f:
                records+=1;require(len(line.rstrip(b'\r\n'))>=863,'Truncated CPS record')
                def integer(k):
                    a,b=positions[k];txt=line[a-1:b].strip()
                    require(re.fullmatch(rb'-?\d+',txt) is not None,'Invalid CPS numeric field: '+k)
                    return int(txt)
                require(integer('HRYEAR4')==year and integer('HRMONTH')==month,'CPS reference period mismatch')
                if integer('PRPERTYP')!=2:continue
                key=(line[0:15],line[70:75],line[146:148]);require(key not in seen,'Duplicate CPS person-month');seen.add(key)
                if integer('PRTAGE')<16 or integer('PEMLR') not in (1,2):continue
                vals={k:integer(k) for k in positions if k not in ('HRHHID','HRHHID2')}
                require(vals['PWCMPWGT']>0,'Employed person has invalid population weight')
                require(16<=vals['PRTAGE']<=99 and 1<=vals['HRMIS']<=8,'CPS subgroup domain changed')
                code=str(vals['occupation']).zfill(4);occupations.setdefault(code,blank_cell());add_person(occupations[code],vals);add_person(total,vals);employed+=1
    require(records>0 and employed>0,'Empty CPS source/universe')
    return {'period':period,'taxonomy':'Census 2010' if year<2020 else 'Census 2018','rawSha256':sha256(raw),'layout':definition,'source':'US Census/BLS CPS Basic Monthly public use','recordsRead':records,'employedPersonMonths':employed,'occupations':occupations,'totalEmployed':total,'unweightedCountMeaning':'person-month observations; rotating panel, not independent unique workers'}

def oews(raw,reference,details):
    """Official XLSX cross section; do not coerce separate vintages into a growth series."""
    require(re.fullmatch(r'20\d{2}-05',reference),'OEWS must retain May reference period')
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        files=[i for i in z.infolist() if i.filename.endswith('.xlsx')];require(len(files)==1,'Expected one national OEWS XLSX')
        sheets=workbook(z.read(files[0]));require(len(sheets)==1,'OEWS workbook shape changed');rows=next(iter(sheets.values()))
    header=rows[0];cols={v:k for k,v in header.items()};needed={'OCC_CODE','OCC_TITLE','TOT_EMP','A_MEAN','A_MEDIAN'};require(needed<=set(cols),'OEWS required columns missing')
    seen=set();result=[]
    def value(v):
        if v in ('*','#','**','',None):return None
        n=float(str(v).replace(',',''));require(math.isfinite(n) and n>=0,'Invalid OEWS value');return n
    for r in rows[1:]:
        code=r.get(cols['OCC_CODE'],'');require(code not in seen,'Duplicate OEWS code');seen.add(code)
        result.append({'socCode':code,'title':r.get(cols['OCC_TITLE'],''),'hierarchy':'detailed' if code in details else 'REPORTING_AGGREGATE_OR_TOTAL','employment':value(r.get(cols['TOT_EMP'])),'annualMeanWage':value(r.get(cols['A_MEAN'])),'annualMedianWage':value(r.get(cols['A_MEDIAN'])),'annualWagePercentiles':{str(n):value(r.get(cols.get('A_PCT'+str(n)))) for n in [10,25,75,90]},'sourceValues':{k:r.get(cols[k]) for k in cols if k in {'TOT_EMP','A_MEAN','A_MEDIAN','A_PCT10','A_PCT25','A_PCT75','A_PCT90','EMP_PRSE'}}})
    return {'referencePeriod':reference,'records':result,'longitudinalStatus':'NOT_COMPARABLE','comparabilityReasons':['Three-year overlapping panels','2021 MB3 change','2019–2020 hybrid SOC; 2021 full SOC 2018','2022 wage processing change','Pandemic response distortion'],'rawSha256':sha256(raw)}
