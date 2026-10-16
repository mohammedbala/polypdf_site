"""Deterministic synthetic practice geometry and reference calculations, not app exports."""
from pathlib import Path
import csv, json, hashlib
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/samples/takeoff'; OUT.mkdir(parents=True,exist_ok=True)
W,H=792,612
INK=HexColor('#263b2e');MUTED=HexColor('#657367')
def page(name,title,subtitle):
 c=canvas.Canvas(str(OUT/name),pagesize=(W,H),invariant=1)
 c.setTitle(title);c.setAuthor('PolyPDF team');c.setSubject('Synthetic practice resource; not for construction')
 c.setFillColor(INK);c.setFont('Helvetica-Bold',22);c.drawString(42,568,title)
 c.setFillColor(MUTED);c.setFont('Helvetica',10);c.drawString(42,546,subtitle)
 c.setStrokeColor(INK);c.setLineWidth(.8);c.line(42,531,750,531)
 c.setFont('Helvetica',9);c.drawString(42,27,'PolyPDF | Synthetic practice drawing | Reference geometry, not an app export | October 16, 2026')
 return c
def label(c,x,y,text): c.setFillColor(INK);c.setFont('Helvetica',11);c.drawString(x,y,text)
def dim(c,x1,y1,x2,y2,text):
 c.setStrokeColor(MUTED);c.setLineWidth(.5);c.line(x1,y1,x2,y2)
 for x,y in [(x1,y1),(x2,y2)]:c.line(x-3,y-3,x+3,y+3)
 c.setFont('Helvetica',10);c.setFillColor(MUTED);c.drawString((x1+x2)/2+4,(y1+y2)/2+5,text)
# 1/8 inch = 1 foot => 9 PDF points per foot.
c=page('flooring-practice.pdf','F-101 / Flooring practice','Revision A | Scale 1/8 inch = 1 foot (9 PDF points per foot) | Dimensions in feet')
for x,y,w,h,title in [(90,290,180,108,'Room 1'),(390,290,135,108,'Room 2')]:
 c.setStrokeColor(INK);c.setLineWidth(1.4);c.rect(x,y,w,h)
 label(c,x+15,y+50,title);dim(c,x,y-20,x+w,y-20,f'{w/9:g} ft');dim(c,x+w+20,y,x+w+20,y+h,f'{h/9:g} ft')
c.setFillColor(HexColor('#dde5d9'));c.rect(234,371,36,27,fill=1,stroke=1)
label(c,310,460,'Room 1 exclusion: 4 ft x 3 ft shaft')
c.setStrokeColor(MUTED);c.line(300,452,252,388)
label(c,60,198,'Practice scope: floor finish in both rooms, excluding the shaded shaft.')
label(c,60,174,'Check the 20 ft horizontal span and a separate 12 ft vertical span before takeoff.')
label(c,60,150,'Net area: keep the exclusion separate. Apply waste only after reviewing quantities.')
label(c,60,108,'Not a construction document. No door recesses, thresholds, or finish transitions are included.')
c.save()
c=page('electrical-practice.pdf','E-101 / Electrical quantities practice','Revision A | Scale 1/8 inch = 1 foot (9 PDF points per foot) | Dimensions in feet')
c.setLineWidth(1);c.rect(70,265,500,220)
for i in range(8):
 x=105+(i%4)*70;y=445-(i//4)*65
 c.setStrokeColor(INK);c.circle(x,y,8);c.line(x-5,y,x+5,y);c.line(x,y-5,x,y+5)
for i in range(4):
 x=430+(i%2)*70;y=445-(i//2)*65;c.rect(x-8,y-8,16,16)
c.setStrokeColor(HexColor('#446e4a'));c.setLineWidth(2);p=c.beginPath();p.moveTo(100,300);p.lineTo(370,300);p.lineTo(370,408);c.drawPath(p)
dim(c,100,245,370,245,'30 ft');dim(c,390,300,390,408,'12 ft')
label(c,70,205,'Legend: circle with cross = Type A fixture; square = Type B fixture.')
label(c,70,180,'Count the drawn fixtures only. Keep fixture types in separate worksheet subjects.')
label(c,70,155,'Route scope: the two green legs only. Rises, drops, slack, and fittings are excluded.')
label(c,70,112,'Not an electrical design or code-compliance document. No live project information is included.')
c.save()
rows={
 'flooring':[['Room 1 gross',240,'sq ft','20 x 12'],['Room 1 shaft exclusion',-12,'sq ft','4 x 3 subtracted'],['Room 1 net',228,'sq ft','240 - 12; subtotal, do not sum twice'],['Room 2 net',180,'sq ft','15 x 12'],['Total net',408,'sq ft','228 + 180; total'],['Waste example',40.8,'sq ft','10% of 408'],['Required with waste',448.8,'sq ft','408 x 1.10'],['Whole packs',23,'packs','ceil(448.8 / 20)'],['Purchased area',460,'sq ft','23 x 20'],['Surplus beyond allowance',11.2,'sq ft','460 - 448.8']],
 'electrical':[['Type A fixtures',8,'count','Circle with cross'],['Type B fixtures',4,'count','Square'],['Horizontal route leg',30,'ft','270 PDF points / 9'],['Vertical route leg',12,'ft','108 PDF points / 9'],['Total drawn route',42,'ft','30 + 12; excludes rises, drops, slack, fittings']]
}
for kind,data in rows.items():
 with (OUT/f'{kind}-reference.csv').open('w',newline='') as f:
  writer=csv.writer(f,lineterminator="\n");writer.writerow(['Item','Reference quantity','Unit','Calculation or scope']);writer.writerows(data)
 c=page(f'{kind}-reference.pdf',f'{kind.title()} / Reference checking sheet','Hand-calculated reference quantities from the synthetic practice geometry. Not a PolyPDF export.')
 y=500
 for title,value,unit,note in data:
  c.setFont('Helvetica-Bold',10);c.setFillColor(INK);c.drawString(48,y,title);c.drawRightString(355,y,f'{value:g} {unit}')
  c.setFont('Helvetica',9);c.setFillColor(MUTED);c.drawString(380,y,note);y-=31
 for text in ['1. Calibrate at 9 PDF points per foot and verify an independent labeled span.','2. Reproduce the measurement or count in your own worksheet; check subjects and units.','3. Keep assumptions and exclusions with the exported result. Do not add subtotals twice.']:
  c.setFont('Helvetica',10);c.drawString(48,y-18,text);y-=22
 c.save()
manifest={'kind':'synthetic-practice-reference','appExport':False,'scalePdfPointsPerFoot':9,'flooringNetSqFt':408,'electricalTypeA':8,'electricalTypeB':4,'electricalDrawnRouteFt':42,'files':{f.name:hashlib.sha256(f.read_bytes()).hexdigest() for f in sorted(OUT.glob('*')) if f.name.endswith(('-practice.pdf','-reference.pdf','-reference.csv'))}}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps(manifest,indent=2))
