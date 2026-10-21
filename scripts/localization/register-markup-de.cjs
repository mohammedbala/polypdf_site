'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),save=(f,o)=>fs.writeFileSync(path.join(root,f),JSON.stringify(o,null,2)+'\n');
const input='.tmp/localization/markup-de',output='public/localized-media/de/guides/markup',samples='public/localized-media/de/samples/markup';
const report=JSON.parse(read(`${input}/validation.json`)),exportsProof=JSON.parse(read(`${samples}/export-verification.json`));
assert.equal(report.status,'passed');assert.equal(report.locale,'de-DE');assert.equal(report.region,'DE');assert.equal(report.platform,'darwin');
assert.equal(report.captureScriptSha256,hash(read('scripts/localization/capture-markup-de.mjs')));
assert.ok(process.env.POLYPDF_APP_ROOT,'Set POLYPDF_APP_ROOT to the captured app workspace');
assert.deepEqual(report.build,JSON.parse(fs.readFileSync(path.join(process.env.POLYPDF_APP_ROOT,'dist/build-source.json'))));
assert.equal(report.sourceHash,hash(read(`${samples}/x101-koordinationspruefung.pdf`)));
assert.equal(exportsProof.nativeCaptureSha256,hash(read(`${input}/validation.json`)));
assert.equal(exportsProof.status,'passed');assert.equal(exportsProof.summaryPixelsUnchanged,true);
assert.deepEqual(report.reopenedNotes,report.reviewedNotes);
assert.deepEqual(report.rows.map(r=>r.status),['Offen','In Bearbeitung','Abgeschlossen']);
assert.deepEqual(report.filteredRows.map(r=>r.status),['Offen','In Bearbeitung']);
assert.deepEqual(report.columnHeaders,['Betreff','Status','Seite','Kommentare','Autor']);
for(const [file,expected] of Object.entries(exportsProof.files))assert.equal(hash(read(`${samples}/${file}`)),expected);
assert.deepEqual(report.shots.map(s=>s.file),['pruefregister-drei-status.png','pruefregister-filter.png','pruefregister-exportoptionen.png','pruefregister-wieder-geoeffnet.png']);
fs.mkdirSync(path.join(root,output),{recursive:true});
for(const shot of report.shots){const bytes=read(`${input}/${shot.file}`);assert.equal(hash(bytes),shot.sha256);fs.writeFileSync(path.join(root,output,shot.file),bytes);}
const profile=JSON.parse(read('scripts/localization/markup-de.draft.json'));
profile.status='complete';
const download=(file,label,note)=>({url:`/localized-media/de/samples/markup/${file}`,label,note,sha256:hash(read(`${samples}/${file}`))});
profile.links=[{
 selector:'#construction-example-review a[href="/localized-media/de/samples/construction/11-Koordination-und-Pruefung.pdf"]',
 source:'/localized-media/de/samples/construction/11-Koordination-und-Pruefung.pdf',labelSelector:'span',
 ...download('x101-koordinationspruefung.pdf','X101: Deutschen Übungsplan herunterladen (PDF)')
}];
profile.downloads=[{
 selector:'.blog-sources li:nth-child(1)',
 source:'PolyPDF 1.5.0 (build 22) Markups List implementation and in-app guidance — Covers the row fields, status vocabulary, filtering, selection, and export formats described above.',
 ...download('x101-pruefregister.pdf','Gespeicherte deutsche Prüfkopie herunterladen (PDF)','Drei bearbeitbare Prüfnotizen mit den Statuswerten Offen, In Bearbeitung und Abgeschlossen; nach einem vollständigen App-Neustart geprüft.')
},{
 selector:'.blog-sources li:nth-child(2)',
 source:'The sample clinic coordination sheet shown in this guide — Three markups in the Markup Table with comments and the Open, In Progress, and Completed statuses.',
 ...download('pruefregister.csv','Vollständiges deutsches Prüfregister herunterladen (CSV)','Drei Datensätze und fünf Spalten, einschließlich vollständiger Betreffzeilen und Kommentare.')
}];
profile.extraDownloads=[download('pruefregister-zusammenfassung.pdf','Deutsche Anmerkungsübersicht herunterladen (PDF)','Nach Status gruppiert, jeweils ein Prüfpunkt. Lange Detailtexte sind gekürzt; vollständige Inhalte stehen in CSV und Prüfkopie. Die öffentlichen Quellenlinks öffnen Seite 1 der Prüfkopie.')];
save('scripts/localization/markup-de.json',profile);
const manifestPath='src/localization/walkthrough-media.json',manifest=JSON.parse(read(manifestPath)),pack=manifest.locales.de;
const inventory=JSON.parse(read('docs/localization/source-inventory.json'));
const source=inventory.assets.find(a=>a.source.startsWith('/static/media/markup-v1-4-dark-web.'));
assert.ok(source);const sourcePath='src/assets/screenshots/markup-v1-4-dark-web.png';assert.equal(hash(read(sourcePath)),source.sha256);
const record={url:'/localized-media/de/guides/markup/pruefregister-wieder-geoeffnet.png',locale:'de-DE',region:'DE',status:'verified',appBuild:'1.6.17+84',sourcePath,sourceSha256:source.sha256,sha256:hash(read(`${output}/pruefregister-wieder-geoeffnet.png`)),width:1710,height:1073,alt:'Deutsche PolyPDF-Oberfläche mit wieder geöffneter X101-Prüfkopie und drei Anmerkungszeilen: Offen, In Bearbeitung und Abgeschlossen',verification:profile.evidence};
pack.assets[source.source]=record;
pack.assets['/guides/pdf-markup-table-rfi-punch-list.png']={...record,sourcePath:'public/guides/pdf-markup-table-rfi-punch-list.png',sourceSha256:hash(read('public/guides/pdf-markup-table-rfi-punch-list.png'))};
pack.pages={...pack.pages,'/blog/pdf-markup-table-rfi-punch-list':profile};save(manifestPath,manifest);
save(`${output}/verification.json`,{...report,profileSha256:hash(read('scripts/localization/markup-de.json')),exportVerificationSha256:hash(read(`${samples}/export-verification.json`)),visualReview:'All four Mac frames inspected: German drawing/table, two-row status filter, five selected export fields with Status grouping, and fresh reopened three-row register. Saved drawing and every summary page inspected; no overlap or missing glyphs. Summary shortens long detail text by design; CSV and editable PDF preserve complete content.',limitations:[...report.limitations,...exportsProof.limitations]});
console.log('Registered German review guide: native save, CSV, summary and fresh-process reopen verified.');
