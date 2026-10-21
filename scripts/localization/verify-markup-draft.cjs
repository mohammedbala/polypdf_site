'use strict';
// Checks the unpublished draft against the actual English prerender and app terminology.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const c = require('../international/content.cjs');
const {localizedPage, pageTranslator, localizePageElements} = require('./pages.cjs');
const root = path.resolve(__dirname, '../..');
const read = name => fs.readFileSync(path.join(root, name));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const app = process.env.POLYPDF_APP_ROOT;
assert.ok(app, 'Set POLYPDF_APP_ROOT to the isolated app workspace');
const route = '/blog/pdf-markup-table-rfi-punch-list';
const profilePath = 'scripts/localization/markup-de.draft.json';
const profile = JSON.parse(read(profilePath));
const manifest = JSON.parse(read('src/localization/walkthrough-media.json'));
const locale = c.locales.find(item => item.id === 'de');
assert.equal(profile.status, 'draft');
assert.equal(profile.locale, 'de-DE');
assert.equal(profile.region, 'DE');
assert.equal(manifest.locales.de.pages[route], undefined, 'Draft must not activate a public route');
const candidate = structuredClone(manifest);
candidate.locales.de.pages[route] = profile;
assert.equal(localizedPage(candidate, locale, route), null, 'A draft cannot enable regional media');
const {dom, schema, meta} = c.sourcePage(path.join(root, 'build'), route);
const document = dom.window.document;
const translate = pageTranslator(source => source, profile);
localizePageElements(document, locale, profile);
c.translateDOM(document.body, translate);
c.mapSchema(schema, translate, locale);
for (const value of [meta.title, meta.description, meta.imageAlt]) translate(value);
translate.verify();
const sourcePath = 'public/localized-media/de/samples/markup/source-verification.json';
const source = JSON.parse(read(sourcePath));
assert.equal(source.status, 'passed');
assert.equal(source.locale, profile.locale);
assert.equal(source.region, profile.region);
assert.equal(hash(read('public/localized-media/de/samples/markup/' + source.file)), source.sha256);
assert.equal(hash(read('public/localized-media/de/samples/construction/' + source.source)), source.sourceSha256);
assert.equal(hash(read('public/localized-media/de/samples/markup/' + source.preview.file)), source.preview.sha256);
assert.equal(source.pages, 1);
assert.equal(source.sheet, 'X101');
assert.equal(source.notes.length, 3);
assert.equal(source.optionalContentLayers, 4);
assert.equal(source.pixelEquivalentToOriginalSheet.passed, true);
const catalogPath = path.join(app, 'packages/core/src/locales/de-DE.json');
const catalogBytes = fs.readFileSync(catalogPath);
const messages = JSON.parse(catalogBytes).messages;
const vocabularyKey = Object.keys(profile.text).find(key => key.startsWith('PolyPDF offers No Status'));
const statusKeys = ['none', 'open', 'inProgress', 'completed', 'accepted', 'rejected', 'cancelled', 'reviewed'];
const statusLabels = statusKeys.map(key => messages['markupStatus.' + key]);
for (const label of statusLabels) assert.ok(profile.text[vocabularyKey].includes(label), label);
const prose = document.body.textContent.replace(/\s+/g, ' ');
for (const note of source.notes) assert.ok(prose.includes(note.subject), note.subject);
for (const text of ['drei vorbereitete', 'zwei Zeilen', 'fünf Spalten', 'unabhängige Prüfung steht aus', 'X101']) {
  assert.ok(prose.includes(text), text);
}
for (const value of Object.values(profile.text)) {
  assert.ok(!/18 inches|Room 302|Geprüft|Angenommen|Willow Creek/.test(value), value);
}
const report = {
  status: 'passed', draft: true, registered: false, route,
  elements: profile.elements.length, consumedTextOverrides: Object.keys(profile.text).length,
  profileSha256: hash(read(profilePath)), sourceVerificationSha256: hash(read(sourcePath)),
  appCatalogSha256: hash(catalogBytes), statusLabels,
  sourceFiles: Object.fromEntries([
    profilePath, 'scripts/localization/prepare-markup-de.py', 'scripts/localization/verify-markup-draft.cjs',
    'scripts/localization/pages.cjs', 'scripts/international/content.cjs',
    'src/content/guides/pdf-markup-table-rfi-punch-list.js'
  ].map(file => [file, hash(read(file))])),
  checks: [
    'Every source-bound element matches the current English prerender',
    'Every German override is consumed by the actual DOM/schema translator',
    'All eight documented status labels match the current app catalog',
    'The drawing, preview and original regional library hashes agree',
    'Draft is absent from the public manifest and cannot enable regional media'
  ],
  remaining: ['Native Save', 'CSV and summary PDF export', 'Fresh-process reopen', 'Public registration and browser verification']
};
const output = path.join(root, 'docs/localization/markup-de/draft-contract.json');
fs.mkdirSync(path.dirname(output), {recursive: true});
fs.writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
console.log(`German markup draft passed: ${report.elements} bound elements, ${report.consumedTextOverrides} consumed overrides, eight exact app statuses; not registered.`);
