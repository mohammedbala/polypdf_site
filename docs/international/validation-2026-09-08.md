# International site validation — September 8, 2026

Candidate built from the deployed `76f3f6e` source in an isolated worktree.

## Scope and evidence

- 8 language editions, each with 28 pages: 16 complete articles (13 workflow guides and
  3 product articles), the guide index, 6 workflow landing pages, plugin authoring,
  Windows, support, feature requests, and a localized construction home.
- 224 localized pages plus the existing 37 English routes.
- 2,040 source strings in each checked-in language catalog; 224 separately authored search
  titles keyed by stable routes. Full prose is machine-assisted with targeted technical
  terminology, brand and title corrections. This is not a certified native-speaker review.
- English transaction, policy and live-feed pages are clearly labeled. Purchase links carry
  the locale in a placement source parameter; the existing English checkout still enforces
  consent before collecting attribution.

## Checks performed

- `CI=true npm test -- --watchAll=false --runInBand`: 66/66 existing website tests passed.
- `npm run test:post-deploy`: 8/8 existing deployment smoke tests passed.
- `npm run test:international`: 6/6 behavior tests passed, including missing-string failure,
  complete-sentence translation, code/URL preservation, checkout attribution, language
  alternatives, coverage and structured-data identity.
- `CI=true npm run build`: screenshot evidence, 37-route English prerender and 224-page
  international verification passed. The final scoped generator/verification also passed
  after the checkout source parameter was added.
- All localized pages preserve article section, step, FAQ, table, image and code counts;
  schema headlines match visible H1s; canonical, language, direction, reciprocal hreflang,
  internal links, assets and sitemap alternatives pass. Publisher identity is preserved.
- Re-running the international generator on the built output passed again with no duplicate
  sitemap URLs. The pipeline honors `BUILD_PATH` and does not need a translation provider.
- Read-only HTTP smoke against the local static server passed every localized page and all
  16 localized RSS/llms discovery files.
- In-app Chromium checks loaded all 224 pages at both 390px and 320px. No horizontal page
  overflow was found; the 390px run also checked H1 presence and loaded-image failures.
- Desktop checks covered the home, calibration article and takeoff landing page in all eight
  languages at 1280px (24 pages), with no page overflow.
- Spanish desktop/mobile, Arabic mobile and Japanese desktop layouts were visually inspected.
  Switching Spanish → Arabic retained the exact calibration guide. An RTL figure alignment
  issue was corrected with logical right-side positioning; checks waited for CSS and fonts
  before measuring. Original screenshot scrolling remains available on phones.

Local detailed logs are in `.tmp/international/`. Live deployment is separately qualified by
an added workflow step that fetches all 224 localized pages and 16 discovery files and uses
the existing automatic rollback on failure.

## Interpretation

These checks establish that the content is published as readable, linked, structured
language editions. They do not establish indexing, rankings, AI citations, native linguistic
certification or customer acquisition. Continue editorial improvements using actual language
queries and customer feedback; new English copy must receive new translations before it can
pass a deployment build.

## Deployment baseline correction

The first production workflow correctly rejected a pre-existing release mismatch: both live
updater feeds already served 1.5.2 build 24 while the website source still advertised 1.5.1
build 23. Workflow 34240056201 restored the previous website automatically. Current metadata,
release prose, static version-history fallbacks and discovery references now follow the public
Mac and Windows 1.5.2 notes. The 1.5.1 blog post, guide verification dates and authentic 1.5.1
screenshots keep their historical identities. The smoke guard now checks current release and
featured screenshot version/build independently, and the same check runs before deployment.
After correction, all 66 website tests, 8 deployment tests and 6 international tests passed again.
