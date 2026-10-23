"""Original coordinated MEP demonstration drawings for Willow Creek.

All geometry is owned, synthetic vector artwork. The plans use exactly
18 PDF points per foot. Detail diagrams are explicitly not to scale.
"""
from math import hypot
from common import Document, Sheet, pt, W, H, OX, OY, S, INK, GRAY, PALE, ACCENT, ROOMS
from reportlab.lib.colors import HexColor

WHITE = HexColor('#ffffff')


def route(sh, points, width=1.2, dash=None, color=INK):
    """Draw a feet-coordinate route and return its developed length in feet."""
    sh.polyline([pt(x, y) for x, y in points], width, color, dash=dash)
    return sum(hypot(b[0]-a[0], b[1]-a[1]) for a, b in zip(points, points[1:]))


def room_tags(sh, omit=()):
    for number, name, x, y, w, h in ROOMS:
        if number in omit:
            continue
        if number == '111':
            sh.text(*pt(1.3, 34.4), '111 / CORRIDOR', 10, bold=True, color=GRAY)
        else:
            sh.text(*pt(x+1.3, y+h-1.8), f'{number} / {name}', 9, bold=True, color=GRAY)


def bubble(sh, x, y, number, sheet):
    xx, yy = pt(x, y)
    sh.circle(xx, yy, 24, 1.1, fill=WHITE)
    sh.line(xx-23, yy, xx+23, yy, .7)
    sh.text(xx, yy+6, number, 12, bold=True, align='center')
    sh.text(xx, yy-15, sheet, 10, align='center')
    sh.c.linkRect(f'Detail {number} on {sheet}', 'page2',
                  (xx-25, yy-25, xx+25, yy+25), relative=0, thickness=0)


def pipe_label(sh, x, y, value, size=11, align='left'):
    xx, yy = pt(x, y)
    w = len(value)*size*.62+12
    offset = 0 if align == 'left' else -w/2
    sh.rect(xx+offset-4, yy-4, w, size+8, 0, fill=WHITE)
    sh.text(xx, yy, value, size, bold=True, align=align)


def detail_panel(sh, x, y, w, h, number, title, scale='DIAGRAM / NOT TO SCALE'):
    sh.rect(x, y, w, h, .65, color=GRAY)
    sh.circle(x+28, y+h-32, 17, 1)
    sh.text(x+28, y+h-37, number, 13, bold=True, align='center')
    sh.text(x+58, y+h-28, title, 16, bold=True)
    sh.text(x+58, y+h-48, scale, 10, color=GRAY)
    sh.line(x+14, y+h-65, x+w-14, y+h-65, .65, GRAY)


def arrow(sh, x, y, angle=0, size=10, color=INK):
    c=sh.c;c.saveState();c.translate(x,y);c.rotate(angle)
    Sheet(c).polyline([(-size, size*.5),(0,0),(-size,-size*.5)],1,color)
    c.restoreState()


def return_grille(sh, x, y, tag=None):
    xx, yy=pt(x,y)
    sh.rect(xx-23, yy-12, 46, 24, 1.1, fill=WHITE)
    for t in range(-16, 20, 6): sh.line(xx+t, yy-10, xx+t, yy+10,.65)
    if tag:sh.text(xx, yy-33, tag, 10, align='center')


def valve(sh, x, y, size=9, vertical=False):
    c=sh.c;c.saveState();c.translate(x,y)
    if vertical:c.rotate(90)
    Sheet(c).polyline([(-size,-size),(size,size),(size,-size),(-size,size)],.9,close=True,fill=WHITE)
    c.restoreState()


def equipment(sh, x, y, w, h, tag, subtitle=None):
    xx,yy=pt(x,y)
    sh.rect(xx,yy,w*S,h*S,1.5,fill=WHITE)
    sh.hatch(xx+3,yy+3,w*S-6,h*S-6,18,PALE)
    sh.text(xx+w*S/2,yy+h*S/2+3,tag,12,bold=True,align='center')
    if subtitle:sh.text(xx+w*S/2,yy+h*S/2-15,subtitle,9,align='center')


def draw_duct(sh, points, half_width=8, dash=None, color=INK):
    """Orthogonal duct route, expressed in feet; two visible duct edges."""
    coords=[pt(x,y) for x,y in points]
    for (x1,y1),(x2,y2) in zip(coords,coords[1:]):
        if abs(y2-y1)<.01:
            sh.line(x1,y1-half_width,x2,y2-half_width,1.1,color,dash)
            sh.line(x1,y1+half_width,x2,y2+half_width,1.1,color,dash)
        else:
            sh.line(x1-half_width,y1,x2-half_width,y2,1.1,color,dash)
            sh.line(x1+half_width,y1,x2+half_width,y2,1.1,color,dash)
    return sum(hypot(b[0]-a[0],b[1]-a[1]) for a,b in zip(points,points[1:]))


