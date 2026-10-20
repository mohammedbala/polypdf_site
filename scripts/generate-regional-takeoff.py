#!/usr/bin/env python3
"""Generate metric practice drawings and independent references, never app-export evidence."""
import argparse
import csv
from decimal import Decimal, ROUND_CEILING
import hashlib
import html
import importlib.util
import io
import json
import math
from pathlib import Path
import re
import subprocess

from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics

ROOT = Path(__file__).resolve().parents[1]
PROFILE_PATH = ROOT / "scripts/localization/takeoff-de-DE.json"
PROFILE = json.loads(PROFILE_PATH.read_text())
PAGE = (594 * 72 / 25.4, 420 * 72 / 25.4)
POINTS_PER_METRE = 72 / 25.4 * 1000 / PROFILE["scaleRatio"]
FACTOR = POINTS_PER_METRE / PROFILE["authoredPointsPerMetre"]
OFFSET = ((PAGE[0] - 792 * FACTOR) / 2, (PAGE[1] - 612 * FACTOR) / 2)
FILES = {
    "flooring-practice.pdf": "bodenbelag-uebung.pdf",
    "electrical-practice.pdf": "elektro-uebung.pdf",
    "flooring-reference.pdf": "bodenbelag-referenz.pdf",
    "electrical-reference.pdf": "elektro-referenz.pdf",
    "flooring-reference.csv": "bodenbelag-referenz.csv",
    "electrical-reference.csv": "elektro-referenz.csv",
    "flooring-practice-preview.png": "bodenbelag-uebung.png",
    "electrical-practice-preview.png": "elektro-uebung.png",
    "README.md": "README.html",
}
spec = importlib.util.spec_from_file_location("takeoff_geometry", ROOT / "scripts/generate-takeoff-samples.py")
g = importlib.util.module_from_spec(spec)
spec.loader.exec_module(g)
base_text = g.text
used_copy = set()


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def number(value):
    return format(Decimal(str(value)), "f").rstrip("0").rstrip(".").replace(".", ",") if "." in str(value) else str(value)


def translated(value):
    if value in PROFILE["copy"]:
        used_copy.add(value)
        return PROFILE["copy"][value]
    if value == "N" or re.fullmatch(r"\d+", value):
        return value
    raise ValueError(f"Missing source-bound drawing copy: {value}")


def fit_text(c, x, y, value, size=8, bold=False, align="left", color=g.INK, max_width=None):
    if max_width:
        font = "Helvetica-Bold" if bold else "Helvetica"
        size = min(size, max_width / pdfmetrics.stringWidth(value, font, 1))
    base_text(c, x, y, value, size, bold, align, color)


def regional_text(c, x, y, value, size=8, bold=False, align="left", color=g.INK):
    value = translated(value)
    # Preserve room and detail geometry while fitting expanded German labels.
    width = 156 if x >= 598 else None
    if x == 251:
        width = 32
    elif x == 330:
        width = 100
    elif x == 376:
        width = 46
    elif x == 403:
        width = 160
    elif x == 310:
        width = 256
    elif x == 312:
        width = 254
    fit_text(c, x, y, value, size, bold, align, color, width)


def regional_dim(c, x1, y1, x2, y2, label, vertical=False):
    label = translated(label)
    g.line(c, x1, y1, x2, y2, .35, g.MUTED)
    for x, y in [(x1, y1), (x2, y2)]:
        g.line(c, x - 2.5, y - 2.5, x + 2.5, y + 2.5, .7)
    c.saveState()
    c.translate((x1 + x2) / 2, (y1 + y2) / 2)
    if vertical:
        c.rotate(90)
    width = c.stringWidth(label, "Helvetica", 7)
    g.rect(c, -width / 2 - 3, -2, width + 6, 10, 0, g.white)
    base_text(c, 0, 1, label, 7, align="center")
    c.restoreState()


def wrapped(c, x, y, value, width, size=7, leading=10):
    line = ""
    for word in re.findall(r"\d+(?:,\d+)? m(?:²|³)?[.,;:]?(?=\s|$)|\S+", value):
        candidate = (line + " " + word).strip()
        if c.stringWidth(candidate, "Helvetica", size) > width and line:
            base_text(c, x, y, line, size)
            y -= leading
            line = word
        else:
            line = candidate
    if line:
        base_text(c, x, y, line, size)
        y -= leading
    return y


