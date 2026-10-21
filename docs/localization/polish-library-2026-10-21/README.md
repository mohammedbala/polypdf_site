# Polish construction library — 21 October 2026

The Polish pilot now contains twelve PDF sets and twenty-four A1 sheets for the fictional **Dom Sąsiedzki Lipowy** in Poland. The profile supplies 205 drawing labels, 45 reference-quantity labels, 18 equipment-tag prefixes, Polish filenames and dates, decimal commas, space grouping and metric geometry. The PDFs declare `pl-PL`; the image-only scans derive from the Polish vector drawings. The package includes a guide, quantities, previews and a ZIP. These are demonstration drawings with no standards-compliance claim.

Forty-one asset mappings, 101 shared-library/exercise copy records and 24 preview descriptions are registered. The six exercises match the Polish filenames, 5 m calibration, geometry, quantities, revision changes and OCR terms. The pack remains `pilot` with zero completed walkthrough routes. The full Polish site catalog and remaining sample families are still required before route activation.

## Polish font coverage

The default Vera faces lack Polish letters. The profile selects Noto Sans regular and bold, copied unchanged with their OFL licenses and source hashes from app commit `2e714923`. Text painting, wrapping and tag masking all use the selected font metrics. Separate font registration names preserve existing locale output in the same process. No geometry or font-size minimum changed.

The font check tests the actual missing-glyph rejection with Vera, then writes and reopens a PDF containing all Polish diacritics in both Noto weights. A second test verifies byte-identical German output before and after Polish font registration. Together with the four existing physical-geometry regression cases, all six tests pass. `font-coverage.json` also checks every character in the complete Polish drawing profile against both selected faces.

## Verification

- Independent PDF structure, text bounds, symbols, bookmarks, links, layers and geometry checks pass on all 24 sheets, covering **274 physical references**. All sheets were inspected in the contact sheet and twelve final full-size previews were inspected for diacritics, expanded labels, schedules, tags, notes, details and scan legibility. No clipping or missing glyphs was found.
- All twelve PDFs pass ordinary and append-only PolyPDF writer/importer checks: **24 cases**. Calibration, quantities, Polish notes, PDF language, page boxes, bookmarks, links and layers persist. The historical filename `native-roundtrip.json` denotes core-operation evidence here; it does not establish native UI or platform qualification. The app source is `2e714923`, build `1.6.17+84`.
- **Sixteen Polish source artifacts regenerate byte-for-byte**, as do all **96 source artifacts from the six earlier libraries** after the font-support change. All 270 existing pack files, the independent PDF verifier and all six prior media-pack objects remain unchanged. See `regeneration.json` and `existing-packs-preserved.json`.
- All seven shared libraries pass exact copy, asset, filename and quantity checks: **101 copy records, 12 cards, six exercises, 19 images and 21 downloads each**. **16 media tests, eight international tests, 91 freshly prerendered routes plus 404 and all 240 international page checks pass**. The prerender and international stages use existing compiled site assets; no full production bundle build is claimed. The earlier Italian checkpoint records nine dedicated German guide regressions; those guides and their public receipts were not changed here.
- Built-in browser checks pass at **1280 × 720** and **390 × 844**, with no horizontal overflow. All 19 desktop images load. The header, settled electrical exercise and mobile header were visually inspected. The visible ZIP link downloads bytes matching the registered archive; all **44 archive entries** match their source files. These screenshots are local website QA, not native app walkthrough captures.

The temporary tab and local server were closed and the viewport override reset. Polish copy remains an editorial draft awaiting native-speaker construction review. No native recording, app product-code change, release identity change or publication occurred.

## Reproduction

Use Python with ReportLab, pypdf and Pillow, plus Poppler on PATH:

```sh
python3 -m unittest discover -s assets-source/samples/construction-library -p test_regional_library.py
python3 assets-source/samples/construction-library/regional_library.py --locale pl-PL
python3 assets-source/samples/construction-library/verify_regional_library.py public/localized-media/pl/samples/construction
```

From the app worktree, run `node polypdf/scripts/localization/verify-regional-library.mjs --directory <absolute-library-directory>`. Match the receipt's manifest hash before copying it from `polypdf/.tmp/localization/evidence/pl-PL/regional-library/` into the pack. Inspect the final rendered sheets and write the separate source-bound visual receipt before running the existing `package_library` helper.

Register with `node scripts/localization/register-regional-library.cjs --locale pl --app-build 1.6.17+84`. Run `node scripts/prerender.js`, then `node scripts/localization/verify-library-copy.cjs --audit docs/localization/polish-library-2026-10-21`. Serve `build/local-library-pl-preview.html` locally after copying `public/localized-media/pl` into `build/localized-media/pl`.

## Remaining

Polish full-site translation, native-speaker review, actual app walkthrough screenshots/videos, other sample families and Windows/native iPad journeys remain open. Turkish and later language groups still need construction libraries. The overall localization goal remains active.
