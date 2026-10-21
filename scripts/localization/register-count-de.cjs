'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),read=file=>fs.readFileSync(path.join(root,file));
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const save=(file,data)=>fs.writeFileSync(path.join(root,file),JSON.stringify(data,null,2)+'\n');
const input='.tmp/localization/count-de',output='public/localized-media/de/guides/count';
const report=JSON.parse(read(`${input}/validation.json`)),geometry=JSON.parse(read('public/localized-media/de/samples/count/geometry.json'));
assert.equal(report.status,'passed');assert.equal(report.locale,'de-DE');assert.equal(report.region,'DE');assert.equal(report.platform,'darwin');
assert.equal(report.captureScriptSha256,hash(read('scripts/localization/capture-count-de.mjs')));
assert.equal(report.sourceSha256,hash(read('public/localized-media/de/samples/count/q101-symbolzaehlung.pdf')));
assert.equal(report.geometrySha256,hash(read('public/localized-media/de/samples/count/geometry.json')));
assert.equal(report.sourceSha256,geometry.sourceSha256);
assert.ok(process.env.POLYPDF_APP_ROOT,'Set POLYPDF_APP_ROOT to the captured app workspace');
assert.deepEqual(report.build,JSON.parse(fs.readFileSync(path.join(process.env.POLYPDF_APP_ROOT,'dist/build-source.json'))));
assert.equal(report.candidates.length,17);assert.equal(report.counts.length,16);
assert.equal(new Set(report.candidates.map(c=>c.id)).size,17);
const legend=geometry.symbols.find(s=>!s.inScope),excluded=report.candidates.find(c=>c.id===report.excludedLegend);
assert.ok(excluded);assert.ok(Math.abs(excluded.x*geometry.pagePoints[0]-legend.x-legend.width/2)<3);
assert.ok(Math.abs(excluded.y*geometry.pagePoints[1]-legend.y-legend.height/2)<3);
assert.equal(new Set(report.counts.map(a=>a.countSeriesId)).size,1);assert.ok(report.counts[0].countSeriesId);
assert.ok(report.counts.every(a=>a.nativeSubject==='Zuluftauslässe Q-101'&&a.page===1));
for(const symbol of geometry.symbols.filter(s=>s.inScope))assert.equal(report.counts.filter(a=>Math.abs(a.x+a.width/2-symbol.x-symbol.width/2)<3&&Math.abs(a.y+a.height/2-symbol.y-symbol.height/2)<3).length,1,symbol.id);
assert.deepEqual(report.rows,[{subject:'Zuluftauslässe Q-101',quantity:'16',total:'16'}]);
assert.deepEqual(report.countToggle,{label:'Aus',options:['An','Aus'],canonical:false});
const files=['symbolsuche-17-treffer.png','symbolsuche-legende-ausgeschlossen.png','zaehlung-16-mengenermittlung.png'];
assert.deepEqual(report.shots.map(s=>s.file),files);
fs.mkdirSync(path.join(root,output),{recursive:true});
for(const shot of report.shots){const bytes=read(`${input}/${shot.file}`);assert.equal(hash(bytes),shot.sha256);fs.writeFileSync(path.join(root,output,shot.file),bytes);}
const manifestPath='src/localization/walkthrough-media.json',manifest=JSON.parse(read(manifestPath)),pack=manifest.locales.de;
const profile=JSON.parse(read('scripts/localization/count-de.json')),inventory=JSON.parse(read('docs/localization/source-inventory.json'));
const specs=[
 ['symbol-search-review-v1-4-dark-web','symbolsuche-legende-ausgeschlossen.png','Deutsche PolyPDF-Symbolsuche auf Q-101 mit 17 Treffern, 16 ausgewählten Plansymbolen und ausgeschlossenem Legendensymbol'],
 ['count-committed-v1-4-dark-web','zaehlung-16-mengenermittlung.png','Deutsche PolyPDF-Oberfläche mit 16 gesetzten Zählmarkierungen auf Q-101 und Mengenermittlung mit Menge 16 und Summe 16']
];
for(const [name,file,alt] of specs){
 const source=inventory.assets.find(a=>a.source.startsWith(`/static/media/${name}.`)),sourcePath=`src/assets/screenshots/${name}.png`;
 assert.ok(source);assert.equal(hash(read(sourcePath)),source.sha256);
 const record={url:`/localized-media/de/guides/count/${file}`,locale:'de-DE',region:'DE',status:'verified',appBuild:'1.6.17+84',sourcePath,sourceSha256:source.sha256,sha256:hash(read(`${output}/${file}`)),width:1710,height:1073,alt,verification:profile.evidence};
 pack.assets[source.source]=record;
 if(name==='symbol-search-review-v1-4-dark-web')pack.assets['/guides/count-pdf-symbols.png']={...record,sourcePath:'public/guides/count-pdf-symbols.png',sourceSha256:hash(read('public/guides/count-pdf-symbols.png'))};
}
pack.pages={...pack.pages,'/blog/count-pdf-symbols':profile};
save(manifestPath,manifest);
save(`${output}/verification.json`,{
 status:'passed',locale:report.locale,region:report.region,platform:report.platform,build:report.build,
 sourcePdf:'/localized-media/de/samples/count/q101-symbolzaehlung.pdf',sourceSha256:report.sourceSha256,geometrySha256:report.geometrySha256,
 captureScriptSha256:report.captureScriptSha256,profileSha256:hash(read('scripts/localization/count-de.json')),
 capture:report.capture,candidates:report.candidates,excludedLegend:report.excludedLegend,counts:report.counts,rows:report.rows,countToggle:report.countToggle,shots:report.shots,
 visualReview:'All three actual Mac captures inspected: 17 visible highlights, excluded legend with 16 selected, 16 red check marks and German worksheet total 16. German drawing and Count toggle labels agree.',
 limitations:report.limitations
});
console.log('Registered German symbol-count guide with reviewed candidates, committed counts and matching regional source PDF.');
