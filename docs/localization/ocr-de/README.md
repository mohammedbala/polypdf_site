# German OCR walkthrough — 21 October 2026

Status: **complete in the local German pilot**. Six walkthrough routes now have 82 verified asset mappings. The full localization rollout remains incomplete. No deployment, release, push or email occurred.

`/de/blog/ocr-scanned-pdf-drawings/` uses the actual German macOS app with the fictional Bürgerhaus am Lindenpark scan: A101 ground floor and C101 site plan. Both A1 pages use German labels, metric dimensions and the German demonstration region. The original scan has no text layer. The guide's input derivative adds `/Lang de-DE` while preserving page operators and image bytes.

## Executed workflow

The [native receipt](native/validation.json) binds source, capture script and app build hashes. PolyPDF 1.6.17 build 84 source is `b280ed6d1abbf0e504a79b84a6c8e70b9344775e5c4f86080c616d952b9ac413`.

- An owned profile uses German and explicitly selected metric units.
- Before OCR, MEHRZWECKRAUM yields “Keine Treffer.”
- The actual Document → OCR command recognizes both image pages with macOS Vision. Completion reads “OCR abgeschlossen.” at 100%; the cancel button is disabled.
- Real native Save dialogs export the current-session Excel workbook and a separate searchable PDF.
- MEHRZWECKRAUM has one result on page 1; ENTWÄSSERUNG has one result on page 2. Both selected results produce visible yellow highlights.
- After a full app process restart, result snippets, counts and highlight geometry match. The source PDF remains unchanged.
- All three phases quit normally without signals. The disposable profile is gone.

Four actual app screenshots and both saved PDF pages were inspected. The public page uses three app frames and the matching regional scan preview. The second-page search frame is retained as additional evidence.

## Independent output checks and limits

The [PDF receipt](export-verification.json) confirms two German-language pages, persisted OCR metadata, unchanged scan image bytes and one occurrence of each test term in independently extracted text. Some furniture symbols and area units were misrecognized. The guide explicitly describes these errors.

The current writer adds white OCR glyphs at 1% opacity. The result is therefore **not pixel-identical** to the source: at a 1500-pixel long edge, 3,858 and 3,476 of 1,590,000 pixels differ, with a maximum channel difference of 2/255. Both rendered pages were visually reviewed; scan image bytes and page size are unchanged. The guide discloses the faint text rendering rather than claiming exact visual identity.

The native workbook is retained under `native/`. Its OOXML package is valid and contains both German terms. It has Pages and Annotations sheets, with no extra recognized table sheets. This is export/package evidence, not spreadsheet-app layout qualification. Its English sheet names and the English office-export success notice remain app-localization work. The website does not offer this workbook as a fully localized public sample.

The first observer run expected “Keine Treffer” without the catalog's final period. Its failure is retained separately; correcting the observer produced the successful run. Initial page checks caught unused copy for a figure omitted by the English renderer, React's joined source-note text, and the old Willow Creek history sentence. Those were corrected before qualification.

## Website verification

The completed page has 31 source-bound copy overrides and six element replacements. It provides the original scan and the saved searchable PDF. Regional provenance replaces the older NASA example. Menu instructions, counts, captions, image wrapper labels, social image and article image metadata match this run.

The [browser receipt](browser-verification.json) confirms English → Deutsch → English through the visible selector, all four images loaded, and two actual PDF downloads with matching SHA-256 hashes. [Browser screenshot](browser-german.png).

Nineteen media/page unit checks pass. The page-specific verifier passes. International validation passes for 240 marketing pages across eight languages. Existing English and unfinished Spanish retain their original examples. Toolkit inputs were unchanged in this increment.

## Reproduction

From this isolated website checkout, with an unlocked Mac and the frozen app build:

```sh
python3 scripts/localization/prepare-ocr-de.py
POLYPDF_APP_ROOT=/absolute/path/to/polypdf node scripts/localization/capture-ocr-de.mjs
python3 scripts/localization/verify-ocr-de.py
POLYPDF_APP_ROOT=/absolute/path/to/polypdf node scripts/localization/register-ocr-de.cjs
```

The Python steps require pypdf, Pillow and Poppler. Complete the two native Save dialogs using the printed paths. Preserve previous outputs before rerunning; the capture refuses to overwrite them. Copy the new public assets into the local build, run `node scripts/international/build.cjs`, then `node scripts/localization/verify-ocr-page.cjs` and `node scripts/international/verify.cjs`.

Windows, native iPad, a complete linguistic review, other walkthroughs and the remaining languages are still open. The OCR interface language does not force an OCR recognition language; this run exercises the local Mac's actual capabilities.
