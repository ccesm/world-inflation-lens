import hashlib,json,pathlib
from build import ROOT,dump
records=[
 ('microsoft-fy2026-q4-call','https://www.microsoft.com/en-us/investor/events/fy-2026/earnings-fy-2026-q4','2026-07-29','sources/microsoft-fy2026-q4-call.html'),
 ('microsoft-fy2026-q4-release','https://www.microsoft.com/en-us/investor/earnings/fy-2026-q4/press-release-webcast','2026-07-29','sources/microsoft-fy2026-q4-release.html'),
 ('alphabet-q2-2026','https://s206.q4cdn.com/479360582/files/doc_financials/2026/q2/2026q2-alphabet-earnings-release.pdf','2026-07-22','sources/alphabet-2026-q2-release.pdf'),
 ('amazon-q2-2026','https://ir.aboutamazon.com/news-release/news-release-details/2026/Amazon-com-Announces-Second-Quarter-Results/','2026-07-30',None),
 ('meta-q2-2026','https://investor.atmeta.com/investor-news/press-release-details/2026/Meta-Reports-Second-Quarter-2026-Results/','2026-07-29',None),
 ('oracle-q1-fy2027','https://investor.oracle.com/investor-news/news-details/2026/Oracle-Announces-Q1-Results-Driven-by-Triple-Digit-Growth-in-Cloud-Infrastructure-Revenues/default.aspx','2026-09-10',None),
 ('meta-2025-10k','https://www.sec.gov/Archives/edgar/data/1326801/000162828026003942/meta-20251231.htm','2026-01-29',None)]
out=[]
for sid,url,date,path in records:
 out.append({'id':sid,'url':url,'publication_date':date,'retrieved_date':'2026-10-08','primary_source':True,'captured_path':path,'sha256':hashlib.sha256((ROOT/path).read_bytes()).hexdigest() if path else None,'extracted_observations':'supplemental-evidence.json','capture_method':'Unmodified downloaded source' if path else 'Primary page viewed with web tool; structured cells retained, full HTML download blocked by host'})
dump('supplemental-source-register.json',out)
p=ROOT/'sources/paper-validation-object.pdf'
dump('paper-object-register.json',{'role':'OBJECT_OF_VALIDATION_ONLY','title':'Financing the AI Buildout','author':'Stijn Van Nieuwerburgh','version_date':'2026-09-04','canonical_page':'https://www.brookings.edu/articles/financing-the-ai-buildout/','pdf_url':'https://www.brookings.edu/wp-content/uploads/2026/09/4c_Van-Nieuwerburgh.pdf','sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'captured_path':str(p.relative_to(ROOT)),'figure_locator':'Figure 1, printed page 6, PDF page 7','input_boundary':'Paper values appear only in compare.py / paper-comparison.csv, not independent construction.'})
