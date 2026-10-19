# Browser PDF toolkit

The 36 operations in `src/toolkit/catalog.json` are the single public catalogue. The UI, static landing pages, option controls, MCP manifest and local MCP server use this catalogue. `engine.mjs` provides validation and PDF operations. Browser and Node adapters provide rendering/image decoding; original bytes are never overwritten.

`src/toolkit/page-content.json` supplies each tool page’s unique search title, description, practical example, two task-specific answers, and three related operations. The metadata generator and visible page read the same content. `node scripts/toolkit/verify-pages.mjs` validates all 36 built pages: canonical URLs, indexability, sitemap entries, static answers/examples, unique metadata/questions, application schema, and related links. Search titles stay within the site’s 60-character budget and descriptions within 155 characters.

## Relationship to the prepared OpenAI integration

The existing application repo has a native PolyPDF editor and a separate guest gateway with shared UI/model revisions, explicit file authorization, exact retry receipts, and temporary hosted workspaces. That runtime supports macOS and Windows and cannot simply run on the Linux static website host. Its October 3 deployment evidence does not establish public production activation or full ChatGPT acceptance.

The browser toolkit reuses these interface principles, not the native engine: explicit file handles/allowed roots, structured actions, input fingerprints, receipt-backed retries, output checksums, source preservation, and honest operation limits. The browser tools do not claim native PolyPDF feature parity or hosted data retention.

## Processing and privacy

Browser files stay in memory in the current tab. No document upload endpoint is used. Only static runtime assets and the optional public sample are fetched. File names, bytes, extracted text, and form values are not analytics properties. Consent-gated completion/download events include only the catalogue tool ID and source label. Clear files or close the tab to release the selected inputs; revoke download/preview URLs when replaced.

MCP is an optional local stdio server. It accepts only paths under an explicit `--root`, follows real paths before checking scope, checks optional source SHA-256 values, writes new results into a dedicated output subdirectory, and refuses conflicting request-ID reuse. The connected client/provider's data policy applies. Tool resources are restricted to outputs from the session and verified against their checksum. There is no public HTTP service or credential embedded in the package.

## Boundaries

- 30 MB/file, 80 MB total input, 500 pages; rendering 100 pages/16MP per page; 120 MB output.
- Password-protected files are unsupported. Signed PDFs are rejected for edits.
- Text extraction/comparison reads existing text, not OCR. Comparison is page-by-page text, not geometry or overlay.
- Page assembly flattens form values and does not carry document-level bookmarks, tags or attachments. Page layout produces static content without interactive annotations/links.
- Form flattening handles AcroForm fields, not all annotations/layers. XFA is unsupported. Field types use instanceof so minification cannot alter detection.
- Image compression loses selectable text, vector detail, links and interactive forms. Structural compression can increase size; report actual byte counts.
- Cropping changes visibility, not data removal. No secure redaction claim.
- Text stamps use a Latin font. Placement requires unrotated pages and rejects out-of-page content.
- Resizing, booklet and n-up change drawing scale. No measured quantities are inferred.
- A pasted signature image is not a cryptographic signature.

## Build and verification

`npm run build` copies pinned PDF.js assets, packages the local MCP adapter and lockfile, regenerates discovery, and prerenders every catalogue page with real content. Browser toolkit routes are English-only until deliberately localized; the existing translated routes are retained.

`npm run test:pdf-tools` exercises all 36 actual operations plus input limits, field values/appearances, rotation/layout, signed-file refusal, MCP protocol transport, restricted paths, retry conflicts and output-resource checksums. The standard site tests, static navigation/accessibility checks and release hash/endpoint gates remain required. Use actual browser flows and render exported PDFs independently before publication. WebMCP registration is progressive enhancement; client/browser support is not guaranteed.

The acceptance suite also executes every operation through a real stdio MCP client, reopens outputs, checks page sequences/dimensions/text or JSON/image content, verifies resource hashes and exact retries, and confirms source immutability. Form edge tests cover multiline values and visible appearance placement, multiple selections, single-choice validation, and field length limits. MCP 1.0.2 includes these form fixes and refits overflowing multiline text per widget; entries that cannot fit legibly are rejected. The package version follows the manifest so a changed engine does not replay results from the previous version.
