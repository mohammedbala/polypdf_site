"""Construction-style practice sheets with invariant measurement coordinates.

Owned fictional artwork. No design/code-compliance representation. Historical
Mac annotations are preserved in explicitly documented republished derivatives.
"""
from pathlib import Path
import csv, json, hashlib, math, io
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color, white
from pypdf import PdfReader, PdfWriter
from pypdf.generic import NameObject, _base
# Preserve historical measurement conversion factors when serializing derivatives.
_base.FLOAT_WRITE_PRECISION = 17
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/samples/takeoff'; OUT.mkdir(parents=True,exist_ok=True)
W,H=792,612
INK=HexColor('#202629'); MUTED=HexColor('#60686b'); PALE=HexColor('#e5e8e8')
def text(c,x,y,value,size=8,bold=False,align='left',color=INK):
 c.setFillColor(color);c.setFont('Helvetica-Bold' if bold else 'Helvetica',size)
 {'left':c.drawString,'center':c.drawCentredString,'right':c.drawRightString}[align](x,y,value)
def line(c,x1,y1,x2,y2,width=.45,color=INK):
 c.setStrokeColor(color);c.setLineWidth(width);c.line(x1,y1,x2,y2)
def rect(c,x,y,w,h,width=.5,fill=None):
 c.setLineWidth(width);c.setStrokeColor(INK)
 if fill:c.setFillColor(fill)
 c.rect(x,y,w,h,stroke=int(width>0),fill=int(fill is not None))
def path(c,pts,width=.65,fill=None,close=False):
 c.setLineWidth(width);c.setStrokeColor(INK)
 if fill:c.setFillColor(fill)
 p=c.beginPath();p.moveTo(*pts[0])
 for q in pts[1:]:p.lineTo(*q)
 if close:p.close()
 c.drawPath(p,stroke=int(width>0),fill=int(fill is not None))
def hatch(c,pts,spacing=9):
 c.saveState();p=c.beginPath();p.moveTo(*pts[0])
 for q in pts[1:]:p.lineTo(*q)
 p.close();c.clipPath(p,stroke=0);c.setStrokeColor(HexColor('#d3d7d7'));c.setLineWidth(.25)
 for x in range(-500,800,spacing):c.line(x,0,x+612,612)
 c.restoreState()
def dim(c,x1,y1,x2,y2,label,vertical=False):
 line(c,x1,y1,x2,y2,.35,MUTED)
 for x,y in [(x1,y1),(x2,y2)]:line(c,x-2.5,y-2.5,x+2.5,y+2.5,.7)
 c.saveState();c.translate((x1+x2)/2,(y1+y2)/2)
 if vertical:c.rotate(90)
 tw=c.stringWidth(label,'Helvetica',7)
 rect(c,-tw/2-3,-2,tw+6,10,0,white);text(c,0,1,label,7,align='center');c.restoreState()
def hdim(c,x1,x2,y,ey,label):
 for x in [x1,x2]:line(c,x,ey,x,y+4,.3,MUTED)
 dim(c,x1,y,x2,y,label)
def vdim(c,y1,y2,x,ex,label):
 for y in [y1,y2]:line(c,ex,y,x+4,y,.3,MUTED)
 dim(c,x,y1,x,y2,label,True)
def notes(c,x,y,title,rows,width=150):
 text(c,x,y,title,8,True);line(c,x,y-6,x+width,y-6,.7)
 cy=y-20
 for n,row in enumerate(rows,1):
  words=(f'{n:02d}  '+row).split();s=''
  for w in words:
   if c.stringWidth((s+' '+w).strip(),'Helvetica',7)>width:
    text(c,x,cy,s,7);cy-=10;s=w
   else:s=(s+' '+w).strip()
  if s:text(c,x,cy,s,7);cy-=10
  cy-=7
 return cy
