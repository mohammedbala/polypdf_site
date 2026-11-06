#!/usr/bin/env python3
# India, Hindi belt: gram panchayat bhawan, A3 landscape, 1:100. Bilingual sheet: Hindi first, English capitals beneath.
# One storey, notched plan: a verandah with a low parapet projects 600 between two office wings, a meeting hall behind
# it, toilets off a side passage closed by a collapsible gate. RCC frame with 230 and 115 brick walls, drawn as plain
# double line with solid black columns. Grid A to F and 1 to 5, bubbles on the top and left only. Every trace corner is
# a grid crossing, so the exercise can name corners by grid reference.
#
# Snap safety. In the app, a line end close to a corner takes the snap from the corner. The app indexes stroked segments
# of 12 pt or more and ignores small fill-only shapes. So on this sheet no indexed line end comes within 5 mm of a trace
# corner, calibration end or check end, except lines ending exactly on that point: the Guard below enforces it for all
# linework, and the columns are fill-only.
import math, sys
from pathlib import Path
from draftkit import *

OUT = Path(sys.argv[1] if len(sys.argv) > 1 else 'out'); OUT.mkdir(exist_ok=True)
F_ = '../fonts/'
register_font('DV', F_ + 'NotoSansDevanagari-Regular.ttf', shaped=True)
register_font('DV-B', F_ + 'NotoSansDevanagari-Bold.ttf', shaped=True)

mm_ = fmt_mm('')
SQFT = 10.7639
FX = '#4a5157'                  # sanitary fittings
KOTA_TINT = '#d3e2db'           # Kota stone is a grey-green limestone
def sqft(a): return round(a * SQFT + 1e-9, 2)
def ft_in(m):
    t = round(m / 0.3048 * 12)
    return f"{t // 12}'-{t % 12}\""
assert ft_in(15.6) == "51'-2\"" and ft_in(9.3) == "30'-6\""

# ---- grid (metres; origin at the verandah's front edge line and grid A)
AX = {'A': 0.0, 'B': 3.9, 'C': 10.2, 'D': 11.7, 'E': 13.9, 'F': 15.6}
AY = {'1': 9.3, '2': 6.3, '3': 3.3, '4': 0.6, '5': 0.0}
def G(ref): return (AX[ref[0]], AY[ref[1]])
W, DP = AX['F'], AY['1']
GROSS_REFS = ['B5', 'D5', 'D4', 'F4', 'F3', 'E3', 'E1', 'A1', 'A4', 'B4']
KOTA_REFS = ['B5', 'D5', 'D1', 'C1', 'C3', 'B3']
FOOT = [G(r) for r in GROSS_REFS]
KOTA_L = [G(r) for r in KOTA_REFS]

# no, Hindi, English lines, x, y, w, d, finish
ROOMS = [
    ('101', 'बरामदा', ['VERANDAH'], 3.9, 0.0, 7.8, 3.3, 'KOTA'),
    ('102', 'जन सेवा केंद्र', ['CSC / PUBLIC', 'COUNTER'], 0.0, 0.6, 3.9, 2.7, 'VIT'),
    ('103', 'सचिव कक्ष', ['SECRETARY OFFICE'], 0.0, 3.3, 3.9, 3.0, 'VIT'),
    ('104', 'अभिलेख कक्ष', ['RECORD ROOM'], 0.0, 6.3, 2.1, 3.0, 'CC'),
    ('105', 'भंडार कक्ष', ['STORE'], 2.1, 6.3, 1.8, 3.0, 'CC'),
    ('106', 'सभा कक्ष', ['MEETING HALL'], 3.9, 3.3, 6.3, 6.0, 'VIT'),
    ('107', 'गलियारा', ['PASSAGE'], 10.2, 3.3, 1.5, 6.0, 'KOTA'),
    ('108', 'महिला शौचालय', ['LADIES'], 11.7, 7.3, 2.2, 2.0, 'AS'),
    ('109', 'पुरुष शौचालय', ['GENTS'], 11.7, 5.3, 2.2, 2.0, 'AS'),
    ('110', 'दिव्यांग शौचालय', ['ACCESSIBLE TOILET'], 11.7, 3.3, 2.2, 2.0, 'AS'),
    ('111', 'प्रधान कक्ष', ['PRADHAN ROOM'], 11.7, 0.6, 3.9, 2.7, 'VIT'),
]
ROOM = {r[0]: r for r in ROOMS}
def area(r): return round(r[5] * r[6] + 1e-9, 2)
FINISH = {'KOTA': ('कोटा स्टोन फ़्लोरिंग', 'KOTA STONE FLOORING'), 'VIT': ('विट्रिफ़ाइड टाइल फ़्लोरिंग', 'VITRIFIED TILE FLOORING'),
          'CC': ('सीमेंट कंक्रीट फ़र्श (IPS)', 'CEMENT CONCRETE FLOORING (IPS)'), 'AS': ('एंटी-स्किड सिरेमिक टाइल', 'ANTI-SKID CERAMIC TILE')}

# ---- totals, derived from the data; a wrong room or total fails the build
PLINTH = round(check_tiling([(r[3], r[4], r[5], r[6]) for r in ROOMS], FOOT), 2)
KOTA = round(poly_area(KOTA_L), 2)
BYKEY = {k: round(sum(area(r) for r in ROOMS if r[7] == k), 2) for k in FINISH}
assert PLINTH == 130.20, PLINTH
assert KOTA == 34.74 and KOTA == BYKEY['KOTA'], (KOTA, BYKEY)
assert abs(sum(BYKEY.values()) - PLINTH) < 1e-6 and abs(sum(area(r) for r in ROOMS) - PLINTH) < 1e-6
assert sqft(PLINTH) == 1401.46 and sqft(KOTA) == 373.94
assert round(sum(sqft(area(r)) for r in ROOMS), 2) == sqft(PLINTH)
assert round(sqft(area(ROOM['101'])) + sqft(area(ROOM['107'])), 2) == sqft(KOTA)

# ---- walls: outer face on the outline and drawn inside it; 115 centred between rooms; 230 centred against the verandah
EXT = [(0, 0.6, 3.9, 0.83), (0, 0.6, 0.23, 9.3), (0, 9.07, 13.9, 9.3), (13.67, 3.07, 13.9, 9.3),
       (13.67, 3.07, 15.6, 3.3), (15.37, 0.6, 15.6, 3.3), (11.7, 0.6, 15.6, 0.83)]
VER = [(3.785, 0.6, 4.015, 3.415), (3.785, 3.185, 10.315, 3.415), (11.585, 0.6, 11.815, 3.415)]
INT = [(0.23, 3.2425, 3.785, 3.3575), (0.23, 6.2425, 3.9, 6.3575), (2.0425, 6.3575, 2.1575, 9.07), (3.8425, 3.415, 3.9575, 9.07),
       (10.1425, 3.415, 10.2575, 9.07), (11.6425, 3.415, 11.7575, 9.07), (11.815, 3.2425, 13.67, 3.3575),
       (11.7575, 5.2425, 13.67, 5.3575), (11.7575, 7.2425, 13.67, 7.3575)]
WALLS = EXT + VER + INT
def clear_area(n):
    r = ROOM[n]; g = Region(); g.add(r[3], r[4], r[3] + r[5], r[4] + r[6])
    for w_ in WALLS: g.sub(*w_)
    return sum((c - a) * (e - b) for a, b, c, e in g.rects())
CARPET_ROOMS = ('102', '103', '104', '106', '111')
CARPET = round(sum(clear_area(n) for n in CARPET_ROOMS), 2)
assert CARPET == 67.17, CARPET
assert CARPET < PLINTH

