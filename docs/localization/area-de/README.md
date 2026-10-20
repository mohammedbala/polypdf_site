# German area, cutouts and depth guide

`/de/blog/measure-pdf-area-cutouts-depth/` now uses an actual German PolyPDF screenshot and a matching regional demonstration drawing. Its main download opens S-102 directly. The source PDF, reference CSV and independent geometry receipt are also linked under Quellen und Downloads. The older US survey attribution and quantities are replaced by the actual fictional German drawing's provenance and metric values.

## Evidence

- `public/localized-media/de/samples/area/`: German A3 PDF, rendered preview, physical geometry manifest, semicolon CSV and independent PDF verification. The PDF catalog has `/Lang de-DE`; every extracted character stays inside the page frame. Three independently read painted rectangles are 96, 4 and 6 m² within 0.0001 m² after PDF coordinate rounding.
- `public/localized-media/de/guides/area/`: three actual Mac app screenshots and sanitized verification. The app calibrates 4 m, checks 12 m and 8 m, traces the outer rectangle, adds both interior rings, and enters 0,15 m. Labels show 96,00 m² gross, 86,00 m² net and 12,90 m³. The inspector heading and accessible group name show Fläche.
- `page-verification.json` in the guide media directory: exact images/downloads, formulas, metric supplemental I101 and F-101 exercises, provenance, accessible descriptions and consistent hero/social/Article image metadata.
- [Browser preview](browser-preview.png) and [language-switch receipt](browser-language-check.json): actual in-app browser selection Deutsch→English→Deutsch swaps the screenshot and drawing. The direct German PDF was downloaded and its hash matches the verified source.

App build 1.6.17 build84: source `e27c03301064db91e92566584f32f7aa5c349abc93767593007f3a1f29167d40`, packaging-scoped bundles `b3fdf846c56dd118f1fbef1972833c08d4a53fe5a35e1b1fd94fe6903107da93`. The app checkout has the small inspector subject fix and an `area-guide` audit. Its 86 localization checks, 57 markup-table/subject checks, TypeScript, desktop build and shared iPad build passed. Captures are Mac development evidence, not a shipped release or Windows/native iPad test.

## Reproduction

Use Python with ReportLab, pypdf and pdfplumber and Poppler on PATH. Read the PDF skill before authoring.

```sh
python3 scripts/generate-area-demo-de.py
python3 scripts/verify-area-demo-de.py
pdftoppm -scale-to 1600 -singlefile -png public/localized-media/de/samples/area/bodenplatte-aussparungen-uebung.pdf public/localized-media/de/samples/area/bodenplatte-aussparungen-uebung
POLYPDF_APP_ROOT=/absolute/path/to/isolated/app/polypdf node scripts/localization/capture-area-de.mjs
node scripts/localization/register-area-de.cjs
```

Inspect the PDF preview and every app capture before registration. The capture launches and normally tears down its own profile, uses UI controls/pointer gestures, and reads the automation observer only. It disables bundled plugins, keeps the source drawing unchanged, and lets Undo's PDF reload settle before drawing.

Copy the changed `public/localized-media/de/samples/area` and `public/localized-media/de/guides/area` folders into their corresponding `build` locations, then:

```sh
node scripts/international/build.cjs
node --test test/international.test.cjs test/localized-walkthrough-media.test.cjs test/regional-takeoff-exports.test.cjs test/regional-calibration-page.test.cjs
node scripts/localization/verify-area-page.cjs
node scripts/localization/verify-calibration-page.cjs
node scripts/localization/verify-regional-takeoff-pages.cjs
node scripts/international/verify.cjs
```

26 website unit checks, both complete page verifiers, six regional takeoff-page bindings and all 240 existing-language pages passed. This exercised the international transformation of the existing English prerender; no React content source changed. `pages.cjs` now supports source-bound replacement download links with locale-restricted paths and byte hashes. The German pack remains a pilot, with 71 mappings and two completed routes. Remaining German pages and other locale packs are not activated by these route completions.

S-102 demonstrates straight interior cutouts and uniform depth. It does not prove curved geometry, saving/reopening, Windows/native iPad, or full construction-domain language review. Its reference CSV is independently generated, not an app export. The page labels the existing F-101 reopened/exported results as a separate exercise. No deployment, push, PR, email or production release occurred.
