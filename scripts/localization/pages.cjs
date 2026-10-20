'use strict';
const {assetPath,resolveAsset} = require('./media.cjs');
const normalize = value => value.replace(/\s+/g,' ').trim();

// A pilot can publish a fully reviewed route without claiming that its other routes are ready.
function localizedPage(manifest, locale, route) {
  const pack = manifest.locales[locale.id];
  const page = pack?.pages?.[route];
  if (!page || page.status !== 'complete') return null;
  if (page.locale !== pack.appLocale || page.region !== pack.region) throw new Error(`Wrong page locale: ${route}`);
  if (!page.evidence || !Array.isArray(page.elements) || !page.text) throw new Error(`Incomplete regional page: ${route}`);
  return page;
}

function pageTranslator(base, page) {
  const used = new Set();
  const translate = source => {
    const key = normalize(source);
    if (!page || !Object.hasOwn(page.text,key)) return base(source);
    const target = page.text[key];
    if (typeof target !== 'string' || !target.trim()) throw new Error(`Empty regional page text: ${key}`);
    used.add(key);
    return target;
  };
  translate.verify = () => {
    for (const key of Object.keys(page?.text || {})) if (!used.has(key)) throw new Error(`Stale regional page text: ${key}`);
  };
  return translate;
}

function localizePageElements(document, locale, page) {
  for (const entry of page?.elements || []) {
    const nodes = [...document.querySelectorAll(entry.selector)];
    if (nodes.length !== 1 || normalize(nodes[0].textContent) !== normalize(entry.source)) {
      throw new Error(`Stale regional page element: ${entry.selector}`);
    }
    if (typeof entry.target !== 'string' || !entry.target.trim()) throw new Error(`Empty regional page element: ${entry.selector}`);
    const node = nodes[0];
    if (node.querySelector('a,button,input,select')) throw new Error(`Interactive regional page element: ${entry.selector}`);
    node.textContent = entry.target;
    node.lang = locale.language;
    node.setAttribute('translate','no');
  }
}

// Article image metadata must use the same verified locale asset as its visible screenshot.
// Publisher logos/organization identities remain shared.
function localizeArticleImages(blocks, locale, manifest) {
  for (const block of blocks) {
    if (block['@type'] !== 'BlogPosting' || !block.image) continue;
    const replace = value => {
      if (typeof value === 'string') return new URL(resolveAsset(value,locale,manifest),'https://www.polypdf.com').href;
      if (Array.isArray(value)) return value.map(replace);
      if (value && typeof value === 'object') {
        const source = value.url || value.contentUrl;
        const record = manifest.locales[locale.id].assets[assetPath(source)];
        if (value.url) value.url = replace(value.url);
        if (value.contentUrl) value.contentUrl = replace(value.contentUrl);
        if (record?.width) value.width = record.width;
        if (record?.height) value.height = record.height;
      }
      return value;
    };
    block.image = replace(block.image);
  }
}
module.exports={localizedPage,pageTranslator,localizePageElements,localizeArticleImages};
