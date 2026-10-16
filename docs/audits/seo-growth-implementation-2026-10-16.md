# Website growth revamp — October 16, 2026

Unpublished implementation candidate based on `c7f8ce0cf343236ab378c89019abcb5dec68ddf5`. Website changes only; installers, app versions, and update feeds are unchanged.

## Changes

- Shared Product, Solutions, and Resources navigation connects the homepage, workflow pages, articles, and footer.
- Eight new English routes: PDF measuring, electrical takeoff, flooring takeoff, general Bluebeam comparison, samples, tools, flooring waste calculator, and quantity-takeoff guide. Existing Mac comparison and measuring routes retain their distinct scope.
- Original practice drawings and reference worksheets, plus version-labeled Mac app exports. See `public/samples/takeoff/README.md` and `desktop-evidence.json` for quantities, methods, hashes, and limitations.
- A multiroom flooring calculator with unit conversion, explicit assumptions, whole-pack rounding, material cost, CSV, print, and accessible validation. User quantities remain in the browser.
- Prerendered metadata, structured data, sitemap, RSS, and discovery links. New routes are intentionally English-only. Existing localized coverage remains 240 pages across eight languages.
- A small content-hashed enhancement gives static localized pages working consent settings and controlled download events without English application hydration. Optional tracking respects consent, GPC/DNT, expiry, category choices, and withdrawal.

## Validation

- 156 Jest tests across 29 suites.
- Nine international and consent integration tests; 13 deployment and workflow-evidence tests.
- Production build validates 51 English routes plus 404, structured data, and 240 localized pages.
- Eight-route audit checks internal links, canonicals, one H1, duplicate IDs, English-only scope, and axe rules in JSDOM. Contrast is excluded; this is not a WCAG conformance claim.
- Local HTTP smoke covers 240 localized pages and 16 discovery files.
- Browser checks at 390 px: no overflow and one H1 on the homepage and eight new routes; calculator output, conversion, errors, CSV download, navigation keyboard behavior, Spanish consent and Arabic RTL.
- Real Mac tests in installed PolyPDF 1.6.6 build 38: flooring 228 + 180 = 408 sq ft; electrical route 30 + 12 = 42 ft. CSV/PDF exports succeeded, saved PDFs reopened with matching values, and output geometry was independently checked. Screenshots are under `seo-growth-preview/`.

## Remaining release checks

The complete electrical fixture count requires Pro activation: Free mode stopped after three hand-created measurements. The Windows QA session is disconnected and reconnecting requires credentials. Current-version electrical/flooring recordings and Windows export parity remain pending. Do not describe the older Mac evidence as current-version or cross-platform certification.

The user requested one major release. Keep this candidate unpublished until the remaining evidence scope is resolved and an explicit production website release is requested. After publication, verify served artifacts, new routes, sample MIME types, cookies, commercial offers, discovery files, installer/feed continuity, and rollback readiness. No checkout session was created during these checks.

Research, keyword estimates, commercial strategy and unsent outreach drafts are maintained in the private OpenSEO report, outside this public repository. No ranking or conversion improvement is claimed before measurement.
