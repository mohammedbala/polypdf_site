# French construction library — 21 October 2026

The French pilot now contains twelve construction PDF sets, twenty-four ISO A1 sheets, twenty-four previews, a contact sheet, an HTML guide, a semicolon-delimited reference CSV and a verified ZIP. Forty-one source-to-regional asset mappings are registered. The pack remains `pilot` with zero complete public routes; this does not enable French walkthrough publication.

The fictional Maison de quartier des Tilleuls uses French room, discipline, equipment, drawing and review terminology; French equipment tags, dates, decimal commas and thousands separators; metric geometry and French PDF `/Lang` metadata. These are demonstrative drawings, not a construction-ready or standards-certified design. The source profile remains an editorial draft awaiting a French construction-domain reviewer.

## Verification

- All 24 sheets pass independent PDF structure, text bounds, bookmark/link, symbol-count and physical geometry checks, covering 274 physical references. Image-only scans retain the exact regional vector source identity.
- All 24 final sheets were inspected in the contact sheet. Full-size views were reviewed for text expansion, tags, schedules, revision notes and coordination details. Equipment prefixes were moved into the profile; French socket tags were placed above the symbols, and service routes paint behind equipment and masked tags.
- Twenty-four actual PolyPDF writer/importer checks pass: all twelve sources through both ordinary and append-only persistence. Calibration, authored French annotation text, page boxes, source notes, layers, links, bookmarks and PDF language survive. These are core persistence checks, **not native Mac/Windows/iPad UI journeys**.
- Fifteen website media checks, eight international-page checks and four independent geometry-verifier regression tests pass. Both German and French mappings resolve verified bytes while keeping incomplete packs inactive.
- The built-in browser displays the French guide with twelve articles, twelve PDF links, French reference values and no horizontal overflow at the observed desktop viewport. A PDF downloaded through its visible link is byte-identical to the source. See `browser-preview.json` and `guide-preview.png`.
- The final generator reproduces Germany's twelve PDFs, manifest, guide, CSV and checksums byte for byte. `german-regeneration.json` binds this comparison to the generator source. The sixteen French generated files also reproduce byte-identically; see `french-regeneration.json`.

## Locations

- Profile: `assets-source/samples/construction-library/regional/fr-FR.json`
- Downloads: `public/localized-media/fr/samples/construction/`
- Independent checks: `verification.json` in that directory
- Visual review: `visual-review.json` in that directory
- Core persistence: `native-roundtrip.json` in that directory; test output is retained here
- Archive: `PolyPDF-Plans-de-construction-fr-FR.zip`

The generic generator now accepts profile-specific tag prefixes, label placement/masking, PDF language and archive naming, while preserving the existing German output bytes. The app's existing persistence observer accepts regional verification text and checks that `/Lang` survives both writers. Production app code and release identity are unchanged in this checkpoint.

## Remaining

Capture French walkthroughs with the French interface and the matching French PDFs; regionalize the other sample families, related page instructions and videos; obtain native-speaker review; qualify actual Windows and iPad hosts. German redaction capture and native Save dialogs remain pending because Computer Use still reports the Mac locked. No public release or website publication occurred.
