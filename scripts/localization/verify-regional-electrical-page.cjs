'use strict';
// Run after the normal website build. Produces an ignored local preview and a
// source-bound receipt; a changed preview still requires browser inspection.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { JSDOM } = require('jsdom');
const c = require('../international/content.cjs');
const m = require('./media.cjs');
const root = path.resolve(__dirname, '../..');
const read = name => fs.readFileSync(path.join(root, name));
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const manifest = JSON.parse(read('src/localization/walkthrough-media.json'));
const profile = JSON.parse(read('scripts/localization/regional-electrical-de.json'));
const native = JSON.parse(read('public/localized-media/de/samples/construction/native-roundtrip.json'));
const verification = JSON.parse(read('public/localized-media/de/samples/electrical/verification.json'));
assert.equal(verification.status, 'passed');
assert.equal(native.status, 'passed');
// Allow validation before registration while still using the already verified
// German construction PDF. Regional worksheet files are checked independently below.
manifest.locales.de.regionalText = { ...manifest.locales.de.regionalText, ...profile.text };
manifest.locales.de.regionalTables = { ...manifest.locales.de.regionalTables, ...profile.tables };
for (const file of ['electrical-count-review.csv', 'README.html', 'manifest.json']) {
  const outputHash = digest(read(`public/localized-media/de/samples/electrical/${file}`));
  assert.equal(outputHash, verification.files[file], `Changed regional electrical file: ${file}`);
  manifest.locales.de.assets[`/samples/electrical/${file}`] = {
    url: `/localized-media/de/samples/electrical/${file}`, locale: 'de-DE', region: 'DE',
    appBuild: native.appBuild, status: 'verified',
    sourceSha256: digest(read(`public/samples/electrical/${file}`)),
    sha256: outputHash
  };
}
const original = new JSDOM(read('build/electrical-takeoff-software/index.html').toString()).window.document;
const sections = ['electrical-options', 'electrical-count-check', 'electrical-route-check', 'electrical-estimate-handoff']
  .map(id => {
    const section = original.getElementById(id)?.closest('section');
    assert.ok(section, `Missing built electrical section: ${id}`);
    return section.outerHTML;
  });
const styles = [...original.querySelectorAll('link[rel=stylesheet]')].map(node => node.outerHTML).join('');
const view = new JSDOM(`<!doctype html><html lang="de"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Deutsche Elektro-Übung · lokale Vorschau</title>${styles}</head><body><main>${sections.join('')}</main></body></html>`);
const document = view.window.document;
assert.equal(document.querySelectorAll('[data-regional-copy]').length, 13);
m.localizeRegionalCopy(document, { id: 'de' }, manifest);
m.localizeWalkthroughMedia(document, { id: 'de' }, manifest);
c.translateDOM(document.body, c.translateFactory(JSON.parse(read('src/content/translations/de.json'))));
assert.equal(document.querySelectorAll('tbody tr').length, 3);
assert.deepEqual([...document.querySelectorAll('tbody tr')].map(row => row.lastElementChild.textContent),
  ['24 Stück', '12 Stück', '8 Stück']);
assert.ok(!/Willow Creek|E601|GFCI|46 ft|18 receptacles/.test(document.body.textContent));
assert.ok(document.body.textContent.includes('34,5 m'));
assert.equal(document.querySelector('a[href$="06-Beleuchtung-und-Elektro.pdf"]').textContent,
  'Grundriss E101 und Schema/Liste E501 · PDF');
const html = view.serialize();
fs.writeFileSync(path.join(root, 'build/local-electrical-preview.html'), html);
const receiptPath = path.join(root, 'public/localized-media/de/samples/electrical/page-validation.json');
const previous = fs.existsSync(receiptPath) ? JSON.parse(fs.readFileSync(receiptPath)) : undefined;
const report = {
  status: 'passed',
  sourceComponentSha256: digest(read('src/components/ElectricalTakeoffEvaluation.js')),
  catalogSha256: digest(read('src/content/translations/de.json')),
  regionalProfileSha256: digest(read('scripts/localization/regional-electrical-de.json')),
  previewSha256: digest(html),
  checks: ['13 exact-source regional text replacements', 'Four US table rows replaced with three German rows',
    '24/12/8 counts and 34.5 m line agree with regional drawing',
    'No US project, E601, GFCI or US route references in the four exercise sections',
    'Strict German translation completed without fallback', 'German PDF/CSV/guide destinations resolved'],
  limitations: ['Four exercise sections only; full page screenshots, metadata, FAQ and route policy remain pending',
    'The media pack remains pilot and inactive']
};
if (previous?.previewSha256 === report.previewSha256 && previous.visualReview) report.visualReview = previous.visualReview;
fs.writeFileSync(receiptPath, JSON.stringify(report, null, 2)+'\n');
console.log('German electrical page: all 13 source bindings, three regional rows, download labels and strict translation verified.');
