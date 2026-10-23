"""Architectural comparison, interiors and native-layer coordination samples."""
from common import *

def window(sh,x,y,width=8,vertical=False):
    xx,yy=pt(x,y);a=width*S
    if vertical:
        sh.line(xx,yy,xx,yy+a,9,HexColor('#ffffff'))
        for dx in (-4,0,4):sh.line(xx+dx,yy,xx+dx,yy+a,.9)
        for dy in (0,a):sh.line(xx-7,yy+dy,xx+7,yy+dy,1)
    else:
        sh.line(xx,yy,xx+a,yy,9,HexColor('#ffffff'))
        for dy in (-4,0,4):sh.line(xx,yy+dy,xx+a,yy+dy,.9)
        for dx in (0,a):sh.line(xx+dx,yy-7,xx+dx,yy+7,1)

def furniture(sh):
    # Two assembly tables in each of the four large north rooms.
    for x in (6,30,54,78):
        for y in (41,53):
            xx,yy=pt(x,y);sh.rect(xx,yy,9*S,3*S,.7,fill=HexColor('#f5f6f7'))
            for cx in (1.5,4.5,7.5):
                for cy in (-1.8,3.8):sh.rect(xx+cx*S-12,yy+cy*S-10,24,20,.55)
    for x in (28,38):
        xx,yy=pt(x,4);sh.rect(xx,yy,6*S,2.5*S,.7);sh.circle(xx+3*S,yy+4*S,14,.6)
    xx,yy=pt(3,4);sh.rect(xx,yy,15*S,2*S,.8);sh.rect(xx,yy+3*S,2*S,9*S,.8)
    for x in (51,63):
        for y in (3,17):
            sh.rect(*pt(x,y),4*S,5*S,.6)
            sh.symbol('wc',*pt(x+2,y+2.5),size=24)
    for x in (75,86):
        for y in (3,17):sh.rect(*pt(x,y),7*S,2*S,.65)

def arch_plan(sh,rev):
    sh.plan_base(rev=rev)
    for x in (8,32,56,82):window(sh,x,60)
    for x in (5,28):window(sh,x,0,8)
    if rev=='B':window(sh,17,0,6)
    for y in (6,44):window(sh,96,y,8,True)
    furniture(sh)
    # Section references intentionally link to the second sheet.
    for x in (4,92):
        xx,yy=pt(x,30);sh.circle(xx,yy,24,1.1,fill=HexColor('#ffffff'))
        sh.line(xx-24,yy,xx+24,yy,.8)
        sh.text(xx,yy+6,'1',13,bold=True,align='center');sh.text(xx,yy-16,'A201',10,align='center')
        sh.c.linkRect('Open building section A201','page2',(xx-25,yy-25,xx+25,yy+25),relative=0,thickness=0)
    sh.line(*pt(6,30),*pt(90,30),.7,GRAY,[12,5,2,5])
    sh.view_title(180,150,'1','GROUND FLOOR PLAN','1/4" = 1\'-0" | 1:48')
    sh.notes(1990,1250,'GENERAL NOTES',[
      '1. All dimensions reference exterior face or partition centerline.',
      '2. Overall building footprint: 96\'-0" x 60\'-0".',
      '3. Door symbols show 3\'-0" leafs. Furniture is diagrammatic.',
      '4. Refer to A201 for elevations and wall sections.',
      '5. W1 glazing shown schematically. No performance specification implied.'
    ],270,11)
    sh.table(1990,700,[70,200],['TAG','ASSEMBLY'],[
      ['W1','Exterior wall'],['P1','Interior partition'],['D1','3\'-0" single leaf'],['F1','Resilient floor'],['F2','Porcelain tile']],32,10)
    sh.notes(1990,440,'ISSUE INFORMATION',[
      'Revision A: baseline issue.' if rev=='A' else 'Revision B: room 103 expanded; door 104 relocated; south glazing added.',
      'Plan geometry is identical between issues except the documented changes.'
    ],270,11)

