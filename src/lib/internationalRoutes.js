import metadata from './route-metadata.json';
import locales from './locales.json';
import englishOnly from './englishOnlyRoutes.json';

// Commerce, account, policies and live release feeds retain their English application.
// Every guide, blog post, workflow and evergreen help page is included automatically.
export const englishOnlyRoutes = englishOnly;
export const localizedRoutes = Object.keys(metadata).filter((route) => !englishOnlyRoutes.includes(route) && !metadata[route].robots.includes('noindex'));
export const normalizePath = (pathname) => pathname.replace(/\/+$/, '') || '/';
export const languagePath = (locale, route) => `/${locale}${route === '/' ? '/' : `${normalizePath(route)}/`}`;
export const languageAlternates = (pathname) => {
  const route = normalizePath(pathname);
  if (!localizedRoutes.includes(route)) return [];
  const english = route === '/' ? '/' : `${route}/`;
  return [{ language: 'en', path: english }, ...locales.map((locale) => ({ language: locale.language, path: languagePath(locale.id, route) })), { language: 'x-default', path: english }];
};
