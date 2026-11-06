#!/usr/bin/env python3
# Spain: centro de convivencia municipal, A2 landscape, ESCALA 1/100 (A2).
# Redesign. The rejected plan was a 2:1 rectangle (30 x 15 m) with a corridor through mid-depth, rooms on both
# sides and 5 m and 10 m bays. This one is two offset volumes forming an L around a south-east terrace: a deep
# west block (sala, vestibulo, aseos) and a shorter east block (talleres) joined by a spine wall. Depth to width
# is 21,10 to 24,90. The DISTRIBUIDOR runs north-south and serves rooms on one side only. Pillar bays are 6,50,
# 7,30 and 5,40 across and 4,00, 6,35 and 4,95 down. The programme follows the Zaragoza sheet A-03. Walls are
# hollow with a heavy outline, north is upright, there are no axis bubbles, and both views sit side by side above
# a full-width band of schedules, which is a different sheet from the German column layout.
import sys
from pathlib import Path
from draftkit import *

OUT = Path(sys.argv[1] if len(sys.argv) > 1 else 'out'); OUT.mkdir(exist_ok=True)
es = fmt_m(2, ',')
FX = '#4a5157'                                    # sanitary fittings and fixed joinery
TINT = {'TZ': '#efe9dc', 'GR': '#cfe1e7', 'PQ': '#e9c999', 'CK': '#d49c84', 'HF': '#d4d6d8'}
FINISH = {'TZ': 'Terrazo micrograno', 'GR': 'Gres porcelánico antideslizante, clase 2', 'PQ': 'Parquet de roble',
          'CK': 'Clínker antideslizante', 'HF': 'Solera de hormigón fratasado'}

# ---- outline (metres, outer face of the walls, lower-left corner, north up)
W, D = 24.90, 21.10
WEST_D, NOTCH_X, NOTCH_Y, STEP_X = 19.60, 14.10, 8.00, 13.80
FOOT = [(0, 0), (NOTCH_X, 0), (NOTCH_X, NOTCH_Y), (W, NOTCH_Y), (W, D), (STEP_X, D), (STEP_X, WEST_D), (0, WEST_D)]

# ---- walls: (x0, y0, x1, y1)
EXT = [(0, 0, 0.30, 19.60), (0, 0, 14.10, 0.30), (0, 19.30, 13.80, 19.60), (13.80, 0, 14.10, 21.10),
       (14.10, 8.00, 24.90, 8.30), (24.60, 8.00, 24.90, 21.10), (14.10, 20.80, 24.90, 21.10)]
INT = [(0.30, 7.20, 6.70, 7.30), (6.60, 7.30, 6.70, 19.30), (6.70, 12.30, 13.80, 12.40), (6.70, 16.50, 13.80, 16.60),
       (8.10, 16.60, 8.20, 19.30), (10.90, 16.60, 11.00, 19.30), (4.00, 7.30, 4.10, 11.10), (0.30, 11.10, 6.60, 11.20),
       (0.30, 14.00, 6.60, 14.10), (0.30, 15.60, 6.60, 15.70), (2.50, 15.70, 2.60, 19.30), (4.60, 15.70, 4.70, 19.30),
       (16.30, 8.30, 16.40, 20.80), (16.40, 14.45, 24.60, 14.55), (14.10, 16.40, 16.30, 16.50), (14.10, 18.20, 16.30, 18.30)]

# ---- rooms: clear rectangles between wall faces
SALA = [(0.30, 0.30), (13.80, 0.30), (13.80, 12.30), (6.70, 12.30), (6.70, 7.20), (0.30, 7.20)]
ROOMS = [
    ('PB.01', 'ESCLUSA DE ENTRADA', 'CK', [(8.20, 16.60, 2.70, 2.70)]),
    ('PB.02', 'VESTÍBULO GENERAL', 'TZ', [(6.70, 12.40, 7.10, 4.10)]),
    ('PB.03', 'RECEPCIÓN INFORMACIÓN', 'TZ', [(11.00, 16.60, 2.80, 2.70)]),
    ('PB.04', 'SALA DE ESTAR-CAFETERÍA', 'PQ', [(0.30, 0.30, 13.50, 6.90), (6.70, 7.20, 7.10, 5.10)]),
    ('PB.05', 'OFFICE', 'GR', [(0.30, 7.30, 3.70, 3.80)]),
    ('PB.06', 'ALMACÉN', 'TZ', [(4.10, 7.30, 2.50, 3.80)]),
    ('PB.07', 'DISTRIBUIDOR', 'TZ', [(14.10, 8.30, 2.20, 8.10)]),
    ('PB.08', 'TALLER 1', 'TZ', [(16.40, 14.55, 8.20, 6.25)]),
    ('PB.09', 'TALLER 2', 'TZ', [(16.40, 8.30, 8.20, 6.15)]),
    ('PB.10', 'DESPACHO', 'TZ', [(0.30, 11.20, 6.30, 2.80)]),
    ('PB.11', 'VESTÍBULO DE ASEOS', 'GR', [(0.30, 14.10, 6.30, 1.50)]),
    ('PB.12', 'ASEO MUJERES', 'GR', [(0.30, 15.70, 2.20, 3.60)]),
    ('PB.13', 'ASEO ACCESIBLE', 'GR', [(2.60, 15.70, 2.00, 3.60)]),
    ('PB.14', 'ASEO HOMBRES', 'GR', [(4.70, 15.70, 1.90, 3.60)]),
    ('PB.15', 'CUARTO DE LIMPIEZA', 'GR', [(6.70, 16.60, 1.40, 2.70)]),
    ('PB.16', 'ALMACÉN DE TALLERES', 'TZ', [(14.10, 16.50, 2.20, 1.70)]),
    ('PB.17', 'CUARTO DE INSTALACIONES', 'HF', [(14.10, 18.30, 2.20, 2.50)]),
]
def sup(r): return round(sum(w * d_ for _, _, w, d_ in r[3]) + 1e-9, 2)
ROOM = {r[0]: r for r in ROOMS}