def regional_notes(c, x, y, title, rows, width=150):
    regional_text(c, x, y, title, 8, True)
    g.line(c, x, y - 6, x + width, y - 6, .7)
    current = y - 20
    for index, row in enumerate(rows, 1):
        current = wrapped(c, x, current, f"{index:02}  {translated(row)}", width) - 7
    return current


def scale_bar(c, x, y):
    base_text(c, x, y + 15, "MASSSTABSLEISTE / METER", 6, True)
    for index in range(4):
        g.rect(c, x + 22.5 * index, y, 22.5, 5, .35, g.INK if index % 2 == 0 else g.white)
    for index, value in enumerate(["0", "0,75", "1,50", "2,25", "3,00"]):
        base_text(c, x + 22.5 * index, y - 11, value, 6, align="center")
    base_text(c, x, y - 24, "1:50 auf A2. Vor dem Messen kalibrieren.", 6)


def frame(name, code, title, discipline, scale=None, derived=False):
    target = FILES.get(name, name)
    c = canvas.Canvas(str(OUT / target), pagesize=PAGE, invariant=1, pageCompression=1)
    display_title = translated(title) if title in PROFILE["copy"] else title
    display_discipline = translated(discipline) if discipline in PROFILE["copy"] else discipline
    c.setTitle(PROFILE["project"] + " | " + display_title)
    c.setAuthor("PolyPDF - fiktive Übungszeichnungen")
    c.setSubject("Deutsch / Deutschland. Übungsunterlagen, nicht zur Bauausführung. Kein Nachweis der Normenkonformität.")
    c.translate(*OFFSET)
    c.scale(FACTOR, FACTOR)
    g.rect(c, 24, 24, 744, 564, .8)
    base_text(c, 38, 568, PROFILE["project"], 12, True)
    base_text(c, 38, 551, display_title.upper(), 9)
    base_text(c, 754, 568, "POLYPDF", 15, True, align="right")
    base_text(c, 754, 550, "ÜBUNGSREIHE MENGENERMITTLUNG", 7, align="right")
    g.line(c, 24, 535, 768, 535, .8)
    g.line(c, 24, 82, 768, 82, .8)
    for x in [350, 530, 665]:
        g.line(c, x, 24, x, 82, .5)
    for x, label in [(38, "PROJEKT / AUSGABE"), (364, "FACHBEREICH"), (544, "MASSSTAB / DATUM"), (680, "PLAN")]:
        base_text(c, x, 68, label, 6.5, True)
    base_text(c, 38, 52, PROFILE["projectCode"] + " | " + PROFILE["issue"], 9, True)
    base_text(c, 38, 37, "NUR ZUR ÜBUNG - NICHT ZUR BAUAUSFÜHRUNG", 7)
    fit_text(c, 364, 52, display_discipline, 8, max_width=156)
    base_text(c, 364, 37, "Fiktives PolyPDF-Projekt", 7)
    base_text(c, 544, 52, scale or "A2 / 1:50", 8)
    base_text(c, 544, 37, PROFILE["date"], 7)
    base_text(c, 750, 39, code, 23, True, align="right")
    if code in ["F-101", "E-101"]:
        g.line(c, 584, 96, 584, 520, .45, g.MUTED)
    return c


g.text = regional_text
g.dim = regional_dim
g.notes = regional_notes
g.scale_bar = scale_bar
g.frame = frame


def point(value):
    return [value[0] * FACTOR + OFFSET[0], value[1] * FACTOR + OFFSET[1]]


