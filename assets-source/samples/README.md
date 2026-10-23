# Sample source and provenance

`construction-library/` preserves the original generator and independent verifier for the owned Willow Creek Community Center demonstration series created October 2, 2026. The 12 published PDFs are byte-identical to those masters, including their two-page bookmarks, vector content, coordination layers/notes and image-only scan. No customer plans or professional seals are used.

`original-app-outputs/` preserves the two publicly available October 16 Mac 1.6.6 build 38 outputs before the drawing-background refresh. Run `scripts/generate-takeoff-samples.py` with ReportLab and pypdf to regenerate the practice sheets, references and measured derivatives. Run `scripts/verify-practice-drawings.py` with pypdf and pdfplumber to compare every annotation payload and appearance stream with these originals, verify page scale/viewports, calculate the exact quantities and count the plan fixtures. Render and inspect PDFs after any edit.

The refresh does not claim a new desktop-app export or compatibility test. Public `desktop-evidence.json` and `manifest.json` record the source hashes, derived hashes and transformation. Worksheet CSV/PDF exports retain their historical evidence and original bytes.
