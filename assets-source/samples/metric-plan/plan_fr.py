#!/usr/bin/env python3
"""France: salle polyvalente communale, A3 landscape, 1/100. A fictional commune hall: L footprint, stage and two
stores beside a glazed main hall, office for caterers with a bar on the hall, plant rooms reached from outside.
Room figures are clear areas between wall faces, so a user tracing what is drawn reads the printed figure."""
import sys
from pathlib import Path
from draftkit import *

OUT = Path(sys.argv[1] if len(sys.argv) > 1 else 'out'); OUT.mkdir(exist_ok=True)
POCHE = '#1b2024'
PETROL = '#0e5a6b'
FIX_COL = '#39414a'
fm = fmt_m_cm(',')
def r2(v): return round(v + 1e-9, 2)
def fr(v, p=2): return f'{v:.{p}f}'.replace('.', ',')

# ---- geometry (metres, lower-left outer corner, north up)
W, D = 24.0, 17.5
FOOT = [(0, 0), (W, 0), (W, D), (4, D), (4, 12), (0, 12)]
GROSS = poly_area(FOOT)
assert GROSS == 398.0 and poly_perimeter(FOOT) == 83.0

FIN = {'P': ('Parquet', 'parquet', '#f1e5cd'),
       'C': ('Carrelage grès cérame', 'carrelage', '#dbe6ea'),
       'S': ('Sol souple PVC', 'PVC souple', '#e3ecd8'),
       'B': ('Dallage béton surfacé', 'béton', '#e3e3e0')}

# number, schedule name, x0, y0, x1, y1 (clear, wall face to wall face), floor, group
ROOMS = [('01', 'Sas', 17.05, 14.55, 18.95, 17.15, 'C', 'A'),
         ('02', 'Hall d’entrée', 8.10, 12.10, 18.95, 14.45, 'C', 'A'),
         ('03', 'Vestiaire', 15.05, 14.55, 16.95, 17.15, 'C', 'A'),
         ('04', 'Salle principale', 4.10, 0.35, 18.90, 11.90, 'P', 'L'),
         ('05', 'Scène', 0.35, 0.35, 4.10, 7.90, 'P', 'L'),
         ('06', 'Salle de réunion', 19.10, 0.35, 23.65, 4.95, 'S', 'L'),
         ('07', 'Bar', 19.10, 5.05, 23.65, 7.95, 'C', 'V'),
         ('08', 'Office', 19.10, 8.05, 23.65, 11.95, 'C', 'V'),
         ('09', 'Réserve', 21.05, 12.05, 23.65, 14.95, 'C', 'V'),
         ('10', 'Sanitaires femmes', 8.10, 14.55, 11.45, 17.15, 'C', 'V'),
         ('11', 'Sanitaires hommes', 11.55, 14.55, 14.95, 17.15, 'C', 'V'),
         ('12', 'Rangement communal', 0.35, 8.10, 3.90, 11.65, 'S', 'V'),
         ('13', 'Rangement associations', 4.35, 12.10, 7.90, 14.90, 'S', 'V'),
         ('14', 'Local entretien', 19.05, 12.05, 20.95, 14.45, 'C', 'V'),
         ('15', 'Local poubelles', 21.05, 15.05, 23.65, 17.15, 'B', 'T'),
         ('16', 'Chaufferie', 4.35, 15.10, 7.90, 17.15, 'B', 'T'),
         ('17', 'Local électrique', 19.05, 14.55, 20.95, 17.15, 'B', 'T')]
GROUPS = [('A', 'ESPACES D’ACCUEIL'), ('L', 'SALLES'), ('V', 'SERVICES'), ('T', 'LOCAUX TECHNIQUES')]
def exact(r): return (r[4] - r[2]) * (r[5] - r[3])
def area(r): return r2(exact(r))
ROOM = {r[0]: r for r in ROOMS}

WALLS = [(0, 0, 24, 0.35, 'ext'), (23.65, 0, 24, 17.5, 'ext'), (4, 17.15, 24, 17.5, 'ext'), (4, 12, 4.35, 17.5, 'ext'),
         (0, 11.65, 4, 12, 'ext'), (0, 0, 0.35, 12, 'ext'),
         # refends 20: round the main hall and the boiler room
         (3.90, 7.90, 4.10, 12, 'ref'), (0.35, 7.90, 3.90, 8.10, 'ref'), (4.10, 11.90, 19.05, 12.10, 'ref'), (18.90, 0.35, 19.10, 12.05, 'ref'),
         (4.35, 14.90, 7.90, 15.10, 'ref'), (7.90, 12.10, 8.10, 17.15, 'ref'),
         # cloisons 10
         (8.10, 14.45, 20.95, 14.55, 'cl'), (11.45, 14.55, 11.55, 17.15, 'cl'), (14.95, 14.55, 15.05, 17.15, 'cl'), (16.95, 14.55, 17.05, 17.15, 'cl'),
         (18.95, 12.05, 19.05, 17.15, 'cl'), (20.95, 12.05, 21.05, 17.15, 'cl'), (19.10, 11.95, 23.65, 12.05, 'cl'), (21.05, 14.95, 23.65, 15.05, 'cl'),
         (19.10, 7.95, 23.65, 8.05, 'cl'), (19.10, 4.95, 23.65, 5.05, 'cl')]
SAN_WALLS = [(9.95, 14.55, 10.05, 17.15, 'san'), (10.05, 15.75, 11.45, 15.85, 'san'), (12.95, 14.55, 13.05, 17.15, 'san')]   # cubicle walls, counted in rooms 10 and 11

