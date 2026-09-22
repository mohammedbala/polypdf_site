# Northline Studio synthetic plan pair

These are original, fictional demonstration drawings made for PolyPDF marketing
and product workflows. No customer project, licensed plan, real site address,
professional stamp, or third-party drawing has been reused. The sheets say
**SYNTHETIC DEMO / NOT FOR CONSTRUCTION**. They are not suitable for construction,
permit submission, life-safety review, or professional design reliance.

## Files

- `output/pdf/site-conversion/Northline-Studio-A101-Rev-A.pdf`: initial fit-out.
- `output/pdf/site-conversion/Northline-Studio-A101-Rev-B.pdf`: revised fit-out.
- `output/pdf/site-conversion/coordinate-guide.json`: exact geometry for capture.
- `output/pdf/site-conversion/validation.json`: structural and geometry checks.
- `output/pdf/site-conversion/*-preview.png`: inspected Poppler previews.

Both PDFs contain a single vector page at **18 x 12 inches**, landscape
(1296 x 864 PDF points). Furniture and plan linework use only neutral gray, black,
and white. Text remains selectable. They have identical page boxes, origins, and
scales so compare/overlay can register directly without a manual alignment fix.

## Rebuild

From the repository root, use Python with `reportlab`:

```sh
python3 marketing/site-conversion/generate_sample_drawings.py
pdftoppm -scale-to 1800 -png -singlefile output/pdf/site-conversion/Northline-Studio-A101-Rev-A.pdf output/pdf/site-conversion/Northline-Studio-A101-Rev-A-preview
pdftoppm -scale-to 1800 -png -singlefile output/pdf/site-conversion/Northline-Studio-A101-Rev-B.pdf output/pdf/site-conversion/Northline-Studio-A101-Rev-B-preview
python3 marketing/site-conversion/validate_sample_drawings.py
```

The bundled runtime used for authoring and validation was
`/Users/mohammedbala/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3`.
The generator uses ReportLab's deterministic PDF mode. Rebuilding unchanged
source produces byte-identical PDFs. Visually inspect both previews after edits;
text/geometry checks alone do not prove a good layout.

## Accurate measurement targets

The drawing uses **1/4 inch = 1 foot**: 18 PDF points per foot. All dimensions
reference the plan grid / wall centerlines. Areas below are grid areas, not net
usable room area or a building-code clear dimension.

| Target | Known value | PDF bottom-left points | PDF top-left points |
| --- | --- | --- | --- |
| Overall calibration | 48 ft | (96,774) to (960,774) | (96,90) to (960,90) |
| Footprint | 48 x 28 ft / 1,344 sq ft | (96,216) to (960,720) | (96,648) to (960,144) |
| Project Room 105 | 18 x 12 ft / 216 sq ft | (348,216), (672,216), (672,432), (348,432) | (348,648), (672,648), (672,432), (348,432) |
| Project Room perimeter | 60 ft | Same polygon | Same polygon |
| Meeting Room 102, Rev A | 14 x 12 ft / 168 sq ft | (528,504) to (780,720) | (528,360) to (780,144) |
| Meeting Room 102, Rev B | 16 x 12 ft / 192 sq ft | (528,504) to (816,720) | (528,360) to (816,144) |

Screen coordinates must be transformed using the app's actual page scale and
page offset. These are PDF page coordinates, not fixed screen pixels.

## Suggested workflow captures

1. **Takeoff**: open Rev A, calibrate the 48-foot top dimension, trace Project
   Room 105, and show the 216 sq ft result. Its clear rectangular boundary is
   intentionally easy to trace. Use the six identical Open Studio desks for a
   count example.
2. **Revision comparison**: compare A to B. The meeting/focus partition shifts
   east two feet (PDF x=780 to x=816); Meeting Room 102 increases from six to
   eight seats. Its doorway moves five feet east along the same corridor wall
   (left jamb x=582 to x=672, PDF y=504). Room 106 changes from Break Room to
   Material Library with new shelving and a sample table. Revision markers
   identify all three changes.
3. **Review and handoff**: open Rev B, cloud the changed meeting partition or
   library, add a clear review comment such as “Confirm sample shelving layout,”
   and show the annotation list or saved PDF handoff. Review marks should be
   created in the current app so the video demonstrates real behavior.

Recommended public filenames are
`/samples/conversion/northline-studio-rev-a.pdf` and
`/samples/conversion/northline-studio-rev-b.pdf`. Rev A serves the takeoff and
review sample links; the comparison demo can offer both. Copy the source PDFs
without recompressing or rescaling them so the calibration stays exact.

## Validation

Each final page was rendered with Poppler at 1800 pixels and visually inspected.
The final layout has no clipped text, room text crossing door swings, or furniture
blocking drawn swings. Automated checks verify page count and dimensions,
required labels and synthetic disclaimer, in-page character boxes, and the exact
vector calibration / room-boundary geometry. The JSON records PDF hashes and
file sizes. This validates a demo fixture, not architectural correctness.
