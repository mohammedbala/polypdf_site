#!/usr/bin/env python3
# China (mainland): 社区老年人日间照料中心, A1 landscape, 1:100. Long bar with a central corridor, frame on a 7200 grid, sun rooms
# south and wet rooms north. Millimetres with no unit on three chains, levels in metres, oblique ticks, axis bubbles on four sides,
# solid black columns, full-height right title strip. Two views stacked on the same grid: 一层平面图 and 一层地坪布置图.
#
# Measuring rule from the app: no line end, tick or column corner within 5 mm of a trace corner or a calibration end, except lines that
# end exactly on that point. The snap radius is 9 pt at 1:1 and never below 3.5 pt, so anything closer can take the pick away. That
# shaped three things here. The assertions below cover the geometry, and out/zh-cn/check_snap.py checks the finished PDF's own vertices:
#   * The four corner columns are 600 x 600 and merged into the wall outline, so the wall's inner corner is not 2.8 mm from the outer one.
#   * The finish plan is single-line on the partition centre lines. Double-line walls would put a face vertex 1.4 mm from each T corner.
#   * Ticks at the measured line ends are two halves that both end on the point, and axes 1, 8, A, D stop clear of those points.
import sys
from pathlib import Path
from draftkit import *
import math, re

OUT = Path(sys.argv[1] if len(sys.argv) > 1 else 'out'); OUT.mkdir(exist_ok=True)
register_font('SC', '../fonts/NotoSerifSC-Regular.ttf')
register_font('SC-B', '../fonts/NotoSansSC-Bold.ttf')
fm = fmt_mm('')
SAFE = 5.0                                  # mm clear round every measured point

# ---- geometry (metres, lower-left outer corner, north up)
W, D = 50.6, 14.6
AX = {'1': 0.10, '2': 7.30, '3': 14.50, '4': 21.70, '5': 28.90, '6': 36.10, '7': 43.30, '8': 50.50}
AY = {'A': 0.10, 'B': 6.10, 'C': 8.50, 'D': 14.50}
FOOT = [(0, 0), (W, 0), (W, D), (0, D)]
FIN = {'地1': '防滑地砖地面(600×600)', '地2': 'PVC卷材地面', '地3': '防滑地砖防水地面(300×300)', '地4': '火烧面花岗岩地面', '地5': '细石混凝土地面'}
# 序号, name, x, y, width, depth, finish: partition centre lines inside, outer wall face at the perimeter
ROOMS = [('1', '餐厅', 0, 0, 10.9, 8.5, '地2'), ('2', '棋牌室', 10.9, 0, 3.6, 6.1, '地2'), ('3', '多功能活动室', 14.5, 0, 7.2, 6.1, '地2'),
         ('4', '门斗', 21.7, 0, 7.2, 2.5, '地4'), ('5', '门厅', 21.7, 2.5, 7.2, 3.6, '地1'), ('6', '休息室一', 28.9, 0, 3.6, 6.1, '地2'),
         ('7', '休息室二', 32.5, 0, 3.6, 6.1, '地2'), ('8', '休息室三', 36.1, 0, 3.6, 6.1, '地2'), ('9', '休息室四', 39.7, 0, 3.6, 6.1, '地2'),
         ('10', '康复训练室', 43.3, 0, 7.3, 6.1, '地2'), ('11', '走道', 10.9, 6.1, 36.0, 2.4, '地1'), ('12', '次入口门斗', 46.9, 6.1, 3.7, 2.4, '地4'),
         ('13', '厨房', 0, 8.5, 7.3, 6.1, '地3'), ('14', '配餐间', 7.3, 8.5, 3.6, 6.1, '地3'), ('15', '洗衣房', 10.9, 8.5, 3.6, 6.1, '地3'),
         ('16', '办公室', 14.5, 8.5, 3.6, 6.1, '地2'), ('17', '茶水间', 18.1, 8.5, 1.8, 6.1, '地3'), ('18', '库房', 19.9, 8.5, 1.8, 6.1, '地5'),
         ('19', '女卫生间', 21.7, 8.5, 2.4, 6.1, '地3'), ('20', '无障碍厕所', 24.1, 8.5, 2.4, 3.0, '地3'), ('21', '配电间', 24.1, 11.5, 2.4, 3.1, '地5'),
         ('22', '男卫生间', 26.5, 8.5, 2.4, 6.1, '地3'), ('23', '沐浴间', 28.9, 8.5, 3.6, 6.1, '地3'), ('24', '医疗保健室', 32.5, 8.5, 3.6, 6.1, '地2'),
         ('25', '心理疏导室', 36.1, 8.5, 3.6, 6.1, '地2'), ('26', '员工休息室', 39.7, 8.5, 3.6, 6.1, '地2'), ('27', '阅览室', 43.3, 8.5, 7.3, 6.1, '地2')]
ROOM = {r[1]: r for r in ROOMS}
check_tiling([r[2:6] for r in ROOMS], FOOT)
def mm2(w, d_): return round(w * 1000) * round(d_ * 1000)
def f2(a):
    assert a % 10000 == 0, a               # one-decimal metres always give an exact two-decimal area
    return f'{a // 10 ** 6}.{(a % 10 ** 6) // 10 ** 4:02d}'
AREA = {r[1]: mm2(r[4], r[5]) for r in ROOMS}
GROSS_MM2 = mm2(W, D)
assert sum(AREA.values()) == GROSS_MM2 == 738760000
GROSS = f2(GROSS_MM2)
BYKEY = {k: sum(AREA[r[1]] for r in ROOMS if r[6] == k) for k in FIN}
assert sum(BYKEY.values()) == GROSS_MM2
# 地1: 走道 plus 门厅, a T on the partition centre lines with eight corners
T1 = [(10.9, 8.5), (46.9, 8.5), (46.9, 6.1), (28.9, 6.1), (28.9, 2.5), (21.7, 2.5), (21.7, 6.1), (10.9, 6.1)]
F1_MM2 = AREA['走道'] + AREA['门厅']
assert F1_MM2 == BYKEY['地1'] == 112320000 and abs(poly_area(T1) - F1_MM2 / 1e6) < 1e-6
F1 = f2(F1_MM2)
assert (GROSS, F1) == ('738.76', '112.32')
assert 3.0 / 20 == 0.15 and abs(1.8 / 12 - 0.15) < 1e-12                       # both slopes drop ±0.000 to -0.150 as drawn

# ---- walls: 200 thick. The corner columns are part of the outline
def wx(c): return (round(c - 0.1, 4), round(c + 0.1, 4))
S_, N_, W_, E_ = (0, 0.2), (14.4, 14.6), (0, 0.2), (50.4, 50.6)
C1, C2 = wx(6.1), wx(8.5)
CORNER = 0.6
B = Building()
for r in ((0, 0, W, 0.2), (0, 14.4, W, D), (0, 0, 0.2, D), (50.4, 0, W, D)): B.wall(*r, 'ext')
for cx_, cy_ in ((0, 0), (W - CORNER, 0), (0, D - CORNER), (W - CORNER, D - CORNER)): B.wall(cx_, cy_, cx_ + CORNER, cy_ + CORNER, 'ext')
for r in ((0.2, 8.4, 50.4, 8.6), (10.9, 6.0, 21.8, 6.2), (28.8, 6.0, 50.4, 6.2), (21.7, 2.4, 28.9, 2.6), (24.1, 11.4, 26.5, 11.6),
          (10.8, 0.2, 11.0, 14.4), (7.2, 8.6, 7.4, 14.4), (46.8, 6.2, 47.0, 8.4)):
    B.wall(*r, 'int')
for x in (14.5, 21.7, 28.9, 32.5, 36.1, 39.7, 43.3):
    B.wall(x - 0.1, 0.2, x + 0.1, 6.1, 'int'); B.wall(x - 0.1, 8.5, x + 0.1, 14.4, 'int')
for x in (18.1, 19.9, 24.1, 26.5): B.wall(x - 0.1, 8.5, x + 0.1, 14.4, 'int')

# ---- openings: a tag gives the size in decimetres, and each one placed here is counted for the schedule
def size_of(tag):
    digits = ''.join(c for c in tag if c.isdigit())
    return int(digits[:2]) * 100, int(digits[2:]) * 100
COUNT, TAGS, HIGH = {}, [], []
def _rec(tag, pos):
    COUNT[tag] = COUNT.get(tag, 0) + 1
    TAGS.append((tag, pos))
