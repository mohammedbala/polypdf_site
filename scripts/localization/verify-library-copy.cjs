'use strict';
// Runs on freshly prerendered React components. Does not enable /samples or any pilot route.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {JSDOM}=require('jsdom');
const {localizeRegionalCopy,localizeWalkthroughMedia,verifyMediaFiles}=require('./media.cjs');
const {translateDOM,translateFactory}=require('../international/content.cjs');
const root=path.resolve(__dirname,'../..'),read=f=>fs.readFileSync(path.join(root,f));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const source=read('build/samples/index.html'),original=new JSDOM(source.toString()).window.document;
const sections=[...original.querySelectorAll('#construction-library,.construction-example')];
assert.equal(sections.length,7);
const media=JSON.parse(read('src/localization/walkthrough-media.json'));
const stylesheet=[...original.querySelectorAll('link[rel="stylesheet"]')].map(n=>n.outerHTML).join('');
const auditIndex=process.argv.indexOf('--audit');
const audit=auditIndex<0?'docs/localization/library-copy-2026-10-21':process.argv[auditIndex+1];
if(!audit)throw new Error('Pass an audit directory after --audit');
const locales=Object.keys(media.locales).filter(locale=>fs.existsSync(path.join(root,`scripts/localization/library-copy-${locale}.json`)));
const results=[];
for(const locale of locales) {
  const profile=JSON.parse(read(`scripts/localization/library-copy-${locale}.json`));
  const library=JSON.parse(read(`public/localized-media/${locale}/samples/construction/DEMO-MANIFEST.json`));
  const catalog=JSON.parse(read(`src/content/translations/${locale}.json`));
  const preview=profile.preview??(locale==='de'?{title:'Deutsche Planbibliothek',notice:'Lokale Vorschau der Planbibliothek und Übungen; die vollständige Beispielseite ist noch nicht freigegeben.'}:{title:'Bibliothèque de plans en français',notice:'Aperçu local de la bibliothèque et des exercices ; la page complète des exemples reste en préparation.'});
  if(!['de','fr'].includes(locale)&&!profile.preview)throw new Error(`Missing localized preview labels: ${locale}`);
  const dom=new JSDOM(`<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="robots" content="noindex"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${preview.title} · PolyPDF</title>${stylesheet}<style>body{padding:24px}main{max-width:1200px;margin:auto}.local-preview{font-size:14px}</style></head><body><main><p class="local-preview" translate="no">${preview.notice}</p>${sections.map(s=>s.outerHTML).join('')}</main></body></html>`);
  const d=dom.window.document;
  localizeRegionalCopy(d,{id:locale},media);
  translateDOM(d.body,translateFactory(catalog));
  localizeWalkthroughMedia(d,{id:locale},media);
  const seen=new Set();
  for(const n of d.querySelectorAll('[data-regional-copy]')){
    const key=n.dataset.regionalCopy;seen.add(key);assert.equal(n.textContent,profile.text[key].target);
  }
  assert.deepEqual([...seen].sort(),Object.keys(profile.text).sort());
  assert.equal(d.querySelectorAll('.construction-library-grid > li').length,12);
  assert.equal(d.querySelectorAll('.construction-example').length,6);
  assert.equal(d.querySelectorAll('img').length,19);
  for(const image of d.querySelectorAll('img')){
    const asset=Object.values(media.locales[locale].assets).find(a=>a.url===image.getAttribute('src'));
    assert.ok(asset);assert.equal(image.alt,asset.alt);assert.equal(image.width,asset.width);assert.equal(image.height,asset.height);
    assert.equal(hash(read('public'+image.getAttribute('src'))),asset.sha256);
    assert.ok(image.alt.includes(library.project.name));
  }
  for(const figure of d.querySelectorAll('.construction-example figure')){
    const url=figure.querySelector('a').getAttribute('href');
    assert.equal(figure.querySelector('figcaption').textContent,path.basename(url));
  }
  const downloads=[...d.querySelectorAll('a[href]')].filter(a=>/\.(pdf|zip|html)$/i.test(a.getAttribute('href')));
  assert.equal(downloads.length,21);
  for(const link of downloads)assert.ok(link.getAttribute('href').startsWith(`/localized-media/${locale}/samples/construction/`));
  const prose=[...d.body.querySelectorAll('*')].filter(n=>!n.children.length).map(n=>n.textContent).join(' ');
  const stale=prose.match(/.{0,60}(?:Willow Creek|ARCH D|sq ft|\b\d+ ft\b|E601|C501|S501|FP101|COMMUNITY ROOM|WILLOW CREEK).{0,60}/);assert.ok(!stale,stale?.[0]);
  for(const value of ['360,00 m²','324,00 m²','36,00 m²','24,00 m','15,00 m','34,50 m','283,46457','45,00','27,00'])assert.ok(prose.includes(value),value);
  // Independently reconcile the exercise's physical references and plan-only symbol counts.
  const document=id=>library.documents.find(d=>d.id===id);
  const footprint=document('02').pages[0].references.find(r=>r.id==='building-footprint');
  assert.equal(footprint.widthMetres,24);assert.equal(footprint.heightMetres,15);assert.equal(footprint.areaSquareMetres,360);
  const calibration=document('02').pages[0].references.find(r=>r.id==='calibration');assert.equal(calibration.metres,5);assert.equal(calibration.scaleRatio,50);
  const electrical=document('06').pages[0];assert.equal(electrical.references.find(r=>r.id==='circuit').metres,34.5);
  assert.deepEqual(electrical.symbols.filter(s=>s.plan).reduce((a,s)=>(a[s.kind]=(a[s.kind]||0)+1,a),{}),{light:24,socket:12,switch:8});
  verifyMediaFiles(media,JSON.parse(read('src/localization/product-locales.json')).locales,url=>read((fs.existsSync(path.join(root,'public',url))?'public':'build')+url),[locale]);
  assert.equal(media.locales[locale].status,'pilot');assert.ok(!media.locales[locale].pages['/samples']);
  const html=dom.serialize();fs.writeFileSync(path.join(root,`build/local-library-${locale}-preview.html`),html);
  results.push({locale:profile.locale,copyRecords:seen.size,cards:12,exercises:6,images:19,downloads:downloads.length,htmlSha256:hash(html),profileSha256:hash(read(`scripts/localization/library-copy-${locale}.json`)),libraryManifestSha256:hash(read(`public/localized-media/${locale}/samples/construction/DEMO-MANIFEST.json`))});
  dom.window.close();
}
fs.mkdirSync(path.join(root,audit),{recursive:true});
fs.writeFileSync(path.join(root,audit,'verification.json'),JSON.stringify({status:'passed',sourceHtmlSha256:hash(source),results,limitations:['Shared components only; /samples remains English-only and all checked media packs remain pilot','React prerender and international stage use existing compiled site assets; no full production bundle build','Editorial drafts awaiting native-speaker review; no new native application or platform verification','No publication']},null,2)+'\n');
console.log(`Verified ${results.length} regional libraries: 98 copy records, 12 cards, 6 exercises, 19 images and 21 downloads each.`);
