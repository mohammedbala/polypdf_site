#!/usr/bin/env python3
"""Japan: 地区集会所 (a residents' association hall), A3 landscape, 1/100. Timber on the 910 module, wall-centre areas."""
import sys
from pathlib import Path
from draftkit import *

OUT = Path(sys.argv[1] if len(sys.argv) > 1 else 'out'); OUT.mkdir(exist_ok=True)
# Both font files still carry the PostScript name NotoSansJP-Thin. ReportLab keys TrueType faces on that name, so a plain
# register_font('JP-B', ...) quietly reuses the Regular outlines and nothing is bold. Give each face its own name first.
def reg_font(name, path, ps):
    f = TTFont(name, path); f.face.name = ps; pdfmetrics.registerFont(f)
reg_font('JP', '../fonts/NotoSansJP-Regular.ttf', b'NotoSansJP-Regular')
reg_font('JP-B', '../fonts/NotoSansJP-Bold.ttf', b'NotoSansJP-Bold')

# ---- geometry (metres on wall centres, lower-left corner at X1/Y1, north up)
W, D = 14.56, 10.92
XAX = {'X1': 0.0, 'X2': 3.64, 'X3': 7.28, 'X4': 10.92, 'X5': 14.56}
YAX = {'Y1': 0.0, 'Y2': 1.82, 'Y3': 3.64, 'Y4': 5.46, 'Y5': 6.37, 'Y6': 8.19, 'Y7': 10.92}
FOOT = [(0, 0), (3.64, 0), (3.64, 1.82), (7.28, 1.82), (7.28, 0), (14.56, 0), (14.56, 10.92), (0, 10.92)]
HALL = [(7.28, 0), (14.56, 0), (14.56, 8.19), (7.28, 8.19)]
FIN = {'tile': '磁器質タイル貼り(100角)', 'anti': '防滑性ビニル床シート貼り t=2', 'fs': '複層ビニル床シート(FS)貼り t=2',
       'floor': '複合フローリング貼り t=13', 'tatami': '畳敷き', 'ply': '合板張り'}
# 記号, 室名, x, y, width, depth, finish
ROOMS = [('1', '玄関', 3.64, 1.82, 3.64, 1.82, 'tile'),
         ('2', 'ホール', 3.64, 3.64, 1.82, 2.73, 'anti'),
         ('3', '事務室', 5.46, 3.64, 1.82, 2.73, 'anti'),
         ('4', '廊下', 0.0, 6.37, 7.28, 1.82, 'anti'),
         ('5', '集会室', 7.28, 0.0, 7.28, 8.19, 'floor'),
         ('6', '和室(12畳)', 0.0, 0.0, 3.64, 5.46, 'tatami'),
         ('7', '押入', 0.0, 5.46, 3.64, 0.91, 'ply'),
         ('8', '男子トイレ', 0.0, 8.19, 2.73, 2.73, 'fs'),
         ('9', '女子トイレ', 2.73, 8.19, 2.73, 2.73, 'fs'),
         ('10', 'バリアフリートイレ', 5.46, 8.19, 2.73, 2.73, 'fs'),
         ('11', '湯沸室', 8.19, 8.19, 2.73, 2.73, 'fs'),
         ('12', '倉庫', 10.92, 8.19, 3.64, 2.73, 'anti')]
check_tiling([r[2:6] for r in ROOMS], FOOT)

def mm2(w, d): return round(w * 1000) * round(d * 1000)        # exact integer mm², no float drift
def f4(a): return f'{a // 10 ** 6}.{(a % 10 ** 6) // 100:04d}'  # 4 decimals of ㎡, as on the schedule
def t2(a): return f'{a // 10 ** 6}.{(a % 10 ** 6) // 10 ** 4:02d}'  # truncated to 2 decimals of ㎡
def m3(v): return f'{v:.3f}'
AREA = {r[0]: mm2(r[4], r[5]) for r in ROOMS}
FLOOR_MM2 = sum(AREA.values())
BLDG_MM2 = mm2(W, D)
PORCH_MM2 = mm2(3.64, 1.82)
HALL_MM2 = AREA['5']
assert FLOOR_MM2 == 152370400 and BLDG_MM2 == 158995200 and HALL_MM2 == 59623200, (FLOOR_MM2, BLDG_MM2, HALL_MM2)
assert BLDG_MM2 - PORCH_MM2 == FLOOR_MM2
assert abs(poly_area(FOOT) - FLOOR_MM2 / 1e6) < 1e-6 and abs(poly_area(HALL) - HALL_MM2 / 1e6) < 1e-6
FLOOR, BLDG, HALLT = t2(FLOOR_MM2), t2(BLDG_MM2), t2(HALL_MM2)
assert (FLOOR, BLDG, HALLT) == ('152.37', '158.99', '59.62')

# 12畳 on the 910 module, in 祝儀敷き: (col, row, cols, rows) in module cells, 4 wide by 6 deep.
MATS = [(0, 0, 2, 1), (2, 0, 2, 1), (1, 1, 2, 1), (0, 1, 1, 2), (3, 1, 1, 2), (1, 2, 1, 2), (2, 2, 1, 2),
        (0, 3, 1, 2), (3, 3, 1, 2), (1, 4, 2, 1), (0, 5, 2, 1), (2, 5, 2, 1)]
assert len(MATS) == 12 and sum(c * r for _, _, c, r in MATS) == 24
_cells = {(i + a, j + b) for i, j, c, r in MATS for a in range(c) for b in range(r)}
assert len(_cells) == 24
_corners = {}
for i, j, c, r in MATS:
    for p in ((i, j), (i + c, j), (i, j + r), (i + c, j + r)):
        _corners[p] = _corners.get(p, 0) + 1