# every clear room plus the walls must fill the outline exactly, with no overlap: a wrong room or wall fails here
_wr = Region()
for x0, y0, x1, y1, _k in WALLS: _wr.add(x0, y0, x1, y1)
WALL_RECTS = [(a, b, c - a, e - b) for a, b, c, e in _wr.rects()]
assert abs(check_tiling([(r[2], r[3], r[4] - r[2], r[5] - r[3]) for r in ROOMS] + WALL_RECTS, FOOT) - 398.0) < 1e-6
WALL_AREA = sum(w * h for _, _, w, h in WALL_RECTS)

SUB = {g: r2(sum(area(r) for r in ROOMS if r[7] == g)) for g, _ in GROUPS}
LOCAUX = r2(sum(area(r) for r in ROOMS))
MURS = r2(GROSS - LOCAUX)
BYFLOOR = {k: r2(sum(area(r) for r in ROOMS if r[6] == k)) for k in FIN}
assert (LOCAUX, MURS) == (356.38, 41.62), (LOCAUX, MURS)
assert abs(MURS - WALL_AREA) < 0.02, (MURS, WALL_AREA)
assert r2(sum(SUB.values())) == LOCAUX and r2(sum(BYFLOOR.values())) == LOCAUX and r2(LOCAUX + MURS) == 398.00
assert BYFLOOR == {'P': 199.25, 'C': 95.98, 'S': 43.47, 'B': 17.68}, BYFLOOR

# the parquet trace: six visible inner wall corners, equal to rooms 04 + 05
PARQUET = [(0.35, 0.35), (18.90, 0.35), (18.90, 11.90), (4.10, 11.90), (4.10, 7.90), (0.35, 7.90)]
assert abs(poly_area(PARQUET) - (exact(ROOM['04']) + exact(ROOM['05']))) < 1e-9
assert r2(poly_area(PARQUET)) == 199.25 == BYFLOOR['P']

# ---- openings
B = Building()
for w_ in WALLS + SAN_WALLS: B.wall(*w_)
S_, N_, E_ = (0, 0.35), (17.15, 17.5), (23.65, 24)
Y12, Y14, Y8, Y158 = (11.90, 12.10), (14.45, 14.55), (7.95, 8.05), (15.75, 15.85)
Y12E = (11.95, 12.05)
X19, X19N, X4 = (18.90, 19.10), (18.95, 19.05), (3.90, 4.10)
H_DOOR = 204
# axis, at, width, wall, hinge, swing, tag x, tag y, tag align, tag height
DOORS = [('h', 5.75, 1.50, S_, 'both', -1, 6.50, 0.45, 'center', 1.5),      # escape doors, south facade
         ('h', 15.75, 1.50, S_, 'both', -1, 16.50, 0.45, 'center', 1.5),
         ('v', 2.05, 0.93, E_, 'a', 1, 23.55, 2.42, 'right', 1.5),          # own door for the meeting room
         ('v', 10.40, 0.93, E_, 'b', 1, 23.55, 10.60, 'right', 1.5),        # deliveries, office
         ('h', 17.25, 1.50, N_, 'both', 1, 18.00, 16.82, 'center', 1.5),    # public entrance
         ('h', 5.70, 0.93, N_, 'a', 1, 6.17, 16.82, 'center', 1.5),         # boiler room
         ('h', 19.55, 0.93, N_, 'a', 1, 20.02, 16.82, 'center', 1.5),       # electrical room
         ('h', 21.90, 0.93, N_, 'b', 1, 22.37, 16.82, 'center', 1.5),       # bin store
         ('h', 15.25, 1.50, Y12, 'both', 1, 16.00, 11.52, 'center', 1.5),   # hall to main hall, on the vestiaire axis
         ('h', 17.25, 1.50, Y14, 'both', 1, 18.00, 14.14, 'center', 1.5),   # sas to hall
         ('h', 5.60, 0.93, Y12, 'a', 1, 6.07, 11.52, 'center', 1.5),        # associations' store
         ('v', 9.15, 1.50, X4, 'both', -1, 4.20, 9.80, 'left', 1.5),         # commune's store, double door for trolleys
         ('v', 3.90, 0.93, X19, 'b', 1, 18.80, 4.28, 'right', 1.5),         # main hall to meeting room
         ('v', 9.60, 0.93, X19, 'b', 1, 18.80, 9.98, 'right', 1.5),         # main hall to office
         ('h', 20.40, 0.93, Y8, 'b', -1, 20.87, 8.20, 'center', 1.5),       # office to bar
         ('h', 22.10, 0.93, Y12E, 'a', 1, 22.57, 11.60, 'center', 1.5),     # office to reserve
         ('v', 12.35, 0.93, X19N, 'a', 1, 19.14, 12.13, 'left', 1.35),      # hall to cleaners' room
         ('h', 8.95, 0.93, Y14, 'b', 1, 9.42, 14.16, 'center', 1.4),        # women, accessible cubicle
         ('h', 10.35, 0.83, Y14, 'b', 1, 10.77, 14.16, 'center', 1.4),      # women, lobby: 83 keeps the leaf clear of the basin
         ('h', 10.55, 0.83, Y158, 'b', 1, 10.92, 15.53, 'center', 1.3),     # women, cubicle
         ('h', 11.80, 0.93, Y14, 'b', 1, 12.27, 14.16, 'center', 1.4),      # men, lobby; the leaf shields the urinals
         ('h', 13.12, 0.93, Y14, 'a', 1, 13.59, 14.16, 'center', 1.4)]      # men, accessible cubicle