def door(tag, axis, at, wall, hinge='a', swing=1, pos=None, kind='swing'):
    B.door(axis, at, size_of(tag)[0] / 1000, wall, hinge, swing, kind); _rec(tag, pos)
def win(tag, axis, centre, wall, pos):
    w = size_of(tag)[0] / 1000
    B.window(axis, round(centre - w / 2, 4), w, wall); _rec(tag, pos)
def high(tag, axis, centre, wall, pos):
    w = size_of(tag)[0] / 1000
    HIGH.append((axis, round(centre - w / 2, 4), w, wall)); _rec(tag, pos)
SY, NY, WX, EX = -0.5, 14.84, -0.26, 51.04     # where tags sit outside each face
CS, CN = 6.34, 8.08                             # the two rows of tags in the corridor
# doors from the corridor swing into the rooms and keep the corridor clear
door('M1824', 'h', 24.4, S_, 'both', -1, (25.3, 0.42))              # main entrance
door('M1824', 'h', 24.4, wx(2.5), 'both', -1, (25.3, 2.76))         # air-lock inner door
door('M1824', 'v', 6.4, wx(10.9), 'both', -1, (11.28, 7.3, 90))     # dining room from the corridor
door('M1521', 'h', 8.35, S_, 'both', -1, (9.1, 0.42))               # dining room second exit
door('M1021', 'h', 9.65, C2, 'b', 1, (10.15, 9.78))                 # servery to dining room
door('M1021', 'v', 10.0, wx(7.3), 'a', -1, (7.72, 10.5, 90))        # kitchen to servery
door('M1221', 'h', 5.2, N_, 'both', 1, (5.8, 14.02))                # kitchen service door
door('FM乙0921', 'h', 24.85, N_, 'a', 1, (25.3, 14.02))              # electrical room, from outside
for tag, at, hinge, in_ in (('M1021', 13.2, 'b', -1), ('M1521', 17.35, 'both', -1), ('M1021', 31.3, 'b', -1), ('M1021', 32.7, 'a', -1),
                            ('M1021', 38.5, 'b', -1), ('M1021', 39.9, 'a', -1), ('M1521', 44.4, 'both', -1)):
    door(tag, 'h', at, C1, hinge, in_, (at + size_of(tag)[0] / 2000, CS))
for tag, at, hinge, in_ in (('M1021', 11.3, 'a', 1), ('M1021', 15.1, 'a', 1), ('M1021', 18.5, 'a', 1), ('M1021', 20.2, 'a', 1), ('M1021', 22.35, 'b', 1),
                            ('M1021', 27.25, 'a', 1), ('M1021', 31.3, 'b', 1), ('M1021', 32.7, 'a', 1), ('M1021', 38.5, 'b', 1), ('M1021', 39.9, 'a', 1),
                            ('M1521', 44.4, 'both', 1)):
    door(tag, 'h', at, C2, hinge, in_, (at + size_of(tag)[0] / 2000, CN))
door('TM1021', 'h', 24.3, C2, kind='slide', pos=(24.8, CN))         # accessible toilet, slides inside the room
door('M1521', 'v', 6.55, wx(46.9), 'both', 1, (46.52, 7.3, 90))     # east air-lock, inner
door('M1521', 'v', 6.55, E_, 'both', 1, (50.2, 7.3, 90))            # east air-lock, outer
B.window('h', 7.75, 1.5, C2, glass=0); _rec('DK1512', (8.5, 8.02))  # serving hatch, servery to dining room
# windows
for c in (1.9, 5.5, 12.7, 16.3, 19.9, 30.7, 34.3, 37.9, 41.5, 45.1, 48.7): win('C1821', 'h', c, S_, (c, SY))
for c in (23.2, 27.4): win('C1221', 'h', c, S_, (c, 0.42))
for c in (1.75, 4.6): win('C1821', 'v', c, W_, (WX, c, 90))
for c in (3.1, 11.5): win('C1821', 'v', c, E_, (EX, c, 90))
for c in (1.65, 3.95, 9.1, 12.7, 16.3, 34.3, 37.9, 41.5, 45.1, 48.7): win('C1518', 'h', c, N_, (c, NY))
for c in (19.0, 20.75): win('C0918', 'h', c, N_, (c, NY))
for c in (22.9, 27.7, 30.7): high('C1209', 'h', c, N_, (c, NY))

# ---- columns: 32, one at every axis crossing. Perimeter columns sit flush with the outer wall face so the outline stays one rectangle
def col_at(x, y):
    size = CORNER if x in (0.1, 50.5) and y in (0.1, 14.5) else 0.4
    cx_ = size / 2 if x == 0.1 else W - size / 2 if x == 50.5 else x
    cy_ = size / 2 if y == 0.1 else D - size / 2 if y == 14.5 else y
    return (round(cx_, 4), round(cy_, 4), size)
COLS = [col_at(x, y) for x in AX.values() for y in AY.values()]
assert len(COLS) == 32
for c in FOOT:      # sheet mm = metres x 10 at 1:100. Only a column corner exactly on the outline corner may lie inside the clear radius
    for cx_, cy_, s_ in COLS:
        for sx_ in (-1, 1):
            for sy_ in (-1, 1):
                dist_ = math.dist((cx_ + sx_ * s_ / 2, cy_ + sy_ * s_ / 2), c) * 10
                assert dist_ < 1e-6 or dist_ >= SAFE, ('column corner too near a trace corner', c, cx_, cy_, dist_)
    for o in B.openings:
        a_, b_ = o['at'], o['at'] + o['w']
        for u_ in (a_, b_):
            for n_ in o['wall']:
                q_ = (u_, n_) if o['axis'] == 'h' else (n_, u_)
                assert math.dist(q_, c) * 10 >= SAFE, ('opening too near a trace corner', o, c)

def _open_rect(o):
    a, b = o['at'], o['at'] + o['w']; w0, w1 = o['wall']
    return (a, w0, b, w1) if o['axis'] == 'h' else (w0, a, w1, b)
def _overlap(p, q, tol=1e-6): return min(p[2], q[2]) - max(p[0], q[0]) > tol and min(p[3], q[3]) - max(p[1], q[1]) > tol
def _swing(o):
    a, b = o['at'], o['at'] + o['w']; w0, w1 = o['wall']; s = o['swing']
    face = w1 if s > 0 else w0
    r = o['w'] / 2 if o['hinge'] == 'both' else o['w']
    lo, hi = sorted((face, face + s * r))
    return (a, lo, b, hi) if o['axis'] == 'h' else (lo, a, hi, b)
_wall_rects = [(w[0], w[1], w[2], w[3]) for w in B.walls]
for o in B.openings:                       # every opening sits inside a wall and clear of every column
    q = _open_rect(o)
    assert any(r[0] - 1e-6 <= q[0] and q[2] <= r[2] + 1e-6 and r[1] - 1e-6 <= q[1] and q[3] <= r[3] + 1e-6 for r in _wall_rects), o
    for cx_, cy_, s_ in COLS:
        assert not _overlap(q, (cx_ - s_ / 2, cy_ - s_ / 2, cx_ + s_ / 2, cy_ + s_ / 2)), (o, cx_, cy_)
_doors = [o for o in B.openings if o['t'] == 'door' and o['kind'] == 'swing']
for i, o in enumerate(_doors):
    for q in _doors[i + 1:]: assert not _overlap(_swing(o), _swing(q)), (o, q)
    for cx_, cy_, s_ in COLS: assert not _overlap(_swing(o), (cx_ - s_ / 2, cy_ - s_ / 2, cx_ + s_ / 2, cy_ + s_ / 2)), (o, cx_, cy_)
# every room can be reached from outside through the doors drawn
def room_at(x, y):
    for r in ROOMS:
        if r[2] < x < r[2] + r[4] and r[3] < y < r[3] + r[5]: return r[1]
    return 'outside'
EDGES = {('门厅', '走道')}
for o in B.openings:
    if o['t'] != 'door': continue
    m, n = o['at'] + o['w'] / 2, sum(o['wall']) / 2; t = (o['wall'][1] - o['wall'][0]) / 2 + 0.05
    EDGES.add((room_at(m, n - t), room_at(m, n + t)) if o['axis'] == 'h' else (room_at(n - t, m), room_at(n + t, m)))
