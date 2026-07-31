import routeMetadata from './route-metadata.json';
import { normalizeRoutePath } from '../components/RouteMetadata';

const expectedRoutes = [
  '/',
  '/buy',
  '/account',
  '/privacy',
  '/refund',
  '/support',
  '/windows',
  '/terms',
  '/versions',
  '/bluebeam-alternative-mac',
  '/pdf-takeoff-software',
  '/measure-pdf-on-mac',
  '/construction-pdf-markup',
  '/visual-search-pdf-count',
  '/compare-pdf-drawings'
];

test('defines unique, server-renderable metadata for every public route', () => {
  expect(Object.keys(routeMetadata).sort()).toEqual(expectedRoutes.sort());
  expect(new Set(Object.values(routeMetadata).map(({ title }) => title)).size).toBe(expectedRoutes.length);

  Object.entries(routeMetadata).forEach(([route, entry]) => {
    expect(route.startsWith('/')).toBe(true);
    expect(entry.title.length).toBeGreaterThan(10);
    expect(entry.description.length).toBeGreaterThan(50);
    expect(['index, follow', 'noindex, nofollow']).toContain(entry.robots);
  });
  expect(routeMetadata['/account'].robots).toBe('noindex, nofollow');
});

test('normalizes the trailing slash added by the production web server', () => {
  expect(normalizeRoutePath('/')).toBe('/');
  expect(normalizeRoutePath('/bluebeam-alternative-mac')).toBe('/bluebeam-alternative-mac');
  expect(normalizeRoutePath('/bluebeam-alternative-mac/')).toBe('/bluebeam-alternative-mac');
});
