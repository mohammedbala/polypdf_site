#!/usr/bin/env python3
"""Check German takeoff references against painted PDF geometry and CSV arithmetic."""
import argparse
import csv
from decimal import Decimal, ROUND_CEILING
import hashlib
from html.parser import HTMLParser
import io
import json
import math
from pathlib import Path
import re

from PIL import Image, ImageStat
from pypdf import PdfReader
from pypdf.generic import ContentStream

ROOT = Path(__file__).resolve().parents[1]
DEFAULT = ROOT / "public/localized-media/de/samples/takeoff"
TOLERANCE = .002


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def near(a, b, tolerance=TOLERANCE):
    if isinstance(a, (list, tuple)):
        return len(a) == len(b) and all(near(x, y, tolerance) for x, y in zip(a, b))
    return abs(a - b) <= tolerance


def multiply(a, b):
    aa, ab, ac, ad, ae, af = a
    ba, bb, bc, bd, be, bf = b
    return (aa*ba+ac*bb, ab*ba+ad*bb, aa*bc+ac*bd, ab*bc+ad*bd,
            aa*be+ac*bf+ae, ab*be+ad*bf+af)


def painted_paths(reader):
    """Read stroked paths; clip-only paths and filled label backgrounds are excluded."""
    matrix, stack, pending, paths = (1, 0, 0, 1, 0, 0), [], [], []
    current = None

    def point(x, y):
        a, b, c, d, e, f = matrix
        return (a*x+c*y+e, b*x+d*y+f)

    for operands, op in ContentStream(reader.pages[0].get_contents(), reader).operations:
        values = [float(n) for n in operands] if op in (b"cm", b"m", b"l", b"c", b"re") else []
        if op == b"q":
            stack.append(matrix)
        elif op == b"Q":
            matrix = stack.pop()
        elif op == b"cm":
            matrix = multiply(matrix, values)
        elif op == b"m":
            current = {"points": [point(*values)], "curves": [], "closed": False, "rectangle": False}
            pending.append(current)
        elif op == b"l":
            assert current is not None
            current["points"].append(point(*values))
        elif op == b"c":
            assert current is not None
            current["curves"].append([point(*values[i:i+2]) for i in (0, 2, 4)])
            current["points"].append(point(*values[4:6]))
        elif op == b"re":
            x, y, w, h = values
            current = {"points": [point(xx, yy) for xx, yy in
                                 ((x, y), (x+w, y), (x+w, y+h), (x, y+h))],
                       "curves": [], "closed": True, "rectangle": True}
            pending.append(current)
        elif op == b"h":
            assert current is not None
            current["closed"] = True
        elif op in (b"S", b"s", b"B", b"B*", b"b", b"b*", b"f", b"f*", b"F", b"n"):
            if current is not None and op in (b"s", b"b", b"b*"):
                current["closed"] = True
            if op in (b"S", b"s", b"B", b"B*", b"b", b"b*"):
                paths.extend(pending)
            pending, current = [], None
    assert not stack, "Unbalanced PDF graphics state"
    return paths


def segments(paths):
    for shape in paths:
        if shape["curves"]:
            continue
        points = shape["points"]
        yield from zip(points, points[1:] + (points[:1] if shape["closed"] else []))


def covered(a, b, lines):
    """A full painted boundary may extend beyond the requested reference."""
    for p, q in lines:
        distance = math.dist(p, q)
        if distance <= TOLERANCE:
            continue
        def on_line(v):
            cross = abs((q[0]-p[0])*(v[1]-p[1]) - (q[1]-p[1])*(v[0]-p[0])) / distance
            dot = ((v[0]-p[0])*(q[0]-p[0]) + (v[1]-p[1])*(q[1]-p[1])) / distance
            return cross <= TOLERANCE and -TOLERANCE <= dot <= distance + TOLERANCE
        if on_line(a) and on_line(b):
            return True
    return False


def normalized(value):
    return " ".join(value.split()).casefold()