for ax, at, w_, wall, hinge, swing, *_t in DOORS: B.door(ax, at, w_, wall, hinge, swing)
# axis, at, width, wall, height, sill (cm), label x, label y, angle
WINDOWS = [('h', 4.60, 0.95, S_, 2.20, 20, 5.075, 0.85, 0), ('h', 7.45, 0.95, S_, 2.20, 20, 7.925, 0.85, 0), ('h', 9.60, 3.80, S_, 2.20, 20, 11.50, 0.85, 0),
           ('h', 14.60, 0.95, S_, 2.20, 20, 15.075, 0.85, 0), ('h', 17.45, 0.95, S_, 2.20, 20, 17.925, 0.85, 0), ('h', 20.70, 1.40, S_, 1.40, 90, 21.40, 0.85, 0),
           ('v', 3.30, 1.20, E_, 1.40, 90, 23.05, 3.90, 90), ('v', 8.90, 1.20, E_, 1.15, 110, 23.05, 9.50, 90),
           ('h', 10.45, 0.60, N_, 0.60, 180, None, None, 0), ('h', 11.95, 0.60, N_, 0.60, 180, None, None, 0)]
for ax, at, w_, wall, *_t in WINDOWS: B.window(ax, at, w_, wall)
VEST_W, BAR_W = 1.50, 2.00
B.gap('h', 15.25, VEST_W, Y14)          # vestiaire, open to the hall
B.gap('v', 5.50, BAR_W, X19)            # bar opening on the main hall

# fittings: name -> rectangle, registered so a door can never sweep through one
FITS = []
def fit(x0, y0, x1, y1, name): FITS.append((x0, y0, x1, y1, name))
def _wc_box(x, y, rot):
    return {'e': (x, y - .2, x + .62, y + .2), 'w': (x - .62, y - .2, x, y + .2), 'n': (x - .2, y, x + .2, y + .62), 's': (x - .2, y - .62, x + .2, y)}[rot]
def _ba_box(x, y, rot, w, dp):
    return {'e': (x, y - w / 2, x + dp, y + w / 2), 'w': (x - dp, y - w / 2, x, y + w / 2), 'n': (x - w / 2, y, x + w / 2, y + dp), 's': (x - w / 2, y - dp, x + w / 2, y)}[rot]
WCS = [(8.10, 15.25, 'e'), (10.05, 16.70, 'e'), (14.95, 15.25, 'w')]
BASINS = [(8.10, 16.70, 'e', .45, .35), (10.05, 15.40, 'e', .5, .4), (14.95, 16.70, 'w', .45, .35), (11.55, 16.40, 'e', .5, .4), (20.95, 12.55, 'w', .5, .35)]
URINALS = [(12.95, 15.85, 'w', .36, .3), (12.95, 16.55, 'w', .36, .3)]
for p in WCS: fit(*_wc_box(*p), 'wc')
for p in BASINS + URINALS: fit(*_ba_box(*p), 'basin')
TURN = [(9.19, 16.35), (13.81, 16.35)]       # dashed ø 1,50 in each cabinet adapté
RUNS = [(19.10, 5.05, 19.70, 7.95, 'comptoir'), (19.95, 5.05, 23.65, 5.65, 'arrière-bar'), (19.10, 11.30, 22.00, 11.95, 'plan de travail'),
        (21.50, 8.05, 23.65, 8.75, 'armoire chaude'), (23.15, 12.05, 23.65, 14.95, 'rayonnages'), (7.05, 15.25, 7.80, 16.00, 'chaudière'), (15.05, 16.60, 16.95, 17.15, 'penderie')]
for r in RUNS: fit(*r)
STEPS = (4.10, 6.60, 5.00, 7.90)             # four risers of 15 cm up to the stage at +0,60, in the main hall
fit(*STEPS, 'marches')

# door sweeps sampled at 2 cm: no leaf may meet another leaf, a wall or a turning circle, or pass within 5 cm of a fitting
def sweep(o):
    ax, a, w, (w0, w1), s = o['axis'], o['at'], o['w'], o['wall'], o['swing']
    face = w1 if s > 0 else w0
    leaves = [(a, 1, w)] if o['hinge'] == 'a' else [(a + w, -1, w)] if o['hinge'] == 'b' else [(a, 1, w / 2), (a + w, -1, w / 2)]
    pts = []
    for hu, su, r in leaves:
        n = int(r / .02)
        for i in range(1, n):
            for j in range(1, n):
                u, v_ = i * .02, j * .02
                if u * u + v_ * v_ < r * r:
                    p = (hu + su * u, face + s * v_)
                    pts.append(p if ax == 'h' else (p[1], p[0]))
    return pts
_sw = [(o, sweep(o)) for o in B.openings if o['t'] == 'door']
for i, (o, pts) in enumerate(_sw):
    for x, y in pts:
        for fx0, fy0, fx1, fy1, name in FITS:
            assert not (fx0 - .05 < x < fx1 + .05 and fy0 - .05 < y < fy1 + .05), f'door at {o["at"]} passes within 5 cm of {name}'
        for wx0, wy0, wx1, wy1, kind in WALLS + SAN_WALLS:
            assert not (wx0 < x < wx1 and wy0 < y < wy1), f'door at {o["at"]} sweeps through wall {kind} at {x, y}'
        for cx, cy in TURN:
            assert math.hypot(x - cx, y - cy) > .75, f'door at {o["at"]} sweeps through the ø 1,50 circle'
    for o2, pts2 in _sw[i + 1:]:
        s2 = {(round(x, 2), round(y, 2)) for x, y in pts2}
        assert not any((round(x, 2), round(y, 2)) in s2 for x, y in pts), f'doors at {o["at"]} and {o2["at"]} collide'
for cx, cy in TURN:
    for fx0, fy0, fx1, fy1, name in FITS:
        nx, ny = max(fx0, min(cx, fx1)), max(fy0, min(cy, fy1))
        assert math.hypot(nx - cx, ny - cy) >= .745, f'ø 1,50 at {cx} meets {name}'

# ---- sheet
PW, PH = 420, 297
d = Doc(OUT / 'fr.pdf', (PW, PH), 'Plan d’exercice, salle polyvalente communale, plan du rez-de-chaussée, éch. 1/100',
        subject='Plan d’exercice fictif pour PolyPDF, ne peut servir pour l’exécution de travaux', keywords='plan d’exercice, rez-de-chaussée, tableau des surfaces')
