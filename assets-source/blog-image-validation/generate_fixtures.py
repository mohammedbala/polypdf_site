#!/usr/bin/env python3
"""Generate owned and public-domain-derived PDFs for PolyPDF screenshot evidence.

The owned documents contain only fictional names, identifiers, quantities, and revisions.
Public-domain source images are supplied explicitly so their hashes can be checked before use.
"""

from __future__ import annotations

import argparse
import hashlib
import io
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from pypdf import PdfReader, PdfWriter
from pypdf.generic import (
    ArrayObject,
    ByteStringObject,
    DictionaryObject,
    FloatObject,
    NameObject,
    NumberObject,
    TextStringObject,
)
from reportlab.lib import colors
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas


INK = colors.HexColor("#18212A")
MUTED = colors.HexColor("#52606D")
BLUE = colors.HexColor("#245B78")
TEAL = colors.HexColor("#147D73")
AMBER = colors.HexColor("#A76612")
RED = colors.HexColor("#A83B32")
PAPER = colors.white
LIGHT = colors.HexColor("#EDF2F4")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def sheet_frame(c: canvas.Canvas, width: float, height: float, *, sheet: str, title: str, revision: str, scale: str) -> None:
    c.setFillColor(PAPER)
    c.rect(0, 0, width, height, fill=1, stroke=0)
    c.setStrokeColor(INK)
    c.setLineWidth(1.2)
    c.rect(24, 24, width - 48, height - 48, fill=0, stroke=1)
    block_h = 62
    c.line(24, 24 + block_h, width - 24, 24 + block_h)
    c.line(width - 330, 24, width - 330, 24 + block_h)
    c.line(width - 132, 24, width - 132, 24 + block_h)
    c.setFont("Helvetica-Bold", 11)
    c.setFillColor(INK)
    c.drawString(38, 61, "POLYPDF EVIDENCE LAB - FICTIONAL DEMONSTRATION")
    c.setFont("Helvetica", 8)
    c.setFillColor(MUTED)
    c.drawString(38, 44, title)
    c.drawString(38, 31, "No customer data. Not for construction, issue, or professional use.")
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(INK)
    c.drawString(width - 316, 62, f"REVISION: {revision}")
    c.drawString(width - 316, 46, f"SCALE: {scale}")
    c.drawString(width - 316, 30, "DATE: 2026-08-19")
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(width - 78, 49, sheet)


def dimension(c: canvas.Canvas, x1: float, y1: float, x2: float, y2: float, label: str, offset: float = 18) -> None:
    c.setStrokeColor(BLUE)
    c.setFillColor(BLUE)
    c.setLineWidth(1)
    if abs(y2 - y1) < abs(x2 - x1):
        y = y1 + offset
        c.line(x1, y1, x1, y + 4)
        c.line(x2, y2, x2, y + 4)
        c.line(x1, y, x2, y)
        c.line(x1, y - 4, x1, y + 4)
        c.line(x2, y - 4, x2, y + 4)
        c.setFont("Helvetica-Bold", 9)
        c.drawCentredString((x1 + x2) / 2, y + 5, label)
    else:
        x = x1 + offset
        c.line(x1, y1, x + 4, y1)
        c.line(x2, y2, x + 4, y2)
        c.line(x, y1, x, y2)
        c.line(x - 4, y1, x + 4, y1)
        c.line(x - 4, y2, x + 4, y2)
        c.saveState()
        c.translate(x + 7, (y1 + y2) / 2)
        c.rotate(90)
        c.setFont("Helvetica-Bold", 9)
        c.drawCentredString(0, 0, label)
        c.restoreState()


def door(c: canvas.Canvas, x: float, y: float, width: float = 54, hinge: str = "left") -> None:
    c.setStrokeColor(INK)
    c.setLineWidth(1.3)
    if hinge == "left":
        c.line(x, y, x + width, y)
        c.arc(x, y - width, x + 2 * width, y + width, 90, 90)
    else:
        c.line(x, y, x - width, y)
        c.arc(x - 2 * width, y - width, x, y + width, 0, 90)


