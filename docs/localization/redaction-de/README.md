# German redaction and cleanup walkthrough — 21 October 2026

The local `/de/blog/redact-and-sanitize-pdf/` route now uses actual German app captures and matching regional PDFs. German remains a pilot with **97 asset mappings and nine completed routes**. No deployment or production release occurred.

## Native workflow

The Mac was unlocked and the four-phase workflow completed in the current local macOS development build, PolyPDF 1.6.17 Build 84, source digest `bdbd92b1f149e8217a3c09322bc202b50f03f23947f7deb9a3c3e3f92634fe84`. The app source was frozen for the whole run. The runner owned only process lifetime, a disposable profile and an ephemeral signed loopback license fixture. German language, metric paper units, activation, search, redaction gesture, confirmation and both Save As operations were performed through native Computer Use controls. Each saved PDF was reopened in a fresh app process. The runner closed its owned app processes and removed its profile.

- [Lifecycle](native/lifecycle.json) binds all four phases and outputs to the build and unchanged sources.
- [UI evidence](native/ui-verification.json) records the seven original captures and native observations. The raw screenshot API returned JPEG bytes despite the initial `.png` temporary filenames; public files use `.jpg` and preserve those bytes without resizing, painting or re-encoding.
- [Independent PDF verification](../../../public/localized-media/de/samples/redaction/export-verification.json) qualifies the exact native saved bytes, separately from the earlier direct-core preparation.

The redaction source is a fictional German A3 plan, Bürgerhaus Lindenhof, 24.00 m × 12.00 m, 288.00 m² at 1:100. It has one searchable `VORGANG-LINDE-742` identifier and a separate raster elevation. The tight pointer-drawn region immediately opens **Schwärzung anwenden**. After confirmation and native Save As, a fresh-process search finds no occurrence. Independent extraction and decoded-object checks also find no token; other page text and image pixels remain identical. The output has one EOF and no previous-revision link.

The cleanup source adds original metadata, harmless name-tree JavaScript (`void(0)`), a direct page attachment and a second raster placement inside a Form XObject. **Dokument bereinigen** removes original Info metadata and the JavaScript entry. The direct page attachment remains with identical payload bytes. The saved result adds new `/Producer` and `/ModDate` entries. All page text and both raster placements remain unchanged, and the source/output Poppler renders are byte-identical PNGs. Both native saved outputs were visually reviewed independently in [render](render/). Poppler emitted a fontconfig configuration warning but completed; the rendered German text is readable. These observations cover these fixtures, not arbitrary confidential PDFs.

The app chrome, confirmation, cleanup dialog and regional documents are German. The macOS Save controls follow the host OS and were English. This is a local Mac development run, not released-installer, Windows or native iPad qualification.

## Website integration

The route has 100 source-bound German copy replacements, four verification-detail replacements, four matching PDF downloads, and seven image slots using six distinct displayed captures. The seventh retained capture records the cleaned PDF after restart. The old staged-mark slot now shows the actual immediate confirmation, followed by applied and reopened states. Captions and accessible descriptions follow that sequence. The entire article’s instructional copy was rewritten to use **Schwärzen** and **Dokument bereinigen**, the actual German filenames and observed limits.

The visible hero, social image and Article schema share the same German capture. The international builder now also takes Open Graph dimensions from the verified regional asset, so the 3420 × 2146 capture is not described using the original English image dimensions.

Checks passed:

- [Page verifier](../../../public/localized-media/de/guides/redaction/page-verification.json): seven image slots, four PDF hashes, actual sequence, source-bound copy, social/schema dimensions and English/unfinished-Spanish isolation.
- [Browser verification](browser-verification.json): all seven slots load as 3420 × 2146 images; no page-level horizontal overflow at 1280 × 720; German → English → German selects the corresponding hero and restores the four German PDF links. [Hero](browser-hero.jpg) and [confirmation](browser-confirmation.jpg) were visually inspected.
- Fifteen media/page unit checks and eight international checks pass. The international build and verifier pass for all 240 pages in eight languages.
- All eight previous German route verifiers pass. Fresh receipts are retained under [regression](regression/); historical public receipts were preserved.

This checkpoint rebuilt the international pages from the existing English prerender and copied only the new regional assets. It did not rebuild the full CRA production bundle; English React source and bundles were unchanged. Native-speaker review, remaining German workflows/videos/sample families, other language packs, Teams, Windows and iPad qualification remain open.
