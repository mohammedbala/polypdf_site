const test=require('node:test'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const {localizedPage,pageTranslator,localizePageElements,localizeArticleImages}=require('../scripts/localization/pages.cjs');
const {translateDOM}=require('../scripts/international/content.cjs');
const locale={id:'de',language:'de'};
const manifest=()=>({locales:{de:{status:'pilot',appLocale:'de-DE',region:'DE',pages:{'/guide':{status:'complete',locale:'de-DE',region:'DE',evidence:'/proof.json',elements:[],text:{}}}}}});
test('only an explicitly completed route enables a partial locale pack',()=>{
  const data=manifest();
  assert.ok(localizedPage(data,locale,'/guide'));
  assert.equal(localizedPage(data,locale,'/other'),null);
  data.locales.de.pages['/guide'].region='AT';
  assert.throws(()=>localizedPage(data,locale,'/guide'),/Wrong page locale/);
  data.locales.de.pages['/guide'].status='draft';
  assert.equal(localizedPage(data,locale,'/guide'),null);
});
test('regional copy overrides are scoped and unused source text fails the build',()=>{
  const page={text:{'20 feet':'6,00 m','An example':'Ein Beispiel'}};
  const t=pageTranslator(s=>'base:'+s,page);
  assert.equal(t(' 20 feet '),'6,00 m');
  assert.equal(t('Other'),'base:Other');
  assert.throws(()=>t.verify(),/Stale regional page text/);
  assert.equal(t('An example'),'Ein Beispiel');
  t.verify();
  assert.equal(pageTranslator(s=>s,null)('20 feet'),'20 feet');
});
test('verification dates and formulas are source-bound and not translated a second time',()=>{
  const page={elements:[{selector:'dd',source:'Old date',target:'20. Oktober 2026'}]};
  const d=new JSDOM('<dl><dd>Old date</dd></dl>').window.document;
  localizePageElements(d,locale,page);
  translateDOM(d.body,()=>{throw Error('Double translation');});
  assert.equal(d.querySelector('dd').textContent,'20. Oktober 2026');
  for(const html of ['<dd>New date</dd>','<dd>Old date</dd><dd>Old date</dd>']){
    assert.throws(()=>localizePageElements(new JSDOM(html).window.document,locale,page),/Stale/);
  }
  assert.throws(()=>localizePageElements(new JSDOM('<dd><a href="/">Old date</a></dd>').window.document,locale,page),/Interactive/);
});
test('article schema images follow the same verified locale mapping while publisher logos remain shared',()=>{
  const data=manifest();data.languageNeutralAssets=[];
  data.locales.de.assets={'/guides/original.png':{url:'/localized-media/de/guides/example.png',status:'verified',locale:'de-DE',region:'DE',sourceSha256:'a'.repeat(64),sha256:'b'.repeat(64),appBuild:'test',width:1710,height:1073}};
  const blocks=[{'@type':'BlogPosting',image:{'@type':'ImageObject',url:'https://www.polypdf.com/guides/original.png?v=1',width:1200},publisher:{logo:'/brand.png'}}];
  localizeArticleImages(blocks,locale,data);
  assert.equal(blocks[0].image.url,'https://www.polypdf.com/localized-media/de/guides/example.png');
  assert.equal(blocks[0].image.height,1073);
  assert.equal(blocks[0].publisher.logo,'/brand.png');
  assert.throws(()=>localizeArticleImages([{'@type':'BlogPosting',image:'/guides/missing.png'}],locale,data),/Missing/);
});
