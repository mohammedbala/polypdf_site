'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const {assetPath,needsLocalization}=require('./media.cjs');
const root=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(root,file));
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const route='/blog/calibrate-pdf-drawing-scale';
const file=`build/de${route}/index.html`,bytes=read(file);
const d=new JSDOM(bytes.toString()).window.document;
const manifest=JSON.parse(read('src/localization/walkthrough-media.json'));
const profile=JSON.parse(read('scripts/localization/calibration-de.json'));
assert.deepEqual(manifest.locales.de.pages[route],profile);
assert.equal(manifest.locales.de.status,'pilot');
assert.equal(d.documentElement.lang,'de');
const neutral=new Set(manifest.languageNeutralAssets);
const images=[...d.querySelectorAll('img')].filter(img=>!neutral.has(assetPath(img.src)));
assert.equal(images.length,5);
for(const img of images){
  assert.ok(img.src.startsWith('/localized-media/de/'));
  assert.ok(img.alt && !/feet|foot|Willow|12-foot|20-foot/.test(img.alt));
  const record=Object.values(manifest.locales.de.assets).find(a=>a.url===img.src);
  assert.ok(record);
  assert.equal(hash(read('build'+img.src)),record.sha256);
  assert.equal(img.width,record.width);
  assert.equal(img.height,record.height);
}
const downloads=[...d.querySelectorAll('a[href]')].filter(a=>needsLocalization(a.href));
assert.ok(downloads.length>=3);
for(const a of downloads){
  const local=assetPath(a.href);if(local&&!neutral.has(local))assert.ok(local.startsWith('/localized-media/de/'),local);
}
const hero='https://www.polypdf.com/localized-media/de/guides/calibration/unabhaengige-hoehenpruefung.png';
assert.equal(d.querySelector('meta[property="og:image"]').content,hero);
assert.equal(d.querySelector('meta[name="twitter:image"]').content,hero);
const schemas=[...d.querySelectorAll('script[type="application/ld+json"]')].map(n=>JSON.parse(n.textContent));
const article=schemas.find(s=>s['@type']==='BlogPosting');
assert.equal(article.image.url,hero);
assert.equal(article.image.width,1710);
assert.ok(article.image.caption.includes('3,60 m'));
assert.ok(d.querySelector('meta[property="og:image:alt"]').content.includes('3,60 m'));
const prose=d.body.textContent.replace(/\s+/g,' ');
for(const expected of ['56,69292','340,158','3,60 m','6,00 m','360,00 m²','24,00 m','15,00 m'])assert.ok(prose.includes(expected),expected);
assert.ok(!/Willow Creek|18 PDF|20 ft|12 ft|1\.4\.0|5,760|5\.760/.test(prose));
for(const node of d.querySelectorAll('[alt],[aria-label],[title]')){
  for(const attribute of ['alt','aria-label','title'])assert.ok(!/18 PDF|20-Fuß|12-Fuß|20 feet|12-foot|360 erfassten/.test(node.getAttribute(attribute)||''),node.outerHTML);
}
assert.equal(d.querySelector('#construction-example-takeoff figcaption bdi').textContent,'02-Architektur-Revision-A.pdf');
assert.equal(d.querySelector('.blog-formula code').textContent,profile.elements.find(e=>e.selector==='.blog-formula code').target);
for(const entry of profile.elements)assert.equal(d.querySelector(entry.selector).textContent,entry.target);
const original=new JSDOM(read(`build${route}/index.html`).toString()).window.document;
assert.ok(original.querySelector('.blog-hero-figure img').src.includes('calibration-verified-second-span-v1-4-dark-web'));
const spanish=new JSDOM(read(`build/es${route}/index.html`).toString()).window.document;
assert.ok(spanish.querySelector('.blog-hero-figure img').src.includes('calibration-verified-second-span-v1-4-dark-web'));
const files=['scripts/international/build.cjs','scripts/international/verify.cjs','scripts/localization/media.cjs','scripts/localization/pages.cjs','scripts/localization/calibration-de.json','scripts/localization/capture-calibration-de.mjs','scripts/localization/register-calibration-de.cjs','scripts/localization/verify-calibration-page.cjs','src/content/guides/calibrate-pdf-drawing-scale.js','src/content/translations/de.json','src/lib/route-metadata.json','src/components/CalibrationPractice.js','src/components/BlogPost.js','src/localization/walkthrough-media.json'];
fs.writeFileSync(path.join(root,'public/localized-media/de/guides/calibration/page-verification.json'),JSON.stringify({
  status:'passed',route:'/de'+route+'/',htmlSha256:hash(bytes),localizedImages:images.length,localizedDownloads:downloads.length,
  sourceFiles:Object.fromEntries(files.map(file=>[file,hash(read(file))])),
  checks:['All five instructional images and drawing previews resolve to exact verified German bytes','All regional downloads point into the German media pack','Visible hero, Open Graph, Twitter and Article image agree','Captions, formulas, reference dimensions and verification scope match the German exercise','English and unfinished Spanish page retain their existing media'],
  limitations:['One complete German guide in an otherwise incomplete pilot pack','International stage exercised against the existing English prerender; no new React source change','No deployment']
},null,2)+'\n');
console.log('Verified German calibration page: five instructional images, regional downloads, metadata and source-bound metric copy.');
