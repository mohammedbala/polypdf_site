'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),save=(f,o)=>fs.writeFileSync(path.join(root,f),JSON.stringify(o,null,2)+'\n');
const input='.tmp/localization/ocr-de',output='public/localized-media/de/guides/ocr',samples='public/localized-media/de/samples/ocr';
const report=JSON.parse(read(`${input}/validation.json`)),proof=JSON.parse(read(`${samples}/export-verification.json`)),profile=JSON.parse(read('scripts/localization/ocr-de.json'));
assert.equal(report.status,'passed');assert.equal(report.locale,'de-DE');assert.equal(report.region,'DE');assert.equal(report.platform,'darwin');
assert.equal(report.captureScriptSha256,hash(read('scripts/localization/capture-ocr-de.mjs')));
assert.ok(process.env.POLYPDF_APP_ROOT,'Set POLYPDF_APP_ROOT to the captured app workspace');
assert.deepEqual(report.build,JSON.parse(fs.readFileSync(path.join(process.env.POLYPDF_APP_ROOT,'dist/build-source.json'))));
assert.equal(proof.status,'passed');assert.equal(proof.nativeCaptureSha256,hash(read(`${input}/validation.json`)));
assert.equal(report.sourceHash,hash(read(`${samples}/bestandsplaene-a101-c101.pdf`)));
assert.deepEqual(report.searches.reopen,report.searches.walkthrough);
assert.equal(report.before.rows.length,0);assert.ok(report.completion.includes('OCR abgeschlossen.'));
assert.deepEqual(report.searches.reopen.map(s=>[s.query,s.rows.length]),[['MEHRZWECKRAUM',1],['ENTWÄSSERUNG',1]]);
for(const [file,expected] of Object.entries(proof.files))assert.equal(hash(read(`${samples}/${file}`)),expected);
assert.deepEqual(report.shots.map(s=>s.file),['ocr-ohne-text.png','ocr-abgeschlossen.png','ocr-suche-mehrzweckraum.png','ocr-suche-entwaesserung.png']);
fs.mkdirSync(path.join(root,output),{recursive:true});
for(const shot of report.shots){const bytes=read(`${input}/${shot.file}`);assert.equal(hash(bytes),shot.sha256);fs.writeFileSync(path.join(root,output,shot.file),bytes);}
const manifestPath='src/localization/walkthrough-media.json',manifest=JSON.parse(read(manifestPath)),pack=manifest.locales.de;
const inventory=JSON.parse(read('docs/localization/source-inventory.json'));
for(const [part,file,alt] of [
 ['no-text-before','ocr-ohne-text.png','Deutsche PolyPDF-Suche: MEHRZWECKRAUM liefert vor OCR keine Treffer auf A101'],
 ['complete','ocr-abgeschlossen.png','Deutscher OCR-Dialog: OCR abgeschlossen bei 100 Prozent für beide gescannten Pläne'],
 ['search-hit','ocr-suche-mehrzweckraum.png','Deutsche PolyPDF-Suche nach erneutem Öffnen: ein Treffer für MEHRZWECKRAUM auf A101']
]){
 const name=`ocr-uss-akron-${part}-v1-4-light-web`,source=inventory.assets.find(a=>a.source.startsWith(`/static/media/${name}.`)),sourcePath=`src/assets/screenshots/${name}.png`;
 assert.ok(source);assert.equal(hash(read(sourcePath)),source.sha256);
 const record={url:`/localized-media/de/guides/ocr/${file}`,locale:'de-DE',region:'DE',status:'verified',appBuild:'1.6.17+84',sourcePath,sourceSha256:source.sha256,sha256:hash(read(`${output}/${file}`)),width:1710,height:1073,alt,verification:profile.evidence};
 pack.assets[source.source]=record;
 if(part==='search-hit')pack.assets['/guides/ocr-scanned-pdf-drawings.png']={...record,sourcePath:'public/guides/ocr-scanned-pdf-drawings.png',sourceSha256:hash(read('public/guides/ocr-scanned-pdf-drawings.png'))};
}
pack.pages={...pack.pages,'/blog/ocr-scanned-pdf-drawings':profile};save(manifestPath,manifest);
save(`${output}/verification.json`,{...report,profileSha256:hash(read('scripts/localization/ocr-de.json')),exportVerificationSha256:hash(read(`${samples}/export-verification.json`)),visualReview:'All four actual Mac screenshots and both saved PDF pages inspected. German controls, regional plans, completion and yellow search highlights are visible. No clipped dialog text or missing drawing glyphs. The raw OCR text contains recognition errors, disclosed in the guide.',limitations:[...report.limitations,...proof.limitations]});
console.log(`German OCR registered: ${Object.keys(pack.assets).length} asset mappings; ${Object.values(pack.pages).filter(p=>p.status==='complete').length} completed routes.`);