d.frame(10, 10, 410, 287)
v = View(d, 28, 73, 100)
LINES = []          # every dimension, extension and leader line, so a build can check none runs through lettering
def hline(x0, y0, x1, y1, lw=0.13):
    d.line(x0, y0, x1, y1, lw); LINES.append((x0, y0, x1, y1))

def chain(side, stops, off, base, h=1.8, bold=False, ext_from=None, ext_gap=5.0, labels=None, lw=0.13):
    """Series of dimensions with thin filled arrowheads. The line ends exactly on the first and last stop.
    Spans too short for arrowheads borrow their neighbours', which then point at them from outside."""
    horiz = side in 'bt'; sign = -1 if side in 'bl' else 1
    if horiz:
        ly = v.Y(base) + sign * off; hline(v.X(stops[0]), ly, v.X(stops[-1]), ly, lw)
    else:
        lx = v.X(base) + sign * off; hline(lx, v.Y(stops[0]), lx, v.Y(stops[-1]), lw)
    start = (v.Y(base) if horiz else v.X(base)) + sign * (ext_gap if ext_from is None else ext_from)
    end = (ly if horiz else lx) + sign * 0.55
    for s in stops:
        if horiz: hline(v.X(s), start, v.X(s), end, lw)
        else: hline(start, v.Y(s), end, v.Y(s), lw)
    last = None
    for i in range(len(stops) - 1):
        span = stops[i + 1] - stops[i]; length = span * v.k
        lab = labels[i] if labels else fm(span)
        w = d.width(lab, h, bold)
        c = (v.X((stops[i] + stops[i + 1]) / 2)) if horiz else v.Y((stops[i] + stops[i + 1]) / 2)
        tiny = w + 0.3 > length
        if side in 'tl' or not tiny:
            row = 1 if last is not None and c - w / 2 < last[0] + 0.3 and last[1] == 0 else 0
            lift = (0.85 if side in 'tl' else 0.6) + row * h * 1.1
            if horiz: d.text(c, ly + lift, lab, h, bold, align='center')
            else: d.text(lx - lift, c, lab, h, bold, align='center', angle=90)
            last = (c + w / 2, row)
        elif horiz: d.text(c, ly - 0.85 - h, lab, h, bold, align='center')    # south: below the line, clear of the extension lines
        else: d.text(lx + 0.85 + h, c, lab, h, bold, align='center', angle=90)  # east: outside the line
        if length >= 3.0:
            for u, dirn in ((stops[i], 1), (stops[i + 1], -1)):
                _arrow(v.X(u) if horiz else lx, ly if horiz else v.Y(u), dirn, horiz)
def _arrow(px, py, dirn, horiz, A=1.45, hw=0.3):
    if horiz: d.poly([(px, py), (px + dirn * A, py + hw), (px + dirn * A, py - hw)], True, 0, fill=INK)
    else: d.poly([(px, py), (px + hw, py + dirn * A), (px - hw, py + dirn * A)], True, 0, fill=INK)
def ichain(axis, at, stops, h=1.7, lw=0.13):
    """Interior dimensions along one line inside the drawing: wall faces and clear room sizes."""
    horiz = axis == 'h'
    if horiz: hline(v.X(stops[0]), v.Y(at), v.X(stops[-1]), v.Y(at), lw)
    else: hline(v.X(at), v.Y(stops[0]), v.X(at), v.Y(stops[-1]), lw)
    for s in stops:
        if horiz: hline(v.X(s), v.Y(at) - 0.8, v.X(s), v.Y(at) + 0.8, lw)
        else: hline(v.X(at) - 0.8, v.Y(s), v.X(at) + 0.8, v.Y(s), lw)
    for i in range(len(stops) - 1):
        span = stops[i + 1] - stops[i]; lab = fm(span); mid = (stops[i] + stops[i + 1]) / 2
        if horiz: d.text(v.X(mid), v.Y(at) + 0.6, lab, h, align='center')
        else: d.text(v.X(at) - 0.6, v.Y(mid), lab, h, align='center', angle=90)
        if span * v.k >= 3.0:
            for u, dirn in ((stops[i], 1), (stops[i + 1], -1)):
                _arrow(v.X(u) if horiz else v.X(at), v.Y(at) if horiz else v.Y(u), dirn, horiz)
def post(x, y, s=0.20):
    """A 20 x 20 portal-frame post, wholly inside the wall thickness, so it never moves a wall face or a measured corner."""
    v.rectm(x - s / 2, y - s / 2, x + s / 2, y + s / 2, 0.13, INK, fill=WHITE)
    v.linem(x - s / 2, y - s / 2, x + s / 2, y + s / 2, 0.09, INK); v.linem(x - s / 2, y + s / 2, x + s / 2, y - s / 2, 0.09, INK)
def level_mark(x, y, s, r=4.2, h=1.65):
    d.circle(v.X(x), v.Y(y), r, 0.13, INK, fill=WHITE)
    d.text(v.X(x), v.Y(y) - h * 0.42, s, h, align='center')
def note(x, y, s, h=1.5, align='center', col=FIX_COL, angle=0):
    d.text(v.X(x), v.Y(y), s, h, col=col, align=align, angle=angle)

# ---- floor finishes first: every tint runs exactly to the wall faces, and the parquet tint is the trace outline
v.fill_poly(PARQUET, FIN['P'][2])
for r in ROOMS:
    if r[6] != 'P': v.fill(r[2], r[3], r[4], r[5], FIN[r[6]][2])

# ---- fittings under the walls
for x0, y0, x1, y1, name in RUNS:
    v.rectm(x0, y0, x1, y1, 0.13, FIX_COL, fill=WHITE)