# columns 230 x 230: lower-left corner. Centred on interior crossings, inside the outline on outer lines.
COL = 0.23
COLS = {'A1': (0, 9.07), 'A2': (0, 6.185), 'A3': (0, 3.185), 'A4': (0, 0.6),
        'B1': (3.785, 9.07), 'B2': (3.785, 6.185), 'B3': (3.785, 3.185), 'B4': (3.785, 0.6), 'B5': (3.9, 0),
        'C1': (10.085, 9.07), 'C2': (10.085, 6.185), 'C3': (10.085, 3.185), 'C5': (10.085, 0),
        'D1': (11.585, 9.07), 'D2': (11.585, 6.185), 'D3': (11.585, 3.185), 'D4': (11.585, 0.6), 'D5': (11.47, 0),
        'E1': (13.67, 9.07), 'E2': (13.67, 6.185), 'E3': (13.67, 3.07), 'F3': (15.37, 3.07), 'F4': (15.37, 0.6)}
VER_COLS = [(5.885, 0), (7.985, 0)]             # the verandah front between the grid lines, framing the steps
for ref in GROSS_REFS + KOTA_REFS: assert ref in COLS, ref
def col_rect(c): return (c[0], c[1], c[0] + COL, c[1] + COL)
ALL_COLS = [col_rect(c) for c in COLS.values()] + [col_rect(c) for c in VER_COLS]

# low parapet between the verandah columns; on the outline, 115 thick
PARAPET = [(4.13, 0, 5.885, 0.115), (8.215, 0, 10.085, 0.115), (3.9, 0.23, 4.015, 0.6), (11.585, 0.23, 11.7, 0.6)]

# ---- openings
B = Building()
for w_ in EXT: B.wall(*w_, 'ext')
for w_ in VER: B.wall(*w_, 'ext')
for w_ in INT: B.wall(*w_, 'int')
OW = {'D': 1.8, 'D1': 1.0, 'D2': 0.75, 'D3': 1.0, 'CG': 1.27, 'W': 1.5, 'W1': 0.9, 'PW': 0.9, 'V': 0.6}
COUNT = dict.fromkeys(OW, 0)
def DR(m, axis, at, wall, hinge, swing, kind='swing'):
    B.door(axis, at, OW[m], wall, hinge, swing, kind); COUNT[m] += 1
def WN(m, axis, at, wall):
    B.window(axis, at, OW[m], wall); COUNT[m] += 1
XB230, XD230, YC230 = (3.785, 4.015), (11.585, 11.815), (3.185, 3.415)
XB115, XC115, XD115 = (3.8425, 3.9575), (10.1425, 10.2575), (11.6425, 11.7575)
S0, N0, W0, E0, ET = (0.6, 0.83), (9.07, 9.3), (0, 0.23), (15.37, 15.6), (13.67, 13.9)
DR('D', 'h', 4.5, YC230, 'both', -1); DR('D', 'h', 7.8, YC230, 'both', -1)     # hall to verandah, open outward
DR('D1', 'v', 1.1, XB230, 'a', -1)                                             # verandah to 102
DR('D1', 'h', 1.5, (3.2425, 3.3575), 'a', 1)                                   # 102 to 103
DR('D1', 'v', 4.3, XB115, 'b', -1)                                             # hall to 103
DR('D1', 'h', 0.55, (6.2425, 6.3575), 'a', 1)                                  # 103 to 104
DR('D1', 'v', 6.5, XB115, 'a', -1)                                             # hall to store
DR('D1', 'v', 6.7, XC115, 'a', -1)                                             # passage to hall
DR('D1', 'v', 1.1, XD230, 'a', 1)                                              # verandah to 111
DR('D3', 'v', 3.8, XD115, 'a', -1)                                             # accessible toilet, opens outward
DR('D2', 'v', 5.4, XD115, 'a', 1)                                              # gents
DR('D2', 'v', 8.2, XD115, 'b', 1)                                              # ladies
DR('CG', 'h', 10.315, YC230, 'a', 1, 'grille')                                 # collapsible gate on the passage
WN('PW', 'v', 2.25, XB230)
WN('W', 'v', 1.2, W0); WN('W', 'v', 4.05, W0); WN('W', 'h', 1.2, S0); WN('W', 'h', 12.9, S0)
WN('W', 'h', 4.65, N0); WN('W', 'h', 7.95, N0); WN('W', 'v', 1.2, E0)
WN('W1', 'v', 7.35, W0); WN('W1', 'h', 0.6, N0); WN('W1', 'h', 10.5, N0)          # the last lights the passage: floor is +0.450, no door without steps
WN('V', 'v', 4.0, ET); WN('V', 'v', 5.45, ET); WN('V', 'v', 8.0, ET); WN('V', 'h', 2.7, N0)

def _open_rect(o):
    a, b = o['at'], o['at'] + o['w']; w0, w1 = o['wall']
    return (a, w0, b, w1) if o['axis'] == 'h' else (w0, a, w1, b)
def _overlap(p, q): return min(p[2], q[2]) - max(p[0], q[0]) > 1e-6 and min(p[3], q[3]) - max(p[1], q[1]) > 1e-6
for o in B.openings:
    for c in ALL_COLS: assert not _overlap(_open_rect(o), c), (o, c)
def _swing(o):
    a, b = o['at'], o['at'] + o['w']; w0, w1 = o['wall']; s = o['swing']
    face = w1 if s > 0 else w0
    r = o['w'] / 2 if o['hinge'] == 'both' else o['w']
    lo, hi = sorted((face, face + s * r))
    return (a, lo, b, hi) if o['axis'] == 'h' else (lo, a, hi, b)
_doors = [o for o in B.openings if o['t'] == 'door' and o['kind'] == 'swing']
for i, o in enumerate(_doors):
    for q in _doors[i + 1:]: assert not _overlap(_swing(o), _swing(q)), (o, q)

# every room reachable from outside, through doors and the open verandah front
def _room_at(x, y):
    for r in ROOMS:
        if r[3] < x < r[3] + r[5] and r[4] < y < r[4] + r[6]: return r[0]
    return 'OUT'
_links = {('OUT', '101')}
for o in B.openings:
    if o['t'] != 'door': continue
    mid = o['at'] + o['w'] / 2; c = sum(o['wall']) / 2
    a, b = ((mid, c - 0.3), (mid, c + 0.3)) if o['axis'] == 'h' else ((c - 0.3, mid), (c + 0.3, mid))
    _links.add((_room_at(*a), _room_at(*b)))
_seen, _todo = {'OUT'}, ['OUT']
while _todo:
    cur = _todo.pop()
    for p, q in _links:
        for u, v_ in ((p, q), (q, p)):
            if u == cur and v_ not in _seen: _seen.add(v_); _todo.append(v_)
assert set(ROOM) <= _seen, set(ROOM) - _seen

# fittings and furniture must stay out of every door swing
BLOCKS = []
def blocked(x0, y0, x1, y1):
    BLOCKS.append((min(x0, x1), min(y0, y1), max(x0, x1), max(y0, y1)))

# ---- sheet
d = Doc(OUT / 'hi.pdf', (420, 297), 'अभ्यास शीट: ग्राम पंचायत भवन, ग्राउंड फ़्लोर प्लान, स्केल 1:100 (A3)',
        subject='PolyPDF के लिए काल्पनिक अभ्यास शीट। निर्माण के लिए नहीं।', keywords='अभ्यास शीट, ग्राउंड फ़्लोर प्लान, प्लिंथ एरिया, कार्पेट एरिया')
