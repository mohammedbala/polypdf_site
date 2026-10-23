# OpenSEO audit implementation — October 15, 2026

Status: published with user approval. Google Analytics was created with separately approved terms, connected to OpenSEO, and verified receiving a live validation visit. Final deployed source: `09b8913318d2c2a54778e65747a50fc387737c6c`.

Source audit: [SEO Audit — Oct 7, 2026](https://app.openseo.so/p/9534cbef-1f99-45e8-afaa-d1393e629d0b/reports/278ec473-f23e-41a9-96b9-92046c7096fc). Goal: qualified downloads and Pro purchases by construction professionals using Mac and Windows.

The website checkout is separate from the desktop app. This branch starts at `5ec15f58ae484f7f52c7b3752bcf8ca0db4a8614`, the release-1.6.7 website source. The older `master` branch and unrelated dirty primary checkouts were not used as the implementation base. Live post-publication checks found that the desktop feeds had advanced to 1.6.13/build 74 while the prior website still advertised1.6.7/build 39. The final site release metadata and eight language catalogs now match the two public feeds and their release notes. Historical 1.6.7 prose and the sample’s actual 1.6.6 test identity remain separate.

## Recommendation coverage

| Audit action | Implementation and evidence | Status |
| --- | --- | --- |
| Create one accurate Bluebeam-on-Mac comparison | `/bluebeam-alternative-for-mac/` covers local takeoff, CSV/PDF exports, markup, personal licensing, company collaboration, and Bluebeam’s current browser, supported iOS-on-Mac, and Windows VM routes. It explicitly states that PolyPDF does not join Studio. Official Bluebeam sources were reread October 15. | Published |
| Link from Mac measurement and PDF takeoff | Both English landing pages link to the comparison. Their eight localized siblings carry translated link labels and an English handoff. All 18 inbound links were verified in generated HTML. | Published |
| Reuse real media and current terms | Uses the existing Northline takeoff media and shared DownloadCTA, Free/Pro limits, pricing, and personal 1.x license terms. No invented product imagery or unsupported parity promise. | Published |
| Show a tested saved-PDF handoff and limits | Added the original sample and a real saved review PDF. PolyPDF 1.6.6 build 38 saved and reopened a rectangle and text note. pypdf inspected both annotations; PDFium independently rendered their appearances. The page states the test version, date, and limited scope. | Published |
| Provide a free Mac download and appropriate measurement | Uses existing consent-aware `download_click`, landing CTA events, source-tagged checkout actions, and the existing webhook-verified purchase path. Added consent-aware source/sample download events. No live checkout or real payment was created for testing. | Published; GA4 configured and receiving events |
| Verify branded visibility and homepage indexing | Search Console is now connected. Four inspected pages were submitted and indexed, with successful crawls and matching declared/Google canonicals. First-party branded data is recorded below. | Verified; no language/canonical repair indicated |
| Correct inconsistent release summaries | Home, blog, Windows, and Versions descriptions use evergreen product copy. The 1.5.5 article has its own build-27 quick answer instead of the current-release answer. Eight translation catalogs were updated; localized release hubs point to current version history instead of pairing current headings with old feature prose. | Published |
| Shorten ten Spanish descriptions | The ten audited descriptions are now at most 160 characters. Twelve modified Spanish descriptions were checked, including the blog and Windows evergreen descriptions; lengths range from 107–143 characters. | Published |
| Preserve useful guides, demos, and purchase clarity | Existing calibration, takeoff, symbol-counting, revision, Teams, pricing, and download components are reused. The report’s deferred broad comparisons and unvalidated content ideas were not promoted into new projects. | Preserved |

## Search Console evidence

Retrieved October 15, 2026 for `sc-domain:polypdf.com`. The performance request covers September 15–October 13 and returns the first 50 query/page rows across all countries, with additional rows available. These are sampled rows, not sitewide totals or US-only figures.

| Query and page | Clicks | Impressions | Average position |
| --- | ---: | ---: | ---: |
| `polypdf` → English homepage | 81 | 238 | 1.2 |
| `poly pdf` → English homepage | 33 | 146 | 3.2 |

URL inspection confirmed the homepage, `/measure-pdf-on-mac/`, `/pdf-takeoff-software/`, and `/zh-cn/revision-packages/` are submitted and indexed. Their Google-selected canonicals match the declared canonicals. This establishes the checked pages’ indexing state; it does not attribute a traffic trend or forecast the new page’s performance.

GA4 now uses the owned PolyPDF account (`412279203`), property `559292415`, web stream `16139315609`, and measurement ID `G-GB6LW050TM`. The earlier site ID `G-533RWNRCFP` was replaced in the existing consent-aware tracker. New York reporting time and USD were selected. Optional account data sharing was verified off after creation.

`purchase` remains a once-per-event key event. `download_click` is counted once per session and has no default monetary value. Registered event dimensions are CTA source (`source`), Page variant (`page_variant`), and Download platform (`platform`). Enhanced measurement is deliberately off so automatic query-string, search, outbound-link, and form collection cannot bypass the existing sanitized manual events. OpenSEO’s two diagnostic labels for enhanced/site-search measurement being disabled are expected in this configuration.

The consent check found no Google script before permission, loaded only the owned Google Analytics tag after analytics-only consent, and removed it after rejecting optional cookies. Analytics realtime then showed one validation visitor, one comparison-page view, and the existing demo-watch event. No test download or purchase was created. OpenSEO’s Admin API readback confirmed the stream, both key events, dimensions, and disabled enhanced measurement. The Data API successfully read the previous complete day with no historical rows. [Admin API settings receipt](seo-analytics-health-2026-10-15.json) records the final configuration. New data starts at setup; no uplift has yet been measured.

The English React site and new comparison use the existing consent controls. The 240 localized static pages intentionally remain free of tracking scripts. This is a reporting coverage limit, not missing Search Console access. The original October 7 audit remains historical.

## Validation

- Jest: 28 suites, 139 tests passed.
- Post-deployment/media fixture tests: 13 passed. These are local fixture tests, not a production deployment receipt.
- International fixture tests: 6 passed.
- Atomic static deployment fixture tests: 10 passed.
- Production build passed: 43 English routes plus static 404; all prerendered markup and JSON-LD verified.
- International build passed: 240 complete pages across eight languages, including content, asset, link, schema, canonical, hreflang, RTL, and sitemap checks.
- Screenshot evidence gate: 64 PNGs and 45 evidence records, no violations.
- Targeted generated-HTML check: 28 published evergreen descriptions, 18 comparison inbound links, 9 historical 1.5.5 quick answers, comparison canonical/indexability, download/purchase URLs, demo fallback, sitemap, and `llms.txt` passed. Localized Versions pages are intentionally not published; the English Versions page is the shared route.
- Browser: inspected desktop 1280px and mobile 390px. Mobile document width is 390px; only the comparison table scrolls horizontally within its 350px region. FAQ expansion was verified. The temporary viewport override was reset.
- Saved PDF served as `application/pdf`; 40,107 bytes and expected SHA-256 matched over local HTTP. Original drawing bytes were unchanged.

Machine-readable receipts: [generated-site checks](seo-generated-validation-2026-10-15.json) and [real handoff sample](seo-handoff-sample-2026-10-15.json). New translations are AI-assisted editorial updates, without independent native-speaker review. Final production verification passed all 421 public file hashes,91 revenue/trust checks without checkout creation, and 240 localized pages plus 16 localized discovery files. The source receipts preserve the initial version-mismatch failure and the successful correction.

## Publication and measurement

The exact validated source was staged and activated with `scripts/deploy-static.py`. Final activation published `09b8913318d2c2a54778e65747a50fc387737c6c` and verified 421 public resources. The prior release remains available for rollback. Public revenue/trust smoke passed 91 checks, including both app feeds and download availability; checkout session creation was skipped. All240 localized pages and 16 localized discovery files passed.

The initial publication `e087d3a` also passed 421 file hashes, but its subsequent release/feed smoke exposed the stale website 1.6.7 label. The follow-up preserves all SEO work, aligns the current release to public 1.6.13/build 74, and deploys the owned Analytics property. No installer, appcast, update feed, or license API was changed.

[Publication and Analytics receipt](seo-publication-2026-10-15.json) records the frozen source, rollback predecessor, live verification, and final Analytics settings. Track future complete-day Search Console query/page clicks alongside organic landing-page downloads and verified purchases. Historical Analytics traffic cannot be recovered from this new property. No forecast or measured traffic/conversion improvement is claimed.