assert max(_corners.values()) <= 3, 'four mats meet at a point'

# ---- walls: straddle the centre lines
ex, it = 0.09, 0.0725
B = Building()
for r in ((-ex, -ex, 3.64 + ex, ex), (3.64 - ex, -ex, 3.64 + ex, 1.82 + ex), (3.64 - ex, 1.82 - ex, 7.28 + ex, 1.82 + ex),
          (7.28 - ex, -ex, 7.28 + ex, 1.82 + ex), (7.28 - ex, -ex, 14.56 + ex, ex), (14.56 - ex, -ex, 14.56 + ex, 10.92 + ex),
          (-ex, 10.92 - ex, 14.56 + ex, 10.92 + ex), (-ex, -ex, ex, 10.92 + ex)):
    B.wall(*r, 'ext')
for r in ((3.64 - it, 1.82, 3.64 + it, 6.37 + it), (0, 5.46 - it, 3.64, 5.46 + it), (0, 6.37 - it, 3.64 + it, 6.37 + it),
          (5.46 - it, 6.37 - it, 7.28, 6.37 + it), (5.46 - it, 3.64 - it, 7.28, 3.64 + it), (5.46 - it, 3.64, 5.46 + it, 6.37),
          (7.28 - it, 1.82, 7.28 + it, 8.19 + it), (0, 8.19 - it, 14.56, 8.19 + it), (2.73 - it, 8.19, 2.73 + it, 10.92),
          (5.46 - it, 8.19, 5.46 + it, 10.92), (8.19 - it, 8.19, 8.19 + it, 10.92), (10.92 - it, 8.19, 10.92 + it, 10.92)):
    B.wall(*r, 'int')

def wx(c, half): return (round(c - half, 4), round(c + half, 4))
S_, N_, W_, E_ = wx(0, ex), wx(10.92, ex), wx(0, ex), wx(14.56, ex)
W8 = wx(8.19, it)     # the long north wall of 廊下 and 集会室
def bay(p0, p1): return round(p0 + it, 4), round(p1 - p0 - 2 * it, 4)   # an opening fills a post bay

WINS = []
def aw(axis, p0, p1, wall, tag='AW-1'):
    at, w = bay(p0, p1)
    B.gap(axis, at, w, wall)
    WINS.append((axis, at, w, wall))
aw('h', 0.91, 2.73, S_)               # 和室 south
aw('v', 1.82, 3.64, W_)               # 和室 west
aw('h', 8.19, 10.01, S_); aw('h', 10.92, 12.74, S_); aw('h', 12.74, 13.65, S_)   # 集会室 south, kept off the corners and X4
aw('v', 0.455, 1.365, wx(7.28, ex))   # 集会室 west, facing the porch
aw('v', 1.82, 3.64, E_); aw('v', 6.37, 8.19, E_)  # 集会室 east
aw('h', 0.91, 1.82, N_); aw('h', 2.73, 3.64, N_); aw('h', 6.37, 7.28, N_); aw('h', 9.10, 10.01, N_)   # toilets, 湯沸室
aw('h', 5.915, 6.825, wx(3.64, it))   # 受付窓 from 事務室 to 玄関

# doors: exterior doors and the 集会室 doors open away from the room
a, w = bay(4.55, 6.37); B.door('h', a, w, wx(1.82, ex), 'both', -1)              # AD-1 main entrance, into the porch
a, w = bay(3.64, 5.46); B.door('v', a, w, E_, 'both', 1)                         # AD-1 second exit
a, w = bay(6.825, 7.735); B.door('v', a, w, W_, 'b', -1)                         # AD-2 廊下 west end
B.gap('v', 6.37 + it, 1.82 - 2 * it, wx(7.28, it))                               # WD-1 廊下 to 集会室, drawn after the walls
WD1 = dict(t='door', axis='v', at=6.48, w=1.60, wall=wx(7.28, it), hinge='both', swing=-1, kind='swing')   # 800 leaves stop short of the 片引き
a, w = bay(1.82, 2.73); B.door('h', a, w, W8, 'b', 1)                            # WD-2 男子トイレ
a, w = bay(2.73, 3.64); B.door('h', a, w, W8, 'a', 1)                            # WD-2 女子トイレ
a, w = bay(5.46, 6.37); B.door('v', a, w, wx(5.46, it), 'b', 1)                  # WD-2 事務室
BF_AT, BF_W = 5.54, 0.86
B.door('h', BF_AT, BF_W, W8, kind='slide')                                       # WD-3 バリアフリートイレ
a, w = bay(9.10, 10.01); YU_AT, YU_W = a, w; B.door('h', a, w, W8, kind='slide') # WD-3 湯沸室
a, w = bay(3.64, 5.46); B.door('v', a, w, wx(3.64, it), kind='bislide')          # WD-4 和室
a, w = bay(11.83, 13.65); B.door('h', a, w, W8, kind='bislide')                  # WD-4 倉庫
B.door('h', 0.09, 1.82 - it - 0.09, wx(5.46, it), kind='bislide')                # WD-5 押入
a, w = bay(1.82, 3.64); B.door('h', a, w, wx(5.46, it), kind='bislide')

