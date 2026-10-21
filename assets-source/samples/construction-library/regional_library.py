#!/usr/bin/env python3
"""Generate regional, physically scaled construction demonstrations from metric geometry.

The original US library remains unchanged. These are owned fictional plans, never
translations painted over an existing PDF. Each locale supplies all displayed prose.
"""
from __future__ import annotations

import argparse
from contextlib import contextmanager
import csv
import hashlib
import html
import json
import math
from pathlib import Path
import subprocess
import zipfile

from PIL import Image, ImageEnhance, ImageFilter
from pypdf import PdfReader, PdfWriter
from pypdf.annotations import Text
from pypdf.generic import ArrayObject, DictionaryObject, NameObject, TextStringObject
import reportlab
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[3]
W, H = 841 * 72 / 25.4, 594 * 72 / 25.4  # ISO A1 landscape
INK, GRAY, LIGHT = "#17252c", "#647079", "#e8edef"
BLUE, GOLD, RED = "#36748a", "#a98035", "#aa4438"
MM = 72 / 25.4
SOURCE_FILES = [
    "01-Civil-Site-and-Grading.pdf", "02-Architectural-Revision-A.pdf",
    "03-Architectural-Revision-B.pdf", "04-Structural-Foundation-and-Framing.pdf",
    "05-Mechanical-HVAC.pdf", "06-Electrical-Lighting-and-Power.pdf",
    "07-Plumbing-Water-and-Drainage.pdf", "08-Fire-Protection-and-Life-Safety.pdf",
    "09-Landscape-and-External-Works.pdf", "10-Interiors-Finishes-and-Millwork.pdf",
    "11-Coordination-and-Review.pdf", "12-Scanned-Legacy-Drawings.pdf",
]
ROOMS = [
    ("101", 0, 9, 6, 6), ("102", 6, 9, 6, 6), ("103", 12, 9, 6, 6), ("104", 18, 9, 6, 6),
    ("105", 0, 0, 6, 6), ("106", 6, 0, 6, 6), ("107", 12, 0, 3, 6), ("108", 15, 0, 3, 6),
    ("109", 18, 0, 3, 6), ("110", 21, 0, 3, 6), ("111", 0, 6, 24, 3),
]


class Region:
    def __init__(self, locale):
        self.data = json.loads((Path(__file__).parent / "regional" / f"{locale}.json").read_text())
        self.locale, self.region = self.data["locale"], self.data["region"]
        self.project = self.data["project"]
        font_dir = Path(reportlab.__file__).parent / "fonts"
        pdfmetrics.registerFont(TTFont("RegionalCAD", str(font_dir / "Vera.ttf")))
        pdfmetrics.registerFont(TTFont("RegionalCAD-B", str(font_dir / "VeraBd.ttf")))

    def t(self, key):
        return self.data["labels"][key]  # Missing translations fail; no English fallback.

    def n(self, value, places=2):
        text = f"{value:,.{places}f}"
        return text.replace(",", "\0").replace(".", self.data["decimal"]).replace("\0", self.data["group"])

    def tag(self, kind, index):
        defaults = {"column": "ST", "diffuser": "ZL", "ahu": "LG", "extract": "AL",
                    "light": "L", "socket": "SD", "switch": "S", "wc": "WC", "basin": "WB",
                    "floorDrain": "BA", "sprinkler": "SP", "smoke": "RM", "exit": "AW",
                    "extinguisher": "FL", "tree": "B", "shrub": "S", "bench": "BK", "panel": "UV"}
        prefixes = self.data.get("symbolPrefixes", defaults)
        return f"{prefixes[kind]}-{index:02}"

    def length(self, value):
        return f"{self.n(value)} m"


