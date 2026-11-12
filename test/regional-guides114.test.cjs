'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),os=require('os');
const {JSDOM}=require('jsdom'),guides=require('../scripts/localization/regional-guides.cjs');
const root=path.resolve(__dirname,'..'),publicRoot=path.join(root,'public');
test('all regional workflows bind their own native interface and source drawings',()=>{
 guides.validateCatalogs();
 for(const id of ['fr','es','pt-br'])for(const route of Object.values(guides.routes)){
  const guide=guides.find(id,route),a=guides.assets(guide);
  assert.equal(a.capture.kind,'native-interface');
  assert(a.capture.width>=1000&&a.capture.height>=500);
  assert(a.files.length>0);
  const d=new JSDOM('<body><aside class="translation-note"></aside><main id="localized-content"><article class="blog-article"></article></main></body>').window.document;
  guides.render(d,guide);guides.verifyDocument(d,guide);
  assert(!d.body.textContent.includes('Willow Creek'));
  assert(!d.body.textContent.includes('5,760'));
  assert(d.querySelector('a[href$="/DEMO-GUIDE.html"]'));
  assert.equal(d.querySelectorAll('.regional-downloads a').length,2);
 }
});
test('foreign-language and changed evidence are rejected before rendering',()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'polypdf-guides-evidence-'));
 try{
  fs.cpSync(path.join(publicRoot,'localized-media/fr'),path.join(tmp,'localized-media/fr'),{recursive:true});
  const file=path.join(tmp,'localized-media/fr/guides114/manifest.json');
  const original=JSON.parse(fs.readFileSync(file));
  const guide=guides.find('fr',guides.routes.calibration);
  let altered=structuredClone(original);altered.locale='es-ES';fs.writeFileSync(file,JSON.stringify(altered));
  assert.throws(()=>guides.assets(guide,tmp));
  altered=structuredClone(original);altered.captures.calibration.path='/localized-media/es/wrong.webp';fs.writeFileSync(file,JSON.stringify(altered));
  assert.throws(()=>guides.assets(guide,tmp),/Regional asset stays/);
  fs.writeFileSync(file,JSON.stringify(original));
  fs.appendFileSync(path.join(tmp,original.resources[0].path),'changed');
  assert.throws(()=>guides.assets(guide,tmp),/Changed asset/);
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
test('download exercises use the matching metric drawing without borrowing historical proof',()=>{
 for(const id of ['de','fr','es','pt-br']){
  const d=new JSDOM('<div class="dl-evaluation-body"><p>old</p><ol><li></li><li></li><li></li></ol><p class="dl-evaluation-scope"></p><a href="/samples/old.pdf"></a><a data-evaluation-target="guide"></a><a data-evaluation-target="evidence"></a></div>').window.document;
  guides.localizeEvaluation(d,id);
  assert(d.body.textContent.includes('360,00 m²'));assert(!d.body.textContent.includes('1.6.27'));
  assert(d.querySelector('a[href^="/localized-media/'+id+'/samples/construction/02-"]'));
  assert(d.querySelector('[data-evaluation-target="guide"]').getAttribute('href').startsWith('/'+id+'/'));
 }
});