# The rooms and the solid walls must fill the outline exactly, with nothing left over and nothing overlapping.
_solid = Region()
for w_ in EXT + INT: _solid.add(*w_)
_wall_rects = [(a, b, c - a, e - b) for a, b, c, e in _solid.rects()]
GROSS = check_tiling([q for r in ROOMS for q in r[3]] + _wall_rects, FOOT)
SUP_UTIL = round(sum(sup(r) for r in ROOMS), 2)
SUP_CONS = round(poly_area(FOOT), 2)
MUROS = round(SUP_CONS - SUP_UTIL, 2)
BYKEY = {k: round(sum(sup(r) for r in ROOMS if r[2] == k), 2) for k in TINT}
assert abs(GROSS - 418.29) < 1e-6, GROSS
assert (SUP_UTIL, SUP_CONS, MUROS) == (378.45, 418.29, 39.84), (SUP_UTIL, SUP_CONS, MUROS)
assert abs(poly_area(SALA) - sup(ROOM['PB.04'])) < 1e-6 and sup(ROOM['PB.04']) == 129.36
assert max(ROOMS, key=sup)[0] == 'PB.04'
assert BYKEY == {'TZ': 187.05, 'GR': 49.25, 'PQ': 129.36, 'CK': 7.29, 'HF': 5.50}, BYKEY
assert abs(sum(BYKEY.values()) - SUP_UTIL) < 1e-6

# ---- openings
B = Building()
for w_ in EXT: B.wall(*w_, 'ext')
for w_ in INT: B.wall(*w_, 'int')
S_, N_W, N_E, W_, E_, SP, SE = (0, 0.30), (19.30, 19.60), (20.80, 21.10), (0, 0.30), (24.60, 24.90), (13.80, 14.10), (8.00, 8.30)
OW = {'P1': 1.60, 'P2': 0.90, 'P3': 0.70, 'V1': 2.40, 'V2': 1.50, 'V3': 0.80}
COUNT = dict.fromkeys(['P1', 'P2', 'P3', 'V1', 'V2', 'V3'], 0)
def P(mark, axis, at, wall, hinge, swing):
    B.door(axis, at, OW[mark], wall, hinge, swing); COUNT[mark] += 1
def V(mark, axis, at, wall):
    B.window(axis, at, OW[mark], wall); COUNT[mark] += 1
for a in (0.75, 3.65, 7.55, 10.65): V('V1', 'h', a, S_)                # sala, south
P('P1', 'v', 1.35, W_, 'both', -1)                                      # sala, west exit, opens outward
V('V1', 'v', 4.45, W_)
V('V2', 'v', 8.45, W_); V('V2', 'v', 12.35, W_)                         # office, despacho
V('V3', 'v', 14.70, W_); V('V3', 'v', 16.10, W_)                        # vestibulo de aseos, aseo mujeres
V('V1', 'v', 1.00, SP); P('P1', 'v', 4.95, SP, 'both', 1)               # sala to the terrace
for a in (3.20, 5.25, 7.00): V('V3', 'h', a, N_W)                       # aseo accesible, aseo hombres, limpieza
V('V2', 'h', 11.65, N_W)                                                # recepcion
P('P1', 'h', 8.75, N_W, 'both', 1)                                      # esclusa, outer door, opens outward
P('P1', 'h', 8.75, (16.50, 16.60), 'both', 1)                           # esclusa, inner door
P('P1', 'h', 8.75, (12.30, 12.40), 'both', 1)                           # sala to vestibulo
P('P2', 'v', 9.30, SP, 'a', -1)                                         # sala to distribuidor
B.gap('v', 12.50, 1.80, SP)                                             # vestibulo to distribuidor, open
P('P2', 'h', 14.75, SE, 'b', -1)                                        # distribuidor to the terrace
for a in (16.70, 20.85): V('V1', 'h', a, SE); V('V1', 'h', a, N_E)      # talleres
V('V1', 'v', 10.10, E_); V('V1', 'v', 16.45, E_)
P('P2', 'h', 14.75, N_E, 'a', 1)                                        # instalaciones, from outside only
P('P2', 'v', 13.30, (16.30, 16.40), 'b', 1)                             # taller 2
P('P2', 'v', 15.00, (16.30, 16.40), 'a', 1)                             # taller 1
P('P2', 'h', 14.30, (16.40, 16.50), 'a', -1)                            # almacen de talleres
P('P2', 'h', 3.00, (7.20, 7.30), 'b', 1)                                # office
B.gap('h', 0.90, 1.90, (7.20, 7.30))                                    # pass-through at the bar
P('P2', 'h', 4.90, (7.20, 7.30), 'b', 1)                                # almacen
P('P2', 'v', 12.80, (6.60, 6.70), 'a', -1)                              # despacho
P('P2', 'v', 14.68, (6.60, 6.70), 'b', -1)                              # vestibulo de aseos
P('P2', 'h', 7.00, (16.50, 16.60), 'a', 1)                              # limpieza
P('P2', 'h', 12.75, (16.50, 16.60), 'b', 1)                             # recepcion
B.gap('h', 11.25, 1.30, (16.50, 16.60))                                 # reception counter
P('P2', 'h', 1.50, (15.60, 15.70), 'b', 1)                              # aseo mujeres
P('P2', 'h', 3.15, (15.60, 15.70), 'a', -1)                             # aseo accesible, opens outward
P('P2', 'h', 5.50, (15.60, 15.70), 'b', 1)                              # aseo hombres

