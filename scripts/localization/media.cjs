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

function localizeWalkthroughMedia(document, locale, manifest) {
  const form = manifest.locales[locale.id]?.regionalForm;
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

module.exports = { assetPath, needsLocalization, resolveAsset, localizeWalkthroughMedia, inventoryWalkthroughMedia, verifyMediaFiles };