POSTS = sorted({*[(0, y) for y in (0, 1.82, 3.64, 5.46, 6.37, 8.19, 10.01, 10.92)],
                *[(x, 0) for x in (0.91, 2.73, 3.64, 7.28, 8.19, 10.01, 10.92, 12.74, 13.65, 14.56)],
                *[(3.64, y) for y in (1.82, 3.64, 5.46, 6.37, 8.19, 10.92)],
                *[(x, 1.82) for x in (4.55, 6.37, 7.28)],
                *[(7.28, y) for y in (0.455, 1.365, 3.64, 5.46, 6.37, 8.19, 10.92)],
                *[(14.56, y) for y in (1.82, 3.64, 5.46, 6.37, 8.19, 10.01, 10.92)],
                *[(x, 10.92) for x in (0.91, 1.82, 2.73, 5.46, 6.37, 8.19, 9.10, 10.01, 10.92, 12.74)],
                *[(x, 8.19) for x in (1.82, 2.73, 5.46, 6.46, 8.19, 9.10, 10.01, 10.92, 11.83, 13.65)],
                *[(x, 10.01) for x in (2.73, 5.46, 8.19, 10.92)],
                *[(x, 6.37) for x in (1.82, 5.46)], (1.82, 5.46), (5.46, 3.64), (5.915, 3.64), (6.825, 3.64),
                (0, 6.825), (0, 7.735), (5.46, 5.46)})
def in_opening(x, y):
    for o in B.openings:
        u, n = (x, y) if o['axis'] == 'h' else (y, x)
        if o['wall'][0] < n < o['wall'][1] and o['at'] + 1e-6 < u < o['at'] + o['w'] - 1e-6:
            return True
    return False
for x, y in POSTS:     # no post may stand in an opening, and every post sits on a wall
    assert not in_opening(x, y), f'post {x, y} in an opening'
    assert any(w[0] < x < w[2] and w[1] < y < w[3] for w in B.walls), f'post {x, y} off the walls'
for x in XAX.values():  # every axis crossing that lands on a wall carries a post
    for y in YAX.values():
        if any(w[0] < x < w[2] and w[1] < y < w[3] for w in B.walls):
            assert not in_opening(x, y), f'axis crossing {x, y} falls in an opening'
            assert (x, y) in POSTS, f'axis crossing {x, y} has no post'

# ---- the sheet
class JDoc(Doc):
    """Everything on this sheet sits in Japanese text, so every bracket prints full-width."""
    @staticmethod
    def _runs(s):
        return [(t.replace('(', '（').replace(')', '）'), up) for t, up in Doc._runs(s)]
d = JDoc(OUT / 'ja.pdf', (420, 297), '見本図 見本町三丁目集会所 平面図 1/100（架空）',
        subject='PolyPDF 練習用の見本図。架空の建物で、施工・確認申請には使用できません。', font='JP', font_b='JP-B', wrap='cjk',
        keywords='見本図, 平面図, 面積表, 壁芯')
d.frame(10, 10, 410, 287)
fm = fmt_mm(',')
WALL_LW = 0.35
v = View(d, 47, 143, 100)
XA, YA = list(XAX.values()), list(YAX.values())
def on_axis(val, axes): return any(abs(val - q) < 1e-9 for q in axes)

# -- light furniture first: 長机 in ロの字 for a meeting of about thirty
def chairs_along(x0, y0, x1, y1, n, dx, dy, cs=0.36):
    for i in range(n):
        cx = x0 + (x1 - x0) * (i + 0.5) / n; cy = y0 + (y1 - y0) * (i + 0.5) / n
        v.rectm(cx + dx - cs / 2, cy + dy - cs / 2, cx + dx + cs / 2, cy + dy + cs / 2, 0.09, LIGHT)
for tx in (8.22, 10.02, 11.82):
    v.rectm(tx, 1.30, tx + 1.8, 1.75, 0.09, LIGHT); chairs_along(tx, 1.30, tx + 1.8, 1.30, 3, 0, -0.24)
    v.rectm(tx, 6.25, tx + 1.8, 6.70, 0.09, LIGHT); chairs_along(tx, 6.70, tx + 1.8, 6.70, 3, 0, 0.24)
for ty in (2.20, 4.00):
    v.rectm(8.70, ty, 9.15, ty + 1.8, 0.09, LIGHT); chairs_along(8.70, ty, 8.70, ty + 1.8, 3, -0.24, 0)
    v.rectm(12.69, ty, 13.14, ty + 1.8, 0.09, LIGHT); chairs_along(13.14, ty, 13.14, ty + 1.8, 3, 0.24, 0)
# -- 畳割り, inside the wall faces
mx0, my0, mx1, my1 = ex, ex, 3.64 - it, 5.46 - it
mw, md = (mx1 - mx0) / 4, (my1 - my0) / 6
for i, j, c, r in MATS:
    v.rectm(mx0 + i * mw, my0 + j * md, mx0 + (i + c) * mw, my0 + (j + r) * md, 0.09, GREY)

# -- axes
AX_TOP, AX_BOT, AX_L, AX_R = 2.4, 3.85, 2.4, 3.0     # how far past the building each axis runs, in metres
for n, x in XAX.items(): v.axis('x', x, n, -AX_BOT, D + AX_TOP, 'both', r=3.2, h=2.3)
for n, y in YAX.items(): v.axis('y', y, n, -AX_L, W + AX_R, 'both', r=3.2, h=2.3)
# wall centres that carry no axis
for x, y0, y1 in ((2.73, 8.19, 10.92), (5.46, 8.19, 10.92), (8.19, 8.19, 10.92), (5.46, 3.64, 6.37)):
    v.linem(x, y0, x, y1, 0.09, INK, dash=(3, 0.8, 0.8, 0.8))

