#!/usr/bin/env python3
"""Derive German evaluation resources from the verified regional drawing library."""
import argparse
import csv
import hashlib
import html
import io
import json
import math
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = ROOT / "public/localized-media/de/samples/construction"
DEFAULT_OUTPUT = ROOT / "public/localized-media/de/samples/evaluation"
DOCUMENT_IDS = ("02", "03", "06", "10", "11", "12")
DATE = "2026-10-20"


def digest(data):
    return hashlib.sha256(data).hexdigest()


def json_bytes(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def german_number(value):
    if isinstance(value, (int, float)):
        return format(value, ".10g").replace(".", ",")
    return str(value)


def csv_bytes(rows):
    stream = io.StringIO(newline="")
    writer = csv.writer(stream, delimiter=";", lineterminator="\n")
    writer.writerows([[german_number(value) for value in row] for row in rows])
    return ("\ufeff" + stream.getvalue()).encode("utf-8")


def verified_library(source):
    raw = (source / "DEMO-MANIFEST.json").read_bytes()
    manifest = json.loads(raw)
    if (manifest["locale"], manifest["region"]) != ("de-DE", "DE"):
        raise ValueError("This authoring profile requires the German regional library.")
    if manifest["project"]["name"] != "BÜRGERHAUS AM LINDENPARK":
        raise ValueError("Review the regional guide when the demonstration project changes.")
    for name, status in [
        ("verification.json", "automatedStatus"),
        ("visual-review.json", "status"),
        ("native-roundtrip.json", "status"),
    ]:
        receipt = json.loads((source / name).read_bytes())
        if receipt.get(status) != "passed" or receipt.get("manifestSha256") != digest(raw):
            raise ValueError(f"Missing or stale library evidence: {name}")
    documents = {item["id"]: item for item in manifest["documents"]}
    selected = [documents[key] for key in DOCUMENT_IDS]
    for document in selected:
        if digest((source / document["file"]).read_bytes()) != document["sha256"]:
            raise ValueError(f"Changed source drawing: {document['file']}")
    return manifest, selected, digest(raw)


def references(documents):
    a, b, electrical, finishes, review, scan = documents
    af, bf, ef, ff, rf, sf = [document["facts"] for document in documents]
    calibration = next(ref for ref in a["pages"][0]["references"] if ref["id"] == "calibration")
    assert calibration["metres"] == 5 and calibration["scaleRatio"] == 50
    assert math.isclose(math.dist(*calibration["points"]) * 25.4 / 72000 * 50, 5)
    assert af["areaSquareMetres"] == math.prod(af["buildingMetres"]) == 360
    assert af["buildingMetres"] == [24, 15] and af["room103SquareMetres"] == af["room104SquareMetres"] == 36
    assert ff["tileSquareMetres"] + ff["resilientSquareMetres"] == af["areaSquareMetres"]
    assert (ff["tileSquareMetres"], ff["resilientSquareMetres"]) == (36, 324)
    assert sf["imageOnly"] is True
    assert sf["ocrSearchTargets"] == ["MEHRZWECKRAUM", "LAGEPLAN UND ERSCHLIESSUNG"]
    assert ef["planCounts"] == {"light": 24, "socket": 12, "switch": 8}
    assert ef["routesMetres"]["circuit"] == 34.5
    assert bf["partitionShiftMetres"] == 1.5 and bf["doorShiftMetres"] == .75 and bf["addedWindowMetres"] == 1.5
    assert (bf["room103SquareMetres"], bf["room104SquareMetres"]) == (45, 27)
    assert rf["nativeReviewNotes"] == 3 and len(rf["layers"]) == 4
    return [
        ["A01", a["file"], "A101", "Gedruckte Referenzstrecke", calibration["metres"], "m", "5 m bei 1:50; anschließend unabhängige Maße prüfen."],
        ["A02", a["file"], "A101", "Äußere Gebäudebreite", af["buildingMetres"][0], "m", "Nach der Kalibrierung unabhängig messen."],
        ["A03", a["file"], "A101", "Äußere Gebäudetiefe", af["buildingMetres"][1], "m", "Nach der Kalibrierung unabhängig messen."],
        ["A04", a["file"], "A101", "Brutto-Grundfläche", af["areaSquareMetres"], "m²", "24 × 15 m; keine Netto-Raumfläche und keine Wandabzüge."],
        ["F01", finishes["file"], "I101", "Fliesenbelag F2", ff["tileSquareMetres"], "m²", "Raum 107 und 108 jeweils 18 m²; Zuschläge separat erfassen."],
        ["F02", finishes["file"], "I101", "Elastischer Belag F1", ff["resilientSquareMetres"], "m²", "Zonen gemäß Planbegrenzung; keine Wandabzüge oder Zuschläge."],
        ["E01", electrical["file"], "E101", "Leuchten im Grundriss", ef["planCounts"]["light"], "Stück", "Legende und Details nicht mitzählen; jeder Suchtreffer ist zu prüfen."],
        ["E02", electrical["file"], "E101", "Steckdosen im Grundriss", ef["planCounts"]["socket"], "Stück", "Eigene Kategorie; keine Teilmenge der Leuchten."],
        ["E03", electrical["file"], "E101", "Gezeichnete Stromkreislinie", ef["routesMetres"]["circuit"], "m", "6,5 + 22 + 6 m; schematische Linie, keine Kabel- oder Rohrmenge."],
        ["R01", b["file"], "A101", "Raum 103 nach Revision B", bf["room103SquareMetres"], "m²", "Zuvor 36 m²; Trennwand um 1,5 m versetzt."],
        ["R02", b["file"], "A101", "Raum 104 nach Revision B", bf["room104SquareMetres"], "m²", "Zuvor 36 m²; Türversatz 0,75 m, zusätzliche Fensterbreite 1,5 m."],
        ["C01", review["file"], "X101", "Vorbereitete PDF-Prüfnotizen", rf["nativeReviewNotes"], "Stück", "Fiktive Prüfpunkte; eigene Notiz an einer Arbeitskopie ergänzen."],
        ["C02", review["file"], "X101", "PDF-Ebenen", len(rf["layers"]), "Stück", "; ".join(rf["layers"])],
        ["O01", scan["file"], "A101 / C101", "Nativer Text vor OCR", 0, "Zeichen", "Bildbasierte Seiten. Nach OCR nach MEHRZWECKRAUM und LAGEPLAN UND ERSCHLIESSUNG suchen."],
    ]


CHECKS = [
    ("Umgebung erfassen", "Alle", "App-Version, Build, Betriebssystem, Lizenzumfang und Quelldateien erfassen."),
    ("Kalibrieren und Maße prüfen", "A101 / Revision A", "5-m-Referenz kalibrieren; unabhängig 24 m Breite und 15 m Tiefe prüfen."),
    ("Grundfläche messen", "A101 / Revision A", "Äußere Begrenzung: 360 m². Zwei Längen und eine Fläche ergeben drei Messungen."),
    ("Aufmaß speichern und exportieren", "A101 / Revision A", "PDF-Kopie und CSV/PDF-Ausgabe erneut öffnen; Blatt, Revision, Einheiten und Werte prüfen."),
    ("Bodenbeläge prüfen", "I101", "F2: zweimal 18 m², insgesamt 36 m². F1: 324 m². Zuschläge getrennt erfassen."),
    ("Symboltreffer prüfen", "E101", "24 Leuchten, 12 Steckdosen. Legende und Details ausschließen; fehlende und zusätzliche Treffer erfassen."),
    ("Schematische Linie messen", "E101", "34,5 m aus 6,5 + 22 + 6 m; keine Kabel- oder Rohrmenge daraus ableiten."),
    ("Revisionen vergleichen", "A101 / A201", "Trennwandversatz 1,5 m, Türversatz 0,75 m, zusätzliche Fensterbreite 1,5 m und Textänderungen prüfen."),
    ("Prüfnotiz speichern", "X101 / X102", "Seitenbezogene Notiz ergänzen, speichern, erneut öffnen und Text sowie Lage prüfen."),
    ("OCR speichern und prüfen", "Scan A101 / C101", "Nach OCR MEHRZWECKRAUM und LAGEPLAN UND ERSCHLIESSUNG suchen; nach erneutem Öffnen wiederholen."),
    ("Empfängeransicht prüfen", "Gespeicherte Kopien", "Gespeicherte Ausgaben im PDF-Programm des Empfängers prüfen; Version und Unterschiede erfassen."),
]
PLATFORMS = ("Mac", "Windows", "iPad")
STYLE = """*{box-sizing:border-box}body{margin:0 auto;max-width:1050px;padding:40px 24px 80px;color:#182431;background:#fff;font:17px/1.6 system-ui,sans-serif}h1{font-size:clamp(30px,5vw,46px);line-height:1.15}h2{margin-top:36px}a{color:#184b75;text-underline-offset:3px}p,li{max-width:80ch}.note{padding:16px 20px;border-left:3px solid #527d89;background:#f3f7f8}.table{overflow:auto}table{border-collapse:collapse;width:100%;min-width:650px;font-size:15px}th,td{text-align:left;vertical-align:top;padding:12px;border-bottom:1px solid #d5dce0}a,code{overflow-wrap:anywhere}@media print{body{padding:0;font-size:10pt}table{min-width:0;font-size:9pt}tr{break-inside:avoid}}"""


def page(title, body):
    return f'<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex, follow"><title>{html.escape(title)} | PolyPDF</title><style>{STYLE}</style></head><body><main>{body}</main></body></html>\n'


def guide(documents, rows):
    drawings = "".join(f'<li><a href="zeichnungen/{doc["file"]}">{html.escape(doc["file"])} · 2 Blätter</a></li>' for doc in documents)
    table = "".join("<tr>" + "".join(f"<td>{html.escape(german_number(value))}</td>" for value in [row[0], row[3], f"{german_number(row[4])} {row[5]}", row[2], row[6]]) + "</tr>" for row in rows)
    return page("Bauzeichnungen prüfen", f"""
<p>PolyPDF · Übungsmaterial für Deutschland · 20.10.2026</p>
<h1>Zeichnung, Aufmaß und Weitergabe prüfen</h1>
<p>Das Bürgerhaus am Lindenpark ist ein fiktives Bauprojekt in Musterstadt. Dieses Paket enthält sechs PDFs mit zwölf A1-Blättern, vierzehn Referenzwerten und eine leere Ergebnisliste mit 33 Prüfschritten für Mac, Windows und iPad.</p>
<p class="note">Die Zeichnungen und Referenzwerte sind Übungsmaterial. Sie sind keine Bauunterlagen oder abgeschlossenen App-Prüfungen. Alle Ergebniszeilen beginnen mit NICHT AUSGEFÜHRT. Die Plattformspalten dienen der eigenen Prüfung und belegen keine Funktionsgleichheit.</p>
<h2>Mit dem Aufmaß beginnen</h2>
<ol><li>Öffnen Sie <a href="evaluation-results.csv">die Ergebnisliste</a> und tragen Sie Version, Build, Betriebssystem und Lizenzumfang ein. Aktuelle Funktionen und Voraussetzungen finden Sie auf der <a href="https://www.polypdf.com/product-facts/">Produktseite</a>.</li>
<li>Öffnen Sie <a href="zeichnungen/{documents[0]["file"]}">A101, Revision A</a>, und speichern Sie eine Arbeitskopie. Kalibrieren Sie die gedruckte 5-m-Referenz bei 1:50.</li>
<li>Prüfen Sie unabhängig 24 m Gebäudebreite und 15 m Tiefe. Umfahren Sie die äußere Begrenzung: 360 m² Brutto-Grundfläche.</li>
<li>Speichern und öffnen Sie die PDF-Kopie erneut. Exportieren Sie das Aufmaß und prüfen Sie Blatt, Revision, Bezeichnung, Einheit und Zahlenwert. Erfassen Sie das tatsächliche Ergebnis und die Ausgabedatei.</li></ol>
<h2>Weitere Übungen</h2><ul>
<li><strong>Bodenbeläge:</strong> I101 enthält 36 m² Fliesenbelag in den Räumen 107/108 und 324 m² elastischen Belag. Die Maße folgen den eingezeichneten Zonen. Zuschläge bleiben getrennt; die Details auf I501 haben eigene Maßstäbe.</li>
<li><strong>Elektro:</strong> E101 enthält 24 Leuchten und 12 Steckdosen. Zählen Sie keine Legenden- oder Detailsymbole mit. Prüfen Sie jeden Suchtreffer. Die gestrichelte Stromkreislinie ist 34,5 m lang und bildet keine ausführungsreife Kabel- oder Rohrtrasse ab.</li>
<li><strong>Revisionen:</strong> Vergleichen Sie jeweils A101 mit A101 und A201 mit A201. Prüfen Sie Trennwandversatz, Türversatz, zusätzliche Verglasung und Textänderungen. Die Zahl der vorbereiteten Änderungen ist keine Zusage für eine bestimmte Zahl automatischer Treffer.</li>
<li><strong>Koordination:</strong> X101/X102 enthalten drei vorbereitete Prüfnotizen und vier PDF-Ebenen. Ergänzen Sie eine eigene Notiz und prüfen Sie Text und Lage nach dem Speichern.</li>
<li><strong>OCR:</strong> Die Scans von A101/C101 enthalten zunächst keinen nativen Text. Suchen Sie nach der Texterkennung nach MEHRZWECKRAUM und LAGEPLAN UND ERSCHLIESSUNG. Speichern, schließen und erneut prüfen. OCR korrigiert weder Maßstab noch Scanverzerrung.</li></ul>
<h2>Zeichnungen</h2><ul>{drawings}</ul>
<h2>Referenzwerte</h2><p><a href="reference-quantities.csv">Referenzwerte als CSV</a> · <a href="evaluation-results.csv">Leere Ergebnisliste als CSV</a>. Beide Dateien verwenden UTF-8, Semikolons und Dezimalkommas. Eigene Messwerte, Toleranzen und Abweichungen getrennt erfassen.</p>
<div class="table" role="region" aria-label="Referenzwerte der Zeichnungen" tabindex="0"><table><thead><tr><th>Kennung</th><th>Prüfung</th><th>Referenz</th><th>Blatt</th><th>Umfang</th></tr></thead><tbody>{table}</tbody></table></div>
<h2>Ergebnisse nachvollziehbar halten</h2><p>Bewahren Sie Quelldateien, Prüfsummen, App- und Betriebssystemversion, Einstellungen und tatsächlich gespeicherte Ausgaben zusammen auf. Prüfen Sie die Ausgaben auch im Programm des Empfängers. Ein erfolgreicher Test in einem PDF-Programm belegt keine Kompatibilität mit allen Programmen.</p>
<p><a href="manifest.json">Quelldateien und Paketnachweis</a> · <a href="SHA256SUMS.txt">Prüfsummen der ZIP-Einträge</a></p>
""")


def build(source, output):
    manifest, documents, source_hash = verified_library(source)
    rows = references(documents)
    source_guide = guide(documents, rows).encode("utf-8")
    results = [["Plattform", "Prüfung", "Blatt", "Erwartung / Umfang", "App-Version", "Build", "Betriebssystem", "Lizenzumfang", "Tatsächliches Ergebnis", "Status", "Ausgabedatei / Nachweis", "Notizen"]]
    results += [[platform, *check, "", "", "", "", "", "NICHT AUSGEFÜHRT", "", ""] for platform in PLATFORMS for check in CHECKS]
    payloads = {
        "START-HERE.html": source_guide,
        "reference-quantities.csv": csv_bytes([["Prüfung", "Quelldatei", "Blatt", "Referenz", "Erwarteter Wert", "Einheit", "Umfang"]] + rows),
        "evaluation-results.csv": csv_bytes(results),
    }
    for document in documents:
        payloads["zeichnungen/" + document["file"]] = (source / document["file"]).read_bytes()
    record = {
        "locale": "de-DE", "region": "DE", "preparedAt": DATE, "referenceOnly": True,
        "runtimeVerification": "not_performed", "sourceProject": manifest["project"],
        "sourceManifestSha256": source_hash, "documents": documents,
        "referenceCount": len(rows), "blankChecks": len(results)-1, "platforms": list(PLATFORMS),
        "hashScope": "ZIP entries; the online guide uses ../construction/ links and has a separate hash in verification.json.",
        "files": [{"path": name, "bytes": len(data), "sha256": digest(data)} for name, data in payloads.items()],
    }
    payloads["manifest.json"] = json_bytes(record)
    payloads["SHA256SUMS.txt"] = "".join(f"{digest(data)}  {name}\n" for name, data in sorted(payloads.items())).encode()
    output.mkdir(parents=True, exist_ok=True)
    for name in ["reference-quantities.csv", "evaluation-results.csv", "manifest.json", "SHA256SUMS.txt"]:
        (output / name).write_bytes(payloads[name])
    (output / "START-HERE.html").write_bytes(source_guide.replace(b'href="zeichnungen/', b'href="../construction/'))
    archive = output / "PolyPDF-Pruefpaket-de-DE.zip"
    with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as bundle:
        for name, data in sorted(payloads.items()):
            info = zipfile.ZipInfo(name, date_time=(2026, 10, 20, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            bundle.writestr(info, data)
    with zipfile.ZipFile(archive) as bundle:
        assert bundle.testzip() is None and set(bundle.namelist()) == set(payloads)
        for name, data in payloads.items():
            assert bundle.read(name) == data, name
    parsed = list(csv.reader((output / "evaluation-results.csv").read_text(encoding="utf-8-sig").splitlines(), delimiter=";"))
    assert len(parsed) == 34 and all(len(row) == 12 for row in parsed)
    assert all(row[9] == "NICHT AUSGEFÜHRT" and row[8] == row[10] == "" for row in parsed[1:])
    actual_refs = list(csv.reader((output / "reference-quantities.csv").read_text(encoding="utf-8-sig").splitlines(), delimiter=";"))
    assert len(actual_refs) == 15 and next(row for row in actual_refs if row[0] == "E03")[4] == "34,5"
    receipt = {
        "locale": "de-DE", "region": "DE", "status": "passed", "sourceManifestSha256": source_hash,
        "scope": "Reference data derived from the verified German drawing manifest; archive reopened and every entry compared byte-for-byte; all platform results remain blank.",
        "documents": len(documents), "pages": sum(len(doc["pages"]) for doc in documents),
        "references": len(rows), "blankChecks": len(parsed)-1, "archiveEntries": len(payloads),
        "files": {name: digest((output / name).read_bytes()) for name in ["START-HERE.html", "reference-quantities.csv", "evaluation-results.csv", "manifest.json", "SHA256SUMS.txt", archive.name]},
    }
    (output / "verification.json").write_bytes(json_bytes(receipt))
    print("German evaluation kit: 6 PDFs / 12 sheets, 14 references, 33 blank platform checks; ZIP bytes verified.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    build(args.source, args.output)
