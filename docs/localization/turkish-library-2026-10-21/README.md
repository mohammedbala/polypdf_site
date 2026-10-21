# Turkish construction library — 21 October 2026

The Turkish pilot now contains twelve PDF sets and twenty-four A1 sheets for the fictional **Ihlamur Mahalle Merkezi** in Türkiye. Its profile supplies 205 drawing labels, 45 reference-quantity labels, 18 equipment-tag prefixes, Turkish filenames and dates, decimal commas, dot grouping and metric geometry. The PDFs declare `tr-TR`; the image-only scans derive from the Turkish vector drawings. The package includes a guide, quantities, previews and a ZIP. These are demonstration drawings with no standards-compliance claim.

Forty-one asset mappings, 101 shared-library/exercise copy records and 24 preview descriptions are registered. All six exercises match the Turkish filenames, calibration, geometry, quantities, revision changes and OCR terms. The pack remains `pilot` with zero completed walkthrough routes. The full Turkish site catalog and other sample families are still required before route activation.

## Verification and verifier repair

The existing Noto Sans selection supports the complete Turkish profile and equipment tags. Actual PDF extraction preserves `I ı İ i Ç ç Ğ ğ Ö ö Ş ş Ü ü` in both weights. No shared generator, geometry, fonts or font-size minimum changed. All six existing font/geometry tests pass.

The initial core run passed 23 of 24 document cases. The coordination document exposed a verifier assumption: it required every optional-content layer name to be a PDF literal string, although the writer legitimately emitted a hexadecimal PDF text string. App commit `5f7e2b3795b77c560d26a458ddbca315fd567f9d` repairs the test helper to decode either representation and reject other types. Two additional tests verify actual save/reopen of both encodings and rejection of a name object. The receipt now also requires those verifier checks to pass. This changes test code only, not application saving behavior. Initial failures, including the first incorrectly encoded test fixture, are preserved here; the fixture failure log is stored losslessly as `.log.gz`.

- Independent PDF structure, text bounds, symbols, bookmarks, links, layers and geometry checks pass on all 24 sheets, covering **274 physical references**. All sheets were inspected in the contact sheet and twelve full-size previews were inspected for Turkish characters, expanded labels, schedules, tags, notes, details and scan legibility. No clipping or missing glyphs was found.
- All twelve Turkish PDFs pass ordinary and append-only writer/importer checks: **24 document cases plus two verifier tests**. Calibration, quantities, Turkish notes, PDF language, page boxes, bookmarks, links and layers persist. Independent pypdf reopening confirms the four exact Turkish layer names in the source and both saved variants. The historical filename `native-roundtrip.json` denotes core-operation evidence, not native UI or platform qualification. The app source is `5f7e2b37`, build `1.6.17+84`.
- Rerunning all seven earlier libraries with the repaired verifier passes **168 document cases plus 14 verifier tests**. Together with Turkish, this is **192 document cases and 208 tests**. Earlier public receipts remain unchanged; fresh regression receipts are retained under `core-regressions/`.
- **Sixteen Turkish source artifacts regenerate byte-for-byte**. All **317 baseline files** (315 earlier pack files and the shared generator/verifier) and all seven prior media-pack objects remain unchanged. See `regeneration.json` and `existing-packs-preserved.json`.
- All eight shared libraries pass exact copy, asset, filename and quantity checks: **101 copy records, 12 cards, six exercises, 19 images and 21 downloads each**. **16 media tests, eight international tests, 91 freshly prerendered routes plus 404 and all 240 international page checks pass**. These stages reuse existing compiled site assets; no full production bundle build is claimed.
- Built-in browser checks pass at **1280 × 720** and **390 × 844**, without horizontal overflow. All 19 desktop images load. The header, settled electrical exercise and mobile header were visually inspected. The visible ZIP link downloads bytes matching the registered archive; all **44 archive entries** match their source files. These screenshots are local website QA, not app walkthrough captures.

The temporary tab and local server were closed and the viewport override reset. Copy remains an editorial draft awaiting native-speaker construction review. No native recording, app product-code change, release identity change or publication occurred.

## Reproduction

Use Python with ReportLab, pypdf and Pillow, plus Poppler on PATH:

```sh
python3 -m unittest discover -s assets-source/samples/construction-library -p test_regional_library.py
python3 assets-source/samples/construction-library/regional_library.py --locale tr-TR
python3 assets-source/samples/construction-library/verify_regional_library.py public/localized-media/tr/samples/construction
```

From the app worktree, run `node polypdf/scripts/localization/verify-regional-library.mjs --directory <absolute-library-directory>`. Match the manifest and app source hashes before copying the receipt from `polypdf/.tmp/localization/evidence/tr-TR/regional-library/`. Inspect final renders and write the separate visual receipt before using `package_library`.

Register with `node scripts/localization/register-regional-library.cjs --locale tr --app-build 1.6.17+84`. Run `node scripts/prerender.js`, then `node scripts/localization/verify-library-copy.cjs --audit docs/localization/turkish-library-2026-10-21`. Copy `public/localized-media/tr` into `build/localized-media/tr` before serving `build/local-library-tr-preview.html` locally.

## Remaining

All eight translated app pilots now have construction libraries. Full Italian, Dutch, Polish and Turkish site catalogs, native-speaker review, remaining sample families, additional planned languages, actual app walkthrough screenshots/videos and Windows/native iPad journeys remain open. The overall localization goal remains active.
