import { landingPages, landingPageRoutes } from './landingPages';
import routeMetadata from './route-metadata.json';

test('defines six substantial, uniquely attributed workflow landing pages', () => {
  expect(landingPageRoutes).toHaveLength(6);
  expect(new Set(landingPageRoutes.map(({ path }) => path)).size).toBe(6);
  expect(new Set(landingPageRoutes.map(({ source }) => source)).size).toBe(6);
  expect(new Set(landingPageRoutes.map(({ title }) => title)).size).toBe(6);

  landingPageRoutes.forEach((page) => {
    expect(routeMetadata[page.path]?.robots).toBe('index, follow');
    expect(page.source).toMatch(/^landing_[a-z0-9_]+$/);
    expect(page.title.length).toBeGreaterThan(35);
    expect(page.problemCopy.length).toBeGreaterThan(140);
    expect(page.workflow.length).toBeGreaterThanOrEqual(4);
    expect(page.workflow.length).toBeLessThanOrEqual(5);
    expect(page.outcomes.length).toBeGreaterThanOrEqual(5);
    expect(page.faq.length).toBeGreaterThanOrEqual(3);
    expect(page.faq.length).toBeLessThanOrEqual(5);
    expect(page.related.length).toBeGreaterThanOrEqual(6);
    expect(page).not.toHaveProperty('mediaSlug');
    expect(page.imageWidth).toBeGreaterThanOrEqual(1200);
    expect(page.imageHeight).toBeGreaterThanOrEqual(700);
    expect(page.imageAlt).not.toMatch(/Q-101|split drawing view|numbered count markers/i);

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

test('serves the Revision Package product capture responsively', () => {
  const page = landingPages.revisionPackages;
  expect(page.image).toMatch(/768\.webp$/);
  expect(page.imageSrcSet).toContain('768w');
  expect(page.imageSrcSet).toContain('1536w');
  expect(page.imageSizes).toContain('100vw');
});
