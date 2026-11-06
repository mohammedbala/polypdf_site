#!/usr/bin/env python3
# مركز حي (neighbourhood centre), anchored on Saudi Arabia. A2 landscape, 1:100, north upright, geometry not mirrored.
# A stepped L: a long south bar and a north wing, the entrance and lobby at the knuckle, a hall at each end. Plan
# coordinates are metres from the crossing of axes 1 and A. Exterior and main walls are 0.30 and straddle their axis;
# interior walls are 0.20 and straddle theirs, so every clear dimension falls on the 0.05 grid.
# Room areas are clear, between wall faces, so that the floor trace follows lines a user can see; the spec's
# walls-included rule would have put the trace on wall centres, which are not drawn.
# Clearance: an extension line 1 mm from a corner took the app's snap in a live run, so nothing is placed within 5 mm
# (0.50 m) of a trace corner except lines ending exactly on it. Corner columns are L-shaped for that reason.
import sys, math
from pathlib import Path
from draftkit import *

OUT = Path(sys.argv[1] if len(sys.argv) > 1 else 'out'); OUT.mkdir(exist_ok=True)
register_font('AR', '../fonts/NotoSansArabic-Regular.ttf', shaped=True)
register_font('AR-B', '../fonts/NotoSansArabic-Bold.ttf', shaped=True)
fm = fmt_m(2, '.')

# ---- axes
XAX = {'1': 0.0, '2': 9.6, '3': 16.8, '4': 21.6, '5': 24.0, '6': 28.8}
YAX = {'A': 0.0, 'B': 3.6, 'C': 8.4, 'D': 12.0, 'E': 14.4, 'F': 19.2, 'G': 25.2}

# ---- outline: outer face of the walls, eight corners
FOOT = [(-0.15, -0.15), (28.95, -0.15), (28.95, 25.35), (16.65, 25.35), (16.65, 14.55), (9.45, 14.55), (9.45, 12.15), (-0.15, 12.15)]
OVER_W, OVER_D = 29.10, 25.50

# ---- walls: (x0, y0, x1, y1)
EXT = [(-0.15, -0.15, 28.95, 0.15), (28.65, -0.15, 28.95, 25.35), (16.65, 25.05, 28.95, 25.35), (16.65, 14.25, 16.95, 25.35),
       (9.45, 14.25, 21.70, 14.55), (9.45, -0.15, 9.75, 14.55), (-0.15, 11.85, 9.75, 12.15), (-0.15, -0.15, 0.15, 12.15)]
INT = [(13.10, 0.15, 13.30, 4.70), (9.75, 4.70, 16.90, 4.90), (16.70, 0.15, 16.90, 4.70), (16.90, 2.30, 23.90, 2.50), (21.50, 0.15, 21.70, 2.30),
       (23.90, 0.15, 24.10, 19.30), (24.10, 4.70, 28.65, 4.90), (24.10, 7.10, 28.65, 7.30), (9.75, 7.10, 21.70, 7.30), (14.30, 7.30, 14.50, 14.25),
       (16.70, 7.30, 16.90, 14.25), (21.50, 7.30, 21.70, 14.25), (21.50, 14.55, 21.70, 19.10), (16.90, 9.50, 21.50, 9.70), (14.50, 11.90, 16.70, 12.10),
       (16.90, 11.90, 21.50, 12.10), (19.10, 9.70, 19.30, 11.90), (16.95, 19.10, 28.65, 19.30), (24.10, 10.40, 28.65, 10.60), (24.10, 13.40, 28.65, 13.60),
       (24.10, 16.70, 28.65, 16.90), (26.30, 16.90, 26.50, 19.10)]

# ---- floor finishes: key, Arabic, swatch
FIN = {'GR': ('جرانيت', '#e6cf9c'), 'PO': ('بورسلين', '#f1efe7'), 'VI': ('فينيل', '#d8e6ea'),
       'CA': ('سجاد مصلى', '#e8d0c6'), 'CE': ('سيراميك مانع للانزلاق', '#d3e4dd'), 'EP': ('دهان إيبوكسي', '#dcdddf')}

# ---- rooms: number, name, finish, clear rectangle (x0, y0, x1, y1) between wall faces
ROOMS = [
    ('01', 'صالة الأنشطة متعددة الأغراض', 'VI', (0.15, 0.15, 9.45, 11.85)),
    ('02', 'غرفة الاجتماعات', 'PO', (9.75, 0.15, 13.10, 4.70)),
    ('03', 'مكتب المدير', 'PO', (13.30, 0.15, 16.70, 4.70)),
    ('04', 'المدخل الرئيسي', 'CE', (16.90, 0.15, 21.50, 2.30)),
    ('05', 'غرفة الأمن والاتصالات', 'PO', (21.70, 0.15, 23.90, 2.30)),
    ('06', 'بهو الاستقبال والانتظار', 'GR', (16.90, 2.50, 23.90, 7.10)),
    ('07', 'ممر الصالة', 'PO', (9.75, 4.90, 16.90, 7.10)),
    ('08', 'الممر الشمالي', 'PO', (21.70, 7.10, 23.90, 19.10)),
    ('09', 'صالة القراءة', 'PO', (24.10, 0.15, 28.65, 4.70)),
    ('10', 'مكتب الإدارة', 'PO', (24.10, 4.90, 28.65, 7.10)),
    ('11', 'كافيتيريا', 'PO', (9.75, 7.30, 14.30, 14.25)),
    ('12', 'مطبخ', 'CE', (14.50, 7.30, 16.70, 11.90)),
    ('13', 'مستودع', 'EP', (14.50, 12.10, 16.70, 14.25)),
    ('14', 'مخزن المطبخ', 'EP', (16.90, 9.70, 19.10, 11.90)),
    ('15', 'دورات مياه الرجال', 'CE', (16.90, 7.30, 21.50, 9.50)),
    ('16', 'دورة مياه لذوي الإعاقة', 'CE', (19.30, 9.70, 21.50, 11.90)),
    ('17', 'دورات مياه النساء', 'CE', (16.90, 12.10, 21.50, 14.25)),
    ('18', 'غرفة الأطفال', 'VI', (16.95, 14.55, 21.50, 19.10)),
    ('19', 'قاعة النساء', 'VI', (16.95, 19.30, 28.65, 25.05)),
    ('20', 'مصلى الرجال', 'CA', (24.10, 7.30, 28.65, 10.40)),
    ('21', 'منطقة الوضوء', 'CE', (24.10, 10.60, 28.65, 13.40)),
    ('22', 'مصلى النساء', 'CA', (24.10, 13.60, 28.65, 16.70)),
    ('23', 'دورة مياه لذوي الإعاقة', 'CE', (24.10, 16.90, 26.30, 19.10)),
    ('24', 'غرفة الكهرباء والمضخات', 'EP', (26.50, 16.90, 28.65, 19.10)),
]
ROOM = {r[0]: r for r in ROOMS}
def rw(r): return r[3][2] - r[3][0]
def rd(r): return r[3][3] - r[3][1]
def hund(w_, d_):
    """Area in hundredths of a square metre, rounded half up from whole square millimetres, so no float drift."""
    return (round(w_ * 1000) * round(d_ * 1000) + 5000) // 10000
def m2(h): return f'{h // 100}.{h % 100:02d}'
AREA = {r[0]: hund(rw(r), rd(r)) for r in ROOMS}