_seen, _todo = {'outside'}, ['outside']
while _todo:
    a = _todo.pop()
    for p, q in EDGES:
        for u_, v_ in ((p, q), (q, p)):
            if u_ == a and v_ not in _seen: _seen.add(v_); _todo.append(v_)
assert _seen == {r[1] for r in ROOMS} | {'outside'}, {r[1] for r in ROOMS} - _seen
assert 2.4 - 0.2 >= 1.8                    # corridor clear width

# ---- the sheet
class ZDoc(Doc):
    """All Chinese text on this sheet takes full-width commas, brackets and colons. '1:100' keeps its colon. Lines never break inside a
    number or a Latin word, and never start on closing punctuation."""
    @staticmethod
    def zh(t):
        t = t.replace(',', '\uff0c').replace('(', '\uff08').replace(')', '\uff09').replace(';', '\uff1b')
        return re.sub(r'(?<=[^\x00-\x7f]):', '\uff1a', t)
    @staticmethod
    def _runs(s): return [(ZDoc.zh(t), up) for t, up in Doc._runs(s)]
    def wrap(self, s, width, h=2.2, bold=False, mode=None):
        lines = []
        for chunk in self.zh(str(s)).split('\n'):
            line = []
            for tok in re.findall(r'[A-Za-z0-9.\-+×:]+|.', chunk):
                if line and self.width(''.join(line) + tok, h, bold) > width:
                    carry = [line.pop()] if tok[0] in NO_LINE_START and len(line) > 1 else []
                    lines.append(''.join(line).rstrip()); line = carry
                    if not carry and tok == ' ': continue
                line.append(tok)
            lines.append(''.join(line))
        return lines
PW, PH = 841, 594
FX0, FY0, FX1, FY1 = 25, 10, 831, 584       # frame: 25 at the binding edge, 10 elsewhere
d = ZDoc(OUT / 'zh-cn.pdf', (PW, PH), ZDoc.zh('练习用图 一层平面图 1:100(虚构)'), subject=ZDoc.zh('PolyPDF 练习用图。虚构建筑,不得用于施工。'), font='SC', font_b='SC-B', wrap='cjk',
        keywords='练习用图, 一层平面图, 建筑面积, 地坪布置图')
d.frame(FX0, FY0, FX1, FY1, 1.0)
for x_, y0_, x1_, y1_ in ((PW / 2, 0, PW / 2, FY0), (PW / 2, FY1, PW / 2, PH), (0, PH / 2, FX0, PH / 2), (FX1, PH / 2, PW, PH / 2)):
    d.line(x_, y0_, x1_, y1_, 0.35)         # centring marks
SX, SW = 771, 60                            # title strip
X0, Y1, Y2 = 73, 370, 66                    # plan origins of the two views, on one grid
v, u = View(d, X0, Y1, 100), View(d, X0, Y2, 100)
FX = '#4a5157'; FURN = '#8e959a'
OFF_B, OFF_T, OFF_L, OFF_R = (49, 57, 65), (34, 42, 50), (14, 22, 30), (49, 57, 65)
COMB = 11                                   # inner chain's extension lines start past the 散水 line
DASH = (6, 1.2, 1, 1.2)
RBUB = 4.0

# -- outside the footprint: 散水, slopes, landings, canopies
LANDS = [(23.5, -1.5, 27.1, 0), (7.9, -2.3, 10.3, 0), (4.6, D, 7.0, D + 1.2), (W, 5.5, W + 1.5, 9.1), (24.3, D, 26.3, D + 0.9)]
def run_off(pts, breaks):
    """散水: straight runs with gaps where a landing or slope meets the wall."""
    for (x0_, y0_), (x1_, y1_) in pts:
        horiz = y0_ == y1_
        a, b = (x0_, x1_) if horiz else (y0_, y1_)
        cur = a
        for g0, g1 in sorted(breaks.get((horiz, y0_ if horiz else x0_), [])):
            v.linem(x0_ if not horiz else cur, y0_ if horiz else cur, x0_ if not horiz else g0, y0_ if horiz else g0, 0.13, INK)
            cur = g1
        v.linem(x0_ if not horiz else cur, y0_ if horiz else cur, x0_ if not horiz else b, y0_ if horiz else b, 0.13, INK)
SS = 0.9
run_off([((-SS, -SS), (W + SS, -SS)), ((W + SS, -SS), (W + SS, D + SS)), ((-SS, D + SS), (W + SS, D + SS)), ((-SS, -SS), (-SS, D + SS))],
        {(True, -SS): [(7.9, 10.3), (23.5, 27.1)], (True, D + SS): [(4.6, 7.0), (24.3, 26.3)], (False, W + SS): [(5.5, 9.1)]})
for (x0_, y0_), (dx_, dy_) in (((0, 0), (-SS, -SS)), ((W, 0), (SS, -SS)), ((W, D), (SS, SS)), ((0, D), (-SS, SS))):
    v.linem(x0_, y0_, x0_ + dx_, y0_ + dy_, 0.13, INK)      # joint at each 散水 corner, ending exactly on the building corner
LP = 0.18
for r in LANDS: v.rectm(*r, LP, INK)
def slope(x0_, y0_, x1_, y1_, dn, ratio, side):
    """Sloped approach: the arrow points downhill, with the ratio beside it."""
    v.ramp(x0_, y0_, x1_, y1_, dn, None, 1.9, LP, INK)
    cx_, cy_ = (x0_ + x1_) / 2, (y0_ + y1_) / 2
    if dn in 'ns': d.text(v.X(cx_) + side * 1.6, v.Y(cy_) - 0.9, ratio, 2.0, align='left' if side > 0 else 'right')
    else: d.text(v.X(cx_), v.Y(cy_) + 1.4, ratio, 2.0, align='center')
slope(23.5, -4.5, 27.1, -1.5, 's', '1:20', 1)
slope(W + 1.5, 5.5, W + 4.5, 9.1, 'e', '1:20', 1)
slope(7.9, -4.1, 10.3, -2.3, 's', '1:12', 1)
slope(4.6, D + 1.2, 7.0, D + 3.0, 'n', '1:12', 1)
v.linem(24.3, D + 0.9, 26.3, D + 0.9, 0.18, INK)
v.rectm(24.3, D + 0.9, 26.3, D + 1.2, 0.13, INK)            # one step down at the electrical room
for r in ((23.2, -1.8, 27.4, 0), (W, 5.2, W + 1.8, 9.4)):
    d.rect(v.X(r[0]), v.Y(r[1]), (r[2] - r[0]) * v.k, (r[3] - r[1]) * v.k, 0.18, INK, None, (2.0, 1.2))
d.text(v.X(25.3), v.Y(-1.42), '雨篷', 1.9, align='center')
d.text(v.X(W + 1.25), v.Y(9.14), '雨篷', 1.9, align='center')

# -- furniture and fittings, drawn before the walls. FIXED collects what a door must not sweep
FIXED = []
def fit(x0_, y0_, x1_, y1_, lw=0.13, col=FX, keep=True):
    v.rectm(x0_, y0_, x1_, y1_, lw, col)
    if keep: FIXED.append((x0_, y0_, x1_, y1_))
def furn(x0_, y0_, x1_, y1_): fit(x0_, y0_, x1_, y1_, 0.09, FURN)
def wc(x, y, rot):
    v.wc(x, y, rot, FX)
    FIXED.append((x - 0.2, y - 0.2, x + 0.2, y + 0.2) if rot in 'ns' else (x - 0.2, y - 0.2, x + 0.2, y + 0.2))
    FIXED.append({'s': (x - 0.2, y - 0.62, x + 0.2, y), 'n': (x - 0.2, y, x + 0.2, y + 0.62), 'e': (x, y - 0.2, x + 0.62, y + 0.2), 'w': (x - 0.62, y - 0.2, x, y + 0.2)}[rot])
def basin(x, y, rot, w=0.55, dp=0.45):
    v.basin(x, y, rot, FX, w=w, depth=dp)
    FIXED.append({'s': (x - w / 2, y - dp, x + w / 2, y), 'n': (x - w / 2, y, x + w / 2, y + dp), 'e': (x, y - w / 2, x + dp, y + w / 2), 'w': (x - dp, y - w / 2, x, y + w / 2)}[rot])
