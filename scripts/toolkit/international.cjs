// Called after English prerender with the same Babel/asset hooks and React renderer.
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'../..');
const locales=require('../../src/toolkit/locales.json');
const catalog=require('../../src/toolkit/catalog.json');
const routes=['/tools','/tools/automation',...catalog.map(t=>'/tools/'+t.id)];
const c=require('../international/content.cjs');
const json=value=>JSON.stringify(value).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
const esc=c.esc;

function extractLiterals(strings) {
  const babel=require('@babel/core'),traverse=require('@babel/traverse').default;
  const add=raw=>{const value=c.normalize(raw);if(c.isTranslatable(value) && !/^[./#]|^data:|^blob:|^(?:noindex|index),\s*(?:follow|nofollow)/.test(value))strings.add(value);};
  for(const filename of ['src/components/PdfTools.js','src/components/CookieConsent.js','src/components/ToolkitChrome.js','src/toolkit/seo.js','src/toolkit/engine.mjs','src/toolkit/render-adapter.mjs','src/toolkit/browser-runtime.js','src/toolkit/canvas-encode.mjs']) {
    const ast=babel.parseSync(fs.readFileSync(path.join(root,filename),'utf8'),{sourceType:'module',parserOpts:{plugins:['jsx']},configFile:false,babelrc:false});
    traverse(ast,{
      JSXText(p){add(p.node.value);},
      StringLiteral(p){if(p.parent.type==='JSXAttribute' && !['aria-label','alt','title','placeholder'].includes(p.parent.name.name))return;
        if(p.parent.type==='ImportDeclaration')return;
        if(/[\s?!…]/.test(p.node.value) || /^[A-Z][a-z]+$/.test(p.node.value))add(p.node.value);},
      TemplateLiteral(p){const value=p.node.quasis.map((q,i)=>q.value.cooked+(i<p.node.expressions.length?`{${i}}`:'')).join('');if(/[A-Za-z]{2}/.test(value)&&/[\s?!…]/.test(value))add(value);}
    });
  }
  for(const tool of catalog) {
    for(const key of ['name','summary','answer','limitation'])add(tool[key]);
    tool.steps.forEach(add);tool.fields.forEach(f=>{add(f.label);if(f.help)add(f.help);f.options?.forEach(add);});
  }
  function collect(value){if(typeof value==='string')add(value);else if(Array.isArray(value))value.forEach(collect);else if(value&&typeof value==='object')for(const [key,v] of Object.entries(value))if(key!=='related')collect(v);}
  collect(require('../../src/toolkit/page-content.json'));
}

module.exports=function buildToolkitInternational({React,renderToString,StaticRouter,AppRoutes,build}) {
  const {toolkitSEO,toolkitMetaValues}=require('../../src/toolkit/seo.js');
  const {translateText}=require('../../src/toolkit/language.js');
  const collect=process.env.TOOLKIT_EXTRACT==='1';
  const sourceStrings=new Set();extractLiterals(sourceStrings);
  sourceStrings.add('Reload tools');
  // A render through the real language provider captures complete adjacent text runs.
  for(const route of routes) {
    renderToString(React.createElement(StaticRouter,{location:'/es'+route+'/'},React.createElement(AppRoutes,{toolkitCollect:sourceStrings})));
    const language={locale:locales[0],collect:sourceStrings};toolkitSEO('/es'+route,language);
  }
  const strings=[...sourceStrings].filter(c.isTranslatable).sort();
  const sourceHash=crypto.createHash('sha256').update(JSON.stringify(strings)).digest('hex');
  const out=path.join(root,'.tmp/toolkit-international');fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'source-strings.json'),JSON.stringify({sourceHash,strings},null,2)+'\n');
  if(collect){console.log(`Toolkit extraction: ${strings.length} strings (${strings.join('').length} characters).`);return;}
  const manifest=[];
  fs.rmSync(path.join(build,'tools/i18n'),{recursive:true,force:true});
  for(const locale of locales) {
    const dictionary=JSON.parse(fs.readFileSync(path.join(root,'src/toolkit/translations',locale.id+'.json'),'utf8'));
    for(const source of strings)if(!dictionary.strings[source])throw new Error(`${locale.id}: missing toolkit translation: ${source}`);
    const language={locale,strings:dictionary.strings};
    const languageData=JSON.stringify({locale:locale.id,strings:dictionary.strings});
    const languageHash=crypto.createHash('sha256').update(languageData).digest('hex').slice(0,12);
    const languageSrc=`/tools/i18n/${locale.id}.${languageHash}.json`;
    fs.mkdirSync(path.join(build,'tools/i18n'),{recursive:true});fs.writeFileSync(path.join(build,languageSrc),languageData);
    const entries=[];
    for(const route of routes) {
      const localized='/'+locale.id+route+'/';
      const markup=renderToString(React.createElement(StaticRouter,{location:localized},React.createElement(AppRoutes,{toolkitStrings:dictionary.strings})));
      const seo=toolkitSEO(localized,language);
      let html=fs.readFileSync(c.fileFor(build,route),'utf8');
      // Retain the React bundle and exact server tree: tools must hydrate, not become static guides.
      html=html.replace(/<html[^>]*>/,`<html lang="${locale.language}" dir="${locale.dir||'ltr'}">`)
        .replace(/<title>[\s\S]*?<\/title>/,`<title>${esc(seo.title)}</title>`)
        .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g,'')
        .replace(/<link\b[^>]*\bhreflang=[^>]*>/g,'')
        .replace(/<div id="root">[\s\S]*<\/div>(?=\s*<\/body>)/,`<div id="root">${markup}</div>`);
      const {JSDOM}=require('jsdom');const dom=new JSDOM(html),d=dom.window.document;
      d.querySelector('link[rel="canonical"]').href=seo.url;
      const values=toolkitMetaValues(seo,locale);
      for(const [key,value]of Object.entries(values)) {let el=d.querySelector(`meta[${key.startsWith('og:')?'property':'name'}="${key}"]`);if(!el){el=d.createElement('meta');el.setAttribute(key.startsWith('og:')?'property':'name',key);d.head.appendChild(el);}el.content=value;}
      for(const alt of seo.alternatives){const el=d.createElement('link');el.rel='alternate';el.hreflang=alt.language;el.href=alt.href;d.head.appendChild(el);}
      for(const block of seo.blocks){const el=d.createElement('script');el.type='application/ld+json';el.textContent=json(block);d.head.appendChild(el);}
      const preload=d.createElement('link');preload.rel='preload';preload.setAttribute('as','fetch');preload.href=languageSrc;preload.setAttribute('crossorigin','anonymous');d.head.appendChild(preload);
      const payload=d.createElement('script');payload.type='application/json';payload.id='pdf-tool-language';payload.textContent=json({locale:locale.id,src:languageSrc,retryLabel:translateText('Reload tools',language)});d.body.appendChild(payload);
      const file=c.fileFor(build,localized);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,dom.serialize());dom.window.close();
      entries.push({route:localized,source:route,language:locale.language,title:seo.title,description:seo.description});
    }
    const llms=`# PolyPDF — ${locale.label}\n\n${translateText('36 free browser PDF tools',language)}\n\n${entries.map(e=>`- [${e.title}](https://www.polypdf.com${e.route}): ${e.description}`).join('\n')}\n\n${translateText('Files stay on your device. No account required.',language)}\n\nMCP: https://www.polypdf.com/${locale.id}/tools/automation/\nManifest: https://www.polypdf.com/tools/tool-manifest.json\n`;
    fs.writeFileSync(path.join(build,locale.id,'tools','llms.txt'),llms);
    manifest.push(...entries);console.log(`Toolkit localized: ${locale.id} (${entries.length} interactive pages).`);
  }
  for(const route of routes) {
    const file=c.fileFor(build,route);let html=fs.readFileSync(file,'utf8').replace(/<link\b[^>]*\bhreflang=[^>]*>/g,'');
    const seo=toolkitSEO(route,null);
    html=html.replace('</head>',seo.alternatives.map(a=>`<link rel="alternate" hreflang="${a.language}" href="${a.href}">`).join('')+'</head>');
    fs.writeFileSync(file,html);
  }
  const sitemapFile=path.join(build,'sitemap.xml');let sitemap=fs.readFileSync(sitemapFile,'utf8');
  const localizedURLs=new Set(manifest.map(e=>'https://www.polypdf.com'+e.route));
  sitemap=sitemap.replace(/<url>[\s\S]*?<\/url>/g,entry=>{
    const url=entry.match(/<loc>(.*?)<\/loc>/)?.[1];const route=url?new URL(url).pathname.replace(/\/+$/,''):'';
    if(localizedURLs.has(url))return '';
    if(!routes.includes(route))return entry;
    return entry.replace(/<xhtml:link\b[^>]*\/>/g,'').replace('</url>',toolkitSEO(route,null).alternatives.map(a=>`<xhtml:link rel="alternate" hreflang="${a.language}" href="${a.href}"/>`).join('')+'</url>');
  });
  sitemap=sitemap.replace('</urlset>',manifest.map(e=>`<url><loc>https://www.polypdf.com${e.route}</loc>${toolkitSEO(e.source,null).alternatives.map(a=>`<xhtml:link rel="alternate" hreflang="${a.language}" href="${a.href}"/>`).join('')}</url>`).join('\n')+'\n</urlset>');
  fs.writeFileSync(sitemapFile,sitemap);
  fs.writeFileSync(path.join(build,'toolkit-international-manifest.json'),JSON.stringify({sourceHash,locales,routes:manifest},null,2)+'\n');
  fs.writeFileSync(path.join(build,'tools/languages.json'),JSON.stringify({defaultLanguage:'en',locales:locales.map(l=>({...l,hub:`/${l.id}/tools/`,discovery:`/${l.id}/tools/llms.txt`}))},null,2)+'\n');
  const llmsFile=path.join(build,'llms.txt');fs.writeFileSync(llmsFile,fs.readFileSync(llmsFile,'utf8').split('\n## Browser tools in 23 languages\n')[0]+'\n## Browser tools in 23 languages\n\n'+locales.map(l=>`- [${l.label}](https://www.polypdf.com/${l.id}/tools/llms.txt)`).join('\n')+'\n');
  console.log(`Toolkit international publishing: ${manifest.length} pages; 23 languages including English.`);
};