def frame(name,code,title,discipline,scale='1/8" = 1\'-0"',derived=False):
 c=canvas.Canvas(str(OUT/name),pagesize=(W,H),invariant=1,pageCompression=1)
 c.setTitle('Northline Studio Annex | '+title);c.setAuthor('PolyPDF - original demonstration drawings')
 c.setSubject('Synthetic construction practice; not for construction; known geometry preserved')
 rect(c,24,24,744,564,.8)
 text(c,38,568,'NORTHLINE STUDIO ANNEX',13,True);text(c,38,551,title.upper(),9)
 text(c,754,568,'POLYPDF',15,True,align='right');text(c,754,550,'DRAWING PRACTICE SERIES',7,align='right')
 line(c,24,535,768,535,.8);line(c,24,82,768,82,.8)
 for x in [350,530,665]:line(c,x,24,x,82,.5)
 text(c,38,68,'PROJECT / ISSUE',6.5,True);text(c,38,52,'NA-26-101  |  PRACTICE ISSUE B',9,True)
 text(c,38,37,'DEMONSTRATION ONLY - NOT FOR CONSTRUCTION',7)
 text(c,364,68,'DRAWING',6.5,True);text(c,364,52,discipline,8)
 text(c,364,37,'Original PolyPDF fictional project',7)
 text(c,544,68,'SCALE / DATE',6.5,True);text(c,544,52,scale,8)
 text(c,544,37,'2026-10-17',7)
 text(c,680,67,'SHEET',6.5,True);text(c,750,39,code,23,True,align='right')
 if code in ['F-101','E-101']:line(c,584,96,584,520,.45,MUTED)
 return c
def door(c,x,y,width=27):
 # Upward swing; erase only wall opening, then show leaf and arc.
 rect(c,x,y-5,width,10,0,white);line(c,x,y,x,y+width,.65)
 c.setStrokeColor(MUTED);c.setLineWidth(.4);c.arc(x-width,y-width,x+width,y+width,0,90)
 line(c,x,y,x+width,y,.3,MUTED)
def window(c,x,y,w=42):
 rect(c,x,y-3,w,6,.45,white);line(c,x,y,x+w,y,.35)
def north(c,x,y):
 text(c,x,y+10,'N',8,True,align='center');path(c,[(x,y),(x-5,y-17),(x,y-13),(x+5,y-17)],.5,INK,True);line(c,x,y-13,x,y-29,.7)
def scale_bar(c,x,y):
 text(c,x,y+15,'GRAPHIC SCALE / FEET',6,True)
 for i in range(4):rect(c,x+22.5*i,y,22.5,5,.35,INK if i%2==0 else white)
 for i,v in enumerate(['0','2.5','5','7.5','10']):text(c,x+22.5*i,y-11,v,6,align='center')
 text(c,x,y-24,'9 PDF points = 1 foot. Calibrate before measuring.',6)
def view(c,x,y,num,title):
 c.setStrokeColor(INK);c.setLineWidth(.65);c.circle(x+9,y+3,9)
 text(c,x+9,y,num,8,True,align='center');text(c,x+25,y+3,title,9,True);line(c,x+25,y-2,566,y-2,.5)
