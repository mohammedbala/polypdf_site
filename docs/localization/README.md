# Regional walkthrough media

This branch implements the media-routing and verification foundation for the German-first product localization plan. It does not yet replace the website’s English screenshots, videos or construction sample library. German is a pilot pack with no activated workflow mappings.

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

- `npm run test:localized-media`: 5 media coverage/provenance cases passed.
- `node --test test/international.test.cjs test/international-consent.test.cjs`: 11 existing localization/consent cases passed after building.
- `npm run build`: passed, including 240 guide translations and 836 translated toolkit pages.
- German pilot enforcement: expected missing-asset failure, confirming no silent English fallback when enabled.

## Content still required

Build region profiles for the 12 construction-library PDFs/24 sheets and every additional takeoff, evaluation, form, conversion and scanned example. Localize title blocks, dimensions, material terminology, units, dates and demonstration values; recompute reference quantities and packages. Capture each workflow in the corresponding app locale using its regional PDF. Regenerate responsive images, posters, video variants, captions and narration, then update guide instructions to the same dimensions and results.

Teams uses a separately served walkthrough from the app repository. Its assets are inventoried separately and need the same locale/region/provenance rules in that serving path. Existing English-only Teams and samples routes must be brought into the localized page policy before the rollout can be considered complete.
