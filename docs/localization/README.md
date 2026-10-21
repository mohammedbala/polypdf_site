# Regional walkthrough media

This branch implements media routing and Germany’s regional construction library, form, evaluation kit, electrical reference worksheet and takeoff references for the German-first product localization plan. The German pilot has 76 verified asset mappings and four complete routes: [calibration](calibration-de/README.md), [area/cutouts/depth](area-de/README.md), [symbol count](count-de/README.md), and [drawing comparison](compare-de/README.md). Each uses German app captures, matching regional PDFs and verified instructions in the normal local build. The rest of the pack remains incomplete. Nothing has been published.

The app repository’s detailed scope, evidence and remaining implementation plan is at `docs/audits/global-localization-2026-10-20/README.md`.

The [German markup-table draft](markup-de/README.md) adds a verified X101 practice PDF, 97 source-bound copy overrides and two actual German app captures. Status/comment editing, five readable columns, metric paper dimensions and the two-row filter are verified. Native Save, exports and fresh-process reopen remain pending because the Mac was locked. This draft does not add a completed route or activate new media mappings.

## Registry and inventory

`src/localization/product-locales.json` is an explicit, hashed import of the app’s canonical locale registry. Import with:

```sh
node scripts/localization/sync-locales.cjs --app-root /path/to/app-repository/polypdf
```

The agreed app rollout includes English, German and 19 additional locale variants. Hebrew is excluded from the new rollout; pre-existing toolkit support is unchanged.

The latest registry import marks Spanish, French, Brazilian Portuguese, Italian, Dutch, Polish and Turkish as app pilots alongside German. The first six have complete draft app catalogs, regional A2 quick-start PDFs and two actual Mac capture scenarios each, with 36 live checks and ordinary/append-only PDF verification. Their app evidence is under `docs/audits/global-localization-2026-10-20/regional-quick-start/`. The subsequent Turkish pilot completed its catalog locally, added a matching regional drawing and passed six live Mac checks; its source, saved output and app captures are under `turkish-quick-start/` beside that evidence. This registry status does not activate website packs: every walkthrough and regional sample family still needs its own completed coverage.

[Source inventory](source-inventory.json) covers all 91 English routes, 149 candidate assets/downloads, 26 PDFs and 34 assets in the app repository’s Teams walkthrough. It records actual file hashes and page references, including currently English-only routes. Some candidates are language-neutral brand graphics or technical downloads and require explicit classification. Dynamic UI states and external CSS are outside this static inventory.

Regenerate after a fresh site build:

```sh
npm run localization:inventory -- --build-dir build --app-root /path/to/app-repository --output docs/localization/source-inventory.json
```

## Media pack contract

`src/localization/walkthrough-media.json` maps each original asset to a locale-specific replacement under `/localized-media/<site-id>/`. Each mapping records the app locale, region, app build, verified status, source SHA-256 and output SHA-256. Responsive sources, posters, video files, caption files and drawing downloads use the same resolver.

An activated pack must resolve every required page asset. The build verifies actual source/output bytes, so changing a screenshot or PDF invalidates its old replacement. Missing mappings, draft records, wrong regions and modified files fail the build. Neutral assets are explicitly allowlisted; the current exception is the PolyPDF brand icon.

For pilot enforcement:

```sh
POLYPDF_LOCALIZED_MEDIA_LOCALES=de node scripts/international/build.cjs
```

This currently **fails intentionally** on a missing German `/og-image.png` replacement. Mark a locale pack `complete` only after all its media, examples and page expectations have been verified. Completed packs are enforced on every normal build.

A pilot may also declare an individual route in `locales.<id>.pages`. Only a `complete` route with a matching locale/region activates its regional media. Its reviewed text overrides and element replacements are source-bound; stale copy, missing assets and changed bytes stop the build. Article image metadata uses the same verified asset as the visible hero. The international verifier compares those routes with their exact mapped images, while unfinished routes retain the original image checks.

The main website build currently succeeds with the existing published localization behavior. It is not evidence that German media conversion is complete.

## Verification