# The rooms and the solid walls must fill the outline exactly.
_solid = Region()
for w_ in EXT + INT: _solid.add(*w_)
_wall_rects = [(a, b, c - a, e - b) for a, b, c, e in _solid.rects()]
check_tiling([(r[3][0], r[3][1], rw(r), rd(r)) for r in ROOMS] + _wall_rects, FOOT)
GROSS = round(poly_area(FOOT) * 100)
NET = sum(AREA.values())
WALLS = GROSS - NET
BYFIN = {k: sum(AREA[r[0]] for r in ROOMS if r[2] == k) for k in FIN}
assert (GROSS, NET, WALLS) == (53757, 47385, 6372), (GROSS, NET, WALLS)
assert BYFIN == {'GR': 3220, 'PO': 13990, 'VI': 19679, 'CA': 2822, 'CE': 6244, 'EP': 1430}, BYFIN
assert sum(BYFIN.values()) == NET
assert abs(max(p[0] for p in FOOT) - min(p[0] for p in FOOT) - OVER_W) < 1e-9 and abs(max(p[1] for p in FOOT) - min(p[1] for p in FOOT) - OVER_D) < 1e-9
assert abs(29.10 * 12.30 + 19.50 * 2.40 + 12.30 * 10.80 - poly_area(FOOT)) < 1e-6

# The floor trace: the granite lobby, one rectangle of drawn lines.
FLOOR = [(16.90, 2.50), (23.90, 2.50), (23.90, 7.10), (16.90, 7.10)]
assert abs(poly_area(FLOOR) * 100 - BYFIN['GR']) < 1e-6
assert [r[0] for r in ROOMS if r[2] == 'GR'] == ['06']

# ---- openings
B = Building()
for w_ in EXT: B.wall(*w_, 'ext')
for w_ in INT: B.wall(*w_, 'int')
Sy, Wx, Ex, Nt, Nm, Nl = (-0.15, 0.15), (-0.15, 0.15), (28.65, 28.95), (25.05, 25.35), (14.25, 14.55), (11.85, 12.15)
X96, X168E, X168, X144, X216, X24 = (9.45, 9.75), (16.65, 16.95), (16.70, 16.90), (14.30, 14.50), (21.50, 21.70), (23.90, 24.10)
Y24, Y48, Y72, Y192 = (2.30, 2.50), (4.70, 4.90), (7.10, 7.30), (19.10, 19.30)
OW = {'ب1': 1.80, 'ب2': 0.90, 'ب3': 0.70, 'ن1': 2.40, 'ن2': 1.20, 'ن3': 0.90, 'ف1': 1.20}
COUNT = dict.fromkeys(OW, 0)
def DOOR(mark, axis, at, wall, hinge, swing):
    B.door(axis, at, OW[mark], wall, hinge, swing); COUNT[mark] += 1
def WIN(mark, axis, at, wall, glass=2):
    B.window(axis, at, OW[mark], wall, glass=glass); COUNT[mark] += 1
DOOR('ب1', 'h', 18.30, Sy, 'both', -1)      # main door, opens outward onto the landing
DOOR('ب1', 'h', 18.30, Y24, 'both', 1)      # entrance to lobby
DOOR('ب1', 'v', 5.10, Wx, 'both', -1)       # hall 01, second exit
DOOR('ب1', 'v', 5.10, X96, 'both', 1)       # hall 01 from corridor 07
DOOR('ب1', 'h', 11.20, Y72, 'both', 1)      # cafeteria
DOOR('ب1', 'h', 21.90, Y192, 'both', 1)     # hall 19 from corridor 08
DOOR('ب1', 'v', 21.30, X168E, 'both', -1)   # hall 19, second exit
DOOR('ب2', 'h', 11.00, Y48, 'a', -1)        # meeting room
DOOR('ب2', 'h', 15.20, Y48, 'b', -1)        # director
DOOR('ب2', 'h', 22.30, Y24, 'b', 1)         # security, opens into the lobby to leave the small room clear
DOOR('ب2', 'v', 3.80, X24, 'b', 1)          # reading room
DOOR('ب2', 'v', 5.30, X24, 'a', 1)          # administration
DOOR('ب2', 'h', 15.10, Y72, 'b', 1)         # kitchen
DOOR('ب2', 'v', 12.60, X144, 'b', 1)        # store, from the cafeteria
DOOR('ب2', 'v', 10.80, X168, 'a', 1)        # kitchen store
DOOR('ب2', 'v', 7.30, X216, 'a', -1)        # men's toilets
DOOR('ب2', 'v', 10.30, X216, 'b', 1)        # accessible toilet, opens outward
DOOR('ب2', 'v', 12.70, X216, 'b', -1)       # women's toilets
DOOR('ب2', 'v', 16.20, X216, 'a', -1)       # children's room
DOOR('ب2', 'v', 8.70, X24, 'a', 1)          # prayer room 20
DOOR('ب2', 'v', 12.30, X24, 'b', 1)         # ablution
DOOR('ب2', 'v', 15.00, X24, 'b', 1)         # prayer room 22
DOOR('ب2', 'v', 17.40, X24, 'a', -1)        # accessible toilet, opens outward
DOOR('ب2', 'v', 17.40, Ex, 'a', 1)          # plant, from outside only
for a in (1.20, 6.00, 25.20): WIN('ن1', 'h', a, Sy)
for a in (0.60, 8.85): WIN('ن1', 'v', a, Wx)
for a in (1.20, 6.00): WIN('ن1', 'h', a, Nl)
WIN('ن1', 'h', 10.80, Nm); WIN('ن1', 'v', 15.60, X168E); WIN('ن1', 'v', 20.90, Ex)
for a in (18.00, 25.20): WIN('ن1', 'h', a, Nt)
for a in (10.85, 14.40, 22.20): WIN('ن2', 'h', a, Sy)
WIN('ن2', 'h', 22.20, Nt)
for a in (1.40, 5.40, 8.80, 14.90): WIN('ن2', 'v', a, Ex)
WIN('ن3', 'h', 15.15, Nm); WIN('ن3', 'v', 10.75, Ex)
WIN('ف1', 'v', 9.00, X144, glass=1)         # serving hatch, kitchen to cafeteria

# ---- columns. Rectangles sit inside the walls, flush with their faces; one stands free in the lobby.
def Lcol(cx, cy, sx, sy, a=0.60, t=0.30):
    return [(cx, cy), (cx + sx * a, cy), (cx + sx * a, cy + sy * t), (cx + sx * t, cy + sy * t), (cx + sx * t, cy + sy * a), (cx, cy + sy * a)]
LCOLS = [Lcol(-0.15, -0.15, 1, 1), Lcol(28.95, -0.15, -1, 1), Lcol(28.95, 25.35, -1, -1), Lcol(16.65, 25.35, 1, -1), Lcol(9.45, 14.55, 1, -1), Lcol(-0.15, 12.15, 1, -1)]
RCOLS = [(x - 0.30, -0.15, x + 0.30, 0.15) for x in (9.6, 16.8, 21.6, 24.0)] + \
        [(x - 0.30, 25.05, x + 0.30, 25.35) for x in (21.6, 24.0)] + \
        [(-0.15, y - 0.30, 0.15, y + 0.30) for y in (3.6, 8.4)] + \
        [(9.45, y - 0.30, 9.75, y + 0.30) for y in (3.6, 8.4)] + [(9.45, 11.25, 9.75, 12.75)] + \
        [(16.70, y - 0.15, 16.90, y + 0.15) for y in (3.6, 8.4, 12.0)] + [(16.10, 14.25, 17.25, 14.55), (16.65, 18.90, 16.95, 19.50)] + \
        [(21.50, y - 0.15, 21.70, y + 0.15) for y in (8.4, 12.0, 14.4)] + [(21.45, 19.10, 21.75, 19.30)] + \
        [(23.90, y - 0.15, 24.10, y + 0.15) for y in (3.6, 8.4, 12.0, 14.4)] + [(23.75, 19.10, 24.25, 19.30)] + \
        [(28.65, y - 0.30, 28.95, y + 0.30) for y in (3.6, 8.4, 12.0, 14.4, 19.2)]