class Sheet:
    def __init__(self, document, code, title, discipline, ratio=None, revision="A"):
        self.document, self.c, self.r = document, document.c, document.r
        self.code = code
        self.record = {"sheet": code, "title": self.r.t(title), "discipline": self.r.t(discipline),
                       "scaleRatio": ratio, "revision": revision, "references": [], "symbols": [], "textBounds": []}
        self.frame(title, discipline, ratio, revision)

    def text(self, x, y, value, size=16, bold=False, color=INK, align="left", width=None, angle=0):
        value = str(value)
        font = "RegionalCAD-B" if bold else "RegionalCAD"
        missing = {ord(char) for char in value if not char.isspace() and ord(char) not in pdfmetrics.getFont(font).face.charWidths}
        if missing:
            raise ValueError(f"{self.r.locale}: missing font glyphs {missing}: {value}")
        measured = pdfmetrics.stringWidth(value, font, size)
        if width and measured > width:
            size *= width / measured
        if size < 9:
            raise ValueError(f"Text too small on {self.code}: {value}")
        measured = pdfmetrics.stringWidth(value, font, size)
        self.record["textBounds"].append({"text": value, "x": x, "y": y, "width": measured,
                                          "size": size, "angle": angle, "align": align})
        c = self.c
        c.saveState()
        c.translate(x, y)
        c.rotate(angle)
        c.setFillColor(HexColor(color))
        c.setFont(font, size)
        {"left": c.drawString, "center": c.drawCentredString, "right": c.drawRightString}[align](0, 0, value)
        c.restoreState()

    def line(self, x1, y1, x2, y2, width=1, color=INK, dash=None):
        c = self.c
        c.saveState()
        c.setStrokeColor(HexColor(color))
        c.setLineWidth(width)
        if dash:
            c.setDash(dash)
        c.line(x1, y1, x2, y2)
        c.restoreState()

    def rect(self, x, y, w, h, width=1, color=INK, fill=None):
        c = self.c
        c.saveState()
        c.setLineWidth(width)
        c.setStrokeColor(HexColor(color))
        if fill:
            c.setFillColor(HexColor(fill))
        c.rect(x, y, w, h, stroke=int(width > 0), fill=int(fill is not None))
        c.restoreState()

    def circle(self, x, y, radius, width=1, color=INK, fill=None):
        c = self.c
        c.saveState()
        c.setStrokeColor(HexColor(color))
        c.setLineWidth(width)
        if fill:
            c.setFillColor(HexColor(fill))
        c.circle(x, y, radius, stroke=int(width > 0), fill=int(fill is not None))
        c.restoreState()

    def poly(self, points, width=1, color=INK, close=False, fill=None, dash=None):
        c = self.c
        c.saveState()
        c.setStrokeColor(HexColor(color))
        c.setLineWidth(width)
        if fill:
            c.setFillColor(HexColor(fill))
        if dash:
            c.setDash(dash)
        p = c.beginPath()
        p.moveTo(*points[0])
        for point in points[1:]:
            p.lineTo(*point)
        if close:
            p.close()
        c.drawPath(p, stroke=1, fill=int(fill is not None))
        c.restoreState()

    def notes(self, x, y, title, lines, width=450, size=17, bottom=160):
        self.line(x, y + 21, x + width, y + 21, 1.5)
        self.text(x, y, self.r.t(title), 21, True, width=width)
        y -= 38
        for value in lines:
            words, row = str(value).split(), ""
            for word in words:
                test = f"{row} {word}".strip()
                if pdfmetrics.stringWidth(test, "RegionalCAD", size) > width and row:
                    self.text(x, y, row, size)
                    y -= size * 1.45
                    row = word
                else:
                    row = test
            if row:
                self.text(x, y, row, size)
                y -= size * 1.45
            y -= 15
        if y < bottom:
            raise ValueError(f"Notes overflow on {self.code}: {title} reaches {y}")
        return y

    def table(self, x, y, widths, headers, rows, row_h=48, size=16):
        self.rect(x, y - row_h * (len(rows) + 1), sum(widths), row_h * (len(rows) + 1))
        self.rect(x, y - row_h, sum(widths), row_h, 0, fill=LIGHT)
        for index, row in enumerate([headers] + rows):
            xx = x
            for width, value in zip(widths, row):
                self.text(xx + 9, y - index * row_h - row_h * .65, value, size, index == 0, width=width - 18)
                xx += width
            if index:
                self.line(x, y - index * row_h, x + sum(widths), y - index * row_h, .6, GRAY)
        xx = x
        for width in widths[:-1]:
            xx += width
            self.line(xx, y, xx, y - row_h * (len(rows) + 1), .6, GRAY)

    def view_title(self, x, y, number, title, ratio=None, width=950):
        self.circle(x + 19, y + 18, 19, 1.4)
        self.text(x + 19, y + 12, number, 17, True, align="center")
        self.text(x + 53, y + 22, self.r.t(title), 20, True, width=width - 55)
        self.line(x + 53, y + 10, x + width, y + 10)
        self.text(x + 53, y - 11, f"{self.r.t('scale')} 1:{ratio}" if ratio else self.r.t("notToScale"), 14, color=GRAY)

    def frame(self, title, discipline, ratio, revision):
        r = self.r
        bx = W - 245
        self.rect(28, 28, W - 56, H - 56, 1.4)
        self.line(bx, 28, bx, H - 28, 1.2)
        self.line(28, H - 118, bx, H - 118)
        self.text(58, H - 67, r.project["name"], 28, True, width=1740)
        self.text(58, H - 95, f"{r.project['address']} | {r.project['number']} | {r.t('fictional')}", 15, color=GRAY, width=1770)
        self.text(bx - 24, H - 66, self.code, 30, True, align="right")
        self.text(bx - 24, H - 95, r.t("demoOnly"), 13, True, align="right")
        self.text(bx + 18, H - 70, "POLYPDF", 27, True, color=BLUE)
        self.notes(bx + 18, H - 138, "project", [r.project["name"], r.project["number"], r.t("oneStorey")], 180, 13)
        self.notes(bx + 18, 1235, "drawing", [r.t(title)], 180, 16)
        self.notes(bx + 18, 1030, "discipline", [r.t(discipline)], 180, 14)
        date = r.project["revisionBDate"] if revision == "B" else r.project["date"]
        self.notes(bx + 18, 865, "issue", [f"{r.t('revision')} {revision}", date, r.t("checked")], 180, 13)
        self.notes(bx + 18, 640, "sheetData",
                   [f"{r.t('scale')}: 1:{ratio}" if ratio else r.t("asNoted"),
                    f"{r.t('original')}: A1", r.t("units")], 180, 13)
        self.notes(bx + 18, 400, "notice", [r.t("notForConstruction"), r.t("noCompliance")], 180, 12, bottom=100)
        self.text(bx + 108, 73, self.code, 34, True, align="center")
        self.text(58, 57, f"{r.t('fictional')} | {r.t('demoOnly')} | {r.t('notForConstruction')}", 13, True, color=GRAY, width=1800)

    @contextmanager
    def layer(self, key):
        self.c._code.append(f"/OC /{key} BDC")
        try:
            yield
        finally:
            self.c._code.append("EMC")

    def symbol(self, kind, x, y, tag=None, size=22, rotation=0, plan=True, tag_side="below", backing=True):
        # The shapes are original illustrative symbols; no standards certification is asserted.
        self.record["symbols"].append({"kind": kind, "x": x, "y": y, "tag": tag, "plan": plan, "rotation": rotation})
        c = self.c
        c.saveState()
        c.translate(x, y)
        c.rotate(rotation)
        a = size / 2
        if backing:
            self.rect(-a - 3, -a - 3, size + 6, size + 6, 0, fill="#ffffff")
        if kind == "diffuser":
            self.rect(-a, -a, size, size, 1.3)
            self.rect(-a/3, -a/3, size/3, size/3, .8)
            for sx in (-1, 1):
                for sy in (-1, 1):
                    self.line(sx*a, sy*a, sx*a/3, sy*a/3, .8)
        elif kind == "light":
            self.rect(-a*1.5, -a/2, size*1.5, size/2, 1.4)
            self.line(-a*1.5, -a/2, a*1.5, a/2, .8)
        elif kind in ("sprinkler", "smoke", "socket", "tree", "shrub"):
            self.circle(0, 0, a, 1.3)
            if kind == "sprinkler":
                self.line(-a*1.3, 0, a*1.3, 0)
                self.line(0, -a*1.3, 0, a*1.3)
            elif kind == "socket":
                for xx in (-a/3, a/3):
                    self.line(xx, -a*1.25, xx, a*1.25)
            elif kind in ("tree", "shrub"):
                self.poly([(-a*.7, 0), (0, a*.7), (a*.7, 0), (0, -a*.7)], .8, close=True)
            else:
                self.circle(0, 0, a/3, 1)
        elif kind == "wc":
            self.rect(-a, 0, size, a, 1.2)
            self.c.ellipse(-a*.75, -a*1.3, a*.75, a*.4, stroke=1)
        elif kind == "basin":
            self.rect(-a*1.3, -a, size*1.3, size, 1)
            self.c.ellipse(-a, -a*.6, a, a*.6, stroke=1)
        elif kind == "floorDrain":
            self.rect(-a, -a, size, size, 1.2)
            for yy in (-a*.5, 0, a*.5):
                self.line(-a, yy, a, yy, .7)
        elif kind == "exit":
            self.rect(-a*1.5, -a*.7, size*1.5, size*.7, 1.3)
            self.line(-a, 0, a, 0, 1.6)
            self.poly([(a*.4, a*.4), (a, 0), (a*.4, -a*.4)], 1.6)
        elif kind == "extinguisher":
            self.rect(-a*.5, -a, a, size, 1.2)
            self.line(0, a, a, a*1.5, 1.2)
        elif kind == "bench":
            self.rect(-a*1.5, -a*.55, size*1.5, size*.55, 1.3)
            self.line(-a, -a, -a, a, .8)
            self.line(a, -a, a, a, .8)
        elif kind == "switch":
            self.circle(0, 0, a*.65, 1.2)
            self.line(a*.4, a*.4, a*1.4, a*1.4, 1.2)
        elif kind in ("column", "ahu", "extract"):
            self.rect(-a, -a, size, size, 1.4, fill=LIGHT)
            self.line(-a, -a, a, a, .8)
            self.line(-a, a, a, -a, .8)
        else:
            raise ValueError(f"Unknown symbol: {kind}")
        c.restoreState()
        if tag:
            tag_side = self.r.data.get("symbolTagSides", {}).get(kind, tag_side)
            tx, ty, align = x, y - a - 21, "center"
            if tag_side == "above":
                ty = y + a + 12
            elif tag_side in ("left", "right"):
                tx, ty = x + (a+10 if tag_side == "right" else -a-10), y-4
                align = "left" if tag_side == "right" else "right"
            if self.r.data.get("maskSymbolTags"):
                width = pdfmetrics.stringWidth(tag, "RegionalCAD", 12)
                left = tx - width * {"left": 0, "center": .5, "right": 1}[align]
                self.rect(left-2, ty-3, width+4, 16, 0, fill="#ffffff")
            self.text(tx, ty, tag, 12, align=align)


