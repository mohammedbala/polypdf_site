const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const crypto = require('node:crypto');
const { localizeWalkthroughMedia, inventoryWalkthroughMedia, resolveAsset, needsLocalization, verifyMediaFiles } = require('../scripts/localization/media.cjs');
const locale = { id: 'de' };
function manifest() {
  const assets = {};
  for (const source of ['/guides/measure.png', '/guides/measure-large.webp', '/samples/plan.pdf', '/videos/measure.mp4', '/videos/measure.vtt']) {
    assets[source] = { url: '/localized-media/de' + source, locale: 'de-DE', region: 'DE',
      status: 'verified', sha256: 'a'.repeat(64), sourceSha256: 'b'.repeat(64), appBuild: 'candidate-1' };
  }
  return { locales: { de: { appLocale: 'de-DE', region: 'DE', assets } }, languageNeutralAssets: [] };
}
test('language selection changes every responsive screenshot, video and drawing download', () => {
  const dom = new JSDOM('<img src="/guides/measure.png" srcset="/guides/measure.png 768w, /guides/measure-large.webp 1536w"><video poster="/guides/measure.png"><source src="/videos/measure.mp4"><track src="/videos/measure.vtt"></video><a href="/samples/plan.pdf?v=2">PDF</a><img src="/brand.svg">');
  assert.equal(inventoryWalkthroughMedia(dom.window.document).length, 5);
  localizeWalkthroughMedia(dom.window.document, locale, manifest());
  const html = dom.window.document.body.innerHTML;
  assert.ok(html.includes('/localized-media/de/guides/measure-large.webp 1536w'));
  assert.ok(html.includes('/localized-media/de/samples/plan.pdf'));
  assert.ok(html.includes('/localized-media/de/videos/measure.vtt'));
  assert.ok(html.includes('src="/brand.svg"'));
});
test('missing, draft and wrong-region assets block localized publication', () => {
  assert.throws(() => resolveAsset('/samples/missing.pdf', locale, manifest()), /Missing/);
  const data = manifest();
  data.locales.de.assets['/samples/plan.pdf'].status = 'draft';
  assert.throws(() => resolveAsset('/samples/plan.pdf', locale, data), /Unverified/);
  data.locales.de.assets['/samples/plan.pdf'].region = 'US';
  assert.throws(() => resolveAsset('/samples/plan.pdf', locale, data), /Wrong language/);
});
test('regional drawings replace the original image aspect ratio as well as its URL', () => {
  const data = manifest();
  data.locales.de.assets['/guides/measure.png'].width = 1800;
  data.locales.de.assets['/guides/measure.png'].height = 1272;
  const dom = new JSDOM('<img src="/guides/measure.png" width="1440" height="960">');
  localizeWalkthroughMedia(dom.window.document, locale, data);
  assert.equal(dom.window.document.querySelector('img').getAttribute('width'), '1800');
  assert.equal(dom.window.document.querySelector('img').getAttribute('height'), '1272');
});
test('explicitly neutral assets and third-party links retain their URLs', () => {
  const data = manifest();
  data.languageNeutralAssets.push('/guides/neutral.png');
  assert.equal(resolveAsset('/guides/neutral.png', locale, data), '/guides/neutral.png');
  assert.equal(resolveAsset('https://example.com/plan.pdf', locale, data), 'https://example.com/plan.pdf');
});
test('screenshots and workflow posters outside guides are still subject to locale coverage', () => {
  assert.ok(needsLocalization('/images/workflows/takeoff.gif'));
  assert.ok(needsLocalization('/assets/screen.webp?v=84'));
  assert.ok(needsLocalization('/hero.png'));
  assert.equal(needsLocalization('/samples/'), false);
  assert.equal(needsLocalization('/guides/measure-a-plan/'), false);
  assert.throws(() => resolveAsset('/images/workflows/takeoff.webp', locale, manifest()), /Missing/);
});
test('source and translated file hashes must match before activating a media pack', () => {
  const data = manifest();
  const bytes = new Map();
  const hash = value => crypto.createHash('sha256').update(value).digest('hex');
  for (const [source, asset] of Object.entries(data.locales.de.assets)) {
    bytes.set(source, Buffer.from('source:' + source));
    bytes.set(asset.url, Buffer.from('translated:' + source));
    asset.sourceSha256 = hash(bytes.get(source));
    asset.sha256 = hash(bytes.get(asset.url));
  }
  const registry = [{ tag: 'de-DE', siteId: 'de', region: 'DE' }];
  const read = path => { assert.ok(bytes.has(path), `Missing file: ${path}`); return bytes.get(path); };
  assert.doesNotThrow(() => verifyMediaFiles(data, registry, read));
  bytes.set('/samples/plan.pdf', Buffer.from('new source revision'));
  assert.throws(() => verifyMediaFiles(data, registry, read), /Stale source/);
  data.locales.de.assets['/samples/plan.pdf'].sourceSha256 = hash(bytes.get('/samples/plan.pdf'));
  bytes.set('/localized-media/de/samples/plan.pdf', Buffer.from('changed translation'));
  assert.throws(() => verifyMediaFiles(data, registry, read), /Changed localized/);
  assert.throws(() => verifyMediaFiles(data, [{ ...registry[0], region: 'AT' }], read), /mismatched/);
});
test('the checked-in German regional library resolves exact verified PDF and preview bytes', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const root = path.resolve(__dirname, '..');
  const data = JSON.parse(fs.readFileSync(path.join(root, 'src/localization/walkthrough-media.json')));
  const registry = JSON.parse(fs.readFileSync(path.join(root, 'src/localization/product-locales.json'))).locales;
  verifyMediaFiles(data, registry, asset => fs.readFileSync(path.join(root, 'public', asset)), ['de']);
  assert.equal(Object.keys(data.locales.de.assets).filter(asset => asset.endsWith('.pdf')).length, 12);
  const source = '/samples/construction/02-Architectural-Revision-A.pdf';
  const preview = '/samples/construction/previews/02-Architectural-Revision-A--page-01.png';
  const dom = new JSDOM(`<a href="${source}">Plan</a><img src="${preview}" width="1440" height="960">`);
  localizeWalkthroughMedia(dom.window.document, locale, data);
  assert.equal(dom.window.document.querySelector('a').getAttribute('href'),
    '/localized-media/de/samples/construction/02-Architektur-Revision-A.pdf');
  assert.equal(dom.window.document.querySelector('img').getAttribute('height'), '1272');
  assert.equal(data.locales.de.status, 'pilot', 'Partial media coverage must not activate the whole language');
});