d.use_script('devanagari', 'DV', 'DV-B')
X0, Y0 = 58, 158
v = View(d, X0, Y0, 100)
OFF_T = (12, 20)
OFF_L = (12, 20)
BAR_X, BAR_Y = 121, 19
CHECK_Y = v.Y(DP) + OFF_T[1]
CAL = [(BAR_X, BAR_Y), (BAR_X + 100, BAR_Y)]
CHECK = [(v.X(0), CHECK_Y), (v.X(W), CHECK_Y)]
PROTECT = list(dict.fromkeys([v.P(*G(r)) for r in GROSS_REFS + KOTA_REFS] + CAL + CHECK))

# ---- the guard: every stroke on the sheet goes through it
CLEAR, CHUNK, EPS = 5.0, 4.0, 1e-6
_line, _poly, _arc = d.line, d.poly, d.arc
def _near(p): return min(math.dist(p, q) for q in PROTECT)
def _exact(p): return any(math.dist(p, q) < EPS for q in PROTECT)
def _soft(a, b, draw):
    """Draw a to b in pieces too short for the app to index."""
    L = math.dist(a, b); n = max(1, math.ceil(L / CHUNK))
    for i in range(n):
        draw((a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n), (a[0] + (b[0] - a[0]) * (i + 1) / n, a[1] + (b[1] - a[1]) * (i + 1) / n))
def _guard_line(x0, y0, x1, y1, lw=0.25, col=INK, dash=None, cap=0):
    a, b = (x0, y0), (x1, y1); L = math.dist(a, b)
    if L < 1e-9: return
    draw = lambda p, q: _line(p[0], p[1], q[0], q[1], lw, col, dash, cap)
    ux, uy = (x1 - x0) / L, (y1 - y0) / L
    at = lambda t: (x0 + ux * t, y0 + uy * t)
    cuts = {0.0, L}
    for q in PROTECT:
        t = (q[0] - x0) * ux + (q[1] - y0) * uy
        if -EPS <= t <= L + EPS and math.dist(at(t), q) < EPS: cuts.add(max(0.0, min(L, t)))
    cuts = sorted(cuts)
    for s, e in zip(cuts, cuts[1:]):
        if e - s < EPS: continue
        if e - s <= CHUNK:
            draw(at(s), at(e)); continue
        lo, hi = s, e
        if not _exact(at(s)) and _near(at(s)) < CLEAR:
            t = s
            while t < e and _near(at(t)) < CLEAR + 0.02: t += 0.02
            t = min(t, e)
            assert not dash, ('dashed line ends inside a clear zone', at(s))
            _soft(at(s), at(t), draw); lo = t
        if lo < e and not _exact(at(e)) and _near(at(e)) < CLEAR:
            t = e
            while t > lo and _near(at(t)) < CLEAR + 0.02: t -= 0.02
            t = max(t, lo)
            assert not dash, ('dashed line ends inside a clear zone', at(e))
            _soft(at(t), at(e), draw); hi = t
        if hi - lo > EPS: draw(at(lo), at(hi))
def _guard_poly(pts, close=True, lw=0.25, col=INK, fill=None, dash=None, join=0):
    if fill is not None:
        xs, ys = sorted({round(p[0], 6) for p in pts}), sorted({round(p[1], 6) for p in pts})
        is_box = len(pts) == 4 and len(xs) == 2 and len(ys) == 2
        w_, h_ = (xs[-1] - xs[0]), (ys[-1] - ys[0])
        # the app also indexes thin filled bars (under 10 pt across, 24 pt or more long); tile them so they are not
        if is_box and min(w_, h_) <= 3.5 and max(w_, h_) >= 8.4:
            n = math.ceil(max(w_, h_) / 8.0)
            for i in range(n):
                if w_ >= h_:
                    a, b = xs[0] + w_ * i / n, xs[0] + w_ * (i + 1) / n + (0.03 if i < n - 1 else 0)
                    _poly([(a, ys[0]), (b, ys[0]), (b, ys[1]), (a, ys[1])], True, 0, col, fill, None, join)
                else:
                    a, b = ys[0] + h_ * i / n, ys[0] + h_ * (i + 1) / n + (0.03 if i < n - 1 else 0)
                    _poly([(xs[0], a), (xs[1], a), (xs[1], b), (xs[0], b)], True, 0, col, fill, None, join)
        else:
            _poly(pts, close, 0, col, fill, None, join)
    if lw:
        last = len(pts) if close else len(pts) - 1
        for i in range(last):
            p, q = pts[i], pts[(i + 1) % len(pts)]
            _guard_line(p[0], p[1], q[0], q[1], lw, col, dash, 2 if not dash else 0)
def _guard_arc(cx, cy, r, start, extent, lw=0.13, col=INK, dash=None):
    a0, a1 = math.radians(start), math.radians(start + extent)
    ends = [(cx + r * math.cos(a0), cy + r * math.sin(a0)), (cx + r * math.cos(a1), cy + r * math.sin(a1))]
    if min(_near(p) for p in ends) >= CLEAR:
        _arc(cx, cy, r, start, extent, lw, col, dash); return
    step = 2 * math.degrees(math.asin(min(1, CHUNK / (2 * r))))
    n = max(1, math.ceil(abs(extent) / step))
    for i in range(n): _arc(cx, cy, r, start + extent * i / n, extent / n, lw, col, dash)
d.line, d.poly, d.arc = _guard_line, _guard_poly, _guard_arc

# ---- text helpers. Devanagari sits higher and lower than Latin capitals at the same nominal height.
def is_hi(s): return any('ऀ' <= c <= 'ॿ' for c in s)
def stack(cx, cy, lines, gap=0.3, col=INK, align='center'):
    """lines: (text, h, bold), centred on sheet point (cx, cy), with room for matras above and below,
    and for brackets, which stand taller and drop lower than capitals."""
    m = [(1.36 * h, 0.40 * h) if is_hi(s) else (1.06 * h, 0.18 * h) if '(' in s else (1.02 * h, 0.03 * h) for s, h, b in lines]
    y = cy + (sum(a + e for a, e in m) + gap * (len(lines) - 1)) / 2
    for (s, h, b), (a, e) in zip(lines, m):
        y -= a
        d.text(cx, y, s, h, b, col, align)
        y -= e + gap
def rtag(n, x, y, hn=2.2, he=1.7, hs=1.5, hnum=1.5, gap=0.28):
    r = ROOM[n]
    lines = [(n, hnum, False), (r[1], hn, True)] + [(e, he, False) for e in r[2]] + [(f'({r[5]:.2f}m X {r[6]:.2f}m)', hs, False)]
    stack(v.X(x), v.Y(y), lines, gap)
def htext(x, y, hi, en, hh=3.0, he=2.2, bold=True):
    """Heading on one line: Hindi, then English in smaller capitals."""
    w = d.text(x, y, hi, hh, bold)
    d.text(x + w + 2.4, y, en, he, False, GREY)
def btable(x, y_top, widths, head, rows, h=1.9, row_h=4.7, aligns=None, bold_rows=(), head_h=8.4, lw=0.13, hh=1.65, he=1.3):
    """Bilingual header: Hindi over English in every cell. Body drawn by the kit."""
    aligns = list(aligns or ['left'] * len(widths))
    for w_, (hi, en) in zip(widths, head):        # the kit only checks text against text: a cell must hold its own text
        assert d.width(hi, hh, True) <= w_ - 1.0 and d.width(en, he) <= w_ - 1.0, (hi, en, w_)
    for r_ in rows:
        for w_, c_ in zip(widths, r_):
            assert d.width(c_, h, r_ in [rows[i] for i in bold_rows]) <= w_ - 1.0, (c_, w_)
    tw = sum(widths); cx = x
    d.line(x, y_top, x + tw, y_top, lw * 2)
    for w_, (hi, en), al in zip(widths, head, aligns):
        tx = cx + (1.1 if al == 'left' else w_ - 1.1 if al == 'right' else w_ / 2)
        d.text(tx, y_top - head_h * 0.46, hi, hh, True, align=al)
        d.text(tx, y_top - head_h + 1.0, en, he, False, align=al)
        d.line(cx, y_top, cx, y_top - head_h, lw)
        cx += w_
    d.line(cx, y_top, cx, y_top - head_h, lw)
    return d.table(x, y_top - head_h, widths, rows, h, row_h, head=0, aligns=aligns, bold_rows=bold_rows, lw=lw)

