#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const c = require('./content.cjs');
const build = path.resolve(c.root,process.env.BUILD_PATH || 'build');
const collect = process.argv.includes('--extract');
const trackingScript = collect ? '/static/js/localized-tracking.extract.js' : JSON.parse(fs.readFileSync(path.join(build, 'localized-tracking-manifest.json'), 'utf8')).src;
const out = path.join(c.root,'.tmp/international');
fs.mkdirSync(out,{recursive:true});
const manifest = [];
const editorialTitles = require('../../src/content/translations/editorial-titles.json');
for (const locale of c.locales) if (!collect && c.routes.some((route)=>!editorialTitles[locale.id][route])) throw new Error('Editorial title coverage: '+locale.id);
const allLocales = collect ? [c.locales[0]] : c.locales;
const json = (value) => JSON.stringify(value).replaceAll('<','\\u003c').replaceAll('>','\\u003e').replaceAll('&','\\u0026');
for (const locale of allLocales) {
  const catalog = collect ? null : JSON.parse(fs.readFileSync(path.join(c.root,'src/content/translations',`${locale.id}.json`),'utf8'));
  const t = c.translateFactory(catalog,collect);
  const entries = [];
  for (const route of c.routes) {
    const {dom,assets,schema,meta} = c.sourcePage(build,route);
    const d = dom.window.document;
    c.translateDOM(d.body,t);
    d.querySelector('[data-language-slot]').outerHTML = c.languageNavigation(route,locale,t);
    c.localizeLinks(d,locale,t);
    const canonical = c.ORIGIN+c.localizedPath(locale.id,route);
    const translatedMeta = {...meta,title:t(meta.title),description:t(meta.description),imageAlt:t(meta.imageAlt || 'PolyPDF — PDF drawing measurement and markup on Mac and Windows')};
    translatedMeta.title = editorialTitles[locale.id]?.[route] || translatedMeta.title;
    const visibleTitle = translatedMeta.title.replace(/\s*\|\s*PolyPDF$/, '');
    d.querySelector('h1').textContent = visibleTitle;
    const image = new URL(meta.image || `/og-image.png?v=${require('../../src/lib/siteRelease.json').screenshotCacheToken}`,c.ORIGIN).href;
    const blocks = c.mapSchema(schema,t,locale);
    for (const block of blocks) {
      if (block['@type'] === 'BlogPosting') {
        block.inLanguage = locale.language;
        block.headline = visibleTitle;
        block.translationOfWork = {'@type':'BlogPosting',url:c.ORIGIN+c.routePath(route),inLanguage:'en'};
      }
      if (['WebPage','Blog'].includes(block['@type'])) { block.inLanguage = locale.language; block.name = translatedMeta.title; }
    }
    if (route === '/') blocks.push({'@context':'https://schema.org','@type':'WebPage',url:canonical,name:translatedMeta.title,description:translatedMeta.description,inLanguage:locale.language,isPartOf:{'@id':c.ORIGIN+'/#website'}});
    const consentUI = `<section data-local-consent class="localized-consent"><aside data-consent-banner hidden class="cookie-banner"><div class="container cookie-banner-inner"><p>${c.esc(t('Google cookies measure visits and ad results, only with your permission.'))} <a href="/cookies/" hreflang="en">${c.esc(t('Details'))}</a></p><div class="cookie-banner-actions"><button data-consent-action="reject">${c.esc(t('Reject optional cookies'))}</button><button data-consent-action="accept">${c.esc(t('Accept optional cookies'))}</button><button data-consent-action="settings">${c.esc(t('Cookie settings'))}</button></div></div></aside><button class="localized-cookie-settings" data-consent-action="settings">${c.esc(t('Cookie settings'))}</button><dialog class="privacy-dialog" aria-labelledby="local-cookie-title"><h2 id="local-cookie-title">${c.esc(t('Cookie settings'))}</h2><p>${c.esc(t('Choose how this browser shares information. You can change your choice here at any time.'))}</p><p data-privacy-signal hidden>${c.esc(t('Your browser privacy signal keeps optional tracking off.'))}</p><label class="privacy-option"><input type="checkbox" name="analytics"><span>${c.esc(t('Analytics'))} — ${c.esc(t('Google cookies measure visits and ad results, only with your permission.'))}</span></label><label class="privacy-option"><input type="checkbox" name="marketing"><span>${c.esc(t('Advertising measurement'))}</span></label><p><a href="/cookies/" hreflang="en">${c.esc(t('Cookie details and durations'))}</a> · <a href="/privacy/" hreflang="en">${c.esc(t('Privacy policy and your rights'))}</a></p><div class="privacy-actions"><button data-consent-action="reject">${c.esc(t('Reject optional cookies'))}</button><button data-consent-action="accept">${c.esc(t('Accept optional cookies'))}</button><button data-consent-action="save">${c.esc(t('Save choices'))}</button><button data-consent-action="close">${c.esc(t('Close without saving'))}</button></div><p>${c.esc(t('Changing a previously allowed category to off reloads this page to stop already loaded tracking. If browser storage is blocked, your choice lasts for this page only.'))}</p></dialog></section>`;
    const html = `<!doctype html><html lang="${locale.language}" dir="${locale.dir || 'ltr'}" class="localized-page"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${c.esc(translatedMeta.title)}</title><meta name="description" content="${c.esc(translatedMeta.description)}"><meta name="robots" content="index, follow, max-image-preview:large"><link rel="canonical" href="${canonical}">${c.alternatives(route).map((a)=>`<link rel="alternate" hreflang="${a.language}" href="${a.href}">`).join('')}<link rel="alternate" type="application/rss+xml" href="/${locale.id}/feed.xml" title="PolyPDF — ${locale.label}"><meta property="og:type" content="${meta.type || 'website'}"><meta property="og:url" content="${canonical}"><meta property="og:title" content="${c.esc(translatedMeta.title)}"><meta property="og:description" content="${c.esc(translatedMeta.description)}"><meta property="og:locale" content="${locale.og}"><meta property="og:image" content="${image}"><meta property="og:image:alt" content="${c.esc(translatedMeta.imageAlt)}"><meta property="og:image:width" content="${meta.imageWidth || 1200}"><meta property="og:image:height" content="${meta.imageHeight || 630}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${c.esc(translatedMeta.title)}"><meta name="twitter:description" content="${c.esc(translatedMeta.description)}"><meta name="twitter:image" content="${image}"><meta name="twitter:image:alt" content="${c.esc(translatedMeta.imageAlt)}"><link rel="icon" href="/favicon.ico">${assets}${blocks.map((b)=>`<script type="application/ld+json">${json(b)}</script>`).join('')}</head><body>${d.body.innerHTML}${consentUI}<script defer src="${trackingScript}"></script></body></html>`;
    const entry = {route:c.localizedPath(locale.id,route),source:route,language:locale.language,title:translatedMeta.title,description:translatedMeta.description,type:meta.type || 'website',image};
    entries.push(entry); manifest.push(entry);
    if (!collect) {
      const target = c.fileFor(build,c.localizedPath(locale.id,route));
      fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,html);
    }
    dom.window.close();
  }
  if (!collect) {
    const directory = path.join(build,locale.id);
    fs.writeFileSync(path.join(directory,'llms.txt'),`# PolyPDF — ${locale.label}\n\n${t('PDF tools for construction teams')}\n\n${entries.map((e)=>`- [${e.title}](${c.ORIGIN+e.route}): ${e.description}`).join('\n')}\n`);
    fs.writeFileSync(path.join(directory,'feed.xml'),`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>PolyPDF — ${locale.label}</title><link>${c.ORIGIN}/${locale.id}/blog/</link><description>${c.esc(t(c.metadata['/blog'].description))}</description><language>${locale.language}</language>${entries.filter((e)=>e.type==='article').map((e)=>`<item><title>${c.esc(e.title)}</title><link>${c.ORIGIN+e.route}</link><guid isPermaLink="true">${c.ORIGIN+e.route}</guid><description>${c.esc(e.description)}</description></item>`).join('')}</channel></rss>`);
  }
  console.log(`${collect ? 'Collected' : 'Localized'} ${c.routes.length} pages: ${locale.id}`);
}
const strings = [...c.sourceStrings].sort();
const sourceHash = crypto.createHash('sha256').update(JSON.stringify(strings)).digest('hex');
fs.writeFileSync(path.join(out,'source-strings.json'),JSON.stringify({sourceHash,strings},null,2)+'\n');
if (!collect) {
  // English HTML needs reciprocal alternatives before any JavaScript executes.
  for (const route of c.routes) {
    const file = c.fileFor(build,route);
    let html = fs.readFileSync(file,'utf8').replace(/<link\b[^>]*\bhreflang=[^>]*>/g,'');
    html = html.replace('</head>',c.alternatives(route).map((a)=>`<link rel="alternate" hreflang="${a.language}" href="${a.href}">`).join('')+'</head>');
    fs.writeFileSync(file,html);
  }
  let sitemap = fs.readFileSync(path.join(build,'sitemap.xml'),'utf8');
  if (!sitemap.includes('xmlns:xhtml=')) sitemap=sitemap.replace('<urlset ','<urlset xmlns:xhtml="http://www.w3.org/1999/xhtml" ');
  sitemap=sitemap.replace(/<url>[\s\S]*?<\/url>/g,(entry)=> {
    const loc=entry.match(/<loc>(.*?)<\/loc>/)?.[1];
    if (!loc) return entry;
    if (manifest.some((e)=>c.ORIGIN+e.route===loc)) return '';
    entry=entry.replace(/<xhtml:link\b[^>]*\/>/g,'');
    const route = new URL(loc).pathname.replace(/\/+$/,'') || '/';
    if (!c.routes.includes(route)) return entry;
    return entry.replace('</url>',c.alternatives(route).map((a)=>`<xhtml:link rel="alternate" hreflang="${a.language}" href="${a.href}"/>`).join('')+'</url>');
  });
  sitemap=sitemap.replace('</urlset>',manifest.map((e)=>`<url><loc>${c.ORIGIN+e.route}</loc>${c.alternatives(e.source).map((a)=>`<xhtml:link rel="alternate" hreflang="${a.language}" href="${a.href}"/>`).join('')}</url>`).join('\n')+'\n</urlset>');
  fs.writeFileSync(path.join(build,'sitemap.xml'),sitemap);
  const llmsFile=path.join(build,'llms.txt');
  fs.writeFileSync(llmsFile,fs.readFileSync(llmsFile,'utf8').split('\n## Languages\n')[0]+'\n## Languages\n\n'+c.locales.map((l)=>`- [${l.label}](${c.ORIGIN}/${l.id}/llms.txt): ${c.ORIGIN}/${l.id}/`).join('\n')+'\n');
  fs.writeFileSync(path.join(build,'international-manifest.json'),JSON.stringify({sourceHash,locales:c.locales,routes:manifest},null,2)+'\n');
  console.log(`International publishing: ${manifest.length} pages; ${strings.length} unique source strings.`);
} else console.log(`Extracted ${strings.length} strings (${strings.join('').length} characters).`);
