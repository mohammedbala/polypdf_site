#!/usr/bin/env node
/*
 * Generate every crawler-facing discovery artifact from the same blog registry the UI renders.
 * This runs before the CRA build so a new post cannot ship without route metadata, sitemap, RSS,
 * llms.txt, and share-image coverage. Generated files are committed as well, which keeps them
 * useful on GitHub and lets tests catch drift before a production build starts.
 */

'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const srcDirectory = path.join(root, 'src');
const routeMetadataPath = path.join(srcDirectory, 'lib', 'route-metadata.json');
const sitemapPath = path.join(root, 'public', 'sitemap.xml');
const llmsPath = path.join(root, 'public', 'llms.txt');
const feedPath = path.join(root, 'public', 'feed.xml');
const indexTemplatePath = path.join(root, 'public', 'index.html');
const siteRelease = require(path.join(srcDirectory, 'lib', 'siteRelease.json'));
const ORIGIN = 'https://www.polypdf.com';
const SCREENSHOT_IMAGE_VERSION = siteRelease.screenshotCacheToken;
const DEFAULT_IMAGE = `/og-image.png?v=${SCREENSHOT_IMAGE_VERSION}`;
const DEFAULT_IMAGE_ALT =
  'PolyPDF — measure and mark up PDF drawings on Mac and Windows, no subscription';

// Reuse CRA's Babel installation so this dependency-free script can read the ES module guide
// records directly. Image imports only need a stable placeholder here: crawler images come from
// public/guides/<slug>.png, while webpack resolves the in-page screenshots during the real build.
const babel = require('@babel/core');
const originalJsLoader = require.extensions['.js'];
require.extensions['.js'] = (module_, filename) => {
  if (!filename.startsWith(srcDirectory + path.sep)) {
    return originalJsLoader(module_, filename);
  }
  const source = fs.readFileSync(filename, 'utf8');
  const { code } = babel.transformSync(source, {
    filename,
    presets: [[require.resolve('babel-preset-react-app'), { runtime: 'automatic' }]],
    plugins: [require.resolve('@babel/plugin-transform-modules-commonjs')],
    babelrc: false,
    configFile: false,
    compact: false,
    sourceMaps: false
  });
  module_._compile(code, filename);
};

for (const extension of ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp']) {
  require.extensions[extension] = (module_, filename) => {
    module_.exports = `/source-assets/${path.basename(filename)}`;
  };
}

const { guidePosts } = require(path.join(srcDirectory, 'content', 'guides', 'index.js'));
const { blogPosts, blogPostPath } = require(path.join(srcDirectory, 'lib', 'blogPosts.js'));
const { commercialOffer } = require(path.join(srcDirectory, 'lib', 'commercialOffer.js'));

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const pngDimensions = (filename) => {
  const header = fs.readFileSync(filename).subarray(0, 24);
  assert(
    header.length === 24 && header.subarray(0, 8).toString('hex') === '89504e470d0a1a0a',
    `${filename} is not a readable PNG`
  );
  return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
};

const absolute = (route) => {
  if (route === '/') return `${ORIGIN}/`;
  if (/\.[a-z0-9]+(?:\?|$)/i.test(route)) return `${ORIGIN}${route}`;
  return `${ORIGIN}${route.replace(/\/+$/, '')}/`;
};
const postImagePath = (entry) => `/guides/${entry.slug}.png?v=${SCREENSHOT_IMAGE_VERSION}`;
const publicFileForUrl = (urlPath) => path.join(
  root,
  'public',
  new URL(urlPath, `${ORIGIN}/`).pathname.slice(1)
);
const xmlEscape = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

const validatePosts = () => {
  assert(guidePosts.length === 12, `Expected exactly 12 guides, found ${guidePosts.length}`);
  assert(blogPosts.length === 14, `Expected 12 guides plus two product posts, found ${blogPosts.length}`);

  const fields = [
    ['slug', (value) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)],
    ['title', (value) => typeof value === 'string' && value.length > 10],
    ['metaTitle', (value) => typeof value === 'string' && value.length <= 60],
    ['metaDescription', (value) => typeof value === 'string' && value.length >= 50 && value.length <= 155]
  ];
  for (const entry of blogPosts) {
    for (const [field, check] of fields) {
      assert(check(entry[field]), `${entry.slug || 'Blog post'} has invalid ${field}`);
    }
  }

  for (const entry of blogPosts) {
    assert(entry.heroImage?.alt, `${entry.slug} is missing hero image alt text`);
    assert(entry.heroImage?.caption, `${entry.slug} is missing a hero image caption`);
    assert(Number.isInteger(entry.heroImage?.width), `${entry.slug} is missing image width`);
    assert(Number.isInteger(entry.heroImage?.height), `${entry.slug} is missing image height`);
    const shareImagePath = publicFileForUrl(postImagePath(entry));
    assert(fs.existsSync(shareImagePath), `${entry.slug} is missing ${shareImagePath}`);
    assert(fs.statSync(shareImagePath).size > 0, `${entry.slug} share image is empty`);
    const dimensions = pngDimensions(shareImagePath);
    assert(
      dimensions.width === entry.heroImage.width && dimensions.height === entry.heroImage.height,
      `${entry.slug} share image is ${dimensions.width}x${dimensions.height}, expected ${entry.heroImage.width}x${entry.heroImage.height}`
    );
  }
};