def word(x, y, s, h=1.7, ang=0, col=FX): d.text(v.X(x), v.Y(y), s, h, col=col, align='center', angle=ang)
def tab(x, y, w=1.2, dp=0.8, cx_=2, cy_=0):
    v.table_chairs(x, y, w, dp, cx_, cy_, FURN, 0.09, 0.36)
    FIXED.append((x - 0.42 * bool(cy_), y - 0.42 * bool(cx_), x + w + 0.42 * bool(cy_), y + dp + 0.42 * bool(cx_)))
def bed(x, y, w=0.9, ln=2.0, head='s'):
    furn(x, y, x + w, y + ln)
    v.linem(x, y + 0.3, x + w, y + 0.3, 0.09, FURN) if head == 's' else v.linem(x, y + ln - 0.3, x + w, y + ln - 0.3, 0.09, FURN)
# 餐厅: 32 seats on 92.65 ㎡, clear of both doors, the hatch and the free-standing column
for x, y in ((1.1, 1.2), (3.9, 1.2), (6.7, 1.2), (1.1, 3.4), (8.4, 3.4), (1.1, 5.6), (3.9, 5.6), (8.3, 5.3)): tab(x, y)
# 棋牌室, 多功能活动室
tab(12.05, 0.9, 0.9, 0.9, 1, 1); tab(12.05, 2.9, 0.9, 0.9, 1, 1)
fit(14.6, 1.0, 15.05, 5.0, 0.09, FURN); word(14.84, 3.0, '储物柜', 1.6, 90, GREY)
# 门斗, 门厅
fit(27.4, 3.2, 28.05, 5.4); word(27.73, 4.3, '接待台', 1.7, 90)
d.rect(v.X(21.95), v.Y(2.75), 1.35 * v.k, 2.2 * v.k, 0.13, FX, None, (1.4, 0.9))
word(22.63, 3.85, '助行器停放', 1.7, 90)
# 休息室: 4 beds each, heads against the corridor wall side kept clear of the door swing
for x0_ in (28.9, 32.5, 36.1, 39.7):
    for bx in (x0_ + 0.15, x0_ + 3.6 - 0.15 - 0.9):
        bed(bx, 0.55); bed(bx, 2.75)
# 康复训练室
v.linem(44.2, 1.2, 47.6, 1.2, 0.18, FX); v.linem(44.2, 1.8, 47.6, 1.8, 0.18, FX); FIXED.append((44.2, 1.2, 47.6, 1.8)); word(45.9, 0.72, '平行杠', 1.7)
bed(49.3, 1.0, 0.9, 1.9); bed(49.3, 3.2, 0.9, 1.9)
# 厨房
fit(0.2, 9.3, 0.95, 13.4); word(0.57, 11.35, '灶台', 1.8, 90)
for yy in (9.9, 10.7, 12.0, 12.8): v.circlem(0.57, yy, 0.2, 0.09, FX)
d.rect(v.X(0.2), v.Y(9.3), 1.15 * v.k, 4.1 * v.k, 0.13, FX, None, (1.4, 0.9)); word(1.15, 11.35, '排烟罩(虚线)', 1.6, 90, GREY)
fit(1.0, 13.8, 4.9, 14.4); word(4.2, 13.97, '洗涤台', 1.7)
v.rectm(1.6, 13.88, 2.3, 14.32, 0.09, FX); v.rectm(2.5, 13.88, 3.2, 14.32, 0.09, FX)
fit(2.5, 9.5, 5.3, 10.5); word(3.9, 9.85, '加工台', 1.7)
# 配餐间
fit(7.55, 8.6, 9.5, 9.2); word(8.52, 8.77, '配餐台', 1.7)
fit(10.2, 10.3, 10.8, 13.3); word(10.5, 11.8, '消毒柜', 1.7, 90)
# 洗衣房
for yy in (10.1, 10.85, 11.6): fit(13.75, yy, 14.4, yy + 0.65); v.circlem(14.07, yy + 0.32, 0.22, 0.09, FX)
word(13.5, 10.97, '洗衣机', 1.6, 90); fit(11.0, 10.4, 11.6, 13.6); word(11.3, 12.0, '整理台', 1.7, 90)
# 办公室
furn(14.75, 12.9, 16.25, 13.6); furn(16.45, 12.9, 17.95, 13.6); furn(17.55, 9.8, 18.0, 12.2); word(17.78, 11.0, '文件柜', 1.6, 90, GREY)
# 茶水间, 库房
fit(18.2, 13.75, 19.8, 14.4); word(19.0, 13.92, '开水器', 1.6)
fit(21.15, 9.8, 21.6, 14.0); word(21.38, 11.9, '货架', 1.7, 90)
# 女卫生间: three cubicles on the east wall, doors out, so nobody who falls can block the door
SW_ = 0.7
def stall(x_back, x_front, y0_, y1_, sgn):
    v.linem(x_front, y0_, x_front, y0_ + 0.15, 0.18, INK); v.linem(x_front, y0_ + 0.15 + SW_, x_front, y1_, 0.18, INK)
    o = dict(t='door', axis='v', at=y0_ + 0.15, w=SW_, wall=(x_front, x_front), hinge='a', swing=sgn, kind='swing')
    v._door(o, 0.18, 0.09, INK); _doors.append(o)
    wc(x_back, (y0_ + y1_) / 2, 'w' if sgn < 0 else 'e')
FB = [11.4, 12.4, 13.4, 14.4]
for y0_, y1_ in zip(FB, FB[1:]): stall(24.0, 22.8, y0_, y1_, -1)
for yy in FB[:-1]: v.linem(22.8, yy, 24.0, yy, 0.18, INK)
basin(21.8, 9.1, 'e'); basin(21.8, 9.85, 'e')
# 男卫生间: two cubicles and two urinals on the west wall
MB = [12.2, 13.3, 14.4]
for y0_, y1_ in zip(MB, MB[1:]): stall(26.6, 27.8, y0_, y1_, 1)
for yy in MB[:-1]: v.linem(26.6, yy, 27.8, yy, 0.18, INK)
for yy in (10.85, 11.55):
    v.linem(26.6, yy - 0.17, 26.6, yy + 0.17, 0.13, FX); d.ellipse(v.X(26.6), v.Y(yy - 0.17), v.X(26.9), v.Y(yy + 0.17), 0.13, FX); FIXED.append((26.6, yy - 0.17, 26.9, yy + 0.17))
basin(28.8, 9.1, 'w'); basin(28.8, 9.85, 'w')
# 无障碍厕所: door slides into the room
wc(24.7, 11.4, 's'); basin(26.4, 10.85, 'w')
v.linem(24.25, 10.75, 24.25, 11.3, 0.18, FX); v.linem(25.1, 11.32, 25.65, 11.32, 0.18, FX)
v.circlem(25.25, 9.85, 0.75, 0.13, INK, dash=(1.4, 1.0))
word(25.55, 10.72, 'Φ1500', 1.7, 0, INK)
assert 2.2 * 2.8 >= 4.0
# 配电间
fit(24.4, 11.6, 26.2, 12.1); word(25.3, 11.77, '配电柜', 1.7)
# 沐浴间: two showers and one assisted station north, bench, hair corner by the door side
for x0_, x1_ in ((29.1, 30.7), (30.8, 32.4)):
    v.rectm(x0_, 12.9, x1_, 14.4, 0.13, FX, dash=(1.4, 0.9)); FIXED.append((x0_, 12.9, x1_, 14.4)); v.circlem((x0_ + x1_) / 2, 13.9, 0.15, 0.09, FX)
