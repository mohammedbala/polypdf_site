"""Original civil, structural and landscape training sheets for Willow Creek."""
from math import sin, cos, pi
from reportlab.lib.colors import HexColor
from common import Document, OX, OY, S, INK, GRAY, PALE, ACCENT

WHITE = HexColor('#ffffff')
SITE_X, SITE_Y, SITE_S = 220, 520, 4.5  # 1/16 inch = 1 foot
TREE_POINTS = [(35,145),(70,145),(105,145),(140,145),(17,43),(17,67),(17,91),(17,115),(38,20),(63,20),(88,20),(113,20)]
BEDS = [('B1',20,135,160,20),('B2',10,35,15,95),('B3',30,12,95,16),('B4',140,124,50,10)]


def panel(sh, x, y, w, h, title, num, scale):
    """The same drafting panel language with a rule fitted to its actual width."""
    sh.rect(x, y, w, h, .5, color=PALE)
    sh.circle(x+19, y-39, 19, 1.2)
    sh.text(x+19, y-45, num, 17, bold=True, align='center')
    sh.text(x+53, y-37, title, 17, bold=True)
    sh.text(x+53, y-58, scale, 12, color=GRAY)
    sh.line(x+53, y-46, x+w, y-46, 1)


def st(x, y):
    return SITE_X + x * SITE_S, SITE_Y + y * SITE_S


def site_rect(sh,x,y,w,h,width=1,fill=None,dash=None,color=INK):
    xx,yy=st(x,y);sh.rect(xx,yy,w*SITE_S,h*SITE_S,width,color,fill,dash)


def site_poly(sh,points,width=1,color=INK,close=False,fill=None,dash=None):
    sh.polyline([st(x,y) for x,y in points],width,color,close,fill,dash)


def spot(sh,x,y,z,label='',side='right'):
    xx,yy=st(x,y);sh.line(xx-5,yy,xx+5,yy,.7);sh.line(xx,yy-5,xx,yy+5,.7)
    offset=10 if side=='right' else -10
    sh.text(xx+offset,yy+4,z,10,align='left' if side=='right' else 'right')
    if label:sh.text(xx+offset,yy-11,label,8,align='left' if side=='right' else 'right',color=GRAY)


def arrow(sh,x1,y1,x2,y2,label=None):
    sh.line(x1,y1,x2,y2,.8,GRAY)
    a=pi/6;angle=__import__('math').atan2(y2-y1,x2-x1)
    for d in (-a,a):sh.line(x2,y2,x2-9*cos(angle+d),y2-9*sin(angle+d),.8,GRAY)
    if label:sh.text((x1+x2)/2+8,(y1+y2)/2+5,label,10,color=GRAY)


def callout(sh,x,y,num,sheet,rotation=0):
    sh.circle(x,y,22,1.1,fill=WHITE);sh.line(x-20,y,x+20,y,.6)
    sh.text(x,y+5,num,12,bold=True,align='center');sh.text(x,y-13,sheet,10,align='center')
    sh.polyline([(x+22,y+8),(x+38,y),(x+22,y-8)],.9,close=True,fill=INK)