def mechanical(out):
    doc=Document(out,'05-Mechanical-HVAC.pdf','Mechanical HVAC plans and details')
    sh=doc.sheet('M101','HVAC DISTRIBUTION PLAN','1/4 IN = 1 FT',discipline='MECHANICAL / HVAC')
    sh.plan_base(labels=False,faint=True);room_tags(sh)
    # Main supply trunk and room branches. Centerline lengths are exact.
    trunk=[(78,17),(78,30),(12,30)]
    trunk_length=draw_duct(sh,trunk,12)
    draw_duct(sh,[(78,30),(90,30)],12)
    pipe_label(sh,42,31.3,'24 x 14 SA / 2,400 CFM')
    upper=[]
    for center in (12,36,60,84):
        draw_duct(sh,[(center,30),(center,49)],7)
        draw_duct(sh,[(center-4,49),(center+4,49)],5)
        for x in (center-4,center+4):upper.append((x,49,200))
        pipe_label(sh,center+.7,39,'12 x 8',9)
        xx,yy=pt(center,37.4);valve(sh,xx,yy,7,True)
    lower=[]
    for center,cfm in ((12,150),(36,125)):
        draw_duct(sh,[(center,30),(center,12)],7)
        draw_duct(sh,[(center-4,12),(center+4,12)],5)
        for x in (center-4,center+4):lower.append((x,12,cfm))
        pipe_label(sh,center+.8,19,'10 x 8',9)
    for x,cfm in ((54,50),(66,50),(78,100),(90,50)):
        # Mechanical supply branch runs clear of the AHU footprint.
        branch_x=x if x!=78 else 80.4
        draw_duct(sh,[(branch_x,30),(branch_x,9),(x,9)],4)
        lower.append((x,9,cfm))
    diffusers=upper+lower
    for i,(x,y,cfm) in enumerate(diffusers,1):
        sh.symbol('diffuser',*pt(x,y),size=30)
        sh.text(*pt(x,y-2.2),f'SD-{i:02d} / {cfm}',10,align='center')
    # Separate return-air pathway, with six independently countable grilles.
    route(sh,[(12,27),(75,27),(75,17)],1.1,[10,5])
    returns=[(20,40),(44,40),(68,40),(92,40),(20,20),(44,20)]
    for i,(x,y) in enumerate(returns,1):
        route(sh,[(x,27),(x,y)],.9,[10,5])
        return_grille(sh,x,y,f'RG-{i:02d}')
    pipe_label(sh,27,25.2,'RETURN AIR ABOVE CEILING',9)
    # Two toilet exhaust terminals with an independent exhaust manifold.
    route(sh,[(54,16),(54,22),(66,22),(66,16)],1.1,[3,3])
    route(sh,[(60,22),(60,26)],1.1,[3,3])
    for i,x in enumerate((54,66),1):
        xx,yy=pt(x,16);sh.circle(xx,yy,15,1,fill=WHITE)
        sh.text(xx,yy-4,'EG',9,bold=True,align='center')
        sh.text(xx,yy-32,f'EG-{i:02d} / 75',9,align='center')
    sh.circle(*pt(60,26),15,1,fill=WHITE);sh.text(*pt(60,25.75),'EF',8,bold=True,align='center')
    equipment(sh,74.8,14,6.4,4,'AHU-1','2,400 CFM')
    bubble(sh,83.5,17,'1','M501')
    sh.leader(*pt(78,18),*pt(84,20),'SERVICE CLEARANCE',10)
    sh.text(180,1513,'1  /  HVAC FLOOR PLAN',20,bold=True)
    sh.text(180,1488,'SUPPLY AIR, RETURN AIR AND TOILET EXHAUST / CEILING SERVICES',12,color=GRAY)
    sh.notes(1990,1380,'MECHANICAL KEYNOTES',[
        '01  Coordinate overhead services with ceiling grid and structure.',
        '02  Provide balancing damper at each supply branch; valve-like symbol denotes damper.',
        '03  Return grilles use ceiling plenum and a ducted return connection at AHU-1.',
        '04  Toilet exhaust manifold connects to roof-mounted EF-1. Provide accessible backdraft damper.',
        '05  AHU-1 is drawn with a nominal service zone. See linked detail 1/M501.',
        '06  All values are invented demonstration data. They are not a verified equipment selection.'
    ],270,11)
    sh.notes(1990,770,'PLAN SYMBOLS',[],270,11)
    symbols=[('diffuser','SUPPLY DIFFUSER'),('return','RETURN GRILLE'),('exhaust','EXHAUST TERMINAL')]
    for y,(kind,label) in zip((702,648,594),symbols):
        if kind=='diffuser':sh.symbol('diffuser',2010,y,size=25)
        elif kind=='return':
            sh.rect(1987,y-10,46,20,.9)
            for xx in range(1993,2028,6):sh.line(xx,y-8,xx,y+8,.5)
        else:sh.circle(2010,y,13,.9);sh.text(2010,y-4,'EG',8,align='center')
        sh.text(2049,y-4,label,10)
    sh.line(1990,548,2030,548,1.1);sh.text(2049,544,'SUPPLY DUCT',10)
    sh.line(1990,506,2030,506,1.1,INK,[10,5]);sh.text(2049,502,'RETURN PATH',10)
    sh.line(1990,464,2030,464,1.1,INK,[3,3]);sh.text(2049,460,'EXHAUST DUCT',10)
    sh.notes(1990,402,'COUNTING EXERCISE',[
        'Plan: 16 supply diffusers, 6 return grilles, 2 exhaust terminals.',
        'Legend adds one example of each terminal symbol. Restrict count selection to the plan.',
        'Calibrate using the 20 FT graphic scale: exactly 360 PDF points.'
    ],270,10)
    sh.text(760,214,'TRUNK CENTERLINE: 79.00 FT / AHU CONNECTION TO WEST BRANCH',11,bold=True)
    # Sheet M501: drafted details, schedule and routing logic.
    sh=doc.sheet('M501','HVAC DETAILS AND SCHEDULES','AS NOTED',discipline='MECHANICAL / HVAC')
    detail_panel(sh,180,930,800,550,'1','AIR HANDLER CONNECTION DETAIL')
    # Air handler section with coil, fan, filter, flexible connections and service arrows.
    sh.rect(330,1133,410,160,1.8)
    for x in (420,514,610):sh.line(x,1133,x,1293,1)
    sh.hatch(346,1148,45,130,12,GRAY);sh.text(375,1310,'FILTER',11,align='center')
    for x in range(455,495,10):sh.line(x,1150,x,1275,.7)
    sh.text(473,1310,'COIL',11,align='center')
    sh.circle(560,1212,43,1.2)
    for ang in ((560,1212,589,1241),(560,1212,580,1178),(560,1212,526,1203)):
        sh.line(*ang,1.2)
    sh.text(560,1310,'FAN',11,align='center')
    sh.text(671,1207,'SA',19,bold=True,align='center')
    for x in (740,767):sh.line(x,1190,x,1250,1.1)
    sh.polyline([(744,1190),(752,1200),(744,1210),(752,1220),(744,1230),(752,1240),(744,1250)],.9)
    sh.line(767,1190,917,1190,1.2);sh.line(767,1250,917,1250,1.2)
    arrow(sh,883,1220);sh.text(835,1272,'SUPPLY DUCT',11,align='center')
    sh.line(205,1190,330,1190,1.2,INK,[10,5]);sh.line(205,1250,330,1250,1.2,INK,[10,5])
    arrow(sh,300,1220);sh.text(267,1272,'RETURN',11,align='center')
    sh.rect(330,1120,410,13,1,fill=PALE)
    sh.line(300,1070,770,1070,.8,GRAY);arrow(sh,300,1070,180);arrow(sh,770,1070)
    sh.text(535,1048,'MAINTENANCE ACCESS ZONE / VERIFY WITH SELECTED UNIT',10,align='center')
    sh.text(200,988,'Flexible duct connector at discharge. Vibration pads below unit.',11)
    sh.text(200,965,'Condensate trap and cleanout at coil drain; route to indirect receptor.',11)
    detail_panel(sh,1070,930,800,550,'2','SUPPLY DIFFUSER / BRANCH CONNECTION')
    sh.line(1130,1240,1810,1240,1.5);sh.line(1130,1280,1810,1280,1.5)
    sh.text(1150,1314,'RECTANGULAR SUPPLY MAIN',11,bold=True)
    sh.line(1450,1240,1450,1170,1.2);sh.line(1480,1240,1480,1170,1.2)
    valve(sh,1465,1200,11,True)
    sh.polyline([(1450,1170),(1410,1130),(1450,1090),(1410,1050)],1)
    sh.polyline([(1480,1170),(1440,1130),(1480,1090),(1440,1050)],1)
    sh.rect(1380,1018,100,30,1.1,fill=WHITE)
    sh.line(1130,1033,1380,1033,.7,GRAY);sh.line(1480,1033,1810,1033,.7,GRAY)
    sh.text(1180,1010,'SUSPENDED CEILING',10)
    sh.text(1530,1074,'SD TYPE A',12,bold=True)
    sh.leader(1465,1200,1530,1200,'BALANCING DAMPER',11)
    sh.leader(1430,1115,1530,1144,'INSULATED FLEXIBLE RUN',11)
    sh.text(1090,964,'Keep flex bends smooth. Final neck size by demonstration schedule below.',11)
    detail_panel(sh,180,310,800,530,'3','TERMINAL / EQUIPMENT SCHEDULE','SCHEDULE / NOT TO SCALE')
    sh.table(200,744,[104,130,90,90,112,218],
        ['TYPE','DESCRIPTION','QTY','CFM/EA','NECK','NOTES'],[
            ['SD-A','SUPPLY','8','200','8 IN','ROOMS 101-104'],
            ['SD-B','SUPPLY','2','150','8 IN','LOBBY 105'],
            ['SD-C','SUPPLY','2','125','6 IN','ADMIN 106'],
            ['SD-D','SUPPLY','3','50','6 IN','107, 108, 110'],
            ['SD-E','SUPPLY','1','100','6 IN','MECHANICAL 109'],
            ['RG-A','RETURN','6','VARIES','12 x 6','CEILING GRILLE'],
            ['EG-A','EXHAUST','2','75','6 IN','RESTROOMS'],
            ['AHU-1','AIR HANDLER','1','2,400','N/A','SEE DETAIL 1'],
            ['EF-1','EXHAUST FAN','1','150','N/A','ROOF MOUNTED'],
        ],row_h=34,size=10)
    sh.text(200,374,'SUPPLY TOTAL: 2,400 CFM / 16 DIFFUSERS / 9 DEMO SCHEDULE ROWS',11,bold=True)
    sh.text(200,349,'CFM = cubic feet per minute. Table quantities refer to plan symbols only.',10)
    detail_panel(sh,1070,310,800,530,'4','DUCT ROUTING / SYSTEM SCHEMATIC')
    sh.rect(1408,576,112,75,1.1,fill=PALE);sh.text(1464,615,'AHU-1',14,bold=True,align='center')
    sh.text(1464,594,'2,400 CFM',10,align='center')
    sh.polyline([(1520,614),(1740,614),(1740,742)],1.5);arrow(sh,1740,712,90)
    sh.text(1640,636,'SUPPLY',12,bold=True)
    sh.line(1130,742,1790,742,1.4)
    for x,tag in [(1190,'101'),(1320,'102'),(1450,'103'),(1580,'104')]:
        sh.line(x,742,x,687,1);sh.rect(x-30,668,60,20,1);sh.text(x,652,tag,10,align='center')
    sh.polyline([(1190,538),(1190,612),(1408,612)],1.1,INK,dash=[10,5]);arrow(sh,1380,612)
    sh.text(1200,564,'RETURN PLENUM',10)
    sh.line(1130,462,1760,462,1.1,INK,[3,3])
    sh.rect(1510,439,75,46,1,fill=WHITE);sh.text(1547,456,'EF-1',12,bold=True,align='center')
    for x,tag in [(1250,'107'),(1410,'108')]:
        sh.line(x,462,x,410,.9,INK,[3,3]);sh.circle(x,399,12,1);sh.text(x,373,tag,10,align='center')
    arrow(sh,1740,462);sh.text(1660,484,'TO OUTSIDE',10)
    sh.notes(1990,1480,'DETAIL NOTES',[
        'Details are diagrams, not scaled equipment fabrication drawings.',
        'All equipment tags, terminal quantities and flows are coordinated with M101.',
        'The 79 FT trunk example follows AHU-1 at (78,17) to (78,30) then (12,30).',
        'Branch dimensions denote nominal duct sections in inches.',
        'Use PDF selection, markups, hyperlinks and schedule extraction to demonstrate workflows.'
    ],270,11)
    sh.notes(1990,950,'CALIBRATION REMINDER',[
        'M101 floor plan is 1/4 IN = 1 FT on a 36 x 24 IN page.',
        'M501 details and schematics are NTS; do not use plan calibration to measure them.'
    ],270,11)
    result=doc.finish()
    result['facts']={
        'plan_sheet':'M101','detail_sheet':'M501','plan_scale_points_per_foot':18,
        'calibration_length_ft':20,'calibration_length_pdf_points':360,
        'plan_diffusers':16,'legend_diffusers':1,'plan_return_grilles':6,
        'legend_return_grilles':1,'plan_exhaust_terminals':2,'legend_exhaust_terminals':1,
        'supply_total_cfm':sum(t[2] for t in diffusers),'ahu_count':1,'exhaust_fan_count':1,
        'supply_trunk_centerline_ft':trunk_length,'supply_trunk_vertices_ft':trunk,
        'diffuser_positions_ft':[(x,y) for x,y,_ in diffusers],
        'schedule_rows':9,'hyperlinked_detail_callouts':1,
    }
    return result


