import React from 'react';
import { Link } from 'react-router';
import { OPEN_COOKIE_SETTINGS } from '../lib/consent';
import { useToolkitLanguage, localizeView, toolkitLocales, sourceRoute } from '../toolkit/language';
import { useLocation } from 'react-router';

export function ToolkitHeader() {
  const language = useToolkitLanguage();
  return localizeView(<header className="pdf-localized-nav"><nav className="pdf-shell" aria-label="Main navigation">
    <Link to="/tools/" className="pdf-wordmark"><span translate="no">PolyPDF</span> <span>Tools</span></Link>
    <div><Link to="/tools/">Tools</Link><Link to="/tools/automation/">AI & MCP</Link><a href="/#download" hrefLang="en">Desktop app (English)</a></div>
  </nav></header>, language);
}
export function ToolkitLanguages() {
  const language = useToolkitLanguage();
  const {pathname} = useLocation();
  const route = sourceRoute(pathname);
  return <div className="site-language-bar"><div className="container"><details className="language-selector" onKeyDown={e => { if(e.key === 'Escape') { e.currentTarget.open = false; e.currentTarget.querySelector('summary').focus(); } }}>
    <summary>{language.t('Languages')} · {language.locale.label}</summary>
    <nav className="language-options" aria-label={language.t('Choose a language')}>
      <a href={route+'/'} hrefLang="en" lang="en">English</a>
      {toolkitLocales.map(locale => <a key={locale.id} href={`/${locale.id}${route}/`} hrefLang={locale.language} lang={locale.language} dir={locale.dir || 'ltr'} aria-current={locale.id === language.locale.id ? 'page' : undefined}>{locale.label}</a>)}
    </nav>
  </details></div></div>;
}
export function ToolkitFooter() {
  const language = useToolkitLanguage();
  return localizeView(<footer className="pdf-localized-footer" data-site-footer>
    <div className="pdf-shell"><p><strong translate="no">PolyPDF</strong> · 36 free browser PDF tools</p>
    <p>Files stay on your device. No account required.</p>
    <nav aria-label="Footer"><Link to="/tools/">All PDF tools</Link><Link to="/tools/automation/">AI & MCP setup</Link><a href="/privacy/" hrefLang="en">Privacy (English)</a><a href="/terms/" hrefLang="en">Terms (English)</a><button onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS))}>Cookie settings</button></nav>
    <p>Translations cover the browser tools. Desktop software, checkout, policies, examples, and PDF field names may be in English. Your document content is never translated.</p>
    <p>© {new Date().getFullYear()} <span translate="no">Euclidean Software LLC</span></p></div>
  </footer>, language);
}