def flooring():
 c=frame('flooring-practice.pdf','F-101','Floor finish plan and threshold detail','ARCHITECTURAL / FINISHES')
 text(c,44,509,'01 / FLOOR FINISH PLAN',9,True);text(c,44,496,'Dimensions to inside finish faces. Dashed thresholds close takeoff boundaries.',6.8)
 north(c,551,498)
 # Continuous suite envelope, corridor and three adjoining spaces.
 rect(c,84,220,447,184,.9,HexColor('#eeeeee'));rect(c,90,226,435,172,.65,white)
 rect(c,90,284,435,6,.5,HexColor('#eeeeee'))
 rect(c,270,290,6,108,.65,HexColor('#eeeeee'));rect(c,384,290,6,108,.65,HexColor('#eeeeee'))
 # Original exercise's two exact finish boundaries.
 net=[(90,290),(270,290),(270,371),(234,371),(234,398),(90,398)]
 hatch(c,net,10);path(c,net,.75,close=True)
 hatch(c,[(390,290),(525,290),(525,398),(390,398)],10)
 rect(c,234,371,36,27,.75,HexColor('#e2e5e5'));hatch(c,[(234,371),(270,371),(270,398),(234,398)],4)
 text(c,251,384,'SHAFT',5.5,True,align='center');text(c,251,376,'NO FINISH',4.6,align='center')
 door(c,112,287);door(c,316,287);door(c,418,287)
 for x,w in [(111,60),(183,42),(293,60),(418,65)]:window(c,x,401,w)
 for x in [105,465]:window(c,x,223,42)
 text(c,185,329,'ROOM 1',9,True,align='center');text(c,185,317,'PROJECT OFFICE',6.5,align='center');text(c,185,305,'F1 / 228 SF NET',6.5,align='center')
 text(c,480,329,'ROOM 2',9,True,align='center');text(c,480,317,'MEETING ROOM',6.5,align='center');text(c,480,305,'F1 / 180 SF NET',6.5,align='center')
 text(c,330,355,'EXISTING LOBBY',6.5,True,align='center');text(c,330,344,'NOT IN TAKEOFF',5.5,align='center')
 text(c,304,251,'EXISTING CORRIDOR / OUTSIDE FINISH SCOPE',6.5,True,align='center')
 # Dimensional references retained at exactly 9 pt/ft.
 hdim(c,90,270,431,404,'20\'-0"');hdim(c,390,525,431,404,'15\'-0"')
 vdim(c,290,398,62,84,'12\'-0"');vdim(c,290,398,552,531,'12\'-0"')
 hdim(c,234,270,454,404,'4\'-0"');vdim(c,371,398,285,270,'3\'-0"')
 # Scope boundary at door thresholds stays explicit.
 c.saveState();c.setDash(2,2)
 for x in [112,418]:line(c,x,290,x+27,290,.55)
 c.restoreState()
 view(c,44,195,'1','FLOOR FINISH PLAN');scale_bar(c,64,161)
 # Small construction detail, clearly unscaled.
 text(c,312,176,'2 / TYPICAL FINISH TRANSITION',7.5,True)
 rect(c,320,128,108,11,.65);hatch(c,[(320,128),(428,128),(428,139),(320,139)],5)
 rect(c,320,139,54,3,.5,PALE);line(c,374,139,428,139,.75);rect(c,371,139,5,5,.45)
 line(c,374,146,400,158,.35);text(c,403,158,'TRANSITION STRIP',5.5)
 text(c,320,117,'F1 FINISH',6);text(c,390,117,'EXISTING',6);text(c,320,103,'DETAIL NOT TO SCALE / THRESHOLD LINE DEFINES SCOPE',5.4)
 y=notes(c,598,507,'FINISH PLAN NOTES',[
 'Measure only Room 1 and Room 2. Lobby and corridor are background context.',
 'F1 is a demonstration resilient finish. Hatch denotes scope, not plank layout.',
 'Trace Room 1 around the 4 ft x 3 ft edge-connected shaft. Do not subtract twice.',
 'Close boundaries at the dashed door thresholds. Do not include door recesses.',
 'Verify the 20 ft span and a separate 12 ft span before takeoff.',
 'No waste, base, thresholds or finish transitions are included in net area.'
 ],156)
 text(c,598,y-3,'FINISH SCHEDULE',8,True)
 for i,t in enumerate(['F1  Resilient floor / practice scope','Room 1: 240 - 12 = 228 sq ft','Room 2: 15 x 12 = 180 sq ft','Combined net area: 408 sq ft']):text(c,598,y-21-i*13,t,6.8,i==3)
 text(c,598,119,'ORIGINAL FICTIONAL PROJECT',6,True);text(c,598,107,'Not a permit or installation document.',6)
 c.save()
