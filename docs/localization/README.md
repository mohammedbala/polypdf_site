# Regional walkthrough media

This branch implements media routing and Germany’s regional construction library for the German-first product localization plan. The German pilot has 41 verified asset mappings: 12 PDFs, 24 previews, a contact sheet, ZIP, guide and reference metadata. The full pack remains inactive while the screenshot/video workflows and additional sample families are unfinished. Nothing has been published.

The app repository’s detailed scope, evidence and remaining implementation plan is at `docs/audits/global-localization-2026-10-20/README.md`.

## Registry and inventory

`src/localization/product-locales.json` is an explicit, hashed import of the app’s canonical locale registry. Import with:

```sh
node scripts/localization/sync-locales.cjs --app-root /path/to/app-repository/polypdf
```

The agreed app rollout includes English, German and 19 additional locale variants. Hebrew is excluded from the new rollout; pre-existing toolkit support is unchanged.

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

The main website build currently succeeds with the existing published localization behavior. It is not evidence that German media conversion is complete.

## Verification

- `npm run test:localized-media`: media coverage/provenance, regional image dimensions and actual German artifact checks.
- `node --test test/international.test.cjs test/international-consent.test.cjs`: 11 existing localization/consent cases passed after building.
- `npm run build`: passed, including 240 guide translations and 836 translated toolkit pages.
- German pilot enforcement: expected missing-asset failure, confirming no silent English fallback when enabled.

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

## Content still required

Regionalize every additional takeoff, evaluation, form and conversion sample, then build the other locale profiles. Capture each workflow in the corresponding app locale using its regional PDF. Regenerate responsive images, posters, video variants, captions and narration, then update guide instructions to the same dimensions and results. Existing US walkthrough counts and sheet names must be rewritten before the German pack is activated.

Teams uses a separately served walkthrough from the app repository. Its assets are inventoried separately and need the same locale/region/provenance rules in that serving path. Existing English-only Teams and samples routes must be brought into the localized page policy before the rollout can be considered complete.
