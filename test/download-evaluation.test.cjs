'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const build = path.resolve(process.env.BUILD_PATH || 'build');
const locales = require('../src/lib/locales.json');
function files(dir) {
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e => {
    const p = path.join(dir,e.name);
    return e.isDirectory() ? files(p) : e.name.endsWith('.html') ? [p] : [];
  });
}
test('every built download exercise keeps the actual drawing and live destination fragments', () => {
  let pages=0,modules=0;
  const languages = new Set();
  const destinationIds = new Map();
  for(const file of files(build)) {
    const html=fs.readFileSync(file,'utf8');
    if(!html.includes('dl-evaluation-body')) continue;
    const dom=new JSDOM(html); const d=dom.window.document;
    pages++; languages.add(d.documentElement.lang);
    for(const exercise of d.querySelectorAll('.dl-evaluation')) {
      modules++;
      const details=exercise.querySelector('details');
      assert.equal(details.open,false,file);
      assert.equal(exercise.querySelectorAll('ol li').length,3,file);
      const sample=exercise.querySelector('a[download]');
      assert.equal(sample.getAttribute('href'),'/samples/construction/02-Architectural-Revision-A.pdf',file);
      assert.ok(fs.statSync(path.join(build,sample.getAttribute('href'))).size>1000);
      assert.equal(exercise.querySelectorAll('[data-evaluation-target]').length,3,file);
      for(const link of exercise.querySelectorAll('[data-evaluation-target]')) {
        const url=new URL(link.href,'https://www.polypdf.com');
        const destination=path.join(build,url.pathname,'index.html');
        assert.ok(fs.existsSync(destination),file+' -> '+url.pathname);
        if(!destinationIds.has(destination)) {
          const target=new JSDOM(fs.readFileSync(destination,'utf8'));
          destinationIds.set(destination,new Set([...target.window.document.querySelectorAll('[id]')].map(e=>e.id)));
          target.window.close();
        }
        assert.ok(destinationIds.get(destination).has(url.hash.slice(1)),file+' -> '+url.pathname+url.hash);
      }
      assert.match(exercise.textContent,/96/); assert.match(exercise.textContent,/60/);
      assert.match(exercise.textContent,/5,760/);
      if(d.documentElement.lang!=='en')
        assert.notEqual(details.querySelector('summary').textContent,'Try a checked construction takeoff',file);
    }
    dom.window.close();
  }
  assert.ok(pages>100);
  for(const l of ['en',...locales.map(l=>l.language)]) assert.ok(languages.has(l),l);
  console.log(JSON.stringify({pages,modules,languages:[...languages]}));
});