FREE = [(21.45, 3.45, 21.75, 3.75)]

_cut = B.region().rects()
def _in_walls(x, y):
    return any(r[0] - 1e-9 <= x <= r[2] + 1e-9 and r[1] - 1e-9 <= y <= r[3] + 1e-9 for r in _cut)
def _rect_in_walls(q):
    return all(_in_walls(q[0] + (q[2] - q[0]) * (i + 0.5) / 12, q[1] + (q[3] - q[1]) * (j + 0.5) / 12) for i in range(12) for j in range(12))
for q in RCOLS: assert _rect_in_walls(q), ('column off the wall or in an opening', q)
for p in LCOLS:
    xs, ys = [v[0] for v in p], [v[1] for v in p]
    sx, sy = (1 if p[1][0] > p[0][0] else -1), (1 if p[-1][1] > p[0][1] else -1)
    for q in ((min(xs), min(p[0][1], p[0][1] + sy * 0.3), max(xs), max(p[0][1], p[0][1] + sy * 0.3)),
              (min(p[0][0], p[0][0] + sx * 0.3), min(ys), max(p[0][0], p[0][0] + sx * 0.3), max(ys))):
        assert _rect_in_walls(q), ('corner column off the wall', q)

# ---- clearance: every drawn vertex that is not the wall's own corner stays 5 mm from every trace corner
TRACE = FOOT + FLOOR
_wall_corners = {(round(a, 3), round(b, 3)) for e in _solid.edges() for a, b in e}
def _jambs(o):
    a, b = o['at'], o['at'] + o['w']; w0, w1 = o['wall']
    return [(a, w0), (a, w1), (b, w0), (b, w1)] if o['axis'] == 'h' else [(w0, a), (w1, a), (w0, b), (w1, b)]
def clear_of_trace(pts, what):
    for p in pts:
        for t in TRACE:
            dist = math.dist(p, t)
            assert dist < 1e-9 or dist >= 0.50 - 1e-9 or (round(p[0], 3), round(p[1], 3)) in _wall_corners, (what, p, 'is', round(dist * 10, 2), 'mm from', t)
for o in B.openings: clear_of_trace(_jambs(o), 'opening')
for q in RCOLS + FREE: clear_of_trace([(q[0], q[1]), (q[2], q[1]), (q[0], q[3]), (q[2], q[3])], 'column')
for p in LCOLS: clear_of_trace(p, 'corner column')

# ---- door checks: no two swings overlap, and every room can be reached
def _open_rect(o):
    a, b = o['at'], o['at'] + o['w']; w0, w1 = o['wall']
    return (a, w0, b, w1) if o['axis'] == 'h' else (w0, a, w1, b)
def _overlap(p, q): return min(p[2], q[2]) - max(p[0], q[0]) > 1e-6 and min(p[3], q[3]) - max(p[1], q[1]) > 1e-6
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
def _room_at(x, y):
    for r in ROOMS:
        q = r[3]
        if q[0] < x < q[2] and q[1] < y < q[3]: return r[0]
    return 'OUT'
_links = {('06', '07'), ('06', '08')}
for o in _doors:
    m_, w0, w1 = o['at'] + o['w'] / 2, o['wall'][0] - 0.05, o['wall'][1] + 0.05
    a_, b_ = (_room_at(m_, w0), _room_at(m_, w1)) if o['axis'] == 'h' else (_room_at(w0, m_), _room_at(w1, m_))
    assert a_ != b_, o
    _links.add((a_, b_))
_seen, _todo = {'OUT'}, ['OUT']
while _todo:
    n_ = _todo.pop()
    for a_, b_ in _links:
        for u_, t_ in ((a_, b_), (b_, a_)):
            if u_ == n_ and t_ not in _seen: _seen.add(t_); _todo.append(t_)
assert _seen == {'OUT'} | set(ROOM), set(ROOM) - _seen
# 1:20 ramp along the south wall: 0.15 of rise over 3.00 of run
RAMP_X0, RAMP_X1, LAND_X0, LAND_Y = 21.00, 24.00, 17.40, -1.65
assert abs((RAMP_X1 - RAMP_X0) / 0.15 - 20) < 1e-9

# ---- sheet
PW, PH = 594, 420
d = Doc(OUT / 'ar.pdf', (PW, PH), 'لوحة تدريبية. مركز حي المثال، مسقط الدور الأرضي، مقياس الرسم 1:100 (A2)',
        subject='لوحة تدريبية افتراضية من PolyPDF. لا تُستخدم للتنفيذ', keywords='لوحة تدريبية, مسقط الدور الأرضي, جدول المساحات, إجمالي مساحة البناء')
d.use_script('arabic', 'AR', 'AR-B', rtl=True)
d.frame(20, 10, 584, 410)
BAND, CX = 80, 394
d.line(20, BAND, CX, BAND, 0.35); d.line(CX, 10, CX, 410, 0.35)
v = View(d, 60, 142.5, 100)
FUR, FX = '#8a9196', '#3f464b'
def L(s): return [(s, False)]     # a purely left-to-right figure, kept whole: a sign stays in front of its digits

# -- tints first, right up to the wall faces
for n_, name_, key_, q in ROOMS: v.fill(q[0], q[1], q[2], q[3], FIN[key_][1])

# -- furniture, thin and light
def chair(x, y, s=0.40): v.rectm(x - s / 2, y - s / 2, x + s / 2, y + s / 2, 0.09, FUR)
for y in (0.95, 1.80, 2.65, 3.50):
    for x0 in (1.05, 5.30):
        for i in range(7): chair(x0 + i * 0.52, y)
v.table_chairs(11.00, 0.60, 1.00, 2.05, 0, 3, FUR)                       # meeting table
v.rectm(14.10, 0.75, 15.90, 1.45, 0.09, FUR); chair(15.00, 1.75)         # director's desk
v.rectm(24.10, 0.30, 24.45, 3.55, 0.09, FUR)                             # reading room shelves
v.table_chairs(25.45, 0.85, 1.70, 0.70, 2, 0, FUR)
v.rectm(27.75, 5.15, 28.45, 6.85, 0.09, FUR); chair(27.45, 6.00)         # administration desk
v.rectm(16.90, 3.10, 17.35, 4.30, 0.09, FUR)                             # waiting bench
for x, y in ((11.00, 9.30), (13.05, 9.30), (11.00, 13.05), (13.05, 13.05)): v.table_chairs(x - 0.40, y - 0.40, 0.80, 0.80, 1, 1, FUR)
for x, y in ((18.10, 15.65), (18.10, 18.20)):
    v.circlem(x, y, 0.42, 0.09, FUR)
    for dx, dy in ((-0.66, 0), (0.66, 0)): v.circlem(x + dx, y + dy, 0.16, 0.09, FUR)
for x in (18.10, 25.60):
    for y in (20.45, 23.25): v.table_chairs(x, y, 1.80, 0.70, 2, 0, FUR)

# -- walls, doors, windows
v.draw(B, {'ext': '#50565b', 'int': '#b4b9bd'}, lw=0.3, door_lw=0.22, arc_lw=0.11)
def _on_foot(p, q):
    for i in range(len(FOOT)):
        a, b = FOOT[i], FOOT[(i + 1) % len(FOOT)]
        if a[1] == b[1] == p[1] == q[1] and min(a[0], b[0]) - 1e-6 <= min(p[0], q[0]) and max(p[0], q[0]) <= max(a[0], b[0]) + 1e-6: return True
        if a[0] == b[0] == p[0] == q[0] and min(a[1], b[1]) - 1e-6 <= min(p[1], q[1]) and max(p[1], q[1]) <= max(a[1], b[1]) + 1e-6: return True
    return False
