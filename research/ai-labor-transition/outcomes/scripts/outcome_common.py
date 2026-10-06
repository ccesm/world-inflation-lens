"""Shared strict research primitives; no production imports."""
import sys,json,gzip
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parents[2]/'scripts'))
from core import canonical,sha256,require,SourceError,write_atomic,write_immutable,now,validate_schema
ROOT=Path(__file__).resolve().parents[1]
GUARDRAIL='Observed differences across AI-exposure groups do not establish that AI caused those differences.'
VERSION='observed-labor-outcomes-v1'
SPEC_SHA='f3429802af3354335d5c724fc5497a24dde41ea11ac8178b2ac88c9416148b5e'

def read(path):
    b=Path(path).read_bytes()
    return json.loads(gzip.decompress(b) if str(path).endswith('.gz') else b)

def save(path,data,immutable=False):
    b=canonical(data)
    if str(path).endswith('.gz'):b=gzip.compress(b,mtime=0)
    (write_immutable if immutable else write_atomic)(Path(path),b)

def spec(root=ROOT):
    b=(Path(root)/'preanalysis-spec.json').read_bytes()
    require(sha256(b)==SPEC_SHA,'Frozen preanalysis specification changed')
    require((Path(root)/'accepted/preanalysis-spec.json').read_bytes()==b,'Specification archive mismatch')
    require((Path(root)/'preanalysis-spec.sha256').read_text().strip()==SPEC_SHA,'Specification hash marker mismatch')
    return json.loads(b)
