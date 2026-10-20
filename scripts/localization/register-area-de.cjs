'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const read=file=>fs.readFileSync(path.join(root,file));
const save=(file,data)=>fs.writeFileSync(path.join(root,file),JSON.stringify(data,null,2)+'\n');
const input='.tmp/localization/area-de',output='public/localized-media/de/guides/area';
const report=JSON.parse(read(`${input}/validation.json`));
assert.equal(report.status,'passed');assert.equal(report.locale,'de-DE');assert.equal(report.platform,'darwin');
assert.equal(report.captureScriptSha256,hash(read('scripts/localization/capture-area-de.mjs')));
assert.equal(report.sourceSha256,hash(read('public/localized-media/de/samples/area/bodenplatte-aussparungen-uebung.pdf')));
assert.equal(report.actual.annotations.length,1);
const annotation=report.actual.annotations[0];
assert.equal(annotation.tool,'areaMeasurement');assert.equal(annotation.areaCutouts.length,2);
assert.equal(annotation.measurementDepthUnit,'m');assert.equal(annotation.measurementDepth,.15);
for(const [name,expected] of Object.entries({width:12,height:8,gross:96,net:86,volume:12.9})){
 assert.equal(report.measurements[name].expected,expected);
 assert.ok(Math.abs(report.measurements[name].value-expected)<.0001,name);
}
assert.equal(report.actual.language,'de-DE');
const files=['bruttoflaeche.png','nettoflaeche-zwei-aussparungen.png','volumen-mit-tiefe.png'];
assert.deepEqual(report.shots.map(s=>s.file),files);
fs.mkdirSync(path.join(root,output),{recursive:true});
for(const shot of report.shots){const bytes=read(`${input}/${shot.file}`);assert.equal(hash(bytes),shot.sha256);fs.writeFileSync(path.join(root,output,shot.file),bytes);}
const manifestPath='src/localization/walkthrough-media.json',manifest=JSON.parse(read(manifestPath)),pack=manifest.locales.de;
const profile=JSON.parse(read('scripts/localization/area-de.json'));
const inventory=JSON.parse(read('docs/localization/source-inventory.json'));
const name='area-cutouts-depth-v1-4-dark-web',source=inventory.assets.find(item=>item.source.startsWith(`/static/media/${name}.`));
const sourcePath=`src/assets/screenshots/${name}.png`;
assert.equal(hash(read(sourcePath)),source.sha256);
const hero={url:'/localized-media/de/guides/area/volumen-mit-tiefe.png',locale:'de-DE',region:'DE',status:'verified',appBuild:'1.6.17+84',sourcePath,sourceSha256:source.sha256,sha256:hash(read(`${output}/volumen-mit-tiefe.png`)),width:1710,height:1073,alt:'Deutsche PolyPDF-Oberfläche mit Bodenplatte S-102, zwei inneren Aussparungen und 12,90 m³ bei 0,15 m Tiefe',verification:profile.evidence};
pack.assets[source.source]=hero;
pack.assets['/guides/measure-pdf-area-cutouts-depth.png']={...hero,sourcePath:'public/guides/measure-pdf-area-cutouts-depth.png',sourceSha256:hash(read('public/guides/measure-pdf-area-cutouts-depth.png'))};
pack.pages={...pack.pages,'/blog/measure-pdf-area-cutouts-depth':profile};
const takeoffPath='scripts/localization/regional-takeoff-de.json',takeoff=JSON.parse(read(takeoffPath));
takeoff.text['takeoff.area.source'].target='Nutzen Sie für diese zusätzliche Übung den deutschen Bodenbelagsplan F-101, Übungsausgabe B: Raum 1 misst 6,00 m × 3,60 m mit einer randverbundenen Aussparung von 1,20 m × 0,90 m. Raum 2 misst 4,50 m × 3,60 m. Der Plan hat Maßstab 1:50 auf A2. Die deutsche App-Aufnahme am Seitenanfang zeigt dagegen S-102 mit zwei inneren Öffnungen.';
pack.regionalText['takeoff.area.source']=takeoff.text['takeoff.area.source'];
save(takeoffPath,takeoff);save(manifestPath,manifest);
save(`${output}/verification.json`,{
 status:'passed',locale:report.locale,region:report.region,platform:report.platform,build:report.build,
 sourcePdf:'/localized-media/de/samples/area/'+report.sourcePdf,sourceSha256:report.sourceSha256,
 captureScriptSha256:report.captureScriptSha256,profileSha256:hash(read('scripts/localization/area-de.json')),
 capture:report.capture,calibration:report.calibration,measurements:report.measurements,
 geometry:{x:annotation.x,y:annotation.y,points:annotation.points,cutouts:annotation.areaCutouts,pointsPerMetre:annotation.scale.pointsPerUnitAtCreation,depthMetres:annotation.measurementDepth},
 viewport:report.actual.viewport,shots:report.shots,
 visualReview:'Gross, two-cutout net area and depth/volume captures individually inspected; actual German UI and German source drawing.',
 limitations:report.limitations
});
console.log('Registered German area/volume guide with actual screenshot, regional source PDF and calculation records.');
