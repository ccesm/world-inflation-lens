"""Operator-only frozen-source retrieval. No discovery, estimates or publication.
python3 fetch_sources.py --source-id eia861m-state --cache /EXTERNAL/CACHE
Up to20explicit sources; one-second separation, no retry, per-run host block.
"""
import argparse,datetime,hashlib,json,time,urllib.request,urllib.error
from urllib.parse import urlsplit
from pathlib import Path
import build
MAX_BYTES=45*1024*1024
class Redirect(urllib.request.HTTPRedirectHandler):
 def __init__(self,allowed):super().__init__();self.allowed=allowed;self.count=0
 def redirect_request(self,req,fp,code,msg,headers,url):
  self.count+=1;u=urlsplit(url)
  if self.count>3 or u.scheme!='https' or u.username or u.password or u.hostname not in self.allowed:raise ValueError('REDIRECT_REJECTED')
  return super().redirect_request(req,fp,code,msg,headers,url)
def external(cache):
 p=cache.resolve();build.require(not any((a/'.git').exists() for a in [p,*p.parents]),'Cache must be outside repository');return p
def main():
 ap=argparse.ArgumentParser();ap.add_argument('--source-id',nargs='+',required=True);ap.add_argument('--cache',type=Path,required=True);a=ap.parse_args();cache=external(a.cache);cache.mkdir(parents=True,exist_ok=True)
 build.validate();build.require(build.identity()==build.load('content-identity.json'),'Frozen research identity mismatch')
 sources={s['sourceId']:s for s in build.load('source-manifest.json')['sources']};build.require(len(a.source_id)<=20 and all(x in sources for x in a.source_id),'Explicit known source IDs required; maximum20')
 blocked=set();previous=0
 for id in a.source_id:
  s=sources[id];host=urlsplit(s['url']).hostname;rec=dict(sourceId=id,url=s['url'],retrievedAt=datetime.datetime.now(datetime.timezone.utc).isoformat())
  if host in blocked:rec.update(status='ACCESS_BLOCKED',reason='HOST_BLOCKED_EARLIER_THIS_RUN')
  else:
   time.sleep(max(0,1-(time.monotonic()-previous)));previous=time.monotonic()
   try:
    allowed={host,urlsplit(s['resolvedURL']).hostname} if s.get('resolvedURL') else {host}
    req=urllib.request.Request(s['url'],headers={'User-Agent':'WorldInflationLens C1A research; contact https://github.com/ccesm/world-inflation-lens/issues'})
    with urllib.request.build_opener(Redirect(allowed)).open(req,timeout=30) as response:
     b=response.read(MAX_BYTES+1);build.require(0<len(b)<=MAX_BYTES,'SIZE_OR_EMPTY_REJECTED');h=hashlib.sha256(b).hexdigest();p=cache/'objects'/h[:2]/h;p.parent.mkdir(parents=True,exist_ok=True)
     if p.exists():build.require(p.read_bytes()==b,'Immutable object conflict')
     else:p.write_bytes(b)
     rec.update(status='UNCHANGED_HASH' if h==s.get('sha256') else 'CHANGED_BYTES_REVIEW_REQUIRED',httpStatus=response.status,MIME=response.headers.get('Content-Type'),byteSize=len(b),sha256=h,resolvedURL=response.url)
   except urllib.error.HTTPError as e:
    rec.update(status='ACCESS_BLOCKED' if e.code in [403,429] else 'HTTP_ERROR',httpStatus=e.code,retryAfter=e.headers.get('Retry-After'))
    if e.code in [403,429]:blocked.add(host)
   except Exception as e:rec.update(status='FETCH_FAILED',reason=str(e))
  receipt=cache/'receipts';receipt.mkdir(exist_ok=True);name=id+'-'+rec['retrievedAt'].replace(':','').replace('+','')+'.json';(receipt/name).write_text(json.dumps(rec,indent=2)+'\n');print(json.dumps(rec))
if __name__=='__main__':main()
