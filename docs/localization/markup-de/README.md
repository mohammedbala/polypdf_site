# German markup-table walkthrough preparation

Status: **draft; controls verified, native Save/exports/reopen pending**. The German media pack remains at 76 verified mappings and four completed routes. `/de/blog/pdf-markup-table-rfi-punch-list/` has not been registered as a completed regional route.

## Prepared drawing and copy

`public/localized-media/de/samples/markup/x101-koordinationspruefung.pdf` contains the first A1 sheet from the existing German coordination library: the fictional Bürgerhaus am Lindenpark, metric dimensions, German notes, four layers and three editable PDF notes. The preparation clarifies note subjects/comments and assigns stable IDs. It preserves painted page content, text, boxes, layer references and rendered pixels. `/Lang` is `de-DE`. The second sheet is intentionally excluded because its fixed printed status checklist would conflict with the live status exercise.

The PDF, preview and verification receipt regenerate byte-for-byte. `source-repeatability.json` and the public `source-verification.json` record independent PDF and Poppler checks. The original drawing is unchanged.

`scripts/localization/markup-de.draft.json` contains 97 German text overrides and six source-bound element replacements. It describes the actual three prepared notes, the three-status example, filtering to two visible rows, a five-column CSV and a PDF summary grouped by status. The draft distinguishes printed reference circles from editable notes and fictional completion from real project approval. Its status terminology matches all eight current German app options, including **Akzeptiert**, **Abgebrochen** and **Überprüft**.

`draft-contract.json` verifies the current English prerender, consumed copy overrides, regional source hashes and app vocabulary. It also verifies that the draft is absent from the public manifest and cannot activate regional media. Future-facing Save/export/reopen instructions in this draft are not passing workflow evidence.

## Actual app evidence

The current [controls receipt](controls/controls-validation.json) and [visual review](controls/visual-review.json) cover an isolated Mac development instance, PolyPDF 1.6.17 build 84, source `ca1daa0aa083c8e5468887ecaf12827e4fc1b54b72270cd5db7fc6c26728af1f`.

- The source opens with its three exact German note subjects, comments and positions.
- Real Settings controls select metric measurements; the footer reads **841 x 594 mm**. This is an explicit demonstration preference, not a locale side effect.
- The real column manager selects Betreff, Status, Seite, Kommentare and Autor. Real resize gestures make the German Status and Seite labels readable.
- Production table controls set PR-001 to **Offen**, PR-002 to **In Bearbeitung** and PR-003 to **Abgeschlossen**. The inline comment editor records the fictional completion explanation.
- Filtering out Abgeschlossen leaves two visible rows. Clearing the filter restores all three. The source PDF remains unchanged.
- Both app phases quit normally, and the disposable profile is removed. The two captured frames were inspected. The log's unavailable plugin handler is expected with plugins disabled for this owned test instance.

The [three-status screenshot](controls/pruefregister-drei-status.png) and [filter screenshot](controls/pruefregister-filter.png) are **partial QA evidence**, not registered public walkthrough assets. The source/build/script hashes are retained. These checks do not qualify Windows, native iPad, released installers, native Save, exports or fresh-process reopening.

The earlier `before-native-save/` attempt reached Save As, but Computer Use reported a locked Mac. It timed out without creating a saved PDF, CSV or summary PDF. That attempt and its exact script/build/source receipt are preserved separately. Both of its processes quit normally; its stopped disposable profile was removed after confirming no matching process remained.

## Reproduction and completion

Use a Python environment with pypdf and Pillow, plus Poppler. From this isolated site checkout:

```sh
python3 scripts/localization/prepare-markup-de.py
POLYPDF_APP_ROOT=/absolute/path/to/polypdf node scripts/localization/verify-markup-draft.cjs
POLYPDF_APP_ROOT=/absolute/path/to/polypdf node scripts/localization/capture-markup-de.mjs --controls-only
```

The controls-only mode deliberately writes `controls-validation.json` with `status: partial`, no output files and an explicit native-workflow limitation. It never writes a passing `validation.json`.

Once the Mac is unlocked, run the same capture without `--controls-only`. Complete its three native Save dialogs through Computer Use using the paths printed by the runner:

1. `.tmp/localization/markup-de/x101-pruefregister.pdf`
2. `.tmp/localization/markup-de/pruefregister.csv`
3. `.tmp/localization/markup-de/pruefregister-zusammenfassung.pdf`

The full run must verify all exports and a fresh-process reopen before it writes a passing receipt. Retain any earlier output before repeating; the runner refuses to overwrite the three deliverables. Do not treat controls-only output as substitute evidence.

Then independently inspect native PDF note fields, the three CSV records/five columns, PDF summary counts and every rendered summary page. If the summary embeds local source links, preserve the original app export and create a documented public-link derivative with unchanged page content. Register the verified screenshots/downloads, complete the profile, run the page and international checks, and verify language switching and download hashes in the browser. Only then increment the complete-route count.

The existing 26 page/media/international tests pass; see `site-tests.log`. App production source was unchanged in this checkpoint. No push, PR, deployment, email or release occurred.