class View:
    def __init__(self, sheet, x=140, y=430, ratio=50):
        self.s, self.x, self.y, self.ratio = sheet, x, y, ratio
        self.ppm = 1000 * MM / ratio

    def point(self, x, y):
        return self.x + x * self.ppm, self.y + y * self.ppm

    def line(self, x1, y1, x2, y2, **kwargs):
        self.s.line(*self.point(x1, y1), *self.point(x2, y2), **kwargs)

    def rect(self, x, y, w, h, **kwargs):
        self.s.rect(*self.point(x, y), w * self.ppm, h * self.ppm, **kwargs)
        self.s.record["references"].append({"id": f"rectangle-{len(self.s.record['references'])}",
            "kind": "rectangle", "points": [self.point(x, y), self.point(x+w, y+h)],
            "widthMetres": w, "heightMetres": h, "scaleRatio": self.ratio})

    def text(self, x, y, value, **kwargs):
        self.s.text(*self.point(x, y), value, **kwargs)

    def route(self, points, key, color=BLUE, dash=None):
        pdf_points = [self.point(*point) for point in points]
        self.s.poly(pdf_points, 2.4, color, dash=dash)
        length = sum(math.dist(a, b) for a, b in zip(points, points[1:]))
        self.s.record["references"].append({"id": key, "kind": "polyline", "points": pdf_points,
                                           "metres": length, "scaleRatio": self.ratio})
        return length

    def dimension(self, a, b, offset=35):
        p1, p2 = self.point(*a), self.point(*b)
        length = math.dist(a, b)
        vertical = abs(p1[0] - p2[0]) < .001
        q1 = (p1[0] - offset, p1[1]) if vertical else (p1[0], p1[1] + offset)
        q2 = (p2[0] - offset, p2[1]) if vertical else (p2[0], p2[1] + offset)
        for p, q in ((p1, q1), (p2, q2)):
            self.s.line(*p, *q, .6, GRAY)
            self.s.line(q[0]-4, q[1]-4, q[0]+4, q[1]+4, 1.1)
        self.s.line(*q1, *q2, .7, GRAY)
        self.s.text((q1[0]+q2[0])/2 - (12 if vertical else 0),
                    (q1[1]+q2[1])/2 + (0 if vertical else 12),
                    self.s.r.length(length), 16, align="center", angle=90 if vertical else 0)

    def reference(self, x, y, length=5):
        a, b = self.point(x, y), self.point(x + length, y)
        self.s.line(*a, *b, 1.5)
        for p in (a, b):
            self.s.line(p[0], p[1]-8, p[0], p[1]+8, 1.5)
        self.s.text(a[0], a[1]+22, f"{self.s.r.t('reference')}: {self.s.r.length(length)}", 15, True)
        self.s.record["references"].append({"id": "calibration", "kind": "line", "points": [a, b],
                                           "metres": length, "scaleRatio": self.ratio})

    def symbol(self, kind, x, y, tag=None, **kwargs):
        self.s.symbol(kind, *self.point(x, y), tag=tag, **kwargs)

    def door(self, x, y, width=.9, down=False):
        xx, yy = self.point(x, y)
        radius = width * self.ppm
        self.s.line(xx-2, yy, xx+radius+2, yy, 7, "#ffffff")
        self.s.line(xx, yy, xx, yy-radius if down else yy+radius, 1.2)
        self.s.c.saveState()
        self.s.c.setStrokeColor(HexColor(GRAY))
        self.s.c.setLineWidth(.65)
        self.s.c.arc(xx-radius, yy-radius, xx+radius, yy+radius, 270 if down else 0, 90)
        self.s.c.restoreState()

    def building(self, revision="A", labels=True, dimensions=True, faint=False):
        color = GRAY if faint else INK
        self.rect(0, 0, 24, 15, width=2.8, color=color)
        self.rect(.15, .15, 23.7, 14.7, width=.65, color=color)
        self.s.record["references"].append({"id": "building-footprint", "kind": "rectangle",
            "points": [self.point(0, 0), self.point(24, 15)], "widthMetres": 24, "heightMetres": 15,
            "areaSquareMetres": 360, "perimeterMetres": 78, "scaleRatio": self.ratio})
        for yy in (6, 9):
            self.line(0, yy, 24, yy, width=1.5, color=color)
        for xx in (6, 12, 19.5 if revision == "B" else 18):
            self.line(xx, 9, xx, 15, width=1.5, color=color)
        for xx in (6, 12, 15, 18, 21):
            self.line(xx, 0, xx, 6, width=1.5, color=color)
        for xx in (2.25, 8.25, 14.25, 21 if revision == "B" else 20.25):
            self.door(xx, 9)
        for xx in (2.25, 8.25, 13, 16, 19, 22):
            self.door(xx, 6, down=True)
        self.door(11.25, 0)
        self.door(0, 7)
        for xx in (2, 8, 14, 20):
            self.line(xx, 15, xx+2, 15, width=7, color="#ffffff")
            for offset in (-.05, 0, .05):
                self.line(xx, 15+offset, xx+2, 15+offset, width=.7, color=color)
        for xx, length in [(1.25, 2), (7, 2)] + ([(4.25, 1.5)] if revision == "B" else []):
            self.line(xx, 0, xx+length, 0, width=7, color="#ffffff")
            for offset in (-.05, 0, .05):
                self.line(xx, offset, xx+length, offset, width=.7, color=color)
        if labels:
            for code, x, y, width, height in ROOMS:
                if revision == "B" and code == "103":
                    width = 7.5
                if revision == "B" and code == "104":
                    x, width = 19.5, 4.5
                px, py = self.point(x+width/2, y+height/2)
                self.s.text(px, py+16, self.s.r.t("room"+code), 16, True, align="center", width=width*self.ppm-25)
                self.s.text(px, py-7, code, 14, align="center")
                self.s.text(px, py-29, self.s.r.n(width*height)+" m²", 13, color=GRAY, align="center")
        if dimensions:
            self.dimension((0, 15), (24, 15), 62)
            self.dimension((0, 0), (0, 15), 48)
            self.dimension((0, 0), (6, 0), -55)
            self.dimension((6, 0), (12, 0), -55)
            self.dimension((12, 0), (24, 0), -55)
        self.reference(0, -3, 5)


class Document:
    def __init__(self, region, out, number):
        self.r, self.number = region, number
        self.path = out / region.data["files"][number-1]
        self.c = canvas.Canvas(str(self.path), pagesize=(W, H), pageCompression=1, invariant=1,
                               lang=region.data.get("pdfLanguage"))
        self.c.setTitle(f"{region.project['name']} | {region.t('library')}")
        self.c.setAuthor("PolyPDF")
        self.c.setSubject(f"{region.t('fictional')}. {region.t('notForConstruction')}. {region.locale}")
        self.pages, self.facts = [], {}

    def sheet(self, code, title, discipline, ratio=None, revision="A"):
        if self.pages:
            self.c.showPage()
        self.c.setPageSize((W, H))
        key = f"page{len(self.pages)+1}"
        self.c.bookmarkPage(key)
        self.c.addOutlineEntry(f"{code} | {self.r.t(title)}", key, level=0)
        sheet = Sheet(self, code, title, discipline, ratio, revision)
        self.pages.append(sheet.record)
        return sheet

    def finish(self):
        self.c.save()
        return {"id": f"{self.number:02}", "sourceFile": SOURCE_FILES[self.number-1],
                "file": self.path.name, "pages": self.pages, "facts": self.facts}


def sidebar(sheet, note_keys, symbols=None, extra=None):
    r = sheet.r
    bottom = sheet.notes(1635, 1385, "notes", [r.t(key) for key in note_keys] + (extra or []), 450, 17, bottom=700)
    if symbols:
        top = min(bottom - 25, 980)
        sheet.text(1635, top, r.t("legend"), 21, True)
        for index, (kind, count) in enumerate(symbols):
            y = top - 57 - index * 62
            sheet.symbol(kind, 1655, y, size=22, plan=False)
            sheet.text(1695, y+1, r.t(kind), 15, width=315)
            sheet.text(2078, y+1, str(count), 16, True, align="right")
        sheet.text(1635, y-54, r.t("excludeLegend"), 13, width=450)