def site_base(sh,landscape=False,labels=True):
    # Adjacent public street, sidewalks and surveyed parcel.
    site_rect(sh,-15,-27,230,22,.8,fill=HexColor('#f4f5f5'))
    site_poly(sh,[(-15,-16),(215,-16)],.65,GRAY,dash=[18,9])
    site_poly(sh,[(-15,-3),(215,-3)],1.0)
    sh.text(*st(74,-22),'WILLOW LANE / 50\' PUBLIC R.O.W.',12,bold=True)
    site_rect(sh,0,0,200,160,1.8,dash=[16,4,3,4])
    for x,y in [(0,0),(200,0),(200,160),(0,160)]:
        xx,yy=st(x,y);sh.circle(xx,yy,5,.8);sh.line(xx-7,yy-7,xx+7,yy+7,.6);sh.line(xx-7,yy+7,xx+7,yy-7,.6)
    sh.text(*st(72,163),'N 89° 30\' 00" E  /  200.00\'',11)
    sh.text(*st(203,60),'N 00° 30\' 00" W / 160.00\'',11,angle=90)
    sh.text(*st(-7,58),'S 00° 30\' 00" E / 160.00\'',11,angle=90)
    site_rect(sh,10,10,180,140,.55,dash=[5,6],color=GRAY)
    sh.text(*st(80,151),'10\' SETBACK (TYP.)',9,color=GRAY)
    # Asphalt apron, two banks of six stalls and 24-foot two-way aisle.
    site_rect(sh,139,26,60,86,.9,fill=HexColor('#f2f3f4'))
    site_rect(sh,157,0,24,26,.8,fill=HexColor('#f2f3f4'))
    site_poly(sh,[(157,0),(157,-5),(181,-5),(181,0)],1.3)
    for bank in (0,1):
        bx=139 if bank==0 else 181
        for i in range(7):site_poly(sh,[(bx,32+i*9),(bx+18,32+i*9)],.8)
        for i in range(6):
            xx,yy=st(bx+9,36.5+i*9)
            sh.text(xx,yy,f'P{i+1+6*bank:02d}',9,align='center')
    # A shared access aisle adjacent to the two end stalls.
    site_rect(sh,139,86,60,8,.6)
    xx,yy=st(139,86);sh.hatch(xx,yy,60*SITE_S,8*SITE_S,8)
    for bx in (148,190):
        xx,yy=st(bx,81.5);sh.circle(xx,yy,6,.7);sh.text(xx,yy-3,'A',8,bold=True,align='center')
    arrow(sh,*st(169,35),*st(169,71))
    arrow(sh,*st(172,107),*st(172,97))
    sh.text(*st(166,95),'24\' AISLE',8)
    # Sidewalk and building, all geometry measured in feet.
    site_rect(sh,34,49,105,72,.8,fill=HexColor('#fafafa'))
    site_rect(sh,80,8,16,41,.8,fill=HexColor('#fafafa'))
    site_poly(sh,[(34,49),(139,49),(139,121),(34,121),(34,49)],.6)
    site_rect(sh,40,55,96,60,1.9,fill=WHITE)
    site_rect(sh,41,56,94,58,.6)
    for x in (64,88,112):site_poly(sh,[(x,55),(x,115)],.55,GRAY)
    site_poly(sh,[(40,79),(136,79)],.55,GRAY)
    site_poly(sh,[(40,91),(136,91)],.55,GRAY)
    site_rect(sh,82,55,6,1,1,fill=WHITE)
    site_rect(sh,135,79,1,6,1,fill=WHITE)
    sh.text(*st(88,100),'WILLOW CREEK',13,bold=True,align='center')
    sh.text(*st(88,95),'COMMUNITY CENTER',11,bold=True,align='center')
    sh.text(*st(88,87),'96\' × 60\' / 5,760 SF',11,align='center')
    sh.text(*st(88,82),'FFE 504.00',10,align='center')
    sh.text(*st(88,47),'MAIN ENTRY',9,align='center')
    # Bike rack and trash enclosure.
    site_rect(sh,107,39,14,7,.65)
    for x in (110,113,116,119):
        xx,yy=st(x,42.5);sh.circle(xx,yy,4,.6)
    sh.text(*st(114,35),'BIKES (4)',8,align='center')
    site_rect(sh,139,101,15,11,1.1)
    site_rect(sh,142,104,9,5,.8)
    site_poly(sh,[(139,101),(143,97),(147,101)],.7)
    sh.text(*st(146.5,115),'REFUSE',8,align='center')
    if labels:
        sh.leader(*st(60,55),190,700,'BUILDING CORNER / SEE A101',11)
        sh.leader(*st(146,90),1160,950,'8\' SHARED ACCESS AISLE',11)
        sh.leader(*st(188,42),1160,735,'12 STALLS TOTAL / 2 MARKED A',11)
    sh.north(1210,1400)
    sh.dimension(SITE_X,SITE_X+200*SITE_S,1325,SITE_Y+160*SITE_S,'200\'-0"')
    sh.dimension_y(SITE_Y,SITE_Y+160*SITE_S,150,SITE_X,'160\'-0"')
    sh.scale_bar(SITE_X,345,SITE_S,40)
    sh.text(SITE_X,385,'1/16" = 1\'-0" AT 36 × 24 IN / DO NOT FIT TO PAGE',11,color=GRAY)


def utilities(sh):
    site_poly(sh,[(-10,3),(208,3)],.8,GRAY,dash=[10,4])
    sh.text(*st(7,5),'EX. WATER MAIN',9,color=GRAY)
    site_poly(sh,[(25,3),(25,31),(40,31),(40,62)],1.05,ACCENT,dash=[8,4])
    for x,y in [(25,3),(40,31)]:
        xx,yy=st(x,y);sh.circle(xx,yy,4,.9)
    site_poly(sh,[(116,55),(116,36),(127,36),(127,-12)],1.1,GRAY,dash=[15,4,3,4])
    sh.text(*st(117,36),'SS',8)
    xx,yy=st(127,-12);sh.circle(xx,yy,7,1);sh.text(xx,yy-3,'MH',6,align='center')
    # Drain line and two grated catch basins.
    site_poly(sh,[(173,109),(192,109),(192,19),(200,19)],1.3,ACCENT,dash=[5,4])
    for x,y,tag in [(173,109,'CB-1'),(192,19,'CB-2')]:
        xx,yy=st(x,y);sh.symbol('drain',xx,yy,size=17);sh.text(xx+12,yy+11,tag,9)
    xx,yy=st(25,31);sh.circle(xx,yy,7,1.0)
    for dx,dy in [(-9,0),(9,0),(0,9)]:sh.line(xx,yy,xx+dx,yy+dy,1)
    sh.text(*st(26,35),'HYD',8)
    sh.leader(*st(27,31),155,615,'DOMESTIC WATER / HYDRANT',10)