def diffuser(c: canvas.Canvas, x: float, y: float, size: float = 18) -> None:
    c.setStrokeColor(INK)
    c.setLineWidth(1)
    c.rect(x - size / 2, y - size / 2, size, size, fill=0, stroke=1)
    c.line(x - size / 2, y - size / 2, x + size / 2, y + size / 2)
    c.line(x - size / 2, y + size / 2, x + size / 2, y - size / 2)


def room_label(c: canvas.Canvas, x: float, y: float, name: str, number: str) -> None:
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(x, y + 5, name)
    c.setFont("Helvetica", 8)
    c.drawCentredString(x, y - 7, number)


def generate_measurement_diagnostics(path: Path) -> None:
    width, height = landscape(letter)
    c = canvas.Canvas(str(path), pagesize=(width, height), pageCompression=1)
    sheet_frame(c, width, height, sheet="M-101", title="Measurement Diagnostics - Known Spans and Mixed Scales", revision="A", scale="AS NOTED")
    c.setFillColor(LIGHT)
    c.roundRect(50, 118, 470, 400, 10, fill=1, stroke=0)
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(66, 492, "MAIN PLAN - 1/4\" = 1'-0\"")
    c.setStrokeColor(INK)
    c.setLineWidth(3)
    c.rect(86, 208, 360, 216, fill=0, stroke=1)
    c.line(266, 208, 266, 424)
    c.line(86, 316, 446, 316)
    door(c, 238, 316, 28)
    room_label(c, 176, 365, "OPEN OFFICE", "101")
    room_label(c, 356, 365, "MEETING", "102")
    room_label(c, 176, 255, "STUDIO", "103")
    room_label(c, 356, 255, "SUPPORT", "104")
    dimension(c, 86, 208, 446, 208, "20'-0\"", offset=-30)
    dimension(c, 86, 208, 86, 424, "12'-0\"", offset=-30)
    c.setFillColor(PAPER)
    c.roundRect(548, 118, 194, 400, 10, fill=1, stroke=1)
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(566, 492, "DETAIL 4 - 1 1/2\" = 1'-0\"")
    c.setStrokeColor(INK)
    c.setLineWidth(4)
    c.rect(582, 284, 126, 126, fill=0, stroke=1)
    c.setLineWidth(1)
    for step in range(7):
        inset = 8 + step * 8
        c.line(582 + inset, 284, 582 + inset, 410)
    dimension(c, 582, 284, 708, 284, "14\"", offset=-24)
    c.setFont("Helvetica", 9)
    c.setFillColor(MUTED)
    c.drawString(566, 164, "A single page can contain more than one drawing scale.")
    c.drawString(566, 149, "Verify a second known span before relying on a quantity.")
    c.save()


def draw_takeoff_plan(c: canvas.Canvas, width: float, height: float) -> None:
    x0, y0 = 92, 148
    building_w, building_h = 540, 324  # 30 ft x 18 ft at 18 points per foot
    c.setStrokeColor(INK)
    c.setLineWidth(4)
    c.rect(x0, y0, building_w, building_h, fill=0, stroke=1)
    c.setLineWidth(2)
    c.line(x0 + 270, y0, x0 + 270, y0 + building_h)
    c.line(x0, y0 + 162, x0 + building_w, y0 + 162)
    door(c, x0 + 240, y0 + 162, 30)
    door(c, x0 + 390, y0 + 162, 30)
    room_label(c, x0 + 135, y0 + 245, "ASSEMBLY", "101")
    room_label(c, x0 + 405, y0 + 245, "WORKROOM", "102")
    room_label(c, x0 + 135, y0 + 82, "STORAGE", "103")
    room_label(c, x0 + 405, y0 + 82, "SERVICE", "104")
    for row in range(3):
        for col in range(4):
            diffuser(c, x0 + 84 + col * 120, y0 + 68 + row * 96)
    dimension(c, x0, y0, x0 + building_w, y0, "30'-0\"", offset=-30)
    dimension(c, x0, y0, x0, y0 + building_h, "18'-0\"", offset=-34)
    c.setFillColor(LIGHT)
    c.roundRect(654, 266, 102, 206, 8, fill=1, stroke=0)
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(666, 448, "TAKEOFF KEY")
    c.setFont("Helvetica", 8)
    c.drawString(666, 423, "Floor finish")
    c.drawString(666, 398, "Partition length")
    c.drawString(666, 373, "Supply diffuser")
    diffuser(c, 680, 346)
    c.drawString(696, 343, "12 on plan")
    c.setFont("Helvetica-Oblique", 7)
    c.drawString(666, 302, "Fictional quantities")
    c.drawString(666, 291, "for app demonstration")


