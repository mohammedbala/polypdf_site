'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const read=file=>fs.readFileSync(path.join(root,file));
const save=(file,data)=>fs.writeFileSync(path.join(root,file),JSON.stringify(data,null,2)+'\n');
const input='.tmp/localization/calibration-de';
const output='public/localized-media/de/guides/calibration';
const report=JSON.parse(read(`${input}/validation.json`));
assert.equal(report.status,'passed');
assert.equal(report.locale,'de-DE');
assert.equal(report.platform,'darwin');
assert.equal(report.captureScriptSha256,hash(read('scripts/localization/capture-calibration-de.mjs')));
assert.equal(report.sourceSha256,hash(read('public/localized-media/de/samples/takeoff/bodenbelag-uebung.pdf')));
assert.equal(report.actual.annotations.length,1);
const annotation=report.actual.annotations[0],points=annotation.points;
const actualMetres=Math.hypot(points[1].x-points[0].x,points[1].y-points[0].y)/annotation.scale.pointsPerUnitAtCreation;
assert.ok(Math.abs(actualMetres-3.6)<0.000001);
assert.equal(annotation.scale.unitNameAtCreation,'m');
assert.equal(report.actual.language,'de-DE');
fs.mkdirSync(path.join(root,output),{recursive:true});
for(const shot of report.shots){
  const bytes=read(`${input}/${shot.file}`);
  assert.equal(hash(bytes),shot.sha256);
  fs.writeFileSync(path.join(root,output,shot.file),bytes);
}
const manifestPath='src/localization/walkthrough-media.json';
const manifest=JSON.parse(read(manifestPath)),pack=manifest.locales.de;
const profile=JSON.parse(read('scripts/localization/calibration-de.json'));
const inventory=JSON.parse(read('docs/localization/source-inventory.json'));
const images=[
  ['calibration-uncalibrated-v1-4-dark-web','massstab-nicht-gesetzt.png','Deutscher F-101-Plan mit 6,00-m-Breite und 3,60-m-Höhe neben dem Status Maßstab nicht gesetzt'],
  ['calibration-known-distance-dialog-v1-4-dark-web','bekannte-strecke.png','Deutscher Kalibrierungsdialog mit erfassten 340,158 PDF-Punkten und eingegebener bekannter Distanz 6 m'],
  ['calibration-verified-second-span-v1-4-dark-web','unabhaengige-hoehenpruefung.png','Deutsche PolyPDF-Oberfläche mit kalibriertem F-101-Bodenbelagsplan und ausgewählter Höhenprüfung von 3,60 m']
];
for(const [name,file,alt] of images){
  const source=inventory.assets.find(item=>item.source.startsWith(`/static/media/${name}.`));
  assert.ok(source,`Missing original screenshot: ${name}`);
  const sourcePath=`src/assets/screenshots/${name}.png`;
  assert.equal(hash(read(sourcePath)),source.sha256);
  pack.assets[source.source]={url:`/localized-media/de/guides/calibration/${file}`,locale:'de-DE',region:'DE',status:'verified',appBuild:'1.6.17+84',sourcePath,sourceSha256:source.sha256,sha256:hash(read(`${output}/${file}`)),width:1710,height:1073,alt,verification:profile.evidence};
}
const hero=pack.assets[inventory.assets.find(item=>item.source.startsWith('/static/media/calibration-verified-second-span-v1-4-dark-web.')).source];
pack.assets['/guides/calibrate-pdf-drawing-scale.png']={...hero,sourcePath:'public/guides/calibrate-pdf-drawing-scale.png',sourceSha256:hash(read('public/guides/calibrate-pdf-drawing-scale.png'))};
pack.pages={...pack.pages,'/blog/calibrate-pdf-drawing-scale':profile};
const takeoffPath='scripts/localization/regional-takeoff-de.json';
const takeoff=JSON.parse(read(takeoffPath));
takeoff.text['takeoff.calibration.older'].target=' Die deutschen Screenshots zeigen denselben F-101-Übungsplan. Der zusätzlich verlinkte Architekturplan A101 ist eine eigene Übung mit anderen Abmessungen.';
takeoff.text['takeoff.calibration.evidence'].target='Im deutschen Mac-Entwicklungsstand von PolyPDF 1.6.17 Build 84 wurde die 6,00-m-Breite mit Zeigergesten kalibriert und die unabhängige Höhe als 3,60 m gemessen. Die zusätzliche 4,50-m-Prüfung, das Nachzeichnen der Nettofläche und das Speichern sind hier Übungsschritte, kein vollständig aufgezeichneter Durchlauf. Die verlinkten deutschen Mac-Exporte prüfen separat das Wiederöffnen und Exportieren vorbereiteter Flächen. Windows und natives iPad sind für diesen Kalibrierungsdurchlauf nicht geprüft.';
for(const key of ['takeoff.calibration.older','takeoff.calibration.evidence'])pack.regionalText[key]=takeoff.text[key];
save(takeoffPath,takeoff);
save(manifestPath,manifest);
save(`${output}/verification.json`,{
  status:'passed',locale:report.locale,region:report.region,platform:report.platform,build:report.build,
  sourcePdf:'/localized-media/de/samples/takeoff/bodenbelag-uebung.pdf',sourceSha256:report.sourceSha256,
  captureScriptSha256:report.captureScriptSha256,profileSha256:hash(read('scripts/localization/calibration-de.json')),
  capture:report.capture,calibration:report.calibration,
  independentCheck:{expectedMetres:3.6,actualMetres,display:'3,60 m',points,pointsPerMetre:annotation.scale.pointsPerUnitAtCreation},
  viewport:report.actual.viewport,shots:report.shots,
  visualReview:'All three full-size app captures reviewed: German drawing and controls, visible 6 m input, calibrated ratio, independent 3,60 m reading.',
  limitations:report.limitations
});
console.log('Registered three actual German app screenshots and matching article metadata for one complete pilot route.');