- `npm run test:localized-media`: 13/13, covering media provenance, regional image dimensions/descriptions, German form downloads, source-bound exercise copy and regional table structure/quantities, and the actual German flooring export files/source links.
- `node --test test/international.test.cjs test/international-consent.test.cjs`: 11 existing localization/consent cases passed after building.
- The electrical component's same-page navigation regression also passed.
- The preceding `npm run build` passed, including 240 guide translations and 836 translated toolkit pages. This download-replacement milestone reuses its unchanged English bindings and runs the targeted page/media checks; it does not claim a new full site build.
- German pilot enforcement: expected missing-asset failure, confirming no silent English fallback when enabled.

## German regional takeoff references

`public/localized-media/de/samples/takeoff/` contains four A2 PDFs, two CSVs, four previews and a German HTML guide for a fictional Bürgerhaus annex. At 1:50, the net room areas are 20.52 m² and 16.20 m², totaling 36.72 m². The electrical exercise has eight Type A and four Type B lights, with a separate 9 m + 3.6 m route. The reference calculation keeps net area, a 10% waste assumption, 2 m² packs and rounding surplus separate.

The verifier reads painted PDF operators and checks three known spans, two areas, two route legs, all twelve fixture graphics and excluded legends/endpoints. It also compares fifteen decimal-comma CSV rows against independent arithmetic and the reference PDFs. Five tests include altered scale, a removed fixture, a shifted route and an incorrect pack quantity. The eleven generated artifacts reproduce byte-for-byte. Refactoring the English generator for safe geometry reuse leaves its six source/reference files byte-identical.

The app writer/importer passes four ordinary/append-only save/reopen cases, with decimal commas and `m²` preserved even after stripping private metadata. The earlier area-unit and English-prefix gaps are fixed: the route total now paints `Länge: 12,60 m`, clear of the source dimensions. The refreshed receipt also checks editable caption import. Separate actual Mac captures in the app audit verify reopening and interface-language switches. A later Mac export flow now supplies the flooring worksheet CSV and PDF summary described below; complete workflow capture remains outstanding.

Twenty-six exact-source text records and two metric tables are bound across six built pages. Source-preview alt text now describes the German geometry and survives ordinary translation. `page-validation.json` records the precise scope and hashes; it does not qualify the rest of each page. Seven flooring-download links across three of those pages now resolve to verified German replacements. Historical electrical outputs remain explicitly identified and still require German replacements. The full pack remains inactive.

Reproduce with Python containing ReportLab, pypdf and Pillow, plus Poppler:

```sh
python3 scripts/generate-regional-takeoff.py
python3 scripts/verify-regional-takeoff.py
npm run test:regional-takeoff
# From the app's polypdf workspace:
npm run test:regional-takeoff -- --directory /absolute/path/to/site/public/localized-media/de/samples/takeoff
# Refresh source-bound visual and native receipts after reviewing changed outputs, then:
npm run localization:register-takeoff
npm run build
npm run verify:regional-takeoff-pages
```

The previous full site build passed. The current targeted media suite passes 13 tests, and the six-page verifier checks 26 text bindings, two tables and seven flooring-export links. The German guide and all four source/reference PDF pages were visually inspected. Whole-page German walkthrough captures and native platform journeys remain pending.

## German flooring app exports

`public/localized-media/de/samples/takeoff/app-exports/` replaces three historical English downloads: the measured drawing, worksheet CSV and PDF summary. The prepared German drawing is A2 at 1:50 with 20.52 m² and 16.20 m² net areas and a separate 3.60 m height check. Its annotations were created by writer/importer tests and reopened in the actual Mac app. The CSV and summary were then exported through actual app handlers and native Save dialogs in the localization development build, version 1.6.17/build 84.

The drawing and CSV are byte-identical to the verified app audit. The summary is a derivative that replaces three machine-local source links with the corresponding German web drawing; every page content stream remains byte-identical. Both PDF pages were rendered and inspected. The CSV keeps canonical `SUM(...)` formulas and quotes regional decimal commas. The localized guide distinguishes net area, the separate length row and repeated summary/detail sections to prevent double counting.

