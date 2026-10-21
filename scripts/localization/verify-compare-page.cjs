'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom'),{assetPath,needsLocalization}=require('./media.cjs');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f)),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const route='/blog/compare-pdf-drawing-revisions',bytes=read(`build/de${route}/index.html`),d=new JSDOM(bytes.toString()).window.document;
const manifest=JSON.parse(read('src/localization/walkthrough-media.json')),profile=JSON.parse(read('scripts/localization/compare-de.json'));
assert.deepEqual(manifest.locales.de.pages[route],profile);assert.equal(manifest.locales.de.status,'pilot');assert.equal(d.documentElement.lang,'de');
const receipt=JSON.parse(read('public/localized-media/de/guides/compare/verification.json'));
assert.equal(receipt.profileSha256,hash(read('scripts/localization/compare-de.json')));assert.equal(receipt.captureScriptSha256,hash(read('scripts/localization/capture-compare-de.mjs')));
assert.equal(receipt.originalClouds.length,12);assert.deepEqual(receipt.originalClouds,receipt.reopenedClouds);assert.equal(receipt.rows.length,14);assert.equal(receipt.sourceLinks.length,2);
for(const source of receipt.sources)assert.equal(hash(read('build'+source.url)),source.sha256);
assert.equal(hash(read('build'+receipt.savedPdf)),receipt.savedSha256);
for(const shot of receipt.shots)assert.equal(hash(read(`build/localized-media/de/guides/compare/${shot.file}`)),shot.sha256);
const neutral=new Set(manifest.languageNeutralAssets),images=[...d.querySelectorAll('img')].filter(img=>!neutral.has(assetPath(img.src)));
assert.equal(images.length,3);
for(const img of images){
 assert.ok(img.src.startsWith('/localized-media/de/'));const record=Object.values(manifest.locales.de.assets).find(a=>a.url===img.src);assert.ok(record);
 assert.equal(hash(read('build'+img.src)),record.sha256);assert.equal(img.width,record.width);assert.equal(img.height,record.height);assert.ok(img.alt&&!/Willow|four violet/.test(img.alt));
}
const downloads=[...d.querySelectorAll('a[href]')].filter(a=>needsLocalization(a.href));
for(const a of downloads){const local=assetPath(a.href);if(local&&!neutral.has(local))assert.ok(local.startsWith('/localized-media/de/'),local);}
for(const entry of [...profile.links,...profile.downloads]){
 const a=d.querySelector(`a[href="${entry.url}"]`);assert.ok(a,entry.url);assert.equal(a.textContent,entry.label);assert.equal(a.lang,'de-DE');assert.equal(hash(read('build'+entry.url)),entry.sha256);
}
assert.equal(d.querySelectorAll('#construction-example-compare a[download] img').length,2);
assert.equal(d.querySelector('#construction-example-compare figure:nth-child(1) figcaption bdi').textContent,'architektur-revision-a.pdf');
assert.equal(d.querySelector('#construction-example-compare figure:nth-child(2) figcaption bdi').textContent,'architektur-revision-b.pdf');
const hero='https://www.polypdf.com/localized-media/de/guides/compare/vergleich-wieder-geoeffnet.png';
for(const selector of ['meta[property="og:image"]','meta[name="twitter:image"]'])assert.equal(d.querySelector(selector).content,hero);
const schemas=[...d.querySelectorAll('script[type="application/ld+json"]')].map(n=>JSON.parse(n.textContent)),article=schemas.find(s=>s['@type']==='BlogPosting');
assert.equal(article.image.url,hero);assert.equal(article.image.width,1710);assert.equal(article.image.height,1073);assert.ok(article.image.caption.includes('zwölf'));
assert.ok(d.querySelector('meta[property="og:image:alt"]').content.includes('wieder geöffnetem'));
const prose=d.body.textContent.replace(/\s+/g,' ');
for(const expected of ['zwölf','neun auf A101','drei auf A201','14 Elemente','1,50 m','0,75 m','45,00 m²','27,00 m²','360,00 m²','20. Oktober 2026','27. Oktober 2026','App-Neustart'])assert.ok(prose.includes(expected),expected);
assert.ok(!/Willow Creek|Northline|5.760|576|720|432|1\.4\.0|1\.5\.0|1\.5\.1|vier.*Revisionswolken|Issue-Set|Zeichnungsproblem/.test(prose));
for(const n of d.querySelectorAll('[alt],[aria-label],[title]'))for(const a of ['alt','aria-label','title'])assert.ok(!/four violet|four visible|Willow/.test(n.getAttribute(a)||''));
for(const language of ['','/es']){
 const original=new JSDOM(read(`build${language}${route}/index.html`).toString()).window.document;
 assert.ok(original.querySelector('.blog-hero-figure img').src.includes('compare-editable-clouds-v1-4-dark-web'));
 assert.ok(!original.querySelector('.blog-sources a'));assert.ok(original.querySelector('a[href*="try-drawing-comparison"]'));
}
const files=['scripts/localization/pages.cjs','scripts/localization/compare-de.json','scripts/localization/prepare-compare-de.py','scripts/localization/verify-compare-pdfs.py','scripts/localization/capture-compare-de.mjs','scripts/localization/register-compare-de.cjs','scripts/localization/verify-compare-page.cjs','src/content/guides/compare-pdf-drawing-revisions.js','src/localization/walkthrough-media.json'];
fs.writeFileSync(path.join(root,'public/localized-media/de/guides/compare/page-verification.json'),JSON.stringify({status:'passed',route:'/de'+route+'/',htmlSha256:hash(bytes),localizedImages:images.length,localizedDownloads:downloads.length,sourceFiles:Object.fromEntries(files.map(f=>[f,hash(read(f))])),checks:['Three instructional images use hash-verified German assets','Both source PDFs and the saved comparison match the actual Mac capture','PDF download cards retain their previews and German accessible labels','Twelve German clouds, two original links, metric source changes and saved-reopen instructions agree','Hero, social and Article image metadata agree','English and unfinished Spanish retain their original media'],limitations:['Fourth completed German route within a pilot pack; global rollout remains incomplete','International transformation of existing English prerender; no full React rebuild','Local Mac development capture; Windows/native iPad and other PDF viewers not qualified','No deployment']},null,2)+'\n');
console.log('German comparison guide passed: localized images, regional PDFs, saved result, metric instructions and metadata agree.');
