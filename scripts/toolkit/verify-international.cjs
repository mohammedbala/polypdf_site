'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),crypto=require('crypto');
const {JSDOM}=require('jsdom');
const locales=require('../../src/toolkit/locales.json'),catalog=require('../../src/toolkit/catalog.json'),copy=require('../../src/toolkit/page-content.json');
const icons=require('../../src/toolkit/icons.json');
const root=path.resolve(__dirname,'../..'),build=path.resolve(root,process.env.BUILD_PATH||'build'),origin='https://www.polypdf.com';
const manifest=JSON.parse(fs.readFileSync(path.join(build,'toolkit-international-manifest.json'),'utf8'));
const sitemap=fs.readFileSync(path.join(build,'sitemap.xml'),'utf8');
const locations=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);assert.equal(new Set(locations).size,locations.length,'unique sitemap URLs');
assert.equal(manifest.routes.length,locales.length*38);assert.equal(new Set(Object.values(icons)).size,36);
const source=JSON.parse(fs.readFileSync(path.join(root,'.tmp/toolkit-international/source-strings.json'),'utf8'));
const normalize=s=>s.replace(/\s+/g,' ').trim();
const reports=[];
for(const locale of locales) {
  const dictionary=JSON.parse(fs.readFileSync(path.join(root,'src/toolkit/translations',locale.id+'.json'),'utf8'));
  // In these 22 reviewed locale labels, conversions name the source format first.
  for(const tool of catalog.filter(t=>/^(jpg|png|webp)-to-pdf$|^pdf-to-(jpg|png|webp)$/.test(t.id))){
    const [from,to]=tool.id.split('-to-').map(value=>value==='webp'?'WebP':value.toUpperCase());
    const label=dictionary.strings[tool.name];assert(label.indexOf(from)>=0 && label.indexOf(from)<label.indexOf(to),`${locale.id}: conversion direction: ${tool.id}`);
  }
  for(const key of source.strings){
    const value=dictionary.strings[key];assert.equal(typeof value,'string',`${locale.id}: ${key}`);assert(value.trim());
    assert.deepEqual([...value.matchAll(/\{\d+\}/g)].map(m=>m[0]).sort(),[...key.matchAll(/\{\d+\}/g)].map(m=>m[0]).sort(),`${locale.id}: preserved template values: ${key}`);
    assert(!/ZXQ|QXZ|\[X\d{4}X\]/.test(value),`${locale.id}: no translation markers`);
    const terms=key.match(/(?<![A-Za-z])(?:PolyPDF|WebMCP|WebP|PDF|JPEG|JPG|PNG|MCP|JSON|CSV|ZIP|DPI|OCR|SVG|RGB|JavaScript|Node\.js)(?![A-Za-z])/g)||[];
    // German plural and Swedish possessive "PDFs" retain the format name.
    const targetTerms=value.replace(/\bPDFs\b/g,'PDF').match(/(?<![A-Za-z])(?:PolyPDF|WebMCP|WebP|PDF|JPEG|JPG|PNG|MCP|JSON|CSV|ZIP|DPI|OCR|SVG|RGB|JavaScript|Node\.js)(?![A-Za-z])/g)||[];
    for(const term of new Set(terms))assert(targetTerms.filter(t=>t===term).length>=terms.filter(t=>t===term).length,`${locale.id}: preserve ${term}: ${key}`);
  }
  const titles=new Set(),descriptions=new Set();let controls=0;
  for(const entry of manifest.routes.filter(e=>e.language===locale.language)) {
    const file=path.join(build,entry.route,'index.html'),html=fs.readFileSync(file,'utf8'),dom=new JSDOM(html),d=dom.window.document;
    const label=entry.route;
    assert.equal(d.documentElement.lang,locale.language,label);assert.equal(d.documentElement.dir,locale.dir||'ltr',label);
    assert.equal(d.title,entry.title,label);assert(!titles.has(entry.title),label+' unique title');titles.add(entry.title);
    assert.equal(d.querySelector('meta[name=title]').content,entry.title,label+' title parity');
    assert.equal(d.querySelector('meta[name="twitter:url"]').content,origin+entry.route,label+' sharing URL');
    assert.equal(d.querySelector('meta[property="og:title"]').content,entry.title,label+' sharing title');
    assert(entry.title.length<=105,label+' concise title');assert(entry.description.length<=285,label+' concise description');
    assert(!descriptions.has(entry.description),label+' unique description');descriptions.add(entry.description);
    assert.equal(d.querySelector('link[rel=canonical]').href,origin+entry.route,label);
    assert(!/noindex/.test(d.querySelector('meta[name=robots]').content),label);
    assert.equal(d.querySelectorAll('h1').length,1,label);
    const alternates=[...d.querySelectorAll('link[hreflang]')];assert.equal(alternates.length,locales.length+2,label);
    for(const l of locales)assert.equal(alternates.find(a=>a.hreflang===l.language)?.href,origin+'/'+l.id+entry.source+'/',label);
    assert(sitemap.includes('<loc>'+origin+entry.route+'</loc>'),label+' sitemap');
    const boot=JSON.parse(d.getElementById('pdf-tool-language').textContent);assert.equal(boot.locale,locale.id);
    const bytes=fs.readFileSync(path.join(build,boot.src));assert(boot.src.includes(crypto.createHash('sha256').update(bytes).digest('hex').slice(0,12)),label+' language content hash');
    assert.deepEqual(JSON.parse(bytes).strings,dictionary.strings,label+' saved language dictionary');
    assert(d.querySelector('script[src*="/static/js/main."]'),label+' interactive React runtime');
    assert.equal(d.querySelectorAll('.language-options a').length,locales.length+1,label+' language navigation');
    const tool=catalog.find(t=>entry.source==='/tools/'+t.id);
    if(tool){
      assert(d.querySelector(`.pdf-heading-icon svg[data-tool-icon="${tool.id}"]`),label+' original icon');
      assert.equal(d.querySelector('.pdf-answer').textContent, dictionary.strings[tool.answer],label+' translated direct answer');
      assert.equal(d.querySelectorAll('.pdf-tool-guide ol li').length,3,label);
      assert(d.querySelector('.pdf-tool-guide').textContent.includes(dictionary.strings[copy[tool.id].example]),label+' translated example');
      assert.equal(d.querySelectorAll('.pdf-answers details').length,5,label+' complete answers');
      for(const [question,answer] of copy[tool.id].faqs){assert(d.querySelector('.pdf-answers').textContent.includes(dictionary.strings[question]),label);assert(d.querySelector('.pdf-answers').textContent.includes(dictionary.strings[answer]),label);}
      assert.equal(d.querySelectorAll('.pdf-related a').length,3,label);
      for(const a of d.querySelectorAll('.pdf-related a'))assert(a.getAttribute('href').startsWith('/'+locale.id+'/tools/'),label+' localized next steps');
      const app=[...d.querySelectorAll('script[type="application/ld+json"]')].map(s=>JSON.parse(s.textContent)).find(s=>s['@type']==='WebApplication');
      assert(app,label);assert.equal(app.inLanguage,locale.language,label);assert.equal(app.url,origin+entry.route,label);assert.equal(app.description,dictionary.strings[tool.answer],label);assert.equal(app.offers.price,'0',label);
      assert(d.querySelector('.pdf-workspace button'),label+' working tool controls');controls++;
      assert(fs.existsSync(path.join(build,'tools/icons',tool.id+'.svg')),label);assert(fs.existsSync(path.join(build,'tools/social',tool.id+'.png')),label);
    } else if(entry.source==='/tools')assert.equal(d.querySelectorAll('.pdf-tool-card').length,36,label);
    const walker=d.createTreeWalker(d.getElementById('root'),4);
    while(walker.nextNode()){
      const node=walker.currentNode;if(node.parentElement.closest('svg,pre,code,[translate=no],.language-options'))continue;
      const text=normalize(node.textContent);if(dictionary.strings[text]&&dictionary.strings[text]!==text)assert.fail(label+': untranslated visible text: '+text);
    }
    for(const el of d.querySelectorAll('[aria-label],[placeholder],[title]'))for(const attr of ['aria-label','placeholder','title']){
      const text=el.getAttribute(attr);if(dictionary.strings[text]&&dictionary.strings[text]!==text)assert.fail(label+': untranslated '+attr+': '+text);
    }
    for(const a of d.querySelectorAll('a[href]')) {
      const url=new URL(a.getAttribute('href'),origin+entry.route);
      if(url.origin!==origin || /^\/(api|downloads)\//.test(url.pathname) || url.protocol!=='https:')continue;
      const target=path.join(build,decodeURIComponent(url.pathname));
      assert(fs.existsSync(target)||fs.existsSync(path.join(target,'index.html')),label+' internal destination '+a.getAttribute('href'));
    }
    dom.window.close();
  }
  reports.push({language:locale.language,pages:38,toolPages:controls,translatedStrings:source.strings.length,rtl:locale.dir==='rtl'});
  console.log(`Verified ${locale.label}: 38 interactive pages, translated content/controls, canonicals, 24 alternates, answers, schema, icons and destinations.`);
}
fs.mkdirSync(path.join(root,'.tmp/toolkit-international'),{recursive:true});fs.writeFileSync(path.join(root,'.tmp/toolkit-international/verification.json'),JSON.stringify({pages:manifest.routes.length,languages:locales.length+1,reports},null,2)+'\n');
console.log(`Toolkit international verification passed: ${manifest.routes.length} translated pages; ${locales.length+1} languages including English.`);