d.frame(20, 10, 410, 287)
BAND = 116
RX = 236
d.line(RX, 10, RX, 287, 0.35)
d.line(20, BAND, RX, BAND, 0.35)

# ---- Kota stone tint, under everything, reaching the grid lines
v.fill_poly(KOTA_L, KOTA_TINT)

# ---- grid: line segments end exactly on every crossing, so each crossing is one point the snap can find
DASH = (6, 1.2, 1, 1.2)
BUB_R, BUB_H = 2.8, 2.2
def axis_run(pts):
    for p, q in zip(pts, pts[1:]): d.line(p[0], p[1], q[0], q[1], 0.09, INK, DASH)
ROW_END = {'1': 14.45, '2': 14.45, '3': 16.15, '4': 16.15, '5': 12.3}          # free ends at least 5 mm past the last crossing
LOW_END = {'A': -0.4, 'B': -1.0, 'C': -1.0, 'D': -1.0, 'E': 3.3, 'F': -0.05}     # E stops at E3: no column in room 111
TOP_Y = v.Y(DP) + 26
LEFT_X = v.X(0) - 26
for a, x in AX.items():
    ys = sorted({LOW_END[a]} | {y for r, y in AY.items() if y > LOW_END[a]})
    axis_run([v.P(x, y) for y in ys] + [(v.X(x), TOP_Y)])
for r, y in AY.items():
    xs = sorted(x for a, x in AX.items() if x <= ROW_END[r]) + [ROW_END[r]]
    if r == '4':                      # row 4 has no structure across the verandah, and the line would run through its labels
        axis_run([(LEFT_X, v.Y(y)), v.P(AX['A'], y), v.P(AX['B'], y)])
        axis_run([v.P(AX['D'], y), v.P(AX['E'], y), v.P(AX['F'], y), v.P(ROW_END[r], y)])
    else:
        axis_run([(LEFT_X, v.Y(y))] + [v.P(x, y) for x in xs])

# ---- outside the building: plinth protection, steps, landing, ramp
PP = (2.4, 1.4)
def pp(*pts):
    for p, q in zip(pts, pts[1:]): v.linem(p[0], p[1], q[0], q[1], 0.18, INK, dash=PP)
RAMP_TOP, RAMP_BOT = -0.55, -2.05
pp((10.2, -0.75), (8.1, -0.75))
pp((6.0, -0.75), (3.15, -0.75), (3.15, -0.15), (-0.75, -0.15), (-0.75, 10.05), (14.65, 10.05), (14.65, 4.05), (16.35, 4.05), (16.35, -0.15), (12.3, -0.15))
v.steps(6.0, -0.9, 8.1, 0, 3, 's', 0.13, INK)
v.rectm(10.2, RAMP_BOT, 11.7, 0, 0.18, INK)
v.ramp(11.7, RAMP_BOT, 17.1, RAMP_TOP, 'w', None, lw=0.18)
_ax, _ay0, _ay1 = v.X(7.05), v.Y(-0.9), v.Y(0)
v.linem(7.05, -0.9, 7.05, -0.05, 0.13, INK)
d.poly([(v.X(7.05), v.Y(-0.05)), (v.X(7.05) + 0.5, v.Y(-0.05) - 1.8), (v.X(7.05) - 0.5, v.Y(-0.05) - 1.8)], True, 0, fill=INK)

# ---- furniture, light, and fittings
def chair_row(x, y, n, pitch=0.45, s=0.34):
    for i in range(n):
        v.rectm(x + i * pitch, y, x + i * pitch + s, y + s, 0.09, LIGHT); blocked(x + i * pitch, y, x + i * pitch + s, y + s)
for y in (5.25, 5.9, 6.55, 7.2):
    chair_row(4.5, y, 5); chair_row(7.15, y, 4)
v.rectm(5.4, 8.1, 8.7, 8.6, 0.09, LIGHT); blocked(5.4, 8.1, 8.7, 8.6)                  # head table
chair_row(5.75, 8.66, 6, 0.45, 0.34)
v.rectm(3.1, 2.25, 3.785, 3.15, 0.13, FX); blocked(3.1, 2.25, 3.785, 3.15)              # public counter behind the window
d.text(v.X(3.44), v.Y(2.62), 'काउंटर', 1.2, align='center')
def fx_wc(x, y, rot):
    v.wc(x, y, rot, FX)
    if rot in 'ew': s = -1 if rot == 'w' else 1; blocked(x, y - 0.2, x + s * 0.62, y + 0.2)
    else: s = -1 if rot == 's' else 1; blocked(x - 0.2, y, x + 0.2, y + s * 0.62)
def fx_basin(x, y, rot, w=0.45, dep=0.34):
    v.basin(x, y, rot, FX, w=w, depth=dep)
    if rot in 'ew': s = -1 if rot == 'w' else 1; blocked(x, y - w / 2, x + s * dep, y + w / 2)
    else: s = -1 if rot == 's' else 1; blocked(x - w / 2, y, x + w / 2, y + s * dep)
def fx_urinal(x, y):
    """Bowl on the south face of a room, as a small U."""
    v.rectm(x - 0.17, y, x + 0.17, y + 0.08, 0.13, FX)
    d.ellipse(v.X(x - 0.14), v.Y(y + 0.08), v.X(x + 0.14), v.Y(y + 0.32), 0.13, FX); blocked(x - 0.17, y, x + 0.17, y + 0.32)
fx_wc(13.67, 8.3, 'w'); fx_basin(12.82, 9.07, 's')                                      # ladies
fx_wc(13.67, 5.75, 'w'); fx_urinal(12.8, 5.3575); fx_basin(13.67, 6.8, 'w')             # gents
fx_wc(13.3, 5.2425, 's'); fx_basin(12.32, 3.3575, 'n')                                  # accessible
v.linem(13.6, 4.62, 13.6, 5.22, 0.18, FX)                                               # grab rail
for b_ in BLOCKS:
    for o in _doors:
        assert not _overlap(b_, _swing(o)), ('blocked swing', b_, o)

# ---- walls: plain double line
for (x0, y0), (x1, y1) in B.region().edges():
    # The foot of each verandah wall lies along columns B4 and D4, which cover it: stop those lines at the column
    # edge and at the trace corner, so nothing ends 1.15 mm from B4 or D4.
    if y0 == y1 == 0.6:
        if x0 < 3.9 < x1: x1 = 3.9
        if x0 < 11.7 < x1: x0 = 11.7
    if x0 == x1 and x0 in (4.015, 11.585) and y0 == 0.6: y0 = 0.83
    d.line(v.X(x0), v.Y(y0), v.X(x1), v.Y(y1), 0.35, INK, None, 2)
for o in B.openings:
    if o['t'] == 'window': v._window(o, INK)
    elif o['t'] == 'door' and o['kind'] == 'grille':
        # The gate's zigzag starts 5 mm clear of trace corner C3; a straight lead runs to it from the crossing itself.
        gx = AX['C'] + 0.51
        v.linem(AX['C'], AY['3'], gx, AY['3'], 0.13, INK)
        v._door(dict(o, at=gx, w=o['at'] + o['w'] - gx), 0.25, 0.13, INK)
    elif o['t'] == 'door': v._door(o, 0.25, 0.13, INK)