def elevation(sh,x,y,name,rev='A',south=False):
    p=9;length=96*p;base=y+105
    sh.line(x,base,x+length,base,1.3)
    sh.rect(x,base,length,12*p,1.5)
    sh.polyline([(x-18,base+12*p),(x+length/2,base+18*p),(x+length+18,base+12*p)],1.5)
    sh.line(x-18,base+12*p+8,x+length+18,base+12*p+8,.6)
    sh.hatch(x,base,length,2*p,11,GRAY)
    for xx in (8,32,56,82) if not south else (5,28):
        sh.rect(x+xx*p,base+3*p,8*p,6*p,.9)
        sh.line(x+(xx+4)*p,base+3*p,x+(xx+4)*p,base+9*p,.6)
        sh.line(x+xx*p,base+6*p,x+(xx+8)*p,base+6*p,.6)
    if south:
        sh.rect(x+45*p,base,3*p,7*p,1);sh.circle(x+47.5*p,base+3*p,2,.7)
        if rev=='B':sh.rect(x+17*p,base+3*p,6*p,6*p,.9)
    for yy,label in [(0,'T.O. SLAB 100\'-0"'),(12,'T.O. WALL 112\'-0"'),(18,'RIDGE 118\'-0"')]:
        sh.line(x+length+25,base+yy*p,x+length+83,base+yy*p,.7)
        sh.text(x+length+27,base+yy*p+9,label,9)
    sh.dimension(x,x+length,base-38,base,'96\'-0"')

def arch_sections(sh,rev):
    sh.panel(100,990,1000,510,'NORTH ELEVATION','1','1/8" = 1\'-0"')
    sh.panel(1230,990,1000,510,'SOUTH ELEVATION','2','1/8" = 1\'-0"')
    elevation(sh,130,1070,'NORTH ELEVATION',rev)
    elevation(sh,1260,1070,'SOUTH ELEVATION',rev,True)
    # Lower left transverse section, exact 60 ft width at 1/4 inch.
    sh.panel(100,265,1150,580,'TRANSVERSE BUILDING SECTION','3','1/4" = 1\'-0"')
    x=135;y=390;p=18;w=60*p
    sh.rect(x,y,w,9,1,fill=PALE);sh.hatch(x,y,w,9,8)
    sh.line(x,y-15,x+w,y-15,.7)
    for xx in (0,24,36,60):sh.rect(x+xx*p,y,9,12*p,1,fill=PALE)
    sh.polyline([(x-18,y+12*p),(x+w/2,y+18*p),(x+w+18,y+12*p)],2)
    sh.polyline([(x-18,y+12*p-15),(x+w/2,y+18*p-15),(x+w+18,y+12*p-15)],.8)
    sh.line(x,y+10*p,x+w,y+10*p,.7,dash=[6,4])
    sh.dimension(x,x+w,y-57,y,'60\'-0"')
    sh.dimension_y(y,y+12*p,x+1120,x+w,'12\'-0"')
    sh.text(x+250,y+30,'COMMUNITY ROOM',12,align='center');sh.text(x+540,y+30,'CORRIDOR',12,align='center')
    sh.text(x+865,y+30,'LOBBY / SUPPORT',12,align='center')
    sh.text(x+400,y+300,'ROOF TRUSS - SCHEMATIC',12)
    # Enlarged wall-to-slab detail at 1-1/2 inch = 1 foot.
    sh.panel(1350,265,880,580,'WALL / SLAB JUNCTION','4','1-1/2" = 1\'-0"')
    x=1420;y=385;p=108
    sh.rect(x,y,8*p/12,3.1*p,1.5,fill=PALE);sh.hatch(x,y,8*p/12,3.1*p,10)
    sh.rect(x,y-8*p/12,28*p/12,8*p/12,1.5,fill=PALE);sh.hatch(x,y-8*p/12,28*p/12,8*p/12,10)
    sh.rect(x+8*p/12,y,40*p/12,6*p/12,1,fill=PALE);sh.hatch(x+8*p/12,y,40*p/12,6*p/12,10)
    sh.line(x+8*p/12,y-12,x+50*p/12,y-12,.8,dash=[4,3])
    sh.dimension(x,x+28*p/12,y-118,y-8*p/12,'2\'-4" FOOTING')
    sh.leader(x+15,y+255,x+180,y+255,'8" SCHEMATIC WALL',11)
    sh.leader(x+200,y+30,x+450,y+70,'6" CONCRETE SLAB',11)
    sh.leader(x+180,y-12,x+450,y-17,'MEMBRANE / GRANULAR BASE',10)
    sh.text(1400,790,'ENLARGED DETAIL CALIBRATION: 2\'-4" = 252 PT',11,bold=True)