for p, q in B.region().edges():         # the heavy outline is the gross trace
    if _on_foot(p, q): d.line(v.X(p[0]), v.Y(p[1]), v.X(q[0]), v.Y(q[1]), 0.7, INK, cap=2)
for o in _doors:                        # outer doors close the outline with a thin threshold
    if o['wall'] in (Sy, Ex):
        f_ = o['wall'][0] if o['wall'] == Sy else o['wall'][1]
        if o['axis'] == 'h': v.linem(o['at'], f_, o['at'] + o['w'], f_, 0.18, INK)
        else: v.linem(f_, o['at'], f_, o['at'] + o['w'], 0.18, INK)
    elif o['wall'] == X168E: v.linem(16.65, o['at'], 16.65, o['at'] + o['w'], 0.18, INK)
# the edges of the granite where the lobby opens to the two corridors: a finish change, and part of the floor trace
v.linem(16.90, 4.90, 16.90, 7.10, 0.25, INK); v.linem(21.70, 7.10, 23.90, 7.10, 0.25, INK)
# -- columns on top
for p in LCOLS: d.poly([v.P(*q) for q in p], True, 0, fill=INK)
for q in RCOLS + FREE: d.rect(v.X(q[0]), v.Y(q[1]), (q[2] - q[0]) * v.k, (q[3] - q[1]) * v.k, 0, fill=INK)

# -- fittings
def cubicle(xf, y0, y1, door_at, hinge, x_wall):
    """WC cubicle against the west wall of a toilet room: light front, 0.70 door opening inward."""
    COUNT['ب3'] += 1
    v.linem(xf, y0, xf, door_at, 0.2, FX); v.linem(xf, door_at + OW['ب3'], xf, y1, 0.2, FX)
    v._door(dict(axis='v', at=door_at, w=OW['ب3'], wall=(xf, xf), hinge=hinge, swing=-1, kind='swing'), 0.18, 0.09, FX)
    v.wc(x_wall, (y0 + y1) / 2, 'e', FX)
def wheelchair(x, y, s=2.2):
    """Plain wheelchair pictogram, sheet mm."""
    d.circle(x - 0.34 * s, y + 1.02 * s, 0.14 * s, 0, fill=INK)
    d.line(x - 0.34 * s, y + 0.82 * s, x - 0.34 * s, y + 0.22 * s, 0.3)
    d.line(x - 0.34 * s, y + 0.58 * s, x + 0.12 * s, y + 0.58 * s, 0.25)
    d.line(x - 0.34 * s, y + 0.22 * s, x + 0.26 * s, y + 0.22 * s, 0.3)
    d.line(x + 0.26 * s, y + 0.22 * s, x + 0.52 * s, y - 0.34 * s, 0.3)
    d.line(x + 0.52 * s, y - 0.34 * s, x + 0.76 * s, y - 0.34 * s, 0.3)
    d.arc(x - 0.2 * s, y - 0.1 * s, 0.5 * s, 105, 270, 0.3)
# men's toilets
v.linem(16.90, 8.40, 18.40, 8.40, 0.2, FX)
cubicle(18.40, 7.30, 8.40, 7.50, 'a', 16.90); cubicle(18.40, 8.40, 9.50, 8.60, 'a', 16.90)
for x in (19.10, 19.85): v.basin(x, 7.30, 'n', FX)
# women's toilets
v.linem(16.90, 13.175, 18.40, 13.175, 0.2, FX)
cubicle(18.40, 12.10, 13.175, 12.29, 'a', 16.90); cubicle(18.40, 13.175, 14.25, 13.365, 'a', 16.90)
for x in (19.10, 19.85): v.basin(x, 14.25, 's', FX)
# accessible toilets, with the 1.50 turning circle
v.wc(19.30, 11.40, 'e', FX); v.basin(20.85, 11.90, 's', FX); v.linem(19.35, 11.05, 19.95, 11.05, 0.18, FX); v.linem(19.35, 11.84, 20.05, 11.84, 0.18, FX)
v.circlem(20.70, 10.60, 0.75, 0.13, INK, dash=(1.4, 1.0))
v.wc(26.30, 18.60, 'w', FX); v.basin(25.70, 16.90, 'n', FX); v.linem(25.55, 19.04, 26.25, 19.04, 0.18, FX); v.linem(25.65, 18.25, 26.25, 18.25, 0.18, FX)
v.circlem(24.90, 17.95, 0.75, 0.13, INK, dash=(1.4, 1.0))
# ablution: low seats with a tap on the wall in front of each
for x in (26.75, 27.45, 28.15):
    v.rectm(x - 0.10, 10.60, x + 0.10, 10.72, 0.13, FX); v.circlem(x, 11.05, 0.15, 0.13, FX)
    v.rectm(x - 0.10, 13.28, x + 0.10, 13.40, 0.13, FX); v.circlem(x, 12.95, 0.15, 0.13, FX)
# kitchen
v.rectm(16.10, 8.30, 16.70, 10.70, 0.13, FX); v.rectm(16.20, 8.55, 16.60, 9.25, 0.09, FX)
for y in (9.65, 10.20): v.circlem(16.40, y, 0.14, 0.09, FX)
v.rectm(14.50, 11.30, 15.85, 11.90, 0.13, FX)
v.rectm(14.50, 8.95, 14.80, 10.25, 0.13, FX)                             # serving shelf at the hatch
v.rectm(21.95, 0.20, 23.65, 0.62, 0.09, FUR)                             # security desk
v.rectm(18.65, 9.75, 19.05, 11.85, 0.09, FUR)                            # kitchen store shelves
v.rectm(26.55, 17.00, 26.85, 19.00, 0.13, FX)                            # switchboard wall
v.rectm(20.40, 2.50, 22.10, 3.10, 0.18, INK)                             # reception counter
d.text(v.X(21.25), v.Y(2.50) + 1.9, 'الاستقبال', 1.7, align='center')

# -- outside the footprint: entrance landing, one step, ramp along the wall, stoops at the other outer doors
v.rectm(LAND_X0, LAND_Y, RAMP_X0, -0.15, 0.18, INK)
v.rectm(LAND_X0, LAND_Y - 0.30, RAMP_X0, LAND_Y, 0.13, INK)
v.ramp(RAMP_X0, LAND_Y, RAMP_X1, -0.15, 'w', None, 1.8, 0.18, INK)
v.rectm(-1.35, 4.95, -0.15, 7.05, 0.18, INK); v.rectm(-1.65, 4.95, -1.35, 7.05, 0.13, INK)
v.rectm(15.45, 21.00, 16.65, 23.40, 0.18, INK); v.rectm(15.15, 21.00, 15.45, 23.40, 0.13, INK)
v.rectm(28.95, 17.25, 29.85, 18.45, 0.18, INK)

# -- room tags: name, number, area
def tag(n, x, y, name, hn=1.8, hs=1.6, lead=1.5, ha=None):
    # Arabic sits deep and tall on the line, so the lead never drops below 1.5 and no mark touches the line above
    rows = [(t, hn, True) for t in name] + [(n, hs, False), (f'{m2(AREA[n])} م²', ha or hs, False)]
    v.tag(x, y, rows, lead=max(lead, 1.5))
