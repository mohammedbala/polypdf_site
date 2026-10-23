import metadata from './route-metadata.json';
import locales from './locales.json';
import englishOnly from './englishOnlyRoutes.json';
import toolkitLocales from '../toolkit/locales.json';
import toolkitCatalog from '../toolkit/catalog.json';

// Static translated guides and the interactive browser toolkit use separate renderers.
// The toolkit publishes 22 translated applications; guides retain their existing eight locales.
export const englishOnlyRoutes = englishOnly;
const toolkitPaths = ['/tools', '/tools/automation', ...toolkitCatalog.map(t => '/tools/' + t.id)];
export const localizedRoutes = Object.keys(metadata).filter((route) => !englishOnlyRoutes.includes(route) && !toolkitPaths.includes(route) && !metadata[route].robots.includes('noindex'));
export const normalizePath = (pathname) => pathname.replace(/\/+$/, '') || '/';
export const languagePath = (locale, route) => `/${locale}${route === '/' ? '/' : `${normalizePath(route)}/`}`;
export const languageAlternates = (pathname) => {
  const route = normalizePath(pathname);
  if (toolkitPaths.includes(route)) {
    const english = route + '/';
    return [{language:'en',path:english}, ...toolkitLocales.map(l => ({language:l.language,path:languagePath(l.id,route)})), {language:'x-default',path:english}];
  }
  if (!localizedRoutes.includes(route)) return [];
  const english = route === '/' ? '/' : `${route}/`;
  return [{ language: 'en', path: english }, ...locales.map((locale) => ({ language: locale.language, path: languagePath(locale.id, route) })), { language: 'x-default', path: english }];
};
