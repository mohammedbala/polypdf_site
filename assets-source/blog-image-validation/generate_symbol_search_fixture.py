#!/usr/bin/env python3
"""Generate the owned five-symbol fixture used for release screenshot evidence."""

from pathlib import Path
import sys

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas


output = Path(sys.argv[1] if len(sys.argv) > 1 else "/tmp/polypdf-symbol-search-fixture.pdf")
output.parent.mkdir(parents=True, exist_ok=True)
page_width, page_height = letter
symbol_size = 40
anchors = [(100, 100), (250, 100), (400, 100), (100, 250), (250, 250)]


def draw_symbol(pdf: canvas.Canvas, x: float, top: float, size: float) -> None:
    stroke = max(2, size / 20)
    bottom = page_height - top - size
    pdf.setLineWidth(stroke)
    pdf.rect(x, bottom, size, size, fill=0, stroke=1)
    pdf.line(x, page_height - top, x + size, bottom)
    block = size / 4
    pdf.rect(x + stroke * 2, page_height - top - stroke * 2 - block, block, block, fill=1, stroke=0)


pdf = canvas.Canvas(str(output), pagesize=letter, pageCompression=0)
pdf.setTitle("Owned PolyPDF Symbol Search Fixture")
pdf.setAuthor("PolyPDF Evidence Lab")
for anchor in anchors:
    draw_symbol(pdf, *anchor, symbol_size)
draw_symbol(pdf, 180, 430, 260)
pdf.save()
print(output)