def reference_rows():
    gross = Decimal("6") * Decimal("3.6")
    exclusion = Decimal("1.2") * Decimal("0.9")
    first = gross - exclusion
    second = Decimal("4.5") * Decimal("3.6")
    net = first + second
    waste = net * Decimal(PROFILE["wasteRate"])
    adjusted = net + waste
    pack_area = Decimal(PROFILE["packAreaSquareMetres"])
    packs = (adjusted / pack_area).to_integral_value(rounding=ROUND_CEILING)
    purchased = packs * pack_area
    flooring = [
        ["Raum 1 brutto", gross, "m²", "6,00 × 3,60"],
        ["Schachtabzug Raum 1", -exclusion, "m²", "1,20 × 0,90 abziehen"],
        ["Raum 1 netto", first, "m²", "21,60 - 1,08; Zwischensumme"],
        ["Raum 2 netto", second, "m²", "4,50 × 3,60"],
        ["Nettofläche gesamt", net, "m²", "20,52 + 16,20; Gesamtsumme"],
        ["Verschnittbeispiel", waste, "m²", "10 % von 36,72; Annahme"],
        ["Bedarf mit Verschnitt", adjusted, "m²", "36,72 × 1,10; Annahme"],
        ["Ganze Pakete", packs, "Pakete", "40,392 / 2; auf volle Pakete aufrunden"],
        ["Bestellfläche", purchased, "m²", "21 × 2; angenommene Packungsgröße"],
        ["Überschuss durch Rundung", purchased - adjusted, "m²", "42 - 40,392; zusätzlich zum Verschnitt"],
    ]
    electrical = [
        ["Leuchten Typ A", 8, "Stück", "Kreis mit Kreuz; nur Grundriss"],
        ["Leuchten Typ B", 4, "Stück", "Quadrat; nur Grundriss"],
        ["Waagerechter Abschnitt", Decimal("9"), "m", "Zwischen AD und Richtungswechsel"],
        ["Senkrechter Abschnitt", Decimal("3.6"), "m", "Vom Richtungswechsel zur zweiten AD"],
        ["Gezeichnete Trasse gesamt", Decimal("12.6"), "m", "9,00 + 3,60; ohne Zuschläge und Steigstrecken"],
    ]
    return {"flooring": flooring, "electrical": electrical}


def references(kind, rows):
    buffer = io.StringIO(newline="")
    writer = csv.writer(buffer, delimiter=";", lineterminator="\n")
    writer.writerow(["Position", "Referenzmenge", "Einheit", "Berechnung oder Umfang"])
    writer.writerows([[title, number(value), unit, basis] for title, value, unit, basis in rows])
    (OUT / FILES[f"{kind}-reference.csv"]).write_text("\ufeff" + buffer.getvalue(), encoding="utf-8")
    c = frame(f"{kind}-reference.pdf", "F-901" if kind == "flooring" else "E-901",
              "Referenzmengen Bodenbelag" if kind == "flooring" else "Referenzmengen Beleuchtung und Trasse",
              "MENGENPRÜFUNG", "OHNE MASSSTAB")
    base_text(c, 42, 511, "REFERENZMENGEN / UNABHÄNGIGE BERECHNUNG", 12, True)
    base_text(c, 42, 492, "Zum zugehörigen Übungsplan. Dieses Prüfblatt ist kein PolyPDF-App-Export.", 8)
    top, height = 469, 26
    g.rect(c, 42, top - 24, 708, 24, .5, g.PALE)
    for x, title in [(51, "POSITION / UMFANG"), (254, "MENGE / EINHEIT"), (367, "BERECHNUNG / GRUNDLAGE")]:
        base_text(c, x, top - 16, title, 8, True)
    for index, (title, value, unit, basis) in enumerate(rows):
        y = top - 24 - (index + 1) * height
        if index % 2 == 0:
            g.rect(c, 42, y, 708, height, 0, g.HexColor("#f5f6f6"))
        g.line(c, 42, y, 750, y, .3, g.MUTED)
        fit_text(c, 51, y + 9, title, 8, max_width=184)
        fit_text(c, 254, y + 9, f"{number(value)} {unit}", 8, True, max_width=94)
        fit_text(c, 367, y + 9, basis, 7.4, max_width=374)
    for x in [42, 245, 358, 750]:
        g.line(c, x, top, x, top - 24 - len(rows) * height, .4)
    notes = [
        "01  Maßstab 1:50 auf A2; einen getrennten bekannten Abstand prüfen.",
        "02  Umfang, Position, Einheit und Formel vor der Preiszuordnung prüfen.",
        "03  Einzelwerte, Zwischensummen und Gesamtsummen nicht gemeinsam addieren.",
        "04  Verschnitt und Packungsgröße sind getrennte Übungsannahmen, keine Produktvorgaben.",
    ]
    y = top - 24 - len(rows) * height - 29
    for index, note in enumerate(notes):
        base_text(c, 42, y - index * 16, note, 8)
    c.save()


