'use strict';
// Explicit preparation step. A pilot pack remains inactive until all route media is complete.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { verifyMediaFiles } = require('./media.cjs');
const root = path.resolve(__dirname, '../..');
const arg = name => process.argv[process.argv.indexOf(name) + 1];
const localeId = process.argv.includes('--locale') ? arg('--locale') : 'de';
const appBuild = process.argv.includes('--app-build') ? arg('--app-build') : null;
if (!appBuild) throw new Error('Pass --app-build with the app source build used for the sample checks.');
const base = `/localized-media/${localeId}/samples/construction`;
const folder = path.join(root, 'public', base);
const read = name => JSON.parse(fs.readFileSync(path.join(folder, name), 'utf8'));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const manifest = read('DEMO-MANIFEST.json');
const verification = read('verification.json');
const visual = read('visual-review.json');
const native = read('native-roundtrip.json');
const manifestHash = hash(path.join(folder, 'DEMO-MANIFEST.json'));
if (verification.automatedStatus !== 'passed' || visual.status !== 'passed' || native.status !== 'passed'
    || [verification, visual, native].some(receipt => receipt.manifestSha256 !== manifestHash)) {
  throw new Error('Regional geometry, visual and app persistence receipts must pass for these exact PDFs.');
}
if (native.cases.length !== manifest.documents.length * 2) throw new Error('Incomplete app persistence coverage');
if (native.appBuild !== appBuild) throw new Error('App build does not match the persistence receipt');
for (const document of manifest.documents) {
  if (document.sha256 !== hash(path.join(folder, document.file))) throw new Error(`Changed PDF: ${document.file}`);
  for (const mode of ['ordinary', 'append-only']) {
    if (!native.cases.some(item => item.file === document.file && item.sourceSha256 === document.sha256 && item.mode === mode)) {
      throw new Error(`Missing source-bound ${mode} check: ${document.file}`);
    }
  }
}
for (const preview of verification.previews) {
  if (preview.sha256 !== hash(path.join(folder, preview.file))
      || !visual.previews.some(item => item.file === preview.file && item.sha256 === preview.sha256)) {
    throw new Error(`Changed or unreviewed preview: ${preview.file}`);
  }
}
if (visual.contactSheet.sha256 !== hash(path.join(folder, 'CONTACT-SHEET.png'))) throw new Error('Stale visual contact sheet');
const registry = JSON.parse(fs.readFileSync(path.join(root, 'src/localization/product-locales.json'), 'utf8')).locales;
const mediaPath = path.join(root, 'src/localization/walkthrough-media.json');
const media = JSON.parse(fs.readFileSync(mediaPath, 'utf8'));
const pack = media.locales[localeId];
if (!pack || pack.appLocale !== manifest.locale || pack.region !== manifest.region) throw new Error('Locale/region mismatch');
const register = (sourceName, outputName) => {
  const source = `/samples/construction/${sourceName}`;
  const output = path.join(folder, outputName);
  const record = {
    url: `${base}/${outputName}`, locale: manifest.locale, region: manifest.region, appBuild,
    status: 'verified', sourceSha256: hash(path.join(root, 'public', source)), sha256: hash(output),
    verification: `${base}/verification.json`, visualReview: `${base}/visual-review.json`,
    appPersistence: `${base}/native-roundtrip.json`
  };
  if (outputName.endsWith('.png')) {
    const bytes = fs.readFileSync(output);
    if (bytes.subarray(1, 4).toString() !== 'PNG') throw new Error('Expected PNG dimensions');
    record.width = bytes.readUInt32BE(16);
    record.height = bytes.readUInt32BE(20);
  }
  pack.assets[source] = record;
};
for (const document of manifest.documents) {
  register(document.sourceFile, document.file);
  for (let page = 1; page <= document.pages.length; page++) {
    register(`previews/${document.sourceFile.slice(0, -4)}--page-${String(page).padStart(2, '0')}.png`,
      `previews/${document.id}-${page}.png`);
  }
}
register('contact-sheet.png', 'CONTACT-SHEET.png');
register('polypdf-construction-demo-library.zip', manifest.archiveFile ?? `PolyPDF-Bauzeichnungen-${manifest.locale}.zip`);
register('DEMO-GUIDE.html', 'DEMO-GUIDE.html');
register('DEMO-MANIFEST.json', 'DEMO-MANIFEST.json');
register('SHA256SUMS.txt', 'SHA256SUMS.txt');
verifyMediaFiles(media, registry, asset => fs.readFileSync(path.join(root, 'public', asset)), [localeId]);
fs.writeFileSync(mediaPath, JSON.stringify(media, null, 2) + '\n');
console.log(`Registered ${manifest.documents.length} regional PDFs, 24 previews, contact sheet, ZIP, guide and reference metadata. Pack status: ${pack.status}.`);
