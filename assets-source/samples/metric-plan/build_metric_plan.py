#!/usr/bin/env python3
"""Metric practice plan for PolyPDF's non-US readers: one fictional building, A1 landscape at 1:100.
The same geometry is drawn for every language. Only the words and the number format change.
Usage: python build_metric_plan.py OUTDIR [locale ...]   Needs reportlab."""
import json, sys
from pathlib import Path
import reportlab
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

# ReportLab rounds to 6 significant digits, which would make a 10 m scale bar 283.464 pt rather than 283.4646.
# This is a measuring exercise, so keep the geometry exact.
import reportlab.pdfgen.canvas as _cv, reportlab.pdfgen.pathobject as _po, reportlab.pdfgen.textobject as _to
def _fp_str(*a):
    if len(a) == 1 and isinstance(a[0], (list, tuple)): a = a[0]
    return ' '.join(('%.6f' % v).rstrip('0').rstrip('.') or '0' for v in a)
_cv.fp_str = _po.fp_str = _to.fp_str = _fp_str

MM = 72 / 25.4
W, H = 841 * MM, 594 * MM          # A1 landscape
S = 10 * MM                         # 1 m on the sheet at 1:100
INK, GRAY, PALE, POCHE = HexColor('#17252c'), HexColor('#5f6b73'), HexColor('#e9edef'), HexColor('#c9d0d4')
TILE = HexColor('#dfe7ea')
fonts = Path(reportlab.__file__).parent / 'fonts'
pdfmetrics.registerFont(TTFont('CAD', str(fonts / 'Vera.ttf')))
pdfmetrics.registerFont(TTFont('CAD-B', str(fonts / 'VeraBd.ttf')))

BW, BH = 40.0, 20.0
GRID = [(0, 11.5, 10, 8.5, 'community'), (10, 11.5, 10, 8.5, 'classroom'), (20, 11.5, 10, 8.5, 'meeting'), (30, 11.5, 10, 8.5, 'workshop'),
        (0, 8.5, 40, 3, 'corridor'),
        (0, 0, 10, 8.5, 'lobby'), (10, 0, 10, 8.5, 'office'), (20, 0, 5, 8.5, 'wc_a'), (25, 0, 5, 8.5, 'wc_b'), (30, 0, 5, 8.5, 'plant'), (35, 0, 5, 8.5, 'store')]
ROOM_NO = dict(community='101', classroom='102', meeting='103', workshop='104', corridor='111', lobby='105', office='106', wc_a='107', wc_b='108', plant='109', store='110')
TILED = {'wc_a', 'wc_b'}

class L:
    def __init__(self, data): self.__dict__.update(data)
    def num(self, v, d=2):
        s = f'{v:,.{d}f}'
        t = str.maketrans({',': self.thousands, '.': self.decimal})
        return s.translate(t)
    def dim(self, v):
        return self.num(v * 1000, 0) if self.dim_unit == 'mm' else self.num(v, 2)
    def area(self, v): return f'{self.num(v, 2)} {self.m2}'

class Sheet:
    def __init__(self, c, loc): self.c, self.l = c, loc
    def text(self, x, y, s, size=12, bold=False, color=INK, align='left', angle=0):
        c = self.c; c.saveState(); c.setFillColor(color); c.setFont(self.l.font_b if bold else self.l.font, size); c.translate(x, y); c.rotate(angle)
        {'left': c.drawString, 'center': c.drawCentredString, 'right': c.drawRightString}[align](0, 0, str(s)); c.restoreState()
    def line(self, x1, y1, x2, y2, w=1, color=INK, dash=None):
        c = self.c; c.saveState(); c.setStrokeColor(color); c.setLineWidth(w)
        if dash: c.setDash(dash)
        c.line(x1, y1, x2, y2); c.restoreState()
    def rect(self, x, y, w, h, lw=1, color=INK, fill=None):
        c = self.c; c.saveState(); c.setStrokeColor(color); c.setLineWidth(lw)
        if fill: c.setFillColor(fill)
        c.rect(x, y, w, h, stroke=int(lw > 0), fill=int(fill is not None)); c.restoreState()
    def wrap(self, x, y, s, width, size=12, bold=False, color=INK, lead=1.45):
        font = self.l.font_b if bold else self.l.font
        tokens = s.split(' ') if self.l.wrap_on_space else list(s)
        joiner = ' ' if self.l.wrap_on_space else ''
        row = ''
        for t in tokens:
            cand = (row + joiner + t) if row else t
            if pdfmetrics.stringWidth(cand, font, size) > width and row:
                self.text(x, y, row, size, bold, color); y -= size * lead; row = t
            else: row = cand
        if row: self.text(x, y, row, size, bold, color); y -= size * lead
        return y

