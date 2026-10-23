# Website alignment with PolyPDF 1.5.4

Prepared September 11, 2026 against the published Mac and Windows 1.5.4 build 26 release. Application source: `88d3853b59bc7a1a966c668cbce2aa96b2c42b26`. Website baseline: `7480fbc7de180cfa1b0775ee28f9fab0606f1e2a`.

## Content

- Current version, build and date now drive the homepage badge, release spotlight, FAQ, support/update instructions, Windows page, plugin page, version-history fallback and software structured data.
- Added `/blog/polypdf-1-5-4/`, covering highlight blending and filled-shape conversion, separate arc radius/sweep handles and helper dimensions, movable cutouts with aligned handles, estimate scrolling, Windows file-opening checks, and supported Doom/OfficeKart document playback.
- Added Mac and Windows 1.5.4 history summaries and direct links to each platform's published release notes.
- Updated the cutout, markup and takeoff guides and construction-markup landing page. Their original walkthrough dates and screenshot capture versions remain explicit; the new editorial review is dated separately.
- Added shared-drive troubleshooting guidance without claiming that a specific customer's cause was proven.
- Updated the blog index, search/share metadata, sitemap, RSS, and llms.txt. Removed stale Founder wording and an undefined reference price from the discovery generator; the standard Pro offer remains $74.95 USD once.
- All eight language editions include the release article, updated guides, current release identity and support information: 232 localized pages in addition to 38 English routes.

## Images and translation

Original screenshot labels and historical release articles retain their actual versions. The release article reuses the already-approved 1.4.0 area screenshot and labels it as historical; its share-image copy is byte-identical and added to the existing evidence record. No screenshot was relabeled as 1.5.4 and no new app walkthrough qualification is claimed.

The optional translation endpoint returned HTTP 429 without importing any new strings. The 91 new or changed strings per language were completed locally with AI assistance, retaining existing editorial translations and adapting unchanged version-only sentences. Menus retain their English app labels. These are not certified native-speaker translations. The build fails on missing translations and verifies complete section, table, FAQ, step and image parity. The Arabic release tag and article-navigation label were also corrected during visual review.

## Checks

- Four focused existing content test suites: 18 tests passed.
- International publishing unit tests: 6 passed; deployment smoke unit tests: 8 passed.
- Production English build, 38 prerendered routes and JSON-LD checks passed.
- Screenshot provenance: 63 PNGs, 45 evidence records, zero violations.
- International build and verification cover all 232 pages, their metadata, language links, schema, internal links and retained content.
- Additional built-content audit: 38 English pages, 232 localized pages and 11 software schemas identify the current release correctly; no stale active English version/update labels or undefined Founder price remain.
- In-app browser review covered the homepage release section, full release article, narrow layout and Arabic right-to-left article. The temporary viewport override was reset.

## Publication

Publish the verified local static build using the existing deployment identity and atomic `current` symlink. This follows the local-build publication lane used for 1.5.3, preserves the exact previous release for rollback, and avoids a competing hosted build. The source commit uses `[skip ci]`; publication still verifies every transferred file against its SHA-256 manifest and runs the existing public website and international smoke checks. No app installers, update feeds, license API, prices, credentials or nginx configuration need changing.

Final publication receipts and live verification results are retained in this task's `.tmp/release-1.5.4/` and the companion publication record.

## Published result

Published at 14:55 UTC on September 11, 2026 from website commit `584a99c75fcd00f6ace90fc9b613c0778b4d6b55`, pushed to `master`. All 391 staged files matched the local manifest before the atomic switch. The previous `7480fbc` website remains intact for rollback.

Live production smoke passed 72 checks, including current Mac/Windows updater feeds and download endpoints, route metadata, image hashes, commercial offer and the existing unpaid checkout check. International production smoke passed all 232 pages and 16 discovery files. The published release article was verified in the in-app browser. Compact receipts are in `docs/audits/evidence/release-1.5.4/`.

The local GitHub HTTPS credential had expired; the existing GitHub SSH identity successfully pushed the exact source commit. No credentials or access settings were changed.
