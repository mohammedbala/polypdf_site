#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const c = require('./content.cjs');
const build = path.resolve(c.root,process.env.BUILD_PATH || 'build');
const manifest = JSON.parse(fs.readFileSync(path.join(build,'international-manifest.json'),'utf8'));
assert.equal(manifest.routes.length,c.routes.length*c.locales.length);
const sitemapDom = new JSDOM(fs.readFileSync(path.join(build,'sitemap.xml'),'utf8'),{contentType:'text/xml'});
const sitemap = sitemapDom.window.document;
const urls = [...sitemap.querySelectorAll('url')];
const locations = urls.map((u)=>u.querySelector('loc').textContent);
assert.equal(new Set(locations).size,locations.length,'duplicate sitemap URLs');
const englishStructures = new Map();
for (const route of c.routes) {
  const dom = new JSDOM(fs.readFileSync(c.fileFor(build,route),'utf8'));
  const d = dom.window.document;
  englishStructures.set(route,{
    sections:d.querySelectorAll('#site-content .legal-section').length,
    steps:d.querySelectorAll('#site-content ol li').length,
    tables:d.querySelectorAll('#site-content table').length,
    images:[...d.querySelectorAll('#site-content img')].map((n)=>n.getAttribute('src')),
    faq:d.querySelectorAll('#site-content .blog-faq-item').length,
    code:[...d.querySelectorAll('#site-content pre')].map((n)=>n.textContent),
  });
  const alternates=[...d.querySelectorAll('head link[hreflang]')].map((a)=>({language:a.hreflang,href:a.href}));
  assert.deepEqual(alternates,c.alternatives(route),`${route}: reciprocal English hreflang`);
  dom.window.close();
}
let count=0;
for (const e of manifest.routes) {
  const locale=c.locales.find((l)=>l.language===e.language);
  const html=fs.readFileSync(c.fileFor(build,e.route),'utf8');
  const dom=new JSDOM(html);const d=dom.window.document;
  const prefix=`${e.route}: `;
  assert.equal(d.documentElement.lang,e.language,prefix+'language');
  assert.equal(d.documentElement.dir,locale.dir || 'ltr',prefix+'direction');
  assert.equal(d.title,e.title,prefix+'title');
  assert.equal(d.querySelector('meta[name="description"]').content,e.description,prefix+'description');
  assert.equal(d.querySelector('link[rel=canonical]').href,c.ORIGIN+e.route,prefix+'self canonical');
  assert.deepEqual([...d.querySelectorAll('head link[hreflang]')].map((a)=>({language:a.hreflang,href:a.href})),c.alternatives(e.source),prefix+'alternates');
  assert.equal(d.querySelectorAll('h1').length,1,prefix+'single H1');
  assert(d.querySelector('[data-site-footer]').textContent.includes('Euclidean Software LLC'),prefix+'publisher identity');
  assert(d.querySelector('h1').textContent.trim().length>0,prefix+'translated H1');
  assert.equal(d.querySelectorAll('script:not([type="application/ld+json"])').length,0,prefix+'no English hydration/trackers');
  assert.equal(d.querySelectorAll('button,input,form,select').length,0,prefix+'no inert React controls');
  assert(!/ZXQ|QXZ|\[X\d{4}X\]/i.test(html),prefix+'no translation tokens');
  assert(!/noindex/.test(d.querySelector('meta[name=robots]').content),prefix+'indexable');
  assert(locations.includes(c.ORIGIN+e.route),prefix+'sitemap');
  const url=urls.find((u)=>u.querySelector('loc').textContent===c.ORIGIN+e.route);
  assert.equal(url.getElementsByTagNameNS('http://www.w3.org/1999/xhtml','link').length,c.locales.length+2,prefix+'sitemap alternatives');
  if(e.source!=='/') {
    const original=englishStructures.get(e.source);
    assert.equal(d.querySelectorAll('#localized-content .legal-section').length,original.sections,prefix+'all sections retained');
    assert.equal(d.querySelectorAll('#localized-content ol li').length,original.steps,prefix+'all steps retained');
    assert.equal(d.querySelectorAll('#localized-content table').length,original.tables,prefix+'all tables retained');
    assert.equal(d.querySelectorAll('#localized-content .blog-faq-item').length,original.faq,prefix+'all FAQs retained');
    assert.deepEqual([...d.querySelectorAll('#localized-content img')].map((n)=>n.getAttribute('src')),original.images,prefix+'authentic images retained');
    assert.deepEqual([...d.querySelectorAll('#localized-content pre')].map((n)=>n.textContent),original.code,prefix+'code unchanged');
  }
  for(const script of d.querySelectorAll('script[type="application/ld+json"]')) {
    const schema=JSON.parse(script.textContent);
    assert.equal(schema['@context'],'https://schema.org');
    assert.notEqual(schema['@type'],'FAQPage');
    if(schema['@type']==='BlogPosting') {
      assert.equal(schema.url,c.ORIGIN+e.route,prefix+'article URL');
      assert.equal(schema.inLanguage,e.language,prefix+'article language');
      assert.equal(schema.headline,d.querySelector('h1').textContent,prefix+'schema matches visible headline');
      assert.equal(schema.translationOfWork.url,c.ORIGIN+c.routePath(e.source));
    }
  }
  for(const a of d.querySelectorAll('a[href]')) {
    const raw=a.getAttribute('href');const url=new URL(raw,c.ORIGIN+e.route);
    if(url.origin!==c.ORIGIN || !['https:','http:'].includes(url.protocol))continue;
    if(raw.startsWith('#')){assert(d.getElementById(url.hash.slice(1)),prefix+'fragment '+raw);continue;}
    if(url.pathname.startsWith('/downloads/') || url.pathname.startsWith('/api/'))continue;
    const file=path.join(build,decodeURIComponent(url.pathname));
    assert(fs.existsSync(file) || fs.existsSync(path.join(file,'index.html')),prefix+'internal link '+raw);
  }
  for(const node of d.querySelectorAll('img[src],link[rel=stylesheet]')) {
    const url=new URL(node.getAttribute('src') || node.getAttribute('href'),c.ORIGIN);
    if(url.origin===c.ORIGIN)assert(fs.existsSync(path.join(build,url.pathname.slice(1))),prefix+'asset '+url.pathname);
  }
  for(const img of d.querySelectorAll('img'))assert(img.hasAttribute('alt'),prefix+'image alt');
  dom.window.close();count++;
  if(count%c.routes.length===0)console.log(`Verified ${locale.label}: ${c.routes.length} full pages.`);
}
sitemapDom.window.close();
console.log(`International SEO/AEO verification passed: ${count} pages, 8 languages; content parity, code, assets, links, schema, canonical, hreflang, RTL and sitemap.`);
