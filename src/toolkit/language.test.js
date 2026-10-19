import React from 'react';
import {createRoot,hydrateRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {MemoryRouter,Routes,Route} from 'react-router';
import {renderToString} from 'react-dom/server.node';
import {ToolkitLanguageProvider,translateText,localizedHref,localizeView,sourceRoute,toolkitLocale} from './language';
import {loadToolLanguage} from './load-language';
import {PdfToolsHub,PdfToolPage} from '../components/PdfTools';
import locales from './locales.json';
import tools from './catalog.json';
import icons from './icons.json';
import {toolkitSEO,toolkitMetaValues} from './seo';

const spanish={locale:locales[0],strings:{'Choose {0} files for this tool.':'Elige archivos {0} para esta herramienta.','Choose files':'Elegir archivos','left':'izquierda','My report.pdf':'NO TRADUCIR'}};
let consoleError;
beforeAll(()=>{global.IS_REACT_ACT_ENVIRONMENT=true;const original=console.error;consoleError=jest.spyOn(console,'error').mockImplementation((message,...args)=>{
  if(typeof message==='string' && message.startsWith('Warning: useLayoutEffect does nothing on the server'))return;
  original(message,...args);
});});
afterAll(()=>consoleError.mockRestore());
test('all 36 icons are original, distinct operation drawings',()=>{
  expect(Object.keys(icons).sort()).toEqual(tools.map(t=>t.id).sort());
  expect(new Set(Object.values(icons)).size).toBe(36);
  for(const d of Object.values(icons))expect(d).toMatch(/^M[\d .A-Za-z,-]+$/);
});
test('localized routes preserve destination and canonical protocol data',()=>{
  expect(sourceRoute('/pt-br/tools/merge-pdf/')).toBe('/tools/merge-pdf');
  expect(toolkitLocale('/zh-tw/tools/split-pdf/').language).toBe('zh-TW');
  expect(localizedHref('/tools/merge-pdf/?example=1#workspace',spanish)).toBe('/es/tools/merge-pdf/?example=1#workspace');
  expect(localizedHref('/tools/tool-manifest.json',spanish)).toBe('/tools/tool-manifest.json');
  expect(localizedHref('/samples/construction/02-Architectural-Revision-A.pdf',spanish)).toBe('/samples/construction/02-Architectural-Revision-A.pdf');
  expect(localizedHref('/pdf-takeoff-software/',{locale:locales.find(l=>l.id==='it')})).toBe('/pdf-takeoff-software/');
  expect(localizedHref('/buy/?source=browser_tools',spanish)).toContain('source=intl_es_browser_tools');
});
test('translated templates preserve dynamic file types verbatim',()=>{
  expect(translateText('Choose pdf, jpg files for this tool.',spanish)).toBe('Elige archivos pdf, jpg para esta herramienta.');
});
test('translates labels without changing field values, filenames or document content',()=>{
  const node=document.createElement('div'),root=createRoot(node);
  act(()=>root.render(localizeView(<div><button aria-label="Choose files">Choose files</button><select defaultValue="left"><option value="left">left</option></select><span translate="no">My report.pdf</span><pre>Choose files</pre><input defaultValue="Choose files"/></div>,spanish)));
  expect(node.querySelector('button').textContent).toBe('Elegir archivos');
  expect(node.querySelector('button').getAttribute('aria-label')).toBe('Elegir archivos');
  expect(node.querySelector('select').value).toBe('left');expect(node.querySelector('option').textContent).toBe('izquierda');
  expect(node.querySelector('span').textContent).toBe('My report.pdf');expect(node.querySelector('pre').textContent).toBe('Choose files');expect(node.querySelector('input').value).toBe('Choose files');
  act(()=>root.unmount());
});
test('loads only a pinned same-origin language dictionary; rejects mismatches and HTTP failure',async()=>{
  const doc=document.implementation.createHTMLDocument('');const script=doc.createElement('script');script.id='pdf-tool-language';script.textContent=JSON.stringify({locale:'es',src:'/tools/i18n/es.123456abcdef.json'});doc.body.appendChild(script);
  const fetcher=jest.fn(async()=>({ok:true,json:async()=>({locale:'es',strings:spanish.strings})}));
  expect(await loadToolLanguage(doc,fetcher)).toEqual(spanish.strings);expect(fetcher).toHaveBeenCalledWith('/tools/i18n/es.123456abcdef.json',{credentials:'same-origin'});
  await expect(loadToolLanguage(doc,async()=>({ok:false}))).rejects.toThrow('unavailable');
  await expect(loadToolLanguage(doc,async()=>({ok:true,json:async()=>({locale:'fr',strings:{}})}))).rejects.toThrow('Invalid');
});
test.each(locales)('$id: translated directory works and hydrates without replacing its server content',async locale=>{
  const dictionary=require(`./translations/${locale.id}.json`),language={locale,strings:dictionary.strings};
  const tree=<ToolkitLanguageProvider value={language}><MemoryRouter initialEntries={[`/${locale.id}/tools/`]}><PdfToolsHub/></MemoryRouter></ToolkitLanguageProvider>;
  const node=document.createElement('div');document.body.appendChild(node);node.innerHTML=renderToString(tree);
  const firstCard=node.querySelector('.pdf-tool-card'),recover=jest.fn();let root;
  await act(async()=>{root=hydrateRoot(node,tree,{onRecoverableError:recover});});
  expect(recover).not.toHaveBeenCalled();expect(node.querySelector('.pdf-tool-card')).toBe(firstCard);
  expect(node.querySelectorAll('.pdf-tool-card')).toHaveLength(36);
  const forms=[...node.querySelectorAll('.pdf-filters button')].find(b=>b.textContent===dictionary.strings.Forms);
  act(()=>forms.click());expect(node.querySelectorAll('.pdf-tool-card')).toHaveLength(3);
  expect([...node.querySelectorAll('.pdf-tool-card')].every(a=>a.getAttribute('href').startsWith(`/${locale.id}/tools/`))).toBe(true);
  act(()=>root.unmount());node.remove();
});
test.each(locales)('$id: all 36 tool pages retain their controls, local answers and icons',locale=>{
  const strings=require(`./translations/${locale.id}.json`).strings,language={locale,strings};
  for(const tool of tools){
    const html=renderToString(<ToolkitLanguageProvider value={language}><MemoryRouter initialEntries={[`/${locale.id}/tools/${tool.id}/`]}><Routes><Route path={`/${locale.id}/tools/:toolId/`} element={<PdfToolPage/>}/></Routes></MemoryRouter></ToolkitLanguageProvider>);
    const node=document.createElement('div');node.innerHTML=html;
    expect(node.querySelector('.pdf-answer').textContent).toBe(strings[tool.answer]);
    expect(node.querySelector('.pdf-run').textContent).toBe(strings[tool.name]);
    expect(node.querySelector('.pdf-heading-icon svg').getAttribute('data-tool-icon')).toBe(tool.id);
    expect(node.querySelectorAll('.pdf-answers details')).toHaveLength(5);
    for(const input of node.querySelectorAll('input[type=number]'))expect(input.getAttribute('step')).toBe('any');
  }
});
test.each(locales)('$id: search and social metadata stay consistent across all tools',locale=>{
  const strings=require(`./translations/${locale.id}.json`).strings,language={locale,strings};const titles=new Set();
  for(const tool of tools){
    const seo=toolkitSEO(`/${locale.id}/tools/${tool.id}/`,language),meta=toolkitMetaValues(seo,locale);
    expect(titles.has(seo.title)).toBe(false);titles.add(seo.title);
    expect(meta.title).toBe(meta['og:title']);expect(meta.title).toBe(meta['twitter:title']);
    expect(meta['twitter:url']).toBe(seo.url);expect(meta['og:url']).toBe(seo.url);
    expect(seo.alternatives).toHaveLength(24);expect(seo.blocks.find(b=>b['@type']==='WebApplication').inLanguage).toBe(locale.language);
  }
});
test('Arabic browser controls keep MCP option keys and values stable',()=>{
  const registered=[],unregisterTool=jest.fn(),locale=locales.find(l=>l.id==='ar');
  Object.defineProperty(navigator,'modelContext',{configurable:true,value:{registerTool:tool=>registered.push(tool),unregisterTool}});
  const language={locale,strings:require('./translations/ar.json').strings},node=document.createElement('div'),root=createRoot(node);
  act(()=>root.render(<ToolkitLanguageProvider value={language}><MemoryRouter initialEntries={['/ar/tools/number-pdf-pages/']}><Routes><Route path="/ar/tools/:toolId/" element={<PdfToolPage/>}/></Routes></MemoryRouter></ToolkitLanguageProvider>));
  expect(registered.map(t=>t.name)).toEqual(['polypdf_list_files','polypdf_number_pdf_pages']);
  expect(registered[1].inputSchema.properties.options.properties.position.enum).toContain('bottom-left');
  const option=node.querySelector('option[value="bottom-left"]');expect(option.textContent).toBe(language.strings['bottom-left']);
  expect(option.getAttribute('value')).toBe('bottom-left');
  act(()=>root.unmount());delete navigator.modelContext;
  expect(unregisterTool).toHaveBeenCalledWith('polypdf_number_pdf_pages');
});