word(29.9, 13.2, '淋浴', 1.7); word(31.6, 13.2, '助浴', 1.7)
fit(29.1, 10.3, 29.5, 12.4); word(29.3, 11.35, '更衣凳', 1.6, 90)
fit(29.1, 9.0, 29.5, 10.1); v.circlem(30.05, 9.55, 0.28, 0.09, FX); word(30.6, 9.42, '理发', 1.7)
basin(32.4, 10.3, 'w')
# 医疗保健室, 心理疏导室, 员工休息室, 阅览室
bed(35.05, 11.3, 0.9, 2.0, 'n'); furn(32.75, 12.9, 34.1, 13.6); basin(32.6, 10.3, 'e'); word(35.5, 12.25, '诊查床', 1.6, 90, GREY)
v.rectm(37.3, 12.6, 38.3, 13.3, 0.09, FURN); FIXED.append((37.3, 12.6, 38.3, 13.3))
for x_, y_ in ((36.7, 12.75), (38.5, 12.75)): v.rectm(x_, y_, x_ + 0.45, y_ + 0.45, 0.09, FURN)
furn(42.7, 9.2, 43.2, 13.6); word(42.95, 11.4, '更衣柜', 1.6, 90, GREY); tab(40.7, 12.75, 1.2, 0.7, 2)
furn(43.5, 9.6, 43.95, 13.9); word(43.72, 11.75, '书架', 1.6, 90, GREY)
for x, y in ((45.1, 12.75), (47.7, 12.75), (47.7, 9.35)): tab(x, y, 1.6, 0.7, 2)
assert 32 == 4 * 8 and AREA['餐厅'] / 1e6 / 32 >= 2.5   # the seats drawn in 餐厅 have 2.5 ㎡ each
for f_ in FIXED:
    for o in _doors:
        assert not _overlap(_swing(o), f_), ('door swing hits a fitting', o, f_)
    for cx_, cy_, s_ in COLS:
        assert not _overlap((cx_ - s_ / 2, cy_ - s_ / 2, cx_ + s_ / 2, cy_ + s_ / 2), f_), ('fitting in a column', f_, cx_, cy_)

# -- walls, doors, windows: hollow with a heavy cut line, solid black columns
def high_win(view, axis, at, w_, wall):
    """A high window is above the cut plane: the wall stays whole and the window shows dashed in it."""
    w0, w1 = wall; t = (w1 - w0) / 3
    for vv in (w0 + t, w1 - t): view._seg(axis, at, vv, at + w_, vv, 0.13, INK, (1.2, 0.8))
    for uu in (at, at + w_): view._seg(axis, uu, w0, uu, w1, 0.13, INK, (0.5, 0.4))
v.draw(B, None, lw=0.5, door_lw=0.25, arc_lw=0.13)
for h_ in HIGH: high_win(v, *h_)
v.linem(25.3, 8.64, 26.3, 8.64, 0.13, INK, dash=(1.2, 0.8))          # parked position of the sliding door
for cx_, cy_, s_ in COLS: v.column(cx_, cy_, s_, INK, lw=0)

# -- axes: stubs outside the plan, bubbles on four sides. Those beside a measured line end stop short of it
def bubble(cx_, cy_, lab):
    d.circle(cx_, cy_, RBUB, 0.18, INK, fill=WHITE)
    d.text(cx_, cy_ - 3.0 * 0.47, lab, 3.0, align='center')
def axis_lines(view, b, t, l, r, gap=7.0, stop_b={}, stop_l={}, east_from=None):
    """b, t, l, r: bubble centre offsets in mm. stop_b, stop_l: {label: offset where the line ends early}."""
    for lab, x in AX.items():
        px = view.X(x)
        d.line(px, view.Y(0) - gap, px, view.Y(0) - (stop_b.get(lab, b - RBUB)), 0.09, INK, DASH); bubble(px, view.Y(0) - b, lab)
        d.line(px, view.Y(D) + gap, px, view.Y(D) + t - RBUB, 0.09, INK, DASH); bubble(px, view.Y(D) + t, lab)
    for lab, y in AY.items():
        py = view.Y(y)
        d.line(view.X(0) - gap, py, view.X(0) - (stop_l.get(lab, l - RBUB)), py, 0.09, INK, DASH); bubble(view.X(0) - l, py, lab)
        start = (east_from or {}).get(lab, gap)
        d.line(view.X(W) + start, py, view.X(W) + r - RBUB, py, 0.09, INK, DASH); bubble(view.X(W) + r, py, lab)
BUB_B, BUB_T, BUB_L, BUB_R = OFF_B[2] + 11, OFF_T[2] + 11, OFF_L[2] + 11, OFF_R[2] + 11
axis_lines(v, BUB_B, BUB_T, BUB_L, BUB_R, stop_b={'1': OFF_B[1] + 2.5, '8': OFF_B[1] + 2.5}, stop_l={'A': OFF_L[1] + 2.5, 'D': OFF_L[1] + 2.5},
           east_from={'B': 46, 'C': 46})

# -- dimension chains: three on each side with the smallest inside
AXS = set(AX.values()) | set(AY.values())
def ticks(side, stops, off, base, exact=False):
    horiz = side in 'bt'; sign = -1 if side in 'bl' else 1
    for i, s in enumerate(stops):
        px, py = (v.X(s), v.Y(base) + sign * off) if horiz else (v.X(base) + sign * off, v.Y(s))
        # 45 degrees clockwise from the extension line: "/" on horizontal chains, "\" on vertical ones
        dx, dy = (1, 1) if horiz else (1, -1)
        if exact and i in (0, len(stops) - 1):       # both halves end exactly on the measured point
            d.line(px - dx, py - dy, px, py, 0.3); d.line(px, py, px + dx, py + dy, 0.3)
        else:
            d.line(px - dx, py - dy, px + dx, py + dy, 0.3)
def chain3(side, inner, mid, whole, offs, base, hold=(), measured=False):
    horiz = side in 'bt'; sign = -1 if side in 'bl' else 1
    origin = v.Y(base) if horiz else v.X(base)
    # Figures sit 1.3 clear of the line, above the top of the ticks. The narrowest spans drop a size so they fit between the extension lines.
    LIFT, HN = 1.3, 1.9
    def fits(i): return d.width(fm(inner[i + 1] - inner[i]), HN) <= (inner[i + 1] - inner[i]) * v.k - 0.4
    labs = [fm(inner[i + 1] - inner[i]) if fits(i) else '' for i in range(len(inner) - 1)]
    v.chain(side, inner, offs[0], base, fm, HN, 'none', labels=labs, ext_from=offs[0] - 1.0, text_gap=LIFT)
    for i in range(len(inner) - 1):
        if labs[i]: continue
        lab_, span_ = fm(inner[i + 1] - inner[i]), (inner[i + 1] - inner[i]) * v.k
        hn_ = HN
        while d.width(lab_, hn_) > span_ - 0.4: hn_ -= 0.05
        assert hn_ >= 1.6, (lab_, hn_)
        mid_ = (inner[i] + inner[i + 1]) / 2
        if horiz: d.text(v.X(mid_), origin + sign * offs[0] + LIFT, lab_, hn_, align='center')
        else: d.text(origin + sign * offs[0] - LIFT, v.Y(mid_), lab_, hn_, align='center', angle=90)
    for s in inner:
        if s in AXS: continue
        start = next((o for a, b_, o in hold if a <= s <= b_), COMB)
        p0, p1 = origin + sign * start, origin + sign * (offs[0] - 1.0)
        if horiz: d.line(v.X(s), p0, v.X(s), p1, 0.09)
        else: d.line(p0, v.Y(s), p1, v.Y(s), 0.09)
    ticks(side, inner, offs[0], base)
    v.chain(side, mid, offs[1], base, fm, 2.1, 'none', ext_from=offs[0] + 3)
    ticks(side, mid, offs[1], base)
    # the overall line: its extension lines stop on the dimension line, so nothing ends just past the measured point
    v.chain(side, whole, offs[2], base, fm, 2.6, 'none', ext_from=offs[0] + 3, ext_over=0 if measured else 1.2)
    ticks(side, whole, offs[2], base, measured)
def stops_of(axis, walls, lo, hi, axes):
    s = {lo, hi} | set(axes)
    for o in B.openings:
        if o['axis'] == axis and o['wall'] in walls and o['t'] != 'gap': s.update((round(o['at'], 4), round(o['at'] + o['w'], 4)))
    for a_, at, w_, wall in HIGH:
        if a_ == axis and wall in walls: s.update((round(at, 4), round(at + w_, 4)))
    return sorted(s)
XIN = [x for x in AX.values() if x not in (0.1, 50.5)]; YIN = [y for y in AY.values() if y not in (0.1, 14.5)]
sS = stops_of('h', (S_,), 0, W, XIN); sN = stops_of('h', (N_,), 0, W, XIN)
sW = sorted({0, D, *YIN, *[q for o in B.openings if o['axis'] == 'v' and o['wall'] == W_ for q in (round(o['at'], 4), round(o['at'] + o['w'], 4))]})
sE = sorted({0, D, *YIN, *[q for o in B.openings if o['axis'] == 'v' and o['wall'] == E_ for q in (round(o['at'], 4), round(o['at'] + o['w'], 4))]})
for s_ in (sS, sN, sW, sE):
    assert min(b - a for a, b in zip(s_, s_[1:])) >= 0.45 - 1e-9, s_
    assert abs(sum(b - a for a, b in zip(s_, s_[1:])) - (s_[-1] - s_[0])) < 1e-9
