#!/usr/bin/env python3
"""draftkit: a small drafting library for PolyPDF's market practice plans.

Every market plan is its own short script (plan_<id>.py) that uses this library, because the plans
differ in building, sheet, title block and drawing conventions. Nothing here assumes a building shape.

Units: sheet positions and line weights are millimetres from the lower-left corner of the sheet.
Lettering height h is the nominal height in mm (2.5 mm lettering is about 9.8 pt). Plan coordinates
are metres from the plan origin. Output is deterministic, so the same script gives the same bytes.
"""
import json, math, re
from pathlib import Path
import reportlab
from reportlab.lib.colors import HexColor, Color
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

# ReportLab rounds to 6 significant digits, which would shift measured geometry. Keep it exact.
import reportlab.pdfgen.canvas as _cv, reportlab.pdfgen.pathobject as _po, reportlab.pdfgen.textobject as _to
def _fp_str(*a):
    if len(a) == 1 and isinstance(a[0], (list, tuple)): a = a[0]
    return ' '.join(('%.6f' % v).rstrip('0').rstrip('.') or '0' for v in a)
_cv.fp_str = _po.fp_str = _to.fp_str = _fp_str

MM = 72 / 25.4
PT_PER_H = 72 / 25.4 / 0.72            # font size in pt for 1 mm of nominal lettering height
INK = HexColor('#111417')
GREY = HexColor('#6b7277')
LIGHT = HexColor('#a9afb3')
PALE = HexColor('#e6e9eb')
WHITE = HexColor('#ffffff')
_fonts_dir = Path(reportlab.__file__).parent / 'fonts'
pdfmetrics.registerFont(TTFont('CAD', str(_fonts_dir / 'Vera.ttf')))
pdfmetrics.registerFont(TTFont('CAD-B', str(_fonts_dir / 'VeraBd.ttf')))

def color(c):
    return HexColor(c) if isinstance(c, str) else c

def register_font(name, path, shaped=False):
    """shaped=True turns on HarfBuzz shaping for Devanagari or Arabic; it needs the venv-shape environment.
    The face name is taken from the file name: the static Noto instances all carry the same internal name,
    and ReportLab would otherwise silently reuse the first one for the bold."""
    f = TTFont(name, str(path), shaped=True) if shaped else TTFont(name, str(path))
    f.face.name = Path(path).stem.encode()
    pdfmetrics.registerFont(f)

COMPLEX_RANGES = {'arabic': ((0x0600, 0x06FF), (0x0750, 0x077F), (0xFB50, 0xFDFF), (0xFE70, 0xFEFF)),
                  'devanagari': ((0x0900, 0x097F), (0xA8E0, 0xA8FF), (0x1CD0, 0x1CFF))}

# ---------------------------------------------------------------- number formats
def fmt_m(places=2, dec=','):
    """Metres: 19,99"""
    return lambda m: f'{m:.{places}f}'.replace('.', dec)

def fmt_mm(thousands=''):
    """Millimetres with no unit: 14,560 or 14560"""
    return lambda m: f'{round(m * 1000):,d}'.replace(',', thousands)

def fmt_m_cm(dec=',', cm_below=1.0):
    """Metres from 1 m up, centimetres below (93, 2,04); no unit."""
    def f(m):
        return f'{round(m * 100):d}' if m < cm_below - 1e-9 else f'{m:.2f}'.replace('.', dec)
    return f

def fmt_raised(dec=','):
    """German style: 36 raised 5, 2,38 raised 5, 12,01. Returns text runs; the raised digit is millimetres."""
    def f(m):
        mm = round(m * 1000)
        if mm < 1000:
            head, tail = f'{mm // 10:d}', mm % 10
        else:
            head, tail = f'{mm // 1000:d}{dec}{(mm % 1000) // 10:02d}', mm % 10
        return [(head, False)] + ([(str(tail), True)] if tail else [])
    return f

# ---------------------------------------------------------------- geometry helpers
def poly_area(pts):
    return abs(sum(pts[i][0] * pts[(i + 1) % len(pts)][1] - pts[(i + 1) % len(pts)][0] * pts[i][1] for i in range(len(pts)))) / 2

def poly_perimeter(pts):
    return sum(math.dist(pts[i], pts[(i + 1) % len(pts)]) for i in range(len(pts)))

def check_tiling(rooms, footprint, tol=1e-6):
    """rooms: list of (x, y, w, d). Fails unless they fill the polygon footprint exactly with no overlaps."""
    total = sum(w * d for x, y, w, d in rooms)
    gross = poly_area(footprint)
    assert abs(total - gross) < tol, f'rooms {total:.4f} vs footprint {gross:.4f}'
    for i, a in enumerate(rooms):
        for b in rooms[i + 1:]:
            ox = min(a[0] + a[2], b[0] + b[2]) - max(a[0], b[0])
            oy = min(a[1] + a[3], b[1] + b[3]) - max(a[1], b[1])
            assert not (ox > tol and oy > tol), f'overlap {a} {b}'
    return gross