# -- walls, doors
v.draw(B, None, lw=WALL_LW, door_lw=0.2, arc_lw=0.09)
v._door(WD1, 0.2, 0.09, INK)
def draw_win(view, axis, at, wid, wall, lw=0.25):
    """引違い窓: the wall lines stop; two offset sashes with a short tick at the meet."""
    w0, w1 = wall; t = (w1 - w0) / 3
    view._seg(axis, at, w0, at, w1, 0.18); view._seg(axis, at + wid, w0, at + wid, w1, 0.18)
    view._seg(axis, at, w0 + t, at + wid * 0.53, w0 + t, lw)
    view._seg(axis, at + wid * 0.47, w1 - t, at + wid, w1 - t, lw)
    view._seg(axis, at + wid * 0.5, w0, at + wid * 0.5, w1, 0.13)
for w_ in WINS: draw_win(v, *w_)
# parked position of the 片引き leaves, inside the room
for at_, wd_ in ((BF_AT, BF_W), (YU_AT, YU_W)):
    v.linem(at_ + wd_, 8.19 + it + 0.04, at_ + 2 * wd_, 8.19 + it + 0.04, 0.13, INK, dash=(1.2, 0.8))

# -- fixtures
FX = GREY
def booth_door(at, wid, y, hinge): v._door(dict(axis='h', at=at, w=wid, wall=(y, y), hinge=hinge, swing=1, kind='swing'), 0.18, 0.09, INK)
def urinal(x, y):
    v.linem(x - 0.17, y, x + 0.17, y, 0.13, FX)
    d.ellipse(v.X(x - 0.17), v.Y(y - 0.30), v.X(x + 0.17), v.Y(y), 0.13, FX)
BY = 9.20                        # front of the WC booths
# 男子トイレ: one booth in the corner away from the door's line of sight is impossible here, so the booth takes the door's line and the urinals sit west
v.linem(1.75, BY, 1.75, 10.92 - ex, 0.18, INK)
v.linem(1.75, BY, 1.90, BY, 0.18, INK); v.linem(2.50, BY, 2.73 - it, BY, 0.18, INK)
booth_door(1.90, 0.60, BY, 'b'); v.wc(2.20, 10.92 - ex, 's', FX)
urinal(0.55, 10.92 - ex); urinal(1.25, 10.92 - ex)
v.basin(ex, 8.70, 'e', FX, w=0.46, depth=0.36)
# 女子トイレ: two booths, east of the door
for x in (3.72, 4.555): v.linem(x, BY, x, 10.92 - ex, 0.18, INK)
for g0, g1 in ((3.72, 3.84), (4.44, 4.67), (5.27, 5.46 - it)): v.linem(g0, BY, g1, BY, 0.18, INK)
booth_door(3.84, 0.60, BY, 'a'); booth_door(4.67, 0.60, BY, 'a')
v.wc(4.1375, 10.92 - ex, 's', FX); v.wc(4.97, 10.92 - ex, 's', FX)
v.basin(2.73 + it, 9.60, 'e', FX, w=0.46, depth=0.36)
# バリアフリートイレ
v.wc(8.19 - it, 10.35, 'w', FX); v.basin(5.46 + it, 9.30, 'e', FX, w=0.50, depth=0.40)
v.linem(7.32, 10.77, 8.05, 10.77, 0.18, FX); v.linem(7.40, 10.02, 8.05, 10.02, 0.18, FX)     # 手すり
v.circlem(6.90, 9.10, 0.75, 0.13, INK, dash=(1.4, 1.0))                                      # φ1,500
# 湯沸室
v.rectm(8.19 + it, 10.23, 10.92 - it, 10.92 - ex, 0.13, FX)
v.rectm(8.50, 10.33, 9.20, 10.73, 0.13, FX)
v.circlem(10.05, 10.53, 0.13, 0.09, FX); v.circlem(10.50, 10.53, 0.13, 0.09, FX)
# 倉庫, 玄関, 事務室
v.rectm(10.92 + it, 10.40, 14.56 - ex, 10.92 - ex, 0.13, FX)
v.rectm(3.64 + it, 1.82 + ex, 3.64 + it + 0.40, 3.64 - it, 0.13, FX)                          # 下足入
v.rectm(5.70, 3.64 + it + 0.03, 7.10, 4.20, 0.09, LIGHT)                                      # 事務室 desk under the hatch
v.rectm(5.915, 3.64 - it - 0.14, 6.825, 3.64 - it, 0.13, FX)                                  # 受付窓 shelf
v.linem(3.64 + it, 3.64, 5.46 - it, 3.64, 0.2, INK)                                           # floor-finish change at the shoe line

# -- outside the footprint: porch landing, steps, ramp, and stoops at the two side doors
LP = 0.18
d.poly([v.P(3.64, -ex), v.P(3.64, -1.20), v.P(7.28, -1.20)], False, LP)
v.linem(7.28, -0.30, 7.28, -ex, LP, INK)
v.steps(3.64, -1.80, 7.28, -1.20, 2, 'n', LP, INK)
v.ramp(7.28, -1.20, 12.08, -0.30, 'w', None, 1.7, LP, INK)
v.rectm(14.56 + ex, 3.64, 15.55, 5.46, LP, INK); v.steps(15.55, 3.64, 16.15, 5.46, 2, 'e', LP, INK)
v.rectm(-1.00, 6.37, -ex, 8.19, LP, INK); v.steps(-1.00, 5.77, -ex, 6.37, 2, 's', LP, INK)

# -- posts, on top of everything in the walls
for x, y in POSTS: v.column(x, y, 0.12, cross=True, lw=0.18)