PILLARS = [(x, y) for x in (0.15, 6.65) for y in (0.15, 4.15, 8.15, 14.50, 19.45)] + \
          [(13.95, y) for y in (0.15, 4.15, 8.15, 14.50, 19.45, 20.95)] + \
          [(x, y) for x in (19.35, 24.75) for y in (8.15, 14.50, 20.95)]

# No opening may cut a pillar, and no two door swings may overlap.
def _open_rect(o):
    a, b = o['at'], o['at'] + o['w']; w0, w1 = o['wall']
    return (a, w0, b, w1) if o['axis'] == 'h' else (w0, a, w1, b)
def _overlap(p, q): return min(p[2], q[2]) - max(p[0], q[0]) > 1e-6 and min(p[3], q[3]) - max(p[1], q[1]) > 1e-6
for o in B.openings:
    for x, y in PILLARS:
        assert not _overlap(_open_rect(o), (x - 0.15, y - 0.15, x + 0.15, y + 0.15)), (o, x, y)
def _swing(o):
    a, b = o['at'], o['at'] + o['w']; w0, w1 = o['wall']; s = o['swing']
    face = w1 if s > 0 else w0
    r = o['w'] / 2 if o['hinge'] == 'both' else o['w']
    lo, hi = sorted((face, face + s * r))
    return (a, lo, b, hi) if o['axis'] == 'h' else (lo, a, hi, b)
_doors = [o for o in B.openings if o['t'] == 'door']
for i, o in enumerate(_doors):
    for q in _doors[i + 1:]:
        assert not _overlap(_swing(o), _swing(q)), (o, q)

# ---- sheet
PW, PH = 594, 420
d = Doc(OUT / 'es.pdf', (PW, PH), 'Plano de práctica. Centro de convivencia, planta baja, escala 1/100 (A2)',
        subject='Plano de práctica ficticio para PolyPDF. No válido para obra', keywords='plano de práctica, planta baja, superficie construida, superficie útil')
d.frame(20, 10, 584, 410)
BAND = 120
d.line(20, BAND, 584, BAND, 0.35)
OFF_H, OFF_V = (10, 18, 26), (10, 17, 24)     # top and bottom chains; side chains are tighter so both views fit across
X1, X2, Y0 = 50, 330, 160

def outer_faces(view):
    """The heavy outline: every wall edge lying on the outer face. Corners are exact."""
    def on_foot(p, q):
        for i in range(len(FOOT)):
            a, b = FOOT[i], FOOT[(i + 1) % len(FOOT)]
            if a[1] == b[1] == p[1] == q[1] and min(a[0], b[0]) - 1e-6 <= min(p[0], q[0]) and max(p[0], q[0]) <= max(a[0], b[0]) + 1e-6: return True
            if a[0] == b[0] == p[0] == q[0] and min(a[1], b[1]) - 1e-6 <= min(p[1], q[1]) and max(p[1], q[1]) <= max(a[1], b[1]) + 1e-6: return True
        return False
    for p, q in B.region().edges():
        if on_foot(p, q): view.d.line(view.X(p[0]), view.Y(p[1]), view.X(q[0]), view.Y(q[1]), 0.7, INK, cap=2)

def pillars(view):
    for x, y in PILLARS: view.column(x, y, 0.30, INK, lw=0.13)

def thresholds(view, every):
    """A thin line across door openings: outer face only on the plan, both faces on the finish plan."""
    for o in B.openings:
        if o['t'] == 'window': continue
        if not every and (o['t'] != 'door' or o['wall'] not in (S_, N_W, N_E, E_, SP, SE)): continue
        if not every and o['wall'] == SP and o['at'] > NOTCH_Y: continue
        a, b = o['at'], o['at'] + o['w']; w0, w1 = o['wall']
        faces = (w0, w1) if every else ((w1,) if o['wall'] in (N_W, N_E, E_, SP) else (w0,))
        for f in faces:
            if o['axis'] == 'h': view.linem(a, f, b, f, 0.18, INK)
            else: view.linem(f, a, f, b, 0.18, INK)

def cota(view, x0, y0, x1, y1, h=1.7, lab=None):
    """A clear room dimension: ends on the wall faces, 45 degree strokes, no extension lines."""
    dd = view.d; px0, py0, px1, py1 = view.X(x0), view.Y(y0), view.X(x1), view.Y(y1)
    dd.line(px0, py0, px1, py1, 0.13)
    for px, py in ((px0, py0), (px1, py1)): dd.line(px - 0.8, py - 0.8, px + 0.8, py + 0.8, 0.3)
    lab = lab or es(abs(x1 - x0) + abs(y1 - y0))
    if y0 == y1: dd.text((px0 + px1) / 2, py0 + 0.7, lab, h, align='center')
    else: dd.text(px0 - 0.7, (py0 + py1) / 2, lab, h, align='center', angle=90)

CAB = 17.70                                       # front of the WC cubicles; door tips stop 0,28 short of the pan
def cabin(view, x0, x1, door, y_front=CAB, y_back=19.30):
    """WC cubicle: light partition, inward 0,70 door, pan on the back wall."""
    COUNT['P3'] += 1
    view.linem(x0, y_front, door, y_front, 0.25, FX); view.linem(door + OW['P3'], y_front, x1, y_front, 0.25, FX)
    view.linem(door, y_front, door, y_front + OW['P3'], 0.2, FX)
    view.d.arc(view.X(door), view.Y(y_front), OW['P3'] * view.k, 0, 90, 0.09, FX)
    view.wc((x0 + x1) / 2, y_back, 's', FX)