def architecture(out):
    result=[]
    for rev,file in [('A','02-Architectural-Revision-A.pdf'),('B','03-Architectural-Revision-B.pdf')]:
        d=Document(out,file,'Architecture / Revision '+rev)
        sh=d.sheet('A101','GROUND FLOOR PLAN','1/4" = 1\'-0"',rev,'ARCHITECTURE', '2026-09-15' if rev=='A' else '2026-09-29')
        arch_plan(sh,rev)
        sh=d.sheet('A201','ELEVATIONS, SECTION & WALL DETAIL','AS NOTED',rev,'ARCHITECTURE','2026-09-15' if rev=='A' else '2026-09-29')
        arch_sections(sh,rev)
        record=d.finish();record['facts']={'footprint_ft':[96,60],'gross_area_sf':5760,'gross_perimeter_ft':312,'calibration_20ft_points':360,'doors_plan':12,'meeting_room_103_sf':576 if rev=='A' else 720,'maker_room_104_sf':576 if rev=='A' else 432,'internal_detail_links':2}
        if rev=='B':record['facts']['changes']=['A101: north partition between rooms103/104 shifts east from x72ft to x78ft (+6ft).','A101: room104 door hinge moves east from x81ft to x84ft (+3ft).','A101/A201 south elevation: add6ft glazing from x17ft to x23ft.','Revision/date fields and issue note update.']
        result.append(record)
    return result

