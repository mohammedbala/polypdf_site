"""Owned fictional CAD drawing primitives. Dimensions use PDF points."""
from pathlib import Path
from math import hypot, ceil
from contextlib import contextmanager
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import reportlab

W, H = 2592, 1728  # Architectural D, 36 x 24 inches
OX, OY, S = 180, 330, 18  # 1/4 inch = 1 foot, 1:48
INK, GRAY, PALE = HexColor('#17252c'), HexColor('#647079'), HexColor('#e9edef')
ACCENT = HexColor('#284b60')
fontdir = Path(reportlab.__file__).parent / 'fonts'
pdfmetrics.registerFont(TTFont('CAD', str(fontdir / 'Vera.ttf')))
pdfmetrics.registerFont(TTFont('CAD-B', str(fontdir / 'VeraBd.ttf')))
ROOMS = [
 ('101','COMMUNITY ROOM',0,36,24,24), ('102','CLASSROOM',24,36,24,24),
 ('103','MEETING ROOM',48,36,24,24), ('104','MAKER SPACE',72,36,24,24),
 ('105','LOBBY',0,0,24,24), ('106','ADMIN OFFICE',24,0,24,24),
 ('107','RESTROOM A',48,0,12,24), ('108','RESTROOM B',60,0,12,24),
 ('109','MECHANICAL',72,0,12,24), ('110','STORAGE',84,0,12,24),
 ('111','CORRIDOR',0,24,96,12),
]

def pt(x,y): return OX+x*S, OY+y*S

class Document:
    def __init__(self, out, filename, title):
        self.path=Path(out)/filename
        self.c=canvas.Canvas(str(self.path),pagesize=(W,H),pageCompression=1, invariant=1)
        self.c.setTitle('Willow Creek Community Center | '+title)
        self.c.setAuthor('PolyPDF - Original demonstration drawings')
        self.c.setSubject('Fictional construction drawing sample. Demonstration only. Not for construction.')
        self.c.setCreator('PolyPDF Construction Demo Library / owned vector generator')
        self.pages=[]
    def sheet(self, code, title, scale, rev='A', discipline='', date='2026-09-15'):
        if self.pages: self.c.showPage()
        self.c.setPageSize((W,H))
        self.pages.append(dict(sheet=code,title=title,scale=scale,revision=rev))
        key=f'page{len(self.pages)}'
        self.c.bookmarkPage(key)
        self.c.addOutlineEntry(f'{code} | {title}',key,level=0)
        sh=Sheet(self.c)
        sh.frame(code,title,scale,rev,discipline,date,len(self.pages))
        return sh
    def finish(self):
        self.c.save()
        return dict(file=self.path.name,pages=self.pages)

