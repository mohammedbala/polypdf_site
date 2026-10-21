"""Deterministic German construction examples for redaction and sanitation."""
from io import BytesIO
from pathlib import Path
import hashlib
import json

from PIL import Image, ImageDraw
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A3, landscape
from reportlab.lib.utils import ImageReader
from pypdf import PdfReader, PdfWriter
from pypdf.generic import (ArrayObject, DictionaryObject, FloatObject, NameObject,
                          NumberObject, TextStringObject, DecodedStreamObject)

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public/localized-media/de/samples/redaction'
OUT.mkdir(parents=True, exist_ok=True)
TOKEN = 'VORGANG-LINDE-742'
PAGE = landscape(A3)
REGION = {'x': 795, 'y': 571, 'width': 280, 'height': 32}


def raster():
    image = Image.new('RGB', (480, 220), '#e8edf0')
    draw = ImageDraw.Draw(image)
    draw.rectangle((25, 35, 455, 195), fill='#d0d8dc', outline='#3c5663', width=4)
    for x in range(50, 430, 80):
        draw.rectangle((x, 65, x+55, 140), fill='#ffffff', outline='#3c5663', width=4)
        draw.line((x+28, 65, x+28, 140), fill='#3c5663', width=2)
    draw.line((15, 198, 465, 198), fill='#3c5663', width=4)
    return image


