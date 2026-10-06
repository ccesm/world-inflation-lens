"""Read-only reuse of accepted research primitives, isolated monitor identities."""
import importlib.util,sys,json,gzip,functools
from pathlib import Path
ROOT=Path(__file__).resolve().parent
LABOR=ROOT.parent
sys.path.insert(0,str(LABOR/'scripts'))
from core import canonical,sha256,require,SourceError,now,timestamp,iso_date,month_index,month_at,month_bounds,write_atomic,write_immutable,validate_schema
from catalog import PROVIDERS,SERIES,BTOS_FILES,BLS_API,SCHEMA_VERSION
from validation import validate_dataset
from bls import normalize_bls,requests_for

def module(name,path):
    s=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
P1=module('monitor_phase1',LABOR/'scripts/pipeline.py')
sys.path.insert(0,str(LABOR/'outcomes/scripts'))
P3=module('monitor_phase3',LABOR/'outcomes/scripts/pipeline.py')
import analysis as A
import intake as I
from outcome_common import spec as phase3_spec,read as read_outcome
SPEC_HASH='95379563882affdb1dbec2754d83f6b6d2400e5bd36be9eaba715ff8844e2476'
GUARD='Observed differences across AI-exposure groups do not establish that AI caused those differences.'

def spec():
    b=(ROOT/'monitor-spec.json').read_bytes();require(sha256(b)==SPEC_HASH,'Frozen monitor rules changed')
    require((ROOT/'monitor-spec.sha256').read_text().strip()==SPEC_HASH,'Spec marker changed')
    return json.loads(b)

def read(path):
    b=Path(path).read_bytes();return json.loads(gzip.decompress(b) if str(path).endswith('.gz') else b)

def put(path,v,immutable=False):
    b=canonical(v)
    if str(path).endswith('.gz'):b=gzip.compress(b,mtime=0)
    (write_immutable if immutable else write_atomic)(path,b)

def object_put(store,v):
    h=sha256(canonical(v));put(Path(store)/'objects'/f'{h}.json.gz',v,True);return h

def object_get(store,h):
    require(isinstance(h,str) and len(h)==64 and all(c in '0123456789abcdef' for c in h),'Invalid object identity')
    v=read(Path(store)/'objects'/f'{h}.json.gz');require(sha256(canonical(v))==h,'Stored object hash mismatch');return v

def baseline():
    spec();P3.configuration(LABOR/'outcomes')
    require(sha256((LABOR/'outcomes/output-manifest.json').read_bytes())==spec()['phase3OutputManifestHash'],'Frozen Phase3 benchmark changed')
    for name,h in read(LABOR/'outcomes/output-manifest.json')['artifacts'].items():require(sha256(canonical(read(LABOR/'outcomes'/name)))==h,'Benchmark artifact changed')
    return read(LABOR/'outcomes/exposure-group-outcomes.json')['data']


@functools.lru_cache(maxsize=1)
def implementation_identity():
    paths=[ROOT/'monitor_common.py',ROOT/'cli.py',*(ROOT/'refresh').glob('*.py'),*(ROOT/'evaluation').glob('*.py'),*(ROOT/'history').glob('*.py')]
    return sha256(canonical({str(p.relative_to(ROOT)):sha256(p.read_bytes()) for p in sorted(paths)}))

# Pin executing code identity once per process, independent of run clocks.
implementation_identity()
