#!/usr/bin/env python3
"""Build German electrical review resources from the verified regional PDF."""
import argparse
import csv
import io
import json
import math
from pathlib import Path
import runpy

ROOT = Path(__file__).resolve().parents[1]
# Share the source-bound library checks, German CSV encoding and guide styles.
shared = runpy.run_path(str(ROOT / "scripts/generate-regional-evaluation.py"))
digest, json_bytes, csv_bytes, page = [shared[key] for key in ("digest", "json_bytes", "csv_bytes", "page")]


def build(source, output):
    manifest, documents, source_hash = shared["verified_library"](source)
    drawing = next(document for document in documents if document["id"] == "06")
    plan, detail = drawing["pages"]
    assert (plan["sheet"], detail["sheet"], plan["revision"]) == ("E101", "E501", "A")
    assert drawing["facts"]["planCounts"] == {"light": 24, "socket": 12, "switch": 8}
    categories = []
    for kind, name, count, prefix in [
        ("light", "Leuchten", 24, "L"), ("socket", "Steckdosen", 12, "SD"), ("switch", "Schalter", 8, "S")
    ]:
        symbols = [symbol for symbol in plan["symbols"] if symbol["kind"] == kind and symbol["plan"]]
        tags = sorted(symbol["tag"] for symbol in symbols)
        assert tags == [f"{prefix}-{index:02}" for index in range(1, count+1)]
        assert len([s for s in plan["symbols"] if s["kind"] == kind and not s["plan"]]) == 1
        categories.append({"id": prefix, "description": name, "referenceCount": len(tags), "unit": "Stück", "tags": tags})
    route = next(ref for ref in plan["references"] if ref["id"] == "circuit")
    segments = [math.dist(a, b)*25.4/72000*route["scaleRatio"] for a, b in zip(route["points"], route["points"][1:])]
    assert all(math.isclose(a, b) for a, b in zip(segments, [6.5, 22, 6]))
    assert math.isclose(sum(segments), drawing["facts"]["routesMetres"]["circuit"])
    calibration = next(ref for ref in plan["references"] if ref["id"] == "calibration")
    assert calibration["metres"] == 5 and calibration["scaleRatio"] == 50
    footprint = next(ref for ref in plan["references"] if ref["id"] == "building-footprint")
    assert footprint["widthMetres"] == 24
    source_url = f"/localized-media/de/samples/construction/{drawing['file']}"
    rows = [["Kategorie", "Beschreibung", "Referenzanzahl", "Einheit", "Blatt", "Revision", "Kennzeichnungen",
             "Geprüfte Anzahl", "Status", "App-Version / Build", "Plattform", "Lizenzumfang", "Prüfnotizen", "Quelldatei"]]
    rows += [[item["id"], item["description"], item["referenceCount"], "Stück", "E101 / E501", "A",
              ", ".join(item["tags"]), "", "NICHT AUSGEFÜHRT", "", "", "", "", source_url] for item in categories]
    review = csv_bytes(rows)
    guide = page("Elektro-Symbole prüfen", f"""
<p>PolyPDF · Übungsmaterial für Deutschland · 20.10.2026</p>
<h1>Elektro-Symbole zählen und prüfen</h1>
<p>Nutzen Sie E101 und E501, Revision A, des fiktiven Bürgerhauses am Lindenpark. Die beiden A1-Blätter enthalten einen Grundriss, ein Stromlaufschema, eine Geräteliste und ein Leuchtendetail.</p>
<p><a href="electrical-count-review.csv" download>Leere Prüfliste als CSV</a> · <a href="../construction/{drawing['file']}">Deutscher Elektroplan als PDF</a></p>
<p class="note">Die Referenzwerte beschreiben die vorbereitete Zeichnung. Eigene Ergebnisse und App-Angaben sind leer; alle drei Statusfelder lauten NICHT AUSGEFÜHRT. Die Zeichnung ist Übungsmaterial und kein Nachweis einer elektrotechnischen Auslegung oder Normkonformität.</p>
<h2>Drei getrennte Kategorien</h2>
<div class="table" role="region" aria-label="Elektro-Referenzwerte" tabindex="0"><table>
<caption>Plansymbole auf E101; Legende und E501 ausgeschlossen</caption>
<thead><tr><th>Kategorie</th><th>Kennzeichnungen</th><th>Referenz</th></tr></thead><tbody>
<tr><th scope="row">Leuchten</th><td>L-01 bis L-24; gedrehte Leuchten einschließen</td><td>24 Stück</td></tr>
<tr><th scope="row">Steckdosen</th><td>SD-01 bis SD-12</td><td>12 Stück</td></tr>
<tr><th scope="row">Schalter</th><td>S-01 bis S-08</td><td>8 Stück</td></tr>
</tbody></table></div>
<p>Die Legende auf E101 enthält jeweils ein zusätzliches Symbol pro Kategorie. Die Symbole im Stromlaufschema auf E501 stellen keine weiteren installierten Geräte dar. Zählen Sie nur die gekennzeichneten Plansymbole auf E101.</p>
<h2>Ergebnisse erfassen</h2><ol>
<li>Speichern Sie eine Arbeitskopie. Erfassen Sie App-Version, Build, Betriebssystem und Lizenzumfang.</li>
<li>Prüfen Sie jede Symbolfamilie getrennt. Gleiche Symbole können unterschiedlich gedreht sein. Bei einer Symbolsuche müssen fehlende Treffer, zusätzliche Treffer und Überschneidungen geprüft werden.</li>
<li>Führen Sie Leuchten, Steckdosen und Schalter unter getrennten Bezeichnungen. Tragen Sie die tatsächlich geprüfte Anzahl und Hinweise ein. Ändern Sie den Status erst nach der Prüfung.</li>
<li>Bewahren Sie die gespeicherte PDF-Kopie und Ihren App-Export zusammen mit der Prüfliste auf. Diese vorbereitete CSV ist selbst kein App-Export und enthält keine Preise oder Zeitansätze.</li></ol>
<h2>Maßstab und gezeichnete Linie prüfen</h2>
<p>Kalibrieren Sie die 5-m-Referenz bei 1:50 und prüfen Sie unabhängig die Gebäudebreite von 24 m. Messen Sie die drei Abschnitte der gestrichelten Stromkreislinie: 6,5 + 22 + 6 = 34,5 m. Die Linie ist schematisch; daraus folgt keine ausführungsreife Kabel- oder Rohrmenge.</p>
<p>Für die Übung mit drei manuellen Messungen verwenden Sie die unabhängige Gebäudebreite und die ersten beiden Linienabschnitte (6,5 m und 22 m). Die Kalibrierung legt den Maßstab fest. Für alle drei Abschnitte zusätzlich zur Breitenprüfung benötigen Sie eine weitere Messung.</p>
<p>Das Stromlaufschema auf E501 ist ohne Maßstab. Nur das gesondert beschriftete Leuchtendetail verwendet 1:5 mit einer eigenen 0,50-m-Referenz; wenden Sie darauf nicht den Maßstab des Grundrisses an.</p>
<h2>Weitergabe</h2><p>Die CSV verwendet UTF-8, Semikolons und deutsche Überschriften. Ordnen Sie jeder geprüften Menge Blatt, Revision, Bezeichnung und Einheit zu. Materialpreise, Arbeitszeiten, Zuschläge und tatsächlich benötigte Leitungswege sind separat zu bestimmen.</p>
<p><a href="manifest.json">Quellen und Referenzdaten</a> · <a href="../construction/DEMO-MANIFEST.json">Zeichnungsnachweis</a> · <a href="https://www.polypdf.com/de/electrical-takeoff-software/">Elektro-Aufmaß mit PolyPDF</a></p>
""").encode("utf-8")
    record = {
        "locale": "de-DE", "region": "DE", "preparedAt": "2026-10-20", "referenceOnly": True,
        "runtimeVerification": "not_performed", "sourceManifestSha256": source_hash,
        "project": manifest["project"]["name"], "sheets": ["E101", "E501"], "revision": "A",
        "sourcePdf": {"url": source_url, "sha256": drawing["sha256"]},
        "categories": categories, "scope": "Three separate E101 plan categories; excludes legend, E501 schematics/detail, distribution board and wiring.",
        "routeReference": {"drawnCenterlineMetres": 34.5, "segmentMetres": [6.5, 22, 6], "notAConduitOrWireQuantity": True},
        "reviewCsv": {"file": "electrical-count-review.csv", "sha256": digest(review)},
    }
    payloads = {"electrical-count-review.csv": review, "README.html": guide, "manifest.json": json_bytes(record)}
    output.mkdir(parents=True, exist_ok=True)
    for name, data in payloads.items():
        (output/name).write_bytes(data)
    parsed = list(csv.reader(io.StringIO(review.decode("utf-8-sig")), delimiter=";"))
    assert len(parsed) == 4 and all(len(row) == 14 for row in parsed)
    assert [row[2] for row in parsed[1:]] == ["24", "12", "8"]
    assert all(row[7] == "" and row[8] == "NICHT AUSGEFÜHRT" and not any(row[9:13]) for row in parsed[1:])
    (output/"verification.json").write_bytes(json_bytes({
        "locale": "de-DE", "region": "DE", "status": "passed", "sourceManifestSha256": source_hash,
        "sourcePdfSha256": drawing["sha256"], "categories": 3, "blankResults": 3,
        "scope": "Checked regional source bytes, plan-only tags, separate legend symbols, physical line segments and blank CSV results.",
        "files": {name: digest(data) for name, data in payloads.items()}
    }))
    print("German electrical review: 24 lights, 12 sockets, 8 switches; three blank results and 34.5 m schematic verified.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=ROOT/"public/localized-media/de/samples/construction")
    parser.add_argument("--output", type=Path, default=ROOT/"public/localized-media/de/samples/electrical")
    args = parser.parse_args()
    build(args.source, args.output)
