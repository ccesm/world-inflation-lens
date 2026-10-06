"""Pinned official taxonomy/task structures and separate licensed methodological inputs."""
import csv
import io
import math
import re
import zipfile
import xml.etree.ElementTree as ET
from collections import defaultdict, Counter
from common import require, SourceError
SOC = re.compile(r'\d{2}-\d{4}')
ONET = re.compile(r'\d{2}-\d{4}\.\d{2}')
NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}

def number(value, low=None, high=None):
    require(value not in ('', None), 'Missing numeric value')
    try: n = float(value)
    except (ValueError, TypeError) as exc: raise SourceError('Invalid numeric value') from exc
    require(math.isfinite(n), 'Nonfinite score')
    require((low is None or n >= low) and (high is None or n <= high), 'Score/scale out of range')
    return n

def tabular(raw, delimiter=',', required=None):
    text = raw.decode('utf-8-sig'); reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
    require(reader.fieldnames is not None and len(reader.fieldnames) == len(set(reader.fieldnames)), 'Duplicate/missing columns')
    if required: require(set(reader.fieldnames) == set(required), 'Table columns changed')
    rows = list(reader); require(rows and all(None not in r and all(v is not None for v in r.values()) for r in rows), 'Malformed/empty table')
    return rows

def unique(rows, fields):
    keys = [tuple(r[f] for f in fields) for r in rows]
    require(len(keys) == len(set(keys)), 'Duplicate source keys')

def workbook(raw):
    require(raw[:2] == b'PK', 'Not an XLSX source')
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        require(sum(i.file_size for i in z.infolist()) < 80_000_000, 'Oversized workbook')
        ss = [''.join(n.itertext()) for n in ET.fromstring(z.read('xl/sharedStrings.xml'))] if 'xl/sharedStrings.xml' in z.namelist() else []
        wb = ET.fromstring(z.read('xl/workbook.xml')); pr = wb.find('s:workbookPr', NS)
        require(pr is None or pr.get('date1904') not in ('1','true'), 'Unsupported date epoch')
        # Both pinned official files have one table sheet; unexpected extra sheets fail.
        require(len(wb.findall('s:sheets/s:sheet',NS)) == 1, 'Taxonomy workbook sheet count changed')
        rows = []
        for row in ET.fromstring(z.read('xl/worksheets/sheet1.xml')).findall('s:sheetData/s:row',NS):
            r = {}
            for c in row:
                require(c.find('s:f',NS) is None, 'Formula requires review')
                ref = c.get('r'); require(ref and re.fullmatch(r'[A-Z]+\d+',ref), 'Bad cell reference')
                col = re.sub(r'\d','',ref); require(col not in r, 'Duplicate cell')
                v=c.find('s:v',NS); inline=c.find('s:is',NS)
                value=''.join(inline.itertext()) if inline is not None else (v.text or '' if v is not None else '')
                if c.get('t') == 's': value=ss[int(value)]
                r[col]=value
            rows.append(r)
        return rows

def soc_structure(raw):
    rows = workbook(raw)
    require(any('final structure for the 2018 SOC' in r.get('A','') for r in rows), 'SOC version mismatch')
    require(any([r.get(k) for k in 'ABCD']==['Major Group','Minor Group','Broad Group','Detailed Occupation'] for r in rows), 'SOC header changed')
    names={'A':'major','B':'minor','C':'broad','D':'detailed'}; lineage={}; result=[]
    for r in rows:
        fields=[k for k in 'ABCD' if SOC.fullmatch(r.get(k,''))]
        if not fields: continue
        require(len(fields)==1, 'Ambiguous SOC hierarchy row')
        k=fields[0]; code=r[k]; level=names[k]; title=r.get('E','');require(title,'Missing SOC title')
        if k=='A': lineage={'major':code}; parent=None
        elif k=='B': require('major' in lineage,'Minor without major');parent=lineage['major'];lineage={**{'major':parent},'minor':code}
        elif k=='C': require('minor' in lineage,'Broad without minor');parent=lineage['minor'];lineage={k:v for k,v in lineage.items() if k in ('major','minor')};lineage['broad']=code
        else: require('broad' in lineage,'Detail without broad');parent=lineage['broad']
        require(code[:2]==lineage['major'][:2],'Hierarchy prefix mismatch')
        result.append({'socCode':code,'socVersion':'2018','title':title,'hierarchyLevel':level,'parentCode':parent,'taxonomy':dict(lineage),'taxonomyReleaseYear':2018})
    unique(result,['socCode']);require(Counter(x['hierarchyLevel'] for x in result)=={'major':23,'minor':98,'broad':459,'detailed':867},'Official SOC counts changed')
    return result

