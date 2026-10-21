'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),save=(f,o)=>fs.writeFileSync(path.join(root,f),JSON.stringify(o,null,2)+'\n');
const input='.tmp/localization/stamps-de',output='public/localized-media/de/guides/stamps',samples='public/localized-media/de/samples/stamps';
const report=JSON.parse(read(`${input}/validation.json`)),proof=JSON.parse(read(`${samples}/export-verification.json`)),profile=JSON.parse(read('scripts/localization/stamps-de.json'));
assert.equal(report.status,'passed');assert.equal(report.locale,'de-DE');assert.equal(report.region,'DE');assert.equal(report.platform,'darwin');
assert.equal(report.captureScriptSha256,hash(read('scripts/localization/capture-stamps-de.mjs')));
assert.ok(process.env.POLYPDF_APP_ROOT,'Set POLYPDF_APP_ROOT to the captured app workspace');
assert.deepEqual(report.build,JSON.parse(fs.readFileSync(path.join(process.env.POLYPDF_APP_ROOT,'dist/build-source.json'))));
assert.equal(proof.status,'passed');assert.equal(proof.nativeCaptureSha256,hash(read(`${input}/validation.json`)));
assert.equal(report.sourceHash,hash(read(`${samples}/pruefplan-vorlage.pdf`)));
assert.equal(report.savedSha256,hash(read(`${samples}/pruefplan-mit-stempel.pdf`)));
assert.equal(report.placed.length,1);assert.equal(report.reopened.length,1);
assert.deepEqual(report.placed[0].interactiveStamp,report.reopened[0].interactiveStamp);
assert.equal(report.template.sha256,report.templateReopened);assert.equal(report.template.sha256,proof.files['planpruefung.polypdftools']);
assert.equal(report.reusedPrompt[1].value,'');assert.equal(report.reusedPrompt[1].disabled,false);
assert.equal(report.missing,'Füllen Sie dieses Feld aus: Prüfende Person');assert.equal(report.blank.saveToToolset,true);
assert.equal(proof.sourceContentUnchanged,true);assert.equal(proof.stampAnnotations,1);
for(const [file,expected] of Object.entries(proof.files))assert.equal(hash(read(`${samples}/${file}`)),expected);
assert.deepEqual(report.shots.map(s=>s.file),['stempel-leer.png','stempel-editor.png','stempel-abfrage.png','stempel-platziert.png','stempel-wieder-geoeffnet.png']);
fs.mkdirSync(path.join(root,output),{recursive:true});
for(const shot of report.shots){const bytes=read(`${input}/${shot.file}`);assert.equal(hash(bytes),shot.sha256);assert.equal(bytes.readUInt32BE(16),1710);assert.equal(bytes.readUInt32BE(20),1073);fs.writeFileSync(path.join(root,output,shot.file),bytes);}
const manifestPath='src/localization/walkthrough-media.json',manifest=JSON.parse(read(manifestPath)),pack=manifest.locales.de;
const inventory=JSON.parse(read('docs/localization/source-inventory.json'));
const bindings=[
 ['builder','stempel-editor.png','Deutscher PolyPDF-Stempel-Editor mit drei Feldern auf einer 300 × 140 pt großen Vorlage und aktivierter Speicherung im Werkzeugset'],
 ['blank','stempel-leer.png','Neuer deutscher interaktiver Stempel mit leerer 240 × 240 pt großer Zeichenfläche und aktiviertem Zum Werkzeugset hinzufügen'],
 ['prompt','stempel-abfrage.png','Deutscher Platzierungsdialog mit Pflichtangabe Prüfende Person, festem Prüfvermerk und automatisch eingesetztem Datum'],
 ['placed','stempel-platziert.png','Deutscher Prüfstempel GEPRÜFT - ÜBUNG mit Musterprüfung und 21.10.2026 im freien Bereich unter der A2-Übungszeichnung']
];
for(const [kind,file,alt] of bindings){
 const source=inventory.assets.find(a=>a.source.startsWith(`/static/media/stamp-${kind}-v1-5-1.`));
 const sourcePath=`src/assets/screenshots/stamp-${kind}-v1-5-1.png`;assert.ok(source);assert.equal(hash(read(sourcePath)),source.sha256);
 const record={url:`/localized-media/de/guides/stamps/${file}`,locale:'de-DE',region:'DE',status:'verified',appBuild:'1.6.17+84',sourcePath,sourceSha256:source.sha256,sha256:hash(read(`${output}/${file}`)),width:1710,height:1073,alt,verification:profile.evidence};
 pack.assets[source.source]=record;
 if(kind==='builder')pack.assets['/guides/create-interactive-pdf-stamps.png']={...record,sourcePath:'public/guides/create-interactive-pdf-stamps.png',sourceSha256:hash(read('public/guides/create-interactive-pdf-stamps.png'))};
}
pack.pages={...pack.pages,'/blog/create-interactive-pdf-stamps':profile};save(manifestPath,manifest);
save(`${output}/verification.json`,{...report,profileSha256:hash(read('scripts/localization/stamps-de.json')),exportVerificationSha256:hash(read(`${samples}/export-verification.json`)),visualReview:'Actual German blank builder, full editor, placement prompt, placed stamp and fresh-process reopened captures inspected. Field/source labels fit after the CSS correction. Independent Poppler rendering of the source and saved A2 PDFs shows readable German glyphs and a stamp below the plan, beside the calibration line and left of the title block, with no drawing overlap.',limitations:[...report.limitations,...proof.limitations,'The reused-template prompt was canceled after proving its reviewer default was empty; the delivered PDF contains one stamp.']});
console.log(`German stamps registered: ${Object.keys(pack.assets).length} asset mappings; ${Object.values(pack.pages).filter(p=>p.status==='complete').length} completed routes.`);
