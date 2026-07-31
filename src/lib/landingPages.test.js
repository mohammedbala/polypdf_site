import { landingPageRoutes } from './landingPages';
import routeMetadata from './route-metadata.json';

test('defines six substantial, uniquely attributed search landing pages', () => {
  expect(landingPageRoutes).toHaveLength(6);
  expect(new Set(landingPageRoutes.map(({ path }) => path)).size).toBe(6);
  expect(new Set(landingPageRoutes.map(({ source }) => source)).size).toBe(6);
  expect(new Set(landingPageRoutes.map(({ title }) => title)).size).toBe(6);

  landingPageRoutes.forEach((page) => {
    expect(routeMetadata[page.path]?.robots).toBe('index, follow');
    expect(page.source).toMatch(/^landing_[a-z0-9_]+$/);
    expect(page.title.length).toBeGreaterThan(35);
    expect(page.problemCopy.length).toBeGreaterThan(140);
    expect(page.workflow).toHaveLength(4);
    expect(page.outcomes.length).toBeGreaterThanOrEqual(5);
    expect(page.faq).toHaveLength(3);
    expect(page.related).toHaveLength(3);
    expect(['visual-search', 'takeoff-export', 'revision-comparison']).toContain(page.mediaSlug);
  });
});
