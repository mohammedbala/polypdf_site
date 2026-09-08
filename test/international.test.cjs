'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const {JSDOM}=require('jsdom');
const c=require('../scripts/international/content.cjs');
test('missing source translations fail instead of leaking English',()=>{
 const t=c.translateFactory({strings:{'Quick answer':'Respuesta breve'}});
 assert.equal(t('Quick answer'),'Respuesta breve');
 assert.throws(()=>t('New untranslated content'),/Missing translation/);
 assert.equal(t('PolyPDF'),'PolyPDF');
});
test('translates complete text fragments and accessible labels, preserves code and URLs',()=>{
 const dom=new JSDOM('<main><p>Hello <!-- -->world.</p><img alt="Sample drawing" src="/sample.png"><pre>const output = 42;</pre><a href="/blog/">Guide</a></main>');
 const translations={'Hello world.':'Hola mundo.','Sample drawing':'Plano de ejemplo','Guide':'Guía'};
 c.translateDOM(dom.window.document.querySelector('main'),c.translateFactory({strings:translations}));
 const d=dom.window.document;
 assert.equal(d.querySelector('p').textContent,'Hola mundo.');assert.equal(d.querySelector('img').alt,'Plano de ejemplo');
 assert.equal(d.querySelector('pre').textContent,'const output = 42;');assert.equal(d.querySelector('a').getAttribute('href'),'/blog/');
 dom.window.close();
});
test('localizes only published pages and labels the English checkout handoff',()=>{
 const dom=new JSDOM('<main><a href="/blog/?source=sample#guide">Guides</a><a href="/buy/?source=article">Buy</a><a href="/downloads/PolyPDFMac.dmg">Mac</a></main>');
 c.localizeLinks(dom.window.document,c.locales[0],s=>s);
 const links=[...dom.window.document.querySelectorAll('a')];
 assert.equal(links[0].getAttribute('href'),'/es/blog/?source=sample#guide');assert.equal(links[1].hreflang,'en');assert.equal(links[1].getAttribute('href'),'/buy/?source=intl_es_article');assert.match(links[1].textContent,/English/);
 assert.equal(links[2].getAttribute('href'),'/downloads/PolyPDFMac.dmg');dom.window.close();
});
test('symmetric hreflang includes self, English and x-default without fabricated regions',()=>{
 const alternates=c.alternatives('/blog/calibrate-pdf-drawing-scale');
 assert.equal(alternates.length,10);assert.equal(alternates.find(a=>a.language==='pt-BR').href,'https://www.polypdf.com/pt-br/blog/calibrate-pdf-drawing-scale/');
 assert.equal(alternates[0].href,alternates.at(-1).href);assert(!alternates.some(a=>a.language==='ar-SA'));
});
test('all article routes are eligible; private, legal and transaction routes are not',()=>{
 for(const [route,metadata] of Object.entries(c.metadata))if(metadata.type==='article')assert(c.routes.includes(route));
 for(const route of ['/account','/buy','/privacy','/versions','/upgrade'])assert(!c.routes.includes(route));
});
test('schema translates human text but preserves author identities, dates and asset URLs',()=>{
 const result=c.mapSchema({'@type':'BlogPosting',headline:'Title',datePublished:'2026-09-07',url:'https://www.polypdf.com/blog/',author:{'@type':'Organization',name:'PolyPDF',url:'https://www.polypdf.com/'},image:{url:'https://www.polypdf.com/guides/image.png',caption:'Caption'},inLanguage:'en'},s=>'Translated '+s,c.locales[0]);
 assert.equal(result.headline,'Translated Title');assert.equal(result.datePublished,'2026-09-07');assert.equal(result.author.url,'https://www.polypdf.com/');assert.equal(result.image.url,'https://www.polypdf.com/guides/image.png');assert.equal(result.inLanguage,'es');
});
