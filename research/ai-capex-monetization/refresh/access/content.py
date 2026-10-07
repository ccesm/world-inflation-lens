"""Bounded document checks; no economic extraction, cookies or network."""
import base64, io, json, re, sys
from html.parser import HTMLParser

class Text(HTMLParser):
    def __init__(self): super().__init__(); self.parts=[]
    def handle_data(self, data): self.parts.append(data)

def check(meta, raw):
    kind=meta['kind']; mime=meta['mime'].split(';')[0].lower().strip()
    if kind=='pdf':
        if mime!='application/pdf' or not raw.startswith(b'%PDF-'): return 'CONTENT_TYPE_REJECTED'
        from pypdf import PdfReader
        doc=PdfReader(io.BytesIO(raw))
        if len(doc.pages)>500: return 'LAYOUT_UNSUPPORTED'
        text=' '.join((p.extract_text() or '') for p in doc.pages)
    elif kind=='xlsx':
        if mime!='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' or not raw.startswith(b'PK'): return 'CONTENT_TYPE_REJECTED'
        # Limit uncompressed ZIP size before parsing the workbook.
        import zipfile
        z=zipfile.ZipFile(io.BytesIO(raw))
        if sum(i.file_size for i in z.infolist())>100_000_000: return 'LAYOUT_UNSUPPORTED'
        from openpyxl import load_workbook
        w=load_workbook(io.BytesIO(raw), read_only=True, data_only=True)
        text=' '.join(str(v) for sh in w for row in sh.iter_rows(values_only=True) for v in row if v is not None)
        w.close()
    else:
        if mime not in ['text/html','application/xhtml+xml']: return 'CONTENT_TYPE_REJECTED'
        html=raw.decode('utf-8',errors='replace')
        if not re.search(r'<(?:html|table|body)\b',html,re.I): return 'LAYOUT_UNSUPPORTED'
        p=Text(); p.feed(html); text=' '.join(p.parts)
    if re.search(r'access denied|request unsuccessful|just a moment|verify you are human|captcha|robot check',text,re.I): return 'LAYOUT_UNSUPPORTED'
    issuer={'MSFT':r'Microsoft','GOOG':r'Alphabet','AMZN':r'Amazon','META':r'Meta Platforms|Meta Reports'}[meta['company']]
    if not re.search(issuer,text,re.I): return 'ISSUER_MISMATCH'
    if not re.search(r'revenue|net sales|cash flow|income statement|financial results|earnings|financial data',text,re.I): return 'LAYOUT_UNSUPPORTED'
    period=meta.get('periodEnd')
    if period:
        y,m,d=map(int,period.split('-'))
        month=['','January','February','March','April','May','June','July','August','September','October','November','December'][m]
        native=rf'{month}\s+{d}(?:st|nd|rd|th)?\s*,?\s*{y}'
        # Workbook and earnings-call native fiscal labels are valid period markers.
        fy=meta.get('fiscalLabel')
        if not re.search(native,text,re.I) and not (fy and (re.search(re.escape(fy),text,re.I) or (meta['company']=='MSFT' and re.search(r'(?:Fiscal Year 2026|FY26)\s+Fourth Quarter',text,re.I)))):
            return 'PERIOD_MISMATCH'
    return 'VALID_DOCUMENT'

if __name__=='__main__':
    x=json.load(sys.stdin)
    try: result=check(x,base64.b64decode(x['raw']))
    except Exception: result='LAYOUT_UNSUPPORTED'
    print(json.dumps({'result':result}))