def guide():
    items = "".join(f'<li><a href="{html.escape(FILES[name])}">{label}</a></li>' for name, label in [
        ("flooring-practice.pdf", "F-101: Bodenbelagsplan"),
        ("flooring-reference.pdf", "F-901: Referenzmengen Bodenbelag"),
        ("flooring-reference.csv", "Referenzmengen Bodenbelag als CSV"),
        ("electrical-practice.pdf", "E-101: Beleuchtungsplan und Trassenübung"),
        ("electrical-reference.pdf", "E-901: Referenzmengen Beleuchtung und Trasse"),
        ("electrical-reference.csv", "Referenzmengen Beleuchtung und Trasse als CSV"),
    ])
    return f"""<!doctype html><html lang="de-DE"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Deutsche Mengenermittlung - Übungsunterlagen</title>
<style>body{{font:16px/1.6 system-ui,sans-serif;color:#202629;max-width:980px;margin:48px auto;padding:0 24px}}h1{{font-size:2rem}}h2{{margin-top:2em}}a{{color:#075599}}img{{width:100%;height:auto;border:1px solid #ccc}}code{{font-size:.95em}}li{{margin:.5em 0}}.note{{border-left:4px solid #68757a;padding:12px 20px;background:#f4f6f6}}</style></head><body>
<h1>Mengenermittlung an deutschen Übungsplänen</h1><p>{html.escape(PROFILE['project'])} · {PROFILE['date']} · {PROFILE['issue']}.</p>
<p>Fiktive A2-Pläne im Maßstab 1:50. Diese Unterlagen sind keine Ausführungsplanung und kein Nachweis der Normenkonformität. Die Referenzen beruhen auf der gezeichneten Geometrie; sie sind keine App-Exporte.</p>
<h2>Dateien</h2><ul>{items}</ul>
<h2>Bodenbelag: Nettofläche zuerst</h2>
<p>Kalibrieren Sie die 6,00-m-Breite auf F-101. Prüfen Sie unabhängig die 4,50-m-Breite und die 3,60-m-Höhe. Raum 1 hat eine 1,20 m × 0,90 m große Aussparung am oberen rechten Rand. Zeichnen Sie die sechs Eckpunkte der Nettofläche nach; ziehen Sie die Aussparung nicht nochmals ab.</p>
<p><code>(6,00 × 3,60) - (1,20 × 0,90) = 20,52 m²</code>. Raum 2 umfasst <code>4,50 × 3,60 = 16,20 m²</code>. Die Nettofläche beträgt <strong>36,72 m²</strong>. Foyer und Flur sind ausgeschlossen.</p>
<p>Für eine getrennte Free-Übung kalibrieren Sie zuerst und prüfen mit einer manuellen Längenmessung einen anderen Abstand. Zeichnen Sie anschließend beide Nettoflächen nach. Die Längenprüfung gehört nicht zur Flächensumme. Zwei unabhängige Längenprüfungen plus beide Flächen erfordern vier manuelle Messungen.</p>
<img src="bodenbelag-uebung.png" alt="Deutscher Bodenbelagsplan mit zwei Räumen und einer randverbundenen Schachtaussparung.">
<h2>Verschnitt und Bestellung getrennt halten</h2>
<p>Beispielannahmen: 10 % Verschnitt und 2 m² je Paket. Daraus folgen 3,672 m² Zuschlag, 40,392 m² Bedarf und 21 ganze Pakete. Die Bestellfläche beträgt 42 m²; 1,608 m² entstehen zusätzlich durch Packungsrundung. Diese Annahmen sind keine Produkt- oder Ausführungsvorgabe. Preise, Lohn und Steuern sind nicht enthalten.</p>
<h2>Beleuchtung und gezeichnete Trasse</h2>
<p>E-101 enthält <strong>8 Leuchten Typ A</strong> und <strong>4 Leuchten Typ B</strong>. Legendensymbole und die zwei Anschlussdosen AD an den Trassenenden zählen nicht mit. Führen Sie beide Leuchtentypen getrennt. Die grüne Trasse misst <strong>9,00 + 3,60 = 12,60 m</strong>.</p>
<p>Die Trasse enthält keine Steigstrecken, Zuschläge, Formstücke, Leiteranzahl oder Elektroplanung. Sie ist keine Kabelbestellmenge.</p>
<img src="elektro-uebung.png" alt="Deutscher Beleuchtungsplan mit acht runden und vier quadratischen Leuchtensymbolen sowie einer zweigeteilten grünen Trasse.">
<h2>Referenzen und eigene Ergebnisse vergleichen</h2>
<p>Die UTF-8-CSV-Dateien verwenden Semikolon und Dezimalkomma. Die Bodenbelagsdatei enthält erläuternde Einzelwerte, Abzüge, Zwischen- und Gesamtsummen: Addieren Sie nicht die gesamte Mengenspalte. Prüfen Sie Ihre eigenen Anmerkungen, Einheiten und exportierten Formeln vor einer Weiterverwendung.</p>
<p class="note">Die englischen historischen Mac-Exporte gehören zu anderen Zeichnungen und Fußmaßen. Sie wurden nicht als deutsche Ergebnisse umetikettiert. Neue deutsche App-Exporte und vollständige Mac-/Windows-/iPad-Übungen werden gesondert dokumentiert.</p>
</body></html>"""