MIDX, MIDY = list(AX.values()), list(AY.values())
chain3('b', sS, MIDX, [0, W], OFF_B, 0, hold=[(7.9, 11.9, 43), (23.5, 28.1, 46)], measured=True)
chain3('t', sN, MIDX, [0, W], OFF_T, D, hold=[(2.3, 7.0, 31), (24.3, 26.3, 14)])
chain3('l', sW, MIDY, [0, D], OFF_L, 0, measured=True)
chain3('r', sE, MIDY, [0, D], OFF_R, W, hold=[(5.5, 9.1, 46)])

# -- tags, room names, levels
for tag, pos in TAGS:
    if pos is None: continue
    x, y = pos[0], pos[1]; ang = pos[2] if len(pos) > 2 else 0
    d.text(v.X(x), v.Y(y), tag, 1.9, align='center', angle=ang)
def rtag(view, name, x, y, hn=2.5, ha=2.2, lead=1.5, mask=False):
    a = f2(AREA[name])
    if mask:
        wid = max(d.width(name, hn), d.width(a, ha)) + 1.2; tot = hn * lead + ha * 1.25
        d.rect(view.X(x) - wid / 2, view.Y(y) - tot / 2 - 0.3, wid, tot + 0.5, 0, fill=WHITE)
    view.tag(x, y, [(name, hn, False), (a, ha, False)], lead=lead)
for name, x, y, hn, ha in (('餐厅', 5.25, 3.8, 3.6, 2.6), ('棋牌室', 12.0, 4.9, 2.6, 2.2), ('多功能活动室', 18.1, 3.0, 3.0, 2.4), ('门斗', 23.05, 1.2, 2.5, 2.2), ('门厅', 25.3, 4.25, 3.0, 2.4),
                           ('康复训练室', 46.4, 3.5, 3.0, 2.4), ('次入口门斗', 49.0, 7.3, 2.3, 2.1), ('厨房', 3.9, 12.1, 3.0, 2.4), ('配餐间', 8.95, 11.6, 2.5, 2.2),
                           ('洗衣房', 12.6, 11.7, 2.5, 2.2), ('办公室', 16.2, 11.0, 2.5, 2.2), ('茶水间', 19.0, 11.4, 2.3, 2.1), ('库房', 20.55, 11.4, 2.3, 2.1),
                           ('女卫生间', 23.1, 11.0, 2.2, 2.0), ('无障碍厕所', 25.25, 9.85, 2.05, 1.95), ('配电间', 25.3, 12.95, 2.3, 2.1), ('男卫生间', 27.45, 10.3, 2.2, 2.0),
                           ('沐浴间', 31.0, 11.35, 2.5, 2.2), ('医疗保健室', 34.3, 10.55, 2.6, 2.2), ('心理疏导室', 37.9, 11.2, 2.6, 2.2), ('员工休息室', 41.2, 11.1, 2.6, 2.2),
                           ('阅览室', 46.9, 11.1, 3.0, 2.4)):
    rtag(v, name, x, y, hn, ha, mask=name == '无障碍厕所')
for name, x in (('休息室一', 30.7), ('休息室二', 34.3), ('休息室三', 37.9), ('休息室四', 41.5)): rtag(v, name, x, 3.1, 2.3, 2.2)
rtag(v, '走道', 35.2, 7.3, 2.5, 2.2)
def level(x, y, s, solid=False, h=2.0):
    """Right isosceles triangle 3 mm high, point on the level; the value sits on a line running on from its top."""
    px, py = v.X(x), v.Y(y); T_ = 3.0
    d.poly([(px, py), (px - T_, py + T_), (px + T_, py + T_)], True, 0.13, fill=INK if solid else None)
    d.line(px + T_, py + T_, px + T_ + d.width(s, h) + 0.6, py + T_, 0.13)
    d.text(px + T_ + 0.3, py + T_ + 0.55, s, h)
for x, y in ((39.2, 6.97), (22.2, 5.05)): level(x, y, '±0.000')
for x, y in ((5.1, 12.3), (8.5, 10.25), (12.35, 9.72), (22.75, 9.68), (27.45, 11.05), (30.75, 10.05)): level(x, y, '-0.015')
for x, y in ((27.55, -3.4), (10.95, -3.6), (2.75, D + 2.1), (W + 3.0, 4.35)): level(x, y, '-0.150', True)
d.text(v.X(3.7), v.Y(-0.9) - 3.0, '散水 宽900', 1.9, align='center')

# -- north arrow in the clear corner, upper right of the view: 24 mm circle, needle with a 3 mm tail, 北 at its head
NX, NY_ = v.X(W) + 27, v.Y(D) + 15.5
d.circle(NX, NY_, 12, 0.13)
d.poly([(NX, NY_ + 12), (NX + 1.5, NY_ - 12), (NX - 1.5, NY_ - 12)], True, 0, fill=INK)
d.text(NX, NY_ + 13.0, '北', 3.0, True, align='center')

def view_title(cx_, y, name, scale, subs=()):
    hn, hs = 5.0, 3.6
    wn, ws = d.width(name, hn, True), d.width(scale, hs)
    x0_ = cx_ - (wn + 5 + ws) / 2
    d.text(x0_, y, name, hn, True); d.text(x0_ + wn + 5, y, scale, hs)
    d.line(x0_, y - 2.2, x0_ + wn, y - 2.2, 0.7); d.line(x0_, y - 3.3, x0_ + wn, y - 3.3, 0.18)
    yy = y - 8.6
    for s in subs:
        d.text(cx_, yy, s, 2.6, align='center'); yy -= 4.6
view_title(v.X(W / 2), Y1 - BUB_B - RBUB - 11, '一层平面图', '1:100', (f'本层建筑面积:{GROSS}㎡  本栋建筑面积:{GROSS}㎡',))

# ---- view 2: finish zones, single-line on the partition centre lines. Tint runs to those lines, and the 地1 zone has its own closed line
TINT = {'地1': '#b9dfdc', '地2': '#f4eeda', '地3': '#d5e3f1', '地4': '#d8cdbd', '地5': '#e3e4e2'}
ZONE = '#075a63'
for r in ROOMS: u.fill(r[2], r[3], r[2] + r[4], r[3] + r[5], TINT[r[6]])
def partitions(view):
    """Each partition once, as one line: anything ending on the 地1 outline ends exactly on it."""
    seen = set()
    for r in ROOMS:
        x0_, y0_, x1_, y1_ = r[2], r[3], r[2] + r[4], r[3] + r[5]
        for p, q in (((x0_, y0_), (x1_, y0_)), ((x1_, y0_), (x1_, y1_)), ((x1_, y1_), (x0_, y1_)), ((x0_, y1_), (x0_, y0_))):
            seg = tuple(sorted((p, q)))
            if seg in seen: continue
            seen.add(seg)
            view.linem(seg[0][0], seg[0][1], seg[1][0], seg[1][1], 0.18, INK)
partitions(u)
d.poly([u.P(*p) for p in FOOT], True, 0.5, join=0)
d.poly([u.P(*p) for p in T1], True, 0.6, ZONE, join=0)
axis_lines(u, 17, 17, 17, 17)
def ftag(name, x, y, hn=2.3, hk=2.3):
    r = ROOM[name]
    u.tag(x, y, [(name, hn, False), (r[6], hk, True)], lead=1.5)
for r in ROOMS:
    if r[1] in ('走道', '门厅'): continue
    ftag(r[1], r[2] + r[4] / 2, r[3] + r[5] / 2, 2.5 if r[4] < 2.5 and len(r[1]) > 3 else 2.8, 3.0)
u.tag(25.3, 4.3, [('门厅', 2.8, False), ('地1', 3.4, True)], lead=1.5)
u.tag(35.0, 7.3, [('走道', 2.8, False), ('地1', 3.4, True)], lead=1.5)
d.text(u.X(14.4), u.Y(7.15), f'地1分区:走道加门厅,共八个角点,{F1}㎡', 2.9, True, col=ZONE)
view_title(u.X(W / 2), Y2 - 21 - 10, '一层地坪布置图', '1:100', ('本图隔墙按中线绘制,柱、门窗从略。着色至隔墙中线,周边至外墙外皮。',))

