# Website alignment with PolyPDF 1.5.5

Updated September 13, 2026 against verified public macOS and Windows 1.5.5 build 27. Website baseline: `59d1c899d686702153309186f61d537289b58550`. Application release source: `d7e9cd51bce42308ef39d0f9c557a1d47720e0a9`.

The homepage release spotlight and FAQ now describe customizable wheel/drag zoom and snapshot fixes. Current version metadata, Windows copy, support instructions, release history summaries, blog index and discovery files identify 1.5.5. The new `/blog/polypdf-1-5-5/` article explains per-layout preferences in Settings > View and the footer context menu, anchored drag zoom, page-edge scrolling, Shift panning, snapshot proportions and saved orientation. Existing commercial terms and prices are preserved.

Historical release articles and screenshots retain their actual versions. The new release article reuses a byte-identical, approved 1.4.0 screenshot as clearly labeled historical context; it does not pretend to show the new controls. Its public image is included in the existing evidence record. No direct customer-file or Mac Preview snapshot testing claim is made.

All eight language catalogs contain the new release article and current release identity. Twenty-four new source strings per language were translated locally with AI assistance, with version-only adaptations of existing sentences and explicit translation provenance. This is not certified native-speaker review. Unused automatic version adaptations were removed.

Validation:

- Existing focused content tests: four suites, 16 tests passed.
- English production build: 39 prerendered routes, metadata and JSON-LD checks passed.
- Screenshot evidence: 64 PNGs, 45 evidence records, zero violations.
- International build and verification: 240 pages across eight languages, with complete content, links, schema, language alternatives, RTL and sitemap checks.
- Built-content audit confirms current 1.5.5 identity and preserves historical image labels.
- In-app browser review: homepage release spotlight and linked full release article; Arabic article visually checked with right-to-left text.

Publication follows the established static deployment lane: exact source commit, full SHA-256 file manifest, staged upload using the previous release as a hardlink source, then an atomic current-symlink switch. The previous website is retained for rollback. Public smoke checks and compact publication receipts are recorded in the companion evidence directory. App downloads, update feeds, licensing services, credentials and server configuration are unchanged by this website deployment.

## Published result

Published at 2026-09-14 01:29 UTC (September 13 in New York) from website source `e73d23543a7c31228c842eb3db618befdd51c550`, pushed to master. All 401 staged files matched the SHA-256 manifest before the atomic switch. The previous `584a99c75fcd00f6ace90fc9b613c0778b4d6b55` website remains intact for rollback.

Production smoke passed 74 checks, including page metadata, image hashes, live app feeds/downloads and the existing self-expiring unpaid checkout probe. International production smoke passed all 240 pages and 16 localized discovery files. The published release article was also read back in the in-app browser. Compact evidence is in `docs/audits/evidence/release-1.5.5/`; the complete manifest and transfer logs remain in `.tmp/release-1.5.5/`.
