'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom'),{assetPath,needsLocalization}=require('./media.cjs');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),route='/blog/pdf-markup-table-rfi-punch-list';
const bytes=read(`build/de${route}/index.html`),d=new JSDOM(bytes.toString()).window.document;
const manifest=JSON.parse(read('src/localization/walkthrough-media.json')),profile=JSON.parse(read('scripts/localization/markup-de.json'));
assert.deepEqual(manifest.locales.de.pages[route],profile);assert.equal(manifest.locales.de.status,'pilot');assert.equal(d.documentElement.lang,'de');
const receipt=JSON.parse(read('public/localized-media/de/guides/markup/verification.json'));
assert.equal(receipt.profileSha256,hash(read('scripts/localization/markup-de.json')));
assert.equal(receipt.captureScriptSha256,hash(read('scripts/localization/capture-markup-de.mjs')));
assert.equal(receipt.sourceHash,hash(read('public/localized-media/de/samples/markup/x101-koordinationspruefung.pdf')));
assert.equal(receipt.exportVerificationSha256,hash(read('public/localized-media/de/samples/markup/export-verification.json')));
assert.deepEqual(receipt.reopenedNotes,receipt.reviewedNotes);assert.equal(receipt.rows.length,3);assert.equal(receipt.filteredRows.length,2);
for(const shot of receipt.shots)assert.equal(hash(read(`build/localized-media/de/guides/markup/${shot.file}`)),shot.sha256);
const neutral=new Set(manifest.languageNeutralAssets),images=[...d.querySelectorAll('img')].filter(n=>!neutral.has(assetPath(n.src)));
assert.equal(images.length,2);
for(const img of images){
 assert.ok(img.src.startsWith('/localized-media/de/'));
 const record=Object.values(manifest.locales.de.assets).find(a=>a.url===img.src);assert.ok(record);
 assert.equal(hash(read('build'+img.src)),record.sha256);
 assert.ok(img.alt&&!/Willow|clinic|RFI callout/i.test(img.alt));
}
for(const entry of [...profile.links,...profile.downloads,...profile.extraDownloads]){
 const anchor=[...d.querySelectorAll('a[href]')].find(n=>n.getAttribute('href')===entry.url&&n.textContent===entry.label);assert.ok(anchor,entry.label);
 assert.equal(anchor.lang,'de-DE');assert.equal(hash(read('build'+entry.url)),entry.sha256);
}
for(const a of d.querySelectorAll('a[href]'))if(needsLocalization(a.href))assert.ok(assetPath(a.href).startsWith('/localized-media/de/'));
assert.equal(d.querySelectorAll('.blog-sources li').length,3);
const hero='https://www.polypdf.com/localized-media/de/guides/markup/pruefregister-wieder-geoeffnet.png';
for(const selector of ['meta[property="og:image"]','meta[name="twitter:image"]'])assert.equal(d.querySelector(selector).content,hero);
const schemas=[...d.querySelectorAll('script[type="application/ld+json"]')].map(n=>JSON.parse(n.textContent)),article=schemas.find(s=>s['@type']==='BlogPosting');
assert.equal(article.image.url,hero);assert.equal(article.image.width,1710);assert.equal(article.image.height,1073);
const prose=d.body.textContent.replace(/\s+/g,' ');
for(const word of ['PR-001 - Lüftungsdurchführung','PR-002 - Deckenkoordination','PR-003 - Kabeldurchführung','In Bearbeitung','Abgeschlossen','Abgebrochen','Akzeptiert','Überprüft','fünf Spalten','zwei Zeilen','21. Oktober 2026'])assert.ok(prose.includes(word),word);
assert.ok(!/Willow Creek|Room 302|18 inches|1\.4\.0|1\.5\.0|1\.5\.4|Geprüft|Angenommen/.test(prose));
assert.equal(d.querySelector('#construction-example-review figcaption bdi').textContent,'x101-koordinationspruefung.pdf');
assert.equal(d.querySelector('#construction-example-review .construction-example-sheets bdi').textContent,'X101');
assert.ok(prose.includes('Lange Detailtexte sind gekürzt'));
for(const prefix of ['', '/es']){
 const original=new JSDOM(read(`build${prefix}${route}/index.html`).toString()).window.document;
 assert.ok(original.querySelector('.blog-hero-figure img').src.includes('markup-v1-4-dark-web'));
 assert.equal(original.querySelectorAll('.blog-sources li').length,2);
 assert.ok(!original.querySelector('.blog-sources a'));
}
const files=['scripts/localization/pages.cjs','scripts/localization/markup-de.json','scripts/localization/prepare-markup-de.py','scripts/localization/capture-markup-de.mjs','scripts/localization/register-markup-de.cjs','scripts/localization/verify-markup-pdfs.py','scripts/localization/verify-markup-page.cjs','src/content/guides/pdf-markup-table-rfi-punch-list.js','src/localization/walkthrough-media.json'];
fs.writeFileSync(path.join(root,'public/localized-media/de/guides/markup/page-verification.json'),JSON.stringify({status:'passed',route:'/de'+route+'/',htmlSha256:hash(bytes),localizedImages:images.length,localizedDownloads:4,sourceFiles:Object.fromEntries(files.map(f=>[f,hash(read(f))])),checks:['German hero and drawing preview with verified hashes','German source, saved PDF, complete CSV and public summary download links','All three reopened statuses and full comments agree with native exports','Summary shortening disclosed; full CSV and editable PDF provided','English and unfinished Spanish retain original media and source lists'],limitations:['One completed German route within a pilot pack; full rollout remains incomplete','Local Mac development capture; no released installer, Windows or native iPad qualification','No deployment']},null,2)+'\n');
console.log('German review page passed: regional images, four downloads, terminology, metadata and scope.');
