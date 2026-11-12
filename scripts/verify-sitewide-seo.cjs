#!/usr/bin/env node
'use strict';
// Verify the published page inventory, not a hand-picked URL sample.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const build = path.resolve(process.env.BUILD_PATH || 'build');
const origin = 'https://www.polypdf.com';
const metadata = require('../src/lib/route-metadata.json');
const xml = new JSDOM(fs.readFileSync(path.join(build, 'sitemap.xml'), 'utf8'), {contentType: 'text/xml'});
const urls = [...xml.window.document.querySelectorAll('url > loc')].map(n => n.textContent);
assert.equal(new Set(urls).size, urls.length, 'Sitemap URLs are unique');
xml.window.close();
const pages = new Map();
const fileFor = url => {
  const pathname = decodeURIComponent(new URL(url).pathname);
  const file = path.resolve(build, '.' + pathname, path.extname(pathname) ? '' : 'index.html');
  assert(file.startsWith(build + path.sep), 'Page stays inside build: ' + url);
  return file;
};
const clean = s => s?.replace(/\s+/g, ' ').trim();
async function main() {
  for (const url of urls) {
    assert.equal(new URL(url).origin, origin, 'Sitemap uses the production origin');
    const dom = new JSDOM(fs.readFileSync(fileFor(url), 'utf8'), {url});
    const d = dom.window.document;
    const meta = key => d.querySelector('meta[name="' + key + '"],meta[property="' + key + '"]')?.content;
    const title = d.title, description = meta('description'), h1 = [...d.querySelectorAll('h1')];
    assert(title.trim() && description?.trim(), 'Title and description: ' + url);
    assert.equal(h1.length, 1, 'One main heading: ' + url);
    assert(d.documentElement.lang, 'Document language: ' + url);
    assert.equal(d.querySelectorAll('link[rel="canonical"]').length, 1, 'One canonical: ' + url);
    assert.equal(d.querySelector('link[rel="canonical"]').href, url, 'Self canonical: ' + url);
    assert(!/\bnoindex\b/.test(meta('robots') || ''), 'Sitemap is indexable: ' + url);
    // Archived verification records retain their original bytes and publication policy.
    if (!new URL(url).pathname.startsWith('/samples/evaluation/')) {
      assert(meta('robots')?.includes('max-image-preview:large'), 'Large preview permission: ' + url);
    }
    for (const key of ['og:title', 'twitter:title']) if (meta(key)) assert.equal(meta(key), title, key + ': ' + url);
    for (const key of ['og:description', 'twitter:description']) if (meta(key)) assert.equal(meta(key), description, key + ': ' + url);
    if (meta('og:url')) assert.equal(meta('og:url'), url, 'Social URL: ' + url);
    if (meta('og:image')) {
      const image = new URL(meta('og:image'), origin);
      if (image.origin === origin) assert(fs.existsSync(path.join(build, decodeURIComponent(image.pathname))), 'Social image exists: ' + url);
      assert(meta('og:image:alt')?.trim(), 'Social image description: ' + url);
    }
    assert.equal(d.querySelectorAll('img:not([alt])').length, 0, 'Image alternatives: ' + url);
    const blocks = [...d.querySelectorAll('script[type="application/ld+json"]')].map(n => JSON.parse(n.textContent));
    for (const block of blocks) {
      if (['WebPage', 'CollectionPage'].includes(block['@type'])) {
        assert.equal(block.url, url, 'Structured page URL: ' + url);
        assert.equal(block.name, title, 'Structured page title: ' + url);
        assert.equal(block.description, description, 'Structured page description: ' + url);
      }
      if (block['@type'] === 'BlogPosting') {
        assert.equal(block.url, url, 'Article URL: ' + url);
        assert.equal(clean(block.headline), clean(h1[0].textContent), 'Article heading: ' + url);
        assert.equal(block.description, description, 'Article description: ' + url);
      }
    }
    const alts = [...d.querySelectorAll('link[hreflang]')].map(a => [a.hreflang, a.href]);
    assert.equal(new Set(alts.map(a => a[0])).size, alts.length, 'Unique language alternatives: ' + url);
    const cards = [...d.querySelectorAll('.blog-card-title a')].map(a => ({url:a.href, title:clean((a.querySelector('[data-guide-card-title]') || a).textContent)}));
    const guides = [...d.querySelectorAll('[data-drawing-guide]')].map(a => ({url:a.href, language:a.hreflang, title:clean(a.textContent)}));
    pages.set(url, {title, description, heading:clean(h1[0].textContent), language:d.documentElement.lang, alts, cards, guides});
    dom.window.close();
    await new Promise(setImmediate);
  }
  let alternatives = 0, cards = 0, guides = 0;
  for (const [url, page] of pages) {
    if (page.alts.length) {
      assert(page.alts.some(([lang, target]) => target === url && lang.toLowerCase() === page.language.toLowerCase()), 'Self language alternative: ' + url);
      assert(page.alts.some(([lang]) => lang === 'x-default'), 'Default language: ' + url);
      for (const [lang, target] of page.alts) {
        const sibling = pages.get(target);
        assert(sibling, 'Alternative is a canonical sitemap page: ' + target);
        if (lang !== 'x-default') assert.equal(sibling.language.toLowerCase(), lang.toLowerCase(), 'Alternative language: ' + target);
        assert.deepEqual([...sibling.alts].sort(), [...page.alts].sort(), 'Reciprocal alternatives: ' + url);
        alternatives++;
      }
    }
    for (const card of page.cards) {
      assert.equal(pages.get(card.url)?.heading, card.title, 'Guide index matches article: ' + card.url);
      cards++;
    }
    for (const guide of page.guides) {
      const article = pages.get(guide.url);
      assert(article, 'Drawing guide is an indexable article: ' + guide.url);
      assert.equal(article.language.toLowerCase(), guide.language.toLowerCase(), 'Drawing guide language: ' + guide.url);
      // Explicit English fallback may append a translated language label.
      assert(guide.title.startsWith(article.heading), 'Drawing guide uses the actual article title: ' + guide.url);
      guides++;
    }
  }
  // Account, checkout and error routes must not become indexable during shared-head edits.
  let excluded = 0;
  for (const [route, entry] of Object.entries(metadata)) if (entry.robots.includes('noindex')) {
    const url = origin + (route === '/' ? '/' : route + '/');
    assert(!pages.has(url), 'Noindex route excluded from sitemap: ' + route);
    const dom = new JSDOM(fs.readFileSync(fileFor(url), 'utf8'));
    assert(dom.window.document.querySelector('meta[name="robots"]').content.includes('noindex'), 'Noindex preserved: ' + route);
    dom.window.close();
    excluded++;
  }
  const result = {pages:pages.size, languageAlternatives:alternatives, matchingGuideCards:cards, contextualGuideLinks:guides, excludedRoutes:excluded};
  fs.mkdirSync('.tmp', {recursive:true});
  fs.writeFileSync('.tmp/sitewide-seo.json', JSON.stringify(result, null, 2) + '\n');
  console.log('Sitewide SEO verification passed: ' + JSON.stringify(result));
}
main().catch(error => {console.error(error); process.exitCode = 1;});