def generate_takeoff(path: Path) -> None:
    width, height = landscape(letter)
    c = canvas.Canvas(str(path), pagesize=(width, height), pageCompression=1)
    sheet_frame(c, width, height, sheet="T-101", title="Community Workshop - Takeoff Demonstration Plan", revision="B", scale="1/4\" = 1'-0\"")
    draw_takeoff_plan(c, width, height)
    c.save()


def generate_symbol_count(path: Path) -> None:
    width, height = landscape(letter)
    c = canvas.Canvas(str(path), pagesize=(width, height), pageCompression=1)
    sheet_frame(c, width, height, sheet="M-201", title="Learning Center - Reflected Ceiling Plan", revision="C", scale="1/4\" = 1'-0\"")
    x0, y0, w, h = 66, 130, 570, 354
    c.setStrokeColor(INK)
    c.setLineWidth(3)
    c.rect(x0, y0, w, h, fill=0, stroke=1)
    for x in (x0 + 190, x0 + 380):
        c.setLineWidth(1.5)
        c.line(x, y0, x, y0 + h)
    c.setDash(3, 3)
    c.setLineWidth(0.6)
    for gx in range(int(x0 + 24), int(x0 + w), 48):
        c.line(gx, y0, gx, y0 + h)
    for gy in range(int(y0 + 24), int(y0 + h), 48):
        c.line(x0, gy, x0 + w, gy)
    c.setDash()
    coords = []
    for row in range(3):
        for col in range(4):
            coords.append((x0 + 72 + col * 140, y0 + 72 + row * 102))
    for x, y in coords:
        diffuser(c, x, y, 20)
    c.setFillColor(INK)
    room_label(c, x0 + 95, y0 + 320, "READING", "201")
    room_label(c, x0 + 285, y0 + 320, "CLASSROOM", "202")
    room_label(c, x0 + 475, y0 + 320, "MAKER LAB", "203")
    c.setFillColor(LIGHT)
    c.roundRect(660, 250, 96, 234, 8, fill=1, stroke=0)
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(672, 459, "LEGEND")
    diffuser(c, 682, 428, 20)
    c.setFont("Helvetica", 8)
    c.drawString(699, 425, "Supply air")
    c.drawString(699, 414, "diffuser")
    c.setStrokeColor(INK)
    c.circle(682, 374, 9, fill=0, stroke=1)
    c.drawString(699, 371, "Return air")
    c.setFillColor(RED)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(672, 326, "REVIEW NOTE")
    c.setFillColor(INK)
    c.setFont("Helvetica", 7)
    c.drawString(672, 311, "The legend symbol is a")
    c.drawString(672, 300, "candidate, not a plan item.")
    c.save()


def generate_markup(path: Path) -> None:
    width, height = landscape(letter)
    c = canvas.Canvas(str(path), pagesize=(width, height), pageCompression=1)
    sheet_frame(c, width, height, sheet="A-301", title="Clinic Renovation - Coordination Review Plan", revision="D", scale="1/4\" = 1'-0\"")
    x0, y0, w, h = 72, 132, 618, 350
    c.setStrokeColor(INK)
    c.setLineWidth(3)
    c.rect(x0, y0, w, h, fill=0, stroke=1)
    c.setLineWidth(1.6)
    c.line(x0 + 206, y0, x0 + 206, y0 + h)
    c.line(x0 + 412, y0, x0 + 412, y0 + h)
    c.line(x0, y0 + 175, x0 + w, y0 + 175)
    door(c, x0 + 176, y0 + 175, 30)
    door(c, x0 + 382, y0 + 175, 30)
    room_label(c, x0 + 103, y0 + 265, "EXAM", "301")
    room_label(c, x0 + 309, y0 + 265, "TEAM", "302")
    room_label(c, x0 + 515, y0 + 265, "PROCEDURE", "303")
    room_label(c, x0 + 103, y0 + 88, "SUPPLY", "304")
    room_label(c, x0 + 309, y0 + 88, "CORRIDOR", "305")
    room_label(c, x0 + 515, y0 + 88, "RECOVERY", "306")
    c.setFillColor(LIGHT)
    c.roundRect(708, 132, 48, 350, 8, fill=1, stroke=0)
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 8)
    c.saveState()
    c.translate(736, 156)
    c.rotate(90)
    c.drawString(0, 0, "SYNTHETIC REVIEW ISSUES ARE ADDED IN POLYPDF")
    c.restoreState()
    c.save()


