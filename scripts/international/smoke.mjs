#!/usr/bin/env node
// Read-only production verification. No checkout sessions or analytics requests.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require=createRequire(import.meta.url);
const {ORIGIN,routes,locales,localizedPath,alternatives,esc}=require('./content.cjs');
export async function internationalSmoke(base=ORIGIN) {
  const manifestResponse=await fetch(`${base}/international-manifest.json`,{signal:AbortSignal.timeout(20000)});
  assert(manifestResponse.ok,`International manifest HTTP ${manifestResponse.status}`);
  const manifest=await manifestResponse.json();
  assert.equal(manifest.routes.length,routes.length*locales.length);
  const tasks=[...manifest.routes];let checked=0;
  await Promise.all(Array.from({length:4},async()=>{
    while(tasks.length){
      const entry=tasks.shift();
      const response=await fetch(base+entry.route,{headers:{'User-Agent':'PolyPDF-International-Smoke/1.0'},signal:AbortSignal.timeout(20000)});
      assert.equal(response.status,200,`${entry.route}: HTTP ${response.status}`);
      const html=await response.text();
      assert(html.includes(`<html lang="${entry.language}"`),`${entry.route}: language`);
      assert(html.includes(`<title>${esc(entry.title)}</title>`),`${entry.route}: title`);
      assert(html.includes(`<link rel="canonical" href="${ORIGIN+entry.route}">`),`${entry.route}: canonical`);
      for(const alternate of alternatives(entry.source)) assert(html.includes(`hreflang="${alternate.language}" href="${alternate.href}"`),`${entry.route}: ${alternate.language} alternative`);
      assert.equal((html.match(/<h1[\s>]/g)||[]).length,1,`${entry.route}: H1`);
      assert(!/<script[^>]+src=/.test(html),`${entry.route}: English hydration bundle`);
      if(entry.type==='article')assert(html.includes('"inLanguage":"'+entry.language+'"'),`${entry.route}: schema language`);
      checked++;
    }
  }));
  for(const locale of locales){
    const response=await fetch(`${base}/${locale.id}/llms.txt`);assert(response.ok,`${locale.id}: llms.txt`);
    const text=await response.text();assert(text.includes(`${ORIGIN}/${locale.id}/blog/`),`${locale.id}: localized discovery`);
    const feed=await fetch(`${base}/${locale.id}/feed.xml`);assert(feed.ok,`${locale.id}: RSS`);
  }
  console.log(`International production smoke passed: ${checked} pages and ${locales.length*2} localized discovery files.`);
  return checked;
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href)internationalSmoke(process.argv[2] || ORIGIN).catch((error)=>{console.error(error);process.exitCode=1;});