def architectural(region, out, revision):
    d = Document(region, out, 2 if revision == "A" else 3)
    sh = d.sheet("A101", "groundPlan", "architecture", 50, revision)
    view = View(sh)
    view.building(revision)
    for x in (1.5, 7.5, 13.5, 20):
        for y in (10.3, 13.3):
            view.rect(x, y, 2.1, .8, width=.7, fill="#f4f5f6")
            for dx in (.3, 1, 1.7):
                for dy in (-.35, 1.05):
                    view.rect(x+dx-.15, y+dy-.13, .3, .26, width=.5)
    for x in (1, 23):
        px, py = view.point(x, 7.5)
        sh.circle(px, py, 21, fill="#ffffff")
        sh.line(px-21, py, px+21, py, .8)
        sh.text(px, py+5, "3", 12, True, align="center")
        sh.text(px, py-15, "A201", 10, align="center")
        sh.c.linkRect(region.t("sectionLink"), "page2", (px-22, py-22, px+22, py+22), relative=0, thickness=0)
    sh.view_title(100, 1440, "1", "groundPlan", 50, 1450)
    sidebar(sh, ["buildingDimensions", "doorNote", "revisionA" if revision == "A" else "revisionB", "calibrate", "checkSecond"])
    sh = d.sheet("A201", "archDetails", "architecture", revision=revision)
    for x, title, south in ((100, "northElevation", False), (1150, "southElevation", True)):
        sh.view_title(x, 1450, "2" if south else "1", title, 100, 940)
        v = View(sh, x+40, 1090, 100)
        v.rect(0, 0, 24, 3, width=1.5)
        sh.poly([v.point(-.4, 3), v.point(12, 4.5), v.point(24.4, 3)], 1.5)
        for wx, length in ([(1.25, 2), (7, 2)] if south else [(2, 2), (8, 2), (14, 2), (20, 2)]) + ([(4.25, 1.5)] if south and revision == "B" else []):
            v.rect(wx, .8, length, 1.5, width=.9)
            v.line(wx+length/2, .8, wx+length/2, 2.3, width=.6)
        if south:
            v.rect(11.25, 0, .9, 2.1, width=1)
        v.dimension((0, 0), (24, 0), -42)
        for yy, key in ((0, "slabTop"), (3, "wallTop"), (4.5, "ridge")):
            sh.text(x+770, 1090+yy*v.ppm+8, f"{region.t(key)} +{region.n(yy)} m", 12, width=170)
    sh.view_title(100, 820, "3", "section", 50, 940)
    v = View(sh, 140, 395, 50)
    v.rect(0, -.15, 15, .15, fill=LIGHT)
    for xx in (0, 6, 9, 15):
        v.rect(xx, 0, .15, 3, fill=LIGHT)
    sh.poly([v.point(-.3, 3), v.point(7.5, 4.5), v.point(15.3, 3)], 2)
    v.dimension((0, 0), (15, 0), -55)
    v.dimension((15, 0), (15, 3), -40)
    v.text(7.5, 4.9, region.t("roof"), size=15, align="center")
    sh.view_title(1150, 820, "4", "wallDetail", 10, 940)
    v = View(sh, 1230, 410, 10)
    v.rect(0, -.45, .6, .45, fill=LIGHT)
    v.rect(.2, 0, .2, 1.1, fill=LIGHT)
    v.rect(.4, 0, 1.8, .15, fill=LIGHT)
    v.line(.4, -.07, 2.2, -.07, dash=[5, 4])
    v.dimension((0, -.45), (.6, -.45), -45)
    for y, key in ((700, "wall200"), (615, "slab150"), (530, "membrane"), (270, "footing600")):
        sh.text(1700, y, region.t(key), 15, width=385)
    d.facts = {"buildingMetres": [24, 15], "areaSquareMetres": 360, "perimeterMetres": 78,
               "room103SquareMetres": 45 if revision == "B" else 36,
               "room104SquareMetres": 27 if revision == "B" else 36,
               "sectionLinks": 2, "partitionShiftMetres": 1.5 if revision == "B" else 0,
               "doorShiftMetres": .75 if revision == "B" else 0, "addedWindowMetres": 1.5 if revision == "B" else 0}
    return d.finish()


def site_base(sh, landscape=False):
    r = sh.r
    v = View(sh, 200, 650, 200)
    v.rect(0, 0, 60, 40, width=2)
    sh.record["references"].append({"id": "site-boundary", "kind": "rectangle", "points": [v.point(0, 0), v.point(60, 40)],
                                   "widthMetres": 60, "heightMetres": 40, "areaSquareMetres": 2400,
                                   "perimeterMetres": 200, "scaleRatio": 200})
    v.rect(18, 16, 24, 15, width=1.5, fill=LIGHT)
    v.text(30, 23.5, r.t("building"), size=17, bold=True, align="center")
    v.rect(12, 10, 36, 4, width=.8, fill="#f4efe5")
    v.text(30, 9 if landscape else 11.6, r.t("paving"), size=13, align="center")
    for i in range(8):
        v.rect(7+i*2.5, 2, 2.5, 5, width=.8)
    v.text(17, 8, r.t("parking"), size=13, align="center")
    v.line(-4, -3, 64, -3, width=2)
    v.line(-4, -9, 64, -9, width=2)
    v.line(-4, -6, 64, -6, width=.7, dash=[18, 10])
    v.text(36, -5.5, r.t("street"), size=16, bold=True, align="center")
    v.dimension((0, 40), (60, 40), 45)
    v.dimension((0, 0), (0, 40), 45)
    v.reference(0, -18, 10)
    if not landscape:
        for points, key, color in [
            ([(2, -3), (2, 12), (22, 12), (22, 16)], "water", BLUE),
            ([(55, -3), (55, 14), (40, 14), (40, 16)], "drainage", RED),
            ([(58, -3), (58, 33), (42, 33), (42, 28)], "power", GOLD),
        ]:
            length = v.route(points, key, color)
            sh.text(1200, 1210 - ["water", "drainage", "power"].index(key)*66,
                    f"{r.t(key)}: {r.length(length)}", 17, color=color, width=350)
    sh.text(1135, 1350, "N", 22, True, align="center")
    sh.poly([(1135, 1328), (1121, 1280), (1135, 1290), (1149, 1280)], 1, close=True)
    return v


def civil(region, out):
    d = Document(region, out, 1)
    sh = d.sheet("C101", "sitePlan", "civil", 200)
    sh.view_title(100, 1440, "1", "sitePlan", 200, 1450)
    site_base(sh)
    sidebar(sh, ["siteDimensions", "siteDatum", "calibrate", "checkSecond", "newCopy"])
    sh = d.sheet("C201", "grading", "civil")
    sh.view_title(100, 1440, "1", "grading", 200, 1450)
    v = View(sh, 200, 900, 200)
    v.rect(0, 0, 60, 30, width=1.3)
    for i in range(5):
        points = [(0, 4+i*4), (15, 5+i*4), (30, 3+i*4), (45, 5+i*4), (60, 4+i*4)]
        sh.poly([v.point(*p) for p in points], .9, GRAY)
        v.text(61, 4+i*4, region.n(99+i*.25)+" m", size=13)
    v.dimension((0, 0), (60, 0), -40)
    sh.view_title(100, 680, "2", "crossSection", 100, 1000)
    v = View(sh, 180, 440, 100)
    profile = [(0, .4), (8, .55), (16, .8), (24, .6), (32, .45)]
    sh.poly([v.point(*p) for p in profile], 2)
    v.line(0, 0, 32, 0, width=.7, dash=[6, 4])
    for xx, yy in profile:
        v.line(xx, 0, xx, yy, width=.6)
        v.text(xx, yy+.45, region.n(99+yy)+" m", size=13, align="center")
    v.dimension((0, 0), (32, 0), -45)
    sh.view_title(1250, 680, "3", "pavingSection", 10, 800)
    v = View(sh, 1320, 440, 10)
    for yy, thickness, fill in [(0, .08, "#c5cbd0"), (-.04, .04, "#e4ded3"), (-.24, .20, "#f0eee7")]:
        v.rect(0, yy, 2.4, thickness, fill=fill)
    v.dimension((0, -.24), (2.4, -.24), -45)
    sh.notes(1635, 1385, "notes", [region.t("siteDatum"), region.t("regionScale"), region.t("assumptions")], 450, 17)
    d.facts = {"siteMetres": [60, 40], "siteAreaSquareMetres": 2400, "sitePerimeterMetres": 200,
               "parkingStalls": 8, "pavingSquareMetres": 144, "waterRouteMetres": 39,
               "drainageRouteMetres": 34, "powerRouteMetres": 57}
    return d.finish()