def draw_compare_base(c: canvas.Canvas, width: float, height: float, *, revision: str, changed: bool) -> None:
    title = "Visitor Center - Controlled Revision Comparison"
    sheet_frame(c, width, height, sheet="A-401", title=title, revision=revision, scale="1/4\" = 1'-0\"")
    x0, y0, w, h = 90, 140, 620, 336
    c.setStrokeColor(INK)
    c.setLineWidth(3)
    c.rect(x0, y0, w, h, fill=0, stroke=1)
    c.setLineWidth(1.5)
    c.line(x0 + 230, y0, x0 + 230, y0 + h)
    c.line(x0 + 430, y0, x0 + 430, y0 + h)
    c.line(x0, y0 + 168, x0 + w, y0 + 168)
    door_x = x0 + (335 if changed else 300)
    door(c, door_x, y0 + 168, 34)
    if not changed:
        c.line(x0 + 430, y0 + 168, x0 + 620, y0 + 168)
    else:
        c.setStrokeColor(INK)
        c.circle(x0 + 525, y0 + 84, 20, fill=0, stroke=1)
        c.setFont("Helvetica", 7)
        c.setFillColor(INK)
        c.drawCentredString(x0 + 525, y0 + 80, "SINK")
    c.setFillColor(INK)
    room_label(c, x0 + 115, y0 + 250, "LOBBY", "401")
    room_label(c, x0 + 330, y0 + 250, "GALLERY", "402")
    room_label(c, x0 + 525, y0 + 250, "OFFICE", "403")
    c.setFillColor(AMBER)
    c.setFont("Helvetica-Bold", 8)
    if changed:
        c.drawString(102, 110, "CONTROLLED CHANGES: DOOR MOVED, LOWER PARTITION REMOVED, SINK ADDED")
    else:
        c.drawString(102, 110, "CONTROLLED BASELINE FOR POLYPDF COMPARE DOCUMENTS")


def generate_compare(path_a: Path, path_b: Path) -> None:
    width, height = landscape(letter)
    for path, revision, changed in ((path_a, "A", False), (path_b, "B", True)):
        c = canvas.Canvas(str(path), pagesize=(width, height), pageCompression=1)
        draw_compare_base(c, width, height, revision=revision, changed=changed)
        c.save()


