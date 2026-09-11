'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const root = path.resolve(__dirname, '../..');
const metadata = require('../../src/lib/route-metadata.json');
const siteRelease = require('../../src/lib/siteRelease.json');
const locales = require('../../src/lib/locales.json');
const englishOnly = require('../../src/lib/englishOnlyRoutes.json');
const ORIGIN = 'https://www.polypdf.com';
const routes = Object.keys(metadata).filter((r) => !englishOnly.includes(r) && !metadata[r].robots.includes('noindex'));
const normalize = (s) => s.replace(/\s+/g, ' ').trim();
const esc = (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const routePath = (route) => route === '/' ? '/' : `${route.replace(/\/+$/, '')}/`;
const localizedPath = (id, route) => `/${id}${routePath(route)}`;
const fileFor = (build, route) => path.join(build, route.slice(1), 'index.html');
const sourceStrings = new Set();
const isTranslatable = (s) => /[a-zA-Z]{2}/.test(s) && !/^(?:https?:\/\/|mailto:|[^\s@]+@)/.test(s) && !/^(?:PolyPDF(?: Pro| Free)?(?: [\d.]+)?|macOS|Windows(?: 10(?:\/11)?| 11)?|Mac|PDF|CSV|OCR|AISC|RFI|BIM|CAD|USD|DMG|PNG|JPEG|SHA-256|AcroForm|JavaScript|Node\.js)$/i.test(s);
const notice = 'Translated from the English edition. Screenshots and app control names may remain in English. Original example units and verification dates are preserved. Prices are in USD; checkout, account, release feeds, and policies are in English.';
const humanSchemaKeys = new Set(['name','headline','description','caption','articleSection','keywords','text','featureList']);
const skipSchemaTypes = new Set(['Organization','ContactPoint']);
function mapSchema(value, translate, locale, parentKey = '') {
  if (Array.isArray(value)) return value.map((v) => mapSchema(v, translate, locale, parentKey));
  if (value && typeof value === 'object') {
    if (skipSchemaTypes.has(value['@type'])) return value;
    return Object.fromEntries(Object.entries(value).map(([key, v]) => [key, mapSchema(v, translate, locale, key)]));
  }
  if (typeof value !== 'string') return value;
  if (parentKey === 'inLanguage') return locale?.language || value;
  if (humanSchemaKeys.has(parentKey)) return translate(value);
  if (locale && ['url','item','mainEntityOfPage'].includes(parentKey) && value.startsWith(ORIGIN)) {
    const url = new URL(value); const route = url.pathname.replace(/\/+$/, '') || '/';
    if (routes.includes(route)) return `${ORIGIN}${localizedPath(locale.id, route)}${url.hash}`;
  }
  return value;
}
function translateDOM(element, translate) {
  // Join React's adjacent text fragments before translating complete sentences.
  const document = element.ownerDocument;
  const comments = document.createTreeWalker(element, 128);
  const toRemove = []; while (comments.nextNode()) toRemove.push(comments.currentNode);
  toRemove.forEach((n) => n.remove()); element.normalize();
  const walker = document.createTreeWalker(element, 4);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.parentElement?.closest('script,style,pre,code,svg,[translate="no"],[data-language-options]')) continue;
    if (!normalize(node.textContent)) continue;
    const leading = /^\s/.test(node.textContent) ? ' ' : '';
    const trailing = /\s$/.test(node.textContent) ? ' ' : '';
    node.textContent = leading + translate(normalize(node.textContent)) + trailing;
  }
  for (const node of element.querySelectorAll('[alt],[title],[aria-label]')) {
    for (const attr of ['alt','title','aria-label']) {
      if (node.hasAttribute(attr) && node.getAttribute(attr)) node.setAttribute(attr, translate(node.getAttribute(attr)));
    }
  }
}
function translateFactory(catalog, collect = false) {
  return (raw) => {
    const source = normalize(raw);
    if (!isTranslatable(source)) return source;
    sourceStrings.add(source);
    if (collect) return source;
    const translated = catalog?.strings?.[source];
    if (typeof translated !== 'string' || !translated.trim()) throw new Error(`Missing translation: ${source.slice(0,180)}`);
    return translated;
  };
}
function languageNavigation(route, locale, t) {
  const current = locale?.label || 'English';
  const entries = [{id:'en',language:'en',label:'English'},...locales];
  return `<div class="site-language-bar"><div class="container"><details class="language-selector"><summary>${esc(t('Languages'))} · ${current}</summary><nav class="language-options" data-language-options aria-label="${esc(t('Choose a language'))}">${entries.map((l) => `<a href="${l.id === 'en' ? routePath(route) : localizedPath(l.id,route)}" hreflang="${l.language}" lang="${l.language}" dir="${l.dir || 'ltr'}"${l.id === (locale?.id || 'en') ? ' aria-current="page"' : ''}>${l.label}</a>`).join('')}</nav></details></div></div>`;
}
function alternatives(route) {
  return [{language:'en',href:ORIGIN+routePath(route)},...locales.map((l)=>({language:l.language,href:ORIGIN+localizedPath(l.id,route)})),{language:'x-default',href:ORIGIN+routePath(route)}];
}
function hubHTML() {
  const list = (selected) => `<ul class="hub-links">${selected.map((route)=>`<li><a href="${routePath(route)}"><strong>${esc(metadata[route].title.replace(/ \| PolyPDF(?: Guide)?$/,''))}</strong><span>${esc(metadata[route].description)}</span></a></li>`).join('')}</ul>`;
  return `<header class="legal-header"><nav class="nav container" aria-label="Main navigation"><a href="/" class="logo">PolyPDF</a><a href="/blog/" class="back-link">All guides</a></nav></header><main class="international-hub" id="site-content">
<p>PolyPDF ${siteRelease.version} (build ${siteRelease.build}) · Mac &amp; Windows</p><p>PDF tools for construction teams</p><h1>Measure and review construction drawings in PDF</h1>
<p>PolyPDF helps estimators, contractors, architects, and engineers calibrate drawing scale, measure quantities, count symbols, compare revisions, and coordinate PDF markups on Mac and Windows.</p>
<div class="blog-quick-answer"><h2>How do you take quantities from a PDF plan?</h2><p>Calibrate the drawing using a known dimension, verify a second dimension, then measure lengths and net areas and count repeated symbols. Keep the drawing revision, measurement units, and exclusions with the result. Export the reviewed takeoff to CSV or PDF.</p></div>
<div id="download" class="dl-both"><a class="primary-btn" href="/downloads/PolyPDFMac.dmg" download>Download for macOS</a><a class="primary-btn" href="/downloads/windows/PolyPDFSetup.exe" download>Download for Windows</a></div>
<p>macOS 14 or newer, Apple silicon and Intel; Windows 10 or 11, 64-bit. Start free with markup, review, calibration, and up to 3 hand-created measurements per document. Unlimited measurements, Symbol Search, plugins, and Revision Package changes or publishing require Pro.</p>
<p><a href="/buy/?source=international_hub">View current Pro pricing and license terms</a></p>
<h2>What is new in PolyPDF ${siteRelease.version}?</h2><p>Highlights keep drawing details visible, arc handles separate radius from sweep, area cutouts can be moved and resized, and estimates scroll more reliably. Windows file-opening checks remove an unnecessary file operation.</p><p><a href="/blog/polypdf-1-5-4/">Explore the 1.5.4 update</a></p>
<h2>Using metric construction drawings</h2><p>Choose the units shown on the drawing and calibrate from a known dimension. For a 1:100 drawing, 10 mm on the correctly sized page represents 1 m on site. A 5 m by 4 m rectangle has an area of 20 m²; subtract a 1 m² opening to obtain 19 m² net. At a depth of 0.15 m, that net area corresponds to 2.85 m³. Check a second known dimension before using any quantity in an estimate.</p>
<p>Do not mix paper dimensions with site dimensions, metres with millimetres, or net quantities with waste allowances. Original guide screenshots may use feet and inches; preserve those units when following the example. Confirm project specifications and local measurement rules separately.</p>
<h2>Construction workflows</h2>${list(routes.filter((r)=>['/pdf-takeoff-software','/measure-pdf-on-mac','/construction-pdf-markup','/visual-search-pdf-count','/compare-pdf-drawings','/revision-packages'].includes(r)))}
<h2>All guides and product articles</h2>${list(routes.filter((r)=>r.startsWith('/blog/')))}
<h2>Help getting started</h2><p><a href="/support/">Installation, licensing, and product support</a> · <a href="/build-a-plugin/">Build a plugin</a> · <a href="/windows/">PolyPDF for Windows</a></p>
</main>`;
}
const hubMetadata = {
  title: 'PDF Measurement & Construction Takeoff Guides | PolyPDF',
  description: 'Measure construction PDFs, calculate quantities, compare drawing revisions, and review markups. Localized PolyPDF guides for estimators, contractors, architects, and engineers.',
  robots: 'index, follow',
};
function sourcePage(build, route) {
  const dom = new JSDOM(fs.readFileSync(fileFor(build,route),'utf8'));
  const d = dom.window.document;
  const content = route === '/' ? hubHTML() : d.querySelector('#site-content').innerHTML;
  const footer = d.querySelector('[data-site-footer]')?.cloneNode(true);
  if (!footer) throw new Error(`Missing footer: ${route}`);
  // These control English app preferences. The localized reading pages use native HTML and
  // run no tracking or app scripts; do not leave inert controls behind.
  footer.querySelectorAll('button').forEach((n)=>n.remove());
  const body = `<div class="App"><a class="site-skip-link" href="#${route === '/' ? 'site-content' : 'localized-content'}">Skip to content</a><div data-language-slot></div><div id="localized-content" tabindex="-1">${content}</div><aside class="translation-note">${notice} <a href="${routePath(route)}" data-english-original>Read the English edition</a></aside>${footer.outerHTML}</div>`;
  const bodyDom = new JSDOM(body);
  const schema = [...d.querySelectorAll('script[type="application/ld+json"]')].map((s)=>JSON.parse(s.textContent));
  const assets = [...d.head.querySelectorAll('link[rel="stylesheet"],link[rel="preload"][as="font"]')].map((el)=>el.outerHTML).join('');
  dom.window.close();
  return {dom:bodyDom, assets, schema:route === '/' ? [] : schema, meta:route === '/' ? hubMetadata : metadata[route]};
}
function localizeLinks(document, locale, t) {
  for (const a of document.querySelectorAll('a[href]')) {
    const raw = a.getAttribute('href');
    if (a.hasAttribute('data-english-original') || a.closest('[data-language-options]')) continue;
    if (!raw || raw.startsWith('#')) continue;
    const url = new URL(raw, ORIGIN);
    if (url.origin !== ORIGIN || !['http:','https:'].includes(url.protocol)) continue;
    const route = url.pathname.replace(/\/+$/, '') || '/';
    if (routes.includes(route)) a.href = `${localizedPath(locale.id,route)}${url.search}${url.hash}`;
    else if (englishOnly.includes(route)) {
      if (['/buy','/upgrade'].includes(route)) {
        const placement = url.searchParams.get('source') || 'content';
        url.searchParams.set('source', `intl_${locale.id}_${placement}`.slice(0,80));
        a.setAttribute('href', `${url.pathname}${url.search}${url.hash}`);
      }
      a.setAttribute('hreflang','en');
      const span = document.createElement('span'); span.textContent = ` (${t('English')})`; a.appendChild(span);
      a.title = t('This page is in English');
    }
  }
}
module.exports = {root,metadata,locales,routes,ORIGIN,normalize,esc,routePath,localizedPath,fileFor,sourceStrings,isTranslatable,mapSchema,translateDOM,translateFactory,languageNavigation,alternatives,sourcePage,localizeLinks};