def civil_site(out):
    doc=Document(out,'01-Civil-Site-and-Grading.pdf','Civil Site and Grading')
    sh=doc.sheet('C101','SITE PLAN','1/16" = 1\'-0"',discipline='CIVIL / SITE')
    site_base(sh);utilities(sh)
    sh.view_title(180,1440,'1','SITE & UTILITY COORDINATION PLAN','1/16" = 1\'-0"')
    sh.table(1460,1480,[170,365,190],['ITEM','DESCRIPTION','DEMO QTY'],[
        ['PARCEL','200\' × 160\' rectangular parcel','32,000 SF'],
        ['BUILDING','96\' × 60\' footprint','5,760 SF'],
        ['PARKING','P01–P12; P06/P12 marked A','12 STALLS'],
        ['PAVEMENT','60\' × 86\' asphalt apron','5,160 SF'],
        ['CB-1 / CB-2','Grated drainage inlets','2 EA'],
        ['BIKE RACK','Four loop racks on pad','4 EA'],
    ],row_h=38,size=12)
    sh.notes(1460,1150,'SITE KEYNOTES',[
        '01  Survey monuments at the four parcel corners are sample control points.',
        '02  Dashed 10-foot setback line is a training assumption; no zoning determination is implied.',
        '03  Parking stripe modules are 9 feet wide × 18 feet deep. The drive aisle is 24 feet wide.',
        '04  P06 and P12 are identified as accessible demonstration stalls with a shared 8-foot access aisle.',
        '05  Utility routes are diagrammatic. Search for CB-1, CB-2, FFE 504.00, WATER MAIN and REFUSE.',
        '06  Asphalt quantity refers only to the 60 × 86 foot main apron; entry drive and other paving are excluded.',
    ],width=725,size=13)
    sh.notes(1460,670,'LINE & SYMBOL LEGEND',[
        'Heavy dash-dot: surveyed parcel boundary',
        'Thin short dash: setback reference',
        'Blue short dash: storm drainage connection',
        'Gray long dash-dot: sanitary service',
        'A inside stall: accessible demonstration designation',
        'Crossed circle at corner: survey monument',
    ],width=725,size=12)
    sh.dimension(*[st(40,55)[0],st(136,55)[0],745,st(40,55)[1]],'96\'-0"')
    sh.notes(200,285,'DEMONSTRATION WORKFLOW',[
        'Calibrate with the 200-foot parcel dimension. Measure the 96 × 60 foot building and 60 × 86 foot asphalt apron.',
        'Create independent count groups for 12 parking stalls, 2 catch basins and 4 bicycle loops. Symbols shown in the legend are excluded.',
    ],width=1100,size=12)

    sh=doc.sheet('C501','GRADING & CIVIL DETAILS','AS NOTED',discipline='CIVIL / GRADING')
    # Contours are schematic polyline survey evidence; the building masks contours below it.
    for i,z in enumerate([500.5,501.0,501.5,502.0,502.5,503.0,503.5]):
        y=7+i*20
        pts=[(0,y+11),(28,y+18),(52,y+9),(89,y+7),(122,y-2),(158,y-11),(200,y-15)]
        site_poly(sh,pts,.8,GRAY,dash=[3,4])
        xx,yy=st(6,y+14);sh.text(xx,yy,f'{z:.2f}',9,color=GRAY)
    site_base(sh,labels=False)
    # Contours in clear planting strips and apron edges, kept outside the masked building.
    for i,z in enumerate([500.5,501.0,501.5,502.0,502.5,503.0,503.5]):
        y=7+i*20
        left=[(0,y+11),(28,y+18),(34,min(y+15,154))]
        if max(p[1] for p in left)<=160:site_poly(sh,left,.75,GRAY,dash=[3,4])
        right=[(139,y-6),(158,y-11),(200,y-15)]
        if min(p[1] for p in right)>=0:site_poly(sh,right,.75,GRAY,dash=[3,4])
    spot(sh,10,150,'503.80','NW CONTROL')
    spot(sh,183,150,'501.75','NE CONTROL',side='left')
    spot(sh,12,9,'501.20','SW CONTROL')
    spot(sh,188,9,'500.20','SE CONTROL',side='left')
    spot(sh,88,49,'503.90','ENTRY')
    spot(sh,173,109,'500.90','CB-1')
    spot(sh,192,19,'499.85','CB-2',side='left')
    arrow(sh,*st(145,60),*st(168,50),'1.5%')
    arrow(sh,*st(185,103),*st(191,28),'2.0%')
    arrow(sh,*st(48,128),*st(97,123),'1.0%')
    sh.line(*st(192,19),*st(203,22),.7,GRAY)
    callout(sh,*st(208,22),'2','C501')
    sh.view_title(180,1440,'1','SCHEMATIC GRADING PLAN','1/16" = 1\'-0" / CONTOUR INTERVAL 0.50 FT')
    sh.notes(180,285,'GRADING REFERENCES',[
        'Elevations use an arbitrary demonstration datum. FFE = 504.00. No terrain model, drainage calculation or flood determination is provided.',
        'Parcel control points and slope arrows support elevation searches and markup demonstrations. Existing contours are schematic, not survey data.',
    ],width=1100,size=12)
    # Detail 2: pavement section at 1-1/2 inch = 1 foot.
    panel(sh,1400,1030,810,430,'ASPHALT PAVEMENT SECTION','2','1-1/2" = 1\'-0"')
    dx,dy,ds=1470,1140,108
    layers=[(0,24/12,'COMPACTED SUBGRADE',WHITE),(24/12,8/12,'8" AGGREGATE BASE',PALE),(32/12,3/12,'3" ASPHALT SURFACE',HexColor('#bcc4c8'))]
    for start,height,label,fill in layers:
        sh.rect(dx,dy+start*ds,3*ds,height*ds,.9,fill=fill)
        if start<2.67:sh.hatch(dx,dy+start*ds,3*ds,height*ds,18)
        sh.leader(dx+3*ds,dy+(start+height/2)*ds,1850,dy+(start+height/2)*ds,label,11)
    sh.dimension(dx,dx+3*ds,1100,dy,'3\'-0" REFERENCE WIDTH')
    sh.text(1470,1060,'Detail material thicknesses are measurable at the stated scale.',11,color=GRAY)
    # Detail 3: drainage inlet, exact 2-foot width at 1/2 inch = 1 foot.
    panel(sh,1400,480,810,430,'CATCH BASIN SECTION','3','1/2" = 1\'-0"')
    dx,dy,ds=1580,590,36
    sh.rect(dx,dy,2*ds,4*ds,1.7,fill=PALE)
    sh.rect(dx+5,dy+12,2*ds-10,4*ds-26,.9,fill=WHITE)
    sh.hatch(dx,dy,5,4*ds,10);sh.hatch(dx+2*ds-5,dy,5,4*ds,10)
    sh.rect(dx-8,dy+4*ds,2*ds+16,5,1.4,fill=GRAY)
    for t in range(0,80,10):sh.line(dx-5+t,dy+4*ds,dx-5+t,dy+4*ds+5,.6)
    sh.line(dx-70,dy+4*ds+4,dx-8,dy+4*ds+4,.9)
    sh.line(dx+2*ds+8,dy+4*ds+4,dx+2*ds+130,dy+4*ds+4,.9)
    sh.rect(dx+2*ds-5,dy+ds,120,18,.9,fill=WHITE)
    sh.line(dx+2*ds,dy+ds+9,dx+2*ds+115,dy+ds+9,.5,GRAY,dash=[6,3])
    sh.dimension(dx,dx+2*ds,dy-27,dy,'2\'-0" CLEAR')
    sh.dimension_y(dy,dy+4*ds,dx-45,dx,'4\'-0"')
    sh.leader(dx+36,dy+4*ds+5,1830,830,'TRAFFIC-RATED GRATE (DEMO)',11)
    sh.leader(dx+2*ds+110,dy+ds+10,1830,698,'6" STORM OUTLET',11)
    sh.leader(dx+10,dy+15,1830,611,'PRECAST CONCRETE SUMP',11)
    sh.notes(1400,350,'CIVIL DETAIL NOTES',[
        'Sections are original simplified training details. Dimensions shown are reference geometry and do not establish an engineered specification.',
    ],width=810,size=12)
    rec=doc.finish();rec['facts']={'parcel_sf':32000,'building_footprint_sf':5760,'parking_stalls':12,'accessible_demo_stalls':2,'catch_basins':2,'bicycle_loops':4,'main_asphalt_apron_sf':5160,'site_points_per_ft':4.5};return rec