def generate_form(path: Path) -> None:
    width, height = letter
    c = canvas.Canvas(str(path), pagesize=letter, pageCompression=1)
    c.setFillColor(PAPER)
    c.rect(0, 0, width, height, fill=1, stroke=0)
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(44, 744, "Site Inspection Checklist")
    c.setFont("Helvetica", 9)
    c.setFillColor(MUTED)
    c.drawString(44, 726, "Fictional form built for PolyPDF field-authoring evidence")
    form = c.acroForm

    def label(text: str, x: float, y: float) -> None:
        c.setFont("Helvetica-Bold", 8)
        c.setFillColor(INK)
        c.drawString(x, y, text)

    label("Project name", 44, 688)
    form.textfield(name="project_name", tooltip="Project name", x=44, y=660, width=244, height=22, borderStyle="solid", borderColor=BLUE, fillColor=colors.white, textColor=INK, forceBorder=True)
    label("Inspector", 310, 688)
    form.textfield(name="inspector", tooltip="Inspector", x=310, y=660, width=236, height=22, borderStyle="solid", borderColor=BLUE, fillColor=colors.white, textColor=INK, forceBorder=True)
    label("Inspection notes", 44, 626)
    form.textfield(name="inspection_notes", tooltip="Inspection notes", x=44, y=548, width=502, height=70, borderStyle="solid", borderColor=BLUE, fillColor=colors.white, textColor=INK, forceBorder=True, fieldFlags="multiline")
    label("Site status", 44, 512)
    form.choice(name="site_status", tooltip="Site status", value="In progress", options=["Not started", "In progress", "Ready for review", "Closed"], x=44, y=482, width=190, height=24, borderColor=BLUE, fillColor=colors.white, textColor=INK, forceBorder=True)
    label("Discipline", 262, 512)
    form.choice(name="discipline", tooltip="Discipline", value="Architectural", options=["Architectural", "Structural", "Mechanical", "Electrical", "Plumbing"], x=262, y=430, width=180, height=76, borderColor=BLUE, fillColor=colors.white, textColor=INK, forceBorder=True, fieldFlags="multiSelect")
    label("Result", 44, 448)
    for idx, value in enumerate(("Pass", "Needs work", "Not applicable")):
        y = 418 - idx * 28
        form.radio(name="result", value=value, tooltip=f"Result: {value}", selected=(idx == 1), x=48, y=y, buttonStyle="circle", borderColor=BLUE, fillColor=colors.white, textColor=TEAL)
        c.setFont("Helvetica", 9)
        c.setFillColor(INK)
        c.drawString(68, y + 4, value)
    label("Checks", 262, 400)
    checks = ["Access clear", "Protection installed", "Photo attached", "Follow-up assigned"]
    for idx, text in enumerate(checks):
        y = 368 - idx * 30
        form.checkbox(name=f"check_{idx + 1}", tooltip=text, x=264, y=y, buttonStyle="check", borderColor=BLUE, fillColor=colors.white, textColor=TEAL, checked=idx < 2)
        c.setFont("Helvetica", 9)
        c.setFillColor(INK)
        c.drawString(286, y + 4, text)
    c.setFillColor(LIGHT)
    c.roundRect(44, 92, 502, 110, 8, fill=1, stroke=0)
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(60, 175, "Form evidence checklist")
    c.setFont("Helvetica", 8)
    for idx, text in enumerate((
        "Text and multiline text fields have unique names and tooltips.",
        "Choice fields demonstrate combo and list-style controls.",
        "Radio buttons share one group; checkboxes are independent.",
        "All names and values are fictional.",
    )):
        c.drawString(60, 155 - idx * 17, f"- {text}")
    c.setFont("Helvetica-Bold", 9)
    c.drawRightString(546, 56, "FORM-001 | TEST COPY")
    c.save()


def generate_signature_sheet(path: Path) -> None:
    width, height = landscape(letter)
    c = canvas.Canvas(str(path), pagesize=(width, height), pageCompression=1)
    sheet_frame(c, width, height, sheet="S-001", title="Signature, Visual Mark, and Seal Acceptance Sheet", revision="TEST", scale="NTS")
    columns = [52, 295, 538]
    titles = ["CERTIFICATE SIGNATURE", "VISUAL SIGNATURE", "PROFESSIONAL SEAL"]
    notes = ["Cryptographic integrity test", "Appearance only - no certificate", "Drafting artwork - no signature"]
    for idx, x in enumerate(columns):
        c.setFillColor(LIGHT)
        c.roundRect(x, 150, 208, 330, 12, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 11)
        c.drawCentredString(x + 104, 448, titles[idx])
        c.setFont("Helvetica", 8)
        c.drawCentredString(x + 104, 431, notes[idx])
        c.setStrokeColor(MUTED)
        c.setDash(5, 3)
        c.rect(x + 24, 252, 160, 90, fill=0, stroke=1)
        c.setDash()
        c.setFont("Helvetica-Bold", 14)
        c.setFillColor(RED)
        c.drawCentredString(x + 104, 292, "TEST / NOT VALID")
        c.setFillColor(INK)
        c.setFont("Helvetica", 7)
        c.drawCentredString(x + 104, 179, "Synthetic identity: Alex Example")
    c.save()


