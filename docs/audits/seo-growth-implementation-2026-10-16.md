# Website growth revamp — October 16, 2026

SEO revamp published October 16, 2026 from `60653d1ac37f2195e31ad538d4dde8fc42a73ca4`; all 447 public resource hashes matched. This record also covers the AEO follow-up. Website changes only; installers, app versions, and update feeds are unchanged.

## Changes

- Shared Product, Solutions, and Resources navigation connects the homepage, workflow pages, articles, and footer.
- Eight new English routes: PDF measuring, electrical takeoff, flooring takeoff, general Bluebeam comparison, samples, tools, flooring waste calculator, and quantity-takeoff guide. Existing Mac comparison and measuring routes retain their distinct scope.
- Original practice drawings and reference worksheets, plus version-labeled Mac app exports. See `public/samples/takeoff/README.md` and `desktop-evidence.json` for quantities, methods, hashes, and limitations.
- A multiroom flooring calculator with unit conversion, explicit assumptions, whole-pack rounding, material cost, CSV, print, and accessible validation. User quantities remain in the browser.
- Prerendered metadata, structured data, sitemap, RSS, and discovery links. New routes are intentionally English-only. Existing localized coverage remains 240 pages across eight languages.
- A small content-hashed enhancement gives static localized pages working consent settings and controlled download events without English application hydration. Optional tracking respects consent, GPC/DNT, expiry, category choices, and withdrawal.

## Validation

- 157 Jest tests across 29 suites.
- Ten international and consent integration tests; ten deployment fixture tests; two crawler-policy tests. The earlier three workflow-evidence tests also passed.
- Production build validates 52 English routes plus 404, structured data, and 240 localized pages.
- Nine-route audit checks internal links, canonicals, one H1, duplicate IDs, English-only scope, and axe rules in JSDOM. Contrast is excluded; this is not a WCAG conformance claim.
- Local HTTP smoke covers 240 localized pages and 16 discovery files.
- Browser checks at 390 px: no overflow and one H1 on the homepage and eight new routes; calculator output, conversion, errors, CSV download, navigation keyboard behavior, Spanish consent and Arabic RTL.
- Real Mac tests in installed PolyPDF 1.6.6 build 38: flooring 228 + 180 = 408 sq ft; electrical route 30 + 12 = 42 ft. CSV/PDF exports succeeded, saved PDFs reopened with matching values, and output geometry was independently checked. Screenshots are under `seo-growth-preview/`.

## Evidence limits and publication

The complete electrical fixture count requires Pro activation: Free mode stopped after three hand-created measurements. The Windows QA session is disconnected and reconnecting requires credentials. Current-version electrical/flooring recordings and Windows export parity remain pending. Do not describe the older Mac evidence as current-version or cross-platform certification.

Website publication was authorized with the disclosed sample evidence scope. The deployment verifies every public resource hash and retains the previous immutable release for rollback. Follow-up smoke checks cover routes, canonical URLs, samples, consent, commercial offers, discovery files, and installer/feed continuity; checkout-session creation is excluded.

Research, keyword estimates, commercial strategy and unsent outreach drafts are maintained in the private OpenSEO report, outside this public repository. No ranking or conversion improvement is claimed before measurement.

## AEO follow-up

- Eight workflow pages now provide a concise visible answer, a stable answer anchor, and a relevant next-step link. Direct fragment links are preserved after font loading.
- `/product-facts/` consolidates platforms, Free and Pro boundaries, license rights, local processing, network exceptions, exports, collaboration compatibility, and version-labeled verification evidence. It is linked from navigation, footer, sitemap, and the existing reference file.
- Structured data ties workflow and reference pages to the same software and publisher. Translated page identities use their translated URLs while product identities remain shared. No invented ratings, FAQ rich-result claims, or special AI-schema claims are added.
- Named search and AI crawler groups preserve public access and now repeat the wildcard API/admin exclusions. Robots rules are crawl guidance, not access control.
- The OpenSEO-issued IndexNow key is hosted at the public site root for changed-page notifications. A notification is not proof of indexing; Google does not use IndexNow.
- Local SSH upload spooling avoids the interrupted streaming-pipe transfers observed during publication, while preserving all remote inventory, predecessor, disk-space, hash, activation, and rollback gates.

AEO means making the site useful and understandable as a source for answer engines. No current AI visibility uplift or ranking improvement has been measured. Research and any paid tracking decisions remain in the private OpenSEO project.

## Migration checklist follow-up

- The general Bluebeam comparison now answers what to test before switching, with seven checks covering calibration, quantities, editable markups, exports, document controls and recipient acceptance. It retains the Studio limitation and Free measurement cap.
- A blank CSV worksheet is generated from the same source as the visible checklist. Every check starts as `Not tested`; evidence and reviewer fields are blank. It is a project worksheet, not a compatibility certification.
- The Mac comparison and sample library link to the stable checklist anchor. Comparison and sample descriptions now name the new resource. Downloads use the existing consent-gated sample event.
- Validation: full production build; 19 relevant tests across four suites; the nine-route SEO/accessibility audit; desktop 1280 px and mobile 390 px checks with no horizontal overflow; direct-anchor and keyboard navigation; actual browser download with exact-byte and seven-row content verification. The static accessibility audit excludes contrast.

This follow-up adds no routes or claims of current-version or Windows test coverage. Publication retains the immutable static-release inventory, hash, predecessor and rollback checks, followed by production smoke verification.