# -- dimension chains: masked labels where a figure would sit on an axis line
def ch(side, stops, off, base, ext=None, h=2.0):
    horiz = side in 'bt'; axes = XA if horiz else YA
    sign = -1 if side in 'bl' else 1
    labels, later = [], []
    for i in range(len(stops) - 1):
        lab = fm(stops[i + 1] - stops[i]); mid = (stops[i] + stops[i + 1]) / 2
        if on_axis(mid, axes): labels.append(''); later.append((mid, lab))
        else: labels.append(lab)
    v.chain(side, stops, off, base, fm, h, 'dot', labels=labels, ext_from=(off - 1.4) if ext is None else ext, term_lw=0.13)
    for mid, lab in later:
        w = d.width(lab, h)
        if horiz:
            px, py = v.X(mid), v.Y(base) + sign * off + 0.7
            d.rect(px - w / 2 - 0.5, py - 0.3, w + 1, h + 0.9, 0, fill=WHITE); d.text(px, py, lab, h, align='center')
        else:
            px, py = v.X(base) + sign * off - 0.7, v.Y(mid)
            d.rect(px - h - 0.5, py - w / 2 - 0.5, h + 0.9, w + 1, 0, fill=WHITE); d.text(px, py, lab, h, align='center', angle=90)
OT, OB, OL, OR = (8, 14, 20), (22, 28, 34), (14, 20), (20, 26)
ch('t', [0, 2.73, 5.46, 8.19, 10.92, 14.56], OT[0], D, ext=1.5)
ch('t', [0, 3.64, 7.28, 10.92, 14.56], OT[1], D)
ch('t', [0, 14.56], OT[2], D)
ch('b', [3.64, 5.46, 7.28], OB[0], 0, ext=19)
ch('b', [0, 3.64, 7.28, 14.56], OB[1], 0)
ch('b', [0, 14.56], OB[2], 0)
ch('l', [0, 1.82, 3.64, 5.46, 6.37, 8.19, 10.92], OL[0], 0)
ch('l', [0, 10.92], OL[1], 0)
ch('r', [0, 8.19, 10.92], OR[0], W)
ch('r', [0, 10.92], OR[1], W)

# -- room tags: name, then area truncated to two decimals; no numbers in the room
def tag(x, y, name, area=None, h=2.1, ah=2.0, mask=False, lead=1.55):
    lines = [(n, h, False) for n in (name if isinstance(name, list) else [name])]
    if area: lines.append((area, ah, False))
    if mask:
        wid = max(d.width(s, hh) for s, hh, _ in lines); tot = sum(l[1] * lead for l in lines)
        d.rect(v.X(x) - wid / 2 - 0.7, v.Y(y) - tot / 2 - 0.3, wid + 1.4, tot + 0.6, 0, fill=WHITE)
    v.tag(x, y, lines, lead=lead)
def ar(n): return t2(AREA[n]) + '㎡'
tag(10.92, 4.55, '集会室', ar('5'), 3.4, 2.4, mask=True, lead=1.45)
tag(1.82, 2.73, '和室(12畳)', ar('6'), 2.4, 2.0, mask=True)
tag(1.82, 5.915, '押入', ar('7'), 1.9, 1.8)
tag(5.46, 2.86, '玄関', ar('1'))
tag(4.55, 4.90, 'ホール', ar('2'))
tag(6.37, 4.84, '事務室', ar('3'))
tag(1.86, 7.12, '廊下', ar('4'))
tag(0.90, 9.62, '男子トイレ', ar('8'), 2.0)
tag(4.55, 8.72, '女子トイレ', ar('9'), 2.0)
tag(6.42, 10.33, ['バリアフリー', 'トイレ'], ar('10'), 1.9, 1.8, lead=1.42)
tag(9.555, 9.25, '湯沸室', ar('11'))
tag(12.74, 9.30, '倉庫', ar('12'))
tag(5.46, 0.56, '玄関ポーチ', '+400', 2.0, 1.9)
# small fixture and level words
d.text(v.X(3.64 + it + 0.20) + 0.75, v.Y(2.74), '下足入', 1.6, align='center', angle=90)
d.text(v.X(9.55), v.Y(10.46), '流し台', 1.6, align='center')
d.text(v.X(12.74), v.Y(10.55), '棚', 1.6, align='center')
d.text(v.X(6.37), v.Y(3.14), '受付窓', 1.6, align='center')
d.text(v.X(6.62), v.Y(2.20), '+400', 1.9, align='center')
d.text(v.X(4.95), v.Y(3.76), '見切り', 1.6, align='center')
assert abs((12.08 - 7.28) / 0.40 - 12) < 1e-9 and abs(-0.30 - -1.20 - 0.90) < 1e-9     # 勾配1/12, 有効巾900 as drawn
d.text(v.X(7.45), v.Y(-0.75) + 0.8, 'スロープ 勾配1/12 有効巾900', 1.7)
d.text(v.X(12.22), v.Y(-0.75) - 0.9, 'GL±0', 1.9)
d.line(v.X(5.46), v.Y(-1.76), v.X(5.46), v.Y(-1.28), 0.13)
d.poly([v.P(5.46, -1.24), (v.X(5.46) + 0.45, v.Y(-1.24) - 1.5), (v.X(5.46) - 0.45, v.Y(-1.24) - 1.5)], True, 0, fill=INK)
d.text(v.X(5.46) + 1.4, v.Y(-1.70), '上', 1.8)
# 建具符号
def dt(x, y, s, align='center'): d.text(v.X(x), v.Y(y), s, 1.7, align=align)
for x, y in ((1.82, -0.34), (9.10, 0.24), (11.83, 0.24), (13.195, 0.24)): dt(x, y, 'AW-1' if x != 13.195 else 'AW-2')
dt(-0.14, 2.64, 'AW-1', 'right'); dt(14.78, 2.64, 'AW-1', 'left'); dt(14.78, 7.20, 'AW-1', 'left'); dt(7.48, 0.84, 'AW-2', 'left')
for x in (1.365, 3.185, 6.825, 9.555): dt(x, 11.10, 'AW-2')
dt(5.46, 2.02, 'AD-1'); dt(14.32, 4.47, 'AD-1', 'right'); dt(0.22, 7.20, 'AD-2', 'left')
dt(6.37, 2.84, 'WW-1')
dt(7.46, 7.20, 'WD-1', 'left')
dt(2.27, 7.82, 'WD-2'); dt(3.19, 7.82, 'WD-2'); dt(5.34, 5.80, 'WD-2', 'right')
dt(5.97, 7.82, 'WD-3'); dt(9.555, 7.82, 'WD-3')
dt(3.80, 4.00, 'WD-4', 'left'); dt(12.74, 7.82, 'WD-4')
dt(0.92, 5.06, 'WD-5'); dt(2.73, 5.06, 'WD-5')

