#!/usr/bin/env python3
"""Deterministic German plate/openings exercise, with physical 1:50 geometry."""
import csv
import hashlib
import json
from pathlib import Path

from reportlab.pdfgen import canvas
from reportlab.pdfbase.pdfmetrics import stringWidth

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/localized-media/de/samples/area'
W, H = 420 * 72 / 25.4, 297 * 72 / 25.4
PPM = 1000 * 72 / 25.4 / 50
ORIGIN = (90, 230)
RECTS = [('Bodenplatte', 0, 0, 12, 8), ('Öffnung 1', 3, 2, 2, 2), ('Öffnung 2', 8, 4, 3, 2)]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    file = OUT / 'bodenplatte-aussparungen-uebung.pdf'
    c = canvas.Canvas(str(file), pagesize=(W, H), invariant=1, lang='de-DE')
    c.setTitle('Bodenplatte mit zwei Aussparungen - deutsche Messübung')
    c.setAuthor('PolyPDF - fiktive Demonstrationszeichnung')
    c.setSubject('Deutschland; A3; 1:50; 96 m² brutto, 86 m² netto, 12,90 m³ bei 150 mm Dicke')
    text_boxes = []

    def text(x, y, value, size=11, bold=False, align='left', max_width=None):
        font = 'Helvetica-Bold' if bold else 'Helvetica'
        width = stringWidth(value, font, size)
        if max_width and width > max_width:
            raise ValueError(f'Text too wide: {value}')
        c.setFont(font, size)
        c.setFillColorRGB(.12, .17, .21)
        if align == 'center':
            c.drawCentredString(x, y, value)
            x -= width / 2
        else:
            c.drawString(x, y, value)
        text_boxes.append({'text': value, 'x': x, 'y': y, 'width': width, 'size': size})

    def p(x, y):
        return ORIGIN[0] + x * PPM, ORIGIN[1] + y * PPM

    def line(a, b, width=.65):
        c.setStrokeColorRGB(.22, .28, .32)
        c.setLineWidth(width)
        c.line(*a, *b)

    def hdim(x, y, length, label):
        a, b = p(x, y), p(x + length, y)
        line(a, b)
        for px, py in [a, b]:
            line((px - 3, py - 5), (px + 3, py + 5))
        text((a[0]+b[0])/2, a[1]+7, label, 11, align='center')

    c.setStrokeColorRGB(.5, .56, .60)
    c.rect(28, 28, W-56, H-56)
    text(48, H-55, 'BÜRGERHAUS AM LINDENPARK', 19, True)
    text(48, H-78, 'Bodenplatte mit zwei Aussparungen', 15)
    text(W-78, H-55, 'S-102', 19, True, align='center')
    text(48, H-100, 'Fiktive Messübung | Deutschland | Maße in m | Dicke 150 mm | Maßstab 1:50 auf A3', 11)
    line((48, H-112), (W-48, H-112))
    references = []
    for name, x, y, w, h in RECTS:
        px, py = p(x, y)
        c.setStrokeColorRGB(.12, .17, .21)
        c.setLineWidth(1.2 if name == 'Bodenplatte' else .9)
        c.rect(px, py, w*PPM, h*PPM)
        references.append({'id': name, 'points': [list(p(x,y)), list(p(x+w,y)), list(p(x+w,y+h)), list(p(x,y+h))], 'areaSquareMetres': w*h})
        if name != 'Bodenplatte':
            text(px+w*PPM/2, py+h*PPM/2+9, name, 12, True, 'center')
            text(px+w*PPM/2, py+h*PPM/2-10, f'{w},00 m × {h},00 m', 11, align='center')
    hdim(0, 8.35, 12, '12,00 m')
    a,b=p(-.4,0),p(-.4,8)
    line(a,b)
    for px,py in [a,b]: line((px-5,py-3),(px+5,py+3))
    c.saveState()
    c.translate(a[0]-10,(a[1]+b[1])/2)
    c.rotate(90)
    text(0,0,'8,00 m',11,align='center')
    c.restoreState()
    text(*p(6, 7.25), 'BODENPLATTE - DICKE 150 mm', 12, True, 'center')
    text(*p(6, .65), 'Außenkante nachzeichnen; beide Öffnungen abziehen.', 11, align='center')
    hdim(0, -0.8, 4, '4,00 m - Kalibrierstrecke')
    text(90, 148, 'Kontrolle: 12,00 m Breite und 8,00 m Höhe unabhängig prüfen.', 11)
    notes = [
        ('MESSAUFGABE', True),
        ('1. Metrisch und Länge Meter wählen.', False),
        ('2. An 4,00 m kalibrieren.', False),
        ('3. Breite und Höhe kontrollieren.', False),
        ('4. Äußeren Umriss schließen.', False),
        ('5. Zwei innere Aussparungen anlegen.', False),
        ('6. Tiefe 0,15 m eingeben.', False),
        ('KONTROLLWERTE', True),
        ('Brutto: 12,00 × 8,00 = 96,00 m²', False),
        ('Öffnung 1: 2,00 × 2,00 = 4,00 m²', False),
        ('Öffnung 2: 3,00 × 2,00 = 6,00 m²', False),
        ('Netto: 96,00 - 4,00 - 6,00 = 86,00 m²', True),
        ('Volumen: 86,00 × 0,15 = 12,90 m³', True),
        ('ABGRENZUNG', True),
        ('Beide Öffnungen liegen vollständig innen.', False),
        ('Keine Randkerbe; keine Überlappung.', False),
        ('Die Dicke ist eine angenommene Übungsgröße.', False),
        ('Keine statische Bemessung.', False),
        ('Keine Ausführungs- oder Genehmigungsplanung.', False),
    ]
    y=H-154
    for value,bold in notes:
        text(825,y,value,10.8,bold,max_width=W-870)
        y-=23 if bold else 21
    line((48,118),(W-48,118))
    text(48,96,'PLAN S-102 | REVISION A | 20.10.2026 | BLATT 1 / 1',11,True)
    text(48,75,'A3 quer - 420 × 297 mm | Nur zur Software-Demonstration | Nicht zur Bauausführung verwenden.',10)
    text(48,55,'Die dargestellten Bauteile und Maße sind fiktiv. Es wird keine Normkonformität zugesichert.',10)
    c.showPage()
    c.save()
    manifest = {'schemaVersion':1,'locale':'de-DE','region':'DE','paper':'ISO A3 landscape','pagePoints':[W,H],
        'scaleRatio':50,'pointsPerMetre':PPM,'pdf':file.name,'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),
        'fictional':True,'standardsComplianceClaimed':False,'references':references,
        'calibration':{'points':[list(p(0,-.8)),list(p(4,-.8))],'metres':4},
        'expected':{'grossAreaSquareMetres':96,'cutoutAreasSquareMetres':[4,6],'netAreaSquareMetres':86,'depthMetres':.15,'volumeCubicMetres':12.9},
        'textBoxes':text_boxes,'provenance':'Original PolyPDF fictional practice geometry; no external survey drawing.'}
    (OUT/'geometry.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    with (OUT/'bodenplatte-kontrollwerte.csv').open('w',newline='',encoding='utf-8-sig') as stream:
        writer=csv.writer(stream,delimiter=';')
        writer.writerows([['Position','Berechnung','Wert','Einheit'],['Bruttofläche','12 × 8','96,00','m²'],['Öffnung 1','2 × 2','4,00','m²'],['Öffnung 2','3 × 2','6,00','m²'],['Nettofläche','96 - 4 - 6','86,00','m²'],['Dicke','150 mm','0,15','m'],['Volumen','86 × 0,15','12,90','m³']])
    print(file)


if __name__ == '__main__':
    main()