def make_raster_sample() -> bytes:
    image = Image.new("RGB", (840, 170), "#F4EFE5")
    draw = ImageDraw.Draw(image)
    font = ImageFont.load_default()
    draw.rectangle((4, 4, 835, 165), outline="#9A4A37", width=5)
    draw.text((28, 30), "RASTER IMAGE SAMPLE", fill="#57231C", font=font)
    draw.text((28, 74), "IMAGE-ID: IMG-5573", fill="#57231C", font=font)
    draw.text((28, 116), "Pixels require independent verification", fill="#57231C", font=font)
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def add_file_attachment_annotation(writer: PdfWriter, page_index: int = 0) -> None:
    payload = b"Synthetic attachment for PolyPDF sanitation verification.\n"
    embedded = DictionaryObject({
        NameObject("/Type"): NameObject("/EmbeddedFile"),
        NameObject("/Length"): NumberObject(len(payload)),
    })
    embedded._data = payload  # pypdf serializes StreamObject-compatible data through this field.
    from pypdf.generic import DecodedStreamObject

    stream = DecodedStreamObject()
    stream.set_data(payload)
    stream_ref = writer._add_object(stream)
    file_spec = DictionaryObject({
        NameObject("/Type"): NameObject("/Filespec"),
        NameObject("/F"): TextStringObject("synthetic-note.txt"),
        NameObject("/EF"): DictionaryObject({NameObject("/F"): stream_ref}),
    })
    file_ref = writer._add_object(file_spec)
    annotation = DictionaryObject({
        NameObject("/Type"): NameObject("/Annot"),
        NameObject("/Subtype"): NameObject("/FileAttachment"),
        NameObject("/Rect"): ArrayObject([FloatObject(510), FloatObject(110), FloatObject(535), FloatObject(135)]),
        NameObject("/FS"): file_ref,
        NameObject("/Contents"): TextStringObject("Synthetic attachment"),
        NameObject("/Name"): NameObject("/Paperclip"),
    })
    page = writer.pages[page_index]
    annots = page.get("/Annots")
    if annots is None:
        annots = ArrayObject()
        page[NameObject("/Annots")] = annots
    annots.append(writer._add_object(annotation))


def generate_redaction(path: Path) -> None:
    width, height = letter
    base = path.with_suffix(".base.pdf")
    raster = make_raster_sample()
    c = canvas.Canvas(str(base), pagesize=letter, pageCompression=1)
    c.setFillColor(PAPER)
    c.rect(0, 0, width, height, fill=1, stroke=0)
    c.setFillColor(RED)
    c.roundRect(42, 720, 528, 34, 6, fill=0, stroke=1)
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(width / 2, 733, "SYNTHETIC REDACTION LAB - NO REAL PERSONAL DATA")
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(42, 682, "Controlled content classes")
    c.setFont("Helvetica", 10)
    c.drawString(42, 646, "SEARCHABLE TEST STRING: CASE-ORCHID-742")
    c.drawString(42, 626, "FICTIONAL NAME: TEST PERSON")
    c.drawString(42, 606, "FICTIONAL PHONE: 555-0107")
    c.setFillColor(LIGHT)
    c.roundRect(42, 494, 528, 82, 8, fill=1, stroke=0)
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(58, 550, "Supported-text verification target")
    c.setFont("Helvetica", 9)
    c.drawString(58, 528, "Mark CASE-ORCHID-742, apply redaction, save a copy, reopen, and search again.")
    c.drawString(58, 509, "A missing search hit proves only this controlled string and this search path.")
    c.drawImage(ImageReader(io.BytesIO(raster)), 42, 328, width=528, height=106, preserveAspectRatio=True, mask="auto")
    c.beginForm("NestedRasterExample", 0, 0, 528, 110)
    c.drawImage(ImageReader(io.BytesIO(raster)), 0, 0, width=528, height=106, preserveAspectRatio=True, mask="auto")
    c.endForm()
    c.saveState()
    c.translate(42, 168)
    c.doForm("NestedRasterExample")
    c.restoreState()
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(42, 446, "TOP-LEVEL IMAGE XOBJECT")
    c.drawString(42, 286, "IMAGE NESTED IN A FORM XOBJECT")
    c.setFont("Helvetica", 7)
    c.drawString(42, 145, "Document also contains synthetic metadata, JavaScript, and a direct FileAttachment annotation for sanitation testing.")
    c.save()

    reader = PdfReader(str(base))
    writer = PdfWriter()
    writer.clone_document_from_reader(reader)
    writer.add_metadata({
        "/Title": "Synthetic Redaction Lab",
        "/Author": "PolyPDF Evidence Lab",
        "/Subject": "Controlled security-workflow screenshot fixture",
        "/Keywords": "CASE-ORCHID-742 synthetic metadata",
    })
    writer.add_js("app.alert('Synthetic test action');")
    add_file_attachment_annotation(writer)
    with path.open("wb") as output:
        writer.write(output)
    base.unlink()