def plan(sh, ox, oy, finishes=False):
    l = sh.l
    P = lambda x, y: (ox + x * S, oy + y * S)
    # tile zones first, so the walls sit on top
    if finishes:
        for x, y, w, h, key in GRID:
            if key in TILED: sh.rect(*P(x, y), w * S, h * S, 0, fill=TILE)
    # outer wall: its outer face is the dimensioned boundary, 0.30 m thick
    t = 0.30
    c = sh.c; c.saveState(); c.setFillColor(POCHE); c.setStrokeColor(INK); c.setLineWidth(0)
    p = c.beginPath(); p.moveTo(*P(0, 0)); p.lineTo(*P(BW, 0)); p.lineTo(*P(BW, BH)); p.lineTo(*P(0, BH)); p.close()
    p.moveTo(*P(t, t)); p.lineTo(*P(t, BH - t)); p.lineTo(*P(BW - t, BH - t)); p.lineTo(*P(BW - t, t)); p.close()
    c.drawPath(p, stroke=0, fill=1, fillMode=0); c.restoreState()
    if finishes:
        for x, y, w, h, key in GRID:
            if key in TILED: sh.rect(*P(x, max(y, t)), w * S, (h - t) * S, 0, fill=TILE)
    # partitions on the grid lines, drawn with gaps for doors
    def hwall(y, x1, x2, gaps=()):
        cur = x1
        for g0, g1 in sorted(gaps) + [(x2, x2)]:
            if g0 > cur: sh.line(*P(cur, y), *P(g0, y), 2.2)
            cur = g1
    def vwall(x, y1, y2): sh.line(*P(x, y1), *P(x, y2), 2.2)
    doors_top = [(x + 4.5, x + 5.5) for x in (0, 10, 20, 30)]
    doors_bot = [(4.5, 5.5), (14.5, 15.5), (22, 23), (27, 28), (32, 33), (37, 38)]
    hwall(11.5, t, BW - t, doors_top); hwall(8.5, t, BW - t, doors_bot)
    for x in (10, 20, 30): vwall(x, 11.5, BH - t)
    for x in (10, 20, 25, 30, 35): vwall(x, t, 8.5)
    # outer wall outlines
    c.saveState(); c.setStrokeColor(INK); c.setLineWidth(2.6)
    p = c.beginPath(); p.moveTo(*P(0, 0)); p.lineTo(*P(BW, 0)); p.lineTo(*P(BW, BH)); p.lineTo(*P(0, BH)); p.close(); c.drawPath(p, stroke=1, fill=0)
    c.setLineWidth(1.1); c.rect(*P(t, t), (BW - 2 * t) * S, (BH - 2 * t) * S, stroke=1, fill=0); c.restoreState()
    # door leaves
    def door(x0, y, up):
        a = P(x0, y); r = 1.0 * S
        sh.line(a[0], a[1], a[0], a[1] + (r if up else -r), 0.9)
        c.saveState(); c.setStrokeColor(GRAY); c.setLineWidth(0.6)
        if up: c.arc(a[0] - r, a[1] - r, a[0] + r, a[1] + r, 0, 90)
        else: c.arc(a[0] - r, a[1] - r, a[0] + r, a[1] + r, 270, 90)
        c.restoreState()
    for g0, _ in doors_top: door(g0, 11.5, True)
    for g0, _ in doors_bot: door(g0, 8.5, False)
    # windows
    for x in (3, 13, 23, 33): sh.rect(*P(x, BH - t), 4 * S, t * S, 0.8, fill=HexColor('#ffffff'))
    for x in (3, 13): sh.rect(*P(x, 0), 4 * S, t * S, 0.8, fill=HexColor('#ffffff'))
    # entrance door in the west corridor wall
    sh.rect(*P(0, 9.5), t * S, 1 * S, 0.8, fill=HexColor('#ffffff'))
    # furniture, plan only
    if not finishes:
        for x in (0, 10, 20, 30):
            sh.rect(*P(x + 2.5, 17.7), 5 * S, 1.3 * S, 0.6, GRAY)
        sh.rect(*P(2.0, 1.2), 6 * S, 0.9 * S, 0.6, GRAY); sh.rect(*P(12.0, 1.2), 2.0 * S, 1.0 * S, 0.6, GRAY); sh.rect(*P(15.5, 1.2), 2.0 * S, 1.0 * S, 0.6, GRAY)
        for x in (21.5, 26.5):
            sh.rect(*P(x, 0.9), 2 * S, 1.4 * S, 0.6, GRAY)
    # labels
    for x, y, w, h, key in GRID:
        # the corridor label sits west of centre: the app places a whole-building area label at the centre
        cx, cy = P(5, y + h / 2 + 0.1) if key == 'corridor' else P(x + w / 2, y + h / 2 + 0.6)
        sh.text(cx, cy + 6, getattr(l, 'r_' + key), 13 if w >= 10 else 11, bold=True, align='center')
        sh.text(cx, cy - 12, ROOM_NO[key], 10.5, color=GRAY, align='center')
        area = w * h
        if finishes:
            tag = 'F2' if key in TILED else 'F1'
            sh.text(cx, cy - 29, f'{tag}  {l.area(area)}', 11, align='center')
        else:
            sh.text(cx, cy - 29, l.area(area), 10.5, color=GRAY, align='center')

