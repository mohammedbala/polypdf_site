'use strict';
const crypto = require('node:crypto');
const origin = 'https://www.polypdf.com';

function assetPath(value) {
  if (!value || /^(data:|blob:|#)/.test(value)) return null;
  const url = new URL(value, origin);
  if (url.origin !== origin) return null;
  return url.pathname;
}

function needsLocalization(value) {
  const path = assetPath(value);
  return Boolean(path && (
    /\/(?:guides|screenshots|samples|walkthrough|walkthroughs)\/.*\.[a-z0-9]+$/i.test(path)
    || /\.(?:pdf|zip|mp4|webm|vtt|png|jpe?g|webp|avif|gif)$/i.test(path)
    || /\/static\/media\/.*(?:shot|calibration|markup|takeoff|overlay|compare|signature|stamp|revis|count|ocr|drawing|scale|plugin)/i.test(path)
  ));
}

function resolveAsset(value, locale, manifest) {
  const source = assetPath(value);
  if (!source || !needsLocalization(value) || manifest.languageNeutralAssets.includes(source)) return value;
  const pack = manifest.locales[locale.id];
  const asset = pack?.assets[source];
  if (!asset) throw new Error(`Missing localized walkthrough asset: ${locale.id} ${source}`);
  if (asset.locale !== pack.appLocale || asset.region !== pack.region) {
    throw new Error(`Wrong language/region for walkthrough asset: ${locale.id} ${source}`);
  }
  if (asset.status !== 'verified' || !/^[a-f0-9]{64}$/.test(asset.sha256 || '')
      || !/^[a-f0-9]{64}$/.test(asset.sourceSha256 || '')
      || !asset.appBuild || !assetPath(asset.url) || asset.url === value
      || !assetPath(asset.url).startsWith(`/localized-media/${locale.id}/`)) {
    throw new Error(`Unverified localized walkthrough asset: ${locale.id} ${source}`);
  }
  return asset.url;
}

// Source images, responsive candidates, posters, videos, subtitles and PDF/ZIP downloads
// share one resolver. A translated caption cannot silently leave its screenshot in English.
function visitAssets(document, callback) {
  const fields = [
    ['img[src]', 'src'], ['img[srcset],source[srcset]', 'srcset'],
    ['video[poster]', 'poster'], ['video[src],source[src],track[src],iframe[src]', 'src'],
    ['a[href]', 'href']
  ];
  for (const [selector, attribute] of fields) {
    for (const node of document.querySelectorAll(selector)) {
      const raw = node.getAttribute(attribute);
      if (attribute === 'srcset') {
        if (raw.startsWith('data:')) continue;
        node.setAttribute(attribute, raw.split(',').map(candidate => {
          const [url, ...descriptor] = candidate.trim().split(/\s+/);
          return [callback(url), ...descriptor].join(' ');
        }).join(', '));
      } else node.setAttribute(attribute, callback(raw));
    }
  }
}

function localizeWalkthroughMedia(document, locale, manifest, page = null) {
  const baseForm = manifest.locales[locale.id]?.regionalForm;
  const override = page?.regionalForm;
  if (override && (!baseForm || page.locale !== manifest.locales[locale.id]?.appLocale
      || page.region !== manifest.locales[locale.id]?.region
      || Object.keys(override).some(key => !['description', 'evidence'].includes(key))
      || ['description', 'evidence'].some(key => typeof override[key] !== 'string' || !override[key].trim()))) {
    throw new Error(`Invalid page regional form copy: ${locale.id}`);
  }
  const form = baseForm && {...baseForm, ...override};
  if (form) {
    for (const section of document.querySelectorAll('[data-regional-form]')) {
      const primary = section.querySelector('[data-regional-form-primary] a[href]');
      const fieldMap = section.querySelector('[data-regional-form-field-map] a[href]');
      const description = section.querySelector('[data-regional-form-description]');
      const evidence = section.querySelector('[data-regional-form-evidence]');
      if (assetPath(primary?.getAttribute('href')) !== form.primarySource
          || assetPath(fieldMap?.getAttribute('href')) !== form.fieldMapSource
          || !description || !evidence) throw new Error(`Changed regional form section: ${locale.id}`);
      // Reconcile the authored download group before resolving its assets. An alternate
      // language elsewhere on the page still needs its own exact localized mapping.
      for (const item of section.querySelectorAll('[data-regional-form-alternative]')) {
        const source = assetPath(item.querySelector('a[href]')?.getAttribute('href'));
        if (!form.alternativeSources.includes(source)) throw new Error(`Unknown regional form alternative: ${source}`);
        item.remove();
      }
      primary.textContent = form.primaryLabel;
      fieldMap.textContent = form.fieldMapLabel;
      description.textContent = form.description;
      evidence.textContent = form.evidence;
    }
  }
  visitAssets(document, value => resolveAsset(value, locale, manifest));
  const byUrl = new Map(Object.values(manifest.locales[locale.id]?.assets || {}).map(asset => [asset.url, asset]));
  for (const image of document.querySelectorAll('img[src]')) {
    const asset = byUrl.get(image.getAttribute('src'));
    if (asset && Number.isInteger(asset.width) && asset.width > 0
        && Number.isInteger(asset.height) && asset.height > 0) {
      image.setAttribute('width', String(asset.width));
      image.setAttribute('height', String(asset.height));
    }
    if (asset?.alt !== undefined) {
      if (typeof asset.alt !== 'string' || !asset.alt.trim()) throw new Error(`Invalid regional image description: ${locale.id}`);
      image.setAttribute('alt', asset.alt);
      image.setAttribute('lang', asset.locale);
      image.setAttribute('translate', 'no');
    }
  }
}

// Run on original authored copy before ordinary translation. Region-specific examples
// change the exercise itself (units, quantities and source project), so a translation of
// the old US instructions cannot substitute for these source-bound replacements.
function localizeRegionalCopy(document, locale, manifest, page = null) {
  const pack = manifest.locales[locale.id];
  const normalize = text => text.replace(/\s+/g, ' ').trim();
  if (page && (page.locale !== pack?.appLocale || page.region !== pack?.region)) {
    throw new Error(`Wrong regional copy page locale: ${locale.id}`);
  }
  // Regional previews can introduce descriptions absent from the ordinary translation
  // catalog. Reserve them before translateDOM; the same verified asset resolves later.
  for (const image of document.querySelectorAll('img[src]')) {
    const asset = pack?.assets?.[assetPath(image.getAttribute('src'))];
    if (asset?.alt === undefined) continue;
    resolveAsset(image.getAttribute('src'), locale, manifest);
    if (typeof asset.alt !== 'string' || !asset.alt.trim()) throw new Error(`Invalid regional image description: ${locale.id}`);
    if (page?.text && Object.hasOwn(page.text, normalize(image.getAttribute('alt') || ''))) continue;
    image.setAttribute('alt', asset.alt);
    image.setAttribute('lang', asset.locale);
    image.setAttribute('translate', 'no');
  }
  for (const node of document.querySelectorAll('[data-regional-copy]')) {
    const key = node.getAttribute('data-regional-copy');
    const copy = pack?.regionalText?.[key];
    if (!copy || typeof copy.source !== 'string' || typeof copy.target !== 'string' || !copy.target.trim()) {
      throw new Error(`Missing regional exercise copy: ${locale.id} ${key}`);
    }
    // A verified guide can use a different fixture from the shared library. Its exact
    // element override has already run; preserve it only if both sources still agree.
    const element = page?.elements?.find(entry => document.querySelector(entry.selector) === node);
    if (element) {
      if (node.children.length || normalize(element.source) !== normalize(copy.source)
          || node.textContent !== element.target || node.getAttribute('translate') !== 'no') {
        throw new Error(`Stale regional page exercise copy: ${locale.id} ${key}`);
      }
      continue;
    }
    if (node.children.length || normalize(node.textContent) !== normalize(copy.source)) {
      throw new Error(`Stale regional exercise copy: ${locale.id} ${key}`);
    }
    // Leave contextual prose to pageTranslator so its unused-source check remains active.
    if (page?.text && Object.hasOwn(page.text, normalize(copy.source))) continue;
    node.textContent = copy.target;
    node.setAttribute('translate', 'no');
    node.setAttribute('lang', pack.appLocale);
  }
  for (const table of document.querySelectorAll('[data-regional-table]')) {
    const key = table.getAttribute('data-regional-table');
    const record = pack?.regionalTables?.[key];
    const tableData = {
      caption: normalize(table.querySelector('caption')?.textContent || ''),
      headers: [...table.querySelectorAll('thead th')].map(cell => normalize(cell.textContent)),
      rows: [...table.querySelectorAll('tbody tr')].map(row => [...row.children].map(cell => normalize(cell.textContent)))
    };
    if (!record || JSON.stringify(tableData) !== JSON.stringify(record.source)
        || table.querySelector('a, button, input, select, img, svg')) {
      throw new Error(`Missing or stale regional table: ${locale.id} ${key}`);
    }
    const target = record.target;
    const strings = value => Array.isArray(value) && value.length > 0
      && value.every(text => typeof text === 'string' && text.trim());
    if (!target || typeof target.caption !== 'string' || !target.caption.trim()
        || !strings(target.headers) || !Array.isArray(target.rows) || !target.rows.length
        || target.rows.some(row => !strings(row) || row.length !== target.headers.length)) {
      throw new Error(`Invalid regional table: ${locale.id} ${key}`);
    }
    table.replaceChildren();
    const append = (parent, tag, text, scope) => {
      const node = document.createElement(tag);
      if (text !== undefined) node.textContent = text;
      if (scope) node.setAttribute('scope', scope);
      parent.appendChild(node);
      return node;
    };
    append(table, 'caption', target.caption);
    const head = append(append(table, 'thead'), 'tr');
    target.headers.forEach(text => append(head, 'th', text, 'col'));
    const body = append(table, 'tbody');
    target.rows.forEach(values => {
      const row = append(body, 'tr');
      values.forEach((text, index) => append(row, index ? 'td' : 'th', text, index ? undefined : 'row'));
    });
    table.setAttribute('translate', 'no');
    table.setAttribute('lang', pack.appLocale);
  }
}

function inventoryWalkthroughMedia(document) {
  const paths = new Set();
  visitAssets(document, value => {
    if (needsLocalization(value)) paths.add(assetPath(value));
    return value;
  });
  return [...paths].sort();
}

// A manifest claim alone is insufficient. Check both source and localized bytes before a
// build can activate a locale pack. Changed source screenshots invalidate their translations.
function verifyMediaFiles(manifest, productLocales, readAsset, localeIds = Object.keys(manifest.locales)) {
  const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
  for (const id of localeIds) {
    const pack = manifest.locales[id];
    const product = productLocales.find(locale => locale.siteId === id);
    if (!pack || !product || pack.appLocale !== product.tag || pack.region !== product.region) {
      throw new Error(`Unknown or mismatched product locale: ${id}`);
    }
    if (pack.regionalForm) {
      const form = pack.regionalForm;
      if (!Array.isArray(form.alternativeSources)
          || ['primaryLabel', 'fieldMapLabel', 'description', 'evidence'].some(key => typeof form[key] !== 'string' || !form[key].trim())
          || !pack.assets[form.primarySource] || !pack.assets[form.fieldMapSource]) {
        throw new Error(`Incomplete regional form content: ${id}`);
      }
    }
    for (const [source, asset] of Object.entries(pack.assets)) {
      resolveAsset(source, { id }, manifest);
      if (digest(readAsset(source)) !== asset.sourceSha256) throw new Error(`Stale source asset: ${id} ${source}`);
      if (digest(readAsset(asset.url)) !== asset.sha256) throw new Error(`Changed localized asset: ${id} ${asset.url}`);
    }
  }
}

module.exports = { assetPath, needsLocalization, resolveAsset, localizeWalkthroughMedia, localizeRegionalCopy, inventoryWalkthroughMedia, verifyMediaFiles };