def draw_issue_page(c: canvas.Canvas, width: float, height: float, *, sheet: str, title: str, index: int) -> None:
    sheet_frame(c, width, height, sheet=sheet, title=title, revision="ISSUE 02", scale="AS NOTED")
    c.setFillColor(INK)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(62, height - 92, title.upper())
    c.setFont("Helvetica", 9)
    c.setFillColor(MUTED)
    c.drawString(62, height - 110, f"Sheet {index} of 5 - fictional issue set")
    c.setStrokeColor(INK)
    c.setLineWidth(2)
    x0, y0 = 86, 148
    if index == 1:
        c.roundRect(x0, y0, 610, 320, 16, fill=0, stroke=1)
        c.setFont("Helvetica-Bold", 30)
        c.setFillColor(INK)
        c.drawCentredString(391, 340, "ISSUE 02 - REVIEW SET")
        c.setFont("Helvetica", 11)
        c.drawCentredString(391, 310, "Synthetic five-sheet drawing package")
    else:
        c.rect(x0, y0, 610, 320, fill=0, stroke=1)
        for row in range(1, 4):
            c.line(x0, y0 + row * 80, x0 + 610, y0 + row * 80)
        for col in range(1, 5):
            c.line(x0 + col * 122, y0, x0 + col * 122, y0 + 320)
        c.setFont("Helvetica-Bold", 14)
        c.setFillColor(INK)
        c.drawCentredString(391, 302, f"{sheet} CONTROLLED DRAWING CONTENT")


def generate_issued_set(path: Path) -> None:
    width, height = landscape(letter)
    pages = [
        ("G-001", "Cover and Sheet Index"),
        ("A-101", "Floor Plan"),
        ("A-201", "Building Elevations"),
        ("M-101", "Mechanical Plan"),
        ("E-101", "Electrical Plan"),
    ]
    c = canvas.Canvas(str(path), pagesize=(width, height), pageCompression=1)
    for index, (sheet, title) in enumerate(pages, start=1):
        draw_issue_page(c, width, height, sheet=sheet, title=title, index=index)
        c.bookmarkPage(sheet)
        c.addOutlineEntry(f"{sheet} - {title}", sheet, level=0, closed=False)
        c.showPage()
    c.save()


def generate_plugin_sheet(path: Path) -> None:
    width, height = landscape(letter)
    c = canvas.Canvas(str(path), pagesize=(width, height), pageCompression=1)
    sheet_frame(c, width, height, sheet="P-001", title="Plugin Output Reference Sheet", revision="TEST", scale="NTS")
    zones = [
        (54, 150, 218, 330, "AISC STEEL SECTION", "Vector polygon output"),
        (287, 150, 218, 330, "PROFESSIONAL SEAL", "Test drafting artwork"),
        (520, 150, 218, 330, "PDF MAP", "OpenStreetMap image output"),
    ]
    for x, y, w, h, title, subtitle in zones:
        c.setFillColor(LIGHT)
        c.roundRect(x, y, w, h, 12, fill=1, stroke=0)
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 11)
        c.drawCentredString(x + w / 2, y + h - 35, title)
        c.setFont("Helvetica", 8)
        c.drawCentredString(x + w / 2, y + h - 52, subtitle)
        c.setStrokeColor(MUTED)
        c.setDash(6, 4)
        c.rect(x + 24, y + 78, w - 48, 176, fill=0, stroke=1)
        c.setDash()
        c.setFont("Helvetica-Bold", 12)
        c.setFillColor(RED)
        c.drawCentredString(x + w / 2, y + 48, "TEST CONTENT")
    c.save()


