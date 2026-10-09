"""Offline reparse of preserved text controls and deterministic feasibility artifact.
Full spreadsheet re-extraction: extract.py --cache EXTERNAL_CACHE --check.
"""
import argparse,gzip,hashlib,json,tempfile
from pathlib import Path
import build,extract

def controls():
 sources=build.load('source-manifest.json')['sources'];ix={s['sourceId']:s for s in sources}
 with tempfile.TemporaryDirectory(prefix='wil-c1a-offline-') as tmp:
  cache=Path(tmp)
  for file in (build.R/'inputs/raw-controls').glob('*.gz'):
   id=file.stem;b=gzip.decompress(file.read_bytes());s=ix[id];build.require(hashlib.sha256(b).hexdigest()==s['sha256'],'Raw control hash mismatch '+id)
   p=cache/'objects'/s['sha256'][:2]/s['sha256'];p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b);(cache/(id+'.json')).write_text(json.dumps(s))
  results={}
  for name,func in [('weather-monthly.json',extract.weather),('henryhub-monthly.json',extract.gas),('geography.json',extract.geography)]:
   b=extract.input_bytes(func(cache));build.require(b==(build.R/'inputs'/name).read_bytes(),'Offline control reparse mismatch '+name);results[name]=hashlib.sha256(b).hexdigest()
 return results
if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('--controls',action='store_true');args=a.parse_args();build.validate();build.check_inherited()
 if args.controls:print(json.dumps(controls(),sort_keys=True))
 else:print(json.dumps(build.comparison(),ensure_ascii=False,indent=2))
