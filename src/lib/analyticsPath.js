import locales from './locales.json';
import toolkitLocales from '../toolkit/locales.json';
import catalog from '../toolkit/catalog.json';
import englishOnlyRoutes from './englishOnlyRoutes.json';
import routeMetadata from './route-metadata.json';

const toolkitRoutes = new Set(['/tools', '/tools/automation', ...catalog.map(tool => '/tools/' + tool.id)]);
// Only report routes that are actually published in the requested language.
export function canonicalAnalyticsPath(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || /[?#]/.test(value)) return '/404/';
  const path = value.replace(/\/+$/, '') || '/';
  if (routeMetadata[path]) return path === '/' ? '/' : path + '/';
  const toolkitLocale = toolkitLocales.find(locale => path.startsWith('/' + locale.id + '/'));
  if (toolkitLocale && toolkitRoutes.has(path.slice(toolkitLocale.id.length + 1))) return path + '/';
  const locale = locales.find(entry => path === '/' + entry.id || path.startsWith('/' + entry.id + '/'));
  const source = locale ? path.slice(locale.id.length + 1) || '/' : '';
  return locale && routeMetadata[source] && !englishOnlyRoutes.includes(source)
    ? path + '/' : '/404/';
}