tag('01', 4.80, 8.55, ['صالة الأنشطة', 'متعددة الأغراض'], 3.2, 2.0, 1.5, 2.5)
tag('02', 11.42, 3.20, ['غرفة الاجتماعات'], 1.75, 1.5)
tag('03', 15.00, 2.85, ['مكتب المدير'], 1.9, 1.6)
tag('04', 19.20, 1.22, ['المدخل الرئيسي'], 2.0, 1.7)
tag('05', 22.80, 1.58, ['غرفة الأمن', 'والاتصالات'], 1.55, 1.45, 1.4)
tag('06', 19.45, 5.25, ['بهو الاستقبال', 'والانتظار'], 2.4, 1.8, 1.45, 2.1)
tag('07', 13.70, 6.00, ['ممر الصالة'], 1.8, 1.6)
tag('08', 22.80, 14.70, ['الممر', 'الشمالي'], 1.75, 1.6)
tag('09', 26.75, 3.20, ['صالة القراءة'], 2.0, 1.7)
tag('10', 26.10, 6.00, ['مكتب الإدارة'], 1.8, 1.6)
tag('11', 12.02, 11.17, ['كافيتيريا'], 2.8, 1.9, 1.45, 2.2)
tag('12', 15.45, 10.05, ['مطبخ'], 1.8, 1.5)
tag('13', 16.04, 13.15, ['مستودع'], 1.6, 1.4)
tag('14', 17.76, 10.22, ['مخزن المطبخ'], 1.5, 1.4, 1.34)
tag('15', 19.75, 8.76, ['دورات مياه الرجال'], 1.6, 1.45, 1.34)
tag('17', 19.50, 13.00, ['دورات مياه النساء'], 1.6, 1.45, 1.36)
tag('18', 19.65, 17.70, ['غرفة الأطفال'], 2.0, 1.7)
tag('19', 22.80, 22.55, ['قاعة النساء'], 3.2, 2.0, 1.45, 2.5)
tag('20', 27.00, 8.85, ['مصلى الرجال'], 2.1, 1.7)
tag('21', 27.45, 12.00, ['منطقة الوضوء'], 1.7, 1.5, 1.34)
tag('22', 27.00, 15.40, ['مصلى النساء'], 2.1, 1.7)
tag('24', 27.72, 17.95, ['غرفة الكهرباء', 'والمضخات'], 1.5, 1.4, 1.36)
def access(n, cx, cy):
    """Accessible toilet: pictogram, number and area inside the turning circle; the full name is in the schedule."""
    wheelchair(v.X(cx) - 0.3, v.Y(cy) + 1.9)
    d.text(v.X(cx), v.Y(cy) - 1.9, n, 1.6, align='center')
    d.text(v.X(cx), v.Y(cy) - 4.5, f'{m2(AREA[n])} م²', 1.5, align='center')
access('16', 20.70, 10.60); access('23', 24.90, 17.95)

# -- opening marks
def mk(s, x, y, align='center', h=1.7): d.text(v.X(x), v.Y(y), s, h, align=align)
mk('ب1', 17.85, -0.82); mk('ب1', 19.20, 3.55); mk('ب1', 0.32, 5.90, 'left'); mk('ب1', 9.32, 5.90, 'right')
mk('ب1', 12.10, 8.35); mk('ب1', 22.80, 20.35); mk('ب1', 17.15, 22.10, 'left')
mk('ب2', 11.45, 5.13); mk('ب2', 15.65, 5.13); mk('ب2', 22.75, 3.55); mk('ب2', 23.68, 4.15, 'right'); mk('ب2', 23.68, 5.65, 'right')
mk('ب2', 15.55, 6.72); mk('ب2', 14.12, 13.30, 'right'); mk('ب2', 16.62, 11.10, 'right'); mk('ب2', 21.92, 7.65, 'left')
mk('ب2', 22.72, 10.65, 'left'); mk('ب2', 21.92, 13.05, 'left'); mk('ب2', 21.92, 16.55, 'left'); mk('ب2', 23.68, 9.05, 'right')
mk('ب2', 23.68, 12.65, 'right'); mk('ب2', 23.68, 15.35, 'right'); mk('ب2', 22.88, 17.75, 'right')
mk('ب2', 29.40, 18.62)
mk('مخرج طوارئ', 0.32, 5.38, 'left', 1.9); mk('مخرج طوارئ', 17.15, 21.68, 'left', 1.9)
for x, y in ((18.48, 7.72), (18.48, 8.84), (18.48, 12.52), (18.48, 13.58)): mk('ب3', x, y, 'left', 1.45)
for x, s in ((2.40, 'ن1'), (7.20, 'ن1'), (11.45, 'ن2'), (15.00, 'ن2'), (26.40, 'ن1')): d.text(v.X(x), v.Y(-0.15) - 3.4, s, 1.7, align='center')
mk('ن2', 22.80, 0.70)
for y, s in ((1.80, 'ن1'), (10.05, 'ن1')): d.text(v.X(-0.15) - 1.3, v.Y(y) - 0.8, s, 1.7, align='right')
for x in (2.40, 7.20): d.text(v.X(x), v.Y(12.15) + 1.2, 'ن1', 1.7, align='center')
d.text(v.X(12.00), v.Y(14.55) + 1.2, 'ن1', 1.7, align='center'); d.text(v.X(15.60), v.Y(14.55) + 1.2, 'ن3', 1.7, align='center')
d.text(v.X(16.65) - 1.3, v.Y(16.80) - 0.8, 'ن1', 1.7, align='right')
for x, s in ((19.20, 'ن1'), (22.80, 'ن2'), (26.40, 'ن1')): d.text(v.X(x), v.Y(25.35) + 1.2, s, 1.7, align='center')
for y, s in ((2.00, 'ن2'), (6.00, 'ن2'), (9.40, 'ن2'), (11.20, 'ن3'), (15.50, 'ن2'), (22.10, 'ن1')): d.text(v.X(28.95) + 1.3, v.Y(y) - 0.8, s, 1.7)
mk('ف1', 14.12, 9.80, 'right')

# -- levels and the ramp
def lvl(x, y, val, h=1.7):
    """Triangle and leader, with the word on the right of the figure."""
    px, py = v.X(x), v.Y(y)
    word = 'منسوب'; w1, w2 = d.width(word, h), d.width(L(val), h)
    d.poly([(px, py), (px - 0.9, py + 1.5), (px + 0.9, py + 1.5)], True, 0.13, INK, fill=INK)
    d.line(px - 1.2, py + 1.5, px + 1.2 + w1 + w2 + 1.0, py + 1.5, 0.09)
    d.text(px + 1.2 + w1 + w2 + 1.0, py + 2.0, word, h, align='right')
    d.text(px + 1.2, py + 2.0, L(val), h)
lvl(22.00, 6.30, '+0.15'); lvl(1.35, 6.05, '+0.15'); lvl(24.45, -1.05, '±0.00')
d.text(v.X(19.20) + 0.5, v.Y(-1.60), 'بسطة', 1.6, align='left')
d.text(v.X(19.20) - 0.5, v.Y(-1.60), L('+0.15'), 1.6, align='right')
d.text(v.X(22.50), v.Y(-0.80), 'منحدر 1:20', 1.9, align='center')
wheelchair(v.X(22.45), v.Y(-1.40), 1.4)

# -- dimension chains. Innermost: rooms and walls. Middle: axis bays. Outer: overall.
OB, OR_ = (24.5, 32.0, 39.5), (14.0, 22.0, 30.0)
XS, YS = list(XAX.values()), list(YAX.values())
rS = [-0.15, 0.15, 9.45, 9.75, 13.10, 13.30, 16.70, 16.90, 21.50, 21.70, 23.90, 24.10, 28.65, 28.95]
rE = [-0.15, 0.15, 4.70, 4.90, 7.10, 7.30, 10.40, 10.60, 13.40, 13.60, 16.70, 16.90, 19.10, 19.30, 25.05, 25.35]
assert abs(sum(rS[i + 1] - rS[i] for i in range(len(rS) - 1)) - OVER_W) < 1e-9 and abs(sum(rE[i + 1] - rE[i] for i in range(len(rE) - 1)) - OVER_D) < 1e-9
def spans(st):
    """Span labels, with the two end walls lettered just past the chain's ends, clear of the strokes."""
    labs = [fm(st[i + 1] - st[i]) for i in range(len(st) - 1)]
    a, b = labs[0], labs[-1]; labs[0] = labs[-1] = ''
    # a wall is narrower than its figure, so its figure goes on the far side of the line, clear of its extension lines
    short = [((st[i] + st[i + 1]) / 2, labs[i]) for i in range(len(labs)) if labs[i] and st[i + 1] - st[i] < 0.5]
    return [('' if st[i + 1] - st[i] < 0.5 else labs[i]) for i in range(len(labs))], a, b, short
