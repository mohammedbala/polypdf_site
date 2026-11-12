'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),crypto=require('crypto');
const root=path.resolve(__dirname,'../..');
const routes={calibration:'/blog/calibrate-pdf-drawing-scale',area:'/blog/measure-pdf-area-cutouts-depth',count:'/blog/count-pdf-symbols',compare:'/blog/compare-pdf-drawing-revisions',markup:'/blog/pdf-markup-table-rfi-punch-list',ocr:'/blog/ocr-scanned-pdf-drawings',forms:'/blog/create-fillable-pdf-form',stamps:'/blog/create-interactive-pdf-stamps',redaction:'/blog/redact-and-sanitize-pdf'};
const packs=Object.fromEntries(['fr','es','pt-br'].map(id=>[id,require('../../src/localization/regional-guides/'+id+'.json')]));
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function find(id,route){const pack=packs[id];if(!pack)return null;const guide=pack.guides.find(g=>routes[g.id]===route);return guide?{...guide,pack,siteLocale:id}:null;}
function assets(g,base=path.join(root,'public')){
 const prefix='/localized-media/'+g.siteLocale;
 const manifest=JSON.parse(fs.readFileSync(path.join(base,prefix,'guides114/manifest.json'),'utf8'));
 const capture=manifest.captures[g.id];assert(capture,'Missing capture '+g.siteLocale+'/'+g.id);
 assert.equal(manifest.schemaVersion,1);assert.equal(capture.kind,'native-interface');assert(Number.isInteger(capture.width)&&capture.width>0);assert(Number.isInteger(capture.height)&&capture.height>0);
 assert.equal(manifest.locale,g.pack.locale);assert.equal(manifest.appBuild,114);
 assert.equal(manifest.version,'1.6.32');assert.equal(manifest.platform,'macOS');
 for(const asset of [capture,...manifest.resources]){
  assert.match(asset.sha256,/^[a-f0-9]{64}$/);assert(asset.path.startsWith(prefix+'/'),'Regional asset stays in its locale');
  assert.equal(sha(fs.readFileSync(path.join(base,asset.path))),asset.sha256,'Changed asset '+asset.path);
 }
 const library=JSON.parse(fs.readFileSync(path.join(base,prefix,'samples/construction/DEMO-MANIFEST.json'),'utf8'));
 assert.equal(library.locale,g.pack.locale);
 const files=g.documents.map(id=>{const d=library.documents.find(d=>d.id===id);assert(d);return {path:prefix+'/samples/construction/'+d.file,label:d.file};});
 if(g.form)files.push({path:prefix+'/samples/forms114/construction-review-form-'+g.siteLocale+'.pdf',label:g.pack.labels.practice},{path:prefix+'/samples/forms114/construction-review-field-map.csv',label:g.pack.labels.fieldMap});
 for(const file of files)assert(manifest.resources.some(a=>a.path===file.path),'Unbound guide file '+file.path);
 return {capture,files,prefix,manifest};
}
function render(d,g,base){
 const {capture,files,prefix}=assets(g,base),l=g.pack.labels;
 const article=d.querySelector('#localized-content .blog-article');assert(article,'Guide article exists');
 article.dataset.regionalGuide=g.id;article.dataset.guideLocale=g.pack.locale;
 article.innerHTML='<header class="legal-hero blog-hero"><p class="blog-card-meta">'+esc(l.edition)+' · <time datetime="2026-11-12">'+esc(g.pack.date)+'</time></p><h1 id="blog-article-title">'+esc(g.title)+'</h1><p class="regional-intro">'+esc(g.intro)+'</p></header>'
 +'<section class="legal-section" aria-labelledby="regional-files"><h2 id="regional-files">'+esc(l.files)+'</h2><ul class="regional-files">'+files.map(f=>'<li><a href="'+esc(f.path)+'" download>'+esc(f.label)+'</a></li>').join('')+'</ul><p><a href="'+prefix+'/samples/construction/DEMO-GUIDE.html">'+esc(l.library)+'</a></p><p>'+esc(l.scope)+'</p></section>'
 +'<figure class="regional-capture"><a href="'+esc(capture.path)+'"><img src="'+esc(capture.path)+'" width="'+capture.width+'" height="'+capture.height+'" alt="'+esc(g.caption)+'" loading="eager"></a><figcaption>'+esc(g.caption)+'</figcaption></figure>'
 +'<section class="legal-section"'+(g.id==='calibration'?' id="practice-calibration"':'')+'><h2>'+esc(l.steps)+'</h2><ol data-regional-steps>'+g.steps.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ol></section>'
 +'<section class="blog-quick-answer" data-regional-check><h2>'+esc(l.check)+'</h2><p>'+esc(g.check)+'</p></section>'
 +'<section class="legal-section" data-regional-pitfall><h2>'+esc(l.pitfall)+'</h2><p>'+esc(g.pitfall)+'</p></section>'
 +'<p class="regional-evidence">'+esc(l.evidence)+'</p>'
 +'<section class="legal-section"><h2>'+esc(l.download)+'</h2><div class="regional-downloads">'+['mac','windows'].map(platform=>'<a class="primary-btn" href="'+require('../../src/lib/websiteDownloads.cjs').websiteDownloadHref(platform==='mac'?'/downloads/PolyPDFMac.dmg':'/downloads/windows/PolyPDFSetup.exe',g.siteLocale)+'">'+esc(l[platform])+'</a>').join('')+'</div></section>'
 +'<nav class="legal-section regional-related" aria-label="'+esc(l.related)+'"><h2>'+esc(l.related)+'</h2><ul>'+g.pack.guides.map(item=>'<li><a href="/'+g.siteLocale+routes[item.id]+'/"'+(item.id===g.id?' aria-current="page"':'')+'>'+esc(item.title)+'</a></li>').join('')+'</ul></nav>';
 d.querySelector('.translation-note').textContent=l.notice;return capture;
}
function verifyDocument(d,g,base){
 const {capture,files}=assets(g,base),article=d.querySelector('[data-regional-guide]');
 assert.equal(article?.dataset.regionalGuide,g.id);assert.equal(article.dataset.guideLocale,g.pack.locale);
 assert.equal(article.querySelector('h1').textContent,g.title);
 if(g.id==='calibration')assert(article.querySelector('#practice-calibration'),'Existing calibration deep links resolve');
 assert.equal(g.steps.length,6);assert.deepEqual([...article.querySelectorAll('[data-regional-steps] li')].map(n=>n.textContent),g.steps);
 assert(g.steps.every(s=>s.length>=40));assert(g.check.length>=100);assert(g.pitfall.length>=80);
 assert.equal(article.querySelector('[data-regional-check] p').textContent,g.check);
 assert.equal(article.querySelector('[data-regional-pitfall] p').textContent,g.pitfall);
 assert.deepEqual([...article.querySelectorAll('img')].map(n=>n.getAttribute('src')),[capture.path]);
 assert.equal(article.querySelector('img').alt,g.caption);
 for(const f of files)assert(article.querySelector('a[href="'+f.path+'"][download]'));
 assert.equal(article.querySelectorAll('.regional-related a').length,9);
 assert.equal(d.querySelector('.translation-note').textContent,g.pack.labels.notice);
 assert(!article.querySelector('pre,video,iframe,button,input'),'Static accessible article');
}
function validateCatalogs(){for(const [id,p] of Object.entries(packs)){assert.equal(new Set(p.guides.map(g=>g.id)).size,9);assert.deepEqual(p.guides.map(g=>g.id),Object.keys(routes));assert.equal(p.region,{fr:'FR',es:'ES','pt-br':'BR'}[id]);}}
function localizeEvaluation(d,id){
 const copy=require('./evaluation-copy.json')[id]; if(!copy)return;
 for(const body of d.querySelectorAll('.dl-evaluation-body')){
  body.querySelector(':scope > p').textContent=copy.intro;
  const steps=[...body.querySelectorAll('ol > li')];assert.equal(steps.length,3);
  steps.forEach((n,i)=>n.textContent=copy.steps[i]);
  body.querySelector('.dl-evaluation-scope').textContent=copy.scope;
  const pdf=body.querySelector('a[href$=".pdf"]');assert(pdf);
  pdf.href='/localized-media/'+id+'/samples/construction/'+copy.file;
  for(const a of body.querySelectorAll('[data-evaluation-target="guide"],[data-evaluation-target="evidence"]')){
   a.href='/'+id+routes.calibration+'/';a.textContent=copy.guide;
  }
 }
}
module.exports={localizeEvaluation,find,assets,render,verifyDocument,validateCatalogs,routes,packs};