# verandah: the low parapet is a fill-only grey bar, so it has no line ends near the trace corners; the returns are
# only 600 long between two trace corners, so no line on them could clear both. The plinth edge runs on top of it.
for x0, y0, x1, y1 in PARAPET:
    d.rect(v.X(x0), v.Y(y0), (x1 - x0) * v.k, (y1 - y0) * v.k, 0, fill=GREY)
v.linem(3.9, 0, 11.7, 0, 0.35, INK)
v.linem(3.9, 0, 3.9, 0.6, 0.35, INK)
v.linem(11.7, 0, 11.7, 0.6, 0.35, INK)
# columns: fill-only, solid black
for c in ALL_COLS:
    d.rect(v.X(c[0]), v.Y(c[1]), COL * v.k, COL * v.k, 0, fill=INK)

# ---- grid bubbles, on the top and left only
for a, x in AX.items():
    cx, cy = v.X(x), TOP_Y + BUB_R
    d.circle(cx, cy, BUB_R, 0.18, fill=WHITE); d.text(cx, cy - BUB_H * 0.45, a, BUB_H, align='center')
for r, y in AY.items():
    cx, cy = LEFT_X - BUB_R, v.Y(y)
    d.circle(cx, cy, BUB_R, 0.18, fill=WHITE); d.text(cx, cy - BUB_H * 0.45, r, BUB_H, align='center')

# ---- dimension chains: mm, 45 degree ticks, feet-inches in brackets on overalls
SX = [AX[k] for k in 'ABCDEF']
SY = [0, 0.6, 3.3, 6.3, 9.3]
v.chain('t', SX, OFF_T[0], DP, mm_, 2.0, 'tick')
v.chain('t', [0, W], OFF_T[1], DP, mm_, 2.2, 'tick', labels=[f'{mm_(W)} [{ft_in(W)}]'], ext_from=OFF_T[0] + 3)
v.chain('l', SY, OFF_L[0], 0, mm_, 2.0, 'tick')
v.chain('l', [0, DP], OFF_L[1], 0, mm_, 2.2, 'tick', labels=[f'{mm_(DP)} [{ft_in(DP)}]'], ext_from=OFF_L[0] + 3)
v.chain('r', [3.3, 5.3, 7.3, 9.3], 10.5, 13.9, mm_, 1.9, 'tick', labels=['', '2000', '2000'])    # 10.5 keeps its tick and extension 5 mm clear of F3
d.text(v.X(13.9) + 10.5 - 0.7, v.Y(4.72), '2000', 1.9, align='center', angle=90)    # lifted clear of the plinth protection line
_low = 25.5
v.chain('b', [3.9, 6.0, 8.1, 10.2, 11.7, 17.1], _low, 0, mm_, 1.9, 'tick', ext_from=_low - 3.5)

# ---- room tags: Hindi first, English capitals beneath in smaller type
rtag('101', 7.05, 1.2, 2.9, 2.0, 1.7, 1.7)
rtag('102', 1.5, 2.05, 2.1, 1.5, 1.4, 1.4)
rtag('103', 1.6, 5.3, 2.3, 1.5, 1.45, 1.5)
rtag('104', 1.12, 8.15, 1.75, 1.35, 1.25, 1.35, 0.22)
rtag('105', 3.0, 8.25, 1.75, 1.35, 1.25, 1.35, 0.22)
rtag('106', 7.05, 4.4, 3.2, 2.2, 1.8, 1.7)
stack(v.X(10.95), v.Y(5.58), [('107', 1.4, False), (ROOM['107'][1], 1.85, True), ('PASSAGE', 1.45, False), ('(1.50m X', 1.3, False), ('6.00m)', 1.3, False)], 0.26)
rtag('108', 12.72, 7.78, 1.4, 1.2, 1.15, 1.25, 0.18)
rtag('109', 12.5, 6.72, 1.4, 1.2, 1.15, 1.25, 0.18)
rtag('110', 12.71, 4.2, 1.3, 1.194, 1.15, 1.2, 0.18)                                 # English at 4.7 pt, one line
rtag('111', 14.1, 1.95, 2.1, 1.55, 1.45, 1.4)

def wheelchair(x, y, s=1.9):
    d.circle(x - 0.34 * s, y + 1.02 * s, 0.14 * s, 0, fill=INK)
    d.line(x - 0.34 * s, y + 0.82 * s, x - 0.34 * s, y + 0.22 * s, 0.25)
    d.line(x - 0.34 * s, y + 0.58 * s, x + 0.12 * s, y + 0.58 * s, 0.2)
    d.line(x - 0.34 * s, y + 0.22 * s, x + 0.26 * s, y + 0.22 * s, 0.25)
    d.line(x + 0.26 * s, y + 0.22 * s, x + 0.52 * s, y - 0.34 * s, 0.25)
    d.line(x + 0.52 * s, y - 0.34 * s, x + 0.76 * s, y - 0.34 * s, 0.25)
    d.arc(x - 0.2 * s, y - 0.1 * s, 0.5 * s, 105, 270, 0.25)
wheelchair(v.X(12.05), v.Y(4.92), 1.7)

# ---- door and window tags, every one of them; the count must match the schedule
TAGS = [('D', 5.4, 2.0), ('D', 8.7, 2.0),
        ('D1', 3.42, 1.32), ('D1', 2.0, 3.62), ('D1', 3.42, 4.62), ('D1', 1.05, 6.62), ('D1', 3.42, 6.75), ('D1', 9.72, 7.0), ('D1', 12.2, 1.32),
        ('D3', 11.22, 4.1), ('D2', 12.05, 5.62), ('D2', 12.05, 8.42), ('CG', 10.95, 2.82), ('PW', 4.25, 2.62)]
for m_, x, y in TAGS: d.text(v.X(x), v.Y(y), m_, 1.6, align='center')
def south(m_, cx, y0=0.6): d.text(v.X(cx), v.Y(y0) - 3.2, m_, 1.6, align='center')
def north(m_, cx): d.text(v.X(cx), v.Y(DP) + 1.4, m_, 1.6, align='center')
def west(m_, cy): d.text(v.X(0) - 1.2, v.Y(cy) - 0.8, m_, 1.6, align='right')
def east(m_, cy, x=W): d.text(v.X(x) + 1.2, v.Y(cy) - 0.8, m_, 1.6)
WTAGS = [('W', south, 1.95), ('W', south, 13.65), ('W', north, 5.4), ('W', north, 8.7), ('W', west, 1.95), ('W', west, 4.8), ('W', east, 1.95),
         ('W1', north, 1.05), ('W1', north, 10.95), ('W1', west, 7.8), ('V', north, 3.0)]
for m_, f_, a in WTAGS: f_(m_, a)
for cy in (4.3, 5.75, 8.3): east('V', cy, 13.9)
_tagged = {m_: sum(1 for t in TAGS if t[0] == m_) + sum(1 for t in WTAGS if t[0] == m_) + (3 if m_ == 'V' else 0) for m_ in OW}
assert _tagged == COUNT, (_tagged, COUNT)

# ---- labels on the plan
def lev(x, y, s):
    """Level with a short leader."""
    d.circle(v.X(x), v.Y(y), 0.3, 0, fill=INK)
    d.line(v.X(x), v.Y(y), v.X(x) + 2.2, v.Y(y), 0.09)
    d.text(v.X(x) + 2.6, v.Y(y) - 0.85, s, 1.7)
