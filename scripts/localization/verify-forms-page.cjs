'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom'),{assetPath,needsLocalization}=require('./media.cjs');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),route='/blog/create-fillable-pdf-form';
const bytes=read(`build/de${route}/index.html`),d=new JSDOM(bytes.toString()).window.document;
const manifest=JSON.parse(read('src/localization/walkthrough-media.json')),profile=JSON.parse(read('scripts/localization/forms-de.json'));
const receipt=JSON.parse(read('public/localized-media/de/guides/forms/verification.json'));
assert.deepEqual(manifest.locales.de.pages[route],profile);assert.equal(manifest.locales.de.status,'pilot');assert.equal(d.documentElement.lang,'de');
assert.equal(receipt.profileSha256,hash(read('scripts/localization/forms-de.json')));
assert.equal(receipt.captureScriptSha256,hash(read('scripts/localization/capture-forms-de.mjs')));
assert.equal(receipt.sourceHash,hash(read('public/localized-media/de/samples/forms-guide/planpruefung-vorlage.pdf')));
assert.equal(receipt.exportVerificationSha256,hash(read('public/localized-media/de/samples/forms-guide/export-verification.json')));
assert.deepEqual(receipt.filled,receipt.reopened);assert.equal(receipt.reopened.length,13);
for(const shot of receipt.shots)assert.equal(hash(read(`build/localized-media/de/guides/forms/${shot.file}`)),shot.sha256);
const neutral=new Set(manifest.languageNeutralAssets),images=[...d.querySelectorAll('img')].filter(n=>!neutral.has(assetPath(n.src)));
assert.equal(images.length,1);
for(const img of images){
 assert.ok(img.src.startsWith('/localized-media/de/'));
 const record=Object.values(manifest.locales.de.assets).find(a=>a.url===img.src);assert.ok(record);
 assert.equal(hash(read('build'+img.src)),record.sha256);assert.ok(img.alt.includes('elf Feldern'));
}
for(const entry of [...profile.links,...profile.downloads]){
 const anchor=[...d.querySelectorAll('a[href]')].find(n=>n.getAttribute('href')===entry.url&&n.textContent===entry.label);assert.ok(anchor,entry.label);
 assert.equal(anchor.lang,'de-DE');assert.equal(hash(read('build'+entry.url)),entry.sha256);
}
for(const a of d.querySelectorAll('a[href]'))if(needsLocalization(a.href))assert.ok(assetPath(a.href).startsWith('/localized-media/de/'));
const hero='https://www.polypdf.com/localized-media/de/guides/forms/formular-wieder-geoeffnet.png';
for(const selector of ['meta[property="og:image"]','meta[name="twitter:image"]'])assert.equal(d.querySelector(selector).content,hero);
const schemas=[...d.querySelectorAll('script[type="application/ld+json"]')].map(n=>JSON.parse(n.textContent)),article=schemas.find(s=>s['@type']==='BlogPosting');
assert.equal(article.image.url,hero);assert.equal(article.image.width,1710);assert.equal(article.image.height,1073);
const prose=d.body.textContent.replace(/\s+/g,' ');
for(const text of ['Südflügel','Elektro','Nachverfolgung','pruefbereich','FollowUp','21. Oktober 2026','elf Felder','dreizehn Steuerelemente','absichtlich','Tab-Reihenfolge','13','Hardware-Tastatur'])assert.ok(prose.includes(text),text);
assert.ok(!/Site Inspection Checklist|1\.4\.0|1\.5\.0|1\.5\.1|ten-field|zehn Feldwerte|alle zehn Felder/.test(prose));
assert.equal(d.querySelectorAll('.blog-sources li').length,2);
assert.equal(d.querySelectorAll('[data-regional-form-alternative]').length,0);
assert.equal(d.querySelector('[data-regional-form-evidence]').textContent,profile.regionalForm.evidence);
for(const prefix of ['']){
 const original=new JSDOM(read(`build${prefix}${route}/index.html`).toString()).window.document;
 assert.ok(original.querySelector('.blog-hero-figure img').src.includes('forms-v1-4-light-web'));
 assert.ok(original.querySelector('a[href="/samples/forms/construction-review-form-fr.pdf"]'));
}
const files=['scripts/localization/forms-de.json','scripts/localization/prepare-forms-de.py','scripts/localization/capture-forms-de.mjs','scripts/localization/register-forms-de.cjs','scripts/localization/verify-forms-de.py','scripts/localization/verify-forms-page.cjs','scripts/localization/media.cjs','scripts/international/build.cjs','src/content/guides/create-fillable-pdf-form.js','src/localization/walkthrough-media.json'];
fs.mkdirSync(path.join(root,'public/localized-media/de/guides114'),{recursive:true});
fs.writeFileSync(path.join(root,'public/localized-media/de/guides114/forms-page-verification.json'),JSON.stringify({status:'passed',route:'/de'+route+'/',htmlSha256:hash(bytes),localizedImages:images.length,localizedPdfDownloads:2,localizedCsvDownloads:1,sourceFiles:Object.fromEntries(files.map(f=>[f,hash(read(f))])),checks:['German actual app hero and social image','Source and native saved PDF plus eleven-field map verified by hash','Eleven canonical values and thirteen widgets survive native Save and full app restart','Guide explains added list field, stable keys, configured tab order and intentionally missing required checkbox','English source retained; new regional guides validated separately'],evidenceScope:'Historical native captures and output receipts retain their original version and scope; this check validates website integration.',limitations:['No new end-to-end qualification of every historical German workflow','No new Windows or native iPad qualification']},null,2)+'\n');
console.log('German forms page verified: regional hero, two PDFs, field map and native eleven-field reopen evidence.');