def create(kind):
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=PAGE, invariant=1, pageCompression=1, lang='de-DE')
    c.setTitle('Bürgerhaus Lindenhof - ' + ('Schwärzungsübung' if kind == 'redaction' else 'Bereinigungsübung'))
    c.setAuthor('Fiktives Planungsbüro Lindenhof')
    c.setSubject('Demonstration Deutschland; keine Ausführungsplanung')
    w, h = PAGE
    c.setStrokeColorRGB(.16, .22, .26)
    c.setLineWidth(.8)
    c.rect(30, 30, w-60, h-60)
    c.setFillColorRGB(.10, .18, .23)
    c.setFont('Helvetica-Bold', 24)
    c.drawString(55, h-75, 'BÜRGERHAUS LINDENHOF')
    c.setFont('Helvetica', 12)
    c.drawString(55, h-97, 'Fiktiver Umbau in Deutschland | Planprüfung | 21.10.2026')
    c.setFont('Helvetica-Bold', 12)
    c.drawRightString(w-55, h-75, 'A-101 / ÜBUNG')
    c.setFont('Helvetica', 11)
    c.drawRightString(w-55, h-96, 'DIN A3 | 1:100 | Maße in Metern')
    # Physical plan: 24 m × 12 m at 1:100 (1 m = 28.3464567 PDF points).
    unit = 72 / 2.54
    x, y, pw, ph = 65, 300, 24*unit, 12*unit
    c.setLineWidth(2)
    c.rect(x, y, pw, ph)
    c.line(x+14*unit, y, x+14*unit, y+ph)
    c.line(x+14*unit, y+6*unit, x+pw, y+6*unit)
    c.setLineWidth(.6)
    for a, b, label in [(x, x+pw, '24,00 m')]:
        c.line(a, y+ph+25, b, y+ph+25)
        c.line(a, y+ph+16, a, y+ph+34)
        c.line(b, y+ph+16, b, y+ph+34)
        c.setFont('Helvetica', 12)
        c.drawCentredString((a+b)/2, y+ph+31, label)
    c.saveState()
    c.translate(x-20, y+ph/2)
    c.rotate(90)
    c.drawCentredString(0, 0, '12,00 m')
    c.restoreState()
    for label, cx, cy in [('MEHRZWECKRAUM', x+7*unit, y+6*unit),
                          ('BESPRECHUNG', x+19*unit, y+9*unit),
                          ('WERKRAUM', x+19*unit, y+3*unit)]:
        c.setFont('Helvetica-Bold', 14)
        c.drawCentredString(cx, cy, label)
    c.setFont('Helvetica', 11)
    c.drawString(65, 275, 'Grundriss - vereinfachte Übungsgeometrie | Außenfläche: 288,00 m²')
    c.setFont('Helvetica-Bold', 13)
    c.drawString(800, 655, 'PRÜFVERMERK / DEMONSTRATION')
    c.setFont('Helvetica', 11)
    c.drawString(800, 625, 'Fiktive Vorgangskennung:')
    c.setFont('Helvetica-Bold', 18)
    c.drawString(800, 580, TOKEN)
    c.setFont('Helvetica', 11)
    for i, text in enumerate(['Nur diese Kennung ist das Schwärzungsziel.',
                              'Sie liegt als auswählbarer Seitentext vor.',
                              'Rasterdetails und Planlinien bleiben erhalten.',
                              'Die Quelle bleibt als separate Datei erhalten.']):
        c.drawString(800, 542-i*20, text)
    c.drawImage(ImageReader(raster()), 65, 120, width=240, height=110)
    c.drawString(65, 103, 'Rasterdetail: schematische Fassade')
    if kind == 'sanitize':
        c.beginForm('RasterdetailImFormular', 0, 0, 240, 110)
        c.drawImage(ImageReader(raster()), 0, 0, width=240, height=110)
        c.endForm()
        c.saveState()
        c.translate(380, 120)
        c.doForm('RasterdetailImFormular')
        c.restoreState()
        c.drawString(380, 103, 'Rasterdetail in wiederverwendbarem Form-XObject')
    else:
        c.drawString(380, 190, 'Übungsablauf: Kennung suchen, Bereich schwärzen,')
        c.drawString(380, 170, 'neue PDF speichern, vollständig schließen und neu öffnen.')
        c.drawString(380, 150, 'Danach den gespeicherten Text unabhängig prüfen.')
    c.setFont('Helvetica-Bold', 10)
    c.drawString(55, 58, 'FIKTIVES BEISPIEL - NICHT ZUR BAUAUSFÜHRUNG - KEIN NORMENNACHWEIS')
    c.save()
    reader = PdfReader(BytesIO(buffer.getvalue()))
    writer = PdfWriter()
    writer.clone_document_from_reader(reader)
    writer.root_object[NameObject('/Lang')] = TextStringObject('de-DE')
    if kind == 'sanitize':
        # Harmless name-tree JavaScript, plus an intentionally direct page attachment.
        writer.add_js('void(0);')
        # pypdf gives add_js a random name; use a deterministic synthetic key.
        writer.root_object['/Names']['/JavaScript']['/Names'][0] = TextStringObject('DemoBereinigung')
        payload = DecodedStreamObject()
        payload.set_data('Fiktive deutsche Prüfnotiz. Kein Kundendokument.\n'.encode())
        payload[NameObject('/Type')] = NameObject('/EmbeddedFile')
        spec = DictionaryObject({NameObject('/Type'): NameObject('/Filespec'),
                                 NameObject('/F'): TextStringObject('pruefnotiz.txt'),
                                 NameObject('/UF'): TextStringObject('pruefnotiz.txt'),
                                 NameObject('/EF'): DictionaryObject({NameObject('/F'): writer._add_object(payload)})})
        annotation = DictionaryObject({NameObject('/Type'): NameObject('/Annot'),
                                       NameObject('/Subtype'): NameObject('/FileAttachment'),
                                       NameObject('/Rect'): ArrayObject([FloatObject(n) for n in [790, 385, 812, 407]]),
                                       NameObject('/FS'): writer._add_object(spec),
                                       NameObject('/Name'): NameObject('/Paperclip'),
                                       NameObject('/Contents'): TextStringObject('Fiktive Prüfnotiz als direkter Seitenanhang'),
                                       NameObject('/F'): NumberObject(4)})
        writer.pages[0][NameObject('/Annots')] = ArrayObject([writer._add_object(annotation)])
    name = 'pruefplan-schwaerzen.pdf' if kind == 'redaction' else 'pruefplan-bereinigen.pdf'
    with (OUT/name).open('wb') as stream:
        writer.write(stream)
    return name


names = [create('redaction'), create('sanitize')]
manifest = {'locale': 'de-DE', 'region': 'DE', 'token': TOKEN,
            'pagePoints': PAGE, 'planMetres': [24, 12], 'planScale': '1:100',
            'redactionRegion': REGION, 'fictional': True,
            'files': {name: hashlib.sha256((OUT/name).read_bytes()).hexdigest() for name in names}}
(OUT/'source-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')
print(json.dumps(manifest, ensure_ascii=False, indent=2))