def mapping_rows(raw):
    rows=workbook(raw);require(rows[2]=={'A':'O*NET-SOC 2019 Code','B':'O*NET-SOC 2019 Title','C':'2018 SOC Code','D':'2018 SOC Title'},'O*NET/SOC crosswalk version/header mismatch')
    result=[]
    for r in rows[3:]:
        require(ONET.fullmatch(r.get('A','')) and SOC.fullmatch(r.get('C','')),'Invalid official mapping codes')
        result.append({'sourceCode':r['A'],'targetCode':r['C'],'sourceTitle':r['B'],'targetTitle':r['D']})
    unique(result,['sourceCode','targetCode']);require(len(result)==1016,'Official mapping count changed');return result

def classify_mapping(edges, sources, targets, source_version, target_version, mapping_source):
    require(source_version and target_version,'Missing taxonomy version')
    out=defaultdict(set);inc=defaultdict(set)
    for e in edges:
        s,t=e['sourceCode'],e['targetCode'];require(s in sources and t in targets,'Crosswalk code outside pinned taxonomy')
        require(t not in out[s],'Duplicate mapping edge');out[s].add(t);inc[t].add(s)
    result=[]
    for s in sorted(sources):
        if not out[s]:
            result.append({'sourceCode':s,'targetCode':None,'mappingType':'unmapped','sourceVersion':source_version,'targetVersion':target_version,'mappingSource':mapping_source,'confidenceBasis':'No official target relation; no inferred mapping','valueTransfer':'PROHIBITED'});continue
        for t in sorted(out[s]):
            kind=('many' if len(inc[t])>1 else '1')+'-to-'+('many' if len(out[s])>1 else '1')
            result.append({'sourceCode':s,'targetCode':t,'mappingType':kind,'sourceVersion':source_version,'targetVersion':target_version,'mappingSource':mapping_source,'confidenceBasis':'Published official taxonomy relation; not a weight or exposure-transfer authorization','valueTransfer':'NO_AUTOMATIC_CLONING_OR_POOLING'})
    return result

