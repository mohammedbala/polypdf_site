# German and French shared construction library copy — 21 October 2026

The shared library and all six exercises now bind their project names, paper format, scales, dimensions, quantities, sheet numbers, filenames, preview descriptions and downloads to the German or French construction pack. Each locale has 98 exact-source copy records and 24 preview descriptions. The rendered component preview contains 12 library cards, six exercises, 19 image occurrences and 21 regional PDF/ZIP/HTML links.

The German guides retain their verified contextual overrides. In particular, the review guide still downloads and describes X101 alone, while the shared library exercise uses X101/X102. Comparison and OCR retain their special captured fixture filenames. Source changes still fail validation. Contextual image descriptions remain tracked by the page translator; shared preview descriptions are reserved before ordinary translation.

Validation passed:

- Fresh React prerender of 91 routes and the static 404 using the existing compiled assets.
- Both shared-component checks, including exact copy, image dimensions/hashes, download filenames, 360 m² footprint, 5 m calibration, 34.5 m circuit and plan-only counts of 24 luminaires, 12 sockets and eight switches.
- 23 media/page unit tests, including guide-specific prose and filename precedence and stale-source rejection.
- All eight previously completed German route verifiers: calibration, area, count, comparison, review, OCR, forms and stamps.
- International transformation and SEO/AEO checks for 240 existing translated pages. This is existing content/link/schema coverage, not a claim of 240 fully regionalized walkthroughs.
- Complete German and French library registration reproduces the exact same media-manifest bytes, including preview descriptions.
- Built-in browser inspection at 1280 × 720, with no horizontal overflow in either library view. A visible French A101 download matched its source SHA-256.

The screenshots and machine-readable receipts are in this directory. No PDF was changed in this checkpoint. The Mac remained locked, so there is no new native Save/reopen evidence. Editorial copy awaits native-speaker review. `/samples` remains English-only because its older exports, forms and other demonstration families need separate regional replacements. Both packs remain `pilot`; Germany retains eight complete routes and France has none. Nothing was published. A complete production bundle rebuild was not performed.

Reproduce from the site worktree:

```sh
NODE_ENV=production node scripts/prerender.js
node scripts/localization/register-library-copy.cjs de
node scripts/localization/register-library-copy.cjs fr
node scripts/localization/verify-library-copy.cjs
node --test test/localized-walkthrough-media.test.cjs test/regional-calibration-page.test.cjs
node scripts/international/build.cjs
node scripts/international/verify.cjs
```

The verifier writes local-only previews to `build/local-library-de-preview.html` and `build/local-library-fr-preview.html`. Serve `build/` with a fallback to `public/` for the newly prepared French artifacts; these preview files are not public routes. Run the eight `scripts/localization/verify-*-page.cjs` guide validators after the international stage to refresh their receipts.
