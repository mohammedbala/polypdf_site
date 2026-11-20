'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { verifyMediaFiles } = require('./media.cjs');
const root = path.resolve(__dirname, '../..');
const base = '/localized-media/de/samples/electrical';
const folder = path.join(root, 'public', base);
const read = name => JSON.parse(fs.readFileSync(path.join(folder, name), 'utf8'));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const manifest = read('manifest.json');
const verification = read('verification.json');
const visual = read('visual-review.json');
const page = read('../../guides114/electrical-preview-verification.json');
const library = path.join(folder, '../construction');
const sourceHash = hash(path.join(library, 'DEMO-MANIFEST.json'));
const native = JSON.parse(fs.readFileSync(path.join(library, 'native-roundtrip.json')));
if (manifest.locale !== 'de-DE' || manifest.region !== 'DE' || verification.status !== 'passed'
    || manifest.sourceManifestSha256 !== sourceHash || verification.sourceManifestSha256 !== sourceHash
    || native.manifestSha256 !== sourceHash || native.status !== 'passed'
    || manifest.runtimeVerification !== 'not_performed' || verification.categories !== 3 || verification.blankResults !== 3
    || visual.status !== 'passed' || visual.guideSha256 !== hash(path.join(folder, 'README.html'))
    || page.status !== 'passed' || !page.visualReview
    || page.sourceComponentSha256 !== hash(path.join(root, 'src/components/ElectricalTakeoffEvaluation.js'))
    || page.catalogSha256 !== hash(path.join(root, 'src/content/translations/de.json'))
    || page.regionalProfileSha256 !== hash(path.join(__dirname, 'regional-electrical-de.json'))
    || manifest.sourcePdf.sha256 !== hash(path.join(root, 'public', manifest.sourcePdf.url))
    || verification.sourcePdfSha256 !== manifest.sourcePdf.sha256) {
  throw new Error('Regional electrical source, reference and visual checks must pass.');
}
for (const [file, expected] of Object.entries(verification.files)) {
  if (expected !== hash(path.join(folder, file))) throw new Error(`Changed electrical review artifact: ${file}`);
}
const mediaPath = path.join(root, 'src/localization/walkthrough-media.json');
const media = JSON.parse(fs.readFileSync(mediaPath));
const pack = media.locales.de;
for (const file of ['electrical-count-review.csv', 'README.html', 'manifest.json']) {
  const source = `/samples/electrical/${file}`;
  pack.assets[source] = {
    url: `${base}/${file}`, locale: manifest.locale, region: manifest.region, appBuild: native.appBuild,
    status: 'verified', sourceSha256: hash(path.join(root, 'public', source)), sha256: hash(path.join(folder, file)),
    verification: `${base}/verification.json`, visualReview: `${base}/visual-review.json`,
    sourceLibrary: '/localized-media/de/samples/construction/DEMO-MANIFEST.json'
  };
}
const copy = JSON.parse(fs.readFileSync(path.join(__dirname, 'regional-electrical-de.json')));
pack.regionalText = { ...pack.regionalText, ...copy.text };
pack.regionalTables = { ...pack.regionalTables, ...copy.tables };
const registry = JSON.parse(fs.readFileSync(path.join(root, 'src/localization/product-locales.json'))).locales;
verifyMediaFiles(media, registry, asset => {
    const publicFile = path.join(root, 'public', asset);
    return fs.readFileSync(fs.existsSync(publicFile) ? publicFile : path.join(root, 'build', asset));
  }, ['de']);
fs.writeFileSync(mediaPath, JSON.stringify(media, null, 2)+'\n');
console.log(`Registered German electrical review and three-category exercise. Pack status: ${pack.status}.`);
