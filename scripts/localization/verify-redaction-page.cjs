'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom'),{assetPath,needsLocalization}=require('./media.cjs');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f)),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const route='/blog/redact-and-sanitize-pdf',bytes=read(`build/de${route}/index.html`),d=new JSDOM(bytes.toString()).window.document;
const manifest=JSON.parse(read('src/localization/walkthrough-media.json')),profile=JSON.parse(read('scripts/localization/redaction-de.json')),receipt=JSON.parse(read('public/localized-media/de/guides/redaction/verification.json'));
assert.deepEqual(manifest.locales.de.pages[route],profile);assert.equal(manifest.locales.de.status,'pilot');assert.equal(d.documentElement.lang,'de');
assert.equal(receipt.profileSha256,hash(read('scripts/localization/redaction-de.json')));assert.equal(receipt.runnerSha256,hash(read('scripts/localization/capture-redaction-de.mjs')));
assert.equal(receipt.exportVerificationSha256,hash(read('public/localized-media/de/samples/redaction/export-verification.json')));
for(const shot of receipt.shots)assert.equal(hash(read(`build/localized-media/de/guides/redaction/${shot.file}`)),shot.sha256);
const neutral=new Set(manifest.languageNeutralAssets),images=[...d.querySelectorAll('img')].filter(n=>!neutral.has(assetPath(n.src)));
assert.equal(images.length,7);
for(const img of images){
 assert.ok(img.src.startsWith('/localized-media/de/guides/redaction/'));
 const record=Object.values(manifest.locales.de.assets).find(a=>a.url===img.src);assert.ok(record);
 assert.equal(hash(read('build'+img.src)),record.sha256);assert.equal(img.alt,record.alt);assert.equal(img.width,3420);assert.equal(img.height,2146);
}
assert.deepEqual(images.map(n=>path.basename(n.src)),['schwaerzen-wieder-geoeffnet.jpg','schwaerzen-vorher.jpg','schwaerzen-bestaetigen.jpg','schwaerzen-angewendet.jpg','schwaerzen-wieder-geoeffnet.jpg','bereinigen-optionen.jpg','bereinigen-ergebnis.jpg']);
for(const entry of profile.extraDownloads){const a=[...d.querySelectorAll('a[href]')].find(n=>n.getAttribute('href')===entry.url&&n.textContent===entry.label);assert.ok(a);assert.equal(a.lang,'de-DE');assert.equal(hash(read('build'+entry.url)),entry.sha256);}
for(const a of d.querySelectorAll('a[href]'))if(needsLocalization(a.href))assert.ok(assetPath(a.href).startsWith('/localized-media/de/'));
const hero='https://www.polypdf.com/localized-media/de/guides/redaction/schwaerzen-wieder-geoeffnet.jpg';
for(const selector of ['meta[property="og:image"]','meta[name="twitter:image"]'])assert.equal(d.querySelector(selector).content,hero);
assert.equal(d.querySelector('meta[property="og:image:width"]').content,'3420');assert.equal(d.querySelector('meta[property="og:image:height"]').content,'2146');
const schemas=[...d.querySelectorAll('script[type="application/ld+json"]')].map(n=>JSON.parse(n.textContent)),article=schemas.find(s=>s['@type']==='BlogPosting');
assert.equal(article.image.url,hero);assert.equal(article.image.width,3420);assert.equal(article.image.height,2146);
const prose=d.body.textContent.replace(/\s+/g,' ');
for(const text of ['Schwärzung anwenden','VORGANG-LINDE-742','Keine Treffer','Bürgerhaus Lindenhof','24,00 m × 12,00 m','288,00 m²','21. Oktober 2026','1.6.17 Build 84','keinen zusätzlichen Schritt','pruefnotiz.txt','identische Nutzdaten','/Producer','/ModDate','pixelgenau','englischen Sprache des verwendeten Betriebssystems'])assert.ok(prose.includes(text),text);
assert.ok(!/CASE-ORCHID|Clean Hidden Data|Scrubber|Komplettlösung|sensiblen PDF-Inhalte/.test(prose));
assert.equal(d.querySelectorAll('.blog-sources li').length,6);
for(const prefix of ['']){
 const original=new JSDOM(read(`build${prefix}${route}/index.html`).toString()).window.document;
 assert.ok(original.querySelector('.blog-hero-figure img').src.includes('redaction-reopened-search-no-matches-v1-4-light-web'));
 assert.equal(original.querySelectorAll('a[href^="/localized-media/de/samples/redaction/"]').length,0);
 assert.ok(original.body.textContent.includes('CASE-ORCHID-742'));
}
const files=['scripts/localization/redaction-de.json','scripts/localization/generate-redaction-de.py','scripts/localization/capture-redaction-de.mjs','scripts/localization/register-redaction-de.cjs','scripts/localization/verify-redaction-de.py','scripts/localization/verify-redaction-page.cjs','scripts/localization/pages.cjs','scripts/international/build.cjs','src/content/guides/redact-and-sanitize-pdf.js','src/localization/walkthrough-media.json'];
fs.mkdirSync(path.join(root,'public/localized-media/de/guides114'),{recursive:true});
fs.writeFileSync(path.join(root,'public/localized-media/de/guides114/redaction-page-verification.json'),JSON.stringify({status:'passed',route:'/de'+route+'/',htmlSha256:hash(bytes),localizedImageSlots:images.length,distinctDisplayedCaptures:6,retainedNativeCaptures:7,localizedPdfDownloads:4,sourceFiles:Object.fromEntries(files.map(f=>[f,hash(read(f))])),checks:['Seven image slots use verified German app states in their actual sequence','Four regional PDF downloads verified by hash','Full-process reopen and independent output verification','Immediate confirmation, retained page attachment, fresh metadata and host-language Save dialog documented','Visible, Open Graph and Article images agree in URL and dimensions','English source retained; new regional guides validated separately'],evidenceScope:'Historical native captures and output receipts retain their original version and scope; this check validates website integration.',limitations:['No new end-to-end qualification of every historical German workflow','No new Windows or native iPad qualification']},null,2)+'\n');
console.log('German redaction page verified: seven image slots, four PDFs, native reopen and scoped limitations.');
