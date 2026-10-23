import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {catalog} from './manifest.mjs';
const content=JSON.parse(fs.readFileSync('src/toolkit/page-content.json'));
const sitemap=fs.readFileSync('build/sitemap.xml','utf8');
const titles=new Set(),descriptions=new Set(),questions=new Set(),results=[];
assert.equal(Object.keys(content).length,catalog.length);
for(const tool of catalog){
 const route=`/tools/${tool.id}/`,copy=content[tool.id],url=`https://www.polypdf.com${route}`;
 const html=fs.readFileSync(`build${route}index.html`,'utf8'),dom=new JSDOM(html),doc=dom.window.document;
 assert.equal(doc.title,copy.title);
 assert.ok(copy.title.length<=60,`${tool.id}: title too long`);
 assert.ok(copy.description.length>=100&&copy.description.length<=155,`${tool.id}: description length`);
 assert.ok(!titles.has(copy.title));titles.add(copy.title);
 assert.ok(!descriptions.has(copy.description));descriptions.add(copy.description);
 assert.equal(doc.querySelector('meta[name="description"]').content,copy.description);
 assert.equal(doc.querySelector('meta[property="og:description"]').content,copy.description);
 assert.equal(doc.querySelector('link[rel="canonical"]').href,url);
 assert.ok(!/noindex/.test(doc.querySelector('meta[name="robots"]')?.content||''));
 assert.equal(doc.querySelectorAll('h1').length,1);
 assert.ok(doc.querySelector('.pdf-answer').textContent.includes(tool.answer));
 assert.ok(doc.querySelector('.pdf-tool-guide').textContent.includes(copy.example));
 assert.equal(doc.querySelectorAll('.pdf-answers details').length,5);
 for(const [q,a]of copy.faqs){assert.ok(!questions.has(q),`Repeated task FAQ: ${q}`);questions.add(q);assert.ok(doc.querySelector('.pdf-answers').textContent.includes(q));assert.ok(doc.querySelector('.pdf-answers').textContent.includes(a));}
 assert.equal(copy.related.length,3);
 for(const id of copy.related){assert.ok(id!==tool.id&&catalog.some(t=>t.id===id));assert.ok(doc.querySelector(`.pdf-related a[href="/tools/${id}/"]`));}
 const structured=[...doc.querySelectorAll('script[type="application/ld+json"]')].flatMap(s=>{const v=JSON.parse(s.textContent);return v['@graph']||[v]});
 const app=structured.find(s=>s['@type']==='WebApplication');assert.ok(app);assert.equal(app.url,url);assert.equal(app.description,tool.answer);assert.equal(app.offers.price,'0');
 assert.ok(structured.some(s=>s['@type']==='BreadcrumbList'));
 assert.ok(sitemap.includes(url));
 assert.ok(doc.querySelector('a[href="/tools/automation/"]'));
 results.push({route,title:doc.title,descriptionLength:copy.description.length,taskQuestions:copy.faqs.length,related:copy.related,staticContent:true,indexable:true});
 dom.window.close();
}
console.log(JSON.stringify({pages:results.length,uniqueTaskQuestions:questions.size,results},null,2));