def switch(sh,x,y,tag=None):
    xx,yy=pt(x,y);sh.circle(xx,yy,10,1,fill=WHITE);sh.text(xx,yy-4,'S',10,bold=True,align='center')
    if tag:sh.text(xx+16,yy-4,tag,9)


def electrical(out):
    doc=Document(out,'06-Electrical-Lighting-and-Power.pdf','Electrical lighting and power')
    sh=doc.sheet('E101','LIGHTING AND RECEPTACLE PLAN','1/4 IN = 1 FT',discipline='ELECTRICAL / POWER')
    sh.plan_base(labels=False,faint=True);room_tags(sh)
    lights=[]
    for room,x in enumerate((0,24,48,72),101):
        for yy in (43,54):
            for xx in (x+6,x+18):lights.append((xx,yy,room))
    lights += [(7,12,105),(17,12,105),(31,12,106),(41,12,106),
               (54,12,107),(66,12,108),(78,10,109),(90,12,110)]
    # Lighting circuit centerlines are schematic control wiring in the ceiling.
    lighting_routes=[]
    for center in (12,36,60,84):
        p=[(center,32),(center,40),(center-6,40),(center-6,54),(center+6,54),(center+6,43)]
        lighting_routes.append(p);route(sh,p,.9,[5,4])
        switch(sh,center-2.8,37.2,'a')
    for x1,x2 in ((7,17),(31,41)):
        p=[((x1+x2)/2,26),((x1+x2)/2,15),(x1,15),(x1,12),(x2,12)]
        lighting_routes.append(p);route(sh,p,.9,[5,4]);switch(sh,(x1+x2)/2-2.8,22.5,'b')
    for x,y,_ in lights[20:]:
        p=[(x,26),(x,y)];lighting_routes.append(p);route(sh,p,.9,[5,4]);switch(sh,x-1.8,20.5,'c')
    emergency={1,13,17,24}
    for i,(x,y,room) in enumerate(lights,1):
        sh.symbol('light',*pt(x,y),size=32)
        sh.text(*pt(x,y-1.8),f'L-{i:02d}'+(' / E' if i in emergency else ''),10,align='center')
        if i in emergency:
            xx,yy=pt(x,y);sh.circle(xx+32,yy+14,6,.7,fill=INK)
    receptacles=[]
    for x in (0,24,48,72):
        receptacles.extend([(x+2,46,'A'),(x+22,46,'A'),(x+12,58,'A')])
    receptacles.extend([(2,8,'B'),(22,8,'B'),(26,8,'B'),(46,8,'B'),(49.5,18,'G'),(61.5,18,'G')])
    # Each room's circuit links its own receptacles; home-run arrows point to LP-1.
    for k in range(4):
        a,b,c=receptacles[k*3:k*3+3]
        route(sh,[(a[0],a[1]),(a[0],56),(c[0],56),(b[0],56),(b[0],b[1])],.75,[2,5])
    for i,(x,y,typ) in enumerate(receptacles,1):
        sh.symbol('receptacle',*pt(x,y),size=23)
        sh.text(*pt(x+.15,y-1.8),f'R-{i:02d}'+(' G' if typ=='G' else ''),9,align='center')
    # LP-1 at the east wall of the office and one traceable corridor home run.
    equipment(sh,45,17,2,4,'LP-1')
    p=[(46,21),(46,29),(84,29)]
    home_run_length=route(sh,p,1.2,[7,4])
    arrow(sh,*pt(82.8,29),180)
    pipe_label(sh,58,27.5,'LP-1 / CKTS 1, 3, 5, 7',10)
    route(sh,[(46,21),(46,26),(12,26)],1.2,[7,4]);arrow(sh,*pt(13.2,26))
    pipe_label(sh,22,27.1,'LP-1 / CKTS 2, 4, 6',10)
    bubble(sh,40,19.5,'1','E601')
    sh.text(180,1513,'1  /  ELECTRICAL FLOOR PLAN',20,bold=True)
    sh.text(180,1488,'LIGHTING, SWITCHING AND GENERAL RECEPTACLE DISTRIBUTION',12,color=GRAY)
    sh.notes(1990,1380,'ELECTRICAL KEYNOTES',[
        '01  L-01 through L-24 are ceiling luminaires. E denotes an illustrative emergency battery unit.',
        '02  Match switching zones to room entrances. Dashed wiring is a circuit diagram, not conduit length.',
        '03  General receptacles are tagged R-01 through R-18. G identifies sample GFCI devices.',
        '04  LP-1 is a sample 120/208 V, 3-phase panel. See linked one-line and schedule E601.',
        '05  Dedicated mechanical loads use separate hardwired connections; not included in receptacle count.',
        '06  Conductor sizes and protective devices are fictional demonstration selections.'
    ],270,11)
    sh.notes(1990,750,'PLAN SYMBOLS',[],270,11)
    for y,kind,label in ((690,'light','CEILING LUMINAIRE'),(632,'receptacle','RECEPTACLE')):
        sh.symbol(kind,2010,y,size=27);sh.text(2050,y-4,label,10)
    sh.circle(2010,574,10,1);sh.text(2010,570,'S',10,bold=True,align='center');sh.text(2050,570,'ROOM SWITCH',10)
    sh.circle(2010,516,6,.7,fill=INK);sh.text(2050,512,'EMERGENCY BATTERY',10)
    sh.line(1990,462,2030,462,.9,INK,[5,4]);sh.text(2050,458,'LIGHTING CIRCUIT',10)
    sh.line(1990,414,2030,414,.9,INK,[2,5]);sh.text(2050,410,'POWER CIRCUIT',10)
    sh.notes(1990,356,'COUNTING EXERCISE',[
        'Plan: 24 luminaires including 4 E units; 18 receptacles including 2 G devices.',
        'Legend adds one luminaire and one receptacle. Count inside the plan boundary.',
        '20 FT calibration segment = 360 PDF points.'
    ],270,10)
    sh.text(760,214,'DEMO HOME RUN: 46.00 FT CENTERLINE / FROM LP-1 TO EAST CORRIDOR',11,bold=True)
    sh=doc.sheet('E601','ELECTRICAL DETAILS AND SCHEDULES','AS NOTED',discipline='ELECTRICAL / POWER')
    detail_panel(sh,180,930,800,550,'1','POWER DISTRIBUTION ONE-LINE')
    sh.text(245,1370,'ILLUSTRATIVE SERVICE / 120/208 V, 3-PHASE, 4-WIRE',12,bold=True)
    sh.line(300,1290,850,1290,1.8)
    sh.rect(450,1247,90,86,1.2,fill=WHITE);sh.text(495,1290,'M',23,bold=True,align='center');sh.text(495,1224,'METER',11,align='center')
    sh.line(670,1290,670,1200,1.5);valve(sh,670,1220,12,True)
    sh.rect(607,1102,126,95,1.3,fill=PALE);sh.text(670,1152,'MDP-1',17,bold=True,align='center');sh.text(670,1130,'200 A',12,align='center')
    sh.line(670,1102,670,1053,1.5);sh.line(375,1053,840,1053,1.5)
    for x,tag,rating in ((375,'LP-1','100 A'),(590,'AHU-1','30 A'),(840,'EF-1','20 A')):
        sh.line(x,1053,x,1007,1.2);sh.rect(x-55,967,110,40,1,fill=WHITE)
        sh.text(x,982,tag,12,bold=True,align='center');sh.text(x,941,rating,10,align='center')
    sh.text(220,1172,'SERVICE DISCONNECT',11)
    sh.line(440,1169,607,1169,.8);arrow(sh,601,1169)
    detail_panel(sh,1070,930,800,550,'2','LIGHTING / RECEPTACLE DEVICE DETAILS')
    sh.rect(1160,1172,230,116,1.2);sh.line(1160,1172,1390,1288,.8)
    sh.circle(1372,1304,7,1,fill=INK)
    sh.text(1275,1320,'LT-A / LT-E',12,bold=True,align='center')
    sh.line(1120,1155,1430,1155,.8,GRAY);sh.text(1275,1124,'RECESSED CEILING LUMINAIRE',11,align='center')
    sh.text(1120,1096,'LT-E includes integral emergency battery.',11)
    sh.rect(1550,1124,115,170,1)
    for y in (1170,1247):
        sh.circle(1607,y,26,.9)
        sh.line(1597,y-9,1597,y+11,1);sh.line(1617,y-9,1617,y+11,1)
        sh.circle(1607,y-14,3,.7)
    sh.text(1607,1320,'DUPLEX DEVICE',12,bold=True,align='center')
    sh.line(1607,1116,1607,1068,.7);sh.text(1607,1048,'TYPICAL WALL BOX',10,align='center')
    sh.text(1100,994,'Symbols on E101 are diagrammatic. Detail sizes are intentionally NTS.',11)
    sh.text(1100,970,'G mark identifies the two GFCI demonstration receptacles in restrooms.',11)
    detail_panel(sh,180,310,800,530,'3','LP-1 DEMONSTRATION CIRCUIT SCHEDULE','SCHEDULE / NOT TO SCALE')
    sh.table(200,744,[60,235,75,95,115,164],
             ['CKT','LOAD DESCRIPTION','POLE','BREAKER','VA','ZONE'],[
        ['1','LIGHTING LT-A','1','20 A','720','101 / 102'],
        ['2','LIGHTING LT-A','1','20 A','720','103 / 104'],
        ['3','LIGHTING LT-A/E','1','20 A','720','105-110'],
        ['4','GEN RECEPTACLES','1','20 A','1,440','101 / 102'],
        ['5','GEN RECEPTACLES','1','20 A','1,440','103 / 104'],
        ['6','GEN RECEPTACLES','1','20 A','960','105 / 106'],
        ['7','GFCI RECEPTACLES','1','20 A','480','107 / 108'],
        ['8','SPARE','1','20 A','0','AVAILABLE'],
        ['9','SPARE','1','20 A','0','AVAILABLE'],
    ],row_h=34,size=10)
    sh.text(200,374,'DEMONSTRATION CONNECTED LOAD: 6,480 VA / NO DEMAND APPLIED',11,bold=True)
    sh.text(200,349,'Invented values support table extraction and review; not a load calculation.',10)
    detail_panel(sh,1070,310,800,530,'4','FIXTURE AND DEVICE SCHEDULE','SCHEDULE / NOT TO SCALE')
    sh.table(1090,744,[90,250,90,140,190],
             ['TYPE','DESCRIPTION','QTY','RATING','MOUNTING'],[
        ['LT-A','STANDARD LED TROFFER','20','90 VA','CEILING'],
        ['LT-E','LED WITH EM BATTERY','4','90 VA','CEILING'],
        ['REC-A','DUPLEX RECEPTACLE','16','240 VA','WALL'],
        ['REC-G','GFCI DUPLEX','2','240 VA','WALL'],
        ['SW-A','ROOM SWITCH','10','N/A','WALL'],
        ['LP-1','BRANCH CIRCUIT PANEL','1','100 A','SURFACE'],
    ],row_h=44,size=10)
    sh.notes(1100,410,'TAG CONVENTIONS',[
        'L-01 to L-24: individual luminaires; E suffix flags a battery unit.',
        'R-01 to R-18: individual receptacles; G suffix flags GFCI.',
        'Circuit labels are examples for annotation and search demonstrations.'
    ],740,11)
    sh.notes(1990,1480,'ELECTRICAL NOTES',[
        'Diagrams and schedules are explicitly not to scale.',
        '24 luminaires: 20 standard and 4 with integral emergency battery.',
        '18 receptacles: 16 general and 2 GFCI. Ten room switches are shown.',
        'The selected 46 FT route connects (46,21) to (46,29) to (84,29).',
        'The table total is arithmetic demonstration data; design loads have not been verified.'
    ],270,11)
    sh.notes(1990,970,'DEMO WORKFLOWS',[
        'Count tagged symbols in the plan.',
        'Compare device counts with E601 schedules.',
        'Trace a circuit, mark conflicts, hyperlink a detail, and extract a schedule.'
    ],270,11)
    result=doc.finish()
    result['facts']={
        'plan_sheet':'E101','detail_sheet':'E601','plan_scale_points_per_foot':18,
        'calibration_length_ft':20,'calibration_length_pdf_points':360,
        'plan_luminaires':24,'legend_luminaires':1,'emergency_luminaires':4,
        'plan_receptacles':18,'legend_receptacles':1,'gfci_receptacles':2,
        'plan_switches':10,'legend_switches':1,'panel_count':1,
        'home_run_centerline_ft':home_run_length,'home_run_vertices_ft':p,
        'luminaire_positions_ft':[(x,y) for x,y,_ in lights],
        'receptacle_positions_ft':[(x,y) for x,y,_ in receptacles],
        'connected_load_va':6480,'panel_schedule_rows':9,'device_schedule_rows':6,
        'hyperlinked_detail_callouts':1,
    }
    return result


