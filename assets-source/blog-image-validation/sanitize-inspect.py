#!/usr/bin/env python3
"""Inspect the exact PDF structures used by the Sanitize Document evidence workflow."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any

from pypdf import PdfReader


TARGET = "CASE-ORCHID-742"


def dereference(value: Any) -> Any:
    return value.get_object() if hasattr(value, "get_object") else value


def name_tree_flags(root: Any) -> dict[str, bool]:
    names = dereference(root.get("/Names")) if root.get("/Names") is not None else {}
    return {
        "javaScript": bool(names and names.get("/JavaScript") is not None),
        "embeddedFiles": bool(names and names.get("/EmbeddedFiles") is not None),
    }


def count_xobjects(resources: Any, *, nested: bool = False, seen_forms: set[tuple[int, int]] | None = None) -> dict[str, int]:
    counts = {
        "topLevelImages": 0,
        "nestedImages": 0,
        "topLevelForms": 0,
        "nestedForms": 0,
    }
    seen_forms = seen_forms if seen_forms is not None else set()
    resources = dereference(resources) if resources is not None else {}
    xobjects = dereference(resources.get("/XObject")) if resources and resources.get("/XObject") is not None else {}
    for reference in (xobjects or {}).values():
        identifier = (getattr(reference, "idnum", -1), getattr(reference, "generation", -1))
        obj = dereference(reference)
        subtype = str(obj.get("/Subtype"))
        if subtype == "/Image":
            counts["nestedImages" if nested else "topLevelImages"] += 1
        elif subtype == "/Form":
            counts["nestedForms" if nested else "topLevelForms"] += 1
            if identifier != (-1, -1) and identifier in seen_forms:
                continue
            if identifier != (-1, -1):
                seen_forms.add(identifier)
            child = count_xobjects(obj.get("/Resources"), nested=True, seen_forms=seen_forms)
            for key, value in child.items():
                counts[key] += value
    return counts


def attachment_facts(reader: PdfReader) -> dict[str, Any]:
    rows: list[dict[str, Any]] = []
    for page_index, page in enumerate(reader.pages):
        annots = dereference(page.get("/Annots")) if page.get("/Annots") is not None else []
        for reference in annots or []:
            annotation = dereference(reference)
            if str(annotation.get("/Subtype")) != "/FileAttachment":
                continue
            file_spec = dereference(annotation.get("/FS")) if annotation.get("/FS") is not None else {}
            embedded = dereference(file_spec.get("/EF")) if file_spec and file_spec.get("/EF") is not None else {}
            stream = dereference(embedded.get("/F")) if embedded and embedded.get("/F") is not None else None
            payload = stream.get_data() if stream is not None and hasattr(stream, "get_data") else b""
            rows.append(
                {
                    "page": page_index + 1,
                    "filename": str(file_spec.get("/F", "")),
                    "contents": str(annotation.get("/Contents", "")),
                    "payloadBytes": len(payload),
                    "payloadSha256": hashlib.sha256(payload).hexdigest() if payload else "",
                }
            )
    return {"count": len(rows), "items": rows}


def inspect(pdf_path: Path) -> dict[str, Any]:
    payload = pdf_path.read_bytes()
    reader = PdfReader(str(pdf_path))
    root = dereference(reader.trailer["/Root"])
    metadata = dict(reader.metadata or {})
    text = "".join((page.extract_text() or "") for page in reader.pages)
    xobjects = {"topLevelImages": 0, "nestedImages": 0, "topLevelForms": 0, "nestedForms": 0}
    thumbnails = 0
    page_additional_actions = 0
    page_metadata_streams = 0
    page_associated_files = 0
    for page in reader.pages:
        page_counts = count_xobjects(page.get("/Resources"))
        for key, value in page_counts.items():
            xobjects[key] += value
        thumbnails += page.get("/Thumb") is not None
        page_additional_actions += page.get("/AA") is not None
        page_metadata_streams += page.get("/Metadata") is not None
        page_associated_files += len(dereference(page.get("/AF")) or []) if page.get("/AF") is not None else 0
    open_action = dereference(root.get("/OpenAction")) if root.get("/OpenAction") is not None else None
    return {
        "pdf": str(pdf_path.resolve()),
        "sha256": hashlib.sha256(payload).hexdigest(),
        "byteLength": len(payload),
        "pageCount": len(reader.pages),
        "metadata": {str(key): str(value) for key, value in metadata.items()},
        "metadataEntryCount": len(metadata),
        "catalogMetadataStream": root.get("/Metadata") is not None,
        "pageMetadataStreams": page_metadata_streams,
        "nameTrees": name_tree_flags(root),
        "catalogAdditionalActions": root.get("/AA") is not None,
        "catalogOpenActionJavaScript": bool(open_action and str(open_action.get("/S")) == "/JavaScript"),
        "pageAdditionalActions": page_additional_actions,
        "catalogAssociatedFiles": len(dereference(root.get("/AF")) or []) if root.get("/AF") is not None else 0,
        "pageAssociatedFiles": page_associated_files,
        "directFileAttachmentAnnotations": attachment_facts(reader),
        "acroFormPresent": root.get("/AcroForm") is not None,
        "pageThumbnails": thumbnails,
        "xobjects": xobjects,
        "targetTextCount": text.count(TARGET),
        "extractedTextLength": len(text),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    facts = inspect(args.pdf)
    encoded = json.dumps(facts, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(encoded, encoding="utf-8")
    print(encoded, end="")


if __name__ == "__main__":
    main()
