#!/usr/bin/env python3
"""Generate a synthetic, deliberately supported redaction proof page.

The current text redactor requires a directly editable, unfiltered page content stream and refuses
pages that draw through Form XObjects. The separate sanitation fixture intentionally keeps those
harder structures; this one isolates the supported text-removal path without real personal data.
"""

from __future__ import annotations

import io
import os
from pathlib import Path

from PIL import Image, ImageDraw
from pypdf import PdfReader
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import letter
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas


OUTPUT = Path(
    os.environ.get(
        "POLYPDF_REDACTION_FIXTURE_OUTPUT",
        Path(__file__).resolve().parent / "redaction-output" / "redaction-supported-working.pdf",
    )
)
TARGET = "CASE-ORCHID-742"


def raster_sample() -> bytes:
    image = Image.new("RGB", (720, 150), "#F1E9DE")
    draw = ImageDraw.Draw(image)
    draw.rectangle((4, 4, 715, 145), outline="#A5523B", width=5)
    draw.text((28, 28), "TOP-LEVEL RASTER IMAGE - NOT THE TEXT TARGET", fill="#7F4434")
    draw.text((28, 76), "IMAGE-ID: REDACTION-DEMO-001", fill="#7F4434")
    draw.text((28, 112), "Image pixels require independent review.", fill="#7F4434")
    payload = io.BytesIO()
    image.save(payload, format="PNG")
    return payload.getvalue()


def generate() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    width, height = letter
    ink = HexColor("#17222C")
    muted = HexColor("#52606C")
    paper = HexColor("#FAFAF7")
    pale = HexColor("#EAF0F2")
    red = HexColor("#AD3D2B")

    pdf = canvas.Canvas(str(OUTPUT), pagesize=letter, pageCompression=0)
    pdf.setTitle("Synthetic Supported Redaction Demonstration")
    pdf.setAuthor("PolyPDF Evidence Lab")
    pdf.setSubject("Fictional redaction workflow proof")
    pdf.setFillColor(paper)
    pdf.rect(0, 0, width, height, fill=1, stroke=0)

    pdf.setStrokeColor(red)
    pdf.setLineWidth(1.2)
    pdf.roundRect(42, 720, 528, 34, 6, fill=0, stroke=1)
    pdf.setFillColor(red)
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawCentredString(width / 2, 733, "SYNTHETIC REDACTION DEMO - NO REAL PERSONAL DATA")

    pdf.setFillColor(ink)
    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawString(42, 680, "Supported native-text removal")
    pdf.setFont("Helvetica", 11)
    pdf.drawString(42, 640, f"SEARCHABLE TARGET: {TARGET}")
    pdf.drawString(42, 616, "FICTIONAL CONTACT: TEST PERSON / 555-0107")

    pdf.setFillColor(pale)
    pdf.roundRect(42, 494, 528, 88, 8, fill=1, stroke=0)
    pdf.setFillColor(ink)
    pdf.setFont("Helvetica-Bold", 10)
    pdf.drawString(58, 552, "What this proof covers")
    pdf.setFont("Helvetica", 9)
    pdf.drawString(58, 530, "Mark the searchable token above, apply the redaction, save, reopen, and search again.")
    pdf.drawString(58, 511, "A missing hit proves removal of this selected native text - not every content class.")

    pdf.drawImage(
        ImageReader(io.BytesIO(raster_sample())),
        42,
        318,
        width=528,
        height=110,
        preserveAspectRatio=True,
        mask="auto",
    )
    pdf.setFillColor(muted)
    pdf.setFont("Helvetica-Bold", 8)
    pdf.drawString(42, 444, "SEPARATE TOP-LEVEL IMAGE XOBJECT")

    pdf.setStrokeColor(HexColor("#B8C2C8"))
    pdf.line(42, 276, 570, 276)
    pdf.setFillColor(muted)
    pdf.setFont("Helvetica", 8)
    pdf.drawString(42, 252, "Supported fixture: direct unfiltered page text; no reusable Form XObjects.")
    pdf.drawString(42, 235, "The image is outside the marked region and remains for independent pixel review.")
    pdf.drawString(42, 218, "Fictional demonstration only. Not for production privacy decisions.")
    pdf.save()

    reader = PdfReader(str(OUTPUT))
    page = reader.pages[0]
    contents = page.get_contents()
    if contents is None:
        raise RuntimeError("Generated fixture has no page content stream")
    if contents.get("/Filter") is not None:
        raise RuntimeError("Generated page content stream unexpectedly has a filter")
    xobjects = page.get("/Resources", {}).get("/XObject", {})
    subtypes = [str(item.get_object().get("/Subtype")) for item in xobjects.values()]
    if "/Form" in subtypes:
        raise RuntimeError("Generated supported fixture unexpectedly contains a Form XObject")
    if "/Image" not in subtypes:
        raise RuntimeError("Generated fixture should contain one separate Image XObject")
    extracted = "".join(part or "" for part in (candidate.extract_text() for candidate in reader.pages))
    if extracted.count(TARGET) != 1:
        raise RuntimeError("Generated target must appear exactly once before redaction")


if __name__ == "__main__":
    generate()
    print(OUTPUT)