S_FACE, E_FACE = v.Y(-0.15), v.X(28.95)
labs, a_, b_, short_ = spans(rS)
v.chain('b', rS, OB[0], -0.15, fm, 1.8, 'tick', labels=labs, ext_from=OB[0] - 3, ext_over=1.0)
for s in rS:      # the landing and ramp sit between the wall and this chain, so those few lines stop short of them
    if s < 17.2 or s > 24.05: d.line(v.X(s), S_FACE - 6, v.X(s), S_FACE - OB[0] + 3, 0.13)
d.text(v.X(-0.15) - 1.6, S_FACE - OB[0] + 0.7, a_, 1.8, align='right'); d.text(v.X(28.95) + 1.6, S_FACE - OB[0] + 0.7, b_, 1.8)
for m_, t_ in short_: d.text(v.X(m_), S_FACE - OB[0] - 3.1, t_, 1.6, align='center')
v.chain('b', XS, OB[1], -0.15, fm, 2.0, 'tick', ext_from=OB[0] + 4)
labs, a_, b_, short_ = spans(rE)
v.chain('r', rE, OR_[0], 28.95, fm, 1.8, 'tick', labels=labs, ext_from=10.5, ext_over=1.0)
for s in rE:
    if not 17.0 < s < 18.7: d.line(E_FACE + 6, v.Y(s), E_FACE + 10.5, v.Y(s), 0.13)
d.text(E_FACE + OR_[0] - 0.7, v.Y(-0.15) - 1.6, a_, 1.8, align='right', angle=90); d.text(E_FACE + OR_[0] - 0.7, v.Y(25.35) + 1.6, b_, 1.8, angle=90)
for m_, t_ in short_: d.text(E_FACE + OR_[0] + 3.1, v.Y(m_), t_, 1.6, align='center', angle=90)
v.chain('r', YS, OR_[1], 28.95, fm, 2.0, 'tick', ext_from=OR_[0] + 4)
# the two overall chains are what the user clicks: no tick and no overshoot, and the line, the extension lines and the
# arrow tips all end exactly on the two points; everything else stays at least 5 mm from them
ARROW = 5.6
def tip(px, py, dx, dy):
    nx, ny = -dy * 0.34, dx * 0.34
    d.poly([(px, py), (px + dx * ARROW + nx, py + dy * ARROW + ny), (px + dx * ARROW - nx, py + dy * ARROW - ny)], True, 0, fill=INK)
CAL_Y, CHK_X = S_FACE - OB[2], E_FACE + OR_[2]
v.chain('b', [-0.15, 28.95], OB[2], -0.15, fm, 2.6, 'none', ext_from=OB[2] - 5.5, ext_over=0)
tip(v.X(-0.15), CAL_Y, 1, 0); tip(v.X(28.95), CAL_Y, -1, 0)
v.chain('r', [-0.15, 25.35], OR_[2], 28.95, fm, 2.6, 'none', ext_from=OR_[2] - 5.5, ext_over=0)
tip(CHK_X, v.Y(-0.15), 0, 1); tip(CHK_X, v.Y(25.35), 0, -1)
# the stepped outline
v.chain('t', [16.80, 21.60, 24.00, 28.80], 7, 25.35, fm, 2.0, 'tick', ext_from=5.5)
v.chain('l', [0.00, 3.60, 8.40, 12.00], 20, -0.15, fm, 2.0, 'tick', ext_from=5.5)
v.chain('l', [-0.15, 12.15], 28, -0.15, fm, 2.2, 'tick', ext_from=23)
v.chain('l', [12.15, 14.55], 7, 9.45, fm, 1.8, 'tick', ext_from=5.5)
# The east end stands over gross corner (9.45, 14.55), 24 mm above this base, so its line starts 5.5 mm beyond that corner.
v.chain('t', [-0.15, 9.45], 33, 12.15, fm, 2.2, 'tick', ext_from=29.5, ext_over=1.2)
d.line(v.X(-0.15), v.Y(12.15) + 5.5, v.X(-0.15), v.Y(12.15) + 29.5, 0.13)

# -- axes: bubbles at the outer end only, nothing through the rooms. Every leader breaks 5.5 mm either side of the
# overall chain: axes 1, 6, A and G would otherwise cross it 1.5 mm inside its ends, and the app's intersection snap
# pulled those ends inward (288 mm, gross 548.83). No leader crosses a line the user clicks.
BREAK, DASH = 5.5, (6, 1.2, 1, 1.2)
def bubble(cx, cy, label):
    d.circle(cx, cy, 3.2, 0.18, INK, fill=WHITE)
    d.text(cx, cy - 2.3 * 0.45, label, 2.3, align='center')
for n_, x in XAX.items():
    d.line(v.X(x), CAL_Y + BREAK, v.X(x), S_FACE - OB[1], 0.09, INK, DASH)
    bubble(v.X(x), CAL_Y - 6 - 3.2, n_)
for n_, y in YAX.items():
    d.line(E_FACE + OR_[1], v.Y(y), CHK_X - BREAK, v.Y(y), 0.09, INK, DASH)
    bubble(CHK_X + 6 + 3.2, v.Y(y), n_)

# -- caption and scale bar
_cap = 'مسقط الدور الأرضي'
d.text(v.X(28.95), 83, _cap, 3.6, True, align='right')
d.text(v.X(28.95) - d.width(_cap, 3.6, True) - 5, 83.2, 'مقياس الرسم 1:100', 2.4, align='right')
d.scale_bar(v.X(0), 85, 10, v.k, [0, 1, 2, 3, 4, 5, 10], ['0', '', '', '', '', '5', '10 م'], 1.8, 1.6)

# ---- practice panel, in the notch of the L
PX0, PX1, PY1 = 64, 205, 404
y = PY1 - 6
d.text(PX1 - 3, y, 'تمرين القياس', 3.2, True, align='right')
d.text(PX1 - 3 - d.width('تمرين القياس', 3.2, True) - 4, y + 0.1, 'معايرة واحدة ثم ثلاثة قياسات', 2.1, align='right')
y -= 3.2
d.line(PX0 + 3, y, PX1 - 3, y, 0.13)
y -= 1.6
LABW, VALW = 37, 21
STEPS = (('المعايرة', f'خط البعد الكلي أسفل المسقط، من رأس السهم إلى رأس السهم. أدخل الطول المكتوب عليه.', f'{OVER_W:.2f} م'),
         ('1. طول للتحقق', 'خط البعد الكلي يمين المسقط، من رأس السهم إلى رأس السهم.', f'{OVER_D:.2f} م'),
         ('2. إجمالي مساحة البناء', 'تتبّع الوجه الخارجي للجدران مرورًا بأركان المبنى الثمانية.', f'{m2(GROSS)} م²'),
         ('3. تشطيب الجرانيت', 'تتبّع البهو 06 المظلَّل مرورًا بأركانه الأربعة، بمحاذاة أوجه الجدران وخطَّي تغيّر التشطيب عند الممرين.', f'{m2(BYFIN["GR"])} م²'))