def wheelchair(x, y, s=2.4):
    """Plain wheelchair pictogram, sheet mm."""
    d.circle(x - 0.34 * s, y + 1.02 * s, 0.14 * s, 0, fill=INK)
    d.line(x - 0.34 * s, y + 0.82 * s, x - 0.34 * s, y + 0.22 * s, 0.3)
    d.line(x - 0.34 * s, y + 0.58 * s, x + 0.12 * s, y + 0.58 * s, 0.25)
    d.line(x - 0.34 * s, y + 0.22 * s, x + 0.26 * s, y + 0.22 * s, 0.3)
    d.line(x + 0.26 * s, y + 0.22 * s, x + 0.52 * s, y - 0.34 * s, 0.3)
    d.line(x + 0.52 * s, y - 0.34 * s, x + 0.76 * s, y - 0.34 * s, 0.3)
    d.arc(x - 0.2 * s, y - 0.1 * s, 0.5 * s, 105, 270, 0.3)

# ---- view 1: uses, areas and dimensions
v = View(d, X1, Y0, 100)
# furniture first, so walls and labels sit on top
def mesa(x, y): v.table_chairs(x, y, 0.80, 0.80, 1, 1)
for x in (7.35, 9.25, 11.15):
    for y in (1.30, 3.40, 5.50): mesa(x, y)
for x in (1.60, 3.70): mesa(x, 3.40)
for x in (3.20, 5.10): mesa(x, 1.30)
for x in (1.20, 1.75, 2.30): v.circlem(x, 6.33, 0.15, 0.09, LIGHT)      # bar stools
v.rectm(0.30, 7.30, 0.90, 11.10, 0.13, LIGHT); v.rectm(0.90, 10.50, 4.00, 11.10, 0.13, LIGHT)   # office worktops
v.rectm(1.35, 10.60, 2.05, 11.00, 0.09, LIGHT); v.circlem(3.30, 10.80, 0.22, 0.09, LIGHT)
v.rectm(4.10, 8.40, 4.55, 11.10, 0.13, LIGHT); v.rectm(6.15, 8.40, 6.60, 11.10, 0.13, LIGHT)     # almacen shelving
v.rectm(0.90, 12.15, 2.50, 12.95, 0.09, LIGHT); v.rectm(1.45, 11.75, 1.85, 12.11, 0.09, LIGHT)   # despacho desk
v.rectm(3.30, 13.55, 5.10, 14.00, 0.09, LIGHT)
for x, y in ((17.70, 15.75), (21.50, 15.75), (17.70, 18.55), (21.50, 18.55)): v.table_chairs(x, y, 1.80, 0.80, 2)  # taller 1
for x, y in ((17.70, 9.80), (21.50, 9.80), (17.70, 12.55), (21.50, 12.55)): v.table_chairs(x, y, 1.80, 0.80, 2)     # taller 2
v.rectm(14.20, 18.30, 16.30, 18.75, 0.09, LIGHT)                         # instalaciones: equipment against the wall
# the terrace, drawn thin so the outline of the building stays the heavy line
TERR = (2.4, 1.4)
v.linem(NOTCH_X, 0, W, 0, 0.13, GREY, dash=TERR); v.linem(W, 0, W, NOTCH_Y, 0.13, GREY, dash=TERR)
for x, y in ((17.0, 5.55), (19.7, 5.55), (22.4, 5.55)):
    v.circlem(x, y, 0.40, 0.09, LIGHT)
    for dx, dy in ((-0.62, 0), (0.62, 0), (0, -0.62), (0, 0.62)): v.circlem(x + dx, y + dy, 0.16, 0.09, LIGHT)
v.draw(B, None, lw=0.35, door_lw=0.25, arc_lw=0.13)
outer_faces(v); thresholds(v, False); pillars(v)
# fixed items
v.rectm(0.90, 6.60, 2.80, 7.20, 0.18, INK)                               # bar on the sala side
d.text(v.X(1.85), v.Y(6.60) + 1.9, 'BARRA', 1.7, align='center')
v.rectm(11.25, 16.60, 12.55, 17.15, 0.18, INK)                           # reception counter
d.text(v.X(11.90), v.Y(16.60) + 1.9, 'MOSTRADOR', 1.25, align='center')
# aseos
for y in (16.15, 16.85): v.basin(0.30, y, 'e', FX)
cabin(v, 0.30, 1.40, 0.50); cabin(v, 1.40, 2.50, 1.60); v.linem(1.40, CAB, 1.40, 19.30, 0.25, FX)
v.basin(4.70, 16.20, 'e', FX)
cabin(v, 4.70, 5.75, 4.87); v.linem(5.75, CAB, 5.75, 19.30, 0.25, FX)
for y in (16.95, 17.60): v.basin(6.60, y, 'w', FX, w=0.40, depth=0.30)
v.wc(2.95, 19.30, 's', FX); v.basin(4.25, 19.30, 's', FX)
v.linem(2.72, 18.70, 2.72, 19.25, 0.18, FX); v.linem(3.18, 18.70, 3.18, 19.25, 0.18, FX)        # grab rails
v.circlem(3.60, 16.55, 0.75, 0.18, INK, dash=(1.4, 1.0))
wheelchair(v.X(3.56), v.Y(16.62))
d.text(v.X(3.60), v.Y(15.98), 'Ø 1,50', 1.6, align='center')
v.basin(6.70, 18.70, 'e', FX)                                            # limpieza: slop sink
# entrance outside the outline: landing and ramp, uncovered
v.rectm(8.10, WEST_D, 11.10, 21.10, 0.13, INK)
v.ramp(6.10, WEST_D, 8.10, 21.10, 'e', '8 %', 1.7, 0.13)
d.text(v.X(3.20), v.Y(20.28), 'ACCESO', 2.2, True, align='center')
_ax0, _ax1, _ay = v.X(5.25), v.X(6.02), v.Y(20.35)
d.line(_ax0 - 9, _ay, _ax1, _ay, 0.18); d.poly([(_ax1, _ay), (_ax1 - 1.8, _ay + 0.5), (_ax1 - 1.8, _ay - 0.5)], True, 0, fill=INK)
v.level(4.35, 19.82, '-0,16', 1.7, 'tri')
# levels
v.level(7.15, 13.30, '+0,00', 1.7, 'tri')
v.level(6.95, 7.70, '+0,00', 1.7, 'tri')
v.level(15.55, 3.85, '-0,02', 1.7, 'tri')                                # terrace
v.level(-0.76, 3.25, '-0,02', 1.7, 'tri')                                # outside the west door

