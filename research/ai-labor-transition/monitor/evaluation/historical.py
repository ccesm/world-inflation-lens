"""Descriptive current-vintage endpoint inspection, never real-time replay."""
from monitor_common import *
from evaluation.evidence import state_for

def reconstruction(detail):
    rows=[];thresholds={'employment':'employmentGapPp','hours':'hoursGap','earnings':'earningsGapPp','youngWorkers':'youngShareGapPp'}
    for source,v in detail['sourceResults'].items():
        years=sorted({p['year'] for points in v['metricEndpointPaths'].values() for p in points})
        for y in years:
            coverage=v['coverageByYear'].get(y,v['coverageByYear'].get(str(y)))
            metrics={m:state_for([p for p in points if p['year']<=y],spec()['thresholds'][thresholds[m]],coverage,v['metrics']['employment']['pretrendGapPpPerYear'] if m=='employment' else None,comparable=m!='earnings') for m,points in v['metricEndpointPaths'].items()}
            rows.append({'source':source,'endpointYear':y,'metrics':metrics})
    return {'mode':'CURRENT_VINTAGE_RECONSTRUCTION','realTimeBacktest':False,'publisherVintageReplay':False,'source':'Accepted current-vintage CPS sufficient statistics and fixed exposure groups','referenceYears':[2015,2019],'pandemicRetained':[2020,2021],'transitionYear':2022,'rows':rows,'causalityStatus':'DESCRIPTIVE_ONLY','uncertainty':spec()['uncertainty']}
