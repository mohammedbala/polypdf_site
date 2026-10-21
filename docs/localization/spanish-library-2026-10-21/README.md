# Spanish construction library — 21 October 2026

The Spanish pilot now contains twelve PDF sets and twenty-four A1 construction sheets for the fictional Centro Vecinal Los Olmos in Spain. The pack includes twenty-four previews, a contact sheet, an HTML guide, a semicolon-delimited reference CSV and a verified archive. Spanish drawing labels, room names, equipment tags, dates, decimal commas, filenames and PDF language metadata accompany the metric geometry.

Forty-one source-to-regional assets and 98 source-bound website copy records are registered, with 24 Spanish image descriptions. The shared library and six exercises now use matching Spanish drawings, sheet numbers, download filenames, calibration values, quantities and OCR terms. The pack remains `pilot` with zero complete walkthrough routes; the full samples page stays English-only until its other regional sample families are ready.

## Verification

- All 24 sheets pass independent structure, text bounds, bookmark/link, symbol-count and geometry checks, covering 274 physical references. The image-only scans are derived from the Spanish vector drawings and contain no preinstalled text layer.
- All 24 final sheets were inspected in the contact sheet; twelve full-size previews were inspected for text expansion, equipment tags, notes, schedules, coordination details and scan legibility. The exact reviewed bytes are bound in the pack's `visual-review.json`.
- All twelve sources pass both ordinary and append-only PolyPDF writer/importer checks: 24 cases. Calibration, metric quantities, authored Spanish notes, page boxes, links, bookmarks, layers and PDF language persist. These are core-operation checks, not native application UI or Windows/iPad qualification.
- Sixteen generated Spanish source artifacts reproduce byte-for-byte in a fresh temporary directory. The shared generator is unchanged, and all 45 tracked German artifacts, all 45 tracked French artifacts and both existing media records remain byte-identical to the previous commit.
- The shared-component verifier checks all three regional libraries against fresh React prerendered source: each has 12 cards, six exercises, 19 images, 21 downloads and 98 matching copy records. Fifteen media tests and eight international-page tests pass. The prerender produced 91 routes plus 404; the international build and verification pass for 240 pages. These stages use the existing compiled site assets; no full production bundle build is claimed.
- The built-in browser shows Spanish copy and matching images without horizontal overflow at 1280 × 720 and 390 × 844. All 19 desktop preview images loaded. The library header, settled electrical exercise and mobile header were visually inspected and captured. Other exercise text is checked through DOM receipts; those receipts were gathered during anchor scrolling and do not claim six settled visual captures.
- The ZIP downloaded through the visible browser link matches the source SHA-256. All 44 entries match their checked source bytes, including the twelve PDFs and previews. The archive is retained in Downloads as well as the repository.

## Reproduction

Use the bundled Python runtime with ReportLab, pypdf, Pillow and Poppler on PATH. Generate with `assets-source/samples/construction-library/regional_library.py --locale es-ES`, then run `verify_regional_library.py public/localized-media/es/samples/construction`. From the app workspace, run `node scripts/localization/verify-regional-library.mjs --directory <absolute-library-directory>`; its receipt is written under the app's `.tmp/localization/evidence/es-ES/regional-library/`, then copied to the pack only after matching the manifest hash.

After visual inspection and persistence verification, the existing `package_library` helper packages the checked sources. Register with `node scripts/localization/register-regional-library.cjs --locale es --app-build 1.6.17+84`. Run `node scripts/prerender.js`, then `node scripts/localization/verify-library-copy.cjs --audit docs/localization/spanish-library-2026-10-21` to generate the local shared-library preview. The verifier discovers registered regional copy profiles and accepts a separate audit destination so previous receipts are preserved.

## Remaining

Spanish native-speaker construction review, actual Spanish app walkthrough captures/videos, other Spanish sample families and Windows/native iPad journeys remain open. German redaction native Save/reopen remains pending because the Mac is locked. No app product code, release identity, production site or update feed was changed. The temporary preview server and browser tab were closed, and the viewport override was reset.
