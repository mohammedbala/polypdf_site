# OpenSEO audit implementation — October 15, 2026

Status: implemented and validated in an isolated website branch; production activation is pending. GA4 connection requires the owner to complete Google sign-in.

Source audit: [SEO Audit — Oct 7, 2026](https://app.openseo.so/p/9534cbef-1f99-45e8-afaa-d1393e629d0b/reports/278ec473-f23e-41a9-96b9-92046c7096fc). Goal: qualified downloads and Pro purchases by construction professionals using Mac and Windows.

The website checkout is separate from the desktop app. This branch starts at `5ec15f58ae484f7f52c7b3752bcf8ca0db4a8614`, the release-1.6.7 website source. The older `master` branch and unrelated dirty primary checkouts were not used as the implementation base. Public release metadata remains 1.6.7, build 39.

## Recommendation coverage

| Audit action | Implementation and evidence | Status |
| --- | --- | --- |
| Create one accurate Bluebeam-on-Mac comparison | `/bluebeam-alternative-for-mac/` covers local takeoff, CSV/PDF exports, markup, personal licensing, company collaboration, and Bluebeam’s current browser, supported iOS-on-Mac, and Windows VM routes. It explicitly states that PolyPDF does not join Studio. Official Bluebeam sources were reread October 15. | Ready for publication |
| Link from Mac measurement and PDF takeoff | Both English landing pages link to the comparison. Their eight localized siblings carry translated link labels and an English handoff. All 18 inbound links were verified in generated HTML. | Ready for publication |
| Reuse real media and current terms | Uses the existing Northline takeoff media and shared DownloadCTA, Free/Pro limits, pricing, and personal 1.x license terms. No invented product imagery or unsupported parity promise. | Ready for publication |
| Show a tested saved-PDF handoff and limits | Added the original sample and a real saved review PDF. PolyPDF 1.6.6 build 38 saved and reopened a rectangle and text note. pypdf inspected both annotations; PDFium independently rendered their appearances. The page states the test version, date, and limited scope. | Ready for publication |
| Provide a free Mac download and appropriate measurement | Uses existing consent-aware `download_click`, landing CTA events, source-tagged checkout actions, and the existing webhook-verified purchase path. Added consent-aware source/sample download events. No live checkout or real payment was created for testing. | Code ready; GA4 reporting access pending |
| Verify branded visibility and homepage indexing | Search Console is now connected. Four inspected pages were submitted and indexed, with successful crawls and matching declared/Google canonicals. First-party branded data is recorded below. | Verified; no language/canonical repair indicated |
| Correct inconsistent release summaries | Home, blog, Windows, and Versions descriptions use evergreen product copy. The 1.5.5 article has its own build-27 quick answer instead of the current-release answer. Eight translation catalogs were updated; localized release hubs point to current version history instead of pairing current headings with old feature prose. | Ready for publication |
| Shorten ten Spanish descriptions | The ten audited descriptions are now at most 160 characters. Twelve modified Spanish descriptions were checked, including the blog and Windows evergreen descriptions; lengths range from 107–143 characters. | Ready for publication |
| Preserve useful guides, demos, and purchase clarity | Existing calibration, takeoff, symbol-counting, revision, Teams, pricing, and download components are reused. The report’s deferred broad comparisons and unvalidated content ideas were not promoted into new projects. | Preserved |

## Search Console evidence

Retrieved October 15, 2026 for `sc-domain:polypdf.com`. The performance request covers September 15–October 13 and returns the first 50 query/page rows across all countries, with additional rows available. These are sampled rows, not sitewide totals or US-only figures.

| Query and page | Clicks | Impressions | Average position |
| --- | ---: | ---: | ---: |
| `polypdf` → English homepage | 81 | 238 | 1.2 |
| `poly pdf` → English homepage | 33 | 146 | 3.2 |

URL inspection confirmed the homepage, `/measure-pdf-on-mac/`, `/pdf-takeoff-software/`, and `/zh-cn/revision-packages/` are submitted and indexed. Their Google-selected canonicals match the declared canonicals. This establishes the checked pages’ indexing state; it does not attribute a traffic trend or forecast the new page’s performance.

OpenSEO GA4 overview and measurement-health tools both report `ga4_not_connected`. The existing site measurement ID is `G-533RWNRCFP`. Google sign-in was opened for the owner; no credentials, consent grants, new property, or analytics settings were submitted by the agent. Once connected, inspect organic landing pages and key events for download and purchase attribution. The original October 7 report remains historical.

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

Machine-readable receipts: [generated-site checks](seo-generated-validation-2026-10-15.json) and [real handoff sample](seo-handoff-sample-2026-10-15.json). New translations are AI-assisted editorial updates, without independent native-speaker review.

## Publication and measurement

Publish the exact validated website commit through `scripts/deploy-static.py` staging and activation, then verify the new page, its inbound links, metadata, and sample over public HTTP. Do not deploy the older `master` snapshot. No installer, appcast, update feed, license API, or production analytics setting is part of this website change.

After publication and the owner’s GA4 connection, compare Search Console query/page clicks with organic landing-page downloads, checkout activity, and verified purchases. No traffic uplift or conversion improvement has yet been measured. The audit does not justify a backlink disavow, broad page rewrite, or language-tag change.