def verify(folder=DEFAULT):
    manifest = json.loads((folder / "manifest.json").read_text())
    profile_path = ROOT / "scripts/localization/takeoff-de-DE.json"
    profile = json.loads(profile_path.read_text())
    assert manifest["locale"] == profile["locale"] == "de-DE"
    assert manifest["region"] == profile["region"] == "DE"
    assert manifest["appExport"] is False
    assert manifest["profileSha256"] == digest(profile_path), "Changed regional profile"
    assert manifest["generatorSha256"] == digest(ROOT / "scripts/generate-regional-takeoff.py")
    assert manifest["drawingGeometrySourceSha256"] == digest(ROOT / "scripts/generate-takeoff-samples.py")
    for name, expected in manifest["files"].items():
        assert digest(folder / name) == expected, f"Changed artifact: {name}"
    assert len(manifest["files"]) == 11
    ppm = 72000 / 25.4 / 50
    assert manifest["scaleRatio"] == 50 and near(manifest["pointsPerMetre"], ppm)
    texts, paths = {}, {}
    for name in manifest["files"]:
        if name.endswith(".pdf"):
            reader = PdfReader(folder / name)
            assert len(reader.pages) == 1
            page = reader.pages[0]
            expected_box = (0, 0, 594*72/25.4, 420*72/25.4)
            assert near(tuple(float(v) for v in page.mediabox), expected_box), f"Not A2: {name}"
            assert near(tuple(float(v) for v in page.cropbox), expected_box) and page.rotation == 0
            assert float(page.get("/UserUnit", 1)) == 1
            texts[name] = normalized(page.extract_text())
            assert normalized(profile["project"]) in texts[name]
            assert "nicht zur bauausführung" in texts[name]
            assert not re.search(r"\bsq ft\b|\bfeet\b|\broom\b|\bnorthline\b|�", texts[name]), name
            paths[name] = painted_paths(reader)
        elif name.endswith(".png"):
            with Image.open(folder / name) as image:
                assert image.size == (1800, 1273)
                assert min(ImageStat.Stat(image.convert("RGB")).stddev) > 10
    for kind in ("flooring", "electrical"):
        record = manifest[kind]
        text = texts[record["file"]]
        for key in record["drawingCopyKeys"]:
            assert normalized(profile["copy"][key]) in text, f"Missing German drawing copy: {key}"

    flooring = manifest["flooring"]
    floor_paths = paths[flooring["file"]]
    lines = list(segments(floor_paths))
    measured_areas = []
    for index, area in enumerate(flooring["areas"]):
        vertices = area["points"]
        edges = list(zip(vertices, vertices[1:] + vertices[:1]))
        assert all(covered(a, b, lines) for a, b in edges), f"Missing painted area boundary: {area['id']}"
        if index == 0:
            matches = [p for p in floor_paths if p["closed"] and not p["curves"] and near(p["points"], vertices)]
            assert len(matches) == 1, "Room 1 must have one stroked net outline"
            vertices = matches[0]["points"]
            edges = list(zip(vertices, vertices[1:] + vertices[:1]))
        measured = abs(sum(a[0]*b[1] - b[0]*a[1] for a, b in edges)) / (2 * ppm**2)
        assert near(measured, [20.52, 16.2][index], 1e-5), "Incorrect physical net area"
        assert near(measured, area["squareMetres"], 1e-5)
        measured_areas.append(measured)
    assert len(measured_areas) == 2
    assert near(sum(measured_areas), flooring["netSquareMetres"], 1e-5)
    assert flooring["excludedSquareMetres"] == 1.08
    for span, metres in zip(flooring["referenceSpans"], [6, 4.5, 3.6]):
        a, b = span["points"]
        assert covered(a, b, lines), f"Missing painted reference span: {span['id']}"
        assert span["metres"] == metres and near(math.dist(a, b)/ppm, metres, 1e-5)
    assert len(flooring["referenceSpans"]) == 3

    electrical = manifest["electrical"]
    electric_paths = paths[electrical["file"]]
    route = [p for p in electric_paths if not p["curves"] and near(p["points"], electrical["routePoints"])]
    assert len(route) == 1, "Missing painted two-segment route"
    lengths = [math.dist(a, b)/ppm for a, b in zip(route[0]["points"], route[0]["points"][1:])]
    assert near(lengths, [9, 3.6], 1e-5)
    assert near(sum(lengths), electrical["routeMetres"], 1e-5)
    assert electrical["segmentMetres"] == [9, 3.6]
    size = 16 * ppm / 30
    assert near(size, electrical["symbolSizePoints"])
    circles, squares = [], []
    legend_circles, legend_squares, small_boxes = [], [], []
    for shape in electric_paths:
        vertices = shape["points"]
        xs, ys = [p[0] for p in vertices], [p[1] for p in vertices]
        extent = (max(xs)-min(xs), max(ys)-min(ys))
        centre = ((max(xs)+min(xs))/2, (max(ys)+min(ys))/2)
        if near(extent, (10 * ppm / 30, 10 * ppm / 30)):
            if len(shape["curves"]) == 4 and near(vertices[0], vertices[-1]):
                legend_circles.append(centre)
            elif shape["rectangle"]:
                legend_squares.append(centre)
        if shape["rectangle"] and near(extent, (6 * ppm / 30, 6 * ppm / 30)):
            small_boxes.append(centre)
        if not near(extent, (size, size)):
            continue
        if len(shape["curves"]) == 4 and near(vertices[0], vertices[-1]):
            circles.append(centre)
        elif shape["rectangle"]:
            squares.append(centre)
    assert len(circles) == electrical["typeA"] == 8, "Incorrect actual Type A symbol count"
    assert len(squares) == electrical["typeB"] == 4, "Incorrect actual Type B symbol count"
    assert near(sorted(circles), sorted(electrical["typeACentres"]))
    assert near(sorted(squares), sorted(electrical["typeBCentres"]))
    assert len(legend_circles) == len(legend_squares) == 1
    assert electrical["excludedLegendSymbols"] == 2
    assert all(p[0] > max(x for x, _ in squares) + size for p in legend_circles + legend_squares)
    endpoints = [electrical["routePoints"][0], electrical["routePoints"][-1]]
    assert len(small_boxes) == 3, "Two route-endpoint boxes and one legend box expected"
    assert all(any(near(p, endpoint) for p in small_boxes) for endpoint in endpoints)
    assert electrical["excludedRouteEndpoints"] == 2
    # A counted circle must also contain its two crossing strokes.
    electric_lines = list(segments(electric_paths))
    half_cross = 5 * ppm / 30
    for x, y in circles:
        assert covered((x-half_cross, y), (x+half_cross, y), electric_lines)
        assert covered((x, y-half_cross), (x, y+half_cross), electric_lines)

    net = Decimal("6")*Decimal("3.6") - Decimal("1.2")*Decimal("0.9") + Decimal("4.5")*Decimal("3.6")
    waste = net * Decimal(profile["wasteRate"])
    adjusted = net + waste
    packs = (adjusted / Decimal(profile["packAreaSquareMetres"])).to_integral_value(rounding=ROUND_CEILING)
    purchased = packs * Decimal(profile["packAreaSquareMetres"])
    expected_rows = {
        "bodenbelag-referenz": [
            ("Raum 1 brutto", Decimal("21.6"), "m²"), ("Schachtabzug Raum 1", Decimal("-1.08"), "m²"),
            ("Raum 1 netto", Decimal("20.52"), "m²"), ("Raum 2 netto", Decimal("16.2"), "m²"),
            ("Nettofläche gesamt", net, "m²"), ("Verschnittbeispiel", waste, "m²"),
            ("Bedarf mit Verschnitt", adjusted, "m²"), ("Ganze Pakete", packs, "Pakete"),
            ("Bestellfläche", purchased, "m²"), ("Überschuss durch Rundung", purchased-adjusted, "m²")],
        "elektro-referenz": [
            ("Leuchten Typ A", Decimal(8), "Stück"), ("Leuchten Typ B", Decimal(4), "Stück"),
            ("Waagerechter Abschnitt", Decimal(9), "m"), ("Senkrechter Abschnitt", Decimal("3.6"), "m"),
            ("Gezeichnete Trasse gesamt", Decimal("12.6"), "m")]}
    for stem, expected in expected_rows.items():
        data = (folder / f"{stem}.csv").read_bytes()
        assert data.startswith(b"\xef\xbb\xbf"), "CSV must declare UTF-8 for regional spreadsheet imports"
        rows = list(csv.reader(io.StringIO(data.decode("utf-8-sig")), delimiter=";"))
        assert rows.pop(0) == ["Position", "Referenzmenge", "Einheit", "Berechnung oder Umfang"]
        assert len(rows) == len(expected)
        for row, (label, quantity, unit) in zip(rows, expected):
            assert len(row) == 4 and row[0] == label and row[2] == unit
            assert re.fullmatch(r"-?\d+(,\d+)?", row[1]), "CSV quantity must use decimal comma"
            assert Decimal(row[1].replace(",", ".")) == quantity, f"Incorrect reference CSV quantity: {label}"
            for cell in row:
                assert normalized(cell) in texts[f"{stem}.pdf"], f"CSV/PDF reference mismatch: {cell}"
    for key, value in {
        "wasteRate": Decimal(".1"), "packAreaSquareMetres": Decimal(2), "wasteSquareMetres": waste,
        "adjustedSquareMetres": adjusted, "wholePacks": packs, "purchasedSquareMetres": purchased,
        "packRoundingSurplusSquareMetres": purchased-adjusted
    }.items():
        assert Decimal(str(manifest["orderingAssumptions"][key])) == value
    assert manifest["orderingAssumptions"]["pricesIncluded"] is False

    class GuideLinks(HTMLParser):
        def handle_starttag(self, tag, attrs):
            for key, target in attrs:
                if key in ("href", "src"):
                    assert target in manifest["files"] and (folder / target).is_file(), target
    GuideLinks().feed((folder / "README.html").read_text())
    return {
        "status": "passed", "locale": "de-DE", "region": "DE",
        "manifestSha256": digest(folder / "manifest.json"),
        "verifierSha256": digest(Path(__file__)),
        "physicalReferences": {"areas": 2, "calibrationAndChecks": 3, "routeSegments": 2},
        "actualPlanSymbols": {"typeA": len(circles), "typeB": len(squares)},
        "excludedSymbols": {"legendFixtures": 2, "routeEndpoints": 2, "endpointLegend": 1},
        "referenceCsvRows": 15, "pdfPages": 4, "files": manifest["files"],
        "limitations": ["Source geometry and independent references; not app-export evidence",
                        "Automated checks do not replace visual review or native platform walkthroughs"]
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--folder", type=Path, default=DEFAULT)
    args = parser.parse_args()
    report = verify(args.folder)
    (args.folder / "verification.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print("Verified four German A2 PDFs, seven physical references, 12 fixtures and 15 CSV rows.")
