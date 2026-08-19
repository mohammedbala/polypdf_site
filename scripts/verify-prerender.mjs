#!/usr/bin/env node
// Build gate for the static rendering step: every public route's built index.html must contain
// real body markup (not CRA's empty shell) and parseable JSON-LD. Runs at the end of `npm run
// build` so a droplet build can never ship crawler-empty pages again without failing loudly.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const buildDirectory = path.resolve(root, process.env.BUILD_PATH || 'build');
const routeMetadata = JSON.parse(fs.readFileSync(path.join(root, 'src/lib/route-metadata.json'), 'utf8'));
const origin = 'https://www.polypdf.com';
const defaultImageAlt =
  'PolyPDF — measure and mark up PDF drawings on Mac and Windows, no subscription';

const escapeHTML = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('"', '&quot;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

for (const [route, metadata] of Object.entries(routeMetadata)) {
  const htmlPath = route === '/'
    ? path.join(buildDirectory, 'index.html')
    : path.join(buildDirectory, route.slice(1), 'index.html');
  if (!fs.existsSync(htmlPath)) {
    failures.push(`${route}: built index.html is missing`);
    continue;
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  const imageURL = new URL(metadata.image || '/og-image.png', `${origin}/`).href;
  const imageAlt = escapeHTML(metadata.imageAlt || defaultImageAlt);

  assert(!html.includes('<div id="root"></div>'), `${route}: #root is empty — prerender did not run`);
  const rootStart = html.indexOf('<div id="root">');
  assert(rootStart !== -1, `${route}: #root container is missing`);
  const body = rootStart === -1 ? '' : html.slice(rootStart);
  assert(body.length > 2000, `${route}: prerendered body is implausibly small (${body.length} bytes)`);
  assert(html.includes('<link rel="canonical"'), `${route}: canonical link is missing`);
  assert(html.includes('<link rel="alternate" type="application/rss+xml"'), `${route}: RSS discovery link is missing`);
  assert(html.includes(`<meta property="og:type" content="${metadata.type || 'website'}"`), `${route}: og:type is wrong`);
  assert(html.includes(`<meta property="og:image" content="${imageURL}"`), `${route}: og:image is wrong`);
  assert(html.includes(`<meta property="og:image:alt" content="${imageAlt}"`), `${route}: og:image:alt is wrong`);
  assert(html.includes(`<meta name="twitter:image" content="${imageURL}"`), `${route}: twitter:image is wrong`);
  assert(html.includes(`<meta name="twitter:image:alt" content="${imageAlt}"`), `${route}: twitter:image:alt is wrong`);
  assert((body.match(/data-site-footer="true"/g) || []).length === 1, `${route}: canonical footer is missing or duplicated`);
  for (const footerPath of [
    '/pdf-takeoff-software',
    '/measure-pdf-on-mac',
    '/construction-pdf-markup',
    '/visual-search-pdf-count',
    '/compare-pdf-drawings'
  ]) {
    assert(body.includes(`href="${footerPath}"`), `${route}: footer is missing ${footerPath}`);
  }

  const indexable = !metadata.robots.includes('noindex');
  if (indexable) {
    assert(/<h1[\s>]/.test(body), `${route}: prerendered body has no <h1>`);
  }

  const jsonLdBlocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)];
  const parsedBlocks = [];
  for (const [, raw] of jsonLdBlocks) {
    try {
      const parsed = JSON.parse(raw);
      parsedBlocks.push(parsed);
      assert(parsed['@context'] === 'https://schema.org', `${route}: JSON-LD block lacks schema.org @context`);
      assert(typeof parsed['@type'] === 'string', `${route}: JSON-LD block lacks @type`);
      assert(parsed['@type'] !== 'FAQPage', `${route}: retired FAQPage JSON-LD is still emitted`);
    } catch (error) {
      failures.push(`${route}: JSON-LD block does not parse (${error.message})`);
    }
  }

  if (metadata.type === 'article') {
    const article = parsedBlocks.find((entry) => entry['@type'] === 'BlogPosting');
    assert(article, `${route}: BlogPosting JSON-LD is missing`);
    if (article) {
      assert(article.image?.url === imageURL, `${route}: BlogPosting image does not match route metadata`);
      assert(/^\d{4}-\d{2}-\d{2}$/.test(article.datePublished || ''), `${route}: datePublished is invalid`);
      assert(/^\d{4}-\d{2}-\d{2}$/.test(article.dateModified || ''), `${route}: dateModified is invalid`);
      assert(article.author?.url === `${origin}/`, `${route}: author URL is missing`);
      assert(article.isAccessibleForFree === true, `${route}: isAccessibleForFree is missing`);
      assert(typeof article.keywords === 'string' && article.keywords.length > 0, `${route}: keywords are missing`);
      assert(Array.isArray(article.about) && article.about.length > 0, `${route}: about topics are missing`);
    }
    if (metadata.image?.startsWith('/guides/')) {
      const imagePath = path.join(buildDirectory, metadata.image.slice(1));
      assert(fs.existsSync(imagePath), `${route}: public guide share image is missing`);
      if (fs.existsSync(imagePath)) {
        assert(fs.statSync(imagePath).size > 0, `${route}: public guide share image is empty`);
      }
    }
  }
}

for (const discoveryFile of ['sitemap.xml', 'llms.txt', 'feed.xml', 'robots.txt']) {
  assert(fs.existsSync(path.join(buildDirectory, discoveryFile)), `${discoveryFile}: discovery file is missing`);
}

const sitemap = fs.existsSync(path.join(buildDirectory, 'sitemap.xml'))
  ? fs.readFileSync(path.join(buildDirectory, 'sitemap.xml'), 'utf8')
  : '';
const llms = fs.existsSync(path.join(buildDirectory, 'llms.txt'))
  ? fs.readFileSync(path.join(buildDirectory, 'llms.txt'), 'utf8')
  : '';
const feed = fs.existsSync(path.join(buildDirectory, 'feed.xml'))
  ? fs.readFileSync(path.join(buildDirectory, 'feed.xml'), 'utf8')
  : '';

for (const [route, metadata] of Object.entries(routeMetadata)) {
  if (metadata.type !== 'article') continue;
  const url = `${origin}${route}`;
  assert(sitemap.includes(`<loc>${url}</loc>`), `sitemap.xml: missing ${route}`);
  assert(llms.includes(`(${url})`), `llms.txt: missing ${route}`);
  assert(feed.includes(`<link>${url}</link>`), `feed.xml: missing ${route}`);
  if (metadata.image?.startsWith('/guides/')) {
    assert(
      sitemap.includes(`<image:loc>${origin}${metadata.image}</image:loc>`),
      `sitemap.xml: missing image for ${route}`
    );
  }
}

if (failures.length > 0) {
  console.error('Prerender verification failed:');
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log(`Verified prerendered markup and JSON-LD for ${Object.keys(routeMetadata).length} routes.`);