lev(4.32, 1.35, 'FFL +0.450')
lev(8.3, -1.35, 'GL +0.000')
stack(v.X(4.95), v.Y(0.5), [('पैरापेट दीवार', 1.4, False), ('LOW PARAPET', 1.15, False)], 0.1)
stack(v.X(7.05), v.Y(-1.36), [('ऊपर', 1.6, False), ('UP', 1.3, False)], 0.1)
stack(v.X(10.95), v.Y(-1.15), [('लैंडिंग', 1.5, False), ('LANDING', 1.2, False)], 0.15)
_cy = (RAMP_TOP + RAMP_BOT) / 2
d.text(v.X(14.3), v.Y(_cy) + 1.2, 'रैम्प, 1:12 ढलान, 1500 चौड़ा', 1.7, align='center')
d.text(v.X(14.3), v.Y(_cy) - 2.4, 'RAMP IN 1:12 SLOPE', 1.5, align='center')
d.text(v.X(-2.6), v.Y(-0.75), 'प्लिंथ प्रोटेक्शन प्लेटफ़ॉर्म, 750 mm चौड़ा', 1.65)
d.text(v.X(-2.6), v.Y(-1.13), 'PLINTH PROTECTION PLATFORM (750 mm WIDE)', 1.35)
d.line(v.X(1.05), v.Y(-0.62), v.X(1.05), v.Y(-0.17), 0.09)

# north sign: an arrow with N in a small circle
nx, ny = v.X(16.55), v.Y(6.55)
d.line(nx, ny, nx, ny + 11, 0.25)
d.poly([(nx, ny + 13.2), (nx + 1.15, ny + 9.4), (nx - 1.15, ny + 9.4)], True, 0, fill=INK)
d.circle(nx, ny + 16.2, 2.7, 0.18)
d.text(nx, ny + 15.2, 'N', 2.2, True, align='center')
d.text(nx, ny - 3.6, 'उत्तर', 1.8, align='center')

# drawing title under the plan
tx, ty = 25, 122.8
w_ = d.text(tx, ty + 4.2, 'ग्राउंड फ़्लोर प्लान', 3.9, True)
d.text(tx + w_ + 3, ty + 4.2, 'GROUND FLOOR PLAN', 2.7, True)
d.text(tx + w_ + 3 + d.width('GROUND FLOOR PLAN', 2.7, True) + 5, ty + 4.2, 'स्केल / SCALE 1:100', 2.2)
d.line(tx, ty + 2.9, 180, ty + 2.9, 0.35)
d.text(tx, ty - 1.0, f'प्लिंथ एरिया / PLINTH AREA:  {PLINTH:.2f} sq.m / {sqft(PLINTH):.2f} sq.ft', 2.5, True)

# ---- left band: notes and legend
NX, NW = 24, 79
yy = BAND - 6.5
htext(NX, yy, 'महत्वपूर्ण नोट्स', 'IMPORTANT NOTES', 2.8, 1.9)
yy -= 2.2
NOTES = ['सभी माप mm में हैं; कमरों के नाम के नीचे साइज़ मीटर (m) में लिखा है।',
         'बाहरी ग्रिड लाइनें इमारत के बाहरी किनारे पर ली गई हैं, कॉलम के सेंटर पर नहीं, ताकि कमरों का जोड़ प्लिंथ एरिया से मिल जाए।',
         'कमरों के साइज़ और क्षेत्रफल ग्रिड लाइनों तक नापे गए हैं, इसलिए उनका जोड़ प्लिंथ एरिया के बराबर आता है। कमरों का क्लियर साइज़ इससे कम है।',
         'प्लिंथ एरिया में छत वाला बरामदा पूरा गिना गया है; उसके कॉलमों के बीच पैरापेट दीवार है। प्लिंथ प्रोटेक्शन, सीढ़ियाँ और रैम्प इसमें नहीं गिने गए।',
         'कार्पेट एरिया केवल अभ्यास के लिए है: IS 3861 के आधार पर, कमरे 102, 103, 104, 106 और 111, दीवारों के भीतर। कॉलम नहीं घटाए गए। RERA की परिभाषा अलग है।',
         'यह शीट किसी मानक के पालन का दावा नहीं करती।']
for i, s_ in enumerate(NOTES):
    d.text(NX, yy - 1.8, f'{i + 1}.', 1.8)
    yy = d.para(NX + 3.6, yy, NW - 3.6, s_, 1.8, lead=1.72) - 1.25
yy -= 5.2
htext(NX, yy, 'संकेत', 'LEGEND', 2.4, 1.7)
yy -= 5.0
def legend(y, hi, en):
    d.text(NX + 13.5, y, hi, 1.7)
    d.text(NX + 13.5 + d.width(hi, 1.7) + 1.6, y, en, 1.3, col=GREY)
LG = 4.6
d.rect(NX, yy - 0.2, 10.5, 2.3, 0.35); legend(yy, 'बाहरी दीवार 230', 'EXTERNAL WALL')
yy -= LG
d.rect(NX, yy + 0.4, 10.5, 1.15, 0.35); legend(yy, 'भीतरी दीवार 115', 'INTERNAL WALL')
yy -= LG
d.rect(NX + 4.1, yy - 0.2, 2.3, 2.3, 0, fill=INK); legend(yy, 'RCC कॉलम 230 x 230', 'RCC COLUMN')
yy -= LG
d.rect(NX, yy + 0.4, 10.5, 1.15, 0, fill=GREY); legend(yy, 'पैरापेट दीवार 115, 600 ऊँची', 'LOW PARAPET')
yy -= LG
d.line(NX, yy + 1, NX + 10.5, yy + 1, 0.18, INK, PP); legend(yy, 'प्लिंथ प्रोटेक्शन', 'PLINTH PROTECTION')
yy -= LG
d.line(NX, yy + 1, NX + 10.5, yy + 1, 0.09, INK, DASH); legend(yy, 'ग्रिड लाइन', 'GRID LINE')
yy -= LG
d.rect(NX, yy - 0.2, 10.5, 2.3, 0.09, fill=KOTA_TINT); legend(yy, 'कोटा स्टोन; शेडिंग ग्रिड लाइनों तक', 'KOTA STONE')
assert yy > 11, yy

# ---- schedule of joinery, finish key, scale bar
SX0 = 107
yy = BAND - 6.5
htext(SX0, yy, 'दरवाज़े-खिड़की शेड्यूल', 'SCHEDULE OF JOINERY', 2.8, 1.9)
JW = [8, 8, 9.5, 9.5, 8, 8.5, 8, 40, 26]
JH = [('क्र.', 'SL.'), ('टाइप', 'TYPE'), ('चौड़ाई', 'WIDTH'), ('ऊँचाई', 'HEIGHT'), ('सिल', 'SILL'), ('टॉप', 'TOP'), ('संख्या', 'NOS.'), ('विवरण', 'DESCRIPTION'), ('टिप्पणी', 'REMARKS')]
JS = [('D', 2100, 0, 'दो पल्लों का दरवाज़ा / 2-LEAF DOOR', 'बाहर खुलता है'),
      ('D1', 2100, 0, 'एक पल्ले का दरवाज़ा / 1-LEAF DOOR', ''),
      ('D2', 2100, 0, 'PVC दरवाज़ा / PVC DOOR', 'शौचालय'),
      ('D3', 2100, 0, 'एक पल्ले का दरवाज़ा / 1-LEAF DOOR', 'बाहर खुलता है, 900 क्लियर'),
      ('CG', 2100, 0, 'कोलैप्सिबल गेट / COLLAPSIBLE GATE', 'गलियारा'),
      ('W', 1300, 800, 'खिड़की / WINDOW', ''),
      ('W1', 1300, 800, 'खिड़की / WINDOW', ''),
      ('PW', 900, 900, 'पब्लिक विंडो / PUBLIC WINDOW', 'काउंटर पर'),
      ('V', 450, 1650, 'वेंटिलेटर / VENTILATOR', '')]