for lab_, s_, val_ in STEPS:
    y0_ = y
    d.text(PX1 - 3, y - 2.4, lab_, 2.1, True, align='right')
    d.text(PX0 + 3, y - 2.5, val_, 2.5, True)
    y = d.para(PX0 + 3 + VALW + 2, y - 0.2, PX1 - PX0 - 6 - LABW - VALW - 4, s_, 2.1, lead=1.6, align='right') - 1.5
y -= 0.2
d.line(PX0 + 3, y, PX1 - 3, y, 0.09, GREY)
y -= 0.9
y = d.para(PX0 + 3, y, PX1 - PX0 - 6, 'في القياسين 2 و3 امضِ بخط مستقيم عبر فتحات الأبواب والنوافذ. لا يُحتسب المنحدر ولا البسطات، ولا تُخصم مساحة العمود القائم في البهو.', 2.0, lead=1.6, align='right') - 0.8
y = d.para(PX0 + 3, y, PX1 - PX0 - 6, 'كبّر العرض إلى 200% على الأقل عند اختيار كل ركن، فعند تكبير أقل قد يلتقط Snap to Content وجه جدار قريبًا من الركن.', 2.0, True, lead=1.6, align='right')
PY0 = y - 2
d.rect(PX0, PY0, PX1 - PX0, PY1 - PY0, 0.35)
assert PY0 > 300, PY0
d.north(PX1 - 14, 306, 10, 'arrow', 'شمال', 0, 2.4)

# ---- band under the plan: stamp, notes, legend
SX0, SX1 = 232, 390
d.rect(SX0, 50, SX1 - SX0, 26, 0.6)
d.text((SX0 + SX1) / 2, 65.3, 'لوحة تدريبية لمبنى افتراضي', 4.2, True, align='center')
d.text((SX0 + SX1) / 2, 59.2, 'لا تُستخدم للتنفيذ ولا لاستخراج الرخصة', 3.2, True, align='center')
d.text((SX0 + SX1) / 2, 53.5, 'لم يراجع هذه اللوحة أي مهندس أو مختص في المملكة العربية السعودية.', 2.2, align='center')
d.text(SX1, 44, 'ملاحظات', 2.8, True, align='right')
yn = 41.8
NOTES = ('جميع الأبعاد بالمتر ما لم يذكر خلاف ذلك.',
         'منسوب ±0.00 هو منتصف رصيف الواجهة الرئيسية.',
         'مساحات الفراغات صافية بين أوجه الجدران، ولا تخصم منها الأعمدة.',
         'إجمالي مساحة البناء حتى الوجه الخارجي للجدران، ولا يشمل المنحدر والبسطات.',
         'المساحات لغرض هذا التمرين فقط، ولا تصلح بيانات للرخصة.',
         'لا تدعي هذه اللوحة المطابقة لأي كود أو مواصفة.')
for i, s_ in enumerate(NOTES):
    d.text(SX1, yn - 2.0, f'{i + 1}.', 2.0, align='right')
    d.text(SX1 - 4, yn - 2.0, s_, 2.0, align='right')
    yn -= 4.9
assert yn > 11, yn
d.line(228, 10, 228, BAND, 0.25)
# legend: the symbol on the right, its meaning to the left of it
d.text(224, 74.5, 'مفتاح الرموز', 2.8, True, align='right')
RC = (224, 122)                     # right edge of each legend column
def lg(col, row, s_):
    yy = 67.5 - row * 9.3
    d.text(RC[col] - 18, yy - 0.8, s_, 2.0, align='right')
    return RC[col] - 16, yy         # left edge of the symbol slot (14 wide), and its centre line
def lw_(fill_, t_, px, py):
    b_ = Building(); b_.wall(0, -t_ / 2, 1.4, t_ / 2, 'k'); View(d, px, py, 100).draw(b_, {'k': fill_}, lw=0.3)
def ldoor(px, py, hinge, wid):
    b_ = Building(); b_.wall(0, -0.1, 1.4, 0.1, 'k'); b_.door('h', (1.4 - wid) / 2, wid, (-0.1, 0.1), hinge, 1)
    View(d, px, py - 3.0, 100).draw(b_, {'k': '#b4b9bd'}, lw=0.3, door_lw=0.22, arc_lw=0.11)
px, py = lg(0, 0, 'جدار خارجي وجدار رئيسي، 0.30'); lw_('#50565b', 0.30, px, py)
px, py = lg(0, 1, 'جدار داخلي، 0.20'); lw_('#b4b9bd', 0.20, px, py)
px, py = lg(0, 2, 'عمود، وعمود ركني'); d.rect(px + 2.5, py - 1.5, 3, 3, 0, fill=INK)
d.poly([(px + 8, py - 1.5), (px + 14, py - 1.5), (px + 14, py + 1.5), (px + 11, py + 1.5), (px + 11, py + 4.5), (px + 8, py + 4.5)], True, 0, fill=INK)
px, py = lg(0, 3, 'باب بمصراع واحد'); ldoor(px, py, 'a', 0.60)
px, py = lg(0, 4, 'باب بمصراعين'); ldoor(px, py, 'both', 0.90)
px, py = lg(0, 5, 'نافذة')
b_ = Building(); b_.wall(0, -0.15, 1.4, 0.15, 'k'); b_.window('h', 0.3, 0.8, (-0.15, 0.15)); View(d, px, py, 100).draw(b_, {'k': '#50565b'}, lw=0.3)
px, py = lg(1, 0, 'خط تغير التشطيب'); d.line(px + 1, py, px + 13, py, 0.25)
px, py = lg(1, 1, 'محور إنشائي'); d.line(px + 1, py, px + 8, py, 0.09, INK, (6, 1.2, 1, 1.2)); d.circle(px + 10.5, py, 2.6, 0.18); d.text(px + 10.5, py - 0.9, 'A', 2.0, align='center')
px, py = lg(1, 2, 'منحدر، والسهم باتجاه الصعود')
d.rect(px + 1, py - 1.8, 12, 3.6, 0.18); d.line(px + 13, py, px + 1, py, 0.13); d.poly([(px + 1, py), (px + 2.8, py + 0.5), (px + 2.8, py - 0.5)], True, 0, fill=INK)
px, py = lg(1, 3, 'دائرة دوران الكرسي المتحرك، قطرها 1.50'); d.circle(px + 7, py, 3.0, 0.13, dash=(1.0, 0.8))
px, py = lg(1, 4, 'دورة مياه لذوي الإعاقة'); wheelchair(px + 6.5, py - 1.0)
px, py = lg(1, 5, 'منسوب الأرضية')
d.poly([(px + 7, py - 1), (px + 6.1, py + 0.5), (px + 7.9, py + 0.5)], True, 0.13, INK, fill=INK); d.line(px + 3, py + 0.5, px + 11, py + 0.5, 0.09)

# ---- right column: schedules, right to left, first column on the right
LX, RX = 398, 580
ROW = 5.25
def head_cells(y_top, rh, widths, pairs):
    right = RX
    for w_, (ar_, en_) in zip(widths, pairs):
        cx_ = right - w_ / 2
        d.text(cx_, y_top - rh * 0.52, ar_, 1.9, True, align='center')
        d.text(cx_, y_top - rh + 1.0, L(en_), 1.4, col=GREY, align='center')
        right -= w_