def interiors(out):
    d=Document(out,'10-Interiors-Finishes-and-Millwork.pdf','Interiors / Finishes and Millwork')
    sh=d.sheet('I101','FLOOR FINISH PLAN','1/4" = 1\'-0"',discipline='INTERIORS')
    for id,name,x,y,w,h in ROOMS:
        xx,yy=pt(x,y)
        col=HexColor('#eceff1') if id in ('107','108') else HexColor('#f6f4ed')
        sh.rect(xx+9,yy+9,w*S-18,h*S-18,0,fill=col)
        if id in ('107','108'):
            for a in range(2,int(w),2):sh.line(xx+a*S,yy+9,xx+a*S,yy+h*S-9,.35,GRAY)
            for a in range(2,int(h),2):sh.line(xx+9,yy+a*S,xx+w*S-9,yy+a*S,.35,GRAY)
        elif id!='111':
            for a in range(4,int(h),4):sh.line(xx+9,yy+a*S,xx+w*S-9,yy+a*S,.3,PALE)
        sh.rect(xx+w*S/2-95,yy+h*S/2-35,190,65,0,fill=col)
        sh.text(xx+w*S/2,yy+h*S/2+15,name,12,bold=True,align='center')
        sh.text(xx+w*S/2,yy+h*S/2-7,f'{id} / '+('F2 TILE' if id in ('107','108') else 'F1 RESILIENT'),11,align='center')
        sh.text(xx+w*S/2,yy+h*S/2-28,f'{w*h:,} SF',11,align='center')
    sh.plan_base(labels=False)
    sh.notes(1990,1220,'FINISH KEY',['F1: resilient flooring - all dry rooms and corridor.','F2: porcelain tile - restrooms107 &108.','P1: painted partitions.','Floor pattern is illustrative. Ceiling grid omitted from measured floor areas.'],270,11)
    sh.table(1990,830,[75,125,70],['TYPE','AREA','UNIT'],[['F1','5,184','SF'],['F2','576','SF'],['TOTAL','5,760','SF']],33,11)
    sh.notes(1990,575,'TAKEOFF BASIS',['Areas use room dimension boundaries; no wall thickness deductions.','Demo waste allowance: F1 +5%, F2 +10%. These are exercise assumptions.','Tile module2\'-0" x2\'-0"; nominal72tiles per restroom,144combined.'],270,11)
    sh.view_title(180,150,'1','FINISH PLAN','1/4" = 1\'-0" | 1:48')
    sh=d.sheet('I501','CASEWORK ELEVATION & INTERIOR DETAILS','AS NOTED',discipline='INTERIORS')
    sh.panel(100,880,1320,620,'RECEPTION CASEWORK ELEVATION','1','1/2" = 1\'-0"')
    x=170;y=1030;p=36;w=24*p
    sh.rect(x,y,w,3*p,1.5)
    sh.rect(x-5,y+3*p,w+10,6,1.2,fill=PALE)
    for a in range(0,24,4):
        sh.rect(x+a*p+3,y+5,4*p-6,3*p-10,.8)
        sh.line(x+(a+2)*p,y+9,x+(a+2)*p,y+3*p-8,.6)
        for dx in (1.7,2.3):sh.circle(x+(a+dx)*p,y+2*p,2,.8)
    sh.dimension(x,x+w,y-50,y,'24\'-0"');sh.dimension_y(y,y+3*p,x+w+60,x+w,'3\'-0"')
    sh.text(x,y+185,'6 CABINET BAYS @4\'-0"',13,bold=True)
    sh.leader(x+400,y+109,x+450,y+250,'SOLID SURFACE TOP',12)
    sh.table(1560,1420,[130,270,240],['TAG','DESCRIPTION','QUANTITY'],[['CW1','Base cabinet4ft','6EA'],['CT1','Countertop24x2.5ft','60SF'],['PL1','Toe kick','24LF']],36,12)
    sh.notes(1560,1150,'INTERIOR NOTES',['1. Casework dimensions are exact for the demo.','2. Finish selections are fictional.','3. Quantity exercises ignore openings/hardware deductions.','4. Detail scales differ from plan scale. Use Scale Regions before measuring.'],640,13)
    sh.panel(100,250,1040,530,'CASEWORK SECTION','2','1-1/2" = 1\'-0"')
    x=210;y=370;p=108
    sh.rect(x,y,2.5*p,3*p,1.3)
    sh.rect(x-8,y+3*p,2.5*p+16,9,1.2,fill=PALE)
    sh.rect(x+10,y+3*p-16,2.5*p-20,12,.8)
    sh.line(x+2.5*p-10,y+40,x+2.5*p-10,y+3*p,.9)
    sh.line(x,y+2*p,x+2.5*p,y+2*p,.8)
    sh.line(x+8,y+12,x+2.5*p-8,y+12,.8)
    sh.dimension(x,x+2.5*p,y-48,y,'2\'-6"');sh.dimension_y(y,y+3*p,x+2.5*p+65,x+2.5*p,'3\'-0"')
    sh.leader(x+40,y+3*p+7,660,700,'COUNTERTOP / EDGE',12)
    sh.leader(x+120,y+2*p,660,570,'ADJUSTABLE SHELF',12)
    sh.leader(x+10,y+30,660,420,'RECESSED TOE KICK',12)
    sh.panel(1280,250,950,530,'TILE FINISH TRANSITION','3','3" = 1\'-0"')
    x=1390;y=490;p=216
    sh.rect(x,y,3*p,6*p/12,1.4,fill=PALE);sh.hatch(x,y,3*p,6*p/12,13)
    sh.rect(x,y+6*p/12,1.5*p,12,.7)
    sh.rect(x+1.5*p,y+6*p/12,1.5*p,7,.7)
    sh.line(x+1.5*p,y+6*p/12,x+1.5*p,y+6*p/12+15,1.3)
    sh.dimension(x,x+3*p,y-53,y,'3\'-0" REFERENCE')
    sh.leader(x+100,y+120,1390,740,'F2 TILE / SETTING BED',11)
    sh.leader(x+480,y+115,1770,705,'F1 RESILIENT FLOOR',11)
    sh.text(1340,300,'DETAIL3: 3FT =648PT. USE A SEPARATE SCALE REGION.',12,bold=True)
    r=d.finish();r['facts']={'resilient_floor_sf':5184,'tile_floor_sf':576,'total_finish_sf':5760,'base_cabinets':6,'countertop_sf':60,'toe_kick_lf':24,'detail_scales':['1:24','1:8','1:4']};return r