class Region:
    """A union of axis-aligned rectangles minus others. Gives merged fill rectangles and a clean outline,
    so wall junctions have no seams and every wall corner is one exact vertex."""
    def __init__(self):
        self.adds, self.subs = [], []
    @staticmethod
    def _r(x0, y0, x1, y1):
        return (round(min(x0, x1), 6), round(min(y0, y1), 6), round(max(x0, x1), 6), round(max(y0, y1), 6))
    def add(self, x0, y0, x1, y1): self.adds.append(self._r(x0, y0, x1, y1))
    def sub(self, x0, y0, x1, y1): self.subs.append(self._r(x0, y0, x1, y1))
    def _grid(self):
        xs = sorted({v for r in self.adds + self.subs for v in (r[0], r[2])})
        ys = sorted({v for r in self.adds + self.subs for v in (r[1], r[3])})
        inside = [[False] * (len(xs) - 1) for _ in range(len(ys) - 1)]
        for j in range(len(ys) - 1):
            my = (ys[j] + ys[j + 1]) / 2
            for i in range(len(xs) - 1):
                mx = (xs[i] + xs[i + 1]) / 2
                inside[j][i] = any(r[0] < mx < r[2] and r[1] < my < r[3] for r in self.adds) and \
                    not any(r[0] < mx < r[2] and r[1] < my < r[3] for r in self.subs)
        return xs, ys, inside
    def rects(self):
        if not self.adds: return []
        xs, ys, g = self._grid()
        out = {}
        for j in range(len(ys) - 1):
            i = 0
            while i < len(xs) - 1:
                if g[j][i]:
                    k = i
                    while k + 1 < len(xs) - 1 and g[j][k + 1]: k += 1
                    key = (xs[i], xs[k + 1])
                    if key in out and out[key][-1][3] == ys[j]:
                        out[key][-1][3] = ys[j + 1]
                    else:
                        out.setdefault(key, []).append([xs[i], ys[j], xs[k + 1], ys[j + 1]])
                    i = k + 1
                else:
                    i += 1
        return [r for v in out.values() for r in v]
    def edges(self):
        """Merged outline segments as ((x0, y0), (x1, y1))."""
        if not self.adds: return []
        xs, ys, g = self._grid()
        nx, ny = len(xs) - 1, len(ys) - 1
        at = lambda j, i: 0 <= j < ny and 0 <= i < nx and g[j][i]
        segs = []
        for j in range(ny + 1):
            i = 0
            while i < nx:
                if at(j - 1, i) != at(j, i):
                    a, b = at(j - 1, i), at(j, i)
                    k = i
                    while k + 1 < nx and at(j - 1, k + 1) == a and at(j, k + 1) == b: k += 1
                    segs.append(((xs[i], ys[j]), (xs[k + 1], ys[j])))
                    i = k + 1
                else:
                    i += 1
        for i in range(nx + 1):
            j = 0
            while j < ny:
                if at(j, i - 1) != at(j, i):
                    a, b = at(j, i - 1), at(j, i)
                    k = j
                    while k + 1 < ny and at(k + 1, i - 1) == a and at(k + 1, i) == b: k += 1
                    segs.append(((xs[i], ys[j]), (xs[i], ys[k + 1])))
                    j = k + 1
                else:
                    j += 1
        return segs

# ---------------------------------------------------------------- the sheet
NO_LINE_START = set('、。，．・：；？！）〕］｝〉》」』】ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮー々㎡%,.:;)]}')
NO_LINE_END = set('（〔［｛〈《「『【([{')