def main():
    g.OUT = OUT
    g.flooring()
    flooring_copy = sorted(used_copy)
    used_copy.clear()
    g.electrical()
    electrical_copy = sorted(used_copy)
    for kind, rows in reference_rows().items():
        references(kind, rows)
    (OUT / "README.html").write_text(guide(), encoding="utf-8")
    pdfs = [FILES[name] for name in FILES if name.endswith(".pdf")]
    for name in pdfs:
        subprocess.run(["pdftoppm", "-scale-to", "1800", "-singlefile", "-png",
                        str(OUT / name), str(OUT / name.removesuffix(".pdf"))], check=True, capture_output=True)
    manifest = {
        "schemaVersion": 1, "locale": PROFILE["locale"], "region": PROFILE["region"],
        "project": PROFILE["project"], "date": PROFILE["date"], "issue": PROFILE["issue"],
        "kind": "synthetic-practice-reference", "appExport": False, "paper": PROFILE["paper"],
        "pageSizePoints": PAGE, "scaleRatio": PROFILE["scaleRatio"], "pointsPerMetre": POINTS_PER_METRE,
        "profileSha256": digest(PROFILE_PATH),
        "generatorSha256": digest(Path(__file__)),
        "drawingGeometrySourceSha256": digest(ROOT / "scripts/generate-takeoff-samples.py"),
        "flooring": {
            "file": FILES["flooring-practice.pdf"], "sheet": "F-101",
            "referenceSpans": [
                {"id": "calibration", "points": [point((90, 398)), point((270, 398))], "metres": 6},
                {"id": "widthCheck", "points": [point((390, 398)), point((525, 398))], "metres": 4.5},
                {"id": "heightCheck", "points": [point((90, 290)), point((90, 398))], "metres": 3.6}
            ],
            "areas": [
                {"id": "room1", "label": "Raum 1 netto", "squareMetres": 20.52,
                 "points": [point(p) for p in [(90, 290), (270, 290), (270, 371), (234, 371), (234, 398), (90, 398)]]},
                {"id": "room2", "label": "Raum 2 netto", "squareMetres": 16.2,
                 "points": [point(p) for p in [(390, 290), (525, 290), (525, 398), (390, 398)]]}
            ],
            "netSquareMetres": 36.72, "excludedSquareMetres": 1.08,
            "drawingCopyKeys": flooring_copy
        },
        "electrical": {
            "file": FILES["electrical-practice.pdf"], "sheet": "E-101",
            "routePoints": [point(p) for p in [(100, 300), (370, 300), (370, 408)]],
            "routeMetres": 12.6, "segmentMetres": [9, 3.6],
            "typeACentres": [point((105 + (i % 4) * 70, 445 - (i // 4) * 65)) for i in range(8)],
            "typeBCentres": [point((430 + (i % 2) * 70, 445 - (i // 2) * 65)) for i in range(4)],
            "typeA": 8, "typeB": 4, "excludedLegendSymbols": 2, "excludedRouteEndpoints": 2,
            "symbolSizePoints": 16 * FACTOR, "drawingCopyKeys": electrical_copy
        },
        "orderingAssumptions": {
            "wasteRate": float(PROFILE["wasteRate"]), "packAreaSquareMetres": float(PROFILE["packAreaSquareMetres"]),
            "wasteSquareMetres": 3.672, "adjustedSquareMetres": 40.392, "wholePacks": 21,
            "purchasedSquareMetres": 42, "packRoundingSurplusSquareMetres": 1.608,
            "pricesIncluded": False
        },
        "sourceMappings": FILES,
        "files": {name: digest(OUT / name) for name in sorted(set(FILES.values()) |
                  {p.removesuffix(".pdf") + ".png" for p in pdfs})}
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    print(f"Generated four German A2 PDFs, two reference CSVs, four previews and guide in {OUT}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=ROOT / "public/localized-media/de/samples/takeoff")
    args = parser.parse_args()
    OUT = args.output.resolve()
    OUT.mkdir(parents=True, exist_ok=True)
    main()