const metadataForPost = (entry) => ({
  title: entry.metaTitle,
  description: entry.metaDescription,
  robots: 'index, follow',
  type: 'article',
  image: postImagePath(entry),
  imageAlt: entry.heroImage.alt,
  imageWidth: entry.heroImage.width,
  imageHeight: entry.heroImage.height
});

const buildRouteMetadata = () => {
  const existing = JSON.parse(fs.readFileSync(routeMetadataPath, 'utf8'));
  const next = {};

  for (const [route, entry] of Object.entries(existing)) {
    if (route.startsWith('/blog/')) continue;
    next[route] = entry;
    if (route === '/blog') {
      for (const post of blogPosts) {
        next[blogPostPath(post.slug)] = metadataForPost(post);
      }
    }
  }

  assert(next['/blog'], 'route-metadata.json must define the /blog index before generation');
  for (const post of blogPosts) {
    assert(next[blogPostPath(post.slug)], `Missing generated route for ${post.slug}`);
  }
  return next;
};

const STATIC_LASTMOD = Object.freeze({
  '/': '2026-09-03',
  '/buy': '2026-09-03',
  '/build-a-plugin': '2026-08-18',
  '/privacy': '2026-09-03',
  '/refund': '2026-09-03',
  '/feature-requests': '2026-08-18',
  '/support': '2026-09-03',
  '/windows': '2026-09-03',
  '/terms': '2026-09-03',
  '/versions': '2026-09-03',
  '/revision-packages': '2026-09-03',
  '/pdf-takeoff-software': '2026-09-03',
  '/measure-pdf-on-mac': '2026-09-03',
  '/construction-pdf-markup': '2026-09-03',
  '/visual-search-pdf-count': '2026-09-03',
  '/compare-pdf-drawings': '2026-09-03'
});

const sitemapSettings = (route) => {
  if (route === '/') return { changefreq: 'weekly', priority: '1.0' };
  if (route === '/buy' || route === '/windows') return { changefreq: 'weekly', priority: '0.9' };
  if (route === '/blog') return { changefreq: 'weekly', priority: '0.8' };
  if (route.startsWith('/blog/')) return { changefreq: 'monthly', priority: '0.8' };
  if (route.startsWith('/pdf-') || route.startsWith('/measure-') || route.startsWith('/construction-')
      || route.startsWith('/visual-search-') || route.startsWith('/compare-')
      || route.startsWith('/revision-')) {
    return { changefreq: 'monthly', priority: '0.9' };
  }
  return { changefreq: 'monthly', priority: '0.7' };
};

const buildSitemap = (metadata) => {
  const postByRoute = new Map(blogPosts.map((entry) => [blogPostPath(entry.slug), entry]));
  const latestPostDate = blogPosts
    .map((entry) => entry.dateModified || entry.date)
    .sort()
    .at(-1);
  const entries = Object.entries(metadata)
    .filter(([, entry]) => !entry.robots.includes('noindex'))
    .map(([route]) => {
      const post = postByRoute.get(route);
      const lastmod = post?.dateModified || post?.date
        || (route === '/blog' ? latestPostDate : STATIC_LASTMOD[route])
        || '2026-08-18';
      return { route, lastmod, ...sitemapSettings(route) };
    });

  const urls = entries.map(({ route, lastmod, changefreq, priority }) => {
    const post = postByRoute.get(route);
    const image = post?.heroImage ? [
      '    <image:image>',
      `      <image:loc>${xmlEscape(absolute(postImagePath(post)))}</image:loc>`,
      `      <image:title>${xmlEscape(post.heroImage.alt)}</image:title>`,
      `      <image:caption>${xmlEscape(post.heroImage.caption)}</image:caption>`,
      '    </image:image>'
    ] : [];
    return [
      '  <url>',
      `    <loc>${xmlEscape(absolute(route))}</loc>`,
      `    <lastmod>${lastmod}</lastmod>`,
      `    <changefreq>${changefreq}</changefreq>`,
      `    <priority>${priority}</priority>`,
      ...image,
      '  </url>'
    ].join('\n');
  }).join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!-- Generated from src/lib/route-metadata.json and the shared blog registry. -->',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    urls,
    '</urlset>',
    ''
  ].join('\n');
};

