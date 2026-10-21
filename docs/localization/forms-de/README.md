# German fillable-form walkthrough — 21 October 2026

The local German `/de/blog/create-fillable-pdf-form/` guide now uses a real German Mac app capture, a German A4 template, the native saved example and an eleven-field CSV. The source template contains ten fields; the walkthrough adds `pruefbereich` as a list field with German choices. German media remains a pilot: **84 mappings, seven complete routes**. No deployment or production release occurred.

## Actual workflow and result

The owned local PolyPDF 1.6.17 Build 84 instance used source `728f812de145fa5b2ced3611dca36189d38082a3e3d73e084019b2855c3bc1a1` and bundle set `40d0a1bd1ee6a8bae45520f7fbe07d37ea9e56e9269a1489cc35ea62d9dbd815`. German and metric preferences were selected before a restart. The source form and existing field values were preserved; only a printed German label was added to the blank area.

Real form controls reject duplicate `project`, add a list field using `pruefbereich`, `Prüfbereich auswählen`, Nordflügel/Südflügel/Außenanlage and tab position 13, then fill all eleven fields through DOM control events. The native macOS Save dialog wrote the separate output. A full process restart preserved all thirteen widget controls and eleven field values. The app quit normally and its owned profile was removed.

Independent pypdf validation checks canonical field-tree identity, inherited widget values, nonempty appearances, checkbox/radio appearance states, German language metadata, A4 dimensions, choices and field-type counts. The file remains interactive. Poppler rendering and visual inspection confirm readable German text, selected choices, checkbox states and multiline notes without overlap or clipping.

The sample deliberately leaves the required `photos_referenced` checkbox unchecked. This demonstrates a missing required state, not a completed inspection. The guide explains the limitation. `FollowUp` and existing ASCII field identifiers remain stable data keys; German labels are separate.

## Website verification

- Four actual app captures retained; only the fresh-process reopened capture replaces the historical hero and social image.
- Both PDFs and the eleven-field CSV are source-bound by SHA-256. Source-aware page copy describes the exact demonstrated steps, field counts and incomplete checkbox state.
- Route-specific regional-form description/evidence avoids changing the original ten-field template explanations on unrelated pages. Regression tests reject wrong-region and invalid overrides.
- 14 media/export tests and eight international tests pass. English build and prerender pass for 91 routes. International verification passes for 240 editorial pages in eight languages, and 836 translated tool pages in 23 languages including English.
- Actual browser language-menu journey English → Deutsch → English passed. The German hero loaded, all three downloaded artifacts byte-matched their source files, and English restored its original image/template. Screenshots and `browser-verification.json` retain the result. The static server's expected `/api/commercial-offer` 404 is outside this guide verification; no commercial API was served locally.
- Existing German OCR and review-register page checks pass; updated regression receipts are retained here without rewriting those historical public receipts.

## Corrections and limits

The initial capture selector matched the dialog's root attribute instead of the field-type `<select>`; the failed receipt is retained. A successful narrow-sidebar attempt was superseded after visual review found clipped palette labels and a reused tab position. The final run widens the sidebar through its real drag handle and uses position 13. No screenshot pixels were edited.

The default narrow Forms sidebar can still clip long labels; its general responsive layout remains follow-up work. The pre-save audit frame retains the English transient status `Updated form field observation`; only the reopened state is used publicly. The toolbar's current German catalog uses `Upgrade`, and raw PDF flag identifiers remain literal. This does not establish full interface translation.

Only the local Mac development build was exercised. Windows, native iPad, hardware keyboard tab traversal, third-party interactive filling and native-speaker review remain unqualified. The full language/media rollout is incomplete.

## Disk cleanup

User-authorized cleanup removed regenerable Clang module cache, the website worktree's Babel cache and in-app browser JavaScript code cache. `cache-cleanup.json` records every path and byte total: 695,802,128 logical bytes, with about 763 MB of observed free-space gain. Documents, source, installed runtimes and retained evidence were preserved. Subsequent builds regenerated some cache; approximately 1.4 GiB remained free at verification.

## Reproduction

1. Run `prepare-forms-de.py` with bundled Python (pypdf and ReportLab).
2. Preserve existing `.tmp/localization/forms-de` outputs before another capture. Set `POLYPDF_APP_ROOT` to the frozen built app worktree and run `capture-forms-de.mjs`. Complete its actual native Save dialog at the printed path; do not substitute a direct file write.
3. Run `verify-forms-de.py`, render both PDFs with Poppler, and inspect the final capture and pages.
4. Run `register-forms-de.cjs` with the same app root, the focused media/international tests, and the English/localized build sequence recorded in the logs.
5. Run `verify-forms-page.cjs`, then the real language-menu and three-download browser checks.

Public capture and structure receipts live under `public/localized-media/de/guides/forms/` and `public/localized-media/de/samples/forms-guide/`.
