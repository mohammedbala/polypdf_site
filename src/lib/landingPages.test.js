import { landingPageRoutes } from './landingPages';
import routeMetadata from './route-metadata.json';

test('defines five substantial, uniquely attributed search landing pages', () => {
  expect(landingPageRoutes).toHaveLength(5);
  expect(new Set(landingPageRoutes.map(({ path }) => path)).size).toBe(5);
  expect(new Set(landingPageRoutes.map(({ source }) => source)).size).toBe(5);
  expect(new Set(landingPageRoutes.map(({ title }) => title)).size).toBe(5);

  landingPageRoutes.forEach((page) => {
    expect(routeMetadata[page.path]?.robots).toBe('index, follow');
    expect(page.source).toMatch(/^landing_[a-z0-9_]+$/);
    expect(page.title.length).toBeGreaterThan(35);
    expect(page.problemCopy.length).toBeGreaterThan(140);
    expect(page.workflow).toHaveLength(4);
    expect(page.outcomes.length).toBeGreaterThanOrEqual(5);
    expect(page.faq).toHaveLength(3);
    expect(page.related.length).toBeGreaterThanOrEqual(6);
    expect(['visual-search', 'takeoff-export', 'revision-comparison']).toContain(page.mediaSlug);

    // Related links are rendered as internal <Link>s. A path with no route entry would ship a
    // crawlable link to a page that redirects home — the exact drift a removed landing page
    // leaves behind if its inbound links are not repointed.
    const relatedPaths = page.related.map(([path]) => path);
    expect(new Set(relatedPaths).size).toBe(page.related.length);
    relatedPaths.forEach((path) => {
      expect(path).not.toBe(page.path);
      expect(routeMetadata[path]?.robots).toBe('index, follow');
    });
  });
});