const rssDate = (date) => new Date(`${date}T12:00:00.000Z`).toUTCString();

const buildFeed = () => {
  const items = blogPosts.map((entry) => {
    const route = blogPostPath(entry.slug);
    const imagePath = entry.heroImage ? postImagePath(entry) : DEFAULT_IMAGE;
    const imageFile = publicFileForUrl(imagePath);
    const imageLength = fs.statSync(imageFile).size;
    return [
      '    <item>',
      `      <title>${xmlEscape(entry.title)}</title>`,
      `      <link>${xmlEscape(absolute(route))}</link>`,
      `      <guid isPermaLink="true">${xmlEscape(absolute(route))}</guid>`,
      `      <pubDate>${rssDate(entry.date)}</pubDate>`,
      `      <description>${xmlEscape(entry.excerpt)}</description>`,
      `      <category>${xmlEscape(entry.tag)}</category>`,
      `      <enclosure url="${xmlEscape(absolute(imagePath))}" length="${imageLength}" type="image/png" />`,
      '    </item>'
    ].join('\n');
  }).join('\n');

  const latestDate = blogPosts.map((entry) => entry.dateModified || entry.date).sort().at(-1);
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    '    <title>PolyPDF Guides and Product Notes</title>',
    `    <link>${ORIGIN}/blog/</link>`,
    `    <atom:link href="${ORIGIN}/feed.xml" rel="self" type="application/rss+xml" />`,
    '    <description>Practical guides for measuring, reviewing, securing, and preparing PDF drawings with PolyPDF.</description>',
    '    <language>en-us</language>',
    `    <lastBuildDate>${rssDate(latestDate)}</lastBuildDate>`,
    items,
    '  </channel>',
    '</rss>',
    ''
  ].join('\n');
};

const markdownLink = (label, route) => `- [${label}](${absolute(route)})`;

