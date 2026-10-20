#!/usr/bin/env python3
"""Verify regional drawings against actual PDF paths, then render and package them.

Automated geometry, text, link, layer and file checks do not certify construction
standards or substitute for inspecting every rendered page. Visual review receipts
are separate, source-bound records created after inspecting the final previews.
"""
from __future__ import annotations

import argparse
from collections import Counter
import hashlib
import json
import math
from pathlib import Path
import subprocess

from PIL import Image, ImageDraw, ImageFont, ImageStat
from pypdf import PdfReader
from pypdf.generic import ContentStream

from regional_library import ROOT, Region, W, H, package_library
from verify_library import destination_page, outlines_flat, reference_key, stream_stats


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def near(a, b, tolerance=.02):
    if isinstance(a, (tuple, list)):
        return len(a) == len(b) and all(near(x, y, tolerance) for x, y in zip(a, b))
    return abs(a-b) <= tolerance


def multiply(a, b):
    """Compose affine transforms a(b(point)); PDF's cm concatenates on the right."""
    aa, ab, ac, ad, ae, af = a
    ba, bb, bc, bd, be, bf = b
    return (aa*ba+ac*bb, ab*ba+ad*bb, aa*bc+ac*bd, ab*bc+ad*bd,
            aa*be+ac*bf+ae, ab*be+ad*bf+af)


def point(matrix, x, y):
    a, b, c, d, e, f = matrix
    return (a*x+c*y+e, b*x+d*y+f)


def geometry(reader, page):
    """Read painted line/rectangle paths in page coordinates, honoring nested CTMs."""
    matrix = (1, 0, 0, 1, 0, 0)
    stack, pending, segments, rectangles = [], [], [], []
    current = start = None
    for operands, op in ContentStream(page.get_contents(), reader).operations:
        if op == b"q":
            stack.append(matrix)
        elif op == b"Q":
            matrix = stack.pop()
        elif op == b"cm":
            matrix = multiply(matrix, tuple(float(n) for n in operands))
        elif op == b"m":
            current = start = point(matrix, *map(float, operands))
        elif op == b"l":
            end = point(matrix, *map(float, operands))
            if current:
                pending.append(("line", (current, end)))
            current = end
        elif op == b"re":
            x, y, w, h = map(float, operands)
            corners = [point(matrix, xx, yy) for xx, yy in ((x, y), (x+w, y), (x+w, y+h), (x, y+h))]
            pending.append(("rect", corners))
            current = start = corners[0]
        elif op == b"h" and current and start:
            pending.append(("line", (current, start)))
            current = start
        elif op in (b"S", b"s", b"f", b"f*", b"F", b"B", b"B*", b"b", b"b*"):
            for kind, points in pending:
                if kind == "line":
                    segments.append(points)
                else:
                    rectangles.append(points)
                    segments.extend(zip(points, points[1:]+points[:1]))
            pending, current, start = [], None, None
        elif op == b"n":
            pending, current, start = [], None, None
    assert not stack, "Unbalanced PDF graphics state"
    return {"segments": segments, "rectangles": rectangles}


def has_segment(paths, a, b):
    return any((near(a, p) and near(b, q)) or (near(a, q) and near(b, p)) for p, q in paths["segments"])


def has_rect(paths, a, b):
    return any(near(a, rect[0]) and near(b, rect[2]) for rect in paths["rectangles"])