The importer verifies the app receipt, workflow and all original file hashes. Registration checks its source hash, output bytes, manifest, guide and two rendered previews. The page copy explicitly describes prepared measurements and real exports; it does not claim native calibration/drawing gestures, Windows or native iPad qualification. These downloads do not activate the incomplete screenshot/video pack.

```sh
node scripts/localization/import-takeoff-exports.mjs /absolute/path/to/app/docs/audits/global-localization-2026-10-20/takeoff-reports
# Render and inspect changed PDFs, then refresh app-exports/visual-review.json.
npm run localization:register-takeoff
npm run test:localized-media
npm run verify:regional-takeoff-pages
```

## German regional construction library

The new generator uses metric geometry, a strict region profile and German display copy. It creates 12 PDF sets/24 A1 sheets around a fictional 24 m × 15 m Bürgerhaus, including a 60 m × 40 m site, architecture revisions, structure, services, landscape, finishes, coordination and two image-only scanned sheets. Titles, addresses, dates, schedules, legends, reference quantities and decimal separators are German. Details have individual physical scales. Scans are derived from the German vector originals.

The PDF verifier checks 274 references against painted PDF paths, dimensions, areas, volumes, tags, plan/legend counts, internal links, bookmarks, four optional-content layers and three editable review notes. Four negative regression cases prove that missing geometry and incorrect physical scale/quantity declarations fail. All sheets have PNG previews; the visual review receipt records contact-sheet coverage and ten full-size inspections, including the resulting spacing corrections.

The app’s actual annotation writer/importer and measurement service passed **24 save/reopen cases** (12 documents × ordinary/append-only), retaining metre quantities, German comments, page sizes, source links, bookmarks and layer names. This is library persistence evidence, not Windows/iPad/Teams or native UI qualification.

Artifacts are under `public/localized-media/de/samples/construction/`. `DEMO-GUIDE.html` is the browsable German guide; `reference-quantities.csv` uses decimal commas and semicolon delimiters. The ZIP contains all 44 artifacts and has been reopened and verified byte-for-byte. The source-bound geometry, visual and app-persistence receipts are included.

Reproduce with Python containing ReportLab, pypdf and Pillow, plus `pdftoppm` on PATH:

```sh
npm run samples:generate-regional -- --locale de-DE
npm run samples:verify-regional -- public/localized-media/de/samples/construction
npm run test:regional-geometry
# From the app's polypdf workspace:
npm run test:regional-library -- --directory /absolute/path/to/site/public/localized-media/de/samples/construction
```

After inspecting changed previews, update `visual-review.json` with the exact manifest/preview hashes and copy the matching app persistence receipt into `native-roundtrip.json`. Repackage with `regional_library.package_library` so the archive includes those receipts, then run:

```sh
npm run localization:register-library -- --locale de --app-build 1.6.17+84
```

Registration refuses missing/stale geometry, visual or persistence receipts. The media resolver updates preview dimensions along with URLs, preserving the A1 aspect ratio. This registration is local preparation and leaves the pack in `pilot`.

## German regional form

Germany's A4 form is under `public/localized-media/de/samples/forms/`. Ten fields and twelve widgets pass canonical-field/widget checks, independent fill/save/reopen and both actual PolyPDF form-saving paths. Four full-page previews cover the source, independent output and ordinary/append-only app output. The form keeps German labels, umlauts, a fictional regional project and `TT.MM.JJJJ` dates; its field map uses semicolons. Default English/French generation remains byte-identical.

Reproduce and register it with:

```sh
python3 scripts/generate-form-practice.py --locale de --output public/localized-media/de/samples/forms
python3 scripts/verify-form-practice.py --locale de --source public/localized-media/de/samples/forms --output .tmp/localization/forms/de
# From the app's polypdf workspace:
npm run test:regional-form -- --source /absolute/path/to/site/public/localized-media/de/samples/forms/construction-review-form-de.pdf
# After rendering and inspecting all four outputs and refreshing the source-bound receipts:
node scripts/localization/register-regional-form.cjs --app-build 1.6.17+84
```

