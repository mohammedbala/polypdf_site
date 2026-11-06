'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const {JSDOM}=require('jsdom');
const c=require('../scripts/international/content.cjs');
test('translated guides link into working localized applications, without static tool clones',()=>{
 const dom=new JSDOM('<main><a href="/tools/">PDF tools</a><a href="/tools/merge-pdf/">Merge</a><a href="/tools/tool-manifest.json">Manifest</a></main>');
 c.localizeLinks(dom.window.document,c.locales[0],s=>s);
 assert.deepEqual([...dom.window.document.querySelectorAll('a')].map(a=>a.getAttribute('href')),['/es/tools/','/es/tools/merge-pdf/','/tools/tool-manifest.json']);
 assert(!c.routes.includes('/tools'));assert(!c.routes.includes('/tools/merge-pdf'));dom.window.close();
});
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
 const englishOnly = require('../src/lib/englishOnlyRoutes.json');
 for(const [route,metadata] of Object.entries(c.metadata))if(metadata.type==='article')assert.equal(c.routes.includes(route),!englishOnly.includes(route));
 for(const route of ['/account','/buy','/privacy','/versions','/upgrade'])assert(!c.routes.includes(route));
});
test('schema translates human text but preserves author identities, dates and asset URLs',()=>{
 const result=c.mapSchema({'@type':'BlogPosting',headline:'Title',datePublished:'2026-09-07',url:'https://www.polypdf.com/blog/',author:{'@type':'Organization',name:'PolyPDF',url:'https://www.polypdf.com/'},image:{url:'https://www.polypdf.com/guides/image.png',caption:'Caption'},inLanguage:'en'},s=>'Translated '+s,c.locales[0]);
 assert.equal(result.headline,'Translated Title');assert.equal(result.datePublished,'2026-09-07');assert.equal(result.author.url,'https://www.polypdf.com/');assert.equal(result.image.url,'https://www.polypdf.com/guides/image.png');assert.equal(result.inLanguage,'es');
});
test('localized page identities change language without splitting the shared product identity',()=>{
 const page=c.mapSchema({'@type':'WebPage','@id':'https://www.polypdf.com/pdf-takeoff-software/#webpage',url:'https://www.polypdf.com/pdf-takeoff-software/',about:{'@id':'https://www.polypdf.com/#software'},publisher:{'@id':'https://www.polypdf.com/#organization'},isPartOf:{'@id':'https://www.polypdf.com/#website'}},s=>s,c.locales[0]);
 assert.equal(page['@id'],page.url+'#webpage');
 assert.equal(page.url,'https://www.polypdf.com/es/pdf-takeoff-software/');
 assert.equal(page.about['@id'],'https://www.polypdf.com/#software');
 assert.equal(page.publisher['@id'],'https://www.polypdf.com/#organization');
 assert.equal(page.isPartOf['@id'],'https://www.polypdf.com/#website');
});
const checks=require('../scripts/international/discovery-checks.cjs');
const pageDates=require('../scripts/international/page-dates.cjs');
test('localized llms.txt gives the product summary, download, purchase and tool paths from translated strings only',()=>{
 const seen=[];const t=s=>{seen.push(s);return 'T:'+s;};
 const entries=[{title:'Inicio',route:'/es/',description:'D'},{title:'Guías',route:'/es/blog/',description:'D'}],routes=entries.map(e=>e.route),summary='T:'+c.hubSummary;
 const text=c.marketingLlms(c.locales[0],entries,t);
 checks.assertMarketingLlms(text,'es',routes,summary);
 assert(text.includes('(https://www.polypdf.com/es/blog/)'),'localized discovery retained for the production smoke');
 const catalogs=c.locales.map(l=>JSON.parse(require('fs').readFileSync(require('path').join(c.root,'src/content/translations',l.id+'.json'),'utf8')).strings);
 for(const key of seen)for(const strings of catalogs)assert.equal(typeof strings[key],'string',key);
 assert.throws(()=>checks.assertMarketingLlms('# PolyPDF — Español\n\nPDF\n\n- [Inicio](https://www.polypdf.com/es/)\n','es',routes,summary),/must link/,'the previous list-only format is rejected');
 assert.throws(()=>checks.assertMarketingLlms(text.replace(/^> .*$/m,''),'es',routes,summary),/product summary/);
 assert.throws(()=>checks.assertMarketingLlms(text.replace(/^> .*$/m,'> '+c.hubSummary),'es',routes,summary),/product summary/,'an English summary is rejected');
 assert.throws(()=>checks.assertMarketingLlms(text.split('\n## ')[0],'es',routes,summary),/exactly once/,'a file without its page list is rejected');
 assert.throws(()=>checks.assertMarketingLlms(text,'es',[...routes,'/es/windows/'],summary),/\/es\/windows\/ exactly once/,'a missing page is rejected');
 assert.throws(()=>checks.assertMarketingLlms(text+'- [Guías](https://www.polypdf.com/es/blog/): D\n','es',routes,summary),/exactly once/,'a page listed twice is rejected');
 assert.throws(()=>checks.assertMarketingLlms(text,'es',[],summary),/inventory/,'an empty inventory cannot pass');
 assert.throws(()=>checks.assertMarketingLlms(text,'es',routes),/product summary/,'a missing expected summary cannot pass');
});
test('localized tool llms.txt lists every tool page and reaches the desktop path; English-only destinations are labeled',()=>{
 const toolsLlms=require('../scripts/toolkit/international.cjs').toolsLlms;
 const pages=(id)=>[{title:'Herramientas',route:`/${id}/tools/`,description:'D'},{title:'MCP',route:`/${id}/tools/automation/`,description:'D'},{title:'Unir',route:`/${id}/tools/merge-pdf/`,description:'D'}];
 const seen=new Set(),t=s=>{seen.add(s);return s;};
 const esRoutes=pages('es').map(e=>e.route),itRoutes=pages('it').map(e=>e.route);
 const marketing=toolsLlms({id:'es',label:'Español'},pages('es'),t,h=>h==='/buy/?source=llms'?'/buy/?source=intl_es_llms':'/es'+h);
 checks.assertToolsLlms(marketing,'es',true,esRoutes);assert(marketing.includes('[PDF takeoff](https://www.polypdf.com/es/pdf-takeoff-software/)'));
 const toolOnly=toolsLlms({id:'it',label:'Italiano'},pages('it'),t,h=>h==='/buy/?source=llms'?'/buy/?source=intl_it_llms':h);
 checks.assertToolsLlms(toolOnly,'it',false,itRoutes);assert(toolOnly.includes('[PDF takeoff (English)](https://www.polypdf.com/pdf-takeoff-software/)'));assert(!toolOnly.includes('/it/llms.txt'),'no link to an edition that does not exist');
 for(const l of require('../src/toolkit/locales.json')){const strings=require('../src/toolkit/translations/'+l.id+'.json').strings;for(const key of seen)assert.equal(typeof strings[key],'string',l.id+': '+key);}
 assert.throws(()=>checks.assertToolsLlms('# PolyPDF\n\nMCP: https://www.polypdf.com/it/tools/automation/\n','it',false,itRoutes),/must link/,'the previous tools-only format is rejected');
 assert.throws(()=>checks.assertToolsLlms(toolOnly,'es',true,itRoutes),/must link/,'a wrong-locale destination is rejected');
 assert.throws(()=>checks.assertToolsLlms(toolOnly.split('\n').filter(line=>!line.includes('/tools/merge-pdf/')).join('\n'),'it',false,itRoutes),/\/it\/tools\/merge-pdf\/ exactly once/,'a missing tool is rejected');
 assert.throws(()=>checks.assertToolsLlms(toolOnly.split('\n').filter(line=>!/^- \[[^\]]*\]\(https:\/\/www\.polypdf\.com\/it\/tools\//.test(line)).join('\n'),'it',false,itRoutes),/exactly once/,'the MCP line alone does not count as the tool list');
 assert.throws(()=>checks.assertToolsLlms(toolOnly,'it',false),/inventory/,'a missing inventory cannot pass');
});
test('localized sitemap dates must equal the ledger-derived date; feed dates are RFC 822 on every article',()=>{
 checks.assertLocalizedLastmod('2026-11-05','2026-11-05','/es/ ');
 checks.assertLocalizedLastmod(undefined,undefined,'/es/ ');
 assert.throws(()=>checks.assertLocalizedLastmod(undefined,'2026-11-05','/es/ '),/ledger/,'a recorded date that was not published is rejected');
 assert.throws(()=>checks.assertLocalizedLastmod('2026-10-16',undefined,'/es/ '),/ledger/,'an English date on an undated page is rejected');
 assert.throws(()=>checks.assertLocalizedLastmod('2026-10-16','2026-11-05','/es/ '),/ledger/);
 assert.throws(()=>checks.assertLocalizedLastmod('undefined',undefined,'/es/ '),/ledger/);
 assert.throws(()=>checks.assertLocalizedLastmod('2026-02-31','2026-02-31','/es/ '),/real date/,'an impossible date is rejected');
 const articles=[{route:'/es/blog/a/',published:'2026-10-15'},{route:'/es/blog/b/',published:'2026-09-07'}];
 const item=(route,date)=>`<item><link>https://www.polypdf.com${route}</link>${date===undefined?'':`<pubDate>${date}</pubDate>`}</item>`;
 const a=item('/es/blog/a/','Thu, 15 Oct 2026 12:00:00 GMT'),b=item('/es/blog/b/','Mon, 07 Sep 2026 12:00:00 GMT');
 checks.assertLocalizedFeedDates(a+b,'es',articles);
 assert.throws(()=>checks.assertLocalizedFeedDates(a+item('/es/blog/b/'),'es',articles),/RFC 822/,'every item needs a date');
 assert.throws(()=>checks.assertLocalizedFeedDates(a+item('/es/blog/b/','Invalid Date'),'es',articles),/RFC 822/);
 assert.throws(()=>checks.assertLocalizedFeedDates(a+item('/es/blog/b/','2026-09-07'),'es',articles),/RFC 822/,'an ISO date is rejected');
 assert.throws(()=>checks.assertLocalizedFeedDates(a+item('/es/blog/b/','Tue, 07 Sep 2026 12:00:00 GMT'),'es',articles),/RFC 822/,'a wrong weekday is rejected');
 assert.throws(()=>checks.assertLocalizedFeedDates(a,'es',articles),/one feed item per localized article/,'a feed missing an article is rejected');
 assert.throws(()=>checks.assertLocalizedFeedDates(a+item('/es/blog/b/','Tue, 08 Sep 2026 12:00:00 GMT'),'es',articles),/publication date/,'a valid date for the wrong day is rejected');
 assert.throws(()=>checks.assertLocalizedFeedDates(a+item('/es/blog/c/','Mon, 07 Sep 2026 12:00:00 GMT'),'es',articles),/feed item for \/es\/blog\/b\//);
 assert.throws(()=>checks.assertLocalizedFeedDates('<channel></channel>','es',articles),/one feed item per localized article/);
 assert.throws(()=>checks.assertLocalizedFeedDates(a+b,'es'),/articles to check/,'a missing article list cannot pass');
});
test('visible headings and article headlines never carry the title-tag separator',()=>{
 checks.assertVisibleHeading('PolyPDF para Windows','/es/windows/: ');
 assert.throws(()=>checks.assertVisibleHeading('PolyPDF para Windows | Medir y anotar planos PDF','/es/windows/: '),/title-tag separator/);
 assert.throws(()=>checks.assertVisibleHeading('  ','/es/windows/: '),/translated H1/);
});
test('page content hash covers the title, the description and the visible text, and nothing else',()=>{
 const page=(o={})=>`<!doctype html><html lang="es"><head><title>${o.title||'Título'}</title><meta name="description" content="${o.description||'Descripción'}">${o.head||''}</head><body>${o.body||'<h1>Medir   planos</h1>\n<p>Texto</p>'}${o.extra||''}</body></html>`;
 const base=pageDates.pageContentHash(page());
 assert.match(base,/^[a-f0-9]{64}$/);
 assert.equal(pageDates.pageContentHash(page()),base,'deterministic');
 assert.equal(pageDates.pageContentHash(page({body:'<h1 class="hero">Medir planos</h1><p>\n  Texto </p>'})),base,'markup, attributes and whitespace do not count');
 const machinery={head:'<link rel="stylesheet" href="/static/css/main.abc123.css"><script type="application/ld+json">{"dateModified":"2026-11-05"}</script>',extra:'<script src="/static/js/main.def456.js"></script><style>p{color:red}</style><noscript>Enable JavaScript</noscript><script type="application/json">{"src":"/tools/i18n/es.0123456789ab.json"}</script>'};
 assert.equal(pageDates.pageContentHash(page(machinery)),base,'scripts, styles, noscript, asset names and JSON-LD do not count');
 for(const changed of [{title:'Otro título'},{description:'Otra descripción'},{body:'<h1>Medir planos</h1><p>Texto nuevo</p>'},{extra:'<p>Más</p>'}])assert.notEqual(pageDates.pageContentHash(page(changed)),base,JSON.stringify(changed));
 const dom=new JSDOM(page(machinery));
 assert.equal(pageDates.documentContentHash(dom.window.document),base,'the verifiers hash their parsed document to the same value');
 assert.equal(dom.window.document.querySelectorAll('body script,body style,body noscript').length,4,'hashing leaves the document as it was');dom.window.close();
});
test('a localized URL is dated only while its content matches a dated ledger entry',()=>{
 const windows={path:'/es/windows/',kind:'marketing'},support={path:'/es/support/',kind:'marketing'},merge={path:'/it/tools/merge-pdf/',kind:'tool'},hub={path:'/it/tools/',kind:'tool'};
 const ledger={'/es/windows/':{hash:'a',date:'2026-11-05'},'/es/support/':{hash:'b'},'/it/tools/merge-pdf/':{hash:'c',date:'2026-11-05'},'/it/tools/':{hash:'d'}};
 // Dated match: the later of the recorded date and the English source date.
 assert.equal(pageDates.expectedLastmod(windows,'a',ledger,'2026-10-16'),'2026-11-05');
 assert.equal(pageDates.expectedLastmod(windows,'a',ledger,'2026-11-20'),'2026-11-20');
 assert.equal(pageDates.expectedLastmod(windows,'a',ledger,undefined),'2026-11-05');
 assert.equal(pageDates.expectedLastmod(merge,'c',ledger,'2026-11-01'),'2026-11-05');
 // Undated match: unchanged since the release the ledger was seeded from.
 assert.equal(pageDates.expectedLastmod(support,'b',ledger,'2026-10-16'),undefined);
 assert.equal(pageDates.expectedLastmod(hub,'d',ledger,'2026-11-01'),'2026-11-01');
 // Mismatch, or a page the ledger has never seen: no recorded date and never today's date.
 assert.equal(pageDates.expectedLastmod(windows,'edited',ledger,'2026-10-16'),undefined);
 assert.equal(pageDates.expectedLastmod(merge,'edited',ledger,'2026-11-01'),'2026-11-01');
 assert.equal(pageDates.expectedLastmod({path:'/es/new/',kind:'marketing'},'n',ledger,'2026-10-16'),undefined);
 assert.equal(pageDates.expectedLastmod({path:'/it/tools/new/',kind:'tool'},'n',ledger,'2026-11-01'),'2026-11-01');
 const pages=pageDates.localizedPages(),tools=require('../src/toolkit/locales.json').length*(require('../src/toolkit/catalog.json').length+2);
 assert.equal(pages.filter(p=>p.kind==='marketing').length,c.routes.length*c.locales.length);assert.equal(pages.filter(p=>p.kind==='tool').length,tools);
 assert.equal(new Set(pages.map(p=>p.path)).size,pages.length);
 assert.deepEqual(pages.find(p=>p.path==='/es/'),{path:'/es/',source:'/',kind:'marketing'});assert.deepEqual(pages.find(p=>p.path==='/he/tools/merge-pdf/'),{path:'/he/tools/merge-pdf/',source:'/tools/merge-pdf/',kind:'tool'});
});
test('recording dates only the pages whose content changed, and seeding stores live hashes undated',()=>{
 const ledger={'/es/a/':{hash:'a'},'/es/b/':{hash:'b',date:'2026-10-01'},'/es/c/':{hash:'c',date:'2026-10-01'},'/es/retired/':{hash:'r',date:'2026-09-01'}};
 const {ledger:next,recorded}=pageDates.recordLedger(ledger,{'/es/a/':'a','/es/b/':'b','/es/c/':'c2','/es/d/':'d'},'2026-11-05');
 assert.deepEqual(next,{'/es/a/':{hash:'a'},'/es/b/':{hash:'b',date:'2026-10-01'},'/es/c/':{hash:'c2',date:'2026-11-05'},'/es/retired/':{hash:'r',date:'2026-09-01'},'/es/d/':{hash:'d',date:'2026-11-05'}});
 assert.deepEqual(recorded,['/es/c/','/es/d/']);
 assert.deepEqual(ledger['/es/c/'],{hash:'c',date:'2026-10-01'},'the ledger passed in is not modified');
 assert.deepEqual(pageDates.recordLedger(next,{'/es/a/':'a','/es/b/':'b','/es/c/':'c2','/es/d/':'d'},'2026-12-01').recorded,[],'recording again changes nothing');
 for(const bad of ['2026-02-31','today','05-11-2026','2026-11-5',undefined])assert.throws(()=>pageDates.recordLedger(ledger,{},bad),/real date/,String(bad));
 const seeded=pageDates.seedLedger(ledger,{'/es/a/':'live','/es/b/':'b','/es/e/':'e'});
 assert.deepEqual(seeded.ledger['/es/a/'],{hash:'live'});assert.deepEqual(seeded.ledger['/es/b/'],{hash:'b',date:'2026-10-01'},'an entry that matches live keeps its date');assert.deepEqual(seeded.ledger['/es/e/'],{hash:'e'});assert.deepEqual(seeded.stored,['/es/a/','/es/e/']);
});
test('ledger dates are written to, and removed from, localized sitemap entries only',()=>{
 const origin='https://www.polypdf.com',alt='<xhtml:link rel="alternate" hreflang="en" href="https://www.polypdf.com/windows/"/>';
 const xml=`<urlset>\n  <url>\n    <loc>${origin}/windows/</loc>\n    <lastmod>2026-10-16</lastmod>\n  </url>\n<url><loc>${origin}/es/windows/</loc><lastmod>2026-10-16</lastmod>${alt}</url>\n<url><loc>${origin}/es/support/</loc>${alt}</url>\n<url><loc>${origin}/it/tools/</loc><lastmod>2026-11-01</lastmod>${alt}</url>\n</urlset>`;
 const dates=new Map([[origin+'/es/windows/',undefined],[origin+'/es/support/','2026-11-05'],[origin+'/it/tools/','2026-11-01']]);
 const out=pageDates.datedSitemap(xml,dates);
 assert.deepEqual([...pageDates.sitemapDates(out)],[[origin+'/windows/','2026-10-16'],[origin+'/es/windows/',undefined],[origin+'/es/support/','2026-11-05'],[origin+'/it/tools/','2026-11-01']]);
 assert.equal(out.split(alt).length,4,'alternates retained');assert(out.includes(`<loc>${origin}/windows/</loc>\n    <lastmod>2026-10-16</lastmod>`),'English entries untouched');
 assert.equal(pageDates.datedSitemap(out,dates),out,'applying twice changes nothing');
});
test('the ledger file is one sorted line per URL, and a malformed ledger is refused',()=>{
 const fs=require('fs'),path=require('path'),directory=fs.mkdtempSync(path.join(require('os').tmpdir(),'page-dates-')),file=path.join(directory,'page-dates.json');
 try {
  assert.deepEqual(pageDates.readLedger(file),{},'no ledger means no recorded dates');
  const hash='a'.repeat(64),ledger={'/es/windows/':{hash,date:'2026-11-05'},'/es/':{hash}};
  pageDates.writeLedger(ledger,file);
  assert.equal(fs.readFileSync(file,'utf8'),`{\n  "/es/": {"hash": "${hash}"},\n  "/es/windows/": {"hash": "${hash}", "date": "2026-11-05"}\n}\n`);
  assert.equal(fs.statSync(file).mode&0o777,0o644);assert.deepEqual(fs.readdirSync(directory),['page-dates.json'],'no temporary file left behind');
  assert.deepEqual(pageDates.readLedger(file),ledger);
  for(const bad of [{'/es/':{hash:'short'}},{'/es/':{date:'2026-11-05'}},{'/es/':{hash,date:'2026-02-31'}},{'/es/':null}]){fs.writeFileSync(file,JSON.stringify(bad));assert.throws(()=>pageDates.readLedger(file),/invalid entry/,JSON.stringify(bad));}
  pageDates.readLedger();
 } finally { fs.rmSync(directory,{recursive:true,force:true}); }
});
test('localized home product entity carries the translated product description, without a paid offer or Review schema',()=>{
 const product=c.metadata['/'].description;
 const english=[{'@type':'Organization','@id':'https://www.polypdf.com/#organization'},{'@type':'WebSite','@id':'https://www.polypdf.com/#website'},{'@type':'SoftwareApplication','@id':'https://www.polypdf.com/#software',description:product,offers:{'@type':'Offer',price:'0'}}];
 const blocks=c.mapSchema(c.homeProductSchema(english),s=>'T:'+s,c.locales[0]);
 assert.deepEqual(blocks.map(b=>b['@type']),['Organization','SoftwareApplication']);
 const description='T:'+product;
 checks.assertLocalizedHomeSchema(blocks,description,'/es/ ');
 for(const l of c.locales){const strings=JSON.parse(require('fs').readFileSync(require('path').join(c.root,'src/content/translations',l.id+'.json'),'utf8')).strings;assert.equal(typeof strings[product],'string',l.id+': translated product description');assert.notEqual(strings[product],product,l.id);}
 const withDescription=value=>[blocks[0],{...blocks[1],description:value}];
 assert.throws(()=>checks.assertLocalizedHomeSchema(withDescription('T:Measure construction PDFs, calculate quantities, compare drawing revisions, and review markups. Practical PolyPDF guides for construction teams.'),description,'/es/ '),/product description/,'the hub page meta description is rejected');
 assert.throws(()=>checks.assertLocalizedHomeSchema(withDescription(product),description,'/es/ '),/product description/,'an untranslated description is rejected');
 assert.throws(()=>checks.assertLocalizedHomeSchema(blocks,undefined,'/es/ '),/description to check/,'a missing expected description cannot pass');
 assert.throws(()=>checks.assertLocalizedHomeSchema([{'@type':'WebPage'}],description,'/es/ '),/product entity/,'the previous WebPage-only home is rejected');
 assert.throws(()=>checks.assertLocalizedHomeSchema([blocks[0],{...blocks[1],offers:{"@type":"Offer",price:"74.95"}}],description,"/es/ "),/Free offer/);
 assert.doesNotThrow(()=>checks.assertLocalizedHomeSchema([blocks[0],{...blocks[1],offers:[{"@type":"Offer",price:"0"},{"@type":"Offer",price:"74.95"}]}],description,"/es/ "));
 assert.throws(()=>checks.assertLocalizedHomeSchema([blocks[0],{...blocks[1],offers:[{"@type":"Offer",price:"0"},{"@type":"Offer",name:"Founder",price:"49.99"}]}],description,"/es/ "),/Founder/);
 assert.throws(()=>checks.assertLocalizedHomeSchema([blocks[1]],description,'/es/ '),/publisher/);
});
test('translated tool pages carry no English noscript or keywords shell',()=>{
 checks.assertNoEnglishToolShell('<head><meta name="title" content="x"></head><body><div id="root"></div></body>','/it/tools/');
 assert.throws(()=>checks.assertNoEnglishToolShell('<body><noscript>You can read these pages</noscript></body>','/it/tools/'),/noscript/);
 assert.throws(()=>checks.assertNoEnglishToolShell('<meta name="keywords" content="PolyPDF">','/it/tools/'),/keywords/);
});
