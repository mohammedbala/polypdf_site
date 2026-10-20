const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {PDFDocument,PDFDict,PDFName,PDFString} = require('pdf-lib');
const {resolveAsset} = require('../scripts/localization/media.cjs');
const root=path.resolve(__dirname,'..');
const folder=path.join(root,'public/localized-media/de/samples/takeoff/app-exports');
const read=file=>fs.readFileSync(path.join(folder,file));
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');

test('German flooring downloads resolve to verified regional files without activating incomplete media', () => {
  const manifest=JSON.parse(read('manifest.json'));
  const media=JSON.parse(fs.readFileSync(path.join(root,'src/localization/walkthrough-media.json')));
  const visual=JSON.parse(read('visual-review.json'));
  assert.equal(media.locales.de.status,'pilot');
  assert.equal(visual.manifestSha256,hash(read('manifest.json')));
  assert.equal(visual.readmeSha256,hash(read('README.md')));
  assert.equal(Object.keys(manifest.mappings).length,3);
  for(const [original,asset] of Object.entries(manifest.mappings)) {
    assert.equal(resolveAsset(original,{id:'de'},media),asset.url);
    assert.equal(hash(fs.readFileSync(path.join(root,'public',asset.url))),asset.sha256);
    assert.equal(hash(fs.readFileSync(path.join(root,'public',original))),asset.sourceSha256);
  }
  const csv=read('bodenbelag-mengentabelle.csv').toString('utf8');
  assert.ok(csv.startsWith('"Legende","Arbeitsbereich"'));
  assert.ok(csv.includes('"20,52","m²"'));
  assert.ok(csv.includes('"16,2","m²"'));
  assert.ok(csv.includes('"3,6","m"'));
  assert.ok(!csv.includes('408'));
});

test('German summary links target the regional drawing without local paths', async () => {
  const pdf=await PDFDocument.load(read('bodenbelag-mengenuebersicht.pdf'));
  let links=0;
  for(const page of pdf.getPages()) for(const ref of page.node.Annots()?.asArray()??[]) {
    const annotation=pdf.context.lookup(ref,PDFDict);
    const uri=annotation.lookup(PDFName.of('A'),PDFDict).lookup(PDFName.of('URI'),PDFString).decodeText();
    assert.equal(uri,'https://www.polypdf.com/localized-media/de/samples/takeoff/app-exports/bodenbelag-messungen.pdf#page=1');
    links++;
  }
  assert.equal(links,3);
});