The regional form section replaces the English/French choice with one correctly labelled German download and updates its field-map label, description and evidence note. An unrelated alternate-language link still fails coverage. Registration leaves the full German pack in `pilot`. Native Mac/Windows/iPad form UI testing remains pending.

## German evaluation kit

`public/localized-media/de/samples/evaluation/` derives six PDFs/twelve A1 sheets from the verified German library. Its guide and fourteen references use the 5 m calibration, 24 × 15 m footprint, 360 m² area, German finishes/counts/revisions and German OCR search terms. UTF-8 CSVs use semicolons and decimal commas. The results checklist contains 33 blank rows across Mac, Windows and iPad; it is an evaluation form, not completed platform evidence.

The deterministic ZIP contains eleven entries, including the original regional PDFs, guide, CSVs, manifest and checksums. Generation reopens it and compares every entry byte-for-byte. Changed source PDF bytes or stale library evidence are rejected. The online guide uses web-relative drawing links and has its own hash; the full guide was visually inspected in the in-app browser.

```sh
python3 scripts/generate-regional-evaluation.py
# After reviewing a changed guide, update its source-bound visual-review.json:
node scripts/localization/register-regional-evaluation.cjs
```

The page build applies regional exercise copy before ordinary translation. Authored `data-regional-copy` elements require an exact source-text match and a nonempty regional replacement; stale copy stops the build. This keeps exercise instructions and PDF quantities aligned. The flooring examples now use the verified German replacements above; the older electrical app-export examples retain their original identity and remain a coverage gap.

## German electrical reference worksheet

`public/localized-media/de/samples/electrical/` contains a German guide, semicolon CSV and source manifest for E101/E501. The three separate categories follow the actual German PDF: 24 lights, 12 sockets and eight switches. All 44 plan tags and the three excluded legend symbols are checked against the verified regional library. The physical schematic segments are 6.5 + 22 + 6 = 34.5 m; the guide distinguishes them from installation quantities and distinguishes the unscaled E501 schematic from its separately calibrated 1:5 detail.

Every observed count and app field starts blank. The guide and all four electrical exercise sections were inspected in the in-app browser. The latter use 13 source-bound replacements, a three-row regional table and 38 additional German draft translations. Actual prerendered markup passed strict translation without fallback and resolves the German PDF, CSV and guide. Table replacement uses plain text and retains accessible headers; changed original rows, interactive content or invalid target shapes are rejected. Three corruption probes rejected changed PDF bytes, a wrong device count and changed route geometry.

```sh
python3 scripts/generate-regional-electrical.py
npm run build
node scripts/localization/verify-regional-electrical-page.cjs
# Inspect README.html and build/local-electrical-preview.html.
# Refresh the exact-source guide/page visual receipts when content changes.
node scripts/localization/register-regional-electrical.cjs
```

The page verifier retains an existing visual review only when the preview bytes are unchanged. Registration checks guide, component, catalog and regional-profile hashes. The full electrical page's screenshots, metadata, FAQ and currently English-only route policy remain pending; this receipt covers its four exercise sections, not a finished localized page or actual symbol-search run.

There are now 65 verified German media mappings: 41 for the construction library, three for the form, six for evaluation resources, three for the electrical worksheet, nine for takeoff source/reference assets and three for flooring app-output replacements. Full-pack activation is still blocked by the remaining media.

## Content still required

Complete the remaining electrical/count app-output replacements, conversion and spreadsheet samples, then build the other locale profiles. Capture each workflow in the corresponding app locale using its regional PDF. Regenerate responsive images, posters, video variants, captions and narration, then update guide instructions to the same dimensions and results. Existing US walkthrough counts and sheet names elsewhere, including the shared blog construction-example components, must be rewritten before the German pack is activated.

Teams uses a separately served walkthrough from the app repository. Its assets are inventoried separately and need the same locale/region/provenance rules in that serving path. Existing English-only Teams and samples routes must be brought into the localized page policy before the rollout can be considered complete.
