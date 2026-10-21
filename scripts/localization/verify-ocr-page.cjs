'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom'),{assetPath,needsLocalization}=require('./media.cjs');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),route='/blog/ocr-scanned-pdf-drawings';
const bytes=read(`build/de${route}/index.html`),d=new JSDOM(bytes.toString()).window.document;
const manifest=JSON.parse(read('src/localization/walkthrough-media.json')),profile=JSON.parse(read('scripts/localization/ocr-de.json'));
const receipt=JSON.parse(read('public/localized-media/de/guides/ocr/verification.json'));
assert.deepEqual(manifest.locales.de.pages[route],profile);assert.equal(manifest.locales.de.status,'pilot');assert.equal(d.documentElement.lang,'de');
assert.equal(receipt.profileSha256,hash(read('scripts/localization/ocr-de.json')));
assert.equal(receipt.captureScriptSha256,hash(read('scripts/localization/capture-ocr-de.mjs')));
assert.equal(receipt.sourceHash,hash(read('public/localized-media/de/samples/ocr/bestandsplaene-a101-c101.pdf')));
assert.equal(receipt.exportVerificationSha256,hash(read('public/localized-media/de/samples/ocr/export-verification.json')));
assert.deepEqual(receipt.searches.reopen,receipt.searches.walkthrough);
for(const shot of receipt.shots)assert.equal(hash(read(`build/localized-media/de/guides/ocr/${shot.file}`)),shot.sha256);
const neutral=new Set(manifest.languageNeutralAssets),images=[...d.querySelectorAll('img')].filter(n=>!neutral.has(assetPath(n.src)));
assert.equal(images.length,4);
for(const img of images){
 assert.ok(img.src.startsWith('/localized-media/de/'));
 const record=Object.values(manifest.locales.de.assets).find(a=>a.url===img.src);assert.ok(record);
 assert.equal(hash(read('build'+img.src)),record.sha256);assert.ok(img.alt&&!/Willow|Akron|SURFACE|NACA/.test(img.alt));
}
for(const entry of [...profile.links,...profile.downloads]){
 const anchor=[...d.querySelectorAll('a[href]')].find(n=>n.getAttribute('href')===entry.url&&n.textContent===entry.label);assert.ok(anchor,entry.label);
 assert.equal(anchor.lang,'de-DE');assert.equal(hash(read('build'+entry.url)),entry.sha256);
}
for(const a of d.querySelectorAll('a[href]'))if(needsLocalization(a.href))assert.ok(assetPath(a.href).startsWith('/localized-media/de/'));
const hero='https://www.polypdf.com/localized-media/de/guides/ocr/ocr-suche-mehrzweckraum.png';
for(const selector of ['meta[property="og:image"]','meta[name="twitter:image"]'])assert.equal(d.querySelector(selector).content,hero);
const schemas=[...d.querySelectorAll('script[type="application/ld+json"]')].map(n=>JSON.parse(n.textContent)),article=schemas.find(s=>s['@type']==='BlogPosting');
assert.equal(article.image.url,hero);assert.equal(article.image.width,1710);assert.equal(article.image.height,1073);
const prose=d.body.textContent.replace(/\s+/g,' ');
for(const text of ['MEHRZWECKRAUM','ENTWÄSSERUNG','einen Treffer','Seite 2','21. Oktober 2026','Pages und Annotations','1 % Deckkraft','Darstellung in Excel wurde nicht geprüft'])assert.ok(prose.includes(text),text);
assert.ok(!/Willow Creek|U\.S\.S\.|Akron|SURFACE|NACA|NASA|1\.4\.0|1\.5\.0|1\.5\.1/.test(prose));
assert.equal(d.querySelectorAll('.blog-sources li').length,4);
assert.equal(d.querySelector('#construction-example-ocr figcaption bdi').textContent,'bestandsplaene-a101-c101.pdf');
for(const prefix of ['', '/es']){
 const original=new JSDOM(read(`build${prefix}${route}/index.html`).toString()).window.document;
 assert.ok(original.querySelector('.blog-hero-figure img').src.includes('ocr-uss-akron-search-hit'));
 assert.ok(original.querySelector('.blog-sources a[href="https://ntrs.nasa.gov/citations/19930091505"]'));
}
const files=['scripts/localization/ocr-de.json','scripts/localization/prepare-ocr-de.py','scripts/localization/capture-ocr-de.mjs','scripts/localization/register-ocr-de.cjs','scripts/localization/verify-ocr-de.py','scripts/localization/verify-ocr-page.cjs','src/content/guides/ocr-scanned-pdf-drawings.js','src/localization/walkthrough-media.json'];
fs.writeFileSync(path.join(root,'public/localized-media/de/guides/ocr/page-verification.json'),JSON.stringify({status:'passed',route:'/de'+route+'/',htmlSha256:hash(bytes),localizedImages:images.length,localizedPdfDownloads:2,sourceFiles:Object.fromEntries(files.map(f=>[f,hash(read(f))])),checks:['German actual app images and regional drawing preview','Original image-only scan and saved searchable PDF verified by hash','One search hit on each page survives a full app restart','Recognition errors, faint OCR rendering and incomplete Office localization disclosed','English and unfinished Spanish preserved'],limitations:['One completed German route within a pilot pack; full rollout remains incomplete','Local Mac development capture; no released installer, Windows or native iPad qualification','No deployment']},null,2)+'\n');
console.log('German OCR page verified: four images, two PDF downloads, actual search/reopen counts and regional copy.');
