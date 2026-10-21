'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom'),{assetPath,needsLocalization}=require('./media.cjs');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f)),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const route='/blog/create-interactive-pdf-stamps',bytes=read(`build/de${route}/index.html`),d=new JSDOM(bytes.toString()).window.document;
const manifest=JSON.parse(read('src/localization/walkthrough-media.json')),profile=JSON.parse(read('scripts/localization/stamps-de.json')),receipt=JSON.parse(read('public/localized-media/de/guides/stamps/verification.json'));
assert.deepEqual(manifest.locales.de.pages[route],profile);assert.equal(manifest.locales.de.status,'pilot');assert.equal(d.documentElement.lang,'de');
assert.equal(receipt.profileSha256,hash(read('scripts/localization/stamps-de.json')));assert.equal(receipt.captureScriptSha256,hash(read('scripts/localization/capture-stamps-de.mjs')));
assert.equal(receipt.exportVerificationSha256,hash(read('public/localized-media/de/samples/stamps/export-verification.json')));
assert.deepEqual(receipt.placed[0].interactiveStamp,receipt.reopened[0].interactiveStamp);assert.equal(receipt.reusedPrompt[1].value,'');
for(const shot of receipt.shots)assert.equal(hash(read(`build/localized-media/de/guides/stamps/${shot.file}`)),shot.sha256);
const neutral=new Set(manifest.languageNeutralAssets),images=[...d.querySelectorAll('img')].filter(n=>!neutral.has(assetPath(n.src)));
assert.equal(images.length,4);
for(const img of images){
 assert.ok(img.src.startsWith('/localized-media/de/guides/stamps/'));
 const record=Object.values(manifest.locales.de.assets).find(a=>a.url===img.src);assert.ok(record);
 assert.equal(hash(read('build'+img.src)),record.sha256);assert.equal(img.alt,record.alt);assert.equal(img.width,1710);assert.equal(img.height,1073);
}
for(const entry of profile.extraDownloads){const a=[...d.querySelectorAll('a[href]')].find(n=>n.getAttribute('href')===entry.url&&n.textContent===entry.label);assert.ok(a);assert.equal(a.lang,'de-DE');assert.equal(hash(read('build'+entry.url)),entry.sha256);}
for(const a of d.querySelectorAll('a[href]'))if(needsLocalization(a.href))assert.ok(assetPath(a.href).startsWith('/localized-media/de/'));
const hero='https://www.polypdf.com/localized-media/de/guides/stamps/stempel-editor.png';
for(const selector of ['meta[property="og:image"]','meta[name="twitter:image"]'])assert.equal(d.querySelector(selector).content,hero);
const schemas=[...d.querySelectorAll('script[type="application/ld+json"]')].map(n=>JSON.parse(n.textContent)),article=schemas.find(s=>s['@type']==='BlogPosting');
assert.equal(article.image.url,hero);assert.equal(article.image.width,1710);assert.equal(article.image.height,1073);
const prose=d.body.textContent.replace(/\s+/g,' ');
for(const text of ['300 × 140','240 × 240','GEPRÜFT - ÜBUNG','Musterprüfung','21.10.2026','21. Oktober 2026','bereits aktiviert','Pflichtangabe','wieder leer','Rasterbild','nicht über den Vorlageneditor','1:50'])assert.ok(prose.includes(text),text);
assert.ok(!/Morgan Lee|REVIEWED|300 × 180|starts unchecked|unchecked by default/.test(prose));
assert.equal(d.querySelectorAll('.blog-sources li').length,3);
for(const prefix of ['', '/es']){
 const original=new JSDOM(read(`build${prefix}${route}/index.html`).toString()).window.document;
 assert.ok(original.querySelector('.blog-hero-figure img').src.includes('stamp-builder-v1-5-1'));
 assert.equal(original.querySelectorAll('a[href^="/localized-media/de/samples/stamps/"]').length,0);
}
const files=['scripts/localization/stamps-de.json','scripts/localization/prepare-stamps-de.cjs','scripts/localization/capture-stamps-de.mjs','scripts/localization/register-stamps-de.cjs','scripts/localization/verify-stamps-de.py','scripts/localization/verify-stamps-page.cjs','scripts/localization/pages.cjs','scripts/international/build.cjs','src/content/guides/create-interactive-pdf-stamps.js','src/localization/walkthrough-media.json'];
fs.writeFileSync(path.join(root,'public/localized-media/de/guides/stamps/page-verification.json'),JSON.stringify({status:'passed',route:'/de'+route+'/',htmlSha256:hash(bytes),localizedImages:images.length,localizedPdfDownloads:2,sourceFiles:Object.fromEntries(files.map(f=>[f,hash(read(f))])),checks:['Four actual German app images and matching social image','Two regional PDF downloads verified by hash','Full process reopen and retained template with empty reviewer prompt','Actual 300 × 140 dimensions, checked default and reopened-value edit limitation documented','English and unfinished Spanish preserved'],limitations:['One completed German route within a pilot pack; full rollout remains incomplete','Local Mac development capture; no released installer, Windows or native iPad qualification','No deployment']},null,2)+'\n');
console.log('German stamp page verified: four regional captures, two PDFs, native reopen and template reuse.');