v.draw(B, {'ext': POCHE, 'ref': POCHE, 'cl': POCHE, 'san': POCHE}, lw=0.3)
for p in WCS: v.wc(*p, col=FIX_COL)
for x, y, rot, w_, dp in BASINS + URINALS: v.basin(x, y, rot, col=FIX_COL, w=w_, depth=dp)
for cx, cy in TURN:
    v.circlem(cx, cy, 0.75, 0.13, INK, dash=(1.0, 0.8))
    d.text(v.X(cx), v.Y(cy) - 0.6, 'ø 1,50', 1.5, align='center')
# bar: counter behind the opening, shutter line across it
note(19.47, 6.50, 'comptoir', 1.35, angle=90)
v.linem(19.0, 5.50, 19.0, 7.50, 0.13, INK, dash=(0.8, 0.6))
note(21.80, 5.28, 'arrière-bar', 1.35)
v.rectm(20.10, 5.14, 20.70, 5.56, 0.09, FIX_COL)
note(18.80, 6.42, 'ouverture ' + fm(BAR_W), 1.5, 'right')
# office: sink, dishwasher, warming cabinet
v.rectm(19.25, 11.38, 19.80, 11.87, 0.09, FIX_COL); v.rectm(19.88, 11.38, 20.43, 11.87, 0.09, FIX_COL)
v.rectm(20.62, 11.33, 21.22, 11.92, 0.09, FIX_COL)
note(19.84, 11.11, 'plonge', 1.35); note(21.22, 11.11, 'lave-vaisselle', 1.35)
note(22.57, 8.32, 'armoire chaude', 1.35)
note(23.55, 10.90, 'livraisons', 1.4, 'right')
# vestiaire rail, reserve shelves, boiler
v.linem(15.05, 16.98, 16.95, 16.98, 0.18, FIX_COL)
note(16.0, 16.69, 'penderie', 1.3)
note(16.0, 14.14, 'passage ' + fm(VEST_W), 1.4)
note(23.47, 13.50, 'rayonnages', 1.3, angle=90)
v.circlem(7.425, 15.625, 0.24, 0.09, FIX_COL)
note(7.425, 16.08, 'chaudière', 1.3)
# stage edge, lighter than a cut wall and named; four riser lines, the top one being the stage edge
v.linem(4.10, 0.35, 4.10, 7.90, 0.25, INK)
note(4.04, 4.00, 'nez de scène', 1.5, 'center', INK, 90)
v.steps(*STEPS, 3, 'e', lw=0.18)
v.linem(5.00, 7.25, 3.72, 7.25, 0.13, INK)
d.poly([v.P(3.62, 7.25), (v.X(3.62) + 1.6, v.Y(7.25) + 0.42), (v.X(3.62) + 1.6, v.Y(7.25) - 0.42)], True, 0, fill=INK)
note(5.12, 7.12, '4 marches', 1.5, 'left', INK)
# portal-frame posts in the wall thickness, one size on both ends of each frame
for x in (4, 9, 14, 19): post(x, 0.175)
for x in (9, 14, 19): post(x, 12.0)
post(4, 11.75)
# public entrance
d.poly([v.P(18.0, 17.60), (v.X(18.0) - 0.9, v.Y(17.60) + 2.4), (v.X(18.0) + 0.9, v.Y(17.60) + 2.4)], True, 0, fill=INK)
d.text(v.X(17.10), v.Y(17.5) + 2.8, 'ENTRÉE DU PUBLIC', 1.8, True, align='right')

# ---- tags: number, NAME, area, SOL : finish
def tag(n, x, y, name_lines, hn=1.9, ha=None, hs=None, lead=1.36):
    r = ROOM[n]
    ha = ha or max(hn - 0.15, 1.55); hs = hs or max(hn - 0.4, 1.4)
    lines = [(s, hn, True) for s in name_lines] + [(fr(area(r)) + ' m²', ha, False), ('SOL : ' + FIN[r[6]][1], hs, False)]
    v.tag(x, y, lines, lead=lead)
tag('04', 11.20, 6.40, ['04 SALLE PRINCIPALE'], 3.4, 2.6, 2.2)
tag('05', 2.22, 3.95, ['05 SCÈNE'], 3.0, 2.4, 2.0)
tag('06', 21.40, 3.15, ['06 SALLE', 'DE RÉUNION'], 2.2, 2.0, 1.75, lead=1.46)
tag('07', 22.45, 6.75, ['07 BAR'], 2.2, 1.9, 1.6)
tag('08', 21.60, 10.05, ['08 OFFICE'], 2.4, 2.0, 1.7)
tag('09', 22.08, 13.75, ['09 RÉSERVE'], 2.0, 1.8, 1.55)
tag('12', 1.78, 9.88, ['12 RANGEMENT', 'COMMUNAL'], 1.9, 1.75, 1.55)
tag('13', 6.12, 13.62, ['13 RANGEMENT', 'ASSOCIATIONS'], 2.0, 1.8, 1.6)
tag('16', 5.86, 15.62, ['16 CHAUFFERIE'], 1.7, 1.55, 1.4)
tag('02', 16.75, 13.62, ['02 HALL D’ENTRÉE'], 2.1, 1.85, 1.6)
tag('01', 18.0, 15.90, ['01 SAS'], 2.0, 1.7, 1.45)
tag('03', 16.0, 15.55, ['03 VESTIAIRE'], 1.55, 1.55, 1.4)
tag('17', 20.0, 15.70, ['17 LOCAL', 'ÉLECTRIQUE'], 1.65, 1.5, 1.4, lead=1.46)
tag('14', 20.0, 13.82, ['14 LOCAL', 'ENTRETIEN'], 1.6, 1.45, 1.35)
tag('15', 22.35, 15.82, ['15 LOCAL', 'POUBELLES'], 1.75, 1.55, 1.42)
# the two toilet blocks are full of fittings: their tags sit in the hall with a leader into the block
for n, name, x, align, lx_ in (('10', '10 SANITAIRES FEMMES', 8.22, 'left', 8.50), ('11', '11 SANITAIRES HOMMES', 14.58, 'right', 14.42)):
    r = ROOM[n]
    d.text(v.X(x), v.Y(13.70), name, 1.55, True, align=align)
    d.text(v.X(x), v.Y(13.44), f'{fr(area(r))} m² – SOL : {FIN[r[6]][1]}', 1.42, align=align)
    hline(v.X(lx_), v.Y(13.70) + 1.8, v.X(lx_), v.Y(14.82))
    d.circle(v.X(lx_), v.Y(14.82), 0.3, 0, fill=INK)