def plumbing(out):
    doc=Document(out,'07-Plumbing-Water-and-Drainage.pdf','Plumbing water and drainage')
    sh=doc.sheet('P101','WATER AND DRAINAGE PLAN','1/4 IN = 1 FT',discipline='PLUMBING / SANITARY')
    sh.plan_base(labels=False,faint=True);room_tags(sh, omit=('107','108','109'))
    # Wet-room identifiers sit below the plan, clear of overhead valves and vents.
    for x, value in ((54,'107 / RESTROOM A'),(66,'108 / RESTROOM B'),(78,'109 / MECHANICAL')):
        xx,yy=pt(x,-1.7)
        sh.line(*pt(x,-.25),*pt(x,-1),.55,GRAY)
        sh.text(xx,yy,value,9,bold=True,color=GRAY,align='center')
    # Toilet stalls are coordinated with rooms 107 and 108, without furnishing other rooms.
    for start in (48,60):
        for x in (start+4,start+8):sh.line(*pt(x,2),*pt(x,11.5),.7,GRAY)
        sh.line(*pt(start+.5,11.5),*pt(start+11.5,11.5),.7,GRAY)
        for x in (start+1,start+5,start+9):
            sh.line(*pt(x,11.5),*pt(x+2,11.5),4,WHITE)
            sh.line(*pt(x,11.5),*pt(x+1.7,9.8),.7,GRAY)
    wcs=[(50,6.5),(54,6.5),(58,6.5),(62,6.5),(66,6.5),(70,6.5)]
    lavs=[(51,18.5),(57,18.5),(63,18.5),(69,18.5)]
    drains=[(55,13),(67,13),(75,8),(81,8)]
    sanitary=[(49,3),(81,3)]
    main_length=route(sh,sanitary,2.1)
    for x,y in wcs:route(sh,[(x,y),(x,3)],1.2)
    for x,y in lavs:route(sh,[(x,y),(x,15.5),(x+1,15.5),(x+1,3)],1)
    for x,y in drains:route(sh,[(x,y),(x,3)],1.2)
    route(sh,[(81,3),(81,0)],2.1)
    arrow(sh,*pt(77,3),0,12);pipe_label(sh,56,1.2,'4 IN SAN / 32.00 FT MAIN',10)
    # The cold water main uses an exact 40 FT path; hot water is an adjacent distinct trace.
    cw=[(78,17),(78,28),(49,28)]
    cw_length=route(sh,cw,1.3,[9,4])
    route(sh,[(77,17),(77,26.8),(49,26.8)],1.1,[2,3])
    pipe_label(sh,53,29.4,'1 IN CW / 40.00 FT MAIN',10)
    pipe_label(sh,53,25.2,'3/4 IN HW',10)
    for center in (54,66):
        route(sh,[(center,28),(center,23),(center-4,23),(center-4,8.5)],1,[9,4])
        route(sh,[(center-4,8.5),(center+4,8.5)],1,[9,4])
        for x in (center-4,center,center+4):route(sh,[(x,8.5),(x,6.5)],.9,[9,4])
    for x,y in lavs:
        route(sh,[(x,28),(x,y)],.9,[9,4])
        route(sh,[(x+.7,26.8),(x+.7,y)],.9,[2,3])
        valve(sh,*pt(x,22),6,True)
    # Vents, cleanouts and two nominal mechanical floor-drain connections.
    for x in (52,64):
        route(sh,[(x,15.5),(x,21.5)],.85,[12,3,2,3])
        xx,yy=pt(x,21.5);sh.polyline([(xx-8,yy),(xx,yy+13),(xx+8,yy)],.8,close=True,fill=WHITE)
        sh.text(xx+15,yy+2,'2 IN VTR',9)
    for x in (49,81):
        xx,yy=pt(x,3);sh.circle(xx,yy,11,.9,fill=WHITE);sh.text(xx,yy-3,'CO',7,bold=True,align='center')
    for i,(x,y) in enumerate(wcs,1):sh.symbol('wc',*pt(x,y),size=34);sh.text(*pt(x,y-2.2),f'WC-{i:02d}',9,align='center')
    for i,(x,y) in enumerate(lavs,1):sh.symbol('lav',*pt(x,y),size=31);sh.text(*pt(x,y-2),f'LAV-{i:02d}',9,align='center')
    for i,(x,y) in enumerate(drains,1):sh.symbol('drain',*pt(x,y),size=25);sh.text(*pt(x,y+1.3),f'FD-{i:02d}',9,align='center')
    equipment(sh,75.5,15,5,4,'WH-1','40 GAL')
    bubble(sh,84,18,'1','P501')
    sh.leader(*pt(81,0.5),*pt(85,3.7),'TO SITE SANITARY',10)
    sh.text(180,1513,'1  /  PLUMBING FLOOR PLAN',20,bold=True)
    sh.text(180,1488,'DOMESTIC COLD / HOT WATER, SANITARY DRAINAGE AND VENT ROUTING',12,color=GRAY)
    # Furnish a subtle coordination reference in the otherwise dry upper rooms.
    for x in (12,36,60,84):
        sh.text(*pt(x,47),'NO PLUMBING FIXTURES',11,color=GRAY,align='center')
    for x in (12,36,90):sh.text(*pt(x,12),'NO WET FIXTURES',10,color=GRAY,align='center')
    sh.notes(1990,1380,'PLUMBING KEYNOTES',[
        '01  Six WC and four LAV fixtures are shown in restrooms 107 and 108.',
        '02  Floor drains FD-01 and FD-02 serve restrooms. FD-03 and FD-04 serve mechanical room 109.',
        '03  Solid heavy line denotes sanitary main below slab. Water routes are above ceiling.',
        '04  Provide accessible isolation valve at lavatory branches and water heater.',
        '05  Cleanouts CO at ends of the selected main. Two 2 IN VTR locations are shown.',
        '06  Routing and nominal pipe sizes are synthetic. No hydraulic or drainage design is implied.'
    ],270,11)
    sh.notes(1990,780,'PLAN SYMBOLS',[],270,11)
    for y,kind,label in ((715,'wc','WATER CLOSET'),(658,'lav','LAVATORY'),(601,'drain','FLOOR DRAIN')):
        sh.symbol(kind,2010,y,size=25);sh.text(2050,y-4,label,10)
    for y,dash,label in ((540,None,'SANITARY'),(495,[9,4],'COLD WATER'),(450,[2,3],'HOT WATER'),(405,[12,3,2,3],'VENT')):
        sh.line(1990,y,2034,y,1.5 if dash is None else 1,INK,dash);sh.text(2050,y-4,label,10)
    sh.notes(1990,348,'COUNTING EXERCISE',[
        'Plan: 6 WC, 4 LAV and 4 FD. Legend adds one example of each.',
        'Measure the 32 FT sanitary main or the 40 FT cold-water trace.',
        '20 FT calibration segment = 360 PDF points.'
    ],270,10)
    sh.text(760,214,'SANITARY MAIN: 32.00 FT / COLD WATER MAIN: 40.00 FT CENTERLINE',11,bold=True)
    sh=doc.sheet('P501','PLUMBING DETAILS AND SCHEDULES','AS NOTED',discipline='PLUMBING / SANITARY')
    detail_panel(sh,180,930,800,550,'1','DOMESTIC WATER RISER')
    sh.line(250,1080,890,1080,1.4,INK,[9,4]);sh.text(255,1057,'1 IN COLD WATER MAIN',11,bold=True)
    sh.line(420,1320,890,1320,1.2,INK,[2,3]);sh.text(605,1340,'3/4 IN HOT WATER MAIN',11,bold=True)
    sh.rect(330,1153,135,127,1.2,fill=WHITE);sh.text(397,1223,'WH-1',17,bold=True,align='center');sh.text(397,1202,'40 GAL',12,align='center')
    sh.polyline([(397,1080),(397,1153)],1.4,INK,dash=[9,4]);valve(sh,397,1115,11,True)
    sh.polyline([(420,1280),(420,1320)],1.2,INK,dash=[2,3])
    for x,tag in ((590,'LAV GROUP'),(760,'WC GROUP')):
        sh.line(x,1080,x,1178,1.1,INK,[9,4]);valve(sh,x,1130,9,True)
        sh.rect(x-58,1180,116,48,1,fill=WHITE);sh.text(x,1200,tag,10,bold=True,align='center')
    sh.line(620,1320,620,1228,1,INK,[2,3])
    sh.polyline([(335,1280),(300,1300),(300,1358)],.9);sh.text(248,1380,'T&P RELIEF',10,bold=True)
    sh.text(235,980,'Isolation valves, temperature control and relief route shown schematically.',11)
    sh.text(235,957,'Heater capacity and pipe sizes are invented for the demonstration set.',11)
    detail_panel(sh,1070,930,800,550,'2','SANITARY / VENT RISER')
    sh.line(1130,1030,1790,1030,2);arrow(sh,1760,1030)
    sh.text(1590,1007,'4 IN SANITARY MAIN',11,bold=True)
    for x,tag in ((1210,'WC GROUP A'),(1420,'WC GROUP B'),(1670,'FLOOR DRAINS')):
        sh.line(x,1030,x,1180,1.1)
        sh.polyline([(x,1160),(x+35,1160),(x+35,1197),(x+80,1197)],1)
        sh.rect(x+64,1197,35,20,.9,fill=WHITE)
        sh.text(x+40,1232,tag,10,bold=True,align='center')
        sh.polyline([(x+35,1160),(x+35,1300)],.9,INK,dash=[12,3,2,3])
    sh.line(1245,1300,1705,1300,.9,INK,[12,3,2,3]);sh.line(1480,1300,1480,1375,.9,INK,[12,3,2,3])
    sh.polyline([(1468,1375),(1480,1395),(1492,1375)],.8,close=True,fill=WHITE)
    sh.text(1515,1364,'2 IN VENT THROUGH ROOF',11)
    for x in (1130,1790):sh.circle(x,1030,13,1,fill=WHITE);sh.text(x,1026,'CO',8,bold=True,align='center')
    sh.text(1090,978,'Branches represent grouped fixtures; plan P101 contains individual symbols.',11)
    sh.text(1090,955,'Vent loops and fittings are schematic. No drainage loading is claimed.',11)
    detail_panel(sh,180,310,800,530,'3','FIXTURE SCHEDULE','SCHEDULE / NOT TO SCALE')
    sh.table(200,744,[110,230,70,100,100,134],
             ['TAG','DESCRIPTION','QTY','CW','HW','SAN / VENT'],[
        ['WC-01/06','FLOOR WATER CLOSET','6','1/2 IN','--','3 IN / 2 IN'],
        ['LAV-01/04','WALL LAVATORY','4','1/2 IN','1/2 IN','1-1/2 / 2 IN'],
        ['FD-01/04','FLOOR DRAIN','4','--','--','2 IN / 2 IN'],
        ['WH-1','STORAGE WATER HEATER','1','1 IN','3/4 IN','INDIRECT'],
        ['CO','CLEANOUT','2','--','--','4 IN'],
        ['VTR','VENT THROUGH ROOF','2','--','--','2 IN'],
    ],row_h=44,size=10)
    sh.notes(210,406,'SCHEDULE KEY',[
        'CW = cold water; HW = hot water; SAN = sanitary; VTR = vent through roof.',
        'Fixture quantities match P101. The legend is excluded from the schedule.',
        'Nominal sizes are demonstration data and are not installation instructions.'
    ],740,11)
    detail_panel(sh,1070,310,800,530,'4','FLOOR DRAIN / CLEANOUT DETAILS')
    sh.line(1110,627,1810,627,1.2)
    sh.rect(1200,617,100,22,1.1,fill=PALE)
    for x in range(1208,1300,10):sh.line(x,620,x,636,.6)
    sh.line(1230,617,1230,547,1.2);sh.line(1270,617,1270,547,1.2)
    sh.polyline([(1230,547),(1230,508),(1250,493),(1270,508),(1270,547),(1330,547)],1.2)
    sh.polyline([(1270,547),(1300,527),(1350,527)],1.2)
    sh.text(1250,675,'FLOOR DRAIN',12,bold=True,align='center')
    sh.text(1140,575,'TRAP SEAL',10)
    sh.leader(1250,506,1130,463,'TRAP / ACCESS',10)
    sh.rect(1590,617,76,22,1.1,fill=WHITE);sh.text(1628,626,'CO',8,bold=True,align='center')
    sh.line(1610,617,1610,540,1.2);sh.line(1648,617,1648,540,1.2)
    sh.polyline([(1610,540),(1570,500),(1510,500)],1.2)
    sh.polyline([(1648,540),(1608,480),(1510,480)],1.2)
    sh.text(1628,675,'FLOOR CLEANOUT',12,bold=True,align='center')
    sh.text(1450,444,'REMOVABLE ACCESS COVER',11)
    sh.text(1090,373,'Schematic floor section. Floor line does not establish actual elevations.',11)
    sh.text(1090,349,'Detail references support hyperlink navigation and PDF markup exercises.',11)
    sh.notes(1990,1480,'PLUMBING NOTES',[
        'Details are diagrams and intentionally not to scale.',
        'P101 contains fourteen wet fixtures: six WC, four LAV and four FD.',
        'One WH-1, two cleanouts and two vent-through-roof points are separately tagged.',
        'Selected sanitary main: (49,3) to (81,3), exactly 32 FT.',
        'Selected cold main: (78,17) to (78,28) to (49,28), exactly 40 FT.'
    ],270,11)
    sh.notes(1990,930,'DEMO WORKFLOWS',[
        'Calibrate P101, trace two service routes and compare quantities with the schedule.',
        'Find WC, LAV, FD and VTR using text search.',
        'Mark a coordination issue and jump between P101 and P501.'
    ],270,11)
    result=doc.finish()
    result['facts']={
        'plan_sheet':'P101','detail_sheet':'P501','plan_scale_points_per_foot':18,
        'calibration_length_ft':20,'calibration_length_pdf_points':360,
        'plan_water_closets':6,'legend_water_closets':1,'plan_lavatories':4,'legend_lavatories':1,
        'plan_floor_drains':4,'legend_floor_drains':1,'plan_water_heaters':1,
        'plan_cleanouts':2,'plan_vent_through_roof':2,
        'sanitary_main_centerline_ft':main_length,'sanitary_main_vertices_ft':sanitary,
        'cold_water_main_centerline_ft':cw_length,'cold_water_main_vertices_ft':cw,
        'wc_positions_ft':wcs,'lavatory_positions_ft':lavs,'floor_drain_positions_ft':drains,
        'schedule_rows':6,'hyperlinked_detail_callouts':1,
    }
    return result