def onet_bundle(raw):
    files=['Occupation Data','Task Statements','Task Ratings','Work Activities','Essential Skills','Transferable Skills','Knowledge','Software Skills','Scales Reference']
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        require(sum(i.file_size for i in z.infolist())<150_000_000,'Oversized O*NET archive')
        readme=z.read('db_31_0_text/Read Me.txt').decode('utf-8-sig')
        require(readme.startswith('O*NET 31.0 Database\nAugust 2026 Release') or readme.startswith('O*NET 31.0 Database\r\nAugust 2026 Release'),'O*NET database version mismatch')
        tables={f:tabular(z.read('db_31_0_text/'+f+'.txt'),'\t') for f in files}
    occupations=tables['Occupation Data'];unique(occupations,['O*NET-SOC Code']);require(len(occupations)==1016,'O*NET count changed')
    codes={r['O*NET-SOC Code'] for r in occupations};require(all(ONET.fullmatch(c) for c in codes),'Invalid O*NET code')
    scales={r['Scale ID']:(number(r['Minimum']),number(r['Maximum'])) for r in tables['Scales Reference']}
    for name,rows in tables.items():
        if name in ('Occupation Data','Scales Reference'):continue
        require(all(r['O*NET-SOC Code'] in codes for r in rows),'Task/descriptor outside taxonomy')
        if name=='Task Statements':
            unique(rows,['O*NET-SOC Code','Task ID']);require(all(r['Task'] and r['Task ID'].isdigit() for r in rows),'Invalid task text/ID')
        if 'Scale ID' in rows[0]:
            unique(rows,['O*NET-SOC Code','Task ID','Scale ID','Category'] if name=='Task Ratings' else ['O*NET-SOC Code','Element ID','Scale ID'])
            for r in rows:
                require(r['Scale ID'] in scales,'Unknown descriptor scale');number(r['Data Value'],*scales[r['Scale ID']])
    require(len(tables['Task Statements'])==18838,'Task coverage changed')
    taskkeys={(r['O*NET-SOC Code'],r['Task ID']) for r in tables['Task Statements']}
    require(all((r['O*NET-SOC Code'],r['Task ID']) in taskkeys for r in tables['Task Ratings']),'Rating without source task')
    return tables

def academic(raw_occ,raw_tasks,raw_weights):
    cols=['O*NET-SOC Code','Title','dv_rating_alpha','dv_rating_beta','dv_rating_gamma','human_rating_alpha','human_rating_beta','human_rating_gamma']
    occ=tabular(raw_occ,required=cols);tasks=tabular(raw_tasks,'\t');weights=tabular(raw_weights,'\t')
    unique(occ,['O*NET-SOC Code']);unique(tasks,['O*NET-SOC Code','Task ID']);unique(weights,['O*NET-SOC Code','Task ID'])
    require(len(occ)==923 and len(tasks)==len(weights)==19265,'Academic coverage changed')
    by=defaultdict(list);weightmap={(r['O*NET-SOC Code'],r['Task ID']):r for r in weights}
    for r in tasks:
        require(ONET.fullmatch(r['O*NET-SOC Code']) and r['Task'],'Academic code/text')
        for k in ('human_exposure_agg','gpt4_exposure','gpt4_exposure_alt_rubric','human_labels'):require(r[k] in ('E0','E1','E2'),'Exposure category changed')
        require(r['gpt4_automation'] in ('T0','T1','T2','T3','T4'),'Auxiliary automation category changed')
        w=weightmap[(r['O*NET-SOC Code'],r['Task ID'])]
        require(w['Task']==r['Task'] and w['Task Type']==r['Task Type'],'Task/weight mismatch')
        weight=2 if r['Task Type']=='Core' else 1
        require(int(w['coreweight'])==weight and int(w['equalweight'])==1,'Academic weighting changed')
        require(number(r['automation'],0,1)==int(r['gpt4_automation'][1:])/4,'Automation source coding changed')
        for col,cat in [('alpha',{'E0':0,'E1':1,'E2':0}),('beta',{'E0':0,'E1':1,'E2':.5}),('gamma',{'E0':0,'E1':1,'E2':1})]:require(number(r[col],0,1)==cat[r['gpt4_exposure']],'Task transform changed')
        r['sourceCoreWeight']=weight;by[r['O*NET-SOC Code']].append(r)
    for o in occ:
        rs=by[o['O*NET-SOC Code']];den=sum(r['sourceCoreWeight'] for r in rs);require(den>0,'Missing task operands')
        for prefix,label in [('dv_rating','gpt4_exposure'),('human_rating','human_exposure_agg')]:
            for suffix,cat in [('alpha',{'E0':0,'E1':1,'E2':0}),('beta',{'E0':0,'E1':1,'E2':.5}),('gamma',{'E0':0,'E1':1,'E2':1})]:
                field=prefix+'_'+suffix;v=number(o[field],0,1);computed=sum(cat[r[label]]*r['sourceCoreWeight'] for r in rs)/den
                require(math.isclose(v,computed,abs_tol=1e-12),'Published academic aggregate does not reconcile to source tasks')
                o[field]=v
        o['taskCount']=len(rs);o['weightSum']=den
    return occ,tasks