def structure(region, out):
    d = Document(region, out, 4)
    sh = d.sheet("S101", "foundation", "structure", 50)
    v = View(sh)
    v.rect(0, 0, 24, 15, width=2.5, fill="#f8f8f5")
    sh.record["references"].append({"id": "slab", "kind": "rectangle", "points": [v.point(0, 0), v.point(24, 15)],
                                   "widthMetres": 24, "heightMetres": 15, "areaSquareMetres": 360,
                                   "depthMetres": .15, "volumeCubicMetres": 54, "scaleRatio": 50})
    index = 0
    for y in (0, 7.5, 15):
        for x in (0, 8, 16, 24):
            index += 1
            v.rect(x-.9, y-.9, 1.8, 1.8, width=1.3)
            v.symbol("column", x, y, region.tag("column", index), size=22)
    v.dimension((0, 15), (24, 15), 100)
    v.dimension((0, 0), (0, 15), 80)
    v.reference(0, -3, 5)
    sh.view_title(100, 1460, "1", "foundation", 50, 1450)
    sidebar(sh, ["structureNote", "slabQuantity", "footingQuantity", "calibrate"])
    sh = d.sheet("S201", "framing", "structure")
    sh.view_title(100, 1440, "1", "roofFraming", 100, 950)
    v = View(sh, 160, 900, 100)
    for y in (0, 7.5, 15):
        v.line(0, y, 24, y, width=3)
    for x in (0, 8, 16, 24):
        v.line(x, 0, x, 15, width=2)
        for y in (0, 7.5, 15):
            v.symbol("column", x, y, size=14)
    v.dimension((0, 0), (24, 0), -45)
    sh.notes(1200, 1410, "notes", [region.t("structureNote"), region.t("regionScale"), region.t("noCompliance")], 850, 18)
    sh.view_title(100, 680, "2", "foundationDetail", 10, 1050)
    v = View(sh, 200, 320, 10)
    v.rect(0, 0, 1.8, .45, fill=LIGHT)
    v.rect(.75, .45, .3, .75, fill="#d4dce0")
    v.dimension((0, 0), (1.8, 0), -50)
    v.dimension((0, 0), (0, .45), 50)
    sh.table(1250, 640, [300, 260, 260], [region.t("type"), region.t("quantity"), region.t("unit")],
             [[region.t("column"), "12", "-"], [region.t("beam"), region.n(132), "m"],
              [region.t("slab"), region.n(54), "m³"], [region.t("footing"), region.n(17.496, 3), "m³"]], 54)
    d.facts = {"columns": 12, "footings": 12, "slabAreaSquareMetres": 360, "slabDepthMetres": .15,
               "slabVolumeCubicMetres": 54, "footingMetres": [1.8, 1.8, .45],
               "footingVolumeCubicMetres": 17.496, "beamLengthMetres": 132}
    return d.finish()


def services(region, out, number):
    kinds = {
        5: ("M101", "M501", "hvacPlan", "hvacDetails", "mechanical", "ductNote"),
        6: ("E101", "E501", "electricalPlan", "electricalDetails", "electrical", "circuitNote"),
        7: ("P101", "P501", "plumbingPlan", "plumbingDetails", "plumbing", "sanitaryNote"),
        8: ("F101", "F501", "firePlan", "fireDetails", "fire", "fireNote"),
    }
    code, detail, title, detail_title, trade, note = kinds[number]
    d = Document(region, out, number)
    sh = d.sheet(code, title, trade, 50)
    sh.view_title(100, 1440, "1", title, 50, 1450)
    v = View(sh)
    v.building(labels=False, faint=True)
    entries, routes = [], {}
    if number == 5:
        routes["mainDuct"] = v.route([(1.5, 7.5), (22.5, 7.5), (22.5, 12)], "mainDuct")
        for y in (10.5, 13.5):
            for x in (3, 9, 15, 21):
                v.line(x, 7.5, x, y, width=1.7, color=BLUE)
                for dx in (-1, 1):
                    v.line(x, y, x+dx, y, width=1.4, color=BLUE)
                    v.symbol("diffuser", x+dx, y, region.tag("diffuser", len(entries)+1), size=24)
                    entries.append("diffuser")
        for i, x in enumerate((19, 22)):
            v.symbol("ahu", x, 3, region.tag("ahu", i+1), size=36)
        for i, x in enumerate((13.5, 16.5)):
            v.symbol("extract", x, 3, region.tag("extract", i+1), size=24)
        symbols = [("diffuser", 16), ("ahu", 2), ("extract", 2)]
    elif number == 6:
        if region.data.get("maskSymbolTags"):
            routes["circuit"] = v.route([(1, 1), (1, 7.5), (23, 7.5), (23, 13.5)], "circuit", GOLD, [6, 4])
        for i, (x, y) in enumerate((x, y) for y in (10.5, 13.5, 3) for x in (2, 5, 8, 11, 14, 17, 20, 23)):
            v.symbol("light", x, y, region.tag("light", i+1), size=23, rotation=90 if i % 4 == 0 else 0)
        for i, x in enumerate((1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23)):
            v.symbol("socket", x, .6, region.tag("socket", i+1), size=18)
        for i, x in enumerate((2, 5, 8, 11, 14, 17, 20, 23)):
            v.symbol("switch", x, 8.7, region.tag("switch", i+1), size=18)
        if not region.data.get("maskSymbolTags"):
            routes["circuit"] = v.route([(1, 1), (1, 7.5), (23, 7.5), (23, 13.5)], "circuit", GOLD, [6, 4])
        symbols = [("light", 24), ("socket", 12), ("switch", 8)]
    elif number == 7:
        if region.data.get("maskSymbolTags"):
            for key, xx, col in (("coldWater", 13.2, BLUE), ("hotWater", 13.5, RED), ("wasteWater", 16.2, GRAY)):
                routes[key] = v.route([(xx, 0), (xx, 7.5), (18.5, 7.5), (18.5, 3)], key, col)
        for i, (x, y) in enumerate(((12.7, 1), (12.7, 5), (15.7, 1), (15.7, 5))):
            v.symbol("wc", x, y, region.tag("wc", i+1), size=26)
            v.symbol("basin", x+1.5, y, region.tag("basin", i+1), size=24)
            v.symbol("floorDrain", x+.7, y+(.9 if y == 1 else -.9), region.tag("floorDrain", i+1), size=18)
        if not region.data.get("maskSymbolTags"):
            for key, xx, col in (("coldWater", 13.2, BLUE), ("hotWater", 13.5, RED), ("wasteWater", 16.2, GRAY)):
                routes[key] = v.route([(xx, 0), (xx, 7.5), (18.5, 7.5), (18.5, 3)], key, col)
        symbols = [("wc", 4), ("basin", 4), ("floorDrain", 4)]
    else:
        if region.data.get("maskSymbolTags"):
            routes["escapeRoute"] = v.route([(21, 12), (21, 7.5), (.5, 7.5)], "escapeRoute", "#428062", [8, 5])
        for i, (x, y) in enumerate((x, y) for y in (3, 7.5, 12) for x in (1.5, 4.5, 7.5, 10.5, 13.5, 16.5, 19.5, 22.5)):
            v.symbol("sprinkler", x, y, region.tag("sprinkler", i+1), size=19)
        for i, (x, y) in enumerate((x, y) for y in (4.5, 13.5) for x in (3, 9, 15, 21)):
            v.symbol("smoke", x, y, region.tag("smoke", i+1), size=20)
        for i, (x, y) in enumerate(((.5, 7.5), (23.5, 7.5), (11.5, .5), (11.5, 14.5))):
            v.symbol("exit", x, y, region.tag("exit", i+1), size=21)
        for i, x in enumerate((2, 8, 14, 20)):
            v.symbol("extinguisher", x, 6.3, region.tag("extinguisher", i+1), size=19)
        if not region.data.get("maskSymbolTags"):
            routes["escapeRoute"] = v.route([(21, 12), (21, 7.5), (.5, 7.5)], "escapeRoute", "#428062", [8, 5])
        symbols = [("sprinkler", 24), ("smoke", 8), ("exit", 4), ("extinguisher", 4)]
    sidebar(sh, [note, "calibrate", "excludeLegend"], symbols)
    d.facts = {"planCounts": dict(symbols), "legendCounts": {kind: 1 for kind, _ in symbols}, "routesMetres": routes}
    sh = d.sheet(detail, detail_title, trade)
    diagram_title = {5: "hvacDetails", 6: "singleLine", 7: "riser", 8: "escapeRoute"}[number]
    sh.view_title(100, 1440, "1", diagram_title, None, 1300)
    if number == 5:
        sh.rect(160, 1080, 200, 180, 2, fill=LIGHT)
        sh.text(260, 1150, region.tag("ahu", 1), 19, True, align="center")
        for y in (1110, 1230):
            sh.poly([(360, y), (1080, y), (1080, y-140)], 4, BLUE)
            for x in (540, 760, 980):
                sh.line(x, y, x, y-80, 2, BLUE)
                sh.symbol("diffuser", x, y-95, size=35)
        sh.text(440, 1305, region.t("duct")+" 400 x 250 mm", 18)
    elif number == 6:
        sh.rect(160, 1000, 210, 300, 1.5, fill=LIGHT)
        sh.text(265, 1140, region.tag("panel", 1), 22, True, align="center")
        for i, kind in enumerate(("light", "socket", "switch")):
            y = 1250-i*95
            sh.line(370, y, 1110, y, 2, GOLD)
            for x in (520, 750, 980):
                sh.symbol(kind, x, y, size=30)
            sh.text(410, y+25, f"{region.t('circuit')} {i+1}", 15)
    elif number == 7:
        for x, key, color in ((250, "coldWater", BLUE), (550, "hotWater", RED), (850, "wasteWater", GRAY)):
            sh.line(x, 920, x, 1320, 4, color)
            sh.text(x, 1360, region.t(key), 16, True, align="center")
            for y in (1020, 1200):
                sh.line(x, y, x+140, y, 2.4, color)
                sh.symbol("basin" if key != "wasteWater" else "wc", x+160, y, size=34)
            sh.text(x+20, 950, "DN 25" if key != "wasteWater" else "DN 100", 16)
    else:
        sh.rect(160, 1000, 1020, 290, 1.3)
        sh.line(500, 1000, 500, 1290, 1)
        sh.line(840, 1000, 840, 1290, 1)
        sh.poly([(1080, 1180), (1080, 1090), (220, 1090)], 3, "#428062")
        for x in (220, 650, 1080):
            sh.symbol("exit", x, 1090, size=40)
        sh.text(230, 1210, region.t("escapeRoute"), 20, True)
    sh.table(1450, 1390, [340, 180], [region.t("description"), region.t("plan")],
             [[region.t(kind), str(count)] for kind, count in symbols], 58)
    sh.notes(1450, 920, "notes", [region.t(note), region.t("excludeLegend")], 580, 18, bottom=580)
    sh.view_title(100, 690, "2", {5: "ductSection", 6: "luminaireDetail", 7: "plumbingDetails", 8: "legend"}[number], 5 if number in (5, 6) else None, 1300)
    if number in (5, 6):
        v = View(sh, 200, 350, 5)
        dims = (.4, .25) if number == 5 else (.6, .3)
        v.rect(0, 0, *dims, width=2)
        if number == 5:
            v.rect(-.025, -.025, dims[0]+.05, dims[1]+.05, width=.8)
        else:
            v.line(0, 0, *dims, width=1)
        v.dimension((0, 0), (dims[0], 0), -45)
        v.dimension((0, 0), (0, dims[1]), 45)
        v.reference(1, 0, .5)
    else:
        for i, (kind, _) in enumerate(symbols):
            x = 220+i*420
            sh.symbol(kind, x, 440, size=65, plan=False)
            sh.text(x, 340, region.t(kind), 18, True, align="center", width=360)
    return d.finish()