level_mark(7.20, 6.40, '0,00')
level_mark(2.22, 5.85, '+0,60')
level_mark(8.72, 12.56, '0,00', 3.2, 1.5)

# ---- door and window labels, all taken from the opening data
for ax, at, w_, wall, hinge, swing, tx, ty, al, th in DOORS:
    d.text(v.X(tx), v.Y(ty), f'{round(w_ * 100)}/{H_DOOR}', th, align=al)
for ax, at, w_, wall, ht, sill, lx_, ly_, ang in WINDOWS:
    if lx_ is None: continue
    v.size_label(lx_, ly_, fm(w_), fm(ht), 1.5, f'all. {sill}', angle=ang)

for at, w_, al, tx in ((10.45, 0.60, 'right', 10.38), (11.95, 0.60, 'left', 12.62)):
    d.text(v.X(tx), v.Y(D) + 1.3, f'{round(w_ * 100)}/{round(0.60 * 100)}, all. 180', 1.3, align=al)

# ---- dimension chains, working outward: openings, main parts, total
def facade(wall, lo, hi):
    pts = {lo, hi}
    for o in B.openings:
        if o['wall'] == wall and o['t'] != 'gap': pts |= {round(o['at'], 2), round(o['at'] + o['w'], 2)}
    return sorted(pts)
OFF_S, OFF_E, OFF_N, OFF_W = (11, 18, 25), (12, 19, 26), (10, 17, 24), (7.5, 14)
chain('b', facade(S_, 0, W), OFF_S[0], 0)
chain('b', [0, 4, 9, 14, 19, 24], OFF_S[1], 0, ext_from=OFF_S[0] + 2)
chain('b', [0, W], OFF_S[2], 0, 2.2, True, ext_from=OFF_S[1] + 2)
chain('r', facade(E_, 0, D), OFF_E[0], W)
chain('r', [0, .35, 4.95, 5.05, 7.95, 8.05, 11.95, 12.05, 14.95, 15.05, 17.15, 17.5], OFF_E[1], W, ext_from=OFF_E[0] + 2)
chain('r', [0, D], OFF_E[2], W, 2.2, True, ext_from=OFF_E[1] + 2)
chain('t', facade(N_, 4, W), OFF_N[0], D)
chain('t', [4, 4.35, 7.90, 8.10, 11.45, 11.55, 14.95, 15.05, 16.95, 17.05, 18.95, 19.05, 20.95, 21.05, 23.65, 24], OFF_N[1], D, ext_from=OFF_N[0] + 3)
chain('t', [4, W], OFF_N[2], D, 2.2, ext_from=OFF_N[1] + 2)
chain('l', [0, .35, 7.90, 8.10, 11.65, 12], OFF_W[0], 0)
chain('l', [0, 12], OFF_W[1], 0, 2.2, ext_from=OFF_W[0] + 2)
chain('l', [12, D], 6, 4)                  # the notch behind the stage
chain('t', [0, 4], 5, 12)
ichain('h', 1.48, [.35, 4.10, 18.90])
ichain('h', 1.48, [19.10, 23.65])
ichain('v', 14.32, [.35, 11.90])
ichain('v', 14.86, [12.10, 14.45])
ichain('h', 12.95, [8.10, 18.95])
ichain('v', 4.60, [12.10, 14.90], h=1.5)
ichain('v', 4.60, [15.10, 17.15], h=1.5)

d.text(v.X(0), v.Y(0) - OFF_S[2] - 3.4, 'FAÇADE SUD', 1.6, col=GREY)
d.text(v.X(W) + OFF_E[2] + 3.0, v.Y(0), 'FAÇADE EST', 1.6, col=GREY, angle=90)
d.text(v.X(4), v.Y(D) + OFF_N[2] + 0.85, 'FAÇADE NORD', 1.6, col=GREY)
d.text(17.7, v.Y(1.2), 'FAÇADE OUEST', 1.6, col=GREY, angle=90)

# sheet title in the notch, north arrow upper right of the plan
d.text(13.5, v.Y(12) + 28, 'Plan du', 3.2, True)
d.text(13.5, v.Y(12) + 23, 'rez-de-chaussée', 3.2, True)
d.text(13.5, v.Y(12) + 17.5, 'Éch. : 1/100', 2.5)
d.north(284, v.Y(D) + 12, 11, 'arrow', 'N', 0, 2.8)