def microsoft(raws):
    scores=tabular(raws['ms_scores'],required=['SOC Code','title','ai_applicability_score']);unique(scores,['SOC Code']);require(len(scores)==785,'Microsoft coverage changed')
    tables={k:tabular(raws[k]) for k in ('ms_iwa','ms_weights','ms_nonphysical','ms_mapping','ms_physical','ms_socmetrics')}
    iwa={r['IWA']:r for r in tables['ms_iwa']};require(len(iwa)==len(tables['ms_iwa']),'Duplicate IWA')
    weights={r['SOC Code']:r for r in tables['ms_weights']};nonphysical={r['SOC Code']:r for r in tables['ms_nonphysical']}
    require(len(weights)==len(tables['ms_weights']) and len(nonphysical)==len(tables['ms_nonphysical']),'Duplicate weight occupation')
    relations=defaultdict(list);unique(tables['ms_mapping'],['SOC Code','IWA'])
    for r in tables['ms_mapping']:require(r['IWA'] in iwa,'Unknown IWA reference');relations[r['SOC Code']].append(r['IWA'])
    unique(tables['ms_physical'],['Task ID']);require(all(r['Physical'] in ('True','False') for r in tables['ms_physical']),'Physical task category')
    for r in iwa.values():
        for key in r:
            if key not in ('IWA','title') and r[key]!='':number(r[key],0,1)
    for o in scores:
        c=o['SOC Code'];require(SOC.fullmatch(c) and c in weights and c in nonphysical and c in relations,'Microsoft code/weight reference')
        ws=weights[c];np=nonphysical[c];den=sum(number(ws[i],0) for i in relations[c]);require(den>0,'Missing IWA weights')
        computed=0
        for i in relations[c]:
            require(number(np[i],0)<=number(ws[i],0)+1e-10,'Nonphysical weight exceeds total')
            for side in ('user','ai'):
                a=iwa[i];w=ws[i] if side=='user' else np[i]
                # Source coverage gate makes unobserved activities contribute zero;
                # their missing completion cells remain missing in retained tables.
                if number(a['share_'+side],0,1)>.0005:
                    computed+=number(w,0)*number(a['completion_'+side],0,1)*number(a['impact_scope_'+side],0,1)/den/2
        o['ai_applicability_score']=number(o['ai_applicability_score'],0,1)
        require(math.isclose(o['ai_applicability_score'],computed,abs_tol=1e-10),'Microsoft score/decomposition does not reconcile')
    return scores,tables

def anthropic(raws):
    tasks=tabular(raws['anthro_tasks'],required=['task_name','pct']);historical=tabular(raws['anthro_task_statements']);modes=tabular(raws['anthro_modes'],required=['interaction_type','pct'])
    unique(tasks,['task_name']);unique(historical,['O*NET-SOC Code','Task ID']);unique(modes,['interaction_type'])
    require(len(tasks)==3514 and len(historical)==19530,'Anthropic coverage changed')
    for r in tasks:r['pct']=number(r['pct'],0,100)
    require(math.isclose(sum(r['pct'] for r in tasks),100,abs_tol=1e-7),'Task usage percentage denominator changed')
    require({r['interaction_type'] for r in modes}=={'directive','feedback loop','task iteration','learning','validation','none'},'Interaction vocabulary changed')
    for r in modes:r['pct']=number(r['pct'],0,100)
    require(0<sum(r['pct'] for r in modes)<=100.00001,'Interaction shares invalid')
    require(all(ONET.fullmatch(r['O*NET-SOC Code']) and r['Task'] for r in historical),'Invalid historical usage task structure')
    return tasks,historical,modes
