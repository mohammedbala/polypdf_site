'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f)),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const save=(f,v)=>fs.writeFileSync(path.join(root,f),JSON.stringify(v,null,2)+'\n');
const audit='docs/localization/redaction-de/native',output='public/localized-media/de/guides/redaction',samples='public/localized-media/de/samples/redaction';
const lifecycle=JSON.parse(read(`${audit}/lifecycle.json`)),ui=JSON.parse(read(`${audit}/ui-verification.json`)),proof=JSON.parse(read(`${samples}/export-verification.json`)),profile=JSON.parse(read('scripts/localization/redaction-de.json'));
assert.equal(lifecycle.complete,true);assert.equal(lifecycle.platform,'darwin');assert.equal(lifecycle.locale,'de-DE');assert.equal(lifecycle.region,'DE');
assert.equal(lifecycle.runnerSha256,hash(read('scripts/localization/capture-redaction-de.mjs')));
assert.ok(process.env.POLYPDF_APP_ROOT,'Set POLYPDF_APP_ROOT to the captured app workspace');
assert.deepEqual(lifecycle.build,JSON.parse(fs.readFileSync(path.join(process.env.POLYPDF_APP_ROOT,'dist/build-source.json'))));
assert.equal(proof.status,'passed');assert.equal(proof.scope,'native Save outputs');assert.equal(proof.lifecycleSha256,hash(read(`${audit}/lifecycle.json`)));
assert.deepEqual(lifecycle.records.map(r=>r.phase),['redaction','reopen','sanitize','sanitized-reopen']);
for(const [file,expected] of Object.entries(proof.files))assert.equal(hash(read(`${samples}/${file}`)),expected);
assert.equal(lifecycle.records[0].outputSha256,proof.files['pruefplan-geschwaerzt.pdf']);assert.equal(lifecycle.records[1].inputSha256,lifecycle.records[0].outputSha256);
assert.equal(lifecycle.records[2].outputSha256,proof.files['pruefplan-bereinigt.pdf']);assert.equal(lifecycle.records[3].inputSha256,lifecycle.records[2].outputSha256);
assert.equal(proof.redaction.targetAbsentFromExtractedTextAndDecodedObjects,true);assert.equal(proof.redaction.otherPageTextPreserved,true);
assert.equal(proof.sanitation.originalInfoAndJavaScriptRemoved,true);assert.deepEqual(proof.sanitation.directPageAttachmentsAfter,proof.sanitation.directPageAttachmentsBefore);
assert.equal(proof.sanitation.directPageAttachmentsAfter.length,1);assert.equal(ui.status,'passed');assert.equal(ui.shots.length,7);
for(const shot of ui.shots){const bytes=read(`${output}/${shot.file}`);assert.equal(hash(bytes),shot.sha256);assert.equal(bytes.readUInt16BE(0),0xffd8);assert.equal(shot.width,3420);assert.equal(shot.height,2146);}
const manifestPath='src/localization/walkthrough-media.json',manifest=JSON.parse(read(manifestPath)),pack=manifest.locales.de;
const inventory=JSON.parse(read('docs/localization/source-inventory.json'));
// The current UI confirms a region immediately. Bind the old marked/confirmation/applied
// slots to actual confirmation/applied/reopened states and source-bound captions accordingly.
const bindings=[
['redaction-reopened-search-no-matches','schwaerzen-wieder-geoeffnet','Deutsches PolyPDF nach vollständigem Neustart mit pruefplan-geschwaerzt.pdf: schwarze Fläche über der Kennung und Keine Treffer für VORGANG-LINDE-742'],
['redaction-lab-before','schwaerzen-vorher','Deutsches PolyPDF mit einem Suchtreffer für VORGANG-LINDE-742 auf dem fiktiven A3-Plan Bürgerhaus Lindenhof'],
['redaction-marked-text','schwaerzen-bestaetigen','Deutscher Dialog Schwärzung anwenden nach dem Zeichnen des Bereichs über der fiktiven Kennung'],
['redaction-apply-confirmation','schwaerzen-angewendet','Deutsches PolyPDF nach Anwendung der Schwärzung mit schwarzer Kennungsfläche und Keine Treffer im Suchbereich'],
['redaction-applied-result','schwaerzen-wieder-geoeffnet','Deutsches PolyPDF nach vollständigem Neustart mit pruefplan-geschwaerzt.pdf: schwarze Fläche über der Kennung und Keine Treffer für VORGANG-LINDE-742'],
['sanitize-options','bereinigen-optionen','Deutscher Dialog Dokument bereinigen mit aktivierten Optionen für Metadaten, Miniaturen, Anhänge und JavaScript; Formularentfernung ausgeschaltet'],
['sanitize-result','bereinigen-ergebnis','Deutsches PolyPDF nach Dokumentbereinigung mit sichtbarer Kennung, zwei Rasterdetails und weiterhin vorhandenem direkten Seitenanhang']
];
for(const [kind,file,alt] of bindings){
 const source=inventory.assets.find(a=>a.source.startsWith(`/static/media/${kind}-v1-4-light-web.`));assert.ok(source);
 const sourcePath=`src/assets/screenshots/${kind}-v1-4-light-web.png`;assert.equal(hash(read(sourcePath)),source.sha256);
 const shot=ui.shots.find(s=>s.file===file+'.jpg');assert.ok(shot);
 const record={url:`/localized-media/de/guides/redaction/${shot.file}`,locale:'de-DE',region:'DE',status:'verified',appBuild:'1.6.17+84',sourcePath,sourceSha256:source.sha256,sha256:shot.sha256,width:shot.width,height:shot.height,alt,verification:profile.evidence};
 pack.assets[source.source]=record;
 if(kind==='redaction-reopened-search-no-matches')pack.assets['/guides/redact-and-sanitize-pdf.png']={...record,sourcePath:'public/guides/redact-and-sanitize-pdf.png',sourceSha256:hash(read('public/guides/redact-and-sanitize-pdf.png'))};
}
pack.pages={...pack.pages,'/blog/redact-and-sanitize-pdf':profile};save(manifestPath,manifest);
const renderHash=hash(read('docs/localization/redaction-de/render/bereinigt.png'));assert.equal(renderHash,hash(read('docs/localization/redaction-de/render/bereinigen-quelle.png')));
save(`${output}/verification.json`,{status:'passed',locale:'de-DE',region:'DE',build:lifecycle.build,runnerSha256:lifecycle.runnerSha256,lifecycleSha256:proof.lifecycleSha256,uiVerificationSha256:hash(read(`${audit}/ui-verification.json`)),profileSha256:hash(read('scripts/localization/redaction-de.json')),exportVerificationSha256:hash(read(`${samples}/export-verification.json`)),shots:ui.shots,checks:ui.checks,visualReview:ui.visualReview,sanitizedSourceAndOutputRenderSha256:renderHash,limitations:[...proof.limitations,'English native macOS Save controls follow the host OS language; application chrome and document text are German.','The direct page attachment remains byte-for-byte after cleanup; the guide explicitly documents it.','Local Mac development build only; no released-installer, Windows or iPad qualification.','One completed German route within a pilot pack; no production publication.']});
console.log(`German redaction registered: ${Object.keys(pack.assets).length} asset mappings; ${Object.values(pack.pages).filter(p=>p.status==='complete').length} completed routes.`);
