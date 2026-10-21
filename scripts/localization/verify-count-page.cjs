'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom'),{assetPath,needsLocalization}=require('./media.cjs');
const root=path.resolve(__dirname,'../..'),read=file=>fs.readFileSync(path.join(root,file));
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const route='/blog/count-pdf-symbols',bytes=read(`build/de${route}/index.html`),d=new JSDOM(bytes.toString()).window.document;
const manifest=JSON.parse(read('src/localization/walkthrough-media.json')),profile=JSON.parse(read('scripts/localization/count-de.json'));
assert.deepEqual(manifest.locales.de.pages[route],profile);assert.equal(manifest.locales.de.status,'pilot');assert.equal(d.documentElement.lang,'de');
const receipt=JSON.parse(read('public/localized-media/de/guides/count/verification.json'));
assert.equal(receipt.profileSha256,hash(read('scripts/localization/count-de.json')));
assert.equal(receipt.captureScriptSha256,hash(read('scripts/localization/capture-count-de.mjs')));
assert.equal(receipt.sourceSha256,hash(read('public'+receipt.sourcePdf)));
assert.equal(receipt.geometrySha256,hash(read('public/localized-media/de/samples/count/geometry.json')));
assert.equal(receipt.candidates.length,17);assert.equal(receipt.counts.length,16);
assert.deepEqual(receipt.rows,[{subject:'Zuluftauslässe Q-101',quantity:'16',total:'16'}]);
for(const shot of receipt.shots)assert.equal(hash(read(`build/localized-media/de/guides/count/${shot.file}`)),shot.sha256);
const neutral=new Set(manifest.languageNeutralAssets),images=[...d.querySelectorAll('img')].filter(img=>!neutral.has(assetPath(img.src)));
assert.equal(images.length,3);
for(const img of images){
 assert.ok(img.src.startsWith('/localized-media/de/'));
 const record=Object.values(manifest.locales.de.assets).find(a=>a.url===img.src);assert.ok(record);
 assert.equal(hash(read('build'+img.src)),record.sha256);assert.equal(img.width,record.width);assert.equal(img.height,record.height);
 assert.ok(img.alt&&!/Willow|five|twelve|Count 5|Supply diffuser/.test(img.alt));
}
const downloads=[...d.querySelectorAll('a[href]')].filter(a=>needsLocalization(a.href));
assert.ok(downloads.length>=3);
for(const a of downloads){const local=assetPath(a.href);if(local&&!neutral.has(local))assert.ok(local.startsWith('/localized-media/de/'),local);}
for(const entry of [...profile.links,...profile.downloads]){
 const a=[...d.querySelectorAll('a[href]')].find(n=>n.getAttribute('href')===entry.url&&n.textContent===entry.label);assert.ok(a,entry.label);
 assert.equal(a.lang,'de-DE');assert.equal(hash(read('build'+entry.url)),entry.sha256);
}
const hero='https://www.polypdf.com/localized-media/de/guides/count/symbolsuche-legende-ausgeschlossen.png';
for(const selector of ['meta[property="og:image"]','meta[name="twitter:image"]'])assert.equal(d.querySelector(selector).content,hero);
const schemas=[...d.querySelectorAll('script[type="application/ld+json"]')].map(n=>JSON.parse(n.textContent)),article=schemas.find(s=>s['@type']==='BlogPosting');
assert.equal(article.image.url,hero);assert.equal(article.image.width,1710);assert.equal(article.image.height,1073);assert.ok(article.image.caption.includes('17 Treffer'));
assert.ok(d.querySelector('meta[property="og:image:alt"]').content.includes('16 ausgewählten'));
const prose=d.body.textContent.replace(/\s+/g,' ');
for(const expected of ['17 Treffer','16 ausgewählt','Menge 16','Summe 16','Zuluftauslässe Q-101','5,00-m-Referenz','24 Leuchten','12 Steckdosen','8 Schalter','34,50 m','20. Oktober 2026'])assert.ok(prose.includes(expected),expected);
assert.ok(!/Willow Creek|20-Fuß|46 ft|46 Fuß|1\.4\.0|1\.4\.1|1\.5\.0|1\.5\.1|E601|8 Leuchten vom Typ A|4 Notleuchten|fünf Treffer|zwölf.*Markierungen/.test(prose));
for(const n of d.querySelectorAll('[alt],[aria-label],[title]'))for(const a of ['alt','aria-label','title'])assert.ok(!/five|twelve|Count 5|Supply diffuser|Willow/.test(n.getAttribute(a)||''));
assert.equal(d.querySelector('#construction-example-electrical figcaption bdi').textContent,'06-Beleuchtung-und-Elektro.pdf');
assert.equal(d.querySelector('#construction-example-electrical .construction-example-sheets bdi').textContent,'E101 · E501');
assert.equal(d.querySelector('.blog-formula code').textContent,'17 Treffer − 1 Legendensymbol = 16 gezählte Zuluftauslässe');
assert.ok(d.querySelector('.growth-file-panel a').href.endsWith('/localized-media/de/samples/count/q101-symbolzaehlung.pdf'));
for(const language of ['', '/es']){
 const original=new JSDOM(read(`build${language}${route}/index.html`).toString()).window.document;
 assert.ok(original.querySelector('.blog-hero-figure img').src.includes('symbol-search-review-v1-4-dark-web'));
 assert.ok(!original.querySelector('.blog-sources a'));
 assert.ok(original.querySelector('.growth-file-panel a').href.includes('/visual-search-pdf-count/'));
}
const files=['scripts/localization/pages.cjs','scripts/localization/count-de.json','scripts/localization/prepare-count-de.py','scripts/localization/capture-count-de.mjs','scripts/localization/register-count-de.cjs','scripts/localization/verify-count-page.cjs','src/content/guides/count-pdf-symbols.js','src/localization/walkthrough-media.json'];
fs.writeFileSync(path.join(root,'public/localized-media/de/guides/count/page-verification.json'),JSON.stringify({status:'passed',route:'/de'+route+'/',htmlSha256:hash(bytes),localizedImages:images.length,localizedDownloads:downloads.length,sourceFiles:Object.fromEntries(files.map(file=>[file,hash(read(file))])),checks:['Three instructional images use hash-verified German assets','Q-101 PDF and physical geometry downloads have German labels and bound hashes','17 candidates, excluded legend, 16 markers and one worksheet row agree','Hero, social, Article metadata and accessible image labels describe the same capture','Supplemental E101/E501 German references remain distinct from Q-101 app results','English and unfinished Spanish retain their original media'],limitations:['One completed German count route within a pilot pack; full rollout remains incomplete','International transformation of existing English prerender; no full React rebuild','Local Mac development capture; no Windows/native iPad, Save/reopen or export qualification','No deployment']},null,2)+'\n');
console.log('German count guide passed: localized images, regional PDFs, reviewed totals, downloads and metadata agree.');