def image_to_pdf(image_path: Path, output_path: Path, page_size: tuple[float, float], *, label: str) -> None:
    width, height = page_size
    c = canvas.Canvas(str(output_path), pagesize=page_size, pageCompression=1)
    image = Image.open(image_path)
    c.drawImage(ImageReader(image), 0, 0, width=width, height=height, preserveAspectRatio=False, mask="auto")
    c.setFillColor(colors.Color(1, 1, 1, alpha=0.88))
    c.rect(18, 12, min(width - 36, 620), 22, fill=1, stroke=0)
    c.setFillColor(INK)
    c.setFont("Helvetica", 6.5)
    c.drawString(24, 20, label)
    c.save()


def nasa_page_to_image_only(source_pdf: Path, output_path: Path) -> None:
    from pdf2image import convert_from_path

    pages = convert_from_path(str(source_pdf), dpi=180, first_page=6, last_page=6, fmt="png")
    if len(pages) != 1:
        raise RuntimeError("Expected exactly one rendered NASA source page")
    image = pages[0].convert("RGB")
    width, height = image.size
    c = canvas.Canvas(str(output_path), pagesize=(width * 72 / 180, height * 72 / 180), pageCompression=1)
    c.drawImage(ImageReader(image), 0, 0, width=width * 72 / 180, height=height * 72 / 180, preserveAspectRatio=False)
    c.save()


def validate_pdf(path: Path) -> dict[str, object]:
    reader = PdfReader(str(path))
    if not reader.pages:
        raise RuntimeError(f"{path.name} contains no pages")
    return {"file": path.name, "pages": len(reader.pages), "sha256": sha256(path), "bytes": path.stat().st_size}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--uva-tiff", required=True, type=Path)
    parser.add_argument("--piedmont-tiff", required=True, type=Path)
    parser.add_argument("--nasa-pdf", required=True, type=Path)
    args = parser.parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)

    outputs = {
        "measurement-diagnostics.pdf": generate_measurement_diagnostics,
        "takeoff-demo.pdf": generate_takeoff,
        "symbol-count-demo.pdf": generate_symbol_count,
        "markup-coordination-demo.pdf": generate_markup,
        "form-inspection-checklist.pdf": generate_form,
        "signature-seal-test-sheet.pdf": generate_signature_sheet,
        "redaction-lab.pdf": generate_redaction,
        "issued-set.pdf": generate_issued_set,
        "plugin-reference-sheet.pdf": generate_plugin_sheet,
    }
    for name, generator in outputs.items():
        generator(args.output_dir / name)
    generate_compare(args.output_dir / "compare-rev-a.pdf", args.output_dir / "compare-rev-b.pdf")
    image_to_pdf(
        args.uva_tiff,
        args.output_dir / "habs-uva-pavilion-sheet-3.pdf",
        (34 * 72, 27 * 72),
        label="Source: Library of Congress HABS VA-1554, sheet 3. Public-domain measured drawing; TIFF converted to PDF for this demonstration.",
    )
    image_to_pdf(
        args.piedmont_tiff,
        args.output_dir / "hals-piedmont-way-sheet-2.pdf",
        (36 * 72, 24 * 72),
        label="Source: Library of Congress HALS CA-2, sheet 2. Public-domain measured drawing; TIFF converted to PDF for this demonstration.",
    )
    nasa_page_to_image_only(args.nasa_pdf, args.output_dir / "nasa-akron-page-6-image-only.pdf")

    records = [validate_pdf(path) for path in sorted(args.output_dir.glob("*.pdf"))]
    print("Generated and parsed:")
    for record in records:
        print(f"- {record['file']}: {record['pages']} page(s), {record['bytes']} bytes, {record['sha256']}")


if __name__ == "__main__":
    main()