def electrical():
 c=frame('electrical-practice.pdf','E-101','Lighting plan and route takeoff','ELECTRICAL / LIGHTING')
 text(c,44,512,'01 / LIGHTING AND DEMONSTRATION ROUTE',9,True);text(c,44,500,'Count plan symbols only. Exclude the symbol legend and route junction boxes.',6.8)
 # Architectural underlay with circulation and partitioned workspaces.
 rect(c,66,261,508,228,1,HexColor('#ededed'));rect(c,70,265,500,220,.55,white)
 for x in [210,350,401]:rect(c,x-2,340,4,145,.55,HexColor('#eeeeee'))
 rect(c,70,336,280,4,.55,HexColor('#eeeeee'));rect(c,401,336,169,4,.55,HexColor('#eeeeee'))
 for x in [116,256,443]:door(c,x,338)
 for x in [105,245,435]:window(c,x,487,65)
 text(c,140,412,'OFFICE 01',6.5,True,align='center');text(c,280,412,'OFFICE 02',6.5,True,align='center');text(c,487,412,'MEETING 03',6.5,True,align='center')
 text(c,211,278,'CIRCULATION',6.5,align='center');text(c,376,459,'RISER',5.5,align='center')
 for i in range(8):
  x=105+(i%4)*70;y=445-(i//4)*65;c.setStrokeColor(INK);c.setLineWidth(.65);c.circle(x,y,8)
  line(c,x-5,y,x+5,y,.65);line(c,x,y-5,x,y+5,.65);text(c,x,y-18,'A',6,align='center')
 for i in range(4):
  x=430+(i%2)*70;y=445-(i//2)*65;rect(c,x-8,y-8,16,16,.65);text(c,x+13,y-2,'B',6)
 c.setStrokeColor(HexColor('#446e4a'));c.setLineWidth(1.6);p=c.beginPath();p.moveTo(100,300);p.lineTo(370,300);p.lineTo(370,408);c.drawPath(p)
 for x,y in [(100,300),(370,408)]:rect(c,x-3,y-3,6,6,.6,white);text(c,x+7,y+5,'JB',5.5)
 hdim(c,100,370,238,265,'30\'-0"');vdim(c,300,408,390,370,'12\'-0"')
 view(c,44,204,'1','LIGHTING / ROUTE PLAN');scale_bar(c,64,169)
 text(c,310,174,'SCOPE / ROUTE ONLY',7.5,True)
 for i,t in enumerate(['Trace the two green legs from JB to JB.','30 ft + 12 ft = 42 ft drawn route.','No rises, drops, slack, fittings or circuit design.','Not a wire-length or procurement schedule.']):text(c,310,158-i*13,t,6.8)
 y=notes(c,598,507,'ELECTRICAL PLAN NOTES',[
 'Architectural walls and doors are context. Only the two symbol types in the plan are counted.',
 'Keep Type A and Type B in separate worksheet subjects.',
 'Legend symbols are not installed fixture instances; restrict the search to the plan.',
 'The green polyline is a route-measurement exercise. It is not an electrical design.',
 'No connected load, conductor sizing, protection or code compliance is specified.'
 ],156)
 text(c,598,y-1,'SYMBOL LEGEND',8,True);line(c,598,y-7,754,y-7,.7)
 c.setStrokeColor(INK);c.setLineWidth(.65);c.circle(608,y-25,5);line(c,605,y-25,611,y-25);line(c,608,y-28,608,y-22)
 text(c,622,y-28,'A  Type A fixture / 8 in plan',6.5)
 rect(c,603,y-48,10,10,.65);text(c,622,y-46,'B  Type B fixture / 4 in plan',6.5)
 rect(c,605,y-65,6,6,.65);text(c,622,y-64,'JB  Route endpoint / exclude',6.5)
 text(c,598,119,'ORIGINAL FICTIONAL PROJECT',6,True);text(c,598,107,'Not an electrical installation document.',6)
 c.save()
flooring();electrical()
rows={
 'flooring':[['Room 1 gross',240,'sq ft','20 x 12'],['Room 1 shaft exclusion',-12,'sq ft','4 x 3 subtracted'],['Room 1 net',228,'sq ft','240 - 12; subtotal, do not sum twice'],['Room 2 net',180,'sq ft','15 x 12'],['Total net',408,'sq ft','228 + 180; total'],['Waste example',40.8,'sq ft','10% of 408'],['Required with waste',448.8,'sq ft','408 x 1.10'],['Whole packs',23,'packs','ceil(448.8 / 20)'],['Purchased area',460,'sq ft','23 x 20'],['Surplus beyond allowance',11.2,'sq ft','460 - 448.8']],
 'electrical':[['Type A fixtures',8,'count','Circle with cross'],['Type B fixtures',4,'count','Square'],['Horizontal route leg',30,'ft','270 PDF points / 9'],['Vertical route leg',12,'ft','108 PDF points / 9'],['Total drawn route',42,'ft','30 + 12; excludes rises, drops, slack, fittings']]
}
for kind,data in rows.items():
 with (OUT/f'{kind}-reference.csv').open('w',newline='') as f:
  writer=csv.writer(f,lineterminator='\n');writer.writerow(['Item','Reference quantity','Unit','Calculation or scope']);writer.writerows(data)
 c=frame(f'{kind}-reference.pdf','F-901' if kind=='flooring' else 'E-901',kind.title()+' quantity reference','QUANTITY CHECKING SCHEDULE','NOT TO SCALE')
 text(c,42,511,'REFERENCE QUANTITIES / INDEPENDENT CALCULATION',12,True)
 text(c,42,492,'Based on the corresponding practice drawing. This is a checking sheet, not a PolyPDF export.',8)
 xs=[42,245,358,750];y=469;rh=26
 rect(c,42,y-24,708,24,.5,PALE)
 for x,v in [(51,'ITEM / SCOPE'),(254,'QUANTITY / UNIT'),(367,'CALCULATION / BASIS')]:text(c,x,y-16,v,8,True)
 for i,(title,value,unit,note) in enumerate(data):
  yy=y-24-(i+1)*rh
  if i%2==0:rect(c,42,yy,708,rh,0,HexColor('#f5f6f6'))
  line(c,42,yy,750,yy,.3,MUTED);text(c,51,yy+9,title,8);text(c,254,yy+9,f'{value:g} {unit}',8,True);text(c,367,yy+9,note,7.4)
 for x in xs:line(c,x,y,x,y-24-len(data)*rh,.4)
 yy=y-24-len(data)*rh-29
 for i,t in enumerate(['01  Calibrate at 9 PDF points per foot; verify a separate labeled span.', '02  Match the scope, subject, units and formula before pricing.', '03  Do not sum detail rows, subtotals and totals together.', '04  Add a project-specific waste allowance only after reviewing net quantities.']):text(c,42,yy-i*16,t,8)
 c.save()
# Re-present historical annotations on the revised drawing without moving any
# measurement vertices, page scale, viewport or app-specific measurement data.
derivatives=[]
for kind,name in [('flooring','flooring-mac-measured.pdf'),('electrical','electrical-mac-route.pdf')]:
 original=ROOT/'assets-source/samples/original-app-outputs'/name
 writer=PdfWriter();writer.clone_document_from_reader(PdfReader(original))
 src=PdfReader(OUT/f'{kind}-practice.pdf');old=writer.pages[0];new=src.pages[0]
 assert tuple(old.mediabox)==tuple(new.mediabox)
 old[NameObject('/Contents')]=new.raw_get('/Contents').clone(writer)
 old[NameObject('/Resources')]=new['/Resources'].clone(writer)
 note=io.BytesIO();nc=canvas.Canvas(note,pagesize=(W,H),invariant=1)
 text(nc,38,88,'Republished example: original Mac 1.6.6 b38 annotations; drawing background updated October 17, 2026.',6)
 nc.save();note.seek(0);old.merge_page(PdfReader(note).pages[0])
 writer.add_metadata({'/Title':f'Northline Studio Annex | {kind.title()} measured example','/Subject':'Republished derivative: October 17 drawing background with unchanged October 16 Mac measurement annotations. Not a new app export.'})
 with (OUT/name).open('wb') as f:writer.write(f)
 derivatives.append({'file':name,'originalSha256':hashlib.sha256(original.read_bytes()).hexdigest(),'sha256':hashlib.sha256((OUT/name).read_bytes()).hexdigest(),'transform':'Replaced page content/resources with October 17 construction-style drawing. Page boxes, annotation objects and measurement metadata retained; not a new desktop export.'})
manifest={'kind':'synthetic-practice-reference','updatedAt':'2026-10-17','appExport':False,'scalePdfPointsPerFoot':9,'flooringNetSqFt':408,'electricalTypeA':8,'electricalTypeB':4,'electricalDrawnRouteFt':42,'flooringNetVertices':[[90,290],[270,290],[270,371],[234,371],[234,398],[90,398]],'electricalRouteVertices':[[100,300],[370,300],[370,408]],'files':{f.name:hashlib.sha256(f.read_bytes()).hexdigest() for f in sorted(OUT.glob('*')) if f.name.endswith(('-practice.pdf','-reference.pdf','-reference.csv'))},'republishedMeasuredExamples':derivatives}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Generated four construction-style reference PDFs and two measured derivatives.')