class Doc:
    def __init__(self, path, size_mm, title, author='PolyPDF', subject='', font='CAD', font_b='CAD-B', wrap='space', keywords=''):
        self.path, self.w, self.h = str(path), size_mm[0], size_mm[1]
        self.font, self.font_b, self.wrap_mode = font, font_b, wrap
        self.c = canvas.Canvas(self.path, pagesize=(self.w * MM, self.h * MM), invariant=1, pageCompression=1)
        self.c.setTitle(title); self.c.setAuthor(author); self.c.setCreator('PolyPDF'); self.c.setProducer('PolyPDF')
        if subject: self.c.setSubject(subject)
        if keywords: self.c.setKeywords(keywords)
        self.boxes, self.expects, self.warnings = [], {}, []
        self.complex = None

    def use_script(self, script, font, font_b, rtl=False):
        """Draw this script with a shaped font and everything else (digits, Latin) with the sheet's base font.
        rtl=True lays the runs of one string out from right to left. Each shaped run carries /ActualText, so
        copying and searching return the characters as typed, not the glyph forms."""
        self.complex = dict(ranges=COMPLEX_RANGES[script], font=font, font_b=font_b, rtl=rtl, cache={})

    def _is_complex(self, ch):
        o = ord(ch)
        return ch in '\u200c\u200d' or any(a <= o <= b for a, b in self.complex['ranges'])
    def _segments(self, s, bold):
        """Split one string into runs in logical order: [(text, font, shaped)]. Spaces and punctuation stay with
        the run around them; between a complex run and a Latin run they go with the complex run when it is rtl,
        and with the previous run otherwise, provided the font has the glyph."""
        cx = self.complex
        cfont = cx['font_b'] if bold else cx['font']
        base = self.font_b if bold else self.font
        kinds = []
        for ch in s:
            if self._is_complex(ch): kinds.append('C')
            elif ch.isalnum() or ch in '²³%±°': kinds.append('L')
            else: kinds.append('N')
        n = len(s)
        for i, k in enumerate(kinds):
            if k != 'N': continue
            prev = next((kinds[j] for j in range(i - 1, -1, -1) if kinds[j] != 'N'), None)
            nxt = next((kinds[j] for j in range(i + 1, n) if kinds[j] != 'N'), None)
            if prev == nxt and prev: kinds[i] = prev
            elif prev is None and nxt is None: kinds[i] = 'L'
            elif cx['rtl']: kinds[i] = 'C'
            else: kinds[i] = prev or nxt
        cmap = pdfmetrics.getFont(cfont).face.charToGlyph
        for i, ch in enumerate(s):
            if kinds[i] == 'C' and not self._is_complex(ch) and ord(ch) not in cmap: kinds[i] = 'L'
        runs = []
        for ch, k in zip(s, kinds):
            if runs and runs[-1][1] == k: runs[-1][0] += ch
            else: runs.append([ch, k])
        return [(t, cfont if k == 'C' else base, k == 'C') for t, k in runs]
    def _seg_width(self, t, font, shaped, size):
        if not shaped: return pdfmetrics.stringWidth(t, font, size)
        key = (t, font, size); cache = self.complex['cache']
        if key not in cache:
            self.c.setFont(font, size)
            cache[key] = self.c.shapedText(t)[1]
        return cache[key]

    # -- drawing primitives (sheet mm)
    def line(self, x0, y0, x1, y1, lw=0.25, col=INK, dash=None, cap=0):
        c = self.c; c.saveState(); c.setStrokeColor(color(col)); c.setLineWidth(lw * MM); c.setLineCap(cap)
        if dash: c.setDash([v * MM for v in dash])
        c.line(x0 * MM, y0 * MM, x1 * MM, y1 * MM); c.restoreState()
    def poly(self, pts, close=True, lw=0.25, col=INK, fill=None, dash=None, join=0):
        c = self.c; c.saveState(); c.setLineJoin(join)
        p = c.beginPath(); p.moveTo(pts[0][0] * MM, pts[0][1] * MM)
        for x, y in pts[1:]: p.lineTo(x * MM, y * MM)
        if close: p.close()
        if lw: c.setStrokeColor(color(col)); c.setLineWidth(lw * MM)
        if fill is not None: c.setFillColor(color(fill))
        if dash: c.setDash([v * MM for v in dash])
        c.drawPath(p, stroke=int(bool(lw)), fill=int(fill is not None)); c.restoreState()
    def rect(self, x, y, w, h, lw=0.25, col=INK, fill=None, dash=None):
        self.poly([(x, y), (x + w, y), (x + w, y + h), (x, y + h)], True, lw, col, fill, dash)
    def circle(self, x, y, r, lw=0.25, col=INK, fill=None, dash=None):
        c = self.c; c.saveState()
        if lw: c.setStrokeColor(color(col)); c.setLineWidth(lw * MM)
        if fill is not None: c.setFillColor(color(fill))
        if dash: c.setDash([v * MM for v in dash])
        c.circle(x * MM, y * MM, r * MM, stroke=int(bool(lw)), fill=int(fill is not None)); c.restoreState()
    def arc(self, cx, cy, r, start, extent, lw=0.13, col=INK, dash=None):
        c = self.c; c.saveState(); c.setStrokeColor(color(col)); c.setLineWidth(lw * MM)
        if dash: c.setDash([v * MM for v in dash])
        c.arc((cx - r) * MM, (cy - r) * MM, (cx + r) * MM, (cy + r) * MM, start, extent); c.restoreState()
    def ellipse(self, x0, y0, x1, y1, lw=0.13, col=INK, fill=None):
        c = self.c; c.saveState(); c.setStrokeColor(color(col)); c.setLineWidth(lw * MM)
        if fill is not None: c.setFillColor(color(fill))
        c.ellipse(x0 * MM, y0 * MM, x1 * MM, y1 * MM, stroke=1, fill=int(fill is not None)); c.restoreState()
    def hatch(self, pts, angle=45, spacing=2.0, lw=0.09, col=GREY):
        """Parallel lines clipped to a polygon."""
        c = self.c; c.saveState(); p = c.beginPath(); p.moveTo(pts[0][0] * MM, pts[0][1] * MM)
        for x, y in pts[1:]: p.lineTo(x * MM, y * MM)
        p.close(); c.clipPath(p, stroke=0, fill=0)
        xs, ys = [q[0] for q in pts], [q[1] for q in pts]
        cx, cy, rad = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, math.hypot(max(xs) - min(xs), max(ys) - min(ys)) / 2 + spacing
        a = math.radians(angle); dx, dy = math.cos(a), math.sin(a); n = int(rad / spacing) + 1
        c.setStrokeColor(color(col)); c.setLineWidth(lw * MM)
        for i in range(-n, n + 1):
            ox, oy = cx - dy * i * spacing, cy + dx * i * spacing
            c.line((ox - dx * rad) * MM, (oy - dy * rad) * MM, (ox + dx * rad) * MM, (oy + dy * rad) * MM)
        c.restoreState()

    # -- text
    @staticmethod
    def _runs(s):
        return [(s, False)] if isinstance(s, str) else list(s)
    def width(self, s, h=2.5, bold=False):
        f = self.font_b if bold else self.font
        size = h * PT_PER_H
        if self.complex and isinstance(s, str):
            return sum(self._seg_width(t, ft, sh, size) for t, ft, sh in self._segments(s, bold)) / MM
        return sum(pdfmetrics.stringWidth(t, f, size * (0.68 if up else 1)) for t, up in self._runs(s)) / MM
    def text(self, x, y, s, h=2.5, bold=False, col=INK, align='left', angle=0, track=True):
        """s is a string or runs [(text, raised)]. Returns the width in mm. (x, y) is the baseline."""
        runs = self._runs(s)
        w = self.width(s, h, bold)
        off = {'left': 0, 'center': -w / 2, 'right': -w}[align]
        f = self.font_b if bold else self.font
        size = h * PT_PER_H
        c = self.c; c.saveState(); c.setFillColor(color(col)); c.translate(x * MM, y * MM); c.rotate(angle)
        cur = off * MM
        if self.complex and isinstance(s, str):
            segs = self._segments(s, bold)
            widths = [self._seg_width(t, ft, sh, size) for t, ft, sh in segs]
            # Positions run left to right on the page; rtl strings put the first logical run on the right.
            xs, pos = {}, cur
            for i in (reversed(range(len(segs))) if self.complex['rtl'] else range(len(segs))):
                xs[i] = pos; pos += widths[i]
            for i, (t, ft, sh) in enumerate(segs):      # the stream keeps logical order
                c.setFont(ft, size)
                if sh:
                    c._code.append('/Span <</ActualText <FEFF' + t.encode('utf-16-be').hex().upper() + '>>> BDC')
                c.drawString(xs[i], 0, t)
                if sh: c._code.append('EMC')
        else:
            for t, up in runs:
                sz = size * (0.68 if up else 1)
                c.setFont(f, sz)
                c.drawString(cur, (h * 0.42 * MM) if up else 0, t)
                cur += pdfmetrics.stringWidth(t, f, sz)
        c.restoreState()
        if track:
            a = math.radians(angle); ca, sa = math.cos(a), math.sin(a)
            corners = [(off, -h * 0.05), (off + w, -h * 0.05), (off + w, h * 1.02), (off, h * 1.02)]
            px = [x + u * ca - v * sa for u, v in corners]; py = [y + u * sa + v * ca for u, v in corners]
            label = ''.join(t for t, _ in runs)
            self.boxes.append((min(px), min(py), max(px), max(py), label))
        return w
    def para(self, x, y_top, width, s, h=2.2, bold=False, col=INK, lead=1.45, mode=None, align='left'):
        """Wrapped paragraph; y_top is the top of the first line. Returns the y below the last line."""
        y = y_top - h
        for line in self.wrap(s, width, h, bold, mode):
            tx = x + (width if align == 'right' else width / 2 if align == 'center' else 0)
            self.text(tx, y, line, h, bold, col, align)
            y -= h * lead
        return y + h * lead - h * 0.45
    def wrap(self, s, width, h=2.2, bold=False, mode=None):
        mode = mode or self.wrap_mode
        lines = []
        for chunk in str(s).split('\n'):
            if mode == 'cjk':
                cur = ''
                for ch in chunk:
                    if cur and self.width(cur + ch, h, bold) > width:
                        if ch in NO_LINE_START:
                            cur, ch = cur[:-1], cur[-1] + ch
                        elif cur[-1] in NO_LINE_END:
                            cur, ch = cur[:-1], cur[-1] + ch
                        lines.append(cur); cur = ch
                    else:
                        cur += ch
                lines.append(cur)
            else:
                cur = ''
                for word in chunk.split(' '):
                    trial = (cur + ' ' + word) if cur else word
                    if cur and self.width(trial, h, bold) > width:
                        lines.append(cur); cur = word
                    else:
                        cur = trial
                lines.append(cur)
        return lines

    # -- sheet furniture
    def frame(self, x0, y0, x1, y1, lw=0.5, col=INK):
        self.rect(x0, y0, x1 - x0, y1 - y0, lw, col)
    def table(self, x, y_top, widths, rows, h=2.0, row_h=None, head=1, aligns=None, bold_rows=(), lw=0.13, head_fill=None, rtl=False, pad=1.1, fills=None):
        """rows: lists of cells (string, runs, or None to span from the previous cell). Multi-line cells use \\n.
        Returns the y of the bottom edge."""
        widths = list(widths); aligns = list(aligns or ['left'] * len(widths))
        if rtl:
            widths = widths[::-1]; aligns = aligns[::-1]; rows = [list(r)[::-1] for r in rows]
        tw = sum(widths); y = y_top; row_h = row_h or h * 2.2
        self.line(x, y, x + tw, y, lw * 2)
        for ri, row in enumerate(rows):
            lines = [len(str(c).split('\n')) if isinstance(c, str) else 1 for c in row]
            rh = row_h + (max(lines) - 1) * h * 1.3
            if ri < head and head_fill is not None: self.rect(x, y - rh, tw, rh, 0, fill=head_fill)
            if fills and ri in fills: self.rect(x, y - rh, tw, rh, 0, fill=fills[ri])
            cx = x; bold = ri < head or ri in bold_rows
            for ci, cell in enumerate(row):
                if cell is None:
                    cx += widths[ci]; continue
                cw = widths[ci]; k = ci + 1
                while k < len(row) and row[k] is None:
                    cw += widths[k]; k += 1
                al = aligns[ci]
                tx = cx + (pad if al == 'left' else cw - pad if al == 'right' else cw / 2)
                parts = str(cell).split('\n') if isinstance(cell, str) else [cell]
                total = h + (len(parts) - 1) * h * 1.3
                ty = y - (rh - total) / 2 - h
                for part in parts:
                    self.text(tx, ty, part, h, bold, align=al); ty -= h * 1.3
                cx += widths[ci]
            y -= rh
            self.line(x, y, x + tw, y, lw * (2 if ri + 1 == head or ri + 1 == len(rows) else 1))
        cx = x
        for w_ in [0] + widths:
            cx += w_
            self.line(cx, y_top, cx, y, lw)
        return y
    def field(self, x, y, w, h_, label, value='', lh=1.6, vh=2.5, bold=False, align='left', lw=0.18, rtl=False):
        """One title-block box: small label at the top, value below it."""
        self.rect(x, y, w, h_, lw)
        ax = x + 1.2 if not rtl else x + w - 1.2
        al = 'left' if not rtl else 'right'
        self.text(ax, y + h_ - lh - 0.8, label, lh, col=GREY, align=al)
        if value:
            vx = {'left': x + 1.2, 'center': x + w / 2, 'right': x + w - 1.2}[align if not rtl else 'right']
            vs = self._runs(value) if not isinstance(value, str) else None
            if vs:
                self.text(vx, y + 1.4, vs, vh, bold, align=align if not rtl else 'right')
            else:
                parts = value.split('\n')
                ty = y + 1.4 + (len(parts) - 1) * vh * 1.3
                for p in parts:
                    self.text(vx, ty, p, vh, bold, align=align if not rtl else 'right'); ty -= vh * 1.3
    def scale_bar(self, x, y, length_m, k, marks, labels, h=2.0, bar_h=1.6, unit=None, lw=0.18):
        """Exact-length bar. k = sheet mm per metre. marks are metre positions; cells alternate black and white."""
        for i in range(len(marks) - 1):
            a, b = marks[i] * k, marks[i + 1] * k
            self.rect(x + a, y, b - a, bar_h, lw, fill=(INK if i % 2 == 0 else WHITE))
        # One stroked line over the whole length, so both ends can be snapped to however small the first cell is.
        self.line(x, y, x + length_m * k, y, lw)
        for m, t in zip(marks, labels):
            self.text(x + m * k, y - h - 1, t, h, align='center')
        if unit: self.text(x + length_m * k + 2, y + 0.1, unit, h)
    def north(self, x, y, size=9, style='wedge', label='N', angle=0, h=3.0):
        """style: wedge (long thin black wedge), circle (circle with a filled pointer), arrow (N over an arrow)."""
        a = math.radians(angle)
        def rot(u, v): return (x + u * math.cos(a) - v * math.sin(a), y + u * math.sin(a) + v * math.cos(a))
        if style == 'circle':
            self.circle(x, y, size * 0.5, 0.18)
            self.poly([rot(0, size * 0.72), rot(size * 0.2, -size * 0.3), rot(0, -size * 0.12), rot(-size * 0.2, -size * 0.3)], True, 0.18, fill=INK)
            self.line(*rot(-size * 0.62, 0), *rot(size * 0.62, 0), 0.09)
            self.line(*rot(0, -size * 0.62), *rot(0, size * 0.72), 0.09)
            tx, ty = rot(0, size * 0.72 + 1.2)
        elif style == 'arrow':
            self.line(*rot(0, -size * 0.55), *rot(0, size * 0.45), 0.25)
            self.poly([rot(0, size * 0.65), rot(size * 0.13, size * 0.25), rot(-size * 0.13, size * 0.25)], True, 0.13, fill=INK)
            tx, ty = rot(0, size * 0.65 + 1.2)
        else:
            self.poly([rot(0, size), rot(size * 0.11, -size * 0.6), rot(-size * 0.11, -size * 0.6)], True, 0.13, fill=INK)
            self.line(*rot(-size * 0.32, 0), *rot(size * 0.32, 0), 0.18)
            tx, ty = rot(0, size + 1.2)
        self.text(tx, ty, label, h, True, align='center')
    def stamp(self, x, y, s, h=2.6, pad=1.6, col=INK, lw=0.35, align='left'):
        """Boxed line of text. (x, y) is the box's lower-left, or lower-right when align='right'."""
        w = self.width(s, h, True)
        bx = x if align == 'left' else x - w - 2 * pad
        self.rect(bx, y, w + 2 * pad, h + 2 * pad, lw, col)
        self.text(bx + pad, y + pad, s, h, True, col)
        return w + 2 * pad

    # -- measuring facts for the native run
    def expect(self, name, **facts):
        """Record a value the plan expects when measured: pts in sheet mm plus metres or square metres."""
        self.expects[name] = facts

    def save(self, report=True):
        self.c.showPage(); self.c.save()
        collisions = []
        b = self.boxes
        for i in range(len(b)):
            for j in range(i + 1, len(b)):
                ox = min(b[i][2], b[j][2]) - max(b[i][0], b[j][0])
                oy = min(b[i][3], b[j][3]) - max(b[i][1], b[j][1])
                if ox > 0.25 and oy > 0.25:
                    collisions.append(f'{b[i][4]!r} x {b[j][4]!r} at ({b[i][0]:.0f},{b[i][1]:.0f})')
        off = [f'{x[4]!r} at ({x[0]:.0f},{x[1]:.0f})' for x in b if x[0] < 0 or x[1] < 0 or x[2] > self.w or x[3] > self.h]
        facts = {'sheet_mm': [self.w, self.h], 'pt_per_mm': MM, 'expects': self.expects, 'text_collisions': collisions, 'text_off_sheet': off}
        Path(self.path).with_suffix('.expect.json').write_text(json.dumps(facts, ensure_ascii=False, indent=1), encoding='utf-8')
        if report:
            print(f'{self.path}: {len(b)} text items, {len(collisions)} collisions, {len(off)} off sheet')
            for x in collisions[:40]: print('  collide', x)
            for x in off[:10]: print('  off', x)
        return self.path