# ---- under the plan: caption, stamp, and the 面積図 that separates 床面積 from 建築面積
cap_y = 84.5
capw = d.width('平面図', 3.2, True) + d.width('1/100', 2.6) + 10
d.rect(v.X(0), cap_y, capw, 8, 0.25)
d.text(v.X(0) + 3, cap_y + 2.3, '平面図', 3.2, True)
d.text(v.X(0) + 7 + d.width('平面図', 3.2, True), cap_y + 2.6, '1/100', 2.6)
sy = 58                                    # two-line stamp: the wording stays one sentence, set big-small
line2 = '施工・確認申請には使用できません'
sw = d.width(line2, 2.3, True) + 6
d.rect(v.X(0), sy, sw, 14.5, 0.5)
d.text(v.X(0) + 3, sy + 7.6, '見本図', 4.3, True)
d.text(v.X(0) + 3 + d.width('見本図', 4.3, True) + 3, sy + 7.8, '架空の建物です', 2.3, True)
d.text(v.X(0) + 3, sy + 2.6, line2, 2.3, True)
d.text(v.X(0), sy - 4.0, '日本の建築士等による確認は受けていません。', 2.0)

mv = View(d, 112, 47, 400)
mv.hatch(FOOT, 45, 1.2, 0.09, GREY)
d.poly([mv.P(*p) for p in FOOT], True, 0.3)
d.rect(mv.X(3.64), mv.Y(0), 3.64 * mv.k, 1.82 * mv.k, 0.18, dash=(1.0, 0.7))
d.rect(mv.X(3.64) + 0.2, mv.Y(0) + 0.2, 3.64 * mv.k - 0.4, 1.82 * mv.k - 0.4, 0, fill=WHITE)
d.text(mv.X(5.46), mv.Y(0.91) - 0.75, 'ポーチ', 1.6, align='center')
d.text(mv.X(0), mv.Y(0) - 4.6, '面積図', 2.4, True)
d.text(mv.X(0) + d.width('面積図', 2.4, True) + 3, mv.Y(0) - 4.6, '1/400', 2.0)
tx = mv.X(W) + 5; ty = mv.Y(D)
d.rect(tx, ty - 3.1, 6, 3, 0.18, fill=None); d.hatch([(tx, ty - 3.1), (tx + 6, ty - 3.1), (tx + 6, ty - 0.1), (tx, ty - 0.1)], 45, 1.2, 0.09, GREY)
d.text(tx + 8, ty - 2.9, f'1階床面積(延べ面積) {FLOOR}㎡', 2.2, True)
d.text(tx + 8, ty - 7.0, f'{m3(W)} × {m3(D)} − {m3(3.64)} × {m3(1.82)} = {f4(FLOOR_MM2)}', 1.9)
d.text(tx + 8, ty - 10.4, '壁芯で囲む。玄関ポーチは含めない。', 1.9)
d.rect(tx, ty - 17.1, 6, 3, 0.18, dash=(1.0, 0.7))
d.text(tx + 8, ty - 16.9, f'建築面積 {BLDG}㎡', 2.2, True)
d.text(tx + 8, ty - 21.0, f'{m3(W)} × {m3(D)} = {f4(BLDG_MM2)}', 1.9)
d.text(tx + 8, ty - 24.4, '間口×奥行の数値で、床面積ではない。玄関ポーチを含む。', 1.9)

# ---- right column
CX, CW = 236, 174
d.line(CX, 32, CX, 287, 0.35)
LX = CX + 4
y = 283
d.north(CX + CW - 13, 266, 11, 'circle', 'N', 0, 2.6)
y -= 8
ROW = 8.2
colA, colB, labA, labB = LX, LX + 76, LX + 18, LX + 94
def lv(px, py): return View(d, px, py, 100)
def sample_wall(px, py, kind, wid=0.5):
    """Same symbols as the plan: a wall stub with the opening in it."""
    b = Building(); b.wall(0, -it, 1.4, it)
    w0, w1 = -it, it
    a0 = (1.4 - wid) / 2 if kind != 'slide' else 0.2
    if kind == 'single': b.door('h', a0, wid, (w0, w1), 'a', 1)
    elif kind == 'double': b.door('h', a0, wid, (w0, w1), 'both', 1)
    elif kind == 'slide': b.door('h', a0, wid, (w0, w1), kind='slide')
    elif kind == 'bislide': b.door('h', a0, wid, (w0, w1), kind='bislide')
    elif kind == 'win': b.gap('h', a0, wid, (w0, w1))
    q = lv(px, py); q.draw(b, None, lw=WALL_LW, door_lw=0.2, arc_lw=0.09)
    if kind == 'win': draw_win(q, 'h', a0, wid, (w0, w1))
    if kind == 'slide': q.linem(a0 + wid, it + 0.04, a0 + 2 * wid, it + 0.04, 0.13, INK, dash=(1.2, 0.8))
