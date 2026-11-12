'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const regional = require('./regional-guides.cjs');
const metadata = require('../../src/lib/route-metadata.json');
const titles = require('../../src/content/translations/editorial-titles.json');
const media = require('../../src/localization/walkthrough-media.json');
const { assetPath } = require('./media.cjs');
const root = path.resolve(__dirname, '../..');
const origin = 'https://www.polypdf.com';
const catalogs = new Map();
const englishOnly = require('../../src/lib/englishOnlyRoutes.json');
const { JSDOM } = require('jsdom');
function catalogFor(locale) {
  if (!catalogs.has(locale.id)) catalogs.set(locale.id, JSON.parse(fs.readFileSync(path.join(root, 'src/content/translations', locale.id + '.json'))));
  return catalogs.get(locale.id).strings;
}

function articleRoute(url) {
  return new URL(url, origin).pathname.replace(/^\/[a-z]{2}(?:-[a-z]{2})?(?=\/blog\/)/, '').replace(/\/+$/, '');
}
function articlePreview(locale, route, base = path.join(root, 'public')) {
  if (englishOnly.includes(route)) {
    const dom = new JSDOM(fs.readFileSync(path.join(base, route, 'index.html')));
    const d = dom.window.document;
    const preview = {title:d.querySelector('h1').textContent, description:d.querySelector('meta[name="description"]').content,
      english:true, englishLabel:catalogFor(locale).English};
    dom.window.close();
    return preview;
  }
  const title = titles[locale.id]?.[route]?.split('|')[0].trim();
  assert(title, 'Missing localized article title: ' + locale.id + route);
  const guide = regional.find(locale.id, route);
  if (guide) {
    const capture = regional.assets(guide, base).capture;
    return { title, description: guide.description, image: capture, alt: guide.caption,
      modified: '2026-11-12', modifiedLabel: guide.pack.labels.updated + ' ' + guide.pack.date };
  }
  const catalog = catalogFor(locale);
  const page = media.locales[locale.id]?.pages?.[route];
  const description = page?.text?.[metadata[route].description] || catalog[metadata[route].description];
  assert(description, 'Missing localized article description: ' + locale.id + route);
  // A completed regional article can expose its verified hero on the index too.
  // Keep historical dates; a refreshed index is not a new app verification.
  const image = page?.status === 'complete' && media.locales[locale.id].assets[assetPath(metadata[route].image)];
  return { title, description, ...(image ? { image: {...image, path: image.url || image.path || image.src}, alt: title } : {}) };
}
function localizeBlogIndex(document, locale, base) {
  for (const card of document.querySelectorAll('.blog-card')) {
    const link = card.querySelector('.blog-card-title a');
    assert(link);
    const preview = articlePreview(locale, articleRoute(link.getAttribute('href')), base);
    link.textContent = preview.title;
    if (preview.english) {
      const heading = document.createElement('span');
      heading.dataset.guideCardTitle = '';
      heading.textContent = preview.title;
      heading.lang = 'en';
      const label = document.createElement('small');
      label.textContent = ' (' + preview.englishLabel + ')';
      label.lang = locale.language;
      link.replaceChildren(heading, label);
      link.hreflang = 'en';
      link.lang = 'en';
    }
    const excerpt = card.querySelector('.blog-card-copy > p');
    excerpt.textContent = preview.description;
    excerpt.lang = preview.english ? 'en' : locale.language;
    const imageLink = card.querySelector('.blog-card-image-link');
    if (imageLink) {
      imageLink.setAttribute('aria-label', preview.title);
      imageLink.lang = preview.english ? 'en' : locale.language;
    }
    if (preview.image?.path) {
      const img = card.querySelector('img');
      assert(img, 'Guide card image exists');
      for (const source of card.querySelectorAll('picture source')) source.remove();
      img.src = preview.image.path;
      img.alt = preview.alt;
      img.width = preview.image.width;
      img.height = preview.image.height;
      img.removeAttribute('srcset');
      img.removeAttribute('sizes');
    }
    if (preview.modified) {
      const time = card.querySelector('time');
      time.dateTime = preview.modified;
      time.textContent = preview.modifiedLabel;
      card.querySelector('.blog-reading-time')?.remove();
    }
  }
}
function localizeBlogSchema(blocks, locale, base) {
  for (const block of blocks) if (block['@type'] === 'Blog') {
    for (const post of block.blogPost || []) {
      const preview = articlePreview(locale, articleRoute(post.url), base);
      post.headline = preview.title;
      post.description = preview.description;
      post.inLanguage = preview.english ? 'en' : locale.language;
      if (preview.image?.path) post.image = {
        '@type': 'ImageObject', url: origin + preview.image.path,
        width: preview.image.width, height: preview.image.height, caption: preview.alt
      };
      if (preview.modified) post.dateModified = preview.modified;
    }
  }
}
function verifyBlogIndex(document, locale, sourceDocument, base) {
  for (const card of document.querySelectorAll('.blog-card')) {
    const link = card.querySelector('.blog-card-title a');
    const route = articleRoute(link.getAttribute('href'));
    const preview = articlePreview(locale, route, base);
    assert.equal((link.querySelector('[data-guide-card-title]') || link).textContent, preview.title);
    assert.equal(card.querySelector('.blog-card-copy > p').textContent, preview.description);
    const sourceCard = [...sourceDocument.querySelectorAll('.blog-card')].find(c =>
      articleRoute(c.querySelector('.blog-card-title a').getAttribute('href')) === route);
    assert(sourceCard, 'Article is present in source index: ' + route);
    const img = card.querySelector('img'), original = sourceCard.querySelector('img');
    assert.equal(img?.getAttribute('src'), preview.image?.path || original?.getAttribute('src'), 'Index preview image: ' + route);
    if (preview.image?.path) {
      assert.equal(img.width, preview.image.width);
      assert.equal(img.height, preview.image.height);
      assert.equal(img.alt, preview.alt);
      assert.equal(card.querySelectorAll('picture source').length, 0, 'No English responsive image overrides regional preview');
    }
    if (preview.modified) assert.equal(card.querySelector('time').dateTime, preview.modified);
    else assert.equal(card.querySelector('time').dateTime, sourceCard.querySelector('time').dateTime, 'Historical date preserved');
  }
}
module.exports = { articleRoute, articlePreview, localizeBlogIndex, localizeBlogSchema, verifyBlogIndex };
