# Website alignment with PolyPDF 1.5.6

Prepared September 22, 2026 from the freshly verified live website commit `e6f6b29d886b726650cce94c46f64bf5cf4058eb`. This candidate is not published. Activation is held until both desktop update feeds have been verified for 1.5.6 build 28.

Current release metadata, the homepage FAQ, Windows and support copy, guide index, release history summaries, discovery files, and localized homepages now describe the PDF overlay clarity fix. The copy states that PDF overlays redraw from their source PDF when zooming and that crops retain alignment on rotated pages after saving and reopening. It makes no claim to recover detail absent from a raster source.

Historical release articles and summaries retain their original versions and wording. The 1.5.5 fallback history entries remain available. Screenshot metadata stays at 1.4.3 build 20, and the featured capture stays at 1.5.1 build 23. Existing screenshots, workflow media, sample PDFs, prices, and licensing terms are unchanged.

The eight language catalogs add 16 currently used strings each. Version-only changes reuse existing translations; new overlay copy was translated with AI assistance. This is not independent native-speaker review. All prior translation entries are retained unchanged.

Validation completed locally:

- Production English build: 39 routes plus the static 404 page, with prerendered content and JSON-LD verification.
- International build: 240 pages across eight languages, with content parity, links, assets, schema, canonical URLs, language alternatives, RTL, and sitemap verification.
- Local HTTP international smoke: all 240 pages and 16 localized discovery files.
- Existing tests: 81 unit tests in 22 suites, 13 post-deploy/workflow fixture tests, 10 static deployment tests, six international tests, and 12 screenshot evidence tests.
- Screenshot verification: 64 PNGs and 45 evidence records, with zero violations.

The production API, checkout, live-feed, and public post-deployment smoke checks remain for the publication step. Local validation logs are in `.tmp/release-1.5.6/`. No website staging, activation, upload, or source push was performed while preparing this candidate.