def landscape(region, out):
    d = Document(region, out, 9)
    sh = d.sheet("L101", "landscapePlan", "landscape", 200)
    sh.view_title(100, 1440, "1", "landscapePlan", 200, 1450)
    v = site_base(sh, True)
    for i, (x, y) in enumerate((x, y) for y in (35, 38) for x in (4, 10, 16, 22, 28, 34, 40, 46, 52)):
        v.symbol("tree", x, y, region.tag("tree", i+1), size=20)
    for i, (x, y) in enumerate((x, y) for x in (3, 57) for y in range(4, 28, 2)):
        v.symbol("shrub", x, y, region.tag("shrub", i+1), size=12, tag_side="right" if x == 3 else "left")
    for i, x in enumerate((9, 15, 21, 27, 33, 39, 45, 51)):
        v.symbol("bench", x, 13, region.tag("bench", i+1), size=17)
    sidebar(sh, ["plantNote", "siteDimensions", "calibrate"], [("tree", 18), ("shrub", 24), ("bench", 8)])
    sh = d.sheet("L501", "landscapeDetails", "landscape")
    sh.view_title(100, 1440, "1", "treePit", 20, 950)
    v = View(sh, 200, 1030, 20)
    v.rect(0, -.8, 1.8, .8, fill="#eee9dd")
    v.rect(.7, 0, .4, 1.5, width=1)
    sh.circle(*v.point(.9, 1.7), 90, 1.2)
    v.line(-.5, 0, 2.3, 0)
    v.dimension((0, -.8), (1.8, -.8), -45)
    sh.view_title(1150, 1440, "2", "pathDetail", 10, 930)
    v = View(sh, 1220, 1000, 10)
    for yy, depth, fill in [(0, .06, "#d4d9db"), (-.04, .04, "#e6e0d5"), (-.24, .2, "#f0eee7")]:
        v.rect(0, yy, 2, depth, fill=fill)
    for x in (-.1, 2):
        v.rect(x, -.1, .1, .2, fill=LIGHT)
    v.dimension((0, -.24), (2, -.24), -45)
    sh.table(150, 670, [340, 300, 300, 400], [region.t("type"), region.t("quantity"), region.t("unit"), region.t("description")],
             [[region.t("tree"), "18", "-", region.t("treePit")], [region.t("shrub"), "24", "-", region.t("plantBed")],
              [region.t("bench"), "8", "-", region.t("demoOnly")], [region.t("paving"), region.n(144), "m²", region.t("pathDetail")]], 58)
    sh.notes(1600, 670, "notes", [region.t("plantNote"), region.t("regionScale")], 470, 17, bottom=200)
    d.facts = {"planCounts": {"tree": 18, "shrub": 24, "bench": 8},
               "legendCounts": {"tree": 1, "shrub": 1, "bench": 1}, "pavingSquareMetres": 144}
    return d.finish()


def interiors(region, out):
    d = Document(region, out, 10)
    sh = d.sheet("I101", "finishPlan", "interiors", 50)
    sh.view_title(100, 1440, "1", "finishPlan", 50, 1450)
    v = View(sh)
    for code, x, y, width, height in ROOMS:
        wet = code in ("107", "108")
        v.rect(x, y, width, height, width=0, fill="#e6edf0" if wet else "#f4efe5")
        if wet:
            for i in range(1, int(width/.6)):
                v.line(x+i*.6, y, x+i*.6, y+height, width=.35, color=GRAY)
            for i in range(1, int(height/.6)):
                v.line(x, y+i*.6, x+width, y+i*.6, width=.35, color=GRAY)
    v.building(labels=False)
    for code, x, y, width, height in ROOMS:
        px, py = v.point(x+width/2, y+height/2)
        sh.rect(px-78, py-36, 156, 86, 0, fill="#ffffff")
        sh.text(px, py+25, region.t("room"+code), 15, True, align="center", width=150)
        sh.text(px, py+1, code+" / "+("F2" if code in ("107", "108") else "F1"), 14, align="center")
        sh.text(px, py-23, region.n(width*height)+" m²", 14, align="center")
    sidebar(sh, ["finishNote", "tileNote", "wasteNote", "assumptions"])
    sh = d.sheet("I501", "interiorDetails", "interiors")
    sh.view_title(100, 1440, "1", "caseworkElevation", 20, 1250)
    v = View(sh, 180, 1110, 20)
    v.rect(0, 0, 7.2, .9, width=1.5)
    for i in range(6):
        v.rect(i*1.2+.02, .05, 1.16, .8, width=.9)
        v.line(i*1.2+.6, .05, i*1.2+.6, .85, width=.6)
    v.rect(0, .9, 7.2, .03, fill=LIGHT)
    v.dimension((0, 0), (7.2, 0), -55)
    sh.notes(1500, 1390, "notes", [region.t("cabinetNote"), region.t("regionScale")], 570, 18)
    sh.view_title(100, 770, "2", "caseworkSection", 5, 950)
    v = View(sh, 200, 200, 5)
    v.rect(0, 0, .6, .9, width=1.3)
    v.rect(0, .9, .6, .03, fill=LIGHT)
    v.line(.02, .6, .58, .6, width=1)
    v.rect(.05, 0, .5, .1, width=.8)
    v.dimension((0, 0), (.6, 0), -45)
    v.dimension((.6, 0), (.6, .9), -45)
    sh.text(660, 650, region.t("countertop"), 17, width=360)
    sh.text(660, 520, region.t("shelf"), 17, width=360)
    sh.text(660, 330, region.t("toeKick"), 17, width=360)
    sh.view_title(1150, 770, "3", "finishTransition", 5, 930)
    v = View(sh, 1230, 410, 5)
    v.rect(0, 0, 1.2, .15, fill=LIGHT)
    v.rect(0, .15, .6, .015, width=.8)
    v.rect(.6, .15, .6, .005, width=.8)
    v.dimension((0, 0), (1.2, 0), -55)
    sh.text(1230, 600, "F2 / "+region.t("tile"), 16, width=350)
    sh.text(1630, 600, "F1 / "+region.t("resilient"), 16, width=440)
    d.facts = {"resilientSquareMetres": 324, "tileSquareMetres": 36, "totalFinishSquareMetres": 360,
               "tileModuleMetres": [.6, .6], "tilesBeforeWaste": 100, "cabinets": 6,
               "cabinetModuleMetres": 1.2, "countertopSquareMetres": 4.32, "toeKickMetres": 7.2,
               "wasteAssumptions": {"F1": .05, "F2": .1}, "detailScaleRatios": [20, 5, 5]}
    return d.finish()


