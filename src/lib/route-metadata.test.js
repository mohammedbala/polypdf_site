import routeMetadata from './route-metadata.json';
import { blogPosts, blogPostPath } from './blogPosts';
import { normalizeRoutePath, resolveRouteMetadata } from '../components/RouteMetadata';
import siteRelease from './siteRelease.json';

const expectedRoutes = [
  '/',
  '/buy',
  '/upgrade',
  '/build-a-plugin',
  '/account',
  '/blog',
  ...blogPosts.map((entry) => blogPostPath(entry.slug)),
  '/privacy',
  '/refund',
  '/feature-requests',
  '/support',
  '/windows',
  '/terms',
  '/versions',
  '/revision-packages',
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
    // Search snippets truncate around 60/155 characters; keep titles and descriptions whole.
    expect(entry.title.length).toBeLessThanOrEqual(60);
    expect(entry.description.length).toBeGreaterThan(50);
    expect(entry.description.length).toBeLessThanOrEqual(155);
    expect(['index, follow', 'noindex, follow', 'noindex, nofollow']).toContain(entry.robots);
  });
  expect(routeMetadata['/account'].robots).toBe('noindex, nofollow');
  // /upgrade is /buy rewritten for someone who already has the app open, so it must never be
  // indexed alongside it — two URLs competing on the same terms is how a page loses to itself.
  // `follow` rather than `nofollow`: there is no reason to devalue the links it carries.
  expect(routeMetadata['/upgrade'].robots).toBe('noindex, follow');
});

// A post with no route entry would render fine in the SPA and ship with the wrong <title> and
// description in the server-readable HTML, which is exactly the failure nobody notices.
test('gives every blog post its own crawlable metadata, matching the post', () => {
  blogPosts.forEach((entry) => {
    const route = routeMetadata[blogPostPath(entry.slug)];
    expect(route).toBeDefined();
    expect(route.title).toBe(entry.metaTitle);
    expect(route.description).toBe(entry.metaDescription);
    expect(route.type).toBe('article');
    expect(route.imageAlt).toBe(entry.heroImage.alt);
    expect(entry.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(entry.excerpt.length).toBeGreaterThan(50);
    expect(entry.sections.length).toBeGreaterThan(0);
  });

  expect(new Set(blogPosts.map((entry) => entry.slug)).size).toBe(blogPosts.length);
});

test('uses each real post screenshot for article share cards', () => {
  blogPosts.forEach((entry) => {
    const route = routeMetadata[blogPostPath(entry.slug)];
    expect(route.image).toBe(`/guides/${entry.slug}.png?v=${siteRelease.screenshotCacheToken}`);
    expect(route.imageAlt).toBe(entry.heroImage.alt);
    expect(route.imageWidth).toBe(entry.heroImage.width);
    expect(route.imageHeight).toBe(entry.heroImage.height);
  });
});

test('normalizes the trailing slash added by the production web server', () => {
  expect(normalizeRoutePath('/')).toBe('/');
  expect(normalizeRoutePath('/pdf-takeoff-software')).toBe('/pdf-takeoff-software');
  expect(normalizeRoutePath('/pdf-takeoff-software/')).toBe('/pdf-takeoff-software');
});

test('unknown URLs receive a truthful noindex 404 identity instead of home-page metadata', () => {
  expect(resolveRouteMetadata('/missing-page')).toEqual({
    route: {
      title: 'Page Not Found | PolyPDF',
      description: 'The PolyPDF page you requested could not be found.',
      robots: 'noindex, nofollow'
    },
    url: 'https://www.polypdf.com/missing-page/'
  });
});

test('separates the current app release from the verified screenshot release', () => {
  expect(siteRelease).toMatchObject({
    version: '1.5.0',
    build: '22',
    releaseDate: '2026-09-03',
    screenshotVersion: '1.4.3',
    screenshotBuild: '20',
    screenshotCacheToken: '1.4.3-20'
  });
  const releaseSeries = siteRelease.version.split('.').slice(0, 2).join('.');
  expect(routeMetadata['/windows'].description).toContain(`PolyPDF ${releaseSeries}`);
  expect(routeMetadata['/versions'].description).toContain(`PolyPDF ${releaseSeries}`);
});