# ---- right column
CX, X0, CW = 299, 303, 104
d.line(CX, 36, CX, 287, 0.35)
y = 283
d.text(X0, y - 2.6, 'LÉGENDE', 2.6, True); y -= 7
d.rect(X0, y - 3.2, 11, 3.2, 0.1, fill=POCHE); d.text(X0 + 13.5, y - 2.5, 'Mur extérieur 35', 1.8)
d.rect(X0 + 52, y - 2.6, 11, 2, 0.1, fill=POCHE); d.text(X0 + 65.5, y - 2.5, 'Refend 20', 1.8)
y -= 5.2
d.rect(X0, y - 2.1, 11, 1.0, 0.1, fill=POCHE); d.text(X0 + 13.5, y - 2.5, 'Cloison 10', 1.8)
d.rect(X0 + 56.5, y - 2.6, 2, 2, 0.13, fill=WHITE); d.line(X0 + 56.5, y - 2.6, X0 + 58.5, y - 0.6, 0.09); d.line(X0 + 56.5, y - 0.6, X0 + 58.5, y - 2.6, 0.09)
d.text(X0 + 65.5, y - 2.5, 'Poteau lamellé-collé', 1.8)
y -= 5.2
d.circle(X0 + 5.5, y - 1.7, 1.9, 0.13, dash=(0.8, 0.6)); d.text(X0 + 13.5, y - 2.5, "ø 1,50 : espace de manœuvre, cabinet adapté", 1.8)
y -= 5.2
d.circle(X0 + 5.5, y - 1.7, 2.1, 0.13); d.text(X0 + 5.5, y - 2.3, '0,00', 1.1, align='center'); d.text(X0 + 13.5, y - 2.5, 'Niveau fini, en m', 1.8)
y -= 5.2
d.text(X0 + 5.5, y - 2.5, '93/204', 1.5, True, align='center'); d.text(X0 + 13.5, y - 2.5, 'Porte : largeur/hauteur, en cm', 1.8)
y -= 4.4
d.text(X0 + 5.5, y - 2.5, '1,40', 1.5, align='center')
d.line(X0 + 2.5, y - 3.0, X0 + 8.5, y - 3.0, 0.09)
d.text(X0 + 5.5, y - 4.9, '1,40', 1.5, align='center')
d.text(X0 + 13.5, y - 3.4, 'Fenêtre, largeur sur hauteur ; all. : allège, en cm', 1.8)
y -= 8.5

def schedule(x, y_top, widths, rows, h=1.8, rh=3.75):
    tw = sum(widths); yy = y_top
    d.line(x, yy, x + tw, yy, 0.3)
    for kind, cells in rows:
        tall = rh + (0.5 if kind in ('head', 'total') else 0)
        if kind in ('group', 'head'): d.rect(x, yy - tall, tw, tall, 0, fill='#e8ebec')
        if kind == 'total': d.rect(x, yy - tall, tw, tall, 0, fill='#d4e3e6')
        bold = kind in ('head', 'group', 'total')
        base = yy - (tall + h * 0.72) / 2
        if len(cells) == len(widths):
            cx = x
            for ci, c in enumerate(cells):
                al = 'right' if ci == len(cells) - 1 else 'left'
                d.text(cx + (widths[ci] - 1.0 if al == 'right' else 1.0), base, c, h, bold, align=al)
                if ci: d.line(cx, yy, cx, yy - tall, 0.09, GREY)
                cx += widths[ci]
        else:
            d.text(x + 1.0, base, cells[0], h, bold)
            d.text(x + tw - 1.0, base, cells[1], h, bold, align='right')
            d.line(x + tw - widths[-1], yy, x + tw - widths[-1], yy - tall, 0.09, GREY)
        yy -= tall
        heavy = kind in ('head', 'total') or kind == 'group'
        d.line(x, yy, x + tw, yy, 0.25 if kind in ('head', 'total') else 0.09, INK if heavy else GREY)
    d.line(x, y_top, x, yy, 0.13); d.line(x + tw, y_top, x + tw, yy, 0.13)
    return yy

d.text(X0, y - 2.6, 'TABLEAU DES SURFACES', 2.6, True); y -= 5
rows = [('head', ['N°', 'Nature des locaux', 'Revêtement de sol', 'Surface (m²)'])]
for g, gname in GROUPS:
    rows.append(('group', [gname, fr(SUB[g])]))
    for r in ROOMS:
        if r[7] == g: rows.append(('room', [r[0], r[1], FIN[r[6]][0], fr(area(r))]))
rows += [('sub', ['Total des locaux', fr(LOCAUX)]), ('sub', ['Murs et cloisons', fr(MURS)]), ('total', ['TOTAL SURFACE BÂTIMENT, murs inclus', fr(GROSS)])]
y = schedule(X0, y, [7, 40, 37, 20], rows)
y = d.para(X0, y - 1.3, CW, "Surfaces d’exercice, sans valeur réglementaire. Locaux : au nu intérieur des murs et cloisons, cloisons de cabinets comprises, ébrasements de portes non compris. Total : contour extérieur des murs.", 1.55, lead=1.42) - 3.4

d.text(X0, y - 2.6, 'RÉCAPITULATIF PAR REVÊTEMENT', 2.6, True); y -= 5
LOCS = {k: ', '.join(r[0] for r in ROOMS if r[6] == k) for k in FIN}
rows = [('head', ['Revêtement de sol', 'Locaux', 'Surface (m²)'])]
for k in ('P', 'C', 'S', 'B'): rows.append(('room', [FIN[k][0], LOCS[k], fr(BYFLOOR[k])]))
y_rec = y
y = schedule(X0, y, [39, 46, 19], rows, h=1.75)
for i, k in enumerate(('P', 'C', 'S', 'B')):     # finish swatch in the left margin of each row
    d.rect(X0 + 33.5, y_rec - 4.25 - 3.75 * i - 2.95, 4, 2.2, 0.09, fill=FIN[k][2])
y -= 3.6

# practice panel
TOP = y
d.rect(X0, y - 4.6, CW, 4.6, 0, fill=PETROL)
d.text(X0 + 1.6, y - 3.45, 'EXERCICE', 2.3, True, col=WHITE)
y -= 6.0
STEPS_EX = [('1', 'Étalonner sur la cote 24,00, façade sud : ligne de cote extérieure, d’une extrémité à l’autre.', '24,00 m'),
            ('2', 'Vérifier la cote 17,50, façade est : ligne de cote extérieure.', '17,50 m'),
            ('3', 'Relever la surface totale : contour extérieur des murs, 6 points.', fr(GROSS) + ' m²'),
            ('4', 'Relever le parquet (locaux 04 et 05, teinte beige) : nu intérieur des murs, 6 points.', fr(r2(poly_area(PARQUET))) + ' m²')]
