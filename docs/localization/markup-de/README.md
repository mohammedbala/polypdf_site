# German markup-table walkthrough — 21 October 2026

Status: **complete in the local German pilot**. The pilot has 78 verified asset mappings and five completed routes. The overall localization rollout remains incomplete.

The route `/de/blog/pdf-markup-table-rfi-punch-list/` uses the real German app with the fictional Bürgerhaus am Lindenpark X101 coordination drawing. The A1 sheet has metric dimensions, four layers, three editable notes and `/Lang de-DE`. The original page operators, geometry and regional content are preserved. Its source PDF and preview regenerate byte-for-byte.

## Native workflow and persistence fix

The first unlocked run completed the native Save and both exports, then failed its fresh-process reopen assertion: Offen and In Bearbeitung disappeared. The app merge was replacing workspace-only statuses with undefined native values on unchanged imported notes. The app fix retains open/inProgress/reviewed unless a later external review state supersedes them. Six new cases reproduced the bug in both writers; all 35 edit-authority and 36 review-data tests now pass.

The successful run is retained under [native](native/validation.json), with the exact app/script/source hashes. PolyPDF 1.6.17 build 84 source is `b280ed6d1abbf0e504a79b84a6c8e70b9344775e5c4f86080c616d952b9ac413`.

- The owned German profile explicitly selects metric units and five columns: Betreff, Status, Seite, Kommentare and Autor.
- Real table controls set Offen, In Bearbeitung and Abgeschlossen, and edit the third note's completion comment.
- Filtering excludes Abgeschlossen and leaves two rows; clearing it restores all three.
- Real native dialogs save the editable review PDF, three-row CSV and status-grouped summary PDF.
- A fresh app process restores all three statuses, full comments, subjects and geometry.
- All three app phases quit normally without signals; the disposable profile is removed.

Four actual app screenshots were inspected. The saved drawing and the summary's single page were rendered with Poppler and inspected. Independent checks verify public note subjects/comments, private workspace statuses, CSV columns/values, and one summary count per status. The source drawing remains unchanged.

The public summary substitutes public PDF page links for three machine-local PolyPDF links and declares German language metadata. Its page content, extracted text and rendered pixels are identical to the native export. The original export is retained in `native/`. The summary deliberately shortens long detail cells; the page explains this and provides full text in the CSV and editable PDF. Public links open page 1, without the native annotation-focus behavior.

## Website qualification

The completed profile consumes 97 source-bound copy overrides and six element replacements. All eight status terms match the current app catalog. The page supplies four verified downloads: original X101, saved review PDF, detailed CSV and public summary PDF.

The [page receipt](../../../public/localized-media/de/guides/markup/page-verification.json) verifies both localized images, all downloads, source/capture hashes, German terminology, social/schema metadata and preservation of English/unfinished Spanish behavior. The [browser receipt](browser-verification.json) verifies English → German → English through the visible selector, two loaded German images and four real browser downloads with identical hashes. [Browser screenshot](browser-german.png).

Validation passed: 27 unit tests, page-specific checks, 240 international marketing pages and 836 localized toolkit pages. English React/prerender output was rebuilt, then the international and toolkit stages ran normally. The first international check preceded toolkit reconstruction and failed on missing `/es/tools/`; after the required toolkit stage, both complete verification suites passed. Desktop and shared-iPad app builds pass; this does not qualify native iPad hardware.

## Reproduction

From this isolated website checkout, with a built app and an unlocked Mac:

```sh
POLYPDF_APP_ROOT=/absolute/path/to/polypdf node scripts/localization/capture-markup-de.mjs
python3 scripts/localization/verify-markup-pdfs.py
POLYPDF_APP_ROOT=/absolute/path/to/polypdf node scripts/localization/register-markup-de.cjs
node scripts/localization/verify-markup-page.cjs
```

Complete the three native Save dialogs with the runner's printed paths. Preserve earlier output before repeating: it refuses to overwrite deliverables. The PDF verifier needs pypdf, Pillow and Poppler. Registration checks the successful capture and current app build; the final page verifier runs after rebuilding localized pages and copying the verified public assets into the build.

The draft remains an unregistered template; `markup-de.json` is its completed profile with verified download records. Earlier locked, controls-only and status-loss attempts are retained under `before-native-save/`, `controls/` and `status-reopen-failure/`. They remain partial/failed evidence.

The capture uses prepared editable notes, not newly drawn annotations. Completion statuses are fictional, not project approvals. Windows, native iPad, full linguistic review and the remaining languages/media/sample families remain open. No push, PR, deployment, email or release occurred.