# ---- upper right column: area schedule, legend
CX, CW = 664, 104
def tbl_title(cx_, y, s): d.text(cx_, y, s, 3.0, True, align='center')
y = 575.5
tbl_title(CX + CW / 2, y, '房间面积表')
rows = [['序号', '房间名称', '地面做法', '计算面积(㎡)']]
rows += [[r[0], r[1], r[6], f2(AREA[r[1]])] for r in ROOMS]
rows += [['', '本层建筑面积', None, GROSS]]
y = d.table(CX, y - 2.5, [11, 41, 20, 32], rows, 2.0, 4.42, aligns=['center', 'left', 'center', 'right'], bold_rows={len(rows) - 1}, lw=0.18)
y -= 9
tbl_title(CX + CW / 2, y, '图例')
y -= 4.5
def lv(px, py): return View(d, px, py, 100)
def lgd(yy, draw, text):
    draw(CX + 1, yy)
    d.text(CX + 22, yy - 1.0, text, 2.0)
def l_wall(x, yy):
    d.rect(x, yy - 1, 16, 2, 0.5)
def l_col(x, yy):
    d.rect(x + 6, yy - 2, 4, 4, 0, fill=INK); d.rect(x + 12, yy - 3, 6, 6, 0, fill=INK)
def l_win(x, yy):
    for k in (-1, -1 / 3, 1 / 3, 1): d.line(x, yy + k, x + 16, yy + k, 0.18 if abs(k) == 1 else 0.13)
    d.line(x, yy - 1, x, yy + 1, 0.18); d.line(x + 16, yy - 1, x + 16, yy + 1, 0.18)
def l_high(x, yy):
    d.line(x, yy - 1, x + 16, yy - 1, 0.5); d.line(x, yy + 1, x + 16, yy + 1, 0.5)
    d.line(x + 3, yy - 1 / 3, x + 13, yy - 1 / 3, 0.13, dash=(1.2, 0.8)); d.line(x + 3, yy + 1 / 3, x + 13, yy + 1 / 3, 0.13, dash=(1.2, 0.8))
def l_door(x, yy):
    b_ = Building(); b_.wall(0, -0.1, 1.6, 0.1); b_.door('h', 0.5, 0.6, (-0.1, 0.1), 'a', 1)
    lv(x, yy - 2.0).draw(b_, None, lw=0.5, door_lw=0.25, arc_lw=0.13)
def l_slide(x, yy):
    b_ = Building(); b_.wall(0, -0.1, 1.6, 0.1); b_.door('h', 0.3, 0.6, (-0.1, 0.1), kind='slide')
    q = lv(x, yy); q.draw(b_, None, lw=0.5, door_lw=0.25, arc_lw=0.13); q.linem(0.9, 0.14, 1.5, 0.14, 0.13, INK, dash=(1.2, 0.8))
def l_slope(x, yy):
    d.line(x, yy, x + 15, yy, 0.13); d.poly([(x + 16, yy), (x + 14.2, yy + 0.5), (x + 14.2, yy - 0.5)], True, 0, fill=INK); d.text(x + 5, yy + 0.6, '1:20', 1.8)
def l_can(x, yy): d.line(x, yy, x + 16, yy, 0.18, dash=(2.0, 1.2))
def l_sw(x, yy): d.line(x, yy, x + 16, yy, 0.13)
def l_ax(x, yy): d.line(x, yy, x + 16, yy, 0.09, dash=DASH)
def l_lv(x, yy):
    for px, sol in ((x + 4, False), (x + 12, True)):
        d.poly([(px, yy - 1.6), (px - 3, yy + 1.4), (px + 3, yy + 1.4)], True, 0.13, fill=INK if sol else None)
def l_zone(x, yy): d.line(x, yy, x + 16, yy, 0.6, ZONE)
def l_turn(x, yy): d.circle(x + 8, yy, 2.3, 0.13, INK, dash=(1.4, 1.0))
LG = [(l_wall, '墙体,厚200,粗实线'), (l_col, '框架柱400×400,四角角柱600×600'), (l_door, '平开门,弧线示开启方向'), (l_slide, '推拉门,虚线示推入位置'),
      (l_win, '窗'), (l_high, '高窗,虚线,窗台高于剖切面'), (l_lv, '室内标高(空心)、室外标高(实心)'), (l_slope, '坡道,箭头指向下坡'),
      (l_can, '雨篷投影,不计入建筑面积'), (l_sw, '散水,不计入建筑面积'), (l_turn, '轮椅回转空间Φ1500,虚线'), (l_ax, '定位轴线'), (l_zone, '地1分区线,在隔墙中线上')]
for fn, s in LG:
    if fn is l_door: y -= 1.4
    y -= 3.1
    lgd(y, fn, s)
    y -= 2.85
LEG_END = y

# ---- lower right block: practice panel, floor schedule, door and window schedule, notes
LX, LW = 606, 162
ptop = 349
GAP = 20
assert LEG_END > ptop + 3, LEG_END
key_w, val_w = 28, 33
txt_w = LW - key_w - val_w - 8
STEPS = (('校准', f'一层平面图下方最外一道尺寸线 {fm(W)},点取线的两个端点,输入 {fm(W)} 毫米(长度单位为米时输入 {W})。', fm(W)),
         ('一、核对长度', f'一层平面图左侧最外一道尺寸线 {fm(D)},点取线的两个端点。', f'{D:.2f} m'),
         ('二、建筑面积', '一层平面图,沿外墙外皮的粗实线依次点取四个外角。不要沿散水细线、坡道或雨篷虚线。', f'{GROSS} ㎡'),
         ('三、地1面积', '一层地坪布置图,沿走道加门厅的深色分区线依次点取八个角点。该线在隔墙中线上,着色到此线为止。', f'{F1} ㎡'))
TH, LEAD = 2.8, 1.62
line_counts = [len(d.wrap(s[1], txt_w, TH)) for s in STEPS]
NOTES_P = ['点取角点前请先放大图面:低倍率时 Snap to Content 可能捕捉到相邻的墙面,结果会有偏差。', '两个平面图比例均为 1:100,校准一次即可。面积不扣除墙体和柱。']
note_lines = sum(len(d.wrap(s, LW - 8, 2.6)) for s in NOTES_P)
pan_h = 11.5 + sum(n * TH * LEAD + 2.6 for n in line_counts) + 3.0 + note_lines * 2.6 * 1.6 + 3.0
d.rect(LX, ptop - pan_h, LW, pan_h, 0.5)
d.rect(LX, ptop - 10, LW, 10, 0, fill='#e4f0ef')
d.line(LX, ptop - 10, LX + LW, ptop - 10, 0.25)
d.text(LX + 4, ptop - 7.0, '测量练习', 4.0, True)
d.text(LX + 4 + d.width('测量练习', 4.0, True) + 4, ptop - 6.8, '先校准,再量以下三项,结果应与右列数值一致。', 2.7)
y = ptop - 12.8
for (k, s, val), n in zip(STEPS, line_counts):
    d.text(LX + 4, y - TH, k, TH, True)
    yy = y - TH
    for ln in d.wrap(s, txt_w, TH):
        d.text(LX + 4 + key_w, yy, ln, TH); yy -= TH * LEAD
    d.text(LX + LW - 4, y - TH, val, 3.4, True, align='right')
    y -= n * TH * LEAD + 2.6
d.line(LX + 4, y - 0.2, LX + LW - 4, y - 0.2, 0.13, GREY)
y -= 2.8
for s in NOTES_P:
    y = d.para(LX + 4, y, LW - 8, s, 2.6, lead=1.6) - 0.3
y = ptop - pan_h - GAP

tbl_title(LX + LW / 2, y, '构造做法表(地面)')
frows = [['编号', '做法名称', '计算面积(㎡)']] + [[k, FIN[k], f2(BYKEY[k])] for k in FIN] + [['', '合计', GROSS]]
for i, k in enumerate(FIN):
    d.rect(LX, y - 2.5 - 5.2 * (i + 2), 16, 5.2, 0, fill=TINT[k])
y = d.table(LX, y - 2.5, [16, 104, 42], frows, 2.3, 5.2, aligns=['center', 'left', 'right'], bold_rows={6}, lw=0.18) - GAP

