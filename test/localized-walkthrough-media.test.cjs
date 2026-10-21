const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const crypto = require('node:crypto');
const { localizeWalkthroughMedia, localizeRegionalCopy, inventoryWalkthroughMedia, resolveAsset, needsLocalization, verifyMediaFiles } = require('../scripts/localization/media.cjs');
const locale = { id: 'de' };
const { translateDOM, translateFactory } = require('../scripts/international/content.cjs');
test('standalone regional copy needs no full-site catalog and rejects unbound prose', () => {
  const data = {locales:{it:{appLocale:'it-IT',region:'IT',assets:{},regionalText:{
    'exercise.workflow':{source:'Open the related workflow guide →',target:'Apri la guida correlata →'},
  }}}};
  const dom = new JSDOM('<a href="/guides/measure/"><span data-regional-copy="exercise.workflow">Open the related workflow guide →</span></a>');
  localizeRegionalCopy(dom.window.document,{id:'it'},data);
  translateDOM(dom.window.document.body,translateFactory({strings:{}}));
  assert.equal(dom.window.document.querySelector('a').textContent,'Apri la guida correlata →');
  assert.equal(dom.window.document.querySelector('a').getAttribute('href'),'/guides/measure/');
  const unbound = dom.window.document.createElement('p');
  unbound.textContent = 'This exercise text is not localized';
  dom.window.document.body.append(unbound);
  assert.throws(()=>translateDOM(dom.window.document.body,translateFactory({strings:{}})),/Missing translation: This exercise text is not localized/);
  dom.window.close();
});
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
test('regional previews replace obsolete units in alt text before ordinary translation', () => {
  const data = manifest();
  data.locales.de.assets['/guides/measure.png'].alt = 'Deutscher Plan mit 36,72 m² Nettofläche';
  const dom = new JSDOM('<img src="/guides/measure.png" alt="English plan with 408 sq ft">');
  localizeWalkthroughMedia(dom.window.document, locale, data);
  const { translateDOM } = require('../scripts/international/content.cjs');
  translateDOM(dom.window.document.body, source => { throw new Error(`Already regionalized: ${source}`); });
  assert.equal(dom.window.document.querySelector('img').alt, data.locales.de.assets['/guides/measure.png'].alt);
  data.locales.de.assets['/guides/measure.png'].alt = '';
  assert.throws(() => localizeWalkthroughMedia(new JSDOM('<img src="/guides/measure.png">').window.document, locale, data),
    /Invalid regional image description/);
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
for (const [id, filename] of [['de', '02-Architektur-Revision-A.pdf'], ['fr', '02-Architecture-Indice-A.pdf']]) {
test(`the checked-in ${id} regional library resolves exact verified PDF and preview bytes`, () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const root = path.resolve(__dirname, '..');
  const data = JSON.parse(fs.readFileSync(path.join(root, 'src/localization/walkthrough-media.json')));
  const registry = JSON.parse(fs.readFileSync(path.join(root, 'src/localization/product-locales.json'))).locales;
  verifyMediaFiles(data, registry, asset => {
    const sourcePath = data.locales[id].assets[asset]?.sourcePath;
    return fs.readFileSync(sourcePath ? path.join(root,sourcePath) : path.join(root,'public',asset));
  }, [id]);
  assert.equal(Object.keys(data.locales[id].assets).filter(asset => asset.startsWith('/samples/construction/') && asset.endsWith('.pdf')).length, 12);
  const source = '/samples/construction/02-Architectural-Revision-A.pdf';
  const preview = '/samples/construction/previews/02-Architectural-Revision-A--page-01.png';
  const dom = new JSDOM(`<a href="${source}">Plan</a><img src="${preview}" width="1440" height="960">`);
  localizeWalkthroughMedia(dom.window.document, { id }, data);
  assert.equal(dom.window.document.querySelector('a').getAttribute('href'),
    `/localized-media/${id}/samples/construction/${filename}`);
  assert.equal(dom.window.document.querySelector('img').getAttribute('height'), '1272');
  assert.equal(data.locales[id].status, 'pilot', 'Partial media coverage must not activate the whole language');
});
}
test('German form copy and downloads are reconciled without mislabelling an English or French file', () => {
  const data = require('../src/localization/walkthrough-media.json');
  const form = data.locales.de.regionalForm;
  const fixture = `<section data-regional-form>
    <p data-regional-form-description>English or French version</p>
    <ul><li data-regional-form-primary><a href="${form.primarySource}">English PDF</a></li>
    <li data-regional-form-alternative><a href="${form.alternativeSources[0]}">French PDF</a></li>
    <li data-regional-form-field-map><a href="${form.fieldMapSource}">Fields</a></li></ul>
    <p data-regional-form-evidence>Old evidence</p></section>`;
  const dom = new JSDOM(fixture);
  localizeWalkthroughMedia(dom.window.document, locale, data);
  const links = [...dom.window.document.querySelectorAll('a')];
  assert.equal(links.length, 2);
  assert.equal(links[0].textContent, 'Deutsches Übungsformular · PDF');
  assert.equal(links[0].getAttribute('href'), '/localized-media/de/samples/forms/construction-review-form-de.pdf');
  assert.equal(links[1].getAttribute('href'), '/localized-media/de/samples/forms/construction-review-field-map.csv');
  assert.equal(dom.window.document.querySelector('[data-regional-form-evidence]').textContent, form.evidence);
  assert.ok(!dom.window.document.body.textContent.includes('English'));
  assert.ok(!dom.window.document.body.textContent.includes('French'));
  const outside = new JSDOM(fixture + `<a href="${form.alternativeSources[0]}">Unrelated French form</a>`);
  assert.throws(() => localizeWalkthroughMedia(outside.window.document, locale, data), /Missing localized/);
  const changed = new JSDOM(fixture.replace(form.primarySource, '/samples/forms/new-form.pdf'));
  assert.throws(() => localizeWalkthroughMedia(changed.window.document, locale, data), /Changed regional form section/);
});
test('regional exercise text changes source quantities before translation and refuses stale instructions', () => {
  const data = require('../src/localization/walkthrough-media.json');
  const { translateDOM } = require('../scripts/international/content.cjs');
  const original = data.locales.de.regionalText['evaluation.dimensions'].source;
  const dom = new JSDOM('<li data-regional-copy="evaluation.dimensions"></li>');
  const item = dom.window.document.querySelector('li');
  item.textContent = original;
  localizeRegionalCopy(dom.window.document, locale, data);
  translateDOM(dom.window.document.body, () => { throw Error('Regional text must not be translated twice'); });
  assert.ok(item.textContent.includes('24 m') && item.textContent.includes('360 m²'));
  assert.ok(!item.textContent.includes('5,760'));
  assert.equal(item.getAttribute('lang'), 'de-DE');
  item.textContent = original.replace('96 ft', '100 ft');
  assert.throws(() => localizeRegionalCopy(dom.window.document, locale, data), /Stale regional/);
  item.setAttribute('data-regional-copy', 'evaluation.unknown');
  assert.throws(() => localizeRegionalCopy(dom.window.document, locale, data), /Missing regional/);
  assert.throws(() => resolveAsset('/samples/evaluation/local-build-1.6.14-76/willow-creek-a101-measured.pdf', locale, data), /Missing localized/,
    'Historical English app output cannot be represented as a new German capture');
});
test('German electrical table matches the regional drawing instead of retaining US subsets', () => {
  const fs = require('node:fs');
  const profile = require('../scripts/localization/regional-electrical-de.json');
  const data = manifest();
  data.locales.de.regionalTables = profile.tables;
  const component = fs.readFileSync(require.resolve('../src/components/ElectricalTakeoffEvaluation.js'), 'utf8');
  const source = component.match(/<table data-regional-table="electrical.counts">[\s\S]*?<\/table>/)[0];
  const dom = new JSDOM(source);
  localizeRegionalCopy(dom.window.document, locale, data);
  const table = dom.window.document.querySelector('table');
  const rows = [...table.querySelectorAll('tbody tr')];
  assert.equal(rows.length, 3);
  assert.deepEqual(rows.map(row => row.lastElementChild.textContent), ['24 Stück', '12 Stück', '8 Stück']);
  assert.equal(table.querySelectorAll('th[scope="row"]').length, 3);
  assert.equal(table.querySelectorAll('th[scope="col"]').length, 3);
  assert.equal(table.getAttribute('lang'), 'de-DE');
  assert.equal(table.getAttribute('translate'), 'no');
  assert.ok(!table.textContent.includes('GFCI') && !table.textContent.includes('Emergency'));
  assert.throws(() => localizeRegionalCopy(new JSDOM(source.replace('20 ea', '21 ea')).window.document, locale, data), /stale regional table/);
  assert.throws(() => localizeRegionalCopy(new JSDOM(source.replace('20 ea', '<input value="20">20 ea')).window.document, locale, data), /stale regional table/);
  const invalid = structuredClone(data);
  invalid.locales.de.regionalTables['electrical.counts'].target.rows[0].pop();
  assert.throws(() => localizeRegionalCopy(new JSDOM(source).window.document, locale, invalid), /Invalid regional table/);
  const escaped = structuredClone(data);
  escaped.locales.de.regionalTables['electrical.counts'].target.rows[0][0] = '<img src=x onerror=alert(1)>';
  const safe = new JSDOM(source);
  localizeRegionalCopy(safe.window.document, locale, escaped);
  assert.equal(safe.window.document.querySelector('img'), null, 'Regional table cells are plain text');
});

test('a completed form walkthrough can explain its own native derivative without changing other pages', () => {
  const data = manifest();
  data.locales.de.regionalForm={primarySource:'/samples/plan.pdf',fieldMapSource:'/samples/plan.pdf',alternativeSources:[],primaryLabel:'Vorlage',fieldMapLabel:'Feldnamen',description:'Standardvorlage',evidence:'Allgemeiner Nachweis'};
  const html='<section data-regional-form><p data-regional-form-description></p><p data-regional-form-evidence></p><div data-regional-form-primary><a href="/samples/plan.pdf">PDF</a></div><div data-regional-form-field-map><a href="/samples/plan.pdf">CSV</a></div></section>';
  const page={locale:'de-DE',region:'DE',regionalForm:{description:'Vorlage plus neues Listenfeld',evidence:'Native Speicherung geprüft'}};
  const specialized=new JSDOM(html).window.document;
  localizeWalkthroughMedia(specialized,locale,data,page);
  assert.equal(specialized.querySelector('[data-regional-form-evidence]').textContent,page.regionalForm.evidence);
  const ordinary=new JSDOM(html).window.document;
  localizeWalkthroughMedia(ordinary,locale,data);
  assert.equal(ordinary.querySelector('[data-regional-form-evidence]').textContent,'Allgemeiner Nachweis');
  for(const bad of [{...page,region:'US'},{...page,regionalForm:{...page.regionalForm,primarySource:'/unexpected.pdf'}},{...page,regionalForm:{description:''}}])assert.throws(()=>localizeWalkthroughMedia(new JSDOM(html).window.document,locale,data,bad),/Invalid page regional form copy/);
});
