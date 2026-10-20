// Import verified, fictional German demo outputs from the local app audit. This does not publish them.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFArray, PDFDict, PDFDocument, PDFName, PDFRawStream, PDFString } from 'pdf-lib';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const evidence = process.argv[2];
assert.ok(evidence, 'Pass the verified app takeoff-reports audit directory.');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const read = file => readFileSync(resolve(evidence, file));
const verification = JSON.parse(read('verification.json'));
assert.equal(verification.status, 'passed');
const verified = file => {
  const bytes = read(file);
  assert.equal(hash(bytes), verification.files[file], `Changed app evidence: ${file}`);
  return bytes;
};
const workflow = JSON.parse(verified('ui/validation.json'));
assert.equal(workflow.status, 'passed');
assert.deepEqual(workflow.build, verification.build);
const german = workflow.results.find(item => item.locale === 'de-DE');
assert.equal(german.checks.length, 6);
const base = '/localized-media/de/samples/takeoff/app-exports';
const folder = resolve(root, `public${base}`);
mkdirSync(folder, {recursive:true});
const records = [
  ['flooring-mac-measured.pdf', 'ui/de-DE/Bodenbelag.pdf', 'bodenbelag-messungen.pdf', 'prepared-native-drawing'],
  ['flooring-mac-worksheet.csv', `ui/${german.exports.find(item=>item.kind==='CSV').file}`, 'bodenbelag-mengentabelle.csv', 'actual-mac-export'],
  ['flooring-mac-summary.pdf', `ui/${german.exports.find(item=>item.kind==='PDF').file}`, 'bodenbelag-mengenuebersicht.pdf', 'actual-mac-export-derived']
];
const publicDrawing = `https://www.polypdf.com${base}/bodenbelag-messungen.pdf`;
const files = {}, mappings = {};
let rewrittenLinks = 0;
const pageStreams = pdf => pdf.getPages().map(page => {
  const contents = page.node.Contents();
  return (contents instanceof PDFArray ? contents.asArray() : [contents]).map(ref => {
    const stream = pdf.context.lookup(ref);
    assert.ok(stream instanceof PDFRawStream);
    return hash(stream.getContents());
  });
});
for (const [original, source, target, kind] of records) {
  const input = verified(source);
  let output = input;
  if (kind === 'actual-mac-export-derived') {
    const pdf = await PDFDocument.load(input, {updateMetadata:false});
    const streams = pageStreams(pdf);
    for (const page of pdf.getPages()) for (const ref of page.node.Annots()?.asArray() ?? []) {
      const annotation = pdf.context.lookup(ref, PDFDict);
      const action = annotation.lookup(PDFName.of('A'), PDFDict);
      const sourceUri = action.lookup(PDFName.of('URI'), PDFString).decodeText();
      const uri = new URL(sourceUri);
      assert.equal(uri.protocol, 'polypdf:');
      assert.equal(uri.hostname, 'report');
      assert.equal(uri.pathname, '/source');
      assert.ok(uri.searchParams.get('path')?.endsWith('/Bodenbelag.pdf'));
      assert.equal(uri.searchParams.get('page'), '1');
      action.set(PDFName.of('URI'), PDFString.of(`${publicDrawing}#page=1`));
      rewrittenLinks++;
    }
    assert.equal(rewrittenLinks, 3);
    output = await pdf.save({useObjectStreams:false});
    assert.deepEqual(pageStreams(await PDFDocument.load(output)), streams, 'Visible report content must remain unchanged');
  }
  writeFileSync(resolve(folder, target), output);
  files[target] = hash(output);
  mappings[`/samples/takeoff/${original}`] = {
    url:`${base}/${target}`, kind, originalAppSha256:hash(input), sha256:hash(output),
    sourceSha256:hash(readFileSync(resolve(root, `public/samples/takeoff/${original}`)))
  };
}
const manifest = {
  status:'passed', locale:'de-DE', region:'DE', appBuild:'1.6.17+84', developmentBuild:true,
  importerSha256:hash(readFileSync(fileURLToPath(import.meta.url))),
  build:workflow.build, appVerificationSha256:hash(read('verification.json')),
  appWorkflowSha256:hash(read('ui/validation.json')),
  geometry:{sheet:'F-101',paper:'A2',scale:'1:50',netAreasSquareMetres:[20.52,16.2],combinedNetSquareMetres:36.72,lengthCheckMetres:3.6},
  provenance:[
    'Drawing annotations were prepared by writer/importer tests and reopened in the actual Mac app.',
    'CSV and summary PDF were saved through actual app export handlers and native macOS Save dialogs.',
    'CSV and prepared drawing are byte-identical to verified app audit files.',
    'The PDF summary preserves every page content stream; three local source links now point to the German web sample.'
  ],
  limitations:['No native calibration or drawing gesture test','No Windows or native iPad verification','Development localization pilot; not a released-language claim'],
  rewrittenLinks, files, mappings
};
writeFileSync(resolve(folder,'manifest.json'), JSON.stringify(manifest,null,2)+'\n');
console.log('Imported three verified German demo artifacts; replaced three local PDF links without changing visible report content.');
