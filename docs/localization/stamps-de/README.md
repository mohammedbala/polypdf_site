# German interactive review stamps — 21 October 2026

The completed local route `/de/blog/create-interactive-pdf-stamps/` uses four actual German Mac captures, a matching German A2 drawing and the PDF saved through the native Save As dialog. Five asset mappings include the social image. The German pack remains a pilot: **89 verified mappings and eight completed walkthrough routes**, with other routes, languages and platforms still outstanding. Nothing was deployed.

The example creates **Planprüfung - Übung**, a 300 × 140 pt template with three text fields: fixed `GEPRÜFT - ÜBUNG`, a required reviewer with an empty default, and the current date. Actual controls reject the missing reviewer, then place `Musterprüfung` and `21.10.2026`. The stamp sits below the plan, right of the calibration line and left of the title block. The underlying German drawing is unchanged.

A full process restart retains the stamp's exact definition, field identities and values; saved coordinates agree within 0.001 PDF point. The saved template also survives restart. Selecting it from the actual Stamp menu asks for a fresh reviewer, without retaining the previous name. That second prompt is canceled, leaving one stamp in the delivered PDF. Test Pro activation uses the ordinary activation UI against an ephemeral signed loopback fixture in an isolated profile.

Independent pypdf checks confirm one `/Stamp`, unchanged page content and A2 geometry, `/Lang de-DE`, the exact private values and a nonempty 1200 × 560 appearance image. Source and saved PDFs were rendered with Poppler and visually inspected. The stamp is raster artwork with PolyPDF metadata; it is neither selectable page text nor a certificate signature. In this captured build, reopened native artwork offers movement, scaling and rotation, but does not offer editing its field values through the template editor. The guide explicitly tells readers to reuse the saved template for new entries.

The app's builder CSS now gives the field picker and value-source controls a full row and lets their actions wrap. The captured German labels fit without truncation. Candidate: PolyPDF 1.6.17 Build 84; source `93ac0661025743f3fcb30ce24771749a3cbcbee84d970e7efc97128e61f58c72`, bundle set `647b69e5f84b95af6350b67bc71f71a4b6eb15d699444698306b24b0c72a887c`.

## Evidence

- `public/localized-media/de/guides/stamps/verification.json`: native control, required-field, layout, Save/reopen and template-reuse receipt, bound to capture script, app build, screenshots and regional copy.
- `public/localized-media/de/samples/stamps/export-verification.json`: independent PDF inspection and exact source, output and retained toolset hashes.
- `public/localized-media/de/guides/stamps/page-verification.json`: four images, social/schema images, 69 text bindings, four evidence replacements, two PDF links and unchanged English/unfinished Spanish behavior.
- `browser-verification.json` and `browser-hero.png`: actual in-app browser English → Deutsch → English → Deutsch switching, all four images loaded, and both downloads matching their expected hashes.
- `source-preview.png` and `saved-preview.png`: independently rendered PDFs, inspected for readable glyphs and placement.

The existing English build and its unchanged toolkit outputs were reused. The international build regenerated all 240 editorial pages. International verification passed content parity, links, media, schema, canonical URLs, hreflang, RTL and sitemap. All 14 media/export tests and 11 international/consent tests passed. App verification passed 77 interactive-stamp tests, the desktop build and shared iPad payload build. A shared payload build is not native iPad qualification.

## Reproduction

```sh
# Preserve any previous .tmp/localization/stamps-de output before capturing again.
POLYPDF_APP_ROOT=/absolute/app/worktree/polypdf node scripts/localization/capture-stamps-de.mjs
# Complete the native Save As dialog when the harness announces it.
python3 scripts/localization/verify-stamps-de.py
# Python needs pypdf; render and inspect both PDFs with Poppler.
node scripts/localization/prepare-stamps-de.cjs
POLYPDF_APP_ROOT=/absolute/app/worktree/polypdf node scripts/localization/register-stamps-de.cjs
# Copy public assets with the normal English build, or refresh only these new
# asset directories when reusing an otherwise unchanged English build.
node scripts/international/build.cjs
node scripts/localization/verify-stamps-page.cjs
npm run test:localized-media
node --test test/international.test.cjs test/international-consent.test.cjs
npm run verify:international
```

The verifier's date is intentionally tied to this captured example; recapturing on another date requires updating the example and its source-bound copy together. The raw toolset file is retained as evidence; import into a different profile is not claimed. Native Windows/iPad, native-speaker review, full multilingual walkthrough coverage and production publication remain pending.

User-authorized cleanup removed about 63 MB of logical cache data (temporary npm packages, Fontconfig cache and the website's Babel cache), leaving approximately 1.3 GB available at that checkpoint. `cache-cleanup.json` records the exact paths and sizes; no source or personal documents were removed.