def check_reference(reference, paths):
    """Cross-check physical length/area with PDF paths, independently of declared totals."""
    points = reference["points"]
    ratio = reference["scaleRatio"]
    metres_per_point = ratio*25.4/72000
    if reference["kind"] == "rectangle":
        a, b = points
        assert has_rect(paths, a, b), f"Rectangle missing from actual PDF: {reference['id']}"
        width, height = (b[0]-a[0])*metres_per_point, (b[1]-a[1])*metres_per_point
        assert near(width, reference["widthMetres"], 1e-5)
        assert near(height, reference["heightMetres"], 1e-5)
        for key, actual in (("areaSquareMetres", width*height), ("perimeterMetres", 2*(width+height)),
                            ("volumeCubicMetres", width*height*reference.get("depthMetres", 0))):
            if key in reference:
                assert near(actual, reference[key], 1e-5), f"{reference['id']}: {key}"
    else:
        for a, b in zip(points, points[1:]):
            assert has_segment(paths, a, b), f"Segment missing from actual PDF: {reference['id']}"
        length = sum(math.dist(a, b) for a, b in zip(points, points[1:]))*metres_per_point
        assert near(length, reference["metres"], 1e-5), f"{reference['id']}: physical length"


def verify_text(record, extracted):
    normalized = " ".join(extracted.split())
    for text in record["textBounds"]:
        assert " ".join(text["text"].split()) in normalized, f"Text missing: {text['text']}"
        assert text["size"] >= 9, f"Small text: {text['text']}"
        left = -text["width"]*({"left": 0, "center": .5, "right": 1}[text["align"]])
        radians = math.radians(text["angle"])
        matrix = (math.cos(radians), math.sin(radians), -math.sin(radians), math.cos(radians), text["x"], text["y"])
        corners = [point(matrix, x, y) for x in (left, left+text["width"]) for y in (-text["size"]*.25, text["size"])]
        assert all(28 <= x <= W-28 and 28 <= y <= H-28 for x, y in corners), f"Text crosses drawing frame: {text['text']}"


def verify_counts(record, paths, extracted):
    counts = Counter(s["kind"] for s in record["symbols"] if s["plan"])
    legends = Counter(s["kind"] for s in record["symbols"] if not s["plan"])
    tags = [s["tag"] for s in record["symbols"] if s["tag"]]
    assert len(set(tags)) == len(tags), "Duplicate symbol tags"
    lines = [line.strip() for line in extracted.splitlines()]
    for tag in tags:
        assert lines.count(tag) == 1, f"Tag not drawn exactly once: {tag}"
    # Every symbol paints a translated white backing rectangle. Checking its center
    # in actual PDF paths also catches a missing symbol despite a retained manifest tag.
    for symbol in record["symbols"]:
        assert any(near(((p[0][0]+p[2][0])/2, (p[0][1]+p[2][1])/2), (symbol["x"], symbol["y"])) for p in paths["rectangles"]), \
            f"Symbol graphics missing: {symbol['kind']} {symbol['tag']}"
    return counts, legends