jrows = [[str(i + 1), m_, mm_(OW[m_]), str(hh_), str(sill), str(sill + hh_), str(COUNT[m_]), desc, rem] for i, (m_, hh_, sill, desc, rem) in enumerate(JS)]
assert {r[1] for r in jrows} == set(OW)
yb = btable(SX0, yy - 2.0, JW, JH, jrows, 1.55, 4.15, ['center', 'left', 'right', 'right', 'right', 'right', 'right', 'left', 'left'], head_h=7.4, hh=1.5, he=1.15)
yy = yb - 5.6
htext(SX0, yy, 'फ़र्श की फ़िनिश', 'FLOOR FINISH', 2.5, 1.7)
FW = [11, 42, 49, 11.5, 11.5]
FH = [('संकेत', 'KEY'), ('नाम (हिंदी)', 'NAME (HINDI)'), ('नाम (अंग्रेज़ी)', 'NAME (ENGLISH)'), ('एरिया', 'sq.m'), ('एरिया', 'sq.ft')]
frows = [[k, FINISH[k][0], FINISH[k][1], f'{BYKEY[k]:.2f}', f'{round(sum(sqft(area(r)) for r in ROOMS if r[7] == k), 2):.2f}'] for k in ('KOTA', 'VIT', 'CC', 'AS')]
_fy = yy - 1.6
d.rect(SX0, _fy - 7.4 - 3.9, FW[0], 3.9, 0, fill=KOTA_TINT)
yb = btable(SX0, _fy, FW, FH, frows, 1.5, 3.9, ['left', 'left', 'left', 'right', 'right'], head_h=7.4, hh=1.4, he=1.1)
d.text(BAR_X, BAR_Y + 5.2, 'स्केल बार / SCALE BAR  1:100', 1.7, col=GREY)
d.scale_bar(BAR_X, BAR_Y, 10, 10, [0, 1, 2, 3, 4, 5, 10], [''] * 7, 1.9, 2.0)
for _m, _t in ((0, '0'), (5, '5'), (10, '10 m')): d.text(BAR_X + _m * 10, BAR_Y - 5.0, _t, 1.9, align='center')
assert yb > BAR_Y + 8, yb

# ---- right column: area statement
CX, CW = RX + 3, 410 - RX - 6
yy = 287 - 6.8
w_ = d.text(CX, yy, 'क्षेत्रफल विवरण', 3.4, True)
d.text(CX + w_ + 2.6, yy, 'AREA STATEMENT', 2.3, False, GREY)
AW = [9, 11.5, 33, 42, 19.5, 18, 19, 16]
assert abs(sum(AW) - CW) < 1e-6, sum(AW)
AH = [('क्र. सं.', 'SL. NO.'), ('कक्ष सं.', 'ROOM NO.'), ('नाम (हिंदी)', 'NAME (HINDI)'), ('नाम (अंग्रेज़ी)', 'NAME (ENGLISH)'), ('साइज़ (m)', 'SIZE (m)'),
      ('क्षेत्रफल (sq.m)', 'AREA (sq.m)'), ('क्षेत्रफल (sq.ft)', 'AREA (sq.ft)'), ('फ़र्श', 'FLOOR')]
arows = [[str(i + 1), r[0], r[1], ' '.join(r[2]), f'{r[5]:.2f} X {r[6]:.2f}', f'{area(r):.2f}', f'{sqft(area(r)):.2f}', r[7]] for i, r in enumerate(ROOMS)]
n_r = len(arows)
arows += [['', '', 'प्लिंथ एरिया', 'PLINTH AREA', '', f'{PLINTH:.2f}', f'{sqft(PLINTH):.2f}', ''],
          ['', '', 'कार्पेट एरिया', 'CARPET AREA', 'केवल अभ्यास', f'{CARPET:.2f}', f'{sqft(CARPET):.2f}', '']]
yb = btable(CX, yy - 2.0, AW, AH, arows, 1.9, 4.85, ['center', 'center', 'left', 'left', 'left', 'right', 'right', 'left'], bold_rows={n_r, n_r + 1}, head_h=8.6, hh=1.6, he=1.25)

# ---- right column: practice panel, filling the height down to the stamp
TB_H = 62.0
REV_H = 3 * 3.9
ST_H = 22.4
ST_Y = 10 + TB_H + REV_H + 1.6
PY0 = yb - 3.0
PH_ = PY0 - (ST_Y + ST_H + 1.6)
d.rect(CX, PY0 - PH_, CW, PH_, 0.35)
d.rect(CX, PY0 - 7.4, CW, 7.4, 0, fill=KOTA_TINT)
d.line(CX, PY0 - 7.4, CX + CW, PY0 - 7.4, 0.18)
w_ = d.text(CX + 2, PY0 - 5.2, 'अभ्यास', 3.2, True)
d.text(CX + 2 + w_ + 3, PY0 - 5.0, 'कैलिब्रेट करें, फिर तीन माप लें', 2.1)
yy = PY0 - 9.2
VX = CX + CW - 2
TW_ = CW - 34
STEPS = [('कैलिब्रेट', 'नीचे बने स्केल बार के 0 और 10 m निशानों पर क्लिक करके 10 m दर्ज करें।', ['10 m']),
         ('माप 1: लंबाई', 'ऊपर की बाहरी डाइमेंशन लाइन के दोनों सिरों पर क्लिक करें, ग्रिड A से F तक, जहाँ 15600 [51\'-2"] लिखा है।', [f'{W:.2f} m']),
         ('माप 2: प्लिंथ एरिया', 'इमारत के बाहरी किनारे के 10 कोने ट्रेस करें: ' + ', '.join(GROSS_REFS) + '। बरामदा शामिल है; प्लिंथ प्रोटेक्शन, सीढ़ियाँ और रैम्प शामिल नहीं।', [f'{PLINTH:.2f} sq.m', f'{sqft(PLINTH):.2f} sq.ft']),
         ('माप 3: कोटा स्टोन', 'बरामदे 101 और गलियारे 107 को मिलाकर L आकार में ट्रेस करें। ग्रिड क्रॉसिंग पर 6 कोने: ' + ', '.join(KOTA_REFS) + '। शेडिंग इन्हीं ग्रिड लाइनों तक है।', [f'{KOTA:.2f} sq.m', f'{sqft(KOTA):.2f} sq.ft'])]
for head, body, vals in STEPS:
    d.text(CX + 2, yy - 2.3, head, 2.3, True)
    for i, s_ in enumerate(vals):
        d.text(VX, yy - 2.6 - i * 3.9, s_, 2.6 if i == 0 else 1.9, i == 0, align='right')
    y2 = d.para(CX + 2, yy - 3.9, TW_, body, 1.95, lead=1.72)
    yy = y2 - 1.7
d.line(CX + 2, yy + 0.3, CX + CW - 2, yy + 0.3, 0.09)
yy = d.para(CX + 2, yy - 0.6, CW - 4, 'हर कोना चुनते समय ज़ूम इन करें: कम ज़ूम पर Snap to Content पास की किसी दूसरी लाइन पर जा सकता है।', 1.95, True, lead=1.72)

