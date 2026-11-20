'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { verifyMediaFiles } = require('./media.cjs');
const root = path.resolve(__dirname, '../..');
const base = '/localized-media/de/samples/evaluation';
const folder = path.join(root, 'public', base);
const read = name => JSON.parse(fs.readFileSync(path.join(folder, name), 'utf8'));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const manifest = read('manifest.json');
const verification = read('verification.json');
const visual = read('visual-review.json');
const library = path.join(folder, '../construction');
const sourceHash = hash(path.join(library, 'DEMO-MANIFEST.json'));
const native = JSON.parse(fs.readFileSync(path.join(library, 'native-roundtrip.json')));
if (manifest.locale !== 'de-DE' || manifest.region !== 'DE' || verification.status !== 'passed'
    || manifest.sourceManifestSha256 !== sourceHash || verification.sourceManifestSha256 !== sourceHash
    || native.manifestSha256 !== sourceHash || native.status !== 'passed'
    || manifest.runtimeVerification !== 'not_performed'
    || visual.status !== 'passed' || visual.guideSha256 !== hash(path.join(folder, 'START-HERE.html'))
    || verification.documents !== 6 || verification.pages !== 12
    || verification.references !== 14 || verification.blankChecks !== 33 || verification.archiveEntries !== 11) {
  throw new Error('Regional evaluation references and source-bound library checks must pass.');
}
for (const document of manifest.documents) {
  if (document.sha256 !== hash(path.join(library, document.file))) throw new Error(`Changed source PDF: ${document.file}`);
}
for (const [file, expected] of Object.entries(verification.files)) {
  if (expected !== hash(path.join(folder, file))) throw new Error(`Changed evaluation artifact: ${file}`);
}
const mediaPath = path.join(root, 'src/localization/walkthrough-media.json');
const media = JSON.parse(fs.readFileSync(mediaPath));
const pack = media.locales.de;
for (const [sourceName, outputName] of [
  ['polypdf-construction-evaluation-kit.zip', 'PolyPDF-Pruefpaket-de-DE.zip'],
  ...['START-HERE.html', 'reference-quantities.csv', 'evaluation-results.csv', 'manifest.json', 'SHA256SUMS.txt'].map(name => [name, name])
]) {
  const source = `/samples/evaluation/${sourceName}`;
  pack.assets[source] = {
    url: `${base}/${outputName}`, locale: manifest.locale, region: manifest.region, appBuild: native.appBuild,
    status: 'verified', sourceSha256: hash(path.join(root, 'public', source)), sha256: hash(path.join(folder, outputName)),
    verification: `${base}/verification.json`, visualReview: `${base}/visual-review.json`,
    sourceLibrary: '/localized-media/de/samples/construction/DEMO-MANIFEST.json'
  };
}
pack.regionalText = { ...pack.regionalText,
  'evaluation.description': {
    source: 'Use the Willow Creek evaluation kit to test the app on a consistent set of architectural, electrical, interiors, coordination, and scanned drawings. It includes six PDFs with twelve sheets, fourteen drawing references, and a blank Mac/Windows results checklist.',
    target: 'Prüfen Sie die App mit dem fiktiven Bürgerhaus am Lindenpark: Architektur, Elektro, Innenausbau, Koordination und gescannte Pläne. Das deutsche Prüfpaket enthält sechs PDFs mit zwölf A1-Blättern, vierzehn Referenzwerten und eine leere Ergebnisliste mit 33 Prüfschritten für Mac, Windows und iPad.'
  },
  'evaluation.calibration': {
    source: 'Record your app version, build, operating system, and edition. Open A101, Revision A, and calibrate the printed 20 ft reference.',
    target: 'Erfassen Sie App-Version, Build, Betriebssystem und Lizenzumfang. Öffnen Sie A101, Revision A, und kalibrieren Sie die gedruckte 5-m-Referenz.'
  },
  'evaluation.dimensions': {
    source: 'Check the independent 96 ft width and 60 ft depth, then measure the outside boundary: 5,760 sq ft gross. These are two length checks and one area.',
    target: 'Prüfen Sie unabhängig 24 m Breite und 15 m Tiefe. Messen Sie anschließend die äußere Begrenzung: 360 m² Brutto-Grundfläche. Das sind zwei Längenprüfungen und eine Flächenmessung.'
  },
  'evaluation.results': {
    source: 'The kit contains original source drawings and authored references, not completed app tests. The 22 platform checks start as NOT RUN. Record your own results, including misses and unexpected differences. Historical app exports elsewhere on this site use separate drawings and keep their original version labels.',
    target: 'Das Paket enthält vorbereitete Zeichnungen und Referenzwerte. Alle 33 Plattformprüfungen beginnen mit NICHT AUSGEFÜHRT. Erfassen Sie eigene Ergebnisse, einschließlich fehlender Treffer und unerwarteter Abweichungen. Die Plattformspalten belegen keine Funktionsgleichheit. Frühere App-Exporte auf dieser Website verwenden eigene Zeichnungen und behalten ihre ursprünglichen Versionsangaben.'
  }
};
const registry = JSON.parse(fs.readFileSync(path.join(root, 'src/localization/product-locales.json'))).locales;
verifyMediaFiles(media, registry, asset => {
  const publicFile = path.join(root, 'public', asset);
  return fs.readFileSync(fs.existsSync(publicFile) ? publicFile : path.join(root, 'build', asset));
}, ['de']);
fs.writeFileSync(mediaPath, JSON.stringify(media, null, 2)+'\n');
console.log(`Registered German evaluation kit, references, blank results and regional exercise text. Pack status: ${pack.status}.`);