def verify_document(record, region, folder):
    path = folder / record["file"]
    assert digest(path) == record["sha256"], f"PDF hash changed: {path.name}"
    reader = PdfReader(path)
    assert len(reader.pages) == len(record["pages"]) == 2
    outlines = list(outlines_flat(reader.outline))
    assert len(outlines) == 2 and [reader.get_destination_page_number(o) for o in outlines] == [0, 1]
    results, actual_paths = [], []
    for index, (page, data) in enumerate(zip(reader.pages, record["pages"])):
        assert near(float(page.mediabox.width), W) and near(float(page.mediabox.height), H), "Not ISO A1"
        assert near(float(page.cropbox.width), W) and near(float(page.cropbox.height), H), "Unexpected crop"
        assert page.rotation == 0
        text = page.extract_text()
        stats = stream_stats(reader, page.get_contents(), page["/Resources"])
        paths = geometry(reader, page)
        actual_paths.append(paths)
        if record["id"] == "12":
            assert not text.strip() and stats["text_show_operators"] == 0 and stats["image_xobjects"] == 1
            source = folder / data["sourceFile"]
            assert digest(source) == data["sourceSha256"], "Scan source has changed"
        else:
            assert region.project["name"] in text
            assert data["sheet"] in text
            assert " ".join(region.t("notForConstruction").split()) in " ".join(text.split())
            assert stats["drawing_operators"] > 20 and stats["text_show_operators"] > 20
            verify_text(data, text)
            for reference in data["references"]:
                check_reference(reference, paths)
            counts, legends = verify_counts(data, paths, text)
            if index == 0:
                for key, expected in record["facts"].get("planCounts", {}).items():
                    assert counts[key] == expected, f"Plan count: {key}"
                for key, expected in record["facts"].get("legendCounts", {}).items():
                    assert legends[key] == expected, f"Legend count: {key}"
        results.append({"sheet": data["sheet"], "page": index+1, "textItems": len(data["textBounds"]),
                        "physicalReferences": len(data["references"]), "symbolInstances": len(data["symbols"]),
                        "pdf": stats, "status": "passed"})
    if record["id"] in ("02", "03"):
        links = [a.get_object() for a in reader.pages[0].get("/Annots", []) if a.get_object().get("/Subtype") == "/Link"]
        assert len(links) == 2
        assert all(destination_page(reader, link.get("/Dest", link.get("/A", {}).get("/D"))) == 1 for link in links)
        # Independent revision checks against physical segment coordinates.
        ppm = 72000/25.4/50
        p = lambda x, y: (140+x*ppm, 430+y*ppm)
        wall = 18 if record["id"] == "02" else 19.5
        assert has_segment(actual_paths[0], p(wall, 9), p(wall, 15)), "Revision partition missing"
        assert not has_segment(actual_paths[0], p(37.5-wall, 9), p(37.5-wall, 15)), "Old revision partition retained"
        door = 20.25 if record["id"] == "02" else 21
        assert has_segment(actual_paths[0], p(door, 9), p(door, 9.9)), "Revision door missing"
        assert has_segment(actual_paths[0], p(4.25, 0), p(5.75, 0)) == (record["id"] == "03"), "Revision window"
    if record["id"] == "04":
        footings = [r for r in record["pages"][0]["references"] if r["kind"] == "rectangle" and r["widthMetres"] == r["heightMetres"] == 1.8]
        assert len(footings) == 12
        assert Counter(s["kind"] for s in record["pages"][0]["symbols"])["column"] == 12
        assert near(12*1.8*1.8*.45, record["facts"]["footingVolumeCubicMetres"])
        assert near(24*15*.15, record["facts"]["slabVolumeCubicMetres"])
        ppm = 72000/25.4/100
        p = lambda x, y: (160+x*ppm, 900+y*ppm)
        beams = [(p(0, y), p(24, y)) for y in (0, 7.5, 15)]+[(p(x, 0), p(x, 15)) for x in (0, 8, 16, 24)]
        assert all(has_segment(actual_paths[1], a, b) for a, b in beams)
        assert near(sum(math.dist(a, b)/ppm for a, b in beams), record["facts"]["beamLengthMetres"])
    if record["id"] == "10":
        facts = record["facts"]
        assert facts["resilientSquareMetres"]+facts["tileSquareMetres"] == facts["totalFinishSquareMetres"] == 360
        assert near(facts["tileSquareMetres"]/(.6*.6), facts["tilesBeforeWaste"])
        assert near(facts["cabinets"]*facts["cabinetModuleMetres"]*.6, facts["countertopSquareMetres"])
        assert near(facts["cabinets"]*facts["cabinetModuleMetres"], facts["toeKickMetres"])
    if record["id"] == "11":
        ocgs = reader.trailer["/Root"]["/OCProperties"]["/OCGs"]
        assert [o.get_object()["/Name"] for o in ocgs] == record["facts"]["layers"]
        assert len(ocgs) == 4
        assert results[0]["pdf"]["layer_tags"] == ["/LARCH", "/LELEC", "/LISSUES", "/LMECH"]
        notes = [a.get_object() for a in reader.pages[0]["/Annots"] if a.get_object()["/Subtype"] == "/Text"]
        assert len(notes) == 3
        for index, note in enumerate(notes):
            assert note["/T"] == region.t("reviewAuthor")
            assert region.t(f"issue{index+1}") in note["/Contents"]
            assert reference_key(note.raw_get("/OC")) == reference_key(ocgs[-1])
    return {"id": record["id"], "file": path.name, "sha256": record["sha256"], "pages": results}