# ---------------------------------------------------------------- a building and a view of it
class Building:
    """Walls and openings in metres. Doors and windows cut gaps out of the walls.

    axis='h': the wall runs along x; wall=(y0, y1) is its thickness range and at..at+width its gap along x.
    axis='v': the wall runs along y; wall=(x0, x1) is its thickness range and at..at+width its gap along y.
    swing=+1 opens toward +y (axis h) or +x (axis v); swing=-1 the other way.
    hinge='a' hinges at the low end of the gap, 'b' at the high end, 'both' is a two-leaf door.
    """
    def __init__(self):
        self.walls, self.openings = [], []
    def wall(self, x0, y0, x1, y1, kind='int'):
        self.walls.append((x0, y0, x1, y1, kind))
    def door(self, axis, at, width, wall, hinge='a', swing=1, kind='swing'):
        self.openings.append(dict(t='door', axis=axis, at=at, w=width, wall=wall, hinge=hinge, swing=swing, kind=kind))
    def window(self, axis, at, width, wall, kind='plain', glass=2):
        self.openings.append(dict(t='window', axis=axis, at=at, w=width, wall=wall, kind=kind, glass=glass))
    def gap(self, axis, at, width, wall):
        self.openings.append(dict(t='gap', axis=axis, at=at, w=width, wall=wall))
    def region(self, kinds=None):
        r = Region()
        for x0, y0, x1, y1, kind in self.walls:
            if kinds is None or kind in kinds: r.add(x0, y0, x1, y1)
        for o in self.openings:
            a, b = o['at'], o['at'] + o['w']; w0, w1 = o['wall']
            if o['axis'] == 'h': r.sub(a, w0, b, w1)
            else: r.sub(w0, a, w1, b)
        return r

