import React from 'react';
import './LanguageSelector.css';
import { useLocation } from 'react-router';
import locales from '../lib/locales.json';
import { languagePath, localizedRoutes, normalizePath } from '../lib/internationalRoutes';

export default function LanguageSelector() {
  const { pathname } = useLocation();
  const source = normalizePath(pathname);
  const route = localizedRoutes.includes(source) ? source : '/';
  return (
    <details className="language-selector">
      <summary>Languages · English</summary>
      <nav aria-label="Choose a language" className="language-options">
        <a href={route === '/' ? '/' : `${route}/`} hrefLang="en" lang="en" aria-current="page">English</a>
        {locales.map((locale) => <a key={locale.id} href={languagePath(locale.id, route)} hrefLang={locale.language} lang={locale.language} dir={locale.dir || 'ltr'}>{locale.label}</a>)}
      </nav>
    </details>
  );
}