def dim_h(sh, x1, x2, y, ref_y, value):
    sh.line(x1, y, x2, y, .7, GRAY)
    for x in (x1, x2):
        sh.line(x, ref_y, x, y + 8 if y > ref_y else y - 8, .5, GRAY); sh.line(x - 4, y - 4, x + 4, y + 4, 1.1)
    sh.text((x1 + x2) / 2, y + 6, value, 11.5, align='center')

def dim_v(sh, y1, y2, x, ref_x, value):
    sh.line(x, y1, x, y2, .7, GRAY)
    for y in (y1, y2):
        sh.line(ref_x, y, x - 8 if x < ref_x else x + 8, y, .5, GRAY); sh.line(x - 4, y - 4, x + 4, y + 4, 1.1)
    sh.text(x - 8, (y1 + y2) / 2, value, 11.5, align='center', angle=90)

def scale_bar(sh, x, y):
    l = sh.l; seg = 2.5
    for i in range(4):
        sh.rect(x + i * seg * S, y, seg * S, 10, .7, fill=INK if i % 2 == 0 else HexColor('#ffffff'))
        sh.text(x + i * seg * S, y - 18, l.num(i * seg, 1) if i % 2 else l.num(i * seg, 0), 10, align='center')
    sh.text(x + 4 * seg * S, y - 18, f'{l.num(10, 0)} m', 10, align='center')
    sh.text(x, y + 20, l.scale_bar, 10, bold=True)

