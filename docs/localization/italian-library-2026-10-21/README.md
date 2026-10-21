# Italian construction library — 21 October 2026

The Italian pilot now contains twelve PDF sets and twenty-four A1 sheets for the fictional **Centro Civico dei Tigli** in Italy. The regional profile supplies 205 drawing labels, 45 reference-quantity labels, 18 equipment-tag prefixes, Italian filenames and dates, decimal commas and metric geometry. The PDFs declare `it-IT`; the image-only scans derive from the Italian vector drawings. The package includes a guide, quantities, previews and a ZIP. These are demonstration drawings with no standards-compliance claim.

Forty-one asset mappings, 101 shared-library/exercise copy records and 24 preview descriptions are registered. The six exercises match the actual Italian filenames, 5 m calibration, geometry, quantities, revision changes and OCR terms. The pack remains `pilot` with zero completed walkthrough routes. The full Italian site catalog and remaining sample families are still required before route activation.

## Shared component change

Three generic exercise links previously depended on full-site catalogs. They now have source-bound regional copy in all five library profiles. The existing German, French, Spanish and Brazilian Portuguese targets exactly match their previous catalog translations. The component verifier uses an empty strict translation catalog after regional substitution: all translatable prose must have an explicit regional binding. An additional negative test proves unbound prose still fails. No Italian full-site catalog, route or English fallback was added.

## Verification

- Independent PDF structure, text bounds, symbols, bookmarks, links, layers and geometry checks pass on all 24 sheets, covering **274 physical references**. All sheets were inspected in the contact sheet, with twelve full-size previews inspected for expanded Italian text, schedules, notes, tags, details and scan legibility. No drawing geometry or generator change was needed.
- All twelve PDFs pass ordinary and append-only PolyPDF writer/importer checks: **24 cases**. Calibration, quantities, Italian notes, PDF language, page boxes, bookmarks, links and layers persist. The historical filename `native-roundtrip.json` denotes core-operation evidence here; it does not establish native UI or platform qualification. The app source is `0d4bd7bd`, build `1.6.17+84`.
- **Sixteen source artifacts regenerate byte-for-byte**. All 180 files in the four existing regional construction packs and both shared generator/verifier files are unchanged. Every prior media asset, copy record, page and status is preserved; the only changes to the four old media packs are the three new link-copy bindings. See `regeneration.json` and `existing-packs-preserved.json`.
- All five shared libraries pass exact copy, asset, filename and quantity checks: **101 copy records, 12 cards, six exercises, 19 images and 21 downloads each**. **16 media tests, eight international tests, 91 freshly prerendered routes plus 404, all 240 international page checks and all nine German guide verifiers pass**. Historical public guide receipts were preserved; new regression receipts are under `german-guide-regressions/`. The prerender and international stages use existing compiled site assets; no full production bundle build is claimed.
- Built-in browser checks pass at **1280 × 720** and **390 × 844**, with no horizontal overflow. All 19 desktop images load. The header, settled electrical exercise and mobile header were visually inspected. The visible ZIP link downloads bytes matching the registered archive; all **44 archive entries** match their source files. The screenshots are local website QA, not native app walkthrough captures.

The temporary tab and local server were closed and the viewport override reset. Italian copy remains an editorial draft awaiting native-speaker construction review. No native recording, app product-code change, release identity change or publication occurred.

## Reproduction

Use Python with ReportLab, pypdf and Pillow, plus Poppler on PATH:

```sh
python3 assets-source/samples/construction-library/regional_library.py --locale it-IT
python3 assets-source/samples/construction-library/verify_regional_library.py public/localized-media/it/samples/construction
```

From the app worktree, run `node polypdf/scripts/localization/verify-regional-library.mjs --directory <absolute-library-directory>`. Match the receipt's manifest hash before copying it from `polypdf/.tmp/localization/evidence/it-IT/regional-library/` into the pack. Inspect the final rendered sheets and write the separate source-bound visual receipt before running the existing `package_library` helper.

Register with `node scripts/localization/register-regional-library.cjs --locale it --app-build 1.6.17+84`. Run `node scripts/prerender.js`, then `node scripts/localization/verify-library-copy.cjs --audit docs/localization/italian-library-2026-10-21`. Serve `build/local-library-it-preview.html` locally after copying `public/localized-media/it` into `build/localized-media/it`.

## Remaining

Italian full-site translation, native-speaker review, actual app walkthrough screenshots/videos, other sample families and Windows/native iPad journeys remain open. Dutch, Polish, Turkish and later language groups still need construction libraries. The overall localization goal remains active.