def fire(out):
    doc=Document(out,'08-Fire-Protection-and-Life-Safety.pdf','Fire protection and life safety')
    sh=doc.sheet('FP101','FIRE PROTECTION AND LIFE SAFETY PLAN','1/4 IN = 1 FT',discipline='FIRE PROTECTION / LIFE SAFETY')
    sh.plan_base(labels=False,faint=True);room_tags(sh)
    sprinklers=[]
    for start in (0,24,48,72):
        for y in (43,54):
            for x in (start+6,start+18):sprinklers.append((x,y))
    sprinklers += [(7,12),(17,12),(31,12),(41,12),(54,12),(66,12),(78,10),(90,12)]
    # Main from the mechanical riser, distributed along corridor centerline.
    main=[(75,17),(75,30),(6,30)]
    main_length=route(sh,main,1.8)
    route(sh,[(75,30),(90,30)],1.8)
    pipe_label(sh,39,31.2,'2-1/2 IN WET MAIN / 82.00 FT SELECTED TRACE',10)
    upper_branches=[]
    for start in (0,24,48,72):
        for x in (start+6,start+18):
            p=[(x,30),(x,54)];upper_branches.append(p);route(sh,p,1.1)
        pipe_label(sh,start+7,39.5,'1 IN BRANCH',9)
    for x,y in sprinklers[16:]:route(sh,[(x,30),(x,y)],1)
    for i,(x,y) in enumerate(sprinklers,1):
        sh.symbol('sprinkler',*pt(x,y),size=29)
        sh.text(*pt(x+.5,y-1.65),f'SP-{i:02d}',9,align='center')
    smokes=[(12,47),(36,47),(60,47),(84,47),(12,19),(48,33)]
    for i,(x,y) in enumerate(smokes,1):
        sh.symbol('smoke',*pt(x,y),size=30);sh.text(*pt(x,y-1.8),f'SD-{i:02d}',9,align='center')
    exits=[(7,27),(89,27),(21,2),(45,2)]
    for i,(x,y) in enumerate(exits,1):
        sh.symbol('exit',*pt(x,y),size=30);sh.text(*pt(x,y+1.25),f'EX-{i:02d}',9,align='center')
    # Clearly distinct demo egress paths, without claiming approved travel distances.
    egress_a=[(12,47),(9,47),(9,33),(3,33),(3,28),(0,28)]
    egress_b=[(60,47),(57,47),(57,33),(45,33),(45,0)]
    ea=route(sh,egress_a,.9,[9,3,2,3],GRAY)
    eb=route(sh,egress_b,.9,[9,3,2,3],GRAY)
    arrow(sh,*pt(0.8,28),180,10,GRAY);arrow(sh,*pt(45,1),270,10,GRAY)
    pipe_label(sh,16,34.6,'DEMO EGRESS A = 31.00 FT',9)
    pipe_label(sh,48,20,'DEMO EGRESS B = 62.00 FT',9)
    equipment(sh,73.5,14.5,3,4,'FR-1','WET RISER')
    bubble(sh,82,18,'1','FP501')
    sh.text(180,1513,'1  /  FIRE / LIFE SAFETY FLOOR PLAN',20,bold=True)
    sh.text(180,1488,'SPRINKLER DISTRIBUTION, DETECTION, EXIT SIGNS AND DEMO TRAVEL PATHS',12,color=GRAY)
    sh.notes(1990,1380,'FIRE / LIFE SAFETY NOTES',[
        '01  SP-01 through SP-24 denote overhead sprinkler heads. Coverage is illustrative only.',
        '02  SD-01 through SD-06 denote sample smoke detector positions.',
        '03  EX-01 through EX-04 denote sample exit / directional signs. Two existing exterior door locations are retained.',
        '04  FR-1 is a wet-system riser in mechanical room 109. See linked detail 1/FP501.',
        '05  Gray dash-dot paths A and B are measurement exercises; distances do not establish code compliance.',
        '06  No hazard classification, hydraulic calculation or life-safety approval is represented.'
    ],270,11)
    sh.notes(1990,750,'PLAN SYMBOLS',[],270,11)
    for y,kind,label in ((690,'sprinkler','SPRINKLER HEAD'),(632,'smoke','SMOKE DETECTOR'),(574,'exit','EXIT / DIRECTIONAL SIGN')):
        sh.symbol(kind,2010,y,size=27);sh.text(2050,y-4,label,10)
    sh.line(1990,516,2032,516,1.8);sh.text(2050,512,'SPRINKLER MAIN',10)
    sh.line(1990,464,2032,464,.9,GRAY,[9,3,2,3]);sh.text(2050,460,'DEMO EGRESS PATH',10)
    sh.notes(1990,402,'COUNTING EXERCISE',[
        'Plan: 24 sprinkler heads, 6 smoke detectors and 4 exit symbols.',
        'Legend adds one example of each. Use a bounded plan selection.',
        '20 FT calibration segment = 360 PDF points.'
    ],270,10)
    sh.text(760,214,'SELECTED WET MAIN: 82.00 FT / EGRESS A: 31.00 FT / EGRESS B: 62.00 FT',11,bold=True)
    sh=doc.sheet('FP501','FIRE PROTECTION DETAILS AND SCHEDULES','AS NOTED',discipline='FIRE PROTECTION / LIFE SAFETY')
    detail_panel(sh,180,930,800,550,'1','WET SPRINKLER RISER ASSEMBLY')
    sh.line(450,1030,450,1380,2)
    sh.line(490,1030,490,1380,2)
    sh.polyline([(450,1380),(450,1405),(860,1405)],2)
    sh.polyline([(490,1380),(490,1365),(860,1365)],2)
    sh.text(700,1380,'TO OVERHEAD WET MAIN',11,bold=True,align='center')
    valve(sh,470,1120,19,True);sh.text(565,1115,'CONTROL VALVE / TAMPER',11)
    sh.circle(470,1220,29,1.1,fill=WHITE);sh.text(470,1216,'CV',12,bold=True,align='center');sh.text(565,1215,'CHECK VALVE',11)
    sh.circle(470,1320,23,1.1,fill=WHITE);sh.text(470,1316,'FS',11,bold=True,align='center');sh.text(565,1315,'FLOW SWITCH',11)
    sh.line(490,1254,665,1254,1.1);sh.circle(677,1254,17,1);sh.text(677,1250,'P',10,bold=True,align='center');sh.text(729,1250,'PRESSURE GAUGE',10)
    sh.polyline([(490,1070),(780,1070),(780,1012)],1.1);valve(sh,691,1070,11);sh.text(620,1090,'TEST / DRAIN',10)
    sh.line(260,1030,680,1030,1,GRAY);sh.text(270,1004,'FINISHED FLOOR / DIAGRAMMATIC',10)
    sh.text(245,961,'Valve arrangement is a fictional sample. No hydraulic sizing is implied.',11)
    detail_panel(sh,1070,930,800,550,'2','HEAD / DETECTION / SIGN DETAILS')
    sh.line(1120,1280,1820,1280,.9,GRAY);sh.text(1120,1300,'SUSPENDED CEILING PLANE',11,bold=True)
    sh.line(1190,1370,1360,1370,1.3);sh.line(1320,1370,1320,1280,1.1)
    sh.rect(1300,1266,40,12,1,fill=WHITE);sh.line(1320,1266,1320,1244,1)
    sh.polyline([(1300,1242),(1320,1249),(1340,1242)],1.1)
    sh.text(1300,1188,'PENDENT HEAD',11,bold=True,align='center')
    sh.c.ellipse(1470,1242,1560,1272,stroke=1)
    sh.text(1515,1251,'SD',11,bold=True,align='center');sh.text(1515,1188,'SMOKE DETECTOR',11,bold=True,align='center')
    sh.rect(1660,1200,145,62,1.1,fill=WHITE);sh.text(1732,1220,'EXIT',27,bold=True,align='center')
    sh.line(1732,1262,1732,1280,.9);sh.text(1732,1168,'DIRECTIONAL SIGN',10,bold=True,align='center')
    sh.text(1100,1085,'Symbol proportions and attachment methods are schematic.',11)
    sh.text(1100,1058,'Final positions would require coordinated engineering and approval.',11)
    sh.text(1100,978,'The three objects here are detail illustrations, excluded from FP101 plan counts.',11)
    detail_panel(sh,180,310,800,530,'3','FIRE / LIFE SAFETY DEVICE SCHEDULE','SCHEDULE / NOT TO SCALE')
    sh.table(200,744,[90,264,70,150,170],
             ['TYPE','DESCRIPTION','QTY','TAG RANGE','LOCATION'],[
        ['SP-A','PENDENT SPRINKLER','24','SP-01 / SP-24','PLAN FP101'],
        ['SD-A','SMOKE DETECTOR','6','SD-01 / SD-06','PLAN FP101'],
        ['EX-A','EXIT / DIRECTIONAL SIGN','4','EX-01 / EX-04','PLAN FP101'],
        ['FR-1','WET SYSTEM RISER','1','FR-1','ROOM 109'],
        ['FS-1','FLOW SWITCH','1','RISER DETAIL','DETAIL 1'],
        ['TS-1','TAMPER SWITCH','1','RISER DETAIL','DETAIL 1'],
    ],row_h=42,size=10)
    sh.notes(210,415,'QUANTITY BASIS',[
        'SP-A, SD-A and EX-A quantities refer only to symbols within the FP101 plan.',
        'Legend and FP501 detail illustrations are excluded from plan takeoff.',
        'All equipment values are intentionally synthetic for demonstration use.'
    ],740,11)
    detail_panel(sh,1070,310,800,530,'4','TRACEABLE TRAVEL PATH EXERCISE','PATH DIAGRAM / NOT TO SCALE')
    sh.text(1100,742,'A: ROOM 101 TO WEST CORRIDOR EXTERIOR DOOR',12,bold=True)
    sh.polyline([(1135,697),(1260,697),(1260,597),(1420,597),(1420,530),(1490,530)],1.2,GRAY,dash=[9,3,2,3])
    arrow(sh,1490,530,0,12,GRAY)
    for x,y,txt in [(1188,716,'3 FT'),(1280,642,'14 FT'),(1340,616,'6 FT'),(1440,564,'5 FT'),(1470,507,'3 FT')]:
        sh.text(x,y,txt,10)
    sh.text(1570,629,'TOTAL A = 31 FT',13,bold=True)
    sh.text(1100,457,'B: ROOM 103 TO SOUTH ADMIN EXTERIOR DOOR',12,bold=True)
    sh.text(1100,427,'3 FT + 14 FT + 12 FT + 33 FT = 62 FT',12)
    sh.text(1100,386,'Use the actual scaled polylines on FP101 to verify both distances.',11)
    sh.text(1100,354,'These paths are demonstration geometry and do not establish acceptable egress.',10)
    sh.notes(1990,1480,'FIRE / LIFE SAFETY NOTES',[
        'Details and the path sketch are intentionally not to scale.',
        'Plan quantities: 24 sprinklers, 6 smoke detectors and 4 exit / directional signs.',
        'Wet main trace: (75,17) to (75,30) to (6,30), exactly 82 FT.',
        'Travel path A totals 31 FT. Path B totals 62 FT.',
        'Code criteria, occupancy and allowable travel distance are outside this fictional demonstration.'
    ],270,11)
    sh.notes(1990,960,'DEMO WORKFLOWS',[
        'Calibrate FP101 and trace each travel path.',
        'Count sprinkler heads in selected rooms or throughout the plan.',
        'Review riser components, add issue markups and create a punch list.'
    ],270,11)
    result=doc.finish()
    result['facts']={
        'plan_sheet':'FP101','detail_sheet':'FP501','plan_scale_points_per_foot':18,
        'calibration_length_ft':20,'calibration_length_pdf_points':360,
        'plan_sprinklers':24,'legend_sprinklers':1,'plan_smoke_detectors':6,'legend_smoke_detectors':1,
        'plan_exit_signs':4,'legend_exit_signs':1,'plan_risers':1,
        'wet_main_centerline_ft':main_length,'wet_main_vertices_ft':main,
        'egress_a_centerline_ft':ea,'egress_a_vertices_ft':egress_a,
        'egress_b_centerline_ft':eb,'egress_b_vertices_ft':egress_b,
        'sprinkler_positions_ft':sprinklers,'smoke_detector_positions_ft':smokes,'exit_sign_positions_ft':exits,
        'device_schedule_rows':6,'hyperlinked_detail_callouts':1,
    }
    return result


def build(out):
    return [mechanical(out), electrical(out), plumbing(out), fire(out)]
