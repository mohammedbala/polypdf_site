# German symbol-count walkthrough

`/de/blog/count-pdf-symbols/` uses real German PolyPDF captures and the matching German A2, 1:50 Q-101 drawing. The main download and source links open that exact PDF. Its 16 supply-air symbols and one legend copy produce 17 search candidates; excluding the legend commits one 16-marker series and a worksheet row with quantity 16 and total 16. All candidate and committed-marker positions were compared with independently read painted PDF geometry.

The two walkthrough images, their accessible descriptions, captions, formula, social image and Article metadata agree. The additional E101/E501 construction exercise uses its own German PDF and reference quantities: 24 lights, 12 sockets, eight switches and a schematic 34.50 m route. Those references are explicitly separate from the Q-101 app result. The obsolete US drawing names, five/twelve-count screenshots and historical verification claims are removed from this German route.

## Evidence

- `public/localized-media/de/guides/count/`: three individually inspected app captures, sanitized app verification and page verification. The published hero shows the reviewed 16-of-17 state; the second image shows the committed series and worksheet. The third capture preserves the initial 17-of-17 state as supporting evidence.
- `public/localized-media/de/samples/count/`: exact copy of the app's German quick-start PDF and independently extracted symbol geometry. PDF SHA-256: `52cc449e5cd935ef6db14aec817243bcc10175fa9831ef56ad919f74fef38332`.
- [Browser selection receipt](browser-language-check.json), [guide preview](browser-preview.png) and [result preview](browser-result.png): actual English→Deutsch→English→Deutsch menu navigation switches images and the Q-101 link. Both app images loaded at their expected dimensions. The browser download's hash matches the source. The default narrow viewport retains the existing horizontally pannable images.
- 27 website unit checks pass, including a new source-bound bibliographic download-row case. Count, area, calibration and regional takeoff page checks pass, as does the 240-page international verifier. This rebuild transforms the existing English prerender; it is not a fresh React build.

The app capture uses local Mac development version 1.6.17 build 84, source `827e65135c10b27a3b2bceb0e2d5d1855e2bf2f2b3d106da9f9c4ead7f1d5d39`, bundle set `276b2770e340a90205344f4bf72375962e3e70b9caa448c3f3ee1c91ca1d3485`. Capturing this guide exposed and fixed a document/pane identity mismatch that hid all candidate highlights, plus an untranslated Count-label toggle. The app audit is `docs/audits/global-localization-2026-10-20/count-guide/` in the app checkout.

## Reproduction

Use Python with pdfplumber and pypdf. Set the app root to the isolated, built `polypdf` workspace, with source frozen before capture:

```sh
POLYPDF_APP_ROOT=/absolute/path/to/app/polypdf python3 scripts/localization/prepare-count-de.py
POLYPDF_APP_ROOT=/absolute/path/to/app/polypdf node scripts/localization/capture-count-de.mjs
POLYPDF_APP_ROOT=/absolute/path/to/app/polypdf node scripts/localization/register-count-de.cjs
```

Inspect every actual capture before registration. The runner owns a disposable profile, signs an ephemeral local Pro activation response through the normal license UI, opens the German PDF, uses pointer gestures and ordinary controls, and quits both app phases normally. Annotation access is a read-only observer. Plugins are disabled and a disposable mock keychain is used; no customer license is used.

Copy the new `public/localized-media/de/{guides,samples}/count` directories into the same paths under `build`, then run:

```sh
node scripts/international/build.cjs
node --test test/international.test.cjs test/localized-walkthrough-media.test.cjs test/regional-takeoff-exports.test.cjs test/regional-calibration-page.test.cjs
node scripts/localization/verify-count-page.cjs
node scripts/localization/verify-area-page.cjs
node scripts/localization/verify-calibration-page.cjs
node scripts/localization/verify-regional-takeoff-pages.cjs
node scripts/international/verify.cjs
```

`pages.cjs` now supports hashed PDF/JSON/CSV downloads in reserved, exact-source bibliographic list rows, with locale-restricted paths and text-only DOM insertion. Stale source, wrong locale, unreserved rows, changed bytes and attempted HTML content are covered by the regression test.

The German pack remains a pilot: 74 asset mappings and three completed routes. Other walkthroughs, videos and language packs remain incomplete. This capture does not qualify Save/reopen, exports, Windows or native iPad. No deployment, push, PR, email or release occurred.