for num, s, val in STEPS_EX:
    d.text(X0 + 1.6, y - 1.85, num, 1.85, True, col=PETROL)
    d.text(X0 + CW - 1.6, y - 1.85, val, 1.95, True, align='right')
    y = d.para(X0 + 5, y, CW - 22, s, 1.75, lead=1.5) - 1.9
y = d.para(X0 + 5, y - 0.2, CW - 8, 'Pas d’échelle graphique sur ce plan : l’étalonnage se fait sur une cote.', 1.55, col=GREY, lead=1.3) - 1.2
d.rect(X0, y, CW, TOP - y, 0.3, PETROL)

# not-for-works stamp, above the cartouche
SH = 21.5; SY = 39
assert y > SY + SH + 1, f'right column overruns the stamp: {y}'
d.rect(X0, SY, CW, SH, 0.5, PETROL); d.rect(X0 + 0.8, SY + 0.8, CW - 1.6, SH - 1.6, 0.13, PETROL)
sx = X0 + CW / 2
d.text(sx, SY + 16.2, 'DOCUMENT D’EXERCICE – BÂTIMENT FICTIF', 2.3, True, PETROL, 'center')
d.text(sx, SY + 12.6, 'PLAN NON CONTRACTUEL', 2.3, True, PETROL, 'center')
d.text(sx, SY + 9.0, 'NE PEUT SERVIR POUR L’EXÉCUTION DE TRAVAUX', 2.3, True, PETROL, 'center')
d.text(sx, SY + 3.8, 'Aucun professionnel en France n’a relu ce plan.', 1.85, col=INK, align='center')

# ---- cartouche: a strip along the bottom edge
Y_TOP = 36; RH = 13
d.line(10, Y_TOP, 410, Y_TOP, 0.5)
xx = 10
for w_, lab, val, vh, bold in ((116, 'OPÉRATION', 'Construction d’une salle polyvalente', 2.8, True),
                               (92, 'ADRESSE DU PROJET', 'Chemin du Pré-Long, Vauclarens (adresse fictive)', 2.1, False),
                               (76, 'MAÎTRE D’OUVRAGE', 'Commune de Vauclarens (fictive)', 2.1, False),
                               (116, 'MAÎTRE D’ŒUVRE', 'Atelier du Pré-Long, architectes (fictif)', 2.1, False)):
    d.field(xx, Y_TOP - RH, w_, RH, lab, val, 1.35, vh, bold); xx += w_
xx = 10
for w_, lab, val, vh, bold in ((96, 'TITRE DU PLAN', 'Plan du rez-de-chaussée', 2.8, True), (24, 'PHASE', 'APD', 2.4, False), (28, 'ÉCHELLE', '1/100', 2.8, True),
                               (20, 'FORMAT', 'A3', 2.4, False), (84, 'UNITÉS', 'Cotes en m (moins de 1 m : en cm)', 2.0, False), (34, 'DATE', '06-11-2026', 2.3, False),
                               (20, 'INDICE', 'A', 2.4, False), (94, 'N° DE PLAN', 'ARC 103', 3.4, True)):
    d.field(xx, Y_TOP - 2 * RH, w_, RH, lab, val, 1.35, vh, bold); xx += w_
d.text(410, 5.2, 'PolyPDF, planche d’exercice.', 1.6, col=GREY, align='right', track=False)

# ---- measuring facts
d.expect('calibrate', p0=(v.X(0), v.Y(0) - OFF_S[2]), p1=(v.X(W), v.Y(0) - OFF_S[2]), metres=W, note='printed 24,00, outer chain, south facade')
d.expect('check', p0=(v.X(W) + OFF_E[2], v.Y(0)), p1=(v.X(W) + OFF_E[2], v.Y(D)), metres=D, note='printed 17,50, outer chain, east facade')
d.expect('gross', pts=[v.P(*p) for p in FOOT], sqm=GROSS, perimeter=poly_perimeter(FOOT), note='outer wall faces, six clicks, TOTAL SURFACE BATIMENT')
d.expect('floor', pts=[v.P(*p) for p in PARQUET], sqm=poly_area(PARQUET), perimeter=poly_perimeter(PARQUET), note='parquet, rooms 04 + 05, six inner wall corners')

# ---- lettering guards: every glyph is in the font, and no dimension, extension or leader line runs through a label
for _fn in ('CAD', 'CAD-B'):
    _cmap = pdfmetrics.getFont(_fn).face.charToGlyph
    assert 0x4e00 not in _cmap, 'glyph guard has stopped discriminating'
    for *_b, _lab in d.boxes:
        _miss = {ch for ch in _lab if ord(ch) not in _cmap}
        assert not _miss, f'{_fn} has no glyph for {_miss} in {_lab!r}'
_struck = []
for x0, y0, x1, y1 in LINES:
    for bx0, by0, bx1, by1, lab in d.boxes:
        ox = min(max(x0, x1), bx1) - max(min(x0, x1), bx0)
        oy = min(max(y0, y1), by1) - max(min(y0, y1), by0)
        if ox >= 0 and oy >= 0 and (x0 == x1 and bx0 + 0.05 < x0 < bx1 - 0.05 and oy > 0.05 or y0 == y1 and by0 + 0.05 < y0 < by1 - 0.05 and ox > 0.05):
            _struck.append(f'{lab!r} at ({bx0:.1f},{by0:.1f})')
assert not _struck, f'labels struck by a line: {sorted(set(_struck))}'
d.save()