def view_title(sh, x, y, num, title, width=1133):
    sh.c.saveState(); sh.c.setLineWidth(1.2); sh.c.setStrokeColor(INK); sh.c.circle(x + 18, y + 16, 17, stroke=1, fill=0); sh.c.restoreState()
    sh.text(x + 18, y + 11, num, 15, bold=True, align='center')
    sh.text(x + 48, y + 20, title, 17, bold=True)
    sh.line(x + 48, y + 11, x + width, y + 11, 1)
    sh.text(x + 48, y - 6, f"{sh.l.scale} {getattr(sh.l, 'scale_ratio', '1:100')}", 11, color=GRAY)

def table(sh, x, y, cols, header, rows, row_h=26, size=11, last_bold=False):
    total = sum(cols); height = (len(rows) + 1) * row_h
    sh.rect(x, y - height, total, height, .7); sh.rect(x, y - row_h, total, row_h, 0, fill=PALE)
    for i, row in enumerate([header] + rows):
        if i: sh.line(x, y - i * row_h, x + total, y - i * row_h, .45, GRAY)
        xx = x
        for w, v in zip(cols, row):
            sh.text(xx + 8, y - (i + 1) * row_h + 8, v, size, bold=(i == 0 or (last_bold and i == len(rows)))); xx += w
    xx = x
    for w in cols[:-1]: xx += w; sh.line(xx, y, xx, y - height, .45, GRAY)
    return y - height

