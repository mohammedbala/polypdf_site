'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom'),{assetPath,needsLocalization}=require('./media.cjs');
const root=path.resolve(__dirname,'../..'),read=file=>fs.readFileSync(path.join(root,file));
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const route='/blog/measure-pdf-area-cutouts-depth',bytes=read(`build/de${route}/index.html`),d=new JSDOM(bytes.toString()).window.document;
const manifest=JSON.parse(read('src/localization/walkthrough-media.json')),profile=JSON.parse(read('scripts/localization/area-de.json'));
assert.deepEqual(manifest.locales.de.pages[route],profile);
assert.equal(manifest.locales.de.status,'pilot');assert.equal(d.documentElement.lang,'de');
const neutral=new Set(manifest.languageNeutralAssets);
const images=[...d.querySelectorAll('img')].filter(img=>!neutral.has(assetPath(img.src)));
assert.equal(images.length,3);
for(const img of images){
 assert.ok(img.src.startsWith('/localized-media/de/'));
 const record=Object.values(manifest.locales.de.assets).find(a=>a.url===img.src);
 assert.ok(record);assert.equal(hash(read('build'+img.src)),record.sha256);
 assert.equal(img.width,record.width);assert.equal(img.height,record.height);
 assert.ok(img.alt && !/Willow|foot|feet|28,793/.test(img.alt));
}
const downloads=[...d.querySelectorAll('a[href]')].filter(a=>needsLocalization(a.href));
assert.ok(downloads.length>=8);
for(const a of downloads){const local=assetPath(a.href);if(local&&!neutral.has(local))assert.ok(local.startsWith('/localized-media/de/'),local);}
for(const entry of profile.links){
 const link=[...d.querySelectorAll('a[href]')].find(a=>a.getAttribute('href')===entry.url && a.textContent===entry.label);assert.ok(link,entry.label);assert.equal(link.getAttribute('href'),entry.url);assert.equal(link.textContent,entry.label);
 assert.equal(link.lang,'de-DE');assert.equal(hash(read('build'+entry.url)),entry.sha256);
}
const hero='https://www.polypdf.com/localized-media/de/guides/area/volumen-mit-tiefe.png';
for(const selector of ['meta[property="og:image"]','meta[name="twitter:image"]'])assert.equal(d.querySelector(selector).content,hero);
const schemas=[...d.querySelectorAll('script[type="application/ld+json"]')].map(n=>JSON.parse(n.textContent));
const article=schemas.find(s=>s['@type']==='BlogPosting');assert.equal(article.image.url,hero);assert.equal(article.image.width,1710);assert.ok(article.image.caption.includes('86,00 m²'));
assert.ok(d.querySelector('meta[property="og:image:alt"]').content.includes('12,90 m³'));
const prose=d.body.textContent.replace(/\s+/g,' ');
for(const expected of ['86,00 m²','12,90 m³','0,15 m','96,00 m²','5,00-m-Referenz','18,00 m²','36,00 m²','324,00 m²','20,52 m²','36,72 m²'])assert.ok(prose.includes(expected),expected);
assert.ok(!/Willow Creek|20-Fuß|288|576|5\.184|28,793|28\.793|43,190|43\.190|HALS|PGAdesign|Library of Congress|1\.4\.0|1\.5\.0|sq ft|cu ft/.test(prose));
for(const node of d.querySelectorAll('[alt],[aria-label],[title]'))for(const attribute of ['alt','aria-label','title'])assert.ok(!/28,793|43,190|1 foot|curved and crosshatched|Willow/.test(node.getAttribute(attribute)||''));
assert.equal(d.querySelector('#construction-example-flooring figcaption bdi').textContent,'10-Innenausbau-und-Einbaumoebel.pdf');
assert.deepEqual([...d.querySelectorAll('.blog-formula code')].map(n=>n.textContent),['Nettofläche = Bruttofläche − Summe der Aussparungen','96,00 m² − 4,00 m² − 6,00 m² = 86,00 m²','86,00 m² × 0,15 m = 12,90 m³']);
for(const language of ['', '/es']){
 const original=new JSDOM(read(`build${language}${route}/index.html`).toString()).window.document;
 assert.ok(original.querySelector('.blog-hero-figure img').src.includes('area-cutouts-depth-v1-4-dark-web'));
 assert.ok(original.querySelector('.blog-sources a[href="https://www.loc.gov/item/ca3441/"]'));
}
const files=['scripts/international/build.cjs','scripts/international/verify.cjs','scripts/localization/pages.cjs','scripts/localization/area-de.json','scripts/localization/capture-area-de.mjs','scripts/localization/register-area-de.cjs','scripts/localization/verify-area-page.cjs','scripts/generate-area-demo-de.py','scripts/verify-area-demo-de.py','src/content/guides/measure-pdf-area-cutouts-depth.js','src/localization/walkthrough-media.json'];
fs.writeFileSync(path.join(root,'public/localized-media/de/guides/area/page-verification.json'),JSON.stringify({status:'passed',route:'/de'+route+'/',htmlSha256:hash(bytes),localizedImages:images.length,localizedDownloads:downloads.length,sourceFiles:Object.fromEntries(files.map(file=>[file,hash(read(file))])),checks:['Three instructional images use exact German bytes','Source PDF, reference CSV and geometry receipt have bound hashes and German link labels','Hero, social and Article image metadata agree','Metric quantities, formulas, captions, drawing attribution and supplemental exercises match regional PDFs','English and unfinished Spanish page keep existing media'],limitations:['One German area route completed in a pilot pack; the overall rollout remains incomplete','International transformation of the existing English prerender; no full React rebuild','Local Mac capture only; no Windows/native iPad or S-102 save/reopen evidence','No deployment']},null,2)+'\n');
console.log('German area guide passed: regional screenshots, quantities, drawing downloads and metadata agree.');
