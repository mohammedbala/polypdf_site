const test=require('node:test'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const {localizedPage,pageTranslator,localizePageElements,localizeArticleImages}=require('../scripts/localization/pages.cjs');
const {translateDOM}=require('../scripts/international/content.cjs');
const locale={id:'de',language:'de'};
const {localizeRegionalCopy}=require('../scripts/localization/media.cjs');

test('shared exercises preserve exact guide prose while retaining stale-source detection',()=>{
  const data={locales:{de:{appLocale:'de-DE',region:'DE',regionalText:{'exercise.review.step1':{source:'Open the two sheets.',target:'Beide Blätter öffnen.'}}}}};
  const page={locale:'de-DE',region:'DE',text:{'Open the two sheets.':'Nur X101 öffnen.'},elements:[]};
  const make=text=>new JSDOM(`<p data-regional-copy="exercise.review.step1">${text}</p>`).window.document;
  const d=make('Open the two sheets.');
  localizeRegionalCopy(d,locale,data,page);
  const t=pageTranslator(()=>{throw Error('Unexpected base translation');},page);
  translateDOM(d.body,t);t.verify();
  assert.equal(d.querySelector('p').textContent,'Nur X101 öffnen.');
  assert.throws(()=>localizeRegionalCopy(make('Changed source.'),locale,data,page),/Stale regional exercise/);
  assert.throws(()=>localizeRegionalCopy(make('Open the two sheets.'),locale,data,{...page,region:'FR'}),/Wrong regional copy page/);
});

test('guide-specific filenames require an applied source-bound element override',()=>{
  const data={locales:{de:{appLocale:'de-DE',region:'DE',regionalText:{'library.11.filename':{source:'Source.pdf',target:'Zwei-Blaetter.pdf'}}}}};
  const page={locale:'de-DE',region:'DE',text:{},elements:[{selector:'bdi',source:'Source.pdf',target:'x101.pdf'}]};
  const make=()=>new JSDOM('<bdi data-regional-copy="library.11.filename" translate="no">Source.pdf</bdi>').window.document;
  assert.throws(()=>localizeRegionalCopy(make(),locale,data,page),/Stale regional page exercise/);
  const d=make();localizePageElements(d,locale,page);localizeRegionalCopy(d,locale,data,page);
  assert.equal(d.querySelector('bdi').textContent,'x101.pdf');
  const changed=structuredClone(data);changed.locales.de.regionalText['library.11.filename'].source='Different.pdf';
  assert.throws(()=>localizeRegionalCopy(d,locale,changed,page),/Stale regional page exercise/);
});
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
test('regional download references require the intended link, locale path and exact file bytes',()=>{
  const {localizePageLinks}=require('../scripts/localization/pages.cjs');
  const {createHash}=require('node:crypto');
  const bytes=Buffer.from('regional source');
  const entry={selector:'a',source:'https://example.org/original',url:'/localized-media/de/samples/plate.pdf',label:'Deutscher Übungsplan',sha256:createHash('sha256').update(bytes).digest('hex')};
  const page={locale:'de-DE',links:[entry]};
  const make=()=>new JSDOM('<a href="https://example.org/original" hreflang="en">Old drawing</a>').window.document;
  const d=make();localizePageLinks(d,locale,page,p=>{assert.equal(p,entry.url);return bytes;});
  assert.equal(d.querySelector('a').getAttribute('href'),entry.url);
  assert.equal(d.querySelector('a').textContent,entry.label);
  assert.equal(d.querySelector('a').lang,'de-DE');
  assert.equal(d.querySelector('a').hasAttribute('hreflang'),false);
  assert.throws(()=>localizePageLinks(d,locale,page,()=>bytes),/Stale/);
  assert.throws(()=>localizePageLinks(make(),locale,page,()=>Buffer.from('changed')),/Changed/);
  for(const url of ['/localized-media/fr/plate.pdf','https://elsewhere.test/plate.pdf','/localized-media/de/%2e%2e/plate.pdf']){
    assert.throws(()=>localizePageLinks(make(),locale,{...page,links:[{...entry,url}]},()=>bytes),/Invalid/);
  }
});

test('a source-bound bibliography row becomes a verified regional download without HTML injection',()=>{
  const {localizePageLinks}=require('../scripts/localization/pages.cjs');
  const {createHash}=require('node:crypto'),bytes=Buffer.from('regional drawing');
  const entry={selector:'li',source:'Historical drawing — Old note',url:'/localized-media/de/samples/count.pdf',label:'Deutscher Übungsplan',note:'<b>Fiktiv</b>',sha256:createHash('sha256').update(bytes).digest('hex')};
  const page={locale:'de-DE',downloads:[entry]},make=()=>new JSDOM('<ol><li>Historical drawing<span> — Old note</span></li></ol>').window.document;
  const d=make();localizePageElements(d,locale,page);translateDOM(d.body,()=>{throw Error('Source row translated too soon');});
  localizePageLinks(d,locale,page,()=>bytes);
  assert.equal(d.querySelector('a').getAttribute('href'),entry.url);assert.equal(d.querySelector('li').lang,'de-DE');
  assert.equal(d.querySelector('span').textContent,' — <b>Fiktiv</b>');assert.equal(d.querySelector('b'),null);
  assert.throws(()=>localizePageElements(new JSDOM('<li>Changed drawing</li>').window.document,locale,page),/Stale/);
  assert.throws(()=>localizePageLinks(make(),locale,page,()=>bytes),/Stale/);
  const changed=make();localizePageElements(changed,locale,page);
  assert.throws(()=>localizePageLinks(changed,locale,page,()=>Buffer.from('changed')),/Changed/);
  assert.throws(()=>localizePageLinks(changed,locale,{...page,downloads:[{...entry,url:'/localized-media/fr/sample.pdf'}]},()=>bytes),/Invalid/);
});

test('regional PDF cards keep their preview when the destination and label change',()=>{
  const {localizePageLinks}=require('../scripts/localization/pages.cjs');
  const {createHash}=require('node:crypto'),bytes=Buffer.from('regional drawing');
  const entry={selector:'a',source:'/old.pdf',url:'/localized-media/de/samples/compare/revision.pdf',label:'Revision herunterladen',labelSelector:'span',sha256:createHash('sha256').update(bytes).digest('hex')};
  const page={locale:'de-DE',links:[entry]},make=()=>new JSDOM('<a href="/old.pdf" download><img src="/german-preview.png" alt="Deutscher Grundriss"><span>Download</span></a>').window.document;
  const d=make();localizePageLinks(d,locale,page,()=>bytes);
  assert.equal(d.querySelector('img').getAttribute('src'),'/german-preview.png');assert.equal(d.querySelector('img').alt,'Deutscher Grundriss');
  assert.equal(d.querySelector('span').textContent,entry.label);assert.equal(d.querySelector('a').getAttribute('href'),entry.url);assert.ok(d.querySelector('a').hasAttribute('download'));
  for(const labelSelector of [undefined,'img','missing'])assert.throws(()=>localizePageLinks(make(),locale,{...page,links:[{...entry,labelSelector}]},()=>bytes),/regional download label/);
  const ambiguous=make();ambiguous.querySelector('a').append(ambiguous.createElement('span'));assert.throws(()=>localizePageLinks(ambiguous,locale,page,()=>bytes),/regional download label/);
  const nested=make();nested.querySelector('span').innerHTML='<button>Action</button>';assert.throws(()=>localizePageLinks(nested,locale,page,()=>bytes),/regional download label/);
});

test('supplemental regional downloads require one bibliography and verified local bytes',()=>{
  const {localizePageLinks}=require('../scripts/localization/pages.cjs');
  const {createHash}=require('node:crypto'),bytes=Buffer.from('summary export');
  const entry={url:'/localized-media/de/samples/summary.pdf',label:'PDF-Übersicht',note:'<script>literal text</script>',sha256:createHash('sha256').update(bytes).digest('hex')};
  const page={locale:'de-DE',extraDownloads:[entry]};
  const make=()=>new JSDOM('<section class="blog-sources"><ol><li>Existing reference</li></ol></section>').window.document;
  const d=make();localizePageLinks(d,locale,page,()=>bytes);
  assert.equal(d.querySelectorAll('li').length,2);assert.equal(d.querySelector('li').textContent,'Existing reference');
  assert.equal(d.querySelector('a').getAttribute('href'),entry.url);assert.equal(d.querySelector('a').lang,'de-DE');
  assert.equal(d.querySelector('span').textContent,' — '+entry.note);assert.equal(d.querySelector('script'),null);
  assert.throws(()=>localizePageLinks(make(),locale,page,()=>Buffer.from('wrong file')),/Changed/);
  assert.throws(()=>localizePageLinks(make(),locale,{...page,extraDownloads:[{...entry,url:'/localized-media/fr/summary.pdf'}]},()=>bytes),/Invalid/);
  for(const html of ['', '<section class="blog-sources"><ol></ol><ol></ol></section>'])
    assert.throws(()=>localizePageLinks(new JSDOM(html).window.document,locale,page,()=>bytes),/Missing regional download list/);
});
