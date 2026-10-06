"""Bounded recovery package; local validation before any separately approved write."""
import argparse,shutil,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from monitor_common import *

def prepare(incoming,dest,apply=False):
    incoming=Path(incoming);dest=Path(dest);allowed={'inputs.json','occupation-cache.json','alert-ledger.json','history-manifest.json'}
    immutable=('objects/','evaluations/','intake/sources/raw/','intake/sources/manifests/')
    files=[p for p in incoming.rglob('*') if p.is_file() or p.is_symlink()]
    require(sum(p.stat().st_size for p in files)<spec()['retention']['maxStoreBytes'],'History quota exceeded')
    require(files and (incoming/'history-manifest.json').exists(),'Incomplete history package')
    for p in files:
        name=str(p.relative_to(incoming));require(not p.is_symlink(),'History symlink rejected')
        require(name in allowed or name.startswith(immutable),'Unexpected history path')
        require(p.suffix in ['.json','.gz'] and p.stat().st_size<8_000_000,'Unqualified large/raw archive')
        prior=dest/name
        if prior.exists() and name.startswith(immutable):require(prior.read_bytes()==p.read_bytes(),'Immutable history overwrite rejected')
    for p in dest.rglob('*') if dest.exists() else []:
        if p.is_file() and str(p.relative_to(dest)).startswith(immutable):require((incoming/p.relative_to(dest)).exists(),'History package drops retained evidence')
    if apply:
        for p in files:
            target=dest/p.relative_to(incoming);write_atomic(target,p.read_bytes())
    return {'validatedFiles':len(files),'applied':apply,'email':'DISABLED'}
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('incoming',type=Path);p.add_argument('destination',type=Path);p.add_argument('--apply',action='store_true');a=p.parse_args();print(prepare(a.incoming,a.destination,a.apply))