def grid(sh,ox,oy,scale,top=True):
    for i,x in enumerate((0,24,48,72,96),1):
        xx=ox+x*scale;sh.line(xx,oy-35,xx,oy+60*scale+72,.5,GRAY,dash=[12,4,2,4])
        if top:
            sh.circle(xx,oy+60*scale+89,16,.8,fill=WHITE);sh.text(xx,oy+60*scale+84,i,11,bold=True,align='center')
    for i,y in enumerate((0,30,60)):
        yy=oy+y*scale;sh.line(ox-30,yy,ox+96*scale+30,yy,.5,GRAY,dash=[12,4,2,4])
        sh.circle(ox-47,yy,16,.8,fill=WHITE);sh.text(ox-47,yy-4,chr(65+i),11,bold=True,align='center')


def foundation_plan(sh):
    # Foundation perimeter, interconnected grade beams and fifteen discrete column pads.
    sh.rect(OX-18,OY-18,96*S+36,60*S+36,2.3)
    sh.rect(OX+18,OY+18,96*S-36,60*S-36,1.1)
    for y in (30,):sh.rect(OX,OY+y*S-12,96*S,24,1.0,fill=PALE)
    for x in (24,48,72):sh.rect(OX+x*S-12,OY,24,60*S,1.0,fill=PALE)
    for x in (12,36,60,84):sh.line(OX+x*S,OY+18,OX+x*S,OY+60*S-18,.65,GRAY,dash=[5,5])
    for y in (15,45):sh.line(OX+18,OY+y*S,OX+96*S-18,OY+y*S,.65,GRAY,dash=[5,5])
    for r,y in enumerate((0,30,60)):
        for col,x in enumerate((0,24,48,72,96)):
            xx,yy=OX+x*S,OY+y*S
            sh.rect(xx-2*S,yy-2*S,4*S,4*S,1.2,fill=WHITE)
            sh.hatch(xx-2*S,yy-2*S,4*S,4*S,15)
            sh.symbol('column',xx,yy,size=9)
            sh.text(xx+2*S+10,yy+6,'F1',10,bold=True)
    grid(sh,OX,OY,S)
    sh.dimension(OX,OX+96*S,242,OY,'96\'-0"')
    for x1,x2 in zip((0,24,48,72),(24,48,72,96)):
        sh.dimension(OX+x1*S,OX+x2*S,1480,OY+60*S,'24\'-0"')
    sh.dimension_y(OY,OY+60*S,105,OX,'60\'-0"')
    for a,b in [(0,30),(30,60)]:sh.dimension_y(OY+a*S,OY+b*S,1960,OX+96*S,'30\'-0"')
    for x,y in [(12,15),(36,45),(60,15),(84,45)]:
        xx,yy=OX+x*S,OY+y*S;sh.rect(xx-160,yy-18,320,46,0,fill=WHITE);sh.text(xx,yy+12,'6" CONCRETE SLAB',13,bold=True,align='center');sh.text(xx,yy-10,'SOG-1 / T.O. SLAB 504.00',11,align='center')
    sh.leader(OX+36*S,OY+15*S,OX+42*S,OY+20*S,'SAW-CUT CONTROL JOINT (TYP.)',11)
    sh.leader(OX+48*S,OY+30*S,OX+52*S,OY+35*S,'GB1 / CONTINUOUS GRADE BEAM',11)
    callout(sh,OX+72*S,OY+30*S,'2','S501')
    sh.scale_bar(180,205,S,20)