def render(folder, documents):
    previews = folder / "previews"
    previews.mkdir(exist_ok=True)
    receipt, thumbs = [], []
    for document in documents:
        for index, page in enumerate(document["pages"], 1):
            target = previews / f"{document['id']}-{index}"
            result = subprocess.run(["pdftoppm", "-f", str(index), "-singlefile", "-scale-to", "1800",
                                     "-png", str(folder/document["file"]), str(target)], capture_output=True, text=True)
            if result.returncode:
                raise RuntimeError(result.stderr)
            image = Image.open(target.with_suffix(".png")).convert("RGB")
            assert min(image.size) >= 1200 and min(ImageStat.Stat(image).stddev) > 10, "Blank/tiny rendering"
            receipt.append({"file": target.with_suffix(".png").relative_to(folder).as_posix(),
                            "sha256": digest(target.with_suffix(".png")), "pdf": document["file"],
                            "pdfSha256": document["sha256"], "page": index})
            image.thumbnail((580, 410))
            thumbs.append((image.copy(), document["id"]+" / "+page["sheet"]))
    contact = Image.new("RGB", (4*600, 6*455), "#e8edef")
    draw = ImageDraw.Draw(contact)
    font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 20)
    for i, (image, caption) in enumerate(thumbs):
        x, y = (i % 4)*600+10, (i//4)*455+10
        contact.paste(image, (x, y))
        draw.text((x+5, y+420), caption, font=font, fill="#17252c")
    target = folder/"CONTACT-SHEET.png"
    contact.save(target)
    return receipt, {"file": target.name, "sha256": digest(target)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory", type=Path)
    args = parser.parse_args()
    folder = args.directory.resolve()
    manifest_path = folder/"DEMO-MANIFEST.json"
    manifest = json.loads(manifest_path.read_text())
    region = Region(manifest["locale"])
    assert manifest["region"] == region.region
    assert manifest["fictional"] and not manifest["standardsComplianceClaimed"]
    documents = manifest["documents"]
    assert len(documents) == 12 and {d["id"] for d in documents} == {f"{i:02}" for i in range(1, 13)}
    verified = [verify_document(document, region, folder) for document in documents]
    previews, contact = render(folder, documents)
    result = {"schemaVersion": 1, "locale": region.locale, "region": region.region,
              "manifestSha256": digest(manifest_path), "automatedStatus": "passed",
              "manualVisualReview": "required; keep a separate source-bound receipt",
              "limits": "Demonstration geometry only. No standards certification or native application workflow validation.",
              "documents": verified, "previews": previews, "contactSheet": contact}
    (folder/"verification.json").write_text(json.dumps(result, ensure_ascii=False, indent=2)+"\n")
    archive = None
    receipts = [folder/name for name in ("visual-review.json", "native-roundtrip.json")]
    if all(file.exists() and json.loads(file.read_text()).get("manifestSha256") == result["manifestSha256"]
           and json.loads(file.read_text()).get("status") == "passed" for file in receipts):
        archive = package_library(folder, region.locale)
    else:
        (folder / f"PolyPDF-Bauzeichnungen-{region.locale}.zip").unlink(missing_ok=True)
    print(json.dumps({"status": "passed", "documents": 12, "pages": 24,
                      "physicalReferences": sum(p["physicalReferences"] for d in verified for p in d["pages"]),
                      "archive": str(archive) if archive else "requires source-bound visual and app persistence receipts",
                      "sha256": digest(archive) if archive else None, "visualReview": "separate source-bound receipt"}, indent=2))


if __name__ == "__main__":
    main()