# clear dimensions inside the larger rooms
cota(v, 0.30, 0.72, 13.80, 0.72); cota(v, 12.75, 0.30, 12.75, 12.30); cota(v, 0.78, 0.30, 0.78, 7.20); cota(v, 6.70, 11.60, 13.80, 11.60)
cota(v, 16.40, 20.15, 24.60, 20.15); cota(v, 24.00, 14.55, 24.00, 20.80)
cota(v, 16.40, 8.95, 24.60, 8.95); cota(v, 24.00, 8.30, 24.00, 14.45)
cota(v, 6.70, 15.95, 13.80, 15.95); cota(v, 13.25, 12.40, 13.25, 16.50)

# room tags
def tag(n, x, y, name=None, hn=2.0, hs=1.8, lead=1.3, sup_h=None, lines=None):
    r = ROOM[n]
    name = name or [r[1]]
    rows = [(n, 1.6, False)] + [(t, hn, True) for t in name] + [(f'Sup. {es(sup(r))} m²', sup_h or hs, False)]
    v.tag(x, y, rows, lead=lead)
tag('PB.01', 9.55, 18.40, ['ESCLUSA', 'DE ENTRADA'], 1.8)
tag('PB.02', 10.20, 14.50, ['VESTÍBULO GENERAL'], 2.4, 2.0)
tag('PB.03', 12.40, 18.25, ['RECEPCIÓN', 'INFORMACIÓN'], 1.7, 1.7, 1.42)
tag('PB.04', 9.72, 9.55, ['SALA DE ESTAR-', 'CAFETERÍA'], 3.0, 2.3, 1.42)
tag('PB.05', 2.45, 9.20, ['OFFICE'], 2.2, 1.9)
tag('PB.06', 5.32, 9.60, ['ALMACÉN'], 1.8, 1.45)
tag('PB.07', 15.20, 11.30, ['DISTRIBUIDOR'], 1.6, 1.5)
tag('PB.08', 20.50, 17.65, ['TALLER 1'], 2.6, 2.1)
tag('PB.09', 20.50, 11.60, ['TALLER 2'], 2.6, 2.1)
tag('PB.10', 3.90, 12.60, ['DESPACHO'], 2.2, 1.9)
tag('PB.11', 1.72, 14.85, ['VEST. ASEOS'], 1.7, 1.6, 1.28)
tag('PB.12', 1.62, 17.22, ['ASEO', 'MUJERES'], 1.6, 1.5, 1.3)
tag('PB.13', 3.60, 17.98, ['ASEO', 'ACCESIBLE'], 1.6, 1.5, 1.3)
tag('PB.14', 5.50, 17.22, ['ASEO', 'HOMBRES'], 1.6, 1.5, 1.3)
tag('PB.15', 7.40, 18.00, ['C. LIMP.'], 1.5, 1.3, 1.32)
tag('PB.16', 15.20, 17.35, ['ALMACÉN', 'TALLERES'], 1.5, 1.4, 1.28)
tag('PB.17', 15.20, 19.62, ['CUARTO DE', 'INSTALAC.'], 1.5, 1.4, 1.28)
v.tag(18.75, 2.75, [('TERRAZA DESCUBIERTA', 2.2, True), ('Fuera de la superficie construida', 1.8, False)], lead=1.4)
d.north(v.X(23.2), v.Y(2.85), 13, 'circle', 'N', 0, 3.0)

# door and window marks
def mark(s, x, y, align='center'): d.text(v.X(x), v.Y(y), s, 1.7, align=align, col=INK)
def south_mark(s, cx): d.text(v.X(cx), v.Y(0) - 3.4, s, 1.7, align='center')
for a in (0.75, 3.65, 7.55, 10.65): south_mark('V1', a + 1.2)
for a in (16.70, 20.85):
    d.text(v.X(a + 1.2), v.Y(NOTCH_Y) - 3.4, 'V1', 1.7, align='center')
    d.text(v.X(a + 1.2), v.Y(D) + 1.3, 'V1', 1.7, align='center')
for a, m_ in ((3.20, 'V3'), (5.25, 'V3'), (11.65, 'V2')):
    d.text(v.X(a + OW[m_] / 2), v.Y(WEST_D) + 1.3, m_, 1.7, align='center')
mark('V3', 7.72, 18.98)
for y, m_ in ((4.45, 'V1'), (8.45, 'V2'), (12.35, 'V2'), (14.70, 'V3'), (16.10, 'V3')):
    d.text(v.X(0) - 1.3, v.Y(y + OW[m_] / 2) - 0.8, m_, 1.7, align='right')
d.text(v.X(NOTCH_X) + 1.3, v.Y(2.20) - 0.8, 'V1', 1.7)
d.text(v.X(W) + 1.3, v.Y(11.30) - 0.8, 'V1', 1.7); d.text(v.X(W) + 1.3, v.Y(17.65) - 0.8, 'V1', 1.7)
mark('P1', 1.20, 2.05); mark('P1', 15.25, 5.65); mark('P1', 10.75, 20.25); mark('P1', 10.72, 16.20); mark('P1', 9.55, 12.04)
mark('P2', 13.40, 10.32); mark('P2', 16.05, 7.45); mark('P2', 17.55, 13.95); mark('P2', 17.55, 15.25); mark('P2', 14.42, 16.62)
mark('P2', 16.05, 21.30); mark('P2', 3.45, 8.30); mark('P2', 5.35, 8.30); mark('P2', 5.42, 13.18); mark('P2', 5.42, 15.05)
mark('P2', 7.45, 16.20); mark('P2', 13.20, 17.58); mark('P2', 1.28, 15.92); mark('P2', 4.28, 15.20); mark('P2', 5.30, 15.92)
for x in (0.85, 1.95, 5.22): mark('P3', x, CAB + 0.06)                   # inside each cubicle door's own swing