def coordination(out):
    d=Document(out,'11-Coordination-and-Review.pdf','Coordination / Layers and Review Issues')
    sh=d.sheet('X101','MULTIDISCIPLINE COORDINATION','1/4" = 1\'-0"',discipline='COORDINATION')
    with sh.layer('LARCH'):sh.plan_base(labels=False,dimensions=True,faint=True)
    with sh.layer('LMECH'):
        for yy in (42,54):
            sh.line(*pt(5,yy),*pt(91,yy),4,HexColor('#36748a'))
            for xx in (12,36,60,84):sh.symbol('diffuser',*pt(xx,yy),size=27)
        sh.line(*pt(78,12),*pt(78,54),4,HexColor('#36748a'))
        sh.rect(*pt(74,4),8*S,6*S,1.5,color=HexColor('#36748a'));sh.text(*pt(78,6),'AHU-1',12,align='center')
    with sh.layer('LELEC'):
        sh.polyline([pt(42,9),pt(42,30),pt(90,30),pt(90,54)],2,HexColor('#a98035'),dash=[12,5])
        for xx in (10,34,58,82):
            for yy in (42,54):sh.symbol('light',*pt(xx,yy),size=27)
        sh.text(*pt(87,32),'TRAY AT9\'-0" AFF',11)
    with sh.layer('LISSUES'):
        for n,x,y in [('01',78,36),('02',60,54),('03',42,24)]:
            xx,yy=pt(x,y);sh.circle(xx,yy,48,2,HexColor('#aa4438'))
            sh.text(xx+57,yy+30,n,15,bold=True,color=HexColor('#aa4438'))
    sh.notes(1990,1240,'LAYER KEY',['Architecture - gray base.','Mechanical - blue routed ducts.','Electrical - ochre cable tray.','Review issues - red circles.','The4PDF layers can be toggled in readers that support optional content.'],270,11)
    sh.notes(1990,830,'COORDINATION ISSUES',['01: duct crosses corridor partition; opening not documented.','02: duct diffuser aligns with light fixture zone; check clearance.','03: cable tray crosses rated-partition demo line; coordinate penetration.'],270,11)
    sh.notes(1990,460,'REVIEW EXERCISE',['See X102 for issue log and review responses.','3native sticky-note annotations are attached to plan issue locations.','The conflicts are intentionally authored examples.'],270,11)
    sh.view_title(180,150,'1','COMPOSITE COORDINATION PLAN','1/4" = 1\'-0" | 1:48')
    sh=d.sheet('X102','ISSUE REGISTER & REVIEW DETAILS','AS NOTED',discipline='COORDINATION')
    sh.text(100,1500,'COORDINATION ISSUE REGISTER',23,bold=True)
    sh.table(100,1450,[80,520,180,210,570,540],['ID','LOCATION / ISSUE','TRADE','STATUS','REQUESTED RESPONSE','DRAWING REFERENCE'],[
      ['01','Duct through partition','MEP / ARCH','OPEN','Show opening and sleeve.','X101 / corridor-east'],
      ['02','Diffuser / lighting clearance','MEP / ELEC','OPEN','Coordinate ceiling layout.','X101 / meeting103'],
      ['03','Tray penetration','ELEC / ARCH','OPEN','Add penetration detail.','X101 / admin106']],48,12)
    sh.notes(100,1150,'DEMONSTRATION WORKFLOW',['Review the3issues; add clouds or callouts; assign subjects, status and responsibility; export the Markup Table. Existing sticky notes remain editable PDF annotations.','Use the layer panel to isolate architecture, mechanical, electrical and issue indicators. Save a working copy before a demonstration.'],2110,15)
    for x,title,number in [(100,'DUCT / PARTITION INTERFACE','01'),(840,'CEILING SERVICE ZONE','02'),(1580,'TRAY / WALL PENETRATION','03')]:
        sh.panel(x,320,650,650,title,number,'DIAGRAM - NOT TO SCALE')
        sh.rect(x+70,430,55,430,1.3,fill=PALE);sh.hatch(x+70,430,55,430,10)
        sh.rect(x+20,655,390,60,2,color=HexColor('#36748a') if number=='01' else INK)
        sh.line(x+20,685,x+410,685,.7,dash=[8,4])
        if number=='02':
            sh.symbol('diffuser',x+290,770,size=70);sh.symbol('light',x+335,770,size=70)
        if number=='03':
            sh.rect(x+30,677,360,16,.8);sh.rect(x+55,640,85,90,.7)
        sh.leader(x+100,685,x+235,545,'REVIEW REQUIRED',12)
        sh.text(x+45,910,'ISSUE '+number,17,bold=True)
        sh.text(x+45,378,'INTENTIONAL COORDINATION EXAMPLE',11,color=GRAY)
    r=d.finish();r['facts']={'native_review_notes':3,'layers':['Architecture','Mechanical','Electrical','Review issues'],'intentional_issues':3};return r

def build(out): return architecture(out)+[interiors(out),coordination(out)]
