# Dutch construction library — 21 October 2026

The Dutch pilot now contains twelve PDF sets and twenty-four A1 sheets for the fictional **Wijkcentrum De Linde** in the Netherlands. The profile supplies 205 drawing labels, 45 reference-quantity labels, 18 equipment-tag prefixes, Dutch filenames and dates, decimal commas and metric geometry. The PDFs declare `nl-NL`; the image-only scans derive from the Dutch vector drawings. The package includes a guide, quantities, previews and a ZIP. These are demonstration drawings with no standards-compliance claim.

Forty-one asset mappings, 101 shared-library/exercise copy records and 24 preview descriptions are registered. The six exercises match the actual Dutch filenames, 5 m calibration, geometry, quantities, revision changes and OCR terms. The pack remains `pilot` with zero completed walkthrough routes. The full Dutch site catalog and remaining sample families are still required before route activation.

## Layout correction

The first independent PDF check rejected two long unbroken sidebar titles: `VENTILATIEPLATTEGROND` on M101 and `VLOERAFWERKINGSPLAN` on I101. The profile now uses `PLATTEGROND VENTILATIE` and `AFWERKING VAN VLOEREN`. This preserves the shared geometry, font sizes and existing nine-point floor. The initial failure and offending text bounds remain in `pdf-verification-initial.log` and `initial-layout-findings.json`. All subsequent receipts bind the regenerated final manifest.

## Verification

- Independent PDF structure, text bounds, symbols, bookmarks, links, layers and geometry checks pass on all 24 sheets, covering **274 physical references**. All sheets were inspected in the contact sheet; twelve final full-size previews were inspected, including both corrected titles, expanded Dutch labels, schedules, tags, notes, details and scan legibility.
- All twelve PDFs pass ordinary and append-only PolyPDF writer/importer checks: **24 cases**. Calibration, quantities, Dutch notes, PDF language, page boxes, bookmarks, links and layers persist. The historical filename `native-roundtrip.json` denotes core-operation evidence here; it does not establish native UI or platform qualification. The app source is `00dd4507`, build `1.6.17+84`.
- **Sixteen source artifacts regenerate byte-for-byte**. All 225 files in the five existing regional construction packs, both shared generator/verifier files and all five prior media-pack objects remain unchanged. See `regeneration.json` and `existing-packs-preserved.json`.
- All six shared libraries pass exact copy, asset, filename and quantity checks: **101 copy records, 12 cards, six exercises, 19 images and 21 downloads each**. **16 media tests, eight international tests, 91 freshly prerendered routes plus 404 and all 240 international page checks pass**. The prerender and international stages use existing compiled site assets; no full production bundle build is claimed. The previous Italian checkpoint records the nine dedicated German guide regressions; those guides and their public receipts were not changed here.
- Built-in browser checks pass at **1280 × 720** and **390 × 844**, with no horizontal overflow. All 19 desktop images load. The header, settled electrical exercise and mobile header were visually inspected. The visible ZIP link downloads bytes matching the registered archive; all **44 archive entries** match their source files. The screenshots are local website QA, not native app walkthrough captures.

The temporary tab and local server were closed and the viewport override reset. Dutch copy remains an editorial draft awaiting native-speaker construction review. No native recording, app product-code change, release identity change or publication occurred.

## Reproduction

Use Python with ReportLab, pypdf and Pillow, plus Poppler on PATH:

```sh
python3 assets-source/samples/construction-library/regional_library.py --locale nl-NL
python3 assets-source/samples/construction-library/verify_regional_library.py public/localized-media/nl/samples/construction
```

From the app worktree, run `node polypdf/scripts/localization/verify-regional-library.mjs --directory <absolute-library-directory>`. Match the receipt's manifest hash before copying it from `polypdf/.tmp/localization/evidence/nl-NL/regional-library/` into the pack. Inspect the final rendered sheets and write the separate source-bound visual receipt before running the existing `package_library` helper.

Register with `node scripts/localization/register-regional-library.cjs --locale nl --app-build 1.6.17+84`. Run `node scripts/prerender.js`, then `node scripts/localization/verify-library-copy.cjs --audit docs/localization/dutch-library-2026-10-21`. Serve `build/local-library-nl-preview.html` locally after copying `public/localized-media/nl` into `build/localized-media/nl`.

## Remaining

Dutch full-site translation, native-speaker review, actual app walkthrough screenshots/videos, other sample families and Windows/native iPad journeys remain open. Polish, Turkish and later language groups still need construction libraries. The overall localization goal remains active.
