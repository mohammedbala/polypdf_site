# Brazilian construction library — 21 October 2026

The Brazilian Portuguese pilot now has twelve PDF sets and twenty-four A1 sheets for the fictional **Centro Comunitário dos Ipês**. All drawing prose, room names, equipment tags, filenames, dates, number formatting, guide text and reference-quantity labels use the Brazilian profile. The PDFs declare `pt-BR`; the scans derive from the Portuguese vector plans and have no preinstalled text layer. These are metric demonstration drawings, with no standards-compliance claim.

Forty-one verified asset mappings, 98 shared-library/exercise copy records and 24 preview descriptions are registered. The six exercises match the new files, printed 5 m calibration, quantities, revisions and Portuguese OCR targets. The pack remains a pilot with zero completed walkthrough routes. The full samples route still requires its other regional sample families; this checkpoint does not activate it or publish anything.

## Verification

- All 24 sheets pass independent PDF structure, text-bounds, bookmark/link, symbol-count and geometry checks: **274 physical references**. All sheets were inspected in the contact sheet, and twelve full-size previews were inspected for text expansion, notes, schedules, tags, details and scan legibility. The initial long concrete-floor level label failed the existing minimum font-size guard; `TOPO DO PISO` fits, and the final artifacts passed. The shared generator and verifier are unchanged.
- All twelve PDFs pass both ordinary and append-only PolyPDF writer/importer checks: **24 cases**. Calibration, metric quantities, Portuguese note content, page boxes, bookmarks, links, layers and PDF language persist. `native-roundtrip.json` is the existing receipt filename; its scope explicitly identifies core-operation checks, not native UI or platform qualification. The source build is `1.6.17+84` on app commit `9b24abc2`.
- **Sixteen source artifacts reproduce byte-for-byte** in a second output directory. All 135 existing German, French and Spanish pack files, both shared generator/verifier files and all three media records remain unchanged. See `regeneration.json` and `existing-packs-preserved.json`.
- The shared-component verifier now checks four regional libraries, each with 12 cards, six exercises, 19 images, 21 downloads and 98 exact copy records. **15 media tests, eight international-page tests, a fresh 91-route React prerender plus 404, and all 240 international page checks passed.** These stages use existing compiled site assets; no full production bundle build is claimed.
- Built-in browser checks passed at **1280 × 720** and **390 × 844**, without horizontal overflow. All 19 desktop images loaded. The header, settled electrical exercise and mobile header were visually inspected. The download link produced the registered ZIP, with matching SHA-256 and all **44 archive entries** matching their source bytes. The ZIP contains all twelve PDFs, guide, previews, quantities and verification records. These browser captures are local website QA, not app walkthrough assets.

The temporary preview tab/server were closed and the viewport override reset. Translations remain editorial drafts awaiting native-speaker review. No native recording, production publication, app code or release-version change occurred.

## Reproduction

Use the bundled Python runtime with ReportLab, pypdf, Pillow and Poppler on PATH:

```sh
python3 assets-source/samples/construction-library/regional_library.py --locale pt-BR
python3 assets-source/samples/construction-library/verify_regional_library.py public/localized-media/pt-br/samples/construction
```

From the app worktree, run `node polypdf/scripts/localization/verify-regional-library.mjs --directory <absolute-library-directory>`. Its receipt is written beneath `polypdf/.tmp/localization/evidence/pt-BR/regional-library/`; verify the manifest hash before copying it into the pack. Review the final rendered pages before writing the separate source-bound visual receipt. The existing `package_library` helper then packages the verified files.

Register with `node scripts/localization/register-regional-library.cjs --locale pt-br --app-build 1.6.17+84`. Run `node scripts/prerender.js`, then `node scripts/localization/verify-library-copy.cjs --audit docs/localization/brazilian-library-2026-10-21`. The generated `build/local-library-pt-br-preview.html` uses the actual shared React components. Serve the build locally with the corresponding `public/localized-media/pt-br` assets copied into it.

## Remaining

Brazilian native-speaker construction review, actual app walkthrough screenshots/videos, remaining sample families and Windows/native iPad journeys remain open. Italian, Dutch, Polish, Turkish and the later language groups still need regional libraries. The overall localization goal remains active.
