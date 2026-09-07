# Website alignment with PolyPDF 1.5.1

Reviewed September 7, 2026 against the published Mac and Windows release, version 1.5.1 build 23. Desktop source: `86870133c7128998c3d1974954bbb24141898917`. Website starting point: production commit `1bc7c2ae9b43ea17c1cd1204fe7862fc4545d57d`.

## Content changes

- Current release identity, homepage FAQ and feature inventory, Windows page, support instructions, shipped feature requests, version-history prose and fallback history now reflect 1.5.1.
- Added `/blog/polypdf-1-5-1/` and `/blog/create-interactive-pdf-stamps/`. The stamp guide follows the actual blank-canvas creation flow, optional unchecked Add to toolset checkbox, per-placement prompt and ordinary saved stamp appearance.
- Added metric-default guidance to calibration, measurement troubleshooting, area/depth and takeoff guides. Added stamp/form/signature distinctions and save/reopen guidance to the affected review, form and issued-set guides.
- Updated relevant landing-page copy, links, structured data, route descriptions, RSS, image sitemap, sitemap dates and `llms.txt`. New article share images use their own 1.5.1 cache token.
- Retained the historical 1.5.0 release and genuine screenshot capture versions. Fixed the Revision Package image label, which previously borrowed the current app version and would incorrectly relabel old pixels as a new capture.
- Article release review is distinct from the dated walkthrough qualification. Existing screenshots and earlier independent-viewer qualification have not been renamed or presented as new tests.

## Review coverage

| Pages or guide | Release alignment decision |
| --- | --- |
| Homepage, Windows, support, version history | Current release, new workflows, installation/update instructions and current captures updated. |
| Buy, upgrade, account, terms, privacy, cookies, refund, accessibility | Reviewed for platform/access contradictions; existing commercial and privacy terms remain applicable. Recent cookie and checkout controls preserved. |
| Revision Package landing page | Retained current workflow; identified its introduction in 1.5 and its actual 1.5.0 capture. |
| Takeoff and Mac measurement landing pages | Added millimetre-default guidance where applicable; calibrated measurement and Free/Pro boundaries retained. |
| Construction markup landing page | Added interactive stamps and linked the new walkthrough. |
| Symbol-count and comparison landing pages | Existing workflow remains applicable; no new automation or compatibility promises added. |
| Calibration, wrong measurements, area/cutouts/depth, takeoff example | Added new metric defaults, preservation of existing explicit formats and unit checks. Original worked quantities retained. |
| Markup Table / RFI / punch list | Added reusable stamp workflow without substituting it for discussion or signing. |
| Forms | Distinguished AcroForms from interactive stamp fields; retained XFA, signed/secured document and restricted calculation limits. |
| Signatures and seals | Added saved-appearance changes and unsigned-widget distinction; cryptographic validity remains separate from appearance and trust. |
| Compare revisions, issued PDF sets | Added navigation/layer/presentation guidance; per-document finishing and signing order retained. Cross-file Batch Process is still not exposed in the shipping menu. |
| OCR | Whole-document local OCR, current-session structured-table export and script coverage remain applicable. Earlier screenshot qualification retained. |
| Symbol Search | Candidate review and Pro access remain applicable; built-in symbol placement is distinguished in the release overview. |
| Redaction and sanitation | Retained the documented limits. Current source still strips attachment name trees/AF entries without exhaustive FileAttachment traversal and checks top-level image placement separately. No broader removal assurance added. |
| Plugins and plugin authoring | Package format and Pro boundaries remain applicable; current app identity is shared release data. No marketplace, arbitrary executable plugin or design-capacity claims added. |
| Collaboration Beta | Retained beta status, separate customer-owned host and earlier qualification. This desktop release does not imply a new host release. |
| Feature requests | Added the features now shipped in 1.5.1. |

## Graphics and native verification

Five full-window captures were made through native Computer Use in the signed/notarized Mac 1.5.1 app: blank stamp canvas, completed builder, placement prompt, placed stamp, and Architectural tools. The app archive hash is `7c3d1ef2ecd2cd56d815e7a606040f5f7626f9d8227ae9cc5004820c48417e60`.

The capture used an isolated profile and the bundled Quick Start PDF with fictional reviewer data. New stamp creation, 300 × 180 pt geometry, fixed heading, required reviewer prompt, automatic date, toolset saving, placement, save to a new local sample, native Presentation Mode entry and Escape exit were observed. The user's running development app was preserved; the capture app was quit after saving.

Original screenshots were returned as JPEG by the capture adapter. Originals are retained beside PNG encoding conversions. No pixels were retouched, no replacement interface was generated, and no page-only cropping or viewport emulation was used. Publication copies are byte-identical to the PNG sources. Hashes, source provenance and manual observation reports are recorded in the screenshot evidence registry and `assets-source/release-1.5.1/`.

## Validation before deployment

- Website unit/content suite: 20 suites, 66 tests passed.
- Deployment-smoke test suite: 8 tests passed.
- Production build: compiled successfully with CI warnings treated as failures.
- Prerender and JSON-LD: all 37 routes plus static 404 generated; 37 route checks passed.
- Screenshot evidence: 62 PNGs, 45 records, zero violations or missing records.
- Static link/asset audit: 37 routes, 55 distinct local assets, 65 internal link targets, zero issues.
- In-app browser: all 37 routes inspected at 390 × 844, with one H1 each, no horizontal page overflow and no broken loaded images. Large article captures remain keyboard-focusable horizontal image panels. Homepage release navigation and the new guide were visually inspected at desktop and mobile widths.
- No real payment, customer contact or production license change was performed during the content audit. Production deployment retains its existing expiring synthetic checkout smoke and rollback behavior.

Detailed route evidence: `docs/audits/evidence/release-1.5.1/`. Publication uses the normal GitHub Actions deployment with activation checks, production smoke tests and automatic rollback on failure.

## Deployment caption correction

The first production attempt (`d2ef164`, workflow `34149737719`) completed its build but the production smoke check rejected the homepage caption because it lacked the expected current build identity. The workflow successfully restored the previous release before any checkout smoke ran. The new capture caption now explicitly states its authentic 1.5.1 build 23 identity; the historical Revision Package caption remains 1.5.0 build 22. The production guard was retained unchanged.