def lab(x, yy, s): d.text(x, yy - 0.75, s, 2.0)
def head(yy, s, x1=None):
    """Column heading with a hairline running on to the right edge."""
    d.text(LX, yy - 3.2, s, 3.0, True)
    d.line(LX + d.width(s, 3.0, True) + 3, yy - 2.1, (CX + CW - 4) if x1 is None else x1, yy - 2.1, 0.09, GREY)
head(y + 8, '凡例', CX + CW - 26)
# row 1
ry = y - 2
d.line(colA, ry, colA + 14, ry, 0.09, dash=(6, 1.2, 1, 1.2)); lab(labA, ry, '通り芯=壁芯(面積はこの線で測る)')
q = lv(colB, ry); b_ = Building(); b_.wall(0, -ex, 1.4, ex); q.draw(b_, None, lw=WALL_LW); lab(labB, ry, '木造壁 外壁180・内壁145')
# row 2
ry -= ROW - 2
q = lv(colA + 7, ry); q.column(0, 0, 0.12, cross=True, lw=0.18); lab(labA, ry, '管柱 120×120')
sample_wall(colB, ry, 'win', 0.7); lab(labB, ry, '引違い窓')
# row 3
ry -= ROW
sample_wall(colA, ry, 'single', 0.5); lab(labA, ry + 1.2, '片開き扉')
sample_wall(colB, ry, 'double', 0.8); lab(labB, ry + 1.2, '両開き扉')
# row 4
ry -= ROW - 2.2
sample_wall(colA, ry, 'slide', 0.5); lab(labA, ry, '片引き戸(破線は引き込み位置)')
sample_wall(colB, ry, 'bislide', 0.7); lab(labB, ry, '引違い戸')
# row 5
ry -= ROW - 2
d.rect(colA + 2.5, ry - 1.5, 9, 3.0, 0.09, GREY); d.line(colA + 7, ry - 1.5, colA + 7, ry + 1.5, 0.09, GREY); lab(labA, ry, '畳割り(祝儀敷き)')
d.circle(colB + 7, ry, 2.0, 0.13, dash=(1.0, 0.8)); lab(labB, ry, '車椅子回転スペース φ1,500')
y = ry - 5
# 建具符号
d.line(LX, y + 1.0, CX + CW - 4, y + 1.0, 0.09, GREY)
KEY = ((('AW-1', 'アルミ引違い窓(幅広)'), ('AW-2', 'アルミ引違い窓(幅狭)'), ('WW-1', '木製引違い窓(受付窓)')),
       (('AD-1', 'アルミ両開き扉'), ('AD-2', 'アルミ片開き扉')),
       (('WD-1', '木製両開き扉'), ('WD-2', '木製片開き扉'), ('WD-3', '木製片引き戸')),
       (('WD-4', '木製引違い戸'), ('WD-5', '襖(押入)')))
for kx, col_ in zip((LX, LX + 50, LX + 90, LX + 130), KEY):
    for j, (k, s) in enumerate(col_):
        ky = y - 3.0 - j * 4.4
        d.text(kx, ky, k, 1.9, True); d.text(kx + 10, ky, s, 1.9)
y -= 18.4

# 注記
head(y, '注記')
y -= 8
NOTES = ('建築主は見本町三丁目自治会(架空)。木造平屋建。柱は910モジュールを基本に配置する。',
         '寸法の単位はmmとし、数値に単位は記入しない。',
         '通り芯は壁芯に一致する。室面積と床面積は壁芯で算出し、内法では測らない。',
         '1FL=設計GL+400。玄関とホールは同じ床高とし、床仕上げの切替え位置で靴を脱ぐ。',
         '玄関ポーチは建築面積に含め、床面積には含めない。軒の出は1m未満のため算入しない。',
         '集会室の扉と外部への扉は外開きとする。',
         '面積は練習用の計算であり、確認申請の数値ではない。')
for i, s in enumerate(NOTES):
    d.text(LX, y - 2.1, f'{i + 1}.', 2.1)
    d.text(LX + 4.4, y - 2.1, s, 2.1)
    y -= 4.4
y -= 3.6

# 面積表
head(y, '面積表(床面積求積表)')
y -= 7.2
TW = [10, 34, 33, 21, 68]
rows = [['記号', '室名', '計算式(m)', '面積(㎡)', '床仕上']]
for r in ROOMS:
    rows.append([r[0], r[1], f'{m3(r[4])} × {m3(r[5])}', f4(AREA[r[0]]), FIN[r[6]]])
y = d.table(LX, y, TW, rows, 2.0, 4.8, aligns=['center', 'left', 'left', 'right', 'left'])
y0, RH = y, 5.1
TOTALS = (('1階床面積(=延べ面積)', f'合計 {f4(FLOOR_MM2)}', f'{FLOOR}㎡', '壁芯。玄関ポーチを含まない。小数第3位以下切捨て'),
          ('建築面積(玄関ポーチを含む)', f'{m3(W)} × {m3(D)}', f'{BLDG}㎡', f'{f4(BLDG_MM2)} を切捨て。床面積ではない'))
y = d.table(LX, y, [TW[0] + TW[1], TW[2], TW[3], TW[4]], [['', t[1], '', t[3]] for t in TOTALS], 2.0, RH, head=0, aligns=['left', 'left', 'right', 'left'])
for i, t in enumerate(TOTALS):      # only the name and the answer go bold
    by = y0 - i * RH - (RH - 2.0) / 2 - 2.0
    d.text(LX + 1.1, by, t[0], 2.0, True)
    d.text(LX + sum(TW[:4]) - 1.1, by, t[2], 2.1, True, align='right')
