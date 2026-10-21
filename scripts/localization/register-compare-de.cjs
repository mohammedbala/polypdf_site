'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),save=(f,o)=>fs.writeFileSync(path.join(root,f),JSON.stringify(o,null,2)+'\n');
const input='.tmp/localization/compare-de',output='public/localized-media/de/guides/compare',samples='public/localized-media/de/samples/compare';
const report=JSON.parse(read(`${input}/validation.json`)),profile=JSON.parse(read('scripts/localization/compare-de.json'));
assert.equal(report.status,'passed');assert.equal(report.locale,'de-DE');assert.equal(report.region,'DE');assert.equal(report.platform,'darwin');
assert.equal(report.captureScriptSha256,hash(read('scripts/localization/capture-compare-de.mjs')));
assert.ok(process.env.POLYPDF_APP_ROOT,'Set POLYPDF_APP_ROOT to the captured app workspace');
assert.deepEqual(report.build,JSON.parse(fs.readFileSync(path.join(process.env.POLYPDF_APP_ROOT,'dist/build-source.json'))));
assert.deepEqual(report.sourceHashes,['a','b'].map(r=>hash(read(`${samples}/architektur-revision-${r}.pdf`))));
assert.equal(report.savedSha256,hash(read(`${input}/vergleich-a-b.pdf`)));
assert.equal(report.originalClouds.length,12);assert.deepEqual(report.reopenedClouds,report.originalClouds);
assert.equal(report.sourceLinks.length,2);assert.equal(report.rows.length,14);
for(const page of [1,2]){
 const clouds=report.originalClouds.filter(c=>c.page===page);assert.equal(clouds.length,page===1?9:3);
 for(const [i,c] of clouds.entries())assert.equal(c.label,`Vergleichsänderung S. ${page} Nr. ${i+1}`);
}
assert.ok(report.originalClouds.every(c=>c.author==='Vergleich'));
assert.ok(report.dialogText.includes('architektur-revision-b.pdf'));assert.ok(!report.dialogText.includes('Keine PDF ausgewählt'));
const files=['vergleich-dialog.png','vergleich-a101.png','vergleich-a201.png','vergleich-wieder-geoeffnet.png'];
assert.deepEqual(report.shots.map(s=>s.file),files);fs.mkdirSync(path.join(root,output),{recursive:true});
for(const shot of report.shots){const bytes=read(`${input}/${shot.file}`);assert.equal(hash(bytes),shot.sha256);fs.writeFileSync(path.join(root,output,shot.file),bytes);}
fs.writeFileSync(path.join(root,samples,'vergleich-a-b.pdf'),read(`${input}/vergleich-a-b.pdf`));
const manifestPath='src/localization/walkthrough-media.json',manifest=JSON.parse(read(manifestPath)),pack=manifest.locales.de;
const inventory=JSON.parse(read('docs/localization/source-inventory.json')),name='compare-editable-clouds-v1-4-dark-web',source=inventory.assets.find(a=>a.source.startsWith(`/static/media/${name}.`));
const sourcePath=`src/assets/screenshots/${name}.png`,file='vergleich-wieder-geoeffnet.png';assert.ok(source);assert.equal(hash(read(sourcePath)),source.sha256);
const record={url:`/localized-media/de/guides/compare/${file}`,locale:'de-DE',region:'DE',status:'verified',appBuild:'1.6.17+84',sourcePath,sourceSha256:source.sha256,sha256:hash(read(`${output}/${file}`)),width:1710,height:1073,alt:'Deutsche PolyPDF-Oberfläche mit wieder geöffnetem Vergleich des Bürgerhauses am Lindenpark, ausgewählter Revisionswolke auf A101 und Anmerkungstabelle',verification:profile.evidence};
pack.assets[source.source]=record;
pack.assets['/guides/compare-pdf-drawing-revisions.png']={...record,sourcePath:'public/guides/compare-pdf-drawing-revisions.png',sourceSha256:hash(read('public/guides/compare-pdf-drawing-revisions.png'))};
pack.pages={...pack.pages,'/blog/compare-pdf-drawing-revisions':profile};save(manifestPath,manifest);
save(`${output}/verification.json`,{...report,profileSha256:hash(read('scripts/localization/compare-de.json')),sources:['a','b'].map((r,i)=>({url:`/localized-media/de/samples/compare/architektur-revision-${r}.pdf`,sha256:report.sourceHashes[i]})),savedPdf:'/localized-media/de/samples/compare/vergleich-a-b.pdf',visualReview:'Four real Mac captures inspected. The configured German dialog names both revisions; A101 and A201 show selected editable clouds. The fresh-process screenshot shows the saved German drawing and Markup Table. Twelve clouds and two source links agree with the 14-item table; not all rows are simultaneously visible.'});
console.log('Registered German comparison guide: two regional source PDFs, twelve editable clouds, native save and fresh reopen.');
