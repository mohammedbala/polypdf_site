import React, { useEffect, useMemo } from 'react';
import { Routes, Route, useLocation } from 'react-router';
import CookieConsent from './CookieConsent';
import RouteNavigation from './RouteNavigation';
import { PdfToolsHub, PdfToolPage, PdfAutomationPage } from './PdfTools';
import { ToolkitLanguages, ToolkitFooter } from './ToolkitChrome';
import { ToolkitLanguageProvider, translateText, localizeView, sourceRoute, toolkitRoutes } from '../toolkit/language';
import { toolkitSEO, toolkitMetaValues } from '../toolkit/seo';

function Metadata({language}) {
  const {pathname} = useLocation();
  useEffect(() => {
    if(!toolkitRoutes.includes(sourceRoute(pathname))) return;
    const seo = toolkitSEO(pathname, language);
    document.documentElement.lang = language.locale.language;
    document.documentElement.dir = language.locale.dir || 'ltr';
    document.title = seo.title;
    for(const [key,value] of Object.entries(toolkitMetaValues(seo,language.locale))) {
      const el = document.head.querySelector(`meta[${key.includes(':') && !key.startsWith('twitter:') ? 'property' : 'name'}="${key}"]`);
      el?.setAttribute('content',value);
    }
    document.querySelector('link[rel="canonical"]')?.setAttribute('href',seo.url);
    document.head.querySelectorAll('link[hreflang],script[type="application/ld+json"]').forEach(el => el.remove());
    for(const alt of seo.alternatives) { const el=document.createElement('link');el.rel='alternate';el.hreflang=alt.language;el.href=alt.href;document.head.appendChild(el); }
    for(const block of seo.blocks) { const el=document.createElement('script');el.type='application/ld+json';el.textContent=JSON.stringify(block).replace(/</g,'\\u003c');document.head.appendChild(el); }
  },[pathname,language]);
  return null;
}
export default function ToolkitApp({locale,strings,collect,missing}) {
  const language = useMemo(() => {
    const value={locale,strings,collect,missing};value.t=text=>translateText(text,value);return value;
  },[locale,strings,collect,missing]);
  return <ToolkitLanguageProvider value={language}>
    <div className="App pdf-toolkit-localized" lang={locale.language} dir={locale.dir || 'ltr'}>
      <Metadata language={language}/><RouteNavigation/><CookieConsent/>
      {localizeView(<nav aria-label="Skip to content"><a className="site-skip-link" href="#site-content">Skip to content</a></nav>, language)}
      <ToolkitLanguages/>
      <div id="site-content" tabIndex={-1}>
        <Routes>
          <Route path={`/${locale.id}/tools`} element={<PdfToolsHub/>}/>
          <Route path={`/${locale.id}/tools/automation`} element={<PdfAutomationPage/>}/>
          <Route path={`/${locale.id}/tools/:toolId`} element={<PdfToolPage/>}/>
        </Routes>
      </div>
      <ToolkitFooter/>
    </div>
  </ToolkitLanguageProvider>;
}
