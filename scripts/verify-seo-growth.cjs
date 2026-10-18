'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const { JSDOM } = require('jsdom');
const axe = require('axe-core');
const englishOnly = require('../src/lib/englishOnlyRoutes.json');
const build = path.resolve(process.env.BUILD_PATH || 'build');
const routes = ['/','/tools/construction-takeoff-spreadsheet','/compare-pdf-drawings','/construction-pdf-markup','/windows','/pdf-takeoff-software','/measure-pdf-on-mac','/product-facts','/pdf-measuring-tool','/electrical-takeoff-software','/flooring-takeoff-software','/bluebeam-alternative','/samples','/tools','/tools/flooring-waste-calculator','/tools/pdf-scale-checker','/blog/quantity-takeoff','/blog/create-fillable-pdf-form','/blog/calibrate-pdf-drawing-scale','/blog/why-pdf-measurements-are-wrong','/blog/pdf-takeoff-worked-example','/visual-search-pdf-count','/blog/count-pdf-symbols','/blog/measure-pdf-area-cutouts-depth','/blog/compare-pdf-drawing-revisions','/blog/pdf-markup-table-rfi-punch-list','/blog/ocr-scanned-pdf-drawings'];
(async () => {
 const results = [];
 for (const route of routes) {
  const canonical = 'https://www.polypdf.com' + (route === '/' ? '/' : route + '/');
  const dom = new JSDOM(fs.readFileSync(path.join(build, route, 'index.html'),'utf8'), { runScripts:'outside-only', url:canonical });
  const d=dom.window.document;
  assert.equal(d.querySelectorAll('h1').length,1,route+' single H1');
  assert.equal(d.querySelector('link[rel=canonical]').href,canonical,route+' canonical');
  assert(!d.querySelector('meta[name=robots]').content.includes('noindex'),route+' indexable');
  if (englishOnly.includes(route)) assert(!d.querySelector('link[hreflang]'),route+' English-only until localization');
  else assert(d.querySelector('link[hreflang="en"]'),route+' localized language alternatives');
  const ids=[...d.querySelectorAll('[id]')].map(el=>el.id);
  assert.equal(ids.length,new Set(ids).size,route+' unique IDs');
  for(const a of d.querySelectorAll('a[href]')) {
   const u=new URL(a.href); if(u.origin!=='https://www.polypdf.com')continue;
   if(u.pathname.startsWith('/downloads/')||u.pathname.startsWith('/api/'))continue;
   const local=path.join(build,decodeURIComponent(u.pathname),path.extname(u.pathname)?'':'index.html');
   assert(fs.existsSync(local),route+' broken local link: '+a.getAttribute('href'));
  }
  dom.window.eval(axe.source);
  const audit=await dom.window.axe.run(d,{rules:{'color-contrast':{enabled:false}}});
  assert.equal(audit.violations.length,0,route+' static accessibility: '+JSON.stringify(audit.violations.map(v=>({id:v.id,help:v.help,nodes:v.nodes.map(n=>n.target)}))));
  results.push({route,staticAccessibilityViolations:0,links:'pass',canonical:'pass',h1:'pass'});
  dom.window.close();
 }
 fs.mkdirSync('docs/audits',{recursive:true});
 fs.writeFileSync('docs/audits/seo-growth-build-validation-2026-10-17.json',JSON.stringify({date:'2026-10-17',scope:'Static build checks; JSDOM axe excludes color contrast. Does not establish WCAG conformance or field performance.',results},null,2)+'\n');
 console.log('SEO growth build checks passed: '+routes.length+' routes, internal links, unique IDs, static accessibility, canonicals and language scope.');
})().catch(e=>{console.error(e);process.exitCode=1;});