class View:
    def __init__(self, doc, ox, oy, scale=100):
        self.d, self.ox, self.oy, self.scale = doc, ox, oy, scale
        self.k = 1000 / scale   # sheet mm per metre
    def X(self, x): return self.ox + x * self.k
    def Y(self, y): return self.oy + y * self.k
    def P(self, x, y): return (self.X(x), self.Y(y))

    # -- walls and openings
    def draw(self, b, fills=None, lw=0.5, col=INK, doors=True, windows=True, door_lw=0.25, arc_lw=0.13):
        """fills: {kind: colour} poche per wall kind; None leaves walls hollow (double line only)."""
        d = self.d
        if fills:
            kinds = {w[4] for w in b.walls}
            for kind in sorted(kinds):
                f = fills.get(kind)
                if f is None: continue
                for x0, y0, x1, y1 in b.region({kind}).rects():
                    d.rect(self.X(x0), self.Y(y0), (x1 - x0) * self.k, (y1 - y0) * self.k, 0, fill=f)
        c = d.c; c.saveState(); c.setStrokeColor(color(col)); c.setLineWidth(lw * MM); c.setLineCap(2)
        for (x0, y0), (x1, y1) in b.region().edges():
            c.line(self.X(x0) * MM, self.Y(y0) * MM, self.X(x1) * MM, self.Y(y1) * MM)
        c.restoreState()
        for o in b.openings:
            if o['t'] == 'door' and doors: self._door(o, door_lw, arc_lw, col)
            elif o['t'] == 'window' and windows: self._window(o, col)
            elif o['t'] == 'door' and not doors: pass
    def _seg(self, axis, u0, v0, u1, v1, lw, col=INK, dash=None):
        if axis == 'h': self.d.line(self.X(u0), self.Y(v0), self.X(u1), self.Y(v1), lw, col, dash)
        else: self.d.line(self.X(v0), self.Y(u0), self.X(v1), self.Y(u1), lw, col, dash)
    def _arc(self, axis, hu, hv, r, su, sv, lw, col=INK):
        """Quarter circle centred on hinge (hu, hv) from the leaf tip to the far jamb. su: +1 if the jamb is on the high side."""
        cx, cy = (self.X(hu), self.Y(hv)) if axis == 'h' else (self.X(hv), self.Y(hu))
        R = r * self.k
        if axis == 'h':
            jamb_angle = 0 if su > 0 else 180
            leaf_angle = 90 if sv > 0 else 270
        else:
            jamb_angle = 90 if su > 0 else 270
            leaf_angle = 0 if sv > 0 else 180
        ext = (leaf_angle - jamb_angle + 540) % 360 - 180
        self.d.arc(cx, cy, R, jamb_angle, ext, lw, col)
    def _door(self, o, lw, arc_lw, col):
        ax, a, w, (w0, w1), s = o['axis'], o['at'], o['w'], o['wall'], o['swing']
        face = w1 if s > 0 else w0
        if o['kind'] == 'swing':
            leaves = [(a, 1, w)] if o['hinge'] == 'a' else [(a + w, -1, w)] if o['hinge'] == 'b' else [(a, 1, w / 2), (a + w, -1, w / 2)]
            for hu, su, r in leaves:
                self._seg(ax, hu, face, hu, face + s * r, lw, col)
                self._arc(ax, hu, face, r, su, s, arc_lw, col)
        elif o['kind'] == 'slide':       # one leaf running past the opening, drawn inside the wall
            mid = (w0 + w1) / 2
            self._seg(ax, a, mid, a + w, mid, lw, col)
            self._seg(ax, a, w0, a, w1, 0.13, col); self._seg(ax, a + w, w0, a + w, w1, 0.13, col)
        elif o['kind'] == 'bislide':     # two leaves on two tracks
            t = (w1 - w0) / 3
            self._seg(ax, a, w0 + t, a + w * 0.52, w0 + t, lw, col)
            self._seg(ax, a + w * 0.48, w1 - t, a + w, w1 - t, lw, col)
            self._seg(ax, a, w0, a, w1, 0.13, col); self._seg(ax, a + w, w0, a + w, w1, 0.13, col)
        elif o['kind'] == 'grille':      # collapsible gate: zigzag across the opening
            mid = (w0 + w1) / 2; n = max(4, int(w * 6)); amp = (w1 - w0) * 0.3
            for i in range(n):
                self._seg(ax, a + w * i / n, mid + amp * (1 if i % 2 else -1), a + w * (i + 1) / n, mid + amp * (-1 if i % 2 else 1), 0.13, col)
    def _window(self, o, col):
        ax, a, w, (w0, w1) = o['axis'], o['at'], o['w'], o['wall']
        self._seg(ax, a, w0, a + w, w0, 0.18, col); self._seg(ax, a, w1, a + w, w1, 0.18, col)
        self._seg(ax, a, w0, a, w1, 0.18, col); self._seg(ax, a + w, w0, a + w, w1, 0.18, col)
        if o['kind'] == 'slide':
            t = (w1 - w0) / 3
            self._seg(ax, a, w0 + t, a + w * 0.52, w0 + t, 0.18, col)
            self._seg(ax, a + w * 0.48, w1 - t, a + w, w1 - t, 0.18, col)
            self._seg(ax, a + w * 0.5, w0 + t, a + w * 0.5, w1 - t, 0.13, col)
        else:
            n = o.get('glass', 2)
            for i in range(1, n + 1):
                v = w0 + (w1 - w0) * i / (n + 1)
                self._seg(ax, a, v, a + w, v, 0.13, col)

    # -- dimension chains
    def chain(self, side, stops, off, base, fmt, h=2.0, term='tick', labels=None, col=INK, ext_gap=5.0, ext_over=1.2, ext_from=None, text_gap=0.7, lw=0.13, term_lw=0.3, label_lead=1.15):
        """side: 'b', 't', 'l' or 'r'. stops: metre positions along the side. off: mm from base to the dimension line.
        base: the plan coordinate the chain measures from (y for b/t, x for l/r). labels override fmt per span.
        The dimension line ends exactly at the first and last stop, so it can be snapped to.
        ext_gap keeps extension lines 5 mm clear of the wall: in the app, a line end 1 mm above a corner took the
        snap from the corner itself and put a whole wall line 0,10 m out."""
        d = self.d; horiz = side in 'bt'; sign = -1 if side in 'bl' else 1
        if horiz:
            ly = self.Y(base) + sign * off
            d.line(self.X(stops[0]), ly, self.X(stops[-1]), ly, lw, col)
        else:
            lx = self.X(base) + sign * off
            d.line(lx, self.Y(stops[0]), lx, self.Y(stops[-1]), lw, col)
        for s in stops:
            start = (self.Y(base) if horiz else self.X(base)) + sign * (ext_gap if ext_from is None else ext_from)
            end = (ly if horiz else lx) + sign * ext_over
            if horiz: d.line(self.X(s), start, self.X(s), end, lw, col)
            else: d.line(start, self.Y(s), end, self.Y(s), lw, col)
            px, py = (self.X(s), ly) if horiz else (lx, self.Y(s))
            if term == 'tick':
                t = 1.0
                d.line(px - t, py - t, px + t, py + t, term_lw, col)
            elif term == 'dot':
                d.circle(px, py, 0.42, 0, fill=col)
        last_hi = None; row = 0
        for i in range(len(stops) - 1):
            span = stops[i + 1] - stops[i]
            lab = labels[i] if labels else fmt(span)
            if lab is None or lab == '': continue
            w = d.width(lab, h)
            mid = (stops[i] + stops[i + 1]) / 2
            c = self.X(mid) if horiz else self.Y(mid)
            row = 0
            if last_hi is not None and c - w / 2 < last_hi[0] + 0.3 and last_hi[1] == 0:
                row = 1
            lift = text_gap + row * h * label_lead
            if horiz:
                d.text(c, ly + lift, lab, h, col=col, align='center')
            else:
                d.text(lx - lift, c, lab, h, col=col, align='center', angle=90)
            last_hi = (c + w / 2, row)
            if term == 'arrow':
                A = 1.6
                for (u, dirn) in ((stops[i], 1), (stops[i + 1], -1)):
                    if horiz:
                        d.poly([(self.X(u), ly), (self.X(u) + dirn * A, ly + 0.35), (self.X(u) + dirn * A, ly - 0.35)], True, 0, fill=col)
                    else:
                        d.poly([(lx, self.Y(u)), (lx + 0.35, self.Y(u) + dirn * A), (lx - 0.35, self.Y(u) + dirn * A)], True, 0, fill=col)

    # -- axis bubbles
    def axis(self, direction, at, label, a0, a1, ends='both', r=3.5, h=2.6, lw=0.09, dash=(6, 1.2, 1, 1.2), col=INK):
        """direction 'x': a vertical line at x=at from y=a0 to y=a1 (metres); bubbles at the chosen ends. 'y' is horizontal."""
        d = self.d
        if direction == 'x':
            p0, p1 = (self.X(at), self.Y(a0)), (self.X(at), self.Y(a1))
            d.line(*p0, *p1, lw, col, dash)
            cs = []
            if ends in ('both', 'low'): cs.append((p0[0], p0[1] - r))
            if ends in ('both', 'high'): cs.append((p1[0], p1[1] + r))
        else:
            p0, p1 = (self.X(a0), self.Y(at)), (self.X(a1), self.Y(at))
            d.line(*p0, *p1, lw, col, dash)
            cs = []
            if ends in ('both', 'low'): cs.append((p0[0] - r, p0[1]))
            if ends in ('both', 'high'): cs.append((p1[0] + r, p1[1]))
        for cx, cy in cs:
            d.circle(cx, cy, r, 0.18, col, fill=WHITE)
            d.text(cx, cy - h * 0.45, label, h, align='center', col=col)

    # -- room labels and fills
    def fill(self, x0, y0, x1, y1, col=PALE):
        self.d.rect(self.X(x0), self.Y(y0), (x1 - x0) * self.k, (y1 - y0) * self.k, 0, fill=col)
    def fill_poly(self, pts, col=PALE):
        self.d.poly([self.P(*p) for p in pts], True, 0, fill=col)
    def hatch(self, pts, angle=45, spacing=2.0, lw=0.09, col=GREY):
        self.d.hatch([self.P(*p) for p in pts], angle, spacing, lw, col)
    def tag(self, x, y, lines, lead=1.4, align='center', col=INK):
        """lines: [(text or runs, h, bold)]. (x, y) in metres is the centre of the whole label."""
        d = self.d
        total = sum(l[1] * lead for l in lines) - lines[-1][1] * (lead - 1)
        cy = self.Y(y) + total / 2
        for s, h, bold in lines:
            cy -= h
            d.text(self.X(x), cy, s, h, bold, col, align)
            cy -= h * (lead - 1)
    def rectm(self, x0, y0, x1, y1, lw=0.13, col=GREY, fill=None, dash=None):
        self.d.rect(self.X(x0), self.Y(y0), (x1 - x0) * self.k, (y1 - y0) * self.k, lw, col, fill, dash)
    def linem(self, x0, y0, x1, y1, lw=0.13, col=GREY, dash=None):
        self.d.line(self.X(x0), self.Y(y0), self.X(x1), self.Y(y1), lw, col, dash)
    def circlem(self, x, y, r, lw=0.13, col=GREY, dash=None, fill=None):
        self.d.circle(self.X(x), self.Y(y), r * self.k, lw, col, fill, dash)
    def column(self, x, y, size=0.4, fill=INK, cross=False, lw=0.18):
        """Square column centred on (x, y). cross=True draws the timber-post box with an X."""
        s = size / 2
        self.rectm(x - s, y - s, x + s, y + s, lw, INK, None if cross else fill)
        if cross:
            self.linem(x - s, y - s, x + s, y + s, 0.09, INK); self.linem(x - s, y + s, x + s, y - s, 0.09, INK)
    def size_label(self, x, y, top, bottom, h=1.8, extra=None, col=INK, angle=0):
        """Opening label: width over height with a short rule, as drawn on German and French plans."""
        d = self.d; px, py = self.X(x), self.Y(y)
        w = max(d.width(top, h), d.width(bottom, h))
        if angle == 0:
            d.text(px, py + 0.5, top, h, col=col, align='center')
            d.line(px - w / 2, py, px + w / 2, py, 0.09, col)
            d.text(px, py - h - 0.4, bottom, h, col=col, align='center')
            if extra: d.text(px, py - 2 * h - 1.2, extra, h * 0.9, col=col, align='center')
        else:
            d.text(px - 0.5, py, top, h, col=col, align='center', angle=90)
            d.line(px, py - w / 2, px, py + w / 2, 0.09, col)
            d.text(px + h + 0.4, py, bottom, h, col=col, align='center', angle=90)
            if extra: d.text(px + 2 * h + 1.2, py, extra, h * 0.9, col=col, align='center', angle=90)
    def level(self, x, y, s, h=1.9, style='tri', filled=False, col=INK):
        """style: tri (triangle under the text), circle (text in a thin circle), text (plain)."""
        d = self.d; px, py = self.X(x), self.Y(y)
        if style == 'tri':
            d.poly([(px, py), (px - 0.9, py + 1.5), (px + 0.9, py + 1.5)], True, 0.13, col, fill=(col if filled else None))
            d.line(px - 1.8, py + 1.5, px + 1.8 + d.width(s, h), py + 1.5, 0.09, col)
            d.text(px + 1.2, py + 2.0, s, h, col=col)
        elif style == 'circle':
            w = d.width(s, h)
            d.ellipse(px - w / 2 - 1.1, py - h * 0.5 - 0.5, px + w / 2 + 1.1, py + h * 0.5 + 0.5, 0.13, col)
            d.text(px, py - h * 0.42, s, h, col=col, align='center')
        else:
            d.text(px, py, s, h, col=col, align='center')
    def ramp(self, x0, y0, x1, y1, direction, label=None, h=1.9, lw=0.18, col=INK):
        """A rectangle with a rising arrow. direction: 'e', 'w', 'n', 's' (the way it rises)."""
        self.rectm(x0, y0, x1, y1, lw, col)
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        d = self.d
        if direction in 'ew':
            a, b = (x0, x1) if direction == 'e' else (x1, x0)
            self.linem(a, cy, b, cy, 0.13, col)
            tip = self.P(b, cy); s = 1 if direction == 'e' else -1
            d.poly([tip, (tip[0] - s * 1.8, tip[1] + 0.5), (tip[0] - s * 1.8, tip[1] - 0.5)], True, 0, fill=col)
        else:
            a, b = (y0, y1) if direction == 'n' else (y1, y0)
            self.linem(cx, a, cx, b, 0.13, col)
            tip = self.P(cx, b); s = 1 if direction == 'n' else -1
            d.poly([tip, (tip[0] + 0.5, tip[1] - s * 1.8), (tip[0] - 0.5, tip[1] - s * 1.8)], True, 0, fill=col)
        if label:
            d.text(self.X(cx), self.Y(cy) + 0.7, label, h, col=col, align='center')
    def steps(self, x0, y0, x1, y1, n, direction, lw=0.13, col=INK):
        """n treads in a rectangle; lines run across the direction of travel."""
        self.rectm(x0, y0, x1, y1, lw, col)
        for i in range(1, n):
            if direction in 'ew':
                x = x0 + (x1 - x0) * i / n; self.linem(x, y0, x, y1, lw, col)
            else:
                y = y0 + (y1 - y0) * i / n; self.linem(x0, y, x1, y, lw, col)
    # -- fixtures, in plan metres; rot is the way the user faces: 'n', 's', 'e', 'w' (back against the opposite wall)
    def wc(self, x, y, rot='s', col=GREY, lw=0.13):
        """Pan with its cistern at (x, y) on the wall."""
        dirs = {'n': (0, 1), 's': (0, -1), 'e': (1, 0), 'w': (-1, 0)}
        ux, uy = dirs[rot]; vx, vy = -uy, ux
        def p(u, v): return (x + ux * u + vx * v, y + uy * u + vy * v)
        a, b = p(0, -0.2), p(0.16, 0.2)
        self.rectm(min(a[0], b[0]), min(a[1], b[1]), max(a[0], b[0]), max(a[1], b[1]), lw, col)
        a, b = p(0.16, -0.18), p(0.62, 0.18)
        self.d.ellipse(self.X(min(a[0], b[0])), self.Y(min(a[1], b[1])), self.X(max(a[0], b[0])), self.Y(max(a[1], b[1])), lw, col)
    def basin(self, x, y, rot='s', col=GREY, lw=0.13, w=0.5, depth=0.4):
        dirs = {'n': (0, 1), 's': (0, -1), 'e': (1, 0), 'w': (-1, 0)}
        ux, uy = dirs[rot]; vx, vy = -uy, ux
        def p(u, v): return (x + ux * u + vx * v, y + uy * u + vy * v)
        a, b = p(0, -w / 2), p(depth, w / 2)
        self.rectm(min(a[0], b[0]), min(a[1], b[1]), max(a[0], b[0]), max(a[1], b[1]), lw, col)
        a, b = p(depth * 0.15, -w * 0.36), p(depth * 0.9, w * 0.36)
        self.d.ellipse(self.X(min(a[0], b[0])), self.Y(min(a[1], b[1])), self.X(max(a[0], b[0])), self.Y(max(a[1], b[1])), lw, col)
    def table_chairs(self, x, y, w, d, chairs_x=0, chairs_y=0, col=LIGHT, lw=0.09, cs=0.38):
        """A table with chairs along its long sides (chairs_x per long side when the table runs along x)."""
        self.rectm(x, y, x + w, y + d, lw, col)
        for i in range(chairs_x):
            cx = x + w * (i + 0.5) / chairs_x - cs / 2
            self.rectm(cx, y - cs - 0.06, cx + cs, y - 0.06, lw, col)
            self.rectm(cx, y + d + 0.06, cx + cs, y + d + 0.06 + cs, lw, col)
        for i in range(chairs_y):
            cy = y + d * (i + 0.5) / chairs_y - cs / 2
            self.rectm(x - cs - 0.06, cy, x - 0.06, cy + cs, lw, col)
            self.rectm(x + w + 0.06, cy, x + w + 0.06 + cs, cy + cs, lw, col)