tbl_title(LX + LW / 2, y, '门窗表')
OPN = (('M1021', '平开门'), ('M1221', '双扇平开门,厨房货运'), ('M1521', '双扇平开门'), ('M1824', '双扇平开门,主入口、门斗内门、餐厅'), ('TM1021', '推拉门,无障碍厕所'),
       ('FM乙0921', '乙级防火门,配电间,外开'), ('C1821', '窗'), ('C1221', '窗,主入口门斗'), ('C1518', '窗'), ('C0918', '窗,茶水间、库房'),
       ('C1209', '高窗,窗台高1800'), ('DK1512', '传菜窗口,配餐间至餐厅,窗台高900'))
assert {t for t, _ in OPN} == set(COUNT), set(COUNT) ^ {t for t, _ in OPN}
orows = [['编号', '洞口尺寸(宽×高)', '樘数', '备注']]
for t, note in OPN:
    w_, h_ = size_of(t)
    orows.append([t, f'{w_}×{h_}', str(COUNT[t]), note])
y = d.table(LX, y - 2.5, [27, 38, 13, 84], orows, 2.3, 5.2, aligns=['left', 'left', 'center', 'left'], lw=0.18) - 2.0
d.text(LX, y - 2.3, '门窗编号中的数字为洞口宽、高(分米)。卫生间隔断及隔断门为成品,未列入本表。', 2.3)
y -= GAP - 1

tbl_title(LX + 12, y, '说明')
y -= 2.2
NOTES = ('虚构练习用图,不得用于施工,不声明符合任何规范。',
         '除标高以米计外,其余尺寸均以毫米计。采用地3地面的房间标高为-0.015,其余室内标高为±0.000,室外地坪为-0.150。',
         '图中房间面积按尺寸线计算(隔墙中线,周边至外墙外皮),未扣除墙体,合计等于本层建筑面积。',
         '面积为练习计算值,未按工程量清单规则增减门洞、柱等,不作为规划、测绘或计价依据。',
         '两处门斗按假定位于寒冷地区设置;该地区为本图假定,不对应任何实际地点。',
         '散水、坡道、室外平台及雨篷均不计入建筑面积。',
         '周边柱外皮与外墙外皮平齐,外墙轴线居墙中,内柱居轴线。')
for i, s in enumerate(NOTES):
    d.text(LX, y - 2.5, f'{i + 1}.', 2.5)
    y = d.para(LX + 4.8, y, LW - 4.8, s, 2.5, lead=1.58) - 1.3
assert y > FY0 + 2, y
print('notes end at', round(y, 1))

# ---- title strip: full height down the right of the frame, fields in the order the published sheets use
d.line(SX, FY0, SX, FY1, 0.7)
FIELD_LAB = 1.9
def cell(x, y_top, w_, h_, lab, val=None, vh=2.5, bold=False, align='center'):
    d.rect(x, y_top - h_, w_, h_, 0.25)
    if lab: d.text(x + 1.3, y_top - FIELD_LAB - 1.4, lab, FIELD_LAB, col=GREY)
    if val:
        parts = val.split('\n')
        lead = vh * 1.55
        total = vh + (len(parts) - 1) * lead
        room_top = y_top - (FIELD_LAB + 2.0 if lab else 0)
        ty = (room_top + (y_top - h_)) / 2 + total / 2 - vh
        for p in parts:
            tx = x + w_ / 2 if align == 'center' else x + 1.8
            d.text(tx, ty, p, vh, bold, align=align); ty -= lead
sy = FY1
h_ = 8; d.rect(SX, sy - h_, SW, h_, 0.25); d.text(SX + SW / 2, sy - 5.9, '会签栏', 2.6, True, align='center'); sy -= h_
for s in ('建筑', '结构', '给排水', '暖通', '电气'):
    cell(SX, sy, 18, 9, '', s, 2.2); cell(SX + 18, sy, 26, 9, ''); cell(SX + 44, sy, 16, 9, ''); sy -= 9
RUNS = dict(rev=7.5, client=30, designer=30, project=44, lad=10.5, sub=22, name=38, pair=20, num=38)
STAMP_H = 574 - (8 + 45 + 8 + 5 * RUNS['rev'] + RUNS['client'] + RUNS['designer'] + RUNS['project'] + 7 * RUNS['lad'] + RUNS['sub'] + RUNS['name'] + 4 * RUNS['pair'] + RUNS['num'])
assert STAMP_H > 40, STAMP_H
cell(SX, sy, SW, STAMP_H, '印章')
scy = sy - STAMP_H / 2 + 1
d.rect(SX + 5, scy - 12, SW - 10, 26, 0.7)
d.text(SX + SW / 2, scy + 5.0, '虚构练习用图', 4.0, True, align='center')
d.text(SX + SW / 2, scy - 3.4, '不得用于施工', 4.0, True, align='center')
d.text(SX + SW / 2, scy - 9.4, '虚构建筑', 2.2, align='center')
d.text(SX + SW / 2, scy - 17.5, '本图未经任何中国专业人员审核。', 2.5, align='center')
sy -= STAMP_H
h_ = 8; d.rect(SX, sy - h_, SW, h_, 0.25); d.text(SX + SW / 2, sy - 5.9, '修改记录', 2.6, True, align='center'); sy -= h_
for i in range(5):
    cell(SX, sy, 10, RUNS['rev'], ''); cell(SX + 10, sy, 34, RUNS['rev'], ''); cell(SX + 44, sy, 16, RUNS['rev'], ''); sy -= RUNS['rev']
cell(SX, sy, SW, RUNS['client'], '建设单位', '示例建设单位(虚构)', 2.5); sy -= RUNS['client']
cell(SX, sy, SW, RUNS['designer'], '设计单位', 'PolyPDF 练习图库\n(非设计单位)', 2.5); sy -= RUNS['designer']
cell(SX, sy, SW, RUNS['project'], '项目名称', '示例市青禾社区\n老年人日间照料中心\n(虚构)', 2.7, True); sy -= RUNS['project']
for s in ('审定', '项目负责人', '审核', '专业负责人', '校对', '设计', '制图'):
    cell(SX, sy, 26, RUNS['lad'], '', s, 2.2); cell(SX + 26, sy, 34, RUNS['lad'], '', '—', 2.2); sy -= RUNS['lad']
cell(SX, sy, SW, RUNS['sub'], '子项名称', '主体建筑', 2.7); sy -= RUNS['sub']
cell(SX, sy, SW, RUNS['name'], '图名', '一层平面图\n一层地坪布置图', 3.2, True); sy -= RUNS['name']
cell(SX, sy, 30, RUNS['pair'], '版次', '第1版', 2.6); cell(SX + 30, sy, 30, RUNS['pair'], '阶段', '练习图', 2.6); sy -= RUNS['pair']
cell(SX, sy, SW, RUNS['pair'], '工程编号', 'LX-2026-01', 2.7); sy -= RUNS['pair']
cell(SX, sy, SW, RUNS['num'], '图号', '建-03', 6.0, True); sy -= RUNS['num']
cell(SX, sy, 30, RUNS['pair'], '比例', '1:100', 2.8); cell(SX + 30, sy, 30, RUNS['pair'], '图幅', 'A1', 2.8); sy -= RUNS['pair']
assert sy - RUNS['pair'] == FY0, sy
cell(SX, sy, SW, RUNS['pair'], '日期', '2026.11', 2.8)
d.text(FX1, 5.2, 'PolyPDF 练习图', 1.8, col=GREY, align='right', track=False)

# ---- measuring facts, in sheet millimetres
CALY, CHKX = v.Y(0) - OFF_B[2], v.X(0) - OFF_L[2]
CAL = [(v.X(0), CALY), (v.X(W), CALY)]
CHK = [(CHKX, v.Y(0)), (CHKX, v.Y(D))]
d.expect('calibrate', p0=CAL[0], p1=CAL[1], metres=W, note='printed 50600: outermost chain below 一层平面图, line ends, outer wall face to outer wall face')
d.expect('check', p0=CHK[0], p1=CHK[1], metres=D, note='printed 14600: outermost chain left of 一层平面图, line ends')
d.expect('gross', pts=[v.P(*p) for p in FOOT], sqm=GROSS_MM2 / 1e6, perimeter=poly_perimeter(FOOT), note='本层建筑面积: four outer corners of the heavy wall line on 一层平面图')
d.expect('floor', pts=[u.P(*p) for p in T1], sqm=F1_MM2 / 1e6, perimeter=poly_perimeter(T1), note='地1, 走道 plus 门厅: eight corners of the zone line on 一层地坪布置图, on partition centre lines')
d.save()