d.text(LX, y - 3.2, '平面図の室面積は各室を小数第3位以下切捨てで表示。合計は小数第4位までの値を足してから切り捨てる。', 1.9)
y -= 6

# 計測の練習: anchored to the foot of the column
PANEL_H = 52.2
panel_y = 35
assert y > panel_y + PANEL_H + 4, y
y = panel_y + PANEL_H
d.rect(LX, panel_y, CW - 8, PANEL_H, 0.35)
px = LX + 3
d.text(px, y - 5.4, '計測の練習', 3.0, True)
d.text(px + d.width('計測の練習', 3.0, True) + 4, y - 5.3, '面積は壁芯(一点鎖線)をたどって測る。外壁の外面では測らない。', 2.0)
y -= 9.8
STEPS = (('縮尺合わせ', '図の下の全長 14,560(X1〜X5)の寸法線の両端を指定し、実寸を入力する。', f'{W:.2f}m'),
         ('確認', '図の右の全長 10,920(Y1〜Y7)を測る。縦方向の縮尺も確かめる。', f'{D:.2f}m'),
         ('1階床面積', 'X1・Y1 の交点から一点鎖線の交点8点を順に指定し、玄関ポーチの切り欠きを回り込む。', f'{FLOOR}㎡'),
         ('集会室', 'X3・X5・Y1・Y6 の交点4点で囲む。', f'{HALLT}㎡'))
for i, (k, s, ans) in enumerate(STEPS):
    d.text(px, y - 2.1, f'{i + 1}', 2.1, True)
    d.text(px + 3.6, y - 2.1, k, 2.1, True)
    d.text(px + 21.5, y - 2.1, s, 2.0)
    d.text(LX + CW - 8 - 3, y - 2.1, ans, 2.3, True, align='right')
    y -= 5.1
y -= 0.6
d.line(px, y, LX + CW - 8 - 3, y, 0.09, GREY)
y -= 1.6
d.text(px, y - 2, '交点は柱の×印の中心です。Snap to Content をオンにし、400% 程度に拡大して指定します。', 2.0)
y -= 4.3
d.text(px, y - 2, '低倍率では壁面の点を拾い、面積がずれます。', 2.0)
y -= 4.3
d.text(px, y - 2, f'間口×奥行の {BLDG}㎡ は建築面積で、床面積ではない。玄関ポーチを回り込まずに囲むとこの値になる。', 1.9)
y -= 4.3
d.text(px, y - 2, f'集会室の仕上げ数量を内法で拾うと、{HALLT}㎡ より小さくなる。', 1.9)

# ---- title strip across the foot of the frame
TY, TH = 10, 22
d.line(10, TY + TH, 410, TY + TH, 0.35)
xx = 10
wr = 46
d.rect(xx, TY, wr, TH, 0.18)
d.text(xx + 1.2, TY + TH - 2.6, '訂正履歴', 1.6, col=GREY)
for i in range(1, 4):
    ly = TY + TH - 4 - (i - 1) * 6
    d.line(xx, ly, xx + wr, ly, 0.09)
    d.text(xx + 1.4, ly - 4.2, '△', 1.7, col=GREY)
d.line(xx + 7, TY, xx + 7, TY + TH - 4, 0.09)
xx += wr
d.field(xx, TY, 52, TH, '設計者', '', 1.6)
d.text(xx + 4, TY + 7.6, '見本設計室(架空)', 2.6)
xx += 52
for lab_ in ('承認', '設計', '担当'):
    d.field(xx, TY, 20, TH, lab_, '', 1.6)
    d.line(xx, TY + TH - 3.8, xx + 20, TY + TH - 3.8, 0.09)
    xx += 20
h2 = TH / 2
d.field(xx, TY + h2, 34, h2, '縮尺', 'A3:1/100', 1.6, 2.5)
d.field(xx, TY, 34, h2, '設計年月日', '2026.11', 1.6, 2.5)
xx += 34
d.field(xx, TY + h2, 150, h2, '工事名称', '見本町三丁目集会所新築工事', 1.6, 3.0, True)
d.field(xx, TY, 150, h2, '図面名称', '平面図・面積表', 1.6, 3.0)
xx += 150
d.field(xx, TY, 58, TH, '図面番号', '', 1.6)
d.text(xx + 29, TY + 5.2, 'A-05', 8.5, True, align='center')
assert abs(xx + 58 - 410) < 1e-9
d.text(410, 5.6, 'PolyPDF 練習用見本図', 1.8, col=GREY, align='right', track=False)

# ---- measuring facts
d.expect('calibrate', p0=(v.X(0), v.Y(0) - OB[2]), p1=(v.X(W), v.Y(0) - OB[2]), metres=W, note='outermost bottom chain, X1 to X5, 14,560')
d.expect('check', p0=(v.X(W) + OR[1], v.Y(0)), p1=(v.X(W) + OR[1], v.Y(D)), metres=D, note='outermost right chain, Y1 to Y7, 10,920')
d.expect('gross', pts=[v.P(*p) for p in FOOT], sqm=FLOOR_MM2 / 1e6, perimeter=poly_perimeter(FOOT), note='1階床面積: axis crossings round the porch notch, wall centres')
d.expect('floor', pts=[v.P(*p) for p in HALL], sqm=HALL_MM2 / 1e6, perimeter=poly_perimeter(HALL), note='集会室: X3, X5, Y1, Y6 crossings, wall centres')
d.save()