# dimension chains: series, room lines, overall
def opening_stops(axis, walls, keep=lambda o: True):
    s = set()
    for o in B.openings:
        if o['axis'] == axis and o['wall'] in walls and o['t'] != 'gap' and keep(o):
            s.update((round(o['at'], 2), round(o['at'] + o['w'], 2)))
    return s
yS = sorted({0, NOTCH_X, W} | opening_stops('h', (S_, SE)))
yN = sorted({0, STEP_X, W} | opening_stops('h', (N_W, N_E)))
yW = sorted({0, WEST_D} | opening_stops('v', (W_,)))
yE = sorted({0, NOTCH_Y, D} | opening_stops('v', (E_,)) | opening_stops('v', (SP,), lambda o: o['at'] < NOTCH_Y))
rS = [0, 0.30, 13.80, 14.10, 24.90]
rN = [0, 0.30, 2.50, 2.60, 4.60, 4.70, 6.60, 6.70, 8.10, 8.20, 10.90, 11.00, 13.80, 14.10, 16.30, 16.40, 24.60, 24.90]
rW = [0, 0.30, 7.20, 7.30, 11.10, 11.20, 14.00, 14.10, 15.60, 15.70, 19.30, 19.60]
rE = [0, 8.00, 8.30, 14.45, 14.55, 20.80, 21.10]
for side, base, o_, r_, full in (('b', 0, yS, rS, [0, W]), ('t', D, yN, rN, [0, W]), ('l', 0, yW, rW, [0, WEST_D]), ('r', W, yE, rE, [0, D])):
    OFF = OFF_H if side in 'bt' else OFF_V
    v.chain(side, o_, OFF[0], base, es, 1.8, 'tick')
    # a wall thickness at either end of the room-line chain is lettered just past the end, clear of the strokes
    labs = [es(r_[i + 1] - r_[i]) for i in range(len(r_) - 1)]
    first, last = labs[0] if r_[1] - r_[0] < 0.5 else None, labs[-1] if r_[-1] - r_[-2] < 0.5 else None
    if first: labs[0] = ''
    if last: labs[-1] = ''
    v.chain(side, r_, OFF[1], base, es, 1.8, 'tick', labels=labs, ext_from=OFF[0] + 3)
    if side in 'bt':
        ly = v.Y(base) + (OFF[1] if side == 't' else -OFF[1])
        if first: d.text(v.X(r_[0]) - 1.5, ly + 0.7, first, 1.8, align='right')
        if last: d.text(v.X(r_[-1]) + 1.5, ly + 0.7, last, 1.8)
    else:
        lx = v.X(base) + (OFF[1] if side == 'r' else -OFF[1])
        if first: d.text(lx - 0.7, v.Y(r_[0]) - 1.5, first, 1.8, align='right', angle=90)
        if last: d.text(lx - 0.7, v.Y(r_[-1]) + 1.5, last, 1.8, angle=90)
    v.chain(side, full, OFF[2], base, es, 2.2, 'tick', ext_from=OFF[1] + 2)
# the step in the north front
v.chain('l', [WEST_D, D], 3.0, STEP_X, es, 1.7, 'tick', ext_gap=-1.0)
d.text(v.X(0), BAND + 4.2, 'PLANTA BAJA. USOS, SUPERFICIES Y COTAS', 3.6, True)
_tw = d.width('PLANTA BAJA. USOS, SUPERFICIES Y COTAS', 3.6, True)
d.text(v.X(0) + _tw + 5, BAND + 4.2, 'NIVEL 0', 2.4); d.text(v.X(0) + _tw + 22, BAND + 4.2, 'ESCALA 1/100 (A2)', 2.4)

# ---- view 2: floor finishes, shaded right up to the wall faces
u = View(d, X2, Y0, 100)
for n, name, key, rects in ROOMS:
    if n == 'PB.04': continue
    for x, y, w_, d_ in rects: u.fill(x, y, x + w_, y + d_, TINT[key])
u.fill_poly(SALA, TINT['PQ'])
u.draw(B, None, lw=0.35, doors=False, windows=True)
outer_faces(u); thresholds(u, True); pillars(u)
cota(u, 0.30, 0.72, 13.80, 0.72); cota(u, 12.75, 0.30, 12.75, 12.30); cota(u, 0.78, 0.30, 0.78, 7.20); cota(u, 6.70, 11.60, 13.80, 11.60)
def ptag(x, y, n, key, big=False, small=False):
    hk = 4.4 if big else 2.2 if small else 3.0
    rows = [(key, hk, True), (n, 1.5, False)]
    if big: rows.append((f'Sup. {es(sup(ROOM[n]))} m²', 2.2, False))
    u.tag(x, y, rows, lead=1.45 if big else 1.25)
for n, x, y, big, small in (('PB.01', 9.55, 17.95, False, False), ('PB.02', 10.25, 14.45, False, False), ('PB.03', 12.40, 17.95, False, False), ('PB.04', 10.05, 4.15, True, False),
                            ('PB.05', 2.15, 9.20, False, False), ('PB.06', 5.35, 9.20, False, False), ('PB.07', 15.20, 12.10, False, False), ('PB.08', 20.50, 17.65, True, False),
                            ('PB.09', 20.50, 11.40, True, False), ('PB.10', 3.45, 12.60, False, False), ('PB.11', 3.45, 14.85, False, True), ('PB.12', 1.40, 17.50, False, False),
                            ('PB.13', 3.60, 17.50, False, False), ('PB.14', 5.65, 17.50, False, False), ('PB.15', 7.40, 17.95, False, True), ('PB.16', 15.20, 17.35, False, True),
                            ('PB.17', 15.20, 19.55, False, False)):
    ptag(x, y, n, ROOM[n][2], big, small)
