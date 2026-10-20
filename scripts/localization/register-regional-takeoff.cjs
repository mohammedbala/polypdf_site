'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { verifyMediaFiles } = require('./media.cjs');
const root = path.resolve(__dirname, '../..');
const base = '/localized-media/de/samples/takeoff';
const folder = path.join(root, 'public', base);
const read = name => JSON.parse(fs.readFileSync(path.join(folder, name), 'utf8'));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const source = read('manifest.json'), verification = read('verification.json');
const visual = read('visual-review.json'), native = read('native-roundtrip.json');
const manifestHash = hash(path.join(folder, 'manifest.json'));
assert.equal(source.locale, 'de-DE');
assert.equal(source.region, 'DE');
assert.equal(source.appExport, false);
for (const report of [verification, visual, native]) {
  assert.equal(report.status, 'passed');
  assert.equal(report.manifestSha256, manifestHash);
}
assert.equal(native.cases.length, 4);
assert.equal(visual.guideReview.status, 'passed');
assert.equal(visual.guideSha256, hash(path.join(folder, 'README.html')));
assert.equal(source.profileSha256, hash(path.join(__dirname, 'takeoff-de-DE.json')));
assert.equal(source.generatorSha256, hash(path.join(root, 'scripts/generate-regional-takeoff.py')));
assert.equal(source.drawingGeometrySourceSha256, hash(path.join(root, 'scripts/generate-takeoff-samples.py')));
assert.equal(verification.verifierSha256, hash(path.join(root, 'scripts/verify-regional-takeoff.py')));
for (const [file, expected] of Object.entries(source.files)) {
  assert.equal(hash(path.join(folder, file)), expected, `Changed takeoff artifact: ${file}`);
  assert.equal(verification.files[file], expected);
  if (file.endsWith('.png')) assert.equal(visual.previews[file], expected);
}
for (const record of native.cases) assert.equal(record.sourceSha256, source.files[record.file]);
const mediaPath = path.join(root, 'src/localization/walkthrough-media.json');
const media = JSON.parse(fs.readFileSync(mediaPath));
const pack = media.locales.de;
assert.equal(pack.status, 'pilot', 'Partial sample work cannot activate a language');
for (const [original, file] of Object.entries(source.sourceMappings)) {
  const key = `/samples/takeoff/${original}`;
  const image = original.endsWith('.png');
  pack.assets[key] = {
    url: `${base}/${file}`, locale: 'de-DE', region: 'DE', appBuild: native.appBuild,
    status: 'verified', sourceSha256: hash(path.join(root, 'public', key)), sha256: source.files[file],
    verification: `${base}/verification.json`, visualReview: `${base}/visual-review.json`,
    kind: 'synthetic-practice-reference',
    ...(image ? {
      width: 1800, height: 1273,
      alt: file.startsWith('bodenbelag')
        ? 'Deutscher F-101-Bodenbelagsplan auf A2: Raum 1 mit 20,52 m² netto und Randaussparung; Raum 2 mit 16,20 m².'
        : 'Deutscher E-101-Übungsplan auf A2 mit acht Leuchten Typ A, vier Leuchten Typ B und einer getrennten Trasse von 12,60 m.'
    } : {})
  };
}
const copy = JSON.parse(fs.readFileSync(path.join(__dirname, 'regional-takeoff-de.json')));
pack.regionalText = { ...pack.regionalText, ...copy.text };
pack.regionalTables = { ...pack.regionalTables, ...copy.tables };
verifyMediaFiles(media, JSON.parse(fs.readFileSync(path.join(root, 'src/localization/product-locales.json'))).locales,
  asset => fs.readFileSync(path.join(root, 'public', asset)), ['de']);
fs.writeFileSync(mediaPath, JSON.stringify(media, null, 2) + '\n');
console.log(`Registered ${Object.keys(source.sourceMappings).length} German takeoff sources and ${Object.keys(copy.text).length} regional copy bindings. Pack remains inactive.`);
