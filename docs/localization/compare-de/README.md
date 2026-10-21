# German drawing-comparison walkthrough

`/de/blog/compare-pdf-drawing-revisions/` now uses actual German PolyPDF screenshots and the matching fictional Bürgerhaus am Lindenpark revision pair. Revision A, Revision B and the saved comparison are downloadable. Both source PDFs use German A1 sheets, metric dimensions, decimal commas and `/Lang de-DE`. The metadata-only preparation preserves the source drawing geometry, text and rendered pixels.

The real Mac comparison creates nine editable clouds on A101 and three on A201. Native Save followed by a fresh app launch retains all twelve cloud IDs, German subjects/authors and geometry, along with both existing sheet links. The Markup Table contains 14 items. The hero shows the reopened result; supporting captures retain the configured dialog and each sheet. All four app frames and both rendered saved pages were inspected.

The example has three planned changes—1.50 m partition movement, 0.75 m door movement and 1.50 m added south glazing—but updated room areas, notes and issue fields create further visual differences. The guide reports the observed twelve regions without equating them to design decisions. Room areas change from 36/36 to 45/27 m²; the gross footprint stays 360 m². Both revisions are fictional and carry demonstration-only markings.

## Implementation and evidence

- `scripts/localization/compare-de.json`: six source-bound verification/filename replacements, 99 German copy overrides, two source-download rows and three verified links. All overrides must be consumed, and changed source text or PDF bytes fail the build.
- `scripts/localization/pages.cjs`: image download cards replace only an explicit plain label, preserving the preview. Missing, ambiguous or interactive label targets are rejected. A regression test covers this behavior.
- `public/localized-media/de/guides/compare/`: four actual captures, app verification and rendered-page verification. The hero, accessible labels, social image and Article metadata agree.
- `public/localized-media/de/samples/compare/`: the two exact source PDFs, saved result, four source previews, source-preservation receipt and independent public-PDF verification. Saved base page content streams and text are unchanged; public editable cloud objects and internal links are checked independently of app metadata.
- [Browser preview](browser-preview.png), [sample cards](browser-samples.png) and [browser receipt](browser-language-check.json): actual English → Deutsch → English → Deutsch menu navigation swaps the hero. Both preview cards remain intact. All three browser-downloaded PDFs match their retained assets byte-for-byte.

The app development build is version 1.6.17 build 84, source `ca1daa0aa083c8e5468887ecaf12827e4fc1b54b72270cd5db7fc6c26728af1f`. Capture uses normal app menu/dialog handlers and native file pickers. The read-only annotation observer injects no document content. Capture evidence is also retained in the app branch's `docs/audits/global-localization-2026-10-20/compare-guide/` audit.

## Validation

All 26 selected page/media/international unit tests pass, including the new preview-preservation case. The international build produces all 240 existing translated pages. The comparison verifier and the three previously completed German guide verifiers pass. English and unfinished Spanish retain their original media. This validates the international transformation of the existing English prerender, not a full React rebuild.

Run from the site root:

```sh
python scripts/localization/prepare-compare-de.py
POLYPDF_APP_ROOT=/absolute/path/to/polypdf node scripts/localization/capture-compare-de.mjs
POLYPDF_APP_ROOT=/absolute/path/to/polypdf node scripts/localization/register-compare-de.cjs
python scripts/localization/verify-compare-pdfs.py
node --test test/regional-calibration-page.test.cjs test/localized-walkthrough-media.test.cjs test/international.test.cjs
# Copy public assets into the existing local build, or use the normal site build.
node scripts/international/build.cjs
node scripts/localization/verify-compare-page.cjs
node scripts/international/verify.cjs
```

Use the environment's PDF-enabled Python and a frozen desktop build. Native Open/Save actions require the computer-use surface. The capture refuses to overwrite an existing saved comparison; retain earlier evidence before repeating it. Re-register and rebuild after any profile change.

Initial browser file retrieval timed out under disk pressure; the documented browser APIs succeeded after verified regenerable app outputs were removed. Both source cards were clicked for actual downloads. The saved result was retrieved through the browser's file-link download API. Source changes, retained PDFs, screenshots and test records were preserved.

The German pack remains a pilot with 76 mappings and four completed routes. Other walkthroughs, videos, languages, Teams and native-host localization remain incomplete. This comparison capture qualifies local Mac development behavior only; it does not qualify Windows, native iPad, other PDF viewers or a released installer. No deployment, push, PR, email or release occurred.
