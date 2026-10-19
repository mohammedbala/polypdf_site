# Browser tool icons and localization

The browser toolkit has 36 original operation icons and 38 interactive routes (the directory, automation instructions, and 36 tools). The toolkit supports English plus the 22 locales in `src/toolkit/locales.json`. Existing marketing guides retain their separate eight-language publishing workflow.

`src/toolkit/icons.json` contains the original 32-unit vector drawings. `PdfToolIcon` renders decorative SVGs next to visible tool names. `scripts/toolkit/icons.cjs` produces standalone accessible SVGs and 1200 × 630 PNG social images. The build checks that every operation has a distinct drawing.

The localized applications use the same engine, canonical operation IDs, input values, file limits, and MCP schemas. `localizeView` translates visible copy and accessible labels while preserving handlers, refs, field values, filenames, document content, and code examples. Form identifiers and choice values from documents are deliberately untranslated. Arabic and Hebrew use right-to-left layouts; PDF previews retain document orientation.

Translations are saved machine-translation catalogs with technical glossary checks and selected editorial corrections. No translation service runs in the production build or receives users' documents. `scripts/international/translate.py --toolkit` is an explicit editorial import of public website copy. `scripts/toolkit/review-translations.cjs` normalizes Traditional Chinese and clarifies ambiguous conversion labels. New languages still benefit from native-speaker editorial review.

`npm run translations:tools` extracts copy from the built English application and source UI states. After reviewing/importing translations, `npm run build` writes complete localized HTML, localized titles and descriptions, direct answers, examples, FAQs, WebApplication data, self-canonicals, reciprocal hreflang, sitemap entries, and per-language `tools/llms.txt`. Translation dictionaries are fetched once per language from content-hashed first-party JSON, before hydration. A failed request preserves server content and offers a translated reload control.

The toolkit renderer is separate from static-guide translation so uploaded-file controls remain interactive. `englishOnlyRoutes.json` describes genuinely English-only routes; both renderers explicitly select their supported routes. Translated guides link into the localized toolkit.

Verification includes the website tests, 92 engine/MCP checks, the extracted MCP-package test, `verify:international`, `verify:tool-languages`, `verify:navigation`, and `verify:seo-growth`. Deployment checks English prerendering, guide localization, and toolkit localization before staging immutable assets. Browser QA covers responsive navigation, filters, translated controls, real document processing, and downloads. Static accessibility checks exclude color contrast and do not establish full WCAG conformance.