# finish key sits in the bend of the L
kx, ky = u.X(14.55), u.Y(7.05)
d.text(kx, ky, 'LEYENDA DE PAVIMENTOS', 2.6, True)
krows = [['Clave', 'Pavimento', 'Sup. útil (m²)']] + [[k, FINISH[k], es(BYKEY[k])] for k in ('TZ', 'GR', 'PQ', 'CK', 'HF')] + [['', 'Total', es(SUP_UTIL)]]
kW = [13, 62, 22]
for i, k in enumerate(('TZ', 'GR', 'PQ', 'CK', 'HF')):
    d.rect(kx, ky - 2.5 - 4.6 * (i + 2), kW[0], 4.6, 0, fill=TINT[k])
_ky = d.table(kx, ky - 2.5, kW, krows, 1.8, 4.6, aligns=['left', 'left', 'right'], bold_rows={6})
d.para(kx, _ky - 2, sum(kW), 'Sombreado hasta las caras interiores de muros y tabiques, sin entrar en los pasos de puerta. Los pilares no se descuentan.', 1.8, lead=1.4)
d.text(u.X(0), BAND + 4.2, 'PLANTA DE PAVIMENTOS', 3.6, True)
_tw = d.width('PLANTA DE PAVIMENTOS', 3.6, True)
d.text(u.X(0) + _tw + 5, BAND + 4.2, 'NIVEL 0', 2.4); d.text(u.X(0) + _tw + 22, BAND + 4.2, 'ESCALA 1/100 (A2)', 2.4)
bar_x, bar_y = u.X(14.10), BAND + 15
d.text(bar_x, bar_y + 4.0, 'ESCALA GRÁFICA', 1.8, col=GREY)
d.scale_bar(bar_x, bar_y, 10, 10, [0, 1, 2, 3, 4, 5, 10], ['0', '', '', '', '', '5', '10 m'], 1.9, 2.0)

# ---- band of schedules
C1, C2, C3, C4 = 20, 170, 287, 399
for x in (C2, C3, C4): d.line(x, 10, x, BAND, 0.25)
# cuadro de superficies
yy = BAND - 6.2
d.text(C1 + 3, yy, 'CUADRO DE SUPERFICIES', 3.0, True)
rows = [['Nº', 'Recinto', 'Pavimento', 'Sup. útil (m²)']]
for r in ROOMS: rows.append([r[0], r[1], r[2], es(sup(r))])
n_r = len(rows)
rows += [['', 'SUPERFICIE ÚTIL TOTAL', None, es(SUP_UTIL)], ['', 'Muros, tabiques y pasos', None, es(MUROS)], ['', 'SUPERFICIE CONSTRUIDA TOTAL', None, es(SUP_CONS)]]
yb = d.table(C1 + 3, yy - 2.2, [15, 76, 20, 33], rows, 1.85, 4.25, aligns=['left', 'left', 'left', 'right'], bold_rows={n_r, n_r + 2})
d.para(C1 + 3, yb - 1.3, 144, f'Construida: {es(NOTCH_X)} x {es(NOTCH_Y)} + {es(W)} x {es(WEST_D - NOTCH_Y)} + {es(W - STEP_X)} x {es(D - WEST_D)} = {es(SUP_CONS)} m².', 1.8, lead=1.3)
# carpinteria
yy = BAND - 6.2
d.text(C2 + 3, yy, 'CUADRO DE CARPINTERÍA', 3.0, True)
crows = [['Marca', 'Elemento', 'Ancho x alto', 'Ud.'],
         *[[m_, t_, f'{es(OW[m_])} x {hh}', str(COUNT[m_])] for m_, t_, hh in (('P1', 'Puerta de dos hojas', '2,10'), ('P2', 'Puerta de una hoja', '2,10'), ('P3', 'Puerta de cabina', '1,90'),
                                                                              ('V1', 'Ventana', '1,50'), ('V2', 'Ventana', '1,20'), ('V3', 'Ventana alta', '0,60'))]]