def structure(out):
    doc=Document(out,'04-Structural-Foundation-and-Framing.pdf','Structural Foundation and Framing')
    sh=doc.sheet('S101','FOUNDATION PLAN','1/4" = 1\'-0"',discipline='STRUCTURAL')
    foundation_plan(sh)
    sh.notes(2020,1455,'FOUNDATION KEY',[
        'F1: 4\' × 4\' × 14" concrete spread footing; 15 locations.',
        'C1: 6" × 6" HSS column; 15 grid intersections.',
        'GB1: 16" × 18" grade beam, shown as a continuous schematic strip.',
        'SOG-1: 6" slab on grade over granular fill.',
    ],width=235,size=11)
    sh.table(2020,1050,[105,130],['ITEM','QTY'],[['F1','15 EA'],['C1','15 EA'],['SLAB','5,760 SF'],['6" SLAB','106.67 CY']],row_h=40,size=11)
    sh.notes(2020,800,'TRAINING NOTES',[
        'Column grid: 5 lines × 3 lines = 15 intersections.',
        'Slab volume = 96 × 60 × 0.5 / 27 = 106.667 cubic yards.',
        'Gross slab quantity excludes beam and footing volumes and makes no deductions.',
        'Reinforcement and member sizes are fictional demonstration assumptions.',
        'No engineering approval is represented.',
    ],width=235,size=11)
    sh.text(620,205,'FOUNDATION PLAN / 15 COLUMN GRID INTERSECTIONS',17,bold=True)
    sh.text(620,182,'Dimensioned geometry supports area, length, count and gross-volume demonstrations.',12,color=GRAY)

    sh=doc.sheet('S501','FRAMING & STRUCTURAL DETAILS','AS NOTED',discipline='STRUCTURAL')
    fox,foy,fs=180,895,9
    # One-story roof framing: beams at 24-foot bays and joists at 4-foot spacing.
    for y in (0,30,60):
        sh.rect(fox,foy+y*fs-4,96*fs,8,.85,fill=PALE)
    for x in (0,24,48,72,96):
        sh.rect(fox+x*fs-4,foy,8,60*fs,.85,fill=PALE)
    for x in range(4,96,4):
        xx=fox+x*fs
        sh.line(xx,foy+6,xx,foy+60*fs-6,.65)
        sh.line(xx+3,foy+6,xx+3,foy+60*fs-6,.4,GRAY)
    for y in (0,30,60):
        for x in (0,24,48,72,96):sh.symbol('column',fox+x*fs,foy+y*fs,size=10)
    grid(sh,fox,foy,fs)
    sh.dimension(fox,fox+96*fs,foy-35,foy,'96\'-0"')
    sh.dimension_y(foy,foy+60*fs,110,fox,'60\'-0"')
    for a,b in zip((0,24,48,72),(24,48,72,96)):sh.dimension(fox+a*fs,fox+b*fs,1480,foy+60*fs,'24\'-0"')
    sh.rect(fox+48*fs-170,foy+45*fs-8,340,28,0,fill=WHITE)
    sh.text(fox+48*fs,foy+45*fs,'J1 OPEN WEB JOISTS @ 4\'-0" O.C.',13,bold=True,align='center')
    sh.rect(fox+48*fs-170,foy+15*fs-8,340,26,0,fill=WHITE)
    sh.text(fox+48*fs,foy+15*fs,'J1 / 30\'-0" SPAN BETWEEN GRID LINES',12,align='center')
    callout(sh,fox+72*fs,foy+30*fs,'4','S501')
    sh.view_title(180,786,'1','ROOF FRAMING PLAN','1/8" = 1\'-0"')
    sh.scale_bar(1300,900,fs,20)
    sh.table(1210,1495,[120,200,575],['MARK','DESCRIPTION','REFERENCE / DEMO ONLY'],[
        ['C1','HSS 6 × 6','15 columns at 5 × 3 grid intersections'],
        ['F1','Spread footing','4\' × 4\' × 14"; shown on S101'],
        ['GB1','Grade beam','16" wide × 18" deep schematic section'],
        ['B1','Roof beam','W12 reference member at grid lines'],
        ['J1','Roof joist','30\' span / 4\' nominal spacing'],
    ],row_h=40,size=12)
    sh.notes(1210,1228,'STRUCTURAL COORDINATION NOTES',[
        'The roof framing plan is shown at 1/8" = 1\'-0". Detail 2 uses 1/2" = 1\'-0"; Detail 3 uses 1-1/2" = 1\'-0".',
        'Calibrate each drawing viewport independently before measuring. Page-level calibration alone will not match every detail.',
        'F1 and C1 counts are 15 on the foundation sheet and are repeated here for coordination; do not sum repeated views into a takeoff.',
        'All sections are original synthetic demonstration geometry. Structural capacities, connections and reinforcement are not engineered.',
    ],width=895,size=13)
    # Footing section at 1/2 inch = 1 foot: exact geometry.
    panel(sh,180,315,610,410,'F1 FOOTING SECTION','2','1/2" = 1\'-0"')
    dx,dy,ds=350,400,36
    sh.line(210,dy+3*ds,750,dy+3*ds,.8,GRAY)
    sh.line(210,dy+3*ds-18,750,dy+3*ds-18,.8,GRAY)
    sh.rect(dx,dy,4*ds,14/12*ds,1.6,fill=PALE);sh.hatch(dx,dy,4*ds,14/12*ds,14)
    sh.rect(dx+45,dy+42,54,66,1.3,fill=PALE);sh.hatch(dx+45,dy+42,54,66,12)
    sh.rect(dx+63,dy+108,18,101,1.2,fill=WHITE)
    sh.rect(dx+51,dy+107,42,4,1.1,fill=GRAY)
    for x in (dx+18,dx+48,dx+78,dx+108):sh.circle(x,dy+9,2.5,.65)
    sh.line(dx+13,dy+9,dx+130,dy+9,.8)
    sh.dimension(dx,dx+4*ds,dy-32,dy,'4\'-0"')
    sh.dimension_y(dy,dy+42,dx-40,dx,'14"')
    sh.leader(dx+120,dy+12,555,417,'REBAR / DEMO',10)
    sh.leader(dx+78,dy+146,555,624,'C1 / HSS 6 × 6',10)
    sh.leader(dx+84,dy+96,555,566,'18" PEDESTAL',10)
    sh.text(210,686,'T.O. SLAB 504.00',11,bold=True)
    # Base-plate plan, 12-inch square exactly at 1-1/2 inch = 1 foot.
    panel(sh,860,315,610,410,'C1 BASE PLATE PLAN','3','1-1/2" = 1\'-0"')
    dx,dy,ds=1010,425,108
    sh.rect(dx,dy,ds,ds,1.8,fill=PALE)
    sh.rect(dx+27,dy+27,54,54,1.4,fill=WHITE)
    sh.rect(dx+30,dy+30,48,48,.6)
    for x in (dx+13.5,dx+94.5):
        for y in (dy+13.5,dy+94.5):sh.circle(x,y,3.375,.9);sh.circle(x,y,7,.5)
    sh.line(dx-20,dy+54,dx+ds+20,dy+54,.5,GRAY,dash=[7,3])
    sh.line(dx+54,dy-20,dx+54,dy+ds+20,.5,GRAY,dash=[7,3])
    sh.dimension(dx,dx+ds,dy-40,dy,'12"')
    sh.dimension_y(dy,dy+ds,dx-48,dx,'12"')
    sh.leader(dx+54,dy+62,1220,618,'6" HSS COLUMN',10)
    sh.leader(dx+94.5,dy+94.5,1220,559,'3/4" ANCHOR',10)
    sh.text(900,686,'4 ANCHORS / 9" GAUGE / 12" × 12" PLATE',11,bold=True)
    sh.text(900,351,'Dimensioned plan is a calibration practice detail.',11,color=GRAY)
    # Isometric-free steel connection, diagrammatic, visibly detailed.
    panel(sh,1540,315,700,410,'JOIST / BEAM CONNECTION','4','SCHEMATIC / NOT TO SCALE')
    bx,by=1630,440
    sh.rect(bx,by,280,14,1.2,fill=GRAY)
    sh.rect(bx+133,by-90,14,90,1.1,fill=PALE)
    sh.rect(bx+88,by-100,105,10,1.0,fill=GRAY)
    sh.rect(bx+20,by+80,370,8,1.0,fill=PALE)
    sh.rect(bx+20,by+25,370,8,1.0,fill=PALE)
    for i in range(6):
        x=bx+25+i*58
        sh.polyline([(x,by+30),(x+29,by+80),(x+58,by+30)],.8)
    sh.rect(bx+25,by+14,60,12,1,fill=PALE)
    for x in (bx+42,bx+68):sh.circle(x,by+20,3,.6)
    sh.leader(bx+210,by+86,2030,665,'J1 TOP CHORD',10)
    sh.leader(bx+64,by+18,2030,577,'JOIST SEAT',10)
    sh.leader(bx+140,by-70,2030,482,'B1 ROOF BEAM',10)
    sh.text(1590,351,'Connection sizes and welds are intentionally unspecified.',11,color=GRAY)
    rec=doc.finish();rec['facts']={'foundation_columns':15,'spread_footings':15,'grid_lines_x':5,'grid_lines_y':3,'gross_slab_sf':5760,'slab_thickness_in':6,'gross_slab_cy':5760*.5/27,'foundation_points_per_ft':18,'framing_points_per_ft':9,'footing_detail_points_per_ft':36,'base_plate_detail_points_per_ft':108};return rec


