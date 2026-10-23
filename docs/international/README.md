# International content publishing

The website publishes eight language editions: Spanish (`/es/`), Brazilian Portuguese
(`/pt-br/`), German (`/de/`), French (`/fr/`), Arabic (`/ar/`), Hindi (`/hi/`), Simplified
Chinese (`/zh-cn/`), and Japanese (`/ja/`). English keeps its existing URLs.

All guides, product blog articles, workflow pages, plugin authoring, Windows download,
support and feature-request content are translated in full. Each locale also has a
construction-oriented home with a metric worked example and links to its complete library.
The English checkout, account, live version feeds and policies remain authoritative and
are explicitly labeled at the language handoff. This does not claim translated desktop UI,
local offices, native-language support staffing, local engineering-code approval, or local
currency pricing.

## Architecture

`npm run build` builds and verifies the existing English React application, then creates
224 static localized HTML pages from the same rendered content. Reading pages need no
JavaScript, browser translation service, translation cookie, tracking, or redirect. Download
anchors, language links, email links, tables and native FAQ disclosures work without script.
Checkout links enter the existing application with its consent and licensing checks.

The build preserves every article section, ordered step, FAQ, table, code example and image.
It translates body text, titles, descriptions, alt text, accessible names, captions and human
structured-data values. Source code, URLs, asset hashes, article dates and author identities
remain intact. Screenshot language, original units and historical verification dates are
explained to readers. Source evidence links remain available.

Every language has a self-canonical URL, reciprocal English/locale/x-default hreflang,
HTML lang, appropriate direction, Open Graph locale, localized BlogPosting/WebPage schema,
RSS, and a localized llms.txt. The generated sitemap includes all counterparts. These are
ordinary useful translated pages, with no country-keyword doorway duplicates or unsupported
FAQ rich-result promises. llms.txt is an optional discovery aid, not an indexing guarantee.

The source registry is `src/lib/locales.json`. `src/lib/englishOnlyRoutes.json` is the explicit
scope exclusion list; any new article or evergreen route enters the translation coverage
automatically. Locale URLs retain the stable English article slug, so future title edits
cannot break inbound links. Language selection uses ordinary crawlable anchors and never
redirects visitors based on IP address or browser language.

## Updating content

1. Edit and verify the English source as usual.
2. Run `npm run translations:extract` to build English and collect complete sentences plus
   metadata into `.tmp/international/source-strings.json`.
3. Edit `src/content/translations/<locale>.json` for every new or changed source string.
   The explicit optional editorial import command is `python3 scripts/international/translate.py`
   (or `--locale es`). It sends public website copy to Google's public translation endpoint;
   it never runs during build, deployment, or a customer visit. Requires a Python installation
   with working TLS certificates. The endpoint is not a production dependency or availability
   guarantee; catalogs can always be edited directly.
4. Run `python3 scripts/international/editorial.py` for the baseline terminology and brand-spelling corrections. Review and update the route-keyed `editorial-titles.json` when adding a page. Review construction terminology, complete sentences, negations, product limits and all
   numerical examples. Machine-assisted catalogs are not certified native-speaker translations.
   Disambiguating construction jargon before translating is more grammatical than replacing
   placeholders with isolated target-language nouns afterward. Human improvements belong in
   the checked-in catalogs and are preserved by subsequent imports.
5. Run `npm run test:international` and `CI=true npm run build`. Missing strings fail the build;
   English text cannot silently fill a published foreign-language page.
6. Serve `build/` as directories, without an SPA fallback. Check local-language reading,
   mobile wrapping, Arabic RTL, download links, language switching and the English checkout.
   Use `npm run smoke:international -- http://localhost:PORT` for HTTP verification.

The final generated sitemap and discovery files are in `BUILD_PATH` (default `build`);
`public/sitemap.xml` remains the English seed. `international-manifest.json` records the full
published page inventory and a hash of the current source string set. Build-time parity
checks cover every locale/page and workflow deployment additionally fetches all 224 pages.
Do not add generated pages to route-metadata.json or hydrate them with the English app.

## Measuring acquisition

Evaluate Search Console page prefixes and language search queries, and customer acquisition
through the existing consent-aware English checkout. Purchase links carry an `intl_<locale>_` source prefix, preserving placement identifiers; no additional tracking or storage is introduced on translated reading pages. These changes create discoverable
content; they do not establish rankings, answer-engine citations, traffic or sales. Native
editorial review and real query/conversion evidence should guide further terminology and
market investment. Adding another country within the same language does not require another
copy of an article.
