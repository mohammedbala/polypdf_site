#!/usr/bin/env python3
"""Read-only checks of the demo PDFs; writes previews and a separate QA report.

Run with the bundled Python: verify_library.py /absolute/path/to/library
Requires pypdf, Pillow, pdfinfo and pdftoppm. These checks establish file
structure, manifest arithmetic and nonblank rendering, not drawing accuracy
or PolyPDF's behavior with the files.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
import math
from pathlib import Path
import re
import shutil
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont, ImageStat
from pypdf import PdfReader
from pypdf.generic import ContentStream

WIDTH, HEIGHT = 2592, 1728
SCAN_FILE = "12-Scanned-Legacy-Drawings.pdf"
ARCH_FILES = {"02-Architectural-Revision-A.pdf", "03-Architectural-Revision-B.pdf"}
COORD_FILE = "11-Coordination-and-Review.pdf"
DRAWING_OPS = {b"m", b"l", b"c", b"v", b"y", b"re", b"S", b"s", b"f", b"f*", b"B", b"B*"}
TEXT_OPS = {b"Tj", b"TJ", b"'", b'"'}


def resolve(value):
    return value.get_object() if hasattr(value, "get_object") else value


def reference_key(value):
    ref = value if hasattr(value, "idnum") else getattr(value, "indirect_reference", None)
    return (ref.idnum, ref.generation) if ref is not None else None


def outlines_flat(values):
    for value in values:
        if isinstance(value, list):
            yield from outlines_flat(value)
        else:
            yield value


def destination_page(reader, destination):
    destination = resolve(destination)
    if isinstance(destination, str):
        named = reader.named_destinations.get(destination)
        return reader.get_destination_page_number(named) if named else None
    if isinstance(destination, list) and destination:
        target = reference_key(destination[0])
        if target is not None:
            for index, page in enumerate(reader.pages):
                if reference_key(page) == target:
                    return index
        if isinstance(destination[0], int):
            return int(destination[0])
    return None


def stream_stats(reader, stream, resources, seen=None):
    """Count native drawing/text operators and image XObjects, including Forms."""
    seen = set() if seen is None else seen
    stats = {"drawing_operators": 0, "text_show_operators": 0, "image_xobjects": 0, "layer_tags": []}
    if stream is None:
        return stats
    resources = resolve(resources) or {}
    content = ContentStream(stream, reader)
    for operands, operation in content.operations:
        stats["drawing_operators"] += operation in DRAWING_OPS
        stats["text_show_operators"] += operation in TEXT_OPS
        if operation == b"BDC" and len(operands) > 1 and str(operands[0]) == "/OC":
            stats["layer_tags"].append(str(operands[1]))
        if operation == b"INLINE IMAGE":
            stats["image_xobjects"] += 1
        if operation != b"Do" or not operands:
            continue
        objects = resolve(resources.get("/XObject")) or {}
        obj_ref = objects.get(operands[0])
        if obj_ref is None:
            continue
        obj = resolve(obj_ref)
        if obj.get("/Subtype") == "/Image":
            stats["image_xobjects"] += 1
        elif obj.get("/Subtype") == "/Form":
            key = reference_key(obj_ref) or id(obj)
            if key in seen:
                continue
            seen.add(key)
            child = stream_stats(reader, obj, obj.get("/Resources", resources), seen)
            for name in ("drawing_operators", "text_show_operators", "image_xobjects"):
                stats[name] += child[name]
            stats["layer_tags"].extend(child["layer_tags"])
    stats["layer_tags"] = sorted(set(stats["layer_tags"]))
    return stats


def points_per_foot(scale):
    scale = str(scale).strip()
    match = re.search(r"(?:(\d+)-)?(\d+)/(\d+)\s*\"\s*=\s*1\s*'", scale)
    if match:
        return 72 * (int(match[1] or 0) + int(match[2]) / int(match[3]))
    match = re.search(r"(\d+(?:\.\d+)?)\s*\"\s*=\s*1\s*'", scale)
    if match:
        return 72 * float(match[1])
    match = re.fullmatch(r"1\s*:\s*(\d+(?:\.\d+)?)", scale)
    return 864 / float(match[1]) if match else None


def inspect_manifest(record, check):
    name = record["file"]
    facts = record.get("facts", {})
    check(name, "manifest_has_facts", isinstance(facts, dict) and bool(facts), "Document facts are supplied.")
    if not isinstance(facts, dict):
        return
    count_pattern = re.compile(r"count|qty|quantity|doors?|diffusers?|receptacles?|sprinklers?|fixtures?|trees?|cabinets|review_notes|intentional_issues|internal_detail_links|lights|columns", re.I)
    for key, value in facts.items():
        if isinstance(value, bool):
            continue
        if isinstance(value, (int, float)):
            check(name, "manifest_numeric:" + key, math.isfinite(value) and value >= 0, {"value": value})
            if count_pattern.search(key):
                check(name, "manifest_count:" + key, math.isfinite(value) and value == int(value), {"value": value, "note": "Manifest count sanity only; symbols are not counted from rendering."})
        match = re.fullmatch(r"calibration_(\d+(?:\.\d+)?)ft_points", key)
        if match and isinstance(value, (int, float)):
            actual_length = float(match[1])
            ppf = points_per_foot(record.get("pages", [{}])[0].get("scale", ""))
            check(name, "calibration:" + key, actual_length > 0 and value > 0, {"reference_ft": actual_length, "reference_points": value, "points_per_ft": value / actual_length if actual_length else None})
            if ppf is not None:
                check(name, "calibration_matches_declared_scale:" + key, math.isclose(value / actual_length, ppf, rel_tol=1e-9), {"manifest_points_per_ft": value / actual_length, "declared_points_per_ft": ppf})
    footprint = facts.get("footprint_ft")
    if isinstance(footprint, list) and len(footprint) == 2 and all(isinstance(v, (int, float)) and v > 0 for v in footprint):
        if "gross_area_sf" in facts:
            check(name, "footprint_area_arithmetic", math.isclose(footprint[0] * footprint[1], facts["gross_area_sf"]), {"dimensions_ft": footprint, "gross_area_sf": facts["gross_area_sf"]})
        if "gross_perimeter_ft" in facts:
            check(name, "footprint_perimeter_arithmetic", math.isclose(2 * sum(footprint), facts["gross_perimeter_ft"]), {"dimensions_ft": footprint, "gross_perimeter_ft": facts["gross_perimeter_ft"]})
    if all(key in facts for key in ("resilient_floor_sf", "tile_floor_sf", "total_finish_sf")):
        check(name, "finish_area_arithmetic", math.isclose(facts["resilient_floor_sf"] + facts["tile_floor_sf"], facts["total_finish_sf"]), {key: facts[key] for key in ("resilient_floor_sf", "tile_floor_sf", "total_finish_sf")})


def fit_label(draw, text, width, font):
    while text and draw.textbbox((0, 0), text, font=font)[2] > width:
        text = text[:-2] + "…" if len(text) > 2 else ""
    return text


def make_contact_sheet(previews, output):
    columns, cell_width, image_height, label_height, margin = 4, 540, 360, 49, 18
    rows = math.ceil(len(previews) / columns)
    sheet = Image.new("RGB", (columns * cell_width + margin * 2, rows * (image_height + label_height) + margin * 2), "#e9edf0")
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 14)
    except OSError:
        font = ImageFont.load_default()
    for index, preview in enumerate(previews):
        x = margin + (index % columns) * cell_width
        y = margin + (index // columns) * (image_height + label_height)
        with Image.open(preview["path"]) as image:
            image = image.convert("RGB")
            image.thumbnail((cell_width - 12, image_height - 8), Image.Resampling.LANCZOS)
            sheet.paste(image, (x + (cell_width - 12 - image.width) // 2, y))
        draw.text((x + 3, y + image_height + 2), fit_label(draw, preview["file"], cell_width - 18, font), fill="#14232b", font=font)
        label = f"Page {preview['page']} · {preview['sheet']}"
        draw.text((x + 3, y + image_height + 23), fit_label(draw, label, cell_width - 18, font), fill="#52626c", font=font)
    sheet.save(output)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("library", type=Path)
    parser.add_argument("--preview-dir", type=Path, default=Path.cwd() / "tmp/pdfs/construction-demo/preview")
    args = parser.parse_args()
    library, preview_dir = args.library.resolve(), args.preview_dir.resolve()
    preview_dir.mkdir(parents=True, exist_ok=True)
    report = {"generated_at": datetime.now(timezone.utc).isoformat(), "library": str(library), "checks": [], "documents": [], "limitations": [
        "Manifest counts and calibration arithmetic are checked for internal consistency; rendered symbols and drawing dimensions are not independently recognized or measured.",
        "Nonblank preview histograms do not establish drawing accuracy, absence of overlap, or PolyPDF feature behavior.",
        "Symbol legends and schedule examples may repeat plan symbols. Plan counts must be distinguished from all visible instances during a demonstration."
    ]}
    def check(scope, test, ok, details=None):
        report["checks"].append({"scope": scope, "test": test, "ok": bool(ok), "details": details})

    pdfs = sorted(library.glob("*.pdf"))
    check("library", "exactly_12_root_pdfs", len(pdfs) == 12, {"actual": len(pdfs)})
    check("library", "required_scan_file", any(path.name == SCAN_FILE for path in pdfs))
    for binary in ("pdfinfo", "pdftoppm"):
        check("environment", "available:" + binary, shutil.which(binary) is not None)
    manifest_path = library / "DEMO-MANIFEST.json"
    try:
        manifest = json.loads(manifest_path.read_text())
        records = manifest["documents"] if isinstance(manifest, dict) else manifest
        check("manifest", "12_document_records", isinstance(records, list) and len(records) == 12)
        by_name = {record["file"]: record for record in records}
        check("manifest", "exact_pdf_inventory", set(by_name) == {path.name for path in pdfs}, {"manifest": sorted(by_name), "actual": [path.name for path in pdfs]})
    except Exception as error:
        check("manifest", "readable_manifest", False, f"{type(error).__name__}: {error}")
        by_name = {}
    previews, total_pages = [], 0
    for path in pdfs:
        name, record = path.name, by_name.get(path.name, {})
        doc_report = {"file": name, "sha256": hashlib.sha256(path.read_bytes()).hexdigest(), "pages": []}
        report["documents"].append(doc_report)
        try:
            reader = PdfReader(path, strict=True)
            total_pages += len(reader.pages)
            check(name, "two_pages", len(reader.pages) == 2, {"actual": len(reader.pages)})
            check(name, "unencrypted", not reader.is_encrypted)
            outlines = list(outlines_flat(reader.outline))
            outline_pages = [reader.get_destination_page_number(item) for item in outlines]
            check(name, "two_valid_page_outlines", len(outlines) == 2 and sorted(outline_pages) == [0, 1], {"titles": [str(item.title) for item in outlines], "zero_based_destinations": outline_pages})
            if record:
                check(name, "manifest_page_count", len(record.get("pages", [])) == len(reader.pages))
                inspect_manifest(record, check)
            info = subprocess.run(["pdfinfo", str(path)], text=True, capture_output=True, timeout=30)
            check(name, "independent_pdfinfo_parse", info.returncode == 0, info.stderr.strip() or None)
            doc_report["pdfinfo"] = {line.split(":", 1)[0]: line.split(":", 1)[1].strip() for line in info.stdout.splitlines() if ":" in line and line.split(":", 1)[0] in ("Pages", "Page size", "File size", "PDF version")}
            all_annotations = []
            for index, page in enumerate(reader.pages):
                scope = f"{name}:page{index + 1}"
                box, rotation = [float(value) for value in page.mediabox], int(page.get("/Rotate", 0)) % 360
                check(scope, "architectural_d_mediabox", box == [0.0, 0.0, float(WIDTH), float(HEIGHT)], {"mediabox": box})
                check(scope, "zero_rotation", rotation == 0, {"rotation": rotation})
                text = page.extract_text() or ""
                letters = len(re.findall(r"[A-Za-z]", text))
                stats = stream_stats(reader, page.get_contents(), page.get("/Resources"))
                page_report = {"page": index + 1, "mediabox": box, "rotation": rotation, "native_letters": letters, **stats}
                doc_report["pages"].append(page_report)
                if name == SCAN_FILE:
                    check(scope, "image_only_no_native_text", letters == 0 and stats["text_show_operators"] == 0, {"native_letters": letters, "text_show_operators": stats["text_show_operators"]})
                    check(scope, "image_content_present", stats["image_xobjects"] > 0 and stats["drawing_operators"] == 0, stats)
                else:
                    check(scope, "native_searchable_vector_content", letters >= 100 and stats["text_show_operators"] > 0 and stats["drawing_operators"] > 0, {"native_letters": letters, **stats})
                annotations = [resolve(annotation) for annotation in page.get("/Annots", [])]
                all_annotations.extend(annotations)
                for annotation in annotations:
                    rect = [float(value) for value in annotation.get("/Rect", [])]
                    check(scope, "annotation_within_page", len(rect) == 4 and 0 <= rect[0] < rect[2] <= WIDTH and 0 <= rect[1] < rect[3] <= HEIGHT, {"subtype": str(annotation.get("/Subtype")), "rect": rect})
                if name in ARCH_FILES and index == 0:
                    links = [annotation for annotation in annotations if annotation.get("/Subtype") == "/Link"]
                    targets = []
                    for annotation in links:
                        action = resolve(annotation.get("/A")) or {}
                        destination = annotation.get("/Dest") if "/Dest" in annotation else action.get("/D") if action.get("/S") == "/GoTo" else None
                        targets.append(destination_page(reader, destination))
                    check(scope, "two_detail_links_to_page2", len(links) == 2 and targets == [1, 1], {"links": len(links), "zero_based_destinations": targets})
                output = preview_dir / f"{path.stem}--page-{index + 1:02d}"
                rendered = subprocess.run(["pdftoppm", "-r", "40", "-f", str(index + 1), "-l", str(index + 1), "-singlefile", "-png", str(path), str(output)], capture_output=True, text=True, timeout=60)
                png_path = output.with_suffix(".png")
                check(scope, "rendered_at_40dpi", rendered.returncode == 0 and png_path.is_file(), rendered.stderr.strip() or None)
                if rendered.returncode == 0 and png_path.is_file():
                    with Image.open(png_path) as image:
                        gray = image.convert("L")
                        histogram = gray.histogram()
                        dark_fraction = sum(histogram[:220]) / (gray.width * gray.height)
                        deviation = ImageStat.Stat(gray).stddev[0]
                        extrema = gray.getextrema()
                        metrics = {"pixels": list(gray.size), "dark_fraction_below_220": round(dark_fraction, 6), "grayscale_stddev": round(deviation, 3), "grayscale_extrema": list(extrema)}
                    check(scope, "nonblank_preview_histogram", dark_fraction >= .001 and deviation >= 5 and extrema[0] < 100, metrics)
                    page_report["preview"] = {"path": str(png_path), **metrics}
                    sheets = record.get("pages", [])
                    sheet_code = sheets[index].get("sheet", "") if index < len(sheets) else ""
                    previews.append({"path": str(png_path), "file": name, "page": index + 1, "sheet": sheet_code})
            if name == COORD_FILE:
                check(name, "three_native_sticky_notes", len(all_annotations) == 3 and all(annotation.get("/Subtype") == "/Text" for annotation in all_annotations), {"annotation_count": len(all_annotations), "subtypes": [str(annotation.get("/Subtype")) for annotation in all_annotations]})
                root = resolve(reader.trailer["/Root"])
                oc = resolve(root.get("/OCProperties")) or {}
                groups = list(resolve(oc.get("/OCGs")) or [])
                default = resolve(oc.get("/D")) or {}
                off = {reference_key(group) for group in resolve(default.get("/OFF")) or []}
                on = {reference_key(group) for group in resolve(default.get("/ON")) or []}
                group_keys = {reference_key(group) for group in groups}
                base_on = default.get("/BaseState", "/ON") == "/ON"
                all_on = not (group_keys & off) and (base_on or group_keys <= on)
                layer_names = [str(resolve(group).get("/Name", "")) for group in groups]
                check(name, "four_layers_all_on", len(groups) == 4 and all_on and set(layer_names) == {"Architecture", "Mechanical", "Electrical", "Review issues"}, {"names": layer_names, "base_state": str(default.get("/BaseState", "/ON")), "off_count": len(off), "on_count": len(on)})
                props = resolve(resolve(reader.pages[0].get("/Resources")).get("/Properties")) or {}
                used = set(doc_report["pages"][0]["layer_tags"])
                valid_props = all(tag in props and reference_key(props[tag]) in group_keys for tag in used)
                check(name, "four_layer_tags_resolve_to_catalog", len(used) == 4 and valid_props, {"used_tags": sorted(used)})
        except Exception as error:
            check(name, "inspection_completed", False, f"{type(error).__name__}: {error}")
    check("library", "exactly_24_pages", total_pages == 24, {"actual": total_pages})
    check("library", "all_24_preview_images", len(previews) == 24, {"actual": len(previews)})
    contact_path = preview_dir / "CONTACT-SHEET-24-PAGES.png"
    if previews:
        make_contact_sheet(previews, contact_path)
        report["contact_sheet"] = str(contact_path)
    failed = [item for item in report["checks"] if not item["ok"]]
    report["status"] = "passed" if not failed else "failed"
    report["totals"] = {"pdfs": len(pdfs), "pages": total_pages, "preview_images": len(previews), "checks_passed": len(report["checks"]) - len(failed), "checks_failed": len(failed)}
    report_path = library / "QA-REPORT.json"
    report_path.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({"status": report["status"], **report["totals"], "report": str(report_path), "contact_sheet": str(contact_path)}, indent=2))
    if failed:
        for item in failed[:12]:
            print(f"FAIL {item['scope']} / {item['test']}: {item['details']}", file=sys.stderr)
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
