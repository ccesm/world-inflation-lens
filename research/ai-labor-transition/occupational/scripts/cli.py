#!/usr/bin/env python3
import argparse,json,sys
from common import ROOT
from pipeline import run,validate_outputs

def main():
    p=argparse.ArgumentParser(description='Research-only occupational exposure; no causal labor attribution')
    p.add_argument('action',choices=['normalize','refresh','validate']);p.add_argument('--root',type=__import__('pathlib').Path,default=ROOT);p.add_argument('--output',type=__import__('pathlib').Path);p.add_argument('--providers')
    args=p.parse_args();out=args.output or args.root.parent/'normalized'
    if args.action=='validate':print(json.dumps({'validatedArtifacts':validate_outputs(args.root,out)}));return 0
    h=run(args.root,out,args.action,args.providers.split(',') if args.providers else None)
    print(json.dumps({'sources':{k:v['status'] for k,v in h['providers'].items()},'interpretationGuardrail':h['interpretationGuardrail']},indent=2))
    return 2 if any(v['status'] in ('FAILED','UNAVAILABLE','LICENSE_RESTRICTED','VERSION_MISMATCH') for v in h['providers'].values()) else 0
if __name__=='__main__':
    try:sys.exit(main())
    except Exception as exc:print(f'Crosswalk error: {type(exc).__name__}: {exc}',file=sys.stderr);sys.exit(1)