const buildLlmsText = () => {
  const guideSlugs = new Set(guidePosts.map(({ slug }) => slug));
  const productLines = blogPosts
    .filter(({ slug }) => !guideSlugs.has(slug))
    .map((entry) => `${markdownLink(entry.title, blogPostPath(entry.slug))}: ${entry.excerpt}`);
  const guideLines = guidePosts.map((entry) =>
    `${markdownLink(entry.title, blogPostPath(entry.slug))}: ${entry.excerpt}`
  );

  return [
    '# PolyPDF',
    '',
    '> PolyPDF is a Mac and Windows desktop app for reviewing, measuring, and marking up PDF construction drawings. It is built for solo AEC professionals and sold without a recurring subscription.',
    '',
    'Key facts:',
    '',
    `- Current release: PolyPDF ${siteRelease.version} (build ${siteRelease.build}) for macOS and Windows; /versions reads the live update feeds.`,
    `- Free download: the Free edition includes markup, review, calibration, up to 3 hand-created measurements per document, and Revision Package viewing and navigation. ${commercialOffer.name} removes the measurement cap and unlocks Symbol Search, installed plugins, and Revision Package creation, changes, and publishing at the ${commercialOffer.price} Founder price instead of the planned ${commercialOffer.referencePrice} standard price, activates up to 3 computers in any Mac/Windows mix, and includes a ${commercialOffer.moneyBackGuaranteeDays}-day money-back guarantee for direct website purchases; /buy has the current terms.`,
    '- Core PDF opening, rendering, markup, measurement, takeoff, OCR, forms, signatures, and export work is performed locally on the computer.',
    '- The PDF Maps plugin requests map imagery over the internet. Other connections may be needed for optional signature timestamping, license activation and validation, updates and downloads, purchases, account access, diagnostics when opted in, and customer support.',
    '- Measurement and takeoff: page or region calibration, distance, area, perimeter, angle, radius, diameter, count, and dimension tools, plus a worksheet that exports Excel, CSV, or PDF.',
    '- Symbol Search auto-count (Pro): capture one drawing symbol, review candidate matches, and commit an auditable numbered count series.',
    '- Revision Packages (view and navigation in Free; changes and publication in Pro): import a drawing issue, reconcile sheets, carry reviewed work forward, inspect changes and available quantity or cost impact, review references, and publish a current package with a revision report.',
    '- Local AEC OCR: recover searchable text and current-session structure for schedules, title blocks, drawing labels, dimensions, and spreadsheet-ready tables. Recognition remains best-effort and requires review.',
    '- Tool Chest: built-in Doors, Windows, Fire Protection, and MUTCD sets, plus BTX, SVG, and DXF import.',
    '- Collaboration Beta: approved Mac and Windows users can exchange live markups, cursors, offline edits, and signed history through a customer-owned host while the PDF remains on the company share.',
    '- Markup and review: callouts, text, highlights, shapes, freehand, stamps, revision clouds, the Markup Table, and drawing-revision comparison.',
    '- Document tools: form filling and form building, CMS/PKCS#7 digital signatures, visual signatures, OCR, Bates numbering, headers and footers, watermarks, and preflight.',
    '- Pro plugins included with the app: AISC Steel Sections draws steel section profiles as vector geometry, Professional Seal Maker composes a seal graphic, and PDF Maps places a map image for an address or place name. AISC Steel Sections performs no capacity or design checks, and a seal graphic is drafting artwork rather than a cryptographic digital signature: PolyPDF does not check licensure or board compliance.',
    '- Redaction can remove text mapped to supported PDF text-show operators, but it is not fail-closed for every content type: vector or outlined content and some nested images can remain under a black fill. Sanitize Document cleans selected structures but can miss some direct attachments and nested actions. Independently inspect sensitive output and use an approved specialist workflow when complete removal matters.',
    '- Privacy: PDF content and measurement work stay on the computer unless the user exports or shares it, or invokes a connected feature.',
    '',
    '## Product',
    '',
    `${markdownLink('PolyPDF home', '/')}: product overview, current offer, and free Mac and Windows downloads`,
    `${markdownLink('PolyPDF for Windows', '/windows')}: system requirements and Windows download`,
    `${markdownLink('Buy PolyPDF Pro', '/buy')}: one-time license terms, Stripe checkout, and license delivery`,
    `${markdownLink('Version history', '/versions')}: live Mac and Windows release feeds`,
    '',
    '## Practical guides',
    '',
    ...guideLines,
    '',
    '## Workflow pages',
    '',
    `${markdownLink('PDF takeoff software', '/pdf-takeoff-software')}: calibrate, measure, organize, and export takeoff records`,
    `${markdownLink('Revision Packages', '/revision-packages')}: reconcile drawing issues, carry reviewed work forward, review impact and references, and publish a current package`,
    `${markdownLink('Measure a PDF on Mac', '/measure-pdf-on-mac')}: calibrated drawing measurement on macOS`,
    `${markdownLink('Construction PDF markup', '/construction-pdf-markup')}: markups and review-list workflow`,
    `${markdownLink('Symbol Search PDF counting', '/visual-search-pdf-count')}: capture, review, and commit repeated-symbol matches`,
    `${markdownLink('Compare PDF drawings', '/compare-pdf-drawings')}: inspect revision differences and create review markups`,
    '',
    '## Product notes',
    '',
    ...productLines,
    '',
    '## Support and policies',
    '',
    markdownLink('Support', '/support'),
    markdownLink('Feature requests', '/feature-requests'),
    markdownLink('Terms of use', '/terms'),
    markdownLink('Privacy policy', '/privacy'),
    markdownLink('Refund policy', '/refund'),
    ''
  ].join('\n');
};

const syncIndexShareImageToken = () => {
  const current = fs.readFileSync(indexTemplatePath, 'utf8');
  const next = current.replace(
    /\/og-image\.png\?v=[^"']+/g,
    `/og-image.png?v=${SCREENSHOT_IMAGE_VERSION}`
  );
  assert(next !== current || current.includes(`/og-image.png?v=${SCREENSHOT_IMAGE_VERSION}`),
    'public/index.html is missing the default Open Graph image');
  fs.writeFileSync(indexTemplatePath, next);
};

const writeDiscoveryFiles = () => {
  validatePosts();
  syncIndexShareImageToken();
  const metadata = buildRouteMetadata();
  fs.writeFileSync(routeMetadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
  fs.writeFileSync(sitemapPath, buildSitemap(metadata));
  fs.writeFileSync(llmsPath, buildLlmsText());
  fs.writeFileSync(feedPath, buildFeed());
  console.log(
    `Generated ${Object.keys(metadata).length} route records, ${guidePosts.length} guides, sitemap.xml, feed.xml and llms.txt.`
  );
};

if (require.main === module) writeDiscoveryFiles();

module.exports = {
  buildLlmsText,
  buildRouteMetadata,
  buildFeed,
  buildSitemap,
  validatePosts,
  syncIndexShareImageToken,
  writeDiscoveryFiles
};