def add_layers_and_notes(path, region, issues):
    writer = PdfWriter()
    writer.clone_document_from_reader(PdfReader(path))
    refs = []
    for key, label in (("LARCH", "architecture"), ("LMECH", "mechanical"), ("LELEC", "electrical"), ("LISSUES", "reviewIssues")):
        ref = writer._add_object(DictionaryObject({NameObject("/Type"): NameObject("/OCG"), NameObject("/Name"): TextStringObject(region.t(label))}))
        refs.append(ref)
        for page in writer.pages:
            resources = page["/Resources"].get_object()
            if "/Properties" not in resources:
                resources[NameObject("/Properties")] = DictionaryObject()
            resources["/Properties"][NameObject("/"+key)] = ref
    writer.root_object[NameObject("/OCProperties")] = DictionaryObject({
        NameObject("/OCGs"): ArrayObject(refs),
        NameObject("/D"): DictionaryObject({NameObject("/Name"): TextStringObject(region.t("layers")),
            NameObject("/BaseState"): NameObject("/ON"), NameObject("/Order"): ArrayObject(refs), NameObject("/ON"): ArrayObject(refs)})})
    for number, x, y in issues:
        note = Text(rect=(x+28, y+28, x+50, y+50),
                    text=f"{number:02} | {region.t('open')} | {region.t('issue'+str(number))}\n{region.t('response'+str(number))}", open=False)
        note[NameObject("/T")] = TextStringObject(region.t("reviewAuthor"))
        note[NameObject("/Subj")] = TextStringObject(region.t("reviewIssues")+f" {number:02}")
        note[NameObject("/OC")] = refs[-1]
        writer.add_annotation(page_number=0, annotation=note)
    temporary = path.with_suffix(".working.pdf")
    with temporary.open("wb") as stream:
        writer.write(stream)
    temporary.replace(path)


def coordination(region, out):
    d = Document(region, out, 11)
    sh = d.sheet("X101", "coordinationPlan", "coordination", 50)
    sh.view_title(100, 1440, "1", "coordinationPlan", 50, 1450)
    v = View(sh)
    with sh.layer("LARCH"):
        v.building(labels=False, faint=True)
    with sh.layer("LMECH"):
        v.route([(1.5, 10.5), (22.5, 10.5), (22.5, 3)], "ductRoute", BLUE)
        for x in (3, 9, 15, 21):
            v.symbol("diffuser", x, 10.5, size=25)
    with sh.layer("LELEC"):
        v.route([(10.5, 3), (10.5, 7.5), (22.5, 7.5)], "trayRoute", GOLD, [8, 4])
        for x in (3, 9, 15, 21):
            v.symbol("light", x+.25 if x == 15 else x, 10.5 if x == 15 else 11.5, size=25, backing=False)
    issues = []
    with sh.layer("LISSUES"):
        for number, x, y in ((1, 22.5, 9), (2, 15, 10.5), (3, 10.5, 6)):
            px, py = v.point(x, y)
            sh.circle(px, py, 42, 2.2, RED)
            sh.text(px+50, py+22, f"{number:02}", 18, True, color=RED)
            issues.append((number, px, py))
    sidebar(sh, ["coordinationNote", "reviewWorkflow", "newCopy"])
    sh = d.sheet("X102", "issueRegister", "coordination")
    sh.view_title(100, 1440, "1", "issueRegister", None, 1950)
    sh.table(100, 1340, [70, 650, 150, 1050],
             [region.t("id"), region.t("location"), region.t("status"), region.t("response")],
             [[f"{n:02}", region.t("issue"+str(n)), region.t("open"), region.t("response"+str(n))] for n in range(1, 4)], 65, 18)
    for number, x in enumerate((100, 800, 1500), 1):
        sh.view_title(x, 970, str(number), "review", None, 600)
        if number == 2:
            sh.symbol("diffuser", x+275, 620, size=110)
            sh.symbol("light", x+310, 620, size=110, backing=False)
        else:
            sh.rect(x+100, 390, 55, 430, 1.5, fill=LIGHT)
            sh.rect(x+50, 570, 430, 70, 2, BLUE if number == 1 else GOLD)
        sh.text(x+15, 320, region.t("issue"+str(number)), 16, True, width=590)
        sh.text(x+15, 280, region.t("response"+str(number)), 15, width=590)
    d.facts = {"layers": [region.t(k) for k in ("architecture", "mechanical", "electrical", "reviewIssues")],
               "nativeReviewNotes": 3, "intentionalIssues": 3}
    record = d.finish()
    add_layers_and_notes(d.path, region, issues)
    return record


def scanned(region, out, temp):
    path = out / region.data["files"][11]
    pdf = canvas.Canvas(str(path), pagesize=(W, H), pageCompression=1, invariant=1,
                        lang=region.data.get("pdfLanguage"))
    pdf.setTitle(region.project["name"]+" | "+region.t("scan"))
    pdf.setAuthor("PolyPDF")
    pdf.setSubject(region.t("scanNote"))
    pages = []
    for index, (file_index, code, title) in enumerate(((1, "A101", "scanFloor"), (0, "C101", "scanSite"))):
        source = out / region.data["files"][file_index]
        prefix = temp / f"scan-{index+1}"
        subprocess.run(["pdftoppm", "-f", "1", "-singlefile", "-r", "80", "-png", str(source), str(prefix)], check=True, capture_output=True)
        image = Image.open(prefix.with_suffix(".png")).convert("L")
        image = ImageEnhance.Contrast(image).enhance(.9).filter(ImageFilter.GaussianBlur(.12))
        jpg = prefix.with_suffix(".jpg")
        image.save(jpg, quality=88, optimize=True)
        if index:
            pdf.showPage()
        pdf.drawImage(ImageReader(str(jpg)), 0, 0, width=W, height=H)
        key = f"page{index+1}"
        pdf.bookmarkPage(key)
        pdf.addOutlineEntry(code+" | "+region.t(title), key, level=0)
        pages.append({"sheet": code, "title": region.t(title), "scaleRatio": 50 if file_index == 1 else 200,
                      "sourceFile": source.name, "sourceSha256": hashlib.sha256(source.read_bytes()).hexdigest(),
                      "references": [], "symbols": [], "textBounds": []})
    pdf.save()
    return {"id": "12", "sourceFile": SOURCE_FILES[11], "file": path.name, "pages": pages,
            "facts": {"imageOnly": True, "dpi": 80, "ocrSearchTargets": [region.t("room101"), region.t("sitePlan")]}}


