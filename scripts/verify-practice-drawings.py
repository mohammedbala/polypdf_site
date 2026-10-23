"""Check drawing geometry, reference arithmetic, preserved annotations and PDF readability."""
from pathlib import Path
import hashlib,json,math
from pypdf import PdfReader
from pypdf.generic import IndirectObject, StreamObject
import pdfplumber
ROOT=Path(__file__).resolve().parents[1];P=ROOT/'public/samples/takeoff'
def normalized(v,seen=None):
 seen=set() if seen is None else seen
 if isinstance(v,IndirectObject):v=v.get_object()
 if isinstance(v,dict):
  if id(v) in seen:return 'cycle'
  seen=seen|{id(v)}
  obj={str(k):normalized(x,seen) for k,x in v.items() if k not in ['/P','/Length']}
  if isinstance(v,StreamObject):obj['_stream_sha256']=hashlib.sha256(v.get_data()).hexdigest()
  return obj
 if isinstance(v,(list,tuple)):return [normalized(x,seen) for x in v]
 if isinstance(v,(int,float)):return float(v)
 return str(v)
def area(vertices):
 p=list(zip(vertices[::2],vertices[1::2]));return abs(sum(x*y2-x2*y for (x,y),(x2,y2) in zip(p,p[1:]+p[:1])))/2/81
results=[]
for kind,name,expected in [('flooring','flooring-mac-measured.pdf',[228,180]),('electrical','electrical-mac-route.pdf',[42])]:
 old=PdfReader(ROOT/'assets-source/samples/original-app-outputs'/name);new=PdfReader(P/name)
 assert len(old.pages)==len(new.pages)==1
 a,b=old.pages[0],new.pages[0];assert tuple(a.mediabox)==tuple(b.mediabox)==(0,0,792,612)
 oa=[normalized(x) for x in a['/Annots']];na=[normalized(x) for x in b['/Annots']];assert oa==na,'Annotation payload changed'
 for k in ['/VP','/PieceInfo']:assert normalized(a.get(k))==normalized(b.get(k)),k
 values=[]
 for r in b['/Annots']:
  r=r.get_object();v=[float(x) for x in r['/Vertices']]
  if kind=='flooring':values.append(area(v))
  else:
   points=list(zip(v[::2],v[1::2]));values.append(sum(math.dist(p,q) for p,q in zip(points,points[1:]))/9)
 assert values==expected,(values,expected)
 text=b.extract_text();assert 'Republished example' in text and 'NORTHLINE STUDIO ANNEX' in text
 results.append({'file':name,'annotationCount':len(na),'originalAnnotationsUnchanged':True,'quantities':values})
for kind in ['flooring','electrical']:
 for suffix in ['practice','reference']:
  name=f'{kind}-{suffix}.pdf';reader=PdfReader(P/name);assert len(reader.pages)==1
  assert 'NOT FOR CONSTRUCTION' in reader.pages[0].extract_text()
  with pdfplumber.open(P/name) as d:
   for c in d.pages[0].chars:
    assert c['x0']>=23 and c['x1']<=769 and c['top']>=23 and c['bottom']<=589,(name,c['text'],c['x0'],c['top'])
with pdfplumber.open(P/'electrical-practice.pdf') as d:
 p=d.pages[0]
 # Count only circles/rectangles in the drawing view, not the legend or detail bubbles.
 circles=[x for x in p.curves if abs(x['width']-16)<.01 and abs(x['height']-16)<.01 and 70<x['x0']<350 and 340<x['y0']<485]
 squares=[x for x in p.rects if abs(x['width']-16)<.01 and abs(x['height']-16)<.01 and 401<x['x0']<570 and 340<x['y0']<485]
 assert len(circles)==8 and len(squares)==4,(len(circles),len(squares))
manifest=json.loads((P/'manifest.json').read_text())
for name,digest in manifest['files'].items():assert hashlib.sha256((P/name).read_bytes()).hexdigest()==digest
print(json.dumps({'status':'passed','planFixtures':{'A':8,'B':4},'measuredExamples':results,'referencePdfTextBounds':'passed'},indent=2))