# two small keys to the traces, each corner named by its grid crossing; not for measuring
MK = 2.75
def mini(x, y, title, refs, poly, tint, offs):
    P = lambda p: (x + p[0] * MK, y + p[1] * MK)
    if poly is not FOOT: d.poly([P(p) for p in FOOT], True, 0.13, GREY)
    d.poly([P(p) for p in poly], True, 0.3, INK, fill=tint)
    for r_ in refs:
        px, py = P(G(r_)); ox, oy, al = offs[r_]
        d.circle(px, py, 0.42, 0, fill=INK)
        d.text(px + ox, py + oy, r_, 1.35, align=al)
    d.text(x + 15.6 * MK / 2, y + 9.3 * MK + 2.6, title, 1.85, True, align='center')
_my = PY0 - PH_ + 4.6
_gap = (CW - 2 * 15.6 * MK) / 3
assert _my + 9.3 * MK + 5.2 < yy, (_my, yy)
mini(CX + _gap, _my, 'माप 2: 10 कोने', GROSS_REFS, FOOT, PALE,
     {'B5': (0, -2.1, 'center'), 'D5': (0, -2.1, 'center'), 'D4': (0.9, -1.9, 'left'), 'F4': (0.9, -0.6, 'left'), 'F3': (0.9, -0.4, 'left'),
      'E3': (0.8, 0.5, 'left'), 'E1': (0.8, 0.2, 'left'), 'A1': (-0.8, 0.2, 'right'), 'A4': (-0.8, -0.6, 'right'), 'B4': (-0.9, -1.9, 'right')})
mini(CX + 2 * _gap + 15.6 * MK, _my, 'माप 3: 6 कोने', KOTA_REFS, KOTA_L, KOTA_TINT,
     {'B5': (0, -2.1, 'center'), 'D5': (0, -2.1, 'center'), 'D1': (0.8, 0.2, 'left'), 'C1': (-0.8, 0.2, 'right'), 'C3': (-0.8, 0.5, 'right'), 'B3': (-0.8, 0.5, 'right')})
_mc = CX + CW / 2
d.text(_mc, _my + 13.2, 'केवल पहचान के लिए।', 1.65, col=GREY, align='center')
d.text(_mc, _my + 9.4, 'इन पर न नापें।', 1.65, col=GREY, align='center')

# ---- right column: stamp, revision panel and title block, bottom right
d.rect(CX, ST_Y, CW, ST_H, 0.6)
d.rect(CX + 0.9, ST_Y + 0.9, CW - 1.8, ST_H - 1.8, 0.13)
_sc = CX + CW / 2
d.text(_sc, ST_Y + 15.0, 'निर्माण के लिए नहीं', 4.1, True, align='center')
d.text(_sc, ST_Y + 10.2, 'अभ्यास शीट। यह भवन काल्पनिक है।', 2.25, True, align='center')
d.text(_sc, ST_Y + 6.3, 'भारत के किसी पेशेवर ने इस शीट की समीक्षा नहीं की है।', 1.8, align='center')
_st_en = 'NOT FOR CONSTRUCTION. FICTIONAL PRACTICE SHEET. NOT REVIEWED BY ANY PROFESSIONAL IN INDIA.'
assert d.width(_st_en, 1.6) <= CW - 6, d.width(_st_en, 1.6)
d.text(_sc, ST_Y + 2.5, _st_en, 1.6, align='center')

RW = [24, 26, 88, CW - 138]
d.table(CX, 10 + TB_H + REV_H, RW, [['', '', '', ''], ['0', '06.11.2026', 'अभ्यास के लिए जारी / ISSUED FOR PRACTICE', 'PP'],
                                     ['संशोधन / REV.', 'दिनांक / DATE', 'विवरण / DESCRIPTION', 'आद्याक्षर / INITIALS']], 1.45, 3.9, head=0, bold_rows={2})

yy = 10 + TB_H
def cell(x, y_, w, h_, label, vals, align='left'):
    d.rect(x, y_, w, h_, 0.18)
    d.text(x + 1.2, y_ + h_ - 2.8, label, 1.4, col=GREY)
    # vals: [(text, h, bold)] stacked up from the bottom of the box
    ty = y_ + 1.5
    assert d.width(label, 1.4) <= w - 2.0, (label, w)
    for s_, h, b in vals: assert d.width(s_, h, b) <= w - 2.0, (s_, w)
    for s_, h, b in reversed(vals):
        if is_hi(s_): ty += 0.35 * h
        tx = x + 1.2 if align == 'left' else x + w / 2
        d.text(tx, ty, s_, h, b, align=align)
        ty += h + (0.65 if not is_hi(s_) else 0.8 * h)
def row(h_, cells):
    global yy
    yy -= h_
    xx = CX
    for w, label, vals in cells:
        cell(xx, yy, w, h_, label, vals); xx += w
row(8.8, [(CW, 'ड्राइंग सं. / DRAWING NO.', [('A-01/GPB/Dt.06.11.26', 2.6, True)])])
row(8.8, [(CW, 'क्लाइंट / CLIENT', [('ग्राम पंचायत अभ्यासपुर / GRAM PANCHAYAT ABHYASPUR (काल्पनिक / FICTIONAL)', 2.0, False)])])
_c5 = CW / 5
row(8.8, [(_c5, 'स्केल / SCALE', [('1:100', 2.4, True)]), (_c5, 'दिनांक / DATE', [('06.11.2026', 2.2, False)]),
          (_c5, 'सभी माप / ALL DIMENSIONS IN', [('mm.', 2.2, False)]),
          (_c5, 'कार्य सं. / JOB NO.', [('07', 2.2, False)]), (_c5, 'शीट / SHEET', [('1 OF 1', 2.2, False)])])
_c2 = CW / 2
row(9.1, [(_c2, 'बनाया / DRN', [('अभ्यास / PRACTICE', 2.0, False)]), (_c2, 'जाँचा / CHKD', [('अभ्यास / PRACTICE', 2.0, False)])])
row(16.5, [(CW, 'कार्य का नाम / NAME OF WORK', [('प्रस्तावित ग्राम पंचायत भवन, अभ्यासपुर', 3.5, True), ('PROPOSED GRAM PANCHAYAT BHAWAN, ABHYASPUR', 2.5, True)])])
row(10.0, [(CW, 'ड्राइंग का शीर्षक / DRAWING TITLE', [('ग्राउंड फ़्लोर प्लान / GROUND FLOOR PLAN', 2.6, True)])])
assert abs(yy - 10) < 1e-6, yy

d.text(410, 5.2, 'PolyPDF. अभ्यास शीट, काल्पनिक भवन।', 1.7, col=GREY, align='right', track=False)

# ---- the app drops any anchor inside a text object's box plus 2.5 pt, so no text may come near a protected point
for b_ in d.boxes:
    if not b_[4].strip(): continue
    for q in PROTECT:
        assert not (b_[0] - 2.0 < q[0] < b_[2] + 2.0 and b_[1] - 2.0 < q[1] < b_[3] + 2.0), ('text on a protected point', b_, q)

# ---- measuring facts, in sheet millimetres
d.expect('calibrate', p0=CAL[0], p1=CAL[1], metres=10.0, note='scale bar beside the title block, 0 and 10 m marks')
d.expect('check', p0=CHECK[0], p1=CHECK[1], metres=W, note="printed 15600 [51'-2\"]: top outer chain, line ends at grids A and F")
d.expect('gross', pts=[v.P(*p) for p in FOOT], sqm=poly_area(FOOT), perimeter=poly_perimeter(FOOT), note='PLINTH AREA: outer face, 10 grid crossings ' + ' '.join(GROSS_REFS))
d.expect('floor', pts=[v.P(*p) for p in KOTA_L], sqm=poly_area(KOTA_L), perimeter=poly_perimeter(KOTA_L), note='KOTA: rooms 101 and 107, grid crossings ' + ' '.join(KOTA_REFS))
d.save()
