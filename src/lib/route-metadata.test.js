import routeMetadata from './route-metadata.json';
import { blogPosts, blogPostPath } from './blogPosts';
import { normalizeRoutePath } from '../components/RouteMetadata';

const expectedRoutes = [
  '/',
  '/buy',
  '/account',
  '/blog',
  ...blogPosts.map((entry) => blogPostPath(entry.slug)),
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

// A post with no route entry would render fine in the SPA and ship with the wrong <title> and
// description in the server-readable HTML, which is exactly the failure nobody notices.
test('gives every blog post its own crawlable metadata, matching the post', () => {
  blogPosts.forEach((entry) => {
    const route = routeMetadata[blogPostPath(entry.slug)];
    expect(route).toBeDefined();
    expect(route.title).toBe(entry.metaTitle);
    expect(route.description).toBe(entry.metaDescription);
    expect(entry.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(entry.excerpt.length).toBeGreaterThan(50);
    expect(entry.sections.length).toBeGreaterThan(0);
  });

  expect(new Set(blogPosts.map((entry) => entry.slug)).size).toBe(blogPosts.length);
});

test('normalizes the trailing slash added by the production web server', () => {
  expect(normalizeRoutePath('/')).toBe('/');
  expect(normalizeRoutePath('/bluebeam-alternative-mac')).toBe('/bluebeam-alternative-mac');
  expect(normalizeRoutePath('/bluebeam-alternative-mac/')).toBe('/bluebeam-alternative-mac');
});
