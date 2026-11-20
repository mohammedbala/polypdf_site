# PolyPDF website release audit

November 20, 2026 · polypdf.com · Desktop 1.6.35, build 117

The production homepage advertised 1.6.32 build 114. The Mac appcast and Windows updater both identified 1.6.35 build 117. The stable downloads matched the build 117 release files byte for byte. All four language-specific Mac installers and all four language-specific Windows links still served the earlier publication. The audit started from deployed website commit `6b29b07e04b4016c05dda571396fd3b983a3dc17`. [Mac release notes](https://www.polypdf.com/downloads/PolyPDFMac-v1.6.35-117.html) · [Windows release notes](https://www.polypdf.com/downloads/windows/PolyPDFWin-v1.6.35-117.html)

## Corrections

- Updated customer-facing release information across the English site and eight translated marketing editions, including support, product facts, the Windows page, structured data, discovery files and the downloadable evaluation kit.
- Added summaries and release-note links for the intervening releases to the version history. Historical screenshots and sample results retain the versions on which they were captured.
- Routed translated download buttons to the current desktop installers. The four language-specific installer pairs can be offered again when their recorded version and build match the website. Shared setup links preserve all eight marketing languages.
- Repaired a broken German electrical guide link and added a main-content landmark to the German takeoff guide. Verified the original four sample PDFs by hash and retained their original native test record.
- Added live Mac and Windows version checks to both stages of static website publication. Site navigation validation now includes all supplemental HTML files.

## Verification

| Check | Result |
| --- | --- |
| Internal navigation | 1,187 HTML pages, 62,505 internal links and 4,387 section links passed |
| Search and language metadata | 1,167 sitemap pages and 23,676 alternate-language links passed |
| International content | 240 translated marketing pages and 836 translated interactive tool pages passed |
| Accessibility | Static axe checks passed on 117 pages. Color contrast was outside this scan |
| Browser behavior | 20 routes passed at 390 and 1,440 CSS pixels in Chrome, including the download pages and both corrected sample guides |
| Public release targets | All 54 linked download and release-note targets returned the expected file types |
| Site tests | 442 React tests, 83 Node tests, 92 PDF-tool tests and 17 Python tests passed |
| Production dependencies | npm reported zero known advisories for the locked production dependencies |
| Stable installer integrity | Mac SHA-256 `6e29ab33509317e168103d11de9d9fe5ead8a70e8b186e09688a95d697f52210` · Windows SHA-256 `ab33eef43a6d963b349ec247a93ba357d14af8853dbcd007a559bb0e5b2ea390` |

The website advertises the existing desktop release. License Manager 1.0.3 and Collaboration Host 1.6.22 have separate download identities. Historical direct bookmarks to the language-specific installers can still retrieve build 114. [Current release history](https://www.polypdf.com/versions/)