def write_guide(region, out, records):
    r, esc = region, html.escape
    cards = []
    for record in records:
        facts = "".join(f"<tr><th>{esc(r.data['factLabels'][key])}</th><td>{esc(display_fact(r, key, value))}</td></tr>"
                        for key, value in record["facts"].items())
        cards.append(f'<article><h2>{record["id"]} / {esc(record["pages"][0]["title"])}</h2>'
                     f'<p><a href="{esc(record["file"])}">{esc(r.t("guideDownload"))}</a> · A1 · '
                     + " / ".join(esc(page["sheet"]) for page in record["pages"]) + '</p>'
                     f'<a href="{esc(record["file"])}"><img loading="lazy" src="previews/{record["id"]}-1.png" alt="{esc(record["pages"][0]["title"])}"></a>'
                     f'<details><summary>{esc(r.t("guideFacts"))}</summary><table>{facts}</table></details></article>')
    text = f'''<!doctype html><html lang="{r.data["language"]}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(r.t("guideTitle"))}</title><style>
*{{box-sizing:border-box}}body{{margin:0;background:#f2f1ed;color:#17252c;font:16px/1.6 system-ui,sans-serif}}
main{{max-width:1180px;margin:auto;padding:60px 28px}}h1{{font-size:44px;line-height:1.15}}h2{{font-size:25px}}
header{{border-bottom:2px solid;padding-bottom:32px}}article{{padding:28px 0;border-bottom:1px solid #c4c9cb}}
img{{max-width:100%;background:white;border:1px solid #c4c9cb}}a{{color:#284b60}}details{{background:white;padding:18px}}
table{{border-collapse:collapse;width:100%;font-size:13px}}th,td{{border-bottom:1px solid #ddd;padding:9px;text-align:left;overflow-wrap:anywhere}}
</style><main><header><p>POLYPDF / {esc(r.locale)} / {esc(r.project["number"])}</p><h1>{esc(r.t("guideTitle"))}</h1>
<p>{esc(r.t("guideIntro"))}</p><p>{esc(r.t("guideScale"))}</p><p>{esc(r.t("newCopy"))} {esc(r.t("excludeLegend"))}</p>
<p><a href="CONTACT-SHEET.png">{esc(r.t("guideContact"))}</a> · <a href="SHA256SUMS.txt">{esc(r.t("guideFiles"))}</a></p>
<p>{esc(r.t("notForConstruction"))}. {esc(r.t("noCompliance"))}</p></header>{''.join(cards)}</main></html>'''
    (out / "DEMO-GUIDE.html").write_text(text)


def display_fact(region, key, value):
    if isinstance(value, bool):
        return region.t("yes" if value else "no")
    if isinstance(value, dict):
        return " / ".join(f"{region.data['labels'].get(name, name)}: "
                          + (region.n(amount * 100) + " %" if key == "wasteAssumptions" else display_fact(region, name, amount))
                          for name, amount in value.items())
    if isinstance(value, list):
        return " / ".join(display_fact(region, key, item) for item in value)
    if isinstance(value, (int, float)):
        return region.n(value, 0 if isinstance(value, int) and "Metres" not in key else 3 if key == "footingVolumeCubicMetres" else 2)
    return str(value)


def package_library(out, locale):
    """Package only manifest-owned artifacts with matching verification/review receipts."""
    manifest_path = out / "DEMO-MANIFEST.json"
    manifest_hash = hashlib.sha256(manifest_path.read_bytes()).hexdigest()
    manifest = json.loads(manifest_path.read_text())
    verification = json.loads((out / "verification.json").read_text())
    visual = json.loads((out / "visual-review.json").read_text())
    native = json.loads((out / "native-roundtrip.json").read_text())
    assert manifest["locale"] == locale and verification["automatedStatus"] == "passed"
    assert visual["status"] == native["status"] == "passed"
    assert all(receipt["manifestSha256"] == manifest_hash for receipt in (verification, visual, native)), "Stale library receipt"
    files = ["DEMO-MANIFEST.json", "DEMO-GUIDE.html", "reference-quantities.csv", "SHA256SUMS.txt",
             "verification.json", "visual-review.json", "native-roundtrip.json", "CONTACT-SHEET.png"]
    for record in manifest["documents"]:
        assert hashlib.sha256((out / record["file"]).read_bytes()).hexdigest() == record["sha256"]
        files.append(record["file"])
    for preview in verification["previews"]:
        assert hashlib.sha256((out / preview["file"]).read_bytes()).hexdigest() == preview["sha256"]
        assert any(item["file"] == preview["file"] and item["sha256"] == preview["sha256"] for item in visual["previews"])
        files.append(preview["file"])
    assert hashlib.sha256((out / "CONTACT-SHEET.png").read_bytes()).hexdigest() == visual["contactSheet"]["sha256"]
    archive = out / manifest.get("archiveFile", f"PolyPDF-Bauzeichnungen-{locale}.zip")
    with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zipped:
        for name in sorted(files):
            info = zipfile.ZipInfo(name, (2026, 10, 20, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            zipped.writestr(info, (out / name).read_bytes())
    with zipfile.ZipFile(archive) as zipped:
        assert zipped.testzip() is None
        assert all(zipped.read(name) == (out / name).read_bytes() for name in files)
    return archive


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--locale", default="de-DE")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    region = Region(args.locale)
    site_registry = json.loads((ROOT / "src/localization/product-locales.json").read_text())["locales"]
    product = next(locale for locale in site_registry if locale["tag"] == region.locale)
    assert product["region"] == region.region
    out = args.output or ROOT / "public/localized-media" / product["siteId"] / "samples/construction"
    out.mkdir(parents=True, exist_ok=True)
    temp = ROOT / ".tmp/localization/library" / region.locale
    temp.mkdir(parents=True, exist_ok=True)
    records = [civil(region, out), architectural(region, out, "A"), architectural(region, out, "B"),
               structure(region, out), *(services(region, out, n) for n in (5, 6, 7, 8)),
               landscape(region, out), interiors(region, out), coordination(region, out)]
    records.append(scanned(region, out, temp))
    for record in records:
        record["sha256"] = hashlib.sha256((out / record["file"]).read_bytes()).hexdigest()
    manifest = {"schemaVersion": 1, "locale": region.locale, "region": region.region,
                "paper": {"name": "ISO A1", "widthPoints": W, "heightPoints": H, "widthMm": 841, "heightMm": 594},
                "project": region.project, "fictional": True, "standardsComplianceClaimed": False,
                "documents": records, "reviewStatus": "generated; verification and rendered review required"}
    if "archiveFile" in region.data:
        manifest["archiveFile"] = region.data["archiveFile"]
        manifest["verificationText"] = {"reference": region.t("reference"), "checked": region.t("checked")}
    (out / "DEMO-MANIFEST.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+"\n")
    with (out / "reference-quantities.csv").open("w", newline="") as stream:
        writer = csv.writer(stream, delimiter=";", lineterminator="\n")
        writer.writerow([region.t("document"), region.t("description"), region.t("value"), region.t("unit")])
        for record in records:
            for key, value in record["facts"].items():
                if isinstance(value, (int, float)) and not isinstance(value, bool):
                    unit = "m³" if "CubicMetres" in key else "m²" if "SquareMetres" in key else "m" if "Metres" in key else "count"
                    writer.writerow([record["id"], region.data["factLabels"][key], display_fact(region, key, value), "-" if unit == "count" else unit])
    (out / "SHA256SUMS.txt").write_text("".join(f'{record["sha256"]}  {record["file"]}\n' for record in records))
    write_guide(region, out, records)
    # A previous archive cannot describe newly generated PDFs until previews and checks finish.
    (out / manifest.get("archiveFile", f"PolyPDF-Bauzeichnungen-{region.locale}.zip")).unlink(missing_ok=True)
    print(json.dumps({"locale": region.locale, "pdfs": len(records), "pages": sum(len(r["pages"]) for r in records),
                      "directory": str(out), "archive": "created by verify_regional_library.py after verification"}, indent=2))


if __name__ == "__main__":
    main()
