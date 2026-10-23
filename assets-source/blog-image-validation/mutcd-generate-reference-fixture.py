#!/usr/bin/env python3
from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import landscape, letter
from reportlab.pdfgen import canvas


OUTPUT = Path(__file__).resolve().parent / "fixtures" / "mutcd-r1-1-reference-sheet.pdf"


def rounded_panel(pdf, x, y, width, height, fill, stroke="#9AA8B2", radius=12):
    pdf.setFillColor(HexColor(fill))
    pdf.setStrokeColor(HexColor(stroke))
    pdf.setLineWidth(1)
    pdf.roundRect(x, y, width, height, radius, fill=1, stroke=1)


def draw():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    width, height = landscape(letter)
    pdf = canvas.Canvas(str(OUTPUT), pagesize=(width, height), pageCompression=1)
    pdf.setTitle("PolyPDF MUTCD R1-1 Reference Sheet - Fictional Demonstration")
    pdf.setAuthor("PolyPDF Evidence Lab")
    pdf.setSubject("Owned fixture for truthful MUTCD toolchest and placement screenshots")
    pdf.setCreator("PolyPDF blog-image validation fixture generator")

    ink = HexColor("#17232B")
    muted = HexColor("#526572")
    accent = HexColor("#167C9B")
    red = HexColor("#B13B2E")
    pale = "#EEF3F5"

    pdf.setFillColor(HexColor("#FFFFFF"))
    pdf.rect(0, 0, width, height, fill=1, stroke=0)
    pdf.setStrokeColor(ink)
    pdf.setLineWidth(1.2)
    pdf.rect(22, 22, width - 44, height - 44, fill=0, stroke=1)

    pdf.setFillColor(ink)
    pdf.setFont("Helvetica-Bold", 10)
    pdf.drawString(42, height - 48, "POLYPDF EVIDENCE LAB / OWNED TRAFFIC-CONTROL FIXTURE")
    pdf.setFillColor(accent)
    pdf.setFont("Helvetica-Bold", 8)
    pdf.drawRightString(width - 42, height - 48, "CURRENT-APP SCREENSHOT VALIDATION")
    pdf.setStrokeColor(HexColor("#CBD5DB"))
    pdf.setLineWidth(0.8)
    pdf.line(42, height - 59, width - 42, height - 59)

    pdf.setFillColor(ink)
    pdf.setFont("Helvetica-Bold", 24)
    pdf.drawCentredString(width / 2, height - 98, "MUTCD REGULATORY SIGN")
    pdf.setFillColor(red)
    pdf.setFont("Helvetica-Bold", 17)
    pdf.drawCentredString(width / 2, height - 123, "R1-1 STOP DEMONSTRATION")
    pdf.setFillColor(muted)
    pdf.setFont("Helvetica", 9.5)
    pdf.drawCentredString(
        width / 2,
        height - 143,
        "Place the built-in R1-1 symbol in the marked target below to demonstrate a real toolchest workflow.",
    )

    rounded_panel(pdf, 42, 94, 168, 278, pale)
    pdf.setFillColor(ink)
    pdf.setFont("Helvetica-Bold", 11)
    pdf.drawString(58, 347, "WORKFLOW")
    pdf.setFillColor(muted)
    pdf.setFont("Helvetica", 9)
    workflow_lines = [
        "1  Open Tools",
        "2  Expand MUTCD Regulatory",
        "3  Select R1-1 Stop",
        "4  Verify the placed vector sign",
    ]
    line_y = 322
    for line in workflow_lines:
        pdf.drawString(58, line_y, line)
        line_y -= 29
    pdf.setStrokeColor(HexColor("#C3CED4"))
    pdf.line(58, 205, 194, 205)
    pdf.setFillColor(ink)
    pdf.setFont("Helvetica-Bold", 9)
    pdf.drawString(58, 185, "EXPECTED RESULT")
    pdf.setFillColor(muted)
    pdf.setFont("Helvetica", 8.5)
    pdf.drawString(58, 167, "A selected red octagonal STOP sign")
    pdf.drawString(58, 153, "inside the R1-1 target area.")
    pdf.setFillColor(red)
    pdf.setFont("Helvetica-Bold", 8)
    pdf.drawString(58, 118, "TEST CONTENT - NOT FOR FIELD USE")

    target_x, target_y, target_w, target_h = 246, 138, 300, 234
    rounded_panel(pdf, target_x, target_y, target_w, target_h, "#F7F9FA", stroke="#718592", radius=16)
    pdf.setFillColor(ink)
    pdf.setFont("Helvetica-Bold", 11)
    pdf.drawCentredString(target_x + target_w / 2, target_y + target_h - 27, "R1-1 PLACEMENT TARGET")
    pdf.setFillColor(muted)
    pdf.setFont("Helvetica", 8.5)
    pdf.drawCentredString(target_x + target_w / 2, target_y + target_h - 44, "72 pt long edge / centered on this owned sheet")
    pdf.setStrokeColor(HexColor("#607581"))
    pdf.setLineWidth(1.6)
    pdf.setDash(6, 5)
    pdf.rect(306, 216, 180, 144, fill=0, stroke=1)
    pdf.setDash()
    pdf.setFillColor(HexColor("#92A2AB"))
    pdf.setFont("Helvetica-Bold", 8)
    pdf.drawCentredString(width / 2, 202, "PLACE R1-1 STOP HERE")

    rounded_panel(pdf, 582, 94, 168, 278, pale)
    pdf.setFillColor(ink)
    pdf.setFont("Helvetica-Bold", 11)
    pdf.drawString(598, 347, "PROVENANCE")
    pdf.setFillColor(muted)
    pdf.setFont("Helvetica", 8.5)
    provenance_lines = [
        "Sign artwork in PolyPDF:",
        "FHWA Standard Highway Signs",
        "2024 edition, regulatory series.",
        "",
        "Demonstration sheet:",
        "PolyPDF-owned fictional fixture.",
        "No agency or customer data.",
    ]
    line_y = 322
    for line in provenance_lines:
        pdf.drawString(598, line_y, line)
        line_y -= 18
    pdf.setStrokeColor(HexColor("#C3CED4"))
    pdf.line(598, 181, 734, 181)
    pdf.setFillColor(ink)
    pdf.setFont("Helvetica-Bold", 9)
    pdf.drawString(598, 161, "USE LIMIT")
    pdf.setFillColor(muted)
    pdf.setFont("Helvetica", 8.5)
    pdf.drawString(598, 143, "Screenshot validation only.")
    pdf.drawString(598, 129, "Not a traffic-control plan.")
    pdf.setFillColor(red)
    pdf.setFont("Helvetica-Bold", 8)
    pdf.drawString(598, 108, "FICTIONAL DEMONSTRATION")

    pdf.setStrokeColor(HexColor("#CBD5DB"))
    pdf.setLineWidth(0.8)
    pdf.line(42, 74, width - 42, 74)
    pdf.setFillColor(ink)
    pdf.setFont("Helvetica-Bold", 8.5)
    pdf.drawString(42, 56, "SHEET: MUTCD-R1-1-DEMO")
    pdf.setFillColor(muted)
    pdf.setFont("Helvetica", 8)
    pdf.drawCentredString(width / 2, 56, "SCALE: NTS  |  REVISION: TEST  |  2026-08-19")
    pdf.drawRightString(width - 42, 56, "1 / 1")

    pdf.showPage()
    pdf.save()


if __name__ == "__main__":
    draw()
    print(OUTPUT)