def rh_head(h): return ROW + h * 1.3
yy = 402.5
d.text(RX, yy, 'جدول المساحات', 3.0, True, align='right')
yy -= 2.0
AW = [11, 62, 37, 47, 25]
rows = [['\n'] * 5]
for r in ROOMS: rows.append([r[0], r[1], f'{rw(r):.2f} × {rd(r):.2f}', FIN[r[2]][0], m2(AREA[r[0]])])
n_r = len(rows)
rows += [['', None, None, 'المساحة الصافية (مجموع الفراغات)', m2(NET)], ['', None, None, 'الجدران وفتحات الأبواب', m2(WALLS)], ['', None, None, 'إجمالي مساحة البناء', m2(GROSS)]]
head_cells(yy, rh_head(1.85), AW, (('الرقم', 'No.'), ('الفراغ', 'Space'), ('الأبعاد، م', 'Dimensions, m'), ('التشطيب', 'Floor finish'), ('المساحة، م²', 'Area, m²')))
yy = d.table(LX, yy, AW, rows, 1.85, ROW, aligns=['center', 'right', 'center', 'right', 'right'], bold_rows={n_r, n_r + 2}, rtl=True)
d.text(RX, yy - 3.4, 'الأبعاد بين أوجه الجدران. إجمالي مساحة البناء:', 1.9, align='right')
_w = d.width('الأبعاد بين أوجه الجدران. إجمالي مساحة البناء:', 1.9)
d.text(RX - _w - 2, yy - 3.4, L(f'29.10 × 12.30 + 19.50 × 2.40 + 12.30 × 10.80 = {m2(GROSS)}'), 1.8, align='right')
yy -= 10.4
d.text(RX, yy, 'جدول التشطيبات', 3.0, True, align='right')
yy -= 2.0
FW = [14, 58, 85, 25]
head_cells(yy, rh_head(1.85), FW, (('اللون', 'Tint'), ('التشطيب', 'Floor finish'), ('الفراغات', 'Spaces'), ('المساحة، م²', 'Area, m²')))
rows = [['\n'] * 4]
for k_, (nm_, col_) in FIN.items():
    i_ = len(rows) - 1
    d.rect(RX - FW[0], yy - rh_head(1.85) - ROW * (i_ + 1), FW[0], ROW, 0, fill=col_)
    rows.append(['', nm_, ', '.join(r[0] for r in ROOMS if r[2] == k_), m2(BYFIN[k_])])
rows.append(['', 'المجموع', None, m2(NET)])
# the span runs to the left of the name, so in logical order the name follows its empty cell
rows[-1] = ['', None, 'المجموع', m2(NET)]
yy = d.table(LX, yy, FW, rows, 1.85, ROW, aligns=['center', 'right', 'right', 'right'], bold_rows={len(rows) - 1}, rtl=True)
d.text(RX, yy - 3.4, 'يصل التظليل إلى أوجه الجدران، ولا يشمل فتحات الأبواب.', 1.9, align='right')
yy -= 10.4
d.text(RX, yy, 'جدول الأبواب والنوافذ', 3.0, True, align='right')
yy -= 2.0
OPW = [16, 78, 30, 30, 28]
head_cells(yy, rh_head(1.85), OPW, (('الرمز', 'Mark'), ('النوع', 'Type'), ('العرض، م', 'Width, m'), ('الارتفاع، م', 'Height, m'), ('العدد', 'Count')))
OPT = (('ب1', 'باب بمصراعين', '2.40'), ('ب2', 'باب بمصراع واحد', '2.10'), ('ب3', 'باب حجرة في دورة المياه', '2.00'),
       ('ن1', 'نافذة', '1.50'), ('ن2', 'نافذة', '1.50'), ('ن3', 'نافذة عالية', '0.60'), ('ف1', 'فتحة تقديم بين المطبخ والكافيتيريا', '1.00'))
rows = [['\n'] * 5] + [[m_, t_, f'{OW[m_]:.2f}', hh_, str(COUNT[m_])] for m_, t_, hh_ in OPT]
assert COUNT == {'ب1': 7, 'ب2': 17, 'ب3': 4, 'ن1': 12, 'ن2': 8, 'ن3': 2, 'ف1': 1}, COUNT
yy = d.table(LX, yy, OPW, rows, 1.85, ROW, aligns=['center', 'right', 'center', 'center', 'center'], rtl=True)
SCHED_END = yy

# ---- title block, lower right: the inside runs right to left
TX, TR = CX, 584
TB_TOP = 130
assert SCHED_END > TB_TOP + 3, SCHED_END
tb = TB_TOP
d.line(TX, tb, TR, tb, 0.35)
def trow(h_, fields):
    """fields run from the right: (width, label, value, value height, bold)."""
    global tb
    tb -= h_
    xr = TR
    for w_, lab_, val_, vh_, bold_ in fields:
        d.field(xr - w_, tb, w_, h_, lab_, val_, 1.75, vh_, bold_, rtl=True)
        xr -= w_
TW_ = TR - TX
trow(16, [(TW_, 'المكتب الهندسي  Engineering office', 'مكتب المثال الهندسي (افتراضي)', 2.8, False)])
trow(20, [(TW_, 'المشروع  Project', '', 4.6, True)])
d.text(TR - 1.2, tb + 3.9, 'مركز حي المثال', 4.6, True, align='right')     # raised: the dots of ي drop far below the line
trow(14, [(TW_ / 2, 'المالك  Owner', 'لجنة أهالي حي المثال (افتراضية)', 2.3, False), (TW_ / 2, 'الموقع  Location', 'حي المثال (موقع افتراضي)', 2.3, False)])
trow(18, [(TW_, 'عنوان اللوحة  Sheet title', 'مسقط الدور الأرضي وجدول المساحات', 3.2, True)])
trow(14, [(TW_ / 3, 'التخصص  Discipline', 'معماري', 2.4, False), (TW_ / 3, 'التاريخ  Date', '6 نوفمبر 2026', 2.4, False), (TW_ / 3, 'رقم التعديل  Revision', '00', 2.4, False)])
trow(14, [(TW_ / 4, 'التصميم  Designed', 'افتراضي', 2.2, False), (TW_ / 4, 'الرسم  Drawn', 'افتراضي', 2.2, False),
          (TW_ / 4, 'المراجعة  Checked', 'لم تتم', 2.2, False), (TW_ / 4, 'الاعتماد  Approved', 'لم يتم', 2.2, False)])
assert abs(tb - 34) < 1e-9, tb
d.field(TR - 62, 10, 62, 24, 'رقم اللوحة  Sheet number', '', 1.75, rtl=True)
d.text(TR - 31, 13.5, '01', 11, True, align='center')
d.field(TR - 62 - 44, 10, 44, 24, 'مقياس الرسم  Scale', '1:100', 1.75, 4.2, True, rtl=True)
d.field(TR - 62 - 44 - 42, 10, 42, 24, 'مقاس اللوحة  Sheet size', 'A2', 1.75, 4.2, False, rtl=True)
d.field(TX, 10, 42, 24, 'وحدة الأبعاد  Units', 'متر', 1.75, 4.2, False, rtl=True)
d.text(584, 5.2, 'PolyPDF. لوحة تدريبية لمبنى افتراضي.', 1.8, col=GREY, align='right', track=False)

# ---- measuring facts, in sheet millimetres
d.expect('calibrate', p0=(v.X(-0.15), CAL_Y), p1=(v.X(28.95), CAL_Y), metres=OVER_W, note='outer chain under the plan, 29.10, arrow tip to arrow tip')
d.expect('check', p0=(CHK_X, v.Y(-0.15)), p1=(CHK_X, v.Y(25.35)), metres=OVER_D, note='outer chain right of the plan, 25.50, arrow tip to arrow tip')
d.expect('gross', pts=[v.P(*p) for p in FOOT], sqm=poly_area(FOOT), perimeter=poly_perimeter(FOOT), note='outer face of the walls, eight corners')
d.expect('floor', pts=[v.P(*p) for p in FLOOR], sqm=poly_area(FLOOR), perimeter=poly_perimeter(FLOOR), note='granite lobby 06: wall faces and the two finish lines')
d.save()