yc = d.table(C2 + 3, yy - 2.2, [13, 50, 34, 14], crows, 1.85, 4.6, aligns=['left', 'left', 'left', 'right'])
yy = yc - 7.5
d.text(C2 + 3, yy, 'LEYENDA', 3.0, True)
yy -= 5.5
d.rect(C2 + 3, yy, 11, 3, 0.5); d.text(C2 + 17, yy + 0.6, 'Muro exterior y muro central, 0,30', 1.8)
yy -= 5.8
d.rect(C2 + 3, yy + 1, 11, 1, 0.35); d.text(C2 + 17, yy + 0.6, 'Tabique, 0,10', 1.8)
d.rect(C2 + 58, yy, 3, 3, 0.13, fill=INK); d.text(C2 + 64, yy + 0.6, 'Pilar 0,30 x 0,30', 1.8)
yy -= 5.8
d.circle(C2 + 8.5, yy + 1.5, 1.9, 0.18, dash=(1.0, 0.7)); d.text(C2 + 17, yy + 0.6, 'Espacio de giro Ø 1,50', 1.8)
d.line(C2 + 50, yy + 1.5, C2 + 62, yy + 1.5, 0.13, GREY, dash=TERR); d.text(C2 + 64, yy + 0.6, 'Límite de terraza', 1.8)
yy -= 8
d.text(C2 + 3, yy, 'NOTAS', 3.0, True)
yy -= 2.0
yy = d.para(C2 + 3, yy, 111, 'COTAS EN METROS. Decimal con coma.', 1.9, True, lead=1.4) - 1.2
yy = d.para(C2 + 3, yy, 111, 'Superficie útil: suelo libre entre caras interiores de muros y tabiques. No se deducen los pilares ni se suman los pasos de puerta.', 1.9, lead=1.4) - 1.2
yy = d.para(C2 + 3, yy, 111, 'Superficie construida: todo lo que queda dentro de la cara exterior de los muros de fachada.', 1.9, lead=1.4) - 1.2
yy = d.para(C2 + 3, yy, 111, 'SUPERFICIES SOLO PARA ESTE EJERCICIO.', 1.9, True, lead=1.4)
# ejercicio
yy = BAND - 6.2
d.text(C3 + 3, yy, 'EJERCICIO', 3.0, True)
d.text(C3 + 3 + d.width('EJERCICIO', 3.0, True) + 3, yy, 'Calibración y tres mediciones', 2.0)
yy -= 2.6
for s_ in (f'1. Calibra con la cota total {es(W)}: línea de cota exterior del lado sur, de extremo a extremo.',
           f'2. Comprueba una longitud: el fondo {es(WEST_D)} m, línea de cota exterior del lado oeste.',
           f'3. Mide la superficie construida recorriendo la cara exterior de los muros, en la planta de usos: {es(SUP_CONS)} m².',
           f'4. Mide el pavimento PQ de la sala PB.04 recorriendo las caras interiores de los muros, en la planta de pavimentos: {es(sup(ROOM["PB.04"]))} m².'):
    yy = d.para(C3 + 3, yy, 106, s_, 2.3, lead=1.42) - 2.0
yy = d.para(C3 + 3, yy - 0.2, 106, 'En los pasos 3 y 4 la línea sigue recta por delante de puertas y pilares. La terraza queda fuera. El paso 3 coincide con el cuadro de superficies y el paso 4 con la etiqueta del recinto.', 1.9, lead=1.4) - 1.4
yy = d.para(C3 + 3, yy, 106, 'La aplicación escribe los decimales con punto; en este plano van con coma.', 1.9, lead=1.4)
# stamp
SB = 13.5
d.rect(C3 + 3, SB, 106, 19.5, 0.5)
d.text(C3 + 56, SB + 13.3, 'NO VÁLIDO PARA OBRA', 4.0, True, align='center')
d.text(C3 + 56, SB + 8.0, 'PLANO DE PRÁCTICA. EDIFICIO FICTICIO', 2.6, True, align='center')
d.text(C3 + 56, SB + 2.8, 'Ningún profesional en España ha revisado este plano.', 2.05, align='center')
# title block, bottom right so it stays on the front panel when folded
TX, TW = C4, 185
tb = BAND
def trow(h_, fields):
    global tb
    tb -= h_
    xx = TX
    for w_, lab, val, vh, bold in fields:
        d.field(xx, tb, w_, h_, lab, val, 1.5, vh, bold)
        xx += w_
trow(12, [(TW, 'PROMOTOR', 'AYUNTAMIENTO DE NAVALCEREZO (FICTICIO)', 2.8, False)])
trow(16, [(TW, 'PROYECTO', '', 3.0, True)])
d.text(TX + 1.2, tb + 6.3, 'PROYECTO BÁSICO Y DE EJECUCIÓN DE', 3.0, True); d.text(TX + 1.2, tb + 1.7, 'CENTRO DE CONVIVENCIA MUNICIPAL', 3.0, True)
trow(12, [(TW, 'SITUACIÓN', 'PARCELA DOTACIONAL EQ-2. NAVALCEREZO', 2.6, False)])
trow(16, [(TW, 'PLANO', '', 2.8, True)])
d.text(TX + 1.2, tb + 6.1, 'PLANTA BAJA. USOS, SUPERFICIES Y COTAS.', 2.8, True); d.text(TX + 1.2, tb + 1.7, 'PLANTA DE PAVIMENTOS', 2.8, True)
trow(12, [(TW, 'ARQUITECTO', 'ESTUDIO DE PRÁCTICA (FICTICIO)', 2.6, False)])
assert tb == 52
d.field(TX, 31, 115, 21, 'ESCALA', '1/100 (A2)', 1.5, 4.6, True)
d.field(TX, 10, 115, 21, 'FECHA', 'NOVIEMBRE 2026', 1.5, 3.6, False)
d.field(TX + 115, 10, 70, 42, 'PLANO Nº', '', 1.5)
d.text(TX + 150, 21.5, 'A-03', 15.5, True, align='center')
d.text(584, 5.2, 'PolyPDF. Plano de práctica, edificio ficticio.', 1.8, col=GREY, align='right', track=False)

# ---- measuring facts, in sheet millimetres
CHAIN_S = v.Y(0) - OFF_H[2]; CHAIN_W = v.X(0) - OFF_V[2]
d.expect('calibrate', p0=(v.X(0), CHAIN_S), p1=(v.X(W), CHAIN_S), metres=W, note='printed dimension 24,90: outer chain, south side, line ends')
d.expect('check', p0=(CHAIN_W, v.Y(0)), p1=(CHAIN_W, v.Y(WEST_D)), metres=WEST_D, note='printed dimension 19,60: outer chain, west side, line ends')
d.expect('gross', pts=[v.P(*p) for p in FOOT], sqm=poly_area(FOOT), perimeter=poly_perimeter(FOOT), note='outer face of the walls, plan on the left')
d.expect('floor', pts=[u.P(*p) for p in SALA], sqm=poly_area(SALA), perimeter=poly_perimeter(SALA), note='PQ in PB.04, inner wall faces, finish plan on the right')
d.save()
