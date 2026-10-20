'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { verifyMediaFiles } = require('./media.cjs');
const root = path.resolve(__dirname, '../..');
const buildIndex = process.argv.indexOf('--app-build');
const appBuild = buildIndex >= 0 ? process.argv[buildIndex + 1] : null;
if (!appBuild) throw new Error('Pass --app-build with the app source build used for form checks.');
const base = '/localized-media/de/samples/forms';
const folder = path.join(root, 'public', base);
const read = name => JSON.parse(fs.readFileSync(path.join(folder, name), 'utf8'));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const manifest = read('manifest.json');
const [verification] = read('verification.json');
const native = read('native-form-roundtrip.json');
const visual = read('visual-review.json');
const sourceHash = manifest.files['construction-review-form-de.pdf'];
if (manifest.locale !== 'de-DE' || manifest.region !== 'DE'
    || verification.language !== 'de' || verification.sourceSha256 !== sourceHash
    || verification.fields !== 10 || verification.widgets !== 12
    || ['canonicalValues', 'widgetValuesAndAppearances', 'pypdfSaveReopen'].some(key => verification[key] !== 'pass')
    || native.status !== 'passed' || native.sourceSha256 !== sourceHash || native.appBuild !== appBuild
    || native.locale !== manifest.locale || native.region !== manifest.region || native.cases.length !== 2
    || visual.status !== 'passed' || visual.sourceSha256 !== sourceHash) {
  throw new Error('Source-bound structural, native persistence and visual form checks must pass.');
}
for (const [file, expected] of Object.entries(manifest.files)) {
  if (hash(path.join(folder, file)) !== expected) throw new Error(`Changed form artifact: ${file}`);
}
for (const mode of ['ordinary', 'append-only']) {
  const result = native.cases.find(item => item.mode === mode);
  if (!result || result.fields !== 10 || result.widgets !== 12
      || !visual.previews.some(item => item.kind === mode && item.pdfSha256 === result.sha256)) {
    throw new Error(`Missing source-bound visual check for ${mode} form output.`);
  }
}
for (const [kind, pdfSha256] of [['source', sourceHash], ['independent', verification.filledSha256]]) {
  if (!visual.previews.some(item => item.kind === kind && item.pdfSha256 === pdfSha256)) {
    throw new Error(`Missing ${kind} form preview check.`);
  }
}
for (const item of visual.previews) {
  if (hash(path.join(folder, item.file)) !== item.sha256) throw new Error(`Changed form preview: ${item.file}`);
}
const mediaPath = path.join(root, 'src/localization/walkthrough-media.json');
const media = JSON.parse(fs.readFileSync(mediaPath));
const pack = media.locales.de;
for (const [sourceName, outputName] of [
  ['construction-review-form-en.pdf', 'construction-review-form-de.pdf'],
  ['construction-review-field-map.csv', 'construction-review-field-map.csv'],
  ['manifest.json', 'manifest.json']
]) {
  const source = `/samples/forms/${sourceName}`;
  pack.assets[source] = {
    url: `${base}/${outputName}`, locale: manifest.locale, region: manifest.region, appBuild,
    status: 'verified', sourceSha256: hash(path.join(root, 'public', source)),
    sha256: hash(path.join(folder, outputName)), verification: `${base}/verification.json`,
    visualReview: `${base}/visual-review.json`, appPersistence: `${base}/native-form-roundtrip.json`
  };
}
pack.regionalForm = {
  primarySource: '/samples/forms/construction-review-form-en.pdf',
  alternativeSources: ['/samples/forms/construction-review-form-fr.pdf'],
  fieldMapSource: '/samples/forms/construction-review-field-map.csv',
  primaryLabel: 'Deutsches Übungsformular · PDF',
  fieldMapLabel: 'Feldkennungen und Feldtypen · CSV',
  description: 'Dieses Beispiel zur Planprüfung enthält zehn Felder: Text, mehrzeilige Notizen, Kontrollkästchen, eine Optionsgruppe und eine Auswahlliste. Laden Sie das deutsche A4-Formular herunter, tragen Sie Testwerte ein und öffnen Sie eine gespeicherte Kopie erneut, um alle Werte zu prüfen.',
  evidence: 'Dieses deutsche Übungsformular wurde am 20.10.2026 erstellt und mit unabhängigen PDF-Werkzeugen sowie den Formularfunktionen von PolyPDF 1.6.17, Build 84, geprüft. Die Prüfungen umfassen alle zehn Feldwerte und zwölf Steuerelemente nach normalem und inkrementellem Speichern. Die Bedienung in den nativen Apps auf Mac, Windows und iPad wurde für dieses Formular noch nicht geprüft. Öffnen Sie eine gespeicherte Kopie auch im PDF-Programm des Empfängers.'
};
const registry = JSON.parse(fs.readFileSync(path.join(root, 'src/localization/product-locales.json'))).locales;
verifyMediaFiles(media, registry, asset => fs.readFileSync(path.join(root, 'public', asset)), ['de']);
fs.writeFileSync(mediaPath, JSON.stringify(media, null, 2)+'\n');
console.log(`Registered German form, field map and regional download copy. Pack status: ${pack.status}.`);
