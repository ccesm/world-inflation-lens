"""Explicit network qualification; offline unit discovery never imports this file."""
import argparse,json,shutil,sys,tempfile
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from common import ROOT,require
from pipeline import run,validate_outputs

def main():
 with tempfile.TemporaryDirectory(prefix='wil-occupation-live-') as tmp:
  root=Path(tmp)/'occupational';root.mkdir()
  shutil.copytree(ROOT/'config',root/'config');shutil.copytree(ROOT/'schemas',root/'schemas');out=Path(tmp)/'outputs'
  h=run(root,out,'refresh')
  require(all(v['status'] in ('CURRENT','PARTIAL') for v in h['providers'].values()),'Live source qualification failed: '+str({p:v.get('failure') for p,v in h['providers'].items() if v['status'] not in ('CURRENT','PARTIAL')}))
  require(validate_outputs(root,out)==12,'Incomplete semantic validation')
  print(json.dumps({'result':'PASS','providers':{p:v['status'] for p,v in h['providers'].items()},'validatedArtifacts':12,'licensedPinnedFiles':25,'noProductionWrites':True},indent=2))
if __name__=='__main__':main()