def build(locale, data, out):
    l = L(data); path = Path(out) / f'polypdf-metric-practice-plan-{locale}.pdf'
    c = canvas.Canvas(str(path), pagesize=(W, H), pageCompression=1, invariant=1, initialFontName='CAD')
    c.setTitle(f'{l.project} | A101'); c.setAuthor('PolyPDF sample'); c.setSubject(l.subject); c.setCreator('PolyPDF metric practice plan generator')
    sh = Sheet(c, l)
    # sheet frame: 20 mm binding margin on the left, 10 mm elsewhere
    fx, fy, fw, fh = 20 * MM, 10 * MM, W - 30 * MM, H - 20 * MM
    sh.rect(fx, fy, fw, fh, 1.4)
    ox = fx + 110
    # view 1: floor plan with dimensions
    oy1 = 1020
    plan(sh, ox, oy1)
    top = oy1 + BH * S; bot = oy1; left = ox; right = ox + BW * S
    for i in range(4): dim_h(sh, ox + i * 10 * S, ox + (i + 1) * 10 * S, top + 34, top, l.dim(10))
    for x0, x1 in ((0, 10), (10, 20), (20, 25), (25, 30), (30, 35), (35, 40)): dim_h(sh, ox + x0 * S, ox + x1 * S, bot - 26, bot, l.dim(x1 - x0))
    dim_h(sh, left, right, bot - 56, bot, l.dim(BW))
    dim_v(sh, bot, top, left - 60, left, l.dim(BH))
    y0 = bot
    for h in (8.5, 3, 8.5):
        sh.line(right + 30, y0, right + 30, y0 + h * S, .7, GRAY); sh.line(right, y0, right + 22, y0, .5, GRAY); sh.line(right + 26, y0 - 4, right + 34, y0 + 4, 1.1)
        sh.text(right + 44, y0 + h * S / 2, l.dim(h), 11.5, align='center', angle=90); y0 += h * S
    sh.line(right, y0, right + 22, y0, .5, GRAY); sh.line(right + 26, y0 - 4, right + 34, y0 + 4, 1.1)
    view_title(sh, ox, bot - 118, '1', l.view1)
    scale_bar(sh, right - 10 * S, bot - 112)
    # view 2: finish plan
    oy2 = 250
    plan(sh, ox, oy2, finishes=True)
    view_title(sh, ox, oy2 - 92, '2', l.view2)
    scale_bar(sh, ox + BW * S - 10 * S, oy2 - 86)
    # north arrow
    nx, ny = right + 120, top - 10
    c.saveState(); c.setFillColor(INK); p = c.beginPath(); p.moveTo(nx, ny); p.lineTo(nx - 13, ny - 40); p.lineTo(nx, ny - 32); p.lineTo(nx + 13, ny - 40); p.close(); c.drawPath(p, stroke=0, fill=1); c.restoreState()
    sh.line(nx, ny - 34, nx, ny - 72, 1); sh.text(nx, ny + 10, 'N', 16, bold=True, align='center')
    # title block, ISO style: lower right corner, 180 mm wide
    tw, th = 180 * MM, 290
    tx, ty = fx + fw - tw, fy
    sh.rect(tx, ty, tw, th, 1.2)
    sh.text(tx + 14, ty + th - 26, l.project, 17, bold=True)
    sh.text(tx + 14, ty + th - 46, l.fictional, 11, color=GRAY)
    sh.line(tx, ty + th - 60, tx + tw, ty + th - 60, .8)
    rows = [(l.f_drawing, l.view1), (l.f_discipline, l.discipline), (l.f_scale, getattr(l, 'scale_ratio', '1:100')), (l.f_format, 'A1 (841 × 594 mm)'), (l.f_units, l.units), (l.f_rev, f"A  ·  {getattr(l, 'issue_date', '2026-11-06')}")]
    yy = ty + th - 80
    for k, v in rows:
        sh.text(tx + 14, yy, k, 10, color=GRAY); sh.text(tx + 150, yy, v, 11.5); yy -= 22
    sh.line(tx, ty + 76, tx + tw, ty + 76, .8)
    sh.text(tx + 14, ty + 46, 'POLYPDF', 15, bold=True, color=HexColor('#284b60')); sh.text(tx + 14, ty + 24, l.sample_lib, 9.5, color=GRAY)
    sh.text(tx + tw - 16, ty + 28, 'A101', 34, bold=True, align='right')
    # room schedule above the title block
    colx = tx; col_top = ty + th + 30 + (12 * 25 + 24) + 22
    sh.text(colx, col_top + 12, l.schedule, 14, bold=True)
    srows = []
    for x, y, w, h, key in GRID:
        srows.append([ROOM_NO[key], getattr(l, 'r_' + key), 'F2' if key in TILED else 'F1', l.area(w * h)])
    srows.sort(key=lambda r: r[0])
    srows.append(['', l.total, '', l.area(BW * BH)])
    table(sh, colx, col_top, [50, tw - 50 - 56 - 124, 56, 124], [l.c_no, l.c_room, l.c_finish, l.c_area], srows, 25, 11, last_bold=True)
    # finishes and notes to the left of the schedule
    nxx = right + 90; nw = tx - nxx - 26
    y = top - 130
    sh.text(nxx, y, l.finishes, 14, bold=True); sh.line(nxx, y - 8, nxx + nw, y - 8, 1.2); y -= 30
    y = sh.wrap(nxx, y, f"F1  {l.f1}{getattr(l, 'colon', ': ')}{l.area(715)}", nw, 11.5) - 4
    y = sh.wrap(nxx, y, f"F2  {l.f2}{getattr(l, 'colon', ': ')}{l.area(85)}", nw, 11.5) - 22
    sh.text(nxx, y, l.notes, 14, bold=True); sh.line(nxx, y - 8, nxx + nw, y - 8, 1.2); y -= 30
    for n in l.note_lines: y = sh.wrap(nxx, y, n, nw, 11.5) - 8
    sh.text(fx + 24, fy + 16, l.footer, 10, bold=True, color=GRAY)
    c.showPage(); c.save()
    return path

if __name__ == '__main__':
    out = Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
    all_locales = json.load(open(Path(__file__).with_name('metric_plan_strings.json'), encoding='utf-8'))
    for loc in (sys.argv[2:] or all_locales):
        d = all_locales[loc]
        d.setdefault('font', 'CAD'); d.setdefault('font_b', 'CAD-B'); d.setdefault('wrap_on_space', True)
        print(build(loc, d, out))
