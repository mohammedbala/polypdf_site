#!/usr/bin/env python3
"""Independently inspect painted PDF rectangles, calibration line and German content."""
import csv
import hashlib
import json
from pathlib import Path

import pdfplumber
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/localized-media/de/samples/area'
path = OUT / 'bodenplatte-aussparungen-uebung.pdf'
record = json.loads((OUT / 'geometry.json').read_text())
reader = PdfReader(path)
assert reader.trailer['/Root']['/Lang'] == 'de-DE'
assert len(reader.pages) == 1
assert hashlib.sha256(path.read_bytes()).hexdigest() == record['sha256']
near = lambda a,b: abs(a-b) < 0.002
ppm = 72/25.4*1000/50
with pdfplumber.open(path) as pdf:
    page = pdf.pages[0]
    assert near(page.width,420*72/25.4) and near(page.height,297*72/25.4)
    actual_areas=[]
    for reference in record['references']:
        xs,ys=zip(*reference['points'])
        matches=[r for r in page.rects if near(r['x0'],min(xs)) and near(r['x1'],max(xs)) and near(r['y0'],min(ys)) and near(r['y1'],max(ys))]
        assert len(matches)==1, f"Missing unique painted boundary: {reference['id']}"
        rect=matches[0]
        actual_areas.append((rect['x1']-rect['x0'])*(rect['y1']-rect['y0'])/ppm**2)
    assert all(abs(a-b)<0.0001 for a,b in zip(actual_areas,[96,4,6]))
    assert abs(actual_areas[0]-sum(actual_areas[1:])-86)<0.0001
    a,b=record['calibration']['points']
    assert any(near(l['x0'],a[0]) and near(l['x1'],b[0]) and near(l['y0'],a[1]) and near(l['y1'],b[1]) for l in page.lines)
    assert near((b[0]-a[0])/ppm,4)
    for char in page.chars:
        assert 28 <= char['x0'] <= char['x1'] <= page.width-28, f"Text crosses frame: {char['text']}"
        assert 28 <= char['top'] <= char['bottom'] <= page.height-28
    text=page.extract_text()
    for value in ['Öffnung 1','Öffnung 2','86,00 m²','12,90 m³','Dicke 150 mm','Keine statische Bemessung.']:
        assert value in text, value
    assert 'sq ft' not in text and 'cu ft' not in text
with (OUT/'bodenplatte-kontrollwerte.csv').open(encoding='utf-8-sig') as stream:
    rows=list(csv.reader(stream,delimiter=';'))
assert rows[4][2:] == ['86,00','m²'] and rows[6][2:] == ['12,90','m³']
report={'status':'passed','locale':'de-DE','region':'DE','sha256':record['sha256'],'checks':['A3 physical page and German PDF catalog language','Three actual painted rectangles at 1:50','Independent 4 m calibration line','German extracted labels and all characters inside frame','Reference CSV matches net area and volume'], 'paintedAreasSquareMetres':actual_areas,'netAreaSquareMetres':actual_areas[0]-sum(actual_areas[1:]),'volumeCubicMetres':(actual_areas[0]-sum(actual_areas[1:]))*.15,'limitations':['Fictional software demonstration, no engineering or standards certification','Rendering must be reviewed separately; text extraction is not visual proof']}
(OUT/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False))
