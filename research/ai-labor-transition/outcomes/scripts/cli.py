#!/usr/bin/env python3
import argparse,json,sys
from pathlib import Path
from outcome_common import ROOT
from pipeline import normalize,validate,accept_cps,refresh

def main():
    p=argparse.ArgumentParser(description='Research-only descriptive labor outcomes; no AI causal attribution')
    p.add_argument('action',choices=['ingest','normalize','validate','refresh']);p.add_argument('--root',type=Path,default=ROOT);p.add_argument('--cache',type=Path)
    a=p.parse_args()
    if a.action in ('ingest','refresh'):
        p.error('--cache is required for raw archives') if a.cache is None else None
        if a.action=='ingest':r=accept_cps(a.root,a.cache);print(json.dumps({'months':len(r),'failures':sum(x['status']!='CURRENT' for x in r.values())}));return
        print(json.dumps({'failedFiles':refresh(a.root,a.cache)}));return
    print(json.dumps(normalize(a.root) if a.action=='normalize' else validate(a.root,a.cache),indent=2))
if __name__=='__main__':
    try:main()
    except Exception as e:print(f'Outcome pipeline failed: {type(e).__name__}: {e}',file=sys.stderr);sys.exit(1)