class Sheet:
    def __init__(self,c): self.c=c
    @contextmanager
    def layer(self,key):
        self.c._code.append(f'/OC /{key} BDC')
        try: yield
        finally: self.c._code.append('EMC')
    def text(self,x,y,value,size=12,bold=False,color=INK,align='left',angle=0):
        c=self.c;c.saveState();c.setFillColor(color);c.setFont('CAD-B' if bold else 'CAD',size)
        c.translate(x,y);c.rotate(angle)
        {'left':c.drawString,'center':c.drawCentredString,'right':c.drawRightString}[align](0,0,str(value));c.restoreState()
    def line(self,x1,y1,x2,y2,width=1,color=INK,dash=None):
        c=self.c;c.saveState();c.setStrokeColor(color);c.setLineWidth(width)
        if dash:c.setDash(dash)
        c.line(x1,y1,x2,y2);c.restoreState()
    def rect(self,x,y,w,h,width=1,color=INK,fill=None,dash=None):
        c=self.c;c.saveState();c.setStrokeColor(color);c.setLineWidth(width)
        if fill:c.setFillColor(fill)
        if dash:c.setDash(dash)
        c.rect(x,y,w,h,stroke=int(width>0),fill=int(fill is not None));c.restoreState()
    def circle(self,x,y,r,width=1,color=INK,fill=None):
        c=self.c;c.saveState();c.setStrokeColor(color);c.setLineWidth(width)
        if fill:c.setFillColor(fill)
        c.circle(x,y,r,stroke=int(width>0),fill=int(fill is not None));c.restoreState()
    def polyline(self,points,width=1,color=INK,close=False,fill=None,dash=None):
        c=self.c;c.saveState();c.setLineWidth(width);c.setStrokeColor(color)
        if fill:c.setFillColor(fill)
        if dash:c.setDash(dash)
        p=c.beginPath();p.moveTo(*points[0])
        for a in points[1:]:p.lineTo(*a)
        if close:p.close()
        c.drawPath(p,stroke=int(width>0),fill=int(fill is not None));c.restoreState()
    def hatch(self,x,y,w,h,step=12,color=GRAY):
        c=self.c;c.saveState();p=c.beginPath();p.rect(x,y,w,h);c.clipPath(p,stroke=0)
        for t in range(-int(h),int(w)+int(h),step): self.line(x+t,y,x+t+h,y+h,0.45,color)
        c.restoreState()
    def dimension(self,x1,x2,y,ext_y,value):
        self.line(x1,y,x2,y,.7,GRAY)
        for x in (x1,x2):
            self.line(x,ext_y,x,y+8,.55,GRAY);self.line(x-4,y-4,x+4,y+4,1,INK)
        self.rect((x1+x2)/2-72,y+4,144,22,0,fill=HexColor('#ffffff'))
        self.text((x1+x2)/2,y+10,value,13,align='center')
    def dimension_y(self,y1,y2,x,ext_x,value):
        self.line(x,y1,x,y2,.7,GRAY)
        for y in (y1,y2):
            self.line(ext_x,y,x-8,y,.55,GRAY);self.line(x-4,y-4,x+4,y+4,1)
        self.text(x-12,(y1+y2)/2,value,13,align='center',angle=90)
    def leader(self,x,y,tx,ty,value,size=12):
        self.circle(x,y,2,0,fill=INK);self.polyline([(x,y),(tx-14,ty+5),(tx+15,ty+5)],.7)
        self.text(tx+20,ty,value,size)
    def notes(self,x,y,title,lines,width=290,size=12):
        self.line(x,y+14,x+width,y+14,1.4)
        self.text(x,y-3,title,15,bold=True)
        cy=y-36
        for value in lines:
            # Accept explicit newlines, wrap to measured width.
            for part in str(value).split('\n'):
                words=part.split(); row=''
                for word in words:
                    candidate=(row+' '+word).strip()
                    if pdfmetrics.stringWidth(candidate,'CAD',size)>width and row:
                        self.text(x,cy,row,size);cy-=size*1.5;row=word
                    else: row=candidate
                if row:self.text(x,cy,row,size);cy-=size*1.5
            cy-=10
        return cy
    def table(self,x,y,col_widths,headers,rows,row_h=34,size=12):
        total=sum(col_widths);height=(len(rows)+1)*row_h
        self.rect(x,y-height,total,height,.7)
        self.rect(x,y-row_h,total,row_h,0,fill=PALE)
        for i,row in enumerate([headers]+list(rows)):
            if i:self.line(x,y-i*row_h,x+total,y-i*row_h,.5,GRAY)
            xx=x
            for w,v in zip(col_widths,row):
                self.text(xx+9,y-(i+1)*row_h+11,v,size,bold=i==0);xx+=w
        xx=x
        for w in col_widths[:-1]:xx+=w;self.line(xx,y,xx,y-height,.5,GRAY)
        return y-height
    def view_title(self,x,y,num,title,scale,width=900):
        self.circle(x+19,y+18,19,1.2);self.text(x+19,y+12,num,17,bold=True,align='center')
        self.text(x+53,y+20,title,18,bold=True)
        self.text(x+53,y-1,scale,12,color=GRAY)
        self.line(x+53,y+11,x+width,y+11,1)
    def panel(self,x,y,w,h,title,num,scale):
        self.rect(x,y,w,h,.5,color=PALE)
        self.view_title(x,y-57,num,title,scale,width=w)
    def scale_bar(self,x,y,points_per_ft=S,length_ft=20):
        seg=length_ft/4;w=points_per_ft*seg
        for i in range(4):
            self.rect(x+i*w,y,w,10,.7,fill=INK if i%2==0 else HexColor('#ffffff'))
            self.text(x+i*w,y-20,f'{i*seg:g}',10,align='center')
        self.text(x+4*w,y-20,f'{length_ft:g} FT',10,align='center')
        self.text(x,y+22,'GRAPHIC SCALE',10,bold=True)
    def north(self,x,y):
        self.polyline([(x,y),(x-15,y-44),(x,y-35),(x+15,y-44)],1,close=True,fill=INK)
        self.line(x,y-38,x,y-80,1);self.text(x,y+13,'N',19,bold=True,align='center')
    def symbol(self,kind,x,y,tag=None,rotation=0,size=24):
        c=self.c;c.saveState();c.translate(x,y);c.rotate(rotation)
        q=Sheet(c);a=size/2
        q.rect(-a-5,-a-5,size+10,size+10,0,fill=HexColor('#ffffff'))
        if kind=='diffuser':
            q.rect(-a,-a,size,size,1.1);q.rect(-a/3,-a/3,size/3,size/3,.7)
            for sx in (-1,1):
                for sy in (-1,1):q.line(sx*a,sy*a,sx*a/3,sy*a/3,.7)
        elif kind=='light':
            q.rect(-a*1.5,-a/2,size*1.5,size/2,1.1)
            q.line(-a*1.5,-a/2,a*1.5,a/2,.7)
        elif kind=='sprinkler':
            q.circle(0,0,a*.58,1)
            for dx,dy in [(a,0),(-a,0),(0,a),(0,-a)]:q.line(0,0,dx,dy,.8)
        elif kind=='tree':
            q.circle(0,0,a,1)
            q.polyline([(-a*.7,0),(0,a*.7),(a*.7,0),(0,-a*.7)],.65,close=True)
            q.circle(0,0,2,0,fill=INK)
        elif kind=='column':q.rect(-a,-a,size,size,1.4,fill=PALE);q.line(-a,-a,a,a,.5)
        elif kind=='receptacle':
            q.circle(0,0,a*.65,1);q.line(-a/3,-a,-a/3,a,.8);q.line(a/3,-a,a/3,a,.8)
        elif kind=='wc':
            q.rect(-a,-a,size,size*.65,.9);q.c.ellipse(-a*.8,-a*.5,a*.8,a*1.25,stroke=1)
        elif kind=='lav':
            q.rect(-a*1.2,-a,size*1.2,size,.8);q.c.ellipse(-a*.8,-a*.6,a*.8,a*.6,stroke=1);q.circle(0,0,2,.6)
        elif kind=='drain':
            q.rect(-a,-a,size,size,.9)
            for t in (-a*.6,0,a*.6):q.line(-a,t,a,t,.5)
        elif kind=='exit':q.rect(-a*1.5,-a/2,size*1.5,size/2,1);q.text(0,-4,'EXIT',8,bold=True,align='center')
        elif kind=='smoke':q.circle(0,0,a*.7,1);q.text(0,-4,'SD',8,bold=True,align='center')
        c.restoreState()
        if tag:self.text(x,y-a-25,tag,11,align='center')
    def door(self,x,y,r=54,orientation='up'):
        c=self.c;c.saveState();c.translate(x,y)
        c.rotate({'up':0,'left':90,'down':180,'right':270}[orientation])
        q=Sheet(c);q.line(-2,0,r+2,0,8,HexColor('#ffffff'));q.line(0,0,0,r,1.1)
        c.setStrokeColor(GRAY);c.setLineWidth(.65);c.arc(-r,-r,r,r,0,90);c.restoreState()
    def plan_base(self,rev='A',labels=True,dimensions=True,faint=False,doors=True):
        color=GRAY if faint else INK
        self.rect(OX,OY,96*S,60*S,3,color)
        self.rect(OX+7.5,OY+7.5,96*S-15,60*S-15,.8,color)
        for y in (24,36):self.line(*pt(0,y),*pt(96,y),1.4,color)
        top_x=(24,48,78 if rev=='B' else 72)
        for x in top_x:self.line(*pt(x,36),*pt(x,60),1.4,color)
        for x in (24,48,60,72,84):self.line(*pt(x,0),*pt(x,24),1.4,color)
        if doors:
            for x in (9,33,57,84 if rev=='B' else 81):self.door(*pt(x,36),orientation='up')
            for x in (9,33,52,64,76,88):self.door(*pt(x,24),orientation='down')
            self.door(*pt(45,0),orientation='up');self.door(*pt(0,28),orientation='right')
        if labels:
            for id,name,x,y,w,h in ROOMS:
                if rev=='B' and id=='103':w=30
                if rev=='B' and id=='104':x=78;w=18
                xx,yy=pt(x+w/2,y+h/2)
                self.text(xx,yy+12,name,13,bold=True,align='center',color=color)
                self.text(xx,yy-10,id,12,align='center',color=color)
                self.text(xx,yy-31,f'{w*h:,} SF',11,align='center',color=color)
        if dimensions:
            self.dimension(OX,OX+96*S,OY-87,OY,'96\'-0"')
            self.dimension_y(OY,OY+60*S,OX-70,OX,'60\'-0"')
            xs=[0,24,48,78,96] if rev=='B' else [0,24,48,72,96]
            for a,b in zip(xs,xs[1:]):self.dimension(OX+a*S,OX+b*S,OY+60*S+56,OY+60*S,f'{b-a}\'-0"')
            for a,b in [(0,24),(24,36),(36,60)]:self.dimension_y(OY+a*S,OY+b*S,OX+96*S+45,OX+96*S,f'{b-a}\'-0"')
        self.north(2100,1450);self.scale_bar(1480,195)
    def frame(self,code,title,scale,rev,discipline,date,page):
        self.rect(36,36,W-72,H-72,1.3)
        self.line(2300,36,2300,H-36,1.2)
        self.line(36,1580,2300,1580,.8)
        self.text(66,1636,'WILLOW CREEK COMMUNITY CENTER',25,bold=True)
        self.text(66,1609,'1200 Willow Lane, Example Township | Fictional training project WC-26-014',13,color=GRAY)
        self.text(2268,1638,code,27,bold=True,align='right')
        self.text(2268,1609,'DEMONSTRATION ISSUE',12,bold=True,align='right')
        self.text(2320,1640,'POLYPDF',26,bold=True,color=ACCENT)
        self.text(2320,1612,'DRAWING DEMO LIBRARY',11,bold=True)
        self.line(2300,1575,2556,1575,1)
        self.notes(2320,1542,'PROJECT', ['WILLOW CREEK','COMMUNITY CENTER','WC-26-014','ONE-STORY / 5,760 SF'],216,11)
        self.line(2300,1325,2556,1325,.7)
        self.notes(2320,1290,'DRAWING TITLE',[title],216,14)
        self.notes(2320,1110,'DISCIPLINE',[discipline or 'COORDINATED SAMPLE'],216,12)
        self.notes(2320,980,'ISSUE RECORD',[f'REVISION {rev}',date,'Demonstration issue','Drawn: PP / Checked: QA'],216,12)
        self.notes(2320,770,'SHEET DATA',[f'Scale: {scale}','Original: 36 x 24 IN',f'PDF page {page}','Units: feet unless noted'],216,11)
        self.notes(2320,550,'USE NOTICE',['FICTIONAL PROJECT','DEMONSTRATION ONLY','NOT FOR CONSTRUCTION','No engineering design, code review or permit approval is implied.'],216,11)
        self.line(2300,225,2556,225,.8)
        self.text(2428,141,code,43,bold=True,align='center')
        self.text(2428,96,f'REV {rev}',17,bold=True,align='center')
        self.text(66,67,'ORIGINAL SYNTHETIC DRAWING | DEMONSTRATION ONLY - NOT FOR CONSTRUCTION',11,bold=True,color=GRAY)
        self.text(2268,67,f'WC-26-014 / {code} / {rev}',11,color=GRAY,align='right')
