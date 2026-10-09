"""Rebuild inherited evidence bytes and the C0 identity offline; outputs stdout only."""
import copy,json,sys
import validate as v

def evidence_bytes():
 d=copy.deepcopy(v.load('evidence-register.json'))
 bridges=v.load('../phase-b1/funding-bridges.json')
 for e in d['evidence']:
  if e['claimType']!='INHERITED_DESCRIPTIVE':continue
  p=e['observation'];b=next(x for x in bridges if x['company']==p['company'] and x['label']==p['label'])
  for k in ['basis','start','end','filed','accession','company_convention_fcf_usd','fcf_definition','ocf_coverage_limitation']:p[k]=b[k]
  p['reported_values_usd']={k:b['reported_values_usd'][k] for k in p['reported_values_usd']}
  p['source_refs']={k:b['source_refs'][k] for k in p['source_refs']}
 return (json.dumps(d,ensure_ascii=False,indent=2)+'\n').encode()
if __name__=='__main__':
 v.main();v.require(evidence_bytes()==(v.R/'evidence-register.json').read_bytes(),'Evidence rebuild mismatch')
 if '--evidence' in sys.argv:sys.stdout.buffer.write(evidence_bytes())
 else:print(json.dumps(v.identity(),sort_keys=True,ensure_ascii=False))