def tree(sh,x,y,tag=None,size=45):
    xx,yy=st(x,y);radius=size/2
    sh.circle(xx,yy,radius,.9,fill=WHITE)
    # Crown scallops and radial branches are distinct from the small legend icon.
    pts=[]
    for i in range(32):
        a=2*pi*i/32;r=radius*(.84 if i%2 else 1)
        pts.append((xx+r*cos(a),yy+r*sin(a)))
    sh.polyline(pts,.65,GRAY,close=True)
    for i in range(5):
        a=2*pi*i/5;sh.line(xx,yy,xx+radius*.63*cos(a),yy+radius*.63*sin(a),.5,GRAY)
    sh.circle(xx,yy,2.3,0,fill=INK)
    if tag:sh.text(xx,yy-radius-14,tag,9,bold=True,align='center')


def landscape(out):
    doc=Document(out,'09-Landscape-and-External-Works.pdf','Landscape and External Works')
    sh=doc.sheet('L101','LANDSCAPE PLAN','1/16" = 1\'-0"',discipline='LANDSCAPE / SITE')
    site_base(sh,landscape=True,labels=False)
    for tag,x,y,w,h in BEDS:
        xx,yy=st(x,y);sh.rect(xx,yy,w*SITE_S,h*SITE_S,.7,fill=HexColor('#f0f3ef'))
        sh.hatch(xx,yy,w*SITE_S,h*SITE_S,14,HexColor('#99a59b'))
        sh.text(xx+w*SITE_S/2,yy+h*SITE_S/2-3,tag,10,bold=True,align='center')
    for i,(x,y) in enumerate(TREE_POINTS,1):tree(sh,x,y,f'T{i:02d}')
    # Mulch rings shown inside each tree; all crowns remain inside the parcel.
    for x,y in TREE_POINTS:xx,yy=st(x,y);sh.circle(xx,yy,7,.5,GRAY)
    # Six site benches and four bollards.
    for x,y,rot in [(46,125,0),(70,125,0),(94,125,0),(35,64,90),(35,88,90),(106,44,0)]:
        xx,yy=st(x,y);sh.rect(xx-9,yy-3,18,6,.7,fill=PALE)
        sh.line(xx-6,yy-5,xx-6,yy+5,.65);sh.line(xx+6,yy-5,xx+6,yy+5,.65)
    for x in (80,85,90,95):xx,yy=st(x,40);sh.circle(xx,yy,3.5,.8,fill=PALE)
    sh.view_title(180,1440,'1','LANDSCAPE & SITE FURNISHING PLAN','1/16" = 1\'-0"')
    sh.leader(*st(38,20),200,565,'T09 / SEE PLANT SCHEDULE',11)
    sh.leader(*st(90,40),1160,650,'4 ENTRY BOLLARDS',11)
    sh.leader(*st(94,125),1160,1190,'BENCH / 6 TOTAL ON PLAN',11)
    sh.table(1460,1490,[95,240,230,145],['MARK','PLANT / MATERIAL','SIZE / MODULE','QTY'],[
        ['T01–04','Red maple','2.5" cal. / shade tree','4 EA'],
        ['T05–08','Serviceberry','2" cal. / ornamental','4 EA'],
        ['T09–12','River birch','2.5" cal. / shade tree','4 EA'],
        ['B1','North planting bed','160\' × 20\'','3,200 SF'],
        ['B2','West planting bed','15\' × 95\'','1,425 SF'],
        ['B3','South planting bed','95\' × 16\'','1,520 SF'],
        ['B4','East planting bed','50\' × 10\'','500 SF'],
        ['BENCH','Site bench','6\' nominal','6 EA'],
        ['BOLLARD','Entry bollard','Diagram symbol','4 EA'],
    ],row_h=36,size=11)
    sh.notes(1460,1100,'LANDSCAPE KEYNOTES',[
        '01  Twelve tree symbols occur in the plan. The tree in the legend is a separate specimen symbol and is excluded from the count.',
        '02  The four rectilinear planting-bed areas total 6,645 square feet. Count and measure beds separately from tree crowns.',
        '03  Plant sizes and species are training assumptions; climate suitability and irrigation requirements are not established.',
        '04  Furnishings are diagram symbols. Tags T01 through T12 provide reliable text-search targets for navigation.',
        '05  Site and building footprints are repeated from C101 for coordination. Do not add duplicate drawing views to a takeoff.',
    ],width=710,size=13)
    sh.notes(1460,660,'SYMBOL LEGEND',[
        'Tree crown / plan tags T01–T12',
        'Diagonal green hatch / planting-bed area',
        'Narrow double rectangle / site bench',
        'Small filled circle / bollard',
    ],width=710,size=12)
    # Legend specimen intentionally outside the plan, with a clear exclusion label.
    sh.symbol('tree',1510,408,size=45)
    sh.text(1560,417,'TREE LEGEND SYMBOL',12,bold=True)
    sh.text(1560,396,'EXCLUDE FROM PLAN TREE COUNT',11,color=GRAY)
    sh.notes(200,285,'DEMONSTRATION WORKFLOW',[
        'Calibrate using the 200-foot parcel edge. Count 12 trees in the plan, then assign species groups using the schedule.',
        'Measure B1 through B4 as four independent filled polygons. Their combined geometric area is 6,645 SF.',
    ],width=1100,size=12)

    sh=doc.sheet('L501','PLANTING & SITE DETAILS','AS NOTED',discipline='LANDSCAPE / DETAILS')
    # Large tree planting section at 1/2 inch = 1 foot.
    panel(sh,180,840,900,620,'TREE PLANTING SECTION','1','1/2" = 1\'-0"')
    tx,ty,ds=480,990,36
    sh.line(230,ty+108,1025,ty+108,.8)
    # Original crown and branches; intentionally schematic above soil line.
    crown=[(tx-50,ty+248),(tx-93,ty+290),(tx-80,ty+345),(tx-42,ty+382),(tx+13,ty+368),(tx+54,ty+397),(tx+104,ty+352),(tx+96,ty+290),(tx+59,ty+245)]
    sh.polyline(crown,1.2,close=True)
    sh.polyline([(tx-6,ty+85),(tx-6,ty+267),(tx-39,ty+304)],1.4)
    sh.polyline([(tx+6,ty+85),(tx+6,ty+279),(tx+36,ty+322)],1.4)
    sh.polyline([(tx,ty+250),(tx+67,ty+280)],1)
    # 36-inch root ball and 72-inch pit are actual scale geometry.
    sh.polyline([(tx-3*ds,ty+108),(tx-2.2*ds,ty),(tx+2.2*ds,ty),(tx+3*ds,ty+108)],1.5,close=True,fill=PALE)
    sh.polyline([(tx-1.5*ds,ty+99),(tx-1.1*ds,ty+6),(tx+1.1*ds,ty+6),(tx+1.5*ds,ty+99)],1.2,close=True,fill=WHITE)
    for dx in (-104,104):
        sh.rect(tx+dx-3,ty+20,6,210,1,fill=PALE)
        sh.line(tx+dx,ty+214,tx,ty+217,.75)
    for side in (-1,1):
        sh.rect(tx+side*54-(54 if side<0 else 0),ty+108,54,9,.7,fill=HexColor('#bfc8bb'))
    sh.dimension(tx-3*ds,tx+3*ds,ty-40,ty,'6\'-0" PLANTING PIT')
    sh.dimension(tx-1.5*ds,tx+1.5*ds,ty+136,ty+108,'3\'-0" ROOT BALL')
    sh.leader(tx+15,ty+112,720,1195,'ROOT FLARE ABOVE FINISH GRADE',11)
    sh.leader(tx+74,ty+113,720,1135,'3" MULCH / KEEP CLEAR OF TRUNK',11)
    sh.leader(tx+65,ty+42,720,1065,'BACKFILL / SCARIFIED SIDES',11)
    sh.text(220,1405,'CROWN AND STAKING ARE SCHEMATIC; PIT DIMENSIONS ARE TO SCALE.',10,color=GRAY)
    # Planting-bed edge at 1-1/2 inch = 1 foot.
    panel(sh,1240,840,980,620,'PLANTING BED / WALK EDGE','2','1-1/2" = 1\'-0"')
    bx,by,bs=1320,995,108
    sh.rect(bx,by,360,90,.8,fill=PALE);sh.hatch(bx,by,360,90,20)
    sh.rect(bx,by+90,360,27,.9,fill=HexColor('#bdc7b9'))
    sh.rect(bx+360,by,13.5,135,1,fill=GRAY)
    sh.rect(bx+373.5,by,350,81,.8,fill=PALE);sh.hatch(bx+373.5,by,350,81,18)
    sh.rect(bx+373.5,by+81,350,36,1,fill=WHITE)
    sh.line(bx+373.5,by+90,bx+723.5,by+90,.6)
    sh.line(bx+360,by+135,bx+373.5,by+135,1)
    sh.dimension_y(by+90,by+117,bx-35,bx,'3" MULCH')
    sh.dimension_y(by+81,by+117,bx+758,bx+723.5,'4" WALK')
    sh.leader(bx+366,by+134,1700,1315,'1-1/2" EDGE / 15" DEEP',11)
    sh.leader(bx+210,by+40,1700,1238,'PREPARED PLANTING SOIL',11)
    sh.leader(bx+635,by+40,1700,943,'COMPACTED AGGREGATE BASE',11)
    sh.text(1290,1405,'MATERIAL LAYERS ARE MEASURABLE AT THE DETAIL SCALE.',10,color=GRAY)
    # Bench plan: 6 x 2 at 1/2 inch = foot.
    panel(sh,180,280,900,420,'SITE BENCH PLAN','3','1/2" = 1\'-0"')
    bx,by,bs=400,390,36
    sh.rect(bx,by,6*bs,2*bs,1.2,fill=WHITE)
    for y in range(12,72,12):sh.line(bx,by+y,bx+216,by+y,.55)
    for dx in (24,192):sh.rect(bx+dx-4,by-5,8,82,.9,fill=PALE)
    for dx in (24,192):
        for dy in (8,64):sh.circle(bx+dx,by+dy,2.5,.6)
    sh.dimension(bx,bx+216,by-37,by,'6\'-0"')
    sh.dimension_y(by,by+72,bx-42,bx,'2\'-0"')
    sh.leader(bx+194,by+64,740,530,'ANCHOR TO CONCRETE PAD',11)
    sh.text(220,640,'SIX INSTANCES ON PLAN L101 / DETAIL VIEW IS EXCLUDED FROM COUNT.',11,color=GRAY)
    # Tree and bed schedules plus general reference notes in lower right.
    sh.table(1240,700,[135,450,360],['MARK','GEOMETRIC AREA','COUNT / GROUP'],[
        ['B1','160 × 20 = 3,200 SF','NORTH BED'],
        ['B2','15 × 95 = 1,425 SF','WEST BED'],
        ['B3','95 × 16 = 1,520 SF','SOUTH BED'],
        ['B4','50 × 10 = 500 SF','EAST BED'],
        ['TOTAL','6,645 SF / 4 POLYGONS','12 TREES ON L101'],
    ],row_h=37,size=12)
    sh.notes(1240,438,'LANDSCAPE DETAIL NOTES',[
        'The planting section, bench and tree legend are repeated explanatory views; count trees and furnishings on L101 only.',
        'This sheet deliberately combines three scales. Calibrate each detail from its labeled dimension before measuring.',
        'Specifications are fictional and simplified for markup, measurement, search and extraction demonstrations.',
    ],width=945,size=12)
    rec=doc.finish();rec['facts']={'plan_trees':12,'tree_legend_symbols_excluded':1,'maples':4,'serviceberries':4,'river_birches':4,'planting_beds':4,'planting_bed_sf':6645,'benches':6,'bollards':4,'landscape_points_per_ft':4.5,'tree_detail_points_per_ft':36,'bed_detail_points_per_ft':108};return rec


def build(out):
    """Write the three assigned two-sheet vector PDFs and return guide metadata."""
    return [civil_site(out),structure(out),landscape(out)]
