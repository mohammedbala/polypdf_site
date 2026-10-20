# German calibration walkthrough

The normal international build now renders `/de/blog/calibrate-pdf-drawing-scale/` with three actual German Electron screenshots, two regional drawing previews, German PDF/CSV downloads, metric instructions and matching accessible/social/schema image descriptions. The visible language selector was exercised German → English → German in the in-app browser. The complete German media pack is still a pilot; no site or app release was published.

## Actual app workflow

The owned Mac development instance used PolyPDF 1.6.17 Build 84. The interface language was persisted before opening the new document, so its generated numeric captions use German punctuation. The document's units were explicitly changed to metric/metres through the controls. UI pointer gestures snapped the 6.00 m reference, entered 6 in the calibration dialog, and drew the separate 3.60 m height check. The source PDF remained byte-identical. No measurement model was injected.

The dialog reports 340,158 PDF points, rounded for display; the calibrated panel reports 56,69292 points per metre. The independent measurement reads **3,60 m**. The guide distinguishes these observed values from the nominal 1:50 source geometry. The additional 4.50 m check, area tracing and Save/reopen sequence remain suggested exercises rather than claims of this capture run.

The walkthrough exposed an English Cancel default in the shared text-entry dialog. The app worktree now uses existing localized Cancel/OK and fallback field labels. The captured German button reads **Abbrechen**.

## Evidence and checks

- [Capture receipt](../../../public/localized-media/de/guides/calibration/verification.json): exact source PDF, script, app source/bundle and screenshot hashes; input distance, snapped geometry and independent measurement.
- [Page receipt](../../../public/localized-media/de/guides/calibration/page-verification.json): built HTML and source hashes; all five localized instructional images, downloads, captions, formulas and metadata.
- [Browser language selection](browser-language-selection.json) and [narrow browser preview](browser-preview.png). Large app images retain their keyboard-accessible horizontal pan region at narrow widths.
- 25 website unit checks; international build and verification of 240 pages across the existing eight website languages; six-page regional takeoff binding checks. These checks do not claim that all eight languages have localized screenshot packs.
- App: 86 localization, 38 dialog-semantics and 26 dialog-UX checks; TypeScript; desktop and shared iPad builds. Actual UI capture was Mac only.
- Explicit full German pack enforcement still rejects the missing `/og-image.png`; one completed route does not imply whole-pack readiness.

## Reproduce

Build the isolated app workspace first. From this website checkout:

```sh
POLYPDF_APP_ROOT=/path/to/app-worktree/polypdf node scripts/localization/capture-calibration-de.mjs
node scripts/localization/register-calibration-de.cjs
node --test test/localized-walkthrough-media.test.cjs test/regional-takeoff-exports.test.cjs test/regional-calibration-page.test.cjs test/international.test.cjs
```

The capture owns two sequential app processes: persist the language, then open/capture the exercise. Both quit normally. Review all three screenshots after a recapture before treating them as approved evidence. Registration verifies hashes and measured geometry; it cannot perform human visual review.

After the normal English prerender and public asset copy (or the full website build), run:

```sh
node scripts/international/build.cjs
node scripts/international/verify.cjs
node scripts/localization/verify-calibration-page.cjs
node scripts/localization/verify-regional-takeoff-pages.cjs
```

This increment changed the international transformation, not React sources. Verification used the existing English prerender and refreshed public assets. The full React/package pipeline was not rerun. Remaining work includes other German guides and videos, other locale media packs, additional regional sample families, native iPad/Windows qualification and editorial review.
