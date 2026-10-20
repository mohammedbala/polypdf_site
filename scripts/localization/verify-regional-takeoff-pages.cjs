'use strict';
// Checks actual built source bindings. This does not certify the full pages or enable their media pack.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { JSDOM } = require('jsdom');
const { localizeRegionalCopy, localizeWalkthroughMedia } = require('./media.cjs');
const { translateDOM, translateFactory } = require('../international/content.cjs');
const root = path.resolve(__dirname, '../..');
const profilePath = 'scripts/localization/regional-takeoff-de.json';
const read = name => fs.readFileSync(path.join(root, name));
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const profile = JSON.parse(read(profilePath));
const manifest = JSON.parse(read('src/localization/walkthrough-media.json'));
const catalog = JSON.parse(read('src/content/translations/de.json'));
const seen = new Set(), seenTables = new Set(), pages = [];
for (const route of [
  'blog/measure-pdf-area-cutouts-depth', 'blog/calibrate-pdf-drawing-scale',
  'pdf-takeoff-software', 'measure-pdf-on-mac', 'visual-search-pdf-count', 'blog/quantity-takeoff'
]) {
  const source = read(`build/${route}/index.html`);
  const original = new JSDOM(source.toString()).window.document;
  const nodes = [...original.querySelectorAll('[data-regional-copy^="takeoff."],[data-regional-table^="takeoff."]')];
  assert.ok(nodes.length, `Missing takeoff source bindings on ${route}`);
  const document = new JSDOM(nodes.map(node => node.outerHTML).join('')).window.document;
  localizeRegionalCopy(document, { id: 'de' }, manifest);
  translateDOM(document.body, translateFactory(catalog));
  for (const node of document.querySelectorAll('[data-regional-copy]')) {
    const key = node.getAttribute('data-regional-copy');
    assert.equal(node.textContent, profile.text[key].target);
    seen.add(key);
  }
  for (const table of document.querySelectorAll('[data-regional-table]')) {
    const key = table.getAttribute('data-regional-table');
    assert.deepEqual([...table.querySelectorAll('tbody tr')].map(row => [...row.children].map(cell => cell.textContent)),
      profile.tables[key].target.rows);
    seenTables.add(key);
  }
  const sourceImages = [...original.querySelectorAll('img[src^="/samples/takeoff/"]')];
  for (const image of sourceImages) {
    const fixture = new JSDOM(image.outerHTML).window.document;
    localizeWalkthroughMedia(fixture, { id: 'de' }, manifest);
    translateDOM(fixture.body, translateFactory(catalog));
    const localized = fixture.querySelector('img');
    assert.ok(localized.src.includes('/localized-media/de/samples/takeoff/'));
    assert.ok(localized.alt.startsWith('Deutscher'));
    assert.equal(localized.height, 1273);
    assert.ok(!/\bfeet\b|\bfoot\b/.test(localized.alt));
  }
  pages.push({ route: `/${route}/`, sourceSha256: hash(source), regionalElements: nodes.length, regionalImages: sourceImages.length });
}
assert.deepEqual([...seen].sort(), Object.keys(profile.text).sort());
assert.deepEqual([...seenTables].sort(), Object.keys(profile.tables).sort());
const sourceFiles = [
  'src/components/AreaPractice.js', 'src/components/CalibrationPractice.js', 'src/components/TakeoffEvaluation.js',
  'src/components/MacMeasurementEvaluation.js', 'src/components/SymbolCountEvaluation.js', 'src/components/SampleDrawingNote.js',
  'src/components/BlogPost.js', 'src/content/guides/quantity-takeoff.js'
];
fs.writeFileSync(path.join(root, 'public/localized-media/de/samples/takeoff/page-validation.json'), JSON.stringify({
  status: 'passed', scope: 'Regional source bindings and source-preview accessibility on six built pages',
  profileSha256: hash(read(profilePath)),
  sourceFiles: Object.fromEntries(sourceFiles.map(file => [file, hash(read(file))])),
  regionalCopyRecords: seen.size, regionalTables: seenTables.size, pages,
  limitations: [
    'Full page screenshots, videos, unbound metadata/FAQ and historical app-output replacement remain pending',
    'No full media-pack or native UI qualification is claimed; the German pack remains pilot and inactive'
  ]
}, null, 2) + '\n');
console.log(`Verified ${seen.size} regional copy records, ${seenTables.size} tables and preview descriptions across six built pages.`);
